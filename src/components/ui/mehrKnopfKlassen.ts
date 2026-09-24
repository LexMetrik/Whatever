// ─── Geteilte Klassen: «Weitere/Frühere anzeigen»-Knopf (Haarlinie, K3) ──────
//
// Werkbank K3 (23.9.2026, Board «Unter-Rechtsprechung-Register»): «Weitere/
// Frühere anzeigen» als Haarlinien-Knopf; Hover = Linie + Tinte, ohne
// Messing-Fläche. Dieselbe Klassenkette stand wortgleich an ZWEI Stellen
// (`pages/Rechtsprechung.tsx::MEHR_KNOPF`, `components/start/
// MaterialienBlatt.tsx`) — mit der dritten Stelle (`RechtsprechungBlatt.tsx`,
// W2·29-WERKBANK-START S3-Nachzug) EINE geteilte Quelle statt einer dritten
// Kopie (§5/§10). Der Aufrufer stellt `lc-btn-mini` selbst voran (Basisform),
// diese Konstante trägt nur die Feinform.
export const MEHR_KNOPF_KLASSEN =
  'mx-auto flex w-fit px-3 text-xs text-ink-600 hover:border-line-strong hover:bg-transparent hover:text-ink-900';
