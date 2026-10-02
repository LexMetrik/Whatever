import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStelleDaten } from '../components/layout/useStelleDaten';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { VerlaufManifeste } from '../lib/verlaufLabel';

// ─── W2·17-UI-BEFUNDE · DFG-F01 · der Hook, der die Reiter-Stelle mit Daten versorgt ──
//
// (1) Er SETZT das Ergebnis: nach dem Laden hängt `artikel[key]` am Manifest.
// (2) Er lädt PARALLEL (je Erlass einmal) — ein Reiter an Position 7 wartete
//     sonst auf die sechs davor (gemessen: 10 s Verzögerung je Datei ⇒ ~60 s).
// (3) Er lädt NUR, wo die Daten die Stelle ändern können (§15): Bund-Nummer,
//     Anhang N, Geltungsbereich und ZGB-Schlusstitel stehen im Token.
//
// ROT ZU BEKOMMEN (§6.7): (1) `setArtikel(...)` streichen; (2) `for … await` statt
// des `Promise.all`-Starts je Erlass (die Aufrufzahl vor dem ersten `resolve` sinkt auf 1);
// (3) `stelleBrauchtDaten` im Hook durch `true` ersetzen.

const lader = vi.hoisted(() => ({
  datei: [] as { datei: string; los: () => void }[],
  struktur: [] as string[],
}));
vi.mock('../lib/normtext/browse', () => ({
  ladeErlassDatei: (datei: string) => new Promise((res) => {
    lader.datei.push({
      datei,
      los: () => res({ eintraege: [{ artikel: '4', artikelLabel: '§ 4' }, { artikel: 'disp_u1_art_141', artikelLabel: 'Art. 141' }] }),
    });
  }),
  ladeStruktur: (ebene: string, key: string) => { lader.struktur.push(`${ebene}/${key}`); return Promise.resolve(null); },
}));

const erlass = (key: string, kuerzel: string, ebene: string): BrowseErlass =>
  ({ key, kuerzel, ebene, datei: `${ebene}/${key}.json`, titel: kuerzel, rechtsgebiet: 'oeffentlich' }) as unknown as BrowseErlass;

const ZH = erlass('ZH-211.11', 'GebV OG', 'kanton');
const OR = erlass('OR', 'OR', 'bund');
const PATG = erlass('PATG', 'PatG', 'bund');
const ZGB = erlass('ZGB', 'ZGB', 'bund');
const EMRK = erlass('EMRK', 'EMRK', 'bund');
const ERV = erlass('ERV', 'ERV', 'bund');
const manifest = (...e: BrowseErlass[]): VerlaufManifeste => ({ gesetze: { erlasse: e } as never });

let root: Root | null = null;
let ergebnis: VerlaufManifeste = {};
function Sonde({ tabs, m }: { tabs: { path: string }[]; m: VerlaufManifeste }) {
  ergebnis = useStelleDaten(tabs, m);
  return null;
}
async function rendere(tabs: { path: string }[], m: VerlaufManifeste) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  await act(async () => { root!.render(createElement(Sonde, { tabs, m })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
}
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
  lader.datei.length = 0; lader.struktur.length = 0; ergebnis = {};
});

describe('useStelleDaten', () => {
  it('(1) setzt die geladenen Einträge als `artikel` ans Manifest', async () => {
    await rendere([{ path: '/gesetze/kanton/ZH-211.11#art-4' }], manifest(ZH));
    expect(ergebnis.artikel).toBeUndefined(); // noch nichts geladen: Rückfallform
    await act(async () => { lader.datei[0].los(); });
    expect(ergebnis.artikel?.['ZH-211.11'].eintraege).toEqual([
      { artikel: '4', artikelLabel: '§ 4' }, { artikel: 'disp_u1_art_141', artikelLabel: 'Art. 141' },
    ]);
  });

  it('(2) lädt alle Erlasse parallel, je Erlass einmal — Struktur nur für Schlusstitel-Token', async () => {
    await rendere([
      { path: '/gesetze/kanton/ZH-211.11#art-4' },
      { path: '/gesetze/bund/OR#art-disp_u12_art_2_4' },
      { path: '/gesetze/bund/PATG#art-disp_u1_art_141' },
      { path: '/gesetze/bund/OR?r=2#art-disp_u12_art_3' }, // zweiter Reiter desselben Erlasses
    ], manifest(ZH, OR, PATG));
    // Noch KEINE Datei ist fertig — und trotzdem sind alle drei Erlasse angefragt.
    expect(lader.datei.map((d) => d.datei).sort()).toEqual(['bund/OR.json', 'bund/PATG.json', 'kanton/ZH-211.11.json']);
    expect(lader.struktur.sort()).toEqual(['bund/OR', 'bund/PATG']); // ZH: § 4 braucht keine Gliederung
    await act(async () => { lader.datei.forEach((d) => d.los()); });
    expect(Object.keys(ergebnis.artikel ?? {}).sort()).toEqual(['OR', 'PATG', 'ZH-211.11']);
  });

  it('(3) lädt nichts, wo der Token die Stelle schon sagt (Bund-Nummer, Anhang N, Geltungsbereich, ZGB-Schlusstitel)', async () => {
    await rendere([
      { path: '/gesetze/bund/OR#art-336_c' },
      { path: '/gesetze/bund/EMRK#art-scope_u1' },
      { path: '/gesetze/bund/ERV#art-annex_1' },
      { path: '/gesetze/bund/ZGB#art-disp_u1_art_12' },
      { path: '/rechner/fristen' },
    ], manifest(OR, EMRK, ERV, ZGB));
    expect(lader.datei).toEqual([]);
    expect(lader.struktur).toEqual([]);
    expect(ergebnis.artikel).toBeUndefined();
  });

  it('der Gliederungs-Bedarf eines später geöffneten Schlusstitel-Reiters wird nachgeholt', async () => {
    const m = manifest(PATG);
    await rendere([{ path: '/gesetze/bund/PATG#art-annex_u1' }], m); // braucht Daten, aber keine Gliederung
    expect(lader.struktur).toEqual([]);
    await act(async () => { root!.render(createElement(Sonde, { tabs: [{ path: '/gesetze/bund/PATG#art-annex_u1' }, { path: '/gesetze/bund/PATG?r=2#art-disp_u1_art_141' }], m })); });
    expect(lader.struktur).toEqual(['bund/PATG']);
  });
});
