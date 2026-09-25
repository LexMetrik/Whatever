/**
 * W2·29-WERKBANK-REST S5b (25.9.2026) · `useUniversalSuche` — Abhängigkeiten der
 * `gruppen`-Memo (Lint-Warnung react-hooks/exhaustive-deps :176, Posten 24.9.).
 *
 * Die Memo las `artikelSuche?.fehlendeEbenen` / `?.nurOnlineEbenen`, führte sie
 * aber nicht in der Abhängigkeitsliste. Korrekt war das nur mittelbar: jede neue
 * `artikelSuche` (Stufe 1 Bund, Stufe 2 Kanton nachgerückt) erzeugt über die
 * `artikelTreffer`-Memo ein NEUES Treffer-Array, und das stand in der Liste.
 * Der Fix nimmt die beiden Felder ausdrücklich auf. Verhaltensneutral (§6), weil
 * `ladeArtikelSuche` beide Arrays je Stufe neu baut — sie wechseln genau dann,
 * wenn auch `artikelTreffer` wechselt. Diese Sonde beweist beides am echten
 * React-Render (Muster `entscheid-erw-entprellung.test.tsx`):
 *   (1) Das Nachrücken der kantonalen Ebene rechnet die Gruppen GENAU EINMAL
 *       neu — nicht häufiger (Posten: «prüfen, dass die Suche nicht häufiger
 *       neu rechnet») und nicht gar nicht (sonst bliebe «Kanton fehlt» stehen, §8).
 *   (2) Die letzte Rechnung sieht die NEUEN Ebenen-Felder.
 * Grün vorher (Basis 61a482355) UND nachher; Rot-Beweis per Mutation im Bericht.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sucheAlles = vi.fn((..._a: unknown[]) => []);
vi.mock('../lib/universalSuche', async (orig) => ({
  ...(await orig<typeof import('../lib/universalSuche')>()),
  sucheAlles: (...a: unknown[]) => sucheAlles(...a),
}));
vi.mock('../lib/suche/onlineVolltext', () => ({ MIN_ZEICHEN: 3, holeOnlineTreffer: async () => null }));
vi.mock('../lib/presetIndex', () => ({ presetSuche: () => [] }));
vi.mock('../lib/normtext/browse', () => ({ ladeBrowseManifest: async () => ({ erlasse: [] }) }));
vi.mock('../lib/rechtsprechung/browse', () => ({ ladeEntscheidManifest: async () => ({ entscheide: [] }) }));
vi.mock('../lib/materialien/browse', () => ({ ladeMaterialManifest: async () => ({ materialien: [] }) }));

type Stufe = { suche: () => never[]; fehlendeEbenen: string[]; nurOnlineEbenen: string[] };
let nachruecken: ((s: Stufe) => void) | null = null;
vi.mock('../lib/suche/artikelVolltext', () => ({
  SUCHE_OHNE_INDEX: { suche: () => [], fehlendeEbenen: [], nurOnlineEbenen: ['bund', 'kanton'] },
  ladeArtikelSuche: async (cb: (s: Stufe) => void) => {
    nachruecken = cb;
    return { suche: () => [], fehlendeEbenen: ['kanton'], nurOnlineEbenen: [] };
  },
}));

const { useUniversalSuche } = await import('../components/suche/useUniversalSuche');

let root: Root | null = null;
function Sonde({ q }: { q: string }) {
  useUniversalSuche(q);
  return null;
}
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

const zweitesArg = (i: number) => sucheAlles.mock.calls[i][1] as {
  artikelFehlendeEbenen?: string[]; artikelNurOnlineEbenen?: string[];
};

describe('useUniversalSuche — gruppen-Memo folgt den Ebenen-Feldern', () => {
  it('Nachrücken der Kantonsebene: genau EINE Neurechnung, mit den neuen Feldern', async () => {
    const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
    vi.stubGlobal('window', { document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout });
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    root = createRoot(document.getElementById('app') as unknown as HTMLElement);
    await act(async () => { root!.render(createElement(Sonde, { q: 'miete' })); });
    // alle Lazy-Importe auflösen lassen
    for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(nachruecken).not.toBeNull();
    const vorher = sucheAlles.mock.calls.length;
    expect(zweitesArg(vorher - 1).artikelFehlendeEbenen).toEqual(['kanton']);

    await act(async () => { nachruecken!({ suche: () => [], fehlendeEbenen: [], nurOnlineEbenen: [] }); });
    expect(sucheAlles.mock.calls.length - vorher).toBe(1);
    expect(zweitesArg(sucheAlles.mock.calls.length - 1).artikelFehlendeEbenen).toEqual([]);

    // Ein Re-Render mit derselben Eingabe rechnet NICHT neu.
    const stand = sucheAlles.mock.calls.length;
    await act(async () => { root!.render(createElement(Sonde, { q: 'miete' })); });
    expect(sucheAlles.mock.calls.length).toBe(stand);
  });
});
