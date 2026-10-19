import { afterEach, describe, expect, it } from 'vitest';
import {
  neueHighlightInstanz, setzeSuchHighlightRanges,
  SUCH_HIGHLIGHT,
} from '../pages/gesetz-leser/suchHighlight';

// LESER-NAV / FB O-36 (g): `new Highlight(...alle)` spreizt jede Range als
// Funktionsargument; ab einigen 100 000 Argumenten wirft die Engine
// «RangeError: Maximum call stack size exceeded» (ganzer OR, Suchwort «e»).
// Das Highlight-Objekt ist setlike (`add`), die Menge muss also nie gespreizt
// werden. Der Test baut das Doppel wie die Browser-API: Konstruktor mit
// Varargs + `add`.

type Doppel = { ranges: unknown[]; add(r: unknown): void; priority?: number };
const g = globalThis as unknown as { CSS?: unknown; Highlight?: unknown };
const vorherCss = g.CSS;
const vorherHl = g.Highlight;

afterEach(() => { g.CSS = vorherCss; g.Highlight = vorherHl; });

function stelleApi() {
  const reg = new Map<string, Doppel>();
  g.CSS = { highlights: reg };
  g.Highlight = class {
    ranges: unknown[];
    constructor(...r: unknown[]) { this.ranges = r; }
    add(r: unknown) { this.ranges.push(r); }
  };
  return reg;
}

describe('Highlight-Registry bei sehr vielen Ranges (O-36 g)', () => {
  it('300 000 Ranges: kein Stack-Überlauf, alle gebucht', () => {
    const reg = stelleApi();
    const inst = neueHighlightInstanz('gross');
    const viele = Array.from({ length: 300_000 }, (_, i) => ({ __name: `r${i}` }) as unknown as Range);
    try {
      expect(() => setzeSuchHighlightRanges(viele, inst)).not.toThrow();
      expect(reg.get(SUCH_HIGHLIGHT)!.ranges).toHaveLength(300_000);
    } finally { setzeSuchHighlightRanges([], inst); }
  });

  it('Grenzfall: genau an der Blockgrenze bleibt vollständig und in Reihenfolge', () => {
    const reg = stelleApi();
    const inst = neueHighlightInstanz('grenze');
    for (const n of [1, 9_999, 10_000, 10_001, 20_000]) {
      const rs = Array.from({ length: n }, (_, i) => ({ __name: `r${i}` }) as unknown as Range);
      setzeSuchHighlightRanges(rs, inst);
      const got = reg.get(SUCH_HIGHLIGHT)!.ranges as Array<{ __name: string }>;
      expect(got).toHaveLength(n);
      expect(got[0].__name).toBe('r0');
      expect(got[n - 1].__name).toBe(`r${n - 1}`);
    }
    setzeSuchHighlightRanges([], inst);
  });
});
