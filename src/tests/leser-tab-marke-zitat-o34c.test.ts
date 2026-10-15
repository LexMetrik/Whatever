/**
 * LESER-NAV/O-34c · «[tab]»-Marke im kopierten Zitat (ED2-D02).
 *
 * Befund (15.10.2026, Daten-Stichprobe `public/normtext/bund/ASYLV2.json` Art. 41):
 * Fedlex serialisiert einen leeren Listen-Abstandshalter als literalen Text «[tab]»;
 * 23 Snapshot-Dateien tragen ihn noch als `marke: '[tab]'` (Sanierung = deferierter
 * [tab]-Batch der Extraktion, `scripts/normtext/check-invarianten-logik.ts`, B-63).
 * Die Leser-Darstellung zeigte «[tab]» sichtbar als Marke und der Zitierknopf kopierte
 * «Art. 41 Abs. 1 lit. [tab] ASYLV 2».
 * Darstellung/Zitat behandeln «[tab]» jetzt wie eine marke-lose Zeile (`marke: ''`,
 * W2·27): keine Marke, kein Zitierknopf, die Kette bricht dort ab (§1/§8: kein Zitat
 * ist besser als ein falsches). Die Daten bleiben unberührt.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { istLeerMarke, itemZitatSegmente, markenAnzeige, stufenFuer } from '../components/normtext/ArtikelBody.helfer';

type Item = { marke: string; text: string; trenner?: string; tiefe?: number };
const alle = (items: Item[]): string[][] => items.map((_, j) => itemZitatSegmente(items as never, stufenFuer(items), j));

describe('istLeerMarke', () => {
  it('leer und der Fedlex-Abstandshalter «[tab]» (auch mit Rand-Leerraum) zählen als marke-los', () => {
    expect(istLeerMarke('')).toBe(true);
    expect(istLeerMarke('[tab]')).toBe(true);
    expect(istLeerMarke(' [tab] ')).toBe(true);
  });
  it('Randfälle: echte Marken und ähnlich aussehende Texte nicht', () => {
    for (const m of ['a', '1', 'abis', '–', '[Tab]', 'tab', '[tab] a', '[tabs]']) expect(istLeerMarke(m), m).toBe(false);
  });
});

describe('Zitat und Anzeige (Repro ASYLV2 Art. 41: marke «[tab]», trenner «»)', () => {
  it('markenAnzeige zeigt keine «[tab]»-Marke', () => {
    expect(markenAnzeige('[tab]', '')).toBe('');
    expect(markenAnzeige('[tab]')).toBe('');
  });
  it('die Zeile trägt selbst kein Zitat (vorher «lit. [tab]»)', () => {
    expect(alle([{ marke: '[tab]', text: 'PB = (PE × DE) × JA/JT', trenner: '' }])).toEqual([[]]);
  });
  it('Geschwister davor/danach behalten ihr Zitat, ein Kind unter «[tab]» bekommt keines (Kette bricht)', () => {
    const items: Item[] = [
      { marke: 'a', text: 'x', tiefe: 0 }, { marke: '[tab]', text: 'Formel', tiefe: 0 },
      { marke: '1', text: 'Kind', tiefe: 1 }, { marke: 'b', text: 'y', tiefe: 0 },
    ];
    expect(alle(items)).toEqual([['lit. a'], [], [], ['lit. b']]);
  });
  it('stufenFuer: «[tab]» verdeckt die Umkehr-Erkennung «1. a.» nicht', () => {
    const mit = [{ marke: '[tab]' }, { marke: '1' }, { marke: 'a' }, { marke: 'b' }];
    expect(stufenFuer(mit)).toEqual([0, 0, 1, 1]);
  });
});

describe('Darstellung (renderToString, Lesesicht mit Zitierkontext)', () => {
  const bloecke = [{ absatz: '1', text: 'Es gilt die Formel:', items: [
    { marke: 'a', text: 'erstes;', trenner: '.', tiefe: 0 },
    { marke: '[tab]', text: 'PB = (PE × DE) × JA/JT', trenner: '', tiefe: 0 },
  ] }];
  const html = renderToString(createElement(ArtikelBody, {
    bloecke: bloecke as never, artikel: '41', passus: { absatz: null },
    zitierKontext: { artikelLabel: 'Art. 41', kuerzel: 'ASYLV 2' },
  } as never));
  const zitate = [...html.matchAll(/aria-label="([^"]+) — kopieren"/g)].map((m) => m[1]);
  it('weder sichtbares «[tab]» noch ein Zitierknopf damit', () => {
    expect(html).not.toContain('[tab]');
    expect(zitate.some((z) => z.includes('tab'))).toBe(false);
  });
  it('Formeltext bleibt sichtbar, lit. a behält seinen Zitierknopf', () => {
    expect(html).toContain('PB = (PE × DE) × JA/JT');
    expect(zitate).toContain('Art. 41 Abs. 1 lit. a ASYLV 2');
  });
});
