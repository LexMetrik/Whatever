import type { ArtikelHistorie } from '../../lib/normtext/historie-laden';
import { formatiereDatum } from './helpers';

// ═══ W2·26/Z2 · DER FASSUNGS-STAND EINES ARTIKELS, EINMAL FORMULIERT ════════
//
// MANDAT David 11.9.2026, wörtlich: «Fassung soll nur ‹gilt seit XXX› zeigen,
// erst beim Aufklappen erscheinen die Angaben».
//
// Damit liest DERSELBE Stand an ZWEI Orten: zugeklappt als Marke in der
// Funktionszeile («Gilt seit 1.1.2023 ›», `parts/Funktionszeile.tsx`) und
// aufgeklappt als Schild im Block darunter («Fassung · Gilt seit 1.1.2023»,
// `parts/ArtikelHistorie.tsx`). Zwei Formulierungen desselben Datums wären
// zwei Wahrheiten (§5) — und die erste, die jemand ändert, liesse die zweite
// stehen. Die Rechnung steht darum genau hier.
//
// REIN UND DETERMINISTISCH (§2): gleiche Historie ⇒ gleiche Zeichenkette, kein
// `Date.now()`, keine Ableitung aus dem heutigen Tag. Was der Shard NICHT
// trägt, wird nicht erfunden (§8) — dafür ist der Rückgabewert `null`, und der
// Aufrufer entscheidet, wie er das ausspricht.
//
// EIGENE DATEI und nicht ein Export aus `parts/ArtikelHistorie.tsx`: jene Datei
// exportiert eine Komponente, und eine Datei, die Komponenten UND Nicht-
// Komponenten exportiert, bricht die Fast-Refresh-Regel des Hauses (dieselbe
// Begründung wie an `parts/Funktionszeile.tsx`, lokale Funktion `griff`).

/**
 * Der datierte Stand dieses Artikels, wörtlich so, wie er in der Oberfläche
 * steht — oder `null`, wenn der Shard kein Datum trägt.
 *
 * REIHENFOLGE: «Aufgehoben seit …» geht vor «Gilt seit …». Ein aufgehobener
 * Artikel GILT nicht mehr; sein Wirkungs-Stand ist die Auskunft, die zählt
 * (dieselbe Rangfolge, die `parts/ArtikelHistorie.tsx` seit G-HIST-UI führt —
 * von dort ist sie unverändert hierher gezogen, nicht neu erfunden).
 */
function fassungsStand(historie: ArtikelHistorie | undefined): string | null {
  if (!historie) return null;
  if (historie.aufgehobenSeit) return `Aufgehoben seit ${formatiereDatum(historie.aufgehobenSeit)}`;
  if (historie.giltSeit) return `Gilt seit ${formatiereDatum(historie.giltSeit)}`;
  return null;
}

/**
 * Was die Marke der Rubrik «Fassung» ZUGEKLAPPT liest.
 *
 * Ohne datierten Stand bleibt das blosse Wort «Fassung» — nicht
 * «Fassungshistorie» wie im Schild darunter: in der Zeile steht die Marke
 * neben «11 Entscheide» und «6 Verweise», und dort ist «Fassung» das Wort
 * derselben Bauart. Das Schild im Block hat den Platz für das längere Wort und
 * braucht es auch, weil dort die Zeitleiste erklärt werden muss.
 */
export function fassungsMarkeEtikett(historie: ArtikelHistorie | undefined): string {
  return fassungsStand(historie) ?? 'Fassung';
}

/**
 * Was das Schild im aufgeklappten Block liest (`parts/ArtikelHistorie.tsx`).
 * Ohne datierten Stand «Fassungshistorie» — der Block zeigt dann eine reine
 * Ereignis-Liste ohne In-Kraft-Datum, und genau das sagt das Wort.
 */
export function fassungsSchild(historie: ArtikelHistorie | undefined): string {
  return fassungsStand(historie) ?? 'Fassungshistorie';
}
