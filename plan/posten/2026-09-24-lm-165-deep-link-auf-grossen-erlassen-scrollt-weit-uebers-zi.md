<!-- @posten
dach: W2·18-FEHLERBUCH
titel: LM-165 · Deep-Link auf grossen Erlassen scrollt weit übers Ziel
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

- [ ] **LM-165 · Deep-Link auf grossen Erlassen scrollt weit übers Ziel** *(Agent-Befund 31.8.2026, PR #584)* — `/gesetze/bund/OR#art-368` landet bei y≈1'077'504 statt ~355'887; danach ist `[data-v3-kopf-artikel]` leer und das Norm-Panel fällt auf Art. 1 zurück. Verdacht: spät auflösende content-visibility-Platzhalter; verwandt mit LM-163. Repro dokumentiert, kein Risikopfad.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 196) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
