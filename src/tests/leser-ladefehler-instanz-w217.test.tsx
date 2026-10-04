// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE · PA-3 / PE-C10-D01 · Auflage A1 der Gegenprüfung: der
 * Ladefehler gehört der LESER-INSTANZ, nicht dem Erlass-Schlüssel. Der frühere
 * globale Kanal (`ladefehler.ts`, ein Eintrag je Schlüssel) mischte zwei Fenster
 * mit demselben Erlass: Fenster A meldete «Register nicht erreichbar», Fenster B
 * (unbekanntes Kürzel, Register ok) zeigte trotzdem die Ladefehler-Seite, und
 * «Erneut laden» in B stiess nur A an.
 *
 * ECHTE Effekt-Ausführung mit ECHTEM Zustand je Instanz (linkedom + `createRoot`
 * + `act`): jede Instanz hält ihr `fehler`-Feld selbst und rendert
 * `GesetzFehlSeite` mit genau diesem Feld.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseHTML } from 'linkedom';
import type { NavigateFunction } from 'react-router-dom';

type GlobalPatch = Record<string, unknown>;

const OR = { key: 'OR', ebene: 'bund', kuerzel: 'OR', titel: 'Obligationenrecht', datei: 'bund/OR.json', status: 'geprueft', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de' };
const REGISTER = { erlasse: [OR] };
const DATEI = { eintraege: [{ artikel: '1' }] };

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const fehler = (code: number) => ({ ok: false, status: code, json: async () => ({}) }) as unknown as Response;

/** Zwei Leser-Instanzen im selben Modul-Haushalt (geteilter Register-/Datei-Cache). */
async function umgebung(antwort: (url: string, nr: number) => Response) {
  vi.resetModules();
  const { window, document } = parseHTML('<!doctype html><html><body><div id="a"></div><div id="b"></div></body></html>');
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  const zaehler = { register: 0, datei: 0 };
  (globalThis as GlobalPatch).fetch = vi.fn(async (url: string) => {
    const u = String(url);
    if (u.endsWith('/normtext/register.json')) return antwort(u, ++zaehler.register);
    if (u.endsWith('/bund/OR.json') && !u.includes('/struktur/')) return antwort(u, ++zaehler.datei);
    return fehler(404);
  });

  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter } = await import('react-router-dom');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useLeserDaten } = await import('../pages/gesetz-leser/inhalt-hooks');
  const { GesetzFehlSeite } = await import('../pages/gesetz-leser/FehlSeite');

  function Instanz({ schluessel }: { schluessel: string }) {
    const [fehlerZustand, setFehler] = React.useState<unknown>(false);
    const [manifest, setManifest] = React.useState<unknown>(null);
    const [eintraege, setEintraege] = React.useState<unknown>(null);
    useLeserDaten({
      ebene: 'bund', schluessel, navigate: (() => {}) as unknown as NavigateFunction, erlass: null, istSekundaer: false,
      meldeInhaltsKopf: (() => {}) as never,
      setManifest: setManifest as never, setCurrency: () => {}, setStruktur: () => {}, setKopf: () => {},
      setKantonSys: () => {}, setKantonLuecken: () => {}, setTeilausfall: () => {}, setErlass: () => {}, setEintraege: setEintraege as never,
      setFehler: setFehler as never,
    });
    if (fehlerZustand) {
      return React.createElement(MemoryRouter, null,
        React.createElement(GesetzFehlSeite, { schluessel, manifest: manifest as never, fehler: fehlerZustand as never }));
    }
    return React.createElement('p', { 'data-zustand': eintraege ? 'geladen' : 'laedt' });
  }

  const lasse = async () => { for (let i = 0; i < 8; i++) await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
  const mounte = async (id: string, schluessel: string) => {
    const root = createRoot(document.getElementById(id) as unknown as Element);
    await act(async () => { root.render(React.createElement(Instanz, { schluessel })); });
    await lasse();
    return { el: document.getElementById(id) as unknown as HTMLElement, root };
  };
  const klickeErneut = async (el: HTMLElement) => {
    const knopf = [...el.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Erneut laden'));
    expect(knopf, 'Knopf «Erneut laden» fehlt').toBeTruthy();
    await act(async () => { (knopf as HTMLElement).click(); });
    await lasse();
  };
  return { mounte, klickeErneut, lasse, zaehler };
}

afterEach(() => {
  delete (globalThis as GlobalPatch).window;
  delete (globalThis as GlobalPatch).document;
  delete (globalThis as GlobalPatch).fetch;
});

describe('Ladefehler je Leser-Instanz (A1)', () => {
  it('A: Register einmal 503 (Ladefehler) · B: gleicher unbekannter Schlüssel, Register ok → B zeigt «nicht im Bestand», nicht A\'s Ladefehler', async () => {
    const u = await umgebung((_url, nr) => (nr === 1 ? fehler(503) : ok(REGISTER)));
    const a = await u.mounte('a', 'XYZ');
    expect(a.el.textContent).toContain('konnte nicht geladen werden');
    const b = await u.mounte('b', 'XYZ');
    expect(b.el.textContent).toContain('nicht als Erlass im Bestand');
    expect(b.el.textContent).not.toContain('Erneut laden');
    // A bleibt unverändert beim eigenen Ladefehler
    expect(a.el.textContent).toContain('konnte nicht geladen werden');
  });

  it('«Erneut laden» wirkt nur auf die EIGENE Instanz: A erholt sich, B (ebenfalls Ladefehler) bleibt stehen', async () => {
    // erste zwei Datei-Abrufe (A, B) scheitern, danach ok
    const u = await umgebung((url, nr) => (url.endsWith('/normtext/register.json') ? ok(REGISTER) : (nr <= 2 ? fehler(503) : ok(DATEI))));
    const a = await u.mounte('a', 'OR');
    const b = await u.mounte('b', 'OR');
    expect(a.el.textContent).toContain('konnte nicht geladen werden');
    expect(b.el.textContent).toContain('konnte nicht geladen werden');
    const vorher = u.zaehler.datei;
    await u.klickeErneut(a.el);
    expect(a.el.querySelector('[data-zustand="geladen"]')).toBeTruthy();
    expect(b.el.textContent).toContain('konnte nicht geladen werden');
    expect(u.zaehler.datei).toBe(vorher + 1); // genau EIN Neuversuch (A), keiner für B
  });

  it('A: nicht im Register (eigener Zustand) · B: Ladefehler — jede Seite trägt ihre eigene Auskunft', async () => {
    const u = await umgebung((url) => (url.endsWith('/normtext/register.json') ? ok(REGISTER) : fehler(503)));
    const a = await u.mounte('a', 'ORR'); // nicht im Register
    const b = await u.mounte('b', 'OR'); // im Register, Datei 503
    expect(a.el.textContent).toContain('nicht als Erlass im Bestand');
    expect(b.el.textContent).toContain('konnte nicht geladen werden');
  });
});
