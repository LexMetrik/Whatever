import { gruppiereErwaegungen, segmente } from '../lib/rechtsprechung/abschnitte';
import { findeVorkommen, neueHighlightInstanz, setzeSuchHighlightRanges } from './gesetz-leser/suchHighlight';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';

// ─── Reine Regeln des Entscheid-Lesers (W2·17-UI-BEFUNDE-B2, Los E) ──────────
//
// Ausgelagert aus `EntscheidLeser.tsx`, damit die Adress-Regeln des Lesers ohne
// Browser prüfbar sind (§6: der Beweis gehört in den Test, nicht in die Zusage).
// Nichts davon ist Rechtslogik (§3) — es sind Adress- und Textsuch-Regeln der
// Darstellungsschicht; alle Funktionen sind rein und deterministisch (§2).

// ── LM-209 · Abschnitts-Hash ohne Verlaufsflut ──────────────────────────────
//
// Befund (Prod, 2.8.2026): die Reiter «Sachverhalt / Erwägungen / Dispositiv»
// waren schlichte `<a href="#abschnitt-…">`. Ein solcher Klick erzeugt
// BROWSERNATIV einen History-Eintrag — gemessen `history.length` 4→5→6→7 bei
// drei Reiter-Klicks; man war danach vier «Zurück» vom Gesetz entfernt, obwohl
// man die Seite nie verlassen hat.
//
// Der Fix schreibt denselben Hash per `replaceState` (Muster der bereits
// gebauten `?ansicht=`-Spiegelung, N0d·J5) und scrollt selbst. Der Hash BLEIBT
// damit in der Adresse (Teilbarkeit), der Verlauf bildet aber nur noch echte
// Ortswechsel ab.
//
// ABGRENZUNG (FAHRPLAN-UI-NAVIGATION §Z Ziff. 7): verworfen ist der laufende,
// SCROLL-getriebene Hash-Sync. Hier ändert ausschliesslich ein diskreter Klick
// die Adresse — kein Scroll-Ereignis schreibt je in die URL. Mit dem
// David-Entscheid vom 3.8.2026 (LM-202) gilt genau dieselbe Grenze für den
// Gesetzes-Leser; die Regel selbst wohnt seither in `lib/liveUrlSync.ts` (§5,
// EINE Adress-Wahrheit) und wird hier nur unverändert weitergereicht — die
// bestehenden Aufrufer und Tests importieren sie weiter von hier.
export { urlMitHash } from '../lib/liveUrlSync';

// ── LM-210 · Lesemodus in der Adresse ───────────────────────────────────────
//
// Befund (Prod, 2.8.2026): der Lesemodus war reiner lokaler State — weder URL
// noch localStorage noch sessionStorage trugen ihn. Eine Vollbild-Ansicht liess
// sich damit nicht weitergeben und überlebte kein Neuladen.
//
// Gebaut nach dem dokumentierten Präzedenzmuster N0d·J5 (`?ansicht=voll|auszug`
// wird per replaceState in die Adresse zurückgeschrieben und beim Laden gelesen).
// Wertform folgt der Bestands-Konvention für Ja/Nein-Achsen (`?leit=1`,
// EntscheidFilter): gesetzt = «1», ausgeschaltet = Parameter FEHLT — so trägt die
// Adresse nie ein totes «lese=0» mit.

/** Name der Lesemodus-Achse in der Adresse. */
export const LESE_PARAM = 'lese';
const LESE_AN = '1';

/** Lesemodus-Zustand aus dem rohen Query-Wert (alles ausser «1» = zu). */
export function leseAusParam(wert: string | null): boolean {
  return wert === LESE_AN;
}

/** Adresse mit gesetztem/entferntem Lesemodus-Flag; übrige Parameter und Hash
 *  bleiben unberührt (der Fassungs-Parameter `?ansicht=` überlebt das Öffnen). */
export function urlMitLese(href: string, offen: boolean): string {
  const u = new URL(href);
  if (offen) u.searchParams.set(LESE_PARAM, LESE_AN);
  else u.searchParams.delete(LESE_PARAM);
  return u.toString();
}

// ── LM-208 · Herkunfts-Norm im Entscheidtext auffindbar machen ───────────────
//
// Befund (Prod, 2.8.2026): der Weg `/gesetze/bund/OR#art-367` → Entscheid-Chip
// führt auf `…?norm=Art.%20367%20OR`, aber die Entscheidseite zeigte den
// Parameter nirgends — kein Herkunfts-Hinweis, keine Markierung im 23'233 Zeichen
// langen Urteil (`document.querySelectorAll('mark').length === 0`).
//
// NICHT hier gebaut (A17 ist Bestand, kein Doppelbau): der SPRUNG zur ersten
// Fundstelle. Der arbeitet über die aufgelöste Fedlex-URL (`ersteFundstelle`) und
// bleibt unberührt.
//
// ── Die Markierungs-Regel, deklariert (§2/§8) ───────────────────────────────
// Markiert und gezählt wird ausschliesslich die WÖRTLICHE Nennung des Zitats mit
// Wortgrenzen. «Art. 367 ff. OR» und «Art. 367 Abs. 2 OR» sind KEINE wörtliche
// Nennung von «Art. 367 OR» und werden NICHT markiert: welche Artikel ein «ff.»
// umfasst, ist eine juristische Schlussfolgerung, keine Textsuche — sie zu raten
// hiesse, eine Behauptung optisch als Fundstelle auszugeben (§1/§8). Genau dieser
// Fall ist der reproduzierte: der Referenz-Entscheid nennt «Art. 367 ff. OR» und
// bekommt deshalb ehrlich KEINE Markierung, sondern den Hinweis, dass die Norm
// im Erwägungstext nicht wörtlich steht.
//
// Gross-/Kleinschreibung zählt (anders als bei der Volltextsuche A35): Zitate
// sind Eigennamen — ein «or» im französischen Fliesstext ist kein «OR».

const REGEX_META = /[.*+?^${}()|[\]\\]/g;

/**
 * Suchmuster für die wörtliche Nennung eines Zitats. Whitespace im Zitat matcht
 * jede Whitespace-Folge (amtliche Texte tragen geschützte Leerzeichen und
 * Zeilenumbrüche mitten im Verweis). Wortgrenzen werden nur dort verlangt, wo das
 * Zitat selbst mit einem ASCII-Wortzeichen beginnt bzw. endet — sonst («§ 4 …»)
 * schlüge `\b` an einer Nicht-Wortstelle fehl und fände nichts.
 * Leeres Zitat ⇒ null (kein Muster, das auf alles passt).
 */
export function zitatMuster(zitat: string): RegExp | null {
  const roh = zitat.replace(/\s+/g, ' ').trim();
  if (!roh) return null;
  const teile = roh.split(' ').map((w) => w.replace(REGEX_META, '\\$&'));
  const vorn = /^[0-9A-Za-z_]/.test(roh) ? '\\b' : '';
  const hinten = /[0-9A-Za-z_]$/.test(roh) ? '\\b' : '';
  return new RegExp(`${vorn}${teile.join('\\s+')}${hinten}`, 'g');
}

/** Anzahl wörtlicher Nennungen des Zitats in einem Text. */
export function zaehleNennungen(text: string, zitat: string): number {
  const re = zitatMuster(zitat);
  return re ? (text.match(re) ?? []).length : 0;
}

// ── B-5 (W2·19-DESIGN-KONSISTENZ · B2/BAU-4, 31.8.2026) · KEIN NAME ZWEIMAL ──
//
// BEFUND der Finder-Welle B: der Entscheid-Kopf setzte die H1 «BGE 146 III 1»
// und zwei Zeilen darunter, in der Meta-Zeile, noch einmal denselben Namen als
// Mono-Chip «146 III 1» — dieselbe Auskunft zweimal auf engem Raum, die zweite
// ohne eigenen Beitrag.
//
// GEMESSEN AM GANZEN KORPUS (31.8.2026, `public/rechtsprechung`): von 1259
// Snapshot-Einträgen mit `bgeReferenz` tragen 1259 die Referenz WÖRTLICH in
// ihrer Zitierung — 1259/1259, kein einziger Gegenfall. Der Chip war heute
// also ausnahmslos eine Wiederholung.
//
// TROTZDEM EINE REGEL UND KEIN ERSATZLOSES LÖSCHEN (§8): 100 % ist die Messung
// von heute, nicht die Zusage von morgen. Ein Entscheid, dessen Zitierung das
// Aktenzeichen trägt und der zusätzlich in die amtliche Sammlung aufgenommen
// wurde («BGer 4A_100/2020» mit `bgeReferenz` «146 III 1»), hat eine ZWEITE,
// echte Identität — die muss sichtbar bleiben. Die Regel entscheidet das an den
// Daten, nicht an einer Annahme über sie.
//
// WORTGRENZE, NICHT SUBSTRING (CLAUDE.md §7): «146 III 1» darf in «BGE 146 III
// 12» NICHT als enthalten gelten — das ist ein anderer Entscheid, und der Chip
// müsste dort stehen bleiben. Genau dafür gibt es `zitatMuster` bereits; sie
// wird hier wiederverwendet statt nachgebaut (§5).
//
// §3: reine Darstellungsregel — sie sagt nur, ob eine Angabe noch etwas
// hinzufügt, nichts über Geltung oder Inhalt des Entscheids.

/**
 * Trägt die Zitierung die BGE-Referenz bereits wörtlich? `true` ⇒ ein zweiter
 * Chip mit derselben Referenz wiederholte nur den Titel und entfällt.
 * Leere/fehlende Referenz ⇒ `false` (es gibt nichts zu wiederholen; der
 * Aufrufer rendert dann ohnehin nichts).
 */
export function referenzImTitel(zitierung: string, bgeReferenz: string | null | undefined): boolean {
  if (!bgeReferenz) return false;
  // Frisches Muster je Aufruf: `zitatMuster` liefert ein `g`-Regex, dessen
  // `lastIndex` sonst zwischen zwei `.test()` weiterwanderte.
  const re = zitatMuster(bgeReferenz);
  return re ? re.test(zitierung) : false;
}

/**
 * Anker aller Erwägungs-Blöcke, die das Zitat wörtlich nennen — in Dokument-
 * Reihenfolge, die Sprungziele des «nächste Fundstelle»-Knopfes. Gleicher
 * Wirkungsbereich und dieselbe Anker-Wahrheit wie `ersteFundstelle` (§5,
 * `gruppiereErwaegungen`); markenlose Blöcke tragen keinen Anker und fallen
 * darum heraus (ein Sprungziel, das es nicht gibt, wird nicht angeboten, §8).
 */
export function nennungsAnker(abschnitte: EntscheidAbschnitt[], zitat: string): string[] {
  const re = zitatMuster(zitat);
  if (!re) return [];
  const erw = abschnitte.find((a) => a.typ === 'erwaegung');
  if (!erw) return [];
  const ziele: string[] = [];
  for (const g of gruppiereErwaegungen(erw.bloecke)) {
    const eintraege: { text: string; anker: string }[] = [];
    if (g.kopf && g.kopfAnker) eintraege.push({ text: g.kopf.text, anker: g.kopfAnker });
    for (const s of g.subs) if (s.anker) eintraege.push({ text: s.block.text, anker: s.anker });
    for (const e of eintraege) {
      re.lastIndex = 0;
      if (re.test(e.text)) ziele.push(e.anker);
    }
  }
  return ziele;
}

/**
 * Ziel des ANKUNFTS-Sprungs bei `?norm=` — der Anker, auf dem der Entscheid
 * aufgeht, wenn man ihn aus dem Gesetz heraus anklickt (Einzelansicht wie
 * Split-Ansicht, derselbe Weg). `null` = keine Fundstelle ⇒ ehrlicher
 * Seitenanfang (§8), nie ein geratener Anker.
 *
 * ── DER BEFUND, DER DIESE FUNKTION NÖTIG MACHT (Auftrag David 30.8.2026) ────
 *
 * Der Leser kannte bisher ZWEI Fundstellen-Wahrheiten und benutzte für die
 * Ankunft nur die eine:
 *
 *   (1) `ersteFundstelle` (lib/rechtsprechung/abschnitte) — Vergleich über die
 *       aufgelöste FEDLEX-URL. Sie ist die breitere Regel, wo sie greift:
 *       «Art. 367 Abs. 2 OR» im Text zählt als Fundstelle zu «Art. 367 OR»,
 *       weil Absatz-Feinheiten die URL nicht ändern. Sie kann aber nur, was
 *       `fedlexLinkFuerArtikel` auflöst — also NUR Bundesrecht, und dort nur
 *       die im Fedlex-Verzeichnis geführten Kürzel.
 *   (2) `nennungsAnker` (oben) — wörtliche Nennung mit Wortgrenzen. Enger bei
 *       Absatz-/ff.-Varianten, dafür quellenunabhängig: sie trägt kantonales
 *       Recht und Bundes-Kürzel ausserhalb des Fedlex-Verzeichnisses.
 *
 * Die Herkunfts-Zeile des Lesers BOT die Ziele aus (2) bereits als Knopf
 * «↓ Fundstelle 1/n» an — die Ankunft benutzte aber ausschliesslich (1). Wo (1)
 * nichts fand und (2) etwas, sagte die Seite dem Nutzer also, wo die Fundstelle
 * steht, und ging trotzdem nicht hin. Genau das ist der gemeldete Eindruck
 * «ich lande am Dokumentanfang».
 *
 * GEMESSEN (30.8.2026, alle 75 365 Artikel↔Entscheid-Kanten der committeten
 * Projektionen `public/rechtsprechung/bezuege/**`, Zitat gebaut wie die UI es
 * baut — `${labelMitBereich(artikelLabel, token)} ${erlass.kuerzel}`):
 *
 *   nur (1), heute          46.6 %   (Bund 54.3 % · Kanton   0.0 %)
 *   (1) dann (2), neu       48.8 %   (Bund 55.3 % · Kanton   9.1 %)
 *
 * Die Reihenfolge ist nicht beliebig: (1) ZUERST hält den Bestand
 * verhaltensneutral (§6) — in 1 779 Kanten hätte (2) einen ANDEREN Anker
 * gewählt als (1), und keine davon ändert sich, weil (2) nur einspringt, wo (1)
 * `null` liefert. Der Zugewinn (1 637 Kanten) ist ausschliesslich Zuwachs, nie
 * Umleitung.
 *
 * WAS SIE AUSDRÜCKLICH NICHT TUT (§1/§2, Grenze des Auftrags): sie rät nicht.
 * Für kantonales Recht bleiben 9 674 Kanten ohne Ziel, weil es keinen
 * kantonalen Zitat-Resolver gibt (Fedlex kennt nur Bundesrecht) — dort steht
 * weiterhin der ehrliche Seitenanfang plus die Herkunfts-Zeile «im Text nicht
 * wörtlich genannt». Das ist ein eigener Bau-Schritt auf dem Risiko-Pfad
 * Extraktion, kein Nebenprodukt einer UI-Änderung.
 */
export function ankunftsAnker(
  abschnitte: EntscheidAbschnitt[],
  zitat: string,
  /** `ersteFundstelle` wird injiziert, damit diese Datei ihre Richtung der
   *  Abhängigkeit behält (Regeln → lib, nicht lib → Regeln) und der Test beide
   *  Zweige einzeln zeigen kann (§6.7). */
  fedlexFundstelle: (a: EntscheidAbschnitt[], z: string) => string | null,
): string | null {
  return fedlexFundstelle(abschnitte, zitat) ?? nennungsAnker(abschnitte, zitat)[0] ?? null;
}

// ── V5 · «Im Entscheid suchen» — dieselbe Substring-Regel wie im Gesetz ──────
//
// Pendant zur In-Gesetz-Suche (A35). Die Treffer-Semantik kommt aus DERSELBEN
// Funktion (`findeVorkommen`, suchHighlight.ts): schlichter, akzenttreuer,
// case-insensitiver Teilstring-Vergleich (§5 — keine zweite Suchwahrheit im
// Entscheid-Leser). Bewusst NICHT `zitatMuster`: das ist die WÖRTLICHE
// Zitat-Erkennung des Herkunfts-Sprungs (case-sensitiv, mit Wortgrenzen) und
// beantwortet eine andere Frage.
//
// Die Trefferliste zeigt nur ERWÄGUNGEN, weil nur sie zitierfähige Anker tragen
// (§8: kein Sprungziel anbieten, das es nicht gibt). Die Gesamtzahl zählt
// dagegen über ALLE Abschnitte der sichtbaren Fassung — sonst behauptete die
// Zeile «3 Treffer», wo im Sachverhalt fünf weitere stehen.

/** Ein Treffer-Bündel: eine anspringbare Erwägung + Anzahl Vorkommen darin. */
export interface SuchTreffer {
  anker: string;
  /** Amtliche Erwägungs-Marke («2.3.1») für die Beschriftung des Sprungziels. */
  marke: string;
  /** Einrückungstiefe (Ziffern-Segmente − 1). */
  tiefe: number;
  anzahl: number;
}

/**
 * Erwägungen mit Vorkommen des Suchbegriffs, in Dokument-Reihenfolge.
 * Leerer Begriff ⇒ leere Liste. Rein/deterministisch (§2).
 */
export function trefferInErwaegungen(abschnitte: EntscheidAbschnitt[], begriff: string): SuchTreffer[] {
  const b = begriff.trim();
  if (b === '') return [];
  const erw = abschnitte.find((a) => a.typ === 'erwaegung');
  if (!erw) return [];
  const out: SuchTreffer[] = [];
  for (const g of gruppiereErwaegungen(erw.bloecke)) {
    const eintraege: { text: string; anker: string; marke: string | null }[] = [];
    if (g.kopf && g.kopfAnker) eintraege.push({ text: g.kopf.text, anker: g.kopfAnker, marke: g.kopf.marke });
    for (const s of g.subs) if (s.anker) eintraege.push({ text: s.block.text, anker: s.anker, marke: s.block.marke });
    for (const e of eintraege) {
      const n = findeVorkommen(e.text, b).length;
      if (n === 0) continue;
      out.push({
        anker: e.anker,
        marke: e.marke ?? '',
        tiefe: e.marke ? Math.max(0, segmente(e.marke).length - 1) : 0,
        anzahl: n,
      });
    }
  }
  return out;
}

/** Vorkommen des Begriffs in der GANZEN sichtbaren Fassung (alle Abschnitte). */
export function zaehleTreffer(abschnitte: EntscheidAbschnitt[], begriff: string): number {
  const b = begriff.trim();
  if (b === '') return 0;
  let n = 0;
  for (const a of abschnitte) for (const bl of a.bloecke) n += findeVorkommen(bl.text, b).length;
  return n;
}

// ── Optische Markierung im gerenderten Lesetext ─────────────────────────────
//
// Umsetzung wie A35 (`gesetz-leser/suchHighlight.ts`) über die CSS Custom
// Highlight API statt über `<mark>`-Wrapper: der Entscheidtext wird von
// EntscheidBody/NormText strukturiert gerendert (Norm-Autolinks, Kolumnentitel-
// Marker, Pin-Cite-Anker). Ein Wrapper müsste all das durchfädeln und die
// Darstellungswahrheit riskieren (§3/§6); die Highlight-API legt eine reine
// PAINT-Schicht darüber — kein Knoten wird erzeugt, verschoben oder verändert
// (CLS 0, §15). Fehlt die API (ältere Browser, SSR), degradiert es geräuschlos.
// Der Highlight-NAME ist derselbe wie bei A35, damit die eine `::highlight()`-
// Regel in index.css die eine Treffer-Optik bleibt (§5).

/** Ein Treffer im gerenderten Text: Textknoten + Offsets (noch keine Range). */
export interface Nennung { knoten: Node; start: number; ende: number }

/**
 * Sammelt die wörtlichen Nennungen im gerenderten Text unterhalb von `container`.
 * Reine Traversierung (TreeWalker + Offsets, keine Range) — dadurch auch ohne
 * Browser prüfbar. Treffer, die im Markup über mehrere Textknoten zerfallen,
 * werden bewusst NICHT zusammengesetzt: lieber eine Markierung weniger als eine
 * an falscher Stelle (§1).
 */
export function sammleNennungen(container: Element | null, zitat: string): Nennung[] {
  const re = container ? zitatMuster(zitat) : null;
  if (!container || !re) return [];
  const doc = container.ownerDocument;
  if (!doc?.createTreeWalker) return [];
  const treffer: Nennung[] = [];
  const walker = doc.createTreeWalker(container, 4 /* NodeFilter.SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue ?? '';
    if (text === '') continue;
    re.lastIndex = 0;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      treffer.push({ knoten: n, start: m.index, ende: m.index + m[0].length });
      if (m[0].length === 0) break;   // Sicherung gegen Endlos-Lauf
    }
  }
  return treffer;
}

// ─── QS-UI-HIGHLIGHT: auch der Entscheid-Leser bucht auf einer Instanz ───────
//
// Hier stand bis zum 16.8.2026 eine ZWEITE, lokale Kopie von `highlightApi()`,
// die direkt auf die Registry-Position `SUCH_HIGHLIGHT` schrieb und sie mit
// `reg.delete(…)` wieder räumte. Damit reichte der Defekt aus QS-UI-HIGHLIGHT
// über den Gesetz-Leser hinaus: steht ein Entscheid neben einem Gesetz — genau
// der Split-View, den `split-view-a34.e2e.ts` öffnet —, nahm `loescheNennungen()`
// beim Verlassen die Treffer-Markierung des GESETZES mit. Dieselbe Ursache, nur
// durch eine andere Tür. Beides läuft jetzt über die eine Buchführung in
// `suchHighlight.ts`; ein zweiter Schreiber auf dieselbe Position wäre die
// §5-Doppelwahrheit, an der sich solche Regeln auseinanderentwickeln.
//
// EINE Instanz für BEIDE Pfade dieses Lesers, und zwar bewusst: der
// Entscheid-Leser hat genau eine Markierungs-Schicht im Lesetext, und «Suche
// schlägt Herkunfts-Nennung» ist sein erklärtes Verhalten (EntscheidLeser.tsx).
// Zwei Instanzen liessen beide gleichzeitig leuchten — eine stille
// Verhaltensänderung an einer Fläche, die dieser Bauschritt nicht umbaut.
//
// OFFEN, bewusst nicht hier gelöst: zwei ENTSCHEID-Panes nebeneinander teilen
// sich weiterhin diese eine Modul-Instanz und überschreiben einander —
// unverändert gegenüber dem Vorzustand und ausserhalb von QS-UI-HIGHLIGHT, das
// den Gesetz-Leser als Befund nennt. Vermerkt im Fahrplan, Kap. 14.
export const ENTSCHEID_HIGHLIGHT_INSTANZ = neueHighlightInstanz('entscheid-leser');

/** Markiert die wörtlichen Nennungen; ohne Treffer bzw. ohne API wird gelöscht. */
export function maleNennungen(container: Element | null, zitat: string): number {
  const treffer = sammleNennungen(container, zitat);
  const doc = container?.ownerDocument;
  if (treffer.length === 0 || !doc) {
    setzeSuchHighlightRanges([], ENTSCHEID_HIGHLIGHT_INSTANZ);
    return treffer.length;
  }
  const ranges = treffer.map((t) => {
    const r = doc.createRange();
    r.setStart(t.knoten, t.start);
    r.setEnd(t.knoten, t.ende);
    return r;
  });
  setzeSuchHighlightRanges(ranges, ENTSCHEID_HIGHLIGHT_INSTANZ);
  return ranges.length;
}

/** Nimmt die Markierung zurück (Verlassen der Seite, Wechsel in den Lesemodus). */
export function loescheNennungen(): void {
  setzeSuchHighlightRanges([], ENTSCHEID_HIGHLIGHT_INSTANZ);
}

// ── GA-2 (W2·24-DESIGN-IDENTITAET, 7.9.2026) · JEDE ANGABE GENAU EINMAL ─────
//
// BEFUND G4 (Messung 6.9.2026 @1440, `/rechtsprechung/ag_gerichte_HOR_2024_19`,
// oberste 300 px): «Obergericht AG» stand DREIMAL (Overline · H1 · abgeleitete
// Leitzeile), «Privatrecht» zweimal (Overline · Leitzeile), das Urteilsdatum
// zweimal (H1 «… vom 12.12.2025» · Fakten «Entscheid vom 12.12.2025»). Die H1
// ist die ZITIERUNG des Entscheids und trägt Gericht, Nummer und Datum bereits
// vollständig — jede weitere Nennung derselben Angabe im selben Bild ist keine
// Auskunft mehr, sondern Wiederholung (FAHRPLAN-DESIGN-IDENTITAET §5 D4).
//
// Die Antwort ist dieselbe, die B-5 für den BGE-Referenz-Chip schon getroffen
// hat: NICHT «die Angabe ist überflüssig», sondern «sie ist überflüssig, WENN
// der Titel sie wörtlich trägt» — geprüft an den Daten, wortgrenzen-genau
// (CLAUDE.md §7), nie an einer Annahme über sie. Trägt eine künftige Zitierung
// den Gerichtsnamen NICHT (z. B. «BGE 152 IV 14»), steht die Angabe weiter da.
//
// §3: reine Darstellungsregeln — sie sagen nur, ob eine Angabe im selben Bild
// noch etwas hinzufügt, nichts über Geltung oder Inhalt des Entscheids.

/**
 * Trägt der Titel (die Zitierung) diese Angabe bereits wörtlich? Verallgemeinert
 * `referenzImTitel` auf jede Kopf-Angabe (Gerichtsname, Datumstext) und nutzt
 * dasselbe eine Muster (`zitatMuster`, §5). Leere Angabe ⇒ `false`.
 */
export function angabeImTitel(zitierung: string, angabe: string | null | undefined): boolean {
  if (!angabe) return false;
  const re = zitatMuster(angabe);
  return re ? re.test(zitierung) : false;
}

/**
 * Die abgeleitete Leitzeile OHNE die Angaben, die derselbe Kopf schon zeigt.
 *
 * `synthThema` (lib/rechtsprechung/browse.ts) baut sie als
 * «<Sachgebiet> — <Gericht> · angewandt: <Normen>» bzw. «<Sachgebiet> —
 * <Gericht>, <Jahr>». Beide führenden Glieder stehen im Reader-Kopf bereits:
 * das Sachgebiet in der Overline, das Gericht in der H1. Die Zeile wird darum
 * für DIESE eine Anzeige um sie gekürzt — `synthThema` selbst bleibt
 * unangetastet, weil dieselbe Zeile auch die Rechtsprechungs-Liste trägt, wo
 * kein Kopf daneben steht (§5: eine Quelle, zwei Zuschnitte).
 *
 * Bleibt nach dem Kürzen keine Sachaussage übrig (der Fall ohne Normen: es
 * stünde nur noch eine Jahreszahl da, die die H1 ebenfalls trägt), gibt sie
 * `null` zurück — lieber keine Zeile als eine leere (§8).
 */
export function leitzeileOhneKopfangaben(
  leitzeile: string | null | undefined,
  angaben: readonly (string | null | undefined)[],
): string | null {
  if (!leitzeile) return null;
  let rest = leitzeile;
  for (const a of angaben) {
    if (!a) continue;
    const re = zitatMuster(a);
    if (re) rest = rest.replace(re, '');
  }
  // Die Fugen, die dabei entstehen («— · angewandt: …», « — , 2025»), sind die
  // Trennzeichen von `synthThema` ohne ihren linken Operanden. Sie fallen mit
  // weg; was übrig bleibt, muss mit einem Wort beginnen.
  rest = rest.replace(/\s+/g, ' ').replace(/^[\s—·,–-]+/, '').replace(/[\s—·,–-]+$/, '').trim();
  return /\p{L}{2}/u.test(rest) ? rest : null;
}

// ── W2·29-WERKBANK-REST S1 · MINDESTLÄNGE DER ENTSCHEID-SUCHE ────────────────
// Entscheid David 22.9.2026 (Posten «Entscheid-Suche — Zählzeile und
// Mindestlänge»): gesucht wird erst ab ZWEI Zeichen. Gemessen 21.9.2026: ein
// einzelnes Zeichen erzeugte auf einem langen Entscheid 15 019 Treffer in 201
// Erwägungen und ~150 ms Arbeit — und der teuerste Aufruf war per Konstruktion
// der erste, unentprellte. Bewusste FACHLICHE Folge, kein Nebeneffekt:
// Einzelzeichen wie «§» oder eine Ziffer finden nichts mehr. Gezählt wird nach
// `trim()`, wie überall in dieser Suche. EINE Stelle (§5) für Rail, Zähler,
// Landkarte UND Hervorhebung im Lesetext.
const SUCHE_MIN_ZEICHEN = 2;

/** Trägt der Suchbegriff eine Suche (≥ zwei Zeichen nach `trim()`)? */
export function sucheWirksam(suche: string): boolean {
  return suche.trim().length >= SUCHE_MIN_ZEICHEN;
}
