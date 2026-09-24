import { addDays, isWeekend, isBefore, isAfter } from 'date-fns';
import type { Kanton } from '../types/legal';
import { dauerTageInklusiv } from '../lib/datumsUtils';

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
//  - SO: EG ZPO § 22 Abs. 2 (BGS 221.2, Fassung 1.1.2025) — Katalog für
//    Art. 142 ZPO, kantonsweit, 1. Mai ganztags. Bis 24.9.2026 war der 1. Mai
//    hier «bewusst weggelassen» (Begründung «erst ab 12.00 Uhr» aus dem
//    Ruhetagsrecht BGS 512.41, für Fristen nicht massgeblich) — R1-02; die
//    BJ-Fussnoten 3/4 (Bucheggberg/einzelne Gemeinden) sind damit obsolet (R1-05).
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
//    (Hinweis an Nutzer: RL-23, Entscheid W-11).
//  - Schliesstage der Kantonsverwaltung: NE LI-CPC Art. 10a — s. NE-Block unten
//    (Entscheid W-10 a). BL GOG § 46 Abs. 2 (SGS 170; Geltung für ZPO-Fristen
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
  // LU ergänzt (BJ Ziff. 3 lit. a – Doppelcheck 6.6.2026).
  { art: 'fix', monat: 1, tag: 2, kantone: ['ZH', 'BE', 'LU', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'SH', 'SG', 'AG', 'TG', 'VD', 'VS', 'JU'], name: 'Berchtoldstag' },
  // NE: 2.1. nur, wenn der 1.1. ein Sonntag ist (BJ Ziff. 24 Fn. 10) — zusätzlich
  // als Schliesstag in Jahren mit amtlicher Liste (NE-Block, LI-CPC Art. 10a).
  { art: 'fix', monat: 1, tag: 2, kantone: ['NE'], name: 'Berchtoldstag', giltImJahr: (j) => wochentag(j, 1, 1) === 0 },
  { art: 'fix', monat: 1, tag: 6, kantone: ['UR', 'SZ', 'TI'], name: 'Heilige Drei Könige' },
  { art: 'fix', monat: 3, tag: 1, kantone: ['NE'], name: 'Instauration de la République' },
  { art: 'fix', monat: 3, tag: 19, kantone: ['UR', 'SZ', 'NW', 'TI', 'VS'], name: 'Josephstag' },
  // SO ergänzt (RL-22, R1-02): EG ZPO SO § 22 Abs. 2 (BGS 221.2) nennt «den 1. Mai»
  // ganztags als Feiertag für Art. 142 ZPO; die frühere «ab 12.00 Uhr»-Einschränkung
  // stammt aus dem Ruhetagsrecht, nicht aus der für Fristen massgebenden Norm.
  { art: 'fix', monat: 5, tag: 1, kantone: ['ZH', 'BS', 'BL', 'SO', 'SH', 'TG', 'AG', 'JU', 'NE', 'TI'], name: 'Tag der Arbeit' },
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

// NE-Block — Schliesstage der Kantonsverwaltung (RL-22, R1-04, Entscheid W-10 a).
// LI-CPC NE Art. 10a (RSN 251.1, in Kraft 1.4.2015, Etat 1.7.2019), Randtitel
// «Jours fériés (art. 142 CPC)»: «Sont considérés comme fériés dans le canton
// les jours où les bureaux de l'administration cantonale sont fermés à raison
// d'au moins une demi-journée.» (Wortlaut laut Zweitprüfung V8, amtlich geöffnet
// 23.9.2026: https://rsn.ne.ch/DATA/program/books/rsne/pdf/2511.pdf)
// Die Schliesstage legt der Conseil d'État fest (RDF RSN 152.512: «en sus des
// jours fériés légaux, les jours désignés par le Conseil d'Etat» — Suchtreffer
// 24.9.2026, Wortlaut NICHT selbst geöffnet). Eine stehende, jahresunabhängige
// Regel ist damit NICHT belegt → nur Jahre mit amtlich publizierter Liste
// werden geführt; für alle anderen Jahre gilt allein RSN 941.02 Art. 3 (oben),
// also das frühere Fristende (sichere Richtung, kein Raten).
// 2026: https://www.ne.ch/themes/economie-et-emploi/jours-feries-officiels
// (laut V8 abgerufen 23.9.2026): 2.1., Ostermontag, Freitag nach Auffahrt,
// Pfingstmontag, Lundi du Jeûne, 24.12., 26.12., 31.12. — Eigenabruf am
// 24.9.2026 durch Netzsperre verhindert; Gegenprüfung muss die Liste amtlich
// bestätigen. Neue Jahre nur mit amtlichem Beleg ergänzen (Pflegebedarf,
// bibliothek/normen/feiertage-kantone-bj.md).
const NE_SCHLIESSTAGE: Readonly<Record<number, ReadonlyArray<readonly [monat: number, tag: number]>>> = {
  2026: [[1, 2], [4, 6], [5, 15], [5, 25], [9, 21], [12, 24], [12, 26], [12, 31]],
};

function istNeSchliesstag(date: Date): boolean {
  const liste = NE_SCHLIESSTAGE[date.getFullYear()];
  return liste !== undefined && liste.some(([m, t]) => date.getMonth() === m - 1 && date.getDate() === t);
}

function giltImKanton(kantone: 'alle' | Kanton[], kanton: Kanton): boolean {
  return kantone === 'alle' || kantone.includes(kanton);
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Anerkannter Feiertag am Gerichtsort? (Art. 142 Abs. 3 ZPO) */
export function istFeiertag(date: Date, kanton: Kanton): boolean {
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
  if (kanton === 'NE' && istNeSchliesstag(date)) return true;
  return false;
}

/** Arbeitsfreier Tag = Samstag/Sonntag oder anerkannter Feiertag am Gerichtsort. */
export function istArbeitsfreierTag(date: Date, kanton: Kanton): boolean {
  return isWeekend(date) || istFeiertag(date, kanton);
}

/** Vorwärtsschiebung auf den nächsten Werktag (Sa/So/anerkannter Feiertag
 *  am massgebenden Ort) – kanonische Stelle; zuvor als while-Schleife in
 *  fristenEngine, verjaehrung und mietrecht je eigens ausgeschrieben. */
export function naechsterWerktag(d: Date, kanton: Kanton): Date {
  let t = d;
  while (istArbeitsfreierTag(t, kanton)) t = addDays(t, 1);
  return t;
}
