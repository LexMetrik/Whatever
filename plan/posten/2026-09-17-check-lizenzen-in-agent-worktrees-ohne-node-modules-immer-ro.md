<!-- @posten
dach: QS-EFFIZIENZ
titel: check:lizenzen in Agent-Worktrees ohne node_modules immer rot
anlass: 17.9.2026
-->

  - [ ] **`check:lizenzen` in Agent-Worktrees ohne `node_modules` immer rot** *(17.9.2026)* — meldet «0 Paket(e) geprüft» als Lizenzverstoss statt Umgebungsproblem. Fix: `node_modules` vor `npm ls` prüfen, sonst «npm ci» melden.
