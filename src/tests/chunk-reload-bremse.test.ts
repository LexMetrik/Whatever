// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Reload-Bremse bei fehlendem Chunk (Gegenprüfung PR #1282, HOCH, §15) ────
// `lazyRetry` lädt bei einem dauerhaft fehlenden Chunk EINMAL neu und merkt das
// in sessionStorage. Bei gesperrtem Speicher liefert `schreib` false: ohne
// Marke gibt es keine Bremse, jeder Reload scheitert erneut → Endlosschleife
// (gemessen im Browser: 443 Navigationen in 20 s gegen 2 auf main).
// ROT ZU BEKOMMEN: in `lazyRetry.ts` das `&& sitzungsSpeicher.schreib(…)` aus
// der Bedingung nehmen und `schreib` separat aufrufen → der gesperrte Fall wird rot.

type Lazy = { _init: (p: unknown) => unknown; _payload: unknown };

/** Stösst den Lader einer `React.lazy`-Komponente an und liefert sein Ergebnis. */
async function lade(L: Lazy): Promise<'ok' | Error> {
  try {
    L._init(L._payload);
    return 'ok';
  } catch (gewor) {
    if (gewor && typeof (gewor as Promise<unknown>).then === 'function') {
      try { await (gewor as Promise<unknown>); return 'ok'; } catch (e) { return e as Error; }
    }
    return gewor as Error;
  }
}

let reload: ReturnType<typeof vi.fn>;
let altLokal: PropertyDescriptor | undefined;
let altSitzung: PropertyDescriptor | undefined;

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  reload = vi.fn();
  vi.stubGlobal('window', { location: { reload } });
  altLokal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  altSitzung = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  for (const [n, a] of [['localStorage', altLokal], ['sessionStorage', altSitzung]] as const) {
    if (a) Object.defineProperty(globalThis, n, a); else delete (globalThis as Record<string, unknown>)[n];
  }
});

async function fahre(speicher: 'gesperrt' | 'intakt'): Promise<{ ergebnis: 'ok' | Error; reloads: number }> {
  if (speicher === 'gesperrt') {
    const wirft = { configurable: true, get(): never { throw new DOMException('Access is denied', 'SecurityError'); } };
    Object.defineProperty(globalThis, 'localStorage', wirft);
    Object.defineProperty(globalThis, 'sessionStorage', wirft);
  } else {
    const d = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => { d.set(k, v); },
      removeItem: (k: string) => { d.delete(k); }, key: () => null, length: 0,
    });
  }
  const { lazyRetry } = await import('../lazyRetry');
  const L = lazyRetry(() => Promise.reject(new Error('Chunk fehlt'))) as unknown as Lazy;
  const lauf = lade(L);
  await vi.advanceTimersByTimeAsync(10_000);
  return { ergebnis: await lauf, reloads: reload.mock.calls.length };
}

describe('lazyRetry — Reload nur mit gesetzter Marke', () => {
  it('Speicher gesperrt: KEIN Reload, der Fehler geht an die ErrorBoundary (keine Endlosschleife)', async () => {
    const { ergebnis, reloads } = await fahre('gesperrt');
    expect(reloads).toBe(0);
    expect(ergebnis).toBeInstanceOf(Error);
    expect((ergebnis as Error).message).toBe('Chunk fehlt');
  });

  it('Speicher intakt: genau EIN Reload (Bestandsverhalten), danach bremst die Marke', async () => {
    const { reloads } = await fahre('intakt');
    expect(reloads).toBe(1);
  });
});
