import { describe, it, expect } from 'vitest';
import {
  titelDatumNachIso,
  beschreibungDatumNachIso,
  wSignaturAusTitel,
  baueDokUndKanten,
  ESTV_KS_SEITEN,
  type RohEstvItem,
} from '../../scripts/materialien/adapter-estv-ks';

// W2·27-BUND-FERTIG (30.9.2026) — Randlücken aus dem Bericht zu #1167: Kalenderprüfung, «Vom», F/I-Suffix.
// Nachmessung «heute 0 reale Fälle» (30.9.2026): 144 ESTV-Einträge in public/materialien/register.json,
// 123 Live-Roh-Items der drei Indexseiten (estv.admin.ch, Abruf 30.9.2026) — 0 ungültige Kalenderdaten,
// 0 «Vom», 0 F/I-/Strich-Signaturen; Adapter-Output (90 Dokumente, 121 Kanten) alt/neu byte-gleich.
describe('titelDatumNachIso — nur echte Kalenderdaten, «Vom» gross/klein (Randlücken #1167)', () => {
  it('nicht existierende Tage/Monate → null, nie ein erfundenes oder zurechtgerücktes Datum', () => {
    for (const d of ['31.02.2005', '30.02.2004', '31.04.2005', '31.06.2005', '31.09.2005', '31.11.2005', '32.01.2005', '00.01.2005', '0.1.2005', '01.00.2005', '01.13.2005', '15.99.2005']) {
      expect(titelDatumNachIso(`W95-002D vom ${d}`), d).toBeNull();
    }
  });
  it('Schaltjahr-Regel: 29.02. nur in Schaltjahren (2004, 2000 ja; 2001, 1900 nein); Jahr 0000 → null', () => {
    expect(titelDatumNachIso('W95-002D vom 29.02.2004')).toBe('2004-02-29');
    expect(titelDatumNachIso('W95-002D vom 29.02.2000')).toBe('2000-02-29');
    expect(titelDatumNachIso('W95-002D vom 29.02.2001')).toBeNull();
    expect(titelDatumNachIso('W95-002D vom 29.02.1900')).toBeNull();
    expect(titelDatumNachIso('W95-002D vom 01.01.0000')).toBeNull();
  });
  it('Monatsenden gültig: 31.01., 30.04., 28.02., 31.12. bleiben unverändert', () => {
    expect(titelDatumNachIso('X vom 31.01.2005')).toBe('2005-01-31');
    expect(titelDatumNachIso('X vom 30.04.2005')).toBe('2005-04-30');
    expect(titelDatumNachIso('X vom 28.02.2005')).toBe('2005-02-28');
    expect(titelDatumNachIso('X vom 31.12.2005')).toBe('2005-12-31');
  });
  it('nur die ERSTE «vom»-Angabe zählt: ist sie ungültig, wird NICHT zur zweiten weitergesucht', () => {
    expect(titelDatumNachIso('W01-006D vom 31.02.2001: Änderung vom 09.03.2001')).toBeNull();
  });
  it('«Vom»/«VOM» (Satzanfang) wird erkannt; Wortgrenze bleibt («Dokom 06.06.2001» → null)', () => {
    expect(titelDatumNachIso('Vom 06.06.2001: Verordnung')).toBe('2001-06-06');
    expect(titelDatumNachIso('VOM 6.6.2001')).toBe('2001-06-06');
    expect(titelDatumNachIso('Dokom 06.06.2001')).toBeNull();
  });
  it('beschreibungDatumNachIso erbt Kalenderprüfung und «Vom»', () => {
    expect(beschreibungDatumNachIso('Gegenstand vom 31.02.2005 (Direkte Bundessteuer)')).toBeNull();
    expect(beschreibungDatumNachIso('Vom 31.08.2005 (Direkte Bundessteuer)')).toBe('2005-08-31');
  });
  it('baueDokUndKanten: ungültiges Titel-Datum → Upload-Label als deklarierter Rückfall, kein erfundenes Datum', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/dbst-ks-w95-002-de.pdf',
      titel: 'W95-002D vom 31.02.1992', beschreibung: 'Gegenstand',
      datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-w95-002-de.pdf',
    };
    const { dok } = baueDokUndKanten(roh, [ESTV_KS_SEITEN[0]], '2026-09-30');
    expect(dok.stand).toBe('2023-10-10');
    expect(dok.stand_quelle).toBe('hub-label');
  });
});

describe('wSignaturAusTitel — Sprachkürzel D/F/I, keine gekürzte Fremdform (Randlücken #1167)', () => {
  it('F- und I-Variante tragen dieselbe Signatur wie die D-Variante', () => {
    expect(wSignaturAusTitel('W01-006F vom 06.06.2001: Ordonnance')).toBe('W01-006');
    expect(wSignaturAusTitel('W01-006I vom 06.06.2001')).toBe('W01-006');
    expect(wSignaturAusTitel('W95-002F')).toBe('W95-002');
    expect(wSignaturAusTitel('W95-002I')).toBe('W95-002');
  });
  it('Suffix nach Signatur («W95-003-2024», «…D-2024», «_x») ist eine unbekannte Form → null, nie «W95-003»', () => {
    expect(wSignaturAusTitel('W95-003-2024')).toBeNull();
    expect(wSignaturAusTitel('W95-003-2024 vom 07.02.2024')).toBeNull();
    expect(wSignaturAusTitel('W95-003D-2024')).toBeNull();
    expect(wSignaturAusTitel('W95-003_x')).toBeNull();
    expect(wSignaturAusTitel('W95-003Fa')).toBeNull();
  });
  it('gültige Fortsetzungen bleiben: Leerzeichen, Doppelpunkt, Satzzeichen, Ende', () => {
    expect(wSignaturAusTitel('W95-003 - Titel')).toBe('W95-003');
    expect(wSignaturAusTitel('W95-003D: Titel')).toBe('W95-003');
    expect(wSignaturAusTitel('W95-003F.')).toBe('W95-003');
    expect(wSignaturAusTitel('W95-003')).toBe('W95-003');
  });
  it('baueDokUndKanten: F-Titel wird wie D-Titel zusammengesetzt (nummer = Signatur, Titel + Gegenstand)', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/dbst-ks-w01-006-de.pdf',
      titel: 'W01-006F vom 06.06.2001', beschreibung: "Ordonnance sur l'imputation forfaitaire d'impôt\nAnhang",
      datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-w01-006-de.pdf',
    };
    const { dok } = baueDokUndKanten(roh, [ESTV_KS_SEITEN[0]], '2026-09-30');
    expect(dok.nummer).toBe('W01-006');
    expect(dok.titel).toBe("W01-006F vom 06.06.2001: Ordonnance sur l'imputation forfaitaire d'impôt");
    expect(dok.stand).toBe('2001-06-06');
  });
});
