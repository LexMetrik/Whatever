/**
 * W2·17-UI-BEFUNDE · Leser-Tastatur: Menü, Tabellen, Auto-Repeat (G4-B01, B11-B01/ED10, G4-B02, G4-B03).
 *
 * Sonde: die ECHTE `LeserTastatur` (linkedom + react-dom/client, kein Browser), wie
 * `leser-tastatur-schnelle-j-w217.test.tsx`. Layout (Scroll-Breite, Overflow) wird über erzeugte
 * Elemente mit gesetzten Messwerten und einen gestubbten `getComputedStyle` nachgestellt.
 *
 * BEFUNDE (Browser, 2.10.2026, `vite` dev, 1440×900 bzw. 600×900):
 *  · G4-B01 — «Ansicht ▾» offen, «t» drücken: der Fokus sprang in die Gliederung, das Menü blieb offen
 *    (`defaultPrevented: true`). Das Menü ist KEIN `aria-modal`-Dialog; Guard 3 sah es nicht.
 *  · B11-B01/ED10 — EMRK «Geltungsbereich» (`[data-mehrspaltig]`, `tabindex=0`, scrollbar 574/522 px) im
 *    Einzelmodus fokussiert, →: `defaultPrevented: true`, `scrollLeft` blieb 0 — die Taste gehörte dem Blättern.
 *  · G4-B02 — «?» gehalten (Auto-Repeat): das Overlay flackerte auf/zu/auf (open → repeat: zu → repeat: auf).
 *    Dasselbe für die Umschalter «r» (Blatt) und «t».
 *  · G4-B03 — die Hilfe nannte ⌘K; HeaderSuche und Leser-Suchfeld nehmen auch Strg+K.
 *
 * ROT ZU BEKOMMEN (§6.7): in `parts/LeserTastatur.tsx` den Menü-Guard, den Scroller-Guard bzw. den
 * `e.repeat`-Guard entfernen — (a), (b) bzw. (c) fallen.
 */
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeserTastatur } from '../pages/gesetz-leser/parts/LeserTastatur';

let root: Root | null = null;
const TOKENS = ['1', '2', '3', '4', '5'];

interface TastenOpt { target?: unknown; repeat?: boolean; meta?: boolean; ctrl?: boolean; alt?: boolean }
interface Spur { spruenge: string[]; panel: number; blaettern: number[] }

/** Misst, ob eine Taste verbraucht wurde: `preventDefault` gerufen? */
async function aufbauen(html: string, opts: { panel?: boolean; blaettern?: boolean } = {}) {
  const { document } = parseHTML(`<!doctype html><html><body>${html}<div id="app"></div></body></html>`);
  const listener: Array<(e: unknown) => void> = [];
  vi.stubGlobal('window', {
    document,
    addEventListener: (art: string, fn: (e: unknown) => void) => { if (art === 'keydown') listener.push(fn); },
    removeEventListener: (_art: string, fn: (e: unknown) => void) => { const i = listener.indexOf(fn); if (i >= 0) listener.splice(i, 1); },
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // Overflow-Stil je Element über ein Attribut — linkedom rechnet kein CSS.
  vi.stubGlobal('getComputedStyle', (el: Element) => ({ overflowX: el.getAttribute('data-ox') ?? 'visible' }));
  const spur: Spur = { spruenge: [], panel: 0, blaettern: [] };
  root = createRoot(document.getElementById('app') as unknown as HTMLElement);
  await act(async () => {
    root!.render(createElement(LeserTastatur, {
      tokens: TOKENS, aktivToken: '2', onSprung: (t: string) => { spur.spruenge.push(t); },
      onPanel: opts.panel ? () => { spur.panel += 1; } : undefined,
      onBlaettern: opts.blaettern ? (r: -1 | 1) => { spur.blaettern.push(r); } : undefined,
    }));
  });
  const taste = (key: string, o: TastenOpt = {}): boolean => {
    let verbraucht = false;
    for (const fn of listener) fn({
      key, target: o.target ?? null, repeat: o.repeat ?? false,
      metaKey: o.meta ?? false, ctrlKey: o.ctrl ?? false, altKey: o.alt ?? false, defaultPrevented: false,
      preventDefault() { verbraucht = true; },
    });
    return verbraucht;
  };
  return { document, spur, taste };
}

/** Setzt Mess-Eigenschaften, die linkedom nicht kennt (Layout). */
function messe(el: Element, scrollWidth: number, clientWidth: number): Element {
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
  return el;
}

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('(a) G4-B01 — bei offenem «Ansicht»-Menü gehören die Tasten dem Menü', () => {
  const MENUE = '<div data-menue-flaeche data-v3-ansicht-panel tabindex="-1"><div role="menu" aria-label="Ansicht"><button role="menuitem">x</button></div></div>';

  it.each(['j', 'k', 't', 'r', '?', 'ArrowLeft', 'ArrowRight'])('«%s» wird bei offenem Menü weder bedient noch verbraucht', async (key) => {
    const { spur, taste, document } = await aufbauen(MENUE, { panel: true, blaettern: true });
    const menueEl = document.querySelector('[role="menuitem"]') as unknown as Element;
    expect(taste(key, { target: menueEl }), `«${key}» darf nicht verbraucht werden`).toBe(false);
    expect(spur).toEqual({ spruenge: [], panel: 0, blaettern: [] });
  });

  it('Menü offen, aber der Fokus liegt AUSSERHALB der Fläche (Auslöser): die Tasten bedienen den Leser (w229 (g), CI-Rot #1277)', async () => {
    const { spur, taste, document } = await aufbauen(MENUE + '<button id="ausloeser">Ansicht</button>', { panel: true });
    expect(taste('r', { target: document.getElementById('ausloeser') })).toBe(true);
    expect(taste('j', { target: document.getElementById('ausloeser') })).toBe(true);
    expect(spur).toEqual({ spruenge: ['3'], panel: 1, blaettern: [] });
  });

  it('Gegenprobe: ohne offenes Menü bedienen dieselben Tasten den Leser', async () => {
    const { spur, taste } = await aufbauen('', { panel: true, blaettern: true });
    expect(taste('j')).toBe(true);
    expect(taste('r')).toBe(true);
    expect(taste('ArrowRight')).toBe(true);
    expect(spur).toEqual({ spruenge: ['3'], panel: 1, blaettern: [1] });
  });

  it.each([
    ['Reiter-Kontextmenü', '<div role="menu" data-menue-flaeche aria-label="Reiter" tabindex="-1"><button role="menuitem">x</button></div>'],
    ['Verlauf (role=dialog ohne aria-modal)', '<div role="dialog" data-menue-flaeche aria-label="Verlauf – zuletzt geöffnet" tabindex="-1"><button>x</button></div>'],
    ['Sprachwahl', '<div role="group" data-menue-flaeche aria-label="Sprache wählen"><button aria-pressed="true">de</button></div>'],
  ])('auch %s sperrt die Kürzel (gemeinsame Markierung)', async (_n, html) => {
    const { document, spur, taste } = await aufbauen(html, { panel: true, blaettern: true });
    const drin = (document.querySelector('[data-menue-flaeche] button') ?? document.querySelector('[data-menue-flaeche]')) as unknown as Element;
    for (const k of ['j', 'k', 't', 'r', 'ArrowRight']) expect(taste(k, { target: drin }), k).toBe(false);
    expect(spur).toEqual({ spruenge: [], panel: 0, blaettern: [] });
  });

  it('die vier Schwebeflächen tragen die Markierung wirklich (Quellsonde, sonst bliebe der Guard blind)', () => {
    for (const f of [
      'components/layout/ReiterMenue.tsx', 'components/layout/VerlaufUebersicht.tsx',
      'components/SprachUmschalter.tsx', 'pages/gesetz-leser/v3/LeserAnsichtV3.tsx',
    ]) {
      expect(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), f).toMatch(/\bdata-menue-flaeche\b/);
    }
  });
});

describe('(b) B11-B01/ED10 — ←/→ in einer seitlich scrollbaren Tabelle gehören der Tabelle', () => {
  const TABELLE = '<span id="t" data-ox="auto" tabindex="0" role="group"><span id="z">Zelle</span></span><p id="p">Text</p>';

  it('überläuft die Tabelle (574 > 522, overflow-x auto): ←/→ blättern NICHT und werden nicht verbraucht', async () => {
    const { document, spur, taste } = await aufbauen(TABELLE, { blaettern: true });
    messe(document.getElementById('t') as unknown as Element, 574, 522);
    const zelle = document.getElementById('z') as unknown as Element;
    expect(taste('ArrowRight', { target: zelle })).toBe(false);
    expect(taste('ArrowLeft', { target: document.getElementById('t') })).toBe(false);
    expect(spur.blaettern).toEqual([]);
  });

  it('überläuft sie nicht (Breitbild): die Tasten blättern wie bisher', async () => {
    const { document, spur, taste } = await aufbauen(TABELLE, { blaettern: true });
    messe(document.getElementById('t') as unknown as Element, 522, 522);
    expect(taste('ArrowRight', { target: document.getElementById('z') })).toBe(true);
    expect(spur.blaettern).toEqual([1]);
  });

  it('läuft über, ist aber abgeschnitten (overflow-x hidden, kein Scroller): ←/→ blättern weiter', async () => {
    const { document, spur, taste } = await aufbauen(TABELLE, { blaettern: true });
    const t = document.getElementById('t') as unknown as Element;
    t.setAttribute('data-ox', 'hidden');
    messe(t, 574, 522);
    expect(taste('ArrowLeft', { target: document.getElementById('z') })).toBe(true);
    expect(spur.blaettern).toEqual([-1]);
  });

  it('Fokus ausserhalb der Tabelle: ←/→ blättern, auch wenn eine Tabelle auf der Seite überläuft', async () => {
    const { document, spur, taste } = await aufbauen(TABELLE, { blaettern: true });
    messe(document.getElementById('t') as unknown as Element, 574, 522);
    expect(taste('ArrowRight', { target: document.getElementById('p') })).toBe(true);
    expect(spur.blaettern).toEqual([1]);
  });

  it('j/k bleiben auch aus der Tabelle heraus bedienbar (sie scrollen nichts)', async () => {
    const { document, spur, taste } = await aufbauen(TABELLE, { blaettern: true });
    messe(document.getElementById('t') as unknown as Element, 574, 522);
    expect(taste('j', { target: document.getElementById('z') })).toBe(true);
    expect(spur.spruenge).toEqual(['3']);
  });
});

describe('(c) G4-B02 — gehaltene Tasten lösen Umschalter nicht mehrfach aus', () => {
  it('«r» mit Auto-Repeat schaltet das Blatt nicht noch einmal um; der erste Druck gilt', async () => {
    const { spur, taste } = await aufbauen('', { panel: true });
    expect(taste('r')).toBe(true);
    taste('r', { repeat: true });
    taste('r', { repeat: true });
    expect(spur.panel).toBe(1);
  });

  it('«t» mit Auto-Repeat verschiebt den Fokus nicht noch einmal', async () => {
    const { document, taste } = await aufbauen('<div data-toc><button id="b1">eins</button></div>');
    const b1 = document.getElementById('b1') as unknown as HTMLElement;
    const fokus = vi.fn();
    b1.focus = fokus;
    taste('t');
    taste('t', { repeat: true });
    expect(fokus).toHaveBeenCalledTimes(1);
  });

  it('j/k mit Auto-Repeat bleiben wirksam (gehalten durchblättern ist gewollt, #1265)', async () => {
    const { spur, taste } = await aufbauen('', { blaettern: true });
    taste('j'); taste('j', { repeat: true }); taste('j', { repeat: true });
    expect(spur.spruenge).toEqual(['3', '4', '5']);
  });

  it('«?» gehalten: das Overlay geht auf und BLEIBT offen', async () => {
    const { document, taste } = await aufbauen('');
    await act(async () => { taste('?'); });
    expect(document.querySelector('[aria-label="Tastatur-Kurzbefehle"]')).not.toBeNull();
    await act(async () => { taste('?', { repeat: true }); });
    expect(document.querySelector('[aria-label="Tastatur-Kurzbefehle"]'), 'Auto-Repeat schliesst das Overlay nicht').not.toBeNull();
    await act(async () => { taste('?', { repeat: true }); });
    expect(document.querySelector('[aria-label="Tastatur-Kurzbefehle"]'), 'und öffnet es nicht im Wechsel').not.toBeNull();
    // Der bewusste zweite Druck (neues Ereignis, kein Repeat) schliesst weiter.
    await act(async () => { taste('?'); });
    expect(document.querySelector('[aria-label="Tastatur-Kurzbefehle"]')).toBeNull();
  });
});

describe('(d) G4-B03 — die Hilfe nennt jede Suchtaste, die wirkt', () => {
  it('«Ausserdem überall» nennt ⌘K UND Strg+K', async () => {
    const { document, taste } = await aufbauen('');
    await act(async () => { taste('?'); });
    const text = (document.querySelector('[aria-label="Tastatur-Kurzbefehle"]') as unknown as Element).textContent ?? '';
    expect(text).toContain('⌘K');
    expect(text).toMatch(/Strg\s?\+?\s?K/);
  });
});

describe('(e) F6-B01 — Alt/⌘/Strg + Pfeil gehören dem Browser (Verlauf), nie dem Leser', () => {
  it.each([
    ['Alt', { alt: true }], ['⌘', { meta: true }], ['Strg', { ctrl: true }],
  ] as const)('%s+←/→ blättert nicht und wird nicht verbraucht', async (_n, mod) => {
    const { spur, taste } = await aufbauen('', { blaettern: true });
    expect(taste('ArrowLeft', mod)).toBe(false);
    expect(taste('ArrowRight', mod)).toBe(false);
    expect(spur.blaettern).toEqual([]);
  });
});
