// Dossier: bibliothek/recherche/bgg-beschwerde-engine.md
// Abteilungs-Zuteilung: bibliothek/behoerden/rechtsmittel-spruchkoerper-kantone.md §3
import { parseISO } from 'date-fns';
import { formatISO } from './datumsUtils';
import type { Kanton, Berechnungsergebnis, Rechenschritt, Normverweis } from '../types/legal';
import { fristendeTage, hinweisBedingteFeiertageEnde, normalisiereEnde, OHNE_STILLSTAND, type Stillstand } from './fristenEngine';
import { stillstandsperioden, stillstandsperiodeFuer } from '../data/zpoFeiertage';
import { formatDatum, istGueltigesISO } from './datumsUtils';
import { chfOhnePraefix } from './format';

// ─── BGer-Rechtsweg-Engine (BGG, SR 173.110) ─────────────────────────────────
//
// FAHRPLAN-BGER-RECHTSWEG.md (Auftrag David 11.6.2026). EIGENE Engine (§4):
// Das BGG ist ein eigenes Verfahrensregime quer zu ZPO/SchKG/StPO — der
// kantonale Rechtsmittelweg bleibt in zustaendigkeit.ts (bestimmeRechtsmittel),
// schkgZustaendigkeit.ts und strafRechtsmittel.ts; diese Engine beantwortet
// NUR die Bundesgerichts-Stufe: Beschwerdetyp · Zulässigkeit · Frist mit
// Stillstand und konkretem Fristende · Abteilung (BGerR) · Hinweise.
//
// Alle Wortlaute am Fedlex-Cache verifiziert (BGG Konsolidierung 20260401;
// BGerR 20260201, gepinnt 11.6.2026): Art. 42, 44–47, 50, 51–53, 72–81,
// 90–93, 95–100, 103, 113–119 BGG · Art. 33/34/35/35a/36 BGerR ·
// Art. 19 SchKG (Verweis aufs BGG).
//
// Stillstand: Die Perioden des Art. 46 Abs. 1 BGG (Ostern ± 7 Tage ·
// 15.7.–15.8. · 18.12.–2.1.) sind DATUMSGLEICH mit Art. 145 Abs. 1 ZPO —
// geteilt werden nur die Perioden-Daten und die Datums-Arithmetik
// (fachneutrale Infrastruktur, §4); das BGG-Regime bleibt hier eigenständig
// deklariert und wird nicht mit der ZPO-Engine kollabiert.

export type BgerWeg = 'zivil' | 'schkg_aufsicht' | 'straf' | 'verwaltung';

/** Rechtsgebiet der Zivilsache — steuert die Streitwert-Schwelle
 *  (Art. 74 Abs. 1 BGG: arbeit/miete 15 000, übrige 30 000) und die
 *  Abteilungs-Zuteilung (Art. 33/34 BGerR). */
export type BgerZivilgebiet =
  | 'schuldrecht'            // OR/Vertrag allgemein → I. (Art. 33 lit. a)
  | 'arbeit'                 // privates Arbeitsrecht → I. (Schuldrecht); Schwelle 15k
  | 'miete'                  // Miete/Pacht → I. (Schuldrecht); Schwelle 15k
  | 'versicherungsvertrag'   // VVG → I. (lit. b)
  | 'haftpflicht'            // ausservertraglich, auch Spezialgesetze → I. (lit. c)
  | 'uwg'                    // privates Wettbewerbsrecht → I. (lit. e)
  | 'immaterialgueter'       // → I. (lit. f)
  | 'rechtsoeffnung'         // prov./def. Rechtsöffnung → I. (lit. i – die Falle!)
  | 'personenrecht'          // ZGB → II. (Art. 34 lit. a Ziff. 1)
  | 'familienrecht'          // ZGB inkl. Kindes-/Erwachsenenschutz → II. (Ziff. 2)
  | 'erbrecht'               // ZGB → II. (Ziff. 3)
  | 'sachenrecht'            // ZGB inkl. Grundbuch → II. (Ziff. 4)
  | 'baeuerliches_bodenrecht'// BGBB → II. (lit. b)
  | 'schkg_uebrig';          // SchKG ohne Rechtsöffnung (Arrest, Kollokation, Konkurs …) → II. (lit. c)

export type BgerObjekt =
  | 'endentscheid'
  | 'teilentscheid'
  | 'zwischen_zustaendigkeit_ausstand'
  | 'zwischen_anderer';

/** Sonderfälle des Verwaltungswegs mit eigener Frist/Stillstand-Folge. */
export type BgerVerwaltungSonderfall =
  | 'keiner'
  | 'rechtshilfe_amtshilfe'  // 10 T. (Art. 100 Abs. 2 lit. b) · kein Stillstand (Art. 46 Abs. 2 lit. d)
  | 'abstimmung'             // 5 T. (Abs. 3 lit. b) · kein Stillstand (lit. c)
  | 'nationalratswahl'       // 3 T. (Abs. 4) · kein Stillstand (lit. c)
  // Bug-Check-Befund 11.6.2026 (§7-Abweichung, offen gelegt): Art. 46 Abs. 2
  // lit. c nimmt ALLE Stimmrechtssachen (Art. 82 lit. c) vom Stillstand aus —
  // auch KANTONALE mit ordentlicher 30-Tage-Frist (Art. 100 Abs. 1); das
  // Dossier (bgg-beschwerde-engine.md) zitiert lit. c entsprechend pauschal.
  | 'stimmrechtssache'       // 30 T. (Abs. 1) · kein Stillstand (lit. c) — kantonale Stimmrechtssachen
  | 'beschaffung';           // 30 T. · kein Stillstand (lit. e)

export type BgerInput = {
  weg: BgerWeg;
  objekt?: BgerObjekt;                   // default 'endentscheid'
  /** Verfahren betreffend aufschiebende Wirkung / vorsorgliche Massnahmen
   *  (Art. 46 Abs. 2 lit. a, Art. 98 BGG). */
  vorsorglicheMassnahme?: boolean;
  /** Eheschutz: nach Rechtsprechung (BGE 133 III 393) vorsorgliche Massnahme
   *  im BGG-Sinn — Sekundärquelle, wird als WARNUNG offengelegt (V-1). */
  eheschutz?: boolean;
  /** Rechtsverweigerung/-verzögerung: Beschwerde jederzeit (Art. 100 Abs. 7). */
  rechtsverweigerung?: boolean;
  // — Zivil —
  zivilGebiet?: BgerZivilgebiet;
  vermoegensrechtlich?: boolean;         // default true
  streitwertCHF?: number | null;         // vor der Vorinstanz streitig gebliebene Begehren (Art. 51 Abs. 1 lit. a)
  markenwiderspruch?: boolean;           // Hard-Stop Art. 73
  schiedsgericht?: boolean;              // Art. 77 (streitwertunabhängig, Sonderregime)
  einzigeKantonaleInstanz?: boolean;     // Art. 74 Abs. 2 lit. b / Art. 75 Abs. 2 (Art. 5/6/8 ZPO)
  konkursNachlassrichter?: boolean;      // Art. 74 Abs. 2 lit. d
  hkueKindesrueckgabe?: boolean;         // Art. 100 Abs. 2 lit. c (10 Tage)
  // — SchKG-Aufsicht —
  wechselbetreibung?: boolean;           // Art. 100 Abs. 3 lit. a (5 T.) + Art. 46 Abs. 2 lit. b
  // — Verwaltung —
  verwaltungSonderfall?: BgerVerwaltungSonderfall;
  // — Fristende konkret —
  eroeffnung?: string | null;            // ISO: Eröffnung der vollständigen Ausfertigung
  kanton?: Kanton;                       // Art. 45 Abs. 2 BGG: Recht des Wohnsitz-/Sitzkantons
};

type BgerZulaessigkeit = 'zulaessig' | 'zulaessig_ausnahme' | 'offen' | 'schwelle_verfehlt' | 'unzulaessig';

type BgerFristende = {
  endeISO: string;
  endeText: string;
  verschoben: boolean;
};

export interface BgerErgebnis extends Berechnungsergebnis {
  beschwerdeTyp: string;
  zulaessigkeit: BgerZulaessigkeit;
  abteilung: string | null;
  fristTage: number | null;              // null = jederzeit (Art. 100 Abs. 7)
  fristNorm: string;
  stillstand: boolean;
  fristende: BgerFristende | null;
}

// ── Schwellen (Art. 74 Abs. 1 BGG, Wortlaut verifiziert) ─────────────────────

export const BGER_SCHWELLEN = {
  MIETE_ARBEIT: 15_000,  // lit. a
  UEBRIGE: 30_000,       // lit. b
} as const;

/** Kapitalwert wiederkehrender Nutzungen/Leistungen bei ungewisser oder
 *  unbeschränkter Dauer: ZWANZIGFACHE Jahresleistung (Art. 51 Abs. 4 BGG) —
 *  reine Multiplikation; Leibrenten (Barwert) werden NICHT gerechnet. */
export function bgerKapitalwert20x(jahresleistungCHF: number): number {
  return jahresleistungCHF * 20;
}

// ── BGG-Stillstand (Art. 46 Abs. 1 — eigenes Regime, geteilte Perioden-Daten) ─

const BGG_STILLSTAND: Stillstand = {
  periodeFuer: stillstandsperiodeFuer,
  perioden: stillstandsperioden,
  ruhenZaehlung: true,
  endregel: 'ruhen_weiter',
};

// ── Abteilungs-Zuteilung (Art. 33/34 BGerR, zeichengenau verifiziert) ────────

const ABTEILUNG_I = new Set<BgerZivilgebiet>([
  'schuldrecht', 'arbeit', 'miete', 'versicherungsvertrag', 'haftpflicht',
  'uwg', 'immaterialgueter', 'rechtsoeffnung',
]);

export function bgerAbteilungZivil(gebiet: BgerZivilgebiet): { name: string; norm: string } {
  return ABTEILUNG_I.has(gebiet)
    ? { name: 'I. zivilrechtliche Abteilung', norm: 'Art. 33 BGerR' }
    : { name: 'II. zivilrechtliche Abteilung', norm: 'Art. 34 BGerR' };
}

const N = (artikel: string, bemerkung?: string): Normverweis => ({ artikel, bemerkung });

/** Massgebliche Begehren je Anfechtungsobjekt (Art. 51 Abs. 1 lit. a–c BGG —
 *  Fach-Lupe M2, 11.6.2026: lit. a gilt NUR für Endentscheide). */
function sw51Satz(objekt: BgerObjekt): string {
  if (objekt === 'teilentscheid') {
    return 'Massgeblich sind beim Teilentscheid die GESAMTEN Begehren, die vor der Instanz streitig waren, die den Teilentscheid getroffen hat (Art. 51 Abs. 1 lit. b BGG).';
  }
  if (objekt === 'zwischen_zustaendigkeit_ausstand' || objekt === 'zwischen_anderer') {
    return 'Massgeblich sind beim Vor-/Zwischenentscheid die Begehren, die vor der Instanz streitig sind, wo die Hauptsache hängig ist (Art. 51 Abs. 1 lit. c BGG).';
  }
  return 'Massgeblich sind die vor der Vorinstanz streitig GEBLIEBENEN Begehren (Art. 51 Abs. 1 lit. a BGG).';
}
// ── Hauptfunktion ────────────────────────────────────────────────────────────

export function berechneBgerRechtsweg(input: BgerInput): BgerErgebnis {
  const objekt = input.objekt ?? 'endentscheid';
  const vorsorglich = input.vorsorglicheMassnahme === true || input.eheschutz === true;
  const vermoegensrechtlich = input.vermoegensrechtlich ?? true;
  const gebiet = input.zivilGebiet ?? 'schuldrecht';

  const rechenweg: Rechenschritt[] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];
  const normverweise: Normverweis[] = [];

  if (input.weg === 'zivil' && vermoegensrechtlich && !input.schiedsgericht
    && input.streitwertCHF != null && (!Number.isFinite(input.streitwertCHF) || input.streitwertCHF < 0)) {
    throw new Error('Streitwert muss eine Zahl ≥ 0 sein.');
  }

  // ── Stufe A · Beschwerdetyp + Hard-Stops ──────────────────────────────────
  let beschwerdeTyp: string;
  let abteilung: string | null;
  let zulaessigkeit: BgerZulaessigkeit = 'zulaessig';

  if (input.weg === 'zivil' || input.weg === 'schkg_aufsicht') {
    beschwerdeTyp = 'Beschwerde in Zivilsachen';
    const schrittText = input.weg === 'schkg_aufsicht'
      ? 'Entscheide der kantonalen Aufsichtsbehörden in Schuldbetreibungs- und Konkurssachen unterliegen der Beschwerde in ZIVILSACHEN (Art. 72 Abs. 2 lit. a BGG; Art. 19 SchKG verweist vollständig auf das BGG).'
      : 'Zivilsache → Beschwerde in Zivilsachen (Art. 72 Abs. 1 BGG); SchKG- und zivilrechtsnahe Registersachen sind eingeschlossen (Abs. 2).';
    rechenweg.push({ beschreibung: 'Beschwerdetyp', zwischenergebnis: schrittText, normen: [N('Art. 72 BGG')] });

    if (input.markenwiderspruch) {
      const bericht: Berechnungsergebnis = {
        ergebnis: 'Beschwerde ans Bundesgericht UNZULÄSSIG: Entscheide im Markenwiderspruchsverfahren sind von der Beschwerde in Zivilsachen ausgenommen (Art. 73 BGG).',
        status: 'unzulaessig', rechenweg, annahmen, warnungen, normverweise: [N('Art. 73 BGG')],
      };
      return { ...bericht, beschwerdeTyp, zulaessigkeit: 'unzulaessig', abteilung: null, fristTage: null, fristNorm: 'Art. 73 BGG', stillstand: false, fristende: null };
    }

    const abt = input.weg === 'schkg_aufsicht'
      ? { name: 'II. zivilrechtliche Abteilung', norm: 'Art. 34 BGerR' }
      : input.schiedsgericht
        ? { name: 'I. zivilrechtliche Abteilung', norm: 'Art. 33 BGerR' }
        : bgerAbteilungZivil(gebiet);
    abteilung = `${abt.name} (${abt.norm})`;
    normverweise.push(N(abt.norm, 'Geschäftsverteilung Bundesgericht'));
    if (gebiet === 'rechtsoeffnung' && input.weg === 'zivil') {
      rechenweg.push({
        beschreibung: 'Abteilung (BGerR)',
        zwischenergebnis: 'Provisorische und definitive Rechtsöffnungen behandelt die I. ZIVILRECHTLICHE Abteilung (Art. 33 lit. i BGerR) – die einzige Ausnahme von der Regel, dass SchKG-Sachen zur II. Abteilung gehen (Art. 34 lit. c BGerR).',
        normen: [N('Art. 33 BGerR'), N('Art. 34 BGerR')],
      });
    } else {
      rechenweg.push({ beschreibung: 'Abteilung (BGerR)', zwischenergebnis: `Zuständig ist die ${abt.name} (${abt.norm}).`, normen: [N(abt.norm)] });
    }
  } else if (input.weg === 'straf') {
    beschwerdeTyp = 'Beschwerde in Strafsachen';
    abteilung = 'Erste oder Zweite strafrechtliche Abteilung (Art. 35/35a BGerR; Zuteilung nach dem Schwergewicht der Entscheidung, Art. 36 BGerR)';
    rechenweg.push({
      beschreibung: 'Beschwerdetyp',
      zwischenergebnis: 'Strafsache → Beschwerde in Strafsachen (Art. 78 Abs. 1 BGG); eingeschlossen sind Zivilansprüche, die mit der Strafsache zu behandeln sind, und der Vollzug von Strafen und Massnahmen (Abs. 2). Vorinstanzen: letzte kantonale Instanzen sowie Beschwerde- und Berufungskammer des Bundesstrafgerichts (Art. 80 Abs. 1).',
      normen: [N('Art. 78 BGG'), N('Art. 80 BGG')],
    });
    rechenweg.push({
      beschreibung: 'Abteilung (BGerR)',
      zwischenergebnis: 'Seit 1.2.2026 bestehen ZWEI strafrechtliche Abteilungen: die Erste für materielle Straf- und Zivilfragen (Art. 35 BGerR), die Zweite für strafprozessuale Zwischen- und Endentscheide (einschliesslich Nichtanhandnahme und Einstellung), Vollzugs- und nachträgliche Entscheide (Art. 35a BGerR). Massgeblich ist das Schwergewicht der Entscheidung (Art. 36 BGerR).',
      normen: [N('Art. 35 BGerR'), N('Art. 35a BGerR'), N('Art. 36 BGerR')],
    });
    warnungen.push('Gegen Entscheide der BESCHWERDEKAMMER des Bundesstrafgerichts ist die Beschwerde nur bei Zwangsmassnahmen-Entscheiden zulässig (Art. 79 BGG).');
    annahmen.push('Beschwerderecht (Art. 81 BGG): Die Privatklägerschaft ist nur beschwerdeberechtigt, wenn sich der Entscheid auf die Beurteilung ihrer ZIVILANSPRÜCHE auswirken kann (Abs. 1 lit. b Ziff. 5); die Staatsanwaltschaft nicht bei Entscheiden über Anordnung, Verlängerung oder Aufhebung der Untersuchungs- und Sicherheitshaft (Ziff. 3).');
    normverweise.push(N('Art. 78 BGG'), N('Art. 79 BGG'), N('Art. 81 BGG'));
  } else {
    beschwerdeTyp = 'Beschwerde in öffentlich-rechtlichen Angelegenheiten';
    abteilung = null;
    rechenweg.push({
      beschreibung: 'Beschwerdetyp',
      zwischenergebnis: 'Angelegenheit des öffentlichen Rechts → Beschwerde in öffentlich-rechtlichen Angelegenheiten (Art. 82 lit. a BGG); Vorinstanzen sind das Bundesverwaltungsgericht und letzte kantonale obere Gerichte (Art. 86).',
      normen: [N('Art. 82 BGG'), N('Art. 86 BGG')],
    });
    warnungen.push('Der AUSNAHMEKATALOG des Art. 83 BGG (u. a. Ausländer- und Asylsachen, ordentliche Einbürgerung, öffentliche Beschaffungen ohne Grundsatzfrage) ist hier NICHT abgebildet – vor dem Weiterzug prüfen, ob die Materie ausgenommen ist; ausgenommene Materien führen bei KANTONALEN Vorinstanzen zur subsidiären Verfassungsbeschwerde (Art. 113 BGG) – gegen Entscheide des Bundesverwaltungsgerichts gibt es sie nicht.');
    // QS-GP-Befund 2.7.2026 (§8-Offenlegung): Die STREITWERTGRENZEN des Art. 85
    // BGG werden nicht gerechnet (kein Streitwert-Input für den Verwaltungsweg,
    // §14-Feature deferiert). Der Wortlaut ist am Fedlex-Filestore (cc/2006/218,
    // Kons. 20260401) verifiziert: Abs. 1 lit. a Staatshaftung < 30 000, lit. b
    // öff.-rechtl. Arbeitsverhältnisse < 15 000 → unzulässig; Abs. 2 Ausnahme
    // Rechtsfrage von grundsätzlicher Bedeutung. Bis der Zweig gebaut ist, wird
    // die Lücke offengelegt statt pauschal «zulässig» zu suggerieren (§8).
    warnungen.push('STREITWERTGRENZEN (Art. 85 BGG) sind hier NICHT geprüft: In VERMÖGENSRECHTLICHEN Angelegenheiten ist die Beschwerde auf dem Gebiet der Staatshaftung bei einem Streitwert unter CHF 30 000 (Abs. 1 lit. a) und auf dem Gebiet der öffentlich-rechtlichen Arbeitsverhältnisse bei einem Streitwert unter CHF 15 000 (Abs. 1 lit. b) UNZULÄSSIG – es sei denn, es stellt sich eine Rechtsfrage von grundsätzlicher Bedeutung (Abs. 2). Das hier ausgewiesene «zulässig» steht in diesen beiden Materien unter diesem Streitwert-Vorbehalt.');
    normverweise.push(N('Art. 82 BGG'), N('Art. 83 BGG', 'Ausnahmekatalog – nicht abgebildet'), N('Art. 85 BGG', 'Streitwertgrenzen öffentliches Recht – nicht abgebildet'));
  }

  // ── Stufe B · Anfechtungsobjekt (Art. 90–93) — nicht bei Schiedsbeschwerden ─
  if (input.schiedsgericht && input.weg === 'zivil') {
    rechenweg.push({
      beschreibung: 'Schiedsentscheid (Art. 77 BGG)',
      zwischenergebnis: 'Gegen Schiedsentscheide ist die Beschwerde in Zivilsachen UNGEACHTET DES STREITWERTS zulässig (Art. 77 Abs. 1 BGG; international Art. 190–192 IPRG, national Art. 389–395 ZPO). Es gilt ein eigenes Regime: u. a. die Art. 90–98 BGG sind NICHT anwendbar (Abs. 2), und es gilt der eng begrenzte Rügenkatalog des Schiedsrechts.',
      normen: [N('Art. 77 BGG')],
    });
    normverweise.push(N('Art. 77 BGG'));
  } else {
    if (objekt === 'zwischen_zustaendigkeit_ausstand') {
      rechenweg.push({
        beschreibung: 'Anfechtungsobjekt',
        zwischenergebnis: 'Selbständig eröffneter Vor-/Zwischenentscheid über ZUSTÄNDIGKEIT oder AUSSTAND: Die Beschwerde ist zulässig – und muss JETZT erhoben werden; eine spätere Anfechtung ist ausgeschlossen (Art. 92 BGG).',
        normen: [N('Art. 92 BGG')],
      });
      warnungen.push('Verwirkungsgefahr: Zwischenentscheide über Zuständigkeit und Ausstand können SPÄTER NICHT MEHR angefochten werden (Art. 92 Abs. 2 BGG).');
      normverweise.push(N('Art. 92 BGG'));
    } else if (objekt === 'zwischen_anderer') {
      rechenweg.push({
        beschreibung: 'Anfechtungsobjekt',
        zwischenergebnis: 'Anderer selbständig eröffneter Vor-/Zwischenentscheid: Beschwerde nur zulässig, wenn er einen nicht wieder gutzumachenden Nachteil bewirken kann ODER die Gutheissung sofort einen Endentscheid herbeiführen UND damit einen bedeutenden Aufwand an Zeit oder Kosten für ein weitläufiges Beweisverfahren ersparen würde (Art. 93 Abs. 1 lit. a/b BGG) – sonst Anfechtung erst mit dem Endentscheid (Abs. 3).',
        normen: [N('Art. 93 BGG')],
      });
      warnungen.push('Offene Rechtsfrage (Art. 93 Abs. 1 BGG): Droht ein nicht wieder gutzumachender Nachteil, oder führt die Gutheissung sofort einen Endentscheid herbei UND erspart damit einen bedeutenden Aufwand für ein weitläufiges Beweisverfahren? Nur dann ist der Zwischenentscheid jetzt anfechtbar.');
      normverweise.push(N('Art. 93 BGG'));
    } else {
      rechenweg.push({
        beschreibung: 'Anfechtungsobjekt',
        zwischenergebnis: objekt === 'teilentscheid'
          ? 'Teilentscheid: Die Beschwerde ist zulässig, wenn die behandelten Begehren unabhängig beurteilt werden können oder das Verfahren für einen Teil der Streitgenossen abgeschlossen ist (Art. 91 BGG).'
          : 'Endentscheid: Die Beschwerde ist zulässig gegen Entscheide, die das Verfahren abschliessen (Art. 90 BGG).',
        normen: [N(objekt === 'teilentscheid' ? 'Art. 91 BGG' : 'Art. 90 BGG')],
      });
      normverweise.push(N(objekt === 'teilentscheid' ? 'Art. 91 BGG' : 'Art. 90 BGG'));
    }
  }

  // ── Stufe C · Zulässigkeit (Zivil: Art. 74 BGG) ───────────────────────────
  if (input.weg === 'zivil' && !input.schiedsgericht) {
    let zulText: string;
    const mietArbeit = gebiet === 'arbeit' || gebiet === 'miete';
    const schwelle = mietArbeit ? BGER_SCHWELLEN.MIETE_ARBEIT : BGER_SCHWELLEN.UEBRIGE;
    const sw = vermoegensrechtlich ? (input.streitwertCHF ?? null) : null;

    if (!vermoegensrechtlich) {
      zulaessigkeit = 'zulaessig';
      zulText = 'Nicht vermögensrechtliche Angelegenheit: Die Streitwertgrenze des Art. 74 Abs. 1 BGG gilt nicht.';
      normverweise.push(N('Art. 74 BGG'));
    } else if (input.einzigeKantonaleInstanz) {
      zulaessigkeit = 'zulaessig_ausnahme';
      zulText = 'StreitwertUNABHÄNGIG zulässig: Ein Bundesgesetz sieht eine einzige kantonale Instanz vor (Art. 74 Abs. 2 lit. b BGG; Art. 5/6/8 ZPO – für Handelsgericht und Direktklage nach gefestigter Praxis, Art. 75 Abs. 2 BGG).';
      normverweise.push(N('Art. 74 Abs. 2 BGG'), N('Art. 75 Abs. 2 BGG'));
    } else if (input.konkursNachlassrichter) {
      zulaessigkeit = 'zulaessig_ausnahme';
      zulText = 'StreitwertUNABHÄNGIG zulässig: Entscheid des Konkurs- oder Nachlassrichters bzw. der Konkurs- oder Nachlassrichterin (Art. 74 Abs. 2 lit. d BGG) – z. B. Konkurseröffnung oder Nachlassstundung.';
      normverweise.push(N('Art. 74 Abs. 2 BGG'));
    } else if (gebiet === 'rechtsoeffnung' && sw !== null && sw < schwelle) {
      zulaessigkeit = 'schwelle_verfehlt';
      zulText = `Streitwert CHF ${chfOhnePraefix(sw)} unter der Grenze von CHF ${chfOhnePraefix(schwelle)} (Art. 74 Abs. 1 lit. b BGG). Die Rechtsöffnung fällt unter keine der KATEGORISCHEN Streitwert-Ausnahmen des Abs. 2 lit. b–e (sie ist weder Aufsichts- noch Konkurseröffnungsentscheid) – offen bleiben die Rechtsfrage von grundsätzlicher Bedeutung (Abs. 2 lit. a, in der Beschwerde zu begründen, Art. 42 Abs. 2) oder die subsidiäre Verfassungsbeschwerde.`;
      normverweise.push(N('Art. 74 BGG'), N('Art. 113 BGG'));
    } else if (sw === null) {
      zulaessigkeit = 'offen';
      zulText = `Ohne bezifferten Streitwert nicht bestimmbar: Beschwerde in Zivilsachen ab CHF ${chfOhnePraefix(schwelle)} (${mietArbeit ? 'arbeits-/mietrechtlicher Fall, Art. 74 Abs. 1 lit. a' : 'Art. 74 Abs. 1 lit. b'} BGG). ${sw51Satz(objekt)}`;
      normverweise.push(N('Art. 74 Abs. 1 BGG'), N('Art. 51 BGG'));
    } else if (sw >= schwelle) {
      zulaessigkeit = 'zulaessig';
      zulText = `Streitwert CHF ${chfOhnePraefix(sw)} ≥ CHF ${chfOhnePraefix(schwelle)} (${mietArbeit ? 'arbeits-/mietrechtlicher Fall, Art. 74 Abs. 1 lit. a' : 'Art. 74 Abs. 1 lit. b'} BGG) → Beschwerde in Zivilsachen zulässig.`;
      normverweise.push(N('Art. 74 Abs. 1 BGG'));
    } else {
      zulaessigkeit = 'schwelle_verfehlt';
      zulText = `Streitwert CHF ${chfOhnePraefix(sw)} unter der Grenze von CHF ${chfOhnePraefix(schwelle)} (${mietArbeit ? 'Art. 74 Abs. 1 lit. a' : 'Art. 74 Abs. 1 lit. b'} BGG). Streitwertunabhängig bleibt die Beschwerde zulässig bei einer Rechtsfrage von grundsätzlicher Bedeutung (Abs. 2 lit. a – in der Beschwerde zu begründen, Art. 42 Abs. 2) sowie in den übrigen Fällen des Abs. 2 (einzige kantonale Instanz · SchKG-Aufsicht · Konkurs-/Nachlassrichter · Bundespatentgericht).`;
      normverweise.push(N('Art. 74 BGG'), N('Art. 113 BGG'));
    }
    rechenweg.push({ beschreibung: 'Zulässigkeit (Streitwert)', zwischenergebnis: zulText, normen: [N('Art. 74 BGG')] });

    if (vermoegensrechtlich) {
      annahmen.push(`Streitwert-Berechnung (Art. 51–53 BGG): ${sw51Satz(objekt)} Zinsen, Gerichtskosten und Parteientschädigungen als Nebenrechte zählen NICHT (Abs. 3); wiederkehrende Leistungen ungewisser Dauer mit dem 20-fachen Jahresbetrag (Abs. 4); Begehren derselben Partei oder von Streitgenossen werden zusammengerechnet, sofern sie sich nicht gegenseitig ausschliessen (Art. 52); die Widerklage wird NICHT mit der Hauptklage zusammengerechnet (Art. 53 Abs. 1; Gegenausnahme bei sich ausschliessenden Klagen, Abs. 2). Lautet ein Begehren nicht auf eine bestimmte Geldsumme, setzt das Bundesgericht den Streitwert nach Ermessen fest (Art. 51 Abs. 2) – das rechnet LexMetrik nicht.`);
    }

    if (zulaessigkeit === 'schwelle_verfehlt') {
      rechenweg.push({
        beschreibung: 'Auffangweg: subsidiäre Verfassungsbeschwerde',
        zwischenergebnis: 'Ist die ordentliche Beschwerde unzulässig, bleibt die SUBSIDIÄRE VERFASSUNGSBESCHWERDE gegen letztinstanzliche kantonale Entscheide (Art. 113 BGG): nur Rügen der Verletzung verfassungsmässiger Rechte (Art. 116), gleiche Frist (Art. 117 i. V. m. Art. 100), KEINE aufschiebende Wirkung von Gesetzes wegen (Art. 117 verweist nur auf Art. 103 Abs. 1 und 3). Bei Unsicherheit beide Rechtsmittel in der GLEICHEN Rechtsschrift einreichen (Art. 119 Abs. 1).',
        normen: [N('Art. 113 BGG'), N('Art. 116 BGG'), N('Art. 117 BGG'), N('Art. 119 BGG')],
      });
      normverweise.push(N('Art. 116 BGG'), N('Art. 119 BGG'));
    }
  } else if (input.weg === 'schkg_aufsicht') {
    zulaessigkeit = 'zulaessig_ausnahme';
    rechenweg.push({
      beschreibung: 'Zulässigkeit (Streitwert)',
      zwischenergebnis: 'StreitwertUNABHÄNGIG zulässig: Entscheide der kantonalen Aufsichtsbehörden in Schuldbetreibungs- und Konkurssachen (Art. 74 Abs. 2 lit. c BGG).',
      normen: [N('Art. 74 Abs. 2 BGG')],
    });
    normverweise.push(N('Art. 74 Abs. 2 BGG'));
  } else if (input.weg === 'zivil' && input.schiedsgericht) {
    // Weg-Gate (Bug-Check 11.6.2026, Defense-in-depth §3): Art. 77 gilt nur
    // für die Beschwerde in Zivilsachen — ohne Gate lieferte API-Misuse
    // (straf/verwaltung + schiedsgericht) «streitwertunabhängig zulässig».
    zulaessigkeit = 'zulaessig_ausnahme';
  }

  // ── Stufe D · Frist (Art. 100) + Stillstand (Art. 46) ─────────────────────
  let fristTage: number | null = 30;
  let fristNorm = 'Art. 100 Abs. 1 BGG';
  let fristMaterieText = 'Grundsatz: 30 Tage nach der Eröffnung der VOLLSTÄNDIGEN Ausfertigung (Art. 100 Abs. 1 BGG).';
  if (input.rechtsverweigerung) {
    fristTage = null;
    fristNorm = 'Art. 100 Abs. 7 BGG';
    fristMaterieText = 'Gegen das unrechtmässige Verweigern oder Verzögern eines Entscheids kann JEDERZEIT Beschwerde geführt werden (Art. 100 Abs. 7 BGG).';
  } else if (input.weg === 'schkg_aufsicht') {
    if (input.wechselbetreibung) {
      fristTage = 5;
      fristNorm = 'Art. 100 Abs. 3 lit. a BGG';
      fristMaterieText = 'SchKG-Aufsichtsentscheid im Rahmen der WECHSELBETREIBUNG: Beschwerdefrist 5 Tage (Art. 100 Abs. 3 lit. a BGG).';
    } else {
      fristTage = 10;
      fristNorm = 'Art. 100 Abs. 2 lit. a BGG';
      fristMaterieText = 'Entscheid der kantonalen Aufsichtsbehörde in Schuldbetreibungs- und Konkurssachen: Beschwerdefrist 10 Tage (Art. 100 Abs. 2 lit. a BGG).';
    }
  } else if (input.weg === 'zivil' && input.hkueKindesrueckgabe) {
    fristTage = 10;
    fristNorm = 'Art. 100 Abs. 2 lit. c BGG';
    fristMaterieText = 'Entscheid über die Rückgabe eines Kindes (HKÜ/ESÜ): Beschwerdefrist 10 Tage (Art. 100 Abs. 2 lit. c BGG).';
  } else if (input.weg === 'verwaltung') {
    const sf = input.verwaltungSonderfall ?? 'keiner';
    if (sf === 'rechtshilfe_amtshilfe') {
      fristTage = 10; fristNorm = 'Art. 100 Abs. 2 lit. b BGG';
      fristMaterieText = 'Internationale Rechtshilfe in Strafsachen / internationale Amtshilfe in Steuersachen: Beschwerdefrist 10 Tage (Art. 100 Abs. 2 lit. b BGG).';
    } else if (sf === 'abstimmung') {
      fristTage = 5; fristNorm = 'Art. 100 Abs. 3 lit. b BGG';
      fristMaterieText = 'Eidgenössische Abstimmung: Beschwerdefrist 5 Tage (Art. 100 Abs. 3 lit. b BGG).';
    } else if (sf === 'nationalratswahl') {
      fristTage = 3; fristNorm = 'Art. 100 Abs. 4 BGG';
      fristMaterieText = 'Nationalratswahlen: Beschwerdefrist 3 Tage (Art. 100 Abs. 4 BGG).';
    } else if (sf === 'stimmrechtssache') {
      // Frist bleibt der 30-Tage-Grundsatz (Abs. 1); die Besonderheit liegt
      // allein beim Stillstand (Art. 46 Abs. 2 lit. c, unten).
      fristMaterieText = 'Stimmrechtssache (Art. 82 lit. c BGG; kantonal bzw. ausserhalb der eidg. Sonderfristen): Beschwerdefrist 30 Tage (Art. 100 Abs. 1 BGG).';
    }
  }

  // Stillstand (Art. 46): Abs. 1 Grundsatz; Abs. 2 abschliessende Ausnahmen.
  // Weg-Gate als Defense-in-depth (Bug-Check 11.6.2026): die Sonderfall-
  // Ausnahmen lit. c–e setzen den Verwaltungsweg voraus; die Rechtsregel
  // darf nicht vom UI-Gating der Form abhängen (§3).
  const sf = input.weg === 'verwaltung' ? (input.verwaltungSonderfall ?? 'keiner') : 'keiner';
  let stillstand = true;
  let stillstandGrund = 'Fristenstillstand gilt (Art. 46 Abs. 1 BGG: Ostern ± 7 Tage · 15.7.–15.8. · 18.12.–2.1.).';
  if (fristTage === null) {
    stillstand = false;
    stillstandGrund = 'Ohne laufende Frist stellt sich die Stillstandsfrage nicht.';
  } else if (vorsorglich) {
    stillstand = false;
    stillstandGrund = 'KEIN Fristenstillstand: Verfahren betreffend aufschiebende Wirkung und andere vorsorgliche Massnahmen (Art. 46 Abs. 2 lit. a BGG).';
  } else if (input.weg === 'schkg_aufsicht' && input.wechselbetreibung) {
    stillstand = false;
    stillstandGrund = 'KEIN Fristenstillstand: Wechselbetreibung (Art. 46 Abs. 2 lit. b BGG).';
  } else if (sf === 'abstimmung' || sf === 'nationalratswahl' || sf === 'stimmrechtssache') {
    stillstand = false;
    stillstandGrund = 'KEIN Fristenstillstand: Stimmrechtssachen (Art. 46 Abs. 2 lit. c BGG).';
  } else if (sf === 'rechtshilfe_amtshilfe') {
    stillstand = false;
    stillstandGrund = 'KEIN Fristenstillstand: internationale Rechts-/Amtshilfe (Art. 46 Abs. 2 lit. d BGG).';
  } else if (sf === 'beschaffung') {
    stillstand = false;
    stillstandGrund = 'KEIN Fristenstillstand: öffentliche Beschaffungen (Art. 46 Abs. 2 lit. e BGG).';
  }

  rechenweg.push({
    beschreibung: 'Beschwerdefrist',
    zwischenergebnis: `${fristMaterieText} ${stillstandGrund} Die gesetzliche Frist ist NICHT erstreckbar (Art. 47 Abs. 1 BGG); bei unverschuldeter Säumnis bleibt die Wiederherstellung (Gesuch innert 30 Tagen nach Wegfall des Hindernisses, Art. 50 BGG).`,
    normen: [N(fristNorm), N('Art. 46 BGG'), N('Art. 47 BGG')],
  });
  normverweise.push(N(fristNorm), N('Art. 46 BGG'));

  if (input.eheschutz) {
    warnungen.push('EHESCHUTZ: Nach der Rechtsprechung (BGE 133 III 393) gelten Eheschutzentscheide im BGG als vorsorgliche Massnahmen – Folge: KEIN Fristenstillstand (Art. 46 Abs. 2 lit. a) und nur Verfassungsrügen (Art. 98). Diese Einordnung beruht auf Rechtsprechung, nicht auf dem Gesetzeswortlaut – im Einzelfall prüfen.');
  }

  // ── Stufe E · konkretes Fristende (Art. 44/45) ────────────────────────────
  let fristende: BgerFristende | null = null;
  if (fristTage !== null && input.eroeffnung && istGueltigesISO(input.eroeffnung)) {
    const kanton = input.kanton ?? 'BS';
    if (!input.kanton) {
      annahmen.push('Kanton für die Feiertags-/Werktagsregel am Fristende: ohne Angabe wird BS angenommen (Art. 45 Abs. 2 BGG: massgebend ist das Recht des Kantons, in dem die Partei oder ihre Vertretung Wohnsitz oder Sitz hat).');
    }
    const st = stillstand ? BGG_STILLSTAND : OHNE_STILLSTAND;
    const { ende } = fristendeTage(parseISO(input.eroeffnung), fristTage, st);
    // Feiertags-Kontext 'bgg' (RL-22-Nachzug): NE-Schliesstage zählen (BGer
    // 9C_396/2018 E. 2.3), SO 1. Mai nicht (nur Art. 142 ZPO) → Warnung.
    const norm = normalisiereEnde(ende, kanton, st, 'bgg');
    const bedingtHinweis = hinweisBedingteFeiertageEnde(ende, kanton, st, 'bgg');
    if (bedingtHinweis) warnungen.push(bedingtHinweis);
    fristende = {
      endeISO: formatISO(norm.tag),
      endeText: formatDatum(norm.tag),
      verschoben: norm.verschoben,
    };
    rechenweg.push({
      beschreibung: 'Fristende (konkret)',
      zwischenergebnis: `Eröffnung am ${formatDatum(parseISO(input.eroeffnung))}; die Frist beginnt am Folgetag (Art. 44 Abs. 1 BGG)${stillstand ? ', Stillstandstage zählen nicht (Art. 46 Abs. 1 BGG)' : ''} → letzter Tag: ${fristende.endeText}${norm.verschoben ? ' (Ende fiel auf Samstag/Sonntag/Feiertag → nächstfolgender Werktag, Art. 45 Abs. 1 BGG)' : ''}.`,
      normen: [N('Art. 44 Abs. 1 BGG'), N('Art. 45 BGG')],
    });
    normverweise.push(N('Art. 44 BGG'), N('Art. 45 BGG'));
    annahmen.push('Fristauslösend ist die Eröffnung der vollständigen Ausfertigung; bei eingeschriebener Zustellung gilt die Mitteilung spätestens am 7. Tag nach dem ersten erfolglosen Zustellungsversuch als erfolgt (Art. 44 Abs. 2 BGG).');
  }

  // ── Stufe F · Kognition / weitere Hinweise ────────────────────────────────
  // Weg-Gate straf (Bug-Check 11.6.2026, §7-Abweichung offen gelegt): Auf
  // strafprozessuale Zwangsmassnahmen (Haft, Beschlagnahme) ist Art. 98 BGG
  // nach gefestigter Rechtsprechung NICHT anwendbar — das BGer prüft frei
  // (BGE 137 IV 122 E. 2; 138 IV 186 E. 1.2; 140 IV 57 E. 2.2); nur der
  // Stillstands-Ausschluss (oben) bleibt. Die alte Warnung war für die von
  // der Form angebotene Haft-Konstellation eine falsche Rechtsaussage. Ein
  // straf-eigener Hinweis (freie Kognition) braucht Davids Abnahme — bis
  // dahin wird hier bewusst NICHTS behauptet.
  if (vorsorglich && !(input.weg === 'zivil' && input.schiedsgericht) && input.weg !== 'straf') {
    warnungen.push('KOGNITION: Gegen Entscheide über vorsorgliche Massnahmen kann nur die Verletzung VERFASSUNGSMÄSSIGER Rechte gerügt werden (Art. 98 BGG).');
    normverweise.push(N('Art. 98 BGG'));
  }
  annahmen.push('Vor Bundesgericht gilt das Novenverbot: Neue Tatsachen und Beweismittel nur, soweit erst der angefochtene Entscheid dazu Anlass gibt; neue Begehren sind unzulässig (Art. 99 BGG). Die Beschwerde hat in der Regel KEINE aufschiebende Wirkung (Art. 103 Abs. 1 BGG); von Gesetzes wegen besteht sie nur bei Gestaltungsurteilen in Zivilsachen, bei unbedingten Freiheitsstrafen und freiheitsentziehenden Massnahmen sowie in Verfahren der internationalen Rechtshilfe in Strafsachen und der internationalen Amtshilfe in Steuersachen (Abs. 2 lit. a–d).');
  annahmen.push('Formelles (Art. 42 BGG): Begehren, deren Begründung mit Angabe der Beweismittel (inwiefern der Entscheid Recht verletzt) und Unterschrift; wird die Zulässigkeit auf eine Rechtsfrage von grundsätzlicher Bedeutung gestützt, ist dies besonders zu begründen (Abs. 2).');

  // ── Verdikt ───────────────────────────────────────────────────────────────
  const fristKurz = fristTage === null ? 'jederzeit (Art. 100 Abs. 7 BGG)' : `${fristTage} Tage${stillstand ? ' mit Stillstand' : ' OHNE Stillstand'}`;
  const zulKurz = zulaessigkeit === 'zulaessig' ? 'zulässig'
    : zulaessigkeit === 'zulaessig_ausnahme' ? 'streitwertunabhängig zulässig'
    : zulaessigkeit === 'offen' ? 'Zulässigkeit streitwertabhängig'
    : zulaessigkeit === 'schwelle_verfehlt' ? 'Streitwertgrenze NICHT erreicht – Ausnahmen/Verfassungsbeschwerde prüfen'
    : 'unzulässig';
  const ergebnis = `${beschwerdeTyp}: ${zulKurz} · Frist ${fristKurz}${fristende ? ` · letzter Tag ${fristende.endeText}` : ''}${abteilung && (input.weg === 'zivil' || input.weg === 'schkg_aufsicht') ? ` · ${abteilung.split(' (')[0]}` : ''}`;

  return {
    ergebnis,
    // Der einzige unzulaessig-Pfad (Art. 73) hat oben bereits zurückgegeben.
    status: 'ok',
    rechenweg, annahmen, warnungen,
    normverweise,
    beschwerdeTyp, zulaessigkeit, abteilung, fristTage, fristNorm, stillstand, fristende,
  };
}
