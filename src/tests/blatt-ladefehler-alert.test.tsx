/**
 * O-35 (a) · Ladefehler der drei Start-Blätter (/gesetze, /materialien,
 * /rechtsprechung) wird Vorlesehilfen angesagt: die Fehlermeldung trägt
 * `role="alert"` (der Ladezustand daneben bleibt `role="status"`).
 *
 * Geprüft wird die AUSSAGE im gerenderten DOM bei abgelehntem Abruf, nicht der
 * Quelltext.
 *
 * ROT ZU BEKOMMEN: in `Gesetze.tsx`, `Materialien.tsx` oder `Rechtsprechung.tsx`
 * `role="alert"` an der Fehler-Notice streichen → der jeweilige Fall rot.
 */
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function oeffne(Seite: ComponentType) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  (document as unknown as { oninput: null }).oninput = null;
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const speicher = new Map<string, string>();
  const attrappe = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, v); },
    removeItem: (k: string) => { speicher.delete(k); },
  };
  vi.stubGlobal('sessionStorage', attrappe);
  vi.stubGlobal('localStorage', attrappe);
  // Leitung weg: jeder Abruf schlägt fehl.
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  const { createRoot } = await import('react-dom/client');
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  const root = createRoot(ziel);
  await act(async () => { root.render(<MemoryRouter><Seite /></MemoryRouter>); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  return { ziel, root };
}

const FAELLE: Array<[string, () => Promise<{ [k: string]: unknown }>, string, RegExp]> = [
  ['/gesetze', () => import('../pages/Gesetze'), 'Gesetze', /Gesetzessammlung konnte nicht geladen werden/],
  ['/materialien', () => import('../pages/Materialien'), 'Materialien', /Übersicht konnte nicht geladen werden/],
  ['/rechtsprechung', () => import('../pages/Rechtsprechung'), 'Rechtsprechung', /Rechtsprechungs-Sammlung konnte nicht geladen werden/],
];

describe('O-35 (a) · Ladefehler der Start-Blätter trägt role="alert"', () => {
  for (const [route, lade, name, wortlaut] of FAELLE) {
    it(`${route}: abgelehnter Abruf → Meldung mit role="alert"`, async () => {
      const mod = await lade();
      const t = await oeffne(mod[name] as ComponentType);
      const alerts = [...t.ziel.querySelectorAll('[role="alert"]')];
      expect(alerts.length, 'keine Meldung mit role="alert"').toBe(1);
      expect(alerts[0].textContent).toMatch(wortlaut);
      act(() => t.root.unmount());
    });
  }
});
