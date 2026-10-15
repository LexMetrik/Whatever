// @vitest-environment node
/**
 * LESER-NAV · FB O-27 / BG-07 — «Zurück» nach dem Wechsel auf «Ganzer Erlass» kippt
 * nicht mehr in den Einzelmodus.
 *
 * Die Regel steht im Kopf von `v3/useEinzelModus.ts`: der Moduswechsel ist
 * `replaceState`, «wer die Lesart umstellt und danach Zurück drückt, will zur vorigen
 * SEITE, nicht in die vorige Lesart». Gebrochen wurde sie vom Blättern: dort ist jeder
 * Schritt ein `pushState` (Eintrag mit `?ansicht=artikel`), «Zurück» landete nach dem
 * Wechsel auf einem solchen Eintrag und zeigte wieder einen einzelnen Artikel.
 *
 * Sonde: der ECHTE Hook `useEinzelModus` (linkedom + react-dom/client + MemoryRouter,
 * kein Browser) mit dem echten Options-Speicher.
 *
 * ROT ZU BEKOMMEN (§6.7): in `useEinzelModus.ts` den Effekt «Zurück über den Wechsel»
 * (`ueberschreibe`-Zweig) entfernen ⇒ (a) und (c) fallen.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';

type GlobalPatch = Record<string, unknown>;
const TOKENS = ['4', '5', '6', '7'];

async function umgebung(startAdresse: string, gemerkt: 'erlass' | 'artikel') {
  vi.resetModules();
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const speicher = new Map<string, string>([['lm.leser.optionen', JSON.stringify({ ansicht: gemerkt })]]);
  const ls = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, String(v)); },
    removeItem: (k: string) => { speicher.delete(k); },
  };
  (globalThis as GlobalPatch).window = { document, addEventListener: () => {}, removeEventListener: () => {} };
  (globalThis as GlobalPatch).document = document;
  (globalThis as GlobalPatch).localStorage = ls;
  (globalThis as GlobalPatch).IS_REACT_ACT_ENVIRONMENT = true;

  const React = await import('react');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter, useLocation, useNavigate } = await import('react-router-dom');
  const { useEinzelModus } = await import('../pages/gesetz-leser/v3/useEinzelModus');

  const probe: { einzel?: ReturnType<typeof useEinzelModus>; ort?: { search: string; hash: string }; zurueck?: () => void } = {};
  function Sonde() {
    probe.einzel = useEinzelModus({ basisPfad: '/gesetze/bund/OR', artTokens: TOKENS, aktivToken: null }, true);
    const l = useLocation();
    probe.ort = { search: l.search, hash: l.hash };
    const nav = useNavigate();
    probe.zurueck = () => nav(-1);
    return null;
  }
  const root = createRoot(document.getElementById('app') as unknown as Element);
  await act(async () => {
    root.render(React.createElement(MemoryRouter, { initialEntries: [startAdresse] }, React.createElement(Sonde)));
  });
  const tue = async (fn: () => void) => { await act(async () => { fn(); }); await act(async () => { await Promise.resolve(); }); };
  return { probe, tue, abbau: () => act(async () => root.unmount()) };
}

let abbau: (() => Promise<void>) | null = null;
afterEach(async () => {
  if (abbau) { await abbau(); abbau = null; }
  vi.unstubAllGlobals();
  delete (globalThis as GlobalPatch).window;
  delete (globalThis as GlobalPatch).document;
  delete (globalThis as GlobalPatch).localStorage;
});

describe('BG-07 · «Zurück» über einen Lesart-Wechsel hinweg', () => {
  it('(a) Einzelmodus, geblättert, auf «Ganzer Erlass» gewechselt: Zurück bleibt in «Ganzer Erlass»', async () => {
    const u = await umgebung('/gesetze/bund/OR?ansicht=artikel#art-5', 'artikel');
    abbau = u.abbau;
    await u.tue(() => u.probe.einzel!.blaettere(1)); // push: ?ansicht=artikel#art-6
    expect(u.probe.ort).toEqual({ search: '?ansicht=artikel', hash: '#art-6' });
    await u.tue(() => u.probe.einzel!.waehleModus('erlass')); // replace
    expect(u.probe.einzel!.modus).toBe('erlass');
    await u.tue(() => u.probe.zurueck!());
    expect(u.probe.einzel!.modus, 'Zurück kippte in den Einzelmodus').toBe('erlass');
    expect(u.probe.ort!.search).not.toContain('ansicht=artikel');
    expect(u.probe.ort!.hash, 'der Artikel des früheren Eintrags bleibt die Lesestelle').toBe('#art-5');
  });

  it('(b) Gegenprobe: ohne Wechsel blättert Zurück weiter einen Artikel zurück (Kap. 15.6)', async () => {
    const u = await umgebung('/gesetze/bund/OR?ansicht=artikel#art-5', 'artikel');
    abbau = u.abbau;
    await u.tue(() => u.probe.einzel!.blaettere(1));
    await u.tue(() => u.probe.zurueck!());
    expect(u.probe.einzel!.modus).toBe('artikel');
    expect(u.probe.einzel!.token).toBe('5');
  });

  it('(c) umgekehrt: von «Ganzer Erlass» auf «Einzelner Artikel» gewechselt: Zurück bleibt im Einzelmodus', async () => {
    const u = await umgebung('/gesetze/bund/OR?ansicht=erlass#art-5', 'artikel');
    abbau = u.abbau;
    // Zweiter Eintrag, der ausdrücklich die Gesamtansicht trägt (z. B. Sprung aus dem Gliederungspfad).
    await u.tue(() => u.probe.einzel!.gehZu('6')); // Adresse = Einzelmodus, push
    await u.tue(() => u.probe.einzel!.waehleModus('erlass')); // replace → ?ansicht weg (Vorgabe erlass)
    await u.tue(() => u.probe.einzel!.waehleModus('artikel')); // replace → ?ansicht=artikel
    await u.tue(() => u.probe.zurueck!());
    expect(u.probe.einzel!.modus).toBe('artikel');
  });

  it('(d) Wechsel und danach neue Einträge: Zurück zu einem Eintrag NACH dem Wechsel bleibt unberührt', async () => {
    const u = await umgebung('/gesetze/bund/OR?ansicht=artikel#art-5', 'artikel');
    abbau = u.abbau;
    await u.tue(() => u.probe.einzel!.waehleModus('erlass'));
    await u.tue(() => u.probe.einzel!.waehleModus('artikel')); // bewusst zurück in den Einzelmodus
    await u.tue(() => u.probe.einzel!.blaettere(1)); // push nach dem Wechsel
    await u.tue(() => u.probe.zurueck!());
    expect(u.probe.einzel!.modus).toBe('artikel');
    expect(u.probe.einzel!.token).toBe('5');
  });
});
