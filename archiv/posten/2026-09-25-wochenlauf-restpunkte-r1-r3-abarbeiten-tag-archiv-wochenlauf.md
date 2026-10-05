<!-- @posten
dach: QS-KORPUS
titel: Wochenlauf-Restpunkte R1–R3 abarbeiten (Tag archiv/wochenlauf-restpunkte-r1-r3-2026-09-25)
anlass: Übergabe #1113, Nach-Verdikt 25.9.2026
-->

Tag archiv/wochenlauf-restpunkte-r1-r3-2026-09-25 (e1d2793cb, 105/105 Tests, gate ungefahren) hält drei Restpunkte aus dem Nach-Verdikt zu #1113 fest, die vor dem nächsten produktiven Wochenlauf zu schliessen sind. R1: erster Befund-Block des Wochenberichts (Detail im Tag-Commit nachlesen). R2: Status «BE nicht prüfbar» (Datumsabgleich ohne Beleg) wird heute wie ein Fehltreffer behandelt und macht den PR fälschlich zum Entwurf — «nicht prüfbar» ≠ Entwurf, das muss die Entscheidungslogik unterscheiden. R3: der Auto-PR pusht den Branch, bevor der Body geschrieben ist (Zeitfenster mit leerem/altem Body), und der PR-Body hat keine Längengrenze — GitHub deckelt PR-Bodies bei 65 536 Zeichen, ein zu langer Bericht wird abgeschnitten/abgelehnt. Fundstelle: Projektordner urteils-automatik-2026-09-25/2026-09-25-urteils-automatik.md Z. 77.
