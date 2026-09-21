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
// ── DER BAUSTEIN IST `.fc-schalter`, NICHT EIN EIGENES REZEPT (§10, B-K1) ───
// Bis zum Nachzug 21.9.2026 war das hier ein roher `<button>` mit eigenen
// Utility-Klassen, eigenem `min-h-6` und einem handgebauten `<span>✓</span>`.
// `src/tests/design-r9-knopf-baustein.test.ts` hat ihn zu Recht gerissen: ein
// Knopf ohne Baustein-Klasse baut seine Optik selbst, und genau daraus sind die
// Rezept-Familien entstanden, die R9 abgeräumt hat.
// `.fc-schalter` (`src/index.css`) IST dieser Fall, Merkmal für Merkmal: ein
// `aria-pressed`-Umschalter ohne Rahmen und ohne Fläche (D22), mit dem ✓ als
// `::before` am gedrückten Zustand (Form-Signal statt reinem Farbvergleich,
// F2/F4) und mit `min-height: var(--tap-ziel)`. Damit fallen beide Eigenbauten
// weg — das Tap-Ziel kommt jetzt vom Baustein und nicht von der Aufrufstelle.
//
// OHNE `.fc-zeile[data-reg]` BLEIBT DER REGISTERSTRICH TRANSPARENT: den 2-px-
// Unterstrich in der Registerfarbe vergibt der Baustein nur im Kontext einer
// `.fc-zeile`. Die Zähler-Zeile der Such-Zone ist keine solche, der gedrückte
// Zustand spricht hier also allein über ✓ und `ink-900` gegen `ink-500`. Das
// ist zulässig und beabsichtigt: das Form-Signal trägt die Aussage (F4), und
// eine zweite Registerfarbe neben den Treffer-Marken im Streifen wäre genau die
// Farbhäufung, die die Handschrift verbietet («Registerfarbe als Strich, nie
// Fläche» — im Streifen ist sie bereits vergeben). Der Platzhalter für den
// Strich steht trotzdem (transparent), die Zeile springt beim Umschalten nicht.
//
// GEOMETRIE — NACHGEMESSEN, nicht gerechnet (21.9.2026, @1440, OR/«Kündigung»):
//   Zone in Ruhe 44 px (`SUCH_H_RUHE`) · Zone aktiv 68 px (`SUCH_H_AKTIV`)
//   Knopf 30 px (13 px Schrift · 1.5 Zeile · 2×4 px Polster · 2 px Strich)
//   Zähler-Zeile 24 px · ‹ ›-Griffe 20 px · Knopf-Unterkante 5 px ÜBER der Zone
// Der Knopf ist damit höher als die `min-h-5`-Zeile (20 px), in der er steht,
// und die Zeile wächst mit ihm auf 24 px. Die ZONE rührt sich trotzdem nicht:
// sie hat eine feste Höhe, und der gewachsene Inhalt bleibt mit 5 px Luft
// darin. Genau darauf kommt es an — `SUCH_H_AKTIV` trägt den Sprung-Offset
// jedes Ankers (LM-003) und ist in `src/tests/leser-v3-fundament.test.ts` wie
// in mehreren e2e-Specs auf den Pixel bewacht. Es war also NICHTS gegen-
// zusteuern; der Versuch, mit `py-0` auf glatte 24 px zu drücken, ist wieder
// gefallen, weil er gar nicht greift: `.fc-schalter` steht ungeschichtet am
// Dateiende von `index.css` und schlägt jede Utility aus `@layer utilities`.
// Eine Klasse, die nichts tut, wird gestrichen statt stehen gelassen (§17).
// Der e2e-Fall (f) misst beide Hälften in EINEM Durchgang — Knopfhöhe ≥ 24 px
// UND Zone unverändert 68 px; er wäre sonst genau das halbe Tor, das eine der
// zwei Zusagen still aufgibt.
//
// A11Y: fester sichtbarer Text + `aria-pressed` (kein wechselndes Label — der
// Name eines Umschalters bleibt gleich, der Zustand steht im Attribut).

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
      className="fc-schalter shrink-0 whitespace-nowrap">
      Hervorhebung
    </button>
  );
}
