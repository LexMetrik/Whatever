<!-- @posten
dach: QS-EFFIZIENZ
titel: Nachlass-Wache meldet Fehlalarm bei inhaltsgleichem Commit
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md §1, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

- [ ] **Nachlass-Wache meldet Fehlalarm bei inhaltsgleichem Commit** — der SessionStart-Hook misst
  `ahead`, nicht Inhalts-Identität. Am 20.9.2026 gemeldeter «ungepushter Commit» war bereits
  upstream (andere SHA, von Parallel-Session gelandet), `git pull --rebase` verwarf ihn.
  Fix: Meldung um «patch evtl. schon upstream — erst rebasen» ergänzen.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md` (§1, vormals Z. 89–92) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
