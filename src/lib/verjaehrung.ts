import { parseISO, addDays, addYears, differenceInCalendarDays, isAfter, isBefore } from 'date-fns';
import type { Berechnungsergebnis, Rechenschritt, Normverweis, Kanton } from '../types/legal';
import { formatDatum, formatISO } from './datumsUtils';
import { naechsterWerktag } from '../data/zpoFeiertage';
import { rechtsprechung } from '../data/verifikation';

// ─── Verjährung (Art. 60, 67, 127–142 OR, Stand Revision 1.1.2020) ─────────
//
// Vier Hauptregime mit je definiertem Fristbeginn und Dauer; einheitliche
// Berechnungs- (Art. 132 i.V.m. 77/78) und Modifikationsregeln:
// Stillstand (Art. 134) hängt gehemmte Tage hinten an, Unterbrechung
// (Art. 135/137/138) setzt die Frist neu. Zwei-Fristen-Logik: relative und
// absolute Frist laufen parallel; massgeblich ist grundsätzlich das frühere
// Ende. Zwei Ausnahmen (Gegenprüfung 2026-07-02): (a) Urkunde/Urteil begründet
// nach Art. 137 Abs. 2 OR eine SELBSTÄNDIGE 10-Jahres-Frist, die über die
// absolute Frist hinausreichen kann; (b) eine rechtzeitige Klage/ein
// Schlichtungsgesuch lässt nach Art. 138 Abs. 1 OR während des hängigen
// Verfahrens AUCH die absolute Frist ruhen (kein Ablauf im Prozess).
//
// Bewusst NICHT modelliert (Warnung/Annahme im Ergebnis): strafrechtliche
// Längerfrist (Art. 60 Abs. 2, StGB-abhängig), Spezialgesetze (SVG, VG, PrHG),
// Verlustscheinforderung (Art. 149a Abs. 1 SchKG: 20 Jahre ab Ausstellung,
// gegenüber Erben 1 Jahr ab Eröffnung des Erbgangs — kein Regime, Befund F5-07).
// Übergangsrecht für Altfälle vor 1.1.2020 (Art. 49 SchlT ZGB): für die
// Regime mit Altrecht (Art. 60/67 OR, vertraglicher Personenschaden) seit
// RL-08 (23.9.2026) abgebildet, siehe `pruefeAltrecht`; Art. 127/128 OR sind
// unverändert, dort bleibt es beim Übergangs-Hinweis.

export type VerjaehrungRegime =
  | 'ordentlich'      // Art. 127: 10 Jahre ab Fälligkeit
  | 'kurz'            // Art. 128: 5 Jahre ab Fälligkeit (Katalogforderungen)
  | 'delikt'          // Art. 60 Abs. 1: 3 Jahre ab Kenntnis / 10 Jahre ab Verhalten
  | 'delikt_person'   // Art. 60 Abs. 1bis: 3 Jahre / 20 Jahre (Tötung/Körperverletzung)
  | 'vertrag_person'  // Art. 128a: 3 Jahre ab Kenntnis / 20 Jahre ab Pflichtverletzung
  | 'bereicherung';   // Art. 67 Abs. 1: 3 Jahre ab Kenntnis / 10 Jahre ab Entstehung

export type UnterbrechungsTyp =
  | 'anerkennung'        // Art. 135 Ziff. 1 (formlos; z. B. Abschlagszahlung) → Ursprungsdauer
  | 'urkunde_urteil'     // Art. 137 Abs. 2: Anerkennung durch Urkunde / Urteil → stets 10 Jahre
  | 'betreibungsakt'     // Art. 135 Ziff. 2 / 138 Abs. 2: jeder Betreibungsakt → Ursprungsdauer
  | 'klage_schlichtung'; // Art. 135 Ziff. 2 / 138 Abs. 1: Hemmung bis Abschluss der Instanz

export type Unterbrechung = {
  typ: UnterbrechungsTyp;
  datum: string;        // yyyy-MM-dd
  prozessEnde?: string;  // nur klage_schlichtung: Abschluss vor der befassten Instanz (BGE 147 III 419)
  mitUrteil?: boolean;   // Abschluss durch Urteil → Art. 137 Abs. 2 (10 Jahre)
};

export type Stillstand = { von: string; bis: string; grund?: string }; // Art. 134 Abs. 1

export type VerjaehrungInput = {
  regime: VerjaehrungRegime;
  beginnRelativ: string;   // dies a quo der (relativen) Frist: Fälligkeit bzw. Kenntnis
  beginnAbsolut?: string;  // Delikt: schädigendes Verhalten (Ende); Bereicherung: Entstehung
  stichtag: string;        // Prüfdatum
  kanton: Kanton;          // Feiertagsverschiebung am Erfüllungsort (Art. 78)
  strafbareHandlung?: boolean;       // Art. 60 Abs. 2 → Hinweis (externe StGB-Frist)
  stillstaende?: Stillstand[];
  unterbrechungen?: Unterbrechung[];
  /** Einredeverzicht (Art. 141 OR) als Overlay. `datum` = Datum der
   *  Erklärung; Wirkungsende entweder als Enddatum der Erklärung (`bis`,
   *  massgeblich, wenn gesetzt) oder als Dauer in Jahren (`jahre`), je ab
   *  Erklärung gerechnet (W-06 a, offengelegte Lesart); höchstens 10 Jahre. */
  verzicht?: { datum: string; jahre?: number; bis?: string };
};

export type VerjaehrungErgebnis = Berechnungsergebnis & {
  relativEndeISO?: string;   // Ende der relativen/einheitlichen Frist (nach Modifikatoren)
  absolutEndeISO?: string;   // Ende der absoluten Frist (falls Regime eine kennt)
  verjaehrungISO?: string;   // massgebliches Ende (frühere der beiden, werktagsverschoben)
  massgeblicheFrist?: 'relativ' | 'absolut'; // welche Frist das Ende bestimmt
  verjaehrtAmStichtag?: boolean;
  verzichtBisISO?: string;   // Einredeverzicht wirkt bis (Art. 141)
  /** Verjährt am Stichtag, die Einrede ist aber durch einen am Stichtag
   *  wirksamen Verzicht ausgeschlossen (Art. 141 Abs. 1 / 142 OR). */
  einredeAusgeschlossenAmStichtag?: boolean;
  gehemmtTage?: number;
  /** Nur bei Altfällen (Fristbeginn vor 1.1.2020) der Regime mit Altrecht:
   *  welches Recht nach Art. 49 SchlT ZGB massgeblich ist. `bisheriges_recht`
   *  ⇒ verjaehrungISO IST das Altrecht-Ende; `unsicher` ⇒ Verdikt nicht
   *  eindeutig abbildbar (Ergebnis-Text + Warnung nennen beide Daten). */
  uebergangsrecht?: { art: 'bisheriges_recht' | 'neues_recht' | 'unsicher'; altrechtEndeISO: string };
};

// ─── Regime-Tabelle ─────────────────────────────────────────────────────────

export const REGIME: Record<VerjaehrungRegime, {
  label: string; relativJahre: number; absolutJahre: number | null;
  beginnLabel: string; absolutLabel?: string; normen: Normverweis[];
}> = {
  ordentlich: {
    label: 'Ordentliche Frist – 10 Jahre (Art. 127 OR)', relativJahre: 10, absolutJahre: null,
    beginnLabel: 'Fälligkeit der Forderung',
    normen: [{ artikel: 'Art. 127 OR', bemerkung: 'Auffangnorm: 10 Jahre' }, { artikel: 'Art. 130 Abs. 1 OR', bemerkung: 'Beginn mit Fälligkeit' }],
  },
  kurz: {
    label: 'Kurze Frist – 5 Jahre (Art. 128 OR)', relativJahre: 5, absolutJahre: null,
    beginnLabel: 'Fälligkeit der Forderung',
    normen: [{ artikel: 'Art. 128 OR', bemerkung: 'Katalogforderungen: 5 Jahre' }, { artikel: 'Art. 130 Abs. 1 OR', bemerkung: 'Beginn mit Fälligkeit' }],
  },
  delikt: {
    label: 'Unerlaubte Handlung – 3 / 10 Jahre (Art. 60 Abs. 1 OR)', relativJahre: 3, absolutJahre: 10,
    beginnLabel: 'Kenntnis von Schaden und Person des Ersatzpflichtigen',
    absolutLabel: 'schädigendes Verhalten (bzw. dessen Ende)',
    normen: [{ artikel: 'Art. 60 Abs. 1 OR', bemerkung: 'relativ 3 Jahre / absolut 10 Jahre' }],
  },
  delikt_person: {
    label: 'Unerlaubte Handlung, Personenschaden – 3 / 20 Jahre (Art. 60 Abs. 1bis OR)', relativJahre: 3, absolutJahre: 20,
    beginnLabel: 'Kenntnis von Schaden und Person des Ersatzpflichtigen',
    absolutLabel: 'schädigendes Verhalten (bzw. dessen Ende)',
    normen: [{ artikel: 'Art. 60 Abs. 1bis OR', bemerkung: 'Tötung/Körperverletzung: absolut 20 Jahre' }],
  },
  vertrag_person: {
    label: 'Vertraglicher Personenschaden – 3 / 20 Jahre (Art. 128a OR)', relativJahre: 3, absolutJahre: 20,
    beginnLabel: 'Kenntnis des Schadens',
    absolutLabel: 'Pflichtverletzung (bzw. deren Ende)',
    normen: [{ artikel: 'Art. 128a OR', bemerkung: 'Körperverletzung/Tötung aus Vertrag: 3 / 20 Jahre' }],
  },
  bereicherung: {
    label: 'Ungerechtfertigte Bereicherung – 3 / 10 Jahre (Art. 67 Abs. 1 OR)', relativJahre: 3, absolutJahre: 10,
    beginnLabel: 'Kenntnis des Bereicherungsanspruchs',
    absolutLabel: 'Entstehung des Anspruchs',
    normen: [{ artikel: 'Art. 67 Abs. 1 OR', bemerkung: 'relativ 3 Jahre / absolut 10 Jahre' }],
  },
};

const N_132: Normverweis = { artikel: 'Art. 132 OR', bemerkung: 'Beginntag zählt nicht; Ende am zahlengleichen Tag' };
const N_78: Normverweis = { artikel: 'Art. 78 OR', bemerkung: 'Sonn-/Feiertag → nächster Werktag; Samstag gleichgestellt' };
const N_134: Normverweis = { artikel: 'Art. 134 OR', bemerkung: 'Stillstand: gehemmte Tage werden angehängt' };
const N_135: Normverweis = { artikel: 'Art. 135 OR', bemerkung: 'Unterbrechung: Frist beginnt neu' };
const N_137_1: Normverweis = { artikel: 'Art. 137 Abs. 1 OR', bemerkung: 'neue Frist mit Ursprungsdauer' };
const N_137_2: Normverweis = { artikel: 'Art. 137 Abs. 2 OR', bemerkung: 'Urkunde/Urteil: neue Frist stets 10 Jahre' };
const N_138_1: Normverweis = { artikel: 'Art. 138 Abs. 1 OR', bemerkung: 'Hemmung bis Abschluss vor der befassten Instanz' };
const N_138_2: Normverweis = { artikel: 'Art. 138 Abs. 2 OR', bemerkung: 'jeder Betreibungsakt unterbricht neu' };
const N_141: Normverweis = { artikel: 'Art. 141 OR', bemerkung: 'Einredeverzicht: schriftlich, max. 10 Jahre' };
const N_142: Normverweis = { artikel: 'Art. 142 OR', bemerkung: 'Verjährung nur auf Einrede zu beachten' };
const N_60_2: Normverweis = { artikel: 'Art. 60 Abs. 2 OR', bemerkung: 'strafrechtliche Längerfrist vorbehalten' };

const N_49: Normverweis = { artikel: 'Art. 49 SchlT ZGB', bemerkung: 'Übergangsrecht Verjährung: bisher eingetretene Verjährung bleibt' };

// ─── Übergangsrecht Revision 2020 (Art. 49 SchlT ZGB) ──────────────────────
// Art. 49 SchlT ZGB, Fassung gemäss Anhang Ziff. 3 BG vom 15.6.2018 (Revision
// des Verjährungsrechts, AS 2018 5343, BBl 2014 235), in Kraft seit 1.1.2020.
// Wortlaut geprüft 23.9.2026 (RL-08) an Fedlex SR 210, Fassung 1.7.2026:
// https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de
//   Abs. 1: «Bestimmt das neue Recht eine längere Frist als das bisherige
//   Recht, so gilt das neue Recht, sofern die Verjährung nach bisherigem Recht
//   noch nicht eingetreten ist.» Abs. 2: «Bestimmt das neue Recht eine kürzere
//   Frist, so gilt das bisherige Recht.» Abs. 3: Beginn einer laufenden
//   Verjährung bleibt unberührt.
const INKRAFT_REVISION_2020 = '2020-01-01';
// Bisheriges Recht — Wortlaut geprüft 23.9.2026 an Fedlex SR 220, Fassung
// 1.11.2019 (letzte Fassung vor dem 1.1.2020), PDF/A:
// https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20191101/de/pdf-a/fedlex-data-admin-ch-eli-cc-27-317_321_377-20191101-de-pdf-a.pdf
//   aArt. 60 Abs. 1 OR: «in einem Jahre von dem Tage hinweg, wo der Geschädigte
//   Kenntnis vom Schaden und von der Person des Ersatzpflichtigen erlangt hat,
//   jedenfalls aber mit dem Ablaufe von zehn Jahren, vom Tage der schädigenden
//   Handlung an gerechnet» (keine Sonderfrist für Personenschäden).
//   aArt. 60 Abs. 2 OR: längere strafrechtliche Verjährung gilt auch zivil.
//   aArt. 67 Abs. 1 OR: «mit Ablauf eines Jahres, nachdem der Verletzte von
//   seinem Anspruch Kenntnis erhalten hat, in jedem Fall aber mit Ablauf von
//   zehn Jahren seit der Entstehung des Anspruchs».
//   Art. 127 / 130 Abs. 1 OR (unverändert): 10 Jahre ab Fälligkeit — für
//   vertragliche Personenschäden galt vor Art. 128a OR nur diese Frist.
//   Art. 132 OR (unverändert) und Art. 78 OR: Fristberechnung wie heute.
const ALTRECHT: Partial<Record<VerjaehrungRegime, { relativJahre: number | null; absolutJahre: number; norm: string }>> = {
  delikt: { relativJahre: 1, absolutJahre: 10, norm: 'aArt. 60 Abs. 1 OR: 1 Jahr ab Kenntnis / 10 Jahre ab schädigender Handlung' },
  delikt_person: { relativJahre: 1, absolutJahre: 10, norm: 'aArt. 60 Abs. 1 OR: 1 Jahr ab Kenntnis / 10 Jahre ab schädigender Handlung' },
  bereicherung: { relativJahre: 1, absolutJahre: 10, norm: 'aArt. 67 Abs. 1 OR: 1 Jahr ab Kenntnis / 10 Jahre ab Entstehung' },
  vertrag_person: { relativJahre: null, absolutJahre: 10, norm: 'Art. 127/130 Abs. 1 OR: 10 Jahre ab Fälligkeit (= Pflichtverletzung)' },
};

const fmt = formatDatum;
const iso = formatISO;

const TYP_LABEL: Record<UnterbrechungsTyp, string> = {
  anerkennung: 'Anerkennung (Art. 135 Ziff. 1 OR)',
  urkunde_urteil: 'Anerkennung durch Urkunde / gerichtliche Feststellung (Art. 137 Abs. 2 OR)',
  betreibungsakt: 'Betreibungsakt (Art. 135 Ziff. 2 / 138 Abs. 2 OR)',
  klage_schlichtung: 'Schlichtungsgesuch / Klage / Einrede (Art. 135 Ziff. 2 / 138 Abs. 1 OR)',
};

// ─── Berechnungskern ────────────────────────────────────────────────────────

// Art. 132: Beginntag nicht mitrechnen; Jahresfrist endet am zahlengleichen Tag
// (fehlt der Tag, am Monatsletzten – addYears bildet 29.02. → 28.02. ab).
// V3-Inventur 10.6.2026 (FAHRPLAN-VEREINHEITLICHUNG): rohesEnde/mitStillstand
// sind KEINE Dublette der fristenEngine-Bausteine, sondern bewusste
// Regime-Kopie — die OR-Verjährung ruht über BENANNTE Hemmungs-Intervalle
// (Art. 134 OR, abschliessend) statt über die fixen Gerichtsferien-Fenster
// der ZPO/SchKG (§1: lieber Duplikat als eine Abstraktion, die zwei
// rechtlich verschiedene Regimes gleich behandelt). Die fachNEUTRALE
// Werktags-Arithmetik kommt bereits aus data/zpoFeiertage.naechsterWerktag.
function rohesEnde(start: Date, jahre: number): Date {
  return addYears(start, jahre);
}

// Stillstandsperioden normalisieren: ungültige/invertierte Einträge verwerfen,
// überlappende oder anstossende Perioden zur Union verschmelzen – sonst würden
// sich überschneidende Eingaben doppelt gezählt und die Frist zu lang.
type HemmIntervall = { von: Date; bis: Date };
function normalisiereStillstaende(stillstaende: Stillstand[]): { intervalle: HemmIntervall[]; verworfen: number } {
  const gueltig = stillstaende
    .map((s) => ({ von: parseISO(s.von), bis: parseISO(s.bis) }))
    .filter((s) => !isNaN(s.von.getTime()) && !isNaN(s.bis.getTime()) && !isAfter(s.von, s.bis))
    .sort((a, b) => a.von.getTime() - b.von.getTime());
  const intervalle: HemmIntervall[] = [];
  for (const s of gueltig) {
    const letzte = intervalle[intervalle.length - 1];
    if (letzte && !isAfter(s.von, addDays(letzte.bis, 1))) {
      if (isAfter(s.bis, letzte.bis)) letzte.bis = s.bis; // überlappend/anstossend → verschmelzen
    } else {
      intervalle.push({ ...s });
    }
  }
  return { intervalle, verworfen: stillstaende.length - gueltig.length };
}

// Art. 134: Stillstands-Tage im Fenster (start, ende] zählen und hinten
// anhängen; iterativ, weil das verlängerte Fenster weitere Hemmung erfassen kann.
function mitStillstand(start: Date, ende0: Date, intervalle: HemmIntervall[]): { ende: Date; tage: number } {
  let ende = ende0;
  let gezaehlt = 0;
  for (let i = 0; i < 24; i++) {
    let tage = 0;
    for (const s of intervalle) {
      const a = isAfter(s.von, start) ? s.von : addDays(start, 1);
      const b = isBefore(s.bis, ende) ? s.bis : ende;
      const d = differenceInCalendarDays(b, a) + 1;
      if (d > 0) tage += d;
    }
    if (tage <= gezaehlt) break;
    ende = addDays(ende0, tage);
    gezaehlt = tage;
  }
  return { ende, tage: gezaehlt };
}

// Art. 78 (über Art. 132 Abs. 2): Sonntag/Feiertag am Erfüllungsort → nächster
// Werktag; der Samstag ist nach dem BG über den Fristenlauf an Samstagen gleichgestellt.
// Exportiert für Module mit derselben Fristend-Mechanik (z. B. Gewährleistung).
export function werktagsEnde(d: Date, kanton: Kanton): Date {
  return naechsterWerktag(d, kanton);
}

// Art. 49 SchlT ZGB (RL-08, Befunde F5-01/F5-02): Ende nach bisherigem Recht
// berechnen und entscheiden, welches Recht gilt. Deterministisch (§2); wo das
// bisherige Recht mit den Eingaben nicht eindeutig abbildbar ist (aArt. 60
// Abs. 2 OR, Unterbrechung/Stillstand im Altrecht-Fenster, Art. 49 Abs. 1 vs.
// Abs. 2 bei vertrag_person), lautet das Verdikt «unsicher» (§8).
type AltrechtBefund = {
  art: 'bisheriges_recht' | 'neues_recht' | 'unsicher';
  roh: Date; altEnde: Date; norm: string; grund?: string;
};
function pruefeAltrecht(
  input: VerjaehrungInput, hemmungen: HemmIntervall[], unterbrechungen: Unterbrechung[],
): AltrechtBefund | null {
  const A = ALTRECHT[input.regime];
  if (!A || !input.beginnAbsolut) return null;
  const grenze = parseISO(INKRAFT_REVISION_2020);
  const rel = parseISO(input.beginnRelativ);
  const abs = parseISO(input.beginnAbsolut);
  if (isNaN(abs.getTime()) || (!isBefore(rel, grenze) && !isBefore(abs, grenze))) return null;
  const absEnde = rohesEnde(abs, A.absolutJahre);
  const relEnde = A.relativJahre != null ? rohesEnde(rel, A.relativJahre) : null;
  const roh = relEnde && isBefore(relEnde, absEnde) ? relEnde : absEnde;
  const altEnde = werktagsEnde(roh, input.kanton);
  // «eingetreten» = letzter Tag unbenützt verstrichen (Art. 132 Abs. 1 OR) vor
  // Inkrafttreten: letzter Tag spätestens am 31.12.2019.
  const eingetreten = isBefore(altEnde, grenze);
  const befund = { roh, altEnde, norm: A.norm };
  const fruehesterBeginn = isBefore(abs, rel) ? abs : rel;
  const gruende: string[] = [];
  if (eingetreten && input.strafbareHandlung && (input.regime === 'delikt' || input.regime === 'delikt_person')) {
    gruende.push('Bei strafbarer Handlung galt schon nach bisherigem Recht die längere strafrechtliche Verjährung (aArt. 60 Abs. 2 OR); ob diese über den 1.1.2020 hinaus lief, ist StGB-abhängig und hier nicht berechnet.');
  }
  if (unterbrechungen.some((u) => { const d = parseISO(u.datum); return !isAfter(d, altEnde) && isBefore(d, grenze); })) {
    gruende.push('Eine Unterbrechung vor dem 1.1.2020 setzte nach bisherigem Recht die bisherige (kürzere) Frist neu in Gang; ob diese vor dem 1.1.2020 ablief, bildet der Rechner nicht ab.');
  }
  if (eingetreten && hemmungen.some((h) => !isAfter(h.von, altEnde) && isAfter(h.bis, fruehesterBeginn))) {
    gruende.push('Ein Stillstand im Fristenlauf vor dem 1.1.2020 richtet sich nach dem bisherigen Katalog von Art. 134 OR (2020 erweitert) und ist hier nicht nach bisherigem Recht abgebildet.');
  }
  if (!eingetreten && input.regime === 'vertrag_person') {
    gruende.push('Die neue relative 3-Jahres-Frist (Art. 128a OR) ist kürzer als die bisherige 10-Jahres-Frist (Art. 127 OR), die absolute 20-Jahres-Frist länger; ob Art. 49 Abs. 1 oder Abs. 2 SchlT ZGB massgeblich ist, ist nicht eindeutig.');
  }
  if (gruende.length > 0) return { ...befund, art: 'unsicher', grund: gruende.join(' ') };
  return { ...befund, art: eingetreten ? 'bisheriges_recht' : 'neues_recht' };
}

// ─── Hauptfunktion ──────────────────────────────────────────────────────────

export function berechneVerjaehrung(input: VerjaehrungInput): VerjaehrungErgebnis {
  const R = REGIME[input.regime];
  const rechenweg: Rechenschritt[] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];
  const { intervalle: hemmungen, verworfen } = normalisiereStillstaende(input.stillstaende ?? []);
  if (verworfen > 0) {
    warnungen.push(
      `${verworfen} Stillstandsperiode${verworfen > 1 ? 'n' : ''} mit ungültigen Daten (z. B. Ende vor Beginn) bleibt unberücksichtigt.`,
    );
  }

  const beginn = parseISO(input.beginnRelativ);
  const stichtag = parseISO(input.stichtag);

  const basis = (): VerjaehrungErgebnis => ({
    ergebnis: '', status: 'ok', rechenweg, annahmen, warnungen, normverweise: [],
  });

  if (isNaN(beginn.getTime()) || isNaN(stichtag.getTime())) {
    return { ...basis(), ergebnis: 'Ungültige Eingabe: Beginn- und Stichtag prüfen.', status: 'unzulaessig' };
  }
  if (R.absolutJahre != null && !input.beginnAbsolut) {
    return {
      ...basis(),
      ergebnis: `Für dieses Regime ist zusätzlich der Beginn der absoluten Frist anzugeben (${R.absolutLabel}).`,
      status: 'unzulaessig',
    };
  }

  // Schritt 1 – Regime & Fristen
  rechenweg.push({
    beschreibung: 'Schritt 1 – Anspruchstyp und Fristdauer',
    zwischenergebnis: `${R.label}. ${R.absolutJahre != null
      ? `Relative Frist ${R.relativJahre} Jahre, absolute Frist ${R.absolutJahre} Jahre; massgeblich ist das frühere Ende.`
      : `Einheitliche Frist von ${R.relativJahre} Jahren.`}`,
    normen: R.normen,
  });

  // Schritt 2 – Fristbeginn
  const kenntnisRegime = ['delikt', 'delikt_person', 'vertrag_person', 'bereicherung'].includes(input.regime);
  rechenweg.push({
    beschreibung: 'Schritt 2 – Fristbeginn (dies a quo)',
    zwischenergebnis: `${R.beginnLabel}: ${fmt(beginn)}. Der Beginntag wird nicht mitgerechnet (Art. 132 Abs. 1 OR).${
      input.beginnAbsolut ? ` Absolute Frist ab ${R.absolutLabel}: ${fmt(parseISO(input.beginnAbsolut))}.` : ''}`,
    normen: kenntnisRegime ? [N_132] : [{ artikel: 'Art. 130 Abs. 1 OR' }, N_132],
    rechtsprechung: input.regime === 'bereicherung'
      ? [rechtsprechung('BGE_135_III_289')]
      : input.regime === 'delikt' || input.regime === 'delikt_person'
        ? [rechtsprechung('BGE_131_III_61'), rechtsprechung('BGE_111_II_55')]
        : input.regime === 'ordentlich'
          ? [rechtsprechung('BGE_137_III_16')]
          : undefined,
  });
  if (kenntnisRegime) {
    annahmen.push(
      'Der Kenntniszeitpunkt (tatsächliche Kenntnis, kein Kennenmüssen) ist eine Tatfrage und wird als Eingabe übernommen – das Ergebnis ist insoweit annahmegestützt.',
    );
  }

  // ── Relative / einheitliche Frist mit Unterbrechungs-Kette ──
  const unterbrechungen = [...(input.unterbrechungen ?? [])]
    .filter((u) => !isNaN(parseISO(u.datum).getTime()))
    .sort((a, b) => parseISO(a.datum).getTime() - parseISO(b.datum).getTime());

  let segStart = beginn;
  let segJahre = R.relativJahre;
  let offeneHemmungSeit: Date | null = null;
  // Merkt, ob die zuletzt laufende Frist eine SELBSTÄNDIGE 10-Jahres-Frist nach
  // Art. 137 Abs. 2 OR ist (Urkunde/Urteil → «stets die zehnjährige»); dann
  // wird sie NICHT durch die ursprüngliche absolute Frist gekappt.
  let letztFrist137II = false;
  // Merkt, ob die letzte wirksame Unterbrechung die GANZE Verjährung neu
  // ansetzt (Klage/Schlichtung Art. 138 Abs. 1 OR mit Abschluss, oder
  // Urkunde/Urteil Art. 137 Abs. 2 OR) — dann kappt die ursprüngliche absolute
  // Frist die neue Frist nicht. Anerkennung/Betreibungsakt (Art. 137 Abs. 1 OR)
  // bleiben konservativ an der absoluten Frist gedeckelt (§8, doktrinell offen).
  let letztUnterbrPrimaer = false;
  let letztUnterbrDatum: Date | null = null;

  for (const u of unterbrechungen) {
    const d = parseISO(u.datum);
    const aktuellesEnde = mitStillstand(segStart, rohesEnde(segStart, segJahre), hemmungen).ende;
    // Bug-Check 10.6.2026 (HOCH, deklarierte fachliche Änderung): Fällt der
    // letzte Tag auf Sa/So/Feiertag, läuft die Frist erst am nächsten
    // Werktag ab (Art. 78 i.V.m. Art. 132 Abs. 2 OR) — eine Unterbrechung
    // an DIESEM Werktag ist rechtzeitig. Vorher wurde gegen das rohe Ende
    // verglichen und die rechtzeitige Handlung als wirkungslos verworfen,
    // obwohl die Engine denselben Werktag als letzten Tag publiziert.
    const wirksamBis = werktagsEnde(aktuellesEnde, input.kanton);
    if (isAfter(d, wirksamBis)) {
      warnungen.push(
        `${TYP_LABEL[u.typ]} vom ${fmt(d)} liegt nach dem Verjährungseintritt (${fmt(wirksamBis)}) und bleibt wirkungslos – eine verjährte Forderung wird nicht wiederbelebt.`,
      );
      continue;
    }
    if (u.typ === 'klage_schlichtung') {
      // Plausibilität: Abschluss kann nicht vor der Unterbrechung liegen
      if (u.prozessEnde) {
        const pe = parseISO(u.prozessEnde);
        if (isNaN(pe.getTime()) || isBefore(pe, d)) {
          warnungen.push(
            `Abschlussdatum ${isNaN(pe.getTime()) ? '(ungültig)' : fmt(pe)} der Unterbrechung vom ${fmt(d)} liegt vor der Unterbrechung oder ist ungültig – der Eintrag bleibt unberücksichtigt.`,
          );
          continue;
        }
      }
      if (!u.prozessEnde) {
        offeneHemmungSeit = d;
        rechenweg.push({
          beschreibung: `Unterbrechung – ${TYP_LABEL.klage_schlichtung}`,
          zwischenergebnis: `Am ${fmt(d)} unterbrochen; der Rechtsstreit ist noch nicht abgeschlossen – die Verjährung beginnt erst mit dem Abschluss vor der befassten Instanz neu zu laufen (Ausschöpfung des Instanzenzugs).`,
          normen: [N_135, N_138_1],
          rechtsprechung: [rechtsprechung('BGE_147_III_419')],
        });
        break;
      }
      const ende = parseISO(u.prozessEnde);
      segStart = ende;
      segJahre = u.mitUrteil ? 10 : R.relativJahre;
      letztFrist137II = !!u.mitUrteil; // Abschluss durch Urteil → Art. 137 Abs. 2 OR
      // Art. 138 Abs. 1 OR: Die Klage unterbricht die GANZE Verjährung neu →
      // die neue Frist wird nicht an der alten absoluten Frist gekappt.
      letztUnterbrPrimaer = true;
      letztUnterbrDatum = d;
      rechenweg.push({
        beschreibung: `Unterbrechung – ${TYP_LABEL.klage_schlichtung}`,
        zwischenergebnis: `Am ${fmt(d)} unterbrochen (Postaufgabe genügt); während des Verfahrens stand die Verjährung still. Mit Abschluss vor der befassten Instanz am ${fmt(ende)} beginnt eine neue Frist von ${segJahre} Jahren${u.mitUrteil ? ' (gerichtliche Feststellung, Art. 137 Abs. 2 OR)' : ''}.`,
        normen: u.mitUrteil ? [N_135, N_138_1, N_137_2] : [N_135, N_138_1, N_137_1],
        rechtsprechung: [rechtsprechung('BGE_147_III_419'), rechtsprechung('BGE_114_II_335')],
      });
    } else {
      segStart = d;
      segJahre = u.typ === 'urkunde_urteil' ? 10 : R.relativJahre;
      letztFrist137II = u.typ === 'urkunde_urteil'; // Art. 137 Abs. 2 OR: stets 10 Jahre
      // Urkunde/Urteil setzt selbständig neu an; Anerkennung/Betreibungsakt
      // bleiben konservativ an der absoluten Frist gedeckelt.
      letztUnterbrPrimaer = u.typ === 'urkunde_urteil';
      letztUnterbrDatum = d;
      rechenweg.push({
        beschreibung: `Unterbrechung – ${TYP_LABEL[u.typ]}`,
        zwischenergebnis: `Am ${fmt(d)} unterbrochen; die Verjährung beginnt neu mit einer Frist von ${segJahre} Jahren${u.typ === 'urkunde_urteil' ? ' (stets 10 Jahre, Art. 137 Abs. 2 OR)' : ''}.`,
        normen: u.typ === 'urkunde_urteil' ? [N_135, N_137_2] : u.typ === 'betreibungsakt' ? [N_135, N_138_2, N_137_1] : [N_135, N_137_1],
      });
    }
  }

  // ── Fristende der laufenden (letzten) Frist inkl. Stillstand ──
  let relativEnde: Date | null = null;
  let gehemmtTage = 0;
  if (!offeneHemmungSeit) {
    const roh = rohesEnde(segStart, segJahre);
    const st = mitStillstand(segStart, roh, hemmungen);
    relativEnde = st.ende;
    gehemmtTage = st.tage;
    rechenweg.push({
      beschreibung: 'Fristende der laufenden Frist (Art. 132 OR)',
      zwischenergebnis: `${segJahre} Jahre ab ${fmt(segStart)} → Ende am zahlengleichen Tag: ${fmt(roh)}${
        st.tage > 0 ? `; zuzüglich ${st.tage} stillgestandene Tage (Art. 134 OR) → ${fmt(st.ende)}` : ''}.`,
      normen: st.tage > 0 ? [N_132, N_134] : [N_132],
    });
  }

  // ── Absolute Frist (parallel) ──
  let absolutEnde: Date | null = null;
  if (R.absolutJahre != null && input.beginnAbsolut) {
    const aStart = parseISO(input.beginnAbsolut);
    const roh = rohesEnde(aStart, R.absolutJahre);
    const st = mitStillstand(aStart, roh, hemmungen);
    absolutEnde = st.ende;
    rechenweg.push({
      beschreibung: 'Absolute Frist',
      zwischenergebnis: `${R.absolutJahre} Jahre ab ${R.absolutLabel} (${fmt(aStart)}) → ${fmt(st.ende)}${
        st.tage > 0 ? ` (inkl. ${st.tage} stillgestandene Tage)` : ''}. Sie läuft unabhängig von Kenntnis und Schadenseintritt.`,
      normen: R.normen,
      rechtsprechung: input.regime === 'delikt' || input.regime === 'delikt_person'
        ? [rechtsprechung('BGE_146_III_25')] : undefined,
    });
    if (unterbrechungen.length > 0 && relativEnde && isAfter(relativEnde, absolutEnde)) {
      const absWirksam = werktagsEnde(absolutEnde, input.kanton);
      const primaerRechtzeitig = letztUnterbrPrimaer && letztUnterbrDatum != null
        && !isAfter(letztUnterbrDatum, absWirksam);
      if (primaerRechtzeitig && letztFrist137II) {
        // Gegenprüfung 2026-07-02 (Art. 137 Abs. 2 OR, «... so ist die neue
        // Verjährungsfrist STETS die zehnjährige»; Fedlex SR 220, Stand
        // 1.1.2026, https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de):
        // Die durch Urkunde-Anerkennung oder gerichtliche Feststellung
        // begründete 10-Jahres-Frist ist SELBSTÄNDIG und läuft ab dem Titel;
        // sie wird NICHT durch die ursprüngliche absolute Frist (Art. 60/67 OR)
        // gekappt und kann über diese hinausreichen (h.L. zum «stets»-Wortlaut
        // des Art. 137 Abs. 2 OR; ein einschlägiger BGE-Beleg ist offen und
        // fachlich zu ergänzen — QS-GP-Gegenprüfung 2.7.2026).
        // Zuvor überstimmte das «konservative» Kappen den «stets»-Wortlaut und
        // erzeugte ein falsches «verjährt»-Verdikt für titulierte Forderungen.
        annahmen.push(
          `Die durch Anerkennung mit Urkunde bzw. gerichtliche Feststellung begründete Frist ist nach Art. 137 Abs. 2 OR stets zehnjährig und selbständig; sie reicht über die ursprüngliche absolute Frist (${fmt(absWirksam)}) hinaus und ist massgeblich (${fmt(werktagsEnde(relativEnde, input.kanton))}).`,
        );
      } else if (primaerRechtzeitig) {
        // Klage/Schlichtung ohne Urteil (Art. 138 Abs. 1 OR): Die rechtzeitige
        // Unterbrechung erfasst die GANZE Verjährung; mit Abschluss vor der
        // befassten Instanz beginnt die (auch die absolute) Frist neu. Die neue
        // Frist wird daher nicht an der ursprünglichen absoluten Frist gekappt.
        annahmen.push(
          `Die rechtzeitige Klage/das Schlichtungsgesuch (Art. 138 Abs. 1 OR) unterbricht die gesamte Verjährung; nach Abschluss läuft die neu angesetzte Frist über die ursprüngliche absolute Frist (${fmt(absWirksam)}) hinaus und ist massgeblich (${fmt(werktagsEnde(relativEnde, input.kanton))}).`,
        );
      } else {
        // anerkennung / betreibungsakt (Art. 137 Abs. 1 OR): Ob solche
        // Unterbrechungshandlungen die absolute Höchstfrist (Art. 60/67 OR)
        // überschreiten können, ist höchstrichterlich nicht entschieden; die
        // frühere Behauptung «für Art. 67 OR gesichert» war unbelegt
        // (Gegenprüfung 2026-07-02: kein BGE erklärt die absolute
        // Bereicherungsfrist für unterbrechungsfest). Konservativ wird das
        // frühere (absolute) Datum ausgewiesen und die Annahme offengelegt (§8).
        annahmen.push(
          'Konservative Annahme: Die durch formlose Anerkennung oder Betreibungsakt (Art. 137 Abs. 1 OR) neu angesetzte Frist wird hier durch die absolute Frist (Art. 60/67 OR) begrenzt. Ob die absolute Höchstfrist durch solche Unterbrechungshandlungen überschritten werden kann, ist nicht höchstrichterlich geklärt – ausgewiesen wird das frühere (absolute) Datum; im Einzelfall fachlich zu prüfen.',
        );
      }
    }
  }

  // ── Massgebliches Ende: frühere der beiden Fristen, werktagsverschoben ──
  let verjaehrung: Date | null = null;
  let massgeblicheFrist: 'relativ' | 'absolut' | undefined;
  if (offeneHemmungSeit) {
    // Art. 138 Abs. 1 OR (Fedlex SR 220, Stand 1.1.2026): Die rechtzeitige Klage/
    // das Schlichtungsgesuch unterbricht die GANZE Verjährung; die Frist beginnt
    // erst mit Abschluss vor der befassten Instanz neu. Während des hängigen
    // Verfahrens ruht damit AUCH die absolute Frist – ein Fristablauf ist
    // ausgeschlossen (Gegenprüfung 2026-07-02: zuvor lief die absolute Frist
    // scheinbar weiter und meldete «verjährt» mitten im Prozess). Nur wenn die
    // Unterbrechung erst NACH Ablauf der absoluten Frist erfolgte, ist sie
    // verspätet und die absolute Frist bleibt massgeblich.
    const absWirksam = absolutEnde ? werktagsEnde(absolutEnde, input.kanton) : null;
    if (absWirksam && isAfter(offeneHemmungSeit, absWirksam)) {
      verjaehrung = absolutEnde;
      massgeblicheFrist = 'absolut';
    } else {
      verjaehrung = null; // steht prozessbedingt vollständig still
      massgeblicheFrist = undefined;
    }
  } else if (relativEnde) {
    // Eine Klage/ein Schlichtungsgesuch (Art. 138 Abs. 1 OR) oder Urkunde/Urteil
    // (Art. 137 Abs. 2 OR) setzt die GANZE Verjährung neu an — die neue Frist
    // wird nicht an der ursprünglichen absoluten Frist gekappt, SOFERN die
    // Unterbrechung noch vor deren Ablauf erfolgte (sonst war die Forderung
    // bereits verjährt und die Handlung wirkungslos).
    const absWirksam = absolutEnde ? werktagsEnde(absolutEnde, input.kanton) : null;
    const primaerRechtzeitig = letztUnterbrPrimaer && letztUnterbrDatum != null
      && (absWirksam == null || !isAfter(letztUnterbrDatum, absWirksam));
    if (absolutEnde && isBefore(absolutEnde, relativEnde) && !primaerRechtzeitig) {
      verjaehrung = absolutEnde;
      massgeblicheFrist = 'absolut';
    } else {
      verjaehrung = relativEnde;
      massgeblicheFrist = 'relativ';
    }
  }

  // Expliziter Vergleichsschritt, sobald beide Fristen parallel laufen
  if (relativEnde && absolutEnde) {
    // Neu angesetzte Frist reicht über die absolute hinaus und ist dennoch
    // massgeblich (Art. 137 Abs. 2 / 138 Abs. 1 OR – keine Kappung).
    const neuFristUeberAbsolut = massgeblicheFrist === 'relativ' && isAfter(relativEnde, absolutEnde);
    rechenweg.push({
      beschreibung: 'Massgebliches Fristende – relative vs. absolute Frist',
      zwischenergebnis: neuFristUeberAbsolut
        ? `Relative (neu angesetzte) Frist endet am ${fmt(relativEnde)}, ursprüngliche absolute Frist am ${fmt(absolutEnde)}. ` +
          `${letztFrist137II
            ? 'Die durch Urkunde/Urteil begründete Frist ist nach Art. 137 Abs. 2 OR stets zehnjährig und selbständig'
            : 'Die durch rechtzeitige Klage/Schlichtung neu angesetzte Frist (Art. 138 Abs. 1 OR) erfasst die gesamte Verjährung'}; ` +
          `sie läuft über die ursprüngliche absolute Frist hinaus und ist massgeblich (${fmt(verjaehrung!)}).`
        : `Relative Frist endet am ${fmt(relativEnde)}, absolute Frist am ${fmt(absolutEnde)}. ` +
          `Massgeblich ist das frühere Ende – hier die ${massgeblicheFrist === 'absolut' ? 'absolute' : 'relative'} Frist (${fmt(verjaehrung!)}). ` +
          'Die relative Frist kann nie über die absolute hinauslaufen.',
      normen: neuFristUeberAbsolut ? [...R.normen, letztFrist137II ? N_137_2 : N_138_1] : R.normen,
    });
  } else if (offeneHemmungSeit && absolutEnde) {
    const verspaetet = massgeblicheFrist === 'absolut';
    rechenweg.push({
      beschreibung: verspaetet
        ? 'Massgebliches Fristende – absolute Frist bereits abgelaufen'
        : 'Fristenlauf während des hängigen Verfahrens (Art. 138 Abs. 1 OR)',
      zwischenergebnis: verspaetet
        ? `Die Unterbrechung vom ${fmt(offeneHemmungSeit)} erfolgte erst nach Ablauf der absoluten Frist ` +
          `(${fmt(werktagsEnde(absolutEnde, input.kanton))}) und ist verspätet; die absolute Frist bleibt massgeblich.`
        : `Die rechtzeitige Klage/das Schlichtungsgesuch unterbricht die GANZE Verjährung: Während des hängigen Verfahrens ruht ` +
          `auch die absolute Frist (${fmt(werktagsEnde(absolutEnde, input.kanton))}); ein Fristablauf ist bis zum Abschluss vor der ` +
          `befassten Instanz ausgeschlossen (Art. 138 Abs. 1 OR).`,
      normen: [...R.normen, N_138_1],
      rechtsprechung: [rechtsprechung('BGE_147_III_419')],
    });
  }

  // ── Übergangsrecht (Art. 49 SchlT ZGB) für Altfälle vor dem 1.1.2020 ──
  const ue = pruefeAltrecht(input, hemmungen, unterbrechungen);
  if (ue) {
    const werktagZusatz = ue.roh.getTime() !== ue.altEnde.getTime()
      ? ` (letzter Tag ${fmt(ue.roh)} arbeitsfrei → nächster Werktag, Art. 78 OR)` : '';
    rechenweg.push({
      beschreibung: 'Übergangsrecht – Vergleich mit dem bisherigen Recht (Art. 49 SchlT ZGB)',
      zwischenergebnis: ue.art === 'bisheriges_recht'
        ? `Nach bisherigem Recht (${ue.norm}) endete die Frist am ${fmt(ue.altEnde)}${werktagZusatz} – vor Inkrafttreten der Revision am 01.01.2020. Die Verjährung ist damit nach bisherigem Recht eingetreten; die längeren neuen Fristen gelten nicht (Art. 49 Abs. 1 SchlT ZGB). Massgeblich ist dieses Datum, nicht die oben nach neuem Recht berechneten Fristen.${
          unterbrechungen.length > 0 ? ' Spätere Unterbrechungshandlungen konnten die bereits eingetretene Verjährung nicht mehr unterbrechen.' : ''}`
        : ue.art === 'neues_recht'
          ? `Nach bisherigem Recht (${ue.norm}) wäre die Verjährung erst am ${fmt(ue.altEnde)}${werktagZusatz} eingetreten, also nicht vor dem 01.01.2020. Es gilt das neue Recht mit den längeren Fristen (Art. 49 Abs. 1 SchlT ZGB); der Beginn der laufenden Verjährung bleibt unberührt (Art. 49 Abs. 3 SchlT ZGB).`
          : `Nach bisherigem Recht (${ue.norm}) ergäbe sich ohne Weiteres das Ende ${fmt(ue.altEnde)}${werktagZusatz}. ${ue.grund} Die nachstehenden Daten sind nach neuem Recht berechnet; das Verdikt ist unsicher.`,
      normen: [N_49, ...(input.regime === 'vertrag_person' ? [{ artikel: 'Art. 127 OR' }, { artikel: 'Art. 130 Abs. 1 OR' }] : [])],
      rechtsprechung: input.regime === 'vertrag_person' ? [rechtsprechung('BGE_137_III_16')] : undefined,
    });
    if (input.regime === 'vertrag_person') {
      annahmen.push('Übergangsrecht: Nach bisherigem Recht verjährte der vertragliche Personenschaden in 10 Jahren ab Fälligkeit (Art. 127/130 Abs. 1 OR); als Fälligkeit wird der eingegebene Zeitpunkt der Pflichtverletzung übernommen (BGE 137 III 16).');
    }
    if (ue.art === 'unsicher') {
      warnungen.push(`Übergangsrecht (Art. 49 SchlT ZGB) nicht eindeutig abbildbar: ${ue.grund} Ende nach bisherigem Recht ohne diese Umstände: ${fmt(ue.altEnde)}. Ergebnis fachlich prüfen.`);
    }
  }

  let verschoben: Date | null = null;
  if (ue?.art === 'bisheriges_recht') {
    // Art. 49 Abs. 1 SchlT ZGB: die nach bisherigem Recht eingetretene
    // Verjährung bleibt; keine der neuen Fristen ist massgeblich.
    verschoben = ue.altEnde;
    massgeblicheFrist = undefined;
    annahmen.push(`Feiertagsverschiebung nach den im Kanton ${input.kanton} staatlich anerkannten Feiertagen (Erfüllungsort als Eingabe).`);
  } else if (verjaehrung) {
    verschoben = werktagsEnde(verjaehrung, input.kanton);
    if (verschoben.getTime() !== verjaehrung.getTime()) {
      rechenweg.push({
        beschreibung: 'Werktagsregel (Art. 78 OR i.V.m. Art. 132 Abs. 2 OR)',
        zwischenergebnis: `Der letzte Tag (${fmt(verjaehrung)}) fällt auf einen Samstag, Sonntag oder anerkannten Feiertag (${input.kanton}) – die Frist läuft erst am nächsten Werktag ab: ${fmt(verschoben)}.`,
        normen: [N_78],
      });
    }
    annahmen.push(`Feiertagsverschiebung nach den im Kanton ${input.kanton} staatlich anerkannten Feiertagen (Erfüllungsort als Eingabe).`);
  }

  // ── Ergebnis am Stichtag ──
  const verjaehrt = verschoben ? isAfter(stichtag, verschoben) : false;
  rechenweg.push({
    beschreibung: 'Ergebnis am Stichtag (Art. 142 OR)',
    zwischenergebnis: verschoben
      ? verjaehrt
        ? `Am Stichtag ${fmt(stichtag)} ist die Forderung verjährt (letzter Tag: ${fmt(verschoben)}). Die Verjährung wird nur auf Einrede hin beachtet; die Forderung besteht als Naturalobligation weiter.`
        : `Am Stichtag ${fmt(stichtag)} ist die Forderung nicht verjährt; die Verjährung tritt mit unbenütztem Ablauf des ${fmt(verschoben)} ein.`
      : `Die Verjährung steht seit ${fmt(offeneHemmungSeit!)} prozessbedingt still (Art. 138 Abs. 1 OR); während des Verfahrens ruht auch eine allfällige absolute Frist – ein Fristende lässt sich erst nach dessen Abschluss bestimmen.`,
    normen: [N_142],
  });

  // ── Verzicht (Art. 141) als Overlay ──
  // RL-14 (Prüfung Rechtslogik 23.9.2026, F5-03/F5-04/S3-e/UI-04; Entscheid
  // David W-06 a, 24.9.2026). Art. 141 Abs. 1 OR (Fedlex SR 220, Konsolidierung
  // 1.1.2026, geprüft 24.9.2026): «Der Schuldner kann ab Beginn der Verjährung
  // jeweils für höchstens zehn Jahre auf die Erhebung der Verjährungseinrede
  // verzichten.» — «ab Beginn» regelt die Zulässigkeit (kein Vorausverzicht),
  // «höchstens zehn Jahre» die Dauer je Verzicht. Ab wann die Dauer läuft,
  // regelt das Gesetz bewusst nicht (Botschaft BBl 2014 235 S. 262: Moment des
  // Verzichts oder Verjährungseintritt, Auslegung der Erklärung). Der Rechner
  // rechnet ab Erklärung und legt das samt Alternative als Annahme offen; eine
  // zu lange Dauer wird gekürzt (Art. 20 Abs. 2 OR, BBl a.a.O.); eine
  // gesetzliche Ersatzdauer gibt es nicht (keine stille Vorgabe). Jahresgrenze
  // nach Art. 77 Abs. 1 Ziff. 3 OR (date-fns addYears: fehlt der zahlengleiche
  // Tag, letzter Tag des Monats).
  let verzichtBis: Date | null = null;
  let verzichtDatum: Date | null = null;
  if (input.verzicht && verschoben) {
    const vd = parseISO(input.verzicht.datum);
    const hoechst = addYears(vd, 10);
    const roh = input.verzicht.jahre;
    const bisEingabe = input.verzicht.bis ? parseISO(input.verzicht.bis) : null;
    const bis = bisEingabe && !isNaN(bisEingabe.getTime()) ? bisEingabe : null;
    let ende: Date | null = null;
    let dauerText = '';
    if (isBefore(vd, beginn)) {
      warnungen.push(`Verzicht vom ${fmt(vd)} liegt vor Beginn der Verjährung – ein Vorausverzicht ist nicht zulässig (Art. 141 Abs. 1 OR); der Verzicht bleibt unberücksichtigt.`);
    } else if (bis) {
      if (!isAfter(bis, vd)) {
        warnungen.push(`Das Enddatum des Verzichts (${fmt(bis)}) liegt nicht nach der Erklärung vom ${fmt(vd)}; der Verzicht bleibt unberücksichtigt.`);
      } else {
        ende = bis;
        dauerText = `bis ${fmt(bis)}`;
        if (roh !== undefined) annahmen.push('Einredeverzicht: Enddatum und Dauer in Jahren angegeben – massgeblich ist das Enddatum der Erklärung; die Jahresangabe bleibt unberücksichtigt.');
      }
    } else if (roh === undefined) {
      ende = hoechst;
      dauerText = 'ohne Dauerangabe';
      warnungen.push(`Einredeverzicht ohne Dauer: Das Gesetz kennt keine Ersatzdauer; die Dauer ist durch Auslegung der Erklärung zu ermitteln (Botschaft BBl 2014 235 S. 262). Ein unbefristeter Verzicht wird auf die Höchstdauer von 10 Jahren gekürzt (Art. 141 Abs. 1 i.V.m. Art. 20 Abs. 2 OR) – berechnet ist daher die Höchstdauer, 10 Jahre ab Erklärung (${fmt(hoechst)}); ein kürzerer Verzicht ist möglich. Nennt die Erklärung eine Dauer oder ein Enddatum, dieses eingeben.`);
    } else if (!Number.isFinite(roh) || roh <= 0) {
      warnungen.push('Die eingegebene Verzichtsdauer ist ungültig (mindestens 1 Jahr, oder ein Enddatum nach der Erklärung); der Verzicht bleibt unberücksichtigt.');
    } else {
      ende = addYears(vd, roh);
      dauerText = `für ${roh} ${roh === 1 ? 'Jahr' : 'Jahre'}`;
    }
    if (ende && isAfter(ende, hoechst)) {
      warnungen.push(
        `Ein Einredeverzicht über mehr als 10 Jahre wird auf die Höchstdauer gekürzt (Art. 141 Abs. 1 i.V.m. Art. 20 Abs. 2 OR; Botschaft BBl 2014 235 S. 262): ` +
        `wirksam bis ${fmt(hoechst)} statt ${fmt(ende)} (10 Jahre ab der Erklärung vom ${fmt(vd)}).` +
        (isBefore(vd, verschoben)
          ? ` Nach der anderen Lesart (Laufbeginn mit dem Verjährungseintritt am ${fmt(verschoben)}) läge die Grenze erst am ${fmt(addYears(verschoben, 10))}.`
          : ''),
      );
      ende = hoechst;
    }
    if (ende) {
      verzichtBis = ende;
      verzichtDatum = vd;
      const ohneWirkung = !isAfter(ende, verschoben);
      rechenweg.push({
        beschreibung: 'Einredeverzicht (Art. 141 OR)',
        zwischenergebnis: `Schriftlicher Verzicht vom ${fmt(vd)} ${dauerText}: Die Einrede kann bis ${fmt(ende)} nicht erhoben werden ` +
          '(je Verzicht höchstens 10 Jahre, Art. 141 Abs. 1 OR; Laufbeginn ab Erklärung angenommen – siehe Annahmen; Kettenverzichte bleiben möglich).' +
          (ohneWirkung ? ` Der Verzicht endet vor dem Verjährungseintritt (${fmt(verschoben)}) und bleibt ohne Auswirkung auf das Ergebnis.` : ''),
        normen: [N_141],
        rechtsprechung: [rechtsprechung('BGE_132_III_226')],
      });
      if (bis) {
        annahmen.push(`Einredeverzicht: Wirkungsende aus der Erklärung übernommen (${fmt(bis)}${isAfter(bis, ende) ? `, gekürzt auf ${fmt(ende)}` : ''}). Die Höchstdauer von 10 Jahren ist ab dem Datum der Verzichtserklärung gemessen; ab wann ein Verzicht gilt, regelt das Gesetz bewusst nicht (Botschaft BBl 2014 235 S. 262).`);
      } else {
        const alternative = isBefore(vd, verschoben) && roh !== undefined && Number.isFinite(roh) && roh > 0
          ? ` In Betracht kommt auch der Verjährungseintritt (${fmt(verschoben)}); dann wirkte der Verzicht bis ${fmt(addYears(verschoben, Math.min(roh, 10)))}.`
          : isBefore(vd, verschoben)
            ? ` In Betracht kommt auch der Verjährungseintritt (${fmt(verschoben)}) als Laufbeginn.`
            : '';
        annahmen.push(`Laufbeginn der Verzichtsdauer: gerechnet ab dem Datum der Verzichtserklärung (${fmt(vd)}). Ab wann ein Verzicht gilt, regelt das Gesetz bewusst nicht (Botschaft BBl 2014 235 S. 262).${alternative} Massgeblich ist die Auslegung der Erklärung.`);
      }
      if (isBefore(vd, parseISO(INKRAFT_REVISION_2020))) {
        // Art. 49 Abs. 4 SchlT ZGB: neues Recht erst ab 1.1.2020. aArt. 141
        // Abs. 1 OR (Fedlex SR 220, Fassung 1.11.2019, PDF/A-Filestore, geprüft
        // 24.9.2026): «Auf die Verjährung kann nicht zum voraus verzichtet
        // werden.» Dauer/Grenze nach BGE 132 III 226 E. 3.3.8.
        warnungen.push(`Verzicht vom ${fmt(vd)} vor dem 1.1.2020: Es galt aArt. 141 Abs. 1 OR («Auf die Verjährung kann nicht zum voraus verzichtet werden»); die Dauer richtete sich nach dem Parteiwillen, höchstens 10 Jahre (BGE 132 III 226 E. 3.3.8), ein gesetzliches Schriftformerfordernis bestand noch nicht. Gerechnet ist nach denselben Regeln wie für das geltende Recht – fachlich prüfen.`);
      } else {
        annahmen.push('Schriftform des Verzichts (Art. 141 Abs. 1bis OR) wird als erfüllt unterstellt; in AGB kann nur der Verwender verzichten.');
      }
    }
  }
  // F5-03: verjährt, aber die Einrede ist am Stichtag durch einen bereits
  // erklärten, noch laufenden Verzicht ausgeschlossen (Art. 141 Abs. 1 / 142 OR).
  const einredeAusgeschlossen = verjaehrt && verzichtBis != null && verzichtDatum != null
    && !isAfter(verzichtDatum, stichtag) && !isAfter(stichtag, verzichtBis);
  const verzichtAbgelaufen = verjaehrt && verzichtBis != null && verschoben != null
    && isAfter(verzichtBis, verschoben) && isAfter(stichtag, verzichtBis);
  const verzichtZusatzVerjaehrt = einredeAusgeschlossen
    ? ` Einrede durch Verzicht bis ${fmt(verzichtBis!)} ausgeschlossen (Art. 141 Abs. 1 OR).`
    : verzichtAbgelaufen
      ? ` Sie ist als Einrede geltend zu machen (Art. 142 OR); der Einredeverzicht wirkte bis ${fmt(verzichtBis!)} und ist abgelaufen.`
      : ' Sie ist als Einrede geltend zu machen (Art. 142 OR).';

  if (input.strafbareHandlung) {
    warnungen.push(
      'Strafbare Handlung (Art. 60 Abs. 2 OR): Der Anspruch verjährt frühestens mit Eintritt der strafrechtlichen Verfolgungsverjährung (Art. 97 StGB) – diese Längerfrist ist StGB-abhängig und hier nicht berechnet; das ausgewiesene Datum kann sich nach hinten verschieben.',
    );
  }
  // Regime mit Altrecht: Übergangsrecht oben abgebildet (pruefeAltrecht);
  // Art. 127/128 OR sind unverändert → nur der allgemeine Hinweis.
  if (!ALTRECHT[input.regime] && isBefore(beginn, parseISO(INKRAFT_REVISION_2020))) {
    warnungen.push(
      'Fristbeginn vor dem 1.1.2020: Für Altfälle gilt das Übergangsrecht (Art. 49 SchlT ZGB) – die Revision 2020 (u.a. relative Fristen 1 → 3 Jahre) ist hier nicht übergangsrechtlich abgebildet; Ergebnis prüfen.',
    );
  }

  const normverweise: Normverweis[] = [
    ...R.normen, N_132, N_78,
    ...(hemmungen.length ? [N_134] : []),
    ...(unterbrechungen.length ? [N_135, N_137_1] : []),
    ...(unterbrechungen.some((u) => u.typ === 'urkunde_urteil' || (u.typ === 'klage_schlichtung' && u.mitUrteil)) ? [N_137_2] : []),
    ...(unterbrechungen.some((u) => u.typ === 'klage_schlichtung') ? [N_138_1] : []),
    ...(unterbrechungen.some((u) => u.typ === 'betreibungsakt') ? [N_138_2] : []),
    ...(input.verzicht ? [N_141] : []),
    ...(input.strafbareHandlung ? [N_60_2] : []),
    ...(ue ? [N_49] : []),
    N_142,
  ];

  // Bei Zwei-Fristen-Regimes die massgebliche Frist im Ergebnis benennen.
  // Reicht die durch Unterbrechung neu angesetzte Frist über die absolute Frist
  // hinaus (Art. 137 Abs. 2 / 138 Abs. 1 OR), ist NICHT mehr die ursprüngliche
  // «relative Frist (X Jahre ab Kenntnis)» massgeblich, sondern die neue Frist –
  // sonst widerspräche die Zusammenfassung dem korrigierten Verdikt (§8).
  const neuAngesetztMassgeblich = massgeblicheFrist === 'relativ' && relativEnde != null
    && absolutEnde != null && isAfter(relativEnde, absolutEnde);
  const fristZusatz = R.absolutJahre != null && massgeblicheFrist
    ? neuAngesetztMassgeblich
      ? ` Massgeblich ist die durch Unterbrechung neu angesetzte Frist (${letztFrist137II ? 'stets 10 Jahre, Art. 137 Abs. 2 OR' : 'Neubeginn nach Art. 138 Abs. 1 OR'}), die über die absolute Frist hinausreicht.`
      : ` Massgeblich ist die ${massgeblicheFrist === 'absolut' ? `absolute Frist (${R.absolutJahre} Jahre ab ${R.absolutLabel})` : `relative Frist (${R.relativJahre} Jahre ab ${R.beginnLabel})`}.`
    : '';
  const ergebnisText = ue?.art === 'bisheriges_recht' && verschoben
    ? verjaehrt
      ? `Verjährt nach bisherigem Recht (Art. 49 Abs. 1 SchlT ZGB): Die Verjährung ist nach bisherigem Recht (${ue.norm}) mit Ablauf des ${fmt(verschoben)} eingetreten, also vor Inkrafttreten der Revision am 01.01.2020; die längeren neuen Fristen gelten nicht (Stichtag ${fmt(stichtag)}).${verzichtZusatzVerjaehrt}`
      : `Nicht verjährt am Stichtag ${fmt(stichtag)}: Nach bisherigem Recht (${ue.norm}) tritt die Verjährung mit unbenütztem Ablauf des ${fmt(verschoben)} ein, also vor dem 01.01.2020; die längeren neuen Fristen gelten nicht (Art. 49 Abs. 1 SchlT ZGB).`
    : ue?.art === 'unsicher'
      ? `Unsicher (Übergangsrecht, Art. 49 SchlT ZGB): Ende nach bisherigem Recht (${ue.norm}) ${fmt(ue.altEnde)}; Ende nach neuem Recht ${verschoben ? fmt(verschoben) : 'offen (Verfahren hängig)'}. ${ue.grund} Ergebnis fachlich prüfen.`
      : verschoben
    ? verjaehrt
      ? `Verjährt: Die Verjährung ist mit Ablauf des ${fmt(verschoben)} eingetreten (Stichtag ${fmt(stichtag)}).${fristZusatz}${verzichtZusatzVerjaehrt}`
      : `Nicht verjährt: Die Verjährung tritt mit unbenütztem Ablauf des ${fmt(verschoben)} ein.${fristZusatz}${verzichtBis && isAfter(verzichtBis, verschoben) ? ` Zufolge Einredeverzichts ist die Einrede bis ${fmt(verzichtBis)} ausgeschlossen.` : ''}`
    : `Die Verjährung steht prozessbedingt still (Art. 138 Abs. 1 OR); während des hängigen Verfahrens läuft auch eine allfällige absolute Frist nicht weiter – ein Fristende lässt sich erst nach Abschluss des Verfahrens bestimmen.`;

  return {
    ergebnis: ergebnisText,
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen,
    normverweise,
    relativEndeISO: relativEnde ? iso(werktagsEnde(relativEnde, input.kanton)) : undefined,
    absolutEndeISO: absolutEnde ? iso(werktagsEnde(absolutEnde, input.kanton)) : undefined,
    verjaehrungISO: verschoben ? iso(verschoben) : undefined,
    massgeblicheFrist,
    verjaehrtAmStichtag: verjaehrt,
    verzichtBisISO: verzichtBis ? iso(verzichtBis) : undefined,
    ...(verzichtBis ? { einredeAusgeschlossenAmStichtag: einredeAusgeschlossen } : {}),
    gehemmtTage: gehemmtTage || undefined,
    ...(ue ? { uebergangsrecht: { art: ue.art, altrechtEndeISO: iso(ue.altEnde) } } : {}),
  };
}
