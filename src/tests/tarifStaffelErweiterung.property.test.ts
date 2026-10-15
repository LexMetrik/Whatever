// ─── Property-Tests RL-27: Staffel-Primitiv, Opt-in-Erweiterungen ────────────
//
// Ergänzt tarifStaffelErweiterung.test.ts (Beispielfälle) um zufallsgetriebene
// Eigenschaften mit festem Seed (§2). Der Opt-out-Test prüft nur, dass für jede
// real geladene Tarifregel explizit gesetzte, aber leere Optionen (`undefined`)
// dasselbe liefern wie fehlende Felder (inkl. schritte/hinweis). Das ist KEIN
// Neutralitätsbeweis gegen den Stand vor RL-27 (er vergleicht die neue
// Implementierung mit sich selbst); diesen Beweis tragen die byte-gleichen
// Golden-Outputs (npm run golden:vergleich) und die unveränderten Bestandstests. Die übrigen Eigenschaften nutzen synthetische Regeln mit
// RAPPEN-GANZZAHLIGEN Eingaben und einem unabhängigen Ganzzahl-Orakel
// (keine Wiederverwendung der Implementierung im Erwartungswert).
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { auswertenTarif, type TarifRegel, type TarifErgebnis } from '../lib/tarif/staffel';
import * as beurkundung from '../data/tarif/beurkundung';
import * as gerichtskosten from '../data/tarif/gerichtskosten';
import * as notariat from '../data/tarif/notariat-grundbuch';
import * as parteientschaedigung from '../data/tarif/parteientschaedigung';
import * as nv from '../data/tarif/nicht-vermoegensrechtlich';
import * as schlichtung from '../data/tarif/schlichtung';
import * as bger from '../data/tarif/bundesgericht';
import * as grundbuch from '../data/tarif/grundbuch';

fc.configureGlobal({ seed: 20261015, numRuns: 300 });

// ─── Korpus: ALLE Tarifregeln aller Datenmodule (generisch eingesammelt) ──────
function sammle(v: unknown, out: TarifRegel[], tiefe = 0): void {
  if (!v || typeof v !== 'object' || tiefe > 4) return;
  const o = v as Record<string, unknown>;
  const r = o.regel as { typ?: unknown } | undefined;
  if (r && typeof r === 'object' && typeof r.typ === 'string') out.push(r as TarifRegel);
  for (const k of Object.keys(o)) if (k !== 'regel') sammle(o[k], out, tiefe + 1);
}
const KORPUS: TarifRegel[] = [];
for (const m of [beurkundung, gerichtskosten, notariat, parteientschaedigung, nv, schlichtung, bger, grundbuch]) {
  for (const v of Object.values(m)) sammle(v, KORPUS);
}

const rappen = (max: number) => fc.integer({ min: 0, max });
const chfVon = (r: number) => r / 100;

describe('Opt-out-Pfad — identisch mit Default-Pfad', () => {
  it('Korpus ist nicht leer (Sicherung gegen leeres Einsammeln)', () => {
    expect(KORPUS.length).toBeGreaterThan(200);
  });

  // Regeln, die eine Option tragen (hier: die Basisrundung der Pfandsumme im Eintragsteil
  // BS/AG, V EG ZGB BS § 51 Abs. 1 lit. b, GBAG AG § 4 Abs. 1; RL-28), sind vom Opt-out-
  // Vergleich ausgenommen: Das Überschreiben mit `undefined` würde die Datenoption löschen
  // und eine andere Regel vergleichen. Sie werden gezählt und als Liste fixiert.
  const hatOption = (r: TarifRegel): boolean => {
    const o = r as { basisRundung?: unknown; ergebnisRundung?: unknown; streitwertFaktor?: unknown };
    return o.basisRundung !== undefined || o.ergebnisRundung !== undefined || o.streitwertFaktor !== undefined;
  };
  const OHNE_OPTION = KORPUS.filter((r) => !hatOption(r));
  const MIT_OPTION = KORPUS.filter(hatOption);

  it('Regeln mit gesetzter Option im Korpus: Eintragsregeln BS/AG/VS (Basisrundung 1’000), SZ-Regeln (Tranchen 50’000 aufwärts); Aliase werden mehrfach eingesammelt', () => {
    const liste = MIT_OPTION.map((r) => JSON.stringify({ typ: r.typ, promille: (r as { promille?: number }).promille, basisRundung: (r as { basisRundung?: unknown }).basisRundung }));
    const bs = JSON.stringify({ typ: 'promille', promille: 1, basisRundung: { schrittChf: 1000, richtung: 'auf' } });
    const vs = JSON.stringify({ typ: 'promille', promille: 2, basisRundung: { schrittChf: 1000, richtung: 'auf' } });
    const ag = JSON.stringify({ typ: 'promille', promille: 4, basisRundung: { schrittChf: 1000, richtung: 'naechste' } });
    const sz = JSON.stringify({ typ: 'staffel_sockel_prozent', basisRundung: { schrittChf: 50000, richtung: 'auf' } });
    expect(liste.sort()).toEqual([
      // BS: V EG ZGB § 51 Abs. 1 lit. b (RL-28 Eintragsteil Grundpfand) + RL-29 T3 GRUNDBUCH.BS; GRUNDBUCH wird als GRUNDBUCH_EIGENTUM_KAUF (Alias in grundbuch.ts) zweimal eingesammelt
      bs, bs, bs,
      JSON.stringify({ typ: 'promille', promille: 1.5, basisRundung: { schrittChf: 1000, richtung: 'naechste' } }),
      // RL-29 T3: VS OcRF Art. 32 al. 3 («arrondie au millier de francs supérieurs»), GRUNDBUCH.VS, 2× wegen Alias
      vs, vs,
      // RL-29 T3: AG GBAG § 4 Abs. 1 («auf jeweils Fr. 1’000 auf- oder abzurunden»), GRUNDBUCH.AG, 2× wegen Alias
      ag, ag,
      // SZ: SRSZ 213.512 § 5 Abs. 1 Nr. 2 Schuldbrief (RL-28-Nachzug A4) + RL-29 T3 Nr. 1 NOTARIAT.SZ («bzw. Bruchteile davon»), NOTARIAT 2× wegen Alias GRUNDSTUECKKAUF_BEURKUNDUNG
      sz, sz, sz,
    ].sort());
  });

  it('jede reale Regel ohne gesetzte Option: explizit leere Optionen (undefined) == Regel ohne diese Felder (strikt, inkl. schritte)', () => {
    fc.assert(
      fc.property(fc.nat({ max: OHNE_OPTION.length - 1 }), rappen(10_000_000_000), (i, r) => {
        const regel = OHNE_OPTION[i];
        const x = chfVon(r);
        const mitLeer = { ...regel, basisRundung: undefined, ergebnisRundung: undefined, streitwertFaktor: undefined } as TarifRegel;
        const a = auswertenTarif(regel, x);
        const b = auswertenTarif(mitLeer, x);
        expect(b).toStrictEqual(a);
        expect(JSON.stringify(b)).toBe(JSON.stringify(a));
        expect('richtpunktChf' in a).toBe(false);
      }),
    );
  });
});

// ─── basisRundung ────────────────────────────────────────────────────────────
describe('basisRundung — Eigenschaften', () => {
  const schritt = fc.constantFrom(10, 50, 1000, 50_000);
  const richtung = fc.constantFrom('auf', 'ab', 'naechste') as fc.Arbitrary<'auf' | 'ab' | 'naechste'>;
  /** Ganzzahl-Orakel in Rappen (exakt): gerundeter Wert in CHF. */
  const orakel = (r: number, s: number, d: 'auf' | 'ab' | 'naechste'): number => {
    const m = s * 100;
    const q = Math.floor(r / m);
    const rest = r - q * m;
    const n = rest === 0 ? q : d === 'auf' ? q + 1 : d === 'ab' ? q : rest * 2 >= m ? q + 1 : q;
    return n * s;
  };
  const promille = (s: number, d: 'auf' | 'ab' | 'naechste'): TarifRegel => ({ typ: 'promille', promille: 2, basisRundung: { schrittChf: s, richtung: d } });
  const ohne: TarifRegel = { typ: 'promille', promille: 2 };

  it('f_mit(x) == f_ohne(rund(x)) (unabhängiges Orakel)', () => {
    fc.assert(fc.property(rappen(10_000_000_000), schritt, richtung, (r, s, d) => {
      const mit = auswertenTarif(promille(s, d), chfVon(r));
      const erwartet = auswertenTarif(ohne, orakel(r, s, d));
      expect(mit.deterministisch && mit.betragChf).toBe(erwartet.deterministisch && erwartet.betragChf);
    }));
  });
  it('Idempotenz an Vielfachen und |rund(x) − x| < Schritt; auf ≥ x, ab ≤ x', () => {
    fc.assert(fc.property(rappen(10_000_000_000), schritt, richtung, (r, s, d) => {
      const g = orakel(r, s, d);
      expect(Math.abs(g - chfVon(r))).toBeLessThan(s);
      if (d === 'auf') expect(g).toBeGreaterThanOrEqual(chfVon(r));
      if (d === 'ab') expect(g).toBeLessThanOrEqual(chfVon(r));
      expect(g % s).toBe(0);
      const a = auswertenTarif(promille(s, d), g);
      const b = auswertenTarif(ohne, g);
      expect(a.deterministisch && a.betragChf).toBe(b.deterministisch && b.betragChf);
    }));
  });
  it('Monotonie: x1 ≤ x2 ⇒ f(x1) ≤ f(x2)', () => {
    fc.assert(fc.property(rappen(10_000_000_000), rappen(10_000_000_000), schritt, richtung, (r1, r2, s, d) => {
      const [lo, hi] = r1 <= r2 ? [r1, r2] : [r2, r1];
      const a = auswertenTarif(promille(s, d), chfVon(lo));
      const b = auswertenTarif(promille(s, d), chfVon(hi));
      expect((a.deterministisch && a.betragChf) as number).toBeLessThanOrEqual((b.deterministisch && b.betragChf) as number);
    }));
  });
  it('wirkt auch vor der Bandwahl (Staffel): Band = Band von rund(x)', () => {
    const baender = [{ bisChf: 100_000, chf: 1 }, { bisChf: 500_000, chf: 2 }, { bisChf: Infinity, chf: 3 }];
    fc.assert(fc.property(rappen(100_000_000), richtung, (r, d) => {
      const mit = auswertenTarif({ typ: 'staffel_inklusiv', baender, basisRundung: { schrittChf: 1000, richtung: d } }, chfVon(r));
      const erwartet = auswertenTarif({ typ: 'staffel_inklusiv', baender }, orakel(r, 1000, d));
      expect(mit.deterministisch && mit.betragChf).toBe(erwartet.deterministisch && erwartet.betragChf);
    }));
  });
});

// ─── ergebnisRundung ─────────────────────────────────────────────────────────
describe('ergebnisRundung — Eigenschaften', () => {
  const richtung = fc.constantFrom('auf', 'ab') as fc.Arbitrary<'auf' | 'ab'>;
  const schritt = fc.constantFrom(5, 10, 50, 1000);
  const basisRegel: TarifRegel = { typ: 'sockel_prozent', prozent: 13, maxChf: 300_000 };
  it('Ergebnis ist Vielfaches des Schritts; ab ≤ roh < ab + Schritt; auf-Gegenstück; nie über (gerundetem) Deckel', () => {
    fc.assert(fc.property(rappen(10_000_000_000), schritt, richtung, (r, s, d) => {
      const x = chfVon(r);
      const roh = auswertenTarif(basisRegel, x);
      const rund = auswertenTarif({ ...basisRegel, ergebnisRundung: { schrittChf: s, richtung: d } } as TarifRegel, x);
      if (!roh.deterministisch || !rund.deterministisch) throw new Error('erwartet deterministisch');
      const q = rund.betragChf / s;
      expect(Math.abs(q - Math.round(q))).toBeLessThan(1e-9);
      if (d === 'ab') {
        expect(rund.betragChf).toBeLessThanOrEqual(roh.betragChf + 1e-9);
        expect(roh.betragChf).toBeLessThan(rund.betragChf + s);
      } else {
        expect(rund.betragChf).toBeGreaterThanOrEqual(roh.betragChf - 1e-9);
        expect(rund.betragChf).toBeLessThan(roh.betragChf + s);
      }
      if (300_000 % s === 0) expect(rund.betragChf).toBeLessThanOrEqual(300_000);
    }));
  });
  it('Nachzug A2: gerundetes Ergebnis liegt immer in [min, max] (auch wenn die Grenzen keine Vielfachen des Schritts sind)', () => {
    const mmArb = fc.tuple(fc.integer({ min: 0, max: 200_000 }), fc.integer({ min: 0, max: 200_000 })).map(([a, b]) => [Math.min(a, b) / 100, Math.max(a, b) / 100] as const);
    fc.assert(fc.property(rappen(10_000_000), mmArb, schritt, richtung, (r, [mn, mx], s, d) => {
      const reg = { typ: 'promille', promille: 3, minChf: mn, maxChf: mx, ergebnisRundung: { schrittChf: s, richtung: d } } as TarifRegel;
      const e = auswertenTarif(reg, chfVon(r));
      if (!e.deterministisch) throw new Error('erwartet deterministisch');
      expect(e.betragChf).toBeGreaterThanOrEqual(mn - 1e-9);
      expect(e.betragChf).toBeLessThanOrEqual(mx + 1e-9);
    }));
  });
  it('Monotonie bleibt erhalten', () => {
    fc.assert(fc.property(rappen(10_000_000_000), rappen(10_000_000_000), schritt, richtung, (r1, r2, s, d) => {
      const [lo, hi] = r1 <= r2 ? [r1, r2] : [r2, r1];
      const reg = { ...basisRegel, ergebnisRundung: { schrittChf: s, richtung: d } } as TarifRegel;
      const a = auswertenTarif(reg, chfVon(lo));
      const b = auswertenTarif(reg, chfVon(hi));
      expect((a.deterministisch && a.betragChf) as number).toBeLessThanOrEqual((b.deterministisch && b.betragChf) as number);
    }));
  });
  it('exakte Vielfache bleiben unverändert (kein Kippen durch Gleitkomma)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1_000_000 }), schritt, richtung, (n, s, d) => {
      const reg: TarifRegel = { typ: 'summe', teile: [{ etikett: 'A', regel: { typ: 'fix', chf: n * s - 0.1 } }, { etikett: 'B', regel: { typ: 'fix', chf: 0.1 } }], ergebnisRundung: { schrittChf: s, richtung: d } };
      const e = auswertenTarif(reg, 0);
      expect(e.deterministisch && e.betragChf).toBe(n * s);
    }));
  });
});

// ─── summe ───────────────────────────────────────────────────────────────────
describe('summe — Eigenschaften', () => {
  const teilArb = fc.oneof(
    fc.record({ typ: fc.constant('fix' as const), chf: fc.integer({ min: 0, max: 1_000_000 }).map((c) => c / 100) }),
    fc.record({ typ: fc.constant('promille' as const), promille: fc.constantFrom(0.5, 1, 1.5, 2, 4), maxChf: fc.option(fc.integer({ min: 100, max: 50_000 }), { nil: undefined }) }),
  ) as fc.Arbitrary<TarifRegel>;
  const teile = fc.array(teilArb, { minLength: 1, maxLength: 4 });
  const mitEtikett = (rs: TarifRegel[]) => rs.map((regel, i) => ({ etikett: `T${i + 1}`, regel }));
  const wert = (e: TarifErgebnis): number => (e.deterministisch ? e.betragChf : NaN);

  it('Σ-Gleichheit und Reihenfolge-Invarianz (deterministische Teile)', () => {
    fc.assert(fc.property(teile, rappen(10_000_000_000), (rs, r) => {
      const x = chfVon(r);
      const summe = auswertenTarif({ typ: 'summe', teile: mitEtikett(rs) }, x);
      const einzeln = rs.map((t) => wert(auswertenTarif(t, x)));
      const erwartet = Math.round(einzeln.reduce((a, b) => a + Math.round(b * 100), 0)) / 100;
      expect(wert(summe)).toBe(erwartet);
      const umgekehrt = auswertenTarif({ typ: 'summe', teile: mitEtikett([...rs].reverse()) }, x);
      expect(wert(umgekehrt)).toBe(wert(summe));
    }));
  });
  it('Deckel der Summe nie überschritten, Mindestbetrag nie unterschritten', () => {
    fc.assert(fc.property(teile, rappen(10_000_000_000), fc.integer({ min: 0, max: 5000 }), fc.integer({ min: 5000, max: 80_000 }), (rs, r, min, max) => {
      const e = auswertenTarif({ typ: 'summe', teile: mitEtikett(rs), minChf: min, maxChf: max }, chfVon(r));
      expect(wert(e)).toBeLessThanOrEqual(max);
      expect(wert(e)).toBeGreaterThanOrEqual(min);
    }));
  });
  it('Additivität der Spannen: von = Σ von, bis = Σ bis; Rahmen-Teil macht Spanne', () => {
    fc.assert(fc.property(
      teile,
      fc.integer({ min: 0, max: 100_000 }), fc.integer({ min: 0, max: 100_000 }),
      rappen(10_000_000_000),
      (rs, a, b, r) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        const x = chfVon(r);
        const e = auswertenTarif({ typ: 'summe', teile: [...mitEtikett(rs), { etikett: 'R', regel: { typ: 'rahmen', vonChf: lo, bisChf: hi } }] }, x);
        const basis = rs.map((t) => wert(auswertenTarif(t, x)));
        const s = Math.round(basis.reduce((acc, v) => acc + Math.round(v * 100), 0));
        expect(e.deterministisch).toBe(false);
        if (e.deterministisch) return;
        expect(e.vonChf).toBe((s + lo * 100) / 100);
        expect(e.bisChf).toBe((s + hi * 100) / 100);
        expect(e.vonChf as number).toBeLessThanOrEqual(e.bisChf as number);
      },
    ));
  });
  it('ein formel_extern-Teil ⇒ nie ein Betrag oder eine Grenze', () => {
    fc.assert(fc.property(teile, rappen(10_000_000_000), (rs, r) => {
      const e = auswertenTarif({ typ: 'summe', teile: [...mitEtikett(rs), { etikett: 'X', regel: { typ: 'formel_extern', hinweis: 'Nach Aufwand' } }] }, chfVon(r));
      expect(e.deterministisch).toBe(false);
      if (e.deterministisch) return;
      expect(e.vonChf).toBeUndefined();
      expect(e.bisChf).toBeUndefined();
      expect(e.hinweis.endsWith('.')).toBe(true);
    }));
  });
});

// ─── streitwertFaktor ────────────────────────────────────────────────────────
describe('streitwertFaktor — Eigenschaften', () => {
  const stufen = [{ ueberChf: 50_000, faktor: 2 }, { ueberChf: 100_000, faktor: 3 }, { ueberChf: 250_000, faktor: 3 }];
  const regel = (z: 'angefangen' | 'voll', hoechst?: number): TarifRegel => ({
    typ: 'rahmen', vonChf: 500, bisChf: 6000,
    streitwertFaktor: { stufen, jeWeitereChf: 250_000, plusFaktor: 1, stufenZaehlung: z, seite: 'bis', hoechstChf: hoechst },
  });
  /** Faktor-Orakel in Rappen-Ganzzahlen (exakt). */
  const faktorOrakel = (r: number, z: 'angefangen' | 'voll'): number => {
    if (r <= 5_000_000) return 1;
    if (r <= 10_000_000) return 2;
    if (r <= 25_000_000) return 3;
    const rest = r - 25_000_000;
    const n = z === 'voll' ? Math.floor(rest / 25_000_000) : Math.ceil(rest / 25_000_000);
    return 3 + n;
  };
  const zaehlung = fc.constantFrom('angefangen', 'voll') as fc.Arbitrary<'angefangen' | 'voll'>;

  it('Untergrenze konstant; Obergrenze = Grund × Faktor (Orakel), ≤ Höchstgrenze', () => {
    fc.assert(fc.property(rappen(10_000_000_000), zaehlung, fc.option(fc.integer({ min: 6000, max: 200_000 }), { nil: undefined }), (r, z, h) => {
      const e = auswertenTarif(regel(z, h), chfVon(r));
      if (e.deterministisch) throw new Error('erwartet Spanne');
      expect(e.vonChf).toBe(500);
      const roh = 6000 * faktorOrakel(r, z);
      expect(e.bisChf).toBe(h !== undefined ? Math.min(roh, h) : roh);
      if (h !== undefined) expect(e.bisChf as number).toBeLessThanOrEqual(h);
    }));
  });
  it('Obergrenze ist in x nicht fallend und nie unter dem Grundrahmen', () => {
    fc.assert(fc.property(rappen(10_000_000_000), rappen(10_000_000_000), zaehlung, (r1, r2, z) => {
      const [lo, hi] = r1 <= r2 ? [r1, r2] : [r2, r1];
      const a = auswertenTarif(regel(z), chfVon(lo));
      const b = auswertenTarif(regel(z), chfVon(hi));
      if (a.deterministisch || b.deterministisch) throw new Error('erwartet Spanne');
      expect(a.bisChf as number).toBeLessThanOrEqual(b.bisChf as number);
      expect(a.bisChf as number).toBeGreaterThanOrEqual(6000);
    }));
  });
  it('angefangen ≥ voll, Differenz höchstens eine Tranche', () => {
    fc.assert(fc.property(rappen(10_000_000_000), (r) => {
      const a = auswertenTarif(regel('angefangen'), chfVon(r));
      const v = auswertenTarif(regel('voll'), chfVon(r));
      if (a.deterministisch || v.deterministisch) throw new Error('erwartet Spanne');
      const d = (a.bisChf as number) - (v.bisChf as number);
      expect(d === 0 || d === 6000).toBe(true);
    }));
  });
});

// ─── Richtpunkt ──────────────────────────────────────────────────────────────
describe('interpolierter Richtpunkt — Eigenschaften', () => {
  const tg: TarifRegel = {
    typ: 'staffel_rahmen',
    baender: [
      { grenzeChf: 30_000, minChf: 2000, maxChf: 5000 },
      { grenzeChf: 100_000, minChf: 5000, maxChf: 10_000, interpoliert: true },
      { grenzeChf: 500_000, minChf: 10_000, maxChf: 30_000, interpoliert: true },
      { grenzeChf: 2_000_000, minChf: 30_000, maxChf: 60_000, interpoliert: true },
      { grenzeChf: Infinity, minChf: 60_000, maxChf: 120_000 },
    ],
  };
  const imRahmen = (e: TarifErgebnis) => {
    if (e.deterministisch) throw new Error('erwartet Spanne');
    return e;
  };
  it('von ≤ Richtpunkt ≤ bis in jedem interpolierten Band', () => {
    fc.assert(fc.property(fc.integer({ min: 3_000_001, max: 200_000_000 }), (r) => {
      const e = imRahmen(auswertenTarif(tg, chfVon(r)));
      expect(typeof e.richtpunktChf).toBe('number');
      expect(e.richtpunktChf as number).toBeGreaterThanOrEqual(e.vonChf as number);
      expect(e.richtpunktChf as number).toBeLessThanOrEqual(e.bisChf as number);
    }));
  });
  it('monoton in x und stetig über Bandgrenzen (max_i == min_{i+1})', () => {
    fc.assert(fc.property(fc.integer({ min: 3_000_001, max: 200_000_000 }), fc.integer({ min: 3_000_001, max: 200_000_000 }), (r1, r2) => {
      const [lo, hi] = r1 <= r2 ? [r1, r2] : [r2, r1];
      expect(imRahmen(auswertenTarif(tg, chfVon(lo))).richtpunktChf as number)
        .toBeLessThanOrEqual(imRahmen(auswertenTarif(tg, chfVon(hi))).richtpunktChf as number);
    }));
    for (const g of [100_000, 500_000]) {
      const unten = imRahmen(auswertenTarif(tg, g)).richtpunktChf as number;
      const oben = imRahmen(auswertenTarif(tg, g + 0.01)).richtpunktChf as number;
      expect(oben - unten).toBeGreaterThanOrEqual(0);
      expect(oben - unten).toBeLessThan(0.1);
    }
  });
  it('an der oberen Bandgrenze = Obergrenze', () => {
    expect(imRahmen(auswertenTarif(tg, 100_000)).richtpunktChf).toBe(10_000);
    expect(imRahmen(auswertenTarif(tg, 2_000_000)).richtpunktChf).toBe(60_000);
  });
});
