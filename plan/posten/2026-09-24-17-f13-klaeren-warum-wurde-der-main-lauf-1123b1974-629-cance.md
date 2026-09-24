<!-- @posten
dach: QS-BASIS
titel: §17 F13 klären: Warum wurde der main-Lauf 1123b1974 (#629) «cancelled»?
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-BASIS-AUSBAU.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **§17 F13 klären: Warum wurde der main-Lauf 1123b1974 (#629) «cancelled»?** *(2.9.2026)* — `cancel-in-progress` ist für main seit 26.7. aus; trotzdem endete der Merge-Lauf ~30 s nach dem Folge-Push 9cdbb6a55 als cancelled, der Deploy fehlte (Sidecar 404, Heilung per `gh run rerun`). Kandidaten: Selbst-Cancel-Schritt («BEHIND-PR … nachziehen»/«Geplante Workflows»), GitHub-seitig. Rot-Beweis mit zwei schnellen main-Pushes, dann Wurzel-Fix; bis dahin Skill `landung` Nachkontrolle 0.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 198) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
