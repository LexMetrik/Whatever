import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { setzeBezugKantone, setzeBezugKlassen, setzeBezugZeit, useBezugKantone, useBezugKlassen } from '../leserOptionen';
import type { BestimmungsWort } from './erlassAnsicht';
import { LeserPanel } from './LeserPanel';
import { PanelEntscheide } from './PanelEntscheide';
import { usePanelTafeln } from './PanelTafeln';
import { OEFFNER_SELEKTOR, type PanelBezuege, type PanelZustand } from './panelModell';
import { usePopoverAutoZu } from './usePopoverAutoZu';
import { blattFlaeche } from './blattFlaeche';
import { useWischZu, useZurueckSchliesst } from './blattGesten';
import { BlattVerweise, type BlattArtikel } from './BlattArtikel';

// ─── WO das Panel steht (H3, Kap. 4d) ────────────────────────────────────────
//
// ═══ ENTSCHEID A (David 24.9.2026) · `'spalte'` IST ZURÜCK, `'rechts'` FÄLLT ═
// Ab 1024 px (Einzelansicht) ist das offene Blatt eine eigene Spur rechts der
// Lese-Zelle, zu eine Schiene (`./rahmenSpalten`, Dateikopf). Die Überlagerung
// `'rechts'` (D33) samt Fensterrand-Kante (D-1, `useFensterRand`) ist
// zurückgebaut; darunter bleibt `'unten'` wie beschrieben. Die Blöcke D33, Ä52
// und D42 unten sind Belege ihres Datums (§0 Ziff. 2b); was sie über `'rechts'`
// sagen, gilt seither für `'spalte'` (nicht modal, kein Scrim, keine Falle).
//
// ═══ D33 (David 7.9.2026) · DIE DRITTE GESTALT `'spalte'` IST GESTRICHEN ═════
// Sie war die eigene 22-rem-Spur neben dem Text (Ä60 (c), 17.8.2026) und hat
// genau das getan, was sie verhindern sollte: weil der RAHMEN für sie wuchs,
// sprang beim Öffnen die ganze Seite. Gemessen 7.9.2026 @1440 (OR): Lesespalte
// x 492 → 404, Breite 764 → 640, der geklickte Knopf x 1075 → 1253; @1024 fiel
// die Gliederungsspalte ganz aus dem DOM. Herleitung, David-Entscheid und die
// verworfenen Varianten B/C stehen in `./rahmenSpalten` am Dateikopf.
// Geblieben sind ZWEI Gestalten — und `'rechts'` trägt seither jede
// Desktop-Breite, nicht nur die engen:
//
//   'rechts'  D, Einzelansicht — 22 rem (seit W2·29 S5: 380 px) am rechten Rand, NICHT
//             modal. Der Lesetext links bleibt sichtbar UND bedienbar; das
//             Panel ist Beiwerk und verhält sich auch so (Ä52, s. u.).
//   'unten'   H und jedes Pane — Bottom-Sheet. Es reicht von der Unterkante nach
//             oben und lässt den Artikel darüber stehen (Ä55).
//             «modal» stand hier bis D42 (7.9.2026) und galt für BEIDE Orte;
//             seither nur noch für H (Einzelansicht) — im Pane ist dasselbe
//             Blatt Beiwerk. Herleitung bei der Ableitung `modal` unten.
//
// UNBERÜHRT bleibt die harte Regel «NIE drei vertikale Flächen» im geteilten
// Fenster (Design-Grundlage Kap. 8 Nr. 8, ausdrücklich «im Split-View»): im
// Pane ist die Gestalt weiterhin ausnahmslos `'unten'`.
//
// ═══ Ä52 (H3-Nachzug) · DAS BLATT DECKTE DEN KOPF, DEN ES BEDIENT ════════════
// Gemessen 17.8.2026: das Blatt begann auf D bei `top: var(--leser-kopf-h)` =
// **y 100**, der V3-Kopf liegt bei **y 100–159**. Es lag also über der Kopfzeile
// samt Öffner, «Ansicht ▾» und ✕ — über genau den Bedienelementen, die es
// aufgezogen haben. Neu beginnt es an der UNTERKANTE des klebenden Kopf-BLOCKS,
// und zwar aus derselben Quelle, aus der die Anker ihren Sprung-Offset rechnen
// (`--nt-stick`, Risiko R1/LM-003): eine zweite Zahl hätte beim nächsten
// Stufenwechsel der Kopfzeile auseinandergelaufen.
//
// ZWEITER TEIL VON Ä52 — KOMMENTAR UND BAU STIMMEN JETZT ÜBEREIN: `panelForm`
// verspricht für `'rechts'` «Lesetext bleibt links sichtbar und LESBAR; Panel ist
// Beiwerk». Gebaut war ein Vollflächen-Scrim (`fixed inset-0 bg-ink-900/30`) mit
// `aria-modal` und Fokus-Falle — also ein Dialog, der genau das verhindert. Auf D
// gibt es darum keinen Scrim, kein `aria-modal` und keine Fokus-Falle mehr
// (`usePopoverAutoZu` Modus `beiwerk`, Herleitung dort); auf H und im Pane bleibt
// das Sheet modal, weil es dort die ganze Bedienfläche beansprucht.
// ── AUFGEHOBEN für den Pane-Teil (D42, 7.9.2026) ───────────────────────────
// Der letzte Halbsatz war für das Pane eine Annahme, keine Messung, und ist
// widerlegt: 404 von 735 px, also 55 %. Ä52 gilt seither auch dort — der Satz
// bleibt als Beleg von damals stehen (§2b), die Rechnung steht unten bei `modal`.
//
// ═══ Ä55 (H3-Nachzug) · DAS «BOTTOM-SHEET» HING OBEN ═════════════════════════
// Gemessen @390: das Sheet begann bei y = 100 und war 744 px hoch — es füllte
// den ganzen Schirm und verdeckte mit 25 Treffern den gesamten Gesetzestext
// (dieselbe Wurzel wie Ä19). Ein Bottom-Sheet ist unten angeschlagen und wächst
// nach oben, nur so weit es darf. `--leser-v3-panel-max` deckelt es auf 55 % der
// Fläche: darüber bleibt der gelesene Artikel stehen — das ist der ganze Sinn
// eines Blatts gegenüber einem Vollbild-Dialog. Anatomie (Griffleiste zuoberst,
// obere Rundung, Rand nur oben, EIN Scroller, `overscroll-contain`) ist Zeichen
// für Zeichen die des Gliederungs-Blatts. Eine GETEILTE `SheetHuelle` bleibt
// H5-Auflage: `GliederungSheet` liegt in `parts/` und ist unter FL-4 eingefroren
// (Herleitung im Vollzugsvermerk H3, «Sheet-Anatomie zweimal»).
//
// ── DIE RANDLASCHE IST WEG (Ä53/Ä56, gemessen — Herleitung in `LeserPanelOeffner`) ─
// Sie lag @390 mit 16 px IM Normtext und @1024 mit 4 px; wo sie nicht überlappte
// (@1440), war sie das wortgleiche Doppel des Kopf-Zählers. Der Öffner steht
// jetzt genau einmal je Zuschnitt: im Kopf (`voll`/`kompakt`) bzw. im
// «···»-Menü (`mini`) — dieses Bauteil rendert keinen Öffner mehr.

export function LeserPanelZone({
  form, panelId, paneZiel, paneRolle, zustand, bezuege, erlassKey, quelleUrl, normZitat,
  artikelLabel, erlassKuerzel, bestimmungsWort, aktArtikel, steckbrief, ebene, stichtag, artikel,
}: {
  /** ── K-2b/F37 (W2·13-KANTONE, 31.8.2026) · WOHER DIE EBENE KOMMT ──────────
   *  Ebene des gelesenen Erlasses, DURCHGEREICHT vom Rahmen an die Tafeln
   *  mit ebenen-abhängigem Leerzustand (Entscheide, Materialien, Anwendung;
   *  seit S6 Entscheide, Änderungen, Materialien, Erläuterungen).
   *  Diese Datei ordnet nur an — sie entscheidet nichts daran (§3) und lädt
   *  nichts nach (§5: der Wert steht im Erlass-Datensatz, den der Rahmen hält).
   *
   *  NICHT `erlass.ebene` IM RAHMEN, sondern `erlassAnsicht.panelEbene`: die
   *  Fundament-Sonde `leser-v3-fundament` duldet den Lesezugriff auf `.ebene`
   *  in `v3/` ausschliesslich in `erlassAnsicht.ts` — sie hat den ersten
   *  Bauversuch dieses Schritts prompt rot gemeldet («LeserRahmenV3.tsx liest
   *  .ebene»). Die Ableitung ist trivial und steht trotzdem dort, weil die
   *  Zusage nicht «hier wird gerechnet» lautet, sondern «`.ebene` steht an
   *  EINER Stelle»: eine Zusage mit einer Ausnahme ist keine. Wächst je eine
   *  echte Weiche daran (etwa die dritte Ebene «international», die es im
   *  Register schon gibt), wächst sie dort und wirkt in allen drei Tafeln.
   *
   *  NICHT das Routen-Segment aus `useLeserV3Modell({ ebene })`: das ist eine
   *  ADRESS-Angabe und seit Befund 45 nicht mehr deckungsgleich mit der
   *  fachlichen Ebene (`/gesetze/international/…`). */
  ebene: 'bund' | 'kanton';
  /** Gestalt des Blatts — `rahmenBild(...)` im Rahmen entscheidet (seit
   *  Entscheid A, 24.9.2026, wieder mit der Spur `'spalte'`). */
  form: 'spalte' | 'unten';
  /** Id der Fläche. Kommt vom RAHMEN, nicht aus einem lokalen `useId` (A3): die
   *  Öffner stehen ausserhalb dieser Datei und brauchen dieselbe Id für ihr
   *  `aria-controls` — zwei `useId` hätten zwei Ids ergeben, und eine davon
   *  zeigte ins Leere (axe: `aria-valid-attr-value`). */
  panelId: string;
  /** Overlay-Wurzel des Panes (nur im Pane gesetzt) — dieselbe Schicht, in die
   *  das Gliederungs-Blatt portaliert (§5, H2-Befund: die Rolle wandert MIT). */
  paneZiel: HTMLElement | null;
  paneRolle: 'primaer' | 'sekundaer';
  zustand: PanelZustand;
  bezuege: PanelBezuege;
  erlassKey: string | undefined;
  quelleUrl: string;
  normZitat: string;
  artikelLabel: string | null;
  /** Befund 34: Kürzel des Erlasses — Panel-Kopf-Angabe für «Änderungen»/
   *  «Materialien» (die gelten dem ganzen Erlass, nicht dem Artikel). */
  erlassKuerzel: string;
  bestimmungsWort: BestimmungsWort;
  aktArtikel: string | null;
  /** Der Erlass-Steckbrief als Tafel — oder `null`, wenn er gerade OFFEN in der
   *  Leiste steht. Die Weiche trifft der Rahmen (er kennt Spalte und Blatt),
   *  nicht diese Datei (§3): sie ordnet an, sie entscheidet nicht. */
  steckbrief?: ReactNode;
  /** `currency.geprueftAm` — Stichtag «künftig / in Kraft» im Reiter Änderungen (S6). */
  stichtag: string | null;
  /** S6 W1f (Entscheid David 24.9.2026) · Eintrag und Historie des aktiven
   *  Artikels — die Auskunft der gefallenen Funktionszeile (`./BlattArtikel`). */
  artikel: BlattArtikel | null;
}) {
  const titelId = `${panelId}-titel`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const klassen = useBezugKlassen();
  const kantone = useBezugKantone();
  const { offen, reiter, setReiter, schliesse } = zustand;

  // ═══ D42 (David 7.9.2026) · MODAL IST DAS BLATT NUR, WO ES ALLES DECKT ═════
  // AUFGEHOBEN steht hier seit Ä52: «Im Pane ist das Blatt IMMER modal (es
  // beansprucht die ganze Pane-Fläche)». Die BEOBACHTUNG von damals bleibt
  // gültig, die BEGRÜNDUNG ist am 7.9.2026 gemessen widerlegt: im Pane belegt
  // das Blatt **404 von 735 px** Pane-Höhe (55 %, `BLATT_ANTEIL`) — darüber
  // stehen 331 px Gesetzestext sichtbar da. Es beansprucht also gerade NICHT
  // die ganze Fläche; der Scrim tat es (`absolute inset-0`, rect [2,165,718,735]).
  //
  // WAS DAVID GEMELDET HAT («split screen … fast nicht mehr bedienbar») und was
  // gemessen wurde: `elementFromPoint` auf die Mitte von Ansicht-Öffner,
  // ⚖-Öffner, Suchfeld und Textabsatz im Gesetzes-Pane lieferte VIERMAL
  // `div[data-v3-panel-scrim]` statt des Ziels — jeder Klick schloss stattdessen
  // das Blatt. Nicht optisch, real. Gegenprobe: Scrim-Knoten per JS entfernt →
  // alle Ziele wieder treffbar (Alleinursache; kein `inert`, kein `aria-hidden`,
  // kein `pointer-events:none` am Pane).
  //
  // DIE WURZEL WAR DIE KOPPLUNG SELBST. `paneZiel` wechselt beim Split von
  // `null` auf die Overlay-Wurzel — eine reine PORTAL-Frage. Über `||` hing die
  // BEDIEN-Frage daran: dasselbe offene, nicht-modale Beiwerk-Panel mutierte
  // beim Übergang still zum Dialog, ohne dass sich an seinem Zustand sonst
  // etwas änderte. Ä52 hat genau diese Verwechslung schon einmal aufgelöst («bis
  // zum Nachzug waren beide dieselbe Bedingung») — für den Pane-Fall stand sie
  // noch. Jetzt entscheidet allein die GESTALT, und `imPaneBlatt` ist wieder
  // reine Portal-Frage:
  //
  //   modal  ⇔  Bottom-Sheet in der Einzelansicht (@390) — dort deckt das Blatt
  //             die einzige Bedienfläche, die es gibt.
  //   nicht  ⇔  Beiwerk neben dem Text (D, `'rechts'`) UND im Pane — beide Male
  //             bleibt der Lesetext sichtbar UND bedienbar (Ä52-Zusage von
  //             `panelForm`, jetzt auch im Split eingelöst).
  //
  // NICHT die Wurzel und darum unverändert: `panelForm` (`./kopfStufen`) gibt im
  // Pane weiterhin `'unten'`. Die GESTALT ist begründet — ein 22-rem-Streifen in
  // einer 718-px-Spalte liesse vom Text nichts übrig (gemessene Lesespalte im
  // Pane: x 40, Breite 641) —, und «NIE drei vertikale Flächen im Split» bleibt.
  // Falsch war allein die Modalität, nie die Gestalt.
  //
  // DER WEG HINAUS BLEIBT: `modus` unten fällt im Pane auf `'fest'`; das steht in
  // `OHNE_FALLE` (`./usePopoverAutoZu`), woran der Escape-Handler hängt — Escape,
  // ✕ und der Zweitklick am Zähler tragen weiter. Nur der Aussenklick entfällt,
  // genau wie auf D seit Ä52 gewollt (sonst wäre Textmarkieren unmöglich).
  const imPaneBlatt = paneZiel != null;
  const modal = !imPaneBlatt && form === 'unten';
  const spalte = form === 'spalte' && !imPaneBlatt;
  useZurueckSchliesst(offen && modal, schliesse); // D-7: Zurück schliesst zuerst (`./blattGesten`)
  const wisch = useWischZu(panelRef, schliesse);

  usePopoverAutoZu({
    offen, schliesse, wrapRef, panelRef,
    // Ä86/D33: das Blatt neben dem Text ist kein aufgezogenes Popover — es
    // schliesst über ✕ · Esc · Zweitklick am Öffner · «r» (das «r» zog bis
    // S6-W1a nur AUF und setzte den Reiter zurück, D-8), NICHT bei jedem Klick
    // in die Lesespalte (sonst wäre Textmarkieren unmöglich, Klick-Test
    // 18.8.2026; Wächter `leser-v3-rahmen` (f)). Der Modus hiess bis 7.9.2026
    // `'spalte'` nach der Lage, die es nicht mehr gibt — die Regel bleibt.
    modus: modal ? 'blatt' : 'fest',
    // Die Öffner liegen ausserhalb von `wrapRef` (Kopfzeile, «Ansicht ▾»-Menü) —
    // ohne diese Ausnahme schlösse ihr `pointerdown` das Panel, das ihr `click`
    // gleich darauf wieder öffnete (Herleitung in `usePopoverAutoZu`).
    aussenAusnahme: OEFFNER_SELEKTOR,
  });

  // Nachladen: erst wenn das Panel einmal offen war (Begründung in
  // `panelKontextLaden`). Die Hooks laufen unbedingt — das GATE ist ihr Argument,
  // nicht ein `if` um den Aufruf.
  // S6: die vier erlass-weiten Tafeln laden und verdrahten sich in
  // `./PanelTafeln` (dieselben Hooks, dasselbe Gate); der Artikel-Revisions-
  // Shard (§7b-Deckungslücke, normrevision-badge.e2e.ts) kommt von dort mit.
  const { tafeln, artikelRevisionen } = usePanelTafeln({
    erlassKey, laden: zustand.jeGeoeffnet, quelleUrl, ebene, stichtag, aktArtikel, artikelLabel, blatt: artikel,
    normZitat, wort: bestimmungsWort,
  });

  // ═══ STECKBRIEF-ZEILE IM PANEL (H4-Vorbereitung II, 17./18.8.2026) ══════════
  //
  // BEFUND (Integrations-Fund 17.8., @1440 reproduziert): die Übersichtsbox lebt
  // in der Seitenleiste. Klappt man die Gliederung ein — die Geste, mit der man
  // Breite für den Text gewinnt —, sinkt `[data-v3-uebersicht]` von 1 auf 0: der
  // Steckbrief ist dann nicht unsichtbar, sondern aus dem DOM, also auch für
  // Ctrl+F und Screenreader fort.
  //
  // ── WARUM KEIN VIERTER REITER ─────────────────────────────────────────────
  // Der vierte Reiter «Steckbrief» war gebaut und ist AN DER MESSUNG gescheitert,
  // nicht am Geschmack. Gemessen 17.8.2026 @1440 an der Reiter-Leiste des Panels:
  //
  //   Platz (clientWidth)            334 px
  //   drei bestehende Reiter          269 px  (Entscheide 89 · Änderungen 94 ·
  //                                            Materialien 87)
  //   Abstände + Innenabstand          24 px
  //   ⇒ Budget für einen vierten       41 px
  //
  // Kein ehrliches Wort passt: «Steckbrief» misst 82 px, «Übersicht» 78,
  // «Herkunft» 73, «Quelle» 57, «Erlass» 55, «Norm» 51. Gewählt ist darum eine
  // eigene ZEILE: dieselbe `<details>`-Klappe wie in der Leiste (§5 — EIN
  // Bauteil, EINE Ableitung `uebersichtsAngaben`), zugeklappt genau eine Zeile
  // hoch, ohne ein Fach in der Reiter-Leiste zu beanspruchen.
  //
  // ── Ä89 / P3 (3c) · WO SIE STEHT UND WANN — beides berichtigt 18.8.2026 ────
  // (1) LAGE. Hier wickelte diese Datei den Steckbrief um JEDE Tafel; er lag
  //     damit innerhalb des `role="tabpanel"`. Gemessen @1440: Klappe y = 245,
  //     Reiter-Leiste y = 208 — die Zeile stand UNTER den Reitern, obwohl sie zu
  //     keinem gehört. Der Abstrich stand als Rückgabe-Punkt schon hier
  //     («die saubere Stelle wäre … `LeserPanel.tsx`»); er ist eingelöst: die
  //     Zeile ist eine PROP des Panels und steht über der Reiter-Leiste.
  // (2) WANN. Hier stand «der Defekt … sitzt auf dem Desktop mit eingeklappter
  //     Gliederung» — der Bau montierte die Zeile aber in JEDER Lage, in der die
  //     Seitenleiste ihn nicht trägt, also auch @390 bei geschlossenem
  //     Gliederungs-Sheet (Architektur-Review P3 (3c)). DAS IST RICHTIG SO, und
  //     der Kommentar sagt es jetzt: die Frage ist nicht «welche Breite», sondern
  //     «steht die Leiste gerade irgendwo». Genau diese eine Frage beantwortet
  //     der Rahmen als `leisteSteht` (Spalte ODER Sheet) und schickt das Ergebnis
  //     als `steckbrief`-Prop herein; er entscheidet, diese Datei ordnet an (§3).
  //     BEWACHT @390: `leser-v3-uebersicht` (c3) misst in allen drei Lagen —
  //     nur Panel, nur Blatt, beides —, dass der Konsolidierungs-Vorbehalt genau
  //     EINMAL auf der Seite steht (Ä28), und zwar im Erlass-Kopf. Gezählt wird
  //     seit der Integration A×B (18.8.2026) die SEITE statt des Box-Fachs
  //     `[data-v3-uebersicht-warnung]`: Ä81 aus Nachzug B hat der Box die
  //     `warnung`-Ausgabe genommen, das Fach trägt nur noch den `vorbehalt`.
  const inhalt = {
    entscheide: (
      <PanelEntscheide
        kanten={aktArtikel ? bezuege.bezuegeFuer(aktArtikel)?.kanten : undefined}
        alleKanten={aktArtikel ? bezuege.alleFuer(aktArtikel)?.kanten : undefined}
        aktArtikel={aktArtikel} revisionShard={artikelRevisionen.wert}
        normZitat={normZitat} artikelLabel={artikelLabel} bestimmungsWort={bestimmungsWort}
        // A1: das Lade-ENDE kommt aus der Hook, die den Fetch kennt — nicht aus
        // dem Klassen-Zähler (der bei einem Erlass ohne Shard für immer leer ist).
        geladen={bezuege.geladen}
        // S6-W1b (E-3/D-3/B-8): der Fehlschlag ist eine eigene Lage, nicht «geladen, leer».
        fehler={bezuege.fehler} onNeuLaden={bezuege.neuLaden}
        klassen={klassen} kantone={kantone} kantoneVerfuegbar={bezuege.kantoneVerfuegbar}
        histogramm={bezuege.histogramm} bereich={bezuege.bereich}
        onKlassen={setzeBezugKlassen} onKantone={setzeBezugKantone}
        onBereich={(von, bis) => setzeBezugZeit(von, bis)}
        ebene={ebene} />
    ),
    ...tafeln,
  } as const;

  // ── Die Fläche: Anschlag-Kante und Deckel je Gestalt (`./blattFlaeche`) ─────
  const flaeche = blattFlaeche(spalte && offen, imPaneBlatt);

  const blatt = (
    <div ref={wrapRef} data-v3-panel-spur="blatt"
      data-v3-pane={paneRolle}
      // Der Träger: offen als Spur die dritte Grid-Zelle, sonst `display:
      // contents` ohne Box (Herleitung in `./blattFlaeche`). Dasselbe Element in
      // beiden Lagen, damit Öffnen und Schliessen nichts neu einhängen. Die
      // DOM-Vorfahrenkette bleibt unberührt: `data-v3-pane` trägt weiter
      // (H2-Befund). Ä5 (Fläche des Behälters für klebende Sockel) entfällt seit
      // W2·29 S5: das Blatt ist `paper` wie der Sockel-Vorgabewert.
      // Im Druck fällt er über `[data-v3-panel-spur]` (index.css, A-2).
      className={flaeche.traeger.klassen} style={flaeche.traeger.stil}>
      {offen && (
        <>
          {/* Der Scrim gehört zum MODALEN Blatt. Auf D gibt es keinen — dort ist
              das Panel Beiwerk, und ein Scrim hätte den Lesetext, den es
              erläutert, hinter einer Scheibe gezeigt (Ä52).

              B7-N1 (30.8.2026): `bg-ink-900/30` → `bg-black/30`. `--ink-900`
              flippt mit dem Thema (`src/index.css`: hell `#201E16`, dunkel
              `#E9E7E2`) — im Dunkelmodus legte dieser «Scrim» also einen
              HELLEN Schleier über den Lesetext und hellte auf, statt
              abzudunkeln. `components/layout/Shell.tsx` hat für den
              Schubladen-Scrim genau das schon notiert («bg-ink-900 wäre im
              Dunkelmodus hell»); hier stand der Fehler noch. Deckkraft
              unverändert 30 % — reine Farbkorrektur, keine Ton-Änderung.

              F2-1 (31.8.2026): derselbe Wert, jetzt aus `.lc-scrim`
              (src/index.css) statt als Utility-Kette — die Zahl der ROLLE
              «angeschlagenes Blatt» steht seither an genau einer Stelle. */}
          {/* D42 (7.9.2026): der `imPaneBlatt ? absolute : fixed`-Ternär ist hier
              zusammengefallen. Er hatte nur einen Zweck — den Scrim auf die
              Pane-Fläche zu begrenzen —, und im Pane gibt es seither keinen
              Scrim mehr. Modal ist nur noch das Bottom-Sheet der Einzelansicht,
              und dessen Fläche IST das Fenster: `fixed`. */}
          {modal && (
            <div data-v3-panel-scrim
              className="lc-scrim fixed inset-0 z-overlay"
              onClick={schliesse} aria-hidden />
          )}
          <div
            // `role="dialog"` nur, wo es einer IST. Das Beiwerk ist eine benannte
            // REGION: ein Dialog ohne Fokus-Falle und ohne Modalität wäre die
            // Rollen-Lüge, die §8 an anderer Stelle («ehrliche Disclosure statt
            // role=menu») schon verboten hat.
            role={modal ? 'dialog' : 'region'}
            aria-modal={modal || undefined}
            aria-labelledby={titelId}
            data-v3-panel-form={form}
            data-v3-panel-modal={modal ? 'ja' : 'nein'}
            // S6 W1f · welcher Artikel gerade gilt (Sonden-Anker, `./BlattArtikel`).
            data-v3-panel-artikel={aktArtikel ?? undefined}
            className={`${flaeche.klassen} flex flex-col`}
            style={flaeche.stil}>
            <LeserPanel panelId={panelId} titelId={titelId} artikelLabel={artikelLabel}
              bestimmungsWort={bestimmungsWort} erlassKuerzel={erlassKuerzel}
              reiter={reiter} setReiter={setReiter} inhalt={inhalt}
              onSchliessen={schliesse} panelRef={panelRef}
              // Griffleiste NUR am unten angeschlagenen Blatt: das Zeichen für
              // «nach unten wischbar» (§8: am rechten Rand ein Versprechen ohne
              // Geste). D-7 (S6-W1a): bis 23.9.2026 war sie auch unten nur
              // Zeichen — die Geste fehlte; seither trägt sie sie (`useWischZu`),
              // auf einem 20-px-Streifen statt des 4-px-Strichs.
              kopfExtra={form === 'unten'
                ? (
                  <div aria-hidden data-v3-panel-griff {...wisch}
                    className="flex shrink-0 cursor-grab touch-none justify-center py-2">
                    <div className="h-1 w-10 bg-line-strong" />
                  </div>
                )
                : undefined}
              // Ä89: die Steckbrief-Zeile gehört dem Panel, nicht seinen Tafeln.
              steckbrief={steckbrief}
              // S6 W1f: «Verweise … oben im Blatt», über jedem Reiter (Entscheid David 24.9.2026).
              verweise={<BlattVerweise artikel={artikel} zitat={normZitat} wort={bestimmungsWort} />} />
          </div>
        </>
      )}
    </div>
  );

  return paneZiel ? createPortal(blatt, paneZiel) : blatt;
}
