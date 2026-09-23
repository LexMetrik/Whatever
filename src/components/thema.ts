// ─── Thema (Hell/Dunkel) — Darstellungs-Infrastruktur, KEINE Rechtslogik (§3) ─
//
// Schaltet den Dunkelmodus über die .dark-Klasse am <html> (Token-Override in
// index.css). Bewusst KEIN Inline-Script (CSP script-src 'self' verbietet es;
// der Prerender-Drift-Wächter ebenso) — das Thema wird beim Client-Mount
// angewandt (main.tsx) und vom Umschalter gepflegt. Liegt neben components/
// locale.tsx, weil es zur App-/UI-Schicht gehört, nicht zur Engine-Schicht.

import { useSyncExternalStore } from 'react';

export type Thema = 'hell' | 'dunkel';        // aufgelöst (was tatsächlich angewandt wird)
export type ThemaWahl = Thema | 'auto';       // Nutzer-Wahl ('auto' folgt dem System)

const KEY = 'lexmetrik-thema';

/** Ausdrückliche Wahl aus dem letzten Besuch (inkl. 'auto'); null → noch keine. */
function gespeicherteWahl(): ThemaWahl | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'hell' || v === 'dunkel' || v === 'auto' ? v : null;
  } catch {
    return null;
  }
}

/** System-Präferenz (prefers-color-scheme) — Grundlage der Wahl 'auto'. */
export function systemThema(): Thema {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dunkel' : 'hell';
  } catch {
    return 'hell';
  }
}

/** Wahl → tatsächlich anzuwendendes Thema: 'auto' folgt dem System, 'hell'/
 *  'dunkel' direkt; ohne Wahl ebenfalls die System-Präferenz (Entscheid David
 *  8.8.2026, LM-174/B5-N1 — revidiert den zeitbasierten Default vom 19.6.2026:
 *  Erstbesuch folgt jetzt prefers-color-scheme, nicht mehr der Uhrzeit). */
export function effektivesThema(): Thema {
  const w = gespeicherteWahl();
  if (w === 'auto') return systemThema();
  if (w === 'hell' || w === 'dunkel') return w;
  return systemThema();
}

/** Wendet das Thema auf das Dokument an (Klasse + color-scheme + Browser-Chrome). */
export function wendeThemaAn(t: Thema): void {
  const el = document.documentElement;
  const dunkel = t === 'dunkel';
  el.classList.toggle('dark', dunkel);
  // Explizite .light-Klasse (statt nur Abwesenheit von .dark): macht die manuelle
  // Wahl eindeutig erkennbar — Grundlage für einen späteren Pre-Hydration-
  // prefers-color-scheme-Fallback (html:not(.light):not(.dark)).
  el.classList.toggle('light', !dunkel);
  el.style.colorScheme = dunkel ? 'dark' : 'light';
  // Browser-Chrome (meta theme-color) ans tatsächlich angezeigte Thema koppeln.
  // Die media-Tags in index.html decken den Vor-JS-Moment nach SYSTEM-Präferenz
  // ab. Der Browser nimmt laut WHATWG-Spec das ERSTE passende theme-color-Tag in
  // Baumreihenfolge → dieses media-lose Tag wird deshalb VOR die media-Tags
  // gestellt (gewinnt immer) und bildet so auch eine Wahl gegen die Systemvorgabe
  // ab (z. B. zeitThema = dunkel bei hellem System → dunkles Chrome statt hell).
  try {
    let m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'theme-color';
      // vor das erste vorhandene theme-color-Tag (null → ans Kopf-Ende = appendChild)
      document.head.insertBefore(m, document.head.querySelector('meta[name="theme-color"]'));
    }
    // Die beiden Literale SIND die Seitenfläche `--paper` aus src/index.css
    // (hell #FDFCFA · dunkel #1B1917 — D12 «Lesekomfort», 6.9.2026) — hier steht ein Literal, weil auch
    // `index.html` eines braucht (theme-color wirkt vor jedem JS) und beide
    // Stellen denselben Wert tragen müssen. Dass sie ihn treffen, erzwingt
    // `check:design-tokens` Prüfung 4 (E-3): hell stand hier bis 31.8.2026
    // #F7F4EC, also 2.23 ΔE neben dem Papier — ein sichtbarer Kantensprung
    // zwischen Browser-Rahmen und Seite. Nie von Hand abweichen, sondern
    // --paper pflegen und den Wert hierher nachziehen (§5).
    m.content = dunkel ? '#1B1917' : '#FDFCFA';
  } catch { /* SSR/Prerender ohne document.head — unkritisch */ }
}

// Kleiner Abonnement-Mechanismus, damit ALLE Theme-Anzeigen (Topbar-Umschalter
// UND Einstellungen-Segment) synchron bleiben (Bug-Fix 26.6.: sonst hing der
// Indikator der jeweils anderen Stelle nach). getSnapshot = gespeicherteWahl()
// liefert einen Primitive → stabil by-value, kein Tearing/Loop.
const themaHoerer = new Set<() => void>();

export function speichereThema(t: ThemaWahl): void {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* privater Modus o. Ä. — Thema gilt dann nur für die Sitzung */
  }
  themaHoerer.forEach((f) => f());
}

function abonniereThema(f: () => void): () => void {
  themaHoerer.add(f);
  try { window.addEventListener('storage', f); } catch { /* SSR */ }
  return () => { themaHoerer.delete(f); try { window.removeEventListener('storage', f); } catch { /* SSR */ } };
}

/** React-Hook auf die gespeicherte Theme-Wahl (hell/dunkel/auto/null). */
export function useThemaWahl(): ThemaWahl | null {
  return useSyncExternalStore(abonniereThema, gespeicherteWahl, () => null);
}
