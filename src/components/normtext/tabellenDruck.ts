// Breite Tabellen im Druck (W2·17-UI-BEFUNDE, Gegenprüfung #1279, §1/§8).
//
// Befund (A4 hoch, Spaltenbreite ≈ 589 px): Tabellen mit vielen Spalten oder langem
// Fliesstext passen auch mit kleiner Schrift nicht in die Spalte — das Papier schnitt
// sie still ab (FINFRAV-FINMA Anh. 1, VZV Anh. 3a, ERV Anh. 2, VVK, ZEMIS-V). Ein
// Ausdruck, dem Zellen fehlen, ohne dass es dasteht, ist falscher Rechtsinhalt.
//
// Ablauf (`matchMedia('print')` wechselt, die Druck-Stile gelten): je Tabelle am echten
// Layout messen, ob der Körper in die Lesespalte passt (80 % Schrift)
//   · passt                                                   → nichts tun (CSS-Standard)
//   · sonst: Querformat-Seite (`data-breit`, `@page breit`), Schrift schrittweise
//     kleiner, bis der Körper in die Seitenbreite passt (höchstens bis MIN_ZOOM)
//   · passt auch das nicht: `data-gekuerzt` → eine gedruckte Zeile «Tabelle im Druck sehr
//     klein und möglicherweise gekürzt – vollständig: <Link>» steht über der Tabelle (nie stilles Abschneiden).
// `afterprint` setzt alles zurück. Reine Darstellung; kein Zellwortlaut ändert sich.
import { useEffect } from 'react';

/** Gedruckte Lesespalte A4 hoch (Rand 1.6 cm): gemessen 589 px. */
const SPALTE_HOCH = 589;
const MIN_ZOOM = 0.45;
const BASIS_ZOOM = 0.8;

const SELEKTOR = '[data-mehrspaltig]';
const MARKEN = ['data-breit', 'data-gekuerzt', 'data-permalink'];

const breite = (e: Element) => e.getBoundingClientRect().width;

/** Passt der Tabellenkörper in den Kasten? Gemessen am echten Layout (Druck-Stile gelten),
 *  nicht an `min-content`: die Mindestbreite überschätzt (VVK: 2409 px, gedruckt passt sie
 *  bei 45 % in 23 cm). */
const passt = (t: HTMLElement, tab: HTMLElement) => breite(tab) <= breite(t) + 1;

function druckAnpassen(): void {
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
    t.setAttribute('data-breit', '');
    let zoom = BASIS_ZOOM;
    t.style.setProperty('--druck-zoom', String(zoom));
    for (let i = 0; i < 8 && !passt(t, tab) && zoom > MIN_ZOOM; i++) {
      zoom = Math.max(MIN_ZOOM, Math.min(zoom * 0.95, (zoom * breite(t)) / breite(tab) * 0.98));
      t.style.setProperty('--druck-zoom', String(zoom));
    }
    // 3. Passt es auch so nicht: der Ausdruck sagt es (nie stilles Abschneiden).
    if (!passt(t, tab)) {
      const art = t.closest('[id]');
      t.setAttribute('data-gekuerzt', '');
      t.setAttribute('data-permalink', `${window.location.origin}${window.location.pathname}${art ? `#${art.id}` : ''}`);
    }
  }
}

function druckZuruecksetzen(): void {
  for (const t of document.querySelectorAll<HTMLElement>(SELEKTOR)) {
    for (const m of MARKEN) t.removeAttribute(m);
    t.style.removeProperty('--druck-zoom');
  }
}

let nutzer = 0;
const druck = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;
// `change` auf `print` feuert, NACHDEM die Druck-Stile gelten (gemessen: beforeprint,
// mq:true, afterprint, mq:false) — erst dort stimmt die Mindestbreite.
const wechsel = (e: MediaQueryListEvent) => (e.matches ? druckAnpassen() : druckZuruecksetzen());
const nach = () => druckZuruecksetzen();

/** Hängt die Druck-Ereignisse einmal je Dokument ein (Zähler über alle Tabellen). */
export function useTabellenDruck(): void {
  useEffect(() => {
    if (nutzer++ === 0) {
      druck?.addEventListener('change', wechsel);
      window.addEventListener('afterprint', nach);
    }
    return () => {
      if (--nutzer === 0) {
        druck?.removeEventListener('change', wechsel);
        window.removeEventListener('afterprint', nach);
      }
    };
  }, []);
}
