// ─── Deterministische Mappings für die Rechtsprechungs-Pipeline (§2) ─────────
//
// Keine Heuristik im Produktpfad, keine LLM-Zuordnung: alle Tabellen sind
// DEKLARIERT oder aus einer deklarierten Quelle ABGELEITET.
//
// QUELLE der Norm-Zuordnung (Stand W2·6-NKEY a+d, ehrlich benannt — §8):
// `statutes[]` (Roh-Drittextraktion OCL, NICHT verifiziert) ∪ deterministische
// FLIESSTEXT-Erkennung (`extrahiereStatutRefs` über Regeste + alle Abschnitts-
// Blöcke). Beide Zweige sind maschinell → der Status bleibt 'maschinell', nie
// als geprüftes Präjudiz verkauft (§7/§8).
//
// Die Fliesstext-Erkennung ist bewusst VOLLSTÄNDIG und damit auch beiläufig:
// erfasst wird jede Nennung im Urteilstext, einschliesslich rein prozessualer
// Standard-Zitate — das BGG erscheint dadurch in rund 85 % der Snapshots, ohne
// dass der Entscheid in der Sache etwas zum BGG sagt. Das ist der ausdrückliche
// Dekret-Stand (David, 27.7.2026): erst vollständig erkennen, dann über Ranking
// und Deckel kuratieren (LEITFAELLE_PRO_ARTIKEL, proNorm-Top-12) — nie durch
// stilles Verwerfen an der Extraktion, weil ein verworfenes Zitat nirgends mehr
// sichtbar ist und die Lücke niemand bemerkt (§8/§6.7).
//
// ── EINE REGEL FÜR BEIDE EBENEN: DER ZITIER-APPARAT ZÄHLT NICHT ──────────────
// (Gegenprüfung R3, Entscheid Orchestrator 28.7.2026 — Rückbau der Schwelle)
//
// Zwischenzeitlich stand hier eine HÄUFIGKEITS-SCHWELLE auf der Artikel-Ebene
// (statutes ODER Regeste ODER ≥2 Nennungen im Fliesstext, Commit 5e8b49c0). Sie
// ist WIDERLEGT und vollständig zurückgebaut. Der Beleg stammt aus der Messung,
// die sie selbst mitbrachte: in einer GLEICHVERTEILTEN Stichprobe der von ihr
// verworfenen (Snapshot, Artikel)-Paare waren rund die HÄLFTE echt angewendete
// Normen — ATSG/17 (revisionsrechtliche Grundsätze), ZPO/138 (Zustellfiktion,
// fristentragend), OR/30 (Furchterregung), STPO/428, EMRK/6. Eine Regel, die
// echte Rechtsanwendung löscht, um eine schmale Phantom-Klasse zu treffen,
// verletzt §1; Häufigkeit ist kein Signal für Tragfähigkeit.
//
// An ihre Stelle tritt eine GEZIELTE, deklarierte LITERATUR-KONTEXT-REGEL
// (`ohneLiteraturApparat`): nicht WIE OFT eine Norm genannt wird entscheidet,
// sondern WO. Nennungen innerhalb einer Zitier-Apparat-Spanne (Kommentar-Titel,
// Randnummer-Fundstelle, fr/it «ad art.») sind Angaben ÜBER Literatur, nicht
// Rechtsanwendung des Gerichts. Sie werden vor der Extraktion aus dem Text
// genommen — auf BEIDEN Ebenen gleich, weil ein Literaturnachweis auch keine
// Erlass-Nennung des Gerichts ist. Damit bleibt der Dekret-Stand «erst
// vollständig erkennen» unangetastet: jede erkannte Nennung im Erwägungstext
// zählt wieder, ohne Schwelle, ohne Korroboration.
//
// ── W2·6-NKEY (Roadmap, Dekret David 27.7.2026) ──────────────────────────────
// Die Abkürzungs-Tabelle war eine HAND-Whitelist mit 26 Einträgen — sie kannte
// z.B. IPRG nicht, obwohl der Erlass im Register steht und BGE 152 III 137 ihn
// 68-mal nennt. Ein Erlass, der im Katalog geführt wird, muss in der Verzahnung
// auch auffindbar sein. Die Tabelle wird darum aus dem ERLASS_REGISTER
// ABGELEITET (§5: eine Quelle je Fachinhalt — das Register ist sie), mit zwei
// Kandidaten je Eintrag: der Anzeige-Abkürzung (`kuerzel`, z.B. 'SchKG',
// 'BVV 2') und dem dateisicheren `key` (z.B. 'SCHKG', 'BVV_2'), beide über
// `normalisiereAbk` normalisiert.
//
// ── W2·6-NKEY Baustein b: die Alias-Ebene ────────────────────────────────────
// Die Register-Ableitung kennt nur das DEUTSCHE Anzeige-Kürzel. Ein Entscheid
// in französischer Amtssprache zitiert aber «art. 42 LTF» statt «Art. 42 BGG»,
// ein italienischer «art. 41 CO» statt «Art. 41 OR» — dasselbe Bundesgesetz,
// ein anderes amtliches Kürzel, und ohne Zuordnung verschwand das Zitat
// lautlos. Das Sichtbarkeits-Tor (Baustein c) hat die Lücke beziffert: 34
// FR/IT-Amtskürzel über der Schwelle, 76.8 % gemappte Nennungen.
// Dagegen steht `ABK_ALIASE` (src/lib/normtext/abk-aliase.generated.ts) —
// amtliche Kurzbezeichnungen je Amtssprache aus Fedlex (jolux:titleShort,
// Currency-Fenster), über die SR-Nummer an den Register-key gebunden. Nach dem
// Einzug: 93.6 % gemappte Nennungen, Rot-Liste 46 → 12 (Messung 28.7.2026);
// nach der Linse-2-Härtung 93.7 % bei 11 Einträgen, gleicher Korpus.
// Die Aliase sind KEINE zweite Wahrheit (§5): der Erlass-Bestand bleibt das
// Register, das Artefakt trägt nur dessen fremdsprachige Namen.
//
// Zwei Sicherungen halten die Ableitung fachlich ehrlich (§1):
//  • ABK_AUSSCHLUSS — Abkürzungen, die föderal UND kantonal existieren und pro
//    Zitat nicht sicher trennbar sind (heute: «StG»). Sie werden NIE gemappt;
//    lieber eine Lücke als eine falsche Bundesrechts-Zuordnung (§8).
//  • ABK_KOLLISIONEN — dieselbe normalisierte Abkürzung zeigte auf ZWEI
//    verschiedene Register-keys. Dann wird das Mapping BEIDSEITIG verworfen
//    (nie geraten) und die Abkürzung hier sichtbar gemacht: das Sichtbarkeits-
//    Tor (W2·6-NKEY Baustein c) und der Unit-Test der exakten Liste machen jede
//    NEUE Kollision laut, statt sie still zu schlucken (§6.7).

import { ABK_ALIASE } from '../../src/lib/normtext/abk-aliase.generated';
import { ERLASS_REGISTER } from '../../src/lib/normtext/register';
import { GERICHTS_KUERZEL } from './gerichts-kuerzel';
import {
  extrahiereStatutRefs, extrahiereStatutRefsMitAnzahl, INVALID_LAW_CODES,
} from '../../src/lib/rechtsprechung/zitat-extraktion';
import type { EntscheidSnapshot, EntscheidSprache } from '../../src/lib/rechtsprechung/typen';
import { verbindeMehrwortKuerzel } from './mehrwort-kuerzel';
import {
  fliesstextVon, spracheDerSammelteile, sprachStueckeVon, ohneLiteraturApparat, fliesstextOhneApparat, literaturSpannen,
} from './entscheide-text';
// Fassungs-Reihen (SR-Slot mit deklarierter Totalrevision) leben in einem
// eigenen Leaf-Modul (§6.6); diese Datei nutzt sie und reicht sie weiter.
import {
  FASSUNGS_REIHEN, REIHE_JE_KEY, reiheFuerPaar, fassungsDatumVon,
} from './fassungs-reihen';
export {
  fassungsReihen, ERLASS_FASSUNGS_REIHEN, fassungsDatumVon, type FassungsReihe,
} from './fassungs-reihen';

/**
 * Abkürzung → Vergleichsform: gross, dann alles ausser [A-Z0-9ÄÖÜ] weg.
 * Ziffern werden BEWAHRT — sonst kollabierten 'BVV 2' und 'BVV 3' (zwei
 * verschiedene Erlasse) auf dasselbe Token 'BVV' und wären nicht mehr
 * unterscheidbar (§1). Umlaute bleiben stehen, damit 'BüG' → 'BÜG' auf den
 * Register-key 'BUEG' zeigt, ohne den Umlaut vorher zu verlieren.
 *
 * REICHWEITE der Ziffern-Bewahrung, ehrlich (§8): sie wirkt im statutes-Pfad
 * (`statutesZuNormKeys` liest das Trailing-Token samt Ziffernblock) — NICHT im
 * Fliesstext-Pfad. `extrahiereStatutRefs` matcht `GESETZ_CODE` ohne Leerzeichen
 * und trifft daher nur die zusammengeschriebene Form: 'Art. 27 BVV2' → 'BVV2',
 * 'Art. 27 BVV 2' → gesetz 'BVV' → `normKeyFuerAbk('BVV')` = null (empirisch
 * geprüft 28.7.2026). Betroffen sind die getrennt geschriebenen Ziffern-Kürzel
 * BVV 2/BVV 3, ArGV 1–5 und AsylV 1–3. Der Extraktor wird dafür bewusst NICHT
 * geändert: seine Falsch-Positiv-Abstimmung ist kampferprobt, und ein
 * gelockerter Ziffern-Anhang zöge Randnummern/Jahreszahlen als Erlass-Suffix
 * herein (§1: lieber eine benannte Lücke als ein falscher Treffer). Die Lücke
 * ist gedeckt, solange die Nennung auch in `statutes[]` steht; ungemappte
 * 'BVV'-Token weist das Sichtbarkeits-Tor (Baustein c) aus, statt sie still zu
 * schlucken (§6.7).
 *
 * ZWEITE STRUKTURELLE GRENZE — AKZENTUIERTE KÜRZEL (Linse 2, 28.7.2026). Der
 * Fliesstext-Extraktor kennt nur `[A-Z0-9]` plus die drei deutschen Umlaute als
 * END-Buchstaben (`GESETZ_CODE`). Ein amtliches Kürzel mit Akzent — «LPMéd»
 * (SR 811.11), «OMéd» (SR 812.212.21), «LFORêts», «OJéN» — ist damit im
 * Fliesstext-Pfad BEWUSST NICHT erfassbar. Bis zur Linse 2 wurde es nicht etwa
 * verworfen, sondern TRUNKIERT: «LPMéd» lieferte das Token 'LPM' — das amtliche
 * fr/it-Kürzel des MARKENSCHUTZGESETZES (SR 232.11) — und damit einen falschen
 * Norm-Key (16 Nennungen in 5 BGE, empirisch belegt). Seither endet der Match
 * gar nicht mehr: kein Token statt eines falschen (§1 — eine benannte Lücke ist
 * einer stillen Fehlzuordnung immer vorzuziehen).
 *
 * FOLGE FÜR DIE ALIAS-EBENE: ein Alias, dessen normalisierte Form der Extraktor
 * strukturell nie erzeugen kann (Akzent oder Leerzeichen in der amtlichen
 * Abkürzung — 'LPMéd' → 'LPMD', 'BVV 2' → 'BVV2'), ist im Fliesstext-Pfad ein
 * TOTER, aber HARMLOSER Eintrag: er kann nichts falsch zuordnen, weil ihn nie
 * jemand nachschlägt. Im statutes-Pfad bleibt er wirksam (`abkVonStatut` liest
 * das Roh-Token samt Akzent). Tot heisst darum «wirkungslos in einem der beiden
 * Zweige», nicht «zu entfernen». Damit die Liste nicht still wächst, weist das
 * Tor check:normkeys sie informativ aus (kein Rot — es ist kein Fehler, sondern
 * eine Eigenschaft der Extraktion, §8).
 */
export function normalisiereAbk(abk: string): string {
  return String(abk).toUpperCase().replace(/[^A-Z0-9ÄÖÜ]/g, '');
}

/**
 * Föderal/kantonal mehrdeutige Abkürzungen (normalisiert) → Begründung. Sie
 * werden NIE auf einen Bundes-Register-key gemappt.
 *
 * «StG» = eidg. Stempelsteuergesetz (SR 641.10) ODER kantonales Steuergesetz
 * (StG/BE, StG/ZH, StG/SG …). Der Kantons-Suffix steht nur in der Regeste-
 * Erstnennung, nicht bei jeder Fliesstext-Nennung; kantonale Grundstückgewinn-/
 * Einkommenssteuer-Fälle (z.B. BGE 152 II 116, StHG-Kontext) tragen GAR keinen
 * Suffix — eine Suffix-Heuristik greift also zu kurz. Daher konservativ ganz
 * weglassen. Preis: die wenigen echten eidg. Stempelsteuer-Leitfälle (z.B.
 * BGE 151 II 884) fehlen bewusst, bis ein positiver Bund-Signal-Diskriminator
 * gebaut ist. Befund: Gegenprüfung W3 (Opus, 2.7.2026) — 5 kantonale Falsch-
 * Positive. Deckt sich mit OCLs Design: deren kuratierte Bund-Whitelist
 * `_SR_NUMBER_MAP` (mcp_server.py:3810) listet die unzweideutigen Bundesgesetze
 * (BV/OR/ZGB/StGB/… bis DBG) und lässt «StG»/StHG bewusst WEG.
 */
export const ABK_AUSSCHLUSS: ReadonlyMap<string, string> = new Map([
  ['STG', 'föderal/kantonal mehrdeutig: eidg. Stempelabgabengesetz (SR 641.10) '
    + 'ODER kantonales Steuergesetz (StG/BE, StG/ZH …). Der Kantons-Suffix fehlt '
    + 'in der Fliesstext-Nennung, eine Suffix-Heuristik greift zu kurz — '
    + 'Gegenprüfung W3 (Opus, 2.7.2026): 5 kantonale Falsch-Positive. Lieber '
    + 'eine Lücke als eine falsche Bundesrechts-Zuordnung (§1/§8).'],
  ['LC', 'föderal/kantonal mehrdeutig: das amtliche it-Kürzel des Arbeits'
    + 'vermittlungsgesetzes (SR 823.11, «Legge sul collocamento») ODER die '
    + 'Waadtländer «la loi vaudoise du 28 février 1956 sur les communes (LC; '
    + 'BLV 175.11)». '
    + 'Gegenprüfung (Opus, 18.9.2026) auf Commit 4eec6ea1f: BGE 149 I 343 (fr, '
    + '19.9.2023) zitiert «art. 40e LC», «art. 40g al. 1 LC» — ein Waadtländer '
    + 'Gemeindegesetz, KEIN Token AVG im Text; committete normKeys [BGG, BV, '
    + 'EMRK]. Die echten AVG-Fundstellen tragen zusätzlich das Token AVG (de) '
    + 'oder LSE (fr) und bleiben über diese Aliase wirksam. Lieber eine Lücke '
    + 'als eine falsche Bundesrechts-Zuordnung (§1/§8).'],
  // ── «OS» bleibt TOTAL gesperrt (QS-KORPUS 25.9.2026). AIMP/OCP sind seit dem
  //    Wurzel-Fix nicht mehr hier, sondern sprachgebunden (SPRACH_HOMONYME unten).
  //    «OS» taugt dafür nicht: Fedlex vergibt es INNERHALB derselben Sprache an
  //    zwei Erlasse (FRA/ITA SR 961.011 und SR 961.05), und der Korpus kennt es
  //    nur als vom Extraktor gekapptes «OS LCart» (SVKG, SR 251.5) — auch in
  //    FRANZÖSISCHEM Body-Text (148_II_25, 148_II_321, 148_II_521). Eine
  //    Sprachbindung löste dort falsch AVO auf (§1).
  ['OS', 'mehrdeutig: FRA/ITA «OS» = AVO (SR 961.011) und SR 961.05 (Fedlex-SPARQL '
    + '25.9.2026); im Korpus ausschliesslich «OS LCart» = KG-Sanktionsverordnung '
    + 'SVKG (SR 251.5), vom Extraktor am Leerzeichen zu «OS» gekappt — z.B. '
    + 'bund/bge/148_II_25 «(Ordonnance sur les sanctions LCart, OS LCart; RS '
    + '251.5)», 147_II_72, 146_II_217 «art. 2-6 OS LCart». Alle sechs Treffer '
    + '(146_II_217, 147_II_72, 148_II_25, 148_II_321, 148_II_521, 151_II_742) '
    + 'trugen falsch AVO.'],
]);

/**
 * SPRACHGEBUNDENE Kürzel (QS-KORPUS 25.9.2026, Wurzel-Fix zum Nach-Verdikt von
 * e3f874779). Fedlex vergibt dieselbe Buchstabenfolge in VERSCHIEDENEN Amts-
 * sprachen an VERSCHIEDENE Erlasse (SPARQL jolux:titleShort über alle
 * ConsolidationAbstracts, Abruf 25.9.2026, https://fedlex.data.admin.ch/sparqlendpoint):
 *   AIMP — ITA SR 351.1 (IRSG) · FRA SR 172.056.5 (IVöB, nicht im Register)
 *   OCP  — FRA SR 832.104 (VKL) · ITA SR 922.01 (JSV, nicht im Register)
 * Innerhalb EINER Sprache ist das Kürzel eindeutig. Darum keine Sperre mehr,
 * sondern Bindung: der Alias einer Zeile von ABK_ALIASE ({sr, sprache, abk})
 * löst NUR in Text dieser Sprache auf (`normKeyImSnapshot` mit `sprache`), nie
 * sprachungebunden (`normKeyFuerAbk` → null). Welche Textstelle welche Sprache
 * trägt, bestimmt `sprachStueckeVon`: nur wo die Zuordnung eindeutig ist —
 * sonst bleibt das Kürzel ungebunden, also ohne Key (§8: Lücke statt Raten).
 * Anlass: bund/bstger/RR_2026_46 (it, Rechtshilfe) nennt das IRSG nur «AIMP» und
 * verlor es mit der Totalsperre; Beschaffungs-BGE (152 II 211 u.a.) nennen die
 * IVöB in der FR-Regeste «AIMP» und dürfen das IRSG weiterhin NICHT bekommen.
 */
export const SPRACH_HOMONYME: ReadonlyMap<string, string> = new Map([
  ['AIMP', 'Fedlex-SPARQL 25.9.2026: ITA «AIMP» = IRSG (SR 351.1), FRA «AIMP» = '
    + 'IVöB (SR 172.056.5). Gebunden an it-Text. Korpus: bund/bstger/RR_2026_46 und '
    + 'RR_2026_97 (it, Rechtshilfe, «art. 1 cpv. 1 AIMP»); Beschaffungs-BGE mit '
    + 'FR-Regeste «AIMP» (152_II_211, 152_II_325, 151_II_81, 150_II_105) bleiben ohne IRSG.'],
  ['OCP', 'Fedlex-SPARQL 25.9.2026: FRA «OCP» = VKL (SR 832.104), ITA «OCP» = JSV '
    + '(SR 922.01). Gebunden an fr-Text. Korpus: nur it-Nennungen (152_II_196 JSV, '
    + '150_IV_425 «OCP-CPM») — sie bleiben ohne VKL.'],
]);

/**
 * Register-keys, deren Abkürzung ausgeschlossen ist (heute: 'STG'). Für den
 * Bestand-Schutzfilter in schreibeKorpus: ALT-Snapshots tragen den Key noch in
 * `normKeys`, obwohl er nicht mehr gemappt wird.
 *
 * Abgeleitet DIREKT aus dem ERLASS_REGISTER, nicht über `ABK_TABELLE` (Härtung
 * 28.7.2026): die Tabelle VERWIRFT kollidierte Abkürzungen beidseitig. Käme je
 * ein zweiter Register-Eintrag mit normalisiert 'STG' dazu, verschwände der
 * Eintrag aus der Tabelle — `ABK_TABELLE.get('STG')` wäre `undefined`, die
 * Menge LEER und der Bestand-Schutzfilter still entwaffnet (nachgestellt: genau
 * dieser Fall liefert `[]`). Ein Schutz, der sich durch eine Kollision selbst
 * abschaltet, ist ein Tor, das nicht scheitern kann (§6.7). Darum wird über die
 * Register-Einträge gescannt — kollisionsunabhängig, und ein kollidierender
 * Zweit-Erlass landet zusätzlich in der Menge statt sie zu leeren.
 *
 * STEHT VOR der Tabellen-Ableitung (28.7.2026, Baustein b), weil die Alias-Ebene
 * sie braucht: ein fremdsprachiges Kürzel darf einen ausgeschlossenen Erlass
 * nicht durch die Hintertür wieder hereinholen (siehe baueAbkTabelle).
 */
export const AUSGESCHLOSSENE_KEYS: ReadonlySet<string> = new Set(
  ERLASS_REGISTER
    .filter((e) => ABK_AUSSCHLUSS.has(normalisiereAbk(e.kuerzel))
                || ABK_AUSSCHLUSS.has(normalisiereAbk(e.key)))
    .map((e) => e.key)
    .sort(),
);

/**
 * SR-Nummer → Register-key, für die Auflösung der Fedlex-Aliase (Baustein b).
 *
 * NUR Bund-Einträge. Bei kantonalen Einträgen trägt `sr` die KANTONALE
 * Systematiknummer ('161.12' in BE), die einer Bundes-SR-Nummer zufällig
 * gleichen kann — eine Auflösung darüber zeigte auf einen völlig anderen
 * Erlass (§1). Zeigt eine SR-Nummer auf ZWEI Register-keys, wird sie beidseitig
 * verworfen (nie raten); die betroffenen Aliase erscheinen dann in
 * ABK_ALIAS_NOTIZEN, statt still zu verschwinden (§6.7).
 */
function baueSrIndex(): { srKey: Map<string, string>; mehrdeutig: Set<string> } {
  const srKey = new Map<string, string>();
  const mehrdeutig = new Set<string>();
  for (const e of ERLASS_REGISTER) {
    if (e.ebene !== 'bund' || !e.sr) continue;
    const bisher = srKey.get(e.sr);
    if (bisher === undefined) { srKey.set(e.sr, e.key); continue; }
    if (bisher !== e.key) mehrdeutig.add(e.sr);
  }
  // FASSUNGS-REIHE STATT MEHRDEUTIGKEIT: trägt der SR-Slot eine deklarierte
  // Abfolge (genau eine geltende Fassung, alle übrigen mit belegter Aufhebung
  // und Nachfolger in derselben Reihe), löst die SR-Nummer auf die GELTENDE
  // Fassung auf, statt beidseitig zu verwerfen. Die fremdsprachigen Aliase
  // («OMPr» fr/it) erben damit dieselbe Abfolge wie das deutsche Kürzel — die
  // datumsabhängige Wahl geschieht erst in `normKeyFuerAbk`. Jeder andere
  // Doppel-Slot bleibt mehrdeutig und wird verworfen wie bisher (§1/§6.7).
  for (const sr of [...mehrdeutig]) {
    const reihe = FASSUNGS_REIHEN.get(sr);
    if (reihe) { srKey.set(sr, reihe.geltend); mehrdeutig.delete(sr); continue; }
    srKey.delete(sr);
  }
  return { srKey, mehrdeutig };
}

/**
 * Ableitung aus dem Register (§5) UND den amtlichen Fedlex-Kürzeln.
 *
 * Zwei Kandidaten-Quellen, EINE Tabelle und EINE Kollisionsregel:
 *  (1) Register — je Eintrag die Anzeige-Abkürzung (`kuerzel`) und der
 *      dateisichere `key`, beide → derselbe Register-key.
 *  (2) ABK_ALIASE (generiert aus Fedlex, W2·6-NKEY b) — die amtliche
 *      Kurzbezeichnung je Amtssprache, über die SR-Nummer auf den Register-key
 *      aufgelöst: 'LTF'/'CO'/'CPC'/'LP'/'CEDH' → BGG/OR/ZPO/SCHKG/EMRK. Ohne
 *      diese Ebene verschwand jedes Zitat eines französisch- oder italienisch-
 *      sprachigen Entscheids lautlos, obwohl es dasselbe Bundesrecht meint.
 *
 * Zeigt eine normalisierte Abkürzung auf ZWEI verschiedene keys, wird sie
 * beidseitig verworfen und als Kollision ausgewiesen (nie raten, §1) — für
 * Aliase gilt exakt dieselbe Regel wie für die Register-Kandidaten. Ein Alias
 * ist kein besseres Wissen als das Register; er ist dieselbe Art Kandidat.
 *
 * ABK_AUSSCHLUSS wirkt auf BEIDE Quellen, und für Aliase auf der KEY-Ebene:
 * ein Alias, dessen Erlass ausgeschlossen ist, wird gar nicht erst aufgenommen.
 * Der Anlassfall ist SR 641.10 (eidg. Stempelabgabengesetz): das deutsche «StG»
 * ist föderal/kantonal mehrdeutig und darum ausgeschlossen — die amtlichen
 * Kürzel «LT» (fr) und «LTB» (it) sind es NICHT und würden denselben Key 'STG'
 * über die Hintertür in den Korpus tragen. Das wäre eine fachliche Entscheidung
 * («altrechtlich/kantonal ausgeschlossene Erlasse doch wieder zulassen»), und
 * die trifft kein Build-Schritt nebenbei (§7/§8). Zwei Wirkungen wären sonst
 * widersprüchlich: `normKeysVonSnapshot` erzeugte den Key, der Schreibpfad
 * (schreibeKorpus, AUSGESCHLOSSENE_KEYS) verwürfe ihn beim Index wieder — ein
 * halber Zustand, der niemandem hilft. Die verworfenen Aliase stehen in
 * ABK_ALIAS_AUSGESCHLOSSEN, damit die Lücke benannt bleibt statt still zu sein.
 */
function baueAbkTabelle(): {
  tabelle: Map<string, string>; kollisionen: string[]; notizen: string[]; ausgeschlossen: string[];
  gesperrteZiele: Map<string, Set<string>>;
  sprachTabelle: Map<string, Map<string, string>>;
} {
  const tabelle = new Map<string, string>();
  const kollidiert = new Set<string>();
  const notizen: string[] = [];
  const ausgeschlossen: string[] = [];
  const gesperrteZiele = new Map<string, Set<string>>();
  // SPRACH_HOMONYME: je Amtssprache eine eigene Tabelle mit eigener Kollisions-
  // regel (zwei SR-Nummern in DERSELBEN Sprache ⇒ beidseitig verworfen, §1).
  const sprachTabelle = new Map<string, Map<string, string>>();
  const sprachKollidiert: Array<[string, string]> = [];
  const setze = (kandidat: string, key: string): void => {
    if (!kandidat) return;
    const bisher = tabelle.get(kandidat);
    if (bisher === undefined) { tabelle.set(kandidat, key); return; }
    if (bisher === key) return;
    // Zwei Fassungen DESSELBEN Erlasses (deklarierte Totalrevision) sind keine
    // Kollision: die Tabelle trägt die GELTENDE Fassung, `normKeyFuerAbk` wählt
    // am Entscheiddatum die damals geltende. Alles andere kollidiert wie bisher.
    const reihe = reiheFuerPaar(bisher, key);
    if (reihe) { tabelle.set(kandidat, reihe.geltend); return; }
    kollidiert.add(kandidat);
  };

  for (const e of ERLASS_REGISTER) {
    setze(normalisiereAbk(e.kuerzel), e.key);
    setze(normalisiereAbk(e.key), e.key);
  }

  const { srKey, mehrdeutig } = baueSrIndex();
  for (const a of ABK_ALIASE) {
    const key = srKey.get(a.sr);
    if (key === undefined) {
      notizen.push(
        `${a.abk} (SR ${a.sr}, ${a.sprache}) — `
        + (mehrdeutig.has(a.sr)
          ? 'SR im ERLASS_REGISTER mehrdeutig (zwei keys): Alias verworfen'
          : 'SR nicht (mehr) im ERLASS_REGISTER: Alias verworfen'),
      );
      continue;
    }
    const t = normalisiereAbk(a.abk);
    if (AUSGESCHLOSSENE_KEYS.has(key) || ABK_AUSSCHLUSS.has(t)) {
      ausgeschlossen.push(`${a.abk} (SR ${a.sr}, ${a.sprache}) → ${key}`);
      (gesperrteZiele.get(t) ?? gesperrteZiele.set(t, new Set()).get(t)!).add(key);
      continue;
    }
    if (SPRACH_HOMONYME.has(t)) {
      // Sprachungebunden gesperrt (darum auch Ziel der Sperr-Gegenrichtung
      // `sperrEntfernteNormKeys`), sprachgebunden aufgelöst.
      (gesperrteZiele.get(t) ?? gesperrteZiele.set(t, new Set()).get(t)!).add(key);
      const je = sprachTabelle.get(a.sprache) ?? sprachTabelle.set(a.sprache, new Map()).get(a.sprache)!;
      const bisher = je.get(t);
      if (bisher !== undefined && bisher !== key) sprachKollidiert.push([a.sprache, t]);
      else je.set(t, key);
      continue;
    }
    setze(t, key);
  }

  for (const k of kollidiert) tabelle.delete(k);   // beide Seiten verwerfen
  for (const [sp, t] of sprachKollidiert) { sprachTabelle.get(sp)?.delete(t); kollidiert.add(`${t} (${sp})`); }
  // Ein Sprach-Homonym gilt NIE sprachungebunden — auch nicht, falls je ein
  // Register-Kürzel dieselbe Buchstabenfolge trüge (dann wäre es mehrdeutig).
  for (const t of SPRACH_HOMONYME.keys()) tabelle.delete(t);
  return {
    tabelle,
    kollisionen: [...kollidiert].sort(),
    notizen: notizen.sort(),
    ausgeschlossen: ausgeschlossen.sort(),
    gesperrteZiele,
    sprachTabelle,
  };
}

const {
  tabelle: ABK_TABELLE,
  kollisionen: KOLLISIONEN,
  notizen: ALIAS_NOTIZEN,
  ausgeschlossen: ALIAS_AUSGESCHLOSSEN,
  gesperrteZiele: GESPERRTE_ALIAS_ZIELE,
  sprachTabelle: SPRACH_TABELLE,
} = baueAbkTabelle();

/**
 * Aliase des generierten Artefakts, die sich NICHT auf einen Register-key
 * auflösen liessen (SR fehlt oder ist mehrdeutig). Leer = Artefakt und Register
 * sind synchron.
 *
 * Sichtbar statt still (§6.7): ein Erlass, der aus dem Register verschwindet
 * oder eine SR-Nummer doppelt belegt, macht seine Aliase wirkungslos — ohne
 * diese Liste bemerkte das niemand, weil ein wirkungsloses Alias sich genau wie
 * ein nie erzeugtes verhält. Das Tor check:normkeys weist sie aus.
 */
export const ABK_ALIAS_NOTIZEN: ReadonlyArray<string> = ALIAS_NOTIZEN;

/**
 * Aliase, die auf einen AUSGESCHLOSSENEN Erlass zeigen und darum nicht in die
 * Tabelle kommen (heute: 'StG'/'LT'/'LTB' → 'STG', SR 641.10). KEIN Fehler,
 * sondern die bewusst fortgeführte Lücke aus ABK_AUSSCHLUSS — aber sie wird
 * ausgewiesen, weil eine Lücke, die niemand sieht, sich nicht schliessen lässt.
 *
 * OFFENE FACHFRAGE (§7, Entscheid David): «LT»/«LTB» sind im Korpus belegt
 * ausschliesslich eidgenössisch (bund/bge/151_II_545, 151_II_884, 149_II_462 —
 * Stempelabgaben-Leitfälle) und wären damit genau der «positive Bund-Signal-
 * Diskriminator», den der ABK_AUSSCHLUSS-Kommentar als Bedingung nennt. Sie
 * freizugeben ist eine fachliche Entscheidung über den Umgang mit dem
 * mehrdeutigen «StG», nicht eine Folge der Alias-Ernte — darum hier vorgemerkt
 * statt nebenbei umgesetzt.
 */
export const ABK_ALIAS_AUSGESCHLOSSEN: ReadonlyArray<string> = ALIAS_AUSGESCHLOSSEN;

/**
 * Abkürzungen, die auf mehrere Register-keys zeigen und darum GAR NICHT gemappt
 * werden. Leer = sauber. Sichtbar statt still (§6.7) — der Unit-Test schreibt
 * die exakte Liste fest, damit ein neuer Register-Eintrag, der eine Abkürzung
 * doppelt belegt, rot wird statt Treffer zu verlieren.
 */
export const ABK_KOLLISIONEN: ReadonlyArray<string> = KOLLISIONEN;

/**
 * Abkürzung → Register-key. `datum` ist das ISO-Entscheiddatum (`YYYY-MM-DD`)
 * und wählt bei einer FASSUNGS-REIHE die im Entscheidzeitpunkt geltende
 * Fassung: «BMV» in einem Entscheid von 2020 meint die Verordnung von 2009
 * (`BMV`), in einem Entscheid ab dem 1.3.2026 die von 2025 (`BMV_2025`).
 *
 * OHNE `datum` liefert die Funktion die HEUTE geltende Fassung. Das ist die
 * richtige Antwort für die beiden datumsfreien Aufrufer: das Sichtbarkeits-Tor
 * fragt «ist dieses Kürzel überhaupt auflösbar», und der kantonale Resolver
 * fragt «ist dieses Kürzel Bundesrecht» — beide brauchen die Fassung nicht, nur
 * die Existenz. Kein Aufrufer im Korpus-Schreibpfad ist datumsfrei: die
 * Snapshot-Funktionen unten reichen `snap.datum` durch (§2 — das Datum ist
 * Eingabe, nicht Uhrzeit).
 *
 * Zeigt ein Kürzel auf eine HISTORISCHE Fassung, ohne dass eine Kollision es
 * dorthin gezwungen hätte (ein Alias, der nur die alte Fassung benennt), bleibt
 * dieser Key unangetastet — das Kürzel nennt die Fassung ja ausdrücklich.
 */
export function normKeyFuerAbk(abk: string, datum?: string | null): string | null {
  const k = normalisiereAbk(abk);
  if (ABK_AUSSCHLUSS.has(k) || SPRACH_HOMONYME.has(k)) return null;
  const key = ABK_TABELLE.get(k);
  if (key === undefined) return null;
  return damalsGeltend(key, datum);
}

/** Fassungs-Reihe: die am `datum` geltende Fassung von `key` (ohne Datum: `key`). */
function damalsGeltend(key: string, datum?: string | null): string {
  if (!datum) return key;
  const reihe = REIHE_JE_KEY.get(key);
  if (!reihe || reihe.geltend !== key) return key;
  // `historisch` ist aufsteigend nach `bis` — die erste Fassung, deren
  // Geltungsfenster das Datum noch enthält, ist die damals geltende. Bei einer
  // mehrgliedrigen Kette (A → B → C) trifft das die richtige Stufe.
  const damals = reihe.historisch.find((h) => datum < h.bis);
  return damals ? damals.key : key;
}

/**
 * Register-key eines SPRACH_HOMONYMS — NUR, wenn die Textstelle eindeutig in der
 * Sprache steht, an die der Fedlex-Alias gebunden ist; sonst null (§8).
 */
export function sprachAliasKey(abk: string, sprache: EntscheidSprache | null | undefined, datum?: string | null): string | null {
  if (!sprache) return null;
  const key = SPRACH_TABELLE.get(sprache)?.get(normalisiereAbk(abk));
  return key === undefined ? null : damalsGeltend(key, datum);
}

/** Ist das Kürzel ein SPRACH_HOMONYM (Auflösung nur sprachgebunden)? */
export function istSprachHomonym(abk: string): boolean {
  return SPRACH_HOMONYME.has(normalisiereAbk(abk));
}

// VOM BUNDESGERICHT IM URTEIL SELBST DEFINIERTE KÜRZEL — Tabelle, Belege und
// Belegregel in ./gerichts-kuerzel.ts (QS-KORPUS 25.9.2026). Hier nur die Auflösung,
// NUR in Bundesgerichts-Snapshots wirksam (normKeyFuerAbk sieht sie nicht).
export { GERICHTS_KUERZEL, type GerichtsKuerzel } from './gerichts-kuerzel';

function baueGerichtsKuerzel(): { tabelle: Map<string, string>; notizen: string[] } {
  const tabelle = new Map<string, string>();
  const notizen: string[] = [];
  const { srKey } = baueSrIndex();
  for (const g of GERICHTS_KUERZEL) {
    const abk = normalisiereAbk(g.abk);
    const key = srKey.get(g.sr);
    if (key === undefined) { notizen.push(`${g.abk} (SR ${g.sr}) — SR nicht eindeutig im ERLASS_REGISTER: verworfen`); continue; }
    if (ABK_TABELLE.has(abk) || KOLLISIONEN.includes(abk) || ABK_AUSSCHLUSS.has(abk) || SPRACH_HOMONYME.has(abk)) {
      notizen.push(`${g.abk} (SR ${g.sr}) — kollidiert mit Register-/Fedlex-Kürzel: verworfen`);
      continue;
    }
    if (AUSGESCHLOSSENE_KEYS.has(key)) { notizen.push(`${g.abk} (SR ${g.sr}) → ${key} ausgeschlossen: verworfen`); continue; }
    if (tabelle.has(abk) && tabelle.get(abk) !== key) { notizen.push(`${g.abk} — doppelt mit verschiedenen SR: verworfen`); tabelle.delete(abk); continue; }
    tabelle.set(abk, key);
  }
  return { tabelle, notizen: notizen.sort() };
}

const { tabelle: GERICHTS_TABELLE, notizen: GERICHTS_NOTIZEN } = baueGerichtsKuerzel();

/** Verworfene Einträge von GERICHTS_KUERZEL (leer = sauber; der Unit-Test hält das fest). */
export const GERICHTS_KUERZEL_NOTIZEN: ReadonlyArray<string> = GERICHTS_NOTIZEN;

/**
 * Register-key eines vom Bundesgericht definierten Kürzels — NUR für
 * `gerichtstyp === 'bundesgericht'`, sonst null. Datum wie `normKeyFuerAbk`
 * (Fassungs-Reihe), heute ohne Wirkung (VRK hat keine Reihe).
 */
export function gerichtsKuerzelKey(abk: string, gerichtstyp: string | null | undefined, datum?: string | null): string | null {
  if (gerichtstyp !== 'bundesgericht') return null;
  const key = GERICHTS_TABELLE.get(normalisiereAbk(abk));
  if (key === undefined) return null;
  return damalsGeltend(key, datum);
}

/**
 * Snapshot-gebundene Auflösung: erst die amtliche Ebene (`normKeyFuerAbk`),
 * dann die sprachgebundenen Aliase (SPRACH_HOMONYME, nur mit eindeutiger
 * `sprache` der Textstelle), dann — nur bei Bundesgerichts-Snapshots — die
 * Gerichts-Kürzel. EINE Stelle für alle Snapshot-Pfade (normKeys, Literatur-
 * Befund, Artikel-Schlüssel, fremd definierte Keys), damit Norm-Index und
 * Bezüge dieselbe Zuordnung sehen (§5).
 */
export function normKeyImSnapshot(
  abk: string, gerichtstyp: string | null | undefined, datum?: string | null,
  sprache?: EntscheidSprache | null,
): string | null {
  return normKeyFuerAbk(abk, datum) ?? sprachAliasKey(abk, sprache, datum) ?? gerichtsKuerzelKey(abk, gerichtstyp, datum);
}

/**
 * "Art. 32 Abs. 2 BGG" → ['BGG']; mehrere Nennungen dedupliziert.
 * Das Trailing-Token fängt einen angehängten einzelnen Ziffern-Block mit
 * («Art. 27 BVV 2» → 'BVV 2' → key 'BVV_2') — ohne ihn fiele die Nennung auf
 * 'BVV' zurück und wäre von 'BVV 3' nicht mehr unterscheidbar (§1).
 *
 * ── QUELL-EIGENSCHAFT DER EINGABE, ehrlich benannt (§8; Lücke L7) ────────────
 * `zitierteNormen` ist die ROH-Drittextraktion von OpenCaseLaw (statutes[]) und
 * trägt zwei Eigenschaften, die man ihr nicht ansieht:
 *
 *  (1) HARTE KAPPUNG BEI 8 EINTRÄGEN. Gemessen am committeten Korpus (5'093
 *      Snapshots, 28.7.2026): Längenverteilung 0 → 3'766 · 1 → 3 · 2 → 20 ·
 *      3 → 20 · 4 → 34 · 5 → 52 · 6 → 58 · 7 → 55 · 8 → 1'085 · 9+ → 0. Die
 *      Klippe bei genau 8 ist kein Zufall der Rechtsmaterie, sondern ein Limit
 *      der Quelle — jeder dieser 1'085 Snapshots hat mutmasslich MEHR zitierte
 *      Normen, als die Liste zeigt.
 *  (2) ALPHABETISCH SORTIERT. Alle 1'085 Achter-Listen sind lexikographisch
 *      geordnet. Die Kappung schneidet also nicht die UNWICHTIGSTEN Normen ab,
 *      sondern die alphabetisch hinteren — bei einem Entscheid zu «Art. 8 ZGB»
 *      systematisch das ZGB.
 *
 * FOLGERUNG, damit niemand aus (1)/(2) das Falsche schliesst: dieser Zweig ist
 * eine ERGÄNZUNG, nie ein Massstab. Er darf nicht als «die zitierten Normen»
 * gelesen, nicht als Soll-Bestand gegen den Fliesstext-Zweig gestellt und nicht
 * als Korroborations-Beleg benutzt werden — genau dieser letzte Fehlgebrauch
 * steckte in der zurückgebauten Korroborations-Regel (Gegenprüfung R3). Die
 * 3'766 Snapshots ohne jeden Eintrag (praktisch der ganze BS-Bestand) hätten
 * dort strukturell schlechter abgeschnitten als die Bundes-Snapshots — ein
 * Unterschied der QUELLE, nicht der Rechtsanwendung.
 */
export function statutesZuNormKeys(
  statutes: string[], datum?: string | null, gerichtstyp?: string | null, sprache?: EntscheidSprache | null,
): string[] {
  const out = new Set<string>();
  for (const s of statutes ?? []) {
    const abk = abkVonStatut(s);
    if (!abk) continue;
    // `gerichtstyp` (optional): nur Bundesgerichts-Snapshots sehen GERICHTS_KUERZEL.
    // `sprache` (optional): nur mit eindeutiger Sprache lösen SPRACH_HOMONYME auf
    // (`spracheDerSammelteile`); ohne Angabe bleiben sie ungebunden.
    const k = normKeyImSnapshot(abk, gerichtstyp, datum, sprache);
    if (k) out.add(k);
  }
  return [...out];
}

/**
 * Trailing-Token einer Roh-statutes-Zeile, VOR der Normalisierung:
 * "Art. 32 Abs. 2 BGG" → 'BGG', "Art. 27 BVV 2" → 'BVV 2'. Kein Treffer → null.
 *
 * EIGENE exportierte Funktion, weil zwei Aufrufer dieselbe Zerlegung brauchen
 * (§5): `statutesZuNormKeys` (Produktpfad) und das Sichtbarkeits-Tor
 * `check:normkeys` (scripts/normtext/check-normkeys-abdeckung.ts). Eine Kopie
 * des Regex im Tor hiesse: das Tor misst eine ANDERE Zerlegung als die, die im
 * Korpus wirkt — es meldete dann Lücken, die es nicht gibt, und übersähe die
 * echten. Genau das soll ein Tor nicht können (§6.7).
 *
 * DIESELBE SPERRE WIE IM FLIESSTEXT-PFAD (Linse 2, 28.7.2026). Der Fliesstext-
 * Extraktor verwirft Kandidaten aus `INVALID_LAW_CODES` — Artikel, Präpositionen
 * und Konjunktionen DE/FR/IT, Struktur-Marker, Währungscodes. Der statutes-Pfad
 * kannte diese Sperre NICHT und war damit die offene Flanke derselben
 * Fehlerklasse: eine Roh-Zeile, die auf ein solches Wort endet, lieferte das
 * Wort als Erlass-Kandidaten. Belegt am konstruierten Fall «Art. 5 de la» →
 * Token 'la' → 'LA' — seit der Alias-Ernte (Baustein b) das amtliche fr-Kürzel
 * des LUFTFAHRTGESETZES (SR 748.0) → `statutesZuNormKeys` gab ['LFG'] zurück.
 * Im heutigen Korpus feuert der Kanal (noch) nicht: die 6 vorkommenden
 * INVALID-Token (BGE 51, NR 4, SI 3, FR 3, NE 1, ART 1 — die drei letzten
 * Kantons-Suffixe aus «KV/FR», «LAQ/SI», «KV/NE») mappen alle auf nichts. Das
 * ist kein Grund, die Sperre wegzulassen, sondern der Grund, sie JETZT zu
 * setzen: jede neue Alias-Ernte kann ein weiteres dieser Wörter zu einem
 * gültigen Kürzel machen, ohne dass irgendwo etwas rot wird (§5 — eine Sperre,
 * die nur einer von zwei Pfaden kennt, ist keine Sperre).
 *
 * Wirkung auf das Tor: die Token verschwinden aus der Zählung, statt als
 * «ungemappt» geführt zu werden — richtig, denn sie sind gar keine Kandidaten.
 * Der frühere IGNORE-Eintrag 'BGE' in check-normkeys-abdeckung.ts ist damit
 * gegenstandslos geworden und wurde dort gestrichen (die Begründung steht in
 * dessen Kopf).
 */
export function abkVonStatut(statut: string): string | null {
  const m = /([A-Za-zÄÖÜäöü]{2,}(?:\s+\d{1,2})?)\s*$/.exec(String(statut).trim());
  if (!m) return null;
  if (INVALID_LAW_CODES.has(normalisiereAbk(m[1]))) return null;
  return m[1];
}

// Text-Assemblage, Sprach-Zuordnung je Stück und Literatur-Kontext-Regel leben
// seit 25.9.2026 im Leaf-Modul ./entscheide-text.ts (§6.6); hier weitergereicht.
export {
  fliesstextVon, regesteTextVon, spracheDerSammelteile, sprachStueckeVon, type SprachStueck,
  LITERATUR_MARKER, ohneLiteraturApparat, literaturSpannen, fliesstextOhneApparat,
} from './entscheide-text';

/**
 * Treffer der SPRACH_HOMONYME, je Textstück in dessen eindeutiger Sprache
 * aufgelöst ({key, artikel}). NUR Homonyme: alle übrigen Kürzel löst der
 * sprachungebundene Pfad unverändert über den Gesamttext auf — die Ausgabe der
 * bestehenden Keys bleibt damit byte-gleich. `mitStatutes` stellt die Roh-
 * statutes als Sammel-Teil voran, `ohneApparat` bereinigt jedes Stück um die
 * Zitier-Apparat-Spannen (deren Grenzen `;`/`)`/`»`/Zeilenende nie über ein
 * Stück hinausreichen). Rein (§2).
 */
function sprachgebundeneTreffer(
  snap: EntscheidSnapshot, opts: { ohneApparat: boolean; mitStatutes: boolean },
): Array<{ key: string; artikel: string }> {
  const datum = fassungsDatumVon(snap);
  const stuecke = sprachStueckeVon(snap);
  if (opts.mitStatutes) stuecke.unshift({ sprache: spracheDerSammelteile(snap), text: (snap.zitierteNormen ?? []).join('\n') });
  const out: Array<{ key: string; artikel: string }> = [];
  for (const st of stuecke) {
    if (!st.sprache) continue;
    // wie `fliesstextOhneApparat`: bereinigt UND Mehrwort-Kürzel verbunden (mehrwort-kuerzel.ts, §5).
    const text = opts.ohneApparat ? verbindeMehrwortKuerzel(ohneLiteraturApparat(st.text)) : st.text;
    for (const ref of extrahiereStatutRefs(text)) {
      if (!istSprachHomonym(ref.gesetz)) continue;
      const k = normKeyImSnapshot(ref.gesetz, snap.gerichtstyp, datum, st.sprache);
      if (k) out.push({ key: k, artikel: ref.artikel });
    }
  }
  return out;
}

/**
 * normKeys eines Snapshots: Vereinigung aus der Roh-Drittextraktion
 * (`zitierteNormen`, OCL statutes[]) UND den im FLIESSTEXT erkannten
 * Gesetzes-Zitaten (§1 — der Anlassfall BGE 152 III 137 nennt das IPRG 68-mal
 * im Text). Optionaler `hint` = bereits aufgelöster Register-key (Quellzweig
 * mit deklarierter Erlass-Bindung). Alphabetisch sortiert → build-pfad-
 * unabhängig stabil (§2).
 *
 * Der `hint` unterliegt demselben Ausschluss wie die beiden Text-Zweige
 * (Härtung 28.7.2026): der Ausschluss mehrdeutiger Kürzel ist TOTAL, sonst
 * käme 'STG' über den Quellzweig doch noch in `normKeys` und die föderal/
 * kantonale Mehrdeutigkeit stünde wieder im Korpus (§1/§8).
 *
 * Der Fliesstext-Zweig liest den um die Zitier-Apparat-Spannen bereinigten Text
 * (`fliesstextOhneApparat`, Gegenprüfung R3): ein Erlass, der im Korpus AUSSCHLIESSLICH
 * im Literaturnachweis eines Kommentars vorkommt, wird von diesem Entscheid nicht
 * genannt — er wird zitiert BEI einem Autor. Der `zitierteNormen`-Zweig bleibt roh:
 * dort steht kein Literaturapparat.
 */
export function normKeysVonSnapshot(snap: EntscheidSnapshot, hint?: string | null): string[] {
  const datum = fassungsDatumVon(snap);
  const out = new Set<string>(statutesZuNormKeys(snap.zitierteNormen ?? [], datum, snap.gerichtstyp, spracheDerSammelteile(snap)));
  const refs = extrahiereStatutRefs(fliesstextOhneApparat(snap));
  for (const ref of refs) {
    const k = normKeyImSnapshot(ref.gesetz, snap.gerichtstyp, datum);
    if (k) out.add(k);
  }
  // SPRACH_HOMONYME: nur je Textstück mit eindeutiger Sprache (QS-KORPUS 25.9.2026).
  if (refs.some((r) => istSprachHomonym(r.gesetz))) {
    for (const t of sprachgebundeneTreffer(snap, { ohneApparat: true, mitStatutes: false })) out.add(t.key);
  }
  if (hint && !AUSGESCHLOSSENE_KEYS.has(hint)) out.add(hint);
  return [...out].sort();
}

/**
 * normKeys, die AUSSCHLIESSLICH aus einer entfernten Zitier-Apparat-Spanne
 * stammen — der Erlass kommt im Snapshot nur im Literaturnachweis vor.
 *
 * WOFÜR (Gegenprüfung R3): der `--remap`-Lauf BEWAHRT Alt-Keys, die die
 * Neuberechnung nicht reproduziert (Einweg-Ratschen-Sperre, siehe
 * `remapNormKeys`/`undeklarierteAltKeys`). Genau diese Bewahrung wäre hier
 * falsch: die Literatur-Kontext-Regel hat den Key als Phantom entlarvt; würde er
 * bewahrt, bliebe der Fix am Artefakt wirkungslos — dieselbe Fehlerklasse, gegen
 * die die Sperre gebaut wurde, nur in der anderen Richtung.
 *
 * Die Funktion trifft keine fachliche Wertung, sie BELEGT nur mechanisch die
 * Ursache: reproduziert der ROHE Text den Key und der bereinigte nicht, dann und
 * nur dann hat ihn diese Regel entfernt. Alles andere bleibt beim fail-closed
 * Abbruch (§6.7). Der `zitierteNormen`-Zweig ist ausgenommen — er wird nie
 * bereinigt, also kann er auch nichts verlieren.
 *
 * Rein, sortiert (§2).
 */
export function literaturEntfernteNormKeys(snap: EntscheidSnapshot): string[] {
  const datum = fassungsDatumVon(snap);
  const ausStatutes = new Set(statutesZuNormKeys(snap.zitierteNormen ?? [], datum, snap.gerichtstyp, spracheDerSammelteile(snap)));
  const keysAus = (text: string, ohneApparat: boolean): Set<string> => {
    const out = new Set<string>();
    const refs = extrahiereStatutRefs(text);
    for (const ref of refs) {
      const k = normKeyImSnapshot(ref.gesetz, snap.gerichtstyp, datum);
      if (k) out.add(k);
    }
    if (refs.some((r) => istSprachHomonym(r.gesetz))) {
      for (const t of sprachgebundeneTreffer(snap, { ohneApparat, mitStatutes: false })) out.add(t.key);
    }
    return out;
  };
  const roh = keysAus(fliesstextVon(snap), false);
  const rein = keysAus(fliesstextOhneApparat(snap), true);
  return [...roh].filter((k) => !rein.has(k) && !ausStatutes.has(k)).sort();
}

/**
 * normKeys, die AUSSCHLIESSLICH aus einem gesperrten Alias-Kürzel stammen
 * (ABK_AUSSCHLUSS, z.B. «AIMP» → IRSG) — die zweite Gegenrichtung der
 * Bewahr-Ratsche (QS-KORPUS 25.9.2026, Nach-Verdikt zu e3f874779).
 *
 * WOFÜR: eine Sperre in ABK_AUSSCHLUSS entlarvt Alt-Keys als Fehlzuordnung;
 * `--remap` bewahrte sie sonst (oder bräche fail-closed ab). Die Ursache wird je
 * Snapshot MECHANISCH belegt, nicht angenommen: der Snapshot nennt ein
 * gesperrtes Kürzel, dessen Alias-Ziel genau dieser Key war, UND die
 * Neuberechnung (ohne das Kürzel) reproduziert den Key nicht. Wird der Key über
 * ein anderes Kürzel weiter belegt (Rechtshilfe-BGE: «IRSG»/«EIMP»), bleibt er
 * — `normKeysVonSnapshot` enthält ihn dann. Rein, sortiert (§2).
 */
export function sperrEntfernteNormKeys(snap: EntscheidSnapshot): string[] {
  const kandidaten = new Set<string>();
  const pruefe = (abk: string): void => {
    const ziele = GESPERRTE_ALIAS_ZIELE.get(normalisiereAbk(abk));
    if (ziele) for (const k of ziele) kandidaten.add(k);
  };
  for (const z of snap.zitierteNormen ?? []) { const a = abkVonStatut(z); if (a) pruefe(a); }
  for (const ref of extrahiereStatutRefs(fliesstextVon(snap))) pruefe(ref.gesetz);
  if (!kandidaten.size) return [];
  const jetzt = new Set(normKeysVonSnapshot(snap));
  return [...kandidaten].filter((k) => !jetzt.has(k)).sort();
}

/**
 * Re-Map-Regel für den BESTEHENDEN Korpus (`--remap`): neu berechnete Keys
 * VEREINIGT mit den Alt-Keys, die die Neuberechnung nicht reproduziert —
 * abzüglich der AUSGESCHLOSSENE_KEYS. Sortiert (§2).
 *
 * Warum bewahren statt neu setzen (Befund 28.7.2026): bis zur Adapter-Härtung
 * persistierte der BGE-Merge nur die basis-`zitierteNormen`; die statutes des
 * unterliegenden aza-Urteils flossen in die `normKeys`, wurden selbst aber nie
 * gespeichert. Solche Alt-Keys sind legitime Roh-Signale ohne Beleg IM
 * Snapshot (bge_152_I_61 trägt 'ZPO', ohne dass 'ZPO'/'CPC' in zitierteNormen
 * oder Fliesstext vorkommt) — ein Re-Map, der sie entfernt, ist stiller
 * Datenverlust (§8), keine Neuberechnung. Ausgenommen bleiben die
 * ausgeschlossenen Keys: die SOLLEN aus dem Bestand verschwinden.
 *
 * `nichtBewahren` (Gegenprüfung R3) ist die GEGENRICHTUNG derselben Sorgfalt: ein
 * Alt-Key, den ein Korrektheits-Fix soeben als Phantom entlarvt hat, DARF nicht
 * bewahrt werden, sonst schreibt der Re-Map die korrigierte Zuordnung zurück und
 * der Fix ist am Artefakt wirkungslos. Der Aufrufer belegt die Ursache je
 * Snapshot (heute: `literaturEntfernteNormKeys`) — diese Funktion rät nichts,
 * sie führt aus. Die so verworfenen Keys kommen als `verworfen` zurück und
 * werden ausgewiesen, nie still gelöscht (§6.7/§8).
 *
 * Idempotent: das Ergebnis des ersten Laufs ist Fixpunkt des zweiten, weil die
 * bewahrten Keys beim nächsten Lauf wieder als «nur alt» erkannt werden — und
 * die verworfenen im Bestand gar nicht mehr stehen.
 * Rückgabe zusätzlich `nurAlt` — der Aufrufer weist die Zahl aus, statt die
 * Bewahrung still geschehen zu lassen (§6.7).
 *
 * `nurAlt` ist DEDUPLIZIERT und sortiert (Linse 2, 28.7.2026). Vorher wurde die
 * Alt-Liste nur gefiltert: ein Bestands-Snapshot mit doppeltem Eintrag
 * (`['ZPO','ZPO']`) meldete «2 bewahrte Keys», obwohl genau EINER bewahrt wurde
 * — `keys` entdoppelt ja über das Set. Die ausgewiesene Zahl wich damit von der
 * tatsächlichen Wirkung ab, und eine Kennzahl, die grösser ist als das, was sie
 * misst, macht einen Backfill-Lauf harmloser oder dramatischer aussehen als er
 * war (§8). Sortiert, weil die Ausgabe sonst an der Reihenfolge des Bestands
 * hinge (§2).
 */
export function remapNormKeys(
  alt: readonly string[],
  berechnet: readonly string[],
  nichtBewahren: ReadonlySet<string> = new Set(),
): { keys: string[]; nurAlt: string[]; verworfen: string[] } {
  const neu = new Set(berechnet);
  const kandidaten = [...new Set(
    (alt ?? []).filter((k) => !neu.has(k) && !AUSGESCHLOSSENE_KEYS.has(k)),
  )].sort();
  const verworfen = kandidaten.filter((k) => nichtBewahren.has(k));
  const nurAlt = kandidaten.filter((k) => !nichtBewahren.has(k));
  return { keys: [...new Set([...neu, ...nurAlt])].sort(), nurAlt, verworfen };
}

/**
 * Sperre gegen die EINWEG-RATSCHE (Linse 3, 28.7.2026).
 *
 * `remapNormKeys` allein kann nicht unterscheiden, ob ein nicht reproduzierter
 * Alt-Key ein legitimes Roh-Signal ist (nicht persistierte aza-statutes) oder
 * eine Fehlzuordnung, die ein Korrektheits-Fix soeben entlarvt hat. Bewahrt es
 * pauschal, schreibt der nächste `--remap` die korrigierten Keys wieder zurück
 * und der Fix ist am Artefakt wirkungslos — das ist kein hypothetischer Fall:
 * wäre der W2·6-NKEY-Backfill VOR dem Trunkierungs-Fix gelaufen, hätte er die
 * fünf falschen MSCHG-Keys als «alt-erhalten» konserviert.
 *
 * Die Unterscheidung ist fachlich, nicht maschinell (§1). Diese Funktion trifft
 * sie darum nicht, sie erzwingt nur, dass sie GETROFFEN wurde: bewahrt werden
 * darf, was der Aufrufer deklariert hat; alles andere kommt als Befund zurück
 * und lässt den Lauf abbrechen (fail-closed, §6.7). Rein, sortiert (§2).
 */
export function undeklarierteAltKeys(
  bewahrt: ReadonlyMap<string, readonly string[]>,
  deklariert: ReadonlyMap<string, readonly string[]>,
): string[] {
  const raus: string[] = [];
  for (const [id, keys] of bewahrt) {
    const erwartet = deklariert.get(id) ?? [];
    const fremd = [...new Set(keys.filter((k) => !erwartet.includes(k)))].sort();
    if (fremd.length) raus.push(`${id}: ${fremd.join(', ')}`);
  }
  return raus.sort();
}

/**
 * (Register-key, Artikel-Token)-Paare, die ein Snapshot zitiert — 'OR/41'-Form,
 * deduppt. Quelle sind die Roh-statutes UND der um den Zitier-Apparat bereinigte
 * Fliesstext (Baustein d + Gegenprüfung R3). Der Ausschluss mehrdeutiger Kürzel
 * wirkt bereits in `normKeyFuerAbk`.
 *
 * KEINE SCHWELLE, KEINE KORROBORATION (Rückbau 28.7.2026). Jede erkannte Nennung
 * ausserhalb des Zitier-Apparats zählt — einmal genannt genügt. Die zwischenzeitliche
 * Häufigkeits-Regel (≥2 Nennungen, Commit 5e8b49c0) ist entfernt: sie hat in der
 * gleichverteilten Stichprobe ihrer eigenen Verwerfungen rund die Hälfte ECHTE
 * Rechtsanwendung getroffen (ATSG/17, ZPO/138, OR/30, STPO/428, EMRK/6). Wer sie
 * wieder einführen will, muss zuerst diese Messung widerlegen (§1).
 *
 * EINE Stelle (§5): Live-Index (baueArtikelIndex) und Oracle-Tor
 * (check-rangliste-oracle) rechnen mit derselben Funktion, sonst driftet das
 * Tor von dem weg, was es prüfen soll.
 */
export function artikelSchluesselVonSnapshot(snap: EntscheidSnapshot): Set<string> {
  const out = new Set<string>();
  const datum = fassungsDatumVon(snap);
  const text = (snap.zitierteNormen ?? []).join('\n') + '\n' + fliesstextOhneApparat(snap);
  const refs = extrahiereStatutRefs(text);
  for (const ref of refs) {
    const rk = normKeyImSnapshot(ref.gesetz, snap.gerichtstyp, datum);
    if (!rk) continue;
    out.add(`${rk}/${ref.artikel}`);
  }
  // SPRACH_HOMONYME: dieselbe sprachgebundene Auflösung wie in `normKeysVonSnapshot` (§5).
  if (refs.some((r) => istSprachHomonym(r.gesetz))) {
    for (const t of sprachgebundeneTreffer(snap, { ohneApparat: true, mitStatutes: true })) out.add(`${t.key}/${t.artikel}`);
  }
  return out;
}

// ─── FREMD-DEFINIERTE ABKÜRZUNGEN (W2·7-BEZUG/B1, Gegenprüfung Runde 1) ──────
//
// DER BEFUND, der diese Regel erzwungen hat. `bezuege/BPR.json` führte an Art. 3
// den Basler Entscheid VD.2025.5. Der Entscheid handelt vom Vollzug der
// Chemikaliengesetzgebung und schreibt selbst: «… Verordnung (EU) Nr. 528/2012
// über die Bereitstellung auf dem Markt und die Verwendung von Biozidprodukten
// (Biozidprodukteverordnung, BPR)». Sein «Art. 3 Abs. 1 lit. a BPR» ist EU-Recht.
// Der Register-Eintrag BPR ist das Bundesgesetz über die politischen Rechte
// (SR 161.1); das Wort «politisch» kommt im Entscheid kein einziges Mal vor.
//
// WARUM ES DIESE KLASSE GIBT. Die FP-Abstimmung der Abkürzungs-Tabelle
// (W2·6-NKEY) ist an BUNDESGERICHTLICHEM Text gemessen. W2·7-BEZUG öffnet die
// Extraktion erstmals für kantonalen Text — eine andere Textgattung mit anderem
// Zitierverhalten (kantonales Recht, EU-Recht, lokale Kurzformen). Eine
// FP-Analyse der einen Gattung trägt die andere nicht.
//
// DIE REGEL. Definiert ein Entscheid eine Abkürzung SELBST über einen Erlass-
// TITEL, und hat dieser Titel keinerlei Wortüberschneidung mit dem Titel des
// Register-Erlasses, dann meint dieser Entscheid einen ANDEREN Erlass — die
// Abkürzung wird für DIESES Dokument nicht gemappt. Das Dokument schlägt die
// Tabelle, aber nur für sich selbst: kein Raten, keine globale Sperre, keine
// zweite Wahrheit (§5). Es ist dieselbe Bauart wie die dokumentlokale Bindung im
// kantonalen Resolver, nur in der Gegenrichtung.
//
// GEMESSEN am committeten Korpus (28.7.2026), damit die Regel eine Grösse hat:
//   · 3'795 kantonale Snapshots → 976 echte Titel-Definitionen, davon 906 auf
//     einen Register-key auflösbar. Genau EINE zeigt auf einen anderen Erlass:
//     die BPR-Definition oben. Wo das Dokument sich äussert, ist der Kanal also
//     zu 905/906 selbstkonsistent.
//   · 1'283 bundesgerichtliche Snapshots → 31 Definitionen, 14 auflösbar,
//     NULL Abweichungen dieser Form.
// Wirkung am Ende beider Arme, EHRLICH GETRENNT (§8): 70 (Dokument, Key)-Paare
// werden gesperrt, davon 2 mit sichtbarer Wirkung auf die ausgelieferten Kanten
// (BPR und KAG, beide unten belegt). Die übrigen 68 sperren Keys, die dieses
// Dokument ohnehin an keinem Artikel getragen hätte — die Sperre greift dort ins
// Leere. «2» ist die Wirkung, «70» die Reichweite; wer nur eine der beiden Zahlen
// nennt, sagt entweder die Regel sei folgenloser oder schärfer, als sie ist.
//
// ── BENANNTE LÜCKE, NICHT VON DIESER REGEL GEDECKT (Gegenprüfung Runde 2/B6) ─
// Der `zitierteNormen`-Zweig (OCL statutes[]) wird NICHT vom Literatur-Kontext
// bereinigt — er ist Roh-Drittextraktion und trägt darum Literatur-Phantome in
// die Erlass-Ebene: Kommentar-Titel wie «… Kommentar zu Art. 261bis StGB und
// Art. 171c MStG» erzeugen einen MSTG-Eintrag, obwohl das Gericht die Norm nie
// anwendet. GEMESSEN: 158 solcher Paare stehen bereits auf `main`, 4 kommen mit
// dieser Bau-Einheit dazu. Sie zu entfernen hiesse, den bestehenden
// `zitierteNormen`-Zweig zu ändern und damit `normKeys`/`proNorm` — ein
// AUSGELIEFERTES Bestands-Artefakt. Das ist eine fachliche Korrektur am
// W2·6-NKEY-Kanal und gehört in einen eigenen, deklarierten Schritt (§14/§6.3),
// wie die beiden Namensvetter-Fälle EPG/IRSG (siehe bezuege-bauen.ts). Hier
// benannt, damit die Lücke beauftragt werden kann statt verloren zu gehen.
//
// WAS SIE NICHT MISST, ausdrücklich (§8): Fehlzuordnungen in Entscheiden, die
// die Abkürzung weder definieren noch mit einem Sammlungs-Sigel versehen. Diese
// Klasse ist mit dieser Methode unsichtbar und bleibt eine benannte Lücke —
// 1/906 ist die Quote der ERKENNBAREN Fälle, nicht die Fehlerquote des Kanals.
//
// ZWEI ARME, EINE PRÜFUNG. Der Titel kann an zwei Stellen stehen: IN der Klammer
// vor der Abkürzung («(Biozidprodukteverordnung, BPR)», Arm A) oder VOR der
// Klammer («des kantonalen Anwaltsgesetzes … (KAG; BSG 168.11)», Arm B). Beide
// Arme stellen dieselbe Frage — überschneidet sich der genannte Titel mit dem
// Register-Titel? —, nur an verschiedenen Textstellen.

/** Erlass-Titel-Wort — eine Definition nennt einen Titel, ein Zitat eine Fundstelle. */
const TITEL_WORT = /(gesetz|verordnung|ordnung|reglement|abkommen|konvention|übereinkommen|vertrag|richtlinie|beschluss|statut|charta|pakt|kodex|code)\b/i;
/** Klammer-Inhalte, die mit einer Fundstelle beginnen — nie eine Definition. */
const ZITAT_KOPF = /^\s*(?:vgl\.|siehe|s\.|Art\.?|art\.|§|Ziff|Abs|hierzu|zum|zur|dazu|i\.V\.m\.|\d)/;
/** «(… , ABK)» / «[… ; ABK]» — Titel, Trenner, Kurzform am Klammer-Ende. */
const DEFINITION = /[([]([^()[\]\n]{4,140}?)[,;]\s*([A-ZÄÖÜ][A-Za-zÄÖÜäöü0-9]{1,11})\s*[)\]]/g;
/** Inhaltswörter ab 6 Zeichen — Komposita-Vergleich statt Gleichheit. */
const INHALTSWORT = /[A-Za-zÄÖÜäöüß]{6,}/g;
/**
 * Sigel KANTONALER Gesetzessammlungen — DEKLARIERT, mit Korpus-Beleg (§7).
 *
 * ERST ALS FORM VERSUCHT, verworfen. Die erste Fassung erkannte den Locator an
 * seiner Gestalt («2–5 Buchstaben + Dezimalzahl, ausser SR/RS»). Das war
 * bequem und falsch: sie traf «E. 3.2», «Rz 4.5», «Art. 5.1» und verwarf
 * daraufhin 339 Register-keys — darunter StPO, SchKG, ZPO, BGG und BV auf
 * BUNDESGERICHTLICHEN Snapshots, also genau die Zuordnungen, die stimmen. Eine
 * Ausschlussregel, die im Zweifel alles ausschliesst, ist kein Schutz, sondern
 * ein Datenverlust mit gutem Gewissen (§1).
 *
 * Die Liste ist darum GEMESSEN: Scan aller 5'093 Snapshots nach der Form
 * «(ABK; SIGEL nnn.nn)», Häufigkeit als Beleg. Aufgenommen sind die Sigel, die
 * zweifelsfrei eine kantonale Sammlung bezeichnen:
 *   SG 5'986 (BS) · LS 41 (ZH) · BSG 40 (BE) · BLV 27 (BL) · BR 14 (GR) ·
 *   SGS 13 (BL) · RB 9 · RSV 8 (VD) · RSN 8 (NE) · sGS 8 (SG) · BGS 7 (SO/ZG) ·
 *   SAR 4 (AG) · RSF 1 (FR)
 * NICHT aufgenommen, obwohl im Scan aufgetaucht: `SR`/`RS`/`AS` (eidgenössisch —
 * sie BESTÄTIGEN die Bundes-Zuordnung), `Rz` (Randziffer), sowie `SB`/`SE`/`AG`/
 * `GS`/`RL`/`SSSB` (je 1–4 Belege, Sigel nicht zweifelsfrei einer Sammlung
 * zuzuordnen — im Zweifel NICHT aufnehmen, §7).
 *
 * Ein fehlendes Sigel kostet einen Riegel, ein falsches kostet echte Kanten.
 */
const KANTONS_SIGEL: ReadonlySet<string> = new Set(
  ['SG', 'LS', 'BSG', 'BLV', 'BR', 'SGS', 'RB', 'RSV', 'RSN', 'SGS2', 'BGS', 'SAR', 'RSF'],
);

/**
 * «(ABK; SIGEL nnn.nn)» — Abkürzung, Trenner, kantonaler Locator, Klammer-Ende.
 * Eng gefasst: die Abkürzung muss am Klammer-ANFANG und der Locator am
 * Klammer-ENDE stehen. Damit ist ausgeschlossen, dass irgendein Wort irgendwo in
 * einer langen Klammer den Riegel auslöst — der Anlassfall «(KAG; BSG 168.11)»
 * hat genau diese Gestalt.
 */
const SIGEL_BINDUNG = /[([]\s*([A-ZÄÖÜ][A-Za-zÄÖÜäöü0-9]{1,11})\s*[;,]\s*([A-Za-zÄÖÜäöü]{2,5})\s+\d{1,4}\.\d+\s*[)\]]/g;

function inhaltsWoerter(s: string): Set<string> {
  return new Set(s.toLowerCase().match(INHALTSWORT) ?? []);
}

/**
 * Überschneiden sich Definitions-Titel und Register-Titel inhaltlich?
 * Teilwort-Vergleich, weil deutsche Erlass-Titel als Komposita zitiert werden
 * («Ausländergesetz» im Text, «Bundesgesetz über die Ausländerinnen und
 * Ausländer» im Register). Rein (§2).
 */
export function titelUeberlappt(definition: string, registerTitel: string): boolean {
  const a = inhaltsWoerter(definition);
  const b = inhaltsWoerter(registerTitel);
  for (const t of a) if (b.has(t)) return true;
  for (const t of a) for (const u of b) if (t.length >= 8 && (u.includes(t) || t.includes(u))) return true;
  return false;
}

const REGISTER_TITEL = new Map<string, string>(
  ERLASS_REGISTER.map((e) => [e.key, `${e.titel} ${e.kuerzel}`]),
);

/**
 * Register-keys, die DIESER Snapshot selbst als einen ANDEREN Erlass definiert
 * als den, auf den die Abkürzungs-Tabelle zeigt. Rein (§2).
 *
 * Rückgabe sind KEYS, nicht Abkürzungen: der Aufrufer filtert Artikel-Schlüssel
 * der Form 'KEY/artikel', und eine zweite Übersetzung Abkürzung→key an der
 * Aufrufstelle wäre eine zweite Stelle, an der die Zuordnung auseinanderlaufen
 * könnte (§5).
 *
 * BEWUSSTE HÄRTE (§1): gesperrt wird der KEY für das ganze Dokument, nicht die
 * einzelne Nennung. Zitierte derselbe Entscheid daneben den echten Register-
 * Erlass, ginge diese Kante mit verloren. Das ist die richtige Richtung — ein
 * Dokument, das eine Abkürzung erkennbar anders belegt, ist für genau diese
 * Abkürzung keine verlässliche Quelle mehr.
 */
export function fremdDefinierteKeys(snap: EntscheidSnapshot): Set<string> {
  const out = new Set<string>();
  const text = fliesstextVon(snap);
  if (!text) return out;
  // DASSELBE Datum wie in der Extraktion: gesperrt werden muss genau der Key,
  // den `artikelSchluesselVonSnapshot` für dieses Dokument erzeugt — ein Riegel
  // auf die andere Fassung derselben Reihe griffe ins Leere (§5).
  const datum = fassungsDatumVon(snap);
  // DIESELBE Auflösung wie die Extraktion (`normKeyImSnapshot`, §5) — inkl. der
  // Gerichts-Kürzel (Posten «fremdDefinierteKeys berücksichtigt GERICHTS_KUERZEL
  // nicht», 25.9.2026) und der SPRACH_HOMONYME in der Sprache der Fundstelle.
  // Die Sprache folgt aus der Position im Gesamttext (Stück-Grenzen wie in
  // `fliesstextVon`, Trenner '\n'); nur für Homonyme berechnet.
  let grenzen: Array<{ bis: number; sprache: EntscheidSprache | null }> | null = null;
  const spracheBei = (idx: number): EntscheidSprache | null => {
    if (!grenzen) {
      let pos = 0;
      grenzen = sprachStueckeVon(snap).map((st) => { pos += st.text.length + 1; return { bis: pos, sprache: st.sprache }; });
    }
    return grenzen.find((g) => idx < g.bis)?.sprache ?? null;
  };
  const aufloesen = (abk: string, idx: number): string | null =>
    normKeyImSnapshot(abk, snap.gerichtstyp, datum, istSprachHomonym(abk) ? spracheBei(idx) : null);

  // ARM A — Titel-Definition ohne Überschneidung («(Biozidprodukteverordnung, BPR)»).
  for (const m of text.matchAll(DEFINITION)) {
    const titel = m[1];
    if (!TITEL_WORT.test(titel) || ZITAT_KOPF.test(titel)) continue;
    const key = aufloesen(m[2], (m.index ?? 0) + m[0].lastIndexOf(m[2]));
    if (!key) continue;
    if (!titelUeberlappt(titel, REGISTER_TITEL.get(key) ?? '')) out.add(key);
  }

  // ARM B — Abkürzung an eine KANTONALE Sammlungs-Nummer gebunden.
  //
  // NACHGEZOGEN, weil Arm A ihn nicht deckte und die eigene Stichprobe über die
  // seltenen Bundes-Erlasse den Beweis lieferte: `bezuege/KAG.json` führte an
  // Art. 42 den Berner Entscheid 2002024417 mit «Gemäss Art. 42 des kantonalen
  // Anwaltsgesetzes vom 28. März 2006 (KAG; BSG 168.11)». Das ist das BERNISCHE
  // Anwaltsgesetz; der Register-Eintrag KAG ist das Kollektivanlagengesetz
  // (SR 951.31), und «Kapitalanlage» kommt im Entscheid nicht vor. Arm A greift
  // nicht, weil der Titel VOR der Klammer steht und in der Klammer nur
  // «Abkürzung; Fundstelle» folgt — eine andere Satzform, dieselbe Fehlerklasse.
  //
  // DAS SIGNAL ist stärker als eine Titel-Ähnlichkeit: steht neben der Abkürzung
  // eine Sammlungs-Nummer, die NICHT die eidgenössische ist (SR/RS), dann zitiert
  // dieses Dokument an dieser Stelle kantonales Recht. Welchen kantonalen Erlass
  // genau, muss dafür niemand wissen — es genügt zu wissen, dass es kein
  // Bundesrecht ist. Der Riegel arbeitet damit auch für Kantone, für die es
  // (noch) keinen Resolver gibt (BE/AG/ZH/GR/SG — siehe SYSTEMATIK_PRAEFIX).
  //
  // «SR» und «RS» sind ausgenommen, denn sie sind der eidgenössische Locator:
  // «(BVG, SR 831.40)» oder «(HEsÜ; SR 0.211.232.1)» BESTÄTIGEN die Zuordnung,
  // sie widerlegen sie nicht.
  for (const m of text.matchAll(SIGEL_BINDUNG)) {
    if (!KANTONS_SIGEL.has(m[2]) && !KANTONS_SIGEL.has(m[2].toUpperCase())) continue;
    const key = aufloesen(m[1], m.index ?? 0);
    if (!key) continue;
    // DIESELBE TITEL-PRÜFUNG WIE ARM A — nur sitzt der Titel hier VOR der
    // Klammer («des kantonalen Anwaltsgesetzes vom 28. März 2006 (KAG; BSG
    // 168.11)»). Ohne sie über-sperrte der Riegel, und zwar nachweislich: die
    // Gerichte setzen gelegentlich ein kantonales Sigel vor eine BUNDES-Nummer
    // — «des Ausländer- und Integrationsgesetzes (AIG, SG 142.20)» (4 Fälle)
    // und «Verwaltungsverfahrensgesetz [VwVG, SG 172.021]» (1 Fall, SR 172.021
    // mit «SG» verschrieben). Dort ist die Zuordnung RICHTIG, und der Titel
    // sagt es: er überschneidet sich mit dem Register-Titel. Ein Riegel, der
    // auch die richtigen Fälle trifft, tauscht nur eine Fehlerart gegen eine
    // andere (§1).
    const davor = text.slice(Math.max(0, (m.index ?? 0) - 120), m.index ?? 0);
    if (titelUeberlappt(davor, REGISTER_TITEL.get(key) ?? '')) continue;
    out.add(key);
  }
  return out;
}

/**
 * Artikel-Schlüssel PLUS die Zahl dessen, was die Literatur-Kontext-Regel diesem
 * Snapshot genommen hat — für die Verwurf-Statistik des `--remap`-Laufs.
 *
 * WARUM GEZÄHLT WIRD (§6.7): ein Filter, dessen Wirkung niemand sieht, ist ein Tor,
 * das nicht scheitern kann. `literaturVerworfen` sind die Artikel-Schlüssel, die der
 * ROHE Text erzeugt hätte und der bereinigte nicht mehr — ein Sprung nach oben heisst
 * «die Marker greifen zu weit oder der Text hat sich geändert», ein Sprung nach unten
 * «die Regel ist versehentlich entschärft». `literaturNennungen` zählt die
 * Roh-Vorkommen INNERHALB der entfernten Spannen, `literaturSpannenZahl` die Spannen.
 *
 * Die Schlüssel-Menge ist BITGLEICH die von `artikelSchluesselVonSnapshot` — sie wird
 * von dort geholt, nicht nachgebaut (§5).
 */
export function artikelSchluesselMitBefund(snap: EntscheidSnapshot): {
  schluessel: Set<string>;
  literaturVerworfen: string[];
  literaturNennungen: number;
  literaturSpannenZahl: number;
} {
  const schluessel = artikelSchluesselVonSnapshot(snap);

  const spannen = literaturSpannen(fliesstextVon(snap));
  let literaturNennungen = 0;
  for (const ref of extrahiereStatutRefsMitAnzahl(spannen.join('\n'))) literaturNennungen += ref.anzahl;

  const roh = new Set<string>();
  const rohText = (snap.zitierteNormen ?? []).join('\n') + '\n' + fliesstextVon(snap);
  const rohRefs = extrahiereStatutRefs(rohText);
  for (const ref of rohRefs) {
    const rk = normKeyImSnapshot(ref.gesetz, snap.gerichtstyp, fassungsDatumVon(snap));
    if (rk) roh.add(`${rk}/${ref.artikel}`);
  }
  if (rohRefs.some((r) => istSprachHomonym(r.gesetz))) {
    for (const t of sprachgebundeneTreffer(snap, { ohneApparat: false, mitStatutes: true })) roh.add(`${t.key}/${t.artikel}`);
  }
  const literaturVerworfen = [...roh].filter((k) => !schluessel.has(k)).sort();

  return { schluessel, literaturVerworfen, literaturNennungen, literaturSpannenZahl: spannen.length };
}

// ─── Sachgebiets-Klassierung: ausgelagert, hier nur weitergereicht ──────────
//
// Die Regeln, aus welchen amtlichen Signalen ein Entscheid sein `sachgebiet`
// bekommt, leben seit dem 29.8.2026 in ./sachgebiet-klassierung.ts (§6.6 —
// diese Datei war mit der 9C-Korrektur über ihre Schwelle gewachsen). Der
// Umzug war wortgleich und verhaltensneutral; diese Fassade hält alle
// bestehenden Importe gültig, damit kein Aufrufer angefasst werden musste (§6).
export {
  legalAreaZuSachgebiet, abteilungZuSachgebiet, istMehrdeutigeOerAbteilung,
  normSignalSachgebiet, zweierLegalAreaSignal, zweierRohSteuerSignal,
  istGemischteDritteOerAbteilung, bgeBand, hatSozialversicherungsErlass,
  dritteSteuerSignal, dritteOerSachgebiet, kantonalSachgebiet,
} from './sachgebiet-klassierung';

import type { Gerichtstyp } from '../../src/lib/rechtsprechung/typen';
export function gerichtstypFuerCourt(court: string): Gerichtstyp {
  switch (court) {
    case 'bge': return 'bundesgericht';   // amtliche Sammlung (BGE) = Bundesgericht
    case 'bger': return 'bundesgericht';
    case 'bvger': return 'bundesverwaltungsgericht';
    case 'bstger': return 'bundesstrafgericht';
    case 'bpatger': return 'bundespatentgericht';
    default: return 'kantonal';
  }
}

// Lesbare Gerichts-Anzeigenamen (Audit P0): roher OCL-Court-Code → Bezeichnung.
// Explizit für die erfassten Gerichte; sonst Suffix-Ableitung. Status 'maschinell'.
const GERICHT_ANZEIGE: Record<string, string> = {
  zh_obergericht: 'Obergericht ZH',
  zh_verwaltungsgericht: 'Verwaltungsgericht ZH',
  be_verwaltungsgericht: 'Verwaltungsgericht BE',
  be_zivilstraf: 'Obergericht BE',
  ag_gerichte: 'Obergericht AG',
  sg_gerichte: 'Verwaltungs-/Versicherungsgericht SG',
  gr_gerichte: 'Kantonsgericht GR',
  // BS-Tranche (§3.1): Kopf-Instanz «Aufsichtskommission …» (Anwaltsaufsicht, BGFA).
  bs_aufsichtskommission: 'Aufsichtskommission über die Anwältinnen und Anwälte BS',
};
const SUFFIX_NAME: Record<string, string> = {
  obergericht: 'Obergericht', verwaltungsgericht: 'Verwaltungsgericht',
  versicherungsgericht: 'Versicherungsgericht', sozialversicherungsgericht: 'Sozialversicherungsgericht',
  appellationsgericht: 'Appellationsgericht', kantonsgericht: 'Kantonsgericht',
  handelsgericht: 'Handelsgericht', strafgericht: 'Strafgericht', zivilgericht: 'Zivilgericht',
  kassationsgericht: 'Kassationsgericht',
};
export function gerichtAnzeigename(court: string, canton: string, courtName?: string | null): string {
  if (canton === 'CH') return courtName || 'Bundesgericht';
  if (GERICHT_ANZEIGE[court]) return GERICHT_ANZEIGE[court];
  const parts = String(court).split('_');
  const kt = (parts[0] || '').toUpperCase();
  const name = SUFFIX_NAME[parts.slice(1).join('_')] || 'Kantonales Gericht';
  return `${name} ${kt}`.trim();
}


/** ISO 'YYYY-MM-DD' → 'DD.MM.YYYY' für Zitierungen. */
export function fmtDatumDe(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : String(iso);
}
