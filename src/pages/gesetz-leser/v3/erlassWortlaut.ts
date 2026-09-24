import { grundartMeta, titelOhneKlammerSuffix } from '../helpers';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';

// ─── Erlass → Wortlaut der Beschriftungen (Schwesterdatei zu `erlassAnsicht`) ─
//
// HERKUNFT: bis zum 14.9.2026 stand dieser Block in `erlassAnsicht.ts`. Er ist
// dort herausgeschnitten worden, weil zwei Zusagen des Fundament-Tors
// (`src/tests/leser-v3-fundament.test.ts`) zusammen einen Deckel erzeugten, den
// die nächste erzwungene Ableitung nicht mehr unterlaufen konnte: jede
// `.ebene`-Ableitung MUSS nach `erlassAnsicht.ts`, die Datei darf 420 Zeilen
// nicht überschreiten UND muss unter dem Adapter `leserV3Modell.ts` bleiben,
// der selbst bei 420 steht. Gemessen am 14.9.2026: 419 Zeilen, also null
// nutzbarer Kopfraum (eine 420. Zeile hätte den Gleichstand erzeugt, bei dem
// die Sonde «der grösste Baustein ist der Adapter» kippt).
//
// DIE NAHT IST FACHLICH, NICHT MECHANISCH. `erlassAnsicht.ts` beantwortet
// «WO steht dieser Erlass?» — Ebene, Adresse, Krume, Art, Übersichtszeile; es
// liest dafür `.ebene`/`.rechtsgebiet` und ist die EINE erlaubte Stelle dafür.
// Diese Datei beantwortet «WIE heisst, was man liest?» — das Zähl-Substantiv
// samt Zählform und Dativ, die Beschriftung des Such-/Sprungfelds, die
// Titel-/Kennungs-Regeln. Sie ist die EINE erlaubte Stelle für die Wörter
// «Artikel»/«Paragraphen» im Code von `v3/`; `.ebene` und `.rechtsgebiet`
// kommen hier ausdrücklich NICHT vor (das Tor prüft beide Richtungen).
//
// FÜR AUFRUFER ÄNDERT SICH NICHTS: `erlassAnsicht.ts` re-exportiert diese
// Datei (Fassaden-Muster, Skill `refactoring`) — alle bisherigen Importe
// bleiben Zeichen für Zeichen gültig, die Golden-Ausgaben byte-gleich.
//
// Rein und deterministisch (§2): kein DOM, kein Speicher, keine Uhr.

// ═══ B8 (H2b-Nachzug) · DAS ZÄHL-SUBSTANTIV HAT EINEN NAMEN ═════════════════
//
// BEFUND (Architektur-Review 17.8.2026, Positionen 1 und 2): das Wort, mit dem
// ein Erlass seine Bestimmungen zählt, lag als NACKTES UNION-LITERAL an fünf
// Stellen in `v3/` (`SuchZone`, `LeserGliederung`, `LeserUebersicht`,
// `LeserTrefferListe`, dazu `parts/ErlassUebersicht`), die ABLEITUNG aus dem
// Grundart-Register stand doppelt (`LeserRahmenV3`, `inhalt-volltext`) und die
// Singular-Regel dreifach (`SuchZone`, `LeserTrefferListe` 2 ×). Sechs Orte, die
// dieselbe Sache wissen mussten — genau die Streuung, aus der Ä23 entstand
// («Artikel» hart kodiert an einem §-Erlass).
//
// Hier stehen jetzt: der TYP, die ABLEITUNG und die ZÄHLFORM. Bewacht von
// `src/tests/leser-v3-fundament.test.ts` («kein 'Paragraphen'-Literal in `v3/`
// ausser in dieser Datei»).
//
// AUSDRÜCKLICH NICHT MITGEZOGEN: `parts/ErlassUebersicht.tsx` und
// `parts/ErlassLeserKopf.tsx` behalten ihre eigenen Unions. Sie sind GETEILTE
// Bausteine, die auch die Ist-Hülle rendert; würden sie einen Typ aus `v3/`
// importieren, hinge die eingefrorene Hülle an der neuen (FL-4, und die
// Abhängigkeitsrichtung wäre umgekehrt). `inhalt-volltext.tsx` (V1) bleibt
// unberührt — die Doppelung dort ist notiert, nicht gefixt.

/** Zähl-Substantiv der Bestimmungen eines Erlasses. Nie ein Vorgabewert: ein
 *  stiller Rückfall auf «Artikel» wäre die Bund-Annahme, die die
 *  Erlass-Neutralität ausschliesst (Fundament-Auflage 2). */
export type BestimmungsWort = 'Artikel' | 'Paragraphen';

/**
 * Die EINE Ableitung: kantonale Erlasse mit §-Etikett zählen «Paragraphen».
 * Nimmt den Erlass-Key und fragt das Grundart-Register (SSoT, §5) selbst — so
 * kann kein Aufrufer die Ableitung «fast richtig» nachbauen.
 */
export function bestimmungsWort(erlassKey: string): BestimmungsWort {
  return grundartMeta(erlassKey).bestimmungsEtikett === 'paragraf' ? 'Paragraphen' : 'Artikel';
}

/**
 * Zählform des Bestimmungsworts. «Artikel» ist im Deutschen formgleich,
 * «Paragraphen» nicht — «1 Paragraphen» wäre ein Grammatikfehler an einer
 * Kernauskunft (§8). Stand vor dem Nachzug an drei Stellen; jetzt an einer.
 */
export function zaehlform(n: number, wort: BestimmungsWort): string {
  return n === 1 && wort === 'Paragraphen' ? 'Paragraph' : wort;
}

/**
 * «diesem Artikel» / «diesem Paragraphen» — die DATIV-Einzahl (H3-Nachzug C1).
 *
 * Eigene Ableitung und nicht `zaehlform(1, …)`: die Zählform liefert den
 * NOMINATIV («1 Paragraph»), im Dativ steht dieselbe Bestimmung als «diesem
 * Paragraphen» (schwache Deklination). Wer die Zählform hier zweitverwendete,
 * schrieb «zu diesem Paragraph» — ein Grammatikfehler an einer Kernauskunft,
 * genau die Klasse, gegen die `zaehlform` gebaut wurde (§8).
 *
 * ANLASS (Architektur-Review 17.8.2026, C1): «Artikel» stand hart im Code an
 * drei Stellen des Panels (`PANEL_REITER`-Titel, Bedien- und Bestands-Satz im
 * Reiter «Entscheide») — an BS-640.100 (§-Erlass) las man dort «zu diesem
 * Artikel». Dieselbe Fehlerklasse wie Ä23, nur eine Etappe später.
 */
export function bestimmungDativ(wort: BestimmungsWort): string {
  return wort === 'Paragraphen' ? 'diesem Paragraphen' : 'diesem Artikel';
}

/** «dieses Artikels» / «dieses Paragraphen» — die GENITIV-Einzahl (S6 W1f,
 *  Klappzeilen des Erlass-Blatts «Verweise dieses Artikels»). Eigene Ableitung
 *  aus demselben Grund wie der Dativ: «dieses Paragraph» wäre falsch (§8). */
export function bestimmungGenitiv(wort: BestimmungsWort): string {
  return wort === 'Paragraphen' ? 'dieses Paragraphen' : 'dieses Artikels';
}

/**
 * Ä20 (H2b) — Platzhalter des Such-/Sprungfelds, aus dem Erlass abgeleitet.
 *
 * BEFUND (gemessen 17.8.2026): der Platzhalter lautete fest «Suchen oder
 * «Art. 429» …» — auch an einem §-Erlass, wo es keinen «Art. 429» gibt und der
 * Leser sonst durchweg «§» liest (ZH-211.11). Ein Platzhalter, der ein
 * Sprungziel nennt, das dieser Erlass nicht kennt, ist ein totes Versprechen
 * (§8) und eine Bund-Annahme im erlassneutralen Rahmen.
 *
 * `beispiel` ist das ETIKETT einer echten Bestimmung DIESES Erlasses (die
 * erste) — nicht ein aus dem Bestimmungswort gebasteltes Muster: das Etikett
 * kommt aus demselben Datenmodell, das der Sprung auflöst, und ist damit
 * garantiert eingebbar. Fehlt es (Snapshot noch nicht da), verspricht das Feld
 * keinen Sprung, sondern nennt nur die Suche.
 *
 * ── Ä112 (Live-Ästhetik-Prüfung 18.8.2026) · DAS FELD NENNT SEINEN ERLASS ────
 *
 * GEMESSEN am Live-Stand @720–1440: ZWEI Suchfelder standen übereinander, keine
 * 60 px auseinander, und beide begannen mit demselben Wort —
 *   App-Topbar: «Suchen oder Norm springen …»   (sucht die ganze Anwendung)
 *   Leser:      «Suchen oder «Art. 1» …»        (sucht IN diesem Erlass)
 * Der Unterschied ist der wichtigste, den die beiden Felder haben, und keines
 * der beiden sagte ihn. Wer im oberen Feld «Entschädigung» tippt, bekommt die
 * Anwendung durchsucht und wundert sich, dass die Trefferliste des Erlasses
 * leer bleibt.
 *
 * BEHOBEN WIRD DAS UNTERE FELD, NICHT DIE TOPBAR: die Topbar trägt die ganze
 * App (`components/layout/**`, FL-4) und ist hier ausdrücklich nicht
 * anzufassen; das Leser-Feld dagegen weiss, dass es einen EINZELNEN Erlass
 * durchsucht — und sagt es seither («Im Erlass suchen …»).
 *
 * ── Ä126 (Bug-Check P1-1 · Architektur P3-2, 18.8.2026) · NICHT DAS KÜRZEL ──
 *
 * Ä112 setzte dafür das REGISTERKÜRZEL in den sichtbaren Platzhalter. Gemessen
 * am Live-Stand ZH-211.11 @390 stand dort «Im Gebührenverordnung des
 * Obergerichts (GebV OG) suchen oder «§ 1» …» — 465 px in einem 280 px breiten
 * Feld, also mehr als die Hälfte der Auskunft abgeschnitten, und obendrein
 * grammatisch falsch («die Verordnung»).
 *
 * Beides folgt aus zwei Eigenschaften des Feldes `kuerzel`, die Ä112 übersehen
 * hat: es ist NICHT längenbeschränkt (gezählt am Register: 753 der 1469 Werte
 * über 20 Zeichen, der längste 521) und es hat ein beliebiges GENUS, das ein
 * festes «Im» nicht treffen kann (StPO, ZPO, BV sind Feminina).
 *
 * DIE TRENNUNG, die beides zugleich löst — und Ä112 nicht zurücknimmt:
 *   • SICHTBAR trägt der Platzhalter keine Daten mehr, nur die Sache selbst
 *     («Im Erlass suchen»). Er ist damit längenfest, und der Unterschied zur
 *     Topbar, um den es Ä112 ging, bleibt gesagt: «Im Erlass» gegen «Norm».
 *     Das Sprung-Beispiel bleibt erlassgerecht aus dem Datenmodell (Ä20).
 *   • DER ZUGÄNGLICHE NAME nennt den Erlass; dort zählen keine Pixel. Das
 *     Kürzel steht als APPOSITION zu «Erlass» — so regiert der Artikel das
 *     Substantiv und nie das Kürzel, in jedem Genus, ohne Genus-Tabelle im
 *     Code (die wäre Rechtsdaten-Pflege für eine Grammatikfrage).
 *
 * Sonde: `src/tests/leser-v3-erlassansicht.test.ts` (Ä126), rot gefahren am
 * Vorzustand mit 68 statt ≤ 37 Zeichen.
 */
export function suchPlatzhalter(beispiel: string | null): string {
  return `${SUCH_ORT}${beispiel ? ` oder «${beispiel}» …` : ' …'}`;
}

/** Ä126 · der halbe Satz, den Platzhalter UND zugänglicher Name teilen — EINE
 *  Quelle für beide (§5), und die einzige Stelle ohne Daten darin. */
const SUCH_ORT = 'Im Erlass suchen';

/**
 * Ä126 · ab wann ein Registerwert kein Kürzel mehr ist.
 *
 * DOKUMENTIERT, NICHT GERATEN (gezählt am Register 18.8.2026, 1469 Erlasse):
 * bis 20 Zeichen stehen dort Abkürzungen und knappe Ein-Wort-Titel («ZGB»,
 * «OR», «HRegV», «Feuerschutzverordnung»); darüber beginnen die Volltitel, bis
 * 521 Zeichen. Ein Volltitel im zugänglichen Namen ist gesprochen kein
 * Orientierungspunkt mehr, sondern Lärm vor der eigentlichen Auskunft — dann
 * lieber die Sache ohne Namen (§8: nichts behaupten, was nicht trägt).
 */
const KUERZEL_NAME_MAX = 20;

function suchOrt(kuerzel?: string): string {
  const k = kuerzel?.trim();
  return k && k.length <= KUERZEL_NAME_MAX ? `Im Erlass ${k} suchen` : SUCH_ORT;
}

/**
 * Ä112/Ä126 · der ZUGÄNGLICHE NAME des Such-/Sprungfelds.
 *
 * Er nennt den Erlass — und zusätzlich die zweite Fähigkeit des Feldes
 * (springen), die der Platzhalter nur als Beispiel zeigt. Eigene Funktion statt
 * eines zweiten Literals im Rahmen: der Name ist die Auskunft, auf die ein
 * Screenreader-Nutzer angewiesen ist, und er darf nicht auseinanderlaufen, wenn
 * jemand den Platzhalter nachjustiert.
 */
export function suchFeldName(kuerzel?: string): string {
  return `${suchOrt(kuerzel)} oder zu einer Bestimmung springen`;
}

/**
 * Ä21 (H2b) — trägt der Volltitel neben dem Kürzel noch eine eigene Auskunft?
 *
 * BEFUND (gemessen 17.8.2026 an ZH-211.11): dort IST das Register-Kürzel der
 * volle Name («Gebührenverordnung des Obergerichts (GebV OG)»), und der Titel
 * setzt nur noch die Fundstelle dahinter («… (LS 211.11)»). Die V3-Ortsangabe
 * schrieb beides nebeneinander, die App-Krume darüber ein drittes Mal — derselbe
 * Name dreimal in zwei Zentimetern.
 *
 * ── B2 (H2b-Nachzug) · WORTGLEICH, NICHT «FÄNGT GLEICH AN» ──────────────────
 * H2b prüfte `startsWith` und begründete das mit dem SR-Zusatz «(LS 211.11)».
 * Der Zusatz war richtig erkannt, die Regel dafür zu weit: sie unterdrückt den
 * Volltitel auch dann, wenn er ÜBER das Kürzel hinaus etwas sagt. Gemessen
 * 17.8.2026 an drei Klassen von Fällen:
 *   · `kanton/BS-BeE 610.100` — Kürzel «Finanzreglement», Titel «Finanzreglement
 *     über das Rechnungswesen der Einwohnergemeinde Bettingen». Der Kopf zeigte
 *     nur «Finanzreglement», und `BS-154.125` trägt dasselbe Kürzel: zwei
 *     verschiedene Erlasse, ein ununterscheidbarer Kopf (§8).
 *   · `bund/ASYLG` — Kürzel «AsylG», Titel «Asylgesetz (AsylG)». «Asylgesetz»
 *     beginnt zufällig mit «asylg» ⇒ der Volltitel fiel weg, obwohl er das Wort
 *     ist, das man liest. Ebenso `BS-121.100` («BüRG» ⇒ «Bürgerrechtsgesetz»).
 *   · `kanton/ZH-211.11` — hier gilt die Unterdrückung weiter: nach Abzug des
 *     Klammer-Suffixes IST der Titel Zeichen für Zeichen das Kürzel.
 * NEUE REGEL: der Volltitel entfällt nur bei WORTGLEICHHEIT mit dem Kürzel,
 * gemessen an derselben Zeichenkette, die gedruckt wird (`titelOhneKlammerSuffix`
 * — §5, dieselbe Ableitung wie im Erlass-Kopf). Wirkung über den Korpus: 784 → 775
 * unterdrückte Volltitel, also 9 Erlasse bekommen ihre Auskunft zurück.
 *
 * KEIN `title`-ERSATZ: wo der Volltitel bleibt, steht er sichtbar. Ein Tooltip
 * ist keine Auskunft — er existiert für Maus-Nutzer und für niemanden sonst (§8).
 */
export function zeigeVolltitel(erlass: Pick<BrowseErlass, 'titel' | 'kuerzel'>): boolean {
  const kuerzel = erlass.kuerzel.trim().toLowerCase();
  if (!kuerzel) return true;
  return titelOhneKlammerSuffix(erlass.titel).toLowerCase() !== kuerzel;
}

/**
 * Ab welcher Titellänge (Zeichen) die Kennung VOR den Titel wandert.
 *
 * Kalibriert, nicht geraten: gemessen @1440 in der V3-Lesezelle (752 px, `text-h1`)
 * braucht der LugÜ-Titel mit 158 Zeichen drei Zeilen (147 px), der VMWG-Titel mit
 * 63 Zeichen eine (75 px). 80 Zeichen ist die Grenze, an der der Titel die zweite
 * Zeile verlässt — bis dahin bleibt die S3-Zitierform «Volltitel (Kürzel)»
 * unangetastet.
 *
 * B1: gemessen wird die ANGEZEIGTE Länge (`titelOhneKlammerSuffix`), nicht die
 * rohe — sonst gilt eine Schwelle, die an der Lesezelle kalibriert ist, für einen
 * String, der dort nie steht (s. `helpers.titelOhneKlammerSuffix`).
 */
const TITEL_LANG_ZEICHEN = 80;

/**
 * Ä-(d) aus S3 (H2b) — die KENNUNG eines Erlasses, wenn sie vor den Titel gehört.
 *
 * BEFUND (gemessen 17.8.2026): bei Staatsverträgen mit sehr langem Volltitel
 * stand das Kürzel am Ende einer dreizeiligen H1 — «… in Zivil- und
 * Handelssachen (LugÜ)». Wer den Erlass wiedererkennen will, sucht genau diese
 * vier Zeichen und findet sie zuletzt.
 *
 * `null` = die gewohnte Zitierform «Volltitel (Kürzel)» bleibt (S3-Entscheid Ä6,
 * der ausdrücklich EINE Angabe in EINER Farbe wollte). Ein Wert = der Kopf setzt
 * die Kennung voran und lässt das Klammer-Suffix weg — dieselbe Information,
 * andere Reihenfolge, nichts doppelt.
 *
 * Zwei Ausschlüsse, beide aus dem Datenmodell und nicht aus `if (staatsvertrag)`:
 * ohne Kürzel gibt es keine Kennung, und wo der Titel mit dem Kürzel BEGINNT
 * (ZH-Fall, s. `zeigeVolltitel`), wäre die Voranstellung eine Dopplung.
 */
export function titelKennung(erlass: Pick<BrowseErlass, 'titel' | 'kuerzel'>): string | null {
  const kuerzel = erlass.kuerzel.trim();
  if (!kuerzel) return null;
  // B1: DIESELBE Zeichenkette, die `parts/ErlassLeserKopf` als Titelzeile setzt.
  const angezeigt = titelOhneKlammerSuffix(erlass.titel);
  if (angezeigt.toLowerCase().startsWith(kuerzel.toLowerCase())) return null;
  return angezeigt.length > TITEL_LANG_ZEICHEN ? kuerzel : null;
}

