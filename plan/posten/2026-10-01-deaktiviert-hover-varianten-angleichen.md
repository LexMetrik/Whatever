<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: Deaktiviert-/Hover-Varianten angleichen
anlass: Session-Notizen 2026-10-01
-->

disabled:opacity-30/-50 (PaneKopf, TabPanel, ZpoFristenForm) und hover:bg-brass-100/40/-200: (a) auf 0.4 bzw. brass-100 vereinheitlichen (sichtbar), (b) Unterschiede als bewusst dokumentieren. Empfehlung (a) (P9 #1191).

**Entscheid David 1.10.2026 (Chat): (a)** — vereinheitlichen: Deaktiviert auf `.lc-deaktiviert` (0.4), Hover auf `.lc-hover-akzent` (brass-100); sichtbare Änderung, vorher/nachher messen.

**Stand 1.10.2026 (P1):** umgesetzt und gemessen (Viewport 1440, hell). Deaktiviert → `.lc-deaktiviert`: PaneKopf-Griff 0.3→0.4, TabPanel-Pfeile (2) 0.3→0.4, ZpoFristenForm «→ als Ereignis übernehmen» 0.5→0.4 (Erbteilung-Direktbetrag 0.5→0.4 per Quelltext), Füllknopf MappenDialog war seit #1194 schon bereinigt. Hover → `.lc-hover-akzent`: Tagerechner-Presetzeile brass-100 mit Alpha 0.4 → rgb(243, 241, 237); Chips (Tagerechner, Vorlagen-Hilfsbeispiele) brass-200 rgb(230, 228, 224) → rgb(243, 241, 237); BezugZeitWahl per Quelltext. Die «bg-surface hover:bg-brass-100»-Zeilen (Erbteilung, Lohnfortzahlung, ZPO-Formular, Sperrereignisse) tragen schon brass-100 (gemessen rgb(243, 241, 237)); sie bleiben Utility, weil eine Fläche an der Aufrufstelle die Rolle schlüge. **Offen:** `hover:bg-brass-100/40` in `pages/gesetz-leser/inhalt-ansichten.tsx:191` und `parts/BezuegeZeile.tsx:259` (TABU W2·27) sowie `hover:bg-brass-100/30` in TabPanel.tsx:134 (Reiter-Zeile, aktiv = `bg-brass-100/50` — volle Stufe läge dort über dem Aktiv-Zustand; Design-Entscheid). Sonde in design-hn-d6-bausteine.test.tsx hält den Rest auf diese zwei Leser-Dateien.
