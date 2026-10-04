/**
 * W2·27-BUND-FERTIG P5 · Bug-Check #1253 B1 (1.10.2026) — die Zeile «Erlass in
 * Kraft seit …» und die Leerzeile «Zu Art. N nichts erfasst.» blitzten an
 * Artikeln MIT Historie-Ereignis ~0,6 s auf.
 *
 * Ursache: die Sperre `historieFertig` fragte den EIGENEN Lader des Panels,
 * `blatt.historie` kommt aber vom LESER (`historieFuer`), der den Shard erst im
 * Leerlauf lädt (rIC-Timeout 1200 ms; Safari ohne rIC: setTimeout 1200). Das
 * Panel meldete «geladen», während `blatt.historie` noch `undefined` war.
 *
 * Geprüft wird die AUSSAGE der Fläche im Zustand «Panel-Lader fertig (alle
 * Panel-Fetches 404), Leser-Historie noch nicht da» — nicht die Hilfsfunktion.
 *
 * ROT ZU BEKOMMEN: in `usePanelTafeln` `historieFertig`/`ohneFassung` wieder an
 * einen Panel-eigenen Lader (statt an die Prop `historie` des Lesers) hängen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePanelTafeln } from '../pages/gesetz-leser/v3/PanelTafeln';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { ArtikelHistorie, HistorieShard } from '../lib/normtext/historie-laden';

const EINTRAG = {
  id: 'bund/CISG/art_7', ebene: 'bund', quelle: 'CISG', erlass: 'CISG', artikel: '7', artikelLabel: 'Art. 7',
  bloecke: [{ absatz: null, text: 'Lebender Wortlaut.' }], stand: '2026-05-22', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/x/de',
  abgerufen: '2026-10-01', fassungsToken: '20260522', sha: 'x',
} as unknown as NormSnapshot;
const HISTORIE = {
  giltSeit: '2001-01-01',
  ereignisse: [{ typ: 'fassung', datum: '2001-01-01', wirkung: false, quellen: [], absatz: null, item: null }],
} as unknown as ArtikelHistorie;
const SHARD = { erlass: 'CISG', abdeckung: { fussnoten: 0, ereignis: 0, referenz: 0, unparsed: 0 }, artikel: {}, residuum: [] } as unknown as HistorieShard;

let root: Root | null = null;
let ziel: HTMLElement;

async function rendere(el: React.ReactElement) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // Alle Panel-Fetches 404 ⇒ jeder Panel-eigene Lader meldet «geladen».
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => null }) as unknown as Response));
  ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  await act(async () => { root!.render(el); });
  for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
}
const text = () => (ziel.textContent ?? '').replace(/\s+/g, ' ');

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

function sonde(historie: { wert: HistorieShard | null; fertig: boolean }, blattHistorie?: ArtikelHistorie) {
  function Sonde() {
    const t = usePanelTafeln({
      erlassKey: 'CISG', laden: true, quelleUrl: 'https://www.fedlex.admin.ch/', ebene: 'bund', stichtag: null,
      aktArtikel: '7', artikelLabel: 'Art. 7', blatt: { eintrag: EINTRAG, historie: blattHistorie },
      normZitat: 'Art. 7 CISG', wort: 'Artikel', erlassSr: '0.221.211.1', inkraftSeit: '1991-03-01', inkraftGestaffelt: false, historie,
    });
    return createElement('div', null, t.tafeln.aenderungen);
  }
  return createElement(MemoryRouter, null, createElement(Sonde));
}

describe('Reiter «Änderungen» · Sperre auf die Bereitschaft der LESER-Historie (B1)', () => {
  it('Panel-Lader fertig, Leser-Historie noch nicht da ⇒ weder «Erlass in Kraft seit» noch «nichts erfasst»', async () => {
    await rendere(sonde({ wert: null, fertig: false }));
    expect(text()).not.toContain('Erlass in Kraft seit');
    expect(text()).not.toContain('nichts erfasst');
  });

  it('Leser-Historie geladen, Artikel MIT Ereignis ⇒ keine der beiden Zeilen (kein Aufblitzen danach)', async () => {
    await rendere(sonde({ wert: SHARD, fertig: true }, HISTORIE));
    expect(text()).not.toContain('Erlass in Kraft seit');
    expect(text()).not.toContain('nichts erfasst');
  });

  it('Leser-Historie geladen, kein Shard (Staatsvertrag), kein Ereignis ⇒ «Erlass in Kraft seit 01.03.1991»', async () => {
    await rendere(sonde({ wert: null, fertig: true }));
    expect(text()).toContain('Erlass in Kraft seit 01.03.1991');
  });
});
