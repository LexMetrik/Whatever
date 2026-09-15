import { useEffect, useState } from 'react';
import { ladeTabs, tabsGleich, TABS_EVENT, type TabEintrag } from '../../lib/tabs';
import { hydrationsPin, hydrationsPinLoesen } from '../../lib/hydration';

// Reaktiver Lese-Hook auf die offenen Reiter (Muster useSeitenleiste.ts).
// SSR-sicher: ladeTabs() fällt serverseitig auf [] zurück (typeof-window-Guard
// in localStorage-Zugriff). Synchronisiert sich über das TABS_EVENT (gleicher
// Browser-Tab, geschrieben von TabTracker/Schliess-Buttons) und das native
// `storage`-Event (anderer Browser-Tab). Reine Darstellung (§3).
// ── W2·18 Punkt 2 · GLEICHER INHALT HEISST KEIN NEUER ZUSTAND ──────────────
// Hier stand `setTabs(ladeTabs())`. `ladeTabs` baut bei jedem Aufruf ein NEUES
// Array aus dem `localStorage` — bei identischem Inhalt also einen neuen
// Zustandswert, und React rendert. GEMESSEN 13.9.2026 (Chromium @1024, 7
// Reiter, 20 Rad-Schritte auf /gesetze/bund/OR): 44 Renders der Arbeitsleiste,
// jeder mit der vollen Fenster-Vermessung (`useReiterFenster` misst bei jedem
// Layout-Lauf alle Reiterkanten). Der Vergleich ist strukturell, nicht
// identisch (`lib/tabs.tabsGleich`, dort die Regel): eine echte Änderung —
// auch ein gewanderter `#art-…`-Anker — kommt unverändert durch.
const LEER: TabEintrag[] = [];

// ── QS-BASIS (15.9.2026) · HYDRATIONS-PIN (perf-Bauregel 2) ────────────────
// Der Prerender hat kein `localStorage` und liefert IMMER eine leere Leiste.
// Läse der erste Client-Render eines HYDRIERTEN Aufrufs schon die gespeicherten
// Reiter, wäre sein Baum strukturell ein anderer als das ausgelieferte HTML —
// React verwürfe die Hydration und renderte die ganze Seite neu. GEMESSEN
// (Preview aus `dist`, 64 markierte Routen, je frischer Kontext): mit EINEM
// Reiter im Speicher 64/64 Routen rot, ohne Reiter 0/64. Darum startet der
// Zustand in diesem Fall auf dem SERVER-Zustand und zieht im Mount-Effect
// unten nach — die Leiste reserviert ihre Höhe ohnehin immer (R10-Befund
// 6.9.2026 in `Reiterleiste.tsx`), es verschiebt sich also nichts (§15).
// UNVERÄNDERT bleiben beide anderen Wege: der SSR-/Prerender-Pfad
// (`renderToString`, Pin nie gesetzt ⇒ Speicher-Lesepfad wie bisher) und jede
// client-gerenderte Seite (Leser-Detailrouten, SPA-Hülle) — dort steht die
// Leiste weiterhin im ERSTEN Render vollständig.
export function useTabs(): TabEintrag[] {
  const [tabs, setTabs] = useState<TabEintrag[]>(() => (hydrationsPin() ? LEER : ladeTabs()));

  useEffect(() => {
    // Der erste Commit ist durch: ein späterer Mount (z. B. eine aufgezogene
    // Pane) soll wieder sofort den echten Speicher zeigen.
    hydrationsPinLoesen();
    const sync = () => setTabs((alt) => { const neu = ladeTabs(); return tabsGleich(alt, neu) ? alt : neu; });
    sync(); // nach Mount einmal abgleichen (falls sich vor dem Effect was änderte)
    window.addEventListener(TABS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TABS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return tabs;
}
