<!-- @posten
dach: QS-MONITOR-ROT
titel: §17 Tor-Reihenfolge: Generat-Konsistenz vor Merge-Schutz
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **§17 Tor-Reihenfolge: Generat-Konsistenz vor Merge-Schutz** *(Befund Gegenprüfung PR #618, 2.9.2026)* — `check:verfall-ui`/`check:zaehler` laufen im Tor-Lauf erst NACH dem Merge-Schutz und damit bei fehlendem Verdikt nie; die Gegenprüfung sah eine Projektion, die kein Tor angefasst hatte. Billige Generat-Checks vor den Merge-Schutz ziehen oder Pfad-Hook auf `parameter-verfall.md` → `gen:verfall`.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§2, Restposten aus ROADMAP.md, vormals Z. 136) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
