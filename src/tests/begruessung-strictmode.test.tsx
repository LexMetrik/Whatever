import { StrictMode, Suspense, act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waehleBegruessung } from '../lib/begruessungen';

// ─── Einmal-Übernahme unter ECHTEM React-Render (Befund Gegenprüfung 17.9.2026)
//
// Der Vorgänger-Test rief `anfangsGruss` zweimal mit DEMSELBEN Objekt auf und
// bildete damit weder StrictMode noch einen vor dem Commit verworfenen Render
// ab (§6.7: Tor, das nicht scheitern kann). Hier rendert react-dom/client
// (Dev-Build, StrictMode aktiv) die echte `useHeute`-Hook in ein linkedom-DOM.
// Zusagen:
//  1. erster Mount im Tab zeigt den Skript-Gruss — auch unter StrictMode;
//  2. ein Render, den React vor dem Commit verwirft (Suspense), darf den
//     Skript-Gruss nicht «verbrauchen»: der committete Mount zeigt ihn;
//  3. jeder Mount nach dem ersten Commit (SPA-Rückweg) zieht frisch.

const VORGEMALT = 'Vorgemalter Gruss';

let root: Root | null = null;

async function frischesModul() {
  vi.resetModules();
  return import('../components/start/Begruessung');
}

function aufbauen(fensterWerte: Record<string, unknown>) {
  const { window, document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  Object.assign(window, fensterWerte);
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return document.getElementById('app') as unknown as HTMLElement;
}

async function rendern(ziel: HTMLElement, knoten: ReactNode) {
  root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(StrictMode, null, knoten));
  });
}

async function abbauen() {
  if (!root) return;
  const r = root;
  root = null;
  await act(async () => r.unmount());
}

describe('useHeute — Einmal-Übernahme unter StrictMode (echter Render)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('erster Mount zeigt den Skript-Gruss; Remount nach Unmount zieht frisch', async () => {
    const ziel = aufbauen({ __lexmetrikGruss: VORGEMALT });
    const { useHeute } = await frischesModul();
    const gesehen: string[] = [];
    function Sonde() {
      const { gruss } = useHeute();
      gesehen.push(gruss);
      return createElement('h1', null, gruss);
    }
    await rendern(ziel, createElement(Sonde));
    expect(ziel.textContent).toBe(VORGEMALT);
    expect(new Set(gesehen)).toEqual(new Set([VORGEMALT]));

    await abbauen();
    const stunde = new Date().getHours();
    await rendern(ziel, createElement(Sonde));
    const frisch = waehleBegruessung(stunde, () => 0);
    expect(frisch).not.toBe(VORGEMALT);
    expect(ziel.textContent).toBe(frisch);
  });

  it('ein vor dem Commit verworfener Render (Suspense) verbraucht den Skript-Gruss nicht', async () => {
    const ziel = aufbauen({ __lexmetrikGruss: VORGEMALT });
    const { useHeute } = await frischesModul();
    let loesen: () => void = () => {};
    let bereit = false;
    const warten = new Promise<void>((r) => {
      loesen = () => {
        bereit = true;
        r();
      };
    });
    function Sonde() {
      const { gruss } = useHeute();
      if (!bereit) throw warten;
      return createElement('h1', null, gruss);
    }
    await rendern(ziel, createElement(Suspense, { fallback: null }, createElement(Sonde)));
    expect(ziel.textContent).toBe('');
    await act(async () => {
      loesen();
      await warten;
    });
    expect(ziel.textContent).toBe(VORGEMALT);
  });
});
