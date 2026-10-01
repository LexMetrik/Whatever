/**
 * W2·27-BUND-FERTIG — Aufhebungs-Signal: drei amtliche Fussnoten-Formen, die bis 1.10.2026 durchrutschten
 * (Posten «aufhebung-signal.ts erkennt Fussnote «Diese aufgehobenen Art. …»» und «AsylG Art. 122 amtlich
 * gegenstandslos», Sammelposten «Nach #1183: Bund-Leerstellen offen 82»).
 *
 * Die Artikel-HTMLs unten sind WÖRTLICH (Byte für Byte, Abruf 1.10.2026) aus den gepinnten Fedlex-Konsolidierungen
 * (Filestore-HTML, Pins scripts/fedlex-cache.sh):
 *   StGB  cc/54/757_781_799 / 20260612 / html-4
 *         https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/54/757_781_799/20260612/de/html/fedlex-data-admin-ch-eli-cc-54-757_781_799-20260612-de-html-4.html
 *         art_201_212 «Diese aufgehobenen Art. werden (mit Ausnahme von Art. 211) ersetzt durch …» (Sammelfussnote)
 *         art_108     «Dieser Art. bleibt aus gesetzestechnischen Gründen leer.» (KEIN Aufhebungs-/Gegenstandslos-Vermerk)
 *   BKV   cc/1993/1363_1363_1363 / 20260101 / html (ohne Suffix)
 *         https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1993/1363_1363_1363/20260101/de/html/fedlex-data-admin-ch-eli-cc-1993-1363_1363_1363-20260101-de-html.html
 *         art_8       «Aufgehobn durch Ziff. I der V des EFD vom 16. April 2014 …» (amtlicher Tippfehler «Aufgehobn»)
 *   ASYLG cc/1999/358 / 20260612 / html (ohne Suffix)
 *         https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1999/358/20260612/de/html/fedlex-data-admin-ch-eli-cc-1999-358-20260612-de-html.html
 *         art_122     «AS 1998 1582 Ziff. III. Aufgrund der Annahme dieses BB in der Volksabstimmung vom 13. Juni 1999
 *                      ist dieser Art. gegenstandslos.» (Kopf-Fussnote, Artikel hat noch Wortlaut)
 *
 * Eng gefasst (§1/§7): jede Regel hat Negativ-Tests an den Nachbar-Formen, die NICHT gemeint sind.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  fussnoteHebtAuf,
  fussnoteGegenstandslos,
  fussnoteDiesenArtGegenstandslos,
  artikelAmtlichesSignal,
  artikelAmtlichAufgehoben,
  artikelTextMitAufhebung,
} from '../../scripts/normtext/aufhebung-signal.ts';
import { extrahiereArtikelAusAnker } from '../../scripts/normtext/extrahiere-fedlex.ts';
import { sammleLeerstellen } from '../../scripts/normtext/check-leerstellen.ts';

const STGB_ART_201_212 =
  "<article id=\"art_201_212\"><a name=\"a201\"></a><h6 class=\"heading\" role=\"heading\"><span class=\"display-icon\"></span><span class=\"external-link-icon\"></span><a href=\"#art_201_212\"><b>Art. 201–212</b></a><sup><a href=\"#fn-d817201e12664\" id=\"fnbck-d817201e12664\">291</a></sup></h6><div class=\"collapseable\"><div class=\"footnotes\"><p id=\"fn-d817201e12664\"><sup><a href=\"#fnbck-d817201e12664\">291</a></sup><sup></sup><sup> </sup>Diese aufgehobenen Art. werden (mit Ausnahme von Art. 211) ersetzt durch die  Artikel 195, 196, 197, 198, 199 (vgl. Kommentar der Botschaft Ziff. 23 –  <a href=\"https://fedlex.data.admin.ch/eli/fga/1985/2_1009_1021_901\" target=\"_blank\">BBl <b>1985</b> II 1009</a>). Art. 211 wird ersatzlos gestrichen.</p></div></div></article>";

const STGB_ART_108 =
  "<article id=\"art_108\"><a name=\"a108\"></a><h6 class=\"heading\" role=\"heading\"><span class=\"display-icon\"></span><span class=\"external-link-icon\"></span><a href=\"#art_108\"><b>Art. 108</b></a><sup><a href=\"#fn-d817201e7384\" id=\"fnbck-d817201e7384\">154</a></sup></h6><div class=\"collapseable\"><div class=\"footnotes\"><p id=\"fn-d817201e7384\"><sup><a href=\"#fnbck-d817201e7384\">154</a></sup><sup></sup> Dieser Art. bleibt aus gesetzestechnischen Gründen leer. Berichtigt von der Redaktionskommission der BVers (Art. 58 Abs. 1 ParlG – <a href=\"https://fedlex.data.admin.ch/vocabulary/legal-taxonomy/4991\" target=\"_blank\" data-rs-uri=\"https://fedlex.data.admin.ch/eli/cc/2003/510\" data-rs=\"171.10\" data-lang=\"de\">SR <b>171.10</b></a>).</p></div></div></article>";

const BKV_ART_8 =
  "<article id=\"art_8\"><a name=\"a8\"></a><h6 class=\"heading\" role=\"heading\"><span class=\"display-icon\"></span><span class=\"external-link-icon\"></span><a href=\"#art_8\"><b>Art.&nbsp;8</b></a><sup><a href=\"#fn-d16296e359\" id=\"fnbck-d16296e359\">13</a></sup></h6><div class=\"collapseable\"><div class=\"footnotes\"><p id=\"fn-d16296e359\"><sup><a href=\"#fnbck-d16296e359\">13</a></sup><sup></sup> Aufgehobn durch Ziff. I der V des EFD vom 16. April 2014, mit Wirkung seit  1. Jan. 2016 (<a href=\"https://fedlex.data.admin.ch/eli/oc/2014/241\" target=\"_blank\">AS <b>2014</b> 1109</a>).</p></div></div></article>";

const ASYLG_ART_122 =
  "<article id=\"art_122\"><a name=\"a122\"></a><h6 class=\"heading\" role=\"heading\"><span class=\"display-icon\"></span><span class=\"external-link-icon\"></span><a href=\"#art_122\"><b>Art. 122</b> Verhältnis zum Bundesbeschluss vom 26. Juni 1998</a><sup><a href=\"#fn-d508093e16530\" id=\"fnbck-d508093e16530\">478</a></sup><a href=\"#art_122\"> über dringliche Massnahmen im Asyl- und Ausländerbereich</a></h6><div class=\"collapseable\"><p class=\"absatz man-space-before-4\">Wird gegen den Bundesbeschluss vom 26. Juni 1998 über dringliche Massnahmen im Asyl- und Ausländerbereich das Referendum ergriffen und wird er in einer Volksabstimmung abgelehnt, so gelten die nachstehend aufgeführten Bestimmungen als gestrichen:</p><dl class=\"man-space-after-0\"><dt class=\"man-space-before-4\">a. </dt><dd class=\"man-space-before-4\">Artikel 8 Absatz 4 (Mitwirkungspflicht bei der Beschaffung von gültigen Reisepapieren);</dd><dt class=\"man-space-before-4\">b. </dt><dd class=\"man-space-before-4\">Artikel 32 Absatz 2 Buchstabe a (Nichteintreten bei Nichtabgabe von Reise-papieren oder Identitätsausweisen);</dd><dt class=\"man-space-before-4\">c. </dt><dd class=\"man-space-before-4\">Artikel 33 (Nichteintreten bei missbräuchlicher Nachreichung eines Gesuchs);</dd><dt class=\"man-space-before-4\">d. </dt><dd class=\"man-space-before-4\">Artikel 32 Absatz 2 Buchstabe b (Nichteintreten bei Identitätstäuschung); in diesem Fall wird der Inhalt von Artikel&nbsp;16 Absatz&nbsp;1 Buchstabe&nbsp;b in der Fassung gemäss Ziffer&nbsp;I des Bundesbeschlusses vom 22.&nbsp;Juni 1990<sup><a href=\"#fn-d508093e16569\" id=\"fnbck-d508093e16569\">479</a></sup> über das Asylverfahren anstelle der gestrichenen Bestimmung von Artikel 32 Absatz&nbsp;2 Buchstabe b eingefügt; und</dd><dt class=\"man-space-before-4\">e. </dt><dd class=\"man-space-before-4\">Artikel 45 Absatz 2 (Sofortiger Vollzug bei Nichteintretensentscheiden); in diesem Fall wird der Inhalt von Artikel&nbsp;17<i>a </i>Absatz&nbsp;2 in der Fassung gemäss Ziffer&nbsp;II des Bundesgesetzes vom 18.&nbsp;März 1994<sup><a href=\"#fn-d508093e16590\" id=\"fnbck-d508093e16590\">480</a></sup> über Zwangsmassnahmen im Ausländerrecht anstelle der gestrichenen Bestimmung von Artikel&nbsp;45 Absatz&nbsp;2 unter Anpassung der Artikelverweise eingefügt.</dd></dl><div class=\"footnotes\"><p id=\"fn-d508093e16530\"><sup><a href=\"#fnbck-d508093e16530\">478</a></sup><sup></sup> <a href=\"https://fedlex.data.admin.ch/eli/oc/1998/1582_1582_1582\" target=\"_blank\">AS <b>1998</b> 1582 </a>Ziff. III. Aufgrund der Annahme dieses BB in der Volksabstimmung vom 13. Juni 1999 ist dieser Art. gegenstandslos.</p><p id=\"fn-d508093e16569\"><sup><a href=\"#fnbck-d508093e16569\">479</a></sup><sup></sup> <a href=\"https://fedlex.data.admin.ch/eli/oc/1990/938_938_938\" target=\"_blank\">AS <b>1990</b> 938</a></p><p id=\"fn-d508093e16590\"><sup><a href=\"#fnbck-d508093e16590\">480</a></sup><sup></sup> <a href=\"https://fedlex.data.admin.ch/eli/oc/1995/146_146_146\" target=\"_blank\">AS <b>1995</b> 146 </a><i>151</i></p></div></div></article>";

// ── Fall 1: Sammelfussnote «Diese aufgehobenen Art. …» (StGB Art. 201–212) ─────────
describe('fussnoteHebtAuf — «Diese aufgehobenen Art. …» (Plural-Sammelvermerk)', () => {
  it('erkennt den amtlichen Wortlaut am Fussnoten-Anfang (StGB Art. 201–212)', () => {
    expect(
      fussnoteHebtAuf('Diese aufgehobenen Art. werden (mit Ausnahme von Art. 211) ersetzt durch die Artikel 195, 196, 197, 198, 199. Art. 211 wird ersatzlos gestrichen.'),
    ).toBe(true);
    expect(fussnoteHebtAuf('Diese aufgehobenen Artikel werden ersetzt durch Art. 5.')).toBe(true);
  });

  it('erkennt NICHT: Singular «Dieser Art. bleibt … leer» (StGB Art. 108), Mitte-Satz-Zitat, andere Verben', () => {
    expect(fussnoteHebtAuf('Dieser Art. bleibt aus gesetzestechnischen Gründen leer. Berichtigt von der Redaktionskommission der BVers.')).toBe(false);
    expect(fussnoteHebtAuf('Vgl. die Botschaft: Diese aufgehobenen Art. werden ersetzt.')).toBe(false); // nicht am Anfang
    expect(fussnoteHebtAuf('Diese aufgehobenen Artikelnummern bleiben frei.')).toBe(false); // Wortgrenze: «Artikelnummern»
    expect(fussnoteHebtAuf('Diese Art. sind aufgehoben.')).toBe(false);
  });

  it('StGB Art. 201–212 (echtes Fedlex-HTML): leerer «…»-Body + Kopf-Fussnote ⇒ aufgehoben', () => {
    expect(artikelAmtlichesSignal(STGB_ART_201_212, [{ text: '…' }], [null])).toBe('aufgehoben');
    expect(artikelAmtlichAufgehoben(STGB_ART_201_212, [{ text: '…' }], [null])).toBe(true);
    const r = extrahiereArtikelAusAnker(STGB_ART_201_212, 'art_201_212');
    expect(r?.aufgehoben).toBe(true);
    expect(r?.gegenstandslos).toBeUndefined();
    expect(r?.bloecke).toEqual([{ absatz: null, text: '…' }]);
  });

  it('lebender Absatz schlägt die Sammelfussnote (§1: lieber nicht markieren als falsch)', () => {
    expect(artikelAmtlichesSignal(STGB_ART_201_212, [{ text: 'Wer das tut, wird bestraft.' }], ['x'])).toBeNull();
  });
});

// ── Fall 1b: amtlicher Tippfehler «Aufgehobn durch …» (BKV Art. 8) ─────────────
describe('fussnoteHebtAuf — «Aufgehobn durch …» (amtlicher Fedlex-Tippfehler, BKV Art. 8)', () => {
  it('erkennt exakt «Aufgehobn durch» am Fussnoten-Anfang', () => {
    expect(fussnoteHebtAuf('Aufgehobn durch Ziff. I der V des EFD vom 16. April 2014, mit Wirkung seit  1. Jan. 2016 (AS 2014 1109).')).toBe(true);
  });

  it('erkennt NICHT: andere Wortverstümmelungen, Mitte-Satz', () => {
    expect(fussnoteHebtAuf('Aufgehobene Vorschrift durch den BR.')).toBe(false);
    expect(fussnoteHebtAuf('Aufgehobnes Recht gemäss Art. 5.')).toBe(false);
    expect(fussnoteHebtAuf('Vgl. Aufgehobn durch Art. 5.')).toBe(false);
  });

  it('BKV Art. 8 (echtes Fedlex-HTML): leerer Body ⇒ aufgehoben, Wortlaut «…» bleibt', () => {
    const r = extrahiereArtikelAusAnker(BKV_ART_8, 'art_8');
    expect(r?.aufgehoben).toBe(true);
    expect(r?.gegenstandslos).toBeUndefined();
    expect(r?.bloecke).toEqual([{ absatz: null, text: '…' }]);
  });
});

// ── StGB Art. 108: bewusst KEIN Signal ─────────────────────────────────────────
describe('StGB Art. 108 — «bleibt aus gesetzestechnischen Gründen leer» bekommt KEIN Feld (§7/§8)', () => {
  it('weder aufgehoben noch gegenstandslos: der Artikel wurde amtlich weder aufgehoben noch ist er gegenstandslos', () => {
    expect(artikelAmtlichesSignal(STGB_ART_108, [{ text: '…' }], [null])).toBeNull();
    const r = extrahiereArtikelAusAnker(STGB_ART_108, 'art_108');
    expect(r?.aufgehoben).toBeUndefined();
    expect(r?.gegenstandslos).toBeUndefined();
  });
});

// ── Fall 2: «ist dieser Art. gegenstandslos» (AsylG Art. 122) ──────────────────
describe('fussnoteDiesenArtGegenstandslos — «… ist dieser Art. gegenstandslos» (Fussnote beginnt mit AS-Zitat)', () => {
  const FN_ASYLG_122 =
    'AS 1998 1582 Ziff. III. Aufgrund der Annahme dieses BB in der Volksabstimmung vom 13. Juni 1999 ist dieser Art. gegenstandslos.';

  it('erkennt den amtlichen Wortlaut (AsylG Art. 122)', () => {
    expect(fussnoteDiesenArtGegenstandslos(FN_ASYLG_122)).toBe(true);
    expect(fussnoteDiesenArtGegenstandslos('Aufgrund des BRB ist dieser Artikel gegenstandslos.')).toBe(true);
  });

  it('erkennt NICHT: andere Artikel/Teile als Gegenstand, Adjektiv, Absatz-Skopus, Meta-Notizen', () => {
    expect(fussnoteDiesenArtGegenstandslos('Art. 61 Abs. 2 Bst. b ist heute gegenstandslos. Stundungsverfahren sind seit 2004 im BankG geregelt.')).toBe(false); // GebV SchKG 61
    expect(fussnoteDiesenArtGegenstandslos('Dritter Satz gegenstandslos (AS 2021 673 Ziff. II).')).toBe(false); // VSTG 36a
    expect(fussnoteDiesenArtGegenstandslos('Gegenstandslose UeB.')).toBe(false); // KOV 99 / VZG 135
    expect(fussnoteDiesenArtGegenstandslos('Gegenstandslos. Siehe Art. 75 Abs. 5 des Finanzinstitutsgesetzes.')).toBe(false); // FINMAG 15: Absatz-Form, eigener Posten
    expect(fussnoteDiesenArtGegenstandslos('AS 1998 1582 Ziff. III. Art. 5 ist gegenstandslos.')).toBe(false); // ein ANDERER Artikel
    expect(fussnoteDiesenArtGegenstandslos('Im italienischen Text besteht dieser Art. aus einem einzigen Abs.')).toBe(false); // KOV 4
    expect(fussnoteDiesenArtGegenstandslos('Dieser Art. ist aufgehoben (AS 2016 1249).')).toBe(false);
    expect(fussnoteDiesenArtGegenstandslos('ist dieser Art. gegenstandslosen Rechts.')).toBe(false); // Wortgrenze
    expect(fussnoteDiesenArtGegenstandslos('')).toBe(false);
  });

  it('die #1183-Anfangs-Regel bleibt unberührt: fussnoteGegenstandslos(Mitte-Satz) ist weiter false', () => {
    expect(fussnoteGegenstandslos(FN_ASYLG_122)).toBe(false);
  });

  it('AsylG Art. 122 (echtes Fedlex-HTML, Wortlaut vorhanden): Kopf-Fussnote ⇒ gegenstandslos, NIE aufgehoben', () => {
    const r = extrahiereArtikelAusAnker(ASYLG_ART_122, 'art_122');
    expect(r?.gegenstandslos).toBe(true);
    expect(r?.aufgehoben).toBeUndefined();
    expect(r?.bloecke[0].items?.length).toBe(5); // der amtliche Wortlaut (lit. a–e) bleibt erhalten (§5/§7)
    expect(r?.bloecke[0].text).toMatch(/^Wird gegen den Bundesbeschluss vom 26\. Juni 1998/);
  });

  it('artikelTextMitAufhebung setzt für Art. 122 `gegenstandslos`, lässt bloecke unberührt', () => {
    const r = extrahiereArtikelAusAnker(ASYLG_ART_122, 'art_122')!;
    const out = artikelTextMitAufhebung(ASYLG_ART_122, { bloecke: r.bloecke, quellen: r.bloecke.map(() => null as string | null) });
    expect(out.gegenstandslos).toBe(true);
    expect('aufgehoben' in out).toBe(false);
    expect(out.bloecke).toBe(r.bloecke);
  });

  it('NUR am Artikel-KOPF: dieselbe Fussnote an einem ABSATZ-Marker eines lebenden Artikels setzt nichts', () => {
    const absatzLokal =
      '<article id="art_9"><h6 class="heading"><a href="#art_9"><b>Art. 9</b></a></h6><div class="collapseable">' +
      '<p class="absatz"><sup>1</sup> Wer X tut, haftet.<sup><a href="#fn-q" id="fnbck-q">1</a></sup></p>' +
      '<div class="footnotes"><p id="fn-q"><sup>1</sup> AS 1998 1582 Ziff. III. Aufgrund der Annahme dieses BB ist dieser Art. gegenstandslos.</p></div></div></article>';
    expect(artikelAmtlichesSignal(absatzLokal, [{ text: 'Wer X tut, haftet.' }], ['<p class="absatz"><sup>1</sup> Wer X tut, haftet.<sup><a href="#fn-q">1</a></sup></p>'])).toBeNull();
  });

  it('Tabelle im Artikel schlägt den Kopf-Vermerk (lebender Inhalt, §1)', () => {
    expect(artikelAmtlichesSignal(ASYLG_ART_122, [{ text: 'x', tabelle: [{}] }], ['x'])).toBeNull();
  });

  it('ein Kopf-Vermerk «Aufgehoben durch» NEBEN «ist dieser Art. gegenstandslos» ist widersprüchlich ⇒ kein Signal', () => {
    const gemischt = ASYLG_ART_122.replace(
      /(<p id="fn-d508093e16530">[\s\S]*?)(<\/p>)/,
      '$1 Aufgehoben durch Ziff. I des BG vom 1. Jan. 2020, mit Wirkung seit 1. Jan. 2021 (AS 2020 1).$2',
    );
    expect(gemischt).not.toBe(ASYLG_ART_122);
    expect(artikelAmtlichesSignal(gemischt, [{ text: 'Wird gegen den Bundesbeschluss …' }], ['x'])).toBeNull();
  });
});

// ── Snapshot-Beleg (generierte Artefakte, byte-genau per Generator) ────────────
describe('Snapshots public/normtext/bund — die vier Fälle nach der Regeneration', () => {
  const lade = (erlass: string) =>
    (JSON.parse(readFileSync(join(process.cwd(), 'public/normtext/bund', `${erlass}.json`), 'utf8')) as {
      eintraege: Array<{ artikelLabel: string; aufgehoben?: true; gegenstandslos?: true }>;
    }).eintraege;

  it('StGB Art. 201–212 ⇒ aufgehoben; Art. 108 ⇒ kein Feld', () => {
    const stgb = lade('STGB');
    const a = stgb.find((e) => e.artikelLabel === 'Art. 201–212');
    const b = stgb.find((e) => e.artikelLabel === 'Art. 108');
    expect(a?.aufgehoben).toBe(true);
    expect(a?.gegenstandslos).toBeUndefined();
    expect(b).toBeDefined();
    expect(b?.aufgehoben).toBeUndefined();
    expect(b?.gegenstandslos).toBeUndefined();
  });

  it('BKV Art. 8 ⇒ aufgehoben; AsylG Art. 122 ⇒ gegenstandslos', () => {
    const bkv = lade('BKV').find((e) => e.artikelLabel === 'Art. 8');
    const asyl = lade('ASYLG').find((e) => e.artikelLabel === 'Art. 122');
    expect(bkv?.aufgehoben).toBe(true);
    expect(asyl?.gegenstandslos).toBe(true);
    expect(asyl?.aufgehoben).toBeUndefined();
  });

  it('Leerstellen-Wächter: StGB 201–212 und BKV 8 sind keine ungeklärten Leerstellen mehr, StGB 108 bleibt eine', () => {
    const funde = sammleLeerstellen(process.cwd(), 'bund');
    const hat = (key: string, label: string) => funde.some((f) => f.key === key && f.label === label);
    expect(hat('STGB', 'Art. 201–212')).toBe(false);
    expect(hat('BKV', 'Art. 8')).toBe(false);
    expect(hat('STGB', 'Art. 108')).toBe(true);
  });
});
