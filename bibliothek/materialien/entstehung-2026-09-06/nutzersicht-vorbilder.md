# Verzahnung von Materialien — Nutzersicht, Vorbilder, deterministisches Maximum

*Kopiert unveraendert aus Recherche 6.9.2026, Agent Sonnet, read-only.*
Recherche 6.9.2026 (read-only, keine Repo-Änderung). Alle Live-Abrufe 6.9.2026.
Bestand als Ausgangspunkt: 401 Botschaften (Curia-Nr. 400/401 gefüllt), 822 Vernehmlassungen,
Änderungshistorie AS/RO, BGE-Korpus, Artikel-Anker Bund/ZH/BS.

## 1 Nutzer-Anwendungsfälle (10 Fragen, nach Häufigkeit im Alltag)

| # | Frage | Wer | Was sie dafür brauchen |
|---|---|---|---|
| F1 | «Was sagt die Botschaft zu genau diesem Artikel?» | alle | Sprung in die Botschaftsstelle zum Artikel, nicht ins 200-Seiten-PDF |
| F2 | «Welche Fassung galt am Tatzeitpunkt / im Vertragsjahr?» | Anwalt, Richter | Point-in-time-Fassung + Auslöser-Erlass der Änderung |
| F3 | «Warum wurde dieser Absatz geändert — was war das Problem?» | alle | Änderungs-Ereignis → Botschaftsstelle des ÄNDERNDEN Erlasses (nicht des Stammerlasses) |
| F4 | «Stand das im Entwurf schon so, oder hat das Parlament es geändert?» | Anwalt (hist. Auslegung) | Diff Erlassentwurf ↔ Schlussabstimmungstext, artikelscharf |
| F5 | «Welche Kommission hat den Absatz eingefügt, wer war Berichterstatter?» | Anwalt, Forscher | Kommissionsbericht + Rapporteur je Vorlage |
| F6 | «Wurde das im Ständerat anders beschlossen (Differenzen)?» | Anwalt, Student | Ratsbeschluss-Kette je Vorlage, beide Räte |
| F7 | «Gab es ein Referendum? Wann trat es in Kraft?» | Verwaltungsjurist | Referendumsfrist, Abstimmungsdatum, AS-Fundstelle, Inkrafttreten |
| F8 | «Was hat die Verwaltung dazu gesagt — Wegleitung, Kreisschreiben, Praxis?» | Verwaltungsjurist, Anwalt | Soft-Law am Artikel (im Bestand vorhanden) |
| F9 | «Hat das Bundesgericht auf diese Materialien abgestellt?» | Anwalt, Richter | Kreuzverweis Rechtsprechung ↔ Materialien (BGer zitiert «BBl 2017 6941, 7003») |
| F10 | «Ist diese Norm noch aktuell, oder liegt schon eine Revision vor?» | alle, v.a. Journalist | laufende Vernehmlassung / hängiges Geschäft am Artikel, mit Statusdatum |

Nicht-Fragen (bewusst weglassen): Kommentarmeinung, Lehrstreit, «wie entscheidet ein Gericht» —
das ist Kommentarliteratur, nicht amtlich (Art. 5 URG deckt es nicht ab).

## 2 Vorbilder — was sie zeigen, was davon amtlich-datenbasiert nachbaubar ist

**legislation.gov.uk** (live 6.9.2026, /ukpga/2018/12/section/8) — Goldstandard.
Je Section: Reiter «Explanatory Notes» und «More Resources»; «What Version: Latest available
(Revised) / Original (As enacted)»; «Show Timeline of Changes»; «Show Geographical Extent»;
Kasten «Changes and effects yet to be applied to Section 8» **und** «…to the whole Act»;
«Previous: Provision / Next: Provision». Alles unter Open Government Licence v3.0.
→ Nachbaubar: Version-Umschalter, Timeline, Nachbar-Pfeile, section-scoped Änderungshinweis.
→ Nicht nachbaubar: Explanatory Notes gibt es in CH nicht als eigenes amtliches Dokument;
   das Schweizer Äquivalent ist die Botschafts-Ziffer «Erläuterungen zu einzelnen Artikeln».

**EUR-Lex / OEIL** (Suchbeleg 6.9.2026; oeil.europarl.europa.eu lieferte 404 bzw. 307 —
Feature-Beschreibung daher aus eur-lex.europa.eu/collection/legislative-procedures.html):
Reiter «Procedure» am Dokument; je Verfahren Timeline mit Ereignisliste und zugehörigen
Dokumenten, Status (ongoing/completed/stopped), Verfahrenstyp, Rechtsgrundlage.
Daten aus CELLAR (SPARQL, Publications Office).
→ Nachbaubar 1:1 — Fedlex hat mit `jolux:draftHasLegislativeTask` denselben Graphen (§3a).

**Légifrance** — «Dossiers législatifs» mit travaux préparatoires, débats, textes adoptés
(seit 11. Legislatur, 12.6.1997); seit 1.4.2026 über vie-publique.fr; API über PISTE (DILA),
freie Weiterverwendung nach Décret vom 24.6.2014. Einziges Portal mit echtem
«Comparer les versions»-Diff (bereits im Repo belegt, bibliothek/recherche/fremdnutzen-suchrunde-2).
→ Nachbaubar: Dossier-Seite je Vorlage + Fassungs-Diff.

**RIS Österreich** — Info-Seite lieferte 404 (6.9.2026), Feature nicht neu verifiziert.
Aus Repo-Bestand: RIS wurde 2.9.2026 live geprüft (bibliothek/recherche/fremdquellen-sichtung-2026-09-02).
→ **Offen**: ob RIS artikelscharfe Materialien-Verweise führt, ist hier nicht belegt.

**Schweiz — Fedlex.** Der Projektgraph ist der Träger (§3a). Die Fedlex-Weboberfläche
selbst ist JS-gerendert und für uns nicht auswertbar (Repo-Befund 6.9.2026) — irrelevant,
weil wir den SPARQL-Endpoint nutzen.

**Schweiz — parlament.ch Curia Vista / OData** (ws.parlament.ch/odata.svc, ohne Schlüssel,
$metadata live 6.9.2026). EntitySets u. a.: `Business`, `Bill`, `BillLink`, `BillStatus`,
`Resolution`, `Preconsultation`, `Rapporteur`, `Committee`, `Voting`, `Vote`, `Subject`,
`Transcript`, `Session`, `Meeting`, `Publication`, `Objective`, `RelatedBusiness`.
Join-Anker: wir haben je Botschaft die Curia-Nummer (400/401) = `BusinessShortNumber`.
- `Resolution` (Felder: ResolutionDate, ResolutionText, CouncilName, IdBill, Committee…) —
  Ratsbeschluss-Kette, Beispielwerte «Ablehnung», «Erledigt», «Schriftliche Beantwortung».
- `Voting` (BusinessShortNumber, BusinessTitle, BillTitle, Subject, MeaningYes/MeaningNo,
  Decision/DecisionText, Canton, ParlGroup) — Namensabstimmung je Ratsmitglied.
  **Falle belegt:** bei `Language eq 'DE'` kamen `Subject`/`MeaningYes` französisch
  («Vote final», «Adopter le projet») → Sprachfeld ist nicht durchgängig.
- `Transcript` (ID, IdSubject, Text, MeetingDate, SpeakerFullName, Type, VoteBusinessNumber…)
  — **kein Artikel-Feld**. Amtliches Bulletin je Artikel ist deshalb nur per Textmuster
  erreichbar → Heuristik (§3c).

**entscheidsuche.ch / OpenCaseLaw / lexfind / Weblaw-Swisslex-Legalis** — kommerziell bzw.
Rechtsprechung; für Materialien-Verzahnung liefern sie das Muster «ein Reiter je Quellenart»,
mehr nicht. lexfind ist JS-Seite, nicht auswertbar (Repo-Befund).

## 3 Deterministisches Maximum aus amtlichen Daten — empirisch gemessen

### 3a Prozess-Timeline je Erlass — **vollständig deterministisch, höchster Wert**
Der Fedlex-Projektgraph liefert je Projekt alle Ereignisse mit amtlichem Typ und Datum.
Probe am Projekt der Botschaft `eli/fga/2025/1528` (EOG-Revision), SPARQL live 6.9.2026:

```
2023-12-29  Eröffnung des Vernehmlassungsverfahrens   eli/fga/2023/2936
2025-04-16  Botschaft des Bundesrates                 eli/fga/2025/1528
2025-04-16  Erlassentwurf                             eli/fga/2025/1529
2025-12-19  Schlussabstimmungstext                    eli/fga/2026/29
            (Vernehmlassungsknoten)                   eli/dl/proj/2023/106/cons_1
```

Korpusweite Häufigkeit der Ereignistypen ab 2022-01-01 (COUNT DISTINCT Ressourcen):
Schlussabstimmungstext 152 · Erlassentwurf 145 · Botschaft des Bundesrates 113 ·
Eröffnung des Vernehmlassungsverfahrens 63 · Bericht parlamentarische Kommission 38 ·
Stellungnahme des Bundesrates 35 · Bundesratsbeschluss 15 · Gewährleistungen
Kantonsverfassung 9 · Mitteilung 7 · Beschlüsse der Behörde 6 (Rest ≤1).
Typ-Vokabular amtlich: `fedlex.data.admin.ch/vocabulary/resource-type` (23 Botschaft,
24 Bericht BR, 25 Stellungnahme BR, 30 Bericht parl. Kommission, 38 Erlassentwurf,
39 Vorentwurf, 40 Eröffnung Vernehmlassung, 54 fakultatives Referendum).
Query-Kante wie im Repo dokumentiert: `?proj jolux:draftHasLegislativeTask ?ev .
?ev jolux:legislativeTaskHasResultingLegalResource ?res` (STRSTARTS-Falle meiden).

### 3b Artikelscharfe Botschaftsstellen — **deterministisch ab BBl 2022, sonst gar nicht**
BBl-HTML-Manifestationen nach Jahr (SPARQL, Doktyp 23, Sprache DEU, 6.9.2026):
2022: 44 · 2023: 58 · 2024: 77 · 2025: 80 · 2026: 41 — **vor 2022: null**.
Gegenprobe: `eli/fga/2017/2057` (Botschaft DSG 2017) hat nur `doc`, `pdf-a`, `pdf-x`.

Struktur der HTML-Botschaft `fga/2025/1528` (206 kB, gemessen):
104 Überschriften, davon 46 Artikel-Überschriften, jede mit **denselben eIds wie der
konsolidierte Gesetzestext**: `id="art_4"`, `id="art_16_f_bis"`, `id="art_329_g"`.
Kapitelanker: `lvl_4` «4 Grundzüge der Vorlage», `lvl_5` «5 Erläuterungen zu einzelnen
Artikeln», danach `annex_1..4`.
→ **Der Join Artikel ↔ Botschaftsstelle ist ein struktureller Identitäts-Join auf `eId`,
keine Heuristik** — für BBl 2022+.

Drei belegte Grenzen:
1. **Nicht jede Botschaft nutzt Artikel-Überschriften.** `fga/2025/960` (206 kB, 66
   Überschriften): 0 Artikel-Überschriften. Abdeckung ist also lückenhaft → ehrlicher
   Leerzustand (§8), nie ein «leider nichts gefunden» ohne Grund.
2. **eId ist innerhalb einer Botschaft nicht eindeutig.** In `fga/2025/1528` kommt
   `art_10` zweimal vor (einmal EOG, einmal ein anderer geänderter Erlass) — Mantelvorlagen
   erläutern mehrere Erlasse hintereinander. Ohne Zuordnung des Zwischentitels (`lvl_5.x`)
   zum Erlass ist der Verweis mehrdeutig. Die Zuordnung Zwischentitel→SR ist **Heuristik**
   (Titelabgleich) → kennzeichnen «maschinell».
3. **Seitenzahl-Sprung («BBl 2017 6941, 7003») geht nur im PDF**, nicht im HTML —
   für pre-2022 bleibt nur der Dokument-Link plus, wenn überhaupt, PDF-Seitenanker.

### 3c Rangliste (Nutzen × Machbarkeit × Risiko)

| Baustein | Nutzen | Machbarkeit | Risiko | Verdikt |
|---|---|---|---|---|
| (a) Prozess-Timeline je Erlass aus Projektgraph | hoch (F3,F6,F7,F10) | **hoch** (eine SPARQL, Muster im Repo erprobt) | gering — nur Verweise + Datum | **zuerst** |
| (e) Diff Erlassentwurf ↔ Schlussabstimmungstext, artikelscharf | **sehr hoch** (F4) | hoch — beide sind BBl-HTML mit `art_`-eIds, gleicher Extraktor wie Bund-Snapshots | mittel: Speicherung zweier Textfassungen = §7-Zitat-Ausnahme nötig | **zweit** |
| (b) Artikelscharfe Botschaftsstellen (Deep-Link, kein Volltext) | **sehr hoch** (F1,F3) | hoch ab 2022, null davor | gering, wenn nur Anker + Live-Link | **dritt** |
| (h) Kantonale Pendants (ZH/BS) | hoch für kant. Praxis | offen — kein kantonaler Projektgraph belegt | Pflege je Kanton | prüfen, nicht annehmen |
| (d) Namensabstimmungen (`Voting`) | mittel (F6, Journalist hoch) | hoch (OData, Curia-Join vorhanden) | gering; Sprachfeld-Falle | viert |
| (f) Vernehmlassungs-Ergebnisbericht | mittel (F10) | **niedrig** — kein Doktyp «Ergebnisbericht» im Fedlex-Vokabular gefunden; liegt als PDF an der Verfahrensseite | Pflegeaufwand hoch | zurückstellen |
| (g) BGer-Zitate der Botschaft (Kreuzverweis) | hoch (F9) | mittel — Regex auf «BBl JJJJ Nnnn» im BGE-Text, Jahr+Seite → fga-ELI ist **nicht** 1:1 | Fehlzuordnung → «maschinell» | nach (b) |
| (c) Amtliches Bulletin je Artikel | mittel (F5) | **niedrig** — `Transcript` hat kein Artikel-Feld, nur Freitext | Heuristik + Datenvolumen | zurückstellen |
| ↳ Ergänzung 15.9.2026 (Recherche B) | — | `Vote.Subject` (NR) trägt den Artikel STRUKTURIERT (181/188 gejoint); Ständerat nur Freitext | keine (Metadaten) | eigener Schritt `W2·6d-PARLAMENT-ARTIKEL` — siehe `../entstehung-2026-09-15/bulletin-vote-ursprung.md` |
| (f2) Kommissionsberichte / Rapporteur (`Preconsultation`, `Rapporteur`) | mittel (F5) | mittel (OData-Join) | gering | Beiwerk zu (a) |
| Referendum-Erkennung | mittel (F7) | **niedrig** — Doktyp 54 «Fakultatives Referendum» hat korpusweit **1** Ressource | Heuristik auf AS-Fussnote | nur als Fussnoten-Zitat |

Unvermeidbare Heuristiken (immer als «maschinell» kennzeichnen, nie stillschweigend):
Zwischentitel→Erlass in Mantel-Botschaften · BBl-Seitenzitat→fga-ELI · «Art. N» im
Bulletin-Freitext · Referendumsfrist aus AS-Fussnotentext.

## 4 Fallen

**F-A Urheberrecht — geklärt, kein Hindernis.** URG Art. 5, Fassung in Kraft seit 1.7.2025,
amtlicher Filestore `eli/cc/1993/1798_1798_1798/20250701/de/html/…-html-1.html` (Abruf 6.9.2026):
Abs. 1: «Durch das Urheberrecht nicht geschützt sind: a. Gesetze, Verordnungen,
völkerrechtliche Verträge und andere amtliche Erlasse; … c. **Entscheidungen, Protokolle und
Berichte von Behörden und öffentlichen Verwaltungen**; …» Abs. 2: «Ebenfalls nicht geschützt
sind amtliche oder gesetzlich geforderte **Sammlungen** und Übersetzungen der Werke nach
Absatz 1.»
→ Botschaft = Bericht des Bundesrates (Behörde) → lit. c. Amtliches Bulletin = Protokoll der
Bundesversammlung → lit. c. BBl/AS als amtliche Sammlungen → Abs. 2. Erlassentwurf und
Schlussabstimmungstext → lit. a bzw. c. **Alles vier gemeinfrei.**
→ Das Hindernis ist also nicht das URG, sondern §5/§7 des eigenen Reglements.

**F-B «Zweite Wahrheit» (CLAUDE.md §5/§7) — die eigentliche Grenze.** Ein gespeicherter
Botschaftstext wäre ein Zitat und bräuchte alle vier Merkmale: Stand/Abrufdatum, amtliche
Quelle-URL, sichtbarer Live-Link, Drift-Erkennung. Deshalb die Bauregel: **Materialien werden
verankert, nicht kopiert.** Gespeichert wird nur (SR, eId, fga-ELI, Anker-id, Doktyp, Datum,
Titel) — das ist ein Verweis, kein Text. Ausnahme mit Augenmass: der Diff (e) braucht zwei
gespeicherte Fassungen; er ist dann wie ein Bund-Snapshot zu behandeln (Pin + `check:*`-Tor),
nicht als «Materialien-Beiwerk».
Zusätzlich: Materialien sind **historisch, nicht geltend** — der Botschaftstext von 2017 ist
kein Geltungsstand. Er darf nie neben dem Artikeltext stehen, ohne dass die Oberfläche
«Stand der Entstehung, nicht geltendes Recht» sagt.

**F-C Datenvolumen und ID-Stabilität.**
- Amtliches Bulletin: `Transcript` deckt Sessionen ab 1978, jede Rede eine Zeile mit Volltext —
  Grössenordnung Gigabyte. Nie spiegeln; höchstens IDs + Deep-Link.
- BBl-HTML: 300 Botschaften 2022–2026, je ~200 kB → ~60 MB, wenn man es spiegelte. Auch das
  ist zu viel für das Repo; Anker-Sidecar (Überschrift + eId + Zeichenoffset) reicht und ist
  im kB-Bereich.
- ID-Stabilität: `eli/fga/JJJJ/N` ist intrinsisch und stabil (im Repo für die Botschafts-Keys
  bereits deshalb gewählt). Die OData-`ID` von `Transcript`/`Voting` ist eine laufende Nummer
  ohne dokumentierte Stabilitätszusage — nie als Schlüssel persistieren, immer
  `BusinessShortNumber` (Curia-Nr.) + Datum.
- Fedlex-eIds sind **nicht** sprachübergreifend joinbar (Repo-Befund frit-drift-2026-08-15) —
  gilt auch für BBl; FR/IT-Botschaftsanker nie über den DE-eId ansteuern.

**F-D Fallen im Zugriff (alle 6.9.2026 selbst getroffen).**
- Fedlex-Weboberfläche ist JS-Shell: jeder `eli/…/de`-Abruf liefert 9148 Byte Willkommenstext.
  Nur der Filestore-Pfad liefert Inhalt. Die Datei heisst wie in `isExemplifiedByPrivate`,
  nur Host/Pfad getauscht — bei BBl **ohne** `-N`-Suffix (`…-de-html.html`), anders als bei
  konsolidierten Erlassen (`…-de-html-1.html`).
- Für BBl-Manifestationen fehlt `jolux:isExemplifiedBy` im öffentlichen Graphen; nur
  `isExemplifiedByPrivate` (intranet.fedlex.admin.ch) ist gesetzt. Der Kanonik-Arbiter aus
  `check:fedlex-versionen` ist auf BBl also **nicht** übertragbar — eigenes Tor nötig.
- OData-Sprachfilter ist unzuverlässig (siehe `Voting`).

## 5 Was offen bleibt
- RIS AT und OEIL: Feature-Beschreibung nicht live verifiziert (404/307 am 6.9.2026) — offen.
- Kantonale Pendants ZH/BS: kein Beleg geprüft, ob ein maschinenlesbarer Materialien-Graph
  existiert (ZH: Weisungen des Regierungsrats, KR-Protokolle) — offen.
- Vernehmlassungs-Ergebnisbericht: kein Fedlex-Doktyp gefunden; ob er über die
  `dl/proj/…/cons_N`-Knoten hängt, ist ungeprüft — offen.
- Ob die Fedlex-BBl-HTML-Ausgabe rückwirkend auf Jahrgänge vor 2022 ausgedehnt wird, ist
  ungeklärt; Stand 6.9.2026 nein.
