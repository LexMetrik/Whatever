// ─── A35 · Treffer-Highlight in der In-Gesetz-Suche (David 16.7.2026) ─────────
//
// «Suchtreffer im Text markieren — bspw. wenn man im OR ‹Vertrag› sucht, soll
// ‹Vertrag› gehighlighted werden.»
//
// Umsetzung über die CSS Custom Highlight API (`CSS.highlights` + `Highlight` +
// `Range`), NICHT über eine DOM-/React-Baum-Mutation: der Artikel-Wortlaut wird
// von ArtikelBody/NormText strukturiert gerendert (Autolinks, Fussnoten-Popover,
// Tarif-Tabellen, Zitat-Marken). Ein `<mark>`-Wrapper müsste all das durchfädeln
// und die byte-genaue Darstellungswahrheit (§3/§6, Golden) riskieren. Die
// Highlight-API legt die Hervorhebung als reine PAINT-Schicht über die bestehenden
// Text-Knoten — keinerlei Knoten wird erzeugt, verschoben oder verändert (§15/2
// CLS 0, keine Layout-Verschiebung). Styling: `::highlight(lc-such-treffer)` in
// index.css. Fehlt die API (ältere Browser/SSR), degradiert es geräuschlos zu
// «kein Highlight» — die Trefferliste bleibt voll funktionsfähig.

/** Kanonischer Highlight-Name (mit der `::highlight()`-Regel in index.css). */
export const SUCH_HIGHLIGHT = 'lc-such-treffer';

// ─── B1 · Faltung der Tausender-Schreibweisen ────────────────────────────────
//
// Bug-Check §9 zu W2·19-S8. Dieselbe Zahl steht im Haus in DREI Schreibweisen:
// gespeichert mit Leerzeichen («16 800 Franken», AHVV Art. 6quater — allein in
// der AHVV 46 solche Gruppen), gemalt mit dem Schweizer Apostroph («16'800»,
// `gruppiereBetraege`), und getippt so, wie der Jurist es gewohnt ist. Der
// Vergleich lief roh: je nach Schreibweise fand entweder der Index nichts,
// während die Lesespalte malte — die VERBOTENE Richtung des §4.4-Vertrags, für
// den Leser ein Selbstwiderspruch («Kein Artikel gefunden» bei leuchtender
// Stelle) —, oder umgekehrt: Treffer in der Liste, aber nichts leuchtet.
//
// Antwort: EINE Faltung, angewandt auf BEIDE Seiten JEDES Vergleichs. Sie lebt
// hier, weil hier der einzige Vergleich des Hauses liegt — `findeVorkommen`
// bedient den Index (leserSuche.ts) UND den DOM-Walker unten. Ein zweiter
// Faltungsort wäre eine zweite Wahrheit (§5).
//
// DIE REGEL SPIEGELT DIE DARSTELLUNG, sie erfindet nichts: ein Trenner fällt
// genau dann, wenn links eine Ziffer steht und rechts eine Gruppe von GENAU
// DREI Ziffern folgt, auf die keine weitere Ziffer folgt — Zeichen für Zeichen
// die Bedingung aus `gruppiereTausender` (src/lib/normtext/darstellung.ts,
// Pass 1). Damit bleiben «Art. 1 2» zwei Zahlen, «1 2345» unberührt und
// «10 Mio.» unangetastet, während «1'234'567», «1 234 567» und «1234567»
// dieselbe Zeichenkette werden. Kein Ziffernwert wird verändert (§1) — die
// Faltung existiert ausschliesslich im Vergleich, nie im gespeicherten und nie
// im gezeigten Text.
//
// LÄNGENTREUE ÜBER EINE KARTE, nicht über gleich lange Ersetzung: die Offsets
// dieser Funktion adressieren Text-Knoten (Range-Grenzen) und Ausschnitte, sie
// MÜSSEN also auf den rohen Text zeigen. `karte[i]` hält zu jedem gefalteten
// Zeichen seinen ursprünglichen Index.
const TRENNER = new Set(["'", '’', '‘', '´', '`', ' ', ' ', ' ', ' ']);

function istZiffer(z: string | undefined): boolean {
  return z !== undefined && z >= '0' && z <= '9';
}

/** Tausendertrenner aus dem Vergleich nehmen; `karte` bildet nach roh zurück. */
function falteZahlgruppen(text: string): { gefaltet: string; karte: number[] } {
  let gefaltet = '';
  const karte: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (
      TRENNER.has(text[i])
      && istZiffer(text[i - 1])
      && istZiffer(text[i + 1]) && istZiffer(text[i + 2]) && istZiffer(text[i + 3])
      && !istZiffer(text[i + 4])
    ) continue; // Tausendertrenner — fällt aus dem Vergleich
    gefaltet += text[i];
    karte.push(i);
  }
  return { gefaltet, karte };
}

/** Substring-Vorkommen (case-insensitiv) als [start, end)-Offsetpaare IM ROHEN
 *  Text. Rein und vitest-getestet. Vergleichsgrundlage ist der akzenttreue
 *  Teilstring über `toLowerCase` — wie `passtAufSuche` (helpers.tsx) — ZUZÜGLICH
 *  der Tausender-Faltung oben, die `passtAufSuche` bewusst NICHT kennt: dort
 *  geht es um Katalog-/Listenfilter, hier um den Abgleich zwischen Index und
 *  gemaltem Wortlaut, und nur dieser trägt den §4.4-Vertrag. */
export function findeVorkommen(text: string, begriff: string): Array<[number, number]> {
  const b = falteZahlgruppen(begriff.toLowerCase()).gefaltet;
  if (b === '') return [];
  const { gefaltet: hay, karte } = falteZahlgruppen(text.toLowerCase());
  const treffer: Array<[number, number]> = [];
  let ab = 0;
  // indexOf-Schleife statt Regex: der Begriff ist frei (Sonderzeichen), und ein
  // Teilstring-Vergleich braucht kein Escaping. Fortschritt IMMER ≥1 (b.length≥1).
  for (;;) {
    const i = hay.indexOf(b, ab);
    if (i < 0) break;
    // Zurück in den ROHEN Text: Anfang des ersten, Ende des letzten Zeichens.
    treffer.push([karte[i], karte[i + b.length - 1] + 1]);
    ab = i + b.length;
  }
  return treffer;
}

// Die CSS Custom Highlight API ist (je nach TS-lib) nicht typisiert — darum über
// eine schmale, lokale Struktur an `globalThis` gelesen (kein `any`, kein
// lib.dom-Zwang). `Highlight` nimmt beliebig viele Ranges; die Registry ist eine
// Map<string, Highlight>. Fehlt eines der beiden, ist die API nicht verfügbar.
type HighlightCtor = new (...ranges: Range[]) => object;
interface HighlightGlobals {
  Highlight?: HighlightCtor;
  CSS?: { highlights?: Map<string, object> };
}

function highlightApi(): { reg: Map<string, object>; Ctor: HighlightCtor } | null {
  if (typeof globalThis === 'undefined') return null;
  const g = globalThis as unknown as HighlightGlobals;
  const reg = g.CSS?.highlights;
  const Ctor = g.Highlight;
  if (!reg || typeof Ctor !== 'function') return null;
  return { reg, Ctor };
}

/**
 * Marker-Attribut für Knoten, die zur BEDIENUNG der Trefferliste gehören und
 * nicht zum Gesetzestext (Fundstellen-Zähler je Artikel, künftige Meta-Zeilen).
 * `sammleTrefferRanges` überspringt solche Teilbäume vollständig.
 *
 * Bug-Check §9 vom 4.8.2026 (B1): der Zähler «N Fundstellen» stand INNERHALB des
 * Walker-Containers. Bei einem Begriff, der in diesem Wort selbst vorkommt
 * («stelle»), zählte jedes frische Sammeln die eigenen Zähler-Zeilen mit — die
 * Liste meldete 425, der Sprung lief über 681, Anzeige «681/425», und rund ein
 * Drittel der Weiter-Klicks landete auf einer Zeile ohne Markierung. Die
 * Ausgrenzung gehört genau HIERHIN und nicht in die Aufrufer: Malen, Zählen und
 * Springen speisen sich aus dieser einen Funktion und bleiben damit per
 * Konstruktion dieselbe Menge (§5).
 */
export const SUCH_META = 'data-such-meta';

/**
 * Der hochgestellte Fussnoten-MARKER im Wortlaut (`data-fn-marker`, gesetzt in
 * `ArtikelBody`/`ArtikelLeser`) wird vom Walker ebenfalls übersprungen.
 *
 * W2·19-GLIEDERUNG/S8, Bau-Spec §4.4: der Marker ist ein VERWEISZEICHEN, kein
 * Wortlaut — dieselbe Einordnung, die ihn schon beim Schalter «Fussnoten aus»
 * mit dem Apparat verschwinden lässt (index.css). Er trägt die Fussnoten-Nummer
 * ein zweites Mal, an einer Stelle, die im Gesetz keine zweite Fundstelle ist.
 * Gemessen am BGFA: eine Suche nach «1» malte 130 Stellen, während der
 * datenseitige Zähler 124 nannte — die sechs Zusätzlichen waren ausnahmslos
 * Marker-Ziffern. Ohne diesen Ausschluss ist «gemalte ≤ gezählte» für
 * Ziffern-Suchen nicht haltbar, und eine Markierung auf einer hochgestellten
 * Verweisziffer sagt dem Leser ohnehin nichts (§8).
 */
const FN_MARKER = 'data-fn-marker';

/**
 * Marker-Erkennung, exakt wie index.css sie führt.
 *
 * Der Ansicht-Schalter «Fussnoten aus» blendet die Verweiszeichen über ZWEI
 * Selektoren aus: `[data-fn-marker]` (die Träger-Spans, die `ArtikelLeser` um
 * Randtitel-Marker legt) UND `button[aria-label^="Fussnote"]` (die Marker im
 * Fliesstext selbst — `FnRef` in `components/normtext/ArtikelBody.tsx` trägt
 * kein `data-fn-marker`). Der Walker benutzt dieselben beiden Merkmale statt
 * eigener: eine zweite Definition davon, was ein Marker ist, wäre die
 * §5-Doppelwahrheit, an der sich solche Regeln später auseinanderentwickeln.
 * Am BGFA belegt: ohne den zweiten Selektor blieben drei gemalte Marker-Ziffern
 * über der gezählten Menge stehen.
 */
function istFussnotenMarker(el: Element): boolean {
  if (el.hasAttribute(FN_MARKER)) return true;
  return el.tagName === 'BUTTON' && (el.getAttribute('aria-label') ?? '').startsWith('Fussnote');
}

/**
 * Ist der Teilbaum dieses Elements überhaupt darstellbar?
 *
 * Bug-Check §9 vom 4.8.2026 (B2): der Walker hatte keinen Sichtbarkeitsfilter.
 * Schaltet der Nutzer «Fussnoten aus» (`html[data-fussnoten="aus"]` ⇒
 * `display:none` auf Marker + Apparat, index.css) oder die Änderungsvermerke ab
 * (S1-Nachzug 17.8.2026: hier stand «die Hist-Chronologie» — jener dritte Modus ist
 * mit S1 gestrichen, der Sachverhalt gilt unverändert für den zweiwertigen
 * Schalter; D35-F3 7.9.2026: aus beiden ist die Stellung `html[data-vermerke]`
 * geworden, und was dämpfbar bleibt, ist `kl:'A'` — der Sachverhalt gilt
 * unverändert weiter), lag der Text weiter im DOM — der Zähler meldete für OR «Fassung» 141, wovon 61
 * (43 %) in `display:none`-Teilbäumen lagen: unmalbar, und der Sprung dorthin
 * bewegte nichts. Eine Zahl, die Stellen mitzählt, die es auf dem Schirm nicht
 * gibt, lügt über den Zustand (§8).
 *
 * Geprüft wird ausschliesslich «gerendert oder nicht» (display / content-
 * visibility:hidden) — NICHT `visibility` und NICHT `opacity`: die vererben bzw.
 * lassen sichtbare Kinder in unsichtbaren Eltern zu, ein Teilbaum-Verwerfen wäre
 * dort falsch. `content-visibility: auto` (der Reader setzt es je Artikel, §15)
 * gilt ausdrücklich als SICHTBAR — off-screen ist nicht versteckt; genau das ist
 * auch die Vorgabe von `checkVisibility()` ohne Optionen.
 */
function istGerendert(el: Element): boolean {
  const e = el as Element & { checkVisibility?: () => boolean };
  if (typeof e.checkVisibility === 'function') return e.checkVisibility();
  if (typeof getComputedStyle !== 'function') return true;
  return getComputedStyle(el).display !== 'none';
}

/**
 * Sammelt die Treffer-Bereiche des Begriffs in `container` — in DOKUMENT-
 * REIHENFOLGE (TreeWalker). Leerer Begriff / kein Container ⇒ leere Liste.
 *
 * Übersprungen werden (jeweils der GANZE Teilbaum): `[data-such-meta]`-Knoten
 * (Bedienung statt Gesetzestext), `[data-fn-marker]`-Verweiszeichen und alles,
 * was nicht gerendert ist. Damit gilt für jeden Toggle-Zustand: die gemalte
 * Menge ist die anspringbare — und sie ist eine Teilmenge der datenseitig
 * gezählten (W2·19-GLIEDERUNG/S8, Bau-Spec §4.4; bis dahin galt Gleichheit,
 * was mit nie gemalten Feldern strukturell unhaltbar war).
 *
 * W2·10-UI-NAV/R1: dieser Walker war bisher in `setzeSuchHighlight` eingebacken.
 * Er ist jetzt exportiert, weil die Treffer-NAVIGATION (Vor/Zurück-Sprungtasten)
 * und die Fundstellen-ZÄHLUNG je Artikel exakt dieselbe Treffer-Menge brauchen
 * wie die Hervorhebung (§5: EINE Treffer-Semantik — sonst zeigte der Zähler eine
 * andere Zahl, als die Markierung Stellen malt, §8). Rein lesend: es wird kein
 * Knoten erzeugt, verschoben oder verändert (CLS 0, §15/2).
 */
export function sammleTrefferRanges(container: HTMLElement | null, begriff: string): Range[] {
  const b = begriff.trim().toLowerCase();
  // Ab-1-Zeichen genügt (passtAufSuche matcht ab 1 Zeichen); leer ⇒ nichts.
  if (!container || b === '' || typeof document === 'undefined') return [];
  const ranges: Range[] = [];
  // SHOW_ELEMENT mitlaufen lassen, damit FILTER_REJECT einen ganzen Teilbaum
  // abschneiden kann (ein reiner SHOW_TEXT-Walker sieht die Elemente nicht und
  // müsste je Textknoten die Vorfahrenkette hochlaufen).
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(k) {
      if (k.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_ACCEPT;
      const el = k as Element;
      if (el.hasAttribute(SUCH_META) || istFussnotenMarker(el) || !istGerendert(el)) return NodeFilter.FILTER_REJECT;
      // Das Element selbst trägt keinen Text — nur seine Kinder besuchen.
      return NodeFilter.FILTER_SKIP;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue ?? '';
    if (text === '') continue;
    // B1: DIESELBE Vergleichsfunktion wie der Index — nicht ein zweiter
    // indexOf daneben. Bis hierher lief hier eine eigene Schleife, und genau
    // deshalb konnte der DOM eine Schreibweise finden, die der Index nicht
    // kannte (und umgekehrt). `findeVorkommen` liefert Offsets im ROHEN Text,
    // also taugen sie unverändert als Range-Grenzen.
    for (const [von, bis] of findeVorkommen(text, b)) {
      const r = document.createRange();
      r.setStart(n, von);
      r.setEnd(n, bis);
      ranges.push(r);
    }
  }
  return ranges;
}

// ═══ QS-UI-HIGHLIGHT · EINE Registry-Position, mehrere Leser-Instanzen ═══════
//
// ROADMAP-Schritt `QS-UI-HIGHLIGHT`, von FAHRPLAN-LESER-V3 Kap. 14 in Etappe H2
// absorbiert. Befund im Wortlaut: «im Split-View löscht das Rail-Suchfeld die
// Markierung des Nachbar-Panes».
//
// DER MECHANISMUS. Die CSS Custom Highlight API kennt je NAMEN genau eine Menge,
// und `SUCH_HIGHLIGHT` ist ein Modul-Konstant-String. Bis hierher schrieb jede
// Leser-Instanz direkt auf diese eine Position — `reg.set(…)` beim Malen,
// `reg.delete(…)` beim Aufräumen. Im Split-View genügte darum das Leeren EINES
// Suchfelds, um die Markierung des Nachbarn mitzunehmen: dessen Feld war
// weiterhin gefüllt, seine Fundstellen leuchteten aber nicht mehr — die Anzeige
// log über den Zustand (§8). Betroffen war nicht nur Gesetz+Gesetz: der
// Entscheid-Leser schreibt dieselbe Position (`entscheidLeserRegeln.ts`), also
// löschte auch sein `loescheNennungen()` die Gesetz-Panes mit.
//
// WARUM NICHT «ein Highlight-Name je Pane». `::highlight(name)` ist eine
// STATISCHE CSS-Regel (index.css). Pane-abhängige Namen verlangten je Pane eine
// eigene Regel — eine zweite Wahrheit über dieselbe Darstellung (§5) und ein
// harter Deckel auf der Pane-Zahl, den heute nichts sonst kennt.
//
// DIE ANTWORT: es bleibt bei EINER Registry-Position und EINER CSS-Regel.
// Buchgeführt werden die RANGES je Instanz; geschrieben wird stets ihre
// VEREINIGUNG. Wer seine Menge leert, nimmt genau seine Ranges heraus, und die
// des Nachbarn bleiben stehen. Ist keine Instanz mehr belegt, verschwindet die
// Position ganz (`delete`) — eine leere `Highlight`-Instanz stehenzulassen wäre
// ein Zustand, den niemand sieht und den der nächste Leser als «da» läse.
//
// LEBENSDAUER: eine Instanz belegt genau so lange eine Zeile, wie sie eine
// nicht-leere Menge hält. Der Aufräum-Pfad jedes Lesers ruft ohnehin mit leerer
// Menge (Feld geleert, Erlass-/Pane-Wechsel, Unmount), und das löscht die Zeile
// — es braucht darum kein separates Abmelden und es kann nichts auflaufen.

/**
 * Identität eines Lesers gegenüber der Highlight-Registry. Ein `symbol`, weil
 * die Identität zählt und nicht die Beschriftung: zwei Gesetz-Panes heissen
 * beide «leser» und müssen trotzdem getrennt buchen.
 */
export type HighlightInstanz = symbol;

/** Neue Registry-Identität. Je Leser-Instanz EINMAL erzeugen und festhalten. */
export function neueHighlightInstanz(name = 'leser'): HighlightInstanz {
  return Symbol(name);
}

/**
 * Rückfall-Instanz für Aufrufer, die (noch) keine eigene führen. Sie ist eine
 * gewöhnliche Instanz ohne Sonderrechte — wer sie benutzt, teilt sich eine
 * Buchungszeile mit allen anderen Rückfall-Nutzern, genau wie vor QS-UI-HIGHLIGHT.
 */
const STANDARD_INSTANZ: HighlightInstanz = Symbol('standard');

/** Ranges je Instanz. Die Registry sieht immer nur ihre Vereinigung. */
const proInstanz = new Map<HighlightInstanz, readonly Range[]>();

/** Schreibt die Vereinigung aller gebuchten Mengen in die eine Registry-Position. */
function schreibeRegistry(): void {
  const api = highlightApi();
  if (!api) return;
  const { reg, Ctor } = api;
  const alle: Range[] = [];
  for (const rs of proInstanz.values()) alle.push(...rs);
  if (alle.length === 0) { reg.delete(SUCH_HIGHLIGHT); return; }
  reg.set(SUCH_HIGHLIGHT, new Ctor(...alle));
}

/**
 * Bucht eine bereits gesammelte Range-Menge für `instanz` (leere Menge = die
 * Instanz malt nichts mehr) und schreibt die Vereinigung. Getrennt von
 * `sammleTrefferRanges`, damit der Reader den (teuren) TreeWalker EINMAL laufen
 * lässt und dieselbe Menge für Malen, Zählen und Springen verwendet.
 */
export function setzeSuchHighlightRanges(
  ranges: readonly Range[],
  instanz: HighlightInstanz = STANDARD_INSTANZ,
): void {
  // Die Buchführung läuft AUCH ohne API weiter: sie ist reiner Speicher, und ein
  // stiller Zustandsverlust wäre schwerer zu finden als eine fehlende Paint-
  // Schicht. `schreibeRegistry` steigt dann für sich aus.
  if (ranges.length === 0) proInstanz.delete(instanz);
  else proInstanz.set(instanz, ranges);
  schreibeRegistry();
}

/**
 * Setzt (oder löscht) die Treffer-Hervorhebung des Suchbegriffs innerhalb von
 * `container` für `instanz`. Leerer/kurzer Begriff oder fehlende API ⇒ die
 * Menge dieser Instanz wird geleert. Idempotent: ersetzt stets die volle Menge
 * DIESER Instanz, nie die einer anderen.
 */
export function setzeSuchHighlight(
  container: HTMLElement | null,
  begriff: string,
  instanz: HighlightInstanz = STANDARD_INSTANZ,
): void {
  // Ohne API gar nicht erst sammeln: der TreeWalker ist der teure Teil, und
  // ohne Registry gibt es nichts, wofür sein Ergebnis gebraucht würde. Die
  // Buchführung bleibt dann ebenfalls leer — das ist folgerichtig, weil ohne
  // API auch nie etwas geschrieben wurde, das man zurücknehmen müsste.
  if (!highlightApi()) return;
  setzeSuchHighlightRanges(sammleTrefferRanges(container, begriff), instanz);
}
