// ─── RL-22c: Solothurn — Feiertage je Verfahrensrecht ───────────────────────
//
// W2·30-RL-W2A, Nachzug zu RL-22/RL-23 (Nebenfund RL-23-Bau 25.9.2026).
// Befund: SO zählte 2. Januar, Ostermontag, Pfingstmontag und 26. Dezember in
// JEDEM Kontext als Feiertag. Amtlich selbst geöffnet am 25.9.2026 (API
// bgs.so.ch, jeweils die in Kraft stehende Fassung):
//  - Ruhetagsgesetz SO § 2 Abs. 1 (BGS 512.41, in Kraft seit 1.9.2014): nennt
//    als Feiertage Neujahr, Auffahrt, «1. Mai ab 12.00 Uhr», Bettag und — «mit
//    Ausnahme Bezirk Bucheggberg» — Fronleichnam, Mariä Himmelfahrt,
//    Allerheiligen; hohe Feiertage Karfreitag, Ostern, Pfingsten, Weihnachten.
//    KEIN 2.1., Ostermontag, Pfingstmontag, 26.12.
//  - Gleichstellung «für die Fristbestimmung» (je seit 1.3.2015, Beschluss
//    12.11.2014), Katalog «Neujahr, der 2. Januar, Karfreitag, der Ostermontag,
//    Auffahrt, der Pfingstmontag, der 1. Mai, Fronleichnam, Mariä Himmelfahrt,
//    Allerheiligen, der 25. und der 26. Dezember», kantonsweit:
//      · EG ZPO SO § 22 Abs. 2 (BGS 221.2) — «gemäss Artikel 142 ZPO»
//      · EG StPO SO § 10bis (BGS 321.3) — «gemäss Artikel 90 Absatz 2 StPO»
//      · VRG SO § 9 Abs. 1 (BGS 124.11) — kantonales Verwaltungsverfahren
//  - BGer 6B_730/2013 vom 10.12.2013 E. 1.2 (Pfingstmontag 20.5.2013, StPO, SO):
//    damals «enthält keine Fristbestimmungen» (EG StPO) → nicht anerkannt.
// Soll (Richtungsregel RL-22): zählen, wo belegt (zpo, stpo); sonst NICHT
// zählen (früheres, sicheres Fristende) und warnen. Wartefrist: die spätere
// Seite ist sicher (weitest). Bucheggberg-Vorbehalt: ausserhalb ZPO/StPO zählt
// der Tag (Ruhetagsgesetz), aber mit Warnung. Soll-Fälle aus dem Normtext und
// dem Kalender nachgerechnet (Ostern 5.4.2026, Pfingstmontag 25.5.2026,
// Fronleichnam 4.6.2026, 26.12.2028 = Dienstag, 2.1.2026 = Freitag).

import { describe, expect, it } from 'vitest';
import { istFeiertag } from '../data/zpoFeiertage';
import { berechneFrist } from '../lib/zpoFristen';
import { berechneSchkgFrist } from '../lib/schkgFristen';
import { berechneBggVwvgFrist } from '../lib/bggVwvgFristen';
import { berechneAllgemeineFrist } from '../lib/allgemeineFrist';
import { werktagsEnde } from '../lib/verjaehrung';
import type { FeiertagsKontext } from '../data/zpoFeiertage';

const d = (j: number, m: number, t: number) => new Date(j, m - 1, t);
const iso = (x: Date) => `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
const NICHT_BELEGT: FeiertagsKontext[] = ['bgg', 'vwvg', 'schkg', 'allgemein'];

describe('istFeiertag SO: 2.1., Ostermontag, Pfingstmontag, 26.12. nur ZPO/StPO', () => {
  const tage: Array<[string, Date]> = [
    ['2.1.2026', d(2026, 1, 2)], ['Ostermontag 6.4.2026', d(2026, 4, 6)],
    ['Pfingstmontag 25.5.2026', d(2026, 5, 25)], ['26.12.2028', d(2028, 12, 26)],
  ];
  for (const [name, tag] of tage) {
    it(`${name}: zpo (EG ZPO § 22 Abs. 2) und stpo (EG StPO § 10bis) ja`, () => {
      expect(istFeiertag(tag, 'SO', 'zpo')).toBe(true);
      expect(istFeiertag(tag, 'SO', 'stpo')).toBe(true);
      expect(istFeiertag(tag, 'SO', 'weitest')).toBe(true);
    });
    it(`${name}: bgg/vwvg/schkg/allgemein nein (Ruhetagsgesetz SO § 2 nennt ihn nicht)`, () => {
      for (const k of NICHT_BELEGT) expect(istFeiertag(tag, 'SO', k), k).toBe(false);
      expect(istFeiertag(tag, 'SO')).toBe(false);
    });
  }
  it('1.5.2026: stpo ja (EG StPO § 10bis nennt «den 1. Mai» ganztags)', () => {
    expect(istFeiertag(d(2026, 5, 1), 'SO', 'stpo')).toBe(true);
  });
  it('BGer 6B_730/2013 E. 1.2: Pfingstmontag 20.5.2013 im StPO-Kontext kein Feiertag (vor § 10bis)', () => {
    expect(istFeiertag(d(2013, 5, 20), 'SO', 'stpo')).toBe(false);
  });
  it('Grund-Feiertage SO bleiben kontextunabhängig (Karfreitag 3.4.2026, 25.12.2026, Auffahrt 14.5.2026)', () => {
    for (const k of [...NICHT_BELEGT, 'zpo', 'stpo'] as FeiertagsKontext[]) {
      expect(istFeiertag(d(2026, 4, 3), 'SO', k), k).toBe(true);
      expect(istFeiertag(d(2026, 12, 25), 'SO', k), k).toBe(true);
      expect(istFeiertag(d(2026, 5, 14), 'SO', k), k).toBe(true);
    }
  });
  it('Fronleichnam 4.6.2026 zählt in allen Kontexten (Ruhetagsgesetz SO § 2 Abs. 1 lit. b)', () => {
    for (const k of [...NICHT_BELEGT, 'zpo', 'stpo'] as FeiertagsKontext[]) expect(istFeiertag(d(2026, 6, 4), 'SO', k), k).toBe(true);
  });
});

describe('Engines SO: Handlungsfristen früheres Ende + Warnung, ZPO unverändert', () => {
  it('ZPO SO: 15.5.2026 + 10 T → Pfingstmontag 25.5. → Di 26.5.2026 (Kontrolle)', () => {
    const r = berechneFrist({ ereignis: '2026-05-15', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'SO', fristnatur: 'gesetzlich' });
    expect(r.diesAdQuem).toBe('26.05.2026');
  });
  it('BGG SO: 15.5.2026 + 10 T → Mo 25.5.2026 bleibt + Warnung mit 26.05.2026', () => {
    const r = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-05-15', einheit: 'tage', laenge: 10, kanton: 'SO' });
    expect(r.diesAdQuem).toBe('25.05.2026');
    expect(r.warnungen.some((w) => w.includes('25.05.2026') && w.includes('26.05.2026') && w.includes('§ 10bis'))).toBe(true);
  });
  it('VwVG SO: 15.5.2026 + 10 T → Mo 25.5.2026 bleibt + Warnung (2.1./26.12. liegen im Stillstand Art. 22a VwVG)', () => {
    const r = berechneBggVwvgFrist({ regime: 'vwvg', ereignis: '2026-05-15', einheit: 'tage', laenge: 10, kanton: 'SO' });
    expect(r.diesAdQuem).toBe('25.05.2026');
    expect(r.warnungen.some((w) => w.includes('25.05.2026') && w.includes('26.05.2026'))).toBe(true);
  });
  it('SchKG SO Handlungsfrist: 15.5.2026 + 10 T → Mo 25.5.2026 bleibt + Warnung', () => {
    const r = berechneSchkgFrist({ ereignis: '2026-05-15', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', kanton: 'SO' });
    expect(r.diesAdQuem).toBe('25.05.2026');
    expect(r.warnungen.some((w) => w.includes('25.05.2026') && w.includes('26.05.2026'))).toBe(true);
  });
  it('SchKG SO Wartefrist: 14.5.2026 + 10 T = So 24.5. → Folgetag Pfingstmontag → sicher Di 26.5.2026 + Warnung', () => {
    const r = berechneSchkgFrist({ ereignis: '2026-05-14', einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'wartefrist', kanton: 'SO' });
    expect(r.diesAdQuem).toBe('26.05.2026');
    expect(r.warnungen.some((w) => w.includes('25.05.2026'))).toBe(true);
  });
  it('Allgemein (OR Art. 78 / StPO-Nutzung) SO: 16.12.2028 + 10 T → Di 26.12.2028 bleibt + Hinweis', () => {
    const r = berechneAllgemeineFrist({ start: '2028-12-16', laenge: 10, einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'SO' });
    expect(r.endDatum).toBe('26.12.2028');
    expect(r.hinweise.some((h) => h.includes('26.12.2028') && h.includes('27.12.2028'))).toBe(true);
  });
  it('Verjährung (OR Art. 78): werktagsEnde(Ostermontag 6.4.2026, SO) = 06.04.2026', () => {
    expect(iso(werktagsEnde(d(2026, 4, 6), 'SO'))).toBe('06.04.2026');
  });
});

describe('Bucheggberg-Vorbehalt (Ruhetagsgesetz SO § 2 Abs. 1 lit. b): zählt, aber Warnung ausserhalb ZPO/StPO', () => {
  it('BGG SO: 25.5.2026 + 10 T → Fronleichnam 4.6. → Fr 5.6.2026 + Warnung Bucheggberg', () => {
    const r = berechneBggVwvgFrist({ regime: 'bgg', ereignis: '2026-05-25', einheit: 'tage', laenge: 10, kanton: 'SO' });
    expect(r.diesAdQuem).toBe('05.06.2026');
    expect(r.warnungen.some((w) => w.includes('Bucheggberg') && w.includes('04.06.2026'))).toBe(true);
  });
  it('ZPO SO: gleicher Fall → 5.6.2026 ohne Bucheggberg-Warnung (EG ZPO § 22 Abs. 2 kantonsweit)', () => {
    const r = berechneFrist({ ereignis: '2026-05-25', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'SO', fristnatur: 'gesetzlich' });
    expect(r.diesAdQuem).toBe('05.06.2026');
    expect(r.warnungen.some((w) => w.includes('Bucheggberg'))).toBe(false);
  });
});
