# Curia Vista — Identität einer Publikation, und was `datum` bzw. leere Schlussabstimmungen bedeuten

**Erstellt:** 21.9.2026, Anlass: Publikations-Verlust im Curia-Vista-Generator
(`scripts/entstehung/curia.ts`, `bauePublikationen`), entdeckt in der Gegenprüfung zu PR #939.
**Status:** einfach belegt — alle Zahlen in dieser Session selbst am amtlichen Endpunkt erhoben;
adversariale Gegenprüfung des Fixes läuft getrennt, fachliche Abnahme David offen (§7/§8).

> **BERICHTIGUNG 21.9.2026 (zweite Runde) — bitte vor Ziff. 1 und Ziff. 5 lesen.**
> Die adversariale Gegenprüfung hat den Fix der ersten Runde als **unvollständig** widerlegt; eine
> eigene Nachmessung (Vollzensus, siehe Ziff. 1a) hat das bestätigt. Betroffen sind die Sätze
> dieses Eintrags, die **08.053 als Beleg für «echte Duplikate» bzw. «byte-gleiche» Zeilen**
> anführen (Ziff. 1, dritter Aufzählungspunkt; Ziff. 5, Schlusssatz; Zeile 08.053 der Tabelle).
> Sie sind **falsch gemessen**: verglichen wurden nur die sechs Felder aus Ziff. 1, also genau die
> Identität, deren Richtigkeit zu prüfen war. Nach F8 werden sie hier **nicht überschrieben**,
> sondern stehen gelassen und berichtigt — wer wann was gemessen hat, bleibt nachvollziehbar.
> Die neue Wahrheit steht in **Ziff. 1a**.

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
| 08.053 | 6 | 12 | **8** *(berichtigt: 12, siehe Ziff. 1a)* | **2** *(berichtigt: 6)* |
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
  **⚠ Dieser Satz ist falsch gemessen (Berichtigung 21.9.2026, zweite Runde).** Er zählte
  «verschieden» über genau die sechs Felder aus dieser Ziffer — jene vier Zeilen unterscheiden
  sich in der Vorlage (`BillNumber`) und sind eigene Fundstellen. An 08.053 sind alle 12 Zeilen
  verschieden. Der Dedupe bleibt trotzdem, aber aus einem anderen Grund: Ziff. 1a.
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

## 1a · Berichtigung (zweite Runde, 21.9.2026): die Vorlage gehört in die Identität

**Was falsch war.** Ziff. 1 nannte sechs Identitätsfelder und deutete jede darüber hinaus
verbleibende Mehrfachlieferung als «echtes Duplikat». Beide Messungen — die Spalte «distinkt mit
`ReferenceText`» und der Negativbefund in Ziff. 5 — rechneten über genau diese sechs Felder und
konnten deren Lücke darum nicht sehen (dieselbe Entscheidung zweimal ist keine Gegenprobe).

**Neue Messung.** Vollzensus aller **14 669** DE-`Objective`-Zeilen über alle **3 763** DE-Geschäfte
(Abruf 21.9.2026, `$inlinecount=allpages`, 15 Seiten à 1000). Kardinalität je Identitätsbegriff:

| Identität | distinkte Zeilen |
|---|---|
| roh (alle gelieferten Zeilen) | 14 669 |
| Vollzeile ohne `__metadata` / `Modified` / `ID` / `Bills` | 14 665 |
| die sechs Felder aus Ziff. 1 | 14 506 |
| die sechs Felder **+ `BillNumber`** | **14 665** |
| die sechs Felder + `BillNumber` + `IdBill` | 14 665 |

**Regel (berichtigt).** Eine Curia-Publikation wird identifiziert durch
`PublicationDate | PublicationTypeName | PublicationYear | PublicationNumber | ReferenceText |
ReferendumDeadline | BillNumber`. Was die sechs Felder noch zusammenfassten, sind **keine
Doppellieferungen, sondern dieselbe Fundstelle zu verschiedenen Entwürfen (Vorlagen)** desselben
Geschäfts. Seit Commit `4a41b04e7` führt `publikationen[].vorlage` (aus `Objective.BillNumber`,
Benennung und Typ wie `beschluesse[].vorlage`) sie getrennt.

- **`BillNumber` genügt; `IdBill` bleibt draussen.** Es gibt **null** Gruppen, die sich nur in
  `IdBill` unterscheiden — die GUID käme allein als Golden-Rauschen ins Artefakt.
- **`Bills` ist kein Inhalt, sondern ein Stempel.** Sein `__deferred`-URI enthält die eigene `ID`
  der Zeile; wer `Bills` in einen Inhaltsvergleich nimmt, misst tautologisch grün.
- **`vorlage: 0` heisst NICHT «Vorlage Nummer 0» (§8).** Der Wert kommt **450-mal** im Bestand vor
  (häufigster Wert nach 1) und bezeichnet die Geschäfts- bzw. Botschaftsebene, also eine Fundstelle,
  die keinem einzelnen Entwurf zugeordnet ist. Das Schwesterfeld `beschluesse[].vorlage` kennt die 0
  **nicht** — die beiden Felder sind gleich benannt und gleich typisiert, ihre Wertebereiche decken
  sich aber nicht. Vor jeder Anzeige beschriften; `null` kommt im Bestand nicht vor (0 Einträge),
  0 und `null` kollidieren also heute nicht.
- **`BillNumber` ist ein `int`, kein String** (14 669 von 14 669 Zeilen `typeof 'number'`).
  `txt(z.BillNumber)` lieferte für JEDE Zeile `null` — ein Fix über `txt()` änderte exakt nichts
  und sähe trotzdem nach Fix aus. Gelesen wird über `zahl()`; ein eigener Test hält den Irrweg rot.

**NACHTRAG 21.9.2026 (nach dem Vollabgleich, Gegenprüfung #960) — zwei Zählweisen, zwei Zahlen.**
Der Absatz darunter rechnet über 385 Shards und den Stand VOR dem Vollabgleich; er bleibt stehen.
Tatsächlich geschrieben wurden **386** Shards mit **2059** Publikationen (02.008 kam neu dazu).
Die Aufschlüsselung des Zuwachses **+136**:

| Anteil | Zeilen | Shards |
|---|---|---|
| `ReferenceText` im Schlüssel (erste Runde) | +121 | 63 |
| `vorlage` zusätzlich (zweite Runde) | +11 | 6 |
| neuer Shard 02.008 | +4 | 1 |

**Und: «63 gewachsen · 322 unverändert» ist nicht falsch, aber die schwächere Zählung.** Sie misst
über die sechs Felder. Zählt man Einträge, sind es **65 gewachsen · 320 unverändert**: die Geschäfte
**24.075** (8→9) und **99.084** (6→7) wuchsen **ausschliesslich über `vorlage`** und sehen in der
Sechs-Feld-Sicht darum unverändert aus. Wer den Churn prüft, muss wissen, welche der beiden Zahlen
er vor sich hat — die Sechs-Feld-Zählung ist der konservative Vergleich gegen den alten Stand (der
kein `vorlage` kennt), die Eintragszählung ist die ehrliche Antwort auf «wie viele Shards wuchsen».

**Wirkung auf unseren Bestand (385 Shards).** gespeichert 1923 · mit dem Sechs-Feld-Schlüssel 2044 ·
mit `vorlage` **2055 = roh = Vollzeile ⇒ verlustfrei**. Die 11 Differenz-Zeilen zwischen Sechs-Feld-
und Vorlage-Schlüssel sitzen in sechs Geschäften: 08.053 (8→12), 03.047 (14→17), 01.076 (11→12),
04.031 (9→10), 24.075 (8→9), 99.084 (6→7). Korpusweit sind **82** Geschäfte betroffen; die übrigen
76 haben heute keinen Shard. Damit ist auch der in Ziff. 4 als offen geführte Korpus-Gesamtverlust
gemessen und nicht mehr offen.

**Echte Doppellieferungen gibt es — nur nicht bei uns.** Korpusweit **vier** Zeilen in drei
Geschäften: **22.417, 26.023, 19.464**. Keines davon trägt heute einen Shard. Der Dedupe bleibt
deshalb bestehen (eine wirklich doppelt gelieferte Zeile ist eine Wiederholung, keine zweite
Fundstelle) — und genau deshalb ist das Tor **fail-loud**: über unseren Bestand ist der Lauf
verlustfrei, also darf ein Shard nie weniger speichern, als der Endpunkt liefert. Bekommt eines der
drei Geschäfte je einen Shard, wird `check:entstehung` rot; der Fall gehört dann als **begründete,
im Register geführte Ausnahme** hinterlegt, nie durch Aufweichen des Vergleichs erledigt.

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
  **⚠ Berichtigung 21.9.2026 (zweite Runde):** jene «unabhängige» Auszählung war keine — sie lief
  über dieselben sechs Felder und dieselben Normalisierer wie der Schlüssel und blieb darum grün,
  während 08.053 acht von zwölf amtlichen Zeilen speicherte. Sie ist samt Register-Feld
  `distinkteObjective` ersatzlos entfallen (Commit `b9fbdf0d3`). Verglichen wird seither gegen die
  **rohe** Zeilenzahl der amtlichen Antwort (`objectiveZeilen`) — die einzige Zahl, die keine
  unserer Identitäts-Entscheidungen teilt.
- **Unbewacht bleiben** die Zähler `beschluesse` und `vorberatungen` im Zustandsträger: sie werden
  mitgeführt, aber nie gegen den Shard-Inhalt geprüft — dieselbe Lücke, eine Ebene weiter.
- **Erledigt (Berichtigung 21.9.2026):** die amtliche Gegenzählung über den ganzen Bestand war hier
  als offen geführt — sie ist durch den Vollzensus aus Ziff. 1a **erbracht** (14 669 DE-Zeilen, alle
  386 Shards Eintrag für Eintrag: 2059 = 2059). Der frühere Satz «wird bewusst nicht aus neun
  Stichproben hochgerechnet» galt für den Stand vor dem Zensus und ist überholt.
- **Neu offen an seiner Stelle:** die Kommissions-Vorberatungen. Dort fallen 65 % der amtlichen
  Zeilen zusammen (2249 amtlich → 792 gespeichert über 386 Shards, Prüfer-Messung; eigene Messung
  über 385 Shards: 2093 → 790). Ob das gewollt ist, ist ein fachlicher Entscheid und liegt bei
  David — Posten `plan/posten/2026-09-21-curia-vorberatungen-62-der-amtlichen-zeilen-fallen-zusammen.md`.

## 5 · Negativbefund (S5)

Der Dedupe war **kein** Fehlerfix mit Vorgeschichte: er entstand mit der Funktion (Commit
`71db836ca`, PR #792, 11.9.2026, Neuanlage) als Formmuster der drei Schwesterfunktionen, ohne
dokumentierten Duplikat-Vorfall und ohne Test für echte Duplikate. Erst diese Messung hat den
Anlass nachgeliefert — Geschäft 08.053 mit vier echt doppelten Zeilen. Wer ein Muster kopiert,
erbt dessen Annahmen mit; hier war die geerbte Annahme «Jahr und Nummer identifizieren eine
Fundstelle» für den ganzen Altbestand falsch.

**⚠ Berichtigung 21.9.2026 (zweite Runde).** Der Satz «Geschäft 08.053 mit vier echt doppelten
Zeilen» ist falsch gemessen — jene vier Zeilen unterscheiden sich in der Vorlage (`BillNumber`),
08.053 liefert zwölf verschiedene Zeilen (Ziff. 1a). Der Negativbefund selbst bleibt richtig und
wird durch die Berichtigung sogar schärfer: der Dedupe entstand **ohne** Anlass, und der Anlass,
den die erste Runde ihm nachträglich zuschrieb, existierte nicht. Nachgeliefert hat ihn erst der
Vollzensus — vier echt doppelte Zeilen in den Geschäften **22.417, 26.023 und 19.464**, von denen
heute keines einen Shard trägt. Die Lehre bleibt dieselbe, eine Ebene höher: wer einen Beleg über
denselben Begriff misst, den er belegen soll, belegt nichts.
