// W2·27-BUND-FERTIG, Nachzug Gegenprüfung 3.10.2026 (A1/A2) — Zitatkette über marke-lose Zeilen und deren Absicherung.
//
// A1 (§1/§8): Ein markiertes Kind unter einer MARKE-LOSEN Zeile mit eigener Unterliste erbte vorher das Geschwister
// DAVOR als Eltern («lit. b Ziff. 1»), weil die marke-lose Zeile in der Kette übersprungen wurde, ohne ihre Ebene zu
// verbrauchen. Jetzt bricht die Kette am marke-losen Vorfahren ab: kein Zitat ist besser als ein falsches.
// A2/m9: die <b>-Weiche in bloeckeHtml (seo-detail.ts) — ein marke-loses Item bekommt kein leeres <b></b>.
// A2/m5: der `erste`-Ausschluss in stufenFuer — eine führende marke-lose Zeile darf die Umkehr-Erkennung nicht verdecken.
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { parseDefinitionsListe } from '../../scripts/normtext/fedlex/listen.ts';
import { itemZitatSegmente, stufenFuer } from '../components/normtext/ArtikelBody.helfer';
import { erlassVolltextHtml } from '../lib/seo-detail';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { NormSnapshotDatei } from '../lib/normtext/typen';

type Item = { marke: string; text: string; tiefe?: number };
const alle = (items: Item[]): string[][] => items.map((_, j) => itemZitatSegmente(items as never, stufenFuer(items), j));

describe('A1: Zitatkette bricht an einem marke-losen Vorfahren ab (Repro Gegenprüfung 3.10.2026)', () => {
  // Marke-lose Leitzeile IN DER MITTE, mit eigener Unterliste (aus dem echten Parser, nicht von Hand gebaut).
  const mitte = parseDefinitionsListe(
    '<dt>a.</dt><dd>erstes;</dd><dt>b.</dt><dd>zweites;</dd><dt></dt><dd>Leitzeile:<dl><dt>1.</dt><dd>Kind eins;</dd></dl></dd>',
  ) as Item[];
  // Marke-lose Leitzeile AM ANFANG der Liste.
  const anfang = parseDefinitionsListe(
    '<dt></dt><dd>Leitzeile:<dl><dt>1.</dt><dd>Kind eins;</dd></dl></dd><dt>a.</dt><dd>erstes;</dd>',
  ) as Item[];

  it('Parser-Vorbedingung: die Leitzeile steht als marke-loses Item, das Kind darunter eine Stufe tiefer', () => {
    expect(mitte.map((i) => [i.marke, i.tiefe ?? 0])).toEqual([['a', 0], ['b', 0], ['', 0], ['1', 1]]);
    expect(anfang.map((i) => [i.marke, i.tiefe ?? 0])).toEqual([['', 0], ['1', 1], ['a', 0]]);
  });

  it('Mitte: das Kind «1» bekommt KEIN Zitat (vorher fälschlich «lit. b Ziff. 1»)', () => {
    expect(alle(mitte)[3]).toEqual([]);
  });

  it('Anfang: das Kind «1» bekommt KEIN Zitat (vorher verkürzt «Ziff. 1» ohne Eltern-Glied)', () => {
    expect(alle(anfang)[1]).toEqual([]);
  });

  it('die markierten Geschwister ausserhalb der marke-losen Zeile bleiben unverändert', () => {
    expect(alle(mitte).slice(0, 2)).toEqual([['lit. a'], ['lit. b']]);
    expect(alle(anfang)[2]).toEqual(['lit. a']);
  });

  it('eine marke-lose Zeile selbst trägt nie ein Zitat', () => {
    expect(alle(mitte)[2]).toEqual([]);
    expect(alle(anfang)[0]).toEqual([]);
  });

  it('Gegenprobe: marke-loses GESCHWISTER (gleiche Ebene wie das Kind) ist kein Vorfahre — Kette bleibt vollständig', () => {
    const items: Item[] = [
      { marke: 'a', text: 'x', tiefe: 0 },
      { marke: '', text: 'Zeile', tiefe: 1 },
      { marke: '1', text: 'y', tiefe: 1 },
    ];
    expect(alle(items)[2]).toEqual(['lit. a', 'Ziff. 1']);
  });

  it('Mit vorKette (Anhang-Fortsetzung): der Abbruch gilt auch über die verschmolzene Liste', () => {
    const vor: Item[] = [{ marke: 'a', text: 'x', tiefe: 0 }, { marke: '', text: 'Leitzeile', tiefe: 0 }];
    const hier: Item[] = [{ marke: '1', text: 'y', tiefe: 1 }];
    expect(itemZitatSegmente(hier as never, stufenFuer(hier), 0, vor as never)).toEqual([]);
  });
});

describe('A1: Darstellung — das Kind unter einer marke-losen Zeile trägt keinen Zitierknopf, die Geschwister davor behalten ihn', () => {
  const bloecke = [{ absatz: '1', text: 'Es gilt:', items: [
    { marke: 'a', text: 'erstes;', tiefe: 0 }, { marke: 'b', text: 'zweites;', tiefe: 0 },
    { marke: '', text: 'Leitzeile:', tiefe: 0 }, { marke: '1', text: 'Kind eins;', tiefe: 1 },
  ] }];
  const html = renderToString(createElement(ArtikelBody, {
    bloecke: bloecke as never, artikel: '9', passus: { absatz: null },
    zitierKontext: { artikelLabel: 'Art. 9', kuerzel: 'TEST' },
  } as never));
  const zitate = [...html.matchAll(/aria-label="([^"]+) — kopieren"/g)].map((m) => m[1]);
  it('kein Zitierknopf «… Ziff. 1 …»; «lit. a»/«lit. b» bleiben', () => {
    expect(zitate.filter((z) => /Ziff\. 1/.test(z))).toEqual([]);
    expect(zitate).toContain('Art. 9 Abs. 1 lit. a TEST');
    expect(zitate).toContain('Art. 9 Abs. 1 lit. b TEST');
    // Item-Knöpfe sind genau zwei (a, b): kein Rest-Knopf mit leerem Segment («Art. 9 Abs. 1  TEST», zwei Leerzeichen)
    // für das Kind, auch keiner für die marke-lose Zeile.
    expect(zitate.filter((z) => /Abs\. 1 (lit\.|\s)/.test(z))).toHaveLength(2);
  });
  it('der Text des Kindes bleibt sichtbar (nur das Zitat entfällt)', () => {
    expect(html).toContain('Kind eins;');
  });
});

describe('A2/m9:Volltext-HTML — marke-loses Item ohne leeres <b></b>, markiertes Item unverändert', () => {
  const erlass = { key: 'TEST', kuerzel: 'TEST', titel: 'Testerlass', sr: '1', stand: '2026-10-03', quelleUrl: 'https://www.fedlex.admin.ch/', rechtsgebiet: 'verfahren', ebene: 'bund' } as unknown as BrowseErlass;
  const datei = {
    eintraege: [{
      id: 'x', artikel: '1', artikelLabel: 'Art. 1',
      bloecke: [{ absatz: '1', text: 'Es gilt:', items: [{ marke: '', text: 'Leitzeile' }, { marke: 'a', text: 'Punkt a' }] }],
    }],
  } as unknown as NormSnapshotDatei;
  const html = erlassVolltextHtml(erlass, datei);

  it('kein leeres <b></b> und kein führendes Leerzeichen vor dem Text der marke-losen Zeile', () => {
    expect(html).not.toContain('<b></b>');
    expect(html).toContain('<li>Leitzeile</li>');
  });
  it('das markierte Item behält <b>a</b> + Leerzeichen + Text', () => {
    expect(html).toContain('<li><b>a</b> Punkt a</li>');
  });
});

describe('A2/m5: stufenFuer — `erste` überspringt marke-lose Zeilen (ohne tiefe)', () => {
  // Kantonales Muster «1. a. b.» (Ziff. aussen, lit. innen). Eine VORANGESTELLTE marke-lose Zeile darf die
  // Erkennung nicht kippen: ohne den Ausschluss wäre `erste` = 'leer', ziffAussen = false, und die Liste fiele
  // in die Bund-Ordnung zurück (lit. = Stufe 0, Ziff. 1 vor lit. = Stufe 0) — a./b. stünden NICHT unter der 1.
  it('«(leer) 1. a. b.»:die lit. stehen unter der Ziff. (Stufen 0,0,1,1) — dieselben Stufen wie ohne Leerzeile', () => {
    const mit = [{ marke: '' }, { marke: '1' }, { marke: 'a' }, { marke: 'b' }];
    const ohne = [{ marke: '1' }, { marke: 'a' }, { marke: 'b' }];
    expect(stufenFuer(ohne)).toEqual([0, 1, 1]);
    expect(stufenFuer(mit)).toEqual([0, 0, 1, 1]);
  });
});
