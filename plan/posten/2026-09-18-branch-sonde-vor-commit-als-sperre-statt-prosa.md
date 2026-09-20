<!-- @posten
dach: QS-EFFIZIENZ
titel: Branch-Sonde vor Commit als Sperre statt Prosa
anlass: zweiter Beleg 18.9.2026, PR #903
-->

  - [ ] **Branch-Sonde vor Commit als Sperre statt Prosa** *(zweiter Beleg 18.9.2026, PR #903)* — Haupt-Session committete `docs(plan)` auf den Branch einer Parallel-Session, die im Haupt-Checkout gewechselt hatte (Skill `auftrag` 6 (j) deckt nur Dispatch). Ziel: Hook verweigert `git commit`, wenn der Branch nicht der erwartete ist; §12-Verstoss «Branch-Wechsel im Haupt-Checkout» mitprüfen.
