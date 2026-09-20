<!-- @posten
dach: QS-CI-MINUTEN
titel: Flacker-Stichtag 22.9.2026 — zwei Specs und eine Ausnahme ungemessen
anlass: 19.9.2026
-->

  - [ ] **Flacker-Stichtag 22.9.2026 — zwei Specs und eine Ausnahme ungemessen** *(19.9.2026)* — ab 22.9. ist `check:e2e-flake` hart. Wurzel `leser-r1-r2` S8 ist behoben (PR #929, Test-Fehler: Signatur zählte `display:none`). Offen: `e2e/rechtsprechung.e2e.ts:123` («Weitere anzeigen» lud 200 statt >339) und `e2e/uinav-j-rechtsprechung.e2e.ts:75` (201 statt 200 Links) — beide am 19.9. nur im Retry grün, Nachlade-Familie; Ausnahme `w224-reiterverhalten.e2e.ts` (Verfall 8.10.2026) ohne Wurzel-Messung. Unter der Queue wirft ein harter Flake den Eintrag und lässt Nachfolger neu bauen. Detail: FAHRPLAN-OFFENE-BEFUNDE §4.
