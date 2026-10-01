/**
 * Testbindung von scripts/fedlex-cache.sh (W2·27-BUND-FERTIG P1, Posten «curl -m» + «.pin-Marker»).
 *
 * ANLASS. (1) Der Direktaufruf `bash scripts/fedlex-cache.sh` (= `npm run check:caches`) lud alle
 * 231 Caches, schrieb aber keine `/tmp/<name>.html.pin`-Marker — die setzte nur `sicherstelleCaches`;
 * danach meldeten check:p-klassen/check:vollstaendigkeit «pin-ungültig» (Vorfall 24./25.9.2026, 30.9.2026).
 * (2) `curl` ohne `-m`: ein hängender Abruf blockierte den Lauf unbegrenzt.
 *
 * KEIN NETZ, KEIN /tmp. `curl` ist ein Stub im PATH (schreibt einen synthetischen Normtext mit allen
 * Pflicht-Ankern und SR-Nummern), das Cache-Verzeichnis ist ein eigenes Temp-Verzeichnis
 * (LEXMETRIK_FEDLEX_CACHE_DIR) — geteilte /tmp-Caches anderer Sessions bleiben unberührt (§12).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFedlexCacheEintraege } from '../../scripts/normtext/inventar-bund.ts';
import { pinIdentitaet } from '../../scripts/normtext/cache-pin-befund.ts';

const quelle = readFileSync('scripts/fedlex-cache.sh', 'utf8');
const eintraege = parseFedlexCacheEintraege(quelle);
// Datenzeilen «name|eli|kons|n|anker|sr» (der Parser oben liefert das optionale 6. Feld nicht).
const zeilenFelder = [...quelle.matchAll(/^\s*"([a-z0-9_]+\|[^"]+)"/gm)].map((m) => m[1].split('|'));
// Der Stub antwortet 404 für diesen Erlass (ELI-Pfad in der URL) — der Lauf muss ihn laut melden.
const AUSFALL = eintraege.find((e) => e.name === 'or')!;
// Der Stub meldet für diesen Erlass «200» + curl-Exit 28 (-m-Abbruch NACH den Headern) und liefert eine
// abgeschnittene, aber >20 kB grosse Datei mit allen Pflicht-Ankern (Befund Gegenprüfung PR #1247, 1.10.2026).
const ABBRUCH = eintraege.find((e) => e.name === 'zgb')!;

let wurzel: string;
let cacheDir: string;
let argLog: string;
// EIN Lauf in beforeAll (231 Erlasse ≈ 8 s) — die Tests lesen nur sein Ergebnis und sind damit
// reihenfolgeunabhängig (auch unter `-t`); argLog entsteht in demselben Lauf, nicht in einem Fremdtest.
let ergebnis: { status: number | null; out: string };

function lauf(): { status: number | null; out: string } {
  const r = spawnSync('bash', ['scripts/fedlex-cache.sh'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${join(wurzel, 'bin')}:${process.env.PATH}`,
      LEXMETRIK_FEDLEX_CACHE_DIR: cacheDir,
      STUB_AUSFALL: AUSFALL.eli,
      STUB_ABBRUCH: ABBRUCH.eli,
      STUB_ARGLOG: argLog,
    },
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, out: r.stdout + r.stderr };
}

beforeAll(() => {
  wurzel = mkdtempSync(join(tmpdir(), 'lexmetrik-fedlex-cache-sh-'));
  cacheDir = join(wurzel, 'cache');
  argLog = join(wurzel, 'curl-args.log');
  mkdirSync(join(wurzel, 'bin'));
  mkdirSync(cacheDir);
  // Synthetischer Normtext: alle Pflicht-Anker + alle SR-Nummern (die Sonden verlangen je Eintrag nur
  // Treffer), > 20 kB, ohne Shell-Marker.
  const anker = [...new Set(eintraege.flatMap((e) => e.anker))].map((a) => `<div id="${a}">x</div>`).join('\n');
  const srs = [...new Set(zeilenFelder.map((f) => f[5]).filter(Boolean))]
    .map((s) => `<p class="srnummer">${s}</p>`)
    .join('\n');
  writeFileSync(join(wurzel, 'inhalt.html'), `${anker}\n${srs}\n${'<p>Füllung</p>\n'.repeat(2000)}`);
  // Abgeschnittene Fassung: weiterhin > 20 kB, alle Anker/SR vorhanden — nur der curl-Exit verrät den Abbruch.
  writeFileSync(join(wurzel, 'teil.html'), `${anker}\n${srs}\n${'<p>Füllung</p>\n'.repeat(1500)}`);
  const stub = [
    '#!/usr/bin/env bash',
    'echo "$*" >> "$STUB_ARGLOG"',
    'out=""; url=""',
    'while [ $# -gt 0 ]; do',
    '  case "$1" in -o) out="$2"; shift 2;; -w|-m|--connect-timeout) shift 2;; -*) shift;; *) url="$1"; shift;; esac',
    'done',
    'case "$url" in *"/$STUB_AUSFALL/"*) : > "$out"; printf 404; exit 0;; esac',
    `case "$url" in *"/$STUB_ABBRUCH/"*) cp "${join(wurzel, 'teil.html')}" "$out"; printf 200; exit 28;; esac`,
    `cp "${join(wurzel, 'inhalt.html')}" "$out"; printf 200`,
  ].join('\n');
  writeFileSync(join(wurzel, 'bin', 'curl'), stub);
  chmodSync(join(wurzel, 'bin', 'curl'), 0o755);
  // Veralteter Marker des Ausfall-Erlasses darf nach einem fehlgeschlagenen Abruf nicht stehen bleiben.
  writeFileSync(join(cacheDir, `${AUSFALL.name}.html.pin`), 'alt|20200101|1', 'utf8');
  writeFileSync(join(cacheDir, `${ABBRUCH.name}.html.pin`), 'alt|20200101|1', 'utf8');
  ergebnis = lauf();
});

afterAll(() => rmSync(wurzel, { recursive: true, force: true }));

describe('fedlex-cache.sh — .pin-Marker und curl-Timeout', () => {
  it('schreibt je erfolgreichem Eintrag den Marker im Format pinIdentitaet; der Fehl-Eintrag bekommt keinen', () => {
    const r = ergebnis;
    expect(r.status).toBe(1); // Ausfall- und Abbruch-Eintrag werden laut gemeldet
    expect(r.out).toContain(`FEHLER  ${AUSFALL.name}`);
    for (const e of eintraege) {
      const pin = join(cacheDir, `${e.name}.html.pin`);
      if (e.name === AUSFALL.name || e.name === ABBRUCH.name) {
        expect(existsSync(pin), `${e.name}: Marker nach Fehlschlag`).toBe(false);
      } else {
        expect(readFileSync(pin, 'utf8'), e.name).toBe(pinIdentitaet(e.eli, e.konsolidierung, e.htmlN));
      }
    }
  });

  it('jeder curl-Aufruf trägt ein Gesamt-Timeout -m ≤ 120 s und ein Connect-Timeout', () => {
    const zeilen = readFileSync(argLog, 'utf8').split('\n').filter(Boolean);
    expect(zeilen.length).toBeGreaterThanOrEqual(eintraege.length);
    for (const z of zeilen) {
      const m = z.match(/(?:^|\s)-m\s+(\d+)(?:\s|$)/);
      expect(m, z).not.toBeNull();
      expect(Number(m![1])).toBeLessThanOrEqual(120);
      expect(z).toMatch(/--connect-timeout\s+\d+/);
    }
  });

  it('curl-Exit ≠ 0 trotz «200» (-m-Abbruch nach den Headern) ist FEHLER: kein OK, kein Marker, keine Teil-Datei', () => {
    expect(ergebnis.out).toMatch(new RegExp(`^FEHLER  ${ABBRUCH.name}: .*curl-Exit 28`, 'm'));
    expect(ergebnis.out).not.toContain(`OK      ${ABBRUCH.name} `);
    expect(existsSync(join(cacheDir, `${ABBRUCH.name}.html.pin`)), 'Marker nach Abbruch').toBe(false);
    expect(existsSync(join(cacheDir, `${ABBRUCH.name}.html`)), 'Teil-Datei nach Abbruch').toBe(false);
  });
});
