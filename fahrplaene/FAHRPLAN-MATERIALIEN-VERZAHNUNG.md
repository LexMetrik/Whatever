# FAHRPLAN-MATERIALIEN-VERZAHNUNG — E6a Stufe 1 vorgezogen
<!-- @lagebild name: Amtliche Materialien · zweck: Botschaften, Rundschreiben und Co. einbinden und mit den Normen verzahnen. -->

**Heimat: ROADMAP-Schritte `W2·6a-MAT` und `W2·6b-MAT-FINMA`.**
**Stufe 3 «Entstehung am Artikel» (6.9.2026): §11 — Heimat `W2·6c-ENTSTEHUNG-DATEN/-LESER/-SYNOPSE`.**
**Lesehinweis:** Scope, Datenmodell, Adapter, Tore und UI der gebauten Stufe 1 liegen wörtlich im
[Archiv](../archiv/fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) §1–§5; diese Datei trägt nur noch offene Bindungen.

**Auftrag:** David 3.7.2026 — «Fundament, dass zukünftige Materialien direkt verlinkt sind: Wegleitungen
SECO für ArG, EDÖB für DSG, ESTV für MWSTG usw.» Vorgezogen VOR VPS.
**Stufe 1 = Verweis-/Register-Ebene:** pro Dokument eine Index-Karte (Nr./Titel/Datum/Behörde/PDF- bzw.
HTML-Live-Link, §7 a–d) + Norm-Mapping als Kanten am Norm-Artikel. **KEINE Volltext-Einbettung.**
**Rahmen:** CLAUDE.md §5 SSoT, §7 Zitat-Ausnahme a–d, §8 Ehrlichkeit, §15 Performance;
FAHRPLAN-DATENHALTUNG §3.1 `soft_law`/§3.2 `norm_referenzen`/§5 E6/Weiche C;
FAHRPLAN-VERZAHNUNG-UI §1.0 `VerzahnungsKante`, §V3.

---

## §0 · Kritik-Einarbeitungs-Tabelle

Zwei unabhängige Kritiken (A = 14 Befunde, B = 10 Befunde) gegen die Erst-Spec. Verdikte nach
Repo-Verifikation; jede Konsequenz nennt den Ziel-Abschnitt.

| # | Befund (kurz) | Verdikt | Konsequenz |
|---|---|---|---|
| A1 | Normrevisions-Problem ungelöst: kein Fassungs-Abgleich Dokument-Stand ↔ Ziel-Norm (revDSG 1.9.2023, MWSTG-Teilrev 1.1.2025, SECO-Stände 2012–2025); Drift-Tokens überwachen nur die Quelle, nie die Ziel-Norm | **berechtigt (Blocker)** | Neu §2.4 Revisions-Invariante: Cutoff-Tabelle je erlass_key, Downgrade artikelscharf→Erlass-Ebene, UI-Stand-Anzeige + Staleness-Hinweis, Wortlaut «verweist auf … (Stand des Dokuments: …)»; Tor-erzwungen (§4) |
| A2/B1 | DDL ungültig: `COALESCE(…)` im PRIMARY KEY wirft in SQLite/node:sqlite «expressions prohibited» — M0 scheitert am ersten CREATE | **berechtigt (Blocker)** | §2.1: `artikel`/`fundstelle` als `TEXT NOT NULL DEFAULT ''` (`'' = Erlass-Ebene`, dokumentiert), nackter UNIQUE-Key |
| A3 | Scheinautorität: ALLE Kanten als `herkunft='amtlich'` zementiert, obwohl Q4-Seiten-Fallback selbst «Heuristik» heisst und Q3 «kuratiert» ist — widerspricht VZUI-§1.0-Pflichtfeld | **berechtigt (Blocker)** | §2.1/§3: `quelle` je Kante ehrlich `'amtlich'\|'kuratiert'\|'maschinell'`; Invariante erweitert; UI nutzt bestehende Badge-Regel (zusammengeführt mit B7) |
| B2 | Append-only-Historie ohne committeten Träger: `daten/*.db` ist gitignored + wegwerfbar; «galt damals» und die Append-only-Invariante haben in CI/frischem Clone keine Baseline; echter Live-Rebuild kann Entlistetes prinzipiell nicht reproduzieren; volatile quell_ids in client-gefetchtem register.json = §15-Leak | **berechtigt (Blocker)** | Neu §2.3 committetes Zustands-Manifest (`bibliothek/register/soft-law-zustand.jsonl` — unter `daten/` unmöglich, da Parent gitignored); Weiche C präzisiert: Rebuild = deterministisch aus (Zustands-Manifest + Snapshot), nie Live-Quelle allein; register.json schlank (nur gelistete, ohne Interna); Snapshot-Beleg ehrlich reduziert auf «sha+Metadaten committet, Roh-Substrat lokal» |
| A4 | §7 a–d falsch gemappt: echte Buchstaben = Stand / Quelle-URL / **im UI sichtbarer Live-Link** / **automatische Drift-Erkennung**; «abgerufen» ist kein §7-Buchstabe, (c) wurde gar nicht geprüft; DB-Dokumente erscheinen schon ab M1 im Browse | **berechtigt** | §4 Tor auf echte a–d präzisiert; M1-DoD: Playwright-Beweis, dass die MaterialLeser-Karte für DB-Dokumente den sichtbaren Live-Link rendert |
| A5 | Entlistete Dokumente: Projektions-/UI-Verhalten undefiniert → tote amtliche Links bzw. Massen-Entlistung bei Crawl-Bruch | **berechtigt** | §2.5: entlistet ⇒ aus BEIDEN Projektionen raus; Entlistung nur bei grünen Count-Gates desselben Laufs; Quoten-Schwelle im Tor |
| A6 | Q1-Drift per «Publiziert am»-Stichprobe erkennt In-place-Änderungen nicht gesampelter Ziffern nicht; publicationId-Wechsel bei jeder Änderung unbewiesen | **berechtigt** | §3 Q1: Arbiter = Hash über komplettes ToC-XHTML inkl. aller cipherKeyDates je Publikation (1 GET/Publikation); Stichprobe nur Zweitsignal |
| A7 | Wortfeld-Tor-Löcher: `src/pages/MaterialLeser.tsx` nicht im Grep-Pfad; Grep über JSON trifft verbatim übernommene AMTLICHE Titel (falsch ROT bzw. Zwang zum Umschreiben amtlicher Titel) | **berechtigt** | §4: Pfade + `src/pages/Material*.tsx`; in JSON nur EIGENE Felder greppen, amtliche titel/beschreibung als Zitat-Felder ausgenommen |
| A8 | `drift_token NOT NULL DEFAULT ''` sabotiert das eigene Tor (leerer Default besteht die Prüfung) | **berechtigt** | §2.1: DEFAULT gestrichen; Tor prüft nicht-leer für stand/quelle_url/abgerufen/drift_token |
| A9 | Geister-Anker-Validierung undefiniert für Kanten auf AUFGEHOBENE Artikel (real existierende Kommentierungen) | **berechtigt** | §2.4: deterministischer Downgrade auf Erlass-Ebene + Protokoll-Log, nie stummer Drop, nie Tor-ROT |
| A10 | Q3-ID-Stabilität unbelegt: EDÖB hat keine Nummern-Systematik, Titel-Slug ⇒ Titelretusche = falsche Entlistung + Duplikat | **berechtigt** | §3 Q3: Slug-Normalisierung + Alias-Tabelle (alt→neu) im Adapter; Tor warnt bei Entlisten+Neuanlegen mit hoher Titel-Ähnlichkeit |
| A11/B10c | `fundstelle_url` mit volatiler publicationId ⇒ Link-Fäulnis zwischen Snapshots + kompletter Shard-Churn je ESTV-Neuversion | **berechtigt** | §2.1/§3 Q1: Basis-URL-Indirektion (Basis je Dokument in `quell_ids`, Kante trägt Suffix; Projektion setzt zusammen); Ziffer-Link-Stichprobe (url_effective/Soft-404) ins Netz-Tor |
| A12 | ROADMAP-`dep: []` unehrlich: M5 hängt hart am V1a-Merge, nur Fliesstext bildet das ab | **berechtigt** | @meta: `dep: [W2·7-VZUI (nur M5)]` |
| A13 | quell_snapshot-BLOBs = Repo-Bloat in der «git-getrackten» DB | **teilweise — Prämisse falsch:** `daten/*.db` ist gitignored (verifiziert .gitignore Z. 59), es gibt keinen git-Bloat | Grössen-Disziplin trotzdem übernommen (§2.2: nur extrahiertes Substrat, gzip, DB-Budget im Tor); Beleg-Frage löst B2 |
| A14 | M2-Vollständigkeits-Gate kippt in Dauerrot (Korpus führt Aufgehobene, SECO hat dafür kein PDF) oder stille Ignore-Liste | **berechtigt** | §3 Q2: Gate = Korpus-Bestand MINUS aufgehoben-markierte MINUS begründete Ausnahmeliste (Datum+Grund); neue unerklärte Lücke ⇒ ROT |
| B3 | Key-Kollisionen bei ALLEN 4 Quellen, nicht nur Q4 (verifiziert: `ESTV-MWST-INFO-09`, `SECO-WEGL-ARG-*`, `EDOEB-LEITFADEN-DATABREACH/-TOM/…` existieren); Spec-Beispiele schrieben die Dubletten selbst fest | **berechtigt** | §2.6: Abgleich-Tabelle + 1:1-Tor für alle vier Adapter; bestehender MATERIAL_REGISTER-Key gewinnt; Dubletten-Tor via quelle_url-/Nummern-Match |
| B4 | VBGÖ ist nicht im Korpus (kein VBGOE.json, kein ERLASS_REGISTER-Key — verifiziert) → reisst das spec-eigene Geister-Anker-Tor | **berechtigt** | §1: VBGÖ aus Stufe-1-Scope gestrichen; §2.4 Regel für nicht-korpusierte Erlasse (DB ja, Projektion nein) |
| B5 | 300-KB-Shard-Budget bricht sicher am ERSTEN Testfall MWSTG (10⁴+ Kanten × lange URLs ≈ MB); «Folge-Entscheid» ist keine Eventualität | **berechtigt** | §2.2: JETZT entschieden — Kanten je (Dokument, Artikel) aggregiert (Ziffern-Liste als Feld) + Basis-URL-Indirektion + Bucket-Split ab M0 gebaut; im M1-Aufwand eingepreist |
| B6 | M1–M4 sind Prod-sichtbare Content-Releases (register.json wird live von Suche+Browse gefetcht; Auto-Merge + main=Prod) und brauchen `src/lib/materialien/{typen,register}.ts` (DoktypId/Labels); nicht registrierte Behörde/Doktyp verschwindet still aus Browse | **berechtigt** | §6: je Adapter-Etappe als Content-Release benannt (Lesbarkeits-/Perf-Stichprobe in DoD); @meta-Kollisionsliste ergänzt; §4 Tor «jedes DB-Dokument hat registrierte Behörde+Doktyp» |
| B7 | norm_referenzen weicht vom ENTSCHIEDENEN §3.2-Schema ab (zitat_key/roh_zitat/konfidenz/quelle fehlen) — bricht den Nordstern «EIN Query über alle Doktypen» | **berechtigt** | §2.1: §3.2-Spalten vollständig übernommen; `quelle`-Enum bewusst um `'amtlich'` erweitert (Nachtrag in FAHRPLAN-DATENHALTUNG §3.2 = M0-Posten); stand/abgerufen/fundstelle_url als additive Spalten |
| B8 | robots.txt `Disallow: /` auf www.gate.estv…: Vollcrawl + wiederkehrende Drift-Läufe sind ein Governance-Entscheid, kein «offener Punkt: keiner»; `check:netz` wird von keinem Workflow aufgerufen (normen-monitor.yml ruft Netz-Checks einzeln); Crawl dauert bei Concurrency 1–2 Stunden | **berechtigt** | §8: robots-Freigabe Q1 = expliziter David-Entscheid, M1 daran gated; §4: `check:materialien-netz` als eigener normen-monitor.yml-Step (M1-DoD); Crawl-Dauer in §6 ausgewiesen |
| B9 | Aufwand 5–7 Tage optimistisch: check-materialien.ts ist Hard-Assert `Manifest == MATERIAL_REGISTER` → Neubau, nicht «Erweiterung»; gegenpruefung-Läufe je Etappe; Shard-Split + Crawl-Dauer obendrauf | **berechtigt** | §6: M0 1½–2 T, M1 2–3 T, Summe ehrlich **7–10 Tage** |
| B10a | gen:zaehler zählt Materialien heute gar nicht — Pflicht wirkungslos | **berechtigt** | §4/§5: Pflicht-Lauf bleibt (billig, no-op ist harmlos); Zähler-Erweiterung um Materialien = expliziter M5-Posten, wenn die UI sie zeigt |
| B10b | `StatusBadge 'nur-verweis'` ist in V1a NICHT gebaut (VZUI: erst V3) — M5 baut die Variante selbst | **berechtigt** | §5.3: M5 baut die Variante (bewusster V3-Vorzug); eine Nachtragszeile in FAHRPLAN-VERZAHNUNG-UI §V3 = M5-Posten |
| B10d | Sequenz-Gate V1a verifiziert korrekt; `src/lib/kontext.ts` dort ebenfalls Sperrfläche («nur M5» im @meta korrekt) | **bestätigt** | kein Fix nötig |

---

## §10 · ROADMAP-Spec W2·6b-MAT-FINMA (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «§9 · Stufe 2 — FINMA prioritär» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  **Fokus-Dekret-Priorität** — Kontext: externer Anlass im FINMA-Umfeld mit Verweis auf LexMetrik, der Bereich muss vorzeigbar sein)* — **F1:** FINMA als nächste Quelle der bestehenden
  Stufe-1-Pipeline (Rundschreiben/Wegleitungen/Aufsichtsmitteilungen, amtlich Art. 5 URG;
  browserloser Adapter nach §3-Muster, Provenienz §7 a–d; Quell-Wahl zuerst: strukturierte
  Endpunkte vs. PDF empirisch erheben). **F2 (evtl., David «wenn möglich»):** direkte Verzahnung
  FINMA-Schreiben ↔ Erlass-Artikel (FINMAG/FIDLEG/FINIG/KAG/BankG/GwG/VAG) via Referenz-Extraktion —
  VOR Bau H0-Machbarkeits-Verdikt mit Zahlen; Extraktion ⇒ `check:gegenpruefung`. Kanten tragen die
  `W2·7-BEZUG`-Facetten (`quelltyp: materialien`). Detail: diese Datei §9.
  Trailer `Roadmap: W2·6b-MAT-FINMA`.


---

## §11 · Entstehung am Artikel — Stufe 3 (Spec 6.9.2026, Fassung 5 nach Sichtung 11.9.2026)

**Auftrag:** David 6.9.2026 — «Materialien und Wegleitungen maximal sinnvoll verzahnen … dass jemand
noch besser versteht, wie ein Gesetz zustande gekommen ist». Design-Freigabe zum klickbaren Entwurf
(Artefakt «Entstehung am Artikel», 6.9.2026) mit Auflagen: **das Gesetz nicht überladen, nur auf
Wunsch sichtbar**; **zuerst Bundesebene**. **Go David 11.9.2026** («führe alles durch»,
löst «Bau erst auf Davids Go» ab). Grundlage:
`bibliothek/materialien/entstehung-2026-09-06/` (README, 7 Erst-Berichte, Tiefen-Runden R1–R5,
Kritiken A/B, Gemini-Zweitquellen). Architektur-Detail für Bau-Agenten: `…/R5-architektur.md`.
**Heimat:** ROADMAP `W2·6c-ENTSTEHUNG-DATEN` · `W2·6c-ENTSTEHUNG-LESER` · `W2·6c-ENTSTEHUNG-SYNOPSE`
(angelegt 6.9.2026, seit 11.9.2026 `status: ready · blocker: null`).
**Rahmen unverändert:** CLAUDE.md §2, §5, §7 a–d, §8, §15; Stufe-1-Regel «verankern, nicht kopieren».

**Sichtung 11.9.2026 (Fassung 5, Befunde C1–C4 gegen den Ist-Stand des W2·26-Bau):** seit D40
(#761, 7.9.2026, Wortlaut ROADMAP.md) ist die Fassung eine Rubrik der **Funktionszeile am
Artikelende** — der frühere Kopf-/Marginalie-Slot (§11.5 «Rand-Spalte 150 px») ist entfallen. Die
Karte für E3 rendert im **bestehenden** Aufklapp-Block der Funktionszeile (`.lr7-bez-inhalt`,
`src/pages/gesetz-leser/parts/BezuegeKopf.tsx:213-236`, künftig nach `Funktionszeile.tsx`
umbenannt — Detail `FAHRPLAN-DESIGN-IDENTITAET.md` §9 Z2/Z9). **Damit sind C5 und C6 aus §11.0
Runde 2 gegenstandslos:** kein zweiter Slot in der Textspalte, kein Platzproblem in einer
150-px-Marginalie — beides existiert nach W2·24 nicht mehr. Zugeklappt zeigt die Rubrik **nur**
«Gilt seit …» (Spec Z2 in §9); die Fassungszahl und die Zeitleiste erscheinen erst aufgeklappt,
im selben Block, den die spätere Entstehungs-Karte ergänzt.

### §11.0 Kritik-Einarbeitung (Kritik A = Opus, 20 Befunde · Kritik B = Sonnet, 5 Befunde; 6.9.2026)

| # | Befund (kurz) | Verdikt | Konsequenz (Ziel-§) |
|---|---|---|---|
| A1/B4 | Alle neun W2·24-Branches verlagern den Historie-Slot per Default in die Marginalie (`histInRand`); keiner ist auf `main`, nur im Sammelbranch; `r6` ändert `ArtikelHistorie.tsx` um 1 Zeile | **Blocker, berechtigt** | §11.5 gegen das Nach-Landungs-Layout spezifiziert: zugeklappt = Chip in der Marginalie (≤ 24 px), Aufklapp-Karte in der Textspalte; §11.7 E3 wartet auf die Landung des Sammelbranchs `feat/w2-24-design-identitaet` (Stand 6.9.: 0/9 auf main) |
| A2 | `-N`-Regel auf der falschen Dokumentklasse: BBl-Dateien haben KEIN `-N`, cc-Konsolidierungen brauchen es | **Blocker** | §11.6: Anker-Zeile «BBl ohne `-N`, URL nie konstruieren, aus `isExemplifiedByPrivate` (Host-Tausch) auflösen»; Synopse-Zeile trägt die cc-Regel |
| A3 | fga-Altformat existiert (2 938/16 328 = 18 %); nur 338/770 fga-Keys im Register; 34 % der Ereignisse hätten eine erfasste Botschaft, 50 % gar kein fga; R1 §3c falsifiziert | **Blocker (§8)** | §11.3/§11.4/§11.5: Zeile zeigt «Bundesblatt» = Fundstelle vorhanden (amtlicher Link immer); Karte unterscheidet «erfasste Botschaft» (Karte) von «BBl-Fundstelle ohne erfasste Botschaft» (nur Live-Link); Altformat = benannte Klasse ohne Key; R1-Korrektur im README |
| A4 | `check:historie` = Generator `--check` mit Sidecars als einziger Eingabe; `botschaftKey` im Shard ⇒ Dauerrot nach jedem `gen:botschaften` | **Blocker (§17)** | **Historie-Shard bleibt Ein-Quellen-Artefakt.** Kein `botschaftKey` im Shard; stattdessen Kopf `{fassungen}` aus den Sidecars und ein separates, kleines Sidecar `public/materialien/botschaft-keys.json` (Menge der erfassten Keys, ~10 KB), das erst beim Aufklappen lädt (§11.4/§11.6) |
| A5 | Erlass-Titel des Änderungserlasses steht weder im Revisions- noch im Historie-Shard | berechtigt | Titel aus `public/normtext/revisionen/<KEY>.json` (trägt `titelDe` je oc), lazy nach Aufklappen; fehlt der oc dort (Deckung 12,6–40 %), zeigt die Karte nur die AS-Fundstelle — kein Netzabruf |
| A6 | Deckel 12/3 MB unter R2s pessimistischem Rand (8–17 MB); «nur Alt» vs. «alt+neu» unentschieden | berechtigt | §11.6: **nur Alt-Fassung** speichern (neu = geltender Text, liegt vor); Deckel **8 MB gesamt / 2 MB je Erlass** mit Ist-Wert-Ausgabe; E5.0 Vor-Messung 5–8 Erlasse vor dem Bau |
| A7 | «Rot nur bei Rückgang» ist umgehbar (Stand nachziehen) und Korpus-Summe verdeckt Erlass-Rückgang | berechtigt | §11.6: Diagnose **je Erlass**; Senkung des gebuchten Stands nur mit benanntem Grund im PR-Body (Tor liest den Trailer `Entstehung-Deckung:`) |
| A8 | `anker/**` und Curia-Shards liegen ausserhalb `istRisikoPfad()` und Paritäts-Ingest | berechtigt | E2/E4-DoD: `scripts/gegenpruefung/kern.ts` + `scripts/datenhaltung/ingest.ts` um `public/materialien/anker/` und `public/materialien/curia/` erweitern, je Rot-Beweis |
| A9/A20 | Vier Segmente brechen im 24-px-Slot um; «Verfahren» zweideutig; Praxis-Zähler fehlt im Wortlaut | berechtigt | §11.5: zugeklappt **nur** «Gilt seit 1.1.2024 · 5 Fassungen ▸» (nicht umbrechend, feste Wegfall-Reihenfolge: Fassungszahl fällt zuerst); alles Weitere erst aufgeklappt; Playwright misst 320 px |
| A10 | Ist-Zahlen: 26 686 Ereignisse (24 409 datiert), 407 Botschaften | berechtigt | §11.2 ersetzt, Messdatum 6.9.2026 |
| A11 | Richtungsfehler der Deckungsquote | berechtigt | §11.3 umformuliert: «Anteil der Fussnoten-oc, die in der SPARQL-Liste vorkommen» |
| A12 | Ereignisse in `intrinsischeSig` je proj ⇒ Mantelerlass-Fehlalarm | berechtigt | §11.7 E1: Vergleich je fga, Mantelerlass als Rot-Beweis |
| A13/B-Rückbau | kein Rückbau (§17-Gegengewicht): `artikel-revisionen`-Shard + Tor werden Teilmenge | berechtigt | E2-DoD: Konsumenten messen (`KontextPanel.tsx:274`, `EntscheidVerzahnung.tsx:88`) ⇒ Rückbau-Entscheid oder benannter Behalt-Grund |
| A14 | Heimat `W2·6c-*` fehlte in der ROADMAP; M15/M16 nicht als absorbiert markiert | berechtigt | Etappe 0 erledigt 6.9.2026: drei Schritte `blocked · david-go-entstehung`; M15 absorbiert (mit Korrektur der Datei-Angabe als Ergänzung), M16-Datenanteil → SYNOPSE |
| A15/B2 | F2 Point-in-time-Umschalter und F5 Kommission/Berichterstatter weder gebaut noch abgesagt | berechtigt | §11.7: F2 als «später (M16-UI, Zeitreise-Umschalter je Erlass)»; F5: **Kommission ja** (Organ, aus `Preconsultation`), **Berichterstatter nur als Link** auf Curia (keine Personendaten, B1); §11.8 nennt beides |
| A16 | «+ ~10 %» ungemessen; Deckel für `historie/**` fehlt | Hinweis | §11.6: Zuwachs wird in E2 gemessen; `check:entstehung` führt Deckel-Zeile für `public/normtext/historie/**` (heute 9,5 MB, Deckel 11 MB) |
| A17 | E3 ohne Golden-Zeile | Hinweis | §11.7 E3: Golden byte-gleich (Prerender ohne Slot-Markup), rot ⇒ Abbruch, nie Test-Update (§6.3) |
| A18/B1 | NR-Zahl = eigene Auszählung aus `Voting.Decision` (Enum undokumentiert); Personendaten in `Voting` | **B1 Blocker, A18 Hinweis** | §11.4/§11.6/§11.9: **Voting nur aggregiert; `FirstName/LastName/PersonNumber` werden nie extrahiert noch gespeichert**; UI-Beschriftung «eigene Auszählung der amtlichen Einzelstimmen, Abruf <Datum>»; Decision-Codes als geprüfte Tabelle in `bibliothek/`, unbekannter Code ⇒ rot |
| A19 | Aufwand unterbietet R5 | Hinweis | §11.7: R5-Zahlen übernommen |
| B3 | Curia-Vollabgleich ohne Request-Zahl/Kette | berechtigt | §11.6: ~6 Requests je Geschäft ⇒ ~2 300 je Lauf, ≤ 2/s ⇒ ~20 min; **eigener Monatslauf in `normen-monitor.yml`**, nie in der Gate-Kette; Offline-Tor prüft nur den Zustandsträger |
| B5 | «heute»-Punkt und künftige Stände | Hinweis | §11.5: Punkte nach heute heissen «tritt in Kraft am …», nie «gilt seit»; warn-Tick |

**Runde 2 (Opus, 14 Befunde C1–C14 gegen Fassung 3; `…/KRITIK-R2.md`):**

| # | Befund (kurz) | Verdikt | Konsequenz |
|---|---|---|---|
| C5 | Rand-Spalte ist fest 150 px (`--lr-marg`); Overline «Fassung» + «Gilt seit 01.01.2024» belegen ~200 px; «· 5 Fassungen ▸» hätte keinen Platz, `nowrap` erzeugt Überlauf | **Blocker** | **Zugeklappt bleibt der Chip unverändert** («Gilt seit …», ist schon ein Button). Fassungszahl erscheint erst aufgeklappt. Damit ist «nicht überladen» maximal erfüllt |
| C6 | Die Karte «in der Textspalte» hat nach W2·24 keinen DOM-Slot; Offen-Zustand liegt in `ArtikelHistorie.tsx:104` | **Blocker** | E3: Zustand nach `ArtikelLeser` heben, zweiter Slot in der Textspalte (nur im Offen-Zustand gerendert, Input-exkludiert); ROADMAP-LESER nennt beide Dateien |
| C7 | 4 von 9 W2·24-Teilbranches sind nicht im Sammelbranch (`r6`, `r8-abschnitt`, `r10b`, `r5-f1b`); `r6` fasst `ArtikelHistorie.tsx` an und ist stale gegen main (würde #734 zurückbauen) | **Blocker** | E3 wartet auf die Landung **aller** Slot-verlagernden Branches; `r6` vor Landung rebasen (Hinweis an die W2·24-Session) |
| C8 | `botschaft-keys.json` wäre dritte Ablage: `public/normtext/revisionen/<KEY>.json` trägt je oc bereits `titelDe` **und** `botschaftKey`; gemessen: oc-Weg 33,6 % erfasste Botschaften, fga-Weg 34,2 %, Vereinigung 35,1 % | **Blocker (§5)** | **`botschaft-keys.json` gestrichen.** Karte löst Titel + Botschaft über den oc-Link aus dem Revisions-Sidecar (lazy nach Aufklappen); die fga-Fussnote bleibt immer Live-Link |
| C10 | Historie-Kopf `{fassungen}` verlangt `gen:historie` im selben PR | Hinweis | **Kopf gestrichen:** Fassungszahl = Anzahl distinkter `datum` der `ereignisse` im vorhandenen Shard, im Browser gezählt (§3). **E2 fasst den Historie-Generator nicht an** |
| C9 | `check:paritaet` ingestiert `public/normtext/historie/**` nicht (`ingest.ts:144-155`), Kommentar `:28` behauptet Vollabdeckung | berechtigt (Nebenbefund) | nicht Teil dieser Spec (Historie bleibt unangetastet); als §17-Befund in den ROADMAP-Eingang beim Go |
| C11 | Offline-Tor kann den Trailer `Entstehung-Deckung:` nicht lesen | berechtigt | gebuchter Stand lebt in `bibliothek/register/entstehung-deckung.json` (je Erlass: Quote, Datum, optional `grund`); Senkung ohne `grund` ⇒ rot |
| C1–C4 | Berichterstatter-Link fehlte in §11.5; Ablageort Decision-Tabelle; E4 ohne `kern.ts`/Ingest; A8 überzeichnet (offen nur `anker/**`, `curia/**`) | klein | §11.5/§11.6/§11.7 ergänzt |
| C12–C14 | Trailer kollidiert nicht mit `check:merge-schutz`; Blocker registriert, `check:plan` grün; `W2·24-DESIGN-IDENTITAET` existiert als Sammel-Schritt | bestätigt | — |

### §11.1 Zielbild in einem Satz

An jedem Artikel beantwortet die bestehende Historie-Zeile, aufgeklappt, die Praktikerfragen *welche
Fassung galt wann, warum wurde sie geändert, was sagt die Botschaft, hat das Parlament den Entwurf
verändert, was sagt die Verwaltung* — aus drei Ketten an amtlichen Schlüsseln: Fassungskette des
Artikels (Fussnoten → AS → BBl, **liegt als G-HIST-Shard bereits vor**), Verfahrenskette der Vorlage
(Fedlex-Projektgraph + Curia Vista), Praxiskette (Wegleitungen, später Bundesgericht).

### §11.2 Was schon steht (nicht neu bauen, §5) — Messung 6.9.2026

| Baustein | Ort | Stand |
|---|---|---|
| Artikel-Historie aus Fussnoten (Typ, Datum, AS+BBl-Links, Absatz/Buchstabe, «gilt seit») | `src/lib/normtext/historie-parse.ts`, `scripts/normtext/historie-generieren.ts` → `public/normtext/historie/<KEY>.json` (209 Erlasse, 13 093 Artikel, 26 686 Ereignisse, davon 24 409 datiert; OR 367 386 B roh / 13 667 B gzip; Verzeichnis 9,5 MB), Tor `check:historie` (= Generator `--check`, einzige Eingabe: Sidecars) | gebaut (`W2·5i-HIST-ANSICHT` 26.7.2026) |
| Historie-Zeile am Artikel: Chip «Gilt seit», aufklappbare Zeitleiste, CLS-Slot 24 px (`HIST_SLOT` 40 = 16 + 24), Ansicht-Menü «Änderungshistorie aus/Fussnoten/Chronologie» | `parts/ArtikelHistorie.tsx`, Slot `parts/ArtikelLeser.tsx` (`data-hist-slot`), `berechnungen.ts` | gebaut; **nach W2·24 sitzt der Slot per Default in der Marginalie** (`histInRand`) |
| Botschaften (407 Einträge, 385 Curia-Nrn., `projEli`, `ocUris`), Vernehmlassungen (822), Änderungs-Timeline je Erlass (3108 oc, `titelDe` je oc in `public/normtext/revisionen/<KEY>.json`), Wegleitungen ESTV/SECO/EDÖB als Kanten-Shards | `src/lib/materialien/*`, `scripts/materialien/*` | gebaut (Stufe 1) |
| Kontext-Panel am Erlass (Botschaften · Revisionen · Vernehmlassungen · Soft-Law · Entscheide) | `src/components/kontext/*` | gebaut |

### §11.3 Die drei Schlüssel — mit gemessenen Grenzen

| Schlüssel | Belegt (6.9.2026) | Grenze, die die Oberfläche benennt (§8) |
|---|---|---|
| **Fussnote am Artikel** → AS (`eli/oc`) → BBl (`eli/fga`) | 31 176 Fussnoten, 80,6 % mit oc-Link, 42,5 % zusätzlich fga; 62 % unter Artikel-Ebene; 122 Fälle «zwei Erlasse am selben Datum im selben Artikel» (Zuordnung je Buchstabe über die Fussnote) | fga-Links: 18 % Altformat (`3_964_951_873`, kein Key ableitbar), 50 % der Ereignisse ohne fga; nur 34 % der Ereignisse treffen eine **erfasste** Botschaft ⇒ Zustände «erfasste Botschaft» / «BBl-Fundstelle (nur Live-Link)» / «keine Fundstelle». Nur 12,6–40 % der Fussnoten-oc kommen in der SPARQL-Änderungsliste vor (raw ab 2001) ⇒ kein Teilmengen-Tor, Diagnose je Erlass |
| **Projekt-Knoten** `eli/dl/proj` + Curia-Nr. | Ereigniskette `type-projet` mit `decisionDate`; 385 Curia-Nrn., 100 % in `Business`, 92 % mit ≥1 Abstimmung | Abstimmungsresultate nicht im Graph; Ständerat ohne Einzelstimmen in Curia |
| **Artikel-eId im Bundesblatt-HTML** | wo vorhanden exakt kompatibel (`kanonArtikelToken` = Sidecar-Schlüssel) | nur 22 % der Botschaften, keine vor 16.4.2025; Mantel-Zuordnung ~32 % regelbasiert; SPARQL ohne Ziel-SR bei 200/300 ⇒ Botschaftsstelle = Bonus, Regelfall Dokument-Link |

### §11.4 Kantentypen (Erweiterung bestehender Artefakte, keine neue Tabelle, Ein-Quellen-Regel §5)

| Kante | Umsetzung | `quelle` |
|---|---|---|
| Artikel → Änderung (Datum, oc, fga, Absatz/lit.) | **bestehend** im Historie-Shard | `amtlich` |
| Fassungszahl je Artikel | **kein Datenfeld:** Anzahl distinkter `datum` der `ereignisse` im vorhandenen Shard, im Browser gezählt (Darstellung, §3) | — |
| Änderung → Titel des Änderungserlasses + erfasste Botschaft | **kein neues Artefakt:** aus `public/normtext/revisionen/<KEY>.json` (je oc: `titelDe`, `botschaftKey`), lazy nach Aufklappen; Deckung gemessen 76,5 % Titel / 33,6 % erfasste Botschaft; fehlt der oc dort ⇒ nur AS-Fundstelle; die fga-Fussnote bleibt immer Live-Link | `amtlich` |
| Botschaft → Artikel-Anker (nur Botschaften mit `id="art_*"`) | **neu, klein:** `public/materialien/anker/<KEY>.json`; Mantel-Zuordnung nur bei eindeutigem Register-Treffer, sonst Erlass-Ebene | `amtlich`; Mantel `maschinell` |
| Vorlage → Verfahrens-Ereignis | **neu:** `ereignisse[]` in `botschaften.generated` (feste Tabelle `type-projet` → Etikett, `roh` für Audit) | `amtlich` |
| Vorlage → Parlament | **neu:** `Bill`→`Resolution` (Beschlüsse je Rat, Text), `Preconsultation` (Kommission als Organ), `Vote`+`Voting` **nur aggregiert** für die NR-Schlussabstimmung, `Objective.ReferendumDeadline`; **SR ohne Zahl; Berichterstatter nur als Link; keine Personendaten** | `amtlich` (Auszählung eigen, beschriftet) |
| Artikel → Synopse (Alt-Fassung je Änderung, **nur Stände ab 1.1.2021**) | **neu:** Diff zweier Konsolidierungen je eId, gespeichert wird nur der Alt-Block; Zitat-Regime §11.6 | `amtlich`, Zitat |
| Artikel → Entwurf/Beschluss-Diff | **neu, später:** Join über normalisiertes Artikel-Label (BBl-Ids `mod_uN` verrutschen: 7/41) | `amtlich`, Zitat |
| Artikel → Wegleitung | bestehend; Ausbau als eigene Schritte | — |

### §11.5 Darstellung (Design-Freigabe 6.9.2026; gegen das Layout NACH W2·24)

**Umsetzung des Synopse-Anteils (3) gebucht als eigener Roadmap-Schritt `W2·6c-ENTSTEHUNG-SYNOPSE-LESER`** (§14-Intake 11.9.2026, `feld: leser`, dep `[W2·6c-ENTSTEHUNG-SYNOPSE, W2·6c-ENTSTEHUNG-LESER]`) — Detail in diesem Abschnitt.

**Zugeklappt (Default, überall):** **der bestehende Chip, unverändert** («Gilt seit 1.1.2024», bereits
ein Button; Rand-Spalte 150 px, `--lr-marg`, kein Platz für ein zweites Segment — Kritik C5). Nichts
Neues im Lesefluss, **kein Fetch, kein CLS, kein Element im Artikeltext**.
Ansicht-Menü «Änderungshistorie aus» schaltet den Chip weg wie heute. Bei Deep-Link-Ankern gilt der
gemessene CLS-Fall (20.7.2026) als Regressionstest, zusätzlich 320 px Viewport.

**Aufgeklappt (Klick/Enter, echter Input ⇒ CLS-exkludiert), Karte in der Textspalte unter dem Artikel:**
(1) **Fassungsleiste** — ein Punkt je datiertem Ereignis mit betroffenen Teilen («lit. c^bis, c^quater»),
«heute» sage; **Punkte nach heute heissen «tritt in Kraft am …», warn-Tick, nie «gilt seit»**;
**DOM-Ort:** der Offen-Zustand wandert von `ArtikelHistorie.tsx` nach `ArtikelLeser`, das im Offen-Zustand
einen zweiten Slot in der Textspalte rendert (Kritik C6). Kopf der Karte: «5 Fassungen seit 1989» (gezählt).
(2) **Änderungskarte** zum gewählten Punkt: Betrifft · Geändert durch (Titel aus Revisions-Sidecar, sonst
AS-Fundstelle) · AS-Link · Begründung in drei Zuständen: «Botschaft» (erfasste Karte + Live-Link) /
«Bundesblatt» (nur Live-Link, Chip «Botschaft nicht erfasst») / kein Eintrag (nichts behaupten) · Chip
«Sprung zur Erläuterung» nur mit Anker-Sidecar · Chip «amtlich · aus der Fedlex-Fussnote» · Link
«Verfahren → Erlass-Übersicht»; (3) **Synopse** vorher/nachher nur für Änderungen mit
Konsolidierungs-HTML ab 2021, sonst Zeile «Fassungsvergleich erst für Stände ab 2021 verfügbar»;
betroffene Blöcke im Artikeltext markiert, solange die Karte offen ist; (4) **Praxis** (Wegleitungen) lädt
erst jetzt aus dem Kanten-Shard (Lesefluss bleibt bei «Facetten aus = null Byte», Entscheid 28.7.2026):
Zustand «keine Wegleitung erfasst, die diesen Artikel nennt» — nie «keine Wegleitung».
**Deckungs-Seite (§8, Muster Lex `/coverage` «was wir nicht haben»):** aus `entstehung-deckung.json` eine
öffentliche Seite je Erlass: Fussnoten-Deckung, Synopse-Fenster (ab 2021), Anker-Abdeckung, Parlament-Stand.
**Gebaut 12.9.2026 (PR #807):** Route `/materialien/deckung`, Projektion
`public/materialien/deckungs-sicht.json`. Detail/Zahlen: §11.10, ROADMAP-CHRONIK.md.

**Am Erlass (Übersichtsseite):** senkrechter Zeitstrahl je Vorlage, jüngste zuerst: Vernehmlassung →
Botschaft → Kommission (Organ; Berichterstatter nur als Link auf Curia) → Nationalrat/Ständerat (Beschluss-Text, Datum; NR-Zahl als «eigene
Auszählung der amtlichen Einzelstimmen, Abruf <Datum>», SR ohne Zahl) → Schlussabstimmung →
Referendumsfrist → [Abstimmung am …, Resultat nur Link BK] → AS → in Kraft. Quellenangabe
«Parlamentsdienste der Bundesversammlung, Bern · Abruf <Datum>» am Parlaments-Block.

**Am Material:** «Erläutert diese Artikel» nur mit Anker-Sidecar; sonst nur Live-Link.

**Design-Tokens:** ausschliesslich bestehende; kein Eingriff in `src/index.css`. Zustände: zu · offen ·
laden · leer-mit-Grund · Fehler.

### §11.6 Datenhaltung (Deckel = Tor-Bedingungen in `check:entstehung`, alle offline)

| Klasse | Volumen | Ablage | Regime |
|---|---|---|---|
| Verfahrens-Ereignisse | < 100 KB | `botschaften.generated` + Raw | wie Paket 2; Netz-Tor `check:botschaften-netz` vergleicht Ereignisse **je fga** |
| Historie-Shard | **unverändert** (0 Byte Zuwachs) | `public/normtext/historie/<KEY>.json` | bleibt Ein-Quellen-Artefakt; Deckel `historie/**` 11 MB (Ist 9,5) nur als Wächter in `check:entstehung` |
| Anker-Sidecars (nur Botschaften mit Ankern) | < 0,5 MB | `public/materialien/anker/<KEY>.json` | BBl-Datei **ohne `-N`**, URL nie konstruieren, aus `isExemplifiedByPrivate` (Host-Tausch) auflösen; sha + `Last-Modified`/`Content-Length`-HEAD-Alarm; HTML nie gespeichert; **in `istRisikoPfad()` und Paritäts-Ingest aufnehmen (Rot-Beweis)** |
| Parlament (385 Geschäfte) | ~2 KB je Geschäft extrahiert; Rohsätze (12–54 KB) nie gespeichert; **keine Namen, keine PersonNumber** | `public/materialien/curia/<NR>.json` + Zustandsträger `bibliothek/register/curia-zustand.jsonl` | ~6 Requests je Geschäft ⇒ ~2 300 je Lauf, ≤ 2/s ⇒ ~20 min ⇒ **Monatslauf in `normen-monitor.yml`**, nie Gate-Kette; `Modified` unbrauchbar ⇒ Vollabgleich; Decision-Codes als geprüfte Tabelle in `bibliothek/register/curia-decision-codes.md`, unbekannt ⇒ rot; `anker/**` und `curia/**` in `istRisikoPfad()` (`kern.ts`) und Paritäts-Ingest aufnehmen (Rot-Beweis; `public/normtext/**` und `public/materialien/*.json` sind dort schon erfasst) |
| Synopse-Alt-Blöcke (1142 Diff-Schritte ab 2021) | **3,8–4,9 MB** (nur Alt; alt+neu wäre 7,6–9,7, Band bis 17); OR ≈ 0,5 MB | Shard je Erlass, lädt erst beim Klick | Zitat §7 a–d: Stand, ELI der historischen Konsolidierung (Datum) als Live-Link, sha auf normalisiertem Text (Fussnoten-Offsets, Typographie, Soft-Hyphen raus; `<sup>` bleibt); cc-Manifestation stets kanonisch `-N` über `isExemplifiedBy` (Alias = Phantom); **Deckel 8 MB gesamt / 2 MB je Erlass, Ist-Wert im Tor-Output**; E5.0 misst 5–8 weitere Erlasse vor dem Bau; **Muster law.soufien.lu (Apache-2.0, Bibliothek `soufien-lex.md`):** Artikel-Identität über die amtlichen eIds statt Text-Diff zur Erkennung, Umnummerierung nur bei exaktem Text-Hash, Normalisierung **nur fürs Matching, nie für Hash/Speicherung**, zwei Prüfsummen (Bytes / kanonisches JSON), Wort-LCS mit Absatz-Eskalation (`web/src/diff.ts` portierbar); **Normalisierungsprofil versioniert und nie editiert** (`entstehung-norm/1` im Shard-Kopf, Verbesserung = `/2` daneben — sonst entwertet jede Parser-Korrektur rückwirkend alle Prüfsummen); **Ereignis-Schlüssel `datum + oc-ELI`**, nie Listenindex (122 Gleichtags-Fälle); Widerspruch Fussnoten-Ereignis ↔ beobachtete Textänderung wird als Zustand `validity_conflict` **angezeigt**, nie still aufgelöst |
| Entwurf/Beschluss-Diff | < 3 MB | wie Synopse | wie Synopse |

`check:entstehung` (offline, in `check:seriell`): (1) Deckel je Klasse mit Ist-Wert; (2) Anker-sha
gegen Manifest; (3) Curia-Zustandsträger ohne Verlust; (5) **Determinismus-Wächter** (Muster Lex/SFHAJJI,
Bibliothek `sfhajji-lex-dossier.md`): ändert sich ein Synopse-/Anker-Shard, ohne dass sich der Quell-Hash
der Fedlex-Manifestation geändert hat ⇒ rot — Parser-Drift darf nie als Gesetzesänderung erscheinen (§7 d);
(4) Diagnose-Tabelle **je Erlass**: Anteil der
Fussnoten-oc, die in der SPARQL-Änderungsliste vorkommen — Rot bei Rückgang gegenüber dem gebuchten
Stand je Erlass, der in `bibliothek/register/entstehung-deckung.json` lebt (je Erlass: Quote, Datum,
optional `grund`); Senkung ohne `grund` ⇒ rot (offline prüfbar, Kritik C11). Jede Zusicherung einmal rot
gezeigt (§6.7). `check:perf-budget` bleibt Wächter der
Erstlast (feste Liste; Shard-Ordner bewacht `check:entstehung`).

### §11.7 Etappen (Aufwand nach R5)

| E | Inhalt | Sessions | Risiko/Tore | Konflikte | Nutzer sieht |
|---|---|---|---|---|---|
| **E0** ✅ 6.9. | ROADMAP-Heimat, M15 absorbiert, M16-Datenanteil → SYNOPSE | — | `check:plan` | — | — |
| **E1** ✅ #792 (`71db836ca`) | Verfahrens-Ereignisse in der Botschaften-Query; Netz-Tor je fga, Mantelerlass als Rot-Beweis | 1–2 | Risikopfad ⇒ Gegenprüfung | keine | Zeitstrahl «Am Erlass» (ohne Parlament) |
| **E2** ✅ #792 (`71db836ca`) | Anker-Sidecars (Bonus); `check:entstehung` (1)(2)(4) + `entstehung-deckung.json`; `kern.ts`/Ingest um `anker/**` erweitert; Konsumenten-Messung `artikel-revisionen` ⇒ Rückbau-Entscheid. **Historie-Generator und -Shard unangetastet** | 2 | Risikopfad ⇒ Gegenprüfung; Golden unberührt | nie parallel zu E1 | Daten |
| **E3** ✅ #793 (`f0c82ab74`) | Karte in der Funktionszeile am Artikelende, Rubrik «Fassung» (§9 Z2 in `FAHRPLAN-DESIGN-IDENTITAET.md`); kein zweiter Slot (C5/C6 gegenstandslos, Sichtung 11.9.2026); Zuständen, Praxis-Nachladen; Rückrichtung am Material; Playwright: zu ⇒ 0 Fetch, CLS 0 (Deep-Link, 320 px), Tastatur | 3 | UI; Golden byte-gleich (Prerender ohne Slot-Markup), rot ⇒ Abbruch, nie Test-Update | **Wartebedingung erfüllt** (Sichtung 11.9.2026): alle neun slot-verlagernden W2·24-Branches sind auf `main` (PR #744–#761, geprüft gegen `git log origin/main`) | die Sicht |
| **E4** ✅ #792 (`71db836ca`) | Parlament: `Bill`→`Resolution`, `Preconsultation`, NR-Aggregat, `Objective`; Zustandsträger; Monatslauf; `curia/**` in `kern.ts`/Ingest; Decision-Code-Tabelle; UI-Block mit Quellenangabe | 3 | Extraktion ⇒ Gegenprüfung; Sprachmischung getestet; Personendaten-Regel als Tor (kein Namensfeld im Shard) | keine | Kommission, NR/SR-Kästen, NR-Zahl |
| **E5.0** ⏳ #794 (offen, Stand 11.9.2026 20:49 CEST) | Vor-Messung Synopse an 5–8 weiteren Erlassen (Volumen, Falschtreffer nach Normalisierung); **zwei Speicherformen messen:** Alt-Block je Diff-Schritt vs. distinkte Textzustände je eId + Gültigkeitsintervalle (Lex D53; Preis: Fassung wird im Browser zusammengesetzt) | 1 | Messung | keine | — |
| **E5** ⏳ #794 (offen, Stand 11.9.2026 20:49 CEST) | Synopse ab 2021 (nur Alt-Block), Shard je Erlass, Deckel; Gegenprobe jeder Block gegen sein Historie-Ereignis, Blöcke ohne Ereignis gelistet | 5–7 | Zitat §7 ⇒ Gegenprüfung; Golden | keine | zwei Spalten |
| **E6** ⏳ #794 (offen, Stand 11.9.2026 20:49 CEST) | Entwurf ↔ Beschluss (Label-Join, ≥ 2025) | 2 | wie E5 | keine | «im Entwurf so?» |
| **LESER-Synopse** ✅ #796 (`0a79eb68f`) | Griff «Alt/Neu ›» in der Funktionszeile neben «Warum?» (E3-Slot); Block-Ausrichtung über amtliche Etiketten + Wort-LCS, sieben ehrliche Zustände, Entwurf E6 als Wortlaut; nichts lädt vor dem Klick | 1 | UI; golden byte-gleich, e2e 1143 grün | dep E3 (Griff-Ort) + E5/E6 (Daten aus #794/#798) | «was stand vorher, was heute?» |
| später | Zeitreise-Umschalter je Erlass (F2, M16-UI; 57 künftige Stände liegen vor) · BGE → Botschaft · Wegleitungen BSV/BAG/BAZG/ESTV-VSt/WEKO · FINMA (§9/§10) | je eigen | — | — | — |
| nach Bund | Kantone BS (data.bs.ch), VS (lex.vs.ch), ZH nur Rohfeed — erst nach E1–E5 Bund | je eigen | — | — | — |

ROADMAP-Schnitt: **DATEN** = E1+E2+E4 (`feld: korpus`) · **LESER** = E3 (`feld: leser`, dep DATEN +
W2·24) · **SYNOPSE** = E5.0+E5+E6 (`feld: korpus`, dep DATEN). Reihenfolge: E1 → E2 → E4 → E3 (sobald
W2·24 gelandet) → E5.0 → E5 → E6. **SYNOPSE-LESER** (`W2·6c-ENTSTEHUNG-SYNOPSE-LESER`, `feld: leser`,
dep SYNOPSE+LESER) ist mit #796 erledigt (11.9.2026, §14-Intake), reiner Aufbau auf E3 — kein
eigener Buchstabe im Etappenplan.

### §11.8 Abgesagt oder verschoben nach Prüfung

Amtliches Bulletin je Artikel *(teilrevidiert 19.9.2026: AB-Fundstelle automatisch, Kurzzitat nur kuratiert — §12.6)* · Ständerats-Stimmen (nicht in Curia) · Namensabstimmungen je Ratsmitglied
und **jede Speicherung von Personendaten** (Namen, PersonNumber) · Berichterstatter als Datenfeld (nur
Link) · Referendum-Erkennung aus dem Graph · Erläuternde Berichte VO, Ergebnisberichte · Synopse aus
AS-Änderungserlassen (kein `<mod>`) · Synopse vor 2021, Botschaftsstelle vor 2025 · zweiter
Fussnoten-Parser · jede Änderung am Historie-Shard (`botschaftKey`, Kopf) und ein drittes Sidecar `botschaft-keys.json` (§5) · Point-in-time-Umschalter
(verschoben, F2) · ZH vor BS · Gemeindereglemente.

### §11.9 David-Entscheide (1–6 entschieden 11.9.2026, Mandat «führe alles durch»)

1. ~~**Go für E1+E2** (DATEN)~~ — **entschieden 11.9.2026: ja**, als Block der Gesetzesleser-Queue.
2. ~~**Personendaten-Regel** bestätigen: Voting nur aggregiert, keine Namen~~ — **entschieden
   11.9.2026: ja.**
3. ~~Ständerat ohne Stimmenzahl akzeptieren~~ — **entschieden 11.9.2026: ja.**
4. ~~Botschafts-Anker (22 %) als Bonus in E2 behalten oder streichen~~ — **entschieden 11.9.2026:
   behalten** (klein).
5. ~~Externe Abstimmungsresultate~~ — **entschieden 11.9.2026: erst Link.**
6. ~~Curia-Auflagen (Quellenangabe, Änderungsverbot, Abrufdatum, Beschriftung «eigene
   Auszählung»)~~ — **entschieden 11.9.2026: bestätigt.**
7. Fachliche Abnahme der Stufe-1-Dossiers steht seit Juli aus. **Bleibt bei David** — das Mandat
   11.9.2026 («führe alles durch») deckt Bau-/Prozessentscheide, nicht die fachlich-juristische
   Abnahme (CLAUDE.md §7/§8).

### §11.10 Korrektur-Log (Fassung 1 → 2 → 3 → 4 → 5)

| Runde | Befund (belegt) | Konsequenz |
|---|---|---|
| R1 | Kette Artikel→AS→BBl in den Sidecars; Teilmengen-Tor hält nicht; **G-HIST existiert**; ROADMAP M15 nannte die falsche Datei (Strip in `scripts/normtext/extrahiere-fedlex.ts:74,126-132`) | E2 ohne Parser; Diagnose statt Teilmenge; M15 absorbiert |
| R2 | HTML alter Stände erst ab 1.1.2021; 3,8–9,7 MB; kein `<mod>`; Alias-URL Phantom (cc); naiver Diff 36 % Falschtreffer; 57 künftige Stände | Synopse-Fenster, Normalisierung, nur Alt-Block |
| R3 | Anker 22 %, keine vor 16.4.2025; Mantel 32 %; `mod_uN` verrutscht | Botschaftsstelle = Bonus; E6 Label-Join |
| R4 | NR 2 Requests; SR ohne Einzelstimmen; `Resolution` via `Bill`; 385 Nrn.; `Modified` wertlos | E4 verkleinert; Vollabgleich; Monatslauf |
| R5 | Slot bestehend; `check:perf-budget` feste Liste; W2·24 kollidiert mit E3 | E3 wartet; Deckel im neuen Tor |
| Kritik A (20) / B (5) | siehe §11.0; **R1 §3c falsifiziert** (fga-Altformat 18 %) | Fassung 3 |
| Kritik Runde 2 (14) | Marginalie 150 px; kein Karten-Slot; 4/9 Branches ausserhalb des Sammelbranchs; Revisions-Sidecar trägt `botschaftKey` schon; Trailer offline unlesbar | Fassung 4: Chip unverändert, Historie-Shard unangetastet, kein drittes Sidecar, Deckungs-Register statt Trailer |
| Gemini | zwei Kernaussagen widerlegt | Messtabelle FAHRPLAN-FREMDAGENTEN §5 |
| **Sichtung 11.9.2026** | Alle neun W2·24-Branches sind seit 7.9.2026 auf `main` (PR #744–#761, geprüft gegen `git log origin/main`); D40 (#761) machte die Fassung zur Rubrik der Funktionszeile am Artikelende, der Marginalie-/Kopf-Slot entfiel ersatzlos | **Fassung 5: C5/C6 gegenstandslos** (kein zweiter Slot, kein 150-px-Platzproblem); E3-Wartebedingung erfüllt; §11.9 Nr. 1–6 entschieden (Mandat David 11.9.2026), Go erteilt |
| **Bau 11.9.2026** (Branch `feat/w26c-entstehung-synopse`, PR #794 — **Stand bei Redaktion dieser Zeile: offen, noch nicht gemergt**) | Gegenprüfungs-Auflage → Profil `entstehung-norm/2` (Prüfer-Stichprobe n=13 auf `ohne_ereignis`-Blöcken: 11/13 = 84,6 % unter der 90-%-Schwelle, zwei Fedlex-Konversionsartefakte; neue disjunkte Stichprobe n=13 nach /2: **13/13 = 100 %**); E6 deckt **10 statt 59** Vorlagen (nur ab BBl 2024 mit `type-projet/2` **und** `/300`); 63/1131 Stände ohne `-N`-Suffix, R2 §6d galt nur für die konstruierte Alias-URL — ersetzt durch eine Provenienz-Pfad-Prüfung | 4770 → 4659 Alt-Blöcke (111 Falschtreffer weniger), Deckel 82 % → 80 %; nächste Session: PR-Merge-Stand neu prüfen, diese Zeile bei Bedarf nachtragen |
| **Bau 12.9.2026** (Branch `fix/synopse-normalisierung-gemeinsam`, PR #798, Profil `entstehung-norm/3` → `/4`) | A1 gelöschter Nachlauftext zurück (`zerlegeBloecke`/`blockListBereiche` balanciert statt Regel (c), 4 echte KLV-12e-Kantonslisten-Änderungen wiederhergestellt); A2 Sachüberschriften als Titel-Paar `ueberschrift`/`ueberschriftNeu` (522 Blöcke, 33 ohne Wortlaut-Unterschied); A4 `art:'entfallen'` jetzt vom Leer-Diff-Wächter mitgeprüft; A5 zweiter Tor-Ast `phantomVerletzungen()` gegen wandernde Elementgrenzen — 10 Phantom-Änderungen weg (u. a. FDV 36 ×2, HMG 9/67), 330 Etiketten korrigiert (**Gegenprüfungs-Runde 2 unterlief dabei selbst ein Messfehler bei FDV/HMG, in Runde 3 korrigiert — Lehre: Vollerhebung statt Stichprobe bei Verlust-Fragen, der Prüfer-Extraktor kann selbst falsch liegen**); Vollerhebung (kein Sample) gegen `ba3e52470`: 0 echte Änderung verloren, drei Gegenprüfungs-Runden bestanden | 4641 Alt-Blöcke, 0 offene Leer-Diffs, 0 offene Phantom-Fälle, 11 befristete Ausnahmen (Fassung 4 löst Fassung 3 ab: CHEMRRV-Quelllücke und AVIV-Token-Lücke als zwei getrennte Ursachen erkannt); Folgeschritt `W2·6c-ENTSTEHUNG-QUELLLUECKE` löst die Ausnahmeliste ab, fällig vor Verfall 2026-10-12 |
| **K-16 BS 12.9.2026** (PR #799) | amtlicher Schlüssel Erlass↔Geschäft deckt nur **5 von 859** Korpus-Erlassen (8 Fussnoten-Referenzen); zwei maschinelle Wege (SG-Nummer, Erlassdatum+Titel) decken **25,7 %** der 136 adressierbaren Gesetze | 117 Register-Einträge, 122 Kanten (8 amtlich/114 maschinell), 409 Verfahrens-Ereignisse; Materialien-Register 332/400 KB gzip (83 %), Verfahrens-Ereignisse 85/100 KB (85 %) — Deckel-Reserve vor einem ZH-Schritt gleicher Grösse (R12b) knapp |
| **12.9.2026 #801 Quelllücke** (`W2·6c-ENTSTEHUNG-QUELLLUECKE`, Auflage A6 Gegenprüfung PR #798) | CHEMRRV (`cc/2005/478`): 22 Artikel stehen in den amtlichen Ständen 2022-05-01/2022-10-01 nur in einem Änderungsanhang (`quotedStructure`), nie als `<article>` — Generator buchte 22 «entfallen» + 24 «neu eingefügt», die es nie gab | 22 CHEMRRV-Blöcke neu `quelle_unvollstaendig` (lückenloser Lauf 1–3 Stände, byte-gleiche Rückkehr geprüft), Anhang-Beleg (`imAnhang`) als Pflicht-Feld statt Wortlaut; Lineage-Fix in `neuNach()` (`src/lib/entstehung/synopse-diff.ts`): entfallener Artikel hat kein «Neu», eine spätere eId ist eine neue Bestimmung; befristete Ausnahmeliste `entstehung-leerdiff-ausnahmen.json` **11 → 0** |
| **12.9.2026 #802 Register-Deckel** (`W2·13-KANTONE-DATEN`) | Materialien-Register stand bei 332/400 KB gzip (83 %) — ein ZH-Schritt in K-16-BS-Grösse hätte den Deckel gerissen; vier Feldgruppen (`sha`, Verfahrensketten, `bsKanten`, Join-Felder) + FR/IT-Titel gehen an jeden Browser, ohne dass eine Zeile sie liest | Register in drei Projektionen geteilt (Kern/i18n/Provenienz nach Nutzungszeitpunkt); Kern 118/280 KB (42 %), i18n 84/140 KB (60 %), Provenienz 93/240 KB (39 %), Verfahrens-Ereignisse 16/60 KB (27 %, jetzt alle Herkünfte); ZH-Prognose Kern 49 % |
| **12.9. #807 Deckungs-Seite + Ingest-Wächter** | Route `/materialien/deckung` + Projektion `deckungs-sicht.json` gebaut; stand zunächst in keiner Ingest-Liste (`check:paritaet` meldete «Materialien 3»); Ingest-Wächter `ungedeckteTopLevelJson()` (`scripts/datenhaltung/ingest.ts`) gebaut statt nur vorgeschlagen — fand beim ersten Lauf vier weitere, vorbestehende Lücken (`inkrafttreten.json`, `kanton-luecken.json`, `pdf-quellen.json`, `bezuege-bilanz.json`), viertes Vorkommen derselben Ingest-Lücke seit K-16/#802 | Materialien 3→4, Normtext-Seitendateien 4→7, Rechtsprechung-Manifeste 5→6, 9194 Dateien byte-gleich; **Lehre: feste Ingest-Listen brauchen einen Abgleich-Wächter**, kein Kommentar reicht (stand dreimal im Code) |


---

## §12 · Entstehung am Artikel — Stufe 4: Botschaftstext, Parlament je Artikel, Bulletin, Ursprung (Planung 15.9.2026)

**Auftrag:** David 15.9.2026 (Planungs-Session, kein Bau): «Ist geplant, den Text aus Botschaften
darzustellen?» → «Wäre das möglich? Wichtig ist die Datenherkunft, und dass diese optimal ist» →
«Endziel: alles, was die Schweiz an Behördeninformationen hat, auf LexMetrik abbilden und einfach
besser verlinken» → «Verankere alles; PDF-Extraktion vorher optimieren; Deep Research zum
Gesetzgebungsprozess einbauen.» Belege: `bibliothek/materialien/entstehung-2026-09-15/`
(drei Live-Recherchen, Count-Gate 407/407). Rahmen unverändert: CLAUDE.md §1, §2, §5, §7 a–d,
§8, §15; Leitprinzip 8 «verknüpfen statt kopieren» (ROADMAP.md, 15.9.2026).

### §12.1 Sollbild — was wir abbilden können und sollen

Drei Speicherklassen, je Quelle die niedrigste, die den Mehrwert trägt (Leitprinzip 8):

| Klasse | Inhalt | Bedingung | Beispiel |
|---|---|---|---|
| **Verweis** (Regel) | Titel · Datum · Behörde · amtlicher Link · Kanten zum Artikel | amtlich; Artikel-Anker vorhanden | Botschaften-Register (Paket 2), Parlaments-Etappen (E4) |
| **Zitat** (Ausnahme) | ein Textblock am Artikel | §7 a–d: Stand, Quelle-URL, Live-Link, Drift-Wächter; Block zeigt am Artikel, was der Link nicht kann | Synopse-Alt-Block (E5); **Erläuterung je Artikel aus der Botschaft (neu)** |
| **Korpus** (Sonderfall) | Volltext im eigenen Leser | unser Leser kann mehr als die Quelle | Gesetze; **nicht** Botschaften, **nicht** Bulletin |

Datenhaltung: ein DB-Artefakt als Wahrheit (§5), jede Quelle als Dokument mit `norm_referenzen`-
Kanten (FAHRPLAN-DATENHALTUNG §3.2, Nordstern «EIN Query über alle Doktypen»); `public/*.json`
sind Projektionen, je Erlass, laden erst beim Klick. Kein VPS nötig (statische Shards wie
`public/normtext/`), solange die Deckel je Klasse halten.

### §12.2 Quellen-Matrix (Recherche 15.9.2026, alles live belegt)

| Quelle | Herkunft | Höchste Stufe | Verlässlichkeit | Bericht |
|---|---|---|---|---|
| Botschaften ab 2022 (43) | Fedlex Filestore, `isExemplifiedBy` | Akoma-Ntoso-XML; Erläuterungs-Kapitel `<level eId="lvl_N">` in 43/43 | kapitelscharf deterministisch; artikelscharf strukturell 7/43, sonst `<p>Art. 5 Abs. 2</p>` = Textmuster | botschaften-formate.md §2a |
| Botschaften 2020/21 (54) | Fedlex DOCX | Absatzstil `TitelArtikelKomm` auf Artikel-Überschriften (8/9 gemessen) | sehr wahrscheinlich deterministisch; Rest-DOCX ungemessen | ebd. §2b |
| Botschaften 1999–2019 (~300) | Fedlex PDF/A (alle born-digital, einspaltig) | Kapitel via Zwei-Zeilen-Regel (11/13), Artikel-Überschriften kursiv/fett als eigene Zeile | gemessene Heuristik, kein Vertrag; Lesezeichen erst ab 2021 | ebd. §2b |
| Botschaften vor 1999 | Bundesarchiv (Scans) | — | nicht deterministisch (§2) ⇒ Live-Link | ebd. §5 |
| Kommissionsberichte, Stellungnahmen BR | Fedlex (BBl), Verfahrens-Codes 301/201 vorhanden; Dokumenttyp-Codes **nicht inventarisiert** | vermutlich wie Botschaften | Art. 111 Abs. 3 ParlG: gleicher Pflichtinhalt ⇒ gleiches Schema | gesetzgebungsverfahren-bund.md §1/§2 |
| Erläuternde Berichte, Vorentwurf, Ergebnisbericht | Fedlex Vernehmlassungen (Verfahren erfasst, Dokumente **nicht**) | PDF | Art. 6a VlG: gleicher Pflichtinhalt; Weg ungeprüft | ebd. §1 (2b–2e) |
| NR-Abstimmungen je Artikel | Curia Vista `Vote` (`RegistrationNumber` ← `Transcript.VoteId`) | `Subject` = Artikel, `MeaningYes/No` = Antragsseiten | strukturiert, 181/188 | bulletin-vote-ursprung.md |
| Bulletin-Voten BR/Kommission | Curia Vista `Transcript` (`CouncilName`, `Function eq '*'`) | Rolle deterministisch; Artikel per Text ~81 %/50 % | Metadaten + Deep-Link; kein Redetext | ebd. |
| SR-Stimmenzahlen | `Transcript.Text` («… 25 Stimmen») | Freitext | Textmuster, ausgewiesen | ebd. §3 Bsp. 3 |
| Vehikel der Vorlage | Curia Vista `BusinessType` (15 Werte) | strukturiert | deterministisch; keine Kategorie Volksinitiative | ebd. §6 |
| Auslöser (Motion/Postulat) | `Business.InitialSituation` (Prosa); `RelatedBusiness` leer | Freitext | nur Hinweis, nie Behauptung (korpusweit 3 wörtliche Treffer) | ebd. §6 |

### §12.3 Etappen (Roadmap-Schritte `W2·6d-*`; Reihenfolge = `@queue`)

**Dach seit 24.9.2026: `W2·6d-ENTSTEHUNG`** — die sieben Schritte der Spalte «Schritt» sind darin
aufgegangen und stehen in `ROADMAP.md` als Etappen-Zeilen `EA0` … `EA9`; die Reihenfolge trägt
seither das Dach, nicht mehr die `@queue`. Wortlaut: ROADMAP-CHRONIK.md, Fusionen 2026-09-24.

| Etappe | Schritt | Ziel | Harte Auflagen | Phase |
|---|---|---|---|---|
| 0 | `W2·6d-VERFAHREN-RECHERCHE` | Deep Research Gesetzgebungsprozess Bund (später Kantone): Verfahrensmodell aus amtlichen Quellen (BV, ParlG, VlG, PublG, RVOV, BJ-Gesetzgebungsleitfaden), je Schritt Norm · Akteur · Dokument · Publikationsort · Datenspur (Fedlex-Code / Curia-Entität / nur Prosa); Vorlage = `entstehung-2026-09-15/gesetzgebungsverfahren-bund.md` (Entwurf) | nur amtliche Quellen (§7), Gegenprüfung durch zweites Modell, Ablage `bibliothek/` + INDEX; fachliche Abnahme David `[D]` nach Zeitsperre — der Bau der Daten-Etappen hängt NICHT daran | 2 |
| 1 | K-7 (FAHRPLAN-KANTONE) erweitert um **PDF-Kern** | gemeinsamer Leser aus `adapter-pdf.ts` + `adapter-zh-pdf.ts` (Geometrie, Kopf/Fuss, Silbentrennung); Dehyphenations-Tor mit Rot-Beweis; Messgeschirr Fehlerrate je Profil gegen Handauszählung; Werkzeugvergleich pdfjs ↔ PyMuPDF an den 13 Botschaften-PDF (Vormessung, kein Entscheid) | Refactoring §6: Golden byte-gleich; mitnehmen: Ziffern-Tarife (ROADMAP Z. «PDF-Pfad liest Ziffern-Tarife falsch»), Fassungs-Drift PDF-Snapshots, rectifies doc/pdf-a | 2 |
| 2 | `W2·6d-PARLAMENT-ARTIKEL` | NR-Abstimmungen je Artikel aus `Vote` (Artikel, Antragsseiten ohne Namen, Ergebnis, Datum, Rat, Lesung) → Chip «im Rat umstritten» am Artikel; Vehikel der Vorlage (`BusinessType`) als Zeile im Verfahrens-Block | Personendaten: `MeaningYes/No` ohne Namensteil speichern («Antrag der Minderheit»), Name bleibt im Deep-Link; Auflagen Parlamentsdienste (Quelle, unverändert, Abrufdatum, kein amtlicher Eindruck) am Block; Monatslauf wie E4, `curia/**` bleibt Risikopfad; Blockberatung «Art. 3-11» = n Kanten, nie stumm eine | 2 |
| 3 | `W2·6d-BOTSCHAFT-TEXT` Stufe A | XML ab 2022 + DOCX 2020/21: Erläuterungs-Kapitel je Erlass (Mantel: Eltern-`level`), Artikel-Block als §7-Zitat am Artikel; artikelscharf nur wo strukturell (`<article>`/Heading «Artikel N»/Stil `TitelArtikelKomm`), sonst Kapitel-Block mit «maschinell zugeordnet» | Erläuterung an die **Fassung** binden, die aus dieser Botschaft hervorging (dep E5/E6; Entwurf≠Beschluss≠heute, 7/41 verrutscht) + Hinweis «seither geändert»; Drift `If-Modified-Since`/`Content-Length`, URLs nur aus `isExemplifiedBy`, Soft-404-Sonde; Deckel je Erlass + gesamt vor dem Bau messen; FR/IT erst nach DE-Messung; nichts vor 1999 | 3 |
| 4 | `W2·6d-BOTSCHAFT-TEXT` Stufe B | PDF/A 1999–2019 auf dem PDF-Kern: kapitelscharf (Zwei-Zeilen-Regel, erster Treffer, Anhang-Sperre), Sprung auf BBl-Seite; Artikel-Überschriften nur als «maschinell» | dep Etappe 1; Fehlerrate gemessen und im Tor-Output; Kapitel ohne Treffer ⇒ Live-Link, nie raten | 3 |
| 5 | `W2·6d-BOTSCHAFT-TEXT` Stufe C | Kommissionsberichte (Pa.Iv.) + Stellungnahmen BR mit demselben Schema; vorher Fedlex-Dokumenttyp-Codes inventarisieren (heute nur 23 = Botschaft); Titelmuster «Zusatzbotschaft» (Code 200 geteilt) | wie A/B | 3 |
| 6 | `W2·6d-BULLETIN-VOTEN` | Voten Bundesrat/Berichterstatter je Traktandum als Metadaten (Funktion, Rat, Datum, Lesung) + Deep-Link `?SubjectId=`; Artikel-Zuordnung «maschinell» mit Präzision/Recall im Tor; SR-Stimmenzahlen aus Text; **kein Redetext gespeichert** | Name nie (auch nicht im Fliesstext-Auszug); Auflagen wie Etappe 2; Lesungs-/Datumskontext Pflicht (Differenzbereinigung); Epochen-Markup (2006 ohne `[GZ]`) im Messgeschirr | 3 |
| 7 | `W2·6d-VERNEHMLASSUNG-DOKUMENTE` | Vorentwurf, Erläuternder Bericht, Ergebnisbericht als Verweise am Verfahren (Vernehmlassungs-Generator erfasst heute nur Status); für Verordnungen die einzige Entstehungsquelle | Weg zuerst erheben (Fedlex-Vernehmlassungs-Endpunkt vs. Departements-Websites); nur Verweis-Klasse | 3 |
| 8 | `W2·6d-URSPRUNG` | Ursprung je Bestimmung: «im Bundesratsentwurf enthalten» vs. «vom Parlament eingefügt (Kommission SR/NR)», auch vor 2021; Kante «Botschaft zu anderem Geschäft als Material» (z. B. Volksinitiative/Gegenvorschlag) | §12.6 Schicht 1; Weg zuerst messen (Entwurf im BBl ↔ Beschluss), wo nicht deterministisch ⇒ nur über Etappe 9, nie raten | 3 |
| 9 | `W2·6d-ENTSTEHUNGSNOTIZ` | kuratierte Entstehungsnotiz am Artikel: Fakten mit Fundstelle (BBl, AB) + wörtliche Kurzzitate aus dem Bulletin, verfasst/freigegeben von David; Referenzfall Art. 90 Abs. 3/4 SVG | §12.6 Schichten 2–3; erster redaktioneller Inhalt ⇒ Abgrenzung «nur Entstehungsfakten, keine Auslegung»; Status entwurf/geprüft (§8) | 3 |

**Nicht-Ziele (15.9.2026):** Bulletin-Volltext (≈ 370 MB; kollidiert mit «nicht verändern») · Auslöser
«geht auf Motion X zurück» als Behauptung (nur Hinweis mit Quelle `InitialSituation`) · Botschaften
vor 1999 · Reden einzelner Ratsmitglieder · jede Speicherung von Namen/`PersonNumber` · Volltextsuche
über Botschaften/Debatten (parlament.ch/Fedlex können das).

### §12.4 Offene Entscheide

1. **Rangfolge der Materialien in der Oberfläche** (Botschaft > Kommissionsbericht > Votum
   Bundesrat/Berichterstatter > Abstimmung; Einzelvoten gar nicht) — Fachfrage `[D]`, nach der
   Zeitsperre; Daten-Etappen hängen nicht daran.
2. **Personendaten-Präzisierung** (Empfehlung 15.9.2026, David: «einverstanden» zum Gesamtvorschlag;
   bei Baubeginn von Etappe 2 einmal bestätigen): Funktion und Rat speichern, Name nie; amtliche
   Antragsnamen ohne Namensteil; Name nur über den Deep-Link.
   **Präzisiert David 19.9.2026** («beide empfehlungen übernehmen»): Namen von **Bundesratsmitgliedern
   in amtlicher Funktion** und die Funktion «Berichterstatter/in Kommission» dürfen erscheinen;
   einzelne Parlamentsmitglieder weiterhin nie (§12.6).
3. **Phase-Zuordnung:** Etappen 0–2 in Phase 2 (nützen den Kantonen: PDF-Kern hebt die Sperre für
   FR/VS/AR), Etappen 3–7 in Phase 3 «Mehr als Fedlex»; kein Schritt braucht den VPS.

### §12.6 Ergänzung 19.9.2026 — Entstehung am Artikel in drei Schichten (Referenzfall Art. 90 Abs. 3/4 SVG)

**Auftrag:** David 19.9.2026 zeigt eine Folie «Genese von SVG 90 III und IV» und fragt: «ich hätte gern
auch diese infos am arikel. ist das möglich?» → Vorschlag drei Schichten → «ja, so aufnehmen, beide
empfehlungen übernehmen».

**Befund am Referenzfall** (Plan-Stand 15.9. vs. Folie): (a) Abs. 3/4 stand nicht im BR-Entwurf (BBl 2010
8551) ⇒ Etappe 3 «Botschaftstext» liefert nichts bzw. hängt die Via-sicura-Botschaft fälschlich an; Synopse
Entwurf↔Beschluss erst ab 2021; (b) Hauptquelle ist das Bulletin (AB 2011 S 678 f., AB 2011 N 2151 f.),
Etappe 6 lieferte nur Deep-Link ohne zitierfähige Fundstelle; (c) die Botschaft zur Raser-Initiative
vom 9.5.2012 (BBl 2012 5487) ist Material zu Via sicura, gehört aber zu einem anderen Geschäft;
(d) SR 2011 ohne elektronische Abstimmung ⇒ kein «im Rat umstritten». Datenlage gemessen 19.9.2026:
Curia-Shard `public/materialien/curia/10.092.json` und `BOTSCHAFT-2010-1610` am SVG vorhanden;
Raser-Initiative nicht im Register.

| Schicht | Inhalt | Quelle / Verfahren | Schritt |
|---|---|---|---|
| 1 automatisch | Ursprung (BR-Entwurf vs. Parlament/Kommission) · Beschlüsse je Rat · **AB-Fundstelle im Zitierformat «AB Jahr S/N Seite»** mit Link · Kante «Botschaft zu anderem Geschäft als Material» | Fedlex + Curia Vista; ob `Transcript` die AB-Seite trägt, vor Bau messen | Etappe 6 (Fundstelle) + Etappe 8 |
| 2 kuratiert | kurze Notiz je Artikel mit Fundstellen (z. B. «unter weitgehender Übernahme des Texts der Raser-Initiative») | von David verfasst oder freigegeben; Status entwurf/geprüft | Etappe 9 |
| 3 Kurzzitat | wörtlicher Auszug aus dem Bulletin (ein Satz, als Zitat gekennzeichnet, Fundstelle + Link) | nur innerhalb Schicht 2, nie maschinell ausgeschnitten; §7 a–d (Bulletin unveränderlich ⇒ Drift-Wächter trivial) | Etappe 9 |

**David-Entscheide 19.9.2026:** (1) Namen von Bundesratsmitgliedern in amtlicher Funktion und die
Funktion «Berichterstatter/in» zulässig, einzelne Parlamentsmitglieder nie (§12.4 Ziff. 2);
(2) wörtliche Kurzzitate ja, aber nur kuratiert (Schicht 2/3), nie maschinell.

**Abgrenzung (Pflicht vor Bau Etappe 9):** Schicht 2 ist der erste redaktionelle Inhalt von LexMetrik —
zulässig sind nur Entstehungsfakten mit amtlicher Fundstelle, keine Auslegung und keine Wertung
(Leitbild: keine Kommentare); Eingabeformat und Abgrenzung legt der Bau vor, David bestätigt.

**Referenzfall (Soll, Folie David 19.9.2026):** BR-Entwurf Via sicura ohne Abs. 3/4 (BBl 2010 8551) ⇒ in der
Botschaft nicht erläutert · angenommener Antrag der Kommission SR, weitgehend Text der Raser-Initiative
(AB 2011 S 678 f.) · NR stimmt zu (AB 2011 N 2151 f.) · BR Leuthard im NR: «vorsätzliche
Verkehrsregelverletzung», ohne Stellungnahme zur Vorsätzlichkeit der Gefährdung · Botschaft 9.5.2012
(BBl 2012 5487, Materialien zu Via sicura): Ablehnung der Raser-Initiative, weil weitgehend umgesetzt.
Schicht 1 muss Fundstellen und Ursprung treffen; der Rest ist Schicht 2/3. Fundstellen vor Übernahme
gegen die amtliche Quelle prüfen (§7).

### §12.5 Werkzeug-Fallen aus der Recherche (Lehren, Formregel Skill `lehren`)

- Host-Tausch `isExemplifiedByPrivate` → öffentlicher Host (E2-Muster) trägt bei fga-`doc` vor 2017
  NICHT (Casemates-Shell) — nur `isExemplifiedBy` nehmen; Skill `scraping-swiss-official-sources`
  recipes nachgeführt 15.9.2026.
- `Transcript.VoteId` ≠ `Vote.ID`; Join über `Vote.RegistrationNumber`, String-Vergleich.
- `lese-schutz.py` blockt PDF > 200 KB auch im Scratchpad und verweist nur auf `zeige`/`golden:diff`
  — Hinweis «Text vorher extrahieren (PyMuPDF), dann gezielt lesen» fehlt (Hook-Edits blockt der
  Klassifizierer; Zeile im Fehlerbuch-Dach `W2·18-FEHLERBUCH`).

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md`](../archiv/fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- §1 · Scope-Entscheid
- §2 · Datenmodell (`daten/soft-law.db` lokal + committeter Zustandsträger, Weiche C präzisiert)
- §3 · Adapter (browserlos, §7 Build-Regel 5/6)
- §4 · Tore
- §5 · UI-Andocken (minimales Delta, Sequenz-Gate)
- §6 · Etappierung + Aufwand (ehrlich, §0/B9), je PR mit Toren
- §7 · Bewusst NICHT (Stufe 1)
- §8 · Offener Punkt für David (genau EINER)
- §9 · Stufe 2 — FINMA prioritär (`W2·6b-MAT-FINMA`, §14-Intake 24.7.2026)
