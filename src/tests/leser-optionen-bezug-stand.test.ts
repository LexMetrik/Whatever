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

  // §6.3-DEKLARATION (S6 W1f, 24.9.2026): hier stand der Fall «die D40-Frage
  // bleibt unberührt: `stand: 2` hält ein abgewähltes `f`». Mit der
  // Funktionszeile fielen die Rubriken-Wahl und ihr Speicher-Stand `stand`
  // (Entscheid David 24.9.2026, «die zeile soll ganz weg»). Die Aussage, die
  // von ihm bleibt — die beiden Stände sind getrennte Fragen —, prüft jetzt:
  // der Bezugs-Stand wird geschrieben, `stand` NICHT mehr.
  it('Speichern schreibt den Bezugs-Stand — danach ist [bge] eine Wahl', async () => {
    const { setzeBezugKlassen } = await frischerStore({ bezugKlassen: ['bge'], stand: 2 });
    setzeBezugKlassen(['bge']);
    const roh = JSON.parse(speicher.get(KEY) ?? '{}');
    expect(roh).toMatchObject({ bezugStand: 1, bezugKlassen: ['bge'] });
    // S6 W1f: der Rubriken-Stand `stand` ist gestrichen und fällt beim Schreiben weg.
    expect(roh).not.toHaveProperty('stand');
  });
});
