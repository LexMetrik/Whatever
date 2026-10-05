<!-- @posten
dach: QS-CI-MINUTEN
titel: QS-CI-MINUTEN widerspricht sich selbst — M1–M5 gebaut, aber als offen geführt (M4 im Fahrplan, M5- und M2-Posten)
anlass: Fahrplan-Einträge fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md §1 · fahrplaene/FAHRPLAN-CI-MINUTEN.md §1, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

- [ ] **`QS-CI-MINUTEN` widerspricht sich selbst** (§5, zwei Wahrheiten): Kopf sagt «Gebaut
  8.9.2026: M1–M5», führt M1–M5 aber weiter als offene Checkboxen. Im Schritt selbst auflösen.

### Ebenso im Fahrplan: `fahrplaene/FAHRPLAN-CI-MINUTEN.md` (§1, vormals Z. 46–48)

  - [ ] **M4** Doku-Läufe: 8 Shard-Kontexte → 1 Sammel-Kontext (−1'500,
    Bauschritt + Branch-Regel — **Fallstrick:** Required-Check-Name ändert,
    `check:merge-schutz`-Liste im selben Schritt nachziehen).

**Sichtung 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET):** Nachgemessen 24.9.2026 (git): M1–M5 sind gebaut — M1/M3/M4/M5 mit `dfc8cb164` (8.9.2026, «Sparplan M5·M3·M4·M1»), M4 zusätzlich mit dem Sammel-Job «Browser-Smoke (Ergebnis)» (#780, `491ab5908`; `.github/workflows/ci.yml` Z. 186–189 «M4-Nachtrag»), M2 mit `dc5faa175` (8.9.2026, `.github/dependabot.yml`: `interval: monthly`, `rebase-strategy: disabled`, «Entscheid David 8.9.2026»); M3 wurde am 21.9.2026 zurückgenommen (Fahrplan CI-MINUTEN §1), und `plan-buchung.yml` (Gegenstand von M5) ist seit #952 (20.9.2026) ganz abgebaut. Offen geführt werden trotzdem: die M4-Zeile (hier, aus dem Fahrplan), der Posten `plan/posten/2026-09-20-m5-plan-buchung-npm-ci-erst-nach-trailer-fund.md` und Punkt 1 (M2) im Posten `plan/posten/2026-09-20-dependabot-zweig-browser-tests-seit-12-tagen-dauerhaft-rot.md`. Schliess-Kandidaten; nicht geschlossen, weil Schliessungen in diesem Bündel nicht freigegeben sind.

*Dach abweichend vom verlinkenden Schritt `QS-EFFIZIENZ`: der Eintrag nennt den Schritt, in dem aufzulösen ist («Im Schritt selbst auflösen»).*

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md` (§1, vormals Z. 87–88) und `fahrplaene/FAHRPLAN-CI-MINUTEN.md` (§1, vormals Z. 46–48) — dort steht jetzt je ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
