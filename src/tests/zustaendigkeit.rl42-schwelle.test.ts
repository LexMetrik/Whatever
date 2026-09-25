import { describe, it, expect, vi } from 'vitest';

// RL-42 / VS3-19 (§5): Die Direktklage-Schwelle der Plausibilitäts-Weiche im
// Rechtsmittelzug stammt aus ZPO_SCHWELLEN.DIREKTKLAGE_MIN (Art. 8 Abs. 1 ZPO:
// «sofern der Streitwert mindestens 100 000 Franken beträgt») — nicht aus
// einem zweiten Literal. Beweis: Wird die eine Quelle verschoben, folgen
// Vergleich UND Text. Mit dem früheren Literal (rechtsmittel.ts:262/263
// «100_000» / «CHF 100'000») ist dieser Test rot.
vi.mock('../lib/zustaendigkeit/gemeinsam', async (orig) => {
  const m = await orig<typeof import('../lib/zustaendigkeit/gemeinsam')>();
  return { ...m, ZPO_SCHWELLEN: { ...m.ZPO_SCHWELLEN, DIREKTKLAGE_MIN: 123_456 } };
});

describe('VS3-19 — eine Quelle für die Direktklage-Schwelle', () => {
  it('Vergleich und Text folgen ZPO_SCHWELLEN.DIREKTKLAGE_MIN', async () => {
    const { bestimmeRechtsmittel } = await import('../lib/zustaendigkeit');
    const basis = { streitsache: 'geldforderung', vermoegensrechtlich: true, rmVorinstanz: 'direktklage_oberes_gericht' } as const;
    const unter = bestimmeRechtsmittel({ ...basis, streitwertCHF: 110_000 });
    const w = unter.weichen.find((x) => x.includes('Art. 8 Abs. 1 ZPO'));
    expect(w).toBeDefined();
    expect(w).toContain(`CHF ${(123_456).toLocaleString('de-CH')}`);
    const ueber = bestimmeRechtsmittel({ ...basis, streitwertCHF: 130_000 });
    expect(ueber.weichen.some((x) => x.includes('Art. 8 Abs. 1 ZPO'))).toBe(false);
  });
});
