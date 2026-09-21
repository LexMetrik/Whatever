# Curia Vista — Identität einer Publikation, und was `datum` bzw. leere Schlussabstimmungen bedeuten

**Erstellt:** 21.9.2026, Anlass: Publikations-Verlust im Curia-Vista-Generator
(`scripts/entstehung/curia.ts`, `bauePublikationen`), entdeckt in der Gegenprüfung zu PR #939.
**Status:** einfach belegt — alle Zahlen in dieser Session selbst am amtlichen Endpunkt erhoben;
adversariale Gegenprüfung des Fixes läuft getrennt, fachliche Abnahme David offen (§7/§8).

**Quellen (alle live abgerufen 21.9.2026):**

| Quelle | Endpunkt | Abruf |
|---|---|---|
| Curia Vista (Parlamentsdienste) | `https://ws.parlament.ch/odata.svc`, Entität `Objective`, `$filter=BusinessShortNumber eq '<nr>' and Language eq 'DE'`, `$format=json`, `$inlinecount=allpages` | 21.9.2026 |
| Fedlex-Gesetzgebungsgraph (jolux) | `https://fedlex.data.admin.ch/sparqlendpoint` (POST, `sparql-results+json`) | 21.9.2026 |

Nutzungsauflage Curia Vista (Zitat): Quellenangabe «Parlamentsdienste der Bundesversammlung, Bern»;
die Daten dürfen **inhaltlich nicht verändert werden**. Genau diese Auflage war verletzt, solange der
Generator amtliche Einträge stillschweigend zusammenfallen liess (siehe Regel 1).

---

## 1 · Regel (deterministisch): ohne Jahr und Nummer ist `ReferenceText` das Identitätsmerkmal

**Regel.** Eine Curia-Publikation wird identifiziert durch
`PublicationDate | PublicationTypeName | PublicationYear | PublicationNumber | ReferenceText | ReferendumDeadline`.
`ReferenceText` ist **nicht** optionales Beiwerk, sondern bei alten Bundesblatt-Fundstellen das
**einzige** unterscheidende Feld: dort sind `PublicationYear` und `PublicationNumber` leer.

**Belegter Schaden ohne diese Regel.** Der Schlüssel ohne `ReferenceText` liess im Geschäft
**01.023** («Bundesrechtspflege. Totalrevision») zwölf amtliche Bundesblatt-Zeilen vom 28.2.2001 auf
eine einzige kollabieren — **11 von 32 Einträgen fielen weg**, darunter das Bundesgerichtsgesetz
(BGG), das Strafgerichtsgesetz (SGG), das Verwaltungsgerichtsgesetz (VGG) und die Verordnung der
Bundesversammlung über die Richterstellen am Bundesverwaltungsgericht. Französisch identisch
(32 → 21), Italienisch 30 → 20.

Gemessener Verlust über neun gegengezählte Geschäfte (Stand vor dem Fix, Korpus-SHA
`2a08ea368e95bd6c0f9ea4a3236949ee4cb42b63`):

| Geschäft | gespeichert | amtliche Zeilen | distinkt mit `ReferenceText` | Verlust |
|---|---|---|---|---|
| 01.023 | 21 | 32 | 32 | **11** |
| 02.046 | 16 | 22 | 22 | **6** |
| 06.038 | 15 | 21 | 21 | **6** |
| 08.053 | 6 | 12 | **8** | **2** |
| 05.046 | 6 | 7 | 7 | **1** |
| 99.067 | 6 | 7 | 7 | **1** |
| 14.069 | 14 | 14 | 14 | 0 |
| 16.025 *(Kontrolle)* | 39 | 39 | 39 | 0 |
| 21.027 *(Kontrolle)* | 11 | 11 | 11 | 0 |

**Geltung und Ausnahmen.**

- Die Regel gilt für `Objective`. Sie ist **nicht** auf die Schwesterfunktionen übertragbar, ohne
  deren Felder eigens zu prüfen.
- **Der Dedupe bleibt**: Geschäft 08.053 liefert amtlich 12 Zeilen, von denen nur 8 verschieden
  sind — echte Duplikate existieren, das Zusammenfallen identischer Zeilen ist richtig.
- **Exposition ≠ Verlust.** 182 der 385 Shards tragen mindestens eine Publikation ohne Jahr und
  Nummer; das ist eine Obergrenze, keine Verlustzahl. Geschäft 14.069 hat zwei solche Zeilen und
  trotzdem keinen Verlust, weil sie sich schon im Datum unterscheiden.
- **Determinismus (§2):** Kommt `ReferenceText` in den Schlüssel, entstehen Gleichstände im
  Sortier-Vergleicher. Ohne Tiebreaker (`text`, dann `art`) hinge die Reihenfolge an der
  Zeilenfolge der Endpunkt-Antwort. Beide Stellen gehören **zwingend zusammen**.
- **`IsOldPublicationFormat` taugt nicht als Erkennungsmerkmal.** Bei allen 32 DE-Zeilen von 01.023
  steht das Feld auf `false`, obwohl zwölf Zeilen weder Jahr noch Nummer tragen.
- **Curia liefert den literalen String `"null"`, nicht JSON-`null`.** Der Helfer `txt`
  (`scripts/entstehung/curia.ts`) normalisiert das; jede eigene Auszählung über Roh-Zeilen muss
  dasselbe tun, sonst misst sie null Alt-Format-Zeilen statt zwölf.

## 2 · `publikationen[].datum` ist das Dokumentdatum, nicht das Erscheinungsdatum

**Regel.** `publikationen[].datum` = Curia `Objective.PublicationDate` = Fedlex
`jolux:dateDocument`. Es ist **nicht** `jolux:publicationDate`, also nicht das Datum, an dem die
Fundstelle im Bundesblatt erschien.

| Geschäft | Fundstelle | `datum` (Curia) | Fedlex `publicationDate` | Differenz |
|---|---|---|---|---|
| 02.008 | BBl 2002 1254 | 2002-01-09 | 2002-02-26 | −48 Tage |
| 02.024 | BBl 2002 3709 | 2002-03-08 | 2002-05-21 | −74 Tage |
| 08.053 | BBl 2008 6885 | 2008-06-25 | 2008-08-26 | −62 Tage |
| 02.024 *(Schlussabstimmungstext)* | BBl 2005 7365 | 2005-12-27 | 2005-12-27 | 0 |
| 08.053 *(Schlussabstimmungstext)* | BBl 2009 4407 | 2009-06-23 | 2009-06-23 | 0 |

**Geltung und Ausnahmen.** Die Abweichung betrifft nur Zeilen mit
`ReferenceTypeName = "Beratungsgegenstand / Entwurf"` (Botschaft/Entwurf) — dort ist das Datum das
Verabschiedungsdatum des Bundesrats und steht wörtlich im Titel («Botschaft vom 9. Januar 2002 …»).
Zeilen vom Typ `Schlussabstimmungstext` tragen das Erscheinungsdatum korrekt. Die Richtung ist
immer gleich oder früher, nie später. Nicht geprüft: ob die Regel auch für
`PublicationTypeName = "Amtliche Sammlung"` gilt — dort wurde nicht gegen Fedlex gejoint.

**Folge für die Darstellung (§8).** Wird `publikationen[].datum` je angezeigt, muss es als
Dokumentdatum beschriftet werden; als «BBl-Erscheinungsdatum» wäre es falsch. Das Erscheinungsdatum
ist in Curia in **keinem** der 26 Objective-Felder enthalten; der einzige belastbare Weg ist der
Join `PublicationYear` + `PublicationNumber` → Fedlex `jolux:historicalLegalId` (`"BBl <jahr> <nummer>"`).

## 3 · Leeres `schlussabstimmungen[]` hat zwei verschiedene Ursachen

**Regel.** `schlussabstimmungen: []` heisst **nicht** «es gab keine Schlussabstimmung». 42 der 385
Shards sind leer, aus zwei klar getrennten Gründen:

1. **Vor der Wintersession 2003** liefert der Endpunkt `Vote` für das Geschäft gar keine Zeilen
   (gemessen je 0 bei 99.067, 00.047, 00.090, 01.019, 01.065, 02.043, 02.052). Die Schlussabstimmung
   hat stattgefunden — sie steht in `beschluesse[].text`, etwa 00.090 am 22.6.2001, Nationalrat:
   «Annahme in der Schlussabstimmung». Es fehlen die **Einzelstimmen-Daten**, nicht der Vorgang.
   Früheste im Korpus erfasste Schlussabstimmung: **19.12.2003**.
2. **Neun Fälle nach 2003** (05.027, 05.052, 05.070, 06.037, 06.057, 12.061, 16.048, 20.051, 20.079):
   `Vote` liefert sehr wohl Zeilen, aber nur Eintretens-, Detail- und Gesamtabstimmungen. Hier heisst
   leer tatsächlich «keine Schlussabstimmung unter dieser Geschäftsnummer».

**Geltung und Ausnahmen.** Die Grenze ist ein **Abstimmungsdatum**, kein Geschäftsjahrgang: die
Geschäfte 02.035 und 02.078 sind Jahrgang 2002 und haben Daten, weil ihre Schlussabstimmung nach dem
19.12.2003 lag. Die Jahrgänge 2003 und 2004 sind lückenlos (0 von 11 bzw. 0 von 19 leer). Das Muster
`SCHLUSSABSTIMMUNG_RE` ist **nicht** die Ursache — es wird für die alten Geschäfte nie erreicht.

**Personendaten-Grenze (§11.8):** Diese Messung wurde ohne jede `Voting`-Abfrage geführt; Namen,
`PersonNumber`, Fraktion und Kanton wurden weder gespeichert noch abgefragt.

## 4 · Pflegebedarf

- **Drift, nicht Standfrage.** `Objective` bekommt nachträglich neue Zeilen (Befund R4, 6.9.2026).
  Die Zahlen oben sind ein Stand vom 21.9.2026, kein Fixpunkt. Der Monatslauf gleicht ab.
- **Bewacht** ist die Regel aus Ziff. 1 seit diesem Fix durch eine Kreuzprobe im Tor
  `check:entstehung`: der Lauf zählt die distinkten amtlichen Objective-Zeilen unabhängig von
  `bauePublikationen` aus, führt sie im Zustandsträger mit, und das Tor rechnet sie offline gegen
  den Shard-Bestand. Fehlen die Felder, ist das Tor rot statt stillschweigend grün.
- **Unbewacht bleiben** die Zähler `beschluesse` und `vorberatungen` im Zustandsträger: sie werden
  mitgeführt, aber nie gegen den Shard-Inhalt geprüft — dieselbe Lücke, eine Ebene weiter.
- **Offen:** die amtliche Gegenzählung über alle 385 Geschäfte. Der Korpus-Gesamtverlust ist damit
  unbekannt und wird bewusst **nicht** aus neun Stichproben hochgerechnet.

## 5 · Negativbefund (S5)

Der Dedupe war **kein** Fehlerfix mit Vorgeschichte: er entstand mit der Funktion (Commit
`71db836ca`, PR #792, 11.9.2026, Neuanlage) als Formmuster der drei Schwesterfunktionen, ohne
dokumentierten Duplikat-Vorfall und ohne Test für echte Duplikate. Erst diese Messung hat den
Anlass nachgeliefert — Geschäft 08.053 mit vier echt doppelten Zeilen. Wer ein Muster kopiert,
erbt dessen Annahmen mit; hier war die geerbte Annahme «Jahr und Nummer identifizieren eine
Fundstelle» für den ganzen Altbestand falsch.
