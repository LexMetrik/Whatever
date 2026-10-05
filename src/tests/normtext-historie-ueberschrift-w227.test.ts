/**
 * W2·27-BUND-FERTIG — Überschrift-Fussnoten (2.10.2026, Entscheid David).
 *
 * Fedlex setzt «Fassung gemäss …»/«Eingefügt durch …» oft an eine Gliederungsüberschrift (Titel, Abschnitt, Randtitel)
 * statt an jeden Artikel. Das Struktur-Sidecar hängt sie (`sektion`) nur an den ERSTEN Artikel darunter; die Historie
 * zeigte an allen übrigen «nichts erfasst». Seither gilt die Fussnote für alle Artikel, deren Gliederungspfad die
 * Überschrift enthält (`sektionsErbe` + `baueArtikelHistorie(…, { geerbt })`). Fixture-Texte sind wörtlich aus den
 * Struktur-Sidecars (`public/normtext/struktur/bund/OR.json`, StGB.json) gekürzt; die Korpus-Sonden lesen die committeten
 * Artefakte.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { baueArtikelHistorie, sektionsErbe, sektionsAnalyse, ganzeFassung, teilweiseFussnote, loeseErbeAuf, type ArtikelHistorie, type ErbArtikel, type HistorieEreignis, type FnEingang } from '../lib/normtext/historie-parse';
import { historieFuerArtikel, type HistorieShard } from '../lib/normtext/historie-laden';
import { baueGliederungsbaum, type Sektion } from '../lib/normtext/browse';
import { tokenAusId } from '../../scripts/normtext/historie-aufgehoben-lebend';
import type { NormSnapshot } from '../lib/normtext/typen';

const FASSUNG_1972 = 'Fassung gemäss Ziff. I des BG vom 25. Juni 1971, in Kraft seit 1. Jan. 1972 (AS 1971 1461; BBl 1967 II 241).';
const FASSUNG_2007 = 'Fassung gemäss Ziff. I 1 des BG vom 13. Dez. 2002, in Kraft seit 1. Jan. 2007 (AS 2006 3459; BBl 1999 1979).';
const EINGEFUEGT_2012 = 'Eingefügt durch Ziff. I des BG vom 18. März 2011, in Kraft seit 1. Jan. 2012 (AS 2011 4909).';
const AUFGEHOBEN_2010 = 'Aufgehoben durch Ziff. I des BG vom 1. Jan. 2009, mit Wirkung seit 1. Jan. 2010 (AS 2009 1).';

const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ nr: '1', text, links: [], absatz: null, item: null, ...extra });
const sek = (text: string, label: string): FnEingang => fn(text, { sektion: label });
const stufe = (ebene: number, label: string) => ({ ebene, label });
const TITEL = stufe(2, 'Zehnter Titel: Der Arbeitsvertrag');
const ABSCHNITT1 = stufe(3, 'Erster Abschnitt: Der Einzelarbeitsvertrag');
const ABSCHNITT2 = stufe(3, 'Zweiter Abschnitt: Besondere Vertragsverhältnisse');
const TITEL11 = stufe(2, 'Elfter Titel: Der Werkvertrag');

/** Historie eines Artikels der Folge `folge` (Token → Erbe aus `sektionsErbe`). */
function historieVon(folge: ErbArtikel[], token: string, opts: { snapshotAufgehoben?: boolean } = {}) {
  const a = folge.find((x) => x.token === token)!;
  const { erbe, geteilt } = sektionsAnalyse(folge);
  return baueArtikelHistorie(a.fussnoten, {
    geerbt: erbe.get(token),
    geteilteUeberschriften: geteilt.get(token) ?? new Set<string>(),
    ...opts,
  }).historie;
}

describe('sektionsErbe · Überschrift-Fussnoten gelten für alle Artikel darunter', () => {
  const folge: ErbArtikel[] = [
    { token: '319', gliederung: [TITEL, ABSCHNITT1], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
    { token: '320', gliederung: [TITEL, ABSCHNITT1] },
    { token: '321', gliederung: [TITEL, ABSCHNITT1] },
    { token: '330_a', gliederung: [TITEL, ABSCHNITT2] }, // Abschnittswechsel unter DEMSELBEN Titel: Titel-Fussnote gilt weiter
    { token: '363', gliederung: [TITEL11] }, // Titel gleicher Stufe beendet den Bereich
  ];

  it('Träger-Artikel UND jeder Folge-Artikel im Bereich tragen das Ereignis mit Herkunfts-Label', () => {
    for (const token of ['319', '320', '321', '330_a']) {
      const h = historieVon(folge, token)!;
      expect(h, token).not.toBeNull();
      // Vorgabe C (Nachzug 2.10.2026): Überschrift-Ereignisse speisen nur die Chronik, nie «giltSeit» — auch am Träger nicht.
      expect(h.giltSeit, token).toBeNull();
      expect(h.ereignisse, token).toHaveLength(1);
      expect(h.ereignisse[0]).toMatchObject({ typ: 'fassung', datum: '1972-01-01', ueberschrift: TITEL.label });
    }
  });

  it('die nächste Überschrift gleicher Stufe beendet den Bereich: Art. 363 (Elfter Titel) erbt nichts', () => {
    expect(sektionsErbe(folge).has('363')).toBe(false);
    expect(historieVon(folge, '363')).toBeNull();
  });

  it('verschachtelte Stufen: Abschnitts-Fussnote gilt nur im Abschnitt, Titel-Fussnote im ganzen Titel (äusserste zuerst)', () => {
    const f2: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL, ABSCHNITT1], fussnoten: [sek(FASSUNG_1972, TITEL.label), { ...sek(EINGEFUEGT_2012, ABSCHNITT1.label), nr: '2' }] },
      { token: '2', gliederung: [TITEL, ABSCHNITT1] },
      { token: '3', gliederung: [TITEL, ABSCHNITT2] },
    ];
    const art2 = historieVon(f2, '2')!;
    expect(art2.ereignisse.map((e) => [e.typ, e.ueberschrift])).toEqual([
      ['fassung', TITEL.label],
      ['eingefuegt', ABSCHNITT1.label],
    ]);
    expect(art2.giltSeit).toBeNull(); // Vorgabe C: nur Chronik
    // Art. 3 liegt in Abschnitt 2: nur die Titel-Fussnote
    expect(historieVon(f2, '3')!.ereignisse.map((e) => e.ueberschrift)).toEqual([TITEL.label]);
  });

  it('Randtitel-Ebene (Marginalie): geteilter Ahne «A. …» wird Knoten, seine Fussnote gilt für die Artikel darunter', () => {
    const f3: ErbArtikel[] = [
      { token: '47', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['A. Strafzumessung', 'I. Grundsatz', 'Strafzumessung'], fussnoten: [sek(FASSUNG_2007, 'A. Strafzumessung')] },
      { token: '48', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['A. Strafzumessung', 'I. Grundsatz', 'Strafmilderung'] },
      { token: '49', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['A. Strafzumessung', 'II. Konkurrenz', 'Retrospektive'] },
      { token: '50', gliederung: [stufe(1, 'Erstes Buch')], marginalie: ['B. Strafen', 'I. Geldstrafe', 'Anderes'] },
    ];
    for (const t of ['47', '48', '49']) expect(historieVon(f3, t)!.ereignisse[0].ueberschrift, t).toBe('A. Strafzumessung');
    expect(historieVon(f3, '50')).toBeNull();
  });

  it('«Aufgehoben» an der Überschrift wird NICHT weitergegeben; kein aufgehobenSeit und keine Widerlegung', () => {
    const f4: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(AUFGEHOBEN_2010, TITEL.label)] },
      { token: '2', gliederung: [TITEL] },
    ];
    expect(historieVon(f4, '2')).toBeNull();
    // Gemischte Fussnote: nur der Fassungs-Teil geht weiter, nie der Aufhebungs-Teil
    const f5: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(`${EINGEFUEGT_2012} ${AUFGEHOBEN_2010}`, TITEL.label)] },
      { token: '2', gliederung: [TITEL] },
    ];
    const h = historieVon(f5, '2')!;
    expect(h.ereignisse.map((e) => e.typ)).toEqual(['eingefuegt']);
    expect(h.aufgehobenSeit).toBeUndefined();
  });

  it('nicht weitergegebene Typen («Ausdruck», «Ursprünglich», «Nummerierung») bleiben am Träger', () => {
    const f6: ErbArtikel[] = [
      {
        token: '1', gliederung: [TITEL],
        fussnoten: [
          sek('Ausdruck gemäss Ziff. I des BG vom 20. März 1998, in Kraft seit 1. Aug. 2000 (AS 2000 1569).', TITEL.label),
          { ...sek('Ursprünglich Tit. vor Art. 27.', TITEL.label), nr: '2' },
        ],
      },
      { token: '2', gliederung: [TITEL] },
    ];
    expect(historieVon(f6, '2')).toBeNull();
    expect(historieVon(f6, '1')!.ereignisse.map((e) => [e.typ, e.ueberschrift])).toEqual([['ausdruck', TITEL.label], ['urspruenglich', TITEL.label]]);
  });

  // Vorgabe C (VORLÄUFIG (2.10.) — bestätigt David 3.10.2026 «Regel C bestätigt»): Überschrift-Ereignisse speisen nur die Chronik,
  // nie «giltSeit». Eine Fassungs-Fussnote an einer Überschrift ist im Wortlaut nicht von einer Neufassung des ganzen
  // Abschnitts zu unterscheiden (ZGB SchlT 51/53/56: Text von 1912, AS 1999 1118 änderte nur den Gliederungstitel).
  // «giltSeit» = Maximum der EIGENEN datierten Ereignisse; ohne eigene ⇒ null. Ersetzt die Regel B aus dem ersten Nachzug
  // (eigenes Datum gewinnt, sonst Überschrift-Maximum) und die Maximum-Regel von #1286 (deklarierte Fachänderung §6.3).
  it('Vorgabe C: «giltSeit» nur aus eigenen datierten Ereignissen; die jüngere Überschrift-Fassung rückt es nicht vor, die Chronik behält beide', () => {
    const f7: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
      { token: '2', gliederung: [TITEL], fussnoten: [fn(EINGEFUEGT_2012)] }, // eigen jünger (2012 > 1972)
      { token: '3', gliederung: [TITEL], fussnoten: [fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 1960, in Kraft seit 1. Jan. 1961 (AS 1960 1).')] }, // eigen älter
    ];
    const a2 = historieVon(f7, '2')!;
    expect(a2.giltSeit).toBe('2012-01-01');
    expect(a2.ereignisse.map((e) => e.ueberschrift)).toEqual([TITEL.label, undefined]);
    const a3 = historieVon(f7, '3')!;
    expect(a3.giltSeit).toBe('1961-01-01'); // NICHT 1972
    expect(a3.ereignisse.map((e) => [e.datum, e.ueberschrift])).toEqual([['1972-01-01', TITEL.label], ['1961-01-01', undefined]]);
  });

  it('Vorgabe C: Artikel NUR mit Überschrift-Ereignissen (auch eigene undatierte Fussnote) → giltSeit null, Chronik vollständig', () => {
    const f11: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL, ABSCHNITT1], fussnoten: [sek(FASSUNG_1972, TITEL.label), { ...sek(EINGEFUEGT_2012, ABSCHNITT1.label), nr: '2' }] },
      { token: '2', gliederung: [TITEL, ABSCHNITT1] },
      { token: '3', gliederung: [TITEL, ABSCHNITT1], fussnoten: [fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 1960 (AS 1960 1).')] },
    ];
    expect(historieVon(f11, '2')!.giltSeit).toBeNull();
    expect(historieVon(f11, '2')!.ereignisse.map((e) => e.datum)).toEqual(['1972-01-01', '2012-01-01']);
    expect(historieVon(f11, '3')!.giltSeit).toBeNull(); // eigenes Ereignis ohne Datum zählt nicht als eigenes datiertes
  });

  it('Vorgabe C: Träger-Artikel wie die Erben (eigene ältere Fassung + jüngere Überschrift-Fussnote am Träger)', () => {
    const f12: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(FASSUNG_1972, TITEL.label), { ...fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 1960, in Kraft seit 1. Jan. 1961 (AS 1960 1).'), nr: '2' }] },
      { token: '2', gliederung: [TITEL], fussnoten: [fn('Fassung gemäss Ziff. I des BG vom 1. Jan. 1960, in Kraft seit 1. Jan. 1961 (AS 1960 1).')] },
      { token: '3', gliederung: [TITEL] },
    ];
    const traeger = historieVon(f12, '1')!;
    expect(traeger.giltSeit).toBe('1961-01-01');
    expect(traeger.ereignisse.map((e) => [e.datum, e.ueberschrift])).toEqual([['1972-01-01', TITEL.label], ['1961-01-01', undefined]]);
    expect(historieVon(f12, '2')!.giltSeit).toBe(traeger.giltSeit);
    expect(historieVon(f12, '3')!.giltSeit).toBeNull(); // Erbe ohne eigenes Ereignis
  });

  // B4 (Nachzug 2.10.2026) + Entscheid David 3.10.2026 «Randtitel zählt nicht» (deklarierte fachliche Änderung §6.3):
  // Fussnote am Randtitel MIT Gliederungszeichen (ZGB 299/300 «Asexies. Stiefeltern», AS 2017 3699 änderte nur «Randtitel»)
  // speist nur die Chronik (Überschrift-Ereignis). Sachüberschrift OHNE Gliederungszeichen (VVG 47a «AHV-Nummer»,
  // NHG 3 «Pflichten von Bund und Kantonen») bleibt eigen — dort änderte der Änderungserlass auch den Körper.
  it('Randtitel zählt nicht: Fussnote am eigenen Randtitel mit Gliederungszeichen («Asexies. …») → nur Chronik, giltSeit null', () => {
    const f13: ErbArtikel[] = [
      { token: '299', gliederung: [TITEL], marginalie: ['Asexies. Stiefeltern'], fussnoten: [sek(FASSUNG_2007, 'Asexies. Stiefeltern')] },
    ];
    const h = historieVon(f13, '299')!;
    expect(h.giltSeit).toBeNull();
    expect(h.ereignisse[0]).toMatchObject({ typ: 'fassung', datum: '2007-01-01', ueberschrift: 'Asexies. Stiefeltern' });
  });

  // Entscheid David 4.10.2026 «A» hatte «Gilt seit» leer gelassen, wenn ein ÄLTERER Körper-Stand + jüngerer eigener Randtitel
  // zusammentrafen (Vorsichts-Proxy für nicht erfasste Generalanweisungen). Zurückgebaut 5.10.2026 (W2·32-GENERALANWEISUNGEN):
  // die Anweisungen sind jetzt Artikel-Ereignisse (generalanweisungen.ts), der Fussnoten-Stand gilt wieder.
  it('Randtitel zählt nicht (Proxy von Entscheid A zurückgebaut, W2·32): ein ÄLTERER eigener Körper-Eingriff (1972 < Randtitel 2007) datiert wieder, Chronik behält beide', () => {
    const f13b: ErbArtikel[] = [
      { token: '299', gliederung: [TITEL], marginalie: ['A. Stiefeltern'], fussnoten: [sek(FASSUNG_2007, 'A. Stiefeltern'), { ...fn(FASSUNG_1972), nr: '2' }] },
    ];
    const h = historieVon(f13b, '299')!;
    expect(h.giltSeit).toBe('1972-01-01');
    expect(h.ereignisse.map((e) => [e.datum, e.ueberschrift])).toEqual([['2007-01-01', 'A. Stiefeltern'], ['1972-01-01', undefined]]);
  });

  it('Randtitel zählt nicht: ein JÜNGERER oder gleich alter eigener Körper-Eingriff datiert («giltSeit» = dessen Datum)', () => {
    const koerper = (text: string): ErbArtikel[] => [
      { token: '299', gliederung: [TITEL], marginalie: ['A. Stiefeltern'], fussnoten: [sek(FASSUNG_1972, 'A. Stiefeltern'), { ...fn(text), nr: '2' }] },
    ];
    expect(historieVon(koerper(FASSUNG_2007), '299')!.giltSeit).toBe('2007-01-01'); // Körper jünger als Randtitel (1972)
    expect(historieVon(koerper(FASSUNG_1972.replace('AS 1971 1461', 'AS 1971 9999')), '299')!.giltSeit).toBe('1972-01-01'); // gleich alt, andere Fundstelle
  });

  // A3 (Delta-GP 4.10.2026, §6.7): Randtitel MIT Gliederungszeichen, der von MEHREREN Artikeln geteilt wird (OR 657 «K. Genussscheine»,
  // AS 2020 4005 → 2023), ist ein geteilter Gliederungsknoten (Vorgabe C), kein eigener Randtitel: der ältere Körper-Stand bleibt.
  it('Geteilter Randtitel mit Gliederungszeichen (OR 657-Form): giltSeit bleibt der ältere eigene Körper-Stand', () => {
    const geteilt: ErbArtikel[] = [
      { token: '657', gliederung: [TITEL], marginalie: ['K. Genussscheine', 'Begriff'], fussnoten: [sek(FASSUNG_2007, 'K. Genussscheine'), { ...fn(FASSUNG_1972), nr: '2' }] },
      { token: '658', gliederung: [TITEL], marginalie: ['K. Genussscheine', 'Rechte'] },
    ];
    expect(historieVon(geteilt, '657')!.giltSeit).toBe('1972-01-01');
    // Kontrolle: derselbe Randtitel bei genau EINEM Artikel ist ein eigener Randtitel — «Gilt seit» bleibt gleichwohl der Körper-Stand
    expect(historieVon([geteilt[0]], '657')!.giltSeit).toBe('1972-01-01');
  });

  it('Überschrift-Ereignis eines geteilten Gliederungsknotens ändert «giltSeit» nicht (Vorgabe C)', () => {
    const geteilt: ErbArtikel[] = [
      { token: '319', gliederung: [TITEL], fussnoten: [sek(FASSUNG_2007, TITEL.label), { ...fn(FASSUNG_1972), nr: '2' }] },
      { token: '320', gliederung: [TITEL] },
    ];
    expect(historieVon(geteilt, '319')!.giltSeit).toBe('1972-01-01');
  });

  it('Randtitel zählt nicht — Ausnahme: nennt eine Körper-Fussnote desselben Artikels dieselbe AS-Fundstelle («Randtitel und Abs. …»), bleibt das Datum eigen', () => {
    const koerperFn = (text: string): FnEingang => ({ ...fn(text, { absatz: '2' }), nr: '2' });
    const artikel981 = (koerper: FnEingang): ErbArtikel[] => [
      { token: '981', gliederung: [TITEL], marginalie: ['C. Kraftloserklärung'], fussnoten: [sek(FASSUNG_2007, 'C. Kraftloserklärung'), koerper] },
    ];
    const h = historieVon(artikel981(koerperFn('Aufgehoben durch Ziff. I 1 des BG vom 13. Dez. 2002, in Kraft seit 1. Jan. 2007 (AS 2006 3459; BBl 1999 1979).')), '981')!;
    expect(h.giltSeit).toBe('2007-01-01');
    expect(h.ereignisse.find((e) => e.typ === 'fassung')!.ueberschrift).toBeUndefined();
    // andere AS-Fundstelle im Körper ⇒ der Randtitel zählt nicht (eigenes Datum 2007 nicht übernommen); die Teilaufhebung des
    // Körpers zählt aber (R2-02, 5.10.2026) ⇒ 1991, nicht 2007
    const andere = artikel981(koerperFn('Aufgehoben durch Ziff. I des BG vom 1. Jan. 1990, in Kraft seit 1. Jan. 1991 (AS 1990 99).'));
    expect(historieVon(andere, '981')!.giltSeit).toBe('1991-01-01');
  });

  // H1 (Gegenprüfung GP #1298, 3.10.2026): Das Gliederungszeichen allein trägt die Regel nicht. Eine «Ausdruck»-Fussnote am
  // Randtitel (Ersatz von Ausdrücken, GTR Rz. 327–330) nennt den Randtitel nur als eine der betroffenen Stellen; der Änderungs-
  // erlass hat auch den Körper geändert. Wortlaut der Fussnoten und Anweisungen aus Fedlex (Struktur-Sidecars):
  //   ZGB 124: AS 2023 92 Anhang Ziff. 1 «In den Artikeln 124 Randtitel und Absatz 1 … «Rentenalter» … «Referenzalter»»
  //   OR 928c: AS 2021 758 Anhang Ziff. 3 «In Artikel 928c Randtitel sowie Absätze 1 und 2 …»
  //   ZGB 4:   AS 1999 1118 Ersatz von Ausdrücken, Abs. 1 nennt Art. 4 (Richter → Gericht), Abs. 2 «Randtitel von Art. 4»
  const AUSDRUCK_ZGB124 = 'Ausdruck gemäss Anhang Ziff. 1 des BG vom 17. Dez. 2021 (AHV 21), in Kraft seit 1. Jan. 2024 (AS 2023 92; BBl 2019 6305). Diese Änd. wurde in den in der AS genannten Bestimmungen vorgenommen.';
  const AUSDRUCK_OR928C = 'Ausdruck gemäss Anhang Ziff. 3 des BG vom 18. Dez. 2020 (Systematische Verwendung der AHV-Nummer durch Behörden), in Kraft seit 1. Jan. 2022 (AS 2021 758; BBl 2019 7359). Diese Änd. wurde in den in der AS genannten Bestimmungen vorgenommen.';
  const AUSDRUCK_ZGB4 = 'Ausdruck gemäss Ziff. I 1 des BG vom 26. Juni 1998, in Kraft seit 1. Jan. 2000 (AS 1999 1118; BBl 1996 I 1). Diese Änd. ist im ganzen Erlass berücksichtigt.';
  it('H1: Randtitel mit Gliederungszeichen, aber «Ausdruck»-Fussnote (ZGB 124 / OR 928c / ZGB 4) → bleibt eigen, giltSeit wie auf main', () => {
    const rt124 = 'III. Ausgleich bei Invalidenrenten vor dem reglementarischen Referenzalter';
    const f124: ErbArtikel[] = [
      { token: '124', gliederung: [TITEL], marginalie: ['D. Berufliche Vorsorge', rt124], fussnoten: [fn('Fassung gemäss Ziff. I des BG vom 19. Juni 2015 (Vorsorgeausgleich bei Scheidung), in Kraft seit 1. Jan. 2017 (AS 2016 2313; BBl 2013 4887).'), sek(AUSDRUCK_ZGB124, rt124)] },
    ];
    expect(historieVon(f124, '124')!.giltSeit).toBe('2024-01-01'); // Erstbau fälschlich 2017-01-01
    const f928: ErbArtikel[] = [{ token: '928_c', gliederung: [TITEL], marginalie: ['D. AHV-Nummer und Personennummer'], fussnoten: [sek(AUSDRUCK_OR928C, 'D. AHV-Nummer und Personennummer')] }];
    const h928 = historieVon(f928, '928_c')!;
    expect(h928.giltSeit).toBe('2022-01-01'); // Erstbau fälschlich null
    expect(h928.ereignisse[0].ueberschrift).toBeUndefined();
    const f4: ErbArtikel[] = [{ token: '4', gliederung: [TITEL], marginalie: ['III. Gerichtliches Ermessen'], fussnoten: [sek(AUSDRUCK_ZGB4, 'III. Gerichtliches Ermessen')] }];
    expect(historieVon(f4, '4')!.giltSeit).toBe('2000-01-01'); // Erstbau fälschlich null
  });

  it('H1: dieselbe Randtitel-Fassung ohne Ausdruck-Wortlaut bleibt «nur Chronik» (Kontrolle: ohne «Ausdruck gemäss» greift die Regel weiter)', () => {
    const f: ErbArtikel[] = [{ token: '4', gliederung: [TITEL], marginalie: ['III. Gerichtliches Ermessen'], fussnoten: [sek(AUSDRUCK_ZGB4.replace('Ausdruck gemäss', 'Fassung gemäss').replace(' Diese Änd. ist im ganzen Erlass berücksichtigt.', ''), 'III. Gerichtliches Ermessen')] }];
    expect(historieVon(f, '4')!.giltSeit).toBeNull();
  });

  it('B4: Fussnote an der eigenen Sachüberschrift OHNE Gliederungszeichen (Label nicht im Pfad) zählt in «giltSeit», ohne Überschrift-Herkunft', () => {
    const f13c: ErbArtikel[] = [
      { token: '47_a', gliederung: [TITEL], marginalie: ['AHV-Nummer'], fussnoten: [sek(FASSUNG_2007, 'AHV-Nummer')] },
    ];
    const h = historieVon(f13c, '47_a')!;
    expect(h.giltSeit).toBe('2007-01-01');
    expect(h.ereignisse[0].ueberschrift).toBeUndefined();
  });

  it('B4: Gliederungsknoten mit GENAU einem Artikel ist eigen; mit zwei Artikeln ist dieselbe Fussnote ein Überschrift-Ereignis', () => {
    const einzel: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL, ABSCHNITT1], fussnoten: [sek(FASSUNG_2007, ABSCHNITT1.label)] },
      { token: '2', gliederung: [TITEL, ABSCHNITT2] },
    ];
    expect(historieVon(einzel, '1')!.giltSeit).toBe('2007-01-01');
    expect(historieVon(einzel, '1')!.ereignisse[0].ueberschrift).toBeUndefined();
    const zwei: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL, ABSCHNITT1], fussnoten: [sek(FASSUNG_2007, ABSCHNITT1.label)] },
      { token: '2', gliederung: [TITEL, ABSCHNITT1] },
    ];
    expect(historieVon(zwei, '1')!.giltSeit).toBeNull();
    expect(historieVon(zwei, '1')!.ereignisse[0].ueberschrift).toBe(ABSCHNITT1.label);
  });

  // B1: nur GANZE Fassungen vererben.
  // 3.10.2026 (fachliche Änderung, Folge-Posten #1286): «Ursprünglich vor Art. 4. Fassung gemäss …» (ARGV4 2) stand hier als
  // Teil-Formel; seither schneidet `ohneUrsprungVorsatz` den reinen Ur-Vorsatz ab und vererbt die Fassung dahinter
  // (src/tests/normtext-historie-urspruenglich-vorsatz.test.ts). `ganzeFassung` selbst bleibt unverändert (Text mit Vorsatz = false).
  it('B1: Teil-Formeln («Fassung dieses Wortes», «Fassung des Randtit.», «Fassung des Tit.») werden nicht vererbt', () => {
    const TEIL = [
      'Fassung dieses Wortes gemäss Ziff. I 3 des BG vom 30. Juni 1972, in Kraft seit 1. April 1973 (AS 1972 2819; BBl 1971 I 1200).',
      'Fassung des Randtit. gemäss Ziff. I 3 des BG vom 30. Juni 1972, in Kraft seit 1. April 1973 (AS 1972 2819, 1973 92; BBl 1971 I 1200).',
      'Fassung des Tit. gemäss Ziff. I des BG vom 19. Juni 1959, in Kraft seit 1. Jan. 1960 (AS 1959 854; BBl 1958 II 1137).',
    ];
    expect(ganzeFassung('Ursprünglich vor Art. 4. Fassung gemäss Ziff. I der V vom 10. Mai 2000, in Kraft seit 1. Aug. 2000 (AS 2000 1636).')).toBe(false);
    for (const t of TEIL) {
      expect(ganzeFassung(t), t).toBe(false);
      const f: ErbArtikel[] = [
        { token: '1', gliederung: [TITEL], fussnoten: [sek(t, TITEL.label)] },
        { token: '2', gliederung: [TITEL] },
      ];
      expect(historieVon(f, '2'), t).toBeNull();
      expect(historieVon(f, '1')!.ereignisse.length, t).toBeGreaterThan(0); // am Träger bleibt es in der Chronik
    }
    for (const t of [
      FASSUNG_1972, EINGEFUEGT_2012, 'Eingefügt durch gemäss Ziff. I der V vom 10. Mai 2000, in Kraft seit 1. Aug. 2000 (AS 2000 1636).',
      'Fassung des fünften Titels gemäss Ziff. I 1 des BG vom 5. Okt. 1984, in Kraft seit 1. Jan. 1988 (AS 1986 122 153 Art. 1; BBl 1979 II 1191).',
    ]) expect(ganzeFassung(t), t).toBe(true);
  });

  // B5: kein «Fassung (undatiert)» aus einem Satzfragment.
  it('B5: «Ab 1. Jan. 2007 sind die angedrohten Strafen … in der Fassung des BG …» erzeugt kein Ereignis und wird nicht vererbt', () => {
    const PHANTOM = 'Ab 1. Jan. 2007 sind die angedrohten Strafen und die Verjährungsfristen in Anwendung von Art. 333 Abs. 2–6 des Strafgesetzbuches (SR 311.0) in der Fassung des BG vom 13. Dez. 2002 (AS 2006 3459; BBl 1999 1979) zu interpretieren beziehungsweise umzurechnen.';
    const f: ErbArtikel[] = [
      { token: '87', gliederung: [TITEL], fussnoten: [sek(PHANTOM, TITEL.label)] },
      { token: '88', gliederung: [TITEL], fussnoten: [fn(FASSUNG_2007)] },
    ];
    expect(historieVon(f, '87')).toBeNull(); // kein «Fassung (undatiert)»
    const a88 = historieVon(f, '88')!;
    expect(a88.ereignisse.map((e) => e.ueberschrift)).toEqual([undefined]);
    expect(a88.giltSeit).toBe('2007-01-01');
  });

  // B2: gestaffelt/teilweise ⇒ Erben bekommen das Ereignis OHNE Datum, mit Wortlaut.
  it('B2: gestaffelte/befristete/teilweise Überschrift-Fussnote erkennt `teilweiseFussnote`, normale nicht', () => {
    for (const t of [
      'Eingefügt durch Ziff. I des BG vom 15. Juni 2012, Abschn. 2 in Kraft seit 1. Jan. 2013, Abschn. 3 in Kraft seit 1. Jan. 2014 und Abschn. 1 in Kraft seit 1. Jan. 2019 (AS 2012 6291, 2013 4669, 2018 4985; BBl 2010 8447).',
      'Fassung gemäss Ziff. I des BG vom 19. Juni 2020 (Aktienrecht), in Kraft seit 1. Jan. 2023, Art. 734f in Kraft seit 1. Jan. 2021 (AS 2020 4005; 2022 109; BBl 2017 399).',
      'Fassung gemäss Ziff. I des BG vom 17. Dez. 2021 (AHV 21), in Kraft seit 1. Jan. 2024, Art. 40c in Kraft vom 1. Jan. 2025 bis zum 31. Dez. 2033 (AS 2023 92; BBl 2019 6305).',
      'Eingefügt durch Anhang der V vom 4. Sept. 2013, in Kraft vom 1. Okt. 2013 bis zum 28. Sept. 2015 (AS 2013 3065).',
    ]) expect(teilweiseFussnote(t), t).toBe(true);
    for (const t of [FASSUNG_1972, FASSUNG_2007, EINGEFUEGT_2012]) expect(teilweiseFussnote(t), t).toBe(false);
  });

  it('B2: Erbe bekommt `datum: null` + Wortlaut (Befristung bleibt lesbar), Träger behält sein Datum + Wortlaut, giltSeit nirgends aus der Überschrift', () => {
    const AHV21 = 'Fassung gemäss Ziff. I des BG vom 17. Dez. 2021 (AHV 21), in Kraft seit 1. Jan. 2024, Art. 40c in Kraft vom 1. Jan. 2025 bis zum 31. Dez. 2033 (AS 2023 92; BBl 2019 6305).';
    const f: ErbArtikel[] = [
      { token: '39', gliederung: [TITEL], fussnoten: [sek(AHV21, TITEL.label)] },
      { token: '40_c', gliederung: [TITEL] },
    ];
    const erbe = historieVon(f, '40_c')!;
    expect(erbe.giltSeit).toBeNull();
    expect(erbe.ereignisse).toHaveLength(1);
    expect(erbe.ereignisse[0]).toMatchObject({ typ: 'fassung', datum: null, wirkung: false, ueberschrift: TITEL.label });
    expect(erbe.ereignisse[0].teilweise).toContain('Art. 40c in Kraft vom 1. Jan. 2025 bis zum 31. Dez. 2033');
    const traeger = historieVon(f, '39')!;
    expect(traeger.ereignisse[0]).toMatchObject({ datum: '2024-01-01', ueberschrift: TITEL.label });
    expect(traeger.ereignisse[0].teilweise).toBe(erbe.ereignisse[0].teilweise);
    expect(traeger.giltSeit).toBeNull();
  });

  it('amtlich aufgehobener Artikel (Text-Shard) und Artikel mit eigener Ganzaufhebung erben nichts', () => {
    const f8: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
      { token: '2', gliederung: [TITEL] },
      { token: '3', gliederung: [TITEL], fussnoten: [fn(AUFGEHOBEN_2010)] },
    ];
    expect(historieVon(f8, '2', { snapshotAufgehoben: true })).toBeNull();
    const a3 = historieVon(f8, '3')!;
    expect(a3.aufgehobenSeit).toBe('2010-01-01');
    expect(a3.ereignisse.map((e) => e.typ)).toEqual(['aufgehoben']); // nicht um die Überschrift-Fassung ergänzt
    expect(a3.giltSeit).toBeNull();
  });

  it('zwei Überschriften mit gleichem Label, aber verschiedener Fedlex-eId («…» bei aufgehobenen Titeln) bleiben getrennt', () => {
    const u1 = { ebene: 2, label: '…', eId: 'chap_3/lvl_u1' };
    const u2 = { ebene: 2, label: '…', eId: 'chap_3/lvl_u2' };
    const f10: ErbArtikel[] = [
      { token: '37', gliederung: [stufe(1, '3. Kapitel'), u1], fussnoten: [sek(FASSUNG_1972, '…')] },
      { token: '38', gliederung: [stufe(1, '3. Kapitel'), u1] },
      { token: '43', gliederung: [stufe(1, '3. Kapitel'), u2] }, // andere Überschrift «…»: kein Erbe aus u1
    ];
    expect(sektionsErbe(f10).has('38')).toBe(true);
    expect(sektionsErbe(f10).has('43')).toBe(false);
  });

  it('Artikel ohne Gliederung lässt den offenen Pfad unberührt (wie der Baum: «ohneGliederung»)', () => {
    const f9: ErbArtikel[] = [
      { token: '1', gliederung: [TITEL], fussnoten: [sek(FASSUNG_1972, TITEL.label)] },
      { token: '2' },
      { token: '3', gliederung: [TITEL] },
    ];
    expect(sektionsErbe(f9).has('2')).toBe(false);
    expect(sektionsErbe(f9).get('3')).toHaveLength(1);
  });
});

// ── Korpus-Sonden gegen die committeten Artefakte ──────────────────────────────────────────────────────────────
const STRUKTUR = 'public/normtext/struktur/bund';
const TEXT = 'public/normtext/bund';
const HISTORIE = 'public/normtext/historie';

describe('Korpus · Knoten-Identität = baueGliederungsbaum (jeder Artikel unter einer Überschrift mit Sektions-Fussnote erbt sie)', () => {
  // Äquivalenzbeweis: der Baum, den der Leser zeigt (baueGliederungsbaum), und die Vererbung dieses Moduls beschreiben
  // dieselben Bereiche. Für JEDE Überschrift mit Sektions-Fussnote im Bund-Korpus gilt: alle Artikel im Teilbaum
  // (ausser dem Träger) haben die Fussnote in `sektionsErbe`.
  it('alle Erlasse: Teilbaum-Artikel ⊆ Erben je Überschrift-Fussnote', () => {
    let knoten = 0;
    let artikelGeprueft = 0;
    for (const datei of readdirSync(STRUKTUR).filter((f) => f.endsWith('.json'))) {
      const struktur = JSON.parse(readFileSync(`${STRUKTUR}/${datei}`, 'utf8')).artikel as Record<string, ErbArtikel>;
      const text = JSON.parse(readFileSync(`${TEXT}/${datei}`, 'utf8')) as { eintraege: NormSnapshot[] };
      const reihenfolge = new Map(text.eintraege.map((e, i) => [e.artikel, i]));
      const tokenVonArtikel = new Map(text.eintraege.map((e) => [e.artikel, tokenAusId(e.id)]));
      const folge = text.eintraege.map((e) => tokenAusId(e.id)).filter((t) => t in struktur).map((token) => ({ ...struktur[token], token }));
      const erbe = sektionsErbe(folge);
      const { sektionen } = baueGliederungsbaum(text.eintraege, struktur as never);
      const alleArtikel = (s: Sektion): NormSnapshot[] => [...s.artikel, ...s.kinder.flatMap(alleArtikel)];
      const besuche = (s: Sektion) => {
        for (const f of s.fussnoten ?? []) {
          knoten++;
          const traeger = struktur[tokenVonArtikel.get(f.artikel)!];
          const quell = traeger.fussnoten!.find((x) => x.nr === f.nr && x.sektion)!;
          const ab = reihenfolge.get(f.artikel)!;
          const eIdsTraeger = struktur[tokenVonArtikel.get(f.artikel)!].gliederung ?? [];
          for (const a of alleArtikel(s)) {
            // Nur Artikel NACH dem Träger (die Überschrift steht im Dokument vor ihm) und nicht unter einer anderen Überschrift,
            // die der Baum bloss wegen gleichen Labels («…» bei aufgehobenen Titeln) im selben Knoten führt: dort trennt die eId.
            if (a.artikel === f.artikel || reihenfolge.get(a.artikel)! < ab) continue;
            const eIds = struktur[tokenVonArtikel.get(a.artikel)!].gliederung ?? [];
            if (eIds.some((g, i) => eIdsTraeger[i]?.eId && g.eId && g.eId !== eIdsTraeger[i].eId)) continue;
            artikelGeprueft++;
            expect(erbe.get(tokenVonArtikel.get(a.artikel)!)?.includes(quell), `${datei} Art. ${a.artikel} unter «${s.label}»`).toBe(true);
          }
        }
        s.kinder.forEach(besuche);
      };
      sektionen.forEach(besuche);
    }
    expect(knoten).toBeGreaterThan(1000);
    expect(artikelGeprueft).toBeGreaterThan(5000);
  }, 120_000);
});

describe('Korpus · committete Historie-Shards (Stichprobe) und Auflösung der geerbten Ereignisse', () => {
  const lade = (erlass: string) => JSON.parse(readFileSync(`${HISTORIE}/${erlass}.json`, 'utf8')) as HistorieShard;

  it('OR Art. 320 (Zehnter Titel, Fassung 1971/72): im Shard nur als Index, nach der Auflösung als Ereignis an der Überschrift', () => {
    const shard = lade('OR');
    expect(shard.artikel['320'].erbt).toHaveLength(1);
    expect(shard.artikel['320'].ereignisse).toEqual([]); // Nutzlast: das Ereignis steht EINMAL in der Tabelle
    const h = historieFuerArtikel(shard, '320')!;
    expect(h.erbt).toBeUndefined();
    expect(h.ereignisse[0]).toMatchObject({ typ: 'fassung', datum: '1972-01-01', ueberschrift: 'Zehnter Titel: Der Arbeitsvertrag' });
    expect(h.giltSeit).toBeNull(); // Vorgabe C: die Überschrift-Fassung 1972 datiert OR 320 nicht (in #1286: '1972-01-01')
    expect(historieFuerArtikel(shard, '320')).toBe(h); // stabile Identität (memo)
  });

  it('Träger-Artikel behält sein Ereignis inline (mit Herkunft), Artikel ohne Erbe bleibt unverändert', () => {
    const shard = lade('OR');
    expect(shard.artikel['319'].erbt).toBeUndefined();
    expect(shard.artikel['319'].ereignisse[0]).toMatchObject({ typ: 'fassung', ueberschrift: 'Zehnter Titel: Der Arbeitsvertrag' });
    expect(historieFuerArtikel(shard, '319')).toBe(shard.artikel['319']);
  });

  it('loeseErbeAuf: geerbte Ereignisse stehen VOR den eigenen; fehlende Tabellen-Einträge werden übersprungen', () => {
    const E = { wirkung: false, quellen: [] as HistorieEreignis['quellen'], absatz: null, item: null };
    const a: ArtikelHistorie = { giltSeit: '2012-01-01', ereignisse: [{ ...E, typ: 'eingefuegt', datum: '2012-01-01' }], erbt: [1, 7] };
    const r = loeseErbeAuf(a, [{ ...E, typ: 'fassung', datum: '1970-01-01', ueberschrift: 'X' }, { ...E, typ: 'fassung', datum: '1972-01-01', ueberschrift: 'Y' }]);
    expect(r.ereignisse.map((e) => e.ueberschrift ?? 'eigen')).toEqual(['Y', 'eigen']);
    expect(r.erbt).toBeUndefined();
  });

  it('jeder Index in `erbt` zeigt in die Tabelle (alle Erlasse), die Tabelle enthält nur weitergebbare Typen', () => {
    let indizes = 0;
    for (const datei of readdirSync(HISTORIE).filter((f) => f.endsWith('.json'))) {
      const shard = JSON.parse(readFileSync(`${HISTORIE}/${datei}`, 'utf8')) as HistorieShard;
      const tabelle = shard.ueberschriftEreignisse ?? [];
      for (const [token, a] of Object.entries(shard.artikel)) {
        for (const i of a.erbt ?? []) {
          indizes++;
          expect(tabelle[i], `${datei} ${token}`).toBeDefined();
          expect(['fassung', 'eingefuegt'], `${datei} ${token}`).toContain(tabelle[i].typ);
          expect(tabelle[i].ueberschrift, `${datei} ${token}`).toBeTruthy();
        }
      }
    }
    expect(indizes).toBeGreaterThan(7000); // #1286: 8349 — B1 (nur ganze Fassungen) lässt 451 Teil-Formel-Erben weg (§6.3: Schwelle von 8000 auf 7000)
  });
});

// ── Nachzug 2.10.2026 (nach widerlegter Gegenprüfung): Vorgaben C, B1, B2, B4, B5 am echten Korpus ─────────────────────
describe('Korpus · Vorgaben C/B1/B2/B4/B5 (committete Shards, aufgelöst über historieFuerArtikel)', () => {
  const lade = (erlass: string) => JSON.parse(readFileSync(`${HISTORIE}/${erlass}.json`, 'utf8')) as HistorieShard;
  const hist = (erlass: string, token: string) => historieFuerArtikel(lade(erlass), token);

  it('C: ZGB SchlT 51/53/56 (Text von 1912, AS 1999 1118 änderte nur den Gliederungstitel) tragen KEIN «Gilt seit», die Chronik nennt die Überschrift', () => {
    for (const t of ['disp_u1_art_51', 'disp_u1_art_53', 'disp_u1_art_56']) {
      const h = hist('ZGB', t)!;
      expect(h.giltSeit, t).toBeNull();
      expect(h.ereignisse[0], t).toMatchObject({ typ: 'fassung', datum: '2000-01-01' });
      expect(h.ereignisse[0].ueberschrift, t).toContain('Schlusstitel');
    }
  });

  it('C: Invariante über alle Erlasse — ein «giltSeit» stammt immer aus einem EIGENEN datierten Ereignis (nie aus einer Überschrift)', () => {
    let geprueft = 0;
    for (const datei of readdirSync(HISTORIE).filter((f) => f.endsWith('.json'))) {
      const shard = JSON.parse(readFileSync(`${HISTORIE}/${datei}`, 'utf8')) as HistorieShard;
      for (const token of Object.keys(shard.artikel)) {
        const h = historieFuerArtikel(shard, token)!;
        if (!h.giltSeit) continue;
        geprueft++;
        expect(h.ereignisse.some((e) => !e.ueberschrift && e.datum === h.giltSeit), `${datei} ${token}`).toBe(true);
      }
    }
    expect(geprueft).toBeGreaterThan(10000);
  });

  it('B4: VVG 47a (Fassung 2022) und NHG 3 (Fassung 2000) behalten ihr eigenes Datum (Sachüberschrift, Änderungserlass änderte auch den Körper)', () => {
    expect(hist('VVG', '47_a')!.giltSeit).toBe('2022-01-01');
    expect(hist('NHG', '3')!.giltSeit).toBe('2014-09-01'); // damals 2000-01-01; seit Teilaufhebung-Regel (5.10.2026) 2014-09-01
  });

  it('Randtitel zählt nicht (Entscheid David 3.10.2026) + Generalanweisung: ZGB 299/300 (Randtitel «Asexies./Asepties.», 2018) → «Gilt seit» 1.1.2000 (AS 1999 1118 Gewalt → Sorge), Chronik behält 2018', () => {
    for (const token of ['299', '300']) {
      const h = hist('ZGB', token)!;
      // Der Fussnotenwert 1978 (AS 1977 237) war amtlich überholt: AS 1999 1118 S. 1143 ersetzt «Gewalt» → «Sorge» in Art. 299 und
      // 300 Abs. 1 (in Kraft 1.1.2000), ohne Vermerk am Artikel — jetzt als Anweisungs-Ereignis modelliert (W2·32).
      expect(h.giltSeit, token).toBe('2000-01-01');
      expect(h.ereignisse.some((e) => e.datum === '2000-01-01' && e.anweisung === '«Gewalt» → «Sorge»'), token).toBe(true);
      expect(h.ereignisse.some((e) => e.datum === '2018-01-01' && e.ueberschrift), token).toBe(true);
    }
  });

  it('A3: geteilte Randtitel mit Gliederungszeichen bleiben datiert: OR 657, 722, 973a, ZGB SchlT 7a^bis', () => {
    expect(hist('OR', '657')!.giltSeit).toBe('1992-07-01'); // Randtitel «K. Genussscheine» 2023 (AS 2020 4005)
    expect(hist('OR', '722')!.giltSeit).toBe('1992-07-01');
    expect(hist('OR', '973_a')!.giltSeit).toBe('2010-01-01');
    expect(hist('ZGB', 'disp_u1_art_7_a_bis')!.giltSeit).toBe('2000-01-01');
  });

  it('Randtitel zählt nicht + Generalanweisung: ZGB 310 (Randtitel «III. Aufhebung des Aufenthaltsbestimmungsrechts», AS 2014 357) → «Gilt seit» 1.1.2013, Chronik behält 2014', () => {
    const h = hist('ZGB', '310')!;
    // Am Körper steht nur die Fassung 1978 (AS 1977 237); «Vormundschaftsbehörde» → «Kindesschutzbehörde» in Art. 310 steht in
    // der Generalanweisung AS 2011 725 («Ersatz von Ausdrücken», S. 755, in Kraft 1.1.2013, ohne Vermerk am Artikel).
    expect(h.giltSeit).toBe('2013-01-01');
    expect(h.ereignisse.some((e) => e.datum === '2013-01-01' && e.anweisung)).toBe(true);
    expect(h.ereignisse.some((e) => e.datum === '2014-07-01' && e.ueberschrift)).toBe(true);
  });

  it('H1: ZGB 124, OR 928c, ZGB 4 (Randtitel mit Gliederungszeichen + «Ausdruck»-Fussnote, Änderungserlass auch im Körper) behalten ihr Datum wie auf main', () => {
    expect(hist('ZGB', '124')!.giltSeit).toBe('2024-01-01'); // AS 2023 92 Anhang Ziff. 1 «Randtitel und Absatz 1»
    expect(hist('OR', '928_c')!.giltSeit).toBe('2022-01-01'); // AS 2021 758 Anhang Ziff. 3 «Randtitel sowie Absätze 1 und 2»
    expect(hist('ZGB', '4')!.giltSeit).toBe('2000-01-01'); // AS 1999 1118 Ersatz von Ausdrücken, Abs. 1 nennt Art. 4
  });

  it('B1: ZGB 457 (Träger, «Fassung dieses Wortes» 1973) zählt nicht in «giltSeit»; ZGB 458 erbt die Teil-Formel nicht', () => {
    const shard = lade('ZGB');
    expect(shard.artikel['457'].ereignisse[0]).toMatchObject({ typ: 'fassung', datum: '1973-04-01', ueberschrift: 'A. Verwandte Erben' });
    expect(shard.artikel['457'].giltSeit).toBeNull();
    expect(shard.artikel['458']).toBeUndefined();
    expect(shard.artikel['459']).toBeUndefined();
  });

  it('B2: SVG 89c/89o, OR 734f, AHVG 40c erben die gestaffelte/befristete Überschrift-Fussnote OHNE Datum, mit Wortlaut', () => {
    const faelle: Array<[string, string, string]> = [
      ['SVG', '89_c', 'Abschn. 3 in Kraft seit 1. Jan. 2014'],
      ['SVG', '89_o', 'Abschn. 1 in Kraft seit 1. Jan. 2019'],
      ['OR', '734_f', 'Art. 734f in Kraft seit 1. Jan. 2021'],
      ['AHVG', '40_c', 'bis zum 31. Dez. 2033'],
    ];
    for (const [erlass, token, wortlaut] of faelle) {
      const h = hist(erlass, token)!;
      const e = h.ereignisse.find((x) => x.teilweise)!;
      expect(e, `${erlass} ${token}`).toMatchObject({ datum: null, wirkung: false });
      expect(e.ueberschrift, `${erlass} ${token}`).toBeTruthy();
      expect(e.teilweise, `${erlass} ${token}`).toContain(wortlaut);
      expect(h.giltSeit, `${erlass} ${token}`).toBeNull();
    }
  });

  it('B2: jedes Ereignis mit `teilweise` trägt in der Überschrift-Tabelle kein Datum (alle Erlasse)', () => {
    let n = 0;
    for (const datei of readdirSync(HISTORIE).filter((f) => f.endsWith('.json'))) {
      const shard = JSON.parse(readFileSync(`${HISTORIE}/${datei}`, 'utf8')) as HistorieShard;
      for (const e of shard.ueberschriftEreignisse ?? []) if (e.teilweise) { n++; expect(e.datum, datei).toBeNull(); expect(ganzeFassung(e.teilweise), datei).toBe(true); }
    }
    expect(n).toBeGreaterThan(5);
  });

  it('B5: AHVG 87–91 und STHG 55–61: keine «Fassung (undatiert)» aus «… in der Fassung des BG …», nichts davon vererbt', () => {
    const ahvg = lade('AHVG');
    const sthg = lade('STHG');
    for (const t of ['87', '88', '90', '91']) {
      const h = historieFuerArtikel(ahvg, t)!;
      expect(h.ereignisse.some((e) => e.typ === 'fassung' && !e.datum), `AHVG ${t}`).toBe(false);
      expect(h.ereignisse.some((e) => e.ueberschrift), `AHVG ${t}`).toBe(false);
    }
    expect(sthg.artikel['55']).toBeUndefined(); // der Phantom-Vermerk war das einzige «Ereignis» dieses Artikels
    for (const t of ['56', '57_a', '57_b', '58', '59', '60', '61']) {
      const h = historieFuerArtikel(sthg, t);
      if (!h) continue;
      expect(h.ereignisse.some((e) => e.typ === 'fassung' && !e.datum), `STHG ${t}`).toBe(false);
      expect(h.ereignisse.some((e) => e.ueberschrift), `STHG ${t}`).toBe(false);
    }
  });
});
