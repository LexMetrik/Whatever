// ─── Notariats- & Grundbuchkosten-Engine ───────────────────────────────────
import { describe, expect, it } from 'vitest';
import { berechneNotariatGrundbuch, vergleichNotariatGrundbuch, ngPostenText, type NgPosten } from '../lib/notariatGrundbuch';
import { NOTARIAT, GRUNDBUCH, GRUNDPFAND, HANDAENDERUNGSSTEUER } from '../data/tarif/notariat-grundbuch';
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
    const vd = berechneNotariatGrundbuch({ kanton: 'VD', kaufpreisCHF: 1_000_000 });
    expect(vd.beurkundung.ergebnis.deterministisch).toBe(false);  // formel_extern
    expect(ngPostenText(vd.beurkundung)).toMatch(/Vereinbarung|Aufwand/);
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
