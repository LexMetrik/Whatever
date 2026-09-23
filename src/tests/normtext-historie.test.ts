import { describe, it, expect } from 'vitest';
import {
  parseFussnoteHistorie,
  baueArtikelHistorie,
  type FnEingang,
} from '../lib/normtext/historie-parse';

// G-HIST · Parser-Grammatik der artikel-genauen In-Kraft-/Änderungshistorie aus
// der gespeicherten Fussnoten-Prosa (src/lib/normtext/historie-parse.ts).
// Deckt die Kern-Muster (Fassung/Eingefügt/Aufgehoben/Ausdruck/…), die belegten
// Korpus-Randfälle (Doppel-«seit seit», «seit.», fehlendes «in», volle
// Monatsnamen, Mehrfach-Ereignis je Fussnote) UND den ehrlichen unparsed-Pfad.

const fn = (text: string, extra: Partial<FnEingang> = {}): FnEingang => ({ text, links: [], absatz: null, item: null, ...extra });

describe('parseFussnoteHistorie — Kern-Ereignistypen', () => {
  it('«Fassung gemäss …, in Kraft seit …» → fassung + ISO-Datum', () => {
    const r = parseFussnoteHistorie(fn('Fassung gemäss Ziff. II Art. 1 Ziff. 1 des BG vom 25. Juni 1971, in Kraft seit 1. Jan. 1972 (AS 1971 1465; BBl 1967 II 241).'));
    expect(r.klasse).toBe('ereignis');
    expect(r.ereignisse).toHaveLength(1);
    expect(r.ereignisse[0].typ).toBe('fassung');
    expect(r.ereignisse[0].datum).toBe('1972-01-01');
    expect(r.ereignisse[0].wirkung).toBe(false);
  });

  it('«Eingefügt durch …, in Kraft seit 1. Juli 1991» → eingefuegt + Datum', () => {
    const r = parseFussnoteHistorie(fn('Eingefügt durch Ziff. I des BG vom 5. Okt. 1990, in Kraft seit 1. Juli 1991 (AS 1991 846).'));
    expect(r.ereignisse[0].typ).toBe('eingefuegt');
    expect(r.ereignisse[0].datum).toBe('1991-07-01');
  });

  it('«Aufgehoben durch …, mit Wirkung seit …» → aufgehoben + wirkung=true', () => {
    const r = parseFussnoteHistorie(fn('Aufgehoben durch Anhang Ziff. 2 des BG vom 19. Dez. 2003 über die elektronische Signatur, mit Wirkung seit 1. Jan. 2005 (AS 2004 5085; BBl 2001 5679).'));
    expect(r.ereignisse[0].typ).toBe('aufgehoben');
    expect(r.ereignisse[0].datum).toBe('2005-01-01');
    expect(r.ereignisse[0].wirkung).toBe(true);
  });

  it('«Ausdruck gemäss …» → ausdruck (Begriff im ganzen Text)', () => {
    const r = parseFussnoteHistorie(fn('Ausdruck gemäss Ziff. I 1 des BG vom 26. Juni 1998, in Kraft seit 1. Jan. 2000 (AS 1999 1118; BBl 1996 I 1). Diese Änd. ist im ganzen Erlass berücksichtigt.'));
    expect(r.ereignisse[0].typ).toBe('ausdruck');
    expect(r.ereignisse[0].datum).toBe('2000-01-01');
  });

  it('«Angenommen in der Volksabstimmung vom …» → angenommen (BV)', () => {
    const r = parseFussnoteHistorie(fn('Angenommen in der Volksabstimmung vom 9. Febr. 2014, in Kraft seit 1. Jan. 2021 (AS 2020 4231; BBl 2011 6269).'));
    expect(r.ereignisse[0].typ).toBe('angenommen');
    expect(r.ereignisse[0].datum).toBe('2021-01-01');
  });

  it('«Ursprünglich Art. 12» → urspruenglich, undatiert', () => {
    const r = parseFussnoteHistorie(fn('Ursprünglich Art. 12'));
    expect(r.ereignisse[0].typ).toBe('urspruenglich');
    expect(r.ereignisse[0].datum).toBeNull();
  });
});

describe('parseFussnoteHistorie — Randfälle des Korpus', () => {
  it('belegter Doppel-«seit seit»-Tippfehler (BVG 34a) trennt das Datum nicht ab', () => {
    const r = parseFussnoteHistorie(fn('Fassung gemäss Ziff. I des BG vom 17. Dez. 2010, in Kraft seit seit 1. Jan. 2017 (AS 2016 935).'));
    expect(r.ereignisse[0].datum).toBe('2017-01-01');
  });

  it('belegtes «seit.» (Punkt statt Leerzeichen, AVIV 99)', () => {
    const r = parseFussnoteHistorie(fn('Aufgehoben durch Ziff. I der V vom 28. Mai 2003, mit Wirkung seit. 1. Jan. 2001 (AS 2000 3097).'));
    expect(r.ereignisse[0].datum).toBe('2001-01-01');
  });

  it('fehlendes «in» vor «Kraft seit»', () => {
    const r = parseFussnoteHistorie(fn('Fassung gemäss Anhang Ziff. 3 des BG vom 22. Juni 2007, Kraft seit 1. Juli 2008 (AS 2008 2551; BBl 2006 1).'));
    expect(r.ereignisse[0].datum).toBe('2008-07-01');
  });

  it('voll ausgeschriebener Monatsname («1. Januar 1995»)', () => {
    const r = parseFussnoteHistorie(fn('Fassung gemäss Ziff. I des BG vom 6. Okt. 1994, in Kraft seit 1. Januar 1995 (AS 1994 2379).'));
    expect(r.ereignisse[0].datum).toBe('1995-01-01');
  });

  it('mehrere Ereignisse in EINER Fussnote (eingefügt undatiert + spätere Fassung) — Dokumentreihenfolge bleibt', () => {
    const r = parseFussnoteHistorie(fn('Eingefügt durch Anhang Ziff. 2 des BG vom 19. Dez. 2003 (AS 2004 5085; BBl 2001 5679). Fassung gemäss Anhang Ziff. II 4 des BG vom 18. März 2016, in Kraft seit 1. Jan. 2017 (AS 2016 4651; BBl 2014 1001).'));
    expect(r.ereignisse.map((e) => e.typ)).toEqual(['eingefuegt', 'fassung']);
    expect(r.ereignisse[0].datum).toBeNull();
    expect(r.ereignisse[1].datum).toBe('2017-01-01');
  });

  it('datierte In-Kraft-Klausel ohne Verb-Kopf → generisches inkraft-Ereignis', () => {
    const r = parseFussnoteHistorie(fn('Gemäss Ziff. II 13 des BG vom 20. März 2009 über die Bahnreform 2, in Kraft seit 1. Jan. 2010, wurden die Randtitel angepasst.'));
    expect(r.klasse).toBe('ereignis');
    expect(r.ereignisse[0].typ).toBe('inkraft');
    expect(r.ereignisse[0].datum).toBe('2010-01-01');
  });

  it('Quellen (AS/BBl) werden mit ihrem amtlichen Link aufgelöst', () => {
    const r = parseFussnoteHistorie(fn(
      'Fassung gemäss Anhang Ziff. II 4 des BG vom 18. März 2016, in Kraft seit 1. Jan. 2017 (AS <b>2016</b> 4651; BBl <b>2014</b> 1001).',
      { links: [
        { label: 'AS <b>2016</b> 4651', url: 'https://fedlex.data.admin.ch/eli/oc/2016/752' },
        { label: 'BBl <b>2014</b> 1001', url: 'https://fedlex.data.admin.ch/eli/fga/2014/171' },
      ] },
    ));
    expect(r.ereignisse[0].quellen).toEqual([
      { label: 'AS 2016 4651', url: 'https://fedlex.data.admin.ch/eli/oc/2016/752' },
      { label: 'BBl 2014 1001', url: 'https://fedlex.data.admin.ch/eli/fga/2014/171' },
    ]);
  });
});

describe('parseFussnoteHistorie — Nicht-Ereignisse & unparsed (§8)', () => {
  it('reiner SR-Verweis → referenz, kein Ereignis', () => {
    const r = parseFussnoteHistorie(fn('SR 943.03'));
    expect(r.klasse).toBe('referenz');
    expect(r.ereignisse).toHaveLength(0);
  });

  it('«Siehe auch …» → referenz', () => {
    expect(parseFussnoteHistorie(fn('Siehe auch die Schl- und UeB des X. Tit.')).klasse).toBe('referenz');
  });

  it('redaktionelle Notiz ohne Datum → referenz', () => {
    expect(parseFussnoteHistorie(fn('Die Änderungen können unter der genannten AS-Adresse konsultiert werden.')).klasse).toBe('referenz');
  });

  it('nicht sicher klassifizierbarer Text → unparsed mit Roh-Text (nie stilles Weglassen)', () => {
    const roh = 'Im französischen und italienischen Text besteht dieser Artikel aus einem einzigen Absatz.';
    const r = parseFussnoteHistorie(fn(roh));
    expect(r.klasse).toBe('unparsed');
    expect(r.roh).toBe(roh);
    expect(r.ereignisse).toHaveLength(0);
  });

  it('erfindet NIE ein Datum: unvollständige Klausel «in Kraft seit 1. Juli (AS …)» ohne Jahr → kein Datum', () => {
    const r = parseFussnoteHistorie(fn('Fassung gemäss Ziff. I des BG, in Kraft seit 1. Juli (AS 1981 538).'));
    // Verb-Kopf erkannt (Ereignis), aber Datum ehrlich null — kein geratenes Jahr.
    expect(r.ereignisse[0].typ).toBe('fassung');
    expect(r.ereignisse[0].datum).toBeNull();
  });
});

describe('baueArtikelHistorie — Per-Artikel-Projektion', () => {
  it('giltSeit = jüngstes datiertes Textänderungs-Ereignis', () => {
    const { historie } = baueArtikelHistorie([
      fn('Eingefügt durch BG vom 5. Okt. 1990, in Kraft seit 1. Juli 1991 (AS 1991 846).'),
      fn('Fassung gemäss BG vom 18. März 2016, in Kraft seit 1. Jan. 2017 (AS 2016 4651).'),
    ]);
    expect(historie?.giltSeit).toBe('2017-01-01');
  });

  it('Ganz-Artikel-Aufhebung (Artikelebene) → aufgehobenSeit; Absatz-Aufhebung NICHT', () => {
    const ganz = baueArtikelHistorie([fn('Aufgehoben durch BG vom 19. Dez. 2003, mit Wirkung seit 1. Jan. 2005 (AS 2004 5085).', { absatz: null })]);
    expect(ganz.historie?.aufgehobenSeit).toBe('2005-01-01');
    expect(ganz.historie?.giltSeit).toBeNull();
    const absatz = baueArtikelHistorie([fn('Aufgehoben durch BG vom 19. Dez. 2003, mit Wirkung seit 1. Jan. 2005 (AS 2004 5085).', { absatz: '2' })]);
    expect(absatz.historie?.aufgehobenSeit).toBeUndefined();
  });

  it('Artikel nur mit Verweis-Fussnoten → keine Historie (Fallback = Erlass-Ur-Datum)', () => {
    const { historie, refCount } = baueArtikelHistorie([fn('SR 943.03'), fn('Siehe auch Art. 5.')]);
    expect(historie).toBeNull();
    expect(refCount).toBe(2);
  });

  it('zählt unparsed-Residuen je Artikel (§8)', () => {
    const { unparsed } = baueArtikelHistorie([
      fn('Fassung gemäss BG vom 18. März 2016, in Kraft seit 1. Jan. 2017 (AS 2016 4651).'),
      fn('Ein völlig unerwarteter Satz ganz ohne Muster xyz.'),
    ]);
    expect(unparsed).toHaveLength(1);
  });
});

// ─── RL-11 (Befund R2-01, Prüfung Rechtslogik 23.9.2026) ──────────────────────
// «Aufgehoben seit …» nur bei echter Artikelaufhebung. Fixtures = amtliche
// Fussnoten-Texte wörtlich aus den Struktur-Sidecars (public/normtext/struktur/
// bund/*.json, extrahiert aus den Fedlex-Filestore-HTMLs der gepinnten
// Konsolidierung); Anker-Ort wie im Sidecar (absatz/item/absatzIndex).
describe('baueArtikelHistorie — RL-11 «Aufgehoben seit» nur bei echter Artikelaufhebung', () => {
  // AVIG Art. 60 (SR 837.0, Fedlex Stand 1.1.2026): Fn 217 hängt an der aufgehobenen
  // Sachüberschrift «…» (<h6>…Art. 60[216] …[217]</h6>); Abs. 1 gilt in der Fassung
  // «in Kraft seit 1. Jan. 2026» (AS 2025 764).
  const avig60: FnEingang[] = [
    fn('Fassung gemäss Ziff. I des BG vom 22. März 2002, in Kraft seit 1. Juli 2003 (AS 2003 1728; BBl 2001 2245).'),
    fn('Aufgehoben durch Ziff. I des BG vom 19. März 2010, mit Wirkung seit 1. April 2011 (AS 2011 1167; BBl 2008 7733).'),
    fn('Fassung gemäss Ziff. I des BG vom 14. Juni 2024 (Entschädigungssystem der Arbeitslosenkassen), in Kraft seit 1. Jan. 2026 (AS 2025 764; BBl 2023 2862).', { absatz: '1' }),
    fn('Fassung gemäss Ziff. I des BG vom 19. März 2010, in Kraft seit 1. April 2011 (AS 2011 1167; BBl 2008 7733).', { absatz: '2', item: 'b' }),
    fn('Fassung gemäss Ziff. I des BG vom 29. Sept. 2023 (Kurzarbeitsentschädigung für Berufsbildnerinnen und Berufsbildner), in Kraft seit 1. Jan. 2024 (AS 2024 38; BBl 2023 577).', { absatz: '5' }),
    fn('Eingefügt durch Ziff. I des BG vom 22. März 2002, in Kraft seit 1. Juli 2003 (AS 2003 1728; BBl 2001 2245).'),
  ];

  it('AVIG Art. 60 (SR 837.0): Sachüberschrift-Aufhebung 2011 + Abs.-1-Fassung 2026 → kein aufgehobenSeit, giltSeit 2026-01-01', () => {
    const { historie } = baueArtikelHistorie(avig60);
    expect(historie?.aufgehobenSeit).toBeUndefined();
    expect(historie?.giltSeit).toBe('2026-01-01');
  });

  it('EOG Art. 1a (SR 834.1): Kopf-Aufhebung 2005, spätere Fassungen (Abs. 1bis 2026) → kein aufgehobenSeit', () => {
    const { historie } = baueArtikelHistorie([
      fn('Eingefügt durch Anhang Ziff. 14 des BG vom 6. Okt. 2000 über den Allgemeinen Teil des Sozialversicherungsrechts, in Kraft seit 1. Jan. 2003 (AS 2002 3371; BBl 1991 II 185 910, 1994 V 921, 1999 4523).'),
      fn('Aufgehoben durch Ziff. I des BG vom 3. Okt. 2003, mit Wirkung seit 1. Juli 2005 (AS 2005 1429; BBl 2002 7522, 2003 1112 2923).'),
      fn('Fassung gemäss Anhang Ziff. 4 des BG vom 19. Dez. 2025, in Kraft seit 1. Juni 2026 (AS 2026 164; BBl 2025 960).', { absatz: '1bis' }),
      fn('Fassung gemäss Ziff. I des BG vom 14. Juni 2024 (Digitalisierung in der Erwerbsersatzordnung), in Kraft seit 1. Jan. 2025 (AS 2024 681; BBl 2023 2245).', { absatz: '4' }),
    ]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
    expect(historie?.giltSeit).toBe('2026-06-01');
  });

  it('BBV Art. 66 (SR 412.101): Kopf-Aufhebung 2018 + Abs.-1-Fassung 2025 → kein aufgehobenSeit', () => {
    const { historie } = baueArtikelHistorie([
      fn('Aufgehoben durch Ziff. I der V vom 15. Sept. 2017, mit Wirkung seit 1. Jan. 2018 (AS 2017 5147).'),
      fn('Fassung gemäss Ziff. I der V vom 29. Jan. 2025, in Kraft seit 1. März 2025 (AS 2025 82).', { absatz: '1' }),
      fn('Aufgehoben durch Ziff. I der V vom 29. Jan. 2025, mit Wirkung seit 1. März 2025 (AS 2025 82).', { absatz: '2' }),
    ]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
    expect(historie?.giltSeit).toBe('2025-03-01');
  });

  it('Neufassung am selben Stichtag wie die Kopf-Aufhebung (Sachüberschrift) → kein aufgehobenSeit', () => {
    // Aus AVIG 60 abgeleitet: Fn 217 (Aufhebung 1.4.2011) + Fn 219 (Fassung 1.4.2011, gleiche AS).
    const { historie } = baueArtikelHistorie([avig60[1], avig60[3]]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
  });

  it('AVIG Art. 45 (SR 837.0): Absatz-Range «2–3 …» (Marker im Körper-Block, absatzIndex) → Teil-Skopus, kein aufgehobenSeit', () => {
    const { historie } = baueArtikelHistorie([
      fn('Aufgehoben durch Ziff. I des BG vom 5. Okt. 1990, mit Wirkung seit 1. Jan. 1992 (AS 1991 2125; BBl 1989 III 377).', { absatzIndex: 1 }),
    ]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
  });

  it('MStG Art. 145 (SR 321.0): Ziffer-Aufhebung im Körper (absatzIndex) → Teil-Skopus, kein aufgehobenSeit', () => {
    const { historie } = baueArtikelHistorie([
      fn('Aufgehoben durch Ziff. I 2 des BG vom 23. März 1979, mit Wirkung seit 1. Jan. 1980 (AS 1979 1037; BBl 1979 II 1).', { absatzIndex: 8 }),
    ]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
  });

  it('«Gliederungstitel aufgehoben …» (SortG Art. 1, SR 232.16) → keine Artikelaufhebung', () => {
    const { historie } = baueArtikelHistorie([
      fn('Gliederungstitel aufgehoben durch Art. 2 Ziff. 1 des BB vom 5. Okt. 2007, mit Wirkung seit 1. Sept. 2008 (AS 2008 3897; BBl 2004 4155).'),
    ]);
    expect(historie?.aufgehobenSeit).toBeUndefined();
  });

  it('Gegenprobe OR Art. 48 (SR 220): echte Ganzaufhebung bleibt aufgehoben', () => {
    const { historie } = baueArtikelHistorie([
      fn('Aufgehoben durch Art. 21 Abs. 1 des BG vom 30. Sept. 1943 über den unlauteren Wettbewerb, mit Wirkung seit 1. März 1945 (BS 2 951).'),
    ]);
    expect(historie?.aufgehobenSeit).toBe('1945-03-01');
  });

  it('Gegenprobe OR Art. 40g (SR 220): Einfügung VOR der Aufhebung → bleibt aufgehoben', () => {
    const { historie } = baueArtikelHistorie([
      fn('Eingefügt durch Ziff. I des BG vom 5. Okt. 1990 (AS 1991 846; BBl 1986 II 354). Aufgehoben durch Anhang Ziff. 5 des Gerichtsstandsgesetzes vom 24. März 2000, mit Wirkung seit 1. Jan. 2001 (AS 2000 2355; BBl 1999 III 2829).'),
    ]);
    expect(historie?.aufgehobenSeit).toBe('2001-01-01');
  });

  it('Gegenprobe OR Art. 858 (SR 220): spätere Fussnote am GLIEDERUNGS-Titel (sektion) widerlegt die Aufhebung NICHT', () => {
    const { historie } = baueArtikelHistorie([
      fn('Aufgehoben durch Ziff. I 3 des BG vom 23. Dez. 2011 (Rechnungslegungsrecht), mit Wirkung seit 1. Jan. 2013 (AS 2012 6679; BBl 2008 1589).'),
      fn('Ausdruck gemäss Ziff. I des BG vom 19. Juni 2020 (Aktienrecht), in Kraft seit 1. Jan. 2023 (AS 2020 4005; 2022 109; BBl 2017 399). Diese Änd. wurde in den in der AS genannten Bestimmungen vorgenommen.', { sektion: 'III. Allfällige Rechte auf den Jahresgewinn' }),
    ]);
    expect(historie?.aufgehobenSeit).toBe('2013-01-01');
  });

  it('MVG Art. 104 (SR 833.1): Aufhebung am Gliederungs-Titel (sektion, 2021) zählt nicht — Artikel aufgehoben seit 2007', () => {
    const { historie } = baueArtikelHistorie([
      fn('Aufgehoben durch Anhang Ziff. 112 des Verwaltungsgerichtsgesetzes vom 17. Juni 2005, mit Wirkung seit 1. Jan. 2007 (AS 2006 2197 1069; BBl 2001 4202).'),
      fn('Aufgehoben durch Anhang Ziff. 7 des BG vom 21. Juni 2019, mit Wirkung seit 1. Jan. 2021 (AS 2020 5137; BBl 2018 1607).', { sektion: '3. Abschnitt: …' }),
    ]);
    expect(historie?.aufgehobenSeit).toBe('2007-01-01');
  });

  it('ParlG Art. 55 (SR 171.10): Kopf-Fussnote «Art. 55 …[Fn]» ohne spätere Fassung — Körper lebend ⇒ Sachüberschrift, kein aufgehobenSeit', () => {
    const fussnoten = [fn('Aufgehoben durch Ziff. I des BG vom 3. Okt. 2008, mit Wirkung seit 2. März 2009 (AS 2009 725; BBl 2008 1869, 3177).')];
    expect(baueArtikelHistorie(fussnoten, { koerperLebend: true }).historie?.aufgehobenSeit).toBeUndefined();
    // Ohne Körper-Signal ist der Kopf-Anker mehrdeutig → bisherige Lesart (Artikelaufhebung).
    expect(baueArtikelHistorie(fussnoten).historie?.aufgehobenSeit).toBe('2009-03-02');
    expect(baueArtikelHistorie(fussnoten, { koerperLebend: false }).historie?.aufgehobenSeit).toBe('2009-03-02');
  });
});
