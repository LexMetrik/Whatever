import type { ReactNode } from 'react';
import { ErgebnisSprung, LiveHeader } from './vorlagen/ui';

// ─── Geteilter Ergebnisblock-Rahmen (DESIGN-REGLEMENT §R-4) ─────────────────
// EIN Rahmen für jedes Rechner-Ergebnis: Sprungmarke (mobil), Live-Hinweis,
// Einblendung und EINE aria-live-Region. Vorher trugen die Formulare diese
// vier Stücke in wechselnden Teilmengen (Audit 11.6.2026: Sprung fehlte in
// 10, reveal/aria in 10, LiveHeader in 2 von 16 Formularen).
//
// id: Standard `lc-ergebnis`; Formulare, die gemeinsam auf einer Seite
// gerendert werden können (Tagerechner-Teilformulare, Kombinierte Ansicht),
// übergeben eindeutige Suffixe — doppelte DOM-ids brechen die Sprungmarke.
// sprung={false} für Blöcke, die ohnehin im ersten Viewport stehen (Schnell-
// rechner) oder neben einem zweiten Ergebnisblock leben — die Sprungmarke ist
// fixed positioniert, zwei Stück würden sich überlagern.
export function ErgebnisBlock({ id = 'lc-ergebnis', live = true, sprung = true, children }: {
  id?: string;
  live?: boolean;
  sprung?: boolean;
  children: ReactNode;
}) {
  // QS-UI 8b (4.8.2026): Die Sprungmarke steht NEBEN dem Block, nicht darin.
  // Sie ist `position: fixed` und lag zuvor im `lc-reveal`-Wrapper — dessen
  // Einblendung animiert ein `transform`, und ein transformierter Vorfahr wird
  // zum enthaltenden Block für `fixed`. Während der 220 ms Einblendung sass die
  // Marke darum nicht in der Bildschirmecke, sondern irgendwo am Block;
  // gemessen und vom neuen Tor `e2e/qsui-hierarchie.e2e.ts` rot gezeigt.
  // Zwei Nebenwirkungen, beide erwünscht: (a) die Marke liegt nicht mehr in der
  // `aria-live`-Region — ihr Auftauchen und Verschwinden war bisher eine
  // Ergebnis-Ansage, obwohl sich am Ergebnis nichts ändert; (b) der Innenabstand
  // des Blocks sprang, je nachdem ob die Marke gerade eingeblendet war — sie war
  // das erste Kind und trug darum keine `space-y-4`-Oberkante, der LiveHeader
  // dahinter dann eine; und die Marke blendet sich per IntersectionObserver aus.
  // Isoliert gemessen (nur diese Änderung, `/rechner/verjaehrung`, Abstand
  // Blockanfang → erste Eckdaten-Kachel): 52→42 px auf 1280×800 und 63→47 px auf
  // 390×844, also **10 px bzw. 16 px** — NICHT die vollen 1 rem, die der reine
  // Margin-Wechsel (16→0 px am LiveHeader) nahelegt, weil sich die Höhe des
  // inline-flex-LiveHeaders als erstes Kind mitverändert. Der Abstand ist jetzt
  // konstant, und zwar auf dem Wert, den der Block ohnehin hatte, sobald das
  // Ergebnis im Bild stand.
  return (
    <>
      {sprung && <ErgebnisSprung zielId={id} />}
      <div id={id} className="lc-reveal space-y-4" aria-live="polite">
        {live && <LiveHeader />}
        {children}
      </div>
    </>
  );
}
