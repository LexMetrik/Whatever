import { describe, it, expect } from 'vitest';
import { berechneErbteilung } from '../lib/erbteilung';
import type { ErbteilungInput } from '../types/erbrecht';

// B3-01 (Prüfung Rechtslogik 23.9.2026, Zweitprüfung V4 Abschnitt A):
// Art. 210 Abs. 2 ZGB («Ein Rückschlag wird nicht berücksichtigt») heisst nur,
// dass der ANDERE Ehegatte keine Hälfte des Rückschlags trägt. Die Schulden der
// Errungenschaft des Erblassers bleiben seine Schulden (Art. 202, 209 Abs. 2 ZGB),
// gehen auf die Erben über (Art. 560 Abs. 2 ZGB) und mindern den Nachlass
// (Art. 474 Abs. 2 ZGB). Der Rückschlag des ÜBERLEBENDEN bleibt ausser Betracht:
// der Nachlass übernimmt ihn nicht (Art. 210 Abs. 2, 215 Abs. 1 ZGB).
// Quelle: Fedlex SR 210, https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de, Stand 1.7.2026.

const errungenschaft = (eigengut: number, vsE: number, vsU: number): ErbteilungInput => ({
  todesdatum: '2025-06-01',
  zivilstand: 'verheiratet',
  kinderLebend: 1,
  gueterstand: 'errungenschaftsbeteiligung',
  eigengutErblasser: eigengut,
  vorschlagErblasser: vsE,
  vorschlagUeberlebender: vsU,
});

describe('B3-01 Rückschlag des Erblassers mindert den Nachlass', () => {
  it('E14: Eigengut 100k, Rückschlag Erblasser −50k, Vorschlag Überlebender 100k → Nachlass 100k', () => {
    // 100'000 − 50'000 + 1/2 × 100'000 (Art. 215 Abs. 1) = 100'000
    const r = berechneErbteilung(errungenschaft(100_000, -50_000, 100_000));
    expect(r.nachlassChf).toBe(100_000);
  });

  it('E14: Erb- und Pflichtteile in CHF folgen dem korrigierten Nachlass (Art. 457, 462 Ziff. 1, 471 ZGB)', () => {
    const r = berechneErbteilung(errungenschaft(100_000, -50_000, 100_000));
    const ehegatte = r.erben.find((e) => e.gruppe === 'ehegatte');
    const kind = r.erben.find((e) => e.gruppe === 'nachkommen');
    expect(ehegatte?.erbteilChf).toBe(50_000);
    expect(ehegatte?.pflichtteilChf).toBe(25_000);
    expect(kind?.erbteilChf).toBe(50_000);
    expect(kind?.pflichtteilChf).toBe(25_000);
    expect(r.verfuegbareQuoteChf).toBe(50_000);
  });

  it('beide Ehegatten mit Rückschlag: nur der eigene zählt (100k − 50k + 0 = 50k)', () => {
    const r = berechneErbteilung(errungenschaft(100_000, -50_000, -30_000));
    expect(r.nachlassChf).toBe(50_000);
  });

  it('Rückschlag des Überlebenden bleibt gekappt: 100k + 1/2 × 60k + 0 = 130k', () => {
    const r = berechneErbteilung(errungenschaft(100_000, 60_000, -80_000));
    expect(r.nachlassChf).toBe(130_000);
  });

  it('Rechenweg sagt nicht mehr «zählt 0» für den Rückschlag des Erblassers', () => {
    const r = berechneErbteilung(errungenschaft(100_000, -50_000, 100_000));
    const schritt = r.rechenweg.find((s) => s.beschreibung.includes('Güterrecht'));
    expect(schritt?.zwischenergebnis).not.toMatch(/zählt 0/);
    expect(schritt?.zwischenergebnis).toMatch(/Rückschlag/);
  });
});
