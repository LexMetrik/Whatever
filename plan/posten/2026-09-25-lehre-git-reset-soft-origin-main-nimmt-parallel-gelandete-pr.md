<!-- @posten
dach: QS-KORPUS
titel: Lehre: «git reset --soft origin/main» nimmt parallel gelandete PRs still zurück
anlass: Bau #1127 25.9.2026 (vor dem Push bemerkt)
-->

Beim Squashen eigener Commits per reset --soft origin/main nach einem fetch, während main weitergelaufen ist, enthält der Index den ALTEN Stand der fremden Dateien ⇒ der Commit revertiert die fremde Landung (#1125) still. Regel: reset --soft $(git merge-base HEAD origin/main) oder erst origin/main mergen. Ort: Skill landung (Folgezweige) — derzeit keine Steuerflächen-Luft (0 KB), daher als Posten bis zum nächsten Rückbau.
