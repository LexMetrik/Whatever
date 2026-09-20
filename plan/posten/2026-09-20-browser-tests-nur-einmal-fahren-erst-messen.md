<!-- @posten
dach: QS-CI-MINUTEN
titel: Browser-Tests nur einmal fahren — erst messen
anlass: Session 20.9.2026, Prozess-Messung
-->

Der PR-Lauf (~22 min) und der `merge_group`-Lauf (~26 min) fahren beide die vier e2e-Shards. Bevor e2e nur noch in der Queue läuft, muss gemessen sein, was der PR-Lauf überhaupt fängt: 21 % der PR-Läufe waren rot (n = 42) — ohne die Aufschlüsselung nach Tor ist der Rückbau blind.
