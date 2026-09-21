<!-- @posten
dach: QS-CI-MINUTEN
titel: check:merge-schutz läuft in der CI doppelt
anlass: Session 20.9.2026, Prozess-Messung
-->

Der Prüfvermerk-Check läuft als Schritt im Job Tore UND als eigener Required-Job; 26 von 89 roten PR-Läufen (14 Tage) waren deshalb doppelt rot. Prüfen, ob der Schritt im Tore-Job entfallen kann (Required bleibt der eigene Job) — Chesterton: Anlass der Doppelung klären.
