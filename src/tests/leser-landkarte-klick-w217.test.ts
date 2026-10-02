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
 * `e2e/leser-w228-landkarte.e2e.ts` (Zusage (h)).
 *
 * ROT GEFAHREN (§6.7): in `components/leser/landkarteMasse.ts` den Rumpf von
 * `markeAnAnteil` durch `return null` ersetzt ⇒ «trifft die gezeichnete Marke»
 * wird rot; `LESE_MIN` auf 4 gesetzt ⇒ «Mindesthöhe» wird rot.
 */
import { describe, it, expect } from 'vitest';
import { feldBeiAnteil, landkarteMarken, landkarteSpur, type LandkarteEinheit } from '../components/leser/landkarteModell';
import { HOEHE, LESE_MIN, klickAnteil, leseRechteck, markeAnAnteil, markenHoehe } from '../components/leser/landkarteMasse';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import { gesetzLandkarteEinheiten } from '../pages/gesetz-leser/v3/landkarteGesetz';
import { baueLeserSuchIndex, sucheImErlass } from '../pages/gesetz-leser/leserSuche';

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

  it('überlappende Marken (Ballung): die im Bild OBEN liegende, also später gezeichnete, gewinnt', () => {
    const ms = marken(['a100', 'a102']);
    // a100: 0.100–0.104, a102: 0.102–0.106 (a102 wird später gezeichnet = liegt oben)
    expect(markeAnAnteil(ms, 0.1011)).toBe('a100');
    expect(markeAnAnteil(ms, 0.103)).toBe('a102'); // Überlappung: die obere
    expect(markeAnAnteil(ms, 0.1035)).toBe('a102');
    expect(markeAnAnteil(ms, 0.105)).toBe('a102');
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

/**
 * ZÄHLSONDE (Gegenprüfung #1278, Ziel 0): für JEDE Pixelzeile, deren Mitte in der
 * gezeichneten Fläche mindestens einer Marke liegt, muss der Klick auf diese Zeile
 * die im Bild oben liegende Marke dieser Zeile treffen. Gezählt werden die
 * Abweichungen — an den echten Spuren OR «Kündigung» und ZGB «Erbe», in einem
 * Streifen von 702 px Höhe mit gebrochenem Versatz (die Kanten liegen auf
 * halben Pixeln).
 */
describe('B12-B01 · Zählsonde: jede Pixelzeile einer Marke trifft ihre Marke', () => {
  const HOEHE_PX = 700;
  const OBEN_PX = 174.5;
  function sonde(key: string, begriff: string, alt: boolean) {
    const { eintraege, struktur } = ladeNormFixture('bund', key);
    const spur = landkarteSpur(gesetzLandkarteEinheiten(eintraege, struktur));
    const treffer = sucheImErlass(baueLeserSuchIndex(key, eintraege, struktur), begriff);
    const ms = landkarteMarken(spur, treffer.map((t) => ({ id: t.token, anzahl: t.fundstellen })));
    // Gezeichnete Rechtecke in Pixeln.
    const rect = ms.map((m) => ({
      id: m.id, y0: OBEN_PX + m.von * HOEHE_PX,
      y1: OBEN_PX + m.von * HOEHE_PX + markenHoehe(m.von, m.bis) * (HOEHE_PX / HOEHE),
    }));
    let zeilen = 0; let falsch = 0;
    const gesehen = new Set<number>();
    for (const r of rect) {
      for (let zeile = Math.floor(r.y0) - 1; zeile <= Math.ceil(r.y1) + 1; zeile++) {
        if (gesehen.has(zeile)) continue;
        gesehen.add(zeile);
        const mitte = zeile + 0.5;
        let oben: string | null = null;
        for (const q of rect) if (mitte >= q.y0 && mitte < q.y1) oben = q.id;
        if (oben === null) continue; // keine Marke in dieser Zeile
        zeilen++;
        const anteil = alt ? (zeile - OBEN_PX) / HOEHE_PX : klickAnteil(zeile, OBEN_PX, HOEHE_PX);
        if ((markeAnAnteil(ms, anteil) ?? feldBeiAnteil(spur, anteil)?.id) !== oben) falsch++;
      }
    }
    return { marken: ms.length, zeilen, falsch };
  }

  for (const [key, begriff] of [['OR', 'Kündigung'], ['ZGB', 'Erbe']] as const) {
    it(`${key} «${begriff}»: 0 Pixelzeilen führen nicht zur Marke`, () => {
      const nachher = sonde(key, begriff, false);
      expect(nachher.marken, 'keine Marken — Sonde ohne Aussage (§6.7)').toBeGreaterThan(50);
      expect(nachher.falsch, `${nachher.falsch} von ${nachher.zeilen} Pixelzeilen`).toBe(0);
      // Rot-Beweis im Test selbst (§6.7): mit der alten Lage (ganzzahliges clientY ohne
      // halben Pixel) zählt dieselbe Sonde viele Abweichungen — sie KANN scheitern.
      expect(sonde(key, begriff, true).falsch).toBeGreaterThan(10);
    });
  }
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
