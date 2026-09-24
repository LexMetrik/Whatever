<!-- @posten
dach: QS-CI-MINUTEN
titel: Merge-Schutz als erster Schritt des Tore-Jobs erzwingt auf dem Risikopfad zwei volle CI-Läufe
anlass: Mutter/Tochter-Durchlauf 2, PR #963, 21.9.2026 (auch D1 #960)
-->

Befund: Im Job «Tore» (.github/workflows/ci.yml) ist der Schritt «Merge-Schutz (Gegenprüfungs-Verdikt)» der ERSTE Schritt. Auf einem Risikopfad-PR bricht der Job dort ab, bis Register-Zeile und Verdikt-Trailer committet sind — vor dem Verdikt gibt es darum KEINEN CI-Beleg für check:entstehung, Tests, Lint (nur lokale Läufe des Bauers). Nach der Quittung läuft die ganze Prüfstrasse ein zweites Mal; bei #963 stand dieser Lauf (35637546409) zudem 23 min hinter dem noch laufenden CI des Vorstands an (Quittungs-Push 20:18, grün 20:43). Kosten: ~25 min Kalenderzeit je Risikopfad-PR plus ein voller CI-Lauf. Wurzel-Fix-Kandidaten (eine wählen, Rot-Beweis §6.7): (a) Merge-Schutz als EIGENER Job bzw. letzter Schritt, damit die übrigen Tore schon vor dem Verdikt in CI laufen und der Prüfer einen CI-Beleg hat; (b) concurrency-Gruppe je PR mit cancel-in-progress, damit der Quittungs-Push nicht hinter dem überholten Lauf ansteht (prüfen, ob schon gesetzt — Lauf 35634964991 wurde «cancelled», 35636871982 aber nicht). Grenze: Der Merge-Schutz als Required-Kontext bleibt unverändert der Merge-Arbiter.

**Erledigt 2026-09-24:** gebündelt in plan/posten/2026-09-20-check-merge-schutz-laeuft-in-der-ci-doppelt.md (Bauplan-Konsolidierung M-17, 24.9.2026)
