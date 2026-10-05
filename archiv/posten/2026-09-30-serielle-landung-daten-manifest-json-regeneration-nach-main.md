<!-- @posten
dach: QS-DATA-INGEST-DRIFT
titel: Serielle Landung: daten-manifest.json-Regeneration nach main-Merge kippt den Gegenprüfungs-Hash — jeder Folge-PR braucht einen neuen Prüfdurchgang
anlass: Landestrecke 30.9.2026 (#1171 nach #1173): Register-Zeile macht Risiko-PRs DIRTY, merge=regen-Manifest muss neu erzeugt werden, check:gegenpruefung ROT (Hash-Mismatch), Delta-Gegenprüfung nötig. Wurzel-Idee: daten-manifest.json im Hash als abgeleitet behandeln, stattdessen Gleichheit mit Regeneration (check:datenhaltung) verlangen — Risikopfad, Gegenprüfung
-->

Serielle Landung: daten-manifest.json-Regeneration nach main-Merge kippt den Gegenprüfungs-Hash — jeder Folge-PR braucht einen neuen Prüfdurchgang
