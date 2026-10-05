// scripts/perf/tti-bewertung.ts — die BEWERTETE TTI des Lighthouse-Budget-Tors.
//
// Reine Funktion (kein Chrome, kein Netz, kein Date.now — §2), damit die Bewertung
// ohne Messlauf testbar ist (src/tests/perf-tti-bewertung.test.ts). Aufgerufen von
// `lighthouse-budget.ts`; der Deckel (13000 OR / 12000 Start) steht dort in SCHWELLEN.
//
// ── ENTSCHEID DAVID 5.10.2026 («ja, TTI normieren wie TBT») ──
// Variante D statt wörtlich «wie TBT» (B) — nach Vorlage der Messtabelle unten
// bestätigt: «ja, D» (David, Chat 5.10.2026).
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
// 0.63–1.32 (alle auf die heutige Kalibrier-Basis 1120 ms bezogen, s. u.), davon
// 13 «schnelle» Runner (Faktor < 0.9). OR-Route, je Median aus 3:
//
//   Variante                          min   Median    max    sd    CV   corr(faktor)  > 13000  schnelle > 13000
//   A  roh                           9368    11418  13609   967   8.5 %     +0.19       2/47        0/13
//   B  tti / faktor  (wie TBT)       7425     9891  18091  3418  29.3 %     −0.94      13/47       13/13
//   C  tti − tbt + tbt/faktor        8479    11203  13921  1357  12.0 %     −0.69       6/47        6/13
//   D  C mit Klemme faktor ≥ 1       8479    11196  12506   941   8.7 %     −0.29       0/47        0/13
//
// KALIBRIER-BASIS (Korrektur aus der Gegenprüfung 5.10.2026): die 8 Punkte des
// Laufs 29765490018 (20.7.) tragen eine ANDERE Kalibrier-Basis (kalibrierTbt/faktor
// = 2000 ms statt 1120 ms); ihre damals gedruckten Faktoren (0.36–0.74) sind mit
// den übrigen nicht vergleichbar. Die Tabelle rechnet deshalb für ALLE 47 Punkte
// Faktor = kalibrierTbt / 1120 (die 8 Punkte: 0.64–1.32 statt 0.36–0.74). Ältere
// Fassungen dieser Tabelle (Faktor 0.36–1.32, «18 schnelle», B max 31.6 s, B 18/18,
// D 0/18) beruhten auf der Mischbasis und sind damit überholt, nicht «nachgeführt».
//
// BEFUND — warum NICHT «exakt wie TBT» (§7: Auftrag mit Messung geprüft, Abweichung
// offengelegt): Die TTI hängt am simulierten langsamen 4G (Netzanteil TTI − TBT
// im Median ~7.5 s; corr(Netzanteil, Faktor) = −0.35; log-log-Steigung TTI~Faktor
// nur 0.05, bei der TBT 0.63) und fällt auf einem SCHNELLEN Runner nicht mit. Teilt
// man sie ganz durch den Faktor (B), wird sie dort aufgeblasen: alle 13 schnellen
// Runner reissen den Deckel (max 18.1 s) — Falsch-Rot im grossen Stil. C
// (modellkonsistent zu TBT: nur den Blockier-Anteil, beidseitig) ist auf schnellen
// Runnern widerlegt (6/13 über dem Deckel); die Klemme max(1, f) nutzt C nur, wo es
// entlastet. D bereinigt deshalb nur in Richtung LANGSAM: `faktor_wirksam =
// min(FAKTOR_MAX, max(1, faktor))`. Schnelle Runner bleiben auf dem Rohwert (kein
// neues Rot, nichts hochgerechnet), langsame bekommen ihren Blockier-Anteil auf
// Basis-Geschwindigkeit zurück.
//
// WAS D AM 5.10.-FEHLSCHLAG GEMACHT HÄTTE: 13609 roh (Faktor 1.249, TBT roh 5529)
// ⇒ 13609 − 5529 + 5529/1.249 ≈ 12.5 s (12506 ms mit dem ungerundeten Faktor) ⇒ grün
// (Kopffreiheit 3.8 %).
//
// §15-LOGIKVERLUST-BEWERTUNG (korrigiert 5.10.2026 nach Gegenprüfung — «KEINE» war
// zu stark): Die Zahl 13000 bleibt, es wechselt die Messgrösse, und nur zugunsten
// langsamer Runner. Der Preis ist Empfindlichkeit: auf langsamen Runnern ist die
// Schwelle gröber geworden. Median-Kopffreiheit gegen 13000 (23 CI-Läufe des Jobs
// «Perf-Budget»): roh 909 ms → bewertet 1777 ms (Gegenprüfung auf n = 14: 847 →
// 1752 ms). Am 5.10.-Punkt (Faktor 1.249, bewertet 12506 ms) rutscht ein
// Hauptthread-Regress (mehr TBT) bis +617 ms und ein Netz-/Lade-Regress bis +494 ms
// durch, ohne das Tor zu reissen. Dem steht gegenüber: der Rohwert war je nach
// zugeteiltem Runner ein Münzwurf (auf schnellen Runnern fing er einen Regress von
// +1.5 s ohnehin nicht; auf langsamen riss er ohne Regress); D vereinheitlicht die
// Schwelle auf rund 1.75 s Regress über alle Runner. Ein echter Hauptthread-Regress
// erhöht weiter den bewerteten Wert (durch den Faktor gedämpft), ein Netz-Regress
// wird nicht bereinigt und schlägt 1:1 an. Kein App-Code, keine Rechtslogik berührt.
//
// EXPONENT (offengelegt): Der Blockier-Anteil wird mit Exponent 1 durch den Faktor
// geteilt («wie TBT»). In diesen Daten skaliert die TBT mit Steigung ~0.63 (log TBT
// ~ log Faktor; Bau-Daten 0.42, Streuung gross) — Exponent 1 korrigiert also leicht
// zu viel. Bewusst BEHALTEN (Entscheid «wie TBT», einfacher zu erklären); mit
// Exponent 0.65 läge der 5.10.-Punkt bei 12865 statt 12506 ms — ebenfalls grün, die
// Wahl entscheidet dort nicht über Rot/Grün.
//
// EHRLICHE GRENZE (§8): (1) Beobachtet sind nur ZWEI Falsch-Rot-Läufe; die Korrektur
// stützt sich auf die Modellannahme «der Blockier-Anteil skaliert mit dem Faktor»,
// die für die TBT belegt ist (Steigung 0.63), für den TBT-Anteil innerhalb der TTI
// aber nur schwach (corr(TTI, TBT) = +0.07). D ist darum vor allem eine vorsichtige
// Entlastung langsamer Runner, kein Rauschfilter. (2) Der Roh-Wert ist bei Faktor
// ≥ 1.2 ohnehin nicht mit dem Faktor korreliert (−0.17, n = 26, Spanne 1.22–1.32 —
// eng); die TTI-Streuung bleibt zu grossen Teilen Rauschen. (3) Das 13000er-Limit
// hat auch bewertet nur ~2.1 sd Kopffreiheit (max D 12506 ms, sd 941 ms; Rausch-Rot
// ~2 %): wird es wieder rot, ist die nächste Frage der Deckel, nicht die
// Normierung. (4) n = 47 enthält die Reihe vom 20.7. (8 Punkte, Kalibrier-Basis
// 2000 ms, oben auf 1120 umgerechnet); ohne sie (n = 39) bleiben die Befunde gleich
// (B: 10/39 über 13000, max 18.1 s; C: 5/39; D: max 12506 ms, 0/39). (5) Ausreisser-
// Schutz: der wirksame Faktor ist bei FAKTOR_MAX = 1.35 gedeckelt (beobachtetes Band
// bis 1.32); eine verrutschte Kalibrierung (z. B. Faktor 5) zöge sonst fast den
// ganzen Blockier-Anteil ab und machte das Tor blind.
//
// Bewertet wird NUR der Blockier-Anteil der TTI, und nur zugunsten LANGSAMER
// Runner:
//
//   tti bewertet = tti roh − tbtRoh + tbtRoh / min(FAKTOR_MAX, max(1, faktor))
//
// Fällt die Kalibrierung aus (kein plausibler Faktor, PERF_NORMIEREN=0), ist die
// bewertete TTI der Rohwert — derselbe Fallback wie bei der TBT.

/**
 * Obergrenze des wirksamen Runner-Faktors (Ausreisser-Schutz). Beobachtetes Band
 * der 47 Messpunkte: 0.63–1.32; 1.35 lässt dem beobachteten Maximum eine kleine
 * Reserve und verhindert, dass eine verrutschte Kalibrierung den Blockier-Anteil
 * fast ganz herausrechnet.
 */
export const FAKTOR_MAX = 1.35;

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
  // Klemme unten bei 1: ein SCHNELLER Runner (faktor < 1) macht die TTI nicht
  // schneller, weil sie am simulierten 4G hängt (Messtabelle oben) — dort darf
  // nichts hochgerechnet werden, sonst wird der Netzanteil aufgeblasen. Klemme oben
  // bei FAKTOR_MAX: Ausreisser-Schutz.
  const wirksam = Math.min(FAKTOR_MAX, Math.max(1, faktor));
  return { bewertet: ttiRoh - tbtRoh + tbtRoh / wirksam, normiert: true };
}
