/**
 * W2·17-UI-BEFUNDE · Suchsemantik, DOM-Seite — der Walker `sammleTrefferRanges`
 * (Lauf über Textknoten, Blockgrenzen) und die Mal-Zerlegung um Fussnoten-Marker.
 *
 * Nachzug der Gegenprüfung zu PR #1266 (§6.7 «ein Tor, das nicht scheitern kann»):
 * die Lauf-Logik (`trenntLauf`, Leeren je Element) war ungetestet, zwei
 * Mutationen blieben grün. Die Umgebung ist node + linkedom; linkedom kennt weder
 * `Range.setStart` noch `getComputedStyle` — beides steht unten als kleines Doppel
 * (Display nach Tag, Range als Start/Ende-Paar). Das genügt, weil der Walker nur
 * `createRange`/`setStart`/`setEnd` und die Anzeige-Art eines Elements braucht.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseHTML } from 'linkedom';
import {
  sammleTrefferRanges, setzeSuchHighlightRanges, neueHighlightInstanz, SUCH_HIGHLIGHT,
} from '../pages/gesetz-leser/suchHighlight';

class DoppelRange {
  startContainer!: Text; startOffset = 0;
  endContainer!: Text; endOffset = 0;
  setStart(n: Text, o: number) { this.startContainer = n; this.startOffset = o; }
  setEnd(n: Text, o: number) { this.endContainer = n; this.endOffset = o; }
}

const BLOCK = new Set(['P', 'DIV', 'LI', 'TD', 'TR', 'TABLE', 'UL', 'SECTION']);

type G = Record<string, unknown>;
const g = globalThis as unknown as G;
const gemerkt: G = {};
const NAMEN = ['document', 'Node', 'getComputedStyle', 'CSS', 'Highlight'] as const;

function dokument(html: string): HTMLElement {
  const { document } = parseHTML(`<main>${html}</main>`);
  (document as unknown as { createRange: () => unknown }).createRange = () => new DoppelRange();
  g.document = document;
  return document.querySelector('main') as unknown as HTMLElement;
}

beforeAll(() => {
  for (const n of NAMEN) gemerkt[n] = g[n];
  const { Node } = parseHTML('<i></i>');
  g.Node = Node;
  g.getComputedStyle = (el: Element) => ({ display: BLOCK.has(el.tagName) ? 'block' : 'inline' });
});
afterAll(() => { for (const n of NAMEN) g[n] = gemerkt[n]; });

/** Text einer (Doppel-)Range, die an EINEM Knoten beginnt und endet. */
function einKnoten(r: Range): string {
  const d = r as unknown as DoppelRange;
  expect(d.startContainer).toBe(d.endContainer);
  return (d.startContainer.nodeValue ?? '').slice(d.startOffset, d.endOffset);
}

describe('sammleTrefferRanges — Lauf über Link-Grenzen (PE-C9-B03)', () => {
  it('«nach Artikel» über die Grenze <a>: eine Stelle, von «nach» bis in den Link', () => {
    const w = dokument('<p>nach <a>Artikel 269</a> OR</p>');
    const rs = sammleTrefferRanges(w, 'nach Artikel') as unknown as DoppelRange[];
    expect(rs).toHaveLength(1);
    expect(rs[0].startContainer.nodeValue).toBe('nach ');
    expect(rs[0].startOffset).toBe(0);
    expect(rs[0].endContainer.nodeValue).toBe('Artikel 269');
    expect(rs[0].endOffset).toBe('Artikel'.length);
  });

  it('ein Treffer, der ganz in einem Knoten liegt, bleibt genau eine Stelle (kein Doppelzählen je Lauf)', () => {
    const w = dokument('<p>Artikel <a>Artikel</a></p>');
    expect(sammleTrefferRanges(w, 'Artikel')).toHaveLength(2);
  });
});

describe('sammleTrefferRanges — Blockgrenze beendet den Lauf (PE-C9-B03)', () => {
  it('zwei <p>: «nach Artikel» geht NICHT über die Absatzgrenze', () => {
    const w = dokument('<p>vor nach </p><p>Artikel 5</p>');
    expect(sammleTrefferRanges(w, 'nach Artikel')).toHaveLength(0);
  });

  it('<br> trennt ebenfalls; derselbe Wortlaut in EINEM Absatz trifft', () => {
    expect(sammleTrefferRanges(dokument('<p>vor nach <br>Artikel 5</p>'), 'nach Artikel')).toHaveLength(0);
    expect(sammleTrefferRanges(dokument('<p>vor nach Artikel 5</p>'), 'nach Artikel')).toHaveLength(1);
  });

  it('Treffer je Absatz werden einzeln gefunden (Lauf wird an der Grenze geleert, nicht verworfen)', () => {
    const w = dokument('<p>Frist</p><p>Frist</p>');
    expect(sammleTrefferRanges(w, 'Frist')).toHaveLength(2);
  });
});

describe('Mal-Zerlegung um Fussnoten-Marker (Gegenprüfung #1266, niedrig)', () => {
  it('Treffer über einen Marker: EINE Fundstelle (Zählung), aber gemalt wird ohne die Marker-Ziffer', () => {
    const w = dokument('<p>Frist 2016<sup data-fn-marker>4</sup> über uns</p>');
    const rs = sammleTrefferRanges(w, '2016 über');
    expect(rs).toHaveLength(1); // Sprungziele = Zählung unverändert

    const reg = new Map<string, { ranges: Range[] }>();
    g.CSS = { highlights: reg };
    g.Highlight = class { ranges: Range[]; constructor(...r: Range[]) { this.ranges = r; } };
    const inst = neueHighlightInstanz('marker-test');
    try {
      setzeSuchHighlightRanges(rs, inst);
      const gemalt = reg.get(SUCH_HIGHLIGHT)!.ranges.map(einKnoten);
      expect(gemalt).toEqual(['2016', ' über']);
      expect(gemalt.join('')).not.toContain('4');
    } finally {
      setzeSuchHighlightRanges([], inst);
    }
  });

  it('ohne Marker bleibt die Range unverändert (dieselbe Instanz, keine Zerlegung)', () => {
    const w = dokument('<p>nach <a>Artikel 269</a></p>');
    const rs = sammleTrefferRanges(w, 'nach Artikel');
    const reg = new Map<string, { ranges: Range[] }>();
    g.CSS = { highlights: reg };
    g.Highlight = class { ranges: Range[]; constructor(...r: Range[]) { this.ranges = r; } };
    const inst = neueHighlightInstanz('ohne-marker');
    try {
      setzeSuchHighlightRanges(rs, inst);
      expect(reg.get(SUCH_HIGHLIGHT)!.ranges).toEqual(rs);
    } finally {
      setzeSuchHighlightRanges([], inst);
    }
  });
});
