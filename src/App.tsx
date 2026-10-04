import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { LocaleProvider } from './components/locale';
import { RouteHuelle } from './components/layout/RouteHuelle';
import { RouteMeta } from './components/RouteMeta';
import { TabTracker } from './components/TabTracker';
import { ZuletztTracker } from './components/ZuletztTracker';
import { RouteSwitch } from './RouteSwitch';
import { prefetchLeser } from './leserPrefetch';
import { tabSchluessel } from './lib/tabs';
import { leseAnker, aufloeseAnkerY, setzeHashVerbraucht } from './pages/gesetz-leser/scrollAnker';
import { sicherDekodiert } from './lib/sicherDekodieren';

// SPA-Scroll-Reset: Beim Routenwechsel nach oben scrollen (sonst behält die
// neue Seite die alte Scrollposition und man «landet unten»). Trägt die Route
// einen Anker (#vorlage-…, #g-…, von der Seitenleiste), übernimmt ScrollZuHash.
// Scroll-Position je Pfad merken und beim Zurückkehren wiederherstellen (Auftrag
// David): ein Tab-Wechsel (insb. zu einem langen Gesetzes-Reader und zurück) soll
// NICHT an den Anfang springen, sondern dort weitermachen, wo man war. Neue,
// noch nie besuchte Pfade starten weiterhin oben (keine gespeicherte Position).
// Trägt die Route einen Anker (#…), übernimmt ScrollZuHash.
// SSR-sicherer Layout-Effekt (Prerender rendert serverseitig — dort gibt es
// keinen Layout-Effekt; useEffect ist der harmlose Fallback).
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// LM-199 (W2·17-UI-BEFUNDE-B2): Ein #hash ist beim Deep-Link/Klick GENAU EINMAL
// Sprungziel. Kehrt man per Zurück/Vorwärts (POP) aus einer ANDEREN Route auf
// einen History-Eintrag zurück, der den Einstiegs-Hash noch trägt, ist der Hash
// VERBRAUCHT: massgeblich ist dann die A16-Anker-Restauration (letzte Lese-
// position), nicht der Einstiegs-Anker (Prod-Messung 2.8.2026: «Zurück» landete
// mit stehendem #art-257_d ~149'000 px daneben — am Hash-Artikel statt an der
// verlassenen Stelle; ohne Hash war A16 korrekt). Intra-Dokument-POPs (gleiche
// Reiter-Identität, #art-5 → #art-31 → zurück) behalten den Hash-Sprung — dort
// IST der Hash die Position (e2e leser-position-u, A16 bleibt unberührt).
// Ohne Anker-Eintrag (z. B. nach Vollreload, Registry leer) bleibt der Hash das
// beste verfügbare Ziel → keine Unterdrückung. Die URL wird hier NIE beschrieben
// (kein Scroll-Hash-Sync, FAHRPLAN-UI-NAVIGATION §Z Ziff. 7).
// Entscheid je History-Eintrag EINMAL (location.key) und dann fest — sonst
// würde ein späterer, location-fremder Re-Render (der gemerkte Vorgänger-
// Schlüssel ist inzwischen nachgeführt) das Verdikt kippen und den
// verbrauchten Hash doch noch springen.
function useVerbrauchterHash(): boolean {
  const { pathname, search, hash, key } = useLocation();
  const navTyp = useNavigationType();
  const schluessel = tabSchluessel(pathname + search);
  // «Zustand aus dem vorherigen Render» (offizielles React-Muster, kein Ref im
  // Render): merkt je History-Eintrag (location.key) das Verdikt und den
  // Schlüssel — der gemerkte Schlüssel des VORHERIGEN Eintrags speist die
  // Cross-Route-Erkennung des nächsten.
  const [merk, setMerk] = useState<{ key: string; schluessel: string | null; wert: boolean }>(
    { key: '', schluessel: null, wert: false },
  );
  if (merk.key !== key) {
    const wert =
      navTyp === 'POP' &&
      hash !== '' &&
      merk.schluessel !== null &&
      merk.schluessel !== schluessel &&
      leseAnker(schluessel) !== undefined;
    // Modul-Flag SOFORT (im Render, vor jedem Kind-Mount) nachführen: der
    // Reader-Seed-Sprung liest es in seinem Mount-Effekt — der läuft VOR den
    // App-Effekten (Kind vor Elter), ein useEffect hier käme zu spät.
    // Idempotent je location.key (deterministisch bei Render-Wiederholung).
    setzeHashVerbraucht(wert);
    setMerk({ key, schluessel, wert });
  }
  return merk.wert;
}

function ScrollWiederherstellung({ hashVerbraucht }: { hashVerbraucht: boolean }) {
  const { pathname, hash: hashRoh, search } = useLocation();
  // Verbrauchter Hash (LM-199) zählt hier als «kein Hash»: die Anker-/Positions-
  // Restauration übernimmt, und nachfolgende Scrolls werden wieder gespeichert.
  const hash = hashVerbraucht ? '' : hashRoh;
  // Positions-Schlüssel = Reiter-Identität (pathname + ?r), NICHT pathname allein:
  // dasselbe Gesetz kann mehrfach offen sein (?r=<n>), jede Instanz hält ihre
  // eigene Scrollposition. tabSchluessel ignoriert #Anker und ?preset (gehören
  // nicht zur Reiter-Identität) — read-only aus lib/tabs (§5).
  const schluessel = tabSchluessel(pathname + search);
  const positionen = useRef<Map<string, number>>(new Map());
  const aktiv = useRef(hash ? '' : schluessel);
  const wiederherstellend = useRef(false);
  // Native Scroll-Wiederherstellung abschalten — wir verwalten sie selbst (sonst
  // konkurriert der Browser bei Back/Forward mit der manuellen Wiederherstellung).
  useEffect(() => {
    if (!('scrollRestoration' in history)) return;
    const vorher = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { history.scrollRestoration = vorher; };
  }, []);
  // Laufend die Position des AKTUELLEN Pfads festhalten — NICHT während einer
  // programmatischen Wiederherstellung (Zwischenwerte würden das Ziel überschreiben)
  // und NICHT auf Anker-Routen (#hash → der Anker-Offset gehört nicht als Pfad-
  // Position gespeichert, sonst landet ein späterer hashloser Besuch am Anker).
  useEffect(() => {
    // W2·19/F4: window.scrollY NIE direkt im Scroll-Event lesen — das erzwang je
    // Ereignis einen Layout-Flush (Perf-Diagnose 8.8.2026: 9.9 ms @1×, 75.5 ms
    // @4× je Event). rAF bündelt alle Events eines Frames zu EINEM Lesen im
    // Render-Takt (Muster des A16-Nachbarn unten). Die Guards laufen bewusst
    // erst IM Frame-Callback: beginnt zwischen Event und Frame eine Wieder-
    // herstellung oder ein Reiterwechsel (useIsoLayoutEffect setzt beides
    // synchron), gehört der Zwischenwert keinem Reiter mehr zugeschrieben.
    let raf: number | null = null;
    const onScroll = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (!wiederherstellend.current && aktiv.current) positionen.current.set(aktiv.current, window.scrollY);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);
  // ENDGÜLTIGER Fix Scroll-Reset (Auftrag David 25.6.2026): Pfadwechsel + Sperre
  // SYNCHRON im Commit setzen — VOR dem ersten Paint und damit vor dem
  // scroll-Event, das der Browser beim Schrumpfen der Dokumenthöhe (der neue,
  // noch nicht geladene Reader ist kurz) auslöst. Lag das in einem useEffect
  // (nach dem Paint), konnte jenes Clamp-scroll-Event noch mit dem ALTEN
  // aktiv.current feuern und dem VORHERIGEN Gesetz die ~0-Position zuschreiben
  // → beim Zurückwechseln landete man am Anfang («ab und zu», timing-abhängig;
  // das war die Wurzel hinter den früheren Teil-Fixes). useLayoutEffect
  // garantiert die Reihenfolge unabhängig vom Timing.
  const vorherSchluessel = useRef<string | null>(null);
  useIsoLayoutEffect(() => {
    wiederherstellend.current = true;       // Clamp-/Transient-Scrolls NICHT speichern
    aktiv.current = hash ? '' : schluessel;  // ab sofort gehört jeder Save dem NEUEN Reiter
    // LM-201 (W2·17-UI-BEFUNDE-B2): Routenwechsel OHNE anstehende Restauration
    // (kein Hash-Ziel, keine gespeicherte Position, kein Anker) beginnt oben —
    // SYNCHRON im Commit, vor dem ersten Paint der neuen Route. Der bisherige
    // Reset lief erst im useEffect + rAF (nach dem Paint): beim Wechsel auf eine
    // kürzere Seite war einen Moment die alte, nur geklemmte Scrollposition
    // sichtbar (Prod-Messung 2.8.2026: Ankunft bei y=2'520 auf 3'249 px Dokument-
    // höhe; Zwischenzustand +15 ms belegt). Restaurations-Fälle (Anker/Position/
    // Hash) bleiben unberührt — dort übernimmt wie bisher die Konvergenz-Schleife
    // bzw. ScrollZuHash. Erst-Mount ausgenommen (vorherSchluessel === null):
    // den Initial-Load verwaltet der Browser.
    if (
      !hash &&
      vorherSchluessel.current !== null &&
      vorherSchluessel.current !== schluessel &&
      positionen.current.get(schluessel) === undefined &&
      leseAnker(schluessel) === undefined
    ) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    vorherSchluessel.current = schluessel;
  }, [schluessel, hash]);
  useEffect(() => {
    if (hash) { wiederherstellend.current = false; return; } // Anker-Sprung übernimmt ScrollZuHash
    const gespeichert = positionen.current.get(schluessel);
    // W2·5d U-POSITION/A16: bei einem Gesetz-Leser-Reiter ist die massgebliche
    // Zielposition der ANKER (letzter sichtbarer Artikel + Offset), gegen das
    // AKTUELLE DOM aufgelöst (element-basiert → robust gegen die content-visibility-
    // Höhenschätzung, David 5.7.). Der absolute scrollY bleibt der Fallback, wenn
    // der Anker (noch) nicht auflösbar ist (Lazy-Ladephase) oder fehlt (jede
    // Nicht-Leser-Route). `zielJetzt()` wird IN der Konvergenz-Schleife je Frame
    // neu berechnet — so zieht die Position nach, sobald die Artikel materialisieren.
    const hatAnker = leseAnker(schluessel) !== undefined;
    const zielJetzt = () => aufloeseAnkerY(schluessel) ?? gespeichert ?? 0;
    const ziel = zielJetzt();
    // Neu besuchter Pfad OHNE gespeicherte Position UND ohne Anker (Ziel = Anfang):
    // EINMALIG nach oben, KEIN beharrlicher Loop. Der 360-Frame-Loop ist nur für das
    // Wiederherstellen einer NICHT-Null-Position durch die lazy Ladephase nötig;
    // für einen frischen Pfad reisst er die Seite nur sichtbar wiederholt an den
    // Anfang (Bug David: «beim Wechsel zwischen Gesetzen wird man an den Anfang
    // geschickt» — der Reader remountet ohnehin oben, das genügt). Ein zweiter
    // raf fängt den Fall, dass der lazy Chunk im selben Frame noch nicht montiert
    // ist und der Browser eine Rest-Scrollposition hält.
    // Bei VORHANDENEM Anker gehört der Fall in die Konvergenz-Schleife, auch wenn
    // er (noch) nicht auflösbar ist und kein scrollY-Fallback existiert (LM-199:
    // auf Hash-Routen wird KEIN scrollY gespeichert — der Anker ist dann die
    // einzige Restaurations-Quelle und materialisiert erst mit den Artikeln).
    if (!hatAnker && (gespeichert === undefined || ziel === 0)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      const raf = requestAnimationFrame(() => {
        if (window.scrollY > 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        wiederherstellend.current = false; // Sperre lösen → ab jetzt wird die Position des neuen Pfads gespeichert
      });
      return () => { cancelAnimationFrame(raf); wiederherstellend.current = false; };
    }
    // Gespeicherte NICHT-Null-Position / Anker wiederherstellen (Tab verlassen →
    // zurück): Lazy geladene Seiten (Reader-Chunk + Normtext-JSON erst nach dem
    // Routenwechsel) sind anfangs zu kurz → erneut anpeilen, SOLANGE der Inhalt noch
    // wächst — bis das Ziel erreicht ist oder die Höhe ~12 Frames stabil bleibt
    // (Seite fertig, ggf. echt kürzer), höchstens ~360 Frames als Notbremse.
    wiederherstellend.current = true;
    let frames = 0;
    let stabil = 0;
    let letzteHoehe = -1;
    let raf = requestAnimationFrame(function versuche() {
      const ziel = zielJetzt();
      window.scrollTo({ top: ziel, left: 0, behavior: 'instant' as ScrollBehavior });
      const erreicht = Math.abs(window.scrollY - ziel) <= 2;
      const hoehe = document.documentElement.scrollHeight;
      // «stabil» NUR zählen, wenn überhaupt genug Inhalt da ist. Sonst löst die
      // stabile, aber noch KURZE Höhe der Ladephase (der Reader fetcht das
      // Normtext-JSON erst NACH dem Mount) den Abbruch aus, bevor der Inhalt da
      // ist → man landet oben (Bug David). Erst nach dem Laden gilt eine stabile
      // Höhe als «Seite fertig, Ziel ggf. echt unerreichbar».
      const geladen = hoehe > window.innerHeight * 1.5;
      stabil = (geladen && hoehe === letzteHoehe) ? stabil + 1 : 0;
      letzteHoehe = hoehe;
      // «erreicht» zählt NICHT, solange ein vorhandener Anker noch unauflösbar
      // ist (Ladephase, zielJetzt() fällt derweil auf gespeichert/0 zurück):
      // ohne scrollY-Fallback wäre das Zwischenziel 0 sofort «erreicht» und die
      // Schleife bräche ab, bevor die Artikel materialisieren (LM-199).
      const ankerOffen = hatAnker && aufloeseAnkerY(schluessel) == null;
      if ((!erreicht || ankerOffen) && frames++ < 360 && stabil < 12) raf = requestAnimationFrame(versuche);
      else wiederherstellend.current = false;
    });
    return () => { cancelAnimationFrame(raf); wiederherstellend.current = false; };
  }, [schluessel, hash]);
  return null;
}

// Anker-Sprung für die Seitenleisten-Tieflinks (Vorlagen-Gruppe, Bund-Gebiet).
// react-router scrollt nicht von selbst zum #hash; und das Ziel-Element steckt
// hinter einer lazy()-Seite, die erst einen Tick später montiert — darum mit
// requestAnimationFrame ein paar Frames lang erneut versuchen, dann aufgeben.
function ScrollZuHash({ hashVerbraucht }: { hashVerbraucht: boolean }) {
  const { hash, pathname, search } = useLocation();
  useEffect(() => {
    // Verbrauchter Hash (LM-199): beim Zurück/Vorwärts aus einer anderen Route
    // gewinnt die Anker-Restauration (ScrollWiederherstellung), nicht der
    // Einstiegs-Anker — sonst kapert der stehende #hash die Rückkehr-Position.
    if (!hash || hashVerbraucht) return;
    const id = sicherDekodiert(hash.slice(1)); // PA-1-B01: kaputtes %-Escape ⇒ kein Sprung statt weisse App
    if (!id) return;
    let frames = 0;
    let raf = requestAnimationFrame(function versuche() {
      const el = document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' }); return; }
      if (frames++ < 30) raf = requestAnimationFrame(versuche);
    });
    return () => cancelAnimationFrame(raf);
  }, [hash, pathname, search, hashVerbraucht]);
  return null;
}

export default function App() {
  // key={pathname} am Inhalt → dezenter Opacity-Fade beim Routenwechsel
  // (Redesign E8). Der Such-Parameter (?q= der Hero-Suche) ändert den
  // pathname NICHT → kein Remount, der Katalog-Zustand bleibt erhalten.
  const { pathname } = useLocation();
  // LM-199: EIN Verdikt für beide Scroll-Komponenten (ScrollWiederherstellung
  // übernimmt die Restauration, ScrollZuHash lässt den verbrauchten Hash aus) —
  // zweimal berechnet könnten die Instanzen auseinanderlaufen (§5).
  const hashVerbraucht = useVerbrauchterHash();
  // Rank 2 (QS-PERF): schwere Leser-Chunks nach dem Erstpaint idle vorwärmen, damit
  // das erste Gesetz/Entscheid ohne Chunk-Parse-Wartezeit öffnet. requestIdleCallback
  // hält es vom kritischen Pfad fern (setTimeout-Fallback, garantiert feuernd, §15/3).
  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let toId: number | undefined;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(prefetchLeser);
    else toId = window.setTimeout(prefetchLeser, 1500);
    return () => {
      if (idleId != null) w.cancelIdleCallback?.(idleId);
      if (toId != null) window.clearTimeout(toId);
    };
  }, []);
  return (
    <LocaleProvider>
    <Shell>
      <ScrollWiederherstellung hashVerbraucht={hashVerbraucht} />
      <ScrollZuHash hashVerbraucht={hashVerbraucht} />
      <RouteMeta />
      {/* Öffnet je Inhalts-Route einen Reiter im In-App-Tab-Streifen */}
      <TabTracker />
      {/* Merkt je konkreter Inhalts-Route den «Zuletzt verwendet»-Chip (Startseite) */}
      <ZuletztTracker />
      {/* A-6 (31.8.2026): Fade · Suspense-Fallback mit Höhenreservierung ·
          `ErrorBoundary key={pathname}` sind EIN Baustein
          (`components/layout/RouteHuelle`) — dieselbe Hülle trägt seither auch
          das sekundäre Pane, das alle drei Zusagen entbehrte. Die Herleitungen
          (Reihenfolge, CLS-Reservierung, Selbstheilung beim Seitenwechsel)
          stehen dort. */}
      <RouteHuelle schluessel={pathname}>
      {/* Der EINE Routen-Baum (§5) — ausgelagert nach RouteSwitch, damit er
          künftig auch in einem MemoryRouter-Pane laufen kann (Split-View B). */}
      <RouteSwitch />
      </RouteHuelle>
    </Shell>
    </LocaleProvider>
  );
}
