<!-- @posten
dach: W2·18-FEHLERBUCH
titel: check:materialien läuft durch blossen Kalender-Ablauf rot
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **`check:materialien` läuft durch blossen Kalender-Ablauf rot** — das Tor misst Kalenderzeit statt Korrektheit; Wurzel-Fix: abgelaufene Fristen deterministisch als «abgeschlossen» ableiten oder auf Harvest-Alter umstellen.

**Sichtung 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET):** Vermutlich erledigt — Schliess-Kandidat: PR #803 (12.9.2026, §17-Wurzelfix) machte `check:materialien` wanduhr-frei (Finding 7 prüft gegen das committete Erhebungsdatum `r.stand` statt gegen `heute`); Wortlaut in `archiv/FAHRPLAN-OFFENE-BEFUNDE-erledigt.md` §2 («Finding 7 ohne Reparaturweg», «Reparatur-Arm scheitert an wanduhr-abhängigem `check:materialien`»). Nicht geschlossen, weil Schliessungen in diesem Bündel nicht freigegeben sind.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 211) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
