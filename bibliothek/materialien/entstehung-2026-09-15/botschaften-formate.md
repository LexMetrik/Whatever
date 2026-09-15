# Recherche A — Datenherkunft Botschaften bei Fedlex (lex-recherche/Opus, Live-Messung 15.9.2026)

## Empfehlung
Andockstufe je Epoche: ab 2022 Akoma-Ntoso-XML (43/407 Botschaften, öffentliche Filestore-URL, Kapitel «Erläuterungen …» in 43/43 als `<level>` mit eigenem `eId` adressierbar); 2020/2021 DOCX (54 Dok., Artikel-Überschriften tragen den benannten Absatzstil `TitelArtikelKomm`); 1999–2020 nur PDF/A (durchgehend born-digital, einspaltig, kein Scan) — plus 75 binäre `.doc` (2017–2020), die den Artikel-Stil nicht tragen. Artikel-scharf und rein strukturell (ohne Textmuster) ist nur die Minderheit: 7/43 XML haben eine echte Artikel-Ebene (`<article eId="art_N">` oder `<level><heading>Artikel N…`), 31/43 markieren den Artikel als stilloses `<p>Art. 5 Abs. 2</p>`; Kapitel-scharf ist ab 2022 zu 100 % deterministisch und für 2020/2021 über den Word-Stil sehr wahrscheinlich. Für 1999–2019 bleibt realistisch nur Kapitel-Deep-Link auf die PDF-Seite plus Live-Link; artikel-scharfes Schneiden wäre dort eine gemessene Heuristik (11/13 Stichproben-Treffer der Kapitelgrenze), kein deterministischer Vertrag.

## Count-Gate
227 Rohdateien (`bibliothek/materialien/botschaften-raw/`), 1342 Zeilen, 407 verschiedene fga-URIs; SPARQL lieferte Manifestationen für 407/407 (100 %), 3891 Zeilen, 0 fehlgeschlagene Batches. Deckt sich mit `entstehung-daten-2026-09-11.md` §2.

## Tabelle Format × Jahrgang (Botschaften mit ≥1 Manifestation; je Format DE/FR/IT vollständig)
| Jahr | pdf-a | doc | pdf-x | docx | xml | html | docx-an | Botsch. |
|---|---|---|---|---|---|---|---|---|
| 1999–2016 | je 9–22 | gleich | gleich | 0 | 0 | 0 | 0 | 228 |
| 2017 | 16 | 16 | 16 | 0 | 0 | 0 | 0 | 16 |
| 2018 | 14 | 14 | 14 | 0 | 0 | 0 | 0 | 14 |
| 2019 | 20 | 20 | 20 | 0 | 0 | 0 | 0 | 20 |
| 2020 | 25 | 25 | 25 | 1 | 0 | 0 | 0 | 25 |
| 2021 | 9 | 0 | 0 | 9 | 0 | 0 | 0 | 9 |
| 2022 | 12 | 0 | 0 | 12 | 11 | 11 | 11 | 12 |
| 2023 | 11 | 0 | 0 | 11 | 11 | 11 | 11 | 11 |
| 2024 | 16 | 0 | 0 | 16 | 16 | 16 | 16 | 16 |
| 2025 | 5 | 0 | 0 | 5 | 5 | 5 | 5 | 5 |
| Summe | 407 | 354 | 354 | 54 | 43 | 43 | 43 | 407 |

- `pdf-a` ist das einzige Format mit 407/407 und stets öffentlicher `isExemplifiedBy`-URL.
- `doc` ist öffentlich erst ab 2017 (75 Dok.); 1999–2016 nur `isExemplifiedByPrivate`. Der E2-Host-Tausch trägt hier NICHT: host-getauschte Intranet-URLs liefern die Casemates-Shell (`text/html`, 9148 B, `<title>Casemates</title>`) — belegt für 1999/2003/2008/2013. `pdf-x` ist nie öffentlich; `docx-an` (Annex) hat keine Exemplifikation (129 Zeilen ohne URL).
- XML/HTML gibt es erst ab Jahrgang 2022 — Akoma Ntoso gilt für `fga` nicht so weit zurück wie für cc/oc.

## Befund 2a — XML/HTML-Struktur (43 XML geladen)
- Wurzel `<akomaNtoso xmlns=…/akn/3.0><act name="publicLaw">`, `FRBRuri` = fga-ELI, `FRBRnumber` = «BBl 2025 1528», `FRBRdate` = publicationDate + dateDocument.
- Gliederung: `<level eId="lvl_5"><num>5</num><heading>Erläuterungen zu einzelnen Artikeln</heading>`, verschachtelt `lvl_5/lvl_5.1` («Änderung des Erwerbsersatzgesetzes (EOG)») — in 43/43 XML existiert ein solches Erläuterungs-Level (Überschriften-Varianten: «zu einzelnen Artikeln», «zu den einzelnen Artikeln», «zur neuen Regelung in Artikel 302 ZGB», «Bemerkungen zu einzelnen Bestimmungen …»).
- Artikel-Ebene nur teilweise: `<article eId="art_4"><num>Art. 4</num><heading>…</heading>` in 4/43 (2024-650: 8, 2024-1607: 105, 2025-1478: 265, 2025-1528: 44); 3 weitere haben Artikel-Level mit `<heading>Artikel N …</heading>` (2023-703, 2024-3274, 2025-3067: 74) ⇒ 7/43 strukturell. 31/43 nur `<p>Art. 25a Abs. 4 zweiter Satz</p>` — ohne Klasse, ohne eId (belegt an 2023-7, 2022-2427, 2025-960). 5/43 haben im Erläuterungsteil gar keinen Artikel-Marker.
- eId-Mehrdeutigkeit real: 2025-1478 hat 134 doppelte `art_*`-eIds, 2024-1607 15, 2025-1528 1 — Ursache Mantelvorlagen; Disambiguierung nur über das Eltern-`level` («5.1 EOG» vs. «5.2 OR»). Deckt sich mit «83 mehrdeutige eIds verworfen» (E2).
- Fussnoten: `<authorialNote>` (39 bzw. 93 in den Stichproben), im HTML als `id="fn-dNeN"` + Rücksprung `fnbck-dNeN`.
- HTML ist eine 1:1-Projektion des XML (gleiche ids `lvl_…`, `art_N`, `fn-…`; `class="heading|absatz|footnotes"`; keine h1–h6-Semantik ausser `<h6 class="heading">`). Kein Informationsgewinn gegenüber XML ⇒ XML ist die höchste Stufe.

## Befund 2b — PDF/A (13 Dok. 1999–2025)
- Alle born-digital, kein Scan: echte Fontobjekte (Times/TimesNewRoman/Arial/Calibri), 2404–2981 Zeichen/Seite (1999: 2488; 2003: 2659; 2008: 2807; 2013: 2483; 2018: 2950; 2021: 2875; 2024: 2981; 2025: 2655), 0–1 Bilder je Dokument. Auch 1999 hat eine Textebene — OCR nirgends nötig.
- Einspaltig (Blockstarts bei x≈34/57/79/80; zweite x-Spur nur bei Tabellen/Fussnoten).
- Kopfzeilen-Muster wechselt: bis 2016 nur die BBl-Seitenzahl («5968»); ab 2018 «BBl 2018» + Seitenzahl; ab 2021 «BBl 2021 2819» + «3 / 52».
- PDF-Lesezeichen (Outline) erst ab 2021: 1999–2020 = 0 Einträge; 2021 = 35, 2022 = 27, 2024 = 45, 2025 = 46 — nur bis Kapitelebene, kein Art.-Eintrag.
- Artikel-Überschriften stehen im Erläuterungskapitel als eigene Zeile kursiv/fett (2008: 8, 2013: 15, 2016: 40, 2018: 20, 2019: 19, 2020: 44, 2021: 11, 2025: 44 Treffer). Kapitelgrenze ist die Schwachstelle: Nummer und Titel als zwei getrennte Textzeilen («5» ⏎ «Erläuterungen zu einzelnen Artikeln»); Zwei-Zeilen-Regel trifft 11/13, Fehlschlag 2003 (keiner), Fehlgriff 1999 und 2025 (letzter statt erster Treffer landet im Anhang).
- Silbentrennung am Zeilenende: 114 (1999) bis 558 (2025) Trennstellen je Dokument — Entsilbung zwingend.
- DOCX-Bonus: 2021 tragen 8/9 Dok. den Absatzstil `TitelArtikelKomm` genau auf den Artikel-Überschriften (36/50/8/13/7/6/18/3 Absätze). Die binären `.doc` 2017–2020 (8 geprüft, alle OLE2) enthalten diesen Stilnamen nicht ⇒ `.doc` bringt gegenüber PDF keinen Strukturgewinn und kostet einen Binärparser.

## Befund 3 — Drift/Stabilität
Filestore liefert `Last-Modified` + `Content-Length`, nie `ETag` (HEAD 2025-1528 pdf-a: `Last-Modified: Fri, 16 May 2025 05:03:11 GMT`, `Content-Length: 955004`). Conditional GET funktioniert: `If-Modified-Since` auf die XML-URL → HTTP 304, 0 Bytes ⇒ billiger Drift-Wächter. `Last-Modified` ist echt (Legacy-PDF 2020-04-02 = Migrationsdatum). Soft-404 bestätigt: erfundene Datei `…/fga/2025/9999/de/xml/…` antwortet HTTP 200 mit Angular-Shell ⇒ Erfolg nur an Content-Type/Body messen. URLs nie konstruieren: 248 von 3536 Manifestations-URLs tragen ein Revisions-Suffix (`…-de-pdf-a-1.pdf`; pdf-a 143, docx 54, html/xml je 24, doc 3).

## Befund 4 — Lizenz
Botschaften = Berichte des Bundesrates an die Bundesversammlung ⇒ Art. 5 Abs. 1 lit. c URG (Berichte von Behörden) — urheberrechtsfrei; lit. a deckt die mitpublizierten Erlassentwürfe. Beleg: `public/normtext/bund/URG.json` `art_5`, Stand 2025-07-01.

## Befund 5 — Alternativquellen (nicht strukturierter)
`amtsdruckschriften.bar.admin.ch` → JSP-Suchmaske über gescannte Amtsdruckschriften (BBl vor 1999) — für unseren Korpus ohne Nutzen. Curia Vista `Bill`/`BillLink`/`Publication` — Verweise und Metadaten, kein Botschaftstext.

## Risiken/Fallen (belegt)
(1) Host-Tausch `isExemplifiedByPrivate` versagt bei fga-`doc` vor 2017 — Shell statt Datei. (2) Doppelte `art_*`-eIds bei Mantelvorlagen — ohne Eltern-Level-Kontext führt der Anker zum falschen Erlass. (3) 31/43 XML markieren Artikel nur als attributloses `<p>` ⇒ Zuordnung dort ist Textmuster. (4) PDF-Kapitelgrenze zweizeilig; «letzter Treffer» greift in Anhänge. (5) Kein ETag. (6) Revisionssuffixe in 7 % der URLs. (7) Python-`urllib` scheitert lokal an der Zertifikatskette (`CERTIFICATE_VERIFY_FAILED`) — Messungen liefen über `curl`.

## Offen
(a) `TitelArtikelKomm` in den 45 DOCX ab 2022 und im 2020er DOCX? (b) Warum 2021 DOCX ohne XML (Werkzeugwechsel vermutet). (c) `docx-an` erreichbar? (d) FR/IT-Auszeichnung (nur DE gemessen). (e) Fehlerrate der PDF-Artikel-Heuristik gegen Handauszählung (13 Dok. zu klein für Ratenaussage).
