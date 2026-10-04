import { useState } from 'react';

/**
 * Steht die Trefferliste gerade über der Lesespalte? (D38 — die Fläche selbst
 * und die Herleitung des Befunds stehen in `./LeserTrefferSpalte`.)
 *
 * Sie erscheint SELBST, sobald im Suchfeld etwas steht: wer sucht, will das
 * Ergebnis sehen, nicht erst einen Knopf finden. Sie weicht, sobald der Leser
 * ein Ziel gewählt hat (Klick auf eine Trefferzeile, Enter im Feld, Esc in der
 * Liste) — und kommt zurück, wenn er die Eingabe ÄNDERT oder die Liste über die
 * Zähler-Zeile am Feld («Treffer anzeigen →») ausdrücklich zurückholt.
 *
 * KEIN EFFEKT, kein Zurücksetzen im Render-Nachlauf: gemerkt wird nicht «weg ja/
 * nein», sondern FÜR WELCHEN BEGRIFF sie weggenommen wurde. Damit ergibt sich
 * der Zustand deterministisch aus Begriff + Merkwert (§2) — dasselbe Muster, mit
 * dem `LeserTrefferListe` ihren Aufklapp-Deckel beim Begriffswechsel verwirft
 * (`gemerkt.begriff === begriff`), und es umgeht die Kaskaden-Render-Falle
 * (`react-hooks/set-state-in-effect`).
 *
 * VORGESCHICHTE: dieselbe Mechanik hiess bis D38 `useTrefferBlatt` und trug das
 * Blatt am Suchfeld (Ä76, 17.8.2026). Das Blatt ist mit D38 gefallen — die Liste
 * hat jetzt die Lesefläche, nicht einen 18-rem-Zettel daneben. Geblieben ist die
 * FRAGE, die der Hook beantwortet, und sie ist wörtlich dieselbe.
 *
 * EIGENE DATEI, nicht bei der Komponente: `react-refresh/only-export-components`
 * lässt neben einer Komponente keinen zweiten Export zu (Lint-Fehler beim Bau
 * gesehen, 17.8.2026) — und die Trennung folgt ohnehin dem Haus-Muster
 * (`usePopoverAutoZu.ts`, `suchKuerzel.ts`, `kopfStufen.ts`).
 */
export function useTrefferSicht(begriff: string) {
  const [wegFuer, setWegFuer] = useState<string | null>(null);
  // ── W2·17-UI-BEFUNDE · PE-C4-B02 / PE-C5-B02 (1.10.2026) · LEEREN VERGISST ──
  // Der Merkwert stand über das Leeren hinweg: «Kündigung» → Enter (Liste weg)
  // → Feld leeren → «Kündigung» erneut → `wegFuer === begriff`, die Liste blieb
  // weg (gemessen `sicht.mjs`, OR @1280: Zähler-Zeile 1 statt 0) — gegen den
  // Vertrag oben («erscheint SELBST, sobald im Suchfeld etwas steht»). Ein
  // leeres Feld ist ein neuer Anfang: der Merkwert wird dann beim Render
  // verworfen (bedingt, endet nach einem Durchlauf — kein Effekt, derselbe
  // Weg wie `useMarkenSchalter` in `../inhalt-suchtreffer`). Der Aufrufer übergibt
  // `suche.trim()`, Nur-Leerraum zählt damit als leer.
  if (begriff === '' && wegFuer !== null) setWegFuer(null);
  return {
    /** Sichtbar, solange für DIESEN Begriff nicht weggeschaltet wurde. */
    offen: wegFuer !== begriff,
    /** Sprung, Enter oder Esc — nimmt die Liste, ohne die Suche zu verlieren. */
    schliesse: () => setWegFuer(begriff),
    /** «Treffer anzeigen →» in der Zähler-Zeile holt sie zurück. */
    oeffne: () => setWegFuer(null),
  };
}
