// Bewertete OR-TTI des Perf-Budget-Tors (Entscheid David 5.10.2026,
// «ja, TTI normieren wie TBT»). Reine Funktion aus scripts/perf/tti-bewertung.ts;
// der Deckel 13000 ms und die Messtabelle stehen in scripts/perf/lighthouse-budget.ts.

import { describe, expect, it } from 'vitest';
import { bewerteTti } from '../../scripts/perf/tti-bewertung';

const DECKEL = 13000;

describe('bewerteTti — Blockier-Anteil, nur zugunsten langsamer Runner', () => {
  it('der Fehlschlag vom 5.10.2026 (roh 13609, Faktor 1.249, TBT roh 5529) wird grün', () => {
    const r = bewerteTti(13609, 5529, 1.249);
    expect(r.normiert).toBe(true);
    expect(r.bewertet).toBeCloseTo(13609 - 5529 + 5529 / 1.249, 6);
    expect(r.bewertet).toBeGreaterThan(12500);
    expect(r.bewertet).toBeLessThan(12510);
    expect(r.bewertet).toBeLessThanOrEqual(DECKEL);
  });

  it('der Fehlschlag vom 4.10.2026 (roh 13091, Faktor 1.257, TBT roh 5075) wird grün', () => {
    expect(bewerteTti(13091, 5075, 1.257).bewertet).toBeLessThanOrEqual(DECKEL);
  });

  it('Fallback: ohne plausiblen Faktor gilt der Rohwert — 13609 bleibt rot', () => {
    for (const faktor of [undefined, Number.NaN, 0, -1, Number.POSITIVE_INFINITY]) {
      const r = bewerteTti(13609, 5529, faktor);
      expect(r.normiert).toBe(false);
      expect(r.bewertet).toBe(13609);
      expect(r.bewertet).toBeGreaterThan(DECKEL);
    }
  });

  it('schneller Runner (Faktor < 1): nichts wird hochgerechnet — Rohwert bleibt', () => {
    // Faktor 0.36 (Reihe 20.7.2026): tti/faktor ergäbe 31.6 s, hier bleibt es bei roh.
    const r = bewerteTti(11383, 3034, 0.36);
    expect(r.normiert).toBe(true);
    expect(r.bewertet).toBe(11383);
    // Grenzfall Faktor 1: ebenfalls unverändert.
    expect(bewerteTti(12000, 5000, 1).bewertet).toBe(12000);
    // Ein roher Wert über dem Deckel auf einem schnellen Runner bleibt rot (kein Durchwinken).
    expect(bewerteTti(13200, 4000, 0.7).bewertet).toBeGreaterThan(DECKEL);
  });

  it('echter Regress bleibt sichtbar: mehr Netz-/Ladezeit wird nicht wegnormiert', () => {
    // Gleicher Runner (1.25), TTI +2 s ohne TBT-Änderung ⇒ bewertet steigt um +2 s.
    const basis = bewerteTti(12100, 4600, 1.25).bewertet;
    const regress = bewerteTti(14100, 4600, 1.25).bewertet;
    expect(regress - basis).toBeCloseTo(2000, 6);
    expect(regress).toBeGreaterThan(DECKEL);
  });

  it('monoton: höherer Faktor ⇒ nie höher bewertet (bei gleichen Rohwerten)', () => {
    const a = bewerteTti(12500, 5000, 1.0).bewertet;
    const b = bewerteTti(12500, 5000, 1.3).bewertet;
    expect(b).toBeLessThan(a);
  });
});
