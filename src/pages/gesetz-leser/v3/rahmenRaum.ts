import { useCallback, useEffect, useState } from 'react';
import type { RahmenRaum } from './rahmenSpalten';

// Der Mess-Teil von `./rahmenSpalten` — dort steht die reine Rechnung
// (`rahmenBild`), hier die Messung des Raums im `<main>` (ausgelagert
// 24.9.2026 wortgleich, §6.6 Datei-Schlankheit).

/**
 * Misst den Raum am Elternkasten und am umgebenden `<main>`.
 *
 * `ruhePx` ist die INHALTSBREITE des Elternkastens — also genau die Breite, die
 * der Rahmen ohne Aufweitung hätte, unabhängig davon, wie viele neutrale
 * Zwischen-Container die Hülle einzieht. `raumPx` ist die Breite des `<main>`
 * abzüglich aller Polsterungen und Kanten auf dem Weg dorthin; `clientWidth`
 * lässt die Scrollbar aussen vor, `100vw` täte das nicht.
 */
function raumMessen(el: HTMLElement): RahmenRaum | null {
  const eltern = el.parentElement;
  if (!eltern) return null;
  const innen = (n: HTMLElement) => {
    const cs = getComputedStyle(n);
    return { pad: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) };
  };
  const ruhePx = eltern.clientWidth - innen(eltern).pad;
  let rand = 0;
  let lauf: HTMLElement | null = eltern;
  while (lauf && lauf.tagName !== 'MAIN') {
    rand += innen(lauf).pad;
    lauf = lauf.parentElement;
  }
  // Ohne `<main>` gibt es keine belastbare Aussenkante — dann NICHT aufweiten
  // (der Rahmen bleibt, was er heute ist), statt auf `100vw` zu raten.
  if (!lauf) return null;
  const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const raumPx = lauf.clientWidth - rand;
  if (!(raumPx > 0) || !(ruhePx > 0)) return null;
  return { raumPx, ruhePx, remPx };
}

function gleich(a: RahmenRaum | null, b: RahmenRaum | null): boolean {
  if (a === null || b === null) return a === b;
  return a.raumPx === b.raumPx && a.ruhePx === b.ruhePx && a.remPx === b.remPx;
}

/**
 * Der Mess-Ref des Rahmens.
 *
 * CALLBACK-REF und Messung im Commit — dieselbe Begründung und derselbe
 * reproduzierte Fehler wie bei `useElementBreite`: der Rahmen kehrt beim ersten
 * Render mit dem Lade-Platzhalter zurück, ein `useEffect` auf einem `useRef`
 * liefe genau einmal mit `null` und hinge nie einen Observer ein.
 *
 * Beobachtet werden BEIDE Kästen: das `<main>` (Fenster, Pane-Breite,
 * App-Seitenleiste) und der Elternkasten (er folgt dem Schriftregler, weil
 * `max-w-content` in rem misst — das `<main>` täte das nicht).
 */
export function useRahmenRaum(): {
  raum: RahmenRaum | null;
  raumRef: (el: HTMLDivElement | null) => void;
} {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [raum, setRaum] = useState<RahmenRaum | null>(null);

  const uebernimm = useCallback((ziel: HTMLElement) => {
    const neu = raumMessen(ziel);
    setRaum((alt) => (gleich(alt, neu) ? alt : neu));
  }, []);

  const raumRef = useCallback((ziel: HTMLDivElement | null) => {
    setEl(ziel);
    if (ziel) uebernimm(ziel);
  }, [uebernimm]);

  // KEINE Messung im Effekt-Körper (Lint `react-hooks/set-state-in-effect`, rot
  // gesehen im `npm run gate` vom 18.8.2026): ein `setState` direkt im Effekt
  // erzeugt eine Kaskaden-Renderung. Und es wäre die DRITTE Messung derselben
  // Zahl — der Callback-Ref oben misst beim Einhängen, und `ResizeObserver`
  // liefert für jedes neu beobachtete Ziel von sich aus eine erste Meldung.
  // Verhalten bleibt damit gleich; bewiesen an `leser-v3-rahmen` (a)–(f2), die
  // ALLE eine gemessene Aufweitung voraussetzen und ohne sie rot werden.
  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const haupt = el.closest('main');
    const eltern = el.parentElement;
    const ro = new ResizeObserver(() => uebernimm(el));
    if (haupt) ro.observe(haupt, { box: 'border-box' });
    if (eltern) ro.observe(eltern, { box: 'border-box' });
    return () => ro.disconnect();
  }, [el, uebernimm]);

  return { raum, raumRef };
}
