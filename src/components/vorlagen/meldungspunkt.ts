/** Aufzählungszeichen vor einer Meldung: «• » nur, wenn die Liste mindestens
 *  zwei Meldungen trägt; eine einzelne Meldung steht ohne Punkt (W2·19
 *  Kleinaufräumen 30.9.2026, Kanon wie `FehlerBox`). Eine Quelle für die
 *  Warn-/Befund-Listen ausserhalb der FehlerBox (Zustellung, PruefBefund).
 *  Offen: `FehlerBox` (ui.tsx) trägt dieselbe Regel noch inline — nach dem
 *  Landen von #1193 (fasst ui.tsx an) auf diesen Helfer umstellen. */
export function meldungspunkt(anzahl: number): string {
  return anzahl >= 2 ? '• ' : '';
}
