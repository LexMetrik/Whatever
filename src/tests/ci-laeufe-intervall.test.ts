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
import { hinzugefuegtAm, intervallDerCrons, intervallStunden, neuOhneLaufRot } from '../../scripts/check-ci-laeufe.ts';

describe('intervallStunden', () => {
  it.each([
    ['17 7 * * *', 24],
    ['37 5 * * 1', 24 * 7],
    // POSIX/GitHub: Tag UND Wochentag gesetzt = am Tag ODER am Wochentag → wöchentlich
    ['0 0 1 * 1', 24 * 7],
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

// ANLASS 1.10.2026 (QS-MONITOR-ROT, PR #1241): ein NEU angelegter Workflow
// (normen-monatslauf.yml, Crons nur am 1. des Monats) hat bis zum ersten Termin
// keinen Lauf — «kein einziger abgeschlossener Lauf» wäre einen Monat lang
// tägliches Falsch-Rot. ROT erst, wenn die Datei älter ist als die Kulanz
// (2 × Intervall); unbekanntes Alter (flacher Checkout, keine Historie) bleibt
// ROT — lieber falscher Alarm als stilles Grün.
describe('neuOhneLaufRot', () => {
  const kulanz = 2 * intervallStunden('11 4 1 * *'); // 1488 h
  it('Datei jünger als die Kulanz → noch nicht rot', () => {
    expect(neuOhneLaufRot(0, kulanz)).toBe(false);
    expect(neuOhneLaufRot(30 * 24, kulanz)).toBe(false);
  });
  it('Datei älter als die Kulanz → rot', () => {
    expect(neuOhneLaufRot(kulanz + 1, kulanz)).toBe(true);
    expect(neuOhneLaufRot(200 * 24, kulanz)).toBe(true);
  });
  it('Alter unbekannt (null) → rot', () => expect(neuOhneLaufRot(null, kulanz)).toBe(true));
  it('täglicher Workflow: nach 3 Tagen rot, nach 1 Tag nicht', () => {
    expect(neuOhneLaufRot(24, 48)).toBe(false);
    expect(neuOhneLaufRot(72, 48)).toBe(true);
  });
  it('Grenzfall: Alter == Kulanz → noch nicht rot', () => expect(neuOhneLaufRot(kulanz, kulanz)).toBe(false));
});

// Die Flach-Klon-Wache trägt die Fail-closed-Eigenschaft: im flachen Klon ist jede Datei
// «neu» (ein Commit) — ohne Wache wäre der Wächter dort falsch-grün. git wird injiziert.
describe('hinzugefuegtAm', () => {
  const fake = (flach: string, ct: string) => (...a: string[]) =>
    a[0] === 'rev-parse' ? flach : a[0] === 'log' ? ct : 'unerwartet';
  it("flacher Klon ('true') → null, auch mit gültigem Zeitstempel", () =>
    expect(hinzugefuegtAm('x.yml', fake('true', '1700000000'))).toBeNull());
  it("is-shallow fehlgeschlagen ('') → null", () =>
    expect(hinzugefuegtAm('x.yml', fake('', '1700000000'))).toBeNull());
  it("voller Klon ('false') + Zeitstempel → ms", () =>
    expect(hinzugefuegtAm('x.yml', fake('false', '1700000000'))).toBe(1_700_000_000_000));
  it("voller Klon ('false') + leerer Log (nie hinzugefügt) → null", () =>
    expect(hinzugefuegtAm('x.yml', fake('false', ''))).toBeNull());
});
