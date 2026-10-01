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

/** Mountet `useLeserDaten` und liefert die Setter-Aufrufe sowie den Kanal. */
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
  const kanal = await import('../pages/gesetz-leser/ladefehler');

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
  return { setFehler, setEintraege, setManifest, setErlass, kanal, urls, lasse, act, root };
}

afterEach(() => {
  delete (globalThis as GlobalPatch).window;
  delete (globalThis as GlobalPatch).document;
  delete (globalThis as GlobalPatch).fetch;
});

describe('useLeserDaten — Ladefehler ≠ nicht vorhanden', () => {
  it('Erlass-Datei 503: Fehlerzustand MIT Ladefehler-Marke «datei» (PA-3-B01, PE-C10-D01)', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(503) });
    expect(m.setFehler).toHaveBeenCalledWith(true);
    expect(m.kanal.ladefehlerArt('OR')).toBe('datei');
    expect(m.setEintraege).not.toHaveBeenCalled();
  });

  it('Erlass-Datei 404 (echt): Fehlerzustand OHNE Marke — Fehlseite unverändert', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(404) });
    expect(m.setFehler).toHaveBeenCalledWith(true);
    expect(m.kanal.ladefehlerArt('OR')).toBeNull();
  });

  it('Schlüssel nicht im Register: Fehlerzustand OHNE Marke — Fehlseite unverändert', async () => {
    const m = await montiere('ORR', { register: () => ok(REGISTER), datei: () => fehler(404) });
    expect(m.setFehler).toHaveBeenCalledWith(true);
    expect(m.kanal.ladefehlerArt('ORR')).toBeNull();
  });

  it('Register 503: Fehlerzustand mit Marke «register», Manifest bleibt null (PA-3-B02)', async () => {
    const m = await montiere('OR', { register: () => fehler(503), datei: () => ok(DATEI) });
    expect(m.setFehler).toHaveBeenCalledWith(true);
    expect(m.kanal.ladefehlerArt('OR')).toBe('register');
    expect(m.setManifest).toHaveBeenLastCalledWith(null);
  });

  it('«Erneut laden» nach Datei-503: lädt neu, Fehler fällt, Marke weg, Eintraege gesetzt', async () => {
    let versuch = 0;
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => (++versuch === 1 ? fehler(503) : ok(DATEI)) });
    expect(m.kanal.ladefehlerArt('OR')).toBe('datei');
    await m.act(async () => { m.kanal.ladefehlerErneut('OR'); });
    await m.lasse();
    expect(m.setFehler).toHaveBeenLastCalledWith(false);
    expect(m.kanal.ladefehlerArt('OR')).toBeNull();
    expect(m.setEintraege).toHaveBeenCalledWith(DATEI.eintraege);
  });

  it('«Erneut laden» nach Register-503: das Register wird NEU geholt (nicht aus dem Fehler-Cache)', async () => {
    let versuch = 0;
    const m = await montiere('OR', { register: () => (++versuch === 1 ? fehler(503) : ok(REGISTER)), datei: () => ok(DATEI) });
    expect(m.kanal.ladefehlerArt('OR')).toBe('register');
    await m.act(async () => { m.kanal.ladefehlerErneut('OR'); });
    await m.lasse();
    expect(m.kanal.ladefehlerArt('OR')).toBeNull();
    expect(m.setManifest).toHaveBeenLastCalledWith(REGISTER);
    expect(m.setEintraege).toHaveBeenCalledWith(DATEI.eintraege);
    expect(m.urls.filter((u) => u.endsWith('/normtext/register.json'))).toHaveLength(2);
  });

  it('scheitert der Neuversuch erneut, steht die Marke wieder (kein stilles Verschwinden)', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(503) });
    await m.act(async () => { m.kanal.ladefehlerErneut('OR'); });
    await m.lasse();
    expect(m.kanal.ladefehlerArt('OR')).toBe('datei');
    expect(m.setFehler).toHaveBeenLastCalledWith(true);
  });

  it('Unmount räumt die Marke weg (kein Leck in den nächsten Besuch)', async () => {
    const m = await montiere('OR', { register: () => ok(REGISTER), datei: () => fehler(503) });
    expect(m.kanal.ladefehlerArt('OR')).toBe('datei');
    await m.act(async () => { m.root.unmount(); });
    expect(m.kanal.ladefehlerArt('OR')).toBeNull();
  });
});

describe('GesetzFehlSeite — ehrliche Meldung statt «nicht im Bestand» (PE-C10-D01)', () => {
  const ssr = async (art: 'datei' | 'register' | null) => {
    vi.resetModules();
    const kanal = await import('../pages/gesetz-leser/ladefehler');
    if (art) kanal.meldeLadefehler('OR', art, () => {});
    const { GesetzFehlSeite } = await import('../pages/gesetz-leser/FehlSeite');
    return renderToStaticMarkup(
      <MemoryRouter><GesetzFehlSeite schluessel="OR" manifest={art === 'register' ? null : (REGISTER as never)} /></MemoryRouter>,
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
