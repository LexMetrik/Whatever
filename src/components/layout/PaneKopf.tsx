import type { DragEvent, ReactNode } from 'react';
import { OrtsAngabe, StandAngabe } from './OrtsAngabe';
import { SchliessKnopf } from '../ui/SchliessKnopf';

// ─── Pane-Kopf (Split-View «Fensterkopf», Auftrag David) ────────────────────
//
// EINE Titelleiste je Pane, IDENTISCH für primär + sekundär, nur im Multipane
// montiert (1-Pane-Default trägt keine Chrome → byte-gleich). Sagt, WAS im Pane
// liegt (Icon · Label · Stand) und trägt die Pane-Steuerung rechts:
// ⠿ Ziehgriff · ◂/▸ Umsortieren (Tastatur/Touch) · [zum Hauptfenster] · [teilen] · ✕.
// Reine Darstellung (§3); Tokens-only (§13). Sitzt AUSSERHALB des Scroll-
// Containers (echte Leiste, kein sticky-Hack).
//
// ── A-2 (David 17.8.2026): der IDENTITÄTS-Teil ist abwählbar (`nurSteuerung`).
//    Trägt die Inhaltsseite ihre Kopfzeile selbst, bleibt hier die reine
//    Fenster-Steuerung — Herleitung an der Prop und im Vertrag
//    `InhaltsKopfKontext.KopfDaten.kopfzeileSelbst`.

export interface PaneKopfProps {
  icon?: ReactNode;
  label: string;
  /**
   * In-Kraft-/Konsolidierungs-Stand, nur wenn auflösbar (§8 — kein erfundener Stand).
   *
   * ── §7-ABWEICHUNG VOM BAU-PAKET A-4 (31.8.2026), offengelegt ──────────────
   * Das Paket verlangte die STREICHUNG dieser Prop als unerreichbar (§6.7).
   * Nachgerechnet statt geglaubt — die Behauptung ist falsifiziert:
   *   (a) `stand` ist genau dann gesetzt, wenn `Shell.titelVon()` einen Erlass
   *       auflöst; `lib/verlaufLabel.erlassVonPfad` gibt nur auf GESETZ-Pfaden
   *       etwas zurück.
   *   (b) Der Gesetz-Leser meldet `kopfzeileSelbst` NICHT unbedingt: auf drei
   *       Wegen nimmt `pages/gesetz-leser/v3/useKopfAnspruch.ts` (Z. 51) die
   *       Meldung zurück, wenn der Rahmen eine BLEIBENDE Ansicht ohne Kopfzeile
   *       rendert — Fehlseite · `pdf-embed` · `nur-live-link`
   *       (`pages/gesetz-leser/inhalt-ansichten.FruehAnsicht`).
   *   (c) Dann ist `kopfDaten === null`, also `nurSteuerung === undefined`,
   *       also `zeigeIdentitaet === true` — und der Stand steht.
   *   (d) Betroffener Bestand, gezählt am `public/normtext/register.json`
   *       (31.8.2026): 11 Erlasse mit `status` ∈ {pdf-embed, nur-live-link},
   *       davon 11 MIT `stand` — u. a. `bund/EMRK` (2022-09-16),
   *       `bund/DSGVO` (2016-04-27), `bund/NYUE` (2026-05-06).
   * Auf genau diesen Seiten ist diese Zeile die EINZIGE Stand-Angabe des Panes;
   * streichen hiesse einen Rechtswert entfernen (§8, D1). Die Prop bleibt und
   * ist seit 31.8.2026 bewacht: `src/tests/ortsAngabe.test.tsx` fährt die Kette
   * (a)–(d) nach und wird rot, sobald sie fällt.
   */
  stand?: string | null;
  /** F: Breadcrumb «Gesetze › Bund › OR» statt blossem Label (Parität zur Einzelansicht). */
  breadcrumb?: { label: string; to?: string }[];
  /** Klick auf einen Krümel mit `to` navigiert PANE-LOKAL (David 1.7.2026): der
   *  Callback geht an den Pane-eigenen Navigator (sekundär) bzw. den Haupt-Router
   *  (primär) — NIE ein globaler <Link> (der das ganze Fenster wegnavigieren würde).
   *  Fehlt der Callback (z. B. SSR/Prerender), bleibt die Breadcrumb statisch. */
  onBreadcrumb?: (to: string) => void;
  /** F: aktuell gelesener Artikel (Gesetz, live), z. B. «Art. 7 OR». */
  artikel?: string | null;
  rolle: 'primaer' | 'sekundaer';
  onSchliessen: () => void;
  /** Sekundär: dieses Pane zum Hauptfenster (URL) machen. */
  onHauptfenster?: () => void;
  /** Sekundär: Layout-Link kopieren. */
  onTeilen?: () => void;
  /** Quittungs-Muster von `KopierButton`/`useKopieren` übernommen (W2·19-
   *  DESIGN-KONSISTENZ Runde 8, #692-Nachzug): `onTeilen` kopierte bis hierher
   *  ohne jede Rückmeldung — der Klick war ununterscheidbar von einem, der
   *  nichts tat. Der Aufrufer hält den `kopiert`-Zustand (derselbe geteilte
   *  Hook wie überall sonst) und reicht ihn hier durch; icon-only Slot, darum
   *  swap statt Text («⧉» → «✓», wie `KopierButton` «… kopieren» → «Kopiert ✓»
   *  tauscht). */
  teilenKopiert?: boolean;
  /** Umsortieren (Tastatur/Touch). disabled an den Enden. */
  onLinks?: () => void;
  onRechts?: () => void;
  kannLinks?: boolean;
  kannRechts?: boolean;
  /** ── A-2 (David 17.8.2026) · NUR PANE-STEUERUNG, KEINE IDENTITÄT ──────────
   *  Die Inhaltsseite dieses Panes hat `kopfzeileSelbst` gemeldet — sie trägt
   *  Krume, Titel, Ortsangabe und Stand selbst, eine Zeile weiter unten. Diese
   *  Leiste lässt ihren Identitäts-Teil dann WEG und behält genau das, was eine
   *  Inhaltsseite nicht tragen kann, weil es nicht ihr gehört, sondern dem
   *  Fenster: ⠿ Ziehgriff · ◂/▸ Umsortieren · ⇱ Hauptfenster · ⧉ Teilen · ✕
   *  Pane schliessen.
   *  `label` bleibt trotzdem gesetzt: die Steuer-Knöpfe brauchen ihn für ihre
   *  Accessible Names («‹StPO› schliessen») — sichtbar wird er nicht mehr. */
  nurSteuerung?: boolean;
  /** ── L6 (Entscheid David 7.9.2026) · DER NAME, WENN DIE SEITE DIE KRUME HAT ─
   *  Der Name des Fensters — die kanonische Kurzform des Dokuments darin, als
   *  fertiges Element (`./PaneName`, dort Herleitung und §5-Quelle). Diese
   *  Leiste rendert ihn opak und weiss nicht, woraus er entsteht: sie bleibt
   *  reine Darstellung (§3), wie beim `ansichtSlot` des `InhaltsKopf`.
   *  Gezeigt wird er NUR, wenn die Leiste ihren Identitäts-Teil abgegeben hat
   *  (`nurSteuerung`); trägt sie ihn selbst, nennt die `OrtsAngabe` das Dokument
   *  schon, und eine zweite Nennung wäre genau die Dopplung, die D4 verbietet. */
  kurzform?: ReactNode;
  /** HTML5-Drag-Handler für den ⠿-Griff (nur wenn ziehbar, d. h. ≥2 Panes). */
  ziehbar?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
}

// ─── Die Griff-Familie der Titelleiste (R4-A, 5.9.2026) ─────────────────────
//
// Der Klassen-String stand bis hierher als EIN Block da und mischte drei Dinge:
// die BOX (Mass, Umriss), die HOVER-FLÄCHE der Leiste und die FARBE. Genau
// daran scheiterte die A3-1-Migration der Runde 3: das ✕ dieser Leiste war die
// achte ✕-Form der App und blieb als «(c) OFFEN (R3-γ)» im Wächter stehen, weil
// es den Block nicht teilen konnte, ohne die anderen fünf Griffe mitzureissen.
//
// GEMESSEN am Preview (5.9.2026, /gesetze/bund/OR?p=/gesetze/bund/ZGB): das ✕
// trug BEIDE Hover-Töne gleichzeitig — `hover:text-brass-700` aus diesem Block
// und `hover:text-danger-700` aus dem Anhängsel am Fundort. Welcher malt,
// entschied nicht die Absicht, sondern die Reihenfolge im erzeugten Stylesheet;
// gemessen gewann `rgb(122,47,35)` = danger-700. Ein Ton, der aus einer
// Sortierung folgt statt aus einer Aussage, ist keine Design-Entscheidung.
// Der Baustein `ui/SchliessKnopf` hat für diese Aussage einen NAMEN —
// `ton="destruktiv"` — und trägt denselben Wert: die gemalte Farbe bleibt
// unverändert, sie ist nur nicht mehr zufällig.
// W2·24 R2: Radius 0 (§5 «Form: Radien 0»); die Box selbst bleibt 28 px.
const GRIFF_BOX = 'inline-flex h-7 w-7 items-center justify-center transition-colors';
/** Hover-Fläche der Leiste — B6-Anatomie (28.7.2026), sie gilt für ALLE Griffe
 *  dieser Zeile und ist darum auch das, was das ✕ als `klasse` mitbekommt. */
// R5-D/§G-j: die Hover-Fläche ist EINE Regel, getragen von der Rolle
// `.lc-hover-flaeche` (index.css) — keine eigene Alpha-Stärke daneben.
const GRIFF_FLAECHE = 'lc-hover-flaeche';
const knopf = `${GRIFF_BOX} ${GRIFF_FLAECHE} text-ink-500 hover:text-ink-900 lc-deaktiviert disabled:hover:bg-transparent disabled:hover:text-ink-500`;

export function PaneKopf({ icon, label, stand, breadcrumb, onBreadcrumb, artikel, rolle, onSchliessen, onHauptfenster, onTeilen, teilenKopiert, onLinks, onRechts, kannLinks, kannRechts, nurSteuerung, kurzform, ziehbar, onDragStart, onDragEnd }: PaneKopfProps) {
  // A-2: eine Zeile, ein Zuständiger. Trägt die Seite ihre Kopfzeile selbst,
  // zeigt diese Leiste NICHTS von der Identität — sonst stünde derselbe Ort
  // zweimal in zwei Zentimetern (§5, Ä45 «Doppelkrume»).
  const zeigeIdentitaet = !nurSteuerung;
  return (
    // `data-pane-kopf` (A-2): Testanker der Titelleiste — bis 17.8.2026 liess sie
    // sich nur über Utility-Klassen (`div.h-9`) finden, und ein Test, der am
    // Aussehen sucht, prüft irgendwas (dieselbe Lehre wie `data-ort-artikel`).
    // Gebraucht von `e2e/leser-v3-eine-kopfzeile.e2e.ts` (d), das messen muss, ob
    // hier noch Identität steht. Reine Kennzeichnung, keine Anzeige-Änderung.
    <div data-pane-kopf data-pane-rolle={rolle} data-pane-bezug={rolle}
      // W2·24 R2: die Kopfzeile eines Fensters ist eine KANTE (2 px `--rule`),
      // die Trennung darunter eine Linie — dieselbe Grammatik wie im Titelblatt.
      className={`shrink-0 grid grid-cols-[1fr_auto] items-center gap-2 h-9 px-1.5 border-b border-rule-soft bg-paper ${rolle === 'primaer' ? 'border-l-2 border-l-rule' : ''}`}>
      {/* Links: Identität (Icon · Label · Stand). pl-0 + enger gap → der Breadcrumb-
          Text fluchtet mit dem Inhalts-Gutter darunter (☰-Knopf/Artikeltext), statt
          vom ⠿-Griff nach rechts geschoben zu werden (Wunsch David: links bündig). */}
      <div className="flex min-w-0 items-center gap-1 pl-0">
        {ziehbar && (
          <span
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            aria-hidden
            title="Zum Verschieben ziehen"
            className="lc-griff-glyph shrink-0 cursor-grab active:cursor-grabbing select-none px-0.5 text-ink-400 hover:text-ink-900"
          >⠿</span>
        )}
        {zeigeIdentitaet && icon && <span className="shrink-0">{icon}</span>}
        {/* ── A-4 (31.8.2026) · DIE ORTSANGABE IST DIESELBE WIE IN DER
            EINZELANSICHT ────────────────────────────────────────────────────
            Bis hierher baute diese Leiste ihre Krumen-Kette selbst nach — in
            `text-body-s` statt `text-xs`, ohne Landmark, mit dem vollen
            Artikel-Zitat neben der Krume, die sein Kürzel schon nennt, und vor
            allem OHNE jede Overflow-Regel: jede Krume truncatete für sich, also
            genau das «( ) )»-Bild, das der `InhaltsKopf` unter ② längst behoben
            hatte. Beides zieht jetzt auf `./OrtsAngabe` (§5/§10); die Kaskade
            dort misst die ZONE und wirkt darum im schmalen Pane wie auf dem
            Telefon. `aufKrume` hält die Navigation pane-lokal (David 1.7.2026),
            der Landmark-Name nennt das Fenster, damit mehrere Panes
            unterscheidbare Landmarks tragen. */}
        {zeigeIdentitaet && (
          <OrtsAngabe breadcrumb={breadcrumb} blattLabel={label} artikel={artikel}
            aufKrume={onBreadcrumb} navLabel={`Brotkrümel «${label}»`} />
        )}
        {/* D1/§7: der Stand ist ein Rechtswert — EINE Anatomie mit der
            Einzelansicht (`./OrtsAngabe`, dort auch die F2-Herleitung für
            ink-600, die diese Leiste bis 31.8.2026 auf ink-500 unterlief). Der
            Platz ist pane-eigen: hier steht kein Griff-Riegel, in den die Angabe
            gehörte, darum sitzt sie hinter der Ortsangabe (Trenner «·»). */}
        {zeigeIdentitaet && stand && <StandAngabe stand={stand} trenner />}
        {/* ── L6 (Entscheid David 7.9.2026) · EIN FENSTER OHNE NAMEN GAB ES NICHT
            MEHR ────────────────────────────────────────────────────────────
            GEMESSEN am Preview 4423, Split @1440 (`/gesetze/bund/OR?p=/gesetze/
            bund/ZGB`): BEIDE Titelleisten trugen «⠿ … ▸ ✕» und sonst nichts —
            die linke zusätzlich das sr-only «(aktuelle Adresse)». Zwei
            Fenster nebeneinander, keines sagt, welches Gesetz darin liegt,
            während die Reiter darüber «OR» und «ZGB» nennen. Ursache ist A-2:
            der V3-Leser meldet `kopfzeileSelbst`, die Leiste gibt darauf ihren
            GANZEN Identitäts-Teil ab — Krume UND Name.
            A-2 bleibt richtig, aber es hat einen Krümel zu viel abgegeben. Die
            Krume darf nicht doppelt stehen (Ä45), der NAME des Fensters aber
            gehört der Titelleiste: sie ist für das Pane, was der Reiter für den
            Browser-Tab ist. Genau diese Kurzform steht darum hier — kein
            Rücksprung-Pfad, keine Krumen-Kette, ein Wort.
            §5/§15: woher die Zeichenkette kommt und warum sie ein eigenes
            Element ist, steht in `./PaneName` — nicht hier (§3).

            ── DER PLATZHALTER IST ERSETZT, NICHT ERGÄNZT (§17-Gegengewicht) ──
            Hier stand bis 7.9.2026 `{rolle === 'primaer' && <span
            className="sr-only">(aktuelle Adresse)</span>}` — die einzige
            «Beschriftung» des linken Fensters, und sie nannte nicht das
            Dokument, sondern die ROLLE. Die Rolle sagt diese Leiste ohnehin
            schon: der Schliess-Knopf unten heisst im primären Pane
            «Hauptfenster schliessen», im sekundären «‹ZGB› schliessen». Zwei
            verschieden formulierte Fassungen derselben Auskunft in EINER Leiste
            sind der Fall, den D4 ausschliesst; die schwächere fällt. Ersatzlos
            leer wird dabei nichts: `kurzform` ist nie leer — steht das Manifest
            noch aus, liefert `verlaufLabel` «Gesetz öffnen». */}
        {!zeigeIdentitaet && kurzform}
      </div>
      {/* Rechts: Steuerung. */}
      <div className="flex items-center">
        {onLinks && (
          <button type="button" className={knopf} disabled={!kannLinks} onClick={onLinks} aria-label={`«${label}» nach links`}>
            <span aria-hidden className="lc-griff-glyph">◂</span>
          </button>
        )}
        {onRechts && (
          <button type="button" className={knopf} disabled={!kannRechts} onClick={onRechts} aria-label={`«${label}» nach rechts`}>
            <span aria-hidden className="lc-griff-glyph">▸</span>
          </button>
        )}
        {onHauptfenster && (
          <button type="button" className={knopf} onClick={onHauptfenster} aria-label={`«${label}» zum Hauptfenster machen`} title="Zum Hauptfenster machen">
            <span aria-hidden className="lc-griff-glyph">⇱</span>
          </button>
        )}
        {onTeilen && (
          <button type="button" className={knopf} onClick={onTeilen}
            aria-label={teilenKopiert ? 'Layout-Link kopiert' : 'Layout-Link kopieren'}
            title={teilenKopiert ? 'Layout-Link kopiert' : 'Layout-Link kopieren'}>
            <span aria-hidden className="lc-griff-glyph">{teilenKopiert ? '✓' : '⧉'}</span>
          </button>
        )}
        {/* A3-1/R4-A: die achte ✕-Form ist eingesammelt. Der Klick wirft ein
            offenes Fenster samt Leseposition weg — dieselbe Handlung wie das
            Schliessen eines Reiters, darum derselbe deklarierte Ton. `title`
            trägt jetzt den vollen Namen: «Schliessen» allein sagte im
            sekundären Pane nicht, WELCHES Fenster zugeht (§8, Baustein-Kanon).
            `komfort={false}`: 44 px lägen hier über dem ⧉- und ▸-Nachbarn
            derselben Griff-Zeile und nähmen ihnen die Klicks — dieselbe
            begründete Ausnahme wie in der Reiter-Liste; die AA-Untergrenze
            (24 px) hält die Grundklasse, die sichtbare Box bleibt 28 px. */}
        <SchliessKnopf ton="destruktiv" komfort={false}
          name={rolle === 'primaer' ? 'Hauptfenster schliessen' : `«${label}» schliessen`}
          onClick={onSchliessen} klasse={`h-7 w-7 ${GRIFF_FLAECHE}`} />
      </div>
    </div>
  );
}
