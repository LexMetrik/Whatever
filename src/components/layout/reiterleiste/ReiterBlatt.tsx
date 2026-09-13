import { lazy, Suspense, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { letzterGeschlossener, reiterKurzformText, type TabEintrag } from '../../../lib/tabs';
import type { VerlaufManifeste } from '../../../lib/verlaufLabel';
import { Leerzustand } from '../../ui/Leerzustand';

// ═══ DAS ÜBERLAUF-BLATT (§6.6-Split aus `Reiterleiste.tsx`, R13) ════════════
//
// EIN Blatt für Überlauf (Desktop) und die schmale Ansicht (§5a Ziff. 5 + 8).
// Inhalt ist die gruppierte Liste `TabPanel`, also genau das, was das abgelöste
// ☰-Flyout zeigte, zusätzlich mit Suchfeld.

// ── §15 · AUCH DAS ÜBERLAUF-BLATT ERST BEIM ÖFFNEN ─────────────────────────
// Das Blatt rendert ausschliesslich im Portal hinter `offen`, zieht aber mit
// `TabPanel` die ganze Gruppier-Achse (`lib/tabGruppen`, `HerkunftIcon`) in den
// Start-Chunk. Wer nie auf «+N» klickt — die Mehrheit —, lädt sie umsonst.
// Logikverlust: keiner, dieselbe Komponente, nur später.
const TabPanel = lazy(() => import('../TabPanel').then((m) => ({ default: m.TabPanel })));

export function ReiterBlatt({
  blattRef, tabs, gefiltert, manifeste, aktivSchluessel, suche, onSuche,
  onNavigate, onSchliessen, onDaneben, paneOffen, onNeu, onWieder, onAlle, onZu,
}: {
  blattRef: RefObject<HTMLDivElement | null>;
  tabs: TabEintrag[];
  gefiltert: TabEintrag[];
  manifeste: VerlaufManifeste;
  aktivSchluessel: string;
  suche: string;
  onSuche: (s: string) => void;
  onNavigate: (path: string) => void;
  onSchliessen: (path: string) => void;
  onDaneben?: (path: string) => void;
  paneOffen: (path: string) => boolean;
  onNeu: () => void;
  onWieder: () => void;
  onAlle: () => void;
  onZu: () => void;
}) {
  const wieder = letzterGeschlossener();
  return createPortal(
    <div className="fixed inset-0 z-overlay">
      <div className="lc-scrim-voll absolute inset-0" onClick={onZu} aria-hidden />
      <div ref={blattRef} tabIndex={-1} role="dialog" aria-label="Alle geöffneten Reiter"
        className="lc-schwebeflaeche absolute right-2 top-2 max-h-[80vh] w-[22rem] max-w-[calc(100vw-1rem)] overflow-y-auto p-2 focus:outline-none">
        <label className="mb-2 block">
          <span className="sr-only">Offene Reiter durchsuchen</span>
          <input type="search" value={suche} onChange={(e) => onSuche(e.target.value)}
            placeholder="Reiter suchen" className="lc-input h-9 w-full py-0 text-body-s" />
        </label>
        {/* D19 · derselbe Browser-«+» zusätzlich im Blatt: die schmale
            Ansicht (§5a Ziff. 8) wechselt bei drei und mehr Reitern auf
            dieses durchsuchbare Blatt als Haupt-Weg zu den Reitern — der
            «+» gehört dort dazu, ohne erst den Streifen dahinter zu
            verlassen. Der Streifen-Knopf bleibt daneben unverändert
            erreichbar (fixe Breite, nicht Teil der scrollenden Fläche). */}
        <button type="button" onClick={onNeu}
          title="Neuer Reiter (Alt+T)" className="lc-btn-outline lc-btn-sm mb-2 w-full">
          <span aria-hidden className="lc-griff-glyph mr-1">+</span>Neuer Reiter
        </button>
        <Suspense fallback={null}>
          <TabPanel
            tabs={gefiltert}
            manifeste={manifeste}
            aktivSchluessel={aktivSchluessel}
            onNavigate={onNavigate}
            onSchliessen={onSchliessen}
            onDaneben={onDaneben}
            paneOffen={paneOffen}
          />
        </Suspense>
        {gefiltert.length === 0 && (
          <div className="px-2 py-3">
            {/* D-7: EIN Leerzustands-Baustein für «hier ist nichts» — die
                Suche filtert einen BESTAND, der Weiterweg ist das Leeren
                des Feldes. */}
            <Leerzustand art="filter" text={`Kein offener Reiter passt zu «${suche.trim()}».`}
              weiterweg={{ text: 'Filter leeren', onKlick: () => onSuche('') }} />
          </div>
        )}
        {/* M3 · DIE RÜCKFAHRKARTE, SICHTBAR. Alt+Shift+T kennt niemand,
            der es nicht gesagt bekommt — und «Alle schliessen» direkt
            darunter ist genau die Geste, nach der man sie am dringendsten
            braucht. Steht nur da, wenn der Ring etwas hergibt. */}
        {wieder && (
          <div className="mt-1 border-t border-rule-soft pt-1">
            <button type="button" onClick={onWieder}
              title="Zuletzt geschlossenen Reiter wiederherstellen (Alt+Shift+T)"
              className="lc-btn-outline lc-btn-sm w-full">
              <span aria-hidden className="lc-griff-glyph mr-1">↩</span>
              Wieder öffnen: {reiterKurzformText(wieder, manifeste)}
            </button>
          </div>
        )}
        {/* ── R13-7 · DIE TASTATURWEGE STEHEN IRGENDWO ─────────────────────
            GEMESSEN 7.9.2026: Alt+1…9 und Alt+⇧+←/→ funktionierten, sichtbar
            waren nur «Neuer Reiter (Alt+T)» und die zwei Kürzel im
            Kontextmenü. Ein Weg, den niemand lernt, ist keiner. Das Blatt ist
            die EINE Fläche, die ohnehin alle Reiter führt — hier steht die
            Liste vollständig, ohne jeden Reiter damit zu beschriften (die
            tragen ihr eigenes Kürzel im `title`/`aria-keyshortcuts`).
            NUR WAS MAN WIRKLICH BEKOMMT (§8): Ctrl+Tab fängt der Browser für
            seine eigenen Tabs ab (gemessen wirkungslos) und steht darum NICHT
            hier — angeboten wird Alt+Bild↑/↓. */}
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 border-t border-rule-soft pt-2 text-micro text-ink-500">
          {([
            ['Alt+T', 'Neuer Reiter'],
            ['Alt+W', 'Reiter schliessen'],
            ['Alt+1…8', 'zu Reiter 1…8'],
            ['Alt+9', 'zum letzten Reiter'],
            ['Alt+Bild↑/↓', 'einen Reiter zurück/vor'],
            // W2·18 Welle 2 Punkt 2: das Pendeln steht MIT in der Liste — ein
            // Kürzel, das niemand lernt, ist keines (R13-7).
            ['Alt+Q', 'zum zuletzt benutzten Reiter'],
            ['Alt+⇧+←/→', 'Reiter verschieben'],
            ['Alt+⇧+T', 'zuletzt geschlossenen zurück'],
          ] as const).map(([k, was]) => (
            <div key={k} className="contents">
              <dt className="num whitespace-nowrap">{k}</dt>
              <dd className="truncate">{was}</dd>
            </div>
          ))}
        </dl>
        {tabs.length > 1 && (
          <div className="mt-1 border-t border-rule-soft pt-1">
            <button type="button" onClick={onAlle} className="lc-btn-outline lc-btn-sm w-full">
              Alle schliessen
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
