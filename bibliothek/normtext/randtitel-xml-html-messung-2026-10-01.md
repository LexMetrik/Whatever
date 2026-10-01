# Randtitel: amtliches XML (`fedlex:role="marginal"`) gegen HTML-Auszeichnung — Messung 1.10.2026

**Erstellt:** 1.10.2026 — Anlass: W2·27-BUND-FERTIG P9, Posten «Struktur-Extraktor liest Randtitel aus HTML statt aus `fedlex:role=marginal`» (Nebenfund #923, 19.9.2026).
**Quelle:** Fedlex-Filestore, AKN-XML je gepinntem Bund-Erlass (SPARQL `isExemplifiedBy`, deutsche XML-Manifestation, jüngste `-N`-Generation, Stand = Konsolidierung der Pins in `scripts/fedlex-cache.sh`), abgerufen 1.10.2026. Gegenseite: dasselbe HTML wie der Snapshot-Generator (`/tmp/<key>.html`, gleicher Pin). Beide sind Fassungen DESSELBEN amtlichen Stands; massgeblich bleibt die Fedlex-Fassung.
**Status:** Messung (Bau-Agent Sonnet) — Gegenprüfung durch die Orchestrator-Session ausstehend; fachliche Abnahme David nicht erforderlich (Anzeige-Sidecar, kein Normtext, §3). Kein `verified`/«geprüft» gesetzt.

## Regel (deterministisch)

`scripts/normtext/struktur-marginalien-xml.ts`: Randtitel-Kette je Artikel = alle Container-Vorfahren (`part title chapter section subsection subdivision subchapter book level transitional`) mit Überschrift (`<num> <heading>`, auch reine Nummer «4.»); Rolle `marginal` ⇒ Randtitel, sonst Gliederung; es zählen nur Randtitel NACH der innersten Gliederungsebene (wie im HTML-Pfad). Eigene `<heading>` des Artikels (BV/ZPO-Manier) = Sachtitel, nur ohne Kette; führendes `<sup>` (Ordinal-Fehlplatzierung KKV 126z^tredecies) weg. Wortlaut je Glied: `waehleRandtitel` — tragen HTML und XML dieselben Buchstaben und Ziffern, gilt die HTML-Schreibweise, sonst das XML.

## Messung (231 Bund-Pins, 25 190 Artikel-Token, Skript = die zwei Extraktoren nebeneinander)

| Klasse | Token | Richtig ist | Beleg |
|---|---|---|---|
| gleich (Endergebnis = HTML-Weg) | 25 055 | – | byte-gleich; darin 29 Token, bei denen das XML Leerraum verliert und HTML gewählt wird (nächste Zeile) |
| XML verliert Leerraum (Fedlex-`<b> </b>` fehlt im XML: «Aktienund», «Bau- undUnterhalts…») | 29 (rohes XML) | HTML | Fedlex-HTML hält den Abstand; bleibt dank `waehleRandtitel` unverändert |
| HTML verliert Ordinal-Suffix («Artikel 1» statt «1a», «Art. 16» statt «16a», «1bis», «abis.») | 35 | XML | Verweisziel existiert im Snapshot-Inventar (z.B. UVG 1_a, BANKG 1_b, KVV 71_a, RPG 16_a_bis/18_bis/24_d/24_e/37_a, SCHKG 8_a, IVG 68_quinquies, BETMG 14_a, THG 16_c) |
| HTML klebt Artikelnummer-Rest vorne an («b Bezug…», «Art Anerkennung…») | 28 | XML | VMWG, BPG, GSCHV, STHG, DBG, BPV, ASYLV3, BBV |
| HTML verschleppt Randtitel (NHG: «Zweck» steht an Art. 2–24d, gehört nur an Art. 1) | 69 | XML | XML-Rolle zeigt nur «Erfüllung von Bundesaufgaben» etc.; Art. 1 trägt «Zweck» als eigenen Sachtitel |
| HTML verliert Sachtitel (ERV 131b «Zusätzliche Eigenmittel», FAV 28a «Korrespondenzadresse»; Ursache: «Art 131» ohne Punkt umgeht den HTML-Guard) | 2 | XML | `<heading>` im XML |
| Junk «─» (MStG 228–232, aufgehoben) | 1 | weder noch → leer | XML-Heading = Nummernrest «Art. 228─232» |

⇒ 135 geänderte Token in 28 Erlassen (`public/normtext/struktur/bund/`), 0 Token nur auf einer Seite. Das XML ist NICHT pauschal besser: ohne `waehleRandtitel` wären 29 Randtitel durch fehlenden Leerraum regrediert.

## Pflegebedarf

- Struktur-Lauf braucht jetzt zusätzlich `/tmp/<key>.xml` (+ `.pin` = `eli|konsolidierung`), geladen von `scripts/normtext/fedlex-xml-cache.ts`; fehlt es, bricht der Lauf ab (kein HTML-Fallback).
- Neue Container-Tags im AKN-XML (bisher: `book`, `subdivision`, `subchapter` neben den klassischen) müssen in `CONTAINER` nachgetragen werden; Symptom wäre ein verschwundener Randtitel im Vergleich zum HTML-Weg.
- Nicht gelöst (David-blockiert, bleibt offen): «Randtitel-Doppelmodell auflösen» (Kanton `titel` ↔ `marginalie`) und «Randtitel Phase 2».
