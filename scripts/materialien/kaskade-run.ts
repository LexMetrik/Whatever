// scripts/materialien/kaskade-run.ts — die Materialien-Generator-Kaskade als EIN Kommando
// (Befund (g), QS-MONITOR-ROT, 1.9.2026; erweitert 19.9.2026 um die Entstehungs-/
// Deckungs-Projektionen, §17-Wurzelfix — Rot-Beleg unten).
//
// WARUM: Nach jedem Materialien-Nachzug müssen abgeleitete Artefakte in fester Reihenfolge
// nachgezogen werden — wer sie einzeln entdeckt, zahlt je ein CI-Rot (14.8.2026: zwei Rotläufe
// auf #499; 30.8.: von Hand in #581; 18.9.2026: Lauf 35373415150, Curia-Job — dieselbe
// Fehlerklasse, andere Stelle: die Entstehungs-/Deckungs-Projektionen fehlten HIER genauso).
// Reihenfolge = §5-Kaskade: Projektion (Register + Kanten aus der Soft-Law-DB) →
// Revisions-Sidecars (Netz, Fedlex) → Churn-Reset (nur Datums-Felder, VOR den
// Entstehungs-/Deckungs-Projektionen: deren Stände sind aus den bewegten Quellen
// ABGELEITET, nie Date.now — ein Churn-Reset NACH ihnen würde eine echte
// Quellbewegung mit Zufalls-Jitter verwechseln, §2) → die gemeinsame
// Projektions-Teilkaskade `entstehung:projektion-kaskade` (Entstehungs-Projektion →
// Deckungs-Sicht → Zähler → Manifest, Begründung dort — §5: EINE Glieder-Liste, nicht
// hier UND in den Workflow-Jobs). Bricht beim ersten roten Glied ab (Exit-Code des
// Glieds), damit kein Folge-Artefakt aus einem kaputten Vorgänger entsteht.
//
// NEBENEFFEKT DIESER REIHENFOLGE (§17, QS-MONITOR-ROT-Nachzug, 19.9.2026): `gen:zaehler`
// (Glied 3 von `entstehung:projektion-kaskade`) läuft dadurch jetzt NACH
// `normtext:churn-reset` statt davor — und behebt damit ein latentes `check:zaehler`-Rot:
// `standMaterialien` in `src/data/startseiteZaehler.generated.ts` ist `register.json#erzeugt`;
// lief `gen:zaehler` VOR dem Churn-Reset, blieb dessen Datums-Bump im generierten Modul
// stehen, während der Churn-Reset denselben Wert im Register gleich wieder zurücknahm —
// die beiden Artefakte liefen auseinander, ohne dass sich fachlich etwas geändert hätte.
//
// Aufruf: npm run materialien:kaskade -- --datum=$(date +%F) [--ohne-revisionen] (§2: Datum aus der Shell)
//
// `--ohne-revisionen` (Materialien-Nachzug-Bot, MONITOR 6.10.2026, scripts/materialien/nachzug.ts):
// lässt NUR das Glied `normtext:revisionen` aus. Grund: dessen Eingaben sind Fedlex-SPARQL
// (Netz), ERLASS_REGISTER, BOTSCHAFTEN und die fedlex-cache.sh-Pins (revisionen-generieren.ts
// Z.75-77, -run.ts) — die Soft-Law-Quellen (SECO/EDÖB/ESTV) gehen nicht ein. Ein Soft-Law-
// Nachzug bewegt die Revisions-Sidecars also nie; fährt er das Glied trotzdem, zieht er
// sachfremde Fedlex-Bewegungen in einen Materialien-PR (Risikoklassen gemischt) und kollidiert
// mit dem Reparatur-Arm fedlex-frische.yml, der genau diese Sidecars täglich nachführt. Die
// Glieder-Liste bleibt EINE (§5) — der Schalter filtert sie, statt eine zweite Liste zu führen.
// Die Folge-Glieder lesen dann die committeten Sidecars (gleiche Lage wie in den Curia-/BS-Jobs
// von normen-monatslauf.yml, die die Teilkaskade ohne Revisionen fahren).

import { spawnSync } from 'node:child_process';

const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const datum = datumArg?.slice('--datum='.length);
if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
  console.error('materialien:kaskade: --datum=YYYY-MM-DD erforderlich (§2, kein Date.now).');
  process.exit(1);
}

const ohneRevisionen = process.argv.includes('--ohne-revisionen');

const GLIEDER: string[][] = [
  ['materialien', '--', `--datum=${datum}`],
  ['normtext:revisionen', '--', `--datum=${datum}`],
  ['normtext:churn-reset', '--', '--pfad=public/normtext,public/materialien'],
  ['entstehung:projektion-kaskade'],
].filter(([name]) => !(ohneRevisionen && name === 'normtext:revisionen'));

for (const [name, ...rest] of GLIEDER) {
  console.log(`\n══ materialien:kaskade → npm run ${name} ${rest.filter((r) => r !== '--').join(' ')} ══`);
  const r = spawnSync('npm', ['run', name, ...rest], { stdio: 'inherit', env: process.env });
  if ((r.status ?? 1) !== 0) {
    console.error(`\nmaterialien:kaskade ROT bei «${name}» (exit ${r.status ?? 1}) — Folge-Glieder NICHT gefahren.`);
    process.exit(r.status ?? 1);
  }
}
console.log(`\nmaterialien:kaskade fertig — ${GLIEDER.length} Glieder grün (datum=${datum}${ohneRevisionen ? ', ohne normtext:revisionen' : ''}).`);
