import {
  pfadTeil, entscheidPfad, erlassVonPfad, gesetzPfad, verlaufLabel, katalogKurzform,
  labelAusMeta,
  type VerlaufManifeste,
} from '../verlaufLabel';
import { reiterKategorie, artikelLabelVonPfad, KAT_META } from '../tabGruppen';
import { metaFuerPfad } from '../seo';
import type { TabEintrag, KurzformTeile, ReiterKarteTeile } from './typen';

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

/** Anker der ADRESSE («#art-…») oder undefined. Quelle des `wahl`-Feldes. */
function hashVon(path: string): string | undefined {
  const i = path.indexOf('#');
  return i === -1 ? undefined : path.slice(i);
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
