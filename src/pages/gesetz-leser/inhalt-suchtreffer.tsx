import {
  useCallback, useEffect, useMemo, useRef, useState,
  type Dispatch, type RefObject, type SetStateAction,
} from 'react';
import type { InternRefs } from '../../components/NormText';
import type { Sektion, StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';
import {
  setzeSuchHighlight, sammleTrefferRanges, setzeSuchHighlightRanges, neueHighlightInstanz,
} from './suchHighlight';
import { loeseArtikelEingabe, pfadLabels } from './suchTreffer';
import { pfadZu } from './helpers';
import { paneRoot } from './berechnungen';
import {
  baueLeserSuchIndex, sucheImErlass, zaehleTreffer, fundstellenFolge, artikelFundstellen,
  type SuchBereich,
} from './leserSuche';

// ═══ ABSCHNITT · In-Gesetz-Suche: Treffer, Hervorhebung, Quickjump ═══════════
//
// Ursprung: §6.6-Split (QS-TOK/T14) — A35 (Highlight), W2·10-UI-NAV/R1
// (Fundstellen-Zähler + Vor/Zurück) und R2 (Quickjump «Art. N» + «Sie sind
// hier»). Keine Rechtsregel, kein Normtext (§3).
//
// ─── W2·19-GLIEDERUNG/S8 · was sich hier ändert und warum ────────────────────
// Bau-Spec fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md §4; Entscheid David (c)
// vom 8.8.2026: die Trefferliste zieht mit Textausschnitten in die Seitenleiste,
// die Lesespalte bleibt VOLLSTÄNDIG und springt.
//
// 1 · TREFFER KOMMEN AUS DEN DATEN, nicht mehr aus einer Filterzeile. Bis S8
//     war die Trefferliste `eintraege.filter(passtAufSuche)` — eine Regel, die
//     nur `artikelLabel` und `bloecke[].text`/`items[].text` las. `leserSuche.ts`
//     durchsucht alle sechs Feldklassen und liefert Reihenfolge, Zahlen,
//     Ausschnitte und Herkunft fertig; hier wird nichts nachgerechnet (§5).
//
// 2 · DER TREEWALKER LÄUFT NIE MEHR ÜBER DAS GANZE DOKUMENT (§4.5, Bericht 2).
//     Er sammelte bisher die Ranges der ganzen Trefferliste in einem Zug. Da die
//     Lesespalte jetzt vollständig bleibt, wäre das beim OR ein Lauf über 1686
//     Artikel — je Such-Ruhephase. Stattdessen treibt ein IntersectionObserver:
//     gemalt wird artikelweise, für Artikel im (grosszügig gefassten) Sichtband
//     und für das Sprungziel. Was nie im Blick war, kostet nichts.
//
// 3 · DER ZÄHLER IST DATENSEITIG (§4.4 Ziff. 1). Der alte Vertrag «gemeldete
//     Zahl == DOM-sichtbare Fundstellen» ist mit Feldern, die nie gemalt werden
//     (Gliederungspfad, Bild-Alt) oder per CSS-Toggle unsichtbar sind,
//     strukturell unhaltbar. Neu gilt: der Kopf-Zähler zählt den ERLASS, die
//     Hervorhebung malt den SICHTBAREN DOM, und «gemalte ≤ gezählte» ist
//     konstruktiv wahr — jeder malbare Baustein steht auch im Index
//     (`leserSuche.ts`, `Malbarkeit`). Die Ehrlichkeitslücke wird nicht
//     versteckt, sondern benannt: jeder Nicht-Fliesstext-Treffer trägt einen
//     Herkunfts-Badge, bei ausgeschaltetem Apparat mit dem Zusatz
//     «(ausgeblendet)» (§8) — statt dass der Sprung die Ansicht still umschaltet.

export function useSuchTreffer({
  erlassKey, eintraege, struktur, sucheTrim, sucheFeldLeer, sektionen, aktivIds,
  internRefs, aktArtikel, tokenByLabel, offen, setOffen, imPane, wurzel,
  bereich = 'alles', markenAus = false,
}: {
  /** Erlass-Schlüssel = Cache-Identität des Index (§4.1: EIN Eintrag je Pane). */
  erlassKey: string | null;
  eintraege: NormSnapshot[] | null;
  struktur: StrukturMap | null;
  sucheTrim: string;
  sucheFeldLeer: boolean;
  sektionen: Sektion[];
  aktivIds: string[];
  internRefs: InternRefs | undefined;
  aktArtikel: string | null;
  tokenByLabel: Map<string, string>;
  /** Klapp-Zustand der LESESPALTE (B3/B4): welche Sektionen aufgeklappt sind.
   *  Der Sprung braucht `setOffen`, um ein Ziel in einem zugeklappten Ast
   *  überhaupt erreichbar zu machen; der Markierungs-Beobachter braucht `offen`
   *  in seinen Deps, weil ein Aufklapp neue Artikel ins DOM bringt, die er sonst
   *  nie beobachtet. Es ist derselbe Zustand, den der Reader ohnehin führt — kein
   *  zweiter (§5). */
  offen: Record<string, boolean>;
  setOffen: Dispatch<SetStateAction<Record<string, boolean>>>;
  /** B7: im Split-View scrollt der PANE-Container, nicht das Fenster. Ohne
   *  `root` misst der Beobachter gegen den Viewport, und sein 300-px-Vorlauf
   *  greift dort ins Leere — die Markierung liefe dem Leser sichtbar hinterher. */
  imPane: boolean;
  wurzel: RefObject<HTMLElement | null> | null;
  /** H2 · Suchbereich (Kap. 4b, Pos. 5). Ungesetzt = `alles`, also exakt das
   *  Verhalten vor H2 — die Ist-Huelle reicht ihn nicht durch und aendert sich
   *  dadurch nicht (FL-4). */
  bereich?: SuchBereich;
  /** W2·28 · L-2 — der Leser hat Hervorhebung UND Treffer-Marken weggeschaltet.
   *
   *  Er greift HIER und nicht per CSS, und das ist kein Stil-Entscheid: die
   *  Highlight-Registry (`CSS.highlights`) ist dokument-global, eine
   *  Abschalt-Regel über einen Vorfahren-Selektor wäre im Split-View eine
   *  Aussage über beide Panes. An der Quelle abgeschaltet gilt der Schalter
   *  genau für DIESE Leser-Instanz — dieselbe Grenze, die `highlightInstanz`
   *  seit A35 zieht. Zähler, Trefferliste und ↑↓-Folge bleiben unberührt: der
   *  Schalter nimmt die FARBE, nicht die Auskunft (§8). */
  markenAus?: boolean;
}) {
  // Wurzel der Lesespalte — der Bereich, in dem Artikel gemalt werden. Bis S8
  // zeigte dieser Ref auf den (gefilterten) Trefferblock; seit die Lesespalte
  // vollständig bleibt, ist es die Lesespalte selbst.
  const leseRef = useRef<HTMLDivElement | null>(null);

  // ─── QS-UI-HIGHLIGHT: EINE Registry-Identität je Leser-Instanz ─────────────
  // Der Hook läuft je Pane einmal; diese Identität ist damit genau die
  // «Registry je Leser-Instanz», die der Roadmap-Schritt verlangt. Sie steckt
  // in `useState` mit LAZY-Initialisierer, weil nur der eine über die ganze
  // Lebensdauer der Instanz stabile Wert zusagt — ein `useMemo` darf React
  // verwerfen, und ein neu gezogenes Symbol hiesse: die alte Buchungszeile
  // bliebe stehen und die Markierung des eigenen Panes doppelte sich.
  // Der Setter wird nie gerufen; das Symbol ist von Geburt an unveränderlich.
  const [highlightInstanz] = useState(() => neueHighlightInstanz('gesetz-leser'));

  // ─── Ansicht-Schalter beobachten ───────────────────────────────────────────
  // Die Toggles sind BEWUSST reine CSS-/Attribut-Schalter am <html>
  // («KEIN Artikel-Re-Render», leserOptionen.ts) — sie in React-State zu ziehen
  // würde genau diese §15-Zusage aufgeben (der OR-Reader reconciliert sonst
  // 1686 Artikel je Toggle). Ein MutationObserver liest sie darum ab, statt sie
  // zu besitzen. Er treibt zwei Dinge: die Badge-Ehrlichkeit (`aenderungenAus`)
  // und ein Neu-Sammeln der gemalten Ranges (`ansichtTick`), weil sich mit
  // jedem Toggle ändert, was überhaupt malbar ist (RV6, 4.8.2026).
  //
  // D35-F3 (7.9.2026): die zwei Attribute `data-fussnoten`/`data-histansicht`
  // sind zu EINEM `data-vermerke` geworden, und die Badge-Frage lautet damit
  // nicht mehr «ist der Apparat aus?» (den Zustand gibt es nicht mehr), sondern
  // «sind die ÄNDERUNGS-Fussnoten gedämpft?» — wahr in «fassung» und in «aus».
  // Der Vorgabe-Zustand ist «fassung», also startet das Feld auf `true`; stünde
  // hier weiter `false`, zeigte die Trefferliste bis zur ersten Mutation eine
  // Badge ohne den Zusatz «(ausgeblendet)» für eine Stelle, die nicht leuchtet
  // (§8). Beim Prerender/Hydrieren steht das Attribut noch nicht — `undefined`
  // ist ungleich `'fussnoten'`, der Startwert stimmt also auch dort.
  const [aenderungenAus, setAenderungenAus] = useState(true);
  const [ansichtTick, setAnsichtTick] = useState(0);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const lies = () => setAenderungenAus(document.documentElement.dataset.vermerke !== 'fussnoten');
    lies();
    const beob = new MutationObserver(() => { lies(); setAnsichtTick((n) => n + 1); });
    beob.observe(document.documentElement, {
      attributes: true,
      // S1: `data-verweise` ist entfallen (der Schalter ist gestrichen). D35-F3:
      // `data-fussnoten`/`data-histansicht` sind in `data-vermerke` aufgegangen.
      attributeFilter: ['data-vermerke', 'data-leitfaelle'],
    });
    return () => beob.disconnect();
  }, []);

  // ─── Index + Treffer (§4.1/§4.2) ───────────────────────────────────────────
  const sucheAktiv = sucheTrim !== '';
  // CACHE-GRENZE (§4.1, [W:jurist]): `useMemo` hält je Pane GENAU EINEN Index.
  // Er entsteht LAZY — erst wenn wirklich gesucht wird, nicht beim Laden des
  // Erlasses — und wird beim Erlasswechsel wie beim Pane-Unmount mit dem Memo
  // freigegeben. Split-View OR+ZGB hält damit höchstens zwei Sätze, nie mehr.
  // Kosten, gemessen (Node, ungedrosselt): OR 1686 Artikel → 15 993 Segmente,
  // Aufbau 3.7 ms, Suche 2.2 ms; ZGB 4.8/1.1 ms. Ein Neuaufbau nach dem
  // Verlassen der Suche ist damit billiger als eine Ref-Buchhaltung, die den
  // Index über den Erlasswechsel hinweg am Leben hielte.
  const index = useMemo(
    () => (sucheAktiv && erlassKey && eintraege ? baueLeserSuchIndex(erlassKey, eintraege, struktur) : null),
    [sucheAktiv, erlassKey, eintraege, struktur],
  );
  const treffer = useMemo(() => sucheImErlass(index, sucheTrim, bereich), [index, sucheTrim, bereich]);
  const { artikel: artikelAnzahl, fundstellen } = useMemo(() => zaehleTreffer(treffer), [treffer]);
  // B5: der Ansicht-Schalter gehört IN die Folge, nicht daneben — bei
  // ausgeblendetem Apparat sind Fussnoten-Stellen nicht malbar, und ein Rang,
  // der sie mitzählte, verschöbe den Sprung um genau sie (Herleitung dort).
  const folge = useMemo(() => fundstellenFolge(treffer, aenderungenAus), [treffer, aenderungenAus]);

  // ─── Artikelweise Hervorhebung, IntersectionObserver-getrieben (§4.5) ──────
  // Die Ranges werden je Artikel gehalten und zur EINEN Highlight-Menge
  // vereinigt. `sammleTrefferRanges` bleibt die einzige Treffer-Semantik des
  // DOM (§5): dieselbe Funktion malt, dieselbe Funktion misst den Sprung.
  const rangesRef = useRef<Map<string, Range[]>>(new Map());
  /** Vereinigt die je Artikel gehaltenen Ranges zur EINEN Highlight-Menge. */
  const male = useCallback(() => {
    // W2·28/L-2: weggeschaltet wird NICHT gemalt — auch nicht aus
    // `zeigeFundstelle` heraus. Ohne diese Zeile hätte der Sprung die
    // Hervorhebung am Zielartikel wieder angezündet, und der Schalter hätte für
    // genau den Artikel nicht gegolten, den man gerade ansieht (§8). Der Sprung
    // selbst bleibt unverändert.
    if (markenAus) return;
    const alle: Range[] = [];
    for (const rs of rangesRef.current.values()) alle.push(...rs);
    setzeSuchHighlightRanges(alle, highlightInstanz);
  }, [highlightInstanz, markenAus]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // `leseWurzel` statt `wurzel`: seit B7 trägt die Prop `wurzel` den
    // PANE-Container. Zwei verschiedene Wurzeln unter einem Namen wären genau
    // die Verwechslung, die B7 überhaupt erst erzeugt hat.
    const leseWurzel = leseRef.current;
    rangesRef.current = new Map();
    // `markenAus` steht hier im selben Zweig wie «keine Suche»: der Effekt
    // räumt die Registry und hängt gar keinen Beobachter ein — weggeschaltet
    // kostet die Hervorhebung damit nichts, statt unsichtbar weiterzulaufen.
    if (!sucheAktiv || markenAus || !leseWurzel || typeof IntersectionObserver === 'undefined') {
      setzeSuchHighlight(null, '', highlightInstanz);
      return;
    }
    const beob = new IntersectionObserver((eintraegeIo) => {
      let geaendert = false;
      for (const e of eintraegeIo) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) {
          rangesRef.current.set(el.id, sammleTrefferRanges(el, sucheTrim));
          geaendert = true;
        } else if (rangesRef.current.delete(el.id)) {
          geaendert = true;
        }
      }
      if (geaendert) male();
    }, {
      // B7 (Bug-Check §9 zu S8): der Scroll-Container DIESES Panes ist die
      // Bezugsfläche — im Split-View scrollt nicht das Fenster (B-2.5, Muster
      // inhalt-hooks.tsx). Ohne `root` mass der Beobachter gegen den Viewport,
      // und der Vorlauf unten griff im Pane ins Leere. `null` = Fenster, also
      // in der Einzelansicht unverändert.
      root: paneRoot(imPane, wurzel),
      // Vorlauf über das Sichtband hinaus: wer scrollt, sieht die Markierung
      // bereits stehen, statt sie einlaufen zu sehen. Rein visuell — es wird
      // kein Knoten erzeugt oder bewegt (CLS 0, §15/2).
      rootMargin: '300px 0px',
    });
    for (const art of leseWurzel.querySelectorAll('article[id^="art-"]')) beob.observe(art);
    return () => {
      beob.disconnect();
      rangesRef.current = new Map();
      setzeSuchHighlight(null, '', highlightInstanz);
    };
    // `ansichtTick`: ein Ansicht-Toggle ändert die MALBARKEIT (Fussnoten-Apparat
    // display:none) — die Ranges müssen dann neu entstehen (RV6).
    // `offen` (B4, Bug-Check §9 zu S8): ein Auf-/Zuklapp im Fliesstext ÄNDERT DIE
    // ARTIKELMENGE im DOM. Ohne diese Dep beobachtete der Observer nur die beim
    // Effekt-Lauf vorhandenen Artikel; alles, was danach aufgeklappt wurde, blieb
    // unmarkiert — der Leser sah einen Treffer-Artikel ohne eine einzige
    // leuchtende Stelle (§8). Der Scroll-Spy führt `offen` aus genau diesem Grund
    // schon in seiner Liste (inhalt-hooks.tsx).
  }, [sucheAktiv, sucheTrim, ansichtTick, eintraege, offen, imPane, wurzel, male, highlightInstanz, markenAus]);

  // ─── ↑↓-Navigation über die Fundstellen (§4.3) ─────────────────────────────
  // Position = 0-basierter Rang in der FLACHEN, datenseitigen Fundstellen-Folge.
  // Der Sprung führt zum Artikel und — wo die Fundstelle malbar ist — zur
  // entsprechenden Stelle darin. Ist sie es nicht (Gliederungspfad, Bild-Alt,
  // ausgeblendeter Apparat), bleibt es beim Artikel; der Badge in der Liste hat
  // vorher gesagt, warum (§8). Nie wird ein Sprung an eine erfundene Stelle
  // behauptet.
  // `begriff` ist der Gültigkeits-Schlüssel des Navigations-Zustands: die
  // Laufnummer eines FRÜHEREN Begriffs wird beim Render verworfen, statt sie in
  // einem Effekt zurückzusetzen (kein Kaskaden-Render, react-hooks/set-state-
  // in-effect). Damit kann nie eine Position zum falschen Begriff stehenbleiben
  // (§8) — dasselbe Muster, mit dem bis S8 die gemessene Fundstellenzahl
  // gültig gehalten wurde.
  const [nav, setNav] = useState<{ begriff: string; pos: number; token: string | null }>(
    { begriff: '', pos: -1, token: null });
  const gueltig = nav.begriff === sucheTrim;
  const trefferPos = gueltig ? nav.pos : -1;
  const aktivToken = gueltig ? nav.token : null;

  // Puls am Ziel-Artikel: Element UND Timer-Handle zusammen halten (Bug-Check §9
  // vom 4.8.2026, B6a). Beim Unmount wird der Timer abbestellt, sonst liefe der
  // Callback nach dem Erlass-/Pane-Wechsel gegen ein abgehängtes Element. Das
  // Element muss mitgeführt werden, weil ein schneller Folge-Klick den alten
  // Timer verwirft — ohne diese Referenz bliebe die Puls-Klasse am vorherigen
  // Artikel für immer stehen.
  const blink = useRef<{ el: HTMLElement; id: number } | null>(null);
  const blinkAus = useCallback(() => {
    const b = blink.current;
    if (!b) return;
    window.clearTimeout(b.id);
    b.el.classList.remove('lc-ziel-blink');
    blink.current = null;
  }, []);
  useEffect(() => blinkAus, [blinkAus]);

  /** Scrollt zur n-ten Fundstelle der Folge und markiert ihren Artikel. */
  const zeigeFundstelle = useCallback((n: number) => {
    const eintrag = folge[n];
    if (!eintrag || typeof window === 'undefined') return;
    // B3 (Bug-Check §9 zu S8): den FORTSCHRITT festhalten, BEVOR ein Ausstieg
    // möglich ist. Bis hierher stand `setNav` HINTER der DOM-Suche — lag der
    // Zielartikel in einer zugeklappten Sektion, blieb `nav.pos` stehen, und
    // jeder weitere ↑↓-Druck berechnete daraus dieselbe Position: die Folge kam
    // nicht vom Fleck, der Klick blieb ohne jede Rückmeldung (§8).
    setNav({ begriff: sucheTrim, pos: n, token: eintrag.token });
    const id = `art-${eintrag.token}`;
    // CSS.escape: ein Artikel-Token mit Sonderzeichen (belegt: «22 a», «36–42»)
    // darf den Selektor nicht sprengen — dieselbe Vorsicht wie `findeArt`.
    const finde = () => (leseRef.current ?? document).querySelector<HTMLElement>(
      `#${typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id}`);
    const zeige = (art: HTMLElement) => {
      // Frisch sammeln (nicht aus `rangesRef` recyceln): Ranges hängen an
      // konkreten Text-Knoten, und zwischen zwei Klicks kann der Reader
      // Teilbäume neu gerendert haben (Bezugs-/Historie-Shard läuft nach). Der
      // Lauf kostet genau EINEN Artikel.
      //
      // `ranges[malRang]` ist die Zuordnung Fundstelle → gemalte Stelle. B5
      // (Bug-Check §9 zu S8): hier stand `ranges[rang]`, also der DATENSEITIGE
      // Rang — der deckt sich mit dem malbaren nur, wenn JEDE Fundstelle des
      // Artikels malbar ist. Der frühere Kommentar nannte das den «Regelfall»;
      // im OR trifft es 235+ Artikel nicht zu. Den malbaren Rang führt jetzt die
      // Folge selbst mit (`malRang`, leserSuche.ts) — dort und nur dort (§5).
      // Ist die Fundstelle NICHT malbar (Gliederungspfad, Bild-Alt,
      // ausgeblendeter Apparat), ist `malRang` null: dann bleibt es beim
      // Artikel, statt eine Stelle zu behaupten (§8).
      const ranges = sammleTrefferRanges(art, sucheTrim);
      // Das SPRUNGZIEL wird immer gemalt (§4.5) — unabhängig davon, ob der
      // IntersectionObserver es schon gemeldet hat. Ohne diesen Schritt landete
      // man auf einer Fundstelle, die erst im nächsten Beobachter-Zyklus
      // aufleuchtet; bei einem Ziel ausserhalb des bisherigen Sichtbands wäre
      // das sichtbar zu spät.
      rangesRef.current.set(art.id, ranges);
      male();
      const start = eintrag.malRang === null ? undefined : ranges[eintrag.malRang]?.startContainer;
      const el = (start
        ? (start.nodeType === 1 ? start as Element : start.parentElement) as HTMLElement | null
        : art);
      el?.scrollIntoView({ block: 'center', behavior: 'auto' });
      blinkAus();
      art.classList.add('lc-ziel-blink');
      blink.current = { el: art, id: window.setTimeout(() => blinkAus(), 2400) };
    };
    const da = finde();
    if (da) { zeige(da); return; }
    // ZIEL IN EINER ZUGEKLAPPTEN SEKTION (B3, zweite Hälfte). Die Lesespalte
    // bleibt seit S8 vollständig, aber sie bleibt auch klappbar — ein
    // Sektionskopf-Klick genügt, und der Zielartikel ist nicht im DOM. Der
    // Artikel-Sprung (`springeZuArtikel`, inhalt.tsx) öffnet seine Vorfahren
    // seit je selbst; dieser Pfad tat es nicht und war damit für einen Teil
    // seiner EIGENEN Trefferliste tot. Dieselbe Mechanik, dieselbe Quelle:
    // `pfadZu` über die Sektionen, dann `setOffen` — hier wird nichts
    // zweitmalig zugeordnet (§5).
    const pfad = pfadZu(sektionen, (s) => s.artikel.some((e) => e.artikel === eintrag.token)) ?? [];
    if (!pfad.length) return;
    setOffen((o) => { const naechst = { ...o }; for (const sid of pfad) naechst[sid] = true; return naechst; });
    // Der Artikel entsteht erst im Commit des Aufklapps. Zwei Frames später
    // steht er samt Layout — dieselbe Zweistufigkeit wie beim Sektions-Sprung
    // (inhalt-sprung.tsx). Erst dann darf gemessen und gescrollt werden.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const el = finde();
      if (el) zeige(el);
    }));
  }, [blinkAus, folge, male, sucheTrim, sektionen, setOffen]);

  const springeZuFundstelle = useCallback((delta: number) => {
    const len = folge.length;
    if (len === 0) return;
    // Noch keine aktive Fundstelle: «weiter» beginnt bei der ersten, «zurück»
    // bei der letzten (Basis 0 bzw. -1, dann modulo).
    const basis = trefferPos < 0 ? (delta > 0 ? -1 : 0) : trefferPos;
    zeigeFundstelle(((basis + delta) % len + len) % len);
  }, [folge, trefferPos, zeigeFundstelle]);

  /** Klick auf einen Treffer-Eintrag: zur ERSTEN Fundstelle dieses Artikels. */
  const springeZuTreffer = useCallback((token: string) => {
    const n = folge.findIndex((f) => f.token === token);
    if (n >= 0) zeigeFundstelle(n);
  }, [folge, zeigeFundstelle]);

  /**
   * H2 · Klick auf EINE Fundstellen-Zeile der V3-Liste: zu genau dieser Stelle.
   *
   * Adressiert wird ueber (Artikel, Rang) statt ueber den flachen Folge-Index —
   * die Liste kennt den Artikel und den Rang darin, den flachen Index kennt nur
   * die Folge. Die Aufloesung passiert hier, damit die Liste keine zweite
   * Zaehlung fuehren muss (§5). Kein Treffer in der Folge (Rang gefiltert
   * weggefallen) ⇒ es passiert nichts, statt irgendwohin zu springen (§8).
   */
  const springeZuStelle = useCallback((token: string, rang: number) => {
    const n = folge.findIndex((f) => f.token === token && f.rang === rang);
    if (n >= 0) zeigeFundstelle(n);
  }, [folge, zeigeFundstelle]);

  // ═══ ABSCHNITT · R2 · Quickjump «Art. N» + «Sie sind hier» ═══════════════════
  // Quickjump: KEIN Index, KEIN Server — die Eingabe wird gegen die bereits
  // geladene Token-Map des Erlasses aufgelöst (dieselbe, die Querverweise im
  // Wortlaut auflöst, §5). Kein Treffer ⇒ null, und das Feld sagt es (§8).
  const loeseArtikel = useCallback(
    (eingabe: string) => (internRefs ? loeseArtikelEingabe(eingabe, internRefs.tokenMap) : null),
    [internRefs],
  );
  // «Sie sind hier»: reine Projektion des SCHON vorhandenen Scroll-Spy-Zustands
  // (aktivIds) auf die Gliederungs-Labels — keine zusätzliche Beobachtung (§15).
  const siePfad = useMemo(() => pfadLabels(sektionen, aktivIds), [sektionen, aktivIds]);
  // Fremdfund-Fix aus dem §9-Bug-Check (B5, echter main-Defekt seit #429): hier
  // wurde ein LABEL in der TOKEN-Map nachgeschlagen (`artLabelByToken` ist
  // token→label, `inhalt-hooks.tsx` setzt in `aktArtikel` aber bereits das
  // fertige Label). Der Lookup ging darum IMMER ins Leere, `siePfadArtikel` war
  // dauerhaft null und die Artikel-Angabe in «Sie sind hier» fehlte still — der
  // Gliederungspfad allein füllte die Zeile, also fiel es nicht auf.
  // `aktArtikel` IST das Anzeige-Label; die Umkehrkarte dient nur noch als
  // Echtheitsprüfung: benannt wird ausschliesslich ein Label, das auf einen
  // realen Artikel dieses Erlasses auflöst (§8).
  const siePfadArtikel = aktArtikel && tokenByLabel.has(aktArtikel) ? aktArtikel : null;

  // A35-Sofort-Aufräumer (Befund 20.7.2026, Shard 3/3). Das Löschen der
  // Highlight-Registry hing ursprünglich AUSSCHLIESSLICH am Effekt oben — und
  // der läuft erst, wenn `sucheTrim` über den ENTPRELLTEN Wert kippt. Bis S8 war
  // genau dieser Commit der teuerste des Readers (der volle Volltext-Baum kam
  // zurück: OR 1686 Artikel neu gemountet), gemessen ~2,4 s ohne Drossel bis
  // 21,9 s bei 8× — und der Nutzer sah die Markierung sekundenlang
  // weiterleuchten, obwohl das Suchfeld leer war (§8: die Anzeige lügt über den
  // Zustand). Seit S8 fällt dieser Remount weg (die Lesespalte bleibt stehen),
  // die Entprellung bleibt aber: das Aufräumen hängt darum weiterhin am ROHEN
  // Feldwert, nicht am entprellten — es ist der billige und sofort wirksame
  // Pfad, und er deckt JEDEN Ausstieg aus dem Suchmodus ab (Feld leeren,
  // Erlass-/Pane-Wechsel). Der Effekt oben bleibt der einzige SETZENDE Pfad.
  useEffect(() => {
    if (typeof window === 'undefined' || !sucheFeldLeer) return;
    setzeSuchHighlight(null, '', highlightInstanz);
  }, [sucheFeldLeer, highlightInstanz]);

  // ─── H2 · Fundstellen EINES Artikels, auf Abruf ────────────────────────────
  // Die V3-Trefferliste zeigt unter dem Artikelkopf eine Zeile je Fundstelle mit
  // eigenem Kontext-Ausschnitt. Diese Ausschnitte im Voraus fuer ALLE Treffer zu
  // bauen waere der teuerste Handgriff des Lesers (Herleitung an
  // `artikelFundstellen`, leserSuche.ts) — sie kommen darum nur fuer den
  // Artikel, den die Liste gerade aufklappt. Der Index liegt ohnehin schon da;
  // ein zweiter waere die §5-Doppelwahrheit.
  const fundstellenFuer = useCallback(
    (token: string) => artikelFundstellen(index, token, sucheTrim, bereich),
    [index, sucheTrim, bereich],
  );

  // Welche EINZELNE Fundstelle die ^v-Navigation gerade anzeigt — die Liste
  // hebt genau diese Zeile hervor. Projektion aus der Folge, kein zweiter
  // Zustand: `trefferPos` ist der flache Rang, `folge` loest ihn in
  // (Artikel, Rang darin) auf.
  const aktivStelle = trefferPos >= 0 ? folge[trefferPos] ?? null : null;

  return {
    leseRef, treffer, artikelAnzahl, fundstellen, aenderungenAus,
    trefferPos, aktivToken, springeZuFundstelle, springeZuTreffer, springeZuStelle,
    aktivStelle, fundstellenFuer, loeseArtikel, siePfad, siePfadArtikel,
  };
}
