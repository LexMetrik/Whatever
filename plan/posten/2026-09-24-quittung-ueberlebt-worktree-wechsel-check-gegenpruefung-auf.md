<!-- @posten
dach: QS-EFFIZIENZ
titel: Quittung überlebt Worktree-Wechsel: check:gegenpruefung auf committete Register-Zeile zurückfallen
anlass: Lehre 24.9.2026 (W2·30-RL-W1, Serienlandung RL-05…RL-14a)
-->

bibliothek/.gegenpruefung-pending ist worktree-lokal und wird je Quittung überschrieben. Jeder Lande-Worktree muss darum die Quittung per gegenpruefung:ok --bereich neu erzeugen und die dabei angehängte Register-Zeile von Hand verwerfen (git checkout -- …register.md), obwohl Register-Zeile + Trailer im Zweig schon stimmen (check:merge-schutz grün, check:gegenpruefung rot). Wurzel-Fix: check:gegenpruefung akzeptiert als zweite Beweisform eine committete Register-Zeile mit passendem Bereichs-Hash im Zweig (gleicher Klassifizierer, gleiche Kernfunktion). Tor-Datei ⇒ Gegenprüfung Pflicht; Rot-Beweis: falscher Hash in der Register-Zeile bleibt rot.
