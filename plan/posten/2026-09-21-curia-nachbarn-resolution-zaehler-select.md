<!-- @posten
dach: QS-KORPUS
titel: Curia-Nachbarn: Resolution verliert 4 Zeilen, Zustandsträger-Zähler unbewacht, Objective ohne $select
anlass: Nebenfunde beim Fix des Publikations-Dedupe, Vollzensus 21.9.2026
-->

Vier kleine, unabhängige Befunde aus dem Fix des Curia-Publikations-Dedupe
(Branch `fix/curia-publikationen-dedupe`, 21.9.2026). Alle im selben Generator,
alle bewusst NICHT in jenem PR mitgefixt — er hätte sonst vier Risiko-Flächen
gemischt. Jeder Punkt ist für sich klein.

**1 · `baueBeschluesse` verliert 4 Zeilen.** Vollzensus `Resolution` (DE): über die
Shard-Geschäfte 3581 amtliche → 3577 gespeicherte Zeilen. Der Schlüssel
`datum|rat|vorlage|text` lässt `ratKuerzel` weg; korpusweit sind es 228 Zeilen
(94 516 → 94 288). Gleiche Klasse wie der behobene Publikations-Bug, nur klein.
*Fix-Skizze:* `ratKuerzel` in den Schlüssel, Vergleicher prüfen, Vollabgleich.

**2 · `baueKommissionen` und `baueBeschluesse` bauen den Schlüssel als `|`-Join mit
Freitext darin** (`CommitteeName`, `ResolutionText`). Ein `|` im Wert verschmilzt zwei
verschiedene Einträge. Bei den Publikationen deshalb am 21.9.2026 auf JSON-Tupel
umgestellt (`scripts/entstehung/curia.ts`); die beiden Schwestern stehen noch auf dem
alten Muster. Heute kein belegter Schaden — aber eine wartende Falle.

**3 · Zustandsträger-Zähler sind unbewacht.** `bibliothek/register/curia-zustand.jsonl`
führt je Geschäft `beschluesse` und `vorberatungen` mit, aber `check:entstehung` rechnet
sie **nie gegen den Shard-Inhalt**. Genau diese Lücke hat beim Publikations-Feld den Bug
unsichtbar gehalten; seit dem Fix ist `publikationen` gegengerechnet, die beiden anderen
nicht. *Fix-Skizze:* dieselbe Prüfung wie für `publikationen`, zwei Zeilen im Tor.

**4 · `Objective` ist die einzige Abfrage ohne `$select`** (`scripts/entstehung/curia-run.ts`,
Objective-Abruf) — abweichend vom eigenen Kopfkommentar in `curia.ts` («Jede Abfrage nennt
ihre Felder über `$select`»). Kein Personendatenleck (das Tor prüft die Felder im Shard),
aber unnötige Nutzlast und eine selbstgesetzte Regel, die gebrochen ist. Die Zeile trägt
26 Felder, gebraucht werden 7.

**5 · Offen, nicht gemessen:** ob die Regel «`publikationen[].datum` = Fedlex
`jolux:dateDocument`, nicht das Erscheinungsdatum» auch für
`PublicationTypeName = "Amtliche Sammlung"` gilt. Am 21.9.2026 wurden nur BBl-Zeilen gegen
Fedlex gejoint (siehe `bibliothek/materialien/curia-publikationen-identitaet-2026-09-21.md`
Ziff. 2).

**Stand 2026-09-21 (Branch `feat/curia-haertung`):** Punkt 2 erledigt — Map-Key von
`baueKommissionen`/`baueBeschluesse` als JSON-Tupel, Sortierschlüssel unverändert,
Byte-Beweis offline über alle 386 Shards (alt = neu = Shard); 0 gespeicherte Einträge mit
`|`. Bei den Kommissionen konnte der alte Schlüssel nie kollidieren (Datum fix 10 Zeichen
oder leer) — dort rein vorsorglich. Punkt 3 erledigt — `check:entstehung` rechnet
`beschluesse` (= `beschluesse.length`) und `vorberatungen` (= `kommissionen.length`) samt
Schlussabstimmungs-Merker gegen den Shard (Drift 0/386). **Offen bleiben Punkt 1
(`ratKuerzel` in den Schlüssel, ändert ~228 Zeilen Bestand), Punkt 4 (`$select` für
`Objective`) und Punkt 5** — alle drei brauchen Netz/Vollabgleich und kommen erst NACH dem
Monatslauf 1.10.2026. Achtung für Punkt 1: er lässt `beschluesse` steigen (unkritisch für
die Schrumpf-Schwelle); ein Fix, der Beschlüsse strenger zusammenfasst, bräuchte dagegen
einen Eintrag in `bibliothek/register/curia-schrumpf-ausnahmen.json`.
