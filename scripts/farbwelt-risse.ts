// scripts/farbwelt-risse.ts — Auswertung der «bekannten Risse» des Farbwelt-Tors
// (rein, ohne Dateizugriff; W2·19 Kleinaufräumen 30.9.2026). Zwei Kategorien:
//   RISSE       — echte Risse (D-1-Input): WARNUNG + Fail bei Verschlechterung
//                 über die Toleranz (Baseline-Guard).
//   DURCH_ROLLE — Paare unter der Schwelle, die eine Flächen-Rolle ausschliesst
//                 (heute: ink-500 auf reg-*-flaeche, Rolle «Tinte leise» hebt
//                 auf ink-600): KEINE Warnung und KEIN Baseline-Guard — das
//                 Gate ist das ink-600-PFLICHT-Paar; eine Token-Verschiebung
//                 innerhalb der Rolle soll nicht rot werden. Liegt ein Paar
//                 wieder über der Schwelle, meldet die Zeile «Rolle überflüssig»
//                 (Rückbau-Signal, §17-Gegengewicht). Die Rolle selbst wird
//                 bewacht (Mindestwert-Wächter, Kleinaufräumen 2, 30.9.2026):
//                 die ROLLEN-Farbe (ink-600) muss auf jeder Fläche des Paars
//                 die Schwelle tragen — sinkt sie, ist das ein FEHLER (sonst
//                 könnte keines dieser Paare je rot werden; `ist` ist hier tot).
import type { Mode } from './farbwelt-messung';

export type Riss = { fg: string; bg: string; mode: Mode; schwelle: number; ist: number; tag: string };

export function werteRisseAus(
  risse: Riss[],
  durchRolle: Riss[],
  kontrast: (fg: string, bg: string, mode: Mode) => number,
  tol: number,
  rolle = 'ink-600',
): { warnungen: string[]; fehler: string[]; ausgeschlossen: string[] } {
  const warnungen: string[] = [];
  const fehler: string[] = [];
  const ausgeschlossen: string[] = [];
  for (const r of risse) {
    const ist = kontrast(r.fg, r.bg, r.mode);
    const marke = ist < r.schwelle ? 'RISS' : 'geheilt';
    warnungen.push(`[${marke}] ${r.fg}/${r.bg} ${r.mode}: ${ist.toFixed(2)}:1 (Ziel ${r.schwelle}:1) — ${r.tag}`);
    if (ist < r.ist - tol)
      fehler.push(`Verschlechterung ${r.fg}/${r.bg} ${r.mode}: ${ist.toFixed(2)}:1 < Baseline ${r.ist.toFixed(2)}:1 — bekannter Riss darf nicht tiefer sinken (${r.tag}).`);
  }
  for (const r of durchRolle) {
    const ist = kontrast(r.fg, r.bg, r.mode);
    const marke = ist < r.schwelle ? 'durch Rolle ausgeschlossen' : 'Rolle überflüssig';
    ausgeschlossen.push(`[${marke}] ${r.fg}/${r.bg} ${r.mode}: ${ist.toFixed(2)}:1 (Ziel ${r.schwelle}:1) — ${r.tag}`);
    const rolleIst = kontrast(rolle, r.bg, r.mode);
    if (rolleIst < r.schwelle)
      fehler.push(`Rolle trägt nicht ${rolle}/${r.bg} ${r.mode}: ${rolleIst.toFixed(2)}:1 < ${r.schwelle}:1 — die Rolle, die ${r.fg} ausschliesst, muss die Schwelle halten (${r.tag}).`);
  }
  return { warnungen, fehler, ausgeschlossen };
}
