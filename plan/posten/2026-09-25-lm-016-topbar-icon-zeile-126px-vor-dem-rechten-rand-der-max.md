<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: LM-016 — Topbar-Icon-Zeile 126px vor dem rechten Rand der max-w-content-Brotkrumleiste (eigener Schritt nötig)
anlass: Umgehängt 25.9.2026 (REST S5c) aus FAHRPLAN-UI-BEFUNDE.md LM-016 (archiviert)
-->

Root-Cause strukturell: die Topbar-Icon-Zeile endet bei 1440 px rund 126 px vor dem rechten Rand der max-w-content-gekapselten Brotkrumleiste darunter, darum bleibt ein Sprachmenü-✕ neben dem korrekt verankerten Panel sichtbar. Eine Menü-Breite/-Position, die das kaschiert, wäre eine fragile Magic-Number-Lösung; der Fix (Topbar-Icon-Zeile an max-w-content ausrichten) berührt die Topbar auf JEDER Route mit Brotkrumleiste (src/components/layout/Shell.tsx) — braucht einen eigenen, bewusst entschiedenen Schritt. Grep 25.9.2026: keine max-w-content-Anpassung der Topbar-Icon-Zeile seit dem Befund gefunden.
