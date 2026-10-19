/**
 * LESER-NAV Paket E (15.10.2026) · O-53: Lade-CLS im Material-Leser ab 1440 px.
 *
 * Das Kontext-Panel wächst nach dem Laden der Entscheide von ≈ 200 auf bis ≈ 1170 px.
 * Der Leser hält den Rückweg-Knopf darum unsichtbar (`visibility`, Platz bleibt), solange
 * das Panel `data-kontext-laedt` trägt — ein Shift unsichtbarer Elemente zählt nicht.
 * Die Verhaltens-Aussage («kein Footer-/Knopf-Sprung») prüft `e2e/leser-lade-cls.e2e.ts`;
 * hier stehen die beiden Hälften, die sie zusammenhalten:
 *   · das Panel setzt die Marke, solange Entscheide laden, und nimmt sie danach zurück
 *     (Randfall: leeres Ergebnis ⇒ Marke weg, kein Dauer-Unsichtbar);
 *   · der Leser trägt die Mindesthöhe und die Kopplung an die Marke.
 *
 * ROT ZU BEKOMMEN (§6.7): in `KontextPanel.tsx` `data-kontext-laedt` streichen ⇒ Test 1 rot;
 * `kontextLaedt` fest `true` ⇒ Test 2 rot (Marke bleibt nach dem Laden stehen).
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KontextPanel } from '../components/kontext/KontextPanel';

const steuer = vi.hoisted(() => ({ weiter: null as null | (() => void) }));
vi.mock('../lib/kontext', async (orig) => {
  const m = await orig<typeof import('../lib/kontext')>();
  return {
    ...m,
    kontextEntscheide: () => new Promise((res) => { steuer.weiter = () => res([]); }),
  };
});

let root: Root | null = null;
let ziel: HTMLElement;

async function rendere() {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    requestIdleCallback: (cb: () => void) => globalThis.setTimeout(cb, 0) as unknown as number,
    cancelIdleCallback: (id: number) => globalThis.clearTimeout(id),
  }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => null }) as unknown as Response));
  ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(MemoryRouter, null, createElement(KontextPanel, { typ: 'material', normKeys: ['ARG'] })));
  });
}
const settle = async () => { for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); }); };
const marke = () => ziel.querySelector('section[aria-labelledby="kontext-titel"]')!.hasAttribute('data-kontext-laedt');

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  steuer.weiter = null;
  vi.unstubAllGlobals();
});

describe('O-53 · Lade-Marke am Kontext-Panel', () => {
  it('1 · solange die Entscheide laden, trägt das Panel `data-kontext-laedt`', async () => {
    await rendere();
    await settle();
    expect(marke()).toBe(true);
  });

  it('2 · nach dem Laden (auch bei leerem Ergebnis) ist die Marke weg', async () => {
    await rendere();
    await settle();
    expect(marke()).toBe(true);
    await act(async () => { steuer.weiter!(); });
    await settle();
    expect(marke()).toBe(false);
  });
});

describe('O-53 · Material-Leser koppelt Mindesthöhe und Rückweg-Knopf an die Marke', () => {
  const quelle = readFileSync(new URL('../pages/MaterialLeser.tsx', import.meta.url), 'utf8');
  it('3 · Artikel trägt `min-h-inhalt-region` (wie die Ladeanzeige) und `group/material`', () => {
    expect(quelle).toMatch(/<article className="[^"]*\bmin-h-inhalt-region\b[^"]*\bgroup\/material\b|<article className="[^"]*\bgroup\/material\b[^"]*\bmin-h-inhalt-region\b/);
  });
  it('4 · der Rückweg-Knopf-Block ist unsichtbar, solange die Marke steht', () => {
    expect(quelle).toContain('group-has-[[data-kontext-laedt]]/material:invisible');
  });
});
