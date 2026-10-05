// Exit-Vorrang check:fedlex-versionen (Gegenprüfung Runde 2, 5.10.2026):
//  Befund 1 — ein überholter Pin (echte Drift) darf nicht hinter einem Netzfehler im
//    Kanonik-Textvergleich verschwinden: Drift (1) vor «keine Aussage» (2).
//    Rot-Beweis vor Fix: Stub-Lauf auf faa801732 (Pin ÜBERHOLT + Filestore tot) ⇒ Exit 2.
//  Befund 2 — Struktur-/Programmfehler (leere Pin-Liste, 4xx, HTML statt JSON) sind kein
//    Netzausfall ⇒ Exit 1; nur NetzFehler (fetch-Wurf, Timeout, 429/5xx) ⇒ 2.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fuehreAus, netzFetch, NetzFehler } from '../../scripts/fedlex-versionen-pruefen';

const HEUTE = '2026-10-14'; // bewusst kein Monatserster
const SH = [
  '  "or|cc/27/317_321_377|20261001|2|art_11|220"',
  '  "zgb|cc/24/233_245_233|20260701|2|art_19_c|210"',
].join('\n');

type Optionen = {
  /** Neueste geltende Konsolidierung je ELI (Default: das gepinnte Datum). */
  geltend?: Record<string, string>;
  /** Kanonisches html-N je ELI (Default: das gepinnte n). */
  kanonischN?: Record<string, number>;
  sparql?: 'ok' | 'wirft' | 503 | 400 | 'html';
  /** gemischt: or-Abruf wirft, zgb liefert pro Revision anderen Text (Text-Drift). */
  filestore?: 'wirft' | 404 | 'gleich' | 'gemischt';
};

const PINS: Record<string, { kons: string; n: number }> = {
  'cc/27/317_321_377': { kons: '20261001', n: 2 },
  'cc/24/233_245_233': { kons: '20260701', n: 2 },
};
const iso = (k: string): string => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
const datei = (eli: string, kons: string, n: number): string =>
  `https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/${eli}/${kons}/de/html/fedlex-data-admin-ch-eli-${eli.replace(/\//g, '-')}-${kons}-de-html-${n}.html`;

function stub(o: Optionen): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (!url.includes('sparqlendpoint')) {
      if (o.filestore === 'wirft') throw new TypeError('fetch failed');
      if (o.filestore === 'gemischt') {
        if (url.includes('317_321_377')) throw new TypeError('fetch failed');
        return new Response(url.endsWith('-3.html') ? '<p>Frist 20 Tage</p>' : '<p>Frist 30 Tage</p>');
      }
      if (o.filestore === 404) return new Response('nicht gefunden', { status: 404 });
      return new Response('<p>Gleicher Text</p>', { headers: { 'content-type': 'text/html' } });
    }
    const s = o.sparql ?? 'ok';
    if (s === 'wirft') throw new TypeError('fetch failed');
    if (typeof s === 'number') return new Response('x', { status: s });
    if (s === 'html') return new Response('<html>Fehler</html>', { headers: { 'content-type': 'text/html' } });
    const q = decodeURIComponent(String(init?.body ?? '').replace(/^query=/, ''));
    const elis = [...q.matchAll(/<https:\/\/fedlex\.data\.admin\.ch\/eli\/([^>]+)>/g)].map((m) => m[1]);
    const bindings = elis.map((eli) => {
      const p = PINS[eli];
      const abstract = { value: `https://fedlex.data.admin.ch/eli/${eli}` };
      if (q.includes('isExemplifiedBy')) {
        return p ? { abstract, date: { value: iso(p.kons) }, file: { value: datei(eli, p.kons, o.kanonischN?.[eli] ?? p.n) } } : null;
      }
      return { abstract, date: { value: o.geltend?.[eli] ?? (p ? iso(p.kons) : '2000-01-01') } };
    }).filter(Boolean);
    return new Response(JSON.stringify({ results: { bindings } }), {
      headers: { 'content-type': 'application/sparql-results+json' },
    });
  }) as typeof fetch;
}

const lauf = (o: Optionen, textvergleich = true): Promise<number> =>
  fuehreAus({ fetchImpl: stub(o), heute: HEUTE, shText: SH, textvergleich });

describe('check:fedlex-versionen — Exit-Vorrang Drift vor Netz (Befund 1)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('überholt + Netzfehler im Kanonik-Textvergleich ⇒ Exit 1 (Drift hat Vorrang)', async () => {
    expect(await lauf({
      geltend: { 'cc/24/233_245_233': '2026-10-01' }, // zgb ÜBERHOLT
      kanonischN: { 'cc/27/317_321_377': 3 }, // or nicht-kanonisch ⇒ Textvergleich
      filestore: 'wirft',
    })).toBe(1);
  });

  it('nur Netzfehler im Textvergleich, keine Drift ⇒ Exit 2 (keine Aussage)', async () => {
    expect(await lauf({ kanonischN: { 'cc/27/317_321_377': 3 }, filestore: 'wirft' })).toBe(2);
  });

  it('Netzfehler bei einem Pin bricht die übrigen nicht ab: zweiter Pin mit Text-Drift ⇒ Exit 1', async () => {
    // or (zuerst geprüft) nicht erreichbar, zgb mit geändertem Wortlaut ⇒ TEXT-DRIFT zählt.
    expect(await lauf({ kanonischN: { 'cc/27/317_321_377': 3, 'cc/24/233_245_233': 3 }, filestore: 'gemischt' })).toBe(1);
  });

  it('Kanonik-Wechsel mit gleichem Text ⇒ nur HINWEIS, Exit 0', async () => {
    expect(await lauf({ kanonischN: { 'cc/27/317_321_377': 3, 'cc/24/233_245_233': 3 }, filestore: 'gleich' })).toBe(0);
  });

  it('SPARQL nicht erreichbar (Wurf oder 503) ⇒ Exit 2', async () => {
    expect(await lauf({ sparql: 'wirft' })).toBe(2);
    expect(await lauf({ sparql: 503 })).toBe(2);
  });

  it('alles aktuell ⇒ Exit 0', async () => {
    expect(await lauf({})).toBe(0);
  });
});

describe('check:fedlex-versionen — Struktur-/Programmfehler sind kein Netzausfall (Befund 2)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('Formatfehler: keine EINTRAEGE in fedlex-cache.sh ⇒ Exit 1', async () => {
    expect(await fuehreAus({ fetchImpl: stub({}), heute: HEUTE, shText: '# leer\n', textvergleich: true })).toBe(1);
  });

  it('SPARQL 400 (Abfrage kaputt) ⇒ Exit 1', async () => {
    expect(await lauf({ sparql: 400 })).toBe(1);
  });

  it('SPARQL HTTP 200 mit HTML statt JSON ⇒ Exit 1', async () => {
    expect(await lauf({ sparql: 'html' })).toBe(1);
  });

  it('Filestore 404 im Textvergleich ⇒ Exit 1, nicht 2', async () => {
    expect(await lauf({ kanonischN: { 'cc/27/317_321_377': 3 }, filestore: 404 })).toBe(1);
  });

  it('Programmfehler (fetchImpl wirft im Code, nicht im Netz) wird nicht als Netz gewertet', async () => {
    const kaputt = (async () => new Response('{"results":', {
      headers: { 'content-type': 'application/sparql-results+json' },
    })) as unknown as typeof fetch; // abgeschnittenes JSON ⇒ Parse-Fehler
    expect(await fuehreAus({ fetchImpl: kaputt, heute: HEUTE, shText: SH })).toBe(1);
  });
});

describe('netzFetch — Netz-Klassifikation an einer Stelle', () => {
  it('fetch-Wurf, 429 und 5xx ⇒ NetzFehler; 404 ⇒ Response', async () => {
    const wurf = netzFetch((async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch);
    await expect(wurf('https://x.test/')).rejects.toBeInstanceOf(NetzFehler);
    for (const status of [429, 500, 503]) {
      const f = netzFetch((async () => new Response('x', { status })) as unknown as typeof fetch);
      await expect(f('https://x.test/')).rejects.toBeInstanceOf(NetzFehler);
    }
    const nf = netzFetch((async () => new Response('x', { status: 404 })) as unknown as typeof fetch);
    expect((await nf('https://x.test/')).status).toBe(404);
  });

  it('Abbruch beim Lesen des Body ⇒ NetzFehler', async () => {
    const body = new ReadableStream({ pull(c) { c.error(new TypeError('terminated')); } });
    const f = netzFetch((async () => new Response(body)) as unknown as typeof fetch);
    await expect(f('https://x.test/')).rejects.toBeInstanceOf(NetzFehler);
  });
});
