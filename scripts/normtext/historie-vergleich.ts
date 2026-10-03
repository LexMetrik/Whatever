// ─── Historie-Vergleich und Randtitel-Muster-Zählung (Werkzeug, Nachzug 2 GP #1298, 3.10.2026) ──
//
// Ersetzt die früheren Wegwerf-Skripte `.gate/*.mjs` (gitignored, nicht reproduzierbar) durch EIN wiederverwendbares
// Kommando. Rein lesend (keine Schreibzugriffe); §2-deterministisch (gleicher Git-Stand ⇒ gleiche Ausgabe).
//
//   npm run historie:vergleich -- [--basis <git-ref>] [--kopf <git-ref>] [--erlass <KEY>] [--liste]
//       Vergleicht «Gilt seit» je Artikel der committeten Shards `public/normtext/historie/*.json` am Git-Ref `--basis`
//       (Default `origin/main`) mit `--kopf` (Git-Ref; Default: Arbeitsstand): Anzahl geänderter Artikel, davon → null / → älter / → neuer; `--liste` nennt
//       jeden Artikel (Erlass Token: alt → neu); `--erlass` beschränkt auf einen Erlass (z. B. ZGB).
//   npm run historie:vergleich -- --muster
//       Zählt die Erkennung der Randtitel-Ausdruck-Ausnahme (`ausdruckFussnote`, historie-randtitel.ts) in den
//       Struktur-Sidecars `public/normtext/struktur/bund/*.json`: alle Fussnoten / an einer Überschrift / an einem Randtitel
//       mit Gliederungszeichen; dazu den Zusatz «Diese Änd. …» an solchen Randtiteln und die Fussnoten, die ihn OHNE
//       «Ausdruck gemäss»-Anfang tragen (Tripwire, Soll 0 — sonst fehlt der Ausnahme ein Erkennungsmuster).
//
// Beispiel: `npm run historie:vergleich -- --erlass ZGB --liste` (Vorher/Nachher der ZGB-Artikel gegen origin/main).

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ausdruckFussnote, randtitelMitAufzaehler } from '../../src/lib/normtext/historie-randtitel.ts';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const HISTORIE = 'public/normtext/historie';
const STRUKTUR = resolve(wurzel, 'public/normtext/struktur/bund');

type Gilt = Record<string, string | null>;

const git = (...args: string[]): string => execFileSync('git', args, { cwd: wurzel, encoding: 'utf8', maxBuffer: 1 << 28 });
const giltSeitVon = (json: string): Gilt =>
  Object.fromEntries(Object.entries((JSON.parse(json) as { artikel: Record<string, { giltSeit?: string | null }> }).artikel).map(([t, a]) => [t, a.giltSeit ?? null]));

function vergleich(basis: string, kopf: string | undefined, nurErlass: string | undefined, liste: boolean): void {
  const imRef = (ref: string): string[] => git('ls-tree', '-r', '--name-only', ref, HISTORIE).split('\n').filter((p) => p.endsWith('.json'));
  const dateien = imRef(basis);
  const heute = kopf ? imRef(kopf) : readdirSync(resolve(wurzel, HISTORIE)).filter((f) => f.endsWith('.json')).map((f) => `${HISTORIE}/${f}`);
  const alle = [...new Set([...dateien, ...heute])].sort();
  const z = { artikel: 0, geaendert: 0, null: 0, aelter: 0, neuer: 0 };
  const zeilen: string[] = [];
  for (const pfad of alle) {
    const erlass = pfad.slice(HISTORIE.length + 1, -5);
    if (nurErlass && erlass !== nurErlass) continue;
    const alt = dateien.includes(pfad) ? giltSeitVon(git('show', `${basis}:${pfad}`)) : {};
    const neu = heute.includes(pfad) ? giltSeitVon(kopf ? git('show', `${kopf}:${pfad}`) : readFileSync(resolve(wurzel, pfad), 'utf8')) : {};
    for (const token of new Set([...Object.keys(alt), ...Object.keys(neu)])) {
      z.artikel++;
      const a = alt[token] ?? null;
      const n = neu[token] ?? null;
      if (a === n) continue;
      z.geaendert++;
      if (n === null) z.null++;
      else if (a !== null && n < a) z.aelter++;
      else z.neuer++;
      zeilen.push(`${erlass} ${token}: ${a ?? 'null'} → ${n ?? 'null'}`);
    }
  }
  if (liste) console.log(zeilen.join('\n'));
  console.log(`Basis ${basis} ↔ ${kopf ?? 'Arbeitsstand'}${nurErlass ? ` · Erlass ${nurErlass}` : ''}: ${z.artikel} Artikel verglichen, «Gilt seit» geändert bei ${z.geaendert} (→ null ${z.null}, → älter ${z.aelter}, → neuer/neu ${z.neuer})`);
}

function muster(): void {
  const ZUSAETZE = ['Diese Änd. wurde in den in der AS genannten Bestimmungen vorgenommen', 'Diese Änd. ist im ganzen Erlass berücksichtigt'];
  const z = { fussnoten: 0, ausdruck: 0, ausdruckUeberschrift: 0, ausdruckRandtitel: 0, zusatz: ZUSAETZE.map(() => 0), zusatzAlle: 0, zusatzOhneAusdruck: [] as string[] };
  for (const datei of readdirSync(STRUKTUR).filter((f) => f.endsWith('.json'))) {
    const sidecar = JSON.parse(readFileSync(resolve(STRUKTUR, datei), 'utf8')) as { artikel?: Record<string, { fussnoten?: Array<{ text?: string; sektion?: string | null }> }> };
    for (const [token, a] of Object.entries(sidecar.artikel ?? {})) {
      for (const fn of a.fussnoten ?? []) {
        z.fussnoten++;
        const text = (fn.text ?? '').replace(/<[^>]+>/g, '').trim();
        const amRandtitel = !!fn.sektion && randtitelMitAufzaehler(fn.sektion);
        const ausdruck = ausdruckFussnote(fn);
        if (ausdruck) {
          z.ausdruck++;
          if (fn.sektion) z.ausdruckUeberschrift++;
          if (amRandtitel) z.ausdruckRandtitel++;
        }
        if (!amRandtitel) continue;
        ZUSAETZE.forEach((w, i) => { if (text.includes(w)) z.zusatz[i]++; });
        if (/(?:Diese|Die) Änd\./.test(text)) z.zusatzAlle++;
        if (!ausdruck && /(?:Diese|Die) Änd\./.test(text)) z.zusatzOhneAusdruck.push(`${datei.slice(0, -5)} ${token} «${fn.sektion}»: ${text.slice(0, 90)}`);
      }
    }
  }
  console.log(`Fussnoten gesamt: ${z.fussnoten}`);
  console.log(`Muster «Ausdruck gemäss» (ausdruckFussnote): alle ${z.ausdruck} · an Überschrift ${z.ausdruckUeberschrift} · an Randtitel mit Gliederungszeichen ${z.ausdruckRandtitel}`);
  ZUSAETZE.forEach((w, i) => console.log(`Zusatz «${w}» an Randtitel mit Gliederungszeichen: ${z.zusatz[i]}`));
  console.log(`«Diese/Die Änd.»-Zusatz an Randtitel mit Gliederungszeichen, beliebiger Wortlaut: ${z.zusatzAlle}`);
  console.log(`Tripwire — «Diese Änd.» an Randtitel mit Gliederungszeichen OHNE «Ausdruck gemäss»-Anfang (Soll 0): ${z.zusatzOhneAusdruck.length}${z.zusatzOhneAusdruck.length ? '\n' + z.zusatzOhneAusdruck.join('\n') : ''}`);
}

const arg = process.argv.slice(2).filter((a) => a !== '--');
const wert = (name: string): string | undefined => {
  const i = arg.indexOf(name);
  return i >= 0 ? arg[i + 1] : undefined;
};
if (arg.includes('--muster')) muster();
else vergleich(wert('--basis') ?? 'origin/main', wert('--kopf'), wert('--erlass'), arg.includes('--liste'));
