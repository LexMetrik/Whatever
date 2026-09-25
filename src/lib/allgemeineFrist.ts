// Dossier: bibliothek/recherche/arbeitsrecht-rechner.md
import { addMonths, addYears, addDays, differenceInCalendarDays, isSaturday, isSunday, parseISO } from 'date-fns';
import { fristendeTage, fristendeKalender, OHNE_STILLSTAND, type Einheit } from './fristenEngine';
import { formatDatum, formatISO } from './datumsUtils';
import {
  bedingteFeiertageSatz, istFeiertag, strengeLesart, unsichereFeiertageSatz, type FeiertagsLesart,
} from '../data/zpoFeiertage';
import { KANTONE } from './kantone';
import type { Berechnungsergebnis, Kanton, Normverweis, Rechenschritt } from '../types/legal';

// ─── Allgemeiner Fristenrechner (Art. 77/78 OR) – dünne Engine ──────────────
//
// Andockt an die vorhandene fachneutrale Infrastruktur (Auftrag 5.6.2026,
// Phase-0-Befund «Andock-Fall»):
//   · dies a quo & Kalenderarithmetik: fristendeTage/fristendeKalender aus
//     fristenEngine.ts – IDENTISCH zur ZPO-Engine (beginnFolgetag=false →
//     Monatsfrist endet am gleichbezeichneten Tag, BGer 5A_691/2023;
//     Monatsende-Klemmung Art. 77 Abs. 1 Ziff. 3 OR via date-fns addMonths)
//   · Feiertage: kantonal differenzierte BJ/EJPD-Matrix + Computus aus
//     data/zpoFeiertage.ts (Stand 1.1.2011, Verifikationsvorbehalt dort)
// NEU ist nur die getrennte Verschiebe-Schleife (Wochenende/Feiertage als
// unabhängige Toggles) samt Rechenweg-Protokoll – bewusst OHNE Eingriff in
// die geteilten Bausteine. Keine Verfahrensbesonderheiten: Stillstände
// (Gerichtsferien, Betreibungsferien) leben in den Verfahrens-Engines.
//
// Rein, deterministisch, kein Date.now().

export type { Einheit } from './fristenEngine';

// RL-24/F1-02 (Prüfung Rechtslogik 23.9.2026, Zweitprüfung V2): Art. 78 Abs. 1
// OR verschiebt nur Sonntag und «am Erfüllungsorte staatlich anerkannte»
// Feiertage (Fedlex SR 220, Snapshot public/normtext/bund/OR.json, Stand
// 1.1.2026). Den Samstag stellt erst das Fristengesetz (SR 173.110.3) einem
// Feiertag gleich — und nur für gesetzlich oder behördlich festgesetzte
// Fristen (V2; Wortlaut SR 173.110.3 am 24.9.2026 mangels Netz NICHT amtlich
// nachgelesen). Vertraglich vereinbarte Fristen/Erfüllungstage: kein Samstag.
// Standard «gesetzlich» = bisheriges Verhalten (Golden allg:30t/allg:klemm).
export type FristArt = 'gesetzlich' | 'vertraglich';

export interface AllgFristInput {
  start: string;                 // 'YYYY-MM-DD', als reiner Kalendertag interpretiert
  laenge: number;                // > 0, ganzzahlig
  einheit: Einheit;
  wochenendeVerschieben: boolean;
  feiertageVerschieben: boolean;
  kanton?: Kanton;               // nötig, wenn feiertageVerschieben
  fristart?: FristArt;           // Standard 'gesetzlich' (RL-24/F1-02)
}

interface RechenSchritt {
  label: string;
  datum: string;                 // dd.MM.yyyy
  wochentag: string;
  grund?: string;
}

export interface AllgFristResult {
  endDatum: string;              // dd.MM.yyyy
  endDatumISO: string;
  endWochentag: string;
  rohEndDatum: string;           // vor Verschiebung
  verschoben: boolean;
  verschiebeGruende: string[];
  schritte: RechenSchritt[];
  hinweise: string[];
  // Für die Kalender-Visualisierung (FristenKalender, wie ZPO/SchKG):
  // Ereignis-/Stichtag und – nur vorwärts – erster mitzählender Tag
  // (dies a quo non computatur, Art. 77 OR; Regel lebt HIER, nicht in der UI).
  startISO: string;
  fristbeginnISO?: string;
}

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const wochentag = (d: Date) => WOCHENTAGE[d.getDay()];
const fmt = formatDatum;
const iso = formatISO;

const EINHEIT_LABEL: Record<Einheit, string> = {
  tage: 'Tagen', wochen: 'Wochen', monate: 'Monaten', jahre: 'Jahren',
};

// Verfahrens-Hinweis (Einfügung statt Abgrenzung, Auftrag §8)
export const ALLG_FRIST_HINWEIS =
  'Dieser allgemeine Rechner berücksichtigt keine verfahrensspezifischen Stillstände. ' +
  'Für gerichtliche Fristen den ZPO-Fristenrechner, für betreibungsrechtliche den ' +
  'SchKG-Fristenrechner verwenden.';

// RL-07/Q8-02 (Prüfung Rechtslogik 23.9.2026): Der Grundtext oben schickt
// «gerichtliche Fristen» zum ZPO-Rechner — für Strafverfahren falsch, dort gibt
// es keine Gerichtsferien (Art. 89 Abs. 2 StPO), und die Feiertage knüpfen an
// den Wohnsitz/Sitz der Partei oder ihres Rechtsbeistands an (Art. 90 Abs. 2
// Satz 2 StPO; Fedlex SR 312.0, Konsolidierung 1.4.2025). Eigener Zusatz statt
// Änderung des Grundtexts: der steht wörtlich in den Golden allg:30t/allg:klemm
// und im Allgemein-Formular. Der Zusatz erscheint nur im Pfad, den der
// Tagerechner für StPO-Fristen empfiehlt («Keine Ferien»). Offen (Q8 §d):
// Partei und Rechtsbeistand in verschiedenen Kantonen — keine amtliche Stelle
// gefunden, darum nur der Hinweis auf den früheren Termin (sichere Seite).
// RL-23/Q8-04: BGer 6B_730/2013 E. 1.2 (10.12.2013) prüft auch kommunale
// Ruhetage am Wohnsitz (SO: Gemeinden können zusätzliche Ruhetage bezeichnen,
// heute Ruhetagsgesetz SO § 2 Abs. 2, BGS 512.41); die Feiertagsmatrix führt
// nur kantonale Tage → Fristende allenfalls zu früh (sichere Richtung), offengelegt.
export const STPO_FRIST_HINWEIS =
  'Strafverfahren: Es gibt keine Gerichtsferien (Art. 89 Abs. 2 StPO) – das Fristende oben gilt ohne '
  + 'Stillstand. Massgebend für Feiertage ist der Kanton, in dem die Partei oder ihr Rechtsbeistand '
  + 'Wohnsitz oder Sitz hat (Art. 90 Abs. 2 StPO), nicht der Gerichtsort; liegen beide in verschiedenen '
  + 'Kantonen, im Zweifel den früheren Termin einhalten. Allfällige kommunale Ruhetage am Wohnsitz oder Sitz, '
  + 'die das Bundesgericht mitberücksichtigt (BGer 6B_730/2013 E. 1.2), sind nicht abgebildet – das Fristende '
  + 'liegt deshalb allenfalls früher als nötig, nie wegen solcher Tage später.';

// RL-24/F1-02: Offenlegung des Vertragsfrist-Regimes (§8). Modul-intern: erreicht
// das UI über `hinweise` → `warnungen` (ErgebnisAnzeige), kein Export (check:sediment d).
const VERTRAGSFRIST_HINWEIS =
  'Vertragsfrist/Erfüllungstag: Verschoben wird nur bei Sonntag oder einem am Erfüllungsort staatlich '
  + 'anerkannten Feiertag (Art. 78 Abs. 1 OR), nicht bei Samstag – die Samstagsregel des Fristengesetzes '
  + '(SR 173.110.3) gilt für gesetzliche und behördliche Fristen. Abweichende Vereinbarungen bleiben '
  + 'vorbehalten (Art. 78 Abs. 2 OR).';

export function berechneAllgemeineFrist(input: AllgFristInput): AllgFristResult {
  if (!Number.isInteger(input.laenge) || input.laenge <= 0) {
    throw new Error('Fristlänge muss eine ganze Zahl > 0 sein.');
  }
  if (input.feiertageVerschieben && !input.kanton) {
    // RL-07/Q8-03: regimeneutral — Art. 78 OR knüpft an den Erfüllungsort an,
    // Art. 90 Abs. 2 StPO an Wohnsitz/Sitz der Partei oder ihres Rechtsbeistands.
    throw new Error('Für die Feiertags-Verschiebung ist der massgebende Kanton erforderlich '
      + '(Vertragsfrist: Erfüllungsort; Strafverfahren: Wohnsitz/Sitz der Partei oder ihres Rechtsbeistands).');
  }
  const start = parseISO(input.start);
  if (isNaN(start.getTime())) throw new Error('Ungültiges Startdatum.');

  const schritte: RechenSchritt[] = [];
  schritte.push({
    label: 'Ereignis-/Starttag – zählt nicht mit (dies a quo non computatur)',
    datum: fmt(start), wochentag: wochentag(start),
  });

  // 1) Rohes Fristende über die GETEILTEN Bausteine (identisch zu zpoFristen)
  let roh: Date;
  if (input.einheit === 'tage') {
    const r = fristendeTage(start, input.laenge, OHNE_STILLSTAND);
    roh = r.ende;
  } else {
    const r = fristendeKalender(start, input.einheit, input.laenge, OHNE_STILLSTAND, false);
    roh = r.ende;
  }
  schritte.push({
    label: 'Fristbeginn (erster mitzählender Tag)',
    datum: fmt(addDays(start, 1)), wochentag: wochentag(addDays(start, 1)),
  });

  // Monatsende-Klemmung sichtbar machen (Art. 77 Abs. 1 Ziff. 3 OR)
  const geklemmt = (input.einheit === 'monate' || input.einheit === 'jahre')
    && roh.getDate() !== start.getDate();
  schritte.push({
    label: `Rohes Fristende: ${input.laenge} ${EINHEIT_LABEL[input.einheit]}`,
    datum: fmt(roh), wochentag: wochentag(roh),
    grund: input.einheit === 'tage' || input.einheit === 'wochen'
      ? 'Kalendertage gezählt ab Folgetag (Art. 77 Abs. 1 Ziff. 1/2 OR)'
      : geklemmt
        ? 'Kein gleichbezeichneter Tag im Zielmonat → letzter Tag des Monats (Art. 77 Abs. 1 Ziff. 3 OR)'
        : 'Gleichbezeichneter Tag des Zielmonats (Art. 77 Abs. 1 Ziff. 3 OR; BGE 150 III 367)',
  });

  // 2)+3) Verschiebung (Art. 78 OR; SR 173.110.3). Rechtlich ist das EINE
  // Operation «bis zum nächsten Werktag»: Die Feiertags-Option impliziert
  // deshalb die Wochenend-Verschiebung – sonst könnte ein Feiertags-Sprung
  // auf einem Sa/So landen (Review-Befund 5.6.2026; ein Fristende am
  // Sonntag wäre rechtlich unhaltbar). Nur der reine Wochenend-Modus ohne
  // Feiertage bleibt wählbar (Feiertage bewusst ignoriert, kantonsfrei).
  const wochenende = input.wochenendeVerschieben || input.feiertageVerschieben;
  // RL-24/F1-02: bei Vertragsfristen bleibt der Samstag ein Werktag (Art. 78
  // Abs. 1 OR nennt nur Sonntag und Feiertag; SR 173.110.3 gilt nicht).
  const vertraglich = input.fristart === 'vertraglich';
  // Feiertags-Kontext 'allgemein' (RL-22-Nachzug; Art. 78 OR). `lesart` nur für
  // den Warnvergleich unten (weitest/streng) — dieselbe Schleife, damit der
  // Hinweis auch bei Vertragsfristen (Samstag = Werktag) das richtige Ende nennt.
  const grundFuer = (d: Date, lesart: FeiertagsLesart = 'allgemein'): string | null => {
    if (input.feiertageVerschieben && input.kanton && istFeiertag(d, input.kanton, lesart)) {
      return `gesetzlicher Feiertag (${input.kanton})`;
    }
    if (wochenende && isSunday(d)) return 'Sonntag (Art. 78 Abs. 1 OR)';
    if (wochenende && !vertraglich && isSaturday(d)) return 'Samstag (SR 173.110.3)';
    return null;
  };

  const verschiebeBis = (lesart: FeiertagsLesart): Date => {
    let t = roh;
    for (let guard = 0; guard < 30 && grundFuer(t, lesart); guard++) t = addDays(t, 1);
    return t;
  };

  let ende = roh;
  const verschiebeGruende: string[] = [];
  for (let guard = 0; guard < 30; guard++) {
    const grund = grundFuer(ende);
    if (!grund) break;
    schritte.push({
      label: 'Übersprungen',
      datum: fmt(ende), wochentag: wochentag(ende), grund,
    });
    verschiebeGruende.push(`${fmt(ende)} (${wochentag(ende)}): ${grund}`);
    ende = addDays(ende, 1);
  }

  // RL-22-Nachzug: Feiertags-Kontext 'allgemein' (Art. 78 OR; auch StPO-Nutzung
  // ohne eigenen Kontext) — kantonale Sonderfeiertage, die nur für bestimmte
  // Verfahren gelten (NE-Schliesstage, SO 1. Mai), zählen nicht; Warnung, wenn
  // einer das Fristende verschieben würde. RL-23: ebenso Warnung, wenn ein
  // unsicher gezählter Tag (GL 2.1.) verschoben hat. Landung Paket 5 mit RL-24:
  // Vergleich über dieselbe Verschiebe-Schleife (vorher naechsterWerktag, der
  // bei Vertragsfristen den Samstag übersprang — falsches Ende im Warnsatz).
  const bedingtHinweis = input.feiertageVerschieben && input.kanton
    ? bedingteFeiertageSatz(roh, ende, verschiebeBis('weitest'), input.kanton, 'allgemein', 'frueher')
      ?? unsichereFeiertageSatz([[roh, ende]], ende, verschiebeBis(strengeLesart('allgemein')), input.kanton, 'allgemein', 'frueher')
    : null;

  schritte.push({
    label: 'Fristende (24.00 Uhr)',
    datum: fmt(ende), wochentag: wochentag(ende),
    grund: verschiebeGruende.length > 0 ? 'auf den nächstfolgenden Werktag verschoben (Art. 78 OR)' : undefined,
  });

  return {
    endDatum: fmt(ende),
    endDatumISO: iso(ende),
    endWochentag: wochentag(ende),
    rohEndDatum: fmt(roh),
    verschoben: verschiebeGruende.length > 0,
    verschiebeGruende,
    schritte,
    // Gesetzlich unverändert (Golden); vertraglich zusätzlich die Regime-Offenlegung.
    // RL-22-Nachzug: Warnung zu bedingten kantonalen Feiertagen hinten angefügt.
    hinweise: [
      ...(vertraglich ? [VERTRAGSFRIST_HINWEIS, ALLG_FRIST_HINWEIS] : [ALLG_FRIST_HINWEIS]),
      ...(bedingtHinweis ? [bedingtHinweis] : []),
    ],
    startISO: iso(start),
    fristbeginnISO: iso(addDays(start, 1)),
  };
}

// ── Hilfsmittel «Tage zwischen zwei Daten» (rein informativ, §4) ────────────

export function tageZwischen(vonISO: string, bisISO: string): { kalendertage: number; werktageMoFr: number } {
  const von = parseISO(vonISO);
  const bis = parseISO(bisISO);
  if (isNaN(von.getTime()) || isNaN(bis.getTime())) throw new Error('Ungültiges Datum.');
  const kalendertage = Math.abs(differenceInCalendarDays(bis, von));
  // Werktage Mo–Fr OHNE Feiertagsbezug – reines Zählwerkzeug ohne Rechtsbezug.
  let werktage = 0;
  const [a, b] = differenceInCalendarDays(bis, von) >= 0 ? [von, bis] : [bis, von];
  for (let d = addDays(a, 1); !isNaN(d.getTime()) && differenceInCalendarDays(b, d) >= 0; d = addDays(d, 1)) {
    if (!isSaturday(d) && !isSunday(d)) werktage += 1;
  }
  return { kalendertage, werktageMoFr: werktage };
}

// ── Abbildung in das einheitliche Anzeige-/Berichtsformat ───────────────────

const N_77: Normverweis = { artikel: 'Art. 77 OR', bemerkung: 'Fristberechnung (Ereignistag zählt nicht)' };
const N_78: Normverweis = { artikel: 'Art. 78 OR', bemerkung: 'Ende am Sonntag/anerkannten Feiertag → nächster Werktag' };
const N_SAMSTAG: Normverweis = { artikel: 'Fristengesetz (SR 173.110.3)', bemerkung: 'Samstag dem Feiertag gleichgestellt' };

export function allgemeineFristErgebnis(input: AllgFristInput): Berechnungsergebnis & { resultat: AllgFristResult } {
  const r = berechneAllgemeineFrist(input);

  const rechenweg: Rechenschritt[] = r.schritte.map((s) => ({
    beschreibung: s.label + (s.grund ? ` – ${s.grund}` : ''),
    zwischenergebnis: `${s.wochentag}, ${s.datum}`,
    normen: s.label.startsWith('Rohes Fristende') ? [N_77]
      : s.label === 'Übersprungen' && s.grund?.includes('Samstag') ? [N_SAMSTAG]
      : s.label === 'Übersprungen' ? [N_78]
      : [],
  }));

  const annahmen = [
    'Der Ereignistag wird nicht mitgezählt; Monats-/Jahresfristen enden am gleichbezeichneten Tag, sonst am Monatsende (Art. 77 OR).',
    ...(input.feiertageVerschieben
      ? [`Feiertage nach dem EJPD-Verzeichnis (Stand 2011 – veraltbar, kantonales Recht massgeblich), Kanton ${input.kanton}. Lokale Feste ohne kantonale Anerkennung (z. B. Sechseläuten, Knabenschiessen) verschieben Fristen NICHT.`]
      : []),
    'Der Rechner ermittelt das Fristende ab dem eingegebenen Startdatum; den Fristbeginn (z. B. Zustellfiktionen) bestimmt er nicht.',
  ];

  // RL-24/F1-02: bei Vertragsfristen ist SR 173.110.3 nicht einschlägig.
  const verschiebeNormen = input.fristart === 'vertraglich' ? [N_78] : [N_78, N_SAMSTAG];
  const normverweise: Normverweis[] = [
    N_77,
    ...(r.verschoben || input.wochenendeVerschieben || input.feiertageVerschieben ? verschiebeNormen : []),
  ];

  return {
    ergebnis: `${r.endWochentag}, ${r.endDatum}`,
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen: r.hinweise,
    normverweise,
    resultat: r,
  };
}

// ─── P1.1 Rückwärtsrechnung («spätester Handlungstag») ──────────────────────
//
// Rückrechnung ist anerkannt (BGE 134 III 354 – zu verifizieren; Art. 700
// Abs. 1 OR: Einberufung «mindestens 20 Tage vor dem Versammlungstag»,
// Wortlaut am Fedlex-Text verifiziert 5.6.2026). Arithmetik als exakte
// Spiegelung der Vorwärtsregel: spätester Tag = (Stichtag − Frist) − 1,
// womit zwischen Handlung und Stichtag die vollen Tage/Monate liegen
// (Termin 20.4. − 10 Tage → 9.4.; Quartalsende 30.6. − 3 Monate → 29.3. – so
// auch Tests AF-18/AF-19). Hinweis: andere Engines mit eigener Termin-
// Konvention (z. B. Kündigungstermine im Mietrecht) rechnen bewusst abweichend.
// Ergänzung RL-24/F1-06 und S3f-7 (24.9.2026): Die Formel oben gilt nur ohne
// Monatsende-Klemmung; massgeblich ist seither «spätester Tag X mit X + Frist
// < Stichtag» (31.3. − 1 Monat → 28.2., nicht 27.2.). Der am 19.6.2026
// gerügte Kommentarfehler («30.6−3M→31.3», AUDIT-BUGS:120) war bereits mit
// 445e00910 (25.6.2026) behoben; S3f-7 las ihn am 23.9.2026 als offen.
//
// VERSCHIEBUNG: Art. 78 OR ist auf Vorwärtsfristen zugeschnitten («…endet
// am nächstfolgenden Werktag»). Ob bei Rückwärtsfristen eine Wochenend-/
// Feiertagskollision VORVERLEGT wird, ist höchstrichterlich UNGEKLÄRT
// (Diskussion v. a. deutsche Lehre) – Default deshalb KEINE automatische
// Verschiebung (Hinausschieben würde die Frist verkürzen!); Vorverlegung
// nur als Option mit ausdrücklichem Vorbehalt.

export type RueckVerschiebung = 'keine' | 'vorverlegen';

export interface RueckFristInput {
  stichtag: string;              // 'YYYY-MM-DD' – Termin/Endtermin
  laenge: number;
  einheit: Einheit;
  verschiebung: RueckVerschiebung;
  feiertageBeruecksichtigen?: boolean; // nur bei 'vorverlegen'
  kanton?: Kanton;
}

export function berechneRueckwaertsFrist(input: RueckFristInput): AllgFristResult {
  if (!Number.isInteger(input.laenge) || input.laenge <= 0) {
    throw new Error('Fristlänge muss eine ganze Zahl > 0 sein.');
  }
  if (input.verschiebung === 'vorverlegen' && input.feiertageBeruecksichtigen && !input.kanton) {
    throw new Error('Für die Feiertags-Berücksichtigung ist der Kanton erforderlich.');
  }
  const stichtag = parseISO(input.stichtag);
  if (isNaN(stichtag.getTime())) throw new Error('Ungültiger Stichtag.');

  const schritte: RechenSchritt[] = [];
  schritte.push({
    label: 'Stichtag/Termin (bis zu dem die Frist gewahrt sein muss)',
    datum: fmt(stichtag), wochentag: wochentag(stichtag),
  });

  // Spiegelung: Stichtag − Frist − 1. Bug-Check 10.6.2026 (MITTEL,
  // deklarierte fachliche Änderung): Vorher ergab die Formel stichtag−frist —
  // der STICHTAG selbst wurde als letzter Fristtag mitgezählt, zwischen
  // Handlung und Stichtag lagen nur frist−1 freie Tage. Nach h.L. zu
  // Mindestfristen (z. B. Art. 700 Abs. 1 OR: weder Versand- noch
  // Versammlungstag zählen mit) muss die VOLLE Frist dazwischen liegen →
  // spätester Handlungstag ein Tag früher.
  // Monatsende-Klemmung übernimmt date-fns addMonths/addYears.
  const zurueck: Record<Einheit, (d: Date, n: number) => Date> = {
    tage: (d, n) => addDays(d, -n),
    wochen: (d, n) => addDays(d, -7 * n),
    monate: (d, n) => addMonths(d, -n),
    jahre: (d, n) => addYears(d, -n),
  };
  const gespiegelt = zurueck[input.einheit](stichtag, input.laenge);
  // RL-24/F1-06 (Prüfung Rechtslogik 23.9.2026, Beleg R2): «gespiegelt − 1»
  // ist nur ohne Monatsende-Klemmung richtig. Mit Klemmung (31.3. − 1 Mt =
  // 28.2.) lag das Ergebnis einen Tag zu früh (27.2.), obwohl 28.2. + 1 Mt =
  // 28.3. < 31.3. die volle Frist wahrt. Allgemein: spätester Tag X mit
  // X + Frist < Stichtag (Vorwärtsregel Art. 77 Abs. 1 Ziff. 3 OR auf X
  // angewandt). Für Tage/Wochen und ungeklemmte Monate/Jahre identisch mit
  // der bisherigen Formel (Golden allg:rueck: 30.6. − 3 Mt → 29.3.).
  const vorwaerts: Record<Einheit, (d: Date, n: number) => Date> = {
    tage: (d, n) => addDays(d, n),
    wochen: (d, n) => addDays(d, 7 * n),
    monate: (d, n) => addMonths(d, n),
    jahre: (d, n) => addYears(d, n),
  };
  let roh = gespiegelt;
  for (let guard = 0; guard < 10
    && differenceInCalendarDays(vorwaerts[input.einheit](roh, input.laenge), stichtag) >= 0; guard++) {
    roh = addDays(roh, -1);
  }
  const geklemmt = (input.einheit === 'monate' || input.einheit === 'jahre')
    && gespiegelt.getDate() !== stichtag.getDate();
  schritte.push({
    label: `Spätester Handlungstag: ${input.laenge} ${EINHEIT_LABEL[input.einheit]} vor dem Stichtag`,
    datum: fmt(roh), wochentag: wochentag(roh),
    grund: geklemmt
      ? 'Kein gleichbezeichneter Tag im Zielmonat → Monatsende-Klemmung (Art. 77 Abs. 1 Ziff. 3 OR sinngemäss)'
      : 'Spiegelung der Fristberechnung nach Art. 77 OR (volle Frist zwischen Handlung und Stichtag)',
  });

  let ende = roh;
  const verschiebeGruende: string[] = [];
  if (input.verschiebung === 'vorverlegen') {
    const frei = (d: Date): string | null => {
      // RL-22-Nachzug: rückwärts ist der FRÜHERE Tag sicher → bedingte kantonale
      // Feiertage (NE-Schliesstage, SO 1. Mai) zählen hier mit ('weitest').
      if (input.feiertageBeruecksichtigen && input.kanton && istFeiertag(d, input.kanton, 'weitest')) {
        return `gesetzlicher Feiertag (${input.kanton})`;
      }
      if (isSunday(d)) return 'Sonntag';
      if (isSaturday(d)) return 'Samstag';
      return null;
    };
    for (let guard = 0; guard < 30; guard++) {
      const grund = frei(ende);
      if (!grund) break;
      schritte.push({ label: 'Vorverlegt (Option)', datum: fmt(ende), wochentag: wochentag(ende), grund });
      verschiebeGruende.push(`${fmt(ende)} (${wochentag(ende)}): ${grund}`);
      ende = addDays(ende, -1);
    }
  }

  schritte.push({
    label: 'Spätester Handlungstag',
    datum: fmt(ende), wochentag: wochentag(ende),
    grund: verschiebeGruende.length > 0 ? 'auf den vorangehenden Werktag VORVERLEGT (Option – höchstrichterlich ungeklärt)' : undefined,
  });

  const hinweise = [
    'Zählweise: Gerechnet wird die VOLLE Frist zwischen Handlungstag und Stichtag (weder Handlungs- noch Stichtag zählen mit – sichere Zählung für Einberufungs-/Ankündigungsfristen wie Art. 700 Abs. 1 OR). Für miet-/arbeitsrechtliche KÜNDIGUNGSTERMINE gilt die Zugangs-Konvention (Zugang am Vortag des Fristbeginns genügt – dort kann ein Tag später noch fristwahrend sein): dafür den Kündigungs- bzw. Mietrechts-Rechner verwenden.',
    'Rückwärtsfrist: Ob sich der späteste Handlungstag bei Wochenende/Feiertag auf den VORANGEHENDEN Werktag vorverlegt, ist in der Schweiz höchstrichterlich ungeklärt (Art. 78 OR betrifft Vorwärtsfristen) – zu verifizieren. Ein Hinausschieben verbietet sich, weil es die Frist verkürzen würde. Im Zweifel früher handeln.',
    ALLG_FRIST_HINWEIS,
  ];

  return {
    endDatum: fmt(ende),
    endDatumISO: iso(ende),
    endWochentag: wochentag(ende),
    rohEndDatum: fmt(roh),
    verschoben: verschiebeGruende.length > 0,
    verschiebeGruende,
    schritte,
    hinweise,
    startISO: iso(stichtag), // Rückwärts: Stichtag/Termin; kein Fristbeginn-Begriff
  };
}

export function rueckwaertsErgebnis(input: RueckFristInput): Berechnungsergebnis & { resultat: AllgFristResult } {
  const r = berechneRueckwaertsFrist(input);
  const rechenweg: Rechenschritt[] = r.schritte.map((s) => ({
    beschreibung: s.label + (s.grund ? ` – ${s.grund}` : ''),
    zwischenergebnis: `${s.wochentag}, ${s.datum}`,
    normen: s.label.startsWith('Spätester Handlungstag:') ? [N_77] : [],
  }));
  return {
    ergebnis: `${r.endWochentag}, ${r.endDatum}`,
    status: 'ok',
    rechenweg,
    annahmen: [
      'Spiegelung der Fristberechnung nach Art. 77 OR: zwischen Handlung und Stichtag liegt die volle Frist (z. B. «mindestens 20 Tage vor dem Versammlungstag», Art. 700 Abs. 1 OR).',
      input.verschiebung === 'keine'
        ? 'Keine automatische Verschiebung bei Wochenende/Feiertag (Verschiebungsrichtung bei Rückwärtsfristen ungeklärt – im Zweifel früher handeln).'
        : 'OPTION Vorverlegung aktiv: Kollisionen werden auf den vorangehenden Werktag vorverlegt – höchstrichterlich ungeklärt (zu verifizieren).',
    ],
    warnungen: r.hinweise,
    normverweise: [N_77, { artikel: 'Art. 700 OR', bemerkung: 'Beispiel Rückwärtsfrist: Einberufung mind. 20 Tage vor der GV' }],
    resultat: r,
  };
}

// ─── P1.2 Zustell-/Zugangs-Helfer (REIN INFORMATIV, keine Subsumtion) ───────
//
// Liefert einen DATUMSVORSCHLAG für das Startfeld samt Hinweisen – keine
// verbindliche Zustellberechnung, kein Stillstand (Pro-Engines). Normen
// als Hinweis-Texte; Pills erst nach fachlicher Abnahme.

export type ZustellArt = 'uebergabe' | 'einschreiben' | 'apostplus';

export function zustellHinweis(art: ZustellArt, datumISO: string, kanton?: Kanton): {
  vorschlagISO: string; vorschlagFmt: string; hinweise: string[];
} {
  const d = parseISO(datumISO);
  if (isNaN(d.getTime())) throw new Error('Ungültiges Datum.');
  if (art === 'einschreiben') {
    const v = addDays(d, 7);
    return {
      vorschlagISO: iso(v), vorschlagFmt: `${wochentag(v)}, ${fmt(v)}`,
      hinweise: [
        `Zustellfiktion: Eine nicht abgeholte eingeschriebene Sendung gilt am 7. Tag nach dem erfolglosen Zustellversuch als zugestellt (${fmt(v)}) – Parallelnormen Art. 138 Abs. 3 lit. a ZPO, Art. 85 Abs. 4 lit. a StPO, Art. 44 Abs. 2 BGG, Art. 20 Abs. 2bis VwVG, Art. 38 Abs. 2bis ATSG.`,
        'Voraussetzung ist, dass mit der Zustellung gerechnet werden musste (Prozessrechtsverhältnis; BGE 138 III 225 – zu verifizieren). Der 7. Tag gilt auch bei SPÄTERER Abholung (BGE 141 II 429 – zu verifizieren); bei früherer Abholung gilt der tatsächliche Abholtag.',
        'Hinweis, keine verbindliche Zustellberechnung – massgeblich ist der Einzelfall.',
      ],
    };
  }
  if (art === 'apostplus') {
    let v = d;
    const gruende: string[] = [];
    // RL-24/VS3-08 (Prüfung Rechtslogik 23.9.2026): ohne Kanton blieb ein
    // Feiertag unberücksichtigt (Fr 1.8.2025 → 1.8. statt 4.8.). Art. 142
    // Abs. 1bis ZPO (amtliche Fassung 1.7.2026) knüpft an den Feiertag «am
    // Gerichtsort» an. Ohne Kanton zählen darum nur Tage, die nach
    // data/zpoFeiertage in ALLEN Kantonen Feiertag sind (z. B. 1. August) —
    // richtig für jeden Gerichtsort; kantonale Feiertage verschieben nicht
    // (früheres Ergebnis = sichere Seite) und der Hinweis verlangt den Kanton.
    // Landung Paket 5 (RL-22/22c/23): Feiertags-Kontext 'zpo' — der Hinweis
    // wendet Art. 142 Abs. 1bis ZPO an, wie zpoFristen (ereignisKorrigiert):
    // kantonale Tage, die nur für Art. 142 ZPO Feiertag sind (NE LI-CPC Art. 10a,
    // SO EG ZPO § 22 Abs. 2), zählen; ein unsicher gezählter Tag (GL 2.1.)
    // zählt mit Warnung und dem früheren Datum ohne ihn (strenge Lesart).
    const feiertag = (x: Date, lesart: FeiertagsLesart) =>
      kanton ? istFeiertag(x, kanton, lesart) : KANTONE.every((k) => istFeiertag(x, k, lesart));
    const frei = (x: Date, lesart: FeiertagsLesart) =>
      feiertag(x, lesart) ? 'Feiertag' : isSunday(x) ? 'Sonntag' : isSaturday(x) ? 'Samstag' : null;
    for (let g = 0; g < 10; g++) {
      const grund = frei(v, 'zpo');
      if (!grund) break;
      gruende.push(grund);
      v = addDays(v, 1);
    }
    let vStreng = d;
    for (let g = 0; g < 10 && frei(vStreng, strengeLesart('zpo')); g++) vStreng = addDays(vStreng, 1);
    const unsichereTage: string[] = [];
    for (let t = vStreng; +vStreng !== +v && t < v; t = addDays(t, 1)) {
      if (feiertag(t, 'zpo') && !feiertag(t, strengeLesart('zpo'))) unsichereTage.push(fmt(t));
    }
    const unsicher = unsichereTage.length > 0
      ? `Kantonaler Sonderfall: Der ${unsichereTage.join(', ')} ist hier als Feiertag am Gerichtsort mitgezählt; `
        + `ob das Gericht ihn anerkennt, ist nicht gesichert. Zählt er nicht, gilt die Mitteilung bereits am ${fmt(vStreng)} als erfolgt – `
        + 'sicherheitshalber die Frist ab diesem Tag berechnen.'
      : null;
    return {
      vorschlagISO: iso(v), vorschlagFmt: `${wochentag(v)}, ${fmt(v)}`,
      hinweise: [
        gruende.length > 0
          ? `Zustellung durch gewöhnliche Post (A-Post Plus) an einem ${gruende[0]}: Die Mitteilung gilt erst am nächsten Werktag (${fmt(v)}) als erfolgt (Art. 142 Abs. 1bis ZPO, in Kraft seit 1.1.2025; Feiertage am GERICHTSORT).`
          : 'Zustellung durch gewöhnliche Post an einem Werktag: Es gilt das Zustelldatum (Art. 142 Abs. 1bis ZPO betrifft nur Sa/So/Feiertag).',
        ...(kanton ? [] : ['Ohne Kanton sind nur die in allen Kantonen anerkannten Feiertage berücksichtigt – für kantonale Feiertage am Gerichtsort den Kanton angeben.']),
        ...(unsicher ? [unsicher] : []),
        'Hinweis, keine verbindliche Zustellberechnung – massgeblich ist der Einzelfall.',
      ],
    };
  }
  return {
    vorschlagISO: iso(d), vorschlagFmt: `${wochentag(d)}, ${fmt(d)}`,
    hinweise: [
      'Persönliche Übergabe/Empfang: Massgeblich ist der Zugang in den Machtbereich (Empfangstheorie). Für eigene Eingaben an Gerichte gilt umgekehrt das Postaufgabeprinzip (Art. 143 Abs. 1 ZPO: Übergabe an die Schweizerische Post am letzten Tag genügt).',
      'Hinweis, keine verbindliche Zustellberechnung.',
    ],
  };
}

// ─── P1.4 .ics-Export + Permalink (clientseitig, deterministisch) ───────────

// RFC-5545-Minimal-VCALENDAR (ganztägig). DETERMINISTISCH: UID und DTSTAMP
// werden aus den Eingaben abgeleitet (kein Date.now, §2).
// Kalender-Export: seit 6.6.2026 geteilter Baustein in lib/icsExport.ts
// (FAHRPLAN-PRAXIS 1.1) — Re-Export erhält die bestehende API (§6).
export { icsFuerFrist } from './icsExport';

// ─── Mechanik-Presets des Allgemein-Tabs (FE-3: aus der Form gehoben) ───────
// Setzen nur Einheit/Toggles – keine vorgetäuschte Subsumtion. Liegen hier,
// damit der Preset-Index (lib/presetIndex.ts) sie ohne UI-Import listet (§3).
export const MECHANIK_PRESETS: { key: string; label: string; patch: Partial<AllgFristInput>; info?: string }[] = [
  { key: 'tagesfrist', label: 'Tagesfrist (Kalendertage)',
    patch: { einheit: 'tage', wochenendeVerschieben: true, feiertageVerschieben: true } },
  // RL-24/F1-02: Label nennt das Regime — die Samstagsverschiebung gilt nur
  // für gesetzliche/behördliche Fristen; «nach OR» liess Vertragsfristen offen.
  { key: 'monatsfrist_or', label: 'Monatsfrist (gesetzlich)',
    patch: { einheit: 'monate', laenge: 1, wochenendeVerschieben: true, feiertageVerschieben: true, fristart: 'gesetzlich' },
    info: 'endet am gleichbezeichneten Tag (BGE 150 III 367)' },
  { key: 'kalendertage_pur', label: 'Kalendertage ohne Verschiebung',
    patch: { einheit: 'tage', wochenendeVerschieben: false, feiertageVerschieben: false } },
];

/** Query eines Mechanik-Presets — dieselben Parameter, die fristQueryLesen
 *  liest (§5); ohne Startdatum (das Datum gibt der Nutzer ein). */
export function mechanikPresetQuery(patch: Partial<AllgFristInput>): string {
  const p = new URLSearchParams();
  if (patch.einheit) p.set('e', patch.einheit);
  if (patch.laenge != null) p.set('l', String(patch.laenge));
  if (patch.wochenendeVerschieben) p.set('w', '1');
  if (patch.feiertageVerschieben) p.set('f', '1');
  const q = p.toString();
  return q ? `?${q}` : '';
}

// Permalink: Eingaben → URL-Query und zurück (kein Tracking, rein lokal).
export function fristQueryKodieren(f: AllgFristInput): string {
  const p = new URLSearchParams();
  p.set('s', f.start); p.set('l', String(f.laenge)); p.set('e', f.einheit);
  if (f.wochenendeVerschieben) p.set('w', '1');
  if (f.feiertageVerschieben) { p.set('f', '1'); if (f.kanton) p.set('k', f.kanton); }
  // RL-24/F1-02: nur die Vertragsfrist wird kodiert — gesetzliche Links bleiben byte-gleich.
  if (f.fristart === 'vertraglich') p.set('r', 'v');
  return p.toString();
}

export function fristQueryLesen(query: string): Partial<AllgFristInput> | null {
  const p = new URLSearchParams(query);
  // FE-3 (FAHRPLAN-FRISTEN-EINHEIT): s/l/e sind einzeln optional — Preset-
  // Index-Links tragen Länge/Einheit ohne Startdatum (das Datum gibt der
  // Nutzer ein). VORHANDENE Werte werden unverändert strikt validiert; ein
  // ungültiger Wert verwirft wie bisher den ganzen Link. Vollständige
  // Teilen-Links (s+l+e) dekodieren byte-identisch wie zuvor.
  const teil: Partial<AllgFristInput> = {};
  const s = p.get('s');
  if (s !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    teil.start = s;
  }
  const lRoh = p.get('l');
  if (lRoh !== null) {
    const laenge = Number(lRoh);
    if (!Number.isInteger(laenge) || laenge <= 0) return null;
    teil.laenge = laenge;
  }
  const eRoh = p.get('e');
  if (eRoh !== null) {
    if (!['tage', 'wochen', 'monate', 'jahre'].includes(eRoh)) return null;
    teil.einheit = eRoh as Einheit;
  }
  // Bug-Check 10.6.2026 (MITTEL): «l» allein genügt NICHT — ZPO-/SchKG-Links
  // teilen den Parameter «l»; verliert ein solcher Link sein #-Fragment
  // (Mail-/Messenger-Sanitizer), darf er den Allgemein-Tab nicht partiell
  // hydratisieren (Toggles wären still AUS). Alle legitimen Erzeuger tragen
  // s (Teilen-Link) oder e (Mechanik-Preset-Link).
  if (teil.start === undefined && teil.einheit === undefined) return null;
  // Kanton nur übernehmen, wenn er ein echter Kanton ist (Review A2:
  // ungeprüfter Cast liess Fantasie-Werte ins <select> durchsickern)
  const KANTONE_GUELTIG = new Set(['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH']);
  const kantonRoh = p.get('k');
  const kanton = kantonRoh && KANTONE_GUELTIG.has(kantonRoh) ? (kantonRoh as Kanton) : undefined;
  return {
    ...teil,
    // w/f-Abwesenheit heisst «aus» — so kodiert der Teilen-Knopf (unverändert).
    wochenendeVerschieben: p.get('w') === '1' || p.get('f') === '1',
    feiertageVerschieben: p.get('f') === '1',
    ...(kanton ? { kanton } : {}),
    ...(p.get('r') === 'v' ? { fristart: 'vertraglich' as const } : {}),
  };
}
