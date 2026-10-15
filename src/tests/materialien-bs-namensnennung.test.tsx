/**
 * O-10 · CC-BY-Namensnennung der data.bs.ch-Datensätze (Grossratsgeschäfte
 * Basel-Stadt, `behoerde` «BS-GR») in der UI. Wo solche Einträge stehen,
 * steht auch die Namensnennung (Urheber Parlamentsdienst des Grossen Rates,
 * Datensätze 100311/100313 mit Link, Lizenz CC BY 4.0 mit Link, Änderungs-
 * vermerk; CC BY 4.0 Abschnitt 3(a)(1)); wo keine stehen (Bundes-Materialien,
 * kantonale Geschäfte anderer Behörden), steht sie nicht.
 *
 * Orte: Rubrik /materialien (Gruppe GR BS), Detailseite /materialien/:key,
 * Reiter «Materialien» im Gesetz-Leser (Abschnitt Grossrat), Start-Blatt.
 *
 * ROT ZU BEKOMMEN: in `Materialien.tsx`, `MaterialLeser.tsx`, `MaterialienBlatt.tsx`
 * oder `PanelMaterialien.tsx` die `BsOgdNachweis`-Zeile streichen → der jeweilige
 * Fall rot; `g.behoerde === 'BS-GR'` auf `true` ändern oder im Panel auf
 * `k.length > 0` zurück → «nicht bei Bundes-Materialien» bzw. der Fall mit dem
 * fiktiven Nicht-BS-Eintrag rot.
 */
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Materialien } from '../pages/Materialien';
import { MaterialLeser } from '../pages/MaterialLeser';
import { MaterialienBlatt } from '../components/start/MaterialienBlatt';
import { PanelMaterialien } from '../pages/gesetz-leser/v3/PanelMaterialien';
import { BsOgdNachweis } from '../components/materialien/BsOgdNachweis';
import type { BrowseMaterial } from '../lib/materialien/typen';
import type { MaterialStand } from '../pages/gesetz-leser/v3/panelKontextLaden';

const eintrag = (key: string, behoerde: BrowseMaterial['behoerde'], titel: string): BrowseMaterial => ({
  key, behoerde, behoerdeName: behoerde === 'BS-GR' ? 'Grosser Rat des Kantons Basel-Stadt' : 'Bundesrat',
  behoerdeKuerzel: behoerde === 'BS-GR' ? 'GR BS' : behoerde, doktyp: 'ratschlag', doktypLabel: 'Ratschlag', titel,
  nummer: '24.1692', rechtsgebiet: 'oeffentlich' as BrowseMaterial['rechtsgebiet'], sprache: 'de' as BrowseMaterial['sprache'],
  status: 'nur-live-link' as BrowseMaterial['status'], quelleUrl: 'https://grosserrat.bs.ch/?gnr=24.1692', stand: '2024-11-20',
  rang: 1, normKeys: [], hinweis: null,
});
const MANIFEST = { erzeugt: '2026-10-01', materialien: [eintrag('BS-GR-24.1692', 'BS-GR', 'Ratschlag Wahlgesetz'), eintrag('BR-1', 'BR', 'Botschaft Eins')] };

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function oeffne(pfad: string) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  (document as unknown as { oninput: null }).oninput = null;
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const m = new Map<string, string>();
  vi.stubGlobal('sessionStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => MANIFEST })));
  const { createRoot } = await import('react-dom/client');
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  const root = createRoot(ziel);
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[pfad]}><Routes><Route path="/materialien" element={<Materialien />} /><Route path="/materialien/:key" element={<MaterialLeser />} /></Routes></MemoryRouter>);
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  return { ziel, root };
}

describe('O-10 · Namensnennung data.bs.ch (CC BY 4.0)', () => {
  it('Baustein nennt Urheber, beide Datensätze und CC BY 4.0 als Link, dazu den Änderungsvermerk', () => {
    const html = renderToStaticMarkup(<BsOgdNachweis />);
    expect(html.replace(/<[^>]+>/g, '')).toBe(
      'Quelle: Parlamentsdienst des Grossen Rates Basel-Stadt, Datensätze 100311 und 100313 (data.bs.ch), Lizenz CC BY 4.0; von LexMetrik ausgewählt und Erlassen zugeordnet.',
    );
    expect(html).toContain('href="https://data.bs.ch/explore/dataset/100311/"');
    expect(html).toContain('href="https://data.bs.ch/explore/dataset/100313/"');
    expect(html).toContain('href="https://creativecommons.org/licenses/by/4.0/deed.de"');
    expect((html.match(/<a /g) ?? []).length).toBe(3);
  });

  it('/materialien: Nachweis in der Gruppe GR BS, nicht bei Bundes-Materialien', async () => {
    const t = await oeffne('/materialien');
    expect(t.ziel.querySelectorAll('[data-quelle-bs-ogd]').length).toBe(1);
    expect(t.ziel.querySelector('#b-BS-GR [data-quelle-bs-ogd]')).not.toBeNull();
    expect(t.ziel.querySelector('#b-BR [data-quelle-bs-ogd]')).toBeNull();
    act(() => t.root.unmount());
  });

  it('/materialien/:key: Nachweis bei einem BS-GR-Material, nicht bei einem Bundes-Material', async () => {
    const bs = await oeffne('/materialien/BS-GR-24.1692');
    expect(bs.ziel.textContent).toContain('Ratschlag Wahlgesetz');
    expect(bs.ziel.querySelectorAll('[data-quelle-bs-ogd]').length).toBe(1);
    act(() => bs.root.unmount());
    const br = await oeffne('/materialien/BR-1');
    expect(br.ziel.textContent).toContain('Botschaft Eins');
    expect(br.ziel.querySelector('[data-quelle-bs-ogd]')).toBeNull();
    act(() => br.root.unmount());
  });

  const reiter = (w: Partial<MaterialStand>) => renderToStaticMarkup(
    <MemoryRouter><PanelMaterialien ebene="kanton" stand={{ fertig: true, erneut: () => {}, wert: { botschaften: [], vernehmlassungen: [], kanton: [], erzeugt: '2026-10-01', ...w } }} /></MemoryRouter>,
  );

  it('Gesetz-Leser, Reiter «Materialien»: Nachweis nur mit Grossratsgeschäften', () => {
    const mit = reiter({ kanton: [{ key: 'BS-GR-24.1692', titel: 'Ratschlag', doktypLabel: 'Ratschlag', behoerdeKuerzel: 'GR BS', nummer: '24.1692', stand: '2024-11-20', quelleUrl: 'https://grosserrat.bs.ch/?gnr=24.1692', zuordnung: 'maschinell' }] });
    expect(mit).toContain('data-quelle-bs-ogd');
    expect(reiter({})).not.toContain('data-quelle-bs-ogd');
  });

  it('Gesetz-Leser: ein kantonales Geschäft einer anderen Behörde löst den BS-Nachweis nicht aus (A4)', () => {
    const fremd = { key: 'ZH-KR-1', titel: 'Vorlage', doktypLabel: 'Vorlage', behoerdeKuerzel: 'KR ZH', nummer: '1', stand: '2025-01-01', quelleUrl: 'https://example.org/', zuordnung: 'maschinell' as const };
    const bs = { key: 'BS-GR-24.1692', titel: 'Ratschlag', doktypLabel: 'Ratschlag', behoerdeKuerzel: 'GR BS', nummer: '24.1692', stand: '2024-11-20', quelleUrl: 'https://grosserrat.bs.ch/?gnr=24.1692', zuordnung: 'maschinell' as const };
    expect(reiter({ kanton: [fremd] })).not.toContain('data-quelle-bs-ogd');
    expect(reiter({ kanton: [fremd, bs] })).toContain('data-quelle-bs-ogd');
  });

  it('Start-Blatt «Materialien»: Nachweis nur, solange ein BS-GR-Eintrag in der Liste steht', async () => {
    const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
    vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => MANIFEST })));
    const { createRoot } = await import('react-dom/client');
    const ziel = document.getElementById('app') as unknown as HTMLElement;
    const root = createRoot(ziel);
    await act(async () => { root.render(<MemoryRouter><MaterialienBlatt /></MemoryRouter>); });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(ziel.textContent).toContain('Ratschlag Wahlgesetz');
    expect(ziel.querySelectorAll('[data-quelle-bs-ogd]').length).toBe(1);
    const waehleBehoerde = async (wert: string) => {
      const sel = ziel.querySelectorAll('select')[0] as unknown as HTMLSelectElement;
      sel.querySelectorAll('option').forEach((o) => { if (o.getAttribute('value') === wert) o.setAttribute('selected', ''); else o.removeAttribute('selected'); });
      await act(async () => { sel.dispatchEvent(new window.Event('change', { bubbles: true })); });
    };
    await waehleBehoerde('BR');
    expect(ziel.textContent).toContain('Botschaft Eins');
    expect(ziel.querySelector('[data-quelle-bs-ogd]')).toBeNull();
    act(() => root.unmount());
  });
});
