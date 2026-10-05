<!-- @posten
dach: QS-CI-MINUTEN
titel: Lage von check:merge-schutz im CI-Ablauf — 4 Punkte gebündelt (doppelt, erster Schritt, vor den teuren Jobs, Risiko-PR ohne Tor-Beleg)
anlass: Session 20.9.2026, Prozess-Messung
-->

*Titel bis 24.9.2026: «check:merge-schutz läuft in der CI doppelt» — seither Kopf eines Bündels (unten).*

Der Prüfvermerk-Check läuft als Schritt im Job Tore UND als eigener Required-Job; 26 von 89 roten PR-Läufen (14 Tage) waren deshalb doppelt rot. Prüfen, ob der Schritt im Tore-Job entfallen kann (Required bleibt der eigene Job) — Chesterton: Anlass der Doppelung klären.

**Bündel 24.9.2026** (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET): 3 weitere Posten derselben Sorge sind hier im Wortlaut aufgenommen — Titel, Anlass, alter Dach-Schlüssel und alte Datei je Punkt; die Dateien liegen mit Beleg «gebündelt in …» unter `archiv/posten/`. Nichts gekürzt.

### 1 · Merge-Schutz als erster Schritt des Tore-Jobs erzwingt auf dem Risikopfad zwei volle CI-Läufe *(Anlass: Mutter/Tochter-Durchlauf 2, PR #963, 21.9.2026 (auch D1 #960); vormals Dach `QS-CI-MINUTEN`, `plan/posten/2026-09-21-merge-schutz-als-erster-schritt-des-tore-jobs-erzwingt-auf-d.md`)*

Befund: Im Job «Tore» (.github/workflows/ci.yml) ist der Schritt «Merge-Schutz (Gegenprüfungs-Verdikt)» der ERSTE Schritt. Auf einem Risikopfad-PR bricht der Job dort ab, bis Register-Zeile und Verdikt-Trailer committet sind — vor dem Verdikt gibt es darum KEINEN CI-Beleg für check:entstehung, Tests, Lint (nur lokale Läufe des Bauers). Nach der Quittung läuft die ganze Prüfstrasse ein zweites Mal; bei #963 stand dieser Lauf (35637546409) zudem 23 min hinter dem noch laufenden CI des Vorstands an (Quittungs-Push 20:18, grün 20:43). Kosten: ~25 min Kalenderzeit je Risikopfad-PR plus ein voller CI-Lauf. Wurzel-Fix-Kandidaten (eine wählen, Rot-Beweis §6.7): (a) Merge-Schutz als EIGENER Job bzw. letzter Schritt, damit die übrigen Tore schon vor dem Verdikt in CI laufen und der Prüfer einen CI-Beleg hat; (b) concurrency-Gruppe je PR mit cancel-in-progress, damit der Quittungs-Push nicht hinter dem überholten Lauf ansteht (prüfen, ob schon gesetzt — Lauf 35634964991 wurde «cancelled», 35636871982 aber nicht). Grenze: Der Merge-Schutz als Required-Kontext bleibt unverändert der Merge-Arbiter.

### 2 · Merge-Schutz vor die teuren Jobs bzw. Quittung vor PR-Öffnung erzwingen *(Anlass: QS-CI-MINUTEN Wanduhr-Auftrag 21.9.2026; vormals Dach `QS-CI-MINUTEN`, `plan/posten/2026-09-21-merge-schutz-vor-die-teuren-jobs-bzw-quittung-vor-pr-oeffnun.md`)*

Messung 21.9.2026: 8 von 51 PR-Läufen verbrannten median 64 Shard-Minuten bei rotem Merge-Schutz (Gegenprüfungs-Verdikt fehlte/war negativ) — die teuren Jobs (bau, e2e-Shards, tore) liefen parallel zum Merge-Schutz statt hinter ihm zu warten, und ein rotes Verdikt kam erst nach den Shards an. Fix-Idee: Merge-Schutz VOR bau/tore/e2e in die needs-Kette nehmen (kostet etwas Wanduhr bei GRÜNEM Verdikt, spart massiv bei ROTEM), oder das Verdikt schon vor PR-Öffnung erzwingen (Pre-Push-Hook / Draft-PR-Konvention). Prüfen, ob das die Wanduhr bei grünem Regelfall spürbar verschlechtert, bevor gebaut wird.

### 3 · Risiko-PR ohne Verdikt durchläuft kein einziges anderes Tor *(Anlass: Gegenprüfung PR #939 (Opus 5, 21.9.2026), Auflage 5; bestätigt an `fix/curia-publikationen-dedupe` am selben Tag; vormals Dach `QS-CI-MINUTEN`, `plan/posten/2026-09-21-risiko-pr-ohne-verdikt-durchlaeuft-kein-anderes-tor.md`)*

  - [ ] **Job «Tore»: `check:merge-schutz` bricht als ERSTER Schritt alles Weitere ab** *(Beleg 21.9.2026: PR #939 stand seit 20.9. mit rotem Merge-Schutz — Lauf 35514943116, `.github/workflows/ci.yml` ~Z. 754 — und hat bis zur Gegenprüfung kein einziges anderes Tor durchlaufen: `check:entstehung`, `check:materialien`, `check:datenhaltung`, `check:zaehler`, Tests, Lint liefen auf dem Stand nie)* — Folge: bei jedem Risikopfad-PR weiss bis zum Verdikt niemand, ob die übrigen Tore grün wären; der Prüfer prüft Inhalt und Herkunft, nicht Tests/Typen, und nach der Quittung kann der PR an einem Tor scheitern, das seit Tagen rot gewesen wäre (Bauer und Prüfer fahren sie heute von Hand lokal). Wurzel-Fix-Kandidat: `check:merge-schutz` im Job «Tore» ans ENDE stellen oder mit `if: always()` die übrigen Schritte trotzdem laufen lassen — der Required-Kontext «Merge-Schutz» bleibt unverändert rot und sperrt den Merge weiterhin (F1 unberührt). Vor dem Bau klären: gibt es einen Grund für «zuerst» (CI-Minuten sparen bei ohnehin gesperrten PRs)? Dann abwägen gegen die späte Rot-Entdeckung (Chesterton, Skill `lehren` Fünf-Schritte Ziff. 1).
