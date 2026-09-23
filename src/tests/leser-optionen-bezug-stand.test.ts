// S6-W1b (23.9.2026) · Bezugs-Stand des Leser-Speichers: der alte Bezugs-
// Grundzustand `['bge']` wird EINMAL auf den neuen Grundzustand (alle Instanzen)
// gehoben — eine erkennbare Nutzerwahl bleibt, und die D40-Frage (`stand`, `f`)
// bleibt unberührt. Herleitung: `BEZUG_STAND` in
// `pages/gesetz-leser/leserOptionen.ts`.
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

  it('ohne Bezugs-Stand: zurückgeschriebenes [bge] ⇒ gehoben auf alle Instanzen', async () => {
    const { holeBezugKlassen } = await frischerStore({ bezugKlassen: ['bge'], stand: 2 });
    expect([...holeBezugKlassen()]).toEqual(ALLE);
  });

  it('ohne Bezugs-Stand: andere Wahl ⇒ unangetastet', async () => {
    const { holeBezugKlassen } = await frischerStore({ bezugKlassen: ['kantonal'], stand: 2 });
    expect([...holeBezugKlassen()]).toEqual(['kantonal']);
  });

  it('mit Bezugs-Stand ist [bge] eine echte Wahl ⇒ bleibt', async () => {
    const { holeBezugKlassen } = await frischerStore({ bezugKlassen: ['bge'], stand: 2, bezugStand: 1 });
    expect([...holeBezugKlassen()]).toEqual(['bge']);
  });

  it('die D40-Frage bleibt unberührt: `stand: 2` hält ein abgewähltes `f`', async () => {
    const { migriereOptFelder } = await frischerStore();
    expect(migriereOptFelder({ fussRubriken: ['r'], stand: 2, bezugStand: 1 }).fussRubriken).toEqual(['r']);
    expect(migriereOptFelder({ fussRubriken: ['r'] }).fussRubriken).toEqual(['f', 'r']);
  });

  it('Speichern schreibt den Bezugs-Stand — danach ist [bge] eine Wahl', async () => {
    const { setzeBezugKlassen } = await frischerStore({ bezugKlassen: ['bge'], stand: 2 });
    setzeBezugKlassen(['bge']);
    expect(JSON.parse(speicher.get(KEY) ?? '{}')).toMatchObject({ stand: 2, bezugStand: 1, bezugKlassen: ['bge'] });
  });
});
