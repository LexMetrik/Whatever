<!-- @posten
dach: QS-BASIS
titel: shellcheck fehlt lokal
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-BASIS-AUSBAU.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **`shellcheck` fehlt lokal** *(19.9.2026)* — `landung-kette.sh` und `scripts/ci/*.sh` prüft nur `bash -n` (Syntax), nicht Quoting/Wort-Trennung. Als Voraussetzung dokumentieren oder ein Tor bauen, das ohne shellcheck übersprungen wird — aber eines, das scheitern kann (§6.7).

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 202) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
