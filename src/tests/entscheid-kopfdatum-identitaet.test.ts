import { describe, it, expect, vi } from 'vitest';
import { kopfEntscheiddatum, aktenzeichenRe } from '../../scripts/normtext/entscheid-kopfdatum';
import { kantonsEntscheiddatum, kopfdatumRueckfallMeldung, kopfSeitenMitRueckfallMeldung } from '../../scripts/normtext/entscheid-kantonsdatum';
import { kopfdatumRefresh } from '../../scripts/normtext/entscheide-kopfdatum-refresh';
import type { OclDecision } from '../../scripts/normtext/adapter-entscheide';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

// Gegenprüfungs-Befunde zu PR #1126 (QS-KORPUS, 25.9.2026). Echte Auszüge:
// OCL full_text bzw. Seiten des amtlichen PDF, abgerufen 25.9.2026 (gemeinfrei, Art. 5 URG).
const SG_BV_2024_21 = 'Publikationsplattform St.Galler Gerichte Fall-Nr.: BV 2024/21 Stelle: Versicherungsgericht Rubrik: BV - berufliche Vorsorge Publikationsdatum: 21.08.2025 Entscheiddatum: 04.07.2025 Entscheid Versicherungsgericht, 04.07.2025 Art. 122 ff. ZGB; Art. 281 Abs. 3 ZPO; Art. 22c FZG. Vorsorgeausgleich (Entscheid des Versicherungsgerichts des Kantons St. Gallen vom 4. August 2025, BV 2024/21). «Entscheid als PDF» © Kanton St.Gallen 2026 Seite 1/9 Kanton St.Gallen Gerichte 1/8 Versicherungsgericht Abteilung III Entscheid vom 4. August 2025 Besetzung Versicherungsrichter Michael Rutz (Vorsitz)';
const SG_UV_2025_14_OCL = 'St.Gallen Versicherungsgericht 23.10.2025 UV 2025/14 Saint-Gall Versicherungsgericht 23.10.2025 UV 2025/14 San Gallo Versicherungsgericht 23.10.2025 UV 2025/14 Art. 6 Abs. 1 UVG; Art. 11 UVV; Leistungspflicht der Unfallversicherung';
const SG_UV_2025_14_PDF = [
  'Publikationsplattform St.Galler Gerichte Fall-Nr.: UV 2025/14 Stelle: Versicherungsgericht Rubrik: UV - Unfallversicherung Publikationsdatum: 21.11.2025 Entscheiddatum: 23.10.2025 Entscheid Versicherungsgericht, 23.10.2025 Art. 6 Abs. 1 UVG; Art. 11 UVV; Leistungspflicht der Unfallversicherung für Rückfall/Spät',
  'Kanton St.Gallen Gerichte 1/16 Versicherungsgericht Abteilung III Entscheid vom 21. Oktober 2025 Besetzung Versicherungsrichter Michael Rutz (Vorsitz), Versicherungsrichterinnen Mirjam Angehrn und Corinne Schambeck; a.o. Gerichtsschreiber Julian Gantenbein Geschäftsnr. UV 2025/14 Parteien',
  'UV 2025/14 2/16 Sachverhalt A. A.a A.___ (nachfolgend',
];
const BE_100_2025_363_PDF = [
  '100.2025.363U DAM/BDE/AMA Verwaltungsgericht des Kantons Bern Verwaltungsrechtliche Abteilung Urteil des Einzelrichters vom 20. August 2026 Verwaltungsrichter Daum, Abteilungspräsident Gerichtsschreiberin Baerfuss Klossner A._____',
  'Urteil des Verwaltungsgerichts des Kantons Bern vom 20.08.2026, Nr. 100.2025.363U, Seite 2 Der Einzelrichter',
];

const det = (over: Partial<OclDecision>): OclDecision => ({
  decision_id: 'x', court: 'sg_gerichte', canton: 'SG', language: 'de', docket_number: 'B 2023/225',
  decision_date: '2025-12-22', full_text: '', ...over,
} as OclDecision);

describe('Befund 1 — Titel gegen Plattformfeld im selben Kopf', () => {
  it('Fremd-Zitat nach Strichpunkt ergibt nie das BGer-Datum (konstruiert)', () => {
    const k = kopfEntscheiddatum('Fall-Nr.: B 2023/225 Entscheiddatum: 08.01.2025 Die Beschwerde wurde abgewiesen; Urteil vom 22. Dezember 2025', 'B 2023/225');
    expect(k.status === 'ok' && k.datum === '2025-12-22').toBe(false);
  });
  it('«Bundesgericht: Urteil vom …» ergibt nie das BGer-Datum (konstruiert)', () => {
    const k = kopfEntscheiddatum('Fall-Nr.: B 2023/225 Entscheiddatum: 08.01.2025 Bundesgericht: Urteil vom 22. Dezember 2025', 'B 2023/225');
    expect(k.status === 'ok' && k.datum === '2025-12-22').toBe(false);
    expect(kopfEntscheiddatum('Obergericht Bundesgericht: Urteil vom 22. Dezember 2025', null).status).toBe('fehlt');
  });
  it('Titel ohne Identitätsbeleg gegen abweichendes Plattformfeld ⇒ widerspruch (kein Datum)', () => {
    const k = kopfEntscheiddatum('Entscheiddatum: 08.01.2025 Verwaltungsgericht Urteil vom 22. Dezember 2025', 'B 2023/225');
    expect(k.status).toBe('widerspruch');
    const z = kopfEntscheiddatum('St.Gallen Verwaltungsgericht 08.01.2025 B 2023/225 Urteil vom 22. Dezember 2025', 'B 2023/225');
    expect(z.status).toBe('widerspruch');
  });
  it('Titel mit gleichem Datum wie das Plattformfeld braucht keinen Beleg', () => {
    expect(kopfEntscheiddatum('Entscheiddatum: 08.01.2025 Verwaltungsgericht Entscheid vom 8. Januar 2025', 'B 2023/225'))
      .toMatchObject({ status: 'ok', datum: '2025-01-08', regel: 'titel-vom' });
  });
  it('echt SG BV 2024/21: Titel belegt durch «vom 4. August 2025, BV 2024/21» ⇒ Kopf gewinnt', () => {
    const k = kopfEntscheiddatum(SG_BV_2024_21, 'BV 2024/21');
    expect(k).toMatchObject({ status: 'ok', datum: '2025-08-04', regel: 'titel-vom' });
    if (k.status === 'ok') expect(k.abweichung.map((x) => x.datum)).toEqual(['2025-07-04']);
  });
  it('dieselbe Zitat-Stelle mit FREMDEM Aktenzeichen belegt nichts', () => {
    expect(kopfEntscheiddatum(SG_BV_2024_21.replace('vom 4. August 2025, BV 2024/21', 'vom 4. August 2025, BV 2024/2'), 'BV 2024/21').status).toBe('widerspruch');
  });
  it('eigenes Aktenzeichen unmittelbar vor dem Titel belegt ihn (AG/BS-Kopfform)', () => {
    expect(kopfEntscheiddatum('Entscheiddatum: 04.07.2025 Obergericht XBE.2025.10 Entscheid vom 21. August 2025', 'XBE.2025.10'))
      .toMatchObject({ status: 'ok', datum: '2025-08-21' });
    expect(kopfEntscheiddatum('Entscheiddatum: 04.07.2025 B 2023/225. Obergericht Urteil vom 22. Dezember 2025', 'B 2023/225').status).toBe('widerspruch');
  });
  it('Plattform-Kopfzeile mit mehreren Aktenzeichen: auch das zweite belegt keinen Titel (Nachprüfung 25.9.2026)', () => {
    // Echte SG-OCL-Form (dreisprachige Kopfzeile, verbundene Verfahren), dahinter ein BGer-Nachgang.
    const sg = 'St.Gallen Verwaltungsgericht 03.02.2025 B 2024/58, B 2024/59 Saint-Gall Verwaltungsgericht 03.02.2025 B 2024/58, B 2024/59 San Gallo Verwaltungsgericht 03.02.2025 B 2024/58, B 2024/59 Entscheid vom 14. Januar 2026 des Bundesgerichts';
    const k = kopfEntscheiddatum(sg, 'B 2024/58, B 2024/59');
    expect(k.status).toBe('widerspruch');
    expect(kopfEntscheiddatum('Verwaltungsgericht 03.02.2025 B 2024/58 und B 2024/59 Urteil vom 14. Januar 2026', 'B 2024/58, B 2024/59').status).toBe('widerspruch');
    // Gegenprobe: dasselbe Aktenzeichen AUSSERHALB der Kopfzeile unmittelbar vor dem Titel belegt weiterhin.
    expect(kopfEntscheiddatum('Verwaltungsgericht 03.02.2025 B 2024/58, B 2024/59 Abteilung II B 2024/59 Entscheid vom 4. Februar 2025', 'B 2024/58, B 2024/59'))
      .toMatchObject({ status: 'ok', datum: '2025-02-04' });
    expect(kopfEntscheiddatum('Entscheiddatum: 04.07.2025 Abteilung B 2024/58, B 2024/59 Entscheid vom 3. Februar 2025', 'B 2024/58, B 2024/59'))
      .toMatchObject({ status: 'ok', datum: '2025-02-03' });
  });
  it('echt SG UV 2025/14: Titel auf PDF-Seite 2, Aktenzeichen im PDF ⇒ 21.10.2025', () => {
    const d = det({ docket_number: 'UV 2025/14', decision_date: '2025-10-23', full_text: SG_UV_2025_14_OCL });
    expect(kantonsEntscheiddatum(d, SG_UV_2025_14_PDF)).toMatchObject({ datum: '2025-10-21', quelle: 'kopf-amtliches-pdf' });
  });
  it('Titel zählt nur auf einer Seite MIT dem eigenen Aktenzeichen (Deckblatt-Az deckt keine Folgeseite, Nachprüfung 25.9.2026)', () => {
    const d = det({ docket_number: 'UV 2025/14', decision_date: '2025-10-23', full_text: 'St.Gallen Versicherungsgericht 23.10.2025 UV 2025/14 Regeste' });
    const r = kantonsEntscheiddatum(d, ['Deckblatt UV 2025/14 Entscheiddatum: 23.10.2025', 'Urteil vom 1. Mai 2020 der Vorinstanz']);
    expect(r.datum).not.toBe('2020-05-01');
    expect(r).toMatchObject({ datum: '2025-10-23', quelle: 'kopf-ocl-volltext' });
    // echte SG-Seite 2 ohne ihre Zeile «Geschäftsnr. UV 2025/14» ⇒ ebenfalls kein PDF-Datum
    const ohneAz = [SG_UV_2025_14_PDF[0], SG_UV_2025_14_PDF[1].replace(' Geschäftsnr. UV 2025/14', ''), SG_UV_2025_14_PDF[2]];
    expect(kantonsEntscheiddatum(d, ohneAz).quelle).toBe('kopf-ocl-volltext');
  });
  it('PDF ohne das eigene Aktenzeichen gilt nicht als Kopf dieses Entscheids', () => {
    const d = det({ docket_number: 'UV 2025/14', decision_date: '2025-10-23', full_text: SG_UV_2025_14_OCL });
    const fremd = SG_UV_2025_14_PDF.map((s) => s.replace(/UV 2025\/14/g, 'UV 2025/15'));
    expect(kantonsEntscheiddatum(d, fremd)).toMatchObject({ datum: '2025-10-23', quelle: 'kopf-ocl-volltext' });
  });
  it('Widerspruch im OCL-Kopf ⇒ OCL-Wert, kein PDF-Datum', () => {
    const d = det({ full_text: 'Entscheiddatum: 08.01.2025 Verwaltungsgericht Urteil vom 22. Dezember 2025', decision_date: '2025-12-22' });
    const r = kantonsEntscheiddatum(d, ['Fall-Nr.: B 2023/225 Verwaltungsgericht Entscheid vom 9. Januar 2025']);
    expect(r).toMatchObject({ datum: '2025-12-22', quelle: 'ocl-decision_date' });
    expect(r.kopf.status).toBe('widerspruch');
  });
});

describe('Befund 3 — Aktenzeichen-Identität: Leerzeichen/Punkt, verbundene Verfahren, eng', () => {
  const re = (az: string) => aktenzeichenRe(az)!;
  it('BE: «100.2025.363U» und «100 2025 363» sind dasselbe Aktenzeichen', () => {
    expect(re('100 2025 363').test('Nr. 100.2025.363U, Seite 2')).toBe(true);
    expect(re('100 2025 363').test('100 2025 363 DAM')).toBe(true);
    expect(re('100.2025.363').test('SH 100 2025 363 -')).toBe(true);
  });
  it('verbundene Verfahren «100.2026.142/143» decken beide Nummern', () => {
    expect(re('100 2026 142').test('100.2026.142/143U')).toBe(true);
    expect(re('100 2026 143').test('100.2026.142/143')).toBe(true);
  });
  it('keine Präfix-/Suffix-Treffer', () => {
    expect(re('100 2026 14').test('100.2026.142/143')).toBe(false);
    expect(re('100 2025 36').test('100.2025.363U')).toBe(false);
    expect(re('100 2025 363').test('100.2025.3630')).toBe(false);
    expect(re('100 2025 363').test('1100.2025.363')).toBe(false);
    expect(re('100 2025 363').test('100.2025.363.1')).toBe(false);
    expect(re('UV 2025/14').test('UV 2025/140')).toBe(false);
    expect(re('UV 2025/14').test('XUV 2025/14')).toBe(false);
    expect(re('B 2023/225').test('B 2023/225A')).toBe(false);
  });
  it('BE-Suffix nur die belegte Form «U» (Nachprüfung 25.9.2026)', () => {
    expect(re('100 2025 363').test('Nr. 100.2025.363U, Seite 2')).toBe(true);
    for (const x of ['V', 'A', 'Z', 'u']) expect(re('100 2025 363').test(`Nr. 100.2025.363${x}, Seite 2`)).toBe(false);
    expect(re('100 2026 142').test('100.2026.142/143V')).toBe(false);
  });
  it('GR-Referenz mit Kurzjahr («Referenz SBK 26 38», echter PDF-Kopf) = «SBK 2026 38», eng', () => {
    expect(re('SBK 2026 38').test('mitgeteilt am 28. Mai 2026 Referenz SBK 26 38 Instanz')).toBe(true);
    expect(re('SBK 2026 38').test('Referenz SBK 26 388')).toBe(false);
    expect(re('SBK 2026 38').test('Referenz SBK 25 38')).toBe(false);
    expect(re('B 2023/225').test('B 23/225')).toBe(false);
  });
  it('mehrere Aktenzeichen (SG «B 2024/58, B 2024/59»): jedes einzeln', () => {
    expect(re('B 2024/58, B 2024/59').test('(Verwaltungsgericht, B 2024/58 und B 2024/59)')).toBe(true);
  });
  it('leeres Aktenzeichen ⇒ kein Muster', () => {
    expect(aktenzeichenRe('')).toBeNull();
    expect(aktenzeichenRe('  ')).toBeNull();
  });
  it('echt BE 100 2025 363: PDF-Kopf mit Punkt-Form wird als eigener Kopf erkannt', () => {
    const d = det({ court: 'be_verwaltungsgericht', canton: 'BE', docket_number: '100 2025 363', decision_date: '2026-09-13', full_text: 'Verwaltungsgericht des Kantons Bern Verwaltungsrechtliche Abteilung Verwaltungsrichter Daum' });
    expect(kantonsEntscheiddatum(d, BE_100_2025_363_PDF)).toMatchObject({ datum: '2026-08-20', quelle: 'kopf-amtliches-pdf' });
  });
});

describe('Befund 2 — stiller Rückfall auf OCL decision_date wird gemeldet', () => {
  it('kein Kopfdatum: Zeile mit Gericht, Aktenzeichen, Grund (deterministisch)', () => {
    const d = det({ court: 'be_verwaltungsgericht', canton: 'BE', docket_number: '100 2026 7', decision_date: '2026-05-02', full_text: 'Verwaltungsgericht Verfügung des Instruktionsrichters vom 30. April 2026' });
    const r = kantonsEntscheiddatum(d, null);
    expect(r.quelle).toBe('ocl-decision_date');
    const z = kopfdatumRueckfallMeldung(d, r);
    expect(z).toBe('[kopfdatum] Rückfall auf OCL decision_date 2026-05-02: be_verwaltungsgericht 100 2026 7 — kein eigenes Kopfdatum im OCL-Kopf; amtliches PDF nicht verfügbar');
    expect(kopfdatumRueckfallMeldung(d, r)).toBe(z);
  });
  it('Widerspruch: Zeile nennt die Kandidaten', () => {
    const d = det({ full_text: 'Entscheiddatum: 08.01.2025 Verwaltungsgericht Urteil vom 22. Dezember 2025' });
    expect(kopfdatumRueckfallMeldung(d, kantonsEntscheiddatum(d, null)))
      .toBe('[kopfdatum] Rückfall auf OCL decision_date 2025-12-22: sg_gerichte B 2023/225 — Widerspruch im Kopf (titel-vom=2025-12-22, feld-entscheiddatum=2025-01-08)');
  });
  it('Live-Import-Pfad schreibt die Zeile ins Log (ohne PDF-URL: kein Netz)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const d = det({ court: 'be_verwaltungsgericht', canton: 'BE', docket_number: '100 2026 7', decision_date: '2026-05-02', full_text: 'Verwaltungsgericht Verfügung des Instruktionsrichters vom 30. April 2026' });
      expect(await kopfSeitenMitRueckfallMeldung(d)).toBeNull();
      expect(warn.mock.calls.map((c) => c[0])).toEqual(['[kopfdatum] Rückfall auf OCL decision_date 2026-05-02: be_verwaltungsgericht 100 2026 7 — kein eigenes Kopfdatum im OCL-Kopf; amtliches PDF nicht verfügbar']);
      warn.mockClear();
      await kopfSeitenMitRueckfallMeldung(det({ canton: 'CH', court: 'bger' }));
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
  it('Kopfdatum gefunden ⇒ keine Meldung', () => {
    const d = det({ docket_number: 'UV 2025/14', full_text: SG_UV_2025_14_OCL });
    expect(kopfdatumRueckfallMeldung(d, kantonsEntscheiddatum(d, null))).toBeNull();
  });
});

describe('Refresh: Kopf-Widerspruch bricht ab (nichts geändert)', () => {
  it('ABBRUCH statt OCL-Wert in den Bestand', async () => {
    const s = {
      id: 'kanton/SG/sg_gerichte/B2023_225', gericht: 'sg_gerichte', gerichtName: 'Verwaltungsgericht SG', kanton: 'SG',
      nummer: 'B 2023/225', datum: '2025-01-08', zitierung: 'z', quelle: 'opencaselaw', quelleUrl: 'https://x', abgerufen: '2026-06-26',
      fassungsToken: 'h', sha: 's', abschnitte: [],
    } as unknown as EntscheidSnapshot;
    const d = det({ decision_id: 'sg_gerichte_B_2023_225', full_text: 'Entscheiddatum: 08.01.2025 Verwaltungsgericht Urteil vom 22. Dezember 2025' });
    await expect(kopfdatumRefresh([s], { holeDecision: async () => d, holeSeiten: async () => null })).rejects.toThrow(/ABBRUCH.*Widerspruch/);
    expect(s.datum).toBe('2025-01-08');
  });
});
