import { describe, it, expect } from 'vitest';
import { randSeite, schubZiel, RAND_PX } from '../components/layout/reiterleiste/randschub';

// ── W2·18 Welle 3 Punkt 2 (Fahrplan §4.R3) · DIE RECHNUNG HINTER DEM
//    RAND-SCHUB ──────────────────────────────────────────────────────────────
//
// Geprüft wird hier, was ohne Browser prüfbar ist: die Zonen-Einteilung und
// die Anschläge. Das Verhalten am echten Streifen (15 Reiter @1024, Reiter 12
// wandert auf Platz 1) misst `e2e/w224-reiter-umordnen-d16.e2e.ts`.
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `randschub.ts` die Zonen-Deckelung
// `Math.min(rand, breite / 2)` durch `rand` ersetzen ⇒ der Fall «schmaler
// Streifen» meldet für die Mitte «links» statt der richtigen Seite; oder die
// Anschlagsprüfung `j < 0 || j >= ordnung.length` streichen ⇒ der Reiter läuft
// am Ende um.

const KASTEN = { left: 100, right: 500 };

describe('randSeite — wo der Zeiger den Schub auslöst', () => {
  it('in der Mitte passiert nichts', () => {
    expect(randSeite(300, KASTEN)).toBe(null);
  });

  it('die Randzone ist RAND_PX breit — innen ja, einen Pixel weiter nicht', () => {
    expect(randSeite(KASTEN.left + RAND_PX, KASTEN)).toBe('links');
    expect(randSeite(KASTEN.left + RAND_PX + 1, KASTEN)).toBe(null);
    expect(randSeite(KASTEN.right - RAND_PX, KASTEN)).toBe('rechts');
    expect(randSeite(KASTEN.right - RAND_PX - 1, KASTEN)).toBe(null);
  });

  it('auf der Kante selbst gilt die jeweilige Seite', () => {
    expect(randSeite(KASTEN.left, KASTEN)).toBe('links');
    expect(randSeite(KASTEN.right, KASTEN)).toBe('rechts');
  });

  // Ein Streifen, der schmaler ist als zwei Randzonen (GEMESSEN @320: 171 px
  // Streifen, also breiter — aber im Split-View mit zwei Panes wird er es
  // nicht bleiben): ohne Deckelung überlappten die Zonen, und die Reihenfolge
  // der beiden Abfragen entschiede still über die Richtung.
  it('am schmalen Streifen überlappen die Zonen nicht', () => {
    const schmal = { left: 0, right: 40 };
    expect(randSeite(19, schmal)).toBe('links');
    expect(randSeite(21, schmal)).toBe('rechts');
  });
});

describe('schubZiel — ein Platz je Takt, kein Umlauf', () => {
  const O = ['a', 'b', 'c', 'd'];

  it('nach links: der Reiter geht VOR seinen linken Nachbarn', () => {
    expect(schubZiel(O, 'c', true)).toEqual({ ziel: 'b', davor: true });
  });

  it('nach rechts: er geht HINTER seinen rechten Nachbarn', () => {
    expect(schubZiel(O, 'c', false)).toEqual({ ziel: 'd', davor: false });
  });

  it('am linken Anschlag steht der Takt still', () => {
    expect(schubZiel(O, 'a', true)).toBe(null);
  });

  it('am rechten Anschlag ebenso — kein Umlauf ans andere Ende', () => {
    expect(schubZiel(O, 'd', false)).toBe(null);
  });

  it('ein Reiter, den es nicht (mehr) gibt, schiebt nichts', () => {
    expect(schubZiel(O, 'z', true)).toBe(null);
  });
});
