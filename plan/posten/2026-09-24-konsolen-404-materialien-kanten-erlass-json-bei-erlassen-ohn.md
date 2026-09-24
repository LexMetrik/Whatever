<!-- @posten
dach: W2·29-WERKBANK-LESER
titel: Konsolen-404 /materialien/kanten/<ERLASS>.json bei Erlassen ohne Materialien-Kanten (nur 10 Shards, z. B. KVG)
-->

404 = «keine Kanten» ist Absicht, erzeugt aber je Erlass einen Konsolenfehler; Existenzliste/Manifest statt Blind-Fetch (src/lib/materialien/kanten-shard.ts:56). Risikopfad prüfen (istRisikoPfad).
