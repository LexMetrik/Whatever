/**
 * W2·17-UI-BEFUNDE · Nachzug der Prüfung von #1265 — schnelle j/k-Folgen im EINZELMODUS.
 *
 * Der Einzelmodus reicht der Tastatur den GEZEIGTEN Artikel (`einzel.token`, aus dem Router-Hash).
 * Der Hash ändert sich erst nach dem Render der Navigation; die Tastatur las ihn über eine Ref, die
 * ein Effekt NACH dem Render nachführt. Zwei Tasten vor diesem Render (Tastenwiederholung, ~30 ms)
 * sahen darum beide denselben «jetzt»-Artikel und sprangen beide zum selben Ziel — ein Schritt ging verloren.
 *
 * Sonde: die ECHTE `LeserTastatur` (linkedom + react-dom/client, kein Browser) mit EINGEFRORENEM
 * `aktivToken` — das ist genau der Zustand «Navigation noch nicht gerendert». Gesamtansicht
 * (`onBlaettern` ungesetzt) bleibt, wie sie war: dort führt der Scroll-Spy.
 *
 * ROT ZU BEKOMMEN (§6.7): in `parts/LeserTastatur.tsx` die Zeile `aktivRef.current = liste[ziel]`
 * (Einzelmodus-Zweig) entfernen — (a) und (c) fallen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeserTastatur } from '../pages/gesetz-leser/parts/LeserTastatur';

let root: Root | null = null;
const TOKENS = ['1', '2', '3', '4', '5'];

type Taste = (key: string) => void;

/** Baut den Leser auf: ein `window` mit echten Listenern, damit der eine Listener der Tastatur erreichbar ist. */
async function aufbauen(opts: { aktivToken: string | null; einzel: boolean; spruenge: string[] }): Promise<Taste> {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const listener: Array<(e: unknown) => void> = [];
  vi.stubGlobal('window', {
    document,
    addEventListener: (art: string, fn: (e: unknown) => void) => { if (art === 'keydown') listener.push(fn); },
    removeEventListener: (_art: string, fn: (e: unknown) => void) => { const i = listener.indexOf(fn); if (i >= 0) listener.splice(i, 1); },
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(LeserTastatur, {
      tokens: TOKENS, aktivToken: opts.aktivToken, onSprung: (t: string) => { opts.spruenge.push(t); },
      onBlaettern: opts.einzel ? () => {} : undefined,
    }));
  });
  return (key) => { for (const fn of listener) fn({ key, target: null, metaKey: false, ctrlKey: false, altKey: false, preventDefault() {} }); };
}

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('schnelle j/k-Folgen verlieren im Einzelmodus keinen Schritt', () => {
  it('(a) Einzelmodus: j, j, k ohne dazwischen gerenderten Artikel → 2, 3, 2', async () => {
    const spruenge: string[] = [];
    const taste = await aufbauen({ aktivToken: '1', einzel: true, spruenge });
    taste('j'); taste('j'); taste('k');
    expect(spruenge).toEqual(['2', '3', '2']);
  });

  it('(b) Gesamtansicht bleibt wie sie war: der Scroll-Spy führt, die Taste rechnet vom Spy-Stand', async () => {
    const spruenge: string[] = [];
    const taste = await aufbauen({ aktivToken: '1', einzel: false, spruenge });
    taste('j'); taste('j');
    expect(spruenge).toEqual(['2', '2']);
  });

  it('(c) am Rand bleibt es stehen: j auf dem vorletzten Artikel springt einmal, nicht dreimal', async () => {
    const spruenge: string[] = [];
    const taste = await aufbauen({ aktivToken: '4', einzel: true, spruenge });
    taste('j'); taste('j'); taste('j');
    expect(spruenge).toEqual(['5']);
  });
});
