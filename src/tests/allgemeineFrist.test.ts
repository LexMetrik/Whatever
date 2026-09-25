import { describe, it, expect } from 'vitest';
import { berechneAllgemeineFrist, tageZwischen, type AllgFristInput } from '../lib/allgemeineFrist';
import { ostersonntag } from '../data/zpoFeiertage';
import { berechneFrist } from '../lib/zpoFristen';

// Akzeptanztests des Auftrags «Allgemeiner Fristenrechner» (nachgerechnete
// Goldwerte; Verschiebungstests Kanton ZH). Test 14 ist der Systemtest:
// allgemeineFrist und zpoFristen teilen dieselbe fachneutrale Arithmetik.

const basis = (patch: Partial<AllgFristInput> = {}): AllgFristInput => ({
  start: '2020-10-23', laenge: 30, einheit: 'tage',
  wochenendeVerschieben: false, feiertageVerschieben: false,
  ...patch,
});

describe('Allgemeiner Fristenrechner – Goldwerte', () => {
  it('AF-1 Tagesfrist: 23.10.2020 + 30 Tage = So 22.11.2020 (dies a quo zählt nicht)', () => {
    const r = berechneAllgemeineFrist(basis());
    expect(r.endDatum).toBe('22.11.2020');
    expect(r.endWochentag).toBe('Sonntag');
    expect(r.verschoben).toBe(false);
  });

  it('AF-2 Wochenend-Verschiebung: So 22.11.2020 → Mo 23.11.2020', () => {
    const r = berechneAllgemeineFrist(basis({ wochenendeVerschieben: true }));
    expect(r.endDatum).toBe('23.11.2020');
    expect(r.endWochentag).toBe('Montag');
    expect(r.rohEndDatum).toBe('22.11.2020');
    expect(r.verschiebeGruende).toHaveLength(1);
  });

  it('AF-3 Monatsfrist gleichbezeichneter Tag: 26.1.2022 + 3 Monate = Di 26.4.2022 (BGer 5A_691/2023)', () => {
    const r = berechneAllgemeineFrist(basis({ start: '2022-01-26', laenge: 3, einheit: 'monate' }));
    expect(r.endDatum).toBe('26.04.2022');
    expect(r.endWochentag).toBe('Dienstag');
  });

  it('AF-4 Monatsende-Klemmung: 31.1.2023 + 1 Monat = 28.2.2023', () => {
    const r = berechneAllgemeineFrist(basis({ start: '2023-01-31', laenge: 1, einheit: 'monate' }));
    expect(r.endDatum).toBe('28.02.2023');
    expect(r.schritte.find((s) => s.label.startsWith('Rohes Fristende'))?.grund).toMatch(/letzter Tag des Monats/);
  });

  it('AF-5 Monatsende im Schaltjahr: 31.1.2024 + 1 Monat = 29.2.2024', () => {
    expect(berechneAllgemeineFrist(basis({ start: '2024-01-31', laenge: 1, einheit: 'monate' })).endDatum).toBe('29.02.2024');
  });

  it('AF-6 Jahresfrist über Schaltjahr: 29.2.2024 + 1 Jahr = 28.2.2025', () => {
    expect(berechneAllgemeineFrist(basis({ start: '2024-02-29', laenge: 1, einheit: 'jahre' })).endDatum).toBe('28.02.2025');
  });

  it('AF-7 Klemmung auf 30-Tage-Monat: 31.5.2025 + 1 Monat = 30.6.2025', () => {
    expect(berechneAllgemeineFrist(basis({ start: '2025-05-31', laenge: 1, einheit: 'monate' })).endDatum).toBe('30.06.2025');
  });

  it('AF-8 Karfreitag-Kaskade (ZH): Roh-Ende Fr 18.4.2025 → Di 22.4.2025 (Karfreitag→Sa→So→Ostermontag)', () => {
    // 17.4.2025 + 1 Tag → roh 18.4.2025 (Karfreitag)
    const r = berechneAllgemeineFrist(basis({
      start: '2025-04-17', laenge: 1, einheit: 'tage',
      wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH',
    }));
    expect(r.rohEndDatum).toBe('18.04.2025');
    expect(r.endDatum).toBe('22.04.2025');
    expect(r.endWochentag).toBe('Dienstag');
    expect(r.verschiebeGruende).toHaveLength(4);
  });

  it('AF-9 Bundesfeier auf Samstag (ZH): Roh-Ende Sa 1.8.2026 → Mo 3.8.2026, keine Doppelzählung', () => {
    const r = berechneAllgemeineFrist(basis({
      start: '2026-07-31', laenge: 1, einheit: 'tage',
      wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH',
    }));
    expect(r.rohEndDatum).toBe('01.08.2026');
    expect(r.endDatum).toBe('03.08.2026');
    expect(r.endWochentag).toBe('Montag');
    expect(r.verschiebeGruende).toHaveLength(2); // Sa(Feiertag) + So – je genau einmal
  });

  it('AF-10 Weihnacht auf Samstag (ZH): Roh-Ende Sa 25.12.2027 → Mo 27.12.2027 (26.12. So übersprungen)', () => {
    const r = berechneAllgemeineFrist(basis({
      start: '2027-12-24', laenge: 1, einheit: 'tage',
      wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH',
    }));
    expect(r.rohEndDatum).toBe('25.12.2027');
    expect(r.endDatum).toBe('27.12.2027');
  });

  it('AF-11 Wochenfrist = 14 Kalendertage: Do 5.6.2025 + 2 Wochen = Do 19.6.2025', () => {
    const r = berechneAllgemeineFrist(basis({ start: '2025-06-05', laenge: 2, einheit: 'wochen' }));
    expect(r.endDatum).toBe('19.06.2025');
    expect(r.endWochentag).toBe('Donnerstag');
  });

  it('AF-12 Computus: Osterdaten 2024–2027', () => {
    const fmt = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`;
    expect(fmt(ostersonntag(2024))).toBe('31.3.');
    expect(fmt(ostersonntag(2025))).toBe('20.4.');
    expect(fmt(ostersonntag(2026))).toBe('5.4.');
    expect(fmt(ostersonntag(2027))).toBe('28.3.');
  });

  it('AF-13 Tage zwischen 1.2.2024 und 1.3.2024 = 29 (Schaltjahr-Februar)', () => {
    expect(tageZwischen('2024-02-01', '2024-03-01').kalendertage).toBe(29);
  });

  it('AF-14 Systemtest: identisch mit zpoFristen für Tagesfrist ausserhalb der Gerichtsferien', () => {
    // 10 Tage ab Di 3.6.2025: Lauf 4.6.–13.6.2025 – vollständig ausserhalb
    // aller ZPO-Stillstandsperioden (Ostern/Sommer/Weihnachten, Art. 145 ZPO).
    const allg = berechneAllgemeineFrist(basis({
      start: '2025-06-03', laenge: 10, einheit: 'tage',
      wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH',
    }));
    const zpo = berechneFrist({
      ereignis: '2025-06-03', laenge: 10, einheit: 'tage',
      verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich',
    });
    expect(allg.endDatumISO).toBe(zpo.diesAdQuemISO);
    // und ein zweiter Fall mit Wochenend-Verschiebung am Ende (Fr 20.6.+8 → So → Mo)
    const allg2 = berechneAllgemeineFrist(basis({
      start: '2025-06-20', laenge: 9, einheit: 'tage',
      wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH',
    }));
    const zpo2 = berechneFrist({
      ereignis: '2025-06-20', laenge: 9, einheit: 'tage',
      verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich',
    });
    expect(allg2.endDatumISO).toBe(zpo2.diesAdQuemISO);
  });

  it('AF-15 Eingabe-Validierung: Kanton nötig bei Feiertags-Toggle; Länge ganzzahlig > 0', () => {
    expect(() => berechneAllgemeineFrist(basis({ feiertageVerschieben: true }))).toThrow(/Kanton/);
    expect(() => berechneAllgemeineFrist(basis({ laenge: 0 }))).toThrow(/ganze Zahl/);
    expect(() => berechneAllgemeineFrist(basis({ laenge: 1.5 }))).toThrow(/ganze Zahl/);
  });
});

describe('Allgemeiner Fristenrechner – Review-Befund (Toggle-Kopplung)', () => {
  it('AF-16 Feiertags-Option impliziert Wochenend-Verschiebung: Sa 1.8.2026 → Mo 3.8.2026 (nie Sonntags-Ende)', () => {
    const r = berechneAllgemeineFrist(basis({
      start: '2026-07-31', laenge: 1, einheit: 'tage',
      wochenendeVerschieben: false, feiertageVerschieben: true, kanton: 'ZH',
    }));
    expect(r.endDatum).toBe('03.08.2026');
    expect(r.endWochentag).toBe('Montag');
  });

  it('AF-17 nur Wochenend-Modus: Werktags-Feiertag (Karfreitag) bleibt bewusst stehen (Goldwert)', () => {
    const r = berechneAllgemeineFrist(basis({
      start: '2025-04-17', laenge: 1, einheit: 'tage',
      wochenendeVerschieben: true, feiertageVerschieben: false,
    }));
    expect(r.endDatum).toBe('18.04.2025'); // Karfreitag – Feiertage bewusst ignoriert
    expect(r.verschoben).toBe(false);
  });
});

describe('Verbesserungs-Auftrag 5.6.2026 – P1', () => {
  // Deklarierte fachliche Änderung 10.6.2026 (Bug-Check MITTEL): Der Stichtag
  // zählte als letzter Fristtag mit — zwischen Handlung und Stichtag lagen nur
  // frist−1 freie Tage. Neu liegt die VOLLE Frist dazwischen (h.L. zu Art. 700
  // Abs. 1 OR: weder Versand- noch Versammlungstag zählen mit). Für
  // Kündigungstermine (Zugangs-Konvention) verweist ein Hinweis auf die
  // Fach-Rechner.
  it('AF-18 Rückwärts: Termin 20.4.2026 − 10 Tage = spätester Ladungstag 9.4.2026 (volle freie Tage 10.–19.4., Versammlungstag zählt nicht)', async () => {
    const { berechneRueckwaertsFrist } = await import('../lib/allgemeineFrist');
    const r = berechneRueckwaertsFrist({ stichtag: '2026-04-20', laenge: 10, einheit: 'tage', verschiebung: 'keine' });
    expect(r.endDatum).toBe('09.04.2026');
    expect(r.verschoben).toBe(false);
    expect(r.hinweise.join()).toMatch(/Zugangs-Konvention/);
  });

  it('AF-19 Rückwärts: 30.6.2026 − 3 Monate = 29.3.2026 (volle 3 Monate 30.3.–29.6. dazwischen); Klemmung 31.5. − 3 M = 28.2.', async () => {
    const { berechneRueckwaertsFrist } = await import('../lib/allgemeineFrist');
    expect(berechneRueckwaertsFrist({ stichtag: '2026-06-30', laenge: 3, einheit: 'monate', verschiebung: 'keine' }).endDatum).toBe('29.03.2026');
    // RL-24/F1-06 (Prüfung Rechtslogik 23.9.2026, deklarierte Fachänderung 24.9.2026):
    // bis dahin hier 27.02.2026 festgeschrieben («geklemmt − 1»). Nach der eigenen
    // Konvention (volle Frist zwischen Handlung und Stichtag) ist 28.2. + 3 Mt = 28.5.
    // < 31.5. noch fristwahrend → spätester Tag 28.02.2026.
    expect(berechneRueckwaertsFrist({ stichtag: '2026-05-31', laenge: 3, einheit: 'monate', verschiebung: 'keine' }).endDatum).toBe('28.02.2026');
  });

  it('AF-20 Rückwärts: KEINE automatische Verschiebung am Wochenende; Vorverlegung nur als Option mit Vorbehalt', async () => {
    const { berechneRueckwaertsFrist } = await import('../lib/allgemeineFrist');
    // spätester Tag Fr 24.4.2026 (Stichtag 5.5. − 10 Tage − 1, neue Zählweise)
    const ohne = berechneRueckwaertsFrist({ stichtag: '2026-05-05', laenge: 10, einheit: 'tage', verschiebung: 'keine' });
    expect(ohne.endDatum).toBe('24.04.2026');
    expect(ohne.endWochentag).toBe('Freitag');
    expect(ohne.hinweise.join()).toMatch(/höchstrichterlich ungeklärt/);
    // Wochenend-Fall mit neuer Zählweise: Stichtag 4.5. → Sa 25.4. − 1 = Fr? Nein:
    // 4.5.−10−1 = 23.4. (Do). Wochenende erreicht der Stichtag 6.5.: 6.5.−11 = Sa 25.4.
    const sa = berechneRueckwaertsFrist({ stichtag: '2026-05-06', laenge: 10, einheit: 'tage', verschiebung: 'keine' });
    expect(sa.endDatum).toBe('25.04.2026');
    expect(sa.endWochentag).toBe('Samstag');
    const mit = berechneRueckwaertsFrist({ stichtag: '2026-05-06', laenge: 10, einheit: 'tage', verschiebung: 'vorverlegen' });
    expect(mit.endDatum).toBe('24.04.2026'); // Freitag
    expect(mit.verschoben).toBe(true);
  });

  it('AF-21 Zustell-Helfer: Einschreiben Mi 1.4.2026 → 7. Tag = 8.4.2026; A-Post Plus Sa 4.4.2026 → Mo 6.4.2026', async () => {
    const { zustellHinweis } = await import('../lib/allgemeineFrist');
    const e = zustellHinweis('einschreiben', '2026-04-01');
    expect(e.vorschlagISO).toBe('2026-04-08');
    expect(e.hinweise.join()).toMatch(/138 Abs\. 3 lit\. a ZPO/);
    expect(e.hinweise.join()).toMatch(/keine verbindliche Zustellberechnung/);
    // Auftrags-Beispiel ohne Kantons-Feiertage: Sa 4.4. → Mo 6.4.
    const a = zustellHinweis('apostplus', '2026-04-04');
    expect(a.vorschlagISO).toBe('2026-04-06');
    // MIT Kanton ZH ist Mo 6.4.2026 Ostermontag → Di 7.4.
    expect(zustellHinweis('apostplus', '2026-04-04', 'ZH').vorschlagISO).toBe('2026-04-07');
    expect(a.hinweise.join()).toMatch(/142 Abs\. 1bis ZPO/);
    // Karfreitag (ZH): Fr 3.4.2026 → über Sa/So UND Ostermontag (6.4.) auf Di 7.4.2026
    expect(zustellHinweis('apostplus', '2026-04-03', 'ZH').vorschlagISO).toBe('2026-04-07');
  });

  it('AF-22 .ics deterministisch (RFC 5545, ganztägig, VALARM-Vorfrist, kein Date.now)', async () => {
    const { icsFuerFrist } = await import('../lib/allgemeineFrist');
    const a = icsFuerFrist({ titel: 'Fristende', endISO: '2026-06-30', vorfristTage: 3 });
    const b = icsFuerFrist({ titel: 'Fristende', endISO: '2026-06-30', vorfristTage: 3 });
    expect(a).toBe(b);
    expect(a).toContain('DTSTART;VALUE=DATE:20260630');
    expect(a).toContain('DTEND;VALUE=DATE:20260701');
    expect(a).toContain('TRIGGER:-P3D');
    expect(a).toContain('BEGIN:VEVENT');
    expect(a.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('AF-23 Permalink-Roundtrip: kodieren → lesen ergibt dieselben Eingaben; kaputte Query → null', async () => {
    const { fristQueryKodieren, fristQueryLesen } = await import('../lib/allgemeineFrist');
    const input = { start: '2026-06-05', laenge: 30, einheit: 'tage' as const, wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'BS' as const };
    const q = fristQueryKodieren(input);
    expect(fristQueryLesen(q)).toMatchObject(input);
    expect(fristQueryLesen('s=böse&l=-3')).toBeNull();
    expect(fristQueryLesen('')).toBeNull();
  });
});

describe('Kombinierter Fristenrechner – Trennungs-Querschnitt (5.6.2026)', () => {
  it('dieselbe 10-Tage-Frist um Ostern endet je Verfahren VERSCHIEDEN (Engines getrennt)', async () => {
    const { berechneFrist } = await import('../lib/zpoFristen');
    const { berechneSchkgFrist } = await import('../lib/schkgFristen');
    // Zustellung 26.3.2026 (Do), 10 Tage, Kanton ZH — Karfreitag 3.4./Ostermontag 6.4.2026,
    // ZPO-Oster-Stillstand 29.3.–12.4., SchKG-Betreibungsferien 29.3.–12.4. (je eigene Regeln)
    const allg = berechneAllgemeineFrist({ start: '2026-03-26', laenge: 10, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH' });
    const zpo = berechneFrist({ ereignis: '2026-03-26', einheit: 'tage', laenge: 10, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich' });
    const schkg = berechneSchkgFrist({ ereignis: '2026-03-26', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'ZH' });
    // Allgemein: 5.4. (So) → Ostermontag 6.4. ist ZH-Feiertag → Di 7.4.
    expect(allg.endDatum).toBe('07.04.2026');
    // ZPO: Stillstand Art. 145 Abs. 1 lit. a schiebt weit über die Ferien hinaus
    expect(zpo.diesAdQuemISO > '2026-04-12').toBe(true);
    // SchKG: Betreibungsferien (Art. 56 Ziff. 2) — Ende ebenfalls nach den Ferien,
    // aber nach EIGENER Regel (Art. 63), nicht identisch mit der ZPO-Spiegelung erzwungen
    expect(schkg.diesAdQuemISO > '2026-04-12').toBe(true);
    // Trennung wirkt: drei verschiedene Rechenwege, allgemein ≠ zpo
    expect(allg.endDatum).not.toBe(zpo.diesAdQuem);
  });

  // Kalender-Visualisierung (Angleichung an ZPO/SchKG, 5.6.2026): Die Engine
  // liefert die ISO-Anker; «Ereignistag zählt nicht» bleibt Logikschicht (§3).
  it('Kalender-Felder: startISO = Eingabe, fristbeginnISO = Folgetag (Art. 77 OR); rückwärts nur Stichtag', async () => {
    const r = berechneAllgemeineFrist(basis());
    expect(r.startISO).toBe('2020-10-23');
    expect(r.fristbeginnISO).toBe('2020-10-24');
    const { berechneRueckwaertsFrist } = await import('../lib/allgemeineFrist');
    const rw = berechneRueckwaertsFrist({ stichtag: '2026-06-30', laenge: 20, einheit: 'tage', verschiebung: 'keine' });
    expect(rw.startISO).toBe('2026-06-30');
    expect(rw.fristbeginnISO).toBeUndefined();
  });
});

describe('Fach-Presets Familienrecht & Status (gebaut 10.6.2026 — Normwerte am Cache verifiziert)', () => {
  it('Preset-Werte entsprechen den Gesetzen (263/256c/313 II ZGB · 546 OR · 450b I/445 III ZGB)', async () => {
    const { FAM_STATUS_PRESETS } = await import('../lib/famStatusPresets');
    const by = (norm: string) => FAM_STATUS_PRESETS.filter((p) => p.norm.includes(norm));
    expect(by('263 Abs. 1 Ziff. 1')[0]).toMatchObject({ laenge: 1, einheit: 'jahre' });
    const c256 = by('256c Abs. 1');
    expect(c256.map((p) => [p.laenge, p.einheit])).toEqual([[1, 'jahre'], [5, 'jahre']]);
    expect(c256[0].info).toContain('FRÜHERE'); // min(relativ, absolut) offengelegt
    expect(by('313 Abs. 2')[0]).toMatchObject({ laenge: 1, einheit: 'jahre' });
    expect(by('546 Abs. 1 OR')[0]).toMatchObject({ laenge: 6, einheit: 'monate' });
    expect(by('450b Abs. 1')[0]).toMatchObject({ laenge: 30, einheit: 'tage' });
    expect(by('445 Abs. 3')[0]).toMatchObject({ laenge: 10, einheit: 'tage' });
    // Bewusst KEIN 291-III-Preset (richterliche Frist) und KEIN 262/279-ZGB-Preset (Rückwärts-Rechnungen)
    expect(FAM_STATUS_PRESETS.some((p) => p.norm.includes('291'))).toBe(false);
  });
});
