// ─── Weitere Transaktionskosten (MwSt · HReg · Emissionsabgabe) ─────────────
import { describe, expect, it } from 'vitest';
import { emissionsabgabe, mwstAufschlag, weitereKosten } from '../lib/beurkundungZusatzkosten';
import { MWST_BEHANDLUNG } from '../data/tarif/mwst-notariat';
import { KANTONE } from '../lib/kantone';
import type { KantonCode } from '../data/tarif/typen';

// Bug-Audit 19.6.2026 (H6): Art. 6 Abs. 1 lit. h StG normiert einen FREIBETRAG
// (kein Freigrenze): die Beteiligungsrechte sind befreit, «soweit die Leistungen
// … 1 Million Franken nicht übersteigen» — nur der ÜBERSTEIGENDE Teil ist mit 1 %
// steuerbar (gefestigte ESTV-Praxis; deckungsgleich mit gruendungsunterlagen.ts).
// Zuvor zementierte dieser Test fälschlich eine Freigrenze (ganzer Betrag).
describe('Emissionsabgabe (StG Art. 6/8) — Freibetrag CHF 1 Mio', () => {
  it('bis und mit CHF 1 Mio abgabefrei; darüber nur der ÜBERSTEIGENDE Teil × 1 %', () => {
    expect(emissionsabgabe(1_000_000)).toBe(0);        // Freibetrag exakt ausgeschöpft
    expect(emissionsabgabe(999_999)).toBe(0);
    expect(emissionsabgabe(1_000_001)).toBe(0);        // Überschuss 1 → gerundet 0
    expect(emissionsabgabe(1_500_000)).toBe(5_000);    // 500'000 × 1 %
    expect(emissionsabgabe(2_000_000)).toBe(10_000);   // 1'000'000 × 1 %
    expect(emissionsabgabe(0)).toBe(0);
  });
});

describe('MwSt-Aufschlag', () => {
  it('8,1 % der Gebühr, auf Rappen (B2-13: keine Rundungsnorm gefunden, kaufmännisch)', () => {
    expect(mwstAufschlag(1_000)).toBe(81);
    expect(mwstAufschlag(10_000)).toBe(810);
    expect(mwstAufschlag(2_500)).toBe(202.5); // vorher 203 (ganze Franken)
    expect(mwstAufschlag(500)).toBe(40.5);
    expect(mwstAufschlag(41)).toBe(3.32);
  });
});

// RL-33 / RV-24: MWSTG SR 641.20 Art. 25 Abs. 1 (8,1 %) + MWSTV SR 641.201 Art. 14 Ziff. 13
// («Tätigkeiten von Amtsnotaren» unternehmerisch/steuerbar) → Amts- UND freie Notare rechnen
// MWST; das Kriterium «freies Notariat» ist falsch. Massgeblich ist die Klausel im Kantonstarif
// bzw. mangels Klausel das Bundesrecht (W-16 a). Teständerungen: W-05 (a), je Stelle mit Norm.
const mwstPosten = (r: ReturnType<typeof weitereKosten>) => r.posten.find((p) => p.label.startsWith('MwSt'));

describe('weitereKosten — MWST nach Kantonstarif/Bundesrecht', () => {
  it('ZH AG-Gründung (Gebühr 500): MwSt 40.50 zusätzlich (NotGebV § 2; vorher kein Posten)', () => {
    const r = weitereKosten('ag_gruendung', 'ZH', 500_000, { vonChf: 500, bisChf: 500 });
    expect(r.mwst.art).toBe('zusaetzlich');
    expect(r.mwst.grundlage).toBe('tarif');
    expect(mwstPosten(r)?.label).toBe('MwSt 8.1 %');
    expect(mwstPosten(r)?.von).toBe(40.5);
    expect(mwstPosten(r)?.bis).toBe(40.5);
    expect(r.posten.find((p) => p.label.includes('Handelsregister'))?.von).toBe(420);
    expect(r.posten.find((p) => p.label.includes('Emissionsabgabe'))?.von).toBe(0);
  });

  it('ZH AG-Gründung 2 Mio.: MwSt 81 zusätzlich neben HReg und Emissionsabgabe', () => {
    const r = weitereKosten('ag_gruendung', 'ZH', 2_000_000, { vonChf: 1000, bisChf: 1000 });
    expect(mwstPosten(r)?.von).toBe(81);
    expect(r.posten.find((p) => p.label.includes('Emissionsabgabe'))?.von).toBe(10_000);
  });

  it('ZH Testament: Spanne 200–4000 → 16.20–324.00; Test-Eingabe 200–5000 → 16.20–405.00', () => {
    const a = weitereKosten('testament', 'ZH', undefined, { vonChf: 200, bisChf: 4000 });
    expect([mwstPosten(a)?.von, mwstPosten(a)?.bis]).toEqual([16.2, 324]);
    const b = weitereKosten('testament', 'ZH', undefined, { vonChf: 200, bisChf: 5000 });
    expect([mwstPosten(b)?.von, mwstPosten(b)?.bis]).toEqual([16.2, 405]);
  });

  it('ZH Vollmacht (Beglaubigung Ziff. 4.5.1): MwSt inbegriffen laut DA FD 22.11.2023 § 2 → kein Posten, Hinweis', () => {
    const r = weitereKosten('vollmacht', 'ZH', undefined, { vonChf: 20, bisChf: 250 });
    expect(mwstPosten(r)).toBeUndefined();
    expect(r.mwstHinweis).toMatch(/inbegriffen/);
    expect(r.mwstHinweis).toMatch(/Dienstanweisung/);
  });

  it('ZH Bürgschaft (Ziff. 4.4.1): bis Gebühr Fr. 199 inbegriffen, darüber zusätzlich → Spanne 0–40.50, offengelegt', () => {
    const r = weitereKosten('buergschaft', 'ZH', undefined, { vonChf: 100, bisChf: 500 });
    expect([mwstPosten(r)?.von, mwstPosten(r)?.bis]).toEqual([0, 40.5]);
    expect(mwstPosten(r)?.hinweis).toMatch(/199/);
  });

  it('ZG: MwSt in den Tarifansätzen inbegriffen (Ziff. 109bis BGS 641.1) → kein Posten, Grund im Hinweis', () => {
    const r = weitereKosten('ag_gruendung', 'ZG', 500_000, { vonChf: 1000, bisChf: 1000 });
    expect(r.mwst.art).toBe('inbegriffen');
    expect(mwstPosten(r)).toBeUndefined();
    expect(r.mwstHinweis).toMatch(/109bis/);
  });

  it('GE AG-Gründung (Gebühr 2000): 162.00, Grundlage Bundesrecht (Tarif schweigt, W-16 a)', () => {
    const r = weitereKosten('ag_gruendung', 'GE', 500_000, { vonChf: 2000, bisChf: 2000 });
    expect(r.mwst.grundlage).toBe('bundesrecht');
    expect(mwstPosten(r)?.von).toBe(162);
    expect(mwstPosten(r)?.hinweis).toMatch(/Umsatz/);
    expect(r.posten.find((p) => p.label.includes('Handelsregister'))?.von).toBe(420);
    expect(r.posten.find((p) => p.label.includes('Emissionsabgabe'))?.von).toBe(0);
  });

  it('OW Testament 500–1000 → 40.50–81.00 (Art. 6 Abs. 2: Anspruch auf MwSt; Rappen statt 41)', () => {
    const ow = weitereKosten('testament', 'OW', undefined, { vonChf: 500, bisChf: 1000 });
    expect(ow.posten.map((p) => p.label)).toEqual(['MwSt 8.1 %']);
    expect([ow.posten[0].von, ow.posten[0].bis]).toEqual([40.5, 81]);
  });

  it('Gebühr 2500 → 202.50 (B2-13)', () => {
    const r = weitereKosten('schenkung', 'SZ', undefined, { vonChf: 2500, bisChf: 2500 });
    expect(mwstPosten(r)?.von).toBe(202.5);
  });

  it('BS/VD/JU: Tarif schweigt, Betrag wie bisher (Bundesrecht), Zuordnung als offen vermerkt', () => {
    for (const k of ['BS', 'VD', 'JU'] as const) {
      const r = weitereKosten('testament', k, undefined, { vonChf: 500, bisChf: 1000 });
      expect(r.mwst.grundlage).toBe('bundesrecht');
      expect(mwstPosten(r)?.von).toBe(40.5);
      expect(r.mwst.vermerk).toMatch(/offen/);
    }
  });

  it('UR (offen) und fehlende Gebühr: kein Scheinbetrag', () => {
    expect(mwstPosten(weitereKosten('testament', 'UR', undefined, { vonChf: 500, bisChf: 1000 }))).toBeUndefined();
    expect(weitereKosten('testament', 'UR', undefined, null).mwst.art).toBe('offen');
    expect(mwstPosten(weitereKosten('testament', 'ZH', undefined, null))).toBeUndefined();
  });

  it('Fusion: HReg 420 (übernehmende) + 80 Löschung je übertragende Gesellschaft (GebV-HReg Anh. Ziff. 2.1, B2-12)', () => {
    const r = weitereKosten('fusion', 'ZH', undefined, null);
    const h = r.posten.filter((p) => p.label.includes('Handelsregister'));
    expect(h.map((p) => p.von)).toEqual([420, 80]);
    expect(h[1].label).toMatch(/Löschung/);
    expect(h[1].hinweis).toMatch(/je übertragende/);
  });
});

describe('MWST_BEHANDLUNG — Tabelle', () => {
  it('26 Kantone, jede Zeile mit Erlass, Artikel, Stand und Quelle-URL', () => {
    expect(Object.keys(MWST_BEHANDLUNG).sort()).toEqual([...KANTONE].sort());
    for (const k of KANTONE) {
      const z = MWST_BEHANDLUNG[k];
      expect(z.erlassName.length, k).toBeGreaterThan(3);
      expect(z.erlassNr.length, k).toBeGreaterThan(1);
      expect(z.artikel.length, k).toBeGreaterThan(1);
      expect(z.stand.length, k).toBeGreaterThan(3);
      expect(z.quelleUrl, k).toMatch(/^https:\/\//);
    }
  });

  it('Zuordnung: Tarifklausel / Bundesrecht (W-16 a) / inbegriffen / offen', () => {
    const wo = (f: (z: (typeof MWST_BEHANDLUNG)[KantonCode]) => boolean) => KANTONE.filter((k) => f(MWST_BEHANDLUNG[k])).sort();
    expect(wo((z) => z.art === 'zusaetzlich' && z.grundlage === 'tarif'))
      .toEqual(['ZH', 'BE', 'LU', 'SZ', 'OW', 'NW', 'GL', 'BL', 'AR', 'SG', 'GR', 'AG', 'VS', 'NE'].sort());
    expect(wo((z) => z.art === 'zusaetzlich' && z.grundlage === 'bundesrecht'))
      .toEqual(['FR', 'GE', 'TI', 'SO', 'SH', 'AI', 'BS', 'VD', 'JU', 'TG'].sort());
    expect(wo((z) => z.art === 'inbegriffen')).toEqual(['ZG']);
    expect(wo((z) => z.art === 'offen')).toEqual(['UR']);
  });
});

describe('Pfandrechtssteuer (Schuldbrief) — kantonale Sätze und Freigrenze', () => {
  const pfand = (k: 'VD' | 'FR', wert: number) =>
    weitereKosten('schuldbrief', k, wert, null).posten.find((p) => p.label.startsWith('Pfandrechtssteuer'));

  it('VD: Freigrenze ≤ CHF 5 000 steuerbefreit (LTim Art. 3 al. 3), darüber 2 ‰', () => {
    expect(pfand('VD', 3_000)?.von).toBe(0);     // unter Freigrenze
    expect(pfand('VD', 5_000)?.von).toBe(0);     // exakt Freigrenze: bis UND mit → befreit
    expect(pfand('VD', 5_001)?.von).toBe(10);    // knapp darüber: 5001 × 0,2 % = 10
    expect(pfand('VD', 500_000)?.von).toBe(1_000);
  });

  it('FR: keine Freigrenze — Satz greift ab dem ersten Franken', () => {
    expect(pfand('FR', 3_000)?.von).toBe(23);    // 3000 × 0,75 % = 22,5 → 23
  });
});

// ─── RL-28 Teil 3: Pfandsteuer GE (110 % Zuschlag) und VS (Fixband) ─────────
// Prüfwerte von Hand aus den am 15.10.2026 geöffneten Erlassen:
//  GE: LDE RSG D 3 30 Art. 84/85 (0,65 %) + LCACant RSG D 3 07 Art. 4 lit. b (110 Centimes je Franken = Faktor 2,1) = 1,365 %.
//  VS: LDM RS 643.1 Art. 16 al. 1 (20 Fr. für 1’001–20’000; 0,2 % ab 20’001), al. 2 (Aufrundung auf 100), Art. 18 (≤ 1’000 befreit).
describe('Pfandsteuer als eigene Quelle (RL-28 Teil 3) — Rechenfunktion', () => {
  type Fn = (k: KantonCode, w: number) => { betragChf: number; satzProzentEffektiv: number; label: string } | undefined;
  const fn = async (): Promise<Fn> => (await import('../lib/pfandsteuer')).berechnePfandsteuer as Fn;
  const b = async (k: KantonCode, w: number) => (await fn())(k, w)?.betragChf;

  it('GE: 0,65 % × 2,1 = 1,365 % der Pfandsumme', async () => {
    expect(await b('GE', 1_000_000)).toBe(13_650);
    expect(await b('GE', 100_000)).toBe(1_365);
    expect((await fn())('GE', 1_000_000)?.satzProzentEffektiv).toBe(1.365);
    expect((await fn())('GE', 1_000_000)?.label).toBe('Pfandrechtssteuer (1.365 %)');
  });

  it('VS: Befreiung ≤ 1’000, Fixband 20 für 1’001–20’000, ab 20’001 0,2 % der auf 100 aufgerundeten Summe', async () => {
    expect(await b('VS', 1_000)).toBe(0);
    expect(await b('VS', 1_001)).toBe(20);
    expect(await b('VS', 15_000)).toBe(20);
    expect(await b('VS', 20_000)).toBe(20);
    // 20’001 → Basis 20’100 → 0,2 % = 40.20; die Anzeige rundet wie bisher auf ganze Franken (FR 3000 → 23) → 40
    expect(await b('VS', 20_001)).toBe(40);
    expect(await b('VS', 1_000_000)).toBe(2_000);
    expect(await b('VS', 1_000_001)).toBe(2_000); // Basis 1’000’100 × 0,2 % = 2000.20 → ganze Franken 2000
  });

  it('übrige Kantone unverändert: FR 0,75 %, JU 3,5 ‰ (min 30), VD 2 ‰ (Freigrenze 5’000, Basis auf 1’000 ab)', async () => {
    expect(await b('FR', 1_000_000)).toBe(7_500);
    expect(await b('JU', 1_000_000)).toBe(3_500);
    expect(await b('JU', 5_000)).toBe(30);
    expect(await b('VD', 1_000_000)).toBe(2_000);
    expect(await b('VD', 5_001)).toBe(10);
    expect(await b('VD', 5_000)).toBe(0);
  });

  it('Kantone ohne Pfandsteuer (z. B. ZH, NE, TI) liefern undefined', async () => {
    for (const k of ['ZH', 'NE', 'TI', 'BE'] as KantonCode[]) expect((await fn())(k, 1_000_000), k).toBeUndefined();
  });

  it('weitereKosten (Beurkundungsrechner) rechnet über dieselbe Quelle: GE 1 Mio 13’650, VS 15’000 → 20', () => {
    const p = (k: KantonCode, w: number) => weitereKosten('schuldbrief', k, w, null).posten.find((x) => x.label.startsWith('Pfandrechtssteuer'));
    expect(p('GE', 1_000_000)?.von).toBe(13_650);
    expect(p('GE', 1_000_000)?.label).toBe('Pfandrechtssteuer (1.365 %)');
    expect(p('VS', 15_000)?.von).toBe(20);
    expect(p('VS', 1_000)?.von).toBe(0);
  });

  it('GE-Hinweis nennt die Halbierung für die Hauptwohnung bis 1 Mio (LDE Art. 8A al. 2) nur als Hinweis', async () => {
    const r = (await import('../lib/pfandsteuer')).berechnePfandsteuer('GE', 900_000);
    expect(r?.hinweis).toMatch(/Art\. 8A/);
    expect(r?.betragChf).toBe(Math.round(900_000 * 0.01365));
  });
});
