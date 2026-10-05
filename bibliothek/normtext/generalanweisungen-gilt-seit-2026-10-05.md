# Generalanweisungen und «Gilt seit» — Anweisungen des Änderungserlasses als Artikel-Ereignis (5.10.2026)

**Erstellt:** 5.10.2026 — Anlass: Roadmap-Schritt `W2·32-GENERALANWEISUNGEN` (Entscheid David 4.10.2026 «A, und C als eigenen Roadmap-Schritt anlegen»; Pflicht aus #1298: «Schritt «C» bekommt den Vermerk, dass er die 12 Daten zurückbringt»).
**Quellen (alle Abruf 5.10.2026):**
- Amtliche Sammlung (AS), PDF-A je Änderungserlass über den Fedlex-Filestore (`https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/oc/<Jahr>/<Nr>/de/pdf-a/…`): AS 1999 1118 = <https://fedlex.data.admin.ch/eli/oc/1999/149> (ZGB, S. 1143 «Ersatz von Ausdrücken» Abs. 1–3; Inkraftsetzung S. 1144 Abs. 2 «auf den 1. Januar 2000»); AS 2011 725 = <https://fedlex.data.admin.ch/eli/oc/2011/114> (ZGB, S. 755; in Kraft 1.1.2013); AS 2020 957 = <https://fedlex.data.admin.ch/eli/oc/2020/178> (OR Handelsregisterrecht, S. 964; «die übrigen Bestimmungen am 1. Januar 2021»); AS 2015 3631 = <https://fedlex.data.admin.ch/eli/oc/2015/609> (Markenschutzgesetz/Swissness, Anhang Ziff. 6 Patentgesetz S. 3645; «auf den 1. Januar 2017»); AS 2006 3459 = <https://fedlex.data.admin.ch/eli/oc/2006/549> (StGB, Änderung vom 13. Dezember 2002, erstes Buch neu gefasst; in Kraft 1.1.2007, Fedlex-Rechtsanalyse `jolux:legalResourceImpactHasDateEntryInForce`); AS 2004 1403 = <https://fedlex.data.admin.ch/eli/oc/2004/176> (StGB-Randtitel zu Art. 52 neu); AS 2006 2197 = <https://fedlex.data.admin.ch/eli/oc/2006/352> (VwVG Anhang Ziff. 10).
- Historische Konsolidierungen der Erlasse (Fedlex-SPARQL `jolux:isMemberOf` + `jolux:dateApplicability`, Format pdf-a): ZGB 44 Stände 1.1.2000–1.7.2026, OR 55 (ab 1.1.2000), PATG 20 (ab 1.1.2001), STGB 86 (ab 1.1.1995; ausgewertet ab 2004), LFG 32 (ab 1.1.2000), VWVG 21 (ab 1.3.2000).
- Gesetzestechnische Richtlinien des Bundes (GTR), Bundeskanzlei, Stand 5. Juni 2026: <https://www.bk.admin.ch/dam/de/sd-web/q96zQo4nmf7w/GTR_DE_20260605.pdf> — Rz. 327–330 (Ersatz von Ausdrücken).
**Status:** Bau-Agent Sonnet — Gegenprüfung durch die Orchestrator-Session ausstehend; fachliche Abnahme David: **entwurf**. Kein `verified`/«geprüft» gesetzt. Zusammenhang: [randtitel-fussnote-gilt-seit-2026-10-03.md](randtitel-fussnote-gilt-seit-2026-10-03.md) (Abschnitt «Bekannte Grenze: Generalanweisungen», «Ergänzung 4.10.2026 — Entscheid A»).

## Befund

Eine Anweisung des Änderungserlasses kann den Körper eines Artikels ändern, ohne dass der Konsolidierungstext am Artikel einen Vermerk trägt:

- **«Ersatz von Ausdrücken»** (GTR Rz. 327–330): «In folgenden Bestimmungen des Zivilgesetzbuches wird der Ausdruck «Gewalt» durch den Ausdruck «Sorge» ersetzt: Art. 25 Abs. 1, 271 Abs. 3, 299, 300 Abs. 1 …» (AS 1999 1118 S. 1143).
- **Neufassung eines Buches:** «Das erste Buch des Strafgesetzbuches erhält die folgende neue Fassung» (AS 2006 3459): Art. 1–110, 127 Überschriften. Am Artikel steht dazu keine Fussnote.

Das Fussnoten-Modell (G-HIST, `historie-parse.ts`) sieht solche Änderungen nicht: «Gilt seit» blieb auf dem Fussnoten-Datum (ZGB 307: 1978 statt 2013) oder fehlte (StGB 52: 2004 statt 2007). Seit Entscheid A (4.10.2026, #1298) zeigten 28 Artikel «Fassung» ohne Datum.

## Regel (umgesetzt in `src/lib/normtext/generalanweisungen.ts`, `historie-parse.ts`, `scripts/normtext/historie-generieren.ts`)

1. Ein **Register** (`ANWEISUNGEN`, 7 Zeilen) führt jede erfasste Anweisung als Daten: Erlass, AS-Fundstelle, Fedlex-Link, Belegstelle (Seite/Ziffer der Anweisung und der Inkraftsetzung), In-Kraft-Datum, Abrufdatum, Ersatzausdruck, die **Artikelliste im Wortlaut** des AS-Erlasses. `parseListe` zerlegt die Liste deterministisch (beide amtlichen Schreibweisen «Abs./Ziff.» und «Absatz/Absätze/Ziffer»); ein unbekanntes Stück wirft.
2. Je genanntem Artikel entsteht ein Ereignis (`typ` «ausdruck» bzw. «fassung», `anweisung` = ««Gewalt» → «Sorge»»); es geht wie eine Körper-Fussnote in «Gilt seit» ein (Maximum). «Randtitel von Art. N» zählt nicht (Randtitel zählt nicht, Entscheid David 3.10.2026); Schlusstitel-Artikel haben keinen ableitbaren Korpus-Schlüssel.
3. **Text-Prüfung:** trägt der heutige Text den Ersatzausdruck nicht mehr, wurde der Artikel danach neu gefasst, ohne Fussnote am Artikel (nur an der Abteilungs-/Titelüberschrift): kein Ereignis (ZGB 368, 383, 385, 410: Erwachsenenschutz 2013; ZGB 860, 864: Register-Schuldbrief 2012).
4. **`ausser` mit Beleg** für Artikel, deren heutiger Wortlaut später gilt, obwohl die Anweisung sie nennt: ZGB 430 (Wortlaut seit 1.1.2013, Abteilung «Der Erwachsenenschutz» neu gefasst) und OR 565 (Fedlex-Konsolidierungen 1.1.2021–1.1.2022 tragen noch «richterliche»; heutiges «gerichtliche» erst seit 1.1.2023, parallele Anweisung AS 2020 4005).
5. **«Im ganzen Erlass»** (PATG: «Institut» → «IGE», AS 2015 3631): die Anweisung nennt keine Artikel; betroffen ist ein Artikel, dessen heutiger Text «IGE» (Wortgrenze) trägt — abgeleitet, nicht genannt, darum mit **Überschrift-Vorbehalt**: ein jüngeres Überschrift-Ereignis (Fassung/Einfügung des Abschnitts, eigenes oder geerbtes) streicht das Ereignis (PATG 140n–140v, 2019 eingefügt; Vorgabe C: lieber keine Aussage). Nur echte Artikel, keine Schluss-/Übergangsbestimmungen.
6. Der **Vorsichts-Proxy von Entscheid A** (`giltSeit = null`, wenn ein eigener Randtitel jünger ist als der Körper-Stand) ist zurückgebaut, samt `randtitelEigen`-Durchleitung. Der Leser nennt die Herkunft («Anweisung: …», `data-historie-anweisung`).

## Register (Stand 5.10.2026)

| Erlass | AS | In Kraft | Anweisung | Stellen im Korpus (Artikel / Ereignisse) |
|---|---|---|---|---|
| ZGB | 1999 1118 S. 1143 Abs. 1 | 1.1.2000 | «der Richter» → «das Gericht» (88 Körper-Stellen, Randtitel Art. 736 nicht) | zusammen 89 Artikel / 94 Ereignisse |
| ZGB | 1999 1118 Abs. 2 | 1.1.2000 | «richterlich» → «gerichtlich» (5 Körper-Stellen; Randtitel Art. 4, 172 nicht) | (in 89/94) |
| ZGB | 1999 1118 Abs. 3 | 1.1.2000 | «Gewalt» → «Sorge» (13 Stellen) | (in 89/94) |
| ZGB | 2011 725 S. 755 | 1.1.2013 | «Vormundschaftsbehörde»/«vormundschaftliche Aufsichtsbehörde» → «Kindesschutzbehörde» (24 Stellen) | (in 89/94) |
| OR | 2020 957 S. 964 | 1.1.2021 | «Richter» → «Gericht» (38 Stellen, 565 `ausser`) | 33 / 33 |
| PATG | 2015 3631 S. 3645 | 1.1.2017 | «Institut» → «IGE» im ganzen Erlass | 41 / 41 |
| StGB | 2006 3459 | 1.1.2007 | erstes Buch neu gefasst (127 Artikelüberschriften der Ziff. I; später eingefügte Art. 55a, 66a–d, 67c–f, 79a/b, 92a stehen nicht darin) | 121 / 121 |

## Ist (main) / Soll (amtlich) — die Artikel des Schritts

Ist = `giltSeit` der committeten Shards auf `origin/main` (d029534c2). Soll = erster Konsolidierungsstand (pdf-a), dessen Wortlaut dem heutigen entspricht; liegt das Fussnoten-/Anweisungs-Datum vor dem frühesten Stand (ZGB/OR/LFG 1.1.2000, PATG 1.1.2001, VWVG 1.3.2000), gilt das amtliche Datum der Fussnote bzw. Anweisung, der Wortlaut ist ab dem frühesten Stand unverändert.

| Artikel | Ist main | Soll / neu | Beleg |
|---|---|---|---|
| ZGB 28a | null | **2000-01-01** | AS 1999 1118 Abs. 1 «28a Abs. 1»; Stand 2000-01-01 = heute |
| ZGB 299, 300 | null | **2000-01-01** | Abs. 3 «299, 300 Abs. 1»; Stand 2000-01-01 «Sorge» = heute |
| ZGB 313 | 1978-01-01 | **2000-01-01** | Abs. 3 «313 Abs. 2» |
| ZGB 287, 288 | 1978-01-01 | **2013-01-01** | AS 2011 725 «287 Abs. 1 und 2», «288 Abs. 2 Ziff. 1»; Stand 2012-01-01 «Vormundschaftsbehörde», 2013-01-01 «Kindesschutzbehörde» |
| ZGB 307 | 1978-01-01 | **2013-01-01** | «307 Abs. 1 und 2»; Stand 2012-01-01 → 2013-01-01 |
| ZGB 310 | null | **2013-01-01** | «309, 310»; Stand 2012-01-01 → 2013-01-01 |
| ZGB 316, 320, 322, 324, 325 | 2003 / 1978 | **2013-01-01** | AS 2011 725 «316, 320 Abs. 2, 322 Abs. 2, 324 Abs. 1, 325»; je Stand 2012-01-01 → 2013-01-01 |
| ZGB 28g, 303 | null | 1985-07-01 / 1978-01-01 | Fussnote; nicht in den Listen; Wortlaut ab Stand 2000-01-01 gleich |
| ZGB 85, 86 | null | 2006-01-01 | Fussnote; Stand 2005-06-01 weicht ab, 2006-01-01 gleich |
| ZGB 255, 286 | null | 2000-01-01 | Fussnote 2000 (AS 1999 1118 nennt 286 zusätzlich) |
| ZGB 256, 304 | null | 2013-01-01 | Fussnote 2013; Stand 2012-01-01 abweichend |
| OR 706 | null | **2021-01-01** | AS 2020 957 «706 Absatz 1, 706a Absatz 2» («Richter» → «Gericht»); Stand 2020-04-01 «Richter», 2021-01-01 «Gericht» |
| OR 640, 652f | null | 2008-01-01 | Fussnote 2008; Stand 2007-05-01 abweichend |
| OR 652c, 677, 679, 706b, 709, 717, 721 | null | 1992-07-01 | Fussnote 1992; Wortlaut ab Stand 2000-01-01 gleich |
| PATG 110 | null | **2017-01-01** | AS 2015 3631 «Institut» → «IGE»; Stand 2012-01-01 «Institut», 2017-01-01 «IGE» |
| PATG 36, 50 | null | 1995-07-01 / 1978-01-01 | Fussnote; Wortlaut ab Stand 2001-01-01 gleich |
| STGB 52 | 2004-04-01 | **2007-01-01** | AS 2006 3459; Stand 2006-12-01 anderer Text, 2007-01-01 = heute. Die Sachüberschrift-Fussnote (AS 2004 1403) «ist der Randtitel zu Artikel 52 neu StGB wie folgt zu ergänzen» — nur der Randtitel |
| STGB 355b | null | 2006-04-01 | Fussnote; Text erstmals im Stand 2006-04-01 |
| LFG 37u | null | 2018-01-01 | Fussnote; Text erstmals im Stand 2018-01-01 |
| VWVG 76 | null | 1992-02-15 | Fussnote; Stand ab 2000-03-01 gleich bis auf die redaktionelle Zitat-Ergänzung «vom 19. September 1978» (2007; AS 2006 2197 Anhang Ziff. 10 ändert nur «Art. 76 Randtitel») |

## Verifikation (alle 213 geänderten Daten gegen die Konsolidierungen)

Werkzeug (nicht im Repo, Wegwerf-Skripte im Arbeitsordner): je Artikel die Wort-Multimenge des heutigen Textes (`public/normtext/bund/<ERLASS>.json`) gegen den Artikel-Span jedes Konsolidierungsstands; «fehlt» = heutige Wörter, die der Stand nicht (so oft) trägt (Seitenumbruch-/Fussnoten-Rauschen fügt nur Wörter hinzu). Urteil je Artikel: **OK** = Text im ersten Stand ≥ Datum gleich UND im Stand davor abweichend; **OK-früh** = Datum liegt vor dem frühesten Stand, Text ab dort gleich; sonst von Hand gelesen.

| Erlass | geänderte Daten | OK | OK-früh | von Hand geklärt |
|---|---|---|---|---|
| ZGB | 62 | 13 | 44 | 5: ZGB 174/260a (Rechtschreibung «bekanntgeben»/«nahestehenden» 2004), 185 (redaktionell «über das Gesamtgut» 2002), 36/28l (Kopfzeilen-Erkennung; Text im Stand 2000-01-01 von Hand gelesen = heute) |
| OR | 32 | 25 | 6 | 1: OR 721 (Überschrift im Stand 2004-01-01 nicht erkannt; Wortlaut seit 2000-01-01 von Hand gelesen) |
| PATG | 35 | 33 | 2 | 0 |
| STGB | 82 | 67 | 0 | 15: 13 Artikel, die es im Stand 2006-12-01 nicht gab (neu 2007, Stand 2007-01-01 = heute); Art. 45/108 (im Stand 2006-12-01 «gleich», weil der heutige Kurztext Teilmenge des längeren Alttexts ist — «extra» 416/35, anderer Artikel) |
| VWVG, LFG | 2 | — | — | 2: Fussnoten-Datum, s. Tabelle |

**Verworfen durch die Verifikation** (kein Ereignis, siehe Regel 3–5): ZGB 430 (Wortlaut erst 2013), OR 565 (erst 2023), PATG 140n–140v (2019 eingefügt), ZGB 410/368/383/385/860/864 (später neu gefasst), StGB 66a–d/67c–f/79a/b/92a (nicht in der AS-Liste, später eingefügt; StGB 67e/67f bekamen im ersten Entwurf fälschlich 2007).

## Bekannte Grenzen (§7/§8)

- **Das Register ist nicht vollständig.** Es führt, was hier verifiziert ist. Bekannt, nicht erfasst: LFG «Bundesamt»→«BAZL», «Departement»→«UVEK» im ganzen Erlass (AS 2011 165, 1.4.2011); OR AS 2020 4005 (Aktienrecht, 1.1.2023): eigene «Richter»→«Gericht»-Liste und «Reinertrag»→«Jahresgewinn», «Zwischenbilanzen»→«Zwischenabschlüsse»; jede Generalanweisung in den übrigen 200+ Erlassen. Die SPARQL-Liste der Änderungserlasse (Typ «Änderung» am Abstract) war unvollständig (AS 2020 4005 fehlte): eine vollständige Erhebung bräuchte alle Auswirkungs-Typen und die Änderungserlasse als PDF-A — vor AS 1998 gibt es sie nicht (Fedlex-Filestore: 125 von 344 Änderungserlassen der sechs Erlasse ZGB/OR/PATG/STGB/LFG/VWVG ohne PDF-A).
- **Konsolidierungen reichen nur bis 2000** (PATG 2001): für Daten davor trägt allein die Fussnote bzw. die AS-Anweisung.
- **Vorgabe-C-Klasse bleibt** (nicht Teil dieses Schritts, David-Entscheid 2.10.2026): ein Artikel mit eigenem Fussnoten-Datum UND jüngerer Fassung an einem geteilten Titel/Abschnitt zeigt das ältere Datum.
- **Randtitel-Kette:** eine Randtitel-Zeile mit Gliederungszeichen plus Sachüberschrift derselben Marginalie (STGB 52 «1. Gründe für die Strafbefreiung. Fehlendes Strafbedürfnis», MSTG 232a) zählt die Fussnote an der Sachüberschrift weiter als eigenes Ereignis. Für StGB 52 deckt die Neufassung 2007 das ab; die Regel selbst blieb unverändert (Entscheid-David-Gebiet «Randtitel zählt nicht»).
- **ENTG 20** («Nummerierung gemäss» am Randtitel «1bis. …», 1972): nur Randtitel-Nummerierung, kein Körper-Ereignis ⇒ «Fassung» ohne Datum (richtig im Modell); der amtliche Körper-Stand (Ur-Fassung) ist nicht modelliert.

## Pflegebedarf

- Neue Generalanweisung: Zeile in `ANWEISUNGEN` (Wortlaut der Artikelliste aus dem AS-PDF), `npm run gen:historie`, `npm run projektionen:normtext -- --datum=$(date +%F)`, Test-Pins in `normtext-generalanweisungen.test.ts` (Zählung je Erlass) nachziehen.
- `npm run historie:vergleich -- --liste` zeigt Vorher/Nachher «Gilt seit» je Artikel.
