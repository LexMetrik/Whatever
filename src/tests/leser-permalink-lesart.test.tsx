// @vitest-environment node
/**
 * LESER-NAV · FB O-27 / BG-08 — der kopierte Permalink trägt im Einzelmodus die Lesart.
 *
 * Vorher baute `ArtikelAktionen` den Link aus `basisPfad` + Anker ohne Query: wer im
 * Einzelmodus «Link» drückte, teilte `…/OR#art-5` — der Empfänger sah je nach SEINER gemerkten
 * Wahl den ganzen Erlass. Die Adresse schlägt die Präferenz (Kap. 15.6): ein geteilter Link
 * zeigt, was der Absender meinte.
 *
 * Teil 1: die reine Regel `permalinkMitLesart` (`v3/einzelModus`). Teil 2: der echte Knopf
 * (linkedom + react-dom/client) — was wirklich in die Zwischenablage geht.
 *
 * ROT ZU BEKOMMEN (§6.7): in `parts/ArtikelAktionen.tsx` `permalinkMitLesart(...)` durch
 * `permalinkSchlicht` ersetzen ⇒ Teil 2 (a), (b) fallen.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseHTML } from 'linkedom';
import { permalinkMitLesart } from '../pages/gesetz-leser/v3/einzelModus';

type GlobalPatch = Record<string, unknown>;
const P = 'https://lexmetrik.test/gesetze/bund/OR#art-5';

describe('permalinkMitLesart — die reine Regel', () => {
  it('Adresse sagt «artikel» ⇒ ?ansicht=artikel vor dem Anker', () => {
    expect(permalinkMitLesart(P, '?ansicht=artikel', 'erlass')).toBe('https://lexmetrik.test/gesetze/bund/OR?ansicht=artikel#art-5');
  });
  it('Adresse schweigt, gemerkt «artikel» ⇒ ebenfalls (der Einzelmodus gilt)', () => {
    expect(permalinkMitLesart(P, '', 'artikel')).toBe('https://lexmetrik.test/gesetze/bund/OR?ansicht=artikel#art-5');
  });
  it('Gesamtansicht bleibt unverändert, auch wenn die Wahl «artikel» ist, die Adresse aber «erlass» sagt', () => {
    expect(permalinkMitLesart(P, '?ansicht=erlass', 'artikel')).toBe(P);
    expect(permalinkMitLesart(P, '', 'erlass')).toBe(P);
  });
  it('Randfall: Anker mit Leerzeichen bleibt kodiert, Query steht davor', () => {
    expect(permalinkMitLesart('https://lexmetrik.test/gesetze/kanton/BS-215.400#art-22%20a', '?ansicht=artikel', 'erlass'))
      .toBe('https://lexmetrik.test/gesetze/kanton/BS-215.400?ansicht=artikel#art-22%20a');
  });
});

async function knopf(opts: { search: string; gemerkt: 'erlass' | 'artikel'; rolle?: 'primaer' | 'sekundaer'; artikel?: string }) {
  vi.resetModules();
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const kopiert: string[] = [];
  const speicher = new Map<string, string>([['lm.leser.optionen', JSON.stringify({ ansicht: opts.gemerkt })]]);
  (globalThis as GlobalPatch).localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, String(v)); },
    removeItem: (k: string) => { speicher.delete(k); },
  };
  (globalThis as GlobalPatch).window = {
    document,
    location: { origin: 'https://lexmetrik.test', search: opts.search, href: `https://lexmetrik.test/gesetze/bund/OR${opts.search}#art-5` },
    history: { state: null, replaceState: () => {} },
    addEventListener: () => {}, removeEventListener: () => {},
  };
  (globalThis as GlobalPatch).document = document;
  (globalThis as GlobalPatch).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('navigator', { userAgent: 'node', clipboard: { writeText: async (t: string) => { kopiert.push(t); } } });

  const React = await import('react');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { createRoot } = await import('react-dom/client');
  const { PaneProvider } = await import('../components/layout/PaneKontext');
  const { ArtikelAktionen } = await import('../pages/gesetz-leser/parts/ArtikelAktionen');
  const root = createRoot(document.getElementById('app') as unknown as Element);
  const baum = React.createElement(ArtikelAktionen, {
    artikel: opts.artikel ?? '5', basisPfad: '/gesetze/bund/OR', zitat: 'Art. 5 OR', zitatVoll: 'Art. 5 OR (SR 220)', amtlich: null,
  });
  await act(async () => {
    root.render(opts.rolle
      ? React.createElement(PaneProvider, { value: { imPane: true, rolle: opts.rolle, wurzel: null, overlayWurzel: null } }, baum)
      : baum);
  });
  const el = document.querySelector('button[aria-label="Permalink kopieren"]') as unknown as HTMLElement;
  await act(async () => { el.click(); await Promise.resolve(); });
  return { kopiert, abbau: () => act(async () => root.unmount()) };
}

let abbau: (() => Promise<void>) | null = null;
afterEach(async () => {
  if (abbau) { await abbau(); abbau = null; }
  vi.unstubAllGlobals();
  for (const k of ['window', 'document', 'localStorage']) delete (globalThis as GlobalPatch)[k];
});

describe('«Link» kopieren — was in die Zwischenablage geht', () => {
  it('(a) Einzelmodus aus der Adresse: Link trägt ?ansicht=artikel', async () => {
    const k = await knopf({ search: '?ansicht=artikel', gemerkt: 'erlass' });
    abbau = k.abbau;
    expect(k.kopiert).toEqual(['https://lexmetrik.test/gesetze/bund/OR?ansicht=artikel#art-5']);
  });
  it('(b) Einzelmodus aus der gemerkten Wahl (Adresse schweigt): ebenfalls', async () => {
    const k = await knopf({ search: '', gemerkt: 'artikel' });
    abbau = k.abbau;
    expect(k.kopiert).toEqual(['https://lexmetrik.test/gesetze/bund/OR?ansicht=artikel#art-5']);
  });
  it('(c) Gesamtansicht: Link unverändert', async () => {
    const k = await knopf({ search: '', gemerkt: 'erlass' });
    abbau = k.abbau;
    expect(k.kopiert).toEqual(['https://lexmetrik.test/gesetze/bund/OR#art-5']);
  });
  it('(d) sekundäres Pane (immer Gesamtansicht, fremde Adresse): Link unverändert', async () => {
    const k = await knopf({ search: '?ansicht=artikel', gemerkt: 'artikel', rolle: 'sekundaer' });
    abbau = k.abbau;
    expect(k.kopiert).toEqual(['https://lexmetrik.test/gesetze/bund/OR#art-5']);
  });
  it('(e) Randfall: Artikel-Token mit Leerzeichen bleibt kodiert', async () => {
    const k = await knopf({ search: '?ansicht=artikel', gemerkt: 'erlass', artikel: '22 a' });
    abbau = k.abbau;
    expect(k.kopiert).toEqual(['https://lexmetrik.test/gesetze/bund/OR?ansicht=artikel#art-22%20a']);
  });
});
