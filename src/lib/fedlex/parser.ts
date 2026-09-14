// ─── Fedlex · Achse 4: Fliesstext-Parser ───
//
// Teil der Achsen-Aufteilung von src/lib/fedlex.ts (QS-CODE-SPLITS): dort steht
// nur noch die Fassade, die alles Bisherige unveraendert re-exportiert. Gerichtete
// Kette ohne Zyklus: tabelle ← url ← erkennung ← parser ← spannen.
//
// Diese Datei hält die ZITATFORMEN (Regex-Grammatik, Form B, Plural-Regionen);
// die Spannen-Bildung (Ketten-Propagierung, Erlass-Verweise) steht seit dem
// §6.6-Split vom 2.9.2026 in `spannen.ts` und importiert die Bausteine von hier.

import { type FedlexGesetz } from './tabelle';
import { artikelToken } from './url';
import { SUFFIX_ALT } from './nummer';
import {
  erkenneFedlexGesetz,
  erkenneGenitivGesetz,
  erkenneTitelGesetz,
  GENITIV_NAMEN_ESC,
  KUERZEL_TOKENS,
  TITEL_FRAGMENTE_ESC,
} from './erkennung';
import { datumPasst, historischeFassung, type FremdEbene } from './positivliste';
import { traegergesetzFuerErlass } from './traegergesetz';

// ─── Bund-Normverweise im Fliesstext finden (Inline-Auto-Linker) ───────────
//
// Globale Regex, die «Art. N[suffix] [Abs./lit./Ziff./Satz …] GESETZ»-Zitate in
// einem Anzeigetext findet — Schwester von RECHTSPRECHUNG_IM_TEXT (bge.ts) für
// Normen. Die Gesetzes-Namen kommen aus DIESER Datei (FEDLEX-Keys + Mehrwort-
// Alias), damit die Gesetz-Erkennung nicht dupliziert wird (§5): genau die
// Tokens, die erkenneFedlexGesetz am Zitat-Ende akzeptiert.
//
// Bewusst nur «Art.» (Bund), NICHT «§» — das kantonale «§ N» ist ohne Erlass-
// Kontext mehrdeutig und trifft im Code zahllose Nicht-Normen (CLAUDE.md-§-
// Prinzipien); kantonale Inline-Auflösung läuft über den Quelle-Kontext, nicht
// über einen blinden §-Regex.
//
// Die Passus-Kette (Abs./lit./Bst./Ziff./Satz) zwischen Artikel und Gesetz ist
// auf bekannte Zitat-Tokens beschränkt — so läuft der Match nie über einen
// Satz oder ein zweites «Art.» hinaus. Jeder Treffer wird vor dem Verlinken
// zusätzlich gegen fedlexLinkFuerArtikel validiert (kein toter Link).
// V-8 (W2·20): KUERZEL_TOKENS = FEDLEX-Keys + amtliche Schreibweisen («BankG»).
// Längste zuerst: «GebV SchKG» vor «SchKG», «StGB» vor «StG» (Suffix-Kollision).
export const NORM_NAMEN: ReadonlyArray<string> = (['GebV SchKG', ...KUERZEL_TOKENS] as string[])
  .sort((a, b) => b.length - a.length);
export const NORM_NAMEN_ESC = NORM_NAMEN.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

export const NORM_IM_TEXT = new RegExp(
  'Art\\.\\s*\\d+[a-z]?' + SUFFIX_ALT + '?' +
    '(?:\\s+(?:Abs\\.|lit\\.|Bst\\.|Ziff\\.|Ziffer|Satz)\\s*(?:\\d+[a-z]?' + SUFFIX_ALT + '?|[a-z]))*' +
    '\\s+(?:' + NORM_NAMEN_ESC.join('|') + ')\\b',
  'g',
);

// ─── N2 (Bündel N): Fremdgesetz-Erkennung nach einem bare «Artikel N» ────────
//
// Der Inline-Auto-Linker (NormText.restMitIntern) macht ein bare «Artikel N» zum
// Sprung-Link auf DEN AKTUELLEN Erlass. Nennt der Verweis aber ein anderes Gesetz
// («Artikel 1a Absatz 1 Buchstabe c AHVG» in der AHVV → AHVG, nicht AHVV), wäre
// der Self-Link falsch (§1). NORM_IM_TEXT erfasst nur die ABGEKÜRZTE Zitatform
// («Art. N Abs. X GESETZ»); die AUSGESCHRIEBENE Form («Artikel N Absatz X …
// GESETZ», 727 Fälle im Bund-Korpus) fällt durch. Dieser Erkenner deckt beide
// Schreibweisen ab und liefert das erkannte Fremdgesetz-Kürzel — deterministisch
// aus DERSELBEN FEDLEX-Kürzelliste (§5), kein Raten: das Kürzel IST das genannte
// Ziel. Verbraucher (restMitIntern) unterdrückt bei Treffer ≠ eigenem Erlass den
// falschen Self-Link (David-Entscheid 28.6.: «lieber kein Link als ein falscher»;
// das genaue Fremdgesetz-Routing bleibt eine eigene, verifizierte Datenaufgabe).
//
// Bounded: die Passus-Kette akzeptiert nur bekannte Zitat-Tokens + Werte (Zahl/
// Buchstabe/Bereich), läuft also NIE über Fliesstext oder ein zweites «Artikel»
// hinaus — «Artikel 6 Absatz 2 und die Bestimmungen des OR» matcht NICHT (nach
// «Absatz 2» folgt «und …», kein Gesetz-Kürzel) und bleibt ein Self-Link.
// Artikelnummer im Fliesstext. Suffix-Alternation ZUERST (bis|ter|…) VOR dem
// blossen Buchstaben — sonst frisst das greedy `[a-z]?` in einem UNGEANKERTEN
// Scan (matchAll) das «b» von «bis» und «266bis» zerfällt zu «266b» (die \b-
// Backtracking-Falle; ein `(?![0-9a-z])`-Anker wie in ART_INTERN würde sie zwar
// heilen, die alternationsbasierte Form ist aber auch ohne Anker korrekt und wird
// hier global gescannt).
// Z6 a (14.9.2026): die Suffix-Reihe steht in `nummer.ts` (§5, bis `duodecies`).
export const N2_ARTNR = '\\d+(?:' + SUFFIX_ALT + '|[a-z]' + SUFFIX_ALT + '?)?';
export const N2_PASSUS = '(?:Abs(?:atz|ätze|\\.)|Buchstaben?|Bst\\.|lit\\.|Ziff(?:ern?|\\.)|Satz|Sätze)';
export const N2_WERT = '(?:' + N2_ARTNR + '|[a-z]|[ivxl]+)';
export const N2_KONN = '(?:[–-]|und|oder|bis|,|sowie)';
const FREMDGESETZ_NACH_ARTIKEL = new RegExp(
  '^\\s+' +
    // weitere Artikelnummern im selben Verweis («1a oder 2 …», «25–31 …»)
    '(?:' + N2_KONN + '\\s*' + N2_ARTNR + '\\s*)*' +
    // Passus-Kette (Absatz/Buchstabe/Ziffer/Satz, aus- oder abgeschrieben) + Werte
    '(?:' + N2_PASSUS + '\\s+' + N2_WERT + '(?:\\s*' + N2_KONN + '\\s*' + N2_WERT + ')*\\s+)*' +
    // optionale Präposition vor dem Gesetzesnamen («des IVG», «der ZPO»)
    '(?:(?:des|der|über|vom)\\s+)?' +
    '(' + NORM_NAMEN_ESC.join('|') + ')\\b',
);

/**
 * Prüft, ob der Text UNMITTELBAR nach einem bare «Artikel N» eine Zitat-
 * Fortsetzung ist, die auf ein benanntes Bundesgesetz-Kürzel endet (aus- oder
 * abgeschrieben). Gibt das Kürzel zurück (Verweis auf JENES Gesetz) oder null.
 */
export function fremdgesetzNachArtikel(restNachArtikel: string): FedlexGesetz | null {
  const m = FREMDGESETZ_NACH_ARTIKEL.exec(restNachArtikel);
  return m ? erkenneFedlexGesetz(m[1]) : null;
}

// ─── N2b (Bündel N): AUSGESCHRIEBENER Fremdgesetz-Name mit Klammer-Kürzel ─────
//
// PROBLEM (Bug David 4.7.2026, AIG Art. 5 Abs. 1 lit. d): «… nach Artikel 66a
// oder 66abis des Strafgesetzbuchs (StGB) oder Artikel 49a oder 49abis des
// Militärstrafgesetzes vom 13. Juni 1927 (MStG) …». fremdgesetzNachArtikel (N2)
// erkennt das Fremdgesetz nur am KÜRZEL aus der NORM_NAMEN-Liste («… Buchstabe c
// AHVG»), NICHT an der ausgeschriebenen Genitiv-Form mit Klammer-Kürzel. Folge:
// «Artikel 49a» fiel auf den Self-Linker zurück und verlinkte ZUFÄLLIG AIG art_49_a
// (existiert), «Artikel 66a» blieb link-los (AIG hat kein art_66_a), die
// Aufzählungs-Glieder «66abis»/«49abis» nie verlinkt.
//
// FIX: Das DETERMINISTISCHE Signal ist das Klammer-Kürzel «(KÜRZEL)» mit
// KÜRZEL ∈ FEDLEX, unmittelbar hinter dem ausgeschriebenen Gesetzesnamen (Datums-
// Einschub «vom 13. Juni 1927» toleriert). KEIN Fuzzy-Matching ausgeschriebener
// Namen OHNE Klammer-Kürzel (§1: lieber kein Link als ein plausibel-falscher) —
// das Kürzel in der Klammer IST das genannte Ziel, kein Raten. Erkannt wird die
// GANZE «Artikel N [oder M …] des <Name> (KÜRZEL)»-Einheit; jede Artikelnummer
// (auch die Aufzählungs-Glieder) wird EINZELN auf das Fremdgesetz geroutet — analog
// zur Ketten-Propagierung (normVerweiseImText).
//
// Bewusste Grenze: die ABGEKÜRZTE Genitiv-Form OHNE Klammer («… des IVG») bleibt
// die Domäne von fremdgesetzNachArtikel (N2, Unterdrückung des Self-Links) — hier
// unverändert. N2b greift nur additiv bei vorhandenem Klammer-Kürzel.

// Ein Wort des ausgeschriebenen Gesetzesnamens: grossgeschriebenes Wort, Datums-
// Zahl («13.», «1927») oder amtliche Namens-Bindewörter (kleingeschrieben, aber
// Teil offizieller Titel: «über», «vom», «für» …). Der Name muss mit einem GROSS-
// geschriebenen Wort BEGINNEN und wird zwingend vom «(KÜRZEL)» abgeschlossen —
// ohne diese Klammer matcht die Einheit NICHT (deterministischer Anker).
const N2_NAME_WORT = '(?:[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\\-]*|\\d{1,4}\\.?|vom|von|über|und|der|die|das|des|für|zur|zum|im|in|zu|den|betreffend)';
const N2_NAME_RUN = '[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\\-]*(?:\\s+' + N2_NAME_WORT + '){0,14}';
// Datums-Einschub der Zitier-Konvention («vom 20. Dezember 1946», «vom 18. Dez. 1987»).
export const N2_DATUM = '\\d{1,2}\\.\\s*[A-Za-zÄÖÜäöü]+\\.?\\s+\\d{4}';
const FREMD_FORM_B = new RegExp(
  '^(\\s*)' +
    // 2: Aufzählungs-Schwanz (weitere Artikelnummern «oder 66abis», «25–31»)
    '((?:' + N2_KONN + '\\s*' + N2_ARTNR + '\\s*)*)' +
    // Passus-Kette (Absatz/Buchstabe/Ziffer/Satz) — Werte werden NICHT verlinkt
    '(?:' + N2_PASSUS + '\\s+' + N2_WERT + '(?:\\s*' + N2_KONN + '\\s*' + N2_WERT + ')*\\s+)*' +
    // Präposition + Gesetzes-Signal, zwei Formen:
    '(?:des|der|über|vom)\\s+(?:' +
      // 3: ausgeschriebener Name + Klammer-Kürzel (∈ FEDLEX) — die Klammer ist
      //    das autoritative Signal (auch ein UNBEKANNTES «(Code civil)» bindet
      //    hier und unterdrückt jeden Link, §1).
      N2_NAME_RUN + '\\s*\\((' + NORM_NAMEN_ESC.join('|') + ')\\)' +
      // 4: kuratierter Genitiv-Kurztitel OHNE Klammer («der Bundesverfassung»);
      //    greift NUR, wenn KEINE Klammer folgt (sonst gilt die Klammer, s. o.).
      '|(' + GENITIV_NAMEN_ESC.join('|') + ')\\b(?!\\s*\\()' +
      // 5/6 (V-7b, W2·20): amtlicher Volltitel «Bundesgesetzes/Verordnung [vom
      //    D. Monat JJJJ] über …» — Kopfwort + kuratiertes Titel-Fragment; ein
      //    Datums-Einschub ist Zitier-Konvention, kein Inhalt.
      '|(Bundesgesetzes|Verordnung)(?:\\s+vom\\s+' + N2_DATUM + ')?\\s+(' + TITEL_FRAGMENTE_ESC.join('|') + ')\\b' +
      // 7 (V-7c, W2·20): die NAMENLOSE Kurzform «des Gesetzes». Sie löst nur
      //    auf, wenn der gelesene Erlass ein Trägergesetz hat — also wenn sein
      //    Ingress «Gesetz» legaldefiniert (`TRAEGER_EINTRAEGE`). Ohne
      //    Trägergesetz bleibt die Stelle Text wie bisher (§1).
      //    Die Präposition ist hier immer «des»; «der/über/vom Gesetzes» ist
      //    keine deutsche Form und kommt im Korpus nicht vor.
      '|(Gesetzes)\\b' +
    ')',
);
const N2_ARTNR_RE = new RegExp(N2_ARTNR, 'g');
// V-7 (W2·20): Klammer NACH dem Namen bzw. nach einem Datums-Einschub («… des
// Datenschutzgesetzes vom 19. Februar 1986 (KDSG)»). Die Klammer ist das
// autoritative Signal: nennt sie ein ANDERES oder unbekanntes Kürzel, ist der
// Name nicht das gefundene Bundesgesetz → kein Link (§1; gemessener Falschlink
// BE-154.21 auf main 70002a287). Dasselbe Kürzel wird in die Region eingezogen.
export const KLAMMER_NACH_NAME = new RegExp('^\\s*(?:vom\\s+' + N2_DATUM + '\\s*)?\\(([^()]{1,40})\\)');
// ─── Fix-Runde 1 zu W2·20 (Gegenprüfung 1.9.2026): zwei Kanten desselben Lecks ─
//
// (a) PRÄFIX-BINDUNG. Das Titel-Fragment endete bloss mit `\b`. Ein LÄNGERER
//     amtlicher Titel, dessen Präfix in der Positivliste steht, band still auf
//     den kürzeren Erlass — belegter Falschlink vor dem Fix:
//     kanton/BS/132.100/art_4 «Art. 5 des Bundesgesetzes über die politischen
//     Rechte der Auslandschweizer vom 19. Dezember 1975» → BPR (SR 161.1);
//     gemeint ist das BPRAS (SR 161.5). Folgt hinter dem Fragment ein weiteres
//     TITELWORT (grossgeschrieben, ggf. hinter bis zu drei amtlichen Binde-
//     wörtern), ist der zitierte Erlass NICHT der gefundene → kein Link (§1).
//     Nicht als Fortsetzung zählen: Datums-Einschub («vom …» — «vom» steht
//     bewusst NICHT in der Bindewort-Liste), Klammer, Komma und Satzende.
//     ZWEI bewusste Grenzen (Messung 1.9.2026, 199 Fortsetzungs-Stellen im
//     Korpus — die Regel darf nur den Falschlink treffen, nicht den Bestand):
//     · Nur die VOLLTITEL-Form (Kopf + Fragment) ist ein Titel-PRÄFIX. Ein
//       Kurztitel-Genitiv («des Obligationenrechts über den Auftrag», «des
//       Strafgesetzbuches im Strafregister») ist bereits vollständig; was folgt,
//       ist ein thematischer Zusatz, kein längerer Titel — und ein gleichnamiger
//       Erlass wird dort schon von Geltung und Klammer-Nachprüfung abgefangen
//       (kein Vorfall, also kein zweiter Wächter — CLAUDE.md §17 Gegengewicht).
//     · Bestätigt das ZITIERTE Datum den Ziel-Erlass (Erlassdatum-Treffer), ist
//       der Erlass identifiziert; die Fortsetzung ist dann eine alte Titel-
//       fassung oder ein Zweck-Zusatz («… vom 20. Dezember 1946 über die Alters-
//       und Hinterlassenenversicherung für die Erfüllung ihrer Aufgaben»).
//       Im BS-Fall steht das Datum HINTER der Fortsetzung und wird darum nicht
//       als Bestätigung gelesen — und es widerspräche dem BPR ohnehin.
// (b) ZEIT-KANTE. Das Datum wurde gelesen und ungeprüft verworfen; siehe
//     `datumPasst` (positivliste.ts) für Belege und Quelle des Erlassdatums.
export const TITEL_FORTSETZUNG = new RegExp(
  '^\\s+(?:(?:der|die|das|des|dem|den|und|über|für|zur|zum|im|in|an|auf|von|betreffend|gegen|sowie)\\s+){0,3}[A-ZÄÖÜ]',
);
// Datums-Einschub INNERHALB der erkannten Einheit («Bundesgesetzes vom D über …»,
// «des Bundesgesetzes vom D über … (KÜRZEL)») bzw. unmittelbar dahinter
// («des Datenschutzgesetzes vom D», «… über die politischen Rechte vom D»).
export const DATUM_IN_EINHEIT = new RegExp('\\bvom\\s+(' + N2_DATUM + ')');
export const DATUM_NACH_NAME = new RegExp('^\\s*vom\\s+(' + N2_DATUM + ')');
/** Woran das Fremdgesetz erkannt wurde (Mess-Klassen im V-1-Tor). */
export type FremdSignal = 'klammer' | 'genitiv' | 'titel' | 'traeger';

/** Ein auf ein Fremdgesetz geroutetes Aufzählungs-Glied. */
export interface FremdRoutingGlied {
  /** true = erstes Glied; Anzeige = «Artikel N» aus dem Aufrufer-Kontext (m[0]),
   *  Offsets sind dann −1 (nicht im `rest`-Text). */
  erst: boolean;
  /** rohe Artikelnummer («66a», «66abis») — Anzeige der Aufzählungs-Glieder. */
  roh: string;
  /** Start-/End-Offset im `rest`-Text (erst: −1). */
  start: number;
  end: number;
  /** Auflösbarer Verweis-Text mit Kürzel, z. B. «Art. 66abis StGB». */
  artikel: string;
  /** false ⇒ als reiner Text darstellen (Ziel-Token existiert nicht → kein Link). */
  linkbar: boolean;
}

/**
 * Erkennt UNMITTELBAR nach einem bare «Artikel N» die ausgeschriebene Fremdgesetz-
 * Form mit Klammer-Kürzel und routet JEDE genannte Artikelnummer (die erste +
 * alle Aufzählungs-Glieder) auf das Fremdgesetz. Rein deterministisch (§2): das
 * Kürzel stammt aus der FEDLEX-Liste, die Token-Ableitung aus artikelToken.
 *
 * @param rest        Text NACH «Artikel N» (beginnt i. d. R. mit Whitespace).
 * @param ersteNummer die Nummer des vorangehenden «Artikel N» (m[1]), z. B. «66a».
 * @param zielTokenExistiert optionales Prädikat: existiert das Ziel-Token im
 *        Fremd-Erlass? Fehlt es (false), wird das Glied NICHT verlinkt (§1, nie
 *        raten). Ohne Prädikat linken alle erkannten Glieder (Fedlex-Deep-Link /
 *        In-Reader-Popover über NormChip — die etablierte Fremdverweis-Darstellung).
 * @param ebene Ebene des LESENDEN Erlasses (V-7): in kantonalen Erlassen lösen
 *        nur ebenenübergreifend eindeutige Namen auf (`positivliste.ts`).
 *        Default `bund` = das Verhalten der Bund-Leser; kantonale Aufrufer
 *        (NormText, Inventar-Tor) reichen `kanton` durch.
 * @param erlassKey Register-Key des GELESENEN Erlasses (V-7c): nur damit löst
 *        die namenlose Kurzform «des Gesetzes» auf das Trägergesetz auf
 *        (`TRAEGER_EINTRAEGE`). Fehlt er, bleibt die Stelle Text (§1).
 * @returns {gesetz, glieder, regionEnd, signal} oder null (kein Signal).
 *          `regionEnd` = Offset in `rest` hinter dem «(KÜRZEL)» bzw. hinter dem
 *          Namen/Titel (Aufrufer setzt den Cursor hinter die ganze Einheit).
 */
export function fremdRoutingFormB(
  rest: string,
  ersteNummer: string,
  zielTokenExistiert?: (gesetz: FedlexGesetz, token: string) => boolean,
  ebene: FremdEbene = 'bund',
  erlassKey?: string,
): { gesetz: FedlexGesetz; glieder: FremdRoutingGlied[]; regionEnd: number; signal: FremdSignal } | null {
  const m = FREMD_FORM_B.exec(rest);
  if (!m) return null;
  // m[3] = Klammer-Kürzel (∈ FEDLEX), m[4] = kuratierter Genitiv-Kurztitel,
  // m[5]+m[6] = Kopfwort + amtliches Titel-Fragment (V-7b), m[7] = namenlose
  // Kurzform «des Gesetzes» (V-7c — Ziel ist das Trägergesetz des LESENDEN
  // Erlasses, darum hängt sie an `erlassKey`, nicht am Zitat-Text).
  const signal: FremdSignal = m[3] ? 'klammer' : m[4] ? 'genitiv' : m[7] ? 'traeger' : 'titel';
  const gesetz = m[3] ? erkenneFedlexGesetz(m[3])
    : m[4] ? erkenneGenitivGesetz(m[4], ebene)
    : m[7] ? traegergesetzFuerErlass(erlassKey)
    : erkenneTitelGesetz(m[5], m[6], ebene);
  if (!gesetz) return null; // Kein auflösbares Signal → kein Link (§1)
  // Fix-Runde 1 (a): der Name endet hier — folgt ein weiteres Titelwort, meint
  // der Text einen LÄNGEREN Erlass-Titel (BS-132.100 art_4 → BPRAS, nicht BPR).
  const nachName = rest.slice(m[0].length);
  // Fix-Runde 1 (b): zitiertes Datum muss das Erlassdatum des Ziels sein.
  const datum = DATUM_IN_EINHEIT.exec(m[0])?.[1] ?? DATUM_NACH_NAME.exec(nachName)?.[1] ?? null;
  if (!datumPasst(gesetz, datum)) return null;
  // GP-Nachzug PR #635: «… KAG in der Fassung vom 28. September 2012» zielt auf
  // eine aufgehobene Fassung — Beleg und Abgrenzung an `historischeFassung`.
  if (historischeFassung(nachName)) return null;
  if (signal === 'titel' && !datum && TITEL_FORTSETZUNG.test(nachName)) return null;
  let regionEnd = m[0].length;
  if (signal !== 'klammer') {
    const k = KLAMMER_NACH_NAME.exec(rest.slice(regionEnd));
    if (k) {
      if (erkenneFedlexGesetz(k[1]) !== gesetz) return null; // fremde/unbekannte Klammer (§1)
      regionEnd += k[0].length;
    }
  }
  const linkbar = (roh: string): boolean =>
    zielTokenExistiert ? zielTokenExistiert(gesetz, artikelToken(roh)) : true;
  const gliedFuer = (erst: boolean, roh: string, start: number, end: number): FremdRoutingGlied => ({
    erst, roh, start, end, artikel: `Art. ${roh} ${gesetz}`, linkbar: linkbar(roh),
  });
  const glieder: FremdRoutingGlied[] = [gliedFuer(true, ersteNummer, -1, -1)];
  // Aufzählungs-Glieder aus dem Schwanz (Gruppe 2) — mit Offset im `rest`-Text.
  const schwanz = m[2];
  const schwanzStart = m[1].length; // führender Whitespace (Gruppe 1)
  for (const am of schwanz.matchAll(N2_ARTNR_RE)) {
    const start = schwanzStart + am.index;
    glieder.push(gliedFuer(false, am[0], start, start + am[0].length));
  }
  return { gesetz, glieder, regionEnd, signal };
}

// ─── A10 (Bug David 5.7.2026, MWSTG Art. 5): PLURAL-Aufzählung «in den Artikeln
//     N, M … und K» ────────────────────────────────────────────────────────────
//
// PROBLEM: MWSTG art_5 = «… die Anpassung der in den Artikeln 31 Absatz 2
// Buchstabe c, 35 Absatz 1bis Buchstabe b, 37 Absatz 1, 38 Absatz 1 und 45 Absatz
// 2 Buchstabe b genannten Frankenbeträge …». Der bare Inline-Linker matcht nur das
// SINGULAR «Artikel N» (ART_INTERN) — die Dativ-Plural-Form «Artikeln» + die
// Aufzählungsglieder blieben allesamt link-los (0 Links, obwohl alle 5 Ziele
// Self-Artikel sind).
//
// FIX: Diese reine, deterministische Funktion (§2) erkennt die Plural-Öffner
// «Artikeln» / «die|der Artikel» und zerlegt die anschliessende Aufzählung in ihre
// einzelnen Artikel-Glieder. Sie löst NICHT selbst auf (das braucht den Erlass-
// Kontext), sondern liefert je Region:
//   · `glieder`  — die einzelnen Artikelnummern mit Offset (Anzeige = Quelltext);
//   · `fremd`    — endet die Aufzählung auf ein auflösbares Gesetz-Signal
//                  («… des StGB», «… (ZGB)», «… der Bundesverfassung»), zeigen ALLE
//                  Glieder auf JENES Gesetz;
//   · `unterdruecken` — endet sie auf einen NICHT auflösbaren Fremdnamen
//                  («… des Bundesgesetzes über …»), wird NICHT verlinkt (§1, nie
//                  ein geratener Self-Link auf ein fremdes Gesetz);
//   · sonst (kein Gesetz-Signal, «… genannten Frankenbeträge») ⇒ Self (der Aufrufer
//     verlinkt jedes Glied, dessen Token im eigenen Erlass existiert).
//
// §1-Vorsicht (bounded, nie über den Fliesstext hinaus): ein Glied-Kopf ist nur
// eine Zahl, die am Aufzählungs-Anfang steht ODER einem Konnektor folgt; die
// Passus-Kette konsumiert typ-treue Werte (Buchstabe→Buchstaben, Absatz/Ziffer/
// Satz→Zahlen) und gibt eine Zahl frei, sobald ihr ein Passus-Wort folgt (= nächster
// Glied-Kopf). Die Kette bricht an allem, was kein «Konnektor + Zahl» ist.

/** Ein Glied einer Plural-Aufzählung (Offsets in den übergebenen Gesamttext). */
interface PluralGlied {
  /** rohe Artikelnummer («31», «45», «66abis»). */
  roh: string;
  start: number;
  end: number;
}

/** Eine erkannte «Artikeln …»-Region mit Auflösungs-Modus. */
export interface PluralRegion {
  /** Start-Offset des ÖFFNERS («Artikeln» / «die Artikel») — für Überlapp-Schutz
   *  gegen den Singular-Linker (ART_INTERN matcht «Artikel 22» im Öffner). */
  oeffnerStart: number;
  /** Start-Offset des ersten Glieds im Gesamttext. */
  start: number;
  /** End-Offset der ganzen Einheit (hinter dem Gesetz-Signal, falls vorhanden). */
  end: number;
  glieder: PluralGlied[];
  /** Aufgelöstes Fremdgesetz (alle Glieder zeigen dorthin) oder null (Self/Unterdr.). */
  fremd: FedlexGesetz | null;
  /** true ⇒ NICHT verlinken (unauflösbarer Fremdname am Ende, §1). */
  unterdruecken: boolean;
}

// Öffner: die unzweideutige Dativ-Plural-Form «Artikeln» (immer), sowie «die|der
// Artikel» (nur wenn ≥2 Glieder ODER ein Gesetz-Signal folgen — sonst überlässt
// die Region das einzelne «Artikel N» dem bewährten Singular-Pfad).
const PLURAL_OEFFNER = /\b(Artikeln|(?:die|der)\s+Artikel)\s+(?=\d)/g;
// Glied-Nummer mit Wort-Ende-Anker: ein Suffix ausserhalb der bekannten Liste
// («42octies») darf NICHT als «42o» an-gematcht werden — dann lieber gar kein
// Glied (die Region wird unten §1-unterdrückt), nie ein falsches Ziel.
const P_ARTNR_RE = new RegExp(`^${N2_ARTNR}(?![0-9a-zäöü])`);
// Passus-Schlüsselwörter, getrennt nach Wert-Typ (Zahl vs. Buchstabe) UND nach
// Numerus: die SINGULAR-Form («Absatz 2») nimmt nach amtlicher Drafting-Konvention
// genau EINEN Wert — eine folgende Zahl ist der nächste Glied-Kopf («… 31 Absatz 2,
// 34 und 114 der Bundesverfassung» = Artikel 34/114, nicht Absätze). Nur die
// PLURAL-Form («Absätze 1 und 2») und die numerus-ambigen Abkürzungen (Abs./Ziff.)
// nehmen eine Wertliste — dort schützt der (?!\s+KW)-Guard den nächsten Glied-Kopf.
const P_KW_NUM_SG = '(?:Absatz|Ziffer|Satz)';
const P_KW_NUM_PL = '(?:Absätze|Ziffern|Sätze|Abs\\.|Ziff\\.)';
const P_KW_LET_SG = '(?:Buchstabe)';
const P_KW_LET_PL = '(?:Buchstaben|Bst\\.|lit\\.)';
const P_KW_ANY = '(?:Abs(?:atz|ätze|\\.)|Ziff(?:ern?|\\.)|Sätze|Satz|Buchstaben?|Bst\\.|lit\\.)';
// Werte MIT Wort-Ende-Anker: ohne ihn degradiert «38» im Backtracking zu «3»
// (der (?!\s+KW)-Guard weist «38 Absatz» ab, die Engine kürzt dann den \d+-Match) —
// ein voll geankertes «38» kann nicht partiell matchen, der Guard bricht sauber ab.
const P_NUM = '\\d+' + SUFFIX_ALT + '?(?![0-9a-zäöü])';
const P_LET = '[a-z]' + SUFFIX_ALT + '?(?![0-9a-zäöü])';
const P_KONN = '(?:,|und|oder|sowie|bis|[–-])';
const PASSUS_GRUPPE_RE = new RegExp(
  '^\\s+(?:' +
    P_KW_NUM_PL + '\\s+' + P_NUM + '(?:\\s*' + P_KONN + '\\s*' + P_NUM + '(?!\\s+' + P_KW_ANY + '))*' +
    '|' + P_KW_NUM_SG + '\\s+' + P_NUM +
    '|' + P_KW_LET_PL + '\\s+' + P_LET + '(?:\\s*' + P_KONN + '\\s*' + P_LET + ')*' +
    '|' + P_KW_LET_SG + '\\s+' + P_LET +
  ')',
);
// Konnektor zwischen zwei Gliedern, gefolgt von einer Zahl (nächster Glied-Kopf).
const P_KONN_ZAHL_RE = new RegExp('^\\s*' + P_KONN + '\\s*(?=\\d)');
// Gesetz-Signal am Ende der Aufzählung. g1 = Klammer-Kürzel (∈ FEDLEX, autoritativ),
// g2 = kuratierter Genitiv-Kurztitel (nur ohne folgende Klammer), g3 = bare Kürzel
// (∈ FEDLEX, mit/ohne «des/der»), g5+g6 = Kopfwort + amtliches Titel-Fragment
// (V-7b; Klammer-Nachprüfung wie in fremdRoutingFormB).
const P_SIGNAL_RE = new RegExp(
  '^\\s*(?:' +
    '(?:(?:des|der|über|vom)\\s+' + N2_NAME_RUN + '\\s*)?\\((' + NORM_NAMEN_ESC.join('|') + ')\\)' +
    '|(?:des|der|über|vom)\\s+(' + GENITIV_NAMEN_ESC.join('|') + ')\\b(?!\\s*\\()' +
    '|(?:des|der|über|vom)\\s+(' + NORM_NAMEN_ESC.join('|') + ')\\b' +
    '|(' + NORM_NAMEN_ESC.join('|') + ')\\b' +
    '|(?:des|der)\\s+(Bundesgesetzes|Verordnung)(?:\\s+vom\\s+' + N2_DATUM + ')?\\s+(' + TITEL_FRAGMENTE_ESC.join('|') + ')\\b' +
    // g7 (V-7c): namenlose Kurzform «des Gesetzes» am Aufzählungs-Ende — löst
    // nur über das Trägergesetz des GELESENEN Erlasses auf (s. Singular-Pfad).
    '|(?:des)\\s+(Gesetzes)\\b' +
  ')',
);
// Unauflösbarer Fremdname am Aufzählungs-Ende («des Bundesgesetzes über …», «der
// Verordnung …») → §1-Unterdrückung (kein geratener Self-Link).
const P_FREMD_UNAUFL_RE = /^\s*(?:des|der|über|vom)\s+[A-ZÄÖÜ]/;
// Unbekanntes bare KÜRZEL direkt nach der Aufzählung («… Artikeln 2 und 3 BGSA»,
// BGSA ∉ FEDLEX): Fremdgesetz-Signal, das wir nicht auflösen können → §1-
// Unterdrückung, nie ein falscher Self-Link (Korpus-Fund AHVV art 34; dieselbe
// Muster-Regel wie M12 im Singular-Linker: ≥2 Grossbuchstaben oder Binnen-
// Grossbuchstabe). Gewöhnliche grossgeschriebene Substantive («… Beiträge»)
// matchen NICHT (nur EIN führender Grossbuchstabe).
const P_FREMD_KUERZEL_RE = /^\s*(?:[A-ZÄÖÜ]{2,}|[A-ZÄÖÜ][a-zäöü]*[A-ZÄÖÜ]\w*)/;

// Erkennt, ob die NÄCHSTE Passus-Gruppe mit einem PLURAL-Zahl-Schlüsselwort
// («Absätze/Ziffern/Sätze/Abs./Ziff.») beginnt — die Alternation in
// PASSUS_GRUPPE_RE probiert die Plural-Branch zuerst, der Präfix-Test ist also
// äquivalent zur Frage «hat die Plural-Branch gematcht».
const P_KW_NUM_PL_RE = new RegExp('^\\s+' + P_KW_NUM_PL);
// B1 (Gegenprüfungs-Befund 10.7.2026): Fortsetzungs-Wert einer UNTERBROCHENEN
// Plural-Wertliste — «und|oder N» OHNE folgendes Passus-Wort.
const P_PLURAL_FORTSATZ_RE = new RegExp('^\\s*(?:und|oder)\\s+' + P_NUM + '(?!\\s+' + P_KW_ANY + ')');

function konsumierePassusKette(text: string, pos: number): { pos: number; pluralNum: boolean } {
  let pluralNum = false;
  for (;;) {
    const rest = text.slice(pos);
    const m = PASSUS_GRUPPE_RE.exec(rest);
    if (!m) return { pos, pluralNum };
    if (P_KW_NUM_PL_RE.test(rest)) pluralNum = true;
    pos += m[0].length;
  }
}

/**
 * Alle Plural-Aufzählungs-Regionen eines Fliesstexts (A10). Rein/deterministisch
 * (§2). Regionen sind nach `start` sortiert und überschneidungsfrei.
 */
export function artikelnPluralVerweise(
  text: string, ebene: FremdEbene = 'bund', erlassKey?: string,
): PluralRegion[] {
  const regionen: PluralRegion[] = [];
  let grenze = -1; // Ende der zuletzt akzeptierten Region (Überschneidungs-Schutz)
  for (const oeff of text.matchAll(PLURAL_OEFFNER)) {
    const start = oeff.index + oeff[0].length; // erstes Glied (Lookahead \d)
    if (start < grenze) continue;
    const istArtikeln = oeff[1] === 'Artikeln';
    // Glieder konsumieren.
    const glieder: PluralGlied[] = [];
    let pos = start;
    for (;;) {
      const am = P_ARTNR_RE.exec(text.slice(pos));
      if (!am) break;
      glieder.push({ roh: am[0], start: pos, end: pos + am[0].length });
      pos += am[0].length;
      const kette = konsumierePassusKette(text, pos);
      pos = kette.pos;
      // B1 (Gegenprüfungs-Befund 10.7.2026, BETMG 8a/FAV 44a/FinfraV 129): nach
      // einer PLURAL-«Absätze/Ziffern»-Gruppe gehört ein «und|oder N» OHNE
      // folgendes Passus-Wort weiter zur WERTLISTE — auch wenn eine «Buchstabe»-
      // Gruppe dazwischen lag: «Artikeln 8 Absätze 1 Buchstabe d und 5, 11» =
      // Art. 8 (Abs. 1 lit. d und Abs. 5), dann Art. 11. Ohne diese Regel würde
      // «5» als Artikel-Glied verlinkt (Falsch-Ziel). Komma/sowie/Bereich bleiben
      // Glied-Konnektoren (§1-sichere Seite: Under-Link statt Falsch-Link).
      while (kette.pluralNum) {
        const vm = P_PLURAL_FORTSATZ_RE.exec(text.slice(pos));
        if (!vm) break;
        pos += vm[0].length;
        const k2 = konsumierePassusKette(text, pos);
        pos = k2.pos;
      }
      const cm = P_KONN_ZAHL_RE.exec(text.slice(pos));
      if (!cm) break;
      pos += cm[0].length;
    }
    if (glieder.length === 0) continue;
    // Gesetz-Signal am Ende.
    const rest = text.slice(pos);
    const sm = P_SIGNAL_RE.exec(rest);
    let fremd: FedlexGesetz | null = null;
    let unterdruecken = false;
    let end = pos;
    if (sm) {
      const kuerzel = sm[1] ?? sm[3] ?? sm[4];
      fremd = sm[2] ? erkenneGenitivGesetz(sm[2], ebene)
        : kuerzel ? erkenneFedlexGesetz(kuerzel)
        : sm[5] ? erkenneTitelGesetz(sm[5], sm[6], ebene)
        : sm[7] ? traegergesetzFuerErlass(erlassKey) : null;
      // V-7: Klammer nach Name/Titel (auch hinter einem Datum) muss DASSELBE
      // Gesetz nennen — sonst ist der Name nicht das gefundene Bundesgesetz (§1).
      const nachSignal = rest.slice(sm[0].length);
      if (fremd && !sm[1]) {
        const k = KLAMMER_NACH_NAME.exec(nachSignal);
        if (k && erkenneFedlexGesetz(k[1]) !== fremd) fremd = null;
      }
      // Fix-Runde 1 (b) Zeit-Kante + (a) Titel-Ende — Regeln wie im Singular-Pfad.
      if (fremd) {
        const datum = DATUM_IN_EINHEIT.exec(sm[0])?.[1] ?? DATUM_NACH_NAME.exec(nachSignal)?.[1] ?? null;
        if (!datumPasst(fremd, datum)) fremd = null;
        // GP-Nachzug PR #635: bestimmte VERGANGENE Fassung → kein Link (§7/§8).
        else if (historischeFassung(nachSignal)) fremd = null;
        else if (sm[5] && !datum && TITEL_FORTSETZUNG.test(nachSignal)) fremd = null;
      }
      if (fremd) end = pos + sm[0].length;
      else unterdruecken = true; // Klammer-Kürzel ∉ FEDLEX / Name nicht auflösbar → nie ein Falsch-Ziel (§1)
    } else if (P_FREMD_UNAUFL_RE.test(rest) || P_FREMD_KUERZEL_RE.test(rest) || /^\d/.test(rest)) {
      // «des <unbekannter Fremdname>», ein unbekanntes bare KÜRZEL («… BGSA»)
      // ODER eine abgebrochene Aufzählung (nächstes Zeichen ist eine Zahl = ein
      // nicht parsebares Glied wie «42octies») — das Ziel ist nicht sicher
      // bestimmbar → kein Link (§1).
      unterdruecken = true;
    }
    // «die|der Artikel»-Öffner nur bei echter Aufzählung ODER Gesetz-Signal
    // übernehmen — ein einzelnes «Artikel N» bleibt sonst dem Singular-Pfad.
    if (!istArtikeln && glieder.length < 2 && !fremd && !unterdruecken) continue;
    regionen.push({ oeffnerStart: oeff.index, start, end, glieder, fremd, unterdruecken });
    grenze = end;
  }
  return regionen;
}
