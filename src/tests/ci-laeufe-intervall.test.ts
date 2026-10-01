// src/tests/ci-laeufe-intervall.test.ts — Intervall-Ermittlung des Wächters
// über die geplanten Workflow-Läufe (scripts/check-ci-laeufe.ts).
//
// ANLASS 1.10.2026 (QS-MONITOR-ROT): der Wächter meldete
// «rechtsprechung-wochenlauf.yml: jüngster erfolgreicher Lauf ist 73.2 h alt
// (Intervall 24 h, Kulanz 48 h)». Der Workflow hat zwei Crons — wöchentlich
// ('37 5 * * 1') und am 3. des Monats ('41 2 3 * *') —; der Monats-Cron fiel
// in den Default «täglich» (24 h), und das Minimum aus beiden drückte die
// Kulanz auf 48 h. Falschalarm; ein Monats-Cron ist selten, nicht täglich.
import { describe, expect, it } from 'vitest';
import { intervallDerCrons, intervallStunden } from '../../scripts/check-ci-laeufe.ts';

describe('intervallStunden', () => {
  it.each([
    ['17 7 * * *', 24],
    ['37 5 * * 1', 24 * 7],
    ['0 */6 * * *', 6],
    ['43 */6 * * *', 6],
    ['*/10 * * * *', 1],
    ['0 * * * *', 1],
  ])('%s → %i h', (cron, h) => expect(intervallStunden(cron)).toBe(h));

  it.each(['41 2 3 * *', '11 4 1 * *', '0 0 15 6 *'])(
    'Monats-/Jahres-Cron %s ist mindestens monatlich, nicht täglich',
    (cron) => expect(intervallStunden(cron)).toBeGreaterThanOrEqual(24 * 28),
  );
});

describe('intervallDerCrons', () => {
  it('Wochenlauf (wöchentlich + 3. des Monats) → 168 h, nicht 24 h', () =>
    expect(intervallDerCrons(['37 5 * * 1', '41 2 3 * *'])).toBe(24 * 7));
  it('Reihenfolge der Crons ist gleichgültig', () =>
    expect(intervallDerCrons(['41 2 3 * *', '37 5 * * 1'])).toBe(24 * 7));
  it('allein stehender Monats-Cron → monatlich', () =>
    expect(intervallDerCrons(['41 2 3 * *'])).toBeGreaterThanOrEqual(24 * 28));
});
