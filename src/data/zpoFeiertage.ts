import { addDays, isWeekend, isBefore, isAfter } from 'date-fns';
import type { Kanton } from '../types/legal';
import { dauerTageInklusiv, formatDatum } from '../lib/datumsUtils';

// ─── Ostersonntag (gregorianischer Computus, Meeus/Anonymous) ─────────────

export function ostersonntag(jahr: number): Date {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31); // 3 = März, 4 = April
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jahr, monat - 1, tag);
}

// ─── Fristenstillstand (Art. 145 Abs. 1 ZPO) ──────────────────────────────

export type Stillstandsperiode = { key: string; von: Date; bis: Date };

export function stillstandsperioden(jahr: number): Stillstandsperiode[] {
  const o = ostersonntag(jahr);
  return [
    // lit. a: 7. Tag vor bis und mit 7. Tag nach Ostersonntag → 15 Tage
    { key: `ostern-${jahr}`, von: addDays(o, -7), bis: addDays(o, 7) },
    // lit. b: 15. Juli bis und mit 15. August → 32 Tage
    { key: `sommer-${jahr}`, von: new Date(jahr, 6, 15), bis: new Date(jahr, 7, 15) },
    // lit. c: 18. Dezember bis und mit 2. Januar (Folgejahr) → 16 Tage
    { key: `weihnachten-${jahr}`, von: new Date(jahr, 11, 18), bis: new Date(jahr + 1, 0, 2) },
  ];
}

export function dauerTage(p: Stillstandsperiode): number {
  return dauerTageInklusiv(p);
}

const geq = (a: Date, b: Date) => !isBefore(a, b);
const leq = (a: Date, b: Date) => !isAfter(a, b);
const between = (d: Date, von: Date, bis: Date) => geq(d, von) && leq(d, bis);

/** Liefert die Stillstandsperiode, in die `date` fällt – oder null. */
export function stillstandsperiodeFuer(date: Date): Stillstandsperiode | null {
  const y = date.getFullYear();
  for (const jy of [y - 1, y, y + 1]) {
    for (const p of stillstandsperioden(jy)) {
      if (between(date, p.von, p.bis)) return p;
    }
  }
  return null;
}

// ─── Feiertage je Kanton (Art. 142 Abs. 3 ZPO) ────────────────────────────
//
// Datenbasis: Liste des Bundesamts für Justiz (BJ/EJPD) gestützt auf Art. 11 des
// Europäischen Übereinkommens vom 16.5.1972 über die Berechnung von Fristen
// (SR 0.221.122.3) – Grundgerüst; wo ein Kanton für Fristen eine eigene Norm
// führt, geht sie vor (RL-22, s. «GELTENDE KANTONALE SPEZIALNORMEN» unten).
// BJ-Liste abrufbar unter https://www.rhf.admin.ch/dam/de/sd-web/S6PzMB44EXP9/kant-feiertage.pdf
// (V8, HTTP 200 am 23.9.2026; frühere bj.admin.ch-URL HTTP 502, F1-08).
// «Wie gesetzliche Feiertage behandelte» Tage (lit. b der BJ-Liste) zählen
// gleich wie anerkannte (lit. a) – beide fallen unter das Übereinkommen.
//
// Doppelcheck 6.6.2026 (Auftrag David): alle 26 BJ-Sektionen Zeile für Zeile
// gegen diese Matrix abgeglichen. Korrigiert: LU-Berchtoldstag, GL-Allerheiligen,
// GL/VS-Stephanstag, JU-Pfingstmontag, FR-Mariä-Empfängnis, AI-Mauritiustag;
// BEDINGTE Tage der BJ-Fussnoten 1/7/9/10 jetzt regelhaft (giltImJahr):
// NE 2.1./26.12. nur, wenn 1.1./25.12. Sonntage sind; UR/AR/AI-Stephanstag
// entfällt, wenn Weihnachten auf Montag oder Freitag fällt.
//
// (Ergänzung RL-22, 24.9.2026: UR-Stephanstag seit RL-22 unbedingt, s. unten.)
//
// VERIFIKATIONSVORBEHALT (Ziff. 6.7): Stand der BJ-Liste ist 1.1.2011; rechtlich
// entscheidend bleibt das aktuelle kantonale Feiertagsrecht. Einzige bundesweite
// Feiertage: Neujahr, Auffahrt, 1. August, Weihnachten. Regionale/konfessionelle
// Feiertage (AG/GR kath. Gemeinden, AI innerer Landesteil [Mauritiustag:
// Gerichtsort Appenzell liegt darin]) gelten nur am konkreten Gerichtsort – als
// Annahme kantonsweit geführt, zu prüfen. BEWUSST WEGGELASSEN (offengelegt):
// SO-Josephstag/-Patrozinien (nur einzelne Gemeinden; § 22 Abs. 2 EG ZPO SO
// nennt sie nicht), NE-Fronleichnam (nur Le Landeron).
//
// GELTENDE KANTONALE SPEZIALNORMEN (RL-22, Prüfung Rechtslogik 23.9.2026,
// Befunde R1-01/02/03/05/09, Zweitprüfung V8; Art. 142 Abs. 3 ZPO verlangt
// «vom kantonalen Recht anerkannte» Feiertage — wo der Kanton für Fristen einen
// eigenen Katalog führt, geht er der BJ-Liste vor):
//  - SO: EG ZPO § 22 Abs. 2 (BGS 221.2, Fassung 1.1.2025) — Katalog «für die
//    Fristbestimmung gemäss Artikel 142 ZPO», kantonsweit, 1. Mai ganztags. Bis
//    24.9.2026 war der 1. Mai hier «bewusst weggelassen» (Begründung «erst ab
//    12.00 Uhr» aus dem Ruhetagsrecht BGS 512.41) — R1-02; die BJ-Fussnoten 3/4
//    (Bucheggberg/einzelne Gemeinden) sind damit obsolet (R1-05). Seit dem
//    RL-22-Nachzug (25.9.2026) ist der SO-1.-Mai ein BEDINGTER Feiertag (Block
//    «Bedingte kantonale Feiertage» unten): ganztags nur im ZPO-Kontext; das
//    allgemeine Ruhetagsgesetz SO § 2 Abs. 1 lit. b (BGS 512.41, Stand 1.9.2014)
//    nennt ihn nur «ab 12.00 Uhr».
//  - FR: JG Art. 121 Abs. 2 (SGF 130.1, Fassung 1.1.2024) — Feiertage gelten
//    «im ganzen Kanton»; BJ-Fussnote 2 (Seebezirk) obsolet (R1-05).
//  - UR: Ruhetagsgesetz Art. 9 lit. b (RB 70.1421, Fassung 1.1.2003) — Sankt-
//    Stefans-Tag ohne Wochentags-Vorbehalt (R1-03); der Mo/Fr-Vorbehalt galt
//    hier bis 24.9.2026 allein gestützt auf BJ-Fussnote 1.
//  - AR: V ArG Art. 7 (822.11, Stand 1.1.2016) trägt den Mo/Fr-Vorbehalt amtlich;
//    AI: RTG Art. 2 lit. b (822.200) «drei Ruhetage»-Regel, gleiche Daten (V8).
//  - Übereinstimmend amtlich geöffnet (R1/V8): AG EG ZPO § 21 (SAR 221.200),
//    OW GOG Art. 28 Abs. 2 (GDB 134.1), ZG GOG § 10 (BGS 161.1), VS RPflG
//    Art. 37 (SGS 173.1), NW GerG Art. 69 (NG 261.1 — nicht «262.1», R1-09),
//    ZH GOG § 122 (LS 211.1), BS RLG § 2 (SG 811.100), BE FRG Art. 2 (BSG 555.1).
//  - 2.1. SG/SH/GL (R1-01, V8 widerlegt — kein Rechtsfehler): BJ lit. b i.V.m.
//    Art. 5/11 EuFrÜb (BGer 5A_550/2017); SG Personalverordnung sGS 143.11
//    Art. 59 Abs. 1 + KG SG FS.2012.1 vom 29.3.2012; SH Personalverordnung
//    SHR 180.111 § 33 Abs. 1 + OGE 40/2018/1/K E. 2.1.4; GL Personalverordnung
//    GS II A/6/2 Art. 19 Abs. 2 lit. a — für GL keine Gerichtspraxis gefunden
//    (Hinweis an Nutzer: RL-23, Entscheid W-11). Seit RL-23 (25.9.2026) ist der
//    GL-2.1. ein BEDINGTER, unsicher gezählter Tag (Block «Bedingte kantonale
//    Feiertage», Ziff. 3); SG/SH bleiben in der Grundmatrix.
//  - Schliesstage der Kantonsverwaltung: NE — s. Block «Bedingte kantonale
//    Feiertage» unten (Entscheid W-10 a, Geltungsbereich RL-22-Nachzug). BL GOG § 46 Abs. 2 (SGS 170; Geltung für ZPO-Fristen
//    offen) und VD LVLP Art. 73 Abs. 2 (BLV 280.05; nur SchKG): NICHT als
//    Feiertag geführt, nur Hinweis (W-10; Nutzer-Hinweis folgt RL-23).

const ALLE_KANTONE: Kanton[] = ['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'];
const ausser = (...ex: Kanton[]): Kanton[] => ALLE_KANTONE.filter((k) => !ex.includes(k));

type FeiertagDef =
  | { art: 'fix'; monat: number; tag: number; kantone: 'alle' | Kanton[]; name: string;
      /** Bedingte Feiertage (BJ-Fussnoten 1/7/9/10) – deterministisch je Jahr. */
      giltImJahr?: (jahr: number) => boolean }
  | { art: 'ostern'; offset: number; kantone: 'alle' | Kanton[]; name: string };

/** Wochentag (0 = Sonntag) eines fixen Datums – für die BJ-Fussnotenregeln. */
const wochentag = (jahr: number, monat: number, tag: number) => new Date(jahr, monat - 1, tag).getDay();

const FEIERTAGE: FeiertagDef[] = [
  // Fixe Feiertage
  { art: 'fix', monat: 1, tag: 1, kantone: 'alle', name: 'Neujahr' },
  // LU ergänzt (BJ Ziff. 3 lit. a – Doppelcheck 6.6.2026). GL NICHT hier (RL-23):
  // unsicher gezählter bedingter Tag, s. Block «Bedingte kantonale Feiertage» Ziff. 3.
  { art: 'fix', monat: 1, tag: 2, kantone: ['ZH', 'BE', 'LU', 'OW', 'NW', 'ZG', 'FR', 'SO', 'SH', 'SG', 'AG', 'TG', 'VD', 'VS', 'JU'], name: 'Berchtoldstag' },
  // NE: 2.1. nur, wenn der 1.1. ein Sonntag ist (BJ Ziff. 24 Fn. 10) — zusätzlich
  // als bedingter Schliesstag (Block «Bedingte kantonale Feiertage», RDF Art. 11).
  { art: 'fix', monat: 1, tag: 2, kantone: ['NE'], name: 'Berchtoldstag', giltImJahr: (j) => wochentag(j, 1, 1) === 0 },
  { art: 'fix', monat: 1, tag: 6, kantone: ['UR', 'SZ', 'TI'], name: 'Heilige Drei Könige' },
  { art: 'fix', monat: 3, tag: 1, kantone: ['NE'], name: 'Instauration de la République' },
  { art: 'fix', monat: 3, tag: 19, kantone: ['UR', 'SZ', 'NW', 'TI', 'VS'], name: 'Josephstag' },
  // SO NICHT hier: EG ZPO SO § 22 Abs. 2 (BGS 221.2) nennt «den 1. Mai» ganztags nur
  // für Art. 142 ZPO — bedingter Feiertag, s. Block «Bedingte kantonale Feiertage».
  { art: 'fix', monat: 5, tag: 1, kantone: ['ZH', 'BS', 'BL', 'SH', 'TG', 'AG', 'JU', 'NE', 'TI'], name: 'Tag der Arbeit' },
  { art: 'fix', monat: 6, tag: 23, kantone: ['JU'], name: 'Commémoration du plébiscite jurassien' },
  { art: 'fix', monat: 6, tag: 29, kantone: ['TI'], name: 'Peter und Paul' },
  { art: 'fix', monat: 8, tag: 1, kantone: 'alle', name: 'Bundesfeier' },
  { art: 'fix', monat: 8, tag: 15, kantone: ['LU', 'UR', 'SZ', 'OW', 'NW', 'ZG', 'FR', 'SO', 'AI', 'TI', 'VS', 'JU', 'AG'], name: 'Mariä Himmelfahrt' },
  // AI: nur innerer Landesteil (BJ Fn. 8) – Gerichtsort Appenzell liegt darin.
  { art: 'fix', monat: 9, tag: 22, kantone: ['AI'], name: 'Mauritiustag' },
  { art: 'fix', monat: 9, tag: 25, kantone: ['OW'], name: 'Bruder-Klausen-Fest' },
  // GL ergänzt (BJ Ziff. 8 lit. a – Doppelcheck 6.6.2026).
  { art: 'fix', monat: 11, tag: 1, kantone: ['LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'AI', 'SG', 'TI', 'VS', 'JU', 'AG'], name: 'Allerheiligen' },
  // FR ergänzt (BJ Ziff. 10 lit. a, Seebezirk-Vorbehalt Fn. 2 – s. Kopfkommentar;
  // Fn. 2 seit FR JG Art. 121 Abs. 2 obsolet: «im ganzen Kanton», RL-22).
  { art: 'fix', monat: 12, tag: 8, kantone: ['LU', 'UR', 'SZ', 'OW', 'NW', 'ZG', 'FR', 'AI', 'TI', 'VS', 'AG'], name: 'Mariä Empfängnis' },
  { art: 'fix', monat: 12, tag: 25, kantone: 'alle', name: 'Weihnachten' },
  // GL (lit. a) und VS (lit. b) ergänzt; AR/AI/NE bedingt (eigene Einträge).
  // UR unbedingt (RL-22, R1-03): UR RB 70.1421 Art. 9 lit. b nennt den Sankt-Stefans-
  // Tag ohne Wochentags-Vorbehalt; der Mo/Fr-Vorbehalt stammte allein aus BJ Fn. 1.
  { art: 'fix', monat: 12, tag: 26, kantone: ausser('VD', 'GE', 'JU', 'NE', 'AR', 'AI'), name: 'Stephanstag' },
  // AR/AI: Stephanstag entfällt, wenn Weihnachten auf Mo/Fr fällt (BJ Fn. 7/9;
  // AR amtlich: V ArG AR 822.11 Art. 7, Stand 1.1.2016).
  { art: 'fix', monat: 12, tag: 26, kantone: ['AR', 'AI'], name: 'Stephanstag', giltImJahr: (j) => ![1, 5].includes(wochentag(j, 12, 25)) },
  // NE: 26.12. nur, wenn der 25.12. ein Sonntag ist (BJ Ziff. 24 Fn. 10).
  { art: 'fix', monat: 12, tag: 26, kantone: ['NE'], name: 'Stephanstag', giltImJahr: (j) => wochentag(j, 12, 25) === 0 },
  { art: 'fix', monat: 12, tag: 31, kantone: ['GE'], name: 'Restauration de la République' },
  // Osterabhängige Feiertage
  { art: 'ostern', offset: -2, kantone: ausser('TI', 'VS'), name: 'Karfreitag' },
  { art: 'ostern', offset: 1, kantone: ausser('NE'), name: 'Ostermontag' },
  { art: 'ostern', offset: 39, kantone: 'alle', name: 'Auffahrt' },
  // JU ergänzt (BJ Ziff. 26 lit. a «Lundi de Pentecôte» – Doppelcheck 6.6.2026).
  { art: 'ostern', offset: 50, kantone: ausser('NE'), name: 'Pfingstmontag' },
  { art: 'ostern', offset: 60, kantone: ['LU', 'UR', 'SZ', 'OW', 'NW', 'ZG', 'FR', 'SO', 'AI', 'TI', 'VS', 'JU', 'AG'], name: 'Fronleichnam' },
];

// Kantonale Spezialfeiertage mit eigener Datumsregel (nicht oster-/datumsfix).
// GL: 1. Donnerstag im April; fällt er in die Karwoche (= Gründonnerstag,
// Ostern −3), wird die Fahrt um eine Woche verschoben (Doppelcheck 6.6.2026,
// amtlich gl.ch: Fahrt 2026 am 9. statt 2. April).
// Karwochen-Donnerstag = Gründonnerstag; Prüfung deckungsgleich mit gl.ch-Regel
// (Beleg 2027: src/tests/feiertage-gegenprobe.test.ts, Näfelser-Fahrt-Block).
function naefelserFahrt(jahr: number): Date {
  let d = new Date(jahr, 3, 1);
  while (d.getDay() !== 4) d = addDays(d, 1);
  if (sameDay(d, addDays(ostersonntag(jahr), -3))) d = addDays(d, 7);
  return d;
}
function jeuneGenevois(jahr: number): Date {        // GE: Donnerstag nach 1. Sonntag im September
  let d = new Date(jahr, 8, 1);
  while (d.getDay() !== 0) d = addDays(d, 1);
  return addDays(d, 4);
}
function lundiJeuneFederal(jahr: number): Date {     // VD: Montag nach 3. Sonntag im September
  let d = new Date(jahr, 8, 1);
  while (d.getDay() !== 0) d = addDays(d, 1);
  return addDays(d, 14 + 1);
}

// ─── Bedingte kantonale Feiertage (RL-22-Nachzug, 25.9.2026) ─────────────
//
// Zwei kantonale Regeln machen einen Tag nur für BESTIMMTE Verfahren zum
// Feiertag. Sie zählen deshalb nicht pauschal, sondern je Feiertags-Kontext
// (Parameter `kontext` von istFeiertag & Co.). Wo die Gleichstellung nicht
// belegt ist, zählt der Tag NICHT (früheres = sicheres Fristende); die Engine
// warnt dann (hinweisBedingteFeiertage). Amtlich selbst geöffnet am 25.9.2026:
//
// (1) NE-Schliesstage der Kantonsverwaltung. Stehende Regel: Règlement des
//     fonctionnaires (RDF) Art. 11 Abs. 1 (RSN 152.512, Etat 1.1.2023, Text seit
//     Erlass 9.3.2005 ohne Änderungsfussnote), «Le personnel a congé et les
//     bureaux … de l'administration sont fermés toute la journée»: Sa, So,
//     31.12., 1./2.1., 1.3., Karfreitag, Ostermontag, 1.5., Auffahrt und Freitag
//     danach, Pfingstmontag, 1.8., Lundi du Jeûne fédéral, 24./25./26.12.
//     https://rsn.ne.ch/DATA/program/books/rsne/pdf/152512.pdf
//     Gegenprobe amtlich: ne.ch «Jours fériés officiels», Tabellen 2026 und 2027
//     (https://www.ne.ch/themes/economie-et-emploi/jours-feries-officiels) —
//     deckungsgleich mit der Regel. (Erstbau 24.9.2026 führte nur eine Tabelle
//     2026, weil eine stehende Regel nicht belegt schien — §7-Abweichung, hier
//     korrigiert; die Erstbau-Zitierung «jours désignés par le Conseil d'Etat»
//     steht so NICHT in RDF Art. 11.) RDF Art. 11 Abs. 2 (Ersatzfreitage des
//     Conseil d'État, wenn Tage auf Sa/So fallen) ist NICHT abgebildet — ob sie
//     die Büros schliessen, ist nicht belegt (offen, Pflegebedarf).
//     Gleichstellung mit einem Feiertag, je Wortlaut «Sont considérés comme
//     fériés dans le canton les jours où les bureaux de l'administration
//     cantonale sont fermés à raison d'au moins une demi-journée»:
//       · ZPO: LI-CPC Art. 10a (RSN 251.1, in Kraft 1.4.2015, Etat 1.7.2019),
//         Randtitel «Jours fériés (art. 142 CPC)» — rsn.ne.ch …/pdf/2511.pdf
//       · StPO: LI-CPP Art. 9a (RSN 322.0, in Kraft 1.4.2015, Etat 13.3.2024),
//         Randtitel «Jours fériés (art. 90 CPP)» — rsn.ne.ch …/pdf/3220.pdf
//       · kantonales Verwaltungsverfahren: LPA Art. 33 Abs. 3 (RSN 152.130,
//         État 1.1.2026; vorher LPJA Art. 20 Abs. 2) — rsn.ne.ch …/pdf/152130.pdf
//       · BGG Art. 45: BGer 9C_396/2018 vom 20.12.2018 E. 2.3 (Pfingstmontag in
//         NE = «jour férié selon le droit cantonal» kraft LPJA Art. 20 Abs. 2)
//       · VwVG Art. 20 Abs. 3: BVGer D-837/2025 vom 26.2.2025 (24./26.12. NE;
//         mit Verweis auf E-2540/2019)
//     NICHT belegt: SchKG (Art. 31 SchKG i.V.m. Art. 142 Abs. 3 ZPO; LILP NE,
//     RSN 261.1, kennt keine Regel) und OR Art. 78 («staatlich anerkannter
//     Feiertag»). Gilt erst ab 1.4.2015 (frühestes Inkrafttreten der
//     Gleichstellungsnormen LI-CPC/LI-CPP; sichere Richtung).
// (2) SO 1. Mai: EG ZPO § 22 Abs. 2 (BGS 221.2, Fassung 1.1.2025, gleichlautend
//     seit 1.3.2015) — «Für die Fristbestimmung gemäss Artikel 142 ZPO gelten als
//     vom kantonalen Recht anerkannte Feiertage: … der 1. Mai …»
//     https://bgs.so.ch/app/de/texts_of_law/221.2 — ausdrücklich auf Art. 142
//     ZPO beschränkt. Allgemein gilt nur Ruhetagsgesetz SO § 2 Abs. 1 lit. b
//     (BGS 512.41, Stand 1.9.2014): «1. Mai ab 12.00 Uhr»
//     (https://bgs.so.ch/app/de/texts_of_law/512.41). Zählt nur im ZPO-Kontext,
//     ab 1.3.2015 (ältere Fassungen nicht geprüft; sichere Richtung).
// (3) GL 2. Januar (RL-23, Befund Q5, Entscheid W-11 a «zählen + Warnung»,
//     David 24.9.2026). Amtlich selbst geöffnet am 25.9.2026:
//       · Ruhetagsgesetz GL (GS IX B/21/1, Version 1.7.2019) Art. 2 Abs. 1 lit. b/c
//         zählt die allgemeinen und hohen Feiertage auf — der 2.1. fehlt.
//         https://gesetze.gl.ch/app/de/texts_of_law/IX%20B%2F21%2F1
//       · Personalverordnung GL (GS II A/6/2, Fassung 1.7.2026) Art. 19 Abs. 2
//         lit. a: Berchtoldstag nur «bezahlter arbeitsfreier Tag» (mit Heiligabend,
//         Silvester), NICHT Feiertag nach Abs. 1; gilt auch für das Gerichts-
//         personal (Art. 1 Abs. 3). https://gesetze.gl.ch/app/de/texts_of_law/II%20A%2F6%2F2
//       · BJ-Verzeichnis (Stand 1.1.2011) Ziff. 8 lit. b: «Tage, die wie gesetzliche
//         Feiertage behandelt werden – Berchtoldstag, 2. Januar» = Notifikation nach
//         Art. 11 EuFrÜb (SR 0.221.122.3, Stand 1.1.2011); Art. 5 verlängert auch
//         bei solchen Tagen. Das Übereinkommen gilt nach Art. 1 Abs. 1 NUR «auf dem
//         Gebiet des Zivil-, Handels- und Verwaltungsrechts einschliesslich des
//         diese Gebiete betreffenden Verfahrensrechts» — nicht im Strafverfahren.
//     Zählt deshalb in zpo/schkg/bgg/vwvg/allgemein (+ weitest) mit Warnung
//     (unsicherer Tag, BEDINGT_UNSICHER), im Kontext stpo NICHT (Art. 90 Abs. 2
//     StPO: nur kantonales Recht, und das GL-Recht nennt den Tag nicht; sichere
//     Richtung, ebenfalls mit Warnung). Unterschied zu SG/SH: dort trägt der
//     kantonale Normwortlaut den 2.1. («Ruhetag» sGS 143.11 Art. 59 Abs. 1,
//     «Feiertag» SHR 180.111 § 33 Abs. 1) und Gerichtspraxis bestätigt ihn
//     (KG SG FS.2012.1, OGE SH 40/2018/1/K) → Grundmatrix, keine Warnung.

/**
 * Feiertags-Kontext = Verfahrensrecht, dessen Feiertagsbegriff gilt.
 * - 'zpo'      Art. 142 Abs. 1bis/3 ZPO (Gerichtsort)
 * - 'stpo'     Art. 90 Abs. 2 StPO (Wohnsitz/Sitz der Partei bzw. des Rechtsbeistands)
 * - 'bgg'      Art. 45 BGG · 'vwvg' Art. 20 Abs. 3 VwVG (Wohnsitz/Sitz)
 * - 'schkg'    Art. 31 SchKG i.V.m. Art. 142 Abs. 3 ZPO
 * - 'allgemein' OR Art. 78 und jede Stelle ohne eigenes Verfahrensrecht (Voreinstellung)
 * - 'weitest'  zählt ALLE bedingten Tage — NUR für Rechnungen, in denen der
 *              spätere Tag die sichere Seite ist (Wartefrist, Rückwärtsfrist)
 *              und für den Vergleich in hinweisBedingteFeiertage.
 */
export type FeiertagsKontext = 'zpo' | 'stpo' | 'bgg' | 'vwvg' | 'schkg' | 'allgemein' | 'weitest';

type BedingteArt = 'ne_schliesstag' | 'so_1_mai' | 'gl_berchtoldstag';

const BEDINGT_GILT_IN: Record<BedingteArt, readonly FeiertagsKontext[]> = {
  ne_schliesstag: ['zpo', 'stpo', 'bgg', 'vwvg', 'weitest'],
  so_1_mai: ['zpo', 'weitest'],
  gl_berchtoldstag: ['zpo', 'schkg', 'bgg', 'vwvg', 'allgemein', 'weitest'],
};

/** Bedingte Tage, die im Kontext zwar ZÄHLEN, deren Anerkennung aber unsicher
 *  ist (RL-23): die Engine warnt dann mit dem früheren, strengen Ende. */
const BEDINGT_UNSICHER: ReadonlySet<BedingteArt> = new Set<BedingteArt>(['gl_berchtoldstag']);

const BEDINGT_BESCHREIBUNG: Record<BedingteArt, string> = {
  ne_schliesstag:
    'im Kanton NE ein Schliesstag der Kantonsverwaltung (RDF Art. 11 Abs. 1, RSN 152.512). NE stellt '
    + 'solche Tage für Fristen nach ZPO, StPO und im Verwaltungsverfahren einem Feiertag gleich (LI-CPC '
    + 'Art. 10a, LI-CPP Art. 9a, LPA Art. 33 Abs. 3), für BGG/VwVG anerkannt (BGer 9C_396/2018 E. 2.3; '
    + 'BVGer D-837/2025)',
  so_1_mai:
    'der 1. Mai im Kanton SO: ganztags Feiertag nur für Fristen nach Art. 142 ZPO (EG ZPO SO § 22 Abs. 2, '
    + 'BGS 221.2); allgemein ist er erst ab 12.00 Uhr Ruhetag (Ruhetagsgesetz SO § 2 Abs. 1 lit. b, BGS 512.41)',
  gl_berchtoldstag:
    'der Berchtoldstag im Kanton Glarus. Das Ruhetagsgesetz GL (GS IX B/21/1 Art. 2 Abs. 1) nennt ihn nicht '
    + 'als Feiertag; die Personalverordnung GL (GS II A/6/2 Art. 19 Abs. 2 lit. a) führt ihn nur als '
    + 'arbeitsfreien Tag der Verwaltung, die Feiertagsliste des Bundesamts für Justiz (Stand 1.1.2011, '
    + 'Ziff. 8 lit. b) nur als Tag, der «wie ein gesetzlicher Feiertag behandelt» wird (Art. 5 EuFrÜb, '
    + 'SR 0.221.122.3, anwendbar nur im Zivil-, Handels- und Verwaltungsrecht, Art. 1 Abs. 1); ein '
    + 'Glarner Urteil dazu ist nicht bekannt',
};

const NE_SCHLIESSTAGE_AB = new Date(2015, 3, 1);   // LI-CPC Art. 10a / LI-CPP Art. 9a in Kraft
const SO_1_MAI_AB = new Date(2015, 2, 1);          // EG ZPO SO § 22 Abs. 2, geprüfte Fassung ab 1.3.2015

/** NE-Schliesstag nach RDF Art. 11 Abs. 1 (ohne Sa/So, die ohnehin arbeitsfrei sind). */
function istNeSchliesstag(date: Date): boolean {
  if (isBefore(date, NE_SCHLIESSTAGE_AB)) return false;
  const jahr = date.getFullYear();
  const o = ostersonntag(jahr);
  const fix: ReadonlyArray<readonly [monat: number, tag: number]> = [
    [12, 31], [1, 1], [1, 2], [3, 1], [5, 1], [8, 1], [12, 24], [12, 25], [12, 26],
  ];
  if (fix.some(([m, t]) => date.getMonth() === m - 1 && date.getDate() === t)) return true;
  // Karfreitag, Ostermontag, Auffahrt, Freitag nach Auffahrt, Pfingstmontag
  if ([-2, 1, 39, 40, 50].some((off) => sameDay(addDays(o, off), date))) return true;
  return sameDay(lundiJeuneFederal(jahr), date);
}

function bedingteArt(date: Date, kanton: Kanton): BedingteArt | null {
  if (kanton === 'NE' && istNeSchliesstag(date)) return 'ne_schliesstag';
  if (kanton === 'GL' && date.getMonth() === 0 && date.getDate() === 2) return 'gl_berchtoldstag';
  if (kanton === 'SO' && date.getMonth() === 4 && date.getDate() === 1 && !isBefore(date, SO_1_MAI_AB)) return 'so_1_mai';
  return null;
}

/**
 * Strenge Lesart (RL-23): der Kontext OHNE die unsicher gezählten bedingten
 * Tage (BEDINGT_UNSICHER, heute GL 2.1.). Nur für den Warnvergleich — nie
 * für das ausgewiesene Ergebnis (Entscheid W-11 a: der Tag zählt).
 */
export interface StrengeLesart { readonly kontext: FeiertagsKontext; readonly ohneUnsichere: true }
export type FeiertagsLesart = FeiertagsKontext | StrengeLesart;
export const strengeLesart = (kontext: FeiertagsKontext): StrengeLesart => ({ kontext, ohneUnsichere: true });

function zaehltBedingt(art: BedingteArt, lesart: FeiertagsLesart): boolean {
  if (typeof lesart === 'string') return BEDINGT_GILT_IN[art].includes(lesart);
  return !BEDINGT_UNSICHER.has(art) && BEDINGT_GILT_IN[art].includes(lesart.kontext);
}

function giltImKanton(kantone: 'alle' | Kanton[], kanton: Kanton): boolean {
  return kantone === 'alle' || kantone.includes(kanton);
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Feiertag nach der Grundmatrix (BJ-Liste + kantonale Spezialnormen), ohne bedingte Tage. */
function istGrundFeiertag(date: Date, kanton: Kanton): boolean {
  const jahr = date.getFullYear();
  const o = ostersonntag(jahr);
  const treffer = FEIERTAGE.some((def) => {
    if (!giltImKanton(def.kantone, kanton)) return false;
    if (def.art === 'fix' && def.giltImJahr && !def.giltImJahr(jahr)) return false;
    const tag = def.art === 'fix' ? new Date(jahr, def.monat - 1, def.tag) : addDays(o, def.offset);
    return sameDay(tag, date);
  });
  if (treffer) return true;
  // Kantonale Spezialfeiertage
  if (kanton === 'GL' && sameDay(naefelserFahrt(jahr), date)) return true;
  if (kanton === 'GE' && sameDay(jeuneGenevois(jahr), date)) return true;
  if (kanton === 'VD' && sameDay(lundiJeuneFederal(jahr), date)) return true;
  return false;
}

/**
 * Anerkannter Feiertag am massgebenden Ort im Feiertags-Kontext (Art. 142
 * Abs. 3 ZPO, Art. 90 Abs. 2 StPO, Art. 45 BGG, Art. 20 Abs. 3 VwVG, Art. 31
 * SchKG, Art. 78 OR). Voreinstellung 'allgemein' = bedingte kantonale Tage
 * zählen NICHT (sichere Richtung für jede Stelle ohne eigenen Kontext).
 */
export function istFeiertag(date: Date, kanton: Kanton, kontext: FeiertagsLesart = 'allgemein'): boolean {
  if (istGrundFeiertag(date, kanton)) return true;
  const art = bedingteArt(date, kanton);
  return art !== null && zaehltBedingt(art, kontext);
}

/** Arbeitsfreier Tag = Samstag/Sonntag oder anerkannter Feiertag im Kontext. */
export function istArbeitsfreierTag(date: Date, kanton: Kanton, kontext: FeiertagsLesart = 'allgemein'): boolean {
  return isWeekend(date) || istFeiertag(date, kanton, kontext);
}

/** Vorwärtsschiebung auf den nächsten Werktag (Sa/So/anerkannter Feiertag
 *  am massgebenden Ort) – kanonische Stelle; zuvor als while-Schleife in
 *  fristenEngine, verjaehrung und mietrecht je eigens ausgeschrieben. */
export function naechsterWerktag(d: Date, kanton: Kanton, kontext: FeiertagsLesart = 'allgemein'): Date {
  let t = d;
  while (istArbeitsfreierTag(t, kanton, kontext)) t = addDays(t, 1);
  return t;
}

/** Bedingter kantonaler Werktag im Kontext: ein Tag, der nur in ANDEREN
 *  Verfahren als Feiertag gilt (hier also als Werktag gezählt wird). */
function istUngezaehlterBedingterTag(date: Date, kanton: Kanton, kontext: FeiertagsKontext): BedingteArt | null {
  if (isWeekend(date) || istGrundFeiertag(date, kanton)) return null;
  const art = bedingteArt(date, kanton);
  return art !== null && !BEDINGT_GILT_IN[art].includes(kontext) ? art : null;
}

/**
 * Warnsatz (RL-22-Nachzug): Das im `kontext` berechnete Ende `eng` wäre bei
 * Zählung aller bedingten kantonalen Tage `weit` (eng ≤ weit). Nennt die dazwischen als
 * Werktag gezählten bedingten Tage. `null`, wenn beide gleich sind.
 * `richtung` = welche Seite die Engine gewählt hat: 'frueher' (Handlungsfrist:
 * früheres Ende ist sicher) oder 'spaeter' (Wartefrist/frühestes Datum).
 */
export function bedingteFeiertageSatz(
  von: Date, eng: Date, weit: Date, kanton: Kanton, kontext: FeiertagsKontext, richtung: 'frueher' | 'spaeter',
): string | null {
  if (+eng === +weit) return null;
  const tage: string[] = [];
  let art: BedingteArt | null = null;
  // Nur Tage bis zum gewählten früheren Ende zählen als Ursache (danach liegen
  // allein die Tage, über die die weiteste Lesart hinausschiebt).
  for (let t = von, g = 0; !isAfter(t, eng) && g < 400; t = addDays(t, 1), g++) {
    const a = istUngezaehlterBedingterTag(t, kanton, kontext);
    if (a) { tage.push(formatDatum(t)); art = art ?? a; }
  }
  if (!art) return null;
  const kopf = `Kantonaler Sonderfall: Der ${tage.join(', ')} ist ${BEDINGT_BESCHREIBUNG[art]}. `
    + 'Dass diese Gleichstellung für die hier berechnete Frist gilt, ist nicht belegt. ';
  return richtung === 'frueher'
    ? kopf + `Berechnet ist das frühere, sichere Fristende (${formatDatum(eng)}); gilt der Tag im konkreten `
      + `Verfahren als Feiertag, endet die Frist erst am ${formatDatum(weit)}. Im Zweifel bis ${formatDatum(eng)} handeln.`
    : kopf + `Berechnet ist das spätere, sichere Datum (${formatDatum(weit)}); gilt der Tag im konkreten `
      + `Verfahren nicht als Feiertag, wäre bereits der ${formatDatum(eng)} massgeblich.`;
}

/** Unsicher gezählter bedingter Tag im Kontext (RL-23: GL 2.1.). */
function istGezaehlterUnsichererTag(date: Date, kanton: Kanton, kontext: FeiertagsKontext): BedingteArt | null {
  if (isWeekend(date) || istGrundFeiertag(date, kanton)) return null;
  const art = bedingteArt(date, kanton);
  return art !== null && BEDINGT_UNSICHER.has(art) && BEDINGT_GILT_IN[art].includes(kontext) ? art : null;
}

/**
 * Warnsatz (RL-23, Q5/W-11 a): Das im `kontext` berechnete Ende `gezaehlt`
 * zählt einen unsicheren bedingten Tag (GL 2.1.) als Feiertag; ohne ihn wäre
 * es `streng` (streng ≤ gezaehlt). Ursache-Tage werden nur in `bereiche`
 * gesucht (je [von, bis) — die Stellen, an denen die Engine verschoben hat:
 * Art. 142 Abs. 1bis ZPO, Endverschiebung, Art. 63 SchKG). `null`, wenn gleich.
 * `richtung` 'frueher' = Handlungsfrist (gezählt = spätere, unsichere Seite),
 * 'spaeter' = frühestes Datum (gezählt = spätere, sichere Seite).
 */
export function unsichereFeiertageSatz(
  bereiche: ReadonlyArray<readonly [von: Date, bis: Date]>, gezaehlt: Date, streng: Date,
  kanton: Kanton, kontext: FeiertagsKontext, richtung: 'frueher' | 'spaeter',
): string | null {
  if (+gezaehlt === +streng) return null;
  const tage: string[] = [];
  let art: BedingteArt | null = null;
  for (const [von, bis] of bereiche) {
    for (let t = von, g = 0; isBefore(t, bis) && g < 400; t = addDays(t, 1), g++) {
      const a = istGezaehlterUnsichererTag(t, kanton, kontext);
      if (a) { tage.push(formatDatum(t)); art = art ?? a; }
    }
  }
  if (!art) return null;
  const kopf = `Kantonaler Sonderfall: Der ${tage.join(', ')} ist ${BEDINGT_BESCHREIBUNG[art]}. `
    + 'Er ist hier als Feiertag mitgezählt; ob das Gericht ihn als Feiertag anerkennt, ist nicht gesichert. ';
  return richtung === 'frueher'
    ? kopf + `Berechnet ist das Fristende ${formatDatum(gezaehlt)}; zählt der Tag nicht als Feiertag, endet die `
      + `Frist bereits am ${formatDatum(streng)}. Sicherheitshalber bis ${formatDatum(streng)} handeln.`
    : kopf + `Berechnet ist das spätere, sichere Datum (${formatDatum(gezaehlt)}); zählt der Tag nicht als `
      + `Feiertag, wäre bereits der ${formatDatum(streng)} massgeblich.`;
}

/** Hinweis für Vorwärtsfristen ohne Stillstand (Art. 78 OR u. ä.): `null` oder Warnsatz.
 *  RL-23: auch für unsicher gezählte Tage (GL 2.1.). */
export function hinweisBedingteFeiertage(rohesEnde: Date, kanton: Kanton, kontext: FeiertagsKontext = 'allgemein'): string | null {
  const eng = naechsterWerktag(rohesEnde, kanton, kontext);
  const weit = naechsterWerktag(rohesEnde, kanton, 'weitest');
  const streng = naechsterWerktag(rohesEnde, kanton, strengeLesart(kontext));
  return bedingteFeiertageSatz(rohesEnde, eng, weit, kanton, kontext, 'frueher')
    ?? unsichereFeiertageSatz([[rohesEnde, eng]], eng, streng, kanton, kontext, 'frueher');
}
