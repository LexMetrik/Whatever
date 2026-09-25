import { Fragment, useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type DragEvent as ReactDragEvent, type ReactNode } from 'react';
import { useKopieren } from '../useKopieren';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Topbar, AusgabeZeile } from './Topbar';
import { Reiterleiste, REITER_MIME } from './Reiterleiste';
import { SchliessKnopf } from '../ui/SchliessKnopf';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useLocale } from '../locale';
import { useSeitenleiste, BREITE_MIN, BREITE_MAX, BREITE_SCHRITT } from './useSeitenleiste';
import { usePaneLayout, PaneSteuerungProvider, MAX_SEKUNDAER, layoutPermalink } from './usePaneLayout';
import { SekundaerPane } from './Pane';
import { PaneKopf } from './PaneKopf';
import { usePaneDnd } from './usePaneDnd';
import { PaneProvider } from './PaneKontext';
import { InhaltsKopf } from './InhaltsKopf';
import { InhaltsKopfMeldeProvider, istInhaltsPfad, kopfVonPfad, type KopfDaten } from './InhaltsKopfKontext';
import { tabSchluessel, merkeTab, ersetzeTab } from '../../lib/tabs';
import { PaneName } from './PaneName';
import { verlaufLabel, erlassVonPfad, gesetzPfad, entscheidPfad, type VerlaufManifeste } from '../../lib/verlaufLabel';
import { useDialogFokus } from './useDialogFokus';

// Neutraler Pane-Kontext für den 1-Pane-Fall (DOM-/verhaltensneutral, stabil).
const KEIN_PANE = { imPane: false, rolle: 'primaer' as const, wurzel: null, overlayWurzel: null };

// Ziehgriff am rechten Rand der Desktop-Seitenleiste: Breite per Maus/Touch
// ziehen ODER per Tastatur (Pfeil ←/→) verstellen. role="separator" mit
// aria-valuenow/min/max macht die Geste WCAG-zugänglich (axe-Tor). Reine
// Darstellung (§3).
function ZiehGriff({ breite, setBreite }: { breite: number; setBreite: (b: number) => void }) {
  // Teardown des laufenden Drags in einer Ref, damit ein Unmount MITTEN im Ziehen
  // die window-Listener trotzdem löst (kein Leak).
  const aufRef = useRef<(() => void) | null>(null);
  useEffect(() => () => aufRef.current?.(), []);
  const ziehen = (e: ReactPointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startB = breite;
    const move = (ev: PointerEvent) => setBreite(startB + (ev.clientX - startX));
    const auf = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', auf);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      aufRef.current = null;
    };
    aufRef.current = auf;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', auf);
  };
  const taste = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setBreite(breite - BREITE_SCHRITT); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setBreite(breite + BREITE_SCHRITT); }
  };
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Breite der Seitenleiste anpassen"
      aria-valuenow={breite}
      aria-valuemin={BREITE_MIN}
      aria-valuemax={BREITE_MAX}
      tabIndex={0}
      onPointerDown={ziehen}
      onKeyDown={taste}
      className="hidden lg:block shrink-0 sticky top-0 h-screen w-1.5 -ml-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-brass-300/60 focus:bg-brass-400"
    />
  );
}

// Route-Breite des Inhalts (W2·29-WERKBANK-REST-BREITE, Entscheid David
// 25.9.2026 «ab 1280 auf allen breiten identisch … das soll optimiert
// werden»): Default für JEDE Route bleibt `max-w-content` (70rem) — byte-
// gleich zum bisherigen Stand. Einzige Ausnahme ist die Startseite (`/`):
// dort kommt ab `2xl` (1536px) die breitere Stufe `weit` (90rem, Token in
// `tailwind.config.js`) hinzu, weil Kacheln/Raster den Platz sinnvoll nutzen
// können, ohne dass ungedeckelter Fliesstext (z. B. `PflichtDisclaimer`,
// `MaterialKarte`) mitwächst — eine globale Verbreiterung hätte genau das
// getan (Messung 25.9.2026: 973px/128 Zeichen je Zeile auf /rechner/zpo-
// fristen). Benannte Funktion statt Inline-Bedingung, weil es (noch) keine
// routenweise Layout-Konfiguration in dieser Datei gibt.
function inhaltsbreiteFuer(pfad: string): string {
  return pfad === '/' ? 'max-w-content 2xl:max-w-weit' : 'max-w-content';
}

// ─── App-Shell (Build-Plan App-Shell, Phase 3) ─────────────────────────────
//
// Dauerhaft sichtbare LINKE Seitenleiste (Desktop) + schmaler TOP-Streifen,
// Inhalt rechts. Auf Mobil klappt die Seitenleiste zur Off-Canvas-Schublade (☰)
// ein. Navigation lebt allein in der Seitenleiste (navigation.ts, SSoT); der
// Top-Streifen trägt nur Werkzeuge. Die frühere Header-Navigation (vier
// Oberkategorien + Sekundär-Nav) ist entfallen.
export function Shell({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useLocale();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  // R4-D (5.9.2026): der ⧉-Griff der Pane-Titelleiste schrieb den Layout-Link
  // mit eigener `writeText`-Zeile in die Zwischenablage — dieselbe Handlung wie
  // «Link teilen» (`LinkTeilenButton`), nur mit eigener Mechanik.
  // David-Entscheid 5.9.2026 (W2·19-DESIGN-KONSISTENZ Runde 8, #692-Nachzug):
  // die frühere Begründung («keine Quittung, das wäre ein neuer Entscheid»)
  // ist überholt — jetzt Quittung, per `PaneKopfProps.teilenKopiert`, Muster
  // wie `KopierButton` (Glyphen-Swap statt Text, die Zeile hat keinen Platz für
  // Text). `kopiert` wird darum jetzt gelesen und durchgereicht.
  const { kopiert: layoutLinkKopiert, kopieren: kopiereLayoutLink } = useKopieren();
  const [schubladeOffen, setSchubladeOffen] = useState(false);
  const schubladeRef = useRef<HTMLDivElement>(null);
  const primaerWurzel = useRef<HTMLElement>(null); // Scroll-/Query-Wurzel des primären Panes (B-2.5)
  const primaerOverlay = useRef<HTMLDivElement>(null); // Overlay-Schicht des primären Panes (Drawer)
  // Vorgabe «eingeklappt» + Nutzerwahl liegen vollständig in `useSeitenleiste`
  // (D25, 6.9.2026 — dort steht auch der Ä1c-Befund vom 17.8.2026, den D25 abgelöst hat).
  const seitenleiste = useSeitenleiste();
  // ── D17 (David 6.9.2026) · DIE SEITENLEISTE STEHT ÜBERALL, AUCH AUF «/» ────
  // «ich mochte die seitenleiste. können wir die behalten. und das oben
  // entfernen?» Die R2-Regel «auf / entfällt sie» (§6 (d) des Fahrplans) ist
  // damit zurückgenommen — sie hatte ihren Grund allein darin, dass die
  // Bereiche zusätzlich als Reiter im Titelblatt standen; die sind mit D17
  // weg (`layout/Topbar.tsx`). Es bleibt EINE Landkarte, und die ist auf jeder
  // Route dieselbe. Kein Sonderfall mehr, darum keine Bedingung mehr.
  // R3 (Auftrag David 30.6.2026): die globale Schriftskala (A−/A+) ersetzte den
  // Inhaltsbreite-Umschalter; die zentrale Inhaltsspalte läuft seither fest auf
  // `max-w-content` (= die frühere Default-Breite «kompakt», Golden byte-gleich).
  // Der Steller selbst sitzt seit W2·23-STARTSEITE-V4 (§6.2) auf
  // `/einstellungen` und hält dort seinen eigenen `useSchriftskala`; die Shell
  // braucht die Steuer-API nicht mehr. Angewendet wird die gespeicherte Wahl
  // unverändert vor dem ersten Render in `main.tsx` (`wendeSchriftskalaAn`).
  // Seit W2·29-WERKBANK-REST-BREITE (25.9.2026) ist `max-w-content` nur noch
  // der Default aller Routen — die Startseite bekommt ab `2xl` zusätzlich
  // `weit`, siehe `inhaltsbreiteFuer` oben.
  const inhaltsbreiteKlasse = inhaltsbreiteFuer(pathname);

  // Split-View (B-1): sekundäre Panes nur ab lg nebeneinander; mobil + Prerender
  // = 1 Pane (istLg startet false → SSR/Default byte-gleich, B-4-Faltung gratis).
  const pane = usePaneLayout();
  const [istLg, setIstLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const upd = () => setIstLg(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);
  // Multipane sobald ein sekundäres Pane existiert. Responsiv: ab lg nebeneinander,
  // darunter (B-4) horizontales Swipe-/Snap-Falten (1 Pane sichtbar, wischen). Der
  // Default (keine Panes) bleibt der byte-gleiche 1-Pane-Pfad (Prerender hat nie Panes).
  const multipane = pane.sekundaer.length > 0;
  // Pane-Breiten als flex-grow je Pane (global, 0=primär). Ziehbare Gutter
  // zwischen den Panes verstellen sie; bei Pane-Anzahl-Wechsel auf gleich (1)
  // zurückgesetzt. Session-lokal (kein localStorage — transiente Layout-Wahl).
  const paneZahl = 1 + pane.sekundaer.length;
  const [breiten, setBreiten] = useState<number[]>(() => Array(paneZahl).fill(1));
  if (breiten.length !== paneZahl) setBreiten(Array(paneZahl).fill(1));
  const rowRef = useRef<HTMLDivElement>(null);
  const wachstum = (idx: number) => (istLg ? { flexGrow: breiten[idx] ?? 1 } : undefined);
  // Ziehen der Gutter an Grenze g (zwischen Pane g und g+1): dx → Anteil → grow
  // verschieben (min 0.25, damit kein Pane kollabiert). ←/→ als Tastatur-Schritt.
  const MIN_GROW = 0.25;
  const verstelleBreite = (g: number, dxFrac: number, basis: number[]) => {
    // dxFrac so kappen, dass KEINE der beiden Nachbarspalten unter MIN_GROW fällt —
    // beide bekommen denselben Betrag (+/−), daher bleibt ihre Grow-Summe konstant
    // (sonst wuchs eine Seite an den Extremen unbegrenzt, die andere kollabierte).
    const d = Math.max(MIN_GROW - basis[g], Math.min(basis[g + 1] - MIN_GROW, dxFrac));
    const next = [...basis];
    next[g] = basis[g] + d;
    next[g + 1] = basis[g + 1] - d;
    setBreiten(next);
  };
  // Gutter-ARIA: Breite des linken Pane als Prozent des Nachbarpaars (SR-Wertansage,
  // WCAG 4.1.2) — analog zum ZiehGriff der Seitenleiste (aria-valuenow/min/max).
  const gutterWert = (g: number) => {
    const summe = ((breiten[g] ?? 1) + (breiten[g + 1] ?? 1)) || 1;
    return {
      now: Math.round(((breiten[g] ?? 1) / summe) * 100),
      min: Math.round((MIN_GROW / summe) * 100),
      max: Math.round(((summe - MIN_GROW) / summe) * 100),
    };
  };
  // Teardown eines laufenden Gutter-Drags bei Unmount (sonst feuert move auf einen
  // abgebauten Baum, bis das nächste pointerup käme) — wie ZiehGriff.
  const gutterAufRef = useRef<(() => void) | null>(null);
  useEffect(() => () => gutterAufRef.current?.(), []);
  const ziehGutter = (g: number) => (e: ReactPointerEvent) => {
    e.preventDefault();
    const row = rowRef.current; if (!row) return;
    const w = row.clientWidth || 1;
    const total = breiten.reduce((a, b) => a + b, 0) || paneZahl;
    const startX = e.clientX; const basis = [...breiten];
    const move = (ev: PointerEvent) => verstelleBreite(g, ((ev.clientX - startX) / w) * total, basis);
    const auf = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', auf);
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      gutterAufRef.current = null;
    };
    gutterAufRef.current = auf;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', auf);
  };
  const gutterTaste = (g: number) => (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); verstelleBreite(g, -0.1, breiten); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); verstelleBreite(g, 0.1, breiten); }
  };
  // Scroll-Übergabe beim Moduswechsel: in 1-Pane scrollt das Fenster, im Multipane
  // das primäre Pane. Ohne Übergabe spränge die Leseposition beim Öffnen/Schliessen
  // auf 0 — wir merken den Scroll der aktuellen Quelle und übertragen ihn (rAF).
  const scrollMerk = useRef(0);
  useEffect(() => {
    const ziel = multipane ? primaerWurzel.current : null;
    const lese = () => { scrollMerk.current = ziel ? ziel.scrollTop : window.scrollY; };
    const el: HTMLElement | Window = ziel ?? window;
    el.addEventListener('scroll', lese, { passive: true });
    return () => el.removeEventListener('scroll', lese);
  }, [multipane]);
  useEffect(() => {
    const y = scrollMerk.current;
    const id = requestAnimationFrame(() => {
      if (multipane) { if (primaerWurzel.current) primaerWurzel.current.scrollTop = y; }
      else { window.scrollTo(0, y); }
    });
    return () => cancelAnimationFrame(id);
  }, [multipane]);
  // B-3a: F6 / Shift+F6 wechselt den Fokus zyklisch zwischen den Panes
  // (Standard-Regionswechsel-Taste). Jedes Pane trägt `data-pane` + tabIndex=-1.
  useEffect(() => {
    if (!multipane) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'F6') return;
      // Offenen modalen Dialog nicht verlassen (Fokus-Falle respektieren).
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const panes = Array.from(document.querySelectorAll<HTMLElement>('[data-pane]'));
      if (panes.length < 2) return;
      e.preventDefault();
      const aktiv = document.activeElement;
      let idx = panes.findIndex((p) => p === aktiv || p.contains(aktiv));
      if (idx === -1) idx = 0;
      panes[(idx + (e.shiftKey ? -1 : 1) + panes.length) % panes.length].focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [multipane]);
  // Pane-Titel/Stand: Manifeste lazy laden, sobald multipane (Label für Gesetz/Entscheid).
  const [manifeste, setManifeste] = useState<VerlaufManifeste>({});
  // Manifeste auch für den Einzelansicht-Kopf (Breadcrumb-Blattlabel) laden.
  // Der Lade-Effekt steht weiter unten — er braucht `liveSek` (die tatsächlich
  // gezeigten Pane-Pfade), um zu entscheiden, WELCHES Manifest nötig ist.
  const kopfMoeglich = istInhaltsPfad(pathname);
  // Kopfdaten der aktuellen Einzelansicht: Inhaltsseiten melden sie (Kontext);
  // sonst Pfad-Fallback. Bei Routenwechsel zurückgesetzt (frische Seite meldet neu).
  const [kopfDaten, setKopfDaten] = useState<KopfDaten | null>(null);
  const meldeKopf = useCallback((d: KopfDaten | null) => setKopfDaten(d), []);
  // Live-Location je Pane (gekeyt am STABILEN Seed-pfad, der auch der React-Key ist
  // → kein Remount). Titel/teilen/promote/Dedup nutzen den aktuell gezeigten Pfad.
  const [liveLocs, setLiveLocs] = useState<Record<string, string>>({});
  // Stabile Melde-Funktion (useCallback) → der onNavigiert-Effekt im SekundaerPane
  // feuert nur bei echtem Location-Wechsel, nicht bei jedem Shell-Render.
  const meldeLive = useCallback((seed: string, p: string) =>
    setLiveLocs((m) => (m[seed] === p ? m : { ...m, [seed]: p })), []);
  const livePfad = (i: number) => liveLocs[pane.sekundaer[i]] ?? pane.sekundaer[i];
  const liveSek = pane.sekundaer.map((s) => liveLocs[s] ?? s);
  // Reader-Labels (Breadcrumb-Blatt, Pane-Titel) brauchen ein Browse-Manifest —
  // aber nur das der Rubrik, die auch wirklich angezeigt wird.
  //
  // Bis 1.9.2026 zog dieser Effekt BEIDE Manifeste für jeden Inhaltspfad. Auf
  // einer Gesetzes-Leserseite kostete das `/rechtsprechung/register.json`
  // (9,0 MB roh / 753 KB gzip — `scripts/check-perf-budget.ts` führt es bei
  // 96,5 % seines Budgets), obwohl daraus dort NIE ein Label gelesen wird:
  // `verlaufLabel()` greift auf `entscheide` ausschliesslich bei
  // `/rechtsprechung/:key` zu, `erlassVonPfad()` nur bei `/gesetze/:ebene/:key`
  // (`src/lib/verlaufLabel.ts`). Gemessen (QS-PERF, `npm run perf:leser`,
  // 4× CPU + langsames 4G, je Lauf kalt): der Download lief auf `/gesetze/bund/OR`
  // beim Marker «bedienbar» noch und nahm dem Snapshot Bandbreite.
  //
  // KEIN Informationsverlust (§15-Bewertung): Sobald ein gezeigter Pfad ein
  // Entscheid-Pfad ist — auch erst nach einer Pane-Navigation — lädt der Effekt
  // nach und das Label erscheint. Labels erscheinen ohnehin asynchron; das
  // Manifest ist modulweit gecacht, ein zweiter Bedarf kostet keinen zweiten
  // Download. Muster wörtlich übernommen von `ReiterUebersicht.tsx` (dieselbe
  // Frage, dort seit je so gelöst — §10: den vorhandenen Rahmen nutzen).
  const labelPfade = [pathname, ...liveSek];
  const brauchtGesetze = labelPfade.some((p) => gesetzPfad(p) !== null);
  const brauchtEntscheide = labelPfade.some((p) => entscheidPfad(p) !== null);
  useEffect(() => {
    if (!multipane && !kopfMoeglich) return;
    if (!brauchtGesetze && !brauchtEntscheide) return;
    let lebt = true;
    void (async () => {
      const [g, e] = await Promise.all([
        brauchtGesetze
          ? import('../../lib/normtext/browse').then((m) => m.ladeBrowseManifest()).catch(() => null)
          : Promise.resolve(null),
        brauchtEntscheide
          ? import('../../lib/rechtsprechung/browse').then((m) => m.ladeEntscheidManifest()).catch(() => null)
          : Promise.resolve(null),
      ]);
      // Verschmelzen statt ersetzen: ein einmal geladenes Manifest bleibt gültig
      // (unveränderlich je Sitzung) und geht beim Schliessen eines Panes nicht
      // verloren — sonst flackerte ein Label auf den Platzhalter zurück.
      if (lebt) setManifeste((alt) => ({ gesetze: g ?? alt.gesetze ?? null, entscheide: e ?? alt.entscheide ?? null }));
    })();
    return () => { lebt = false; };
  }, [multipane, kopfMoeglich, brauchtGesetze, brauchtEntscheide]);
  // L6 (Entscheid David 7.9.2026): der Pane-Kopf nennt das Dokument, sobald die
  // Inhaltsseite die Krume selbst trägt. Der Name ist ein fertiges Element
  // (`./PaneName`) und KEIN Feld dieser Ableitung — sein Abonnement auf die
  // Lesestellung soll die App-Hülle nicht mit-rendern (§15, Herleitung dort).
  const titelVon = (pfad: string) => {
    const stand = erlassVonPfad(pfad, manifeste)?.stand ?? null;
    const m = stand && /^(\d{4})-(\d{2})-(\d{2})/.exec(stand);
    return {
      label: verlaufLabel(pfad, manifeste),
      kurzform: <PaneName pfad={pfad} manifeste={manifeste} />,
      stand: m ? `${m[3]}.${m[2]}.${m[1]}` : stand,
    };
  };

  // Dedup gegen ALLE offenen Panes (Primär-URL inkl., Sekundäre live) — kein Doppel.
  const istOffen = (pfad: string) => {
    const n = tabSchluessel(pfad);
    return tabSchluessel(pathname + search) === n || liveSek.some((x) => tabSchluessel(x) === n);
  };
  // ── M1 · JEDER PFAD IN EINEM FENSTER HAT SEINEN REITER (P4) ───────────────
  //
  // GEMESSEN am Stand `c0f2972ba` (Prüfbefund R11 #16, Screen `pruef-r11-05`):
  // `panes = ["/rechtsprechung/bge_146_III_1"]` neben `tabs = [OR, Rechner]`
  // ergab eine Leiste mit ZWEI Reitern und nur EINER Marke «Fenster links:◧» —
  // rechts stand nachweislich BGE 146 III 1, und die Leiste verschwieg ihn.
  // Der Anwalt konnte diesen Entscheid von dort weder wechseln noch schliessen.
  // §5a Ziff. 4 verlangt zwei Marken; die Leiste kann sie nicht zeichnen, weil
  // sie nur zeigt, was der SPEICHER trägt (D16) — der Fix gehört also hierher,
  // an die Stelle, die das Fenster füllt, nicht in die Leiste.
  //
  // WARUM `ersetzeTab` UND NICHT NUR `merkeTab`: ein Fenster navigiert weiter
  // (Link im Entscheid, Sprung in den Erlass). Jede dieser Navigationen mit
  // `merkeTab` hinge einen weiteren Reiter an — genau der «Reiter-Wildwuchs»,
  // den §5a Ziff. 3 fürs Hauptfenster ausgeschlossen hat. Der Ref hält darum je
  // Fenster den zuletzt gemerkten Pfad; die Folge-Navigation ERSETZT ihn, wie
  // `components/TabTracker.tsx` es fürs Hauptfenster tut.
  const paneReiter = useRef<Record<string, string>>({});
  useEffect(() => {
    const gesehen = new Set<string>();
    for (const seed of pane.sekundaer) {
      gesehen.add(seed);
      const pfad = liveLocs[seed] ?? seed;
      // R14b (7.9.2026): hier stand `if (!istReiterPfad(pfad)) continue;` —
      // ein Fenster auf einer Meta-Route bekam keinen Reiter. Die Ausnahme ist
      // ersatzlos weg (`lib/tabs.ts`, Block «R14b»); jedes Fenster führt jetzt
      // seinen Reiter, egal was darin steht.
      const vorher = paneReiter.current[seed];
      // `merkeTab` ist idempotent (`gleich()`), aber der Vergleich hier spart
      // schon den Speicher-Lesevorgang bei jedem Shell-Render.
      if (vorher === pfad) continue;
      if (vorher) ersetzeTab(vorher, pfad); else merkeTab(pfad);
      paneReiter.current[seed] = pfad;
    }
    // Geschlossene Fenster aus der Buchführung nehmen — ihr REITER bleibt
    // stehen (nichts wird still geschlossen, §5a Ziff. 5); nur die Zuordnung
    // «dieses Fenster zeigt diesen Reiter» endet.
    for (const seed of Object.keys(paneReiter.current)) {
      if (!gesehen.has(seed)) delete paneReiter.current[seed];
    }
  }, [pane.sekundaer, liveLocs]);

  // liveLocs-Eintrag eines (entfernten/ersetzten) Seed-Pfads aufräumen (sonst Leak +
  // kurz veraltetes Label, wenn derselbe Seed später erneut geöffnet wird).
  const raeumeLiveLoc = (seed: string) =>
    setLiveLocs((m) => { if (!(seed in m)) return m; const n = { ...m }; delete n[seed]; return n; });
  // Fokus nach dem Schliessen eines Panes zurück in den Hauptinhalt (A11y).
  const schliesseUndFokus = (i: number) => {
    const seed = pane.sekundaer[i];
    pane.schliesse(i);
    raeumeLiveLoc(seed);
    requestAnimationFrame(() => document.getElementById('inhalt')?.focus());
  };
  // B-2: «daneben öffnen» nur ab lg + Kapazität; kein Doppel.
  const paneSteuerung = {
    oeffneDaneben: (pfad: string) => { if (!istOffen(pfad)) pane.oeffneDaneben(pfad); },
    kannOeffnen: istLg && pane.sekundaer.length < MAX_SEKUNDAER,
    istOffen,
    // M1: das ✕ eines Reiters, der gerade in einem zweiten Fenster steht,
    // nimmt dieses Fenster mit (Herleitung an `PaneSteuerung.schliessePane`).
    schliessePane: (pfad: string) => {
      const n = tabSchluessel(pfad);
      const i = liveSek.findIndex((x) => tabSchluessel(x) === n);
      if (i !== -1) schliesseUndFokus(i);
    },
  };
  // Sekundär → Hauptfenster: dieses Pane wird die URL, das alte Hauptfenster rutscht an seinen Platz.
  const zumHauptfenster = (i: number) => {
    const altPrimaer = pathname + search + (typeof window !== 'undefined' ? window.location.hash : '');
    const ziel = livePfad(i);
    const seed = pane.sekundaer[i];
    // Würde der alte Primär ein bereits offenes ANDERES Pane duplizieren (gleicher
    // normPfad)? Dann NICHT als zweiten gleichen Seed schreiben (doppelter React-Key
    // → State-Vermengung/Pane-Verlust), sondern dieses Pane schliessen.
    const dup = liveSek.some((s, j) => j !== i && tabSchluessel(s) === tabSchluessel(altPrimaer));
    if (dup) pane.schliesse(i); else pane.ersetze(i, altPrimaer);
    raeumeLiveLoc(seed);
    navigate(ziel);
    // Fokus zurückgeben wie beim Schliessen (sonst fällt er nach Unmount des
    // auslösenden PaneKopfs auf <body> — Tastatur/SR verlieren die Position).
    requestAnimationFrame(() => document.getElementById('inhalt')?.focus());
  };
  // Hauptfenster ✕: erstes Sekundär (live) zum Hauptfenster befördern (sonst zur Startseite).
  const schliesseHaupt = () => {
    if (pane.sekundaer.length > 0) { const z = livePfad(0); pane.schliesse(0); navigate(z); }
    else navigate('/');
  };
  // Pane verschieben über die GANZE Liste (global: 0 = Hauptfenster, 1.. = sekundär):
  // an/über das Hauptfenster ziehen = tauschen (promote); sonst Sekundär-Reorder.
  // Greift für Drag-Drop UND die ◂▸-Knöpfe → «verschieben» wirkt auch bei 2 Panes.
  const verschiebePane = (von: number, nach: number) => {
    if (von === nach) return;
    if (von === 0) zumHauptfenster(nach - 1);       // Hauptfenster auf ein Pane → tauschen
    else if (nach === 0) zumHauptfenster(von - 1);  // Pane auf das Hauptfenster → befördern
    else pane.verschiebe(von - 1, nach - 1);        // Sekundär ↔ Sekundär
  };
  // §5a Ziff. 4: ein Reiter, in ein Fenster gezogen, landet DORT — auf dem
  // Hauptfenster als Navigation, auf einem sekundären Pane als dessen neuer
  // Inhalt. Bereits offene Pfade werden nicht doppelt geöffnet (`istOffen`).
  const reiterInPane = (pfad: string, ziel: number) => {
    if (istOffen(pfad)) return;
    if (ziel === 0) navigate(pfad);
    else pane.ersetze(ziel - 1, pfad);
  };
  const dnd = usePaneDnd(verschiebePane, reiterInPane, REITER_MIME);

  // Schublade bei Routenwechsel schliessen — Render-Phasen-Abgleich statt Effect
  // (React-Muster «adjusting state when props change»).
  const [letzterPfad, setLetzterPfad] = useState(pathname);
  if (pathname !== letzterPfad) { setLetzterPfad(pathname); if (schubladeOffen) setSchubladeOffen(false); if (kopfDaten) setKopfDaten(null); }

  // Fokus-Falle + Escape + Fokus-Rückgabe an den ☰-Auslöser über den geteilten
  // Dialog-Hook (§5: dieselbe Fokusverwaltung wie alle Overlays). Der Container
  // trägt role="dialog"/aria-modal + tabIndex={-1}; so wird aria-modal auch für
  // die Tastatur eingelöst (Tab bleibt in der Schublade, WCAG 2.4.3), und beim
  // Schliessen kehrt der Fokus auf den ☰-Knopf zurück statt an <body>.
  useDialogFokus(schubladeOffen, schubladeRef, () => setSchubladeOffen(false));

  // A5 (David 5.7.2026): die frühere Befehls-/Sprung-Palette ist entfallen. Der
  // Norm-Sprung sitzt in der normalen HeaderSuche; ⌘K/Ctrl-K und «/» fokussieren
  // dort das Feld (Handler in HeaderSuche, samt Feld-Ref). Der Landeplatz-CTA auf
  // /gesetze fokussiert es über das Event «lm:suche-fokus». Die Shell trägt keinen
  // Palette-Zustand mehr.
  // Nachtrag R15 (24.9.2026): das Event «lm:suche-fokus» gibt es nicht mehr —
  // der CTA sendete es schon vorher nicht, der «+» der Reiterleiste seit R15
  // auch nicht; Herleitung in `HeaderSuche.tsx` (Kommentar über den Shortcuts).

  return (
    <div className="min-h-screen bg-paper">
      {/* Skip-Link (WCAG 2.4.1): erstes fokussierbares Element, springt in den Inhalt. */}
      <a href="#inhalt"
        className="lc-btn lc-btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-modal">
        Zum Inhalt springen
      </a>

      <div className="lg:flex">
        {/* Persistente Desktop-Seitenleiste: sticky, eigene Scrollachse, Breite
            per Ziehgriff verstellbar, per Topbar-Schalter einklappbar. */}
        {!seitenleiste.eingeklappt && (
          <>
            <aside
              // A1 (H2b-Nachzug): Testanker. Der Wächter der Ä1c-Vorgabe muss die
              // APP-Leiste messen, nicht «das erste <aside>» — im Leser ist das
              // sonst die V3-Gliederung (18 rem), und die Sonde wäre grün, während
              // die App-Leiste offen daneben steht (genau so blieb A1 unbemerkt).
              data-app-seitenleiste
              className="hidden lg:flex lg:flex-col shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-line"
              style={{ width: seitenleiste.breite, background: 'color-mix(in srgb, var(--paper-sunken) 35%, var(--paper))' }}
            >
              <Sidebar />
            </aside>
            <ZiehGriff breite={seitenleiste.breite} setBreite={seitenleiste.setBreite} />
          </>
        )}

        {/* Rechte Spalte: Top-Streifen + Inhalt + Footer. Im Multipane-Modus
            höhenbegrenzt (h-screen), damit die Panes je eigen scrollen. */}
        <div className={`flex-1 min-w-0 flex flex-col ${multipane ? 'h-dvh' : 'min-h-screen'}`}>
          {/* PaneSteuerung umfasst AUCH die Topbar — der Reiter-Tracker dort bietet
              «⧉ nebeneinander öffnen» an (usePaneSteuerung). */}
          <PaneSteuerungProvider value={paneSteuerung}>
          <Topbar
            onMenu={() => setSchubladeOffen(true)}
            schubladeOffen={schubladeOffen}
            seitenleisteEingeklappt={seitenleiste.eingeklappt}
            onSeitenleisteUmschalten={seitenleiste.umschalten}
          />
          {/* Arbeitsleiste + Ausgabe-Zeile (W2·24 R2, §5a). Beide laufen im
              normalen Fluss — nicht klebend; die Herleitung steht am Kopf von
              `Topbar.tsx` (die Sprung-Offsets des Lesers rechnen mit einer
              4-rem-Krone, und ihre Quelle gehört R4).
              ── F8 (Prüfbefund 6.9.2026) · REIHENFOLGE GETAUSCHT. Bis hierher
              stand die Ausgabe-Zeile (0–64 · 64–95) ZWISCHEN Titelblatt und
              Arbeitsleiste (95–129) — §5a Ziff. 1 verlangt aber zwei Zeilen,
              die zusammengehören: Bereiche oben, offene Dokumente DIREKT
              darunter. Das Referenzbild zeichnet die Ausgabe-Zeile zwar unter
              dem Titelblatt, kennt die Arbeitsleiste aber gar nicht; wo beides
              nicht zugleich geht, hat die gebaute Ziffer Vorrang. Die
              Ausgabe-Zeile verliert dabei nichts: sie ist dieselbe Angabe wie
              im Fuss der Seitenleiste (`ui/KorpusStand`, §5) und steht jetzt
              als Abschluss der Kopfzone. */}
          <Reiterleiste paneSchluessel={[tabSchluessel(pathname + search), ...liveSek.map(tabSchluessel)]} />
          <AusgabeZeile />

          {/* Persistenter Hinweis bei Nicht-DE-Locale: Inhalte fallen auf Deutsch zurück. */}
          {locale !== 'de' && (
            <div className="bg-warn-bg border-b border-warn-500">
              <div className={`${multipane ? 'max-w-none' : inhaltsbreiteKlasse} mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2`}>
                <p className="text-body-s text-warn-700">
                  Diese Sprachfassung ist in Bearbeitung. Inhalte werden vorerst auf Deutsch angezeigt.
                </p>
                <button type="button" onClick={() => setLocale('de')}
                  className="text-body-s font-medium text-warn-700 underline underline-offset-2 hover:opacity-80">
                  Zu Deutsch wechseln
                </button>
              </div>
            </div>
          )}

          {/* Einzelansicht-Kopf (kein Split-View): Breadcrumb · aktueller Artikel ·
              Stand · ✕→Start. Analog zur Pane-Titelleiste, aber ohne Verschiebe-
              Steuerung. Im Multipane übernimmt der PaneKopf.
              A-2: Ob die Leiste überhaupt eine ist, entscheidet die Inhaltsseite
              über `kopfzeileSelbst` — die Komponente bleibt montiert (sie trägt
              die zwei Sprung-Rückmeldungen), rendert dann aber keine Leiste. */}
          {!multipane && istInhaltsPfad(pathname) && (
            <InhaltsKopf daten={kopfDaten ?? kopfVonPfad(pathname, manifeste)}
              breiteKlasse={inhaltsbreiteKlasse} onSchliessen={() => navigate('/')} />
          )}

          {/* STABILE Element-Kette um {children} in 1-Pane UND Multipane → kein
              Remount des Primär-Inhalts beim Öffnen/Schliessen des ersten/letzten
              Panes (sonst Scroll-/State-Verlust, Bugcheck). In 1-Pane ist der
              Wrapper `contents` (layoutneutral) + PaneProvider DOM-neutral →
              Default byte-gleich (Fensterscroll, kein container-type, kein overflow). */}
          <InhaltsKopfMeldeProvider value={meldeKopf}>
            <div ref={multipane ? rowRef : undefined} className={multipane ? 'flex-1 flex min-h-0 max-lg:overflow-x-auto max-lg:snap-x max-lg:snap-mandatory' : 'contents'}>
              {/* Primäres Pane — gleiche Element-Kette zu {children} in beiden Modi
                  (Wrapper = `contents` im 1-Pane), nur Klassen/Provider wechseln →
                  kein Remount. PaneKopf + Overlay sind multipane-only GESCHWISTER
                  (nicht Vorfahren von {children}). */}
              <div {...(multipane ? { onDragOver: dnd.spalte(0).onDragOver, onDrop: dnd.spalte(0).onDrop } : {})}
                style={multipane ? wachstum(0) : undefined}
                className={multipane ? `flex flex-col flex-1 min-w-0 border-l-2 ${dnd.spalte(0).ueber ? 'border-l-ink-900' : 'border-l-transparent'} max-lg:flex-none max-lg:w-full max-lg:snap-start` : 'contents'}>
                {/* L6: `titelVon(pathname + search)` statt `titelVon(pathname)`
                    — dieselbe Reiter-Identität, mit der die Leiste oben ihre
                    Marken zeichnet (`paneSchluessel`). Ohne den Diskriminator
                    `?r=2` fände `kurzformVon` bei zwei offenen Instanzen
                    desselben Erlasses die ERSTE und zeigte deren Lesestellung.
                    `label` und `stand` sind davon unberührt: beide Ableitungen
                    schneiden die Query ohnehin ab (`pfadTeil`). */}
                {multipane && (
                  <PaneKopf {...titelVon(pathname + search)} breadcrumb={kopfDaten?.breadcrumb} onBreadcrumb={(to) => navigate(to)} artikel={kopfDaten?.artikel}
                    nurSteuerung={kopfDaten?.kopfzeileSelbst}
                    rolle="primaer" onSchliessen={schliesseHaupt}
                    onRechts={() => verschiebePane(0, 1)} kannRechts={pane.sekundaer.length > 0}
                    ziehbar {...dnd.griff(0)} />
                )}
                <div className={multipane ? 'relative flex-1 min-h-0' : 'contents'}>
                  <PaneProvider value={multipane ? { imPane: true, rolle: 'primaer', wurzel: primaerWurzel, overlayWurzel: primaerOverlay } : KEIN_PANE}>
                    <main ref={primaerWurzel} id="inhalt" tabIndex={-1} aria-label="Hauptinhalt"
                      data-pane={multipane ? 'primaer' : undefined}
                      // §5a Ziff. 4 im 1-Pane-Fall: es gibt noch keine zweite
                      // Spalte, auf die man zielen könnte — also ist die RECHTE
                      // HÄLFTE des Inhalts das Ziel («in die zweite Hälfte
                      // ziehen»). Nur wenn ein Pane überhaupt aufgehen kann
                      // (`kannOeffnen`: ab lg, freie Kapazität); links fallen
                      // gelassen passiert nichts.
                      {...(!multipane && paneSteuerung.kannOeffnen ? {
                        onDragOver: (e: ReactDragEvent) => {
                          if (!e.dataTransfer.types.includes(REITER_MIME)) return;
                          const r = e.currentTarget.getBoundingClientRect();
                          if (e.clientX > r.left + r.width * 0.6) e.preventDefault();
                        },
                        onDrop: (e: ReactDragEvent) => {
                          const pfad = e.dataTransfer.getData(REITER_MIME);
                          if (!pfad) return;
                          e.preventDefault();
                          paneSteuerung.oeffneDaneben(pfad);
                        },
                      } : {})}
                      // Ring/Farbe aus der globalen `:focus-visible`-Regel
                      // (index.css, Rolle --focus); lokal bleibt NUR der negative
                      // Offset (Scroll-Container, Herleitung in Pane.tsx).
                      className={multipane
                        ? '@container/pane absolute inset-0 overflow-y-auto overscroll-contain focus-visible:-outline-offset-2'
                        : 'flex-1 w-full focus:outline-none'}>
                      <div className={multipane
                        ? 'mx-auto w-full max-w-content px-5 sm:px-6 py-6'
                        : `${inhaltsbreiteKlasse} mx-auto px-5 sm:px-6 py-8 sm:py-12`}>{children}</div>
                    </main>
                  </PaneProvider>
                  {multipane && <div ref={primaerOverlay} className="pointer-events-none absolute inset-0 overflow-hidden" />}
                </div>
              </div>
              {/* Sekundäre Panes (<Routes location> + eigener Navigator + PaneKopf). */}
              {multipane && pane.sekundaer.map((pfad, i) => (
                <Fragment key={pfad}>
                  {/* Ziehbare Gutter zwischen Pane i und i+1 (Grenze i). */}
                  <div role="separator" aria-orientation="vertical" aria-label="Pane-Breite anpassen"
                    aria-valuenow={gutterWert(i).now} aria-valuemin={gutterWert(i).min} aria-valuemax={gutterWert(i).max} tabIndex={0}
                    onPointerDown={ziehGutter(i)} onKeyDown={gutterTaste(i)}
                    /* QS-UI 8a (F3): `focus-visible:outline-none` entfernt. Der
                       Gutter ist per tabIndex/Pfeiltasten bedienbar, trug im
                       Fokus aber nur `bg-brass-400` — gemessen 3.8.2026 eine
                       2-px-Outline in Alpha 0, also ein reiner Farbwechsel. F3
                       verbietet genau das («kein Fokus, der nur die Farbe
                       wechselt»). Ohne die Utility zeichnet die Basis-Regel den
                       --focus-Ring (gemessen rgb(130,98,37) = brass-700 hell);
                       die Flächenfärbung bleibt als zweites, redundantes
                       Signal stehen.

                       LM-178 (Fahrplan B5, §6): Ruhezustand war `bg-transparent`
                       — der Griff war NUR über den Mauszeiger (cursor-col-resize)
                       erkennbar, auf Touch/ohne Hover gar nicht (Befund: «6 px
                       breiter Ziehgriff, der ausschliesslich über den Mauszeiger
                       erkennbar ist»). `bg-line-strong` zeichnet ihn jetzt auch
                       im Ruhezustand als schwache, aber sichtbare Trennlinie
                       (dieselbe Stärke wie der oberste Struktur-Trenner, §Linien-
                       Kanon). Der Hover-Ton wechselt zusätzlich von
                       `bg-brass-300/60` auf `bg-brass-300`: die Deckkraft-Suffix-
                       Klasse erzeugte keine CSS-Regel (DESIGN-D0, `--brass-300`
                       ist ein opaker Hex-Wert, kein RGB-Tripel — Tailwind kann
                       darauf keine Alpha-Variante bauen; Wurzel-Fix bleibt
                       W2·11-DESIGN, tailwind.config.js ist hier TABU) — der Hover
                       wirkte dadurch bislang gar nicht. */
                    className="hidden lg:block shrink-0 w-1.5 -mx-0.5 z-sticky cursor-col-resize bg-line-strong transition-colors hover:bg-brass-300 focus-visible:bg-brass-400" />
                  <SekundaerPane pfad={pfad} {...titelVon(livePfad(i))} style={wachstum(i + 1)}
                    onNavigiert={meldeLive}
                    onSchliessen={() => schliesseUndFokus(i)}
                    onHauptfenster={() => zumHauptfenster(i)}
                    onTeilen={() => kopiereLayoutLink(layoutPermalink(liveSek))} teilenKopiert={layoutLinkKopiert}
                    onLinks={() => verschiebePane(i + 1, i)} onRechts={() => verschiebePane(i + 1, i + 2)}
                    kannLinks kannRechts={i < pane.sekundaer.length - 1}
                    ziehbar={multipane} {...dnd.griff(i + 1)} {...dnd.spalte(i + 1)} />
                </Fragment>
              ))}
            </div>
          </InhaltsKopfMeldeProvider>
          {!multipane && <Footer />}
          </PaneSteuerungProvider>
        </div>
      </div>

      {/* Mobile: Off-Canvas-Schublade mit derselben Seitenleiste — per Portal an
          <body>, weil der backdrop-filter des Streifens sonst einen Containing-
          Block für position:fixed bildet. SSR-sicher: schubladeOffen ist beim
          ersten Render immer false. */}
      {schubladeOffen && createPortal(
        <div className="lg:hidden">
          {/* Abdunkelnder Scrim — themenunabhängig dunkel (bg-ink-900 wäre im
              Dunkelmodus hell und würde aufhellen statt abdunkeln). Diese
              Notiz ist die ÄLTESTE des Hauses zu dem Fehler; F2-1 (31.8.2026)
              hat ihre Regel zum Token gemacht: `.lc-scrim-voll` (src/index.css)
              ist die Rolle «Vollflächen-Schublade», Deckung unverändert 50 %.
              Ohne diese eine Zeile trüge der neue Wächter (Prüfung 5 in
              `scripts/check-design-tokens.ts`) eine Ausnahme für genau das
              Muster, das er verbietet (§6.7).
              C3 (5.9.2026, R6-C): `z-30`/`z-40`/`z-50` → `z-dropdown`/
              `z-overlay`/`z-modal` (Schichtungs-Skala, index.css bei
              --z-base), Werte unverändert, nur benannt — s. Prüfung 6 im
              selben Wächter. */}
          <div className="lc-scrim-voll fixed inset-0 z-dropdown" onClick={() => setSchubladeOffen(false)} aria-hidden />
          <div id="seitenleisten-schublade" ref={schubladeRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Navigation"
            className="fixed top-0 left-0 z-overlay h-full w-4/5 max-w-xs bg-paper-raised border-r border-line shadow-lg overflow-y-auto focus:outline-none [&_nav_a]:py-3 [&_nav_summary]:py-3">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line sticky top-0 bg-paper-raised">
              <span className="lc-overline">Navigation</span>
              {/* A3-1 (R3-β): EIN Schliess-✕ der App (`lc-btn-ghost` fällt weg,
                  s. Baustein); fingertauglich bleibt es, weil der Baustein die
                  Trefferfläche per `::after` auf `--tap-ziel-komfort` hebt. */}
              <SchliessKnopf name="Navigation schliessen" onClick={() => setSchubladeOffen(false)} />
            </div>
            {/* Schublade trägt eigenen Kopf + der mobile Top-Streifen das Logo
                → Marke in der Schublade ausblenden. */}
            <Sidebar onNavigate={() => setSchubladeOffen(false)} markeZeigen={false} />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
