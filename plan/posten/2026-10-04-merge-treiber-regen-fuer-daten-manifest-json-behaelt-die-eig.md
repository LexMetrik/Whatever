<!-- @posten
dach: QS-CI-MINUTEN
titel: Merge-Treiber regen für daten-manifest.json behält die EIGENE Seite: nach jedem main-Nachzug eines Daten-PR alter Manifest-Stand (60511 statt 60527 Artikel), check:datenhaltung rot
anlass: Aufräum-Session 4.10.2026; 4.10. bei #1231/#1232/#1233/#1295/#1303
-->

Jedes Mal Hand-Regeneration (datenhaltung:manifest) nötig, und weil das Manifest Risikodatei ist, danach enges Nach-Verdikt. Wurzel-Fix (§17): der Treiber lässt den Generator laufen (statt eigene Seite zu behalten) oder das Manifest fällt aus dem Hash (vgl. Posten 2026-09-30-serielle-landung-daten-manifest-json-…, QS-DATA-INGEST-DRIFT, gleiche Wurzel). Risikopfad: Gegenprüfung. Zeilen-/Zahlenangaben 4.10.2026 — vor Bau neu messen (§0 Ziff. 2).
