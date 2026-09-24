<!-- @posten
dach: QS-CI-MINUTEN
titel: Merge-Schutz vor die teuren Jobs bzw. Quittung vor PR-Öffnung erzwingen
anlass: QS-CI-MINUTEN Wanduhr-Auftrag 21.9.2026
-->

Messung 21.9.2026: 8 von 51 PR-Läufen verbrannten median 64 Shard-Minuten bei rotem Merge-Schutz (Gegenprüfungs-Verdikt fehlte/war negativ) — die teuren Jobs (bau, e2e-Shards, tore) liefen parallel zum Merge-Schutz statt hinter ihm zu warten, und ein rotes Verdikt kam erst nach den Shards an. Fix-Idee: Merge-Schutz VOR bau/tore/e2e in die needs-Kette nehmen (kostet etwas Wanduhr bei GRÜNEM Verdikt, spart massiv bei ROTEM), oder das Verdikt schon vor PR-Öffnung erzwingen (Pre-Push-Hook / Draft-PR-Konvention). Prüfen, ob das die Wanduhr bei grünem Regelfall spürbar verschlechtert, bevor gebaut wird.

**Erledigt 2026-09-24:** gebündelt in plan/posten/2026-09-20-check-merge-schutz-laeuft-in-der-ci-doppelt.md (Bauplan-Konsolidierung M-17, 24.9.2026)
