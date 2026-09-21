import { useCallback, useEffect, useMemo, useState, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { aktualisiereTabArtikel } from '../../../lib/tabs';
import { baueGliederungsbaum, type CurrencyMap, type ErlassKopf, type Sektion, type StrukturMap, type KantonLueckenMap } from '../../../lib/normtext/browse';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import type { NormSnapshot } from '../../../lib/normtext/typen';
import type { KantonSystematik } from '../../../lib/normtext/systematik';
import type { InternRefs } from '../../../components/NormText';
import type { ArtikelFundstelle, LeserTreffer, SuchBereich } from '../leserSuche';
import { landkarteSpur, type LandkarteFeld } from '../../../components/leser/landkarteModell';
import { gesetzLandkarteEinheiten } from './landkarteGesetz';
import { strukturTiefe } from '../strukturTiefe';
import { basisAdresse, pfadZu } from '../helpers';
import { paneRoot, findeArt, kuratiereTocSektionen, zaehleAenderungsvermerke, bieteAenderungsvermerkeSchalter } from '../berechnungen';
import { baueGliederungsModell, findeSynthPfad, type GliederungsKnoten, type GliederungsModell } from '../gliederungsModell';
// ── DIE EINE NAHT ZUR GETEILTEN MASCHINERIE ─────────────────────────────────
// Alles, was V3 von ausserhalb `v3/` an ZUSTAND und EFFEKTEN braucht, wird in
// genau diesen sechs Zeilen importiert. Siehe den Abschnitt «Naht» unten.
import { useLeserDaten, useLeserSprungSpy, loeseSpyNachlauf } from '../inhalt-hooks';
import { useLeserZustand, useLeserTocZustand, useLeserAnsichtZustand } from '../inhalt-zustand';
import { useArtikelAbleitungen, useArtikelTokens, useNachbarn } from '../inhalt-ableitungen';
import { useSektionSprung, useInternRefs } from '../inhalt-sprung';
import { useWeiterlesen } from '../inhalt-weiterlesen';
import { useSuchTreffer } from '../inhalt-suchtreffer';
import type { LesePosition } from '../lesePosition';

// ═══ DATEN-ADAPTER DER V3-HÜLLE ═════════════════════════════════════════════
//
// WAS DIESE DATEI IST: die **einzige** Stelle, an der die V3-Hülle die geteilte
// Leser-Maschinerie berührt. Sie ruft die Hooks, verdrahtet ihre Refs und liefert
// ein **typisiertes Modell** (`LeserV3Modell`) heraus. Kein Markup, kein Layout,
// keine Entscheidung über Aussehen.
//
// WARUM ES SIE GIBT (Fundament-Auflage 1, Auftrag David 16.8.2026):
//
//  ① EINE NAHT STATT ACHT. Ohne sie importierte jede V3-Komponente selbst aus
//     `../inhalt-*` — und H5, das die Ist-Hülle löscht, müsste in acht Dateien
//     suchen, was davon geteilte Maschinerie und was Ist-Hülle ist. Jetzt steht
//     die Antwort in einem Import-Block, den man in zehn Sekunden liest.
//  ② DIE NAMEN LÜGEN, DIE ABHÄNGIGKEIT NICHT. Die Module heissen `inhalt-*`,
//     weil der §6.6-Split sie 2026 aus `inhalt.tsx` herausgeschnitten hat. Sie
//     sind aber **nicht** die Ist-Hülle: sie enthalten Datenladung, Scroll-Spy,
//     Sprung-Mechanik und Suchtreffer — Dinge, die BEIDE Hüllen brauchen. Die
//     Ist-HÜLLE ist `inhalt.tsx` (Orchestrierung) und `inhalt-volltext.tsx`
//     (Markup) samt Menüs; **auf keines von beiden zeigt V3**, und die Sonde
//     `src/tests/leser-v3-adresse.test.ts` hält das fest. Endzustand ist die
//     Umbenennung der geteilten Module in einen neutralen Namensraum — in H5, wo
//     die Ist-Hülle ohnehin fällt, nicht in H1 (eingefrorene Datei, FL-4).
//  ③ TESTBARE GRENZE. Was V3 an Daten hat, steht als EIN Interface da — ein Architektur-Prüfer muss nicht den Rahmen lesen, um es zu wissen.
//
// WAS BEWUSST **NICHT** HIER PASSIERT: die Hook-Reihenfolge ist byte-gleich zur Ist-Hülle
// übernommen — nicht aus Bequemlichkeit, sondern weil diese Hooks geteilte Refs und Timer
// über ihre Reihenfolge koppeln (ausdrückliche Bedingung des §6.6-Splits); eine „aufgeräumte" Reihenfolge wäre eine stille Verhaltensänderung (§6).

/** Was die V3-Hülle über den geöffneten Erlass weiss. Vollständig — es gibt
 *  keinen zweiten Kanal, und keine Komponente holt Daten selbst nach. */
export interface LeserV3Modell {
  /** `null`, solange der Snapshot lädt bzw. eine frühe Ansicht greift. */
  erlass: BrowseErlass | null;
  eintraege: NormSnapshot[] | null;
  struktur: StrukturMap | null;
  kopf: ErlassKopf | null;
  currency: CurrencyMap | null;
  fehler: boolean;
  manifest: ReturnType<typeof useLeserZustand>['manifest'];
  kantonSys: Record<string, KantonSystematik>; kantonLuecken: KantonLueckenMap; // §8-Nachzug PR #614

  /** Amtliche Gliederung: voller Baum für die Lesespalte … */
  sektionen: Sektion[];
  /** … und die Artikel ohne amtliche Sektion (Vorspann/Anhang). */
  ohneGliederung: NormSnapshot[];
  /** Das kuratierte Gliederungs-MODELL (Modus, Zählwerte, Anhang-Ast). */
  gliederung: GliederungsModell;
  /** Alle klappbaren Knoten-Ids — Eingabe für «alles auf/zu». */
  alleKnotenIds: string[];

  gliederungsTiefe: number;
  fussnotenAnzahl: number | null;
  /** D1 · trägt dieser Erlass überhaupt Änderungsvermerke? Geteilte Quelle mit V1 (§5). */
  hatAenderungsvermerke: boolean;
  /** D35-F3 · `kl:'A'`-Fussnoten; `null` = noch nicht geladen, `0` = keine klassifizierte Historie. */
  kantonErlassAnzahl: number | null;
  nichtKonsolidiert: boolean;
  /** S3/F5-Nachzug: ISO-Datum des frühesten nicht konsolidierten Inkrafttretens
   *  (`null` = unbekannt). Ohne dieses Feld zeigte der V3-Kopf den F5-Satz ohne
   *  Zeitbezug, während die Ist-Hülle «seit 01.07.2025» nannte — zwei Hüllen,
   *  zwei Aussagen über denselben Sachverhalt (§5). */
  nichtKonsolidiertSeit: string | null;
  vorher: BrowseErlass | null;
  nachher: BrowseErlass | null;

  /** Artikel-Ableitungen für den Lesekörper (Positionen, Marginalien, Labels). */
  sekPos: Map<string, number>;
  artIndex: Map<string, number>;
  sektionMeta: ReturnType<typeof useArtikelAbleitungen>['sektionMeta'];
  margAnzeige: Map<string, { teile: string[]; ab: number }>;
  internRefs: InternRefs | undefined;
  // Aus dem GETEILTEN Zustand abgeleitet statt neu typisiert (§5). C3: `bezuegeFuer`
  // ist weg — seit H3 (`bezuegeVorladen: false`) durchgehend `undefined` und ohne
  // Leser; Kanten kommen aus `usePanelBezuege` (`./panelModell`).
  revisionFuer: ReturnType<typeof useLeserZustand>['revisionFuer'];
  historieFuer: ReturnType<typeof useLeserZustand>['historieFuer'];

  /** Leseposition (Scroll-Spy) und Klapp-Zustand des Baums. */
  aktArtikel: string | null;
  aktivToken: string | null;
  artTokens: string[];
  aktivIds: string[];
  offen: Record<string, boolean>;
  setOffen: Dispatch<SetStateAction<Record<string, boolean>>>;
  tocBaum: Record<string, boolean>;
  setTocBaum: Dispatch<SetStateAction<Record<string, boolean>>>;
  tocToggleGruppe: ReturnType<typeof useLeserTocZustand>['tocToggleGruppe'];

  /** Sichtbarkeit der Gliederung: Spalte (D/S) bzw. Sheet (H). */
  tocOffen: boolean;
  setTocOffen: Dispatch<SetStateAction<boolean>>;
  tocAuf: boolean;
  setTocAuf: Dispatch<SetStateAction<boolean>>;

  /** In-Gesetz-Suche: EIN Feld, ein Zustand. */
  suche: string;
  setSuche: Dispatch<SetStateAction<string>>;
  sucheAktiv: boolean;
  sucheBegriff: string;
  treffer: LeserTreffer[];
  fundstellen: number;
  aenderungenAus: boolean;
  trefferPos: number;
  trefferAktivToken: string | null;
  /** H2 · Suchbereich (Kap. 4b, Pos. 5) — Zustand der V3-Huelle, kein Speicher.
   *  Absichtlich NICHT persistiert: ein beim naechsten Besuch stillschweigend
   *  eingeschraenkter Suchbereich liesse Treffer verschwinden, ohne dass jemand
   *  ihn gesetzt zu haben glaubt (§8). */
  suchBereich: SuchBereich;
  setzeSuchBereich: (b: SuchBereich) => void;
  /** W2·28 · L-1 — die Bausteine des Erlasses mit ihrer anteiligen Lage. Leer,
   *  solange keine Suche läuft: die Landkarte gibt es nur zur Suche, und die
   *  Rechnung entsteht mit ihr (dieselbe Lazy-Grenze wie der Suchindex, §15). */
  landkarte: LandkarteFeld[];
  /** W2·28 · L-2 — Schalter «Hervorhebung UND Marken zusammen aus». Er hängt an
   *  DIESEM Leser (nicht am Dokument), ist nicht persistiert und fällt mit dem
   *  Leeren des Suchfeldes von selbst zurück auf «ein» (Ruhe-Grundsatz). */
  markenAus: boolean;
  setzeMarkenAus: (aus: boolean) => void;
  /** H2 · Artikel + Rang der laufenden Fundstelle — hebt EINE Listenzeile hervor. */
  aktivStelle: { token: string; rang: number } | null;
  /** H2 · Fundstellen EINES Artikels auf Abruf (nur fuer aufgeklappte Artikel). */
  fundstellenFuer: (token: string) => ArtikelFundstelle[];
  springeZuFundstelle?: (delta: number) => void;
  springeZuTreffer?: (token: string) => void;
  /** H2 · Sprung zu GENAU einer Fundstelle (Artikel + Rang darin). */
  springeZuStelle?: (token: string, rang: number) => void;
  /** «Art. 429» → Token. `undefined`, solange der Snapshot fehlt. */
  loeseArtikel?: (eingabe: string) => string | null;
  siePfad: string[];
  siePfadArtikel: string | null;

  /** Sprünge. Beide sind die EINZIGEN Bewegungs-Auslöser der Hülle. */
  springeZuArtikel: (token: string) => void;
  springeZuSektion: ReturnType<typeof useSektionSprung>;
  zumAnfang: () => void;

  /** «Weiterlesen»-Angebot (R4) und Basispfad für Permalinks. */
  weiterlesen: LesePosition | null;
  weiterlesenSprung: () => void;
  weiterlesenVerwerfen: () => void;
  basisPfad: string;

  /** Flüchtige Bestätigung nach «In neuem Reiter». */
  reiterToast: boolean;
  setReiterToast: Dispatch<SetStateAction<boolean>>;

  /** Die Refs GEBÜNDELT, nicht als lose Felder neben den Daten. Zwei Gründe, der
   *  erste gemessen: `react-hooks/refs` sieht einem flachen Objekt nicht an,
   *  welches Feld ein Ref ist, und meldete JEDEN Modell-Zugriff als «Ref-Zugriff
   *  im Render» (10 Fehler, 16.8.2026). Der zweite ist der eigentliche: Daten und
   *  veränderliche Zeiger sind zwei Dinge — wer sie mischt, lädt genau die
   *  Verwechslung ein, vor der die Regel warnt. */
  refs: {
    /** Registrierte Sektions-Elemente (Sprungziele des Baums). */
    sekRef: MutableRefObject<Map<string, HTMLElement>>;
    /** Dialog-Ref des Bottom-Sheets (Fokusfang, Esc, Rückgabe). */
    tocDrawerRef: RefObject<HTMLDivElement | null>;
    /** Wurzel der Lesespalte — Beobachtungsraum des Treffer-Highlights. */
    leseRef: RefObject<HTMLDivElement | null>;
    /** Timer der «In neuem Reiter»-Bestätigung. */
    reiterToastTimerRef: MutableRefObject<number | null>;
  };
}

/** Nur was der Rahmen zusätzlich zum Modell braucht, um den Kontext zu füllen. */
export interface LeserV3Umgebung {
  imPane: boolean;
  istSekundaer: boolean;
  wurzel: RefObject<HTMLElement | null> | null;
  overlayWurzel: RefObject<HTMLElement | null> | null;
  istXl: boolean;
}

export function useLeserV3Modell({ ebene: routenSegment, schluessel }: { ebene: string; schluessel: string }):
{ modell: LeserV3Modell; umgebung: LeserV3Umgebung } {
  const basisPfad = basisAdresse(routenSegment, schluessel);
  const navigate = useNavigate();
  const location = useLocation();

  // ── Zustand (drei kontigue Blöcke, Reihenfolge wie in der Ist-Hülle) ───────
  const {
    erlass, setErlass, eintraege, setEintraege, struktur, setStruktur, kopf, setKopf,
    manifest, setManifest, currency, setCurrency,
    revisionFuer, historieFuer, nichtKonsolidiert, nichtKonsolidiertSeit,
    // Als `…Ref` benannt: die Lint-Regel `react-hooks/immutability` erkennt
    // einen Ref am Namen, und dieser wird beschrieben.
    fehler, setFehler, reiterToast, setReiterToast, reiterToastTimer: reiterToastTimerRef,
    suche, setSuche, sucheDebounced, scrollVorSucheRef, sucheVorherRef,
    // H3 · Panel-Nachladen (Kap. 7): kein Bezugs-Shard beim Seitenaufruf. Die
    // Rechtsprechung steht im Panel und lädt beim Öffnen (`./panelModell`).
  } = useLeserZustand({ bezuegeVorladen: false });
  const {
    offen, setOffen, tocBaum, setTocBaum, tocToggleGruppe, merkeSprungAst, aktivIds, setAktivIds, tocAuf, setTocAuf,
    jumpLockRef, autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef,
  } = useLeserTocZustand();
  const {
    tocOffen, setTocOffen, istXl, imPane, wurzel, overlayWurzel, istSekundaer,
    meldeInhaltsKopf, aktArtikel, setAktArtikel, kantonSys, setKantonSys, kantonLuecken, setKantonLuecken,
    sekRefs, tocDrawerRef, tabArtikelTimer, aktArtikelTimer, tocBaumTimer, tocTouchRef,
  } = useLeserAnsichtZustand({ tocAuf, setTocAuf });

  useLeserDaten({
    ebene: routenSegment, schluessel, navigate, erlass, istSekundaer, meldeInhaltsKopf,
    setManifest, setCurrency, setStruktur, setKopf, setKantonSys, setKantonLuecken, setErlass, setEintraege, setFehler,
  });

  // ── Ableitungen ───────────────────────────────────────────────────────────
  const { sektionen, ohneGliederung } = useMemo(
    () => (eintraege ? baueGliederungsbaum(eintraege, struktur) : { sektionen: [], ohneGliederung: [] }),
    [eintraege, struktur],
  );
  const tocSektionen = useMemo(() => kuratiereTocSektionen(sektionen), [sektionen]);
  const gliederung = useMemo(
    () => baueGliederungsModell({
      sektionen: tocSektionen, ohneGliederung, eintraege: eintraege ?? [], struktur,
      startSichtbarGo: true,
    }),
    [tocSektionen, ohneGliederung, eintraege, struktur],
  );
  useEffect(() => {
    if (eintraege && gliederung.leisteStartetZu) setTocOffen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erlass?.key, eintraege, gliederung.leisteStartetZu]);

  const alleKnotenIds = useMemo(() => {
    const ids: string[] = [];
    const geh = (knoten: readonly GliederungsKnoten[]) => {
      for (const k of knoten) { if (k.kinder.length > 0) { ids.push(k.id); geh(k.kinder); } }
    };
    geh(gliederung.knoten);
    return ids;
  }, [gliederung.knoten]);

  const kantonErlassAnzahl = useMemo<number | null>(() => {
    const kanton = erlass?.kanton;
    if (!kanton || !manifest) return null;
    return manifest.erlasse.reduce((n, e) => (e.kanton === kanton ? n + 1 : n), 0);
  }, [erlass?.kanton, manifest]);
  const gliederungsTiefe = useMemo(() => strukturTiefe(struktur), [struktur]);
  const fussnotenAnzahl = useMemo<number | null>(() => {
    if (!struktur) return null;
    let n = 0;
    for (const v of Object.values(struktur)) n += v?.fussnoten?.length ?? 0;
    return n;
  }, [struktur]);
  // D1/D35-F3: EINE Zählung, zwei Leser (§5) — «wird die Wahl angeboten?» und «dämpft «Fassung» hier etwas?».
  const aenderungsFussnoten = useMemo(() => zaehleAenderungsvermerke(struktur), [struktur]);
  // W2·26/Z8 · dritter Träger «trägt der Erlass überhaupt Fussnoten?», Kopf mitgezählt (253 Erlasse führen NUR Kopf-Fussnoten, 11.9.2026); Herleitung an `bieteAenderungsvermerkeSchalter`.
  const hatAenderungsvermerke = useMemo(() => bieteAenderungsvermerkeSchalter(aenderungsFussnoten,
    (eintraege ?? []).some((e) => historieFuer(e.artikel) !== undefined), eintraege !== null,
    struktur || kopf ? (fussnotenAnzahl ?? 0) + (kopf?.fussnoten?.length ?? 0) : null), [aenderungsFussnoten, eintraege, historieFuer, struktur, kopf, fussnotenAnzahl]);

  // ── A-2 · DIE MELDUNG AN DIE APP-LEISTE IST WEG (David 17.8.2026) ──────────
  // Hier stand bis 17.8. ein Effekt, der Krume · Stand · laufenden Artikel an
  // die App-Krumen-Leiste meldete — die dieselben drei Angaben 37 px über der
  // V3-Kopfzeile ein zweites Mal ausgab (gemessen @1440: zwei `nav`-Krumen,
  // zwei ✕). Die Leiste entfällt; damit hat KEINE der drei Angaben mehr einen
  // Leser, und sie werden gestrichen statt weitergemeldet (§17 Rückbau).
  // Was übrig bleibt, ist ein einziger, datenunabhängiger Satz («ich trage die
  // Kopfzeile selbst») — und der steht bewusst NICHT hier, sondern im
  // Einsprungspunkt `../../GesetzLeser.tsx` (bis H5, 21.8.2026: `GesetzLeserV3.tsx`): dieses Modell läuft erst, wenn der
  // lazy Rahmen-Chunk da ist, und bis dahin rendert die Shell die Leiste, die
  // danach 37 px zusammenfällt (gemessen: 19 Frames, CLS 0.030 statt 0.005).
  // Die Rücknahme beim Verlassen bleibt geteilt (`useLeserDaten`, ein
  // `meldeInhaltsKopf(null)` beim Abbau — darum wird der Wert weiter durchgereicht).

  const { sekPos, artIndex, sektionMeta, artLabelByToken, margAnzeige } = useArtikelAbleitungen({
    sektionen, eintraege, struktur,
  });

  // ── Artikel-Sprung: der EINE erlaubte Adress-Schreiber (LM-202) ───────────
  // `replaceState`, nie `pushState`, nie eine direkte Hash-Zuweisung; und nur
  // aus dem primären Pane (die Rolle unterscheidet, nicht `imPane` — B1-Falle).
  // Quellensonde: `src/tests/leser-v3-adresse.test.ts`.
  const springeZuArtikel = useCallback((token: string) => {
    scrollVorSucheRef.current = null;
    setSuche('');
    // B1: das Gliederungs-BLATT geht mit zu — Befund, Messreihe und die
    // §7-Abweichung zum genannten Fundort stehen in `e2e/leser-v3-h4-gliederungswege`.
    setTocAuf(false);
    const ids = pfadZu(sektionen, (s) => s.artikel.some((e) => e.artikel === token)) ?? [];
    if (ids.length) {
      setOffen((o) => { const n = { ...o }; for (const id of ids) n[id] = true; return n; });
      merkeSprungAst(ids); // Fehlerbuch 15.9.2026: hier stand nur `manuellZu.delete` — der Ast war danach ungeschützt (`../sprungAst`)
      if (tocBaumTimer.current != null) window.clearTimeout(tocBaumTimer.current);
      setAktivIds(ids);
      setTocBaum((o) => ({ ...o, ...Object.fromEntries(ids.map((id) => [id, true])) }));
      jumpLockRef.current = true;
    } else {
      // F2: Artikel ohne amtliche Sektion — der synthetische Pfad kommt aus
      // demselben Modell, das auch der Scroll-Spy auflöst (§5).
      const synth = findeSynthPfad(gliederung.knoten, token);
      if (synth) {
        if (tocBaumTimer.current != null) window.clearTimeout(tocBaumTimer.current);
        setAktivIds(synth);
      }
    }
    if (typeof window === 'undefined') return;
    if (!istSekundaer) {
      const ziel = `${basisPfad}${window.location.search}#art-${token}`;
      window.history.replaceState(null, '', ziel);
      aktualisiereTabArtikel(ziel);
    }
    const scrolle = () => {
      const el = findeArt(paneRoot(imPane, wurzel), token);
      if (!el) return;
      // R1: an den oberen Lese-Rand (`block:'start'` + `.nt-anker`-scroll-margin
      // aus `--nt-stick`). In V3 rechnet `--nt-stick` die eigene Kopfhöhe mit —
      // der Sprung landet unter der klebenden Zeile, nicht dahinter.
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
      el.classList.add('lc-ziel-blink');
      window.setTimeout(() => el.classList.remove('lc-ziel-blink'), 2400);
    };
    window.requestAnimationFrame(() => window.setTimeout(() => {
      scrolle();
      window.setTimeout(() => { scrolle(); jumpLockRef.current = false; loeseSpyNachlauf(); }, 400);
    }, 110));
    // Deps byte-gleich zur Ist-Hülle (Setter/Refs sind stabil, Herleitung dort).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sektionen, basisPfad, istSekundaer, imPane, wurzel, gliederung.knoten]);

  const { tokenByLabel, aktivToken, artTokens } = useArtikelTokens({ artLabelByToken, eintraege, aktArtikel });
  const { weiterlesen, weiterlesenSprung, weiterlesenVerwerfen } = useWeiterlesen({
    erlass, eintraege, istSekundaer, locationHash: location.hash, aktArtikel, aktivToken, springeZuArtikel,
  });

  const springeZuSektion = useSektionSprung({
    sektionen, sekRefs, location, istSekundaer, imPane, wurzel, sucheDebounced, springeZuArtikel,
    setOffen, setTocBaum, setAktivIds, setTocAuf, scrollVorSucheRef, sucheVorherRef,
    // Pos. 14: Suche beginnen ODER beenden bewegt den Lesetext um 0 px. Die
    // Ist-Hülle scrollt an beiden Punkten (an den Anfang, dann zurück) — der
    // Anlass dafür (gefilterte, geschrumpfte Lesespalte) besteht in V3 nicht.
    // Herleitung am Effekt in `inhalt-sprung.tsx`, Beweis `leser-v3-esc-ohne-sprung`.
    scrollBeiSuchwechsel: false,
    refs: { jumpLockRef, autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef, tocBaumTimer },
  });
  const internRefs = useInternRefs({ eintraege, basisPfad, springeZuArtikel, istSekundaer, navigate, erlassKuerzel: erlass?.kuerzel, manifestErlasse: manifest?.erlasse, kanton: erlass?.kanton }); // V-2 · V-3 (Manifest/Kanton = Rohstoff der Kürzel-Karte)

  useLeserSprungSpy({
    ebene: routenSegment, schluessel, eintraege, sektionen, ohneGliederung, istSekundaer, imPane, wurzel,
    paneLocationHash: location.hash, paneLocationSearch: location.search, basisPfad,
    offen, sucheDebounced, aktivIds, tocBaum,
    gliederungsKnoten: gliederung.knoten, umhaengPraefix: gliederung.umhaengPraefix,
    istXl, tocOffen, artLabelByToken, setOffen, setAktArtikel, setAktivIds, setTocBaum,
    refs: {
      jumpLock: jumpLockRef, autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef,
      tocBaumTimer, tabArtikelTimer, aktArtikelTimer, tocTouchRef,
    },
  });

  // ── Suche & Treffer ───────────────────────────────────────────────────────
  const sucheTrim = sucheDebounced.trim().toLowerCase();
  const { vorher, nachher } = useNachbarn({ manifest, erlass });
  const sucheFeldLeer = suche.trim() === '';
  // H2: der Suchbereich ist Hüllen-Zustand. Er steht HIER und nicht in der
  // Trefferliste, weil er in die Datenableitung eingeht (`useSuchTreffer`) und
  // nicht bloss die Darstellung filtert — die Liste bekommt ihn als Prop (§3).
  const [suchBereich, setzeSuchBereich] = useState<SuchBereich>('alles');
  // ── W2·28 · L-2 · DER SCHALTER FÄLLT MIT DER SUCHE ZURÜCK ──────────────────
  // Geprüft wird das beim RENDER, nicht in einem Effekt (dasselbe Muster wie der
  // Gültigkeits-Schlüssel der Treffer-Navigation, `inhalt-suchtreffer.tsx`):
  // ein Effekt, der den Schalter zurücksetzt, wäre ein Kaskaden-Render
  // (react-hooks/set-state-in-effect) und liesse ihn einen Frame lang falsch
  // stehen. Wer das Feld leert, bekommt beim nächsten Suchen wieder
  // Hervorhebung und Marken — ein Schalter, der stumm über Suchen hinweg
  // wirkte, liesse Treffer verschwinden, ohne dass jemand ihn gesetzt zu haben
  // glaubt (§8, dieselbe Begründung wie beim Suchbereich).
  const [markenAusRoh, setzeMarkenAus] = useState(false);
  const markenAus = !sucheFeldLeer && markenAusRoh;
  const {
    leseRef, treffer, fundstellen, aenderungenAus, trefferPos, aktivToken: trefferAktivToken,
    springeZuFundstelle, springeZuTreffer, springeZuStelle, aktivStelle, fundstellenFuer,
    loeseArtikel, siePfad, siePfadArtikel,
  } = useSuchTreffer({
    erlassKey: erlass?.key ?? null, eintraege, struktur,
    sucheTrim, sucheFeldLeer, sektionen, aktivIds, internRefs, aktArtikel, tokenByLabel,
    offen, setOffen, imPane, wurzel, bereich: suchBereich, markenAus,
  });

  // ── W2·28 · L-1 · Die Landkarten-Spur ──────────────────────────────────────
  // LAZY wie der Suchindex (§15, dieselbe Grenze): der Lauf über alle Artikel
  // entsteht erst, wenn wirklich gesucht wird, und wird mit dem Erlasswechsel
  // bzw. dem Ende der Suche freigegeben. Gemessen (Node, BGFA/OR-Grössenordnung)
  // ist er billiger als der Indexaufbau daneben — er liest nur Textlängen.
  const landkarte = useMemo(
    () => (sucheTrim !== '' && eintraege ? landkarteSpur(gesetzLandkarteEinheiten(eintraege, struktur)) : []),
    [sucheTrim, eintraege, struktur],
  );

  // «↑ Anfang» — genau EIN Knopf pro Seite (Pos. 15). Bezugsraum ist derselbe,
  // den auch der Artikel-Sprung auflöst (§5): im Pane der Pane-Scroller, sonst
  // das Fenster.
  const zumAnfang = useCallback(() => {
    const paneEl = paneRoot(imPane, wurzel);
    if (paneEl) paneEl.scrollTo({ top: 0, behavior: 'auto' });
    else window.scrollTo({ top: 0, behavior: 'auto' });
  }, [imPane, wurzel]);

  const sucheBegriff = sucheDebounced.trim();

  return {
    modell: {
      erlass, eintraege, struktur, kopf, currency, fehler, manifest, kantonSys, kantonLuecken,
      sektionen, ohneGliederung, gliederung, alleKnotenIds,
      gliederungsTiefe, fussnotenAnzahl, hatAenderungsvermerke, kantonErlassAnzahl,
      nichtKonsolidiert, nichtKonsolidiertSeit,
      vorher, nachher,
      sekPos, artIndex, sektionMeta, margAnzeige, internRefs,
      revisionFuer, historieFuer,
      aktArtikel, aktivToken, artTokens, aktivIds, offen, setOffen, tocBaum, setTocBaum,
      tocToggleGruppe,
      tocOffen, setTocOffen, tocAuf, setTocAuf,
      suche, setSuche, sucheAktiv: sucheBegriff !== '', sucheBegriff,
      treffer, fundstellen, aenderungenAus, trefferPos, trefferAktivToken,
      suchBereich, setzeSuchBereich, landkarte, markenAus, setzeMarkenAus,
      aktivStelle, fundstellenFuer,
      springeZuFundstelle, springeZuTreffer, springeZuStelle, loeseArtikel, siePfad, siePfadArtikel,
      springeZuArtikel, springeZuSektion, zumAnfang,
      weiterlesen, weiterlesenSprung, weiterlesenVerwerfen, basisPfad,
      reiterToast, setReiterToast,
      refs: { sekRef: sekRefs, tocDrawerRef, leseRef, reiterToastTimerRef },
    },
    umgebung: { imPane, istSekundaer, wurzel, overlayWurzel, istXl },
  };
}
