<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: LM-184 — Reiter-Zähler wächst automatisch bei jeder geöffneten Detailseite (Verhaltensumbau)
anlass: Umgehängt 25.9.2026 (REST S5c) aus FAHRPLAN-UI-BEFUNDE.md LM-184 (archiviert)
-->

Zähl-Semantik liegt in src/components/verzahnung/TabTracker.tsx (INHALT_ITEM-Regex) — Zustands-/Navigationslogik, nicht Darstellung (§3). Die Erwartung 'wächst nur durch Handlungen, die der Nutzer als solche erkennt' kehrt die heutige Automatik um (jede geöffnete Detailseite legt einen Reiter an) — ein Verhaltensumbau mit eigener Testfläche, kein Design-Batch-Fix. Entdeckbarkeits-Teil (Toast/Fly-to/Tooltip) bereits gebaut (N0d·O3, FAHRPLAN-UI-NAVIGATION §1).
