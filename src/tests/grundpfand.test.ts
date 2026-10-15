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
    ['AG', 100_000, 416.67, 'N 266.67 (⅔ × 4 ‰, über Minimum 200) + G 150 (Nachzug A1: vorher Minimum 300 → 450)'],
    ['AG', 50_000, 300, 'Randfall Minimum N 200 (⅔ von 300; Lesart) + G 100 (Minimum Eintrag; 75 → 100)'],
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
    ['SZ', 30_000, 45, 'angefangene Tranche zählt voll (§ 5 Abs. 1 Nr. 2: je Fr. 50’000 bzw. Bruchteile davon)'],
    ['SZ', 1_010_000, 945, '21 Tranchen × 45 (1’010’000 → 1’050’000)'],
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

  it('die in RL-28 gesetzten Rundungen der Pfandsumme liegen im Eintragsteil: BS aufwärts 1’000, AG nächste 1’000', () => {
    const teil = (k: KantonCode, etikett: string) => {
      const r = GRUNDPFAND[k].regel;
      if (r.typ !== 'summe') throw new Error(`${k}: keine Summe`);
      return (r.teile.find((x) => x.etikett === etikett)?.regel as RundungRegel).basisRundung;
    };
    expect(teil('BS', 'Grundbucheintrag')).toEqual({ schrittChf: 1000, richtung: 'auf' });
    expect(teil('AG', 'Grundbucheintrag')).toEqual({ schrittChf: 1000, richtung: 'naechste' });
    // der Notariatsteil wird nicht gerundet (die Rundungsnormen stehen in den Grundbucherlassen)
    expect(teil('BS', 'Beurkundung')).toBeUndefined();
    expect(teil('AG', 'Beurkundung')).toBeUndefined();
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

  it('eine Quelle (§5): grundpfand.ts hat genau 26 Schlüssel; jeder Teil-1-Kanton trägt eine summe-Regel (ausser UR, SZ)', () => {
    expect(Object.keys(GRUNDPFAND).sort()).toEqual([...KANTONE].sort());
    expect(Object.keys(GRUNDPFAND).length).toBe(26);
    for (const k of ['AG', 'BS', 'LU', 'OW', 'NW', 'GL', 'SH', 'TG', 'GR', 'ZH', 'SG'] as KantonCode[]) {
      expect(GRUNDPFAND[k].regel.typ, k).toBe('summe');
    }
    expect(GRUNDPFAND.UR.regel.typ).not.toBe('summe');
    expect(GRUNDPFAND.SZ.regel.typ).not.toBe('summe');
  });
});

// ─── RL-28 Teil 2: Grundpfand Romandie und Tessin = Beurkundung + Eintrag ────
// Prüfwerte von Hand aus den am 15.10.2026 geöffneten amtlichen Erlassen
// gerechnet (Quellen und Artikel in grundpfand.ts), nicht aus dem Code abgeleitet.
describe('RL-28 Teil 2 Grundpfand Romandie/TI — Beurkundung + Eintrag (RV-19)', () => {
  const faelle: Array<[KantonCode, number, number, string]> = [
    // FR: Tarif notaires RSF 261.16 Art. 4 ch. 3 + Tarif émoluments fixes RF RSF 214.5.16 Art. 2 ch. 11 lit. a (fix 100)
    ['FR', 100_000, 550, 'N 100 + 225 + 125 = 450, G 100'],
    ['FR', 1_000_000, 2600, 'N 2500 + G 100'],
    ['FR', 10_000_000, 9100, 'N 9000 + G 100'],
    // GE: REmNot RSG E 6 05.03 Art. 16 al. 1 + REmORFDIT RSG E 1 50.06 Art. 4 (0,085 %, max 20’000)
    ['GE', 100_000, 585, 'N 500 + G 85'],
    ['GE', 1_000_000, 4550, 'N 3700 + G 850'],
    ['GE', 10_000_000, 26200, 'N 17700 + G 8500 (Deckel 20’000 greift erst ab 23,53 Mio.)'],
    // VS: Tarif notaires RS 178.104 Art. 13 al. 2 + OcRF RS 211.611 Art. 32 al. 2 lit. c, al. 3 (Basis auf 1000 aufgerundet)
    ['VS', 100_000, 750, 'N 650 + G 100'],
    ['VS', 1_000_000, 3950, 'N 2950 + G 1000'],
    ['VS', 1_000_001, 3951, 'G auf Basis 1’001’000 = 1001, N 2950 (1 ‰ von 1 Franken = 0.001)'],
    ['VS', 10_000_000, 14450, 'N 11950 + G 2500 (Deckel Art. 32 al. 2 lit. c)'],
    // VD: TNo BLV 178.11.2 Art. 20 al. 3 + LRF BLV 211.61 Art. 28 (1,5 ‰, 100–20’000)
    ['VD', 100_000, 650, 'N 500 + G 150'],
    ['VD', 1_000_000, 4175, 'N 2675 + G 1500'],
    ['VD', 50_000_000, 35425, 'N 15425 + G 20000 (Deckel)'],
    // NE: Tarif notaires RSN 166.31 Ziff. 44 (Pauschalstufen) + LERF RSN 215.411.6 Art. 10 (2 ‰ bis 2 Mio, 1,5 ‰ darüber, min 50)
    ['NE', 100_000, 700, 'N 500 + G 200 (Stufe «jusqu’à 100.000» gehört noch zur ersten Stufe)'],
    ['NE', 100_001, 900.0, 'N 700 (Stufe 100.001–200.000) + G 200.002 → 200'],
    ['NE', 1_000_000, 4300, 'N 2300 + G 2000'],
    ['NE', 1_000_001, 4500, 'N 2500 (Stufe 1.000.001–1.100.000) + G 2000'],
    ['NE', 1_300_000, 5500, 'N 2900 + G 2600'],
    ['NE', 3_000_000, 10100, 'N 4600 + G 4000 + 1500'],
    ['NE', 10_000_000, 20700, 'N 4700 (ab 3.000.001) + G 4000 + 12000'],
    // TI: LTN RL 952.300 Art. 6 (Lesart A: voller Satz bis 100’000, halbe Sätze auf dem Mehrbetrag) + LTORF RL 216.200 Art. 25 (7 ‰)
    ['TI', 1_000_000, 9187.5, 'N 2187.50 + G 7000'],
    ['TI', 400_000, 3975, 'N 1175 + G 2800 (kein Minimum 30 im Eintragsteil)'],
    ['TI', 10_000, 570, 'N 500 (Minimum Art. 5) + G 70: LTORF Art. 25 kennt kein Minimum'],
    ['TI', 10_000_000, 78937.5, 'N 8937.50 + G 70000'],
    // JU: Décret notaires RSJU 189.61 Art. 10 + Décret RF RSJU 176.331 Art. 7 (1 ‰ in Franken, 40–10’000 Punkte à 1.05) + Art. 8 Ziff. 4 lit. a (70 Punkte)
    ['JU', 100_000, 673.5, 'N 500 + G 100 + Forfait 73.50'],
    ['JU', 1_000_000, 3873.5, 'N 2800 + G 1000 + Forfait 73.50'],
    ['JU', 10_000_000, 21873.5, 'N 11800 + G 10000 (1 ‰ = 10’000, unter dem Maximum 10’500) + Forfait 73.50'],
  ];
  for (const [k, summe, soll, was] of faelle) {
    it(`${k} Pfandsumme ${summe.toLocaleString('de-CH')} = ${soll} (${was})`, () => {
      expect(betrag(k, summe)).toBeCloseTo(soll, 2);
    });
  }

  it('NE: Stufen aus Ziff. 44 — Tippfehler «1.000.101» im Quelltext gelesen als 1.100.001 (Stufe 2.700 bis 1.200.000)', () => {
    // 1.100.001–1.200.000 = 2.700; 1.200.001–1.300.000 = 2.900; 1.300.001–1.400.000 = 3.000
    const n = (w: number) => {
      const e = auswertenTarif(SONDERTARIFE.schuldbrief!.NE!.regel, w);
      if (!e.deterministisch) throw new Error('nicht beziffert');
      return e.betragChf;
    };
    expect(n(1_100_000)).toBe(2500);
    expect(n(1_100_001)).toBe(2700);
    expect(n(1_200_000)).toBe(2700);
    expect(n(1_200_001)).toBe(2900);
    expect(n(1_300_000)).toBe(2900);
    expect(n(1_300_001)).toBe(3000);
    expect(n(3_000_000)).toBe(4600);
    expect(n(3_000_001)).toBe(4700);
    expect(SONDERTARIFE.schuldbrief!.NE!.regel.typ).toBe('staffel_inklusiv');
  });

  it('TI: Sockel der Notariatsstaffel exakt (…,50 statt gerundet), Lesart A im Hinweis mit Lesart B offengelegt', () => {
    const t = SONDERTARIFE.schuldbrief!.TI!;
    if (t.regel.typ !== 'staffel_sockel_prozent') throw new Error('unerwarteter Regeltyp');
    const sockel = t.regel.baender.map((b) => b.sockelChf);
    expect(sockel).toEqual([0, 500, 875, 1375, 1812.5, 2187.5, 3437.5, 6437.5, 8937.5, 18937.5]);
    expect(t.hinweis).toMatch(/Lesart B/);
    expect(t.hinweis).toMatch(/1’937\.50|1’937,50|1'937\.50/);
  });

  it('TI: der Eintragsteil hat kein Minimum von 30 (LTORF Art. 20 ist eine Fixgebühr für andere Vorgänge)', () => {
    const g = GRUNDBUCH_EINTRAG.grundpfand!.TI!;
    expect(g.regel).toEqual({ typ: 'promille', promille: 7 });
    expect(g.hinweis).toMatch(/Art\. 20/);
  });

  it('VS: Eintragsteil rundet die Pfandsumme auf volle 1’000 auf (OcRF Art. 32 al. 3); Hinweis ohne «2,5 ‰ max. 3’000»', () => {
    const g = GRUNDBUCH_EINTRAG.grundpfand!.VS!;
    expect(g.regel).toEqual({ typ: 'promille', promille: 1, minChf: 100, maxChf: 2500, basisRundung: { schrittChf: 1000, richtung: 'auf' } });
    expect(g.hinweis ?? '').not.toMatch(/3['’]000/);
  });

  it('JU: ‰-Satz in Franken (1 ‰), nur Minimum/Maximum in Punkten (40/10’000 × 1.05)', () => {
    expect(GRUNDBUCH_EINTRAG.grundpfand!.JU!.regel).toEqual({ typ: 'promille', promille: 1, minChf: 42, maxChf: 10500 });
    expect(GRUNDBUCH_EINTRAG.grundpfand!.JU!.hinweis).toMatch(/Lesart/);
  });

  it('GE: Artikel-Feld «Art. 4» (nicht «Art. 4 al. 6»); VD: URL der Fassung 1.3.2016 (lexfind 210344)', () => {
    expect(GRUNDBUCH_EINTRAG.grundpfand!.GE!.artikel).not.toMatch(/al\. 6/);
    expect(SONDERTARIFE.schuldbrief!.VD!.quelleUrl).toBe('https://www.lexfind.ch/tolv/210344/fr');
  });

  it('Hinweise der Posten FR, GE, VS, VD, JU verweisen auf den separaten Posten Pfandsteuer', () => {
    for (const k of ['FR', 'GE', 'VS', 'VD', 'JU'] as KantonCode[]) {
      expect(GRUNDPFAND[k].hinweis, k).toMatch(/Pfandsteuer .*separat/);
    }
    expect(GRUNDPFAND.VD.hinweis).not.toMatch(/vom droit de mutation ausgenommen/);
  });

  it('Romandie/TI: summe-Regel mit Beurkundung und Grundbucheintrag; Stand-Felder in Tagesform', () => {
    for (const k of ['FR', 'GE', 'VS', 'VD', 'NE', 'TI', 'JU'] as KantonCode[]) {
      expect(GRUNDPFAND[k].regel.typ, k).toBe('summe');
      expect(GRUNDPFAND[k].stand, k).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
      expect(GRUNDPFAND[k].stand, k).not.toMatch(/\d{4}\/\d{4}/);
    }
    for (const k of ['BE', 'ZG', 'SO', 'BL', 'AR', 'AI'] as KantonCode[]) {
      expect(GRUNDPFAND[k].stand, k).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
      expect(GRUNDPFAND[k].stand, k).not.toMatch(/\d{4}\/\d{4}/);
    }
  });

  it('Monotonie: Romandie/TI sinken nirgends mit wachsender Pfandsumme (Raster; NE-Stufen, VS-Aufrundung)', () => {
    for (const k of ['FR', 'GE', 'VS', 'VD', 'NE', 'TI', 'JU'] as KantonCode[]) {
      let vorher = -1;
      for (let w = 0; w <= 25_000_000; w += w < 3_500_000 ? 12_500 : 250_000) {
        const e = auswertenTarif(GRUNDPFAND[k].regel, w);
        if (!e.deterministisch) throw new Error(`${k} ${w}: nicht beziffert`);
        expect(e.betragChf, `${k} ${w}`).toBeGreaterThanOrEqual(vorher - 1e-9);
        vorher = e.betragChf;
      }
    }
  });
});
