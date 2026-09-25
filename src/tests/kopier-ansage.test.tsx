/**
 * W2·29-WERKBANK-REST S5b (25.9.2026) · ⧉-Quittung: jede Kopie über
 * `useKopieren` wird einem Screenreader angesagt (`ui/kopierAnsage`).
 *
 * Echter React-Render in linkedom (Muster `entscheid-erw-entprellung.test.tsx`):
 *   (1) die Region steht NACH dem Mount und VOR dem Klick im DOM (role=status,
 *       aria-live=polite, leer);
 *   (2) nach erfolgreichem Schreiben steht die Ansage darin, und die sichtbare
 *       Quittung am Knopf bleibt («⧉ Zitat kopieren» → «✓ kopiert»);
 *   (3) dieselbe Kopie zweimal ⇒ der Inhalt WECHSELT (erneute Ansage);
 *   (4) verweigerte Berechtigung ⇒ keine Ansage, kein Häkchen (§8);
 *   (5) ohne Angabe gilt der Standardtext; es gibt genau EINE Region.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKopieren } from '../components/useKopieren';
import { KOPIER_ANSAGE_ID, KOPIER_ANSAGE_TEXT } from '../components/ui/kopierAnsage';

let root: Root | null = null;
let doc: Document;

function Sonde({ ansage }: { ansage?: string }) {
  const { kopiert, kopieren } = useKopieren('Zitat X');
  return createElement('button', { type: 'button', onClick: () => kopieren(ansage ? { ansage } : undefined) },
    kopiert ? '✓ kopiert' : '⧉ Zitat kopieren');
}

async function aufbauen(schreiben: (t: string) => Promise<void>, ansage?: string) {
  ({ document: doc } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>') as unknown as { document: Document });
  vi.stubGlobal('window', { document: doc, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout });
  vi.stubGlobal('document', doc);
  vi.stubGlobal('navigator', { clipboard: { writeText: schreiben } });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  root = createRoot(doc.getElementById('app') as unknown as HTMLElement);
  await act(async () => { root!.render(createElement(Sonde, { ansage })); });
}
const knopf = () => doc.querySelector('button') as unknown as HTMLButtonElement;
const region = () => doc.getElementById(KOPIER_ANSAGE_ID);
async function klick() { await act(async () => { knopf().click(); await Promise.resolve(); }); }

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('Kopier-Quittung für Screenreader (⧉-Quittung, QS-UI Runde 8)', () => {
  it('Region steht vor dem Klick, Ansage erst nach dem Schreiben, sichtbares ✓ bleibt', async () => {
    await aufbauen(async () => {}, 'Zitat kopiert');
    const r = region();
    expect(r, 'Region nach dem Mount vorhanden').not.toBeNull();
    expect(r!.getAttribute('role')).toBe('status');
    expect(r!.getAttribute('aria-live')).toBe('polite');
    expect(r!.textContent).toBe('');
    await klick();
    expect(r!.textContent!.trim()).toBe('Zitat kopiert');
    expect(knopf().textContent).toBe('✓ kopiert');
  });

  it('dieselbe Kopie zweimal: der Inhalt wechselt (erneute Ansage)', async () => {
    await aufbauen(async () => {});
    await klick();
    const erst = region()!.textContent;
    await klick();
    const zweit = region()!.textContent;
    expect(erst!.trim()).toBe(KOPIER_ANSAGE_TEXT);
    expect(zweit!.trim()).toBe(KOPIER_ANSAGE_TEXT);
    expect(zweit).not.toBe(erst);
    expect(doc.querySelectorAll(`#${KOPIER_ANSAGE_ID}`)).toHaveLength(1);
  });

  it('verweigerte Berechtigung: keine Ansage, kein Häkchen (§8)', async () => {
    await aufbauen(() => Promise.reject(new Error('verweigert')));
    await klick();
    expect(region()!.textContent).toBe('');
    expect(knopf().textContent).toBe('⧉ Zitat kopieren');
  });
});
