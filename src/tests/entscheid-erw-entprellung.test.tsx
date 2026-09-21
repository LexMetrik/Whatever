/**
 * W2·17-UI-BEFUNDE — `useSucheGewertet` (Entscheid-Leser, `entscheidErwEntprellung.ts`).
 *
 * ── WARUM ECHTER REACT-RENDER STATT REINER FUNKTION ─────────────────────────
 * Der Hook ist `useState`/`useEffect`/`useRef` — anders als `planeLiveSync`
 * (`liveUrlSync.ts`, reine Timer-Funktion) lässt er sich nicht ohne React
 * simulieren, ohne genau die Committen/Aufräumen-Reihenfolge zu verlieren, die
 * hier geprüft wird. Stil wie `src/tests/begruessung-strictmode.test.tsx`:
 * `react-dom/client` (Dev-Build) in ein `linkedom`-DOM, mit `vi.useFakeTimers`.
 *
 * ── WAS GEPRÜFT WIRD (Herleitung der 0-ms/200-ms-Regel: `entscheidErwBereich.tsx`) ─
 * 1. Verfeinern (voriger UND neuer Wert nicht leer) verzögert 200 ms.
 * 2. Betreten (voriger Wert leer) ist SOFORT (0 ms).
 * 3. Verlassen (neuer Wert leer) ist SOFORT (0 ms).
 * 4. Unmount räumt den Timer auf — kein `setState` nach dem Unmount.
 * 5. Ein Remount (wie der Leser ihn per `key={schluessel}` beim
 *    Entscheid-Wechsel macht: alter Baum weg, neuer Baum frisch) startet mit
 *    leerem Zustand, unabhängig vom Stand der vorigen Instanz.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSucheGewertet } from '../pages/entscheidErwEntprellung';

let root: Root | null = null;

function aufbauen(): HTMLElement {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  // `setTimeout`/`clearTimeout` als WEITERLEITUNG auf `globalThis` (nicht als
  // Schnappschuss): `vi.useFakeTimers()` ersetzt die globalen Funktionen —
  // eine feste Referenz zum Stub-Zeitpunkt wäre noch die ECHTEN Timer.
  vi.stubGlobal('window', {
    document,
    setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return document.getElementById('app') as unknown as HTMLElement;
}

async function rendern(ziel: HTMLElement, suche: string) {
  if (!root) root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(Sonde, { suche }));
  });
}

async function abbauen() {
  if (!root) return;
  const r = root;
  root = null;
  await act(async () => r.unmount());
}

function Sonde({ suche }: { suche: string }) {
  const gewertet = useSucheGewertet(suche);
  return createElement('span', { 'data-gewertet': true }, gewertet);
}

function gelesen(ziel: HTMLElement): string {
  return ziel.querySelector('[data-gewertet]')!.textContent ?? '';
}

describe('useSucheGewertet (Entscheid-Leser) — Fake-Timer, Befund W2·17-UI-BEFUNDE', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('Betreten (voriger Wert leer) ist SOFORT — 0 ms', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    expect(gelesen(ziel)).toBe('');
    await rendern(ziel, 'K');
    // Noch VOR jedem Timer-Fortschritt steht der alte (leere) Wert — der Hook
    // plant den Timer erst im Effekt, der nach dem Commit läuft.
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(gelesen(ziel)).toBe('K');
  });

  it('Verfeinern (beide Werte nicht leer) verzögert 200 ms, nicht früher', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    await rendern(ziel, 'K');
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(gelesen(ziel)).toBe('K');

    await rendern(ziel, 'Ke');
    // 199 ms: noch der alte Präfix.
    await act(async () => { vi.advanceTimersByTime(199); });
    expect(gelesen(ziel)).toBe('K');
    // Die 200. ms: jetzt erst der neue.
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(gelesen(ziel)).toBe('Ke');
  });

  it('Verlassen (neuer Wert leer) ist SOFORT — 0 ms, auch mitten in einer 200-ms-Wartezeit', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    await rendern(ziel, 'K');
    await act(async () => { vi.advanceTimersByTime(0); });
    await rendern(ziel, 'Ke');
    // Vor Ablauf der 200 ms wird geleert.
    await act(async () => { vi.advanceTimersByTime(50); });
    expect(gelesen(ziel)).toBe('K'); // noch nicht angekommen
    await rendern(ziel, '');
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(gelesen(ziel)).toBe('');
  });

  it('Unmount räumt den laufenden Timer auf — kein setState nach dem Unmount', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    await rendern(ziel, 'K');
    await act(async () => { vi.advanceTimersByTime(0); });
    await rendern(ziel, 'Ke'); // plant einen 200-ms-Timer
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await abbauen(); // unmount VOR Ablauf
    expect(vi.getTimerCount()).toBe(0); // die Cleanup-Funktion hat ihn gelöscht
    // Ein Fortschritt danach darf nichts mehr auslösen (kein Absturz, keine
    // React-Warnung «Cannot update state on an unmounted component» — act()
    // würfe hier, gäbe es doch noch einen hängenden Timer, der setState ruft).
    await act(async () => { vi.advanceTimersByTime(1000); });
  });

  it('Remount (Entscheid-Wechsel, key={schluessel}) startet mit leerem Zustand', async () => {
    const zielA = aufbauen();
    await rendern(zielA, '');
    await rendern(zielA, 'Beschwerde');
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(gelesen(zielA)).toBe('Beschwerde');
    await abbauen(); // wie der Wrapper, der bei anderem `schluessel` abhängt

    // Frische Instanz — genau das, was `key={schluessel}` erzwingt: kein
    // Bezug zum vorigen Baum, kein hängender Timer, kein Altwert.
    const zielB = aufbauen();
    await rendern(zielB, '');
    expect(gelesen(zielB)).toBe('');
  });
});
