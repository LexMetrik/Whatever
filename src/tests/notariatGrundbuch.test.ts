// ─── Notariats- & Grundbuchkosten-Engine ───────────────────────────────────
import { describe, expect, it } from 'vitest';
import { berechneNotariatGrundbuch, vergleichNotariatGrundbuch, ngPostenText, type NgPosten } from '../lib/notariatGrundbuch';
import { NOTARIAT, GRUNDBUCH, HANDAENDERUNGSSTEUER } from '../data/tarif/notariat-grundbuch';
import { GRUNDPFAND } from '../data/tarif/grundpfand';
import { KANTONE, type KantonCode } from '../data/tarif/typen';

const det = (p: NgPosten): number => {
  const e = p.ergebnis;
  if (!e.deterministisch) throw new Error('kein deterministischer Betrag');
  return e.betragChf;
};

describe('Notariat/Grundbuch — amtliche Stützstellen bei Kaufpreis CHF 1 Mio', () => {
  const bei1Mio = (kanton: KantonCode) => berechneNotariatGrundbuch({ kanton, kaufpreisCHF: 1_000_000 });

  it('Beurkundung (Notariat) — deterministische Tarife', () => {
    expect(det(bei1Mio('ZH').beurkundung)).toBe(1000);   // 1‰
    expect(det(bei1Mio('LU').beurkundung)).toBe(2750);   // Staffel 3‰/2,5‰
    expect(det(bei1Mio('OW').beurkundung)).toBe(1900);
    expect(det(bei1Mio('NW').beurkundung)).toBe(1850);
    expect(det(bei1Mio('GL').beurkundung)).toBe(1700);
    expect(det(bei1Mio('AG').beurkundung)).toBe(3200);
    expect(det(bei1Mio('TI').beurkundung)).toBe(3875);
    expect(det(bei1Mio('SG').beurkundung)).toBe(2000);
    expect(det(bei1Mio('SZ').beurkundung)).toBe(900);    // 0,9‰
    expect(det(bei1Mio('AR').beurkundung)).toBe(1000);   // kombiniert N+G
  });

  it('Beurkundung UR — kein amtlicher Tarif, nicht gerechnet (RL-26, W-14, RB 9.2311 Art. 38 Abs. 3)', () => {
    const p = bei1Mio('UR').beurkundung;
    expect(p.ergebnis.deterministisch).toBe(false);
    expect(p.ergebnis).not.toHaveProperty('vonChf');
    expect(p.ergebnis).not.toHaveProperty('bisChf');
    expect(p.quelle.hinweis).toContain('RB 9.2311');
    expect(p.quelle.hinweis).toContain('erfragen');
    expect(ngPostenText(p)).toBe('nach Vereinbarung/Aufwand');
    expect(bei1Mio('UR').gesamtGebuehren).toBeNull();
  });

  it('Grundpfand UR — nur Eintragsgebühr nach amtlichem Grundbuchgebührentarif (RL-26, Auflage A1)', () => {
    // Grundbuchgebührentarif UR (4.12.2024, in Kraft 1.1.2025) Art. 5 Abs. 1 und 2: 2‰, min 70, max 10'000
    const ur = (pfandsummeCHF: number) =>
      berechneNotariatGrundbuch({ kanton: 'UR', kaufpreisCHF: 1_000_000, mitGrundpfand: true, pfandsummeCHF }).grundpfand!;
    expect(det(ur(20_000))).toBe(70);          // Minimum greift (2‰ = 40)
    expect(det(ur(1_000_000))).toBe(2000);     // 2‰
    expect(det(ur(6_000_000))).toBe(10000);    // Deckel greift (2‰ = 12'000)
    expect(ur(1_000_000).quelle.hinweis).toContain('Nur Eintragsgebühr');
    expect(ur(1_000_000).quelle.quelleUrl).not.toContain('urilaw');
  });

  it('Grundbuch — deterministische Tarife', () => {
    expect(det(bei1Mio('ZH').grundbuch)).toBe(1000);
    expect(det(bei1Mio('LU').grundbuch)).toBe(2000);     // 2‰
    expect(det(bei1Mio('GL').grundbuch)).toBe(3500);     // 3,5‰
    expect(det(bei1Mio('AG').grundbuch)).toBe(4000);     // 4‰
    expect(det(bei1Mio('SH').grundbuch)).toBe(6000);     // 6‰
    expect(det(bei1Mio('TI').grundbuch)).toBe(11000);    // 11‰ auf Gesamtwert
    expect(det(bei1Mio('OW').grundbuch)).toBe(1500);
    expect(det(bei1Mio('NW').grundbuch)).toBe(1000);
    expect(det(bei1Mio('NE').grundbuch)).toBe(1360);     // 1,5‰/0,8‰
    expect(det(bei1Mio('GE').grundbuch)).toBe(2100);     // 0,21 %
    expect(det(bei1Mio('BE').grundbuch)).toBe(200);      // Fix
    expect(det(bei1Mio('FR').grundbuch)).toBe(120);      // Fix
    expect(det(bei1Mio('BL').grundbuch)).toBe(300);      // Fix
  });

  it('Handänderungssteuer — Satz × Kaufpreis bzw. keine', () => {
    const h = (k: KantonCode) => berechneNotariatGrundbuch({ kanton: k, kaufpreisCHF: 1_000_000, mitHandaenderungssteuer: true }).handaenderungssteuer!;
    expect(det(h('BE'))).toBe(18000);   // 1,8 %
    expect(det(h('SO'))).toBe(22000);   // 2,2 %
    expect(det(h('BS'))).toBe(30000);   // 3 %
    expect(det(h('BL'))).toBe(25000);   // 2,5 %
    expect(det(h('NE'))).toBe(33000);   // 3,3 %
    expect(det(h('VS'))).toBe(13000);   // pauschal-stufig 1,3 %
    expect(det(h('JU'))).toBe(25000);   // 2,5 % bis 1 Mio
    // keine Handänderungssteuer → nicht bezifferbar
    for (const k of ['ZH', 'UR', 'GL', 'ZG', 'SH', 'AG', 'TI'] as const) {
      expect(h(k).ergebnis.deterministisch, k).toBe(false);
    }
  });

  it('Gesamtkosten = Beurkundung + Grundbuch (+ Grundpfand)', () => {
    const r = berechneNotariatGrundbuch({ kanton: 'ZH', kaufpreisCHF: 1_000_000 });
    expect(r.gesamtGebuehren).toEqual({ vonChf: 2000, bisChf: 2000 }); // 1000 + 1000
    const mitPfand = berechneNotariatGrundbuch({ kanton: 'ZH', kaufpreisCHF: 1_000_000, mitGrundpfand: true, pfandsummeCHF: 800_000 });
    expect(det(mitPfand.grundpfand!)).toBe(1600); // 2‰ × 800k
    expect(mitPfand.gesamtGebuehren).toEqual({ vonChf: 3600, bisChf: 3600 });
  });
});

describe('Notariat/Grundbuch — Ehrlichkeit & Robustheit', () => {
  it('aufwand-/bandbreitenbasierte Tarife liefern Spanne oder "nach Vereinbarung"', () => {
    const zg = berechneNotariatGrundbuch({ kanton: 'ZG', kaufpreisCHF: 1_000_000 });
    expect(zg.beurkundung.ergebnis.deterministisch).toBe(false); // Rahmen 300–4000
    // RL-29 (Fachänderung): VD ist nach TNo Art. 14 al. 1 eine deterministische Staffel (nicht mehr formel_extern).
    const vd = berechneNotariatGrundbuch({ kanton: 'VD', kaufpreisCHF: 1_000_000 });
    expect(vd.beurkundung.ergebnis.deterministisch).toBe(true);
    expect(det(vd.beurkundung)).toBe(2875);
  });
  it('alle 26 Kantone: jeder Posten hat eine amtliche Quelle (oder ist als "keine" markiert)', () => {
    for (const k of KANTONE) {
      for (const tarif of [NOTARIAT[k], GRUNDBUCH[k], GRUNDPFAND[k], HANDAENDERUNGSSTEUER[k]]) {
        expect(tarif, k).toBeDefined();
        const ok = tarif.quelleUrl.startsWith('https://') || tarif.regel.typ === 'formel_extern';
        expect(ok, `${k} ${tarif.erlassNr}`).toBe(true);
        expect(tarif.verifiziert).not.toBe('geprüft' as never);
      }
    }
  });
  it('vergleichNotariatGrundbuch: 26 Ergebnisse, kein Crash über breite Kaufpreis-Matrix', () => {
    for (const kp of [0, 100_000, 500_000, 1_000_000, 3_000_000, 10_000_000]) {
      const v = vergleichNotariatGrundbuch(kp, true, kp, true);
      expect(v).toHaveLength(26);
      for (const r of v) {
        expect(ngPostenText(r.beurkundung).length).toBeGreaterThan(0);
        expect(ngPostenText(r.grundbuch).length).toBeGreaterThan(0);
      }
    }
  });
  it('Streitwert/Kaufpreis 0 ok; negativ wirft', () => {
    expect(() => berechneNotariatGrundbuch({ kanton: 'ZH', kaufpreisCHF: 0 })).not.toThrow();
    expect(() => berechneNotariatGrundbuch({ kanton: 'ZH', kaufpreisCHF: -1 })).toThrow();
  });
});

// ─── RL-29 Teil 1: Notariats-Staffeln Grundstückkauf nach Norm (RV-20) ─────
// Prüfpunkte aus den amtlichen Staffeln, abgerufen 15.10.2026:
// TI LTN Art. 5 cpv. 1 · FR RSF 261.16 Art. 4 al. 1 ch. 1bis · VS RS 178.104 Art. 13 al. 1 ·
// NE RSN 166.31 Art. 14 ch. 54 · GE REmNot Art. 10 al. 1 · VD TNo Art. 14 al. 1 ·
// JU RSJU 189.61 Art. 9 al. 1 · BE GebVN Anhang 1 · SO GT § 25 Abs. 1 lit. a.
describe('Notariat — Staffeln Grundstückkauf nach Norm (RL-29)', () => {
  const b = (kanton: KantonCode, kaufpreisCHF: number) => berechneNotariatGrundbuch({ kanton, kaufpreisCHF }).beurkundung;
  const rahmen = (kanton: KantonCode, kaufpreisCHF: number) => {
    const e = b(kanton, kaufpreisCHF).ergebnis;
    if (e.deterministisch) throw new Error('Spanne erwartet');
    return [e.vonChf, e.bisChf];
  };

  it('TI Art. 5 cpv. 1: Bänder über 1 Mio und Deckel ab 50 Mio', () => {
    expect(det(b('TI', 1_000_000))).toBe(3875);   // Knick, unverändert
    expect(det(b('TI', 1_500_000))).toBe(5125);   // 3875 + 2,5‰ × 500k
    expect(det(b('TI', 2_000_000))).toBe(6375);   // Staffelgrenze
    expect(det(b('TI', 3_000_000))).toBe(8375);   // 6375 + 2‰ × 1 Mio
    expect(det(b('TI', 50_000_000))).toBe(37_375);
    expect(det(b('TI', 60_000_000))).toBe(37_375); // > 50 Mio nicht mehr berücksichtigt
    expect(det(b('TI', 100_000))).toBe(500);       // Minimum
  });
  it('FR Art. 4 al. 1 ch. 1bis: Staffel mit Höchstbetrag 10’000', () => {
    expect(det(b('FR', 1_000_000))).toBe(2455);
    expect(det(b('FR', 3_000))).toBe(150);
    expect(det(b('FR', 5_000))).toBe(150);        // Staffelgrenze a)
    expect(det(b('FR', 20_000))).toBe(255);       // Staffelgrenze b)
    expect(det(b('FR', 10_000_000))).toBe(9955);
    expect(det(b('FR', 20_000_000))).toBe(10_000); // Deckel
  });
  it('VS Art. 13 al. 1: kumulative Staffel ohne Höchstbetrag', () => {
    expect(det(b('VS', 1_000_000))).toBe(3875);
    expect(det(b('VS', 5_000))).toBe(200);
    expect(det(b('VS', 200_000))).toBe(1175);     // Staffelgrenze
    expect(det(b('VS', 20_000_000))).toBe(31_875);
  });
  it('NE Art. 14 ch. 54: Pauschalen je Tranche (obere Grenze inklusive)', () => {
    expect(det(b('NE', 1_000_000))).toBe(2950);
    expect(det(b('NE', 1_000_001))).toBe(3100);
    expect(det(b('NE', 8_000_000))).toBe(9600);
    expect(det(b('NE', 8_000_001))).toBe(10_000);
    expect(det(b('NE', 10_000_000))).toBe(10_000);
  });
  it('GE REmNot Art. 10 al. 1: marginale Staffel, Minimum 200', () => {
    expect(det(b('GE', 1_000_000))).toBe(5200);
    expect(det(b('GE', 100_000))).toBe(700);
    expect(det(b('GE', 20_000))).toBe(200);       // 140 → Minimum
    expect(det(b('GE', 200_000))).toBe(1400);     // Staffelgrenze
    expect(det(b('GE', 20_000_000))).toBe(28_950);
  });
  it('VD TNo Art. 14 al. 1: Staffel, Minimum 300', () => {
    expect(det(b('VD', 1_000_000))).toBe(2875);
    expect(det(b('VD', 30_000))).toBe(300);       // 210 → Minimum
    expect(det(b('VD', 100_000))).toBe(700);      // Staffelgrenze
    expect(det(b('VD', 20_000_000))).toBe(17_625);
  });
  it('JU Art. 9 al. 1: Staffel, Minimum 200, Höchstbetrag 15’000', () => {
    expect(det(b('JU', 1_000_000))).toBe(3525);
    expect(det(b('JU', 20_000))).toBe(200);       // 140 → Minimum
    expect(det(b('JU', 100_000))).toBe(700);      // Staffelgrenze
    expect(det(b('JU', 20_000_000))).toBe(15_000); // 18’275 → Deckel
  });
  it('BE GebVN Anhang 1: Rahmen Minimum–Maximum je Zeile (Spanne, kein Punktwert)', () => {
    expect(rahmen('BE', 1_000_000)).toEqual([2915, 4575]);
    expect(rahmen('BE', 1_000_001)).toEqual([3065, 4845]);
    expect(rahmen('BE', 100_000)).toEqual([715, 925]);
    expect(rahmen('BE', 20_000_000)).toEqual([18_865, 30_825]);
  });
  it('SO GT § 25 Abs. 1 lit. a: eine Gebühr 100–10’000 für Beurkundung und Eintrag zusammen', () => {
    expect(rahmen('SO', 1_000_000)).toEqual([100, 10_000]);
    expect(berechneNotariatGrundbuch({ kanton: 'SO', kaufpreisCHF: 1_000_000 }).gesamtGebuehren).toEqual({ vonChf: 100, bisChf: 10_000 });
  });
});
