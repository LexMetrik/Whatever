// ─── Leser-Options-Store (W2·5d G2a) — Darstellungs-Toggles, KEINE Rechtslogik (§3) ─
//
// Persistente, rein visuelle Lese-Umschalter des Gesetzes-Readers. EINE
// dreiwertige Wahl (`vermerke`, D35-F3 7.9.2026 — sie hat `fussnoten` und
// `histansicht` abgelöst), EINE Mehrfachwahl (`fussRubriken`, D35-F2 7.9.2026 —
// sie ist neu, `leitfaelle` ist mit ihr ersatzlos gefallen) plus drei
// JS-konsumierte Filterwerte (Schriftstufe, Bezugs-Facetten, Bezugs-Zeitraum) in
// EINEM localStorage-Schlüssel und EINEM Hörer-Satz (§5). Bedien-Oberfläche:
// `v3/LeserAnsichtV3.tsx`, auf DIESEM Store (bis H5, 21.8.2026, ebenso
// `LeserAnsichtMenu.tsx` der inzwischen gelöschten Ist-Hülle). Chronik der
// gestrichenen Felder (`verweise`, `linien`, `zeitraum`, dreiwertiges `hist`)
// steht im Vollzugsvermerk S1, FAHRPLAN-LESER-V3 Kap. 7 — hier nur, was beim
// Ändern des Codes noch gebraucht wird:
//
// TOGGLES = data-*-Attribut am <html> + CSS, KEIN React-State im Artikel-Baum.
// Umschalten rendert nur die Switch-Buttons neu, nie die Artikelliste (§15); ein
// Attributsatz am <html> heisst, dass Einzelansicht und jedes Split-Pane
// derselben Wahl folgen. Gesetzt wird IMPERATIV (Vorbild `components/thema.ts`),
// nicht per Inline-Script im Head — die CSP (`vercel.json script-src 'self'`)
// verbietet das; `main.tsx` ruft `wendeLeserOptionenAn()` vor dem ersten Paint
// aus dem gebündelten Modul ⇒ kein Flackern, kein Hydration-Mismatch. Default
// 'an' emittiert KEINE CSS-Regel (R6: Grundzustand byte-gleich), alle Regeln
// sind auf `.lc-leser` gescopt (index.css) ⇒ nur der Reader ist betroffen.
//
// FILTERWERTE (Facetten, Kantone, Von-Bis) sind JS-konsumiert, kein Attribut:
// sie entscheiden, WELCHER Shard geladen wird — das kann CSS nicht. Sie werden
// über Primitiv-/Referenz-stabile Selektoren abonniert, damit ein fremder Toggle
// sie nicht re-rendern lässt (§15). `getSnapshot` MUSS eine stabile Referenz
// liefern: darum zwei Strings statt eines `{von, bis}`-Objekts und Arrays, die
// nur im Setter ersetzt werden — ein je Aufruf neu gebauter Wert liesse React
// schleifen.
//
// GESTRICHENE SCHLÜSSEL im Bestands-Speicher (`verweise`, `linien`, `zeitraum`,
// `hist`, seit D35-F3 auch `fussnoten` und `histansicht`, seit D35-F2 auch
// `leitfaelle`) werden beim Laden nicht mehr als Zustand übernommen;
// `speichere()` räumt sie beim nächsten Schreiben ab. GELESEN werden sie
// weiterhin, jeder für genau EINE Bestands-Migration: `hist`/`fussnoten`/
// `histansicht` speisen die Dreier-Wahl (`migriereOptFelder`), `leitfaelle`
// den einmaligen Facetten-Fall in `lade()`. Bei `zeitraum` ist das Abräumen
// nicht Kosmetik: bliebe er stehen, rechnete die Migration bei jedem Laden gegen
// ein neues «heute», und «letzte 5 Jahre» rutschte täglich weiter.
//
// Ä25 (S1-Nachzug 17.8.2026, §7): der gestrichene Schalter `verweise` wirkte auf
// eine DAUERHAFTE gepunktete Unterstreichung, nicht — wie hier und an vier
// weiteren Stellen behauptet — auf eine Hover-Zierde (`NormText.tsx:38` setzt
// `underline` unbedingt). Offene Design-Frage, Fahrplan Kap. 7 «Offen aus S1».

import { useSyncExternalStore } from 'react';
import type { BezugStatus } from '../../lib/verzahnung/facetten';
import { DEFAULT_KLASSEN, normalisiereKantone, normalisiereKlassen } from './bezugAuswahl';
import { migriereZeitraum, normalisiereBereich } from './bezugZeit';
import { MODUS_VORGABE, type LeserModus } from './v3/einzelModus';
import { heuteIso } from '../../lib/format';

/**
 * ── D35-F2 (Entscheid David 7.9.2026) · DER LETZTE ZWEIWERT-SCHALTER IST WEG ─
 *
 * Hier stand `leitfaelle` — «Rechtsprechung im Kopf», der Schalter, der den
 * Zaehler im Erlass-Kopf ein- und ausblendete. Mit Variante A traegt der Kopf
 * gar keine Artikel-Zahl mehr (`v3/LeserPanelOeffner.tsx`), der Griff heisst
 * «Erlass ▾» und gilt fuer den ganzen Erlass; ein Schalter, der eine Zahl
 * verbirgt, die es nicht mehr gibt, waere ein Waechter ohne Gegenstand
 * (§17-Gegengewicht: gestrichen statt bewacht). ERSATZLOS heisst hier auch: kein
 * neues Feld tritt an seine Stelle — der Kopf-Griff steht immer.
 *
 * `fussnoten` und `histansicht` sind schon mit D35-F3 (7.9.2026) in die
 * dreiwertige `vermerke`-Wahl aufgegangen. Die Historie aller drei — Ä68,
 * H0-Auflage 1, F8-Regel David 16.8.2026 — steht unveraendert in `src/index.css`
 * am Regelblock, in `v3/panelModell.ts` und in
 * `bibliothek/normen/hist-ansicht-h0-trennbarkeit.md`; sie wird nicht
 * nachgefuehrt, nur ergaenzt (§0 Ziff. 2b).
 *
 * DER BESTANDS-WERT WIRD WEITER GELESEN, aber nur noch fuer die eine
 * Bestands-Migration, die an ihm haengt (`lade()`, Bezugs-Facetten) — er wird
 * nicht mehr geschrieben und faellt beim naechsten `speichere()` weg.
 */
type ZweiWert = 'an' | 'aus';

/**
 * ── D35-F2 · WAS AM ARTIKEL STEHT, WAEHLT DER NUTZER ────────────────────────
 * Davids Nachtrag zum Variante-A-Entscheid, woertlich: «man soll mittels ansicht
 * alles einzelne abwählen können».
 *
 * Die Buchstaben sind DIESELBEN wie das `data-reg` der Funktionszeile
 * (`parts/Funktionszeile.tsx`, Registerfarben r/m/g/w) — eine Rubrik, ein
 * Buchstabe, an beiden Enden derselbe (§5). `a` ist die Aktionsgruppe rechts
 * («Zitat · Link · Amtliche Fassung ↗», `parts/ArtikelAktionen.tsx` — eine
 * vierte Aktion «⧉ Artikel daneben» ist mit D44, David 7.9.2026, ersatzlos
 * gestrichen); sie hat keine Registerfarbe, aber dieselbe Frage «steht das
 * an meinem Artikel?».
 *
 * EIN Attribut statt fuenf: `data-fuss-aus` traegt die ABGEWAEHLTEN Buchstaben,
 * und weil jeder Buchstabe genau einmal vorkommt, ist `[data-fuss-aus*="r"]`
 * eine eindeutige Frage. Fuenf Attribute waeren fuenf Wahrheiten ueber eine
 * Wahl (§5).
 *
 * DAS ATTRIBUT TRAEGT DIE ABGEWAEHLTEN, DAS FELD DIE GEWAEHLTEN — Absicht, keine
 * Nachlaessigkeit. Das FELD spiegelt das Menue (fuenf Haekchen, gesetzt = steht).
 * Das ATTRIBUT muss im Grundzustand die LEERE Zeichenkette sein: nur dann
 * trifft keine CSS-Regel, und nur dann bleibt das prerenderte HTML unberuehrt,
 * das VOR dem Buendel im Bild steht (R6/§6). Mit den Gewaehlten haette die Regel
 * `html:not([data-fuss-an*="r"])` lauten muessen — die greift auch, solange es
 * das Attribut noch gar nicht gibt, und der Leser saehe fuer einen Moment einen
 * Artikel ganz ohne Funktionszeile.
 *
 * ── W2·24-D40 (David 7.9.2026) · `f` = FASSUNG ist die sechste Rubrik ─────
 * Woertlich: «und wieso ist fassung nicht auch unten am artikel?». Der
 * Fassungs-Slot («Gilt seit … ▸» + Zeitleiste) stand bis D40 am ARTIKELKOPF und
 * war als einzige artikelbezogene Auskunft nicht Teil der Funktionszeile. Er ist
 * jetzt eine Rubrik wie die anderen — also braucht er auch deren Frage «steht das
 * an meinem Artikel?» und damit einen eigenen Buchstaben.
 *
 * `f` STEHT VORN, weil die Rubrik vorn steht: sie ist die Auskunft ueber den
 * Artikel SELBST, die vier danach zeigen von ihm weg (darum traegt sie das Wort
 * «Bezuege» auch nicht mit, `parts/Funktionszeile.tsx`). Die Reihenfolge dieser
 * Konstante IST die Reihenfolge in der Zeile und im Menue (§5).
 *
 * WAS `f` NICHT ENTSCHEIDET: ob die Fassungs-Auskunft ueberhaupt gilt. Das
 * bleibt die Dreier-Wahl `vermerke` (D35-F3) — «Fussnoten» und «aus» nehmen die
 * Rubrik weg, `f` waehlt innerhalb der Stellung «Fassung». Zwei Fragen, zwei
 * Schalter, keine zweite Wahrheit (§5).
 */
export type FussRubrik = 'f' | 'r' | 'm' | 'g' | 'w' | 'a';
/** Kanonische Reihenfolge — sie ist zugleich die Reihenfolge im Menue (§5). */
export const FUSS_RUBRIKEN: readonly FussRubrik[] = ['f', 'r', 'm', 'g', 'w', 'a'];

/**
 * D35-F3 (Entscheid David 7.9.2026, «A und verlustfrei») · DIE EINE WAHL.
 *
 * Davids Wortlaut: «es soll entweder fassung oder fussnoten angezeigt werden.
 * also entweder fassung, fussnoten oder aus». Bis hierher waren das ZWEI
 * unabhaengige Schalter mit vier erreichbaren Kombinationen (Messreihe D35
 * Teil 3, 7.9.2026: `fussnoten` schaltete den ganzen Apparat samt Markern,
 * `histansicht` nur den abgeleiteten Slot «Gilt seit …»).
 *
 * VERLUSTFREI heisst: die Wahl schaltet ausschliesslich die
 * AENDERUNGSHISTORIE — die build-seitig als `kl:'A'` klassifizierten Fussnoten
 * (`lib/normtext/browse.ts`) und den daraus abgeleiteten Fassungs-Slot. Jede
 * andere Fussnote (V/G/Z/U und jede OHNE Klasse) bleibt in ALLEN DREI
 * Stellungen sichtbar. Gemessen am ZPO-Apparat: `kl:A` 212, `kl:V` 96,
 * `kl:U` 3 — eine Radiogruppe im Wortsinn haette die 99 amtlichen
 * Nicht-Aenderungs-Fussnoten mitgenommen (§7/§8, H0-Auflage 1).
 *
 * PREIS, benannt statt versteckt (§8): mit dem Feld `fussnoten` faellt der
 * Schalter, der den GANZEN Apparat wegblendete. Das ist gewollt — er war die
 * einzige Stelle, an der die Oberflaeche amtlichen Nicht-Aenderungs-Apparat
 * verbarg. Wer ihn je wieder will, bekommt einen eigenen, klar benannten
 * Schalter («Fussnoten-Apparat»), keine Nebenwirkung dieser Wahl.
 */
export type VermerkeWahl = 'fassung' | 'fussnoten' | 'aus';
export const VERMERKE_WAHLEN: readonly VermerkeWahl[] = ['fassung', 'fussnoten', 'aus'];

export interface LeserOptionen {
  /** D35-F3 · die dreiwertige Aenderungs-Wahl → `html[data-vermerke]`. */
  vermerke: VermerkeWahl;
  /**
   * D35-F2 · die am Artikel gezeigten Rubriken → `html[data-fuss-aus]` (das
   * Attribut traegt das Komplement, Herleitung am Typ `FussRubrik`).
   *
   * Die Referenz wird NUR im Setter ersetzt (wie `bezugKlassen`), damit
   * `getSnapshot` stabil bleibt und ein fremder Toggle die Abonnenten nicht
   * re-rendern laesst (§15, Datei-Kopf).
   */
  fussRubriken: readonly FussRubrik[];
}

/**
 * LESER-SCHRIFTSKALA (David 16.8.2026, Punkt 4) — vier Stufen NUR für den
 * Normtext. Der globale App-Regler (`components/layout/useSchriftskala.ts`)
 * skaliert per `font-size` am <html> die ganze Anwendung mit; genau das war der
 * gemeldete Fehler, er bleibt aber als Barrierefreiheits-Einstellung unangetastet.
 *
 * Eigenes Feld statt `OptFeld`, weil VIERwertig. NAMEN statt Zahlen: ein
 * gespeicherter Faktor müsste bei jeder Skalen-Änderung neu gesnappt werden, ein
 * Name bleibt gültig. `normal` emittiert KEINE CSS-Regel (index.css) ⇒ die
 * Vorgabestufe ist byte-gleich zum Ist-Stand (R6/§6), der Pixelvergleich der
 * V3-Paritätsspecs bleibt gültig.
 */
export type LeserSchrift = 'normal' | 'mittel' | 'gross' | 'sehr-gross';

const KEY = 'lm.leser.optionen';
/** D35-F2 · Grundzustand: alles steht. Geteilte Konstante, damit der
 *  unveraenderte Leser dieselbe Array-Referenz sieht (Object.is, §15). */
/**
 * ── W2·24-D40 · DER STAND DES GESPEICHERTEN OBJEKTS ─────────────────────────
 *
 * WOZU eine Zahl im Speicher, wo bisher keine noetig war: `fussRubriken` traegt
 * die GEWAEHLTEN. Ein Buchstabe, der neu hinzukommt, fehlt darum in JEDEM
 * Bestands-Speicher — und «fehlt» heisst in diesem Feld «abgewaehlt». Ohne
 * Unterscheidung saehe jeder Leser, der die Rubriken je angefasst hat, die
 * Fassungs-Rubrik ab D40 als abgewaehlt: eine Auskunft, die er nie abbestellt
 * hat, waere still verschwunden (§8). Die Zahl beantwortet genau eine Frage —
 * «konnte dieser Speicher `f` ueberhaupt kennen?» — und sonst keine.
 *
 * WARUM `f` DABEI HINZUGEFUEGT WIRD, AUCH ZUM LEEREN ARRAY: bis D40 hing die
 * Fassungs-Auskunft ALLEIN an `vermerke` und stand am Artikelkopf. Wer im Menue
 * «Alles ausblenden» waehlte, blendete die FUENF Rubriken der Zeile aus; die
 * Fassung stand danach weiter da. Das getreue Bild dieses Willens ist «die
 * fuenf aus, `f` an» — nicht «alle sechs aus» (§8: eine Umstellung darf eine
 * getroffene Nutzerwahl nicht stillschweigend ausweiten).
 *
 * IDEMPOTENT und ohne Uhr (§2): solange der Speicher alt ist, ergaenzt jedes
 * Laden dasselbe `f`; der erste Schreibvorgang setzt `OPT_STAND` und die Wahl
 * gilt danach unveraendert so, wie sie im Menue steht — auch «f abgewaehlt».
 */
const STAND_KEY = 'stand';
const OPT_STAND = 2;

const DEFAULT_FUSS_RUBRIKEN: readonly FussRubrik[] = [...FUSS_RUBRIKEN];
const DEFAULT: LeserOptionen = { vermerke: 'fassung', fussRubriken: DEFAULT_FUSS_RUBRIKEN };

/** Alt-Schlüssel des dreiwertigen Historie-Felds (vor S1). */
const ALT_HIST_KEY = 'hist';
/** Alt-Werte, die «Änderungsvermerke sichtbar» BEDEUTETEN (beide Darstellungen). */
const ALT_HIST_AN: readonly string[] = ['fussnoten', 'chronologie'];

/**
 * MIGRATION — gespeicherte Optionen → das eine zweiwertige Feld + die Wahl.
 *
 * REIN und deterministisch (§2): kein Speicher, kein DOM, keine Uhr — und darum
 * eigene exportierte Funktion statt Zweig in `lade()`. Der Fall, der wehtut, ist
 * ein Bestands-Speicher, und der ist im Browser nicht mehr nachstellbar, sobald
 * er einmal überschrieben wurde (`src/tests/leser-optionen-migration.test.ts`).
 *
 * ── S1 (17.8.2026) · der Alt-Schlüssel `hist` ────────────────────────────────
 * 'aus' → 'aus'; 'fussnoten' UND 'chronologie' → 'an'. Beide Alt-Werte
 * bedeuteten «die Vermerke sind da», nur in zwei Darstellungen — sie auf 'aus'
 * abzubilden nähme dem Nutzer Substanz weg, die er ausdrücklich bestellt hatte
 * (§8). Der Satz gilt unverändert; er speist jetzt Stufe 2 unten.
 *
 * ── D35-F3 (7.9.2026) · zwei Booleans → eine Dreier-Wahl ─────────────────────
 * Die Abbildung ist Davids Entscheid vom 7.9.2026, Notation
 * `fussnoten`/`histansicht`:
 *
 *   an  / an   → `fassung`    (der Vorgabe-Zustand: Slot da, Apparat da)
 *   aus / an   → `fassung`    (wer den Apparat wegblendete, wollte die Fassung)
 *   an  / aus  → `fussnoten`  (wer den Slot abwählte, wollte den Apparat)
 *   aus / aus  → `aus`
 *
 * Ablesbar in EINER Regel: `histansicht === 'an'` ⇒ «fassung», sonst entscheidet
 * `fussnoten` zwischen «fussnoten» und «aus». Keine der vier Bestands-Stellungen
 * verliert dabei etwas, was sie sichtbar hatte — ausser dem Verbergen des
 * amtlichen Nicht-Änderungs-Apparats, das es nicht mehr gibt (§8, Herleitung am
 * Typ `VermerkeWahl`).
 *
 * Ein unbekannter Wert darf NIE durchrutschen: er landete als
 * `data-vermerke="…"` am <html>, wo keine Regel greift — die Radiogruppe stünde
 * dann auf einer Stellung, die es nicht gibt (gleiche Sicherung wie bei der
 * Schriftskala).
 */
export function migriereOptFelder(roh: Readonly<Record<string, unknown>>): LeserOptionen {
  return {
    vermerke: VERMERKE_WAHLEN.includes(roh.vermerke as VermerkeWahl)
      ? (roh.vermerke as VermerkeWahl)
      : ausAltenSchaltern(roh),
    fussRubriken: leseFussRubriken(roh),
  };
}

/**
 * D35-F2 · die Rubriken-Wahl aus dem Speicher.
 *
 * FEHLT der Schluessel ganz (jeder Bestands-Speicher vor D35-F2), gilt der
 * Grundzustand «alles steht» — und zwar als DIESELBE Referenz, damit ein
 * unveraenderter Leser gar keinen Re-Render sieht (§15).
 *
 * STEHT ein leeres Array da, ist das eine bewusste Nutzerwahl («alles
 * abgewaehlt», Menue-Zeile «Nur Gesetzestext lesen») und bleibt erhalten — sie
 * wird NICHT still auf den Grundzustand zurueckgesetzt (§8, dieselbe Regel wie
 * bei `bezugKlassen`).
 *
 * Ein unbekannter Buchstabe darf nie durchrutschen: er landete als
 * `data-fuss-aus="…x…"` am <html>, wo keine Regel ihn kennt — dieselbe
 * Whitelist-Sicherung wie bei Schriftstufe und `vermerke`. Die Reihenfolge ist
 * immer die kanonische, damit derselbe Zustand immer dieselbe Zeichenkette
 * ergibt (deterministisch, §2).
 */
function leseFussRubriken(roh: Readonly<Record<string, unknown>>): readonly FussRubrik[] {
  if (!Array.isArray(roh.fussRubriken)) return DEFAULT_FUSS_RUBRIKEN;
  const gewaehlt = new Set(roh.fussRubriken as unknown[]);
  // D40 · der Bestands-Speicher kann `f` gar nicht kennen (s. `OPT_STAND`).
  if (roh[STAND_KEY] !== OPT_STAND) gewaehlt.add('f');
  return FUSS_RUBRIKEN.filter((r) => gewaehlt.has(r));
}

/** D35-F3 · die zwei Bestands-Booleans auf die Dreier-Wahl abbilden (Tabelle oben). */
function ausAltenSchaltern(roh: Readonly<Record<string, unknown>>): VermerkeWahl {
  const hist = leseAltHist(roh);
  if (hist === 'an') return 'fassung';
  return roh.fussnoten === 'aus' ? 'aus' : 'fussnoten';
}

/** S1-Regel, unverändert: `histansicht`, sonst Alt-Schlüssel `hist`, sonst Vorgabe 'an'. */
function leseAltHist(roh: Readonly<Record<string, unknown>>): ZweiWert {
  if (roh.histansicht === 'an' || roh.histansicht === 'aus') return roh.histansicht;
  const alt = roh[ALT_HIST_KEY];
  if (alt === 'aus') return 'aus';
  return typeof alt === 'string' && ALT_HIST_AN.includes(alt) ? 'an' : 'an';
}
// ── Ä27 IST GESTRICHEN (Ä69, Entscheid David 17.8.2026) ──────────────────────
// `HINWEIS_VERMERKE_OHNE_FUSSNOTEN` («Marker und Apparat sind mit den Fussnoten
// ausgeblendet») stand als Hinweiszeile am Schalter «Änderungsvermerke», sobald
// «Fussnoten: aus» war. Er erklärte eine KREUZ-ABHÄNGIGKEIT: der Schalter zeigte
// «✓ an», sichtbar war aber nur die «Fassung»-Zeile, weil Marker und Apparat der
// A-Klasse am Fussnoten-Schalter hingen.
//
// Mit der Entkopplung (Ä68, index.css) gibt es diese Abhängigkeit nicht mehr.
// «Änderungsvermerke: an» heisst jetzt in JEDER Stellung des Fussnoten-Schalters
// dasselbe und ist immer vollständig eingelöst — die Fassungs-Zeile ist die
// ganze Fläche des Schalters, und sie ist dann da. Der Satz beschreibt seit der
// Entkopplung die Wirkung des ANDEREN Schalters und legt am Vermerke-Schalter
// eine Teil-Unwirksamkeit nahe, die es nicht gibt (§8, jetzt umgekehrt).
// §17-Rückbau: gestrichen statt umformuliert — eine Hinweiszeile ohne erklärte
// Abhängigkeit hat keinen Anlass mehr. Beide Menüs (V1 `LeserAnsichtMenu`, V3
// `LeserAnsichtV3`) verlieren sie gemeinsam; sie war ausdrücklich EINE Konstante,
// damit beide Hüllen denselben Satz zeigen (§5) — also fällt sie auch in beiden.

/** Aufsteigend — die Reihenfolge IST die Regler-Achse (`leserSchrift.ts`). */
export const SCHRIFT_STUFEN: readonly LeserSchrift[] = ['normal', 'mittel', 'gross', 'sehr-gross'];
const DEFAULT_SCHRIFT: LeserSchrift = 'normal';

// W2·7-BEZUG/B4: Grundzustand der Bezugs-Facetten = NUR Leitentscheide (§9 B4
// «Default konservativ»). Die geteilte Konstanten-Referenz macht den häufigen
// Fall referenz-stabil: solange niemand umschaltet, liefert `getKlassenSnapshot`
// IMMER dasselbe Array-Objekt ⇒ kein Re-Render der Abonnenten (Object.is, §15).
const DEFAULT_BEZUG_KLASSEN: readonly BezugStatus[] = [...DEFAULT_KLASSEN];
const KEINE_KANTONE: readonly string[] = [];

interface GeladenerZustand {
  opt: LeserOptionen;
  schrift: LeserSchrift;
  ansicht: LeserModus;
  bezugKlassen: readonly BezugStatus[];
  bezugKantone: readonly string[];
  bezugVon: string;
  bezugBis: string;
  /** Wurde die Alt-Stufen-Wahl gerade auf einen Bereich abgebildet? Dann muss
   *  der Aufrufer einmal zurückschreiben (sonst wandert der Grenzwert täglich). */
  migriert: boolean;
}

function lade(): GeladenerZustand {
  const grund = {
    opt: { ...DEFAULT }, schrift: DEFAULT_SCHRIFT, ansicht: MODUS_VORGABE,
    bezugKlassen: DEFAULT_BEZUG_KLASSEN, bezugKantone: KEINE_KANTONE,
    bezugVon: '', bezugBis: '', migriert: false,
  };
  try {
    const roh = localStorage.getItem(KEY);
    if (!roh) return grund;
    const o = JSON.parse(roh) as Record<string, unknown>
      & { zeitraum?: unknown; schrift?: unknown; bezugKlassen?: unknown;
          bezugKantone?: unknown; bezugVon?: unknown; bezugBis?: unknown };
    // S1: Whitelist-Prüfung UND Alt-Wert-Abbildung in einer reinen Funktion.
    const opt = migriereOptFelder(o);
    // Schrift-Stufe: dieselbe Whitelist-Prüfung wie oben — was nicht im
    // Vokabular steht (fehlend, `undefined`, Zahl, Alt-Wort, manipulierter
    // Speicher), fällt auf die Vorgabestufe. Ein unbekannter Wert darf NIE
    // durchrutschen: er landete sonst als `data-leserschrift="…"` am <html>,
    // wo keine Regel greift — der Nutzer sähe eine Stufe, die es nicht gibt.
    const schrift = SCHRIFT_STUFEN.includes(o.schrift as LeserSchrift)
      ? (o.schrift as LeserSchrift) : DEFAULT_SCHRIFT;
    // B5-Migration: steht schon EIN Bereichs-Feld im Speicher, ist der Bereich die
    // Wahrheit und `zeitraum` ein Überbleibsel, das beim nächsten Schreiben
    // wegfällt. Sonst wird die Alt-Stufe einmalig abgebildet (§8) — `heuteIso`
    // ist die einzige Uhr auf diesem Weg und sitzt genau hier an der Grenze (§2).
    const hatBereich = 'bezugVon' in o || 'bezugBis' in o;
    const bereich = hatBereich
      ? normalisiereBereich(o.bezugVon, o.bezugBis)
      : migriereZeitraum(o.zeitraum, heuteIso(new Date()));
    const migriert = !hatBereich && bereich.von !== '';
    // Fehlt der Schlüssel GANZ (Bestands-Speicher vor B4), gilt der Default.
    // Steht dort ein leeres Array, ist das eine bewusste Nutzerwahl («alles
    // abgewählt») und bleibt erhalten — normalisiereKlassen setzt sie NICHT
    // still auf den Default zurück (§8, siehe bezugAuswahl.ts).
    // MIGRATION (W2·7-BEZUG/B4, einmalig): der frühere Schalter «Entscheide»
    // ist entfallen (ersetzt durch das Dropdown «Rechtsprechung ▾»). Wer ihn auf
    // 'aus' gestellt hatte, wollte keine Entscheide am Artikel sehen — dieser
    // Wille wird übernommen, indem alle Facetten abgewählt starten, statt ihm
    // die Auflistung mit der neuen Voreinstellung wieder einzublenden (§8: eine
    // Umstellung darf eine getroffene Nutzerwahl nicht stillschweigend kippen).
    // Greift NUR, solange keine Facetten-Wahl gespeichert ist, also genau einmal.
    const bezugKlassen = Array.isArray(o.bezugKlassen)
      ? normalisiereKlassen(o.bezugKlassen)
      // D35-F2: gelesen wird der ROHE Bestands-Wert, nicht mehr ein Feld des
      // Zustands — den Schalter `leitfaelle` gibt es seit D35-F2 nicht mehr
      // (Herleitung am Typ oben). Die Migration selbst bleibt Wort für Wort
      // stehen: sie beschreibt einen Speicher von 2026, nicht den Ist-Stand
      // (§0 Ziff. 2b), und ein Bestands-Speicher mit 'aus' existiert weiterhin.
      : (o.leitfaelle === 'aus' ? [] : DEFAULT_BEZUG_KLASSEN);
    const bezugKantone = Array.isArray(o.bezugKantone) ? normalisiereKantone(o.bezugKantone) : KEINE_KANTONE;
    // W2·5m · die gemerkte Lesart (Kap. 15.6). Dieselbe Whitelist-Sicherung wie
    // bei Schriftstufe und `vermerke`: ein fremder Wert fällt auf die Vorgabe
    // «Ganzer Erlass» — und ein FEHLENDES Feld ebenso, das ist die Migration
    // jedes Bestands-Speichers (F-E3, entschieden David 14.9.2026).
    const ansicht: LeserModus = o.ansicht === 'artikel' ? 'artikel' : MODUS_VORGABE;
    return { opt, schrift, ansicht, bezugKlassen, bezugKantone, bezugVon: bereich.von, bezugBis: bereich.bis, migriert };
  } catch {
    // localStorage gesperrt (privater Modus) ODER kaputtes JSON → Default.
    return grund;
  }
}

// getSnapshot muss eine STABILE Referenz liefern (sonst warnt/looped React).
// `aktuell`/`aktuellVon`/`aktuellBis` werden nur bei echten Änderungen ersetzt.
const start = typeof window === 'undefined'
  ? {
      opt: { ...DEFAULT }, schrift: DEFAULT_SCHRIFT, ansicht: MODUS_VORGABE,
      bezugKlassen: DEFAULT_BEZUG_KLASSEN, bezugKantone: KEINE_KANTONE,
      bezugVon: '', bezugBis: '', migriert: false,
    }
  : lade();
let aktuell: LeserOptionen = start.opt;
let aktuellSchrift: LeserSchrift = start.schrift;
let aktuellAnsicht: LeserModus = start.ansicht;
let aktuellKlassen: readonly BezugStatus[] = start.bezugKlassen;
let aktuellKantone: readonly string[] = start.bezugKantone;
let aktuellVon: string = start.bezugVon;
let aktuellBis: string = start.bezugBis;

function speichere(): void {
  try {
    // Die gestrichenen Schlüssel (`zeitraum`, `hist`, `verweise`, `linien`)
    // stehen bewusst NICHT im Objekt — Begründung im Datei-Kopf.
    localStorage.setItem(KEY, JSON.stringify({
      ...aktuell, [STAND_KEY]: OPT_STAND, schrift: aktuellSchrift,
      ansicht: aktuellAnsicht,
      bezugKlassen: aktuellKlassen, bezugKantone: aktuellKantone,
      bezugVon: aktuellVon, bezugBis: aktuellBis,
    }));
  } catch {
    /* Speicher gesperrt — die Wahl gilt dann nur für die Sitzung */
  }
}

// Die Alt-Wahl SOFORT festschreiben. Ohne das bliebe `zeitraum` im Speicher und
// `migriereZeitraum` rechnete bei jedem Laden gegen ein neues «heute» — aus
// «letzte 5 Jahre» würde ein Grenzwert, der jeden Tag um einen Tag weiterrutscht.
// Genau einmal: nach dem Schreiben steht `bezugVon` da und `hatBereich` greift.
if (start.migriert) speichere();

/** Wendet die gespeicherten Toggle-Optionen VOR dem ersten Render an (Aufruf in
 *  main.tsx, analog `wendeThemaAn`). Setzt `data-vermerke` und `data-fuss-aus`
 *  am <html>. Der Zeit-Bereich ist JS-konsumiert (kein
 *  data-*-Attribut).
 *
 *  D35-F3: `data-fussnoten` und `data-histansicht` werden nicht mehr gesetzt —
 *  und der PRERENDER kennt sie ohnehin nicht (die Attribute entstehen erst
 *  hier, nach dem Laden des Bündels). Der Grundzustand des ausgelieferten HTML
 *  ist damit unverändert byte-gleich (R6/§6, `check:golden-normtext`): die
 *  Dreier-Wahl ist reine Darstellung über EIN Attribut am <html>, kein
 *  Markup-Unterschied. */
export function wendeLeserOptionenAn(): void {
  if (typeof document === 'undefined') return;
  const g = lade();
  aktuell = g.opt;
  aktuellSchrift = g.schrift;
  // W2·5m: JS-konsumiert wie die Bezugs-Facetten, KEIN data-*-Attribut — der
  // Modus entscheidet, WELCHE Komponenten überhaupt rendern (ein Artikel statt
  // des ganzen Erlasses). Das kann CSS nicht, und es darf es auch nicht: der
  // Prerender liefert die Gesamtansicht, ein CSS-Verstecken liesse den ganzen
  // Erlass im DOM stehen (§15) und die Hülle behauptete «ein Artikel».
  aktuellAnsicht = g.ansicht;
  // B4: JS-konsumiert (kein data-*-Attribut) — die Weiche «welcher Shard» und
  // die Gruppierung der Kanten sind React-Zustand, nicht CSS.
  aktuellKlassen = g.bezugKlassen;
  aktuellKantone = g.bezugKantone;
  aktuellVon = g.bezugVon;
  aktuellBis = g.bezugBis;
  if (g.migriert) speichere();
  const el = document.documentElement;
  // D35-F2: `data-leitfaelle` wird nicht mehr gesetzt — das Feld gibt es nicht
  // mehr (Herleitung am Typ oben), und die einzige CSS-Regel, die es je
  // auswertete, ist schon mit D35-F1 gefallen (`src/index.css`, Block
  // «HIER STAND EINE REGEL, DIE GELOGEN HAT»). Ein Attribut ohne Regel wäre
  // eine Leiche am <html> (§17-Gegengewicht).
  el.setAttribute('data-fuss-aus', fussAusWert(aktuell.fussRubriken));
  // D35-F3: die eine Änderungs-Wahl. Ein ATTRIBUT statt zweier — die Stellungen
  // schliessen einander aus, und zwei Attribute für eine Frage wären genau die
  // zweite Wahrheit (§5), die David am Menü gesehen hat.
  el.setAttribute('data-vermerke', aktuell.vermerke);
  // Leser-Schriftskala: CSS-getrieben wie die Toggles, also dasselbe
  // Pre-Paint-Attribut am <html>. Das ATTRIBUT steht global, die WIRKUNG nicht:
  // die einzige Regel, die es auswertet, ist auf `.lc-leser .nt-art-cv` gescopt
  // (index.css) — Kopfzeile, Seitenleiste und der Rest der App bleiben unberührt.
  // Genau darin unterscheidet es sich vom globalen `font-size`-Steller am <html>.
  // Die Vorgabestufe 'normal' emittiert KEINE Regel ⇒ Grundzustand byte-gleich (R6).
  el.setAttribute('data-leserschrift', aktuellSchrift);
}

const hoerer = new Set<() => void>();

/** D35-F2 · das KOMPLEMENT als Attributwert (Herleitung am Typ `FussRubrik`).
 *  Grundzustand «alles steht» ⇒ leere Zeichenkette ⇒ keine CSS-Regel greift. */
function fussAusWert(gewaehlt: readonly FussRubrik[]): string {
  const menge = new Set(gewaehlt);
  return FUSS_RUBRIKEN.filter((r) => !menge.has(r)).join('');
}

/**
 * D35-F2 · die am Artikel gezeigten Rubriken setzen.
 *
 * Mechanik zeichengleich `setzeVermerke`: persistieren, EIN Attribut direkt ans
 * <html>, Hörer wecken — KEIN Artikel-Re-Render (§15). Die 1686 Artikel eines
 * Erlasses abonnieren den Store nicht; sichtbar wird die Wahl über CSS
 * (`html[data-fuss-aus]`, `src/index.css`). Genau das ist der Grund, aus
 * dem die Wahl ein Attribut ist und kein React-State: ein Abo je Artikel wären
 * 1686 Neu-Renderings je Klick.
 *
 * NORMALISIERT auf die kanonische Reihenfolge, damit derselbe Zustand immer
 * dieselbe Zeichenkette ergibt (§2) — die Sonden vergleichen das Attribut.
 */
export function setzeFussRubriken(gewaehlt: readonly FussRubrik[]): void {
  const menge = new Set(gewaehlt);
  const neu = FUSS_RUBRIKEN.filter((r) => menge.has(r));
  if (neu.join('') === aktuell.fussRubriken.join('')) return;
  aktuell = { ...aktuell, fussRubriken: neu };
  speichere();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-fuss-aus', fussAusWert(neu));
  }
  hoerer.forEach((f) => f());
}

/**
 * D35-F3 · die Änderungs-Wahl setzen. Mechanik zeichengleich `setzeOption`:
 * persistieren, Attribut direkt ans <html>, Hörer wecken — KEIN Artikel-
 * Re-Render (§15), die Umschaltung ist reines CSS. Ein unbekannter Wert kann
 * hier nicht eintreten (Typ), und `lade()` fängt ihn beim nächsten Start ab.
 *
 * Idempotent: dieselbe Stellung noch einmal zu wählen ist ein No-op — genau das
 * Verhalten, das eine Radiogruppe zusagt (ein Klick auf den gesetzten Punkt
 * schaltet ihn nicht ab).
 */
export function setzeVermerke(w: VermerkeWahl): void {
  if (w === aktuell.vermerke) return;
  aktuell = { ...aktuell, vermerke: w };
  speichere();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-vermerke', w);
  }
  hoerer.forEach((f) => f());
}

/**
 * W2·7-BEZUG/B5: Zeit-Bereich der Bezüge setzen (JS-Filter, kein data-*-Attribut).
 * Persistiert + benachrichtigt die Hörer; nur die Bereichs-Abonnenten
 * (Primitiv-Selektoren) und die Kanten-Auswahl rendern neu.
 *
 * Beide Enden werden GEMEINSAM gesetzt und normalisiert: eine Zieh-Auswahl am
 * Zeitstrahl ist EINE Geste, und zwei getrennte Setzer erzeugten zwischendurch
 * einen Zustand mit vertauschten Enden — sichtbar als kurz leere Auflistung.
 */
export function setzeBezugZeit(von: string, bis: string): void {
  const neu = normalisiereBereich(von, bis);
  if (neu.von === aktuellVon && neu.bis === aktuellBis) return;
  aktuellVon = neu.von;
  aktuellBis = neu.bis;
  speichere();
  hoerer.forEach((f) => f());
}

/** Leser-Schriftskala setzen. Mechanik wie `setzeOption`: Attribut direkt
 *  ans <html>, persistieren, Hörer benachrichtigen — KEIN Artikel-Re-Render, die
 *  Umschaltung ist reines CSS (§15). Ein unbekannter Wert kann hier nicht
 *  eintreten (Typ), und `lade()` fängt ihn beim nächsten Start ab. */
export function setzeLeserSchrift(s: LeserSchrift): void {
  if (s === aktuellSchrift) return;
  aktuellSchrift = s;
  speichere();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-leserschrift', s);
  }
  hoerer.forEach((f) => f());
}

/**
 * W2·7-BEZUG/B4: Facetten-Klassen der Bezüge setzen. Wie `setzeBezugZeit` ein
 * JS-Filterwert (kein Attribut). Die Referenz-Gleichheit wird bewusst über den
 * INHALT geprüft und nicht über die Objekt-Identität: die Aufrufer bauen die
 * Menge aus `schalteKlasse` immer neu, ein naiver `===`-Vergleich liefe also
 * nie an und jeder Klick würde alle Abonnenten re-rendern — auch der Klick,
 * der nichts ändert (§15).
 */
export function setzeBezugKlassen(klassen: readonly BezugStatus[]): void {
  const neu = normalisiereKlassen(klassen);
  if (neu.length === aktuellKlassen.length && neu.every((k, i) => k === aktuellKlassen[i])) return;
  aktuellKlassen = neu;
  speichere();
  hoerer.forEach((f) => f());
}

/** B4: Kantons-Auswahl setzen (leer = keine Einschränkung). Siehe
 *  `setzeBezugKlassen` zur Inhalts- statt Identitäts-Prüfung. */
export function setzeBezugKantone(kantone: readonly string[]): void {
  const neu = normalisiereKantone(kantone);
  if (neu.length === aktuellKantone.length && neu.every((k, i) => k === aktuellKantone[i])) return;
  aktuellKantone = neu;
  speichere();
  hoerer.forEach((f) => f());
}

// Cross-Tab-Synchronisation: ein einziger Storage-Listener am Modul (nicht pro
// Abo, sonst entfernt das erste Unsubscribe ihn für alle). Gleiche-Tab-Sync
// läuft über die `hoerer` (setzeOption/setzeBezugZeit benachrichtigen direkt).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    wendeLeserOptionenAn();
    hoerer.forEach((f) => f());
  });
}

function abonniere(f: () => void): () => void {
  hoerer.add(f);
  return () => {
    hoerer.delete(f);
  };
}

function getSnapshot(): LeserOptionen {
  return aktuell;
}
function getServerSnapshot(): LeserOptionen {
  return DEFAULT;
}

/** React-Hook auf die aktuellen Toggle-Optionen (für die Switch-Buttons). */
export function useLeserOptionen(): LeserOptionen {
  return useSyncExternalStore(abonniere, getSnapshot, getServerSnapshot);
}

/** B5: Primitiv-Selektoren auf die beiden Bereichs-Enden. ZWEI Hooks auf zwei
 *  Strings statt einer auf `{von, bis}` — Begründung (stabile Referenz) im
 *  Datei-Kopf. Wer beide Enden als Objekt braucht, baut es im eigenen `useMemo`. */
function getVonSnapshot(): string {
  return aktuellVon;
}
function getBisSnapshot(): string {
  return aktuellBis;
}
function getLeerSnapshot(): string {
  return '';
}
export function useBezugVon(): string {
  return useSyncExternalStore(abonniere, getVonSnapshot, getLeerSnapshot);
}
export function useBezugBis(): string {
  return useSyncExternalStore(abonniere, getBisSnapshot, getLeerSnapshot);
}

/** Primitiv-Selektor auf die Leser-Schriftstufe — nur ein String, also rendern
 *  die Abonnenten (die drei Regler-Elemente) bei fremden Toggles nicht neu
 *  (Object.is, §15). Der Normtext folgt dem `data-leserschrift`-Attribut per
 *  CSS und wird beim Umschalten NICHT neu gerendert. */
function getSchriftSnapshot(): LeserSchrift {
  return aktuellSchrift;
}
function getSchriftServerSnapshot(): LeserSchrift {
  return DEFAULT_SCHRIFT;
}
export function useLeserSchriftStufe(): LeserSchrift {
  return useSyncExternalStore(abonniere, getSchriftSnapshot, getSchriftServerSnapshot);
}

/** B4: Selektoren auf die Bezugs-Facetten. Die Arrays werden ausschliesslich in
 *  den Settern ersetzt und dazwischen geteilt; im Grundzustand ist es dieselbe
 *  Modul-Konstante (`DEFAULT_BEZUG_KLASSEN`), sodass der unveränderte Reader gar
 *  keinen Re-Render sieht. */
function getKlassenSnapshot(): readonly BezugStatus[] {
  return aktuellKlassen;
}
function getKlassenServerSnapshot(): readonly BezugStatus[] {
  return DEFAULT_BEZUG_KLASSEN;
}
export function useBezugKlassen(): readonly BezugStatus[] {
  return useSyncExternalStore(abonniere, getKlassenSnapshot, getKlassenServerSnapshot);
}

/**
 * Die Klassen NICHT-reaktiv lesen — für Entscheidungen INNERHALB eines Effekts.
 *
 * Warum das nötig ist (Befund 28.7.2026, an der Netzwerk-Sonde gemessen): der
 * Reader ist prerendert und wird hydriert. Während der Hydration liefert
 * `useSyncExternalStore` bewusst den SERVER-Snapshot, also den Default — auch
 * wenn im localStorage längst ein erweiterter Zustand steht und
 * `wendeLeserOptionenAn()` ihn vor dem ersten Render ins Modul geschrieben hat.
 * Ein Effekt, der in diesem Moment «bin ich erweitert?» am gerenderten Wert
 * fragt, bekommt «nein» und lädt den schlanken Shard — den er im erweiterten
 * Zustand gerade NICHT laden soll. Gemessen kamen dann beide Shards über die
 * Leitung, und die Zusage «an die Stelle, nie zusätzlich» war falsch.
 *
 * Der Modulwert kennt diese Verzögerung nicht: er steht seit `wendeLeserOptionenAn`
 * richtig. Für die RENDER-Ausgabe bleibt der Hook massgeblich (sonst entstünde
 * ein Hydration-Mismatch) — dieser Getter ist ausschliesslich für Effekte.
 */
export function holeBezugKlassen(): readonly BezugStatus[] {
  return aktuellKlassen;
}

function getKantoneSnapshot(): readonly string[] {
  return aktuellKantone;
}
function getKantoneServerSnapshot(): readonly string[] {
  return KEINE_KANTONE;
}
export function useBezugKantone(): readonly string[] {
  return useSyncExternalStore(abonniere, getKantoneSnapshot, getKantoneServerSnapshot);
}

/**
 * W2·5m · die Lesart setzen («Ganzer Erlass» / «Einzelner Artikel»).
 *
 * Anders als `setzeVermerke` und `setzeFussRubriken` schreibt dieser Setzer
 * KEIN Attribut ans <html>: der Modus ist eine React-Frage (welche Komponenten
 * rendern), keine CSS-Frage. Die Zahl der Abonnenten bleibt trotzdem klein —
 * es abonniert der Rahmen, nicht der Artikel (`v3/LeserRahmenV3.tsx`).
 *
 * Idempotent: dieselbe Lesart noch einmal zu wählen ist ein No-op — das
 * Verhalten, das eine Radiogruppe zusagt.
 */
export function setzeLeserAnsicht(m: LeserModus): void {
  if (m === aktuellAnsicht) return;
  aktuellAnsicht = m;
  speichere();
  hoerer.forEach((f) => f());
}

function getAnsichtSnapshot(): LeserModus {
  return aktuellAnsicht;
}

/**
 * Die gemerkte Lesart NICHT-reaktiv lesen — dieselbe Bauform und derselbe
 * Grund wie `holeBezugKlassen()` oben: während der Hydration liefert
 * `useSyncExternalStore` bewusst den Server-Snapshot, der Modulwert steht da
 * schon richtig. Gebraucht wird der Getter ausserhalb des Renders (Effekte)
 * und von der Sonde `src/tests/leser-einzelmodus-speicher.test.ts`, die den
 * Bestands-Speicher prüft — den Fall, der im Browser nicht mehr nachstellbar
 * ist, sobald er einmal überschrieben wurde.
 */
export function holeLeserAnsicht(): LeserModus {
  return aktuellAnsicht;
}

/**
 * DER SERVER-SNAPSHOT IST IMMER DIE VORGABE — und das ist kein Detail.
 *
 * Die Leser-Seiten sind prerendert und werden hydriert. Lieferte dieser Getter
 * die gemerkte Wahl, rendete der Client beim ERSTEN Durchgang etwas anderes als
 * im ausgelieferten HTML steht (ein Artikel statt des Erlasses) — ein
 * Hydration-Mismatch, der React den ganzen Baum verwerfen lässt.
 * `useSyncExternalStore` ist genau dafür gebaut: es nimmt beim Hydrieren diesen
 * Wert und rendert unmittelbar danach mit dem echten nach. Der Prerender bleibt
 * damit Gesamtansicht (Kap. 15.6, SEO-Punkt), ohne dass die Präferenz verloren
 * geht.
 */
function getAnsichtServerSnapshot(): LeserModus {
  return MODUS_VORGABE;
}

/** Primitiv-Selektor auf die gemerkte Lesart — ein String, also rendern die
 *  Abonnenten bei fremden Toggles nicht neu (Object.is, §15). */
export function useLeserAnsicht(): LeserModus {
  return useSyncExternalStore(abonniere, getAnsichtSnapshot, getAnsichtServerSnapshot);
}
