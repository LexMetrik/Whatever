// ─── W2·28-TREFFER-LANDKARTE · L-2 · Ein Schalter für beide Anzeigen ─────────
//
// «Ein Schalter blendet Hervorhebung UND Marken gemeinsam aus» — beides ist
// dieselbe Auskunft in zwei Darstellungen, und zwei Schalter dafür wären zwei
// Wahrheiten über einen Zustand (§5). Wer den Wortlaut ohne Farbe lesen will,
// nimmt beide zugleich weg.
//
// WAS DER SCHALTER NICHT TUT (§8): er ändert nichts an Treffern, Zählern,
// Trefferliste oder ↑↓-Folge. Die Auskunft «23 Artikel · 88 Fundstellen» bleibt
// stehen und die Sprünge laufen weiter — genommen wird die FARBE, nicht das
// Ergebnis. Darum heisst er «Hervorhebung» und nicht «Suche».
//
// A11Y: fester sichtbarer Text + `aria-pressed` (kein wechselndes Label — der
// Name eines Umschalters bleibt gleich, der Zustand steht im Attribut). Das
// Häkchen links ist dieselbe Zustands-Schreibweise wie in `components/ui/Menue`
// (D5: EIN Häkchen links, kein Zustands-Doppel rechts) und `aria-hidden`.

export function MarkenSchalter({ aus, onSchalten }: {
  /** Sind Hervorhebung und Marken gerade weggeschaltet? */
  aus: boolean;
  onSchalten: (aus: boolean) => void;
}) {
  return (
    <button type="button" data-treffer-marken-schalter
      aria-pressed={!aus}
      onClick={() => onSchalten(!aus)}
      title={aus
        ? 'Hervorhebung im Text und Treffer-Marken wieder einblenden'
        : 'Hervorhebung im Text und Treffer-Marken zusammen ausblenden'}
      className="flex shrink-0 items-center gap-1 whitespace-nowrap px-1 text-micro text-ink-600 transition-colors hover:text-brass-700">
      <span aria-hidden className="w-2 text-center">{aus ? '' : '✓'}</span>
      <span>Hervorhebung</span>
    </button>
  );
}
