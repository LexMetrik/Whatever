/**
 * W2·29-WERKBANK-REST S1 · Entscheid-Suche — die Entscheide David 22.9.2026
 * (Posten `2026-09-21-entscheid-suche-zaehlzeile-und-mindestlaenge-david.md`
 * und `…-marken-schalter-hervorhebung-…`), je ein Block:
 *   (a) Zählzeile bleibt während der Rechenzeit LEER — Platz reserviert,
 *       kein «wird gezählt» (keine zusätzlichen aria-live-Sprechakte).
 * Harness wie `entscheid-erw-ein-stand.test.tsx`: Fake-Timer-Render gegen den
 * echten `ErwBereich`-Baum (linkedom + react-dom/client).
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErwBereich } from '../pages/entscheidErwBereich';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';

const ABSCHNITTE: EntscheidAbschnitt[] = [
  { typ: 'sachverhalt', bloecke: [{ marke: null, text: 'A. Ausgangslage.' }] },
  {
    typ: 'erwaegung',
    bloecke: [
      { marke: 'E. 1', text: 'Eintreten ist unbestritten.' },
      { marke: 'E. 2', text: 'Die Beschwerde ist begründet.' },
      { marke: 'E. 3', text: 'Die Beschwerde wird im Kostenpunkt abgewiesen.' },
    ],
  },
];
const BEGRIFF = 'Beschwerde';

let root: Root | null = null;

function aufbauen(): HTMLElement {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', {
    document,
    setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return document.getElementById('app') as unknown as HTMLElement;
}

async function rendern(ziel: HTMLElement, suche: string, markenAusRoh = false) {
  if (!root) root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(ErwBereich, {
      abschnitte: ABSCHNITTE, zitierteNormen: [], suche, onSuche: () => {},
      springe: () => {}, markenAusRoh, onMarkenSchalten: () => {},
      landkarteSteht: false, aktivAnker: null,
    }));
  });
}

async function abbauen() {
  if (!root) return;
  const r = root;
  root = null;
  await act(async () => r.unmount());
}

/** Der reservierte Auskunfts-Slot unter dem Suchfeld (`min-h-12`). */
function slot(ziel: HTMLElement): Element | null {
  return ziel.querySelector('[data-erw-suche]')?.closest('div')?.parentElement?.querySelector('.min-h-12') ?? null;
}

describe('(a) Zählzeile während der Rechenzeit: leer, Platz reserviert', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('der Slot steht schon vor dem Tippen (CLS 0) und ist leer', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    expect(slot(ziel), 'reservierter Slot').not.toBeNull();
    expect(slot(ziel)!.textContent).toBe('');
  });

  it('zwischen Eingabe und gewertetem Stand: KEIN Text im Slot, keine aria-live-Zeile', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    await rendern(ziel, BEGRIFF);          // Timer geplant, noch nicht gelaufen
    expect(slot(ziel)!.textContent, 'kein «wird gezählt», keine Zwischenansage').toBe('');
    expect(ziel.querySelector('[aria-live]'), 'keine Ansage vor dem Ergebnis').toBeNull();
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(ziel.querySelector('[data-erw-treffer]')?.textContent).toMatch(/^2 Treffer in 2 Erwägungen/);
  });
});
