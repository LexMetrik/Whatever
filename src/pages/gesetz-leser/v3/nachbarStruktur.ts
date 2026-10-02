import { createContext } from 'react';
import type { StrukturMap } from '../../../lib/normtext/browse';

// ═══ B11-D04 · DIE GLIEDERUNG, DIE DIE NACHBAR-PFEILE FÜR DEN GRUPPENNAMEN LESEN ═
//
// Das Pfeil-Paar steht an zwei Stellen — im Artikelkopf (`parts/ArtikelLeser`, ein
// `memo`-Bauteil mit festem Propsatz, gebaut in `./LeserLesespalte`) und im Fuss
// der Einzelansicht. Beide brauchen für den amtlichen Gruppennamen dieselbe
// Sidecar-Gliederung (`nachbarBezeichnung`). Als Prop müsste sie durch den
// Artikelkopf hindurch gereicht werden und risse die `memo`-Schranke über alle
// Artikel auf (§15); als Kontext liest sie nur, wer ein Pfeil-Paar rendert, und
// im Erlass-Modus steht keines. Der Wert kommt aus `LeserV3Modell.struktur` —
// dieselbe Quelle wie überall im Leser (§5), `null` solange das Sidecar lädt.
//
// Eigene Datei, weil `react-refresh/only-export-components` eine Komponenten-
// Datei mit einem zweiten Export-Typ zurückweist.
export const NachbarStrukturKontext = createContext<StrukturMap | null>(null);
