import { describe, it, expect } from 'vitest';
import { berechneSchkgFrist } from '../lib/schkgFristen';
import { berechneFrist } from '../lib/zpoFristen';
import type { SchkgInput } from '../types/schkg';
import type { ZpoInput } from '../types/zpo';

const base = (over: Partial<SchkgInput>): SchkgInput => ({
  ereignis: '2025-03-10',
  einheit: 'tage',
  laenge: 10,
  modus: 'schkg_betreibungsferien',
  fristnatur: 'frist',
  kanton: 'ZH',
  ...over,
});

describe('SchKG-Fristenrechner', () => {
  // Betreibungsferien-Verlängerung (Art. 63): Rechtsvorschlag 10 Tage, Ende in Sommerferien.
  it('Rechtsvorschlag 10 Tage, Ende in Betreibungsferien → 3. Werktag nach 31.7.', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2025-07-10', laenge: 10 }));
    expect(r.diesAQuo).toBe('11.07.2025');
    expect(r.diesAdQuem).toBe('06.08.2025');
    expect(r.modusAktiv).toBe('schkg_betreibungsferien');
  });

  // Ohne geschlossene Zeit: 10 Tage ab 10.3. → 20.3. (Do), keine Verschiebung.
  it('Rechtsvorschlag 10 Tage ausserhalb der Ferien → 20.3.2025', () => {
    expect(berechneSchkgFrist(base({ ereignis: '2025-03-10', laenge: 10 })).diesAdQuem).toBe('20.03.2025');
  });

  // Gerichtliche Klage: ZPO-Stillstand muss dieselbe Arithmetik wie der ZPO-Rechner liefern.
  it('Aberkennungsklage (zpo_stillstand) == ZPO-Tagesfrist (Ruhen-Äquivalenz)', () => {
    const ereignis = '2025-07-10';
    const schkg = berechneSchkgFrist(base({ ereignis, laenge: 20, modus: 'zpo_stillstand', fristnatur: 'verwirkung' }));
    const zpo = berechneFrist({
      ereignis, einheit: 'tage', laenge: 20, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich',
    } as ZpoInput);
    expect(schkg.diesAdQuemISO).toBe(zpo.diesAdQuemISO);
    expect(schkg.ruhenAnzeige).toBe(true);
  });

  // Hemmung der Verwirkungsfrist (Art. 166 Abs. 2): Fenster verlängert das Ende.
  it('Konkursbegehren 15 Monate mit Hemmung läuft später ab als ohne', () => {
    const ohne = berechneSchkgFrist(base({ ereignis: '2025-01-15', einheit: 'monate', laenge: 15, fristnatur: 'verwirkung' }));
    const mit = berechneSchkgFrist(base({
      ereignis: '2025-01-15', einheit: 'monate', laenge: 15, fristnatur: 'verwirkung',
      hemmungVon: '2025-03-01', hemmungBis: '2025-03-31',
    }));
    expect(mit.diesAdQuemISO > ohne.diesAdQuemISO).toBe(true);
    expect(mit.rechenweg.some((s) => /Hemmung|Stillstand der Verwirkungsfrist/.test(s.beschreibung))).toBe(true);
  });

  // Wartefrist: Ergebnistext nennt das früheste zulässige Datum.
  it('Wartefrist nennt das früheste zulässige Datum', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2025-03-10', laenge: 20, fristnatur: 'wartefrist' }));
    expect(r.ergebnis).toMatch(/[Ff]rühestes zulässiges Datum/);
    expect(r.warnungen.some((w) => /Wartefrist/.test(w))).toBe(true);
  });

  // Override für umstrittene Summarsachen (Art. 251 ZPO).
  it('modusOverride überschreibt das Default-Regime', () => {
    const r = berechneSchkgFrist(base({ modus: 'schkg_betreibungsferien', modusOverride: 'zpo_stillstand' }));
    expect(r.modusAktiv).toBe('zpo_stillstand');
  });

  // Verwirkungsfrist trägt den Erstreckbarkeits-Warnhinweis.
  it('Verwirkungsfrist warnt vor Nicht-Erstreckbarkeit (Art. 33 Abs. 4)', () => {
    const r = berechneSchkgFrist(base({ fristnatur: 'verwirkung' }));
    expect(r.warnungen.some((w) => /Verwirkungsfrist/.test(w))).toBe(true);
    expect(r.normverweise.some((n) => n.artikel.includes('33 Abs. 4'))).toBe(true);
  });

  // Regression (Sanity-Check): Hemmung über das rechnerische Fristende hinaus –
  // echtes Ruhen: das GANZE Fenster ab Hemmungsbeginn zählt, kein Clamp am naiven Ende.
  it('Hemmung über das naive Fristende hinaus wird voll angerechnet', () => {
    // 30 Tage ab 15.1. (dies a quo 16.1., naives Ende 14.2.); Hemmung 1.2.–30.4. (89 Tage)
    const r = berechneSchkgFrist(base({
      ereignis: '2025-01-15', laenge: 30, modus: 'kein', fristnatur: 'verwirkung',
      hemmungVon: '2025-02-01', hemmungBis: '2025-04-30',
    }));
    expect(r.diesAdQuem).toBe('14.05.2025'); // 14.2. + 89 Tage (Mittwoch, keine Verschiebung)
  });

  it('Hemmungsfenster, das erst NACH dem Fristende beginnt, wirkt nicht', () => {
    const r = berechneSchkgFrist(base({
      ereignis: '2025-01-15', laenge: 30, modus: 'kein', fristnatur: 'verwirkung',
      hemmungVon: '2025-06-01', hemmungBis: '2025-08-01',
    }));
    expect(r.diesAdQuem).toBe('14.02.2025');
  });

  // Regression (Sanity-Check): Überlappen Rechtsstillstand und Betreibungsferien,
  // ankert Art. 63 am Ende der GESAMTEN geschlossenen Zeit (Verbund-Hülle).
  it('Rechtsstillstand über die Betreibungsferien hinaus verschiebt den Art.-63-Anker', () => {
    // Ende rechnerisch 25.7. (in Sommer-BF 15.–31.7.); RS 20.7.–10.8. → 3. Werktag nach 10.8. (So) = 13.8.
    const r = berechneSchkgFrist(base({
      ereignis: '2025-07-15', laenge: 10,
      rechtsstillstandVon: '2025-07-20', rechtsstillstandBis: '2025-08-10',
    }));
    expect(r.diesAdQuem).toBe('13.08.2025');
  });

  // Regression (Fix 6.6.2026): Fristende auf Sa/So unmittelbar VOR Ferienbeginn.
  // Die Werktagsverschiebung (Art. 31 SchKG i.V.m. Art. 142 Abs. 3 ZPO) führte
  // das Ende IN die Betreibungsferien hinein (15.7. bzw. 19.12.), statt dass
  // Art. 63 SchKG am verschobenen Ende erneut griff.
  it('Ende Sa 13.7.2024 vor Sommerferien → 3. Werktag nach 31.7. = 6.8.2024', () => {
    // 20 Tage ab 23.6.2024: dies a quo 24.6., Ende Sa 13.7. → Mo 15.7. wäre
    // 1. Ferientag → Art. 63: 1.8. Feiertag, 2.8./5.8./6.8.
    const r = berechneSchkgFrist(base({ ereignis: '2024-06-23', laenge: 20 }));
    expect(r.diesAdQuem).toBe('06.08.2024');
  });

  it('Ende Sa 17.12.2022 vor Weihnachtsferien → 3. Werktag nach 1.1. (ZH: 5.1.2023)', () => {
    // 10 Tage ab 7.12.2022: Ende Sa 17.12. → Mo 19.12. wäre in den Ferien
    // (18.12.–1.1.) → Art. 63 nach 1.1.2023: 2.1. Berchtoldstag (ZH arbeitsfrei),
    // 3.1./4.1./5.1.
    const r = berechneSchkgFrist(base({ ereignis: '2022-12-07', laenge: 10 }));
    expect(r.diesAdQuem).toBe('05.01.2023');
  });

  it('Kantonsabhängiger Art.-63-Anker: BS (2.1. kein Feiertag) → 4.1.2023', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2022-12-07', laenge: 10, kanton: 'BS' }));
    expect(r.diesAdQuem).toBe('04.01.2023');
  });

  it('Gegenprobe: Ende werktags VOR den Ferien bleibt unverschoben (Fr 12.7.2024)', () => {
    const r = berechneSchkgFrist(base({ ereignis: '2024-06-22', laenge: 20 }));
    expect(r.diesAdQuem).toBe('12.07.2024');
  });

  // Regression (Review-Befund M-1, 6.6.2026): Der 3. Werktag nach Ferienende
  // fällt in einen NICHT angrenzenden Rechtsstillstand — Art. 63 greift erneut.
  it('3. Werktag nach Weihnachtsferien fällt in separaten Rechtsstillstand → erneut Art. 63', () => {
    // 5 Tage ab 15.12.2024: Ende in Weihnachtsferien (18.12.–1.1.) → 3. Werktag
    // nach 1.1.2025 wäre Di 7.1. (2.1. Berchtoldstag ZH, 3.1. Fr = 1, 6.1. Mo = 2,
    // 7.1. = 3) — liegt aber im Rechtsstillstand 6.–10.1. → 3. Werktag nach
    // Fr 10.1.: Mo 13.1. (1), Di 14.1. (2), Mi 15.1.2025 (3).
    const r = berechneSchkgFrist(base({
      ereignis: '2024-12-15', laenge: 5,
      rechtsstillstandVon: '2025-01-06', rechtsstillstandBis: '2025-01-10',
    }));
    expect(r.diesAdQuem).toBe('15.01.2025');
  });

  it('Rechtsstillstand-Eingabe ausserhalb des Betreibungsferien-Regimes erzeugt eine Warnung', () => {
    const r = berechneSchkgFrist(base({
      modus: 'zpo_stillstand', rechtsstillstandVon: '2025-07-20', rechtsstillstandBis: '2025-08-10',
    }));
    expect(r.warnungen.some((w) => w.includes('unberücksichtigt'))).toBe(true);
  });
});

// ─── B2-Fix 6.6.2026 (deklarierte fachliche Änderung) ────────────────────────
// Art. 56 Ziff. 2 SchKG: «in der Wechselbetreibung gibt es keine Betreibungs-
// ferien» — die drei Wechsel-Presets liefen vorher fälschlich mit Ferien-Modus.
import { PRESETS_SCHKG } from '../lib/schkgPresets';

describe('Audit-Fix B2 – Wechselbetreibung ohne Betreibungsferien', () => {
  // RL-19 / Befund F2-05 (deklarierte fachliche Änderung, 24.9.2026): Art. 56
  // Abs. 1 Ziff. 2 SchKG schliesst in der Wechselbetreibung nur die
  // Betreibungs-FERIEN aus, nicht den Rechtsstillstand (Ziff. 3, Art. 63).
  // Die Invariante «keine Betreibungsferien» bleibt; statt 'kein' tragen die
  // von einer Betreibungshandlung ausgelösten Fristen das Regime
  // 'schkg_wechsel' (Rechtsstillstand mit Art. 63), die Beschwerde (Art. 20)
  // bleibt auf 'kein' mit Schalter wie Art. 17 (RL-17/W-09).
  it('kein Wechsel-Preset rechnet mit Betreibungsferien', () => {
    const wechsel = PRESETS_SCHKG.filter((p) => p.key.includes('wechsel'));
    expect(wechsel.map((p) => p.key).sort()).toEqual(
      ['beschwerde_wechsel', 'konkursbegehren_wechsel', 'rechtsvorschlag_wechsel'],
    );
    for (const p of wechsel) expect(p.modus, p.key).not.toBe('schkg_betreibungsferien');
    for (const p of wechsel) expect(p.modusBeiBetreibungshandlung ?? p.modus, p.key).toBe('schkg_wechsel');
    for (const p of wechsel) expect(p.hinweis).toContain('Art. 56 Ziff. 2');
  });

  it('Repro des Audit-Befunds: 5 Tage ab 25.07.2025 enden am 30.07. (nicht 06.08.)', () => {
    // Mit Betreibungsferien-Modus verschob die Sommerferien-Logik (15.–31.7.)
    // das Ende via Art. 63 auf den 06.08.2025 — für die Wechselbetreibung falsch.
    const r = berechneSchkgFrist(base({ ereignis: '2025-07-25', laenge: 5, modus: 'kein' }));
    expect(r.diesAdQuem).toBe('30.07.2025');
    const falsch = berechneSchkgFrist(base({ ereignis: '2025-07-25', laenge: 5, modus: 'schkg_betreibungsferien' }));
    expect(falsch.diesAdQuem).not.toBe('30.07.2025'); // belegt die Differenz
  });
});

describe('Bug-Check-Fixes 10.6.2026 (deklarierte fachliche Änderungen)', () => {
  it('Wartefrist: frühestes zulässiges Datum ist der FOLGETAG des Fristablaufs (Art. 88 Abs. 1: «frühestens 20 Tage NACH Zustellung»)', () => {
    const r = berechneSchkgFrist({ ereignis: '2026-04-01', einheit: 'tage', laenge: 20, modus: 'schkg_betreibungsferien', fristnatur: 'wartefrist', kanton: 'ZH' });
    // dies a quo 2.4., 20. Tag (Fristablauf 24.00 Uhr) = 21.4. → frühestens 22.4.
    expect(r.diesAdQuem).toBe('22.04.2026');
    expect(r.ergebnis).toContain('Frühestes zulässiges Datum: 22.04.2026');
    expect(r.rechenweg.some((s) => s.beschreibung.includes('Frühestes zulässiges Datum'))).toBe(true);
  });
  it('Pauliana: VERJÄHRUNGSfrist ohne Gerichtsferien-Ruhen (Art. 292 SchKG; Hemmung nur nach OR)', async () => {
    const { PRESETS_SCHKG } = await import('../lib/schkgPresets');
    const p = PRESETS_SCHKG.find((x) => x.key === 'pauliana')!;
    expect(p.modus).toBe('kein');
    expect(p.hinweis).toContain('kein Gerichtsferien-Stillstand');
    // 3 Jahre ab 10.1.2026 enden am 10.1.2029 — ohne ~8-Monats-Verlängerung
    const r = berechneSchkgFrist({ ereignis: '2026-01-10', einheit: 'jahre', laenge: 3, modus: p.modus, fristnatur: p.fristnatur, kanton: 'ZH' });
    expect(r.diesAdQuemISO).toBe('2029-01-10');
  });
});

// RL-05 / Befund F2-01 (Prüfung Rechtslogik 23.9.2026, W2·30-RL-W1):
// Weiterzug an die obere Aufsichtsbehörde, Art. 18 Abs. 1 SchKG — «innert zehn
// Tagen nach der Eröffnung» (Fedlex SR 281.1, Fassung 1.1.2026,
// https://fedlex.data.admin.ch/eli/cc/11/529_488_529/20260101). Der Entscheid
// der unteren Aufsichtsbehörde ist i.d.R. KEINE Betreibungshandlung (Art. 56
// SchKG) → keine Verlängerung nach Art. 63 SchKG (BGer 5A_730/2023 vom
// 21.11.2023 E. 3.2–3.4). Werktagsregel bleibt: Art. 31 SchKG i.V.m. Art. 142
// Abs. 3 ZPO. Vorher: modus 'schkg_betreibungsferien' → 5.8.2026 statt 20.7.2026.
describe('RL-05 – Weiterzug Art. 18 SchKG ohne Art.-63-Verlängerung', () => {
  const p = PRESETS_SCHKG.find((x) => x.key === 'weiterzug_ab')!;
  const rechne = (ereignis: string) => berechneSchkgFrist({
    ereignis, einheit: p.einheit!, laenge: p.laenge!, modus: p.modus, fristnatur: p.fristnatur, kanton: 'ZH',
  });

  it('Preset steht auf modus \'kein\' und nennt die Ausnahme (Betreibungshandlung angeordnet → Art. 63)', () => {
    expect(p.norm).toBe('Art. 18 Abs. 1 SchKG');
    expect(p.laenge).toBe(10);
    expect(p.modus).toBe('kein');
    expect(p.hinweis).toContain('Ausnahme');
    expect(p.hinweis).toContain('Art. 63 SchKG');
    expect(p.hinweis).toContain('5A_730/2023 E. 3.2–3.4');
  });

  it('Eröffnung Fr 10.7.2026, ZH → Fristende Mo 20.7.2026 (in den Betreibungsferien 15.–31.7., ohne Verlängerung)', () => {
    const r = rechne('2026-07-10');
    expect(r.diesAQuo).toBe('11.07.2026');
    expect(r.diesAdQuemISO).toBe('2026-07-20');
    expect(r.modusAktiv).toBe('kein');
  });

  it('Gegenprobe: mit Betreibungsferien-Modus wäre es der 5.8.2026 (3. Werktag nach 31.7.; 1.8. Sa) — genau der Befund', () => {
    const falsch = berechneSchkgFrist({
      ereignis: '2026-07-10', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'beschwerdefrist', kanton: 'ZH',
    });
    expect(falsch.diesAdQuemISO).toBe('2026-08-05');
    expect(rechne('2026-07-10').diesAdQuemISO).not.toBe(falsch.diesAdQuemISO);
  });

  it('Ende auf Samstag → nächster Werktag (Art. 31 SchKG i.V.m. Art. 142 Abs. 3 ZPO)', () => {
    // Mi 4.3.2026 + 10 Tage = Sa 14.3.2026 → Mo 16.3.2026
    expect(rechne('2026-03-04').diesAdQuemISO).toBe('2026-03-16');
    // Mi 15.7.2026 + 10 Tage = Sa 25.7.2026 (in den Betreibungsferien) → Mo 27.7.2026, nicht 5.8.
    expect(rechne('2026-07-15').diesAdQuemISO).toBe('2026-07-27');
  });
});
