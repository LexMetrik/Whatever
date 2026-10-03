/**
 * W2·27-BUND-FERTIG — «Ursprünglich …»-Vorsatz vor dem B1-Anker (3.10.2026, Folge-Posten #1286).
 *
 * Fedlex vermerkt an einer Gliederungsüberschrift oft zuerst die Ur-Bezeichnung und erst danach die Fassung:
 * «Ursprünglich vor Art. 56. Fassung gemäss …». Der B1-Anker (`ganzeFassung`) verlangt «Fassung gemäss …»/«Eingefügt durch …»
 * am Textanfang; der Vorsatz liess ihn ins Leere laufen, die Artikel unter der Überschrift zeigten «nichts erfasst».
 * Fixture-Texte sind wörtlich aus den Struktur-Sidecars (`public/normtext/struktur/bund/*.json`) und am 3.10.2026 gegen die
 * in Kraft stehende Fedlex-Fassung (AKN-XML, SPARQL `dateApplicability`) als identisch belegt:
 *   EBG SR 742.101 (Konsolidierung 2026-01-01) · AHVV SR 831.101 (2026-01-01) · AIG SR 142.20 (2026-06-12) ·
 *   RVOG SR 172.010 (2025-05-01) · KVV SR 832.102 (2026-08-01) · USG SR 814.01 (2026-08-01).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { baueArtikelHistorie, sektionsAnalyse, loeseErbeAuf, ohneUrsprungVorsatz, ganzeFassung, type ArtikelHistorie, type ErbArtikel, type HistorieEreignis, type FnEingang } from '../lib/normtext/historie-parse';
import { ursprungVorsatzSchnitte } from '../lib/normtext/historie-ursprung';

// ── Echter Fedlex-Wortlaut (Vorsatz-Formen) ─────────────────────────────────────────────────────────
const EBG_59 = 'Ursprünglich vor Art. 56. Fassung gemäss Ziff. II 13 des BG vom 20. März 2009 über die Bahnreform 2, in Kraft seit 1. Jan. 2010 (AS 2009 5597; BBl 2005 2415, 2007 2681).';
const AHVV_66BIS = 'Ursprünglich Bst. D, danach Bst. E. Eingefügt durch Ziff. I des BRB vom 10. Jan. 1969 (AS 1969 125). Fassung gemäss Ziff. I der V vom 5. April 1978, in Kraft seit 1. Jan. 1979 (AS 1978 420).';
const AIG_111A = 'Ursprünglich: 14bis., dann 14b. Kap. Eingefügt durch Art. 127 hiernach, in Kraft seit 12. Dez. 2008 (AS 2008 5405 Art. 2 Bst. a).';
const RVOG_62A = 'Ursprünglich Zweites Kapitelbis. Eingefügt durch Ziff. I 1 des BG vom 18. Juni 1999 über die Koordination und Vereinfachung von Entscheidverfahren, in Kraft seit 1. Jan. 2000 (AS 1999 3071; BBl 1998 2591).';
const KVV_59B = 'Ursprünglich vor Art. 59a. Eingefügt durch Ziff. I der V vom 17. Sept. 1997 (AS 1997 2272). Fassung gemäss Ziff. I der V vom 26. Nov. 2025 (Kosten- und Qualitätsziele), in Kraft seit 1. Jan. 2026 (AS 2025 834).';
const USG_30 = 'Ursprünglich 3. Kap. Fassung gemäss Ziff. I des BG vom 21. Dez. 1995, in Kraft seit 1. Juli 1997 (AS 1997 1155; BBl 1993 II 1445).';
// Ohne Anker nach dem Vorsatz: bleibt unverändert (AHVV 28: datiert die VERSETZUNG, EMRK 52: «Bereinigt», kein Fassungs-Anker).
const AHVV_28 = 'Ursprünglich Tit. vor Art. 27; hierher versetzt gemäss Ziff. II Abs. 2 des BRB vom 19. Nov. 1965, in Kraft seit 1. Jan. 1966 (AS 1965 1021).';
const EMRK_52 = 'Ursprünglich: Abschn. V. Bereinigt gemäss Art. 2 des Prot. Nr. 11 vom 11. Mai 1994, von der BVers genehmigt am 12. Juni 1995 und in Kraft seit 1. Nov. 1998 (AS 1998 2993 2992; BBl 1995 I 999).';
const REINER_URSPRUNG = 'Ursprünglich vor Art. 27.';

const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ nr: '1', text, links: [], absatz: null, item: null, ...extra });
const stufe = (ebene: number, label: string) => ({ ebene, label });

describe('ohneUrsprungVorsatz · schneidet nur einen reinen Ur-Vorsatz vor einem gültigen B1-Anker ab', () => {
  it.each([
    ['EBG 59 «vor Art. 56»', EBG_59, 'Fassung gemäss Ziff. II 13 des BG vom 20. März 2009'],
    ['AHVV 66bis «Bst. D, danach Bst. E»', AHVV_66BIS, 'Eingefügt durch Ziff. I des BRB vom 10. Jan. 1969'],
    ['AIG 111a «Ursprünglich: 14bis., dann 14b. Kap.» (Abkürzungs-Punkt im Vorsatz)', AIG_111A, 'Eingefügt durch Art. 127 hiernach'],
    ['RVOG 62a «Zweites Kapitelbis»', RVOG_62A, 'Eingefügt durch Ziff. I 1 des BG vom 18. Juni 1999'],
    ['KVV 59b «vor Art. 59a» (Eingefügt + Fassung)', KVV_59B, 'Eingefügt durch Ziff. I der V vom 17. Sept. 1997'],
    ['USG 30 «3. Kap.»', USG_30, 'Fassung gemäss Ziff. I des BG vom 21. Dez. 1995'],
  ])('%s', (_name, text, restBeginnt) => {
    expect(ganzeFassung(text), 'vorher: kein Anker am Textanfang').toBe(false);
    const rest = ohneUrsprungVorsatz(text);
    expect(rest.startsWith(restBeginnt)).toBe(true);
    expect(ganzeFassung(rest)).toBe(true);
    expect(text.endsWith(rest)).toBe(true); // nur Vorsatz weg, Rest unverändert (kein Wortlaut verloren)
  });

  it('ohne Anker nach dem Vorsatz bleibt der Text unverändert', () => {
    for (const t of [AHVV_28, EMRK_52, REINER_URSPRUNG]) expect(ohneUrsprungVorsatz(t)).toBe(t);
  });

  it('Texte ohne Ursprünglich-Kopf bleiben unverändert (auch mit Anker)', () => {
    const t = 'Fassung gemäss Ziff. I des BG vom 3. Okt. 2003, in Kraft seit 1. Juli 2004 (AS 2004 2767; BBl 2002 8060).';
    expect(ohneUrsprungVorsatz(t)).toBe(t);
    expect(ursprungVorsatzSchnitte(t)).toEqual([]);
    // «Ursprünglicher Abs. …» ist ein anderes Wort
    const u = 'Ursprünglicher Abs. 3. Fassung gemäss Ziff. I des BG vom 3. Okt. 2003, in Kraft seit 1. Juli 2004.';
    expect(ohneUrsprungVorsatz(u)).toBe(u);
  });

  it('nennt der Vorsatz selbst ein weiteres Ereignis (Berichtigt/Bereinigt), wird nicht geschnitten (§8)', () => {
    const t = 'Ursprünglich vor Art. 5. Berichtigt gemäss BBl 2001 1. Fassung gemäss Ziff. I der V vom 5. April 1978, in Kraft seit 1. Jan. 1979 (AS 1978 420).';
    expect(ohneUrsprungVorsatz(t)).toBe(t);
  });

  it('Anker mitten im Text (Satzfragment) zählt nicht: «… in der Fassung des BG …» bleibt unverändert', () => {
    const t = 'Ursprünglich vor Art. 5. Der Titel steht in der Fassung des BG vom 1. Jan. 2000.';
    expect(ohneUrsprungVorsatz(t)).toBe(t);
  });
});

describe('Vererbung: Fussnote mit Ursprünglich-Vorsatz an der Überschrift gilt für alle Artikel darunter', () => {
  const KAP7 = stufe(2, '7. Kapitel: Hilfe bei grossen Naturschäden');
  const KAP8 = stufe(2, '8. Kapitel: Weitere Bestimmungen');
  const folge: ErbArtikel[] = [
    { token: '59', gliederung: [KAP7], fussnoten: [fn(EBG_59, { sektion: KAP7.label })] },
    { token: '60', gliederung: [KAP7] },
    { token: '61', gliederung: [KAP7] },
    { token: '62', gliederung: [KAP8] },
  ];
  const historieVon = (token: string) => {
    const a = folge.find((x) => x.token === token)!;
    const { erbe, geteilt } = sektionsAnalyse(folge);
    return baueArtikelHistorie(a.fussnoten, { geerbt: erbe.get(token), geteilteUeberschriften: geteilt.get(token) ?? new Set<string>() }).historie;
  };

  it('Folge-Artikel 60/61 tragen die Fassung 1.1.2010 mit Herkunfts-Label — nicht «nichts erfasst»', () => {
    for (const token of ['60', '61']) {
      const h = historieVon(token);
      expect(h, token).not.toBeNull();
      expect(h!.ereignisse, token).toHaveLength(1);
      expect(h!.ereignisse[0]).toMatchObject({ typ: 'fassung', datum: '2010-01-01', ueberschrift: KAP7.label });
      expect(h!.giltSeit, 'Regel C: Überschrift-Ereignis zählt nie in «giltSeit»').toBeNull();
    }
  });

  it('der Ur-Vorsatz selbst («vor Art. 56») wird NICHT an die Artikel darunter weitergegeben (beschreibt die Überschrift)', () => {
    expect(historieVon('60')!.ereignisse.map((e) => e.typ)).not.toContain('urspruenglich');
    // am Träger-Artikel bleibt er (eigene Fussnote)
    expect(historieVon('59')!.ereignisse.map((e) => e.typ)).toContain('urspruenglich');
  });

  it('Artikel ausserhalb des Bereichs (8. Kapitel) erbt nichts', () => {
    expect(historieVon('62')).toBeNull();
  });

  it('Eingefügt + Fassung (KVV 59b): beide Ereignisse vererbt, Fassung datiert, kein Teil-Skopus', () => {
    const f2: ErbArtikel[] = [
      { token: '59_b', gliederung: [KAP7], fussnoten: [fn(KVV_59B, { sektion: KAP7.label })] },
      { token: '60', gliederung: [KAP7] },
    ];
    const { erbe, geteilt } = sektionsAnalyse(f2);
    const h = baueArtikelHistorie(undefined, { geerbt: erbe.get('60'), geteilteUeberschriften: geteilt.get('60') ?? new Set<string>() }).historie!;
    expect(h.ereignisse.map((e) => [e.typ, e.datum])).toEqual([['eingefuegt', null], ['fassung', '2026-01-01']]);
    expect(h.ereignisse.every((e) => e.ueberschrift === KAP7.label && !e.teilweise)).toBe(true);
  });

  it('ohne Anker nach dem Vorsatz (AHVV 28) bleibt es bei «nichts erfasst»', () => {
    const f3: ErbArtikel[] = [
      { token: '28', gliederung: [KAP7], fussnoten: [fn(AHVV_28, { sektion: KAP7.label })] },
      { token: '29', gliederung: [KAP7] },
    ];
    const { erbe } = sektionsAnalyse(f3);
    const h = baueArtikelHistorie(undefined, { geerbt: erbe.get('29') }).historie;
    expect(h).toBeNull();
  });
});

describe('Korpus-Zusicherung (committete Historie-Shards)', () => {
  interface Shard { ueberschriftEreignisse: HistorieEreignis[]; artikel: Record<string, ArtikelHistorie> }
  const shard = (key: string): Shard => JSON.parse(readFileSync(`public/normtext/historie/${key}.json`, 'utf8'));
  const chronik = (key: string, token: string) => {
    const s = shard(key);
    const a = s.artikel[token];
    return a ? loeseErbeAuf(a, s.ueberschriftEreignisse).ereignisse : [];
  };

  it('USG Art. 31 (unter «4. Kapitel: Abfälle», Träger Art. 30: «Ursprünglich 3. Kap. Fassung gemäss …») zeigt die Fassung 1.7.1997', () => {
    const ev = chronik('USG', '31');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ typ: 'fassung', datum: '1997-07-01', ueberschrift: '4. Kapitel: Abfälle' });
    expect(shard('USG').artikel['31'].giltSeit ?? null).toBeNull(); // Regel C
  });

  it('RVOG Art. 62b (unter «Viertes Kapitel», Träger 62a: «Ursprünglich Zweites Kapitelbis. Eingefügt durch …») zeigt die Einfügung 1.1.2000', () => {
    const ev = chronik('RVOG', '62_b');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ typ: 'eingefuegt', datum: '2000-01-01', ueberschrift: 'Viertes Kapitel: Konzentriertes Entscheidverfahren' });
  });
});

// ── Nachzug Gegenprüfung PR #1300 (3.10.2026): Mutanten M3/M4/M9 und Klein-Verb-Randfall ────────────────────────
// Die Fixtures dieses Blocks sind SYNTHETISCH (nicht Fedlex-Wortlaut): sie erzwingen die Grenzfälle der Schnitt-Grammatik,
// die der echte Korpus (3.10.2026: 279 «Ursprünglich»-Fussnoten, Messung im PR-Body) nicht belegt.
describe('Satzgrenze (historie-ursprung): Grossbuchstabe nach dem Punkt, Textreihenfolge, Umlaut-Anfang', () => {
  const T_ZWEI = 'Ursprünglich vor Art. 4. Fassung gemäss Ziff. I der V vom 5. April 1978 (AS 1978 420). Eingefügt durch Ziff. II der V vom 6. Mai 1979 (AS 1979 1).';

  it('M4 (letzter statt erster Kandidat): Kandidaten in Textreihenfolge, gewählt wird der ERSTE gültige Schnitt', () => {
    const k = ursprungVorsatzSchnitte(T_ZWEI);
    expect(k[0].vorsatz).toBe('Ursprünglich vor Art. 4.');
    const zweiter = k.find((x) => x.rest.startsWith('Eingefügt durch Ziff. II'));
    expect(zweiter, 'ein ZWEITER, ebenfalls ankerförmiger Kandidat existiert').toBeDefined();
    expect(ganzeFassung(zweiter!.rest)).toBe(true);
    expect(k.indexOf(zweiter!)).toBeGreaterThan(0);
    const rest = ohneUrsprungVorsatz(T_ZWEI);
    expect(rest.startsWith('Fassung gemäss Ziff. I der V vom 5. April 1978')).toBe(true);
    expect(rest.endsWith('(AS 1979 1).')).toBe(true); // alles hinter dem ersten Schnitt bleibt, nichts wird verschluckt
  });

  it.each([
    ['Abkürzung + Kleinbuchstabe vor «eingefügt durch»', 'Ursprünglich Abschn. 2 Bst. a. eingefügt durch Ziff. I des BG vom 3. Okt. 2003, in Kraft seit 1. Juli 2004 (AS 2004 2767).'],
    ['Abkürzung + Ziffer vor «Fassung gemäss» (Ordnungsnummer-Präfix des Ankers)', 'Ursprünglich vor Art. 4 Fassung gemäss Ziff. I des BG vom 3. Okt. 2003, in Kraft seit 1. Juli 2004 (AS 2004 2767).'],
  ])('M3 (Satzgrenze ohne Grossbuchstaben-Bedingung): %s — kein Schnitt', (_n, t) => {
    expect(ursprungVorsatzSchnitte(t).every((k) => /^[A-ZÄÖÜ]/.test(k.rest)), 'jeder Rest beginnt mit Grossbuchstabe').toBe(true);
    expect(ohneUrsprungVorsatz(t)).toBe(t);
  });

  it('M9 (nur [A-Z] ohne Umlaute): Sätze mit Ä/Ö/Ü-Anfang sind Schnitt-Kandidaten, der Schnitt davor bleibt der richtige', () => {
    const t = 'Ursprünglich vor Art. 4. Änderung gemäss Ziff. I. Öffentlicher Titel. Übergang. Fassung gemäss Ziff. I der V vom 5. April 1978, in Kraft seit 1. Jan. 1979 (AS 1978 420).';
    const anfaenge = ursprungVorsatzSchnitte(t).map((k) => k.rest[0]);
    for (const u of ['Ä', 'Ö', 'Ü']) expect(anfaenge, `Kandidat mit Rest «${u}…»`).toContain(u);
    const rest = ohneUrsprungVorsatz(t);
    expect(rest.startsWith('Fassung gemäss Ziff. I der V vom 5. April 1978')).toBe(true);
    expect(ganzeFassung(rest)).toBe(true);
  });
});

describe('Vorsatz-Verb-Prüfung: gross/klein-unabhängig, «versetzt»/«verschoben» sind Ereignisse (§8: lieber nichts vererben)', () => {
  const FASSUNG = 'Fassung gemäss Ziff. I der V vom 5. April 1978, in Kraft seit 1. Jan. 1979 (AS 1978 420).';
  it.each([
    ['«…, berichtigt gemäss …» (klein)', `Ursprünglich vor Art. 4, berichtigt gemäss BBl 2001 1. ${FASSUNG}`],
    ['«…; hierher versetzt gemäss …»', `Ursprünglich Tit. vor Art. 27; hierher versetzt gemäss Ziff. II Abs. 2 des BRB vom 19. Nov. 1965. ${FASSUNG}`],
    ['«…; nach Art. 9 verschoben gemäss …»', `Ursprünglich Tit. vor Art. 27; nach Art. 9 verschoben gemäss Ziff. II des BRB vom 19. Nov. 1965. ${FASSUNG}`],
  ])('%s: Vorsatz ist keine reine Ur-Bezeichnung — Text bleibt unverändert', (_n, t) => {
    expect(ursprungVorsatzSchnitte(t).some((k) => k.rest === FASSUNG), 'Anker wäre dahinter vorhanden').toBe(true);
    expect(ohneUrsprungVorsatz(t)).toBe(t);
  });

  it('Gegenprobe: ein reiner Ur-Vorsatz mit Kleinwörtern wird weiterhin geschnitten', () => {
    const t = `Ursprünglich vor Art. 4, danach unter dem 2. Titel. ${FASSUNG}`;
    expect(ohneUrsprungVorsatz(t)).toBe(FASSUNG);
  });
});
