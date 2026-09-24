<!-- @posten
dach: W2·18-FEHLERBUCH
titel: tor-schutz.py: Trailer-Block-Format beim Commit prüfen
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
wartet-auf: david
-->

  - [ ] **tor-schutz.py: Trailer-Block-Format beim Commit prüfen** — ein `Gegenpruefung:`/`Roadmap:`-Trailer mit Leerzeile IM Block wird von git nicht als Trailer geparst und fällt erst als roter Merge-Schutz im CI auf (ein voller Zyklus; real 13.8.2026, PR #487, trotz Memory-Eintrag). Hook-Check beim Commit = Wurzel-Fix; einmal rot zeigen (§6.7). *(Konfig-Fläche — Umsetzung mit David-Freigabe.)*

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 221) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
