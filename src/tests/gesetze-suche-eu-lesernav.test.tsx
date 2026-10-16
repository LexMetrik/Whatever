/**
 * LESER-NAV O-04 — Gesetze-Suche: EU-Verordnungen sind keine «Staatsverträge».
 *
 * Vorher (gemessen 16.10.2026, Register 1'580 Einträge): `herkunft()` in
 * `GesetzeSuche.tsx` hängte ALLE 37 `international`-Erlasse unter den Kopf
 * «Staatsverträge», darunter DSGVO, KI-VO, DSA, DMA, MiCA, Rom I/II, Brüssel Ia
 * (8 EU-Verordnungen ohne SR-Nummer, in der Schweiz nicht unmittelbar geltend).
 * Die Menge kommt aus der Rubrik `eu-verordnungen` (international-rubriken.ts, §5).
 *
 * ROT ZU BEKOMMEN (§6.7, gefahren 16.10.2026): in `herkunft()` den EU-Zweig
 * durch `{ rang: 1, titel: 'Staatsverträge' }` ersetzen ⇒ Fall 1 rot; die
 * Label-Zeichenfolge in `GesetzeBlatt.tsx` zurücksetzen ⇒ Fall 3 rot.
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
    erlass({ key: 'EMRK', kuerzel: 'EMRK', titel: 'Konvention zum Schutze der Menschenrechte und Grundfreiheiten', sr: '0.101', rechtsgebiet: 'international' }),
    erlass({ key: 'FZA', kuerzel: 'FZA', titel: 'Freizügigkeitsabkommen Schweiz-EG Verordnung', sr: '0.142.112.681', rechtsgebiet: 'international' }),
    erlass({ key: 'DSGVO', kuerzel: 'DSGVO', titel: 'Verordnung (EU) 2016/679 (Datenschutz-Grundverordnung, DSGVO)', rechtsgebiet: 'international' }),
    erlass({ key: 'KI_VO', kuerzel: 'KI-VO', titel: 'Verordnung (EU) 2024/1689 zur Festlegung harmonisierter Vorschriften', rechtsgebiet: 'international' }),
    erlass({ key: 'VZV', kuerzel: 'VZV', titel: 'Verordnung über die Zulassung', sr: '741.51' }),
  ],
};

let root: Root | null = null;
let Ev: typeof Event;

function aufbauen(): HTMLElement {
  const { document, Event: E } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  Ev = E as unknown as typeof Event;
  (document as unknown as { oninput: null }).oninput = null;
  vi.stubGlobal('window', { document, location: { pathname: '/' }, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => REGISTER }) as unknown as Response));
  return document.getElementById('app') as unknown as HTMLElement;
}

async function zeige(ziel: HTMLElement, pfad: string[]) {
  const { GesetzeBlatt } = await import('../components/start/GesetzeBlatt');
  const { createRoot } = await import('react-dom/client');
  root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(MemoryRouter, null, createElement(GesetzeBlatt, { ort: { rubrik: 'gesetze', pfad }, gehe: () => {} })));
  });
}

const feld = (ziel: HTMLElement) => ziel.querySelector('input[type="search"]') as HTMLInputElement;

async function tippe(ziel: HTMLElement, wert: string) {
  const f = feld(ziel);
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(f), 'value')?.set;
  if (setter) setter.call(f, wert); else f.value = wert;
  await act(async () => { f.dispatchEvent(new Ev('input', { bubbles: true })); });
  await act(async () => { await Promise.resolve(); });
}

const koepfe = (ziel: HTMLElement) => [...ziel.querySelectorAll('h3, h4, [data-gruppenkopf]')].map((n) => n.textContent?.trim());

describe('O-04 · Gesetze-Suche: Rechtsnatur der internationalen Treffer', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(async () => {
    if (root) { const r = root; root = null; await act(async () => r.unmount()); }
    vi.unstubAllGlobals();
  });

  it('«verordnung»: EU-Verordnungen unter «EU-Verordnungen», FZA unter «Staatsverträge», VZV unter «Bund»', async () => {
    const ziel = aufbauen();
    await zeige(ziel, []);
    await tippe(ziel, 'verordnung');
    expect(koepfe(ziel)).toEqual(['Bund', 'Staatsverträge', 'EU-Verordnungen']);
    // Abschnitt = Text zwischen dem Kopf und dem nächsten Kopf (Köpfe stehen in Treffer-Reihenfolge).
    const text = ziel.textContent ?? '';
    const abschnitt = (titel: string) => {
      const reihe = koepfe(ziel) as string[];
      const von = text.indexOf(titel, text.indexOf('Bund'));
      const nach = reihe[reihe.indexOf(titel) + 1];
      return text.slice(von, nach ? text.indexOf(nach, von + titel.length) : undefined);
    };
    expect(abschnitt('EU-Verordnungen')).toContain('Datenschutz-Grundverordnung');
    expect(abschnitt('EU-Verordnungen')).toContain('2024/1689');
    expect(abschnitt('EU-Verordnungen')).not.toContain('Freizügigkeitsabkommen');
    expect(abschnitt('Staatsverträge')).toContain('Freizügigkeitsabkommen');
    expect(abschnitt('Staatsverträge')).not.toContain('Datenschutz');
  });

  it('EMRK bleibt unter «Staatsverträge», ohne Kopf «EU-Verordnungen»', async () => {
    const ziel = aufbauen();
    await zeige(ziel, []);
    await tippe(ziel, 'menschenrechte');
    expect(koepfe(ziel)).toEqual(['Staatsverträge']);
  });

  it('Stufe «international»: das Filterfeld benennt beides, was die Stufe führt', async () => {
    const ziel = aufbauen();
    await zeige(ziel, ['international']);
    const f = feld(ziel);
    const label = (f.getAttribute('placeholder') ?? '') + (f.getAttribute('aria-label') ?? '') + (ziel.textContent ?? '');
    expect(label).toContain('Staatsverträge und EU-Verordnungen filtern');
  });
});
