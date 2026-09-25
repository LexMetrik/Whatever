import { useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { EntscheidBody } from './EntscheidBody';
import RegesteBlock from './RegesteBlock';
import { BesetzungWert, DatumMeta, MassgeblicheFassung } from './EntscheidKopfTeile';
import { FS_STUFEN } from './leseGroesse';
import { SeitenTitel } from '../ui/SeitenTitel';
import { paneKlasse } from '../layout/PaneKontext';
import { useDialogFokus } from '../layout/useDialogFokus';
import { GEBIET_LABEL } from '../../lib/normtext/register';
import { referenzImTitel } from '../../pages/entscheidLeserRegeln';
import { MASSGEBLICH_SATZ } from '../../lib/benennung';
import type { KopfLabelKey, KopfModell } from '../../lib/rechtsprechung/kopf';
import type { RichterRef } from '../../lib/rechtsprechung/register';
import type { EntscheidSnapshot } from '../../lib/rechtsprechung/typen';

// Herausgelöst aus `pages/EntscheidLeser.tsx` am 31.8.2026 (§6.6 · Datei-
// Schlankheit; `check:schlankheit` war nach den B2/BAU-4-Nachzügen ROT). Der
// Overlay ist die zweite, eigenständige ANSICHT desselben Entscheids und war
// schon vorher nur über eine schmale Prop-Kante mit dem Leser verbunden — der
// Schnitt folgt dieser Kante, er erfindet sie nicht. Verschoben, nicht
// verändert; die Herleitungen (LM-014, LM-019, 5B-Nachzug, A-5) stehen
// unverändert bei ihrem Bauteil (§2b: Belege altern nicht).

// ── Lesemodus: ablenkungsfreies Vollbild-Overlay ────────────────────────────
// Zeigt NUR den Entscheid in einer ruhigen Lesespalte (grosse Serif, viel
// Weissraum), blendet die App-Shell aus. Wiederverwendung des EntscheidBody +
// der Regeste (keine Duplizierung der Rechtsdarstellung, §3/§5). Provenienz/
// massgebliche Fassung bleibt sichtbar (§8). ESC schliesst, Body-Scroll gesperrt.
//
// ═══ A-5 (Design-Konsistenz, 31.8.2026) · DAS OVERLAY BLEIBT IM PANE ════════
//
// BEFUND der Finder-Welle A: im Split-View deckte der Lesemodus BEIDE Panes zu.
// Wer im rechten Pane «▭ Lesemodus» drückte, verlor das linke Dokument aus dem
// Blick — obwohl das Nebeneinander der ganze Zweck des Splits ist.
//
// DIE ALTE BEGRÜNDUNG STEHT UND IST NICHT FALSIFIZIERT (§2b): der Kommentar
// unten hielt fest, dass ein `@container/pane`-Vorfahr `position:fixed`
// einfängt, weshalb das Overlay an `<body>` portalierte — technisch damals wie
// heute richtig. GEÄNDERT hat sich nicht die Messung, sondern das ZIEL: was
// dort als Bug behandelt wurde («nicht mehr vollflächig»), ist im Split-View
// das gewünschte Verhalten. Ein Overlay eines Panes gehört in dieses Pane.
//
// GEBAUT WIE DER V3-DRAWER (§5, dieselbe Mechanik statt einer zweiten):
// `pages/gesetz-leser/parts/GliederungSheet` + `v3/leisteAufbau` hängen
// ihre Blätter in die Overlay-Schicht des Panes (`PaneKontext.overlayWurzel`,
// ein nicht-scrollendes Geschwister im `relative`-Wrapper) und schalten dort
// von `fixed` auf `absolute`. Drei Dinge folgen daraus, alle mit demselben
// Vorbild:
//   1. `aria-modal` entfällt im Pane — der Rest des Fensters ist weiterhin da
//      und bedienbar; ein `aria-modal="true"` würde einem Screenreader das
//      Gegenteil sagen (GliederungSheet: `aria-modal={inPane ? undefined : true}`).
//   2. KEIN `document.body`-Scroll-Sperre im Pane: die Sperre gehört einem
//      Vollbild-Dialog. Aus einem Pane heraus fror sie die Hauptfläche ein, die
//      gar nicht verdeckt ist.
//   3. `pointer-events-auto` holt die Klickbarkeit zurück, die die
//      Overlay-Schicht (`pointer-events-none`) abgeschaltet hat.
// Die FOKUS-FALLE bleibt in beiden Lagen — auch das wie der V3-Drawer, der
// `useDialogFokus` im Pane unverändert benutzt: solange das Blatt die ganze
// Pane deckt, ist ein Tab hinter das Blatt ein Fokus ins Unsichtbare.
export function LesemodusOverlay({ ziel, snap, abschnitte, regesteText, massgeblicheUrl, massgeblichTitel, massgeblichFehlt, fsIdx, setFs, onClose, zeigeRubrum, kopf, kopfLabel, richterRefs }: {
  /** Overlay-Schicht des Panes; `null` = Einzelansicht (Vollbild an `<body>`). */
  ziel: HTMLElement | null;
  snap: EntscheidSnapshot;
  abschnitte: EntscheidSnapshot['abschnitte'];
  // Bereits an der Ansicht ausgerichtet (null = im vollständigen Urteil keine Regeste oben);
  // kein Fassungs-Desync zwischen Hauptspalte und Lesemodus.
  regesteText: string | null;
  massgeblicheUrl: string;
  massgeblichTitel: string;
  massgeblichFehlt: boolean;
  fsIdx: number;
  setFs: (i: number) => void;
  onClose: () => void;
  /** LM-014: dieselben Rubrum-Zeilen (Gegenstand/Parteien/Vorinstanz/Besetzung)
   *  wie die Voll-Ansicht — Ableitung bleibt in kopfModell() (§5), hier nur Render. */
  zeigeRubrum: boolean;
  kopf: KopfModell;
  kopfLabel: Record<KopfLabelKey, string>;
  richterRefs: RichterRef[] | undefined;
}) {
  const schliessRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // EINE Weiche für alle drei Folgen (Positionierung · aria-modal ·
  // Body-Sperre): das Portal-Ziel IST die Lage. Ein zweites `imPane` aus dem
  // Kontext wäre eine zweite Quelle für dieselbe Aussage (§5).
  const imPane = ziel != null;
  // Runde-2-Nachzug (31.8.2026, §5): Escape, Fokus-Falle und Fokus-Rückgabe
  // liefen hier als HANDGESCHRIEBENE Kopie — die zehnte Dialog-Fläche des Hauses
  // und die einzige, die `useDialogFokus` nicht benutzte. Der Kommentar oben
  // sagte bereits «wie der V3-Drawer, der `useDialogFokus` unverändert benutzt»;
  // jetzt stimmt das auch für den Code. Die Kopie war zudem schwächer: sie sammelte
  // nur `a[href], button:not([disabled])` und liess unsichtbare Kandidaten mitzählen.
  // Der Anfangsfokus bleibt «✕ schliessen» (`startFokus`) — die Schriftgrössen-
  // Knöpfe stehen im DOM davor, wären also die Vorgabe-Landung des Hooks.
  useDialogFokus(true, dialogRef, onClose, schliessRef);
  useEffect(() => {
    // A-5 Ziff. 2: die Body-Sperre gilt nur dem VOLLBILD-Dialog. Aus einem Pane
    // heraus fror sie eine Fläche ein, die gar nicht verdeckt ist.
    const vorher = document.body.style.overflow;
    if (!imPane) document.body.style.overflow = 'hidden';
    return () => { if (!imPane) document.body.style.overflow = vorher; };
  }, [imPane]);

  // Portal-Ziel (A-5): im Pane dessen Overlay-Schicht, sonst wie bisher
  // `<body>` — dort fängt ein `@container/pane`-Vorfahr sonst das
  // `position:fixed` ein (B-1-Bugcheck #7; die Messung gilt unverändert, nur
  // ist ihr Ergebnis im Pane nicht mehr das gewünschte). Default geschlossen →
  // kein SSR/Prerender-Pfad.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal={imPane ? undefined : true}
      aria-label={`Lesemodus — ${snap.zitierung}`}
      // `@container/pane` AM OVERLAY SELBST — nicht Kosmetik, sondern Bedingung
      // dafür, dass A-2 hier drinnen überhaupt greift: die Overlay-Schicht ist
      // im Pane ein GESCHWISTER des `@container/pane`-Scrollers (`Pane.tsx`),
      // ein Portal-Kind hat den Container also nicht als Vorfahr, und jede
      // `@…/pane:`-Klasse darin wäre eine Klasse, die nie feuert. Der Name ist
      // bewusst derselbe: das Overlay DECKT die Pane, seine Breite IST die
      // Pane-Breite — ein zweiter Container-Name wäre eine zweite Wahrheit über
      // dieselbe Fläche (§5), und `ui/SeitenTitel` misst ohnehin `/pane`.
      className={imPane
        ? '@container/pane pointer-events-auto absolute inset-0 z-modal overflow-y-auto bg-paper'
        : 'fixed inset-0 z-modal overflow-y-auto bg-paper'}>
      {/* Schlanke, sticky Kopfleiste: Identität + Schriftgrösse + Schliessen.
          F2-3 (31.8.2026): sie stand als `bg-paper/95` + `backdrop-blur-sm` da —
          die LETZTE Glas-Fläche dieser Rolle. `src/index.css` (`.lc-glass`, ab
          «Sticky-Chrome-Kopf (Topbar)») hat den Effekt für klebende Kopfleisten
          begründet abgeschafft: «Volldeckend statt 96 % + Blur; `backdrop-filter`
          entfällt gleich mit (ohne Transparenz wirkungslos UND Verdachtsursache
          des Scroll-Repaint-Flackerns LM-006, dieselbe Fläche)» — Anlass war der
          extern gemessene Blocker LM-001: «beim Scrollen läuft der Seiteninhalt
          sichtbar durch den oberen Rand der Kopfleiste». Genau das tat diese
          Leiste noch, und der Entscheid galt für die ROLLE, nicht für eine
          Datei. Volldeckend `bg-paper` — dieselbe opake Fläche, die auch der
          klebende Leser-Kopf (`v3/LeserKopf`) und die Lese-Zeile
          (`v3/LeserLeseZeile`) tragen. */}
      <div className="sticky top-0 z-sticky flex items-center gap-3 border-b border-line bg-paper px-5 py-2.5">
        <span className="num text-body-s font-medium text-ink-700">{snap.bgeReferenz ?? snap.zitierung}</span>
        <span className="ml-auto inline-flex items-center gap-2">
          {/* 5B-Nachzug (29.8.2026), abgestufte Fassung: Gruppen-Name und
              Knopf-Namen sagen den Scope, das SICHTBARE Wort entfällt. Begründung
              oben bei der Schlusszeile — dieses Overlay ist `aria-modal`, der
              globale App-Regler ist darunter weder sichtbar noch für den
              Screenreader da. Ein Scope-Wort löste hier also keine Verwechslung
              auf, es kostete nur Platz in einer Kopfzeile, die @390 ohnehin knapp
              ist (Zitierung + Steller + «✕ schliessen»). */}
          <span className="inline-flex items-stretch overflow-hidden rounded border border-line" role="group" aria-label="Grösse nur des Entscheidtexts">
            <button type="button" onClick={() => setFs(fsIdx - 1)} disabled={fsIdx === 0}
              aria-label="Entscheidtext verkleinern"
              className="min-h-6 px-2 py-1 text-ink-600 lc-hover-flaeche disabled:opacity-40" title="Entscheidtext verkleinern">A−</button>
            <button type="button" onClick={() => setFs(fsIdx + 1)} disabled={fsIdx === FS_STUFEN.length - 1}
              aria-label="Entscheidtext vergrössern"
              className="border-l border-line min-h-6 px-2 py-1 text-ink-600 lc-hover-flaeche disabled:opacity-40" title="Entscheidtext vergrössern">A+</button>
          </span>
          <button ref={schliessRef} type="button" onClick={onClose}
            className="lc-chip no-underline hover:text-accent-text hover:border-accent-line" title="Lesemodus schliessen (Esc)">
            ✕ schliessen
          </button>
        </span>
      </div>

      {/* A-2: die grosszügige Lese-Luft (`py-14`) galt ab FENSTERbreite 640 px —
          seit A-5 deckt dieses Overlay aber nur noch die Pane, und dort ist die
          Pane die massgebliche Fläche. Ausserhalb unverändert `sm:`. */}
      <article className={paneKlasse(imPane,
        'mx-auto w-full max-w-reading px-5 py-10 sm:py-14',
        'mx-auto w-full max-w-reading px-5 py-10 @xl/pane:py-14')}
        style={{ '--rsp-fs': `${FS_STUFEN[fsIdx]}rem` } as CSSProperties}>
        <p className="lc-overline">
          {snap.gerichtName}
          {snap.abteilung && <span className="text-ink-500"> · {snap.abteilung}</span>}
          {/* J3 (§8): Sachgebiet ist maschinell zugeordnet — im Lesemodus-Overlay
              gibt es kein StatusBadge (auch vor J3 nicht); der title ist hier der
              einzige Hinweis (Hover; auf Touch nicht erreichbar — bekannter Rest,
              Bibliotheks-Doku J3). */}
          <span className="text-accent-text" title={snap.kuratierung === 'maschinell' ? 'Sachgebiet maschinell zugeordnet' : undefined}> · {GEBIET_LABEL[snap.sachgebiet]}</span>
        </p>
        {/* A-1-Nachzug: auch das Overlay-H1 kommt aus dem einen Titel-Baustein
            (er misst hier den `@container/pane` am Overlay-Wurzelknoten, s. o.).
            Mono bleibt: der Titel IST die Zitierung. */}
        <SeitenTitel className="mt-2 num">{snap.zitierung}</SeitenTitel>
        <p className="mt-1 text-xs text-ink-500">
          <DatumMeta snap={snap} />
          {/* B-5 wie im Haupt-Kopf: kein zweiter Chip für einen Namen, den die
              H1 zwei Zeilen darüber schon wörtlich trägt. */}
          {snap.bgeReferenz && !referenzImTitel(snap.zitierung, snap.bgeReferenz) && <> · <span className="num">{snap.bgeReferenz}</span></>}
          {snap.nummerSekundaer && <> · <span className="num" title="Parallele Geschäftsnummer desselben Verfahrens">({snap.nummerSekundaer})</span></>}
        </p>

        {/* LM-014 (§8 B7): dieselben 4 Rubrum-Zeilen wie die Voll-Ansicht (Art. 112
            BGG) — der Lesemodus liess sie bisher weg, obwohl er denselben Kopf
            zitiert. Identisches Markup zur Voll-Ansicht (oben, `zeigeRubrum`-Block). */}
        {zeigeRubrum && (
          // A-2, dieselbe Regel wie im Haupt-Kopf (dort begründet).
          <dl className={paneKlasse(imPane,
            'mt-4 grid grid-cols-1 sm:grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 text-body-s',
            'mt-4 grid grid-cols-1 @xl/pane:grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 text-body-s')}>
            {kopf.rubrumZeilen.map((z) => (
              <div key={z.label} className="contents">
                <dt className="lc-overline pt-0.5">{kopfLabel[z.label]}</dt>
                <dd className={z.label === 'gegenstand' ? 'text-ink-800' : 'text-ink-700'}>
                  {z.label === 'besetzung'
                    ? <BesetzungWert freitext={z.wert} gericht={snap.gericht} refs={richterRefs} />
                    : z.wert}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {regesteText && snap.regeste && (
          <div className="mt-7">
            <RegesteBlock regeste={snap.regeste} amtlich={snap.regesteAmtlich} mitAnker={false} />
          </div>
        )}

        <div className="mt-9">
          <EntscheidBody abschnitte={abschnitte} zitierung={snap.zitierung} bgeReferenz={snap.bgeReferenz} quarantaene={snap.quarantaene} />
        </div>

        <footer className="mt-12 border-t border-line pt-5 text-body-s text-ink-500">
          <MassgeblicheFassung url={massgeblicheUrl} titel={massgeblichTitel} fehlt={massgeblichFehlt}
            className="lc-chip no-underline hover:text-accent-text hover:border-accent-line" />
          {/* B-6-Nachzug, dritte und letzte Stelle dieses Lesers (Begründung im
              Provenienz-Fuss oben). */}
          <p className="mt-3 text-micro text-ink-500 leading-relaxed">
            Der Urteilstext ist als amtliches Werk gemeinfrei (Art. 5 URG). {MASSGEBLICH_SATZ} Keine Rechtsberatung.
          </p>
        </footer>
      </article>
    </div>,
    // A-5: die Overlay-Schicht DIESES Panes, sonst `<body>` (Einzelansicht).
    ziel ?? document.body,
  );
}

