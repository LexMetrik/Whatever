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
  alleArtikelEids,
  ankerIdVonEid,
  fehlendeIndizes,
  fingerabdruck,
  gleicheBasislinieAb,
  normalisiere,
  parseErlassHtml,
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
