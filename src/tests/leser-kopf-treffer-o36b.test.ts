/**
 * LESER-NAV · FB O-36 b (Entscheid David 15.10.2026 «Ja, markieren») — der
 * ZÄHLVERTRAG «gezählt = gemalt» für Sektionsköpfe (Gliederungstitel und geteilte
 * Randtitel-Stufen).
 *
 * BEFUND (gemessen 15.10.2026, OR, headless Chromium): «Vertrag» zählte 1607
 * Fundstellen, 1104 davon ohne gemalte Stelle (397 von 682 Artikeln leuchteten
 * nirgends); «Kündigung» 175 gegen 60 (19 von 88 Artikeln). Ursache: jeder Artikel
 * trug den ganzen Gliederungspfad als `nie` malbaren Baustein mit, der Kopf steht
 * im DOM aber nur EINMAL über dem ersten Artikel seines Teilbaums.
 *
 * WIE HIER GEMESSEN WIRD: gerendert wird der ECHTE `SektionKopf` (react-dom/server),
 * zusammengesetzt wie `renderSektion` (Kopf, dann Kinder und Artikel nach
 * Dokumentposition); gemalt wird mit dem ECHTEN Walker `sammleTrefferRanges`.
 * Der Artikel-Wortlaut ist von Hand gesetzt (er ist nicht Gegenstand), die Köpfe
 * nicht. Umgebung node + linkedom; `Range` und `getComputedStyle` als kleines
 * Doppel (wie `leser-suchsemantik-dom-w217`).
 *
 * ROT ZU BEKOMMEN (§6.7): `kopfSegmente` aus `baueLeserSuchIndex` herausnehmen
 * (Köpfe wieder je Artikel als `nie`) — «gezählt = gemalt» fällt an Art. 2.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import { baueGliederungsbaum, type Sektion, type StrukturMap } from '../lib/normtext/browse';
import type { NormSnapshot } from '../lib/normtext/typen';
import { SektionKopf } from '../pages/gesetz-leser/parts/SektionKopf';
import { berechneSekPos } from '../pages/gesetz-leser/berechnungen';
import { sammleTrefferRanges } from '../pages/gesetz-leser/suchHighlight';
import {
  baueLeserSuchIndex, sucheImErlass, fundstellenFolge, zaehleTreffer,
} from '../pages/gesetz-leser/leserSuche';

// ── Fixture ───────────────────────────────────────────────────────────────────
// «Zaunkoenig» steht: im Titel-Kopf (Art. 1–3 darunter), in der geteilten
// Randtitel-Stufe «A. …» (Art. 1–2), im Blatt-Randtitel von Art. 2 und im
// Wortlaut von Art. 1 (1×) und Art. 3 (2×). Art. 4 steht unter einem anderen Titel.
const basis = {
  ebene: 'bund' as const, quelle: 'X', erlass: 'X',
  stand: '2026-01-01', quelleUrl: 'https://example.invalid', abgerufen: '2026-01-01',
  fassungsToken: '20260101', sha: 'x',
};
const art = (n: string, text: string): NormSnapshot => ({
  ...basis, id: `x/${n}`, artikel: n, artikelLabel: `Art. ${n}`, bloecke: [{ absatz: '1', text }],
});
const eintraege: NormSnapshot[] = [
  art('1', 'Der Zaunkoenig ist geschuetzt.'),
  art('2', 'Ohne Fundstelle.'),
  art('3', 'Zaunkoenig und noch ein Zaunkoenig.'),
  art('4', 'Ohne Fundstelle.'),
];
const TITEL1 = { ebene: 0, label: 'Erster Titel: Der Zaunkoenig im Allgemeinen' };
const struktur: StrukturMap = {
  '1': { gliederung: [TITEL1], marginalie: ['A. Zaunkoenig-Schutz', 'Gegenstand'] },
  '2': { gliederung: [TITEL1], marginalie: ['A. Zaunkoenig-Schutz', 'Der Zaunkoenig als Randtitel'] },
  '3': { gliederung: [TITEL1], marginalie: ['B. Anderes'] },
  '4': { gliederung: [{ ebene: 0, label: 'Zweiter Titel: Ohne Fundstelle' }], marginalie: [] },
};
const BEGRIFF = 'Zaunkoenig';

// ── Umgebung ─────────────────────────────────────────────────────────────────
class DoppelRange {
  startContainer!: Text; startOffset = 0;
  endContainer!: Text; endOffset = 0;
  setStart(n: Text, o: number) { this.startContainer = n; this.startOffset = o; }
  setEnd(n: Text, o: number) { this.endContainer = n; this.endOffset = o; }
}
// BUTTON zählt hier als Blockelement: im echten Kopf tragen beide Buttons `block`
// bzw. `flex` (SektionKopf), der Aufzähler und der Sachtitel sind also getrennte Läufe.
const BLOCK = new Set(['P', 'DIV', 'LI', 'TD', 'TR', 'TABLE', 'UL', 'SECTION', 'BUTTON', 'ARTICLE', 'H3']);
type G = Record<string, unknown>;
const g = globalThis as unknown as G;
const gemerkt: G = {};
const NAMEN = ['document', 'Node', 'getComputedStyle'] as const;
beforeAll(() => {
  for (const n of NAMEN) gemerkt[n] = g[n];
  const { Node } = parseHTML('<i></i>');
  g.Node = Node;
  g.getComputedStyle = (el: Element) => ({ display: BLOCK.has(el.tagName) ? 'block' : 'inline' });
});
afterAll(() => { for (const n of NAMEN) g[n] = gemerkt[n]; });

/** Die Lesespalte, wie `renderSektion` sie aufbaut — mit dem echten `SektionKopf`. */
function lesespalte(): HTMLElement {
  const { sektionen } = baueGliederungsbaum(eintraege, struktur);
  const sekPos = berechneSekPos(sektionen, eintraege);
  const artPos = new Map(eintraege.map((e, i) => [e.artikel, i]));
  // Der Wortlaut der Artikel steht von Hand: Blatt-Randtitel, Label, Text.
  const artikelHtml = (e: NormSnapshot) => {
    const blatt = struktur[e.artikel].marginalie.at(-1);
    const hatBlatt = blatt !== undefined && !/^[A-Z]\.\s/.test(blatt);
    return `<article id="art-${e.artikel}">${hatBlatt ? `<h3>${blatt}</h3>` : ''}<p>${e.artikelLabel}</p><p>${e.bloecke[0].text}</p></article>`;
  };
  const sektionHtml = (s: Sektion, tiefe: number): string => {
    const kopf = renderToStaticMarkup(createElement(SektionKopf, {
      s, refCb: () => {}, offen: true, onToggle: () => {}, bereich: 'Art. 1–4', randTiefe: tiefe,
      amtlichUrl: 'https://example.invalid/fedlex',
    }));
    const inhalt = [
      ...s.kinder.map((k) => ({ pos: sekPos.get(k.id) ?? Infinity, html: sektionHtml(k, s.randtitel ? tiefe + 1 : 0) })),
      ...s.artikel.map((e) => ({ pos: artPos.get(e.artikel) ?? 0, html: artikelHtml(e) })),
    ].sort((a, b) => a.pos - b.pos);
    return `<section>${kopf}<div>${inhalt.map((x) => x.html).join('')}</div></section>`;
  };
  const { document } = parseHTML(`<main id="lc-lesespalte">${sektionen.map((s) => sektionHtml(s, 0)).join('')}</main>`);
  (document as unknown as { createRange: () => unknown }).createRange = () => new DoppelRange();
  g.document = document;
  return document.querySelector('main') as unknown as HTMLElement;
}

/** Gemalte Stellen je Artikel: sein eigener Wortlaut PLUS die Köpfe, die über ihm stehen. */
function gemaltJeArtikel(wurzel: HTMLElement): Map<string, number> {
  const out = new Map<string, number>();
  let koepfe = 0;
  for (const el of wurzel.querySelectorAll('article[id^="art-"], [data-sek]')) {
    if (el.hasAttribute('data-sek')) koepfe += sammleTrefferRanges(el as HTMLElement, BEGRIFF).length;
    else {
      out.set(el.id.slice(4), sammleTrefferRanges(el as HTMLElement, BEGRIFF).length + koepfe);
      koepfe = 0;
    }
  }
  return out;
}

describe('O-36 b · Zählvertrag «gezählt = gemalt» für Sektionsköpfe', () => {
  const sektionen = () => baueGliederungsbaum(eintraege, struktur).sektionen;
  const treffer = () => sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur, sektionen()), BEGRIFF);

  it('je Artikel ist die gezählte Zahl die gemalte — der Kopf zählt EINMAL, am ersten Artikel', () => {
    const wurzel = lesespalte();
    const gemalt = gemaltJeArtikel(wurzel);
    const gezaehlt = new Map(treffer().map((t) => [t.token, t.fundstellen]));
    for (const e of eintraege) {
      expect(gezaehlt.get(e.artikel) ?? 0, `Art. ${e.artikel}: gezählt = gemalt`).toBe(gemalt.get(e.artikel) ?? 0);
    }
    // Art. 1 trägt beide Köpfe (Titel + «A.»), Art. 2 nur sein Blatt — vorher 3.
    expect(gezaehlt.get('1')).toBe(3);
    expect(gezaehlt.get('2')).toBe(1);
    expect(gezaehlt.get('3')).toBe(2);
    expect(gezaehlt.has('4')).toBe(false);
    expect(zaehleTreffer(treffer()).fundstellen).toBe(6);
  });

  it('jede Kopf-Fundstelle der Folge ist als Stelle IM KOPF ansteuerbar (Enter/Weiter)', () => {
    const wurzel = lesespalte();
    const folge = fundstellenFolge(treffer(), false);
    const imKopf = folge.filter((f) => f.kopf !== null);
    expect(imKopf).toHaveLength(2);
    for (const f of imKopf) {
      const kopfEl = wurzel.querySelector(`[data-sek="${f.kopf}"]`) as HTMLElement | null;
      expect(kopfEl, `Kopf ${f.kopf} steht im DOM`).not.toBeNull();
      const ranges = sammleTrefferRanges(kopfEl!, BEGRIFF) as unknown as DoppelRange[];
      const r = ranges[f.malRang!];
      expect(r, `Kopf ${f.kopf}: Stelle ${f.malRang} wird gemalt`).toBeDefined();
      expect((r.startContainer.nodeValue ?? '').slice(r.startOffset, r.endOffset)).toBe(BEGRIFF);
    }
    // Stellen im Artikel führen keinen Kopf und ihren eigenen, lückenlosen Rang.
    const imArtikel = folge.filter((f) => f.token === '3');
    expect(imArtikel.map((f) => [f.kopf, f.malRang])).toEqual([[null, 0], [null, 1]]);
  });

  it('Bedienelemente des Kopfs (Bereich, Fedlex-Link, Pfeil) sind nie Treffer', () => {
    const wurzel = lesespalte();
    // «Art» steht im Bereich-Badge («Art. 1–4»), «Fassung» im Link — beides Bedienung.
    for (const begriff of ['Art', 'Fassung', '▸', '▾']) {
      for (const kopf of wurzel.querySelectorAll('[data-sek]')) {
        const text = (kopf.querySelector('.lc-wortumbruch')?.textContent ?? '');
        const erwartet = text.toLowerCase().split(begriff.toLowerCase()).length - 1;
        expect(sammleTrefferRanges(kopf as HTMLElement, begriff).length, `${begriff} im Kopf «${text}»`).toBe(erwartet);
      }
    }
  });

  it('Randfall: ohne übergebenen Baum baut der Index denselben aus denselben Daten', () => {
    const mit = treffer().map((t) => `${t.token}:${t.fundstellen}`);
    const ohne = sucheImErlass(baueLeserSuchIndex('X', eintraege, struktur), BEGRIFF).map((t) => `${t.token}:${t.fundstellen}`);
    expect(ohne).toEqual(mit);
  });
});
