import { describe, it, expect } from 'vitest';
import {
  titelDatumNachIso,
  beschreibungDatumNachIso,
  wSignaturAusTitel,
  wSpracheAusTitel,
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

// Nachzug #1179 (30.9.2026): alle Trennzeichen einheitlich, Sprache aus dem Signatur-Suffix.
describe('wSignaturAusTitel — Gedankenstrich/Schrägstrich/Punkt wie der Bindestrich (Nachzug #1179)', () => {
  it('Trennzeichen unmittelbar vor Ziffer/Buchstabe → null (Halbgeviert, Geviert, «/», «.»), nie die gekürzte «W95-003»', () => {
    for (const t of ['W95-003–2024', 'W95-003D–2024', 'W95-003—2024', 'W95-003D/2024', 'W95-003/2024', 'W95-003D.2024', 'W95-003.2024', 'W95-003D−2024', 'W95-003D/Nachtrag']) {
      expect(wSignaturAusTitel(t), t).toBeNull();
    }
  });
  it('Trennzeichen vor Leerzeichen oder am Ende bleibt gültig', () => {
    expect(wSignaturAusTitel('W95-003D / 2024')).toBe('W95-003');
    expect(wSignaturAusTitel('W95-003D. Titel')).toBe('W95-003');
    expect(wSignaturAusTitel('W95-003–')).toBe('W95-003');
  });
});

describe('wSpracheAusTitel + baueDokUndKanten — Sprache aus D/F/I, sonst «de» (Nachzug #1179)', () => {
  it('D/F/I → de/fr/it; ohne Kürzel oder mit Wort-Anhang → null', () => {
    expect(wSpracheAusTitel('W01-006D vom 06.06.2001')).toBe('de');
    expect(wSpracheAusTitel('W01-006F vom 06.06.2001')).toBe('fr');
    expect(wSpracheAusTitel('W01-006I vom 06.06.2001')).toBe('it');
    expect(wSpracheAusTitel('W01-006 vom 06.06.2001')).toBeNull();
    expect(wSpracheAusTitel('W01-006Fa')).toBeNull();
    expect(wSpracheAusTitel('Kreisschreiben Nr. 3; Version vom 7. Februar 2024')).toBeNull();
  });
  it('F-/I-Titel → dok.sprache fr/it; D-Titel und Titel ohne Kürzel → de (bisheriges Verhalten)', () => {
    const bau = (titel: string) => baueDokUndKanten({
      href: 'https://x/dam/de/sd-web/T/dbst-ks-w01-006-de.pdf', titel, beschreibung: 'Gegenstand',
      datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-w01-006-de.pdf',
    }, [ESTV_KS_SEITEN[0]], '2026-09-30').dok;
    expect(bau('W01-006F vom 06.06.2001').sprache).toBe('fr');
    expect(bau('W01-006I vom 06.06.2001').sprache).toBe('it');
    expect(bau('W01-006D vom 06.06.2001').sprache).toBe('de');
    expect(bau('Kreisschreiben Nr. 3; Version vom 7. Februar 2024').sprache).toBe('de');
  });
  it('Festschreibung Ist-Stand: Titel ohne W-Signatur behält die Dateinamen-Nummer (1 realer Eintrag, W95-003-2024)', () => {
    const { dok } = baueDokUndKanten({
      href: 'https://x/dam/de/sd-web/T/dbst-ks-w95-003-2024-de.pdf',
      titel: 'Kreisschreiben Nr. 3; Version vom 7. Februar 2024: Land- und Forstwirtschaft', beschreibung: '',
      datumLabel: '7. Februar 2024', dateiname: 'dbst-ks-w95-003-2024-de.pdf',
    }, [ESTV_KS_SEITEN[0]], '2026-09-30');
    expect(dok.nummer).toBe('W95-003-2024');
    expect(dok.sprache).toBe('de');
  });
});

// Nachzug #1195 (30.9.2026, Gegenprüfung): ein verworfener Signatur-Titel darf NICHT auf den Dateinamen-Stamm
// zurückfallen (ESTV gruppiert dort anders: dbst-ks-w03-006 ↔ W01-006D → «W03-006» wäre eine falsche Nummer, §8).
describe('wSignaturAusTitel — «,», «;», «:», NBSP, U+00AD wie die übrigen Trenner (Nachzug #1195)', () => {
  it('Komma/Semikolon/Doppelpunkt/NBSP/weicher Trennstrich unmittelbar vor Ziffer/Buchstabe → null', () => {
    for (const t of ['W95-003,2024', 'W95-003D,Nachtrag', 'W95-003;2024', 'W95-003D;Nachtrag', 'W95-003:2024', 'W95-003D:Nachtrag',
      'W95-003 2024', 'W95-003D Nachtrag', 'W95-003­2024', 'W95-003D­Nachtrag']) {
      expect(wSignaturAusTitel(t), JSON.stringify(t)).toBeNull();
    }
  });
  it('dieselben Trenner vor Leerzeichen oder am Ende bleiben gültig', () => {
    for (const t of ['W95-003D, Titel', 'W95-003D; Titel', 'W95-003D: Titel', 'W95-003D  Titel', 'W95-003D­ Titel', 'W95-003D,', 'W95-003D;', 'W95-003D:', 'W95-003D ', 'W95-003D­']) {
      expect(wSignaturAusTitel(t), JSON.stringify(t)).toBe('W95-003');
    }
  });
});

describe('wSpracheAusTitel — null, sobald die Signatur verworfen ist (Nachzug #1195)', () => {
  it('«W02-008F-2024» & Co.: Kürzel F wird NICHT als fr gelesen, solange wSignaturAusTitel null ist', () => {
    for (const t of ['W02-008F-2024', 'W02-008F–2024', 'W02-008F/2024', 'W02-008F.2024', 'W02-008F,2024', 'W02-008F;2024', 'W02-008F:2024', 'W02-008F 2024', 'W02-008F­2024', 'W02-008I-2024']) {
      expect(wSignaturAusTitel(t), JSON.stringify(t)).toBeNull();
      expect(wSpracheAusTitel(t), JSON.stringify(t)).toBeNull();
    }
  });
  it('gültige Signatur bleibt: F → fr, I → it (Regression)', () => {
    expect(wSpracheAusTitel('W02-008F vom 01.01.2002')).toBe('fr');
    expect(wSpracheAusTitel('W02-008I: Titel')).toBe('it');
  });
  it('baueDokUndKanten: «W02-008F-2024» → sprache de (Rückfall), nicht fr', () => {
    const { dok } = baueDokUndKanten({
      href: 'https://x/dam/de/sd-web/T/dbst-ks-w02-008-de.pdf', titel: 'W02-008F-2024 Nachtrag', beschreibung: 'Gegenstand',
      datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-w02-008-de.pdf',
    }, [ESTV_KS_SEITEN[0]], '2026-09-30');
    expect(dok.sprache).toBe('de');
  });
});

describe('baueDokUndKanten — nummer: verworfene W-Signatur ⇒ null, nie der Dateinamen-Stamm (Nachzug #1195)', () => {
  const bau = (titel: string, dateiname = 'dbst-ks-w03-006-de.pdf') => baueDokUndKanten({
    href: `https://x/dam/de/sd-web/T/${dateiname}`, titel, beschreibung: 'Gegenstand',
    datumLabel: '10. Oktober 2023', dateiname,
  }, [ESTV_KS_SEITEN[0]], '2026-09-30').dok;
  it('amtlich belegtes Paar Datei w03-006 ↔ Titel W01-006D: «W01-006D–Nachtrag vom 06.06.2001» → null (nicht «W03-006»)', () => {
    for (const t of ['W01-006D–Nachtrag vom 06.06.2001', 'W01-006D—Nachtrag vom 06.06.2001', 'W01-006D/Nachtrag vom 06.06.2001', 'W01-006D.Nachtrag vom 06.06.2001',
      'W01-006D-2024', 'W01-006D,Nachtrag', 'W01-006D;Nachtrag', 'W01-006D:Nachtrag', 'W01-006D Nachtrag', 'W01-006D­Nachtrag']) {
      expect(bau(t).nummer, JSON.stringify(t)).toBeNull();
    }
  });
  it('gültige Signatur → Titel-Signatur (W01-006), nicht der Stamm (W03-006) — unverändert', () => {
    expect(bau('W01-006D vom 06.06.2001').nummer).toBe('W01-006');
  });
  it('Titel OHNE W-Signatur (real: W95-003-2024) → Dateinamen-Stamm wie bisher', () => {
    expect(bau('Kreisschreiben Nr. 3; Version vom 7. Februar 2024', 'dbst-ks-w95-003-2024-de.pdf').nummer).toBe('W95-003-2024');
    expect(bau('Nachtrag zum Kreisschreiben', 'dbst-ks-w95-003-de.pdf').nummer).toBe('W95-003');
  });
  it('Nicht-W-Familien unberührt: KS-Nummer bleibt «Nr. 11»', () => {
    expect(bau('Kreisschreiben Nr. 11', 'dbst-ks-2005-1-011-d-de.pdf').nummer).toBe('Nr. 11');
  });
});
