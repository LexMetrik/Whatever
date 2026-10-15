/**
 * Merkliste im DOM (LESER-NAV R-2, Nachzug nach Gegenprüfung): was `renderToString` nicht sieht —
 * Klicks, Fokus, Listener-Zahl. React-Dev-Build in ein linkedom-DOM (Stil `bezug-zeit-datumsfeld-weiche`).
 *
 *  (a) §15 Geräte-Last: die Zahl der window-Listener hängt NICHT an der Zahl der gemounteten Knöpfe
 *      (im OR stehen ~1700), und ein Ereignis löst einen Lesezugriff aus, nicht einen je Knopf.
 *  (b) WCAG 2.5.3: fester Name «Merken: <Titel>» mit dem sichtbaren Wort «Merken», Zustand per aria-pressed.
 *  (c) §8: «voll» (50) wird als voll angesagt, nicht als «Browser lässt keinen Speicher zu».
 *  (d) WCAG 2.4.3: nach dem Entfernen des letzten Eintrags / dem Leeren steht der Fokus auf der Statusmeldung.
 *  (e) §8: Übernehmen sagt neu · schon gemerkt · wegen Obergrenze nicht übernommen.
 *
 * ROT ZU BEKOMMEN (§6.7): (a) `abonniereMerkliste` wieder je Aufruf zwei window-Listener anlegen lassen;
 * (b) `aria-label` im Knopf wieder vom Zustand abhängig machen; (c) `merke` bei voller Liste `'gesperrt'`
 * zurückgeben lassen; (d) `fokusStatus.current = true` in `entferne` streichen; (e) `wegenObergrenze` in
 * `uebernimmMerkliste` auf 0 zwingen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MerkenKnopf } from '../components/merkliste/MerkenKnopf';
import { MerklisteFlaeche } from '../components/merkliste/MerklisteFlaeche';
import { MERKLISTE_MAX, entferneMerkung, holeMerkliste, kodiereMerkliste, leereMerkliste, merke } from '../lib/merkliste';

const welt = await vi.hoisted(async () => {
  const { parseHTML } = await import('linkedom');
  const r = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  (r.document as unknown as Record<string, unknown>).oninput = null;
  // Ein echtes EventTarget als window: Listener-Buch führen wir selbst (add/remove zählen).
  const w = new EventTarget() as EventTarget & Record<string, unknown>;
  const aktiv = new Map<string, number>();
  const add = w.addEventListener.bind(w);
  const rem = w.removeEventListener.bind(w);
  w.addEventListener = ((t: string, cb: EventListener) => { aktiv.set(t, (aktiv.get(t) ?? 0) + 1); add(t, cb); }) as typeof w.addEventListener;
  w.removeEventListener = ((t: string, cb: EventListener) => { aktiv.set(t, (aktiv.get(t) ?? 0) - 1); rem(t, cb); }) as typeof w.removeEventListener;
  Object.assign(w, { document: r.document, location: { origin: 'https://lexmetrik.test' }, aktiv });
  // linkedom kennt focus() nicht: wir merken uns, wer ihn bekäme.
  const fokus = { ziel: null as unknown };
  (r.window.HTMLElement.prototype as unknown as { focus: () => void }).focus = function (this: unknown) { fokus.ziel = this; };
  Object.assign(globalThis, { window: w, document: r.document, IS_REACT_ACT_ENVIRONMENT: true });
  return { dom: r, w, aktiv, fokus };
});
const { dom, aktiv, fokus } = welt;

let root: Root | null = null;
let getItemZahl = 0;
let speicher: Map<string, string>;

function stubSpeicher() {
  speicher = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => { getItemZahl++; return speicher.get(k) ?? null; },
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
  });
}

beforeEach(() => {
  stubSpeicher();
  getItemZahl = 0;
  fokus.ziel = null;
  dom.document.getElementById('lm-kopier-ansage')?.remove();
  dom.document.getElementById('app')!.innerHTML = '';
});

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

const ev = (name: string) => new (dom.document.defaultView as unknown as { Event: typeof Event }).Event(name, { bubbles: true });
const app = () => dom.document.getElementById('app') as unknown as HTMLElement;
const knoepfe = () => Array.from(dom.document.querySelectorAll('button[aria-pressed]')) as unknown as HTMLButtonElement[];
const ansage = () => (dom.document.getElementById('lm-kopier-ansage')?.textContent ?? '').replace(/\u00a0/g, '');
async function klick(el: unknown) { await act(async () => { (el as HTMLElement).dispatchEvent(ev('click')); }); }

async function mountKnoepfe(n: number) {
  root = createRoot(app());
  await act(async () => {
    root!.render(createElement('div', null, Array.from({ length: n }, (_, i) =>
      createElement(MerkenKnopf, { key: i, pfad: `/gesetze/bund/E${i + 1}`, anker: 'art-1', titel: `Art. 1 E${i + 1}`, klasse: '' }))));
  });
}
async function unmount() { const r = root!; root = null; await act(async () => r.unmount()); }

describe('(a) §15 · EIN geteiltes Abo, unabhängig von der Zahl der Knöpfe', () => {
  it('window-Listener: 1 + 1 bei 3 wie bei 60 gemounteten Knöpfen; nach dem Unmount keiner', async () => {
    const stand: Record<number, [number, number]> = {};
    for (const n of [3, 60]) {
      await mountKnoepfe(n);
      expect(knoepfe()).toHaveLength(n);
      stand[n] = [aktiv.get('lm:merkliste') ?? 0, aktiv.get('storage') ?? 0];
      await unmount();
      expect([aktiv.get('lm:merkliste') ?? 0, aktiv.get('storage') ?? 0], `nach Unmount von ${n}`).toEqual([0, 0]);
    }
    expect(stand[3]).toEqual([1, 1]);
    expect(stand[60]).toEqual(stand[3]);
  });

  it('ein Ereignis = ein Lesezugriff, nicht einer je Knopf; alle Knöpfe folgen dem Stand', async () => {
    for (const n of [3, 60]) {
      await mountKnoepfe(n);
      getItemZahl = 0;
      await act(async () => { merke({ route: '/gesetze/bund/E2#art-1', titel: 'Art. 1 E2' }); });
      const lesen = getItemZahl;
      expect(lesen, `${n} Knöpfe`).toBeLessThanOrEqual(3);
      expect(knoepfe()[1].getAttribute('aria-pressed')).toBe('true');
      expect(knoepfe().filter((k) => k.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
      await act(async () => { entferneMerkung('/gesetze/bund/E2#art-1'); });
      expect(knoepfe()[1].getAttribute('aria-pressed')).toBe('false');
      await unmount();
    }
  });

  it('anderer Tab: nur der eigene Schlüssel (und clear) löst aus; Fremd-Schlüssel lassen den Stand in Ruhe', async () => {
    await mountKnoepfe(2);
    speicher.set('lexmetrik-merkliste', JSON.stringify([{ route: '/gesetze/bund/E1#art-1', titel: 'Art. 1 E1', typ: 'gesetz', zeit: 0 }]));
    getItemZahl = 0;
    await act(async () => { (window as unknown as EventTarget).dispatchEvent(Object.assign(new Event('storage'), { key: 'fremd' })); });
    expect(getItemZahl).toBe(0);
    expect(knoepfe()[0].getAttribute('aria-pressed')).toBe('false');
    await act(async () => { (window as unknown as EventTarget).dispatchEvent(Object.assign(new Event('storage'), { key: 'lexmetrik-merkliste' })); });
    expect(knoepfe()[0].getAttribute('aria-pressed')).toBe('true');
    speicher.clear();
    await act(async () => { (window as unknown as EventTarget).dispatchEvent(Object.assign(new Event('storage'), { key: null })); });
    expect(knoepfe()[0].getAttribute('aria-pressed')).toBe('false');
  });
});

describe('(b)+(c) Merken-Knopf: fester Name, ehrliche Ansage', () => {
  it('Name «Merken: <Titel>» bleibt in beiden Zuständen; sichtbarer Text enthält «Merken»; Zustand per aria-pressed', async () => {
    await mountKnoepfe(1);
    const k = knoepfe()[0];
    expect(k.getAttribute('aria-label')).toBe('Merken: Art. 1 E1');
    expect(k.getAttribute('aria-pressed')).toBe('false');
    expect(k.textContent).toBe('Merken');
    await klick(k);
    expect(k.getAttribute('aria-pressed')).toBe('true');
    expect(k.getAttribute('aria-label')).toBe('Merken: Art. 1 E1'); // fest
    expect(k.textContent).toContain('Merken'); // WCAG 2.5.3: sichtbares Wort steckt im Namen
    expect(k.getAttribute('aria-label')).toContain((k.textContent ?? '').replace('✓', '').trim());
    expect(ansage()).toBe('Art. 1 E1 gemerkt');
    await klick(k);
    expect(k.getAttribute('aria-pressed')).toBe('false');
    expect(ansage()).toBe('Art. 1 E1 aus der Merkliste entfernt');
  });

  it('volle Liste: Ansage «Merkliste voll (50)», NICHT «Browser lässt keinen Speicher zu»; Knopf bleibt ungedrückt', async () => {
    for (let i = 1; i <= MERKLISTE_MAX; i++) merke({ route: `/gesetze/bund/X${i}`, titel: `X${i}` });
    await mountKnoepfe(1);
    await klick(knoepfe()[0]);
    expect(ansage()).toBe(`Merkliste voll (${MERKLISTE_MAX}) — zuerst Einträge entfernen`);
    expect(ansage()).not.toContain('Browser');
    expect(knoepfe()[0].getAttribute('aria-pressed')).toBe('false');
    expect(holeMerkliste()).toHaveLength(MERKLISTE_MAX);
  });

  it('gesperrter Speicher: Ansage nennt den Browser (und nur dann)', async () => {
    await mountKnoepfe(1);
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new DOMException('x', 'SecurityError'); }, removeItem: () => {} });
    await klick(knoepfe()[0]);
    expect(ansage()).toBe('Merkliste nicht gespeichert: der Browser lässt keinen Speicher zu');
    expect(knoepfe()[0].getAttribute('aria-pressed')).toBe('false');
  });
});

async function mountFlaeche(url = '/') {
  root = createRoot(app());
  await act(async () => {
    root!.render(createElement(MemoryRouter, { initialEntries: [url] }, createElement(MerklisteFlaeche)));
  });
}
const status = () => dom.document.querySelector('[role="status"]') as unknown as HTMLElement | null;
const knopfMitText = (t: string) => (Array.from(dom.document.querySelectorAll('button')) as unknown as HTMLElement[]).find((b) => b.textContent?.trim() === t);
const entferneKnopf = (titel: string) => dom.document.querySelector(`button[aria-label="${titel} aus der Merkliste entfernen"]`);

describe('(d) Fokus nach dem Entfernen (WCAG 2.4.3)', () => {
  it('Zeile entfernen: Fokus auf die Nachbarzeile; die LETZTE entfernen: Fokus auf die Statusmeldung (tabIndex -1), nicht <body>', async () => {
    merke({ route: '/gesetze/bund/B', titel: 'B' });
    merke({ route: '/gesetze/bund/A', titel: 'A' });
    await mountFlaeche();
    await klick(entferneKnopf('A'));
    expect((fokus.ziel as HTMLElement).tagName).toBe('A'); // Nachbar-Link «B»
    expect((fokus.ziel as HTMLElement).getAttribute('href')).toBe('/gesetze/bund/B');
    fokus.ziel = null;
    await klick(entferneKnopf('B'));
    expect(status()).not.toBeNull();
    expect(fokus.ziel).toBe(status());
    expect(status()!.getAttribute('tabindex')).toBe('-1');
    expect(status()!.textContent).toBe('Merkliste ist jetzt leer.');
    expect(holeMerkliste()).toEqual([]);
  });

  it('Leeren (zweistufig): Fokus auf die Statusmeldung; füllt sich die Liste wieder, verschwindet die Meldung', async () => {
    merke({ route: '/gesetze/bund/B', titel: 'B' });
    merke({ route: '/gesetze/bund/A', titel: 'A' });
    await mountFlaeche();
    await klick(knopfMitText('Leeren'));
    await klick(knopfMitText('Wirklich leeren'));
    expect(fokus.ziel).toBe(status());
    expect(status()!.textContent).toBe('Merkliste ist jetzt leer.');
    await act(async () => { merke({ route: '/gesetze/bund/C', titel: 'C' }); });
    expect(status()!.textContent).toBe('');
    expect(entferneKnopf('C')).not.toBeNull();
  });

  it('ohne Einträge und ohne vorherige Aktion: keine Fläche (keine Überschrift über Leerraum)', async () => {
    await mountFlaeche();
    expect(app().innerHTML).toBe('');
  });
});

describe('(e) Übernehmen: alle Zahlen > 0 werden gesagt', () => {
  const link = (n: number, schonTitel: number[] = []) => kodiereMerkliste([
    ...schonTitel.map((i) => ({ route: `/gesetze/bund/E${i}`, titel: `E${i}` })),
    ...Array.from({ length: n }, (_, i) => ({ route: `/gesetze/bund/N${i + 1}`, titel: `N${i + 1}` })),
  ]);

  it('Liste voll: «10 Stellen nicht übernommen (Merkliste voll, höchstens 50)» — nicht «Alle Stellen waren schon gemerkt»', async () => {
    for (let i = 1; i <= MERKLISTE_MAX; i++) merke({ route: `/gesetze/bund/E${i}`, titel: `E${i}` });
    await mountFlaeche(`/?merkliste=${link(10)}`);
    await klick(knopfMitText('Übernehmen'));
    expect(status()!.textContent).toBe(`10 Stellen nicht übernommen (Merkliste voll, höchstens ${MERKLISTE_MAX}).`);
    expect(status()!.textContent).not.toContain('schon gemerkt');
    expect(holeMerkliste()).toHaveLength(MERKLISTE_MAX);
  });

  it('45 + 10 (3 davon schon da): neu, schon gemerkt und Obergrenze stehen alle in der Meldung', async () => {
    for (let i = 1; i <= 45; i++) merke({ route: `/gesetze/bund/E${i}`, titel: `E${i}` });
    await mountFlaeche(`/?merkliste=${link(10, [1, 2, 3])}`);
    await klick(knopfMitText('Übernehmen'));
    expect(status()!.textContent).toBe('5 Stellen übernommen. 3 Stellen waren schon gemerkt. 5 Stellen nicht übernommen (Merkliste voll, höchstens 50).');
    expect(holeMerkliste()).toHaveLength(MERKLISTE_MAX);
  });

  it('alles schon da: «… schon gemerkt»; eine einzelne neue Stelle: Einzahl', async () => {
    merke({ route: '/gesetze/bund/E1', titel: 'E1' });
    await mountFlaeche(`/?merkliste=${link(0, [1])}`);
    await klick(knopfMitText('Übernehmen'));
    expect(status()!.textContent).toBe('1 Stelle war schon gemerkt.');
    await unmount();
    leereMerkliste();
    await mountFlaeche(`/?merkliste=${link(1)}`);
    await klick(knopfMitText('Übernehmen'));
    expect(status()!.textContent).toBe('1 Stelle übernommen.');
  });
});
