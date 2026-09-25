<!-- @posten
dach: QS-KORPUS
titel: --erlass= filtert nur die Bund-Route
anlass: Fahrplan-Einträge fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §1, Restposten aus ROADMAP.md · fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **`--erlass=` filtert nur die Bund-Route** *(§17-Generator-Befund #860)* — HTM-, ZH- und PDF-Adapter laufen beim gezielten Neulauf mit; im Lauf vom 14.9.2026 hätte das VS-173.8-fr «RS» → «SR» geändert. Filter auf alle Routen ziehen.

### Ebenso im Fahrplan: `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 277)

- [ ] **`--erlass=` filtert nur die Bund-Route** *(§17, Fixer #860)* — beim gezielten Neulauf laufen HTM-, ZH- und PDF-Adapter mit; im Lauf vom 14.9.2026 hätte das VS-173.8-fr «RS» → «SR» geändert. Filter auf alle Routen ziehen. Auch als ROADMAP-Zeile unter `QS-KORPUS`.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§1, Restposten aus ROADMAP.md, vormals Z. 58) und `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 277) — dort steht jetzt je ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).

**Zweiter Beleg 25.9.2026 (HN-04-Bau, Session Gesetzestext-Treue):** Ein gezielter Regenerationslauf ohne `--nur=bund` zog wieder Kanton-, HTM-, ZH- und PDF-Phasen mit und berührte 221 Kanton-Dateien (reines Datums-Rauschen). Der Bau-Agent hat das vor dem Commit bemerkt und per `git checkout --` zurückgesetzt. Dabei wechselte erneut VS 173.8 (fr) sein Feld `"sr"` von «RS 173.8» auf «SR 173.8». Offen bleibt darum auch, ob die Kanton-Pipeline die französische Form bei JEDER VS-Regeneration verliert (dann wäre das ein eigener Sprachfehler der Pipeline, nicht nur eine Folge des fehlenden Filters). Vorschlag des Bauers: Wächter oder deutlicher CLI-Hinweis, wenn `--erlass=` ohne Routen-Filter läuft.
