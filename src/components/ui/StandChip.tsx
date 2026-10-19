import { Datum } from './Datum';

// ═══ EIN Stand-Chip (C-3-Begleitbefund «Stand-Chip-Dedupe», 31.8.2026) ══════
//
// GEMESSEN: `ErlassKarte.tsx` und `MaterialKarte.tsx` trugen denselben Chip
// zeichengleich als je eigene lokale Funktion — inklusive der ISO→TT.MM.JJJJ-
// Regex, die B-3 bereits in `datumCh`/`<Datum>` eingesammelt hatte. Die Kopie
// lag in zwei Domänen-Ordnern (`normtext/`, `materialien/`); ein Import quer
// zwischen ihnen wäre eine Domänen-Kopplung (§4), darum liegt der Baustein
// hier in `ui/` — bei den übrigen domänenfreien Darstellungs-Bausteinen.
//
// `lc-chip` und die Flachheits-Zusage: der Chip ist ein `<span>` ohne `role` —
// reine Angabe, keine Aktion, kein Link (LM-044/N1). Die Formatierung kommt
// aus `<Datum>` (B-3), damit Format UND Stimme (Textstimme mit `tabular-nums`,
// nie Mono) an genau einer Stelle stehen.
//
// §3: reine Darstellung; über Geltung oder Fristen entscheidet hier nichts.
export function StandChip({ stand, etikett = 'Stand' }: {
  /** ISO `YYYY-MM-DD`; leer = kein Chip (statt eines Chips ohne Datum, §8). */
  stand: string;
  /** Wort vor dem Datum; «Erlassen», wo das Datum das Erlassdatum und keine
   *  Nachführung ist (O-02, `standEtikett`). */
  etikett?: string;
}) {
  if (!stand) return null;
  return <span className="lc-chip whitespace-nowrap">{etikett} <Datum iso={stand} className="ml-1" /></span>;
}
