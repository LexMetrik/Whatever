import { useEffect, useRef, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from 'react';
import { flushSync } from 'react-dom';
import type { NavigateFunction } from 'react-router-dom';
import { aktualisiereTabArtikel, tabSchluessel } from '../../lib/tabs';
import { merkeAnker, bezugslinie, ankerLandepunkt } from './scrollAnker';
import { aktiverArtikel } from '../../lib/normtext/aktuellerArtikel';
import { useMeldeInhaltsKopf } from '../../components/layout/InhaltsKopfKontext';
import {
  ladeBrowseManifest, ladeErlass, ladeErlassDatei, ladeStruktur, ladeErlassKopf, ladeKantonSystematik, ladeCurrency,
  ladeKantonLuecken,
  type Sektion, type StrukturMap, type ErlassKopf, type CurrencyMap, type KantonLueckenMap,
} from '../../lib/normtext/browse';
import type { KantonSystematik } from '../../lib/normtext/systematik';
import { pfadZu, tabTitel } from './helpers';
import { useTieflinkSprung } from './inhalt-hooks-tieflink';
import { paneRoot, findeArt } from './berechnungen';
import { findeSynthPfad, uebersetzeRohPfad, type GliederungsKnoten } from './gliederungsModell';
import { planeZuklappen, retteFokusVorZuklapp, scrollRuht, AUTO_AUF_RUHE_MS } from './tocAutoZuklappen';
import { darfAutoAdoptieren } from './sprungAst';
import { mitlaufenKarte } from './klappKarte';
import type { BrowseErlass, BrowseManifest } from '../../lib/normtext/browse-typen';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { datenEbeneVonRoute, erlassPfad } from '../../lib/normtext/erlassAdresse';

// ═══ ABSCHNITT · Reader-Effekt-Hooks (§6.6-Split, W2·12-HYGIENE/B24) ═════════
// Aus GesetzLeserInhalt ausgelagerte, side-effect-reine Custom-Hooks: die
// Daten-/Kopf-/Sprung-/Scroll-Spy-Effekte. VERHALTENSNEUTRAL: jeder Effekt +
// jede Dependency-Liste ist byte-identisch zum früheren Inline-Code; die
// HOOK-REIHENFOLGE bleibt erhalten, weil GesetzLeserInhalt diese Hooks an
// EXAKT derselben Position ruft, an der die Effekte vorher standen (kontiguer
// Effektblock je Hook, saubere Zustands-/Effekt-Grenze). Keine Rechtsregel,
// kein Normtext, keine Reihenfolge der Logik verändert.

type MeldeKopf = ReturnType<typeof useMeldeInhaltsKopf>;

// `useIsoLayoutEffect` (Layout-Effekt im Browser, gewöhnlicher Effekt im
// Prerender) wurde nur vom Tieflink-Sprung gebraucht und steht seit dem
// §6.6-Split mit ihm in `./inhalt-hooks-tieflink.tsx`.

// Auto-Zuklappen des Gliederungsbaums (F2): Nachlauf-Fenster, Fallback-Schalter
// und die Lage-Entscheidung leben seit W2·19-GLIEDERUNG/S5 in ./tocAutoZuklappen —
// mitsamt der Provenienz des 19.7.-Wächters und den Messreihen dahinter.

// ── N2 (§17-Wurzelfix, Bug-Check 3.8.2026): Spy-Nachlauf nach dem jumpLock ────
// `auswerten` bricht ab, solange `jumpLock` steht (Klick-/TOC-Sprung, §15.2), und
// plante bisher NICHTS nach. Der Lock fällt 400/500 ms nach dem Sprung per Timer —
// ohne Scroll-Ereignis und ohne Observer-Meldung (der Sprung-Scroll ist da längst
// eingelaufen) blieb der Kopf danach bis zur nächsten NUTZER-Bewegung auf dem
// Artikel VOR dem Sprung stehen. Der Wächter sah das nicht, weil er nach dem
// Sprung 150 px scrollte und damit selbst den fehlenden Auslöser lieferte.
// Fix an der Wurzel: wer den Lock löst, meldet es hier — jeder montierte Spy holt
// genau eine Auswertung nach (derselbe rAF-Kranz, also nie zwei pro Frame; ohne
// Token-Wechsel erzeugt sie null Renders). Modul-lokale Registry statt neuem Ref
// durch drei Signaturen: hält den Diff in `inhalt.tsx` auf die Lock-Stellen
// begrenzt. Mehrere Instanzen (Split-View-Panes) registrieren sich einzeln; jede
// prüft in `auswerten` ihren EIGENEN Lock, ein fremdes Lösen weckt sie höchstens
// zu einer Neuberechnung ihres unveränderten Tokens (no-op).
const spyNachlauf = new Set<() => void>();

/** Nach dem Zurücksetzen von `jumpLock` aufrufen: plant je Spy eine Auswertung. */
export function loeseSpyNachlauf(): void {
  for (const planen of spyNachlauf) planen();
}

// ── Datenladung + Browser-Tab-Titel + Kopf-Aufräumen ─────────────────────────
export function useLeserDaten(opts: {
  ebene: string;
  schluessel: string;
  navigate: NavigateFunction;
  erlass: BrowseErlass | null;
  istSekundaer: boolean;
  meldeInhaltsKopf: MeldeKopf;
  setManifest: Dispatch<SetStateAction<BrowseManifest | null>>;
  setCurrency: Dispatch<SetStateAction<CurrencyMap | null>>;
  setStruktur: Dispatch<SetStateAction<StrukturMap | null>>;
  setKopf: Dispatch<SetStateAction<ErlassKopf | null>>;
  setKantonSys: Dispatch<SetStateAction<Record<string, KantonSystematik>>>;
  setKantonLuecken: Dispatch<SetStateAction<KantonLueckenMap>>;
  setErlass: Dispatch<SetStateAction<BrowseErlass | null>>;
  setEintraege: Dispatch<SetStateAction<NormSnapshot[] | null>>;
  setFehler: Dispatch<SetStateAction<boolean>>;
}): void {
  const {
    ebene, schluessel, navigate, erlass, istSekundaer,
    setManifest, setCurrency, setStruktur, setKopf, setKantonSys, setKantonLuecken, setErlass, setEintraege, setFehler,
  } = opts;

  useEffect(() => {
    let lebt = true;
    void ladeBrowseManifest().then((m) => { if (lebt) setManifest(m); });
    void ladeCurrency().then((c) => { if (lebt) setCurrency(c); });
    // `ebene` ist die ROUTEN-Ebene aus der Adresse; die Dateien liegen unter der
    // DATEN-Ebene (Befund 45: `/gesetze/international/CISG` lädt
    // `/normtext/struktur/bund/CISG.json`). Ohne diese Übersetzung wäre der Umzug
    // ein STILLER Fehler — 404 auf das Sidecar heisst `null`, also Leser ohne
    // Gliederung und ohne Erlass-Kopf, während die Seite sonst normal aussieht.
    const daten = datenEbeneVonRoute(ebene);
    void ladeStruktur(daten, schluessel).then((s) => { if (lebt) setStruktur(s); });
    void ladeErlassKopf(daten, schluessel).then((k) => { if (lebt) setKopf(k); });
    // N13: Systematik-Bäume nur für die Kanton-Lesesicht laden; fehlen sie, bleibt
    // die Overline ohne Sachgebiet (§8 — nichts Erfundenes).
    if (daten === 'kanton') void ladeKantonSystematik().then((s) => { if (lebt) setKantonSys(s); });
    // §8-Nachzug (PR #614-Auflage): Erlass-Lücken ebenso nur für Kanton laden —
    // der Bund trägt keine Einträge (§15, kein Zusatz-Fetch).
    if (daten === 'kanton') void ladeKantonLuecken().then((l) => { if (lebt) setKantonLuecken(l); });
    void ladeErlass(schluessel).then(async (e) => {
      if (!lebt) return;
      if (!e) {
        // W2·10-UI-NAV/N0b: Key case-insensitiv gegen das Register auflösen und auf
        // die kanonische URL umleiten (/gesetze/bund/or → /gesetze/bund/OR). Nur bei
        // EINDEUTIGEM Case-Treffer (kein Rate-Sprung); sonst ehrliche Fehlseite.
        const m = await ladeBrowseManifest();
        if (!lebt) return;
        const roh = schluessel.toLowerCase();
        const kandidaten = m?.erlasse.filter((x) => x.key.toLowerCase() === roh) ?? [];
        if (kandidaten.length === 1) {
          const ziel = kandidaten[0];
          navigate(erlassPfad(ziel), { replace: true });
          return;
        }
        setFehler(true);
        return;
      }
      // pdf-embed: kein Snapshot-JSON — Erlass setzen, der Reader rendert das
      // eingebettete amtliche PDF (eintraege bleibt null).
      if (e.status === 'pdf-embed') { setErlass(e); return; }
      // LIVE_VERWEIS (⑧, W2·5d G3a): kein In-App-Volltext gehostet — Erlass setzen,
      // der Reader zeigt eine ehrliche Verweiskarte (amtlicher Live-Link + Stand,
      // §8) statt der «nicht verfügbar»-Fehlerseite. eintraege bleibt null.
      if (e.status === 'nur-live-link') { setErlass(e); return; }
      if (!e.datei) { setFehler(true); return; }
      setErlass(e);
      const datei = await ladeErlassDatei(e.datei);
      if (!lebt) return;
      if (!datei) { setFehler(true); return; }
      setEintraege(datei.eintraege);
    });
    return () => { lebt = false; };
    // Setter/navigate sind stabil; Deps bewusst auf [ebene, schluessel] gehalten
    // (byte-identisch zum früheren Inline-Effekt — kein Re-Fetch bei Render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebene, schluessel]);

  // Browser-Tab zeigt den Erlass: «OR (Obligationenrecht) — LexMetrik». Der
  // Wortlaut samt Redundanz-Weiche («EMRK (EMRK)» → «EMRK», Fehlerbuch-Befund,
  // auf Prod reproduziert 29.8.2026) steht als reine Funktion in
  // `./helpers` (`tabTitel`) — rein, prüfbar, und ausserhalb des Risikopfads
  // lib/normtext/ (§3; Begründung am Fundort).
  //
  // ACHTUNG beim Weiterbauen: `src/tests/tab-titel-paritaet.test.ts` ist eine
  // Quellensonde. Sie sucht die ERSTE Titel-Zuweisung in dieser Datei und prüft
  // in den 400 Zeichen davor die Guard-Parität mit dem Entscheid-Leser. Daraus
  // folgen zwei Regeln für diese Stelle: (1) der `istSekundaer`-Guard bleibt
  // unmittelbar vor der Zuweisung — erklärender Text gehört HIERHER, nicht in
  // den Effekt-Rumpf; (2) die gesuchte Zeichenfolge darf in keinem Kommentar
  // dieser Datei auftauchen, sonst verankert sich die Sonde am Kommentar und
  // wird rot (genau so passiert beim Bau dieses Fixes, 29.8.2026).
  useEffect(() => {
    if (!erlass || typeof document === 'undefined') return;
    if (istSekundaer) return; // sekundäres Pane treibt den Browser-Tab-Titel nicht (B-2.5)
    document.title = tabTitel(erlass.kuerzel, erlass.titel);
  }, [erlass, istSekundaer]);

  // A/A2/A3/F: Kopf melden — die Meldung selbst steht in useInhaltsKopfMeldung (nach
  // `fussnotenAnzahl`, das der A26-Ansicht-Slot braucht; TDZ).
  //
  // DAS UNMOUNT-CLEANUP `meldeInhaltsKopf(null)` IST GESTRICHEN (Cowork-Befund
  // 1/53, Fix 21.8.2026). Es war doppelt («Shell setzt bei Routenwechsel ohnehin
  // zurück», stand hier wörtlich) und WISCHTE in V3 die Kopf-Reservierung weg:
  // beim Erlass-Wechsel remountet der Modell-Baum, `useKopfAnspruch` meldet im
  // Layout-Effekt (vor dem Paint) — dieses passive Cleanup des ALTEN Baums lief
  // danach und setzte den Slot auf null → die App-Leiste erschien laut über der
  // V3-Werkzeugleiste. Ein Unmount OHNE Pfadwechsel existiert in der
  // Einzelansicht nicht; im Split fängt der Pane-Provider die Meldung.
  // Rot-Beweis: `e2e/leser-v3-eine-kopfzeile.e2e.ts` (j).
}

// ── Kopf-Meldung (Breadcrumb · Stand · Live-Artikel · Ansicht + Suche) ───────
// W2·19-GLIEDERUNG/S9 (§6.6-Split, Schlankheits-Schwelle): nach dem
// Schwachstelle-8-Fix (`zeigeGliederung` auf `eintraege.length` statt
// `sektionen.length`) stand diese Datei bei 804/800 Zeilen. Der Hook stand
// bis H5 (21.8.2026) unverändert byte-gleich ausgelagert in der
// Ist-Hüllen-Fassade `./inhalt-kopfmeldung.tsx` (mit ihr gelöscht) —
// V3 trägt die Kopf-Meldung seither über den eigenen Weg
// (`GesetzLeser.tsx`/`v3/LeserKopf.tsx`).
//
// DER RE-EXPORT IST SEIT LANGEM WEG (Architektur-Review A1, 16.8.2026): er
// hielt einst den Importpfad `from './inhalt-hooks'` bequem stabil, zog dafür
// aber `inhalt-kopfmeldung` — und damit die Ist-Hüllen-Menükomponenten — in
// jeden Importeur dieser Datei, auch den V3-Adapter. Bewacht wurde das von der
// transitiven Sonde in `src/tests/leser-v3-fundament.test.ts` (einmal rot
// gezeigt, §6.7); mit H5 ist der ganze bewachte Weg entfallen.

// ── Hash-Sprung-Seed + geteilter Aktiv-Artikel-Beobachter (Scroll-Spy) + TOC-
//    Mitscroll + Nutzer-Interaktions-Guard + Scroll-Anker ──────────────────────
export function useLeserSprungSpy(opts: {
  ebene: string;
  schluessel: string;
  eintraege: NormSnapshot[] | null;
  sektionen: Sektion[];
  ohneGliederung: NormSnapshot[];
  istSekundaer: boolean;
  imPane: boolean;
  wurzel: RefObject<HTMLElement | null> | null;
  paneLocationHash: string;
  /** LM-179 (Fahrplan B5, §6): pane-eigenes `location.search` (aus dem Pane-
   *  internen Navigator, `UNSAFE_NavigationContext` in Pane.tsx) statt
   *  `window.location.search`, das im Sekundär-Pane immer die Haupt-URL
   *  liefert — bei einer Zweitinstanz (`?r=2`) also den falschen Reiter
   *  träfe. */
  paneLocationSearch: string;
  basisPfad: string;
  offen: Record<string, boolean>;
  sucheDebounced: string;
  aktivIds: string[];
  tocBaum: Record<string, boolean>;
  /** W2·19-GLIEDERUNG/S5: die gerenderten Zeilen des Modells — nur zum Auflösen
   *  der SYNTHETISCHEN Zeilen (Vorspann/Nachspann/Mittelgruppen/Anhänge), s.
   *  findeSynthPfad. */
  gliederungsKnoten: GliederungsKnoten[];
  /** B4: Rohpfad→Modellpfad des Modells (`GliederungsModell.umhaengPraefix`). */
  umhaengPraefix: Record<string, string[]>;
  istXl: boolean;
  tocOffen: boolean;
  artLabelByToken: Map<string, string>;
  setOffen: Dispatch<SetStateAction<Record<string, boolean>>>;
  setAktArtikel: Dispatch<SetStateAction<string | null>>;
  setAktivIds: Dispatch<SetStateAction<string[]>>;
  setTocBaum: Dispatch<SetStateAction<Record<string, boolean>>>;
  refs: {
    jumpLock: MutableRefObject<boolean>;
    autoOffenRef: MutableRefObject<Set<string>>;
    autoTickRef: MutableRefObject<Map<string, number>>;
    autoTickNowRef: MutableRefObject<number>;
    manuellOffenRef: MutableRefObject<Set<string>>;
    manuellZuRef: MutableRefObject<Set<string>>;
    tocBaumTimer: MutableRefObject<number | null>;
    tabArtikelTimer: MutableRefObject<number | null>;
    aktArtikelTimer: MutableRefObject<number | null>;
    tocTouchRef: MutableRefObject<number>;
  };
}): void {
  const {
    ebene, schluessel, eintraege, sektionen, ohneGliederung, istSekundaer, imPane, wurzel,
    paneLocationHash, paneLocationSearch, basisPfad, offen, sucheDebounced, aktivIds, tocBaum, gliederungsKnoten, umhaengPraefix, istXl, tocOffen,
    artLabelByToken, setOffen, setAktArtikel, setAktivIds, setTocBaum, refs,
  } = opts;
  const {
    jumpLock, autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef,
    tocBaumTimer, tabArtikelTimer, aktArtikelTimer, tocTouchRef,
  } = refs;

  // ── Tieflink-Sprung (§6.6-Split, W2·24) ──────────────────────────────────
  // Der Block stand bis hierher inline; er ist Wort fuer Wort nach
  // `./inhalt-hooks-tieflink` gezogen und wird an SEINER Stelle gerufen, damit
  // die Hook-Reihenfolge byte-identisch bleibt (dort die Herleitung).
  useTieflinkSprung({
    ebene, schluessel, eintraege, sektionen, istSekundaer, imPane, wurzel,
    paneLocationHash, artLabelByToken, setOffen, setAktArtikel, setAktivIds,
  });

  // Geteilter «aktueller-Artikel»-Beobachter (Auftrag David 26.6.2026): EIN
  // IntersectionObserver bestimmt den Artikel, der OBEN im Viewport angeschnitten
  // ist, und speist daraus zwei Konsumenten aus EINER Quelle — (a) die Gliederungs-
  // Markierung + automatisches Auf-/Zuklappen des aktiven Zweigs (P9/K) UND (b) das
  // Live-Label des aktiven Reiters «Kürzel – Art. X» (P2). IntersectionObserver
  // statt getBoundingClientRect-Schleife wegen content-visibility:auto (Off-Screen-
  // Artikel sind nur Platzhalter).
  // R1 (Auftrag David 30.6.2026): NICHT mehr der mittige Artikel, sondern der
  // ZUOBERST angeschnittene — die Bezugslinie sitzt am Sprung-Landepunkt (5rem unter
  // dem Container-Oberrand, deckungsgleich mit `.nt-anker`). Die Auswahl-Logik bleibt
  // die reine, getestete Funktion aktiverArtikel — sie wählt generisch den Artikel
  // an der Bezugslinie (§2/§3).
  // V3/H6 (W2·5d-SPY, 3.8.2026): Das Beobachtungs-Band war früher an die Linie
  // GEKOPPELT (obere ~45 % der Root-Höhe) und verfehlte sie in zwei belegten
  // Lagen; heute ist es reiner Vorfilter (ganzer Root) und die Linie entscheidet
  // allein, ausgewertet pro Scroll-Frame. Herleitung + Messprotokoll unten am
  // Observer.
  const letzterArtToken = useRef<string | null>(null);
  // ── LH (D27, Zusage 2) · DIE GESPEICHERTE LESESTELLUNG GEHÖRT DEM LESEN,
  //    NICHT DEM AUFSETZEN DES SPYS ──────────────────────────────────────────
  // BEFUND (7.9.2026, gebautes `dist/`, Preview 4417, ZGB @1440×900): 1500 px
  // scrollen ⇒ Reiter `#art-3`; Reload ⇒ ~150 ms später steht `#art-1` darin.
  // Der Leser springt beim Neustart bewusst NICHT zurück (W2·10-UI-NAV/R4,
  // `lesePosition.ts`: kein Auto-Sprung, nur ein Chip) — der Spy setzte beim
  // Aufsetzen am Dokumentanfang trotzdem `#art-1` und LÖSCHTE damit genau die
  // Stelle, die den Neustart tragen soll.
  // BISECT (je eigener Build, dieselbe Sonde, art-1.top bei scrollY 0):
  //   0ba97c5d6 (Nullprobe) 921 px ⇒ Spy meldet nichts ⇒ `#art-3` bleibt · GRÜN
  //   a60dd7f75 (D30/D31)   921 px ⇒ GRÜN
  //   7e71a5dd2 (D32/N4)    877 px ⇒ Spy meldet «1» ⇒ `#art-1` · ROT
  // D32 («Suche über dem Gesetz») hat den 44-px-Kopf aus R6d aus der Lese-
  // spalte genommen; `art-1` fällt dadurch bei 900 px Fensterhöhe wieder ÜBER
  // die Bezugslinie. Der Kopf ist damit der Auslöser, nicht die Wurzel: die
  // Wurzel ist der ungeschützte Schreibpfad unten — er hing allein an einer
  // Fensterhöhe, was seit dem F1G-Stand (877 px, dieselbe Lage) latent war.
  // REGEL: der Reiter-Anker folgt dem Lesen. Vor dem ersten Scrollen IN DIESEM
  // Dokument schreibt der Spy nichts; die Kopfzeile (Zweig (a) unten) meldet
  // «Art. 1» unverändert — sie ist Darstellung, nicht Persistenz (§3).
  const gescrollt = useRef(false);
  // Zurück auf «noch nicht gelesen», sobald ein ANDERES Dokument/Pane-Instanz
  // im Fenster steht: sonst trüge ein SPA-Wechsel die Scroll-Erlaubnis des
  // Vorgängers weiter und der neue Leser überschriebe dessen gespeicherte
  // Stelle beim Aufsetzen (genau die Kalt-/SPA-Asymmetrie des F5-Befunds).
  useEffect(() => { gescrollt.current = false; }, [basisPfad, paneLocationSearch]);
  useEffect(() => {
    // C (Auftrag David 26.6.2026): auch starten, wenn der Erlass KEINE Gliederung
    // hat (kantonale Erlasse → alle Artikel in `ohneGliederung`). Sonst lief der
    // Beobachter nie an und «aktueller Artikel» (Reiter-Live-Label, P2) blieb
    // bei Kanton stehen. Artikel tragen bei Bund UND Kanton id="art-<token>".
    if ((!sektionen.length && !ohneGliederung.length) || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const sichtbar = new Map<Element, IntersectionObserverEntry>();
    let raf = 0;
    // Zeitstempel des letzten ECHTEN Scroll-Ereignisses — das Ruhe-Tor des
    // Auto-Aufklapps liest ihn (s. u.). 0 = seit dem Aufsetzen kein Scroll.
    let letzterScroll = 0;
    const auswerten = () => {
      raf = 0;
      if (jumpLock.current) return; // während eines Klick-Sprungs nicht dazwischenfunken
      // Bezugslinie im Viewport-Koordinatensystem (getBoundingClientRect): R1 — nicht
      // mehr die Mitte, sondern eine Linie nahe dem oberen Lese-Rand, damit der zuoberst
      // angeschnittene Artikel «dran» ist. Im Pane relativ zur Pane-Oberkante, sonst
      // zum Fenster (B-2.5).
      // KRITISCH (R1×R3): Der Sprung landet den Artikel über die
      // `.nt-anker`-scroll-margin (`var(--nt-stick)`) unter dem Container-
      // Oberrand; die Bezugslinie MUSS denselben Offset treffen, sonst markiert
      // der Spy nach dem Sprung den Vorgänger. Der Offset wird darum am Anker
      // SELBST gemessen (`ankerLandepunkt`) statt als `5rem` nachgerechnet — die
      // Nachrechnung war 12 px zu klein und die Wurzel des 9.8.-Befunds
      // (Herleitung in scrollAnker.ts). N1 (§5): den Zahlenwert der Linie NICHT
      // hier zweitmalig bilden. Probe = irgendein beobachteter Artikel DIESES
      // Roots (alle tragen `.nt-anker`, der Observer sieht nur den eigenen Pane).
      const sc = paneRoot(imPane, wurzel);
      const oben = sc ? sc.getBoundingClientRect().top : 0;
      const probe = (sichtbar.keys().next().value as Element | undefined)
        ?? (sc ?? document).querySelector('[id^="art-"]');
      const bezug = bezugslinie(oben, ankerLandepunkt(probe));
      const rects = [...sichtbar.values()]
        .filter((en) => en.isIntersecting)
        .map((en) => {
          const r = en.target.getBoundingClientRect();
          return { token: (en.target as HTMLElement).id.replace(/^art-/, ''), top: r.top, bottom: r.bottom };
        });
      // ZWISCHENRAUM-REGEL (Befund David 9.8.2026, zweite Hälfte; Messprotokoll im
      // Kopf von e2e/leser-toc-sprung.e2e.ts). Zwischen zwei Artikeln steht die
      // Gliederungs-ÜBERSCHRIFT — beim OR bis 290 px hoch. Lag die Linie in einem
      // solchen Zwischenraum, wählte `aktiverArtikel` nach reiner Distanz den
      // Artikel DAVOR: der Leser stand sichtbar am Anfang des neuen Abschnitts,
      // die Leiste markierte den alten. Eine Überschrift eröffnet, was FOLGT —
      // Artikel, die oberhalb der Linie bereits GEENDET haben, zählen darum nicht
      // mehr mit, solange darunter einer folgt. Bewusst HIER, nicht in
      // `aktiverArtikel`: die reine Funktion beantwortet «welches Rechteck liegt
      // an der Linie» (§2); WELCHE zur Wahl stehen, ist Darstellung (§3).
      const nochOffen = rects.filter((r) => r.bottom > bezug);
      const token = aktiverArtikel(nochOffen.length > 0 ? nochOffen : rects, bezug);
      if (!token || token === letzterArtToken.current) return; // dedup: nur bei Wechsel
      letzterArtToken.current = token;
      // A3/F: aktuellen Artikel an den Kopf melden (Einzelansicht-Kopf ODER PaneKopf),
      // entprellt (150 ms) → coalesct schnelle Artikelgrenzen, weniger Pane-Re-Renders.
      // Echtes Label des Eintrags (deckt Schlusstitel «Art. 3» korrekt ab);
      // Fallback auf die Token-Heuristik nur, falls kein Eintrag passt.
      const artLabel = artLabelByToken.get(token) ?? `Art. ${token.replace(/_/g, '')}`;
      if (aktArtikelTimer.current != null) window.clearTimeout(aktArtikelTimer.current);
      aktArtikelTimer.current = window.setTimeout(() => setAktArtikel(artLabel), 150);
      // (b) Reiter-Live-Label: ?search (Instanz-?r) erhalten, Hash = #art-token.
      //     aktualisiereTabArtikel ist idempotent + no-op ohne passenden Reiter.
      //     Entprellt (trailing): beim schnellen Durchscrollen sonst ein
      //     localStorage-Write + globales TABS_EVENT pro Artikelgrenze.
      //
      // LM-179 (Fahrplan B5, §6): Sekundäre Panes waren hier komplett
      // ausgenommen («treibt den globalen Reiter-Tracker NICHT, es ist nicht
      // die URL») — dieselbe Fläche wie der Erlass IST aber trotzdem als
      // Reiter offen (Split-View öffnet ihn danaben, schliesst den
      // ursprünglichen Reiter nicht), und dessen Positionsangabe im
      // Reiter-Menü blieb dadurch auf dem Stand VOR dem Öffnen des Panes
      // stehen (gemessen: «Art. 366» im Menü vs. «Art. 269d» im live
      // gescrollten Pane-Kopf). `paneLocationSearch` (pane-eigenes
      // `location.search`, s. o.) macht auch für das Sekundär-Pane den
      // richtigen Reiter-Treffer möglich — ohne window.location zu lesen,
      // bleibt die Änderung rein pane-lokal/darstellend (§3).
      //     LH (s. o.): NUR nach dem ersten echten Scrollen in diesem Dokument —
      //     vor dem ersten Lese-Griff ist der gespeicherte Anker die Wahrheit.
      if (gescrollt.current) {
        const tabZiel = `${basisPfad}${paneLocationSearch}#art-${token}`;
        if (tabArtikelTimer.current != null) window.clearTimeout(tabArtikelTimer.current);
        tabArtikelTimer.current = window.setTimeout(() => aktualisiereTabArtikel(tabZiel), 200);
      }
      // (a) Gliederung: aktiven Pfad markieren + den Zweig automatisch AUFklappen
      //     und beim Verlassen wieder ZUklappen (K, Auftrag David 26.6.2026) —
      //     aber nur Zweige, die der Spy selbst geöffnet hat (autoOffenRef);
      //     manuell geöffnete bleiben offen. Der Mitscroll-Effekt hält den
      //     aktiven Eintrag dann im TOC-Container sichtbar.
      // B4 (Bug-Check 9.8.2026): `pfadZu` liefert den ROHPFAD. Ein reiner
      // Anhang-Ast steht im Rohbaum Top-Level, im Modell aber unter der Wurzel
      // «Anhänge» — ohne Übersetzung suchte die Marken-Suche den Roh-Id auf der
      // obersten Modell-Ebene, fand nichts und die Leiste blieb unmarkiert
      // (AIG/ASYLG/KKV, korpusweit 136 Erlasse mit Anhang-Ast). Die Regel, WAS
      // wohin umgehängt wurde, kennt allein das Modell (§5); hier wird sie nur
      // angewandt. Nebenwirkung mit Absicht: `gm-anhang` steht damit im aktiven
      // Pfad und wird vom Auto-Akkordeon aufgeklappt — sonst zeigte die Marke
      // auf eine Zeile in einem zugeklappten Ast.
      const ids = uebersetzeRohPfad(
        umhaengPraefix,
        pfadZu(sektionen, (s) => s.artikel.some((x) => x.artikel === token)) ?? [],
      );
      if (!ids.length) {
        // W2·19-GLIEDERUNG/S5 (Spec §3.4): der Artikel gehört zu KEINER amtlichen
        // Sektion — er liegt im Vorspann, im Nachspann oder im Anhang-Ast. Bis
        // hierher endete die Auswertung an dieser Stelle stumm, und die Leiste
        // markierte gar nichts: beim RBUE betrifft das 47 von 49 Artikeln, also
        // 96 % des Texts. Der Leser sass mitten im Erlass vor einer Gliederung,
        // die behauptete, er sei nirgends (§8). Welche Zeile den Artikel deckt,
        // weiss das Modell (`findeSynthPfad`) — hier wird nichts zweitmalig
        // zugeordnet (§5). Kein Auto-Akkordeon für diesen Fall: synthetische
        // Zeilen haben keine `sek-N`-Buchhaltung, und ihr Ast (Anhänge) folgt
        // seiner eigenen Start-Regel.
        // B6 (Bug-Check 9.8.2026): der schwebende Auto-Akkordeon-Timer wird auch
        // hier verworfen. Dieser Zweig ist eine AUTORITATIVE Meldung «der Leser
        // steht jetzt auf einer synthetischen Zeile» — lief noch ein Timer aus
        // einem früheren Artikel, überschrieb er `aktivIds` gleich wieder mit
        // dessen Sektions-Pfad, und die Dedup-Sperre (`prev === ids`) zementierte
        // die Falschmarkierung bis zum nächsten Artikelwechsel. Alle anderen
        // autoritativen Schreiber (Klick-Sprung, Sektions-Sprung) räumen den
        // Timer bereits; nur dieser tat es nicht.
        if (tocBaumTimer.current != null) window.clearTimeout(tocBaumTimer.current);
        const synth = findeSynthPfad(gliederungsKnoten, token);
        if (synth) setAktivIds((prev) => prev.length === synth.length && prev.every((v, i) => v === synth[i]) ? prev : synth);
        return;
      }
      // F3 (RC2, Auftrag David 16.7. «Gliederung springt umher»): den (a)-Block
      // (Markierung + Auto-Akkordeon) TRAILING entprellen (~200 ms, analog aktArtikel/
      // tabArtikel oben). Der Timer verarbeitet stets das ZULETZT gemeldete `ids` (jeder
      // neue Frame löscht den vorigen Timer). Wirkung: beim schnellen Durchscrollen EIN
      // Auf/Zu statt einer dichten Reflow-Folge des Baums. Der Klick-Sprung-Pfad
      // (springeZuArtikel/springeZuSektion) setzt aktivIds/tocBaum weiterhin SOFORT
      // und löscht diesen Timer (kein Kampf mit einem verspäteten Auto-Update).
      // NACHTRAG 18.9.2026: die MARKIERUNG ist aus diesem Timer herausgelöst — sie
      // ist an ihm verhungert; Herleitung und Messreihe unmittelbar unten.
      //
      // RUHE-TOR (Entscheid David 9.8.2026 (a); Herleitung bei AUTO_AUF_RUHE_MS):
      // der AUFklapp feuert nur, wenn der Dokument-Scroll ruht — sonst wird der
      // Durchlauf mit `erneut = true` neu angesetzt. Der Rest des Blocks
      // (Nachlauf-Ticks, Zuklappen) läuft unverändert weiter; `erneut` hält beim
      // Warten allein den Tick an, damit die Zuklapp-Regel ihren Takt behält.
      // Damit löst dieser Commit den a33-Zielkonflikt an der Wurzel: das Wachstum
      // im Sichtband entsteht nicht mehr während des Scrollens.

      // ── DIE MARKE SOFORT, DAS AKKORDEON ENTPRELLT (Befund David 18.9.2026) ──
      // BIS HIERHER lagen beide im selben 200-ms-Trailing-Timer. Der wird von
      // JEDEM Artikelwechsel neu angesetzt — und beim gewöhnlichen Lese-Scrollen
      // kommen die Artikelgrenzen schneller als alle 200 ms. Der Timer ist damit
      // verhungert: `setAktivIds` lief während des Lesens NIE, die Gliederung
      // zeigte keinen Standort, solange man las, und holte ihn erst nach dem
      // Anhalten nach.
      // GEMESSEN am gebauten `dist/` (vite preview, 1440×900, /gesetze/bund/OR,
      // Lese-Schritte 400 px/60 ms, Zähler im Prod-Bundle): 27 Artikelwechsel ⇒
      // 27 Neuansetzungen des Timers, `anwenden` lief GENAU EINMAL — am Schluss,
      // nach dem Anhalten. Zeitreihe über 24'000 px: 76 von 113 Proben (50-ms-
      // Takt) ohne jede Marke, erste Marke nach 3891 ms; über dieselbe Strecke
      // auf lexmetrik.vercel.app: keine einzige.
      // WARUM DEV «LIEF» UND DER WÄCHTER GRÜN BLIEB — beide halten an: der
      // Dev-Server rendert je Frame teurer, und `e2e/leser-gliederung-a33.e2e.ts`
      // (F1) wartet nach JEDEM 120-px-Schritt 260 ms. Stop-and-go lässt den Timer
      // feuern, durchgehendes Lesen nicht.
      // WURZEL: die Entprellung gehört dem AKKORDEON, nicht der Marke. Entprellt
      // wurde am 16.7.2026 der REFLOW des Baums; `setAktivIds` dagegen schreibt
      // nur Attribut und Klasse an EINER Zeile — kein Auf-/Zuklappen, keine
      // Höhenänderung, kein Layout-Thrash (§15). Sie wird darum sofort gesetzt,
      // der ganze Rest (Auto-Set, Nachlauf-Ticks, `planeZuklappen`, `setTocBaum`)
      // bleibt unverändert im 200-ms-Timer samt Ruhe-Tor.
      // Wertgleichen Pfad nicht neu setzen (pfadZu liefert stets ein neues Array):
      // sonst Re-Render + Mitscroll-Effekt bei jedem Artikel derselben Blatt-Sektion.
      setAktivIds((prev) => prev.length === ids.length && prev.every((v, i) => v === ids[i]) ? prev : ids);
      if (tocBaumTimer.current != null) window.clearTimeout(tocBaumTimer.current);
      const anwenden = (erneut: boolean) => {
        const aufklappen = scrollRuht(letzterScroll, Date.now());
        if (!aufklappen) tocBaumTimer.current = window.setTimeout(() => anwenden(true), AUTO_AUF_RUHE_MS);
        // Auto-Set fortschreiben (Seiteneffekt ausserhalb des State-Updaters, der rein
        // bleibt): aufklappen, was jetzt im Pfad liegt; zuklappen NUR, was die Lese-
        // position um AUTO_ZU_NACHLAUF Pfadwechsel hinter sich gelassen hat (§15.2: dann
        // off-screen → Zuklapp-Reflow zählt nicht; verhindert das sichtbare Auf-/Zu-
        // klappen beim Hin-und-Her-Scrollen, das auf 2-vCPU-CI das CLS-Budget riss).
        const auto = autoOffenRef.current;
        // `erneut` = Wartelauf auf Scroll-Ruhe: Tick NICHT weiterzählen, sonst
        // alterten die Äste im Leerlauf und das Zuklappen käme früher als bisher.
        const tick = erneut ? autoTickNowRef.current : ++autoTickNowRef.current;
        // Aktive Pfad-IDs auto-aufklappen — aber manuell geöffnete NICHT ins Auto-Set
        // adoptieren (die bleiben dauerhaft offen) und manuell ZUgeklappte (manuellZuRef)
        // gar nicht auto-aufklappen (explizites Einklappen des aktiven Zweigs gewinnt).
        // Jedes Aktiv-Vorkommen (inkl. Vorfahren aus pfadZu) frischt den Nachlauf-Tick.
        // Das Prädikat steht seit 15.9.2026 in `./sprungAst` — dieselbe Datei, die
        // die Sprung-Pfade verbuchen lässt. Vorher war die Regel dreimal getippt und
        // eine der drei Kopien unvollständig (Fehlerbuch-Befund, §5).
        const nutzerLager = { manuellOffen: manuellOffenRef.current, manuellZu: manuellZuRef.current };
        for (const id of ids) if (darfAutoAdoptieren(id, nutzerLager)) { if (aufklappen) auto.add(id); autoTickRef.current.set(id, tick); }
        // F2-Wurzelfix (W2·19-GLIEDERUNG/S5, Bau-Spec §3.6): welche Äste zugehen
        // dürfen und wie viel Höhe dabei OBERHALB des Sichtbands verschwindet,
        // entscheidet `planeZuklappen` — Herleitung, Provenienz des 19.7.-Wächters
        // und die Messreihen stehen dort (./tocAutoZuklappen).
        const tocCont = (paneRoot(imPane, wurzel) ?? document).querySelector('[data-toc]') as HTMLElement | null;
        const { schliessen, kompensation } = planeZuklappen({
          tocCont, auto, aktivIds: ids, tick, ticks: autoTickRef.current,
        });
        for (const id of schliessen) { auto.delete(id); autoTickRef.current.delete(id); }
        // Die Karten-Rechnung selbst ist rein und steht in ./klappKarte
        // (`mitlaufenKarte`; Wächter prüft sie in Zustandsfolgen, §6.7).
        const aktualisieren = (o: Record<string, boolean>): Record<string, boolean> =>
          mitlaufenKarte(o, { aktivIds: ids, aufklappen, manuellZu: manuellZuRef.current, schliessen });
        if (schliessen.length > 0 && tocCont) {
          // BESCHLUSS UND MUTATION IM SELBEN FRAME — der Wurzelfix des roten
          // a33-Laufs (CLS 0.0504, drei SICHTBARE Baumzeilen 280×43 → 0×0).
          //
          // Bis hierher lief nur der kompensierte Fall («Ast oberhalb») durch
          // `flushSync`; ein Ast UNTERHALB wurde per gewöhnlichem setState
          // geschlossen. React committet das später — unter 4× Drossel und
          // paralleler Last deutlich später —, und in der Zwischenzeit scrollt
          // der Leser weiter und der Mitscroll-Nudge verschiebt den Scroller.
          // Der Beschluss «dieser Ast ist ausserhalb des Sichtbands» beruhte
          // dann auf einer Geometrie, die es beim Aushängen nicht mehr gab: die
          // Zeilen verschwanden sichtbar. Die Sonde hat das ausgeschlossen, was
          // sonst naheläge — zum MESSZEITPUNKT lag in allen acht beobachteten
          // Fällen keine Kind-Zeile im Band (Beleg bei F2_SICHERHEITSSAUM).
          // Deshalb: was gemessen wurde, wird auch sofort mutiert. `flushSync`
          // ist hier keine Optimierung, sondern die Bedingung dafür, dass die
          // Messung überhaupt gilt.
          // B8 (W2·19-Bug-Check, WCAG 2.4.3): erst den Tastatur-Fokus aus dem
          // Ast holen, DANN aushängen. Steht er in einer Zeile, die gleich
          // unmountet, verlöre ihn der Browser an <body> — die Regel selbst
          // (welche Zeile ihn übernimmt) steht in ./tocAutoZuklappen, damit sie
          // ohne React prüfbar ist.
          retteFokusVorZuklapp(tocCont, schliessen);
          const vorher = tocCont.scrollTop;
          flushSync(() => setTocBaum(aktualisieren));
          if (kompensation > 0) {
            // Chromium korrigiert `scrollTop` beim Wegfall von Inhalt oberhalb
            // oft selbst (Scroll-Anchoring — der 19.7.-Kommentar sagte das
            // schon). Deshalb wird NICHT blind gegengerechnet: hat der Browser
            // den Wert bereits angefasst, bleibt es dabei; nur wenn er
            // unverändert ist, greift die eigene Korrektur. Das schliesst die
            // Doppelkompensation aus, die eine frühere Messreihe nahegelegt
            // hatte, und lässt zugleich den Nudge in Ruhe, der während des
            // Flushes gelaufen sein kann.
            if (tocCont.scrollTop === vorher) {
              tocCont.scrollTop = Math.max(0, vorher - kompensation);
            }
          }
        } else {
          setTocBaum(aktualisieren);
        }
      };
      tocBaumTimer.current = window.setTimeout(() => anwenden(false), 200);
    };
    const io = new IntersectionObserver((entries) => {
      // V3/H6 (W2·5d-SPY): NICHT-schneidende Einträge aus der Karte ENTFERNEN statt
      // sie mit `isIntersecting:false` liegen zu lassen. Sonst wuchs `sichtbar` über
      // die Lesedauer auf alle je gesehenen Artikel (OR: 1686) und jede Auswertung
      // iterierte sie alle. Fachlich identisch (der Filter unten warf sie ohnehin weg),
      // aber Voraussetzung dafür, dass `auswerten` pro Scroll-Frame billig bleibt.
      for (const en of entries) { if (en.isIntersecting) sichtbar.set(en.target, en); else sichtbar.delete(en.target); }
      if (!raf) raf = window.requestAnimationFrame(auswerten);
      // V3/H6 (W2·5d-SPY, 3.8.2026): Das Band ist nur noch VORFILTER (ganzer Root),
      // die Bezugslinie allein entscheidet. Vorher `0px 0px -55% 0px` — obere 45 %
      // der Root-Höhe. Diese Kopplung war der Härtungs-Posten aus der E7/A33-Runde
      // und ist mit Playwright reproduziert (Protokoll im PR):
      //  H6-a «Band verfehlt die Linie» — 0,45 · H_root < 5rem + 8 (Viewport 320×200
      //    ≙ 400 % Browser-Zoom nach WCAG 1.4.10, oder R3-Schriftskala 140 % auf
      //    kleinem Schirm): der Artikel AN der Linie schnitt das Band nicht mehr,
      //    `aktiverArtikel` bekam ihn gar nicht zu sehen. Gemessen auf /gesetze/bund/OR
      //    bei 320×200: 3 von 24 Proben mit falschem bzw. LEEREM Kandidatensatz
      //    (Kopf blieb auf Art. 40 stehen, während Art. 40a an der Linie lag).
      //  H6-b «Auslöser sitzt am Band, nicht an der Linie» — der Wechsel wurde erst
      //    beim VERLASSEN des Bandes an dessen Oberkante (y = 0) gemeldet, also erst
      //    5rem + 8 px Scrollweg NACH dem Überschreiten der Bezugslinie. Gemessen:
      //    OR 1440×900 3/30 Proben (bis 30 px verspätet, unter 6× CPU-Drossel
      //    identisch → layout-getrieben, kein Timing-Artefakt), BGFA 5/24 (bis 65 px),
      //    OR mit Schriftskala 140 % 2/24 (Verzug wächst mit rem, weil die Linie
      //    5rem + 8 unter der Band-Oberkante sitzt).
      // Ganzer Root als Band ⇒ der Artikel an der Linie ist IMMER im Kandidatensatz
      // (Obermenge des bisherigen), und der Satz bleibt klein (Viewport-Höhe ÷
      // Artikelhöhe ≈ 2–8). Die Auswahl bleibt die reine Funktion `aktiverArtikel`
      // (§2/§3) — sie wählt weiter «Artikel an der Bezugslinie, sonst kleinste
      // Distanz», jetzt aber über einen Satz, der die Linie garantiert überdeckt.
      // Ein rootMargin, der die Linie SELBST nachbildet (`-88px …`), wäre die
      // scheinbar direktere Kopplung, aber die falsche: rootMargin ist beim
      // Observer-Bau eingefroren, die Linie hängt an rem (R3-Schriftskala) und an
      // der Root-Höhe — genau dieses Einfrieren war der Defekt. Darum bleibt der
      // Zahlenwert der Linie dort, wo er frisch gemessen wird: in `auswerten`.
    }, { root: paneRoot(imPane, wurzel), rootMargin: '0px', threshold: 0 });
    // Alle aktuell gerenderten Artikel beobachten — im Pane nur die DIESES Panes
    // (B-2.5: sonst beobachtet der Spy auch das andere Pane → falsches Live-Label).
    // Auf-/Zuklappen (offen) und Suche (sucheDebounced) verändern die DOM-Artikelmenge
    // → Effekt läuft über die Deps neu und beobachtet die dann sichtbaren Artikel.
    // Rank 9: an sucheDebounced statt suche gekoppelt — der Observer-Neuaufbau (alle
    // art--Knoten neu beobachten) läuft so nicht bei jedem Tastendruck.
    (paneRoot(imPane, wurzel) ?? document).querySelectorAll('[id^="art-"]').forEach((el) => io.observe(el));
    // V3/H6 (W2·5d-SPY): zweiter Auslöser — jeder Scroll-Frame. Der Observer meldet
    // NUR Band-Ein-/Austritte; zwischen zwei solchen Ereignissen überquert die
    // Bezugslinie ungesehen Artikelgrenzen (H6-b). Mit dieser Zeile wird die
    // Entscheidung dort neu gefällt, wo sie hingehört: an der frisch gemessenen
    // Linie, bei jedem Frame. §15: derselbe rAF-Kranz wie der Observer (ein `raf`,
    // ein `auswerten`) — nie zwei Auswertungen pro Frame; `auswerten` liest ~2–8
    // Rechtecke und bricht beim unveränderten Token vor jedem State-Update ab
    // (`token === letzterArtToken.current`), erzeugt also im Regelfall NULL Renders.
    // Passiv registriert (kein Scroll-Blocker). Ziel ist der Scroll-Container des
    // Panes bzw. das Fenster — dieselbe Quelle, aus der `oben` gemessen wird.
    const scrollZiel: HTMLElement | Window = paneRoot(imPane, wurzel) ?? window;
    const wecke = () => { if (!raf) raf = window.requestAnimationFrame(auswerten); };
    // NUR hier wird der Ruhe-Zeitstempel gesetzt: das Ruhe-Tor fragt «scrollt der
    // Leser gerade», nicht «hat irgendetwas den Spy geweckt». Der Nachlauf-Wecker
    // unten ist kein Scroll — zählte er mit, verzögerte er den Aufklapp nach einem
    // Klick-Sprung ohne jeden Grund.
    // `gescrollt` (LH, s. o.) latcht HIER — beim echten Scroll-Ereignis, das dem
    // rAF-Kranz vorausgeht: der Spy sieht die Erlaubnis darum schon im ersten
    // Frame nach dem Rad, und ein Klick-/TOC-Sprung (scrollt programmatisch,
    // feuert also `scroll`) gibt sie ebenso frei.
    const beiScroll = () => { gescrollt.current = true; letzterScroll = Date.now(); wecke(); };
    scrollZiel.addEventListener('scroll', beiScroll, { passive: true });
    // N2: dritter Auslöser — das Lösen des jumpLock (Herleitung oben bei
    // `spyNachlauf`). Derselbe rAF-Kranz wie Observer und Scroll.
    spyNachlauf.add(wecke);
    return () => {
      io.disconnect();
      scrollZiel.removeEventListener('scroll', beiScroll);
      spyNachlauf.delete(wecke);
      if (raf) cancelAnimationFrame(raf);
      if (tabArtikelTimer.current != null) window.clearTimeout(tabArtikelTimer.current);
      if (aktArtikelTimer.current != null) window.clearTimeout(aktArtikelTimer.current);
      if (tocBaumTimer.current != null) window.clearTimeout(tocBaumTimer.current); // F3
    };
    // Refs/Setter (jumpLock/…/setAktivIds) + artLabelByToken sind stabil bzw. bewusst
    // ausgelassen; Deps byte-identisch zum früheren Inline-Effekt (Rank 9-Kopplung).
    // S5: `gliederungsKnoten` kommt aus demselben useMemo-Takt wie `sektionen`
    // (Modell-Deps: kuratierter Baum + Snapshot + Sidecar) — der Effekt läuft
    // dadurch nicht öfter neu als zuvor, sieht aber nie eine veraltete Zuordnung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sektionen, ohneGliederung, gliederungsKnoten, umhaengPraefix, basisPfad, paneLocationSearch, offen, sucheDebounced, istSekundaer, imPane, wurzel]);

  // Aktiven Eintrag im TOC sichtbar halten — sanft, nur den TOC-Container, nie die
  // Seite scrollen. Läuft bei JEDEM Wechsel des aktiven Pfads (aktivIds) UND nach
  // dem Aufklapp-Settle (tocBaum): so folgt die Gliederung beim Scrollen der
  // Leseposition (P9b — vorher fehlte aktivIds in den Deps, darum scrollte der TOC
  // beim Scrollen nicht mit). Nur scrollen, wenn der aktive Eintrag aus dem Sicht-
  // feld des TOC-Containers gelaufen ist (sonst kein unnötiger Sprung).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Pane-gescopt: sonst trifft der globale Query ein FREMDES Pane (zwei breite
    // Gesetz-Panes haben je ein [data-toc]) → falsches Pane scrollt (E-Regression).
    const wurzelEl = paneRoot(imPane, wurzel);
    const cont = (wurzelEl ?? document).querySelector('[data-toc]') as HTMLElement | null;
    if (!cont) return;
    // F2 (RC1b) + V1: solange der Nutzer die Gliederung aktiv durchblättert (letzte
    // Bedienung < 1,5 s her), NICHT nachführen — er soll sich frei darin bewegen
    // können (David 16.7. «Wenn man sich darin bewegt»). V1 (stille Wiederaufnahme):
    // dieser Effekt läuft nur bei echtem aktivIds-/tocBaum-Wechsel; nach Ablauf des
    // Guards führt also erst der NÄCHSTE Artikelwechsel wieder nach — keine verspätete
    // Rückhol-Bewegung, die das Erkunden abbricht.
    if (Date.now() - tocTouchRef.current < 1500) return;
    // W2·19-GLIEDERUNG/S4 (F5): bis hierher trugen ALLE Vorfahren des aktiven Pfads
    // `data-toc-aktiv`, und diese Stelle nahm den LETZTEN Treffer in Dokumentordnung,
    // also den tiefsten. Seit F5 gibt es nur noch EINE Marke (Bau-Spec §3.5) — die
    // Auswahl entfällt. `querySelector` statt `[length-1]` ist dabei kein Stil,
    // sondern die Probe auf die Invariante: gäbe es doch mehrere Treffer, wäre der
    // erste der OBERSTE, das Sichtfenster spränge zum Wurzelknoten statt zur
    // Leseposition — der Fehler fiele sofort auf, statt sich zu verstecken.
    const el = cont.querySelector('[data-toc-aktiv]') as HTMLElement | null;
    if (!el) return;
    const cr = cont.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    // Zone A (Standort-Pfad + Quickjump) klebt seit S4 INNERHALB dieses Scrollers und
    // verdeckt dessen oberste Pixel. Rechnete der Nudge weiter gegen `cr.top`, schöbe
    // er die aktive Zeile exakt unter diesen Sockel und meldete «sichtbar», was
    // niemand sieht. Die Höhe wird GEMESSEN, nicht angenommen — sie hängt daran, ob
    // der Erlass einen Quickjump hat (ohne `loeseArtikel` entfällt er).
    // B6: die Höhe steht als `--toc-deckel` am Scroller (Zone A setzt sie selbst,
    // inhalt-volltext.tsx) — EINE Messung für den Nudge hier UND den
    // Trefferlisten-Kopf (§5); die eigene bleibt Rückfall.
    const marke = parseFloat(getComputedStyle(cont).getPropertyValue('--toc-deckel'));
    const zoneA = cont.querySelector('[data-toc-zone-a]') as HTMLElement | null;
    const deckel = Number.isFinite(marke) && marke > 0 ? marke : (zoneA?.getBoundingClientRect().height ?? 0);
    // F1 (RC1a): minimaler Rand-NUDGE statt Zentrieren, INSTANT statt smooth. Nur so
    // weit scrollen, dass der aktive Eintrag knapp in das 8-px-Dead-Band am jeweiligen
    // Rand rückt (Auslöseschwelle == Zielposition → kein Re-Trigger); Delta ≈ eine
    // Zeilenhöhe statt ½ Container (früher `- cr.height/2` = Sprünge von 289–315 px).
    // Bewusst KEIN scrollIntoView({block:'nearest'}): das kann Ancestor/Seite mitscrollen
    // (E-Regression, Kommentar oben «nie die Seite scrollen»). Kein `smooth`: beseitigt
    // den Klickziel-Hazard (Buttons wandern nicht mehr unter dem Cursor weg).
    const dOben = er.top - (cr.top + deckel + 8);
    const dUnten = er.bottom - (cr.bottom - 8);
    if (dOben < 0) cont.scrollTo({ top: cont.scrollTop + dOben });
    else if (dUnten > 0) cont.scrollTo({ top: cont.scrollTop + dUnten });
    // tocTouchRef ist ein stabiler Ref; Deps byte-identisch zum früheren Inline-Effekt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktivIds, tocBaum, imPane, wurzel]);

  // F2 (RC1b): Nutzer-Interaktions-Guard. Passive Input-Listener am [data-toc]-
  // Container (pane-gescopt) armieren den Guard — NICHT `scroll`, sonst würde der
  // eigene programmatische Nudge den Guard selbst auslösen. Läuft neu, sobald die
  // TOC-Spalte erscheint/verschwindet (istXl/tocOffen/sektionen).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const wurzelEl = paneRoot(imPane, wurzel);
    const cont = (wurzelEl ?? document).querySelector('[data-toc]') as HTMLElement | null;
    if (!cont) return;
    const merke = () => { tocTouchRef.current = Date.now(); };
    cont.addEventListener('wheel', merke, { passive: true });
    cont.addEventListener('pointerdown', merke, { passive: true });
    cont.addEventListener('touchstart', merke, { passive: true });
    return () => {
      cont.removeEventListener('wheel', merke);
      cont.removeEventListener('pointerdown', merke);
      cont.removeEventListener('touchstart', merke);
    };
    // tocTouchRef ist ein stabiler Ref; Deps byte-identisch zum früheren Inline-Effekt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sektionen, istXl, tocOffen, imPane, wurzel]);

  // W2·5d U-POSITION/A16: laufend den Scroll-Anker dieses Reiters festhalten
  // (oberster sichtbarer Artikel `letzterArtToken` + Offset in ihn hinein). Beim
  // Zurück-/Reiter-Wechsel stellt App.tsx:ScrollWiederherstellung EXAKT diese Stelle
  // wieder her — element-basiert und darum robust gegen die content-visibility-
  // Höhenschätzung (David 5.7.: scrollTop allein ist unzuverlässig). Nur die
  // Primär-/Einzelansicht (die Fenster-Restoration); das Pane hat eigene History.
  // Passiver, rAF-entprellter Scroll-Listener (§15): eine getBoundingClientRect je
  // Frame, kein setState (keine Render-Kaskade).
  useEffect(() => {
    if (istSekundaer || typeof window === 'undefined') return;
    let raf = 0;
    const erfasse = () => {
      raf = 0;
      const token = letzterArtToken.current;
      if (!token) return;
      const el = findeArt(null, token);
      if (!el) return;
      const offset = Math.max(0, Math.round(bezugslinie(0, ankerLandepunkt(el)) - el.getBoundingClientRect().top));
      merkeAnker(tabSchluessel(basisPfad + window.location.search), { token, offset });
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(erfasse); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) window.cancelAnimationFrame(raf); };
  }, [istSekundaer, basisPfad]);
}
