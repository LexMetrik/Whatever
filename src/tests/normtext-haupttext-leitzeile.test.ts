// W2·27-BUND-FERTIG, Nebenfund P4 (HOCH, 2./3.10.2026): im HAUPTTEXT ging eine marke-lose <dd>-Zeile am ANFANG einer
// (Unter-)Liste stumm verloren — parseDefinitionsListe hängt eine marke-lose Zeile nur an ein VORGÄNGER-Item an; ohne
// Vorgänger (erste Zeile der Liste) wurde sie verworfen, und mit ihr jede weitere marke-lose Zeile hinter ihr (18 Zeilen in
// 7 Artikeln: ARGV1 art_30, VBB art_10, ERV art_51/52, MSTP art_119, EBG art_6, PATV art_97). Neu: die Zeile steht als
// Item `marke: ''` an ihrer Stelle (Tiefe wie ihre Liste), keine Marke fabriziert (§1/§7).
//
// Fixtures: WÖRTLICH aus den gepinnten Fedlex-Filestore-HTMLs (abgerufen 2.10.2026), nur class-Attribute und Nachbar-Items
// gekürzt — ARGV1 SR 822.111 art_30 Abs. 3, VBB SR 281.52 art_10, ERV SR 952.03 art_51, EBG SR 742.101 art_6 Abs. 6.
import { describe, it, expect } from 'vitest';
import { extrahiereArtikel } from '../../scripts/normtext/extrahiere-fedlex.ts';

const art = (token: string, koerper: string): string =>
  `<html><body><article id="art_${token}"><a name="a${token}"></a><h6 class="heading" role="heading"><a href="#art_${token}"><b>Art. ${token}</b> Titel</a></h6><div class="collapseable">` +
  koerper +
  `<div class="footnotes"><p id="fn-x"><sup><a href="#fnbck-x">26</a></sup> Fassung gemäss Ziff. I der V.</p></div></div></article></body></html>`;
const bloecke = (token: string, koerper: string) => extrahiereArtikel(art(token, koerper), token)!.bloecke;
const itemsVon = (token: string, koerper: string) => bloecke(token, koerper).flatMap((b) => b.items ?? []);
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

// ARGV1 art_30 Abs. 3: lit. a trägt eine Unterliste, deren Zeilen KEINE <dt>-Marke haben («1.  in fünf …» steht im <dd>).
const ARGV1_30_ABS3 =
  '<p class="absatz man-space-before-4"><sup>3</sup>&nbsp;Arbeitnehmer und Arbeitnehmerinnen in Nachtarbeit nach Absatz 2 dürfen:</p>' +
  '<dl class="man-space-after-0"><dt class="man-space-before-4 man-space-before-2">a. </dt><dd class="man-space-before-4 man-space-before-2">höchstens eingesetzt werden:' +
  '<dl class="man-space-after-0"><dt class="man-space-before-2"></dt><dd class="man-space-before-2">1.  in fünf von sieben aufeinander folgenden Nächten; oder</dd>' +
  '<dt class="man-space-before-2"></dt><dd class="man-space-before-2">2.  in sechs von neun aufeinander folgenden Nächten; und</dd></dl></dd>' +
  '<dt class="man-space-before-4">b. </dt><dd class="man-space-before-4">an ihren freien Tagen keine Überzeitarbeit nach Artikel 25 leisten.</dd></dl>' +
  '<p class="absatz man-space-before-4"><sup>4</sup>&nbsp;Auf Arbeitnehmer und Arbeitnehmerinnen, die höchstens für eine Randstunde dauernd Nachtarbeit leisten, sind die Voraussetzungen nicht anwendbar.</p>';

// VBB art_10: Legende «Es bedeuten:» — sechs Zeilen, ALLE ohne <dt>-Marke (Liste beginnt marke-los).
const VBB_10_LEGENDE =
  '<p class="absatz man-space-before-4">Es bedeuten:</p>' +
  '<dl class="man-space-after-0"><dt class="man-space-before-4 man-text-align-left"></dt><dd class="man-space-before-4 man-text-align-left">DB  = Durchführung mit voller Befriedigung.</dd>' +
  '<dt class="man-space-before-4 man-text-align-left"></dt><dd class="man-space-before-4 man-text-align-left">DV  = Durchführung mit gänzlichem oder teilweisem Verlust.</dd>' +
  '<dt class="man-space-before-4 man-text-align-left"></dt><dd class="man-space-before-4 man-text-align-left">Z = Erlöschen durch Zahlung des Schuldners an das Betreibungsamt.</dd>' +
  '<dt class="man-space-before-4 man-text-align-left"></dt><dd class="man-space-before-4 man-text-align-left">E = Erlöschen aus andern Gründen (Abstellung durch den Gläubiger <br>oder Verjährung).</dd>' +
  '<dt class="man-space-before-4 man-text-align-left"></dt><dd class="man-space-before-4 man-text-align-left">T = Teilnahme weiterer Gläubiger an der Pfändung und zwar:<br>TB mit voller Befriedigung.<br>TV mit gänzlichem oder teilweisem Verlust</dd>' +
  '<dt class="man-space-before-4 man-text-align-left"></dt><dd class="man-space-before-4 man-text-align-left">K = Konkurs.</dd></dl>';

// ERV art_51 Abs. 1: erste Zeile marke-los, danach markierte Zeilen («+», «./.»).
const ERV_51_ABS1 =
  '<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;Die Nettopositionen werden wie folgt berechnet:</p>' +
  '<dl class="man-space-after-0"><dt class="man-space-before-4"></dt><dd class="man-space-before-4">physischer Bestand zuzüglich Titelforderungen aus <i>Securities Lending</i> abzüglich Titelverpflichtungen aus <i>Securities Borrowing</i></dd>' +
  '<dt class="man-space-before-4">+ </dt><dd class="man-space-before-4">nicht erfüllte Kassa- und Terminkäufe (einschliesslich <i>Financial Futures</i> und <i>Swaps</i>)</dd>' +
  '<dt class="man-space-before-4">./. </dt><dd class="man-space-before-4">nicht erfüllte Kassa- und Terminverkäufe (einschliesslich <i>Financial Futures</i> und <i>Swaps</i>)</dd></dl>';

// EBG art_6 Abs. 6: beide Zeilen marke-los (CSS-Autonummerierung «auto-num»), die zweite trägt eine Fussnote.
const EBG_6_ABS6 =
  '<p class="absatz man-space-before-4"><sup>6</sup>&nbsp;Das Eidgenössische Departement für Umwelt, Verkehr, Energie und Kommunikation (UVEK) ist zuständig für:</p>' +
  '<dl class="man-space-after-0"><dt class="man-space-before-4 auto-num"></dt><dd class="man-space-before-4 auto-num">die Änderung der Konzession, mit Ausnahme der Ausdehnung;</dd>' +
  '<dt class="man-space-before-4 auto-num"></dt><dd class="man-space-before-4 auto-num">die Erneuerung der Konzession.<sup><a href="#fn-x" id="fnbck-x">26</a></sup></dd></dl>';

describe('Haupttext: marke-lose Zeile am Anfang einer Liste bleibt an ihrer Stelle (Nebenfund P4)', () => {
  it('ARGV1 art_30 Abs. 3: die zwei Zeilen unter lit. a stehen als zwei SEPARATE Items der Tiefe 1, vor lit. b', () => {
    const it = itemsVon('30', ARGV1_30_ABS3);
    expect(it.map((i) => [i.marke, i.tiefe ?? 0])).toEqual([['a', 0], ['', 1], ['', 1], ['b', 0]]);
    expect(norm(it[1].text)).toBe('1. in fünf von sieben aufeinander folgenden Nächten; oder');
    expect(norm(it[2].text)).toBe('2. in sechs von neun aufeinander folgenden Nächten; und');
    // keine fabrizierte Marke, nichts verschmolzen: lit. a behält seinen eigenen Text
    expect(it[0].text).toBe('höchstens eingesetzt werden:');
    expect(it[3].text).toBe('an ihren freien Tagen keine Überzeitarbeit nach Artikel 25 leisten.');
  });

  it('VBB art_10: alle sechs Legenden-Zeilen erhalten, in Quellreihenfolge, je ein Item (vorher 0 von 6)', () => {
    const it = itemsVon('10', VBB_10_LEGENDE);
    expect(it).toHaveLength(6);
    expect(it.every((i) => i.marke === '' && i.tiefe === undefined)).toBe(true);
    expect(it.map((i) => norm(i.text).split(' ')[0])).toEqual(['DB', 'DV', 'Z', 'E', 'T', 'K']);
    expect(norm(it[4].text)).toContain('TB mit voller Befriedigung.');
    expect(norm(it[4].text)).toContain('TV mit gänzlichem oder teilweisem Verlust');
  });

  it('ERV art_51: die erste Zeile steht VOR den markierten Zeilen («+», «./.»), nicht verworfen', () => {
    const it = itemsVon('51', ERV_51_ABS1);
    expect(it).toHaveLength(3);
    expect(it[0].marke).toBe(''); // die markierten Zeilen dahinter bleiben, wie sie waren («+»)
    expect(it[1].marke).toBe('+');
    expect(it[0].text).toMatch(/^physischer Bestand zuzüglich Titelforderungen aus Securities Lending/);
  });

  it('EBG art_6 Abs. 6: beide Zeilen erhalten; die Fussnoten-Ziffer leakt nicht in den Text', () => {
    const it = itemsVon('6', EBG_6_ABS6);
    expect(it.map((i) => [i.marke, i.text])).toEqual([
      ['', 'die Änderung der Konzession, mit Ausnahme der Ausdehnung;'],
      ['', 'die Erneuerung der Konzession.'],
    ]);
  });

  it('Drop/Leak: jede Quell-Zeile genau einmal im Output (ARGV1 + VBB)', () => {
    for (const [token, html, satz] of [
      ['30', ARGV1_30_ABS3, 'in fünf von sieben aufeinander folgenden Nächten'],
      ['30', ARGV1_30_ABS3, 'in sechs von neun aufeinander folgenden Nächten'],
      ['10', VBB_10_LEGENDE, 'Durchführung mit voller Befriedigung'],
      ['10', VBB_10_LEGENDE, 'Erlöschen durch Zahlung des Schuldners'],
      ['10', VBB_10_LEGENDE, 'K = Konkurs.'],
    ] as const) {
      const out = norm(JSON.stringify(bloecke(token, html)));
      expect(out.split(satz).length - 1).toBe(1);
    }
  });
});

describe('Haupttext: unveränderte Fälle (byte-gleich) — Fortsetzungszeile hinter einem Item hängt weiter an ihm', () => {
  it('SSV-Muster «<dt>a.</dt><dd>Label:</dd><dt></dt><dd>Beschreibung</dd>»: EIN Item, Text angehängt', () => {
    const it = itemsVon(
      '24',
      '<p class="absatz"><sup>1</sup>&nbsp;Es gelten:</p><dl><dt>a. </dt><dd>Haltesignal:</dd><dt></dt><dd>Beschreibung des Haltesignals.</dd><dt>b. </dt><dd>Fahrsignal.</dd></dl>',
    );
    expect(it.map((i) => [i.marke, i.text])).toEqual([
      ['a', 'Haltesignal: Beschreibung des Haltesignals.'],
      ['b', 'Fahrsignal.'],
    ]);
  });

  it('eine marke-lose Zeile hinter einer marke-losen Leitzeile hängt NICHT an ihr (zwei Items, nicht verschmolzen)', () => {
    const it = itemsVon('7', '<p class="absatz"><sup>1</sup>&nbsp;Es gilt:</p><dl><dt></dt><dd>erste Zeile</dd><dt></dt><dd>zweite Zeile</dd><dt>a. </dt><dd>Punkt a</dd></dl>');
    expect(it.map((i) => [i.marke, i.text])).toEqual([['', 'erste Zeile'], ['', 'zweite Zeile'], ['a', 'Punkt a']]);
  });

  it('leeres <dt>/<dd>-Paar bleibt wirkungslos (kein leeres Item)', () => {
    const it = itemsVon('8', '<p class="absatz"><sup>1</sup>&nbsp;Es gilt:</p><dl><dt></dt><dd></dd><dt>a. </dt><dd>Punkt a</dd></dl>');
    expect(it.map((i) => [i.marke, i.text])).toEqual([['a', 'Punkt a']]);
  });
});
