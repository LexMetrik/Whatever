<!-- @posten
dach: QS-MONITOR-ROT
titel: gate flaky parallel zu check-drift.ts --netz
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **`gate` flaky parallel zu `check-drift.ts --netz`** *(Nullprobe 4.9.2026, PR #668)* — Netz-Lauf schreibt `daten/pdf-cache-zh/`, während der Offline-Teil liest (73× «Roh-PDF-Cache leer»); Wurzel-Fix: Netz-Modus in Temp-Verzeichnis schreiben und atomar tauschen, oder Tor-Lock.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§2, Restposten aus ROADMAP.md, vormals Z. 137) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
