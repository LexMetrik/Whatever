// @vitest-environment node
/**
 * LESER-NAV · FB O-27 / BG-07-Rest — das Gedächtnis «welche Einträge liegen vor der
 * letzten Lesart-Umstellung» überlebt Erlasswechsel und Reload.
 *
 * Bis 15.10.2026 lag es nur im Ref von `useEinzelModus`; `LeserRahmenV3 key={schluessel}`
 * baut den Hook bei jedem Erlasswechsel neu auf, ein Reload ebenso — «Zurück» auf einen
 * Eintrag von davor (Adresse trägt `?ansicht=artikel` vom Blättern) kippte dann wieder in
 * den Einzelmodus. Jetzt liegt es im Sitzungsspeicher des Tabs (`lm.leser.lesart-wechsel`).
 *
 * Sonde: der ECHTE Hook (linkedom + react-dom/client + MemoryRouter). Der Erlasswechsel wird
 * als Neuaufbau der Sonde (`key`) unter demselben Router nachgestellt — genau das, was der
 * Rahmen tut; die Verlaufseinträge (und damit `location.key`) bleiben dabei bestehen.
 *
 * ROT ZU BEKOMMEN (§6.7): in `useEinzelModus.ts` `speichereGedaechtnis` zu einem leeren Rumpf
 * machen ⇒ (a) fällt (Zurück nach dem Neuaufbau bleibt im Einzelmodus), (b) bleibt grün
 * (gemessen 15.10.2026).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';

type GlobalPatch = Record<string, unknown>;
const TOKENS = ['4', '5', '6', '7'];

async function umgebung(startAdresse: string) {
  vi.resetModules();
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const lokal = new Map<string, string>([['lm.leser.optionen', JSON.stringify({ ansicht: 'artikel' })]]);
  const sitzung = new Map<string, string>();
  const speicher = (m: Map<string, string>) => ({
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
  });
  (globalThis as GlobalPatch).window = { document, addEventListener: () => {}, removeEventListener: () => {} };
  (globalThis as GlobalPatch).document = document;
  (globalThis as GlobalPatch).localStorage = speicher(lokal);
  (globalThis as GlobalPatch).sessionStorage = speicher(sitzung);
  (globalThis as GlobalPatch).IS_REACT_ACT_ENVIRONMENT = true;

  const React = await import('react');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter, useLocation, useNavigate } = await import('react-router-dom');
  const { useEinzelModus } = await import('../pages/gesetz-leser/v3/useEinzelModus');

  const probe: {
    einzel?: ReturnType<typeof useEinzelModus>; ort?: { search: string; hash: string };
    zurueck?: () => void; neuAufbauen?: () => void;
  } = {};
  function Sonde() {
    probe.einzel = useEinzelModus({ basisPfad: '/gesetze/bund/OR', artTokens: TOKENS, aktivToken: null }, true);
    const l = useLocation();
    probe.ort = { search: l.search, hash: l.hash };
    const nav = useNavigate();
    probe.zurueck = () => nav(-1);
    return null;
  }
  function Huelle() {
    const [aufbau, setAufbau] = React.useState(0);
    probe.neuAufbauen = () => setAufbau((n) => n + 1);
    return React.createElement(Sonde, { key: aufbau });
  }
  const root = createRoot(document.getElementById('app') as unknown as Element);
  await act(async () => {
    root.render(React.createElement(MemoryRouter, { initialEntries: [startAdresse] }, React.createElement(Huelle)));
  });
  const tue = async (fn: () => void) => { await act(async () => { fn(); }); await act(async () => { await Promise.resolve(); }); };
  return { probe, tue, sitzung, abbau: () => act(async () => root.unmount()) };
}

let abbau: (() => Promise<void>) | null = null;
afterEach(async () => {
  if (abbau) { await abbau(); abbau = null; }
  vi.unstubAllGlobals();
  for (const k of ['window', 'document', 'localStorage', 'sessionStorage']) delete (globalThis as GlobalPatch)[k];
});

describe('BG-07-Rest · Gedächtnis über Neuaufbau (Erlasswechsel, Reload) hinweg', () => {
  it('(a) Einzelmodus, geblättert, auf «Ganzer Erlass» gewechselt, Hook neu aufgebaut: Zurück bleibt in «Ganzer Erlass»', async () => {
    const u = await umgebung('/gesetze/bund/OR?ansicht=artikel#art-5');
    abbau = u.abbau;
    await u.tue(() => u.probe.einzel!.blaettere(1)); // push: ?ansicht=artikel#art-6
    await u.tue(() => u.probe.einzel!.waehleModus('erlass')); // replace
    expect(u.sitzung.get('lm.leser.lesart-wechsel'), 'nichts im Sitzungsspeicher abgelegt').toContain('"erlass"');
    await u.tue(() => u.probe.neuAufbauen!()); // Erlasswechsel/Reload: Refs leer
    expect(u.probe.einzel!.modus).toBe('erlass');
    await u.tue(() => u.probe.zurueck!());
    expect(u.probe.einzel!.modus, 'Zurück kippte nach dem Neuaufbau in den Einzelmodus').toBe('erlass');
    expect(u.probe.ort!.search).not.toContain('ansicht=artikel');
    expect(u.probe.ort!.hash).toBe('#art-5');
  });

  it('(b) Gegenprobe: ohne Umstellung bleibt auch nach dem Neuaufbau «Zurück» ein Blätterschritt', async () => {
    const u = await umgebung('/gesetze/bund/OR?ansicht=artikel#art-5');
    abbau = u.abbau;
    await u.tue(() => u.probe.einzel!.blaettere(1));
    await u.tue(() => u.probe.neuAufbauen!());
    await u.tue(() => u.probe.zurueck!());
    expect(u.probe.einzel!.modus).toBe('artikel');
    expect(u.probe.einzel!.token).toBe('5');
  });

  it('(c) ein defekter Sitzungsspeicher wird wie «leer» behandelt (kein Wurf, altes Verhalten)', async () => {
    const u = await umgebung('/gesetze/bund/OR?ansicht=artikel#art-5');
    abbau = u.abbau;
    u.sitzung.set('lm.leser.lesart-wechsel', '{"besucht":[1,2],"wechsel":{"modus":"x"}');
    await u.tue(() => u.probe.neuAufbauen!());
    await u.tue(() => u.probe.einzel!.blaettere(1));
    await u.tue(() => u.probe.zurueck!());
    expect(u.probe.einzel!.modus).toBe('artikel');
  });
});
