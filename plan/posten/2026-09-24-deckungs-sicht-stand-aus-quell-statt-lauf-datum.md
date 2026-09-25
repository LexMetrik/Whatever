<!-- @posten
dach: QS-MONITOR-ROT
titel: Deckungs-Sicht: stand aus Quell- statt Lauf-Datum
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Deckungs-Sicht: `stand` aus Quell- statt Lauf-Datum** *(19.9.2026)* — `register-provenienz.json#erzeugt` fliesst als «Stand» in `deckungs-sicht.json` (`deckung-projektion.ts:230,249,255,262`) ⇒ Churn-PRs bei Kalendertag-Wechsel (Beleg: BS-/Vernehmlassungs-Lauf, 7 Dateien bzw. 831× `stand`). Muster `juengstes()`; dazu `normtext:churn-reset` in den drei Monats-Jobs.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§2, Restposten aus ROADMAP.md, vormals Z. 138) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
