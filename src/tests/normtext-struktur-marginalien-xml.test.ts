/**
 * Randtitel aus dem amtlichen XML (`fedlex:role="marginal"`) statt aus dem HTML —
 * Posten «Struktur-Extraktor liest Randtitel aus HTML statt aus fedlex:role=marginal»
 * (W2·27-BUND-FERTIG P9). Fixtures sind gekürzte ECHT-Auszüge aus den konsolidierten
 * Fedlex-XMLs (Stand 1.10.2026, je Fall mit Erlass genannt); Messung über alle 231
 * Bund-Pins: 25 190 Token, 25 055 byte-gleich zum HTML-Weg, 135 Änderungen in 28 Erlassen
 * (alle unten als Fall belegt), 0 Token nur auf einer Seite.
 *
 * KEIN NETZ.
 */
import { describe, it, expect } from 'vitest';
import {
  extrahiereMarginalienXml,
  waehleRandtitel,
  ueberlagereMarginalien,
} from '../../scripts/normtext/struktur-marginalien-xml';
import { xmlCacheGueltig, xmlStandFuerPin } from '../../scripts/normtext/fedlex-xml-cache';
import type { FedlexCacheEintrag } from '../../scripts/normtext/inventar-bund';

const art = (eId: string, nr: string, inner = ''): string =>
  `<article eId="${eId}"><num><b>Art. ${nr}</b></num>${inner}<paragraph eId="${eId}/para"><content><p>Text</p></content></paragraph></article>`;

describe('extrahiereMarginalienXml — Randtitel-Kette', () => {
  it('OR-Manier: verschachtelte `level role=marginal` ⇒ Kette aussen→innen, Gliederung (chapter) zählt nicht', () => {
    const xml =
      '<body><part eId="part_1"><num>Erste Abteilung: </num><heading>Allgemeine Bestimmungen</heading>' +
      '<chapter eId="part_1/chap_1"><num>Erster Abschnitt: </num><heading>Die Entstehung durch Vertrag</heading>' +
      '<level eId="part_1/chap_1/lvl_A" fedlex:role="marginal"><num>A. </num><heading>Abschluss des Vertrages</heading>' +
      '<level eId="part_1/chap_1/lvl_A/lvl_I" fedlex:role="marginal"><num>I. </num><heading>Übereinstimmende Willensäusserung</heading>' +
      art('art_1', '1') + '</level></level></chapter></part></body>';
    expect(extrahiereMarginalienXml(xml)['1']).toEqual(['A. Abschluss des Vertrages', 'I. Übereinstimmende Willensäusserung']);
  });

  it('Randtitel gilt nur bis zur innersten Gliederungsebene (SVG «Grundregel» umschliesst Abschnitte)', () => {
    const xml =
      '<body><title eId="tit_3"><num>III. Titel: </num><heading>Haftung</heading>' +
      '<level eId="tit_3/lvl_u1" fedlex:role="marginal"><heading>Grundregel</heading>' +
      art('art_26', '26') +
      '<chapter eId="tit_3/lvl_u1/chap_1"><num>1. Abschnitt: </num><heading>Besondere</heading>' + art('art_27', '27') + '</chapter>' +
      '</level></title></body>';
    const r = extrahiereMarginalienXml(xml);
    expect(r['26']).toEqual(['Grundregel']);
    expect(r['27']).toEqual([]); // erbt «Grundregel» NICHT (Test normtext-struktur-randtitel-container)
  });

  it('reine Nummer ohne Titel («4.») ist ein Glied der Kette (MStG Art. 9)', () => {
    const xml =
      '<body><level eId="lvl_4" fedlex:role="marginal"><num>4. </num>' +
      '<level eId="lvl_4/lvl_a" fedlex:role="marginal"><num>a. </num><heading>Jugendstrafrecht</heading>' + art('art_9', '9') + '</level></level></body>';
    expect(extrahiereMarginalienXml(xml)['9']).toEqual(['4.', 'a. Jugendstrafrecht']);
  });

  it('Container-Tag `book` mit role=marginal zählt (KOV Art. 16)', () => {
    const xml = '<body><book eId="book_1" fedlex:role="marginal"><num><b>1</b>. </num><heading>Kassabuch</heading>' + art('art_16', '16') + '</book></body>';
    expect(extrahiereMarginalienXml(xml)['16']).toEqual(['1. Kassabuch']);
  });

  it('Fussnoten-Apparat (authorialNote) in der Überschrift fällt weg', () => {
    const xml =
      '<body><level eId="lvl_A" fedlex:role="marginal"><num>A. </num><heading>Titel<inline name="x"><authorialNote><p>Eingefügt AS <b>2021</b> 400</p></authorialNote></inline></heading>' +
      art('art_1', '1') + '</level></body>';
    expect(extrahiereMarginalienXml(xml)['1']).toEqual(['A. Titel']);
  });

  it('Artikel-eigenes <heading> = Sachtitel (BV/ZPO-Manier), nur ohne Randtitel-Kette', () => {
    const xml =
      '<body>' + art('art_5', '5', '<heading>Grundsätze rechtsstaatlichen Handelns</heading>') +
      '<level eId="lvl_A" fedlex:role="marginal"><heading>Kette</heading>' + art('art_6', '6', '<heading>Nicht dazu</heading>') + '</level></body>';
    const r = extrahiereMarginalienXml(xml);
    expect(r['5']).toEqual(['Grundsätze rechtsstaatlichen Handelns']);
    expect(r['6']).toEqual(['Kette']);
  });

  it('Sachtitel: führendes <sup> (KKV «tredecies») weg, inneres <sup> (RPV «Abs. 1bis») bleibt Text', () => {
    const xml =
      '<body>' + art('art_126_z', '126z', '<heading><sup>tredecies</sup>Wesentliche Mängel</heading>') +
      art('art_34_a', '34a', '<heading>Biomasse (Art. 16a Abs. 1<sup>bis</sup> RPG)</heading>') + '</body>';
    const r = extrahiereMarginalienXml(xml);
    expect(r['126_z']).toEqual(['Wesentliche Mängel']);
    expect(r['34_a']).toEqual(['Biomasse (Art. 16a Abs. 1bis RPG)']);
  });

  it('Sachtitel: «Art. …»-Nummernrest und Platzhalter sind kein Titel; «Art der Berichte» schon (KKV-FINMA Art. 113)', () => {
    const xml =
      '<body><article eId="art_228_232"><heading><b>Art. 228</b>─<b>232</b></heading><paragraph eId="x"><content><p>Aufgehoben</p></content></paragraph></article>' +
      art('art_113', '113', '<heading>Art der Berichte</heading>') + '</body>';
    const r = extrahiereMarginalienXml(xml);
    expect(r['228_232']).toEqual([]);
    expect(r['113']).toEqual(['Art der Berichte']);
  });

  it('kein Randtitel-Leck auf Folgeartikel (NHG: «Zweck» steht nur an Art. 1, XML-Rolle zeigt Art. 2 = «Erfüllung von Bundesaufgaben»)', () => {
    const xml =
      '<body>' + art('art_1', '1', '<heading>Zweck</heading>') +
      '<level eId="lvl_u1" fedlex:role="marginal"><heading>Erfüllung von Bundesaufgaben</heading>' + art('art_2', '2') + '</level></body>';
    const r = extrahiereMarginalienXml(xml);
    expect(r['1']).toEqual(['Zweck']);
    expect(r['2']).toEqual(['Erfüllung von Bundesaufgaben']);
  });

  it('Doppel-eId (KKV art_126_z zweimal) ⇒ zweites Vorkommen bekommt den Synthese-Suffix __2 wie im HTML-Pfad', () => {
    const xml = '<body>' + art('art_126_z', '126z', '<heading>Erster</heading>') + art('art_126_z', '126z', '<heading>Zweiter</heading>') + '</body>';
    const r = extrahiereMarginalienXml(xml);
    expect(Object.keys(r)).toHaveLength(2);
    expect(r['126_z']).toEqual(['Erster']);
    expect(r['126_z__2']).toEqual(['Zweiter']);
  });

  it('Schlusstitel-Artikel (`disp_uN/art_*`) bekommen ihren Token; Artikel in Anhang-Dokumenten (`annex/…`) nicht', () => {
    const xml = '<body>' + art('disp_u2/art_1', '1') + '</body><attachments>' + art('annex/art_9', '9') + '</attachments>';
    expect(Object.keys(extrahiereMarginalienXml(xml))).toEqual([expect.stringContaining('disp')]);
  });
});

describe('waehleRandtitel — HTML-Typografie, XML-Inhalt', () => {
  it('XML verliert Leerraum (Fedlex-`<b> </b>`) ⇒ HTML-Schreibweise (ZGB Art. 905, ARGV 2 Art. 48)', () => {
    expect(waehleRandtitel(['II. Vertretung verpfändeter Aktien und Stammanteile'], ['II. Vertretung verpfändeter Aktienund Stammanteile']))
      .toEqual(['II. Vertretung verpfändeter Aktien und Stammanteile']);
    // Zusammenspiel mit der Entstrichelung: XML «Bau- undUnterhalts…» → «BauundUnterhalts…»
    expect(waehleRandtitel(['Bau- und Unterhaltsbetriebe'], ['BauundUnterhaltsbetriebe'])).toEqual(['Bau- und Unterhaltsbetriebe']);
  });

  it('Inhalt weicht ab (Ordinal-Suffix, Nummernrest, Leck) ⇒ XML (UVG «Artikel 1a», GSCHV «a Gewässerraum»)', () => {
    expect(waehleRandtitel(['… nach Artikel 1 Absatz 1'], ['… nach Artikel 1a Absatz 1'])).toEqual(['… nach Artikel 1a Absatz 1']);
    expect(waehleRandtitel(['a Gewässerraum'], ['Gewässerraum'])).toEqual(['Gewässerraum']);
    expect(waehleRandtitel(['Zweck', 'Erfüllung'], ['Erfüllung'])).toEqual(['Erfüllung']);
    expect(waehleRandtitel([], ['Zusätzliche Eigenmittel'])).toEqual(['Zusätzliche Eigenmittel']);
  });

  it('Glied für Glied: ein Glied mit Leerraum-Verlust, das andere mit echtem Inhalts-Unterschied', () => {
    expect(waehleRandtitel(['A. Aktien und', '1. Art 18'], ['A. Aktienund', '1. Art 18bis'])).toEqual(['A. Aktien und', '1. Art 18bis']);
  });

  it('ueberlagereMarginalien: nur bekannte Token, Gliederung/übrige Felder unberührt', () => {
    const struktur: Record<string, { marginalie: string[]; gliederung?: string[] }> = {
      '1': { marginalie: ['alt'], gliederung: ['g'] },
      anhang_a: { marginalie: [] },
    };
    ueberlagereMarginalien(struktur, { '1': ['neu'], unbekannt: ['x'] });
    expect(struktur['1']).toEqual({ marginalie: ['neu'], gliederung: ['g'] });
    expect(struktur.anhang_a).toEqual({ marginalie: [] });
    expect(struktur.unbekannt).toBeUndefined();
  });
});

describe('fedlex-xml-cache — Pin-Gültigkeit', () => {
  const pin: FedlexCacheEintrag = { name: 'or', eli: 'cc/27/317_321_377', konsolidierung: '20261001', htmlN: 2, anker: [] };
  const pins = new Map([['or', pin]]);
  const dateien = (inhalt: Record<string, string>) => ({
    vorhanden: (p: string) => p in inhalt,
    lies: (p: string) => inhalt[p],
  });

  it('gültig nur mit Datei UND passendem Pin-Marker', () => {
    const ok = dateien({ '/tmp/or.xml': '<x/>', '/tmp/or.xml.pin': 'cc/27/317_321_377|20261001' });
    expect(xmlCacheGueltig('OR', pins, ok.vorhanden, ok.lies)).toBe(true);
  });

  it('Re-Pin (anderer Stand im Marker), fehlender Marker oder fehlende Datei ⇒ ungültig', () => {
    const alt = dateien({ '/tmp/or.xml': '<x/>', '/tmp/or.xml.pin': 'cc/27/317_321_377|20260701' });
    expect(xmlCacheGueltig('OR', pins, alt.vorhanden, alt.lies)).toBe(false);
    const ohneMarker = dateien({ '/tmp/or.xml': '<x/>' });
    expect(xmlCacheGueltig('OR', pins, ohneMarker.vorhanden, ohneMarker.lies)).toBe(false);
    expect(xmlCacheGueltig('OR', pins, () => false, () => '')).toBe(false);
    expect(xmlCacheGueltig('UNBEKANNT', pins, () => true, () => '')).toBe(false);
  });

  it('xmlStandFuerPin wählt den Stand mit dem Konsolidierungsdatum, sonst null', () => {
    const staende = [
      { datum: '2026-07-01', xmlUrl: 'https://x/alt.xml' },
      { datum: '2026-10-01', xmlUrl: 'https://x/neu.xml' },
    ];
    expect(xmlStandFuerPin(staende, '20261001')?.xmlUrl).toBe('https://x/neu.xml');
    expect(xmlStandFuerPin(staende, '20260301')).toBeNull();
  });
});
