<!-- @posten
dach: QS-KORPUS
titel: Golden-Token blind für Randtitel
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §1, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Golden-Token blind für Randtitel** *(Befund PR #668, 4.9.2026)* — `sha256Bloecke` (`scripts/normtext/sha-bloecke.ts`) hasht weder `titel` noch `absatz` (Gegenprüfung 4.9.2026: `sha-bloecke.ts:50`); eine reine Randtitel-Revision (BE 154.21 Art. 31) bewegt den Golden-Index nicht. Wurzel-Fix korpusweit (~60k Hashes) als eigener Schritt mit Gegenprüfung.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§1, Restposten aus ROADMAP.md, vormals Z. 60) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
