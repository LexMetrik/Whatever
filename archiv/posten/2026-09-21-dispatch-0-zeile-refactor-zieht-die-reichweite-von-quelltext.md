<!-- @posten
dach: QS-EFFIZIENZ
titel: Dispatch-§0-Zeile: Refactor zieht die Reichweite von Quelltext-Grep-Tests im selben PR mit
anlass: Gegenprüfung PR #963, blockierende Auflage 1, 21.9.2026
-->

Lehre (Formregel Skill lehren: Dispatch-§0 vor Skill vor Prosa; Sperrklinke beachten — zuerst streichen, Luft der Steuerungs-Fläche ~23 KB): Beim Auslagern des Curia-Abrufs nach scripts/entstehung/curia-abruf.ts las der Personendaten-Test (src/tests/entstehung-curia.test.ts:280) weiter NUR curia-run.ts; ein eingeschleustes Personenfeld im neuen Modul blieb 33/33 grün. Der Bauer meldete die Lücke, die orchestrierende Session parkte sie als Posten (§6.3 «Tests nicht anpassen» als Verbot gelesen) — erst die unabhängige Gegenprüfung machte daraus eine blockierende Auflage. Vorschlag wörtlich (eine Zeile, Klasse bau/daten): «Ein Refactor, der Code aus einer Datei zieht, die ein Quelltext-Grep-Test liest, zieht die Test-Reichweite im SELBEN PR mit (Test-ERWEITERUNG ist nach §6.3 erlaubt und wird deklariert) — nie als Posten.» Stärkere Form prüfen: Tests, die Quelltext greppen, lesen ein Verzeichnis-Muster statt einer festen Datei (so jetzt in #963 gelöst: readdir über curia*.ts mit Leer-Wächter).
