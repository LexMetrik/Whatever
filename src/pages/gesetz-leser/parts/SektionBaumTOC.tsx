import { memo, useMemo, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { romanFrei, margLabel } from '../helpers';
import { merkeRuecksprungVonDom } from '../scrollAnker';
import { zeilenAnsicht, findeMarke, type GliederungsKnoten } from '../gliederungsModell';
import { vollText, berechneKlappKontext } from './klappNamen';

// ═══ Gliederungsbaum der Seitenleiste (Zone B) ═══════════════════════════════
//
// W2·19-GLIEDERUNG · S4. Bau-Spec fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md
// §3.3 (Zeilen-Anatomie), §3.4 (Sonderknoten), §3.5 (Positionsmarke F5).
//
// EINGABE IST SEIT S4 DAS MODELL, NICHT MEHR DER ROHBAUM. Die Komponente
// rendert `GliederungsKnoten[]` aus `gliederungsModell.ts` — dort und nur dort
// werden Zählwerte, Bereiche, Einzelkind-Verdichtung, Vorspann-, Anhang- und
// gemischte Knoten bestimmt (§3 Schichtentrennung: hier lebt Darstellung, keine
// Ableitung). Der Vorteil ist nicht Eleganz, sondern Prüfbarkeit: die
// Entscheidungen sind ohne DOM unit-getestet (src/tests/gliederung-modell-w219).
//
// Der Schlüssel bleibt `sek-N`. Eine verdichtete Zeile trägt ihre
// zusammengefassten Ids in `k.ids`; Aktiv-Erkennung und Klapp-Zustand fragen
// deshalb immer die ganze Liste, nie nur `k.id`. Ohne das verlöre eine
// verdichtete Zeile ihre Markierung, sobald der Scroll-Spy eine INNERE Stufe
// meldet.

// Entscheid David 5.8.2026 («gliederung … standardmässig zugeklappt und erst auf
// klicken öffnen»): der Baum startet zu. Der Wert lebt seit S4 NICHT mehr hier,
// sondern als `startOffeneTiefe` im Modell — David hat den Entscheid am 8.8.2026
// für KLEINE Bäume (≤ 40 Zeilen) und den Artikel-Index moduliert (Spec §11
// Ziff. 1, Entscheid-Protokoll), und diese Unterscheidung kann nur das Modell
// treffen, das die Zeilenzahl kennt. Für grosse Bäume (OR/ZGB) liefert es
// weiterhin 0 = alles zu.

// ─── LM-155 · Tiefenführung (B4-N1) — was bleibt, was S4 ersetzt ─────────────
//
// BLEIBT (Mittel 1, «eine Sprache für beide Spalten»): die Ebenen-STIMME. Der
// Fliesstext unterscheidet amtliche Teil/Titel/Abschnitt (Display-Stimme) von
// randtitel-promoteter Feingliederung (ruhige Serif-Stimme, SektionKopf.tsx);
// der Baum spricht dieselbe Sprache. Der Gewinn ist die Wiedererkennung.
//
// BLEIBT (Mittel 3, Rhythmus): der Vorlauf der obersten Knoten, der die lange
// Liste in Blöcke fasst — statisch, also ohne Eigenbewegung (A33 «ruhige
// Gliederung»).
//
// ERSETZT (Mittel 2, Schrittweite): der KUMULIERTE Einzug mit zwei Schrittweiten
// (0.875 rem amtlich / 0.625 rem randtitel, Deckel 5 rem) weicht der
// Stufenleiter aus Spec §3.3 — 0 / 0.75 / 1.25 / 1.75 rem, ab Ebene 4 je
// +0.25 rem. Drei Gründe, deklariert statt beiläufig:
//   (a) Die Verdichtung der Einzelkind-Ketten (§3.3, im Modell) hat die leeren
//       Durchgangsstufen entfernt, für die die kumulative Zweitskala gedacht
//       war — eine Zeile ist jetzt eine echte Stufe.
//   (b) Der kumulative Weg hatte KEINEN harten Deckel je Ebene, nur die
//       5-rem-Klemme; in der 16-rem-Spalte lief die Textbreite bei sieben
//       Ebenen trotzdem gegen 9 rem. Die Leiter deckelt bei Ebene 6 auf
//       2.5 rem: ZGB Stufe 5 behält in der neuen 18-rem-Spalte > 13 rem.
//   (c) Ein reiner Tiefen-Ausdruck ist ohne Elternkontext berechenbar — die
//       Zeile wird damit zu einem memoisierbaren Bauteil (F3, s. u.).
// Und unverändert: KEINE Linie, kein Guide, kein «Gleisbett» im Baum (A28,
// David 12.7.2026 «das mit den linien funktioniert überhaupt nicht»).

/** Einzug-Leiter je Tiefe (rem). Ab Ebene 4 wächst sie in 0.25-rem-Schritten. */
const EINZUG_STUFEN = [0, 0.75, 1.25, 1.75];
const EINZUG_SCHRITT_TIEF = 0.25;
// Bewusst NICHT exportiert: `react-refresh/only-export-components` verlangt, dass
// eine Komponenten-Datei nur Komponenten exportiert. Die Leiter hat hier ohnehin
// keinen zweiten Konsumenten — bräuchte sie einen, gehörte sie in eine eigene Datei.
function einzugFuerTiefe(tiefe: number): number {
  if (tiefe < EINZUG_STUFEN.length) return EINZUG_STUFEN[tiefe];
  return EINZUG_STUFEN[EINZUG_STUFEN.length - 1] + (tiefe - (EINZUG_STUFEN.length - 1)) * EINZUG_SCHRITT_TIEF;
}

/**
 * Stimme einer Baum-Ebene: `form` (Grösse/Gewicht/Schriftfamilie) und `tinte`
 * getrennt, weil Aktiv-Zeile und Ahnen-Pfad die Tinte überschreiben und zwei
 * gleichrangige Tinten-Utilities in EINEM className sonst quellordnungs-abhängig
 * gewinnen würden (nicht deterministisch, §2). `pre` hebt den Enumerator-Vorsatz
 * («Erster Titel:») nur dort, wo die Ebene selbst nicht schon hebt.
 * Tinten enden bei ink-800: ink-900 bleibt der EINEN Positionsmarke vorbehalten.
 * W2·29 S3: ohne die H2-Dämpfung (Werkbank «gesättigt»); Randtitel ink-600.
 */
/**
 * Stimme der Artikel-Zeile (W2·18-FEHLERBUCH, unterste Klapp-Ebene). Bewusst
 * DIESELBE wie im flachen Artikel-Index (`parts/ArtikelIndex.tsx`): `text-xs`,
 * Etikett in `num font-medium text-ink-800`, Sachtitel gedämpft in
 * `text-ink-600`. Ein Artikel muss in der Leiste gleich aussehen, egal ob der
 * Erlass ihn im Baum (B1) oder flach (B2/B4) zeigt — sonst behauptete die
 * Oberfläche einen Unterschied, den es fachlich nicht gibt.
 */
const ARTIKEL_STIMME = { form: 'text-xs font-normal', tinte: 'text-ink-700', pre: '' } as const;

function ebenenStimme(randtitel: boolean, tiefe: number): { form: string; tinte: string; pre: string } {
  if (randtitel) return { form: 'text-xs font-serif font-normal', tinte: 'text-ink-600', pre: 'font-medium' };
  if (tiefe === 0) return { form: 'text-body-s font-semibold', tinte: 'text-ink-800', pre: '' };
  if (tiefe === 1) return { form: 'text-xs font-semibold', tinte: 'text-ink-700', pre: '' };
  if (tiefe === 2) return { form: 'text-xs font-medium', tinte: 'text-ink-700', pre: '' };
  return { form: 'text-xs font-normal', tinte: 'text-ink-600', pre: 'font-medium' };
}

/**
 * F5 Ahnen-Pfad (§3.5): Knoten oberhalb der Marke werden um GENAU EINE
 * Tintenstufe gehoben — keine Fläche, kein Fettschnitt. Der Fettschnitt ist die
 * belegte a9-CLS-Wurzel (bei 256 px Spaltenbreite brach er lange Labels um:
 * 42.5 px fett gegen 23.25 px normal), und eine zweite Fläche neben der Marke
 * hiesse wieder «mehrere Stellen sind aktiv». Die Abbildung ist explizit statt
 * gerechnet, damit nie eine Stufe entsteht, die es im Token-Satz nicht gibt.
 */
const AHNEN_TINTE: Record<string, string> = {
  'text-ink-500': 'text-ink-700',
  'text-ink-600': 'text-ink-800',
  'text-ink-700': 'text-ink-800',
  'text-ink-800': 'text-ink-800',
};

// ─── W2·18-FEHLERBUCH (David 15.9.2026): «man erkennt nicht, wo man ist» ────
//
// DIE MARKE VERSPRACH `font-medium` UND LIEFERTE `font-weight: 400`. Gemessen
// am laufenden Stand (Chromium, /gesetze/bund/OR, 15.9.2026): die aktive Zeile
// trug `… font-normal text-brass-700 font-medium` und stand bei 400.
// URSACHE, nicht vermutet, sondern aus dem Stylesheet gelesen: zwei
// gleichrangige Gewichts-Utilities in EINEM className entscheiden nach der
// QUELLORDNUNG der erzeugten Regeln — und Tailwind 3.4 emittiert `.font-medium`
// (Regel-Index 926) VOR `.font-normal` (927). Die spätere Regel gewinnt, also
// font-normal. Dasselbe Muster, das der `stimme`-Kommentar für die TINTE
// bereits beschreibt («nicht deterministisch, §2») — für das Gewicht war es
// übersehen worden.
//
// DIE MARKE ERSETZT DAS GEWICHT STATT ES ZU ERGÄNZEN. Die Tabelle ist explizit,
// damit nie eine Stufe entsteht, die die Skala nicht kennt, und eine Ebene, die
// ohnehin schwerer setzt (Tiefe 0: `font-semibold`), ihr Gewicht BEHÄLT — die
// Marke darf eine Zeile nie leichter machen.
const MARKEN_GEWICHT: Record<string, string> = {
  'font-normal': 'font-medium',
  'font-medium': 'font-medium',
  'font-semibold': 'font-semibold',
};
/** Die Form der Marken-Zeile: gleiche Stimme, gehobenes Gewicht (genau EIN
 *  Gewichts-Utility im Ergebnis). */
function markenForm(form: string): string {
  return form.replace(/\bfont-(?:normal|medium|semibold)\b/, (t) => MARKEN_GEWICHT[t] ?? t);
}

// `zeileIstOffen` und `findeMarke` sind seit dem Bug-Check 9.8.2026 KEINE
// lokalen Helfer mehr, sondern Teil des Modells (`gliederungsModell.ts`). Beide
// sind reine Ableitungen aus dem Knoten und dem Klapp-Zustand — sie gehören zur
// Schicht, die entscheidet, WAS die Leiste zeigt, nicht zu der, die es malt
// (§3). Der Auslöser war praktisch: die Marken-Regel war nur über einen DOM-Lauf
// prüfbar, und genau deshalb blieb B4 (Marke verschwindet im Anhang) unentdeckt,
// obwohl es eine reine Modell-Frage ist. Jetzt trägt sie ein Unit-Fall.

// ─── ENTSCHEID DAVID 9.8.2026: KEINE ZÄHLWERTE AN DER ZEILE ─────────────────
// «keine relevante Information». Die Zeile trägt seither nur noch ihr Etikett
// (plus das Aufgehoben-Signal) — der adaptive Zählwert («Art. 1–40 · 14»
// zugeklappt, «14» aufgeklappt) ist ersatzlos gestrichen, sichtbar wie in
// `aria-label`/`title`: eine Zahl, die nur der Screenreader hört, wäre keine
// Ehrlichkeit (§8), sondern eine zweite, ungeprüfte Fassung der Zeile.
//
// DAS MODELL BEHÄLT DIE KENNZAHLEN. `artikelAnzahl`, `eigeneArtikel` und
// `bereich` bleiben in `gliederungsModell.ts` unverändert und unit-getestet —
// die Erlass-Übersicht (Zone C, S6) rechnet weiter mit ihnen. Gestrichen ist
// allein die ANZEIGE an der Baumzeile (§3: Darstellung, nicht Ableitung).
//
// Was mit der Streichung gegenstandslos wird: die `invisible`-Klemme, die den
// Bereich beim Aufklappen nur unsichtbar schaltete, statt ihn zu entfernen
// (sie hielt die Box-Breite konstant, weil ein Breitenwechsel ein grenzwertiges
// Label von einer auf zwei Zeilen kippen liess — §15.2/a9). Ohne Zählwert gibt
// es keine wechselnde Box mehr; die Zeile ist jetzt in beiden Klapp-Zuständen
// gleich breit, also von sich aus shift-frei.

interface ZeilenProps {
  k: GliederungsKnoten;
  erster: boolean;
  aktivPfad: string[];
  /** Id der EINEN Zeile mit der Positionsmarke (s. findeMarke). */
  markeId: string | null;
  /** QS-UI-Nachzug (5.9.2026): Kontext-Zusatz je Zeilen-Id, NUR gesetzt, wenn
   *  derselbe Titel im Baum mehrfach als Chevron-Zeile vorkommt (s. klappNamen.ts). */
  klappKontext: Map<string, string>;
  offen: Record<string, boolean>;
  startOffeneTiefe: number;
  /** B3: EINE Zeile, EIN Zielwert — alle Ids der Zeile plus ihr sichtbarer Zustand. */
  onToggle: (ids: string[], istOffen: boolean) => void;
  /** B3: die Sprungzeile gibt ALLE ihre Ids mit, nicht nur die äusserste. */
  onSprung: (ids: string[]) => void;
  onSprungArtikel: (token: string) => void;
}

// ─── P8 · DIE GLIEDERUNGSZEILE IST EIN LINK, KEIN KNOPF ─────────────────────
//
// BEFUND (Prüfer R6, 6.9.2026): der Gliederungsbaum bestand aus 39 `button` und
// 2 `a`. Ein Knopf hat keine Adresse — ⌘-/Strg-Klick öffnete keinen neuen
// Reiter, der Mittelklick tat nichts, «Link-Adresse kopieren» fehlte im
// Kontextmenü. Für ein Verzeichnis, dessen einziger Zweck das Springen an eine
// Stelle des Erlasses ist, ist das der falsche Grundbaustein.
//
// WELCHE ADRESSE (§8 — nie ein toter Link): `#art-<token>` des ERSTEN Artikels
// im Teilbaum. `GliederungsKnoten.ersterArtikel` führt den Token ausdrücklich
// als «Sprungziel, Anker `art-<token>`» (gliederungsTypen.ts), und genau diesen
// Anker kennt der Leser schon — es ist dieselbe Adresse, die ein Tieflink von
// aussen trägt. Eine Zeile OHNE `ersterArtikel` hat keine Adresse, die beim
// Neuladen wieder dort landet; sie bleibt ein `button`, statt eine zu erfinden.
//
// ZWEI ZWEIGE STATT EINES UMGESCHALTETEN TAGS: `<a>` und `<button>` haben
// verschiedene Pflicht-Attribute; ein dynamisches Tag bräuchte ein `as any` und
// schaltete die Typprüfung genau dort ab, wo sie etwas hält. Die Ereignis-
// Handler sind auf `HTMLElement` typisiert und passen damit auf beide Zweige.
interface TocZeileProps {
  /** Gesetzt = die Zeile ist ein Link. Ungesetzt = sie bleibt ein Knopf. */
  href?: string;
  onClick: (ev: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (ev: KeyboardEvent<HTMLElement>) => void;
  'aria-expanded'?: boolean;
  'aria-current'?: 'location';
  'data-toc-aktiv'?: string;
  title: string;
  'aria-label': string;
  className: string;
  children: ReactNode;
}
function TocZeile({ href, children, ...rest }: TocZeileProps) {
  return href
    ? <a href={href} {...rest}>{children}</a>
    : <button type="button" {...rest}>{children}</button>;
}

/**
 * Gehört dieser Klick dem SPRUNG oder dem BROWSER? Mit Modifikatortaste oder
 * mittlerer Taste ist er die Bitte «öffne das woanders» — dann lässt der
 * Handler los, und der Link tut, was ein Link tut.
 */
function istSchlichterKlick(ev: MouseEvent<HTMLElement>): boolean {
  return ev.button === 0 && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey;
}

// ─── F3 (Teil 1 von 2): EINE Zeile = EIN memoisiertes Bauteil ────────────────
// BEFUND (Perf-Diagnose 8.8.2026, U3): der Baum war EIN einziges memo-Bauteil,
// das seine 11 075 Knoten in einer Closure-Rekursion erzeugte — jede Änderung an
// `offen`/`aktivPfad` liess React den kompletten Kodex neu durchlaufen (OR: 2181
// Zeilen). Klick-Latenz @4× 231 ms gegen 33 ms bei BGFA.
//
// WAS DIESE HÄLFTE BRINGT — und was nicht (§15/4, Default-Komparator, bewusst
// keine eigene Vergleichsfunktion): `offen` und `aktivPfad` sind Referenzen;
// ändert sich eine davon, rendern die Zeilen neu. Der Gewinn liegt in den
// Fällen, in denen der Elternbaum aus ANDEREN Gründen rendert (Scroll-Spy setzt
// `aktArtikel`, Callback-Identität, Suche) — dann hält jede Zeile. Den grossen
// Teil nimmt erst der Unmount zugeklappter Äste weg (S5): was zu ist, existiert
// nicht mehr, also kostet auch ein Voll-Rerender nur den offenen Pfad
// (~250 statt 11 075 Knoten). Beides zusammen ist F3; einzeln trüge keines —
// darum steht hier ausdrücklich nur die Hälfte, und der Unmount folgt in S5.
const Zeile = memo(function Zeile({
  k, erster, aktivPfad, markeId, klappKontext, offen, startOffeneTiefe, onToggle, onSprung, onSprungArtikel,
}: ZeilenProps): ReactNode {
  // Was die Zeile zeigt und ob sie als offen gilt, entscheidet das Modell
  // (`zeilenAnsicht`, §3) — «offen» heisst seit W2·5m-LESER-V3: man sieht
  // Kinder. Eine Zeile mit zugeklappter Artikel-Ebene meldet sich ZU.
  const { auf, sichtbareKinder } = zeilenAnsicht(k, offen, startOffeneTiefe);
  // `hatKinder` steuert Chevron und `aria-expanded`. Massgeblich ist, was die
  // Zeile ÖFFNEN KANN, nicht was gerade zu sehen ist — sonst verschwände der
  // Knopf an einer Zeile, die nur Artikel trägt, und die Ebene wäre unerreichbar.
  const hatKinder = k.kinder.length > 0;
  const istMarke = markeId !== null && k.id === markeId;
  const aufPfad = !istMarke && k.ids.some((id) => aktivPfad.includes(id));
  const stimme = k.art === 'artikel' ? ARTIKEL_STIMME : ebenenStimme(k.randtitel, k.tiefe);
  // W2·29 S3 (Werkbank, 23.9.2026): die H2-Dämpfung (16.8.2026, Baum eine
  // Stufe leiser, Marke in Messing) ist aufgehoben — der Baum spricht seine
  // Ebenen-Stimme, die Marke trägt Tinte `ink-900` auf der Registerfläche
  // (F0.2: Fläche nur `--reg-*-flaeche`, darauf Tinte, nie Registerfarbe als
  // Text). Ihr Gewicht steckt in `markenForm` (s. o.).
  const tinte = istMarke ? 'text-ink-900' : aufPfad ? (AHNEN_TINTE[stimme.tinte] ?? stimme.tinte) : stimme.tinte;
  const form = istMarke ? markenForm(stimme.form) : stimme.form;
  // LM-155 Mittel 3: Rhythmus — die obersten Knoten bekommen einen Vorlauf. Der
  // jeweils ERSTE Knoten einer Liste bleibt bündig. Statisches margin ⇒ kein
  // Layout-Shift zur Laufzeit (§15.2).
  const takt = erster ? '' : k.tiefe === 0 ? 'mt-3' : k.tiefe === 1 && !k.randtitel ? 'mt-1.5' : '';
  const { pre, rest } = romanFrei(k.labelKette[k.labelKette.length - 1]);
  // Vollständiger Text für Screenreader und Tooltip: der sichtbare Label ist auf
  // zwei Zeilen geklammert (Labels bis 280 Zeichen sind belegt) — ohne diesen
  // Vollwert wäre der Rest still verloren (§8). Er nennt genau das, was die Zeile
  // auch zeigt: Etikett und, wenn zutreffend, das Aufgehoben-Signal.
  const voll = vollText(k);
  // QS-UI-Nachzug (5.9.2026, Klasse PR #685): NUR gesetzt, wenn `voll` im
  // Baum mehrfach als Chevron-Titel vorkommt (klappNamen.ts) — sonst bleibt
  // der Name unverändert, wie im Auftrag verlangt.
  const klappNamenKontext = klappKontext.get(k.id);
  // P8: die Adresse DIESER Zeile — oder `undefined`, wenn sie keine hat.
  const sprungZiel = k.ersterArtikel ? `#art-${k.ersterArtikel}` : undefined;

  return (
    // data-sektion-id nur an echten Sektionszeilen: der Auto-Zuklapp-Pfad
    // (inhalt-hooks) misst darüber die Lage eines Astes im Sichtfenster des
    // [data-toc]-Containers. Synthetische Zeilen (Vorspann/Anhänge) haben keine
    // `sek-N`-Identität — sie hier zu erfinden, wäre eine zweite Wahrheit (§5).
    // `data-sektion-ids` (S5): ALLE Ids dieser Zeile, leerzeichengetrennt — der
    // Auto-Zuklapp-Pfad schlägt darüber Id → gerendertes Element nach
    // (`[data-sektion-ids~="sek-8"]`). Eine verdichtete Einzelkind-Kette hat für
    // ihre INNEREN Stufen kein eigenes Element; ein Sonder-DOM dafür wäre eine
    // zweite Wahrheit über den Baum (§5) — ein Attribut an der Zeile, die die
    // Stufe ohnehin trägt, sagt dasselbe ehrlicher. `data-sektion-id` bleibt
    // unverändert der äussere Schlüssel (Bestandssonden, e2e).
    <li data-sektion-id={k.art === 'sektion' ? k.id : undefined}
      data-sektion-ids={k.art === 'sektion' ? k.ids.join(' ') : undefined}>
      <div className={`flex items-start ${takt}`} style={{ paddingLeft: `${einzugFuerTiefe(k.tiefe)}rem` }}>
        {hatKinder
          ? (
            <button
              type="button"
              // Die Zeile klappt über ALLE ihre Ids auf EINEN gemeinsamen
              // Zielwert. Bis zum Bug-Check 9.8.2026 (B3) stand hier
              // `k.ids.forEach(onToggle)` — n EINZEL-Flips. Waren die Ids nicht
              // im gleichen Zustand (ein Sektions-Sprung öffnet nur die äussere),
              // entstand ein Mischzustand, und weil `istOffen` `.some(Boolean)`
              // ist, liess sich der Ast danach NIE wieder schliessen. Der
              // sichtbare Zustand `auf` geht mit, damit auch eine Zeile ohne
              // Eintrag in `tocBaum` (Start-offen per Modell) mit dem ersten
              // Klick zugeht.
              // W2·5m-LESER-V3 (Befund David 19.9.2026): `auf` ist das, was
              // WIRKLICH zu sehen ist (`zeilenAnsicht`). Vorher meldete eine
              // Zeile mit zugeklappter Artikel-Ebene `true` bei null Kindern,
              // und der erste Klick klappte sie zu; jetzt öffnet er sie ganz.
              onClick={() => onToggle(k.ids, auf)}
              // KONSTANTER, EINDEUTIGER Name (QS-UI Teilpass (e), 5.9.2026).
              // Vorher: `auf ? 'Einklappen' : 'Aufklappen'` — zwei Fehler in
              // einem, gemessen an /gesetze/bund/GEBV_HREG (11 Artikel):
              // (1) der Zustand stand DOPPELT — `aria-expanded` sagt ihn schon,
              //     der Name sagte ihn ein zweites Mal («Einklappen, erweitert»),
              //     und er WECHSELTE beim Klick: Sprachsteuerung zielt danach auf
              //     einen Namen, den es nicht mehr gibt;
              // (2) der Name benannte nicht, WAS er klappt — mehrere Knöpfe der
              //     Gliederung hiessen wortgleich «Aufklappen» und waren in der
              //     Knopf-Liste eines Screenreaders ununterscheidbar (WCAG 4.1.2).
              // Jetzt trägt der Name die Zeile, die er klappt; den Zustand trägt
              // allein `aria-expanded`. Bewacht von `ARIA_ZUSTANDSNAME`
              // (eslint.config.js).
              aria-expanded={auf}
              aria-label={`«${voll}»${klappNamenKontext ? ` (${klappNamenKontext})` : ''} auf- und zuklappen`}
              // F3/C5 (Design-Qualitäts-Pass 29.8.2026): ink-300 → ink-500.
              // Das Dreieck ist die EINZIGE Affordanz dieses Knopfes (kein
              // Rahmen, keine Fläche, 11 px). Gemessen gegen `--paper`:
              // ink-300 hell 2.28:1 / dunkel 2.34:1 — DESIGN-REGLEMENT F2
              // verlangt für Nicht-Text (UI-Komponenten, Icons) ≥ 3:1. Die
              // Haarlinien-Ausnahme des F2b-Nachtrags D-4 («ink-400/ink-300
              // sind Deko-Töne ohne 3:1-Anspruch») greift hier nicht: ein
              // Bedienelement ist keine Deko. ink-500 misst hell 5.10 /
              // dunkel 5.52 (well 4.83 / 5.79) — mit Abstand über der
              // Nicht-Text-Schwelle und zugleich über der TEXT-Schwelle
              // 4.5:1, was für eine Glyphe die ehrlichere Messlatte ist.
              // ink-400 (hell 3.13 auf `--well`) hätte 0.13 Reserve gehabt.
              // §5: dieselbe Stufe, die SprachUmschalter.tsx und die
              // Formular-Chevrons für dasselbe Zeichen längst setzen.
              // ── W2·18-FEHLERBUCH (David 15.9.2026) · DAS KLICKZIEL ──────
              // Vorzustand gemessen: 16 × 16 px, Glyphe in `text-micro`, kein
              // Druck-Feedback — unter der WCAG-2.2-Schwelle 2.5.8 (24 × 24),
              // die das Haus als `--tap-ziel` führt (index.css, Wächter
              // `src/tests/tap-ziel-token.test.ts`). Der Knopf holt sich jetzt
              // genau dieses Mass: 24 px breit (`w-6`), `min-h` aus dem Token
              // und `self-stretch`, damit er die ganze Zeilenhöhe mitnimmt.
              // KEIN negativer Margin und keine ::before-Fläche: beide würden
              // über die Nachbarzeilen bzw. über den Titel-Link greifen, und
              // ein Ziel, das Klicks des Nachbarn frisst, macht genau den
              // gemeldeten Eindruck schlimmer. Die Spalte wird stattdessen um
              // 8 px breiter — statisch für ALLE Zeilen, also kein CLS.
              // ZUSTANDSWECHSEL: der Chevron ROTIERT (ein Zeichen, 90°) statt
              // die Glyphe zu tauschen; die Bewegung ist im Augenwinkel
              // sichtbar, wo der Glyphentausch es nicht war.
              // `prefers-reduced-motion` ist global bedient (index.css setzt
              // alle transition-duration auf .001ms) — hier braucht es keine
              // zweite Regel (§5).
              className="shrink-0 self-stretch w-6 min-h-[var(--tap-ziel)] flex items-start justify-center pt-0.5 text-ink-500 hover:text-ink-900 active:text-ink-900 text-xs">
              <span aria-hidden className={`inline-block transition-transform ${auf ? 'rotate-90' : ''}`}>▸</span>
            </button>
          )
          : <span className="shrink-0 w-6" aria-hidden />}
        {/* F5-Positionsmarke (§3.5): 3-px-Registerstrich über die GANZE
            Zeilenhöhe (Haus-Mass seit D23), IMMER im Markup und im Ruhezustand
            transparent — der Wechsel der Leseposition bewegt nichts (§15.2).
            W2·29 S3: `reg-g` statt `brass-600` (Registerfarbe als Strich, F0.2;
            gegatet `reg-g`/paper · /paper-raised · /reg-g-flaeche). */}
        <span aria-hidden className={`w-[3px] shrink-0 self-stretch ${istMarke ? 'bg-reg-g' : 'bg-transparent'}`} />
        <TocZeile
          href={sprungZiel}
          // TASTATUR: `Enter` löst am Link `onClick` aus wie am Knopf; die
          // LEERTASTE tut es nicht (sie scrollt). Sie wird darum ausdrücklich
          // nachgereicht — niemand soll eine Bedienung verlieren, die er hatte.
          onKeyDown={sprungZiel ? (ev) => {
            if (ev.key !== ' ') return;
            ev.preventDefault();
            ev.currentTarget.click();
          } : undefined}
          // H2 (David 16.8.2026): ein Klick auf den TITEL klappt den Ast auf UND
          // springt — «erst beim zweiten Klick» waren zwei Ziele für eine
          // Absicht. NUR AUFKLAPPEN, NIE ZUKLAPPEN: sonst verschwände genau der
          // Abschnitt, zu dem er eben gesprungen ist; Zuklappen bleibt beim Pfeil.
          aria-expanded={hatKinder ? auf : undefined}
          onClick={(ev) => {
            // Modifikator-/Mittelklick gehört dem Browser (neuer Reiter, neues
            // Fenster) — nur der schlichte Linksklick ist der Sprung.
            if (sprungZiel && !istSchlichterKlick(ev)) return;
            ev.preventDefault();
            // W2·10-UI-NAV/R5: die verlassene Leseposition VOR dem Sprung
            // vormerken — der TOC-Sprung erzeugt bewusst keinen History-Eintrag
            // (LM-202), ohne diese Notiz gäbe es keinen Rückweg.
            merkeRuecksprungVonDom();
            if (hatKinder && !auf) onToggle(k.ids, auf);
            if (k.art === 'sektion') onSprung(k.ids);
            else if (k.ersterArtikel) onSprungArtikel(k.ersterArtikel);
          }}
          // F5: GENAU EINE Zeile trägt die Marke — der tiefste aktive Knoten.
          // Bis S4 trugen alle bis zu sechs Vorfahren `aria-current="true"`; ein
          // Screenreader meldete damit sechs gleichzeitige Standorte, was
          // schlicht falsch war (§8). `location` statt `true`, weil es genau das
          // ist: die Stelle im Dokument, an der der Leser steht.
          data-toc-aktiv={istMarke ? '1' : undefined}
          aria-current={istMarke ? 'location' : undefined}
          title={voll}
          aria-label={voll}
          // Gliederung ist NAVIGATION: kein Unterstrich (die P3-Regel in
          // `index.css` unterstreicht Textlinks — die Ausnahme steht im Markup).
          // W2·29 S3: die Marken-Zeile trägt die Registerfläche `reg-g-flaeche`
          // (vorher `brass-100`, W2·18-FEHLERBUCH); Hover `.lc-hover-flaeche`
          // wie im Artikel-Index (§5). Gedämpfte Zusätze darin hebt index.css
          // (`[data-toc-aktiv] .text-ink-500`) auf ink-600 — ink-500 misst auf
          // der Fläche 4.22:1. Kein Radius (F0.5).
          className={`flex-1 min-w-0 text-left no-underline px-1.5 py-0.5 leading-snug transition-colors ${form} ${tinte} ${istMarke ? 'bg-reg-g-flaeche' : 'hover:text-ink-900 lc-hover-flaeche'}`}>
          {/* line-clamp-2 (§3.3): Labels bis 280 Zeichen sind belegt — ohne
              Klammer wuchs eine einzige Zeile auf sechs und schob den ganzen
              Baum. Der volle Text bleibt über title/aria-label erreichbar.
              `[overflow-wrap:anywhere]` (Zusatzpunkt David 9.8.2026): ein
              langes, leerzeichenloses Etikett (Anhang-Ziffern, SR-Nummern)
              würde sonst trotz line-clamp die Zeile — und damit den
              [data-toc]-Scroller — horizontal aufreissen statt umzubrechen. */}
          <span className="line-clamp-2 [overflow-wrap:anywhere]">
            {/* Artikel-Zeile (W2·18-FEHLERBUCH): Etikett und Sachtitel in zwei
                Stimmen, wortgleich mit dem flachen Artikel-Index. Der
                `romanFrei`-Weg der Sektionszeilen taugt hier NICHT: er spaltet
                am ersten Doppelpunkt («Erster Titel: …»), und ein Sachtitel
                darf einen Doppelpunkt enthalten — die Zeile hätte dann einen
                erfundenen Enumerator-Vorsatz gezeigt (§8). */}
            {k.art === 'artikel'
              ? (
                <>
                  <span className="num font-medium text-ink-800">{k.labelKette[0]}</span>
                  {k.sachtitel && <span className="text-ink-600"> — {margLabel(k.sachtitel)}</span>}
                </>
              )
              : pre ? <><span className={stimme.pre}>{pre}:</span> {margLabel(rest)}</> : margLabel(k.labelKette[k.labelKette.length - 1])}
            {/* Verdichtete Einzelkind-Kette: die übersprungenen Stufen stehen
                sichtbar davor, sonst behauptete die Zeile eine Ebene, die es
                nicht gibt. Gedämpft, damit der Sachtitel führt. */}
            {k.labelKette.length > 1 && (
              // B5 (Bug-Check 9.8.2026): `text-ink-400` misst hell 3.30:1 gegen
              // `paper` und reisst damit WCAG AA für Text (4.5:1). ink-500 ist
              // der nächste tor-geprüfte Ton, der die Dämpfung behält.
              <span className="text-ink-500"> ({k.labelKette.slice(0, -1).join(' › ')})</span>
            )}
          </span>
          {/* Aufgehoben-Signal (§3.3, Inventar C «heute klappt man blind auf»):
              sichtbarer Text, nicht nur `title`. Statisch je Knoten ⇒ kein CLS. */}
          {/* B5: s. o. — auch dieser Zusatz ist TEXT und braucht 4.5:1. */}
          {k.aufgehoben && <span className="ml-1 text-micro text-ink-500">aufgehoben</span>}
        </TocZeile>
        {/* Hier stand bis zum 9.8.2026 der adaptive Zählwert — gestrichen auf
            Entscheid David («keine relevante Information»), Herleitung oben. */}
      </div>
      {/* ── F3, zweite Hälfte (S5): zugeklappte Äste werden UNMOUNTET ──────────
          Bis S4 blieben sie gemountet und wurden nur per `grid-rows-[0fr]` auf
          Höhe 0 geklemmt. Gemessen (Perf-Diagnose 8.8.2026, U3): 11 075
          dauerhaft gemountete Knoten beim OR, Klick-Latenz @4× 231 ms gegen
          33 ms beim BGFA. Ein Baum, dessen zugeklappte Teile nicht existieren,
          kostet nur noch den offenen Pfad.
          §15-Abgrenzung: der Baum ist KEIN Normtext. Das Virtualisierungsverbot
          schützt die Lesespalte (Anker, Ctrl+F, Druck, Screenreader-Vollzugriff
          auf den amtlichen Text) — die Gliederung ist ein Verzeichnis, und der
          zugeklappte Ast ist auch für den Nutzer nicht da.
          Die 7.8.-Lehre (`invisible` am zugeklappten Ast, weil die Kind-Knöpfe
          sonst fokussierbar und Playwright-klickbar blieben, obwohl unsichtbar)
          wird damit GEGENSTANDSLOS und ist entfernt: was nicht im DOM ist, liegt
          weder in der Tab-Reihenfolge noch im a11y-Baum noch im Hit-Testing.
          `e2e/leser-ruecksprung-r5-r7.ts` bewacht genau das weiterhin
          («kein unsichtbarer Gliederungs-Knopf in der Tab-Reihenfolge»).
          §15.2: weiterhin KEINE Höhen-Animation — eine animierte Höhenänderung
          reflowt Frame für Frame die Geschwister und zählt, wenn der Spy sie
          auslöst, als unerwarteter CLS. Das Umschalten bleibt ein Schritt. */}
      {sichtbareKinder.length > 0 && (
        <div className="grid grid-rows-[1fr]">
          <div className="overflow-hidden min-h-0">
            <ul className="space-y-0.5 mt-0.5">
              {sichtbareKinder.map((kind, i) => (
                <Zeile key={kind.id} k={kind} erster={i === 0}
                  aktivPfad={aktivPfad} markeId={markeId} klappKontext={klappKontext} offen={offen}
                  startOffeneTiefe={startOffeneTiefe}
                  onToggle={onToggle} onSprung={onSprung} onSprungArtikel={onSprungArtikel} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
});

/**
 * Gliederungsbaum. `React.memo` (Default-Komparator) — der Baum re-renderte
 * sonst bei JEDER Scroll-Spy-Aktualisierung des Parents mit. Props sind
 * referenzstabil: `knoten` (useMemo über das Modell), `offen`/`aktivPfad`
 * (State), Callbacks (useCallback).
 */
export const SektionBaumTOC = memo(function SektionBaumTOC({
  knoten, aktivPfad, aktivToken, offen, startOffeneTiefe, onToggle, onSprung, onSprungArtikel,
}: {
  knoten: GliederungsKnoten[];
  aktivPfad: string[]; // Sektions-Ids des aktiven Pfads, Wurzel → tiefster Knoten
  /**
   * Token des gerade gelesenen Artikels (F2 des §9-Bug-Checks 13.8.2026) — die
   * Marke landet damit auf der ARTIKEL-Zeile, wenn diese sichtbar ist. Der
   * flache Artikel-Index tut das seit S9 (parts/ArtikelIndex.tsx); der Baum
   * konnte es nicht, weil der Aktiv-Pfad nur Sektions-Ids kennt.
   */
  aktivToken?: string | null;
  offen: Record<string, boolean>;
  startOffeneTiefe: number;
  onToggle: (ids: string[], istOffen: boolean) => void;
  onSprung: (ids: string[]) => void;
  onSprungArtikel: (token: string) => void;
}) {
  // Genau EINE Marke je gerendertem Baum — die Invariante, auf die sich a9
  // (`[data-toc] [data-toc-aktiv]` als Sprungziel) und a33 (Ruhe-Messung)
  // stützen: nie mehr als eine, und solange der Spy überhaupt einen Pfad im
  // Baum meldet, auch nie weniger (s. findeMarke).
  const markeId = findeMarke(knoten, aktivPfad, offen, startOffeneTiefe, aktivToken);
  // QS-UI-Nachzug (5.9.2026): EINE Berechnung je Baum, an `knoten` (der
  // referenzstabilen Modell-Liste, s. Kommentar oben) gebunden — nicht bei
  // jedem Scroll-Spy-Rerender, nur wenn sich der Baum selbst ändert.
  const klappKontext = useMemo(() => berechneKlappKontext(knoten), [knoten]);
  return (
    <ul className="space-y-0.5">
      {knoten.map((k, i) => (
        <Zeile key={k.id} k={k} erster={i === 0}
          aktivPfad={aktivPfad} markeId={markeId} klappKontext={klappKontext} offen={offen}
          startOffeneTiefe={startOffeneTiefe}
          onToggle={onToggle} onSprung={onSprung} onSprungArtikel={onSprungArtikel} />
      ))}
    </ul>
  );
});
