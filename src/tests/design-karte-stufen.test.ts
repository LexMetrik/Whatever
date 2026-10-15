// @vitest-environment node
// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- ambiente Deklaration eines anderen tsconfig-Projekts, kein Modul (nicht importierbar)
/// <reference path="../../scripts/fremdmodule.d.ts" />
// ═══ LESER-NAV · O-44 · Schweizkarte: die drei Erfassungsgrad-Stufen sind unterscheidbar
//
// Befund (FEHLERBESTAND O-44): im Dunkel waren «vollständig», «Auswahl» und «dünn»
// kaum zu trennen. Gemessen 15.10.2026 (WCAG-Formel, `scripts/farbwelt-messung.ts`,
// aufgelöst aus `src/index.css`): dunkel voll/Auswahl 1.29:1 und Auswahl/dünn 1.27:1
// (hell 1.60 / 1.49). Die Stufen trennt allein die Helligkeit (nie der Farbton, damit
// Rot-Grün-Schwäche sie trägt); die Kante gegen «vollständig» deckelt, wie hell «voll»
// werden darf (Kantonskarte-Pflichtpaare in `check:farbwelt`, ≥ 3:1).
//
// Diese Probe fixiert beide Hälften zugleich: Stufenabstand UND Kantenluft — wer eine
// Hälfte verschiebt, sieht die andere rot (§6.7: der Wächter scheitert an der
// Vorher-Form, dunkel 1.29/1.27).
//
// ROT ZU BEKOMMEN: in `design/tokens.json` `karte-voll`/`karte-auswahl`/`karte-duenn`
// dunkel auf die Werte vom 29.8.2026 zurücksetzen (hsl(215 40% 34%) · 34% 27% · 28% 20%)
// und `npm run gen:tokens` ⇒ «Stufenabstand dunkel» meldet 1.29 und 1.27.
import { describe, it, expect } from 'vitest';
import { kontrast, type Mode } from '../../scripts/farbwelt-messung';

const MODI: Mode[] = ['hell', 'dunkel'];
/** Mindestabstand zweier Nachbarstufen. Hell liegt er bei 1.49; dunkel ist er durch die Kante gedeckelt. */
const STUFE_MIN = 1.4;

describe('O-44 · Erfassungsgrad-Stufen der Schweizkarte', () => {
  for (const modus of MODI) {
    it(`Stufenabstand ${modus}: voll/Auswahl und Auswahl/dünn ≥ ${STUFE_MIN}:1`, () => {
      const voll = kontrast('karte-voll', 'karte-auswahl', modus);
      const aus = kontrast('karte-auswahl', 'karte-duenn', modus);
      expect(voll, `voll/Auswahl ${modus}`).toBeGreaterThanOrEqual(STUFE_MIN);
      expect(aus, `Auswahl/dünn ${modus}`).toBeGreaterThanOrEqual(STUFE_MIN);
    });

    it(`Kante trennt jede Stufe ${modus}: ≥ 3:1 (WCAG 1.4.11)`, () => {
      for (const stufe of ['karte-voll', 'karte-auswahl', 'karte-duenn', 'karte-leer']) {
        expect(kontrast('karte-kante', stufe, modus), `Kante/${stufe} ${modus}`).toBeGreaterThanOrEqual(3);
      }
    });

    it(`«dünn» bleibt von «keine Erlasse» (Schraffur) auch in der Helligkeit getrennt ${modus}`, () => {
      expect(kontrast('karte-duenn', 'karte-leer', modus)).toBeGreaterThanOrEqual(1.2);
    });
  }
});
