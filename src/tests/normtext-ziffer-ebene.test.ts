// HN-05-Auflage (W2·27-BUND-FERTIG P6): Ziffer-Ebene adressierbar. Fixtures =
// Original-Markup der amtlichen Fedlex-Konsolidierung (BV cc/1999/404 20240303
// Art. 197; StGB cc/54/757_781_799 20261001 Art. 139/140), auf das Wesentliche gekürzt.
import { describe, expect, it } from 'vitest';
import { extrahiereArtikel } from '../../scripts/normtext/extrahiere-fedlex';

const art = (id: string, body: string): string =>
  `<html><body><article id="${id}"><a name="a${id.slice(4)}"></a><h6 class="heading" role="heading"><a href="#${id}"><b>Art. ${id.slice(4)}</b></a></h6>` +
  `<div class="collapseable">${body}</div></article></body></html>`;

const UTIT = 'class="man-template-tab-utit-kurs tab-utit9pt-kurs man-font-style-italic man-space-before-6"';
const fn = (n: number): string => `<sup><a href="#fn-x${n}" id="fnbck-x${n}">${n}</a></sup>`;

const bv197 =
  `<p ${UTIT}>1.&nbsp;&nbsp;Beitritt der Schweiz zur UNO</p>` +
  `<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;Die Schweiz tritt der Organisation der Vereinten Nationen bei.</p>` +
  `<p class="absatz man-space-before-4"><sup>2</sup>&nbsp;Der Bundesrat wird ermächtigt, ein Gesuch zu richten.</p>` +
  `<p ${UTIT}>2.<span class="man-font-style-normal">${fn(162)}</span> Übergangsbestimmung zu Art. 62 (Schulwesen)</p>` +
  `<p class="absatz man-space-before-4">Die Kantone übernehmen die Leistungen der Invalidenversicherung.</p>` +
  `<p ${UTIT}>6.<span class="man-font-style-normal">${fn(172)}</span></p>` +
  `<p ${UTIT}>9.${fn(175)} Übergangsbestimmungen zu Art. 75b (Zweitwohnungen)</p>` +
  `<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;Tritt die Gesetzgebung nicht in Kraft, erlässt der Bundesrat Verordnungen.</p>` +
  `<p class="absatz man-space-before-4"><sup>2</sup>&nbsp;Baubewilligungen sind nichtig.</p>`;

describe('Ziffer-Ebene (A): Überschrift-Ziffern — BV Art. 197', () => {
  const b = extrahiereArtikel(art('art_197', bv197), '197')!.bloecke;

  it('jede Ziffer-Überschrift wird ein titel-Block mit ziffer (vorher stumm verworfen)', () => {
    const titel = b.filter((x) => x.titel !== undefined);
    expect(titel.map((x) => [x.ziffer, x.text])).toEqual([
      ['1', '1. Beitritt der Schweiz zur UNO'],
      ['2', '2. Übergangsbestimmung zu Art. 62 (Schulwesen)'],
      ['6', '6.'],
      ['9', '9. Übergangsbestimmungen zu Art. 75b (Zweitwohnungen)'],
    ]);
  });

  it('die Folge-Blöcke tragen die Ziffer ihrer Überschrift; die Absatznummern bleiben je Ziffer erhalten', () => {
    const inhalt = b.filter((x) => x.titel === undefined).map((x) => [x.ziffer, x.absatz]);
    expect(inhalt).toEqual([['1', '1'], ['1', '2'], ['2', null], ['9', '1'], ['9', '2']]);
  });

  it('Fussnoten-Ziffern leaken nicht in den Überschrift-Text', () => {
    expect(b.some((x) => /16\d|17\d/.test(x.text))).toBe(false);
  });
});

describe('Ziffer-Ebene (B): Absatz-Ziffern — StGB Art. 139/140', () => {
  const stgb139 =
    `<p class="absatz man-space-before-4">1.&nbsp;&nbsp;Wer jemandem eine fremde bewegliche Sache zur Aneignung wegnimmt, wird bestraft.</p>` +
    `<p class="absatz man-space-before-4">2.&nbsp;&nbsp;…${fn(198)}</p>` +
    `<p class="absatz man-space-before-4">3.&nbsp;&nbsp;Der Dieb wird bestraft, wenn er:</p>` +
    `<dl class="man-space-after-0"><dt>a. </dt><dd>gewerbsmässig stiehlt;</dd><dt>b. </dt><dd>als Mitglied einer Bande handelt.</dd></dl>` +
    `<p class="absatz man-space-before-4">4.&nbsp;&nbsp;Der Diebstahl zum Nachteil eines Angehörigen wird nur auf Antrag verfolgt.</p>` +
    `<p class="absatz man-space-before-4">Wer, auf frischer Tat ertappt, Nötigungshandlungen verübt, wird gleich bestraft.</p>`;
  const b = extrahiereArtikel(art('art_139', stgb139), '139')!.bloecke;

  it('Ziffer je Block; die Folgeblöcke (Aufzählung, unnummerierter Absatz) erben sie', () => {
    expect(b.map((x) => x.ziffer)).toEqual(['1', '2', '3', '4', '4']);
  });

  it('Text bleibt VERBATIM (kein Strip) und items hängen am Ziffer-Block', () => {
    expect(b[0].text).toBe('1. Wer jemandem eine fremde bewegliche Sache zur Aneignung wegnimmt, wird bestraft.');
    expect(b[0].absatz).toBeNull();
    expect(b[2].items!.map((i) => i.marke)).toEqual(['a', 'b']);
  });

  it('Fussnote NACH der Ziffer («3.<fn>&nbsp;&nbsp;Die») erkennt die Ziffer; die Fussnoten-Zahl leakt nicht', () => {
    const t = extrahiereArtikel(art('art_9', `<p class="absatz">3.${fn(2)}&nbsp;&nbsp;Die Vertragsparteien kommen überein.</p>`), '9')!.bloecke;
    expect(t[0].ziffer).toBe('3');
    expect(t[0].text).toBe('3. Die Vertragsparteien kommen überein.');
  });
});

describe('Ziffer-Ebene: Negativfälle — keine geratene Adresse (§1)', () => {
  const ziffern = (body: string): Array<string | undefined> => extrahiereArtikel(art('art_5', body), '5')!.bloecke.map((x) => x.ziffer);

  it('gewöhnliche <sup>-Absätze tragen keine ziffer', () => {
    expect(ziffern(`<p class="absatz"><sup>1</sup>&nbsp;Erster.</p><p class="absatz"><sup>2</sup>&nbsp;Zweiter.</p>`)).toEqual([undefined, undefined]);
  });

  it('Tagesdatum am Absatzanfang («1. Januar …», einfaches Leerzeichen/nbsp) ist keine Ziffer', () => {
    expect(ziffern(`<p class="absatz">1. Januar 2027 tritt dieses Gesetz in Kraft.</p>`)).toEqual([undefined]);
    expect(ziffern(`<p class="absatz">1.&nbsp;Januar 2027 tritt dieses Gesetz in Kraft.</p>`)).toEqual([undefined]);
  });

  it('Tagesdatum mit Monatsname/-kürzel bleibt auch bei einfachem nbsp keine Ziffer (B4-Schutz)', () => {
    expect(ziffern(`<p class="absatz">1.&nbsp;Jan. 2027 tritt in Kraft.</p>`)).toEqual([undefined]);
    expect(ziffern(`<p class="absatz">1.&nbsp;September 2027 tritt in Kraft.</p>`)).toEqual([undefined]);
    expect(ziffern(`<p class="absatz">2.&nbsp;2027 tritt in Kraft.</p>`)).toEqual([undefined]);
  });

  it('unnummerierter Zwischentitel und Dezimalnummer («331.1») bleiben unverändert verworfen', () => {
    const b = extrahiereArtikel(art('art_5', `<p ${UTIT}>Dritte Klasse</p><p ${UTIT}>331.1</p><p class="absatz"><sup>1</sup>&nbsp;Text.</p>`), '5')!.bloecke;
    expect(b).toEqual([{ absatz: '1', text: 'Text.' }]);
  });

  it('Überschrift-Ziffern gewinnen: ein verschachteltes «1.»-Absatz darunter überschreibt die Ziffer nicht', () => {
    const b = extrahiereArtikel(
      art('art_5', `<p ${UTIT}>7.&nbsp;&nbsp;Gentechnik</p><p class="absatz">1.&nbsp;&nbsp;Erste Regel.</p><p class="absatz">2.&nbsp;&nbsp;Zweite Regel.</p>`),
      '5',
    )!.bloecke;
    expect(b.map((x) => x.ziffer)).toEqual(['7', '7', '7']);
  });

  it('Blöcke vor der ersten Ziffer bleiben ohne ziffer', () => {
    const b = extrahiereArtikel(art('art_5', `<p class="absatz">Einleitung.</p><p class="absatz">1.&nbsp;&nbsp;Erste.</p>`), '5')!.bloecke;
    expect(b.map((x) => x.ziffer)).toEqual([undefined, '1']);
  });
});

// Befund-Runde Gegenprüfung #1251 (B1/B2/B4): amtliche Markup-Formen am gepinnten Fedlex-HTML
// (StGB 20261001 Art. 187/165/305bis; MStG Art. 73/122/131/177; VZV Art. 145; SSV Art. 116).
describe('Ziffer-Ebene: «Nbis»-Ziffern (B1) — StGB Art. 187/305bis, MStG Art. 73', () => {
  const stgb187 =
    `<p class="absatz man-space-before-4">1.&nbsp;&nbsp;Wer mit einem Kind unter 16 Jahren eine sexuelle Handlung vornimmt,</p>` +
    `<p class="absatz man-space-before-4">wird mit Freiheitsstrafe bis zu fünf Jahren oder Geldstrafe bestraft.</p>` +
    `<p class="absatz man-space-before-4">1<sup>bis</sup>.&nbsp;&nbsp;Hat das Kind das 12. Altersjahr noch nicht erreicht, so ist die Strafe höher.</p>` +
    `<p class="absatz man-space-before-4">2.&nbsp;&nbsp;Die Handlung ist nicht strafbar, wenn der Altersunterschied nicht mehr als drei Jahre beträgt.</p>`;

  it('«1bis.»-Absatz trägt ziffer «1bis» (nicht «1»); Folgeblock «2.» weiter korrekt', () => {
    const b = extrahiereArtikel(art('art_187', stgb187), '187')!.bloecke;
    expect(b.map((x) => x.ziffer)).toEqual(['1', '1', '1bis', '2']);
    expect(b[2].text.startsWith('1bis. Hat das Kind')).toBe(true);
  });

  it('EIN nbsp hinter «1bis.» (StGB 305bis) genügt — die Suffix-Signatur ist datumsfrei eindeutig', () => {
    const b = extrahiereArtikel(art('art_305_bis',
      `<p class="absatz">1.&nbsp;&nbsp;Wer eine Handlung vornimmt.</p><p class="absatz">1<sup>bis</sup>.&nbsp;Als qualifiziertes Steuervergehen gelten Handlungen.</p><p class="absatz">2.&nbsp;&nbsp;In schweren Fällen Freiheitsstrafe.</p>`), '305_bis')!.bloecke;
    expect(b.map((x) => x.ziffer)).toEqual(['1', '1bis', '2']);
  });

  it('«ter»-Suffix und Fussnote hinter dem Punkt werden erkannt', () => {
    const b = extrahiereArtikel(art('art_5',
      `<p class="absatz">2<sup>ter</sup>.${fn(7)}&nbsp;&nbsp;Dritter Absatz.</p>`), '5')!.bloecke;
    expect(b[0].ziffer).toBe('2ter');
  });

  it('gewöhnlicher <sup>bis</sup>-Absatz ohne Punkt («2bis Text») ist keine Ziffer', () => {
    const b = extrahiereArtikel(art('art_5', `<p class="absatz"><sup>2bis</sup>&nbsp;Text.</p><p class="absatz">2<sup>bis</sup>&nbsp;Text.</p>`), '5')!.bloecke;
    expect(b.map((x) => x.ziffer)).toEqual([undefined, undefined]);
  });
});

describe('Ziffer-Ebene: Sammel-Ziffern (B2) — Konvention «a_b» wie art_77_78', () => {
  const ziffern = (body: string): Array<string | undefined> => extrahiereArtikel(art('art_5', body), '5')!.bloecke.map((x) => x.ziffer);

  it('«2. und 3. …» (MStG 122, Fussnote hinter dem Ellipsis) ist EINE Sammel-Ziffer «2_3», erbt nicht die Ziffer 1', () => {
    expect(ziffern(
      `<p class="absatz">1.&nbsp;&nbsp;Wer vorsätzlich handelt, wird bestraft.</p><p class="absatz">In leichten Fällen erfolgt Disziplinarstrafe.</p>` +
      `<p class="absatz">2. und 3.&nbsp;&nbsp;…${fn(9)}</p>`)).toEqual(['1', '1', '2_3']);
  });

  it('«2.&nbsp;&nbsp;und 3.&nbsp;&nbsp;…» (MStG 131) — beide nbsp-Formen', () => {
    expect(ziffern(`<p class="absatz">1.&nbsp;&nbsp;Wer stiehlt.</p><p class="absatz">2.&nbsp;&nbsp;und 3.&nbsp;&nbsp;…${fn(9)}</p><p class="absatz">4.&nbsp;&nbsp;Der Dieb.</p>`))
      .toEqual(['1', '2_3', '4']);
  });

  it('«1.–2.<fn>&nbsp;&nbsp;…» (VZV 145): Bereich mit Fussnote vor dem Ellipsis', () => {
    expect(ziffern(`<p class="absatz">1.–2.${fn(411)}&nbsp;&nbsp;…</p><p class="absatz">3.&nbsp;&nbsp;Wer ohne Ausweis fährt.</p>`)).toEqual(['1_2', '3']);
  });

  it('«2. und 3. …» ohne nbsp (SSV 116): ebenfalls Sammel-Ziffer', () => {
    expect(ziffern(`<p class="absatz">1.&nbsp;Die Verordnung wird aufgehoben.</p><p class="absatz">2. und 3. …${fn(9)}</p>`)).toEqual(['1', '2_3']);
  });

  it('«N. und M.» OHNE Ellipsis (Fliesstext/Datum) ist keine Sammel-Ziffer', () => {
    expect(ziffern(`<p class="absatz">1. und 2. Januar 2027 gelten als Feiertage.</p>`)).toEqual([undefined]);
  });
});

describe('Ziffer-Ebene: einfaches nbsp (B4) — MStG Art. 177 Ziff. 1', () => {
  it('«1.&nbsp;Wer …» (ein nbsp, kein Monatsname) ist Ziffer 1; «2.&nbsp;&nbsp;» folgt', () => {
    const b = extrahiereArtikel(art('art_177',
      `<p class="absatz">1.&nbsp;Wer mit Gewalt einen Arrestanten befreit, wird bestraft.${fn(352)}&nbsp;</p><p class="absatz">2.&nbsp;&nbsp;Wird die Tat von einem Haufen begangen, so wird bestraft.</p>`), '177')!.bloecke;
    expect(b.map((x) => x.ziffer)).toEqual(['1', '2']);
  });
});
