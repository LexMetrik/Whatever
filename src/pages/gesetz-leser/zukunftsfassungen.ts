import type { CurrencyEintrag } from '../../lib/normtext/browse';
import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import { datumCh, naechsteFassungSatz } from '../../lib/normtext/erlassKopfText';

// ═══ W2·27 (BUND-FERTIG, §4 b) · DER ZUKUNFTSFASSUNGS-HINWEIS ════════════════
//
// Entscheid David 14.9.2026 (`fahrplaene/FAHRPLAN-BUND-FERTIG.md` §4 b):
// «Beides gestaffelt — der reine HINWEIS in Phase 1 (klein, §8-Ehrlichkeit,
// kein neues Datenmodell), Umschalter und Diff in Phase 3.» Dieses Modul baut
// darum genau einen Satz plus einen amtlichen Link. KEIN Umschalter, KEIN Diff,
// KEINE zweite Textfassung im Korpus.
//
// ─── WAS DER LESER VORHER SAH (Ist-Stand vor W2·27) ──────────────────────────
// Der Erlass-Kopf trug seit P1-d das blosse Wort «nächste Fassung ab TT.MM.JJJJ»
// (`parts/ErlassLeserKopf.tsx`, `stand`-Kette). Drei Dinge fehlten:
//   1  ein WEG dorthin — der Satz nannte ein Datum, aber kein Ziel;
//   2  die MEHRZAHL — 62 Erlasse tragen `naechsteFassungAb`, aber 93 künftige
//      Inkrafttreten verteilen sich auf 64 Dateien (Messung FAHRPLAN §1, Zeile
//      «Stand / Fassung / Zukunftsfassungen»); wer zwei bevorstehende Fassungen
//      hat, sah eine;
//   3  die EHRLICHKEIT, wenn die angekündigte Fassung inzwischen GILT — dann
//      ist «nächste Fassung ab …» nicht mehr wahr, und Schweigen wäre die
//      unehrlichere der beiden Formen (§8, dieselbe Regel wie STAND_UNBEKANNT).
//
// ─── §2 · WELCHER TAG ENTSCHEIDET, OB EINE FASSUNG «KÜNFTIG» IST ─────────────
// Kein `Date.now()`. Der Kopf wird prerendert; eine Bauzeit-Gegenwart veraltete
// still, und eine Client-Uhr machte dieselbe Seite je nach Gerät verschieden
// (wortgleiche Herleitung wie `fruehestesInKraft` in `lib/normtext/revisionen`).
// Massgeblich ist der DATENGETRAGENE Stichtag `currency.geprueftAm` — der Tag
// des letzten maschinellen Abgleichs gegen den Fedlex-Konsolidierungsgraphen.
//
//   `ab >  geprueftAm`  → künftig: «nächste Fassung ab TT.MM.JJJJ»
//   `ab <= geprueftAm`  → sie gilt bereits: «seit TT.MM.JJJJ gilt eine neuere
//                          Fassung — hier steht die Kopie vom <Stand>»
//
// Der zweite Fall kann zum Zeitpunkt der Generierung nicht entstehen (der
// Generator setzt `naechsteFassungAb` per Konstruktion auf ein Datum NACH
// `geprueftAm`, `scripts/fedlex-wiedervorlage-generieren.ts`). Er entsteht,
// sobald ein Currency-Lauf altert, ohne dass der Snapshot nachgezogen wird —
// und genau dann muss der Kopf es sagen statt den Hinweis still fallen zu
// lassen. §6.7 lit. b: eine nicht getroffene Feststellung wird nie zur
// günstigen.
//
// ─── §8 · WARUM «KOPIE» UND NICHT «SNAPSHOT» ─────────────────────────────────
// Ä-Rest der Live-Prüfung 18.8.2026 (Herleitung in `v3/LeserErlassKopfZone`):
// «Snapshot» ist unser Bau-Vokabular, nicht die Sprache des Lesers. Der
// Erlass-Kopf sagt darüber bereits «Kopie vom <Datum>»; dieser Satz benutzt
// dasselbe Wort, damit der Leser nicht zwei Namen für eine Sache lernt (§5).
export interface ZukunftsHinweis {
  /** `kuenftig` = angekündigt · `inzwischen` = am Stichtag bereits in Kraft. */
  art: 'kuenftig' | 'inzwischen';
  /** ISO-Datum der nächsten Fassung (= `currency.naechsteFassungAb`). */
  ab: string;
  /** Der fertige Satz. Im Fall `kuenftig` Zeichen für Zeichen der EINE Satz aus
   *  `lib/normtext/erlassKopfText.naechsteFassungSatz` — derselbe String, den
   *  der prerenderte SEO-Kopf setzt (`lib/seo-detail.ts`, §5). */
  satz: string;
  /** Zahl der WEITEREN künftigen Inkrafttreten nach `ab` (0 = keine). */
  weitere: number;
  /** Amtlicher Link auf die datierte Fedlex-Manifestation — `null` heisst
   *  «kein Link», nie «irgendein Link» (§8). */
  link: string | null;
}

/** ELI-Erlassadresse mit Sprachsegment am Ende — die Form, die das Register für
 *  Bundeserlasse führt (`https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de`).
 *  Identitätsform mit Anker, kein Substring-Test (§7). */
const ELI_MIT_SPRACHE = /^(https:\/\/www\.fedlex\.admin\.ch\/eli\/[^#?]+)\/(de|fr|it|rm|en)$/;

/**
 * Amtlicher Link auf die Fedlex-Manifestation EINER datierten Fassung.
 *
 * ─── EMPIRISCH GEPRÜFT, NICHT ANGENOMMEN (§7, 14.9.2026) ────────────────────
 * Die datierte ELI-Form schiebt das Fassungsdatum als `YYYYMMDD` vor das
 * Sprachsegment. Gemessen am OR (`eli/cc/27/317_321_377`, `naechsteFassungAb`
 * 2026-10-01) über den Fedlex-Filestore, weil die Web-Ansicht als SPA für JEDES
 * Datum HTTP 200 mit identischer Hülle liefert und der Status darum nichts
 * beweist:
 *   · `…/20261001/…`  → 2 679 264 Bytes Volltext  (die künftige Fassung EXISTIERT)
 *   · `…/20260101/…`  → 2 660 898 Bytes Volltext  (die geltende Fassung)
 *   · `…/20991231/…`  →     9 148 Bytes Fehlerhülle (erfundenes Datum)
 * Verlinkt wird die ELI-Form auf `www.fedlex.admin.ch`, NIE die Filestore-URL —
 * die Filestore-Adresse diente hier allein der Messung (bindende Regel §12.1/
 * §12.4, Wortlaut in `lib/normtext/verifikationslink.ts`).
 *
 * Das Datum ist nie erfunden: es kommt aus `naechsteFassungAb`, das der
 * Generator aus den `dateApplicability`-Werten des amtlichen Graphen liest.
 *
 * `null` (= kein Link, §8) bei: Kanton und jeder anderen Nicht-ELI-Quelle
 * (kein Fedlex-Manifestationsraum), Adresse mit Fragment/Query, ganz
 * aufgehobenem Erlass (dort ist die Aufhebung die Aussage, nicht die nächste
 * Fassung — dieselbe Schranke wie beim Standausweis eine Zeile darüber).
 */
export function fassungsLink(quelleUrl: string, abIso: string): string | null {
  const m = ELI_MIT_SPRACHE.exec(quelleUrl);
  if (!m) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(abIso)) return null;
  return `${m[1]}/${abIso.replace(/-/g, '')}/${m[2]}`;
}

/**
 * Der Hinweis zu EINEM Erlass — rein und deterministisch (§2): gleiche Eingabe,
 * gleiche Ausgabe, kein `Date.now()`, kein Zugriff auf irgendeine Uhr.
 *
 * `null` = kein Hinweis. Der Aufrufer rendert dann NICHTS — kein leeres
 * Element, keine reservierte Zeile, keine Layout-Verschiebung. Für die 1 516
 * Erlasse ohne `naechsteFassungAb` (gemessen 14.9.2026: 62 von 1 578 tragen es)
 * bleibt der Kopf Zeichen für Zeichen der bisherige.
 *
 * `kuenftigeInkrafttreten` sind die bereits vom Leser geladenen, aufsteigend
 * sortierten Inkrafttretens-Daten der als nicht konsolidiert markierten
 * Revisionen (`lib/normtext/revisionen.nichtKonsolidierteInkrafttreten`, Fetch
 * je Erlass-Key genau einmal pro Sitzung). KEIN neuer Client-Index, keine
 * zweite Projektion — dieselbe Liste, aus der der Kopf schon
 * `nichtKonsolidiertSeit` ableitet (§5).
 */
export function zukunftsHinweis(
  erlass: Pick<BrowseErlass, 'quelleUrl' | 'stand' | 'aufgehoben'>,
  currency: CurrencyEintrag | undefined,
  kuenftigeInkrafttreten: readonly string[] = [],
): ZukunftsHinweis | null {
  const ab = currency?.naechsteFassungAb;
  if (!ab) return null;
  // Am ganz aufgehobenen Erlass ist die Aufhebung DIE Aussage (§8) — wortgleiche
  // Schranke wie `standausweisSatz`/`naechsteFassungSatz` im Kopf und im
  // prerenderten SEO-Kopf (`lib/seo-detail.ts`, `!e.aufgehoben`).
  if (erlass.aufgehoben) return null;

  const stichtag = currency?.geprueftAm;
  const art: ZukunftsHinweis['art'] = stichtag && ab <= stichtag ? 'inzwischen' : 'kuenftig';

  // ISO-Daten vergleichen lexikografisch = chronologisch (§2, keine Date-Arithmetik).
  // `> ab` und nicht `>= ab`: zwei Revisionen mit DEMSELBEN Inkrafttreten sind
  // EINE künftige Fassung, nicht zwei (der Leser zählt Fassungen, nicht
  // Änderungserlasse). Deduplizierung darum über die Menge der Daten.
  const weitere = new Set(kuenftigeInkrafttreten.filter((d) => d > ab)).size;

  const satz = art === 'kuenftig'
    ? naechsteFassungSatz(ab)
    : erlass.stand
      ? `seit ${datumCh(ab)} gilt eine neuere Fassung — hier steht die Kopie vom ${datumCh(erlass.stand)}`
      : `seit ${datumCh(ab)} gilt eine neuere Fassung`;

  return { art, ab, satz, weitere, link: fassungsLink(erlass.quelleUrl, ab) };
}
