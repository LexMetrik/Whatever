import { describe, it, expect } from 'vitest';
import { parseISO } from 'date-fns';
import { berechneFrist } from '../lib/zpoFristen';
import { ostersonntag, stillstandsperiodeFuer, istFeiertag } from '../data/zpoFeiertage';
import type { ZpoInput } from '../types/zpo';

const d = (s: string) => parseISO(s);
const base = (over: Partial<ZpoInput>): ZpoInput => ({
  ereignis: '2025-01-15', einheit: 'monate', laenge: 3,
  verfahren: 'summarisch', kanton: 'ZH', fristnatur: 'gesetzlich', ...over,
});

describe('Verifikation: Oster-Computus (viele Jahre)', () => {
  const tab: [number, number, number][] = [
    // [Jahr, Monat(1-12), Tag]  – amtliche Ostersonntag-Daten
    [2008, 3, 23], [2011, 4, 24], [2016, 3, 27], [2018, 4, 1],
    [2020, 4, 12], [2021, 4, 4], [2022, 4, 17], [2023, 4, 9],
    [2024, 3, 31], [2025, 4, 20], [2026, 4, 5], [2027, 3, 28],
    [2030, 4, 21], [2035, 3, 25], [2038, 4, 25],
  ];
  it.each(tab)('Ostersonntag %i = %i.%i', (jahr, monat, tag) => {
    const o = ostersonntag(jahr);
    expect(o.getMonth() + 1).toBe(monat);
    expect(o.getDate()).toBe(tag);
  });
});

describe('Verifikation: Datums-/Schaltjahresarithmetik', () => {
  it('29.2.2024 + 1 Jahr → 28.2.2025', () => {
    expect(berechneFrist(base({ ereignis: '2024-02-29', einheit: 'jahre', laenge: 1 })).diesAdQuem).toBe('28.02.2025');
  });
  it('29.2.2024 + 4 Jahre → 29.2.2028 (Schaltjahr)', () => {
    expect(berechneFrist(base({ ereignis: '2024-02-29', einheit: 'jahre', laenge: 4 })).diesAdQuem).toBe('29.02.2028');
  });
  it('31.1.2025 + 1 Monat → 28.2. (klemmt)', () => {
    expect(berechneFrist(base({ ereignis: '2025-01-31', einheit: 'monate', laenge: 1 })).diesAdQuem).toBe('28.02.2025');
  });
  it('31.1.2024 + 1 Monat → 29.2. (Schaltjahr)', () => {
    expect(berechneFrist(base({ ereignis: '2024-01-31', einheit: 'monate', laenge: 1 })).diesAdQuem).toBe('29.02.2024');
  });
  it('31.3.2025 + 1 Monat → 30.4.', () => {
    expect(berechneFrist(base({ ereignis: '2025-03-31', einheit: 'monate', laenge: 1 })).diesAdQuem).toBe('30.04.2025');
  });
  it('31.12.2024 + 2 Monate → 28.2.2025', () => {
    expect(berechneFrist(base({ ereignis: '2024-12-31', einheit: 'monate', laenge: 2 })).diesAdQuem).toBe('28.02.2025');
  });
  it('30.11.2024 + 3 Monate → 28.2.2025', () => {
    expect(berechneFrist(base({ ereignis: '2024-11-30', einheit: 'monate', laenge: 3 })).diesAdQuem).toBe('28.02.2025');
  });
});

describe('Verifikation: Sommer-/Winterzeit-Robustheit (keine Off-by-one)', () => {
  it('Monatsfrist über Sommerzeitumstellung (15.3. + 1 Monat → 15.4.)', () => {
    expect(berechneFrist(base({ ereignis: '2025-03-15', einheit: 'monate', laenge: 1 })).diesAdQuem).toBe('15.04.2025');
  });
  it('Tagesfrist über Frühlings-DST (20.3. + 20 Tage → 9.4.)', () => {
    expect(berechneFrist(base({ ereignis: '2025-03-20', einheit: 'tage', laenge: 20 })).diesAdQuem).toBe('09.04.2025');
  });
  it('Tagesfrist über Herbst-DST (15.10. + 20 Tage → 4.11.)', () => {
    expect(berechneFrist(base({ ereignis: '2025-10-15', einheit: 'tage', laenge: 20 })).diesAdQuem).toBe('04.11.2025');
  });
});

describe('Verifikation: Stillstandsgrenzen (Eckdaten inklusiv)', () => {
  it('Sommer: 15.7. und 15.8. drin, 14.7./16.8. draussen', () => {
    expect(stillstandsperiodeFuer(d('2025-07-15'))).not.toBeNull();
    expect(stillstandsperiodeFuer(d('2025-08-15'))).not.toBeNull();
    expect(stillstandsperiodeFuer(d('2025-07-14'))).toBeNull();
    expect(stillstandsperiodeFuer(d('2025-08-16'))).toBeNull();
  });
  it('Weihnachten: 18.12. und 2.1. drin (Jahreswechsel), 17.12./3.1. draussen', () => {
    expect(stillstandsperiodeFuer(d('2025-12-18'))).not.toBeNull();
    expect(stillstandsperiodeFuer(d('2026-01-02'))).not.toBeNull();
    expect(stillstandsperiodeFuer(d('2025-12-17'))).toBeNull();
    expect(stillstandsperiodeFuer(d('2026-01-03'))).toBeNull();
  });
  it('Ostern 2025 (So 20.4.): 13.4. und 27.4. drin, 12.4./28.4. draussen', () => {
    expect(stillstandsperiodeFuer(d('2025-04-13'))).not.toBeNull();
    expect(stillstandsperiodeFuer(d('2025-04-27'))).not.toBeNull();
    expect(stillstandsperiodeFuer(d('2025-04-12'))).toBeNull();
    expect(stillstandsperiodeFuer(d('2025-04-28'))).toBeNull();
  });
});

describe('Verifikation: kantonale Feiertage (Art. 142 Abs. 3)', () => {
  it('1. Mai 2025: ZH/TI ja, BE/LU nein', () => {
    expect(istFeiertag(d('2025-05-01'), 'ZH')).toBe(true);
    expect(istFeiertag(d('2025-05-01'), 'TI')).toBe(true);
    expect(istFeiertag(d('2025-05-01'), 'BE')).toBe(false);
    expect(istFeiertag(d('2025-05-01'), 'LU')).toBe(false);
  });
  it('Karfreitag 2025 (18.4.): ZH ja, TI/VS nein', () => {
    expect(istFeiertag(d('2025-04-18'), 'ZH')).toBe(true);
    expect(istFeiertag(d('2025-04-18'), 'TI')).toBe(false);
    expect(istFeiertag(d('2025-04-18'), 'VS')).toBe(false);
  });
  it('Ostermontag 2025 (21.4.): ZH ja, NE nein', () => {
    expect(istFeiertag(d('2025-04-21'), 'ZH')).toBe(true);
    expect(istFeiertag(d('2025-04-21'), 'NE')).toBe(false);
  });
  // Deklarierte Korrektur 6.6.2026 (BJ-Doppelcheck): JU führt den Lundi de
  // Pentecôte als gesetzlich anerkannten Feiertag (BJ Ziff. 26 lit. a) —
  // der frühere Erwartungswert «JU nein» war ein Matrix-Fehler.
  it('Pfingstmontag 2025 (9.6.): ZH/JU ja, NE nein', () => {
    expect(istFeiertag(d('2025-06-09'), 'ZH')).toBe(true);
    expect(istFeiertag(d('2025-06-09'), 'JU')).toBe(true);
    expect(istFeiertag(d('2025-06-09'), 'NE')).toBe(false);
  });
  it('Fronleichnam 2025 (19.6.): LU/TI ja, ZH/GR nein', () => {
    expect(istFeiertag(d('2025-06-19'), 'LU')).toBe(true);
    expect(istFeiertag(d('2025-06-19'), 'TI')).toBe(true);
    expect(istFeiertag(d('2025-06-19'), 'ZH')).toBe(false);
    expect(istFeiertag(d('2025-06-19'), 'GR')).toBe(false);
  });
  it('Allerheiligen 1.11.2025: LU ja, ZH/GR nein', () => {
    expect(istFeiertag(d('2025-11-01'), 'LU')).toBe(true);
    expect(istFeiertag(d('2025-11-01'), 'ZH')).toBe(false);
    expect(istFeiertag(d('2025-11-01'), 'GR')).toBe(false);
  });
  // Deklarierte Korrektur 6.6.2026 (BJ-Doppelcheck): FR führt die Immaculée
  // Conception als anerkannten Feiertag (BJ Ziff. 10 lit. a, Seebezirk-
  // Vorbehalt Fn. 2) — der frühere Erwartungswert «FR nein» war ein Fehler.
  it('Mariä Empfängnis 8.12.2025: LU/FR ja, ZH nein', () => {
    expect(istFeiertag(d('2025-12-08'), 'LU')).toBe(true);
    expect(istFeiertag(d('2025-12-08'), 'FR')).toBe(true);
    expect(istFeiertag(d('2025-12-08'), 'ZH')).toBe(false);
  });
  // ── BJ-Doppelcheck 6.6.2026 (Auftrag David): Korrekturen + Fussnotenregeln ──
  it('Berchtoldstag 2.1.2025: LU ja (BJ Ziff. 3 lit. a — fehlte), SZ nein', () => {
    expect(istFeiertag(d('2025-01-02'), 'LU')).toBe(true);
    expect(istFeiertag(d('2025-01-02'), 'SZ')).toBe(false);
  });
  it('NE-Bedingung (Fn. 10): 2.1. nur, wenn der 1.1. ein Sonntag ist', () => {
    expect(istFeiertag(d('2023-01-02'), 'NE')).toBe(true);  // 1.1.2023 = So
    expect(istFeiertag(d('2025-01-02'), 'NE')).toBe(false); // 1.1.2025 = Mi
  });
  it('Allerheiligen 1.11.2025: GL ja (BJ Ziff. 8 lit. a — fehlte)', () => {
    expect(istFeiertag(d('2025-11-01'), 'GL')).toBe(true);
  });
  it('Stephanstag 26.12.2025: GL (lit. a) und VS (lit. b) ja — fehlten; VD/GE/JU nein', () => {
    expect(istFeiertag(d('2025-12-26'), 'GL')).toBe(true);
    expect(istFeiertag(d('2025-12-26'), 'VS')).toBe(true);
    expect(istFeiertag(d('2025-12-26'), 'VD')).toBe(false);
    expect(istFeiertag(d('2025-12-26'), 'GE')).toBe(false);
    expect(istFeiertag(d('2025-12-26'), 'JU')).toBe(false);
  });
  it('AR/AI-Bedingung (Fn. 7/9): kein Stephanstag, wenn Weihnachten Mo/Fr', () => {
    // 25.12.2023 = Mo und 25.12.2026 = Fr → entfällt; 25.12.2025 = Do → gilt.
    // UR bis 24.9.2026 hier mitgeprüft (BJ Fn. 1); seit RL-22 unbedingt — UR
    // Ruhetagsgesetz Art. 9 lit. b (RB 70.1421) kennt keinen Vorbehalt (R1-03).
    expect(istFeiertag(d('2023-12-26'), 'AI')).toBe(false);
    expect(istFeiertag(d('2023-12-26'), 'UR')).toBe(true);
    expect(istFeiertag(d('2026-12-26'), 'AR')).toBe(false);
    expect(istFeiertag(d('2025-12-26'), 'AI')).toBe(true);
    expect(istFeiertag(d('2023-12-26'), 'ZH')).toBe(true); // unbedingte Kantone unberührt
  });
  it('NE-Bedingung (Fn. 10): 26.12. nur, wenn der 25.12. ein Sonntag ist', () => {
    expect(istFeiertag(d('2022-12-26'), 'NE')).toBe(true);  // 25.12.2022 = So
    expect(istFeiertag(d('2024-12-26'), 'NE')).toBe(false); // 25.12.2024 = Mi
  });
  it('Mauritiustag 22.9.2025: AI ja (BJ Fn. 8, Gerichtsort Appenzell), SG nein', () => {
    expect(istFeiertag(d('2025-09-22'), 'AI')).toBe(true);
    expect(istFeiertag(d('2025-09-22'), 'SG')).toBe(false);
  });
  it('Näfelser Fahrt: Karwoche-Verschiebung 2026 (9.4. statt 2.4., amtlich gl.ch)', () => {
    expect(istFeiertag(d('2026-04-09'), 'GL')).toBe(true);
    expect(istFeiertag(d('2026-04-02'), 'GL')).toBe(false); // Gründonnerstag, verschoben
  });
  it('Spezialfeiertage: Näfelser Fahrt GL (3.4.2025), Jeûne genevois GE (11.9.2025), Lundi du Jeûne VD (22.9.2025)', () => {
    expect(istFeiertag(d('2025-04-03'), 'GL')).toBe(true);
    expect(istFeiertag(d('2025-04-03'), 'ZH')).toBe(false);
    expect(istFeiertag(d('2025-09-11'), 'GE')).toBe(true);
    expect(istFeiertag(d('2025-09-22'), 'VD')).toBe(true);
  });
  it('Josephstag 19.3.2025: UR ja, ZH nein', () => {
    expect(istFeiertag(d('2025-03-19'), 'UR')).toBe(true);
    expect(istFeiertag(d('2025-03-19'), 'ZH')).toBe(false);
  });
});

describe('Verifikation: kantonale Feiertage wirken auf das Fristende', () => {
  // Tagesfrist endet rechnerisch Do 1.5.2025 (summarisch, kein Stillstand)
  it('Ende 1.5.: ZH → 2.5. (Feiertag), BE → 1.5. (kein Feiertag)', () => {
    const zh = berechneFrist(base({ ereignis: '2025-04-21', einheit: 'tage', laenge: 10, kanton: 'ZH' }));
    const be = berechneFrist(base({ ereignis: '2025-04-21', einheit: 'tage', laenge: 10, kanton: 'BE' }));
    expect(zh.diesAdQuem).toBe('02.05.2025');
    expect(be.diesAdQuem).toBe('01.05.2025');
  });
  // Tagesfrist endet rechnerisch Do 19.6.2025 (Fronleichnam)
  it('Ende 19.6.: LU → 20.6. (Fronleichnam), ZH → 19.6.', () => {
    const lu = berechneFrist(base({ ereignis: '2025-06-09', einheit: 'tage', laenge: 10, kanton: 'LU' }));
    const zh = berechneFrist(base({ ereignis: '2025-06-09', einheit: 'tage', laenge: 10, kanton: 'ZH' }));
    expect(lu.diesAdQuem).toBe('20.06.2025');
    expect(zh.diesAdQuem).toBe('19.06.2025');
  });
});

describe('Verifikation: Fristenstillstand ist bundeseinheitlich (nicht kantonal)', () => {
  it('Gleiche Frist (ordentlich) → identisches Ende in ZH und GE', () => {
    const zh = berechneFrist(base({ ereignis: '2024-08-01', einheit: 'monate', laenge: 3, verfahren: 'ordentlich', kanton: 'ZH' }));
    const ge = berechneFrist(base({ ereignis: '2024-08-01', einheit: 'monate', laenge: 3, verfahren: 'ordentlich', kanton: 'GE' }));
    expect(zh.diesAdQuem).toBe('15.11.2024');
    expect(ge.diesAdQuem).toBe('15.11.2024');
  });
});

describe('Verifikation: Determinismus', () => {
  it('Zweimalige Berechnung liefert dasselbe Ergebnis', () => {
    const inp = base({ ereignis: '2025-07-20', einheit: 'monate', laenge: 6, verfahren: 'ordentlich', kanton: 'ZH' });
    expect(berechneFrist(inp).diesAdQuem).toBe(berechneFrist(inp).diesAdQuem);
  });
});
