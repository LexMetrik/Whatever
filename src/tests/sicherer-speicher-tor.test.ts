// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// ─── TOR: KEIN DIREKTER BROWSERSPEICHER-ZUGRIFF AUSSERHALB DES HELFERS ───────
// (W2·17-UI-BEFUNDE BG-01, 2.10.2026; CLAUDE.md §5 — EINE Stelle.)
//
// Wurzel des weissen Bildschirms bei gesperrtem Speicher: schon das Lesen der
// Eigenschaft `window.localStorage` WIRFT. Verstreute try/catch-Kopien hatten
// je eine eigene Lücke (useSeitenleiste, lesePosition, zuletztVerwendet). Der
// einzige wurfsichere Zugriff ist `src/lib/sichererSpeicher.ts`; dieses Tor
// verbietet in `src/` (ohne Tests) jeden Identifier `localStorage` /
// `sessionStorage` im CODE — Kommentare, Strings und JSX-Text zählen nicht
// (AST statt Regex, sonst schlügen Doku-Zeilen an).
//
// ROT (§6.7): in irgendeiner Nicht-Test-Datei unter src/ eine Zeile
// `localStorage.getItem('x')` einfügen — dieses Tor nennt Datei:Zeile.

const WURZEL = fileURLToPath(new URL('../', import.meta.url)); // …/src/

/** Der Helfer selbst — die einzige Stelle, die den rohen Speicher berührt. */
const HELFER = 'lib/sichererSpeicher.ts';

/** Bekannte Ausnahmen (Pfad relativ zu src/): jede mit Grund und Rückbau-Auslöser. */
const AUSNAHMEN: Record<string, string> = {
  // Datei steht im Bau-Zeitraum in einem offenen PR (Reiter-/Split-Arbeit);
  // alle Zugriffe dort liegen bereits in try/catch (BG-01-Sonde: ladeTabs/
  // merkeTab/letzterGeschlossener werfen nicht). Nach Landung von PR #1275
  // auf lokalSpeicher umstellen und diesen Eintrag löschen.
  'lib/tabs.ts': 'nach PR #1275 umstellen',
};

function dateien(dir: string): string[] {
  const aus: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'tests') continue;
      aus.push(...dateien(p));
    } else if (/\.(ts|tsx)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) {
      aus.push(p);
    }
  }
  return aus;
}

function funde(quelle: string, name: string): number[] {
  const sf = ts.createSourceFile(name, quelle, ts.ScriptTarget.Latest, true, name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const zeilen: number[] = [];
  const besuche = (n: ts.Node) => {
    if (ts.isIdentifier(n) && (n.text === 'localStorage' || n.text === 'sessionStorage')) {
      zeilen.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1);
    }
    ts.forEachChild(n, besuche);
  };
  besuche(sf);
  return zeilen;
}

describe('Tor: Browserspeicher nur über lib/sichererSpeicher.ts', () => {
  it('Sonde erkennt Code-Zugriffe, ignoriert Kommentar/String/JSX-Text', () => {
    const q = [
      '// localStorage im Kommentar',
      "const a = 'localStorage';",
      'const b = <em>sessionStorage</em>;',
      "const c = window.localStorage.getItem('x');",
      "const d = typeof sessionStorage;",
    ].join('\n');
    expect(funde(q, 'x.tsx')).toEqual([4, 5]);
  });

  it('kein direkter localStorage-/sessionStorage-Zugriff ausserhalb des Helfers', () => {
    const verstoesse: string[] = [];
    for (const datei of dateien(WURZEL)) {
      const rel = relative(WURZEL, datei).split('\\').join('/');
      if (rel === HELFER || rel in AUSNAHMEN) continue;
      for (const z of funde(readFileSync(datei, 'utf8'), rel)) verstoesse.push(`src/${rel}:${z}`);
    }
    expect(verstoesse, 'Direkter Speicherzugriff — stattdessen lokalSpeicher/sitzungsSpeicher aus lib/sichererSpeicher.ts').toEqual([]);
  });

  it('Ausnahmeliste enthält nur Dateien, die den Zugriff wirklich noch haben', () => {
    for (const rel of Object.keys(AUSNAHMEN)) {
      const n = funde(readFileSync(join(WURZEL, rel), 'utf8'), rel).length;
      expect(n, `${rel} ist umgestellt — Ausnahme löschen`).toBeGreaterThan(0);
    }
  });
});
