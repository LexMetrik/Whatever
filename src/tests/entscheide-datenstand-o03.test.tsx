/**
 * O-03 · Reiter «Entscheide» im Gesetz-Leser nennt seinen Datenstand: das
 * Erzeugungsdatum des Bezugs-Shards (`BezugsShard.erzeugt`), wie der Reiter
 * «Materialien» sein `erzeugt` schon nannte. Gemessen 15.10.2026 an
 * public/rechtsprechung/bezuege: 322 von 322 Shards tragen `erzeugt` als
 * ISO-Datum. Ohne Shard (404) oder vor dem Laden steht KEIN Datum da (§8).
 *
 * ROT ZU BEKOMMEN: in `PanelEntscheide.tsx` die `datenstand`-Zeile streichen →
 * SSR-Fall rot; in `bezuegeLaden.ts` `datenstand` auf `null` festsetzen →
 * Hook-Fall rot.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { PanelEntscheide } from '../pages/gesetz-leser/v3/PanelEntscheide';

const basis = {
  kanten: [] as never[], aktArtikel: 'art-5', revisionShard: null,
  normZitat: 'Art. 5 OR', artikelLabel: 'Art. 5', geladen: true,
  bestimmungsWort: 'Artikel' as const,
  klassen: ['bger'] as never, kantone: [] as never, kantoneVerfuegbar: [] as never,
  histogramm: { balken: [], ohneJahr: 0 }, bereich: { von: '', bis: '' },
  onKlassen: () => {}, onKantone: () => {}, onBereich: () => {},
};
const html = (datenstand?: string | null) => renderToString(
  <MemoryRouter><PanelEntscheide {...basis} datenstand={datenstand} /></MemoryRouter>,
).replace(/<!-- -->/g, '');

describe('O-03 · PanelEntscheide zeigt den Datenstand', () => {
  it('mit Erzeugungsdatum: «Datenstand 04.10.2026» in der Abdeckungs-Zeile', () => {
    expect(html('2026-10-04')).toContain('Datenstand 04.10.2026');
  });
  it('ohne Datum (kein Shard, lädt noch): keine Zeile «Datenstand»', () => {
    expect(html(null)).not.toContain('Datenstand');
    expect(html(undefined)).not.toContain('Datenstand');
  });
});

describe('O-03 · die Daten tragen das Datum', () => {
  it('Stichprobe OR: `erzeugt` ist ein ISO-Datum', () => {
    const shard = JSON.parse(readFileSync('public/rechtsprechung/bezuege/OR.json', 'utf8')) as { erzeugt: unknown };
    expect(shard.erzeugt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─── Hook: der Wert kommt aus dem geladenen Shard, gebunden an den Erlass ────
type Patch = Record<string, unknown>;
afterEach(() => { delete (globalThis as Patch).window; delete (globalThis as Patch).document; delete (globalThis as Patch).fetch; delete (globalThis as Patch).IS_REACT_ACT_ENVIRONMENT; });

async function messeDatenstand(antwort: () => Response, key: string) {
  vi.resetModules();
  const { window, document } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  // Leerlauf sofort: `beiLeerlauf` wartet sonst bis zu 1.2 s auf `requestIdleCallback`.
  (window as unknown as Patch).requestIdleCallback = (cb: () => void) => setTimeout(cb, 0);
  (window as unknown as Patch).cancelIdleCallback = (id: number) => clearTimeout(id);
  (globalThis as Patch).window = window;
  (globalThis as Patch).document = document;
  (globalThis as Patch).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as Patch).fetch = vi.fn(async () => antwort());
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useBezuege } = await import('../pages/gesetz-leser/bezuegeLaden');
  const stand: { datenstand: string | null | undefined } = { datenstand: undefined };
  function Harness() { stand.datenstand = useBezuege(key).datenstand; return null; }
  const root = createRoot(document.getElementById('root') as unknown as Element);
  await act(async () => { root.render(React.createElement(Harness)); });
  for (let i = 0; i < 8; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
  return stand.datenstand;
}

const ok = (body: unknown) => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body }) as unknown as Response;
const SHARD = { erzeugt: '2026-10-04', erlass: 'OR', erlassEbene: 'bund', dokumente: {}, proArtikel: {}, gesamtProArtikel: {} };

describe('O-03 · useBezuege liefert den Datenstand des geladenen Shards', () => {
  it('Shard geladen: erzeugt', async () => {
    expect(await messeDatenstand(() => ok(SHARD), 'OR')).toBe('2026-10-04');
  });
  it('404 (kein Shard): null, nicht erfunden', async () => {
    expect(await messeDatenstand(() => ({ ok: false, status: 404, json: async () => ({}) }) as unknown as Response, 'ZH-211.11')).toBeNull();
  });
});
