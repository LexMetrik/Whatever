import { useEffect, useRef, type RefObject } from 'react';
import { naechsterFokus } from '../../lib/normtext/fokus';

// Selektor für nativ fokussierbare Elemente — dieselbe Grundliste wie im
// NormPopover-Overlay (components/vorlagen/ui.tsx), damit alle Dialoge dieselbe
// Fokus-Falle verwenden (§5: eine Quelle für das Verhalten).
//
// `summary` (PE-H1-D02, 1.10.2026): die Kopfzeile einer `<details>`-Klappe ist
// nativ fokussierbar (Enter/Space schalten); ohne sie sprang Tab über die Klappe.
const FOKUSSIERBAR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Standard-Prüfung «ist das Element gezeichnet?» (Layout-Frage, braucht einen
 * Browser). `checkVisibility` (Chromium 105+, Safari 17.4+, Firefox 106+) kennt
 * `display: none`, `visibility: hidden` UND `content-visibility`-versteckte
 * Teilbäume — also genau den Zustand der Inhalte einer zugeklappten `<details>`.
 * Ohne die Methode bleibt der alte `offsetParent`-Test (blind für `<details>`,
 * dort fängt `fokusziele` das Strukturelle selbst ab).
 */
export function layoutSichtbar(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === 'function') {
    return el.checkVisibility({ visibilityProperty: true });
  }
  return el.offsetParent !== null;
}

/**
 * Die Elemente innerhalb von `wurzel`, auf die Tab TATSÄCHLICH wandern kann —
 * Grundlage der Fokus-Falle (Befund 1.10.2026, PE-H1-D01 + Erlass-Blatt).
 *
 * Ursache des Befunds: die Links einer ZUGEKLAPPTEN `<details>` blieben
 * Kandidaten (in Chromium `offsetParent` ≠ null), `focus()` auf sie ist aber
 * wirkungslos — Tab hing 5× im Suchfeld bzw. auf «schliessen». Ausgeschlossen
 * wird darum, was nicht fokussierbar IST:
 *  - alles in einer zugeklappten `<details>`, ausser deren eigenes `<summary>`,
 *  - `inert`-Teilbäume,
 *  - Ungezeichnetes (`sichtbar`, Standard `layoutSichtbar`).
 * Das gerade fokussierte Element (`aktiv`) bleibt in jedem Fall Kandidat, damit
 * der Index des Tab-Schritts stimmt.
 *
 * `aktiv`/`sichtbar` sind Parameter, damit die Auswahl in der Test-Umgebung
 * ohne Layout prüfbar ist (`src/tests/dialog-fokus-ziele.test.ts`).
 */
export function fokusziele(
  wurzel: ParentNode,
  aktiv: Element | null = document.activeElement,
  sichtbar: (el: HTMLElement) => boolean = layoutSichtbar,
): HTMLElement[] {
  return Array.from(wurzel.querySelectorAll<HTMLElement>(FOKUSSIERBAR)).filter((el) => {
    if (el === aktiv) return true;
    if (el.closest('[inert]') != null) return false;
    const zu = el.closest('details:not([open])');
    if (zu != null && !(el.tagName === 'SUMMARY' && el.parentElement === zu)) return false;
    return sichtbar(el);
  });
}

/**
 * Dialog-/Overlay-Fokusverwaltung nach ARIA-Dialog-Pattern (WCAG 2.4.3):
 *  - setzt beim Öffnen den Fokus in den Container (erstes fokussierbares Element
 *    oder den Container selbst — dieser braucht `tabIndex={-1}`),
 *  - hält Tab/Shift+Tab zyklisch im Container (Fokus-Falle; reine Index-Logik in
 *    `naechsterFokus`, hier nur die DOM-Verdrahtung — identisch zum NormPopover),
 *  - schliesst bei Escape,
 *  - gibt den Fokus beim Schliessen an das zuvor fokussierte Element (den
 *    Auslöser) zurück.
 *
 * `onClose` darf instabil sein (wird über eine Ref gelesen → der Effekt hängt
 * nur an `offen`, re-fokussiert also nicht bei jedem Render).
 *
 * `startFokus` (optional, Runde 2 · 31.8.2026): Element, das den Anfangsfokus
 * bekommt, wenn das erste fokussierbare Element NICHT die sinnvolle Landung ist.
 * Gebraucht vom Lesemodus-Overlay, dessen Kopfleiste mit den Schriftgrössen-
 * Knöpfen beginnt und dessen erste sinnvolle Landung «✕ schliessen» ist. Ohne
 * die Angabe bleibt es beim ARIA-Dialog-Standard (erstes fokussierbares Element).
 */
export function useDialogFokus(
  offen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  startFokus?: RefObject<HTMLElement | null>,
): void {
  const onCloseRef = useRef(onClose);
  // Stets die aktuelle onClose halten, ohne sie zur Effekt-Abhängigkeit zu machen
  // (Schreiben im Effekt, nicht im Render — react-hooks/refs).
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!offen) return;
    const wurzel = containerRef.current;
    if (wurzel == null) return;

    // Auslöser merken, um den Fokus beim Schliessen zurückzugeben.
    const vorherFokussiert = document.activeElement as HTMLElement | null;

    const sammle = () => fokusziele(wurzel);

    // Initialen Fokus in den Dialog setzen (sonst bleibt er auf dem Auslöser).
    (startFokus?.current ?? sammle()[0] ?? wurzel).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      // Bei jedem Tab frisch einsammeln (Inhalt kann sich ändern).
      const fokussierbar = sammle();
      if (fokussierbar.length === 0) {
        e.preventDefault();
        wurzel.focus();
        return;
      }
      const aktiv = fokussierbar.indexOf(document.activeElement as HTMLElement);
      const ziel = naechsterFokus(fokussierbar.length, aktiv, e.shiftKey);
      if (ziel < 0) return;
      e.preventDefault();
      fokussierbar[ziel].focus();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (vorherFokussiert && typeof vorherFokussiert.focus === 'function') {
        vorherFokussiert.focus();
      }
    };
  }, [offen, containerRef, startFokus]);
}
