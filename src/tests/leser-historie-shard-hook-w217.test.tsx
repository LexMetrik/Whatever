/**
 * W2·17-UI-BEFUNDE · PE-F10-B01 (1.10.2026) — `useHistorieShard`: der Lese-Zustand trennt
 * «kein Shard» von «Netzfehler» und bietet den Neuversuch. Geprüft wird der Zustandsablauf
 * (lädt → Fehler → Neuversuch → da), den das Blatt für «nichts erfasst» braucht.
 *
 * ROT ZU BEKOMMEN (§6.7): in `useHistorieShard` `fehler` nie setzen (Fehlerfall wird stumm)
 * bzw. `shard.versuch === versuch` streichen (der alte Fehler steht während des Neuversuchs).
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHistorieShard, type HistorieStand } from '../pages/gesetz-leser/useHistorieShard';
import { _leereHistorieCache, type HistorieShard } from '../lib/normtext/historie-laden';

const SHARD = { erlass: 'UVG', abdeckung: { fussnoten: 0, ereignis: 0, referenz: 0, unparsed: 0 }, artikel: {}, residuum: [] } as unknown as HistorieShard;
const ok = (body: unknown) => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body }) as unknown as Response;
const tot = (status: number) => ({ ok: false, status, headers: { get: () => null }, json: async () => null }) as unknown as Response;

let root: Root | null = null;
let stand: HistorieStand | null = null;

async function mount(erlassKey: string) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  // Leerlauf sofort (die Produktion wartet bis 1200 ms) — sonst wartet der Test auf den Zeitgeber.
  Object.assign(window, {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    requestIdleCallback: (cb: () => void) => globalThis.setTimeout(cb, 0), cancelIdleCallback: () => undefined,
  });
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  function Sonde() { stand = useHistorieShard(erlassKey).historieStand; return null; }
  await act(async () => { root!.render(createElement(Sonde)); });
}
const warte = async () => { for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); }); };

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals(); _leereHistorieCache(); stand = null;
});

describe('useHistorieShard', () => {
  it('Netzfehler → fertig + fehler (wert null); «erneut» → lädt wieder, dann Shard ohne Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await mount('UVG');
    await warte();
    expect(stand).toMatchObject({ fertig: true, fehler: true, wert: null });
    expect(typeof stand?.erneut).toBe('function');

    vi.stubGlobal('fetch', vi.fn(async () => ok(SHARD)));
    await act(async () => { stand!.erneut!(); });
    expect(stand?.fertig).toBe(false); // während des Neuversuchs steht nicht der alte Fehler
    await warte();
    expect(stand).toMatchObject({ fertig: true, wert: SHARD });
    expect(stand?.fehler).toBeUndefined();
  });
  it('404 (kein Shard): fertig, KEIN Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => tot(404)));
    await mount('KANTON');
    await warte();
    expect(stand).toMatchObject({ fertig: true, wert: null });
    expect(stand?.fehler).toBeUndefined();
  });
  it('ohne Erlass-Key: nie fertig, kein Abruf', async () => {
    const f = vi.fn(async () => tot(404));
    vi.stubGlobal('fetch', f);
    await mount(undefined as unknown as string);
    await warte();
    expect(stand?.fertig).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
