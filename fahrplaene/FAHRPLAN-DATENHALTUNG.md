# FAHRPLAN-DATENHALTUNG — DB als die EINE Wahrheit, Projektion, Massen-Korpus, Edge-Suche
<!-- @lagebild name: Eigene Datenbank / Server · zweck: Fundament für Selbst-Hosting und «DB = die eine Wahrheit». -->

> **Rolle (§14):** Detailquelle zu `ROADMAP.md` → Querschnitt **QS-DATA** + Bau-Schritt
> **W2·6-DATA**. Nie zweiter Einstieg. **Council-Entscheid 2.7.2026** (Richtung entschieden,
> nicht mehr offen); löst die drei „DAVID-ENTSCHEID"-Punkte aus `PLAN-OCL-ABBAU.md`
> (§AUSFÜHRUNGS-STAND + §OFFENE PUNKTE: Zitations-Graph 8,7M · Parquet als Volltext-Quelle ·
> Breiten-Korpus) auf. Fable plant, Opus baut. Trailer `Roadmap: QS-DATA`.

## §0 · Zweck

Detailquelle zu `QS-DATA`/`W2·6-DATA` — die DB als die EINE Wahrheit, Projektion,
Massen-Korpus, Edge-Suche. Nie zweiter Einstieg. Die bindenden Richtungs-
Entscheide (SSoT, Andockpunkt, Quellen) stehen im nachfolgenden Abschnitt
«0. Entschiedene Richtung».

## §13 · ROADMAP-Spec QS-DATA (wörtlich verschoben 31.7.2026)

> **STAND 3.8.2026 — Geltungsbereich verengt (Bauplan-QS).** `QS-DATA` trägt seit 3.8.2026 **nur
> noch das David-Gate** «VPS-Bestellung → E3-Serving + E4-UI-Panels». Der gesamte Datenhaltungs-Bau
> — DB-Artefakt als eine Quelle, Etappen E0–E6b, Datenhaltungs-Optimierung — liegt in **`W2·6-DATA`**
> (§14). Der Wortlaut unten stammt aus der Zeit davor und beschreibt beides; wo er «Bau-Strang =
> W2·6-DATA» und «Serving-Bau bleibt QS-DATA» nebeneinander sagt, gilt die Verengung von heute.
> Anlass: derselbe Umfang stand an drei Stellen (QS-DATA · W2·6-DATA · QS-BASIS (d)).

> **→ Bau-Spec: «4. Tore», «5. Etappen» und «12. Datenhaltungs-Optimierung» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  Für die Korpus-Inhalte (Normtext · Rechtsprechung · Materialien) wird ein **generator-erzeugtes
  DB-Artefakt die EINE Wahrheit (§5)**; `public/*.json` + prerenderte Seiten sind fortan
  **byte-gleiche Projektion** daraus — nie parallel gepflegt. Amtlicher Arbiter bleiben
  Fedlex/bger.ch (§7 a–d je Zeile); voilaj/swiss-caselaw (CC0) wird KONSUMIERT, nie gescrapt
  (Scraper-Verdikt `FAHRPLAN-OPENCASELAW-QUELLEN.md`). Zwei Dauer-Tore: **`check:paritaet`**
  (Projektion byte-gleich gegen den bisherigen Generator-Output) + **Drift-Tor** (DB-Manifest
  sha/Zeilenzahlen vs. committete Projektion; bestehende `check:*-netz` bleiben Quellen-Arbiter).
  Kuratiertes Schaufenster bleibt prerendert (§15); Long-Tail on-demand inhaltsvollständig (§15 Regel 6).
  Bau-Strang = **W2·6-DATA**; Detailquelle **`FAHRPLAN-DATENHALTUNG.md`**. **Stand 3.7.2026: E0/E0+/E1/E1-Rest-A + E2-Vorarbeiten durch** — **E2 offen NUR: Turso-Hot-Daten laden/synchronisieren [David-Handschritt; Prod-Edge liefert aktuell 200-leer] → dann perf-budget/Payload-Grenz-Test greifen**. **§11.2 Leitfälle-Chips (3.7.2026): das tote `proNormArtikel`-Modell ist verdrahtet; Weiche-B-Masse-Anteil «+n weitere (online)» offen bis E2-live.** Details am Schritt W2·6-DATA. Trailer `Roadmap: W2·6-DATA`.
  **Sync-Transport + Frische-Wächter repariert 20.7.2026 — E2 betriebsfest** (Mehrzeilen-INSERT in
  BEGIN/COMMIT über den Hrana-`baton`, 33 → 1429 Zeilen/s, Schatten-Tabellen mit atomarem Tausch,
  neues vierfaches Tor **`check:turso-frische`**). Detail: `ROADMAP-CHRONIK.md` → QS-DATA.
  HOT-Artefakte (lokal gebaute FTS-DBs, das Budget-Mass aus `build.ts`) **651.99 MiB / 1024 MiB (63.7 %)** — Treiber ist die
  `eintrag`-Tabelle der rechtsprechung.db (465.93 MiB). **Gekoppelter Folgeschritt:** der
  Quell-Riegel hasht via `manifestDb()` die ganze DB (~1.9 GiB Spitzen-Heap, Reserve 2.3× zum
  4288-MiB-Limit); auf die vier geprüften Tabellen einschränken, sobald der Entscheid-Korpus
  sich verdoppelt, die Heap-Reserve unter 1.5× fällt ODER das 1-GB-Budget reisst — gleicher
  Treiber, darum gemeinsam prüfen. Doku-Korrektur in `fts.ts`/`turso-sync.ts`:
  die «342 kuratierten Schaufenster-Entscheide» waren seit langem falsch — der Code filtert nicht,
  es sind alle `eintrag`-Zeilen (Stand 5093).
  **🔒 BLOCKER: VPS-Bestellung (David, ~15 Min) — entsperrt E3-Serving (195 342 Entscheide, cold-FTS 58-GB-Klasse) + E4-Zitatgraph + VZUI-V2 «Zitiert-von».** Bestell-Dossier mit 3 live-verifizierten Angeboten (17.7.2026, Empfehlung **netcup RS 4000 G12 · 32 GB/1 TB NVMe · ~€40/Mt**) + Setup-Plan + Schritt-für-Schritt-Anleitung: **`bibliothek/betrieb/vps-bestell-dossier-2026-07-17.md`** (QS-BASIS B-5). Serving-Bau bleibt QS-DATA. Synergie: derselbe VPS = Backup-Zweitziel (QS-BASIS B-2) + Fassungs-Archiv (B-9).

---

## §14 · ROADMAP-Spec W2·6-DATA (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «5. Etappen (jede mit Tor; nie Big-Bang)» und «10. Entscheide» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

      Andockpunkt **eine Schicht UNTER dem heutigen Generator** — die bestehenden Adapter befüllen
      ein libSQL/SQLite-Artefakt, `public/*.json` + Prerender werden Projektion (Tor `check:paritaet`,
      §7 Build-Regel 6). Etappen (Detail `FAHRPLAN-DATENHALTUNG.md`): **E0** Fundament/Reverse-
      Befüllung+Parität → **E1** Generator-Flip → **E2** Edge-Suche-POC (alle BGE + alle Bund-Gesetze)
      → **E3** BGer-Massen-Import (voilaj-Konsum; **HÄLT den 26×-Slot seit 3.7.2026** — Reihenfolge ENTSCHIEDEN:
      E3 zuerst, W3·12 danach, David 2.7., `FAHRPLAN-DATENHALTUNG.md` §10(1)) → **E4** Zitat-Graph → **E5** Kanton-Rechtsprechung (26×, Slot-Kette #4) → **E6a**
      Verwaltungsverordnungen (Kreisschreiben — Bund-Strang, kein Slot; Nordstern-Doktyp) → **E6b**
      Materialien-Vollausbau (Detail `FAHRPLAN-DATENHALTUNG.md` §5). E0–E2 golden-neutral zu den Gesetzen; jede Projektions-
      Änderung golden byte-gleich (§6) + `QS-GP`; OCL-Pakete W12 (Bulk-Parquet) + F2 gehen hier auf. **E0 ✅ 2.7. (PR #80/81, check:paritaet in der Gate-Kette) · E0+ ✅ 3.7. (Ziel-Schema §3, Partitionierung je Doktyp, Parität 1796 Dateien) · E1 (Generator-Flip Bund + Tor `check:datenhaltung`) ✅ 3.7. · E2 (Edge-Suche `api/suche.ts` + Turso; Sync-Timeout-Wurzel behoben 20.7., PR #313) ✅ · E3 (`rechtsprechung.db`, 488 MB) ✅** — Wortlaut/Beweise → `ROADMAP-CHRONIK.md` → W2·6-DATA (22.7.2026). **VORBEHALT:** alter Direktpfad bleibt Wächter (Entfernen = eigener §6-Schritt); Kanton/Rechtsprechung/Materialien noch Blob-Weg. **Weichen entschieden 3.7.:** Kontext-Auslieferung = Hybrid (Shards+Edge, §10(6)/§11.5) · Massen-Rebuild = Voll-Rebuild (§10(7)). **Klarstellung Leitprinzip 4:** Reverse-Ingest committeter Daten öffnet KEINEN 26×-Slot.
      **Korrektur 20.7.2026 (§8 — die alte Zeile «Nächstes: E4 — hält den 26×-Slot» war doppelt falsch):**
      **E4 ist seit 3.7.2026 LOKAL FERTIG** (`FAHRPLAN-DATENHALTUNG.md` §5/E4, Bericht
      `bibliothek/register/e4-lokal-2026-07-03.md`, Oracle-Tor grün, 0 UNERKLÄRT) — E0/E0+/E1/E2/E3/E4 sind
      damit alle gebaut. Und der Schritt **hält den 26×-Slot nicht mehr** (am 20.7. an `W3·12` übergeben, s.
      `@slot-kette`). **Was wirklich offen ist, zerfällt in zwei Klassen:** (i) **VPS-gebunden**
      (David-Gate `vps-bestellung-david`): E3-Serving (rsync + cold-FTS `fts_entscheide_masse`, 58-GB-Klasse,
      Read-API, Long-Tail-Route `/rechtsprechung/:key`) und die E4-UI-Panels · (ii) **frei baubar, ohne VPS:**
      die **Datenhaltungs-Optimierung** (§14-Intake David 20.7., verortet in `QS-BASIS` (d), Bau-Strang hier —
      inkrementeller Sync · contentless-FTS · Index-Strategie · **Heiss/Kalt-Grenze = DAVID-GATE**, s. unten).
      Nachgelagert bleiben **E5** (Kanton-Rechtsprechung, 26× — braucht den Slot zurück) und E6a/E6b.
      **Heiss/Kalt-Grenze als DAVID-GATE (§8-Frage, nicht technisch entscheidbar):** 195 000 Massen-Entscheide
      passen **nie** in die 1-GB-Turso-Replika (Budget-Ist 20.7.: 652/1024 MiB bei 5093 kuratierten Entscheiden).
      Es muss darum entschieden werden, **was die Suche behaupten darf**, wenn der Long-Tail kalt liegt:
      schweigen, «nur kuratierter Korpus durchsucht» ausweisen, oder kalt nachladen mit spürbarer Latenz.
      Ein stiller Teiltreffer wäre der Fehler aus PR #313 in neuer Form (dort servierte `api/suche` einen halben
      Index, **ohne je rot zu werden**). Entscheid gehört David; bis dahin nicht implementieren.

---


---

## §16 · Suche-Edge-Umzug Kanton — QS-BASIS (d), Etappen K0–K5 *(31.8.2026)*

Umsetzung der Datenhaltungs-Optimierung aus «12. Datenhaltungs-Optimierung»
(archiviert, s. unten) für den Such-Pfad. Bau auf `feat/qs-basis-suche-edge`,
Basis `f283f5cb4`. **Merge gesperrt bis zur Gegenprüfung** (Risikopfad
`scripts/datenhaltung`).

> **Spec-Zugriff korrigiert (31.8.2026).** Der Bau-Auftrag verwies auf «5. Etappen»
> und «10. Entscheide» *dieser* Datei. Beide Abschnitte liegen seit dem
> Plan-Neuschnitt 29.8.2026 in `archiv/fahrplaene/FAHRPLAN-DATENHALTUNG.md`; die
> lebende Datei trägt nur noch §0/§13/§14. Der Verweis war also nicht falsch, aber
> nicht mehr auflösbar — hier festgehalten, damit die nächste Session nicht
> dieselbe Suche fährt. Massgeblich waren: Archiv «12.1 Vier technische Posten»
> (contentless-FTS, Index-Strategie) und «10 (7) Weiche C: Voll-Rebuild».

**K0 Nullprobe.** Kennzahlen vor dem Umbau eingefroren →
`bibliothek/register/suche-edge-nullprobe-2026-08-31.md`. Kernzahl für jede
spätere Entscheidung: **Kanton = 4.26 MiB gzip = 45.2 %** des statischen
Suchindex.

**K1 Recall-Parität.** `fts_artikel` indexierte nur `bloeckeText` — die fünf
Recall-Felder des statischen Index (m/n/g/tb/f, 21.5 % des Rohtextes) hatten am
Edge kein Gegenstück. Der Fehler war STILL: die Antwort war nie leer, nur
schlechter (Query «Miete» → OR 253 und OR 267 mit **null** Treffern, während zehn
kantonale Gebührenerlasse die Liste anführten). Jetzt sechs FTS-Spalten, gespeist
aus der geteilten Extraktion `scripts/suche-felder.ts` (§5); Struktur-Sidecar lag
bereits als `dokument`-Blob in der DB. Nebenbei: `fts_artikel` liegt lokal wie
remote **contentless** — die alte `content='artikel'`-Deklaration behauptete eine
Spalte, die es nie gab (`SELECT count(*)` ohne MATCH scheitert deshalb heute
schon). Das ist Posten (b) aus Archiv-§12.1. Kosten: HOT-Replika 665.46 → 671.00
MiB (+0.8 %, Budget 1024).

**K2 Ranking-Parität — Entscheid.** Der Auftrag empfahl, `artikelRanking`
clientseitig auf die Edge-Zeilen anzuwenden. **Verworfen, weil gemessen
untauglich:** nach K1 lag OR 253 bei «Miete» auf bm25-Rang 128 von 165, ZGB 641
bei «Eigentum» auf 466 von 658. Ein Client-Re-Ranking sortiert nur das
zurückgegebene Fenster (max. 50) — es rettet keinen Kandidaten, den die Abfrage
nie geliefert hat. Die dreistufige topische Ordnung liegt darum IM SQL-Kern, wo
sie über die ganze Treffermenge wirkt. Ergebnis: 8/8 Fälle des S4-Testsets im
erlaubten Rang. **Preis, bewusst gezahlt:** die Rang-Politik steht jetzt zweimal
(SQL + TypeScript) — nicht auflösbar, weil `suche-kern.ts` die Null-Import-Regel
für `api/**` trägt und es keinen Produktiv-Import `scripts/ → src/` gibt. Die
Doppelung ist bewacht statt versteckt (`scripts/datenhaltung/suche-rang.test.ts`
vergleicht beide `KERNERLASSE`-Listen und misst beide Wege am gleichen Testset).

**K3 vorbereitet, NICHT scharf.** `SUCHE_INDEX_EBENEN` baut auf Wunsch einen
Bund-only-Index (−4.26 MiB gzip); Default AUS, `artikel.json` byte-gleich
(sha256 `c2a98aea…` vor und nach dem gesamten Schritt). Mitgefundener Defekt
behoben: der Client hängte eine Ebene auch ohne Einträge als «bereit» ein —
`fehlendeEbenen` wäre leer geblieben und die Oberfläche hätte Vollständigkeit
behauptet. **Scharfschaltung ist ein David-Entscheid** (§8), Restliste im
Bau-Bericht.

**K4 NICHT gebaut** — `scripts/check-perf-budget.ts` ist Top-Level und liegt bei
einer Parallel-Session. Zieltext als Übergabe im Bau-Bericht.

**K5 Nachführ-Kette.** `npm run datenhaltung:nachfuehren` fährt build → manifest →
turso-sync → check:turso-frische in Reihenfolge, bricht beim ersten Fehlschlag ab
(ein Sync auf eine halb gebaute DB stellte sonst einen falschen Index live) und
überspringt die Turso-Hälfte ohne Token **laut und namentlich**. Seit K1/K2 ist
eine veraltete Replika keine Verzögerung mehr, sondern eine falsche Auskunft.

**K6 Fix-Runde nach der Gegenprüfung (31.8.2026).** Fünf Vollständigkeits-Befunde,
alle an der Wurzel behoben, jeder mit Rot-Beweis.

**F1 (HOCH) — die Landung hätte die Live-Suche gebrochen.** `api/suche.ts` schickt
seit K2 spalten-gefilterte MATCH-Ausdrücke; gegen die alte Ein-Spalten-Replika
antwortet SQLite `no such column: marginalie`, die Funktion macht daraus **502 auf
jede Artikel-Query**. Kein Riegel griff: `turso-sync.yml` triggerte nur auf
`public/normtext/**`, `public/rechtsprechung/**`, `daten-manifest.json` — dieser Diff
berührt keines davon —, und `check-turso-frische.ts` verglich nur Zeilenzahlen,
rowid-Spannweite und `manifest_sha`, also lauter Grössen, die eine reine FORM-Änderung
unverändert lässt. Zwei unabhängige Wurzel-Fixe: (a) `paths` um
`scripts/datenhaltung/**`, `scripts/suche-felder.ts`, `api/suche.ts` und die
Workflow-Datei erweitert; (b) neue Dimension 0 im Frische-Wächter — DDL-Vergleich
gegen `ddlFtsArtikel()`/`ddlFtsEntscheide()`, normalisiert nur um Namens-Quotes und
Whitespace (nach `ALTER TABLE … RENAME TO` schreibt SQLite den Namen gequotet zurück;
ein roher Vergleich wäre dauerhaft rot und damit wertlos). Mitgenommen: die
Entscheide-DDL stand zweimal von Hand im Repo, jetzt eine Quelle.

**Deploy/Sync-Fenster — gemessen, nicht geschätzt.** Beide Workflows hängen am selben
`push` auf `main`; keiner wartet auf den anderen. Auf der realen Zeitachse
(CI-Lauf 33411008213 vom 31.8.2026, dazu die letzten vier Push-Syncs):

| | Dauer ab Push |
|---|---|
| Turso-Sync komplett (Build → Sync → Frische → Live-Probe) | 5,3 – 6,6 min |
| Prod-Deploy live (`deploy` braucht `diff · tore · bau · e2e`) | **14,8 min** |

Im Normalfall ist die Replika also **rund acht Minuten vor** der neuen Edge-Funktion
umgestellt, und diese Reihenfolge ist ungefährlich: die HEUTE auf `main` laufende
Abfrage nutzt weder Spaltenfilter noch bm25-Gewichte (`MATCH ?`, `bm25(fts_artikel)`)
und läuft gegen den neuen Sechs-Spalten-Index anstandslos — lokal gegen
`daten/normtext.db` verifiziert («OR 319» 4 · «Verjährung» 259 · «Miete» 165 Treffer,
kein Fehler). **Das ist aber ein Rennen, keine Zusicherung**, und drei Wege öffnen das
Fenster doch:
1. ein langsamer Sync (vor dem Index-Transfer waren es 32,8 min; `timeout-minutes: 90`),
2. ein durch `concurrency: turso-sync` hinter einem Vorlauf wartender Sync,
3. **fehlendes `TURSO_AUTH_TOKEN`** — dann überspringt der Sync-Job ehrlich und endet
   mit 0, während der Deploy trotzdem ausliefert. Das Fenster wäre dann nicht Minuten
   lang, sondern offen bis zum nächsten Sync von Hand.

**Billigster Riegel (Vorschlag, NICHT gebaut — Entscheid liegt beim Orchestrator/David):**
vor dem Merge den Workflow «Turso-Serving-Sync» per `workflow_dispatch` auf dem Branch
`feat/qs-basis-suche-edge` fahren. Er baut das Sechs-Spalten-Artefakt aus den
committeten JSONs und stellt es live; die alte Edge-Funktion arbeitet währenddessen
weiter (s. o.), und `check:turso-frische` bleibt grün, weil dieser Branch
`daten-manifest.json` nicht anfasst (verifiziert: `git diff main...HEAD` zeigt die
Datei nicht). Danach ist das Fenster null statt bloss klein — Kosten: ein Klick, kein
Code. Die Alternative, den Deploy im Workflow auf den Sync warten zu lassen, koppelt
zwei bisher unabhängige Pipelines und gehört in einen eigenen Schritt.

**F2 (MITTEL) — Paritäts-Behauptung war überzeichnet.** Der Spaltenfilter verlangte
ALLE Terme in derselben Spaltengruppe, `artikelRanking` nur EINEN. Gemessen:
«Verjährung Fristen» → OR 127 auf Rang 8 statt 1; «Verjährung Forderung» → Top-3 ohne
Grundartikel. Behoben durch OR-Verknüpfung; **recall-neutral**, weil die
Stufen-Ausdrücke nur LEFT-JOIN-Mengen speisen (über die volle Pagination gegengeprüft:
23/23 und 20/20 Treffer, Mengen elementweise identisch). **Präfix bleibt eine bewusste
Abweichung:** der Client findet «Verjähr», der DB-Weg nicht. Angleichen ist eine
Recall-, Rang- UND Latenz-Änderung auf jeder Query (Und der Präfix verschiebt nicht nur die Treffermenge, sondern auch STUFEN und RÄNGE derselben Treffer (GP-Messung 31.8.2026, echter Client-rangiere() gegen identische DB-Treffermenge, ohne Recall-Confound): «Eigentum» n=658 — OR 261 («Wechsel des Eigentümers») und ZGB 200 («Eigentumsverhältnisse») stehen beim Client via startsWith auf Stufe 0/Seite 1, am Edge auf Stufe 2; «Eigentum Grundstück» n=87 — 15 Stufen-Divergenzen, 33 Positionswechsel >5 Plätze; «Miete Kündigung» n=20 — Top-20 nicht identisch.) — lokal, warm, n=3
Median: «Eigentum» 15,6 → 107,1 ms bei 658 → 1502 Treffern (6,9x). Eigener
Roadmap-Punkt; bis dahin als Test mit ehrlicher Erwartung festgehalten. Die
«gleichwertig»-Sätze an drei Stellen sind entsprechend zurückgenommen — Davids
K3-Scharfschaltungs-Entscheid bleibt unberührt, nur seine Grundlage darf nicht zu
stark klingen (§8).

**F3 (NIEDRIG) — der behauptete Byte-Beweis existierte nicht.** Der K3-Kommentar
verwies auf `src/tests/suchIndex.test.ts`; dort stand nichts dergleichen, und die
K3-Tests lagen anderswo. Jetzt echter Beweis in `src/tests/suche/ebenenWahl.test.ts`.
Referenz ist bewusst **nicht** das ausgelieferte `public/such-index/artikel.json` —
der Ordner ist gitignored und entsteht erst in `npm run build`; der CI-Job `tore` baut
nicht, der Test wäre dort ENOENT-rot gelaufen (lokal reproduziert). Verglichen wird
gegen die Montage aus `baueEbenenIndex` je Ebene, also den Code-Weg vor dem Schalter
(sha256 `c2a98aea…`, derselbe Wert wie im gebauten Artefakt).

**F4 (NIEDRIG) — K5 hatte keinen Test**, weil die Logik keinen Angriffspunkt hatte
(Rumpf-Code mit direktem `npm run` und `process.exit`). Naht `fuehreKette(...)`
eingezogen, Ablauf unverändert; 8 hermetische Tests plus ein Subprozess-Test gegen
einen `npm`-Stub im `PATH`, der das eine belegt, was eine Attrappe nicht kann: dass
der echte Aufrufweg den Exit-Code durchreicht.

**F5 (INFO) — der Transport-Test führte vier Zweitkopien** (Spaltenliste, Tokenizer,
Entscheide-DDL, bm25-Gewichte) und war damit für genau die Drift blind, die er
bewachen sollte. Alles kommt jetzt aus der Produktionsquelle; **neu** ist der Riegel,
der ganz fehlte: gleich viele bm25-Gewichte wie FTS-Spalten, Stufen-Spalten sind echte
Index-Spalten, und die Gewichte fallen in der dokumentierten Rangfolge
t > m > n > g > tb > f.

**Nebenbefund, bewusst NICHT gefixt — Umlaut-Faltung.** «Verjaehrung» (ae) findet
nichts, «Verjahrung» (a) findet alle 259 Treffer: `remove_diacritics 2` faltet ä→a,
aber niemand faltet ae→ä. Das betrifft **beide** Wege gleich — der Client normalisiert
mit NFKD und strippt Diakritika, also genauso —, ist somit kein Edge-Paritätsdefekt,
sondern eine gemeinsame Recall-Lücke. Ein Fix müsste beide Indizes gemeinsam ändern
und braucht linguistische Sorgfalt (eine naive ae→ä-Faltung trifft «Aeroplan»,
«Israel», «Praesidium» sehr unterschiedlich). Eigener Roadmap-Punkt.

**Nicht berührt:** die Heiss/Kalt-Grenze (Archiv-§12.2) bleibt unverändert
David-Gate; es wurde kein echter Turso-Lauf gefahren (Env fehlt lokal).

---

## §17 · Turso-Schreibkontingent — QS-TURSO-SCHREIBVOLUMEN *(15.9.2026)*

**Anlass.** Mail Turso 15.9.2026 «Writes Blocked» (Organisation ravedave, Gratisplan). Befund:
`turso-sync.yml` läuft bei jedem Push auf `main` mit Korpus-Diff und baut alle fünf HOT-Tabellen
samt FTS5-Schatten-Tabellen komplett neu — 171 065 Zeilen je Lauf (Lauf 14.9.2026 16:10 UTC),
39 Push-Läufe vom 1.–14.9.2026 ≈ 6,7 Mio Zeilen, und Turso zählt bei indexierten Tabellen jede
betroffene Index-Zeile zusätzlich (turso.tech/pricing, FAQ «rows written», Abruf 15.9.2026). Lesen
war nie gesperrt: `api/suche` lieferte am 15.9. HTTP 200 mit Treffern. Gesperrt bleibt nur der
Sync; Reset am 1. des Monats. Entscheid David 15.9.2026: nicht zahlen, Wurzel-Fix bauen.

**Ziel (Schritt `QS-TURSO-SCHREIBVOLUMEN`).** Schreibvolumen ≥ 10× kleiner, Wächter bleiben
ehrlich (§8), kein neuer Tor, der nicht scheitern kann (§6.7).

**Bausteine — Ziel und Grenzen, nicht der Weg:**

1. **Bündeln.** Der Sync läuft nicht mehr je Push, sondern EINMAL täglich (bestehender Cron
   05:17 UTC) plus `workflow_dispatch`. Der Push-Trigger auf Datenpfade entfällt. Der bisherige
   separate `frische`-Job wird in den Tageslauf integriert (Sync → `check:turso-frische` →
   Live-Parität); sein harter Token-Riegel («ohne Token ROT, nie stumm grün») bleibt für den
   Cron-Lauf erhalten. Folge, ehrlich benannt: ein gelandeter Korpus-Stand ist bis zum nächsten
   Tageslauf in der Suche noch nicht sichtbar (Seite selbst ist aktuell). Kopf-Kommentar des
   Workflows nachziehen.
2. **Tabellen-Skip.** Je HOT-Tabelle wird eine **Signatur** in `sync_meta` hinterlegt
   (`sig_<tabelle>`), die ALLES abdeckt, was den Remote-Inhalt bestimmt: Daten-SHA (aus
   `daten-manifest.json`, wo vorhanden), Ziel-DDL der Tabelle und für FTS5 den Inhalt der lokal
   gebauten Schatten-Tabellen (deterministisch, byte-gleich belegt in `turso-fts-index.ts`).
   Stimmt die lokale Signatur mit der remote hinterlegten überein UND stimmt die Remote-Zeilenzahl
   mit dem Soll, wird die Tabelle übersprungen. `daten-manifest.json` trägt keine FTS-Einträge —
   die FTS-Signatur wird aus dem lokalen Artefakt gerechnet, nicht erfunden. Bei Vollskip werden
   nur `sync_meta`-Marken geschrieben (`stand`, `manifest_sha`), damit Prüfung 4 (ALTER) des
   Wächters weiter trägt. Prüfung 0 (SCHEMA) des Wächters darf durch den Skip nie umgangen werden:
   DDL-Änderung ⇒ andere Signatur ⇒ Neuaufbau.
3. **Sperre erkennen.** Antwortet Turso beim Schreiben mit der Kontingent-Sperre (Antwortform
   belegt durch Sonde Lauf 34948342923, 15.9.2026: HTTP 200, je Statement ein Pipeline-Fehler mit dem Text «Operation was blocked: SQL write operations are forbidden (writes are blocked, do you need to upgrade your plan?)» — also kein HTTP-Status, sondern ein stmt-Fehler), endet der Sync mit
   eigener `::error::`-Meldung («Turso: Schreiben gesperrt — Monatskontingent; Replika bleibt auf
   Stand <sync_meta.stand>, Lesen/Suche läuft weiter; Reset am 1. des Monats») und **Exit 3**
   (unterscheidbar von Datenfehlern, Exit 1). `check:turso-frische` bleibt Lese-Tor und unverändert.
4. **Prüfbarkeit.** Skip-Entscheid und Sperr-Erkennung als reine Funktionen in einem eigenen
   Modul (`scripts/datenhaltung/turso-skip.ts` o. ä., Muster `turso-transport.ts`), mit Tests; §6.7:
   jeder neue Test einmal rot gezeigt. Golden bleibt byte-gleich (kein Leser-Code berührt).
5. **Doku.** `docs/betrieb/env-inventar.md` (Turso-Zeile: Gratis-Kontingent, was «gesperrt» heisst)
   und eine Bibliotheks-Notiz `bibliothek/betrieb/turso-schreibkontingent-2026-09-15.md` mit
   INDEX-Eintrag (Zählweise, Messung vorher/nachher, Pflegebedarf: entfällt mit VPS).

**Erfolgsmass.** Rechnerisch ≤ 1 Voll-Rebuild je Korpus-Änderungstag statt je Push, an Tagen ohne
Änderung nur Marken (< 20 Zeilen). Nachmessen im Oktober in der Turso-Konsole (David, kein Gate).

**Nicht Teil des Schritts.** Plan-Upgrade oder Overages (Entscheid David: nein); Umbau der
Lese-Seite; Delta-Sync innerhalb einer Tabelle (Voll-Rebuild je geänderter Tabelle bleibt
Weiche C, §10(7)).

---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

15 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-DATENHALTUNG.md`](../archiv/fahrplaene/FAHRPLAN-DATENHALTUNG.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0. Entschiedene Richtung (bindend)
- 0bis. Bestehender Verzahnungs-Bestand (wird erweitert, nicht neu gebaut)
- 1. Architektur
- 2. Single-Source-Artefakt: Turso/libSQL vs. Neon — Verdikt libSQL
- 3. Kanonisches Datenmodell (schema.sql-reif; ersetzt die frühere Schema-Skizze)
- 4. Tore
- 5. Etappen (jede mit Tor; nie Big-Bang)
- 6. Betrieb (Import-Läufer ausserhalb Vercel)
- 7. Sicherheits-/Rollback-Konzept
- 8. Verhältnis zu den anderen Fahrplänen
- 9. Ehrliche Grenzen / Risiken
- 10. Entscheide (2.7.2026 festgezogen; Prozess-Freigaben bei David)
- 11. Darstellung (drei Reader + EIN Kontext-Layer)
- 12. Datenhaltungs-Optimierung + Heiss/Kalt-Grenze (§14-Intake David 20.7.2026)
- §15 · ROADMAP-Spec-Nachzug `W2·6-DATA` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)

> **Landungs-Lehre 31.8.2026 (CI-Rot PR #604, §17):** Der `Gegenpruefung:`-Trailer
> wird via `git log --format=%(trailers:…)` gelesen — git erkennt NUR den letzten
> Absatz als Trailer-Block. Eine Leerzeile zwischen `Gegenpruefung:` und
> `Co-Authored-By:` macht das Verdikt unsichtbar → Merge-Schutz rot. Formregel:
> Roadmap/Gegenpruefung/Co-Authored-By in EINEM Schlussblock ohne Leerzeilen;
> vor jedem PR lokal `npm run check:merge-schutz` fahren (kostet Sekunden,
> spart den CI-Lauf).
