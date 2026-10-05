// ─── Verfalls-Prüfer: macht das Parameter-Verfallsregister maschinell ───────
//
// Liest bibliothek/register/parameter-verfall.md (SSoT §5 — Termine werden
// NICHT hier dupliziert) und prüft jede Zeile der Register-Tabelle (Spalte
// «Nächste Prüfung») sowie «bis DD.MM.YYYY»-Termine in den Freitext-Blöcken
// gegen das heutige Datum.
//
//   npm run check:verfall            (vite-node scripts/verfall-pruefen.ts)
//
// Exit 1  → mindestens ein Termin ist VERFALLEN (Deploy-Hindernis nach der
//           Register-Konvention Ziff. 3: kein stiller Weiterbetrieb, §8).
// Exit 0  → kein Verfall; bald fällige Termine (≤ VORLAUF_TAGE) als WARNUNG.
//
// Datums-Grammatik der Spalte «Nächste Prüfung» (alles andere gilt als
// manueller Eintrag und wird nur gezählt, nie geprüft):
//   «1.11.2026 (BE!)»        → exakter Tag
//   «Anfang Sept. 2026»      → 1. des Monats
//   «Jan. 2027» / «Juni 2027»→ 1. des Monats
//   «—», «offen …», «bei …», «vor …», «mit …», «nach …» → manuell
//
// Hinweis Determinismus: §2 CLAUDE.md betrifft die RECHENLOGIK der Engines.
// Dieses Skript ist Betriebs-Werkzeug — der Tagesbezug ist hier der Zweck.
//
// Die Parse-Grammatik (Tabelle + «bis …»-Freitext) lebt in scripts/verfall-parse.ts
// und wird mit dem UI-Generator (gen:verfall) geteilt — eine Quelle, §5.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iso, sammleTermine, VORLAUF_TAGE } from './verfall-parse.ts';

// VORLAUF_TAGE (45) lebt in verfall-parse.ts (geteilt mit der Verfall-Erinnerung);
// bei Änderung die Anzeige-Schwelle in src/components/VerfallUebersicht.tsx
// gleich halten (bewusste Spiegelung, Anzeige ≠ Rechtsregel).

const REGISTER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../bibliothek/register/parameter-verfall.md',
);

// ─── Lauf ────────────────────────────────────────────────────────────────────
const md = readFileSync(REGISTER, 'utf8');
const { termine, manuell } = sammleTermine(md);

const jetzt = new Date();
const heute = iso(jetzt.getFullYear(), jetzt.getMonth() + 1, jetzt.getDate());
const vorlauf = new Date(jetzt.getTime() + VORLAUF_TAGE * 86_400_000);
const warnGrenze = iso(vorlauf.getFullYear(), vorlauf.getMonth() + 1, vorlauf.getDate());

const verfallen = termine.filter((t) => t.datum < heute);
const bald = termine.filter((t) => t.datum >= heute && t.datum <= warnGrenze);

console.log(`Verfallsregister: ${termine.length} terminierte Einträge geprüft, ${manuell.length} manuelle (Stand heute: ${heute})\n`);

// CLI-Kürzung der (langen) Freitext-Labels auf 70 Zeichen — die volle Fassung
// behält der Parser für die UI (gen:verfall).
const kurz = (t: { label: string; quelle: string }) =>
  t.quelle === 'Freitext' ? t.label.slice(0, 70) : t.label;
for (const t of verfallen) console.log(`VERFALLEN  ${t.datum}  ${kurz(t)}  [${t.quelle}]`);
for (const t of bald) console.log(`FÄLLIG     ${t.datum}  ${kurz(t)}  [${t.quelle}]`);
if (manuell.length > 0) {
  console.log(`\nManuell (ohne festen Termin, nicht geprüft):`);
  for (const m of manuell) console.log(`  – ${m}`);
}

if (verfallen.length > 0) {
  console.log(`\n${verfallen.length} Termin(e) VERFALLEN — Register-Konvention Ziff. 3: verfallene Prüfung = Deploy-Hindernis für die betroffene Vorlage/den Rechner. Prüfen, nachführen, Register aktualisieren.`);
  process.exit(1);
}
if (bald.length > 0) {
  console.log(`\n${bald.length} Termin(e) in den nächsten ${VORLAUF_TAGE} Tagen fällig — einplanen.`);
}
console.log('Kein Verfall.');
