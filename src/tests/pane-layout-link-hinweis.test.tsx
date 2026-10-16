// @vitest-environment node
// LESER-NAV · FB O-27 (Rest von BG-06): baut der Nutzer in einem Tab mit geteiltem
// `?p=`-Link das Layout um, während die gespeicherte Eigen-Ordnung geschützt bleibt, sagt
// die Leiste es — das neu aufgebaute Layout überlebt den Reload nicht. Gespeichert wird
// weiterhin NICHTS (sonst wäre BG-06, der Datenverlust, wieder offen).
//
// Sonde: der ECHTE Hook `usePaneLayout` samt Hinweis-Speicher (linkedom + react-dom/client).
//
// ROT ZU BEKOMMEN (§6.7): in `usePaneLayout.ts` den Aufruf `zeigeLayoutHinweis()` im
// `schutz.current`-Zweig entfernen ⇒ (a) und (c) fallen, (b) und (d) bleiben grün
// (gemessen 15.10.2026).
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaneLayout } from '../components/layout/usePaneLayout';

const KEY = 'lexmetrik-panes';
const eigen = ['/gesetze/bund/ZGB', '/gesetze/bund/StGB'];
const BV = '/gesetze/bund/BV';

let root: Root | null = null;
let speicher: Map<string, string>;
let url: URL;
let hinweis: () => boolean;

async function oeffne(adresse: string, gespeichert?: string[]): Promise<{ layout: () => PaneLayout }> {
  vi.resetModules();
  speicher = new Map();
  if (gespeichert) speicher.set(KEY, JSON.stringify(gespeichert));
  url = new URL(adresse, 'https://lexmetrik.test');
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const ls = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, v); },
    removeItem: (k: string) => { speicher.delete(k); },
  };
  vi.stubGlobal('window', {
    document,
    localStorage: ls,
    get location() { return { href: url.href, search: url.search, pathname: url.pathname, hash: url.hash }; },
    history: { state: null, replaceState: (_s: unknown, _t: string, ziel: string) => { url = new URL(ziel, url); } },
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('localStorage', ls);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const { usePaneLayout, layoutHinweisSichtbar } = await import('../components/layout/usePaneLayout');
  hinweis = layoutHinweisSichtbar;
  let aktuell!: PaneLayout;
  function Sonde() { aktuell = usePaneLayout(); return null; }
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  await act(async () => { root!.render(createElement(Sonde)); });
  return { layout: () => aktuell };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const linkAdresse = '/gesetze/bund/OR?p=' + encodeURIComponent(BV);

describe('usePaneLayout — Hinweis, wenn ein Link-Layout nicht gespeichert wird (O-27)', () => {
  it('(a) Umbau im geschützten Link-Tab zeigt den Hinweis; der Speicher bleibt unberührt', async () => {
    const { layout } = await oeffne(linkAdresse, eigen);
    expect(hinweis(), 'schon beim blossen Öffnen des Links').toBe(false);
    await act(async () => layout().oeffneDaneben('/gesetze/bund/ZPO'));
    expect(hinweis()).toBe(true);
    expect(JSON.parse(speicher.get(KEY) ?? 'null')).toEqual(eigen);
  });

  it('(b) Gegenprobe: ohne Schutz (kein gespeicherter Stand) wird gespeichert und nichts gemeldet', async () => {
    const { layout } = await oeffne(linkAdresse);
    await act(async () => layout().oeffneDaneben('/gesetze/bund/ZPO'));
    expect(hinweis()).toBe(false);
    expect(JSON.parse(speicher.get(KEY) ?? 'null')).toEqual([BV, '/gesetze/bund/ZPO']);
  });

  it('(c) der Hinweis fällt nach der Anzeigedauer und kommt bei der nächsten Änderung wieder', async () => {
    const { layout } = await oeffne(linkAdresse, eigen);
    await act(async () => layout().schliesse(0));
    expect(hinweis()).toBe(true);
    await act(async () => { vi.advanceTimersByTime(8001); });
    expect(hinweis()).toBe(false);
    await act(async () => layout().oeffneDaneben('/gesetze/bund/ZPO'));
    expect(hinweis()).toBe(true);
  });

  it('(d) Randfall: Umbau zurück auf den Start-Satz meldet nichts mehr (nichts geht verloren)', async () => {
    const { layout } = await oeffne(linkAdresse, eigen);
    await act(async () => layout().oeffneDaneben('/gesetze/bund/ZPO'));
    await act(async () => { vi.advanceTimersByTime(8001); });
    await act(async () => layout().schliesse(1)); // wieder [BV] = Start
    expect(hinweis()).toBe(false);
  });
});
