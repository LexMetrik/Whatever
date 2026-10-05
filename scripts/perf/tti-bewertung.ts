// scripts/perf/tti-bewertung.ts — die BEWERTETE TTI des Lighthouse-Budget-Tors.
//
// Reine Funktion (kein Chrome, kein Netz, kein Date.now — §2), damit die Bewertung
// ohne Messlauf testbar ist (src/tests/perf-tti-bewertung.test.ts). Aufgerufen von
// `lighthouse-budget.ts`; der Deckel (13000 OR / 12000 Start) steht dort in SCHWELLEN.
//
// ── ENTSCHEID DAVID 5.10.2026 («ja, TTI normieren wie TBT») ──
//
// ANLASS: Die OR-TTI riss den 13000-ms-Deckel mehrfach auf Ständen ohne
// Produktänderung — 24.9.2026 (13.14 s bei Faktor 1.253; 13.01 s; laut Merkzettel,
// diese Läufe sind in der Stichprobe unten nicht enthalten), 4.10.2026 (13.09 s,
// Faktor 1.257, TBT roh 5075 ms, Lauf 37230076713) und 5.10.2026 (13.61 s, Faktor
// 1.249, TBT roh 5529 ms, Lauf 37322845469). Der
// Deckel bleibt UNVERÄNDERT bei 13000 (keine Anhebung, keine Senkung); bewertet
// wird eine runner-bereinigte Grösse (diese Funktion, getestet in
// src/tests/perf-tti-bewertung.test.ts). Rohwert wird weiter gedruckt und im
// PERF-MESSPUNKT-JSON geführt (§8); Fallback bei unplausibler Kalibrierung oder
// PERF_NORMIEREN=0 ist der Rohwert, genau wie bei der TBT.
//
// MESSUNG VOR DEM BAU (5.10.2026): alle in CI auffindbaren PERF-MESSPUNKT-Zeilen,
// n = 47 unabhängige Runner-Zuteilungen (23 Läufe des Jobs «Perf-Budget», 24
// Messpunkte aus `perf-kalibrierung.yml` inkl. der Reihe vom 20.7.), Faktor
// 0.36–1.32, davon 18 «schnelle» Runner (Faktor < 0.9). OR-Route, je Median aus 3:
//
//   Variante                          min   Median    max    sd    CV   corr(faktor)  > 13000  schnelle > 13000
//   A  roh                           9368    11418  13609   967   8.5 %     +0.38        2/47        0/18
//   B  tti / faktor  (wie TBT)       7818    10419  31598  5700  43.1 %     −0.88       18/47       18/18
//   C  tti − tbt + tbt/faktor        8937    11333  16771  1701  14.4 %     −0.79       11/47       11/18
//   D  C mit Klemme faktor ≥ 1       8937    11199  12506   839   7.7 %     −0.09        0/47        0/18
//
// BEFUND — warum NICHT «exakt wie TBT» (§7: Auftrag mit Messung geprüft, Abweichung
// offengelegt): Die TTI hängt am simulierten langsamen 4G (Netzanteil TTI − TBT
// im Median ~7.5 s, ohne Bezug zum Faktor: corr −0.16; log-log-Steigung TTI~Faktor
// nur 0.07, bei der TBT 0.65) und fällt auf einem SCHNELLEN Runner nicht mit. Teilt
// man sie ganz durch den Faktor (B), wird sie dort aufgeblasen: Faktor 0.36 ergibt
// 31.6 s, alle 18 schnellen Runner reissen den Deckel — Falsch-Rot im grossen Stil.
// Auch C (nur den Blockier-Anteil, aber beidseitig) reisst 11/18 schnelle Runner.
// D bereinigt deshalb nur in Richtung LANGSAM: `faktor_wirksam = max(1, faktor)`.
// Schnelle Runner bleiben auf dem Rohwert (kein neues Rot, nichts hochgerechnet),
// langsame bekommen ihren Blockier-Anteil auf Basis-Geschwindigkeit zurück.
//
// WAS D AM 5.10.-FEHLSCHLAG GEMACHT HÄTTE: 13609 roh (Faktor 1.249, TBT roh 5529)
// ⇒ 13609 − 5529 + 5529/1.249 ≈ 12.5 s (12506 ms mit dem ungerundeten Faktor) ⇒ grün
// (Kopffreiheit 3.8 %).
//
// §15-LOGIKVERLUST-BEWERTUNG: KEINE. Die Zahl 13000 bleibt; es wechselt allein die
// Messgrösse, und nur zugunsten langsamer Runner. Ein echter Seiten-Regress (mehr
// Hauptthread-Arbeit) erhöht den Blockier-Anteil und damit auch den bewerteten
// Wert; ein Netz-/Lade-Regress (Nicht-TBT-Anteil) wird nicht bereinigt und schlägt
// voll an. Kein App-Code, keine Rechtslogik berührt.
//
// EHRLICHE GRENZE (§8): (1) Beobachtet sind nur ZWEI Falsch-Rot-Läufe; die Korrektur
// stützt sich auf die Modellannahme «der Blockier-Anteil skaliert mit dem Faktor»,
// die für die TBT belegt ist (Steigung 0.65), für den TBT-Anteil innerhalb der TTI
// aber nur schwach (corr(TTI, TBT) = +0.07). D ist darum vor allem eine vorsichtige
// Entlastung langsamer Runner, kein Rauschfilter. (2) Der Roh-Wert ist bei Faktor
// ≥ 1.2 ohnehin nicht mit dem Faktor korreliert (−0.08, n = 22, Spanne 1.22–1.32 —
// eng); die TTI-Streuung bleibt zu grossen Teilen Rauschen. (3) Das 13000er-Limit
// hat auch bewertet nur ~2.1 sd Kopffreiheit (max D 12506 ms; Rausch-Rot ~2 %):
// wird es wieder rot, ist die nächste Frage der Deckel, nicht die Normierung.
// (4) n = 47 mit 3 Punkten aus der Reihe vom 20.7. (Faktor 0.36–0.37, anderes
// Runner-Regime); ohne sie bleiben die Befunde gleich (B: 10/39 über 13000, max
// 18.1 s; D: max 12506 ms, 0/39).
//
// Bewertet wird NUR der Blockier-Anteil der TTI, und nur zugunsten LANGSAMER
// Runner:
//
//   tti bewertet = tti roh − tbtRoh + tbtRoh / max(1, faktor)
//
// Fällt die Kalibrierung aus (kein plausibler Faktor, PERF_NORMIEREN=0), ist die
// bewertete TTI der Rohwert — derselbe Fallback wie bei der TBT.

export type TtiBewertung = {
  /** Die Grösse, die gegen `ttiMax` assertiert wird. */
  bewertet: number;
  /** true = um die Runner-Geschwindigkeit bereinigt; false = Rohwert (Fallback). */
  normiert: boolean;
};

export function bewerteTti(ttiRoh: number, tbtRoh: number, faktor: number | undefined): TtiBewertung {
  if (faktor === undefined || !Number.isFinite(faktor) || faktor <= 0) {
    return { bewertet: ttiRoh, normiert: false };
  }
  // Klemme bei 1: ein SCHNELLER Runner (faktor < 1) macht die TTI nicht schneller,
  // weil sie am simulierten 4G hängt (Messreihe in lighthouse-budget.ts) — dort
  // darf nichts hochgerechnet werden, sonst wird der Netzanteil aufgeblasen.
  const wirksam = Math.max(1, faktor);
  return { bewertet: ttiRoh - tbtRoh + tbtRoh / wirksam, normiert: true };
}
