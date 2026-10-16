/**
 * LESER-NAV O-72 · Reiter «Änderungen» und «Materialien» zeigten beim Laden nur die
 * zugeklappte Zeile «▸ Alle … des Erlasses», kein Wort vom Laden (ohne Zahl steht die
 * Erlass-Tafel zugeklappt, ihr «… werden geladen …» hinter der Klappzeile). Gleiche
 * Lücke wie E8-B01/O-29 für die Erläuterungen (`leser-erlaeuterungen-laden-o29-lesernav`).
 *
 * ROT ZU BEKOMMEN (§6.7): in `PanelTafeln` die Zeilen `aenderungenLaedt && …` bzw.
 * `materialienLaedt && …` streichen ⇒ Fälle 1 und 3 rot.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePanelTafeln } from '../pages/gesetz-leser/v3/PanelTafeln';
import { _leereRevisionenCache } from '../lib/normtext/revisionen';
import { _leereMaterialManifestCache } from '../lib/materialien/browse';
import type { NormSnapshot } from '../lib/normtext/typen';

let root: Root | null = null;
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
  _leereRevisionenCache();
  _leereMaterialManifestCache();
});

const SIDECAR = { erlassKey: 'O72', sr: '1', abgerufen: '2026-10-01', reichweite: null, revisionen: [
  { art: 'aenderung', dateEntryInForce: '2020-01-01', ocUri: 'https://x/oc/1', titelDe: 'Eine Änderung', quelleUrl: 'https://x' },
] };

async function tafelText(tafel: 'aenderungen' | 'materialien', haengt: boolean, ebene: 'bund' | 'kanton' = 'bund') {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    requestIdleCallback: (cb: () => void) => globalThis.setTimeout(cb, 0) as unknown as number,
    cancelIdleCallback: (id: number) => globalThis.clearTimeout(id),
  }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (haengt) return new Promise<Response>(() => {});
    const json = (status: number, body: unknown) => ({ ok: status < 400, status, headers: { get: () => 'application/json' }, json: async () => body }) as unknown as Response;
    return String(url).includes('/normtext/revisionen/') ? json(200, SIDECAR) : json(404, null);
  }));
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  function Sonde() {
    const t = usePanelTafeln({
      erlassKey: 'O72', laden: true, quelleUrl: 'https://www.fedlex.admin.ch/', ebene, stichtag: null,
      aktArtikel: '6', artikelLabel: 'Art. 6', blatt: { eintrag: { artikel: '6' } as unknown as NormSnapshot },
      normZitat: 'Art. 6 X', wort: 'Artikel', historie: { wert: null, fertig: true },
    });
    return createElement('div', null, t.tafeln[tafel]);
  }
  root = createRoot(ziel);
  await act(async () => { root!.render(createElement(MemoryRouter, null, createElement(Sonde))); });
  for (let i = 0; i < 10; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
  return {
    text: (ziel.textContent ?? '').replace(/\s+/g, ' '),
    aenderungenLaedt: ziel.querySelectorAll('[data-v3-aenderungen-laedt]').length,
    materialienLaedt: ziel.querySelectorAll('[data-v3-materialien-laedt]').length,
    klappzeilen: ziel.querySelectorAll('[data-v3-blatt-erlassteil]').length,
  };
}

describe('O-72 · Reiter «Änderungen»: Laden ist sichtbar', () => {
  it('1 · Sidecar unterwegs: «Änderungen werden geladen …» über der zugeklappten Zeile', async () => {
    const r = await tafelText('aenderungen', true);
    expect(r.aenderungenLaedt).toBe(1);
    expect(r.text).toContain('Änderungen werden geladen …');
    expect(r.klappzeilen).toBe(1);
  });

  it('2 · geladen: keine Ladezeile mehr, Klappzeile mit Zahl', async () => {
    const r = await tafelText('aenderungen', false);
    expect(r.aenderungenLaedt).toBe(0);
    expect(r.text).not.toContain('werden geladen');
    expect(r.klappzeilen).toBe(1);
    expect(r.text).toContain('Alle Änderungen des Erlasses');
  });

  it('5 · Kanton: die Tafel steht sofort offen (Sperre), keine zusätzliche Ladezeile über einer Klappzeile', async () => {
    const r = await tafelText('aenderungen', true, 'kanton');
    expect(r.aenderungenLaedt).toBe(0);
    expect(r.klappzeilen).toBe(0);
  });
});

describe('O-72 · Reiter «Materialien»: Laden ist sichtbar', () => {
  it('3 · Manifest unterwegs: «Materialien werden geladen …» über der zugeklappten Zeile', async () => {
    const r = await tafelText('materialien', true);
    expect(r.materialienLaedt).toBe(1);
    expect(r.text).toContain('Materialien werden geladen …');
    expect(r.klappzeilen).toBe(1);
  });

  it('4 · geladen: keine Ladezeile mehr', async () => {
    const r = await tafelText('materialien', false);
    expect(r.materialienLaedt).toBe(0);
    expect(r.text).not.toContain('werden geladen');
  });
});
