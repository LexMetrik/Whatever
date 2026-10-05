<!-- @posten
dach: QS-BASIS
titel: Dependency-Frische: npm audit, Majors und knip-Unlisted als Meldung, nie Stopper
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-BASIS-AUSBAU.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] Dependency-Frische: `npm audit` + Majors + knip-Unlisted als Meldung, nie Stopper. **Lockfile nur über `npx npm@10`.** §3.3.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 205) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).

*Sichtung 1.10.2026 (QS-BASIS, Erhebung GitHub-Zusammenarbeit):* Der Teil «`npm audit` als Meldung» ist durch GitHub abgedeckt — Vulnerability-Alerts und Dependabot-Security-Updates sind aktiv (`gh api repos/LexMetrik/Whatever/automated-security-fixes` → enabled), Fix-PRs entstehen selbst, und `plan:next` zeigt offene Dependabot-Zweige (#1224). Nicht bauen; offen bleiben nur Majors-Übersicht und knip-Unlisted.
