<!-- @posten
dach: QS-EFFIZIENZ
titel: gegenpruefung-register.md reibt in der Merge-Queue bei jedem parallelen Risiko-PR (union-Treiber greift nur lokal)
anlass: Landung #1072, 24./25.9.2026 (§17)
-->

Jeder Risiko-PR hängt eine Zeile an bibliothek/register/gegenpruefung-register.md an (check:merge-schutz verlangt «um ≥1 Zeile gewachsen»). Lokal löst der union-Treiber (.gitattributes) das; GitHub/Merge-Queue kennt keine eigenen Merge-Treiber ⇒ CONFLICTING, sobald ein anderer Risiko-PR vorher landet. Beleg #1072: 2× CONFLICTING (nach #1068 und nach #1077/#1078/#1082), 1× Queue-Rauswurf «merge_conflict» 24.9.2026 22:59 UTC, je ein Nachzug mit vollem CI-Lauf. Wurzel-Optionen: (a) Register-Zeilen als Einzeldateien je PR (wie plan/posten) + generierte Übersicht, check:merge-schutz prüft «neue Datei»; (b) Register-Zeile erst nach der Landung per Werkzeug nachtragen. Risikopfad-Tor ⇒ Umbau mit Gegenprüfung, §6.7 Rot-Beweis.
