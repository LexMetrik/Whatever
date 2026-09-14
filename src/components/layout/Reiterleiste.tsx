import { useEffect, useRef, useState, type KeyboardEvent as ReactTaste } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTabs } from './useTabs';
import {
  schliesseTab, leereTabs, ordneTabsUm, tabSchluessel,
  stelleLetztenWiederHer, merkeTab, nachfolgerReiter, merkeAktivenReiter,
  reiterKurzformText, reiterKarteTeile, zugErlaubt,
} from '../../lib/tabs';
import { speichereMappe, loescheMappe, mappenAdresse } from '../../lib/mappen';
import { verlaufLabel, type VerlaufManifeste } from '../../lib/verlaufLabel';
import { Reiter } from './reiterleiste/Reiter';
import { ReiterBlatt } from './reiterleiste/ReiterBlatt';
import { useReiterFenster } from './reiterleiste/useReiterFenster';
import { REITER_MIME } from './reiterleiste/ueberlauf';
import { BLATT_ZU, type BlattZustand } from './reiterleiste/blatt';
import { useDialogFokus } from './useDialogFokus';
import { useKopieren } from '../useKopieren';
import { usePaneSteuerung } from './usePaneLayout';
import {
  ladeMenue, ladeKarte, ladeMappenDialog,
  useReiterleisteSchub, useReiterleisteManifeste, useReiterleisteTastatur,
} from './Reiterleiste.helfer';
import {
  menueEintraege, leerraumEintraege, oeffneMappe, type ReiterEintraegeKontext,
} from './Reiterleiste.eintraege';
import type { MappenAbsicht } from './reiterleiste/MappenDialog';

// ─── Arbeitsleiste: die offenen Reiter, sichtbar (W2·24 §5a, Wunsch David) ───
//
// «analog zum browser die offenen tabs oben anstatt mit dem drei linien drop
// down» (David 6.9.2026). Ersetzt `ReiterUebersicht` (☰-Trigger + Flyout) —
// die Datei ist mit diesem Schritt gelöscht, ihr Flyout-Inhalt (`TabPanel`)
// lebt hier im Überlauf-Blatt weiter.
//
// ZWEITE ZEILE, ZWEITE BEDEUTUNG (§5a Ziff. 1): die Titelblatt-Zeile darüber
// führt BEREICHE (unterstrichener Text, keine Fläche, kein ✕), diese Leiste
// führt DOKUMENTE (Reiter mit Registerfarben-Strich und ✕). Damit man die
// beiden nicht verwechselt, sind sie optisch verschieden gebaut.
//
// KEINE neue Reiter-Mechanik (§3/§5): Liste, Reihenfolge, Umsortieren,
// Schliessen und die Persistenz kommen unverändert aus `lib/tabs.ts`
// (localStorage `lexmetrik-tabs`, Pfad INKLUSIVE `#art-…`-Anker — die
// Lesestellung überlebt den Neustart also schon heute, §5a Ziff. 6).

/** Der MIME-Typ des Reiter-Zugs wohnt seit R13 bei der Überlauf-Rechnung
 *  (`reiterleiste/ueberlauf`) — hier steht nur noch die Durchreiche, damit
 *  `Shell.tsx` seinen bisherigen Import behält (§5: eine Quelle). */
// Seit W2·18 Welle 3 Punkt 2 wird die Konstante hier auch SELBST gebraucht
// (Ablage am «+N»-Knopf) — darum importiert und weitergereicht statt nur
// durchgereicht; der Re-Export für die Panes bleibt wortgleich (§5).
export { REITER_MIME };

export function Reiterleiste({ paneSchluessel = [] }: {
  /** Reiter-Schlüssel der offenen Panes in Fenster-Ordnung (0 = links/Haupt).
   *  Daraus zeichnet die Leiste die Aktiv-Marken «links»/«rechts» (§5a Ziff. 4). */
  paneSchluessel?: string[];
}) {
  const tabs = useTabs();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { oeffneDaneben, kannOeffnen, istOffen, schliessePane } = usePaneSteuerung();
  const [manifeste, setManifeste] = useState<VerlaufManifeste>({});
  // ── W2·18 Punkt 6 · EIN ZUSTAND FÜR BLATT UND FILTER ─────────────────────
  // Hier standen ZWEI Zustände: `blattOffen` und daneben `suche`. Das Blatt
  // ging zu (acht Wege: ✕, Esc, Klick daneben, Navigation, «daneben öffnen»,
  // «Neuer Reiter», «Wieder öffnen», «Alle schliessen»), der Filter blieb
  // stehen — beim nächsten Öffnen «fehlten» Reiter, ohne dass man sähe, warum.
  // Zwei Zustände heisst: jeder Schliess-Weg muss an den zweiten DENKEN. Einer
  // heisst: zu ist zu, und zu ist immer ohne Filter (`BLATT_ZU`).
  const [blatt, setBlatt] = useState<BlattZustand>(BLATT_ZU);
  const { offen: blattOffen, suche } = blatt;
  const schliesseBlatt = () => setBlatt(BLATT_ZU);
  const { kopieren } = useKopieren();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const blattRef = useRef<HTMLDivElement>(null);
  const leisteRef = useRef<HTMLDivElement>(null);
  /** Die scrollende Reiter-Fläche selbst — Ziel des Mausrads (M6) und Anker
   *  für den Doppelklick auf den Leerraum. */
  const streifenRef = useRef<HTMLDivElement>(null);
  /** Offenes Reiter-Kontextmenü (M4): welcher Reiter, an welcher Stelle. */
  const [menue, setMenue] = useState<{ path: string | null; x: number; y: number } | null>(null);
  // W2·18 Welle 2 Punkt 5 · die Menü-Fläche selbst, sobald ihr Chunk da ist
  // (Herleitung oben am Import). Bis dahin `null` — dann gibt es schlicht kein
  // Menü, keinen Platzhalter unter dem Zeiger.
  const [MenueFlaeche, setMenueFlaeche] =
    useState<typeof import('./ReiterMenue')['ReiterMenue'] | null>(null);
  const holeMenue = () => { void ladeMenue().then((m) => setMenueFlaeche(() => m.ReiterMenue)); };
  /** W2·18 Welle 3 Punkt 4 — die Hover-Karte: WELCHER Reiter, und wo er steht. */
  const [karte, setKarte] = useState<{ path: string; x: number; y: number } | null>(null);
  const [KarteFlaeche, setKarteFlaeche] =
    useState<typeof import('./reiterleiste/ReiterKarte')['ReiterKarte'] | null>(null);
  const holeKarte = () => { void ladeKarte().then((m) => setKarteFlaeche(() => m.ReiterKarte)); };
  /** W2·25 Teil 2 — welcher Mappen-Dialog offen ist (`null` = keiner). */
  const [mappenAbsicht, setMappenAbsicht] = useState<MappenAbsicht | null>(null);
  const [MappenFlaeche, setMappenFlaeche] =
    useState<typeof import('./reiterleiste/MappenDialog')['MappenDialog'] | null>(null);
  const holeMappen = () => { void ladeMappenDialog().then((m) => setMappenFlaeche(() => m.MappenDialog)); };
  /** Einen Mappen-Dialog öffnen — und dabei IMMER auch seinen Chunk anstossen
   *  (dieselbe Vorsicht wie bei `oeffneMenue`: ein Zeiger, der beim Laden schon
   *  über der Leiste ruht, löst kein `pointerenter` aus). */
  const oeffneMappen = (a: MappenAbsicht) => { holeMappen(); setMappenAbsicht(a); };
  /** Ein Menü öffnen — und dabei IMMER auch seinen Chunk anstossen. Der
   *  Vorlauf am `nav` (Zeiger/Fokus) deckt den Alltag ab, aber nicht jeden
   *  Fall: ein Zeiger, der beim Laden schon über der Leiste RUHT, löst kein
   *  `pointerenter` aus. Ohne diese Zeile bliebe das Menü dann für immer aus —
   *  ein Rechtsklick, der nichts tut (§8). Mit ihr öffnet es, sobald das Modul
   *  da ist: `menue` bleibt gesetzt, es wird nicht verworfen. */
  const oeffneMenue = (m: { path: string | null; x: number; y: number }) => { holeMenue(); setMenue(m); };
  const gezogen = useRef<string | null>(null);
  /** Gezogener Reiter als STATE (nicht nur Ref): der Reiter unter dem Zeiger
   *  soll sich während des Zugs sichtbar zurücknehmen — dafür braucht es ein
   *  Re-Render. Die Ref bleibt daneben, weil `dragover`/`drop` sie SYNCHRON
   *  lesen müssen (ein State-Wert wäre im selben Ereignis noch der alte). */
  const [zieht, setZieht] = useState<string | null>(null);
  /** Wo die Einfügemarke steht: an welchem Reiter, und auf welcher Seite.
   *  Die Seite kommt aus dem Zeiger-X über der Ziel-Hälfte (D15).
   *  `gesperrt` = der Zug ginge über die Zonengrenze der angehefteten Reiter
   *  und wird abgelehnt (W2·25; die Marke sagt es, bevor losgelassen wird). */
  const [ueber, setUeber] = useState<{ path: string; davor: boolean; gesperrt?: boolean } | null>(null);
  const { stoppSchub, beiRandZug } = useReiterleisteSchub(gezogen);
  /** Schwebt gerade ein Reiter über dem «+N»-Knopf? (Ablage, s. dort.) */
  const [ueberAblage, setUeberAblage] = useState(false);

  useReiterleisteManifeste(tabs, setManifeste);

  const aktivSchluessel = tabSchluessel(pathname + search);

  // ── W2·18 Welle 2 Punkt 2 · WER ZULETZT DRAN WAR ──────────────────────────
  // Die einzige Stelle, an der ein Aktiv-Wechsel sicher durchkommt: die Leiste
  // sieht jede Navigation (sie hängt an `useLocation`), egal ob sie aus einem
  // Klick, einem Kürzel oder dem Zurück-Knopf des Browsers kam. Ein Schreiber
  // am Reiter-Klick allein hätte die halbe App verpasst.
  useEffect(() => { merkeAktivenReiter(aktivSchluessel); }, [aktivSchluessel]);

  // ── D16 (David 6.9.2026) · DIE LEISTE ZEIGT DEN SPEICHER, SONST NICHTS ────
  //
  // Hier stand bis zum Fixer 1c eine ZWEITE Ordnung: die Reiter wurden nach
  // `KAT_ORDER` gebündelt und innerhalb «gesetze» nach `HERKUNFT_ORDER` —
  // dieselbe Gruppierung wie im Überlauf-Blatt (`TabPanel`). Der Gedanke war
  // «eine App, eine Ordnung». Gemessen war die Folge das Gegenteil:
  // `lib/tabs.ordneTabsUm` verschiebt den FLACHEN Speicher, und jede
  // Verschiebung über eine Kategoriegrenze sammelte das Bucketing sofort wieder
  // ein. David 6.9.2026: «es geht nur wenn nur gesetze offen sind — bug»
  // (nachgestellt über acht Kombinationen, `e2e/w224-reiter-umordnen-d16`).
  //
  // ENTSCHEID (analog Browser): man ordnet, was man SIEHT. Die Arbeitsleiste
  // zeigt darum die reine Speicherreihenfolge. Die Gruppierung nach Art bleibt
  // dort, wo sie eine LISTE ordnet und niemand zieht — im Überlauf-Blatt.
  // Dass die beiden damit verschieden sortieren, ist kein Widerspruch, sondern
  // die Aufgabenteilung: die Leiste ist eine Arbeitsfläche, das Blatt ein
  // Verzeichnis.
  const ordnung = tabs;

  // ── R13-2/R13-3 · ÜBERLAUF AUS DER GEMESSENEN BREITE, FENSTER STATT TAUSCH ─
  //
  // Hier stand bis R13 eine feste Zahl (`SICHTBAR_MAX = 8`) UND ein
  // Positions-Tausch: lag der aktive Reiter dahinter, wurde er auf Slot 8
  // GESETZT und der bisherige Slot-8-Reiter fiel ins Blatt. GEMESSEN 7.9.2026
  // (15 Reiter, Wechsel #14 → #15): «ARG» verschwand aus dem Streifen, obwohl
  // niemand ihn geschlossen hatte — die Leiste zeigte eine Nachbarschaft, die
  // es im Speicher nicht gibt, und Alt+⇧+←/→ ordnete gegen das Bild (R13-3).
  // Zugleich sagte die feste 8 nichts über den PLATZ: 8 lange Reiter @1440
  // massen 1476 px in einem 1355 px breiten Streifen, ohne «+N» und ohne
  // sichtbaren Scrollbalken — der achte stand als stummes «Z» an der Kante,
  // @1024 fehlten zwei Reiter ganz (R13-2).
  //
  // JETZT: `useReiterFenster` misst, wie viele Reiter NEBENEINANDER ganz ins
  // Bild passen (die Reiter schrumpfen dabei bis an ihre Inhaltsgrenze), und
  // die Leiste zeigt ein zusammenhängendes FENSTER dieser Länge über die echte
  // Speicherordnung — verschoben genau so weit, dass der aktive Reiter darin
  // liegt. Alles ausserhalb steht im «+N»-Blatt, nichts wird angeschnitten.
  const aktivIdx = ordnung.findIndex((t) => tabSchluessel(t.path) === aktivSchluessel);
  const { start, anzahl, ohneKopf } = useReiterFenster(streifenRef, ordnung.length, aktivIdx);
  const sichtbar = ordnung.slice(start, start + anzahl);
  const versteckt = [...ordnung.slice(0, start), ...ordnung.slice(start + anzahl)];

  // ── R14 (Entscheid David 7.9.2026) · DIE LEISTE STEHT NIE LEER ────────────
  //
  // GEMESSEN am Vorstand `79023e630`: nach dem letzten ✕ standen 0 Reiter, ein
  // leerer 34-px-Streifen und die Sammlung als Inhalt OHNE Reiter — der
  // Zustand «App offen, kein Tab aktiv», den es im Browser nicht gibt. Seit
  // R14 tritt die Sammlung an die Stelle des letzten Reiters: EIN Zug, kein
  // Zwischenbild mit 0 Reitern (`merkeTab` VOR `navigate`, sonst sähe die
  // Leiste den Leerzustand für einen Frame).
  const zurSammlung = () => { merkeTab('/'); navigate('/'); };

  const schliessen = (path: string) => {
    // M1: steht dieser Reiter gerade in einem zweiten Fenster, geht das Fenster
    // mit — sonst zeigte es weiter ein Dokument, das die Leiste nicht mehr
    // führt (der gemessene P4-Zustand, nur rückwärts).
    schliessePane(path);
    const teil = tabSchluessel(path);
    if (aktivSchluessel === teil) {
      // W2·18 Punkt 3: WELCHER Nachbar nachrückt, rechnet `lib/tabs`
      // (Browser-Norm: rechts, ersatzweise links) — hier steht nur die Folge.
      const idx = ordnung.findIndex((t) => tabSchluessel(t.path) === teil);
      const nachbar = nachfolgerReiter(ordnung, idx);
      schliesseTab(path);
      if (nachbar) navigate(nachbar.path); else zurSammlung();
    } else schliesseTab(path);
  };

  // ═══ W2·18 WELLE 2 PUNKT 1 · DER STREIFEN IST EINE GRUPPE, KEINE KETTE ════
  //
  // GEMESSEN 13.9.2026 (SSR-Markup, Vorstand `2a331dcdd`): 0 × `tabindex` in
  // der ganzen Leiste. Jeder Reiterknopf und jedes ✕ stand im Tabulator-Ring —
  // sechs Reiter kosteten zwölf Anschläge bis zum Dokument, fünfzig hundert.
  // WAI-ARIA APG (Tabs/Toolbar) kennt dafür das «roving tabindex»: EIN Element
  // der Gruppe trägt `tabindex=0`, alle übrigen −1, und bewegt wird INNERHALB
  // der Gruppe mit den Pfeiltasten.
  //
  // WELCHER Reiter den Platz hat: der zuletzt fokussierte, solange er im
  // Fenster steht; sonst der aktive; sonst der erste. So findet die
  // Tabulator-Taste immer DEN Reiter, an dem man zuletzt war — und nach einem
  // Seitenwechsel den, den man gerade liest.
  //
  // KEIN `role=tablist` (Entscheid §4.R2): die Leiste ist Navigation, kein
  // Panel-Umschalter; `nav` bleibt. Die Rolle würde Auswahl-Semantik
  // versprechen (`aria-selected`, «Pfeiltaste wählt aus»), die hier gerade
  // NICHT gilt — Pfeil bewegt den FOKUS, aktiviert wird mit Enter/Space
  // (das tut der Knopf von sich aus, darum steht dazu unten nichts).
  const [fokusWunsch, setFokusWunsch] = useState<string | null>(null);
  const sichtbareSchluessel = sichtbar.map((t) => tabSchluessel(t.path));
  const ringSchluessel = fokusWunsch && sichtbareSchluessel.includes(fokusWunsch)
    ? fokusWunsch
    : sichtbareSchluessel.includes(aktivSchluessel)
      ? aktivSchluessel
      : sichtbareSchluessel[0] ?? null;

  /** Der Reiterknopf zu einer Identität — über das Mess-Attribut, nicht über
   *  einen CSS-Selektor: Reiterpfade tragen `/`, `?` und `=`, und `CSS.escape`
   *  ist nicht überall zu haben. */
  const knopfVon = (k: string): HTMLElement | null => {
    const kasten = Array.from(streifenRef.current?.querySelectorAll<HTMLElement>('[data-reiter-schluessel]') ?? [])
      .find((x) => x.getAttribute('data-reiter-schluessel') === k);
    // W2·18 Welle 3 Punkt 3: der Reiter selbst ist ein `<a>`; `button` trifft
    // seit dem Rollenwechsel nur noch die Griffe ⧉/✕ daneben. `a, button` in
    // Dokumentreihenfolge liefert wieder den Reiter — und bliebe richtig,
    // wenn der Reiter je wieder ein Knopf würde.
    return kasten?.querySelector<HTMLElement>('a, button') ?? null;
  };

  /** Wohin der Fokus nach dem NÄCHSTEN Render gehört (Delete: der Reiter, der
   *  den Platz des geschlossenen einnimmt). Erst danach steht sein Knopf im
   *  DOM — vorher zu fokussieren hiesse, ein Element zu greifen, das gleich
   *  verschwindet. */
  const fokusNach = useRef<string | null>(null);
  useEffect(() => {
    const k = fokusNach.current;
    if (!k) return;
    fokusNach.current = null;
    knopfVon(k)?.focus();
  });

  const zumReiter = (k: string) => { setFokusWunsch(k); knopfVon(k)?.focus(); };

  // ←/→ bewegen den Fokus auf den Nachbarn, Home/End auf den ersten/letzten
  // SICHTBAREN, Delete schliesst den fokussierten Reiter (Browser-Idiom für
  // «weg damit», ohne die Hand zur Maus).
  // KEIN UMLAUF am Rand — dieselbe Wahl wie beim Umordnen (Alt+⇧+←/→, s.
  // unten): wer am Ende ankommt, soll es merken, statt vorn wieder
  // herauszukommen. Zyklisch blättert Alt+Bild↑/↓, und das WECHSELT die
  // Auswahl; hier wandert nur der Fokus.
  // MIT MODIFIKATOR NICHTS: Alt+⇧+←/→ ordnet um, Alt+←/→ gehört dem Browser
  // (Verlauf) — beides wird hier nicht abgefangen.
  const onStreifenTaste = (ev: ReactTaste<HTMLDivElement>) => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    const hier = (ev.target as HTMLElement).closest?.('[data-reiter-schluessel]')
      ?.getAttribute('data-reiter-schluessel');
    if (!hier) return;
    const i = sichtbareSchluessel.indexOf(hier);
    if (i === -1) return;
    if (ev.key === 'Delete') {
      const naechster = sichtbareSchluessel[i + 1] ?? sichtbareSchluessel[i - 1] ?? null;
      ev.preventDefault();
      fokusNach.current = naechster;
      if (naechster) setFokusWunsch(naechster);
      schliessen(sichtbar[i].path);
      return;
    }
    const ziel = ev.key === 'ArrowRight' ? Math.min(i + 1, sichtbareSchluessel.length - 1)
      : ev.key === 'ArrowLeft' ? Math.max(i - 1, 0)
      : ev.key === 'Home' ? 0
      : ev.key === 'End' ? sichtbareSchluessel.length - 1
      : -1;
    if (ziel < 0) return;
    ev.preventDefault();
    zumReiter(sichtbareSchluessel[ziel]);
  };

  // ── D19 (David 6.9.2026: «mit plus einen neuen reiter erzeugen können»),
  //    R14-Fassung ─────────────────────────────────────────────────────────
  // Der Browser-«+» öffnet die SAMMLUNG — die Neuer-Reiter-Seite dieser App —
  // und schickt den Fokus in die Kopf-Suche (dieselbe global lauschende Geste
  // wie der /gesetze-Landeplatz, `lm:suche-fokus` in `HeaderSuche.tsx`; kein
  // zweiter Fokus-Weg nötig). Bis R14 legte er einen LEEREN Reiter über einen
  // Zeichen für Zeichen identischen Bildschirm — Davids «dann erscheint
  // einfach neuer reiter». Die Höchstens-einer-Regel (R13-Entscheid, für W2·25
  // bindend) braucht dafür keinen Sonderfall mehr: `merkeTab` erkennt die
  // bereits offene Sammlung an ihrer Identität und aktiviert sie.
  const neuerReiter = () => {
    zurSammlung();
    window.dispatchEvent(new CustomEvent('lm:suche-fokus'));
  };

  // ── R13-6 · «ALLE SCHLIESSEN» AN EINER STELLE GERECHNET ───────────────────
  // GEMESSEN 7.9.2026: @1440 mit 3–8 Reitern ist der Blatt-Knopf `md:hidden`
  // (Breite 0) — und «Alle schliessen» stand AUSSCHLIESSLICH im Blatt. Am
  // Desktop war die Geste damit gar nicht erreichbar. Jetzt steht sie in beiden
  // Kontextmenüs und im Blatt; gerechnet wird sie genau hier (§5). Die Fenster
  // gehen mit (M1) — sonst zeigte ein Pane weiter ein Dokument, das die Leiste
  // nicht mehr führt.
  const alleSchliessen = () => {
    // W2·25: die angehefteten bleiben — also bleibt auch ihr zweites Fenster
    // stehen. Ein Pane, dessen Reiter die Leiste weiterführt, gehört nicht zu
    // (M1 gilt in beide Richtungen).
    for (const x of ordnung) if (!x.fest) schliessePane(x.path);
    leereTabs();
    // R14: «alle» heisst alle Dokumente — übrig bleibt die Sammlung, wie im
    // Browser das letzte Fenster mit der Neuer-Tab-Seite.
    zurSammlung();
  };

  // ── M3 · «ZULETZT GESCHLOSSEN» (Prüfbefund R11 #37) ───────────────────────
  // EIN Weg, drei Zugänge: Alt+Shift+T, der Eintrag im Reiter-Kontextmenü und
  // die Zeile im Überlauf-Blatt rufen alle diese Funktion. Sie stellt den
  // Reiter an seiner alten Position wieder her (`lib/tabs`) und geht dorthin —
  // wer wiederherstellt, will das Dokument sehen, nicht nur seinen Reiter.
  const stelleWiederHer = () => {
    const wieder = stelleLetztenWiederHer();
    if (wieder) navigate(wieder.path);
  };

  useReiterleisteTastatur({
    ordnung, aktivSchluessel, navigate, schliessen, neuerReiter, stelleWiederHer,
  });

  // Aktiven Reiter ins Bild scrollen (§5a Ziff. 8, mobile Leiste).
  //
  // BEWUSST NICHT `scrollIntoView`: GEMESSEN 6.9.2026 (Preview, Chromium,
  // `/gesetze/bund/GEBV_HREG`) setzte der Aufruf den Startpunkt der
  // Tab-Reihenfolge des Dokuments auf den Reiter — der erste Tab-Druck landete
  // danach auf dem Reiter statt auf dem Skip-Link, und `e2e/a11y.e2e.ts` (E4)
  // wurde rot. Der Skip-Link ist die erste Zusage der Tastaturbedienung; ein
  // Komfort-Scroll darf sie nicht kosten. Hier wird darum NUR die waagrechte
  // Scroll-Position des Streifens selbst gesetzt: kein Dokument-Scroll, kein
  // Eingriff in die Fokus-Reihenfolge, gleiche Wirkung.
  useEffect(() => {
    const streifen = leisteRef.current?.querySelector<HTMLElement>('[data-reiter-streifen]');
    const el = streifen?.querySelector<HTMLElement>('[data-reiter-aktiv="true"]');
    if (!streifen || !el) return;
    const links = el.offsetLeft;
    const rechts = links + el.offsetWidth;
    if (links < streifen.scrollLeft) streifen.scrollLeft = links;
    else if (rechts > streifen.scrollLeft + streifen.clientWidth) {
      streifen.scrollLeft = rechts - streifen.clientWidth;
    }
  }, [aktivSchluessel, sichtbar.length, anzahl]);

  // ── M6 · DAS MAUSRAD ROLLT DIE LEISTE (Prüfbefund R11 #33) ────────────────
  //
  // GEMESSEN 6.9.2026 @390 mit echtem Überlauf (`scrollWidth 818 /
  // clientWidth 253`): senkrechtes Rad über der Leiste liess `scrollLeft` bei
  // 0 — nur ein waagrechtes Rad bewegte sie. Eine gewöhnliche Maus ohne
  // Querrad erreichte die hinteren Reiter durch Rollen also nie.
  //
  // NATIVER LAUSCHER STATT `onWheel`: React hängt `wheel` PASSIV an die
  // Wurzel; ein `preventDefault()` im React-Handler wirkte nicht und würde nur
  // eine Konsolen-Warnung erzeugen. `{ passive: false }` ist die einzige Art,
  // das Seiten-Scrollen an dieser Stelle wirklich zu ersetzen.
  //
  // NUR BEI ECHTEM ÜBERLAUF (Risiko aus dem Plan): läuft die Leiste nicht
  // über, bleibt das Rad beim Dokument — GEMESSEN scrollt die Seite heute
  // unter dem Zeiger auf der klebenden Leiste (`scrollY 400`), und diese
  // Funktion darf nicht verlorengehen. Und nur, wenn die senkrechte Bewegung
  // die stärkere ist: wer ein Querrad hat, behält seinen eigenen Weg.
  useEffect(() => {
    const el = streifenRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Blatt schliessen bei Klick ausserhalb (Trigger + portaliertes Blatt).
  useEffect(() => {
    if (!blattOffen) return;
    const zu = (e: MouseEvent) => {
      const ziel = e.target as Node;
      if (triggerRef.current?.contains(ziel) || blattRef.current?.contains(ziel)) return;
      schliesseBlatt();
    };
    document.addEventListener('mousedown', zu);
    return () => document.removeEventListener('mousedown', zu);
  }, [blattOffen]);
  useDialogFokus(blattOffen, blattRef, schliesseBlatt);

  const gefiltert = suche.trim()
    ? tabs.filter((t) => `${reiterKurzformText(t, manifeste)} ${verlaufLabel(t.path, manifeste)} ${t.path}`
        .toLowerCase().includes(suche.trim().toLowerCase()))
    : tabs;

  const ueberlaufZahl = versteckt.length;
  const blattTitel = ueberlaufZahl > 0 ? `+${ueberlaufZahl}` : `${tabs.length} offen`;

  const kontext: ReiterEintraegeKontext = {
    ordnung, tabs, aktivSchluessel, manifeste, kannOeffnen, istOffen,
    oeffneDaneben, schliessePane, schliessen, alleSchliessen, neuerReiter,
    stelleWiederHer, oeffneMappen, navigate, kopieren,
  };

  const plusKnopf = () => (
    <button type="button" onClick={neuerReiter}
      aria-label="Neuer Reiter" title="Neuer Reiter (Alt+T)"
      className="rl-plus rl-plus-solo">
      <span aria-hidden className="lc-griff-glyph">+</span>
    </button>
  );

  return (
    <nav aria-label="Offene Reiter" ref={leisteRef}
      onPointerEnter={() => { holeMenue(); holeKarte(); }}
      onFocus={() => { holeMenue(); holeKarte(); }}
      className="print:hidden shrink-0 sticky top-[var(--app-krone-h)] z-leiste h-[var(--app-reiter-h)] bg-paper">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-rule-soft" />
      <div className="flex h-full items-stretch px-4 sm:px-6">
        {plusKnopf()}
        <div ref={streifenRef} data-reiter-streifen
          data-reiter-fenster={`${start}/${anzahl}/${ordnung.length}`}
          onDoubleClick={(ev) => { if (ev.target === ev.currentTarget) neuerReiter(); }}
          onKeyDown={onStreifenTaste}
          onDragOver={beiRandZug}
          onDrop={stoppSchub}
          onDragEnd={stoppSchub}
          onDragLeave={(ev) => { if (ev.target === ev.currentTarget) stoppSchub(); }}
          onContextMenu={(ev) => {
            if (ev.target !== ev.currentTarget) return;
            ev.preventDefault();
            oeffneMenue({ path: null, x: ev.clientX, y: ev.clientY });
          }}
          className="relative flex min-w-0 flex-1 items-stretch overflow-x-auto lc-reiter-scroll border-l border-rule-soft">
          {sichtbar.map((t) => {
            const k = tabSchluessel(t.path);
            const nr = ordnung.findIndex((x) => tabSchluessel(x.path) === k) + 1;
            return (
              <Reiter key={k} t={t} nr={nr} letzter={nr === ordnung.length}
                imRing={k === ringSchluessel} ohneKopf={ohneKopf}
                aktiv={k === aktivSchluessel} manifeste={manifeste} paneSchluessel={paneSchluessel}
                zieht={zieht} ueber={ueber} gezogenRef={gezogen}
                kannOeffnen={kannOeffnen} istOffen={istOffen} onDaneben={oeffneDaneben}
                onSchliessen={schliessen}
                onZieht={setZieht} onUeber={setUeber} onMenue={oeffneMenue} onKarte={setKarte}
                onUmordnen={ordneTabsUm}
                pruefeZug={(von, nach, davor) => zugErlaubt(ordnung, von, nach, davor)} />
            );
          })}
        </div>
        <button ref={triggerRef} type="button"
          aria-haspopup="dialog" aria-expanded={blattOffen}
          aria-label={`Alle ${tabs.length} offenen Reiter`}
          title="Alle offenen Reiter"
          onClick={() => setBlatt((z) => (z.offen ? BLATT_ZU : { offen: true, suche: '' }))}
          onContextMenu={(ev) => {
            ev.preventDefault();
            oeffneMenue({ path: null, x: ev.clientX, y: ev.clientY });
          }}
          onDragOver={(ev) => {
            const von = gezogen.current;
            if (!von) return;
            ev.preventDefault();
            stoppSchub();
            const letzte = ordnung[ordnung.length - 1];
            const geht = !!letzte && tabSchluessel(letzte.path) !== tabSchluessel(von)
              && zugErlaubt(ordnung, von, letzte.path, false);
            ev.dataTransfer.dropEffect = geht ? 'move' : 'none';
            if (ueberAblage !== geht) setUeberAblage(geht);
          }}
          onDragLeave={() => setUeberAblage(false)}
          onDrop={(ev) => {
            ev.preventDefault();
            setUeberAblage(false);
            const von = gezogen.current ?? ev.dataTransfer.getData(REITER_MIME);
            const letzte = ordnung[ordnung.length - 1];
            if (von && letzte && tabSchluessel(letzte.path) !== tabSchluessel(von)) {
              ordneTabsUm(von, letzte.path, false);
            }
            gezogen.current = null; setZieht(null); setUeber(null);
          }}
          data-reiter-ablage={ueberAblage ? 'aktiv' : undefined}
          className={`shrink-0 self-center ml-2 w-[4.5rem] overflow-hidden whitespace-nowrap border px-1 py-1 text-center text-body-s hover:text-ink-900 ${
            ueberAblage ? 'border-ink-900 text-ink-900' : 'border-rule-soft text-ink-600'}`}>
          <span className="num">{blattTitel}</span>
        </button>
      </div>

      {menue && MenueFlaeche && menue.path === null && (
        <MenueFlaeche x={menue.x} y={menue.y} name="Offene Reiter"
          eintraege={leerraumEintraege(kontext)} onSchliessen={() => setMenue(null)} />
      )}
      {menue && MenueFlaeche && menue.path !== null && (() => {
        const pfad = menue.path;
        const t = tabs.find((x) => tabSchluessel(x.path) === tabSchluessel(pfad));
        if (!t) return null;
        return (
          <MenueFlaeche x={menue.x} y={menue.y} name={reiterKurzformText(t, manifeste)}
            eintraege={menueEintraege(t, kontext)} onSchliessen={() => setMenue(null)} />
        );
      })()}

      {karte && KarteFlaeche && (() => {
        const t = tabs.find((x) => tabSchluessel(x.path) === tabSchluessel(karte.path));
        if (!t) return null;
        const idx = paneSchluessel.length > 1 ? paneSchluessel.indexOf(tabSchluessel(t.path)) : -1;
        return (
          <KarteFlaeche x={karte.x} y={karte.y} teile={reiterKarteTeile(t, manifeste)}
            fenster={idx === 0 ? 'links' : idx > 0 ? 'rechts' : null}
            onSchliessen={() => setKarte(null)} />
        );
      })()}

      {mappenAbsicht && MappenFlaeche && (
        <MappenFlaeche absicht={mappenAbsicht} offeneReiter={tabs}
          onSpeichern={(name) => { speichereMappe(name, tabs); setMappenAbsicht(null); }}
          onOeffnen={(m) => oeffneMappe(m, ordnung, schliessePane, setMappenAbsicht, navigate)}
          onLoeschen={(name) => { loescheMappe(name); setMappenAbsicht({ art: 'verwalten' }); }}
          onAdresse={(reiter) => kopieren(mappenAdresse(reiter))}
          onSchliessen={() => setMappenAbsicht(null)} />
      )}

      {blattOffen && (
        <ReiterBlatt
          blattRef={blattRef} tabs={tabs} gefiltert={gefiltert} manifeste={manifeste}
          aktivSchluessel={aktivSchluessel} suche={suche}
          onSuche={(neu) => setBlatt((z) => ({ ...z, suche: neu }))}
          onNavigate={(p) => { navigate(p); schliesseBlatt(); }}
          onSchliessen={schliessen}
          onDaneben={kannOeffnen ? (p) => { oeffneDaneben(p); schliesseBlatt(); } : undefined}
          paneOffen={istOffen}
          onNeu={() => { neuerReiter(); schliesseBlatt(); }}
          onWieder={() => { stelleWiederHer(); schliesseBlatt(); }}
          onAlle={() => { alleSchliessen(); schliesseBlatt(); }}
          onZu={schliesseBlatt} />
      )}
    </nav>
  );
}
