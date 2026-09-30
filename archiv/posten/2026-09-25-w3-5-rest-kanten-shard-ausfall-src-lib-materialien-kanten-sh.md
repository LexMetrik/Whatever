<!-- @posten
dach: W2·27-BUND-FERTIG
titel: W3-5-Rest: Kanten-Shard-Ausfall (src/lib/materialien/kanten-shard.ts:107, src/pages/gesetz-leser/artikelMaterialienLaden.ts:86) liefert null wie «nichts vorhanden» → «Zu Art. 6 nichts erfasst.» bei /gesetze/bund/ARG#art-6 mit abgebrochenem /materialien/kanten/ARG.json; Risikopfad, Gegenprüfung (Bug-Check #1097, 25.9.2026)
anlass: Session-Notizen 2026-09-25
-->

W3-5-Rest: Kanten-Shard-Ausfall (src/lib/materialien/kanten-shard.ts:107, src/pages/gesetz-leser/artikelMaterialienLaden.ts:86) liefert null wie «nichts vorhanden» → «Zu Art. 6 nichts erfasst.» bei /gesetze/bund/ARG#art-6 mit abgebrochenem /materialien/kanten/ARG.json; Risikopfad, Gegenprüfung (Bug-Check #1097, 25.9.2026)

**Erledigt 2026-09-30:** PR #1168 (gelandet 30.9.2026): ladeKantenShardErgebnis leer/fehler, AbrufFehler + Erneut laden, EntstehungsBlock; Gegenprüfung R2 bestanden; Rest (kontext.ts, Dossier) als Posten 30.9.
