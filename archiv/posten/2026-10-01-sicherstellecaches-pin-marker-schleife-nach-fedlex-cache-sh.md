<!-- @posten
dach: W2·27-BUND-FERTIG
titel: sicherstelleCaches: Pin-Marker-Schleife nach fedlex-cache.sh-Marker redundant (§5-Rückbau prüfen)
-->

fedlex-cache.sh schreibt seit W2·27-P1 selbst je OK-Eintrag den .pin-Marker (Format pinIdentitaet, nur bei erfolgreichem Abruf, alter Marker vorher entfernt). Die Schleife «Pin-Marker nachziehen» in scripts/normtext-snapshot.ts (ca. Z. 258-277, warFrischGeschrieben) stempelt dasselbe zum zweiten Mal — zwei Stellen für dieselbe Sorge (§17-Gegengewicht). Prüfen, ob sie entfallen kann (Test fedlex-cache-pin-befund.test.ts; Teilfehler-Fall B1 GP #808 weiter abgedeckt) und danach warFrischGeschrieben entfernen. Risikopfad scripts/normtext-snapshot.ts.
