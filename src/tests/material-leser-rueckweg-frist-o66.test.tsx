/**
 * LESER-NAV Paket C (16.10.2026) · O-66 (b): der Rückweg-Knopf des Material-Lesers darf nicht
 * von einem Ladevorgang abhängen.
 *
 * O-53 (#1386) hält den Knopf «← Alle Materialien» unsichtbar, solange das Kontext-Panel
 * `data-kontext-laedt` trägt (Lade-CLS). Hängt ein Abruf (gemessen am 16.10.2026: Abruf von
 * `/rechtsprechung/norm-index-erlasse.json` offen ⇒ nach 20 s noch `visibility: hidden`),
 * stand die Marke für immer und der Rückweg blieb verborgen. Jetzt gilt eine Frist
 * (`KONTEXT_FRIST_MS` = 10 s ab dem Stehen des Materials): danach fällt die Unsichtbarkeit ab,
 * die Marke am Panel bleibt unberührt.
 *
 * Geprüft wird die Klasse am Knopf-Block (der Tailwind-Variant `group-has-[…]:invisible` ist
 * die einzige Quelle der Unsichtbarkeit; ihre Wirkung im Browser misst die e2e-Spec
 * `e2e/leser-lade-cls.e2e.ts`, Fall «hängender Abruf»).
 *
 * ROT ZU BEKOMMEN (§6.7): in `MaterialLeser.tsx` `kontextFristAbgelaufen` fest `false` setzen
 * ⇒ Fall 2 rot; die Frist auf `0` ⇒ Fall 1 rot (Knopf von Anfang an sichtbar).
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaterialLeser } from '../pages/MaterialLeser';
import type { BrowseMaterial } from '../lib/materialien/typen';

const material = (key: string): BrowseMaterial => ({
  key, behoerde: 'BR', behoerdeName: 'Bundesrat', behoerdeKuerzel: 'BR', doktyp: 'botschaft', doktypLabel: 'Botschaft',
  titel: `Botschaft ${key}`, nummer: '24.001', rechtsgebiet: 'oeffentlich' as BrowseMaterial['rechtsgebiet'],
  sprache: 'de' as BrowseMaterial['sprache'], status: 'nur-live-link' as BrowseMaterial['status'],
  quelleUrl: 'https://www.fedlex.admin.ch/', stand: '2024-11-20', rang: 1, normKeys: [], hinweis: null,
});

vi.mock('../lib/materialien/browse', async (orig) => {
  const m = await orig<typeof import('../lib/materialien/browse')>();
  return { ...m, ladeMaterial: async (key: string) => material(key) };
});
// Das Panel hängt: es trägt die Lade-Marke und löst sie nie auf (hängender Abruf).
vi.mock('../components/kontext/KontextPanel', () => ({
  KontextPanel: () => createElement('section', { 'aria-labelledby': 'kontext-titel', 'data-kontext-laedt': '' }),
}));

let root: Root | null = null;
let ziel: HTMLElement;

async function rendere(pfad = '/materialien/A') {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => null }) as unknown as Response));
  ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(MemoryRouter, { initialEntries: [pfad] },
      createElement(Routes, null, createElement(Route, { path: '/materialien/:key', element: createElement(MaterialLeser) }))));
  });
  // ladeMaterial ist ein aufgelöstes Promise — Mikrotasks abwarten (Fake-Timer lassen sie laufen).
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

/** Der Block um den Rückweg-Knopf (Elternelement des Links). */
const knopfBlock = () => {
  const link = [...ziel.querySelectorAll('a')].find((a) => (a.textContent ?? '').includes('← Alle Materialien'));
  return link!.parentElement as HTMLElement;
};
const unsichtbar = () => (knopfBlock().getAttribute('class') ?? '').includes('group-has-[[data-kontext-laedt]]/material:invisible');

beforeEach(() => { vi.useFakeTimers(); });
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('O-66 · Rückweg-Knopf des Material-Lesers hängt nicht am Abschluss eines Ladevorgangs', () => {
  it('1 · solange das Panel lädt und die Frist läuft, ist der Knopf unsichtbar (O-53 bleibt)', async () => {
    await rendere();
    expect(ziel.querySelector('[data-kontext-laedt]')).not.toBeNull();
    expect(unsichtbar()).toBe(true);
    await act(async () => { vi.advanceTimersByTime(9_900); });
    expect(unsichtbar()).toBe(true);
  });

  it('2 · nach der Frist ist der Knopf sichtbar, obwohl das Panel weiter «lädt» (hängender Abruf)', async () => {
    await rendere();
    await act(async () => { vi.advanceTimersByTime(10_100); });
    expect(ziel.querySelector('[data-kontext-laedt]')).not.toBeNull();
    expect(unsichtbar()).toBe(false);
  });
});
