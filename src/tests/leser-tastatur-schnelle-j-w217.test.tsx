/**
 * W2·17-UI-BEFUNDE · Nachzug der Prüfung von #1265 — schnelle j/k-Folgen im EINZELMODUS.
 *
 * Der Einzelmodus reicht der Tastatur den GEZEIGTEN Artikel (`einzel.token`, aus dem Router-Hash).
 * Der Hash ändert sich erst nach dem Render der Navigation; die Tastatur las ihn über eine Ref, die
 * ein Effekt NACH dem Render nachführt. Zwei Tasten vor diesem Render (Tastenwiederholung, ~30 ms)
 * sahen darum beide denselben «jetzt»-Artikel und sprangen beide zum selben Ziel — ein Schritt ging verloren.
 *
 * Sonde: die ECHTE `LeserTastatur` (linkedom + react-dom/client, kein Browser) mit EINGEFRORENEM
 * `aktivToken` — das ist genau der Zustand «Navigation noch nicht gerendert». Gesamtansicht
 * (`onBlaettern` ungesetzt) bleibt, wie sie war: dort führt der Scroll-Spy.
 *
 * ROT ZU BEKOMMEN (§6.7): in `parts/LeserTastatur.tsx` die Zeile `aktivRef.current = liste[ziel]`
 * (Einzelmodus-Zweig) entfernen — (a) und (c) fallen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeserTastatur } from '../pages/gesetz-leser/parts/LeserTastatur';

let root: Root | null = null;
const TOKENS = ['1', '2', '3', '4', '5'];

type Taste = (key: string, extra?: Record<string, unknown>) => void;
interface Leser { taste: Taste; zeichne: (aktivToken: string | null, einzel?: boolean) => Promise<void> }

/** Baut den Leser auf: ein `window` mit echten Listenern, damit der eine Listener der Tastatur erreichbar ist. */
async function aufbauen(opts: { aktivToken: string | null; einzel: boolean; spruenge: string[]; blaettern?: (richtung: -1 | 1) => void }): Promise<Leser> {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const listener: Array<(e: unknown) => void> = [];
  vi.stubGlobal('window', {
    document,
    addEventListener: (art: string, fn: (e: unknown) => void) => { if (art === 'keydown') listener.push(fn); },
    removeEventListener: (_art: string, fn: (e: unknown) => void) => { const i = listener.indexOf(fn); if (i >= 0) listener.splice(i, 1); },
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  const zeichne = (aktivToken: string | null, einzel = opts.einzel) => act(async () => {
    root!.render(createElement(LeserTastatur, {
      tokens: TOKENS, aktivToken, onSprung: (t: string) => { opts.spruenge.push(t); },
      onBlaettern: einzel ? (opts.blaettern ?? (() => {})) : undefined,
    }));
  });
  await zeichne(opts.aktivToken);
  return {
    zeichne,
    taste: (key, extra = {}) => { for (const fn of listener) fn({ key, target: null, metaKey: false, ctrlKey: false, altKey: false, preventDefault() {}, ...extra }); },
  };
}

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('schnelle j/k-Folgen verlieren im Einzelmodus keinen Schritt', () => {
  it('(a) Einzelmodus: j, j, k ohne dazwischen gerenderten Artikel → 2, 3, 2', async () => {
    const spruenge: string[] = [];
    const { taste } = await aufbauen({ aktivToken: '1', einzel: true, spruenge });
    taste('j'); taste('j'); taste('k');
    expect(spruenge).toEqual(['2', '3', '2']);
  });

  it('(b) Gesamtansicht bleibt wie sie war: der Scroll-Spy führt, die Taste rechnet vom Spy-Stand', async () => {
    const spruenge: string[] = [];
    const { taste } = await aufbauen({ aktivToken: '1', einzel: false, spruenge });
    taste('j'); taste('j');
    expect(spruenge).toEqual(['2', '2']);
  });

  it('(c) am Rand bleibt es stehen: j auf dem vorletzten Artikel springt einmal, nicht dreimal', async () => {
    const spruenge: string[] = [];
    const { taste } = await aufbauen({ aktivToken: '4', einzel: true, spruenge });
    taste('j'); taste('j'); taste('j');
    expect(spruenge).toEqual(['5']);
  });

  it('(d) der Frame von Art. 2 kommt ZWISCHEN den Tasten an: j, j, Zeichnen(2), j → 2, 3, 4 (kein Rückfall auf 2)', async () => {
    const spruenge: string[] = [];
    const { taste, zeichne } = await aufbauen({ aktivToken: '1', einzel: true, spruenge });
    taste('j'); taste('j');
    await zeichne('2');
    taste('j');
    expect(spruenge).toEqual(['2', '3', '4']);
    await zeichne('3'); await zeichne('4');
    taste('j');
    expect(spruenge.at(-1), 'nach dem letzten Frame rechnet die Taste vom gezeigten Artikel').toBe('5');
  });

  it('(e) dasselbe rückwärts: k, k, Zeichnen(4), k → 4, 3, 2', async () => {
    const spruenge: string[] = [];
    const { taste, zeichne } = await aufbauen({ aktivToken: '5', einzel: true, spruenge });
    taste('k'); taste('k');
    await zeichne('4');
    taste('k');
    expect(spruenge).toEqual(['4', '3', '2']);
  });

  it('(f) ein Artikel, den die Tasten nicht angesprungen haben (Klick, Zurück), gewinnt sofort', async () => {
    const spruenge: string[] = [];
    const { taste, zeichne } = await aufbauen({ aktivToken: '1', einzel: true, spruenge });
    taste('j');                       // erwartet: 2
    await zeichne('5');               // der Leser ist woanders gelandet
    taste('k');
    expect(spruenge).toEqual(['2', '4']);
  });

  it('(g) bleibt der Sprung aus (kein Frame kommt, Lesart wechselt): nichts hängt an einem Artikel, den niemand zeigt', async () => {
    const spruenge: string[] = [];
    const { taste, zeichne } = await aufbauen({ aktivToken: '1', einzel: true, spruenge });
    taste('j');                       // 2 — `navigiere` hätte `false` geliefert, kein Frame mit '2' folgt
    await zeichne('1', false);        // Gesamtansicht: der Scroll-Spy führt, Stand '1'
    taste('j');
    expect(spruenge).toEqual(['2', '2']);
  });

  it('(h) ein Sprung ohne Frame verfällt nach einer Frist: danach zählt wieder der gezeigte Artikel', async () => {
    vi.useFakeTimers();
    try {
      const spruenge: string[] = [];
      const { taste } = await aufbauen({ aktivToken: '1', einzel: true, spruenge });
      taste('j');                     // 2, der Frame bleibt aus
      vi.advanceTimersByTime(5000);
      taste('j');                     // vom gezeigten '1' aus: wieder 2, nicht 3
      expect(spruenge).toEqual(['2', '2']);
    } finally { vi.useRealTimers(); }
  });
});

describe('O-28 · schnelle ←/→ verlieren im Einzelmodus keinen Schritt (blättern über `onBlaettern`)', () => {
  /** `onBlaettern` rechnet im Betrieb aus dem Render seines Aufrufs (`einzel.blaettere`) — die Sonde
   *  zählt deshalb, WIE OFT und WANN es gerufen wird: ein zweiter Aufruf vor dem Frame wäre der Fehler. */
  const aufrufe = () => { const r: Array<-1 | 1> = []; return { r, blaettern: (d: -1 | 1) => { r.push(d); } }; };

  it('(a) zwei → vor dem Frame: der erste läuft, der zweite wartet und läuft mit dem Frame von Art. 2', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '1', einzel: true, spruenge: [], blaettern });
    taste('ArrowRight'); taste('ArrowRight');
    expect(r, 'zwei Aufrufe aus derselben Closure: der zweite rechnete vom alten Artikel').toEqual([1]);
    await zeichne('2');
    expect(r, 'mit dem Frame läuft der wartende Druck').toEqual([1, 1]);
  });

  it('(b) drei ← in einem Tick: je Frame ein Schritt, in der Reihenfolge der Tasten', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '5', einzel: true, spruenge: [], blaettern });
    taste('ArrowLeft'); taste('ArrowLeft'); taste('ArrowLeft');
    expect(r).toEqual([-1]);
    await zeichne('4');
    expect(r).toEqual([-1, -1]);
    await zeichne('3');
    expect(r).toEqual([-1, -1, -1]);
    await zeichne('2');
    expect(r, 'nichts bleibt übrig').toEqual([-1, -1, -1]);
  });

  it('(c) gemischt → ←: die Richtung jedes Drucks bleibt erhalten', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '3', einzel: true, spruenge: [], blaettern });
    taste('ArrowRight'); taste('ArrowLeft');
    await zeichne('4');
    expect(r).toEqual([1, -1]);
  });

  it('(d) Tastenwiederholung (gehalten) wartet nicht: sie wird bei laufendem Schritt verworfen', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '1', einzel: true, spruenge: [], blaettern });
    taste('ArrowRight');
    taste('ArrowRight', { repeat: true }); taste('ArrowRight', { repeat: true });
    await zeichne('2');
    expect(r, 'gehalten blättert im Takt des Renders, ohne Rückstau').toEqual([1]);
    taste('ArrowRight', { repeat: true });
    expect(r, 'ohne laufenden Schritt zählt auch die Wiederholung').toEqual([1, 1]);
  });

  it('(e) landet der Leser woanders (Klick, Zurück), wird nichts mehr nachgeholt', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '1', einzel: true, spruenge: [], blaettern });
    taste('ArrowRight'); taste('ArrowRight');
    await zeichne('5');
    expect(r).toEqual([1]);
  });

  it('(f) Lesart-Wechsel verwirft den wartenden Druck; die Gesamtansicht hat keinen', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '1', einzel: true, spruenge: [], blaettern });
    taste('ArrowRight'); taste('ArrowRight');
    await zeichne('1', false);
    await zeichne('2', false);
    expect(r).toEqual([1]);
    taste('ArrowRight');
    expect(r, 'Gesamtansicht: ←/→ gehören dem Panel, onBlaettern entfällt').toEqual([1]);
  });

  it('(g) ein Schritt ohne Frame verfällt nach der Frist: der nächste Druck rechnet wieder vom gezeigten Artikel', async () => {
    vi.useFakeTimers();
    try {
      const { r, blaettern } = aufrufe();
      const { taste } = await aufbauen({ aktivToken: '1', einzel: true, spruenge: [], blaettern });
      taste('ArrowRight');           // Navigation blieb aus
      taste('ArrowRight');           // wartet …
      vi.advanceTimersByTime(5000);
      taste('ArrowRight');           // … Frist um: frischer Schritt, der wartende ist verworfen
      expect(r).toEqual([1, 1]);
    } finally { vi.useRealTimers(); }
  });

  it('(h) am Rand merkt sich der Druck nichts: kein Ziel, nichts wartet', async () => {
    const { r, blaettern } = aufrufe();
    const { taste } = await aufbauen({ aktivToken: '5', einzel: true, spruenge: [], blaettern });
    taste('ArrowRight'); taste('ArrowRight');
    expect(r, 'am letzten Artikel gibt es keinen Schritt zu verlieren').toEqual([1, 1]);
  });
  // Nachzug Gegenprüfung #1384 (MITTEL 2): der zweite Druck läuft beim Frame des LETZTEN Artikels mit
  // Ziel = Länge — kein Eintrag, kein Frame; ein dritter Druck blieb in `wartendeRef` liegen und kam
  // beim nächsten Frame (dem des Gegen-Pfeils) als ungefragter Sprung zurück. Rot gegen f89f82745:
  // Aufrufe [1, 1, -1, 1] statt [1, 1, -1] (Ende) bzw. [-1, -1, 1, -1] statt [-1, -1, 1] (Anfang).
  it('(i) Rand am Ende: drei → ab Art. 4, danach ←: kein Phantom-Schritt zurück auf Art. 5', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '4', einzel: true, spruenge: [], blaettern });
    taste('ArrowRight'); taste('ArrowRight'); taste('ArrowRight');
    expect(r).toEqual([1]);
    await zeichne('5');
    expect(r, 'beim Frame von Art. 5 läuft der zweite Druck (Rand), der dritte verfällt').toEqual([1, 1]);
    taste('ArrowLeft');
    await zeichne('4');
    expect(r, 'das ← läuft einmal; kein liegengebliebenes → springt hinterher').toEqual([1, 1, -1]);
  });

  it('(j) Rand am Anfang, spiegelbildlich: drei ← ab Art. 2, danach →: kein Phantom-Schritt', async () => {
    const { r, blaettern } = aufrufe();
    const { taste, zeichne } = await aufbauen({ aktivToken: '2', einzel: true, spruenge: [], blaettern });
    taste('ArrowLeft'); taste('ArrowLeft'); taste('ArrowLeft');
    expect(r).toEqual([-1]);
    await zeichne('1');
    expect(r).toEqual([-1, -1]);
    taste('ArrowRight');
    await zeichne('2');
    expect(r).toEqual([-1, -1, 1]);
  });
});
