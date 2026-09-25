<!-- @posten
dach: QS-KORPUS
titel: LexWork-Standlesung kennt «in Vollzug seit» nicht
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §1, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **LexWork-Standlesung kennt «in Vollzug seit» nicht** *(§17-Befund 6.9.2026)* — `inKraftSeit()` in `scripts/normtext/adapter-lexwork.ts` liest nur «in Kraft seit»/«en vigueur»; SG schreibt «Aktuelle Fassung in Vollzug seit: 01.07.2026», der Stand fällt auf `enactment` zurück (`register.json` führt SG-2808 mit stand 2012-03-01, amtlich V3863 seit 2026-07-01). Variante ergänzen + betroffene Kanton-Snapshots neu ziehen; Risikopfad.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§1, Restposten aus ROADMAP.md, vormals Z. 67) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
