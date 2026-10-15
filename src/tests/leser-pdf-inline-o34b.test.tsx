/**
 * LESER-NAV/O-34b · «PDF-Platzhalter endlos» (PA-13-D02).
 *
 * Reproduktion 15.10.2026: Playwright-Chromium (headless shell) hat
 * `navigator.pdfViewerEnabled === false`, der iframe in `PdfEmbedAnsicht` feuert
 * nie `load`, der Spinner «Amtliches PDF wird geladen …» blieb für immer. Mit
 * Viewer (`channel: 'chromium'`) verschwand er. Geprüft wird die Entscheidung
 * (`pdfAnzeige`) und der Hook (`usePdfAnzeige`): ohne Viewer «ohne-viewer», sonst
 * «inline»; der Zeitdeckel lässt den Spinner nach `PDF_LADE_DECKEL_MS` fallen,
 * solange `bereit` nicht wahr wurde; ein bereites PDF braucht den Deckel nicht.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PDF_LADE_DECKEL_MS, pdfAnzeige, usePdfAnzeige } from '../pages/gesetz-leser/pdfInline';

describe('pdfAnzeige (reine Entscheidung)', () => {
  it('ohne PDF-Viewer (ausdrücklich false) ⇒ ohne-viewer', () => {
    expect(pdfAnzeige({ pdfViewerEnabled: false })).toBe('ohne-viewer');
  });
  it('mit Viewer ⇒ inline', () => {
    expect(pdfAnzeige({ pdfViewerEnabled: true })).toBe('inline');
  });
  it('Randfälle: Eigenschaft fehlt, kein navigator ⇒ inline (bisheriges Verhalten)', () => {
    expect(pdfAnzeige({})).toBe('inline');
    expect(pdfAnzeige(null)).toBe('inline');
    expect(pdfAnzeige(undefined)).toBe('inline');
  });
});

let root: Root | null = null;
let letzte: { anzeige: string; deckelAbgelaufen: boolean } | null = null;

function Sonde({ bereit }: { bereit: boolean }) {
  letzte = usePdfAnzeige(bereit);
  return null;
}

function aufbauen(pdfViewerEnabled: boolean | undefined): HTMLElement {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', {
    document,
    setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('navigator', { pdfViewerEnabled });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return document.getElementById('app') as unknown as HTMLElement;
}

async function rendern(ziel: HTMLElement, bereit: boolean) {
  if (!root) root = createRoot(ziel);
  await act(async () => { root!.render(createElement(Sonde, { bereit })); });
}

describe('usePdfAnzeige (Hook)', () => {
  beforeEach(() => { vi.useFakeTimers(); letzte = null; });
  afterEach(async () => {
    if (root) { const r = root; root = null; await act(async () => r.unmount()); }
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('erster Render ist «inline» (Prerender-Gleichheit), dann ohne Viewer «ohne-viewer»', async () => {
    const ziel = aufbauen(false);
    await rendern(ziel, false);
    expect(letzte?.anzeige).toBe('inline');
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(letzte?.anzeige).toBe('ohne-viewer');
  });

  it('mit Viewer bleibt es «inline»', async () => {
    const ziel = aufbauen(true);
    await rendern(ziel, false);
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(letzte?.anzeige).toBe('inline');
  });

  it('Zeitdeckel: ohne load fällt der Spinner nach PDF_LADE_DECKEL_MS, nicht früher', async () => {
    const ziel = aufbauen(undefined);
    await rendern(ziel, false);
    await act(async () => { vi.advanceTimersByTime(PDF_LADE_DECKEL_MS - 1); });
    expect(letzte?.deckelAbgelaufen).toBe(false);
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(letzte?.deckelAbgelaufen).toBe(true);
  });

  it('bereites PDF startet keinen Deckel', async () => {
    const ziel = aufbauen(true);
    await rendern(ziel, true);
    await act(async () => { vi.advanceTimersByTime(PDF_LADE_DECKEL_MS * 2); });
    expect(letzte?.deckelAbgelaufen).toBe(false);
  });
});
