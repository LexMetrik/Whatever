// Dossier: bibliothek/recherche/arbeitsrecht-rechner.md
// ─── Probezeitverlängerung Art. 335b Abs. 3 OR (RL-16b, W-08 Stufe 2) ──────
//
// Entscheid David W-08 (b), 24.9.2026: die Verlängerung GENAU rechnen, mit
// dem Eingabefeld «Arbeitstage pro Woche» (Standard Mo–Fr). Stufe 1 (RL-16,
// 24.9.2026) warnte nur («nicht gerechnet», vormals sperrfristen.ts).
//
// Norm (Fedlex SR 220, Filestore-HTML Konsolidierung 20260101 — Stand laut
// bibliothek/register/quellen-register.md —, Wortlaut in 20261001
// unverändert, abgerufen 25.9.2026): Art. 335b Abs. 3 OR «Bei einer
// effektiven Verkürzung der Probezeit infolge Krankheit, Unfall oder
// Erfüllung einer nicht freiwillig übernommenen gesetzlichen Pflicht erfolgt
// eine entsprechende Verlängerung der Probezeit.»
//
// Rechtsprechung: BGE 148 III 126 (Volltext
// https://entscheidsuche.ch/docs/CH_BGE/CH_BGE_005_BGE-148-III-126_2022.html,
// abgerufen 25.9.2026; bger.ch lieferte 503). Daraus, Erwägung für Erwägung:
//  (1) Zählweise — E. 5.2.6: «Die Verlängerung berechnet sich somit nicht
//      einfach nach Kalendertagen, sondern nach der Anzahl eigentlicher ganzer
//      Arbeitstage», an denen die Person «effektiv» verhindert war; sie greift
//      auch bei kurzen Absenzen. Verhinderung an ohnehin arbeitsfreien Tagen
//      (Bsp. Sonntag) verlängert nicht (E. 5.2.6). Nur Tage INNERHALB der
//      unverlängerten Probezeit zählen (E. 5.2.4: 15./16.6., nicht 17.–19.6.).
//  (2) Arbeitsfreie Tage — E. 5.2.4/5.2.7: die ausgefallenen Tage sind real
//      «abzuarbeiten»; Sa/So zählen in der Verlängerung nicht. Feiertage
//      nennt der Entscheid nicht ausdrücklich; der Massstab «ohnehin
//      arbeitsfreie Tage» / «tatsächliche Arbeitstage» trägt sie mit. Sicher
//      bestimmbar ist nur der 1. August: Art. 110 Abs. 3 BV (SR 101,
//      Konsolidierung 20240303, in Kraft bis 31.12.2028 laut SPARQL
//      dateApplicability, Filestore-HTML abgerufen 25.9.2026): «Der 1. August
//      ist Bundesfeiertag. Er ist arbeitsrechtlich den Sonntagen gleichgestellt
//      und bezahlt.» → arbeitsfrei, wenn Sonntag kein Arbeitstag ist. Die
//      übrigen Feiertage sind kantonal und hängen vom Arbeitsort ab, den dieser
//      Rechner nicht erfasst: gerechnet wird nach dem Wochentags-Muster, und
//      jeder kantonale Feiertag im Zählzeitraum wird mit dem abweichenden Ende
//      offengelegt (§8) — als Warnung, wo er das Ergebnis kippt.
//  (3) Iteration — E. 5.2.7: solange die Verhinderung über das unverlängerte
//      Ende hinaus andauert, wird nicht abgearbeitet (Abarbeiten erst am
//      22./23.6. nach Krankheit bis 19.6.). Für eine NEUE Verhinderung, die erst
//      in der Verlängerung beginnt, sagt der Entscheid nichts; gerechnet wird
//      nach derselben Ratio («real abzuarbeiten»), offengelegt mit dem Ende
//      ohne diese erneute Verlängerung — Warnung, wo das Ergebnis kippt.
//  (4) Teilarbeitsunfähigkeit — nicht entschieden; E. 5.2.6 spricht von
//      «ganzen Arbeitstagen». Das Ereignismodell kennt keinen Grad: jedes
//      Ereignis gilt als ganztägige Verhinderung (als Annahme offengelegt).
//
// Richtung: Eine längere Probezeit bedeutet 7 Tage Kündigungsfrist und keine
// Sperrfristen (Art. 335b Abs. 1, Art. 336c Abs. 1 OR) — für die
// Arbeitnehmerin nachteilig, für den Arbeitgeber günstig. Keine Lesart ist
// «für beide sicher»; deshalb rechnet die Engine die am Entscheid belegte
// Lesart und legt jede nicht entschiedene Weiche mit dem Gegenergebnis offen,
// statt still das für eine Partei günstigere Datum zu zeigen.

import { addDays, getDay, isAfter, isBefore, parseISO } from 'date-fns';
import type { Kanton, Sperrereignis, SperrereignisTyp, Normverweis } from '../types/legal';
import { istFeiertag } from '../data/zpoFeiertage';
import { KANTONE } from './kantone';
import { formatDatum } from './datumsUtils';

/** Wochentage nach date-fns getDay: 0 = Sonntag … 6 = Samstag. */
export const STANDARD_ARBEITSTAGE: readonly number[] = [1, 2, 3, 4, 5];
const KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;
const REIHENFOLGE = [1, 2, 3, 4, 5, 6, 0] as const;

/** Verlängerungsgründe im Ereignismodell: Krankheit/Unfall sowie
 *  obligatorischer Militär-, Schutz- oder Zivildienst (gesetzliche Pflicht);
 *  Schwangerschaft, Hilfsaktion und Urlaube nicht (übernommen aus RL-16). */
const GRUND: Partial<Record<SperrereignisTyp, string>> = {
  krankheit_unfall: 'Krankheit/Unfall',
  militaer_zivil: 'Militär-/Schutz-/Zivildienst',
};

export const N_335b_3: Normverweis = { artikel: 'Art. 335b Abs. 3 OR', bemerkung: 'Verlängerung der Probezeit' };
export const N_BV_110_3: Normverweis = {
  artikel: 'Art. 110 Abs. 3 BV', bemerkung: '1. August arbeitsrechtlich den Sonntagen gleichgestellt',
  url: 'https://www.fedlex.admin.ch/eli/cc/1999/404/de#art_110',
};

/** 1–7 verschiedene ganze Zahlen 0 … 6 (Permalink-Wächter und Engine). */
export function istGueltigeArbeitstage(v: unknown): v is number[] {
  return Array.isArray(v) && v.length >= 1 && v.length <= 7
    && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    && new Set(v).size === v.length;
}

/** «Mo, Di, Mi» in Wochenreihenfolge Mo … So. */
export function arbeitstageText(tage: readonly number[]): string {
  const alle = REIHENFOLGE.filter((t) => tage.includes(t));
  if (alle.length === 5 && alle.every((t, i) => t === i + 1)) return 'Montag bis Freitag';
  return alle.map((t) => KURZ[t]).join(', ');
}

type Verhinderung = { nr: number; grund: string; von: Date; bis: Date };

export type ProbezeitVerlaengerung = {
  endeUnverlaengert: Date;
  ende: Date;
  ausfallTage: number;
  /** Ereignisse mit mindestens einem Ausfalltag in der unverlängerten Probezeit. */
  ausloeser: Verhinderung[];
  /** Ereignisse, die erst nach dem unverlängerten Ende beginnen und die Verlängerung verschieben. */
  neueVerhinderungen: Verhinderung[];
  arbeitstage: number[];
  arbeitstageAngenommen: boolean;
  /** 1. August im Zählzeitraum, nicht als Arbeitstag gezählt (Art. 110 Abs. 3 BV). */
  bundesfeiertagNichtGezaehlt: boolean;
  /** Ende ohne erneute Verlängerung durch neueVerhinderungen (nur wenn abweichend). */
  endeOhneNeue: Date | null;
  /** Kantonale Feiertage unter den gezählten Tagen (ohne 1. August). */
  feiertage: Date[];
  /** Ende, wenn diese Feiertage arbeitsfrei sind — frühestes/spätestes je Kanton (nur wenn abweichend). */
  endeFeiertageFrei: { frueh: Date; spaet: Date } | null;
};

const imIntervall = (d: Date, v: Verhinderung) => !isBefore(d, v.von) && !isAfter(d, v.bis);
const istErsterAugust = (d: Date) => d.getMonth() === 7 && d.getDate() === 1;
// Schutz gegen Endlosschleifen (Ereignisse sind endlich; 20 Jahre genügen).
const MAX_TAGE = 366 * 20;

type Lauf = { ende: Date; ausfall: number; gezaehlt: Date[] };

/** Kern: Ausfalltage in [vb, endeU] zählen, dann ab endeU + 1 real abarbeiten. */
function lauf(
  vb: Date, endeU: Date, verh: Verhinderung[], sperrtNach: Verhinderung[],
  istArbeitstag: (d: Date) => boolean,
): Lauf | null {
  const gezaehlt: Date[] = [];
  let ausfall = 0;
  for (let d = vb; !isAfter(d, endeU); d = addDays(d, 1)) {
    if (istArbeitstag(d) && verh.some((v) => imIntervall(d, v))) { ausfall++; gezaehlt.push(d); }
  }
  if (ausfall === 0) return null;
  let n = 0;
  let d = addDays(endeU, 1);
  for (let i = 0; i < MAX_TAGE; i++, d = addDays(d, 1)) {
    if (istArbeitstag(d) && !sperrtNach.some((v) => imIntervall(d, v))) {
      n++; gezaehlt.push(d);
      if (n === ausfall) return { ende: d, ausfall, gezaehlt };
    }
  }
  throw new Error('Probezeitverlängerung: Zählzeitraum über 20 Jahre — Eingabe prüfen.');
}

export function berechneProbezeitVerlaengerung(
  vertragsbeginn: Date,
  endeUnverlaengert: Date,
  ereignisse: readonly Sperrereignis[] | undefined,
  arbeitstageRoh: readonly number[] | undefined,
): ProbezeitVerlaengerung | null {
  const verh: Verhinderung[] = (ereignisse ?? [])
    .map((e, i) => ({ e, nr: i + 1 }))
    .filter(({ e }) => GRUND[e.typ] !== undefined && e.von <= e.bis)
    .map(({ e, nr }) => ({ nr, grund: GRUND[e.typ]!, von: parseISO(e.von), bis: parseISO(e.bis) }));
  if (verh.length === 0) return null;

  const angenommen = !istGueltigeArbeitstage(arbeitstageRoh);
  const arbeitstage = angenommen ? [...STANDARD_ARBEITSTAGE] : [...arbeitstageRoh!];
  const sonntagsarbeit = arbeitstage.includes(0);
  const basis = (d: Date) => arbeitstage.includes(getDay(d)) && (sonntagsarbeit || !istErsterAugust(d));

  const haupt = lauf(vertragsbeginn, endeUnverlaengert, verh, verh, basis);
  if (haupt === null) return null;

  const ausloeser = verh.filter((v) => !isAfter(v.von, endeUnverlaengert) && !isBefore(v.bis, vertragsbeginn)
    && haupt.gezaehlt.some((d) => !isAfter(d, endeUnverlaengert) && imIntervall(d, v)));
  const neue = verh.filter((v) => isAfter(v.von, endeUnverlaengert) && !isAfter(v.von, haupt.ende));
  const ohneNeue = neue.length > 0
    ? lauf(vertragsbeginn, endeUnverlaengert, verh, verh.filter((v) => !isAfter(v.von, endeUnverlaengert)), basis)
    : null;

  // Kantonale Feiertage im Zählzeitraum (Ausfall- und Abarbeitstage).
  const istKantonalerFeiertag = (d: Date) => !istErsterAugust(d) && KANTONE.some((k) => istFeiertag(d, k));
  const feiertage = haupt.gezaehlt.filter(istKantonalerFeiertag);
  let endeFeiertageFrei: ProbezeitVerlaengerung['endeFeiertageFrei'] = null;
  if (feiertage.length > 0) {
    const enden = KANTONE.map((k: Kanton) =>
      lauf(vertragsbeginn, endeUnverlaengert, verh, verh,
        (d) => basis(d) && (istErsterAugust(d) || !istFeiertag(d, k)))?.ende ?? endeUnverlaengert);
    const frueh = enden.reduce((a, b) => (isBefore(b, a) ? b : a));
    const spaet = enden.reduce((a, b) => (isAfter(b, a) ? b : a));
    if (frueh.getTime() !== haupt.ende.getTime() || spaet.getTime() !== haupt.ende.getTime()) {
      endeFeiertageFrei = { frueh, spaet };
    }
  }

  return {
    endeUnverlaengert,
    ende: haupt.ende,
    ausfallTage: haupt.ausfall,
    ausloeser,
    neueVerhinderungen: neue,
    arbeitstage,
    arbeitstageAngenommen: angenommen,
    bundesfeiertagNichtGezaehlt: !sonntagsarbeit
      && ersterAugustHaetteGezaehlt(vertragsbeginn, endeUnverlaengert, haupt.ende, verh, arbeitstage),
    endeOhneNeue: ohneNeue && ohneNeue.ende.getTime() !== haupt.ende.getTime() ? ohneNeue.ende : null,
    feiertage,
    endeFeiertageFrei,
  };
}

/** Wäre ein 1. August nach dem Wochentags-Muster gezählt worden — als
 *  Ausfalltag (verhindert, in der Probezeit) oder als Abarbeitstag (danach,
 *  nicht verhindert)? Nur dann ist sein Wegfall im Rechenweg zu nennen. */
function ersterAugustHaetteGezaehlt(
  vb: Date, endeU: Date, ende: Date, verh: Verhinderung[], arbeitstage: number[],
): boolean {
  for (let d = vb; !isAfter(d, ende); d = addDays(d, 1)) {
    if (!istErsterAugust(d) || !arbeitstage.includes(getDay(d))) continue;
    const verhindert = verh.some((v) => imIntervall(d, v));
    if (isAfter(d, endeU) ? !verhindert : verhindert) return true;
  }
  return false;
}

// ─── Texte für Rechenweg, Warnungen und Annahmen (§8) ─────────────────────

const inPz = (zugang: Date, ende: Date) => !isAfter(zugang, ende);
const lage = (zugang: Date, ende: Date) =>
  inPz(zugang, ende) ? 'in der Probezeit (Frist 7 Tage)' : 'ausserhalb der Probezeit (ordentliche Frist)';
const liste = (vs: Verhinderung[]) =>
  vs.map((v) => `Ereignis ${v.nr} (${v.grund}, ${formatDatum(v.von)} – ${formatDatum(v.bis)})`).join(', ');

export function probezeitVerlaengerungTexte(v: ProbezeitVerlaengerung, zugang: Date): {
  schritt: string; warnungen: string[]; annahmen: string[];
} {
  const warnungen: string[] = [];
  const annahmen: string[] = [];
  const drin = inPz(zugang, v.ende);

  const schritt =
    `Verhinderung in der Probezeit: ${liste(v.ausloeser)}. Arbeitstage: ${arbeitstageText(v.arbeitstage)}` +
    `${v.arbeitstageAngenommen ? ' (Standard, nicht angegeben)' : ''}. ` +
    `${v.ausfallTage} Arbeitstag/e bis ${formatDatum(v.endeUnverlaengert)} ausgefallen; Verhinderung an arbeitsfreien Tagen zählt nicht. ` +
    `Diese Tage sind ab ${formatDatum(addDays(v.endeUnverlaengert, 1))} real abzuarbeiten; arbeitsfreie Tage` +
    `${v.bundesfeiertagNichtGezaehlt ? ', der 1. August (Art. 110 Abs. 3 BV)' : ''} und Tage mit andauernder Verhinderung zählen nicht. ` +
    `Verlängerte Probezeit bis ${formatDatum(v.ende)}. Zugang ${formatDatum(zugang)} liegt ` +
    (drin
      ? 'in der verlängerten Probezeit: Frist 7 Tage, kein Monatsendtermin, keine Sperrfristen.'
      : 'ausserhalb der verlängerten Probezeit. Ordentliche Frist gilt.');

  if (v.arbeitstageAngenommen) {
    warnungen.push(
      'Arbeitstage pro Woche nicht angegeben: Die Verlängerung der Probezeit (Art. 335b Abs. 3 OR) ist mit Montag bis Freitag gerechnet. ' +
      'Massgebend sind die Arbeitstage der Person (BGE 148 III 126 E. 5.2.6) — bei anderen Arbeitstagen, etwa in Teilzeit, ändert sich das Ende der verlängerten Probezeit.',
    );
  }

  annahmen.push(
    'Jedes Ereignis gilt an allen Tagen von–bis als ganztägige Verhinderung. BGE 148 III 126 E. 5.2.6 zählt die ganzen Arbeitstage, an denen die Person effektiv an der Arbeitsleistung verhindert war; wie eine bloss teilweise Arbeitsunfähigkeit die Probezeit verlängert, hat das Bundesgericht nicht entschieden — bei Teilarbeitsfähigkeit ist das Ergebnis zu prüfen.',
  );

  if (v.endeOhneNeue) {
    const kippt = inPz(zugang, v.endeOhneNeue) !== drin;
    const satz =
      `Erneute Verhinderung in der Verlängerung: ${liste(v.neueVerhinderungen)} beginnt erst nach dem unverlängerten Probezeitende (${formatDatum(v.endeUnverlaengert)}). ` +
      'Gerechnet ist, dass auch diese Tage nicht abgearbeitet werden (Art. 335b Abs. 3 OR; «real abzuarbeiten» nach BGE 148 III 126 E. 5.2.7 — dort für eine fortdauernde Krankheit entschieden, für eine neue Verhinderung nicht). ' +
      `Ohne diese erneute Verlängerung endete die Probezeit am ${formatDatum(v.endeOhneNeue)}; der Zugang läge dann ${lage(zugang, v.endeOhneNeue)}` +
      (kippt ? ' — das Ergebnis hängt von dieser Lesart ab.' : '; am Ergebnis ändert das nichts.');
    (kippt ? warnungen : annahmen).push(satz);
  }

  if (v.feiertage.length > 0) {
    const tage = v.feiertage.map(formatDatum).join(', ');
    const alt = v.endeFeiertageFrei;
    const grund =
      `Gesetzlicher Feiertag im Zählzeitraum: ${tage} (in mindestens einem Kanton). Gerechnet ist nach den gewählten Wochentagen. ` +
      'Ist der Feiertag für die Person arbeitsfrei, zählt er weder als Ausfall- noch als Abarbeitstag (BGE 148 III 126 E. 5.2.6: «ohnehin arbeitsfreie Tage»)';
    if (alt === null) {
      annahmen.push(`${grund}; am Ende der verlängerten Probezeit ändert das nichts.`);
    } else {
      const spanne = alt.frueh.getTime() === alt.spaet.getTime()
        ? `am ${formatDatum(alt.spaet)}`
        : `je nach Kanton zwischen ${formatDatum(alt.frueh)} und ${formatDatum(alt.spaet)}`;
      const kippt = inPz(zugang, alt.frueh) !== drin || inPz(zugang, alt.spaet) !== drin;
      const satz = `${grund} — die verlängerte Probezeit endet dann ${spanne}` +
        (kippt
          ? `; der Zugang (${formatDatum(zugang)}) läge dann${alt.frueh.getTime() === alt.spaet.getTime() ? '' : ' je nach Kanton'} ${drin ? 'ausserhalb' : 'in'} der Probezeit — das Ergebnis hängt davon ab.`
          : '; am Ergebnis ändert das nichts.');
      (kippt ? warnungen : annahmen).push(satz);
    }
  }

  if (v.bundesfeiertagNichtGezaehlt) {
    annahmen.push('Der 1. August zählt nicht als Arbeitstag: Er ist arbeitsrechtlich den Sonntagen gleichgestellt (Art. 110 Abs. 3 BV), und Sonntag ist kein gewählter Arbeitstag.');
  }

  return { schritt, warnungen, annahmen };
}
