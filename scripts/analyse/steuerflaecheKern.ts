// scripts/analyse/steuerflaecheKern.ts — Flächen-Definition des früheren Tors
// check:steuerflaeche (Byte-Sperrklinke, 20.9.2026). Tor, Grenzdatei und Zeitreihe
// entfielen mit dem Kahlschlag 10.10.2026 (Nachfolger: check:deckel, Wörter statt
// Bytes). Geblieben ist die Fläche samt RECHTSSCHUTZ-Ausnahme, weil
// src/tests/rechtsprechung-wochenlauf-haertung.test.ts sie als Zusicherung prüft.
// RECHTSSCHUTZ (CLAUDE.md §1, Weisung David 20.9.2026): Prüfungen, deren
// Gegenstand Rechtslogik oder Rechtsdaten ist, zählen nicht zur Fläche.

// ── DIE FLÄCHE ──────────────────────────────────────────────────────────────
// Alles, was den BAU steuert statt das Produkt zu sein. Die ersten zehn Muster
// sind der Auftragsumfang; die beiden letzten sind begründete ERWEITERUNGEN
// (§7 — abweichend umsetzen und offenlegen), weil ohne sie die Lücke offen
// bliebe, an der die Umgehung vom 19./20.9.2026 hing: gedeckelt war die Hülle
// (`scripts/check-*.ts`), nicht der Helfer daneben.
export const FLAECHE: { re: RegExp; grund: string }[] = [
  { re: /^\.claude\/skills\//, grund: 'Skills — die Prozeduren, die bei jeder Tätigkeit laden' },
  { re: /^\.claude\/rules\//, grund: 'pfad-gescopte Regeln' },
  { re: /^\.claude\/agents\//, grund: 'Agenten-Definitionen (Dispatch-§0)' },
  { re: /^\.claude\/hooks\//, grund: 'Hooks — bisher einziger gedeckelter Glob' },
  { re: /^CLAUDE\.md$/, grund: 'Invarianten, lädt bei jedem Dispatch' },
  { re: /^AGENTS\.md$/, grund: 'Fremdagenten-Anweisung' },
  { re: /^docs\/token-oekonomie\//, grund: 'Dispatch-Vorlagen und Token-Reglement' },
  { re: /^\.github\/workflows\//, grund: 'Prüfstrasse — Tor-Zuwachs sitzt hier' },
  { re: /^scripts\/check-[^/]*\.ts$/, grund: 'Tor-Hüllen — bisher zweiter gedeckelter Glob' },
  { re: /^scripts\/plan\//, grund: 'Plan-Werkzeuge (plan:next, check:plan, Lagebild)' },
  // ERWEITERUNG 1: Prozess-Messung ist Steuerung. Der Ordner enthält nur Mess- und
  // Fremdagenten-Werkzeuge (keine Rechtslogik), nächster Ausweich-Ordner für Steuerungs-Logik.
  { re: /^scripts\/analyse\//, grund: 'Prozess-Messung (diese Datei eingeschlossen)' },
  // ERWEITERUNG 2: die Helfer, in die Tor-Hüllen ihre Logik auslagern. Ohne sie
  // wäre der `scripts/check-*.ts`-Deckel per Datei-Umzug jederzeit umgehbar —
  // genau die Bewegung, die `tor-paritaet-sonden.ts` (aus check-tor-paritaet.ts
  // herausgelöst, «Steuerungs-Flächendeckel») dokumentiert. Bewusst eine
  // ABSCHLIESSENDE Liste statt `scripts/*.ts` (dort überwiegend Produkt-/Datenwerkzeug).
  {
    re: /^scripts\/(dispatch|dispatch-cli|dispatch-agents|dispatch-agents-cli|tor-paritaet-sonden|fahrplan-slice|fahrplanSlicerKern|run-parallel|repo-map|aufraeumen-git)\.ts$|^scripts\/(gate|ci-log-diaet)\.sh$/,
    grund: 'Steuerungs-Helfer in scripts/ (Dispatch · Tor-Sonden · Gate-Runner)',
  },
];

// ── AUSNAHME RECHTSSCHUTZ ───────────────────────────────────────────────────
// Diese Dateien liegen in der Fläche, zählen aber NICHT mit. Massstab: ihr
// GEGENSTAND ist Rechtslogik oder Rechtsdaten (Normtext · Fedlex · Zitate ·
// Verweise · Entscheide · Besetzung · Tarif · Verfall · Sweep · Golden ·
// Datenhaltung · Gegenprüfung · Merge-Schutz). Im Zweifel ausgenommen.
// Nicht aufgeführt sind Prüfungen, die ohnehin ausserhalb der Muster liegen
// (u. a. `scripts/gegenpruefung/**`, `scripts/gegenpruefung-ok.ts`,
// `scripts/logik-sweep.ts`, `scripts/golden-outputs.ts`, `scripts/normtext/**`,
// `scripts/fedlex-*`, `scripts/rechtsprechung/**`, `scripts/tarif/**`,
// `scripts/datenhaltung/**`, `scripts/materialien/**`) — sie sind gar nicht
// erst Fläche.
export const RECHTSSCHUTZ: Record<string, string> = {
  'scripts/check-gegenpruefung.ts': 'Gegenprüfung auf Risikopfaden',
  'scripts/check-merge-schutz.ts': 'Merge-Sperre bis Gegenprüfungs-Verdikt',
  'scripts/check-golden-normtext.ts': 'Golden-Basis des Normtext-Korpus',
  'scripts/check-ui-normzitate.ts': 'UI-Normzitate gegen den Korpus',
  'scripts/check-verweis-inventar.ts': 'Verweis-Auflösung im Normtext',
  'scripts/check-raw-store.ts': 'Korpus-Rohdaten (Datenhaltung, Pins)',
  'scripts/check-lik-frische.ts': 'LIK-Reihe (BFS) — Rechtsdaten der Teuerung',
  // Paar check-ci-laeufe.ts ↔ waechter.yml: sein Gegenstand ist zwar die
  // Automatik, sein Befund aber die FRISCHE der Normen-/Korpus-Läufe
  // (normen-monitor, turso-sync; Vorfall 13.–20.7.2026, vier Wochen tote
  // Normen-Überwachung). Byte-Druck darauf träfe die Rechtsdaten-Kette — im
  // Zweifel ausgenommen.
  'scripts/check-ci-laeufe.ts': 'Wächter-Motor über die Normen-/Korpus-Läufe',
  // Paar check-fachaenderung.ts ↔ fachaenderung-kern.ts (RL-03, Nachfolger
  // von check-testtreue, Nachzug-Entscheid 20.9.2026): schützt §6.3 — die
  // Integrität der Rechtslogik-Tests; im Zweifel ausgenommen.
  'scripts/check-fachaenderung.ts': 'Fachänderungs-Riegel (§6.3) — Integrität der Rechtslogik-Tests',
  'scripts/analyse/fachaenderung-kern.ts': 'Helfer von check-fachaenderung.ts — dieselbe Ausnahme',
  // 24.9.2026: die R2-Erkennung (Assertion-Multimengen) aus test-assertion-diff.ts
  // herausgelöst (vite-node-CLI-Fix, Gegenprüfung RL-03) — Kern des Riegels.
  'scripts/analyse/assertion-mengen.ts': 'Assertion-Erkennung von check-fachaenderung.ts — dieselbe Ausnahme',
  '.github/workflows/waechter.yml': 'Wächter über die Normen-/Korpus-Läufe',
  '.github/workflows/fedlex-frische.yml': 'Fedlex-Frische',
  '.github/workflows/normen-monitor.yml': 'Normen-/Verfall-Überwachung',
  '.github/workflows/normen-monatslauf.yml': 'Monats-Vollabgleiche',
  '.github/workflows/korpus-raw-release.yml': 'Korpus-Rohdaten-Release',
  '.github/workflows/turso-sync.yml': 'Datenhaltung (DB-Sync)',
  '.github/workflows/rechtsprechung-wochenlauf.yml': 'Entscheid-Nachzug (Rechtsdaten-Kette)',
};

/** Tests zählen nie — §6.7 verlangt sie; ein Deckel darf sie nicht bestrafen. */
const TEST_RE = /\.test\.tsx?$/;

export function istFlaeche(pfad: string): boolean {
  if (TEST_RE.test(pfad)) return false;
  if (pfad in RECHTSSCHUTZ) return false;
  return FLAECHE.some((m) => m.re.test(pfad));
}
