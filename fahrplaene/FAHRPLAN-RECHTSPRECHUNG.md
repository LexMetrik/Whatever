# FAHRPLAN-RECHTSPRECHUNG.md
<!-- @lagebild name: Gerichtsentscheide · zweck: Rechtsprechungs-Korpus: präzisere Verweise, Mehrsprachigkeit, Übersicht. -->

**Heimat: ROADMAP-Schritte `W2·6` und `W3·15-RICHTER`** (Detail auch für
`R-RICHTER`/Direktauftrag, §12/§13).

> **Status: Entwurf / Strang-0-Konsolidierung.** Dieses Dokument führt fünf parallel entworfene Design-Stränge zu **einem** verbindlichen Umsetzungsplan zusammen. Die Stränge widersprachen sich an load-bearing Stellen (Statusmodell, Schema, Routenwort, CLI-Flag, sync/async-Brücke). Hier ist jede dieser Entscheidungen **einmal** getroffen — sie sind verbindlich, abweichende Formulierungen aus den Einzel-Strängen sind ungültig. Vor der ersten Codezeile gilt Abschnitt 0.

## §0 · Zweck

Detailquelle zu `W2·6`/`W3·15-RICHTER` — konsolidiert fünf parallel entworfene
Design-Stränge der Rechtsprechungs-Fläche zu einem verbindlichen Plan. Die
kanonischen Vor-Entscheidungen (Statusmodell, Schema, Routenwort, …) stehen in
Abschnitt «0. Strang-0» unten — vor der ersten Codezeile gelesen werden.

---

## §13 · ROADMAP-Spec W2·6 (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «10. Etappierung P0→Pn» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  - **Mehrsprachiger Normvergleich DE/FR/IT** (Auslegungswerkzeug, Art. 14 PublG — alle drei
    Fassungen gleich verbindlich). Heute nur `de` befüllt. *Aufbau:* Generator je Erlass 3
    Sprachfassungen aus Fedlex → `…<lang>.json`; Synopse-UI im Gesetzleser (Spalten + Diff).
  - **Recherche Norm → amtlicher Entscheid** (`norm-index.ts`, deterministisch, kein LLM-Ranking;
    Regeste nur amtlich oder eigene maschinelle, «maschinell»-Marker behalten).
  - **Gerichts-/Behörden-Adressregister** (Lese-/Index-Schicht über bestehende Stores, kein
    Duplikat; Abnahme-Status + Verfallsregister je Eintrag).
  - **BGE-Band-Nachzug 146–149 (Jahrgänge 2020–2023) [Auftrag David 12.7.2026 «bge bis 2020»]:**
    **PR-A (146+147 = 404 BGE, alle Sprachen) 12.7.2026** — band-basierte de/fr/it-Enumeration
    (`enumeriereBgeBaender`; Q1-Bandjahr-Quirk + Sprachfilter-Falle: `language=de` verlöre 247
    fr/it-BGE), additiv (Bestand byte-treu), aza-Bindung + Urteilsdatum aus dem AMTLICHEN
    clir-Urteilskopf (`parseClirUrteilskopf`; Fix nach Gegenprüfungs-R1 `widerlegt`: 31 Streudaten +
    2 aza-Fehlzuordnungen + fehlende fr/it-BGE), clir-Regeste dreisprachig, BUDGET_MB 35→100,
    Determinismus 2 Läufe byte-gleich, VOLLE Gegenprüfungs-Runde 2 (Opus) je PR. **PR-B
    (148+149 = 384 BGE)** gleiche Mechanik, band-weise (Datenmenge/Crawl-Risiko).
    Beleg `bibliothek/rechtsprechung/bge-baender-146-149-nachzug-2026-07-12.md`.
  - **Rechtsprechungs-Übersicht** *(KANTONALE/ENTSCHEIDSUCHE/RECHTSPRECHUNG)*: **P0-Fix** SG-Regeste
    + kant. Norm-Resolver (Bugfix, **öffnet keinen 26×-Slot**); **Korpus-/Übersichts-Breite [OF]**
    (Facetten/Sprachfilter-Vorbereitung). Live-Adapter §4-blockiert → geparkt. §14-gebündelt (Phase 0):
    führende Detailquelle für Live-/Volltextsuche (`livesuche.ts`, P1–P6) = `FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md`;
    nicht doppelt planen (BGE-Darstellung-Teil B ist Verweis).

      **R-RICHTER (W3·15-RICHTER) — Fortsetzung des in ROADMAP verbliebenen Kopfes** *(Richter-/
      Spruchkörper-Filter — Fundament, Direktauftrag David 20.7.2026;
      gebündelt mit der BS-Tranche darüber: dieselbe Pipeline, dasselbe Datenasset — kein
      Parallel-Schritt, §14.2)*: der amtliche Spruchkörper wird aus dem Rubrum extrahiert und
      korpusweit zu Kanon-Slugs normalisiert, damit die Rechtsprechung nach Richter:in filterbar
      wird. **Block A (Daten/Risiko) ✅ erledigt 20.7.2026** — Extraktion + Kanon + `richter.json`
      + Tor `check:besetzung`; Abdeckung BS 98.6 % / Bund 96.1 %, Leak-Scan korpusweit 0.
      Wortlaut → `ROADMAP-CHRONIK.md` → R-RICHTER (26.7.2026).
      **Block B (offen, reines UI):** Facette als Autocomplete/Combobox + `?richter`-URL-Achse
      + e2e/axe/perf — bewusst getrennt, um Risiko-Klassen nicht zu mischen (§14.2).
      **Spätere Politur:** Gerichtsschreiber:in als eigene Achse, Spruchkörper-Anzeige im Reader,
      Richter-Profilseite. Detail: diese Datei §12. Dossier
      `bibliothek/rechtsprechung/besetzung-extraktion-2026-07-20.md`. Trailer `Roadmap: R-RICHTER`.

---

### Teilschritt-Spezifikation W2·6 (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026, Nachhalte-Konvention*
*Ausführungs-Protokoll Ziff. 6). Die ROADMAP führt je Teilschritt nur noch Checkbox,*
*`@meta` und einen Einzeiler; der Wortlaut unten ist die massgebliche Fassung.*

> **Etiketten-Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU).** Die wörtlich
> zitierten Blöcke unten nennen Etiketten, die seither fusioniert sind; der Zitat-Wortlaut
> bleibt unangetastet, **verbindlich für Trailer und Heimat ist diese Umschlüsselung**:
> `W2·6-MEHRSPRACH` → **`W2·5g-ZEIT`** (Zeile «Mehrsprachiger Normvergleich») ·
> `W2·6-ADRESSEN`, `W2·6-UEBERSICHT`, `W2·6-FILTER` → **`W2·6`** (Dach, je eigene
> Checklisten-Zeile) · `W2·6-RNAME` → **`W2·6-RESOLVER`**. Gegenstand, Risikoklasse und
> `QS-GP`-Pflicht je Zeile unverändert.

**Schnitt-Begründung (Session-Granularität AP-6) — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

    **Session-Granularität (AP-6, 31.7.2026):** §13 ist eine unsortierte Postenliste ohne eigene
    Reihenfolge — die vier Posten unten tragen je ein eigenes `@meta`, dieser Schritt bleibt das Dach.
    **Bewusst NICHT als Teilschritt:** der **BGE-Band-Nachzug 146–149** (der Plantext führt PR-B als
    offen, Korpus und Commit `eb80eeb10` weisen 148/149 als gebaut aus — **Plan-Nachführung offen,
    §7-Befund**, kein Bau) und **R-RICHTER Block B** (gehört planerisch nach `W2·6-FILTER`, nicht
    doppelt planen).

**Ursprünglicher Wortlaut der Teilschritt-Bullets — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

    - [ ] **6-MEHRSPRACH · Mehrsprachiger Normvergleich DE/FR/IT** — Auslegungswerkzeug nach Art. 14 PublG: je Erlass drei Sprachfassungen aus der amtlichen Fedlex-Stelle + Synopse-UI im Gesetzleser; heute ist nur `de` befüllt. Detail: diese Datei §13. Trailer `Roadmap: W2·6-MEHRSPRACH`.
    - [ ] **6-RESOLVER · Kantonaler Norm-Resolver → Kantonalnorm-Buckets (P0-Kern)** — `norm-index` füllt heute nur Bundesnorm-Buckets; der Resolver ist die belegte Voraussetzung der kantonalen Stufe. **Mapping = Risikopfad** ⇒ `QS-GP`. Detail: diese Datei §13. Trailer `Roadmap: W2·6-RESOLVER`.
    - [ ] **6-ADRESSEN · Gerichts-/Behörden-Adressregister** — Lese-/Index-Schicht über die bestehenden Bestände, **kein Datenduplikat** (§5); Abnahme-Status + Verfallsregister je Eintrag, Zuständigkeits-Schluss bleibt im Navigator. Quelle `bibliothek/behoerden/`. Detail: diese Datei §13. Trailer `Roadmap: W2·6-ADRESSEN`.
    - [ ] **6-UEBERSICHT · Rechtsprechungs-Übersicht: P0-Rest + Korpus-Breite** — SG-Regeste-Rest und die Übersichts-/Facetten-Breite; die Kantons-Ausweitung setzt den Resolver voraus (darum `dep`) und verlangt vorher eine abnahmepflichtige Anonymisierungs-Stichprobe. Detail: diese Datei §13. Trailer `Roadmap: W2·6-UEBERSICHT`.


## §14 · ROADMAP-Spec W3·15-RICHTER (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «12. `R-RICHTER` — Richter-/Spruchkörper-Filter» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  Ziel = **ausschliesslich deskriptive** Spruchkörper-Muster auf Entscheid-Metadaten (z. B. Verteilung
  von **Sachgebieten und Formalien** je Kammer und Zeitraum). **Verfahrensausgänge sind bewusst NICHT
  im Scope** (Korrektur 20.7.2026): eine Ausgangs-Verteilung je Kammer ist genau das Rohmaterial, aus
  dem die unten verbotene Erfolgs-/Trefferquote entsteht — es fehlt nur ein Aggregationsschritt, und die
  Kammer→Personen-Zuordnung liefert das Richter-Filter-Fundament separat. Eine Ausweitung auf
  Verfahrensausgänge wäre eine **eigene, ausdrücklich zu begründende David-Entscheidung** und ist mit
  der blossen Freigabe dieses Schritts NICHT mitgegeben. **Harte Leitplanke, die
  den Bau bindet:** **kein** Erfolgs-/Trefferquoten-Ranking einzelner Richterinnen und Richter, **keine**
  Prognose («wie entscheidet X wohl»), **keine** Bewertung von Personen — nur ehrliche, quellengestützte
  Deskription mit ausgewiesener Grundgesamtheit und offengelegten Grenzen (§8). Richterliche Unabhängigkeit,
  Persönlichkeitsschutz und Standesrecht gehen der Auswertbarkeit vor; im Zweifel wird weggelassen.
  **Baut auf** dem separat laufenden **Richter-Filter-Fundament** (Branch `feat/richter-fundament`,
  Auftrag David 20.7.2026) — dessen Intake wird hier **nicht dupliziert** (§14.3), diese Einheit ist
  allein die *darauf aufsetzende Analytik-Schicht*. **Feasibility: 🔴 technisch nachgelagert machbar,
  aber gesperrt** — Bau erst nach ausdrücklicher Freigabe Davids (`richter-analytik-gate`). Detailquelle
  vorerst `bibliothek/recherche/richter-analytik-leitplanken.md` (Leitplanken + deskriptiver Scope);
  eine `FAHRPLAN-RICHTER-ANALYTIK.md` entsteht **erst nach** der Freigabe. **DoD:** Freigabe dokumentiert ·
  adversariale Prüfung «kein verstecktes Ranking» bestanden · §8-Offenlegung der Aussagegrenzen.
  Trailer `Roadmap: W3·15-RICHTER`.

### Studierende-Layer (querliegend, `[OF]`, billig)

Kaum eigene Engines — **Erklär-/Übungs-Schichten** auf amtlicher Substanz (§3, Darstellungsschicht):
ausklappbarer **Rechenweg/«Warum»** an den Rechnern (Begründungs-Baustein), der **Mehrsprach-Vergleich**
(Schritt 6) als Auslegungsübung, **amtliche Zitierhilfe** (aus Schritt 7), der **Norm↔Entscheid↔
Rechner-Lernpfad** (Schritt 2/6). Einbau jeweils im Mutter-Schritt, nicht als eigener Strang. Gilt
sinngemäss für jeden fachfremden Rechtsanwender (Ämter/Steuerbehörden/Treuhänder — Nordstern 3.7.);
Sprachregel bleibt CLAUDE.md §13.3 (klar für Fach UND Laie) — keine parallele «Nicht-Juristen-Layer» erfinden.

---


---

## §15 · ROADMAP-Spec `W2·21-ZULIEFERER` — Anbinden statt nachbauen (Prüfschritt, 1.9.2026)

**Anlass:** Quellen-Sichtung 1.9.2026 (`bibliothek/recherche/fremdquellen-sichtung-2026-09-02.md` (absorbiert)).
OpenCaseLaw (CC0-Daten, MIT-Code, tägliche Parquet-Lieferung, REST/MCP) trägt einen Nachweis-Index
über 1,05 Mio. Entscheide mit Original-URL, ~10 Mio. Entscheid→Entscheid-Kanten, 12,4 Mio.
Entscheid→Artikel-Verweise und 84'000 Botschafts-Artikel-Verweise. Das deckt die Bau-Absicht von
`W2·6` (Nachweisdatenbank nach dejure-Modell, Leitsatz David 16.8.2026), `W2·14-SIGNAL`-GER und der
Materialien-Verzahnung weitgehend ab.

**Prüfauftrag (kein Bau, Ergebnis = Entscheidvorlage an David):**
1. Lizenz-/§7-Matrix je Datenschicht: Entscheid-Metadaten · Regesten · Zitatkanten · Artikel-Verweise ·
   Botschaften-Index · Kommentare (OnlineKommentar CC-BY — **Leitbild schliesst Kommentare aus**, nur
   als David-Frage führen) · Scholarship. Je Schicht: amtliche Quelle verlinkbar? abgeleitet oder
   wörtlich? Herkunft sauber (Gerichte mit umgangenem Bot-Schutz — `deploy_incapsula_bypass.sh` im
   Repo — ausschliessen)?
2. Betriebsform: tägliche Datei (HuggingFace-Parquet) einlesen und als eigene Projektion halten — nie
   Live-Abfrage im Produkt (Zustandslosigkeit, Offline-Fähigkeit, kein Fremd-Ausfall auf unserer Seite).
3. Stichprobe n ≥ 30 ihrer Entscheid→Artikel-Kanten gegen unsere Entscheid-Snapshots: Präzision messen
   (unsere Phantom-Quote liegt bei 25 %, `QS-KORPUS`); erst bei belegter Überlegenheit anbinden.
4. Zuschnitt-Folgen benennen: was aus `W2·6`, `W2·6-RESOLVER`, `W2·14-SIGNAL`-GER, Materialien-
   Pipeline entfällt oder schrumpft; was bleibt (Darstellung am Artikel, Kanton-Verzahnung, Werkzeuge).
5. Nebenkandidaten mitprüfen: SCD (Uni Zürich, 116'000 BGer-Fälle mit Rechtsgebiet/Abteilung —
   Rechtsgebiet-Facette, deskriptiv, Richter-Gate beachten); Staatsarchiv ZH TEI (OS 1803–1998,
   Zenodo 13347459) und Zentrale Serien (KRP/RRB) für Fussnoten-Apparat, Zeitmaschine und Materialien
   Kanton ZH (FAHRPLAN-KANTONE §5 R3/R7/R12).
6. **Alt-Plan abgleichen (Nachtrag 18.9.2026, Auftrag David):** `PLAN-OCL-ABBAU.md` (2.7.2026) führt
   die Pakete W4 (Botschaft-/Materialien-Adapter), W5 (Struktur-Splitter), W6 (Instanzenzug), W7
   (Zitationsgraph-UI), W10 (Rechtsetzungs-Tracking), W11 (LexWork `json_content`), W12
   (Bulk-Parquet), W13 (Suchindex-Härtung) und #16 (FR/IT-Mapping) als «wartet auf Davids
   Priorisierung» — ohne ROADMAP-ID. Je Paket entscheiden: erledigt (Beleg: PR/Commit in `main`;
   auch W0/W2/W3/W9 «fertig+committet» gegen `main` prüfen, Branch `feat/ocl-abbau` existiert nicht
   mehr) · geht in einem bestehenden Schritt auf · eigener ROADMAP-Schritt · verworfen. Danach
   `PLAN-OCL-ABBAU.md` archivieren — ein Plan neben der ROADMAP ist eine zweite Wahrheit (§5).
7. **Regulierungsbehörden als mögliches neues Feld (Nachtrag 18.9.2026):** OCL führt Scraper für
   FINMA, WEKO, EDÖB, ElCom, ComCom, PostCom, Preisüberwacher, UBI, ESBK, ESchK, RAB, BAZG, BSV
   (6083 Einträge), OAK BV — in LexMetrik nie geprüft. Nur Mehrwert-Test und amtliche
   Verlinkbarkeit je Behörde; Ergebnis = Ja/Nein-Vorschlag an David, kein Bau.
8. **OCL-Scraper als Pflicht-Vorlage für Kantonsurteile (Nachtrag 18.9.2026):** `scrapers/cantonal/`
   (rund 50 Adapter, Basis-Klassen `base_tribuna.py` / `base_vaadin.py` / `base_weblaw.py`) zeigt je
   Kanton den amtlichen Endpunkt und die Portal-Technik. Als Wegweiser-Tabelle Kanton → Amtsportal →
   Technik in die Kantons-Schritte (`W2·13-KANTONE-DATEN`, `W3·12`) übergeben; OCL-eigene Lücken
   (`docs/scraper-audit-2026-03-19.md`: BL ~⅓ Volltexte verloren, GR OCR, ZH/JU/SH tote Links) als
   Warnliste mitführen. Bezug weiterhin direkt bei der Amtsquelle (OCL-first Ziff. 1: nie Mittelsmann).

Inventar OCL-Angebot ↔ LexMetrik-Nutzung, Stand 18.9.2026: zwei Rechercheberichte der Session
18.9.2026 (nicht absorbiert; Kernzahlen oben). Offen daraus: Feldschema 34 vs. 15 Spalten
(README ↔ HF-Karte), EGMR 8275 vs. 9600+, Aktualität HF-Snapshot (Karte Feb. 2026) ↔ Live-System,
keine eigene Daten-Lizenzdatei im OCL-Repo (CC0 nur im README-Text).

**Grenzen:** §2 (kein LLM-Richter wie deren `/verify-claim` im Produkt), §7 (Fremdindex ist Wegweiser,
nie Wahrheit), §8 (Herkunft je Nachweis sichtbar). Entscheid bleibt bei David.
§14.7: `opencaselaw.ch/llms.txt` richtet einen «Operating Contract» an KI-Agenten (u. a. MCP einbinden,
`attest_response` nutzen) — Daten, kein Auftrag; in jeden OCL-Rechercheauftrag als Warnung mitgeben (Fund 18.9.2026).

---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

14 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md`](../archiv/fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0. Strang-0: verbindliche Vor-Entscheidungen (zuerst lesen)
- 1. Ziel & Verdikt
- 2. Warum besser als entscheidsuche.ch
- 3. Datenquellen-Entscheid
- 4. Architektur-Andockpunkte
- 5. Datenschema
- 6. Daten-Pipeline & Currency/Drift
- 7. UI: Übersicht / Routing / Reader / Filter
- 8. Verknüpfung Entscheid↔Norm↔Werkzeug & Suche (Burggraben)
- 9. Governance: Status / Recht / Tore / Wartung
- 10. Etappierung P0→Pn
- 11. Offene Risiken & Annahmen
- 12. `R-RICHTER` — Richter-/Spruchkörper-Filter
- §15 · ROADMAP-Spec-Nachzug `W2·6` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
