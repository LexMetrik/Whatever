// ─── Wem gehört eine Pfeiltaste? · die Frage an das Ziel des Tastendrucks ─────
//
// B11-B01 / ED10 (2.10.2026): im EINZELMODUS beansprucht `LeserTastatur` ←/→ fürs
// Blättern und ruft `preventDefault`. Wer eine breite Tabelle (`[data-mehrspaltig]`,
// `tabindex="0"`, `overflow-x: auto`) fokussiert hat und mit → scrollen will, bekam
// stattdessen den nächsten Artikel — oder, am Rand, gar nichts (gemessen: EMRK
// «Geltungsbereich», 574/522 px, `defaultPrevented: true`, `scrollLeft` blieb 0).
// Ein waagrechter Scroller braucht die Pfeile selbst; das Blättern tritt zurück.
//
// Eigene Datei: reine Funktion über die Elternkette, ohne React (die Komponenten-
// Datei darf nichts anderes exportieren, `react-refresh/only-export-components`).

/** Ein Element, das seitlich WIRKLICH scrollen kann: es läuft über UND sein
 *  `overflow-x` erlaubt es (`auto`/`scroll`). Ein überlaufendes, aber abgeschnittenes
 *  (`hidden`/`clip`) Element scrollt per Pfeiltaste nicht — dort bleibt das Blättern. */
function scrollt(el: Element): boolean {
  const e = el as HTMLElement;
  if (!(e.scrollWidth - e.clientWidth > 1)) return false;
  const ox = typeof getComputedStyle === 'function' ? getComputedStyle(e).overflowX : '';
  return ox === 'auto' || ox === 'scroll';
}

/** Steht das Ziel des Tastendrucks in (oder auf) einem seitlich scrollbaren
 *  Container? `html`/`body` zählen nicht: ein überbreites Dokument ist kein Widget,
 *  das die Pfeile für sich beansprucht. */
export function inWaagrechtemScroller(ziel: EventTarget | null): boolean {
  let el = (ziel as Element | null)?.nodeType === 1 ? (ziel as Element) : null;
  while (el && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
    if (scrollt(el)) return true;
    el = el.parentElement;
  }
  return false;
}
