<!-- @posten
dach: QS-EFFIZIENZ
titel: Register + Manifest sind Konfliktmagnete in der Merge-Queue
anlass: #909, 19.9.2026
-->

  - [ ] **Register + Manifest sind Konfliktmagnete in der Merge-Queue** *(#909, 19.9.2026)* — jeder Risiko-PR hängt eine Register-Zeile an und pinnt `daten-manifest.json`; die Queue kennt `merge=union`/`regen` nicht ⇒ zwei Risiko-PRs hintereinander = der hintere sicher UNMERGEABLE (ein CI-Zyklus + Delta-Prüfung verloren; die Automatik reiht per Auto-Merge blind ein). Wurzel suchen: Register je PR als eigene Datei, Manifest-Pin erst nach der Landung.
