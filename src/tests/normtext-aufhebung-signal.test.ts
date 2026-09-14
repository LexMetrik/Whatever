/**
 * W2·27 — amtliches Aufhebungs-Signal statt Text-Heuristik.
 *
 * Die HTML-Ausschnitte sind WÖRTLICH aus den gepinnten Fedlex-Konsolidierungen
 * übernommen (Abruf 14.9.2026, scripts/fedlex-cache.sh):
 *   OR      cc/27/317_321_377 / 20260101, art_48
 *   ASYLG   cc/1999/358       / 20260612, art_52    (Absatz-Fussnoten)
 *   AVIG    cc/1982/2184…     / 20260101, art_115   (Änderungs-Artikel, NICHT aufgehoben)
 *   AIG     cc/2007/758       / 20260101, art_126_f (noch nicht in Kraft)
 *   STGB    cc/54/757_781_799 / 20260612, art_108   (amtlich leerer Slot)
 *
 * Diese fünf Fälle SEHEN FÜR DIE TEXT-HEURISTIK IDENTISCH AUS (leerer/«…»-Body).
 * Genau deshalb existiert das Signal — der Test bindet die Unterscheidung fest.
 */
import { describe, it, expect } from 'vitest';
import {
  artikelAmtlichAufgehoben,
  fussnoteHebtAuf,
  fussnotenTexte,
  kopfFragment,
  istPlatzhalter,
} from '../../scripts/normtext/aufhebung-signal.ts';
import { zuBasislinie, vergleiche, type Fund } from '../../scripts/normtext/check-leerstellen.ts';

// ── Klasse (a): leerer Body + Kopf-Fussnote mit Aufhebungs-Vermerk ────────────
const OR_ART_48 =
  '<a name="a48"></a><h6 class="heading" role="heading"><a href="#art_48"><b>Art. 48</b></a>' +
  '<sup><a href="#fn-d2095895e1829" id="fnbck-d2095895e1829">28</a></sup></h6>' +
  '<div class="collapseable"><div class="footnotes"><p id="fn-d2095895e1829">' +
  '<sup><a href="#fnbck-d2095895e1829">28</a></sup> Aufgehoben durch Art. 21 Abs. 1 des BG vom ' +
  '30. Sept. 1943 über den unlauteren Wettbewerb, mit Wirkung seit 1. März 1945 (BS <b>2</b> 951).' +
  '</p></div></div>';

// ── Klasse (c1): Änderungs-Artikel — «…» + Verweis-Fussnote, NICHT aufgehoben ──
const AVIG_ART_115 =
  '<a name="a115"></a><h6 class="heading" role="heading"><a href="#art_115"><b>Art. 115</b>' +
  ' Versicherungsvertragsgesetz</a></h6><div class="collapseable">' +
  '<p class="absatz man-space-before-4">…<sup><a href="#fn-d435159e15313" id="fnbck-d435159e15313">480</a></sup></p>' +
  '<div class="footnotes"><p id="fn-d435159e15313"><sup><a href="#fnbck-d435159e15313">480</a></sup>' +
  ' Die Änderung kann unter <a href="https://fedlex.data.admin.ch/eli/oc/1982/2184_2184_2184">AS ' +
  '<b>1982</b> 2184 </a>konsultiert werden.</p></div></div>';
const AVIG_ART_115_ABS =
  '<p class="absatz man-space-before-4">…<sup><a href="#fn-d435159e15313">480</a></sup></p>';

// ── Klasse (c2): noch nicht in Kraft — leerer Body, KEINE Aufhebung ───────────
const AIG_ART_126F =
  '<a name="a126f"></a><h6 class="heading" role="heading"><a href="#art_126_f"><b>Art. 126</b><i>f</i></a>' +
  '<sup><a href="#fn-d932736e23136" id="fnbck-d932736e23136">695</a></sup></h6>' +
  '<div class="collapseable"><div class="footnotes"><p id="fn-d932736e23136">' +
  '<sup><a href="#fnbck-d932736e23136">695</a></sup> Tritt zu einem späteren Zeitpunkt in Kraft ' +
  '(<a href="https://fedlex.data.admin.ch/eli/fga/2021/2999">BBl <b>2021</b> 2999</a>).</p></div></div>';

// ── Klasse (c3): amtlich leer aus Gesetzestechnik — NICHT aufgehoben ──────────
const STGB_ART_108 =
  '<a name="a108"></a><h6 class="heading" role="heading"><a href="#art_108"><b>Art. 108</b></a>' +
  '<sup><a href="#fn-x154" id="fnbck-x154">154</a></sup></h6><div class="collapseable">' +
  '<div class="footnotes"><p id="fn-x154"><sup><a href="#fnbck-x154">154</a></sup> Dieser Art. bleibt ' +
  'aus gesetzestechnischen Gründen leer. Berichtigt von der Redaktionskommission der BVers.</p></div></div>';

// ── Klasse (b): amtliche «…»-Platzhalter je ABSATZ, Vermerk an der Absatz-Fn ──
const ASYLG_ART_52_ABS1 =
  '<p class="absatz"><sup>1</sup>&nbsp;…<sup><a href="#fn-a" id="fnbck-a">182</a></sup></p>';
const ASYLG_ART_52_ABS2 =
  '<p class="absatz"><sup>2</sup>&nbsp;…<sup><a href="#fn-b" id="fnbck-b">183</a></sup></p>';
const ASYLG_ART_52 =
  '<a name="a52"></a><h6 class="heading" role="heading"><a href="#art_52"><b>Art.&nbsp;52</b></a></h6>' +
  `<div class="collapseable">${ASYLG_ART_52_ABS1}${ASYLG_ART_52_ABS2}` +
  '<div class="footnotes"><p id="fn-a"><sup>182</sup> Aufgehoben durch Ziff. I des BG vom 16. Dez. 2005, ' +
  'mit Wirkung seit 1. Jan. 2008 (AS <b>2006</b> 4745).</p>' +
  '<p id="fn-b"><sup>183</sup> Aufgehoben durch Ziff. I des BG vom 25. Sept. 2015, mit Wirkung seit ' +
  '1. März 2019 (AS <b>2016</b> 3101).</p></div></div>';

describe('artikelAmtlichAufgehoben — amtliches Signal (a)/(b)', () => {
  it('leerer Body + Kopf-Fussnote «Aufgehoben durch …» ⇒ aufgehoben (OR Art. 48)', () => {
    expect(artikelAmtlichAufgehoben(OR_ART_48, [{ text: '…' }], [null])).toBe(true);
  });

  it('amtliche «…»-Absätze mit je eigener Aufhebungs-Fussnote ⇒ aufgehoben (ASYLG Art. 52)', () => {
    expect(
      artikelAmtlichAufgehoben(
        ASYLG_ART_52,
        [{ text: '…' }, { text: '…' }],
        [ASYLG_ART_52_ABS1, ASYLG_ART_52_ABS2],
      ),
    ).toBe(true);
  });

  it('amtlicher Wortlaut «Aufgehoben» im Body ⇒ aufgehoben, auch ohne Fussnote', () => {
    expect(
      artikelAmtlichAufgehoben(
        '<div class="collapseable"><p>Aufgehoben</p></div>',
        [{ text: 'Aufgehoben' }],
        ['<p>Aufgehoben</p>'],
      ),
    ).toBe(true);
  });
});

describe('artikelAmtlichAufgehoben — kein Signal ⇒ KEIN Feld (§7, nichts fabrizieren)', () => {
  it('Änderungs-Artikel «…» + «Die Änderung kann unter AS … konsultiert werden» (AVIG Art. 115)', () => {
    expect(artikelAmtlichAufgehoben(AVIG_ART_115, [{ text: '…' }], [AVIG_ART_115_ABS])).toBe(false);
  });

  it('noch nicht in Kraft getretener Artikel (AIG Art. 126f)', () => {
    expect(artikelAmtlichAufgehoben(AIG_ART_126F, [{ text: '…' }], [null])).toBe(false);
  });

  it('amtlich leerer Slot «bleibt aus gesetzestechnischen Gründen leer» (StGB Art. 108)', () => {
    expect(artikelAmtlichAufgehoben(STGB_ART_108, [{ text: '…' }], [null])).toBe(false);
  });

  it('ein einziger LEBENDER Absatz macht den Artikel lebendig', () => {
    expect(
      artikelAmtlichAufgehoben(
        ASYLG_ART_52,
        [{ text: '…' }, { text: 'Der Bundesrat regelt das Verfahren.' }],
        [ASYLG_ART_52_ABS1, ASYLG_ART_52_ABS2],
      ),
    ).toBe(false);
  });

  it('Tabelle/Mehrspaltiges ist lebender Inhalt und schlägt das Signal', () => {
    expect(
      artikelAmtlichAufgehoben(OR_ART_48, [{ text: '…', mehrspaltig: { zeilen: [['a', 'b']] } }], [null]),
    ).toBe(false);
  });

  it('kein Block ⇒ nie aufgehoben', () => {
    expect(artikelAmtlichAufgehoben(OR_ART_48, [], [])).toBe(false);
  });
});

describe('Bausteine', () => {
  it('fussnoteHebtAuf erkennt nur echte Aufhebungs-Vermerke', () => {
    expect(
      fussnoteHebtAuf('Aufgehoben durch Ziff. I des BG vom 1. Jan. 2020, mit Wirkung seit 1. Jan. 2021 (AS 2020 1).'),
    ).toBe(true);
    expect(
      fussnoteHebtAuf('Eingefügt durch Ziff. I des BG vom 1. Jan. 2020, in Kraft seit 1. Jan. 2021 (AS 2020 1).'),
    ).toBe(false);
    expect(fussnoteHebtAuf('Die Änderung kann unter AS 1982 2184 konsultiert werden.')).toBe(false);
    expect(fussnoteHebtAuf('')).toBe(false);
  });

  it('fussnotenTexte liest den Apparat des Artikels, kopfFragment die Überschrift', () => {
    expect(fussnotenTexte(OR_ART_48).get('fn-d2095895e1829')).toMatch(/^Aufgehoben durch Art\. 21/);
    expect(kopfFragment(OR_ART_48)).toContain('#fn-d2095895e1829');
    // class="heading " (mit Leerzeichen) kommt in Fedlex real vor (AHVV art_4).
    expect(kopfFragment('<h6 class="heading " role="heading"><a href="#fn-z">1</a></h6>')).toContain('#fn-z');
  });

  it('istPlatzhalter trennt Platzhalter von Wortlaut', () => {
    expect(istPlatzhalter('…')).toBe(true);
    expect(istPlatzhalter('')).toBe(true);
    expect(istPlatzhalter('Aufgehoben')).toBe(true);
    expect(istPlatzhalter('1 und 2 Aufgehoben')).toBe(true); // Bereichs-Präfix (AVIG Art. 103–104)
    expect(istPlatzhalter('Der Bundesrat regelt das Verfahren.')).toBe(false);
  });
});

describe('check:leerstellen — Zuwachs-Riegel', () => {
  const funde: Fund[] = [
    { ebene: 'bund', key: 'OR', label: 'Art. 1' },
    { ebene: 'bund', key: 'OR', label: 'Art. 2' },
    { ebene: 'kanton', key: 'BS-100', label: '§ 1' },
  ];

  it('zuBasislinie zählt je Ebene und Erlass, sortiert', () => {
    expect(zuBasislinie(funde)).toEqual({ bund: { OR: 2 }, kanton: { 'BS-100': 1 } });
  });

  it('gleich viele Fälle ⇒ grün', () => {
    expect(vergleiche(zuBasislinie(funde), { bund: { OR: 2 }, kanton: { 'BS-100': 1 } }).rot).toEqual([]);
  });

  it('ZUWACHS in einem Erlass ⇒ rot, auch wenn die Summe gleich bleibt', () => {
    const ist = { bund: { OR: 1, KVG: 1 }, kanton: {} };
    const r = vergleiche(ist, { bund: { OR: 2 }, kanton: {} });
    expect(r.rot).toHaveLength(1);
    expect(r.rot[0]).toContain('bund/KVG');
    expect(r.summeIst).toBe(2);
  });

  it('Erlass ohne Basislinien-Eintrag ⇒ rot (keine Gratis-Amnestie für Neuzugänge)', () => {
    expect(vergleiche({ bund: { NEU: 1 }, kanton: {} }, { bund: {}, kanton: {} }).rot).toHaveLength(1);
  });

  it('Rückgang ⇒ grün, aber gemeldet', () => {
    const r = vergleiche({ bund: {}, kanton: {} }, { bund: { OR: 2 }, kanton: {} });
    expect(r.rot).toEqual([]);
    expect(r.rueckgang).toEqual(['bund/OR: 0 statt 2']);
  });
});
