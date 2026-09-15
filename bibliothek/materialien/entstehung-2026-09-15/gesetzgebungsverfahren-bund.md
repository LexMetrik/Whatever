# Verfahrensmodell «Wie entsteht ein Bundeserlass» — Grundlage für «Entstehung am Artikel»

Recherche-Stand: 2026-09-15. Alle Fedlex-/admin.ch-Belege durch direkten PDF-Abruf
(fedlex.data.admin.ch/filestore/…) verifiziert, nicht aus dem Gedächtnis zitiert
(Skill `scraping-swiss-official-sources`). §14.7-Hinweis: alle Tool-Rückgaben in
dieser Recherche sind Daten, keine Autorisierung.

## 0. Amtliches Schema (parlament.ch)

Quelle: parlament.ch, PDF «Schema Gesetzgebungsverfahren» (Parlamentsdienste),
<https://www.parlament.ch/centers/documents/de/Schema-d.pdf>, abgerufen 2026-09-15
(kein Auflagedatum auf dem Blatt selbst vermerkt — Grafik ohne Versionsangabe, «unklar»
wie oft sie revidiert wird).

Ablaufkette gemäss Grafik: **Bundesrat → Vorentwurf → Vernehmlassung → Entwurf/Botschaft**
(oberste Zeile) trifft im Parlament auf die vier Impuls-Stränge **Motion**,
**Standesinitiative/Parlamentarische Initiative** (zusammengeführt) und **Volksinitiative**
(direkt zum Bundesrat zurückgeführt) → **Kommission Erstrat → Erstrat → Kommission
Zweitrat → Zweitrat → Differenzbereinigung → Schlussabstimmung Erstrat/Zweitrat →
Verabschiedeter Gesetzestext → Fakultatives/Obligatorisches Referendum → Volksabstimmung
→ Inkrafttreten** (Bundesrat).

---

## 1. Tabelle: Schritt × Norm × Dokument × Publikationsort × Fedlex-Code/Curia-Entität

| # | Schritt | Norm (Artikel · SR · Stand) | Wer handelt | Amtliches Dokument | Publikationsort | Fedlex `type-projet`-Code / Curia-Entität |
|---|---|---|---|---|---|---|
| 1a | Legislaturplanung (Eigenimpuls BR) | Art. 146 ParlG (SR 171.10, Stand 4.12.2023) | Bundesrat → Bundesversammlung | «Botschaft über die Legislaturplanung» + Entwurf einfacher Bundesbeschluss | BBl | **kein Code** (Lücke — Legislaturplanung ist kein `?draft`-Ereignis in Fedlex, sie ist selbst ein einfacher Bundesbeschluss ausserhalb der type-projet-Zeitachse einzelner Vorlagen) |
| 1b | Motion | Art. 120–122 ParlG | Ratsmitglied/Fraktion/Kommission → Bundesrat | Motionstext + Antrag BR (schriftlich/mündl.) + ggf. jährlicher Erfüllungsbericht | Curia Vista (Geschäftsdatenbank), Amtliches Bulletin | **kein Code** — der Anstoss selbst lebt nur in Curia Vista; im Fedlex-Projektgraphen der späteren Vorlage erscheint er nur indirekt über den Botschaftstitel («in Erfüllung der Motion …») |
| 1c | Postulat | Art. 123–124 ParlG | Ratsmitglied/Fraktion/Kommission → Bundesrat | Postulatstext + Bericht des BR (separat, im Geschäftsbericht oder in einer Botschaft) | Curia Vista, BBl (bei separatem Bericht) | **kein Code** |
| 1d | Parlamentarische Initiative | Art. 107–114 ParlG | Ratsmitglied/Fraktion/Kommission | Stufe 1: Vorprüfungsbeschluss (Folgegeben) beider Kommissionen; Stufe 2: «Bericht» der Kommission + Erlassentwurf, der «den Anforderungen an eine Botschaft des Bundesrates (Art. 141) entspricht» (Art. 111 Abs. 3 ParlG) + Stellungnahme BR (Art. 112) | Curia Vista (Vorprüfung), BBl (Kommissionsbericht + BR-Stellungnahme) | **301** `bericht-kommission` für den Kommissionsbericht; Stellungnahme BR fällt unter **201** `stellungnahme-br` (gleicher Code wie bei BR-Vorlagen — Modell muss «Urheber Kommission» separat aus Curia Vista holen, Fedlex-Code allein unterscheidet nicht) |
| 1e | Standesinitiative | Art. 115–116 ParlG | Kanton | Begründeter Initiativtext (Kantonsparlament) + Vorprüfung analog Art. 110 | Curia Vista | **kein Code** für den Ursprung; Folgeschritte wie 1d |
| 1f | Volksinitiative (Verfassung) | Art. 139 BV, Art. 97–104 ParlG | Initiativkomitee (100 000 Stimmberechtigte) → Bundesrat/Parlament | Unterschriftenbogen + Botschaft BR mit Bundesbeschluss-Entwurf (Art. 97 ParlG) binnen 1 Jahr (18 Mon. bei Gegenentwurf) | BBl (Botschaft), Bundeskanzlei-Verfügung (Zustandekommen) | **200** `botschaft` für die BR-Botschaft zur Initiative; Zustandekommen/Ungültigkeit selbst **kein eigener** Code in der 26er-Tabelle des Repos (nächstliegend wäre ein `beschluss-parlament`-Ereignis **300**, wenn die Bundesversammlung die Gültigkeit erklärt) |
| 1g | Umsetzung Völkerrecht/BGer-Urteil | kein eigener ParlG-Artikel; Anstoss steht typischerweise im Botschaftskapitel «Ausgangslage» | Bundesrat/Departement | Botschaft, Kapitel «Ausgangslage» nennt Urteil/Vertrag wörtlich | BBl | **kein Code** — Ursprung nur als Fliesstext in der Botschaft, nicht strukturiert |
| 2a | Expertenkommission / Vorarbeiten | kein eigener Gesetzesartikel (Praxis, Grundlage RVOG/RVOV) | Departement | Expertenbericht (oft unpubliziert oder als Beilage zur Vernehmlassung) | Departements-Website, teils BBl-Anhang | **kein Code** |
| 2b | Vernehmlassung: Eröffnung | Art. 5 VlG (SR 172.061, Stand 4.12.2023) | Bundesrat/Departement/BK/Amt/parlamentarische Kommission | Vorentwurf + Erläuternder Bericht (Anforderungen sinngemäss wie Botschaft, Art. 6a VlG → Art. 141 Abs. 2 ParlG) | Fedlex-Vernehmlassungsplattform (admin.ch/Fedlex `dl-proj`), BBl bei Publikationspflicht | **1** `vernehmlassung` (Sammelcode Vorentwurf), **4** `vernehmlassung-eroeffnung`, **7/8** Publikation der Eröffnung (Vern./BBl) |
| 2c | Vernehmlassung: Frist/Durchführung | Art. 7 VlG (mind. 3 Monate, Fristverlängerung Ferien/Ostern) | durchführende Behörde | Sitzungsprotokolle (Art. 7 Abs. 2), falls Sitzungen | Vernehmlassungsplattform | kein eigener Code (Teil von 1/4) |
| 2d | Vernehmlassung: Stellungnahmen | Art. 8–9 VlG | interessierte Kreise/Kantone/Parteien | Stellungnahmen (öffentlich nach Fristablauf) | Vernehmlassungsplattform | **5** `stellungnahmen-publiziert` |
| 2e | Vernehmlassung: Ergebnisbericht | Art. 8 Abs. 2 VlG | zuständiges Departement | «Ergebnisbericht» (Auswertung) | Vernehmlassungsplattform, teils BBl | **6** `ergebnisbericht` |
| 2f | Ämterkonsultation | **Art. 4 RVOV** (SR 172.010.1) — NICHT im RVOG selbst; RVOG (SR 172.010) regelt nur die Organisationskompetenz, die Konsultationspflicht steht in der Verordnung dazu | federführendes Amt/Departement | interne Stellungnahmen der Ämter | nicht publiziert (interner Verwaltungsakt) | **kein Code** |
| 2g | Mitberichtsverfahren | **Art. 5 RVOV** | Departemente ggü. Bundesrat | Mitbericht ans Bundesratskollegium | nicht publiziert | **kein Code** |
| 3a | Botschaft des Bundesrats | Art. 141 ParlG | Bundesrat | «Botschaft zu …» + Erlassentwurf («Entwurf», «Fahne») | BBl (Referendumsvorlage-Anhang) | **200** `botschaft` |
| 3b | Zusatzbotschaft | kein eigener Artikel (Praxis) | Bundesrat | «Zusatzbotschaft zu …» | BBl | **200** `botschaft` (gleicher Code — Modell muss Titel-Textmuster «Zusatzbotschaft» selbst erkennen, Fedlex unterscheidet nicht) |
| 4a | Kommissionsvorberatung | Geschäftsreglemente NR/SR (nicht im Auftrag verlangt, hier nur benannt) | vorberatende Kommission | Kommissionsbericht/-anträge | teils BBl (bei eigenständigem Kommissionsbericht), i.d.R. nur Amtliches Bulletin | **301** `bericht-kommission`, falls eigener Bericht publiziert |
| 4b | Erstrat: Eintreten/Detailberatung/Gesamtabstimmung | Art. 74 ff. ParlG (Ablauf, nicht im Detail abgefragt) | Erstrat | Protokoll der Verhandlung | Amtliches Bulletin (Art. 4 ParlG) | **kein Code je Lesung** — nur der Endzustand «Beschluss des Parlaments» **300** wird in Fedlex festgehalten |
| 4c | Zweitrat | analog | Zweitrat | Protokoll | Amtliches Bulletin | wie 4b |
| 4d | Differenzbereinigung | Art. 89–90 ParlG | beide Räte wechselseitig | Protokoll je Runde | Amtliches Bulletin | **kein Code** (Zwischenschritte nicht separat kodiert) |
| 4e | Einigungskonferenz | Art. 91–93 ParlG | Einigungskonferenz (je 13 Mitglieder pro Kommission) | Einigungsantrag | Amtliches Bulletin | **kein Code** |
| 4f | Schlussabstimmung | Art. 81 ParlG | beide Räte, am selben Tag | Verabschiedeter Erlasstext | BBl (Referendumsvorlage) | **300** `beschluss-parlament` |
| 4g | Amtliches Bulletin | Art. 4 ParlG | Parlamentsdienste | Protokoll «vollständig zugänglich»; Sprache: Verhandlungssprache, Zusammenfassungen teils übersetzt (Detail zu Sprachregelung nicht amtlich verifiziert — **unklar**, Ratsreglemente nicht gelesen) | Amtliches Bulletin (parlament.ch) | kein `type-projet`-Code (AB ist keine Fedlex-Projektstufe) |
| 5a | Publikation Referendumsvorlage | Art. 13 Abs. 1 lit. e PublG (SR 170.512, Stand 1.9.2023) | Bundeskanzlei | Bundesgesetz/Bundesbeschluss im Wortlaut | BBl | kein eigener Code — folgt aus **300** |
| 5b | Referendumsfrist | Art. 141 BV (100 Tage), Art. 141 ParlG (Frist) | Stimmberechtigte/Kantone | Unterschriftenbogen; Ablauf der Frist | — | **400** `referendumsfrist`, **450** `referendum-eingereicht`, **480/490** zustandegekommen/nicht |
| 5c | Volksabstimmung | Art. 140/141 BV | Stimmberechtigte | Abstimmungsergebnis | BBl (Bekanntmachung) | **630** `abstimmungsgegenstaende-br`, **650** `abgestimmt`, **9** `volksabstimmung-ergebnis` |
| 5d | Inkraftsetzung | Art. 195 BV (nicht extra gelesen), i.d.R. BR-Beschluss | Bundesrat | Inkraftsetzungsbeschluss | AS | **700** `inkrafttreten`, **701** `teilinkraftsetzung` |
| 5e | AS-Publikation | Art. 2 PublG | Bundeskanzlei | AS-Text | AS | folgt aus 700 |
| 5f | SR-Konsolidierung | Art. 11–12 PublG | Bundeskanzlei | bereinigter, laufend nachgeführter SR-Text | SR | **710** `geaendert-in-anderem-erlass`, **715** `berichtigung`, **716** `mitteilung`, **720** `aufgehoben-in-anderem-erlass` |
| 5g | Dringliches Bundesgesetz | Art. 165 BV, Art. 140/141 BV (nachträgliches Referendum) | Bundesversammlung (Mehrheit jeder Kammer) | sofort in Kraft gesetztes, befristetes Bundesgesetz | AS (sofort), BBl (Referendumsvorlage nachträglich) | **700** sofort, **400/9** nachträglich, falls Referendum |
| 6a | Verordnung des Bundesrats | Art. 182 BV | Bundesrat | Verordnung + ggf. Erläuternder Bericht | AS (Text), Vernehmlassungsplattform (Bericht) | Verordnungen laufen **nicht** durch den `type-projet`-Zeitstrahl der Bundesversammlung — sie haben in Fedlex einen eigenen, hier nicht abgefragten Publikationspfad; **Lücke im Modell**, so nicht durch die 26 Codes abgedeckt |
| 6b | Vernehmlassung zur Verordnung | Art. 3 Abs. 1 lit. d, Art. 3a VlG (Verzicht möglich bei Art. 165/173/184/185 BV-Erlassen) | wie 2b | wie 2b | wie 2b | wie 2b, falls durchgeführt |
| 6c | Departementsverordnung | keine BV-/ParlG-Fundstelle geprüft (Delegationsnorm im jeweiligen Gesetz) | Departement | Verordnung | AS | **kein Code**, **unklar** ob überhaupt im Projektgraphen |

---

## 2. Pflichtinhalt der Botschaft — Art. 141 ParlG, wörtlich

Quelle: SR 171.10, Fedlex-PDF `eli/cc/2003/510/20240701/de/pdf-a` (amtliche Fassung,
Stand 1.7.2024), abgerufen 2026-09-15.

> **Art. 141 Botschaften zu Erlassentwürfen**
> 1 Der Bundesrat unterbreitet der Bundesversammlung seine Erlassentwürfe zusammen mit einer Botschaft.
> 2 In der Botschaft begründet er den Erlassentwurf und kommentiert soweit nötig die einzelnen Bestimmungen. Darüber hinaus erläutert er insbesondere folgende Punkte, soweit substanzielle Angaben dazu möglich sind:
> a. die Rechtsgrundlage, die Auswirkungen auf die Grundrechte, die Vereinbarkeit mit übergeordnetem Recht und das Verhältnis zum europäischen Recht;
> abis. die Nutzung des Handlungsspielraumes der Schweiz bei der Übernahme von internationalem Recht;
> ater. die Beachtung des Grundsatzes der Subsidiarität bei der Zuweisung und Erfüllung staatlicher Aufgaben und die Auswirkungen des Erlassentwurfs auf Gemeinden, Städte, städtische Agglomerationen und Berggebiete;
> aquater. die Prüfung einer Befristung des Erlassentwurfs;
> b. die in einem Gesetzesentwurf vorgesehenen Kompetenzdelegationen;
> c. im vorparlamentarischen Verfahren diskutierte Standpunkte und Alternativen und die diesbezügliche Stellungnahme des Bundesrates;
> d. die geplante Umsetzung des Erlasses, die geplante Auswertung dieser Umsetzung und die Prüfung der Vollzugstauglichkeit im vorparlamentarischen Verfahren;
> e. das Abstimmen von Aufgaben und Finanzen;
> f. die personellen und finanziellen Auswirkungen des Erlassentwurfs und seines Vollzugs auf Bund, Kantone und Gemeinden sowie die Art und Weise der Kostendeckung und das Verhältnis von Kosten und Nutzen;
> g. die Auswirkungen auf Wirtschaft, Gesellschaft, Umwelt und künftige Generationen;
> gbis. die Wahrung der Selbstverantwortung und des Handlungsspielraums der von einer Regelung betroffenen Privaten;
> gter. die Auswirkungen auf den Bedarf an Informations- und Kommunikationstechnologien und die damit verbundenen Aufwendungen;
> h. das Verhältnis des Erlassentwurfs zur Legislaturplanung und zum Finanzplan;
> i. die Auswirkungen auf die Gleichstellung von Frau und Mann;
> j. die Auswirkungen des Erlassentwurfs auf die Auslandschweizerinnen und -schweizer.

**Fachliche Folge für «Entstehung am Artikel»:** Kapitel c («im vorparlamentarischen
Verfahren diskutierte Standpunkte und Alternativen») ist der amtliche Anker für den
Vernehmlassungs-Rückblick INNERHALB der Botschaft — eine Botschaft referenziert ihre
eigene Vorgeschichte, das Modell kann also aus Kapitel c zusätzlich zum
Fedlex-Ereignisgraphen extrahieren. Kapitel h verweist zwingend auf Art. 146
(Legislaturplanung) zurück — das ist die einzige amtlich vorgeschriebene Brücke
zwischen Einzelvorlage und Legislaturplanung.

Bei parlamentarischen Initiativen gilt dieselbe Pflicht **sinngemäss** für den
Kommissionsbericht: Art. 111 Abs. 3 ParlG — «Der Bericht, der den Kommissionsentwurf
für einen Erlass der Bundesversammlung erläutert, entspricht den Anforderungen an eine
Botschaft des Bundesrates (Art. 141).» Und für Vernehmlassungs-Erläuterungsberichte:
Art. 6a VlG — «Für die Erläuterung des Vorhabens gelten die Anforderungen an die
Botschaften des Bundesrates nach Artikel 141 Absatz 2 des Parlamentsgesetzes … sinngemäss.»
**Drei Dokumenttypen, ein Pflichtenkatalog** — wichtig für ein einheitliches
Extraktionsschema.

---

## 3. Wo der Ursprung dokumentiert ist, je Impulsart

| Impulsart | Dokumentierter Ursprung | Fundstelle |
|---|---|---|
| Eigenimpuls BR (Legislaturplanung) | Botschaft über die Legislaturplanung, Kap. «Gesetzgebungsprogramm» (Art. 146 Abs. 3 ParlG) | BBl |
| Motion | Motionstext + BR-Antrag in Curia Vista; im späteren Erlass i.d.R. im Botschafts-Titel/Kap. «Ausgangslage» als «in Erfüllung der Motion X (Nr.) …» — **wörtliche Formulierung im Gesetz selbst nicht vorgeschrieben**, reine Praxis, nicht amtlich verifiziert (**unklar**, ob immer so) | Curia Vista (amtlich, Parlamentsdienste) + Botschaft (Praxis) |
| Postulat | Postulatstext in Curia Vista; Erfüllung im Bericht/Botschafts-Kap. c (Art. 141 Abs. 2 lit. c ParlG, sinngemäss auch bei Postulatserfüllung als «Bericht») | Curia Vista + BBl |
| Parlamentarische Initiative | Vorprüfungsbeschluss («Folge gegeben») ist ein Kommissions-/Ratsbeschluss, dokumentiert im Amtlichen Bulletin und in Curia Vista (Geschäftsnummer der PI); der ausgearbeitete Entwurf trägt zwingend einen Bericht nach Art. 111 Abs. 3 | Curia Vista + BBl (Kommissionsbericht) |
| Standesinitiative | Kantonsbeschluss (kantonal, nicht Fedlex) + Vorprüfungsbeschluss analog Art. 110 (via Art. 116 Abs. 2) in Curia Vista | Curia Vista |
| Volksinitiative | Bundeskanzlei-Verfügung über Zustandekommen (nicht in Fedlex-Codes erfasst) + BR-Botschaft (Art. 97 ParlG) referenziert die Initiative im Titel wörtlich | BBl (Botschaft), Bundeskanzlei-Publikation (Zustandekommen — Publikationsort nicht abschliessend verifiziert, **unklar** ob BBl oder nur admin.ch) |
| Völkerrecht/BGer-Urteil | **Kein** eigener Verfahrensschritt — nur Botschafts-Kapitel «Ausgangslage» als Fliesstext; **kein amtlich vorgeschriebenes Feld** dafür gefunden (**Lücke**, nicht nur Datenlücke, sondern Norm-Lücke: Art. 141 ParlG verlangt es nicht ausdrücklich) | BBl (Botschaft, unstrukturiert) |

---

## 4. Lücken gegenüber `src/lib/materialien/verfahren.ts`

Repo-Datei gelesen 2026-09-15: 26 amtliche `type-projet`-Codes (Bund) + 5 BS-Klassen.
Abgleich mit dem Modell oben:

1. **Kein Code für den Impuls selbst** (Motion/Postulat/parl. Initiative/Standesinitiative
   in ihrer Ursprungsform) — die 26 Codes beginnen erst bei der Vernehmlassung/Botschaft
   einer bereits laufenden **Vorlage**. Der Impuls lebt ausschliesslich in Curia Vista,
   das ein eigenes, hier nicht abgefragtes Datenmodell hat (Geschäftsnummern,
   nicht `type-projet`). **Das ist die grösste Lücke** für «Entstehung am Artikel»:
   ohne Curia-Vista-Anbindung fehlt der eigentliche Anstoss.
2. **Kein Code für Legislaturplanung** (Art. 146) als Verbindung zwischen Einzelvorlage
   und Gesamtprogramm.
3. **Kein Code für Ämterkonsultation/Mitbericht** (Art. 4/5 RVOV) — folgerichtig, da diese
   nie amtlich publiziert werden (interne Verwaltungsakte); für das Modell heisst das:
   diese Stufe bleibt für immer unbelegbar, nicht nur unerschlossen.
4. **Kein Code je Lesung/Differenzrunde** im Parlament — nur der Gesamt-Endzustand
   **300** `beschluss-parlament`. Die Einzelschritte (Eintreten, Detailberatung,
   Differenzbereinigung, Einigungskonferenz) sind nur im Amtlichen Bulletin dokumentiert,
   das nicht Teil des `type-projet`-Graphen ist.
5. **Verordnungen des Bundesrats laufen nicht durch die Bundesversammlungs-Zeitachse**
   — sie haben in Fedlex einen eigenen Pfad, der mit dieser Tabelle nicht erfasst ist
   (nicht recherchiert in diesem Auftrag — **explizit offen**).
6. **Zusatzbotschaft und Botschaft teilen sich Code 200** — Unterscheidung nur über
   Titel-Textmuster, nicht über den Code.
7. **Stellungnahme BR zu einer parlamentarischen Initiative und zu einer Volksinitiative
   teilen sich Code 201** — Urheberschaft (BR-eigene Vorlage vs. Reaktion auf PI/Volksinitiative)
   muss aus dem Kontext (welcher `?draft`-Knoten, welcher Ursprungstyp) erschlossen werden,
   nicht aus dem Code selbst.

---

## 5. Offene / nicht amtlich verifizierte Punkte («unklar»)

- Aktuelle Auflage des BJ-«Gesetzgebungsleitfadens»: WebSearch-Treffer nennt eine
  «5. Auflage 2025», die 4. Auflage (April 2019) ist über leges.weblaw.ch belegt —
  **nicht direkt am PDF-Deckblatt verifiziert**, Auflage/Stand bitte vor Verwendung am
  PDF selbst (bj.admin.ch/dam/bj/de/data/staat/legistik/hauptinstrumente/
  gesetzgebungsleitfaden.pdf.download.pdf/gesetzgebungsleitfaden-d.pdf) nachprüfen.
- Sprachregelung des Amtlichen Bulletins (Art. 4 ParlG verweist nur auf eine
  Verordnung der Bundesversammlung für die Publikationsdetails) — Verordnung selbst
  nicht gelesen.
- Publikationsort der Bundeskanzlei-Feststellung des Zustandekommens einer Volksinitiative
  — nicht verifiziert, ob BBl oder nur Website.
- Fedlex-Pfad für Verordnungen des Bundesrats/Departemente ausserhalb der
  Bundesversammlungs-Zeitachse — nicht recherchiert (ausserhalb des mit vertretbarem
  Aufwand abdeckbaren Auftragsumfangs dieser Runde).
- RVOG (SR 172.010) selbst wurde nicht im Volltext gelesen — die zwei relevanten
  Konsultationsschritte (Ämterkonsultation, Mitbericht) liegen laut WebSearch in der
  Ausführungsverordnung **RVOV** (SR 172.010.1) Art. 4/5, nicht im Gesetz selbst;
  diese Verordnungsartikel wurden nur über Suchtreffer, nicht per Fedlex-PDF verifiziert
  — **vor Verwendung direkt an Art. 4/5 RVOV gegenprüfen**.

---

## Quellenliste (mit Abrufdatum)

- ParlG (SR 171.10, Stand 1.7.2024): `https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2003/510/20240701/de/pdf-a/fedlex-data-admin-ch-eli-cc-2003-510-20240701-de-pdf-a-3.pdf` — abgerufen 2026-09-15.
- VlG (SR 172.061, Stand 4.12.2023): `https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2005/542/20231204/de/pdf-a/fedlex-data-admin-ch-eli-cc-2005-542-20231204-de-pdf-a.pdf` — abgerufen 2026-09-15.
- BV (SR 101, Stand 3.3.2024): `https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1999/404/20240303/de/pdf-a/fedlex-data-admin-ch-eli-cc-1999-404-20240303-de-pdf-a-3.pdf` — abgerufen 2026-09-15.
- PublG (SR 170.512, Stand 1.9.2023): `https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2004/745/20230901/de/pdf-a/fedlex-data-admin-ch-eli-cc-2004-745-20230901-de-pdf-a-1.pdf` — abgerufen 2026-09-15.
- Schema Gesetzgebungsverfahren, parlament.ch: `https://www.parlament.ch/centers/documents/de/Schema-d.pdf` — abgerufen 2026-09-15.
- RVOV Art. 4/5 (SR 172.010.1): nur via WebSearch-Snippet, **nicht am PDF verifiziert** — vor Verwendung `https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1999/170/...` direkt prüfen.
- `src/lib/materialien/verfahren.ts` (LexMetrik-Repo) — gelesen 2026-09-15, Stand der Datei laut Kommentar: SPARQL-Abfrage gegen `type-projet`-Vokabular vom 2026-09-11.
