// @vitest-environment node
/**
 * F3 (Gegenprüfung Opus, PR #616) — Bund lädt `kanton-luecken.json` NIE
 * (Guard `src/pages/gesetz-leser/inhalt-hooks.tsx`, `if (daten === 'kanton')`).
 *
 * ECHTE Effekt-Ausführung, kein Quelltext-Grep: kein jsdom im Projekt
 * (vite.config.ts: environment 'node'), darum montiert dieser Test React
 * über `linkedom` (bereits Projekt-Dependency) + `react-dom/client` + `act` —
 * dasselbe Prinzip wie die DOM-Doubles in `leser-schriftskala.test.ts` und
 * `toc-auto-zuklappen-w219.test.ts`, nur mit einem echten `createRoot`, weil
 * hier tatsächlich ein `useEffect` feuern muss (Fetch-Aufrufe), nicht nur
 * eine reine Funktion geprüft wird.
 *
 * `vi.resetModules()` je Phase: `browse.ts` cacht seine Sidecar-Promises
 * modul-weit (`kantonLueckenPromise` etc.) — ohne Reset würde die zweite
 * Phase (kanton) von der ersten (bund) mitprofitieren und der Beweis wäre
 * eine Verwechslung von Cache-Treffer und Fetch-Aufruf.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseHTML } from 'linkedom';
import type { NavigateFunction } from 'react-router-dom';
import { useMeldeInhaltsKopf } from '../components/layout/InhaltsKopfKontext';

type MeldeKopf = ReturnType<typeof useMeldeInhaltsKopf>;
type GlobalPatch = Record<string, unknown>;

async function fetchAufrufeFuer(ebene: string): Promise<string[]> {
  vi.resetModules();
  const { window, document } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;

  const aufrufe: string[] = [];
  (globalThis as GlobalPatch).fetch = vi.fn(async (url: string) => {
    aufrufe.push(String(url));
    // Alle Sidecar-Loader in browse.ts behandeln !res.ok als „leer/null" (kein
    // Wurf) — ein pauschales 404 ist darum für JEDE der hier ausgelösten
    // Fetches sicher, ohne den Effekt-Rumpf selbst nachzubauen.
    return { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
  });

  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useLeserDaten } = await import('../pages/gesetz-leser/inhalt-hooks');

  function Harness() {
    useLeserDaten({
      ebene, schluessel: 'X-TEST-999', navigate: (() => {}) as unknown as NavigateFunction, erlass: null, istSekundaer: false,
      meldeInhaltsKopf: (() => {}) as unknown as MeldeKopf,
      setManifest: () => {}, setCurrency: () => {}, setStruktur: () => {}, setKopf: () => {},
      setKantonSys: () => {}, setKantonLuecken: () => {}, setTeilausfall: () => {}, setErlass: () => {}, setEintraege: () => {},
      setFehler: () => {},
    });
    return null;
  }

  const container = document.getElementById('root');
  const root = createRoot(container as unknown as Element);
  await act(async () => { root.render(React.createElement(Harness)); });
  // Der Effekt hängt Promise-Ketten (`ladeXyz().then(...)`) — eine zusätzliche
  // Mikrotask-Runde stellt sicher, dass auch verkettete Fetches (z. B.
  // `ladeErlass` → `ladeBrowseManifest`) VOR der Auswertung gefeuert haben.
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });

  return aufrufe;
}

describe('F3 — Bund lädt kanton-luecken.json nie (echte Effekt-Ausführung)', () => {
  afterEach(() => {
    delete (globalThis as GlobalPatch).window;
    delete (globalThis as GlobalPatch).document;
    delete (globalThis as GlobalPatch).fetch;
  });

  it('ebene=bund: KEIN Fetch auf kanton-luecken.json', async () => {
    const aufrufe = await fetchAufrufeFuer('bund');
    expect(aufrufe.some((u) => u.includes('kanton-luecken'))).toBe(false);
    // Beweist, dass der Effekt WIRKLICH gelaufen ist — sonst wäre der obige
    // Fall trivial grün (kein Effekt = auch kein Fetch).
    expect(aufrufe.some((u) => u.includes('register.json'))).toBe(true);
  });

  it('ebene=kanton: DERSELBE Effekt lädt kanton-luecken.json sehr wohl', async () => {
    const aufrufe = await fetchAufrufeFuer('kanton');
    expect(aufrufe.some((u) => u.includes('kanton-luecken'))).toBe(true);
  });

  it('ebene=international: ebenfalls kein Fetch (nur "kanton" schaltet frei)', async () => {
    const aufrufe = await fetchAufrufeFuer('international');
    expect(aufrufe.some((u) => u.includes('kanton-luecken'))).toBe(false);
  });
});
