/**
 * W2·29-WERKBANK-LESER S6 · Gegenprüfung PR #1001 (Sonnet, 23.9.2026): seit
 * den Etappen (AE-5) trägt ein gestaffelter Änderungserlass MEHRERE Einträge
 * mit demselben `ocUri` (AHVG ← AS 2023 92: 2024-01-01 · 2025-01-01 ·
 * 2034-01-01, alle in der Top-10-Ansicht). Beide Renderer schlüsselten nach
 * `ocUri` → doppelte React-Keys. Schlüssel ist `revisionSchluessel`
 * (`src/lib/normtext/revisionen.ts`), nie `ocUri`.
 */
import { act, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PanelAenderungen } from '../pages/gesetz-leser/v3/PanelAenderungen';
import { RevisionenGruppe } from '../components/kontext/RevisionenGruppe';
import type { RevisionBezug } from '../lib/normtext/revisionen';

const OC = 'https://fedlex.data.admin.ch/eli/oc/2023/92';
const etappe = (dateEntryInForce: string): RevisionBezug => ({
  art: 'aenderung', dateEntryInForce, ocUri: OC, titelDe: 'AHV 21',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/oc/2023/92/de', roFundstelle: 'AS 2023 92',
});
const ETAPPEN = [etappe('2034-01-01'), etappe('2025-01-01'), etappe('2024-01-01')];

/** Client-Render (nur der Reconciler meldet doppelte Keys, `renderToString`
 * schweigt — Rot-Beweis 23.9.2026) in ein linkedom-Dokument, wie
 * `entscheid-erw-ein-stand.test.tsx`. Liefert Warnungen + Text. */
function rendern(el: ReactElement): { doppelt: string[]; text: string } {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', { document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const fehler = vi.spyOn(console, 'error').mockImplementation(() => {});
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  const root = createRoot(ziel);
  act(() => root.render(el));
  const text = ziel.textContent ?? '';
  act(() => root.unmount());
  const doppelt = fehler.mock.calls.map((a) => a.map(String).join(' ')).filter((m) => /same key/i.test(m));
  return { doppelt, text };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Etappen desselben Änderungserlasses — eindeutige Listen-Schlüssel', () => {
  it('PanelAenderungen: keine doppelten Keys bei drei Etappen', () => {
    const { doppelt, text } = rendern(
      <PanelAenderungen stand={{ fertig: true, wert: { revisionen: ETAPPEN, reichweite: null } }}
        quelleUrl="https://www.fedlex.admin.ch/eli/cc/63/837_843_843/de" stichtag="2026-09-21" />,
    );
    expect(text.match(/AS 2023 92/g)?.length ?? 0).toBeGreaterThanOrEqual(3); // Vorbedingung: alle drei Etappen gerendert
    expect(doppelt).toEqual([]);
  });
  it('RevisionenGruppe: keine doppelten Keys bei drei Etappen', () => {
    const { doppelt, text } = rendern(
      <RevisionenGruppe revFehler={false} revAenderungen={ETAPPEN} revMarker={[]}
        botschaftNachKey={new Map()} locale="de" stichtag="2026-09-21" />,
    );
    expect(text).toContain('AHV 21'); // Vorbedingung: Liste gerendert
    expect(doppelt).toEqual([]);
  });
});
