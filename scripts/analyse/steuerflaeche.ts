// scripts/analyse/steuerflaeche.ts — CLI der Steuerungs-Flächen-Klinke.
//
//   npm run check:steuerflaeche          Tor: Summe ≤ Grenze + Sperrklinke
//   npm run steuerflaeche -- --stand     Summe · Grenze · Luft · Top 10
//   npm run steuerflaeche -- --nachziehen  Grenze auf Ist+5 % SENKEN (nie heben)
//   npm run steuerflaeche -- --basis <ref> Vergleichsstand ausdrücklich setzen
//
// Reine Hülle über `steuerflaecheKern.ts` — dieselbe Trennung wie
// posten.ts/postenKern.ts und aus demselben Schaden (20.9.2026): den Kern
// importieren `scripts/plan/next.ts` (Trendzeile) und
// `scripts/analyse/prozess-kennzahlen.ts` (CSV-Spalte). Läge der CLI-Block in
// derselben Datei, liefe er bei JEDEM dieser Importe mit.
import {
  GRENZ_DATEI, basisGrenze, basisRef, flaechenDateien, kb, leseGrenze, schreibeGrenze,
  summeBytes, urteil, zielGrenze, zuwaechse, type Datei,
} from './steuerflaecheKern';

const argv = process.argv.slice(2);
const dateienJetzt = flaechenDateien();
const ist = summeBytes(dateienJetzt);
const grenze = leseGrenze();

if (argv.includes('--stand')) {
  console.log(`Steuerungs-Fläche: ${kb(ist)} KB · Grenze ${kb(grenze.grenze_bytes)} KB · ` +
    `Luft ${kb(grenze.grenze_bytes - ist)} KB · ${dateienJetzt.length} Dateien`);
  console.log(`Mögliche Absenkung per --nachziehen: ${kb(zielGrenze(ist))} KB`);
  for (const d of [...dateienJetzt].sort((a, b) => b.bytes - a.bytes).slice(0, 10)) {
    console.log(`  ${kb(d.bytes).padStart(7)} KB  ${d.pfad}`);
  }
} else if (argv.includes('--nachziehen')) {
  const ziel = zielGrenze(ist);
  if (ziel >= grenze.grenze_bytes) {
    console.log(`Keine Absenkung: Ist+5 % = ${kb(ziel)} KB ≥ Grenze ${kb(grenze.grenze_bytes)} KB. ` +
      'Die Klinke hebt nie an.');
  } else {
    schreibeGrenze({ ...grenze, grenze_bytes: ziel });
    console.log(`Klinke nachgezogen: ${kb(grenze.grenze_bytes)} → ${kb(ziel)} KB ` +
      `(Ist ${kb(ist)} KB). ${GRENZ_DATEI} geschrieben.`);
  }
} else {
  const i = argv.indexOf('--basis');
  const wunsch = i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
  const ref = basisRef(wunsch);
  if (wunsch) console.log(`(Basis ausdrücklich gesetzt: ${wunsch} — Diagnose-/Rot-Beweis-Pfad.)`);
  const e = ref
    ? { ist, grenze, basis: basisGrenze(ref), zuwaechse: zuwaechse(ref, dateienJetzt) }
    : {
        ist, grenze, basis: null, zuwaechse: [] as Datei[],
        basisHinweis: 'kein Vergleichsstand (origin/main nicht auflösbar — flacher Klon?) — ' +
          'die SPERRKLINKE ist in diesem Lauf NICHT geprüft, nur die Summe.',
      };
  const { ok, zeilen } = urteil(e);
  for (const z of zeilen) console.log(z);
  if (!ok) process.exit(1);
}
