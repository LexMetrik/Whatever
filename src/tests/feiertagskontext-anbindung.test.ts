// ─── Landung Paket 5: Feiertags-Kontext an Aufrufstellen der Pakete 2/3 ─────
//
// W2·30-RL-W2A. Die Feiertags-Commits (RL-22/22c/23) setzen die Voreinstellung
// von istFeiertag/normalisiereEnde auf 'allgemein' (bedingte kantonale Tage
// zählen nicht). Stellen, die die Pakete 2 (RL-17, Fristenspiegel) und 3
// (RL-24, Vertragsfrist, A-Post-Plus-Hinweis) NACH dem Bau der Feiertags-
// Commits eingeführt haben, erhielten dadurch still diese Voreinstellung.
// Soll-Werte aus dem Normtext nachgerechnet:
//  - Vertragsfrist (Art. 78 Abs. 1 OR): Samstag ist Werktag — der Warnsatz zu
//    einem NE-Schliesstag darf kein Montags-Ende nennen.
//  - A-Post Plus (Art. 142 Abs. 1bis ZPO): Feiertage am Gerichtsort nach
//    ZPO-Recht — SO 1. Mai (EG ZPO SO § 22 Abs. 2, BGS 221.2), NE-Schliesstag
//    (LI-CPC Art. 10a, RSN 251.1); GL 2.1. zählt mit Warnung (Entscheid W-11 a).
//  - Fortsetzungsbegehren nach Art.-63-verlängerter Rechtsvorschlagsfrist:
//    frühestes Datum → der spätere Tag ist sicher (SO 1. Mai nicht belegt für
//    SchKG, zählt hier also als Hindernis, mit Warnung).

import { describe, expect, it } from 'vitest';
import { berechneAllgemeineFrist, zustellHinweis } from '../lib/allgemeineFrist';
import { berechneZahlungsbefehlsSpiegel } from '../lib/fristenspiegel/zahlungsbefehl';

const sonderfall = (hs: string[]) => hs.filter((h) => h.startsWith('Kantonaler Sonderfall'));

describe('Vertragsfrist (RL-24) × bedingte Feiertage (RL-22)', () => {
  it('NE, Ende Sa 4.4.2026 (Vertragsfrist): kein Warnsatz über ein Montags-Ende', () => {
    const r = berechneAllgemeineFrist({
      start: '2026-03-28', laenge: 7, einheit: 'tage', wochenendeVerschieben: true,
      feiertageVerschieben: true, kanton: 'NE', fristart: 'vertraglich',
    });
    expect(r.endDatum).toBe('04.04.2026');
    expect(sonderfall(r.hinweise)).toEqual([]);
  });

  it('NE, Ende Fr 15.5.2026 (Schliesstag, Vertragsfrist): Alternative ist Sa 16.5., nicht Mo 18.5.', () => {
    const r = berechneAllgemeineFrist({
      start: '2026-05-08', laenge: 7, einheit: 'tage', wochenendeVerschieben: true,
      feiertageVerschieben: true, kanton: 'NE', fristart: 'vertraglich',
    });
    expect(r.endDatum).toBe('15.05.2026');
    const [h] = sonderfall(r.hinweise);
    expect(h).toMatch(/\bendet die Frist erst am 16\.05\.2026\b/);
  });

  it('NE, gesetzliche Frist: unverändert Alternative Mo 18.5.2026', () => {
    const r = berechneAllgemeineFrist({
      start: '2026-05-08', laenge: 7, einheit: 'tage', wochenendeVerschieben: true,
      feiertageVerschieben: true, kanton: 'NE',
    });
    expect(r.endDatum).toBe('15.05.2026');
    expect(sonderfall(r.hinweise)[0]).toMatch(/\bendet die Frist erst am 18\.05\.2026\b/);
  });
});

describe('A-Post Plus (RL-24, Art. 142 Abs. 1bis ZPO) im Kontext zpo', () => {
  it('SO Fr 1.5.2026 → Mo 4.5.2026 (EG ZPO SO § 22 Abs. 2)', () => {
    expect(zustellHinweis('apostplus', '2026-05-01', 'SO').vorschlagISO).toBe('2026-05-04');
  });
  it('NE Fr 15.5.2026 (Freitag nach Auffahrt) → Mo 18.5.2026 (LI-CPC Art. 10a)', () => {
    expect(zustellHinweis('apostplus', '2026-05-15', 'NE').vorschlagISO).toBe('2026-05-18');
  });
  it('GL Fr 2.1.2026 → Mo 5.1.2026, mit Warnung und dem strengen Datum 2.1.2026', () => {
    const z = zustellHinweis('apostplus', '2026-01-02', 'GL');
    expect(z.vorschlagISO).toBe('2026-01-05');
    const [h] = sonderfall(z.hinweise);
    expect(h).toMatch(/\bDer 02\.01\.2026 ist hier als Feiertag am Gerichtsort mitgezählt\b/);
    expect(h).toMatch(/\bbereits am 02\.01\.2026 als erfolgt\b/);
  });
  it('BE Fr 1.5.2026: kein Sonderfall, Werktag bleibt', () => {
    const z = zustellHinweis('apostplus', '2026-05-01', 'BE');
    expect(z.vorschlagISO).toBe('2026-05-01');
    expect(sonderfall(z.hinweise)).toEqual([]);
  });
});

describe('Fristenspiegel Zahlungsbefehl (RL-17) — Folgetag nach RV-Ende', () => {
  it('SO, Zustellung 2.4.2025: RV-Ende 30.4.2025, frühestens Fr 2.5.2025 (nicht Do 1.5.)', () => {
    const s = berechneZahlungsbefehlsSpiegel({ zustellung: '2025-04-02', kanton: 'SO' });
    const rv = s.zeilen.find((z) => z.key === 'rechtsvorschlag');
    const warte = s.zeilen.find((z) => z.key === 'fortsetzung_warte');
    expect(rv?.endeISO).toBe('2025-04-30');
    expect(warte?.endeISO).toBe('2025-05-02');
    const [h] = sonderfall(s.warnungen);
    expect(h).toMatch(/\bBerechnet ist das spätere, sichere Datum \(02\.05\.2025\)/);
  });
  it('BE, gleiche Zustellung: frühestens Do 1.5.2025, keine Warnung', () => {
    const s = berechneZahlungsbefehlsSpiegel({ zustellung: '2025-04-02', kanton: 'BE' });
    expect(s.zeilen.find((z) => z.key === 'fortsetzung_warte')?.endeISO).toBe('2025-05-01');
    expect(sonderfall(s.warnungen)).toEqual([]);
  });
});
