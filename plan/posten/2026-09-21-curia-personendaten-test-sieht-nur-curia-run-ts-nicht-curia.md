<!-- @posten
dach: QS-KORPUS
titel: Curia-Personendaten-Test sieht nur curia-run.ts, nicht curia-abruf.ts
-->

Curia-Personendaten-Test sieht nur curia-run.ts, nicht curia-abruf.ts

`src/tests/entstehung-curia.test.ts` (Personendaten-Grenze, ~Z. 280-291) grept den
QUELLTEXT von `scripts/entstehung/curia-run.ts` nach `$select`-Literalen. Seit 21.9.2026
(Branch `feat/curia-haertung`) liegt die Abruf-Logik in `scripts/entstehung/curia-abruf.ts`;
heute steht dort KEINE `$select`-Liste (alle vier Aufrufstellen blieben in `curia-run.ts`,
Test weiter scharf — Rot-Beweis mit `,LastName` gezeigt). Wandert künftig eine Abfrage mit
eigener Feldliste ins Modul, sieht der Test sie nicht. *Fix-Skizze:* den Test auf alle
`scripts/entstehung/curia*.ts` ausdehnen — deklarierte Test-Änderung (§6.3), eigener Schritt.
Das Tor im Shard (verbotene Felder, `check:entstehung`) fängt ein Leck ohnehin im Artefakt;
das hier ist die frühere, zweite Linie.
