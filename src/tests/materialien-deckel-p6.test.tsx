/**
 * W2·31-BILDSCHIRMBREITE P6 (30.9.2026): `/materialien` rendert je Behörde
 * höchstens MATERIAL_DECKEL Karten; der Rest hängt am «Weitere anzeigen»-Knopf.
 * Vorher: alle 1'684 Register-Einträge als Karte (78'552 px hoch @1920,
 * 17'158 DOM-Knoten, gemessen am Build vor dem Fix).
 *
 * Geprüft wird die AUSSAGE, nicht der Quelltext: Kartenzahl im DOM, Zähler des
 * Gruppenkopfs (volle Gruppe), Restzahl am Knopf, Wachsen um einen Deckel je
 * Klick, Zurücksetzen bei Filterwechsel, Filter über den GANZEN Bestand
 * (ein Treffer hinter dem Deckel bleibt auffindbar).
 *
 * B1 (Zweitprüfung): das aufgeklappte Fenster je Behörde überlebt «Detailseite
 * und zurück» (Unmount + neuer Mount über dieselbe Sitzung), Filterwechsel setzt
 * es zurück, die Behörden teilen kein Fenster. B2: der Zähler wird als Element
 * des Gruppenkopfs (`.num`) geprüft, nicht als Teilstring der ganzen Gruppe.
 *
 * ROT ZU BEKOMMEN: in `MaterialRaster.tsx` `.slice(0, sichtbar)` streichen →
 * «100 Karten» rot; oder die Zurücksetz-Zeile (`setVorherMenge`) streichen →
 * «Filterwechsel setzt den Deckel zurück» rot; das lazy `leseFenster` im
 * `useState` durch `MATERIAL_DECKEL` ersetzen → «Fenster kommt zurück» rot;
 * `zahl={g.materialien.length}` in `Materialien.tsx` auf `Math.min(…, 100)`
 * kürzen → die beiden Kopfzähler-Prüfungen rot.
 */
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Materialien } from '../pages/Materialien';
import { MATERIAL_DECKEL } from '../components/materialien/MaterialRaster';
import type { BrowseMaterial } from '../lib/materialien/typen';

const eintrag = (key: string, behoerde: BrowseMaterial['behoerde'], titel: string): BrowseMaterial => ({
  key, behoerde, behoerdeName: behoerde, behoerdeKuerzel: behoerde, doktyp: 'kreisschreiben', doktypLabel: 'Kreisschreiben', titel,
  nummer: null, rechtsgebiet: 'steuerrecht' as BrowseMaterial['rechtsgebiet'], sprache: 'de' as BrowseMaterial['sprache'],
  status: 'nur-live-link' as BrowseMaterial['status'], quelleUrl: 'https://www.admin.ch/', stand: '2026-01-01',
  rang: 1, normKeys: [], hinweis: null,
});

// Randdaten abseits des Glücksfalls: 250 (2 Stapel + Rest 50), genau der Deckel
// (kein Knopf), ein Stück über dem Deckel (Rest 1). Der Titel trägt eine
// laufende Nummer, damit ein Treffer HINTER dem Deckel gesucht werden kann.
const GROSS = Array.from({ length: 250 }, (_, i) => eintrag(`BR-${String(i).padStart(3, '0')}`, 'BR', `Botschaft Nr. ${i}`));
const GENAU = Array.from({ length: MATERIAL_DECKEL }, (_, i) => eintrag(`ESTV-${i}`, 'ESTV', `Kreisschreiben Nr. ${i}`));
const EINS_DRUEBER = Array.from({ length: MATERIAL_DECKEL + 1 }, (_, i) => eintrag(`SECO-${i}`, 'SECO', `Wegleitung Nr. ${i}`));
const MANIFEST = { erzeugt: '2026-09-30', materialien: [...GROSS, ...GENAU, ...EINS_DRUEBER] };

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

// Sitzungsspeicher-Attrappe (linkedom hat keinen): ein Objekt je Testfall, das
// über Unmount/Neu-Mount hinweg derselbe bleibt — wie die Browser-Sitzung.
function sitzung() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
  };
}

async function oeffne(speicher: ReturnType<typeof sitzung> = sitzung()) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  // React wählt beim ersten Laden von react-dom/client, ob es `input`-Ereignisse
  // direkt hört (`'oninput' in document`) — darum Stub VOR dem dynamischen Import.
  (document as unknown as { oninput: null }).oninput = null;
  vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('sessionStorage', speicher);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => MANIFEST })));
  const { createRoot } = await import('react-dom/client');
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  const root = createRoot(ziel);
  await act(async () => { root.render(<MemoryRouter><Materialien /></MemoryRouter>); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  const gruppe = (id: string) => ziel.querySelector(`#b-${id}`) as unknown as HTMLElement;
  const karten = (id: string) => gruppe(id).querySelectorAll('a[href^="/materialien/"]').length;
  const knopf = (id: string) => [...gruppe(id).querySelectorAll('button')].find((b) => /Weitere anzeigen/.test(b.textContent ?? '')) as unknown as HTMLElement | undefined;
  const klick = async (el: HTMLElement) => { await act(async () => { el.dispatchEvent(new window.Event('click', { bubbles: true })); }); };
  const tippe = async (text: string) => {
    const feld = ziel.querySelector('#materialien-filter') as unknown as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(feld), 'value')?.set?.call(feld, text);
      feld.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
  };
  const kopfZahl = (id: string) => gruppe(id).querySelector('.num')?.textContent;
  return { ziel, root, gruppe, karten, knopf, klick, tippe, kopfZahl };
}

describe('P6 · Deckel je Behörde auf /materialien', () => {
  it('250 Einträge → 100 Karten, Kopf zählt 250, Knopf nennt 150 weitere', async () => {
    const t = await oeffne();
    expect(t.karten('b-BR'.slice(2))).toBe(MATERIAL_DECKEL);
    expect(t.kopfZahl('BR')).toBe('250');
    expect(t.knopf('BR')?.textContent).toBe('Weitere anzeigen (150 weitere)');
    act(() => t.root.unmount());
  });

  it('genau am Deckel: alle Karten, kein Knopf; einen darüber: 100 Karten + «1 weitere»', async () => {
    const t = await oeffne();
    expect(t.karten('ESTV')).toBe(MATERIAL_DECKEL);
    expect(t.knopf('ESTV')).toBeUndefined();
    expect(t.karten('SECO')).toBe(MATERIAL_DECKEL);
    expect(t.knopf('SECO')?.textContent).toBe('Weitere anzeigen (1 weitere)');
    act(() => t.root.unmount());
  });

  it('Klick wächst um einen Deckel; der letzte Stapel lässt den Knopf verschwinden', async () => {
    const t = await oeffne();
    await t.klick(t.knopf('BR')!);
    expect(t.karten('BR')).toBe(2 * MATERIAL_DECKEL);
    expect(t.knopf('BR')?.textContent).toBe('Weitere anzeigen (50 weitere)');
    await t.klick(t.knopf('BR')!);
    expect(t.karten('BR')).toBe(250);
    expect(t.knopf('BR')).toBeUndefined();
    // Die Nachbargruppen bleiben unberührt (jede Gruppe hat ihr eigenes Fenster).
    expect(t.karten('SECO')).toBe(MATERIAL_DECKEL);
    act(() => t.root.unmount());
  });

  it('der Filter läuft über den ganzen Bestand: ein Treffer hinter dem Deckel ist auffindbar', async () => {
    const t = await oeffne();
    // «Nr. 249» steht an Stelle 250 der Gruppe — hinter dem Deckel, nicht im DOM.
    expect(t.gruppe('BR').textContent).not.toContain('Botschaft Nr. 249');
    await t.tippe('Nr. 249');
    expect(t.gruppe('BR').textContent).toContain('Botschaft Nr. 249');
    expect(t.karten('BR')).toBe(1);
    expect(t.knopf('BR')).toBeUndefined();
    act(() => t.root.unmount());
  });

  it('Filterwechsel setzt den Deckel zurück (kein stehengebliebenes, langes Fenster)', async () => {
    const t = await oeffne();
    await t.klick(t.knopf('BR')!);
    expect(t.karten('BR')).toBe(2 * MATERIAL_DECKEL);
    await t.tippe('Botschaft');          // 250 Treffer in BR
    expect(t.karten('BR')).toBe(MATERIAL_DECKEL);
    expect(t.knopf('BR')?.textContent).toBe('Weitere anzeigen (150 weitere)');
    // Bei aktivem Filter gilt der Deckel auf die gefilterte Menge, der Kopf zählt sie.
    await t.tippe('Nr. 1');              // 1, 10–19, 100–199 = 111 Treffer
    expect(t.kopfZahl('BR')).toBe('111');
    expect(t.karten('BR')).toBe(MATERIAL_DECKEL);
    expect(t.knopf('BR')?.textContent).toBe('Weitere anzeigen (11 weitere)');
    act(() => t.root.unmount());
  });

  it('B1: nach «Detailseite und zurück» (Unmount, neuer Mount, gleiche Sitzung) steht das aufgeklappte Fenster wieder', async () => {
    const speicher = sitzung();
    const a = await oeffne(speicher);
    await a.klick(a.knopf('BR')!);
    await a.klick(a.knopf('BR')!);
    expect(a.karten('BR')).toBe(250);
    await act(async () => { a.root.unmount(); });
    const b = await oeffne(speicher);
    expect(b.karten('BR')).toBe(250);            // sofort im ersten Render, nicht wieder 100
    expect(b.knopf('BR')).toBeUndefined();
    // Je Behörde ein eigenes Fenster: die Nachbarn bleiben beim Deckel.
    expect(b.karten('SECO')).toBe(MATERIAL_DECKEL);
    expect(b.knopf('SECO')?.textContent).toBe('Weitere anzeigen (1 weitere)');
    act(() => b.root.unmount());
  });

  it('B1: ein Filterwechsel verwirft das Fenster auch für die Rückkehr', async () => {
    const speicher = sitzung();
    const a = await oeffne(speicher);
    await a.klick(a.knopf('BR')!);
    expect(a.karten('BR')).toBe(2 * MATERIAL_DECKEL);
    await a.tippe('Botschaft');                  // neue Menge → Fenster wieder am Deckel
    expect(a.karten('BR')).toBe(MATERIAL_DECKEL);
    await act(async () => { a.root.unmount(); });
    const b = await oeffne(speicher);            // Rückkehr OHNE weiteren Filterwechsel
    expect(b.karten('BR')).toBe(MATERIAL_DECKEL);
    act(() => b.root.unmount());
  });

  it('B1: ein unplausibles Sitzungsfenster fällt auf den Deckel zurück (kein erzwungenes DOM)', async () => {
    const speicher = sitzung();
    speicher.setItem('rsp:deckel:materialien:BR', '0:999999');
    const t = await oeffne(speicher);
    expect(t.karten('BR')).toBe(MATERIAL_DECKEL);
    act(() => t.root.unmount());
  });

  it('die Sprungziele #b-<Behörde> bleiben für jede Gruppe im DOM', async () => {
    const t = await oeffne();
    for (const id of ['BR', 'ESTV', 'SECO']) expect(t.gruppe(id), `#b-${id}`).not.toBeNull();
    act(() => t.root.unmount());
  });
});
