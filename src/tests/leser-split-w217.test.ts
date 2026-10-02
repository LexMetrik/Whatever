// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE · Zwei-Fenster-Ansicht (Split-Pane) des Gesetzeslesers.
 *
 * Reine Einheiten-Beweise zu vier Befunden; die Browser-Seite (Esc, Fokus,
 * Tastatur im echten Split) steht in `e2e/leser-split-w217.e2e.ts`.
 *
 *  · F1-B01 — `tastendruckGehoertPane`: Fokus in der Overlay-Schicht eines Panes
 *    (`data-v3-pane`, ausserhalb von `[data-pane]`) und Rückfall auf das ZULETZT
 *    BENUTZTE Pane statt blind auf das primäre.
 *  · F9-B02 — `naechsteInstanz` verliert `?ansicht=` (und jeden anderen Parameter).
 *  · G1-B02 — `--nt-stick` im Pane: aus dem Kopf-BLOCK, nicht aus einer Summe.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseHTML } from 'linkedom';

type GlobalPatch = Record<string, unknown>;

// ── F1-B01 ───────────────────────────────────────────────────────────────────
const SEITE = `<!doctype html><html><body>
  <div id="zeile">
    <main data-pane="primaer"><p id="text-p">primär</p><button id="knopf-p">p</button></main>
    <div data-v3-pane="primaer" id="ov-p"><button id="blatt-p">blatt p</button></div>
    <section data-pane="sekundaer"><p id="text-s">sekundär</p><button id="knopf-s">s</button></section>
    <div data-v3-pane="sekundaer" id="ov-s"><button id="blatt-s">blatt s</button></div>
  </div>
  <header id="topbar"><button id="topbar-knopf">oben</button></header>
</body></html>`;

/** Frische Modul-Instanz samt frischem Dokument — der Merker ist Modulzustand. */
async function pane() {
  vi.resetModules();
  const { window, document } = parseHTML(SEITE);
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  let aktiv: Element | null = document.body;
  Object.defineProperty(document, 'activeElement', { get: () => aktiv, configurable: true });
  const { tastendruckGehoertPane } = await import('../pages/gesetz-leser/panePrioritaet');
  const id = (i: string) => document.getElementById(i)!;
  return {
    id,
    fokus: (el: Element | null) => {
      aktiv = el ?? document.body;
      el?.dispatchEvent(new window.Event('focusin', { bubbles: true }));
    },
    /** Fokus verschwindet (Knopf entfernt, Esc), ohne dass ein Pane angeklickt wird. */
    fokusWeg: () => { aktiv = document.body; },
    klick: (el: Element) => { el.dispatchEvent(new window.Event('pointerdown', { bubbles: true })); },
    primaerHat: () => tastendruckGehoertPane(false),
    sekundaerHat: () => tastendruckGehoertPane(true),
  };
}

describe('F1-B01 · tastendruckGehoertPane — Overlay-Schicht und zuletzt benutztes Pane', () => {
  it('Fokus in der Overlay-Schicht des SEKUNDÄREN Panes (ausserhalb von [data-pane]) → sekundär', async () => {
    const p = await pane();
    p.fokus(p.id('blatt-s'));
    expect(p.sekundaerHat(), 'das Blatt des sekundären Panes trägt den Fokus').toBe(true);
    expect(p.primaerHat(), 'das primäre Pane darf den Tastendruck nicht zusätzlich beanspruchen').toBe(false);
  });

  it('Fokus in der Overlay-Schicht des PRIMÄREN Panes → primär', async () => {
    const p = await pane();
    p.fokus(p.id('blatt-p'));
    expect(p.primaerHat()).toBe(true);
    expect(p.sekundaerHat()).toBe(false);
  });

  it('Fokus fällt auf den Body: das zuletzt benutzte (angeklickte) Pane behält den Tastendruck', async () => {
    const p = await pane();
    p.klick(p.id('text-s'));
    p.fokus(p.id('knopf-s'));
    p.fokusWeg(); // der Knopf verschwindet / Esc schliesst das Blatt
    expect(p.sekundaerHat(), 'sekundär war zuletzt dran').toBe(true);
    expect(p.primaerHat()).toBe(false);
    p.klick(p.id('text-p'));
    expect(p.primaerHat(), 'ein Klick ins primäre Pane gibt ihm den Rückfall').toBe(true);
    expect(p.sekundaerHat()).toBe(false);
  });

  it('Fokus ausserhalb jedes Panes (Topbar): Rückfall = zuletzt benutztes Pane', async () => {
    const p = await pane();
    p.fokus(p.id('knopf-s'));
    p.fokus(p.id('topbar-knopf'));
    expect(p.sekundaerHat()).toBe(true);
    expect(p.primaerHat()).toBe(false);
  });

  it('Fokus in einem Pane schlägt den Rückfall (Fokus ist der stärkere Beleg)', async () => {
    const p = await pane();
    p.klick(p.id('text-s')); // zuletzt benutzt: sekundär …
    p.fokus(p.id('knopf-p')); // … aber der Fokus steht im primären (Tab / F6)
    expect(p.primaerHat()).toBe(true);
    expect(p.sekundaerHat()).toBe(false);
  });

  it('noch nichts benutzt: primär (wie bisher)', async () => {
    const p = await pane();
    expect(p.primaerHat()).toBe(true);
    expect(p.sekundaerHat()).toBe(false);
  });

  it('das sekundäre Pane ist geschlossen: der Rückfall fällt auf primär, nicht ins Leere', async () => {
    const p = await pane();
    p.klick(p.id('text-s'));
    p.fokusWeg();
    expect(p.sekundaerHat()).toBe(true);
    // ✕ am sekundären Fenster: Fläche und Overlay verschwinden aus dem DOM.
    p.id('text-s').closest('section')!.remove();
    p.id('ov-s').remove();
    expect(p.primaerHat(), 'ohne sekundäres Pane gehört der Tastendruck dem primären').toBe(true);
    expect(p.sekundaerHat()).toBe(false);
  });
});

// ── F9-B02 ───────────────────────────────────────────────────────────────────
describe('F9-B02 · naechsteInstanz erhält die übrigen Abfrage-Parameter', () => {
  beforeEach(() => {
    const speicher = new Map<string, string>();
    (globalThis as GlobalPatch).localStorage = {
      getItem: (k: string) => speicher.get(k) ?? null,
      setItem: (k: string, v: string) => void speicher.set(k, v),
      removeItem: (k: string) => void speicher.delete(k),
      clear: () => speicher.clear(),
      key: () => null,
      length: 0,
    } as unknown as Storage;
  });

  it('?ansicht=artikel bleibt, ?r kommt dazu, der Anker bleibt (Datum ≠ Artikel 1: 336c)', async () => {
    const { naechsteInstanz, merkeTab } = await import('../lib/tabs');
    merkeTab('/gesetze/bund/OR?ansicht=artikel#art-336_c');
    expect(naechsteInstanz('/gesetze/bund/OR?ansicht=artikel#art-336_c'))
      .toBe('/gesetze/bund/OR?ansicht=artikel&r=2#art-336_c');
  });

  it('eine bestehende ?r wird ersetzt, nicht verdoppelt; die Reihenfolge der übrigen bleibt', async () => {
    const { naechsteInstanz, merkeTab } = await import('../lib/tabs');
    merkeTab('/gesetze/bund/OR');
    merkeTab('/gesetze/bund/OR?ansicht=artikel&r=2');
    expect(naechsteInstanz('/gesetze/bund/OR?ansicht=artikel&r=2#art-9'))
      .toBe('/gesetze/bund/OR?ansicht=artikel&r=3#art-9');
    expect(naechsteInstanz('/gesetze/bund/OR?x=1&r=2&ansicht=erlass'))
      .toBe('/gesetze/bund/OR?x=1&ansicht=erlass&r=3');
  });

  it('der Layout-Seed ?p= des geteilten Pane-Links wandert NICHT in die neue Instanz', async () => {
    const { naechsteInstanz, merkeTab } = await import('../lib/tabs');
    merkeTab('/gesetze/bund/ZGB');
    expect(naechsteInstanz('/gesetze/bund/ZGB?p=%2Fgesetze%2Fbund%2FOR&ansicht=artikel#art-5'))
      .toBe('/gesetze/bund/ZGB?ansicht=artikel&r=2#art-5');
    expect(naechsteInstanz('/gesetze/bund/ZGB?p=%2Fx')).toBe('/gesetze/bund/ZGB?r=2');
  });

  it('ohne Abfrage unverändert (bestehende Zusage, tabs.test.ts)', async () => {
    const { naechsteInstanz, merkeTab } = await import('../lib/tabs');
    merkeTab('/gesetze/bund/OR');
    expect(naechsteInstanz('/gesetze/bund/OR#art-41')).toBe('/gesetze/bund/OR?r=2#art-41');
  });

  it('die Reiter-Identität bleibt Pfad + ?r — ?ansicht gehört nicht dazu', async () => {
    const { tabSchluessel } = await import('../lib/tabs');
    expect(tabSchluessel('/gesetze/bund/OR?ansicht=artikel&r=2#art-9')).toBe('/gesetze/bund/OR?r=2');
  });
});

// ── G1-B02 ───────────────────────────────────────────────────────────────────
describe('G1-B02 · --nt-stick im Pane folgt dem Kopf-Block', () => {
  it('im Pane = die Höhe des Kopf-Blocks (auch wenn die Such-Zone in der Zeile steht)', async () => {
    const { leserCssVariablen } = await import('../pages/gesetz-leser/v3/leserGeometrie');
    const lage = {
      stufe: 'voll', suchZoneKlebt: true, zoneHoch: false, spurVersatzRem: 19.25, spurVersatzRechtsRem: 0,
    };
    for (const suchInZeile of [true, false]) {
      const v = leserCssVariablen({ ...lage, vollflaechig: false, suchInZeile } as never) as Record<string, string>;
      expect(v['--nt-stick'], `Pane, suchInZeile=${suchInZeile}`).toBe('var(--leser-v3-kopf-block-h)');
    }
  });

  it('Einzelansicht unverändert: Topbar + Kopf-Block', async () => {
    const { leserCssVariablen } = await import('../pages/gesetz-leser/v3/leserGeometrie');
    const v = leserCssVariablen({
      stufe: 'voll', vollflaechig: true, suchZoneKlebt: true, zoneHoch: false, suchInZeile: true,
      spurVersatzRem: 19.25, spurVersatzRechtsRem: 0,
    } as never) as Record<string, string>;
    expect(v['--nt-stick']).toBe('calc(var(--app-kopf-h, 4rem) + var(--leser-v3-kopf-block-h))');
  });
});
