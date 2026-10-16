// @vitest-environment node
// LESER-NAV B1 · Adresse und Hash folgen der Navigation (FB O-68, O-69b). Die Browser-Fälle (O-67, O-69a und
// die Gegenproben) stehen in `e2e/leser-hash-adresse-b1.e2e.ts`; hier die Teile, die ohne Browser prüfbar sind.
//
// ROT ZU BEKOMMEN (§6.7):
//   O-68  in `lib/seo.metaFuerPfad` `splitKarte(pfad, hash) ??` streichen ⇒ die Titel-Fälle messen «Zivilprozess».
//   O-69b in `usePaneLayout` den Zweig `ersetzeRef.current(ziel)` streichen ⇒ der Router wird nie gefragt.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { metaFuerPfad, splitKarte } from '../lib/seo';
import { labelAusMeta } from '../lib/verlaufLabel';
import { usePaneLayout } from '../components/layout/usePaneLayout';

describe('O-68 — document.title folgt der Zuständigkeits-Weiche', () => {
  it('#schkg und #straf tragen den Titel ihrer Karte, ohne Hash bleibt Zivil', () => {
    expect(metaFuerPfad('/rechner/zustaendigkeit', '#schkg')!.titel).toBe('Zuständigkeit Vollstreckung (SchKG) — LexMetrik');
    expect(metaFuerPfad('/rechner/zustaendigkeit', '#straf')!.titel).toBe('Zuständigkeit Strafverfahren — LexMetrik');
    expect(metaFuerPfad('/rechner/zustaendigkeit', '')!.titel).toBe('Zuständigkeit Zivilprozess — LexMetrik');
    expect(metaFuerPfad('/rechner/zustaendigkeit')!.titel).toBe('Zuständigkeit Zivilprozess — LexMetrik'); // Prerender: ohne Hash
  });

  it('eine Quelle mit dem Reiter-Titel: dieselbe Karte, derselbe Titel', () => {
    for (const h of ['#schkg', '#straf']) {
      expect(metaFuerPfad('/rechner/zustaendigkeit', h)!.titel)
        .toBe(`${labelAusMeta(`/rechner/zustaendigkeit${h}`)} — LexMetrik`);
    }
  });

  it('Randfälle: unbekannter Hash, Artikel-Anker und Kündigung ändern den Titel nicht', () => {
    expect(metaFuerPfad('/rechner/zustaendigkeit', '#irgendwas')!.titel).toBe('Zuständigkeit Zivilprozess — LexMetrik');
    expect(metaFuerPfad('/rechner/zustaendigkeit', '#art-336_c')!.titel).toBe('Zuständigkeit Zivilprozess — LexMetrik');
    const ohne = metaFuerPfad('/rechner/kuendigung')!.titel;
    for (const h of ['#lohnfortzahlung', '#kuendigung', '#kombiniert']) {
      expect(metaFuerPfad('/rechner/kuendigung', h)!.titel).toBe(ohne);
      expect(splitKarte('/rechner/kuendigung', h)).toBeNull();
    }
    expect(metaFuerPfad('/gesetze/bund/OR', '#art-1')).toBeNull();
  });

  it('Beschreibung und Canonical bleiben die der Seite (Self-Canonical ohne Hash)', () => {
    const basis = metaFuerPfad('/rechner/zustaendigkeit')!;
    const schkg = metaFuerPfad('/rechner/zustaendigkeit', '#schkg')!;
    expect(schkg.canonical).toBe(basis.canonical);
    expect(schkg.beschreibung).toBe(basis.beschreibung);
  });
});

// ── O-69b · `?p=` verlässt die Adresse über die übergebene Funktion (Router), sonst über replaceState ──
let root: Root | null = null;
let url: URL;
const replaceState = vi.fn();

async function oeffne(adresse: string, ersetze?: (ziel: string) => void): Promise<void> {
  url = new URL(adresse, 'https://lexmetrik.test');
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const speicher = new Map<string, string>();
  const ls = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, v); },
    removeItem: (k: string) => { speicher.delete(k); },
  };
  replaceState.mockReset();
  replaceState.mockImplementation((_s: unknown, _t: string, ziel: string) => { url = new URL(ziel, url); });
  vi.stubGlobal('window', {
    document,
    localStorage: ls,
    get location() { return { href: url.href, search: url.search, pathname: url.pathname, hash: url.hash }; },
    history: { state: null, replaceState },
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('localStorage', ls);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  function Sonde() { usePaneLayout(ersetze); return null; }
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  await act(async () => { root!.render(createElement(Sonde)); });
}

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('O-69b — Seed-Bereinigung der Adresse', () => {
  const MIT_P = '/gesetze/bund/ZGB?p=' + encodeURIComponent('/gesetze/bund/OR') + '#art-5';

  it('mit Router-Funktion: sie bekommt die Adresse ohne ?p= (Hash bleibt), replaceState bleibt ungenutzt', async () => {
    const ersetze = vi.fn();
    await oeffne(MIT_P, ersetze);
    expect(ersetze).toHaveBeenCalledTimes(1);
    expect(ersetze).toHaveBeenCalledWith('/gesetze/bund/ZGB#art-5');
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('Randfall: andere Query-Parameter bleiben erhalten', async () => {
    const ersetze = vi.fn();
    await oeffne('/gesetze/bund/ZGB?r=2&p=' + encodeURIComponent('/gesetze/bund/OR') + '&ansicht=einzel#art-5', ersetze);
    expect(ersetze).toHaveBeenCalledWith('/gesetze/bund/ZGB?r=2&ansicht=einzel#art-5');
  });

  it('ohne ?p= wird nichts ersetzt', async () => {
    const ersetze = vi.fn();
    await oeffne('/gesetze/bund/ZGB#art-5', ersetze);
    expect(ersetze).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('ohne Funktion (Aufrufer ausserhalb des Routers) gilt der bisherige Weg über replaceState', async () => {
    await oeffne(MIT_P);
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(url.pathname + url.search + url.hash).toBe('/gesetze/bund/ZGB#art-5');
  });
});
