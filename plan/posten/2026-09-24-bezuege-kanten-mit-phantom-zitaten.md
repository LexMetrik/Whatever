<!-- @posten
dach: QS-KORPUS
titel: Bezüge-Kanten mit Phantom-Zitaten
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §1, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Bezüge-Kanten mit Phantom-Zitaten** *(Befund Split-Bau 30.8.2026, PR #582)* — 18 854 von
    75 365 Artikel↔Entscheid-Kanten nennen den Artikel im Entscheid-Snapshot gar nicht; Stichprobe
    `bge_148_V_265` trägt `«Art. 4 BGE»` in `zitierteNormen` (Extraktions-Artefakt). Wurzel im
    Bezüge-/Zitat-Generator suchen (Risikopfad, Gegenprüfung), nie in den Daten flicken.
    *Zuschnitt 1.9.2026:* zuerst den billigen **Filter** (Kante nur, wenn der Artikel im
    Entscheid-Snapshot wörtlich steht — §1 sofort erfüllt), den Generator-Neubau erst nach
    `W2·21-ZULIEFERER` (kommt der Graph von dort, entfällt er).

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§1, Restposten aus ROADMAP.md, vormals Z. 49–55) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
