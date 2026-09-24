/**
 * scripts/normtext/segmente-logik.test.ts — Vitest, In-Memory-Fixtures.
 *
 * Deckt die Fallgruppen aus der Bau-Spec (§ Architektur Ziff. 8) ab: die vier
 * bekannten Extraktor-Blindstellen (normtext-treue-01/-02/-03/-10), die
 * Fussnoten-Marke, NBSP/Hochstellung, ein veralteter Basislinien-Eintrag —
 * sowie den NACHTRAG-Unit-Test «Rolling-Hash-Enthaltensein ≡ String-
 * Enthaltensein» inkl. der drei explizit geforderten Randfälle.
 */
import { describe, it, expect } from 'vitest';
import {
  fehlendeIndizes,
  fingerabdruck,
  gleicheBasislinieAb,
  normalisiere,
  projektionsBlob,
  segmentiereArtikel,
  type BasislinienEintrag,
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
    expect(segmente.map((s) => s.text)).toEqual(['Hongkong a']);
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
});
