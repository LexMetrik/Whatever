// W2·17-UI-BEFUNDE E-D2-B01/B02 (1.10.2026): Gliederung und Marken-Beschriftung
// des Gesetzeslesers folgen dem Snapshot, nicht einer erfundenen Ordnung.
import { describe, it, expect } from 'vitest';
import { stufenFuer, markenAnzeige } from '../components/normtext/ArtikelBody.helfer';

const m = (...marken: string[]) => marken.map((marke) => ({ marke }));

describe('E-D2-B01 stufenFuer ohne tiefe — Ziff.→lit. (Kanton, lit. UNTER Ziff.)', () => {
  it('«1 a b c 2 3» (AR-822.111 Art. 1): Ziff. aussen, lit. innen', () => {
    expect(stufenFuer(m('1', 'a', 'b', 'c', '2', '3'))).toEqual([0, 1, 1, 1, 0, 0]);
  });

  it('wiederholte lit.-Gruppen unter mehreren Ziff.: «1 a b 2 a b 3»', () => {
    expect(stufenFuer(m('1', 'a', 'b', '2', 'a', 'b', '3'))).toEqual([0, 1, 1, 0, 1, 1, 0]);
  });

  it('Gedankenstrich bleibt eine Stufe unter dem vorausgehenden Item', () => {
    expect(stufenFuer(m('1', 'a', '–', 'b', '2'))).toEqual([0, 1, 2, 1, 0]);
  });

  it('Bund-Muster «a 1 2 b» (lit. aussen, Ziff. innen) bleibt unverändert', () => {
    expect(stufenFuer(m('a', '1', '2', 'b'))).toEqual([0, 1, 1, 0]);
  });

  it('nur lit. / nur Ziff. bleiben flach', () => {
    expect(stufenFuer(m('a', 'b', 'c'))).toEqual([0, 0, 0]);
    expect(stufenFuer(m('1', '2', '3'))).toEqual([0, 0, 0]);
  });

  it('Fortsetzungs-Kette: Ziff.-Folge ohne lit. davor bleibt flach, lit. danach innen', () => {
    expect(stufenFuer(m('1', '2', 'a', 'b'))).toEqual([0, 0, 1, 1]);
  });

  it('explizite tiefe schlägt die Heuristik', () => {
    expect(stufenFuer([{ marke: '1', tiefe: 0 }, { marke: 'a', tiefe: 0 }, { marke: '2', tiefe: 0 }])).toEqual([0, 0, 0]);
  });
});

describe('E-D2-B02 markenAnzeige ohne Trenner — kein Satzzeichen auf Satzzeichen', () => {
  it('Phrasen-Marke endet auf «:» → kein erfundener Punkt (NE-16631 Art. 14)', () => {
    expect(markenAnzeige('1. Légalisation de signature:')).toBe('1. Légalisation de signature:');
  });

  it('endet auf «.» / «)» → unverändert', () => {
    expect(markenAnzeige('1.')).toBe('1.');
    expect(markenAnzeige('a)')).toBe('a)');
  });

  it('gewöhnliche Marken behalten ihren Punkt', () => {
    expect(markenAnzeige('a')).toBe('a.');
    expect(markenAnzeige('2bis')).toBe('2bis.');
  });

  it('Label-Marken: Doppelpunkt nur, wenn noch kein Satzzeichen da ist (PR #658 unverändert)', () => {
    expect(markenAnzeige('BE')).toBe('BE:');
    expect(markenAnzeige('BE:')).toBe('BE:');
    expect(markenAnzeige('A)')).toBe('A)');
  });

  it('amtlicher Trenner bleibt verbatim', () => {
    expect(markenAnzeige('a', ')')).toBe('a)');
    expect(markenAnzeige('BAS', '')).toBe('BAS');
  });
});
