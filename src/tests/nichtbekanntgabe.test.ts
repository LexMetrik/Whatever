import { describe, it, expect } from 'vitest';
import { NB_DEFAULTS, nbFruehesterGesuchstag, pruefeNbGates } from '../lib/vorlagen/nichtbekanntgabe';

// Fristrechnung Gesuch um Nichtbekanntgabe (RL-39, Befund VC-06: bisher ohne
// Test; die Engine rechnete nach dem Wortlaut schon richtig).
//
// Wortlaute (Fedlex-Filestore, abgerufen 25.9.2026):
// - Art. 8a Abs. 3 lit. d SchKG (SR 281.1, Konsolidierung 20260101): Gesuch
//   «nach Ablauf einer Frist von drei Monaten seit der Zustellung des
//   Zahlungsbefehls».
// - Art. 31 SchKG: Für Berechnung, Einhaltung und Lauf der Fristen gelten die
//   Bestimmungen der ZPO.
// - Art. 142 ZPO (SR 272, Konsolidierung 20260701): Abs. 1 Lauf ab dem
//   folgenden Tag; Abs. 2 Monatsfrist endet am Tag «der dieselbe Zahl trägt
//   wie der Tag, an dem die Frist zu laufen begann. Fehlt der entsprechende
//   Tag, so endet die Frist am letzten Tag des Monats.»
// → frühester Gesuchstag = Folgetag des Fristendes.
//
// Bewusst NUR Fälle, deren Fristende auf einen Werktag fällt: ob die
// Werktagsverschiebung (Art. 142 Abs. 3 ZPO) auf diese Wartefrist anwendbar
// ist, ist hier nicht entschieden und wird nicht zementiert (Nebenfund RL-39).

describe('Nichtbekanntgabe — frühester Gesuchstag (Art. 8a Abs. 3 lit. d SchKG / Art. 142 ZPO)', () => {
  it.each([
    // Zustellung → Lauf ab → Fristende (Wochentag) → frühester Gesuchstag
    ['2026-01-15', '2026-04-17'], // Lauf 16.1., Ende Do 16.4.2026
    ['2026-11-30', '2027-03-02'], // Lauf 1.12., Ende Mo 1.3.2027
    ['2026-03-30', '2026-07-01'], // Lauf 31.3., kein 31.6. → Ende Di 30.6.2026 (Klemmung Abs. 2 Satz 2)
    ['2028-11-29', '2029-03-01'], // Lauf 30.11., kein 30.2. → Ende Mi 28.2.2029 (Klemmung)
    ['2026-01-31', '2026-05-02'], // Lauf 1.2., Ende Fr 1.5.2026
  ])('Zustellung %s → frühestens %s', (zustellung, erwartet) => {
    expect(nbFruehesterGesuchstag(zustellung)).toBe(erwartet);
  });

  it('ungültiges Datum → null', () => {
    expect(nbFruehesterGesuchstag('')).toBeNull();
    expect(nbFruehesterGesuchstag('2026-02-30')).toBeNull();
  });

  it('Grenztag: Vortag gesperrt, frühester Tag zulässig', () => {
    const g = (datum: string) => pruefeNbGates({ ...NB_DEFAULTS, zustellungZb: '2026-01-15', rechtsvorschlag: true, datum });
    expect(g('2026-04-16').blocker.join()).toMatch(/erst NACH Ablauf von drei Monaten/);
    expect(g('2026-04-16').blocker.join()).toContain('17.04.2026');
    expect(g('2026-04-17').blocker).toEqual([]);
  });

  it('ohne Rechtsvorschlag: Blocker (Voraussetzung lit. d)', () => {
    const r = pruefeNbGates({ ...NB_DEFAULTS, zustellungZb: '2026-01-15', rechtsvorschlag: false, datum: '2026-05-01' });
    expect(r.blocker.join()).toMatch(/RECHTSVORSCHLAG/);
  });
});
