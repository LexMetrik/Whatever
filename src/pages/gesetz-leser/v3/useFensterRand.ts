import { useLayoutEffect, type RefObject } from 'react';

// ─── D-1 (Entscheid David 23.9.2026) · DAS ERLASS-BLATT SCHLIESST AM FENSTERRAND AN ─
//
// Bis hierher schloss das Blatt (Gestalt `'rechts'`) an der rechten Kante der
// LESE-ZELLE an (D33, 7.9.2026). Gemessen 23.9.2026 an OR Art. 257d (Audit D,
// Nachmessung S6-W1a, lokaler Build): es deckte bei offener Gliederung 50–57 %
// des sichtbaren Artikeltexts, während rechts daneben 24 px (@1024) bis 424 px
// (@1920) Fensterfläche frei blieben. David 23.9.2026: «An den Fensterrand».
//
// WARUM GEMESSEN UND NICHT `fixed right-0`: die SENKRECHTE Lage bleibt die von
// D33 — `sticky` in der Lese-Zelle, «tiefer von beiden» aus natürlicher Lage
// unter dem Kopf und `--nt-stick` beim Scrollen, ohne Scroll-Listener. Ein
// `fixed`-Blatt müsste die natürliche Lage bei jedem Scrollschritt nachrechnen
// (genau der Ä52/D33-Befund: 47 px zu hoch über dem Öffner). Also bleibt die
// Hülle, wo sie ist, und nur die WAAGRECHTE Kante wandert: um den Abstand der
// Zellenkante zum Fensterrand nach rechts.
//
// WIE: die Zahl steht als CSS-Variable `--blatt-rand` an der Hülle, gesetzt im
// Layout-Effekt (vor dem Malen — das Blatt erscheint in keinem Frame an der
// alten Stelle) und nachgeführt von einem ResizeObserver auf Hülle und Wurzel
// (Fensterbreite, Scrollleiste, Gliederung auf/zu). Kein React-Zustand: das
// Nachführen rendert nichts neu. `clientWidth` statt `innerWidth`, damit das
// Blatt an der Scrollleiste anschlägt statt darunter — sonst liefe das Dokument
// waagrecht über (Sonde `leser-v3-rahmen`, `overflow ≤ 1`).

/** Setzt an `ref` die Variable `--blatt-rand` = Abstand der rechten Kante zum
 *  rechten Fensterrand (px, ≥ 0), solange `aktiv`. */
export function useFensterRand(ref: RefObject<HTMLElement | null>, aktiv: boolean): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!aktiv || !el) return;
    const miss = () => {
      const abstand = document.documentElement.clientWidth - el.getBoundingClientRect().right;
      el.style.setProperty('--blatt-rand', `${Math.max(0, Math.round(abstand))}px`);
    };
    miss();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(miss);
    ro.observe(el);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [ref, aktiv]);
}
