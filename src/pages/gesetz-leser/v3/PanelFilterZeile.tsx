import { useId, useState, type ReactNode } from 'react';
import { BezugFacettenWahl } from '../../../components/verzahnung/BezugFacettenWahl';
import { BezugZeitWahl } from '../../../components/verzahnung/BezugZeitWahl';
import type { BezugStatus } from '../../../lib/verzahnung/facetten';
import type { KlassenZahlen } from '../../../lib/rechtsprechung/bezuege';
import type { Histogramm, Zeitbereich } from '../bezugZeit';
import { instanzStand, zeitStand } from './panelModell';
import { PanelSachgebiet } from './PanelSachgebiet';

// ═══ Ä54 (H3-Nachzug) · EINE Filterzeile, nicht vier Steuer-Blöcke ═══════════
//
// BEFUND, gemessen 17.8.2026 @1440 an der StPO: was H3 «Filterzeile» nannte, war
// der unveränderte Inhalt des Kopf-Dropdowns — Instanz-Schalter, DREI Erklär-
// Absätze, der Link «Zeichenerklärung», das Jahres-Histogramm und zwei native
// `type=date`-Felder. Höhe des Blocks **348 px**, die erste Entscheid-Gruppe
// begann bei y = 540, also 352 px unter dem Panel-Kopf. Am leeren Kantonserlass
// (BS-640.100) standen vier Steuer-Blöcke vor dem EINEN Satz «kein Entscheid …
// erfasst». Die Skizze (Kap. 4d) verspricht dagegen genau eine Zeile:
// «Instanz ▾ Kanton ▾ Zeit ▾ (Sachgebiet ▾)».
//
// ── WAS SICH ÄNDERT UND WAS NICHT ───────────────────────────────────────────
// Die DATENLOGIK bleibt Zeichen für Zeichen dieselbe: `BezugFacettenWahl` und
// `BezugZeitWahl` sind unverändert die GETEILTEN Bausteine (V1 mountet sie im
// Kopf-Dropdown, FL-4 — sie werden hier nicht umgebaut und nicht kopiert), und
// die Auswahl läuft weiter durch `bezugAuswahl`/`bezugZeit`. Neu ist nur, dass
// sie hinter einer Disclosure liegen: die Zeile trägt zwei Knöpfe, die den
// aktuellen Stand NENNEN, und öffnet den vollen Baustein erst auf Verlangen.
//
// ── WARUM DISCLOSURE UND NICHT POPOVER (Entscheid, deklariert) ──────────────
// Ein schwebendes Popover braucht Positionierung, eine Auto-Zu-Regel und eine
// zweite z-Ebene — INNERHALB des Panel-Scrollers, der selbst schon in einer
// Overlay-Schicht liegt. Die Disclosure klappt an ihrem Ort auf; der Panel-
// Scroller ist die eine Fläche, die scrollt (dieselbe Regel wie im Blatt).
// Nebenwirkung, die genau erwünscht ist: die Erklär-Absätze der geteilten
// Bausteine sind mit eingeklappt — «Erklärtext auf Verlangen» ohne ein zweites
// Tooltip-Gerüst (Design-Grundlage Kap. 8: Hover/Scroll verbirgt nie Funktion —
// eine benannte Disclosure verbirgt nichts, sie kündigt an).
//
// ── ZWEI KNÖPFE FÜR DREI FACETTEN DER SKIZZE (deklarierte Abweichung) ───────
// «Kanton ▾» hat KEINEN eigenen Knopf: der Kanton-Feinschnitt ist ein Teil von
// `BezugFacettenWahl` und erscheint dort nur, solange die kantonale Klasse
// eingeschaltet ist (§13 F4 — ein Kanton-Schalter ohne kantonale Instanz hätte
// nichts zu schneiden). Diese Regel gehört dem geteilten Baustein; ein eigener
// Knopf hätte sie hier nachbauen müssen, also eine zweite Wahrheit über
// Wirksamkeit (§5). Der Knopf «Instanzen» nennt darum beides.
//
// §3: reine Anordnung. Diese Datei kennt keine Auswahl-Regel — sie zeigt, was
// gewählt IST, und reicht die Rückrufe unverändert weiter.

// Die beiden Kurzstände (`instanzStand`/`zeitStand`) sind reine Funktionen und
// liegen in `./panelModell` — eine Komponenten-Datei darf nichts anderes
// exportieren (`react-refresh/only-export-components`, Tor `lint`), und ohne
// Browser prüfbar sind sie dort ohnehin besser aufgehoben (§6.7).

function Klappe({ id, name, stand, offen, setOffen, kinder }: {
  id: string;
  name: string;
  stand: string;
  offen: boolean;
  setOffen: (o: boolean) => void;
  kinder: ReactNode;
}) {
  return (
    <>
      <button type="button" data-v3-panel-klappe={id}
        aria-expanded={offen} aria-controls={offen ? `${id}-inhalt` : undefined}
        onClick={() => setOffen(!offen)}
        title={`${name} wählen — aktuell: ${stand}`}
        className={`inline-flex min-h-7 items-center gap-1.5 border px-2 py-0.5 text-micro text-ink-900 transition-colors ${
          offen ? 'border-ink-900 bg-well' : 'border-line-strong bg-paper lc-hover-flaeche'
        }`}>
        <span>{name}</span>
        <span className="num text-ink-600">{stand}</span>
        <span aria-hidden className={`transition-transform ${offen ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {offen && <div id={`${id}-inhalt`} data-v3-panel-klappe-inhalt={id} className="w-full">{kinder}</div>}
    </>
  );
}

export function PanelFilterZeile({
  klassen, kantone, kantoneVerfuegbar, klassenZahlen, zahlOrt, histogramm, bereich,
  onKlassen, onKantone, onBereich,
}: {
  klassen: readonly BezugStatus[];
  kantone: readonly string[];
  kantoneVerfuegbar: readonly string[];
  /** S6-W1b · D-9: Zahlen je Instanz am gelesenen ARTIKEL (nicht mehr am
   *  Erlass) — dieselbe Bezugsgrösse wie die Liste darunter. */
  klassenZahlen: Partial<Record<BezugStatus, KlassenZahlen>>;
  /** Wo die Zahlen gelten, als Wortlaut («an Art. 41»). */
  zahlOrt: string;
  histogramm: Histogramm;
  bereich: Zeitbereich;
  onKlassen: (neu: BezugStatus[]) => void;
  onKantone: (neu: string[]) => void;
  onBereich: (von: string, bis: string) => void;
}) {
  const basis = useId();
  const [auf, setAuf] = useState<'instanzen' | 'zeit' | null>(null);

  return (
    <div data-v3-panel-filter className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-2">
      <Klappe id={`${basis}-instanzen`} name="Instanzen" stand={instanzStand(klassen)}
        offen={auf === 'instanzen'} setOffen={(o) => setAuf(o ? 'instanzen' : null)}
        kinder={(
          <BezugFacettenWahl klassen={klassen} kantone={kantone} kantoneVerfuegbar={kantoneVerfuegbar}
            klassenZahlen={klassenZahlen} zahlOrt={zahlOrt} onKlassen={onKlassen} onKantone={onKantone} />
        )} />
      <Klappe id={`${basis}-zeit`} name="Zeitraum" stand={zeitStand(bereich)}
        offen={auf === 'zeit'} setOffen={(o) => setAuf(o ? 'zeit' : null)}
        kinder={<BezugZeitWahl bereich={bereich} histogramm={histogramm} onBereich={onBereich} />} />
      {/* Vierter Filter — heute ohne Daten und darum ohne Element (Kap. 14).
          Die Datenlogik bleibt `W2·7-VZUI-SACHGEBIET` (Risikopfad). */}
      <PanelSachgebiet gebiete={[]} gewaehlt={[]} onGebiete={() => {}} />
    </div>
  );
}
