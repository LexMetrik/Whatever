// ─── RL-28 Teil 1: Grundpfand-Posten Deutschschweiz = Beurkundung + Eintrag ──
// Prüfwerte sind aus den amtlichen Erlassen von Hand gerechnet (Stand 15.10.2026,
// Quellen in src/data/tarif/grundpfand.ts), nicht aus dem Code abgeleitet (RV-19).
import { describe, expect, it } from 'vitest';
import { berechneNotariatGrundbuch, ngPostenText, type NgPosten } from '../lib/notariatGrundbuch';
import { berechneBeurkundung } from '../lib/beurkundung';
import { auswertenTarif, type TarifRegel, type TarifErgebnis } from '../lib/tarif/staffel';
import { KANTONE, type KantonCode, type KantonalerTarif } from '../data/tarif/typen';
import { GRUNDPFAND } from '../data/tarif/grundpfand';
import { NOTARIAT, GRUNDBUCH, HANDAENDERUNGSSTEUER } from '../data/tarif/notariat-grundbuch';
import { SONDERTARIFE } from '../data/tarif/beurkundung';
import { GRUNDBUCH_EINTRAG } from '../data/tarif/grundbuch';

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
    expect(ngPostenText(pfand('AG', 1_000_000))).toBe("CHF 3'633");
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

// ─── Datenprüfung (Auflagen B1/B2 der RL-27-Gegenprüfung) ───────────────────
// B1: `ergebnisRundung` nur auf Regeln, die für ALLE Bemessungswerte ein
//     deterministisches Ergebnis liefern (sonst wirft die Auswertung je nach Eingabe).
// B2: wo `ergebnisRundung` gesetzt ist, sind Mindest- und Höchstbeträge Vielfache
//     des Schritts (sonst widerspricht die Klammer nach dem Runden der Rundung).
// Zusätzlich: jede Rundungsangabe ist gültig (Schritt > 0, endlich).

type RundungRegel = TarifRegel & { basisRundung?: { schrittChf: number; richtung: string }; ergebnisRundung?: { schrittChf: number; richtung: string } };

function* alleRegeln(r: TarifRegel): Generator<TarifRegel> {
  yield r;
  if (r.typ === 'summe') for (const t of r.teile) yield* alleRegeln(t.regel);
}

/** true = die Regel liefert für jeden Bemessungswert ≥ 0 ein deterministisches Ergebnis. */
export const immerDeterministisch = (r: TarifRegel): boolean => {
  switch (r.typ) {
    case 'fix': case 'promille': case 'sockel_prozent': case 'staffel_inklusiv': case 'staffel_exklusiv': case 'staffel_voll_prozent':
      return true;
    case 'staffel_sockel_prozent':
      return r.aufschlagBisChf === undefined && !r.baender.some((b) => b.unterAbRahmen);
    case 'summe':
      return r.teile.every((x) => immerDeterministisch(x.regel));
    default:
      return false; // rahmen, staffel_rahmen, formel_extern
  }
};

/** Alle Mindest-/Höchstbeträge, die nach dem Runden erneut klammern (Regel- und Bandebene). */
const grenzen = (r: TarifRegel): number[] => {
  const out: number[] = [];
  const nimm = (...xs: Array<number | null | undefined>) => { for (const x of xs) if (typeof x === 'number') out.push(x); };
  switch (r.typ) {
    case 'promille': case 'sockel_prozent': nimm(r.minChf, r.maxChf); break;
    case 'staffel_sockel_prozent': for (const b of r.baender) nimm(b.minChf, b.maxChf); break;
    case 'staffel_voll_prozent': for (const b of r.baender) nimm(b.minChf, b.maxChf); break;
    case 'summe': nimm(r.minChf, r.maxChf); break;
    default: break;
  }
  return out;
};

const istVielfaches = (x: number, schritt: number): boolean => Math.abs(x / schritt - Math.round(x / schritt)) < 1e-9;

/** Liefert die Verstösse gegen B1/B2 und die Gültigkeit der Rundungsangaben (leer = in Ordnung). */
export const pruefeRundungsDaten = (regel: TarifRegel, name: string): string[] => {
  const fehler: string[] = [];
  for (const r of alleRegeln(regel) as Iterable<RundungRegel>) {
    for (const feld of ['basisRundung', 'ergebnisRundung'] as const) {
      const rd = r[feld];
      if (!rd) continue;
      if (!Number.isFinite(rd.schrittChf) || rd.schrittChf <= 0) fehler.push(`${name}: ${feld}.schrittChf ungültig (${rd.schrittChf})`);
      if (!['auf', 'ab', 'naechste'].includes(rd.richtung)) fehler.push(`${name}: ${feld}.richtung ungültig (${rd.richtung})`);
    }
    if (r.ergebnisRundung) {
      if (!immerDeterministisch(r)) fehler.push(`${name}: ergebnisRundung auf Regel «${r.typ}», die nicht für alle Werte deterministisch ist (B1)`);
      for (const g of grenzen(r)) {
        if (!istVielfaches(g, r.ergebnisRundung.schrittChf)) fehler.push(`${name}: Grenze ${g} ist kein Vielfaches von ${r.ergebnisRundung.schrittChf} (B2)`);
      }
    }
  }
  return fehler;
};

const alleTarife = (): Array<[string, KantonalerTarif]> => {
  const out: Array<[string, KantonalerTarif]> = [];
  const tabelle = (name: string, t: Partial<Record<KantonCode, KantonalerTarif>> | undefined) => {
    for (const [k, v] of Object.entries(t ?? {})) if (v) out.push([`${name}.${k}`, v]);
  };
  tabelle('NOTARIAT', NOTARIAT); tabelle('GRUNDBUCH', GRUNDBUCH); tabelle('HANDAENDERUNGSSTEUER', HANDAENDERUNGSSTEUER);
  tabelle('GRUNDPFAND', GRUNDPFAND);
  for (const [art, t] of Object.entries(SONDERTARIFE)) tabelle(`SONDERTARIFE.${art}`, t);
  for (const [art, t] of Object.entries(GRUNDBUCH_EINTRAG)) tabelle(`GRUNDBUCH_EINTRAG.${art}`, t);
  return out;
};

describe('RL-28 Datenprüfung Rundungsangaben (B1/B2)', () => {
  it('Tor kann scheitern: der Prüfer meldet synthetische Verstösse (§6.7)', () => {
    const rahmen: TarifRegel = { typ: 'summe', teile: [{ etikett: 'a', regel: { typ: 'rahmen', vonChf: 1, bisChf: 2 } }], ergebnisRundung: { schrittChf: 10, richtung: 'ab' } };
    expect(pruefeRundungsDaten(rahmen, 'x').some((f) => f.includes('B1'))).toBe(true);
    const unterRahmen: TarifRegel = { typ: 'staffel_sockel_prozent', baender: [{ bisChf: Infinity, sockelChf: 500, abChf: 100000, prozent: 0.1, unterAbRahmen: true, minChf: 100 }], ergebnisRundung: { schrittChf: 10, richtung: 'auf' } };
    expect(pruefeRundungsDaten(unterRahmen, 'x').some((f) => f.includes('B1'))).toBe(true);
    const aufschlag: TarifRegel = { typ: 'staffel_sockel_prozent', aufschlagBisChf: 100, baender: [{ bisChf: Infinity, sockelChf: 0, abChf: 0, prozent: 1 }], ergebnisRundung: { schrittChf: 10, richtung: 'auf' } };
    expect(pruefeRundungsDaten(aufschlag, 'x').some((f) => f.includes('B1'))).toBe(true);
    const schief: TarifRegel = { typ: 'promille', promille: 1, minChf: 75, maxChf: 1005, ergebnisRundung: { schrittChf: 10, richtung: 'ab' } };
    expect(pruefeRundungsDaten(schief, 'x').filter((f) => f.includes('B2')).length).toBe(2);
    const schrittNull: TarifRegel = { typ: 'promille', promille: 1, basisRundung: { schrittChf: 0, richtung: 'auf' } };
    expect(pruefeRundungsDaten(schrittNull, 'x').length).toBe(1);
    const gut: TarifRegel = { typ: 'promille', promille: 1, minChf: 100, maxChf: 1000, ergebnisRundung: { schrittChf: 10, richtung: 'naechste' }, basisRundung: { schrittChf: 1000, richtung: 'auf' } };
    expect(pruefeRundungsDaten(gut, 'x')).toEqual([]);
  });

  it('alle Tarif-Tabellen der Notariats-/Grundbuchdaten: Rundungsangaben gültig, B1 und B2 eingehalten', () => {
    const tarife = alleTarife();
    expect(tarife.length).toBeGreaterThan(200);
    const fehler = tarife.flatMap(([name, t]) => pruefeRundungsDaten(t.regel, name));
    expect(fehler).toEqual([]);
  });

  it('die in RL-28 gesetzten Rundungen sind vorhanden: BS aufwärts 1’000, AG nächste 1’000 (nur Eintragsteil)', () => {
    const rund = (k: KantonCode) => (GRUNDBUCH_EINTRAG.grundpfand?.[k]?.regel as RundungRegel).basisRundung;
    expect(rund('BS')).toEqual({ schrittChf: 1000, richtung: 'auf' });
    expect(rund('AG')).toEqual({ schrittChf: 1000, richtung: 'naechste' });
  });

  it('alle 26 Kantone: Grundpfand-Posten ausgewertet über ein Raster ohne Wurf, nie negativ', () => {
    const raster = [0, 1, 999, 1000, 1500, 12_345, 100_000, 599_999, 600_000, 1_234_500, 3_000_001, 10_000_000, 99_999_999];
    for (const k of KANTONE) {
      const t = GRUNDPFAND[k];
      expect(t, k).toBeDefined();
      expect(t.quelleUrl.startsWith('https://') || t.regel.typ === 'formel_extern', k).toBe(true);
      expect(t.verifiziert).not.toBe('geprüft' as never);
      for (const w of raster) {
        const e: TarifErgebnis = auswertenTarif(t.regel, w);
        if (e.deterministisch) expect(e.betragChf, `${k} ${w}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('Monotonie: der Grundpfand-Posten sinkt nirgends mit wachsender Pfandsumme (Deutschschweiz, Raster)', () => {
    const ks: KantonCode[] = ['AG', 'BS', 'LU', 'OW', 'NW', 'GL', 'SH', 'TG', 'GR', 'ZH', 'SG', 'UR', 'SZ'];
    for (const k of ks) {
      let vorher = -1;
      for (let w = 0; w <= 25_000_000; w += w < 3_000_000 ? 12_500 : 250_000) {
        const e = auswertenTarif(GRUNDPFAND[k].regel, w);
        if (!e.deterministisch) throw new Error(`${k} ${w}: nicht beziffert`);
        expect(e.betragChf, `${k} ${w}`).toBeGreaterThanOrEqual(vorher - 1e-9);
        vorher = e.betragChf;
      }
    }
  });
});
