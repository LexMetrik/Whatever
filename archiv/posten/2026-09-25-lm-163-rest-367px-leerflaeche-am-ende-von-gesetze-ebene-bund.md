<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: LM-163 (Rest) — ~367px Leerfläche am Ende von /gesetze?ebene=bund (Sidebar länger als Listen-Spalte)
anlass: Umgehängt 25.9.2026 (REST S5c) aus FAHRPLAN-UI-BEFUNDE.md LM-163 (archiviert); Leser-Teil dort seit 23.9. gegenstandslos, dieser Katalog-Teil nicht
-->

Prod-Nachprüfung 4.9.2026 bestätigt reproduzierbar (1440 px, echtes mouse.wheel bis Dokumentende): scrollHeight-(scrollY+innerHeight)=0, aber Hauptspalte endet ~367 px vor dem Fusszeilen-Beginn, weil die Sidebar-Navigation länger ist als die Listen-Spalte — reine Leerfläche dazwischen. W2·29-WERKBANK-KATALOGE ist inzwischen (Stand 25.9.) auf status:done, ein Grep gegen src/pages/Gesetze.tsx zeigt aber kein Höhenausgleich-Muster zwischen Sidebar und Hauptspalte — nicht als Teil des Umbaus gefunden/belegt behoben. Neu am gebauten Werkbank-Stand nachmessen, dann Sidebar/Hauptspalte-Höhenausgleich im zweispaltigen Seitengerüst nachziehen.
