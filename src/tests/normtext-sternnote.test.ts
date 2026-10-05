// Regression W2·27-BUND-FERTIG (Fedlex-Frische-Lauf 36838192603, 1.10.2026): VRV-Sternchen-Verweisnoten.
// Fedlex zeichnete die redaktionellen Sternchen-Noten der VRV («* Vgl. Art. 18.») in der Konsolidierung
// 20260701 als <p class="man-template-tab-krpr …"> aus, in 20261001 als <p class="absatz8pt …">. Die
// Klasse «absatz8pt» trifft keine Extraktor-Alternative (\babsatz\b scheitert an «absatz8pt») → die
// Noten fielen stumm aus dem Snapshot; check:segmente (Modus C) meldete 7 NEUE fehlende Segmente.
// Fixtures = Original-Markup der amtlichen VRV (cc/1962/1364_1409_1420, 20260701 html-8 / 20261001).
import { describe, expect, it } from 'vitest';
import { extrahiereArtikel } from '../../scripts/normtext/extrahiere-fedlex';

const art = (id: string, nach: string): string =>
  `<html><body><article id="${id}"><a name="a${id.slice(4)}"></a><h6 class="heading" role="heading"><a href="#${id}"><b>Art. ${id.slice(4)}</b><b></b> <b></b>Parkieren im allgemeinen</a></h6><div class="collapseable">` +
  `<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;Parkieren ist das Abstellen des Fahrzeugs.</p>` +
  `<p class="absatz man-space-before-4"><sup>4</sup>&nbsp;Es ist platzsparend zu parkieren.</p>${nach}` +
  `<div class="footnotes"><p id="fn-x"><sup><a href="#fnbck-x">105</a></sup> Fassung gemäss Ziff. I der V.</p></div></div></article></body></html>`;

const texte = (html: string, token: string): string[] => extrahiereArtikel(html, token)!.bloecke.map((b) => b.text);

describe('VRV-Sternchen-Verweisnoten (absatz8pt)', () => {
  it('neues Markup (absatz8pt, nacktes «*») wird als eigener Textblock übernommen — wie bisher mit krpr', () => {
    const t = texte(art('art_19', '<p class="absatz8pt man-space-before-3">* Vgl. Art. 18.</p>'), '19');
    expect(t.at(-1)).toBe('* Vgl. Art. 18.');
    expect(extrahiereArtikel(art('art_19', '<p class="absatz8pt man-space-before-3">* Vgl. Art. 18.</p>'), '19')!.bloecke.at(-1)!.absatz).toBeNull();
  });

  it('Sternchen als <sup>*</sup> (mit und ohne zweites <sup> </sup>) wird übernommen', () => {
    expect(texte(art('art_1', '<p class="absatz8pt man-space-before-3"><sup>*</sup> Vgl. z.B. die Art. 6 Abs. 1 und 2, 47 Abs. 2.</p>'), '1').at(-1)).toBe(
      '* Vgl. z.B. die Art. 6 Abs. 1 und 2, 47 Abs. 2.',
    );
    expect(texte(art('art_10', '<p class="absatz8pt man-space-before-3"><sup>*</sup><sup> </sup>Für die Zeichengebung vgl. Art. 28.</p>'), '10').at(-1)).toBe(
      '* Für die Zeichengebung vgl. Art. 28.',
    );
  });

  it('«Note aufgehoben»-Variante (* + Auslassungszeichen + Fussnoten-Marker) bleibt wie bisher «* …» (Marker-Ziffer leakt nicht)', () => {
    const t = texte(art('art_38', '<p class="absatz8pt man-space-before-3">*<sup> </sup>…<sup><a href="#fn-x" id="fnbck-x">155</a></sup></p>'), '38');
    expect(t.at(-1)).toBe('* …');
  });

  it('Verhaltensgleichheit alt/neu: gleicher Inhalt in krpr-Auszeichnung (20260701) und absatz8pt (20261001) liefert identische Blöcke', () => {
    const alt = extrahiereArtikel(art('art_24', '<p class="man-template-tab-krpr man-space-before-3">* Vgl. auch Art. 52 Abs. 4.</p>'), '24')!.bloecke;
    const neu = extrahiereArtikel(art('art_24', '<p class="absatz8pt man-space-before-3">* Vgl. auch Art. 52 Abs. 4.</p>'), '24')!.bloecke;
    expect(neu).toEqual(alt);
  });

  it('Reihenfolge: die Note steht NACH den Absätzen (Dokumentreihenfolge)', () => {
    const t = texte(art('art_19', '<p class="absatz8pt man-space-before-3">* Vgl. Art. 18.</p>'), '19');
    expect(t).toEqual(['Parkieren ist das Abstellen des Fahrzeugs.', 'Es ist platzsparend zu parkieren.', '* Vgl. Art. 18.']);
  });

  it('GRENZE: absatz8pt OHNE führendes Sternchen (Kleindruck, z.B. Inkrafttreten-Datumslisten) bleibt unverändert NICHT übernommen (deferiert, check:p-klassen)', () => {
    const t = texte(art('art_19', '<p class="absatz8pt man-space-before-3">Art. 5 Abs. 2 tritt am 1. Januar 2027 in Kraft.</p>'), '19');
    expect(t).toEqual(['Parkieren ist das Abstellen des Fahrzeugs.', 'Es ist platzsparend zu parkieren.']);
  });

  // NT-01 (HN-05, 5.10.2026): absatz09pt gehört seither zur Absatz-Familie (Alt 1, fedlex/absatz-nr.ts) und wird
  // als Absatz-Text übernommen — die Grenze der Stern-Regel zeigt jetzt «absatz10pt» (in keinem Pin vorhanden).
  it('GRENZE: ein Stern in einer ANDEREN, nicht erfassten Klasse (absatz10pt) löst die Alternative nicht aus', () => {
    const t = texte(art('art_19', '<p class="absatz10pt">* Kleindruck-Hinweis ausserhalb des Geltungsbereichs dieser Regel.</p>'), '19');
    expect(t).toHaveLength(2);
  });
});
