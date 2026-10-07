# Fedlex-ELI-Auflösung deterministisch + OR/FinIG-Re-Pin (B-07 / B-09)

**Erstellt 7.10.2026 · Ausführungsbeleg §11 zur Bau-Einheit `A1-FUNDAMENT` (c), Teil-PR «ELI-Auflösung + Re-Pin».**
**Stand der Quelle:** amtlicher Fedlex-SPARQL-Endpoint `https://fedlex.data.admin.ch/sparqlendpoint`
(Ontologie JOLUX, `http://data.legilux.public.lu/resource/ontology/jolux#`), live abgefragt am 7.10.2026;
Filestore-HTML `https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/…` am 7.10.2026.
**Status:** GEBAUT, Gegenprüfung (Opus) ausstehend; keine fachliche Abnahme nötig (Werkzeug + Pin-Revision, kein neuer Rechtstext).

## Regel (Eingabe → Ausgabe)

`npm run fedlex:eli -- <SR>` (Datei `scripts/fedlex-eli-aufloesen.ts`) löst eine SR-Nummer in eine Pin-Zeile
`name|eli|YYYYMMDD|html-N|art_1|sr` auf. Auswahl in drei Schritten, jeder reihenfolgeunabhängig:

1. **Abstract.** Genau ein `jolux:ConsolidationAbstract`, das über `jolux:classifiedByTaxonomyEntry` an der
   **typisierten** Notation (`"<SR>"^^<…/notation-type/id-systematique>`) hängt und im Currency-Fenster steht:
   `dateEntryInForce ≤ heute` und kein `dateNoLongerInForce ≤ heute` (gleiche Regel wie
   `bibliothek/recherche/fedlex-abkuerzungen-titleshort.md` Regel 2). Stehen mehrere im Fenster
   (Fedlex pflegt `dateNoLongerInForce` nicht bei jedem Vorgänger: RPG SR 700, PüG SR 942.20, MWSTV SR 641.201),
   entscheidet das zweite amtliche Kriterium: nur ein Abstract mit einer Konsolidierung, deren Fenster `heute`
   enthält (`dateApplicability ≤ heute`, `dateEndApplicability` fehlt oder `≥ heute`). Bleibt auch dann nicht
   genau einer: SR ist OFFEN (Exit 1), nie geraten.
2. **Konsolidierung.** Grösste `dateApplicability ≤ heute` dieses einen Abstracts (künftige nie, §7); Liste ohne
   `LIMIT`, mit `ORDER BY`, mit COUNT-Zähltor über dieselbe DISTINCT-Projektion (stille Teilergebnisse des Endpoints).
3. **html-N.** Kanonisch über `isExemplifiedBy` (`scripts/fedlex-manifest.ts`), nicht konstruiert. Fehlt die
   Manifestation: SR OFFEN.

## Befund (vorher)

Alte Abfrage: `LIMIT 200` ohne `ORDER BY`, danach `bindings[0].cc` und «grösstes Datum ≤ heute über alle Zeilen».
Live am 7.10.2026 reproduziert (Datumsangaben = was der Endpoint damals lieferte, nicht nachgeführt):

| SR | alte Auswahl | richtig (Regel oben) |
|---|---|---|
| 0.101 (EMRK) | `cc/1974/2151_2151_2151`, Stand 1983-12-01 (200 Zeilen = LIMIT erreicht; der Fehlerbestand nannte 1990 — der Wert hängt an der Endpoint-Reihenfolge) | gleiches ELI, Stand 2022-09-16, html-9 |
| 211.435.1 (EÖBV) | `cc/12/369_337_369` (NAG 1891, `dateNoLongerInForce` 1989-01-01) | `cc/2018/29`, 2024-01-01, html-5 |
| 823.11 (AVG) | `cc/1951/1211_1217_1249` (AVG 1951, ausser Kraft 1991-07-01) | `cc/1991/392_392_392`, 2026-01-01, html-0 |

Kopf-Kommentar behauptete einen `-N`-Fallback des Cache-Skripts; den gibt es seit 3.8.2026 nicht mehr
(Block «KEIN FALLBACK» in `scripts/fedlex-cache.sh`) — Ausgabe `|0|art_1` war für die meisten Erlasse falsch.

## Beleg nachher

- **Unabhängiges Orakel = der Pin-Bestand.** Der neue Resolver gegen alle 231 Pins von `scripts/fedlex-cache.sh`
  (live, Stichtag 2026-10-07): 228 identisch in `eli|Konsolidierung|html-N`, 0 offen, 3 abweichend — `or` (html-2 → 3)
  und `finig` (html-0 → 1) als erwartete Re-Pin-Funde, `bmv` bewusst als historische Fassung gepinnt
  (Nachfolger `bmv_2025` hat dieselbe SR; Resolver wählt korrekt den Nachfolger `cc/2025/408`).
- Regressionstest `src/tests/fedlex-eli-aufloesen.test.ts` mit am 7.10.2026 aufgezeichneten Endpoint-Antworten
  (`src/tests/fixtures/fedlex-eli-aufloesen.json`): die drei Fälle, Normalfall FinIG (SR 954.1), Sonderfall RPG,
  Permutationen der Zeilenreihenfolge, COUNT-Zähltor, Scanner-Tor «SPARQL mit `LIMIT` ohne `ORDER BY` in `scripts/`».

## Re-Pin OR / FinIG

`check:fedlex-versionen` meldete am 7.10.2026 `or` (gepinnt html-2, kanonisch html-3) und `finig` (html-0 → html-1)
als NICHT-KANONISCH. `npm run fedlex:repin-kanonik -- --write` setzte nur das vierte Pin-Feld.
Normtext-Bewegung gemessen (Fedlex-Filestore, beide Revisionen frisch abgerufen 7.10.2026):

- **OR** `cc/27/317_321_377/20261001`: html-2 und html-3 haben identischen Text und identische Element-Ids
  (Differenz nur im Markup, 248 B). Snapshot `public/normtext/bund/OR.json`: 1 685 Einträge, 0 Artikel, 0 Absätze
  geändert/hinzu/weg; Segment-Soll `or.json`: nur Kopf `htmlN` 2 → 3, `artikel` identisch.
- **FinIG** `cc/2018/801/20261001`: html-0 (Alias-URL) und html-1 (kanonisch) haben identischen Text; verschieden
  sind 102 generierte Fussnoten-Ids (`d41543e…` → `d54494e…`) und zwei leere Auszeichnungs-Elemente.
  Snapshot `FINIG.json`: 79 Einträge, 0 Artikel, 0 Absätze geändert/hinzu/weg; Soll `finig.json`: nur `htmlN` 0 → 1.
- Alle 231 `public/normtext/bund/*.json` wurden neu erzeugt; 231/231 sind reiner Datums-Churn (`normtext:churn-reset`),
  also kein Byte Normtext bewegt. Der Re-Pin ändert damit die Quell-URL (und die Pin-Identität), nicht den Text.
- Stichprobe gegen die amtliche Fassung (n = 19 Artikel, Wortgrenzen-Vergleich je Textblock gegen das frisch
  abgerufene Fedlex-HTML der gepinnten Revision): OR Art. 11, 32, 77, 104, 216, 324a, 335c, 336c, 396, 493;
  FinIG Art. 1, 4, 10, 20, 35, 51, 67, 72, 74a — 19/19 Treffer.

## Pflegebedarf

Neue Pins (A2, 281 Bundesgesetze) laufen durch diesen Resolver; bei OFFEN-Meldung Abstract von Hand klären
(nicht das erste Ergebnis nehmen). `scripts/normtext/bund-stubs-generieren.ts` trägt noch die alte Form
(`FILTER(str(?sr) = …)` ohne Typ-IRI, kein Currency-Fenster auf dem Abstract) — Nebenfund, nicht Teil dieser Einheit.
