import { useEffect, type RefObject } from 'react';
import { tastendruckGehoertPane } from '../panePrioritaet';
import { istSuchKuerzel } from '../../../components/suche/fruehesSuchKuerzel';

// ─── ⌘K / «/» im V3-Leser · Vorrang vor der Header-Suche (Bug-Check B1) ──────
//
// GEFUNDEN 16.8.2026 (Bug-Check zu H1): `SuchSprungFeld` und
// `components/layout/HeaderSuche.tsx` hörten BEIDE auf `window`-keydown. Der
// Header öffnete sein Dropdown synchron, V3 holte den Fokus einen Frame später
// per `requestAnimationFrame` — Ergebnis: das Dropdown der globalen Suche stand
// offen über der Lesefläche, während der Cursor im Leser-Feld blinkte. Zwei
// Empfänger für EINE Absicht (§5, derselbe Fehlertyp wie K2).
//
// DIE VORRANGREGEL, in einem Satz: Im V3-Leser gewinnt das Such-/Sprungfeld.
// Technisch: dieser Listener hängt in der CAPTURE-Phase am `window` und ruft
// dort `preventDefault()`; `HeaderSuche` prüft am Kopf seines Handlers
// `event.defaultPrevented` und schweigt dann. Capture am `window` läuft vor
// jeder Bubble-Registrierung desselben Fensters — die Reihenfolge hängt also
// nicht daran, welche Komponente zuerst montiert wurde.
//
// WARUM EIGENES MODUL UND NICHT IM FELD: das Feld ist nicht immer im DOM. Ab
// 1024 px mit ZUGEKLAPPTER Gliederungsspalte (`tocOffen=false`) rendert der
// Rahmen weder Spalte noch Sheet — mit dem Listener im Feld tat ⌘K in genau
// dieser Lage gar nichts. Das Kürzel ist eine Zusage des RAHMENS, nicht des
// Feldes: es muss die Fläche erst öffnen und dann fokussieren. Eigene Datei
// statt Export neben der Komponente, weil `react-refresh/only-export-components`
// (Tor `lint`) in einer Komponenten-Datei keinen zweiten Export duldet.

// Die ENTSCHEIDUNG (welcher Tastendruck ist das Such-Kürzel) wohnt seit dem
// §17-Wurzel-Fix vom 4.9.2026 in `components/suche/fruehesSuchKuerzel` — dort
// braucht sie der Vorlauf, der das Kürzel schon VOR dem ersten React-Commit
// auffängt. Wortlaut und Verhalten sind unverändert umgezogen; hier steht der
// Re-Export, damit Aufrufer und Sonden diese Datei weiter befragen können und
// es die Regel nur EINMAL gibt (§5).
export { istSuchKuerzel } from '../../../components/suche/fruehesSuchKuerzel';

// A3 (H2b-Nachzug) — WELCHES PANE beansprucht den Tastendruck? Die Regel samt
// Messwerten steht in `../panePrioritaet`: sie gilt seit dem H3-Nachzug für BEIDE
// Kürzel-Wege (⌘K/«/» hier, j/k/t/r/«?» in `parts/LeserTastatur`), und eine
// zweite Kopie wäre beim ersten Nachjustieren auseinandergelaufen (§5).

export function useSuchSprungKuerzel({ feldRef, onKuerzel, imSekundaerenPane = false }: {
  /** Ziel des Fokus. Darf beim Tastendruck noch `null` sein — siehe unten. */
  feldRef: RefObject<HTMLInputElement | null>;
  /** Läuft VOR dem Fokus: öffnet die Fläche, in der das Feld steht.
   *
   *  §17-RÜCKBAU (H2b-Nachzug): SEIT Ä19/A2 braucht es das nicht mehr — das Feld
   *  ist in JEDER Lage im DOM (Spalte · klebende Kopf-Zone · offenes Blatt), und
   *  `e2e/leser-v3-suche-sprung.e2e.ts` (e) verlangt ausdrücklich, dass ⌘K die
   *  Gliederungsspalte NICHT aufzieht. Der Rahmen setzt die Prop darum nicht
   *  mehr; sie bleibt als Erweiterungspunkt für eine Fläche, die es heute nicht
   *  gibt — ein Aufrufer, der sein Feld erst bauen muss, hätte hier den Ort. */
  onKuerzel?: () => void;
  /** A3 — Rolle des Panes, in dem dieser Leser steckt. Vorgabe `false` deckt die
   *  Einzelansicht und das primäre Pane; nur der sekundäre Leser setzt `true`. */
  imSekundaerenPane?: boolean;
}) {
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (!istSuchKuerzel(e)) return;
      // A3: erst die Zuständigkeit, dann alles andere — ein fremdes Pane darf
      // weder `preventDefault` rufen noch Fokus ziehen.
      if (!tastendruckGehoertPane(imSekundaerenPane)) return;
      // Muss VOR `onKuerzel` stehen: die Vorrangregel gilt auch dann, wenn das
      // Öffnen der Fläche wirft oder nichts zu tun hat.
      e.preventDefault();
      onKuerzel?.();
      // W2·29 S5 (Flacker-Wurzel leser-v3-blatt (a)/(c), gemessen 23.9.2026):
      // das Feld steht seit Ä19/A2 in JEDER Lage im DOM — der Fokus kommt darum
      // SOFORT, im selben Tastendruck. Bis hierher kam er immer einen Frame
      // später (rAF); unter Last fiel dieser Frame hinter den nächsten Schritt
      // (Lesen des Fokus, Fokus in ein anderes Pane) und zog den Fokus dort
      // nachträglich weg. Nur wenn das Feld (noch) fehlt oder nicht fokussierbar
      // ist — `onKuerzel` baut es erst —, wird einen Frame später nachgereicht.
      const feld = feldRef.current;
      feld?.focus();
      if (!feld || document.activeElement !== feld) {
        requestAnimationFrame(() => feldRef.current?.focus());
      }
    };
    window.addEventListener('keydown', taste, { capture: true });
    return () => window.removeEventListener('keydown', taste, { capture: true });
  }, [onKuerzel, feldRef, imSekundaerenPane]);
}
