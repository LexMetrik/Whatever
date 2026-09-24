<!-- @posten
dach: QS-CI-MINUTEN
titel: Risiko-PR ohne Verdikt durchläuft kein einziges anderes Tor
anlass: Gegenprüfung PR #939 (Opus 5, 21.9.2026), Auflage 5; bestätigt an `fix/curia-publikationen-dedupe` am selben Tag
-->

  - [ ] **Job «Tore»: `check:merge-schutz` bricht als ERSTER Schritt alles Weitere ab** *(Beleg 21.9.2026: PR #939 stand seit 20.9. mit rotem Merge-Schutz — Lauf 35514943116, `.github/workflows/ci.yml` ~Z. 754 — und hat bis zur Gegenprüfung kein einziges anderes Tor durchlaufen: `check:entstehung`, `check:materialien`, `check:datenhaltung`, `check:zaehler`, Tests, Lint liefen auf dem Stand nie)* — Folge: bei jedem Risikopfad-PR weiss bis zum Verdikt niemand, ob die übrigen Tore grün wären; der Prüfer prüft Inhalt und Herkunft, nicht Tests/Typen, und nach der Quittung kann der PR an einem Tor scheitern, das seit Tagen rot gewesen wäre (Bauer und Prüfer fahren sie heute von Hand lokal). Wurzel-Fix-Kandidat: `check:merge-schutz` im Job «Tore» ans ENDE stellen oder mit `if: always()` die übrigen Schritte trotzdem laufen lassen — der Required-Kontext «Merge-Schutz» bleibt unverändert rot und sperrt den Merge weiterhin (F1 unberührt). Vor dem Bau klären: gibt es einen Grund für «zuerst» (CI-Minuten sparen bei ohnehin gesperrten PRs)? Dann abwägen gegen die späte Rot-Entdeckung (Chesterton, Skill `lehren` Fünf-Schritte Ziff. 1).

**Erledigt 2026-09-24:** gebündelt in plan/posten/2026-09-20-check-merge-schutz-laeuft-in-der-ci-doppelt.md (Bauplan-Konsolidierung M-17, 24.9.2026)
