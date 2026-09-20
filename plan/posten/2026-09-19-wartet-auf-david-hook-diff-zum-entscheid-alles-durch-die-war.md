<!-- @posten
dach: QS-BASIS
titel: WARTET AUF DAVID · Hook-Diff zum Entscheid «alles durch die warteschlange»
anlass: 19.9.2026; Sessions ändern `.claude/hooks/*.py` nicht selbst
wartet-auf: david
-->

  - [ ] **WARTET AUF DAVID · Hook-Diff zum Entscheid «alles durch die warteschlange»** *(19.9.2026; Sessions ändern `.claude/hooks/*.py` nicht selbst)* — `tor-schutz.py` (ca. Z. 205–224) bewirbt weiter `LEXMETRIK_MAIN_PUSH=1`, `src/tests/hooks-wache.test.ts:377` prüft sie als ERLAUBT — beides widerspricht dem Entscheid (kein Direkt-Push, kein Bypass). Dazu: `struktur-rotieren.py --hook` kann seinen Commit-Pfad verlieren, seit die Rotation im Doku-PR läuft (`LEXMETRIK_NO_ROTATE=1`, `1ef2797f4`).
