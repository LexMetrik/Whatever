import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ladeHistorieShardErgebnis,
  historieFuerArtikel,
  _leereHistorieCache,
  type HistorieShard,
} from '../lib/normtext/historie-laden';

// G-HIST-UI · Client-Loader der Per-Artikel-Historie-Shards. Reine Ladeschicht (§3):
// EIN Fetch je Erlass (gecacht), direkter Roh-Token-Lookup. Kein Parsen hier.
// 404 und transienter Fehler: `historie-laden-ergebnis-w217.test.ts`.

const SHARD: HistorieShard = {
  erlass: 'BGBM',
  abdeckung: { fussnoten: 3, ereignis: 2, referenz: 1, unparsed: 0 },
  artikel: {
    '2': {
      giltSeit: '2025-01-01',
      ereignisse: [
        { typ: 'eingefuegt', datum: null, wirkung: false, quellen: [{ label: 'AS 2024 1', url: 'https://x/1' }], absatz: '1', item: null },
        { typ: 'fassung', datum: '2025-01-01', wirkung: false, quellen: [], absatz: null, item: null },
      ],
    },
    '9': {
      giltSeit: '2010-06-01',
      aufgehobenSeit: '2020-01-01',
      ereignisse: [{ typ: 'aufgehoben', datum: '2020-01-01', wirkung: true, quellen: [], absatz: null, item: null }],
    },
  },
  residuum: [],
};

function mockFetch(status: number, body?: unknown) {
  return vi.fn(async () => {
    return {
      status,
      ok: status >= 200 && status < 300,
      json: async () => body,
    } as Response;
  });
}

beforeEach(() => { _leereHistorieCache(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('ladeHistorieShardErgebnis', () => {
  // 404, SPA-Rückfall, Netz-/5xx-Fehler samt Nicht-Cachen: `historie-laden-ergebnis-w217.test.ts`.
  it('lädt den Shard von der Erlass-URL und cacht (nur EIN Fetch je Key, gleiche Objekt-Identität)', async () => {
    const f = mockFetch(200, SHARD);
    vi.stubGlobal('fetch', f);
    const a = await ladeHistorieShardErgebnis('BGBM');
    const b = await ladeHistorieShardErgebnis('BGBM');
    expect(a).toEqual({ shard: SHARD, fehler: false });
    expect(b).toBe(a);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/normtext/historie/BGBM.json');
  });
});

describe('historieFuerArtikel', () => {
  it('direkter Roh-Token-Lookup', () => {
    expect(historieFuerArtikel(SHARD, '2')?.giltSeit).toBe('2025-01-01');
    expect(historieFuerArtikel(SHARD, '9')?.aufgehobenSeit).toBe('2020-01-01');
  });
  it('Artikel ohne Eintrag → undefined (kein Badge)', () => {
    expect(historieFuerArtikel(SHARD, '1')).toBeUndefined();
  });
  it('null/undefined Shard → undefined', () => {
    expect(historieFuerArtikel(null, '2')).toBeUndefined();
    expect(historieFuerArtikel(undefined, '2')).toBeUndefined();
  });
});
