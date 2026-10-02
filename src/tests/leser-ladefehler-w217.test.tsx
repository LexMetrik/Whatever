// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE · PA-3-B01 / PA-3-B02 / PE-C10-D01 — der Leser unterscheidet
 * «nicht vorhanden» (nicht im Register, Datei 404) von «Ladefehler» (Netz, 5xx,
 * Abbruch) und bietet bei Letzterem «Erneut laden» statt «nicht im Bestand».
 *
 * Vorzustand (1.10.2026, `/gesetze/bund/OR` mit 503 auf `bund/OR.json`): die
 * Fehlseite sagte ««OR» ist nicht als Erlass im Bestand» und schlug «OR» vor;
 * ein gescheiterter `register.json` wurde bis zum Neuladen des Tabs gecacht.
 *
 * ECHTE Effekt-Ausführung (linkedom + `createRoot` + `act`, Muster von
 * `leser-case-redirect-a1.test.ts`); `vi.resetModules()` je Fall, weil
 * `browse.ts` Register und Dateien modulweit hält.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';
import { useMeldeInhaltsKopf } from '../components/layout/InhaltsKopfKontext';

type MeldeKopf = ReturnType<typeof useMeldeInhaltsKopf>;
type GlobalPatch = Record<string, unknown>;

const OR = { key: 'OR', ebene: 'bund', kuerzel: 'OR', titel: 'Obligationenrecht', datei: 'bund/OR.json', status: 'geprueft', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de' };
const REGISTER = { erlasse: [OR] };
const DATEI = { eintraege: [{ artikel: '1' }] };

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const fehler = (code: number) => ({ ok: false, status: code, json: async () => ({}) }) as unknown as Response;

type Antworten = { register: () => Response; datei: () => Response };

/** Letzter Wert, den `setFehler` erhielt (das `fehler`-Feld der Instanz). */
const letzterFehler = (m: { setFehler: { mock: { calls: unknown[][] } } }) => m.setFehler.mock.calls.at(-1)?.[0];
const erneutLaden = (m: Parameters<typeof letzterFehler>[0] & { act: (f: () => Promise<void>) => Promise<void> }) =>
  m.act(async () => { (letzterFehler(m) as { erneut: () => void }).erneut(); });
const ladefehler = (grund: 'datei' | 'register') => expect.objectContaining({ art: 'ladefehler', grund, erneut: expect.any(Function) });

/** Mountet `useLeserDaten` und liefert die Setter-Aufrufe. */
async function montiere(schluessel: string, antworten: Antworten) {
  vi.resetModules();
  const { window, document } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  const urls: string[] = [];
  (globalThis as GlobalPatch).fetch = vi.fn(async (url: string) => {
    urls.push(String(url));
    if (String(url).endsWith('/normtext/register.json')) return antworten.register();
    if (String(url).endsWith('/bund/OR.json') && !String(url).includes('/struktur/')) return antworten.datei();
    return fehler(404);
  });

  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useLeserDaten } = await import('../pages/gesetz-leser/inhalt-hooks');

  const setFehler = vi.fn();
  const setEintraege = vi.fn();
  const setManifest = vi.fn();
  const setErlass = vi.fn();
  function Harness() {
    useLeserDaten({
      ebene: 'bund', schluessel, navigate: (() => {}) as unknown as NavigateFunction, erlass: null, istSekundaer: false,
      meldeInhaltsKopf: (() => {}) as unknown as MeldeKopf,
      setManifest, setCurrency: () => {}, setStruktur: () => {}, setKopf: () => {},
      setKantonSys: () => {}, setKantonLuecken: () => {}, setErlass, setEintraege,
      setFehler,
    });
    return null;
  }
  const root = createRoot(document.getElementById('root') as unknown as Element);
  const lasse = async () => { for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
  await act(async () => { root.render(React.createElement(Harness)); });
  await lasse();
  return { setFehler, setEintraege, setManifest, setErlass, urls, lasse, act, root };
}

afterEach(() => {
  delete (globalThis as GlobalPatch).window;
  delete (globalThis as GlobalPatch).document;
  delete (globalThis as GlobalPatch).fetch;
});

describe('useLeserDaten — Ladefehler ≠ nicht vorhanden', () => {
  it('Erlass-Datei 503: Fehlerzustand MIT Ladefehler-Marke «datei» (PA-3-B01, PE-C10-D01)', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(503) });
    expect(letzterFehler(m)).toEqual(ladefehler('datei'));
    expect(m.setEintraege).not.toHaveBeenCalled();
  });

  it('Erlass-Datei 404 (echt): Fehlerzustand OHNE Marke — Fehlseite unverändert', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(404) });
    expect(letzterFehler(m)).toBe('nicht-im-bestand');
  });

  it('Schlüssel nicht im Register: Fehlerzustand OHNE Marke — Fehlseite unverändert', async () => {
    const m = await montiere('ORR', { register: () => ok(REGISTER), datei: () => fehler(404) });
    expect(letzterFehler(m)).toBe('nicht-im-bestand');
  });

  it('Register 503: Fehlerzustand mit Marke «register», Manifest bleibt null (PA-3-B02)', async () => {
    const m = await montiere('OR', { register: () => fehler(503), datei: () => ok(DATEI) });
    expect(letzterFehler(m)).toEqual(ladefehler('register'));
    expect(m.setManifest).toHaveBeenLastCalledWith(null);
  });

  it('«Erneut laden» nach Datei-503: lädt neu, Fehler fällt, Marke weg, Eintraege gesetzt', async () => {
    let versuch = 0;
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => (++versuch === 1 ? fehler(503) : ok(DATEI)) });
    expect(letzterFehler(m)).toEqual(ladefehler('datei'));
    await erneutLaden(m);
    await m.lasse();
    expect(m.setFehler).toHaveBeenCalledWith(false); // Fehlerzustand gelöst → Ladeanzeige
    expect(letzterFehler(m)).toBe(false); // und kein neuer Fehler danach
    expect(m.setEintraege).toHaveBeenCalledWith(DATEI.eintraege);
  });

  it('«Erneut laden» nach Register-503: das Register wird NEU geholt (nicht aus dem Fehler-Cache)', async () => {
    let versuch = 0;
    const m = await montiere('OR', { register: () => (++versuch === 1 ? fehler(503) : ok(REGISTER)), datei: () => ok(DATEI) });
    expect(letzterFehler(m)).toEqual(ladefehler('register'));
    await erneutLaden(m);
    await m.lasse();
    expect(letzterFehler(m)).toBe(false);
    expect(m.setManifest).toHaveBeenLastCalledWith(REGISTER);
    expect(m.setEintraege).toHaveBeenCalledWith(DATEI.eintraege);
    expect(m.urls.filter((u) => u.endsWith('/normtext/register.json'))).toHaveLength(2);
  });

  it('scheitert der Neuversuch erneut, steht der Ladefehler wieder (kein stilles Verschwinden)', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(503) });
    await erneutLaden(m);
    await m.lasse();
    expect(letzterFehler(m)).toEqual(ladefehler('datei'));
  });

  it('nach Unmount schreibt ein spät aufgerufenes «Erneut laden» keinen Zustand mehr (kein Leck)', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(503) });
    const erneut = (letzterFehler(m) as { erneut: () => void }).erneut;
    await m.act(async () => { m.root.unmount(); });
    const anzahl = m.setFehler.mock.calls.length;
    await m.act(async () => { erneut(); });
    await m.lasse();
    expect(m.setFehler.mock.calls.length).toBe(anzahl);
  });
});

describe('GesetzFehlSeite — ehrliche Meldung statt «nicht im Bestand» (PE-C10-D01)', () => {
  const ssr = async (art: 'datei' | 'register' | null) => {
    vi.resetModules();
    const { GesetzFehlSeite } = await import('../pages/gesetz-leser/FehlSeite');
    const fehlerFeld = art ? { art: 'ladefehler' as const, grund: art, erneut: () => {} } : 'nicht-im-bestand' as const;
    return renderToStaticMarkup(
      <MemoryRouter><GesetzFehlSeite schluessel="OR" manifest={art === 'register' ? null : (REGISTER as never)} fehler={fehlerFeld} /></MemoryRouter>,
    );
  };

  it('Ladefehler «datei»: Meldung, «Erneut laden», role=alert, KEIN «nicht im Bestand», kein Vorschlag auf sich selbst', async () => {
    const h = await ssr('datei');
    expect(h).toContain('konnte nicht geladen werden');
    expect(h).toContain('Erneut laden');
    expect(h).toMatch(/role="alert"/);
    expect(h).not.toContain('nicht als Erlass im Bestand');
    expect(h).not.toContain('Meinten Sie');
    expect(h).toContain('Zur Gesetzessammlung'); // Weiterweg bleibt (REGL:122/C1)
    expect(h).toContain('<h1');
  });

  it('Ladefehler «register»: sagt ehrlich, dass sich der Bestand so nicht prüfen lässt', async () => {
    const h = await ssr('register');
    expect(h).toContain('konnte nicht geladen werden');
    expect(h).toContain('Erneut laden');
    expect(h).not.toContain('nicht als Erlass im Bestand');
  });

  it('Positivkontrolle: ohne Marke bleibt die bisherige Fehlseite («nicht im Bestand», ohne «Erneut laden»)', async () => {
    const h = await ssr(null);
    expect(h).toContain('nicht als Erlass im Bestand');
    expect(h).not.toContain('Erneut laden');
  });
});
