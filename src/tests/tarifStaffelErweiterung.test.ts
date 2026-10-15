// ─── Unit-Tests RL-27: Staffel-Primitiv, Opt-in-Erweiterungen ───────────────
//
// Beispielfälle aus dem Bau-Dossier RL-26/27 Teil B.4 als SYNTHETISCHE Regeln
// (keine Datenwerte des Bestands; die Daten-PRs RL-28/29/30 setzen die Felder
// erst später). Normen der Fälle (nur Herkunft der Erwartung, nicht Datenbasis):
//  · VS OcRF Art. 32 Abs. 3; BS V EG ZGB § 51 Abs. 1 lit. b; AG GBAG § 4 Abs. 1;
//    SZ SRSZ 213.512 § 5 Abs. 1 (Basisrundung)
//  · NE LTFrais RSN 164.1 Art. 12 Abs. 1 (Ergebnisrundung auf 10 abwärts)
//  · SG GKV sGS 941.12 Art. 10/11; AR bGS 233.3 Art. 17/20; AI GS 173.810
//    Art. 11/15 (Streitwertfaktor)
//  · TG AnwT RB 176.31 § 5 Abs. 2 (interpolierter Richtpunkt)
import { describe, expect, it } from 'vitest';
import { auswertenTarif, type TarifRegel } from '../lib/tarif/staffel';

// Tausendertrenner ist ICU-abhängig (' oder ’): Vergleich normalisiert.
const norm = (s: string | false): string => (s || '').replace(/\u2019/g, "'");
const betrag = (r: TarifRegel, x: number): number => {
  const e = auswertenTarif(r, x);
  if (!e.deterministisch) throw new Error('erwartet deterministisch');
  return e.betragChf;
};
const spanne = (r: TarifRegel, x: number) => {
  const e = auswertenTarif(r, x);
  if (e.deterministisch) throw new Error('erwartet Spanne');
  return e;
};

describe('basisRundung — Bemessungsbasis vor Bandwahl', () => {
  const vs: TarifRegel = { typ: 'promille', promille: 2, minChf: 100, maxChf: 5000, basisRundung: { schrittChf: 1000, richtung: 'auf' } };
  const bs: TarifRegel = { typ: 'promille', promille: 1, minChf: 200, maxChf: 50000, basisRundung: { schrittChf: 1000, richtung: 'auf' } };
  const ag: TarifRegel = { typ: 'promille', promille: 4, minChf: 100, basisRundung: { schrittChf: 1000, richtung: 'naechste' } };
  const sz: TarifRegel = { typ: 'sockel_prozent', prozent: 0.09, basisRundung: { schrittChf: 50000, richtung: 'auf' } };

  it('VS 1\'234\'001 → 1\'235\'000 × 2 ‰ = 2470', () => expect(betrag(vs, 1_234_001)).toBe(2470));
  it('BS 1\'234\'001 → 1\'235 (statt 1\'234)', () => expect(betrag(bs, 1_234_001)).toBe(1235));
  it('AG 1\'234\'567 → 4940 und 500\'499 → 2000', () => {
    expect(betrag(ag, 1_234_567)).toBe(4940);
    expect(betrag(ag, 500_499)).toBe(2000);
  });
  it('SZ 30\'000 → 45; 1\'000\'001 und 1\'020\'000 → 945', () => {
    expect(betrag(sz, 30_000)).toBe(45);
    expect(betrag(sz, 1_000_001)).toBe(945);
    expect(betrag(sz, 1_020_000)).toBe(945);
  });
  it('an exakten Vielfachen unverändert (Float-sicher), Rundung nur Schritt-Zeile', () => {
    expect(betrag(vs, 1_235_000)).toBe(2470);
    const ohne: TarifRegel = { typ: 'promille', promille: 2, minChf: 100, maxChf: 5000 };
    expect(betrag(vs, 1_235_000)).toBe(betrag(ohne, 1_235_000));
  });
  it('Schritt-Zeile nur bei gesetzter Option, als ganzer Satz', () => {
    const e = auswertenTarif(vs, 1_234_001);
    expect(norm(e.deterministisch && e.schritte[0])).toBe("Bemessungsbasis auf CHF 1'000 aufgerundet: 1'235'000.");
    const ohne = auswertenTarif({ typ: 'promille', promille: 2 }, 1_234_001);
    expect(ohne.deterministisch && ohne.schritte.some((s) => s.includes('Bemessungsbasis'))).toBe(false);
  });
  it('wirkt vor der Bandwahl: 1 Franken über der Bandgrenze fällt nach dem Aufrunden ins nächste Band', () => {
    const r: TarifRegel = {
      typ: 'staffel_inklusiv',
      baender: [{ bisChf: 100_000, chf: 10 }, { bisChf: Infinity, chf: 20 }],
      basisRundung: { schrittChf: 1000, richtung: 'auf' },
    };
    expect(betrag(r, 99_999)).toBe(10); // → 100'000, noch im ersten Band
    expect(betrag(r, 100_001)).toBe(20);
  });
  it('ungültiger Bemessungswert wirft weiterhin (auch bei Rundung); ungültiger Schritt wirft', () => {
    expect(() => auswertenTarif(vs, -1)).toThrow(RangeError);
    expect(() => auswertenTarif(vs, NaN)).toThrow(RangeError);
    expect(() => auswertenTarif({ typ: 'promille', promille: 1, basisRundung: { schrittChf: 0, richtung: 'auf' } }, 10)).toThrow(RangeError);
  });
  it('richtung ab', () => {
    expect(betrag({ typ: 'promille', promille: 1, basisRundung: { schrittChf: 1000, richtung: 'ab' } }, 1_999_999)).toBe(1999);
  });
});

describe('ergebnisRundung — nach Mindest-/Höchstbetrag', () => {
  const ne: TarifRegel = { typ: 'sockel_prozent', prozent: 13, ergebnisRundung: { schrittChf: 10, richtung: 'ab' } };
  it('NE 12\'345 × 13 % = 1604.85 → 1600', () => expect(betrag(ne, 12_345)).toBe(1600));
  it('genau 1610.00 bleibt 1610 (nicht 1600)', () => {
    expect(betrag({ typ: 'fix', chf: 1610 } as TarifRegel, 0)).toBe(1610);
    // 1610.0000000000002 aus einer Summe darf nicht kippen.
    const s: TarifRegel = {
      typ: 'summe',
      teile: [{ etikett: 'A', regel: { typ: 'fix', chf: 1609.9 } }, { etikett: 'B', regel: { typ: 'fix', chf: 0.1 } }],
      ergebnisRundung: { schrittChf: 10, richtung: 'ab' },
    };
    expect(betrag(s, 0)).toBe(1610);
    expect(betrag({ typ: 'sockel_prozent', prozent: 7, ergebnisRundung: { schrittChf: 10, richtung: 'ab' } }, 23_000)).toBe(1610);
  });
  it('Rundung folgt auf den Höchstbetrag, nicht davor', () => {
    const r: TarifRegel = { typ: 'sockel_prozent', prozent: 50, maxChf: 1005, ergebnisRundung: { schrittChf: 10, richtung: 'auf' } };
    // roh 5000 → Deckel 1005 → aufrunden 1010. Rundung VOR dem Deckel ergäbe 1005.
    expect(betrag(r, 10_000)).toBe(1010);
  });
  it('Spanne: beide Grenzen gerundet, Satz im Hinweis', () => {
    const r: TarifRegel = { typ: 'rahmen', vonChf: 105, bisChf: 1234, ergebnisRundung: { schrittChf: 10, richtung: 'ab' } };
    const e = spanne(r, 0);
    expect([e.vonChf, e.bisChf]).toEqual([100, 1230]);
    expect(e.hinweis).toMatch(/Grenzen auf CHF 10 abgerundet\.$/);
  });
  it('Schritt-Zeile mit Ergebnis', () => {
    const e = auswertenTarif(ne, 12_345);
    expect(norm(e.deterministisch && e.schritte[e.schritte.length - 1])).toBe("Ergebnis auf CHF 10 abgerundet: 1'600.");
  });
});

describe('summe — Teilregeln mit Etikett', () => {
  const grundpfand: TarifRegel = {
    typ: 'summe',
    teile: [
      { etikett: 'Grundbuch 1,5 ‰', regel: { typ: 'promille', promille: 1.5 } },
      { etikett: 'Notariat', regel: { typ: 'fix', chf: 2133 } },
    ],
  };
  it('Σ der deterministischen Teile (1 Mio → 1500 + 2133 = 3633), Schritte je Teil mit Etikett', () => {
    const e = auswertenTarif(grundpfand, 1_000_000);
    expect(e.deterministisch && e.betragChf).toBe(3633);
    if (!e.deterministisch) return;
    expect(e.schritte.some((s) => s.startsWith('Grundbuch 1,5 ‰: '))).toBe(true);
    expect(e.schritte.some((s) => s.startsWith('Notariat: '))).toBe(true);
    expect(norm(e.schritte[e.schritte.length - 1])).toBe("Summe der Teile: CHF 3'633");
  });
  it('Deckel je Teil und Deckel/Minimum der Summe', () => {
    const r: TarifRegel = {
      typ: 'summe',
      teile: [
        { etikett: 'A', regel: { typ: 'promille', promille: 5, maxChf: 20_000 } },
        { etikett: 'B', regel: { typ: 'promille', promille: 1, maxChf: 3_000 } },
      ],
      minChf: 700,
      maxChf: 22_000,
    };
    expect(betrag(r, 100_000)).toBe(700); // 500 + 100 = 600 → Mindest 700
    expect(betrag(r, 1_000_000)).toBe(5000 + 1000);
    expect(betrag(r, 50_000_000)).toBe(22_000); // 20'000 + 3'000 = 23'000 → Deckel 22'000
  });
  it('ein Rahmen-Teil macht die Summe zur Spanne (Σ von, Σ bis)', () => {
    const r: TarifRegel = {
      typ: 'summe',
      teile: [
        { etikett: 'Fix', regel: { typ: 'fix', chf: 100 } },
        { etikett: 'Rahmen', regel: { typ: 'rahmen', vonChf: 200, bisChf: 900 } },
      ],
    };
    const e = spanne(r, 5);
    expect([e.vonChf, e.bisChf]).toEqual([300, 1000]);
    expect(e.hinweis).toMatch(/\.$/);
  });
  it('formel_extern-Teil: keine Scheinzahl (kein von/bis), Hinweis nennt den Teil', () => {
    const r: TarifRegel = {
      typ: 'summe',
      teile: [
        { etikett: 'Fix', regel: { typ: 'fix', chf: 100 } },
        { etikett: 'Aufwand', regel: { typ: 'formel_extern', hinweis: 'Nach Zeitaufwand' } },
      ],
    };
    const e = spanne(r, 5);
    expect(e.vonChf).toBeUndefined();
    expect(e.bisChf).toBeUndefined();
    expect('richtpunktChf' in e).toBe(false);
    expect(e.hinweis).toContain('Aufwand');
    expect(e.hinweis).toContain('Nach Zeitaufwand');
    expect(e.hinweis).toMatch(/\.$/);
  });
  it('leere Summe wirft; Reihenfolge der Teile ist unerheblich', () => {
    expect(() => auswertenTarif({ typ: 'summe', teile: [] }, 1)).toThrow(RangeError);
    const umgekehrt: TarifRegel = { typ: 'summe', teile: [...(grundpfand as Extract<TarifRegel, { typ: 'summe' }>).teile].reverse() };
    expect(betrag(umgekehrt, 1_000_000)).toBe(3633);
  });
  it('Teil mit eigener Basisrundung (Rekursion)', () => {
    const r: TarifRegel = {
      typ: 'summe',
      teile: [{ etikett: 'GB', regel: { typ: 'promille', promille: 1, basisRundung: { schrittChf: 1000, richtung: 'auf' } } }],
    };
    expect(betrag(r, 1_234_001)).toBe(1235);
  });
});

describe('streitwertFaktor — Rahmen-Obergrenze nach Streitwert', () => {
  const stufen = [{ ueberChf: 50_000, faktor: 2 }, { ueberChf: 100_000, faktor: 3 }, { ueberChf: 250_000, faktor: 3 }];
  const sg = (zaehlung: 'angefangen' | 'voll', extra: object = {}): TarifRegel => ({
    typ: 'rahmen', vonChf: 500, bisChf: 6000,
    streitwertFaktor: { stufen, jeWeitereChf: 250_000, plusFaktor: 1, stufenZaehlung: zaehlung, seite: 'bis', ...extra },
  });
  it('SG: 80\'000 → 500–12\'000; 1 Mio → 500–36\'000 (beide Lesarten)', () => {
    for (const z of ['angefangen', 'voll'] as const) {
      const a = spanne(sg(z), 80_000);
      expect([a.vonChf, a.bisChf]).toEqual([500, 12_000]);
      const b = spanne(sg(z), 1_000_000);
      expect([b.vonChf, b.bisChf]).toEqual([500, 36_000]);
    }
  });
  it('Kanten: 50\'000 ×1, 50\'000.01 ×2, 100\'000 ×2, 100\'000.01 ×3, 250\'000 ×3', () => {
    expect(spanne(sg('voll'), 50_000).bisChf).toBe(6000);
    expect(spanne(sg('voll'), 50_000.01).bisChf).toBe(12_000);
    expect(spanne(sg('voll'), 100_000).bisChf).toBe(12_000);
    expect(spanne(sg('voll'), 100_000.01).bisChf).toBe(18_000);
    expect(spanne(sg('voll'), 250_000).bisChf).toBe(18_000);
  });
  it('offene Fachfrage ist Option: 400\'000 → ×4 (angefangen) bzw. ×3 (voll)', () => {
    expect(spanne(sg('angefangen'), 400_000).bisChf).toBe(24_000);
    expect(spanne(sg('voll'), 400_000).bisChf).toBe(18_000);
  });
  it('AR: 100–5000 bei 1 Mio → 100–30\'000', () => {
    const e = spanne({ ...(sg('voll') as object), vonChf: 100, bisChf: 5000 } as TarifRegel, 1_000_000);
    expect([e.vonChf, e.bisChf]).toEqual([100, 30_000]);
  });
  it('AI: Höchstgrenze 90\'000 bei sehr grossem Streitwert; 1 Mio → 36\'000', () => {
    const ai = sg('angefangen', { hoechstChf: 90_000 });
    expect(spanne(ai, 1_000_000).bisChf).toBe(36_000);
    const gross = spanne(ai, 100_000_000);
    expect(gross.bisChf).toBe(90_000);
    expect(gross.vonChf).toBe(500);
    expect(gross.hinweis).toContain('Höchstgrenze');
  });
  it('seite beide skaliert auch die Untergrenze', () => {
    const e = spanne(sg('voll', { seite: 'beide' }), 80_000);
    expect([e.vonChf, e.bisChf]).toEqual([1000, 12_000]);
  });
  it('ohne gültigen Bemessungswert klarer Fehler (kein stilles Weiterrechnen)', () => {
    expect(() => auswertenTarif(sg('voll'), NaN)).toThrow(RangeError);
    expect(() => auswertenTarif(sg('voll'), -5)).toThrow(RangeError);
  });
  it('ohne streitwertFaktor bleibt rahmen wertunabhängig (Bestandsverhalten)', () => {
    const e = spanne({ typ: 'rahmen', vonChf: 1, bisChf: 2 }, NaN);
    expect([e.vonChf, e.bisChf]).toEqual([1, 2]);
  });
  it('auch auf staffel_rahmen', () => {
    const r: TarifRegel = {
      typ: 'staffel_rahmen',
      baender: [{ grenzeChf: Infinity, minChf: 500, maxChf: 6000 }],
      streitwertFaktor: { stufen: [{ ueberChf: 50_000, faktor: 2 }], seite: 'bis' },
    };
    expect(spanne(r, 80_000).bisChf).toBe(12_000);
    expect(spanne(r, 10_000).bisChf).toBe(6000);
  });
});

describe('interpolierter Richtpunkt (TG)', () => {
  const tg: TarifRegel = {
    typ: 'staffel_rahmen',
    baender: [
      { grenzeChf: 30_000, minChf: 2000, maxChf: 5000 },
      { grenzeChf: 100_000, minChf: 5000, maxChf: 10_000, interpoliert: true },
      { grenzeChf: 500_000, minChf: 10_000, maxChf: 30_000 },
      { grenzeChf: 2_000_000, minChf: 30_000, maxChf: 60_000, interpoliert: true },
      { grenzeChf: Infinity, minChf: 60_000, maxProzent: 3 },
    ],
  };
  it('50\'000 → 6428.57; 1 Mio → 40\'000', () => {
    expect(spanne(tg, 50_000).richtpunktChf).toBe(6428.57);
    expect(spanne(tg, 1_000_000).richtpunktChf).toBe(40_000);
  });
  it('Rahmen bleibt Spanne; Hinweis nennt den Richtpunkt als ganzen Satz', () => {
    const e = spanne(tg, 50_000);
    expect([e.vonChf, e.bisChf]).toEqual([5000, 10_000]);
    expect(norm(e.hinweis)).toContain('6\'428.57');
    expect(e.hinweis).toMatch(/\.$/);
  });
  it('Bandgrenzen: oben = max, knapp über Vorband = ca. min; Band ohne Option: kein Feld', () => {
    expect(spanne(tg, 100_000).richtpunktChf).toBe(10_000);
    expect(spanne(tg, 30_000.01).richtpunktChf).toBeCloseTo(5000, 0);
    expect('richtpunktChf' in spanne(tg, 200_000)).toBe(false);
    expect(spanne(tg, 4_000_000).bisChf).toBe(120_000);
  });
  it('Fehlkonfiguration: erstes Band ohne vonGrenzeChf bzw. unendliche Grenze wirft', () => {
    const erst: TarifRegel = { typ: 'staffel_rahmen', baender: [{ grenzeChf: 1000, minChf: 1, maxChf: 2, interpoliert: true }, { grenzeChf: Infinity, minChf: 2, maxChf: 3 }] };
    expect(() => auswertenTarif(erst, 500)).toThrow(RangeError);
    const mitVon: TarifRegel = { typ: 'staffel_rahmen', baender: [{ grenzeChf: 1000, minChf: 0, maxChf: 100, interpoliert: true, vonGrenzeChf: 0 }, { grenzeChf: Infinity, minChf: 2, maxChf: 3 }] };
    expect(spanne(mitVon, 500).richtpunktChf).toBe(50);
    const unendlich: TarifRegel = { typ: 'staffel_rahmen', baender: [{ grenzeChf: Infinity, minChf: 1, maxChf: 2, interpoliert: true, vonGrenzeChf: 10 }] };
    expect(() => auswertenTarif(unendlich, 500)).toThrow(RangeError);
  });
  it('Summe: Richtpunkt nur, wenn jeder Rahmen-Teil einen hat', () => {
    const s: TarifRegel = { typ: 'summe', teile: [{ etikett: 'Fix', regel: { typ: 'fix', chf: 100 } }, { etikett: 'TG', regel: tg }] };
    expect(spanne(s, 50_000).richtpunktChf).toBe(6528.57);
    const ohne: TarifRegel = { typ: 'summe', teile: [{ etikett: 'Fix', regel: { typ: 'fix', chf: 100 } }, { etikett: 'R', regel: { typ: 'rahmen', vonChf: 1, bisChf: 2 } }] };
    expect('richtpunktChf' in spanne(ohne, 5)).toBe(false);
  });
});
