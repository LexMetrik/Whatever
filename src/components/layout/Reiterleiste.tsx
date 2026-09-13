import { useEffect, useRef, useState, type KeyboardEvent as ReactTaste } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTabs } from './useTabs';
import {
  schliesseTab, leereTabs, ordneTabsUm, tabSchluessel, type TabEintrag,
  schliesseAndere, schliesseRechtsVon,
  stelleLetztenWiederHer, letzterGeschlossener, naechsteInstanz, merkeTab,
  nachfolgerReiter,
  // W2·18 Welle 2 Punkt 2 · Pendeln zwischen den zwei zuletzt benutzten
  // Reitern — die Buchführung steht in `lib/tabs` (§3), hier nur die Taste.
  merkeAktivenReiter, vorherigerReiter,
  // ── R3 (Prüfbefund R11, 6.9.2026) · EINE KURZFORM, EIN TITEL (§5) ────────
  // Beide Ableitungen wohnten bis hierher IN dieser Datei — das Überlauf-Blatt
  // (`TabPanel`) baute daneben seine eigene Beschriftung aus `verlaufLabel`
  // und trug darum den Volltitel, wo die Leiste die Kurzform zeigte. Jetzt
  // stehen sie in `lib/tabs` und beide Flächen lesen dieselbe Quelle.
  reiterKurzformText,
  // W2·18 Welle 3 Punkt 4 · die Auskunft der Hover-Karte, zerlegt — dieselbe
  // Quelle, aus der sich der `title`-Einzeiler zusammensetzt (§5).
  reiterKarteTeile,
  // W2·18 Welle 3 Punkt 2 · der Rand-Schub liest die Ordnung bei JEDEM Takt
  // frisch aus der einen Quelle — ein Intervall-Rückruf sähe sonst für immer
  // die Ordnung des Renders, in dem er entstanden ist (§5).
  ladeTabs,
  // W2·25 · Anheften: die Mechanik wohnt ganz in `lib/tabs` (§3) — hier stehen
  // nur die beiden Menüzeilen und die Frage, ob ein Zug angenommen würde.
  hefteAn, loeseAb, festeZone, zugErlaubt,
} from '../../lib/tabs';
import { verlaufLabel, type VerlaufManifeste } from '../../lib/verlaufLabel';
import { manifestBedarf } from '../../lib/tabGruppen';
import { Reiter } from './reiterleiste/Reiter';
import { ReiterBlatt } from './reiterleiste/ReiterBlatt';
import { useReiterFenster } from './reiterleiste/useReiterFenster';
import { istBuchstabenTaste, zifferTaste } from './reiterleiste/tasten';
import { randSeite, schubZiel, SCHUB_MS } from './reiterleiste/randschub';
import { REITER_MIME } from './reiterleiste/ueberlauf';
import { BLATT_ZU, type BlattZustand } from './reiterleiste/blatt';
import { useDialogFokus } from './useDialogFokus';
import { useKopieren } from '../useKopieren';
import { usePaneSteuerung } from './usePaneLayout';
// ── §15 · DAS KONTEXTMENÜ GEHÖRT NICHT IN DEN START-CHUNK ──────────────────
// GEMESSEN 6.9.2026 (`npm run check:perf-budget`, gebautes dist/): mit einem
// statischen Import stieg der Entry-Chunk von 59.7 KB auf 61.3 KB gzip und
// riss das 60-KB-Budget — das Menü zieht `ui/Menue` mit, das sonst nur die
// (lazy geladene) Leser-Fläche braucht. Es erscheint frühestens beim ersten
// Rechtsklick; bis dahin kostet es nichts. Fallback `null`: es gibt nichts zu
// zeigen, solange nichts geöffnet ist, und ein Platzhalter unter dem Zeiger
// wäre schlechter als das Menü einen Wimpernschlag später.
// LOGIKVERLUST-BEWERTUNG (§15): keiner — dieselbe Komponente, dieselben
// Aktionen, nur später geladen. Die Reiter-Mechanik selbst (`lib/tabs`) bleibt
// im Entry, wo sie hingehört.
// ── W2·18 WELLE 2 PUNKT 5 · «EINEN WIMPERNSCHLAG SPÄTER» WAR EINE DRITTEL-
//    SEKUNDE, JEDES MAL AM ERSTEN RECHTSKLICK ────────────────────────────────
//
// GEMESSEN 13.9.2026, in der Seite (MutationObserver ab `contextmenu` bis
// `[role=menu]` im DOM; Chromium, vier Reiter):
//     gebautes dist/ (vite preview)   1. Rechtsklick 320 ms · 2. 10 ms · 3. 8 ms
//     Dev-Server                      1. Rechtsklick 728 ms · 2. 76 ms
// Das Menü ging also nicht verloren, es kam ZU SPÄT — und wer nach einer
// Drittelsekunde nichts sieht, klickt ein zweites Mal oder gibt auf.
//
// ZWEI URSACHEN, und die zweite ist die grössere:
//  (1) der Chunk wurde erst beim Klick angefordert (über eine echte Leitung
//      kostet das eine Rundreise, lokal nur ~6 ms);
//  (2) `React.lazy` + `Suspense` SUSPENDIERT auch dann, wenn das Modul längst
//      geladen ist: der erste Render ruft den Loader, bekommt ein — bereits
//      erfülltes — Versprechen und wirft es trotzdem; der Inhalt kommt erst im
//      Nachlauf. GEMESSEN blieb der erste Rechtsklick darum auch MIT
//      vorgeladenem Chunk bei 316 ms (gegen 322 ohne), während der zweite
//      10 ms brauchte. Die Differenz ist Reacts Nachlauf, nicht das Netz.
//
// DIE ANTWORT: kein `lazy`/`Suspense` mehr für diese eine Fläche, sondern der
// dynamische Import von Hand — das Ergebnis liegt im Zustand, und das Menü
// rendert im SELBEN Commit wie der Rechtsklick. Angefordert wird es, sobald
// jemand die Leiste betritt (Zeiger oder Fokus): zwischen Ankunft und Klick
// liegen beim Menschen Hunderte von Millisekunden.
// DAS START-BUDGET BLEIBT UNBERÜHRT (§15, Herleitung oben): der Chunk bleibt
// ein eigener (gemessen 923 B gzip), er wird nur früher angefordert; der
// Entry-Chunk misst weiterhin 54.9 KB gzip gegen 60.0 KB Budget.
// KOMMT DER RECHTSKLICK DOCH ZUERST (Touch, Shift+F10 ohne Vorlauf), bleibt
// `menue` gesetzt und das Menü öffnet, sobald das Modul da ist — es wird nicht
// verworfen.
let menueVorlauf: Promise<typeof import('./ReiterMenue')> | null = null;
/** Den Menü-Chunk anfordern (höchstens einmal je Seitenleben). */
const ladeMenue = (): Promise<typeof import('./ReiterMenue')> => (menueVorlauf ??= import('./ReiterMenue'));
import type { ReiterMenueEintrag } from './ReiterMenue';

// ── W2·18 WELLE 3 PUNKT 4 · DIE HOVER-KARTE KOMMT DENSELBEN WEG ────────────
// Wortgleiche Bauart wie beim Menü darüber, aus denselben zwei Gründen: der
// Chunk gehört nicht in den Start (§15), und `lazy`/`Suspense` käme einen
// Nachlauf zu spät. Angefordert wird auch sie beim Betreten der Leiste — die
// 600 ms, die die Karte ohnehin wartet, reichen dafür dreifach.
let karteVorlauf: Promise<typeof import('./reiterleiste/ReiterKarte')> | null = null;
const ladeKarte = (): Promise<typeof import('./reiterleiste/ReiterKarte')> =>
  (karteVorlauf ??= import('./reiterleiste/ReiterKarte'));

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
  // ── W2·18 WELLE 3 PUNKT 2 · DER RAND-SCHUB ───────────────────────────────
  // Was hier NICHT steht, ist Auto-Scroll: der Streifen scrollt GEMESSEN nie
  // (Herleitung und Messreihe in `reiterleiste/randschub.ts`). Am Rand schiebt
  // sich der gezogene Reiter stattdessen selbst durch die Speicherordnung,
  // einen Platz je Takt — so kommt er über die Fenstergrenze hinaus.
  const schub = useRef<{ seite: 'links' | 'rechts'; takt: number } | null>(null);
  /** Schwebt gerade ein Reiter über dem «+N»-Knopf? (Ablage, s. dort.) */
  const [ueberAblage, setUeberAblage] = useState(false);
  const stoppSchub = () => {
    if (!schub.current) return;
    window.clearInterval(schub.current.takt);
    schub.current = null;
  };
  const schubTakt = (links: boolean) => {
    const von = gezogen.current;
    if (!von) { stoppSchub(); return; }
    // FRISCH aus `lib/tabs`, nicht aus der Render-Ordnung: dieser Rückruf lebt
    // über viele Schübe hinweg und sähe sonst immer die erste Ordnung.
    const pfade = ladeTabs().map((t) => tabSchluessel(t.path));
    const ziel = schubZiel(pfade, tabSchluessel(von), links);
    // `null` = Anschlag. Der Takt läuft weiter (der Zeiger steht ja noch am
    // Rand), tut aber nichts — kein Umlauf ans andere Ende.
    if (ziel) ordneTabsUm(von, ziel.ziel, ziel.davor);
  };
  const beiRandZug = (ev: { clientX: number; currentTarget: HTMLElement }) => {
    if (!gezogen.current) return;
    const seite = randSeite(ev.clientX, ev.currentTarget.getBoundingClientRect());
    if (!seite) { stoppSchub(); return; }
    if (schub.current?.seite === seite) return;
    stoppSchub();
    const links = seite === 'links';
    schub.current = { seite, takt: window.setInterval(() => schubTakt(links), SCHUB_MS) };
  };
  // Ein Intervall, das einen Zug überlebt, ordnete später ohne Zutun um.
  useEffect(() => stoppSchub, []);

  // Reader-Labels (Gesetz/Entscheid) aus den ohnehin lazy ladbaren Manifesten —
  // Muster und Bedingung wörtlich aus der abgelösten `ReiterUebersicht`.
  //
  // M2 (6.9.2026): dasselbe Muster jetzt DREIMAL — Materialien tragen seit
  // `lib/tabs.istReiterPfad` einen eigenen Reiter, und ohne ihr Manifest hiesse
  // er «Material öffnen», also eine Aufforderung statt eines Namens
  // (Prüfbefund R11 #24). Die `brauchtX`-Bedingung bleibt die Eintrittskarte:
  // `/materialien/register.json` wird NUR geladen, wenn wirklich ein
  // Material-Reiter offen ist — kein dritter Download in der Kopfzone auf
  // Vorrat (§15; `check:perf-budget` misst es).
  //
  // ── W2·18 Punkt 2 · DER EFFEKT HÄNGT AM BEDARF, NICHT AN DER LISTE ────────
  // Die `brauchtX`-Ableitung stand IM Effekt, und der Effekt hing an `[tabs]`.
  // Weil `useTabs` bei jedem Ereignis ein neues Array lieferte, lief er
  // dauernd — und legte bei jedem Lauf ein NEUES `manifeste`-Objekt ab, also
  // einen zweiten Render obendrauf und neue Prop-Identität für jeden Reiter.
  // GEMESSEN 13.9.2026 (20 Rad-Schritte auf /gesetze/bund/OR): 11 Läufe.
  // Der Bedarf selbst ändert sich dabei nie: ein wandernder `#art-…`-Anker
  // macht aus einem Gesetzes-Reiter keinen anderen Bedarf. Die Ableitung wohnt
  // darum jetzt in `lib/tabGruppen.manifestBedarf` (§3, dort auch die
  // §15-Herleitung der Material-Regel), und die Abhängigkeit sind die drei
  // Wahrheitswerte — stabile Primitive statt einer Array-Identität.
  const { gesetze: brauchtG, rechtsprechung: brauchtE, materialien: brauchtM } = manifestBedarf(tabs);
  useEffect(() => {
    if (!brauchtG && !brauchtE && !brauchtM) return;
    let lebt = true;
    void (async () => {
      const [g, ent, mat] = await Promise.all([
        brauchtG ? import('../../lib/normtext/browse').then((m) => m.ladeBrowseManifest()).catch(() => null) : Promise.resolve(null),
        brauchtE ? import('../../lib/rechtsprechung/browse').then((m) => m.ladeEntscheidManifest()).catch(() => null) : Promise.resolve(null),
        brauchtM ? import('../../lib/materialien/browse').then((m) => m.ladeMaterialManifest()).catch(() => null) : Promise.resolve(null),
      ]);
      if (lebt) setManifeste((alt) => ({
        gesetze: g ?? alt.gesetze ?? null,
        entscheide: ent ?? alt.entscheide ?? null,
        materialien: mat ?? alt.materialien ?? null,
      }));
    })();
    return () => { lebt = false; };
  }, [brauchtG, brauchtE, brauchtM]);

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

  // ── Tastatur (§5a Ziff. 7) ────────────────────────────────────────────────
  // Alt+1…9 springt auf den n-ten Reiter der sichtbaren Ordnung. Zum SCHLIESSEN
  // ist es Alt+W und NICHT Ctrl/⌘+W: der Browser fängt Ctrl/⌘+W selbst ab und
  // schliesst sein eigenes Fenster — eine Belegung, die man nicht bekommen
  // kann, wäre eine Zusage, die nicht gilt (§8). §5a Ziff. 7 sieht genau diesen
  // Rückfall vor. Kein Eingriff, solange der Fokus in einem Eingabefeld steht.
  //
  // ── W2·18 Punkt 1 · WELCHE TASTE, NICHT WELCHES ZEICHEN ───────────────────
  // Hier stand `e.key === 't' / 'w' / /^[1-9]$/`. macOS legt auf Option+Taste
  // ein Sonderzeichen («†», «∑», «¡»): am Mac war damit KEIN einziges dieser
  // Kürzel erreichbar, während Linux/CI grün blieb. Gelesen wird jetzt die
  // physische Taste (`reiterleiste/tasten`, dort die Herleitung); `e.key`
  // bleibt als zweiter Weg für fremde Belegungen. Die Kürzel, die Pfeile,
  // Bild↑/↓ und Tab betrifft das nicht — die tragen unter Option denselben
  // `key`.

  // ── D15 · UMORDNEN OHNE MAUS: Alt+Shift+←/→ ───────────────────────────────
  // Ziehen ist eine Zeigergeste; sie allein zu bauen hiesse, das Umordnen für
  // Tastatur und Screenreader gar nicht anzubieten (WCAG 2.1.1). Alt+Shift ist
  // frei — Alt+Ziffer und Alt+W belegen die Leiste schon, Alt+←/→ OHNE Shift
  // gehört dem Browser (Verlauf zurück/vorwärts). KEIN UMLAUF am Rand: ein
  // Reiter, der am linken Ende gedrückt plötzlich rechts steht, ist verloren
  // statt verschoben.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const strgTab = e.ctrlKey && !e.altKey && !e.metaKey && e.key === 'Tab';
      if (!e.altKey && !strgTab) return;
      const a = document.activeElement as HTMLElement | null;
      if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
      // ── R13-8 · ZYKLISCH BLÄTTERN ────────────────────────────────────────
      // Browser-Norm ist Ctrl+Tab / Ctrl+⇧+Tab, UMLAUFEND (anders als das
      // Umordnen mit Alt+⇧+←/→, das am Rand bewusst stehen bleibt: hier geht
      // nichts verloren, man kommt nur wieder vorn heraus).
      // GEMESSEN 7.9.2026: Ctrl+Tab bleibt im normalen Browserfenster wirkungs-
      // los — Chrome und Firefox fangen es für ihre EIGENEN Tabs ab, bevor die
      // Seite es sieht. Der Griff steht hier trotzdem (er kostet nichts und
      // wirkt dort, wo die Umgebung ihn durchlässt), ANGEBOTEN wird in der
      // Oberfläche aber nur das Paar, das man wirklich bekommt: Alt+Bild↑/↓
      // (§8 — keine Zusage, die nicht gilt).
      const blaettern = (vor: boolean) => {
        if (ordnung.length < 2) return;
        const idx = ordnung.findIndex((t) => tabSchluessel(t.path) === aktivSchluessel);
        const von = idx === -1 ? 0 : idx;
        const ziel = ordnung[(von + (vor ? 1 : ordnung.length - 1)) % ordnung.length];
        navigate(ziel.path);
      };
      if (strgTab) { e.preventDefault(); blaettern(!e.shiftKey); return; }
      if (e.key === 'PageDown' || e.key === 'PageUp') {
        e.preventDefault();
        blaettern(e.key === 'PageDown');
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const idx = ordnung.findIndex((t) => tabSchluessel(t.path) === aktivSchluessel);
        if (idx === -1) return;
        const links = e.key === 'ArrowLeft';
        const ziel = ordnung[idx + (links ? -1 : 1)];
        if (!ziel) { e.preventDefault(); return; }
        e.preventDefault();
        // W2·25: über die Zonengrenze meldet `ordneTabsUm` `false` und
        // schreibt nichts — die Taste steht dort still, genau wie am Rand der
        // Leiste. Dieselbe Wahl wie dort: kein Umlauf, keine Ausweichstelle.
        ordneTabsUm(ordnung[idx].path, ziel.path, links);
        return;
      }
      // ── M3 · ALT+SHIFT+T STELLT WIEDER HER ─────────────────────────────────
      // Browser-Idiom (dort Ctrl/⌘+Shift+T); Ctrl/⌘ fängt der Browser selbst
      // ab und stellt SEINEN Tab wieder her — dieselbe Lage wie bei Alt+W und
      // Alt+T, darum dieselbe Antwort: Alt statt Ctrl/⌘.
      if (e.shiftKey && istBuchstabenTaste(e, 't')) {
        e.preventDefault();
        stelleWiederHer();
        return;
      }
      if (e.shiftKey) return;
      // ── W2·18 WELLE 2 PUNKT 2 · ALT+Q PENDELT (zuletzt benutzt) ─────────
      //
      // WARUM Q, GEMESSEN/BELEGT 13.9.2026:
      //  · `Ctrl+Tab` wäre das Browser-Idiom — der Browser fängt es für seine
      //    EIGENEN Reiter ab (gemessen 7.9.2026, wirkungslos; der Griff steht
      //    oben trotzdem, angeboten wird er nicht, §8).
      //  · `Alt+Tab` gehört auf Windows/Linux dem Fenstermanager, `Cmd+Tab`
      //    auf macOS dem Dock — die Seite sieht sie gar nicht.
      //  · `Alt+Q` ist frei: in der App belegt Alt sonst nur T, W, 1…9, ⇧+T,
      //    ⇧+←/→ und Bild↑/↓ (Vollerhebung `altKey` über `src/`, 13.9.2026 —
      //    ausser der Leiste liest nur `HeaderSuche` Alt, und zwar am KLICK),
      //    und die Alt-Belegungen der Browser (←/→ Verlauf, Home, D, F/E)
      //    lassen Q aus. GEMESSEN (Chromium, `keydown`-Mitschrift): Alt+Q
      //    kommt als `code: 'KeyQ'`, `altKey: true`, `defaultPrevented: false`
      //    an der Seite an — kein Browser-Griff liegt davor.
      //  · macOS legt auf Option+Buchstabe ein SONDERZEICHEN (Option+Q = «œ»,
      //    dieselbe Klasse wie die gemessenen †/∑/¡ aus Welle 1). Gelesen wird
      //    darum die PHYSISCHE Taste — `istBuchstabenTaste` prüft `e.code`
      //    zuerst (`reiterleiste/tasten.ts`, dort die Herleitung). Der
      //    «œ»-Konflikt ist damit konstruktiv ausgeschlossen, nicht gehofft.
      if (istBuchstabenTaste(e, 'q')) {
        const ziel = vorherigerReiter(ordnung, aktivSchluessel);
        // Kein Ziel = frischer Start oder alles Gemerkte geschlossen: dann tut
        // die Taste NICHTS, statt irgendwohin zu springen (§8).
        if (!ziel) return;
        e.preventDefault();
        navigate(ziel.path);
        return;
      }
      // ── R13-8 · ALT+9 IST DER LETZTE REITER, NICHT DER NEUNTE ───────────
      // Browser-Norm (Chrome, Firefox, Safari): die 9 springt ans ENDE. Vorher
      // war sie schlicht der neunte — bei 15 Reitern war #10 und alles dahinter
      // per Tastatur unerreichbar (GEMESSEN 7.9.2026).
      const n = zifferTaste(e);
      if (n !== null) {
        const ziel = n === 9 ? ordnung[ordnung.length - 1] : ordnung[n - 1];
        if (!ziel) return;
        e.preventDefault();
        navigate(ziel.path);
        return;
      }
      if (istBuchstabenTaste(e, 'w')) {
        const aktiv = ordnung.find((t) => tabSchluessel(t.path) === aktivSchluessel);
        if (!aktiv) return;
        e.preventDefault();
        schliessen(aktiv.path);
        return;
      }
      // ── D19 · NEUER REITER OHNE MAUS: Alt+T ─────────────────────────────────
      // Ctrl/⌘+T wäre die Browser-Erwartung, aber der Browser fängt sie selbst
      // ab und öffnet sein EIGENES Fenster (dieselbe Lage wie beim Schliessen,
      // Alt+W statt Ctrl/⌘+W oben) — eine Zusage, die man nicht bekommen kann.
      if (istBuchstabenTaste(e, 't')) {
        e.preventDefault();
        neuerReiter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  // ── R10-BEFUND (Nullprobe 6.9.2026) · DIE HÖHE STEHT VOR DEN REITERN ──────
  //
  // Hier stand `if (tabs.length < 1) return null` — «keine Reiter, keine
  // Zeile». GEMESSEN am Stand `0093fad28` (Preview, `/rechner/tagerechner`,
  // ganzer Spec-Lauf `ics-export-z1` A9): der Prerender kennt keinen Speicher,
  // lieferte also KEINE Leiste; unmittelbar nach der Hydration las `useTabs`
  // den `localStorage`, die Leiste erschien, und `main#inhalt` rutschte von
  // 132 px auf 166 px — 34 px = genau `--app-reiter-h`, CLS 0.025 auf einer
  // Seite, die sonst 0 misst (§15). Der WURZEL-FIX bleibt: die Zeile ist immer
  // da und immer gleich hoch (`sticky top-[--app-krone-h]`, `h-[--app-reiter-h]`),
  // ob mit oder ohne Reiter — der Wechsel verschiebt nichts.
  //
  // ── D19-NACHTRAG (6.9.2026) · KEIN STUMMER PLATZHALTER MEHR ────────────────
  // Bis hierher stand an dieser Stelle bei 0 Reitern EIN `aria-hidden`-`<div>`
  // ohne `<nav>` — eine Navigations-Landmark ohne ein einziges Ziel wäre für
  // den Screenreader ein leeres Versprechen gewesen. Seit dem «+»-Knopf
  // (unten im Streifen) gibt es aber IMMER ein Ziel, auch bei 0 Reitern: den
  // Browser-«+», mit dem man den ERSTEN Reiter überhaupt anlegt. Der frühere
  // Sonderpfad ist darum ersatzlos gestrichen (§17-Gegengewicht) — dieselbe
  // `<nav>` trägt jetzt beide Fälle, `sichtbar`/`ordnung` sind bei 0 Reitern
  // schlicht leer und rendern keinen Reiter, keinen Überlauf-Knopf.

  const gefiltert = suche.trim()
    ? tabs.filter((t) => `${reiterKurzformText(t, manifeste)} ${verlaufLabel(t.path, manifeste)} ${t.path}`
        .toLowerCase().includes(suche.trim().toLowerCase()))
    : tabs;

  const ueberlaufZahl = versteckt.length;
  const blattTitel = ueberlaufZahl > 0 ? `+${ueberlaufZahl}` : `${tabs.length} offen`;

  // ── M4 · WAS IM KONTEXTMENÜ EINES REITERS STEHT ───────────────────────────
  //
  // Die Fläche zeichnet `ReiterMenue`; WELCHE Einträge es gibt und was sie tun,
  // steht hier — und rechnen tut es `lib/tabs` (§3). Jeder Eintrag erscheint
  // nur, wenn er auch etwas bewirkt: kein «Daneben öffnen» ohne freies
  // Fenster, kein «Rechts davon schliessen» am letzten Reiter, kein «Zuletzt
  // geschlossen» bei leerem Ring. Ein Menüeintrag, der nichts tut, ist eine
  // Zusage, die nicht gilt (§8).
  const menueEintraege = (t: TabEintrag): ReiterMenueEintrag[] => {
    const idx = ordnung.findIndex((x) => tabSchluessel(x.path) === tabSchluessel(t.path));
    // W2·25: was «rechts davon» wirklich schliesst, sind die FREIEN Reiter
    // rechts davon — angeheftete überleben die Geste (`lib/tabs`). Der Zähler
    // am Menüeintrag zählt darum dasselbe, was die Geste tut (§8).
    const rechts = idx >= 0 ? ordnung.slice(idx + 1).filter((x) => !x.fest) : [];
    // ── W2·25 · DIE ZONE, IN DER DIESER REITER SICH BEWEGEN DARF ───────────
    // Angeheftete Reiter bewegen sich innerhalb der festen Zone, freie
    // innerhalb der freien. Gezeigt wird nur, was auch WIRKT — dieselbe Regel,
    // nach der am ersten Reiter «Nach links» fehlt (§8); sie bekommt mit dem
    // Anheften bloss eine zweite Grenze.
    const zone = festeZone(ordnung);
    const vonIdx = t.fest ? 0 : zone;
    const bisIdx = (t.fest ? zone : ordnung.length) - 1;
    const wieder = letzterGeschlossener();
    const e: ReiterMenueEintrag[] = [];
    if (kannOeffnen && !istOffen(t.path)) {
      e.push({ id: 'daneben', label: 'Daneben öffnen', onKlick: () => oeffneDaneben(t.path) });
    }
    // «Duplizieren» ist der Klick-Weg zur ZWEITEN INSTANZ desselben Dokuments
    // (`?r=<n>`) — dieselbe Buchführung, die der Leser-Knopf bis M8 benutzt
    // hat. Die Funktion geht damit nicht verloren, sie steht jetzt an jedem
    // Reiter statt nur im Erlass-Kopf.
    e.push({ id: 'duplizieren', label: 'Duplizieren', onKlick: () => {
      const ziel = naechsteInstanz(t.path);
      merkeTab(ziel, t.label);
      navigate(ziel);
    } });
    // ── R13-9 · «ADRESSE KOPIEREN» (Prüfbefund 7.9.2026) ────────────────────
    // Das Kontextmenü eines Browser-Tabs trägt sie; die App kann sie (der
    // `LinkTeilenButton` tut dasselbe an anderer Stelle), das Reiter-Menü bot
    // sie nicht an. EIN Klick, kein neuer Zustand. Der Eintrag erscheint nur,
    // wo die Zwischenablage überhaupt zu haben ist (§8: kein toter Eintrag) —
    // `navigator.clipboard` fehlt in unsicheren Kontexten.
    // EINE KOPIER-MECHANIK (R4-D): geschrieben wird über `useKopieren`, nicht
    // von Hand — der Hook quittiert erst NACH erfolgreichem Schreiben und
    // schluckt weder verweigerte Berechtigung noch fehlende API als Erfolg.
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      e.push({ id: 'adresse', label: 'Adresse kopieren',
        onKlick: () => kopieren(new URL(t.path, window.location.origin).href) });
    }
    // ── W2·18 WELLE 3 PUNKT 5 · UMORDNEN OHNE MAUS ──────────────────────────
    // GEMESSEN am Vorstand (13.9.2026): die Reihenfolge liess sich NUR per
    // HTML5-Drag (Zeiger) oder Alt+⇧+←/→ (Tastatur mit Alt-Taste) ändern. Auf
    // einem Tablet gab es gar keinen Weg — der Finger kennt kein HTML5-Drag.
    // Vier Einträge in dem Menü, das ohnehin da ist, lösen das ohne eine
    // einzige neue Geste; erreichbar per Rechtsklick, Shift+F10 UND Langdruck
    // (`reiterleiste/Reiter.tsx`).
    // Gezeigt wird nur, was auch WIRKT: am ersten Reiter gibt es kein «nach
    // links» (§8 — ein Eintrag, der nichts tut, ist eine Zusage, die nicht
    // gilt). Die Kürzel stehen daneben, weil das Menü der Ort ist, an dem man
    // sie lernt (R13-7).
    if (idx > vonIdx) {
      e.push({ id: 'links-um', label: 'Nach links', rechts: 'Alt+⇧+←',
        onKlick: () => ordneTabsUm(t.path, ordnung[idx - 1].path, true) });
    }
    if (idx >= 0 && idx < bisIdx) {
      e.push({ id: 'rechts-um', label: 'Nach rechts', rechts: 'Alt+⇧+→',
        onKlick: () => ordneTabsUm(t.path, ordnung[idx + 1].path, false) });
    }
    if (idx > vonIdx) {
      // W2·25: «An den Anfang» heisst den Anfang der EIGENEN Zone — für einen
      // freien Reiter also hinter die angehefteten, nicht vor sie. Der Eintrag
      // rückt damit nie über eine Grenze, die das Ziehen daneben ablehnt.
      e.push({ id: 'anfang', label: 'An den Anfang',
        onKlick: () => ordneTabsUm(t.path, ordnung[vonIdx].path, true) });
    }
    if (idx >= 0 && idx < bisIdx) {
      e.push({ id: 'ende', label: 'Ans Ende',
        onKlick: () => ordneTabsUm(t.path, ordnung[bisIdx].path, false) });
    }
    // ── W2·25 · ANHEFTEN / LÖSEN (Spec §7 Teil 1, §5a Ziff. 5) ─────────────
    // Der einzige Weg zu beiden — und für einen angehefteten Reiter zugleich
    // der einzige Weg zum Schliessen (sein ✕ ist bewusst weg,
    // `reiterleiste/Reiter.tsx`). Darum steht «Lösen» VOR den Schliess-Zeilen:
    // wer einen festen Reiter loswerden will, will ihn meist nur befreien.
    e.push(t.fest
      ? { id: 'loesen', label: 'Lösen', onKlick: () => loeseAb(t.path) }
      : { id: 'anheften', label: 'Anheften', onKlick: () => hefteAn(t.path) });
    // W2·25: «alle anderen» schliesst nur die FREIEN anderen — gibt es keine,
    // täte der Eintrag nichts und erscheint darum nicht (§8, dieselbe Regel
    // wie an den Rändern oben).
    if (ordnung.some((x) => !x.fest && tabSchluessel(x.path) !== tabSchluessel(t.path))) {
      e.push({ id: 'andere', label: 'Alle anderen schliessen', onKlick: () => {
        for (const x of ordnung) if (!x.fest && tabSchluessel(x.path) !== tabSchluessel(t.path)) schliessePane(x.path);
        schliesseAndere(t.path);
        navigate(t.path);
      } });
    }
    if (rechts.length > 0) {
      e.push({ id: 'rechts', label: 'Rechts davon schliessen', rechts: String(rechts.length), onKlick: () => {
        for (const x of rechts) schliessePane(x.path);
        schliesseRechtsVon(t.path);
        if (rechts.some((x) => tabSchluessel(x.path) === aktivSchluessel)) navigate(t.path);
      } });
    }
    // W2·25: sind ALLE offenen Reiter angeheftet, schlösse «Alle schliessen»
    // nichts — kein toter Eintrag (§8).
    if (ordnung.some((x) => !x.fest)) {
      e.push({ id: 'alle', label: 'Alle schliessen', onKlick: alleSchliessen });
    }
    // KEINE ✕-Marke: das Schliess-Glyph kommt in dieser App aus genau EINEM
    // Baustein (`ui/SchliessKnopf`, A3-1) — eine Menüzeile, die es selbst
    // zeichnet, wäre die zweite Stelle (Wächter `design-r3b-chrome`).
    e.push({ id: 'schliessen', label: 'Schliessen', rechts: 'Alt+W', onKlick: () => schliessen(t.path) });
    if (wieder) {
      // EIN WORT FÜR EINE SACHE (Ä118-Lehre): dieselbe Zeile steht auch im
      // Überlauf-Blatt, darum derselbe Wortlaut. GEMESSEN 6.9.2026 (Screen
      // `r11-kontextmenue-1440-hell`, zweiter Lauf): «Zuletzt geschlossen:
      // ZGB» brach im Menü hinter dem Doppelpunkt ab — der Name, also gerade
      // das Nützliche, fiel weg. «Wieder öffnen: ZGB» stellt die Tätigkeit
      // nach vorn und trägt den Namen ganz.
      e.push({ id: 'wieder', label: `Wieder öffnen: ${reiterKurzformText(wieder, manifeste)}`,
        rechts: 'Alt+⇧+T', onKlick: stelleWiederHer });
    }
    return e;
  };

  // ── R13-5 · DAS MENÜ DES LEERRAUMS (Prüfbefund 7.9.2026) ──────────────────
  //
  // GEMESSEN: nach dem Schliessen des LETZTEN Reiters standen 0 Reiter, der
  // Ring hielt 3 Einträge — und der Rechtsklick auf den Leerraum ergab
  // `[role=menu]` = 0 (das Browser-Menü). Zurück kam man nur mit Alt+⇧+T; mit
  // der Maus gar nicht. Das ist genau der Moment, in dem man die Rückfahrkarte
  // braucht, und genau die Stelle, an der der Browser sie anbietet.
  const leerraumEintraege = (): ReiterMenueEintrag[] => {
    const wieder = letzterGeschlossener();
    const e: ReiterMenueEintrag[] = [
      { id: 'neu', label: 'Neuer Reiter', rechts: 'Alt+T', onKlick: neuerReiter },
    ];
    // EIN WORT FÜR EINE SACHE (Ä118): derselbe Wortlaut wie im Reiter-Menü und
    // im Blatt.
    if (wieder) {
      e.push({ id: 'wieder', label: `Wieder öffnen: ${reiterKurzformText(wieder, manifeste)}`,
        rechts: 'Alt+⇧+T', onKlick: stelleWiederHer });
    }
    // W2·25: dieselbe Bedingung wie im Reiter-Menü — angeheftete Reiter
    // schliesst die Geste nicht, also zählt nur der freie Bestand.
    if (tabs.some((t) => !t.fest)) e.push({ id: 'alle', label: 'Alle schliessen', onKlick: alleSchliessen });
    return e;
  };

  /** ── R14b (Nachzug 7.9.2026) · DEN 0-REITER-ZUSTAND GIBT ES NICHT MEHR ────
   *
   *  Hier stand `const leer = tabs.length === 0;` und trug vier Zweige: das
   *  Mess-Attribut `data-reiter-leer`, den Unterstrich, die Trennkante des
   *  Streifens und den ausgeblendeten Blatt-Knopf. R2 hatte sie für die
   *  Startseite gebaut, R14 hat «/» und den letzten ✕ herausgenommen, R14b
   *  jetzt die letzten fünf Routen (/ueber, /methodik, /einstellungen,
   *  /kontakt, /datenschutz): seit `lib/tabs` keine Route mehr ausnimmt, legt
   *  `components/TabTracker.tsx` auf JEDER Adresse einen Reiter an — die
   *  Leiste steht nie leer, und ein Zweig, der nicht mehr scheitern kann, wird
   *  gestrichen statt bewacht (§17-Gegengewicht).
   *  Die GEOMETRIE-Zusagen von R2/R13B bleiben unangetastet: die Höhe ist
   *  weiter fest reserviert (`--app-reiter-h`), der Unterstrich liegt weiter
   *  absolut auf statt als `border-b` im Fluss (`borderBottomWidth: 0px`), und
   *  «+» wie Blatt-Knopf haben weiter ihren festen Platz. */

  /** Der Browser-«+» (D19). `solo` = die Fassung ohne Reiter: keine linke
   *  Trennkante, weil links von ihm nichts steht, das zu trennen wäre.
   *
   *  ── R13B (Prüfbefund PR #743 §8 b + Fixer D34, 7.9.2026) · EIN PLATZ ─────
   *  Bis hierher gab es ZWEI Aufrufstellen: `{leer && plusKnopf(true)}` VOR dem
   *  Streifen und `{!leer && plusKnopf(false)}` DAHINTER. Der erste Reiter liess
   *  das «+» damit die Seite wechseln — GEMESSEN am Stand `cfa8a9f81` (gebautes
   *  dist/, Preview 4429, Chromium @1280, `/` → `/gesetze/bund/ZGB`):
   *  «+» x 24 → 1140, der Streifen x 60|1196 → 24|1116, Layout-Shift 0.000944
   *  (input-frei, Quelle `DIV.relative.flex.min-w-0` in dieser Datei).
   *  Das ist der Befund «das führende + fällt beim ersten Reiter weg».
   *
   *  JETZT: EINE Aufrufstelle, und zwar die LINKE. Die Wahl ist nicht frei —
   *  die Bestandssonde R2 (`e2e/w224-r11-reiterleiste.e2e.ts:345`, «+ am linken
   *  Inhaltsrand») misst genau diesen Platz im leeren Fall und bleibt
   *  unverändert (§6.3). Ein «+» am ENDE hätte sie rot gemacht; ein zweiter,
   *  unsichtbarer Platzhalter links hätte den Reitern dauerhaft 36 px Leerraum
   *  vorgeschoben. Bleibt der eine linke Platz: er erfüllt R2 in BEIDEN
   *  Zuständen, kostet keinen Raum und bewegt sich nie.
   *  WAS SICH DAMIT ÄNDERT (offen für Davids Entscheid): das Vorbild aus D19
   *  («analog zum browser») setzt das «+» hinter den letzten Reiter. Seine
   *  FUNKTION ist unberührt — Klick und Alt+T legen weiter einen neuen Reiter
   *  an —, nur seine Seite ist jetzt links statt rechts.
   *  `solo` heisst darum nicht mehr «ohne Reiter», sondern «ganz links, es steht
   *  nichts links davon, das zu trennen wäre» — und das gilt immer. Die
   *  Trennung zu den Reitern trägt jetzt der Streifen (`border-l`, unten). */
  const plusKnopf = () => (
    <button type="button" onClick={neuerReiter}
      aria-label="Neuer Reiter" title="Neuer Reiter (Alt+T)"
      className="rl-plus rl-plus-solo">
      <span aria-hidden className="lc-griff-glyph">+</span>
    </button>
  );

  return (
    <nav aria-label="Offene Reiter" ref={leisteRef}
      // W2·18 Welle 2 Punkt 5 · Vorlauf für das Kontextmenü (Herleitung oben).
      // ZWEI Wege hinein, beide zählen als Absicht: der Zeiger betritt die
      // Leiste (`pointerenter` — einmal, nicht bei jedem Reiterwechsel, weil
      // er am `nav` hängt und nicht am Reiter) und der Fokus kommt herein
      // (`focus` steigt hier als `focusin` an; ohne ihn hätte der
      // Tastaturweg Shift+F10 keinen Vorlauf).
      onPointerEnter={() => { holeMenue(); holeKarte(); }}
      onFocus={() => { holeMenue(); holeKarte(); }}
      // W2·24-R4: die Arbeitsleiste KLEBT jetzt — unter der Titelblatt-Zeile
      // (`--app-krone-h`) und mit ihrer eigenen, festen Höhe (`--app-reiter-h`).
      // Beide Zahlen stehen in `src/index.css`; dieselbe Summe (`--app-kopf-h`)
      // liest `pages/gesetz-leser/v3/leserGeometrie.ts` für den Kopf-Anschlag
      // und `--nt-stick`. R2 hatte die Leiste bewusst im Fluss gelassen, weil
      // diese eine Quelle fehlte (R2-Protokoll §2) — ohne sie landete jeder
      // `#art-…`-Sprung um die Leistenhöhe zu hoch.
      // ── R2 (Prüfbefund R11, 6.9.2026) · KEIN STRICH UNTER DEM NICHTS ──────
      // GEMESSEN auf «/» (Startseite, die nach D7 bewusst keinen Reiter
      // erzeugt): ein 34 px hoher, leerer Streifen mit einem durchgehenden
      // Unterstrich über die volle Breite — eine Trennlinie, die nichts trennt.
      // Der Unterstrich fällt weg, solange kein Reiter da ist; die HÖHE bleibt
      // reserviert (`h-[var(--app-reiter-h)]`, box-border: der 1-px-Rahmen
      // liegt INNEN), damit der Inhalt beim ersten Reiter nicht springt —
      // CLS 0, bewacht in `e2e/w224-r11-reiterleiste.e2e.ts`.
      className="print:hidden shrink-0 sticky top-[var(--app-krone-h)] z-leiste h-[var(--app-reiter-h)] bg-paper">
      {/* ── R13B (7.9.2026) · DER UNTERSTRICH LIEGT AUF, NICHT IM FLUSS ──────
          R2 wollte «kein Strich unter dem Nichts» und hat ihn als `border-b`
          an-/abgeschaltet. Ein Rahmen ist aber Geometrie: box-border zieht er
          1 px aus der INNENhöhe, die Zeile darin sass mit und ohne Reiter
          verschieden hoch. Als absolut liegende 1-px-Linie sagt er dasselbe,
          ohne dass die Leiste ihre Masse ändert — `borderBottomWidth` bleibt
          in BEIDEN Zuständen `0px` (das misst R2). */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-rule-soft" />
      {/* ── R13B (7.9.2026) · DIE ZEILE HAT IHRE HÖHE AUS SICH SELBST ────────
          GEMESSEN am Stand `cfa8a9f81`: der Streifen mass OHNE Reiter 16 px,
          MIT dem ersten 33 px — seine Höhe kam allein aus dem Inhalt, den er
          im leeren Fall nicht hat. `h-full` bindet sie an die feste Leistenhöhe
          des `<nav>` (`--app-reiter-h`), die R2 schon reserviert hatte; damit
          stehen «+» und Blatt (beide `items-stretch`/`self-center`) vom ersten
          Bild an auf ihrer Endhöhe. */}
      <div className="flex h-full items-stretch px-4 sm:px-6">
        {/* R2 · DAS «+» STEHT LINKS, AM INHALTSRAND. «Im Browser beginnt die
            Leiste dort, wo der Inhalt beginnt — ein «+», das ganz rechts im
            Leeren klebt, findet niemand.» R13B (7.9.2026) macht daraus den
            EINZIGEN Platz: mit und ohne Reiter derselbe, damit der erste Reiter
            ihn nicht mehr die Seite wechseln lässt (Herleitung bei
            `plusKnopf`). */}
        {plusKnopf()}
        {/* M6 · DOPPELKLICK AUF DEN LEERRAUM = NEUER REITER (Befund #34).
            GEMESSEN 6.9.2026: 457 px ungenutzte Fläche rechts des letzten
            Reiters — im Browser genau die Stelle, auf die man doppelklickt.
            `ev.target === ev.currentTarget` ist die ganze Bedingung: ein
            Doppelklick AUF einem Reiter steigt hierher auf und darf keinen
            zweiten Reiter erzeugen (Risiko aus dem Plan). */}
        <div ref={streifenRef} data-reiter-streifen
          // Mess-Anker für die Sonden (R13): «ab welchem Reiter / wie viele /
          // von wie vielen». Die Zahlen sind das, was `useReiterFenster`
          // ausgerechnet hat — im DOM nachlesbar, statt aus Breiten erraten.
          data-reiter-fenster={`${start}/${anzahl}/${ordnung.length}`}
          onDoubleClick={(ev) => { if (ev.target === ev.currentTarget) neuerReiter(); }}
          // W2·18 Welle 2 Punkt 1 · Pfeiltasten/Home/End/Delete. AM STREIFEN,
          // nicht am einzelnen Reiter: welcher der Nachbar ist, weiss nur die
          // Leiste (§3) — und ein Zuhörer statt N spart N−1 Verdrahtungen.
          onKeyDown={onStreifenTaste}
          // W2·18 Welle 3 Punkt 2: der Schub hört AM STREIFEN zu, nicht am
          // einzelnen Reiter — die Randzone gehört dem Streifen, und während
          // des Schubs wechselt der Reiter unter dem Zeiger ohnehin.
          onDragOver={beiRandZug}
          onDrop={stoppSchub}
          onDragEnd={stoppSchub}
          onDragLeave={(ev) => { if (ev.target === ev.currentTarget) stoppSchub(); }}
          // R13-5 · Rechtsklick NUR auf der freien Fläche (dieselbe Bedingung
          // wie beim Doppelklick daneben): über einem Reiter gilt dessen
          // eigenes Menü, über allem anderen bleibt das Browser-Menü.
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
                // W2·25: die Ordnung hält die Leiste, die Regel `lib/tabs` —
                // der Reiter fragt nur, was er unter dem Zeiger zeichnen soll.
                pruefeZug={(von, nach, davor) => zugErlaubt(ordnung, von, nach, davor)} />
            );
          })}
        </div>
        {/* D19 · BROWSER-«+» AM ENDE DES STREIFENS — fest, nicht Teil der
            scrollenden Reiter-Fläche (das Vorbild wandert beim Scrollen der
            Reiter nicht mit weg). `.rl-plus` trägt nur Breite/Zentrierung/
            Hover (index.css); die 34-px-Höhe kommt aus `items-stretch` des
            Elternflusses, ohne eigene Höhen-Angabe. */}

        {/* «+N» bzw. «N offen» — EIN Blatt für Überlauf (Desktop) und die
            schmale Ansicht (§5a Ziff. 5 + 8). Inhalt ist die gruppierte Liste
            `TabPanel`, also genau das, was das abgelöste ☰-Flyout zeigte,
            zusätzlich mit Suchfeld. */}
        {/* ── R13-1 · DER KNOPF STEHT IMMER, UND IMMER GLEICH BREIT ────────
            Er erschien bis R13 erst BEI Überlauf (und ab md nur dann). Genau
            das war die Ursache des R13-1-Befundes: der Knopf verschmälerte den
            Streifen um ~58 px, NACHDEM die Leiste gerechnet hatte — der aktive
            Reiter stand danach angeschnitten am Rand.
            Und es ist zugleich eine RÜCKKOPPLUNG: die gemessene Überlauf-Zahl
            (R13-2) entscheidet über den Knopf, der Knopf über die Breite, die
            Breite wieder über die Zahl. GEMESSEN 7.9.2026 @1024 mit 8 Reitern:
            React-Fehler #185 («Maximum update depth exceeded»), die Leiste
            verschwand ganz. Ein fester Platz bricht den Kreis: die Breite des
            Streifens hängt nicht mehr davon ab, wie viele Reiter hineinpassen.
            FESTE Breite, nicht nur eine Mindestbreite: die Aufschrift wechselt
            zwischen «8 offen» und «+2», und GEMESSEN 7.9.2026 reichte allein
            dieser Textwechsel, um den Kreis am Leben zu halten (React #185
            blieb). Ein Kasten mit fester Breite hat keine Meinung zu seinem
            Inhalt — erst damit ist der Streifen wirklich unabhängig. */}
        {/* ── R13B (7.9.2026) · DER PLATZ GILT AUCH FÜR DAS NICHTS ────────────
            R13-1 (oben) hat den Knopf schon vom Überlauf gelöst; am `leer`-Fall
            hing er weiter (R14b hat den Fall selbst gestrichen — der feste
            Platz bleibt, er war nie nur für ihn da). GEMESSEN am Stand `cfa8a9f81` (@1280, `/` →
            `/gesetze/bund/ZGB`): mit dem ersten Reiter erschien der Knopf und
            nahm dem `flex-1`-Streifen 4.5rem + `ml-2` weg — das «+» rechts davon
            rückte mit. Derselbe Kreis, denselben Schritt weitergedacht: der
            Kasten steht IMMER, mit `visibility` statt Mount/Unmount, und ist
            ohne Reiter aus Bedienung und Vorlesereihenfolge genommen
            (`invisible` + `aria-hidden` + `disabled` + `tabIndex={-1}`) — was
            R2 wollte («kein Knopf über dem Nichts»), ohne dass die Geometrie
            der Leiste davon abhängt. */}
        {/* ── W2·18 WELLE 3 PUNKT 2 · DER KNOPF IST AUCH EINE ABLAGE ────────
            «+N» ist der sichtbare Ort des Restes. Wer einen Reiter darauf
            fallen lässt, meint «den brauche ich jetzt nicht im Bild» — also
            ans ENDE der Ordnung, womit er als erster ins Blatt rutscht.
            Umgeordnet, nicht geschlossen: der Reiter bleibt offen, nur nicht
            mehr vorn (ein Drop, der etwas wegwirft, wäre eine destruktive
            Geste ohne Rückfrage, A3-1).
            Der Rahmen zeigt die Ablage an, solange etwas darüber schwebt —
            ohne diese Rückmeldung wäre es eine Funktion, die man nur findet,
            wenn man sie schon kennt (D15). */}
        <button ref={triggerRef} type="button"
          aria-haspopup="dialog" aria-expanded={blattOffen}
          aria-label={`Alle ${tabs.length} offenen Reiter`}
          title="Alle offenen Reiter"
          onClick={() => setBlatt((z) => (z.offen ? BLATT_ZU : { offen: true, suche: '' }))}
          onDragOver={(ev) => {
            const von = gezogen.current;
            if (!von) return;
            ev.preventDefault();
            stoppSchub();
            // W2·25: ein ANGEHEFTETER Reiter kann nicht ans Ende abgelegt
            // werden — dort beginnt die freie Zone. Der Rahmen erscheint dann
            // gar nicht erst, und der Zeiger trägt das «kein Zutritt» des
            // Browsers (dieselbe Auskunft wie an der Marke, nur hier).
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

      {/* M4 · das Kontextmenü des angeklickten Reiters. Ein Menü zur Zeit —
          `menue` hält den Reiter, nicht der Reiter das Menü (sonst stünden bei
          zwölf Reitern zwölf Portale bereit). */}
      {menue && MenueFlaeche && menue.path === null && (
        <MenueFlaeche x={menue.x} y={menue.y} name="Offene Reiter"
          eintraege={leerraumEintraege()} onSchliessen={() => setMenue(null)} />
      )}
      {menue && MenueFlaeche && menue.path !== null && (() => {
        const pfad = menue.path;
        const t = tabs.find((x) => tabSchluessel(x.path) === tabSchluessel(pfad));
        if (!t) return null;
        return (
          <MenueFlaeche x={menue.x} y={menue.y} name={reiterKurzformText(t, manifeste)}
            eintraege={menueEintraege(t)} onSchliessen={() => setMenue(null)} />
        );
      })()}

      {/* W2·18 Welle 3 Punkt 4 · die Hover-Karte des gezeigten Reiters. EINE
          zur Zeit, aus denselben Gründen wie beim Menü. */}
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
