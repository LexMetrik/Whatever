/**
 * A1-FUNDAMENT (7.10.2026) · `useUniversalSuche` — Volltext NUR über den Server.
 *
 * Entscheid David 7.10.2026: «suche zurückfahren. nur noch nach gesetzen und
 * werkzeugen suchen lassen. separat für entscheide»; Wortsuche in Gesetzestexten
 * «Ja, nur über Server». Diese Sonde beweist am echten React-Render, was der Hook
 * jetzt tut (und nicht mehr tut):
 *   (1) Solange der Server noch nicht geantwortet hat, steht die Volltext-Gruppe als
 *       Platzhalter (`laedt`) da und `allesGeladen` ist false — «Keine Treffer» wird
 *       nicht behauptet, bevor der Server gefragt wurde (§8).
 *   (2) Antwort mit Treffern → Gruppe 'online'; Ausfall → Gruppe mit
 *       `nichtVerfuegbar` (Hinweis statt stiller Leere); «nichts gefunden» → keine Gruppe.
 *   (3) Kein Artikel-Volltextindex: der Hook holt weder `such-index/…` noch lädt er
 *       das Entscheid-Register für eine gewöhnliche Suche.
 *   (4) Nur ein BGE-ZITAT («BGE 152 I 65») lädt das Entscheid-Register nach (Navigation,
 *       keine Suche).
 *   (5) Unter MIN_ZEICHEN wird der Server nicht gefragt.
 */
import { act, createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SuchGruppe } from '../lib/universalSuche';
import type { UniversalSucheErgebnis } from '../components/suche/useUniversalSuche';

let antwort: ((g: SuchGruppe | null) => void) | null = null;
const holeOnlineTreffer = vi.fn((...args: unknown[]) => { void args; return new Promise<SuchGruppe | null>((res) => { antwort = res; }); });
vi.mock('../lib/suche/onlineVolltext', async (orig) => ({
  ...(await orig<typeof import('../lib/suche/onlineVolltext')>()),
  holeOnlineTreffer: (q: string, o?: unknown) => holeOnlineTreffer(q, o),
}));
vi.mock('../lib/presetIndex', () => ({ presetSuche: () => [] }));
vi.mock('../lib/normtext/browse', async (orig) => ({
  ...(await orig<typeof import('../lib/normtext/browse')>()),
  ladeBrowseManifest: async () => ({ erlasse: [] }),
}));
const ladeEntscheidManifest = vi.fn(async () => ({ entscheide: [] }));
vi.mock('../lib/rechtsprechung/browse', async (orig) => ({
  ...(await orig<typeof import('../lib/rechtsprechung/browse')>()),
  ladeEntscheidManifest: () => ladeEntscheidManifest(),
}));
vi.mock('../lib/materialien/browse', async (orig) => ({
  ...(await orig<typeof import('../lib/materialien/browse')>()),
  ladeMaterialManifest: async () => ({ materialien: [] }),
}));

const { useUniversalSuche } = await import('../components/suche/useUniversalSuche');

let root: Root | null = null;
// Der Hook-Rückgabewert wird nach dem Render (im Effekt) in die Sonde geschrieben —
// nicht im Render selbst (react-hooks/globals).
const stand: { aktuell: UniversalSucheErgebnis | null } = { aktuell: null };
function Sonde({ q }: { q: string }) {
  const erg = useUniversalSuche(q);
  useEffect(() => { stand.aktuell = erg; });
  return null;
}

const fetchSpy = vi.fn();
async function rendere(q: string) {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', { document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', fetchSpy);
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  await act(async () => { root!.render(createElement(Sonde, { q })); });
  // Lazy-Importe auflösen lassen
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}
/** Wartet das Server-Entprellfenster (200 ms) ab. */
const entprellen = () => act(async () => { await new Promise((r) => setTimeout(r, 260)); });
const onlineGruppe = () => stand.aktuell!.gruppen.find((g) => g.id === 'online');

beforeEach(() => {
  antwort = null;
  stand.aktuell = null;
  holeOnlineTreffer.mockClear();
  ladeEntscheidManifest.mockClear();
  fetchSpy.mockClear();
});
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

const treffer = [{ id: 'art:OR:253', label: 'Art. 253 OR', href: '/gesetze/bund/OR#art-253' }];

describe('useUniversalSuche — Volltext über den Server', () => {
  it('vor der Antwort: Platzhalter (laedt), allesGeladen false; danach die Server-Gruppe', async () => {
    await rendere('miete');
    await entprellen();
    expect(holeOnlineTreffer).toHaveBeenCalledOnce();
    expect(holeOnlineTreffer.mock.calls[0][0]).toBe('miete');
    expect(onlineGruppe()?.laedt).toBe(true);
    expect(stand.aktuell!.allesGeladen).toBe(false); // «Keine Treffer» wäre vor der Serverantwort gelogen (§8)

    await act(async () => { antwort!({ id: 'online', titel: 'Volltext-Suche (online)', treffer, gesamt: 1 }); });
    const g = onlineGruppe()!;
    expect(g.laedt).toBeUndefined();
    expect(g.treffer).toEqual(treffer);
    expect(stand.aktuell!.allesGeladen).toBe(true);
    // Relevanz-Platz (A6): vor den Werkzeugen (Katalog «Mietvertrag …» trifft «miete»);
    // der Platzhalter stand von Anfang an dort, die Antwort füllt ihn nur (CLS, §15.2).
    const ids = stand.aktuell!.gruppen.map((x) => x.id);
    expect(ids).toContain('katalog');
    expect(ids.indexOf('online')).toBeLessThan(ids.indexOf('katalog'));
  });

  it('Ausfall des Servers → Gruppe mit nichtVerfuegbar + Hinweis, nicht stille Leere', async () => {
    await rendere('miete');
    await entprellen();
    const ausfall: SuchGruppe = {
      id: 'online', titel: 'Volltext-Suche (online)', treffer: [], gesamt: 0,
      nichtVerfuegbar: true, hinweis: 'Volltextsuche derzeit nicht verfügbar — …',
    };
    await act(async () => { antwort!(ausfall); });
    const g = onlineGruppe()!;
    expect(g.nichtVerfuegbar).toBe(true);
    expect(g.hinweis).toMatch(/Volltextsuche derzeit nicht verfügbar/);
    expect(stand.aktuell!.allesGeladen).toBe(true);
  });

  it('Server hat geantwortet und nichts gefunden → keine Gruppe, aber allesGeladen', async () => {
    await rendere('xyznichtda');
    await entprellen();
    await act(async () => { antwort!(null); });
    expect(onlineGruppe()).toBeUndefined();
    expect(stand.aktuell!.allesGeladen).toBe(true);
  });

  it('unter MIN_ZEICHEN (2 Zeichen): der Server wird nicht gefragt, kein Platzhalter', async () => {
    await rendere('or');
    await entprellen();
    expect(holeOnlineTreffer).not.toHaveBeenCalled();
    expect(onlineGruppe()).toBeUndefined();
    expect(stand.aktuell!.allesGeladen).toBe(true);
  });

  it('die Fläche bestimmt, wie viele Treffer geholt werden (Dropdown: 10)', async () => {
    await rendere('miete');
    await entprellen();
    expect(holeOnlineTreffer.mock.calls[0][1]).toMatchObject({ limit: 10 });
  });
});

describe('useUniversalSuche — kein Browser-Index, Entscheide getrennt', () => {
  it('gewöhnliche Suche: kein Fetch eines Suchindex, kein Entscheid-Register', async () => {
    await rendere('miete');
    await entprellen();
    expect(fetchSpy).not.toHaveBeenCalled(); // weder such-index/artikel.json noch sonst eine Datei
    expect(ladeEntscheidManifest).not.toHaveBeenCalled();
    expect(stand.aktuell!.gruppen.map((g) => g.id)).not.toContain('artikel');
    expect(stand.aktuell!.gruppen.map((g) => g.id)).not.toContain('entscheid');
  });

  it('BGE-Zitat: lädt das Entscheid-Register nach (Direktsprung ist Navigation, keine Suche)', async () => {
    await rendere('BGE 152 I 65');
    await entprellen();
    expect(ladeEntscheidManifest).toHaveBeenCalledOnce();
    // Der Sprung meldet sich als eigene Gruppe, nie als Entscheid-Trefferliste.
    expect(stand.aktuell!.gruppen.map((g) => g.id)).toContain('sprung');
    expect(stand.aktuell!.gruppen.map((g) => g.id)).not.toContain('entscheid');
  });

  it('die Abdeckung nennt keine BGE-Zahl mehr (das Register ist nicht geladen)', async () => {
    await rendere('miete');
    await entprellen();
    expect(stand.aktuell!.abdeckung).toEqual({ volltext: 0, kantonTitel: 0 });
  });
});
