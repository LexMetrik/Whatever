import type { StrukturMap } from '../../lib/normtext/browse';

// ═══ W2·17-UI-BEFUNDE (B7) · EINDEUTIGE BEZEICHNUNG EINES ARTIKELS ═══════════
//
// «Art. 3» allein nennt in OR, ZGB und SchKG zwei Artikel: den Hauptartikel und
// den Artikel der Schlusstitel-/Übergangsgruppe (Token `disp_u<N>_art_3`). Wo ein
// Label OHNE den umgebenden Gliederungs-Pfad steht (der «Weiterlesen»-Chip), muss
// es auch den Übergangsartikel eindeutig benennen — sonst verspricht der Chip
// einen anderen Artikel als den, zu dem er springt (§8).
//
// Die Bezeichnung der Gruppe kommt aus derselben amtlichen Gliederung, die der
// Leser sonst zeigt (`struktur[token].gliederung`, Ebene 1; z. B. «Schlusstitel:
// Anwendungs- und Einführungsbestimmungen») — keine zweite Pflegestelle (§5).
// Fehlt das Sidecar (lädt nicht / noch nicht), fällt die Form auf die Gruppen-
// Kennung des Tokens zurück: unschön, aber eindeutig; nie stillschweigend «Art. 3».
// Haupttext-Artikel bleiben unverändert (Label = Anzeige-Label des Eintrags).

const UEB_TOKEN = /^(disp_u\d+)_/;

export function eindeutigeBezeichnung(
  token: string,
  label: string,
  struktur: StrukturMap | null,
): string {
  const m = UEB_TOKEN.exec(token);
  if (!m) return label;
  const gruppe = struktur?.[token]?.gliederung.find((g) => g.ebene === 1)?.label;
  return gruppe ? `${label} (${gruppe})` : `${label} (Übergangs-/Schlussbestimmungen ${m[1]})`;
}
