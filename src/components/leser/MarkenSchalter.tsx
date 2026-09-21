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
//
// ── TAP-ZIEL 24 px (WCAG 2.5.8, Fertigbau 21.9.2026) ────────────────────────
// Der Knopf trug nur `text-micro` ohne eigene Höhe und mass in der `min-h-5`-
// Zähler-Zeile rund 20 px — unter dem Mindestmass. `min-h-6` (1.5 rem = 24 px)
// sitzt darum HIER, an der Schaltfläche, und NICHT an der Zeile: deren
// `min-h-5` teilt er sich mit den ‹ ›-Griffen, und die Zonenhöhe darüber ist
// mit `SUCH_H_AKTIV` festgeschrieben und in `src/tests/leser-v3-fundament.test.ts`
// wie in mehreren e2e-Specs auf den Pixel bewacht (LM-003: ein verstellter
// Sprung-Offset trifft JEDEN Anker). Die Zeile ist ein `items-center`-Flex in
// einer Zone FESTER Höhe — ein höheres Kind wächst in bereits reservierten
// Raum, ohne die Zone zu verschieben; `e2e/leser-w228-landkarte.e2e.ts` misst
// beides zugleich nach (Knopf ≥ 24 px UND Zonenhöhe unverändert).
// Die Breite war nie das Problem: «✓ Hervorhebung» ist weit über 24 px breit.

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
      className="flex min-h-6 shrink-0 items-center gap-1 whitespace-nowrap px-1 text-micro text-ink-600 transition-colors hover:text-brass-700">
      <span aria-hidden className="w-2 text-center">{aus ? '' : '✓'}</span>
      <span>Hervorhebung</span>
    </button>
  );
}
