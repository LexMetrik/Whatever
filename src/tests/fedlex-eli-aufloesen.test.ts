import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  loeseSr,
  pinZeile,
  waehleAbstract,
  waehleKonsolidierung,
  gruppiereAbstracts,
  type AbstractKandidat,
  type Konsolidierung,
} from '../../scripts/fedlex-eli-aufloesen';
import fixtures from './fixtures/fedlex-eli-aufloesen.json';

// B-07 (A1-FUNDAMENT): die ELI-Auflösung wählte den Abstract über `LIMIT 200` ohne
// ORDER BY und `bindings[0]` — vom Endpoint-Zufall abhängig. Live reproduziert
// 7.10.2026: SR 211.435.1 → NAG 1891 (Vorgänger), SR 823.11 → AVG 1951, SR 0.101 →
// Stand 1983 statt 2022 (LIMIT-gekappt). Diese Fixtures sind die am 7.10.2026 live
// aufgezeichneten Antworten des amtlichen Endpoints (fedlex.data.admin.ch/sparqlendpoint)
// auf die vier Abfragen des Resolvers — kein Netz im Test (§2).

const HEUTE = '2026-10-07';

type Fx = {
  abstracts: Array<{ cc: string; von: string | null; bis: string | null }>;
  kons: Record<string, Array<[string, string | null]>>;
  html: Array<{ abstract: string; date: string; file: string }>;
};
const FX = fixtures as unknown as Record<string, Fx>;
const ELI = 'https://fedlex.data.admin.ch/eli/';
const v = (value: string) => ({ value });

/** Attrappe des Endpoints: beantwortet die vier Abfrageformen des Resolvers aus den Fixtures. */
function endpointAttrappe(
  sr: string,
  opts: { abstractReihenfolge?: (n: number) => number[]; zaehlAbweichung?: number } = {},
): { fetchImpl: typeof fetch; abfragen: string[] } {
  const fx = FX[sr];
  const abfragen: string[] = [];
  const fetchImpl = (async (_url: unknown, init: { body: string }) => {
    const q = decodeURIComponent(init.body.slice('query='.length));
    abfragen.push(q);
    let bindings: Array<Record<string, { value: string }>>;
    if (q.includes('jolux:ConsolidationAbstract') && q.includes('SELECT DISTINCT ?cc ?von ?bis')) {
      expect(q).toContain(`"${sr}"^^<https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique>`);
      const zeilen = fx.abstracts.map((a) => {
        const b: Record<string, { value: string }> = { cc: v(ELI + a.cc) };
        if (a.von) b.von = v(a.von);
        if (a.bis) b.bis = v(a.bis);
        return b;
      });
      const reihenfolge = opts.abstractReihenfolge?.(zeilen.length) ?? zeilen.map((_, i) => i);
      bindings = reihenfolge.map((i) => zeilen[i]);
    } else if (q.includes('COUNT(*)')) {
      const eli = /eli\/(cc\/[^>]+)>/.exec(q)![1];
      bindings = [{ n: v(String(fx.kons[eli].length + (opts.zaehlAbweichung ?? 0))) }];
    } else if (q.includes('SELECT DISTINCT ?date ?end')) {
      const eli = /eli\/(cc\/[^>]+)>/.exec(q)![1];
      bindings = fx.kons[eli].map(([date, end]) => (end ? { date: v(date), end: v(end) } : { date: v(date) }));
    } else if (q.includes('VALUES ?abstract')) {
      bindings = fx.html.map((h) => ({ abstract: v(ELI + h.abstract), date: v(h.date), file: v(h.file) }));
    } else {
      throw new Error(`unerwartete Abfrage: ${q.slice(0, 120)}`);
    }
    return { ok: true, status: 200, json: async () => ({ results: { bindings } }) } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, abfragen };
}

/** Alle Permutationen (n ≤ 4 genügt: die Fälle haben höchstens zwei Abstracts). */
function permutationen(n: number): number[][] {
  if (n <= 1) return [[0]];
  const out: number[][] = [];
  const rek = (rest: number[], acc: number[]): void => {
    if (!rest.length) { out.push(acc); return; }
    rest.forEach((x, i) => rek([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, x]));
  };
  rek(Array.from({ length: n }, (_, i) => i), []);
  return out;
}

describe('loeseSr — die drei am 7.10.2026 reproduzierten Fehlfälle + Normalfall', () => {
  const faelle: Array<[string, string, string, string, number]> = [
    // sr, erwartetes eli, geltend, pin-zeile, html-n
    ['0.101', 'cc/1974/2151_2151_2151', '2022-09-16', 'emrk', 9], // EMRK: war 1983-12-01 (LIMIT-gekappt)
    ['211.435.1', 'cc/2018/29', '2024-01-01', 'eoebv', 5], // war NAG 1891 (cc/12/369_337_369)
    ['823.11', 'cc/1991/392_392_392', '2026-01-01', 'avg', 0], // war AVG 1951 (cc/1951/1211_1217_1249)
    ['954.1', 'cc/2018/801', '2026-10-01', 'finig', 1], // Normalfall (Vorgänger BEHG-Schatten vorhanden)
  ];

  for (const [sr, eli, geltend, key, n] of faelle) {
    it(`SR ${sr} → ${eli} @ ${geltend} (html-${n})`, async () => {
      const { fetchImpl } = endpointAttrappe(sr);
      const r = await loeseSr(sr, HEUTE, fetchImpl);
      expect(r).toMatchObject({ ok: true, eli, geltend, n });
      if (r.ok) {
        expect(pinZeile(key, r)).toBe(`  "${key}|${eli}|${geltend.replace(/-/g, '')}|${n}|art_1|${sr}"`);
      }
    });

    it(`SR ${sr}: Ergebnis hängt NICHT von der Zeilenreihenfolge des Endpoints ab (alle Permutationen)`, async () => {
      const ergebnisse = new Set<string>();
      for (const perm of permutationen(FX[sr].abstracts.length)) {
        const { fetchImpl } = endpointAttrappe(sr, { abstractReihenfolge: () => perm });
        ergebnisse.add(JSON.stringify(await loeseSr(sr, HEUTE, fetchImpl)));
      }
      expect(ergebnisse.size).toBe(1);
    });
  }

  it('SR 700 (RPG): zwei Abstracts ohne dateNoLongerInForce → das Konsolidierungs-Fenster entscheidet, in jeder Reihenfolge', async () => {
    const ergebnisse = new Set<string>();
    for (const perm of permutationen(FX['700'].abstracts.length)) {
      const { fetchImpl } = endpointAttrappe('700', { abstractReihenfolge: () => perm });
      ergebnisse.add(JSON.stringify(await loeseSr('700', HEUTE, fetchImpl)));
    }
    expect([...ergebnisse].map((j) => JSON.parse(j))).toEqual([
      expect.objectContaining({ ok: true, eli: 'cc/1979/1573_1573_1573', geltend: '2026-07-01', n: 3 }),
    ]);
  });

  it('keine Abfrage trägt LIMIT; jede Zeilenabfrage trägt ORDER BY (Nicht-Determinismus-Klasse)', async () => {
    for (const sr of Object.keys(FX)) {
      const { fetchImpl, abfragen } = endpointAttrappe(sr);
      await loeseSr(sr, HEUTE, fetchImpl);
      expect(abfragen.length).toBeGreaterThan(0);
      for (const q of abfragen) {
        expect(q, `SR ${sr}`).not.toMatch(/\bLIMIT\b/);
        if (!q.includes("COUNT(") && !q.includes("VALUES ?abstract")) expect(q, `SR ${sr}`).toMatch(/ORDER BY/); // Manifest-Abfrage: fedlex-manifest.ts, Index nach (eli|datum)
      }
    }
  });

  it('COUNT-Zähltor: widerspricht die Zählung der Zeilenliste, bricht der Lauf laut ab (stilles Teilergebnis)', async () => {
    const { fetchImpl } = endpointAttrappe('0.101', { zaehlAbweichung: 1 });
    await expect(loeseSr('0.101', HEUTE, fetchImpl)).rejects.toThrow(/COUNT-Zähltor/);
  });

  it('ungültige SR-Nummer wird abgewiesen (keine Injektion in die Abfrage)', async () => {
    await expect(loeseSr('220" } UNION {', HEUTE, fetch)).rejects.toThrow(/gültiges Format/);
  });
});

describe('waehleAbstract — reine Auswahl', () => {
  const k = (eli: string, von: string | null, bis: string | null): AbstractKandidat => ({ eli, von, bis });
  const keine = (): Konsolidierung[] => [];

  it('Vorgänger mit abgelaufenem dateNoLongerInForce wird verworfen, egal an welcher Stelle er steht', () => {
    const nag = k('cc/12/369_337_369', '1892-07-01', '1989-01-01');
    const neu = k('cc/2018/29', '2018-02-01', null);
    expect(waehleAbstract([nag, neu], HEUTE, keine)).toEqual({ ok: true, eli: 'cc/2018/29' });
    expect(waehleAbstract([neu, nag], HEUTE, keine)).toEqual({ ok: true, eli: 'cc/2018/29' });
  });

  it('künftig in Kraft tretender Abstract (von > heute) zählt nicht (§7)', () => {
    expect(waehleAbstract([k('cc/2030/1', '2030-01-01', null)], HEUTE, keine)).toMatchObject({ ok: false });
  });

  it('kein Kandidat → laute Ablehnung mit Grund', () => {
    expect(waehleAbstract([], HEUTE, keine)).toEqual({ ok: false, grund: 'keine ConsolidationAbstract' });
  });

  it('zwei Kandidaten im Fenster ohne trennendes Konsolidierungs-Fenster → OFFEN, nie raten', () => {
    const r = waehleAbstract([k('cc/a', '1990-01-01', null), k('cc/b', '2000-01-01', null)], HEUTE, keine);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.grund).toMatch(/nicht eindeutig/);
  });

  it('zwei Kandidaten im Fenster, nur einer mit deckender Konsolidierung → dieser', () => {
    const kons = (eli: string): Konsolidierung[] =>
      eli === 'cc/a' ? [{ date: '1972-03-24', end: '1975-06-19' }] : [{ date: '2026-07-01', end: null }];
    expect(waehleAbstract([k('cc/a', '1972-03-24', null), k('cc/b', '1980-01-01', null)], HEUTE, kons)).toEqual({ ok: true, eli: 'cc/b' });
  });
});

describe('waehleKonsolidierung / gruppiereAbstracts', () => {
  it('geltend = grösste dateApplicability ≤ heute, künftige nur als «naechste»', () => {
    const kons: Konsolidierung[] = ['2026-12-01', '2022-01-01', '2026-10-07', '2026-01-01'].map((date) => ({ date, end: null }));
    expect(waehleKonsolidierung(kons, HEUTE)).toEqual({ geltend: '2026-10-07', naechste: '2026-12-01', anzahl: 4 });
  });

  it('keine Konsolidierung ≤ heute → geltend null', () => {
    expect(waehleKonsolidierung([{ date: '2030-01-01', end: null }], HEUTE).geltend).toBeNull();
  });

  it('gruppiert Zeilen je Abstract unabhängig von der Eingabereihenfolge', () => {
    const rows = [
      { cc: v(ELI + 'cc/b'), von: v('2001-01-01T00:00:00Z') },
      { cc: v(ELI + 'cc/a'), von: v('1990-01-01'), bis: v('2000-01-01') },
    ];
    expect(gruppiereAbstracts(rows)).toEqual(gruppiereAbstracts([...rows].reverse()));
    expect(gruppiereAbstracts(rows)[0]).toEqual({ eli: 'cc/a', von: '1990-01-01', bis: '2000-01-01' });
  });
});

// ── Tor: die Klasse «SPARQL mit LIMIT ohne ORDER BY» darf in scripts/ nicht wiederkehren ──
// (Mutter des B-07: dieselbe Abfrageform hatte 8 Monate lang keinen Prüfer.) Der Scanner
// prüft jede Quelltext-Zeichenkette, die erkennbar SPARQL gegen Fedlex ist.
function sparqlLimitOhneOrder(quelltext: string): string[] {
  const funde: string[] = [];
  for (const m of quelltext.matchAll(/`([^`]*)`/g)) {
    const s = m[1];
    if (!/jolux:|skos:notation|sparqlendpoint/.test(s)) continue;
    if (/\bLIMIT\s+\d+/i.test(s) && !/\bORDER\s+BY\b/i.test(s)) funde.push(s.replace(/\s+/g, ' ').slice(0, 100));
  }
  return funde;
}

function skripte(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) skripte(p, out);
    else if (p.endsWith('.ts') && !p.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

describe('Tor: SPARQL-Abfragen mit LIMIT brauchen ORDER BY', () => {
  it('Scanner erkennt die B-07-Form (Rot-Beweis des Tors, §6.7)', () => {
    const alt = '`PREFIX jolux: <http://x#> SELECT ?cc ?date WHERE { ?cc a jolux:ConsolidationAbstract } LIMIT 200`';
    expect(sparqlLimitOhneOrder(alt)).toHaveLength(1);
    expect(sparqlLimitOhneOrder(alt.replace('LIMIT 200', 'ORDER BY ?cc LIMIT 200'))).toHaveLength(0);
    expect(sparqlLimitOhneOrder('`SELECT 1 LIMIT 5`')).toHaveLength(0); // kein SPARQL gegen Fedlex
  });

  it('kein Skript unter scripts/ enthält eine Fedlex-SPARQL-Abfrage mit LIMIT ohne ORDER BY', () => {
    const treffer: string[] = [];
    for (const datei of skripte('scripts')) {
      for (const f of sparqlLimitOhneOrder(readFileSync(datei, 'utf8'))) treffer.push(`${datei}: ${f}`);
    }
    expect(treffer).toEqual([]);
  });
});
