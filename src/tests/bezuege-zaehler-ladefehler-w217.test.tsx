// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE · PE-E7-B02 — ein transienter Fehler auf dem Struktur-Sidecar
 * (`struktur/<ebene>/<KEY>.json`) macht die Bezüge-Zähler nicht mehr bis zum
 * Neuladen des Tabs stumm: der Hook holt sie beim `online`-Ereignis neu
 * (Muster `bezuegeLaden.ts`, E-14). Eine echte 404 (kein Sidecar) bleibt ein
 * ruhiges «keine Zähler» ohne Neuversuch.
 *
 * ECHTE Effekt-Ausführung (linkedom + `createRoot` + `act`).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseHTML } from 'linkedom';

type GlobalPatch = Record<string, unknown>;
type Nachschlag = (artikel: string) => { entscheide: number; materialien: number } | undefined;

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;
const fehler = (code: number) => ({ ok: false, status: code, json: async () => ({}) }) as unknown as Response;

async function montiere(antwort: () => Response) {
  vi.resetModules();
  const { window, document } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  const fetchMock = vi.fn(async () => antwort());
  (globalThis as GlobalPatch).fetch = fetchMock;

  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { useBezuegeZaehler } = await import('../pages/gesetz-leser/bezuegeZaehler');

  const stand: { nachschlag: Nachschlag | null } = { nachschlag: null };
  function Harness() {
    stand.nachschlag = useBezuegeZaehler({ ebene: 'bund', key: 'OR' });
    return null;
  }
  const root = createRoot(document.getElementById('root') as unknown as Element);
  const lasse = async () => { for (let i = 0; i < 5; i++) await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
  await act(async () => { root.render(React.createElement(Harness)); });
  await lasse();
  return { stand, fetchMock, window: window as unknown as Window, act, lasse, root };
}

afterEach(() => {
  delete (globalThis as GlobalPatch).window;
  delete (globalThis as GlobalPatch).document;
  delete (globalThis as GlobalPatch).fetch;
});

describe('useBezuegeZaehler — Ladefehler heilt beim online-Ereignis (PE-E7-B02)', () => {
  it('503, dann «online»: Neuversuch trifft, die Zähler stehen', async () => {
    let ruf = 0;
    const m = await montiere(() => (++ruf === 1 ? fehler(503) : ok({ zaehler: { '97': [4, 2] } })));
    expect(m.stand.nachschlag?.('97')).toBeUndefined();
    expect(m.fetchMock).toHaveBeenCalledTimes(1);
    await m.act(async () => { m.window.dispatchEvent(new (m.window as unknown as { Event: typeof Event }).Event('online')); });
    await m.lasse();
    expect(m.fetchMock).toHaveBeenCalledTimes(2);
    expect(m.stand.nachschlag?.('97')).toEqual({ entscheide: 4, materialien: 2 });
  });

  it('scheitert auch der Neuversuch, hört der Hook weiter auf «online»', async () => {
    let ruf = 0;
    const m = await montiere(() => (++ruf < 3 ? fehler(503) : ok({ zaehler: { '97': [1, 0] } })));
    const online = () => m.act(async () => { m.window.dispatchEvent(new (m.window as unknown as { Event: typeof Event }).Event('online')); });
    await online(); await m.lasse();
    expect(m.stand.nachschlag?.('97')).toBeUndefined();
    await online(); await m.lasse();
    expect(m.stand.nachschlag?.('97')).toEqual({ entscheide: 1, materialien: 0 });
  });

  it('echte 404 (kein Sidecar): kein Neuversuch bei «online» — gültige Auskunft', async () => {
    const m = await montiere(() => fehler(404));
    await m.act(async () => { m.window.dispatchEvent(new (m.window as unknown as { Event: typeof Event }).Event('online')); });
    await m.lasse();
    expect(m.fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Unmount meldet den Hörer ab: «online» danach löst keinen Abruf mehr aus', async () => {
    const m = await montiere(() => fehler(503));
    await m.act(async () => { m.root.unmount(); });
    await m.act(async () => { m.window.dispatchEvent(new (m.window as unknown as { Event: typeof Event }).Event('online')); });
    await m.lasse();
    expect(m.fetchMock).toHaveBeenCalledTimes(1);
  });
});
