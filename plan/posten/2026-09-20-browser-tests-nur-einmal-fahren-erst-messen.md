<!-- @posten
dach: QS-CI-MINUTEN
titel: Browser-Tests nur einmal fahren — erst messen
anlass: Session 20.9.2026, Prozess-Messung
-->

Der PR-Lauf (~22 min) und der `merge_group`-Lauf (~26 min) fahren beide die vier e2e-Shards. Bevor e2e nur noch in der Queue läuft, muss gemessen sein, was der PR-Lauf überhaupt fängt: 21 % der PR-Läufe waren rot (n = 42) — ohne die Aufschlüsselung nach Tor ist der Rückbau blind.

**Nachtrag Messung 20.9.2026:** 561 PR-Läufe in 14 Tagen, 90 rot; von 89 zugeordneten waren 26 (29 
**Nachtrag Messung 20.9.2026:** 561 PR-Läufe in 14 Tagen, 90 rot; von 89 zugeordneten waren 26 (29 Prozent) NUR wegen der Browser-Tests rot, 21 davon später auf demselben Zweig grün. Die Merge-Queue läuft erst seit 19.9. (29 Läufe, 26 Stunden) — für eine Kosten-Nutzen-Rechnung zu dünn. Nachmessen ab ca. 4.10.2026; Umbau-Ort wäre der `if:`-Block des e2e-Jobs in `ci.yml`.
