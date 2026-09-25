<!-- @posten
dach: W2·18-FEHLERBUCH
titel: Perf-Blick auf den langen Artikel-Index (aus PR #486)
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Perf-Blick auf den langen Artikel-Index (aus PR #486):** der flache Index ist bewusst nicht virtualisiert; seit dem B3-Wegfall trägt SG-3849 607 Zeilen (davon 590 im Anhang-Ast, der bei Anhang-Dominanz aufgeklappt startet), ZH-243 152. Messen, ob das auf schwachen Geräten trägt — sonst Virtualisierung des Index als eigener Schritt (Skill `perf`).

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 210) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
