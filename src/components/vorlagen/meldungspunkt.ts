/** Aufzählungszeichen vor einer Meldung: «• » nur, wenn die Liste mindestens
 *  zwei Meldungen trägt; eine einzelne Meldung steht ohne Punkt (W2·19
 *  Kleinaufräumen 30.9.2026, Kanon wie `FehlerBox`). Eine Quelle für die
 *  Warn-/Befund-Listen ausserhalb der FehlerBox (Zustellung, PruefBefund).
 *  Seit W2·19 P12 (30.9.2026) nutzt auch `FehlerBox` (ui.tsx) diesen
 *  Helfer — Stand davor: inline `fehler.length >= 2`. */
export function meldungspunkt(anzahl: number): string {
  return anzahl >= 2 ? '• ' : '';
}
