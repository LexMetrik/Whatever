// ─── Z5 (W2·22-VERWEIS-FEDLEX): AUSGESCHRIEBENE Artikelverweise «Artikel N …
//     KÜRZEL» ────────────────────────────────────────────────────────────────
//
// Belegte Lücke (Klasse A des Zitatgraph-Berichts `messwerte/
// zitatgraph-warnungen.md`, erzeugt aus den amtlichen jolux:Citation-Kanten von
// Fedlex): 824 vergleichbare Kanten, bei denen der Normtext das Ziel-Kürzel
// AUSGESCHRIEBEN nennt («Artikel 29 Absatz 1 ATSG»), LexMetrik es über
// `fremdgesetzNachArtikel` (N2 Form A) auch ERKENNT — und den Link bis hierher
// bloss UNTERDRÜCKT statt ihn zu setzen (Kontrakt bis W2·22: «lieber kein Link
// als ein falscher», David-Entscheid 28.6.2026). Z5 hebt genau diese Klasse.
//
// Alle neun Positiv-Belege sind WÖRTLICH aus den committeten Snapshots
// (`public/normtext/bund/<Kürzel>.json`, Stand 2026-01-01, quelleUrl
// fedlex.admin.ch) entnommen — nichts aus dem Gedächtnis zitiert (§7).

import { describe, it, expect } from 'vitest';
import { ausgeschriebeneVerweiseImText, normVerweiseImText } from './spannen';
import { fremdRoutingFormB } from './parser';
import { type FremdEbene } from './positivliste';

/** Kurzform: (anzeige, auflösbares Ziel) je erkannter Spanne. */
const treffer = (t: string, eigenes?: string, ebene: FremdEbene = 'bund') =>
  ausgeschriebeneVerweiseImText(t, eigenes, ebene).map((s) => [s.anzeige, s.artikel] as const);

// ─── Positiv: die neun amtlich belegten Korpus-Stellen ───────────────────────

describe('ausgeschriebeneVerweiseImText — belegte Korpus-Stellen (Klasse A)', () => {
  it('IVG art_10: «nach Artikel 29 Absatz 1 ATSG» → ATSG art_29', () => {
    const t = 'Der Anspruch auf Integrationsmassnahmen zur Vorbereitung auf die berufliche Eingliederung sowie auf Massnahmen beruflicher Art entsteht frühestens im Zeitpunkt der Geltendmachung des Leistungsanspruchs nach Artikel 29 Absatz 1 ATSG.';
    expect(treffer(t, 'IVG')).toEqual([['Artikel 29', 'Art. 29 ATSG']]);
  });

  it('AIG art_68a: «Artikel 66a oder 66abis StGB oder Artikel 49a oder 49abis MStG» → je ein Glied', () => {
    const t = 'eine Landesverweisung nach Artikel 66a oder 66abis StGB oder Artikel 49a oder 49abis MStG bei Vollzugsanordnung;';
    expect(treffer(t, 'AIG')).toEqual([
      ['Artikel 66a', 'Art. 66a StGB'],
      ['66abis', 'Art. 66abis StGB'],
      ['Artikel 49a', 'Art. 49a MStG'],
      ['49abis', 'Art. 49abis MStG'],
    ]);
  });

  it('VZV art_106: «nach Artikel 221 Absätze 3 und 4 VTS» → VTS art_221 (Absätze nur Anzeige)', () => {
    const t = 'Mit dem Entzug des Fahrzeugausweises sind immer auch die Kontrollschilder zu entziehen. Bei Wechselschildern können die Schilder für ein Fahrzeug belassen werden. Die Sicherstellung von Fahrzeugen richtet sich nach Artikel 221 Absätze 3 und 4 VTS.';
    expect(treffer(t, 'VZV')).toEqual([['Artikel 221', 'Art. 221 VTS']]);
  });

  it('AVIG art_79: «Artikel 242 SchKG gilt sinngemäss» → SchKG art_242', () => {
    const t = 'Der Zahlungsverkehr einer privaten Arbeitslosenkasse muss über Bank- oder Postkonten abgewickelt werden, die ausschliesslich für diesen Zweck verwendet werden dürfen. Im Konkurs des Trägers fallen die Guthaben auf diesen Konten nicht in die Konkursmasse. Artikel 242 SchKG gilt sinngemäss.';
    expect(treffer(t, 'AVIG')).toEqual([['Artikel 242', 'Art. 242 SchKG']]);
  });

  it('BankV art_65: «nach Artikel 124a ERV» → ERV art_124a', () => {
    const t = 'Eine nach Artikel 124a ERV international tätige systemrelevante Bank muss ihre Sanier- und Liquidierbarkeit im In- und Ausland aufrechterhalten.';
    expect(treffer(t, 'BankV')).toEqual([['Artikel 124a', 'Art. 124a ERV']]);
  });

  it('AsylG art_98: «nach Artikel 16 DSG» → DSG art_16', () => {
    const t = 'Das SEM und die Beschwerdebehörden dürfen zum Vollzug dieses Gesetzes den mit entsprechenden Aufgaben betrauten ausländischen Behörden und internationalen Organisationen Personendaten bekannt geben, sofern die Voraussetzungen nach Artikel 16 DSG erfüllt sind.';
    expect(treffer(t, 'AsylG')).toEqual([['Artikel 16', 'Art. 16 DSG']]);
  });

  it('IVG art_66a: «in Artikel 1a Absatz 1 Buchstabe c UVG» → UVG art_1a', () => {
    const t = 'Die Invalidenversicherung stellt der Schweizerischen Unfallversicherungsanstalt die Personendaten, die zur Risikoanalyse der Unfälle von in Artikel 1a Absatz 1 Buchstabe c UVG bezeichneten Personen erforderlich sind, anonymisiert zur Verfügung.';
    expect(treffer(t, 'IVG')).toEqual([['Artikel 1a', 'Art. 1a UVG']]);
  });

  it('KVG art_79a: «Das Rückgriffsrecht nach Artikel 72 ATSG» → ATSG art_72', () => {
    const t = 'Das Rückgriffsrecht nach Artikel 72 ATSG gilt sinngemäss:';
    expect(treffer(t, 'KVG')).toEqual([['Artikel 72', 'Art. 72 ATSG']]);
  });

  it('KVV art_31: «nach Artikel 39 KVG» → KVG art_39; «Artikel 51 dieser Verordnung» bleibt Text', () => {
    const t = 'Das BAG veröffentlicht die Ergebnisse der weitergebenen Daten zu den Spitälern und anderen Einrichtungen nach Artikel 39 KVG sowie zu den Organisationen der Krankenpflege und Hilfe zu Hause nach Artikel 51 dieser Verordnung auf Stufe der einzelnen Einrichtung mit deren Namen und Standort.';
    expect(treffer(t, 'KVV')).toEqual([['Artikel 39', 'Art. 39 KVG']]);
  });
});

// ─── Negativ: wo Z5 bewusst NICHT verlinkt (§1) ──────────────────────────────

describe('ausgeschriebeneVerweiseImText — Negativfälle (§1: kein Link statt falscher)', () => {
  it('N1 «Artikel 5 dieses Gesetzes» — Selbstmarker, kein Erlassname', () => {
    expect(treffer('Vorbehalten bleibt Artikel 5 dieses Gesetzes.')).toEqual([]);
  });

  it('N2 «Artikel 3 der Verordnung» — generischer Name ohne Kürzel', () => {
    expect(treffer('Es gilt Artikel 3 der Verordnung über die Sache.')).toEqual([]);
  });

  it('N3 «Artikel» ohne Zahl', () => {
    expect(treffer('Die Artikel gelten sinngemäss.')).toEqual([]);
  });

  it('N4 AIG art_31: «Artikel 68 des vorliegenden Gesetzes» bleibt Text, die vier Glieder werden geroutet', () => {
    const t = 'Staatenlose Personen nach den Absätzen 1 und 2 sowie staatenlose Personen, die mit einer rechtskräftigen Landesverweisung nach Artikel 66a oder 66abis StGB oder Artikel 49a oder 49abis MStG oder mit einer rechtskräftigen Ausweisung nach Artikel 68 des vorliegenden Gesetzes belegt sind, können in der ganzen Schweiz eine Erwerbstätigkeit ausüben. Artikel 61 AsylG gilt sinngemäss.';
    expect(treffer(t, 'AIG')).toEqual([
      ['Artikel 66a', 'Art. 66a StGB'],
      ['66abis', 'Art. 66abis StGB'],
      ['Artikel 49a', 'Art. 49a MStG'],
      ['49abis', 'Art. 49abis MStG'],
      // Ziel-Kürzel ist der FEDLEX-KEY («ASYLG»), nicht die amtliche
      // Schreibweise des Quelltexts («AsylG») — dieselbe Synthese wie in
      // `fremdRoutingFormB`; angezeigt wird ohnehin nur `anzeige`.
      ['Artikel 61', 'Art. 61 ASYLG'],
    ]);
  });

  it('N5 VZV art_116: «Artikel 108 dieser Verordnung» bleibt Text (Self-Wendung)', () => {
    const t = 'Für das Verfahren gilt Artikel 108 dieser Verordnung sowie Artikel 221 Absätze 3 und 4 VTS.';
    expect(treffer(t, 'VZV')).toEqual([['Artikel 221', 'Art. 221 VTS']]);
  });

  // Z6 a (W2·22, 14.9.2026, deklarierte fachliche Änderung): der Fall STAND
  // hier als Negativfall, und das war zu seiner Zeit richtig — «septies» lag
  // ausserhalb der Nummern-Grammatik, und ein erzwungener Treffer hätte den
  // falschen Anker «#art_29septies» ergeben. Mit der geteilten Reihe
  // (`lib/fedlex/nummer.ts`) kennen Erkennung UND Anker-Bau «septies», der
  // Verweis löst auf das echte Ziel auf: AHVG führt `artikel: "29_septies"`
  // (Snapshot 2026-01-01). Damit ist es kein Negativfall mehr, sondern der
  // Beleg des Fixes — der Erwartungswert wechselt, die Regel «kein Link ist
  // besser als ein falscher» bleibt unberührt.
  it('N6 IVG art_11a: «Artikel 29septies AHVG» routet auf AHVG (Z6 a)', () => {
    const t = 'der Familienangehörigen, für die ihnen ein Anspruch auf Anrechnung einer Betreuungsgutschrift nach Artikel 29septies AHVG zusteht.';
    expect(treffer(t, 'IVG')).toEqual([['Artikel 29septies', 'Art. 29septies AHVG']]);
  });

  it('N7 Self-Ausschluss: «Artikel 39 KVG» im KVG selbst', () => {
    expect(treffer('Einrichtungen nach Artikel 39 KVG sind zugelassen.', 'KVG')).toEqual([]);
  });

  it('N8 Form B bleibt zuständig: «Artikel 66a oder 66abis des Strafgesetzbuchs (StGB)»', () => {
    expect(treffer('Landesverweisung nach Artikel 66a oder 66abis des Strafgesetzbuchs (StGB) betroffen', 'AIG')).toEqual([]);
  });

  it('N9 Plural-Region (A10) bleibt zuständig: «die Artikel 32 und 33 ATSG»', () => {
    expect(treffer('Es gelten die Artikel 32 und 33 ATSG sinngemäss.', 'IVG')).toEqual([]);
  });

  it('N10 Zeit-Kante: «Artikel 5 DSG vom 19. Juni 1992» meint das aufgehobene aDSG', () => {
    expect(treffer('Es gilt Artikel 5 DSG vom 19. Juni 1992 sinngemäss.')).toEqual([]);
  });

  it('N11 unbekanntes Kürzel: «Artikel 2 und 3 BGSA»', () => {
    expect(treffer('im vereinfachten Verfahren nach Artikel 2 und 3 BGSA haben die Arbeitgeber')).toEqual([]);
  });

  it('N12 Wortgrenze: «Artikel 5 ORganisation» ist kein OR-Verweis', () => {
    expect(treffer('Massgeblich ist Artikel 5 ORganisation und Aufbau.')).toEqual([]);
  });
});

// ─── Einhängung in die Spannen-Kette ────────────────────────────────────────

describe('normVerweiseImText — Z5 additiv eingehängt', () => {
  it('liefert die ausgeschriebene Spanne mit `ausgeschrieben`-Marke', () => {
    const s = normVerweiseImText('Der Anspruch entsteht nach Artikel 29 Absatz 1 ATSG.', 'IVG');
    expect(s).toEqual([{
      start: 27, end: 37, anzeige: 'Artikel 29', artikel: 'Art. 29 ATSG',
      propagiert: false, ausgeschrieben: true,
    }]);
  });

  it('der voll zitierte Anker (NORM_IM_TEXT) behält den Vorrang — keine doppelte Spanne', () => {
    const s = normVerweiseImText('Der Anspruch entsteht nach Art. 29 Abs. 1 ATSG.', 'IVG');
    expect(s.map((x) => [x.anzeige, x.artikel])).toEqual([['Art. 29 Abs. 1 ATSG', 'Art. 29 Abs. 1 ATSG']]);
  });

  it('Ketten-Propagierung bleibt unberührt', () => {
    const s = normVerweiseImText('Art. 684 i.V.m. Art. 679 ZGB');
    expect(s.map((x) => [x.anzeige, x.artikel])).toEqual([
      ['Art. 684', 'Art. 684 ZGB'],
      ['Art. 679 ZGB', 'Art. 679 ZGB'],
    ]);
  });
});

// ─── Ebenen-Eindeutigkeit (KUERZEL_NUR_BUND) ────────────────────────────────

describe('ausgeschriebeneVerweiseImText — Kürzel mit kantonaler Doppelbedeutung', () => {
  // Belege (gemessen 2.9.2026 über den ganzen Snapshot-Korpus, vor dem Guard):
  // kanton/AR/621.111 art_48 und kanton/BE/215.326.2 art_28 zitieren ihr EIGENES
  // Steuergesetz als «StG»; Z5 verlinkte SR 641.10 (Stempelabgaben-StG).
  const arStG = 'Für die Ermittlung des Einkommens aus unselbständiger Erwerbstätigkeit gelten die Einkünfte nach Art. 98 Abs. 2 lit. a und b StG.';
  const beStG = 'Zuständige Behörde im Sinne von Artikel 225 Absatz 2 StG ist die Direktion für Inneres und Justiz.';

  it('in einem KANTONALEN Erlass bleibt «StG» Text', () => {
    expect(treffer(arStG, 'AR-621.111', 'kanton')).toEqual([]);
    expect(treffer(beStG, 'BE-215.326.2', 'kanton')).toEqual([]);
  });

  it('in einem BUNDESERLASS bleibt «StG» der Bundes-Verweis (SR 641.10)', () => {
    expect(treffer(beStG, 'MWSTG', 'bund')).toEqual([['Artikel 225', 'Art. 225 StG']]);
  });

  it('ebenenübergreifend eindeutige Kürzel verlinken auch im Kanton', () => {
    const t = 'In Rechtsmittelverfahren nach Artikel 308 ZPO ist die Anwältin zuständig.';
    expect(treffer(t, 'BE-168.811', 'kanton')).toEqual([['Artikel 308', 'Art. 308 ZPO']]);
  });
});

// ─── W2·18-FEHLERBUCH-Nachzug (12.9.2026): KUERZEL_NUR_BUND fehlte am ─────────
// PRIMÄREN Anker (NORM_IM_TEXT), nicht nur an Z5 — dieselbe Lücke, die
// GP-Nachzug PR #635 für `zusatzwortSperre`/`historischeFassung` bereits schloss.
// Beleg wörtlich aus kanton/SG/3849 art_7 (Stand 2026-01-01, quelleUrl
// gesetzessammlung.sg.ch): «Prüfung und Genehmigung von Projekten für private
// Schutzräume (Art. 9 BMV; Art. 39 Bst. b EV zum ZSG)» — gemeint ist die
// eidgenössische Schutzbautenverordnung vom 27.11.1978, nicht die geltende
// Berufsmaturitätsverordnung (SR 412.103.1, Register-Key 'BMV').
describe('normVerweiseImText — Kürzel mit kantonaler/zeitlicher Doppelbedeutung am PRIMÄREN Anker', () => {
  const sgBmv = 'Prüfung und Genehmigung von Projekten für private Schutzräume (Art. 9 BMV; Art. 39 Bst. b EV zum ZSG).';

  it('in einem KANTONALEN Erlass bleibt die kürzeste Zitatform «Art. 9 BMV» Text', () => {
    // Vor dem Fix (nur Z5 gesperrt): NORM_IM_TEXT matcht «Art. 9 BMV» direkt
    // und produziert den falschen Link auf SR 412.103.1 — dieser Test war rot,
    // bis der Guard auf `normVerweiseImText` (spannen.ts) ausgeweitet wurde.
    expect(normVerweiseImText(sgBmv, 'SG-3849', 'kanton')).toEqual([]);
  });

  it('in einem BUNDESERLASS bleibt «BMV» der Bundes-Verweis (SR 412.103.1)', () => {
    expect(normVerweiseImText(sgBmv, undefined, 'bund')).toEqual([
      { start: 63, end: 73, anzeige: 'Art. 9 BMV', artikel: 'Art. 9 BMV', propagiert: false },
    ]);
  });
});

// ─── GP-Nachzug (PR #635) B1: Kürzel + Zusatzwort = ein ANDERER Erlass ───────

describe('ausgeschriebeneVerweiseImText — Kürzel mit titel-weiterführendem Zusatzwort', () => {
  // Belege wörtlich aus den committeten Snapshots (§7). Gemeint ist die
  // interkantonale «Anerkennungsverordnung Inland (AVO Inland)» der SDK/GDK
  // (liegt als kanton/BS/419.901 selbst im Korpus), NICHT die eidgenössische
  // Aufsichtsverordnung AVO (SR 961.011). Herleitung: `KUERZEL_ZUSATZ_SPERRE`.
  const bs905 = 'Die Inhaberinnen und Inhaber eines anerkannten Diploms gemäss Abs. 1 sind gemäss Art. 10 Abs. 2 AVO Inland berechtigt, den im Anhang III der AVO Inland aufgeführten Titel zu tragen. Der Titel lautet: «Osteopathin/Osteopath». Gemäss Art. 10 der AVO Inland sind Titelinhaberinnen und -inhaber berechtigt, dem Titel den Vermerk «mit schweizerisch anerkanntem Diplom» hinzuzufügen.';
  const bs902 = 'Entscheide der Rekurskommission können gemäss Art. 11 Abs. 3 AVO Inland vom 20. Mai 1999 angefochten werden.';

  it('BS-419.905 art_2: «AVO Inland» bleibt Text (nie SR 961.011)', () => {
    expect(treffer(bs905, 'BS-419.905', 'kanton')).toEqual([]);
  });

  it('BS-419.902 art_11: «AVO Inland vom 20. Mai 1999» bleibt Text', () => {
    expect(treffer(bs902, 'BS-419.902', 'kanton')).toEqual([]);
  });

  // GEGENFÄLLE: das Kürzel OHNE Zusatzwort verlinkt unverändert — der Guard
  // greift nur beim Zusatzwort, nicht bei jedem grossgeschriebenen Folgewort
  // (57 der 60 gemessenen Stellen sind richtige Links, s. Konstante).
  it('Gegenfall 1: «AVO» ohne Zusatzwort verlinkt weiterhin', () => {
    const t = 'Entscheide der Rekurskommission können gemäss Art. 11 Abs. 3 AVO angefochten werden.';
    expect(treffer(t, 'BS-419.902', 'kanton')).toEqual([['Art. 11', 'Art. 11 AVO']]);
  });

  it('Gegenfall 2: grossgeschriebener Satz-Fortgang bleibt verlinkt (CHEMV art_1)', () => {
    const t = 'Stoffe, Zubereitungen und Gegenstände, die nach Artikel 7 USG Abfälle sind.';
    expect(treffer(t, 'CHEMV')).toEqual([['Artikel 7', 'Art. 7 USG']]);
  });

  it('Gegenfall 3: «findet Artikel 333 OR Anwendung» bleibt verlinkt (FUSG art_49)', () => {
    const t = 'Auf den Übergang der Arbeitsverhältnisse findet Artikel 333 OR Anwendung.';
    expect(treffer(t, 'FUSG')).toEqual([['Artikel 333', 'Art. 333 OR']]);
  });
});

// ─── GP-Nachzug (PR #635) B2: Verweis auf eine HISTORISCHE Fassung ───────────

describe('ausgeschriebeneVerweiseImText — «in der Fassung vom …»', () => {
  // Belege wörtlich aus den committeten Snapshots (§7). Der Leser zeigt immer
  // die GELTENDE Fassung; KAG art_18 existiert dort nicht mehr. Herleitung:
  // `historischeFassung` (positivliste.ts).
  it('FINIV art_93: «Artikel 18 Absatz 3 KAG in der Fassung vom …» bleibt Text', () => {
    const t = 'Befreiungen, welche die FINMA gestützt auf Artikel 18 Absatz 3 KAG in der Fassung vom 28. September 2012 Vermögensverwaltern kollektiver Kapitalanlagen gewährt hat, gelten im Rahmen von Artikel 7 dieser Verordnung weiter.';
    expect(treffer(t, 'FINIV')).toEqual([]);
  });

  it('FIDLEV art_105: «Artikel 120 Absatz 4 KAG in der Fassung vom 1. März 2013» bleibt Text', () => {
    const t = 'Artikel 120 Absatz 4 KAG in der Fassung vom 1. März 2013;';
    expect(treffer(t, 'FIDLEV')).toEqual([]);
  });

  it('AIG art_126_a: «Artikel 87 des AsylG in der Fassung vom 26. Juni 1998» bleibt Text', () => {
    const t = 'Entsteht vor Inkrafttreten der Änderung vom 16. Dezember 2005 des AsylG ein Zwischen- oder Schlussabrechnungsgrund nach Artikel 87 des AsylG in der Fassung vom 26. Juni 1998, so erfolgen die Zwischen- oder Schlussabrechnung und die Saldierung des Kontos nach bisherigem Recht.';
    expect(treffer(t, 'AIG')).toEqual([]);
  });

  it('«in der bis … geltenden Fassung» bleibt ebenfalls Text', () => {
    const t = 'Massgebend ist Artikel 18 KAG in der bis zum 31. Dezember 2019 geltenden Fassung.';
    expect(treffer(t, 'FINIV')).toEqual([]);
  });

  // GEGENFÄLLE: nur die BESTIMMTE vergangene Fassung sperrt.
  it('Gegenfall 1: blosses «vom <Erlassdatum>» verlinkt wie bisher (Zeit-Kante)', () => {
    // Das Erlassdatum des KAG (23. Juni 2006, `ERLASSDATUM`) passt → `datumPasst`
    // lässt durch, und ohne «in der Fassung» greift der neue Guard nicht.
    const t = 'Befreiungen, welche die FINMA gestützt auf Artikel 18 Absatz 3 KAG vom 23. Juni 2006 gewährt hat.';
    expect(treffer(t, 'FINIV')).toEqual([['Artikel 18', 'Art. 18 KAG']]);
    // Ein FREMDES Datum sperrt weiterhin die Zeit-Kante, nicht der neue Guard.
    const alt = t.replace('vom 23. Juni 2006', 'vom 28. September 2012');
    expect(treffer(alt, 'FINIV')).toEqual([]);
  });

  it('Gegenfall 2: DYNAMISCHER Verweis «in der jeweils geltenden Fassung» verlinkt weiter', () => {
    const t = 'Massgebend ist Artikel 18 KAG in der jeweils geltenden Fassung.';
    expect(treffer(t, 'FINIV')).toEqual([['Artikel 18', 'Art. 18 KAG']]);
  });
});

// ─── GP-Nachzug (PR #635) B2: derselbe Guard auf den PARSER-Pfaden ──────────
//
// «in der Fassung vom …» ist keine Z5-Eigenheit — die Form-B-Auflösung
// (`fremdRoutingFormB`) und der Plural-Pfad tragen dieselbe Sorge. Belege
// wörtlich aus den committeten Snapshots (§7).

describe('fremdRoutingFormB — «in der Fassung vom …»', () => {
  const nachArtikel = (t: string, nr: string) =>
    fremdRoutingFormB(t.slice(t.indexOf(nr) + nr.length), nr, undefined, 'bund');

  it('OR disp_u3_art_3: «des Obligationenrechts in der Fassung vom 18. Dezember 1936» → kein Routing', () => {
    const t = 'Bis zur vollständigen Leistung der Einlagen in der Höhe des Stammkapitals haften die Gesellschafter nach Artikel 802 des Obligationenrechts in der Fassung vom 18. Dezember 1936.';
    expect(nachArtikel(t, '802')).toBeNull();
  });

  it('FIDLEV art_105: Satzzeichen zwischen Klammer-Kürzel und Fassungs-Angabe sperrt ebenfalls', () => {
    const t = 'Artikel 20 des Kollektivanlagengesetzes vom 23. Juni 2006 (KAG); in der Fassung vom 1. März 2013;';
    expect(nachArtikel(t, '20')).toBeNull();
  });

  it('Gegenfall: dieselbe Einheit OHNE Fassungs-Angabe routet unverändert auf das KAG', () => {
    const t = 'Artikel 20 des Kollektivanlagengesetzes vom 23. Juni 2006 (KAG);';
    expect(nachArtikel(t, '20')?.gesetz).toBe('KAG');
  });
});

// ─── GP-Nachzug (PR #635) B1/B2: derselbe Guard auf dem VOLL ZITIERTEN Anker ─
//
// Eigener Nachbefund aus dem Vorher/Nachher-Dump aller Link-Pfade (2.9.2026):
// die ABGEKÜRZTE Zitatform «Art. 11 Abs. 3 AVO Inland» trifft `NORM_IM_TEXT`
// direkt und wurde von der Z5-Sperre gar nicht erreicht — zwei falsche Links
// blieben nach dem ersten Fix stehen. Die Guards sitzen darum an BEIDEN Stellen.

describe('normVerweiseImText — Guards auch auf dem voll zitierten Anker', () => {
  const ziele = (t: string, eigenes: string, ebene: FremdEbene = 'bund') =>
    normVerweiseImText(t, eigenes, ebene).map((s) => s.artikel);

  it('BS-419.902 art_11: «Art. 11 Abs. 3 AVO Inland vom 20. Mai 1999» bleibt Text', () => {
    const t = 'Entscheide der Rekurskommission können gemäss Art. 11 Abs. 3 AVO Inland vom 20. Mai 1999 angefochten werden.';
    expect(ziele(t, 'BS-419.902', 'kanton')).toEqual([]);
  });

  it('BS-419.905 art_2: «Art. 10 Abs. 2 AVO Inland» bleibt Text', () => {
    const t = 'Die Inhaberinnen und Inhaber eines anerkannten Diploms gemäss Abs. 1 sind gemäss Art. 10 Abs. 2 AVO Inland berechtigt, den Titel zu tragen.';
    expect(ziele(t, 'BS-419.905', 'kanton')).toEqual([]);
  });

  it('Gegenfall: «Art. 11 Abs. 3 AVO» ohne Zusatzwort verlinkt weiterhin', () => {
    const t = 'Entscheide der Rekurskommission können gemäss Art. 11 Abs. 3 AVO angefochten werden.';
    expect(ziele(t, 'BS-419.902', 'kanton')).toEqual(['Art. 11 Abs. 3 AVO']);
  });

  it('«Art. 18 Abs. 3 KAG in der Fassung vom 28. September 2012» bleibt Text', () => {
    const t = 'Befreiungen, welche die FINMA gestützt auf Art. 18 Abs. 3 KAG in der Fassung vom 28. September 2012 gewährt hat.';
    expect(ziele(t, 'FINIV')).toEqual([]);
  });
});
