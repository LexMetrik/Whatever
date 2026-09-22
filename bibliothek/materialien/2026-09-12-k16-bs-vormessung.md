# K-16 Vormessung — Kantonale Materialien Basel-Stadt an die Botschaften-Pipeline

**Erstellt:** 2026-09-12 · **Stand der Messung:** 2026-09-12 (alle Abrufe dieses Datums)
**Status:** Messung abgeschlossen, Bau-Entscheid begründet · fachliche Abnahme David offen
**Auftrag:** K-16 (Unterpunkt W2·13-KANTONE-DATEN), Reihenfolge Bund → BS → ZH
**Vorbild:** Bund-Pipeline #792 (E1 Verfahrens-Ereignisse) · Spec FAHRPLAN-MATERIALIEN-VERZAHNUNG §11
**Vorrecherche:** [entstehung-2026-09-06/kantone-zh-bs.md](entstehung-2026-09-06/kantone-zh-bs.md) (6.9.2026)

Diese Messung steht VOR dem Bau (Weisung «Messen vor Handeln»). Sie beantwortet drei
Fragen: Welche amtlichen Datensätze gibt es, gibt es einen **amtlichen** Schlüssel
Erlass ↔ Geschäft, und wie weit trägt er. Alle Zahlen sind reproduzierbar; die
Abruf-URLs stehen je Abschnitt.

---

## 1 Quellen (alle am 12.9.2026 abgerufen, HTTP 200)

| Datensatz | URL | Lizenz | Umfang (gemessen) |
|---|---|---|---|
| 100311 Grosser Rat: Geschäfte | `https://data.bs.ch/api/explore/v2.1/catalog/datasets/100311/records` | CC BY 4.0 | 21 164 Records |
| 100313 Grosser Rat: Dokumente | `…/datasets/100313/records` | CC BY 4.0 | 56 675 Records |
| 100354 Gesetzessammlung: Gesetzestexte | `…/datasets/100354/records` | CC BY 4.0 | 11 007 Records, davon **937 aktiv** |
| 100355 Gesetzessammlung: Gesetzesänderungen | `…/datasets/100355/records` | CC BY 4.0 | 3 255 Records |
| LexWork-API der BS-Gesetzessammlung | `https://www.gesetzessammlung.bs.ch/api/texts_of_law/<SG>` | (keine Lizenz-Deklaration am Endpunkt) | je Erlass 26 KB – 7,0 MB |

Vollexporte für die Messung über `…/exports/json?select=…` (100311: 7,3 MB / 12 s;
100313: 23,8 MB / 23 s; 100354 aktiv: 419 KB). Die Exporte erlauben feldweise
Auswahl — der Adapter holt damit **keine** Personenfelder (§Personendaten unten).

### 1.1 Korpus-Abgleich
859 BS-Erlasse im LexMetrik-Korpus (`public/normtext/kanton/BS-*.json`), 937 aktive
Erlasse in 100354. Schnittmenge **859** — der Korpus ist eine echte Teilmenge, kein
Erlass des Korpus fehlt in der amtlichen Liste (0 Waisen). Kategorien im Korpus
(amtliches Feld `category_name` aus 100354):

| Kategorie | Erlasse im Korpus |
|---|---|
| Verordnung | 314 |
| Gemeindeerlass | 158 |
| **Gesetz** | **134** |
| Interkantonale Vereinbarung | 95 |
| Anderes | 82 |
| Reglement | 44 |
| Staatsvertrag | 30 |
| Verfassung / Dekret | 1 / 1 |

**Adressierbare Grundmenge** für Grossrats-Materialien = Gesetz + Verfassung + Dekret
= **136**. Verordnungen (314) beruhen auf Regierungsratsbeschlüssen; für RR-Geschäfte
gibt es laut Vorrecherche keinen strukturierten Export (nur HTML) — Negativbefund
bestätigt, nicht neu geprüft.

---

## 2 Schlüsselfrage Erlass/§ ↔ Geschäft

### 2.1 Amtlicher Schlüssel — vorhanden, aber sehr dünn (belegt)
Die Fussnoten der BS-Gesetzessammlung nennen in wenigen Fällen die Geschäftsnummer
wörtlich. Beispiel aus dem Korpus (`public/normtext/struktur/kanton/BS-132.100.json`):

> «Ingress in der Fassung des GRB vom 27. 6. 2007 (wirksam seit 13. 9. 2007;
> Ratschlag Nr. 06.1970.01, Kommissionsbericht Nr. 06.1970.02 ).»

Gegenprobe gegen 100313 (`where=signatur_ges="06.1970"`, 4 Dokumente):
`06.1970.01` = «Ratschlag des RR», 2007-03-06 · `06.1970.02` = «Bericht SpezKo
Verfassung», 2007-05-30 · dazu «GR Beschluss» vom **2007-06-27** = das in der Fussnote
genannte GRB-Datum. **Identitäts-Treffer auf allen drei Angaben** — die Fussnoten-
Nummer ist identisch mit `signatur_dok`. Das ist ein amtlicher Schlüssel.

Deckung im Korpus: `grep` über alle 859 BS-Struktur-Sidecars →
**8 Referenzen in 5 Erlassen** (`Ratschlag Nr.` 8×, davon `Kommissionsbericht Nr.` 3×,
`Bericht der Finanzkommission` 2×, `Bericht der Regiokommission` 1×, `Bericht` 1×).
Gesamt-Fussnotenbestand zum Vergleich: 2 908 Fussnoten in 793 Erlassen, davon
672 blosse Querverweise (`SG ###.###`), 326 «Wirksam seit …», 196 «RRB vom …»,
13 «GRB vom …». **Die Gesetzessammlung BS zitiert das auslösende Geschäft praktisch
nie** — das ist die Eigenschaft der Quelle, nicht ein Extraktionsverlust.

### 2.2 Kein Materialien-Feld an der amtlichen Fassung (Negativbefund, gemessen)
Die LexWork-API führt je Erlass `change_documents[]` mit den Feldern `materials` und
`external_links`. Stichprobe 17 Erlasse (zufällig 14 + gezielt 111.100/132.100/640.100),
**126 change_documents: `materials` 0×, `external_links` 0× belegt**. Auch
`gesetzestext_html` in 100354 trägt keine Änderungs-Fussnoten. Ein amtlich gepflegter
Link «Fassung → Ratschlag» existiert an der Quelle nicht.

### 2.3 Was die amtliche Fassung stattdessen trägt
`old_versions[].version_dates_str` nennt je Fassung ein **Beschlussdatum**:
«Version in Kraft seit: 01.01.2025 bis: 31.12.2025 (Beschlussdatum: 22.03.2023)».
Stichprobe: 87 Fassungen, **87× Beschlussdatum vorhanden**. Das Feld `change_date` in
100355 ist NICHT das Beschlussdatum, sondern das Auffinde-/Publikationsdatum
(identisch mit `found_at`, gemessen an 640.100) — als Verfahrensdatum unbrauchbar.

### 2.4 Heuristiken — gemessen, nicht geschätzt
Denominator ist jeweils die adressierbare Grundmenge (136 Gesetze/Verfassung/Dekret).

| Weg | Regel | Erlasse | Kanten | Adressierbar | Befund |
|---|---|---|---|---|---|
| **A amtlich** | Fussnote «Ratschlag/Bericht Nr. NN.NNNN.NN» → `signatur_dok` | 5 | 8 | 5/136 = 3,7 % | präzise, verifiziert (§2.1) |
| **B** | SG-Nummer wörtlich im Geschäftstitel («… (SG 162.100) …») | 20 | 26 | 17/136 = 12,5 % | expliziter Erlass-Verweis, hohe Präzision |
| **C roh** | Erlassdatum «vom TT. Monat JJJJ» im Geschäftstitel | 56 | 146 | 43/136 | **belegt fehlerhaft** (s. u.) |
| **C+** | C **und** Erlasstitel/Stichwort im Titel (genitiv-tolerant) | 37 | 102 | 35/136 = 25,7 % | tragfähig |
| D | Beschlussdatum ↔ Tag eines «GR Beschluss»-Dokuments | — | — | — | **verworfen** |

**Warum C roh nicht genügt** (Rot-Beweis der Schärfung, 44 verworfene Paare):
BS-161.100 «Gesetz über die Haftung des Staates und seines Personals» trägt dasselbe
Erlassdatum (17. November 1999) wie BS-162.100 «Personalgesetz»; C roh verbindet
161.100 mit «Teilrevision des Personalgesetzes vom 17. November 1999 (SG 162.100)» —
**falsch**. Weitere Kollisionen: BS-153.600 (Archivwesen) → «Ratschlag betreffend
MitarbeiterInnengesprächunterlagen», BS-780.350 → «Schriftliche Anfrage … Demo vom 1…».
Die Datumsangabe allein ist kein Schlüssel.

**Warum D verworfen ist:** 104 Fassungen mit Beschlussdatum, davon 48 mit irgendeinem
Beschluss-Dokument am selben Tag; nach Titel-Wortdeckung ≥ 2 blieben 28, davon nur 21
eindeutig. Ein Sessionstag trägt bis **114** Beschluss-Dokumente (14.9.2022) — die
Zuordnung wäre geraten, nicht abgeleitet (§2).

**C+ im Wortlaut** (deterministisch, keine Schwellwerte, kein Scoring): Das
Erlassdatum des Korpus-Sidecars (`kopf.erlassdatum`, «Vom 12. April 2000»; in allen
859 Sidecars vorhanden, 859/859 geparst) muss im Geschäftstitel als «vom 12. April
2000» stehen, **und** der Erlasstitel, sein Rumpf nach dem Gattungswort oder ein
amtliches Stichwort (`keywords_de` aus 100354) muss im selben Titel als ganzes Wort
vorkommen, wobei jedes Wort ein angehängtes `es`/`s`/`n` tragen darf (deutscher
Genitiv: «Lohngesetz» ↔ «Teilrevision des **Lohngesetzes** vom 18. Januar 1995»).

---

## 3 Entscheid

**Gebaut wird** (Umfang bewusst kleiner als die Auftragsskizze):

1. **Adapter + Register-Einträge + Verfahrenskette.** Die Geschäfte des Grossen Rates
   mit ihren Dokumenten sind amtlich, vollständig und verlässlich; die Kette
   Ratschlag des RR → Kommissionsbericht → GR-Beschluss ist aus 100313 exakt
   ableitbar (Doktyp-Etiketten sind amtliche Feldwerte, keine Umschreibung). Diese
   Einträge reihen sich wie die Botschaften in `public/materialien/register.json`
   ein — kein neues Artefakt, keine zweite Tabelle (§5).
2. **Verkantung ausschliesslich über die drei belegten Wege A/B/C+**, mit ehrlicher
   Herkunft je Kante: A = `amtlich`, B und C+ = `maschinell` (§8). Kein Eintrag ohne
   Kante — die 21 164 Geschäfte kommen NICHT vollständig ins Register.

**Nicht gebaut wird, mit Begründung:**

- **Keine Kanten-Shards** `public/materialien/kanten/BS-*.json`. Die Shards entstehen
  ausschliesslich aus `daten/soft-law.db`; die Datei ist gitignoriert und in keinem
  frischen Worktree vorhanden. Ein an der DB vorbei geschriebener BS-Shard würde beim
  nächsten echten `npm run materialien`-Lauf als Waise **gelöscht**
  (`schreibeShardsUndBereinige`). Die Erlass-Verknüpfung läuft darum über `normKeys`
  am Register-Eintrag — exakt der Weg, den die Bundes-Botschaften schon gehen.
- **Keine Entstehungs-Projektion** `public/materialien/entstehung/BS-*.json`. Gemessen:
  `public/normtext/historie/` (209 Dateien) und `public/normtext/revisionen/` (227)
  enthalten **0** kantonale Einträge; die Projektion leitet sich aus Fedlex-`oc`-URIs
  in Artikel-Fussnoten ab, die es für BS nicht gibt. Eine BS-Karte bräuchte eine
  zweite Fassungs-Quelle (LexWork `old_versions`) und damit eine Erweiterung von
  `src/lib/entstehung/projektion.ts` samt Tor — ein eigener Schritt, kein Nebenprodukt
  (UI ist in diesem Auftrag TABU).

---

## 4 Personendaten (Auflage des Auftrags)

100311 führt `name_urheber`, `vorname_urheber`, `partei_kname_urheber`,
`nr_urheber`, `url_urheber` und dieselben Felder für Miturheber — Namen von
Ratsmitgliedern. Der Adapter wählt die Felder per `select=` **einzeln an** und holt
keines dieser Felder; gespeichert werden nur Geschäftsnummer, Titel, Geschäftsart,
Daten, Status und Dokument-Links. Ein Tor prüft die erzeugten Artefakte gegen eine
Verbotsliste von Feldnamen und gegen das Muster «Vorstoss-Urheber im Titel».

*Rest-Risiko, offen:* Geschäfts**titel** nennen bei Vorstössen Namen («Anzug Bülent
Pekerman und Konsorten betreffend …»). Die aufgenommenen Geschäftsarten sind auf
Ratschlag/Bericht/Ausgabenbericht begrenzt (Regierungsrats- und Kommissionsvorlagen),
die diese Namensform nicht tragen; das Tor prüft das nach.

---

## 5 Pflegebedarf

Die Grossrats-Datensätze wachsen laufend (neue Geschäfte, neue Dokumente). Nachzug wie
bei den Botschaften über einen eigenen Monatslauf-Job, nie in der Gate-Kette. Ein
Netz-Tor vergleicht die committeten Einträge stichprobenweise gegen data.bs.ch.

## 6 Offen / David

- **Lizenz-Hinweis:** data.bs.ch steht unter CC BY 4.0 (Feld `license` der Datensätze).
  Die Namensnennung ist im Repo zu führen (Quellen-Nachweis); ob zusätzlich in der UI,
  entscheidet David — die UI war in diesem Auftrag gesperrt.
- **Fachliche Abnahme** der maschinellen Zuordnungen (§7) ist offen; die Einträge
  tragen den Hinweis «maschinell zugeordnet, fachlich nicht geprüft».

---

## 7 Ergebnis des Baus (12.9.2026, nachgetragen)

Gebaut wie unter §3 entschieden. Ist-Zahlen des Laufs vom 12.9.2026:

| Grösse | Wert |
|---|---|
| Register-Einträge (Geschäfte mit ≥ 1 Kante) | **117** |
| Kanten | **122** — Fussnote 8 (amtlich) · SG-Nummer 23 · Datum+Titel 91 |
| verknüpfte BS-Erlasse | **53** |
| Verfahrens-Ereignisse | **409** aus 440 amtlichen Dokumenten |
| nicht klassierte Dokument-Bezeichnungen | 29 (Synopsen, Gesetzestexte, RA-Altnummern) — gezählt und ausgewiesen, nie geraten |
| register.json | 2 115 → 2 326 KB roh · 303 → 324 KB gzip (Deckel `check:entstehung`: 400 KB gzip, damit bei 83 %) |

**Stichprobe gegen die Amtsquelle** (Einzelabfragen `100311/records?where=signatur_ges=…`,
also ein anderer Endpunkt als der Vollexport des Generators): 14 Geschäfte —
alle 8 Fussnoten-Kanten plus 6 gestreute maschinelle — **14/14 Titel wörtlich
identisch, 14/14 Geschäftsart passend zum Doktyp**. Zusätzlich fährt
`check:bs-grossrat-netz` den Vollabgleich: 117/117 deckungsgleich.

**Zwei Befunde, die erst der Bau gezeigt hat** (beide behoben, beide neu bewacht):

1. `signatur_dok` ist in Basel-Stadt **kein URL-Schlüssel**. 16 der 440 Dokumente
   tragen dort zwei Nummern («18.0110.01 18.0112.01» — ein Bericht zu zwei
   Geschäften) oder einen Zusatz («04.2014.01 (RA 9424)»); ihre amtliche Adresse
   ist ein direkter PDF-Pfad, nicht `?dnr=`. Eine konstruierte URL wäre still tot
   gewesen. Gespeichert wird jetzt die amtliche URL wörtlich (§7: nie konstruieren).
2. Die amtlichen Geschäftstitel schreiben das Erlassdatum **uneinheitlich**
   («vom 12.Oktober 1967», ohne Leerzeichen, belegt an 04.0801). Der Kanten-Beleg
   ist darum das Erlassdatum in ISO und kein nachgebauter Titel-Ausschnitt — ein
   Nachbau wäre ein falsches Zitat. Das Tor rechnet den Beleg inhaltlich nach.

**Offen für die Gegenprüfung / Folgeschritte:**

- Der gzip-Deckel des Materialien-Registers steht nach diesem Schritt bei 83 %.
  Ein ZH-Schritt derselben Grössenordnung reisst ihn — vor K-17 ist entweder der
  Deckel zu begründen oder das Register zu teilen (je Behörde/Ebene).
- Die 29 unklassierten Dokument-Bezeichnungen enthalten «RA <Nummer>»-Formen, die
  plausibel Ratschläge unter historischer Nummerierung sind. Plausibel ist nicht
  belegt — sie bleiben ungeführt, bis die Bedeutung von «RA» amtlich belegt ist.
- Entstehungs-Karte für BS: bleibt unmöglich, solange `historie/`+`revisionen/`
  keine kantonalen Sidecars führen (§3). Eigener Schritt.

## 8 Nachtrag Gegenprüfung PR #799 (12.9.2026)

Die adversariale Gegenprüfung bestätigte 34/34 geprüfte maschinelle Kanten, 8/8
amtliche, 0 Personendaten, Determinismus und Tore — mit **einer Auflage**:

Der Doktyp wurde binär abgeleitet («Ratschlag» oder sonst «Bericht»). Geschäft
**21.1247** ist amtlich eine **Initiative** — die kantonale Volksinitiative «1%
gegen globale Armut», die über den amtlichen Fussnoten-Weg hereinkommt und darum
nicht der Artenliste der drei Vorlage-Arten unterliegt. Im Register stand sie als
«Bericht an den Grossen Rat»: eine Volksinitiative als Behördenvorlage etikettiert,
also eine **falsche Rechtsnatur direkt in der Karte** (§1/§8).

Behoben mit einer festen Tabelle `GESCHAEFTSART_DOKTYP` (amtliche `ga_rr_gr` →
Doktyp, Etikett = der amtliche Wert wörtlich); eine unbekannte Art macht den
Generator rot statt sie einzusortieren (§2, Muster `TYPE_PROJET`). Ist-Verteilung
danach: Ratschlag 84 · Bericht 32 · Initiative 1. Das Tor führt unbekannte Arten
jetzt als **Fehler** statt als Hinweis und prüft zusätzlich, dass eine Art
ausserhalb der Vorlage-Arten nur mit Fussnoten-Kante vorkommt.

---

## 9 Nachtrag 12.9.2026: LexWork `versions`-Endpunkt (Fund für R12a)

Im Zuge der Vormessung «Entstehung am Paragraph BS» (FAHRPLAN-KANTONE.md §5
R12a) zusätzlich geprüft: die LexWork-API der BS-Gesetzessammlung liefert unter
`https://www.gesetzessammlung.bs.ch/api/texts_of_law/<SG>` ein Feld
`old_versions[]`; jede darin genannte Fassung ist unter
`https://www.gesetzessammlung.bs.ch/api/texts_of_law/<SG>/versions/<id>` als
**Volltext-XHTML** abrufbar — nicht nur Metadaten. Geprüft am Beispiel **132.100**
(10 Fassungen, HTTP 200, abgerufen 12.9.2026).

**Lizenz unklar.** Der Endpunkt trägt, anders als `100311`–`100355` (data.bs.ch,
CC BY 4.0, §1 oben), **keinen Lizenzvermerk** und ist nicht Teil der
dokumentierten data.bs.ch-Kataloge — er ist die interne API der Gesetzessammlungs-
Website selbst, undokumentiert. Vor jedem Bau auf diesem Fund: (1) Lizenz beim
Kanton BS klären, (2) eine Stabilitäts-Sonde (Endpunkt kann sich ohne
Versionierung ändern). Dieser Fund ändert nichts am §3-Entscheid oben — er senkt
nur die Kosten des R12a-Baus, sobald die Lizenz geklärt ist: eine BS-
Fassungskette bräuchte sonst einen eigenen zweiten Volltext-Parser ohne
erkennbare Quelle.


## 10 Nachtrag 22.9.2026: Lizenz weitgehend geklärt — ohne Anfrage

Die in §9 offene Lizenzfrage ist per Recherche (nicht per Anfrage) weitgehend beantwortet;
Datensatz 100354 wurde per eigenem API-GET gegengeprüft (Zentraler Rechtsdienst, **CC BY 4.0**,
11 018 Records). Kurz:

- `data.bs.ch` **100354 «Gesetzessammlung: Gesetzestexte»** trägt CC BY 4.0, führt 1370
  SG-Nummern und 8061 Records mit Fassungs-Volltext (`gesetzestext_html`) und verlinkt
  **dieselben** Fassungs-IDs wie die interne API (`…/versions/<id>`).
- **Aber:** Fussnoten und Änderungstabellen fehlen im OGD-Text (2 von 2 Stichproben) — genau das,
  was R12a braucht. Dieser Rest liegt ausserhalb der erklärten Lizenz.
- `opendata.swiss` führt die Systematische Gesetzessammlung unter `rights=terms_open`;
  `gesetzessammlung.bs.ch/robots.txt` sperrt nur Such-Endpunkte, nicht `/api/texts_of_law/` oder
  `versions`; kein Crawl-delay. URG Art. 5 Abs. 1 lit. a und Abs. 2 erfassen Erlasse **und**
  amtliche Sammlungen, ohne Beschränkung auf den Bund (SR 231.1, Stand 1.7.2025). Dazu PublG BS
  SG 151.200 §5 und §12 Abs. 2, PublV SG 151.210 §10–14, OGD-Richtlinie RR 22.1.2019 Ziff. 2.2.
- **Schlüssel Erlass↔Geschäft (Handgriff 2) teilweise vorhanden:** kein Datenfeld, aber die
  amtlichen Änderungsdokumente nennen im Ingress die Ratschlags-/Berichtsnummer (3 von 3),
  identisch mit `signatur_dok` in 100313 (4 von 4). Der Schlüssel ist die **Nummer**, nie das
  Datum. Nur über PDF-Fliesstext erreichbar ⇒ Risikopfad.
- **Nicht verifiziert:** ein amtlicher Beleg «kein sui-generis-Datenbankrecht» (nur Negativbefund
  aus dem URG-Volltext); keine BGer-Recherche dazu.

Volle Belegkette, die fünf Fragen für eine allfällige Anfrage und die zuständigen Stellen:
`recherche/legal-design-und-korrektheits-recherche-2026-09-21.md` Ziff. 19. Der Blocker
`david-bs-lizenz-schluessel` bleibt stehen — ob er fällt, entscheidet David.
