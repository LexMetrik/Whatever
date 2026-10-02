// W2·17-UI-BEFUNDE · Reiter «Entscheide», Liste und Lagen (Befunde PE-E1/E2/E3/E5, 1.10.2026).
//
// ROT ZU BEKOMMEN (§6.7), je Befund die eine Mutation:
//  · PE-E1-B01: in `PanelEntscheide.Fundstelle` `datumAnzeige(b.datum)` ohne `b.datumUnbekannt`.
//  · PE-E1-B02: `WEITERZUG_MUSTER` zurück auf `/\(BGer\b[^()]*\bvom\b[^()]*\)/`.
//  · PE-E1-B03/E2-B01: in `Gruppe` `useState(Math.min(ERSTE_PORTION, g.liste.length))` und
//    `zeige = sichtbar` (statt `Math.min(sichtbar, g.liste.length)`).
//  · PE-E3-B01: die Lage «gefiltert» streichen (Weiche nur `gruppen.length === 0`).
//  · PE-E3-B02: den Fehler-Satz zurück auf «bei bestehender Verbindung wird es von selbst erneut versucht».
//  · PE-E5-B02: `gesamtJeGruppe` weglassen (Gruppenkopf zeigt nur die gefilterte Zahl).
//  · PE-E1-D01: das ⓘ zurück auf ein `<span title>`.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Bezug } from '../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../lib/verzahnung/facetten';
import { PanelEntscheide } from '../pages/gesetz-leser/v3/PanelEntscheide';
import { WEITERZUG_MUSTER } from '../pages/gesetz-leser/v3/PanelEntscheideKontext';
import { gefiltertSatz } from '../pages/gesetz-leser/v3/entscheideOrdnung';

function kante(key: string, status: BezugStatus, opt: {
  datum?: string; zitierung?: string; regeste?: string | null; datumUnbekannt?: true;
} = {}): Bezug {
  const kanton = status === 'kantonal' ? 'BS' : 'CH';
  return {
    key,
    zitierung: opt.zitierung ?? key,
    regesteKurz: opt.regeste ?? null,
    datum: opt.datum ?? '2024-01-15',
    ...(opt.datumUnbekannt ? { datumUnbekannt: true } : {}),
    gewicht: null,
    facetten: {
      status, ebene: status === 'kantonal' ? 'kanton' : 'bund', kanton,
      gericht: status === 'kantonal' ? 'bs_appellationsgericht' : status, quelltyp: 'rechtsprechung',
    },
  } as unknown as Bezug;
}
const bge = (n: number, datum = '2024-01-15') => kante(`bge_${n}`, 'bge', { zitierung: `BGE 150 III ${n}`, datum });

const basis = {
  aktArtikel: '97', revisionShard: null, normZitat: 'Art. 97 OR', artikelLabel: 'Art. 97',
  bestimmungsWort: 'Artikel' as const, klassen: ['bge', 'bger', 'eidg', 'kantonal'] as BezugStatus[],
  kantone: [] as string[], kantoneVerfuegbar: [] as string[],
  histogramm: { balken: [], ohneJahr: 0 }, bereich: { von: '', bis: '' },
  onKlassen: () => {}, onKantone: () => {}, onBereich: () => {},
};
type Props = Partial<Parameters<typeof PanelEntscheide>[0]>;
const html = (p: Props) =>
  renderToString(<MemoryRouter><PanelEntscheide {...basis} geladen {...p} /></MemoryRouter>);
const sichtbarerText = (h: string) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

describe('PE-E1-B01 · ein Platzhalterdatum wird nie als echtes Datum gezeigt (§8)', () => {
  it('datumUnbekannt ⇒ «2025, o. D.», nie «01.01.2025»', () => {
    const k = kante('bs_DGS.2025.13', 'kantonal', {
      zitierung: 'Appellationsgericht BS DGS.2025.13', datum: '2025-01-01', datumUnbekannt: true,
    });
    const t = sichtbarerText(html({ kanten: [k], alleKanten: [k] }));
    expect(t).toContain('2025, o. D.');
    expect(t).not.toContain('01.01.2025');
  });

  it('Gegenprobe: ein echtes Datum bleibt ein Datum (Datum ≠ Monatserster)', () => {
    const k = kante('bge_1', 'bge', { zitierung: 'BGE 150 III 1', datum: '2025-03-14' });
    const t = sichtbarerText(html({ kanten: [k], alleKanten: [k] }));
    expect(t).toContain('14.03.2025');
    expect(t).not.toContain('o. D.');
  });
});

describe('PE-E1-B02 · der Weiterzug-Zusatz wird auch in den gleichbedeutenden Schreibweisen erkannt', () => {
  const ja = [
    'Rente (Bundesgerichtsurteil 9C_393/2024 vom 02.09.2025)',
    'Rente (Bundesgerichtsurteil 9C_84/2023 vom…',                  // vom Generator gekürzt, Klammer fehlt
    'Forderung (BGer 4A_620/2025)',                                  // ohne Datum
    'Forderung (BGer-Nr.: 4A_620/2025)',
    'Forderung (BGer-Nr. 4A_620/2025 vom 14. Januar 2026)',
    'Forderung (BGer-Urteil 4A_620/2025 vom 14. Januar 2026)',
    'Haft (Urteil BGer 7B_588/2025 vom 12.03.2026)',
    'Haft (Urteil Bundesgericht 8C_435/2023 vom 27.05.2024)',
    'Haft (BGer vom 16.07.2025 7B_557/2025)',
    'Haft (BGer…',                                                   // gekürzt nach dem Stichwort
    'Haft (Bundesgerichtsurteil…',
    'Haft (BGer-Nr.…',
    'Haft (BGer7B_1/2025 vom 1. Mai 2025)',                          // wie im Korpus: kein Leerzeichen
  ];
  const nein = [
    'Mietstreit (BGer-Praxis uneinheitlich)',
    'Vgl. dazu auch das BGer in einem früheren Fall.',
    // «hängig» heisst: noch NICHT entschieden — eine andere Aussage als «weitergezogen und entschieden».
    'Rente (Beschwerde beim Bundesgericht hängig)',
    'Rente (Beschwerde beim BGer hängig)',
    // aufgehoben ≠ weitergezogen
    'Befehl (aufgehoben durch BGer 7B_302/2023 vom 17. September 2024; neuer Entscheid …)',
  ];
  it.each(ja)('erkennt «%s»', (z) => { expect(WEITERZUG_MUSTER.test(z)).toBe(true); });
  it.each(nein)('erkennt «%s» NICHT', (z) => { expect(WEITERZUG_MUSTER.test(z)).toBe(false); });
});

// ── Client-Render: Zustand über mehrere Render-Durchgänge (renderToString kann das nicht) ──
let root: Root | null = null;
let ziel: HTMLElement;
let win: Window;

async function mount(p: Props) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  win = window as unknown as Window;
  vi.stubGlobal('window', Object.assign(window, {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    requestIdleCallback: (cb: () => void) => globalThis.setTimeout(cb, 0) as unknown as number,
    cancelIdleCallback: (id: number) => globalThis.clearTimeout(id),
  }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  ziel = document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  await zeige(p);
}
async function zeige(p: Props) {
  await act(async () => {
    root!.render(createElement(MemoryRouter, null, createElement(PanelEntscheide, { ...basis, geladen: true, ...p })));
  });
}
async function klick(el: Element) {
  await act(async () => { el.dispatchEvent(new (win as unknown as { Event: typeof Event }).Event('click', { bubbles: true })); });
}
const zeilen = () => ziel.querySelectorAll('[data-v3-panel-entscheid]').length;

afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('PE-E1-B03 / PE-E2-B01 · die erste Portion hängt nicht vom Zeitpunkt des Einblendens ab', () => {
  const zwanzig = Array.from({ length: 20 }, (_, i) => bge(i + 1, `2020-01-${String(i + 1).padStart(2, '0')}`));

  it('Gruppe mit 2 Einträgen eingeblendet, Filter geweitet ⇒ 5 Einträge (wie bei frischem Laden), nicht 2', async () => {
    await mount({ kanten: zwanzig.slice(0, 2), alleKanten: zwanzig });
    expect(zeilen()).toBe(2);
    await zeige({ kanten: zwanzig, alleKanten: zwanzig });
    expect(zeilen()).toBe(5);
    expect(ziel.querySelector('[data-v3-panel-weitere]')?.textContent).toContain('weitere 15');
  });

  it('Gegenprobe: nach «weitere» bleibt der erweiterte Stand, solange die Gruppe gleich gross bleibt', async () => {
    await mount({ kanten: zwanzig, alleKanten: zwanzig });
    expect(zeilen()).toBe(5);
    await klick(ziel.querySelector('[data-v3-panel-weitere]')!);
    expect(zeilen()).toBe(20);
    expect(ziel.querySelector('[data-v3-panel-weitere]')).toBeNull();
  });

  it('Gegenprobe: Filter verengt die Gruppe unter die Portion ⇒ nie mehr Zeilen als Einträge', async () => {
    await mount({ kanten: zwanzig, alleKanten: zwanzig });
    await zeige({ kanten: zwanzig.slice(0, 3), alleKanten: zwanzig });
    expect(zeilen()).toBe(3);
    expect(ziel.querySelector('[data-v3-panel-weitere]')).toBeNull();
  });
});

describe('PE-E1-D01 · der Weiterzug-Hinweis ist ein Bedienelement (Tastatur, Touch)', () => {
  const mitZusatz = [kante('bs_1', 'kantonal', {
    zitierung: 'Appellationsgericht BS BES.2024.1 vom 15.01.2024', regeste: 'Rente (BGer 9C_1/2024 vom 02.09.2025)',
  })];

  it('SSR: ein <button> mit aria-expanded=false, der Erklärsatz steht noch nicht im Text', () => {
    const h = html({ kanten: mitZusatz, alleKanten: mitZusatz });
    expect(h).toMatch(/<button[^>]*aria-expanded="false"[^>]*>ⓘ<\/button>/);
    expect(sichtbarerText(h)).not.toContain('weitergezogen');
  });

  it('Klick (= Enter/Leertaste/Tap auf einem Button) zeigt den Satz und setzt aria-expanded, zweiter Klick schliesst', async () => {
    await mount({ kanten: mitZusatz, alleKanten: mitZusatz });
    const knopf = ziel.querySelector('[data-v3-panel-gruppe] button[aria-expanded]')!;
    expect(knopf.textContent).toBe('ⓘ');
    expect(ziel.textContent).not.toContain('weitergezogen');
    await klick(knopf);
    expect(knopf.getAttribute('aria-expanded')).toBe('true');
    expect(ziel.textContent).toContain('ans Bundesgericht weitergezogen');
    const satz = ziel.querySelector(`#${knopf.getAttribute('aria-controls')}`);
    expect(satz?.textContent).toContain('weitergezogen');
    await klick(knopf);
    expect(knopf.getAttribute('aria-expanded')).toBe('false');
    expect(ziel.textContent).not.toContain('weitergezogen');
  });
});

describe('PE-E3-B01 · «kein Entscheid erfasst» nur, wenn wirklich keiner erfasst ist', () => {
  const alle = [bge(1, '2023-05-02'), bge(2, '2024-06-03'), kante('bs_1', 'kantonal', { zitierung: 'Appellationsgericht BS X vom 15.01.2024' })];

  it('Zeitraum blendet alles aus ⇒ Lage «gefiltert», nennt die Zahl und den Zeitraum, nie «kein Entscheid»', () => {
    const h = html({ kanten: [], alleKanten: alle, bereich: { von: '1900-01-01', bis: '1901-12-31' } });
    expect(h).toContain('data-v3-panel-lage="gefiltert"');
    expect(h).not.toContain('data-v3-panel-lage="bestand"');
    const t = sichtbarerText(h);
    expect(t).toContain('3 Entscheide');
    expect(t).toContain('Zeitraum');
    expect(t).not.toContain('kein Entscheid');
  });

  it('nur das Gesetz selbst leer (alleKanten fehlt) ⇒ weiterhin die Bestands-Lage', () => {
    for (const p of [{ kanten: [] }, { kanten: [], alleKanten: [] }, { kanten: [], alleKanten: undefined, bereich: { von: '2020-01-01', bis: '' } }]) {
      const h = html(p);
      expect(h).toContain('data-v3-panel-lage="bestand"');
      expect(h).toContain('kein Entscheid der eingeschalteten Instanzen erfasst');
    }
  });

  it('Gegenprobe: ist der Zeitraum offen, gibt es nichts zu «verstecken» ⇒ Bestands-Lage', () => {
    const h = html({ kanten: [], alleKanten: alle });
    expect(h).toContain('data-v3-panel-lage="bestand"');
  });

  it('zählt nur die EINGESCHALTETEN Instanzen (BGE aus ⇒ nur die kantonale Kante zählt)', () => {
    const t = gefiltertSatz({
      artikelLabel: 'Art. 97', alle, klassen: ['kantonal'], kantone: [], bereich: { von: '2030-01-01', bis: '' },
    });
    expect(t).toContain('1 Entscheid');
    expect(t).not.toContain('3 Entscheid');
  });

  it('Kanton-Filter: «Kanton» im Satz; beide Filter: «Zeitraum und Kanton»', () => {
    const k = { artikelLabel: 'Art. 97', alle, klassen: ['bge', 'kantonal'] as BezugStatus[] };
    expect(gefiltertSatz({ ...k, kantone: ['GR'], bereich: { von: '', bis: '' } })).toMatch(/im gewählten Kanton/);
    expect(gefiltertSatz({ ...k, kantone: ['GR'], bereich: { von: '2030-01-01', bis: '' } })).toMatch(/im gewählten Zeitraum und Kanton/);
    expect(gefiltertSatz({ ...k, kantone: [], bereich: { von: '2030-01-01', bis: '' } })).toMatch(/im gewählten Zeitraum\b(?! und)/);
  });

  it('keine Filter wirksam oder nichts erfasst ⇒ kein Satz (null)', () => {
    const k = { artikelLabel: 'Art. 97', klassen: ['bge'] as BezugStatus[], kantone: [] as string[] };
    expect(gefiltertSatz({ ...k, alle, bereich: { von: '', bis: '' } })).toBeNull();
    expect(gefiltertSatz({ ...k, alle: [], bereich: { von: '2030-01-01', bis: '' } })).toBeNull();
    expect(gefiltertSatz({ ...k, alle: undefined, bereich: { von: '2030-01-01', bis: '' } })).toBeNull();
    // Kanton gewählt, aber «kantonal» ausgeschaltet ⇒ der Kanton-Filter wirkt gar nicht.
    expect(gefiltertSatz({ ...k, alle, kantone: ['GR'], bereich: { von: '', bis: '' } })).toBeNull();
  });
});

describe('PE-E3-B02 · die Fehler-Lage verspricht nichts, was nicht geschieht', () => {
  it('kein «von selbst erneut versucht» bei bestehender Verbindung; der Knopf bleibt', () => {
    const h = html({ geladen: false, fehler: true, onNeuLaden: () => {} });
    const t = sichtbarerText(h);
    expect(t).not.toContain('bei bestehender Verbindung');
    expect(t).toContain('Wiederverbinden');          // die EINE Selbstheilung, die es gibt (`online`-Ereignis)
    expect(t).toContain('Erneut laden');
    expect(t).not.toContain('kein Entscheid');
  });
});

describe('PE-E5-B02 · die Gruppenzahl sagt, wenn der Zeitraum die Gruppe verkürzt', () => {
  const alle = Array.from({ length: 8 }, (_, i) => bge(i + 1, i < 2 ? '2025-02-0' + (i + 1) : '2020-01-0' + (i + 1)));
  const num = (h: string) => /data-v3-panel-gruppe="bge"[\s\S]*?<span class="num[^"]*">([^<]*(?:<!-- -->[^<]*)*)<\/span>/.exec(h)?.[1]?.replace(/<!-- -->/g, '');

  it('Zeitraum aktiv, 2 von 8 sichtbar ⇒ «2 von 8» am Kopf; data-Zahl bleibt die gefilterte', () => {
    const h = html({ kanten: alle.slice(0, 2), alleKanten: alle, bereich: { von: '2024-01-01', bis: '' } });
    expect(num(h)).toBe('2 von 8');
    expect(h).toContain('data-v3-panel-gruppe-zahl="2"');
    expect(h).toContain('2 von 8 Fundstelle(n) an Art. 97');
  });

  it('Zeitraum offen ⇒ nackte Zahl, keine Veränderung', () => {
    const h = html({ kanten: alle, alleKanten: alle });
    expect(num(h)).toBe('8');
  });

  it('Zeitraum aktiv, aber die Gruppe verliert nichts ⇒ nackte Zahl', () => {
    const h = html({ kanten: alle, alleKanten: alle, bereich: { von: '2019-01-01', bis: '' } });
    expect(num(h)).toBe('8');
  });
});
