import {
  useCallback, useEffect, useMemo, useRef,
  type Dispatch, type MutableRefObject, type RefObject, type SetStateAction,
} from 'react';
import { flushSync } from 'react-dom';
import type { NavigateFunction } from 'react-router-dom';
import type { InternRefs } from '../../components/NormText';
import type { Sektion } from '../../lib/normtext/browse';
import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import { erlassPfad } from '../../lib/normtext/erlassAdresse';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { grundartMeta, pfadZu } from './helpers';
import { istHashVerbraucht } from './scrollAnker';
import { paneRoot } from './berechnungen';
import { loeseSpyNachlauf } from './inhalt-hooks';
import { merkeSprungAstManuell } from './sprungAst';
import { useTiefLinkZweig } from './v3/tiefLinkZweig';
import { oeffneSprungZiel } from './klappKarte';
import { uebersetzeRohPfad } from './gliederungsModell';

// ═══ ABSCHNITT · Sektions-Sprung, Instanz-Navigation, Suche-Scroll (§6.6-Split,
// QS-TOK/T14) ════════════════════════════════════════════════════════════════
// Aus GesetzLeserInhalt ausgelagert. VERHALTENSNEUTRAL: Rümpfe und Dependency-
// Listen byte-identisch, Hook-Reihenfolge erhalten (jeder Hook kapselt einen
// kontiguen Block und wird an derselben Position gerufen). Keine Rechtsregel (§3).
//
// NICHT hier: `springeZuArtikel` bleibt in `inhalt.tsx`. Die LM-202-Quellensonde
// (`src/tests/leser-adresse-lm202.test.ts`, «Die zwei erlaubten Adress-Schreiber»)
// liest den einzigen erlaubten Adress-Schreiber — den replaceState-Aufruf auf
// `ziel` — im Quelltext von `inhalt.tsx`; ihn wegzuziehen hiesse, den Test
// anzupassen, und das verbietet §6 Ziff. 2 bei einem Refactoring.
// Der Aufruf ist hier BEWUSST nicht wörtlich zitiert: dieselbe Sonde verbietet
// jede History-API in diesem Modul und liest den ROHEN Quelltext — ein Zitat im
// Kommentar färbte den Wächter rot, und ein Wächter, der an Kommentaren
// scheitert, wird bald abgeschaltet (§6.7).

type SekRefs = MutableRefObject<Map<string, HTMLElement>>;
type PaneWurzel = RefObject<HTMLElement | null> | null;
const KEIN_PRAEFIX: Record<string, string[]> = {};

// ─── Sprung aus dem Gliederungs-Baum + Instanz-Navigation + Such-Scroll ──────
export function useSektionSprung(opts: {
  sektionen: Sektion[];
  sekRefs: SekRefs;
  location: { key: string; hash: string };
  istSekundaer: boolean;
  imPane: boolean;
  wurzel: PaneWurzel;
  sucheDebounced: string;
  springeZuArtikel: (token: string) => void;
  setOffen: Dispatch<SetStateAction<Record<string, boolean>>>;
  setTocBaum: Dispatch<SetStateAction<Record<string, boolean>>>;
  setAktivIds: Dispatch<SetStateAction<string[]>>;
  setTocAuf: Dispatch<SetStateAction<boolean>>;
  scrollVorSucheRef: MutableRefObject<number | null>;
  sucheVorherRef: MutableRefObject<string>;
  /**
   * Darf das Beginnen/Beenden der Suche den Lesetext bewegen?
   *
   * Ungesetzt = `true` = das gewachsene Verhalten der Ist-Huelle, Zeile fuer
   * Zeile unveraendert (FL-4). Die V3-Huelle setzt `false` — Herleitung am
   * Effekt unten.
   */
  scrollBeiSuchwechsel?: boolean;
  /** Rohpfad→Modellpfad (`GliederungsModell.umhaengPraefix`) — wie im Spy (B4). */
  umhaengPraefix?: Record<string, string[]>;
  refs: {
    jumpLockRef: MutableRefObject<boolean>;
    autoOffenRef: MutableRefObject<Set<string>>;
    autoTickRef: MutableRefObject<Map<string, number>>;
    /** Laufender Pfadwechsel-Tick (W2·24-R6c: der Tieflink-Zweig braucht ihn,
     *  damit sein Ast denselben Nachlauf bekommt wie ein vom Spy geöffneter). */
    autoTickNowRef: MutableRefObject<number>;
    manuellOffenRef: MutableRefObject<Set<string>>;
    manuellZuRef: MutableRefObject<Set<string>>;
    tocBaumTimer: MutableRefObject<number | null>;
  };
}) {
  const {
    sektionen, sekRefs, location, istSekundaer, imPane, wurzel, sucheDebounced, springeZuArtikel,
    setOffen, setTocBaum, setAktivIds, setTocAuf, scrollVorSucheRef, sucheVorherRef,
    scrollBeiSuchwechsel = true, umhaengPraefix = KEIN_PRAEFIX,
    refs: { jumpLockRef, autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef, tocBaumTimer },
  } = opts;

  // W2·24-R6c · D21-Nebenfund: der Tieflink öffnet seinen Gliederungszweig VOR
  // dem ersten Bild — er gehört zu den Sprüngen und steht darum hier. Befund,
  // Messreihe und Herleitung: `./v3/tiefLinkZweig`.
  useTiefLinkZweig({
    hash: location.hash, sektionen, erlassMarke: location.key, umhaengPraefix,
    setTocBaum, autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef,
  });

  // Sprung aus dem Gliederungs-Baum (TOC): Pfad öffnen, markieren, scrollen. Beim
  // Sprung den mobilen Drawer schliessen (analog Seitenleiste). Rank 4 (QS-PERF,
  // §15/4): useCallback [sektionen] — nur pfadZu liest sektionen, alle Setter/Refs
  // stabil → SektionBaumTOC (React.memo) re-rendert nur bei aktivPfad-/offen-Wechsel.
  // Muss ÜBER dem early-return (`!erlass || !eintraege`) stehen, sonst wäre der Hook
  // bedingt (Rules of Hooks) — das war der in Batch 1 zurückgestellte Reorder.
  const springeZuSektion = useCallback((zeilenIds: string[]) => {
    // B3 (Bug-Check 9.8.2026), zweiter Hebel: eine verdichtete Einzelkind-Kette
    // ist EINE Zeile mit mehreren Sektions-Ids. `pfadZu` findet nur die
    // ÄUSSERSTE (sie trägt die Zeile) und lieferte damit einen Pfad, in dem die
    // inneren Stufen fehlten — der Sprung öffnete die Zeile halb und hinterliess
    // genau den Mischzustand, an dem der Chevron danach hängenblieb. Die Zeile
    // gibt ihre Ids jetzt selbst mit; behandelt werden sie alle gleich.
    const id = zeilenIds[0];
    const pfad = uebersetzeRohPfad(umhaengPraefix, pfadZu(sektionen, (s) => s.id === id) ?? [id]);
    const ids = [...new Set([...pfad, ...zeilenIds])];
    jumpLockRef.current = true;
    // F3: schwebenden Auto-Akkordeon-Timer verwerfen (Klick-Sprung ist autoritativ).
    if (tocBaumTimer.current != null) window.clearTimeout(tocBaumTimer.current);
    // Sprung-Ziel als MANUELL behandeln (K): in manuellOffenRef aufnehmen und aus
    // dem Auto-Set nehmen, damit der Scroll-Spy den angesprungenen Zweig nicht
    // gleich wieder zuklappt.
    // Seit 15.9.2026 steht die Regel in `./sprungAst` — der ARTIKEL-Sprung hielt
    // hier nur die halbe Buchhaltung und liess den Ast ungeschützt (Fehlerbuch).
    merkeSprungAstManuell(ids, {
      autoOffen: autoOffenRef.current, autoTick: autoTickRef.current,
      manuellOffen: manuellOffenRef.current, manuellZu: manuellZuRef.current,
    });
    // §15.2: der Klick öffnet den TOC-Zweig — diese Höhenänderung SYNCHRON im
    // Klick-Task committen (flushSync), damit der Layout-Shift des einwachsenden
    // Gliederungs-Zweigs dem Input zugerechnet wird (hadRecentInput ⇒ CLS-frei).
    // Ohne flushSync verzögert React unter CPU-Last (CI: 6 parallele Tore-Jobs)
    // den Commit über das 500-ms-Input-Fenster hinaus → der Shift zählt als
    // unerwartet (leser-kopf-a9 «Breadcrumb-Fluss» Mikro-CLS).
    flushSync(() => {
      setAktivIds(ids);
      setTocBaum((o) => oeffneSprungZiel(o, pfad, zeilenIds));
      setOffen((o) => ({ ...o, ...Object.fromEntries(ids.map((x) => [x, true])) }));
      setTocAuf(false); // mobilen Drawer schliessen
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sekRefs.current.get(id)?.scrollIntoView({ block: 'start', behavior: 'auto' });
      // KORREKTUR-SCROLL (Befund David 9.8.2026, erste Hälfte). Der Sprung hatte
      // bis hierher GENAU EINEN Scroll, zwei Frames nach dem Aufklappen — und der
      // trifft unter `content-visibility:auto` nicht. Die Zielposition wird aus den
      // geschätzten Platzhalterhöhen (`schaetzeArtikelHoehe`) der noch nie
      // gerenderten Artikel VOR dem Ziel berechnet; sobald die echten Höhen
      // materialisieren, wandert das Ziel. Gemessen am OR (Sprung auf «Dritte
      // Abteilung», 1686 Artikel): der Abschnittskopf lag erst bei 100 px und
      // driftete auf 16 px — vollständig hinter den 100 px hohen Sticky-Kopf, der
      // Leser sah den Kopf gar nicht mehr, sondern nur noch den Text darunter.
      // `springeZuArtikel` (inhalt.tsx) hatte diesen zweiten Scroll seit je
      // («grosse Sektionen wachsen beim Aufklappen → nach Settle ein Korrektur-
      // Scroll»); dass der Sektions-Sprung ihn nicht hatte, war die Lücke. Ein
      // Korrektur-Scroll genügt: gemessen konvergiert die Lage danach (ein dritter
      // Scroll bewegt nichts mehr). Er liegt INNERHALB des jumpLock-Fensters
      // (500 ms), damit der Spy die Zwischenlage nicht auswertet.
      window.setTimeout(() => {
        sekRefs.current.get(id)?.scrollIntoView({ block: 'start', behavior: 'auto' });
      }, 400);
      // §15.2: den Scroll-Spy bis NACH dem Einschwingen des programmatischen Scrolls
      // gesperrt halten (jumpLock). Sonst feuert der IntersectionObserver, sobald der
      // Sprung-Scroll einläuft, und klappt den aktiven TOC-Zweig auf/zu — eine
      // Höhenänderung im Sticky-Gliederungsbaum, die (nicht input-nah) als
      // unerwarteter CLS zählt. Unter CPU-Last läuft der Scroll spät ein, darum ein
      // Zeit- statt rAF-Fenster (wie springeZuArtikel); der Spy nimmt die Endposition
      // danach normal auf. Reine Timing-Steuerung (kein setState) → kein Re-Render.
      // N2: siehe springeZuArtikel — Lock lösen UND einmal nachwerten lassen.
      window.setTimeout(() => { jumpLockRef.current = false; loeseSpyNachlauf(); }, 500);
    }));
    // Bewusst draussen: setOffen/setTocBaum/setAktivIds/setTocAuf (useState-Setter,
    // stabil) und jumpLockRef/autoOffenRef/autoTickRef/manuellOffenRef/
    // manuellZuRef/tocBaumTimer/sekRefs (useRef-Objekte, identisch über die
    // Lebenszeit). `sektionen` ist der einzige gelesene Zustand (seit W2·5m-LESER-V3 dazu
    // `umhaengPraefix`, je Erlass einmal memoisiert). Als Hook-Argumente
    // kann die Regel die Stabilität nicht mehr belegen; Deps bleiben byte-gleich
    // zum Inline-Stand (Aufnahme wäre eine stille Verhaltens-Änderung, §6).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sektionen, umhaengPraefix]);

  // Wechsel zwischen zwei Instanzen DESSELBEN Gesetzes (?r) bzw. ein Tab-Klick mit
  // #art-Anker remountet den Reader nicht (gleicher pathname) — darum bei jeder
  // Navigation mit Artikel-Anker gezielt dorthin springen (Auftrag David: Klick
  // auf den Reiter führt zum gemerkten Artikel der Instanz).
  const letzteNavKey = useRef<string | null>(null);
  useEffect(() => {
    if (!sektionen.length || typeof window === 'undefined') return;
    if (istSekundaer) return; // sekundäres Pane: location.key ist fix («default»), kein Instanz-Wechsel
    // Nur bei ECHTER Navigation (location.key wechselt), nicht wenn sektionen
    // nachlädt. Den Initial-Load (erster key) deckt der Lade-Hash-Effekt ab →
    // kein doppelter Sprung/Blink. Dieser Effekt trägt nur den Instanz-Wechsel
    // (gleicher pathname, nur ?r/#).
    if (letzteNavKey.current === location.key) return;
    const erstmalig = letzteNavKey.current === null;
    letzteNavKey.current = location.key;
    if (erstmalig) return;
    // LM-199 (W2·17-UI-BEFUNDE-B2): verbrauchter Einstiegs-Hash (Browser-Zurück
    // über eine Reiter-Identitätsgrenze, z. B. ?r-Instanzwechsel ohne Remount) —
    // die A16-Anker-Restauration (App.tsx) übernimmt, kein Hash-Sprung.
    if (istHashVerbraucht()) return;
    const m = location.hash.match(/^#art-(.+)$/);
    if (!m) return;
    const token = decodeURIComponent(m[1]);
    const id = window.requestAnimationFrame(() => springeZuArtikel(token));
    return () => window.cancelAnimationFrame(id);
  }, [location.key, location.hash, sektionen, springeZuArtikel, istSekundaer]);

  // Suche aktivieren → an den Anfang scrollen; Suche schliessen/leeren → an die
  // Scrollposition VOR der Suche zurück (Auftrag David). Grund fürs Hoch-Scrollen
  // beim Aktivieren (Bug David 26.6.2026): die Trefferliste ist kürzer als der
  // Volltext — war man tief gescrollt, rutschte der sticky-Container (Suchleiste +
  // Gliederung) mit seinem geschrumpften Inhalt über den Viewport hinaus und war
  // «aus dem Bild». Nach oben scrollen holt Suchleiste + Gliederung zurück ins
  // Sichtfeld. Reine Scroll-Steuerung (kein setState) → keine Render-Kaskade.
  //
  // ─── H2 · WARUM DIE V3-HÜLLE HIER AUSSTEIGT (Pos. 14) ──────────────────────
  //
  // Die Begründung oben nennt ihren eigenen Ablauf: das Hoch-Scrollen war nötig,
  // WEIL die Trefferliste den Volltext ersetzte und der sticky-Block mit dem
  // geschrumpften Inhalt aus dem Bild rutschte. Seit S8 bleibt die Lesespalte
  // vollständig, und in V3 steht die Trefferliste in der Seitenleiste — der
  // Anlass ist damit ersatzlos weg, die Bewegung aber geblieben.
  //
  // Was sie heute anrichtet, ist genau Pos. 14: wer beim Lesen von Art. 429 kurz
  // etwas sucht und das Feld wieder leert, bekommt ZWEI ungefragte Sprünge (erst
  // an den Anfang, dann zurück) — und der zweite trifft nur, solange nichts
  // dazwischen die Höhe verändert hat. «Recover from mistakes» heisst, dass das
  // Verlassen einer Suche den Text gar nicht erst anfasst.
  //
  // Die Ist-Hülle behält das Verhalten unverändert (`scrollBeiSuchwechsel`
  // ungesetzt = true): sie filtert ihre Lesespalte nicht mehr, aber sie ist
  // eingefroren (FL-4), und eine stille Änderung an ihr wäre keine Etappe,
  // sondern ein Nebenwirkungs-Fund im falschen PR.
  useEffect(() => {
    // An `sucheDebounced` gekoppelt (nicht `suche`): der Ansichtswechsel Volltext↔
    // Trefferliste erfolgt über `treffer` (aus sucheDebounced), darum muss die
    // Scroll-Rettung/-Rückgabe mit genau diesem Moment fluchten (Rank 9).
    const war = sucheVorherRef.current;
    sucheVorherRef.current = sucheDebounced;
    if (typeof window === 'undefined') return;
    // V3: keine der beiden Bewegungen. Der Merkposten wird trotzdem NICHT
    // gefüllt — ein halb geführter Zustand, den niemand ausliest, wäre die
    // schlechtere Hälfte von beidem.
    if (!scrollBeiSuchwechsel) return;
    // Im Pane scrollt der Pane-Container, nicht das Fenster (B-2.5).
    const sc = paneRoot(imPane, wurzel);
    const hole = () => sc ? sc.scrollTop : window.scrollY;
    const setze = (y: number) => sc ? sc.scrollTo(0, y) : window.scrollTo(0, y);
    if (!war && sucheDebounced) {
      scrollVorSucheRef.current = hole();
      window.requestAnimationFrame(() => setze(0));
    } else if (war && !sucheDebounced && scrollVorSucheRef.current != null) {
      const y = scrollVorSucheRef.current;
      scrollVorSucheRef.current = null;
      window.requestAnimationFrame(() => setze(y));
    }
    // Bewusst draussen: nur scrollVorSucheRef und sucheVorherRef — useRef-Objekte,
    // über die Lebenszeit identisch; als Hook-Argumente kann die Regel das nicht
    // mehr sehen. Deps byte-gleich zum Inline-Stand (§6).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucheDebounced, imPane, wurzel, scrollBeiSuchwechsel]);

  return springeZuSektion;
}

// ─── §-Designation des gelesenen Erlasses (F41/F40, W2·13-KANTONE) ───────────
/**
 * Zählt der gelesene Erlass seine Bestimmungen mit «§»?
 *
 * Die Weiche gibt es bereits: `bestimmungsEtikett: 'paragraf'` im
 * Grundart-Register (SSoT, §5) — sie wird hier ABGEFRAGT, nicht neu erfunden.
 * Ehrlichkeits-Vermerk (§8): das Register führt die Etiketten durchgehend mit
 * `bestimmungsEtikettStatus: 'entwurf'` — die Link-Entscheidung hängt an einer
 * noch nicht fachlich abgenommenen Klassifikation. Wirkung bleibt auf
 * Link/kein-Link beschränkt, der Normtext selbst ändert nie
 * und nicht aus dem Wortlaut geraten (§2). Zugang ist `grundartMeta`, dieselbe
 * Ableitung, die `v3/erlassAnsicht.bestimmungsWort` benutzt.
 *
 * Der Schlüssel steckt im Lese-Basispfad: `erlassPfad()` baut ihn als
 * `/gesetze/<routenEbene>/<encodeURIComponent(key)>` — das letzte Segment
 * dekodiert ist genau der Register-Key («BS-427.800», «OR»). Bewusst KEIN
 * zweiter Erlass-Parameter durch die Hook-Kette: `basisPfad` ist die Angabe,
 * die `useInternRefs` ohnehin führt, und ein zweiter Weg zum selben Schlüssel
 * wäre die Stelle, an der die beiden auseinanderlaufen.
 *
 * Rein und deterministisch (§2); ein unbekannter Key liefert `false` (Bund und
 * alles Unklassierte bleiben damit unverändert — kein Rückfall auf «§»).
 */
export function istParagrafDesigniert(basisPfad: string): boolean {
  return grundartMeta(schluesselAusPfad(basisPfad)).bestimmungsEtikett === 'paragraf';
}

/** Register-Schlüssel aus dem Lese-Basispfad («/gesetze/kanton/BS-427.800» →
 *  «BS-427.800»). EINE Ableitung für alle Weichen der Lesesicht (§5).
 *  Defektes %-Escape ⇒ roh weiterverwenden: `decodeURIComponent` WIRFT dann,
 *  und ein geworfener Fehler im Lese-Pfad wäre eine leere Seite statt eines
 *  fehlenden Links. */
function schluesselAusPfad(basisPfad: string): string {
  const letztes = basisPfad.split('/').pop() ?? '';
  try { return decodeURIComponent(letztes); } catch { return letztes; }
}

// ─── V-3 · Kürzel-Register des Kantons (W2·20-VERWEIS-SCHAERFE) ─────────────
/**
 * Kürzel → Lese-Adresse der ANDEREN Erlasse desselben Kantons.
 *
 * Der Grosswort-Guard in `NormText` sperrt «§ 6 IRG», weil ein Kürzel ohne
 * Kanton mehrdeutig ist («ein StG in BS ist nicht das StG in ZH»). Der Kanton
 * des gelesenen Erlasses steht aber fest, und das Register-Manifest hat der
 * Leser ohnehin geladen — kein neuer Client-Index, kein Eager-Fetch (§15).
 * Rein und deterministisch (§2), darum ohne Hook und einzeln testbar.
 *
 * VIER HARTE REGELN, jede eine Fundstelle des Messberichts vom 31.8.2026:
 *  1. KANDIDAT ist ein EINZELNES Wort. Das Register-Feld `kuerzel` trägt
 *     kantonal teils den ganzen Titel («Dekret über den Notariatstarif», bis
 *     521 Zeichen) und teils ein Paar «Langname; Kürzel»
 *     («Behindertenfinanzierungsgesetz; BeFiG»). Am Zitat steht immer EIN Wort
 *     («IRG», «SoHaG», «Personalgesetz»), darum werden die «;»-Segmente
 *     getrennt und mehrwortige verworfen. Ein mehrwortiges Kürzel zu matchen
 *     hiesse, im Fliesstext nach Titeln zu suchen — das ist Raten (§1).
 *  2. EINDEUTIG IM KANTON. Zwei Erlasse mit demselben Kandidaten löschen ihn
 *     (65 mehrdeutige Kürzel im Korpus) — lieber Text als der falsche der
 *     beiden.
 *  3. NIE DER GELESENE ERLASS. Er zählt bei der Eindeutigkeit MIT (sonst würbe
 *     ein geteiltes Kürzel plötzlich den anderen Erlass), ist aber nie Ziel:
 *     ein Verweis auf den eigenen Erlass ist Sache der V-2-Selbstmarker-Weiche
 *     und bleibt ein Sprung, kein Aussen-Verweis.
 *  4. NUR LESBARE ZIELE (`status === 'snapshot'`): ein Link soll den Wortlaut
 *     zeigen, nicht eine Registerkarte ohne Text (§8).
 *
 * `null`/leerer Kanton (Bund, Staatsverträge) ⇒ `undefined` ⇒ die Weiche in
 * `NormText` ruht, Rendering byte-identisch zum Stand davor.
 */
export function baueKantonKuerzelKarte(
  erlasse: readonly BrowseErlass[] | undefined,
  kanton: string | null | undefined,
  eigenerKey: string | undefined,
): ReadonlyMap<string, string> | undefined {
  if (!erlasse || !kanton) return undefined;
  const karte = new Map<string, string>();
  const mehrdeutig = new Set<string>();
  for (const e of erlasse) {
    if (e.kanton !== kanton || e.status !== 'snapshot') continue;
    for (const k of kuerzelKandidaten(e.kuerzel)) {
      if (mehrdeutig.has(k)) continue;
      const schon = karte.get(k);
      if (schon !== undefined && schon !== erlassPfad(e)) { karte.delete(k); mehrdeutig.add(k); continue; }
      karte.set(k, erlassPfad(e));
    }
  }
  if (eigenerKey) {
    const eigen = erlasse.find((e) => e.key === eigenerKey);
    if (eigen) for (const k of kuerzelKandidaten(eigen.kuerzel)) karte.delete(k);
  }
  return karte;
}

/** Die Kürzel-Kandidaten EINES Registereintrags (Regel 1 oben). */
export function kuerzelKandidaten(kuerzel: string): string[] {
  return kuerzel.split(';').map((s) => s.trim())
    .filter((s) => s.length >= 2 && !/\s/.test(s) && /^[A-ZÄÖÜ]/.test(s));
}

// ─── Token-Auflösung für bare Artikelverweise im Wortlaut ────────────────────
export function useInternRefs({ eintraege, basisPfad, springeZuArtikel, istSekundaer, navigate, erlassKuerzel, manifestErlasse, kanton }: {
  eintraege: NormSnapshot[] | null;
  basisPfad: string;
  springeZuArtikel: (token: string) => void;
  istSekundaer: boolean;
  navigate: NavigateFunction;
  /** V-2 (W2·20): Register-Kürzel des gelesenen Erlasses, für die
   *  Selbstmarker-Weiche in NormText. Kommt aus dem Register-Manifest, das der
   *  Leser ohnehin geladen hat — kantonal ist es NICHT aus `basisPfad`
   *  ableitbar (der trägt die Systematik-Nummer «BS-410.700», das Kürzel ist
   *  «SLV»). Ungesetzt ⇒ die Weiche ruht (byte-identisches Rendering). */
  erlassKuerzel?: string;
  /** V-3 (W2·20): das Register-Manifest, das der Leser ohnehin geladen hat, und
   *  der Kanton des gelesenen Erlasses. Beides ist ROHSTOFF — die Kürzel-Karte
   *  entsteht hier (`baueKantonKuerzelKarte`), damit alle Weichen der
   *  Lesesicht an EINER Stelle gebaut werden. Fehlt eines, ruht V-3. */
  manifestErlasse?: readonly BrowseErlass[];
  kanton?: string | null;
}) {
  // Token-Auflösung für bare Artikelverweise (normalisiert «6a» → Token «6_a»).
  return useMemo<InternRefs | undefined>(() => {
    if (!eintraege) return undefined;
    const tokenMap = new Map<string, string>();
    for (const e of eintraege) tokenMap.set(e.artikel.toLowerCase().replace(/[^a-z0-9]/g, ''), e.artikel);
    // W2·5d U-POSITION/A16: ein Klick auf einen Verweis IM Text ist nutzer-initiiert
    // und soll einen echten History-Eintrag anlegen, damit Browser-/UI-Zurück exakt
    // an den Ausgangs-Artikel zurückkehrt. In der PRIMÄR-/Einzelansicht darum über
    // den Router navigieren (react-router besitzt die History; der letzteNavKey-
    // Effekt führt den eigentlichen Sprung aus, ScrollWiederherstellung/ScrollZuHash
    // stellt beim Zurück die Ausgangsstelle her — Anker bei hashlosem Ausgang,
    // #art-Hash bei Hash-Ausgang). Ein MANUELLES pushState würde react-router
    // desynchronisieren (Zurück löste dann keinen Location-Wechsel aus → kein
    // Rück-Sprung). Im SEKUNDÄREN Pane bleibt der direkte Sprung (eigene Pane-
    // History, scrollt den Pane-Container; kein globaler Router-Eingriff, B-2.5).
    const springeZuRef = (t: string) => {
      if (istSekundaer) { springeZuArtikel(t); return; }
      navigate(`${basisPfad}${window.location.search}#art-${t}`);
    };
    // F41/F40: §-Designation einmal je Erlass bestimmen und mitgeben — NormText
    // fragt das Register nicht selbst (Schichtentrennung §3: die Komponente
    // bekommt die Weiche als Wert, nicht die Nachschlage-Fähigkeit).
    return {
      tokenMap, basisPfad, springeZu: springeZuRef,
      paragrafDesigniert: istParagrafDesigniert(basisPfad),
      eigenesKuerzel: erlassKuerzel,
      // V-3: kantons-gescopetes Kürzel-Register; der gelesene Erlass steckt
      // im Basispfad (dieselbe Ableitung wie `istParagrafDesigniert`).
      kantonKuerzel: baueKantonKuerzelKarte(manifestErlasse, kanton, schluesselAusPfad(basisPfad)),
    };
  }, [eintraege, basisPfad, springeZuArtikel, istSekundaer, navigate, erlassKuerzel, manifestErlasse, kanton]);
}
