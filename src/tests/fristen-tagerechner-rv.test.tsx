// ─── RECHTSLOGIK · Tagerechner / Allgemeine Frist: RV-37, RV-49, RV-52, RV-53 ─────
//
// Fehlerbestand Bereich 5 (plan/FEHLERBESTAND.md). Entscheide: W-10 (NE-Schliesstage ja,
// BL/VD nur Hinweis), W-11 a (GL 2.1. zählen + Warnung), W-12 c (Pflichtwahl).
//
// Normen (Fedlex-Snapshots public/normtext/bund, selbst gelesen 18.10.2026):
//   · Art. 89 Abs. 2 StPO «Im Strafverfahren gibt es keine Gerichtsferien.»
//   · Art. 90 Abs. 2 StPO: Ende am Samstag, Sonntag oder «vom Bundesrecht oder vom kantonalen
//     Recht anerkannten Feiertag» → nächster Werktag; massgebend das Recht des Kantons, in dem
//     Partei oder Rechtsbeistand Wohnsitz/Sitz haben. https://www.fedlex.admin.ch/eli/cc/2010/267/de#art_90
//   · NE: LI-CPP Art. 9a (RSN 322.0) stellt Schliesstage der Kantonsverwaltung für Art. 90 StPO einem
//     Feiertag gleich; SO: EG StPO § 10bis (BGS 321.3) nennt den 1. Mai. Belege: zpoFeiertage.ts.
//   · BL: § 46 Abs. 2 GOG BL (SGS 170, seit 1.1.2020), https://bl.clex.ch/app/de/texts_of_law/170.
//   · Art. 56 Abs. 1 Ziff. 2 SchKG / BGE 121 III 284 E. 2b/c (Ferienzustellung).
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { berechneAllgemeineFrist, allgemeineFristErgebnis, STPO_FRIST_HINWEIS } from '../lib/allgemeineFrist';
import { berechneFrist } from '../lib/zpoFristen';
import { feiertagsKontextFuer, schkgFerienzustellungHinweis } from '../lib/fristenSchnellrechner';
import { FERIEN_OPTIONEN, kantonFeldLabel } from '../components/forms/einfacheFristTexte';
import { FristenKalender } from '../components/FristenKalender';
import type { Kanton } from '../types/legal';

const basis = { wochenendeVerschieben: true, feiertageVerschieben: true } as const;
const allg = (start: string, laenge: number, kanton: Kanton, kontext?: 'stpo') =>
  berechneAllgemeineFrist({ start, laenge, einheit: 'tage', ...basis, kanton, ...(kontext ? { kontext } : {}) });

describe('RV-37 · StPO-Hinweis nur im StPO-Kontext', () => {
  it('OR-Frist (Standard-Kontext) trägt den StPO-Zusatz nicht', () => {
    expect(allg('2026-08-21', 10, 'ZH').hinweise).not.toContain(STPO_FRIST_HINWEIS);
  });
  it('StPO-Kontext trägt ihn (Engine, nicht UI)', () => {
    expect(allg('2026-08-21', 10, 'ZH', 'stpo').hinweise).toContain(STPO_FRIST_HINWEIS);
  });
  it('Tagerechner führt «Strafverfahren (StPO)» als eigenes Regime mit eigener Kanton-Anknüpfung', () => {
    expect(FERIEN_OPTIONEN.map((o) => o.code)).toContain('stpo');
    expect(kantonFeldLabel('stpo')).toMatch(/Wohnsitz\/Sitz der Partei oder ihres Rechtsbeistands/);
    expect(kantonFeldLabel('keine')).not.toMatch(/StPO/);
  });
});

describe('RV-49 · StPO rechnet im StPO-Kontext', () => {
  it('NE: Ostermontag 6.4.2026 (Schliesstag, LI-CPP Art. 9a) → StPO 07.04.2026, OR-Kontext 06.04.2026', () => {
    expect(allg('2026-03-27', 10, 'NE', 'stpo').endDatum).toBe('07.04.2026');
    expect(allg('2026-03-27', 10, 'NE').endDatum).toBe('06.04.2026');
  });
  it('SO: 1. Mai 2026 (EG StPO § 10bis) → StPO Mo 04.05.2026, OR-Kontext 01.05.2026', () => {
    expect(allg('2026-04-21', 10, 'SO', 'stpo').endDatum).toBe('04.05.2026');
    expect(allg('2026-04-21', 10, 'SO').endDatum).toBe('01.05.2026');
  });
  it('GL: 2.1.2026 zählt im Strafverfahren nicht (Art. 90 Abs. 2 StPO nur kantonales Recht), im OR-Kontext schon', () => {
    const stpo = allg('2025-12-23', 10, 'GL', 'stpo');
    expect(stpo.endDatum).toBe('02.01.2026');
    expect(allg('2025-12-23', 10, 'GL').endDatum).toBe('05.01.2026');
  });
  it('Samstag verschiebt im Strafverfahren (Art. 90 Abs. 2 StPO), Rechenweg nennt die StPO-Norm', () => {
    const r = allgemeineFristErgebnis({ start: '2026-08-21', laenge: 8, einheit: 'tage', ...basis, kanton: 'ZH', kontext: 'stpo' });
    expect(r.resultat.endDatum).toBe('31.08.2026'); // 29.8. Sa → Mo 31.8.
    expect(r.normverweise.map((n) => n.artikel)).toEqual(['Art. 90 StPO']);
    expect(r.resultat.verschiebeGruende[0]).toMatch(/Art\. 90 Abs\. 2 StPO/);
  });
  it('StPO-Frist ist nie Vertragsfrist', () => {
    expect(() => berechneAllgemeineFrist({ start: '2026-08-21', laenge: 10, einheit: 'tage', ...basis, kanton: 'ZH', kontext: 'stpo', fristart: 'vertraglich' }))
      .toThrow(/Vertragsfristen/);
  });
  it('Standard-Kontext unverändert: gleiche Eingabe mit und ohne kontext:"allgemein" byte-gleich', () => {
    const a = berechneAllgemeineFrist({ start: '2025-12-23', laenge: 10, einheit: 'tage', ...basis, kanton: 'GL' });
    const b = berechneAllgemeineFrist({ start: '2025-12-23', laenge: 10, einheit: 'tage', ...basis, kanton: 'GL', kontext: 'allgemein' as never });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
  it('BL-Hinweis (W-10, GOG BL § 46 Abs. 2): StPO und ZPO in BL ja; andere Kantone und OR nein', () => {
    const bl = allg('2026-08-21', 10, 'BL', 'stpo').hinweise.join('\n');
    expect(bl).toMatch(/§ 46 Abs\. 2 GOG BL/);
    expect(bl).toMatch(/Art\. 90 Abs\. 2 StPO/);
    expect(allg('2026-08-21', 10, 'ZH', 'stpo').hinweise.join('\n')).not.toMatch(/GOG BL/);
    expect(allg('2026-08-21', 10, 'BL').hinweise.join('\n')).not.toMatch(/GOG BL/);
    const zpo = berechneFrist({ ereignis: '2026-08-21', einheit: 'tage', laenge: 10, verfahren: 'ordentlich', kanton: 'BL', fristnatur: 'gesetzlich' });
    expect(zpo.warnungen.join('\n')).toMatch(/§ 46 Abs\. 2 GOG BL.*Art\. 142 Abs\. 3 ZPO/);
    const zh = berechneFrist({ ereignis: '2026-08-21', einheit: 'tage', laenge: 10, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich' });
    expect(zh.warnungen.join('\n')).not.toMatch(/GOG BL/);
  });
  it('Erstreckung über den GL-2.1.: Warnung nennt das Ende ohne den unsicheren Tag (W-11 a)', () => {
    // 4.12.2025 + 10 T → So 14.12. → Mo 15.12.; Erstreckung 18 Tage ab 16.12. → Fr 2.1.2026 → GL Mo 5.1.
    const r = berechneFrist({
      ereignis: '2025-12-04', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'GL',
      fristnatur: 'gerichtlich', erstreckung: { einheit: 'tage', laenge: 18 },
    });
    expect(r.erstrecktBis).toBe('05.01.2026');
    const w = r.warnungen.find((x) => x.includes('Kantonaler Sonderfall'));
    expect(w).toBeDefined();
    expect(w).toMatch(/02\.01\.2026/);
    expect(w).toMatch(/bereits am 02\.01\.2026/);
    // Gegenprobe: SG zählt den 2.1. ohne Vorbehalt, keine Warnung.
    const sg = berechneFrist({
      ereignis: '2025-12-04', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'SG',
      fristnatur: 'gerichtlich', erstreckung: { einheit: 'tage', laenge: 18 },
    });
    expect(sg.warnungen.some((x) => x.includes('Kantonaler Sonderfall'))).toBe(false);
  });
});

describe('RV-52 · Ferienzustellung im Schnellrechner offengelegt', () => {
  it('Ereignis in den Osterferien 2026 (29.3.–12.4.): Hinweis mit Periode und BGE 121 III 284', () => {
    const h = schkgFerienzustellungHinweis('2026-04-08');
    expect(h).toMatch(/29\.03\.2026–12\.04\.2026/);
    expect(h).toMatch(/BGE 121 III 284 E\. 2b\/c/);
    expect(h).toMatch(/Auslöser/);
  });
  it('Randtage: erster und letzter Ferientag ja, Tag davor/danach nein; ungültiges Datum nein', () => {
    expect(schkgFerienzustellungHinweis('2026-03-29')).not.toBeNull();
    expect(schkgFerienzustellungHinweis('2026-04-12')).not.toBeNull();
    expect(schkgFerienzustellungHinweis('2026-03-28')).toBeNull();
    expect(schkgFerienzustellungHinweis('2026-04-13')).toBeNull();
    expect(schkgFerienzustellungHinweis('2026-02-30')).toBeNull();
    expect(schkgFerienzustellungHinweis('')).toBeNull();
  });
  it('Jahreswechsel: 1.1.2026 liegt noch in den Weihnachtsferien (bis 1.1.), 2.1. nicht', () => {
    expect(schkgFerienzustellungHinweis('2026-01-01')).not.toBeNull();
    expect(schkgFerienzustellungHinweis('2026-01-02')).toBeNull();
  });
});

describe('RV-53 · Kalender markiert bedingte Feiertage im Kontext der Engine', () => {
  const frei = (kanton: Kanton, von: string, bis: string, kontext?: 'zpo' | 'stpo' | 'allgemein') =>
    (renderToStaticMarkup(
      <FristenKalender ereignisISO={von} adQuemISO={bis} kanton={kanton} stillstandAktiv={false} {...(kontext ? { feiertagsKontext: kontext } : {})} />,
    ).match(/title="arbeitsfrei \(Sa\/So\/Feiertag\)"/g) ?? []).length;

  it('NE: Ostermontag 6.4.2026 nur im ZPO-/StPO-Kontext arbeitsfrei', () => {
    const ohne = frei('NE', '2026-04-01', '2026-04-10');
    expect(frei('NE', '2026-04-01', '2026-04-10', 'allgemein')).toBe(ohne);
    expect(frei('NE', '2026-04-01', '2026-04-10', 'zpo')).toBe(ohne + 1);
    expect(frei('NE', '2026-04-01', '2026-04-10', 'stpo')).toBe(ohne + 1);
  });
  it('SO: 1. Mai 2026 im ZPO-Kontext arbeitsfrei (EG ZPO § 22 Abs. 2)', () => {
    // April+Mai 2026 gezeigt: im ZPO-Kontext zusätzlich Ostermontag 6.4., 1. Mai und Pfingstmontag 25.5.
    // (derselbe Katalog, EG ZPO SO § 22 Abs. 2); im Standard-Kontext keiner davon.
    const ohne = frei('SO', '2026-04-28', '2026-05-05');
    expect(frei('SO', '2026-04-28', '2026-05-05', 'zpo')).toBe(ohne + 3);
  });
  it('ZH: kein bedingter Tag, Kontext ändert nichts (Randfall)', () => {
    expect(frei('ZH', '2026-04-01', '2026-04-10', 'zpo')).toBe(frei('ZH', '2026-04-01', '2026-04-10'));
  });
  it('Kontext-Zuordnung je Regime des Schnellrechners (lib)', () => {
    expect(feiertagsKontextFuer('keine')).toBe('allgemein');
    for (const r of ['stpo', 'zpo', 'schkg', 'vwvg', 'bgg'] as const) expect(feiertagsKontextFuer(r)).toBe(r);
  });
});
