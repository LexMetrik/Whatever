import {
  pfadTeil, entscheidPfad, erlassVonPfad, gesetzPfad, verlaufLabel, katalogKurzform,
  labelAusMeta,
  type VerlaufManifeste,
} from './verlaufLabel';
import { reiterKategorie, artikelLabelVonPfad, KAT_META } from './tabGruppen';
import { metaFuerPfad } from './seo';

// ─── Offene In-App-Reiter (Tab-Streifen, Auftrag David) ─────────────────────
//
// SSoT des localStorage-Keys 'lexmetrik-tabs' (§5). Reines Speicher-Werkzeug,
// KEINE Rechtslogik (§3): die Liste der zugleich offenen Reiter (Engines,
// Gesetze, Vorlagen, Entscheide), damit man ohne Browser-Tab zwischen mehreren
// hin- und herwechseln kann. Gespeichert wird NUR der Navigationspfad (+ optio-
// nales Anzeige-Label), NIE Formularinhalte (Berufsgeheimnis; das v1 erhält die
// Reiter-LISTE über Reloads, nicht den flüchtigen Formular-State — bewusste
// Grenze, navigationsbasiert). Reihenfolge = Array-Position, NEUE Reiter HINTEN
// angehängt (stabil, anders als der neueste-vorn-Ring in verlauf.ts) — kein
// Zeitstempel, also kein Date.now() in src/lib (§2 Determinismus).

export interface TabEintrag {
  path: string;
  label?: string;
  /** ── D27 (David 6.9.2026) · DER GEWÄHLTE ANKER — SEIT D27 NUR NOCH RÜCKFALL
   *  `path` trägt die LESESTELLUNG: der Scroll-Spy des Lesers schiebt dort
   *  laufend `#art-…` hinein (`aktualisiereTabArtikel`), damit ein Neustart an
   *  derselben Stelle aufsetzt (§5a Ziff. 6) und die Reiter-Liste die Position
   *  zeigt.
   *
   *  Der R2-Nachzug (F5) baute die Beschriftung ausdrücklich NICHT daraus,
   *  sondern aus diesem Feld — dem Anker, den die ADRESSE trug —, weil dieselbe
   *  Adresse sonst zwei Beschriftungen trug («ZGB» kalt, «Art. 3 ZGB» nach dem
   *  Scrollen). David 6.9.2026 hat die Regel UMGEDREHT: «diese funktion, dass
   *  es anzeigt in welchem artikel wir sind, soll der tab bekommen. es kann
   *  dann direkt im gesetz raus.» Determinismus (§2) heisst seither «gleiche
   *  LESESTELLUNG ⇒ gleiche Beschriftung» statt «gleiche Adresse ⇒ gleiche
   *  Beschriftung» — und die Lesestellung ist der gespeicherte `path`, der den
   *  Neustart überlebt (Kaltstart == SPA == Reload bei gleicher Stellung).
   *
   *  `wahl` bleibt der RÜCKFALL für das Fenster VOR dem ersten Spy-Lauf: ein
   *  Deep-Link `…#art-336_c`, der über `merkeTab` ohne Hash im `path`
   *  nachaktualisiert wird, verlöre sonst seinen Artikel, bis der Leser das
   *  erste Mal gescrollt hat. Er wird nie aus der Lesestellung nachgezogen. */
  wahl?: string;
  /** ── W2·25 (Spec `FAHRPLAN-DESIGN-IDENTITAET.md` §7) · ANGEHEFTET ────────
   *  Ein angehefteter Reiter steht schmal ganz links, trägt kein ✕ und
   *  überlebt «Alle schliessen» wie den Neustart (§5a Ziff. 5).
   *
   *  DIE D16-AUFLAGE STECKT IM WORT «FLACH»: Anheften ist KEINE zweite
   *  Anzeige-Ordnung, sondern eine Eigenschaft des Eintrags, die den EINEN
   *  Speicher umsortiert (feste zuerst, `hefteAn`). Fixer 1c hat jede
   *  Anzeige-Gruppierung entfernt, weil sie das Ziehen einsammelte («es geht
   *  nur wenn nur gesetze offen sind — bug», `e2e/w224-reiter-umordnen-d16`);
   *  eine Gruppierung, die das Anheften nachbaut, wäre derselbe Defekt unter
   *  neuem Namen. Was die Leiste zeigt, ist weiterhin `tabs` in
   *  Speicherreihenfolge — nur dass die festen darin vorn stehen.
   *
   *  DER PREIS DAFÜR IST EINE ZONENGRENZE, und die wird ABGELEHNT, nicht
   *  still korrigiert: ein Zug, der einen freien Reiter vor einen festen
   *  brächte, schreibt gar nichts (`ordneTabsUm` meldet `false`, und die
   *  Leiste zeigt die Sperre schon unter dem Zeiger). Ein still zurechtgerückter
   *  Zug wäre genau das D16-Bild — man zieht, und es geschieht etwas anderes.
   *
   *  DIE EIGENSCHAFT GEHÖRT DEM PLATZ, NICHT DEM DOKUMENT (Browser-Norm): eine
   *  Navigation IM angehefteten Reiter (`ersetzeTab`) lässt ihn angeheftet. */
  fest?: boolean;
}

// ─── D7 (David 6.9.2026: «achte darauf dass der reiter bei gesetz mitzählt») ─
//
// PFLICHTFALL (e) aus dem Befund: «Übersicht /gesetze: Reiter? — Regel
// festlegen». Die bis hierher geltende Regel war «Übersichten erzeugen KEINEN
// Reiter» (`components/TabTracker.tsx`, Kommentar seit der Einführung). Sie
// hatte einen guten Grund — ein Seitenleisten-Klick sollte nicht jedes Mal
// einen Reiter anlegen —, aber dieser Grund ist mit §5a Ziff. 3 entfallen: seit
// dem R2-Nachzug ERSETZT eine Navigation den aktiven Reiter, sie häuft nicht
// mehr an. Was damals Wildwuchs erzeugt hätte, erzeugt heute genau einen
// Reiter, der weiterwandert.
//
// NEUE REGEL, in einem Satz: Die fünf BEREICHS-Übersichten sind Reiter wie
// jedes andere Dokument — «Gesetze», «Rechtsprechung», «Materialien»,
// «Rechner», «Vorlagen»; sie zählen in «N offen» und in Alt+Ziffer mit.
//
// ABWEICHUNG, ausdrücklich offengelegt (§7) — GALT BIS R14, 7.9.2026: Die
// STARTSEITE «/» erzeugte KEINEN Reiter. Sie war kein Bestandteil der Sammlung,
// sondern ihr Titelblatt: über die Marke von jeder Route aus einen Klick
// entfernt, ohne eigenen Zustand, und ein Reiter «Sammlung» neben den fünf
// Bereichen wäre der einzige, den man nie schliessen wollte. Eine Kurzform trug
// sie trotzdem (unten) — sie konnte als Reiter EXISTIEREN, wenn jemand sie
// ausdrücklich daneben öffnete (Pane, Ctrl-Klick, Prüfbefund R3-F7); nur
// angelegt wurde sie nicht von selbst. Ebenso ohne Reiter: Meta- und
// Infoseiten (/ueber, /methodik, /einstellungen …).
//
// ── R14 (Entscheid David 7.9.2026, Variante A) · DIE ABWEICHUNG IST AUFGEHOBEN
//
// Der Absatz darüber bleibt als DATIERTER BELEG stehen (§0 Ziff. 2b: Belege
// altern nicht, sie werden ergänzt, nicht nachgeführt) — er beschreibt den
// Stand bis `79023e630`. Aufgehoben ist er aus einem gemessenen Grund, nicht
// aus Geschmack. Davids Wortlaut 7.9.2026: «irgendwie ist es weird wenn ich im
// gesetz bin dann wieder startseite usw. ausserdem wenn alles zu ist und ich
// plus klicke dann erscheint einfach neuer reiter.»
//
// GEMESSEN (R14-Prüfung am Stand `cfa8a9f81`): OR offen → Klick auf die Marke →
// Klick auf ZGB ergab `tabs=[ZGB]` und den OR im Schliess-Ring. Der OR-Reiter
// war weg, obwohl ihn niemand geschlossen hatte. Ursache war genau diese
// Zweiteilung: weil «/» keinen Reiter trug, blieb der Ref des `TabTracker` auf
// dem verlassenen Dokument stehen, und die nächste Navigation traf DESSEN
// Reiter. Ebenfalls gemessen: bei 0 Reitern zeigte die App schon die Sammlung;
// «+» legte nur eine Aufschrift über einen Zeichen für Zeichen identischen
// Bildschirm (3777 == 3777 Zeichen).
//
// NEUE REGEL, in einem Satz: **Die Sammlung «/» ist ein gewöhnlicher Reiter und
// zugleich die Neuer-Reiter-Seite.** Man steht immer in genau einem Reiter —
// dieselbe Regel wie im Browser, wo die Neuer-Tab-Seite ein Tab ist. Was damit
// ERSATZLOS entfällt (§17-Gegengewicht: vier Sonderfälle raus, kein fünfter
// rein): `TabEintrag.leer`, `NEUER_REITER_NAME`, `neuerLeererReiter`,
// `hatLeerenReiter` und der D19-Zweig in `components/TabTracker.tsx`.
// Meta- und Infoseiten (/ueber, /methodik, /einstellungen, /kontakt) bleiben
// unverändert ohne Reiter — sie sind kein Bestandteil der Sammlung, und dort
// ist «kein Reiter» die wahre Auskunft, nicht eine Lücke.
//
// ── R14b (Nachzug 7.9.2026) · AUCH DIESE LETZTE AUSNAHME IST AUFGEHOBEN ─────
//
// Die drei Zeilen darüber bleiben als DATIERTER BELEG stehen (§0 Ziff. 2b) —
// sie beschreiben den Stand bis `8d398874e`. R14 hatte die Grenze selbst
// offengelegt (`abnahme/design-identitaet/R14-REITER-MODELL.md`, «Offengelegte
// Grenze»): auf `/ueber`, `/methodik`, `/einstellungen`, `/kontakt` stand beim
// Kaltstart mit leerem Speicher weiter der 0-Reiter-Zustand — leerer 34-px-
// Streifen, `data-reiter-leer`, und `components/TabTracker.tsx` warf dort den
// aktiven Reiter als Herkunft weg (`aktiv.current = null`).
//
// Das war eine Ausnahme mit zwei Preisen. Erstens die Regel selbst: «alles ist
// ein Reiter» galt für 99 % der Routen und für fünf nicht — eine Zweiteilung
// derselben Bauart, die R14 als Wurzel des Reiter-Verlusts nachgewiesen hat
// (der Ref zeigte auf ein verlassenes Dokument, die nächste Navigation traf
// DESSEN Reiter). Zweitens der Zustand «App offen, kein Reiter aktiv», den es
// im Browser nicht gibt: wer die Einstellungen öffnet, verliert im Browser
// nicht sein Reiterband.
//
// NEUE REGEL, in einem Satz: **JEDE Route der App ist Reiterinhalt.** Es gibt
// keine Liste mehr, die entscheidet, welcher Pfad einen Reiter trägt — die
// Funktion `istReiterPfad` ist damit ERSATZLOS gestrichen (§17-Gegengewicht:
// was nicht scheitern kann, wird gestrichen, nicht bewacht), und mit ihr der
// 0-Reiter-Zweig in `components/TabTracker.tsx`, die Guard in
// `components/layout/Shell.tsx` und `data-reiter-leer` samt allen vier
// `leer`-Zweigen in `components/layout/Reiterleiste.tsx`.
// Was BLEIBT: die Kurzform-Tabelle unten — sie trägt jetzt auch die Meta- und
// Dienst-Routen, damit ein Reiter «Einstellungen» heisst und nicht
// «Einstellungen — LexMetrik» (R3-F7, Herleitung dort).
// R14b: hier stand `export const BEREICHS_UEBERSICHTEN` — die Liste, die
// `istReiterPfad` neben dem Rubrik-Regex abfragte. Mit der Funktion ist auch
// sie ohne Leser (§17-Gegengewicht: was niemand mehr liest, wird gestrichen,
// nicht aufbewahrt). Die REIHENFOLGE der fünf Bereiche, die sie nebenbei
// festhielt, steht unverändert in `lib/tabGruppen.KAT_ORDER`.

// ─── R3-F7 (Prüfbefund 6.9.2026) · KURZFORM STATT SEO-TITEL ─────────────────
//
// GEMESSEN: der Reiter für «/» trug `SITE_TITEL` («Schweizer Recht an einem
// Ort: …»), weil `labelAusMeta` die SEO-Metadaten der Route zurückgibt — für
// ein Browser-artiges Reiterband die falsche Zeichenkette (§5a Ziff. 2 verlangt
// die kanonische KURZFORM, «Art. 336c OR», «BGE 152 V 52»). Dieselbe Falle
// trifft jede Übersichts-Route, die mit D7 jetzt ein Reiter werden kann.
// Darum eine kleine, geschlossene Tabelle genau für die Routen OHNE eigenes
// Inhalts-Objekt; alles andere holt seine Kurzform weiterhin aus dem Manifest
// (`Reiterleiste.kurzform`). Der volle Titel bleibt im `title` des Reiters.
const KURZFORM: Record<string, string> = {
  '/': 'Sammlung',
  '/gesetze': 'Gesetze',
  '/rechtsprechung': 'Rechtsprechung',
  '/materialien': 'Materialien',
  '/rechner': 'Rechner',
  '/vorlagen': 'Vorlagen',
  // R14b (7.9.2026): die Meta- und Dienst-Routen tragen seit dem Wegfall der
  // Ausnahme ebenfalls Reiter. Ohne Eintrag hiessen sie nach `labelAusMeta`
  // «Wie LexMetrik rechnet», «Kontakt aufnehmen», «Datenschutzerklärung» oder
  // «Was ist durchsuchbar» — SEO-Titel, keine Reiter-Aufschriften (§5a Ziff. 2).
  '/ueber': 'Über',
  '/methodik': 'Methodik',
  '/kontakt': 'Kontakt',
  '/datenschutz': 'Datenschutz',
  '/einstellungen': 'Einstellungen',
  '/abdeckung': 'Abdeckung',
  // W2·6c-DECKUNGS-SEITE (12.9.2026): ohne Eintrag hiesse der Reiter nach
  // `labelAusMeta` «Was wir nicht haben — LexMetrik». Der Eintrag hat hier
  // eine ZWEITE Wirkung: `Reiterleiste` holt das 1,4-MB-Material-Register nur
  // noch für Materialien-Reiter OHNE feste Kurzform — diese Route braucht es
  // nicht (gemessen 12.9.2026: sie zog es vorher mit, Sonde (a) rot).
  '/suche': 'Suche',
};

/** Kanonische Kurzform einer Übersichts-/Startseiten-Route — oder null, wenn
 *  die Beschriftung aus dem Inhalt selbst kommt (Erlass, Entscheid, Vorlage). */
export function reiterKurzform(path: string): string | null {
  return KURZFORM[path.split('#')[0].split('?')[0]] ?? null;
}

/** ── Gerichts-Kurzformen (F6) ───────────────────────────────────────────────
 *  Die Zitierung eines Entscheids ist «Gericht + Geschäftsnummer». GEMESSEN
 *  6.9.2026: «Obergericht AG HOR.2024.19» lief in `max-w-[13rem]` auf und wurde
 *  als «Obergericht AG HOR.2024.1…» abgeschnitten — die Nummer ist aber das
 *  EINZIGE, was den Entscheid identifiziert (§8: lieber das Gericht kürzen als
 *  die Nummer verstümmeln).
 *  Die Tabelle ist BEWUSST geschlossen und trägt nur die im schweizerischen
 *  Gebrauch etablierten Kürzel (BGer, OGer, KGer …). Ein unbekanntes Gericht
 *  wird NICHT geraten (§7), sondern bleibt ausgeschrieben — dann trägt es die
 *  Kürzung, nicht die Nummer. */
const GERICHT_KURZ: Record<string, string> = {
  Bundesgericht: 'BGer',
  Bundesverwaltungsgericht: 'BVGer',
  Bundesstrafgericht: 'BStGer',
  Bundespatentgericht: 'BPatGer',
  Obergericht: 'OGer',
  Kantonsgericht: 'KGer',
  Verwaltungsgericht: 'VGer',
  Appellationsgericht: 'AppGer',
  Handelsgericht: 'HGer',
  Bezirksgericht: 'BezGer',
  Zivilgericht: 'ZGer',
  Strafgericht: 'StGer',
  Sozialversicherungsgericht: 'SVGer',
  Versicherungsgericht: 'VersGer',
  Arbeitsgericht: 'ArbGer',
  Mietgericht: 'MGer',
  Kassationsgericht: 'KassGer',
  Steuerrekursgericht: 'StRG',
  Baurekursgericht: 'BRG',
};

/** Zerlegung einer Zitierung in «Kopf» (kürzbar) und «Kern» (nie kürzbar).
 *  Kern = alles ab dem ersten Wort mit einer Ziffer, also die Geschäftsnummer
 *  bzw. bei einer BGE-Zitierung die Fundstelle («BGE» + «152 V 52»). Das
 *  angehängte Urteilsdatum («… vom 14.01.2026») fällt weg — es identifiziert
 *  nichts, was die Nummer nicht schon identifiziert, und der `title` des
 *  Reiters trägt die vollständige Zitierung weiter. Ohne Ziffern-Wort gibt es
 *  keinen Kern; dann kürzt wie bisher der ganze Text. */
function zerlege(zitierung: string): { kopf: string; kern: string } {
  const ohneDatum = zitierung.replace(/\s+vom\s+\d{1,2}\.\d{1,2}\.\d{2,4}\s*$/, '');
  const worte = ohneDatum.split(/\s+/).filter(Boolean);
  const i = worte.findIndex((w) => /\d/.test(w));
  if (i <= 0) return { kopf: '', kern: ohneDatum };
  const kopf = worte.slice(0, i).map((w) => GERICHT_KURZ[w] ?? w).join(' ');
  return { kopf, kern: worte.slice(i).join(' ') };
}

/** Kanonische Kurzform eines Reiters (§5a Ziff. 2): «Art. 336c OR», «BGE 152
 *  V 52», «Fristenrechner».
 *
 *  ── D27 (David 6.9.2026) · DER REITER SAGT, WO MAN STEHT ──────────────────
 *  «diese funktion, dass es anzeigt in welchem artikel wir sind, soll der tab
 *  bekommen. es kann dann direkt im gesetz raus.» Der Artikel kommt darum aus
 *  der LESESTELLUNG (`t.path`, vom Scroll-Spy geführt), nicht mehr aus dem
 *  Anker der Adresse (`t.wahl`, seit D27 nur noch Rückfall vor dem ersten
 *  Spy-Lauf). Determinismus (§2) ist damit nicht aufgegeben, sondern
 *  umformuliert: gleiche Lesestellung ⇒ gleiche Beschriftung — Kaltstart, SPA
 *  und Reload liefern bei gleicher Stellung dieselbe Zeichenkette, und jedes
 *  Pane folgt seiner eigenen Stellung (`aktualisiereTabArtikel` schreibt je
 *  Reiter-Identität).
 *
 *  DRITTER TEIL `stelle`, getrennt vom Kern — die Arbeitsleiste braucht die
 *  Trennung, um dem wandernden Artikel eine feste Breite zu reservieren
 *  (`.rl-stelle`, index.css); ohne sie schöbe jeder Artikelwechsel die ganze
 *  Leiste. Drei Werte, drei Bedeutungen:
 *    `null` → kein Gesetzes-Reiter, hier kann nie eine Stellung stehen;
 *    `''`   → Gesetzes-Reiter, Stellung noch unbekannt (Breite trotzdem
 *             reserviert, sonst ruckte der Reiter beim ersten Spy-Lauf);
 *    `'Art. 43a'` → die gelesene Stelle.
 *  Der Einzeiler (`reiterKurzformText`) bleibt Wort für Wort derselbe wie vor
 *  der Trennung — «Art. 336c OR», «Art. 266g OR (2)». */
function basisKurzform(t: TabEintrag, m: VerlaufManifeste): KurzformTeile {
  // R14 (7.9.2026): hier stand der D19-Zweig für den leeren «+»-Reiter
  // («Neuer Reiter» statt «Sammlung»). Er ist ersatzlos weg — es gibt keinen
  // leeren Reiter mehr, «/» ist ein Pfad wie jeder andere und holt seine
  // Kurzform aus derselben Tabelle wie die fünf Übersichten.
  // R3-F7 (Prüfbefund 6.9.2026): Übersichts- und Startseiten-Routen tragen ihre
  // Kurzform aus `lib/tabs` («Gesetze», «Sammlung») statt des SEO-Titels, den
  // `labelAusMeta` liefert («Schweizer Recht an einem Ort: …»). Erst seit D7
  // können solche Routen überhaupt Reiter sein — die Kurzform ist die
  // Voraussetzung dafür, nicht eine Verzierung.
  const fest = reiterKurzform(t.path);
  if (fest) return { kopf: '', kern: fest, stelle: null };
  const kat = reiterKategorie(t.path);
  // ── R13B (Prüfbefund PR #743 §8 b / Fixer D34, 7.9.2026) · DIE VORLÄUFIGE
  //    AUFSCHRIFT IST DER SCHLÜSSEL DER ADRESSE, NICHT EINE AUFFORDERUNG ─────
  //  Das Browse-Manifest kommt lazy (`Reiterleiste.tsx`, `ladeBrowseManifest`);
  //  bis dahin lieferte `erlassVonPfad` null, der Reiter fiel auf `verlaufLabel`
  //  zurück und trug «Gesetz öffnen». GEMESSEN am Stand `cfa8a9f81` (gebautes
  //  dist/, Preview 4429, Chromium @1280, `/gesetze/bund/ZGB`): der Reiter stand
  //  bei t=243 ms mit 131 px da und sprang bei t=260 ms auf 80 px, sobald das
  //  Manifest eintraf — 51 px, die das Schliess-✕ (127 → 69) und jeden Reiter
  //  rechts davon mitnahmen (Layout-Shift 0.000046 bei einem, 0.000521 beim
  //  zweiten Reiter, input-frei).
  //  Reserviert werden kann diese Breite nicht: WIE breit die Aufschrift wird,
  //  weiss erst das Manifest. Also darf die vorläufige Aufschrift nicht breiter
  //  sein als die endgültige — und der Schlüssel der ADRESSE ist genau das:
  //  keine Schätzung (§2/§7), sondern die Zeichenkette, die der Nutzer
  //  angeklickt hat und die in der Adresszeile steht.
  //  GEMESSEN gegen `dist/normtext/register.json` (1'576 Erlasse): 123 tragen
  //  Schlüssel und Kürzel identisch, 212 in gleicher LÄNGE; die grosse Mehrheit
  //  der Bundes-Abweichungen ist reine Schreibung (`HREGV`→`HRegV`,
  //  `FUSG`→`FusG`) und damit im Bereich weniger Pixel. Kantonale Erlasse
  //  (`AG-291.150`→`Anwaltstarif`) weichen weiter ab — auch dort ist der
  //  Schlüssel näher an der Endbreite als die 131-px-Aufforderung, und er nennt
  //  das Dokument statt es zu verschweigen (§8).
  //  NUR solange das Manifest FEHLT. Ist es da und kennt den Erlass nicht,
  //  bleibt es bei «Gesetz nicht gefunden» (`verlaufLabel`, G23) — ein Irrtum
  //  wird ausgewiesen, nicht mit dem Rohschlüssel überdeckt.
  const vorlaeufig = kat === 'gesetze' && !m.gesetze ? gesetzPfad(t.path)?.key ?? null : null;
  const kuerzel = kat === 'gesetze' ? erlassVonPfad(t.path, m)?.kuerzel ?? vorlaeufig : null;
  if (kuerzel) {
    // Gesetze: EIN kurzer Block («Art. 336c OR») — hier gibt es nichts, was
    // gegen die Kürzung geschützt werden müsste, der ganze Text ist die Marke.
    // ── R5 (Prüfbefund R11) · ZWEITE INSTANZ, ZWEITE STELLE ───────────────
    // GEMESSEN 6.9.2026: zwei offene Instanzen desselben Erlasses hiessen
    // beide «OR». Seit D27 trennt sie schon die Lesestellung selbst — die
    // Instanz-Nummer (unten, `reiterKurzformTeile`) bleibt als Unterscheidung
    // für den Fall, dass beide zufällig an derselben Stelle stehen.
    // REIHENFOLGE (D27): erst der gespeicherte Pfad — das ist die Stellung,
    // die der Spy führt und die den Neustart überlebt —, dann `t.wahl` als
    // Rückfall für das Fenster vor dem ersten Spy-Lauf.
    const anker = hashVon(t.path) ?? t.wahl;
    const art = anker ? artikelLabelVonPfad(anker) : null;
    return { kopf: '', kern: kuerzel, stelle: art ?? '' };
  }
  const voll = verlaufLabel(t.path, m);
  if (kat === 'rechtsprechung') return { ...zerlege(voll), stelle: null };
  // M7 (Prüfbefund R11 #21): der Katalog führt für die Karten, deren `title`
  // eine BESCHREIBUNG ist, eine ausdrückliche Kurzform (`kurz`) — GEMESSEN war
  // «Verfahrens- & Rechtsmittelfristen» mit 268 px der breiteste Reiter der
  // ganzen Leiste. Die Quelle bleibt der Katalog (§5); fehlt das Feld, steht
  // wie bisher der volle Titel da, nichts wird geraten (§7).
  // ── R14b (7.9.2026) · EINE ROUTE OHNE TITEL TRÄGT IHRE ADRESSE ────────────
  // Seit R14b ist JEDE Route ein Reiter — also auch eine, die es gar nicht
  // gibt (404) oder die nur weiterleitet (/pro, /international). `metaFuerPfad`
  // liefert für sie null, und `verlaufLabel` fällt dann auf die generische
  // Sammel-Aufschrift «Zuletzt geöffnet» zurück: im Verlauf richtig, auf einem
  // Reiter falsch — er behauptete einen Namen, den die Seite nicht hat (§8).
  // Der Browser zeigt in genau diesem Fall die ADRESSE; das tut die Leiste
  // jetzt auch. Deterministisch (§2) und ohne Raten (§7).
  if (kat === 'sonstiges' && labelAusMeta(t.path) === null && katalogKurzform(t.path) === null) {
    return { kopf: '', kern: pfadTeil(t.path), stelle: null };
  }
  return { kopf: '', kern: katalogKurzform(t.path) ?? ohneUntertitel(voll), stelle: null };
}

/** ── V4/F5-Rest (§5a Ziff. 2) · DER REITER TRÄGT DEN NAMEN, NICHT DEN UNTERTITEL
 *
 *  GEMESSEN 6.9.2026 (Preview 4352, vier Reiter): der Rechner-Reiter hiess
 *  «Fristenrechner (Tage · ZPO · SchKG)» — 34 Zeichen für eine Zeile, die
 *  «Fristenrechner» sagen soll, und im Streifen der breiteste von allen. Die
 *  Klammer ist der UNTERTITEL des Katalogs (was der Rechner alles kann), nicht
 *  der Name des Dokuments; §5a Ziff. 2 verlangt die kanonische Kurzform.
 *
 *  Deterministisch (§2) und bewusst eng: gestrichen wird NUR eine Klammer AM
 *  ENDE, und nur, wenn davor noch etwas steht. Ein Titel, der ganz in Klammern
 *  steht, bleibt unangetastet — dann ist die Klammer der Name. Die vollständige
 *  Bezeichnung geht nicht verloren: sie steht im `title` des Reiters und in der
 *  Reiter-Liste (§8). Gesetze und Entscheide gehen diesen Weg NICHT — dort ist
 *  eine Klammer Teil der Zitierung (§1: lieber zwei Wege als eine Abstraktion,
 *  die zwei verschiedene Fälle gleich behandelt). */
function ohneUntertitel(titel: string): string {
  const gekuerzt = titel.replace(/\s*\([^()]*\)\s*$/, '').trim();
  return gekuerzt.length > 0 ? gekuerzt : titel;
}

/** Instanz-Nummer eines Reiterpfads: 1 = die erste (kein `?r`), sonst der
 *  Wert des Diskriminators (`tabSchluessel`). Rein, ohne DOM (§2). */
function instanzNr(path: string): number {
  const qs = path.split('#')[0].split('?')[1];
  const n = Number(new URLSearchParams(qs ?? '').get('r'));
  return Number.isFinite(n) && n > 1 ? n : 1;
}

/** Die Teile einer Reiter-Kurzform. `stelle` s. `basisKurzform` (D27). */
export interface KurzformTeile {
  kopf: string; kern: string; stelle: string | null;
  /** ── W2·18 Punkt 5 · DIE INSTANZ-NUMMER IST EIN EIGENER TEIL ─────────────
   *  «(2)», «(3)» … ab der zweiten Instanz; bei der ersten fehlt das Feld.
   *  Bis W2·18 hing die Nummer HINTEN am Kern («ZPO-Fristen (2)»), und weil
   *  der Kern der kürzbare Teil ist, fiel sie als erstes weg: GEMESSEN
   *  13.9.2026 @1024 mit sieben Reitern standen «ZPO-Fristen (2)» und
   *  «(3)» beide als «ZPO-…» da — zwei Reiter, ein Bild. Als eigener Teil
   *  kann die Leiste sie ungekürzt setzen. Der Einzeiler (`reiterKurzformText`)
   *  bleibt Zeichen für Zeichen derselbe: er fügt sie an derselben Stelle
   *  wieder an. */
  instanz?: string;
}

/** Kanonische Kurzform eines Reiters (§5a Ziff. 2), zerlegt in kürzbaren Kopf
 *  und ungekürzten Kern — die Arbeitsleiste braucht die Trennung, die
 *  Reiter-Liste und die Menü-Titel nur den Einzeiler darunter.
 *
 *  ── R5 · DIE INSTANZ STEHT IM NAMEN ────────────────────────────────────────
 *  Zwei Instanzen desselben Dokuments an DERSELBEN Stelle sind sonst nicht
 *  unterscheidbar — der Anker allein trennt sie nur, wenn sie auseinander
 *  liegen. Die Nummer ist deterministisch aus dem Pfad (`?r=n`) und steht am
 *  Kern, weil der Kopf (das gekürzte Gericht) wegfallen kann. */
export function reiterKurzformTeile(t: TabEintrag, m: VerlaufManifeste): KurzformTeile {
  const { kopf, kern, stelle } = basisKurzform(t, m);
  const nr = instanzNr(t.path);
  return { kopf, kern, stelle, ...(nr > 1 ? { instanz: `(${nr})` } : {}) };
}

/** Einzeiler für Suchfeld, Accessible Names und Titel. Reihenfolge = die
 *  Lesereihenfolge der Zitierung: Kopf (gekürztes Gericht) · Stelle («Art.
 *  43a») · Kern (Kürzel/Nummer). Leere Teile fallen weg — der Text ist damit
 *  vor und nach der D27-Trennung derselbe. */
export function reiterKurzformText(t: TabEintrag, m: VerlaufManifeste): string {
  const { kopf, kern, stelle, instanz } = reiterKurzformTeile(t, m);
  return [kopf, stelle, kern, instanz].filter((x) => !!x).join(' ');
}

/** ── R8 (Prüfbefund R11, 6.9.2026) · WAS DER `title` EINES REITERS SAGT ─────
 *
 *  GEMESSEN am Stand `c91541617`: der Tooltip trug den Stand NUR bei Gesetzen
 *  («OR — Stand 02.09.2026 — gelesen bis Art. 336c»); ein Entscheid-Reiter
 *  nannte kein Urteilsdatum und ein Rechner-Reiter nichts ausser seinem Namen.
 *  Gerade dort ist der Tooltip aber der Ort, an dem die Kurzform ihre Auskunft
 *  zurückgibt (§8): die Kurzform kürzt «Obergericht AG HOR.2024.19 vom
 *  14.01.2026» auf «OGer AG HOR.2024.19», und «Fristenrechner (Tage · ZPO ·
 *  SchKG)» auf «Fristenrechner».
 *
 *  AUS DER QUELLE, SONST GAR NICHT (§7): Stand und Urteilsdatum kommen aus den
 *  Manifesten, die Kurzbeschreibung aus dem Katalog (`karte.description`,
 *  SSoT §5). Fehlt ein Feld — oder ist das Manifest noch nicht geladen —,
 *  bleibt der Teil weg. Kein Platzhalter, keine Schätzung. Ein Entscheid mit
 *  `datumUnbekannt` (Quelle ohne Entscheiddatum) bekommt darum kein Datum.
 */
export interface ReiterKarteTeile {
  /** Volltitel, wie ihn der Verlauf führt («Obergericht AG HOR.2024.19 vom …»). */
  volltitel: string;
  /** Der AUSGESCHRIEBENE Erlasstitel aus dem Manifest («Bundesgesetz betreffend
   *  die Ergänzung des Schweizerischen Zivilgesetzbuches …»), sonst `null`.
   *  Nur die Karte zeigt ihn: bei einem Gesetz ist `volltitel` das Kürzel
   *  («OR»), und genau dieses Kürzel will die Karte auflösen. Der Einzeiler
   *  (`reiterTitel`) rührt ihn NICHT an — er bliebe sonst nicht derselbe. */
  langtitel: string | null;
  /** Kurzform, wie sie im Reiter steht — die Karte sagt, wofür sie steht. */
  kurzform: string;
  /** Sammel-Label der Art («Gesetze», «Rechtsprechung», …) plus Piktogramm. */
  kategorie: { label: string; pikto: string };
  /** Konsolidierungsstand eines Erlasses, `TT.MM.JJJJ`; sonst `null`. */
  stand: string | null;
  /** Entscheiddatum, `TT.MM.JJJJ` — nur, wenn die Zitierung es nicht schon trägt. */
  datum: string | null;
  /** Kurzbeschreibung aus dem Katalog (SSoT §5). */
  beschreibung: string | null;
  /** Lesestellung («Art. 336c»), nur bei Gesetzen. */
  gelesen: string | null;
}

/** ── W2·18 Welle 3 Punkt 4 · DIESELBE AUSKUNFT, EINMAL ZERLEGT ─────────────
 *
 *  `reiterTitel` (unten) klebt seit R8 aus denselben Feldern EINEN Satz mit
 *  «—»-Fugen; die Hover-Karte will sie einzeln, mit Beschriftung. Zwei
 *  Ableitungen wären zwei Wahrheiten (§5): darum wohnt die Herleitung HIER,
 *  und der Einzeiler setzt sich daraus zusammen — Zeichen für Zeichen wie
 *  vorher (bewacht von `src/tests/reiter-karte.test.ts`).
 *
 *  AUS DER QUELLE, SONST GAR NICHT (§7): Stand und Urteilsdatum kommen aus den
 *  Manifesten, die Kurzbeschreibung aus dem Katalog. Fehlt ein Feld — oder ist
 *  das Manifest noch nicht geladen —, bleibt es `null`. Kein Platzhalter. */
export function reiterKarteTeile(t: TabEintrag, m: VerlaufManifeste): ReiterKarteTeile {
  const volltitel = verlaufLabel(t.path, m);

  const erlass = erlassVonPfad(t.path, m);
  const roh = erlass?.stand ?? null;
  const iso = roh ? /^(\d{4})-(\d{2})-(\d{2})/.exec(roh) : null;
  const stand = roh ? (iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : roh) : null;

  const ent = entscheidPfad(t.path);
  let datum: string | null = null;
  if (ent) {
    const e = m.entscheide?.entscheide.find((x) => x.key === ent.key);
    const d = e && !e.datumUnbekannt ? /^(\d{4})-(\d{2})-(\d{2})/.exec(e.datum) : null;
    // Nur, wenn die Zitierung das Datum nicht ohnehin schon trägt («… vom …»).
    if (d && !/\svom\s\d/.test(volltitel)) datum = `${d[3]}.${d[2]}.${d[1]}`;
  }

  return {
    volltitel,
    langtitel: erlass?.titel && erlass.titel !== volltitel ? erlass.titel : null,
    kurzform: reiterKurzformText(t, m),
    kategorie: KAT_META[reiterKategorie(t.path)],
    stand,
    datum,
    beschreibung: metaFuerPfad(pfadTeil(t.path))?.karte?.description ?? null,
    // Die LESESTELLUNG. Seit D27 steht sie AUCH in der Beschriftung; hier
    // bleibt sie, weil Tooltip und Karte die einzigen Stellen sind, die sie
    // AUSSPRECHEN («gelesen bis Art. 336c») statt sie nur zu nennen.
    gelesen: reiterKategorie(t.path) === 'gesetze' ? artikelLabelVonPfad(t.path) : null,
  };
}

export function reiterTitel(t: TabEintrag, m: VerlaufManifeste): string {
  const k = reiterKarteTeile(t, m);
  return [
    k.volltitel,
    k.stand ? `Stand ${k.stand}` : null,
    k.datum ? `vom ${k.datum}` : null,
    k.beschreibung,
    k.gelesen ? `gelesen bis ${k.gelesen}` : null,
  ].filter(Boolean).join(' — ');
}

const KEY = 'lexmetrik-tabs';
const MAX = 50;

/** Identität eines Reiters: pathname + optionaler Instanz-Diskriminator `?r=<n>`.
 *  Erlaubt DASSELBE Gesetz mehrfach offen (Auftrag David): zwei Reiter mit
 *  gleichem Pfad, aber verschiedenem `?r` sind verschiedene Reiter. Andere
 *  Query-Parameter (z.B. ?preset=) und der #Artikel-Anker gehören NICHT zur
 *  Identität — eine Engine mit ?preset=a/b bleibt EIN Reiter, der Artikel ändert
 *  nur Label/Scrollziel. */
export function tabSchluessel(path: string): string {
  const vorHash = path.split('#')[0];
  const [pfad, qs] = vorHash.split('?');
  const r = new URLSearchParams(qs ?? '').get('r');
  return r ? `${pfad}?r=${r}` : pfad;
}
/** Event, mit dem Schreiber (TabTracker, Schliess-Buttons) die Leser
 *  (useTabs → ReiterUebersicht/TabPanel) im selben Browser-Tab synchron halten. */
export const TABS_EVENT = 'lexmetrik:tabs';

/** ── R14 (7.9.2026) · DER GESPEICHERTE «LEERE REITER» WIRD ZUR SAMMLUNG ────
 *  Bis R14 trug der eine «+»-Reiter das Feld `leer: true` (D19). Wer die App
 *  mit einem solchen Eintrag im Speicher neu lädt, bekommt jetzt einen
 *  gewöhnlichen Reiter auf «/» — dieselbe Adresse, dieselbe Position, nur ohne
 *  den Sonderfall. Rein deterministisch (§2), kein Zeitstempel: ein
 *  Feld-Filter, sonst nichts. Fällt dabei ein zweiter Eintrag mit derselben
 *  Reiter-Identität an (eine bereits offene Sammlung neben dem leeren Reiter,
 *  über Pane/Ctrl-Klick möglich), bleibt der ERSTE stehen — die Reihenfolge
 *  ist die des Speichers, und zwei Reiter mit identischem Schlüssel wären für
 *  jede Aktion mehrdeutig (`tabSchluessel` ist die Identität, §5). */
// ═══ W2·25 · DIE FESTE ZONE (Spec §7 Teil 1, D16-Auflage) ══════════════════
//
// Es gibt genau EINE Ordnung (den flachen Speicher) und darin genau EINE
// Grenze: alles vor `festeZone` ist angeheftet, alles danach frei. Drei
// Funktionen halten sie — die Zählung, die Prüfung, der Zug. Jede andere
// Stelle der App fragt diese drei, statt selbst zu rechnen (§5).

/** Wie viele Reiter am KOPF der Ordnung angeheftet sind = Ende der festen
 *  Zone und zugleich die erste freie Position. Zählt nur den ZUSAMMENHÄNGENDEN
 *  Kopf: ein fester Reiter hinter einem freien wäre ein gebrochener Speicher,
 *  und den heilt `ladeTabs`, statt ihn hier mitzuzählen. */
export function festeZone(tabs: readonly TabEintrag[]): number {
  let n = 0;
  while (n < tabs.length && tabs[n].fest) n += 1;
  return n;
}

/** Steht die Ordnung richtig — erst alle festen, dann alle freien? Die eine
 *  Regel, gegen die jeder Zug geprüft wird (statt Indizes zweimal zu rechnen). */
function zonenTreu(tabs: readonly TabEintrag[]): boolean {
  return festeZone(tabs) === tabs.filter((t) => t.fest).length;
}

/** Den Zug ausrechnen, ohne ihn zu schreiben — `null` heisst «gibt es nicht»
 *  oder «über die Zonengrenze». EINE Quelle für beide Aufrufer: `ordneTabsUm`
 *  schreibt das Ergebnis, die Leiste fragt über `zugErlaubt` schon beim
 *  Überfahren, um die Sperre unter dem Zeiger zu zeigen (§8: die Ablehnung
 *  kommt vor dem Loslassen, nicht als stille Korrektur danach). */
function zugErgebnis(
  tabs: readonly TabEintrag[], vonPath: string, nachPath: string, davor?: boolean,
): TabEintrag[] | null {
  const von = tabs.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(vonPath));
  const nach = tabs.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(nachPath));
  if (von === -1 || nach === -1 || von === nach) return null;
  const seite = davor ?? von > nach;
  const naechste = [...tabs];
  const [bewegt] = naechste.splice(von, 1);
  const nachNeu = naechste.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(nachPath));
  naechste.splice(seite ? nachNeu : nachNeu + 1, 0, bewegt);
  return zonenTreu(naechste) ? naechste : null;
}

/** Darf dieser Zug stattfinden? Für die Einfügemarke und den `dropEffect` —
 *  die Leiste zeichnet die Sperre, sie erfindet sie nicht. */
export function zugErlaubt(
  tabs: readonly TabEintrag[], vonPath: string, nachPath: string, davor?: boolean,
): boolean {
  return zugErgebnis(tabs, vonPath, nachPath, davor) !== null;
}

/** Ist dieser Reiter angeheftet? (Kontextmenü: «Anheften» oder «Lösen».) */
export function istFest(path: string): boolean {
  const teil = tabSchluessel(path);
  return ladeTabs().some((t) => tabSchluessel(t.path) === teil && t.fest === true);
}

/** Anheften: setzt die Eigenschaft UND sortiert den flachen Speicher um — der
 *  Reiter wandert ans ENDE der festen Zone (bei der ersten Anheftung also auf
 *  Position 0). Ans Ende, nicht nach vorn: wer einen zweiten Reiter anheftet,
 *  soll den ersten nicht verschoben vorfinden (dieselbe Ruhe wie beim
 *  Anhängen neuer Reiter hinten). Nichts geht verloren, also kein Ring. */
export function hefteAn(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const i = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (i === -1 || bisher[i].fest) return;
  const naechste = bisher.filter((_, j) => j !== i);
  naechste.splice(festeZone(naechste), 0, { ...bisher[i], fest: true });
  schreibe(naechste);
}

/** Lösen: der Reiter verliert die Eigenschaft und steht danach als ERSTER
 *  freier — er bleibt damit dort, wo er eben noch stand, statt ans Ende der
 *  Leiste zu springen (ein gelöster Reiter ist nicht ein neu geöffneter). */
export function loeseAb(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const i = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (i === -1 || !bisher[i].fest) return;
  // Das Feld wird ENTFERNT, nicht auf `false` gesetzt: ein `fest: false` im
  // Speicher wäre eine zweite Schreibweise für dasselbe (§5) und stünde in
  // jedem exportierten Eintrag (Mappen-Adresse) ohne Aussage herum.
  const frei: TabEintrag = { ...bisher[i] };
  delete frei.fest;
  const naechste = bisher.filter((_, j) => j !== i);
  naechste.splice(festeZone(naechste), 0, frei);
  schreibe(naechste);
}

export function ladeTabs(): TabEintrag[] {
  try {
    const roh = localStorage.getItem(KEY);
    const arr = roh ? JSON.parse(roh) : [];
    if (!Array.isArray(arr)) return [];
    const gesehen = new Set<string>();
    return arr
      .filter((e): e is TabEintrag & { leer?: unknown } =>
        e && typeof e.path === 'string' &&
        (e.label === undefined || typeof e.label === 'string') &&
        (e.wahl === undefined || typeof e.wahl === 'string'))
      .map(({ path, label, wahl, fest }): TabEintrag => ({
        path,
        ...(label ? { label } : {}),
        ...(wahl ? { wahl } : {}),
        ...(fest === true ? { fest: true } : {}),
      }))
      .filter((e) => {
        const k = tabSchluessel(e.path);
        if (gesehen.has(k)) return false;
        gesehen.add(k);
        return true;
      })
      // W2·18 Punkt 4 · EINE RICHTUNG: die ÄLTESTEN fallen. Hier stand
      // `.slice(0, MAX)` — beim Lesen fielen also die JÜNGSTEN 50 weg, während
      // `merkeTab` beim Schreiben die ältesten kappt. Zwei Richtungen an
      // derselben Grenze heisst: welche Reiter ein voller Speicher verliert,
      // hing davon ab, wer ihn zuletzt angefasst hat. Kein Ring-Eintrag an
      // dieser Stelle — Lesen ist keine Handlung, und `ladeTabs` läuft bei
      // jedem Ereignis (`useTabs`): ein Schreibzugriff im Lesepfad legte
      // denselben Eintrag bei jedem Lauf erneut in den Ring.
      // W2·25: die Kappe steht VOR der Partition, nicht danach — `slice(-MAX)`
      // schneidet vorn ab, und vorn stehen nach der Partition gerade die
      // ANGEHEFTETEN. Andersherum verlöre ein übervoller Speicher beim blossen
      // LESEN genau die Reiter, die der Nutzer festgehalten hat.
      .slice(-MAX)
      // ── W2·25 · DIE PARTITION IST TEIL DES LESENS, NICHT DES ZEICHNENS ──
      // Feste zuerst, innerhalb jeder Zone in gespeicherter Reihenfolge
      // (STABIL — `sort` wäre hier falsch, die Reihenfolge IST die Ordnung).
      // Sie steht HIER und nicht in der Leiste, weil die Leiste sonst eine
      // zweite Anzeige-Ordnung führte — genau der D16-Rückfall, den die
      // Spec ausschliesst. Geheilt wird damit auch, was von aussen kommt:
      // ein zweites Browserfenster mit älterem Stand, ein von Hand
      // geschriebener Speicher, eine Sitzung von vor diesem Schritt.
      // Rein deterministisch (§2), kein Zeitstempel, kein Schreibzugriff im
      // Lesepfad (`ladeTabs` läuft bei jedem Ereignis, s. `useTabs`).
      .reduce<TabEintrag[]>((acc, e) => {
        if (e.fest) acc.splice(festeZone(acc), 0, e); else acc.push(e);
        return acc;
      }, []);
  } catch {
    return [];
  }
}

function schreibe(tabs: TabEintrag[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(tabs)); } catch { /* privater Modus — Reiter sind Komfort */ }
  try { window.dispatchEvent(new Event(TABS_EVENT)); } catch { /* SSR/kein window */ }
}

/** Anker der ADRESSE («#art-…») oder undefined. Quelle des `wahl`-Feldes. */
function hashVon(path: string): string | undefined {
  const i = path.indexOf('#');
  return i === -1 ? undefined : path.slice(i);
}

/** Eintrag aus einer Adresse bauen — mit `alt` als Vorzustand desselben Reiters
 *  (Label, Lesestellung und gewählter Anker überleben ein hash-/labelloses
 *  Update). EINE Stelle für diese Regel: `merkeTab` und `ersetzeTab` bauen
 *  denselben Eintrag, sonst driften «anhängen» und «ersetzen» auseinander. */
function eintragAus(path: string, label?: string, alt?: TabEintrag): TabEintrag {
  // Ein Update OHNE Artikel-Anker (z.B. vom TabTracker mit pathname+?r) darf den
  // vom Reader gepflegten Anker NICHT löschen — sonst verlöre die zweite Instanz
  // ihr Live-Label «Kürzel – Art. X» (Auftrag David).
  const neuPath = (!path.includes('#') && alt?.path.includes('#'))
    ? `${path}#${alt.path.split('#')[1]}`
    : path;
  const neuLabel = label ?? alt?.label;
  const neuWahl = hashVon(path) ?? alt?.wahl;
  return {
    path: neuPath,
    ...(neuLabel ? { label: neuLabel } : {}),
    ...(neuWahl ? { wahl: neuWahl } : {}),
    // W2·25: die Anheftung gehört dem PLATZ, nicht dem Dokument (Browser-Norm)
    // — wer im angehefteten Reiter weiternavigiert, findet ihn angeheftet vor.
    // Ohne diese Zeile löste jede Navigation die Anheftung still, und die
    // Zonen-Partition in `ladeTabs` schöbe den Reiter obendrein weg.
    ...(alt?.fest ? { fest: true as const } : {}),
  };
}

const gleich = (a: TabEintrag, b: TabEintrag): boolean =>
  // W2·25: `fest` gehört in den Vergleich — sonst sähe `tabsGleich` das
  // Anheften nicht, und die Leiste zeichnete den Reiter erst beim nächsten
  // fremden Ereignis um (`useTabs` hält an der alten Array-Identität fest).
  a.path === b.path && a.label === b.label && a.wahl === b.wahl && !!a.fest === !!b.fest;

/** ── W2·18 Punkt 2 · STRUKTURELLE GLEICHHEIT ZWEIER REITERLISTEN ───────────
 *  `ladeTabs()` baut bei JEDEM Aufruf ein neues Array aus dem `localStorage` —
 *  identischer Inhalt, neue Identität. Wer daraus React-State macht, rendert
 *  auch dann neu, wenn sich nichts geändert hat (die gemessene Kaskade beim
 *  Scrollen, s. `useTabs`). Diese Funktion sagt, ob zwei Listen dasselbe
 *  BEDEUTEN: gleiche Länge, gleiche Reihenfolge, je Eintrag gleicher Pfad
 *  (inkl. Anker), gleiches Label, gleiche Wahl — dieselben drei Felder, die
 *  `gleich` schon für den Einzeleintrag prüft (§5, eine Regel). */
export function tabsGleich(a: readonly TabEintrag[], b: readonly TabEintrag[]): boolean {
  return a === b || (a.length === b.length && a.every((x, i) => gleich(x, b[i])));
}

/** Öffnet/aktualisiert einen Reiter und hängt einen NEUEN hinten an (gekappt auf
 *  die jüngsten MAX). Dublette (per `tabSchluessel`) behält ihre Position
 *  (stabile Reihenfolge) und übernimmt nur ein neu aufgelöstes Label.
 *
 *  ── Seit dem R2-Nachzug ist das der Weg für einen AUSDRÜCKLICH neuen Reiter
 *  (Mittelklick, Ctrl/⌘-Klick, ⌘/Ctrl+Enter in der Suche, «zweite Instanz»).
 *  Die gewöhnliche Navigation geht über `ersetzeTab` (§5a Ziff. 3). */
export function merkeTab(path: string, label?: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx !== -1) {
    const alt = bisher[idx];
    const neu = eintragAus(path, label, alt);
    // nur schreiben, wenn sich etwas ändert (idempotent gegen Mehrfach-Aufruf)
    if (gleich(alt, neu)) return;
    const naechste = [...bisher];
    naechste[idx] = neu;
    schreibe(naechste);
    return;
  }
  schreibe(kappeMitRing([...bisher, eintragAus(path, label)]));
}

/** ── W2·18 Punkt 4 · WAS DIE KAPPE FRISST, LIEGT IM RING ───────────────────
 *  Die Grenze `MAX` selbst bleibt (50 Reiter, Auftrag David). Bis W2·18 fiel
 *  der gekappte Reiter aber STILL weg: kein Ring-Eintrag, also keine
 *  Rückfahrkarte — ein geöffnetes Dokument verschwand, ohne dass jemand es
 *  geschlossen hätte, und Alt+⇧+T brachte es nicht zurück. Gekappt wird
 *  einheitlich vorne (die ältesten), und genau die gehen in den Ring.
 *  Die Ablage-REIHENFOLGE entscheidet `merkeGeschlossen` (W2·18 Welle 2
 *  Punkt 4): absteigend nach Position, damit das Wiederherstellen Position um
 *  Position von vorn zurückholt. Hier steht nur, WER weichen muss.
 *
 *  `geschuetzt` ist der Eintrag, der GERADE hereinkommt: beim Wiederherstellen
 *  am vollen Speicher darf nicht der eben zurückgeholte Reiter das Opfer der
 *  Kappe sein — sonst sähe die Geste aus, als hätte sie gar nichts getan.
 *  Weichen muss dann der älteste ANDERE; er geht seinerseits in den Ring. */
function kappeMitRing(tabs: TabEintrag[], geschuetzt?: TabEintrag): TabEintrag[] {
  if (tabs.length <= MAX) return tabs;
  const bleibt: TabEintrag[] = [];
  const weg: GeschlossenerReiter[] = [];
  let zuViel = tabs.length - MAX;
  tabs.forEach((eintrag, index) => {
    // W2·25: ein ANGEHEFTETER Reiter ist nie das Opfer der Kappe. Wer einen
    // Erlass festhält, hält ihn gegen das Weglaufen der Leiste fest — genau
    // dagegen. Weichen muss dann der älteste freie; gibt es keinen mehr,
    // bleibt die Liste über MAX (50 angeheftete Reiter sind eine Ansage, kein
    // Versehen, und stilles Wegwerfen wäre die schlechtere Antwort, §8).
    if (zuViel > 0 && eintrag !== geschuetzt && !eintrag.fest) { weg.push({ eintrag, index }); zuViel -= 1; }
    else bleibt.push(eintrag);
  });
  merkeGeschlossen(weg);
  return bleibt;
}

/** ── §5a Ziff. 3 · EINE NAVIGATION ERSETZT DEN AKTIVEN REITER ───────────────
 *
 *  Wie im Browser: wer einem Link folgt, bekommt KEINEN neuen Reiter, sondern
 *  denselben Reiter mit neuem Inhalt («kein Reiter-Wildwuchs», David 6.9.2026).
 *  Drei Fälle, in dieser Reihenfolge — die Reihenfolge ist die ganze Regel:
 *
 *  1. **Das Ziel ist schon offen** → nur aktualisieren (`merkeTab`-Semantik).
 *     Der Wechsel auf einen bestehenden Reiter darf den vorher aktiven NICHT
 *     wegwerfen; sonst kostete jeder Klick in der Arbeitsleiste einen Reiter.
 *  2. **Der aktive Reiter existiert** → er wird an SEINER Position ersetzt
 *     (Reihenfolge bleibt stabil, der Reiter «wandert» nicht ans Ende).
 *  3. **Kein aktiver Reiter** (Kaltstart, Start-/Übersichtsseite als Herkunft)
 *     → anhängen wie bisher.
 *
 *  `altPath` ist die Adresse, aus der die Navigation kam; `null` heisst «es gab
 *  keinen». Rein deterministisch (§2), kein Zeitstempel, kein DOM.
 *
 *  ── R14 (7.9.2026) · BLÄTTERN IST KEIN VERLUST ────────────────────────────
 *  `ringt` sagt, ob der ersetzte Reiter in den «zuletzt geschlossen»-Ring
 *  gehört. GEMESSEN am Vorstand `79023e630` (`/gesetze` → OR → Zurück →
 *  Vorwärts): der Ring stand auf `[/gesetze, /gesetze/bund/OR, /gesetze]` —
 *  «/gesetze» doppelt, obwohl niemand etwas geschlossen hatte. Zurück und
 *  Vorwärts bewegen die History INNERHALB des Reiters; dabei geht nichts
 *  verloren, was man wiederherstellen müsste, und Alt+⇧+T verlor genau die
 *  Verlässlichkeit, für die R11-M3 es eingeführt hat. Der Aufrufer
 *  (`components/TabTracker.tsx`) kennt die Richtung deterministisch aus
 *  `useNavigationType()`; der Default `true` lässt jede andere Aufrufstelle
 *  (Panes in `layout/Shell.tsx`) bit-gleich wie vorher. */
export function ersetzeTab(altPath: string | null | undefined, neuPath: string, label?: string, ringt = true): void {
  const teilNeu = tabSchluessel(neuPath);
  const bisher = ladeTabs();
  if (bisher.some((t) => tabSchluessel(t.path) === teilNeu)) { merkeTab(neuPath, label); return; }
  const idxAlt = altPath ? bisher.findIndex((t) => tabSchluessel(t.path) === tabSchluessel(altPath)) : -1;
  if (idxAlt === -1) { merkeTab(neuPath, label); return; }
  const naechste = [...bisher];
  // M3: der ERSETZTE Reiter ist so verloren wie ein geschlossener — er kommt
  // darum in denselben Ring. Genau hier ist der Verlust häufiger als im
  // Browser, weil §5a Ziff. 3 das Ersetzen zum Normalfall macht.
  if (ringt) merkeGeschlossen([{ eintrag: bisher[idxAlt], index: idxAlt }]);
  // KEIN `alt`-Vorzustand: der Reiter zeigt jetzt ein ANDERES Dokument — Label,
  // Lesestellung und gewählter Anker des alten gehören nicht dorthin.
  naechste[idxAlt] = eintragAus(neuPath, label);
  schreibe(naechste);
}

/** #12: Reiter umsortieren — verschiebt den gezogenen Reiter (vonPath) an die
 *  Position des Ziel-Reiters (nachPath). Identifikation über `tabSchluessel`
 *  (stabile Reiter-Identität); deterministisch, kein Zeitstempel.
 *
 *  ── D15/D16 (David 6.9.2026) · WOHIN GENAU, SAGT DER ZEIGER ────────────────
 *  «per drag and drop soll man register verschieben können … analog browser».
 *  Im Browser entscheidet die ZEIGERPOSITION über dem Ziel, ob der Reiter davor
 *  oder dahinter einrastet — darum der dritte Parameter. Er ist optional, und
 *  sein Default reproduziert die frühere, richtungsabhängige Regel BIT-GLEICH:
 *  wer nach links zieht, landet vor dem Ziel; wer nach rechts zieht, dahinter.
 *  Genau davon leben die ▲/▼-Knöpfe der Reiter-Liste (`layout/TabPanel.tsx`),
 *  die kein Zeiger-X haben — sie bleiben unangetastet (§6.3).
 *
 *  Der Zielindex wird NACH dem Herausnehmen neu bestimmt: sonst verschiebt der
 *  entnommene Reiter das Ziel um eins, und «davor» landete dahinter.
 *
 *  ── W2·25 · DIE ZONENGRENZE WIRD ABGELEHNT, NICHT KORRIGIERT ─────────────
 *  Seit dem Anheften gibt es eine Grenze in derselben flachen Ordnung. Ein
 *  Zug darüber hinweg schreibt NICHTS und meldet `false`; der Aufrufer zeigt
 *  die Sperre (die Leiste tut es schon beim Überfahren, `zugErlaubt`). Der
 *  Rückgabewert ist neu — alle Bestands-Aufrufer ignorieren ihn und verhalten
 *  sich wortgleich wie vorher (`void`-Semantik bleibt gültig).
 *  @returns true, wenn umgeordnet wurde; false bei unbekanntem Pfad, gleicher
 *           Position ODER abgelehnter Zonengrenze.
 */
export function ordneTabsUm(vonPath: string, nachPath: string, davor?: boolean): boolean {
  const naechste = zugErgebnis(ladeTabs(), vonPath, nachPath, davor);
  if (!naechste) return false;
  schreibe(naechste);
  return true;
}

/** ── W2·18 Punkt 3 · WER NACH DEM SCHLIESSEN AKTIV WIRD ────────────────────
 *  Browser-Norm (Chrome, Firefox, Safari): der RECHTE Nachbar rückt nach; gibt
 *  es keinen — der geschlossene Reiter war der letzte —, ist es der linke.
 *  Bis W2·18 war es umgekehrt (links zuerst). Der Unterschied ist nicht
 *  kosmetisch: wer eine Reihe von links nach rechts abarbeitet und jeden
 *  erledigten Reiter schliesst, wurde bei jedem ✕ an den ANFANG zurückgeworfen
 *  statt einen Schritt weitergetragen.
 *
 *  @param ordnung Die Reiter in Speicherreihenfolge.
 *  @param idx     Stelle des geschlossenen Reiters; `-1`, wenn er nicht in der
 *                 Liste steht (dann gibt es keinen Nachfolger).
 *  @returns Der Reiter, der aktiv wird, oder `undefined` — dann war es der
 *           letzte, und der Aufrufer entscheidet (die Leiste geht zur
 *           Sammlung, R14). */
export function nachfolgerReiter(ordnung: readonly TabEintrag[], idx: number): TabEintrag | undefined {
  if (idx < 0) return undefined;
  return ordnung[idx + 1] ?? ordnung[idx - 1];
}

export function schliesseTab(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx === -1) return;
  merkeGeschlossen([{ eintrag: bisher[idx], index: idx }]);
  schreibe(bisher.filter((_, i) => i !== idx));
}

export function leereTabs(): void {
  // ── W2·18 WELLE 2 PUNKT 4 · BERICHTIGTER KOMMENTAR ──────────────────────
  // Hier stand: «der ERSTE Reiter zuerst in den Ring, damit die
  // Wiederherstellung (vom Ende her) von hinten nach vorn zurückholt und
  // Position um Position stimmt.» Das war die Absicht, aber nicht die
  // Wirkung — GEMESSEN 13.9.2026 kam [a, b, c] als [a, c, b] zurück. Die
  // Ablage-Richtung entscheidet NICHT diese Stelle, sondern `merkeGeschlossen`
  // (dort die Herleitung): eine Geste legt absteigend nach Position ab, der
  // Stapel gibt sie aufsteigend zurück. Hier steht darum nur noch, WAS
  // hineinkommt — alles, mit seiner Position.
  // ── W2·25 · «ALLE» HEISST ALLE FREIEN ────────────────────────────────────
  // Angeheftete überleben die Geste (§5a Ziff. 5) — genau dafür heftet man an.
  // Sie gehen darum auch NICHT in den Ring: dort steht, was zurückgeholt
  // werden kann, und ein Reiter, der gar nicht weg ist, wäre dort eine tote
  // Zeile («Wieder öffnen: OR», während OR links steht).
  const bisher = ladeTabs();
  merkeGeschlossen(bisher.map((eintrag, index) => ({ eintrag, index })).filter(({ eintrag }) => !eintrag.fest));
  schreibe(bisher.filter((t) => t.fest));
}

/** ── M4 · «ALLE ANDEREN SCHLIESSEN» (Prüfbefund R11 #35) ────────────────────
 *  Reiner Array-Filter, deterministisch (§2), Identität über `tabSchluessel`.
 *  Kein Sonderfall für den leeren «+»-Reiter: er ist ein Reiter wie jeder
 *  andere und wird mitgeschlossen, wenn er nicht der genannte ist. */
export function schliesseAndere(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  if (!bisher.some((t) => tabSchluessel(t.path) === teil)) return;
  // W2·25: «alle anderen» lässt die angehefteten stehen — dieselbe Zusage wie
  // bei «Alle schliessen», und dieselbe wie im Browser.
  const bleibt = (t: TabEintrag) => tabSchluessel(t.path) === teil || !!t.fest;
  const weg = bisher.map((eintrag, index) => ({ eintrag, index }))
    .filter(({ eintrag }) => !bleibt(eintrag));
  if (weg.length === 0) return;
  merkeGeschlossen(weg);
  schreibe(bisher.filter(bleibt));
}

/** ── M4 · «RECHTS DAVON SCHLIESSEN» ────────────────────────────────────────
 *  Alles NACH der Position des genannten Reiters fällt weg; der genannte und
 *  alles links davon bleibt. Die Position ist die des flachen Speichers — also
 *  genau die, die die Arbeitsleiste zeigt (D16). */
export function schliesseRechtsVon(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx === -1 || idx === bisher.length - 1) return;
  // W2·25: rechts von einem ANGEHEFTETEN Reiter stehen die übrigen
  // angehefteten — auch sie bleiben (§5a Ziff. 5). Von einem freien Reiter aus
  // ändert das nichts: die feste Zone liegt immer links.
  const weg = bisher.slice(idx + 1).map((eintrag, i) => ({ eintrag, index: idx + 1 + i }))
    .filter(({ eintrag }) => !eintrag.fest);
  if (weg.length === 0) return;
  merkeGeschlossen(weg);
  schreibe(bisher.filter((t, i) => i <= idx || !!t.fest));
}

// ─── M3 (Prüfbefund R11 #37, 6.9.2026) · «ZULETZT GESCHLOSSEN» ──────────────
//
// GEMESSENER ANLASS: Alt+Shift+T liess die Reiterliste unverändert, und
// `localStorage` führte keinen Schliess-Ring (G4/G4c). Im Browser ist das
// Wiederherstellen die Rückfahrkarte für jedes versehentliche ✕ — hier ist es
// MEHR als das: seit §5a Ziff. 3 ERSETZT schon eine gewöhnliche Navigation den
// aktiven Reiter (`ersetzeTab`), der Verlust ist also Alltag und nicht Unfall.
// Rechner-Eingaben liegen vollständig in der Adresse (`?e=…&k=ZH`), gehen mit
// dem Reiter also mit — genau darum ist die Wiederherstellung der richtige
// Ersatz für eine Schliess-Warnung und nicht deren Ergänzung.
//
// BERUFSGEHEIMNIS · DIESELBE GRENZE WIE `lexmetrik-tabs`, NICHT WEITER: der
// Ring speichert AUSSCHLIESSLICH `TabEintrag`-Objekte, also Pfad + Label +
// gewählter Anker — dieselben Felder, dieselbe Herkunft, dieselbe Lebensdauer
// wie die offene Reiterliste selbst. Eine Rechner-Adresse trägt Falldaten
// (`?e=2025-01-15&k=ZH`); sie tut das schon heute in `lexmetrik-tabs`, und der
// Ring verlängert genau diese eine Grenze um höchstens ZU_MAX Einträge. NIE
// aufgenommen werden Formularinhalte, und nie ein Zeitstempel (§2: kein
// Date.now() in src/lib) — die Reihenfolge im Array IST die Reihenfolge.
const ZU_KEY = 'lexmetrik-tabs-zu';
// ── W2·18 Punkt 4 · DIE RÜCKFAHRKARTE MUSS EINE GANZE LEISTE TRAGEN ────────
// Hier stand 10. `leereTabs` («Alle schliessen») legt ALLE offenen Reiter in
// den Ring — mit 10 als Kappe war die Geste ab dem elften Reiter nur noch zu
// zehn Zehnteln umkehrbar, und was darüber lag, fiel still weg. Die Kappe ist
// darum die der Reiterliste selbst: mehr als `MAX` Reiter kann niemand
// schliessen, also trägt ein Ring dieser Grösse jede Schliess-Geste
// vollständig. An der BERUFSGEHEIMNIS-Grenze ändert das nichts Qualitatives
// (oben): dieselben Felder, dieselbe Herkunft, dieselbe Lebensdauer, und nie
// mehr Einträge, als die Reiterliste daneben ohnehin führen darf.
const ZU_MAX = MAX;

/** Ein geschlossener Reiter mit der Position, an der er stand. Die Position ist
 *  der ganze Unterschied zu einem Verlauf: wiederhergestellt wird DORT, wo der
 *  Reiter war, nicht am Ende der Leiste. */
interface GeschlossenerReiter { eintrag: TabEintrag; index: number }

function ladeGeschlossene(): GeschlossenerReiter[] {
  try {
    const roh = localStorage.getItem(ZU_KEY);
    const arr = roh ? JSON.parse(roh) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is GeschlossenerReiter =>
        x && typeof x.index === 'number' && x.eintrag && typeof x.eintrag.path === 'string')
      .slice(-ZU_MAX);
  } catch {
    return [];
  }
}

function schreibeGeschlossene(ring: GeschlossenerReiter[]): void {
  try { localStorage.setItem(ZU_KEY, JSON.stringify(ring.slice(-ZU_MAX))); }
  catch { /* privater Modus — die Rückfahrkarte ist Komfort, kein Datenbestand */ }
}

/** Legt geschlossene/ersetzte Reiter hinten in den Ring (jüngster zuletzt).
 *  Die SAMMLUNG kommt NICHT hinein: sie trägt kein Dokument, ihre
 *  «Wiederherstellung» wäre ein Klick auf «+» (§8 — nichts versprechen, was
 *  keinen Wert hat). Bis R14 stand hier dieselbe Regel für den leeren
 *  «+»-Reiter (`!eintrag.leer`); seit die Sammlung selbst der Reiter ist, ist
 *  ihr PFAD das Merkmal — der Sonderfall im Datenmodell entfällt. */
function merkeGeschlossen(neue: GeschlossenerReiter[]): void {
  const echte = neue.filter(({ eintrag }) => pfadTeil(eintrag.path) !== '/');
  if (echte.length === 0) return;
  // ── W2·18 WELLE 2 PUNKT 4 · EINE GANZE LEISTE LIEGT VERKEHRT HERUM AB ────
  //
  // GEMESSEN 13.9.2026: «Alle schliessen» mit [a, b, c] und dreimal
  // Wiederherstellen ergab [a, c, b]; mit zehn Reitern [r0, r9, r1, r8, r2,
  // r7, r3, r6, r4, r5] — die Leiste kam zurück, aber verschachtelt. Dasselbe
  // bei «Rechts davon schliessen» ([a, b, d, c] statt [a, b, c, d]).
  //
  // URSACHE: der Ring ist ein STAPEL — `stelleLetztenWiederHer` nimmt hinten.
  // Wer eine ganze Leiste in Ur-Reihenfolge hineinlegt, bekommt sie also von
  // HINTEN zurück: der hinterste Reiter kommt zuerst, findet eine leere Liste
  // vor, landet mangels Nachbarn vorn (`Math.min(index, length)`) — und jeder
  // weitere schiebt sich davor.
  //
  // DIE ANTWORT steht hier und nur hier (§5): eine Geste legt ihre Reiter
  // ABSTEIGEND nach Position ab, damit der Stapel sie AUFSTEIGEND zurückgibt.
  // Dann trifft jeder wiederhergestellte Reiter auf eine Liste, die vor ihm
  // schon alles Vordere trägt, und `splice(index)` landet auf den Punkt.
  // Gilt für alle vier Aufrufer mit mehr als einem Eintrag (`leereTabs`,
  // `schliesseAndere`, `schliesseRechtsVon`, `kappeMitRing`); die
  // Einzelschliessung merkt davon nichts, und die REIHENFOLGE ZWISCHEN zwei
  // Gesten bleibt unberührt (jüngere Geste zuerst zurück).
  const geordnet = [...echte].sort((a, b) => b.index - a.index);
  schreibeGeschlossene([...ladeGeschlossene(), ...geordnet]);
}

/** Der zuletzt geschlossene Reiter — für die Beschriftung der Aktion
 *  («Zuletzt geschlossen: Art. 336c OR»). null = der Ring ist leer, dann wird
 *  die Aktion gar nicht erst angeboten (kein toter Menüeintrag). */
export function letzterGeschlossener(): TabEintrag | null {
  const ring = ladeGeschlossene();
  return ring.length ? ring[ring.length - 1].eintrag : null;
}

/** Stellt den zuletzt geschlossenen Reiter AN SEINER ALTEN POSITION wieder her
 *  und gibt ihn zurück (der Aufrufer navigiert dorthin). null = nichts im Ring.
 *
 *  Ist derselbe Reiter inzwischen wieder offen, wird der Ring-Eintrag
 *  VERBRAUCHT und der offene Reiter zurückgegeben — sonst bliebe ein Eintrag
 *  stehen, dessen Wiederherstellung sichtbar nichts tut. */
export function stelleLetztenWiederHer(): TabEintrag | null {
  const ring = ladeGeschlossene();
  const letzter = ring.pop();
  if (!letzter) return null;
  schreibeGeschlossene(ring);
  const bisher = ladeTabs();
  const teil = tabSchluessel(letzter.eintrag.path);
  if (bisher.some((t) => tabSchluessel(t.path) === teil)) return letzter.eintrag;
  const naechste = [...bisher];
  // W2·25: die alte Position gilt, SOWEIT sie die Zonengrenze achtet. Ein
  // freier Reiter, dessen Platz inzwischen in der festen Zone läge (jemand hat
  // in der Zwischenzeit angeheftet), landet als erster freier statt mitten
  // zwischen den angehefteten — sonst wäre die Rückfahrkarte die eine Stelle,
  // die den Speicher bricht, den `ladeTabs` gleich darauf wieder umsortiert.
  const zone = festeZone(naechste);
  const roh = Math.min(letzter.index, naechste.length);
  naechste.splice(letzter.eintrag.fest ? Math.min(roh, zone) : Math.max(roh, zone), 0, letzter.eintrag);
  // W2·18 Punkt 4: dieselbe Richtung und derselbe Ring wie beim Öffnen — hier
  // stand `.slice(0, MAX)` und warf am vollen Speicher den JÜNGSTEN Reiter weg,
  // um den wiederhergestellten aufzunehmen.
  schreibe(kappeMitRing(naechste, letzter.eintrag));
  return letzter.eintrag;
}

// ═══ W2·18 WELLE 2 PUNKT 2 · ZULETZT BENUTZT (MRU) ══════════════════════════
//
// GEMESSENER ANLASS (13.9.2026, Stand `f0ed8859c`): die Leiste kannte nur die
// POSITION — Alt+1…9 und Alt+Bild↑/↓. Wer zwischen zwei Reitern hin- und
// herarbeitet (der Alltag beim Abgleich zweier Erlasse), musste ihre Stellen
// kennen und zählen, und ab Reiter 10 gab es überhaupt kein Kürzel mehr
// (Alt+9 ist der LETZTE, R13-8). Chrome («Ctrl+Tab in MRU») und VS Code
// («Ctrl+Tab») lösen genau das über die zuletzt-benutzt-Reihenfolge.
//
// WAS HIER STEHT, IST NUR DIE BUCHFÜHRUNG (§3): eine Liste von Reiter-
// IDENTITÄTEN, jüngste zuletzt, ohne Dubletten, gekappt auf `MRU_MAX`. Kein
// Zeitstempel (§2: kein `Date.now()` in `src/lib`) — die Reihenfolge im Array
// IST die Reihenfolge. Welche Taste sie auslöst, entscheidet die Leiste.
//
// ZEHN statt `MAX`: anders als der Schliess-Ring ist das keine Rückfahrkarte
// für Verlorenes, sondern ein Kurzzeit-Gedächtnis für das Pendeln. Was zehn
// Reiter zurückliegt, findet man über das «+N»-Blatt, nicht über ein Kürzel.
const MRU_KEY = 'lexmetrik-tabs-mru';
const MRU_MAX = 10;

function ladeMru(): string[] {
  try {
    const roh = localStorage.getItem(MRU_KEY);
    const arr = roh ? JSON.parse(roh) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string').slice(-MRU_MAX) : [];
  } catch {
    return [];
  }
}

/** Schreibt fort, WELCHER Reiter gerade aktiv geworden ist. Aufrufer ist die
 *  Leiste bei jedem Aktiv-Wechsel; mehrfaches Melden derselben Identität ändert
 *  nichts (sie steht dann einmal, am jüngsten Ende). */
export function merkeAktivenReiter(path: string): void {
  const teil = tabSchluessel(path);
  const ohne = ladeMru().filter((k) => k !== teil);
  try { localStorage.setItem(MRU_KEY, JSON.stringify([...ohne, teil].slice(-MRU_MAX))); }
  catch { /* privater Modus — das Pendeln ist Komfort, kein Datenbestand */ }
}

/** Der zuletzt benutzte Reiter, der NICHT der aktive ist und noch offen steht —
 *  das Ziel des Pendel-Kürzels. `null` = es gibt keinen (frischer Start, oder
 *  alles Gemerkte ist inzwischen geschlossen); dann tut die Taste nichts, statt
 *  irgendwohin zu springen (§8).
 *
 *  @param offen Die offenen Reiter (Speicherordnung, die die Leiste ohnehin hält).
 *  @param aktiv Identität des aktiven Reiters (`tabSchluessel`). */
export function vorherigerReiter(offen: readonly TabEintrag[], aktiv: string): TabEintrag | null {
  const mru = ladeMru();
  for (let i = mru.length - 1; i >= 0; i -= 1) {
    if (mru[i] === aktiv) continue;
    const t = offen.find((x) => tabSchluessel(x.path) === mru[i]);
    if (t) return t;
  }
  return null;
}

/** Pfad für eine NEUE Instanz desselben Erlasses/Items (Auftrag David: dasselbe
 *  Gesetz mehrfach offen). Hängt den nächsten freien `?r=<n>` an den aktuellen
 *  Pfad (Artikel-Anker bleibt erhalten). Die erste Instanz trägt kein `?r`
 *  (implizit r=1), die nächste `?r=2` usw. */
export function naechsteInstanz(path: string): string {
  const pfad = pfadTeil(path);
  const hash = path.includes('#') ? `#${path.split('#')[1]}` : '';
  const rs = ladeTabs()
    .filter((t) => pfadTeil(t.path) === pfad)
    .map((t) => Number(new URLSearchParams(t.path.split('#')[0].split('?')[1] ?? '').get('r')) || 1);
  const next = (rs.length ? Math.max(...rs) : 0) + 1;
  return `${pfad}?r=${next}${hash}`;
}

/** Aktualisiert NUR den Artikel-Anker (#) eines bereits offenen Reiters mit
 *  dieser Identität — die LESESTELLUNG (Neustart, Reiter-Liste, Auftrag David).
 *  Legt KEINEN neuen Reiter an und ändert die Reihenfolge nicht.
 *  Rührt `wahl` NICHT an: die Beschriftung folgt der Adresse, nicht dem
 *  Scroll-Spy (F5, Herleitung an `TabEintrag.wahl`). */
export function aktualisiereTabArtikel(path: string): void {
  const teil = tabSchluessel(path);
  const bisher = ladeTabs();
  const idx = bisher.findIndex((t) => tabSchluessel(t.path) === teil);
  if (idx === -1 || bisher[idx].path === path) return;
  const naechste = [...bisher];
  naechste[idx] = { ...bisher[idx], path };
  schreibe(naechste);
}
