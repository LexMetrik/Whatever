// W2·17-UI-BEFUNDE · ED10/ED13 Nachzug (Prüfer-Verdikt PR #1264, 2.10.2026)
//
// Punkt 1 (§1, HOCH): «Artikel 2 Absatz 1 des Kulturgütertransfergesetzes» in
// ZGB 728 wurde als Sprung auf ZGB Art. 2 verlinkt — ein plausibel-falscher
// Link, der seit #1264 zusätzlich als Chip in Dossier und Blatt erscheint.
// Wurzel: `restMitIntern` (NormText.tsx) liess den Passus («Absatz 1») zwischen
// Nummer und Erlassname unbesehen durch; der des/der-Guard prüft den ROHEN Rest
// und sah nur «Absatz …». Vertrag: folgt nach Nummer + Passus ein Genitiv-
// Erlassname («des/der … -gesetzes, -verordnung, -übereinkommens …»), gibt es
// KEINEN internen Link; kein Link ist besser als ein falscher.
//
// Punkt 2 (§5, MITTEL): die Verweis-Liste muss dieselben Eingaben wie der
// Wortlaut haben (Fussnoten-Marker zerlegen den Text in Segmente).
// Punkt 3 (§6.7): der Paritätstest vergleicht die MENGE DER ZIELE (nicht nur
// Ja/Nein je Artikel) und nutzt den echten Leser (Register-Kürzel, Kantons-Karte).
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NormText, type InternRefs } from '../components/NormText';
import { sammleVerweise } from '../pages/gesetz-leser/parts/ArtikelLeser.fussnoten';
import { alleErlassKeys, art, fussnotenFuer, internFuer, lade } from './leser-verweise-w217-helfer';
import { FN_SEGMENT_BEKANNT, ohneBekannte, pruefeKorpus } from './leser-verweise-w217-paritaet';

// ─── Einheit: NormText mit synthetischem Erlass ─────────────────────────────
const tokenMap = new Map([['2', '2'], ['4', '4'], ['5', '5'], ['6', '6'], ['8', '8'], ['44', '44'], ['45', '45'], ['49', '49'], ['50', '50'], ['59', '59'], ['3', '3'], ['1', '1'], ['24', '24'], ['89', '89']]);
const bund: InternRefs = { tokenMap, basisPfad: '/gesetze/bund/XYZ', springeZu: () => {}, eigenesKuerzel: 'XYZ' };
const sprungZiele = (text: string, intern: InternRefs = bund): string[] =>
  [...renderToStaticMarkup(<NormText text={text} intern={intern} />)
    .matchAll(/<a\b[^>]*?\shref="([^"]+#art-[^"]+)"/g)].map((m) => m[1]);

describe('§1 · kein interner Link, wenn nach Nummer + Passus ein Genitiv-Erlassname folgt', () => {
  const FREMD = [
    'Artikel 2 Absatz 1 des Kulturgütertransfergesetzes vom 20. Juni 2003',
    'Artikel 6 Absatz 2 Buchstabe a des Nachrichtendienstgesetzes vom 25. September 2015',
    'Artikel 6 des Nachrichtendienstgesetzes vom 25. September 2015',
    'Art. 4 Abs. 2 der Verordnung über den Naturschutz',
    'Artikel 44 Absatz 1 der Verordnung vom 24. Oktober 2007',
    'Artikel 5 Absatz 1 des Schweizerischen Strafgesetzbuches',
    'Artikel 5 Absatz 1 des eidgenössischen Steuerharmonisierungsgesetzes vom 14. Dezember 1990',
    'Artikel 2 Absatz 3 des Madrider Protokolls ist anwendbar',
    'Artikel 12 Ziffer 2 der EU-CLP-Verordnung verwendet werden',
    'Artikel 8 Absatz 1 der Zivilprozessordnung',
    'Artikel 5 Absatz 2 des Abkommens vom 14. Dezember 2001',
    'Artikel 2 Absatz 1 des Basler Übereinkommens',
    'Artikel 5 Absatz 1 der Bundesverfassung',
    // datiertes Zitat ohne Typ-Wort (Abkürzung): BVG 18, VRV 1, DBG 167 — gemessen 2.10.2026
    'Art. 8 Abs. 2 des BG vom 6. Okt. 2000 über den Allgemeinen Teil des Sozialversicherungsrechts',
    'Art. 45 Abs. 1 der V vom 5. Sept. 1979 über die Strassensignalisation',
    'Artikel 6 Absatz 1 des Schengener Grenzkodex nicht erfüllt sind',
    'Artikel 89 Absatz 2 des bisherigen Rechts verloren',
    'die Artikel 49 und 50 des bisherigen Rechts',
    // Zitat-Fortsetzungen, die der Passus-Überleser nicht kennt (gemessen: GSchG 37, ASYLG 63,
    // STGB 305bis, ASYLV2 20, AHVV 6, FUSG 103): Minus-Bereich, Buchstabe + Ziffern, Lemma, Anhang/Anlage
    'Art. 3 Abs. 1−3 des Wasserbaugesetzes vom 21. Juni 1991',
    'Artikel 1 Buchstabe C Ziffern 1–6 der Flüchtlingskonvention vom 28. Juli 1951',
    'Artikel 59 Absatz 1 erstes Lemma des Bundesgesetzes vom 14. Dezember 1990',
    'Artikel 3 Anhang K Anlage 1 des Übereinkommens zur Errichtung der Europäischen Organisation',
    'Artikel 24 Buchstabe fbis des Bundesgesetzes vom 14. Dezember 1990',
    'Artikel 5 Absätze 1 und 2 und Artikel 6 Absätze 3 und 3quater des Bundesgesetzes vom 14. Dezember 1990',
    'Artikel 5 Absatz 1 und Artikel 6 Buchstaben a und b der Verordnung',
    'Artikeln 5 und 6 ff. der Luftfahrtverordnung vom 14. November 1973',
  ];
  it.each(FREMD)('«%s» → Text', (text) => {
    expect(sprungZiele(text)).toEqual([]);
  });

  const BEHALTEN: [string, string[]][] = [
    ['Artikel 2 Absatz 1 gilt nicht', ['/gesetze/bund/XYZ#art-2']],
    ['Artikel 5 Absatz 1 über ein Projekt', ['/gesetze/bund/XYZ#art-5']],
    ['Artikel 5 Absatz 1 der Quellensteuer unterliegen', ['/gesetze/bund/XYZ#art-5']],
    ['Artikel 8 Absatz 2 des vorliegenden Gesetzes', ['/gesetze/bund/XYZ#art-8']],
    ['Artikel 8 Absatz 2 dieses Gesetzes', ['/gesetze/bund/XYZ#art-8']],
    ['Artikel 4 Absatz 1 Buchstabe a und Artikel 6', ['/gesetze/bund/XYZ#art-4', '/gesetze/bund/XYZ#art-6']],
    ['Artikel 5 Absatz 1 der Ordnung halber', ['/gesetze/bund/XYZ#art-5']],
    ['Artikel 5 Absatz 1 der Gläubiger vom Staat bestimmt', ['/gesetze/bund/XYZ#art-5']],
    // «…ordnung» ist nicht jede Erlassart: Anordnung/Zuordnung sind Prosa.
    ['Artikel 5 Absatz 1 der Anordnung des Gerichts', ['/gesetze/bund/XYZ#art-5']],
    ['Artikel 5 Absatz 2 der Zuordnung eines Fachbereichs', ['/gesetze/bund/XYZ#art-5']],
    // Der Erlassname gehört nicht zu DIESEM Zitat, wenn Wörter dazwischenstehen.
    ['Artikel 5 tritt schon mit der Aufnahme des Gesetzes in Kraft', ['/gesetze/bund/XYZ#art-5']],
    // Eigene Änderungsfassung: «in der Fassung der Änderung vom …» ist kein fremder Erlass (FINFRAV-FINMA 50b).
    ['Artikel 3 Absatz 1 Buchstaben c und e in der Fassung der Änderung vom 8. Dezember 2022 gilt', ['/gesetze/bund/XYZ#art-3']],
  ];
  it.each(BEHALTEN)('«%s» bleibt Sprung', (text, ziele) => {
    expect(sprungZiele(text)).toEqual(ziele);
  });
});

// ─── Kantonal (§-Erlass): dieselbe Weiche im §-Pfad ──────────────────────────
describe('§1 · §-Erlass: Genitiv-Erlassname hinter Aufzählungsformen ⇒ Text', () => {
  const kanton: InternRefs = {
    tokenMap: new Map([['1', '1'], ['8', '8'], ['10', '10']]), basisPfad: '/gesetze/kanton/XX-1', springeZu: () => {},
    paragrafDesigniert: true, eigenesKuerzel: 'XX',
  };
  it.each([
    '§ 8 ff. des Reglements betreffend Abgeltungsbeiträge',
    '§ 10 ff. der Gemeindeordnung der Einwohnergemeinde',
    '§ 1 lit. a und b der Übergangsverordnung Schulharmonisierung',
    '§ 1 Abs. 2 des Gemeindegesetzes vom 17. Oktober 1984',
  ])('«%s» → Text', (text) => {
    expect(sprungZiele(text, kanton)).toEqual([]);
  });
  it('§ 8 Abs. 2 gilt → bleibt Sprung', () => {
    expect(sprungZiele('Es gilt § 8 Abs. 2 sinngemäss', kanton)).toEqual(['/gesetze/kanton/XX-1#art-8']);
  });
});

// ─── Korpus: die Beispiele des Prüfers ──────────────────────────────────────
describe('§1 · Korpus-Beispiele (Prüfer-Befund)', () => {
  const liste = (key: string, token: string, kuerzel: string) => {
    const eintraege = lade('bund', key);
    return sammleVerweise(art(eintraege, token), { kuerzel, intern: internFuer('bund', key, eintraege), fussnoten: fussnotenFuer('bund', key)[token] })
      .map((v) => v.href ?? v.norm);
  };
  it('ZGB 728 («Artikel 2 Absatz 1 des Kulturgütertransfergesetzes») → nicht ZGB Art. 2', () => {
    expect(liste('ZGB', '728', 'ZGB')).not.toContain('/gesetze/bund/ZGB#art-2');
  });
  it('OR 196a und OR 210 → nicht OR Art. 2', () => {
    expect(liste('OR', '196_a', 'OR')).not.toContain('/gesetze/bund/OR#art-2');
    expect(liste('OR', '210', 'OR')).not.toContain('/gesetze/bund/OR#art-2');
  });
  it('ZGB 43a («Artikel 6 … des Nachrichtendienstgesetzes») → nicht ZGB Art. 6', () => {
    expect(liste('ZGB', '43_a', 'ZGB')).not.toContain('/gesetze/bund/ZGB#art-6');
  });
  it('DSG 2 listet sich nicht selbst (Artikel 2 Absatz 1 des Gaststaatgesetzes)', () => {
    expect(liste('DSG', '2', 'DSG')).not.toContain('/gesetze/bund/DSG#art-2');
  });
  it('Gegenprobe: ein echter Binnenverweis bleibt (OR 336d → Artikel 336c)', () => {
    expect(liste('OR', '336_d', 'OR')).toContain('/gesetze/bund/OR#art-336_c');
  });
});

// ─── Korpus-weit: Zähler = 0 ────────────────────────────────────────────────
describe('Korpus-Zähler (gesamter Bestand)', () => {
  it('Bund: kein interner Link vor fremdem Genitiv · kein Selbst-Chip · Liste == Wortlaut (inkl. Fussnoten)', () => {
    const { z, funde } = pruefeKorpus('bund', alleErlassKeys('bund'));
    expect(z.artikel).toBeGreaterThan(5000); // Messgerät kann nicht leer laufen (§6.7)
    expect(z.intern).toBeGreaterThan(10000);
    expect(ohneBekannte(funde).slice(0, 20)).toEqual([]);
    // Ratsche: jeder bekannte Rest ist noch da (sonst aus FN_SEGMENT_BEKANNT streichen).
    expect(FN_SEGMENT_BEKANNT.filter((k) => !funde.some((f) => f.startsWith(k)))).toEqual([]);
    expect(z).toMatchObject({ fremdGenitiv: FN_SEGMENT_BEKANNT.length, selbstInListe: 0, paritaetAbweichung: 0 });
  }, 180_000);

  it('Kanton: kein interner Link vor fremdem Genitiv · kein Selbst-Chip · Liste == Wortlaut (inkl. Fussnoten)', () => {
    const { z, funde } = pruefeKorpus('kanton', alleErlassKeys('kanton'));
    expect(z.artikel).toBeGreaterThan(5000);
    expect(z.intern).toBeGreaterThan(4000);
    expect(funde.slice(0, 20)).toEqual([]);
    expect(z).toMatchObject({ fremdGenitiv: 0, selbstInListe: 0, paritaetAbweichung: 0 });
  }, 180_000);
});
