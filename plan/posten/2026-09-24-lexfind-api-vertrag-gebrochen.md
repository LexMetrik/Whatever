<!-- @posten
dach: W2·13-KANTONE-DATEN
titel: lexfind-API-Vertrag gebrochen
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-KANTONE.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **lexfind-API-Vertrag gebrochen** *(Inventar-Nebenfund 31.8.2026)* — `POST /api/fe/de/fulltext-search` weist das im Repo dokumentierte Schema (23.6.2026) mit HTTP 400 «Obsolete keys» ab; neues Schema im ZH-Dossier dokumentiert. Betrifft `scripts/normtext/lexfind-discovery.ts` (andere Kantone; ZH braucht lexfind nicht mehr). Nachziehen, bevor der nächste lexfind-Discovery-Lauf ansteht.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-KANTONE.md` (§2, Restposten aus ROADMAP.md, vormals Z. 254) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
