// ─── Fedlex · Achse 5: Verweis-Spannen im Fliesstext ───
//
// Die SPANNEN-Schicht über dem Parser (Achse 4): sie sagt, WELCHE Textstellen
// als Verweis verlinkt werden — die von NORM_IM_TEXT gefundenen Anker, die per
// «i.V.m.»-Kette propagierten bare Glieder (Ketten-Regel) und die BLOSSEN
// Erlass-Verweise ohne Artikelnummer (Z1). Gerichtete Kette ohne Zyklus:
// tabelle ← url ← erkennung ← parser ← spannen.
//
// WARUM EIGENES MODUL (§6.6, 2.9.2026): mit dem Z1-Block riss `parser.ts` die
// 800-Zeilen-Schwelle (815 Z.). Geschnitten wurde entlang der bestehenden
// Achsen-Fuge, nicht quer durch eine Regel: `parser.ts` hält die ZITATFORMEN
// (was ein Verweis IST — Regex-Grammatik, Form B, Plural-Regionen), dieses
// Modul die SPANNEN-BILDUNG (welche Stelle den Link bekommt). Die
// Zitat-Bausteine kommen als Import aus dem Parser — keine zweite Wahrheit
// über die Zitier-Grammatik (§5).

import { type FedlexGesetz } from './tabelle';
import { SUFFIX_ALT } from './nummer';
import {
  erkenneFedlexGesetz,
  erkenneGenitivGesetz,
  erkenneTitelGesetz,
  fedlexLinkFuerArtikel,
  GENITIV_NAMEN_ESC,
  GENITIV_NAMEN_HART,
  TITEL_FRAGMENTE_ESC,
  TITEL_FRAGMENTE_HART,
} from './erkennung';
import {
  datumPasst, historischeFassung, KUERZEL_NUR_BUND, zusatzwortSperre, type FremdEbene,
} from './positivliste';
import {
  artikelnPluralVerweise,
  fremdRoutingFormB,
  DATUM_IN_EINHEIT,
  DATUM_NACH_NAME,
  KLAMMER_NACH_NAME,
  N2_ARTNR,
  N2_DATUM,
  N2_KONN,
  N2_PASSUS,
  N2_WERT,
  NORM_IM_TEXT,
  NORM_NAMEN,
  NORM_NAMEN_ESC,
  TITEL_FORTSETZUNG,
} from './parser';

// ─── Ketten-Verweise: «Art. A i.V.m. Art. B GESETZ» ──────────────────────────
//
// PROBLEM (Referenz BGE 151 III 377, Auftrag David 3.7.2026): In einer
// Verweis-Kette trägt nur das LETZTE Glied das Gesetzeskürzel («Art. 684 i.V.m.
// Art. 679 ZGB»). NORM_IM_TEXT findet nur dieses letzte, voll zitierte Glied;
// die vorangehenden bare «Art. N» blieben unverlinkt, obwohl sie DASSELBE
// Gesetz meinen (juristische Drafting-Konvention: das Kürzel am Ketten-Ende gilt
// für alle Glieder).
//
// FIX: Das Kürzel des Ketten-Endes wird auf die vorangehenden bare Glieder
// PROPAGIERT und jedes Glied einzeln verlinkt. §1-Vorsicht (lieber ein Glied
// unverlinkt als falsch verlinkt):
//   · Propagiert wird NUR über echte Ketten-Konnektoren (i.V.m. / in Verbindung
//     mit / und / sowie / Komma) und nur auf BARE «Art. N»-Glieder OHNE eigenes
//     Kürzel. Trägt ein Glied ein EIGENES Kürzel («Art. 5 OR und Art. 6 ZGB»),
//     ist es ein separates Zitat und wird NICHT umgehängt.
//   · Die Kette bricht an allem, was kein Konnektor+Glied ist: Semikolon,
//     BGE-/Urteil-Zitate, Satzgrenzen, Präpositionen («der Verordnung»),
//     fremdes Kürzel dazwischen.
//   · «f./ff.» und Abs./lit./Ziff.-Zusätze brechen die Kette NICHT (Teil des
//     Glieds).
// Die Anzeige bleibt zeichenidentisch (§1): das Glied zeigt genau seinen
// Quelltext, nur das AUFLÖSUNGS-Ziel erhält das propagierte Kürzel.

/** Ein aufgelöster Norm-Verweis im Fliesstext (Anker ODER propagiertes Ketten-Glied). */
export interface NormVerweisSpan {
  /** Start-Offset im Quelltext. */
  start: number;
  /** End-Offset im Quelltext (exklusiv). */
  end: number;
  /** Anzeigetext = exakter Quelltext-Ausschnitt (zeichenidentisch, §1). */
  anzeige: string;
  /** Auflösbarer Verweis-Text (mit Kürzel), z. B. 'Art. 684 ZGB' — Ziel der Auflösung. */
  artikel: string;
  /** true = Kürzel aus dem Ketten-Ende propagiert (nicht im Quelltext des Glieds). */
  propagiert: boolean;
  /** Z1 (W2·22): true = BLOSSER Erlass-Verweis OHNE Artikelnummer. `artikel`
   *  trägt dann nur das FEDLEX-Kürzel und löst auf die Erlass-Seite ohne Anker
   *  auf; `anzeige` ist der Erlassname aus dem Quelltext. Eigenes Feld, nicht
   *  aus `anzeige !== artikel` abgeleitet: Renderer UND Mess-Tor sollen die
   *  Form am Namen erkennen, nicht an einer Zeichenketten-Nebenwirkung. */
  erlass?: boolean;
  /** Z5 (W2·22): true = AUSGESCHRIEBENER Artikelverweis («Artikel 29 Absatz 1
   *  ATSG»). `anzeige` ist die Artikel-Nennung aus dem Quelltext, `artikel` das
   *  synthetisierte «Art. N KÜRZEL»; Passus-Kette und Kürzel bleiben Text.
   *  Eigenes Feld aus demselben Grund wie `erlass` — die Formklasse des
   *  Mess-Tors (`anker-ausgeschrieben`) hängt an ihm. */
  ausgeschrieben?: boolean;
}

// Ketten-Glied (bare «Art. N [Abs./lit./Ziff./Satz …] [f./ff.]») OHNE Kürzel.
const KETTE_ART = 'Art\\.\\s*\\d+[a-z]?' + SUFFIX_ALT + '?';
const KETTE_PASSUS =
  '(?:\\s+(?:Abs\\.|lit\\.|Bst\\.|Ziff\\.|Ziffer|Satz)\\s*(?:\\d+[a-z]?' + SUFFIX_ALT + '?|[a-z]))*';
const KETTE_FOLGE = '(?:\\s+ff?\\.)?';
const KETTE_GLIED = `${KETTE_ART}${KETTE_PASSUS}${KETTE_FOLGE}`;
// Ketten-Konnektoren (NICHT Semikolon — der bricht die Kette bewusst).
const KETTE_KONNEKTOR = '(?:i\\.\\s?V\\.\\s?m\\.|in Verbindung mit|und|sowie|,)';
// Ein bare Glied UNMITTELBAR vor dem Anker: «GLIED <KONNEKTOR>» am Text-Ende.
const GLIED_VOR_KONNEKTOR = new RegExp(`(${KETTE_GLIED})\\s*(?:${KETTE_KONNEKTOR})\\s*$`);

/**
 * Alle auflösbaren Bund-Norm-Verweise eines Fliesstexts — die von NORM_IM_TEXT
 * gefundenen voll zitierten Anker PLUS die per Ketten-Regel propagierten bare
 * Glieder. Reine, deterministische Funktion (§2): EINE Wahrheit der Ketten-Regel
 * für Renderer (NormText) und Fundstellen-Suche (Rechtsprechung).
 *
 * Die zurückgegebenen Spans sind nach `start` sortiert und überschneidungsfrei.
 * Für Nicht-Ketten-Text ist die Anker-Menge identisch zu `matchAll(NORM_IM_TEXT)`
 * (gleicher Filter `fedlexLinkFuerArtikel != null`) — additiv, kein Verhalt-Bruch.
 */
export function normVerweiseImText(
  text: string,
  eigenesKuerzel?: string,
  ebene: FremdEbene = 'bund',
): NormVerweisSpan[] {
  const spans: NormVerweisSpan[] = [];
  for (const m of text.matchAll(NORM_IM_TEXT)) {
    const roh = m[0];
    // Nur verlinken, was der eine Resolver wirklich auflöst (kein toter Link, §8).
    if (fedlexLinkFuerArtikel(roh) == null) continue;
    const start = m.index;
    // GP-Nachzug PR #635: die beiden Guards gehören AUCH auf den voll zitierten
    // Anker, nicht nur auf Z5 — die abgekürzte Zitatform «Art. 11 Abs. 3 AVO
    // Inland» (kanton/BS/419.902 art_11, kanton/BS/419.905 art_2) trifft
    // NORM_IM_TEXT direkt und wurde von der Z5-Sperre gar nicht erreicht
    // (gemessen 2.9.2026 im Vorher/Nachher-Dump aller Link-Pfade). Belege und
    // Abgrenzung stehen an den Guards (positivliste.ts).
    const nachAnker = text.slice(start + roh.length);
    if (zusatzwortSperre(nachAnker)) continue;   // anderer Erlass (§1)
    if (historischeFassung(nachAnker)) continue; // historische Fassung (§7/§8)
    // W2·18-FEHLERBUCH-Nachzug (12.9.2026): DIESELBE Lücke wie oben, aber für
    // KUERZEL_NUR_BUND statt der beiden GP-#635-Guards — der Guard lebte bis
    // hierher NUR in `ausgeschriebeneVerweiseImText` (Z5, Kürzel MIT Passus wie
    // «Art. 98 Abs. 2 lit. a und b StG»); die KÜRZESTE Zitatform ohne Passus
    // («Art. 9 BMV») trifft aber NORM_IM_TEXT direkt und lief an Z5 vorbei,
    // also auch am Guard. Belegt an kanton/SG/3849 art_7: «Prüfung und
    // Genehmigung von Projekten für private Schutzräume (Art. 9 BMV; …)» meint
    // die (nicht im Korpus geführte) eidgenössische Schutzbautenverordnung vom
    // 27.11.1978 — verlinkt wurde SR 412.103.1, die Berufsmaturitätsverordnung
    // (Register-Key `BMV` = cc/2009/423, per 1.3.2026 aufgehoben; geltend
    // `BMV_2025` = cc/2025/408). Kürzel-Erkennung VOR dem Push, damit der
    // Guard den Anker selbst noch stoppt (Beleg und Aufnahme-Regel bei
    // `KUERZEL_NUR_BUND`, positivliste.ts).
    const kuerzelAmAnker = erkenneFedlexGesetz(roh);
    if (ebene === 'kanton' && kuerzelAmAnker && KUERZEL_NUR_BUND.has(kuerzelAmAnker)) continue;
    spans.push({ start, end: start + roh.length, anzeige: roh, artikel: roh, propagiert: false });
    // Kürzel des Anker-Endes → auf vorangehende bare Glieder propagieren.
    const kuerzel = kuerzelAmAnker;
    if (!kuerzel) continue;
    let grenze = start;
    for (;;) {
      const mm = GLIED_VOR_KONNEKTOR.exec(text.slice(0, grenze));
      if (!mm) break;
      const gliedStart = mm.index;
      const gliedText = mm[1];
      // Synthese: Glied-Text + propagiertes Kürzel = auflösbarer Verweis. Die
      // Anzeige bleibt der reine Glied-Text (zeichenidentisch, §1).
      spans.push({
        start: gliedStart,
        end: gliedStart + gliedText.length,
        anzeige: gliedText,
        artikel: `${gliedText} ${kuerzel}`,
        propagiert: true,
      });
      grenze = gliedStart;
    }
  }
  // Z5 (W2·22): AUSGESCHRIEBENE Artikelverweise («Artikel 29 Absatz 1 ATSG»),
  // rein ADDITIV. Der voll zitierte Anker (NORM_IM_TEXT) und die propagierten
  // Ketten-Glieder haben Vorrang — sie decken dieselbe Stelle bereits ab und
  // verlinken die GANZE Zitat-Einheit statt nur die Artikel-Nennung.
  const ankerSpans = [...spans];
  for (const a of ausgeschriebeneVerweiseImText(text, eigenesKuerzel, ebene)) {
    if (ankerSpans.some((s) => a.start < s.end && s.start < a.end)) continue;
    spans.push(a);
  }
  // Z1 (W2·22): BLOSSE Erlass-Verweise ohne Artikelnummer — rein ADDITIV. Ein
  // Artikel-Anker (oder ein propagiertes Ketten-Glied) hat IMMER Vorrang: er
  // nennt die konkrete Bestimmung, die Erlass-Spanne nur den Erlass. Diese
  // Vorrang-Prüfung steht VOR der allgemeinen Bereinigung unten, weil dort der
  // frühere Start gewinnt — hier gewinnt der Artikel, gleich wo er beginnt (§1).
  const artikelSpans = [...spans];
  for (const e of erlassVerweiseImText(text, eigenesKuerzel)) {
    if (artikelSpans.some((a) => e.start < a.end && a.start < e.end)) continue;
    spans.push(e);
  }
  // Sortieren + defensiv überschneidungsfrei halten (Anker/Glieder aus mehreren
  // matchAll-Runden). Bei einer (theoretischen) Überschneidung gewinnt der frühere
  // Span; überlappende werden verworfen — nie doppelt oder verschachtelt verlinken.
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const rein: NormVerweisSpan[] = [];
  let letztesEnde = -1;
  for (const s of spans) {
    if (s.start < letztesEnde) continue;
    rein.push(s);
    letztesEnde = s.end;
  }
  return rein;
}

// ─── Z1 (W2·22-VERWEIS-FEDLEX): Erlass-Verweis OHNE Artikelnummer ────────────
//
// LÜCKE (amtlich belegt, Abgleich gegen die jolux:Citation-Kanten des OR in
// Fedlex, Stand 2026-01-01): Bis hierher verlinkte der Erkenner einen
// Bundeserlass NUR, wenn eine Artikelnummer davorstand — «Art. N KÜRZEL»
// (NORM_IM_TEXT) oder «Artikel N … des <Erlassname>» (Form B / Plural-Region).
// Der BLOSSE Erlass-Verweis blieb Text, obwohl die Positivliste den Namen
// kennt. Gemessene Beispiele, wörtlich aus public/normtext/bund/OR.json:
//   · art_328_b «… die Bestimmungen des Datenschutzgesetzes vom 25. September 2020.»
//   · art_193   «… richten sich nach der ZPO.»
//   · art_97    «… des Bundesgesetzes vom 11. April 1889 über Schuldbetreibung
//                und Konkurs sowie der Zivilprozessordnung vom 19. Dezember 2008 (ZPO)»
//   · art_622   «… im Sinne des Bucheffektengesetzes vom 3. Oktober 2008 (BEG)»
//
// ZIEL ist die ERLASS-Ebene, nicht ein Artikel: `artikel` trägt bloss das
// FEDLEX-Kürzel, und `fedlexLinkFuerArtikel` liefert dafür die Erlass-URL ohne
// Anker (dieselbe Ableitung wie beim SchlT-Fall, §5). Der Renderer zeigt
// unverändert den Quelltext (`anzeige`), verlinkt also zeichenidentisch.
//
// DREI ERKENNUNGS-FORMEN, jede mit eigener Eindeutigkeits-Bedingung (§1: kein
// Link ist besser als ein falscher). Die Regeln sind STRENGER als bei Form B,
// weil hier keine Artikelnummer das Zitat als Norm-Verweis ausweist:
//   (a) AMTLICHER VOLLTITEL «Bundesgesetzes [vom D. Monat JJJJ] über …» —
//       Kopfwort + kuratiertes Titel-Fragment (positivliste.ts). NUR der Kopf
//       `Bundesgesetzes` (titelGeltung 'alle'): ein Kanton erlässt kein
//       Bundesgesetz. Der Kopf `Verordnung` ist generisch und bleibt hier
//       AUSSEN vor — ohne Artikelnummer fehlt jedes zweite Signal.
//   (b) KURZTITEL-GENITIV aus der Positivliste («des Bucheffektengesetzes»).
//       Ebenenübergreifend eindeutige Namen (geltung 'alle') lösen direkt auf;
//       Namen mit geltung 'bund' (ein gleichnamiger kantonaler Erlass ist
//       belegt — Falschlink BE-154.21 «Datenschutzgesetz») NUR MIT
//       bestätigendem Erlassdatum im Text. Das Datum identifiziert den Erlass
//       auch ohne Ebenen-Kontext: das kantonale Datenschutzgesetz trägt ein
//       anderes (BE: 19. Februar 1986). Darum braucht diese Funktion — anders
//       als fremdRoutingFormB — keinen `ebene`-Parameter; sie ist in Bund- und
//       Kantonserlassen gleich streng.
//   (c) ALLEINSTEHENDES KÜRZEL aus KUERZEL_TOKENS («nach der ZPO») NUR hinter
//       einem Kontext-Wort der Verweisungssprache (Z1_KONTEXT). Ein nacktes
//       Kürzel im Fliesstext bleibt Text — «OR» ist auch ein gewöhnliches
//       Zeichenpaar, und ohne Kontext ist es kein Verweis.
//
// VIER NACHPRÜFUNGEN, wörtlich dieselben wie in fremdRoutingFormB (§5):
//   · Erlassdatum (`datumPasst`): ein zitiertes Datum, das nicht zum Ziel
//     passt, meint einen anderen — meist aufgehobenen — Erlass ⇒ kein Link.
//   · Klammer-Kürzel hinter dem Namen: nennt es ein anderes/unbekanntes
//     Gesetz, ist der Name nicht das gefundene Bundesgesetz ⇒ kein Link.
//   · Titel-Fortsetzung (Präfix-Bindung, Fix-Runde 1 zu W2·20): folgt hinter
//     dem Fragment ein weiteres Titelwort und bestätigt kein Datum den Erlass,
//     ist ein LÄNGERER Titel gemeint (BPRAS statt BPR) ⇒ kein Link.
//   · Selbstmarker: «dieses Gesetzes», «des vorliegenden Gesetzes» tragen
//     keinen Erlassnamen und stehen darum in keiner der drei Tabellen — sie
//     können hier gar nicht auflösen (Negativ-Test hält das fest).
//
// ABGRENZUNG zu Form B und Plural-Region (die Artikel-Pfade bleiben zuständig,
// sonst entstünde ein zweiter Link auf dieselbe Stelle ODER — schlimmer — die
// Erlass-Spanne schnitte die «Artikel N …»-Einheit auseinander und der bare
// Artikel fiele auf den Self-Linker zurück, §1):
//   · RÜCKWÄRTS-GUARD Z1_VOR_ARTIKEL — steht unmittelbar vor der Nennung ein
//     Artikel-/Paragrafen-Zitat (mit Aufzählung, Passus-Kette, «f./ff.» und
//     optionaler Präposition), ist Form B zuständig ⇒ keine Erlass-Spanne.
//     Aus DENSELBEN Bausteinen gebaut wie FREMD_FORM_B (N2_ARTNR/N2_KONN/
//     N2_PASSUS/N2_WERT), also dessen Spiegelbild, nicht eine zweite Wahrheit.
//   · PLURAL-GUARD — Nennungen innerhalb einer `artikelnPluralVerweise`-Region
//     gehören dieser Region (A10). Die Regionen werden nur berechnet, wenn es
//     überhaupt einen Kandidaten gibt (§15: kein zweiter Voll-Scan pro Text).

/** Kontext-Wörter der Verweisungssprache vor einem ALLEINSTEHENDEN Kürzel. */
const Z1_KONTEXT = '(?:'
  + '(?:Bestimmungen|Bestimmung|Vorschriften|Vorschrift|Regelungen|Regelung)\\s+(?:des|der)'
  + '|(?:nach|gemäss|gemäß)\\s+(?:dem|der|des|den)'
  + '|im\\s+Sinne\\s+(?:des|der)'
  + '|nach\\s+Massgabe\\s+(?:des|der)'
  + '|in\\s+Anwendung\\s+(?:des|der)'
  + ')';
// 1 = Kopfwort · 2 = Titel-Fragment · 3 = Kurztitel-Genitiv · 4 = blosses Kürzel.
// Der Abschluss-Lookahead trennt Kürzel und Namen sauber vom Wortinneren
// («BEGleitschreiben», «OR-konform») — Identität mit Wortgrenze (§7/§0.2).
const Z1_BAU = (titel: readonly string[], genitiv: readonly string[]): RegExp => new RegExp(
  '(?:'
    + '\\b(Bundesgesetzes)(?:\\s+vom\\s+' + N2_DATUM + ')?\\s+(' + titel.join('|') + ')'
    + '|\\b(' + genitiv.join('|') + ')'
    + '|' + Z1_KONTEXT + '\\s+(' + NORM_NAMEN_ESC.join('|') + ')'
  + ')(?![-0-9A-Za-zÀ-ÿ­])',
  'g',
);
/** @internal Nur für den Gleichheits-Nachweis exportiert (`spannen-weichtrenn.test.ts`). */
export const Z1_ERLASS = Z1_BAU(TITEL_FRAGMENTE_ESC, GENITIV_NAMEN_ESC);
// ═══ SCHNELLPFAD (W2·24-PERF, 6.9.2026) — GLEICHES ERGEBNIS, EIN FÜNFTEL KOSTEN
//
// Z1_ERLASS toleriert zwischen JE ZWEI Buchstaben eines Namens einen WEICHEN
// TRENNSTRICH (U+00AD, `escSoft` in erkennung.ts) — Fedlex-HTML trägt ihn in
// langen Wörtern. Der Preis dafür ist die Alternation: 86 Genitiv-Namen und 113
// Titel-Fragmente werden mit je einem optionalen Zeichen zwischen allen
// Buchstaben zu einem Muster von 20 992 Zeichen, das `matchAll` an JEDER
// Position eines Fliesstexts durchprobiert.
//
// GEMESSEN (OR-Snapshot, 18 957 Texte / 1 077 491 Zeichen, node, ungedrosselt):
//   Z1 mit Weichtrenn-Toleranz  1503 ms   ·   ohne  310 ms   (Faktor 4.8)
//   `erlassVerweiseImText` trug damit 988 ms der 1169 ms von
//   `normVerweiseImText` — unter CPU×4 der Löwenanteil des Long Tasks, der die
//   Leserseite blockiert (Messreihe: abnahme/design-identitaet/PERF-LESER.md).
//
// WARUM DAS KEINE REGEL ÄNDERT (§1/§6, kein Logikverlust): `X­?Y` und `XY`
// matchen auf einem Text OHNE U+00AD zeichengenau dieselben Stellen — ein
// optionales Zeichen, das im Eingabetext nirgends vorkommt, kann nur die leere
// Alternative nehmen. Die Fallunterscheidung ist darum keine Heuristik, sondern
// eine Identität; das harte Muster läuft NUR auf Texten ohne Weichtrennstrich,
// jeder Text MIT Weichtrennstrich geht unverändert durch Z1_ERLASS.
// Nachgewiesen wird die Identität nicht bloss behauptet: `spannen-weichtrenn.
// test.ts` fährt beide Muster über einen Bund- und einen Kanton-Snapshot und
// vergleicht Offsets, Treffertext und Gruppen; die volle Korpus-Runde (1 566
// Erlasse, 0 Divergenzen — und 0 Texte MIT Weichtrennstrich) steht in
// PERF-LESER.md. Die Rot-Probe dort zeigt, dass die Fallunterscheidung trägt.
/** @internal Nur für den Gleichheits-Nachweis exportiert (s. o.). */
export const Z1_ERLASS_HART = Z1_BAU(TITEL_FRAGMENTE_HART, GENITIV_NAMEN_HART);
const WEICHTRENN = '­';
// Spiegelbild der FREMD_FORM_B-Grammatik, rückwärts gelesen: «Art./Artikel/§ N
// [, M und K] [Passus W …] [f./ff.] [des|der|…]» unmittelbar vor der Nennung.
const Z1_VOR_ARTIKEL = new RegExp(
  '(?:Art\\.|Artikeln?|§§?)\\s*' + N2_ARTNR
    + '(?:\\s*' + N2_KONN + '\\s*' + N2_ARTNR + ')*'
    + '(?:\\s+' + N2_PASSUS + '\\s+' + N2_WERT + '(?:\\s*' + N2_KONN + '\\s*' + N2_WERT + ')*)*'
    + '(?:\\s+ff?\\.)?'
    + '(?:\\s+(?:des|der|dem|den|über|vom))?\\s*$',
);
/** Rückschau-Fenster des Guards: ein Artikel-Zitat mit Aufzählung und
 *  Passus-Kette bleibt weit darunter; die Grenze hält den Scan linear (§15). */
const Z1_RUECKSCHAU = 240;

/**
 * Ist der Klammer-Inhalt WIRKLICH das Kürzel des genannten Erlasses?
 *
 * `erkenneFedlexGesetz` akzeptiert jedes Zitat, das AUF ein Kürzel endet — ein
 * führendes Wort stört dort nicht («Art. 5 StGB»). Hinter einem Erlassnamen ist
 * genau das aber ein anderes Signal: «(EG StPO)», «(EG zum ZGB)» nennen das
 * kantonale EINFÜHRUNGSGESETZ, nicht den Bundeserlass — der äussere Name ist
 * dort bloss das Ende eines längeren kantonalen Titels («des Gesetzes über die
 * Einführung der Schweizerischen Strafprozessordnung»). Belegte Falschlinks der
 * Rot-Runde: BS-154.125 §5, BS-154.980 §1, BS-258.210 §4, BS-510.100 §31,
 * BS-212.400 §27, AI-640.000 Art. 179, AR-143.1 Art. 64, AR-741.1 Art. 33,
 * BE-215.326.2 Art. 22 (9 Stellen).
 *
 * Zulässig ist darum nur: (a) der amtliche Appositiv «Titel, KÜRZEL» /
 * «Titel; KÜRZEL» bzw. das nackte Kürzel — der Teil hinter dem letzten Komma
 * muss EIN Eintrag der Kürzelliste sein (Mehrwort-Kürzel «GebV SchKG»
 * eingeschlossen, §5: dieselbe Liste wie der Fliesstext-Scan); (b) ein
 * ARTIKEL-Zitat desselben Erlasses («(Art. 620 ff. OR)», «(Art. 79 Abs. 2 und
 * 80 VVG)») — die Klammer verweist dann auf Bestimmungen des GEFUNDENEN
 * Erlasses und bestätigt ihn; jene Artikel verlinkt NORM_IM_TEXT ohnehin
 * einzeln (6 Stellen, alle geprüft).
 */
function klammerIstKuerzel(inhalt: string): boolean {
  const rest = (inhalt.split(/[,;]/).pop() ?? '').trim();
  // `\s` statt `\b`: hinter «Art.» steht kein Wortzeichen, eine Wortgrenze
  // gibt es dort also nicht — mit `\b` wäre der Artikel-Zweig tot gewesen.
  return /^Art(?:\.|ikel)\s/.test(rest) || NORM_NAMEN.includes(rest);
}

/** Identitäts-Normalisierung eines Kürzels für den SELF-Vergleich. Bewusst
 *  eigenständig neben `kuerzelKanon` (NormText.tsx): dort fallen Umlaute weg
 *  ([^A-Z0-9]), womit «BüV» zu «BV» würde — zwei verschiedene Erlasse. Für den
 *  Self-Ausschluss eines ERLASS-Verweises wäre das ein still verlorener,
 *  richtiger Link (gemessen: bund/BUEV/art_5 → BV). Hier bleiben Umlaute
 *  darum erhalten, wie in `KANON` (erkennung.ts); Trennzeichen fallen weg,
 *  damit Register-Schlüssel («FINFRAV_FINMA») und FEDLEX-Key («FinfraV-FINMA»)
 *  denselben Erlass bezeichnen. §1: lieber ein Duplikat als eine Abstraktion,
 *  die zwei verschiedene Identitäts-Begriffe stillschweigend gleichsetzt. */
const Z1_IDENT = (s: string): string => s.toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g, '');

/**
 * Alle BLOSSEN Erlass-Verweise eines Fliesstexts (Z1) — Verweise auf einen
 * Bundeserlass OHNE Artikelnummer. Rein und deterministisch (§2), Spannen nach
 * `start` sortiert und überschneidungsfrei. `artikel` ist das FEDLEX-Kürzel
 * (Auflösung auf die Erlass-Seite), `anzeige` der unveränderte Quelltext.
 *
 * @param eigenesKuerzel Register-Schlüssel des GELESENEN Erlasses (letztes
 *        Segment des Lese-Basispfads). Nennt der Text diesen Erlass selbst
 *        («Die Bundesverfassung kann jederzeit … revidiert werden» in der BV),
 *        ist es kein Fremdverweis — ein Chip führte den Leser aus der geltenden
 *        Fassung heraus nach Fedlex, ohne etwas hinzuzufügen. Gemessen
 *        2.9.2026 über den ganzen Korpus: 26 Stellen, alle in der BV. Ohne
 *        Argument (Rechner-/Vorlagentexte, Rechtsprechung) gibt es keinen
 *        gelesenen Erlass — dort ist jeder Verweis fremd.
 */
export function erlassVerweiseImText(text: string, eigenesKuerzel?: string): NormVerweisSpan[] {
  const spans: NormVerweisSpan[] = [];
  let pluralRegionen: ReturnType<typeof artikelnPluralVerweise> | null = null;
  // Schnellpfad: Text ohne Weichtrennstrich → das harte Muster (identisch, s. o.).
  for (const m of text.matchAll(text.includes(WEICHTRENN) ? Z1_ERLASS : Z1_ERLASS_HART)) {
    const end = m.index + m[0].length;
    // Form (c): verlinkt wird NUR das Kürzel, nicht das Kontext-Wort davor.
    const start = m[4] ? end - m[4].length : m.index;
    // Abgrenzung 1: unmittelbar vorangehendes Artikel-/Paragrafen-Zitat.
    if (Z1_VOR_ARTIKEL.test(text.slice(Math.max(0, m.index - Z1_RUECKSCHAU), m.index))) continue;
    // Abgrenzung 2: Plural-Region (A10) — sie bringt ihre eigenen Glieder mit.
    pluralRegionen ??= artikelnPluralVerweise(text);
    if (pluralRegionen.some((r) => start < r.end && r.oeffnerStart < end)) continue;
    // Auflösung je Form + Eindeutigkeits-Bedingung.
    let gesetz: FedlexGesetz | null;
    let nurMitDatum = false;
    if (m[1]) {
      gesetz = erkenneTitelGesetz(m[1], m[2], 'kanton'); // nur Geltung 'alle'
    } else if (m[3]) {
      const eindeutig = erkenneGenitivGesetz(m[3], 'kanton'); // nur Geltung 'alle'
      gesetz = eindeutig ?? erkenneGenitivGesetz(m[3], 'bund');
      nurMitDatum = !eindeutig && gesetz != null;
    } else {
      gesetz = erkenneFedlexGesetz(m[4]);
    }
    if (!gesetz) continue;
    const nach = text.slice(end);
    const klammer = KLAMMER_NACH_NAME.exec(nach);
    if (klammer) {
      if (erkenneFedlexGesetz(klammer[1]) !== gesetz) continue; // fremde/unbekannte Klammer
      if (!klammerIstKuerzel(klammer[1])) continue;             // Klammer nennt einen ANDEREN Erlass
    }
    // Das Erlassdatum steht an DREI Stellen der Zitier-Konvention: im Titel
    // («Bundesgesetzes vom D über …»), direkt hinter dem Namen («des DSG vom D»)
    // ODER hinter dem Klammer-Kürzel («des Bundesgesetzes über den Datenschutz
    // (DSG) vom 19. Juni 1992»). Die dritte Stelle fehlte zuerst — belegter
    // Falschlink der Rot-Runde: BS-215.700 §8 und BS-952.820 §6 zitieren das
    // AUFGEHOBENE aDSG von 1992 und landeten auf dem DSG von 2020 (§1).
    const datum = DATUM_IN_EINHEIT.exec(m[0])?.[1]
      ?? DATUM_NACH_NAME.exec(nach)?.[1]
      ?? (klammer ? DATUM_NACH_NAME.exec(nach.slice(klammer[0].length))?.[1] : null)
      ?? null;
    if (!datumPasst(gesetz, datum)) continue;      // Zeit-Kante (V-5)
    if (nurMitDatum && !datum) continue;           // gleichnamiger Kantonserlass möglich
    if (m[1] && !datum && TITEL_FORTSETZUNG.test(nach)) continue;        // Präfix-Bindung
    if (eigenesKuerzel && Z1_IDENT(gesetz) === Z1_IDENT(eigenesKuerzel)) continue; // Self
    spans.push({ start, end, anzeige: text.slice(start, end), artikel: gesetz, propagiert: false, erlass: true });
  }
  return spans;
}

// ─── Z5 (W2·22-VERWEIS-FEDLEX): AUSGESCHRIEBENER Artikelverweis mit Kürzel ───
//
// LÜCKE (amtlich belegt, Zitatgraph-Bericht `messwerte/zitatgraph-warnungen.md`
// aus den jolux:Citation-Kanten von Fedlex, Stand 2026-01-01): 824 der 3703
// vergleichbaren Kanten (22.3 %) fielen in die Klasse A — der Normtext nennt
// das Ziel-Kürzel AUSGESCHRIEBEN («Artikel 29 Absatz 1 ATSG», IVG art_10),
// `fremdgesetzNachArtikel` (N2 Form A, `parser.ts`) ERKENNT es, und der
// Kontrakt bis hierher war blosse UNTERDRÜCKUNG des falschen Self-Links
// («lieber kein Link als ein falscher», David-Entscheid 28.6.2026; der
// Kommentar dort sagt ausdrücklich, das aktive Routing sei zurückgestellt).
// Z5 löst die Zurückstellung ein: dasselbe erkannte Kürzel IST das Ziel.
//
// GRAMMATIK — dieselben Bausteine wie FREMDGESETZ_NACH_ARTIKEL (N2_ARTNR /
// N2_KONN / N2_PASSUS / N2_WERT aus `parser.ts`), keine zweite Wahrheit über
// die Zitierform (§5). Erfasst «Art./Artikel N[a][bis…] [, M und K]
// [Absatz|Absätze|Buchstabe|Ziffer|Satz W …] [des|der|über|vom] KÜRZEL»:
//   · Der Anker ist zeichengleich zu ART_INTERN (NormText.tsx) — genau die
//     Stellen, an denen heute unterdrückt wird.
//   · JEDE genannte Artikelnummer wird EINZELN geroutet (wie fremdRoutingFormB
//     und die A10-Region): «Artikel 66a oder 66abis StGB» ⇒ zwei Links.
//   · Ziel-Anker ist der ARTIKEL (`art_N`); Absatz/Buchstabe/Ziffer und das
//     Kürzel selbst bleiben reiner Text — die etablierte Fremdverweis-
//     Darstellung der Form B.
//
// FÜNF NACHPRÜFUNGEN (§1: kein Link ist besser als ein falscher):
//   · KÜRZEL-IDENTITÄT: nur Tokens aus NORM_NAMEN (FEDLEX-Keys + amtliche
//     Schreibweisen), mit Wortgrenze — «ORganisation» ist kein OR-Verweis.
//   · SELF-AUSSCHLUSS wie in Z1: nennt der Verweis den GELESENEN Erlass, ist er
//     kein Fremdverweis; die Stelle bleibt dem bewährten Self-Pfad in
//     `restMitIntern` (In-Reader-Sprung, nur bei existierendem Token).
//   · FORM B hat Vorrang: trägt die Stelle ein Klammer-Kürzel, einen
//     Kurztitel-Genitiv oder einen amtlichen Volltitel, ist `fremdRoutingFormB`
//     zuständig (dort mit Ebenen-Geltung und Präfix-Bindung) — Z5 tritt zurück,
//     sonst entstünden zwei Links auf dieselbe Einheit.
//   · PLURAL-REGION (A10) bringt ihre eigenen Glieder mit — Nennungen innerhalb
//     einer Region gehören ihr (derselbe Guard wie in `erlassVerweiseImText`;
//     die Regionen werden nur bei vorhandenem Kandidaten berechnet, §15).
//   · ZEIT-KANTE (`datumPasst`): ein zitiertes Erlassdatum, das nicht zum Ziel
//     passt, meint einen anderen — meist aufgehobenen — Erlass («Artikel 5 DSG
//     vom 19. Juni 1992» ist das aDSG, nicht das DSG von 2020).
//   · EBENEN-EINDEUTIGKEIT: in einem KANTONALEN Erlass verlinkt ein Kürzel
//     nicht, das dort üblicherweise einen eigenen Erlass bezeichnet
//     (`KUERZEL_NUR_BUND`, positivliste.ts — zwei gemessene Falschlinks «StG»).
// Zusätzlich filtert `fedlexLinkFuerArtikel` wie beim voll zitierten Anker:
// verlinkt wird nur, was der EINE Resolver wirklich auflöst (kein toter Link).
//
// ZWEI BEWUSSTE GRENZEN, beide gemessen (2.9.2026, ganzer Snapshot-Korpus):
//   · Artikelnummern mit Suffix jenseits von bis/ter/quater/quinquies/sexies
//     («Artikel 29septies AHVG», IVG art_11a) bleiben unverlinkt. Die Grenze
//     sitzt NICHT hier, sondern in der geteilten Nummern-Grammatik: ART_INTERN,
//     N2_ARTNR, `artikelToken` (SUFFIX) und `fedlexLinkFuerArtikel` kennen die
//     höheren Suffixe alle nicht — ein hier erzwungener Treffer ergäbe den
//     falschen Anker «#art_29septies» statt «#art_29_septies». Korpus-Bestand:
//     5 Stellen mit septies/octies-Nummer, davon EINE in Z5-Form. Der Wurzel-Fix
//     ist ein eigener Schritt an der Nummern-Grammatik, kein Sonderweg hier
//     (§17: Workaround nur mit hinterlegtem Wurzel-Fix).
//     ERLEDIGT 14.9.2026 (Z6 a): der Wurzel-Fix ist gebaut — die Reihe steht
//     jetzt EINMAL in `nummer.ts` (bis/…/duodecies) und wird von allen vier
//     Konsumenten gelesen; KETTE_ART hier eingeschlossen. Der Befund oben
//     beschreibt den Stand VOR dem Fix und bleibt als solcher stehen. Die
//     Grenze ist damit nicht weg, nur verschoben: was der Korpus nicht führt
//     (terdecies …), bleibt unverlinkt — gemessen, nicht geraten (§7).
//   · Keine Ketten-Propagierung: «Art. 5 i.V.m. Artikel 6 OR» verlinkt das
//     ausgeschriebene Glied, nicht das vorangehende bare. Die Ketten-Regel
//     hängt an NORM_IM_TEXT und bleibt unberührt (rein additiv, §6).

/** Anker: zeichengleich zu ART_INTERN (`NormText.tsx`) — «Art. N» / «Artikel N»
 *  mit Wort-Ende-Anker, damit «29septies» nicht zu «29s» zerfällt. Die
 *  Nummern-Alternation kommt aus N2_ARTNR (§5), die negative Nachschau hält die
 *  bekannte Backtracking-Falle geschlossen (Herleitung in `parser.ts`). */
const Z5_ANKER = new RegExp('\\bArt(?:\\.|ikel)\\s+(' + N2_ARTNR + ')(?![0-9a-zäöü])', 'g');
/** Schwanz UNMITTELBAR nach dem Anker — Spiegelbild von FREMDGESETZ_NACH_ARTIKEL
 *  (parser.ts), nur mit Gruppen für die Offsets der Aufzählungs-Glieder:
 *  1 = führender Whitespace · 2 = Aufzählungs-Schwanz · 3 = Kürzel. */
const Z5_SCHWANZ = new RegExp(
  '^(\\s+)'
    + '((?:' + N2_KONN + '\\s*' + N2_ARTNR + '\\s*)*)'
    + '(?:' + N2_PASSUS + '\\s+' + N2_WERT + '(?:\\s*' + N2_KONN + '\\s*' + N2_WERT + ')*\\s+)*'
    + '(?:(?:des|der|über|vom)\\s+)?'
    + '(' + NORM_NAMEN_ESC.join('|') + ')\\b',
);
const Z5_ARTNR_RE = new RegExp(N2_ARTNR, 'g');

/**
 * Alle AUSGESCHRIEBENEN Artikelverweise eines Fliesstexts (Z5) — «Art./Artikel
 * N … KÜRZEL» mit benanntem Fremderlass. Rein und deterministisch (§2), Spannen
 * nach `start` sortiert und überschneidungsfrei. `anzeige` ist der unveränderte
 * Quelltext-Ausschnitt der Artikel-Nennung, `artikel` das synthetisierte
 * «Art. N KÜRZEL» (Auflösung über denselben Resolver wie jeder andere Anker).
 *
 * @param eigenesKuerzel Register-Schlüssel des GELESENEN Erlasses (letztes
 *        Segment des Lese-Basispfads) — nennt der Verweis diesen Erlass selbst,
 *        ist er kein Fremdverweis und bleibt dem Self-Pfad (Herleitung oben).
 * @param ebene Ebene des LESENDEN Erlasses (wie in `fremdRoutingFormB`):
 *        `kanton` sperrt die Kürzel aus `KUERZEL_NUR_BUND` und wird an die
 *        beiden Abgrenzungs-Aufrufe (`fremdRoutingFormB`,
 *        `artikelnPluralVerweise`) DURCHGEREICHT — sie standen bis zum
 *        GP-Nachzug (PR #635) hart auf `bund`, während der Renderer die echte
 *        Ebene führt (NormText.tsx). Gemessen: keine Klasse ändert sich, die
 *        Divergenz zum Inventar bleibt 0 — der Fix schliesst die Bauchlandung,
 *        bevor ein Genitiv-/Titel-Signal mit kantonaler Geltung sie auslöst (§5).
 */
export function ausgeschriebeneVerweiseImText(
  text: string,
  eigenesKuerzel?: string,
  ebene: FremdEbene = 'bund',
): NormVerweisSpan[] {
  const spans: NormVerweisSpan[] = [];
  let pluralRegionen: ReturnType<typeof artikelnPluralVerweise> | null = null;
  let grenze = -1; // Ende der zuletzt akzeptierten Einheit (Überschneidungs-Schutz)
  for (const m of text.matchAll(Z5_ANKER)) {
    const start = m.index;
    if (start < grenze) continue;
    const nachAnker = start + m[0].length;
    const sm = Z5_SCHWANZ.exec(text.slice(nachAnker));
    if (!sm) continue;
    const gesetz = erkenneFedlexGesetz(sm[3]);
    if (!gesetz) continue;
    if (eigenesKuerzel && Z1_IDENT(gesetz) === Z1_IDENT(eigenesKuerzel)) continue; // Self
    // Kürzel, das im Kantonsrecht einen ANDEREN Erlass bezeichnet («StG») —
    // Belege und Aufnahme-Regel an `KUERZEL_NUR_BUND` (positivliste.ts).
    if (ebene === 'kanton' && KUERZEL_NUR_BUND.has(gesetz)) continue;
    const rest = text.slice(nachAnker);
    if (fremdRoutingFormB(rest, m[1], undefined, ebene)) continue; // Form B ist zuständig
    const einheitEnde = nachAnker + sm[0].length;
    // GP-Nachzug PR #635: «AVO Inland» ist nicht die eidg. AVO, und «KAG in der
    // Fassung vom …» meint eine aufgehobene Fassung — Belege an beiden Guards.
    const nachEinheit = text.slice(einheitEnde);
    if (zusatzwortSperre(nachEinheit)) continue;   // anderer Erlass (§1)
    if (historischeFassung(nachEinheit)) continue; // historische Fassung (§7/§8)
    pluralRegionen ??= artikelnPluralVerweise(text, ebene);
    if (pluralRegionen.some((r) => start < r.end && r.oeffnerStart < einheitEnde)) continue;
    const datum = DATUM_IN_EINHEIT.exec(sm[0])?.[1]
      ?? DATUM_NACH_NAME.exec(text.slice(einheitEnde))?.[1]
      ?? null;
    if (!datumPasst(gesetz, datum)) continue; // Zeit-Kante (V-5)
    // Erstes Glied = die Anker-Nennung; die Aufzählungs-Glieder aus dem Schwanz
    // (Gruppe 2) mit ihrem Offset im Quelltext — wie in `fremdRoutingFormB`.
    const glieder: { roh: string; start: number; end: number }[] = [
      { roh: m[1], start, end: nachAnker },
    ];
    const schwanzStart = nachAnker + sm[1].length;
    for (const am of sm[2].matchAll(Z5_ARTNR_RE)) {
      const s2 = schwanzStart + am.index;
      glieder.push({ roh: am[0], start: s2, end: s2 + am[0].length });
    }
    for (const g of glieder) {
      const artikel = `Art. ${g.roh} ${gesetz}`;
      if (fedlexLinkFuerArtikel(artikel) == null) continue; // kein toter Link (§8)
      spans.push({
        start: g.start, end: g.end, anzeige: text.slice(g.start, g.end),
        artikel, propagiert: false, ausgeschrieben: true,
      });
    }
    grenze = einheitEnde;
  }
  return spans;
}
