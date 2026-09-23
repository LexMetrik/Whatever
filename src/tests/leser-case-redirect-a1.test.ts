// @vitest-environment node
/**
 * A-1 (Audit A, S6-W1a 23.9.2026) — der Case-Redirect des Lesers behält Anker
 * und Query.
 *
 * Befund: `/gesetze/bund/or#art-41` leitete auf `/gesetze/bund/OR` um und
 * verlor `#art-41` (`inhalt-hooks.tsx`, `navigate(erlassPfad(ziel))`). Der Leser
 * stand danach bei Art. 1, das Erlass-Blatt zeigte Art. 1, und der Einzelmodus
 * (`?ansicht=artikel`) fiel weg.
 *
 * ECHTE Effekt-Ausführung nach dem Muster von `kanton-luecken-bund-guard.test.ts`
 * (linkedom + `createRoot` + `act`), mit einem Register, das den Schlüssel nur
 * in anderer Schreibung kennt. Rot zu bekommen: in `useLeserDaten` wieder
 * `navigate(erlassPfad(ziel), …)` ohne `search`/`hash` rufen.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseHTML } from 'linkedom';
import type { NavigateFunction } from 'react-router-dom';
import { useMeldeInhaltsKopf } from '../components/layout/InhaltsKopfKontext';

type MeldeKopf = ReturnType<typeof useMeldeInhaltsKopf>;
type GlobalPatch = Record<string, unknown>;

async function umleitungFuer(schluessel: string, adresse?: { search: string; hash: string }): Promise<unknown[][]> {
  vi.resetModules();
  const { window, document } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  (globalThis as GlobalPatch).fetch = vi.fn(async (url: string) => {
    if (String(url).endsWith('/normtext/register.json')) {
      return { ok: true, status: 200, json: async () => ({ erlasse: [{ key: 'OR', ebene: 'bund', titel: 'Obligationenrecht' }] }) } as unknown as Response;
    }
    return { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
  });

  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useLeserDaten } = await import('../pages/gesetz-leser/inhalt-hooks');

  const aufrufe: unknown[][] = [];
  const navigate = ((...args: unknown[]) => { aufrufe.push(args); }) as unknown as NavigateFunction;
  function Harness() {
    useLeserDaten({
      ebene: 'bund', schluessel, navigate, erlass: null, istSekundaer: false,
      meldeInhaltsKopf: (() => {}) as unknown as MeldeKopf,
      setManifest: () => {}, setCurrency: () => {}, setStruktur: () => {}, setKopf: () => {},
      setKantonSys: () => {}, setKantonLuecken: () => {}, setErlass: () => {}, setEintraege: () => {},
      setFehler: () => {}, adresse,
    });
    return null;
  }
  const root = createRoot(document.getElementById('root') as unknown as Element);
  await act(async () => { root.render(React.createElement(Harness)); });
  // `ladeErlass` → `ladeBrowseManifest` sind verkettete Promises.
  for (let i = 0; i < 4; i++) await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  return aufrufe;
}

describe('A-1 — Case-Redirect behält Anker und Query', () => {
  afterEach(() => {
    delete (globalThis as GlobalPatch).window;
    delete (globalThis as GlobalPatch).document;
    delete (globalThis as GlobalPatch).fetch;
  });

  it('/gesetze/bund/or?ansicht=artikel#art-41 → /gesetze/bund/OR?ansicht=artikel#art-41 (replace)', async () => {
    const aufrufe = await umleitungFuer('or', { search: '?ansicht=artikel', hash: '#art-41' });
    expect(aufrufe).toHaveLength(1);
    expect(aufrufe[0][0]).toEqual({ pathname: '/gesetze/bund/OR', search: '?ansicht=artikel', hash: '#art-41' });
    expect(aufrufe[0][1]).toEqual({ replace: true });
  });

  it('Positiv-Kontrolle: ohne Case-Treffer keine Umleitung', async () => {
    const aufrufe = await umleitungFuer('xyz', { search: '', hash: '#art-1' });
    expect(aufrufe).toHaveLength(0);
  });
});
