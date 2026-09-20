<!-- @posten
dach: QS-EFFIZIENZ
titel: Agenten-Rückstände: Worktrees und Branches ohne Schritt-Bezug
anlass: Session 20.9.2026, Prozess-Messung
-->

Stand 20.9.2026: 2 detached Worktrees, 5 `worktree-agent-*`-Branches und 4 `claude/*`-Branches ohne Schritt-Bezug. `plan:next` meldet sie im Lage-Block, aber niemand räumt sie ab. Vorschlag: ein Modus `plan:next --aufraeumen`, der die Abräum-Kommandos ausgibt — nur für Zweige ohne offenen PR.
