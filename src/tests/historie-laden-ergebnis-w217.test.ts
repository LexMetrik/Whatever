/**
 * W2·17-UI-BEFUNDE · PE-F10-B01 (1.10.2026): `ladeHistorieShardErgebnis` trennt «kein Shard»
 * (404 bzw. SPA-Rückfall) von «nicht erreichbar». `ladeHistorieShard` bleibt unverändert
 * (siehe `historie-laden.test.ts`, null in beiden Fällen) — der Ergebnis-Lader ist der
 * zweite Zugang für Flächen, die den Unterschied brauchen.
 *
 * ROT ZU BEKOMMEN (§6.7): im 404-Zweig `fehler: true` setzen bzw. im Fehlerzweig das
 * `shardPromises.delete` streichen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ladeHistorieShardErgebnis, ladeHistorieShard, _leereHistorieCache, type HistorieShard } from '../lib/normtext/historie-laden';

const SHARD = { erlass: 'UVG', abdeckung: { fussnoten: 1, ereignis: 1, referenz: 0, unparsed: 0 }, artikel: {}, residuum: [] } as unknown as HistorieShard;

function antwort(status: number, o: { ct?: string; body?: unknown } = {}) {
  return {
    status, ok: status >= 200 && status < 300,
    headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? (o.ct ?? 'application/json') : null) },
    json: async () => { if (o.ct?.includes('html')) throw new SyntaxError('<'); return o.body; },
  } as unknown as Response;
}

beforeEach(() => { _leereHistorieCache(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('ladeHistorieShardErgebnis', () => {
  it('Shard da: { shard, fehler: false }, gecacht (ein Fetch)', async () => {
    const f = vi.fn(async () => antwort(200, { body: SHARD }));
    vi.stubGlobal('fetch', f);
    expect(await ladeHistorieShardErgebnis('UVG')).toEqual({ shard: SHARD, fehler: false });
    await ladeHistorieShardErgebnis('UVG');
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('404: kein Shard, KEIN Fehler, gecacht', async () => {
    const f = vi.fn(async () => antwort(404));
    vi.stubGlobal('fetch', f);
    expect(await ladeHistorieShardErgebnis('KANTON')).toEqual({ shard: null, fehler: false });
    await ladeHistorieShardErgebnis('KANTON');
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('200 text/html (SPA-Rückfall): kein Shard, KEIN Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200, { ct: 'text/html' })));
    expect(await ladeHistorieShardErgebnis('KANTON')).toEqual({ shard: null, fehler: false });
  });
  it('Netzfehler und 5xx: fehler: true, NICHT gecacht (Neuversuch liefert den Shard)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    expect(await ladeHistorieShardErgebnis('UVG')).toEqual({ shard: null, fehler: true });
    vi.stubGlobal('fetch', vi.fn(async () => antwort(503)));
    expect(await ladeHistorieShardErgebnis('UVG')).toEqual({ shard: null, fehler: true });
    vi.stubGlobal('fetch', vi.fn(async () => antwort(200, { body: SHARD })));
    expect(await ladeHistorieShardErgebnis('UVG')).toEqual({ shard: SHARD, fehler: false });
  });
  it('ladeHistorieShard (Alt-Zugang) liefert weiter null in beiden Fällen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => antwort(404)));
    expect(await ladeHistorieShard('A')).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('x'); }));
    expect(await ladeHistorieShard('B')).toBeNull();
  });
});
