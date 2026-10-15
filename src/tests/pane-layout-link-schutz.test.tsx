// @vitest-environment node
// LESER-NAV · FB O-27 / BG-06 (Datenverlust): ein geteilter Layout-Link `?p=`
// darf die EIGENEN gespeicherten Split-Panes nicht überschreiben. Der Link gilt
// für diese Ansicht; die gespeicherte Eigen-Ordnung bleibt, bis der Nutzer
// selbst am Layout ändert. Gegenprobe: ohne gespeicherten Stand wird der Seed
// weiter persistiert (e2e international-adresse-b45 M3).
//
// Sonde: der ECHTE Hook `usePaneLayout` (linkedom + react-dom/client, kein Browser)
// mit einem schlanken window-/localStorage-Stand.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePaneLayout, type PaneLayout } from '../components/layout/usePaneLayout';

const KEY = 'lexmetrik-panes';
const eigen = ['/gesetze/bund/ZGB', '/gesetze/bund/StGB'];

let root: Root | null = null;
let speicher: Map<string, string>;
let url: URL;

/** Öffnet die Seite: window-Stand mit Adresse, history.replaceState und Speicher. */
async function oeffne(adresse: string, gespeichert?: string[]): Promise<{ layout: () => PaneLayout }> {
  speicher = new Map();
  if (gespeichert) speicher.set(KEY, JSON.stringify(gespeichert));
  url = new URL(adresse, 'https://lexmetrik.test');
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const ls = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, v); },
    removeItem: (k: string) => { speicher.delete(k); },
  };
  const win = {
    document,
    localStorage: ls,
    get location() { return { href: url.href, search: url.search, pathname: url.pathname, hash: url.hash }; },
    history: { state: null, replaceState: (_s: unknown, _t: string, ziel: string) => { url = new URL(ziel, url); } },
  };
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', document);
  vi.stubGlobal('localStorage', ls);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  let aktuell!: PaneLayout;
  function Sonde() { aktuell = usePaneLayout(); return null; }
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  await act(async () => { root!.render(createElement(Sonde)); });
  return { layout: () => aktuell };
}

const gespeichert = () => JSON.parse(speicher.get(KEY) ?? 'null');

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('usePaneLayout — geteilter ?p=-Link vs. gespeicherte Eigen-Ordnung (BG-06)', () => {
  it('der Link-Satz gilt für die Ansicht, der gespeicherte Satz bleibt unangetastet', async () => {
    const { layout } = await oeffne('/gesetze/bund/OR?p=' + encodeURIComponent('/gesetze/bund/BV'), eigen);
    expect(layout().sekundaer).toEqual(['/gesetze/bund/BV']);
    expect(gespeichert()).toEqual(eigen);
    expect(url.search).not.toContain('p='); // Seed wird weiterhin aus der URL entfernt
  });

  it('erst eine eigene Änderung schreibt den Speicher neu', async () => {
    const { layout } = await oeffne('/gesetze/bund/OR?p=' + encodeURIComponent('/gesetze/bund/BV'), eigen);
    await act(async () => layout().schliesse(0));
    expect(layout().sekundaer).toEqual([]);
    expect(gespeichert()).toEqual([]);
  });

  it('Gegenprobe: ohne gespeicherten Stand wird der Link-Satz wie bisher gespeichert', async () => {
    await oeffne('/gesetze/bund/OR?p=' + encodeURIComponent('/gesetze/bund/BV'));
    expect(gespeichert()).toEqual(['/gesetze/bund/BV']);
  });

  it('Gegenprobe: ohne ?p= ist der gespeicherte Satz der Start und bleibt erhalten', async () => {
    const { layout } = await oeffne('/gesetze/bund/OR', eigen);
    expect(layout().sekundaer).toEqual(eigen);
    expect(gespeichert()).toEqual(eigen);
  });

  it('Randfall: defektes ?p= lässt den gespeicherten Satz gelten', async () => {
    const { layout } = await oeffne('/gesetze/bund/OR?p=' + encodeURIComponent('kein-pfad'), eigen);
    expect(layout().sekundaer).toEqual(eigen);
    expect(gespeichert()).toEqual(eigen);
  });

  it('Randfall: Link-Satz identisch mit dem gespeicherten bleibt gleich', async () => {
    const { layout } = await oeffne('/gesetze/bund/OR?p=' + encodeURIComponent(eigen.join('||')), eigen);
    expect(layout().sekundaer).toEqual(eigen);
    expect(gespeichert()).toEqual(eigen);
  });

  it('Randfall: Link-Satz gilt auch, wenn der gespeicherte Satz leer ist; Ändern danach speichert', async () => {
    const { layout } = await oeffne('/gesetze/bund/OR?p=' + encodeURIComponent('/gesetze/bund/BV'), []);
    expect(gespeichert()).toEqual(['/gesetze/bund/BV']);
    await act(async () => layout().oeffneDaneben('/gesetze/bund/ZGB'));
    expect(gespeichert()).toEqual(['/gesetze/bund/BV', '/gesetze/bund/ZGB']);
  });
});
