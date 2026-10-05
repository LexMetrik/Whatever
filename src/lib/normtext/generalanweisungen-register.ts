// ─── Register der Generalanweisungen (W2·32-GENERALANWEISUNGEN, 5.10.2026) ────────────────────────────────────────────
//
// DATEN der Anweisungen von Änderungserlassen, die den Körper von Artikeln ändern, ohne dass am Artikel eine Fussnote steht
// («Ersatz von Ausdrücken», Neufassung eines Buches). Je Zeile: Fundstelle im Amtsblatt (AS), amtlicher Link, In-Kraft-Datum,
// Belegstelle und der WORTLAUT der Artikelliste. Die Logik (Zerlegen der Liste, Ereignis je Artikel) steht in generalanweisungen.ts;
// Erläuterung der Umfangsformen und der Grenzen dort und in bibliothek/normtext/generalanweisungen-gilt-seit-2026-10-05.md.
// Das Register ist NICHT vollständig (§7/§8): erfasst ist nur, was hier steht.

/** Umfang einer Anweisung (siehe Kopf). */
type AnweisungsUmfang = { liste: string } | { ganzerErlass: true; erwartet: string };

/** Eine Anweisung eines Änderungserlasses, die den Körper von Artikeln ändert, ohne am Artikel zu stehen. */
export interface Anweisung {
  /** Stabiler Name (Test, Doku). */
  id: string;
  /** Korpus-Schlüssel des geänderten Erlasses (`public/normtext/bund/<KEY>.json`). */
  erlass: string;
  /** Amtsblatt-Fundstelle des Änderungserlasses. */
  as: string;
  /** Amtlicher Link auf den Änderungserlass (Fedlex-ELI der AS-Fassung). */
  eli: string;
  /** Wo die Anweisung steht (Seite/Ziffer) und wo das In-Kraft-Datum — Belegstelle im AS-Erlass. */
  beleg: string;
  /** ISO-Datum des Inkrafttretens des Artikelkörpers (Inkraftsetzungs-Klausel des AS-Erlasses). */
  inKraft: string;
  /** Abruf der AS-Fassung (Zitat-Ausnahme CLAUDE.md §7 (a)). */
  abgerufen: string;
  /** 'ausdruck': Ersatz von Ausdrücken · 'neufassung': Artikel neu gefasst. */
  art: 'ausdruck' | 'neufassung';
  /** Bei 'ausdruck': ersetzter und neuer Ausdruck, wörtlich. */
  alt?: string;
  neu?: string;
  /** Bei 'neufassung': Bezeichnung des neu gefassten Bereichs. */
  bereichsname?: string;
  /** Artikel der `liste` (oder, bei `ganzerErlass`, ein vom Ausdruck betroffener Artikel), die das Register BEWUSST nicht datiert — je mit dem amtlichen Beleg, warum die Anweisung dort nicht (mehr)
   *  den heutigen Wortlaut bestimmt. Label ohne Unterstrich («430»). */
  ausser?: ReadonlyArray<{ artikel: string; grund: string }>;
  /** Stamm (klein), den der heutige Text eines betroffenen Artikels enthält, solange ihn kein späteres Ereignis neu gefasst hat
   *  — Tripwire des Korpus-Tests, nicht Teil der Ableitung. Nur bei 'ausdruck' mit `liste`. */
  stamm?: string;
  umfang: AnweisungsUmfang;
}

const FEDLEX_OC = 'https://fedlex.data.admin.ch/eli/oc/';

/** AS 2020 4005 Abs. 1 nennt auch Artikel, die AS 2020 957 schon am 1.1.2021 ersetzt hat: ihr Text ist 1.1.2022 = 1.1.2023 (kein Ereignis 2023). */
const OR_2023_OHNE_WIRKUNG_GRUND =
  'Wortlaut unverändert: Fedlex-Konsolidierung (AKN-XML) 1.1.2022 und 1.1.2023 tragen denselben Artikeltext — «Gericht» steht seit der Ersetzung durch AS 2020 957 (1.1.2021), AS 2020 4005 Abs. 1 ist hier ohne Wirkung';
const OR_2023_OHNE_WIRKUNG: readonly string[] = [
  '545', '574', '577', '579', '580', '583', '585', '601', '643', '685b', '706', '706a', '731b', '740', '741', '743', '846', '857', '881', '890', '891', '904', '918', '924',
];

/** AS 2006 3459 (StGB, Änderung vom 13. Dezember 2002): Inkraftsetzung am Erlass selbst, S. 3535 «Ablauf der Referendumsfrist und Inkraftsetzung» Abs. 2. */
const STGB_2006 = { erlass: 'STGB', as: 'AS 2006 3459', eli: `${FEDLEX_OC}2006/549`, inKraft: '2007-01-01', abgerufen: '2026-10-05' } as const;
const STGB_2006_INKRAFT = 'Inkraftsetzung AS 2006 3535 Abs. 2 («Es wird, mit Ausnahme von Artikel 386 des Strafgesetzbuches, auf den 1. Januar 2007 in Kraft gesetzt»)';

/** Eine «Ersatz von Ausdrücken»-Anweisung von Ziff. II 1 (Zweites Buch): `liste` ist der Wortlaut der AS (Abs. `abs`, Seite `seite`). */
const stgbAusdruck = (x: { abs: number; seite: string; alt: string; neu: string; stamm: string; liste: string }): Anweisung => ({
  ...STGB_2006,
  id: `STGB-AS-2006-3459-ii1-abs${x.abs}`,
  beleg: `AS 2006 ${x.seite}, Ziff. II 1 «Begriffe und Ausdrücke, die ersetzt werden» Abs. ${x.abs}; ${STGB_2006_INKRAFT}`,
  art: 'ausdruck',
  alt: x.alt,
  neu: x.neu,
  stamm: x.stamm,
  umfang: { liste: x.liste },
});

/**
 * Das Register. Jede Zeile ist am AS-Erlass selbst belegt (PDF-A der Amtlichen Sammlung, Abruf 5.10.2026):
 * Seite und Ziffer der Anweisung sowie die Inkraftsetzungs-Klausel stehen in `beleg`.
 */
export const ANWEISUNGEN: readonly Anweisung[] = [
  // ── ZGB · AS 1999 1118 (Scheidungsrecht u. a., in Kraft 1.1.2000), «Ersatz von Ausdrücken» S. 1143, drei Absätze ──
  {
    id: 'ZGB-AS-1999-1118-richter-gericht',
    erlass: 'ZGB',
    as: 'AS 1999 1118',
    eli: `${FEDLEX_OC}1999/149`,
    beleg: 'AS 1999 1143, Ziff. I, «Ersatz von Ausdrücken» Abs. 1; Inkraftsetzung AS 1999 1144 Abs. 2 («auf den 1. Januar 2000»)',
    inKraft: '2000-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'der Richter',
    neu: 'das Gericht',
    stamm: 'gericht',
    ausser: [
      {
        artikel: '430',
        grund: 'Wortlaut seit 1.1.2013 (AS 2011 725, Dritte Abteilung «Der Erwachsenenschutz» neu gefasst; am Artikel steht keine Fussnote, nur an der Abteilungsüberschrift); Fedlex-Konsolidierung 1.1.2012 trägt den alten Text, 1.1.2013 den heutigen',
      },
    ],
    umfang: {
      liste:
        'Art. 1 Abs. 2, 4, 28 Abs. 1, 28a Abs. 1, 28b Abs. 1, 28c Abs. 2 und 3, 28d, 28e Abs. 2, 28f, Randtitel von Art. 28l und Art. 28l Abs. 1–3, 35, 36 Abs. 2, 75, 78, 79, 87 Abs. 2, Randtitel von Art. 88 und Art. 88 Abs. 2, 166 Abs. 2 Ziff. 1, 169 Abs. 2, 170 Abs. 2, 172, 173 Abs. 1 und 2, 174 Abs. 1 und 3, 176 Abs. 1 und 3, 177, 178, 179 Abs. 1, 180, 185 Abs. 1, 186, 187 Abs. 2, 189, 190 Abs. 2, 191 Abs. 1, 194, 230 Abs. 2, 252 Abs. 2, 253, 254, 256 Abs. 1, 260 Abs. 3, 260a Abs. 1, 261 Abs. 3, 269 Abs. 1, 279 Abs. 2 und 3, 280 Abs. 2, 281 Abs. 1 und 3, 284, 285 Abs. 2 und 3, 286, 287 Abs. 3, 288 Abs. 2 Ziff. 1, 291, 295 Abs. 1 und 2, 329 Abs. 2, 334 Abs. 2, 348 Abs. 2, 397d Abs. 1, 397e Ziff. 1–4, 397f, 410 Abs. 2, 430 Abs. 1, 538 Abs. 2, 548 Abs. 2, 598 Abs. 2, 604 Abs. 2, 647 Abs. 2 Ziff. 1, 649b Abs. 3, 651 Abs. 2, 662 Abs. 3, 665 Abs. 2, 672 Abs. 2 und 3, 706 Abs. 2, 712c Abs. 3, 712i Abs. 2, 712q Abs. 1, 712r Abs. 3, 717 Abs. 2, 726 Abs. 2, Randtitel von Art. 736, 762, 808 Abs. 1 und 2, 809 Abs. 3, 860 Abs. 3, 864, 870 Abs. 1, 871, 961 Abs. 2 und 3, 977 Abs. 1, Schlusstitel Art. 54 Abs. 2.',
    },
  },
  {
    id: 'ZGB-AS-1999-1118-richterlich-gerichtlich',
    erlass: 'ZGB',
    as: 'AS 1999 1118',
    eli: `${FEDLEX_OC}1999/149`,
    beleg: 'AS 1999 1143, Ziff. I, «Ersatz von Ausdrücken» Abs. 2; Inkraftsetzung AS 1999 1144 Abs. 2 («auf den 1. Januar 2000»)',
    inKraft: '2000-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'richterlich',
    neu: 'gerichtlich',
    stamm: 'gerichtlich',
    umfang: { liste: 'Randtitel von Art. 4, Randtitel von Art. 172, Art. 649a, 649b Abs. 1, 656 Abs. 2, 712r Abs. 2 und 966 Abs. 2, Schlusstitel Art. 54 Abs. 2.' },
  },
  {
    id: 'ZGB-AS-1999-1118-gewalt-sorge',
    erlass: 'ZGB',
    as: 'AS 1999 1118',
    eli: `${FEDLEX_OC}1999/149`,
    beleg: 'AS 1999 1143, Ziff. I, «Ersatz von Ausdrücken» Abs. 3; Inkraftsetzung AS 1999 1144 Abs. 2 («auf den 1. Januar 2000»)',
    inKraft: '2000-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Gewalt',
    neu: 'Sorge',
    stamm: 'sorge',
    umfang: {
      liste:
        'Art. 25 Abs. 1, 271 Abs. 3, 299, 300 Abs. 1, 305 Abs. 1, 308 Abs. 3, Randtitel von Art. 311 und Art. 311 Abs. 1 und 2, 312, 313 Abs. 2, 318 Abs. 1 und 2, 368 Abs. 1, 383 Ziff. 3 und 385 Abs. 3.',
    },
  },
  // ── ZGB · AS 2011 725 (Erwachsenenschutz, Personenrecht und Kindesrecht, in Kraft 1.1.2013), «Ersatz von Ausdrücken» S. 755 ──
  {
    id: 'ZGB-AS-2011-725-vormundschaftsbehoerde-kindesschutzbehoerde',
    erlass: 'ZGB',
    as: 'AS 2011 725',
    eli: `${FEDLEX_OC}2011/114`,
    beleg: 'AS 2011 755, Ziff. I 2 «Weitere Bestimmungen des Zivilgesetzbuches», «Ersatz von Ausdrücken»; Inkraftsetzung «auf den 1. Januar 2013»',
    inKraft: '2013-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Vormundschaftsbehörde» oder «vormundschaftliche Aufsichtsbehörde',
    neu: 'Kindesschutzbehörde',
    stamm: 'kindesschutzbehörde',
    umfang: {
      liste:
        'Art. 131 Abs. 1, 134 Abs. 1 und 3, 145 Abs. 2, 146 Abs. 2 Ziff. 2, 147 Abs. 1, 179 Abs. 1 zweiter Teilsatz, 265 Abs. 3, 265a Abs. 2, 265d Abs. 1, 273 Abs. 2, 275 Abs. 1, 287 Abs. 1 und 2, 288 Abs. 2 Ziff. 1, 290, 298a Abs. 1, 307 Abs. 1 und 2, 308 Abs. 1, 309, 310, 316, 320 Abs. 2, 322 Abs. 2, 324 Abs. 1, 325.',
    },
  },
  // ── OR · AS 2020 957 (Handelsregisterrecht, übrige Bestimmungen in Kraft 1.1.2021), «Ersatz von Ausdrücken» S. 964 ──
  {
    id: 'OR-AS-2020-957-richter-gericht',
    erlass: 'OR',
    as: 'AS 2020 957',
    eli: `${FEDLEX_OC}2020/178`,
    beleg: 'AS 2020 964, Ziff. I 2 «Folgende Bestimmungen des Obligationenrechts», «Ersatz von Ausdrücken»; Inkraftsetzung AS 2020 967 Abs. 2 Bst. b («die übrigen Bestimmungen am 1. Januar 2021»)',
    inKraft: '2021-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Richter',
    neu: 'Gericht',
    stamm: 'gericht',
    ausser: [
      {
        artikel: '565',
        grund: 'Fedlex-Konsolidierung 1.1.2021–1.1.2022 trägt noch «richterliche»; der heutige Wortlaut «gerichtliche» gilt erst seit 1.1.2023 (parallele Anweisung AS 2020 4005, Aktienrecht: seit dem Nachzug 5.10.2026 als eigene Zeile OR-AS-2020-4005-richter-gericht erfasst)',
      },
    ],
    umfang: {
      liste:
        '545 Absatz 1 Ziffer 7, 565 Absatz 2, 574 Absatz 3, 577 Randtitel und Text, 579 Absatz 2, 580 Absatz 2, 583 Absatz 2, 585 Absatz 3, 601 Absatz 2, 643 Absatz 3, 685b Absatz 5, 697a Absatz 2, 697b Absatz 1, 697c, 697d Absatz 2, 697e Absätze 1 und 2, 697g Absatz 1, 699 Absatz 4, 706 Absatz 1, 706a Absatz 2, 716a Absatz 1 Ziffer 7, 725 Absatz 2, 725a Absätze 1 und 2, 731b Absätze 1–3, 736 Ziffer 4, 740 Absatz 4, 741 Absatz 2, 743 Absatz 2, 759 Absätze 2 und 3, 846 Absatz 3, 857 Absatz 3, 881 Absatz 3, 890 Absatz 2, 891 Absatz 1, 903 Absätze 2, 4 und 5, 904 Absatz 3, 918 Absatz 2 und 924 Absatz 2',
    },
  },
  // ── OR · AS 2020 4005 (Aktienrecht, abschliessend in Kraft 1.1.2023), Ziff. I «Ersatz von Ausdrücken» S. 4005, Absätze 1, 2, 4 ──
  // Die Liste von Abs. 1 überschneidet sich mit AS 2020 957 (Handelsregisterrecht, 1.1.2021): dort bereits ersetzte Artikel tragen
  // am Stichtag keinen Unterschied (Konsolidierung 1.1.2022 = 1.1.2023) — `ausser` (OR_2023_OHNE_WIRKUNG), je am Text belegt.
  {
    id: 'OR-AS-2020-4005-richter-gericht',
    erlass: 'OR',
    as: 'AS 2020 4005',
    eli: `${FEDLEX_OC}2020/746`,
    beleg: 'AS 2020 4005, Ziff. I «Ersatz von Ausdrücken» Abs. 1 («Richter» durch «Gericht» ersetzt, mit den nötigen grammatikalischen Anpassungen); abschliessende Inkraftsetzung AS 2022 109 («tritt am 1. Januar 2023 abschliessend in Kraft»; vorab in Kraft AS 2020 4005 S. 4063, 4145, AS 2021 846/848 — nicht die Ersatzlisten)',
    inKraft: '2023-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Richter',
    neu: 'Gericht',
    stamm: 'gericht',
    ausser: OR_2023_OHNE_WIRKUNG.map((artikel) => ({ artikel, grund: OR_2023_OHNE_WIRKUNG_GRUND })),
    umfang: {
      liste:
        '545 Absatz 1 Ziffer 7, 565 Absatz 2, 574 Absatz 3, 577 Randtitel und Text, 579 Absatz 2, 580 Absatz 2, 583 Absatz 2, 585 Absatz 3, 601 Absatz 2, 643 Absatz 3, 685b Absatz 5, 706 Absatz 1, 706a Absatz 2, 731b Absätze 1–3, 740 Absatz 4, 741 Absatz 2, 743 Absatz 2, 846 Absatz 3, 857 Absatz 3, 881 Absatz 3, 890 Absatz 2, 891 Absatz 1, 904 Absatz 3, 918 Absatz 2, 924 Absatz 2, 938a Absatz 2, 941a Randtitel und Absätze 1 und 3, 971 Absatz 1, 981 Absatz 1, 984 Absatz 2, 985 Absätze 1 und 2, 986 Absätze 1 und 2, 987 Absätze 1 und 2, 1072, 1073, 1075, 1076 Absatz 2, 1077 Absatz 2, 1078, 1079 Absatz 1, 1080 Randtitel und Absatz 1, 1162 Absätze 3 und 4 sowie Artikel 1182',
    },
  },
  {
    id: 'OR-AS-2020-4005-reinertrag-jahresgewinn',
    erlass: 'OR',
    as: 'AS 2020 4005',
    eli: `${FEDLEX_OC}2020/746`,
    beleg: 'AS 2020 4005, Ziff. I «Ersatz von Ausdrücken» Abs. 2 («Reinertrag» durch «Jahresgewinn» ersetzt); abschliessende Inkraftsetzung AS 2022 109 («am 1. Januar 2023»)',
    inKraft: '2023-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Reinertrag',
    neu: 'Jahresgewinn',
    stamm: 'jahresgewinn',
    umfang: { liste: '858 Randtitel, 859 Absätze 1–3, 860 Absatz 1, 861 Randtitel und Absätze 1‒3 sowie 863 Absätze 1 und 3' },
  },
  {
    id: 'OR-AS-2020-4005-zwischenbilanzen-zwischenabschluesse',
    erlass: 'OR',
    as: 'AS 2020 4005',
    eli: `${FEDLEX_OC}2020/746`,
    beleg: 'AS 2020 4005, Ziff. I «Ersatz von Ausdrücken» Abs. 4 («Zwischenbilanzen» durch «Zwischenabschlüsse» ersetzt); abschliessende Inkraftsetzung AS 2022 109 («am 1. Januar 2023»)',
    inKraft: '2023-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Zwischenbilanzen',
    neu: 'Zwischenabschlüsse',
    stamm: 'zwischenabschl',
    umfang: { liste: '587 Absatz 2 und 743 Absatz 5' },
  },
  // ── FusG · AS 2020 4005 (Aktienrecht, 1.1.2023), Ziff. II Anhang Ziff. 2 «Fusionsgesetz», «Ersatz eines Ausdrucks» S. 4065 ──
  {
    id: 'FUSG-AS-2020-4005-zwischenbilanz-zwischenabschluss',
    erlass: 'FUSG',
    as: 'AS 2020 4005',
    eli: `${FEDLEX_OC}2020/746`,
    beleg: 'AS 2020 4065, Anhang Ziff. 2 «Fusionsgesetz vom 3. Oktober 2003», «Ersatz eines Ausdrucks» («Zwischenbilanz» durch «Zwischenabschluss» ersetzt); abschliessende Inkraftsetzung AS 2022 109 («am 1. Januar 2023»)',
    inKraft: '2023-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Zwischenbilanz',
    neu: 'Zwischenabschluss',
    stamm: 'zwischenabschl',
    umfang: {
      liste:
        'Gliederungstitel vor den Artikeln 9, 32 und 57 sowie Artikel 11, 16 Absatz 1 Buchstabe d, 35, 41 Absatz 1 Buchstabe d, 58, 63 Absatz 1 Buchstabe d, 80 und 89',
    },
  },
  // ── PATG · AS 2015 3631 (Markenschutzgesetz/«Swissness», in Kraft 1.1.2017), Ziff. II 6 «Ersatz eines Ausdrucks» S. 3645 ──
  {
    id: 'PATG-AS-2015-3631-institut-ige',
    erlass: 'PATG',
    as: 'AS 2015 3631',
    eli: `${FEDLEX_OC}2015/609`,
    beleg: 'AS 2015 3645, Änderung anderer Erlasse Ziff. 6 «Patentgesetz», «Ersatz eines Ausdrucks» («Im ganzen Erlass wird mit Ausnahme der Fussnoten die Kurzbezeichnung «Institut» durch die Kurzbezeichnung «IGE» ersetzt»); Inkraftsetzung AS 2015 3640 Abs. 2 («auf den 1. Januar 2017»)',
    inKraft: '2017-01-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: 'Institut',
    neu: 'IGE',
    umfang: { ganzerErlass: true, erwartet: 'IGE' },
  },
  // ── StGB · AS 2006 3459 (Änderung vom 13. Dezember 2002, Allgemeiner Teil, in Kraft 1.1.2007) ──
  {
    id: 'STGB-AS-2006-3459-erstes-buch',
    erlass: 'STGB',
    as: 'AS 2006 3459',
    eli: `${FEDLEX_OC}2006/549`,
    beleg: 'AS 2006 3459, Ziff. I («Das erste Buch des Strafgesetzbuches erhält die folgende neue Fassung»; Liste = die Artikelüberschriften «Art. N» dieser Ziffer, S. 3459–3512); Inkraftsetzung 1. Januar 2007 (Fedlex-Rechtsanalyse des Erlasses, jolux:legalResourceImpactHasDateEntryInForce; ergänzt 5.10.2026 am Erlass selbst: ' + STGB_2006_INKRAFT + ')',
    inKraft: '2007-01-01',
    abgerufen: '2026-10-05',
    art: 'neufassung',
    bereichsname: 'Erstes Buch: Allgemeine Bestimmungen',
    umfang: {
      liste:
        'Art. 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 28a, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 48a, 49, 50, 51, 52, 53, 54, 55, 56, 56a, 57, 58, 59, 60, 61, 62, 62a, 62b, 62c, 62d, 63, 63a, 63b, 64, 64a, 64b, 65, 66, 67, 67a, 67b, 68, 69, 70, 71, 72, 73, 74, 75, 75a, 76, 77, 77a, 77b, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 102a, 103, 104, 105, 106, 107, 108, 109, 110.',
    },
  },
  // ── StGB · AS 2006 3459 Ziff. II (Zweites Buch, Strafdrohungen; in Kraft 1.1.2007) — Nachzug Gegenprüfung 5.10.2026, I2 ──
  // Die Fedlex-Konsolidierung trägt die Fussnote «Strafdrohung/Ausdruck gemäss Ziff. II …» nicht an jedem Artikel (StGB 116: 1990, StGB 213: 1990).
  // Abs. 1 Satz 2 («lebenslängliches» → «lebenslängliche», Art. 185 Ziff. 3, 266 Ziff. 2) nennt nur Artikel, die Satz 1 schon trifft: kein eigenes Ereignis.
  stgbAusdruck({
    abs: 1, seite: '3502',
    alt: 'Zuchthaus',
    neu: 'Freiheitsstrafe',
    stamm: 'freiheitsstrafe',
    liste: '111, 140 Ziffern 3 und 4, 185 Ziffern 2 und 3, 189 Absatz 3, 190 Absatz 3, 221 Absatz 2 und 266 Ziffer 2 erster und zweiter Satz',
  }),
  stgbAusdruck({
    abs: 2, seite: '3502–3503',
    alt: 'Gefängnis» bzw. «Gefängnis oder (mit) Busse» bzw. «Zuchthaus bis zu drei Jahren oder mit Gefängnis',
    neu: 'Freiheitsstrafe bis zu drei Jahren oder Geldstrafe',
    stamm: 'geldstrafe',
    liste: '114, 116, 117, 118 Absatz 3, 123 Ziffer 1 und 2, 125 Absatz 1, 128, 128bis, 133 Absatz 1, 135 Absatz 1, 136, 137 Ziffer 1, 141, 141bis, 142 Absatz 1, 143bis, 144 Absatz 1, 144bis Ziffer 1 erster Satz und Ziffer 2 erster Satz, 145, 149, 150, 151, 152, 153, 155 Ziffern 1 und 2, 158 Ziffer 1 erster Satz, 159, 161 Ziffer 1, 161bis, 162, 163 Ziffer 2, 164 Ziffer 2, 166, 167, 168 Absätze 1 und 2, 169, 170, 174 Ziffer 1, 179bis, 179quater, 179sexies Ziffer 1, 179novies, 180, 181, 186, 187 Ziffer 4, 188 Ziffer 1, 192 Absatz 1, 193 Absatz 1, 197 Ziffern 1 und 3 erster Satz, 213 Absatz 1, 215, 217 Absatz 1, 219 Absatz 1, 220, 221 Absatz 3, 222 Absätze 1 und 2, 223 Ziffer 1 zweiter Satz und Ziffer 2, 224 Absatz 2, 227 Ziffer 1 zweiter Satz und Ziffer 2, 228 Ziffer 1 zweiter Satz und Ziffer 2, 229 Absatz 2, 230 Ziffer 2, 231 Ziffer 2, 232 Ziffer 1 erster Satz und Ziffer 2, 233 Ziffer 1 erster Satz und Ziffer 2, 234 Absatz 2, 235 Ziffer 1 erster Satz, 236 Absatz 1 erster Satz, 237 Ziffer 1 erster Satz und Ziffer 2, 238 Absatz 2, 239 Ziffern 1 und 2, 240 Absatz 2, 241 Absatz 2, 242 Absätze 1 und 2, 244 Absatz 1, 245 Ziffer 1 erster Satz und Ziffer 2, 246, 247, 251 Ziffer 2, 252, 256, 257, 258, 259 Absätze 1 und 2, 260 Absatz 1, 261bis, 262 Ziffern 1 und 2, 263 Absatz 2, 267 Ziffer 3, 270, 272 Ziffer 1, 274 Ziffer 1 erster Satz, 275bis, 275ter, 276 Ziffer 1, 277 Ziffer 2, 279, 280, 281, 282 Ziffer 1, 283, 285 Ziffern 1 und 2 erster Satz, 287, 289, 290, 291 Absatz 1, 296, 297, 298, 299 Ziffern 1 und 2, 301 Ziffer 1, 303 Ziffer 2, 304 Ziffer 1, 305 Absatz 1, 305bis Ziffer 1, 306 Absatz 1, 310 Ziffern 1 und 2 erster Satz, 313, 318 Ziffer 1 erster und zweiter Satz, 319, 320 Ziffer 1 erster Satz und 321 Ziffer 1 erster Satz, 321ter Absatz 1, 322bis erster Satz, 322quinquies und 322sexies.',
  }),
  stgbAusdruck({
    abs: 3, seite: '3503',
    alt: 'Zuchthaus bis zu fünf Jahren oder mit Gefängnis',
    neu: 'Freiheitsstrafe bis zu fünf Jahren oder Geldstrafe',
    stamm: 'geldstrafe',
    liste: '115, 118 Absatz 1, 127, 129, 138 Ziffer 1 erster Satz, 139 Ziffer 1, 142 Absatz 2, 143 Absatz 1, 146 Absatz 1, 147 Absatz 1, 156 Ziffer 1, 157 Ziffer 1, 158 Ziffer 2, 160 Ziffer 1 erster Satz, 163 Ziffer 1, 164 Ziffer 1, 183 Ziffer 1, 187 Ziffer 1, 196 Absatz 2, 248, 251 Ziffer 1, 253, 254 Absatz 1, 260bis Absatz 1, 260ter Ziffer 1, 267 Ziffer 2, 268, 307 Absatz 1, 312, 317 Ziffer 1, 322ter, 322quater und 322septies',
  }),
  stgbAusdruck({
    abs: 4, seite: '3503',
    alt: 'Zuchthaus',
    neu: 'Freiheitsstrafe von einem Jahr',
    stamm: 'freiheitsstrafe',
    liste: '118 Absatz 2, 144 Absatz 3 erster Satz, 144bis Ziffer 1 zweiter Satz und Ziffer 2 zweiter Satz, 156 Ziffer 2, 157 Ziffer 2, 158 Ziffer 1 dritter Satz, 190 Absatz 1, 231 Ziffer 1 zweiter Satz, 232 Ziffer 1 zweiter Satz, 233 Ziffer 1 zweiter Satz, 237 Ziffer 1 zweiter Satz und 244 Absatz 2',
  }),
  stgbAusdruck({
    abs: 5, seite: '3503',
    alt: 'Haft oder (mit) Busse',
    neu: 'Busse',
    stamm: 'busse',
    liste: '120 Absatz 1, 126 Absatz 1, 172ter Absatz 1, 179, 179septies, 198, 199, 282bis, 292, 293 Absatz 1, 322bis zweiter Satz, 323, 325, 325bis, 326ter, 326quater, 328 Ziffer 1 und 329 Ziffer 1',
  }),
  stgbAusdruck({
    abs: 6, seite: '3503',
    alt: 'Gefängnis bis zu fünf Jahren',
    neu: 'Freiheitsstrafe bis zu fünf Jahren oder Geldstrafe',
    stamm: 'geldstrafe',
    liste: '134, 148 Absatz 1, 165 Ziffer 1, 225 Absatz 1, 266bis Absatz 1 und 275',
  }),
  stgbAusdruck({
    abs: 7, seite: '3503',
    alt: 'Gefängnis und Busse.',
    neu: 'Freiheitsstrafe bis zu drei Jahren oder Geldstrafe. Mit Freiheitsstrafe ist eine Geldstrafe zu verbinden.',
    stamm: 'geldstrafe',
    liste: '135 Absatz 3, 197 Ziffer 4, 229 Absatz 1 und 230 Ziffer 1',
  }),
  stgbAusdruck({
    abs: 8, seite: '3503',
    alt: 'Zuchthaus bis zu zehn Jahren oder mit Gefängnis',
    neu: 'Freiheitsstrafe bis zu zehn Jahren oder Geldstrafe',
    stamm: 'geldstrafe',
    liste: '138 Ziffer 2, 189 Absatz 1, 191 und 195',
  }),
  stgbAusdruck({
    abs: 9, seite: '3503',
    alt: 'Zuchthaus bis zu zehn Jahren oder mit Gefängnis nicht unter drei Monaten',
    neu: 'Freiheitsstrafe bis zu zehn Jahren oder Geldstrafe nicht unter 90 Tagessätzen',
    stamm: 'geldstrafe',
    liste: '139 Ziffer 2, 146 Absatz 2, 147 Absatz 2, 148 Absatz 2 und 160 Ziffer 2',
  }),
  stgbAusdruck({
    abs: 10, seite: '3503',
    alt: 'Zuchthaus bis zu zehn Jahren oder Gefängnis nicht unter sechs Monaten',
    neu: 'Freiheitsstrafe bis zu zehn Jahren oder Geldstrafe nicht unter 180 Tagessätzen',
    stamm: 'geldstrafe',
    liste: '139 Ziffer 3, 140 Ziffer 1 erster Satz und 226 Absatz 1',
  }),
  stgbAusdruck({
    abs: 11, seite: '3503',
    alt: 'Zuchthaus oder mit Gefängnis von einem bis zu fünf Jahren',
    neu: 'Freiheitsstrafe nicht unter einem Jahr',
    stamm: 'freiheitsstrafe',
    liste: '265, 266 Ziffer 1 und 267 Ziffer 1',
  }),
  stgbAusdruck({
    abs: 12, seite: '3503–3504',
    alt: 'Zuchthaus» bzw. «Zuchthaus oder Gefängnis nicht unter einem Jahr',
    neu: 'Freiheitsstrafe nicht unter einem Jahr',
    stamm: 'freiheitsstrafe',
    liste: '140 Ziffer 2, 156 Ziffer 4, 184, 185 Ziffer 1, 221 Absatz 1, 223 Ziffer 1 erster Satz, 224 Absatz 1, 227 Ziffer 1 erster Satz, 228 Ziffer 1 erster Satz, 240 Absatz 1, 266bis Absatz 2, 271 Ziffer 2, 272 Ziffer 2 erster Satz, 274 Ziffer 1 zweiter Satz',
  }),
  stgbAusdruck({
    abs: 13, seite: '3504',
    alt: 'Gefängnis bis zu sechs Monaten oder Busse',
    neu: 'Geldstrafe bis zu 180 Tagessätzen',
    stamm: 'geldstrafe',
    liste: '173 Ziffer 1, 194 Absatz 1, 261, 263 Absatz 1 und 278',
  }),
  stgbAusdruck({
    abs: 14, seite: '3504',
    alt: 'Zuchthaus bis zu fünf Jahren oder (mit) Gefängnis nicht unter einem Monat',
    neu: 'Freiheitsstrafe bis zu fünf Jahren oder Geldstrafe nicht unter 30 Tagessätzen',
    stamm: 'geldstrafe',
    liste: '226 Absätze 2 und 3 und 234 Absatz 1',
  }),
  stgbAusdruck({
    abs: 15, seite: '3504',
    alt: 'Zuchthaus oder (mit) Gefängnis',
    neu: 'Freiheitsstrafe oder Geldstrafe',
    stamm: 'geldstrafe',
    liste: '238 Absatz 1, 269, 271 Ziffer 3, 276 Ziffer 2, 277 Ziffer 1, 300 und 303 Ziffer 1',
  }),
  // Abs. 16 und 17: «Die Strafdrohungen … werden neu umschrieben» — die Überschriften «Art. N» der Ziffer II 1 (S. 3504–3508)
  {
    ...STGB_2006,
    id: 'STGB-AS-2006-3459-ii1-strafdrohung-neu',
    beleg: 'AS 2006 3504–3508, Ziff. II 1 Abs. 16 («In den nachstehenden Strafbestimmungen werden die Strafdrohungen neu umschrieben») und Abs. 17 («… der Strafrahmen wie folgt heraufgesetzt», Art. 294); ' + STGB_2006_INKRAFT,
    art: 'neufassung',
    bereichsname: 'Strafdrohung',
    umfang: {
      liste:
        'Art. 112, 113, 122, 135 Abs. 1bis, 150bis Abs. 1, 161 Ziff. 2, 172bis, 174 Ziff. 2, 177 Abs. 1, 179ter, 196 Abs. 1 und 3, 197 Ziff. 3bis, 219 Abs. 2, 231 Ziff. 1 erster Satz, 235 Ziff. 1 zweiter Satz, 241 Abs. 1, 243 Abs. 1 und 2, 260quater, 263 Abs. 2, 264 Abs. 1, 271 Ziff. 1, 273, 282 Ziff. 2, 285 Ziff. 2 zweiter Satz, 286, 305bis Ziff. 2 erster und zweiter Satz, 305ter Abs. 1, 306 Abs. 2, 307 Abs. 2 und 3, 310 Ziff. 2 zweiter Satz, 311 Ziff. 1 und 2, 314, 330, 331, 294.',
    },
  },
  // ── StGB · AS 2006 3459, später eingefügte Artikel mit angepasster Strafdrohung (Nachzug 5.10.2026, I2) ──
  {
    ...STGB_2006,
    id: 'STGB-AS-2006-3459-strafdrohung-spaeter-eingefuegt',
    beleg:
      'Art. 230bis (eingefügt AS 2003 4803) und 260quinquies (eingefügt AS 2003 3043) stehen NICHT in den AS-Listen von Ziff. II 1, ihr Wortlaut wechselt aber zwischen den Fedlex-Ständen 1.12.2006 («Zuchthaus bis zu zehn Jahren» bzw. «Zuchthaus bis zu fünf Jahren oder mit Gefängnis») und 1.1.2007 («Freiheitsstrafe …», «… oder Geldstrafe»); die Fussnote der Konsolidierung 1.1.2007 zu Art. 230bis nennt «Strafdrohungen neu umschrieben gemäss Ziff. II 1 Abs. 16 des BG vom 13. Dez. 2002, in Kraft seit 1. Jan. 2007 (AS 2006 3459 3535)», zu Art. 260quinquies steht keine; ' +
      STGB_2006_INKRAFT,
    art: 'neufassung',
    bereichsname: 'Strafdrohung',
    umfang: { liste: 'Art. 230bis, 260quinquies.' },
  },
  // ── LFG · AS 2011 1119 (eli/oc/2011/165; Änderung vom 1. Oktober 2010, in Kraft 1.4.2011), «Ersatz von Ausdrücken» S. 1119 ──
  // «Im ganzen Erlass wird: a. die Kurzbezeichnung «Bundesamt» durch «BAZL», b. «Departement» durch «UVEK» ersetzt.» Art. 8 Abs. 1 und 2, 24–26c,
  // 39 sowie der Anhang treten erst später in Kraft (Inkraftsetzung Abs. 3): dort gilt der Ersatz nicht ab 1.4.2011 (`ausser`).
  ...(['BAZL', 'UVEK'] as const).map((neu): Anweisung => ({
    id: `LFG-AS-2011-1119-${neu === 'BAZL' ? 'bundesamt-bazl' : 'departement-uvek'}`,
    erlass: 'LFG',
    as: 'AS 2011 1119',
    eli: `${FEDLEX_OC}2011/165`,
    beleg: `AS 2011 1119, Ziff. I «Ersatz von Ausdrücken» («Im ganzen Erlass wird: ${neu === 'BAZL' ? 'a. die Kurzbezeichnung «Bundesamt» durch die Kurzbezeichnung «BAZL»' : 'b. die Kurzbezeichnung «Departement» durch die Kurzbezeichnung «UVEK»'} ersetzt»); Inkraftsetzung AS 2011 1135 Abs. 2 («auf den 1. April 2011», ausgenommen Art. 8 Abs. 1 und 2, 24–26c, 39, Anhang Ziff. III)`,
    inKraft: '2011-04-01',
    abgerufen: '2026-10-05',
    art: 'ausdruck',
    alt: neu === 'BAZL' ? 'Bundesamt' : 'Departement',
    neu,
    ausser: ['8', '24', '25', '26', '26a', '26b', '26c', '39'].map((artikel) => ({
      artikel,
      grund: 'AS 2011 1119 Inkraftsetzung Abs. 3: «Artikel 8 Absatz 1 und 2, 24–26c, 39 sowie Anhang (Ziff. III) werden zu einem späteren Zeitpunkt in Kraft gesetzt» — «Gilt seit» dieser Artikel trägt die Fussnote mit dem späteren Datum',
    })),
    umfang: { ganzerErlass: true, erwartet: neu },
  })),
];
