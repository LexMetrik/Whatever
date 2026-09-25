/**
 * scripts/normtext/segmente-logik.test.ts — Vitest, In-Memory-Fixtures.
 *
 * Deckt die Fallgruppen aus der Bau-Spec (§ Architektur Ziff. 8) ab: die vier
 * bekannten Extraktor-Blindstellen (normtext-treue-01/-02/-03/-10), die
 * Fussnoten-Marke, NBSP/Hochstellung, ein veralteter Basislinien-Eintrag —
 * sowie den NACHTRAG-Unit-Test «Rolling-Hash-Enthaltensein ≡ String-
 * Enthaltensein» inkl. der drei explizit geforderten Randfälle.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  alleAnhangEids,
  dispTextAusserhalbArtikel,
  alleArtikelEids,
  ankerIdVonEid,
  fehlendeIndizes,
  fingerabdruck,
  gleicheBasislinieAb,
  normalisiere,
  parseErlassHtml,
  projektionsBlob,
  klassiereSollAenderung,
  pruefeBeleg,
  segmentiereAnker,
  segmentiereArtikel,
  sollAktualitaet,
  sollBelegHash,
  sollInhaltGleich,
  urteileB6,
  segmenteZuFingerabdruecken,
  leereZeilenStatistik,
  type BasislinienEintrag,
  type ZeilenStatistik,
} from './segmente-logik.ts';

function huelle(koerper: string): string {
  return `<article id="art_1"><h6 class="heading">Art. 1 Sachüberschrift</h6><div class="collapseable">${koerper}</div></article>`;
}

describe('segmentiereArtikel — Extraktor-Blindstellen (normtext-treue-01/-02/-03/-10)', () => {
  it('-01: erfasst einen Kleindruck-Absatz (absatz09pt), den die \\babsatz\\b-Regex des Extraktors verfehlt', () => {
    const html = huelle('<p class="absatz09pt">wird mit einer Busse entsprechend dem Verschulden bestraft.</p>');
    const segmente = segmentiereArtikel(html, 'art_1');
    expect(segmente).not.toBeNull();
    expect(segmente!.map((s) => s.text.trim())).toContain(
      'wird mit einer Busse entsprechend dem Verschulden bestraft.',
    );
  });

  it('-02: erfasst <dd>, auch wenn das erste <dt> der Liste leer ist', () => {
    const html = huelle(
      '<dl><dt></dt><dd>die Mitgliederbeiträge an politische Parteien bis zu einem bestimmten Betrag;</dd>' +
        '<dt>b. </dt><dd>weitere, gleich geregelte Zuwendungen.</dd></dl>',
    );
    const segmente = segmentiereArtikel(html, 'art_1');
    const texte = segmente!.map((s) => s.text);
    expect(texte).toContain('die Mitgliederbeiträge an politische Parteien bis zu einem bestimmten Betrag;');
    expect(texte).toContain('weitere, gleich geregelte Zuwendungen.');
    // <dt> selbst ist nie ein Segment (reine Listenmarke, § Architektur Ziff. 4):
    expect(segmente!.some((s) => s.text.trim() === 'b.')).toBe(false);
  });

  it('-03: erfasst einen Zwischentitel-<p> (man-template-tab-utit), unabhängig von seiner Klasse', () => {
    const html = huelle('<p class="man-template-tab-utit-kurs">Dritte Klasse</p>');
    const segmente = segmentiereArtikel(html, 'art_1');
    expect(segmente!.map((s) => s.text.trim())).toContain('Dritte Klasse');
  });

  it('-10: erfasst die Inkrafttretens-Schlusszeile wie jeden anderen Absatz', () => {
    const html = huelle('<p class="inkrafttreten">Datum des Inkrafttretens: 1. Januar 1993</p>');
    const segmente = segmentiereArtikel(html, 'art_1');
    expect(segmente!.map((s) => s.text.trim())).toContain('Datum des Inkrafttretens: 1. Januar 1993');
  });
});

describe('segmentiereArtikel — Fussnoten, Absatznummer, Tabellen, Anker-Präsenz', () => {
  it('ignoriert eine Fussnoten-Verweismarke (<sup> mit <a>) im Fliesstext UND den ganzen Fussnoten-Apparat', () => {
    const html = huelle(
      '<p class="absatz">Ein Satz mit Verweis<sup><a href="#fn1" id="fnbck1">7</a></sup> mittendrin.</p>' +
        '<div class="footnotes"><p id="fn1"><sup><a href="#fnbck1">7</a></sup> Diese Fussnote darf nie als Segment auftauchen.</p></div>',
    );
    const segmente = segmentiereArtikel(html, 'art_1');
    const texte = segmente!.map((s) => s.text);
    expect(texte).toEqual(['Ein Satz mit Verweis mittendrin.']);
    expect(texte.join(' ')).not.toContain('Diese Fussnote');
    expect(texte.join(' ')).not.toContain('7');
  });

  it('entfernt eine FÜHRENDE Absatznummer (<sup>1bis</sup> ohne Link) aus dem Segmenttext', () => {
    const html = huelle('<p class="absatz"><sup>1bis</sup>&nbsp;Zeigt die Person eine Hinterziehung selbst an.</p>');
    const segmente = segmentiereArtikel(html, 'art_1');
    expect(segmente![0].text.trim()).toBe('Zeigt die Person eine Hinterziehung selbst an.');
  });

  it('behält ein NICHT führendes <sup> ohne Link als Text (Hochstellung wird reduziert, nicht gelöscht)', () => {
    const html = huelle('<p class="absatz">Nach Absatz&nbsp;1<sup>bis</sup> gilt dies entsprechend.</p>');
    const segmente = segmentiereArtikel(html, 'art_1');
    expect(normalisiere(segmente![0].text)).toBe(normalisiere('Nach Absatz 1bis gilt dies entsprechend.'));
  });

  it('NBSP und ein normales Leerzeichen normalisieren identisch', () => {
    const mitNbsp = 'Ein Satz mit NBSP mittendrin.';
    const mitLeerzeichen = 'Ein Satz mit NBSP mittendrin.';
    expect(normalisiere(mitNbsp)).toBe(normalisiere(mitLeerzeichen));
  });

  it('prüft Tabellen ZELLWEISE (je <td>/<th> ein eigenes Segment)', () => {
    const html = huelle('<table><tbody><tr><th>Spalte A</th><th>Spalte B</th></tr><tr><td>Erste Zelle im Satz.</td><td>Zweite Zelle im Satz.</td></tr></tbody></table>');
    const segmente = segmentiereArtikel(html, 'art_1');
    const zellen = segmente!.filter((s) => s.art === 'td' || s.art === 'th').map((s) => s.text);
    expect(zellen).toEqual(['Spalte A', 'Spalte B', 'Erste Zelle im Satz.', 'Zweite Zelle im Satz.']);
  });

  it('zerlegt eine Tabellenzelle mit eigener <p>+<dl>-Struktur in MEHRERE Segmente statt eines verklebten Blobs', () => {
    const html = huelle(
      '<table><tbody><tr><td><p class="man-template-tab-krpr">Bei Temperaturen:</p>' +
        '<dl><dt>– </dt><dd>über 10 °C: 0,2 mg/l N</dd><dt>– </dt><dd>unter 10 °C: 0,4 mg/l N</dd></dl></td></tr></tbody></table>',
    );
    const segmente = segmentiereArtikel(html, 'art_1')!;
    const texte = segmente.map((s) => s.text);
    expect(texte).toContain('Bei Temperaturen:');
    expect(texte).toContain('über 10 °C: 0,2 mg/l N');
    expect(texte).toContain('unter 10 °C: 0,4 mg/l N');
    expect(texte.join('|')).not.toContain('Nunter'); // die alte Verklebung darf nicht mehr auftreten
  });

  it('ignoriert eine Fedlex-Zellen-Einrückungs-Simulation ("[tab]" in <dt><span>) als Listenmarke', () => {
    const html = huelle(
      '<table><tbody><tr><td><dl><dt><span data-message="E40S10-TAB">[tab]</span></dt>' +
        '<dd>Hongkong a</dd></dl></td></tr></tbody></table>',
    );
    const segmente = segmentiereArtikel(html, 'art_1')!;
    // B4: KEIN zusätzlicher Zeilen-Fingerabdruck, weil die einzige Zelle über
    // <dl>/<dd> zerlegt wird (Falsch-Positiv-Schutz, s. Testgruppe B4 unten) —
    // das Zell-Segment selbst (art 'dd') bleibt unverändert bestehen.
    expect(segmente.map((s) => s.text)).toEqual(['Hongkong a']);
    expect(segmente.some((s) => s.art === 'tr')).toBe(false);
  });

  it('entfernt eingebetteten <style>-Inhalt (Inline-SVG-Icon) aus dem Segmenttext', () => {
    const html = huelle(
      '<p class="bild"><svg viewBox="0 0 64 64"><defs><style>.cls-1 { fill: #010101; }</style></defs>' +
        '<path class="cls-1" d="M1,2"/></svg></p>',
    );
    const segmente = segmentiereArtikel(html, 'art_1')!;
    expect(segmente.map((s) => s.text).join('')).not.toContain('cls-1');
  });

  it('liefert null, wenn der Anker in der HTML nicht existiert (eigener Befundtyp, kein stilles Überspringen)', () => {
    const html = huelle('<p>Beliebiger Inhalt.</p>');
    expect(segmentiereArtikel(html, 'art_999')).toBeNull();
  });
});

describe('projektionsBlob — generisches Sammeln über das tatsächliche JSON-Schema', () => {
  it('sammelt text/items/mehrspaltig UND grundlage, aber NICHT das numerische bloecke[].titel', () => {
    const eintrag = {
      bloecke: [
        { absatz: '1', text: 'Erster Satz.' },
        { absatz: null, text: 'Zwischentitel-Text', titel: 2 },
        { absatz: '2', text: 'Einleitung:', items: [{ marke: 'a', text: 'Erstes Element.' }] },
        {
          absatz: null,
          text: '',
          mehrspaltig: { spalten: [{ typ: 'text', titel: 'EU' }, { typ: 'text', titel: 'Schweiz' }], zeilen: [['Union', 'Schweiz']] },
        },
      ],
      grundlage: '(Art. 6 Abs. 2 BöB)',
    };
    const blob = projektionsBlob(eintrag);
    for (const erwartet of ['Erster Satz.', 'Zwischentitel-Text', 'Einleitung:', 'Erstes Element.', 'EU', 'Schweiz', 'Union', '(Art. 6 Abs. 2 BöB)']) {
      expect(blob).toContain(normalisiere(erwartet));
    }
    // Die numerische Gliederungstiefe "2" darf NICHT als eigenständiger Text-Fund auftauchen —
    // sie kommt nur indirekt über andere Ziffern im Blob vor (z.B. "BöB)"), nicht isoliert:
    expect(blob).not.toMatch(/^2$/);
  });
});

describe('Rolling-Hash-Enthaltensein ≡ String-Enthaltensein (NACHTRAG, Pflicht-Unit-Test)', () => {
  const faelle: Array<{ name: string; blob: string; segment: string; erwartetEnthalten: boolean }> = [
    { name: 'normaler Treffer in der Mitte', blob: 'Dies ist ein langer Beispieltext für den Blob.', segment: 'langer Beispieltext', erwartetEnthalten: true },
    { name: 'kein Treffer', blob: 'Dies ist ein langer Beispieltext für den Blob.', segment: 'völlig anderer Inhalt', erwartetEnthalten: false },
    { name: 'Treffer am BLOB-ANFANG', blob: 'AnfangDesBlobsUndNochEinigesMehrDanach', segment: 'AnfangDesBlobs', erwartetEnthalten: true },
    { name: 'Treffer am BLOB-ENDE', blob: 'EinigesVorabUndDannGenauDasEndeHier', segment: 'DasEndeHier', erwartetEnthalten: true },
    { name: 'Länge = Blob-Länge (exakt der ganze Blob)', blob: 'GenauDieserGesamteBlob', segment: 'GenauDieserGesamteBlob', erwartetEnthalten: true },
    { name: 'Länge > Blob-Länge (kann nie enthalten sein)', blob: 'KurzerBlob', segment: 'KurzerBlobAberDasSegmentIstLaenger', erwartetEnthalten: false },
  ];

  for (const f of faelle) {
    it(`${f.name}: Rolling-Hash stimmt mit blob.includes() überein`, () => {
      const blobNorm = normalisiere(f.blob);
      const segNorm = normalisiere(f.segment);
      const naiv = blobNorm.includes(segNorm);
      expect(naiv).toBe(f.erwartetEnthalten); // Testfall-Sanity
      const fehlt = fehlendeIndizes(blobNorm, [fingerabdruck(segNorm)]);
      const perRollingHashEnthalten = fehlt.length === 0;
      expect(perRollingHashEnthalten).toBe(naiv);
    });
  }

  it('erkennt mehrere Segmente unterschiedlicher Länge im selben Blob unabhängig voneinander', () => {
    const blob = normalisiere('Der erste Teil. Der zweite, etwas längere Teil. Und ein dritter.');
    const fps = [
      fingerabdruck(normalisiere('Der erste Teil.')),
      fingerabdruck(normalisiere('nicht vorhanden')),
      fingerabdruck(normalisiere('ein dritter.')),
    ];
    expect(fehlendeIndizes(blob, fps)).toEqual([1]);
  });

  it('zwei unterschiedliche Segmente ergeben unterschiedliche Fingerabdrücke (Sanity, keine Kollisions-Beweisführung)', () => {
    const a = fingerabdruck(normalisiere('Erstes Segment mit genug Zeichen.'));
    const b = fingerabdruck(normalisiere('Zweites Segment mit genug Zeichen.'));
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('R3-1 (GP 3): Soll-Fingerabdrücke sind eine Multimenge — Häufigkeit zählt', () => {
  // Nachbild VVEA (SR 814.600) Anhang 5: dieselbe Zeile «Cadmium / 10» in mehreren Tabellen eines Ankers.
  const zeile = fingerabdruck(normalisiere('Cadmium10'));
  const andere = fingerabdruck(normalisiere('Kupfer3000'));

  it('zweimal im Soll, zweimal im Blob ⇒ nichts fehlt', () => {
    expect(fehlendeIndizes('AntimonCadmium10BleiCadmium10Kupfer3000', [zeile, andere, zeile])).toEqual([]);
  });

  it('zweimal im Soll, EINMAL im Blob ⇒ das zweite Vorkommen fehlt (vorher grün, M10)', () => {
    expect(fehlendeIndizes('AntimonCadmium10BleiKupfer3000', [zeile, andere, zeile])).toEqual([2]);
  });

  it('dreimal im Soll, nie im Blob ⇒ alle drei fehlen', () => {
    expect(fehlendeIndizes('AntimonBlei', [zeile, zeile, zeile])).toEqual([0, 1, 2]);
  });

  it('mehr Vorkommen im Blob als im Soll ⇒ nichts fehlt (Überschuss ist nicht Gegenstand, R3-3)', () => {
    expect(fehlendeIndizes('Cadmium10Cadmium10Cadmium10', [zeile])).toEqual([]);
  });

  it('sollInhaltGleich vergleicht Häufigkeiten: ein entferntes Duplikat ist ein Inhaltswechsel', () => {
    const z: [number, string] = [zeile.laenge, zeile.hash];
    const k: [number, string] = [andere.laenge, andere.hash];
    expect(sollInhaltGleich({ annex_5: [z, k, z] }, { annex_5: [k, z, z] })).toBe(true);
    expect(sollInhaltGleich({ annex_5: [z, k, z] }, { annex_5: [z, k] })).toBe(false);
    expect(sollInhaltGleich({ annex_5: [z, z, k] }, { annex_5: [z, k, k] })).toBe(false);
  });

  it('verschachtelte Tabelle (SSV annex_2): Zelltext der inneren Tabelle kommt genau EINMAL ins Soll', () => {
    const html =
      '<section id="annex_2"><table><tr><td><table><tr><td><dl><dt>4.77.4</dt>' +
      '<dd>Anzeige der Überleitung von Fahrstreifen (Art. 59)</dd></dl></td></tr></table></td></tr></table></section>';
    const segmente = segmentiereArtikel(html, 'annex_2') ?? [];
    const treffer = segmente.filter((s) => normalisiere(s.text) === normalisiere('Anzeige der Überleitung von Fahrstreifen (Art. 59)'));
    expect(treffer).toHaveLength(1);
  });

  it('Basislinie als Multimenge: ein Eintrag deckt genau EINEN Fund, der zweite gleiche Fund ist neu', () => {
    const eintrag: BasislinienEintrag = { erlass: 'VVEA', eId: 'annex_5', hash: zeile.hash, laenge: zeile.laenge, auszug: 'Cadmium 10', befund: 'normtext-treue-01' };
    const fund = { erlass: 'VVEA', eId: 'annex_5', hash: zeile.hash };
    const einmal = gleicheBasislinieAb([fund], [eintrag]);
    expect([einmal.bekannt.length, einmal.neu.length, einmal.veraltet.length]).toEqual([1, 0, 0]);
    const zweimal = gleicheBasislinieAb([fund, fund], [eintrag]);
    expect([zweimal.bekannt.length, zweimal.neu.length, zweimal.veraltet.length]).toEqual([1, 1, 0]);
    const zweiEintraegeEinFund = gleicheBasislinieAb([fund], [eintrag, { ...eintrag }]);
    expect([zweiEintraegeEinFund.bekannt.length, zweiEintraegeEinFund.veraltet.length]).toEqual([1, 1]);
  });
});

describe('gleicheBasislinieAb — neu / bekannt / veraltet', () => {
  const basislinie: BasislinienEintrag[] = [
    { erlass: 'STHG', eId: 'art_56', hash: 'abc.def', laenge: 40, auszug: 'wird mit einer Busse …', befund: 'normtext-treue-01' },
  ];

  it('ein Basislinien-Eintrag, der HEUTE nicht mehr unter den Funden ist, gilt als VERALTET ⇒ rot', () => {
    const heutigeFunde: Array<{ erlass: string; eId: string; hash: string }> = []; // heute: nichts mehr fehlt
    const abgleich = gleicheBasislinieAb(heutigeFunde, basislinie);
    expect(abgleich.veraltet).toHaveLength(1);
    expect(abgleich.veraltet[0].eId).toBe('art_56');
    expect(abgleich.neu).toHaveLength(0);
  });

  it('ein heute gefundenes, in der Basislinie stehendes Segment gilt als BEKANNT (kein Rot)', () => {
    const heutigeFunde = [{ erlass: 'STHG', eId: 'art_56', hash: 'abc.def' }];
    const abgleich = gleicheBasislinieAb(heutigeFunde, basislinie);
    expect(abgleich.bekannt).toHaveLength(1);
    expect(abgleich.neu).toHaveLength(0);
    expect(abgleich.veraltet).toHaveLength(0);
  });

  it('ein heute gefundenes Segment OHNE Basislinien-Eintrag gilt als NEU ⇒ rot', () => {
    const heutigeFunde = [{ erlass: 'OR', eId: 'art_1', hash: 'xyz.999' }];
    const abgleich = gleicheBasislinieAb(heutigeFunde, basislinie);
    expect(abgleich.neu).toHaveLength(1);
    expect(abgleich.bekannt).toHaveLength(0);
    expect(abgleich.veraltet).toHaveLength(1); // der STHG-Eintrag ist heute ebenfalls nicht mehr da
  });

  it('B10: ein Basislinien-Eintrag eines NICHT geprüften Erlasses gilt als übersprungen, nicht veraltet', () => {
    const zweiErlasse: BasislinienEintrag[] = [
      ...basislinie,
      { erlass: 'OR', eId: 'art_1', hash: 'xyz.999', laenge: 12, auszug: 'ein Auszug', befund: 'normtext-treue-02' },
    ];
    const geprueftErlasse = new Set(['STHG']); // OR wurde diesen Lauf übersprungen (kein/veraltetes Soll)
    const abgleich = gleicheBasislinieAb([], zweiErlasse, geprueftErlasse);
    expect(abgleich.veraltet).toHaveLength(1);
    expect(abgleich.veraltet[0].erlass).toBe('STHG');
    expect(abgleich.uebersprungen).toHaveLength(1);
    expect(abgleich.uebersprungen[0].erlass).toBe('OR');
  });

  it('G7: Basislinien-Einträge eines Artikels OHNE Projektions-Eintrag gelten als übersprungen, nicht «veraltet — entfernen» (P10)', () => {
    const geprueftErlasse = new Set(['STHG']); // Erlass geprüft, aber art_56 hat keinen Projektions-Eintrag
    const abgleich = gleicheBasislinieAb([], basislinie, geprueftErlasse, new Set([`STHG\u0000${basislinie[0].eId}`]));
    expect(abgleich.veraltet).toEqual([]);
    expect(abgleich.uebersprungen).toHaveLength(1);
  });

  it('B10: ohne geprueftErlasse (altes Verhalten) gelten alle nicht mehr gefundenen Einträge als veraltet', () => {
    const abgleich = gleicheBasislinieAb([], basislinie);
    expect(abgleich.veraltet).toHaveLength(1);
    expect(abgleich.uebersprungen).toHaveLength(0);
  });
});

describe('ankerIdVonEid — B1: disp-Untereinheit eId ⇄ HTML-Anker-ID', () => {
  it('bildet eine disp-Untereinheits-eId auf ihre HTML-Anker-Form ab (Unterstrich → Schrägstrich)', () => {
    expect(ankerIdVonEid('disp_u1_art_149')).toBe('disp_u1/art_149');
  });

  it('lässt eine normale Artikel-eId unverändert (Identität)', () => {
    expect(ankerIdVonEid('art_56')).toBe('art_56');
  });

  it('löst einen disp-Untereinheits-Anker über die abgebildete ID auf, die rohe eId liefert weiterhin null (Beleg des Bugs vor dem Fix)', () => {
    const html =
      '<article id="disp_u1/art_149"><h6 class="heading">Art.&nbsp;149</h6>' +
      '<div class="collapseable"><p class="absatz">Datum des Inkrafttretens: 1. Januar 1956</p></div></article>';
    const segmente = segmentiereArtikel(html, ankerIdVonEid('disp_u1_art_149'));
    expect(segmente).not.toBeNull();
    expect(segmente!.map((s) => s.text.trim())).toContain('Datum des Inkrafttretens: 1. Januar 1956');
    expect(segmentiereArtikel(html, 'disp_u1_art_149')).toBeNull();
  });
});

describe('segmentiereArtikel — B2: <dl> DIREKT in <dl> (ohne <dd> dazwischen)', () => {
  it('zerlegt beide Ebenen, auch wenn die innere <dl> kein umschliessendes <dd> hat', () => {
    const html = huelle(
      '<dl><dt>a.</dt><dd>Ist dieser Zinssatz negativ oder null,</dd>' +
        '<dl><dt>1.</dt><dd>gilt der Mindestsatz;</dd><dt>2.</dt><dd>ist eine Neufestsetzung nötig.</dd></dl></dl>',
    );
    const segmente = segmentiereArtikel(html, 'art_1');
    const texte = segmente!.map((s) => s.text);
    expect(texte).toContain('Ist dieser Zinssatz negativ oder null,');
    expect(texte).toContain('gilt der Mindestsatz;');
    expect(texte).toContain('ist eine Neufestsetzung nötig.');
    // <dt> bleibt reine Listenmarke, nie ein eigenes Segment:
    expect(segmente!.some((s) => s.text.trim() === '1.')).toBe(false);
  });
});

describe('segmentiereArtikel — B3: Zwischentitel h1–h5 vs. eigene Anker-Überschrift', () => {
  it('nimmt einen Zwischentitel (h2) als Segment auf, aber NICHT die eigene h1-Überschrift des Ankers', () => {
    const html =
      '<section id="annex_10"><h1><a href="#annex_10">Anhang 10</a></h1>' +
      '<p class="absatz">Einleitungstext.</p><h2>Lichter, Richtungsblinker und Rückstrahler</h2>' +
      '<p class="absatz">Weiterer Text.</p></section>';
    const segmente = segmentiereArtikel(html, 'annex_10');
    expect(segmente).not.toBeNull();
    const texte = segmente!.map((s) => s.text.trim());
    expect(texte).not.toContain('Anhang 10');
    expect(texte).toContain('Lichter, Richtungsblinker und Rückstrahler');
    expect(texte).toContain('Einleitungstext.');
    expect(texte).toContain('Weiterer Text.');
    expect(segmente!.filter((s) => s.art === 'h')).toHaveLength(1);
  });

  it('lässt die h6-eigene Artikel-Überschrift unverändert unangetastet (kein h1–h5 im Spiel)', () => {
    const html = huelle('<p class="absatz">Normaler Artikeltext.</p>');
    const segmente = segmentiereArtikel(html, 'art_1');
    expect(segmente!.map((s) => s.text.trim())).not.toContain('Art. 1 Sachüberschrift');
    expect(segmente!.some((s) => s.art === 'h')).toBe(false);
  });
});

describe('segmentiereArtikel — B4: Zeilen-Fingerabdruck rettet eine zu kurze Tabellenzelle', () => {
  it('eine Tarifzelle unter der Segment-Mindestlänge (z.B. "0.77") bleibt über den Zeilen-Fingerabdruck sichtbar', () => {
    const html = huelle('<table><tbody><tr><td>Grundgebühr</td><td>0.77</td></tr></tbody></table>');
    const segmente = segmentiereArtikel(html, 'art_1')!;
    const zeile = segmente.find((s) => s.art === 'tr');
    expect(zeile).toBeDefined();
    expect(zeile!.text).toContain('0.77');
    expect(segmente.some((s) => s.art === 'td' && s.text === '0.77')).toBe(true);
  });

  it('lässt eine Zeile mit einer <dl>/<dd>-Listenzelle OHNE Zeilen-Fingerabdruck (Falsch-Positiv-Schutz, empirisch an GSCHV/KRK gefunden)', () => {
    // Die Projektion bewahrt für solche Zellen manchmal die Listenmarke als
    // literales Zeichen im Text (GSCHV annex_2: "…Temperaturen: – über 10
    // °C…"), unsere Zerlegung entfernt <dt> aber IMMER — eine Zeilen-
    // Verkettung mehrerer <dd> würde an genau dieser Stelle klaffen und
    // fälschlich rot werden, obwohl die einzelnen <dd> (über die normale
    // Zellzerlegung, unten belegt) weiterhin geprüft sind.
    const html = huelle(
      '<table><tbody><tr><td><p class="man-template-tab-krpr">Bei Temperaturen:</p>' +
        '<dl><dt>– </dt><dd>über 10 °C: 0,2 mg/l N</dd><dt>– </dt><dd>unter 10 °C: 0,4 mg/l N</dd></dl></td></tr></tbody></table>',
    );
    const segmente = segmentiereArtikel(html, 'art_1')!;
    expect(segmente.some((s) => s.art === 'tr')).toBe(false);
    expect(segmente.map((s) => s.text)).toContain('über 10 °C: 0,2 mg/l N');
    expect(segmente.map((s) => s.text)).toContain('unter 10 °C: 0,4 mg/l N');
  });

  it('eine Zeile aus AUSSCHLIESSLICH einfachen Zellen bekommt weiterhin einen Zeilen-Fingerabdruck', () => {
    const html = huelle('<table><tbody><tr><td>Grundgebühr</td><td>Zuschlag</td></tr></tbody></table>');
    const segmente = segmentiereArtikel(html, 'art_1')!;
    expect(segmente.some((s) => s.art === 'tr' && s.text === 'Grundgebühr Zuschlag')).toBe(true);
  });

  it('Regression 25.9.2026: eine Zelle deren Text NUR in <p> steckt (kein <dl>) löst die dd-Ausnahme NICHT aus (empirisch an DBG Art. 36 "0.77" gefunden)', () => {
    // Fedlex verpackt Tarifzellen üblicherweise in <p>, OHNE jede Listenmarke
    // — eine erste Fassung der dd-Ausnahme prüfte pauschal "hat die Zelle
    // überhaupt innere Segmente" und schaltete den Zeilen-Fingerabdruck damit
    // GENAU für diesen (den ursprünglichen B4-)Fall ab.
    const html = huelle(
      '<table><tbody><tr><td><p>und für je weitere 100 Franken Einkommen</p></td>' +
        '<td><p>0.77</p></td><td><p>;</p></td></tr></tbody></table>',
    );
    const segmente = segmentiereArtikel(html, 'art_1')!;
    const zeile = segmente.find((s) => s.art === 'tr');
    expect(zeile).toBeDefined();
    expect(zeile!.text).toContain('0.77');
  });
});

describe('G1 (Runde 3): Zeilen-Fingerabdruck je ZEILE aus der HTML, nicht je Projektions-Eintrag', () => {
  const trTexte = (html: string, statistik?: ZeilenStatistik): string[] =>
    segmentiereAnker(parseErlassHtml(html), 'art_1', undefined, statistik)!
      .filter((s) => s.art === 'tr')
      .map((s) => normalisiere(s.text));

  it('Kopfzeile aus <th> bekommt KEINEN Zeilen-Fingerabdruck (Projektion fasst Köpfe spaltenweise zusammen, RDV annex_3)', () => {
    const html = huelle('<table><tr><th>Stoff</th><th>Grenzwert</th></tr><tr><td>Arsen</td><td>2</td></tr></table>');
    expect(trTexte(html)).toEqual(['Arsen2']);
  });

  it('<td>-Kopfzeile mit Fedlex-Klasse man-template-tab-kpf gilt als Kopf; <th class="…-krpr"> als Datenzeile', () => {
    const html = huelle(
      '<table><tr><td><p class="man-template-tab-kpf">Stufe</p></td><td><p class="man-template-tab-kpf">Wert</p></td></tr>' +
        '<tr><th><p class="man-template-tab-krpr">I</p></th><th><p class="man-template-tab-krpr">55</p></th></tr></table>',
    );
    expect(trTexte(html)).toEqual(['I55']);
  });

  it('Zeile in <thead> gilt als Kopf, auch mit <td>-Zellen', () => {
    const html = huelle('<table><thead><tr><td>Stoff</td><td>Wert</td></tr></thead><tbody><tr><td>Blei</td><td>30</td></tr></tbody></table>');
    expect(trTexte(html)).toEqual(['Blei30']);
  });

  it('Listenzelle (dt/dd) VOR der Wertzelle: Stück ab der Marke deckt die Nachbarschaft (VTS Art. 135 «4,00»)', () => {
    const html = huelle(
      '<table><tr><td></td><td>Meter</td></tr>' +
        '<tr><td><dl><dt>a.</dt><dd>Länge</dd></dl></td><td>4,00</td></tr></table>',
    );
    expect(trTexte(html)).toContain('Länge4,00');
  });

  it('Listenmarke ZWISCHEN zwei Zellinhalten trennt das Stück — keine Verkettung über die Marke (GSCHV annex_2)', () => {
    const html = huelle(
      '<table><tr><td>Stickstoff</td><td><dl><dt>–</dt><dd>über 10 °C</dd><dt>–</dt><dd>unter 10 °C</dd></dl></td></tr></table>',
    );
    const statistik = leereZeilenStatistik();
    expect(trTexte(html, statistik)).toEqual([]);
    expect(statistik.ohne.marken).toBe(1);
  });

  it('zählt Tabellen und Zeilen ohne Fingerabdruck je Grund', () => {
    const html = huelle(
      '<table><tr><th>A</th><th>B</th></tr><tr><td>nur eine Zelle</td><td></td></tr><tr><td>x</td><td>1</td></tr></table>',
    );
    const statistik = leereZeilenStatistik();
    trTexte(html, statistik);
    expect(statistik).toEqual({
      tabellen: 1,
      tabellenOhneZeilenFp: 0,
      zeilen: 3,
      mitFingerabdruck: 1,
      ungeschuetzt: 1, // Kopfzeile «A | B»: keine Zelle ≥ 8 Zeichen
      ohne: { kopf: 1, einzelzelle: 1, marken: 0, bild: 0 },
    });
  });

  it('Bildzelle (Signaltafel, Projektion bildKacheln) wird isoliert — keine Verkettung über sie hinweg (SSV annex_2)', () => {
    const html = huelle(
      '<table><tr><td><p>1.03 Doppelkurve</p><img src="a.png"></td><td><p>1.04 Doppelkurve links</p><img src="b.png"></td></tr></table>',
    );
    const statistik = leereZeilenStatistik();
    expect(trTexte(html, statistik)).toEqual([]);
    expect(statistik.ohne.bild).toBe(1);
  });

  it('G5: <caption> wird ein eigenes Segment, statt mit der Tabelle verworfen zu werden', () => {
    const html = huelle('<table><caption>Tabelle 1: Gebühren nach Streitwert</caption><tr><td>bis 100</td><td>7.–</td></tr></table>');
    const segmente = segmentiereArtikel(html, 'art_1')!;
    expect(segmente.some((s) => s.art === 'caption' && s.text.includes('Gebühren nach Streitwert'))).toBe(true);
  });

  it('Mindestlänge: ein Zeilenstück aus ≥ 2 Zellen wird auch unter 8 Zeichen gefingerprintet, eine Zelle nicht', () => {
    const fps = segmenteZuFingerabdruecken([
      { art: 'tr', text: 'Arsen 2' },
      { art: 'td', text: '2' },
      { art: 'p', text: 'kurz' },
    ]);
    expect(fps.map((f) => f.fp.laenge)).toEqual([6]);
  });
});

describe('dispTextAusserhalbArtikel — G10 (Runde 3)', () => {
  it('zählt disp_uN-Abschnitte mit Text ausserhalb <article> (ohne Überschrift/Fussnoten), nicht die ohne', () => {
    const html =
      '<section id="disp_u1"><h1>Übergangsbestimmungen</h1><p>Übergangsbestimmung der Änderung vom 1. Januar 2020</p>' +
      '<article id="disp_u1/art_1"><p>a</p></article></section>' +
      '<section id="disp_u2"><h1>Schlussbestimmungen</h1><article id="disp_u2/art_1"><p>b</p></article>' +
      '<div class="footnotes"><p>Fussnote</p></div></section>';
    expect(dispTextAusserhalbArtikel(parseErlassHtml(html))).toBe(1);
  });
});

describe('alleAnhangEids — G3 (Runde 3): Anhang-/scope-/decl-Anker der obersten Ebene', () => {
  it('findet annex_*, scope_*, decl_* als <section>, ignoriert Unterstufen, den div-Container und lvl_* des Haupttexts', () => {
    const html =
      '<section id="lvl_I"><article id="art_1"><p>x</p></article></section>' +
      '<div id="annex"><section id="annex_2_16"><h1>Anhang 2.16</h1><section id="annex_2_16/lvl_u1"><p>y</p></section></section>' +
      '<section id="scope_u1"><p>z</p></section><section id="decl_u1"><p>w</p></section></div>';
    expect(alleAnhangEids(parseErlassHtml(html)).sort()).toEqual(['annex_2_16', 'decl_u1', 'scope_u1']);
  });
});

describe('alleArtikelEids — B5: Artikelmenge aus der HTML, nicht aus der Projektion', () => {
  it('findet art_* und disp_uN/art_*-Anker, ignoriert andere <article id>-Schemata (z.B. Anhang-Ziffern-Artikel)', () => {
    const html =
      '<html><body>' +
      '<article id="art_1"><h6>Art. 1</h6></article>' +
      '<article id="disp_u1/art_149"><h6>Art. 149</h6></article>' +
      '<article id="annex_I/lvl_u1/lvl_I/art_1"><h6>Article 1</h6></article>' +
      '</body></html>';
    const dokument = parseErlassHtml(html);
    expect(alleArtikelEids(dokument).sort()).toEqual(['art_1', 'disp_u1_art_149']);
  });

  it('dedupliziert eine physisch doppelte id (Fedlex-Quellfehler, z.B. KKV art_126_z) auf EINE eId', () => {
    const html =
      '<html><body><article id="art_126_z"><h6>A</h6></article>' +
      '<article id="art_126_z"><h6>B</h6></article></body></html>';
    const dokument = parseErlassHtml(html);
    expect(alleArtikelEids(dokument)).toEqual(['art_126_z']);
  });
});

describe('segmentiereArtikel — B2 Restmengen-Prüfung (meldend, kein Segment)', () => {
  it('meldet nennenswerten Text, der von KEINEM bekannten Segmenttyp erfasst wird (z.B. <ul>/<li>)', () => {
    const html = huelle('<ul><li>Ein Listenpunkt, der nicht als dl/dd modelliert ist und daher durchrutscht.</li></ul>');
    const restmeldungen: string[] = [];
    const segmente = segmentiereArtikel(html, 'art_1', restmeldungen);
    expect(segmente).toEqual([]); // kein bekannter Segmenttyp fasst <ul>/<li>
    expect(restmeldungen).toHaveLength(1);
    expect(restmeldungen[0]).toContain('Ein Listenpunkt');
  });

  it('bleibt still, wenn die Zerlegung den ganzen Bereich erfasst hat', () => {
    const html = huelle('<p class="absatz">Ein normaler Satz ohne Rest.</p>');
    const restmeldungen: string[] = [];
    segmentiereArtikel(html, 'art_1', restmeldungen);
    expect(restmeldungen).toHaveLength(0);
  });

  it('ohne übergebenes Array (Default) wird gar nicht erst geprüft — kein Verhaltensunterschied an den Segmenten', () => {
    const html = huelle('<ul><li>Text, der ohne Restmeldungs-Array einfach nur fehlt.</li></ul>');
    expect(segmentiereArtikel(html, 'art_1')).toEqual([]);
  });
});

describe('G8 (Runde 3): Befund-Etiketten der Basislinie einheitlich', () => {
  it('jeder Basislinien-Eintrag trägt ein normtext-treue-Etikett (kein zweiter Name für dieselbe Klasse)', () => {
    const basislinie = JSON.parse(readFileSync('scripts/normtext/segmente-basislinie.json', 'utf8')) as BasislinienEintrag[];
    const fremd = [...new Set(basislinie.map((e) => e.befund).filter((b) => !/^normtext-treue-[a-z0-9-]+$/.test(b)))];
    expect(fremd).toEqual([]);
  });
});

describe('G4 (Runde 3): B6 — Soll-Änderung klassieren, Modus-C-Beleg, Urteil', () => {
  const pin = { eli: 'cc/1/1', konsolidierung: '20260101', htmlN: 1 };
  const soll = (artikel: Record<string, [number, string][]>, p = pin, v = 3): string =>
    JSON.stringify({ pin: p, segmenterVersion: v, artikel });

  it('klassiert neu / versionswechsel / pinwechsel / unveraendert / verstoss / geloescht / unlesbar', () => {
    const a = soll({ art_1: [[10, 'a.b']] });
    expect(klassiereSollAenderung(null, a)).toBe('neu');
    expect(klassiereSollAenderung(a, null)).toBe('geloescht');
    expect(klassiereSollAenderung(soll({ art_1: [[10, 'a.b']] }, pin, 2), a)).toBe('versionswechsel');
    expect(klassiereSollAenderung(a, soll({ art_1: [[9, 'c.d']] }, { ...pin, konsolidierung: '20270101' }))).toBe('pinwechsel');
    expect(klassiereSollAenderung(a, soll({ art_1: [[10, 'a.b']] }))).toBe('unveraendert');
    expect(klassiereSollAenderung(a, soll({ art_1: [] }))).toBe('verstoss'); // P6: Fingerabdruck still entfernt
    expect(klassiereSollAenderung(a, soll({}))).toBe('verstoss'); // P13b: Artikel still entfernt
    expect(klassiereSollAenderung(a, '{kaputt')).toBe('unlesbar');
  });

  it('Beleg-Hash hängt vom Inhalt ab, nicht von der Reihenfolge', () => {
    const x = [
      { name: 'a.json', inhalt: '1' },
      { name: 'b.json', inhalt: '2' },
    ];
    expect(sollBelegHash(x)).toBe(sollBelegHash([...x].reverse()));
    expect(sollBelegHash(x)).not.toBe(sollBelegHash([{ name: 'a.json', inhalt: '1' }, { name: 'b.json', inhalt: '3' }]));
  });

  it('Beleg-Prüfung: fehlt / falsche Version / falscher Hash ⇒ nicht ok', () => {
    const erwartet = { segmenterVersion: 3, sollHash: 'h' };
    expect(pruefeBeleg(null, erwartet).ok).toBe(false);
    expect(pruefeBeleg({ segmenterVersion: 2, sollHash: 'h', dateien: 1, datum: '2026-09-25' }, erwartet).ok).toBe(false);
    expect(pruefeBeleg({ segmenterVersion: 3, sollHash: 'x', dateien: 1, datum: '2026-09-25' }, erwartet).ok).toBe(false);
    expect(pruefeBeleg({ segmenterVersion: 3, sollHash: 'h', dateien: 1, datum: '2026-09-25' }, erwartet).ok).toBe(true);
  });

  it('Urteil: Dateien ohne Vergleichsbasis verlangen einen gültigen Beleg; Verstoss bleibt Verstoss', () => {
    const ungueltig = () => ({ ok: false as const, grund: 'kein Beleg' });
    const gueltig = () => ({ ok: true as const });
    const u1 = urteileB6(
      [
        { pfad: 's/a.json', art: 'versionswechsel' },
        { pfad: 's/b.json', art: 'neu' },
      ],
      ungueltig,
    );
    expect(u1).toMatchObject({ belegPflicht: true, belegFehler: 'kein Beleg', verstoss: [] });
    expect(u1.ohneBasisNeu).toEqual(['s/b.json']);
    expect(urteileB6([{ pfad: 's/a.json', art: 'versionswechsel' }], gueltig).belegFehler).toBeUndefined();
    const u3 = urteileB6(
      [
        { pfad: 's/a.json', art: 'pinwechsel' },
        { pfad: 's/c.json', art: 'verstoss' },
      ],
      ungueltig,
    );
    expect(u3).toMatchObject({ belegPflicht: false, verstoss: ['s/c.json'] });
    expect(u3.belegFehler).toBeUndefined();
  });
});

describe('G4 (Runde 3): B9 — --schreiben ohne vollständigen Cache', () => {
  const e = { name: 'sthg', eli: 'cc/1/1', konsolidierung: '20260101', htmlN: 11 };
  const soll = (k: string, v = 3) => ({ pin: { eli: 'cc/1/1', konsolidierung: k, htmlN: 11 }, segmenterVersion: v, artikel: {} });

  it('alle Pins und die Version aktuell ⇒ nichts zu tun (überspringen zulässig)', () => {
    expect(sollAktualitaet([e], () => soll('20260101'), 3)).toEqual({ fehlend: [], veraltet: [] });
  });

  it('Pin-Wechsel, Versionswechsel oder fehlende Datei ⇒ nicht aktuell (FEHLER statt Überspringen)', () => {
    expect(sollAktualitaet([e], () => soll('20250101'), 3).veraltet).toEqual(['sthg']);
    expect(sollAktualitaet([e], () => soll('20260101', 2), 3).veraltet).toEqual(['sthg']);
    expect(sollAktualitaet([e], () => null, 3).fehlend).toEqual(['sthg']);
  });
});
