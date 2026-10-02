// Breite Tabellen im Druck (W2·17-UI-BEFUNDE, Gegenprüfung #1279, §1/§8).
//
// Befund (A4 hoch, Spaltenbreite ≈ 589 px): Tabellen mit vielen Spalten oder langem
// Fliesstext passen auch mit kleiner Schrift nicht in die Spalte — das Papier schnitt
// sie still ab (FINFRAV-FINMA Anh. 1, VZV Anh. 3a, ERV Anh. 2, VVK, ZEMIS-V). Ein
// Ausdruck, dem Zellen fehlen, ohne dass es dasteht, ist falscher Rechtsinhalt.
//
// ZWEI STUFEN, damit es auch ohne Ereignis greift:
//  (1) VORAB, beim Rendern (`vorabDruck`, schon im ersten React-Markup; der Prerender enthält keine
//      Artikeltexte): aus den Zelltexten
//      geschätzte Mindestbreite; über der Hochformat-Spalte → `data-breit` +
//      `--druck-zoom-vorab`. Das CSS stellt die Tabelle dann auch ohne JavaScript auf eine
//      Querformat-Seite (`@page breit`).
//  (2) NACHMESSEN, bei `beforeprint` und beim Wechsel von `matchMedia('print')` (die
//      Druck-Stile gelten): am echten Layout messen, ob der Körper in die Lesespalte passt.
//      Sonst Querformat (`data-breit`, wenn nicht schon vorab) und Schrift schrittweise
//      kleiner (bis MIN_ZOOM). Wird die Schrift dabei kleiner als MIN_PT oder passt es
//      auch dann nicht: `data-gekuerzt` → eine gedruckte Zeile «Tabelle im Druck stark
//      verkleinert oder gekürzt – vollständig und lesbar: <Link>» steht darüber.
// `afterprint` und der Rückwechsel setzen zurück (nur, was Stufe 2 gesetzt hat). Reine
// Darstellung; kein Zellwortlaut ändert sich. Geprüft ist nur Chromium (page.pdf).
import { useEffect } from 'react';

/** Gedruckte Lesespalte A4 hoch (Rand 1.6 cm): gemessen 589 px. */
const SPALTE_HOCH = 589;
const MIN_ZOOM = 0.45;
const BASIS_ZOOM = 0.8;
/** Unter dieser gedruckten Schriftgrösse (pt) ist die Tabelle praktisch unlesbar: Hinweis. Mit Reserve
 *  angesetzt: Chromium verkleinert beim Druck zusätzlich (ZEMIS-V: errechnet 6.6 pt, im PDF 4.1 pt). */
const MIN_PT = 8;
/** Genutzte Breite A4 quer (23 cm ≈ 869 px, siehe `data-breit` in index.css), mit Sicherheitsrand. */
const QUER = 850;
/** Mittlere Zeichenbreite (px) für die Vorab-Schätzung, Zellrand je Spalte (px-3). */
const ZEICHEN_PX = 8;
const RAND_PX = 24;

/** Schätzt aus den Zelltexten, ob eine Tabelle im Hochformat nicht passt. Je Spalte zählt die
 *  breiteste Zelle: einzeilige Zelle = ganze Länge, umbrechbare = längstes Wort.
 *  `spalten[ci]` = Zellen der Spalte `{ text, umbrechbar }`. Gemessen gegen die echte
 *  Mindestbreite (VVK 2409 px, FINFRAV Anh. 1 1331 px, GebV SchKG Art. 37 675 px). */
export function vorabDruck(spalten: { text: string; umbrechbar: boolean }[][]): { breit: boolean; zoom: number } {
  let geschaetzt = 0;
  for (const zellen of spalten) {
    let w = 0;
    for (const z of zellen) {
      const laenge = z.umbrechbar ? Math.max(0, ...z.text.split(/\s+/).map((x) => x.length)) : z.text.trim().length;
      w = Math.max(w, laenge * ZEICHEN_PX);
    }
    if (w > 0) geschaetzt += w + RAND_PX;
  }
  return {
    breit: geschaetzt > SPALTE_HOCH / BASIS_ZOOM,
    zoom: Math.max(MIN_ZOOM, Math.min(BASIS_ZOOM, QUER / Math.max(geschaetzt, 1))),
  };
}

const SELEKTOR = '[data-mehrspaltig]';
const breite = (e: Element) => e.getBoundingClientRect().width;

/** Passt der Tabellenkörper in den Kasten? Gemessen am echten Layout (Druck-Stile gelten),
 *  nicht an `min-content`: die Mindestbreite überschätzt (VVK: 2409 px, gedruckt passt sie
 *  bei 45 % in 23 cm). */
const passt = (t: HTMLElement, tab: HTMLElement) => breite(tab) <= breite(t) + 1;

function druckZuruecksetzen(): void {
  for (const t of document.querySelectorAll<HTMLElement>(SELEKTOR)) {
    t.removeAttribute('data-gekuerzt');
    t.removeAttribute('data-permalink');
    t.style.removeProperty('--druck-zoom');
    if (t.hasAttribute('data-breit-dyn')) {
      t.removeAttribute('data-breit-dyn');
      t.removeAttribute('data-breit');
    }
  }
}

function druckAnpassen(): void {
  druckZuruecksetzen(); // idempotent: `beforeprint` und `matchMedia` können beide feuern
  for (const t of document.querySelectorAll<HTMLElement>(SELEKTOR)) {
    const tab = t.querySelector<HTMLElement>(':scope > [role="table"]');
    if (!tab) continue;
    // 1. Hochformat: Kasten so breit wie die gedruckte Lesespalte.
    const vorher = t.style.width;
    t.style.width = `${SPALTE_HOCH}px`;
    const hochOk = passt(t, tab);
    t.style.width = vorher;
    if (hochOk) continue;
    // 2. Querformat: Schrift schrittweise kleiner, bis der Körper in den Kasten passt.
    if (!t.hasAttribute('data-breit')) {
      t.setAttribute('data-breit', '');
      t.setAttribute('data-breit-dyn', '');
    }
    let zoom = BASIS_ZOOM;
    t.style.setProperty('--druck-zoom', String(zoom));
    for (let i = 0; i < 8 && !passt(t, tab) && zoom > MIN_ZOOM; i++) {
      zoom = Math.max(MIN_ZOOM, Math.min(zoom * 0.95, (zoom * breite(t)) / breite(tab) * 0.98));
      t.style.setProperty('--druck-zoom', String(zoom));
    }
    // 3. Unlesbar klein oder passt auch so nicht: der Ausdruck sagt es (nie stilles Abschneiden).
    const pt = parseFloat(getComputedStyle(t).fontSize) * 0.75 * zoom;
    if (!passt(t, tab) || pt < MIN_PT) {
      const art = t.closest('[id]');
      t.setAttribute('data-gekuerzt', '');
      t.setAttribute('data-permalink', `${window.location.origin}${window.location.pathname}${art ? `#${art.id}` : ''}`);
    }
  }
}

let nutzer = 0;
const druck = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;
// `change` auf `print` feuert, NACHDEM die Druck-Stile gelten (gemessen: beforeprint,
// mq:true, afterprint, mq:false) — dort ist die Messung am genauesten; `beforeprint` ist der
// Ersatz, wenn `matchMedia` nicht feuert (misst noch mit Bildschirm-Stilen, daher grober).
const wechsel = (e: MediaQueryListEvent) => (e.matches ? druckAnpassen() : druckZuruecksetzen());
const vor = () => druckAnpassen();
const nach = () => druckZuruecksetzen();

/** Hängt die Druck-Ereignisse einmal je Dokument ein (Zähler über alle Tabellen). */
export function useTabellenDruck(): void {
  useEffect(() => {
    if (nutzer++ === 0) {
      druck?.addEventListener('change', wechsel);
      window.addEventListener('beforeprint', vor);
      window.addEventListener('afterprint', nach);
    }
    return () => {
      if (--nutzer === 0) {
        druck?.removeEventListener('change', wechsel);
        window.removeEventListener('beforeprint', vor);
        window.removeEventListener('afterprint', nach);
      }
    };
  }, []);
}
