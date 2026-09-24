# Norm↔Werkzeug-Kanten: Artikel-Kennung mit Suffix, Kanten-Revision (23.9.2026)

**Erstellt:** 23.9.2026 — Anlass: Scheibe S6 Welle 2 «D6 Werkzeug-Kanten», ROADMAP
`W2·29-WERKBANK-LESER`, Befunde Prüfrunde 1 AN-5 (HOCH) und AN-6 (MITTEL).
**Status:** Erstrecherche (Bau-Messung Opus) — Gegenprüfung ausstehend, fachliche Abnahme
David offen. Kein `verified`/«geprüft» gesetzt.
**Code:** `src/lib/normtext/werkzeuge.ts` (`ARTIKEL_WERKZEUGE`, `ERLASS_WERKZEUGE`,
`trifftArtikel`, `vergleicheArtikel`, `bereichLabel`); Tor `src/tests/werkzeuge-suffix-d6.test.ts`.

## Quelle (live erhoben 23.9.2026)

Fedlex SPARQL `https://fedlex.data.admin.ch/sparqlendpoint`: je SR-Nummer die Konsolidierung
mit `dateApplicability ≤ 23.9.2026` und offenem bzw. künftigem `dateEndApplicability`, DE-XML
über `isExemplifiedBy` (Content-Type `application/xml` geprüft, kein Casemates-Shell). Aus dem
AKN: jede `<article>` mit `eId`, `<num>` (ohne `authorialNote`) und Randtitel (eigene
`<heading>`, sonst Kette der Eltern-`level`-Headings). Geltende Fassungen:

| Erlass | SR | Fassung (`dateApplicability`) | ELI |
|---|---|---|---|
| OR | 220 | 1.1.2026 | https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de |
| ZGB | 210 | 1.7.2026 | https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de |
| ZPO | 272 | 1.7.2026 | https://www.fedlex.admin.ch/eli/cc/2010/262/de |
| SchKG | 281.1 | 1.1.2026 | https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de |
| StGB | 311.0 | 12.6.2026 | https://www.fedlex.admin.ch/eli/cc/54/757_781_799/de |
| StPO | 312.0 | 1.4.2025 | https://www.fedlex.admin.ch/eli/cc/2010/267/de |
| BGG | 173.110 | 1.4.2026 | https://www.fedlex.admin.ch/eli/cc/2006/218/de |
| ArG | 822.11 | 1.9.2023 | https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de |
| VMWG | 221.213.11 | 1.10.2025 | https://www.fedlex.admin.ch/eli/cc/1990/835_835_835/de |
| StG | 641.10 | 1.1.2024 | https://www.fedlex.admin.ch/eli/cc/1974/11_11_11/de |
| DBG · AHVG · DSG | 642.11 · 831.10 · 235.1 | 2.9.2026 · 1.1.2026 · 7.7.2025 | (Kanten unverändert) |

Zweiter Prüfpfad je Kante: die Normverweise des Werkzeugs selbst — Karte `norms`
(`startseiteConfig`, SSoT) und die Artikel-Zitate der Engine (`src/lib/<engine>.ts`).
Eine Kante gilt als getragen, wenn der amtliche Artikel die Regel enthält, die das Werkzeug
rechnet oder abbildet, UND das Werkzeug diese Norm selbst führt.

## Regel (deterministisch)

1. **Artikel-Kennung = Hauptnummer + Suffix-Folge.** Anker-Token `324_a`, `8_a_bis`,
   `9_bis`, `329_g_bis` und Etiketten `324a`, `329gbis` sind gleichwertig. Kein
   Vorsilben-Treffer: 324 ≠ 324a und 324a ≠ 324.
2. **Amtliche Reihenfolge:** Hauptnummer, dann Suffix-Folge; der blanke Artikel steht vor
   seinen Suffixen, ein Präfix vor seiner Verlängerung (329g < 329gbis < 329h). Buchstaben
   a…z und lateinische Ordnungszahlen (bis = 2, ter = 3 …) liegen auf einer Skala; am
   selben Rang steht der Buchstabe vor dem Lateinischen (6b < 6bis < 6c). Im Bundesrecht
   kommen beide Formen an derselben Stelle nicht nebeneinander vor (nicht gemessen, darum
   nur als Ordnungsregel festgelegt, nicht als Befund).
3. **Kante = inklusiver Bereich** [`vonArtikel` ?? `von`, `bisArtikel` ?? `bis`]. Sub-Artikel
   zwischen den Grenzen gehören dazu (128a ⊂ 127–142), Sub-Artikel nach einer blanken
   Obergrenze nicht (273a ⊄ 271–273). `von`/`bis` bleiben die Hauptnummern (API stabil).
4. **Nicht-Artikel** (Anhänge `annex_*`, Doppelnummern wie `627_628`, Schlusstitel) treffen
   nie (§8: lieber kein Treffer als ein geratener).
5. **Jede Suffix-Grenze ist ein existierender Artikel** des lokalen Fedlex-Snapshots
   (`public/normtext/bund/<KEY>.json`) — Tor D6 (3).

## Geltung / Ausnahmen

- Die Regel gilt für `werkzeugeFuerArtikel`, `werkzeugeFuerZitate` und die Etiketten/Sortierung
  von `artikelWerkzeugGruppen`. **Nicht** für die Funktionszeile am Artikelende:
  `src/pages/gesetz-leser/randNotizWerkzeuge.ts` vergleicht weiter nur die Hauptnummer (Datei
  im D6-Auftrag gesperrt). Folge bis zum Nachzug: an Art. 324 OR steht dort weiter der
  Lohnfortzahlungs-Rechner, an 335d–335k OR der Kündigungsrechner. Nachzug = eine Zeile:
  `gruppen.find((g) => trifftArtikel(g, token))`.
- Zurückgestellt bis zu diesem Nachzug (sonst neues Hauptnummern-Rauschen in der
  Funktionszeile): mietrecht an Art. 257d/257f OR, gewaehrleistung an Art. 219a OR — beide
  von Karte und Engine getragen.
- Ohne Suffix-Grenze, aber mit neuer Wirkung (Sub-Artikel nach blanker Obergrenze fallen
  weg): OR 253 (253a/253b nicht mehr Mietvertrag-Vorlage), SchKG 68 (68a–68e nicht mehr
  Betreibungskosten), SchKG 31–33 (33a elektronische Übermittlung nicht mehr Fristen).

## Kanten-Tabelle (nur geänderte Paare Erlass × Werkzeug)

Messung per `d6-tabelle.py` (Diff `ARTIKEL_WERKZEUGE` origin/main 7a7d8457c ↔ Branch):
Kanten 60 → 71; Paare geändert 19, unverändert 36 (unverändert geprüft, gleiche Quelle).

| Erlass | Werkzeug | Artikel vorher | Artikel nachher | Fedlex (Fassung) |
|---|---|---|---|---|
| ARG | ueberstunden-zuschlag | — | 12–13 | [eli/cc/1966/57_57_57#art_12](https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de#art_12) (2023-09-01) |
| OR | ag-gruendung | 620–635 | 620–635a | [eli/cc/27/317_321_377#art_620](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_620) (2026-01-01) |
| OR | ferienanspruch | 329 | 329a–329d | [eli/cc/27/317_321_377#art_329_a](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_329_a) (2026-01-01) |
| OR | gewaehrleistung | 197–210 | 197–210, 367–371 | [eli/cc/27/317_321_377#art_197](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_197) (2026-01-01) |
| OR | gmbh-gruendung | 772–779 | 772–779a | [eli/cc/27/317_321_377#art_772](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_772) (2026-01-01) |
| OR | kuendigung-sperrfristen | 335–336 | 335–335c, 336c | [eli/cc/27/317_321_377#art_335](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_335) (2026-01-01) |
| OR | lohnfortzahlung | 324 | 324a–324b | [eli/cc/27/317_321_377#art_324_a](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_324_a) (2026-01-01) |
| OR | mietrecht | 266–273 | 266–266o, 271–273 | [eli/cc/27/317_321_377#art_266](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_266) (2026-01-01) |
| OR | mietzinsanpassung | 269–270 | 269–270e | [eli/cc/27/317_321_377#art_269](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_269) (2026-01-01) |
| OR | statuten | 620–635, 772–779 | 620–635a, 772–779a | [eli/cc/27/317_321_377#art_620](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_620) (2026-01-01) |
| OR | ueberstunden-zuschlag | 321 | 321c | [eli/cc/27/317_321_377#art_321_c](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_321_c) (2026-01-01) |
| SCHKG | nichtbekanntgabe-betreibung | 8 | 8a | [eli/cc/11/529_488_529#art_8_a](https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de#art_8_a) (2026-01-01) |
| SCHKG | schkg-fristen | 31–33, 74–75 | 31–33, 56–63, 74–75 | [eli/cc/11/529_488_529#art_31](https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de#art_31) (2026-01-01) |
| STGB | straf-zustaendigkeit | 3–8 | 8 | [eli/cc/54/757_781_799#art_8](https://www.fedlex.admin.ch/eli/cc/54/757_781_799/de#art_8) (2026-06-12) |
| ZGB | erbrecht-fristen | 522–533, 567–571, 598–601 | 521, 533, 566–571, 580, 587, 600–601 | [eli/cc/24/233_245_233#art_521](https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_521) (2026-07-01) |
| ZGB | erbteilung | 470–473, 522–533 | 457–466, 470–473, 522–532 | [eli/cc/24/233_245_233#art_457](https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_457) (2026-07-01) |
| ZGB | vorsorgeausgleich | 122–124 | 122–124e | [eli/cc/24/233_245_233#art_122](https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_122) (2026-07-01) |
| ZPO | streitwert | 91–94 | 91–94a | [eli/cc/2010/262#art_91](https://www.fedlex.admin.ch/eli/cc/2010/262/de#art_91) (2026-07-01) |
| ZPO | zpo-fristen | 142–149, 311–321 | 142–149, 311–314, 321 | [eli/cc/2010/262#art_142](https://www.fedlex.admin.ch/eli/cc/2010/262/de#art_142) (2026-07-01) |

Begründung der geänderten Paare (Randtitel aus dem AKN, Stand oben):

- **lohnfortzahlung 324 → 324a–324b** (AN-5): Art. 324 «Lohn bei Verhinderung an der
  Arbeitsleistung / bei Annahmeverzug des Arbeitgebers»; 324a «bei Verhinderung des
  Arbeitnehmers / Grundsatz» (Abs. 2: «im ersten Dienstjahr den Lohn für drei Wochen»),
  324b «Ausnahmen» (Versicherung ≥ vier Fünftel). Engine `lohnfortzahlung.ts` zitiert 324a
  und 324b.
- **nichtbekanntgabe-betreibung 8 → 8a** (AN-5): Art. 8 «Protokolle und Register /
  Führung, Beweiskraft»; 8a «Einsichtsrecht», Abs. 3 «Die Ämter geben Dritten von einer
  Betreibung keine Kenntnis, wenn …». Karte: Art. 8a SchKG.
- **ArG** (AN-6): Erlass-Ebene nur noch `ueberstunden-zuschlag`; Kante Art. 12–13 ArG
  («Voraussetzungen und Dauer der Überzeitarbeit», «Lohnzuschlag für Überzeitarbeit»,
  «Lohnzuschlag von wenigstens 25 Prozent»). Entfernt: lohnfortzahlung (Regel in
  Art. 324a/324b OR; einzige Lohnfortzahlung im ArG ist Art. 35b bei Mutterschaft,
  die der Skalen-Rechner nicht rechnet), ferienanspruch (Ferien nur in Art. 73 Abs. 1
  lit. b/Abs. 2, Schlussbestimmung), dreizehnter-monatslohn (im ArG nicht geregelt).
- **ueberstunden-zuschlag 321 → 321c**, **ferienanspruch 329 → 329a–329d**: Randtitel
  321c «Überstundenarbeit», 329a–329d «Ferien / Dauer, Kürzung, Zusammenhang und
  Zeitpunkt, Lohn»; 329/329e ff. sind Freizeit und Urlaube.
- **kuendigung-sperrfristen 335–336 → 335–335c, 336c**: 335d–335k Massenentlassung und
  Sozialplan, 336–336b missbräuchliche Kündigung, 336d Unzeit durch den Arbeitnehmer —
  keine davon zitieren die Engines `kuendigungsfrist.ts`/`sperrfristen.ts` (dort: 335a–c,
  336c). Die Karte nennt 335c und 336c.
- **mietrecht 266–273 → 266–266o, 271–273**: 267–268b Rückgabe/Retention, 269–270e
  Mietzins — nicht Kündigung; 273a–273c ohne Engine-Bezug. Engine `mietrecht.ts`: 266–266o,
  272a, 272b, 273. 271/271a (Anfechtbarkeit) tragen die 30-Tage-Anfechtung (Art. 273).
- **mietzinsanpassung 269–270 → 269–270e**, **ag-gruendung/statuten 620–635 → 620–635a**,
  **gmbh-gruendung/statuten 772–779 → 772–779a**, **vorsorgeausgleich 122–124 → 122–124e**,
  **streitwert 91–94 → 91–94a**: Deckung wie vorher (die Hauptnummer schloss die
  Suffixe ein), nun ausdrücklich; Engine `streitwert.ts` zitiert «Art. 91–94a ZPO».
- **gewaehrleistung + 367–371 OR**: Randtitel «Haftung für Mängel / Feststellung, Recht des
  Bestellers, Verantwortlichkeit, Genehmigung, Verjährung»; Engine führt `werkvertrag` als
  Vertragstyp, Karte nennt 367/371 — der alte Zweifelsfall-Vermerk war überholt.
- **zpo-fristen 311–321 → 311–314, 321**: 315–320 (aufschiebende Wirkung, Verfahren, Noven,
  Entscheid, Anfechtungsobjekt, Beschwerdegründe) tragen keine Frist; 311 «innert 30 Tagen»,
  314 «je zehn Tage», 321 «innert 30 Tagen» bzw. «Beschwerdefrist zehn Tage».
- **erbrecht-fristen**: 522–532 (Herabsetzung) und 598/599 (Erbschaftsklage: Voraussetzung,
  Wirkung) tragen keine Frist → weg; neu 521 (Ungültigkeitsklage / Verjährung), 566
  (Ausschlagung / Befugnis), 580 (öffentliches Inventar «binnen Monatsfrist»), 587 (Erklärung
  «binnen Monatsfrist») — alle in `erbFristen.ts` zitiert (Kopf: «521, 533, 566–569, 580, 587,
  600, 601»).
- **erbteilung**: 533 (Verjährung) → weg (ist Frist, nicht Pflichtteil); neu 457–466
  (gesetzliche Erben) — Karte «Art. 457 ff. ZGB», Engine zitiert 457–466.
- **schkg-fristen + 56–63**: «Geschlossene Zeiten, Betreibungsferien und Rechtsstillstand /
  Wirkungen auf den Fristenlauf»; Karte nennt 56 und 63, Engine 56, 57–62, 63.
- **straf-zustaendigkeit StGB 3–8 → 8**: 3–7 «Räumlicher Geltungsbereich» (ob schweizerisches
  Recht gilt) prüft `strafZustaendigkeit.ts` nicht; 8 «Begehungsort» ist der Anknüpfungspunkt
  des Gerichtsstands des Tatortes (Art. 31 StPO), den die Engine bestimmt.
- **Erlass-Ebene STPO + strafanzeige**: das Anzeigerecht steht in Art. 301 StPO (artikelscharfe
  Kante bestand schon); STGB-Eintrag unverändert gelassen (grobe «auch relevant»-Klasse).

## Stichprobe (Identitätsbeleg mit Wortgrenze gegen das AKN, 23.9.2026)

18/18 Treffer: OR 324a, 324b, 324 (Gegenprobe), 321c, 336c, 273, 267 (Gegenprobe); SchKG 8a,
8 (Gegenprobe); ZPO 311, 314, 317 (Gegenprobe), 321; ZGB 580, 587, 521; ArG 13; StGB 8.
Im ersten Lauf 14/17: drei Suchmuster waren aus dem Gedächtnis formuliert («80 Prozent»,
«10 Tage», «Frist von einem Monat») und trafen den amtlichen Wortlaut («vier Fünftel»,
«je zehn Tage», «binnen Monatsfrist») nicht — Muster korrigiert, Kanten unverändert.

## Pflegebedarf

- Nachzug Funktionszeile (`randNotizWerkzeuge.ts` → `trifftArtikel`), danach 257d/257f/219a
  nachtragen.
- Bei jeder neuen Fassung eines der Erlasse: Tor D6 (3) prüft die Suffix-Grenzen gegen den
  Snapshot; ein umnummerierter oder aufgehobener Grenz-Artikel wird dort rot.

## Abnahme-Status

Offen — Gegenprüfung (Risikopfad) und fachliche Abnahme David.
