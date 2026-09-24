/**
 * W2·29-WERKBANK-START-UEBERARBEITUNG U11 — Suche auf ALLEN Stufen des
 * Gesetze-Blatts. David 24.9.2026: «bei gesetze soll auf allenen ebenen eine
 * suche möglich sien».
 *
 * Geprüft wird am echten React-Render (`react-dom/client` in ein
 * `linkedom`-DOM, Stil wie `begruessung-strictmode.test.tsx`):
 * 1. Wahl-Stufe: Suchfeld «Gesetze durchsuchen» über den drei Spalten.
 * 2. §15: KEIN Register-Abruf beim Öffnen der Stufe — erst beim Fokus ins Feld.
 * 3. Tippen «or» ersetzt die Spalten durch die Trefferliste (Bund, Staatsvertrag
 *    und Kanton gemischt, Herkunft als Gruppenkopf), die Trefferzahl steht in
 *    einer `role=status`-Zeile; leeres Feld zeigt wieder die Spalten.
 * 4. Gebiete und Kantone durchsuchen nur ihren Bereich.
 *
 * ROT ZU BEKOMMEN: in `GesetzeSuche.tsx` (`StufenSuche`) statt der
 * Trefferliste immer `children` rendern → Fall 3 rot; `useRegister(gewollt)`
 * durch `useRegister()` ersetzen → Fall 2 rot.
 */
import { act, createElement } from 'react';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass = (p: Partial<BrowseErlass> & Pick<BrowseErlass, 'key' | 'kuerzel' | 'titel'>): BrowseErlass => ({
  ebene: 'bund', kanton: null, sr: null, rechtsgebiet: 'privatrecht', sprache: 'de', rang: 1, status: 'snapshot',
  datei: null, artikelAnzahl: 0, stand: '2026-01-01', quelleUrl: 'https://www.fedlex.admin.ch/', fassungsToken: '', pdfPfad: null,
  ...p,
} as BrowseErlass);

const REGISTER = {
  erlasse: [
    erlass({ key: 'ZGB', kuerzel: 'ZGB', titel: 'Schweizerisches Zivilgesetzbuch', sr: '210' }),
    erlass({ key: 'OR', kuerzel: 'OR', titel: 'Obligationenrecht', sr: '220' }),
    erlass({ key: 'EMRK', kuerzel: 'EMRK', titel: 'Konvention zum Schutze der Menschenrechte und Grundfreiheiten', sr: '0.101', rechtsgebiet: 'international' }),
    erlass({ key: 'ZH-GOG', ebene: 'kanton', kanton: 'ZH', kuerzel: 'GOG', titel: 'Gesetz über die Gerichts- und Behördenorganisation', sr: '211.1', rechtsgebiet: 'staat' as BrowseErlass['rechtsgebiet'] }),
    erlass({ key: 'BE-KV', ebene: 'kanton', kanton: 'BE', kuerzel: 'KV', titel: 'Verfassung des Kantons Bern', sr: '101.1', rechtsgebiet: 'staat' as BrowseErlass['rechtsgebiet'] }),
  ],
};

let root: Root | null = null;
let fetchMock: ReturnType<typeof vi.fn>;
let Ev: typeof Event;

function aufbauen(): HTMLElement {
  const { document, Event: E } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  Ev = E as unknown as typeof Event;
  // React wählt beim ersten Laden von react-dom, ob es `input`-Ereignisse
  // direkt hört (sonst IE-Polyfill mit `attachEvent`): `'oninput' in document`.
  (document as unknown as { oninput: null }).oninput = null;
  vi.stubGlobal('window', { document, location: { pathname: '/' }, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => REGISTER }) as unknown as Response);
  vi.stubGlobal('fetch', fetchMock);
  return document.getElementById('app') as unknown as HTMLElement;
}

async function zeige(ziel: HTMLElement, pfad: string[]) {
  // Frisches Modul je Fall: `ladeBrowseManifest` hält das Register modulweit.
  const { GesetzeBlatt } = await import('../components/start/GesetzeBlatt');
  // react-dom erst nach dem DOM-Stub laden (s. `aufbauen`).
  const { createRoot } = await import('react-dom/client');
  root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(MemoryRouter, null, createElement(GesetzeBlatt, { ort: { rubrik: 'gesetze', pfad }, gehe: () => {} })));
  });
}

const feld = (ziel: HTMLElement) => ziel.querySelector('input[type="search"]') as HTMLInputElement;

async function fokus(ziel: HTMLElement) {
  await act(async () => { feld(ziel).dispatchEvent(new Ev('focusin', { bubbles: true })); });
}

async function tippe(ziel: HTMLElement, wert: string) {
  const f = feld(ziel);
  // Am React-Wertverfolger vorbei setzen (wie ein echter Tastendruck), dann `input`.
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(f), 'value')?.set;
  if (setter) setter.call(f, wert); else f.value = wert;
  await act(async () => { f.dispatchEvent(new Ev('input', { bubbles: true })); });
  await act(async () => { await Promise.resolve(); });
}

const registerAbrufe = () => fetchMock.mock.calls.filter(([u]) => String(u).includes('/normtext/register.json')).length;
const status = (ziel: HTMLElement) => [...ziel.querySelectorAll('[role="status"]')].map((n) => n.textContent?.replace(/\s+/g, ' ').trim());
const kopfTexte = (ziel: HTMLElement) => [...ziel.querySelectorAll('h3, h4, [data-gruppenkopf]')].map((n) => n.textContent?.trim());

describe('U11 · Gesetze-Blatt: Suche auf allen Stufen', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(async () => {
    if (root) { const r = root; root = null; await act(async () => r.unmount()); }
    vi.unstubAllGlobals();
  });

  it('Wahl: Feld «Gesetze durchsuchen», kein Register-Abruf beim Öffnen, erst beim Fokus', async () => {
    const ziel = aufbauen();
    await zeige(ziel, []);
    expect(feld(ziel)).toBeTruthy();
    expect(feld(ziel).getAttribute('placeholder')).toBe('Gesetze durchsuchen');
    expect(ziel.querySelector('ul[aria-label="Rechtsgebiete des Bundes"]')).toBeTruthy();
    expect(registerAbrufe()).toBe(0);
    await fokus(ziel);
    expect(registerAbrufe()).toBe(1);
  });

  it('Wahl: «or» ersetzt die Spalten durch die Treffer aller Ebenen; leer → Spalten zurück', async () => {
    const ziel = aufbauen();
    await zeige(ziel, []);
    await tippe(ziel, 'or');
    const text = ziel.textContent ?? '';
    // «or» trifft Obligationenrecht (Bund) und «Behördenorganisation» (ZH), nicht ZGB/EMRK/KV.
    expect(status(ziel)).toContain('2 Erlasse');
    expect(text).toContain('Obligationenrecht');
    expect(text).toContain('Gerichts- und Behördenorganisation');
    expect(text).not.toContain('Zivilgesetzbuch');
    expect(kopfTexte(ziel)).toEqual(expect.arrayContaining(['Bund', 'Zürich (ZH)']));
    expect(ziel.querySelector('ul[aria-label="Rechtsgebiete des Bundes"]')).toBeNull();
    // Zeile = derselbe Erlass-Link wie in den bestehenden Listen.
    expect([...ziel.querySelectorAll('a')].some((a) => /\/gesetze\/.*OR/.test(a.getAttribute('href') ?? ''))).toBe(true);

    await tippe(ziel, 'menschenrechte');
    expect(status(ziel)).toContain('1 Erlass');
    expect(kopfTexte(ziel)).toContain('Staatsverträge');

    await tippe(ziel, 'xyzq');
    expect(status(ziel).join(' ')).toContain('Kein Erlass passt auf «xyzq»');

    await tippe(ziel, '');
    expect(ziel.querySelector('ul[aria-label="Rechtsgebiete des Bundes"]')).toBeTruthy();
  });

  it('Gebiete durchsucht nur Bundesrecht, Kantone nur kantonales Recht', async () => {
    let ziel = aufbauen();
    await zeige(ziel, ['bund']);
    expect(feld(ziel).getAttribute('placeholder')).toBe('Bundesrecht durchsuchen');
    expect(registerAbrufe()).toBe(0);
    await tippe(ziel, 'e'); // trifft alle fünf — im Bereich nur ZGB und OR
    expect(status(ziel)).toContain('2 Erlasse');
    expect(ziel.textContent).not.toContain('Menschenrechte');
    await act(async () => root!.unmount());
    root = null;
    vi.unstubAllGlobals();
    vi.resetModules();

    ziel = aufbauen();
    await zeige(ziel, ['kantone']);
    expect(feld(ziel).getAttribute('placeholder')).toBe('Kantonales Recht durchsuchen');
    await tippe(ziel, 'e');
    expect(status(ziel)).toContain('2 Erlasse');
    expect(kopfTexte(ziel)).toEqual(expect.arrayContaining(['Zürich (ZH)', 'Bern (BE)']));
    expect(ziel.textContent).not.toContain('Obligationenrecht');
  });
});
