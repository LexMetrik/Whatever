<!-- @posten
dach: QS-BASIS
titel: Hook-Diff zum Entscheid alles durch die Warteschlange (David)
anlass: 19.9.2026; Sessions ändern `.claude/hooks/*.py` nicht selbst
wartet-auf: david
-->

  - [ ] **WARTET AUF DAVID · Hook-Diff zum Entscheid «alles durch die warteschlange»** *(19.9.2026; Sessions ändern `.claude/hooks/*.py` nicht selbst)* — `tor-schutz.py` (ca. Z. 205–224) bewirbt weiter `LEXMETRIK_MAIN_PUSH=1`, `src/tests/hooks-wache.test.ts:377` prüft sie als ERLAUBT — beides widerspricht dem Entscheid (kein Direkt-Push, kein Bypass). Dazu: `struktur-rotieren.py --hook` kann seinen Commit-Pfad verlieren, seit die Rotation im Doku-PR läuft (`LEXMETRIK_NO_ROTATE=1`, `1ef2797f4`).

**Nachtrag 21.9.2026 (Notizen-Triage):** Der Diff liegt bereits fertig vor, byte-gleich
gesichert unter `plan/posten/anhang/2026-09-19-hook-main-push.patch` (verifiziert vor dem
Sichern: `LEXMETRIK_MAIN_PUSH` steht in `tor-schutz.py` Z. 213–223 und
`src/tests/hooks-wache.test.ts:377` noch unverändert — der Patch ist NICHT angewendet).
Anwenden mit `git apply plan/posten/anhang/2026-09-19-hook-main-push.patch`.
