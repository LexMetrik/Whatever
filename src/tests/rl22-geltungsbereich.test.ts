// ─── RL-22 Nachzug: Geltungsbereich bedingter kantonaler Feiertage ─────────
//
// W2·30-RL-W2A. Die RL-22-Erstbauten zählten zwei kantonale Sonderregeln in
// JEDER Frist-Engine als Feiertag, obwohl ihre Rechtsgrundlage verfahrens-
// gebunden ist:
//  - NE-Schliesstage der Kantonsverwaltung (Règlement des fonctionnaires RDF
//    Art. 11 Abs. 1, RSN 152.512, Etat 1.1.2023). Gleichgestellt mit einem
//    Feiertag durch LI-CPC Art. 10a (RSN 251.1, Randtitel «Jours fériés
//    (art. 142 CPC)»), LI-CPP Art. 9a (RSN 322.0, «Jours fériés (art. 90 CPP)»),
//    LPA Art. 33 Abs. 3 (RSN 152.130); für Art. 45 BGG anerkannt in BGer
//    9C_396/2018 E. 2.3, für Art. 20 Abs. 3 VwVG in BVGer D-837/2025
//    (E-2540/2019). Für SchKG (Art. 31 SchKG) und OR Art. 78 kein Beleg.
//  - SO 1. Mai: ganztags nur «für die Fristbestimmung gemäss Artikel 142 ZPO»
//    (EG ZPO SO § 22 Abs. 2, BGS 221.2); allgemein nur «1. Mai ab 12.00 Uhr»
//    (Ruhetagsgesetz SO § 2 Abs. 1 lit. b, BGS 512.41).
// Soll: zählen nur, wo belegt; sonst NICHT zählen (früheres, sicheres
// Fristende) und warnen. Soll-Fälle aus dem Normtext nachgerechnet, nicht aus
// zpoFeiertage.ts (R1-06). Amtliche Schliesstagsliste 2027 (ne.ch «Jours fériés
// officiels», abgerufen 25.9.2026) als Gegenprobe der RDF-Regel.

import { describe, expect, it } from 'vitest';
import { istFeiertag } from '../data/zpoFeiertage';
import { berechneFrist } from '../lib/zpoFristen';
import { berechneSchkgFrist } from '../lib/schkgFristen';
import { berechneBggVwvgFrist } from '../lib/bggVwvgFristen';
import { berechneBgerRechtsweg } from '../lib/bgerRechtsweg';
import { berechneAllgemeineFrist, berechneRueckwaertsFrist } from '../lib/allgemeineFrist';
import { berechneMietkuendigung } from '../lib/mietrecht';
import { berechneVerjaehrung, werktagsEnde } from '../lib/verjaehrung';
import type { Kanton } from '../types/legal';

// Kontext-Parameter ist neu (3. Argument); vor dem Fix ignoriert → Rot-Beweis.
const feiertagIm = istFeiertag as unknown as (d: Date, k: Kanton, kontext?: string) => boolean;
const d = (j: number, m: number, t: number) => new Date(j, m - 1, t);
const iso = (x: Date) => `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;

describe('istFeiertag: Kontext entscheidet über bedingte kantonale Tage', () => {
  it('NE Fr 15.5.2026 (Freitag nach Auffahrt, RDF Art. 11): zpo/stpo/bgg/vwvg ja', () => {
    for (const k of ['zpo', 'stpo', 'bgg', 'vwvg']) expect(feiertagIm(d(2026, 5, 15), 'NE', k), k).toBe(true);
  });
  it('NE Fr 15.5.2026: schkg und allgemein (OR Art. 78, Voreinstellung) nein', () => {
    expect(feiertagIm(d(2026, 5, 15), 'NE', 'schkg')).toBe(false);
    expect(feiertagIm(d(2026, 5, 15), 'NE', 'allgemein')).toBe(false);
    expect(istFeiertag(d(2026, 5, 15), 'NE')).toBe(false);
  });
  it('SO 1.5.2026: nur zpo ja (EG ZPO SO § 22 Abs. 2); bgg/stpo/schkg/allgemein nein', () => {
    expect(feiertagIm(d(2026, 5, 1), 'SO', 'zpo')).toBe(true);
    for (const k of ['bgg', 'vwvg', 'stpo', 'schkg', 'allgemein']) expect(feiertagIm(d(2026, 5, 1), 'SO', k), k).toBe(false);
    expect(istFeiertag(d(2026, 5, 1), 'SO')).toBe(false);
  });
  it('Grund-Feiertage bleiben kontextunabhängig (NE 1.3., SO Auffahrt, UR 26.12.2028)', () => {
    for (const k of ['zpo', 'stpo', 'bgg', 'vwvg', 'schkg', 'allgemein']) {
      expect(feiertagIm(d(2027, 3, 1), 'NE', k), k).toBe(true);
      expect(feiertagIm(d(2026, 5, 14), 'SO', k), k).toBe(true);
      expect(feiertagIm(d(2028, 12, 26), 'UR', k), k).toBe(true);
    }
  });
});

describe('NE: stehende Regel RDF Art. 11 Abs. 1 statt Jahrestabelle — Gegenprobe ne.ch 2027', () => {
  // ne.ch «Jours fériés dans l'administration cantonale neuchâteloise», Spalte 2027
  // (abgerufen 25.9.2026): zusätzlich zu den gesetzlichen Feiertagen (RSN 941.02).
  const liste2027: Array<[number, number]> = [[1, 2], [3, 29], [5, 7], [5, 17], [9, 20], [12, 24], [12, 26], [12, 31]];
  it('alle Schliesstage 2027 zählen im ZPO-Kontext', () => {
    for (const [m, t] of liste2027) expect(feiertagIm(d(2027, m, t), 'NE', 'zpo'), `${t}.${m}.2027`).toBe(true);
  });
  it('ZPO summarisch 27.4.2027 + 10 T → Fr 7.5.2027 (Vendredi de l\'Ascension) → Mo 10.5.2027', () => {
    const r = berechneFrist({ ereignis: '2027-04-27', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'NE', fristnatur: 'gesetzlich' });
    expect(r.diesAdQuem).toBe('10.05.2027');
  });
  it('vor Inkrafttreten LI-CPC Art. 10a (1.4.2015) kein Schliesstag: 24.12.2014 zählt nicht', () => {
    expect(feiertagIm(d(2014, 12, 24), 'NE', 'zpo')).toBe(false);
  });
});

describe('SchKG (Art. 31 SchKG i.V.m. Art. 142 Abs. 3 ZPO): Gleichstellung nicht belegt → nicht zählen, warnen', () => {
  it('NE: Ereignis 5.5.2026 + 10 T → Fr 15.5.2026 bleibt Fristende + Warnung Schliesstag', () => {
    const r = berechneSchkgFrist({ ereignis: '2026-05-05', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'NE' });
    expect(r.diesAdQuem).toBe('15.05.2026');
    expect(r.warnungen.some((w) => w.includes('Schliesstag') && w.includes('18.05.2026'))).toBe(true);
  });
  it('SO: Ereignis 21.4.2026 + 10 T → Fr 1.5.2026 bleibt Fristende + Warnung 1. Mai', () => {
    const r = berechneSchkgFrist({ ereignis: '2026-04-21', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'SO' });
    expect(r.diesAdQuem).toBe('01.05.2026');
    expect(r.warnungen.some((w) => w.includes('1. Mai') && w.includes('04.05.2026'))).toBe(true);
  });
  it('Wartefrist (Art. 88 SchKG) NE: frühestes Datum auf der sicheren (späteren) Seite + Warnung', () => {
    // 4.5.2026 + 10 T = Do 14.5. (Auffahrt, Grund-Feiertag); Wartefrist wird nicht
    // verschoben → Folgetag Fr 15.5. Schliesstag → sicher: Mo 18.5.2026.
    const r = berechneSchkgFrist({ ereignis: '2026-05-04', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'wartefrist', kanton: 'NE' });
    expect(r.diesAdQuem).toBe('18.05.2026');
    expect(r.warnungen.some((w) => w.includes('Schliesstag') && w.includes('15.05.2026'))).toBe(true);
  });
});

describe('BGG Art. 45 / VwVG Art. 20 Abs. 3: NE-Schliesstage zählen (9C_396/2018, D-837/2025), SO 1. Mai nicht', () => {
  it('BGG NE: 5.5.2026 + 10 T → Fr 15.5. → Mo 18.5.2026 (Kontrolle, belegt)', () => {
    const r = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-05-05', einheit: 'tage', laenge: 10, kanton: 'NE' });
    expect(r.diesAdQuem).toBe('18.05.2026');
  });
  it('VwVG NE: 24.11.2026 + 1 Monat → Do 24.12. geschlossen, 25.12., 26./27. → Mo 28.12.2026 (Kontrolle, belegt)', () => {
    const r = berechneBggVwvgFrist({ regime: 'vwvg', ereignis: '2026-11-24', einheit: 'monate', laenge: 1, kanton: 'NE' });
    expect(r.diesAdQuem).toBe('28.12.2026');
  });
  it('BGG SO: 21.4.2026 + 10 T → Fr 1.5.2026 bleibt + Warnung (EG ZPO SO § 22 Abs. 2 gilt nur für Art. 142 ZPO)', () => {
    const r = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-04-21', einheit: 'tage', laenge: 10, kanton: 'SO' });
    expect(r.diesAdQuem).toBe('01.05.2026');
    expect(r.warnungen.some((w) => w.includes('1. Mai') && w.includes('04.05.2026'))).toBe(true);
  });
  it('BGer-Rechtsweg SO: Eröffnung 17.3.2026, 30 T mit Stillstand → Fr 1.5.2026 bleibt + Warnung', () => {
    const r = berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'schuldrecht', vermoegensrechtlich: true, streitwertCHF: 50_000, eroeffnung: '2026-03-17', kanton: 'SO' });
    expect(r.fristende?.endeText).toBe('01.05.2026');
    expect(r.warnungen.some((w) => w.includes('1. Mai') && w.includes('04.05.2026'))).toBe(true);
  });
  it('BGer-Rechtsweg NE: Eröffnung 17.3.2026 → 30. Tag Fr 1.5. Feiertag NE → Mo 4.5.2026 (Kontrolle)', () => {
    const r = berechneBgerRechtsweg({ weg: 'zivil', zivilGebiet: 'schuldrecht', vermoegensrechtlich: true, streitwertCHF: 50_000, eroeffnung: '2026-03-17', kanton: 'NE' });
    expect(r.fristende?.endeText).toBe('04.05.2026');
  });
});

describe('OR Art. 78 (allgemeiner Rechner, Mietrecht, Verjährung): nicht zählen, warnen', () => {
  it('allgemeiner Rechner NE: 5.5.2026 + 10 T → Fr 15.5.2026 + Hinweis', () => {
    const r = berechneAllgemeineFrist({ start: '2026-05-05', laenge: 10, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'NE' });
    expect(r.endDatum).toBe('15.05.2026');
    expect(r.hinweise.some((h) => h.includes('Schliesstag') && h.includes('18.05.2026'))).toBe(true);
  });
  it('allgemeiner Rechner SO: 21.4.2026 + 10 T → Fr 1.5.2026 + Hinweis', () => {
    const r = berechneAllgemeineFrist({ start: '2026-04-21', laenge: 10, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'SO' });
    expect(r.endDatum).toBe('01.05.2026');
    expect(r.hinweise.some((h) => h.includes('1. Mai'))).toBe(true);
  });
  it('Rückwärtsfrist «vorverlegen» NE: sichere Seite = bedingte Tage zählen (Stichtag 26.5.2026 − 10 T → 15.5. → 13.5.2026)', () => {
    const r = berechneRueckwaertsFrist({ stichtag: '2026-05-26', laenge: 10, einheit: 'tage', verschiebung: 'vorverlegen', feiertageBeruecksichtigen: true, kanton: 'NE' });
    expect(r.endDatum).toBe('13.05.2026');
  });
  it('Mietrecht NE: Zahlungsfrist 24.11.2026 + 30 T → Do 24.12.2026 bleibt + Warnung', () => {
    const r = berechneMietkuendigung({
      kuendigungsart: 'zahlungsverzug', objekt: 'wohnung', partei: 'vermieter', amtlichesFormular: true,
      zahlungsaufforderungZugang: '2026-11-24', zugang: '2027-01-05', kanton: 'NE',
    });
    expect(r.zahlungsfristEnde).toBe('24.12.2026');
    expect(r.warnungen.some((w) => w.includes('Schliesstag') && w.includes('24.12.2026'))).toBe(true);
  });
  it('Verjährung: werktagsEnde(24.12.2026, NE) = 24.12.2026 (kein OR-Feiertag)', () => {
    expect(iso(werktagsEnde(d(2026, 12, 24), 'NE'))).toBe('24.12.2026');
  });
  it('Verjährung NE: Ende auf Schliesstag → Warnung', () => {
    const r = berechneVerjaehrung({ regime: 'ordentlich', beginnRelativ: '2016-12-24', stichtag: '2026-06-05', kanton: 'NE' });
    expect(r.warnungen.some((w) => w.includes('Schliesstag'))).toBe(true);
  });
});

describe('ZPO bleibt: bedingte Tage zählen (Kontrolle)', () => {
  it('ZPO NE 5.5.2026 + 10 T → Mo 18.5.2026; ZPO SO 21.4.2026 + 10 T → Mo 4.5.2026', () => {
    const f = (ereignis: string, kanton: Kanton) => berechneFrist({ ereignis, einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton, fristnatur: 'gesetzlich' });
    expect(f('2026-05-05', 'NE').diesAdQuem).toBe('18.05.2026');
    expect(f('2026-04-21', 'SO').diesAdQuem).toBe('04.05.2026');
  });
});
