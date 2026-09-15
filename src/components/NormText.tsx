import { Fragment } from 'react';
import {
  normVerweiseImText, fremdgesetzNachArtikel, fremdRoutingFormB,
  artikelnPluralVerweise, erkenneFedlexGesetz, SUFFIX_ALT,
  type NormVerweisSpan, type FremdEbene,
} from '../lib/fedlex';
import { NormChip } from './vorlagen/NormChip';
import { RechtsprechungText } from './RechtsprechungLink';
// V-3: Nummer → Anker-Token («6a» → «6_a»). EINE Wahrheit über die Token-Form
// (§5) — dieselbe Funktion, die Popover-Trigger und Suche benutzen; ein zweites
// Format hier liefe beim nächsten Snapshot-Nachzug still daneben. Reines
// Adress-Modul ohne eigene Importe (kein Zyklus, kein Bundle-Zuwachs).
import { parsePassus } from '../lib/normtext/passus';

// ─── Inline-Norm-Auto-Linker (Auftrag David 17.6.2026) ─────────────────────
//
// «Jede genannte Norm soll verlinkt sein.» Bis hierher öffnete das Norm-Popover
// nur an STRUKTURIERTEN Chip-Stellen; Artikel, die im FLIESSTEXT genannt werden
// (Begründungen, Hinweise, Tarif-`hinweis`, Gates-/Ergebnis-Warnungen), waren
// reiner Text. NormText schliesst das: es findet jeden Bund-Normverweis
// («Art. N … GESETZ») im übergebenen Text und macht ihn zum Popover-Trigger —
// der restliche Text bleibt zeichenidentisch (§1: nur Darstellung).
//
// UNIVERSELLER Inline-Verweis-Linker: Normen UND Rechtsprechung. Single source:
//  - NORM_IM_TEXT (fedlex.ts) findet die Norm-Verweise (Gesetz-Namen dort
//    gepflegt), NormChip (ui.tsx) trägt die GESAMTE Popover-Logik (Laden/
//    Overlay/A11y) — NormText dupliziert davon nichts, übergibt nur Inline-Stil.
//  - Die ZWISCHENSTÜCKE (alles, was kein Norm-Verweis ist) laufen durch
//    RechtsprechungText, sodass darin enthaltene BGE/BGer-Zitate ebenfalls
//    verlinkt werden. So genügt EINE Komponente an jeder Fliesstext-Stelle für
//    beide Verweis-Arten (ersetzt das frühere blosse <RechtsprechungText>).
//
// Auflösbarkeit: nur Norm-Treffer, die fedlexLinkFuerArtikel auflöst (Bund),
// werden verlinkt. Nicht auflösbare Nennungen (z. B. kantonale «§ 4», unbekannte
// Gesetze) bleiben Text — NIE ein toter Link (§8). Kantonale Inline-Auflösung
// läuft separat über den Erlass-/Kanton-Kontext der Quelle, nicht hier.
//
// SSR/Prerender: NormChip rendert serverseitig nur den <a> (Popover erst im
// Browser); der erzeugte Text ist zeichenidentisch zum heutigen plain {text}
// (nur zusätzliche <a>-Hüllen), Golden/PDF-Pfade nutzen NormText nicht.

// ─── Ä25/Ä61 · VERWEIS-AUSZEICHNUNG IM FLIESSTEXT ───────────────────────────
// Dezenter Inline-Stil (gepunktete Unterstreichung) — fügt sich in den
// Fliesstext ein, anders als der Pillen-Chip an strukturierten Stellen.
//
// STAND 17.8.2026: die Linie bleibt im RUHEZUSTAND. S2 hatte sie versuchsweise
// auf «Linie erst bei hover/focus-visible» umgestellt (Design-Grundlage Kap. 8);
// der S2-Nachzug hat das ZURÜCKGENOMMEN, und die Design-Frage geht als Entscheid
// an David (Fahrplan Kap. 7, Ä-Tabelle Ä25). Drei gemessene Gründe:
//
//  1. REICHWEITE. Diese Klasse ist die Verweis-Auszeichnung der GANZEN Site,
//     nicht des Lesers: NormText steht in Tarif-Hinweisen, Gates-/Ergebnis-
//     Warnungen und Vorlagen-Texten (~20 prerenderte Rechner-/Vorlagen-Seiten).
//     Eine Leser-Typografie-Etappe darf sie nicht mitziehen.
//  2. WCAG G183. Ohne Linie unterscheidet den Verweis nur noch die FARBE; G183
//     verlangt dafür ≥ 3 : 1 gegen den umgebenden Text. Gemessen am gebauten
//     S2-Stand (chromium, 17.8.2026): 1.00 : 1 auf `/rechner/verjaehrung`
//     (Link und Fliesstext tragen dort dieselbe Farbe), 1.06 : 1 auf den
//     übrigen Rechner-Seiten, 2.14 : 1 im Leser. Die Schwelle ist damit an
//     jeder gemessenen Stelle verfehlt, im Ruhezustand blieb faktisch KEIN
//     nichtfarbliches Signal ausser dem Schriftgewicht.
//  3. AXE-AUSNAHME. `link-in-text-block` ist eine ausdrückliche Ausnahme mit
//     David-Entscheid (`docs/ux-audit-2026-07/BERICHT.md` B-2); ihre Reichweite
//     eigenmächtig auszuweiten ist kein Nachzug.
//
// Warum ein FARB-Token die Frage nicht löst (S2-Rechnung, hier aufbewahrt, weil
// sie in Davids Entscheid eingeht): ein Verweis-Token müsste ZWEI Schranken
// zugleich halten — ≥ 3 : 1 gegen den Fliesstext (G183) UND ≥ 4.5 : 1 gegen den
// Grund (AA für Linktext, SC 1.4.3). In relativer Leuchtdichte L (WCAG-2.x-
// Formel, gerechnet 17.8.2026 aus den Ist-Tokens):
//
//   DUNKEL — Fliesstext #DCD9D2 (L 0.6949) auf Grund #16150F (L 0.0074):
//     3 : 1 gegen den Text verlangt   L ≤ 0.1983
//     4.5 : 1 über dem Grund verlangt L ≥ 0.2084
//     ⇒ das Intervall ist LEER — es gibt keinen solchen Farbwert.
//   HELL — Fliesstext #2B2924 (L 0.0223) auf Grund #FCFAF6 (L 0.9346):
//     heller als der Text: L ∈ [0.1668, 0.1738] ⇒ existiert als ~ein einziger
//     Ton, nützt aber nichts, solange die dunkle Seite leer ist.
//
// §5 (Ä25-Nebenfund, BEHALTEN): der String stand zeichengleich in
// `NormText.tsx` UND `KantonNormText.tsx`. Er ist EINE exportierte Konstante —
// sonst laufen Bund- und Kanton-Verweise beim nächsten Eingriff auseinander. Der
// farbfreie Teil steht getrennt, weil der kantonale §-Trigger dieselbe Linie,
// aber eine andere Hover-Farbe braucht. Jede FARB-Utility bleibt LITERAL in der
// Datei, die sie verwendet — Tailwind liest seine Klassen aus dem Quelltext,
// eine zur Laufzeit zusammengesetzte Farbklasse wäre ein stiller No-op (die
// Bug-Klasse, die `check:design-tokens` Prüfung 2/3 verfolgt).
export const VERWEIS_RUHE = 'underline decoration-dotted underline-offset-2';
export const VERWEIS_INLINE_CLASS = `${VERWEIS_RUHE} hover:text-brass-700`;
const INLINE_CLASS = VERWEIS_INLINE_CLASS;

// ─── V-4 · AUSSEN-ANZEIGE (W2·20-VERWEIS-SCHAERFE, Auftrag David 31.8.2026) ──
//
// «… und wenn es ausserhalb ist, dass es das anzeigt.» Bis hierher trugen der
// Sprung IM gelesenen Erlass und der Verweis in einen ANDEREN Erlass dieselbe
// Klasse — der Unterschied lag allein im Verhalten (Popover/Fedlex vs.
// Scroll-Sprung), also erst NACH dem Klick (Messbericht 31.8.2026, Kernbefund
// 4). Die Ruhe-Optik unterscheidet sie jetzt.
//
// ANATOMIE — bewusst additiv, drei Selbstbeschränkungen:
//  1. KEIN neues Farbwort (das wäre ein David-Entscheid, DESIGN-REGLEMENT §
//     Farb-Wörterbuch) und kein zweites Icon: «↗» ist das ETABLIERTE
//     Aussen-Zeichen des Hauses («amtliche Quelle ↗», «Amtliche Fassung ↗»,
//     NormPopover-Fuss). Der Fremd-Verweis behält die gepunktete Linie und
//     bekommt sie nachgestellt.
//  2. Der SELF-Sprung bleibt unverändert — er ist mit Abstand der häufigste
//     Fall (20 198 der 34 058 Stellen); ihn lauter zu machen hiesse, den
//     Lesetext zu vergröbern.
//  3. Das Zeichen steht als ::after-PSEUDOELEMENT (`lc-verweis-aussen`,
//     index.css), nicht als Textknoten. Zwei Gründe, beide inhaltlich:
//     · §1 — der amtliche Wortlaut bleibt zeichengleich. Ein Textknoten «↗»
//       wanderte beim Kopieren einer Bestimmung in die Zwischenablage und
//       damit in Rechtsschriften; Pseudo-Inhalt tut das nicht.
//     · F2/WCAG — das Signal ist eine FORM, nicht bloss eine Farbe (die
//       Kontrast-Rechnung an VERWEIS_INLINE_CLASS zeigt, dass ein Farb-Token
//       die Doppelschranke gar nicht halten KANN).
//
// REICHWEITE: nur die Lesesicht (`intern` gesetzt). Ausserhalb des Lesers
// (Tarif-Hinweise, Gates-/Ergebnis-Warnungen, Vorlagen-Texte) gibt es kein
// «innen», gegen das sich ein «aussen» abheben könnte — und die Warnung an
// VERWEIS_INLINE_CLASS Ziff. 1 gilt: eine Leser-Etappe zieht die Verweis-
// Auszeichnung der GANZEN Site nicht mit.
export const VERWEIS_AUSSEN_CLASS = `${VERWEIS_INLINE_CLASS} lc-verweis-aussen`;

// ─── Interne Querverweise (Lesesicht, Deep-Research-Befund 7) ───────────────
// In der Gesetzes-Lesesicht sind BARE Artikelverweise («nach Artikel 6a»,
// «gemäss Art. 12») gemeint = Artikel DESSELBEN Erlasses (Drafting-Konvention;
// Fremdgesetze tragen das Kürzel und werden bereits von NORM_IM_TEXT erfasst).
// Solche bare Verweise werden zu Sprung-Links im Reader. Nur aktiv, wenn der
// Reader `intern` übergibt → andere NormText-Aufrufer (golden/PDF, Tarif-Hinweise)
// bleiben unverändert.
export interface InternRefs {
  /** normalisierter Ref («6a») → Artikel-Token des Erlasses («6_a»). */
  tokenMap: Map<string, string>;
  basisPfad: string;
  springeZu: (token: string) => void;
  /** M6-D (W2·5b): Ist gesetzt, zeigen BARE «Art. N»-Verweise NICHT auf den
   *  eigenen Erlass (Self-Sprung), sondern auf DIESES Fremdgesetz-Kürzel — via
   *  NormChip (In-Reader-Popover, wenn im Korpus, sonst Fedlex-Deep-Link). Genutzt
   *  von ArtikelBody für Items unter einem Fremdgesetz-Chapeau, dessen Zielgesetz
   *  deterministisch feststeht (chapeauZielFremdgesetz). Der Self-Pfad (tokenMap)
   *  wird dann übersprungen — es gibt in einem Fremdgesetz-Chapeau kein «eigenes»
   *  Sprungziel (§1: lieber der Fremd-Verweis als ein falscher Self-Link). */
  fremdKuerzel?: string;
  /** F41/F40 (W2·13-KANTONE, 31.8.2026): Der gelesene Erlass zählt seine
   *  Bestimmungen mit «§» (Register-Weiche `bestimmungsEtikett === 'paragraf'`,
   *  abgeleitet in `useInternRefs`). Zwei Folgen, beide nur hier:
   *
   *  F41 — bare «Art. N» wird NICHT mehr self-verlinkt. In einem §-designierten
   *  Erlass heisst die eigene Bestimmung «§ N»; ein bare «Art. N» darin meint
   *  praktisch immer ein ANDERES Gesetz (fast durchwegs Bundesrecht, meist in
   *  der Form «Art. 18 Abs. 2 des Bundesgesetzes …», die keine der Bund-Weichen
   *  fängt). Der Self-Sprung wäre dann ein plausibel-falscher Link. Gemessen
   *  31.8.2026 mit den echten Guards: 199 solcher Self-Links in 82 der 775
   *  §-designierten Erlasse. UNTERDRÜCKT wird nur — es wird NICHT ersatzweise
   *  auf Bundesrecht verlinkt: die Drafting-Konvention ist ein Indiz, kein
   *  Beweis, und kein Link ist besser als ein falscher (§1/§8).
   *
   *  F40 — «§ N» wird self-verlinkt (siehe PARAGRAF_INTERN unten).
   *
   *  Ungesetzt (Bund, Art.-designierte Kantone, Fremdgesetz-Chapeau) ⇒ beides
   *  aus, Rendering byte-identisch zum Stand davor. */
  paragrafDesigniert?: boolean;
  /** V-2 (W2·20-VERWEIS-SCHAERFE): das REGISTER-Kürzel des gelesenen Erlasses
   *  («SLV», «Personalgesetz», «ChemV»). Der Lese-Basispfad trägt den Register-
   *  SCHLÜSSEL, und der ist kantonal die Systematik-Nummer («BS-410.700») — das
   *  Kürzel steht nur im Register-Manifest und wird darum als WERT übergeben
   *  (§3: die Komponente bekommt die Weiche, nicht die Nachschlage-Fähigkeit;
   *  dieselbe Bauart wie `paragrafDesigniert`). Ungesetzt ⇒ Ziel 2 der
   *  Selbstmarker-Weiche ruht, Rendering byte-identisch zum Stand davor. */
  eigenesKuerzel?: string;
  /** V-3 (W2·20-VERWEIS-SCHAERFE): Kürzel → Lese-Adresse der ANDEREN Erlasse
   *  DESSELBEN Kantons. Abgeleitet aus dem Register-Manifest, das der Leser
   *  ohnehin geladen hat (`baueKantonKuerzelKarte`, inhalt-sprung.tsx) — kein
   *  zweiter Client-Index, kein Eager-Fetch. Die Komponente bekommt die fertige
   *  Karte als WERT, nicht die Nachschlage-Fähigkeit (§3, Bauart wie
   *  `eigenesKuerzel`).
   *
   *  Was NICHT drin steht, ist der Kern der Regel (§1): mehrdeutige Kürzel
   *  desselben Kantons, der GELESENE Erlass selbst und alles ohne
   *  Register-Treffer fehlen — dort bleibt es Text. Ungesetzt (Bund, Kanton
   *  ohne Karte) ⇒ die Weiche ruht, Rendering byte-identisch. */
  kantonKuerzel?: ReadonlyMap<string, string>;
}
// ─── Linker-Memo (W2·24-PERF-REST) ──────────────────────────────────────────
//
// WARUM. Der Verweis-Linker ist rein und deterministisch (§2): gleiche Eingabe
// ⇒ gleiche Ausgabe. Der Leser rendert die Artikelliste beim Seitenaufbau aber
// MEHRFACH — gemessen 15.9.2026 auf `/gesetze/bund/OR`, dist-Preview, CPU×4,
// Kadenz «reines Laden, kein Scrollen», n=3 (CDP `Profiler.startPreciseCoverage`,
// also gezählt, nicht geschätzt):
//
//   · `artikelnPluralVerweise`  16 420 Aufrufe für 4 850 Snapshot-Texte (OR) —
//     11 515 bis «bedienbar», 4 905 NOCH DANACH, also 3.35 volle Durchgänge;
//   · `fremdRoutingFormB`        1 125 Aufrufe (802 + 323) auf demselben Weg.
//
// Die Wiederholung kostete 1 088 ms bzw. 1 079 ms Self-Time @CPU×4. Das ist die
// offene Position aus `abnahme/design-identitaet/PERF-LESER.md` §7; die dortige
// Vermutung («laufen vielfach über denselben Text») ist damit belegt — nicht
// vielfach je Fragment, sondern einmal je Fragment und je Render-Durchgang.
//
// WAS. Ein Ergebnis-Speicher VOR den beiden Aufrufen. Er verändert nichts am
// Ergebnis (dieselbe reine Funktion, dasselbe Objekt) und liegt bewusst in der
// DARSTELLUNGSSCHICHT (§3): die Wiederholung entsteht beim Rendern, nicht in der
// Rechtslogik — `src/lib/fedlex/parser.ts` bleibt unberührt und rein.
//
// SCHLÜSSEL. Ebene + Erlass + Text — nie der Text allein. Skill `perf`,
// Bauregel 4: ein globaler Token-Key kollidiert zwischen Erlassen; derselbe Satz
// löst in einem kantonalen Erlass anders auf als im OR (`ebene`), und «des
// Gesetzes» zielt je gelesenem Erlass auf ein anderes Trägergesetz (`erlassKey`).
// Beide Funktionen werden aus DIESER Datei ausschliesslich mit dem hier
// gebildeten Schlüsseltupel aufgerufen — `fremdRoutingFormB` insbesondere immer
// ohne `zielTokenExistiert` (Prädikat fest `undefined`), sonst wäre es Teil des
// Schlüssels. `\u0000` trennt die Felder: es kommt in keinem Normtext vor.
//
// DECKEL. Kein Leck: läuft der Speicher voll (viele Erlasse in einer Sitzung,
// Prerender-Lauf über 1 570 Erlasse), wird er ganz geleert. Das ändert nur, wie
// oft gerechnet wird, nie WAS herauskommt — der Speicher ist beobachtungsfrei.
const LINKER_MEMO = new Map<string, unknown>();
const LINKER_MEMO_DECKEL = 50_000;
function linkerMemo<T>(schluessel: string, rechne: () => T): T {
  if (LINKER_MEMO.has(schluessel)) return LINKER_MEMO.get(schluessel) as T;
  const wert = rechne();
  if (LINKER_MEMO.size >= LINKER_MEMO_DECKEL) LINKER_MEMO.clear();
  LINKER_MEMO.set(schluessel, wert);
  return wert;
}
const normRef = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');
// Kürzel-Kanon für IDENTITÄTS-Vergleiche (nur A–Z0–9): der Register-Schlüssel
// trägt «_» (FINFRAV_FINMA), der FEDLEX-Key «-» (FinfraV-FINMA). Stand seit N2
// im Rumpf von `restMitIntern`; seit V-2 brauchen ihn auch die Span-Weiche in
// `NormText` und `nenntEigenesKuerzel` — EINE Definition, nicht drei (§5).
const kuerzelKanon = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
// «Art. N» / «Artikel N» (+ Buchstabe UND/ODER lat. Suffix als SEPARATE Gruppen,
// damit «329gbis»/«10bis» VOLLSTÄNDIG erfasst werden — nicht «329g»/«10b»; analog
// fedlex.ts). `(?![0-9a-z])` verhindert das `\d+`/Suffix-Backtracking, das sonst
// «Art. 20 des OR» auf «Art. 2» und «Art. 119bis …» auf «Art. 119b» verkürzte.
// Der frühere `(?!\s+(?:des|der|über|vom))`-Lookahead ist ENTFERNT (N2b, 4.7.2026):
// er blockierte das MATCHING von «Artikel 63 des Obligationenrechts (OR)» und
// verhinderte damit das Fremdgesetz-Routing der ausgeschriebenen Form. Die
// Fremd-/Verordnungs-Unterdrückung (bare «des/der …» ohne Klammer-Kürzel) läuft
// jetzt im Schleifenkörper NACH der N2b-Routing-Prüfung (identisches Ergebnis für
// die bare-«des»-Fälle, aber die «(KÜRZEL)»-Form wird nicht mehr verschluckt).
// Z6 a (14.9.2026): die Suffix-Alternation kommt aus der GETEILTEN Reihe
// (`lib/fedlex/nummer.ts`, §5) statt als sechste Handkopie hier zu stehen —
// sonst erkennt der Linker «Artikel 179octies» gar nicht, oder (schlimmer, wenn
// man ihn hier allein weitete) er erzeugte den Anker «#art-179octies», den kein
// Snapshot führt. `artikelToken` und `fedlexLinkFuerArtikel` lesen dieselbe
// Reihe, darum bleiben Erkennung und Anker-Form zwingend deckungsgleich.
const ART_INTERN = new RegExp(String.raw`\bArt(?:\.|ikel)\s+(\d+(?:[a-z])?${SUFFIX_ALT}?)(?![0-9a-z])`, 'g');

// ─── F40 · «§ N»-Selbstverweise in §-designierten Erlassen ───────────────────
// Vorbild ist `RE_PARAGRAF` (KantonNormText.tsx), aber mit der Zerlegung von
// ART_INTERN: die NUMMER ist eine eigene Gruppe (für die tokenMap), Buchstabe
// und lat. Suffix sind SEPARATE Alternativen, und `(?![0-9a-z])` schliesst ab.
// RE_PARAGRAF schreibt `\d+[a-z]?(?:bis|ter)?` ohne Grenze und zerlegt «§ 12bis»
// in «§ 12b» + «is» — dort bloss eine ungenaue Popover-Markierung, hier ein Link
// auf den FALSCHEN Paragraphen (§1). Verlinkt wird — wie beim Art.-Pfad — nur
// «§ N»; ein nachfolgender Passus bleibt Text.
const PARAGRAF_INTERN =
  /§\s*(\d+(?:[a-z])?(?:bis|ter|quater|quinquies|sexies)?)(?![0-9a-z])/g;
// Was zu DEMSELBEN Zitat gehört und darum überlesen werden muss, bevor das
// Fremd-Signal geprüft wird: Passus-Glieder («Abs. 2», «Absatz 2 Buchstabe a»)
// und Aufzählungen/Bereiche («§ 19 bis 21», «§ 4 und 5»). Ohne diesen Schritt
// stünde bei «§ 19 bis 21 der Verordnung über …» nach dem Treffer « bis 21 …»,
// keine Fremd-Weiche griffe, und der fremde Verordnungs-§ bekäme einen Link auf
// den eigenen Erlass (echte Fundstelle, SO-615.11 § 50).
const PARAGRAF_ANHANG = new RegExp(
  '^(?:'
  + '\\s+(?:Abs(?:atz|ätze|\\.)|Buchstaben?|Bst\\.|lit\\.|Ziff(?:ern?|\\.)|Satz|Sätze)\\s*[0-9a-z]+(?:bis|ter)?'
  + '|\\s*(?:bis|und|oder|sowie|,|–|—|-)\\s*(?:§+\\s*)?\\d+(?:[a-z])?(?:bis|ter)?(?![0-9a-z])'
  + ')+',
);
// Fremd-Signal NACH dem Zitat. Zwei Formen, beide führen zu reinem TEXT: ein
// «StG» in BS ist nicht das «StG» in ZH, und ohne verifizierte Kantons-
// Auflösung ist jeder Link geraten (§1 — F42 ist nicht gebaut).
//
// (a) Ein GROSS beginnendes Wort direkt am Zitat. Der Art.-Pfad prüft hier auf
//     ein Kürzel-Muster (M12: zwei Grossbuchstaben); kantonal genügt das NICHT.
//     Kantone hängen den AUSGESCHRIEBENEN Erlassnamen an, und der trägt genau
//     EINEN Grossbuchstaben: «§ 8 Abs. 3 Integrationsgesetz», «§ 24
//     Schullaufbahnverordnung», «§ 15 Abs. 1 lit. g Bestattungsgesetz».
//     GEMESSEN 31.8.2026 über alle 775 §-Erlasse: 122 der sonst erzeugten 3389
//     Self-Links tragen ein solches Grosswort, und die Stichprobe daraus ist
//     ganz überwiegend FREMD (Integrations-, Publikations-, Lohn-, Personal-,
//     Heilmittel- … -gesetz/-verordnung). Einen Satz-ANFANG trifft die Regel
//     nicht — dort steht die Interpunktion vor dem Leerzeichen. Der Preis sind
//     die wenigen Fälle, in denen das Grosswort ein gewöhnliches Substantiv ist
//     («§§ 13–18 Pauschalgebühren festlegen»); bewusst bezahlt — kein Link ist
//     besser als ein falscher.
// (b) Der ausgeschriebene Erlassname in Präpositionsform, klein beginnend
//     («§§ 19 bis 21 der Verordnung über …») — wie die bare-«des/der»-Weiche
//     des Art.-Pfads.
const PARAGRAF_FREMD_GROSS = /^\s+[A-ZÄÖÜ]/;
const PARAGRAF_FREMD_NAME = /^\s+(?:des|der|über|vom)\b/;

// ─── V-2 · SELBSTMARKER-WEICHE VOR DEN FREMD-GUARDS (W2·20-VERWEIS-SCHAERFE) ─
//
// Alle Guards oben sind Fremd-VERMUTUNGEN: ein «des …» am Zitat, ein Grosswort,
// zwei Grossbuchstaben. Sie sind richtig kalibriert, aber sie treffen auch
// Verweise, die den eigenen Erlass AUSDRÜCKLICH benennen — und ein
// ausdrückliches Signal im Wortlaut schlägt jede Vermutung (§1: kein Link ist
// besser als ein falscher, aber ein benannter Selbstverweis ist kein Raten).
//
// HARTE GRENZE: nur EXPLIZITE Signale, nichts Heuristisches. Zwei gibt es:
//
//  (1) Die Selbst-WENDUNG. «des vorliegenden Gesetzes», «der vorliegenden
//      Verordnung», «dieses Vertrages» … Gemessen 31.8.2026 über alle 1 458
//      Snapshots (132 616 Blöcke): «des vorliegenden Gesetzes» 37 ·
//      «der vorliegenden Verordnung» 7 · «des vorliegenden Vertrages/Vertrags» 2
//      — «vorstehenden»/«nachstehenden» kommen NULL Mal vor und stehen darum
//      nicht im Muster (in einem Änderungserlass wären sie ohnehin mehrdeutig).
//      Kein bestimmtes Substantiv verlangt: «vorliegend»/«dieser» + gross
//      beginnendes Wort IST das Signal (Gesetz, Verordnung, Vertrag, Erlass,
//      Reglement, Dekret, Statut). Eine Nomen-Liste wäre eine zweite Wahrheit,
//      die beim nächsten Korpus-Nachzug still danebenläge (§5).
//      Die «dieses/dieser …»-Familie ist mitgeschrieben, weil sie dasselbe sagt;
//      sie fiel bisher nur deshalb nicht in den des/der-Guard, weil das Zitat
//      nicht mit «des»/«der» weitergeht (528 der 548 verweis-tragenden
//      Selbstmarker-Stellen sind darum schon heute verlinkt). Ihr einziger
//      MESSBARER Zugewinn ist der F41-Fall unten.
//  (2) Das EIGENE Kürzel. Steht am Zitat exakt das Register-Kürzel des
//      gelesenen Erlasses, ist der Verweis ein Selbstverweis — 13 gemessene
//      Stellen in zwei Erlassen (BS-162.100 «§ 19 Personalgesetz»,
//      BS-410.700 «§ 41 SLV»), alle nachgeprüft. Verglichen wird EXAKT mit
//      Wortgrenze, nie unscharf (§7). Restrisiko, bewusst getragen und im
//      Korpus heute nicht belegt: ein gleichnamiger Erlass eines ANDEREN
//      Kantons («§ 5 Personalgesetz des Kantons Zürich») würde mitgefangen —
//      13/13 gemessene Stellen sind eigenbezüglich.
//
// Das Signal gehört zum ZITAT, nicht zum Satz: der Passus («Abs. 2»,
// «Ziff. 3 lit. a») und Aufzählungsglieder («§ 19 bis 21») werden zuerst
// überlesen (`PARAGRAF_ANHANG`, dieselbe Definition wie im §-Pfad). Genau daran
// hing der Zwilling des Messberichts: AHVG Art. 9 «Artikel 8 des vorliegenden
// Gesetzes» fiel in den des/der-Guard, AIG Art. 80a «Artikel 66 Absatz 1 des
// vorliegenden Gesetzes» nicht — dieselbe Wendung, zwei Ergebnisse, allein
// wegen des Passus dazwischen.
// «dieses TITELS/Abschnitts/Kapitels …» meint eine GLIEDERUNGSEINHEIT, nie den
// Erlass — ZGB Schlusstitel Art. 13d zitiert «Artikel 8a dieses Titels»
// (V-1-Fund 31.8.2026, im Inventar als totes Selbstziel sichtbar geworden):
// heute degradiert das nur zu Text, mit vorhandenem Ziel-Token wäre es ein
// FALSCHER Link (§1). Darum der Ausschluss der Gliederungs-Genitive.
const SELBST_MARKER = /^\s*(?:(?:des|der)\s+vorliegenden|dies(?:es|er))\s+(?!Titels|Abschnitts|Kapitels|Anhangs|Teils|Buches|Hauptst)[A-ZÄÖÜ]/;
// «dieses Titels/Abschnitts/Kapitels …» meint eine GLIEDERUNGSEINHEIT, nie den
// Erlass (V-1-Fund 31.8.2026: ZGB SchlT Art. 13d «Artikel 8a dieses Titels» —
// gemeint ist SchlT-Art. 8a, nicht ZGB-Art. 8a). Die tokenMap adressiert
// Einheiten nicht ⇒ jeder Sprung wäre geraten. Aktiver Unterdrücker in BEIDEN
// Pfaden, nicht nur Ausschluss im Selbstmarker (§1: kein Link statt falscher).
const GLIEDERUNGS_GENITIV = /^\s*dies(?:es|er)\s+(?:Titels|Abschnitts|Kapitels|Anhangs|Teils|Buches|Hauptst\w*)\b/;
// V-7d (14.9.2026): «des Gesetzes» ist NIE ein Selbstverweis — der eigene
// Erlass heisst «dieses Gesetzes»/«dieser Verordnung» (SELBST_MARKER oben).
// Die belegten Fälle löst die Trägergesetz-Tabelle VOR dieser Weiche auf; hier
// bleibt nur die unbelegte Restklasse, und die wird Text (§1). Enge Gegenprobe
// zum des/der-Guard, der bewusst am ROHEN Rest steht und «Artikel 124 Absatz 2
// des Gesetzes» darum nicht sieht. Herleitung, Messung und der belegte Anlass
// (KKV art_128) stehen bei TRAEGER_EINTRAEGE in `lib/fedlex/traegergesetz.ts`.
const GESETZES_GENITIV = /^\s*des\s+Gesetzes\b/;
/** Nennt der Text direkt hinter dem Zitat exakt das Kürzel DIESES Erlasses? */
function nenntEigenesKuerzel(rest: string, kuerzel?: string): boolean {
  const k = (kuerzel ?? '').trim();
  if (!k) return false;
  const ohneRaum = rest.replace(/^\s+/, '');
  if (ohneRaum.length === rest.length) return false; // kein Trenner ⇒ kein eigenes Wort
  if (!ohneRaum.startsWith(k)) return false;
  const nach = ohneRaum.slice(k.length);
  // Wortgrenze — und der BINDESTRICH zählt dazu. Die Schwester-Erlasse der
  // Finanzmarktaufsicht hängen ihn an ein sonst identisches Kürzel: «KKV-FINMA»
  // beginnt mit «KKV». Ohne diese Zeile bekam «Artikel 112 Absatz 1 KKV-FINMA»
  // in der KKV einen Self-Sprung auf KKV Art. 112 — ein anderer Erlass, ein
  // falscher Link (gemessen im SSR-Vorher/Nachher-Lauf 31.8.2026, KKV
  // Art. 126zocties; §1). Der Punkt bleibt erlaubt, sonst zerfiele «§ 41 SLV.»
  // am Satzende.
  return nach === '' || !/[\p{L}\p{N}-]/u.test(nach[0]);
}
/** Explizites Selbst-Signal am Zitat (Wendung ODER eigenes Kürzel)?
 *  Im Fremdgesetz-Chapeau (M6-D) IMMER falsch: dort meint «dieses Gesetzes»
 *  den Erlass des Chapeaus, nicht den gelesenen — und ein Self-Sprung wäre
 *  genau der plausibel-falsche Link, den §1 verbietet. */
function selbstSignalAmZitat(rest: string, intern: InternRefs): boolean {
  if (intern.fremdKuerzel) return false;
  const nachPassus = rest.replace(PARAGRAF_ANHANG, '');
  return SELBST_MARKER.test(nachPassus) || nenntEigenesKuerzel(nachPassus, intern.eigenesKuerzel);
}

// ─── V-3 · KANTON-KÜRZEL-RESOLVER (W2·20-VERWEIS-SCHAERFE) ──────────────────
//
// Der Grosswort-Guard des §-Pfads (PARAGRAF_FREMD_GROSS) sperrt jedes gross
// beginnende Wort am Zitat, weil «ein StG in BS ist nicht das StG in ZH».
// Diese Begründung nennt zugleich ihre Auflösung: INNERHALB eines Kantons ist
// das Kürzel eindeutig — und der Kanton des gelesenen Erlasses steht fest.
// Gemessen 31.8.2026 über alle 775 §-designierten Erlasse: 566 heute
// unterdrückte Stellen nennen ein Kürzel, das im SELBEN Kanton genau EINEN
// anderen Erlass bezeichnet (61 verschiedene Kürzel; Beleg-Fall des Auftrags:
// BS-111.100 § 143 «§ 6 IRG» → BS-131.100). Die Sichtprobe über alle 61 zeigt
// durchgehend das erwartete Muster «Verordnung zitiert ihr Gesetz».
//
// NUR IM §-PFAD, und das ist eine gemessene Grenze, keine Bequemlichkeit. Im
// Art.-Pfad (M12) wären 94 weitere Stellen «auflösbar», aber die Bundeserlasse
// zitieren sich mit «Art.», und ihre Kürzel kollidieren mit kantonalen:
// «Art. 17 EnG (ZEV …)» in BS-772.400 meint das BUNDES-Energiegesetz, nicht
// BS-772.100; ebenso «Art. 43 VPG» (Postverordnung ≠ Verordnung zum
// Personalgesetz), «Art. 22 BZG» (Bevölkerungsschutz ≠ Bildungszentrum
// Gesundheit), «Art. 5 NAV Hauswirtschaft». Rund ein Viertel der 94 wäre
// falsch — «§ N» dagegen ist eine kantonale Zitierform, in der ein
// Bundeserlass praktisch nie steht (§1: kein Link ist besser als ein
// falscher). Der Art.-Pfad bleibt darum unangetastet.
//
// ZIEL-EXISTENZ: dass der Ziel-Erlass die zitierte Bestimmung führt, ist
// clientseitig ohne Fetch nicht prüfbar (die tokenMap kennt nur den gelesenen
// Erlass) — ein Eager-Fetch fremder Snapshots wäre §15-widrig. Der Link zeigt
// darum auf `<Ziel-Erlass>#art-<N>`; der Register-Eintrag garantiert die SEITE,
// und ein unbekannter Anker lässt den Leser den Erlass am Anfang zeigen. Das
// ist kein toter Link, aber auch keine Trefferzusage — ausgewiesen im
// V-1-Artefakt (Klasse `paragraf-kanton-kuerzel`).
//
// NAVIGATIONS-FORM: ein blosser `<a href>` ohne onClick — wie der interne Pfad
// des NormChip (`readerHrefFuerRef`). Der Sprung führt in einen ANDEREN Erlass,
// also nicht in die tokenMap-/`springeZu`-Welt dieses Lesers; und NormText
// rendert auch ausserhalb eines Routers (SSR, Prerender, Unit-Tests), wo ein
// Router-Hook werfen würde. Preis: der Klick lädt die Zielseite neu statt
// SPA-weich zu navigieren — ein Router-Callback durch `InternRefs` wäre die
// nächste Ausbaustufe (offener Rest, gemeldet).
const KANTON_KUERZEL_TOKEN = /^\s+(\S+)/;
// Satzzeichen am Zitat-Ende gehören nicht zum Kürzel («§ 34 BPV).», «§ 12 TV;»).
// Der BINDESTRICH steht bewusst NICHT hier: «§ 6 SoHaG-Anhang» ist ein anderer
// Erlass als SoHaG — dieselbe Wortgrenzen-Lehre wie KKV vs. KKV-FINMA (V-2).
const KANTON_KUERZEL_INTERPUNKTION = /[.,;:)\]]+$/;
/** V-6: kanonisiertes Kürzel-Wort direkt am Zitat (ohne Satzzeichen) — für den
 *  Identitäts-Vergleich des M12-Guards. Dieselbe Wort- und Interpunktions-
 *  Definition wie `kantonZielAmZitat` (§5, eine Definition statt zweier). */
function kuerzelAmZitat(rest: string): string {
  const m = KANTON_KUERZEL_TOKEN.exec(rest);
  return m ? kuerzelKanon(m[1].replace(KANTON_KUERZEL_INTERPUNKTION, '')) : '';
}
/** Lese-Adresse des Erlasses, dessen Kürzel direkt am Zitat steht — sonst null. */
function kantonZielAmZitat(rest: string, intern: InternRefs): string | null {
  const karte = intern.kantonKuerzel;
  if (!karte) return null;
  const m = KANTON_KUERZEL_TOKEN.exec(rest.replace(PARAGRAF_ANHANG, ''));
  if (!m) return null;
  return karte.get(m[1].replace(KANTON_KUERZEL_INTERPUNKTION, '')) ?? null;
}

function restMitIntern(s: string, key: string, intern?: InternRefs): React.ReactNode {
  if (!intern || !s) return s ? <RechtsprechungText key={key} text={s} /> : null;
  // N2 (Bündel N): Kürzel DIESES Erlasses (aus dem Lese-Basispfad, «…/bund/AHVV»
  // → «AHVV») — nennt ein Verweis exakt das eigene Kürzel, ist es ein echter
  // Self-Verweis und bleibt verlinkt; ein FREMDES Kürzel unterdrückt den Link.
  // Normalisiert (nur A–Z0–9): der Register-Schlüssel trägt «_» (FINFRAV_FINMA),
  // der FEDLEX-Key «-» (FinfraV-FINMA) — ohne Normalisierung würde ein Gesetz mit
  // getrenntem Kürzel den eigenen Self-Verweis fälschlich unterdrücken (QS-GP-Fund
  // 1.7.: FinfraV-FINMA art_50a, betrifft alle 6 getrennt-benannten Kind-Erlasse).
  // V-7c (W2·20): der ROHE Register-Key des gelesenen Erlasses — Schlüssel der
  // Trägergesetz-Tabelle («des Gesetzes» in einer Vollzugsverordnung).
  const erlassKey = intern.basisPfad.split('/').pop() ?? '';
  const eigenesKuerzel = kuerzelKanon(erlassKey);
  // A10 (Plural-Linker, David 5.7.2026): «in den Artikeln 31 …, 35 … und 45 …» —
  // jedes Glied EINZELN verlinken. Die Regionen werden VOR dem Singular-Lauf
  // erhoben; ART_INTERN-Treffer, die in eine Region fallen (der Öffner «die
  // Artikel 22» enthält ein Singular-Match), werden übersprungen. Auflösung je
  // Glied: fremd (Gesetz-Signal am Ende, inkl. Genitiv-Map) → NormChip aufs
  // Fremdgesetz; eigenes Kürzel oder kein Signal → Self-Sprung über die tokenMap
  // (nur existierende Token, §8); unterdrückte Regionen bleiben reiner Text (§1).
  // §-designierter Erlass? Schaltet BEIDE Kantons-Regeln (Herleitung an
  // `InternRefs.paragrafDesigniert`): F41 sperrt den bare-«Art. N»-Self-Sprung
  // (Singular wie Plural-Glied), F40 öffnet den «§ N»-Self-Sprung. Die
  // FREMD-Pfade (N2b-Routing, Fremdgesetz-Chapeau) bleiben unberührt — sie
  // zeigen ohnehin nie auf den eigenen Erlass.
  const paragrafErlass = intern.paragrafDesigniert === true;
  // V-7 (W2·20): Ebene des gelesenen Erlasses — in kantonalen Erlassen lösen
  // nur ebenenübergreifend eindeutige Bund-Namen auf (`positivliste.ts`).
  const ebene: FremdEbene = ebeneFuer(intern.basisPfad);
  // Memo-Schlüssel: Ebene + gelesener Erlass + Text (s. `linkerMemo`). Das
  // Ergebnis wird hier nur GELESEN (`some`/`for…of`) — kein Aufrufer mutiert
  // eine Region, der geteilte Wert bleibt damit gültig.
  const pluralRegionen = linkerMemo(`p\u0000${ebene}\u0000${erlassKey}\u0000${s}`,
    () => artikelnPluralVerweise(s, ebene, erlassKey));
  const inPluralRegion = (idx: number) =>
    pluralRegionen.some((r) => idx >= r.oeffnerStart && idx < r.end);
  const out: React.ReactNode[] = [];
  let last = 0;
  // Verlinkbare Spans (Singular + Plural-Glieder) einsammeln, dann in Text-
  // Reihenfolge mit Zwischenstücken emittieren.
  const linkSpans: { start: number; end: number; node: React.ReactNode }[] = [];
  for (const r of pluralRegionen) {
    if (r.unterdruecken) continue;
    // Fremd-Ziel = eigener Erlass ⇒ Self-Pfad (wie N2: eigenes Kürzel ist kein
    // Fremdgesetz — der In-Reader-Sprung ist die etablierte Self-Darstellung).
    const fremdEffektiv = r.fremd && kuerzelKanon(r.fremd) !== eigenesKuerzel ? r.fremd : null;
    for (const g of r.glieder) {
      const gk = `${key}-p${g.start}`;
      if (fremdEffektiv) {
        linkSpans.push({
          start: g.start, end: g.end,
          node: <NormChip key={gk} artikel={`Art. ${g.roh} ${fremdEffektiv}`} anzeige={g.roh} linkClass={VERWEIS_AUSSEN_CLASS} zielIntern={false} />,
        });
      } else if (intern.fremdKuerzel) {
        // M6-D: bare Plural-Glied im Fremdgesetz-Chapeau → aufs Zielgesetz (NormChip).
        linkSpans.push({
          start: g.start, end: g.end,
          node: <NormChip key={gk} artikel={`Art. ${g.roh} ${intern.fremdKuerzel}`} anzeige={g.roh} linkClass={VERWEIS_AUSSEN_CLASS} zielIntern={false} />,
        });
      } else {
        if (paragrafErlass) continue; // F41
        const token = intern.tokenMap.get(normRef(g.roh));
        if (!token) continue; // kein Artikel dieses Erlasses → Text belassen (§8)
        linkSpans.push({
          start: g.start, end: g.end,
          node: (
            <a key={gk} href={`${intern.basisPfad}#art-${token}`}
              onClick={(e) => { e.preventDefault(); intern.springeZu(token); }}
              className={INLINE_CLASS}>{g.roh}</a>
          ),
        });
      }
    }
  }
  // F40: «§ N»-Selbstverweise. NUR in §-designierten Erlassen — dort ist «§ N»
  // die eigene Bestimmung (Drafting-Konvention des Kantons), und die tokenMap
  // trägt genau deren Token. Sie reisen im SELBEN Span-Kanal wie die
  // Plural-Glieder (unten in Text-Reihenfolge emittiert), damit es nur EINE
  // Zusammensetz-Maschinerie gibt.
  if (paragrafErlass) {
    for (const m of s.matchAll(PARAGRAF_INTERN)) {
      const start = m.index, end = start + m[0].length;
      if (inPluralRegion(start)) continue; // gehört zu einer «die Artikel …»-Region
      // Erst den Rest DESSELBEN Zitats überlesen (Passus, Aufzählung), dann das
      // Fremd-Signal prüfen ⇒ bei Treffer reiner Text (§1: kein geratener Link).
      const rest = s.slice(end).replace(PARAGRAF_ANHANG, '');
      // V-2: ein AUSDRÜCKLICHES Selbst-Signal («§ 59 Abs. 2 des vorliegenden
      // Gesetzes», «§ 19 Personalgesetz» im Personalgesetz) steht VOR beiden
      // Fremd-Guards — sonst fängt der Grosswort-Guard das eigene Kürzel.
      const selbst = selbstSignalAmZitat(s.slice(end), intern);
      // V-3: … und ist es NICHT der eigene Erlass, kann das Grosswort trotzdem
      // ein benannter Erlass DESSELBEN Kantons sein (Herleitung an
      // `kantonZielAmZitat`). Steht VOR den Fremd-Guards, weil es genau die
      // Stellen sind, die sie unterdrücken; der Selbst-Fall gewinnt weiterhin.
      const kantonZiel = selbst ? null : kantonZielAmZitat(s.slice(end), intern);
      if (kantonZiel) {
        const zielToken = parsePassus(m[0])?.artikelToken;
        if (zielToken) {
          linkSpans.push({
            start, end,
            node: (
              <a key={`${key}-k${start}`} href={`${kantonZiel}#art-${zielToken}`}
                className={VERWEIS_AUSSEN_CLASS}>{m[0]}</a>
            ),
          });
          continue;
        }
      }
      if (!selbst
        && (PARAGRAF_FREMD_GROSS.test(rest) || PARAGRAF_FREMD_NAME.test(rest)
          || GLIEDERUNGS_GENITIV.test(rest))) continue;
      const token = intern.tokenMap.get(normRef(m[1]));
      if (!token) continue; // keine solche Bestimmung in diesem Erlass → Text (§8)
      linkSpans.push({
        start, end,
        node: (
          <a key={`${key}-s${start}`} href={`${intern.basisPfad}#art-${token}`}
            onClick={(e) => { e.preventDefault(); intern.springeZu(token); }}
            className={INLINE_CLASS}>{m[0]}</a>
        ),
      });
    }
    // Die Plural-Glieder kamen in Text-Reihenfolge, die §-Treffer angehängt —
    // der Cursor unten setzt Sortierung voraus. Überlappungen sind nach
    // `inPluralRegion` keine mehr zu erwarten; `emitPluralBis` verwirft sie
    // ohnehin (`sp.start < last`).
    linkSpans.sort((a, b) => a.start - b.start);
  }
  // Plural-Glieder-Spans in Text-Reihenfolge VOR der jeweils nächsten Singular-
  // Emission ausgeben (ein Cursor über linkSpans; Spans in schon konsumierten
  // N2b-Regionen werden verworfen).
  let pq = 0;
  const emitPluralBis = (pos: number) => {
    while (pq < linkSpans.length && linkSpans[pq].start < pos) {
      const sp = linkSpans[pq++];
      if (sp.start < last) continue; // von einer N2b-Region konsumiert
      if (sp.start > last) out.push(<RechtsprechungText key={`${key}-r${last}`} text={s.slice(last, sp.start)} />);
      out.push(sp.node);
      last = sp.end;
    }
  };
  for (const m of s.matchAll(ART_INTERN)) {
    // Von einer bereits verbrauchten Fremd-Region übersprungen (N2b konsumiert die
    // ganze «Artikel N … (KÜRZEL)»-Einheit; ein späterer Treffer darin entfällt).
    if (m.index < last) continue;
    // In einer Plural-Region (A10): die Glieder-Spans oben decken sie ab.
    if (inPluralRegion(m.index)) continue;
    emitPluralBis(m.index);
    const start = m.index;
    const rest = s.slice(start + m[0].length);
    // N2b (Bug David 4.7.2026): AUSGESCHRIEBENES Fremdgesetz mit Klammer-Kürzel
    // («Artikel 66a oder 66abis des Strafgesetzbuchs (StGB) …»). Jede genannte
    // Nummer — die erste UND jedes Aufzählungs-Glied — wird EINZELN auf das
    // Fremdgesetz geroutet (NormChip: In-Reader-Popover, wenn der Erlass im Korpus
    // ist, sonst Fedlex-Deep-Link; unbekanntes Kürzel → reiner Text). Das
    // deterministische Signal ist das «(KÜRZEL)» in der Klammer (§1, kein Raten).
    // Kein Prädikat hier → optimistische Verlinkung (etablierte Fremdverweis-
    // Darstellung, wie NORM_IM_TEXT-Treffer); die Existenz gegen den Ziel-Erlass
    // prüft das Popover beim Öffnen. Läuft VOR der Self-Link-Logik, damit «Artikel
    // 49a … (MStG)» nie fälschlich auf den eigenen Erlass (AIG art_49_a) zeigt.
    // Memo wie beim Plural-Lauf (s. `linkerMemo`): der Schlüssel trägt ZUSÄTZLICH
    // die erste Artikelnummer `m[1]` — sie geht als `ersteNummer` in das Ergebnis
    // ein (erstes Glied), derselbe `rest` mit anderer Nummer ist ein anderer Fall.
    const routing = linkerMemo(`f\u0000${ebene}\u0000${erlassKey}\u0000${m[1]}\u0000${rest}`,
      () => fremdRoutingFormB(rest, m[1], undefined, ebene, erlassKey));
    // V-7: nennt der Volltitel den GELESENEN Erlass, ist es kein Fremdverweis —
    // dann kein Fremd-Chip auf sich selbst; der Rest läuft durch die Self-Weichen.
    if (routing && kuerzelKanon(routing.gesetz) !== eigenesKuerzel) {
      if (start > last) out.push(<RechtsprechungText key={`${key}-r${last}`} text={s.slice(last, start)} />);
      let cur = 0; // Cursor im rest-Text
      for (const g of routing.glieder) {
        const anzeige = g.erst ? m[0] : g.roh;
        const gk = g.erst ? `${key}-f${start}` : `${key}-f${start}-${g.start}`;
        if (!g.erst && g.start > cur) out.push(<RechtsprechungText key={`${key}-rg${start}-${cur}`} text={rest.slice(cur, g.start)} />);
        out.push(g.linkbar
          ? <NormChip key={gk} artikel={g.artikel} anzeige={anzeige} linkClass={VERWEIS_AUSSEN_CLASS} zielIntern={false} />
          : <RechtsprechungText key={`${gk}-t`} text={anzeige} />);
        if (!g.erst) cur = g.end;
      }
      if (cur < routing.regionEnd) out.push(<RechtsprechungText key={`${key}-rt${start}`} text={rest.slice(cur, routing.regionEnd)} />);
      last = start + m[0].length + routing.regionEnd;
      continue;
    }
    // Bare «Art. N des/der/über/vom …» OHNE Klammer-Kürzel (N2b traf nicht): ein
    // benannter Fremderlass oder eine «des vorliegenden …»-Wendung — NIE ein Self-
    // Sprung (§1). Ersetzt den früheren ART_INTERN-Lookahead an Ort und Stelle,
    // aber ERST nach der N2b-Routing-Prüfung (sonst würde «Artikel 63 des OR (…)»
    // fälschlich unterdrückt statt geroutet). Fedlex-Kürzel-Fälle fängt zusätzlich
    // die N2-Prüfung unten; dieser Check deckt auch Nicht-FEDLEX-Namen («der
    // Verordnung») ab, die tokenMap sonst fälschlich self-verlinken würde.
    // V-2 (W2·20): ausdrückliches Selbst-Signal am Zitat? Dann greift KEINE der
    // vier Fremd-Vermutungen unten (des/der, N2, M12, F41) — Herleitung und
    // Messung bei `SELBST_MARKER`. Der Fremdgesetz-Chapeau-Pfad (M6-D) bleibt
    // unberührt: `selbstSignalAmZitat` ist dort per Definition falsch.
    const selbst = selbstSignalAmZitat(rest, intern);
    // V-6 (W2·20): Rest DESSELBEN Zitats ohne Passus- und Aufzählungsglieder —
    // dieselbe Definition, die `selbstSignalAmZitat` schon nutzt (§5). Bis V-6
    // sah der M12-Guard nur den ROHEN Rest, die Selbstmarker-Weiche den Rest
    // nach dem Passus: dieselbe Stelle, zwei Rest-Definitionen. Herleitung und
    // Messung am M12-Guard unten. Im Fremdgesetz-Chapeau ruht die Erweiterung
    // (dort IST das genannte Kürzel das Ziel — 7 gemessene Stellen).
    const nachPassus = intern.fremdKuerzel ? rest : rest.replace(PARAGRAF_ANHANG, '');
    // Härtung 31.8.: Gliederungs-Genitiv ⇒ Text (Herleitung an GLIEDERUNGS_GENITIV).
    if (!selbst && GLIEDERUNGS_GENITIV.test(rest.replace(PARAGRAF_ANHANG, ''))) continue;
    // V-7d: «… des Gesetzes» hinter dem Passus ⇒ Text (an GESETZES_GENITIV).
    if (!selbst && GESETZES_GENITIV.test(nachPassus)) continue;
    // Der des/der-Guard bleibt bewusst am ROHEN Rest (V-6): «des/der/über» ist
    // ein WEICHES Signal, und hinter einem Passus steht dort oft gewöhnliche
    // Prosa. Gemessen 31.8.2026 über alle 1458 Snapshots: der Umbau verschöbe
    // 812 weitere Self-Stellen, davon rund ein Fünftel ECHTE Selbstverweise
    // («Artikel 5 Absatz 1 über ein Projekt» UVPV 6a, «Art. 111 Abs. 1 der
    // Quellensteuer unterliegen» NW-521.1 118, «Artikel 109 Absatz 1bis über
    // die Tagfahrlichter» VTS 222m). Kein Link ist besser als ein falscher —
    // ein RICHTIGER Link ist aber besser als keiner (§1/§8). V-7 (1.9.2026) holt
    // die belegbaren Fälle VOR diesem Guard über die Form-B-Positivliste heraus
    // (Kurztitel/Volltitel, `positivliste.ts`): Guard-Klasse 1 281→930 Stellen.
    if (!selbst && /^\s+(?:des|der|über|vom)\b/.test(rest)) continue;
    // N2 (Form A, ABGEKÜRZTE Kürzel-Form): Nennt der Verweis ein ANDERES
    // Bundesgesetz («Artikel 1a Absatz 1 Buchstabe c AHVG» in der AHVV → AHVG),
    // zeigt «Artikel N» auf JENES Gesetz; der interne Self-Link wäre falsch (§1) →
    // unterdrücken. Deterministisch aus der FEDLEX-Kürzelliste (§5). Ergänzt die
    // alte Sofort-Kürzel-Regel unten (die auch Nicht-FEDLEX-Kürzel fängt), fängt
    // aber die ausgeschriebene Passus-Form. (Aktives Routing der bare-Kürzel-Form
    // bleibt bewusst zurückgestellt — der Kontrakt hier ist Unterdrückung.)
    const fremd = selbst ? null : fremdgesetzNachArtikel(rest);
    if (fremd && kuerzelKanon(fremd) !== eigenesKuerzel) continue;
    // M12 (§1/§6): Folgt dem bare «Art./Artikel N» ein Gesetzes-KÜRZEL (≥2 Gross-
    // buchstaben, z.B. «Artikel 64 BGG», «Art. 5 VwVG»), ist es ein Verweis auf
    // ein ANDERES Gesetz (in Verordnungen meist das Trägergesetz) — NICHT auf
    // diesen Erlass. Der interne Self-Sprunglink wäre dann falsch (empirisch
    // BGerR: «Artikel N BGG» zeigte auf BGerR art_N statt BGG). NORM_IM_TEXT
    // erfasst die ausgeschriebene «Artikel»-Form (noch) nicht; bis das verifizierte
    // Trägergesetz-Routing als eigene Datenaufgabe steht, wird der falsche Self-
    // Link UNTERDRÜCKT (lieber kein Link als ein plausibel-falscher, §1/§6,
    // David-Entscheid 28.6.). «Absatz/Buchstabe/Ziffer» (EIN Grossbuchstabe)
    // bleiben unberührt → echte Self-Verweise («Artikel 6 Absatz 2») weiter verlinkt.
    //
    // V-6 (W2·20, Befund V-3/V-4 31.8.2026): geprüft wird der rohe Rest ODER
    // der Rest NACH dem Passus. Bis hierher sah der Guard nur den rohen Rest —
    // ein Passus- oder Aufzählungsglied zwischen Nummer und Kürzel machte ihn
    // blind: OR Art. 973g «(Art. 895–898 ZGB)» bekam einen Self-Link auf
    // /gesetze/bund/OR#art-895, einen ZGB-Artikel im OR (§1). Gemessen
    // 31.8.2026 über alle 1458 Snapshots (Blöcke + Items): 446 Stellen in 121
    // Erlassen wechseln SELF → TEXT; die systematische Stichprobe (27) nennt
    // ausnahmslos ein Fremdgesetz (IVV, AsylG, ZGB, StHG, JStG, BetmG, GwG,
    // FinfraG, EU-MDR …), kein echter Self-Verweis geht verloren.
    //
    // ODER, nicht Ersetzung — und das ist gemessen, nicht vorsichtshalber: der
    // Passus-Überleser bricht bei «Buchstaben a–e AHVG» hinter dem «a» ab
    // («–e» ist kein Zahlenglied), und der Rest «–e AHVG» trägt kein führendes
    // Leerzeichen, das dieser Guard und N2 verlangen. Eine reine Ersetzung
    // hätte daraus 150 NEUE falsche Self-Links gemacht (AHVV, AVIV, BPV, ELV,
    // FINIV, KVV, MWSTV …). Die ODER-Form kann nie weniger unterdrücken als
    // vorher. N2 (oben) bleibt am rohen Rest: der Umbau dort ändert
    // nachweislich KEINEN Entscheid, er verschöbe nur Klassen-Etiketten.
    //
    // AUSNAHME (V-6): steht dort das Kürzel des GELESENEN Erlasses («Artikel 5
    // Absatz 2 AHVG» im AHVG), ist der Verweis ein Selbstverweis, kein
    // Fremdsignal — dieselbe Identitäts-Regel wie in der N2-Zeile darüber (§5).
    // Sie war nötig, seit der Guard hinter den Passus blickt: ohne sie fielen
    // die Kontrakte von `normText.test.tsx` (AHVG, FinfraV-FINMA). Im Korpus
    // ändert sie NICHTS (gemessen 31.8.2026: dieselben 849 Klassen-Wechsel mit
    // und ohne) — dort deckt der voll zitierte Anker (V-2 Ziel 3) diese Form
    // ab; sie hält den Guard bloss widerspruchsfrei zu N2.
    if (!selbst && kuerzelAmZitat(rest) !== eigenesKuerzel
      && /^\s+(?:[A-ZÄÖÜ]{2,}|[A-ZÄÖÜ][a-zäöü]*[A-ZÄÖÜ]\w*)/.test(rest)) continue;
    if (!selbst && kuerzelAmZitat(nachPassus) !== eigenesKuerzel
      && /^\s+(?:[A-ZÄÖÜ]{2,}|[A-ZÄÖÜ][a-zäöü]*[A-ZÄÖÜ]\w*)/.test(nachPassus)) continue;
    // M6-D: Fremdgesetz-Chapeau → bare «Art. N» zeigt aufs Zielgesetz (nicht Self).
    // NormChip trägt die Auflösung (Korpus-Popover / Fedlex-Fallback / Text bei
    // unbekanntem Ziel) — dieselbe Kette wie ein voll zitierter Fremdverweis (§5).
    if (intern.fremdKuerzel) {
      if (start > last) out.push(<RechtsprechungText key={`${key}-r${last}`} text={s.slice(last, start)} />);
      out.push(<NormChip key={`${key}-x${start}`} artikel={`Art. ${m[1]} ${intern.fremdKuerzel}`} anzeige={m[0]} linkClass={VERWEIS_AUSSEN_CLASS} zielIntern={false} />);
      last = start + m[0].length;
      continue;
    }
    // F41: §-designierter Erlass ⇒ kein bare-«Art. N»-Self-Sprung. Steht NACH
    // allen Fremd-Weichen, damit ein echtes Fremd-Routing (N2b, Chapeau) davon
    // unberührt bleibt — gesperrt ist nur der Sprung auf den EIGENEN Erlass.
    // V-2: das ausdrückliche Selbst-Signal schlägt auch F41. F41 stützt sich auf
    // die Drafting-Konvention («in einem §-Erlass meint ‹Art. N› ein anderes
    // Gesetz») — ein Indiz, wie der Kommentar dort selbst sagt. Nennt der
    // Wortlaut den eigenen Erlass, ist das Indiz widerlegt. Gemessen 31.8.2026:
    // GENAU EINE Stelle im ganzen Korpus (BS-833.100 § 6 «erlässt gemäss Art. 12
    // dieses Vertrages Personalvorschriften» — der Erlass IST ein Vertrag, zählt
    // mit «§» und zitiert seine eigene Bestimmung als «Art. 12»; § 12 trägt
    // genau die Personalvorschrift). Ohne Token bleibt es auch hier Text.
    if (paragrafErlass && !selbst) continue;
    const token = intern.tokenMap.get(normRef(m[1]));
    if (!token) continue; // kein Artikel dieses Erlasses → als Text belassen
    if (start > last) out.push(<RechtsprechungText key={`${key}-r${last}`} text={s.slice(last, start)} />);
    out.push(
      <a key={`${key}-a${start}`} href={`${intern.basisPfad}#art-${token}`}
        onClick={(e) => { e.preventDefault(); intern.springeZu(token); }}
        className={INLINE_CLASS}>{m[0]}</a>,
    );
    last = start + m[0].length;
  }
  emitPluralBis(s.length);
  if (last === 0) return <RechtsprechungText key={key} text={s} />;
  if (last < s.length) out.push(<RechtsprechungText key={`${key}-r${last}`} text={s.slice(last)} />);
  // key-tragendes Fragment: restMitIntern-Ergebnisse landen in NormTexts `teile`-
  // Array (siehe unten); ein bare <>…</> dort löst die React-key-Warnung aus.
  return <Fragment key={key}>{out}</Fragment>;
}

// ─── V-2 Ziel 3 · Voll zitierter Verweis auf den GELESENEN Erlass ────────────
//
// «Art. 65 Abs. 5 SSV» im Anhang 3 der SSV ist kein Fremdverweis. Der Erkenner
// (`normVerweiseImText`) sieht nur ein aufgelöstes FEDLEX-Kürzel und übergibt
// es an NormChip — der führt aus dem Leser hinaus nach Fedlex, obwohl der
// Nutzer bereits in der geltenden Fassung genau dieses Erlasses steht. Gemessen
// 31.8.2026: 6 Stellen, alle in Anhängen (VZV Anhang 4 × 4, SSV Anhang 3,
// VVEA Anhang 2), alle mit vorhandenem Ziel-Token.
//
// Bedingungen, alle vier nötig (§1/§8): Lesesicht (`intern`), kein
// Fremdgesetz-Chapeau, das erkannte Kürzel IST das eigene (kanonisierter
// Identitäts-Vergleich, Register-Schlüssel oder Register-Kürzel), und der
// Artikel existiert im gelesenen Erlass. Sonst bleibt der Fremd-Chip stehen —
// der Absprung nach Fedlex ist der schlechtere, aber nie der falsche Weg.
// Der angezeigte Text ist unverändert `s.anzeige` (zeichenidentisch, §1).
/** V-7/Z5: Ebene des gelesenen Erlasses aus seinem Lese-Basispfad — EINE
 *  Ableitung für den Fliesstext-Lauf (`restMitIntern`) und den Spannen-Lauf
 *  (`normVerweiseImText`), damit beide dieselbe Ebene sehen (§5). */
function ebeneFuer(basisPfad: string): FremdEbene {
  return basisPfad.startsWith('/gesetze/kanton/') ? 'kanton' : 'bund';
}

function selbstSpanSprung(s: NormVerweisSpan, key: string, intern?: InternRefs): React.ReactNode {
  if (!intern || intern.fremdKuerzel) return null;
  const gesetz = erkenneFedlexGesetz(s.artikel);
  if (!gesetz) return null;
  const kanon = kuerzelKanon(gesetz);
  const eigen = [intern.basisPfad.split('/').pop() ?? '', intern.eigenesKuerzel ?? ''].map(kuerzelKanon);
  if (!eigen.includes(kanon)) return null;
  // Nummern-Entnahme über DENSELBEN Erkenner wie der Fliesstext-Lauf (§5, keine
  // zweite Zitierform-Wahrheit). `matchAll` arbeitet auf einem Klon und rührt
  // den `lastIndex` von ART_INTERN nicht an — `exec` täte es und liesse den
  // nächsten Aufruf mitten im Muster beginnen.
  const m = s.artikel.matchAll(ART_INTERN).next().value;
  if (!m) return null;
  const token = intern.tokenMap.get(normRef(m[1]));
  if (!token) return null;
  return (
    <a key={key} href={`${intern.basisPfad}#art-${token}`}
      onClick={(e) => { e.preventDefault(); intern.springeZu(token); }}
      className={INLINE_CLASS}>{s.anzeige}</a>
  );
}

/** Fliesstext mit verlinkten Norm- UND Rechtsprechungs-Verweisen — Text bleibt
 *  zeichenidentisch (nur Anker-Hüllen kommen hinzu). `intern` (nur Lesesicht)
 *  macht bare Artikelverweise auf denselben Erlass zu Sprung-Links. */
export function NormText({ text, intern }: { text: string; intern?: InternRefs }) {
  // EINE Wahrheit der Verweis-/Ketten-Regel: normVerweiseImText (fedlex.ts)
  // liefert die voll zitierten Anker UND die per «i.V.m.»-Kette propagierten
  // bare Glieder. Für Nicht-Ketten-Text ist die Anker-Menge identisch zum
  // früheren matchAll(NORM_IM_TEXT)-Lauf (additiv, §6).
  // Z1 (W2·22): der Register-Schlüssel des gelesenen Erlasses schliesst den
  // Erlass-Verweis auf SICH SELBST aus («Die Bundesverfassung kann jederzeit …
  // revidiert werden» in der BV) — Herleitung am Parameter von
  // `erlassVerweiseImText`. Ausserhalb der Lesesicht (Rechner-/Vorlagentexte)
  // gibt es keinen gelesenen Erlass; dort ist jeder Verweis fremd.
  // Z5 (W2·22): die Ebene entscheidet mit — in kantonalen Erlassen verlinkt
  // der ausgeschriebene Verweis kein Kürzel, das dort einen eigenen Erlass
  // bezeichnet (Herleitung an `KUERZEL_NUR_BUND`, positivliste.ts).
  const spans = normVerweiseImText(
    text, intern?.basisPfad.split('/').pop(), intern ? ebeneFuer(intern.basisPfad) : 'bund',
  );
  // V-4: der voll zitierte Fremd-Anker trägt das Aussen-Zeichen NUR in der
  // Lesesicht — ausserhalb (Rechner-/Vorlagen-Texte) ist jeder Norm-Verweis
  // fremd, dort unterschiede das Zeichen nichts (Reichweite, s. oben).
  const ankerClass = intern ? VERWEIS_AUSSEN_CLASS : INLINE_CLASS;
  // Kein Norm-Treffer → ganzer Text durch die Rest-Pipeline (ohne intern reiner
  // Pass-Through durch RechtsprechungText, zeichenidentisch wie bisher).
  if (spans.length === 0) return intern ? <>{restMitIntern(text, 'r0', intern)}</> : <RechtsprechungText text={text} />;
  const teile: React.ReactNode[] = [];
  let zuletzt = 0;
  for (const s of spans) {
    if (s.start > zuletzt) teile.push(restMitIntern(text.slice(zuletzt, s.start), `r${zuletzt}`, intern));
    // Anker: anzeige === artikel → `anzeige` weglassen (SSR-byte-identisch zum
    // früheren <NormChip artikel={roh}>). Propagiertes Glied: Anzeige = reiner
    // Glied-Text (zeichenidentisch, §1), Auflösung über das synthetisierte Ziel.
    // V-2 Ziel 3: nennt der Verweis den GELESENEN Erlass, bleibt der Sprung im
    // Leser (Herleitung an `selbstSpanSprung`); sonst unverändert der Chip.
    // Z1 (W2·22): die Erlass-Spanne OHNE Artikelnummer trägt ebenfalls eine
    // vom Ziel abweichende Anzeige — `artikel` ist dort das blosse Kürzel
    // («DSG»), angezeigt wird der Erlassname aus dem Quelltext. Bestehende
    // Spannen sind unberührt, das SSR-Markup bleibt byte-identisch (§6).
    // Z5 (W2·22): dasselbe für den AUSGESCHRIEBENEN Artikelverweis — `artikel`
    // ist das synthetisierte «Art. N KÜRZEL», angezeigt wird die Artikel-
    // Nennung des Quelltexts («Artikel 29»); Passus und Kürzel bleiben Text.
    teile.push(
      selbstSpanSprung(s, `${s.start}-${s.artikel}`, intern)
      ?? <NormChip key={`${s.start}-${s.artikel}`} artikel={s.artikel}
        anzeige={s.propagiert || s.erlass || s.ausgeschrieben ? s.anzeige : undefined} linkClass={ankerClass} zielIntern={false} />,
    );
    zuletzt = s.end;
  }
  if (zuletzt < text.length) teile.push(restMitIntern(text.slice(zuletzt), `r${zuletzt}`, intern));
  return <>{teile}</>;
}
