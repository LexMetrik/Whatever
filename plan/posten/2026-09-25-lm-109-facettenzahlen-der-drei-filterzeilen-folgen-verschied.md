<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: LM-109 — Facettenzahlen der drei Filterzeilen folgen verschiedenen Cross-Filter-Regeln (Entscheid-Frage)
anlass: Umgehängt 25.9.2026 (REST S5c) aus FAHRPLAN-UI-BEFUNDE.md LM-109 (archiviert)
wartet-auf: david
-->

Grep 25.9. bestätigt unverändert: src/components/rechtsprechung/EntscheidFilter.tsx:95-96 gwBasis/sprBasis blenden je Achse die EIGENE Achse aus (Cross-Facetten-Konvention 'was ein Klick BRÄCHTE'). Der Erwartungssatz 'alle Facettenzahlen einer Ansicht auf derselben Grundmenge' kippt diese dokumentierte Konvention und ist damit eine Design-/Entscheid-Frage, keine UI-Fix — zudem Filter-/Query-Logik (§0.3). Verbleibender echter Kern: die Ungleichbehandlung ist für Nutzer nicht erklärt. David-Frage: Konvention beibehalten (dann Erklärung ergänzen) oder auf eine einheitliche Grundmenge umstellen?
