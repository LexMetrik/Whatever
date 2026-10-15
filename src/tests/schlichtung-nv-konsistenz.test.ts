import { describe, it, expect } from 'vitest';
import { SCHLICHTUNG } from '../data/tarif/schlichtung';
import { SCHLICHTUNG_NV } from '../data/tarif/nicht-vermoegensrechtlich';

// RL-36 (RV-27): Der AI-Schlichtungsrahmen stand in zwei Tarif-Tabellen mit
// verschiedenen Zahlen (schlichtung.ts 100–1000, nicht-vermoegensrechtlich.ts
// 50–500). Amtlich: GGV AI (GS 173.810) Art. 7, Version 1.1.2024 — lit. a
// aufgehoben; lit. b Klagebewilligung 200–1000, lit. c Urteilsvorschlag/
// Entscheid 300–1000, lit. d Einigung/Rückzug/Säumnis 100–600 → Gesamtrahmen
// 100–1000 (https://ai.clex.ch/app/de/texts_of_law/173.810, abgerufen 15.10.2026).
describe('AI Schlichtung — eine Zahl in beiden Tarif-Tabellen (§5, GGV AI Art. 7)', () => {
  it('SCHLICHTUNG.AI = 100–1000, amtlich belegt (doppelt)', () => {
    const t = SCHLICHTUNG.AI;
    expect(t.regel).toEqual({ typ: 'rahmen', vonChf: 100, bisChf: 1000 });
    expect(t.verifiziert).toBe('doppelt');
    expect(t.quelleUrl).toBe('https://ai.clex.ch/app/de/texts_of_law/173.810');
    expect(t.hinweis).toContain('100–600');
  });

  it('SCHLICHTUNG_NV.AI trägt denselben Rahmen wie SCHLICHTUNG.AI (kein 50–500 mehr)', () => {
    expect(SCHLICHTUNG_NV.AI.regel).toEqual(SCHLICHTUNG.AI.regel);
    expect(SCHLICHTUNG_NV.AI.regel).toEqual({ typ: 'rahmen', vonChf: 100, bisChf: 1000 });
    expect(SCHLICHTUNG_NV.AI.hinweis).toContain('200–1000');
  });

  it('VS: nv-Rahmen 50–350 = Art. 15 Abs. 1 LTar (Vorladung 50–100 + Sitzung 120–250); Abs. 2 nur vermögensrechtlich', () => {
    expect(SCHLICHTUNG_NV.VS.regel).toEqual({ typ: 'rahmen', vonChf: 50, bisChf: 350 });
    expect(SCHLICHTUNG_NV.VS.hinweis).toContain('Abs. 1 lit. a');
    expect(SCHLICHTUNG_NV.VS.hinweis).toContain('120–250');
    expect(SCHLICHTUNG_NV.VS.hinweis).toContain('vermögensrechtliche');
  });
});
