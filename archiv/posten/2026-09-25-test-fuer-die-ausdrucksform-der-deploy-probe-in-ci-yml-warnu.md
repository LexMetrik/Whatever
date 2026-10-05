<!-- @posten
dach: QS-BASIS
titel: Test für die Ausdrucksform der Deploy-Probe in ci.yml (Warnung ci-059)
anlass: Session-Notizen 2026-09-25
-->

Die Fallenwarnung zur Deploy-Probe (`A && secret || ''`; die «naive» Umstellung liefert IMMER das Secret, die Rot-Probe des Deploy-Tors wäre dann wirkungslos grün) steht seit HN-12 (#1094) nur noch im Archiv `archiv/ci-yml-kommentare.md#ci-059`. Kein Test hält die Form des Ausdrucks fest (einziger Treffer `src/tests/vercel-aufraeumen.test.ts:263`, mit Fake-Wert). Tor > Prosa: ein Test, der die Ausdrucksform in ci.yml prüft. Quelle: Gegenprüfung HN-12 25.9.2026, Befund F2.
