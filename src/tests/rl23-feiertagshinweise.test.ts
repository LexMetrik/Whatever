// ─── RL-23: Feiertags-Hinweise (Glarus 2. Januar, kommunale Ruhetage) ──────
//
// W2·30-RL-W2A, Befunde Q5 (GL 2.1.), Q8-04 (kommunale Ruhetage), Bündel A-B8b.
// Entscheid W-11 (a) (David 24.9.2026 «nach Empfehlung»): den 2. Januar in GL
// weiter als Feiertag zählen, aber in jeder Frist-Engine warnen.
//
// Rechtslage (amtlich selbst geöffnet 25.9.2026):
//  - Ruhetagsgesetz GL (GS IX B/21/1, Version 1.7.2019) Art. 2 Abs. 1 lit. b/c:
//    allgemeine und hohe Feiertage — der 2. Januar fehlt.
//  - Personalverordnung GL (GS II A/6/2, Fassung 1.7.2026) Art. 19 Abs. 2 lit. a:
//    Berchtoldstag nur «bezahlter arbeitsfreier Tag» (mit Heiligabend, Silvester),
//    nicht Feiertag nach Abs. 1.
//  - BJ-Verzeichnis (Stand 1.1.2011) Ziff. 8 lit. b: «Tage, die wie gesetzliche
//    Feiertage behandelt werden – Berchtoldstag, 2. Januar»; Notifikation nach
//    Art. 11 EuFrÜb (SR 0.221.122.3). Das Übereinkommen gilt nach Art. 1 Abs. 1
//    nur im «Zivil-, Handels- und Verwaltungsrecht einschliesslich des diese
//    Gebiete betreffenden Verfahrensrechts» — NICHT im Strafverfahren.
//  - SG (sGS 143.11 Art. 59 Abs. 1 «Ruhetag», KG SG FS.2012.1) und SH (SHR
//    180.111 § 33 Abs. 1 «Feiertag», OGE 40/2018/1/K) tragen den 2.1. im
//    kantonalen Normwortlaut samt Gerichtspraxis → keine Warnung.
// Soll-Fälle aus dem Kalender nachgerechnet (1.1.2026 = Donnerstag).

import { describe, expect, it } from 'vitest';
import { istFeiertag } from '../data/zpoFeiertage';
import { berechneFrist } from '../lib/zpoFristen';
import { berechneSchkgFrist } from '../lib/schkgFristen';
import { berechneBggVwvgFrist } from '../lib/bggVwvgFristen';
import { berechneAllgemeineFrist, STPO_FRIST_HINWEIS } from '../lib/allgemeineFrist';
import { berechneMietkuendigung } from '../lib/mietrecht';
import { berechneVerjaehrung, werktagsEnde } from '../lib/verjaehrung';
import type { Kanton } from '../types/legal';

const d = (j: number, m: number, t: number) => new Date(j, m - 1, t);
const iso = (x: Date) => `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
/** GL-Warnung erkannt an Kanton + Grundlage + dem sicheren (früheren) Datum. */
const glWarnung = (ws: string[], sicher: string) =>
  ws.some((w) => w.includes('Glarus') && w.includes('Ruhetagsgesetz') && w.includes(sicher));
const irgendeineGlWarnung = (ws: string[]) => ws.some((w) => w.includes('Glarus'));

describe('istFeiertag GL 2.1.: zählt nach W-11 (a), ausser im Strafverfahren (EuFrÜb Art. 1 Abs. 1)', () => {
  it('zpo/schkg/bgg/vwvg/allgemein: 2.1.2026 ist Feiertag in GL', () => {
    for (const k of ['zpo', 'schkg', 'bgg', 'vwvg', 'allgemein'] as const) expect(istFeiertag(d(2026, 1, 2), 'GL', k), k).toBe(true);
    expect(istFeiertag(d(2026, 1, 2), 'GL')).toBe(true);
  });
  it('stpo: 2.1.2026 in GL NICHT Feiertag (Art. 90 Abs. 2 StPO: nur kantonales Recht; GL-Recht nennt ihn nicht)', () => {
    expect(istFeiertag(d(2026, 1, 2), 'GL', 'stpo')).toBe(false);
  });
  it('SG/SH: 2.1.2026 in jedem Kontext Feiertag (kantonaler Normwortlaut)', () => {
    for (const k of ['zpo', 'stpo', 'schkg', 'bgg', 'vwvg', 'allgemein'] as const) {
      expect(istFeiertag(d(2026, 1, 2), 'SG', k), `SG ${k}`).toBe(true);
      expect(istFeiertag(d(2026, 1, 2), 'SH', k), `SH ${k}`).toBe(true);
    }
  });
});

describe('ZPO (Art. 142 Abs. 3 ZPO): GL summarisch 23.12.2025 + 10 T → Fr 2.1. → Mo 5.1.2026 + Warnung', () => {
  const f = (kanton: Kanton) => berechneFrist({ ereignis: '2025-12-23', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton, fristnatur: 'gesetzlich' });
  it('GL: 05.01.2026 mit Warnung «sicherheitshalber bis 02.01.2026»', () => {
    const r = f('GL');
    expect(r.diesAdQuem).toBe('05.01.2026');
    expect(glWarnung(r.warnungen, '02.01.2026')).toBe(true);
  });
  it('SG und SH: 05.01.2026 ohne GL-Warnung', () => {
    for (const k of ['SG', 'SH'] as const) {
      const r = f(k);
      expect(r.diesAdQuem, k).toBe('05.01.2026');
      expect(irgendeineGlWarnung(r.warnungen), k).toBe(false);
    }
  });
  it('Art. 142 Abs. 1bis: gewöhnliche Post am 2.1.2026 in GL → zugestellt 5.1. → 15.01.2026; streng 12.01.2026', () => {
    const r = berechneFrist({ ereignis: '2026-01-02', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'GL', fristnatur: 'gesetzlich', zustellart: 'gewoehnliche_post' });
    expect(r.diesAdQuem).toBe('15.01.2026');
    expect(glWarnung(r.warnungen, '12.01.2026')).toBe(true);
  });
  it('Frist berührt den 2.1. nicht: keine GL-Warnung (GL 5.1.2026 + 10 T → 15.01.2026)', () => {
    const r = berechneFrist({ ereignis: '2026-01-05', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'GL', fristnatur: 'gesetzlich' });
    expect(r.diesAdQuem).toBe('15.01.2026');
    expect(irgendeineGlWarnung(r.warnungen)).toBe(false);
  });
});

describe('SchKG (Art. 31 SchKG i.V.m. Art. 142 Abs. 3 ZPO; Art. 63 SchKG)', () => {
  it('GL 23.12.2025 + 10 T → Fr 2.1.2026 (Betreibungsferien enden 1.1.) → 05.01.2026 + Warnung', () => {
    const r = berechneSchkgFrist({ ereignis: '2025-12-23', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'GL' });
    expect(r.diesAdQuem).toBe('05.01.2026');
    expect(glWarnung(r.warnungen, '02.01.2026')).toBe(true);
  });
  it('Art. 63 GL: 15.12.2025 + 10 T → 25.12. in Ferien → 3. Werktag nach 1.1.: 5./6./7.1. → 07.01.2026; streng 06.01.2026', () => {
    const r = berechneSchkgFrist({ ereignis: '2025-12-15', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'GL' });
    expect(r.diesAdQuem).toBe('07.01.2026');
    expect(glWarnung(r.warnungen, '06.01.2026')).toBe(true);
  });
  it('Art. 63 SG: gleicher Fall 07.01.2026 ohne GL-Warnung', () => {
    const r = berechneSchkgFrist({ ereignis: '2025-12-15', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'SG' });
    expect(r.diesAdQuem).toBe('07.01.2026');
    expect(irgendeineGlWarnung(r.warnungen)).toBe(false);
  });
});

describe('BGG Art. 45 / VwVG Art. 20 Abs. 3 (Monatsfrist, kein Stillstand): 2.12.2025 + 1 Mt → 2.1.2026', () => {
  for (const regime of ['bgg', 'vwvg'] as const) {
    it(`${regime} GL: 05.01.2026 + Warnung; SH ohne`, () => {
      const gl = berechneBggVwvgFrist({ regime, ereignis: '2025-12-02', einheit: 'monate', laenge: 1, kanton: 'GL' });
      expect(gl.diesAdQuem).toBe('05.01.2026');
      expect(glWarnung(gl.warnungen, '02.01.2026')).toBe(true);
      const sh = berechneBggVwvgFrist({ regime, ereignis: '2025-12-02', einheit: 'monate', laenge: 1, kanton: 'SH' });
      expect(sh.diesAdQuem).toBe('05.01.2026');
      expect(irgendeineGlWarnung(sh.warnungen)).toBe(false);
    });
  }
});

describe('OR Art. 78 (allgemeiner Rechner, Mietrecht, Verjährung)', () => {
  it('allgemeiner Rechner GL: 23.12.2025 + 10 T → 05.01.2026 + Hinweis; SG ohne', () => {
    const gl = berechneAllgemeineFrist({ start: '2025-12-23', laenge: 10, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'GL' });
    expect(gl.endDatum).toBe('05.01.2026');
    expect(glWarnung(gl.hinweise, '02.01.2026')).toBe(true);
    const sg = berechneAllgemeineFrist({ start: '2025-12-23', laenge: 10, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'SG' });
    expect(sg.endDatum).toBe('05.01.2026');
    expect(irgendeineGlWarnung(sg.hinweise)).toBe(false);
  });
  it('Mietrecht GL: Zahlungsfrist (Art. 257d OR) 3.12.2025 + 30 T → 2.1.2026 → 05.01.2026 + Warnung', () => {
    const r = berechneMietkuendigung({
      kuendigungsart: 'zahlungsverzug', objekt: 'wohnung', partei: 'vermieter', amtlichesFormular: true,
      zahlungsaufforderungZugang: '2025-12-03', zugang: '2026-02-05', kanton: 'GL',
    });
    expect(r.zahlungsfristEnde).toBe('05.01.2026');
    expect(glWarnung(r.warnungen, '02.01.2026')).toBe(true);
  });
  it('Verjährung: werktagsEnde(2.1.2026, GL) = 05.01.2026 (W-11 a: zählt)', () => {
    expect(iso(werktagsEnde(d(2026, 1, 2), 'GL'))).toBe('05.01.2026');
  });
  it('Verjährung GL (Art. 127 OR, 10 J. ab 2.1.2016) → Ende auf 2.1.2026 → Warnung', () => {
    const r = berechneVerjaehrung({ regime: 'ordentlich', beginnRelativ: '2016-01-02', stichtag: '2026-06-05', kanton: 'GL' });
    expect(glWarnung(r.warnungen, '02.01.2026')).toBe(true);
  });
});

describe('Q8-04: kommunale Ruhetage am Wohnsitz (BGer 6B_730/2013 E. 1.2) offenlegen', () => {
  it('StPO-Hinweis nennt kommunale Ruhetage und die sichere Richtung', () => {
    expect(STPO_FRIST_HINWEIS).toMatch(/kommunale/);
    expect(STPO_FRIST_HINWEIS).toMatch(/6B_730\/2013/);
  });
});
