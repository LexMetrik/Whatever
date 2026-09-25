<!-- @posten
dach: QS-DOKU-DIAET
titel: Zwei Kleinigkeiten an den Steuerflächen-Werkzeugen (Gegenprüfung HN-12)
anlass: Session-Notizen 2026-09-25
-->

(1) `scripts/analyse/steuerflaecheKern.ts:151`: die Sperrklinken-Meldung sagt «(origin/main)» auch dann, wenn `--basis <sha>` gesetzt ist — Beschriftung aus `ref` speisen. (2) `src/tests/steuerwerkzeuge.test.ts:376`: die Zeilenangabe «(Zeile ~178/184)» stimmte schon vor HN-12 nicht (alt 316/322, jetzt 70/76) — streichen. Beide vorbestehend, gefunden in der Gegenprüfung HN-12 am 25.9.2026 (Probe P3).
