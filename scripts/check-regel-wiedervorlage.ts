// scripts/check-regel-wiedervorlage.ts — Bewährungsfrist für Prosa-Regeln.
//
// Lücke (Dossier bibliothek/betrieb/rekursive-selbstverbesserung-
// gegenueberstellung-2026-09-15.md §6–§8): Regeln entstehen aus Vorfällen und
// werden nie wieder auf Gültigkeit geprüft — Vorbild ist das datierte
// `bibliothek/register/parameter-verfall.md`. Jede Regel trägt darum hinter der
// Überschrift `<!-- @wiedervorlage: YYYY-MM-DD -->`.
//
// ROT (Exit 1) NUR strukturell: Regel ohne Marker oder Marker ohne gültiges
// Datum. Eine FÄLLIGE Regel ist bewusst kein Rot — ein Kalenderdatum würde
// sonst fremde Produkt-PRs blockieren (Falle K7 3.8.2026, s. check:verfall);
// sie erscheint als Liste. `new Date()` zulässig: Bericht, keine Rechenlogik
// (§2). Der Wächter schlägt vor, er vollzieht nie — David entscheidet (§14).
//
// DATUM-REGEL für einen neuen Marker — massgeblich ist das BELEG-Datum
// (Vorfall/Auftrag), nie eine bloss erwähnte Zukunftsangabe (F9 nennt 1.1.2027
// als Fremd-Stand); nichts vor 2026-12-01 (Abnahme-Zeitsperre):
//  · Vorfalls-Beleg UND Tor/Wächter als Gegenmittel: +12 Monate (gegatet).
//  · reine Prosa-Regel ohne Tor: +6 Monate · ohne jedes Datum: 2027-03-15.
import { readFileSync, readdirSync } from 'node:fs';

type Eintrag = { id: string; datei: string; zeile: number; datum: string | null };

const MARKER = /<!-- @wiedervorlage: (\S+) -->/;
// `toJSON()` statt `toISOString()`: gibt bei ungültigem Datum null zurück statt
// zu werfen (Rot-Beweis 15.9.2026 an '2027-13-45' — ein Tor, das crasht, meldet nichts).
const istDatum = (s: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toJSON()?.slice(0, 10) === s;

/** Einträge einer Datei: `kopf` erkennt den Anfang, `bis` das Ende eines Eintrags. */
function sammle(datei: string, kopf: (z: string) => string | null, bis: (z: string) => boolean): Eintrag[] {
  const raus: Eintrag[] = [];
  let offen: Eintrag | null = null;
  readFileSync(datei, 'utf8').split('\n').forEach((z, i) => {
    const id = kopf(z);
    if (offen && (id !== null || bis(z))) { raus.push(offen); offen = null; }
    if (id !== null) offen = { id, datei, zeile: i + 1, datum: null };
    const m = MARKER.exec(z);
    if (m && offen) offen.datum = m[1];
  });
  if (offen) raus.push(offen);
  return raus;
}

const eintraege: Eintrag[] = [
  // CLAUDE.md: jeder §-Abschnitt. Ohne Marker bleiben §16 (ausdrücklich
  // «entfällt», Nummer nie neu belegt) und die Wegweiser-Tabelle am Schluss.
  ...sammle('CLAUDE.md',
    (z) => { const m = /^#{2,3} (§\d+(?:\.\d+)?)\b/.exec(z); return m && m[1] !== '§16' ? m[1] : null; },
    (z) => /^## /.test(z)),
  // .claude/rules/*.md: jede Überschrift ist eine pfad-gescopte Regel.
  ...readdirSync('.claude/rules').filter((f) => f.endsWith('.md')).flatMap((f) =>
    sammle(`.claude/rules/${f}`, (z) => /^#{1,6} /.test(z) ? z.replace(/^#+ /, '').trim() : null, () => false)),
  // Lehren-Register: F-Einträge als Tabellenzeile (F1–F9) und als Absatz (F10–F17).
  ...sammle('.claude/skills/lehren/SKILL.md',
    (z) => /^\|\s*\*\*(F[0-9a-z]+)\*\*\s*\|/.exec(z)?.[1] ?? /^\*\*(F\d+)\s*—/.exec(z)?.[1] ?? null,
    (z) => /^## /.test(z)),
];

const fehler = eintraege.flatMap((e) => {
  const wo = `${e.datei}:${e.zeile} ${e.id}`;
  if (e.datum === null) return [`  ${wo}: kein @wiedervorlage-Marker — Datum-Regel im Kopf dieses Skripts.`];
  if (!istDatum(e.datum)) return [`  ${wo}: Marker-Datum '${e.datum}' ist kein gültiges YYYY-MM-DD.`];
  return [];
});

if (fehler.length) {
  console.log(`check:regel-wiedervorlage ROT — ${fehler.length} Regel(n) ohne gültigen Marker:\n${fehler.join('\n')}`);
  process.exit(1);
}

const heute = new Date().toISOString().slice(0, 10);
const faellig = eintraege.filter((e) => e.datum! <= heute).sort((a, b) => a.datum!.localeCompare(b.datum!));
const jeDatei = [...new Set(eintraege.map((e) => e.datei))]
  .map((d) => `${eintraege.filter((e) => e.datei === d).length}× ${d}`).join(', ');
console.log(
  `check:regel-wiedervorlage OK — ${eintraege.length} Regeln mit Wiedervorlage-Datum ` +
  `(${jeDatei}). Stichtag ${heute}: ${faellig.length} fällig.`);
if (faellig.length) {
  console.log('\nWiedervorlage fällig — Streichkandidaten (Vorschlag, kein Vollzug):');
  for (const e of faellig) console.log(`  ${e.datum}  ${e.datei}:${e.zeile}  ${e.id}`);
  console.log('  → noch gültig? Marker neu datieren. Sonst Streichkandidat in ROADMAP QS-EFFIZIENZ.');
}
