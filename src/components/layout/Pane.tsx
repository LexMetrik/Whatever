import { useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { createPath, parsePath, UNSAFE_NavigationContext, type Location, type To } from 'react-router-dom';
import { RouteSwitch } from '../../RouteSwitch';
import { PaneProvider } from './PaneKontext';
import { PaneKopf } from './PaneKopf';
import { RouteHuelle } from './RouteHuelle';
import { InhaltsKopfMeldeProvider, type KopfDaten } from './InhaltsKopfKontext';
import { rahmenbreiteKlasse } from './seitenbreite';

// ─── Sekundäres Split-View-Pane («Browser-Fenster»-Modell) ──────────────────
//
// Autonome, voll navigierbare Sicht neben dem primären Pane. Aufbau:
//   Spalte (flex-col)
//     ├─ PaneKopf            (Titelleiste: Label·Stand·⠿·◂▸·Hauptfenster·teilen·✕)
//     └─ relative-Wrapper
//          ├─ Scroll-div (@container/pane, overflow) ── der Inhalt (RouteSwitch)
//          └─ Overlay-div (absolute, pointer-events-none) ── Drawer/Suche portalieren
//             hierhin → bleiben IM Pane (kein fixed-Bleed über beide Panes).
//
// EIGENE History + Navigator (UNSAFE_NavigationContext): Links/Breadcrumbs/zurück
// wirken NUR im Pane, nie im primären BrowserRouter. §5/§8: kein RouteMeta/
// TabTracker; zustandslos (nur Pfade). §3: reine Darstellung.

function toStr(to: To): string {
  return typeof to === 'string' ? to : createPath(to);
}

// A-6 (31.8.2026): der frühere lokale `Laden()`-Platzhalter ist ersatzlos weg —
// er war die dritte Kopie des Ladezustands und trug als einzige KEINE
// Höhenreservierung. Fade, Fallback und Fehler-Reset kommen jetzt aus
// `./RouteHuelle` (Herleitung dort), also aus derselben Quelle wie im
// Hauptfenster (§5/§10).

export interface SekundaerPaneProps {
  pfad: string;
  label: string;
  /** L6: der Name dieses Fensters als fertiges Element — s. `PaneKopf.kurzform`.
   *  Wird nur durchgereicht; gebaut wird er in `./PaneName` (§5/§15). */
  kurzform?: ReactNode;
  stand?: string | null;
  onSchliessen: () => void;
  onHauptfenster: () => void;
  onTeilen?: () => void;
  /** Quittungs-Zustand von `onTeilen`, durchgereicht an `PaneKopf` (Runde 8, #692-Nachzug). */
  teilenKopiert?: boolean;
  onLinks?: () => void;
  onRechts?: () => void;
  kannLinks?: boolean;
  kannRechts?: boolean;
  ziehbar?: boolean;
  /** flex-grow u. a. für die ziehbare Pane-Breite (nur ab lg gesetzt). */
  style?: CSSProperties;
  /** Meldet die LIVE-Location des Panes (Seed-pfad, aktuelle Location) nach In-Pane-
   *  Navigation (für Titel/teilen/promote). (pfad, loc) → stabile Shell-Callback. */
  onNavigiert?: (pfad: string, loc: string) => void;
  /** Drag-Drop: Griff (Kopf) + Spalte (Drop-Ziel). */
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
  /** true = Drop-Indikator an dieser Spalte zeigen. */
  ueber?: boolean;
}

export function SekundaerPane(props: SekundaerPaneProps) {
  const { pfad, label, kurzform, stand, onSchliessen, onHauptfenster, onTeilen, teilenKopiert, onLinks, onRechts,
    kannLinks, kannRechts, ziehbar, style, onNavigiert, onDragStart, onDragEnd, onDragOver, onDrop, ueber } = props;
  const wurzel = useRef<HTMLElement>(null);
  const overlayWurzel = useRef<HTMLDivElement>(null);
  // F: Kopfdaten DIESES Panes (Breadcrumb + laufender Artikel), die der Inhalt
  // (Gesetz-Leser) über den nächsten Melde-Provider meldet → in den PaneKopf.
  const [kopf, setKopf] = useState<KopfDaten | null>(null);
  // Pane-eigene History + Navigator.
  const elternNav = useContext(UNSAFE_NavigationContext);
  const [hist, setHist] = useState<{ stack: string[]; idx: number }>({ stack: [pfad], idx: 0 });
  const loc = hist.stack[hist.idx];
  // Live-Location nach oben melden (Titelleiste/teilen/promote/Dedup nutzen den
  // AKTUELL gezeigten Pfad, nicht den Anfangs-pfad). Der Pane-Key bleibt der
  // Seed-pfad → kein Remount bei In-Pane-Navigation.
  useEffect(() => { onNavigiert?.(pfad, loc); }, [pfad, loc, onNavigiert]);
  // Breadcrumb-Klick in der Titelleiste navigiert PANE-LOKAL (David 1.7.2026):
  // dieselbe push-Semantik wie der Pane-Navigator (neuer Stack-Eintrag hinter dem
  // aktuellen Index), nie der globale Router. setHist ist stabil → Deps []. §15/4.
  const navigiere = useCallback((to: string) => setHist((h) => {
    const stack = [...h.stack.slice(0, h.idx + 1), to];
    return { stack, idx: stack.length - 1 };
  }), []);
  const navKontext = useMemo(() => ({
    ...elternNav,
    static: false,
    navigator: {
      ...elternNav.navigator,
      createHref: (to: To) => toStr(to),
      encodeLocation: (to: To) => parsePath(toStr(to)) as Location,
      go: (delta: number) => setHist((h) => ({ ...h, idx: Math.max(0, Math.min(h.stack.length - 1, h.idx + delta)) })),
      push: (to: To) => setHist((h) => {
        const stack = [...h.stack.slice(0, h.idx + 1), toStr(to)];
        return { stack, idx: stack.length - 1 };
      }),
      replace: (to: To) => setHist((h) => {
        const stack = [...h.stack]; stack[h.idx] = toStr(to);
        return { stack, idx: h.idx };
      }),
    },
  }), [elternNav]);
  return (
    <PaneProvider value={{ imPane: true, rolle: 'sekundaer', wurzel, overlayWurzel }}>
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={style}
        className={`flex flex-col flex-1 min-w-0 border-l ${ueber ? 'border-l-2 border-l-rule' : 'border-rule-soft'} max-lg:flex-none max-lg:w-full max-lg:snap-start`}
      >
        <PaneKopf
          label={label} kurzform={kurzform} stand={stand} breadcrumb={kopf?.breadcrumb} onBreadcrumb={navigiere} artikel={kopf?.artikel} rolle="sekundaer"
          // A-2: trägt der Pane-Inhalt seine Kopfzeile selbst, bleibt hier die
          // reine Fenster-Steuerung (Vertrag `KopfDaten.kopfzeileSelbst`).
          nurSteuerung={kopf?.kopfzeileSelbst}
          onSchliessen={onSchliessen} onHauptfenster={onHauptfenster} onTeilen={onTeilen} teilenKopiert={teilenKopiert}
          onLinks={onLinks} onRechts={onRechts} kannLinks={kannLinks} kannRechts={kannRechts}
          ziehbar={ziehbar} onDragStart={onDragStart} onDragEnd={onDragEnd}
        />
        <div className="relative flex-1 min-h-0">
          <section ref={wurzel} aria-label={label} tabIndex={-1} data-pane="sekundaer"
            /* Ring/Farbe aus der globalen `:focus-visible`-Regel (index.css,
               Rolle --focus); lokal bleibt NUR der negative Offset — die
               Pane-Fläche ist ein Scroll-Container, ein aussenliegender Ring
               läge ausserhalb ihrer Kante und würde geclippt. */
            className="@container/pane absolute inset-0 overflow-y-auto overscroll-contain focus-visible:-outline-offset-2">
            {/* A-2-WURZEL (R2-A, 31.8.2026): die Polsterung dieses Wrappers
                hing am VIEWPORT (`sm:px-6`), obwohl sie im Pane sitzt — ein
                schmales Pane auf einem breiten Bildschirm bekam die weite
                Polsterung, ein breites Pane auf einem schmalen Gerät die enge.
                Genau daraus sind die zwei deklarierten `sm:`-Ausnahmen im
                EntscheidLeser entstanden (die klebende Leiste muss bündig an
                dieselbe Kante). Jetzt Container-Query auf `@container/pane`
                (das Elternteil `<section>` oben).
                SCHWELLE `@xl/pane` (36 rem) IST NICHT FREI GEWÄHLT: sie ist die
                Haus-Abbildung von `sm:` (gesetzt von `ui/SeitenTitel` in A-1,
                festgeschrieben in der A-2-Paritätssonde `PAAR` in
                `src/tests/entscheid-leser-b2.test.tsx`). Genau diese Zahl muss
                es sein, weil die klebende Leiste des EntscheidLesers mit
                `-mx-…/px-…` an DIESE Kante bündig zieht: eine andere Schwelle
                hier hiesse zwei Massstäbe für eine Kante — der Fehler, den die
                dortige Ausnahme-Begründung ausdrücklich vermeiden will.
                Ausserhalb eines Panes rendert dieser Wrapper nie — darum kein
                `pk()`, das hier ohnehin den Eltern-Kontext läse
                (`imPane: false`). Die Breite folgt der Seitenart DIESER
                Pane-Location (W2·31 B1a, `./seitenbreite`). */}
            <div className={`mx-auto w-full ${rahmenbreiteKlasse(loc, 'pane')} px-5 @xl/pane:px-6 py-6`}>
              <UNSAFE_NavigationContext.Provider value={navKontext}>
                <InhaltsKopfMeldeProvider value={setKopf}>
                  {/* A-6: dieselbe Routen-Hülle wie im Hauptfenster. Schlüssel ist
                      der PFAD der Pane-Location ohne Query — der Such-Parameter
                      einer Katalog-Seite darf im Pane so wenig remounten wie
                      dort (`App.tsx`). */}
                  <RouteHuelle schluessel={parsePath(loc).pathname ?? loc}>
                    <RouteSwitch location={loc} />
                  </RouteHuelle>
                </InhaltsKopfMeldeProvider>
              </UNSAFE_NavigationContext.Provider>
            </div>
          </section>
          {/* Overlay-Schicht: Pane-Drawer portalieren hierhin (absolute → im Pane). */}
          <div ref={overlayWurzel} className="pointer-events-none absolute inset-0 overflow-hidden" />
        </div>
      </div>
    </PaneProvider>
  );
}
