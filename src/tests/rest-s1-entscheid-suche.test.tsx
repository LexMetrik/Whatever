/**
 * W2·29-WERKBANK-REST S1 · Entscheid-Suche — die Entscheide David 22.9.2026
 * (Posten `2026-09-21-entscheid-suche-zaehlzeile-und-mindestlaenge-david.md`
 * und `…-marken-schalter-hervorhebung-…`), je ein Block:
 *   (a) Zählzeile bleibt während der Rechenzeit LEER — Platz reserviert,
 *       kein «wird gezählt» (keine zusätzlichen aria-live-Sprechakte).
 *   (b) Suche erst ab zwei Zeichen — Rail, Zähler, Landkarte und Hervorhebung.
 *   (c) Marken-Schalter «Hervorhebung» setzt sich beim Leeren der Suche zurück.
 * Harness wie `entscheid-erw-ein-stand.test.tsx`: Fake-Timer-Render gegen den
 * echten `ErwBereich`-Baum (linkedom + react-dom/client).
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErwBereich } from '../pages/entscheidErwBereich';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';
import { readFileSync } from 'node:fs';
import { sucheWirksam } from '../pages/entscheidLeserRegeln';
import { useEntscheidSuche } from '../pages/entscheidSucheZustand';

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

describe('(b) Suche erst ab zwei Zeichen', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('die Schwelle: zwei Zeichen nach trim(), Einzelzeichen wie «§» tragen keine Suche', () => {
    expect(sucheWirksam('')).toBe(false);
    expect(sucheWirksam('§')).toBe(false);
    expect(sucheWirksam(' 7 ')).toBe(false);
    expect(sucheWirksam('Be')).toBe(true);
    expect(sucheWirksam(' 64 ')).toBe(true);
  });

  it('ein Zeichen: keine Treffer-Zeile, volles Verzeichnis, ruhiger Hinweis ohne aria-live', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    const gliederung = ziel.querySelectorAll('nav[aria-label="Erwägungen"] ul li').length;
    await rendern(ziel, 'B');
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(ziel.querySelector('[data-erw-treffer]'), 'keine Zählung für ein Zeichen').toBeNull();
    expect(ziel.querySelectorAll('nav[aria-label="Erwägungen"] ul li').length).toBe(gliederung);
    const hinweis = ziel.querySelector('[data-erw-mindestlaenge]');
    expect(hinweis?.textContent).toBe('Suche ab zwei Zeichen.');
    expect(hinweis?.getAttribute('aria-live')).toBeNull();
  });

  it('das zweite Zeichen betritt die Suche SOFORT (0-ms-Regel), der Hinweis geht', async () => {
    const ziel = aufbauen();
    await rendern(ziel, '');
    await rendern(ziel, 'B');
    await act(async () => { vi.advanceTimersByTime(0); });
    await rendern(ziel, 'Be');
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(ziel.querySelector('[data-erw-treffer]')?.textContent).toMatch(/Treffer in/);
    expect(ziel.querySelector('[data-erw-mindestlaenge]')).toBeNull();
  });

  it('die Hervorhebung im Lesetext hängt an derselben Schwelle', () => {
    const q = readFileSync('src/pages/EntscheidLeser.tsx', 'utf8');
    expect(q).toContain('if (sucheWirksam(suche) && !markenAus) {');
    expect(q).toContain('const markenAus = sucheWirksam(suche) && markenAusRoh;');
  });
});

describe('(c) Leeren der Suche setzt den Marken-Schalter zurück', () => {
  type Api = ReturnType<typeof useEntscheidSuche>;
  let api: Api | null = null;
  function Sonde() { api = useEntscheidSuche(); return null; }
  async function tun(f: (a: Api) => void) { await act(async () => { f(api!); }); }

  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    api = null;
  });

  it('Suchen → Schalter aus → Feld leeren → neu suchen: Hervorhebung ist wieder AN', async () => {
    const ziel = aufbauen();
    root = createRoot(ziel);
    await act(async () => { root!.render(createElement(Sonde)); });
    await tun((a) => a.setzeSuche(BEGRIFF));
    await tun((a) => a.setzeMarkenAus(true));
    expect(api!.markenAusRoh).toBe(true);
    await tun((a) => a.setzeSuche('Beschw'));          // Verfeinern leert nicht
    expect(api!.markenAusRoh, 'Tippen ohne Leeren lässt den Schalter stehen').toBe(true);
    await tun((a) => a.setzeSuche('   '));              // nur Leerraum = leer
    expect(api!.markenAusRoh).toBe(false);
    await tun((a) => a.setzeSuche(BEGRIFF));
    expect(api!.markenAusRoh, 'beim nächsten Suchen wieder Farbe').toBe(false);
  });

  it('der Leser reicht genau diesen Setzer an das Suchfeld', () => {
    const q = readFileSync('src/pages/EntscheidLeser.tsx', 'utf8');
    expect(q).toContain('= useEntscheidSuche();');
    expect(q).toContain('onSuche={setzeSuche}');
    expect(q).not.toMatch(/useState\(''\);\s*\n[^\n]*\bsuche\b/);
  });
});
