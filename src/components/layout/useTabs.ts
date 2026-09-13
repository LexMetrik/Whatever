import { useEffect, useState } from 'react';
import { ladeTabs, tabsGleich, TABS_EVENT, type TabEintrag } from '../../lib/tabs';

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
export function useTabs(): TabEintrag[] {
  const [tabs, setTabs] = useState<TabEintrag[]>(ladeTabs);

  useEffect(() => {
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
