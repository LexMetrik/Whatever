import { useCallback, useEffect, useRef, useState } from 'react';
import { useDialogFokus } from '../../components/layout/useDialogFokus';
import { usePaneKontext } from '../../components/layout/PaneKontext';
import { useMeldeInhaltsKopf } from '../../components/layout/InhaltsKopfKontext';
import type { StrukturMap, ErlassKopf, CurrencyMap, KantonLueckenMap } from '../../lib/normtext/browse';
import type { KantonSystematik } from '../../lib/normtext/systematik';
import type { BrowseErlass, BrowseManifest } from '../../lib/normtext/browse-typen';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { beiLeerlauf } from '../../lib/leerlauf';
import { merkeKlappAstManuell, merkeSprungAstManuell } from './sprungAst';
import { useBezuege } from './bezuegeLaden';
import { ladeRevisionShard, revisionFuerToken, type RevisionShard } from '../../lib/verzahnung/artikel-revisionen';
import { ladeHistorieShard, historieFuerArtikel, type HistorieShard } from '../../lib/normtext/historie-laden';
import {
  fruehestesInKraft, nichtKonsolidierteInkrafttreten, revisionenFuerNorm,
} from '../../lib/normtext/revisionen';
import { klappZeile, oeffneSprungZiel } from './klappKarte';
import { gliederungGemerktZu } from './v3/gliederungGedaechtnis';

// ═══ ABSCHNITT · Reader-Zustand (§6.6-Split, QS-TOK/T14) ═════════════════════
// Aus GesetzLeserInhalt ausgelagerte Zustands-Hooks: Daten-/Shard-/Such-Zustand,
// die TOC-Auf/Zu-Buchhaltung und der Ansichts-/Pane-Zustand. VERHALTENSNEUTRAL:
// jeder useState/useRef/useEffect ist byte-identisch zum früheren Inline-Code,
// jede Dependency-Liste unverändert. Die HOOK-REIHENFOLGE bleibt erhalten, weil
// GesetzLeserInhalt die drei Hooks in EXAKT der Reihenfolge ruft, in der die
// Deklarationen vorher standen (drei kontigue Blöcke, saubere Schnittkanten:
// jeder Block ist in sich geschlossen und braucht nichts aus dem folgenden).
// Keine Rechtsregel, kein Normtext, keine Reihenfolge der Logik verändert (§3).

// Split-View E (Container-responsiv): Schwelle, ab der ein Pane das 2-Spalten-
// Layout wählt — deckungsgleich mit der matchMedia-Schwelle (1024px, R2).
// Modul-Konstante statt Component-Local: reiner Wert, kein Zustand.
const PANE_BREIT_PX = 1024;

// ─── Block 1 · Daten-, Shard- und Such-Zustand ───────────────────────────────
export function useLeserZustand({ bezuegeVorladen = true }: {
  /**
   * H3 (LESER-V3, Panel-Nachladen) — DER EINE SCHALTER, der entscheidet, ob der
   * Bezugs-Shard beim SEITENAUFRUF geholt wird.
   *
   * Vorgabe `true` = Ist-Verhalten, Zeichen für Zeichen: die Ist-Hülle rendert
   * unter jedem Artikel eine Bezüge-Zeile und braucht die Daten darum sofort.
   * Sie ruft diese Hook ohne Argument und ist von H3 unberührt (FL-4).
   *
   * `false` setzt die V3-Hülle: dort steht die Rechtsprechung im Panel, und das
   * lädt erst beim Öffnen (`v3/panelModell.ts`). Ohne diesen Schalter lief der
   * Lade-Effekt in `useBezuege` weiter — das Nachladen wäre eine Behauptung
   * geblieben, während der Shard (BGG 300 KB gzip) unverändert über die Leitung
   * ginge: die Hook lädt in ihrem EIGENEN Effekt, nicht beim Konsumieren.
   *
   * Umgesetzt als «Key oder undefined», nicht als zweiter Zweig im Effekt:
   * `useBezuege` kehrt ohne `erlassKey` früh zurück, und `bezuegeFuer` gibt dann
   * ohnehin `undefined` — eine Bedingung, die schon da war (§5, kein neuer Pfad).
   */
  bezuegeVorladen?: boolean;
} = {}) {
  const [erlass, setErlass] = useState<BrowseErlass | null>(null);
  const [eintraege, setEintraege] = useState<NormSnapshot[] | null>(null);
  const [struktur, setStruktur] = useState<StrukturMap | null>(null);
  const [kopf, setKopf] = useState<ErlassKopf | null>(null);
  const [manifest, setManifest] = useState<BrowseManifest | null>(null);
  // P1-d: Currency-Sidecar (geltend-geprüft-Datum + angekündigte Fassung je Erlass-Key).
  const [currency, setCurrency] = useState<CurrencyMap | null>(null);
  // W2·7-BEZUG/B4: der frühere Leitfall-Shard-Zustand (V1a) ist ENTFALLEN. Der
  // Artikelfuss zeigt seit der Vorgabe David 28.7.2026 ausschliesslich die
  // facettierte Auflistung aus dem Bezugs-Shard (`useBezuege`) — dieser ist die
  // Obermenge, der schlanke Shard also überflüssig geworden. Sind alle Facetten
  // abgewählt, wird nichts geladen und nichts gerendert.
  // Revisions-Shard des Erlasses (V1c): Artikel-Token → Datum der letzten Text-
  // änderung + AS-Fundstelle. EIN idle-Fetch auf Reader-Ebene wie der Leitfall-
  // Shard; klassifiziert je Leitfall-Kante, ob sich die Norm SEIT dem Entscheid
  // revidiert hat (Normrevisions-Ehrlichkeit, §V1c).
  const [revisionShard, setRevisionShard] = useState<{ key: string; shard: RevisionShard | null } | null>(null);
  // G-HIST-UI: Per-Artikel-Historie-Shard des Erlasses. EIN idle-Fetch auf Reader-
  // Ebene (wie Leitfall-/Revisions-Shard); der Artikel-Eintrag wird als Prop
  // durchgereicht (die ArtikelHistorieZeile ist ein reiner Renderer). An den Erlass-
  // Key gebunden — ein Pane-/Erlass-Wechsel liefert nie fremde Historie.
  const [historieShard, setHistorieShard] = useState<{ key: string; shard: HistorieShard | null } | null>(null);
  // W2·7-BEZUG/B4: facettierte Bezüge. `useBezuege` lädt den (deutlich grösseren)
  // Bezugs-Shard NUR im erweiterten Facetten-Zustand und im Leerlauf — im
  // Grundzustand fasst der Reader ihn nie an (§15). `erweitert` steuert zugleich,
  // ob der schlanke Leitfall-Shard überhaupt noch geladen wird (Entweder/Oder, §5).
  const {
    aktiv: bezuegeAktiv, bezuegeFuer, kantoneVerfuegbar, klassenImErlass, histogramm: bezugHistogramm,
    bereich: bezugBereich,
  } = useBezuege(bezuegeVorladen ? erlass?.key : undefined);
  const [fehler, setFehler] = useState(false);
  // W2·10-UI-NAV/N0d·O3: kurze Bestätigung nach «In neuem Reiter» — der Reader
  // wird bei der ?r-Instanz-Navigation NICHT neu gemountet (gleicher key=schluessel),
  // darum überlebt dieser Zustand den Soft-Nav und weist zum Reiter-Tracker (☰).
  const [reiterToast, setReiterToast] = useState(false);
  const reiterToastTimer = useRef<number | null>(null);
  useEffect(() => () => { if (reiterToastTimer.current) window.clearTimeout(reiterToastTimer.current); }, []);
  const [suche, setSuche] = useState('');
  // Rank 9 (QS-PERF, §15/3): entprellter Suchwert. Das Eingabefeld bleibt sofort
  // responsiv (`suche`), aber die TEUREN Ableitungen — Treffer-Filter über ~1000
  // Artikel + IntersectionObserver-Neuaufbau — laufen erst ~200 ms nach dem letzten
  // Tastendruck über `sucheDebounced` statt bei JEDEM Zeichen (Jank auf schwacher
  // CPU). LEEREN wirkt SOFORT (kein Lag beim Suche-Verlassen / Treffer→Artikel-Sprung,
  // `springeZuArtikel` setzt setSuche('')). Reine Timing-Optimierung (§6.4): ändert
  // nur WANN gefiltert wird, nie WAS (dieselbe passtAufSuche-Menge, dieselbe Ansicht).
  const [sucheDebounced, setSucheDebounced] = useState('');
  useEffect(() => {
    // Leeren: 0 ms (praktisch sofort, ein Tick — kein Lag beim Suche-Verlassen /
    // Treffer→Artikel-Sprung). Tippen: 200 ms entprellt. Beide über setTimeout,
    // damit kein synchrones set-state-in-effect entsteht (Muster wie UniversalSuche).
    const id = window.setTimeout(() => setSucheDebounced(suche), suche === '' ? 0 : 200);
    return () => window.clearTimeout(id);
  }, [suche]);
  // Scrollposition VOR der Suche merken → beim Leeren der Suche dorthin zurück,
  // statt an den Anfang zu springen (Auftrag David). Ein Treffer-Klick nullt das
  // (springt stattdessen zum Artikel).
  // (T14: `…Ref`-Suffix ist die Namenskonvention, an der `react-hooks/immutability`
  // eine über eine Hook-Grenze gereichte Ref erkennt — sonst gilt das Setzen von
  // `.current` im Aufrufer als verbotene Argument-Mutation. Reine Umbenennung.)
  const scrollVorSucheRef = useRef<number | null>(null);
  const sucheVorherRef = useRef('');
  useEffect(() => {
    const key = erlass?.key;
    if (!key) return;
    let lebt = true;
    const abbrechen = beiLeerlauf(() => {
      // W2·7-BEZUG/B4: der Artikelfuss speist sich AUSSCHLIESSLICH aus dem
      // Bezugs-Shard (`useBezuege`) — der schlanke Leitfall-Shard wird hier
      // nicht mehr geholt. Er ist dessen Teilmenge (Abgrenzung in bezuege.ts);
      // beide zu laden brächte dieselben BGE-Kanten zweimal über die Leitung
      // und liesse die Zeile zweimal einwachsen (zweiter Layout-Sprung,
      // §15/CLS). Sind ALLE Facetten aus, lädt auch `useBezuege` nichts — dann
      // steht unter dem Artikel nichts und es kostet null Byte (Vorgabe David
      // 28.7.2026). Das KontextPanel lädt den norm-index-Shard weiterhin für
      // seinen eigenen Zweck — siehe `bezuegeLaden.ts`.
      void ladeRevisionShard(key).then((shard) => { if (lebt) setRevisionShard({ key, shard }); });
      // G-HIST-UI: Historie-Shard (Bund; Kanton 404 → null → still kein Badge, §8).
      void ladeHistorieShard(key).then((shard) => { if (lebt) setHistorieShard({ key, shard }); });
    });
    return () => { lebt = false; abbrechen(); };
  }, [erlass?.key, bezuegeAktiv]);
  // Revision r(a) des AKTUELLEN Erlass-Artikels (§V1c): undefined = Shard
  // fehlt/lädt/Erlass nicht abgedeckt (⇒ 'unbekannt'); null = Urfassung (⇒ 'gleich');
  // Objekt = letzte Textänderung. Stabile Referenz aus dem Shard → memo-freundlich.
  const revisionFuer = useCallback((artikel: string) => (
    erlass && revisionShard?.key === erlass.key
      ? revisionFuerToken(revisionShard.shard, artikel)
      : undefined
  ), [erlass, revisionShard]);
  // W2·19-GLIEDERUNG/S6 (Bau-Spec §5.1, Zeile 1): trägt der Erlass mindestens
  // eine in Kraft getretene, aber nicht konsolidierte Änderung? PROMOTION, kein
  // Neubau — dieselbe Quelle, die das KontextPanel ohnehin lädt
  // (`revisionenFuerNorm`, modulweiter Promise-Cache in normtext/revisionen.ts),
  // also KEIN zweiter Fetch (§15.3). Der Reader hebt die Tatsache nur an zwei
  // Stellen, an denen man sie VOR dem Lesen sieht (Erlass-Kopf, Erlass-Übersicht).
  // Kein `beiLeerlauf`: das Panel stösst denselben Fetch beim Mount an, und ein
  // zusätzlicher Leerlauf-Verzug verschöbe die Aussage grundlos nach hinten.
  // `false` = noch nicht bekannt ODER keine solche Änderung — beides «kein
  // Banner» (§8: nichts behaupten, was nicht belegt ist).
  //
  // Das Ergebnis trägt seinen EIGENEN Key, der Anzeigewert wird daraus
  // ABGELEITET (dasselbe Muster wie im KontextPanel): so steht beim Erlass-/
  // Pane-Wechsel nie eine fremde Aussage, OHNE dass im Effekt-Rumpf synchron
  // gesetzt werden müsste (react-hooks/set-state-in-effect, Kaskaden-Render).
  //
  // S3 (F5) verschärft das an zwei Stellen:
  //
  //  (a) DATUM: der Klartextsatz im Erlass-Kopf nennt, SEIT WANN die Änderung
  //      gilt. Der Effekt legt darum die Inkrafttretens-Daten der offenen
  //      Revisionen ab, nicht nur ein Ja/Nein.
  //  (b) STICHTAG: `nichtKonsolidiert` markiert alles, was NACH dem Korpus-Stand
  //      in Kraft tritt — also auch rein KÜNFTIGE Änderungen (gemessen 16.8.2026:
  //      66 Erlasse mit Marker, davon nur 4 mit einer bereits geltenden Änderung,
  //      der späteste Marker auf 2034). Als «gilt schon, fehlt aber im Text»
  //      darf nur zählen, was am letzten maschinellen Fedlex-Abgleich
  //      (`currency.geprueftAm`) bereits in Kraft war — Begründung und §2-Beleg
  //      in `fruehestesInKraft`. Angekündigtes trägt weiterhin sein eigenes,
  //      korrektes Wortfeld «nächste Fassung ab …».
  //
  // Die Ableitung steht bewusst NICHT im Effekt: der Stichtag kommt aus dem
  // Currency-Sidecar, der unabhängig eintrifft. Rohdaten im State, Aussage im
  // Render — so braucht der Effekt keine zweite Dependency und kann nicht mit
  // einem veralteten Stichtag zurückbleiben.
  const [konsGeladen, setKonsGeladen] = useState<{ key: string; offen: string[] } | null>(null);
  useEffect(() => {
    const key = erlass?.key;
    if (!key) return;
    let lebt = true;
    void revisionenFuerNorm([key]).then((ans) => {
      if (lebt) setKonsGeladen({ key, offen: nichtKonsolidierteInkrafttreten(ans?.revisionen) });
    });
    return () => { lebt = false; };
  }, [erlass?.key]);
  const nichtKonsolidiertSeit = erlass && konsGeladen?.key === erlass.key
    ? fruehestesInKraft(konsGeladen.offen, currency?.[erlass.key]?.geprueftAm)
    : null;
  // Ein Ja/Nein bleibt für die Verbraucher erhalten, die kein Datum zeigen
  // (Erlass-Übersicht, V3-Modell) — es ist jetzt DASSELBE Urteil wie im Kopf,
  // nicht mehr der ungefilterte Marker. Vorher hätte die Übersicht bei 66 statt
  // 4 Erlassen «In Kraft getretene Änderung …» behauptet (§8).
  const nichtKonsolidiert = nichtKonsolidiertSeit !== null;
  // G-HIST-UI: Artikel-Token → Fassungshistorie des AKTUELLEN Erlasses (sonst
  // undefined = kein Badge). Direkter Roh-Token-Lookup (Snapshot/Shard gleiche
  // Extraktion). Stabile Referenz aus dem Shard → memo-freundlich.
  const historieFuer = useCallback((artikel: string) => (
    erlass && historieShard?.key === erlass.key
      ? historieFuerArtikel(historieShard.shard, artikel)
      : undefined
  ), [erlass, historieShard]);

  return {
    erlass, setErlass, eintraege, setEintraege, struktur, setStruktur, kopf, setKopf,
    manifest, setManifest, currency, setCurrency,
    bezuegeFuer, kantoneVerfuegbar, klassenImErlass, bezugHistogramm, bezugBereich,
    fehler, setFehler, reiterToast, setReiterToast, reiterToastTimer,
    suche, setSuche, sucheDebounced, scrollVorSucheRef, sucheVorherRef,
    revisionFuer, historieFuer, nichtKonsolidiert, nichtKonsolidiertSeit,
  };
}

// ─── Block 2 · Gliederungs-Auf/Zu-Buchhaltung (Fliesstext + TOC-Baum) ────────
export function useLeserTocZustand() {
  // Auf-/Zu-Zustand des FLIESSTEXTS (Sektionen im Lesefluss). Default OFFEN
  // (renderSektion mit defOpen=true) — Fedlex-treu der ganze Erlass lesbar; jede
  // Stufe ist per SektionKopf-Toggle einzeln einklappbar. Eigener State, vom TOC
  // entkoppelt (D, Auftrag David 26.6.2026).
  // (T14: der Kommentar stand zuvor über einem unbeteiligten Shard-Effekt —
  // beim §6.6-Split an seine Deklaration zurückgeholt, reine Kommentar-Korrektur.)
  const [offen, setOffen] = useState<Record<string, boolean>>({});
  // Eigener Auf-/Zu-Zustand NUR für den TOC-Baum (entkoppelt vom Fliesstext).
  // Default ZU (SektionBaumTOC: `?? false`); beim Scrollen klappt der Spy die
  // aktive Sektion auf und beim Verlassen wieder zu (K) — manuell geöffnete
  // Zweige bleiben offen (autoOffenRef).
  const [tocBaum, setTocBaum] = useState<Record<string, boolean>>({});
  // Während eines Klick-Sprungs den Scroll-Spy stilllegen, damit der Baum nicht
  // durch die durchscrollten Zwischen-Sektionen flackert (auf/zu).
  const jumpLockRef = useRef(false);
  // K (Auftrag David 26.6.2026): Zweige, die der Scroll-Spy AUTOMATISCH geöffnet
  // hat. Nur diese darf der Spy wieder zuklappen, sobald die Leseposition den
  // Zweig verlässt — manuell (Klick) geöffnete Zweige bleiben offen, weil sie
  // nicht in diesem Set stehen (tocToggleGruppe/springeZuSektion nehmen sie heraus).
  const autoOffenRef = useRef<Set<string>>(new Set());
  // §15.2-Nachlauf (18.7.2026): Tick des letzten Aktiv-Vorkommens je Auto-Zweig +
  // monotoner Pfadwechsel-Zähler. Der Spy klappt einen Auto-Zweig erst zu, wenn er
  // AUTO_ZU_NACHLAUF Pfadwechsel aus dem aktiven Pfad heraus ist (dann off-screen →
  // CLS-frei); verhindert das sichtbare Auf-/Zuklappen beim Hin-und-Her-Scrollen.
  const autoTickRef = useRef<Map<string, number>>(new Map());
  const autoTickNowRef = useRef(0);
  // Zweige, die der NUTZER selbst aufgeklappt hat (Klick/Sprung). Der Scroll-Spy
  // darf diese NIE ins Auto-Set adoptieren und NIE auto-zuklappen — auch dann
  // nicht, wenn die Leseposition durch sie hindurchscrollt (David: «nur was
  // automatisch geöffnet wurde, geht wieder zu»).
  const manuellOffenRef = useRef<Set<string>>(new Set());
  // Zweige, die der NUTZER selbst zugeklappt hat — auch wenn sie im aktiven
  // Lesepfad liegen. Der Scroll-Spy darf sie NICHT wieder auto-aufklappen,
  // solange der Nutzer sie nicht selbst wieder öffnet (sonst überschreibt der
  // Spy das explizite Einklappen des gerade gelesenen Zweigs).
  const manuellZuRef = useRef<Set<string>>(new Set());
  // Manuelles Auf-/Zuklappen im TOC: beim Öffnen in manuellOffenRef aufnehmen
  // (bleibt offen) + aus manuellZuRef nehmen; beim Schliessen umgekehrt (in
  // manuellZuRef, aus manuellOffenRef); nie im Auto-Set (K).
  // Rank 4 (QS-PERF, §15/4): useCallback ([] — liest nur setTocBaum + stabile Refs),
  // sonst hätte onToggle bei jedem Parent-Render neue Identität und die React.memo-
  // Wrapper von SektionBaumTOC liefe bei jeder Scroll-Spy-Aktualisierung leer.
  //
  // EINE ZEILE, EIN ZIELWERT (B3, Bug-Check 9.8.2026). Eine verdichtete
  // Einzelkind-Kette ist EINE Zeile mit MEHREREN Sektions-Ids («§ 3 › I. › 1.»).
  // Bis hierher rief der Chevron `k.ids.forEach(tocToggle)` und kippte jede Id
  // EINZELN: standen sie nicht im gleichen Zustand — und genau das hinterlässt
  // ein Sektions-Sprung, der nur die äussere Id öffnet —, kam nach dem Flip ein
  // GEMISCHTER Zustand heraus. Die Zeile gilt als offen, sobald IRGENDEINE ihrer
  // Ids offen ist (`istOffen`, `.some(Boolean)`): der Ast liess sich nie wieder
  // schliessen, `aria-expanded` blieb dauerhaft `true`, und weil dabei auch
  // `manuellOffenRef`/`manuellZuRef` gemischt befüllt wurden, half kein Scrollen
  // und kein zweiter Klick. Betroffen sind alle Zeilen mit Verdichtung UND
  // Kindern (ZGB, VVG, KOV, mehrere BS-Erlasse).
  //
  // Der Aufrufer gibt den SICHTBAREN Zustand mit (`istOffen`), statt ihn hier aus
  // `tocBaum` zu erraten: die Zeile kennt zusätzlich `startOffen` und
  // `startOffeneTiefe` (Modell), und eine Zeile, die ohne Eintrag in `tocBaum`
  // offen startet, liesse sich sonst mit dem ersten Klick nicht schliessen.
  const tocToggleGruppe = useCallback((ids: string[], istOffen: boolean) => {
    const ziel = !istOffen;
    // Die Buchhaltung steht seit 15.9.2026 in `./sprungAst` (§5) — sie war an
    // vier Stellen getippt, und die Kopie im Artikel-Sprung war unvollständig.
    merkeKlappAstManuell(ids, ziel, {
      autoOffen: autoOffenRef.current, autoTick: autoTickRef.current,
      manuellOffen: manuellOffenRef.current, manuellZu: manuellZuRef.current,
    });
    setTocBaum((o) => klappZeile(o, ids, istOffen));
  }, []);
  // Dasselbe für ein SPRUNG-Ziel, gebunden an die Refs, die hier wohnen: die
  // Sprung-Pfade sollen die vier Mengen nicht selbst kennen müssen — genau daran
  // ist die Kopie in `springeZuArtikel` gescheitert (Fehlerbuch 15.9.2026).
  const merkeSprungAst = useCallback((ids: Iterable<string>) => {
    merkeSprungAstManuell(ids, {
      autoOffen: autoOffenRef.current, autoTick: autoTickRef.current,
      manuellOffen: manuellOffenRef.current, manuellZu: manuellZuRef.current,
    });
  }, []);
  const [aktivIds, setAktivIds] = useState<string[]>([]); // Sektions-IDs (TOC-Markierung, eindeutig)
  const [tocAuf, setTocAuf] = useState(false); // unter lg: Gliederungs-Sheet offen?
  // W2·10-UI-NAV/R2: «beim Öffnen Hierarchie zur aktuellen Leseposition
  // aufgeklappt + markiert». Markiert ist sie bereits (aktivIds → aktivPfad im
  // Baum); aufgeklappt war sie es NICHT: im mobilen Sheet sind tiefe Zweige
  // Default zu, und der Scroll-Spy führt sie erst beim nächsten Scroll nach —
  // beim Öffnen sah man den gelesenen Zweig also gar nicht. Darum den aktiven
  // Pfad beim ÖFFNEN einmalig aufklappen und wie einen Klick-Sprung als MANUELL
  // behandeln (K): sonst klappte der Spy ihn sofort wieder zu.
  //
  // GENAU EINMAL je Öffnung (`pfadAufgeklapptRef`), aber MIT NACHLAUF: Bug-Check
  // §9 vom 4.8.2026 (B5) — wer das Sheet öffnet, BEVOR der Scroll-Spy zum ersten
  // Mal gefeuert hat (Deep-Link, sofortiges Antippen nach dem Laden), hatte
  // `aktivIds === []`; der Effekt stieg aus und lief nie nach, weil `aktivIds`
  // nicht in den Deps stand — das Sheet blieb ohne aufgeklappten Lesepfad. Jetzt
  // ist `aktivIds` Dependency, und das Ref verhindert das wiederholte Aufklappen
  // bei jedem Spy-Wechsel im offenen Sheet (kein Reflow im offenen Overlay =
  // §15.2, und keine Endlos-Schleife: der Effekt setzt nur `tocBaum`, das seine
  // eigene Dependency nicht ist). Das Ref wird beim Schliessen zurückgesetzt.
  const pfadAufgeklapptRef = useRef(false);
  useEffect(() => {
    if (!tocAuf) { pfadAufgeklapptRef.current = false; return; }
    if (pfadAufgeklapptRef.current || aktivIds.length === 0) return;
    pfadAufgeklapptRef.current = true;
    merkeSprungAst(aktivIds);
    // Im rAF NACH dem Öffnungs-Paint: das Aufklappen ist damit demselben Klick
    // zugerechnet (hadRecentInput ⇒ CLS-frei, §15.2) und der Effekt ruft kein
    // setState synchron in seinem Rumpf (Kaskaden-Render-Regel).
    const raf = window.requestAnimationFrame(() =>
      setTocBaum((o) => oeffneSprungZiel(o, aktivIds, aktivIds.slice(-1))));
    return () => window.cancelAnimationFrame(raf);
  }, [tocAuf, aktivIds, merkeSprungAst]);

  return {
    offen, setOffen, tocBaum, setTocBaum, tocToggleGruppe, merkeSprungAst, aktivIds, setAktivIds, tocAuf, setTocAuf,
    jumpLockRef, autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef,
  };
}

// ─── Block 3 · Ansichts-Zustand (Viewport/Pane, Kopf-Meldung, Spy-Refs) ──────
export function useLeserAnsichtZustand({ tocAuf, setTocAuf }: {
  tocAuf: boolean;
  setTocAuf: (auf: boolean) => void;
}) {
  // ab lg: Gliederungsspalte ein-/ausklappen — Start aus der gemerkten Nutzerwahl
  // (Entscheid David 24.9.2026, `v3/gliederungGedaechtnis`), schon im ersten Render.
  const [tocOffen, setTocOffen] = useState(() => !gliederungGemerktZu());
  // 2-Spalten-Erkennung. R2 (Auftrag David 30.6.2026): Schwelle von 1280px auf
  // 1024px (Tailwind lg) gesenkt → die linke Gliederungsspalte erscheint schon auf
  // kleineren Laptops «grundsätzlich», nicht erst ab 1280px. 1024px deckt sich mit
  // der Schwelle der persistenten App-Seitenleiste (lg) UND mit PANE_BREIT_PX (1024)
  // des Pane-Pfads → unter lg sind sowohl Seitenleiste als auch Gliederung Drawer
  // (kohärent, «nur bei echt-zu-klein in den Drawer»). Die Lesespalte bleibt nutzbar:
  // Inhaltsbreite ist auf max-w-content (70rem) gedeckelt, abzüglich 18rem TOC + gap-8
  // läuft der Fliesstext (max-w-normtext 42rem, E6/A37) nie unter ~25rem.
  // W2·19-GLIEDERUNG/S2 (16rem → 18rem): am ENGSTEN Punkt gemessen statt gerechnet
  // (Bau-Spec §2). Chromium, Reader OR/ZGB, Lesespalte `#lc-lesespalte`:
  //   @1024px  432 → 400 px (OR 41 → 35 ch, ZGB 37 → 33 ch)
  //   @1100px  508 → 476 px (OR 48 → 45 ch)
  //   @1280px  672 → 656 px (OR 68 → 63 ch)
  //   @1440px+ 672 → 672 px — unverändert, weil `max-w-normtext` (42rem) deckelt
  // Horizontaler Overflow in ALLEN Fällen 0. Die 32-px-Einbusse trifft also nur
  // das Fenster 1024–~1264 px; die a37-Assertion (@1440: Spalte exakt 672 px) und
  // das R5-Lesemass (≤ 75 ch @1440, ≥ 30 ch @390) bleiben unberührt. SSR-Default false =
  // mobil-Layout (byte-gleich). Ohne diese Erkennung behandelte der Code «tocOffen»
  // fälschlich als 2-Spalten-aktiv → der Gliederungs-Zugang verschwand beim Scrollen.
  // §15.2 «Client-Initialstate auf den Server-Zustand pinnen»: den WAHREN
  // Viewport-Stand schon im ERSTEN Client-Render lesen (lazy Initializer),
  // nicht erst per useEffect nach dem Mount. Sonst rendert der Client (der per
  // createRoot frisch mountet, kein hydrateRoot — §15.5) zuerst mit `false`
  // = 1-Spalten-Layout und flippt danach auf `true` = 2-Spalten-Grid
  // (`grid-cols-[18rem_…]`) → die gesamte Lesespalte reflowt = grosser Layout-
  // Shift. Unter CPU-Last (CI: 6 parallele Tore-Jobs) verlor dieser useEffect
  // das Rennen gegen den Snapshot-Fetch: die Artikel rendern 1-spaltig, DANN
  // flippt der Effekt → byte-identischer 0,49-CLS (verweis-u «Plural-Sprung»).
  // SSR/Prerender: `window` ist undefiniert → `false` (Mobil-Layout,
  // renderToString byte-gleich; die Erlass-Detailseiten kommen ohnehin aus dem
  // separaten String-Builder `erlassVolltextHtml`, nicht aus dieser Komponente).
  const [istXlVp, setIstXlVp] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const upd = () => setIstXlVp(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);
  const { imPane, rolle, wurzel, overlayWurzel } = usePaneKontext();
  // Split-View E (Container-responsiv): ein Pane wählt sein Layout nach SEINER
  // Breite, nicht nach dem Viewport. `istXl` (treibt 2-Spalten-Gliederung + Drawer-
  // vs-Sidebar) kommt im Pane aus einem ResizeObserver auf der Pane-Wurzel (Schwelle
  // PANE_BREIT_PX = 1024), sonst aus matchMedia (1024px, R2) — beide Pfade ab 1024.
  // Reines @container-CSS reicht hier NICHT: istXl steuert bedingtes Rendering
  // (Vollbar/Kompaktknopf, Existenz des Drawers), das CSS nicht schalten kann.
  const [istBreit, setIstBreit] = useState(false);
  useEffect(() => {
    // Kein Reset bei !imPane nötig: istXl ignoriert istBreit dann ohnehin.
    if (!imPane || !wurzel?.current || typeof ResizeObserver === 'undefined') return;
    const el = wurzel.current;
    const ro = new ResizeObserver((eintraege) => {
      // border-box (inkl. Scrollbar) → die Scrollbarbreite verschiebt den
      // Schwellenvergleich nicht (kein Flackern an der 1024px-Grenze).
      for (const e of eintraege) {
        const w = e.borderBoxSize?.[0]?.inlineSize ?? e.contentRect.width;
        setIstBreit(w >= PANE_BREIT_PX);
      }
    });
    ro.observe(el, { box: 'border-box' });
    return () => ro.disconnect();
  }, [imPane, wurzel]);
  const istXl = imPane ? istBreit : istXlVp;
  // A3: aktuell gelesener Artikel (live) für den Einzelansicht-Kopf. Nur in der
  // Einzelansicht (!imPane) gepflegt; im Split-View trägt der PaneKopf den Titel.
  const meldeInhaltsKopf = useMeldeInhaltsKopf();
  const [aktArtikel, setAktArtikel] = useState<string | null>(null);
  // B-2.5: In einem Pane scopen wir DOM-Queries + Scroll auf die Pane-Wurzel
  // (sonst kollidieren doppelte `art-`-IDs / trifft der Scroll das falsche Pane).
  // NUR ein SEKUNDÄRES Pane unterdrückt globale URL-/Reiter-Writes — das primäre
  // Pane IST die URL und pflegt sie wie heute. Ausserhalb eines Panes alles wie bisher.
  const istSekundaer = rolle === 'sekundaer';
  // W2·5d G2b (Fussnoten-Unifizierung): der frühere `fussnotenAuf`-React-Schalter
  // (Such-Leiste, Default AUS) entfällt — die Fussnoten-Bedienung ist jetzt EINE
  // (seit D35-F3 die Stellung der `data-vermerke`-Wahl, Vorgabe «fassung» —
  // bis 7.9.2026 der `data-fussnoten`-Toggle mit Vorgabe AN). Marker + Apparat
  // liegen IMMER im DOM (R9/§8, Ctrl+F/Print/Screenreader); «AUS» dämpft rein per
  // CSS (index.css), versteckt nie. Kein React-State-Zweig mehr im Artikel-Baum.
  // Die Gliederungslinie ist ersatzlos entfallen (Entscheid David 13.8.2026,
  // FAHRPLAN-GESETZESDARSTELLUNG-V2 §9.3) — `renderSektion` emittiert nur noch
  // den dauerhaften Einzug, kein Linien-State.
  // N13: amtliche Kanton-Systematik (lazy) — liefert das echte Sachgebiet eines
  // kantonalen Erlasses für die Reader-Overline (statt Einheits-«Öffentliches Recht»).
  const [kantonSys, setKantonSys] = useState<Record<string, KantonSystematik>>({});
  // §8-Nachzug (PR #614-Auflage): ausgewiesene Erlass-Lücken je kantonalem
  // Erlass-Key — analog `kantonSys` lazy geladen, nur für die Kanton-Lesesicht.
  const [kantonLuecken, setKantonLuecken] = useState<KantonLueckenMap>({});
  // BGer-Entscheide/Materialien/Werkzeuge zu diesem Erlass: das einheitliche
  // KontextPanel (B3) lädt + zeigt sie selbst (Single Source, §5) — am Leseende.
  const sekRefs = useRef<Map<string, HTMLElement>>(new Map());
  // Mobiler Suche-&-Gliederung-Drawer (role=dialog): Esc-Schliessen, Fokus
  // setzen + fangen, Fokus-Rückgabe an den Auslöser über den geteilten Hook (§5).
  const tocDrawerRef = useRef<HTMLDivElement | null>(null);
  useDialogFokus(!istXl && tocAuf, tocDrawerRef, () => setTocAuf(false));
  // Live-Label des aktiven Reiters beim Scrollen entprellen (Trailing-Debounce):
  // sonst ein localStorage-Write + globales TABS_EVENT pro überschrittener
  // Artikelgrenze (Scroll-Jank auf langen Erlassen). Reine Timing-Optimierung (§6.4).
  const tabArtikelTimer = useRef<number | null>(null);
  // Entprellt die Kopf-Artikel-Meldung: beim schnellen Durchscrollen sonst ein
  // setKopfDaten (Shell) pro Artikelgrenze → unnötige Re-Renders der übrigen Panes.
  const aktArtikelTimer = useRef<number | null>(null);
  // E7/A33-F3 (RC2): das automatische Auf-/Zuklappen des aktiven Zweigs (K) wird
  // entprellt — analog aktArtikelTimer/tabArtikelTimer. Beim schnellen Durchscrollen
  // sonst eine dichte Reflow-Folge des Gliederungsbaums (Δ~100 px pro Zweigwechsel),
  // die den TOC in Eigenbewegung versetzt («Gliederung springt umher», David 16.7.).
  const tocBaumTimer = useRef<number | null>(null);
  // E7/A33-F2 (RC1b): Zeitstempel der letzten NUTZER-Bedienung des TOC (wheel/
  // pointerdown/touchstart). Solange der Nutzer die Gliederung aktiv durchblättert,
  // pausiert das automatische Nachführen (Mitscroll-Effekt) — sonst reisst eine
  // verspätete Rückhol-Bewegung das manuelle Erkunden zurück (Symptom 3). Kein
  // `scroll`-Event als Auslöser: der eigene programmatische Scroll würde den Guard
  // sonst selbst armieren.
  const tocTouchRef = useRef(0);

  return {
    tocOffen, setTocOffen, istXl, imPane, wurzel, overlayWurzel, istSekundaer,
    meldeInhaltsKopf, aktArtikel, setAktArtikel, kantonSys, setKantonSys,
    kantonLuecken, setKantonLuecken,
    sekRefs, tocDrawerRef, tabArtikelTimer, aktArtikelTimer, tocBaumTimer, tocTouchRef,
  };
}
