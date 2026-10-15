// ─── RL-28 Teil 1: Grundpfand-Posten Deutschschweiz = Beurkundung + Eintrag ──
// Prüfwerte sind aus den amtlichen Erlassen von Hand gerechnet (Stand 15.10.2026,
// Quellen in src/data/tarif/grundpfand.ts), nicht aus dem Code abgeleitet (RV-19).
import { describe, expect, it } from 'vitest';
import { berechneNotariatGrundbuch, ngPostenText, type NgPosten } from '../lib/notariatGrundbuch';
import { berechneBeurkundung } from '../lib/beurkundung';
import type { KantonCode } from '../data/tarif/typen';

const pfand = (kanton: KantonCode, summe: number): NgPosten => {
  const p = berechneNotariatGrundbuch({ kanton, kaufpreisCHF: summe, mitGrundpfand: true, pfandsummeCHF: summe }).grundpfand;
  if (!p) throw new Error('kein Grundpfand-Posten');
  return p;
};
const betrag = (kanton: KantonCode, summe: number): number => {
  const e = pfand(kanton, summe).ergebnis;
  if (!e.deterministisch) throw new Error(`${kanton}: kein deterministischer Betrag`);
  return e.betragChf;
};

describe('RL-28 Grundpfand-Posten Deutschschweiz — Beurkundung + Grundbucheintrag (RV-19)', () => {
  const faelle: Array<[KantonCode, number, number, string]> = [
    // AG: NotT SAR 295.250 § 3 Abs. 1 (⅔ von § 2, max 7'500) + GBAG SAR 725.100 § 23 Abs. 1 lit. a (1,5‰, min 100), § 4 (Summe auf 1'000 gerundet)
    ['AG', 1_000_000, 3633.33, 'N 2133.33 + G 1500'],
    ['AG', 3_000_000, 9300, 'N 4800 + G 4500'],
    ['AG', 100_000, 450, 'Randfall Minimum N (Annahme 300) + G 150'],
    ['AG', 20_000_000, 37500, 'Randfall Deckel N 7500 + G 30000'],
    ['AG', 1_234_400, 4296.87, 'Randfall Rundung GB: 1’234’400 → 1’234’000'],
    ['AG', 1_234_500, 4298.5, 'Gleichstand x’500 → Annahme aufrunden auf 1’235’000'],
    // BS: Notariatstarif SG 292.400 Ziff. 28 lit. a (wie Ziff. 17) + V EG ZGB SG 211.110 § 51 Abs. 1 lit. a/b, Abs. 6 lit. a
    ['BS', 100_000, 700, 'N Minimum 500 + G Minimum 200'],
    ['BS', 10_000_000, 26000, 'N 16000 + G 10000'],
    ['BS', 300_500, 1052.25, 'Randfall Aufrundung GB: 300’500 → 301’000'],
    // LU: BeurkGebV SRL 258 § 29 Abs. 1 + GBGT SRL 228 § 8 Abs. 1 Ziff. 1
    ['LU', 100_000, 500, 'N Minimum 300 + G 200'],
    ['LU', 1_000_000, 3625, 'N 1625 + G 2000'],
    ['LU', 20_000_000, 47125, 'Randfall Höchstbetrag N 7125 (über 10 Mio gebührenfrei) + G 40000'],
    // OW: GDB 210.32 Art. 10 Ziff. 23 + GDB 213.61 Art. 12 Abs. 1
    ['OW', 1_000_000, 2700, 'N 950 + G 1750'],
    ['OW', 20_000_000, 20450, 'Randfall Deckel G 10000 + N 10450'],
    ['OW', 100_000, 600, 'Minimum N 400 + G 200'],
    // NW: NG 268.12 § 28 + NG 265.51 Anhang Ziff. 2.6.3.1
    ['NW', 1_000_000, 3175, 'N 1175 + G 2000'],
    ['NW', 10_000_000, 12175, 'Deckel 8000 gilt nur für G: N 4175 + G 8000'],
    ['NW', 50_000, 300, 'Randfall Minima N 200 + G 100'],
    // GL: GS III B/3/2 Anhang Ziff. 7.1 + GS III B/7/1 Art. 13 Abs. 2 lit. a
    ['GL', 100_000, 450, 'N 150 + G 300'],
    ['GL', 1_000_000, 3500, 'Randfall Deckel N 500 + G 3000'],
    ['GL', 10_000, 100, 'Randfall Minima 50 + 50'],
    // SH: SHR 211.433 § 13 Abs. 1 Ziff. 3.1 + § 15 Abs. 1 Ziff. 1
    ['SH', 30_000, 110, 'N Minimum 50 + G 60'],
    ['SH', 1_000_000, 3000, 'N 1000 + G 2000'],
    // TG: GGG RB 632.1 § 14 Abs. 1 (max 5000) + § 14 Abs. 2 Ziff. 11 (max 10000)
    ['TG', 6_000_000, 14000, 'N am Deckel 5000 + G 9000 (15’000 erst ab 6,67 Mio)'],
    ['TG', 7_000_000, 15000, 'Randfall beide Deckel 5000 + 10000'],
    ['TG', 80_000, 220, 'N Minimum 100 + G 120'],
    // GR: NotGebV BR 210.370 Art. 16 Abs. 1 lit. i Ziff. 1 (min 100) + BR 217.200 Art. 13 Abs. 1 lit. j (min 50)
    ['GR', 75_000, 175, 'N Minimum 100 + G 75'],
    ['GR', 40_000, 150, 'Randfall Minima 100 + 50'],
    // ZH: NotGebV LS 243 Anhang Ziff. 1.2.1 + 2.3.1 (je 1‰, min 100) — Betrag unverändert
    ['ZH', 800_000, 1600, 'bestehender Wert bleibt'],
    ['ZH', 50_000, 200, 'Randfall beide Minima'],
    // SG: sGS 914.5 Art. 10 Nr. 21.01 i.V.m. Art. 5 Abs. 1/2 (2 × 1‰, je 100–2000)
    ['SG', 1_000_000, 2000, 'bestehender Wert bleibt'],
    ['SG', 10_000_000, 4000, 'Randfall beide Deckel'],
    // UR: nur Eintragsgebühr (Grundbuchgebührentarif Art. 5), Notariat ohne amtlichen Tarif (RL-26, B-T4)
    ['UR', 1_000_000, 2000, 'nur Eintragsteil'],
    // SZ: eine Gebühr (§ 5 Abs. 1 Nr. 2), Degression über 8 Mio — unverändert
    ['SZ', 10_000_000, 8100, '7200 + 50 % auf 2 Mio'],
  ];
  for (const [k, summe, soll, was] of faelle) {
    it(`${k} Pfandsumme ${summe.toLocaleString('de-CH')} = ${soll} (${was})`, () => {
      expect(betrag(k, summe)).toBeCloseTo(soll, 2);
    });
  }

  it('UR: nur Eintragsgebühr, Hinweis bleibt (B-T4), kein «nicht beziffert»', () => {
    const p = pfand('UR', 1_000_000);
    expect(p.ergebnis.deterministisch).toBe(true);
    expect(p.quelle.hinweis).toMatch(/Nur Eintragsgebühr/);
  });

  it('Schritte weisen Beurkundung und Grundbucheintrag getrennt aus (AG 1 Mio)', () => {
    const e = pfand('AG', 1_000_000).ergebnis;
    if (!e.deterministisch) throw new Error('unerwartet');
    const text = e.schritte.join(' | ');
    expect(text).toMatch(/Beurkundung: Teilbetrag/);
    expect(text).toMatch(/Grundbucheintrag: Teilbetrag/);
    expect(text).toMatch(/Summe der Teile/);
    expect(ngPostenText(pfand('AG', 1_000_000))).toBe('CHF 3’633');
  });

  it('BE bleibt nicht beziffert (Beurkundung nach Zeitaufwand)', () => {
    expect(pfand('BE', 1_000_000).ergebnis.deterministisch).toBe(false);
  });

  it('Beurkundungsrechner «Schuldbrief» führt die neuen Notariatsteile (AG, BS, LU, GL, SH) und SZ mit Degression', () => {
    const b = (kanton: KantonCode, wert: number): number => {
      const e = berechneBeurkundung({ geschaeftsart: 'schuldbrief', kanton, geschaeftswertCHF: wert }).posten?.ergebnis;
      if (!e || !e.deterministisch) throw new Error(`${kanton}: nicht beziffert`);
      return e.betragChf;
    };
    expect(b('AG', 1_000_000)).toBeCloseTo(2133.33, 2);
    expect(b('BS', 10_000_000)).toBe(16000);
    expect(b('LU', 1_000_000)).toBe(1625);
    expect(b('GL', 1_000_000)).toBe(500);
    expect(b('SH', 30_000)).toBe(50);
    expect(b('SZ', 10_000_000)).toBe(8100); // vorher ohne Degression 9000
  });
});
