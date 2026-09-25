import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EntscheidBody } from '../components/rechtsprechung/EntscheidBody';
import RegesteBlock from '../components/rechtsprechung/RegesteBlock';
import { spracheBadgeTitel } from '../components/rechtsprechung/format';
import { Tabs } from '../components/ui/Tabs';
import { ABSCHNITT_TITEL, abschnittAnker, ersteFundstelle } from '../lib/rechtsprechung/abschnitte';
import { StatusBadge } from '../components/verzahnung/StatusBadge';
import { entscheidDatum } from '../lib/verzahnung/artikel-revisionen';
import { zitatMitAusweis, heuteIso } from '../lib/format';
import { useKopieren } from '../components/useKopieren';
import { ZitierteNormenGruppe, ZitiertGruppe } from '../components/rechtsprechung/EntscheidVerzahnung';
import { NormText } from '../components/NormText';
import { KontextPanel } from '../components/kontext/KontextPanel';
import { ladeEntscheidEintrag, ladeEntscheid } from '../lib/rechtsprechung/browse';
import { kopfModell, type KopfLabelKey } from '../lib/rechtsprechung/kopf';
import { normalisiereRegeste, type BrowseEntscheid } from '../lib/rechtsprechung/register';
import { GEBIET_LABEL } from '../lib/normtext/register';
import {
  ENTSCHEID_HIGHLIGHT_INSTANZ, ankunftsAnker,
  LESE_PARAM, leseAusParam, loescheNennungen, maleNennungen, nennungsAnker,
  referenzImTitel, urlMitHash, urlMitLese, zaehleNennungen,
  angabeImTitel, leitzeileOhneKopfangaben, sucheWirksam,
} from './entscheidLeserRegeln';
import { datumOderStrich } from '../components/ui/datumText';
import { setzeSuchHighlight } from './gesetz-leser/suchHighlight';
import { ErwBereich } from './entscheidErwBereich';
import { useEntscheidSuche } from './entscheidSucheZustand';
import { usePaneKlasse, usePaneKontext } from '../components/layout/PaneKontext';
import { useMeldeInhaltsKopf } from '../components/layout/InhaltsKopfKontext';
// ── W2·19-DESIGN-KONSISTENZ · B2/BAU-4 (31.8.2026) · KANON-NACHZÜGE ─────────
// Die vier geteilten Bausteine, die dieser Leser als letzte Fläche noch nicht
// bezog (Fahrplan §3, Register-Zeile «A-2/A-5/B-5 (+B-1/B-3-Konsum)»):
// `SeitenTitel` (A-1), `QuellLink` (B-1), `Datum` (B-3), `FehlSeite` (D-6),
// dazu die Satz-Konstante aus `lib/benennung` (B-6).
import { SeitenTitel } from '../components/ui/SeitenTitel';
import { FehlSeite } from '../components/ui/FehlSeite';
import { Ladeanzeige } from '../components/ui/Ladeanzeige';
import { Datum } from '../components/ui/Datum';
import { AMTLICHE_FASSUNG, MASSGEBLICH_HALBSATZ, MASSGEBLICH_SATZ } from '../lib/benennung';
// B-4 (Runde 2, 31.8.2026): die Bänder-Ordnung des Leser-Kopfs — hier löst sie
// die letzte Misch-Zeile der drei Leser ab (Herleitung im Baustein).
import { KopfOverline, LeserKopfGeruest } from '../components/layout/LeserKopfGeruest';
// §6.6-Split vom 31.8.2026 (Anlass: `check:schlankheit` ROT bei 1380 Z.). Die
// Kopf-Teile stehen in BEIDEN Ansichten dieses Lesers, die Lese-Schriftgrösse
// bedient beide Steller-Paare, und das Overlay ist die zweite Ansicht selbst —
// die drei Schnitte folgen den Kanten, die die Datei schon hatte.
import { BesetzungWert, DatumMeta, MassgeblicheFassung } from '../components/rechtsprechung/EntscheidKopfTeile';
import { FS_STUFEN, ladeFsIdx, speichereFsIdx } from '../components/rechtsprechung/leseGroesse';
import { LesemodusOverlay } from '../components/rechtsprechung/LesemodusOverlay';
import type { EntscheidSnapshot, EntscheidSprache, Abschnittstyp, Entscheidquelle } from '../lib/rechtsprechung/typen';

// Provenienz-Fuss (§7): Daten-Label je Quelle — BS-Tranche §7.1 (vorher hart
// «OpenCaseLaw», was für gerichte-bs falsch wäre). Deklariert, kein Raten.
const QUELLE_LABEL: Record<Entscheidquelle, string> = {
  opencaselaw: 'OpenCaseLaw',
  entscheidsuche: 'entscheidsuche.ch',
  'gerichte-bs': 'Rechtsprechungs-Datenbank der Gerichte Basel-Stadt (amtlich)',
};

// Reader EINES Entscheids (/rechtsprechung/:key). Lädt Manifest-Eintrag → Datei
// → Snapshot; Kopf, sticky Sprung-Navigation, hervorgehobene Regeste,
// EntscheidBody (mit Norm-Verlinkung) und eine Fuss-Provenienz. Reine
// Darstellung (§3) — keine Rechtslogik.

// ── B-3 (Design-Konsistenz, 31.8.2026) · DER SECHSTE FORMATIERER IST WEG ────
// Hier stand ein `formatiereDatum(iso)` mit derselben Regex und derselben
// Rückgabe wie `lib/normtext/erlassKopfText.datumCh` — die Finder-Welle hatte
// FÜNF byte-gleiche Kopien gezählt, diese war die sechste (sie fiel nicht auf,
// weil `components/rechtsprechung/format.ts` denselben Namen bereits als
// Fassade auf `datumCh` führt: zwei Namensgleiche, einer echt, einer Kopie).
// Formatierung UND Auszeichnung kommen jetzt aus dem geteilten `ui/Datum`
// (Herleitung dort) — die Mono-Stimme bleibt damit auf Zitierung und
// Aktenzeichen begrenzt, Datumsangaben laufen proportional mit `tabular-nums`.

// Sprung zu einem Anker im Body + kurzes Ziel-Blinken (bestehendes lc-ziel-blink
// aus dem Gesetz-Leser; §13-Token, keine neue Optik). Respektiert reduced-motion.
// Rein clientseitig (nur aus Klick-/Effekt-Handlern) — kein SSR-Pfad.
function springeZuAnker(id: string): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const reduziert = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ block: 'start', behavior: reduziert ? 'auto' : 'smooth' });
  el.classList.add('lc-ziel-blink');
  window.setTimeout(() => el.classList.remove('lc-ziel-blink'), 2400);
  return true;
}


// Rubrum-Beschriftungen je Sprache (zukunftsfest; heute trägt der Korpus nur de,
// fr/it greifen automatisch, sobald solche Entscheide importiert werden). rm → de.
const KOPF_LABEL: Record<EntscheidSprache, Record<KopfLabelKey, string>> = {
  de: { gegenstand: 'Gegenstand', parteien: 'Parteien', vorinstanz: 'Vorinstanz', besetzung: 'Besetzung' },
  fr: { gegenstand: 'Objet', parteien: 'Parties', vorinstanz: 'Autorité précédente', besetzung: 'Composition' },
  it: { gegenstand: 'Oggetto', parteien: 'Parti', vorinstanz: 'Autorità inferiore', besetzung: 'Composizione' },
  rm: { gegenstand: 'Gegenstand', parteien: 'Parteien', vorinstanz: 'Vorinstanz', besetzung: 'Besetzung' },
};


// Ehrlicher Marker, wenn die Thema-Leitzeile abgeleitet ist (keine amtliche Regeste, §8).
const SYNTH_MARKER: Record<EntscheidSprache, string> = {
  de: 'Sachgebiet aus der Aktenstruktur abgeleitet — keine amtliche Regeste vorhanden.',
  fr: 'Domaine déduit de la structure du dossier — aucun regeste officiel disponible.',
  it: 'Ambito dedotto dalla struttura degli atti — nessuna massima ufficiale disponibile.',
  rm: 'Sachgebiet aus der Aktenstruktur abgeleitet — keine amtliche Regeste vorhanden.',
};

// Reihenfolge der Sprung-Ziele (amtliche Gliederung); Regeste vorangestellt.
const NAV_TYPEN: Abschnittstyp[] = ['regeste', 'sachverhalt', 'erwaegung', 'dispositiv'];


// Reine Chip-Reihe (Sprung-Ziele). Der sticky-Rahmen liegt im gemeinsamen
// Kopf-Block (zusammen mit den BGE-Tabs), damit sich nicht zwei sticky-Leisten
// überlagern (Bug-Fix: Sprung-Leiste verdeckte die Tab-Leiste beim Scrollen).
// LM-209 (Prod-Messung 2.8.2026): als nackte `<a href="#…">` pushte JEDER
// Reiter-Klick browsernativ einen History-Eintrag (`history.length` 4→5→6→7);
// nach drei Klicks war man vier «Zurück» vom Gesetz entfernt, ohne die Seite je
// verlassen zu haben. Der `href` BLEIBT (Teilbarkeit, Mittelklick, Kontextmenü),
// der normale Linksklick wird jedoch selbst bedient: scrollen + Hash per
// `replaceState` — dasselbe Muster wie die `?ansicht=`-Spiegelung (N0d·J5).
// Modifier-/Mittelklicks bleiben dem Browser überlassen (neuer Tab/Fenster).
function SprungNavigation({ ziele, springe, aktiv }: {
  ziele: { anker: string; label: string }[];
  springe: (anker: string) => void;
  /** LM-005: der Anker des Abschnitts an der Scroll-Position, oder null (kein
   *  Abschnitt sichtbar ⇒ keine Chip-Auszeichnung, die Leiste «tritt zurück»). */
  aktiv: string | null;
}) {
  const pk = usePaneKlasse();
  if (ziele.length === 0) return null;
  return (
    <nav aria-label="Abschnitte">
      {/* Mobil: horizontaler Chip-Streifen (scrollbar); Desktop: normale Reihe.
          A-2 (31.8.2026): die Umschaltung mass den VIEWPORT (`sm:`) — in einer
          520-px-Pane eines 1440-px-Fensters galt `sm:` als erfüllt, die Chips
          brachen also um, statt zu scrollen, und rissen die klebende Leiste auf
          zwei Zeilen. Jetzt misst sie im Pane die PANE-Breite. */}
      <div className={pk(
        'flex gap-2 overflow-x-auto lc-scrollrand-x pb-0.5 -mb-0.5 pr-5 sm:pr-0 sm:flex-wrap sm:overflow-visible [scrollbar-width:thin]',
        'flex gap-2 overflow-x-auto lc-scrollrand-x pb-0.5 -mb-0.5 pr-5 @xl/pane:pr-0 @xl/pane:flex-wrap @xl/pane:overflow-visible [scrollbar-width:thin]',
      )}>
        {/* ── LM-059 (B15, 4.9.2026) · REITER SIND KEINE CHIPS ────────────────
            GEMESSEN vor dem Bau, `/rechtsprechung/bs_sozialversicherungsgericht_AH.2025.7`
            gegen `/rechtsprechung`, beide @1440: die drei Abschnitts-Sprungziele
            und die Filter-Chips der Trefferliste waren in JEDEM gemessenen
            Merkmal deckungsgleich — Mono («Geist Mono Variable»), 12 px,
            radius 4 px, 2 px Messing-Kante links, Fläche well/brass-100. EINE
            Gestalt für zwei Handlungen: «Filter setzen» und «Abschnitt
            anspringen». FAHRPLAN-VERZAHNUNG-UI §1.2 reserviert `.lc-chip` für
            Dokument-REFERENZEN — ein Sprungziel innerhalb DESSELBEN Dokuments
            ist keine, ein Filter auch nicht; die Grammatik war deklariert, nur
            nicht durchgesetzt. Durchgesetzt wird sie hier, wo sie am wenigsten
            kostet: die Abschnittsleiste ist Navigation und bekommt das Bild der
            Navigation — Grotesk statt Mono, Unterkante statt Kasten. Die
            Filter-Chips bleiben unangetastet.
            MITGENOMMEN, nicht verloren: `min-height: var(--tap-ziel)` kam bisher
            aus `.lc-chip` und ist a11y-Pflicht (WCAG 2.5.8, in e2e gemessen) —
            es steht jetzt ausdrücklich am Element. LM-005 bleibt: `aktiv === null`
            zeichnet weiterhin NICHTS aus, die Leiste tritt zurück.
            D8a (REST S1, 25.9.2026): Rollen-Schicht statt Messing-Stufen —
            die aktive Unterkante trägt die Registerfarbe «Rechtsprechung»
            (F0.2: Reiter-Unterkante), Hover die Akzent-Rollen. */}
        {ziele.map((z) => (
          <a key={z.anker} href={`#${z.anker}`}
            aria-current={aktiv === z.anker ? 'true' : undefined}
            onClick={(e) => {
              if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              springe(z.anker);
            }}
            className={`inline-flex items-center min-h-[var(--tap-ziel)] shrink-0 whitespace-nowrap border-b-2 px-1 text-body-s font-medium no-underline transition-colors ${
              aktiv === z.anker
                ? 'border-reg-r text-ink-900'
                : 'border-transparent text-ink-600 hover:border-accent-line hover:text-accent-text'
            }`}>
            {z.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function EntscheidLeserInhalt({ schluessel, ansichtParam, normParam, leseParam }: {
  schluessel: string;
  ansichtParam: string | null;
  normParam: string | null;
  leseParam: string | null;
}) {
  const navigate = useNavigate();
  const { imPane, rolle, wurzel, overlayWurzel } = usePaneKontext();
  // ── A-2 (Design-Konsistenz, 31.8.2026) · DIE LETZTE NICHT-pk-FLÄCHE ───────
  // Von allen pane-fähigen Flächen war dieser Leser die einzige, die
  // `usePaneKlasse` nicht bezog: gemessen 50 Aufrufstellen im Haus gegen 0 hier.
  // Die Folge war überall dieselbe — die layoutbestimmenden Breakpoints massen
  // das FENSTER, während der Leser in einer halb so breiten Pane stand. Die
  // Aufteilung ist bewusst und steht an jeder Stelle einzeln begründet:
  //   · WEITENFRAGEN («passt das nebeneinander?») → `pk(viewport, container)`;
  //   · STRUKTURFRAGEN («liegt über meinem Scroll-Container eine Topbar?»)
  //     bleiben `imPane` — eine Container-Query kann sie nicht beantworten, und
  //     eine Umschaltung nach Breite wäre dort ein sichtbarer Fehler, kein
  //     Fortschritt (Details bei `stickHoehe` und der klebenden Leiste unten).
  const pk = usePaneKlasse();
  // W2·5d U-POSITION/A17: im SEKUNDÄREN Pane ist die massgebliche Fundstelle-/
  // Hash-Quelle die PANE-LOKALE Location (react-router `<Routes location>`), NICHT
  // `window.location.hash` (= die Haupt-URL). Wird ein Entscheid via ⧉ aus einem
  // Gesetz-Leser geöffnet, dessen Haupt-URL ein `#art-…` trägt, würde der
  // `?norm=`-Fundstellen-Sprung sonst fälschlich als „Hash gewinnt" abgebrochen
  // ⇒ das Pane öffnete oben statt an der Erwägung (stumm falsch, §8).
  const paneLoc = useLocation();
  const hashRoh = (imPane ? paneLoc.hash : typeof window !== 'undefined' ? window.location.hash : '').slice(1);
  const meldeInhaltsKopf = useMeldeInhaltsKopf();
  const [snap, setSnap] = useState<EntscheidSnapshot | null>(null);
  // Manifest-Eintrag desselben Entscheids — trägt die korpus-kanonisierten
  // Richter-Slugs für die Besetzungs-Verlinkung. Bewusst im SELBEN Lade-Schritt
  // gesetzt wie `snap` (der Eintrag ist ohnehin schon geladen, bevor der
  // Snapshot geholt wird): kein zweiter async-Sprung, also kein Nachwachsen und
  // kein Layout-Shift (§15.2).
  const [eintrag, setEintrag] = useState<BrowseEntscheid | null>(null);
  const [zustand, setZustand] = useState<'laden' | 'fehlt' | 'da'>('laden');
  const { kopiert, kopieren } = useKopieren();
  // LM-210: der Lesemodus lag bisher nur im lokalen State — nicht teilbar, nach
  // dem Neuladen weg. Er steht jetzt als `?lese=1` in der Adresse (Start-Zustand
  // von dort, Spiegelung per replaceState), nach dem gebauten `?ansicht=`-Muster
  // (N0d·J5): kein Router-Rerender, kein Neulauf des Lade-Effekts, kein
  // Verlaufseintrag fürs Umschalten einer Ansicht derselben Seite.
  const [lese, setLese] = useState(() => leseAusParam(leseParam));
  // BGE-Umschalter: 'voll' = vollständiges Urteil (Default), 'auszug' = amtl. BGE-Sammlungstext.
  const [bodyTab, setBodyTab] = useState<'voll' | 'auszug'>('voll');
  // Im Pane bleibt die Haupt-URL unberührt (dieselbe Grenze wie bei `wechsleTab`):
  // ein Overlay über dem Nebenpane darf die Adresse des Haupt-Dokuments nicht umschreiben.
  const spiegleLese = useCallback((offen: boolean) => {
    if (imPane || typeof window === 'undefined' || !window.history) return;
    window.history.replaceState(window.history.state, '', urlMitLese(window.location.href, offen));
  }, [imPane]);
  const oeffneLese = useCallback(() => { setLese(true); spiegleLese(true); }, [spiegleLese]);
  const closeLese = useCallback(() => { setLese(false); spiegleLese(false); }, [spiegleLese]);
  // W2·10-UI-NAV/N0d·J5: Tab-Klick spiegelt die gewählte Fassung als ?ansicht=
  // (teilbar/reload-fest — die Start-Ansicht-Weiche liest sie beim Laden) und
  // scrollt an den Dokumentanfang (neuer Fassungstext, oben beginnen). Die URL
  // wird per replaceState gespiegelt (kein Router-Rerender/Lade-Effekt-Neulauf);
  // im Pane bleibt die Haupt-URL unberührt, gescrollt wird die Pane-Wurzel.
  const wechsleTab = useCallback((neu: 'voll' | 'auszug') => {
    setBodyTab(neu);
    if (!imPane && typeof window !== 'undefined' && window.history) {
      const u = new URL(window.location.href);
      u.searchParams.set('ansicht', neu);
      window.history.replaceState(window.history.state, '', u);
    }
    if (imPane) wurzel?.current?.scrollTo({ top: 0, behavior: 'smooth' });
    else if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [imPane, wurzel]);
  // LM-209: Sprung zu einem Abschnitt/Anker OHNE Verlaufseintrag. Der Hash bleibt
  // in der Adresse (teilbar), wird aber per replaceState gesetzt — die Verlaufs-
  // Ökonomie gehört den echten Ortswechseln. Kein Scroll-Ereignis schreibt hier je
  // in die URL (§Z Ziff. 7 bleibt gewahrt: verworfen war der LAUFENDE Hash-Sync).
  // Im Pane bleibt die Haupt-URL unberührt (Konvention von `wechsleTab`).
  const springeZuAbschnitt = useCallback((anker: string) => {
    if (!springeZuAnker(anker)) return;   // kein Ziel im DOM ⇒ auch kein Hash (§8)
    if (imPane || typeof window === 'undefined' || !window.history) return;
    window.history.replaceState(window.history.state, '', urlMitHash(window.location.href, anker));
  }, [imPane]);
  // Laufindex des «nächste Fundstelle»-Knopfes (LM-208), zyklisch über die Ziele.
  const [fundIdx, setFundIdx] = useState(0);
  // V5 «Im Entscheid suchen» + W2·28 · L-2 Marken-Schalter: Zustand und die
  // Rücksetz-Zusage (Leeren → Hervorhebung wieder an) in `entscheidSucheZustand`.
  const { suche, setzeSuche, markenAusRoh, setzeMarkenAus } = useEntscheidSuche();
  // REST S1: «leer» heisst hier «keine wirksame Suche» (ab zwei Zeichen, `sucheWirksam`).
  const markenAus = sucheWirksam(suche) && markenAusRoh;
  const [fsIdx, setFsIdx] = useState<number>(ladeFsIdx);
  const setFs = (i: number) => setFsIdx(speichereFsIdx(i));

  useEffect(() => {
    // Zustand startet auf 'laden' (Default); der Wrapper remountet via key={schluessel},
    // daher KEIN synchrones setState hier nötig (react-hooks/set-state-in-effect).
    let lebt = true;
    void ladeEntscheidEintrag(schluessel).then(async (eintrag) => {
      if (!lebt) return;
      if (!eintrag) { setZustand('fehlt'); return; }
      // Direktaufruf eines Verweis-Keys (vollständiges Urteil zu einem BGE; kein eigener
      // Snapshot, datei=null): auf das Ziel-BGE mit voraktivierter Ansicht weiterleiten
      // statt «nicht verfügbar» zu zeigen — das Ziel ist im Manifest bekannt (§8).
      if (eintrag.verweis && !eintrag.datei) {
        // ?norm= mitschleppen (Review 3.7.): der Fundstellen-Sprung überlebt den
        // Verweis-Redirect auf das Ziel-BGE.
        const normSuffix = normParam ? `&norm=${encodeURIComponent(normParam)}` : '';
        navigate(`/rechtsprechung/${encodeURIComponent(eintrag.verweis.zielKey)}?ansicht=${eintrag.verweis.ansicht}${normSuffix}`, { replace: true });
        return;
      }
      if (!eintrag.datei) { setZustand('fehlt'); return; }
      const s = await ladeEntscheid(eintrag.datei);
      if (!lebt) return;
      if (!s) { setZustand('fehlt'); return; }
      setEintrag(eintrag);
      setSnap(s);
      setZustand('da');
      // Start-Ansicht GENAU EINMAL festlegen (Lade-Effekt, nicht pro Render →
      // kein Flash, Davids manueller Tab-Wechsel wird nie überschrieben):
      // ?ansicht= aus der Übersicht hat Vorrang, sonst öffnen Leitentscheide mit
      // amtlichem Auszug zuerst den BGE-Auszug, alles andere das volle Urteil.
      const init: 'voll' | 'auszug' =
          ansichtParam === 'voll'   ? 'voll'
        : ansichtParam === 'auszug' ? 'auszug'
        : (s.leitcharakter === 'leitentscheid' && (s.auszugAbschnitte?.length ?? 0) > 0) ? 'auszug'
        : 'voll';
      setBodyTab(init);
    });
    return () => { lebt = false; };
    // normParam: nur vom Verweis-Redirect gelesen; Lade-Pfade sind Promise-
    // gecacht → ein Re-Run bei ?norm-Wechsel ist idempotent und billig.
  }, [schluessel, ansichtParam, normParam, navigate]);

  // Parität zum Gesetz-Leser: Kopfdaten (Breadcrumb Rechtsprechung › Ebene › Nr)
  // melden — der nächste Provider fängt sie (Einzelansicht → Inhalts-Kopf, Pane →
  // PaneKopf). Ebene nicht klickbar (Übersicht filtert nicht nach Bund/Kanton).
  useEffect(() => {
    if (!snap) return;
    meldeInhaltsKopf({
      breadcrumb: [
        { label: 'Rechtsprechung', to: '/rechtsprechung' },
        { label: snap.kanton === 'CH' ? 'Bund' : `Kanton ${snap.kanton}` },
        { label: snap.bgeReferenz ?? snap.nummer },
      ],
    });
  }, [snap, meldeInhaltsKopf]);
  // KEIN Unmount-Cleanup `meldeInhaltsKopf(null)` (Befund David 21.8.2026,
  // gleiche Wurzel wie Cowork 1/53): die Shell setzt bei jedem Pfadwechsel
  // ohnehin zurück; das passive Cleanup lief NACH dem Layout-Effekt der
  // Folgeseite und wischte beim Zurück in den Gesetz-Leser dessen frische
  // Kopf-Reservierung weg — die App-Leiste übermalte die V3-Werkzeugleiste.
  // Rot-Beweis: `e2e/leser-v3-eine-kopfzeile.e2e.ts` (k).

  // Browser-Tab: Zitierung des Entscheids.
  useEffect(() => {
    if (!snap || typeof document === 'undefined') return;
    if (rolle === 'sekundaer') return; // sekundäres Pane treibt den Browser-Tab-Titel nicht (B-2.5)
    document.title = `${snap.zitierung} — LexMetrik`;
  }, [snap, rolle]);

  // Deep-Link auf eine Erwägung (#e-2-4 aus «Fundstelle kopieren»): der Entscheid
  // lädt on-demand (fetch), das Ziel-Element existiert beim Routen-Hash-Sprung
  // (App.tsx:ScrollZuHash, 30 Frames) oft noch nicht. Nach dem Snapshot-Render
  // hier erneut versuchen — §15-konform (nur scrollIntoView nach Mount, kein
  // CLS-Hack). Einmalig pro geladenem Entscheid (ref-Wächter), damit späteres
  // manuelles Scrollen nicht überschrieben wird.
  const hashGesprungen = useRef<string | null>(null);
  // ?norm=«Art. 957 OR» (Fundstellen-Sprung, Auftrag David 3.7.2026): jeder
  // eingehende Link (Gesetz-Leitfall-Chip, Kontext-Panel, Suche) darf die Norm
  // mitgeben, um deren ERSTE Erwägungs-Fundstelle er sich dreht. Auflösung über
  // dieselbe ersteFundstelle-Logik wie die Zitierte-Normen-Chips (§5, inkl.
  // i.V.m.-Kette). Keine Fundstelle ableitbar → ehrlicher Seitenanfang, kein
  // toter Anker (§8). Ein expliziter #hash hat Vorrang (präziseres Ziel).
  // Einmalig pro (Entscheid, Norm) — ref-Wächter wie beim Hash-Sprung.
  const normGesprungen = useRef<string | null>(null);
  useEffect(() => {
    if (zustand !== 'da' || !snap || !normParam || typeof window === 'undefined') return;
    if (hashRoh) return;                                   // expliziter #hash gewinnt (Pane-lokal bzw. Fenster)
    const merkKey = `${schluessel}?${normParam}`;
    if (normGesprungen.current === merkKey) return;
    // Fundstelle in der beim Laden AKTIVEN Fassung suchen (Auszug bevorzugt beim
    // Leitentscheid — dieselbe Weiche wie die Start-Ansicht); nicht auf spätere
    // Tab-Wechsel reagieren (kein erneuter Sprung unter dem Leser).
    const abschnitte = bodyTab === 'auszug' && (snap.auszugAbschnitte?.length ?? 0) > 0
      ? snap.auszugAbschnitte!
      : snap.abschnitte;
    // EINE Ankunfts-Wahrheit (§5): Fedlex-Fundstelle, sonst die erste wörtliche
    // Nennung — genau die Ziele, die die Herkunfts-Zeile unten schon als
    // «↓ Fundstelle 1/n» anbietet. Herleitung und Messung: `ankunftsAnker`.
    const anker = ankunftsAnker(abschnitte, normParam, ersteFundstelle);
    if (!anker) { normGesprungen.current = merkKey; return; } // ehrlicher Seitenanfang
    let frames = 0;
    let raf = requestAnimationFrame(function versuche() {
      if (springeZuAnker(anker)) { normGesprungen.current = merkKey; return; }
      if (frames++ < 60) raf = requestAnimationFrame(versuche);
    });
    return () => cancelAnimationFrame(raf);
    // bodyTab bewusst NICHT in den Deps: der Sprung gilt der Start-Ansicht.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zustand, snap, normParam, schluessel]);
  // LM-208: die wörtlichen Nennungen der HERKUNFTS-Norm im Lesetext markieren.
  // Erst nach einem Frame — der Body wird beim Fassungswechsel neu aufgebaut, und
  // ein synchrones setState im Effekt-Rumpf wäre ohnehin unzulässig. Der Lesemodus
  // zeigt einen EIGENEN Body: dann Markierung zurücknehmen statt auf abgehängte
  // Knoten zeigen zu lassen.
  const koerperRef = useRef<HTMLElement>(null);
  // LM-005: misst die tatsächlich gerenderte Höhe des sticky Kopf-Blocks
  // (Umschalter + Sprung-Chips) für den Scroll-Spy weiter unten — kein
  // zweiter Rem-Konstanten-Pfad neben `--rsp-stick`.
  const stickLeisteRef = useRef<HTMLDivElement>(null);
  // V5: EINE Markierungs-Schicht im Lesetext. Die Highlight-API kennt je Namen
  // genau eine Menge (`SUCH_HIGHLIGHT`, geteilt mit A35) — Suche und
  // Herkunfts-Nennung können darum nicht gleichzeitig leuchten. Vorrang hat die
  // SUCHE: sie ist die aktive Handlung des Lesers, die Herkunfts-Markierung ein
  // Zustand aus dem Aufruf. Leert er das Feld, kehrt die Norm-Markierung zurück.
  useEffect(() => {
    if (zustand !== 'da' || lese) { loescheNennungen(); return; }
    // W2·28/L-2: weggeschaltet fällt die Suche aus diesem Zweig heraus — die
    // Norm-Markierung darunter greift dann wieder, genau wie bei leerem Feld.
    // Trefferzahl, Rail-Liste und Sprünge bleiben unberührt (§8).
    // REST S1: Hervorhebung erst ab zwei Zeichen — dieselbe Schwelle wie Rail und Zähler (§5).
    if (sucheWirksam(suche) && !markenAus) {
      // DIESELBE Instanz wie `maleNennungen`/`loescheNennungen`: dadurch ERSETZT
      // die Suche die Nennungs-Menge, statt neben ihr zu stehen — «Suche schlägt
      // Herkunfts-Nennung» bleibt Zeile für Zeile das erklärte Verhalten.
      // QS-UI-HIGHLIGHT ändert daran nichts; es verhindert nur, dass dieser
      // Leser beim Aufräumen die Markierung FREMDER Panes mitnimmt.
      setzeSuchHighlight(koerperRef.current, suche, ENTSCHEID_HIGHLIGHT_INSTANZ);
      return () => loescheNennungen();
    }
    if (!normParam) { loescheNennungen(); return; }
    maleNennungen(koerperRef.current, normParam);
    return () => loescheNennungen();
  }, [zustand, snap, normParam, lese, bodyTab, suche, markenAus]);

  useEffect(() => {
    if (zustand !== 'da' || typeof window === 'undefined') return;
    if (!hashRoh) return;
    const id = decodeURIComponent(hashRoh);
    if (hashGesprungen.current === `${schluessel}#${id}`) return;
    let frames = 0;
    let raf = requestAnimationFrame(function versuche() {
      if (springeZuAnker(id)) { hashGesprungen.current = `${schluessel}#${id}`; return; }
      if (frames++ < 60) raf = requestAnimationFrame(versuche);
    });
    return () => cancelAnimationFrame(raf);
  }, [zustand, schluessel, hashRoh]);

  // LM-005 (W2·17-UI-BEFUNDE-B3, K-01): `SprungNavigation` («Sachverhalt |
  // Erwägungen | Dispositiv») trug KEINE Aktivmarkierung — reine `.lc-chip`-
  // Anker ohne Scroll-Spy. Der gemeldete «Sachverhalt bleibt aktiv markiert,
  // auch wenn nichts mehr sichtbar ist» stammte nachweislich nicht aus einem
  // Spy-Zustand, sondern aus dem :focus-Ring des zuletzt geklickten Chips
  // (Dedup-Notiz, Befundliste). Echter Scroll-Spy: IntersectionObserver auf
  // die Abschnitts-Anker (`[id^="abschnitt-"]` innerhalb des Lesekörpers),
  // Root-Margin um die GEMESSENE sticky Leisten-Höhe (`stickLeisteRef`, nicht
  // der `--rsp-stick`-Rem-Wert — vermeidet ein zweites Duplikat derselben
  // switcherSichtbar/hatAuszug-Herleitung vor dem `zustand`-Guard unten, §5).
  // Kein Abschnitt sichtbar (Kontext-Panel/Fusszeile erreicht, oder Lesemodus)
  // ⇒ aktivAnker=null — die Leiste «tritt zurück» (Erwartet-Text des Befunds).
  // Muss VOR den frühen `return`s stehen (Hook-Reihenfolge); die eigentliche
  // Ziel-Liste hängt an post-Guard-Werten (`snap`) und wird darum ERST im
  // Effekt-Rumpf per DOM-Abfrage gelesen, nicht aus `navZiele` (unten, §Hooks).
  const [aktivAnker, setAktivAnker] = useState<string | null>(null);
  useEffect(() => {
    if (zustand !== 'da' || lese || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setAktivAnker(null);
      return;
    }
    const wurzelEl = koerperRef.current;
    if (!wurzelEl) { setAktivAnker(null); return; }
    const elemente = Array.from(wurzelEl.querySelectorAll<HTMLElement>('[id^="abschnitt-"]'));
    if (elemente.length === 0) { setAktivAnker(null); return; }
    const root = imPane ? wurzel?.current ?? null : null;
    const stickPx = Math.ceil(stickLeisteRef.current?.getBoundingClientRect().height ?? 0);
    const sichtbar = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => sichtbar.set(en.target, en.isIntersecting));
      const oben = elemente.find((el) => sichtbar.get(el));
      setAktivAnker(oben?.id ?? null);
    }, { root, rootMargin: `-${stickPx}px 0px -60% 0px`, threshold: 0 });
    elemente.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [zustand, snap, bodyTab, lese, imPane, wurzel]);

  // ── D-6 (Design-Konsistenz, 31.8.2026) · AUS DER SACKGASSE ───────────────
  // Hier stand die kargste der vier Fehl-Bauformen: ein Rücksprung mit «‹»,
  // darunter ein `lc-notice-warn`-Kasten — keine H1, kein Titel, kein zweiter
  // Weg und vor allem KEINE Nennung dessen, was der Nutzer aufgerufen hat.
  // Wer den Link «/rechtsprechung/bger_4A_100_2020» aus einer Mail öffnete, sah
  // nur, dass irgendetwas fehlt (§8). Jetzt derselbe Baustein wie die drei
  // anderen Flächen (`components/ui/FehlSeite`): Kopf, benannter Schlüssel,
  // ehrliche Erklärung — und der Weiterweg als Pflichtfeld statt als Sorgfalt.
  // Der Erklärsatz ist WÖRTLICH erhalten («Möglicherweise wurde er noch nicht
  // erfasst.»): er sagt, dass das Fehlen an unserem Bestand liegen kann und
  // nicht am Nutzer — ein §8-Satz, der nie wegvereinheitlicht wird.
  if (zustand === 'fehlt') {
    return (
      <FehlSeite bereich="Rechtsprechung" objekt="Entscheid" name={schluessel}
        erklaerung="Möglicherweise wurde er noch nicht erfasst."
        wege={[{ to: '/rechtsprechung', label: 'Zur Rechtsprechung' }]} />
    );
  }
  // W2·29-WERKBANK-REST S1: der geteilte Lade-Baustein (`ui/Ladeanzeige`,
  // W3-7) statt der siebten Kopie — Text wörtlich, neu mit `role="status"`.
  if (zustand === 'laden' || !snap) {
    return <Ladeanzeige text="Der Entscheid wird abgerufen …" className="py-12" />;
  }

  const regesteText = snap.regeste ? normalisiereRegeste(snap.regeste.text) : null;
  // Einheitlicher Kopf: Modell aus der reinen Regel-Lib (§3) — Komponente rendert nur.
  const kopf = kopfModell(snap);
  const kopfLabel = KOPF_LABEL[snap.sprache];
  // ── GA-2 (W2·24, 7.9.2026) · was der Kopf schon sagt, sagt er nicht zweimal ─
  // Beide Ableitungen sind rein und liegen in `entscheidLeserRegeln` (dort die
  // Messung und die Herleitung); hier stehen nur die zwei Aufrufe, damit die
  // Bänder unten lesbar bleiben.
  const datumImTitel = !snap.datumUnbekannt && angabeImTitel(snap.zitierung, datumOderStrich(snap.datum));
  const leitzeile = leitzeileOhneKopfangaben(kopf.leitzeile, [
    GEBIET_LABEL[snap.sachgebiet],   // steht in der Overline
    snap.gerichtName,                // steht in der H1 (Zitierung)
  ]);
  // BGE-Umschalter: nur wenn ein separater amtlicher Sammlungs-Auszug vorliegt.
  const hatAuszug = !!snap.auszugAbschnitte && snap.auszugAbschnitte.length > 0;

  // ── EINE Ansicht-Weiche (SSoT) — alles Sichtbare hängt an `ansicht` ────────
  // Der Tab-Umschalter erscheint nur beim BGE mit Volltext; sonst steht die
  // Ansicht fest (BGE ohne Volltext = amtlicher Auszug, alles übrige = Urteil).
  const switcherSichtbar = snap.gericht === 'bge' && hatAuszug;
  const ansicht: 'voll' | 'auszug' = switcherSichtbar ? bodyTab : (snap.gericht === 'bge' ? 'auszug' : 'voll');
  // Rubrum (Art. 112 BGG) gehört zum vollständigen Urteil, nicht zum kuratierten
  // Sammlungs-Auszug. Regeste umgekehrt: prominent im Leitentscheid-Auszug, nicht
  // über dem vollständigen Urteil (David: «bei vollständiges urteil nicht regeste oben»).
  const zeigeRubrum = ansicht === 'voll' && kopf.rubrumZeilen.length > 0;
  const zeigeRegeste = !!regesteText && (ansicht === 'auszug' || snap.gericht !== 'bge');
  // Massgebliche Fassung folgt der Ansicht: Voll → unterliegendes Urteil (aza),
  // Auszug → BGE-Sammlung. Fehlt die Urteils-Quelle, ehrlich markieren statt den
  // BGE als Urteil auszugeben (§8) und auf die BGE-Quelle zurückfallen.
  const massgeblicheUrl = ansicht === 'voll' ? (snap.azaUrteil?.quelleUrl ?? snap.quelleUrl) : snap.quelleUrl;
  // NUR beim BGE-Volltext ohne aufgelöstes aza-Urteil ist die Urteils-Quelle der Fallback
  // (BGE-Sammlung). Kantonale/Nicht-BGE-Entscheide haben quelleUrl = ihr eigenes Urteil →
  // kein «n.v.»-Marker, kein erfundener «BGE-Sammlungs»-Bezug (Bug-Check 26.6., §8).
  const massgeblichFehlt = snap.gericht === 'bge' && ansicht === 'voll' && !snap.azaUrteil?.quelleUrl;
  const massgeblichTitel = massgeblichFehlt
    ? 'Urteils-Quelle nicht verfügbar — dieser Link führt zur amtlichen BGE-Sammlungsquelle'
    : 'Die amtliche, massgebliche Fassung bei der Quelle öffnen';

  // Body folgt der Ansicht (nicht nur dem rohen Tab): im Auszug der amtliche
  // Sammlungstext, sonst das vollständige Urteil.
  const aktiveAbschnitte = ansicht === 'auszug' && hatAuszug ? snap.auszugAbschnitte! : snap.abschnitte;
  // sticky-Höhe als CSS-Variable: zweizeilig (Tabs + Sprung-Chips) bzw. einzeilig
  // (nur Sprung-Chips). Anker-Sektionen verrechnen das als scroll-margin-top.
  // In der Einzelansicht klebt die Leiste UNTER dem Inhalts-Kopf (Topbar 4rem +
  // Kopf 2.25rem); im Pane liegen Topbar/PaneKopf AUSSERHALB des Scroll-Containers
  // → Offset ~0. scroll-margin (--rsp-stick) entsprechend.
  // A-2-ABGRENZUNG: dies ist KEINE Weitenfrage und bleibt darum bei `imPane`.
  // Der Wert ist ein CSS-Variablen-INHALT (keine Klasse, also für `pk` gar nicht
  // erreichbar), und er beantwortet «wie hoch steht die App-Chrome über meinem
  // Scroll-Container» — das hängt an der Verschachtelung, nicht an der Breite.
  // Eine breite Pane bekäme mit einer Container-Query plötzlich die 12.75 rem
  // der Einzelansicht und schöbe jedes Sprungziel 145 px zu tief.
  const stickHoehe = imPane
    ? (switcherSichtbar ? '7rem' : '3.5rem')
    : (switcherSichtbar ? '12.75rem' : '9.25rem');
  // Sprung-Ziele: nach dem aktiven Body (+ Regeste, wenn sie gezeigt wird) — passt zur sichtbaren Ansicht.
  const vorhandene = new Set<Abschnittstyp>(aktiveAbschnitte.map((a) => a.typ));
  if (zeigeRegeste) vorhandene.add('regeste');
  const navZiele = NAV_TYPEN
    .filter((t) => vorhandene.has(t))
    .map((t) => ({
      anker: t === 'regeste' ? 'abschnitt-regeste' : abschnittAnker(t),
      label: t === 'regeste' && !snap.regesteAmtlich ? 'Zusammenfassung' : ABSCHNITT_TITEL[t],
    }));

  // ── LM-208 · Herkunft der Ankunft (nur bei ?norm=) ────────────────────────
  // Beide Zahlen kommen aus DEMSELBEN Muster wie die Markierung im Text (§5,
  // entscheidLeserRegeln): `ziele` sind die anspringbaren Erwägungs-Blöcke,
  // `gesamt` alle wörtlichen Nennungen der sichtbaren Fassung. Aus den Daten
  // gerechnet, nicht aus dem DOM — die Zeile steht damit im ersten Render
  // richtig da (kein Nachwachsen/Umspringen, §15.2). Linearer Regex-Lauf über
  // die Blöcke der aktiven Fassung; nur bei gesetztem ?norm=.
  const herkunft = normParam ? {
    ziele: nennungsAnker(aktiveAbschnitte, normParam),
    gesamt: aktiveAbschnitte.reduce(
      (n, a) => n + a.bloecke.reduce((m, b) => m + zaehleNennungen(b.text, normParam), 0), 0),
  } : null;
  const springeZuFundstelle = () => {
    if (!herkunft || herkunft.ziele.length === 0) return;
    springeZuAbschnitt(herkunft.ziele[fundIdx % herkunft.ziele.length]);
    setFundIdx((n) => (n + 1) % herkunft.ziele.length);
  };

  // R12 «Kopieren mit Fundstelle»: Zitierung + Stand-Ausweis in die Zwischenablage.
  // B-6 (QS-BASIS): Abrufdatum + Permalink (§7 a–d); ein Entscheid hat keine
  // Konsolidierung → keine «Fassung» (§8). Ohne origin (SSR/kein window): nur die
  // Zitierung, ehrlich ohne erfundenen Permalink.
  // R4-D (5.9.2026): die Mechanik lief hier von Hand — ohne Timer-Handle (zwei
  // Klicks liessen zwei Timer laufen, der ältere löschte die frische Quittung)
  // und ohne Unmount-Aufräumen. Beides bringt der geteilte Hook mit; der Text
  // entsteht erst beim Klick (Abrufdatum, Permalink) und geht darum als
  // Argument hinein (§5/§10).
  const kopiereZitat = () => {
    const url = typeof location !== 'undefined' ? `${location.origin}${location.pathname}` : '';
    kopieren({
      text: url ? zitatMitAusweis(snap.zitierung, { abruf: heuteIso(new Date()), permalink: url }) : snap.zitierung,
      ansage: 'Zitat kopiert',
    });
  };

  return (
    <div className="space-y-5" style={{ '--rsp-stick': stickHoehe } as CSSProperties}>
      {/* Anker-Sektionen des EntscheidBody tragen ein festes scroll-mt-[7rem]; hier
          auf die tatsächliche sticky-Höhe (--rsp-stick) heben, damit ein angesprungener
          Abschnitt nicht hinter dem gemeinsamen Kopf-Block verschwindet. Greift nur im
          Haupt-Body (.rsp-anker), nicht im Lesemodus-Overlay (eigene schlanke Leiste).
          LM-002 (W2·17-UI-BEFUNDE-B3, K-01): `#kontext-titel` (KontextPanel-
          Überschrift «Kontext») liegt AUSSERHALB von `.rsp-anker` (nach dem
          `<footer>`, s. u.) — aber innerhalb DIESES Wrappers, der `--rsp-stick`
          trägt, darum hier reichbar. Ohne eigene scroll-margin landete ein
          gezielter Sprung/eine Find-Landung dorthin unter der klebenden
          Sachverhalt/Erwägungen/Dispositiv-Leiste (nur die unterste Pixelreihe
          der Überschrift blieb sichtbar) — reproduziert exakt wie gemeldet. */}
      <style>{`.rsp-anker [id],#kontext-titel{scroll-margin-top:var(--rsp-stick,7rem)}`}</style>
      {/* Breadcrumb trägt der Kopf (Inhalts-Kopf in der Einzelansicht, PaneKopf im
          Split-View) — kein Inline-Dup mehr (Parität zum Gesetz-Leser). */}
      {/* ── B-4 (Design-Konsistenz Runde 2, 31.8.2026) · DIE BÄNDER-ORDNUNG ───
          Dieser Kopf war die letzte MISCH-ZEILE der drei Leser: in EINEM Streifen
          standen Fakten (Urteilsdatum, BGE-Referenz, Parallelnummer), drei
          §8-Badges und vier Aktionen (Quell-Link, Schriftgrösse, Zitat kopieren,
          Lesemodus) nebeneinander — genau die Vermengung, die Ä6 im Erlass-Kopf
          schon 2026 aufgelöst hatte («neun gleich aussehende Chips, darunter
          drei grundverschiedene Dinge»). Er trennt jetzt nach ROLLE, mit dem
          geteilten Gerüst `layout/LeserKopfGeruest` (§5/§10):
            Overline · Titel · Fakten · Stand+Ehrlichkeit · Aktionen.
          Die Aktionen verlieren dabei ihr `ml-auto` (sie standen rechtsbündig am
          Ende der Misch-Zeile) und stehen wie im Erlass-Kopf links im eigenen
          Band; ihre Chip-Anatomie neutralisiert `.lc-kopf-aktionen`, das
          44-px-Tap-Ziel bleibt (F2b). Kein Knopf, kein Wort und keine Reihenfolge
          innerhalb der Bänder ändert sich. */}
      <LeserKopfGeruest
        // ── W2·29-WERKBANK-REST S1 (25.9.2026) · TITELBLATT «RECHTSPRECHUNG» ──
        // Board «Unter-Entscheid»: die Identität (Overline · Zitierung ·
        // Leitzeile · Fakten) steht auf der Registerfläche der Rubrik — dasselbe
        // Band wie der Erlass-Kopf (LESER S2), Register «r» statt «g». Herkunfts-
        // Hinweis und Rubrum stehen darunter auf dem Papier (`nachBand`): beide
        // tragen Bedienelemente bzw. `lc-overline`-Etiketten, deren Töne nur auf
        // Papier ihre 4.5:1 halten. Kein Wort, kein Knopf und keine Reihenfolge
        // innerhalb der Bänder ändert sich; neu ist allein das Abrufdatum im
        // Stand-Band (Board-Zeile «abgerufen am», Datenfeld `abgerufen`, §7).
        form="titelblatt"
        register="r"
        // 1 Identität: Gericht · Abteilung · Sachgebiet.
        // B-7 (31.8.2026): dieselbe dreigliedrige Ordnung, die jetzt auch der
        // Erlass-Kopf trägt — hier war sie zu Hause, dort fehlte sie
        // (Definition und Ton: `layout/LeserKopfGeruest`, `KopfOverline`).
        // J3 (§8): Sachgebiet ist maschinell zugeordnet — der title sagt es an
        // Ort und Stelle; das Badge dazu trägt der Kopf bereits (V1.2, unten).
        overline={<KopfOverline glieder={[
          // GA-2 (7.9.2026): der Gerichtsname steht nur hier, wenn die
          // ZITIERUNG darunter ihn nicht ohnehin wörtlich trägt — sie tut es am
          // heutigen Korpus fast immer («Obergericht AG HOR.2024.19 vom …»),
          // und dann war die Overline die dritte Nennung desselben Namens im
          // selben Bild (Herleitung: `entscheidLeserRegeln`, GA-2).
          angabeImTitel(snap.zitierung, snap.gerichtName)
            ? null : { text: snap.gerichtName, rolle: 'herkunft' },
          snap.abteilung ? { text: snap.abteilung, rolle: 'art' } : null,
          {
            text: GEBIET_LABEL[snap.sachgebiet], rolle: 'sachgebiet',
            title: snap.kuratierung === 'maschinell' ? 'Sachgebiet maschinell zugeordnet' : undefined,
          },
        ]} />}
        /* 2 Zitierung = Identitäts-Anker (stets, prominent). LM-019 (§8 B7): bei
           offenem Lesemodus blendet NUR der `<article>`-Body aus (weiter unten,
           `{!lese && …}`) — dieser Kopf inkl. H1 blieb bisher im DOM, während das
           Overlay (LesemodusOverlay, `createPortal`) DENSELBEN Titel als EIGENES
           H1 zeigt: zwei H1 mit identischem Text gleichzeitig im Dokument (axe/
           WCAG 1.3.1, Doppel-Landmarke). `hidden` (display:none) nimmt dieses H1
           aus dem Accessibility-Baum, solange das Overlay-H1 die Rolle trägt —
           visuell ohnehin unter dem opaken Vollbild-Overlay verdeckt.
           A-1-Nachzug (BAU-4): die H1 kommt aus dem EINEN Titel-Baustein. Die
           Mono-Stimme (`num`) BLEIBT — sie ist hier keine Datums-, sondern die
           Zitierung selbst, und genau darauf ist die Mono-Stimme begrenzt
           (Design-Grundlage Kap. 2.1: SR-Nr./Aktenzeichen). Ausserhalb eines
           Panes ist die Klassenzeile zeichengleich zum Vorzustand (Prerender
           der 5'093 Entscheid-Seiten unberührt); im Pane misst die Kaskade
           neu die Pane- statt die Fensterbreite. */
        /* G3 (Gesamtprüfung 6.9.2026): `stimme="serif"`. Der Entscheid-Titel lief
           als einziger Leser-Titel in der Sans-Display-Stimme, während Erlass-
           und Vorlagen-Leser Literata sprechen — im Split-View standen beide
           nebeneinander (Screen 15). Ein Urteil IST zitierfähiger Quelltext,
           also die Stimme, für die `ui/SeitenTitel` sie vorsieht. Die
           `num`-Klasse bleibt: sie setzt nur `tabular-nums`, keine Schriftart. */
        titel={<SeitenTitel stimme="serif" className={`num${lese ? ' hidden' : ''}`}>{snap.zitierung}</SeitenTitel>}
        nachTitel={
          <>
            {/* 3 Abgeleitete Sachgebiets-Leitzeile — nur wenn weder ein Rubrum-Gegenstand
                noch die Regeste-Box das Thema trägt (kopf.ts entscheidet, §3/§5). Nüchtern +
                ehrlicher Marker, dass sie aus der Struktur abgeleitet ist (§8). */}
            {leitzeile && (
              <div className="space-y-0.5">
                <p className="text-body-s leading-snug text-ink-700">{leitzeile}</p>
                <p className="text-micro italic text-ink-500">{SYNTH_MARKER[snap.sprache]}</p>
              </div>
            )}
          </>
        }
        nachBand={
          <>

            {/* 3b LM-208 · Herkunfts-Hinweis: wer über einen Norm-Chip hierher kam, sah
                bisher nirgends, über welche Norm — und musste die Stelle in einem
                24'000-Zeichen-Urteil selbst suchen. Chip-Grammatik der Metazeile
                (<span> flach, <button> gerahmt); die Norm selbst über NormText, damit
                der Rückweg ein lebender Link ist (§13-D1). Der A17-Seitenanfang bleibt
                unangetastet — hier kommt nur eine Zeile hinzu, kein Sprungverhalten. */}
            {herkunft && normParam && (
              <div className="lc-chip-zeile flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-ink-500">
                <span>Aufgerufen über <NormText text={normParam} /></span>
                {herkunft.ziele.length > 0 ? (
                  <button type="button" onClick={springeZuFundstelle}
                    className="lc-chip hover:text-accent-text hover:border-accent-line"
                    title="Zur nächsten wörtlichen Nennung in den Erwägungen springen">
                    {/* Abstand als Klasse, nicht als Leerzeichen: `.lc-chip` ist ein
                        Flex-Container, dort fallen reine Whitespace-Knoten zwischen
                        zwei Flex-Items weg (Screenshot-Befund «Fundstelle1/2»). */}
                    ↓ Fundstelle
                    <span className="num ml-1">{(fundIdx % herkunft.ziele.length) + 1}/{herkunft.ziele.length}</span>
                  </button>
                ) : herkunft.gesamt > 0 ? (
                  // Genannt, aber ausserhalb der Erwägungen (Sachverhalt/Dispositiv):
                  // markiert ja, anspringbarer Anker nein — ehrlich benannt (§8).
                  <span title="Die Nennung liegt ausserhalb der Erwägungen und ist im Text markiert">
                    im Text markiert, kein Erwägungs-Anker
                  </span>
                ) : (
                  // Der reproduzierte Fall: der Entscheid schreibt «Art. 367 ff. OR».
                  // Das «ff.» aufzulösen wäre geraten (§1/§8) — also ehrlich sagen,
                  // dass die Norm nicht wörtlich in dieser Form im Text steht.
                  <span title="Der Entscheid nennt diese Norm nicht in exakt dieser Form (z. B. nur als «… ff.» oder mit Absatz-Angabe)">
                    im Text nicht wörtlich genannt
                  </span>
                )}
              </div>
            )}

            {/* 4 Rubrum-Zeilen IM Kopf (Art. 112 BGG): nur befüllte Felder, feste Reihenfolge
                Gegenstand→Parteien→Vorinstanz→Besetzung, per Haarlinie abgesetzt (kein Kasten).
                Nur in der Voll-Ansicht — der amtliche BGE-Auszug trägt kein Rubrum. */}
            {zeigeRubrum && (
              // A-2: das Rubrum bricht in EINE Spalte um, sobald neben 7 rem
              // Etikett keine lesbare Wertspalte mehr bleibt. Das war eine
              // Fensterfrage (`sm:`) und ist eine Platzfrage: in einer schmalen
              // Pane standen «Vorinstanz» und ein langer Gerichtsname
              // nebeneinander in je ~120 px.
              <dl className={pk(
                'mt-1 grid grid-cols-1 sm:grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 text-body-s',
                'mt-1 grid grid-cols-1 @xl/pane:grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 text-body-s',
              )}>
                {kopf.rubrumZeilen.map((z) => (
                  <div key={z.label} className="contents">
                    <dt className="lc-overline pt-0.5">{kopfLabel[z.label]}</dt>
                    <dd className={z.label === 'gegenstand' ? 'text-ink-800' : 'text-ink-700'}>
                      {z.label === 'besetzung'
                        ? <BesetzungWert freitext={z.wert} gericht={snap.gericht} refs={eintrag?.richter} />
                        : z.wert}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        }
        /* 5a Fakten — die nüchternen Identitäts-Angaben, «·»-gefügt vom Gerüst.
           B-5 (31.8.2026): der Referenz-Chip steht nur noch, wenn die H1 darüber
           die Referenz NICHT schon wörtlich trägt — am heutigen Korpus also nie
           (1259/1259 gemessen), an einem künftigen «BGer …» MIT Sammlungsreferenz
           sehr wohl. Die Entscheidung liegt in `referenzImTitel` (rein,
           wortgrenzen-genau, dort begründet).
           BS §7.2: die parallele Zweit-Geschäftsnummer desselben Verfahrens
           («ZB.2023.4 (AG.2023.…)») ist Identität, keine zweite Zitierung. */
        fakten={[
          // GA-2 (7.9.2026): «Entscheid vom 12.12.2025» entfällt, wenn die
          // Zitierung darüber dasselbe Datum wörtlich führt — sonst steht das
          // Urteilsdatum zweimal in 60 px. Fehlt es im Titel (BGE-Zitierungen,
          // «Entscheiddatum nicht publiziert», BGE-Jahrgang), bleibt die Zeile.
          datumImTitel ? null : <DatumMeta snap={snap} />,
          snap.bgeReferenz && !referenzImTitel(snap.zitierung, snap.bgeReferenz)
            ? <span className="num">{snap.bgeReferenz}</span> : null,
          snap.nummerSekundaer
            ? <span className="num" title="Parallele Geschäftsnummer desselben Verfahrens">({snap.nummerSekundaer})</span>
            : null,
        ].filter(Boolean) as ReactNode[]}
        /* 5a' Herkunft (REST S1): das Abrufdatum des Snapshots — dieselbe
           Frage wie der Standausweis des Erlass-Kopfs («von wann ist diese
           Kopie?»). Der ECLI des Boards steht bewusst NICHT hier: er wird in
           `lib/rechtsprechung/ecli.ts` selbst gebildet, nicht amtlich
           vergeben — als Herkunfts-Angabe gezeigt, behauptete er eine
           Quelle, die es nicht gibt (§7/§8; offene Frage an David). */
        stand={[<span key="abruf">Abgerufen <Datum iso={snap.abgerufen} /></span>]}
        /* 5b Stand + Ehrlichkeit — dieselbe Zelle wie der Standausweis des
           Erlass-Kopfs, weil sie dieselbe Frage beantwortet: wie belastbar ist,
           was hier steht?
           V1.2 (W2·7-VZUI): geteiltes StatusBadge-Vokabular — aria-label
           textgleich zu Suche/Panel/Leitfall-Zeile; das Leitentscheid-Badge ist
           hier interaktiv (Begriff-Tooltip, fokussier- und touch-bedienbar,
           Magic Moment 4).
           ── §8-EHRLICHKEIT VOR DEM LESEN (B-4, 31.8.2026) ────────────────────
           Der Vorbehalt «massgeblich ist die amtliche Fassung» stand in diesem
           Leser als EINZIGEM nur im Provenienz-Fuss — also erst, nachdem man ein
           24'000-Zeichen-Urteil gelesen hat. Im Erlass-Kopf steht derselbe
           Vorbehalt seit S3 in dieser Zelle, VOR dem Lesen («Kopie vom … —
           massgeblich ist die amtliche Fassung»). PROMOTION, kein Neubau: der
           Satzbaustein ist derselbe (`lib/benennung`, §5), der Fuss behält seinen
           vollen Absatz unverändert — ein Ehrlichkeits-Satz wird nie leiser,
           wenn er zusätzlich früher steht (§8). */
        ehrlichkeit={
          <div className="space-y-1 text-xs text-ink-500">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {snap.leitcharakter === 'leitentscheid' && <StatusBadge praedikat="leitentscheid" interaktiv />}
              <span className="lc-badge lc-badge-soft" title={spracheBadgeTitel(snap.sprache)}>{snap.sprache}</span>
              {snap.kuratierung === 'maschinell' && <StatusBadge praedikat="maschinell" variant="text" />}
            </div>
            <p className="leading-snug">Wiedergabe des amtlichen Urteilstexts — {MASSGEBLICH_HALBSATZ}</p>
          </div>
        }
        aktionen={
          <>
            {/* Amtliche Quelle direkt oben erreichbar (§8) — folgt der Ansicht
                (Voll → Urteil/aza, Auszug → BGE-Sammlung).
                ── B-1-NACHZUG (31.8.2026) · EIN NAME, EINE FORM ──────────────
                Hier stand die fünfte Optik desselben Links: «↗ massgebliche
                Fassung», Pfeil VORNE und klein beginnend — gegen Ä110, und drei
                Klicks entfernt hiess derselbe Link im Erlass-Kopf «Amtliche
                Fassung ↗». Jetzt der geteilte `ui/QuellLink`.
                Der §8-Marker «(Urteil n. v.)» bleibt SICHTBARER Teil des
                Namens: er sagt, dass dieser Link beim BGE ohne aufgelöstes
                Urteil auf die Sammlungsquelle führt — eine Tatsache, die kein
                Tooltip allein tragen darf (auf Touch unerreichbar). Er läuft
                darum über `children` statt als eigener, gedämpfter <span>;
                die Dämpfung war das Einzige, was dabei fällt. */}
            <MassgeblicheFassung url={massgeblicheUrl} titel={massgeblichTitel} fehlt={massgeblichFehlt}
              className="lc-chip hover:text-accent-text hover:border-accent-line" />
            {/* R17: Lese-Schriftgrösse */}
            {/* shrink-0: das Aktionen-Band ist ein flex-wrap-Streifen; ohne dies
                staucht der Flex die overflow-hidden-Gruppe bei 390 unter ihre
                Inhaltsbreite und beschnitt «A− A+» (Responsive-Audit D5). */}
            {/* ── ENTSCHEID DAVID 5B (29.8.2026) · NACHZUG IM ENTSCHEID-LESER ──
                C4 war im Gesetzes-Leser und in der Topbar ausgerollt, hier nicht:
                ab lg steht der globale App-Regler («Ganze Seite A− 100 % A+»,
                `layout/Topbar.tsx`) gleichzeitig im Bild, und diese Gruppe hiess
                bloss «Schriftgrösse» — zwei sichtbar gleiche A−/A+, einer mit
                Scope, einer ohne. Das ist derselbe Befund, den 5B im Gesetzes-
                Leser behoben hat, eine Route weiter (Fehlerbuch-18: «Kern: Scope
                nur im aria-label»).
                Darum hier dieselbe Behandlung wie dort: der Scope steht SICHTBAR
                davor, in derselben Anordnung (Wort links, Steller rechts), und
                das «Nur» trägt die Abgrenzung. Der Zwilling im Lesemodus-Overlay
                (weiter unten) bekommt nur den Namen, nicht das Wort — dort ist
                der globale Regler weder sichtbar noch im a11y-Baum (`aria-modal`
                deckt ihn zu), es gibt also keinen Zwilling zu unterscheiden. */}
            <span className="inline-flex shrink-0 items-center gap-1.5" role="group" aria-label="Grösse nur des Entscheidtexts">
              <span aria-hidden className="select-none whitespace-nowrap text-micro text-ink-500">Nur Entscheidtext</span>
              {/* B-K1 (R9-2, 6.9.2026): die beiden Stufenknöpfe waren die EINZIGEN
                  rohen `<button>` dieser Datei — ein selbstgezeichnetes Segment-
                  Steuerelement (aussen `rounded border border-line overflow-hidden`,
                  innen `min-h-6 px-2 py-1` plus eine Trennlinie von Hand), während
                  die Nachbarn derselben Zeile (Fundstelle, Zitat kopieren, Lesemodus)
                  auf `.lc-chip` stehen. Kanon für kleine Textknöpfe in einer Meta-
                  Zeile ist `.lc-btn-mini` — dieselbe Bauform wie die Zitat/Link-Paare
                  im Gesetzes-Leser (`parts/ArtikelLeser.tsx:522/523`) und der
                  Zurücksetzer der Filterleiste (`EntscheidFilter.tsx:355`); die
                  Haarlinie IST dort die Anatomie, jeder Knopf trägt sie selbst, und
                  die Höhe kommt aus `--tap-ziel` statt aus einer `min-h-6`-Zahl.
                  `rounded` fällt weg (Radius-Token = 0, F0.5). Handler, `disabled`,
                  `aria-label`, `title`, `role="group"` und Fokus-Reihenfolge
                  unverändert. */}
              <span className="inline-flex items-center gap-1">
                <button type="button" onClick={() => setFs(fsIdx - 1)} disabled={fsIdx === 0}
                  aria-label="Entscheidtext verkleinern"
                  title="Entscheidtext verkleinern — die Anwendung bleibt gleich gross"
                  className="lc-btn-mini text-ink-600 hover:text-accent-text disabled:opacity-40">A−</button>
                <button type="button" onClick={() => setFs(fsIdx + 1)} disabled={fsIdx === FS_STUFEN.length - 1}
                  aria-label="Entscheidtext vergrössern"
                  title="Entscheidtext vergrössern — die Anwendung bleibt gleich gross"
                  className="lc-btn-mini text-ink-600 hover:text-accent-text disabled:opacity-40">A+</button>
              </span>
            </span>
            <button type="button" onClick={kopiereZitat}
              className="lc-chip hover:text-accent-text hover:border-accent-line"
              title="Zitierung + Link in die Zwischenablage kopieren">
              {kopiert ? '✓ kopiert' : '⧉ Zitat kopieren'}
            </button>
            <button type="button" onClick={oeffneLese}
              className="lc-chip hover:text-accent-text hover:border-accent-line"
              title="Ablenkungsfreier Lesemodus">
              ▭ Lesemodus
            </button>
          </>
        }
      />

      {/* Gemeinsamer sticky Kopf-Block (§13-Bug-Fix: EIN sticky-Element statt zweier
          sich überlagernder). Oben — beim BGE mit Volltext — der Fassungs-Umschalter
          (§8: «Amtlicher BGE-Auszug» ⟷ «Vollständiges Urteil»), darunter die Sprung-Chips.
          Die App-Topbar liegt mit z-leiste (20) darüber, dieser Block mit
          z-entscheid-sticky (15) darunter (Schichtungs-Skala, C3, index.css).
          LM-007 (W2·17-UI-BEFUNDE-B3, K-01, Mittel): Topbar + dieser Block belegten
          beim BGE-Volltext (Umschalter sichtbar) rund 190 px dauerhaft sichtbare
          Höhe. B6 (FAHRPLAN-VERZAHNUNG-UI.md §9, «minimalistischer») als Muster
          übernommen — kein Feature-Abbau, nur knapperes Mass: `py-2`→`py-1.5`,
          `space-y-2`→`space-y-1.5`, Umschalter-Tabs `groesse="s"` (h-10/h-8 statt
          h-11/h-9). `stickHoehe` bleibt bewusst UNVERÄNDERT (grosszügig statt knapp
          bemessen) — die Sprung-Ziele landen weiterhin sicher unterhalb der Leiste,
          nur mit etwas mehr Luft als nötig statt zu wenig. */}
      {(switcherSichtbar || navZiele.length > 0) && (
        // A-2-ABGRENZUNG (zwei Zeilen, zwei Begründungen):
        //  · `top` bleibt an `imPane`: es misst die App-Chrome ÜBER dem
        //    Scroll-Container (Topbar + Inhalts-Kopf bzw. gar nichts), keine
        //    Breite — dieselbe Herleitung wie bei `stickHoehe` oben.
        //  · Die Randklassen `-mx-5 sm:-mx-6 px-5 sm:px-6` bleiben `sm:` und
        //    werden AUSDRÜCKLICH NICHT auf eine Container-Query gezogen: sie
        //    spiegeln die Polsterung des Pane-Wrappers (`layout/Pane.tsx`:
        //    `px-5 sm:px-6`), damit die klebende Leiste bündig an die Kante
        //    läuft. Diese Polsterung ist selbst viewport-gesteuert; eine
        //    Container-Query hier hiesse, dass der negative Rand in einer
        //    breiten Pane bei schmalem Fenster (oder umgekehrt) um 4 px neben
        //    der Kante steht. Zwei Massstäbe für dieselbe Kante sind schlimmer
        //    als ein alter — der Nachzug gehört an den Pane-Wrapper und ist als
        //    Nebenfund gemeldet, nicht hier.
        <div ref={stickLeisteRef} style={{ top: imPane ? '0.5rem' : 'calc(4rem + 2.25rem)' }}
          className="sticky z-entscheid-sticky -mx-5 sm:-mx-6 px-5 sm:px-6 py-1.5 bg-paper border-b border-line space-y-1.5">
          {switcherSichtbar && (
            <Tabs
              items={[
                { code: 'auszug', label: 'Amtlicher BGE-Auszug' },
                { code: 'voll', label: <>Vollständiges Urteil{snap.azaUrteil && <span className="num"> · {snap.azaUrteil.aktenzeichen}</span>}</> },
              ]}
              value={bodyTab}
              onChange={wechsleTab}
              mode="tab"
              groesse="s"
              ariaLabel="Textfassung des Entscheids"
            />
          )}
          <SprungNavigation ziele={navZiele} springe={springeZuAbschnitt} aktiv={aktivAnker} />
        </div>
      )}

      {/* Einordnung der gewählten Fassung (nicht sticky), gekoppelt an die Ansicht. */}
      {switcherSichtbar && (
        <p className="text-micro text-ink-500 max-w-kleintext">
          {ansicht === 'voll'
            ? <>Das vollständige unterliegende Urteil <span className="num">{snap.azaUrteil?.aktenzeichen}</span> — Grundlage der amtlichen Sammlung BGE <span className="num">{snap.bgeReferenz}</span>.</>
            : <>Der amtlich publizierte Auszug der Sammlung BGE <span className="num">{snap.bgeReferenz}</span> — vom Gericht kuratiert.</>}
        </p>
      )}

      {/* BGE ohne aufgelösten Volltext: nur der Sammlungs-Auszug + Live-Link (§8). */}
      {snap.gericht === 'bge' && !hatAuszug && (
        // B-1-NACHZUG (31.8.2026): dieser Satz VERWEIST auf den Link oben und
        // nannte ihn beim alten Namen («↗ massgebliche Fassung»). Ein Verweis,
        // der anders heisst als sein Ziel, ist eine Wegbeschreibung ins Leere —
        // darum kommt der Name hier aus derselben Konstante wie der Link selbst
        // (§5). Der Pfeil steht ausgeschrieben dahinter, weil der Nutzer genau
        // diese Beschriftung suchen soll.
        <p className="text-micro text-ink-500 max-w-kleintext">
          Auszug aus der amtlichen Sammlung (BGE <span className="num">{snap.bgeReferenz}</span>). Das vollständige Urteil ist bei der Quelle verfügbar ({AMTLICHE_FASSUNG} ↗, oben).
        </p>
      )}

      {/* ── Lesefläche + Erwägungs-Rail (V5, W2·10-UI-NAV) ────────────────────
          Ab `xl` zwei Spalten: links die unveränderte Lesespalte (Regeste +
          EntscheidBody, weiterhin `max-w-reading`), rechts der sticky
          Navigations-Rail. Darunter — und im Pane, wo keine zweite Spalte
          hineinpasst — steht der Rail als aufklappbarer Block ÜBER dem Text
          (`order`), nie darunter: eine Navigation hinter dem Ziel ist keine.
          Regeste und Body liegen bewusst in DERSELBEN Spalte, sonst fluchtete
          die Regeste-Box auf `xl` nicht mehr mit dem Text darunter.
          Bei offenem Lesemodus entfällt NUR der `<article>` — der Overlay zeigt
          denselben EntscheidBody, und doppelte Abschnitts-`id` wären ungültiges
          HTML + brächen Anker-Sprünge. Die Regeste bleibt wie bisher im DOM
          (ihr Anker `#abschnitt-regeste` ist Sprungziel der Leiste). */}
      {(
        // ── A-2 (31.8.2026) · DAS ZWEISPALTEN-BILD FOLGT DER PANE-BREITE ────
        // Bis hierher gab es im Pane GAR KEINE zweite Spalte: der Rail lag dort
        // grundsätzlich über dem Text, auch wenn die Pane 1000 px breit war —
        // während dasselbe Bild im Fenster ab 1280 px zweispaltig stand. Jetzt
        // entscheidet in der Pane die Pane-Breite (Mechanik wie
        // `Rechtsprechung.tsx`, `usePaneKlasse`).
        // SCHWELLE `@5xl/pane` = 64 rem, GERECHNET statt gewählt: die zweite
        // Spalte lohnt erst, wenn die Lesespalte daneben ihre volle Breite
        // behält. Nötig sind `max-w-reading` 40 rem + Rail 15 rem + `gap-8`
        // 2 rem = 57 rem INHALT, plus die Pane-Polsterung 2×1.25 rem = 59.5 rem
        // Pane-Breite. Die nächste Container-Stufe darüber ist 64 rem; die
        // Stufe darunter (@4xl, 56 rem) drückte die Lesespalte auf ~36 rem und
        // damit unter die 60–75-Zeichen-Regel (Reglement R1) — genau der
        // Logikverlust, den §1 der Optik vorzieht.
        // Der `@3xl`-Wert aus `Rechtsprechung.tsx` gilt dort für ZWEI GLEICHE
        // Kartenspalten; er ist das Vorbild für die Mechanik, nicht für die Zahl.
        <div className={pk(
          'flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start xl:gap-8',
          'flex flex-col gap-4 @5xl/pane:grid @5xl/pane:grid-cols-[minmax(0,1fr)_15rem] @5xl/pane:items-start @5xl/pane:gap-8',
        )}>
          {/* B6 (§9-Bug-Check 4.8.2026): im LESEMODUS gibt es den Rail nicht.
              Dort ist der Haupt-Body ausgehängt (der Overlay zeigt seinen
              eigenen), die Treffer-Markierung ist abgeschaltet und jeder
              Sprung liefe still ins Leere — eine Trefferzahl neben toten
              Sprungzielen ist genau die Halb-Auskunft, die §8 verbietet.
              Der Suchbegriff bleibt im State: wer den Lesemodus schliesst,
              findet seine Suche unverändert vor. */}
          {/* ── W2·28 · L-1 · RAIL UND TREFFER-LANDKARTE ───────────────────
              Gleiche Bauart und gleiche Grenzen wie im Gesetz-Leser
              (`gesetz-leser/v3/suchZoneAufbau.tsx`): der Streifen liegt `fixed`
              am rechten Fensterrand, also ohne jeden Platz im Fluss (CLS 0 per
              Konstruktion), steht nur mit laufender Suche, nur wenn die
              Hervorhebung nicht weggeschaltet ist, nur mit Treffern, nur ab
              `xl` und nie in einer Pane. Im Lesemodus gibt es ihn so wenig wie
              den Rail (B6): dort sind die Sprungziele nicht im DOM.
              `!imPane`: in einer Pane steht neben dem Lesemass gemessen keine
              Randluft — der Streifen läge über dem Wortlaut. Die Bedingung ist
              darum ein Nicht-Rendern und keine Container-Query-Klasse; die
              Fenster-Schwelle trägt das Bauteil selbst (Herleitung dort).
              Die drei ÜBRIGEN Bedingungen — «es gibt überhaupt Treffer»,
              «laufende Suche», «Hervorhebung nicht weggeschaltet» — stehen in
              `ErwBereich`, weil nur dort die Zahl GEWERTET vorliegt (§5, §
              Falle a 21.9.2026): `markenAus` hier ist roh und speist nur noch
              die Hervorhebung im Lesetext (unten); Landkarte, Rail-Schranke
              und Schalter-Anzeige hängen an `sucheAktiv` (roh UND gewertet
              nicht leer). Vorsorge, kein gemessener Altbefund: vorher hingen
              Schalter und Landkarte beide am rohen Stand und fielen im selben
              Render; seit sie am gewerteten hängen, muss auch der Schalter
              dort rechnen, sonst läge er beim Leeren einen Tick daneben. */}
          {!lese && (
            <ErwBereich abschnitte={aktiveAbschnitte} zitierteNormen={snap.zitierteNormen}
              suche={suche} onSuche={setzeSuche} springe={springeZuAbschnitt}
              markenAusRoh={markenAusRoh} onMarkenSchalten={setzeMarkenAus}
              landkarteSteht={!imPane}
              aktivAnker={aktivAnker} />
          )}
          {/* Dieselbe Schwelle wie der Grid darüber — sonst stünde die
              Lesespalte in der Pane einspaltig unter einem zweispaltigen
              Raster (`order`/`col-start` müssen mit dem Grid schalten). */}
          <div className={pk(
            'order-2 min-w-0 xl:order-1 xl:col-start-1 xl:row-start-1',
            'order-2 min-w-0 @5xl/pane:order-1 @5xl/pane:col-start-1 @5xl/pane:row-start-1',
          )}>
            {/* Regeste prominent im Leitentscheid-Auszug (zeigeRegeste). Beim amtlich
                publizierten BGE «Regeste», sonst maschinelle «Zusammenfassung» — ehrlich
                gekennzeichnet (Abnahme-Kritik: kein Etikettenschwindel).
                D-1.4 (Befund 20): Regeste in die Lesespalte — vorher volle Breite
                (~115–120 CPL im wichtigsten Textblock); jetzt dieselbe zentrierte
                max-w-reading-Spalte wie der EntscheidBody darunter. */}
            {zeigeRegeste && snap.regeste && (
              <div className="mx-auto mb-5 w-full max-w-reading">
                <RegesteBlock regeste={snap.regeste} amtlich={snap.regesteAmtlich} />
              </div>
            )}
            {/* Lesespalte 60–75 Zeichen (Reglement R1). */}
            {!lese && (
              <article ref={koerperRef} className="rsp-anker mx-auto w-full max-w-reading" style={{ '--rsp-fs': `${FS_STUFEN[fsIdx]}rem` } as CSSProperties}>
                <EntscheidBody abschnitte={aktiveAbschnitte} zitierung={snap.zitierung} bgeReferenz={snap.bgeReferenz} quarantaene={snap.quarantaene} />
              </article>
            )}
          </div>
        </div>
      )}

      {/* Provenienz / Rechtslage (§7/§8) */}
      <footer className="mt-12 border-t border-line pt-5 space-y-3 text-body-s text-ink-500">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <MassgeblicheFassung url={massgeblicheUrl} titel={massgeblichTitel} fehlt={massgeblichFehlt}
            className="lc-chip no-underline hover:text-accent-text hover:border-accent-line" />
          <span className="text-ink-500">Daten: {QUELLE_LABEL[snap.quelle] ?? snap.quelle}</span>
        </div>
        {/* B-6-NACHZUG (31.8.2026): der Schlusssatz sagte «die amtliche QUELLE»,
            derselbe Vorbehalt im Erlass-Kopf «die amtliche FASSUNG» — ein
            Bezugsobjekt, zwei Nomen. Er kommt jetzt als Ganzes aus
            `lib/benennung.MASSGEBLICH_SATZ` (Herleitung dort).
            §8: «stets» ist kein Verlust, sondern Teil der Konstante — der
            Vorbehalt wird durch die Vereinheitlichung nicht leiser. Aus dem
            Halbsatz nach Gedankenstrich wird ein eigener Satz, weil die
            Konstante diese Form trägt; ein zweites Literal für die
            Halbsatz-Grammatik wäre wieder eine zweite Wahrheit (§5). */}
        <p className="text-micro text-ink-500 max-w-kleintext leading-relaxed">
          Der Urteilstext ist als amtliches Werk gemeinfrei (Art. 5 URG). Eine allfällige
          Regeste ist redaktionell. Diese Wiedergabe ersetzt die amtliche Fassung nicht und
          stellt keine Rechtsberatung dar. {MASSGEBLICH_SATZ}
        </p>
        {/* B2/R1 (QS-UI 8b Teil 2): Der Norm-Hinweis lief als einziger Absatz des
            Provenienz-Fusses mit 976 px über die volle Breite — auf allen 5'093
            Entscheid-Seiten. Die beiden Absätze darüber halten `max-w-reading`
            bereits; der Hinweis kommt aus einer geteilten Komponente und wird
            darum HIER auf die Lesespalte gesetzt (kein Eingriff in die geteilte
            Komponente, die auch der Gesetzes-Fläche gehört — W2·5h). */}
        <div className="max-w-reading"><NormTextHinweis /></div>
      </footer>

      {/* Einheitliches Kontext-Panel (B3) — V1.3 (W2·7-VZUI §2.2): beide
          Verzahnungs-Richtungen am Dokumentfuss. «Zitierte Normen» (artikelscharf,
          Sprung zur Erwägungs-Fundstelle) ERSETZT die grobe Erlass-Gruppe (keine
          Doppel-Darstellung); «Zitierte Entscheide» löst die maschinell gelesenen
          Zitate gegen das kuratierte Manifest auf. Die Regeste bleibt oben
          ungestört (§0-1d). Fundstellen folgen der sichtbaren Ansicht. */}
      <KontextPanel typ="entscheid" normKeys={snap.normKeys}
        artikelZitate={snap.zitierteNormen}
        ohneNormen={snap.zitierteNormen.length > 0}
        zusatzGruppen={(snap.zitierteNormen.length > 0 || snap.zitierteEntscheide.length > 0) ? (
          <>
            <ZitierteNormenGruppe
              abschnitte={aktiveAbschnitte}
              zitierteNormen={snap.zitierteNormen}
              regesteAnker={zeigeRegeste ? 'abschnitt-regeste' : null}
              entscheidDatum={entscheidDatum(snap.datum, snap.gericht)}
            />
            <ZitiertGruppe
              zitierteEntscheide={snap.zitierteEntscheide}
              abschnitte={aktiveAbschnitte}
              selbstKey={schluessel}
            />
          </>
        ) : undefined} />

      {/* D-6-Nachzug: derselbe Rücksprung-Pfeil wie auf allen anderen
          Übersichts-Rückwegen des Hauses («←», Zählung in `ui/FehlSeite`). Der
          Ton bleibt ink-500 — dieser Link steht am Dokumentende und soll den
          Lesetext nicht überstimmen. */}
      <nav className="border-t border-line pt-5 text-body-s" aria-label="Weitere Entscheide">
        <Link to="/rechtsprechung" className="text-ink-500 hover:text-accent-text">← Zur Übersicht</Link>
      </nav>

      {lese && (
        <LesemodusOverlay snap={snap} abschnitte={aktiveAbschnitte}
          // A-5: die Overlay-Schicht DIESES Panes (null ausserhalb) — der
          // Lesemodus bleibt damit im Pane, statt über beide zu quellen.
          ziel={(imPane && overlayWurzel?.current) || null}
          regesteText={zeigeRegeste ? regesteText : null}
          massgeblicheUrl={massgeblicheUrl} massgeblichTitel={massgeblichTitel} massgeblichFehlt={massgeblichFehlt}
          fsIdx={fsIdx} setFs={setFs} onClose={closeLese}
          // LM-014 (§8 B7): der Lesemodus liess Gegenstand/Besetzung weg — dieselbe
          // Weiche wie die Voll-Ansicht oben (kopf/kopfLabel sind reine Ableitungen
          // aus snap, §5 EINE Quelle; nur `eintrag.richter` ist Seiten-State und
          // muss darum als Prop durchgereicht werden, die Regel selbst bleibt in
          // kopfModell()/besetzungsTeile()).
          zeigeRubrum={zeigeRubrum} kopf={kopf} kopfLabel={kopfLabel} richterRefs={eintrag?.richter} />
      )}
    </div>
  );
}

// Kleiner Hinweis, dass genannte Bundesnormen im Text verlinkt sind (NormText
// im Body) — über NormText, damit der Verweis selbst auch ein lebender Link ist.
function NormTextHinweis() {
  return (
    <p className="text-micro text-ink-500">
      Im Text genannte Bundesnormen (z. B. <NormText text="Art. 8 ZGB" />) sind direkt mit der Gesetzessammlung verlinkt.
    </p>
  );
}

export function EntscheidLeser() {
  const { key: keyRoh } = useParams<{ key: string }>();
  const schluessel = keyRoh ? decodeURIComponent(keyRoh) : '';
  // Übersicht→Detail-Brücke: ?ansicht=voll|auszug wählt die Start-Fassung.
  const [sp] = useSearchParams();
  const ansichtParam = sp.get('ansicht');
  const normParam = sp.get('norm');
  // LM-210: `?lese=1` öffnet den Lesemodus direkt beim Laden (teilbar, reload-fest).
  const leseParam = sp.get(LESE_PARAM);
  return <EntscheidLeserInhalt key={schluessel} schluessel={schluessel} ansichtParam={ansichtParam} normParam={normParam} leseParam={leseParam} />;
}

