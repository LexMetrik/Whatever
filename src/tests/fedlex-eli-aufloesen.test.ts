import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  loeseSr,
  pinZeile,
  waehleAbstract,
  waehleKonsolidierung,
  gruppiereAbstracts,
  imAbstractFenster,
  deckt,
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
  abstracts: Array<{ cc: string; von: string | null; bis: string | null; status?: string | null; endApp?: string | null }>;
  kons: Record<string, Array<[string, string | null]>>;
  html: Array<{ abstract: string; date: string; file: string }>;
};
const FX = fixtures as unknown as Record<string, Fx>;
const ELI = 'https://fedlex.data.admin.ch/eli/';
const v = (value: string) => ({ value });

/** Attrappe des Endpoints: beantwortet die vier Abfrageformen des Resolvers aus den Fixtures. */
function endpointAttrappe(
  sr: string,
  opts: { abstractReihenfolge?: (n: number) => number[]; zaehlAbweichung?: number; zaehlAbweichungAbstract?: number } = {},
): { fetchImpl: typeof fetch; abfragen: string[] } {
  const fx = FX[sr];
  const abfragen: string[] = [];
  const fetchImpl = (async (_url: unknown, init: { body: string }) => {
    const q = decodeURIComponent(init.body.slice('query='.length));
    abfragen.push(q);
    let bindings: Array<Record<string, { value: string }>>;
    if (q.includes('jolux:ConsolidationAbstract') && q.includes('COUNT(*)')) {
      expect(q).toContain(`"${sr}"^^<https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique>`);
      bindings = [{ n: v(String(fx.abstracts.length + (opts.zaehlAbweichungAbstract ?? 0))) }];
    } else if (q.includes('jolux:ConsolidationAbstract') && q.includes('SELECT DISTINCT ?cc ?von ?bis')) {
      expect(q).toContain(`"${sr}"^^<https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique>`);
      const zeilen = fx.abstracts.map((a) => {
        const b: Record<string, { value: string }> = { cc: v(ELI + a.cc) };
        if (a.von) b.von = v(a.von);
        if (a.bis) b.bis = v(a.bis);
        if (a.status != null) b.status = v(`https://fedlex.data.admin.ch/vocabulary/enforcement-status/${a.status}`);
        if (a.endApp) b.endApp = v(a.endApp);
        return b;
      });
      const reihenfolge = opts.abstractReihenfolge?.(zeilen.length) ?? zeilen.map((_, i) => i);
      bindings = reihenfolge.map((i) => zeilen[i]);
    } else if (q.includes('COUNT(*)')) {
      const eli = /eli\/(cc\/[^>]+)>/.exec(q)![1];
      bindings = [{ n: v(String(fx.kons[eli].length + (opts.zaehlAbweichung ?? 0))) }];
    } else if (q.includes('SELECT DISTINCT ?date ?end')) {
      const eli = /eli\/(cc\/[^>]+)>/.exec(q)![1];
      bindings = fx.kons[eli].map(([date, end]): Record<string, { value: string }> => (end ? { date: v(date), end: v(end) } : { date: v(date) }));
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

  // B1 (Gegenprüfung Opus 7.10.2026): Fedlex setzt bei ausser Kraft getretenen Erlassen oft KEIN
  // dateNoLongerInForce, sondern inForceStatus …/enforcement-status/3 + dateEndApplicability. Der
  // einzige Kandidat im Fenster ging früher ungeprüft durch (Resolver lieferte cc/2023/787 mit Exit 0).
  // Fixtures: am 7.10.2026 live aufgezeichnet.
  for (const [sr, eli, ende] of [
    ['172.220.111.323.2', 'cc/2023/787', '2025-12-31'],
    ['0.142.114.239', 'cc/2016/678', '2021-10-06'],
  ]) {
    it(`SR ${sr} (${eli}, Anwendbarkeit endete ${ende}): OFFEN «nicht mehr in Kraft», nicht gepinnt — in jeder Reihenfolge`, async () => {
      const { fetchImpl } = endpointAttrappe(sr);
      const r = await loeseSr(sr, HEUTE, fetchImpl);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.grund).toMatch(/nicht mehr in Kraft/);
        expect(r.grund).toContain(ende);
        expect(r.grund).toContain('enforcement-status/3');
        expect(r.grund).not.toMatch(/html-Manifestation/);
      }
    });
  }

  it('COUNT-Zähltor auch auf der Abstract-Abfrage (B4): Widerspruch bricht laut ab', async () => {
    const { fetchImpl } = endpointAttrappe('0.101', { zaehlAbweichungAbstract: 1 });
    await expect(loeseSr('0.101', HEUTE, fetchImpl)).rejects.toThrow(/Abstracts der SR 0\.101.*COUNT-Zähltor/);
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
  const k = (eli: string, von: string | null, bis: string | null, status: string | null = null, endApp: string | null = null): AbstractKandidat => ({ eli, von, bis, status, endApp });
  const keine = (): Konsolidierung[] => [];
  const laufend = (): Konsolidierung[] => [{ date: '2020-01-01', end: null }];

  it('Vorgänger mit abgelaufenem dateNoLongerInForce wird verworfen, egal an welcher Stelle er steht', () => {
    const nag = k('cc/12/369_337_369', '1892-07-01', '1989-01-01');
    const neu = k('cc/2018/29', '2018-02-01', null);
    expect(waehleAbstract([nag, neu], HEUTE, laufend)).toEqual({ ok: true, eli: 'cc/2018/29' });
    expect(waehleAbstract([neu, nag], HEUTE, laufend)).toEqual({ ok: true, eli: 'cc/2018/29' });
  });

  it('künftig in Kraft tretender Abstract (von > heute) zählt nicht (§7)', () => {
    expect(waehleAbstract([k('cc/2030/1', '2030-01-01', null)], HEUTE, laufend)).toMatchObject({ ok: false });
  });

  it('kein Kandidat → laute Ablehnung mit Grund', () => {
    expect(waehleAbstract([], HEUTE, keine)).toEqual({ ok: false, grund: 'keine ConsolidationAbstract' });
  });

  it('zwei Kandidaten im Fenster ohne trennendes Konsolidierungs-Fenster → OFFEN, nie raten', () => {
    const r = waehleAbstract([k('cc/a', '1990-01-01', null), k('cc/b', '2000-01-01', null)], HEUTE, laufend);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.grund).toMatch(/nicht eindeutig/);
  });

  it('zwei Kandidaten im Fenster, nur einer mit deckender Konsolidierung → dieser', () => {
    const kons = (eli: string): Konsolidierung[] =>
      eli === 'cc/a' ? [{ date: '1972-03-24', end: '1975-06-19' }] : [{ date: '2026-07-01', end: null }];
    expect(waehleAbstract([k('cc/a', '1972-03-24', null), k('cc/b', '1980-01-01', null)], HEUTE, kons)).toEqual({ ok: true, eli: 'cc/b' });
  });

  // B1: jedes Signal einzeln — jede der drei Bedingungen muss für sich allein den einzigen Kandidaten kippen.
  describe('einziger Kandidat im Fenster wird auf Currency geprüft (B1)', () => {
    it('nur inForceStatus 3 (Konsolidierung offen, kein endApp) → OFFEN', () => {
      const r = waehleAbstract([k('cc/a', '2018-01-01', null, '3')], HEUTE, laufend);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.grund).toMatch(/inForceStatus enforcement-status\/3 «Nicht mehr in Kraft»/);
    });
    it.each(['1', '2', '4', '5'])('inForceStatus %s (≠ 0) → OFFEN', (st) => {
      expect(waehleAbstract([k('cc/a', '2018-01-01', null, st)], HEUTE, laufend).ok).toBe(false);
    });
    it('nur dateEndApplicability < heute (Status fehlt, Konsolidierung offen) → OFFEN', () => {
      const r = waehleAbstract([k('cc/a', '2018-01-01', null, null, '2026-10-06')], HEUTE, laufend);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.grund).toContain('2026-10-06');
    });
    it('nur Konsolidierung endet vor heute (Status/endApp fehlen) → OFFEN', () => {
      const r = waehleAbstract([k('cc/a', '2018-01-01', null)], HEUTE, () => [{ date: '2024-01-01', end: '2025-12-31' }]);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.grund).toMatch(/keine Konsolidierung deckt/);
    });
    it('Status 0 «In Kraft», endApp = heute (Endtag zählt mit), Konsolidierung deckt → gewählt', () => {
      expect(waehleAbstract([k('cc/a', '2018-01-01', null, '0', HEUTE)], HEUTE, laufend)).toEqual({ ok: true, eli: 'cc/a' });
    });
    it('Status 3 beim Vorgänger, Status 0 beim Nachfolger → Nachfolger, auch wenn beide im Fenster stehen', () => {
      const alt = k('cc/alt', '1990-01-01', null, '3', '2019-12-31');
      const neu = k('cc/neu', '2020-01-01', null, '0');
      expect(waehleAbstract([alt, neu], HEUTE, laufend)).toEqual({ ok: true, eli: 'cc/neu' });
    });
    it('Mehrfach-Status (0 und 3 am selben Abstract) gilt NICHT als in Kraft', () => {
      const [g] = gruppiereAbstracts([
        { cc: v(ELI + 'cc/a'), von: v('2018-01-01'), status: v('https://fedlex.data.admin.ch/vocabulary/enforcement-status/0') },
        { cc: v(ELI + 'cc/a'), von: v('2018-01-01'), status: v('https://fedlex.data.admin.ch/vocabulary/enforcement-status/3') },
      ]);
      expect(g.status).toBe('0,3');
      expect(waehleAbstract([g], HEUTE, laufend).ok).toBe(false);
    });
  });
});

// B3 (Gegenprüfung Opus): die Randfälle «genau am Stichtag» — Mutation `<=` → `<` muss rot werden.
describe('Stichtag-Grenzen (inklusive/exklusive Ränder)', () => {
  it('dateNoLongerInForce == heute: der Abstract ist AM Stichtag bereits ausser Kraft', () => {
    expect(imAbstractFenster({ eli: 'x', von: '2000-01-01', bis: HEUTE }, HEUTE)).toBe(false);
    expect(imAbstractFenster({ eli: 'x', von: '2000-01-01', bis: '2026-10-08' }, HEUTE)).toBe(true);
  });
  it('dateEntryInForce == heute: der Abstract gilt AM Stichtag bereits', () => {
    expect(imAbstractFenster({ eli: 'x', von: HEUTE, bis: null }, HEUTE)).toBe(true);
    expect(imAbstractFenster({ eli: 'x', von: '2026-10-08', bis: null }, HEUTE)).toBe(false);
  });
  it('Konsolidierung endet genau am Stichtag: deckt (Endtag zählt mit); endet am Vortag: deckt nicht', () => {
    expect(deckt([{ date: '2025-01-01', end: HEUTE }], HEUTE)).toBe(true);
    expect(deckt([{ date: '2025-01-01', end: '2026-10-06' }], HEUTE)).toBe(false);
  });
  it('Konsolidierung beginnt genau am Stichtag: deckt; beginnt am Folgetag: deckt nicht', () => {
    expect(deckt([{ date: HEUTE, end: null }], HEUTE)).toBe(true);
    expect(deckt([{ date: '2026-10-08', end: null }], HEUTE)).toBe(false);
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
    const rows: Array<Record<string, { value: string }>> = [
      { cc: v(ELI + 'cc/b'), von: v('2001-01-01T00:00:00Z') },
      { cc: v(ELI + 'cc/a'), von: v('1990-01-01'), bis: v('2000-01-01') },
    ];
    expect(gruppiereAbstracts(rows)).toEqual(gruppiereAbstracts([...rows].reverse()));
    expect(gruppiereAbstracts(rows)[0]).toEqual({ eli: 'cc/a', von: '1990-01-01', bis: '2000-01-01', status: null, endApp: null });
  });
});

// ── Tor: die Klasse «SPARQL mit LIMIT ohne ORDER BY» darf in scripts/ nicht wiederkehren ──
// (Mutter des B-07: dieselbe Abfrageform hatte 8 Monate lang keinen Prüfer.)
// Gehärtet nach Gegenprüfung Opus 7.10.2026 (B2): der erste Scanner prüfte nur Backtick-Literale mit
// jolux:-Prädikat und liess durch: `LIMIT ${n}`, Abfragen in '…'/"…", volle jolux-IRI ohne Präfix,
// ORDER BY nur in einer Unterabfrage oder im Kommentar, `${PREFIXE}`-Interpolation ohne Prädikat.
// Jetzt: JEDE Datei unter scripts/, die den Fedlex-SPARQL-Endpoint anspricht (Marker unten), wird in ihre
// String-Literale (', ", `, mit Kommentar-/Regex-Überspringen und `${…}`-Schachtelung) zerlegt; jedes Literal
// mit `LIMIT <Zahl|Interpolation|?var>` braucht ein ORDER BY auf DERSELBEN Abfrageebene (Klammertiefe) davor.
// Dateien ausserhalb der JS-Welt (.sh/.py) werden als ein Block ohne Zeilenkommentare geprüft.
const FEDLEX_MARKER = /sparqlendpoint|fedlex\.data\.admin\.ch|fedlex-sparql|sparqlSelect|sparqlBatch/i;
const LIMIT_MIT_WERT = /\bLIMIT\s*(\d|\u0000|\?\w)/gi;

/** Zerlegt JS/TS-Quelltext in String-Literal-Inhalte; `${…}` wird zu \u0000, Kommentare/Regex werden übersprungen. */
function stringLiterale(src: string): string[] {
  const out: string[] = [];
  const n = src.length;
  const regexVor = /[(,=:[!&|?{};]/;
  let letztesZeichen = '';
  const lies = (q: string, start: number): number => {
    let buf = '';
    let j = start;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { buf += src.slice(j, j + 2); j += 2; continue; }
      if (c === q) { out.push(buf); return j + 1; }
      if (q === '`' && c === '$' && src[j + 1] === '{') { buf += '\u0000'; j = code(j + 2, true); continue; }
      buf += c;
      j += 1;
    }
    out.push(buf);
    return j;
  };
  /** Code ab `start`; bei `bisKlammer` endet er an der passenden schliessenden `}` (Index danach). */
  const code = (start: number, bisKlammer: boolean): number => {
    let tiefe = 0;
    let j = start;
    while (j < n) {
      const c = src[j];
      if (c === '/' && src[j + 1] === '/') { const e = src.indexOf('\n', j); j = e < 0 ? n : e; continue; }
      if (c === '/' && src[j + 1] === '*') { const e = src.indexOf('*/', j + 2); j = e < 0 ? n : e + 2; continue; }
      if (c === "'" || c === '"' || c === '`') { j = lies(c, j + 1); letztesZeichen = 'a'; continue; }
      if (c === '/' && (letztesZeichen === '' || regexVor.test(letztesZeichen))) {
        let k = j + 1; let klasse = false;
        while (k < n && src[k] !== '\n' && (klasse || src[k] !== '/')) {
          if (src[k] === '\\') k += 1; else if (src[k] === '[') klasse = true; else if (src[k] === ']') klasse = false;
          k += 1;
        }
        j = k + 1; letztesZeichen = 'a'; continue;
      }
      if (c === '{') tiefe += 1;
      if (c === '}') { if (bisKlammer && tiefe === 0) return j + 1; tiefe -= 1; }
      if (!/\s/.test(c)) letztesZeichen = c;
      j += 1;
    }
    return j;
  };
  code(0, false);
  return out;
}

/**
 * Funde in EINER Abfrage-Zeichenkette: jedes `LIMIT <Wert>` ohne vorangehendes ORDER BY auf derselben
 * Klammerebene. ORDER BY in einer tieferen Unterabfrage (`{ … }` davor) oder im #-Kommentar zählt nicht;
 * das Verlassen der umschliessenden `{` beendet die Suche (LIMIT einer Unterabfrage ohne eigenes ORDER BY).
 */
function limitOhneOrder(abfrage: string): string[] {
  const text = abfrage.replace(/(^|\s)#[^\n]*/g, '$1');
  const ereignisse: Array<{ art: '{' | '}' | 'order'; idx: number }> = [];
  for (const m of text.matchAll(/[{}]|\bORDER\s+BY\b/gi)) {
    ereignisse.push({ art: m[0] === '{' ? '{' : m[0] === '}' ? '}' : 'order', idx: m.index });
  }
  const funde: string[] = [];
  for (const l of text.matchAll(LIMIT_MIT_WERT)) {
    let tiefe = 0;
    let gefunden = false;
    for (const e of ereignisse.filter((x) => x.idx < l.index).reverse()) {
      if (e.art === '}') tiefe += 1;
      else if (e.art === '{') { if (tiefe === 0) break; tiefe -= 1; }
      else if (tiefe === 0) { gefunden = true; break; }
    }
    if (!gefunden) funde.push(text.slice(Math.max(0, l.index - 40), l.index + 20).replace(/\s+/g, ' '));
  }
  return funde;
}

/** Funde einer Quelldatei; nur Dateien, die den Fedlex-SPARQL-Endpoint ansprechen. */
function sparqlLimitOhneOrder(quelltext: string, dateiname = 'x.ts'): string[] {
  if (!FEDLEX_MARKER.test(quelltext)) return [];
  if (/\.(ts|tsx|mts|js|mjs|cjs)$/.test(dateiname)) return stringLiterale(quelltext).flatMap(limitOhneOrder);
  return limitOhneOrder(quelltext.split('\n').filter((z) => !/^\s*(#|\/\/)/.test(z)).join('\n'));
}

/** Begründete Ausnahmen: Datei → Grund. Leer = jede Datei muss die Regel erfüllen. */
const LIMIT_AUSNAHMEN: Record<string, string> = {};

function skripte(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) skripte(p, out);
    else if (/\.(ts|tsx|mts|js|mjs|cjs|sh|py)$/.test(p) && !/\.test\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

describe('Tor: SPARQL-Abfragen mit LIMIT brauchen ORDER BY (gehärtet, B2)', () => {
  const marker = (abfrage: string): string => `import { sparqlSelect } from './fedlex-sparql';\nconst q = ${abfrage};`;

  it('Scanner erkennt die B-07-Form (Rot-Beweis des Tors, §6.7)', () => {
    const alt = '`PREFIX jolux: <http://x#> SELECT ?cc ?date WHERE { ?cc a jolux:ConsolidationAbstract } LIMIT 200`';
    expect(sparqlLimitOhneOrder(marker(alt))).toHaveLength(1);
    expect(sparqlLimitOhneOrder(marker(alt.replace('LIMIT 200', 'ORDER BY ?cc LIMIT 200')))).toHaveLength(0);
    expect(sparqlLimitOhneOrder('const q = `SELECT 1 LIMIT 5`;')).toHaveLength(0); // Datei spricht Fedlex nicht an
  });

  // Jede der fünf vom Prüfer genannten Umgehungen muss rot werden (Rot-Beweis je Variante).
  it.each([
    ['LIMIT ${n} (Interpolation statt Zahl)', '`SELECT ?a WHERE { ?a ?b ?c } LIMIT ${n}`'],
    ['Abfrage in einfachen Anführungszeichen', "'SELECT ?a WHERE { ?a ?b ?c } LIMIT 5'"],
    ['Abfrage in doppelten Anführungszeichen', '"SELECT ?a WHERE { ?a ?b ?c } LIMIT 5"'],
    ['volle jolux-IRI ohne jolux:-Präfix', '`SELECT ?a WHERE { ?a <http://data.legilux.public.lu/resource/ontology/jolux#isMemberOf> ?c } LIMIT 5`'],
    ['ORDER BY nur in der Unterabfrage', '`SELECT ?a WHERE { { SELECT ?a WHERE { ?a ?b ?c } ORDER BY ?a } } LIMIT 5`'],
    ['ORDER BY nur im Kommentar', '`SELECT ?a WHERE { ?a ?b ?c }\n# ORDER BY ?a\nLIMIT 5`'],
    ['${PREFIXE}-Interpolation ohne jolux-Prädikat', '`${PREFIXE}\nSELECT ?a WHERE { ?a ?b ?c } LIMIT 5`'],
    ['LIMIT einer Unterabfrage ohne eigenes ORDER BY, ORDER BY aussen', '`SELECT ?a WHERE { { SELECT ?a WHERE { ?a ?b ?c } LIMIT 5 } } ORDER BY ?a`'],
    ['lowercase limit', '`select ?a where { ?a ?b ?c } limit 5`'],
  ])('rot: %s', (_name, abfrage) => {
    expect(sparqlLimitOhneOrder(marker(abfrage))).toHaveLength(1);
  });

  it.each([
    ['ORDER BY auf derselben Ebene', '`SELECT ?a WHERE { ?a ?b ?c } ORDER BY ?a LIMIT 5`'],
    ['ORDER BY DESC + Interpolation', '`SELECT ?a WHERE { ?a ?b ?c } ORDER BY DESC(?a) LIMIT ${n}`'],
    ['Unterabfrage mit eigenem ORDER BY + LIMIT', '`SELECT ?a WHERE { { SELECT ?a WHERE { ?a ?b ?c } ORDER BY ?a LIMIT 5 } }`'],
    ['IRI mit # ist kein Kommentar', '`SELECT ?a WHERE { ?a <http://x#p> ?c } ORDER BY ?a LIMIT 5`'],
    ['Abfrage ohne LIMIT', "'SELECT ?a WHERE { ?a ?b ?c } ORDER BY ?a'"],
    ['Prosa mit «limit» ohne Wert', "'rate limit exceeded'"],
  ])('grün: %s', (_name, abfrage) => {
    expect(sparqlLimitOhneOrder(marker(abfrage))).toHaveLength(0);
  });

  it('Kommentare mit Apostroph und Regex-Literale verwirren den Tokenizer nicht', () => {
    const src = [
      "import { sparqlSelect } from './fedlex-sparql';",
      "// it's a comment with an apostrophe",
      "const r = /[`\"']/.test(x);",
      '/* don\'t */',
      'const q = `SELECT ?a WHERE { ?a ?b ?c } LIMIT 3`;',
    ].join('\n');
    expect(stringLiterale(src)).toContain('SELECT ?a WHERE { ?a ?b ?c } LIMIT 3');
    expect(sparqlLimitOhneOrder(src)).toHaveLength(1);
  });

  it('verschachtelte Template-Literale (`${…`…`}`) werden vollständig zerlegt', () => {
    const src = "import { sparqlSelect } from './fedlex-sparql';\nconst q = `A ${x.map((v) => `B ${v} LIMIT 9`).join(' ')} C`;";
    expect(stringLiterale(src)).toEqual(expect.arrayContaining(['B \u0000 LIMIT 9']));
    expect(sparqlLimitOhneOrder(src)).toHaveLength(1);
  });

  it('.sh/.py: Zeilenkommentare zählen nicht, ein Aufruf mit LIMIT ohne ORDER BY schon', () => {
    const sh = 'curl https://fedlex.data.admin.ch/sparqlendpoint\n# Ursache: LIMIT 200 + bindings[0]\n';
    expect(sparqlLimitOhneOrder(sh, 'x.sh')).toHaveLength(0);
    expect(sparqlLimitOhneOrder(`${sh}Q='SELECT ?a WHERE { ?a ?b ?c } LIMIT 200'\n`, 'x.sh')).toHaveLength(1);
  });

  it('kein Skript unter scripts/, das Fedlex-SPARQL anspricht, enthält LIMIT ohne ORDER BY (Ausnahmen nur begründet)', () => {
    const treffer: string[] = [];
    let geprueft = 0;
    for (const datei of skripte('scripts')) {
      const text = readFileSync(datei, 'utf8');
      if (FEDLEX_MARKER.test(text)) geprueft += 1;
      if (LIMIT_AUSNAHMEN[datei]) continue;
      for (const f of sparqlLimitOhneOrder(text, datei)) treffer.push(`${datei}: ${f}`);
    }
    expect(geprueft, 'Scanner prüft überhaupt Dateien').toBeGreaterThan(20);
    expect(treffer).toEqual([]);
  });
});
