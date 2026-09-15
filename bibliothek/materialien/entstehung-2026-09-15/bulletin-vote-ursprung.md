# Recherche B — Amtliches Bulletin, Abstimmungen je Artikel, Ursprung (lex-recherche/Opus, Live-Messung 15.9.2026)

Alle Abfragen 15.9.2026 gegen `https://ws.parlament.ch/odata.svc/` (OData v3, `$format=json`, ≥0,6 s Abstand). Namensfelder (`SpeakerFullName/FirstName/LastName/PersonNumber`) in keinem `$select` der gespeicherten Transcript-Rohdateien.

## Empfehlung
(a) Bundesrats-Voten und Kommissionssprecher: teilweise — Rollen ohne Personendaten sauber erkennbar (`CouncilName eq 'Bundesrat'`; Berichterstatter über `Function eq '*'`, 115/115 gegen die `Rapporteur`-Liste, 0 Falschpositive, 8 Auftritte ohne Flag = Recall-Lücke), die Zuordnung zum Artikel aber nur Textheuristik (Prototyp: 70 richtig / 16 falsch / 71 ohne Zuordnung gegen die strukturierte Wahrheit ⇒ ~81 % Präzision, ~50 % Recall). (b) Minderheitsanträge je Artikel mit Ergebnis: ja für den Nationalrat — `Transcript.VoteId` → `Vote.RegistrationNumber` liefert je Abstimmung strukturiert `Subject` = Artikel («Art. 68 Abs. 2 Bst. d») plus `MeaningYes/MeaningNo` («Antrag der Mehrheit» / «Antrag der Minderheit Dandrès»); 181/188 NR-Abstimmungszeilen gejoint; für den Ständerat kein `Vote`-Datensatz (0/51), nur Freitext. (c) SR-Stimmenzahlen: ja, wörtlich im `Transcript.Text`.
Join-Pfad: `SubjectBusiness?$filter=BusinessShortNumber eq '20.026'` → `IdSubject` → `Transcript?$filter=Language eq 'DE' and IdSubject eq <n>&$orderby=SortOrder`.

## Transcript — Felder (`$metadata`, 130 112 Bytes)
Schlüssel `ID`+`Language`. Felder: `IdSubject`, `VoteId` (String), `PersonNumber`, `Type` (Int16), `Text`, `MeetingCouncilAbbreviation` (N/S), `MeetingDate` («JJJJMMTT»), `MeetingVerbalixOid`, `IdSession`, `Speaker{FirstName,LastName,FullName,Function}`, `CouncilId/CouncilName`, `Canton*`, `ParlGroup*`, `SortOrder`, `Start`/`End`, `Function`, `DisplaySpeaker`, `LanguageOfText`, `Modified`, `VoteBusinessNumber/ShortNumber/Title`. Navigation `Subjects`, `MembersCouncil`, `Businesses`. `Subject` ist nur Hülle; der Geschäftsbezug liegt in `SubjectBusiness` (`IdSubject`, `BusinessShortNumber`, `Title`, `SortOrder`).
`Type` (empirisch, kein Enum): 1 = Redebeitrag/Präsidiumszeile (trägt Antrags-/Artikelblöcke), 2 = Abstimmungsergebnis (trägt `VoteId`), 3 = Antragsblock ohne Sprecher. Global DE: 346 844 Zeilen, Type 2 = 33 344, Type 3 = 35 847.
`SpeakerFunction`-Codes: `Mit-M/Mit-F`, `P-M/P-F`, `1VP/2VP`, `BR-M/BR-F`, `BPR-F`, `VPBR-F`. Kein Code für Berichterstatter — dafür `Function eq '*'`.

## Messtabelle vier Geschäfte (DE)
| Geschäft | Subjects | Zeilen | JSON-Bytes | Text-Bytes | Type 1/2/3 | LangOfText DE/FR/IT/null | Räte | `Function='*'` | BR-Zeilen | Vote-Sätze (mit Artikel-Subject) |
|---|---|---|---|---|---|---|---|---|---|---|
| 20.026 ZPO | 11 | 347 | 1 220 115 | 932 092 | 280/66/1 | 78/109/0/160 | N 185, S 162 | 55 | 22 | 51 (48) |
| 17.059 DSG | 16 | 372 | 1 364 676 | 1 065 769 | 280/85/7 | 164/20/3/185 | N 277, S 95 | 55 | 30 | 69 (60) |
| 05.052 IV | 15 | 573 | 1 675 082 | 1 239 051 | 526/33/14 | 369/139/2/63 | N 471, S 102 | 89 | 53 | 27 (18) |
| 24.046 Transparenz | 9 | 301 | 932 106 | 697 953 | 245/55/1 | 120/46/5/130 | N 154, S 147 | 46 | 26 | 34 (26) |

Volumen: Schnitt 961 KB Text je Geschäft → 385 Geschäfte ≈ 370 MB DE-Text; Teilmenge BR + Berichterstatter 296 KB/Geschäft ≈ 114 MB; nur extrahierte Artikelblöcke (Überschrift + Anträge + Entscheid) 154 KB/Geschäft ≈ 59 MB. Vote-Sätze: 27–69 je Geschäft.

## Detailberatung — Rohtext-Muster
1. Artikelmarke = fettes `<p><b>…</b>` am Zeilenanfang einer Präsidiumszeile (Type 1, P-M/P-F), DE-Block, `[VS]`, FR-Duplikat, dann Entscheid: `<p><b>Ziff.</b> <b>I</b> <b>Art.</b> <b>132</b> <b>Abs.</b> <b>2 </b>[GZ]</p><p><i>Antrag der Kommission </i>[GZ]</p><p>…</p><p><i>Angenommen - Adopté</i></p>`
2. Umstrittener Artikel = letzter Block der Präsidiumszeile ohne Entscheidzeile; Minderheit mit Namen im Klartext: `<p><b>Ziff. I Art. 314 </b>[GZ]</p><p><i>Antrag der Mehrheit </i>…<p><i>Antrag der Minderheit </i>[GZ]</p><p>(Bauer, Hefti, Levrat, Mazzone, Sommaruga Carlo, Zopfi)[GZ]</p>`
3. Ständerat, Ergebnis (Type 2): `<p><i>Abstimmung - Vote </i>[GZ]</p><p>Für den Antrag der Minderheit ... 25 Stimmen[GZ]</p><p>Für den Antrag der Mehrheit ... 17 Stimmen[GZ]</p><p>(1 Enthaltung)[GZ]</p>`
4. Nationalrat, namentlich (`[NAM]`, dazu ein `Vote`-Datensatz): `Abstimmung - Vote [GZ] [NAM][GZ] Für den Antrag der Minderheit ... 60 Stimmen … Dagegen ... 121 Stimmen (7 Enthaltungen)`
5. Ältere Fassung (2006): identische Struktur ohne `[GZ]` nach `</b>`, dazu Sektionsmarke `<p><i>Detailberatung - Discussion par article</i></p>`.
Entscheidzeilen: «Angenommen - Adopté» (häufigste), «Angenommen gemäss Antrag der Mehrheit», «… der Minderheit», «… der Minderheit II», «Angenommen gemäss modifiziertem Antrag der Kommission», «Übrige Bestimmungen angenommen». «Angenommen gemäss Antrag der Kommission» kam nicht vor.

## Risiken/Fallen (belegt)
- Textheuristik allein trägt nicht (Zahlen oben) — nur als «maschinell» markierter Zusatz.
- Epochenbruch im Markup: 05.052 (2006) hat 0 Überschriften mit `[GZ]`-Suffix; laxeres Muster findet 320. Ein Parser nur an 2020er-Daten liefert für Altjahrgänge still leere Ergebnisse.
- Blockberatung: «Art. 3-11», «Ziff. I Art. 70 Abs. 2; 71; 81 Abs. 1, 3», `Vote.Subject` «Art. 2 Abs. 1 Bst. b (gilt auch für …)» — ein Votum trifft n Artikel; Marken «Block 1–4».
- Differenzbereinigung/Zweitlesung: «Differenz» 19/97/19/30-mal; «Rückkommen» 15×, «Ordnungsantrag» 23× in 05.052 — derselbe Artikel mehrfach mit anderem Stand ⇒ Lesungs-/Datumskontext Pflicht.
- Sprachmix: `Language eq 'DE'` filtert Metadatensprache, nicht Redesprache; `Vote.Subject` teils FR/IT auch bei DE-Filter.
- Personendaten im Fliesstext: Minderheitsanträge nennen Antragsteller im `Text`, ebenso `Vote.MeaningNo` («Antrag der Minderheit Dandrès»); `$select` schützt dort nicht.
- `Transcript.VoteId` ist nicht `Vote.ID` — korrekt `Vote.RegistrationNumber`; Altdaten mit nicht-numerischen VoteIds (`Flims_2-154`) ⇒ String-Vergleich.

## Deep-Link, Frische, Lizenz
- Deep-Link `https://www.parlament.ch/de/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-die-verhandlungen?SubjectId=<n>` → HTTP 200, kein Bot-Schutz; Angular-SPA, Inhalt clientseitig; kanonischer Einstieg je Subject (Traktandum). Anker je Votum nicht gefunden (unklar).
- Frische: Transcripts erscheinen am Sitzungstag (`MeetingDate 20260915`, `Modified` desselben Tages); `Modified` je Zeile ⇒ Drift-Anker. Nachträgliche Redaktion: unklar.
- Lizenz (Wortlaut, Abruf 15.9.2026): «Jegliche Verwendung darf nicht den Eindruck erwecken, es handle sich dabei um eine amtliche Veröffentlichung. Die Daten dürfen nur mit Angabe der Quelle «Parlamentsdienste der Bundesversammlung, Bern» verwendet werden. Die Daten dürfen inhaltlich nicht verändert werden. Das Datum des Zeitpunktes, in dem die Daten heruntergeladen worden sind, muss immer eindeutig ersichtlich sein.» Zu Auszügen/Teilzitaten sagt die Seite nichts.

## Ursprung einer Vorlage
Vehikel ja (strukturiert), Auslöser nein (nur Freitext, lückenhaft).
- `BusinessType` DE, 15 Werte: 1 BRG Geschäft des Bundesrates · 2 PAG Geschäft des Parlaments · 3 Kt.Iv. Standesinitiative · 4 Pa.Iv. Parlamentarische Initiative · 5 Mo. Motion · 6 Po. Postulat · 7 Emp. · 8 Ip. · 9 D.Ip. · 10 Pet. · 12 EA · 13 D.EA · 14 Fra. · 18 A · 19 DA. Keine Kategorie «Volksinitiative» (läuft als BRG/PAG). BRG DE gesamt: 2 762.
- `RelatedBusiness` trägt nicht: 4 644 Zeilen gesamt (gegen 67 376 Business), 740 mit `RelatedBusinessTypeAbbreviation eq 'BRG'`; für 20.026, 17.059, 24.046, 05.052 je 0 Zeilen in beiden Richtungen. Stichprobe zeigt Zwillingsvorstösse und vereinzelt Vorstoss→Vorlage (`14.3298 → 16.043`, `PriorityCode 'S'`, Semantik unklar).
- `Business`-Textfelder: bei allen vier BRG gefüllt nur `Title`, `Description`, `InitialSituation` (4,2–6,2 KB), `Proceedings` (11–43 KB), `Category`, `TagNames`; `DraftText, SubmittedText, ReasonText, MotionText, FederalCouncilResponseText, SubmittedBy` leer. Ursprung nur als Prosa in `InitialSituation` — 20.026: «… in Erfüllung der Motion 14.4008 …». Korpusweit (BRG DE): «in Erfüllung der Motion» 3, «in Erfüllung des Postulates» 2, «Motion» 228/2 762 (8,3 %). Regex `\b\d{2}\.\d{3,4}\b` trifft auch Datumsangaben («02.2020»).
- `Tags`/`Subject`: thematisch bzw. Traktanden, kein Ursprungsbezug.

## Unklar
`Type`/`Function`-Semantik nicht dokumentiert (empirisch); `Function='*'` weitere Sonderrollen?; Deep-Link je Votum; nachträgliche Transcript-Redaktion; `PriorityCode`; strukturierte SR-Zahlen (in `Vote`/`Voting` nachweislich nicht).

## Mitdenken (Agent)
`Vote.Subject` ist der eigentliche Schatz für «Amtliches Bulletin je Artikel»: Artikel, Antragsseiten, Datum strukturiert, ohne Volltext. Das Änderungsverbot kollidiert mit jeder Aufbereitung, die Redetext kürzt — Deep-Link plus Metadaten ist der risikoarme Weg. Der Repo-Vorbefund «`Transcript` hat kein Artikel-Feld» (`nutzersicht-vorbilder.md` Z. ~138) ist unvollständig: die Artikelzuordnung existiert strukturiert in `Vote`. Als Ergänzung in die Bibliothek, nicht als Korrektur der datierten Zeile.
