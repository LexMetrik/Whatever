// scripts/perf/tti-bewertung.ts — die BEWERTETE TTI des Lighthouse-Budget-Tors.
//
// Reine Funktion (kein Chrome, kein Netz, kein Date.now — §2), damit die Bewertung
// ohne Messlauf testbar ist (src/tests/perf-tti-bewertung.test.ts). Herleitung,
// Messtabelle und ehrliche Grenze stehen im Block «TTI-Normierung» in
// `lighthouse-budget.ts` (ENTSCHEID DAVID 5.10.2026).
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
