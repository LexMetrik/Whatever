import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  bundStaffelung, fussnoteGruende, hatWortlautHauptklausel, inkraftEintraege,
  inkrafttretenJson, ladeArtikelSichten, staffelEntscheid, zeitleisteBeginn,
  type ArtikelSicht, type ErlassBasis, type InkrafttretenEintrag, type StaffelGrund,
} from '../../scripts/normtext/inkrafttreten-generieren.ts';
import {
  fedlexInkrafttretensAngabe, ladeFedlexXml, type InkrafttretensAngabe,
} from '../../scripts/normtext/inkrafttreten-fedlex-datum.ts';

// W2·27-BUND-FERTIG — Kennzeichen «gestaffelt in Kraft» (Teil-Inkrafttreten).
// Fachlicher Hintergrund: das Abstract-`dateEntryInForce` ist bei allen 231 Bund-
// Erlassen eindeutig, taugt also nicht als Staffel-Signal; die Signale kommen aus
// der Fedlex-Zeitleiste, dem Wortlaut der Hauptklausel und ihren Fussnoten.

const art = (id: string, text: string, over: Partial<ArtikelSicht> = {}): ArtikelSicht =>
  ({ id, marginalie: [], text, fussnoten: [], ...over });

function sparqlFetch(bindings: Record<string, { value: string }>[]) {
  return (async () =>
    ({ ok: true, json: async () => ({ results: { bindings } }) }) as unknown as Response) as typeof fetch;
}
const wirft = (async () => { throw new Error('Netz weg'); }) as unknown as typeof fetch;
const KEINE: InkrafttretensAngabe = { vorhanden: false, daten: [] };

describe('Wortlaut-Hauptklausel (Signal b2)', () => {
  it('MWSTG Art. 116: Vorbehalt im selben Satz — Datum «1. Januar» trennt den Satz nicht', () => {
    const a = [art('116', 'Dieses Gesetz untersteht dem fakultativen Referendum. Es tritt unter Vorbehalt von Absatz 3 am 1. Januar 2010 in Kraft. Der Bundesrat bestimmt das Inkrafttreten der Artikel 34 Absatz 3 und 78 Absatz 4')];
    expect(hatWortlautHauptklausel(a)).toBe(true);
  });
  it('«mit Ausnahme von Artikel N» (ASYLV1 Art. 56) zählt', () => {
    expect(hatWortlautHauptklausel([art('56', 'Diese Verordnung tritt mit Ausnahme von Artikel 21 am 1. Oktober 1999 in Kraft.')])).toBe(true);
  });
  it('«Der Bundesrat bestimmt das Inkrafttreten» allein (ZPO Art. 408, KVG Art. 107) ist KEIN Signal', () => {
    expect(hatWortlautHauptklausel([art('408', 'Dieses Gesetz untersteht dem fakultativen Referendum. Der Bundesrat bestimmt das Inkrafttreten.')])).toBe(false);
  });
  it('eine einfache Hauptklausel ohne Vorbehalt ist kein Signal (BV Art. 195)', () => {
    expect(hatWortlautHauptklausel([art('195', 'Die Verfassung tritt am 1. Januar 2000 in Kraft.')])).toBe(false);
  });
  it('Schlusstitel-Zeilen vergangener Revisionen (disp_*) zählen nicht', () => {
    expect(hatWortlautHauptklausel([art('disp_u2_art_4', 'Diese Änderung tritt unter Vorbehalt von Absatz 2 am 1. Januar 2020 in Kraft.')])).toBe(false);
  });
  it('Vorbehalt in einem ANDEREN Satz als «in Kraft» zählt nicht', () => {
    expect(hatWortlautHauptklausel([art('9', 'Der Bund erlässt Vorschriften unter Vorbehalt kantonaler Zuständigkeit. Dieses Gesetz tritt am 1. Januar 2020 in Kraft.')])).toBe(false);
  });
});

describe('Fussnoten (Signale a und a2)', () => {
  const klausel = (fn: string[]) => art('154', 'Dieses Gesetz tritt am 1. Januar 1948 in Kraft.', { marginalie: ['Inkrafttreten und Vollzug'], fussnoten: fn });

  it('a: Teildatum-Fussnote am Inkrafttretens-Artikel (AHVG Fn 472)', () => {
    const g = fussnoteGruende([klausel(['Die Art. 9, Abs. 4, 17 und 109 traten am 1. Aug. 1947 in Kraft (BRB vom 28. Juli 1947).'])]);
    expect(g).toEqual(['fussnote-teildatum']);
  });
  it('a: dieselbe Fussnote an einem ANDEREN Artikel zählt nicht (AVIG Art. 22a)', () => {
    const g = fussnoteGruende([art('22_a', 'Text.', { fussnoten: ['Dieser Abs. tritt erst am 1. Juli 1997 in Kraft (siehe AS 1997 60).'] })]);
    expect(g).toEqual([]);
  });
  it('a: «in Kraft seit …» (Fassungs-Vermerk) ist kein Teildatum', () => {
    expect(fussnoteGruende([klausel(['Fassung gemäss Ziff. I des BG vom 24. Juni 1977, in Kraft seit 1. Jan. 1979.'])])).toEqual([]);
  });
  it('a2: Inkraftsetzungs-V auch an normalem Artikel (UVG Art. 68), KVG/FIDLEG-Form', () => {
    expect(fussnoteGruende([art('68', 'Text.', { fussnoten: ['Siehe auch Art. 2 der V vom 20. Sept. 1982 über die Inkraftsetzung und Einführung des BG über die Unfallversicherung (AS 1982 1724).'] })])).toEqual(['fussnote-inkraftsetzungs-v']);
    expect(fussnoteGruende([art('107', 'Text.', { fussnoten: ['Art. 1 der V vom 12. April 1995 über die Inkraftsetzung und Einführung des BG vom 18. März 1994 über die Krankenversicherung (AS 1995 1367).'] })])).toEqual(['fussnote-inkraftsetzungs-v']);
    expect(fussnoteGruende([art('96', 'Text.', { fussnoten: ['V vom 6. Nov. 2019 über die abschliessende Inkraftsetzung des Finanzinstitutsgesetzes (AS 2019 4631).'] })])).toEqual(['fussnote-inkraftsetzungs-v']);
  });
  it('a2: Änderungs-Vermerk «Fassung gemäss … Inkraftsetzung» (VGG Art. 4) zählt nicht', () => {
    expect(fussnoteGruende([art('4', 'Text.', { fussnoten: ['Fassung gemäss Art. 2 der V vom 1. März 2006 über die Inkraftsetzung des Bundesgerichtsgesetzes (AS 2006 1205).'] })])).toEqual([]);
  });
});

describe('staffelEntscheid / Zeitleiste — fail-closed', () => {
  const ohneText: ArtikelSicht[] = [art('1', 'Text.')];

  it('erste Konsolidierung VOR dem Ur-Datum ⇒ gestaffelt (SVG: 1959-08-25 < 1959-10-01)', () => {
    expect(staffelEntscheid({ fedlexAngabe: KEINE, urDatum: '1959-10-01', zeitleisteErste: '1959-08-25', artikel: ohneText }))
      .toEqual({ gestaffelt: true, gestaffeltGrund: ['fedlex-zeitleiste'] });
  });
  it('erste Konsolidierung = Ur-Datum ⇒ nicht gestaffelt (OR)', () => {
    expect(staffelEntscheid({ fedlexAngabe: KEINE, urDatum: '1912-01-01', zeitleisteErste: '1912-01-01', artikel: ohneText }))
      .toEqual({ gestaffelt: false, gestaffeltGrund: [] });
  });
  it('Zeitleiste unbelegt ⇒ gestaffelt, Grund «unbekannt»', () => {
    expect(staffelEntscheid({ fedlexAngabe: KEINE, urDatum: '1912-01-01', zeitleisteErste: null, artikel: ohneText }))
      .toEqual({ gestaffelt: true, gestaffeltGrund: ['unbekannt'] });
  });
  it('Ur-Datum fehlt ⇒ gestaffelt, Grund «unbekannt»', () => {
    expect(staffelEntscheid({ fedlexAngabe: KEINE, urDatum: null, zeitleisteErste: '1912-01-01', artikel: ohneText }).gestaffeltGrund).toEqual(['unbekannt']);
  });
  it('Normtext nicht lesbar ⇒ gestaffelt, Grund «unbekannt»', () => {
    expect(staffelEntscheid({ fedlexAngabe: KEINE, urDatum: '1912-01-01', zeitleisteErste: '1912-01-01', artikel: null }).gestaffeltGrund).toEqual(['unbekannt']);
  });
  it('positives Signal verdrängt «unbekannt» (Gründe bleiben sachlich)', () => {
    const r = staffelEntscheid({ fedlexAngabe: KEINE, urDatum: '1959-10-01', zeitleisteErste: null, artikel: [art('56', 'Diese Verordnung tritt mit Ausnahme von Artikel 21 am 1. Oktober 1999 in Kraft.')] });
    expect(r.gestaffeltGrund).toEqual(['wortlaut-hauptklausel']);
  });

  it('zeitleisteBeginn: Netzfehler wirft nicht, lässt die ELI unbelegt', async () => {
    const m = await zeitleisteBeginn(['cc/27/317_321_377'], wirft);
    expect(m.size).toBe(0);
  });
  it('zeitleisteBeginn: leere Antwort ⇒ unbelegt; Treffer ⇒ Datum', async () => {
    expect((await zeitleisteBeginn(['cc/27/317_321_377'], sparqlFetch([]))).size).toBe(0);
    const m = await zeitleisteBeginn(['cc/27/317_321_377'], sparqlFetch([
      { abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/27/317_321_377' }, erste: { value: '1912-01-01' } },
    ]));
    expect(m.get('cc/27/317_321_377')).toBe('1912-01-01');
  });

  const basis: ErlassBasis = { key: 'OR', sr: '220', ebene: 'bund', status: 'snapshot', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de' };
  it('bundStaffelung bei totalem Netzausfall: jeder Erlass gestaffelt/unbekannt, nie false', async () => {
    const st = await bundStaffelung([basis], { OR: { datum: '1912-01-01', quelle: 'fedlex' } }, wirft, () => [art('1', 'Text.')], async () => new Map());
    expect(st.OR).toEqual({ gestaffelt: true, gestaffeltGrund: ['unbekannt'] });
  });
  it('inkraftEintraege: JEDER Erlass trägt das Feld, auch ohne Ur-Datum und ohne Staffel-Auskunft', () => {
    const e = inkraftEintraege([basis, { ...basis, key: 'X' }], { OR: { datum: '1912-01-01', quelle: 'fedlex' } }, {});
    for (const k of ['OR', 'X']) {
      expect(typeof e[k].gestaffelt, k).toBe('boolean');
      expect(Array.isArray(e[k].gestaffeltGrund), k).toBe(true);
    }
    expect(e.X.datum).toBeUndefined();
    expect(e.X.gestaffelt).toBe(true);
  });
  it('inkrafttretenJson bleibt sortiert und deterministisch mit den neuen Feldern', () => {
    const j = inkrafttretenJson({ B: { datum: '2000-01-01', quelle: 'fedlex', gestaffelt: false, gestaffeltGrund: [] }, A: { quelle: 'fedlex', gestaffelt: true, gestaffeltGrund: ['unbekannt'] } });
    expect(j.indexOf('"A"')).toBeLessThan(j.indexOf('"B"'));
    expect(j.endsWith('}\n')).toBe(true);
  });
});

describe('Wortlaut — Teil-Klauseln neben der Hauptklausel (Signal b3, Nachzug 2.10.2026)', () => {
  const klausel = (text: string, id = '37') => [art(id, text, { marginalie: ['Inkrafttreten'] })];

  it('BGFA Art. 37: «Artikel 2 Absätze 2 und 3 … treten nur im Falle … in Kraft» zählt', () => {
    expect(hatWortlautHauptklausel(klausel('Dieses Gesetz untersteht dem fakultativen Referendum. Der Bundesrat bestimmt das Inkrafttreten. Artikel 2 Absätze 2 und 3 und Artikel 10 Absatz 1 Buchstabe b sowie die Abschnitte 4, 5 und 6 treten nur im Falle des Inkrafttretens des Abkommens vom 21. Juni 1999 über die Freizügigkeit in Kraft.'))).toBe(true);
  });
  it('FUSG Art. 111 / ATSG Art. 84: «Artikel N tritt … in Kraft» als zweiter Satz zählt', () => {
    expect(hatWortlautHauptklausel(klausel('Der Bundesrat bestimmt das Inkrafttreten. Artikel 103 tritt fünf Jahre nach den übrigen Bestimmungen dieses Gesetzes in Kraft.', '111'))).toBe(true);
    expect(hatWortlautHauptklausel(klausel('Der Bundesrat bestimmt den Zeitpunkt des Inkrafttretens. Artikel 83 Absatz 2 tritt am ersten Tag des zweiten Monats nach dem unbenützten Ablauf der Referendumsfrist in Kraft.', '84'))).toBe(true);
  });
  it('SchKG Art. 351: «Der Artikel 333 tritt schon mit der Aufnahme … in Kraft» zählt (Grund sachlich statt Zeitleisten-Artefakt)', () => {
    expect(hatWortlautHauptklausel(klausel('Dieses Gesetz tritt mit dem 1. Januar 1892 in Kraft. Der Artikel 333 tritt schon mit der Aufnahme des Gesetzes in die eidgenössische Gesetzessammlung in Kraft. Mit dem Inkrafttreten dieses Gesetzes werden alle entgegenstehenden Vorschriften aufgehoben.', '351'))).toBe(true);
  });
  it('MWSTG Art. 116: «Der Bundesrat bestimmt das Inkrafttreten der Artikel 34 Absatz 3 und 78 Absatz 4» zählt', () => {
    expect(hatWortlautHauptklausel(klausel('Dieses Gesetz untersteht dem fakultativen Referendum. Es tritt unter Vorbehalt von Absatz 3 am 1. Januar 2010 in Kraft. Der Bundesrat bestimmt das Inkrafttreten der Artikel 34 Absatz 3 und 78 Absatz 4 Wird das Referendum ergriffen und wird das Gesetz in der Volksabstimmung angenommen, so bestimmt der Bundesrat das Inkrafttreten.', '116'))).toBe(true);
  });
  it('MWSTG-Entscheid: «unter Vorbehalt von Absatz N» allein ist bei vorhandenem Referendums-Absatz KEIN Staffel-Signal', () => {
    const nurReferendum = 'Dieses Gesetz untersteht dem fakultativen Referendum. Es tritt unter Vorbehalt von Absatz 3 am 1. Januar 2010 in Kraft. Wird das Referendum ergriffen und wird das Gesetz in der Volksabstimmung angenommen, so bestimmt der Bundesrat das Inkrafttreten.';
    expect(hatWortlautHauptklausel(klausel(nurReferendum, '116'))).toBe(false);
    // …ohne Referendums-Absatz bleibt derselbe Vorbehalt ein Signal (konservativ).
    expect(hatWortlautHauptklausel(klausel('Es tritt unter Vorbehalt von Absatz 3 am 1. Januar 2010 in Kraft.', '116'))).toBe(true);
  });
  it('BPG Art. 42 «gestaffelt», FINIG «vorzeitig in Kraft setzen» zählen; ARG-Ermächtigung «Er kann einzelne Teile … später in Kraft setzen» bewusst nicht', () => {
    expect(hatWortlautHauptklausel(klausel('Der Bundesrat bestimmt das Inkrafttreten; er kann das Gesetz zeitlich und nach Personalkategorien gestaffelt in Kraft setzen.', '42'))).toBe(true);
    expect(hatWortlautHauptklausel(klausel('Der Bundesrat bestimmt das Inkrafttreten. Der Bundesrat kann folgende Bestimmungen vorzeitig in Kraft setzen: Artikel 9a.', '75'))).toBe(true);
    expect(hatWortlautHauptklausel(klausel('Der Bundesrat bestimmt den Zeitpunkt des Inkrafttretens des Gesetzes. Er kann einzelne Teile oder Vorschriften des Gesetzes in einem späteren Zeitpunkt in Kraft setzen.', '74'))).toBe(false);
  });
  it('VVV Art. 61: «Die Artikel 58–89 SVG und diese Verordnung treten am … in Kraft» = EIN Tag, kein Signal', () => {
    expect(hatWortlautHauptklausel(klausel('Die Artikel 58–89 SVG und diese Verordnung treten am 1. Januar 1960 in Kraft; ebenso die Artikel 96, 97 und 99 Ziffer 4 SVG (Strafbestimmungen).', '61'))).toBe(false);
  });
  it('Teil-Subjekt ausserhalb eines Inkrafttretens-Artikels zählt nicht (Randtitel fehlt, keine Hauptklausel)', () => {
    expect(hatWortlautHauptklausel([art('12', 'Artikel 5 tritt am 1. Januar 2020 in Kraft, sobald der Kanton zustimmt.')])).toBe(false);
  });
  it('Satz-Split zerreisst «Ziff. II» nicht: Ausnahme im selben Satz wird gesehen', () => {
    expect(hatWortlautHauptklausel([art('9', 'Dieses Gesetz tritt mit Ausnahme von Ziff. II am 1. Januar 2020 in Kraft.')])).toBe(true);
  });
  it('Klauseln in disp_* (Revisions-Klauseln, OR disp_u16_art_19 «Ausgenommen ist der Abschnitt …») zählen bewusst nicht', () => {
    expect(hatWortlautHauptklausel([art('disp_u16_art_19', 'Dieses Gesetz tritt mit dem 1. Juli 1937 in Kraft. Ausgenommen ist der Abschnitt über die Gläubigergemeinschaft, dessen Inkrafttreten der Bundesrat festsetzen wird.')])).toBe(false);
  });
});

describe('Fedlex-Angabe «Datum des Inkrafttretens» (Signal e)', () => {
  const p = (inner: string) => `<p xmlns:mig="x">${inner}</p>`;
  const note = (t: string) => `<authorialNote><p> ${t}</p></authorialNote>`;
  const inhalt = (...ps: string[]) => `<article eId="art_9"><paragraph><content>${ps.join('')}</content></paragraph></article><next/>`;

  it('KG: Teil-Zeilen mit <br/> und Fussnoten — Beschlussdaten in den Fussnoten zählen NICHT', () => {
    const xml = inhalt(p('Der Bundesrat bestimmt das Inkrafttreten.'), p(`Datum des Inkrafttretens: <br/>Artikel 18–25 am 1. Februar 1996${note('BRB vom 24. Jan. 1996')} <br/>alle übrigen Bestimmungen am 1. Juli 1996${note('V vom 17. Juni 1996 (AS 1996 1805)')}`));
    expect(fedlexInkrafttretensAngabe(xml)).toEqual({ vorhanden: true, daten: ['1996-02-01', '1996-07-01'] });
  });
  it('SVG-Form: Label allein im ersten <p>, Zeilen in Folge-<p> desselben <content>; NBSP und «Sept.»', () => {
    const xml = inhalt(p('Datum des Inkrafttretens:'), p(`Art. 10 Abs. 3: 1. Oktober 1959${note('BRB vom 25. Aug. 1959')} <sup><br/></sup>Art. 58–75: 1. Jan. 1960`), p('x: 20. Sept. 1961')) + '<content>1. Mai 2000</content>';
    expect(fedlexInkrafttretensAngabe(xml).daten).toEqual(['1959-10-01', '1960-01-01', '1961-09-20']);
  });
  it('ein einziges Datum ⇒ ein Datum (DBG), distinkt auch bei Wiederholung', () => {
    expect(fedlexInkrafttretensAngabe(inhalt(p('Datum des Inkrafttretens: 1. Januar 1995'))).daten).toEqual(['1995-01-01']);
    expect(fedlexInkrafttretensAngabe(inhalt(p('Datum des Inkrafttretens: Art. 3: 1. Januar 1995 alle übrigen: 1. Januar 1995'))).daten).toEqual(['1995-01-01']);
  });
  it('Label-Variante «Datum des Inkrafttreten:» (ZPO Art. 408) und Absatz-Anfang «Inkrafttreten:» (BEG, FINFRAG)', () => {
    expect(fedlexInkrafttretensAngabe(inhalt(p('Datum des Inkrafttreten: 1. Januar 2011'))).daten).toEqual(['2011-01-01']);
    const beg = inhalt(p('Der Bundesrat bestimmt das Inkrafttreten.'), p(`Inkrafttreten:${note('BRB vom 6. Mai 2009')} 1. Januar 2010 <br/>Art. 470 Abs. 2<sup>bis</sup> OR: 1. Oktober 2009`));
    expect(fedlexInkrafttretensAngabe(beg)).toEqual({ vorhanden: true, daten: ['2009-10-01', '2010-01-01'] });
  });
  it('kein Label: «Inkrafttreten:» mitten im Absatz (EAUE), «Datum des Inkrafttretens dieser Änderung» ohne Doppelpunkt, «In Kraft seit …»', () => {
    expect(fedlexInkrafttretensAngabe(inhalt(p('Text <br/> Inkrafttreten: 22. August 1991.'))).vorhanden).toBe(false);
    expect(fedlexInkrafttretensAngabe(inhalt(p('Die Frist beginnt mit dem Datum des Inkrafttretens dieser Änderung zu laufen.'))).vorhanden).toBe(false);
    expect(fedlexInkrafttretensAngabe(inhalt(p('Fassung gemäss BG, in Kraft seit 1. Jan. 2020'))).vorhanden).toBe(false);
  });
  it('Label ohne lesbares Datum ⇒ vorhanden, leer (der Entscheid macht daraus «unbekannt»)', () => {
    expect(fedlexInkrafttretensAngabe(inhalt(p('Datum des Inkrafttretens: folgt'))))
      .toEqual({ vorhanden: true, daten: [] });
  });

  it('staffelEntscheid: zwei verschiedene Daten ⇒ gestaffelt, auch wenn Zeitleiste == Ur-Datum (KG strukturell blind)', () => {
    const r = staffelEntscheid({ urDatum: '1996-02-01', zeitleisteErste: '1996-02-01', fedlexAngabe: { vorhanden: true, daten: ['1996-02-01', '1996-07-01'] }, artikel: [art('1', 'Text.')] });
    expect(r).toEqual({ gestaffelt: true, gestaffeltGrund: ['fedlex-inkrafttretensdatum'], teilDaten: ['1996-02-01', '1996-07-01'] });
  });
  it('staffelEntscheid: genau ein Datum oder fehlender Absatz ⇒ kein Signal e', () => {
    for (const a of [{ vorhanden: true, daten: ['1995-01-01'] }, KEINE]) {
      const r = staffelEntscheid({ urDatum: '1995-01-01', zeitleisteErste: '1995-01-01', fedlexAngabe: a, artikel: [art('1', 'Text.')] });
      expect(r).toEqual({ gestaffelt: false, gestaffeltGrund: [] });
    }
  });
  it('staffelEntscheid fail-closed: Quelle nicht abrufbar (null) bzw. Absatz ohne lesbares Datum ⇒ gestaffelt/unbekannt', () => {
    const basis = { urDatum: '1995-01-01', zeitleisteErste: '1995-01-01', artikel: [art('1', 'Text.')] };
    expect(staffelEntscheid({ ...basis, fedlexAngabe: null })).toEqual({ gestaffelt: true, gestaffeltGrund: ['unbekannt'] });
    expect(staffelEntscheid({ ...basis, fedlexAngabe: { vorhanden: true, daten: [] } })).toEqual({ gestaffelt: true, gestaffeltGrund: ['unbekannt'] });
  });

  const quelle = { key: 'KG', eli: 'cc/1996/546_546_546', token: '20230701' };
  const xmlDoc = '<akomaNtoso>Datum des Inkrafttretens: 1. Februar 1996 und 1. Juli 1996</akomaNtoso>';
  const sparql = (rows: Record<string, { value: string }>[]) => ((async (url: string | URL | Request) => {
    if (String(url).includes('sparql')) return { ok: true, json: async () => ({ results: { bindings: rows } }) } as unknown as Response;
    throw new Error('unerwartet ' + String(url));
  }) as unknown as typeof fetch);
  const zeile = { abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/1996/546_546_546' }, datum: { value: '2023-07-01' }, url: { value: 'https://fedlex.data.admin.ch/filestore/x/kg.xml' } };
  const mitFiles = (xml: string, typ: string, status = 200) => ((async (url: string | URL | Request) => {
    if (String(url).includes('sparql')) return { ok: true, json: async () => ({ results: { bindings: [zeile] } }) } as unknown as Response;
    return { ok: status === 200, status, headers: new Headers({ 'content-type': typ }), text: async () => xml } as unknown as Response;
  }) as unknown as typeof fetch);

  it('ladeFedlexXml: gültiger Cache (Pin-Marker passt) wird ohne Netz gelesen', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'inkraft-'));
    writeFileSync(join(dir, 'kg.xml'), xmlDoc); writeFileSync(join(dir, 'kg.xml.pin'), 'cc/1996/546_546_546|20230701');
    const m = await ladeFedlexXml([quelle], wirft, { cacheDir: dir, pauseMs: 0 });
    expect(m.get('KG')).toBe(xmlDoc);
  });
  it('ladeFedlexXml: Pin-Marker abweichend ⇒ Neuladen via SPARQL+Filestore; Cache-Datei bleibt unangetastet', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'inkraft-'));
    writeFileSync(join(dir, 'kg.xml'), 'ALT'); writeFileSync(join(dir, 'kg.xml.pin'), 'cc/1996/546_546_546|20200101');
    const m = await ladeFedlexXml([quelle], mitFiles(xmlDoc, 'application/xml'), { cacheDir: dir, pauseMs: 0 });
    expect(m.get('KG')).toBe(xmlDoc);
    expect(readFileSync(join(dir, 'kg.xml'), 'utf8')).toBe('ALT');
  });
  it('ladeFedlexXml: ohne Cache wird angelegt (Datei + Marker)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'inkraft-'));
    await ladeFedlexXml([quelle], mitFiles(xmlDoc, 'application/xml'), { cacheDir: dir, pauseMs: 0 });
    expect(readFileSync(join(dir, 'kg.xml.pin'), 'utf8')).toBe('cc/1996/546_546_546|20230701');
  });
  it('ladeFedlexXml fail-closed: HTML-Shell mit Status 200, HTTP-Fehler, Netzfehler, kein Stand ⇒ null (nie Wurf)', async () => {
    const dir = () => mkdtempSync(join(tmpdir(), 'inkraft-'));
    expect((await ladeFedlexXml([quelle], mitFiles('<!DOCTYPE html><title>Casemates</title>', 'text/html'), { cacheDir: dir(), pauseMs: 0 })).get('KG')).toBeNull();
    expect((await ladeFedlexXml([quelle], mitFiles('<akomaNtoso/>', 'application/xml', 500), { cacheDir: dir(), pauseMs: 0 })).get('KG')).toBeNull();
    expect((await ladeFedlexXml([quelle], wirft, { cacheDir: dir(), pauseMs: 0 })).get('KG')).toBeNull();
    expect((await ladeFedlexXml([quelle], sparql([]), { cacheDir: dir(), pauseMs: 0 })).get('KG')).toBeNull();
  });

  it('bundStaffelung: XML mit zwei Daten ⇒ gestaffelt (Zeitleiste = Ur-Datum, Normtext ohne Signal); XML fehlt ⇒ unbekannt', async () => {
    const kg: ErlassBasis = { key: 'KG', sr: '251', ebene: 'bund', status: 'snapshot', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/1996/546_546_546/de', fassungsToken: '20230701' };
    const zeitleiste = sparqlFetch([{ abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/1996/546_546_546' }, erste: { value: '1996-02-01' } }]);
    const ur = { KG: { datum: '1996-02-01', quelle: 'fedlex' as const } };
    const mit = await bundStaffelung([kg], ur, zeitleiste, () => [art('1', 'Text.')], async () => new Map([['KG', xmlDoc]]));
    expect(mit.KG).toEqual({ gestaffelt: true, gestaffeltGrund: ['fedlex-inkrafttretensdatum'], teilDaten: ['1996-02-01', '1996-07-01'] });
    const ohne = await bundStaffelung([kg], ur, zeitleiste, () => [art('1', 'Text.')], async () => new Map([['KG', null]]));
    expect(ohne.KG).toEqual({ gestaffelt: true, gestaffeltGrund: ['unbekannt'] });
  });
});

describe('Generator-Modul ohne Seiteneffekt beim Import (Nachfund 4)', () => {
  it('Import ausserhalb von Vitest startet keinen Netzlauf und schreibt inkrafttreten.json nicht', async () => {
    const vorher = readFileSync('public/normtext/inkrafttreten.json', 'utf8');
    const netz = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Netz gesperrt'));
    vi.stubEnv('VITEST', '');
    vi.resetModules();
    try {
      await import('../../scripts/normtext/inkrafttreten-generieren.ts');
      await new Promise((r) => setTimeout(r, 50));
      expect(netz).not.toHaveBeenCalled();
      expect(readFileSync('public/normtext/inkrafttreten.json', 'utf8')).toBe(vorher);
    } finally {
      vi.unstubAllEnvs(); netz.mockRestore();
    }
  });
});

describe('Korpus — inkrafttreten.json (alle Bund-Erlasse)', () => {
  const sidecar = JSON.parse(readFileSync('public/normtext/inkrafttreten.json', 'utf8')) as Record<string, InkrafttretenEintrag>;
  const register = JSON.parse(readFileSync('public/normtext/register.json', 'utf8')) as
    { erlasse: { key: string; ebene: string; status: string; inkraftGestaffelt?: boolean }[] };
  const bundSnaps = register.erlasse.filter((e) => e.ebene === 'bund' && e.status === 'snapshot');
  const GRUENDE: StaffelGrund[] = ['fedlex-zeitleiste', 'fedlex-inkrafttretensdatum', 'wortlaut-hauptklausel', 'fussnote-teildatum', 'fussnote-inkraftsetzungs-v', 'unbekannt'];

  // Golden der gestaffelten Erlasse (Stand Nachzug 2.10.2026). BISHER = die 39 des ersten Laufs
  // (d2faab7f2); GEGENPRUEFUNG = die 18 von der Gegenprüfung belegten Fehl-Negative (amtliche
  // «Datum des Inkrafttretens»-Angabe nennt Teil-Daten); ZUSATZ = vom neuen Signal gefunden.
  const BISHER = ['AHVG', 'AHVV', 'AMBV', 'ARGV1', 'ASYLV1', 'ASYLV2', 'AVIV', 'BETMKV', 'BVV3', 'ERV', 'FAMZG', 'FAV', 'FDV', 'FIDLEG', 'FINFRAG', 'FINMAG', 'HMG', 'KVG', 'MEPV', 'MWSTG', 'MWSTV', 'PARLG', 'PARTG', 'PATV', 'RVOV', 'SCHKG', 'STGB', 'SVG', 'TXG', 'UVG', 'VAM', 'VGVP', 'VKKG', 'VTS', 'VVK', 'WAV', 'ZEMIS_V', 'ZGB', 'ZSTV'];
  const GEGENPRUEFUNG = ['AIG', 'ATSG', 'AVG', 'AVIG', 'BEG', 'BGBM', 'BPG', 'BVG', 'ENTSG', 'FMG', 'FUSG', 'KG', 'KKG', 'MG', 'PATG', 'STG', 'URG', 'WAG'];
  const ZUSATZ = ['BGFA', 'FINIG', 'IVG', 'MSCHG'];
  const NICHT_GESTAFFELT = ['OR', 'BV', 'ZPO', 'DSG', 'BGG', 'IPRG', 'VVG', 'STPO', 'ARG', 'VWVG', 'DBG', 'STHG', 'BANKG', 'GSCHG', 'OHG'];

  it('KEIN Bund-Snapshot ohne explizites Feld; Gründe ⇔ gestaffelt; nur bekannte Gründe', () => {
    expect(bundSnaps.length).toBeGreaterThanOrEqual(227);
    for (const e of bundSnaps) {
      const s = sidecar[e.key];
      expect(s, e.key).toBeDefined();
      expect(typeof s.gestaffelt, e.key).toBe('boolean');
      expect(Array.isArray(s.gestaffeltGrund), e.key).toBe(true);
      expect(s.gestaffelt, e.key).toBe(s.gestaffeltGrund.length > 0);
      for (const g of s.gestaffeltGrund) expect(GRUENDE, `${e.key}: ${g}`).toContain(g);
    }
  });

  it('Golden: genau die erwartete Menge gestaffelt (39 bisherige + 18 Gegenprüfung + 4 Zusatz)', () => {
    const erwartet = [...BISHER, ...GEGENPRUEFUNG, ...ZUSATZ].sort();
    expect(new Set(erwartet).size).toBe(erwartet.length);
    const ist = Object.entries(sidecar).filter(([, v]) => v.gestaffelt).map(([k]) => k).sort();
    expect(ist).toEqual(erwartet);
    expect(ist.length).toBe(61);
  });

  it('die 18 Fehl-Negative der Gegenprüfung sind gestaffelt — mit amtlichen Teil-Daten als Beleg', () => {
    for (const k of GEGENPRUEFUNG) {
      expect(sidecar[k].gestaffelt, k).toBe(true);
      expect(sidecar[k].gestaffeltGrund, k).toContain('fedlex-inkrafttretensdatum');
      expect(sidecar[k].teilDaten!.length, k).toBeGreaterThan(1);
    }
    expect(sidecar.KG.teilDaten).toEqual(['1996-02-01', '1996-07-01']);
    expect(sidecar.AVIG.teilDaten).toEqual(['1983-01-01', '1984-01-01']);
    expect(sidecar.ATSG.teilDaten).toEqual(['2001-03-01', '2003-01-01']);
    expect(sidecar.URG.teilDaten).toEqual(['1993-07-01', '1994-01-01']);
    expect(sidecar.BVG.teilDaten).toEqual(['1983-07-01', '1984-01-01', '1984-07-01', '1985-01-01', '1987-01-01']);
  });

  it('nicht gestaffelt (von der Gegenprüfung als einheitlich belegt): OR, BV, ZPO, DSG, BGG, IPRG, VVG, StPO, ArG, VwVG, DBG, StHG, BankG, GSchG, OHG', () => {
    for (const k of NICHT_GESTAFFELT) expect(sidecar[k].gestaffelt, k).toBe(false);
  });

  it('teilDaten ⇔ Grund «fedlex-inkrafttretensdatum»; ISO, sortiert, distinkt, mindestens zwei', () => {
    for (const [k, v] of Object.entries(sidecar)) {
      const hat = v.gestaffeltGrund.includes('fedlex-inkrafttretensdatum');
      expect(v.teilDaten !== undefined, k).toBe(hat);
      if (!v.teilDaten) continue;
      expect(v.teilDaten.length, k).toBeGreaterThan(1);
      expect([...new Set(v.teilDaten)].sort(), k).toEqual(v.teilDaten);
      for (const d of v.teilDaten) expect(d, k).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Gegenprobe amtlich ↔ amtlich: das Abstract-dateEntryInForce ist eines der Teil-Daten der Fassung.
      if (v.datum) expect(v.teilDaten, k).toContain(v.datum);
    }
  });

  it('gestaffelt: SVG, FINMAG, KVG, MWSTG, ZGB, STGB, SCHKG', () => {
    for (const k of ['SVG', 'FINMAG', 'KVG', 'MWSTG', 'ZGB', 'STGB', 'SCHKG']) expect(sidecar[k].gestaffelt, k).toBe(true);
  });

  it('Gründe der Belegfälle', () => {
    expect(sidecar.SVG.gestaffeltGrund).toEqual(['fedlex-zeitleiste', 'fedlex-inkrafttretensdatum']);
    expect(sidecar.MWSTG.gestaffeltGrund).toEqual(['wortlaut-hauptklausel', 'fussnote-teildatum']);
    expect(sidecar.KVG.gestaffeltGrund).toEqual(['fedlex-inkrafttretensdatum', 'fussnote-inkraftsetzungs-v']);
    expect(sidecar.FIDLEG.gestaffeltGrund).toEqual(['fussnote-inkraftsetzungs-v']);
    expect(sidecar.AHVG.gestaffeltGrund).toEqual(['fedlex-zeitleiste', 'wortlaut-hauptklausel', 'fussnote-teildatum']);
    // SchKG: Zeitleiste ist hier ein Artefakt (Konsolidierung 1876 vor dem Erlass); sachlich trägt Art. 351 Abs. 2.
    expect(sidecar.SCHKG.gestaffeltGrund).toEqual(['fedlex-zeitleiste', 'wortlaut-hauptklausel']);
    expect(sidecar.BGFA.gestaffeltGrund).toEqual(['wortlaut-hauptklausel']);
    expect(sidecar.FUSG.gestaffeltGrund).toEqual(['fedlex-inkrafttretensdatum', 'wortlaut-hauptklausel']);
  });

  it('Normtext-Signale sind aus den Shards REPRODUZIERBAR (Sidecar == aktuelle Regeln)', () => {
    // Fängt jede Regel-Änderung im Generator, die nicht mit neuem Sidecar-Lauf
    // einhergeht (und umgekehrt): die Offline-Signale müssen dem Sidecar gleichen.
    for (const e of bundSnaps) {
      const artikel = ladeArtikelSichten(e.key);
      expect(artikel, e.key).not.toBeNull();
      const erwartet: StaffelGrund[] = [];
      if (hatWortlautHauptklausel(artikel!)) erwartet.push('wortlaut-hauptklausel');
      erwartet.push(...fussnoteGruende(artikel!));
      const gespeichert = sidecar[e.key].gestaffeltGrund.filter((g) => !['fedlex-zeitleiste', 'fedlex-inkrafttretensdatum', 'unbekannt'].includes(g));
      expect(gespeichert, e.key).toEqual(erwartet);
    }
  });

  it('Projektion: register.inkraftGestaffelt == Sidecar (ein Ort, §5); Kanton ohne Feld', () => {
    for (const e of register.erlasse) {
      if (e.ebene === 'bund' && e.status === 'snapshot') expect(e.inkraftGestaffelt, e.key).toBe(sidecar[e.key].gestaffelt);
      if (e.ebene !== 'bund') expect(e.inkraftGestaffelt, e.key).toBeUndefined();
    }
  });
});
