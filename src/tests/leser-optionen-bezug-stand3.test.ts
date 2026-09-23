// S6-W1b (23.9.2026) · Stand 3 des Leser-Speichers: der alte Bezugs-Grundzustand
// `['bge']` wird EINMAL auf den neuen Grundzustand (alle Instanzen) gehoben —
// eine erkennbare Nutzerwahl bleibt, `f` (D40) wird dabei nicht wieder eingefügt.
// Herleitung: `OPT_STAND` in `pages/gesetz-leser/leserOptionen.ts`.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const speicher = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, String(v)); },
    removeItem: (k: string) => { speicher.delete(k); },
    clear: () => { speicher.clear(); },
  },
});
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: { documentElement: { setAttribute: () => {}, getAttribute: () => null, removeAttribute: () => {} } },
});

const KEY = 'lm.leser.optionen';
const ALLE = ['bge', 'bger', 'eidg', 'kantonal'];

async function frischerStore(gespeichert?: Record<string, unknown>) {
  localStorage.clear();
  if (gespeichert) localStorage.setItem(KEY, JSON.stringify(gespeichert));
  vi.resetModules();
  const mod = await import('../pages/gesetz-leser/leserOptionen');
  mod.wendeLeserOptionenAn();
  return mod;
}

describe('S6-W1b · Bezugs-Grundzustand im Bestands-Speicher', () => {
  beforeEach(() => { localStorage.clear(); });

  it('ohne Speicher: alle Instanzen', async () => {
    const { holeBezugKlassen } = await frischerStore();
    expect([...holeBezugKlassen()]).toEqual(ALLE);
  });

  it('Stand 2 mit zurückgeschriebenem [bge] ⇒ gehoben auf alle Instanzen', async () => {
    const { holeBezugKlassen } = await frischerStore({ bezugKlassen: ['bge'], stand: 2 });
    expect([...holeBezugKlassen()]).toEqual(ALLE);
  });

  it('Stand 2 mit anderer Wahl ⇒ unangetastet', async () => {
    const { holeBezugKlassen } = await frischerStore({ bezugKlassen: ['kantonal'], stand: 2 });
    expect([...holeBezugKlassen()]).toEqual(['kantonal']);
  });

  it('Stand 3 mit [bge] ist eine echte Wahl ⇒ bleibt', async () => {
    const { holeBezugKlassen } = await frischerStore({ bezugKlassen: ['bge'], stand: 3 });
    expect([...holeBezugKlassen()]).toEqual(['bge']);
  });

  it('der Stand-Sprung fügt ein bei Stand 2 abgewähltes `f` NICHT wieder ein (D40)', async () => {
    const { migriereOptFelder } = await frischerStore();
    expect(migriereOptFelder({ fussRubriken: ['r'], stand: 2 }).fussRubriken).toEqual(['r']);
    expect(migriereOptFelder({ fussRubriken: ['r'], stand: 3 }).fussRubriken).toEqual(['r']);
    expect(migriereOptFelder({ fussRubriken: ['r'] }).fussRubriken).toEqual(['f', 'r']);
  });

  it('Speichern schreibt Stand 3', async () => {
    const { setzeBezugKlassen } = await frischerStore({ bezugKlassen: ['bge'], stand: 2 });
    setzeBezugKlassen(['bge']);
    expect(JSON.parse(speicher.get(KEY) ?? '{}')).toMatchObject({ stand: 3, bezugKlassen: ['bge'] });
  });
});
