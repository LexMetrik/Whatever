/**
 * Prozent-Dekodierung für Adress-Teile (Hash, Pfad-Segment) OHNE Absturz
 * (W2·17-UI-BEFUNDE PA-1-B01, 1.10.2026).
 *
 * `decodeURIComponent` WIRFT bei einem kaputten Escape («#art-97%»,
 * «#art-%E0» — abgeschnittener oder von Hand bearbeiteter Link). Ein Wurf in
 * einem Effekt ausserhalb der ErrorBoundary (`ScrollZuHash` in `App.tsx`)
 * liess die ganze App weiss; ein Wurf im Lese-Pfad dasselbe für den Leser.
 *
 * `null` heisst «kein Ziel»: ein kaputtes Escape ist kein Artikel, sondern
 * Müll in der Adresse — dann lieber kein Sprung als ein falscher (§8, kein
 * Rate-Sprung). EINE Stelle für alle Anker-Dekodierungen (§5).
 */
export function sicherDekodiert(roh: string): string | null {
  try {
    return decodeURIComponent(roh);
  } catch {
    return null;
  }
}
