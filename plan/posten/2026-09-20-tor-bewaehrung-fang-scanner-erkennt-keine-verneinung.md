<!-- @posten
dach: QS-EFFIZIENZ
titel: tor-bewaehrung: Fang-Scanner erkennt keine Verneinung
anlass: Session 20.9.2026, Prozess-Messung
-->

Der Scanner in `scripts/analyse/tor-bewaehrung.ts` sucht mit `\bgefangen\b|\bFang…` und verbuchte darum am 15.9.2026 den Satz «hat nichts gefangen» (Commit `ba7fc9872`) als ROT-Beleg für `check:smoke`, `check:sweep`, `check:verfall` und `check:normtext`. Die Bewährungs-Zeitreihe ist damit an diesen vier Toren falsch. Vor der nächsten Chronik-Überführung fixen — sonst wandert ein falscher Beleg in den Bestand.
