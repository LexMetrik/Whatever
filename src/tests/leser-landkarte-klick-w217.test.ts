/**
 * W2·17-UI-BEFUNDE · PE-B12-B01 / PE-B12-D02 — wo ein Klick auf die Landkarte
 * trifft, und wie die Leseposition gezeichnet wird.
 *
 * B12-B01: die Marke wird mit Mindesthöhe GEZEICHNET (`markenHoehe`), das Feld
 * des Artikels belegt aber nur seinen Textumfang. Ein Klick in die Mitte der
 * gezeichneten Marke fiel darum in ein SPÄTERES Feld und sprang zum Nachbarn
 * (gemessen OR «Kündigung»: Art. 255 → 257d, 266g → 267, 318 → 320, 704b → 706).
 * Die Fälle hier sind synthetisch und stellen genau dieses Verhältnis nach —
 * viele winzige Felder, eine Marke darin — damit die Aussage nicht an einem
 * Korpusstand hängt. Die Browser-Probe steht in
 * `e2e/leser-landkarte-nachbarn-w217.e2e.ts`.
 *
 * ROT GEFAHREN (§6.7): in `components/leser/landkarteMasse.ts` den Rumpf von
 * `markeAnAnteil` durch `return null` ersetzt ⇒ «trifft die gezeichnete Marke»
 * wird rot; `LESE_MIN` auf 4 gesetzt ⇒ «Mindesthöhe» wird rot.
 */
import { describe, it, expect } from 'vitest';
import { feldBeiAnteil, landkarteMarken, landkarteSpur, type LandkarteEinheit } from '../components/leser/landkarteModell';
import { HOEHE, LESE_MIN, leseRechteck, markeAnAnteil, markenHoehe } from '../components/leser/landkarteMasse';

/** 1000 gleich lange Artikel: jedes Feld 1 Einheit hoch, weniger als `MARKE_MIN` (4). */
const FELDER: LandkarteEinheit[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `a${i}`, label: `Art. ${i + 1}`, umfang: 100, abschnitt: null,
}));
const spur = landkarteSpur(FELDER);
const marken = (ids: string[]) => landkarteMarken(spur, ids.map((id) => ({ id, anzahl: 1 })));
/** Anteilige Mitte der GEZEICHNETEN Marke. */
const mitte = (m: { von: number; bis: number }) => m.von + markenHoehe(m.von, m.bis) / HOEHE / 2;

describe('B12-B01 · der Klick trifft die gezeichnete Marke, nicht das Feld unter ihrer Mitte', () => {
  it('Vorbedingung: die gezeichnete Mitte liegt im FELD eines Nachbarn (der Befund)', () => {
    const [m] = marken(['a500']);
    expect(feldBeiAnteil(spur, mitte(m))!.id, 'die Mitte der Marke liegt noch im eigenen Feld — Fall ohne Aussage (§6.7)')
      .not.toBe('a500');
  });

  it('die Mitte der gezeichneten Marke löst die Marke aus', () => {
    const ms = marken(['a500']);
    expect(markeAnAnteil(ms, mitte(ms[0]))).toBe('a500');
  });

  it('Anfang und Ende der gezeichneten Fläche gehören zur Marke, ein Stück darüber und darunter nicht', () => {
    const ms = marken(['a500']);
    const { von } = ms[0];
    const ende = von + markenHoehe(ms[0].von, ms[0].bis) / HOEHE;
    expect(markeAnAnteil(ms, von + 1e-9)).toBe('a500');
    expect(markeAnAnteil(ms, ende - 1e-9)).toBe('a500');
    expect(markeAnAnteil(ms, von - 1e-4)).toBeNull();
    expect(markeAnAnteil(ms, ende + 1e-4)).toBeNull();
  });

  it('überlappende Marken (Ballung): die, deren gezeichnete Mitte dem Klick am nächsten liegt', () => {
    const ms = marken(['a100', 'a102']);
    // a100: 0.100–0.104, Mitte 0.102 · a102: 0.102–0.106, Mitte 0.104
    expect(markeAnAnteil(ms, 0.1011)).toBe('a100');
    expect(markeAnAnteil(ms, 0.1035)).toBe('a102');
    // Gleichstand ⇒ die frühere (Dokumentreihenfolge)
    expect(markeAnAnteil(ms, 0.103)).toBe('a100');
  });

  it('der Klick zwischen den Marken trifft keine — dann entscheidet das Feld', () => {
    const ms = marken(['a100', 'a800']);
    expect(markeAnAnteil(ms, 0.5)).toBeNull();
    expect(feldBeiAnteil(spur, 0.5)).not.toBeNull();
  });

  it('ohne Marken kein Treffer', () => {
    expect(markeAnAnteil([], 0.5)).toBeNull();
  });

  it('ein hohes Feld (Entscheid-Erwägung): die gedeckelte Marke trifft sich selbst', () => {
    const gross = landkarteSpur([
      { id: 'x', label: 'E. 1', umfang: 100, abschnitt: null },
      { id: 'y', label: 'E. 2', umfang: 800, abschnitt: null },
      { id: 'z', label: 'E. 3', umfang: 100, abschnitt: null },
    ]);
    const ms = landkarteMarken(gross, [{ id: 'y', anzahl: 3 }]);
    expect(markeAnAnteil(ms, mitte(ms[0]))).toBe('y');
    // Die Fläche UNTER der gedeckelten Marke ist noch im Feld, aber nicht mehr Marke.
    expect(markeAnAnteil(ms, 0.8)).toBeNull();
    expect(feldBeiAnteil(gross, 0.8)!.id).toBe('y');
  });
});

describe('B12-D02 · die Leseposition ist gross genug, um gesehen zu werden', () => {
  it('ein Artikel mit weniger als LESE_MIN Einheiten bekommt LESE_MIN (nicht die 4 der Marken)', () => {
    const [f] = spur;
    const { h } = leseRechteck(f.von, f.bis);
    expect(h).toBe(LESE_MIN);
    expect(h).toBeGreaterThan(markenHoehe(f.von, f.bis));
  });

  it('ein grosses Feld behält seinen Anteil (keine Verkleinerung)', () => {
    const { y, h } = leseRechteck(0.2, 0.5);
    expect(y).toBeCloseTo(200, 6);
    expect(h).toBeCloseTo(300, 6);
  });

  it('am unteren Streifenrand wird nach OBEN geklemmt, das Rechteck ragt nie aus dem Bild', () => {
    const letztes = spur[spur.length - 1];
    const { y, h } = leseRechteck(letztes.von, letztes.bis);
    expect(y + h).toBeLessThanOrEqual(HOEHE);
    expect(y + h).toBeCloseTo(HOEHE, 6);
    // …und deckt weiterhin das Feld selbst ab.
    expect(y).toBeLessThanOrEqual(letztes.von * HOEHE);
  });
});
