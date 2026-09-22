// R1/R4-Nachfolger (W2·5d G1) — «EINE Linien-Sprache» im Normtext-Reader,
// maschinell gegated.
//
// LINIEN-KANON: die strukturellen Normtext-Container (`data-normtext-linie`)
// nutzen ausschliesslich die benannten Linien-Rollen (`border-rule-artikel`/
// `-struktur`), kein Ad-hoc `border-line`; die Token-Kette lebt end-to-end
// (:root + html.dark + tailwind + reale Verwendung im Reader). Chrome-/Brass-
// Borders sind ausgenommen.
//
// ── LINIEN-RÜCKBAU V1 (16.8.2026) — Teil B GESTRICHEN ────────────────────────
// Das Tor trug bis heute einen zweiten Teil B: das AUFBAU-REGELWERK «wann zeigt
// der Reader den vertikalen Gliederungs-Guide» (Auto-Default aus Gliederungstiefe
// + Artikel-Dichte, korpusweite Invarianten über alle Sidecars, Referenz-Verdikte
// ZGB/OR/ArG/VMWG/BVV3/HKUE/SVG, Verdrahtungs-Sonden auf `data-guide-auto` und
// `linien.guideEbene`).
//
// David hat die Gliederungslinie am 13.8.2026 ganz verworfen — «ja linien ganz
// entfernen» (Variante V1, FAHRPLAN-GESETZESDARSTELLUNG-V2 §9.3 e), nachdem sie
// dreimal gebaut und dreimal live abgelehnt worden war (A8 5.7., A28 12.7.,
// PR #423 3.8.2026). Mit dem Guide entfällt der bewachte Sachverhalt vollständig:
// `autoGuide`/`guideEbene`/`dichteAmGuide` existieren nicht mehr, `data-guide-auto`
// und `data-linien` werden nirgends mehr gesetzt, `--guide-gliederung` ist aus dem
// Token-Satz entfernt. Teil B hätte damit nur noch Konstanten gegen sich selbst
// geprüft und könnte nicht mehr rot werden.
//
// §6.7 («ein Tor, das nicht scheitern kann, ist gefährlicher als keines») und
// §17-Rückbau («was nicht scheitern kann, wird gestrichen statt bewacht») führen
// hier zur STREICHUNG, nicht zum Umbau. Teil A bleibt unverändert scharf und ist
// weiterhin rot zu bekommen (Rot-Probe im Bau-PR belegt).
//
// Ein `border-line/70` an einem markierten Element oder ein toter Rollen-Token
// färbt das Tor ROT.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const wurzel = resolve(import.meta.dirname ?? '.', '..');
const lies = (p: string) => readFileSync(resolve(wurzel, p), 'utf8');
const fehler: string[] = [];

// QS-UI (5.9.2026, Nebenfund #663-Split, §6.7): der «toter Token»-Check unten
// las nur `ArtikelBody.tsx` — nach dem Split (PR #663) leben Teile des
// Normtext-Reader-Wortlauts auch in `ArtikelBody.zitier.tsx`/`.helfer.ts`;
// eine dort verwendete Kanon-Klasse hätte das Tor fälschlich als «tot»
// gemeldet. Glob statt fester Pfad: JEDE `ArtikelBody*.ts(x)` im Verzeichnis.
const ARTIKELBODY_DATEIEN = readdirSync(resolve(wurzel, 'src/components/normtext'))
  .filter((n) => /^ArtikelBody.*\.tsx?$/.test(n))
  .sort()
  .map((n) => `src/components/normtext/${n}`);

// Leer-Treffer-Schutz 5.9.2026 (Gegenprüfung #719, §6.7 lit. b)
if (!ARTIKELBODY_DATEIEN.length) {
  console.error('check:linien-kanon ROT — Glob ArtikelBody.* traf keine Datei (Ordner/Name geändert?)');
  process.exit(1);
}

// ─── Teil A · Linien-Kanon (marker-scoped) ───────────────────────────────────
// QS-TOK/P5: parts.tsx ist ein Barrel — die markierten Struktur-Elemente
// (data-normtext-linie) leben in den Geschwister-Dateien unter parts/. Alle
// Marker-Träger müssen gescannt werden, sonst prüft das Tor sie nicht mehr.
// `inhalt.tsx` (Ist-Hülle) gelöscht 21.8.2026 (H5) — aus der Liste entfernt;
// die markierten Struktur-Elemente leben in den geteilten `parts/`-Dateien,
// die V3 (wie zuvor V1) rendert.
const READER = [
  'src/pages/gesetz-leser/parts.tsx',
  'src/pages/gesetz-leser/parts/ArtikelLeser.tsx',
  'src/pages/gesetz-leser/parts/ErlassKopfBlock.tsx',
  'src/pages/gesetz-leser/parts/ErlassLeserKopf.tsx',
  'src/pages/gesetz-leser/parts/SektionKopf.tsx',
  'src/pages/gesetz-leser/parts/SektionBaumTOC.tsx',
];
const MARKER = 'data-normtext-linie';
const VERBOTEN = /border-line(\/\d+)?\b/;
const KANON = ['border-rule-artikel', 'border-rule-struktur'];

function oeffnendesTag(src: string, at: number): string {
  const start = src.lastIndexOf('<', at);
  let tiefe = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') tiefe++;
    else if (c === '}') tiefe--;
    else if (c === '>' && tiefe === 0) return src.slice(start, i + 1);
  }
  return src.slice(start);
}

let markierteGesamt = 0;
const kanonVerwendet = new Set<string>();
for (const datei of READER) {
  const src = lies(datei);
  let idx = src.indexOf(MARKER);
  while (idx !== -1) {
    markierteGesamt++;
    const tag = oeffnendesTag(src, idx);
    if (VERBOTEN.test(tag)) {
      const zeile = src.slice(0, idx).split('\n').length;
      fehler.push(`${datei}:${zeile} — markiertes Struktur-Element nutzt verbotenes \`border-line\`; erlaubt sind nur ${KANON.join(' / ')}.`);
    }
    for (const k of KANON) if (tag.includes(k)) kanonVerwendet.add(k);
    idx = src.indexOf(MARKER, idx + MARKER.length);
  }
}
if (markierteGesamt === 0) fehler.push(`Kein einziges \`${MARKER}\`-Element gefunden — der Linien-Kanon ist nicht verdrahtet.`);

const reaederQuell = READER.map(lies).join('\n') + '\n' + ARTIKELBODY_DATEIEN.map(lies).join('\n');
for (const k of KANON) {
  if (!kanonVerwendet.has(k) && !reaederQuell.includes(k)) {
    fehler.push(`Kanon-Klasse \`${k}\` wird im Normtext-Reader nirgends verwendet (toter Token, §13/F7).`);
  }
}

const css = lies('src/index.css');
/**
 * Schneidet den Rumpf einer Regel heraus — über PASSENDE Klammern, nicht über
 * die nächste Erwähnung des Nachbar-Selektors.
 *
 * §17-Wurzelfix (22.9.2026, W2·29-WERKBANK-TOKENS): hier stand
 * `css.slice(css.indexOf(':root'), css.indexOf('html.dark'))`. Das zweite
 * `indexOf` traf nicht die REGEL `html.dark {`, sondern die erste ERWÄHNUNG der
 * Zeichenfolge — und die steht seit je in einem :root-Kommentar («Dunkel-
 * brass-700 ist separat, s. html.dark»). Der «:root-Block» endete damit
 * mitten im Block; dass `--rule-artikel` darin lag, war Zufall der
 * Zeilenfolge. Beim Umbau auf die eine Token-Quelle verschob sich die Folge —
 * und das Tor meldete ein Fehlen, das es nie gab (§6.7: ein Tor, das aus dem
 * falschen Grund rot wird, ist so wertlos wie eines, das nicht rot werden kann).
 */
function regelRumpf(quelle: string, selektor: string): string {
  const start = quelle.indexOf(`${selektor} {`);
  if (start < 0) throw new Error(`check:linien-kanon: Regel «${selektor}» fehlt in src/index.css.`);
  let tiefe = 0;
  for (let i = quelle.indexOf('{', start); i < quelle.length; i++) {
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}' && --tiefe === 0) return quelle.slice(start, i);
  }
  throw new Error(`check:linien-kanon: Regel «${selektor}» ist nicht geschlossen.`);
}
const rootBlock = regelRumpf(css, ':root');
const darkBlock = regelRumpf(css, 'html.dark');
for (const v of ['--rule-artikel', '--rule-struktur']) {
  if (!rootBlock.includes(v)) fehler.push(`CSS-Variable \`${v}\` fehlt im :root (hell).`);
  if (!darkBlock.includes(v)) fehler.push(`CSS-Variable \`${v}\` fehlt in html.dark.`);
}
const tw = lies('tailwind.config.js');
for (const map of ['var(--rule-artikel)', 'var(--rule-struktur)']) {
  if (!tw.includes(map)) fehler.push(`tailwind.config.js bildet \`${map}\` nicht ab.`);
}

// ─── Verdikt ─────────────────────────────────────────────────────────────────
if (fehler.length > 0) {
  console.error('check:linien-kanon ROT — Linien-Sprache verletzt:\n');
  for (const f of fehler) console.error('  • ' + f);
  process.exit(1);
}
console.log(
  `check:linien-kanon GRÜN — ${markierteGesamt} markierte Container / ${KANON.length} Rollen-Tokens ` +
  `(hell + dunkel + tailwind + reale Verwendung), kein Ad-hoc \`border-line\`.`,
);
