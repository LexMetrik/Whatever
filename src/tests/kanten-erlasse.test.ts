import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ladeKantenShard, _leereKantenShardCache } from '../lib/materialien/kanten-shard';
import { KANTEN_ERLASSE } from '../lib/materialien/kanten-erlasse.generated';
import {
  kantenErlasseAusVerzeichnis,
  renderKantenErlasse,
  KANTEN_ERLASSE_PFAD,
} from '../../scripts/materialien/kanten-erlasse';

// ─── Posten 2026-09-24 «Konsolen-404 materialien/kanten» (W2·29-WERKBANK-LESER) ──
// Repro (Prod, 24.9.2026): curl lexmetrik.vercel.app/materialien/kanten/KVG.json → 404,
// …/DBG.json → 200. Der Loader fetchte blind; jeder Erlass ohne Shard = ein Konsolen-404.
// Pflicht-Beweise: (a) jeder existierende Shard wird weiterhin geholt (Menge vorher =
// nachher, aus dem Verzeichnis gezählt), (b) ohne Shard KEIN Fetch, (c) Liste = Verzeichnis
// byte-genau (Drift-Schutz; dasselbe prüft check:materialien).

const wurzel = resolve(__dirname, '../..');
const KANTEN_DIR = resolve(wurzel, 'public/materialien/kanten');

function stubFetch() {
  const f = vi.fn(async (url: string) => {
    const m = /\/materialien\/kanten\/([^/]+)\.json$/.exec(url);
    const key = m ? decodeURIComponent(m[1]) : '';
    const body = { erzeugt: '2026-09-24', erlass: key, dokumente: {}, kanten: [] };
    return { ok: true, status: 200, json: async () => body } as unknown as Response;
  });
  vi.stubGlobal('fetch', f);
  return f;
}

afterEach(() => {
  vi.unstubAllGlobals();
  _leereKantenShardCache();
});

describe('Kanten-Existenzliste (kein Netz-404 für Erlasse ohne Shard)', () => {
  it('(c) generierte Liste = Top-Level-Shard-Köpfe im Verzeichnis, byte-genau', () => {
    const ausVerzeichnis = kantenErlasseAusVerzeichnis(KANTEN_DIR);
    expect(ausVerzeichnis.length).toBeGreaterThan(0);
    expect([...KANTEN_ERLASSE].sort()).toEqual(ausVerzeichnis);
    expect(readFileSync(resolve(wurzel, KANTEN_ERLASSE_PFAD), 'utf8')).toBe(renderKantenErlasse(ausVerzeichnis));
  });

  it('(a) jeder Erlass MIT Shard wird weiterhin genau einmal geholt', async () => {
    const f = stubFetch();
    const keys = kantenErlasseAusVerzeichnis(KANTEN_DIR);
    for (const k of keys) {
      const shard = await ladeKantenShard(k);
      expect(shard, k).not.toBeNull();
      expect(shard!.erlass).toBe(k);
    }
    const geholt = f.mock.calls.map((c) => String(c[0]));
    expect(geholt).toEqual(keys.map((k) => `/materialien/kanten/${encodeURIComponent(k)}.json`));
  });

  it('(b) Erlass OHNE Shard: null ohne jeden Fetch', async () => {
    const f = stubFetch();
    const ohne = ['KVG', 'ZPO', 'OR', 'ZGB', 'mwstg'];
    for (const k of ohne) expect(KANTEN_ERLASSE.has(k), k).toBe(false);
    for (const k of ohne) expect(await ladeKantenShard(k), k).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it('renderKantenErlasse ist deterministisch (Reihenfolge/Duplikate egal)', () => {
    expect(renderKantenErlasse(['B', 'A', 'B'])).toBe(renderKantenErlasse(['A', 'B']));
  });
});
