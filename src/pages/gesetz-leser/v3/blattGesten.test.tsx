/**
 * Unit-Abdeckung für `useZurueckSchliesst` (`blattGesten.ts`) — Posten
 * 2026-09-24 (Dach W2·29-WERKBANK-LESER), Nachzug zu #1046.
 *
 * #1046 behob die Flacker-Wurzel nur mit einem e2e-Beleg (`net::ERR_ABORTED`
 * unter 4×-CPU-Drossel, `e2e/leser-v3-panel-nachzug.e2e.ts` Fall (f)): das
 * `history.back()` nach dem Schliessen lief per `setTimeout(…, 0)`
 * (Makrotask) statt `queueMicrotask` (Mikrotask) — in der Makrotask-Lücke
 * konnte eine ECHTE Navigation bereits unterwegs sein und mit dem
 * verspäteten `back()` um denselben Frame konkurrieren.
 *
 * ── WARUM ECHTER REACT-RENDER ────────────────────────────────────────────
 * Stil wie `src/tests/entscheid-erw-entprellung.test.tsx` /
 * `begruessung-strictmode.test.tsx`: `react-dom/client` (Dev-Build,
 * StrictMode aktiv) in ein `linkedom`-DOM. `useZurueckSchliesst` hängt an
 * `useEffect`/`useRef`-Commit-Reihenfolge (StrictMode cleanup→setup IM
 * SELBEN Commit) — das lässt sich nicht verlustfrei ohne React simulieren.
 *
 * ── DREI BEWEISPUNKTE ────────────────────────────────────────────────────
 * 1. Fremde Zurück-Geste (Marke schon weg) ruft `schliesse()` genau einmal.
 * 2. StrictMode-Doppelaufruf (cleanup→setup ohne Rückkehr zur Event-Loop)
 *    lässt den History-Eintrag stehen — `history.back()` wird NICHT gerufen.
 * 3. WURZEL-BEWEIS (Mikrotask vor Makrotask): eine bereits als Makrotask
 *    wartende Fremd-Navigation läuft NACH dem eigenen `history.back()` —
 *    mit der alten `setTimeout(…, 0)`-Variante wäre die Reihenfolge
 *    umgekehrt (Rot-Beweis im Bau-Bericht dokumentiert, hier als
 *    Wegwerf-Änderung gezeigt, nicht committet).
 */
import { StrictMode, act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useZurueckSchliesst } from './blattGesten';

interface FensterStumpf {
  history: {
    state: unknown;
    pushState: (state: unknown, title: string) => void;
    back: () => void;
  };
  addEventListener: (typ: string, hoerer: () => void) => void;
  removeEventListener: (typ: string, hoerer: () => void) => void;
  document: unknown;
}

let root: Root | null = null;

function aufbauen(): { ziel: HTMLElement; fenster: FensterStumpf; popstateFeuern: () => void } {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const popHoerer = new Set<() => void>();
  let zustand: unknown = null;
  const fenster: FensterStumpf = {
    history: {
      get state() { return zustand; },
      pushState: (s: unknown) => { zustand = s; },
      // Echtes `back()` nimmt den zuletzt gepushten Eintrag weg — die Marke
      // verschwindet, GENAU wie im Browser, bevor `popstate` feuert.
      back: vi.fn(() => {
        zustand = null;
        popHoerer.forEach((h) => h());
      }),
    },
    addEventListener: (typ: string, h: () => void) => { if (typ === 'popstate') popHoerer.add(h); },
    removeEventListener: (typ: string, h: () => void) => { if (typ === 'popstate') popHoerer.delete(h); },
    document,
  };
  vi.stubGlobal('window', fenster);
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return {
    ziel: document.getElementById('app') as unknown as HTMLElement,
    fenster,
    // Simuliert die Zurück-GESTE des Telefons: die Marke ist beim Zurückkommen
    // bereits weg (der Browser hat den Eintrag schon genommen), erst DANACH
    // feuert `popstate` — anders als bei unserem eigenen `history.back()` oben.
    popstateFeuern: () => { zustand = null; popHoerer.forEach((h) => h()); },
  };
}

function Sonde({ aktiv, schliesse }: { aktiv: boolean; schliesse: () => void }) {
  useZurueckSchliesst(aktiv, schliesse);
  return null;
}

async function rendern(ziel: HTMLElement, aktiv: boolean, schliesse: () => void) {
  if (!root) root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(StrictMode, null, createElement(Sonde, { aktiv, schliesse })));
  });
}

async function abbauen() {
  if (!root) return;
  const r = root;
  root = null;
  await act(async () => r.unmount());
}

describe('useZurueckSchliesst (Leser-Blatt) — echter React-Render, Nachzug #1046', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('Aktivierung schreibt einen History-Eintrag mit der Blatt-Marke', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    expect((fenster.history.state as Record<string, unknown>).lmErlassBlatt).toBe(true);
  });

  it('Zurück-Geste (Marke schon weg) ruft schliesse() genau einmal', async () => {
    const { ziel, popstateFeuern } = aufbauen();
    const schliesse = vi.fn();
    await rendern(ziel, true, schliesse);
    popstateFeuern();
    expect(schliesse).toHaveBeenCalledTimes(1);
  });

  it('StrictMode-Doppelaufruf (cleanup→setup im selben Commit) ruft history.back() NICHT — der Eintrag bleibt stehen', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    // Der Mikrotask, den der (verworfene) erste Effekt-Durchlauf in seinem
    // Cleanup geplant hätte, ist zu diesem Zeitpunkt längst gelaufen —
    // `laeuft.current` stand vom zweiten Durchlauf schon wieder auf `true`.
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).not.toHaveBeenCalled();
    expect((fenster.history.state as Record<string, unknown>).lmErlassBlatt).toBe(true);
  });

  it('WURZEL-BEWEIS: eigenes history.back() läuft VOR einer bereits wartenden Fremd-Navigation (Mikrotask vor Makrotask)', async () => {
    const { ziel, fenster } = aufbauen();
    const reihenfolge: string[] = [];
    (fenster.history.back as ReturnType<typeof vi.fn>).mockImplementation(() => reihenfolge.push('eigenes-back'));
    await rendern(ziel, true, () => {});

    // Eine ECHTE Navigation ist bereits als Makrotask unterwegs — genau der
    // Wettlauf aus #1046 (`page.goto` in `leser-v3-panel-nachzug.e2e.ts`
    // Fall (f), Läufe 35984783583/36009374111).
    setTimeout(() => reihenfolge.push('fremde-navigation'), 0);

    // Schliessen (✕/Esc/Scrim): aktiv → false, der Cleanup läuft synchron
    // und plant den Mikrotask.
    await rendern(ziel, false, () => {});
    await act(async () => { await Promise.resolve(); }); // Mikrotasks abarbeiten
    await act(async () => { vi.advanceTimersByTime(0); }); // die Fremd-Makrotask

    expect(reihenfolge).toEqual(['eigenes-back', 'fremde-navigation']);
  });
});
