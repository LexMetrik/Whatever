# FAHRPLAN — Token-Ökonomie des Agenten-Baus (Detailquelle)
<!-- @lagebild name: Arbeitskosten senken · zweck: Doku und Prozesse verschlanken, damit jede Bau-Session weniger Tokens verbraucht. -->

> **Heimat:** `ROADMAP.md` → **oberster offener Schritt** der «Geordneten Abarbeitung» (`QS-TOK`);
> nur Detailquelle (§14); einziger Repo-Eingriff; selbst §-sliceable.
>
> **Auftrag David 10.7.2026** (ultracode: 7 Berichte, 3 adversariale Lenses, Nachmessungen):
> Bau verbraucht **weniger Tokens** — nur über Effizienz (gezielter lesen, kompakter übergeben,
> deterministisch statt modellgetrieben, cachen, indizieren); Einmal-Investitionen ok.
> 19 Massnahmen adoptiert (10 korrigiert), 8 verworfen.
>
> **LEITPLANKE (nicht verhandelbar):** Qualitäts-Daueranweisungen unangetastet — adversariale
> Gegenprüfung auf Risikopfaden, doppelt verifizieren, iterative Bug-Checks, golden byte-gleich,
> Treue vor Tempo. Keine Massnahme kürzt Beweis, Tor oder Prüfung.

> Erledigt-/Stand-Abschnitte vom 14.8.2026 nach `archiv/FAHRPLAN-ERLEDIGT-ABSCHNITTE.md` verschoben (QS-PLAN-EINFACH).

## §0 · Zweck

Detailquelle zu `QS-TOK` — Token-Verbrauch des Agenten-Baus senken, ausschliesslich
über Effizienz (gezielter lesen, kompakter übergeben, deterministisch statt
modellgetrieben, cachen, indizieren). **LEITPLANKE nicht verhandelbar:** keine
Massnahme kürzt Beweis, Tor oder Prüfung — Gegenprüfung/golden byte-gleich/Treue
vor Tempo bleiben unangetastet.

## Stand

**GO + OBERSTE PRIORITÄT erteilt (David, Chat 10.7.2026): «oberster schritt soll sein den
token verbrauch zu minimieren.»** Damit P0–P5 freigegeben; Start = **P0/T2 Token-Baseline
(Messung zuerst)**, dann Pakete in Plan-Reihenfolge; die Reader-Kette W2·5d
(U-POSITION → U-PDF) läuft erst danach bzw. dahinter.
Tok ≈ Bytes÷4; Zahlen = Schätzung bis T2 misst; Umsetzung Opus, gate-grün, je PR.
Notation: M Mechanik · E Ersparnis+Herleitung · R Risiko→Gegenmittel · **K adversariale Korrektur (Spec-Pflicht)** · DoD messbar.

### Stand 24.7.2026 — autonomer Bau-Rest LEER (Nachmessung Session «run till dry»)

Repo-Nachmessung (Session 24.7. III): **gebaut und verifiziert** sind T1 · T2 · T3 · T5 · T6 ·
T7 · T9 (Permissions `.claude/settings.json:20f.` + Template-Verankerung) · T15/T18 (im
Dispatch-Template `docs/token-oekonomie/dispatch-template.md` verankert) · T17 (`test:kurz` in
`package.json:22`) · T19 sowie `npm run map`/`zeige`/`fahrplan`. **Verbleibende Posten: Go David
27.7.2026 ERTEILT** für T10 · T12-Stufe-2 · T14 · T16 · T20 (Chat-Nachtrag zur Aufräum-Session;
T16 nur in frischer Session gem. T19-Vorbedingung; T12-Stufe-2: dokumentierte Weglassungs-
Begründung vor Bau neu bewerten; T20 = stehendes Einsatz-Instrument). **T13-Rest bewusst
zurückgestellt:** die genannten Config-Dateien sind inzwischen Barrel-Splits (< 25 Z.,
`startseiteKarten.ts`/`startseiteVorlagen.ts`), der Rest läge auf Risikopfaden
(`zustaendigkeit.ts`, `normtext/register.ts`) — Gegenprüfungs-Zeremoniell für reine
Navigations-Kommentare ist QS-TOK-widrig (Kosten > Ersparnis). Eine Bau-Session ohne
David-Go nimmt direkt den nächsten `@queue`-Schritt der ROADMAP.

### Stand P4 — Werkzeuge+Output gebaut (10.7.2026, PR QS-TOK/P4)

Umgesetzt **T8** (`npm run map` = `scripts/repo-map.ts`: deterministische Repo-/Symbol-Map
Modul→Pfad→Exporte→**Tor** (package.json-Rückbezug) über `src/`+`scripts/`, 864 Module; Default
stdout, `--out` → `.repo-map.generated.md` **gitignored/nie committen**, `--dir <teilbaum>`; **kein
Gate** — DIRTY-Kaskaden-frei), **T12 Stufe 1** (`npm run ci:log` = `scripts/ci-log-diaet.sh`:
ent-präfixt `gh run view --log-failed`, entfernt nur `Job⇥Step⇥Zeitstempel`-Rauschen + ANSI +
BOM, gruppiert nach Job/Step, `##[error]`-Zeiger; **Fails vollständig** — belegt an rotem Run
`29107143646`: **54 273 B → 21 164 B / −61 %**, gegenüber `--log` 271 883 B sogar −92 %; die 6
Fail-Assertions bleiben restlos erhalten), **T17** (`test:kurz` = Vitest-dot, `test:e2e:kurz` =
Playwright-dot; `npm test`/`test:e2e`/CI unverändert = volle Rot-Diagnose), **T9** (Muster-Query-
Satz `docs/token-oekonomie/ast-grep-queries.md`, verifiziert gegen den Baum; im Template §1
bevorzugt; `npx --package @ast-grep/cli ast-grep` = 0-Fixkosten-CLI), **T10** (Machbarkeits-Notiz
`archiv/token-oekonomie/fixkosten-audit-t10.md`: **kein projektseitiger MCP-Hebel** — alle ~250
deferred Namen sind Davids Konto-Konnektoren; Schemas bereits deferred → real ~4–7k Fensterplatz;
Deaktivierung Account-Ebene/David-Go, hier dokumentiert nicht ausgeführt).

**Job-Split (T12 Stufe 2) begründet WEGGELASSEN:** Die Spec-Bedingung (Risiko-Asymmetrie K:
Job-Split nur bei materiellen Rest-Kosten) ist **nicht erfüllt** — T2-Baseline zeigt cacheRead
95,8 % dominierend, Output nur 0,54 %; der Umbau am Required-Gefüge (Aggregat-Job/No-op-Zwilling/
needs-Reihenfolge) trüge sein Blockade-Risiko ohne materielle Ersparnis. **Bleibt offen** für ein
separates David-Go, falls eine spätere T2-Messung materielle Log-Rest-Kosten zeigt.

**Offen (nicht selbst gefixt):** `check:plan` auf `origin/main` rot (QS-TOK-@meta verwaist) bis
#176 mergt — **vorbestehend**, P1b-Fläche. **T9-`allow`-Permission** (`.claude/settings.json`)
= Config/Account-Ebene → **David-Freigabe** (Self-Modification-Schutz); Vorschlag steht in
`ast-grep-queries.md`. Gegenprüfung **n/a** (Werkzeug-Infrastruktur, keine Inhalts-/Rechenfläche).

### Stand P3 — Dispatch+Prozess gebaut (10.7.2026, PR QS-TOK/P3)

`docs/token-oekonomie/dispatch-template.md` angelegt und aus `CLAUDE.md` §14.6 referenziert;
umgesetzt **T4** (Dispatch-Kopf: Whitelist+Erweiterungs-Klausel · TABU je Auftragsklasse ·
§-Slice · Pflicht-Rückgabe-Schema ≤2k, Gegenprüfung/Bug-Checks/golden unangetastet IM Agenten),
**T15** (Modell-/Effort-Routing-Tabelle; `model`+`effort` je Task-Call explizit; Risikopfad+
Gegenprüfung fix Opus/high; Synthese nie unter Sonnet — kalibriert an T2-Baseline), **T18**
(Screenshot-Diät-Positivliste: DOM nur für Existenz/Text/Attribut/Klasse-Fakten, Geometrie/
Überdeckung/Kontrast bleiben Bild), **T11** (Gegenprüfungs-Beschaffung als Skill-Zusatz in
»gegenpruefung« + Template §5: gepinnter Filestore-HTML + Scope-Anker übergeben, Currency-Check
+ Re-Derivation bleiben beim Prüf-Agenten). **DoD:** Template + 10-Dispatch-Stichprobe (Anhang A)
100 % `model`/`effort`-explizit.

### Stand T19 — Warn-Injektions-Entfernung (11.7.2026, nach T1/#176)

Die git-zustandsabhängige (byte-INSTABILE) SessionStart-Injektion aus
`.claude/hooks/struktur-aktuell.py` ist aus der SessionStart-Kette
(`.claude/settings.json`) **entfernt** → der Sitzungs-Präfix bleibt byte-stabil
(Prompt-Cache-Treffer). **Empirischer Beleg:** bei realem STRUKTUR-Lag injizierte
der Hook **1101 Byte / 937 Zeichen** variablen `additionalContext` (Commit-Zahl +
-Liste, bis 30 Zeilen); dieselbe Lag-Lage nach T19 = **0 Byte** aus der
verbleibenden Kette. Die Schutzfunktion ist **nicht ersatzlos gestrichen**: sie
trägt jetzt mechanisch `struktur-rotieren.py` (T1 rotiert Karten byte-genau +
rückt die Basis nach + size-basierter Re-Akkumulations-Wächter = stabil), und das
Lag-Audit bleibt als On-Demand-Werkzeug **`npm run struktur:aktuell`** (verhaltens-
gleich, nur stdin-tty-sicher). CLAUDE.md-Kopf + `dispatch-template.md §7`
nachgezogen. Gegenprüfung n/a (Prozess-Hook, keine Inhalts-/Rechenfläche).

### Stand T2 — Token-Baseline gemessen (10.7.2026, PR QS-TOK/T2)

Quelle `npx ccusage session --json`, Fenster **26.6.–10.7.2026**, read-only, 141 Sessions,
5,95 Mrd Tok / ≈ $5 895. **K-Korrektur befolgt:** aggregiert über **Session-TYPEN**, nicht Wochen.
Typologie deterministisch aus dem **Modell-Set** der Session (Davids Modell→Rolle-Direktive:
Fable orchestriert, Opus baut, Haiku/Sonnet mechanisch/leicht) — *Wächter, kein Kausalbeweis;
strukturelle Proxy, nicht semantische Bau/Recherche-Trennung (aus Token-Metadaten nicht ableitbar)*.
Reproduktion: **`npm run token:baseline`** (Script `scripts/token-baseline.mjs`, Fenster via `--since/--until`).

| Session-Typ | n | Tok gesamt | Mean/Sess | Median/Sess | cacheRead | cacheWrite | input | output | USD |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| **O** Orchestriert (enthält Fable) | 27 | 2 675M | 99,1M | 10,0M | 95,9 % | 3,3 % | 0,34 % | 0,50 % | $3 042 |
| **B** Solo-Bau (nur Opus) | 109 | 3 182M | 29,2M | 6,9M | 95,8 % | 2,9 % | 0,73 % | 0,56 % | $2 777 |
| **M** Bau+mechanisch/leicht (opus+haiku, sonnet) | 5 | 98M | 19,5M | 6,3M | 96,8 % | 2,4 % | 0,21 % | 0,65 % | $76 |
| **GESAMT** | 141 | 5 955M | 42,2M | 7,1M | 95,8 % | 3,1 % | 0,55 % | 0,54 % | $5 895 |

Output-Generierung (der echte $-Hebel, Opus-Output ≈ 5× Input): O 494k · B 165k · M 127k Tok/Sess;
$/Sess: O 112,7 · B 25,5 · M 15,2. **cacheRead dominiert das Volumen (95,8 %)** — jede Session liest
den Präfix (Steuer-Doks + Kontext) turn-über-turn neu; **Median 7,1M ≪ Mean 42,2M**: zwei
Orchestrier-Ausreisser (1 027M + 762M = 30 % allen Volumens) treiben den O-Mean, der Median ist der
stabilere Wächter-Wert.

**Bestätigte Top-Hebel (Priorisierung Folge-Einheiten):** (1) **P1 Steuer-Doku-Diät (T1/T3/T7)** —
weil cacheRead = 95,8 % ist der immer-mitgelesene Präfix (STRUKTUR/ROADMAP/CLAUDE/FAHRPLÄNE) der
grösste Volumen-Posten; Verkleinern wirkt auf jeden Turn jeder Session. (2) **T4-Dispatch +
§14.6-Kontext-Hygiene (Delegieren)** — Typ O ist der Pro-Session-Grossverbraucher (99M Mean, $113,
1B-Ausreisser); schwere Lese-/Prüfarbeit in Subagenten halten kappt genau diese Sessions.
(3) **T15 Modell-/Effort-Routing** — Output (der Preis-Hebel) konzentriert in O (494k/Sess);
effort-Senkung wirkt dort direkt (−48…−76 %). Typ B ist mit 53 % des Volumens der Mengen-Hebel
(T6-Sonde/T9-ast-grep/T13-Anker senken Reads je Bau-Session). T5-Read-Guards = Versicherung gegen
Ausreisser, nicht Volumentreiber (nur 2 Mega-Sessions). Nächste Messung: Mean/Median je Typ vergleichen.

**Fortschritt (10.7.2026):**
- **T2 ✅ #172** — Token-Baseline/Regressionswächter (P0).
- **T7 ✅ #173** — ROADMAP-Chronik-Split (`ROADMAP-CHRONIK.md`). *Rest:* ROADMAP.md 93.6 KB, über dem DoD-Ziel ≤~65 KB — weitere Chronik-Auslagerung offen (kollidiert derzeit mit Parallel-Schreibern).
- **check:plan geheilt** — `QS-TOK` fehlte in `scripts/plan/inventar.ts` (seit #171), rötete die gate-Kette für alle; registriert, grün.
- **T1 ✅** — STRUKTUR-Rotation mechanisiert (`.claude/hooks/struktur-rotieren.py`, SessionStart-Hook + `npm run struktur:rotieren`) inkl. **T7-K Teil 2 Re-Akkumulations-Wächter**. Dogfood: 34 Karten ≤6.7. rotiert, STRUKTUR.md 139.4→35.6 KB (Budget 60), Byte-Bilanz belegt (0 Inhaltsverlust), idempotent.
- **T3 ✅** — FAHRPLAN-§-Slice-CLI (`npm run fahrplan`), ToC immer dabei; GESETZES-UX §10-Slice 60.6 KB vs. 119.5 KB Ganzdatei.
- **T16 offen (Go liegt vor, bewusst vertagt)** — CLAUDE.md-§7-Detail in `paths`-Rule: Davids Blanko-Go 24.7.2026 hebt das §8-Ziff.-4-Gate; die Kampagne 24./25.7. hat den Umbau trotzdem NICHT am Kampagnen-Ende gemacht (T19-Cache-Hygiene «CLAUDE.md nicht mid-Kampagne» + chirurgisches Risiko am Governance-File bei erschöpftem Kontext). Nächste FRISCHE Session mit freiem Kopf: §7-Elaboration (~4,7 KB) extrahieren, Probelauf-Vorbedingung beachten. Die §9-Faktenkorrektur (Required-Kontext steht) wurde 25.7. separat eingepflegt.
- **T19 ✅** — Warn-Injektion aus SessionStart-Kette entfernt (Präfix byte-stabil; Beleg 1101→0 Byte); Schutzfunktion trägt `struktur-rotieren.py`, Audit als `npm run struktur:aktuell`. Stand-Details oben.
- Übrige §§4–§7 (T4/T5/T6/T8/T9/T11/T12/T13/T14/T15/T17/T18/T10) unverändert offen, je Reihenfolge §8.

**P2 (T5+T6) GEBAUT (10.7.2026, Worktree `feat/qstok-p2-guards`):** T5-Guards — Read/cat-Soft-Guard `.claude/hooks/lese-schutz.py` (>200 KB ohne offset/limit + §6-Nie-lesen-Dateien → Werkzeug-Verweis, Override via offset/limit/Sonde; feuert nur auf Agenten-Tools, Generatoren/Tore unberührt), `.gitattributes` (normtext+golden `linguist-generated` OHNE `-diff`, fontData/grundart `-diff`), fontData-Banner. T6-Sonde `npm run zeige` (`scripts/zeige.ts`, byte-treuer Roh-Slice via typen.ts-Deserialisierung; Bund/`--kanton`/`--struktur`/`--register`/`--sql` read-only) — OR Art. 1 byte-identisch bewiesen. Voller `gate` grün ausser `check:plan` (P1b-Inventar-Fix noch offen, nicht P2-verursacht). CLAUDE.md-Verankerung (T6-DoD) + T4-Template offen (T4 = P3).

## §1 Ist-Befund

| Posten | Befund |
|---|---|
| STRUKTUR.md | 136,5 KB nach Teilrotation (trotz Warn-Hook 452 KB erreicht; Archiv 347,5 KB); jede Session + Subagent liest sie |
| ROADMAP.md | 104,9 KB ≈ 26k Tok; nur 14 offene / 10 erledigte Checkboxen, Rest Erledigt-Chronik |
| CLAUDE.md | 25,6 KB / 367 Z. ≈ 7k Tok, Pflichtlektüre jedes Agenten |
| FAHRPLÄNE | 38 / 1,05 MB; GESETZES-UX 105 · FEDLEX 102 · DATENHALTUNG 73 KB; Anker da |
| Daten | normtext 116 MB/2590 JSON (OR ≈ 475k Tok) · golden 6 MB (snapshot 1,31M) · daten/ 7 GB |
| src/ | 704 TS / 12 MB; Hotspots inhalt.tsx 76 KB × 35 Commits/400, zustaendigkeit.ts 71 KB |
| Schutz | kein .gitattributes/.rgignore/Read-Guard; engine-map 8 KB (11.6.). Schon gehärtet: gate.sh grün=1 Zeile · check-parallel fails-only · golden:diff gedeckelt · Hooks grün=0 Tok · Tool-Schemas deferred. CI: Monolith-Job «Tore (…)», 16 Schritte; Required+No-op-Zwilling namensgleich |

## §2 P0 Messung zuerst

**T2 Token-Baseline + Regressionswächter (S).** M: `npx ccusage` liest lokale JSONL-Logs
read-only + rückwirkend (Baseline existiert schon): Tok/USD je Session inkl. Cache-Split;
optional OTEL (`claude_code.token.usage`); Fenster 26.6.–10.7. E: 0 direkt; macht alle Zahlen
belegbar, fängt stille Regressionen (Caching-Bug 3/2026: 10–20×). R: keines (read-only).
**K:** Deltas über Session-TYPEN, nicht Wochen (Aufgaben-Mix konfundiert); Wächter, kein
Kausalbeweis. DoD: Baseline je Session-Typ hier vermerkt; Report-Befehl.

## §3 P1 Steuer-Doku-Diät

**T1 STRUKTUR-Rotation: Hook rotiert statt warnt (hoch/S).** M: SessionStart-Skript verschiebt
`## Session`-Karten älter ~2 Arbeitstage byte-genau ins Archiv (Kopf/offene Abnahmen nie);
neue Karte = 4-Zeilen-Prepend am Anker `<!-- KARTEN -->`; Read via offset/limit; Rest-Rotation
Alt-Karten (35). E: ~15–20k je Voll-Lesung (136,5→~55 KB; Pflicht-Read <2k) + verhinderter
Wiederanstieg ~20–25k/Woche (Beleg §1: 452 KB). R: verschieben, nie zusammenfassen (40 %
Retrieval-Verlust); idempotent, nie blockieren. **K (Worktrees):** nur Haupt-Checkout
(git-dir==git-common-dir, sonst exit 0), nur git-clean, sofort `docs(STRUKTUR…)`-Commit statt
WIP (§12.1). DoD: ≤60 KB; Testlauf rotiert byte-gleich; Worktree = No-op.

**T3 FAHRPLAN-§-Slice statt Ganzdatei (hoch/S).** M: CLI `npm run fahrplan -- <Datei> <§>`
druckt deterministisch Kopf+§0+Ziel-§; Prompts referenzieren §§; CLAUDE.md-Zeile «Ganzdatei bei
Unklarheit». E (korrigiert): ~15k statt 17,5k je Bau-Agent, Kopf+§0 (8,7 KB) immer dabei
(GESETZES-UX §10: 35,5+8,7 vs. 105,4 KB).
**K (Sichtfeld, deckt R):** CLI liefert zwingend das komplette ##/###-Inventar mit (ToC ~0,3k), gegen Querkontext-Blindheit; Orchestrator referenziert ALLE zuständigen §§; Quer-Lektionen gehören in §0.
DoD: CLI + Testfall (§10 ≤~45 KB inkl. ToC); Konvention in CLAUDE.md + T4.

**T7 ROADMAP-Chronik-Split (hoch/M).** M: Erledigt-Prosa («gebaut/PR#») nach
`ROADMAP-CHRONIK.md` verschieben (nie zusammenfassen); bleiben: Protokoll, @meta, BEIDE Zonen,
je Einzeiler+Pointer. E: ~9–11k je Session (Welle 2 = 48,7 KB mit 26 Chronik-Absätzen;
Datei −35–45 KB); ROADMAP = Session-Einstieg. R: Beide-Zonen-Daueranweisung + oberster
offener Schritt intakt; Beweis: Checkbox-Zählung identisch (14/10).
**K (Ursache):** nur mit Nachhalte-Mechanik: Abschluss-Prosa künftig DIREKT in CHRONIK
(Protokoll-Konvention) + Wächter im T1-Skript, sonst Re-Akkumulation (STRUKTUR-Beleg). DoD:
ROADMAP ≤~65 KB; Checkboxen identisch; Konvention im Protokoll.

**T16 CLAUDE.md: §7-Detail in paths-Rule (niedrig/M, 2× geschwächt).** M: NUR §7-Elaboration (~4,7 KB) in
projektseitige `.claude/rules/` (`paths` = Extraktions-Flächen); normativer Einzeiler+Tor-Verweis bleiben im Kern. **K1 (Bugs):** Rules
laden nur beim READ passender Dateien, nicht bei Write/Create (#23478); User-Ebene ignoriert
`paths` (#22170) → projektseitig, nur wo ein Read garantiert ist. **K2:** §13/§15 bleiben im
Kern; Entscheidungs-Regeln wirken VOR der Pfad-Berührung, breite paths ⇒ Ersparnis ~0 oder
teurer Rework. E: ~1k je Agent ohne Extraktions-Berührung. DoD: Probelauf belegt Rule-Ladung
vor Extraktions-Aktion; keine Befolgungs-Regression.

## §4 P2 Daten-Guards+Sonde

**T5 Guards gegen Katastrophen-Reads (hoch/S).** M: (a) PreToolUse-Guard (Muster
tor-schutz.py): Read/cat >~200 KB ohne offset/limit → Soft-Block (Verweis T6/golden:diff),
Override möglich; (b) AUTOGENERATED-Banner aus den Generatoren; (c)
`.gitattributes`. E: killt Ausreisser-Reads (§1; fontData 99k); 1 Fehlgriff/Monat > Investition. R: Guard nie hart (kein Beweis-Read blockieren). **K (Beweis-Blindheit):**
`linguist-generated` OHNE `-diff` für normtext-JSONs (Extraktions-PRs/Gegenprüfung jagen
Drop/Leak via git-Diff); `-diff` nur fontData/grundart.generated; golden NICHT still per
.rgignore leeren (0-Treffer = False-Negative), sondern Guard-Meldung (→ golden:diff, §6.5).
DoD: Guard blockt Snapshot-Test-Read, Override ok; normtext-git-diff bleibt textuell; Banner
überlebt Generator-Lauf.

**T6 Daten-Sonde: artikel-genaue CLI (hoch/M).** M: `npm run zeige -- <Erlass> <Artikel>`
liest normtext-JSONs mit der Engine-Deserialisierung (typen.ts), druckt NUR
den Eintrag byte-treu/roh (nie re-serialisieren); Varianten struktur/register/kanton; analog
SQL-Sonde read-only für `daten/*.db`. E: ~10–40k je daten-berührender Session (3–8 Nachschläge
à ~200 Tok statt Grep-Runden/Voll-Reads); U-Kette/Extraktor-Backlog = dieser Typ. R:
Byte-Treue Pflicht (Risikopfad Norm-Zitate) → gleiche Deserialisierung, read-only, live auf
Repo-Dateien (kein Staleness). DoD: OR Art. 1 byte-identisch zum JSON-Eintrag
(Diff-Beweis); in T4 + CLAUDE.md verankert.

## §5 P3 Dispatch+Prozess

**T4 Standard-Dispatch-Template (hoch/S).** M: je Agent Whitelist mit Erweiterungs-Klausel
(begründen), TABU-Flächen, §-Slice (T3), Pflicht-Rückgabe (Status/Pfade/Gates/offene
Punkte/Architektur-Entscheide; Details in PR-Body); Gegenprüfung/
Bug-Checks unverändert IM Agenten. E: ~7–25k je Bau-Agent = 5–15k Exploration + 2–9,5k
Rückgabe (Beleg: 500-Tok-Return statt 8k-Prosa); multiplikativ. **K1 (TABU):** kein
Hand-Edit/Direkt-Read; Generator-/Tool-Läufe (golden, Generator, T6) = legitimer Weg;
TABU je Auftragsklasse (UI: Datenfläche tabu; Extraktion: Arbeitsfläche via Tools).
**K2:** Pflichtfelder zusätzlich Gegenprüfungs-Verdikt/Linsen/Befund-Kerne +
Whitelist-Erweiterungen; ≤2k = Richtwert, Fails/Befunde NIE kürzen. DoD: Template existiert +
referenziert; 3 Probe-Dispatches halten das Schema.

**T15 Modell-/Effort-Routing (mittel/S).** *Stand 4.8.2026: Routing spricht seither
semantische Stufen (spitze/stark/mittel/klein); Abbildung auf Modelle NUR in `PALETTE`
(`scripts/dispatch.ts`), Regeln im Template §2 — u. a. Gegenprüfung bevorzugt spitze,
Minimum stark/high (Entscheid David, Commit ef5a3a843). Der Rest dieses Absatzes ist
der Planungsstand vom Juli 2026.* M: model+effort in JEDEM Task-Call explizit;
Checkliste im T4; Risikopfade + Gegenprüfung fix Opus/high. E: bis −48…−76 % Output
auf effort-gesenkten Schritten (Opus-4.5); Haiku = 1/5 Opus-Preis. **K:** mechanisch =
deterministische Transformation, maschinell prüfbar (verschieben, formatieren, Log-Extrakt,
Fertigtext) → Haiku/low; jede SYNTHESE (Session-Karten/Vermerke/Handoffs:
Steuer-Doku lenkt Folge-Sessions!) mind. Sonnet bzw. beim bauenden Opus; Wirkung primär auf
Reasoning-Anteile, per T2 kalibrieren. DoD: Stichprobe 10 Dispatches 100 % explizit; keine
Synthese unter Sonnet.

**T11 Gegenprüfung: gepinnter Snapshot + Scope-Anker (mittel/S).** M: Prüf-Agent erhält
gepinnten amtlichen Filestore-HTML-Pfad (fedlex-cache.sh) + Scope-Anker aus der roten
Tor-Meldung; Re-Derivation aus der Norm bleibt vollständig; übergeben wird nur Beschaffung
(Skill-Zusatz). E: ~5–15k je Gegenprüfung (Fetch-/Such-Runde entfällt); häufig.
**K (Common-Mode):** Prüf-Agent führt Currency-Check SELBST (check:fedlex-versionen/caches),
Pin nur bei EIGENEM Grün, sonst Live-Beschaffung; nie Bau-Pfad-Grün übernehmen, nie auf
Code/zweite Ableitung zeigen (Skill-Regeln 2+5); volle Wirkung nach Fedlex-P1a/b (18 Pins
überholt). DoD: Skill-Zusatz; Probe dokumentiert eigenen Grün-Check.

**T18 Screenshot-Diät bei Fakt-Checks (niedrig/S).** M: Fakt-Prüfungen via
DOM/get_page_text/Assertion statt PNG-Read (~1–1,6k Tok/Bild). **K (enge Positivliste):** DOM
NUR für Existenz, Textinhalt, Attribute/aria, Klassen-/Style-FAKTEN; Geometrie/
Sichtbarkeit/Überdeckung/Umbruch/Kontrast — inkl. «wird angezeigt» — bleibt
Screenshot-pflichtig (Clipping-/Überdeckungs-Bugs sind DOM-korrekt!); Reader-Flächen
Screenshot-Default; Zweifel ⇒ Screenshot. DoD: Positivliste im Template; Stichprobe: kein
visueller Check per DOM.

**T19 Prompt-Cache-Hygiene (niedrig/S).** M: byte-stabile Präfixe: SessionStart-Injektion
stabil (T1 entfernt Warn-Injektion), CLAUDE.md nicht mid-Kampagne editieren, Agenten-Läufe dicht bündeln (TTL 5 Min). E: dollar-seitig (Cache-Read 10 %, Write
125 %; Präfix = grösster Preisposten); Tok-Volumen unverändert. DoD:
cacheRead-Quote steigt (T2-Split) nach T1.

**T20 Ultracode-/Workflow-Orchestrierung als Gross-QS-Instrument (mittel/S, Aufnahme
David 16.7.2026: «das mit ultracode einbauen in fahrplan»).** M: Für Gross-QS und
Breiten-Arbeit (Audits, adversariale Prüf-Panels, Korpus-Sweeps, Recherche-Fächer,
Migrationen) läuft der Agenten-Fächer als **deterministisches Workflow-Skript**
(Harness-`Workflow`-Tool; Opt-in = Davids «ultracode»-Wort im Auftrag oder ausdrücklicher
Workflow-Auftrag) statt modellgetrieben Hand-über-Hand: `pipeline()` je Einheit ohne
künstliche Barrieren; Rückgaben **Schema-erzwungen** (JSON-Schema = maschinell prüfbare
Form des T4-Rückgabe-Schemas); `model`/`effort` je `agent()`-Call explizit (T15-Routing:
Bau Opus/high, Mechanik Haiku/low; **kritische Stufen — Verify/Refuter/Judge und finale
Synthese — auf Fable 5 heben, mit Opus-Fallback im Skript**, da Workflow-Läufe Fable evtl.
nicht haben; Anweisung David 16.7.2026); `budget`-API als **harter Token-Deckel**;
Befund-Ströme durch adversariale Verify-Muster (N unabhängige Refuter, Mehrheits-Kill;
loop-until-dry bei Discovery unbekannter Grösse); Abbruch/Fortsetzung über Journal +
`resumeFromRunId` statt Re-Run. Tool-Output bleibt vollständig aus dem
Orchestrator-Kontext (§14.6-Hebel «Delegieren» maximal). E: kein Volumen-Sparhebel,
aber der wirksamste Hebel GEGEN die Typ-O-Ausreisser der T2-Baseline (2 Sessions =
30 % allen Volumens): der Orchestrator-Kontext bleibt klein, das Volumen wandert in
gecappte, schema-gebundene Subagenten; empirisch lieferten die bisherigen
ultracode-Einsätze die dichtesten Ergebnisse je Auftrag (Perf-Audit 30.6.: 25
verifizierte Befunde · Token-Audit 10.7.: 7 Berichte + 3 Lenses · UX-Recherche 10.7.:
17 Agenten read-only). R: Kostenexplosion/Agenten-Schwarm → NUR mit explizitem Opt-in
**je Einsatz**; nie für Routine-Bau (eine Bau-Einheit = EIN Opus-Agent, T4); `budget`
setzen; jede Kappung per `log()` offenlegen (kein stilles Top-N). **K (Leitplanke):**
Workflow-Verify ERSETZT NIE Pflicht-Tore — `check:gegenpruefung`/golden/`gate` bleiben
unberührt; die Gegenprüfungs-Quittung läuft weiterhin über den Skill »gegenpruefung« +
`npm run gegenpruefung:ok`, nie über Workflow-Verdikte. DoD: Konvention hier + Verweis
in `docs/token-oekonomie/dispatch-template.md`; der nächste ultracode-Einsatz belegt
budget-Deckel + Schema-Rückgaben im Report.

## §6 P4 Werkzeuge+Output

**T9 ast-grep als Navigations-Standard (mittel/S).** M: installieren, allow-Permission, im
T4-Template bevorzugt (AST-Pattern statt Breit-Grep + Voll-Reads); Harness-LSP wo verfügbar;
Grep/Read = Fallback, Beweis-Reads unangetastet; CLI statt MCP (0 Fixkosten). E (korrigiert):
~5–15k je navigations-lastiger Session (10–30k-Oberkante ignorierte Folge-Reads).
DoD: allow-Liste, Template, Muster-Query-Satz.

**T8 engine-map → generierte Repo-/Symbol-Map (mittel/M).** M: Skript generiert aus
ts-Exports/tree-sitter Modul→Pfad→Exports→FAHRPLAN-§→Tore + Einstiegs-Index (Unterbau ggf.
repomix --compress); Kopf hand-kuratiert, Rest skript-generiert (LLM-generierte Maps schaden:
−3 %/+20 %). E: ~15–40k Orientierung je frischem Agenten (heute ≈ 20–60k Grep/Read); Map
kostet ~2–5k. **K (Staleness/Konflikt):** Map NICHT committen; on-demand `npm run map` ODER
nur post-merge auf main (CI-Commit docs(map)); Gate höchstens warnend, NIE Required (sonst
Map-Konflikt je Parallel-PR, DIRTY-Kaskade #164/#165); auf Risikopfaden ersetzt die Map nie
die echte Datei. DoD: `npm run map` deckt src/+scripts/; kein Map-Artefakt in Feature-PRs.

**T12 CI-Rot-Log-Diät, zweistufig (mittel/S+M).** M (Stufe 1, sofort, Risiko 0): Wrapper um
`gh run view --log-failed`: nur Fehlerblock+Kontext, Fails vollständig. E: ~10–40k je
CI-Rot-Vorfall (Log 500–2000 Z.; Frequenz durch gate:schnell gedämpft).
**K (Risiko-Asymmetrie):** Job-Split NUR als Stufe 2, falls T2 materielle Rest-Kosten zeigt;
Fehler am Required-Gefüge blockiert JEDEN PR: Aggregat-Job EXAKT namensgleich, No-op-Zwilling
synchron, needs in Treue-Reihenfolge, Beweis an Wegwerf-PR VOR Merge. DoD: Extraktor an rotem Beispiel-Run belegt; Stufe 2 nur mit Wegwerf-PR-Beweis.

**T17 test:kurz + Playwright dot (niedrig/S).** M: `test:kurz` (Vitest-dot) für grüne
Vorab-Läufe, Playwright lokal list→dot; `npm test` + CI unverändert (volle Rot-Diagnose, §6).
E: ~2–3k je Direktlauf (Restloch). DoD: Scripts da; Fails vollständig sichtbar.

**T10 Fixkosten-Audit Konnektoren/Skills (niedrig [korrigiert]/S).** M: ~250 deferred
Tool-NAMEN + Skill-Liste = Fixkosten je Agent; nicht Gebrauchtes für Bau-Profile deaktivieren.
**K:** Schemas bereits deferred, «−85 %/55–134k» trifft dieses Setup NICHT: real ~4–7k, primär
Fensterplatz (Präfix gecacht); ZUERST 10-Min-Verifikation, ob selektive Deaktivierung je Kontext
ohne Davids claude.ai-Alltag geht; Ausnahmen: context7 (§16),
claude-in-chrome/Playwright, vercel-Deploy; Referenz-Plugins nie löschen.
DoD: Verifikations-Notiz; falls machbar: Namensliste messbar kleiner.

## §7 P5 Code-Struktur

**T13 §-Anker in grosse Logik-Dateien (mittel/S).** M: grep-bare Abschnitts-Kommentare in
gesetz-leser/inhalt.tsx (35 Commits/400), src/lib/zustaendigkeit.ts (Risikopfad),
ZustaendigkeitForm.tsx, src/lib/startseiteVorlagen.ts,
startseiteKarten.ts, src/lib/normtext/register.ts (SSoT); Grep landet präzis, Teil-Read via
offset/limit. E: ~10–25k je Session an diesen Dateien (Vollread 10–18k, oft mehrfach). R:
keines; Kommentare verhaltensneutral (golden + e2e beweisen). DoD: Anker in 6 Dateien; golden
+ e2e grün; Stichproben-Grep trifft.

**T14 Churn-Hotspots splitten, gestuft (mittel/L).** M: Stufe 1 inhalt.tsx
+ parts.tsx (23 Commits/400) in Module ≤200–300 Z. (UI; Netz: golden byte-gleich +
89 e2e; §6.6 deckt Splits >~800 Z.); Stufe 2 optional extrahiere-fedlex.ts (Churn 7/400
[korrigiert]) / ingest.ts: Risikopfad, volle adversariale Gegenprüfung. E: ~10–20k je Session, bedingt
durch KÜNFTIGE Edit-Frequenz (Churn = Vergangenheit). **K (Timing):** T13
sofort; Stufe 1 erst NACH der U-Kette (Worktree feat/u-verweis läuft JETZT dort;
Split jetzt = Konflikt-Kaskade); Vorbedingung T2-Frequenz-Beleg; Stufe 2 nur bei
nachgewiesener Frequenz, sonst dauerhaft T13-Anker. DoD: golden byte-gleich + e2e + §6-Beweis;
Stufe 2 mit check:gegenpruefung bestanden.
*(31.7.2026, Endprüfung R2-2: Die Zeilenzahlen «1199 Z.» / «660 Z.» sind gestrichen statt
nachgeführt — sie waren durch den §6.6-Split `b56b9193f` überholt (inhalt.tsx 1494→806 Z.,
parts.tsx auf 12 Z. ausgedünnt) und wären es mit dem nächsten Commit wieder. Die Zahl gehört
nicht in die Spec: `wc -l` liefert sie im Moment des Baus. Dieselbe «Regel daraus» wie im
Kasten zu §Stand 31.7.2026 — jeder Eintrag nennt den Stand, für den er gilt, samt Messbefehl.)*

## §8 Reihenfolge/Abhängigkeiten

1. **Sofort nach Go (parallel, alle S):** T2 · T1 · T5 · T9 · T12-Stufe-1 · T17.
2. **Danach:** T7 (nutzt T1-Wächter) → T3 → T4 (bündelt die Konventionen) → T6 → T15.
3. **Bedingt:** T11 nach Fedlex-P1a/b · T19 nach T1 · T8 nach T4 · T16 nach T1/T3/T7 + Probelauf ·
   T10 nach Machbarkeits-Verifikation · T13 ausserhalb aktiver Worktree-Flächen ·
   T14-Stufe-1 nach U-Kette + T2-Frequenz-Beleg.
4. **Go erteilt (David 27.7.2026), Massgaben bleiben:** T12-Stufe-2 (Required-Gefüge) · T14 (L) ·
   T16 (CLAUDE.md) · T10 (Account-Ebene) sind freigegeben — die frühere Fassung dieser Ziffer
   («nicht ohne separates Go David») war seit dem 27.7.2026 überholt und widersprach dem
   Stand-Block dieser Datei (Z. 123–125: «Go David 27.7.2026 erteilt», bestätigt durch die
   Pauschal-Freigabe vom 3.8.2026) sowie dem QS-TOK-Block der ROADMAP; korrigiert 5.8.2026,
   Bauplan-Review-Befund B2. **Die Massgaben je Posten bleiben unverändert bestehen:** T16 nur
   in frischer Session (T19-Vorbedingung) · T12-Stufe-2 mit neu bewerteter
   Weglassungs-Begründung · T10 erst nach Machbarkeits-Verifikation. Weiterhin **ohne stehende
   Freigabe**: **T20 je Einsatz** (Opt-in «ultracode» bzw. ausdrücklicher Workflow-Auftrag).
5. Kein Punkt ändert Gate-Semantik/Prüfpflichten; Auto-Merge gilt je PR.

## §9 Verworfen

| Kandidat | Grund |
|---|---|
| Serena MCP | 20–30 Tool-Defs + Betrieb; T9+T8 decken es; 40-%-Claim = Anbieter; Overlap wie Graphify; Re-Test falls T8/T9 per T2 nicht reichen |
| claude-context/CodeGraphContext | externe Vektor-/Graph-Infra (Kosten/Wartung/Datenschutz) für Anbieter-Claims («120×»); T8/T9 decken es |
| Statusline-Kontextmonitor | headless Agenten sehen keine Statusline/kein /compact; Hebel in T1–T8 |
| Tool Search «einführen» | bereits aktiv (Schemas deferred, 0 projektseitige MCPs); ehrlicher Rest = T10 |
| Golden-Hash-Manifest/diff-first | Kapselung existiert (golden:diff/vergleich); Restrisiko deckt T5 billiger; Umbau am härtesten Gate = Risiko |
| CLAUDE.md-Radikaldiät (−91,9 %) | Sicherheits-Wirbelsäule der Daueranweisungen; Zahl anekdotisch; vertretbarer Kern = T16 |
| Generelle Fails-only-Filter | Kern umgesetzt (§1 «Schutz»); PostToolUse-Filter birgt Verschluck-Risiko (§6); Rest = T12/T17 |
| FAHRPLÄNE → Agent-Skills | Doppelstruktur+Dauerpflege für denselben Lade-Effekt; T3 leistet es zu S; Skills nur für Prozeduren |

## §10 Quellen

code.claude.com/docs/en/monitoring-usage · docs.claude.com/…/claude-code-analytics-api ·
docs.claude.com/…/prompt-caching · anthropic.com/news/claude-opus-4-5 ·
anthropic.com/engineering/multi-agent-research-system · github.com: ryoppippi/ccusage ·
ast-grep/ast-grep · yamadashy/repomix · aider.chat · arXiv 2602.11988 AGENTS.md (korr. aus
2605.10039) · 2602.13170 Hotspots (korr. aus 2602.20478) · 2602.20478 Codified Context (→T8) · tembo.io/blog/claude-code-subagents · GitHub-Docs linguist-generated ·
claude-code #23478/#22170 (rules-paths) · intern: 7 Berichte + 3 Lenses, Nachmessungen §1.

---

## §11 · §14-Intake 3.8.2026 (`QS-TOK-DECKEL`, `QS-TOK-AUFRAEUMEN`)

*Angelegt 3.8.2026 (Bauplan-QS). Beide sind reine Doku-/Prozessarbeit ohne Code-Wirkung.*

### §11.1 `QS-TOK-DECKEL` — Root-Markdown-Deckel 22 → ~20

- **Regel:** Skill `auftrag`, Ziff. 1 setzt den Deckel auf «rund 20 Root-Markdown-Dateien».
  Ist-Stand seit 31.7.2026: **22**. Ein Deckel, der überschritten und nie nachgezogen wird,
  steuert nichts.
- **Zu bauen:** die datierten Audit-/Backlog-Dateien im Repo-Wurzel identifizieren (Kandidaten
  u. a. `BACKLOG-AUDIT-WERKZEUGE-2026-07.md`), nach `archiv/` verschieben und **alle Verweise
  nachziehen** — ein toter Link ist teurer als eine Datei zu viel.
- **Fertig, wenn:** die Zählung bei ≤ 20 liegt, kein Verweis ins Leere zeigt und
  `check:plan` (Regel 7) grün bleibt.
- **Nicht hier:** die `fahrplaene/`-Dateien — für die gilt der Link-Wächter, kein Deckel.

### §11.2 `QS-TOK-AUFRAEUMEN` — Skill `aufraeumen`

- **Anlass:** die Aufräum-Session vom 3.8.2026 hat ein wiederholbares Verfahren erzeugt, das
  bisher nur im Kopf steht — die nächste Aufräumung würde es neu erfinden.
- **Zu erfassen (Reihenfolge des Verfahrens):** (1) Ist-Messung über
  `struktur-rotieren.py --check` · (2) Erledigtes wörtlich in `ROADMAP-CHRONIK.md` überführen,
  nie zusammenfassen · (3) Streich-Massstab («steuert der Schritt noch etwas?») mit
  Begründungszeile in der Chronik · (4) Fahrplan-Archivierung verify-then-archive · (5)
  Tor-Reihenfolge `check:plan` → `check:struktur-konsistenz` → `struktur:aktuell` → plan-Tests.
- **Fertig, wenn:** der Skill unter `.claude/skills/aufraeumen/` liegt, seine `description`
  auf die echten Auslöser triggert und er auf die Ceilings verweist statt sie zu wiederholen.
- **Leitplanke:** Prozedur gehört in einen Skill, nicht ins Reglement (CLAUDE.md-Kopf).
