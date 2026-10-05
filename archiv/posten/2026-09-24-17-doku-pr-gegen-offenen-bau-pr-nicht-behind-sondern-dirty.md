<!-- @posten
dach: QS-BASIS
titel: §17 · Doku-PR gegen offenen Bau-PR: nicht BEHIND, sondern DIRTY
anlass: Fahrplan-Einträge fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4 · fahrplaene/FAHRPLAN-BASIS-AUSBAU.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

- [ ] **§17 · Doku-PR gegen offenen Bau-PR: nicht BEHIND, sondern DIRTY** *(Vorfall 14.9.2026, #870 gegen #869)* — der Session-Abschluss-PR #870 schrieb die ROADMAP-Zeile «Einzelartikel-Ansicht» um, die der zu diesem Zeitpunkt offene Bau-PR #869 ebenfalls anfasste. #870 landete zuerst (Auto-Merge, alle Tore grün), #869 stand danach auf `DIRTY` statt `BEHIND` und braucht einen Rebase von Hand durch die bauende Session — deren Worktree `LexMetrik-wt-einzelartikel` von aussen nicht angefasst werden darf (§12). Das ist die teure Schwester der BEHIND-Schleife (`QS-BASIS`): BEHIND kostet einen CI-Lauf, DIRTY kostet eine fremde Session. **Regel bis zum Wurzel-Fix:** vor dem Schreiben eines Doku-PR `gh pr list --state open --json number,files` gegen die geplanten ZEILEN halten — §0 Ziff. 5 nennt diese Sonde bereits für Bau-Dateien, sie gilt für Steuer-Doku genauso — und die Zeile eines offenen PR entweder unangetastet lassen oder erst nach dessen Landung buchen. **Wurzel-Kandidat:** die Plan-Buchungen einer Abschluss-Session laufen erst nach der letzten Bau-Landung, nicht parallel dazu.

### Ebenso im Fahrplan: `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 196)

  - [ ] **§17 Doku-PR macht offene PRs nicht nur BEHIND, sondern DIRTY** *(Vorfall 14.9.2026, #870 gegen #869)* — BEHIND kostet einen CI-Lauf, DIRTY eine fremde Session. Befund, Regel und Wurzel-Kandidat: FAHRPLAN-OFFENE-BEFUNDE §4 («Doku-PR gegen offenen Bau-PR»).

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 271) und `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 196) — dort steht jetzt je ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
