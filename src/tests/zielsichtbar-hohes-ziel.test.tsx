/**
 * W2·31-BILDSCHIRMBREITE Bündel I — `useZielSichtbar`: die Schwelle «20 % des
 * Ziels» ist bei einem Ziel über fünf Fensterhöhen unerreichbar (Posten
 * 2026-09-30, Prüfer #1154). Neu: sichtbar ⇔ Anteil ≥ 20 % ODER sichtbare
 * Höhe ≥ 50 % der Fensterhöhe; die Pixel-Schwelle steht in der Schwellenliste
 * des IntersectionObserver (er ruft nur an Schwellen zurück).
 *
 * Stil wie `entscheid-erw-entprellung.test.tsx`: echtes `react-dom/client` in
 * einem `linkedom`-DOM; `IntersectionObserver` ist ein Mock, der Schwellenliste
 * und Rückruf festhält und Einträge auf Kommando ausliefert.
 *
 * ROT ZU BEKOMMEN (§6.7): in `useZielSichtbar.ts` `zielGenugImBild` auf die
 * reine Anteils-Bedingung (`return anteil >= MINDEST_SICHTBARKEIT`) und/oder
 * `zielSchwellen` auf `[0, MINDEST_SICHTBARKEIT]` zurücksetzen → die Fälle
 * «hohes Ziel» schlagen fehl; die Fälle «kleines Ziel»/«Bahn» bleiben grün
 * (Verhalten normaler Ziele ist unverändert).
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useZielSichtbar, zielGenugImBild, zielSchwellen } from '../components/vorlagen/useZielSichtbar';

// ── IntersectionObserver-Mock ───────────────────────────────────────────────
type Eintrag = Pick<IntersectionObserverEntry, 'intersectionRatio' | 'isIntersecting'> & {
  intersectionRect: { height: number };
  rootBounds: { height: number } | null;
};
class MockIO {
  static alle: MockIO[] = [];
  getrennt = false;
  constructor(public rueckruf: (e: Eintrag[]) => void, public optionen: IntersectionObserverInit = {}) { MockIO.alle.push(this); }
  observe() {}
  disconnect() { this.getrennt = true; }
  liefere(e: Eintrag) { this.rueckruf([e]); }
  get schwellen(): number[] { return [this.optionen.threshold ?? 0].flat(); }
}
/** Der aktive «beliebig»-Beobachter: der mit Schwellenliste (nicht der «oben»-Beobachter mit rootMargin). */
const beliebig = () => MockIO.alle.filter((o) => !o.getrennt && o.optionen.rootMargin === undefined).at(-1)!;
const oben = () => MockIO.alle.find((o) => !o.getrennt && o.optionen.rootMargin !== undefined)!;

// ── Render-Gerüst ───────────────────────────────────────────────────────────
let root: Root | null = null;
let resizeRueckrufe: (() => void)[] = [];

function Sonde() {
  return createElement('span', { 'data-sichtbar': true }, String(useZielSichtbar('ziel')));
}

async function rendern(ziel: { breite: number; hoehe: number }, fenster: { breite: number; hoehe: number }) {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div><div id="ziel"></div></body></html>');
  const zielEl = document.getElementById('ziel') as unknown as HTMLElement;
  const masse = { ...ziel };
  (zielEl as unknown as { getBoundingClientRect: () => unknown }).getBoundingClientRect = () => ({ width: masse.breite, height: masse.hoehe });
  const fensterMasse = { ...fenster };
  resizeRueckrufe = [];
  vi.stubGlobal('window', {
    document,
    get innerWidth() { return fensterMasse.breite; },
    get innerHeight() { return fensterMasse.hoehe; },
    addEventListener: (art: string, f: () => void) => { if (art === 'resize') resizeRueckrufe.push(f); },
    removeEventListener: () => {},
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('IntersectionObserver', MockIO);
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  await act(async () => { root!.render(createElement(Sonde)); });
  return {
    sichtbar: () => document.querySelector('[data-sichtbar]')!.textContent,
    setzeZielHoehe: (h: number) => { masse.hoehe = h; },
    fensterWirdNeuGemessen: async () => { await act(async () => { resizeRueckrufe.forEach((f) => f()); }); },
  };
}

const eintrag = (anteil: number, sichtbarPx: number, fensterH: number): Eintrag =>
  ({ intersectionRatio: anteil, isIntersecting: anteil > 0, intersectionRect: { height: sichtbarPx }, rootBounds: { height: fensterH } });

beforeEach(() => { MockIO.alle = []; });
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

// ── Die reine Entscheidung ──────────────────────────────────────────────────
describe('zielGenugImBild — Anteil ODER Pixel, Grenzwerte', () => {
  it('Anteil genau 20 % reicht, knapp darunter nicht (Fenster-Pixel klein)', () => {
    expect(zielGenugImBild(0.2, 10, 900)).toBe(true);
    expect(zielGenugImBild(0.1999, 10, 900)).toBe(false);
  });
  it('halbe Fensterhöhe sichtbar reicht auch bei winzigem Anteil; 1 px darunter nicht', () => {
    expect(zielGenugImBild(0.05, 450, 900)).toBe(true);
    expect(zielGenugImBild(0.05, 449.6, 900)).toBe(true); // halber Pixel Rundungs-Toleranz
    expect(zielGenugImBild(0.05, 449, 900)).toBe(false);
  });
  it('kleines Ziel: 10 % sichtbar = nicht sichtbar (kein Fenster-Pixel-Beitrag)', () => {
    // Ziel 1000 px hoch, 100 px (10 %) im Bild, Fenster 900.
    expect(zielGenugImBild(0.1, 100, 900)).toBe(false);
  });
});

describe('zielSchwellen — die Pixel-Schwelle steht in der Liste, nur wo nötig', () => {
  it('Ziel > 2.5 Fensterhöhen: Pixel-Schwelle unter 20 % kommt dazu', () => {
    expect(zielSchwellen(6000, 900)).toEqual([0, 0.075, 0.2]);
  });
  it('Ziel ≤ 2.5 Fensterhöhen: Liste unverändert [0, 0.2] (Bestandsverhalten)', () => {
    expect(zielSchwellen(2250, 900)).toEqual([0, 0.2]); // genau 2.5 Fensterhöhen
    expect(zielSchwellen(1057, 900)).toEqual([0, 0.2]); // /rechner/verjaehrung @1920
    expect(zielSchwellen(300, 900)).toEqual([0, 0.2]);
  });
  it('Höhe 0 (noch nicht gelayoutet) wirft nicht und fällt auf [0, 0.2]', () => {
    expect(zielSchwellen(0, 900)).toEqual([0, 0.2]);
  });
});

// ── Der Haken im Render ─────────────────────────────────────────────────────
describe('useZielSichtbar — Spalte (Ziel schmaler als 60 % des Fensters)', () => {
  it('HOHES Ziel (6000 px, Fenster 900): halbe Fensterhöhe sichtbar ⇒ sichtbar', async () => {
    const d = await rendern({ breite: 500, hoehe: 6000 }, { breite: 1920, hoehe: 900 });
    // Die Schwellenliste trägt die Pixel-Schwelle 450/6000 = 0.075 — sonst käme nie ein Rückruf.
    expect(beliebig().schwellen).toContain(0.075);
    expect(d.sichtbar()).toBe('false');
    await act(async () => { beliebig().liefere(eintrag(0.06, 360, 900)); });
    expect(d.sichtbar()).toBe('false'); // 40 % der Fensterhöhe: noch unter dem Falz
    await act(async () => { beliebig().liefere(eintrag(0.075, 450, 900)); });
    expect(d.sichtbar()).toBe('true');
    await act(async () => { beliebig().liefere(eintrag(0.15, 900, 900)); });
    expect(d.sichtbar()).toBe('true'); // das ganze Fenster voll Ergebnis
    await act(async () => { beliebig().liefere(eintrag(0, 0, 900)); });
    expect(d.sichtbar()).toBe('false'); // wieder draussen
  });

  it('KLEINES Ziel (1000 px): 10 % sichtbar ⇒ NICHT sichtbar; 20 % ⇒ sichtbar (Bestand)', async () => {
    const d = await rendern({ breite: 500, hoehe: 1000 }, { breite: 1920, hoehe: 900 });
    expect(beliebig().schwellen).toEqual([0, 0.2]);
    await act(async () => { beliebig().liefere(eintrag(0.1, 100, 900)); });
    expect(d.sichtbar()).toBe('false');
    await act(async () => { beliebig().liefere(eintrag(0.2, 200, 900)); });
    expect(d.sichtbar()).toBe('true');
  });

  it('Zielhöhe ändert sich (Fenster-Resize): Beobachter wird mit neuer Schwellenliste neu gebaut', async () => {
    const d = await rendern({ breite: 500, hoehe: 1000 }, { breite: 1920, hoehe: 900 });
    const alt = beliebig();
    expect(alt.schwellen).toEqual([0, 0.2]);
    d.setzeZielHoehe(6000);
    await d.fensterWirdNeuGemessen();
    expect(alt.getrennt).toBe(true);
    expect(beliebig().schwellen).toEqual([0, 0.075, 0.2]);
  });

  it('gleiche Schwellenliste nach Resize: kein Neubau (kein Flackern)', async () => {
    const d = await rendern({ breite: 500, hoehe: 1000 }, { breite: 1920, hoehe: 900 });
    const alt = beliebig();
    await d.fensterWirdNeuGemessen();
    expect(alt.getrennt).toBe(false);
    expect(beliebig()).toBe(alt);
  });
});

describe('useZielSichtbar — Bahn (volle Breite) bleibt unverändert', () => {
  it('nur die oberen 55 % zählen; Anteil/Pixel-Regel gilt dort nicht', async () => {
    const d = await rendern({ breite: 1800, hoehe: 6000 }, { breite: 1920, hoehe: 900 });
    // Ein hohes Bahn-Ziel mit Pixel-Anteil würde im Spalten-Fall sichtbar — hier entscheidet `oben`.
    await act(async () => { beliebig().liefere(eintrag(0.15, 900, 900)); });
    expect(d.sichtbar()).toBe('false');
    await act(async () => { oben().liefere(eintrag(0.01, 10, 900)); });
    expect(d.sichtbar()).toBe('true');
    await act(async () => { oben().liefere({ ...eintrag(0, 0, 900), isIntersecting: false }); });
    expect(d.sichtbar()).toBe('false');
  });
});
