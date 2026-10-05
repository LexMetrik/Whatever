// ─── Historie · Generalanweisungen als Artikel-Ereignis (W2·32-GENERALANWEISUNGEN, 5.10.2026) ──
//
// Ein Änderungserlass kann den Körper eines Artikels ändern, OHNE dass am Artikel eine Fussnote steht: «Ersatz von Ausdrücken»
// (Gesetzestechnische Richtlinien des Bundes, GTR Rz. 327–330: «In den Artikeln 28a Abs. 1, 299, … wird der Ausdruck «Gewalt» durch
// «Sorge» ersetzt») oder die Neufassung eines ganzen Buches («Das erste Buch des Strafgesetzbuches erhält die folgende neue
// Fassung»). Der Konsolidierungstext nennt die Anweisung dann nirgends — die Historie aus Fussnoten (historie-parse.ts) sieht
// sie nicht, «Gilt seit» bleibt auf einem älteren Datum (ZGB 299: 1978 statt 2000) oder fehlt ganz (StGB 52: 2004 statt 2007).
//
// Dieses Register führt solche Anweisungen als DATEN, jede mit Fundstelle im Amtsblatt (AS), amtlichem Link, In-Kraft-Datum und
// dem WORTLAUT der Artikelliste. Daraus leitet `anweisungsEreignisse` je Artikel ein Ereignis ab, das wie ein Fussnoten-Ereignis in
// «Gilt seit» eingeht (Maximum über die datierten Körper-Ereignisse). §2: reine Funktionen, kein Netz, kein Datum der Gegenwart.
// §7/§8: nur erfasst ist, was hier steht — jede andere Generalanweisung des Bundesrechts fehlt noch (bekannte Grenze, siehe
// bibliothek/normtext/generalanweisungen-gilt-seit-2026-10-05.md); das Register behauptet keine Vollständigkeit.
//
// Zwei Umfangsformen:
//   · `liste`        — die Artikelliste der Anweisung im Wortlaut («Art. 1 Abs. 2, 4, 28 Abs. 1, …»). `parseListe` zerlegt sie. Die
//                      Anweisung NENNT die Artikel: hier gilt sie, Ausnahmen (`ausser`) nur mit amtlichem Beleg.
//   · `ganzerErlass` — «Im ganzen Erlass wird …» (PATG: «Institut» → «IGE»). Die Anweisung nennt keine Artikel; betroffen ist ein
//                      Artikel, dessen HEUTIGER Text den neuen Ausdruck trägt (`erwartet`). Das ist abgeleitet, nicht genannt —
//                      darum mit Vorbehalt: ein jüngeres Überschrift-Ereignis (Neufassung/Einfügung des Abschnitts) kann den Artikel
//                      nach der Anweisung erst geschaffen oder neu gefasst haben (Vorgabe C), dann gibt es kein Ereignis.
// Eine Neufassung ganzer Artikel (StGB erstes Buch) ist eine `liste` mit art 'neufassung': die Artikelüberschriften der Ziffer I
// des AS-Erlasses, nicht ein Zahlenbereich — Artikel, die später dazukamen (Art. 66a–d, 67c–f, 79a/b, 92a), sind darin nicht.
// Nicht erfasst werden «Randtitel von Art. N» (Randtitel zählt nicht, Entscheid David 3.10.2026) und Schlusstitel-Artikel (kein
// Korpus-Schlüssel ableitbar).

import type { AnweisungsTreffer, HistorieEreignis } from './historie-parse';

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
  /** Artikel der `liste`, die das Register BEWUSST nicht datiert — je mit dem amtlichen Beleg, warum die Anweisung dort nicht (mehr)
   *  den heutigen Wortlaut bestimmt. Label ohne Unterstrich («430»). */
  ausser?: ReadonlyArray<{ artikel: string; grund: string }>;
  /** Stamm (klein), den der heutige Text eines betroffenen Artikels enthält, solange ihn kein späteres Ereignis neu gefasst hat
   *  — Tripwire des Korpus-Tests, nicht Teil der Ableitung. Nur bei 'ausdruck' mit `liste`. */
  stamm?: string;
  umfang: AnweisungsUmfang;
}

const FEDLEX_OC = 'https://fedlex.data.admin.ch/eli/oc/';

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
        grund: 'Fedlex-Konsolidierung 1.1.2021–1.1.2022 trägt noch «richterliche»; der heutige Wortlaut «gerichtliche» gilt erst seit 1.1.2023 (parallele Anweisung AS 2020 4005, Aktienrecht, nicht erfasst)',
      },
    ],
    umfang: {
      liste:
        '545 Absatz 1 Ziffer 7, 565 Absatz 2, 574 Absatz 3, 577 Randtitel und Text, 579 Absatz 2, 580 Absatz 2, 583 Absatz 2, 585 Absatz 3, 601 Absatz 2, 643 Absatz 3, 685b Absatz 5, 697a Absatz 2, 697b Absatz 1, 697c, 697d Absatz 2, 697e Absätze 1 und 2, 697g Absatz 1, 699 Absatz 4, 706 Absatz 1, 706a Absatz 2, 716a Absatz 1 Ziffer 7, 725 Absatz 2, 725a Absätze 1 und 2, 731b Absätze 1–3, 736 Ziffer 4, 740 Absatz 4, 741 Absatz 2, 743 Absatz 2, 759 Absätze 2 und 3, 846 Absatz 3, 857 Absatz 3, 881 Absatz 3, 890 Absatz 2, 891 Absatz 1, 903 Absätze 2, 4 und 5, 904 Absatz 3, 918 Absatz 2 und 924 Absatz 2',
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
    beleg: 'AS 2006 3459, Ziff. I («Das erste Buch des Strafgesetzbuches erhält die folgende neue Fassung»; Liste = die Artikelüberschriften «Art. N» dieser Ziffer, S. 3459–3512); Inkraftsetzung 1. Januar 2007 (Fedlex-Rechtsanalyse des Erlasses, jolux:legalResourceImpactHasDateEntryInForce)',
    inKraft: '2007-01-01',
    abgerufen: '2026-10-05',
    art: 'neufassung',
    bereichsname: 'Erstes Buch: Allgemeine Bestimmungen',
    umfang: {
      liste:
        'Art. 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 28a, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 48a, 49, 50, 51, 52, 53, 54, 55, 56, 56a, 57, 58, 59, 60, 61, 62, 62a, 62b, 62c, 62d, 63, 63a, 63b, 64, 64a, 64b, 65, 66, 67, 67a, 67b, 68, 69, 70, 71, 72, 73, 74, 75, 75a, 76, 77, 77a, 77b, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 102a, 103, 104, 105, 106, 107, 108, 109, 110.',
    },
  },
];

// ── Artikelliste → Stellen ─────────────────────────────────────────────────────────────────────────────────────

/** Eine Stelle einer Anweisung: ein Artikel (Label ohne Unterstrich: «28a») und der Absatz/die Ziffer, falls genannt. */
interface Stelle {
  /** Absatz-Angabe im Wortlaut («1», «2 und 3», «1–3»); null = der ganze Artikel (kein Absatz genannt). */
  absatz: string | null;
  /** Ziffer-Angabe («1», «1–4»); null = keine. */
  item: string | null;
}

/** Ergebnis von `parseListe`. */
export interface Liste {
  /** Artikel, deren KÖRPER die Anweisung nennt (Label → Stelle). */
  koerper: Map<string, Stelle>;
  /** Artikel, die nur mit «Randtitel von Art. N» genannt sind (Randtitel zählt nicht — kein Körper-Ereignis). */
  nurRandtitel: string[];
  /** Schlusstitel-Artikel (Korpus-Schlüssel hier nicht ableitbar). */
  schlusstitel: string[];
}

const NUM = String.raw`\d+[a-z]*`;
// Der nächste Posten beginnt mit Absatz-/Ziffer-Stichwort ⇒ «und 385 Abs. 3» ist ein neuer Artikel, kein weiterer Absatz.
const FOLGT_STICHWORT = /^\s+(?:Abs\.|Absatz|Absätze|Ziff\.|Ziffer|Ziffern|Randtitel)(?=\s|$)/;
// Absatz-/Ziffer-Nummern sind klein; eine grössere Zahl hinter «und» ist ein Artikel.
const KLEIN = (n: string): boolean => parseInt(n, 10) <= 20;

/** Absatz-/Ziffer-Gruppe ab `s` (hinter dem Stichwort): «2», «2 und 3», «1–3», bei Plural auch «2, 4 und 5». */
function gruppe(s: string, plural: boolean): { text: string; rest: string } {
  const erste = new RegExp(`^(${NUM})`).exec(s);
  if (!erste) throw new Error(`Anweisungsliste: Absatz-/Ziffer-Nummer erwartet bei «${s.slice(0, 24)}»`);
  let text = erste[1];
  let rest = s.slice(erste[0].length);
  for (;;) {
    const bis = new RegExp(`^\\s*–\\s*(${NUM})`).exec(rest);
    if (bis) { text += `–${bis[1]}`; rest = rest.slice(bis[0].length); continue; }
    const komma = plural ? new RegExp(`^\\s*,\\s*(${NUM})`).exec(rest) : null;
    if (komma && KLEIN(komma[1]) && !FOLGT_STICHWORT.test(rest.slice(komma[0].length))) {
      text += `, ${komma[1]}`; rest = rest.slice(komma[0].length); continue;
    }
    const und = new RegExp(`^\\s+und\\s+(${NUM})`).exec(rest);
    if (und && KLEIN(und[1]) && !FOLGT_STICHWORT.test(rest.slice(und[0].length))) {
      text += ` und ${und[1]}`; rest = rest.slice(und[0].length);
      // «Absätze 2, 4 und 5»: «und» schliesst die Gruppe; «Abs. 2 und 3» ebenfalls.
      const nochBis = new RegExp(`^\\s*–\\s*(${NUM})`).exec(rest);
      if (nochBis) { text += `–${nochBis[1]}`; rest = rest.slice(nochBis[0].length); }
    }
    return { text, rest };
  }
}

/**
 * Zerlegt die Artikelliste einer Anweisung im AS-Wortlaut. Kennt beide amtlichen Schreibweisen («Abs.»/«Ziff.» wie in AS 1999 1118
 * und «Absatz»/«Absätze»/«Ziffer» wie in AS 2020 957); der Wortlaut muss vollständig verbraucht werden — ein unbekanntes Stück wirft.
 */
export function parseListe(wortlaut: string): Liste {
  let s = wortlaut.replace(/\s+/g, ' ').replace(/[−‒]/g, '–').trim().replace(/[.]$/, '');
  const koerper = new Map<string, Stelle>();
  const randtitel = new Set<string>();
  const schluss = new Set<string>();
  const trenner = /^(?:\s|,|\bund\b|\bsowie\b)+/;
  while (s.length > 0) {
    const t = trenner.exec(s);
    if (t) { s = s.slice(t[0].length); continue; }
    const rtVon = /^Randtitel von\s+/.exec(s);
    if (rtVon) s = s.slice(rtVon[0].length);
    const schlussTitel = /^Schlusstitel\s+/.exec(s);
    if (schlussTitel) s = s.slice(schlussTitel[0].length);
    const artKopf = /^(?:Art\.|Artikeln?)\s*/.exec(s);
    if (artKopf) s = s.slice(artKopf[0].length);
    const label = new RegExp(`^(${NUM})(?![\\w])`).exec(s);
    if (!label) throw new Error(`Anweisungsliste: Artikelnummer erwartet bei «${s.slice(0, 30)}»`);
    s = s.slice(label[0].length);
    let absaetze: string[] = [];
    let items: string[] = [];
    let koerperTreffer = !rtVon; // «Randtitel von Art. N» ohne weitere Angabe trifft nur den Randtitel
    for (;;) {
      const sp = /^\s+/.exec(s);
      const t2 = sp ? s.slice(sp[0].length) : s;
      const rtText = /^Randtitel und Text\b/.exec(t2);
      if (rtText) { koerperTreffer = true; s = t2.slice(rtText[0].length); continue; }
      const abs = /^(Abs\.|Absatz|Absätze)\s+/.exec(t2);
      if (abs) {
        const g = gruppe(t2.slice(abs[0].length), abs[1] === 'Absätze');
        absaetze = [...absaetze, g.text]; koerperTreffer = true; s = g.rest; continue;
      }
      const zif = /^(Ziff\.|Ziffern?)\s+/.exec(t2);
      if (zif) {
        const g = gruppe(t2.slice(zif[0].length), zif[1] === 'Ziffern');
        items = [...items, g.text]; koerperTreffer = true; s = g.rest; continue;
      }
      const teil = /^(?:erster|zweiter|dritter|vierter)\s+(?:Satz|Teilsatz|Halbsatz)\b/.exec(t2);
      if (teil) { koerperTreffer = true; s = t2.slice(teil[0].length); continue; }
      break;
    }
    if (schlussTitel) { schluss.add(label[1]); continue; }
    if (!koerperTreffer) { randtitel.add(label[1]); continue; }
    const alt = koerper.get(label[1]);
    const neu: Stelle = {
      absatz: absaetze.length ? absaetze.join(' und ') : null,
      item: items.length ? items.join(' und ') : null,
    };
    if (!alt) koerper.set(label[1], neu);
    else {
      // Mehrere Nennungen desselben Artikels: ohne Absatz-Angabe gilt der ganze Artikel.
      koerper.set(label[1], {
        absatz: alt.absatz && neu.absatz ? `${alt.absatz} und ${neu.absatz}` : null,
        item: alt.item && neu.item ? `${alt.item} und ${neu.item}` : null,
      });
    }
  }
  // Ein Artikel, der auch im Körper steht, ist kein Nur-Randtitel-Artikel.
  return { koerper, nurRandtitel: [...randtitel].filter((l) => !koerper.has(l)), schlusstitel: [...schluss] };
}

const listeCache = new Map<string, Liste>();
function listeVon(a: Anweisung): Liste | null {
  if (!('liste' in a.umfang)) return null;
  let l = listeCache.get(a.id);
  if (!l) listeCache.set(a.id, (l = parseListe(a.umfang.liste)));
  return l;
}

// ── Anweisung → Ereignis ───────────────────────────────────────────────────────────────────────────────────────

function ereignis(a: Anweisung, stelle: Stelle | null): HistorieEreignis {
  return {
    typ: a.art === 'ausdruck' ? 'ausdruck' : 'fassung',
    datum: a.inKraft,
    wirkung: false,
    quellen: [{ label: a.as, url: a.eli }],
    absatz: stelle?.absatz ?? null,
    item: stelle?.item ?? null,
    anweisung: a.art === 'ausdruck' ? `«${a.alt}» → «${a.neu}»` : `${a.bereichsname} neu gefasst`,
  };
}

/** Korpus-Token («28_a») → Artikel-Label der Listen («28a»). */
export const tokenZuLabel = (token: string): string => token.replace(/_/g, '');

/**
 * Die Anweisungs-Ereignisse EINES Artikels (nach In-Kraft-Datum aufsteigend). `koerperText` = der heutige Körper-Text des Artikels:
 * `ganzerErlass` trifft nur, wenn er den neuen Ausdruck trägt; bei `liste` mit `stamm` entfällt das Ereignis, wenn der heutige Text
 * den Ersatzausdruck nicht mehr trägt (der Artikel wurde danach neu gefasst, ohne Fussnote am Artikel). Ohne `koerperText` (Unit-Tests)
 * keine Textprüfung für `liste`. Leere Liste = keine erfasste Anweisung.
 */
export function anweisungsEreignisse(erlass: string, token: string, koerperText?: string): AnweisungsTreffer[] {
  const label = tokenZuLabel(token);
  const aus: AnweisungsTreffer[] = [];
  for (const a of ANWEISUNGEN) {
    if (a.erlass !== erlass) continue;
    if ('liste' in a.umfang) {
      const stelle = listeVon(a)?.koerper.get(label);
      if (!stelle || a.ausser?.some((x) => x.artikel === label)) continue;
      // Trägt der heutige Text den Ersatzausdruck nicht mehr, wurde der Artikel danach neu gefasst (ohne Fussnote am Artikel, nur
      // an der Überschrift: ZGB 410/368/383/385 Erwachsenenschutz 2013, ZGB 860/864 Schuldbrief 2012). Das Datum dieser Anweisung
      // sagt dann nichts über den heutigen Wortlaut — kein Ereignis, «Gilt seit» bleibt, wie es war (§8).
      if (koerperText !== undefined && a.stamm && !koerperText.toLowerCase().includes(a.stamm)) continue;
      aus.push({ ereignis: ereignis(a, stelle), ueberschriftVorbehalt: false });
    } else if (koerperText !== undefined && /^\d+(?:_[a-z]+)*$/.test(token) && new RegExp(`\\b${a.umfang.erwartet}\\b`).test(koerperText)) {
      // Nur echte Artikel («110», «140_a»), keine Schluss-/Übergangsbestimmungen («disp_u1_art_146»): deren Datum ist das des Erlasses.
      aus.push({ ereignis: ereignis(a, null), ueberschriftVorbehalt: true });
    }
  }
  return aus.sort((x, y) => (x.ereignis.datum ?? '').localeCompare(y.ereignis.datum ?? ''));
}
