<!-- @posten
dach: QS-EFFIZIENZ
titel: Worktree-Obergrenze: Warnung in plan:next/SessionStart ab N Worktrees mit node_modules (§17, Absturz 23.9.)
anlass: Verwaiste Session-Notiz, triagiert 24.9.2026 auf main a3d27e47c (2026-09-23-lage-nach-absturz:38)
-->

Am 23.9.2026 stürzte der Rechner bei rund 45 Worktrees (je mit node_modules) ab. aufraeumen:git existiert, aber keine Schwelle warnt vorher. Heute 19 Worktrees, 15 mit node_modules. Schwelle messen, Warnung in plan:next (Zeile Git-Flächen) und im SessionStart-Hook.

**Erledigt 2026-09-24:** gebündelt in plan/posten/2026-09-17-check-lizenzen-in-agent-worktrees-ohne-node-modules-immer-ro.md (Bauplan-Konsolidierung M-17, 24.9.2026)
