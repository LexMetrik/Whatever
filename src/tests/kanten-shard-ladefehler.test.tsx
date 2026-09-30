/**
 * W2·27-BUND-FERTIG · Posten «W3-5-Rest: Kanten-Shard-Ausfall» (30.9.2026).
 *
 * Befund (Bug-Check #1097, 25.9.2026): ein abgebrochener Abruf von
 * `/materialien/kanten/ARG.json` lieferte `null` — dasselbe wie «Erlass ohne
 * Shard» — und der Leser zeigte «Zu Art. 6 nichts erfasst.» (§8: ein Ladefehler
 * ist keine Auskunft über den Artikel). Geprüft wird die AUSSAGE je Zustand:
 * leer (404 / ohne Shard) ≠ fehler (Netz/Parse/5xx/Bucket fehlt) ≠ ok.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString as rohRender } from 'react-dom/server';
import type { ReactElement } from 'react';
import {
  ladeKantenShard, ladeKantenShardErgebnis, _leereKantenShardCache,
} from '../lib/materialien/kanten-shard';
import { leiteMaterialNachschlag } from '../pages/gesetz-leser/artikelMaterialienLaden';
import { BlattArtikelGruppe } from '../pages/gesetz-leser/v3/BlattArtikel';
import type { MaterialManifest } from '../lib/materialien/typen';

function renderToString(el: ReactElement): string {
  return rohRender(el).replace(/<!-- -->/g, '');
}

const KANTE = { dok: 'DOK-A', artikel: '6', quelle: 'amtlich', konfidenz: 'regex-hoch', stand: '2025-01-01', fundstellen: [{ z: '1' }] };
const KOPF_KLEIN = { erzeugt: '2026-09-30', erlass: 'ARG', dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } }, kanten: [KANTE] };
const KOPF_BUCKETS = { erzeugt: '2026-09-30', erlass: 'DBG', dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } }, buckets: ['1', '2'] };

type Antwort = { status: number; body?: unknown; jsonWirft?: boolean } | 'netz';

/** Fetch-Stub je Pfad; ein Pfad kann nacheinander mehrere Antworten geben. */
function stubFetch(map: Record<string, Antwort | Antwort[]>) {
  const zaehler: Record<string, number> = {};
  const f = vi.fn(async (url: string) => {
    const a0 = map[url];
    const liste = Array.isArray(a0) ? a0 : [a0];
    const i = Math.min(zaehler[url] ?? 0, liste.length - 1);
    zaehler[url] = (zaehler[url] ?? 0) + 1;
    const a = liste[i] ?? { status: 404 };
    if (a === 'netz') throw new TypeError('Failed to fetch');
    return {
      ok: a.status >= 200 && a.status < 300, status: a.status,
      json: async () => { if (a.jsonWirft) throw new SyntaxError('Unexpected token <'); return a.body; },
    } as unknown as Response;
  });
  vi.stubGlobal('fetch', f);
  return f;
}

afterEach(() => { vi.unstubAllGlobals(); _leereKantenShardCache(); });

describe('ladeKantenShardErgebnis — leer ≠ fehler ≠ ok', () => {
  it('Erlass ohne Shard (nicht in KANTEN_ERLASSE): leer, ohne Fetch', async () => {
    const f = stubFetch({});
    expect(await ladeKantenShardErgebnis('KVG')).toEqual({ zustand: 'leer' });
    expect(f).not.toHaveBeenCalled();
  });

  it('Kopf 404: leer — und dauerhaft gecacht (kein zweiter Fetch)', async () => {
    const f = stubFetch({ '/materialien/kanten/ARG.json': { status: 404 } });
    expect(await ladeKantenShardErgebnis('ARG')).toEqual({ zustand: 'leer' });
    expect(await ladeKantenShardErgebnis('ARG')).toEqual({ zustand: 'leer' });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('abgebrochener Abruf (Netzfehler): fehler, NICHT leer; nicht gecacht, der zweite Versuch kann gelingen', async () => {
    const f = stubFetch({ '/materialien/kanten/ARG.json': ['netz', { status: 200, body: KOPF_KLEIN }] });
    expect(await ladeKantenShardErgebnis('ARG')).toEqual({ zustand: 'fehler' });
    const e = await ladeKantenShardErgebnis('ARG');
    expect(e.zustand).toBe('ok');
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('HTTP 500 und 503: fehler (nur 404 heisst «kein Shard»)', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 500 } });
    expect(await ladeKantenShardErgebnis('ARG')).toEqual({ zustand: 'fehler' });
    _leereKantenShardCache();
    stubFetch({ '/materialien/kanten/ARG.json': { status: 503 } });
    expect(await ladeKantenShardErgebnis('ARG')).toEqual({ zustand: 'fehler' });
  });

  it('kein gültiges JSON (z. B. HTML-Fangseite mit 200): fehler', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 200, jsonWirft: true } });
    expect(await ladeKantenShardErgebnis('ARG')).toEqual({ zustand: 'fehler' });
  });

  it('Shard geladen: ok mit den Kanten; der Erfolg bleibt gecacht', async () => {
    const f = stubFetch({ '/materialien/kanten/ARG.json': { status: 200, body: KOPF_KLEIN } });
    const e = await ladeKantenShardErgebnis('ARG');
    expect(e.zustand === 'ok' && e.shard.kanten).toEqual([KANTE]);
    await ladeKantenShardErgebnis('ARG');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('Bucket-Split: beide Buckets da = ok; ein Bucket 404 oder Netzfehler = fehler (angekündigt, also Defekt)', async () => {
    const bucket = (n: string) => ({ erzeugt: 'x', erlass: 'DBG', kanten: [{ ...KANTE, artikel: n }] });
    stubFetch({
      '/materialien/kanten/DBG.json': { status: 200, body: KOPF_BUCKETS },
      '/materialien/kanten/DBG/1.json': { status: 200, body: bucket('1') },
      '/materialien/kanten/DBG/2.json': { status: 200, body: bucket('2') },
    });
    const ok = await ladeKantenShardErgebnis('DBG');
    expect(ok.zustand === 'ok' && ok.shard.kanten.map((k) => k.artikel)).toEqual(['1', '2']);

    _leereKantenShardCache();
    stubFetch({
      '/materialien/kanten/DBG.json': { status: 200, body: KOPF_BUCKETS },
      '/materialien/kanten/DBG/1.json': { status: 200, body: bucket('1') },
      '/materialien/kanten/DBG/2.json': { status: 404 },
    });
    expect(await ladeKantenShardErgebnis('DBG')).toEqual({ zustand: 'fehler' });

    _leereKantenShardCache();
    stubFetch({
      '/materialien/kanten/DBG.json': { status: 200, body: KOPF_BUCKETS },
      '/materialien/kanten/DBG/1.json': 'netz',
      '/materialien/kanten/DBG/2.json': { status: 200, body: bucket('2') },
    });
    expect(await ladeKantenShardErgebnis('DBG')).toEqual({ zustand: 'fehler' });
  });

  it('ladeKantenShard (Altfassung): ok → Shard, leer und fehler → null (Verhalten der Altaufrufer unverändert)', async () => {
    stubFetch({ '/materialien/kanten/ARG.json': { status: 200, body: KOPF_KLEIN } });
    expect((await ladeKantenShard('ARG'))?.kanten).toHaveLength(1);
    _leereKantenShardCache();
    stubFetch({ '/materialien/kanten/ARG.json': 'netz' });
    expect(await ladeKantenShard('ARG')).toBeNull();
    _leereKantenShardCache();
    stubFetch({ '/materialien/kanten/ARG.json': { status: 404 } });
    expect(await ladeKantenShard('ARG')).toBeNull();
  });
});

describe('leiteMaterialNachschlag — `unsicher` trägt den Ladefehler des Shards', () => {
  const MANIFEST: MaterialManifest = {
    erzeugt: '2026-09-30',
    materialien: [{ key: 'DOK-A', behoerdeKuerzel: 'SECO', doktypLabel: 'Wegleitung', nummer: null, titel: 'Titel A', stand: '2025-01-01' }],
  } as unknown as MaterialManifest;
  const SHARD = { erlass: 'ARG', dokumente: { 'DOK-A': { urlBasis: 'https://x', stand: '2025-01-01' } }, kanten: [KANTE] };

  it('Shard geladen: nicht unsicher, Art. 6 hat den Eintrag', () => {
    const { nachschlag, unsicher } = leiteMaterialNachschlag({ shard: SHARD, shardFehler: false, manifest: MANIFEST });
    expect(unsicher).toBe(false);
    expect(nachschlag('6')).toHaveLength(1);
  });

  it('Erlass ohne Shard (404, kein Fehler): nicht unsicher — leer ist hier eine Antwort', () => {
    const { nachschlag, unsicher } = leiteMaterialNachschlag({ shard: null, shardFehler: false, manifest: MANIFEST });
    expect(unsicher).toBe(false);
    expect(nachschlag('6')).toEqual([]);
  });

  it('Shard-Abruf gescheitert: unsicher (die leere Liste ist dann KEIN «nichts erfasst»)', () => {
    const { nachschlag, unsicher } = leiteMaterialNachschlag({ shard: null, shardFehler: true, manifest: MANIFEST });
    expect(unsicher).toBe(true);
    expect(nachschlag('6')).toEqual([]);
  });

  it('Manifest gescheitert (W3-5): weiterhin unsicher', () => {
    expect(leiteMaterialNachschlag({ shard: SHARD, shardFehler: false, manifest: null }).unsicher).toBe(true);
  });
});

describe('BlattArtikelGruppe — Ladefehler statt «nichts erfasst»', () => {
  const basis = { titel: 'Zu Art. 6', zahl: 0, daten: 'erlaeuterungen', token: '6' } as const;

  it('ohne Fehler und geladen: «Zu Art. 6 nichts erfasst.» (ehrliche Leerauskunft bleibt)', () => {
    const html = renderToString(<BlattArtikelGruppe {...basis} geladen>{null}</BlattArtikelGruppe>);
    expect(html).toContain('Zu Art. 6 nichts erfasst.');
    expect(html).not.toContain('data-v3-blatt-fehler');
  });

  it('mit Ladefehler: Fehlertext + «Erneut laden», KEIN «nichts erfasst»', () => {
    const html = renderToString(
      <BlattArtikelGruppe {...basis} geladen={false} ladefehler={{ gegenstand: 'Erläuterungen zu Art. 6', onErneut: () => undefined }}>{null}</BlattArtikelGruppe>,
    );
    expect(html).toContain('Erläuterungen zu Art. 6 konnten nicht geladen werden.');
    expect(html).toContain('Erneut laden');
    expect(html).toContain('data-v3-blatt-fehler');
    expect(html).toContain('data-v3-blatt-artikel="6"');
    expect(html).not.toContain('nichts erfasst');
  });
});
