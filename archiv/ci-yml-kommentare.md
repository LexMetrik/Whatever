# Archiv — Kommentar-Chronik aus `.github/workflows/ci.yml`

Herkunft: HN-12 (Befund VS-03, Prüfung Herz und Nieren 24.9.2026, QS-DOKU-DIAET).
Datum der Verschiebung: 2026-09-25. main-SHA vor der Verschiebung: `59078ae8c32b4b139cb42a5a84dc126663707de1`.
Wörtlich verschoben, nichts umgeschrieben (§2b/F8) — auch offensichtlich veraltete
Sätze bleiben im Originalwortlaut stehen. In `ci.yml` steht je Block genau eine
Verweiszeile `# Anlass/Belege: archiv/ci-yml-kommentare.md#ci-NNN`.

Je Block: `## ci-NNN · <Job-ID> · <Name des folgenden Schritts/Schlüssels>`
(Job-ID `–` = ausserhalb von `jobs:`, z. B. Datei-Kopf oder `on:`-Block).
Darunter der Originaltext byte-genau, inklusive Einrückung und `#`.

---

## ci-001 · – · CI

```text
# ─── CI: erzwingt die §6/§9-Tore maschinell bei jedem Push ──────────────────
# Bisher liefen tsc/Tests/Lint/Sweeps nur, wenn eine Session sie manuell
# startete (STRATEGIE-PLATTFORM.md F2.2). Seit G2/A1 (FAHRPLAN-GRUNDLAGEN)
# ist auch der Golden-Vergleich ein Gate: Basis committet in
# golden/lexmetrik-golden.json; Abweichung = fachliche Änderung, die mit
# `npm run golden` + Begründung im selben Commit deklariert sein muss.
#
# ─── CI-Topologie (26.7.2026, «flüssiger»-Umbau; Historie O-3.3 in git) ──────
# Kritischer Pfad vorher ~21–30 min: `tore` (5.5 min, seriell: tsc→Tests→Lint→
# Build→alle Node-Checks) blockierte die e2e-Shards, und die 3er-Matrix war
# nach LOKALEN Dauern gepackt, die nicht auf den CI-Runner skalieren (gemessen
# 11.8/15.5/21.0 min statt je ~7). Jetzt:
#   1) `bau` baut dist EINMAL und lädt es als Artefakt hoch — mehr nicht.
#      e2e-Shards und `tore` starten direkt danach PARALLEL;
#   2) `e2e` fährt 8 dauer-balancierte Gruppen (LPT aus CI-GEMESSENEN
#      Spec-Dauern, e2e/shard-gruppen.json; Zahl seit 21.9.2026 wieder 8,
#      Packung dafür noch UNGEEICHT — s. NACHTRAG bei M3 unten, Posten LPT).
#      Der Union-Wächter (`check:e2e-shards`, auch in `check:seriell`) beweist
#      vor den Shards: Gruppen == `playwright --list` — kein Test doppelt,
#      keiner verloren. Reine Verteilung, kein Test/Timeout/Umfang (§6.3).
#      NACH den Shards prüft der Flacker-Wächter (`check:e2e-flake`) den
#      JSON-Report: ein Test, der erst im Retry grün wird, ist ROT — ausser
#      die Spec steht mit Datum und Grund in `e2e/flake-ausnahmen.json`
#      (verfällt nach 30 Tagen). Anlass: Lauf 34209371435 meldete «success»,
#      obwohl `a-ueberlauf-ohne-scroller` im Erstversuch rot war. MELDE-MODUS
#      (Entscheid Orchestrator 8.9.2026, `e2e/flake-modus.json`): 6 wechselnde
#      Specs im eigenen PR — bis 22.9.2026 nur `::warning`/Exit 0, danach hart;
#      Wurzeln messen (FAHRPLAN-OFFENE-BEFUNDE §4), nicht Ausnahmen sammeln;
#   3) `tore` fährt alle Node-Tore gegen das heruntergeladene dist —
#      unverändert im Umfang (R1-Lehre: Tore streichen ist die falsche
#      Vereinfachung), nur nicht mehr VOR den e2e-Shards;
#   4) `perf` misst §15-Budgets nur noch auf main/merge_group (Entscheid David
#      26.7.2026), weiterhin ERST nach grüner Treue (`needs: [tore, e2e]`).
#
# ─── Pfadfilter-Loch geschlossen (3.8.2026, Fehlerklassen K3 + K12) ──────────
# BIS HIERHER galt: `pull_request: paths-ignore: '**.md'`, und ein Zwilling
# (ci-doku-noop.yml) triggerte INVERS auf `paths: '**.md'`, um dieselben
# Required-Kontexte als No-op zu melden. Zwei belegte Defekte daraus:
#
#   K3  Ein PR, der WEDER Code NOCH .md ändert, fällt durch beide Filter: kein
#       Lauf, kein Kontext, GitHub wartet ewig auf «expected». Genau das ist
#       PR #417 (changed_files=0) — dauerhaft BLOCKED, ohne dass irgendetwas
#       rot wäre. Dieselbe Klasse trifft jeden Diff, den `paths` nicht sieht.
#   K12 Die 11 Required-Kontextnamen mussten byte-synchron über DREI Systeme
#       gepflegt werden (ci.yml · ci-doku-noop.yml · Branch-Schutz). Zweimal
#       ist genau das misslungen: die PRs #318/#320 hingen permanent unmergbar,
#       weil der Zwilling nur «Tore …» meldete und die 8 Shard-Kontexte plus
#       «Perf-Budget» nie (im Kopf von ci-doku-noop.yml Z. 13–25 dokumentiert).
#
# JETZT: KEIN Pfadfilter auf `pull_request` — CI läuft bei JEDEM PR-Event, und
# jeder Required-Kontext wird von GENAU EINEM Job in GENAU EINER Datei gemeldet.
# Statt zweier Workflows entscheidet ein erster, billiger Job (`diff`) über den
# UMFANG:
#   art=code  → volles Programm (Bau · Tore · 8 e2e-Shards);
#   art=doku  → reine .md-Änderung ODER leerer Diff: `Merge-Schutz` und
#               `check:plan` laufen ECHT (Begründung an den Schritten), der
#               Rest quittiert kurz. Semantik aus ci-doku-noop.yml übernommen.
# Die Fallunterscheidung sitzt damit in den SCHRITTEN, nicht in Trigger-Filtern:
# Job-Namen und -Anzahl sind ereignisunabhängig konstant. Ein Kontext kann so
# nicht mehr ausbleiben — die Klasse «expected für immer» ist konstruktiv weg.
# ci.yml ist ab hier die EINZIGE Quelle der Required-Kontextnamen (§5);
# ci-doku-noop.yml ist mit diesem Umbau gelöscht.
#
# ─── Doku-Kurzpfad auch auf `push` (FREIGABE DAVID 14.8.2026) ───────────────
# BIS HIERHER hatte `push` einen `paths-ignore: '**.md'`-Filter: ein reiner
# .md-Push auf main erzeugte GAR KEINEN Lauf. Zwei Befunde der Messung vom
# 14.8.2026 über 419 main-Commits der letzten 30 Tage:
#
#   (a) Der Filter deckt den teuren Fall NICHT ab. 158 Commits waren rein .md
#       (kein Lauf, gut), aber 42 weitere waren «.md + AUSSCHLIESSLICH
#       scripts/plan/inventar.ts» — die Plan-Buchhaltung verlangt diesen
#       Zweitschritt bei jeder Rotation (Inventar-Mechanik seit dem
#       Plan-Neuschnitt 29.8.2026 gelöscht; Messung bleibt als Beleg).
#       Eine einzige TypeScript-Zeile Inventarpflege zog also 42-mal das volle
#       Programm (~15 min) nach sich: rund 10 Stunden CI in 30 Tagen.
#   (b) Der Filter war zugleich ein Loch. Für die 158 reinen .md-Pushes lief
#       NICHTS — auch nicht `Merge-Schutz` und `check:plan`, die im PR-Doku-Pfad
#       ausdrücklich ECHT laufen (Begründung an den Schritten: md-only-Diffs
#       treffen `daten/**`, und @meta-Waisen entstehen genau hier).
#
# JETZT: kein Pfadfilter mehr auf `push`; der `diff`-Job klassiert auch
# push-Events. Damit gilt auf main dieselbe Semantik wie im PR — art=doku fährt
# `Merge-Schutz`, `Fachänderungs-Riegel` und `check:plan` ECHT und quittiert den Rest.
# Ergebnis beider Richtungen: die 42 teuren Läufe werden billig, und die 158
# bisher ungeprüften Pushes bekommen erstmals die drei Tore, die sie brauchen.
#
# DER GELOCKERTE GRUNDSATZ, ausdrücklich: ci.yml hielt fest, ein Deploy-Stand
# werde «nie nach Dateiendungen abgekürzt». Für `push` auf main ist das mit
# Davids Entscheid vom 14.8.2026 («wird freigegeben») bewusst gelockert.
# `merge_group` bleibt unberührt und fährt weiterhin ausnahmslos das volle
# Programm. Fehlerseite unverändert (§6.7): jede Unsicherheit fällt auf `code`.
# (Stand 14.8.2026. Seit 19.9.2026 klassiert der `diff`-Job auch `merge_group`.
# ANLASS ist Davids Routing-Entscheid vom 19.9.2026 «alles durch die
# warteschlange»: jeder Doku-PR läuft durch die Queue, der pauschale Volllauf
# wäre dort ein Dauer-Kostenposten. Der Satz sagt, WO Änderungen landen — er
# gibt KEINE Prüftiefe frei; die Freigabe vom 14.8.2026 galt im Wortlaut nur
# für `push` auf main (ROADMAP-CHRONIK.md, Eintrag `QS-BASIS-DOKU-CI`).
# BEGRÜNDUNG der Lockerung ist darum die ÄQUIVALENZ: die Prüftiefe eines
# Doku-Eintrags sinkt nicht unter das am 14.8.2026 freigegebene Niveau —
# vorher PR-Lauf (doku-klassiert) + Push-Lauf (doku-klassiert); jetzt PR-Lauf
# (doku) + merge_group-Lauf (doku), der Push per Diät still. Code-Einträge
# fahren unverändert das volle Programm, und Prod bleibt zusätzlich geschützt,
# weil `deploy` auf push `art != 'doku'` verlangt. Scope-Wechsel David am
# 19.9.2026 zur Bestätigung vorgelegt. Regeln, Auflage ALLGREEN und
# Fehlerseite: Kommentar im Schritt «PR-Diff klassieren».)
#
# ─── Dritte Klasse `code-fern` (QS-PLAN-EINFACH 14.8.2026, Punkt 3) ──────────
# Die Playwright-Browser-Shards sind gemessen 77–78 % der CI-Zeit. Rührt ein
# Diff AUSSCHLIESSLICH Flächen an, die die ausgelieferte App nachweislich
# nicht berühren (`**.md`, `scripts/plan/**`, `scripts/cowork/**`, `.claude/**`,
# `docs/**`, `bibliothek/**`, `messwerte/**`, `archiv/**`), fahren Bau + alle
# Node-Tore weiterhin VOLL — nur die 8 Browser-Shards werden übersprungen,
# mit demselben Skip-Muster wie die bestehende `doku`-Klasse (Required-Check-
# Semantik bleibt identisch). `Merge-Schutz` läuft für JEDE Klasse unverändert
# echt. KONSERVATIV: jede weitere Datei (auch package.json, e2e/**, scripts/**
# ausserhalb plan/cowork) kippt die ganze Klassierung auf `code`. Regel als
# Bash im `diff`-Job (CODE_FERN_RE, bewusst NICHT ausgelagert — der Job bleibt
# checkout-/npm-frei) UND als reine, Vitest-getestete Funktion in
# scripts/ci/diff-klassieren.ts (§6.7-Beweis dort).
# ─── Minuten-Sparplan (QS-CI-MINUTEN, 8.9.2026) ──────────────────────────────
# Vollerhebung 8.8.–8.9.2026 (1998 Läufe, 15'647 Jobs, je Job aufgerundet =
# GitHubs Abrechnungsmodell): 61'381 abgerechnete Minuten im Monat, davon
# 97,5 % in DIESER Datei. Detail und Herleitung:
# bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md. Umgesetzt sind drei
# Massnahmen; KEIN Tor entfällt, keine Prüftiefe sinkt:
#
#   M1  Auf `push` nach main laufen `tore`, `e2e` und `merge-schutz` nicht
#       erneut — aber NUR, wenn der Schritt «Push-Diät prüfen» (Job `diff`)
#       hart belegt, dass genau dieser Baum als PR grün war. Jede Unsicherheit
#       fällt auf den Volllauf. −29 % der Minuten. Auslöser `merge_group` und
#       `workflow_dispatch` bleiben unberührt.
#       (Stand 8.9.2026. Seit 19.9.2026 ist der Beleg nicht mehr der PR-Lauf,
#       sondern der grüne `merge_group`-Lauf AM GEPUSHTEN SHA — siehe AUFLAGE
#       am Ende dieses Kopfs und den Schritt selbst.)
#   M3  Browser-Shards 8 → 4. Je Shard-Job fallen gemessen 1.28 min Rüstzeit
#       + 0.37 min Aufrundung an, unabhängig von der Testmenge; 8 Shards
#       kosteten 46.7 abgerechnete Minuten für 33.3 min echte Testzeit.
#       Identische Spec-Menge, der Union-Wächter beweist das vor jedem Lauf.
#       NACHTRAG 21.9.2026 (§0 Ziff. 2b — die Messung von 8.9.2026 darüber
#       bleibt unverändert stehen, sie war für IHREN Stand richtig): M3 ist
#       ZURÜCKGENOMMEN. Entscheid David 21.9.2026 («versuch das zu kürzen»,
#       präzisiert auf Rückfrage «Zurück auf 8 Pakete»): das Repo ist
#       öffentlich, `GET …/actions/workflows/ci.yml/timing` meldet
#       `{"billable":{}}` — abgerechnete Minuten kosten derzeit nichts
#       (bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md:163). Die
#       Halbierung sparte Minuten, kostete aber WANDUHR (Preis war im
#       Ursprungscommit selbst beziffert: «Wanduhr je PR ~5.5 → ~9.6 min»)
#       — und Wanduhr ist jetzt das Ziel, nicht mehr Minuten. Rückbau:
#       Job-Matrix `gruppe: [1..8]`, `e2e/shard-gruppen.json` neu generiert
#       (`npm run gen:e2e-shards`), die `@shard-gruppe`-Kopfzeilen der
#       betroffenen Specs auf ihren historischen VOR-M3-Wert zurückgesetzt
#       (git-Diff des Ursprungscommits, nicht neu gepackt — 11 seither neue
#       Specs zähl-balanciert zugeteilt, NICHT dauer-geeicht: offener Posten
#       «LPT-Packung der 8 Shards aus CI-Dauern eichen», FAHRPLAN-CI-MINUTEN.md).
#   M4  Bei art=doku bzw. art=code-fern werden `bau` und die Shard-Jobs GANZ
#       übersprungen statt für eine echo-Zeile angeworfen (1 min
#       Mindestabrechnung je Job). Ein per `if:` übersprungener Job erfüllt
#       seinen Required-Kontext (Beleg: «Perf-Budget», seit 26.7.2026 auf
#       jedem PR übersprungen) — anders als ein Workflow, der wegen
#       `paths`-Filtern gar nicht erst startet (K3, siehe oben).
#
# EFFEKT MESSEN: `gh run list --event push --workflow CI --limit 20` und je
# Lauf `gh run view <id>` — auf main dürfen nur noch `diff`, `bau`, `perf`
# und `deploy` Zeit brennen (Stand 8.9.2026; seit dem M1-Nachtrag 21.9.2026
# brennen unter der Diät nur noch `diff`, `e2e-ergebnis` und `deploy` — `bau`
# und `perf` sind dort mit ausgesetzt, s. Kommentare an den Jobs);
# `gh api repos/{repo}/actions/runs/<id>/jobs` zeigt die abgerechneten Dauern.
#
# JOB-MATRIX je Auslöser (Soll-Zustand nach M1/M3/M4 + M4-Nachtrag + 21.9.2026):
#   pull_request   diff · bau* · tore · e2e(8)* · e2e-ergebnis · merge-schutz
#   push (Diät)    diff · e2e-ergebnis · deploy
#   push (o. Diät) diff · bau* · tore · e2e(8)* · e2e-ergebnis · perf · deploy
#   merge_group    diff · bau* · tore · e2e(8)* · e2e-ergebnis · perf** · merge-schutz
#   dispatch       diff · bau · tore · e2e(8) · e2e-ergebnis · perf · merge-schutz
#                  (+ deploy nur bei probe=ohne-token)
#   (* je nach Diff-Klasse: `bau` entfällt bei doku, `e2e` bei doku/code-fern;
#      `e2e-ergebnis` läuft IMMER — er ist der Pflicht-Kontext der Browser-Tests)
#   (** seit 19.9.2026 klassiert auch `merge_group`: `perf` läuft dort nur bei
#      art=code und meldet sonst `skipped` — ein per `if:` übersprungener
#      Nicht-Matrix-Job erfüllt seinen Pflicht-Kontext, siehe M4)
#
# ─── PFLICHT-KONTEXTE (Branch-Schutz main), abschliessend ───────────────────
#   «Tore (Tests · Lint · Checks)»
#   «Merge-Schutz (Required-Kontext)»
#   «Perf-Budget (§15 — nur bei grüner Treue)»
#   «Browser-Smoke (Ergebnis)»
# Die acht Shard-Kontexte «Browser-Smoke Shard N/8 (Playwright)» (Zahl seit
# 21.9.2026 wieder 8, s. M3-NACHTRAG) sind seit dem
# M4-Nachtrag (8.9.2026) NICHT mehr Pflicht — nur ihr Sammel-Job ist es.
#
# ─── M4-NACHTRAG: der Sammel-Job (Befund PR #776/#777, 8.9.2026) ────────────
# BEFUND: M4 wirkte fachlich (Diff-Klasse «doku» ⇒ `bau`/`e2e` übersprungen,
# `tore`/`merge-schutz` grün) — aber die beiden reinen Doku-PRs blieben trotzdem
# dauerhaft BLOCKED. Ursache ist eine bisher unbekannte Ausprägung von K12:
# Für einen per Job-`if:` übersprungenen MATRIX-Job meldet GitHub genau EINEN
# Check-Run, und zwar mit dem UNEXPANDIERTEN Namen
#   «Browser-Smoke Shard ${{ matrix.gruppe }}/4 (Playwright)»
# — die Matrix wird nie expandiert, weil der Job nie startet. Die (damals vier,
# seit 21.9.2026 acht) Pflicht-Kontexte «… Shard 1/4 …» bis «… Shard 4/4 …»
# (Stand 8.9.2026; seit 21.9.2026 «… Shard 1/8 …» bis «… Shard 8/8 …») werden damit NIE
# gemeldet und stehen für immer auf «expected». Der Beleg aus dem `bau`-Job
# («Perf-Budget wird übersprungen und mergt trotzdem») gilt also nur für
# Jobs OHNE `strategy.matrix`; für Matrix-Jobs ist er falsch.
#
# FIX (Standardmuster): der Sammel-Job `e2e-ergebnis` («Browser-Smoke
# (Ergebnis)») ist ein normaler Job ohne Matrix, läuft bei JEDEM Auslöser und
# in JEDER Diff-Klasse (`if: !cancelled()`) und meldet den einen Pflicht-Kontext
# der Browser-Tests. Er wertet `needs.e2e.result` gegen die Diff-Klasse:
# grün nur bei bestandenen Shards ODER bei einem Skip, den `diff` begründet;
# rot bei jedem anderen Skip (§6.7-Beweis am Job selbst). Nebeneffekt: die
# Shard-ZAHL ist ab hier frei änderbar, ohne den Branch-Schutz nachzuziehen —
# der bisherige Nachzieh-Zwang (K12) entfällt für die Browser-Tests ganz.
#
# AUFLAGE (§6.7), Fassung 19.9.2026: M1 steht und fällt mit der Merge-Queue
# auf main (Ruleset 23699779). Bis 19.9.2026 lautete die Auflage
# `required_status_checks.strict: true` (gemessen 8.9.2026) — `strict` ist seit
# dem Org-Umzug AUS, der PR-Lauf damit kein Beleg mehr für den landenden Baum.
# Der Beleg ist jetzt der `merge_group`-Lauf: die Queue setzt main per
# Fast-Forward auf den GETESTETEN Queue-Commit, sein Lauf hängt also am selben
# SHA wie der spätere Push (gemessen 19.9.2026, 9b125ce8e: Lauf 35449369984).
# Wird die Queue abgeschaltet, erzeugt der Merge-Knopf einen neuen Commit, zu
# dem es keinen `merge_group`-Lauf gibt ⇒ die Diät fällt von selbst auf den
# Volllauf; ein Rückbau ist dann Aufräumen, keine Sicherheitsfrage.
```

## ci-002 · – · merge_group

```text
  # B-12: Die native GitHub-Merge-Queue auf main ist seit dem Org-Umzug
  # AKTIV (19.9.2026, QS-ORG-UMZUG — Ruleset 23699779: SQUASH, ALLGREEN,
  # max. 3 gleichzeitig, Check-Timeout 60 min). Dieser Trigger ist damit
  # scharf: die Queue baut PR + aktuellen main als `merge_group`-Lauf, und
  # nur bei grün landet der Commit. Ohne ihn liefe in der Queue kein Tor.
```

## ci-003 · – · cancel-in-progress

```text
  # Auf main NIE canceln: seit perf nur noch auf main läuft (26.7.2026), wäre
  # ein durch den nächsten Merge gecancelter main-Lauf ein Deploy-Stand ohne
  # §15-Messung (Review-Befund 26.7.). PR-Läufe cancelt der nächste Push weiter.
```

## ci-004 · diff · diff

```text
  # ── Klassierung des PR-Diffs (K3/K12) ────────────────────────────────────────
  # Billigster denkbarer Job: kein Checkout, kein npm, nur ein API-Aufruf. Er
  # entscheidet den UMFANG der schweren Jobs, nicht deren EXISTENZ — die
  # Required-Kontexte werden in jedem Fall gemeldet.
  #
  # WARUM DIE API UND NICHT `git diff`: bei `pull_request` ist der Arbeitsbaum
  # der Merge-Commit; eine `merge-base`-Rechnung müsste erst `fetch-depth: 0`
  # holen (teuer) und bildet Force-Pushes und Basiswechsel anders ab als das,
  # was GitHub selbst als «changed files» führt. Massgeblich soll genau die
  # Menge sein, gegen die auch `changed_files` zählt.
  #
  # FEHLERSEITE (§6.7): Jede Unsicherheit fällt auf `code`, also auf das VOLLE
  # Programm. Zu viel zu prüfen kostet Minuten, zu wenig zu prüfen lässt Code
  # ungeprüft mergen. Darum der Abgleich gegen `changed_files`: weicht die
  # Länge der API-Liste ab (Kappung bei 3000 Dateien, Sonderzeichen im Namen),
  # wird NICHT als Doku klassiert.
```

## ci-005 · diff · actions

```text
      # Push-Diät (19.9.2026): liest Läufe + Jobs des merge_group-Laufs
      # (`actions/runs`). Im öffentlichen Repo auch ohne dieses Recht lesbar
      # (gemessen 19.9.2026, unauthentifiziert) — ausdrücklich gesetzt, damit
      # ein Wechsel auf «privat» die Diät nicht still abschaltet.
```

## ci-006 · diff · Push-Diät prüfen (grüner merge_group-Lauf am gepushten SHA)

```text
      # ── Push-Diät (M1, QS-CI-MINUTEN, 8.9.2026; Beleg neu 19.9.2026) ─────
      # BEFUND der 30-Tage-Messung (8.9.2026): 348 `push`-Läufe auf main à
      # Ø 51.6 min = 17'951 min = 29 % ALLER CI-Minuten — und sie prüfen einen
      # Baum, der Minuten zuvor schon grün durchgelaufen ist. Ein zweiter Lauf
      # liefert keine neue Information (§6: derselbe Baum, Golden byte-gleich).
      #
      # BELEG BIS 19.9.2026 (Historie): «gepushter Commit ist Squash-Merge
      # genau eines gemergten PR, dessen Kopf-Lauf durchgehend grün war» plus
      # die Annahme `strict: true`. Beides trägt seit dem Org-Umzug nicht
      # mehr: `strict` ist AUS (der PR-Kopf-Lauf kann veraltet sein), und bei
      # Sammel-Landungen (mehrere PRs in EINEM Push, gemessen 19.9.2026:
      # #922 + #917, Kopf 9b125ce8e) sah die Prüfung nur den Kopf-PR.
      #
      # BELEG JETZT: die Merge-Queue setzt main per Fast-Forward auf den
      # Queue-Commit, den sie getestet hat — `AFTER` IST der head_sha eines
      # `merge_group`-Laufs. Ein SHA legt Baum UND Vorgeschichte fest; ein
      # grüner Lauf an genau diesem SHA ist darum ein Beleg für genau den
      # landenden Stand, ohne jede Annahme über Aktualität. DIESER SCHRITT IST
      # DAS TOR DAZU (§6.7) und prüft gegen die API:
      #   1. Es gibt mindestens einen `merge_group`-Lauf DIESES Workflows mit
      #      head_sha == AFTER, und JEDER solche Lauf ist `completed/success`.
      #   2. In jedem dieser Läufe stehen die drei Pflicht-Kontexte, deren
      #      Wiederholung die Diät erspart bzw. die in jeder Klasse laufen —
      #      «Tore …», «Merge-Schutz …», «Browser-Smoke (Ergebnis)» — genau
      #      einmal und ausdrücklich auf `completed|success`. «Nicht rot»
      #      genügt nicht: ein fehlender, offener, übersprungener oder
      #      doppelter Kontext ⇒ `false`.
      #   3. «Perf-Budget …» steht dort auf `success` ODER `skipped`.
      #   4. ZUSÄTZLICH, nicht diät-entscheidend (Bug-Check B1, 22.9.2026 —
      #      4 von 39 Pushes): «Bau (dist-Artefakt)» UND «Perf-Budget …» beide
      #      `completed|success` ⇒ Output `bau_perf_belegt=true`; sonst leer ⇒
      #      `bau` und `perf` laufen auf push trotz Diät.
      # Jeder Fehlschlag, jede API-Störung, jeder unerwartete Wert ⇒ `false`
      # ⇒ VOLLES Programm. Zu viel zu prüfen kostet Minuten, zu wenig lässt
      # ungeprüften Code ausliefern (Vorfall #579).
      #
      # WARUM `skipped` NUR BEI PERF ZÄHLT: Seit der Queue-Klassierung
      # (Schritt oben) meldet ein Doku-/code-fern-Eintrag Perf-Budget per
      # Job-`if:` als `skipped`; verlangte die Diät dort `success`, wäre sie
      # für genau die häufigste Klasse unerreichbar. Sicher ist die Ausnahme,
      # weil die Diät `perf` gar nicht erspart: auf push entscheidet `perf`
      # weiter selbst (art == 'code' gegen die LIVE-Basis) und misst je
      # Deploy-Stand. «Browser-Smoke (Ergebnis)» braucht keine Ausnahme — der
      # Sammel-Job wertet einen begründeten Shard-Skip selbst und meldet
      # `success`; ein `skipped` DORT hiesse abgebrochener Lauf ⇒ kein Beleg.
      #
      # EIGENER LAUF: der laufende Push-Lauf hängt am selben SHA (sein `diff`
      # ist «in_progress», sein Merge-Schutz sofort `skipped`). Er kann den
      # Beleg weder liefern noch verderben, weil nur Läufe mit
      # event == merge_group gelesen werden und ihre Jobs über die Lauf-ID —
      # nie die namensgleichen Check-Runs am SHA.
      #
      # DOKU-KOPF ÜBER CODE-VORDERMANN: Landen mehrere Einträge in einem Push,
      # belegt der Lauf an AFTER nur den KOPF-Eintrag — bei einem Doku-Kopf
      # also das leichte Programm. Das genügt, weil die Queue-Klassierung nur
      # unter ALLGREEN vom Volllauf abweicht (dort hart geprüft): jeder
      # Vordermann hat dann seinen eigenen grünen Lauf auf seinem eigenen
      # Diff, sonst wäre die Gruppe nicht gelandet.
      #
      # ENTFALLEN (§17-Gegengewicht): die frühere Bedingung «AFTER ist
      # merge_commit_sha genau eines gemergten PR». Ihre Sorge «dieser Baum
      # ist geprüft» trägt der SHA-Beleg vollständig und strenger. Ihre
      # zweite Sorge «kein Direkt-/Force-Push» trägt NICHT das Ruleset:
      # GEMESSEN 19.9.2026 enthält Ruleset 23699779 nur die Regel
      # `merge_queue` (keine pull_request-/non_fast_forward-Regel); der
      # Push-Schutz kommt aus dem klassischen Branch-Schutz mit
      # `enforce_admins: false`, `allow_force_pushes: false` — ein
      # Admin-Direkt-Push bleibt technisch möglich. Getragen wird die Sorge
      # von diesem Schritt selbst: ein SHA, der nicht durch die Queue lief,
      # hat keinen grünen merge_group-Lauf ⇒ `false` ⇒ Volllauf. Ein
      # Force-Push zurück auf einen alten Queue-Commit ergäbe `true`, liefert
      # aber einen Baum aus, der damals seinen grünen merge_group-Lauf hatte —
      # kein Rückschritt gegenüber der gestrichenen Bedingung.
      #
      # WAS DIESER SCHRITT NICHT PRÜFT: dass die Queue aktiv ist. Muss er
      # nicht — ohne Queue gibt es keinen merge_group-Lauf am landenden SHA
      # (der Merge-Knopf erzeugt einen neuen Commit), die Diät fällt dann von
      # selbst auf den Volllauf. Wird ci.yml umbenannt, gilt dasselbe
      # (Pfad-Filter unten) — fail-safe, aber dann still teuer.
      #
      # EFFEKT MESSEN: `gh run list --event push --workflow CI --limit 20`
      # zeigt danach nur noch `diff`, `bau`, `perf`, `deploy` je main-Push.
```

## ci-007 · bau · if

```text
    # ── M4 (QS-CI-MINUTEN, 8.9.2026): Job-`if:` statt Leerlauf-Quittung ──────
    # BISHER lief dieser Job auch bei art=doku, mit einer einzigen echo-Zeile.
    # Begründung damals: ein übersprungenes `bau` zöge die e2e-Shards über
    # `needs:` mit in den Skip, und deren Required-Kontexte «hingen wieder an
    # einer Bedingung statt an einem Job». Diese Sorge ist EMPIRISCH widerlegt
    # — und zwar in dieser Datei selbst: «Perf-Budget (§15 …)» ist ein
    # Required-Kontext und wird durch sein Job-`if:` auf JEDEM PR-Lauf
    # übersprungen; seit 26.7.2026 mergen trotzdem alle PRs. GitHub wertet
    # einen per `if:` übersprungenen Job als erfüllt (er meldet `skipped`,
    # nicht «expected»). Der K3-Defekt betraf etwas anderes: einen WORKFLOW,
    # der wegen `paths`-Filtern gar nicht erst startete und darum GAR KEINEN
    # Check-Run meldete. Das bleibt unverändert ausgeschlossen — CI läuft bei
    # jedem Event, die Klassierung entscheidet nur den Umfang.
    # Gemessen: 218 Doku-/code-ferne Läufe in 30 Tagen à ~15.1 min, fast nur
    # Runner-Anlauf (Mindestabrechnung 1 min je Job).
    # `!cancelled()`: fällt `diff` aus, ist `art` leer — dann baut dieser Job
    # (Fehlerseite = bauen und prüfen, nicht überspringen).
    #
    # PUSH-DIÄT auf `bau` und `perf` (M1-Nachtrag, QS-CI-MINUTEN, 21.9.2026;
    # Bug-Check-Auflage B1 vom 22.9.2026 eingearbeitet): auf main laufen beide
    # nicht ein drittes Mal, WENN der merge_group-Lauf am gepushten SHA sie
    # ECHT grün gefahren hat — Output `bau_perf_belegt` des Schritts «Push-Diät
    # prüfen» (nur `completed|success`; `push_diaet` allein genügt NICHT: die
    # Diät akzeptiert Perf-Budget auch als `skipped` und liest `Bau` gar nicht —
    # gemessen 21.9.2026: in 4 von 39 deployenden Pushes hatte der Queue-Lauf
    # beide übersprungen). GEPRÜFT (Chesterton): `deploy` lädt das
    # `dist`-Artefakt NICHT (s. BUILD-PARITÄT dort) — `bau` war dort nur
    # Korrektheits-Gate; `deploy` nimmt darum `success` ODER `skipped`.
```

## ci-008 · bau · uses: actions/checkout@v7

```text
      # `code-fern` (Punkt 3, QS-PLAN-EINFACH 14.8.2026) baut VOLL wie `code` —
      # es überspringt nur die Browser-Shards weiter unten, Bau und Tore sind
      # unverändert Pflicht.
```

## ci-009 · tore · if

```text
    # ── M1 (QS-CI-MINUTEN, 8.9.2026): kein zweiter Lauf auf main ────────────
    # Auf `push` nach main läuft dieser Job nur noch, wenn die Push-Diät NICHT
    # greift — also wenn am gepushten SHA KEIN grüner `merge_group`-Lauf
    # belegt ist (Direkt-Push, Queue aus, rote/fehlende Pflicht-Kontexte,
    # API-Störung; bis 19.9.2026: «nicht als grüner PR geprüft»). Die harte Prüfung samt Fehlerseite sitzt im Schritt
    # «Push-Diät prüfen» des `diff`-Jobs. `pull_request`, `merge_group` und
    # `workflow_dispatch` sind unberührt und fahren unverändert voll.
    # `!cancelled()` statt der Standard-Skip-Logik: fällt `diff` selbst aus,
    # ist `push_diaet` leer — dann läuft dieser Job (Fehlerseite = prüfen).
```

## ci-010 · tore · TZ

```text
      # Produkt-Zeitzone: Engines geben teils Date-Instants zurück (z. B.
      # kuendigungsfrist beendigungsdatum); Golden-Basis ist in Zürich
      # erzeugt, und die TZ-Bugklasse vom 7.6.2026 feuerte NUR in
      # Europe/Zurich — UTC-CI maskierte sie. CI rechnet darum wie die
      # Nutzer in der Schweiz.
```

## ci-011 · tore · uses: actions/checkout@v7

```text
      # fetch-depth: 0 — check:merge-schutz bildet merge-base(origin/main, HEAD).
      # Mit dem Default (depth 1) gibt es keine gemeinsame Basis und das Tor
      # wuerde (korrekt) rot melden, dass es seine Referenz nicht bilden kann.
```

## ci-012 · tore · Merge-Schutz (Gegenprüfungs-Verdikt auf Risikopfaden)

```text
      # Merge-Sperre auf Risikopfaden (F1, Vorfall PR #309). Lief bis 20.7.2026
      # NUR im lokalen PreToolUse-Hook — Web-UI-Merge, `gh api …/merge` und die
      # Zeitluecke von `gh pr merge --auto` waren damit ungedeckt. Hier ist das
      # Tor maschinenunabhaengig; als Required Check wird es zur echten Schranke
      # (Branch-Regel setzt David, DAVID-GATE).
      #
      # DIESE BEIDEN SCHRITTE LAUFEN IMMER — auch bei art=doku. Die Begründung
      # stammt aus ci-doku-noop.yml (dort Z. 7–11 bzw. 71–75) und gilt
      # unverändert weiter:
      #   Merge-Schutz: md-only-Diffs können den Risikopfad `daten/**` treffen
      #     (istRisikoPfad matcht das Präfix, nicht die Endung), und das
      #     Gegenprüfungs-Register SELBST ist eine .md. Diese Klasse darf nicht
      #     still grün gemeldet werden (§6.7 lit. b).
      #   check:plan: reine .md-PRs sind genau die Klasse, die @meta-Waisen
      #     erzeugt (ROADMAP.md/STRUKTUR.md ohne Code) — 3 Waisen mergten grün,
      #     weil check:plan nirgends in CI lief.
```

## ci-013 · tore · Fachänderungs-Riegel (§6.3 + Fachaenderung-Trailer)

```text
      # RL-03 (ersetzt check:testtreue); im PR zählt der PR-Body (Queue-Squash).
      # R1 prüft im pull_request-Lauf zusätzlich den PR-Titel als künftigen
      # Squash-Betreff (GITHUB_EVENT_PATH, PR #1026, Beleg Queue-Rauswurf #1023).
```

## ci-014 · tore · Squash-Schutz (kein [skip ci] in PR-Commits)

```text
      # Squash-Falle (Beleg 7.9.2026, PR #739): GitHub setzt beim Squash-Merge ALLE
      # Commit-Betreffs des PR in die Commit-Message von main. Trägt EINER davon
      # `[skip ci]`, überspringt GitHub auf main jeden Workflow — kein CI, KEIN
      # DEPLOY (damals auch keine Plan-Buchung — `plan-buchung.yml` ist seit
      # 20.9.2026 abgebaut); der nächste Doku-Push meldet dann art=doku und
      # deployt ebenfalls nicht. e2ac7def9 (287 Dateien) lag so unausgeliefert.
      # Darum Required-Tor: kein Commit im PR darf `[skip ci]`/`[ci skip]` tragen.
```

## ci-015 · tore · Fremd-PR-Tor (Dateigrenzen + Kommentar-Bilanz, Jules-Branches)

```text
      # Fremd-PR-Tor (T6, 3.9.2026, fahrplaene/FAHRPLAN-FREMDAGENTEN.md §2) für
      # Jules-Branches (19-stellige Task-ID oder Präfix `jules-`/`jules/`; nie
      # «jules irgendwo», Beleg PR #656). Die Assertion-Regel ging am 23.9.2026
      # (RL-03) in check:fachaenderung auf; Rest: Dateigrenze src/** und
      # Kommentar-Bilanz (Regel 3/3b, Belege PR #662, #855/#857 — Details im
      # Kopf von scripts/analyse/kommentar-bilanz.ts).
```

## ci-016 · tore · Steuerungs-Deckel (Byte-Budgets Steuer-Doku + Wächter-Flächen)

```text
      # Steuerungs-Deckel (David 15.8.2026 «Steuerungszuwachs minimieren, und
      # darauf achten, dass es immer so bleibt»): Byte-Budgets für STRUKTUR/
      # ROADMAP/CLAUDE UND die Flächen .claude/hooks + scripts/check-*.ts.
      # Reisst er, ist vor dem nächsten Wächter ein Rückbau fällig — bewusst
      # als Tor, nicht als Hinweis (Prosa-Deckel hielt seit 8.8. nicht).
```

## ci-017 · tore · Steuerungs-Fläche (Sperrklinke, Byte-Summe + Anhebungs-Schutz)

```text
      # Sperrklinke über die GESAMTE Steuerungs-Fläche (Entscheid David
      # 20.9.2026). Der Deckel darüber misst zwei Globs — am 19./20.9.2026 wich
      # neue Steuerungs-Logik zweimal in Nachbar-Ordner aus. Dieses Tor summiert
      # alle Steuerungs-Dateien und lässt die Grenze nur SINKEN (Anhebung
      # braucht einen datierten David-Entscheid in `anhebungen`).
      # LÄUFT IMMER (auch art=doku) — aus demselben Grund wie check:plan und
      # check:steuerdeckel: die Steuerungs-Fläche ist überwiegend .md, ein
      # md-only-PR ist genau die Klasse, die sie wachsen lässt.
      # Braucht `origin/main` für die Klinke — der Checkout dieses Jobs steht
      # auf `fetch-depth: 0` (s. oben, wegen check:merge-schutz). Ohne Basis
      # prüft das Tor nur die Summe und sagt das ausdrücklich.
```

## ci-018 · tore · Tests (volle Ausgabe)

```text
      # tsc -b läuft im bau-Job (Teil von npm run build). KEIN dist-Download
      # hier: kein einziger tore-Check liest dist/ (Review 26.7.2026 — smoke
      # rendert SSR aus src, seo-index liest ROOT/index.html; Tests/Lint liefen
      # schon im alten Monojob VOR dem Build). Darum auch kein `needs: bau` —
      # tore startet sofort, parallel zu bau.
```

## ci-019 · tore · Bibliotheks-Standards (S1–S10)

```text
      # ── Katalog-Inventur ENTFERNT (14.8.2026, QS-PLAN-EINFACH) ──────────────
      # Das Skript hat keinen Abbruchpfad und konnte nie rot werden (§6.7) —
      # es heisst jetzt ehrlich `report:inventur` und läuft auf Abruf.
      # LÄUFT IMMER (auch art=doku), seit Bug-Check #626 (2.9.2026): ein reiner
      # bibliothek/**-Diff ist selbst .md-only und wurde vom `art != 'doku'`-
      # Gate bisher komplett übersprungen — das einzige md-lesende Tor, das
      # NICHT wie check:plan/check:steuerdeckel schon unconditional lief.
```

## ci-020 · tore · Abnahme-Dossiers synchron zu den Schemas (§5-Projektion)

```text
      # ── check:verfall STEHT HIER BEWUSST NICHT MEHR (3.8.2026, K7) ──────────
      # Es ist das einzige Tor im PR-Pfad, dessen Ergebnis von der WANDUHR
      # abhängt statt vom Diff: `verfall-pruefen.ts` vergleicht das Register
      # gegen `new Date()`. Läuft ein Registertermin ab, färbt es schlagartig
      # ALLE offenen PRs rot — ohne dass einer davon etwas damit zu tun hätte.
      # BELEG: Lauf 30764225649 (2.8.2026, Branch claude/sleepy-mestorf-5dbea7)
      # scheiterte im Tore-Job an «VERFALLEN 2026-08-01 Künftige Fassung BüV /
      # ZEMIS-V» — ein Rechtsstands-Befund, kein Fehler dieses PR.
      #
      # R1-ABGRENZUNG (Tore streichen ist die falsche Vereinfachung): Das Tor
      # wird VERSCHOBEN, nicht gestrichen. Es läuft weiterhin
      #   · wöchentlich in normen-monitor.yml (dort mit Vorlauf-Warnung),
      #   · in fedlex-frische.yml vor jedem Reparatur-PR,
      #   · und vor jedem Deploy lokal in `check:seriell`.
      #
      # NACHTRAG 15.8.2026 (QS-AUTOMATIK-PARITAET): Der frühere Satz «check:tor-
      # paritaet bleibt grün, weil es ALLE Workflows scannt» gilt NICHT mehr —
      # genau diese Gleichsetzung von Wächter- mit PR-Deckung war der #425-
      # Defekt. Die Sonde unterscheidet jetzt beides; `check:verfall` trägt
      # darum einen ausdrücklichen ALLOWLIST-Eintrag mit den zwei Wächtern als
      # benannten Ersatz-Arbitern. Die Abdeckung ist damit weiterhin maschinell
      # gebunden, aber als BEWUSSTE Ausnahme deklariert statt stillschweigend
      # mitgezählt. Die Wanduhr-Begründung oben ist unverändert der Grund.
```

## ci-021 · tore · Spruchkörper-Projektion (Leak · Konsistenz · Determinismus)

```text
      # ── Tore, die bis 20.7.2026 auf der Paritaets-Allowlist standen ──────
      # Die Begruendung «braucht rechtsprechung.db (488 MB, nicht im CI-
      # Checkout)» war fuer diese drei sachlich falsch: sie lesen die
      # COMMITTETEN Projektionen unter public/rechtsprechung/ (5121 Dateien,
      # ladeBestandSnapshots), nicht die DB. Gemessen 20.7.2026: je ~1 s,
      # gruen unter CI=1. check:besetzung ist das Tor, das die 11 erfundenen
      # Amtstraeger:innen aus #309 faengt — es war ausgerechnet unsichtbar.
```

## ci-022 · tore · normKeys-Abdeckung (Verzahnung Rechtsprechung ↔ Gesetz)

```text
      # Sichtbarkeits-Tor der Verzahnung (W2·6-NKEY c): zaehlt, wie viele
      # Gesetzes-Zitate des Korpus KEINEN Register-key finden. Ohne dieses Tor
      # verschwindet ein nicht zugeordnetes Zitat lautlos — kein Fehler, kein
      # Log, nur ein Leitfall, der beim Artikel nie erscheint (§6.7).
      # Liest wie die drei Tore darueber nur die committeten Projektionen unter
      # public/rechtsprechung/, keine DB, kein Netz.
```

## ci-023 · tore · Bezugs-Schicht (Facetten · Projektion · Grundgesamtheit)

```text
      # Bezugs-Schicht (W2·7-BEZUG B1-B3): prueft, dass die Bundesgerichts-Sicht
      # der Facetten-Shards die bestehende Artikel-Ebene EXAKT nachrechnet (also
      # EIN Rechenweg, kein Parallelmodell), dass jede Kante aufloesbar ist und
      # dass keine Deckel- oder Grundgesamtheits-Zahl luegt. Liest wie die Tore
      # darueber nur die committeten Projektionen, keine DB, kein Netz.
```

## ci-024 · tore · Kantonale Zitat-Bruecke (Referenz-Integritaet)

```text
      # N0a: die Gegenrichtung der Bezugs-Shards (Entscheid -> kantonaler
      # Erlass). Eigener Schreib-Zweig, darum eigenes Tor: eine Projektion,
      # die niemand gegen ihre Bezugsgroessen haelt, driftet still.
```

## ci-025 · tore · Tor-Parität (CI/lokal)

```text
      # Selbstschutz der Tor-Landschaft: meldet neue Tore ohne CI-Lauf.
      # Lief selbst nur lokal — der Melder war damit so unsichtbar wie der
      # Defekt, den er meldet (F2b rekursiv).
```

## ci-026 · tore · Lizenz-Tor (Abhängigkeiten)

```text
      # Lizenz-Tor (QS-VERWENDEN V1b, 2.9.2026): prüft ALLE installierten
      # Abhängigkeiten (prod + dev) gegen die Allowlist permissiver Lizenzen —
      # unabhängig vom Diff-Inhalt (npm ls --all liest node_modules, nicht den
      # PR-Diff), darum ohne die art!=doku-Schranke der Nachbar-Tore. Vorher
      # nur lokal in check:seriell/gate — Verdrahtung war Folgeschritt V1b.
```

## ci-027 · tore · Darstellungs-Kanon (Tokens · Drift · Farbwelt · Linien · p-Klassen)

```text
      # ── R1-Nachzug (20.7.2026): die bis dahin unsichtbaren Tore ─────────────
      # Das Tor-Wirksamkeits-Audit (bibliothek/, PR #318) hat die 20 Allowlist-
      # Begruendungen per Sabotage geprueft: 17 halten NICHT, 2 sind gar keine
      # Begruendung, 1 haelt. Sechs Proben, sechsmal dasselbe Bild — zustaendiges
      # Tor ROT, behaupteter Ersatz GRUEN (bei "vom lint mitabgedeckt" war die
      # lint-Ausgabe sogar byte-identisch zur Baseline). Die 9x behauptete
      # Delegation an fedlex-frische.yml scheitert dreifach: der Workflow faehrt
      # diese Tore nicht, faengt die Fehlerklasse nicht, und lief genau einmal —
      # mit failure.
      # Kostenargument gibt es keines: alle zusammen laufen unter CI=1 in ~10 s.
      # Und: check:besetzung — das Tor, das die 11 erfundenen Amtstraeger:innen
      # fing — stand selbst auf dieser Liste. Diese Tore sind nicht ertragsarm,
      # sie waren unsichtbar.
      # `check:tokens-drift` (W2·29-WERKBANK-TOKENS, 22.9.2026): Drift-Tor der
      # EINEN Token-Quelle `design/tokens.json` gegen ihre zwei Projektionen —
      # die Marker-Bloecke in `src/index.css` und `tailwind.tokens.generated.js`.
      # Es traegt zusaetzlich die Doppel-Definitions-Wache: kein Token darf
      # ausserhalb der Marker ein zweites Mal definiert sein (§5). Offline, ~1 s.
      # Nachtrag `check:segmente` (QS-KORPUS, 25.9.2026, ergaenzt — die Zeiten
      # oben bleiben Beleg ihres Stands): an diesen Schritt angehaengt, Modus B
      # (ohne Cache) lokal 22–23 s warm unter Parallel-Last (vor G11: 44–58 s),
      # nicht im «~10 s» oben enthalten; Linux-CI-Laufzeit noch nicht gemessen.
```

## ci-028 · tore · UI-Normzitate (Korpus-Abgleich)

```text
      # UI-Normzitate gegen den Korpus (QS-CODE-AUSSENKANTEN, 4.8.2026): die
      # ~740 hart kodierten Art.-Zitate der Darstellungsschicht sind eine
      # zweite Norm-Quelle — jedes muss im committeten Snapshot des zitierten
      # Erlasses existieren. Offline, Basislinien-Modell, eingebauter §6.7-
      # Selbsttest (synthetisches Falsch-Zitat muss rot werden).
```

## ci-029 · tore · Verweis-Inventar (Basislinie)

```text
      # Verweis-Inventar (V-1, W2·20-VERWEIS-SCHAERFE, 31.8.2026): wie viele
      # Verweis-Stellen der Normtext-Korpus trägt und wie der Leser sie auflöst
      # (SELF/FREMD/TEXT je Formklasse), gegen eine committete Basislinie.
      # Offline, ~1 s über alle 1458 Snapshots. Muss VOR den Merge: die Guards
      # der Auflösung sind im Tor TRANSKRIBIERT, und nur hier fällt auf, wenn
      # jemand `NormText.tsx` ändert, ohne die Messung nachzuziehen (SHA-Anker).
```

## ci-030 · tore · Artikel-Bestand (Projektion gegen Snapshots)

```text
      # Artikel-Bestand (Z6c, W2·22, 14.9.2026): Drift-Tor der generierten
      # Projektion `src/lib/normtext/artikel-bestand.generated.ts` gegen die
      # Bund-Snapshots, aus denen sie entsteht (§5). Sie entscheidet in der
      # Auslieferung, ob ein Fremd-Verweis einen Artikel-Anker bekommt oder auf
      # den Erlass-Link zurückfällt — driftet sie, wird aus einem lebenden Ziel
      # still ein totes (oder umgekehrt). Offline, liest nur Committetes.
      # Verdrahtet als Nachzug zum Gegenprüfungs-Befund B: das Tor EXISTIERTE,
      # lief aber in keinem einzigen Lauf (§6.7 — ein Tor, das nicht scheitern
      # kann, ist gefährlicher als keines). Seither bindet Regel (6) von
      # check:tor-paritaet jedes check:*-Skript maschinell an einen Lauf.
```

## ci-031 · tore · Sediment (tote Klassen · verwaiste Module · doppelte Metadaten)

```text
      # Sediment (W2·29-WERKBANK-TOR, 22.9.2026): tote CSS-Klassen, verwaiste
      # Module (knip) und doppelte Rechner-Metadaten (Registry gegen Katalog,
      # §5). Offline, ~3 s. Der Werkbank-Umbau legt Rubrik fuer Rubrik ein neues
      # Aussehen an Ort — ohne diese Wache bleibt bei jeder Runde Rueckstand
      # liegen. Keine Baseline, keine Ausnahmeliste (Rats-Verdikt Auflage 3).
```

## ci-032 · tore · Entstehung (Deckel · Anker-Provenienz · Deckung je Erlass)

```text
      # Entstehung am Artikel (W2·6c, FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.6): Deckel je
      # Klasse, Anker-Provenienz, Curia-Zustandsträger, Deckungs-Diagnose je Erlass.
      # Vollständig offline (~2 s) und deshalb PR-Pflicht — `check:tor-paritaet` verlangt
      # für jedes Tor aus `check:seriell` eine pull_request-Deckung.
```

## ci-033 · tore · Kantonale Materialien BS (Herkunft · Personendaten · Reproduktion)

```text
      # Kantonale Materialien BS (K-16, W2·13-KANTONE-DATEN): Personendaten-Verbot,
      # Herkunft jeder Erlass-Verknüpfung (amtlich nur aus der Fussnote), byte-gleiche
      # Reproduktion des Generats aus der committeten Roh-Ablage, Deckel. Vollständig
      # offline (~2 s, keine DB, kein Netz) — anders als `check:materialien`, das für
      # die Byte-Reprojektion `daten/*.db` braucht und darum auf der Allowlist von
      # check:tor-paritaet steht. Hier gibt es keinen Grund für eine Ausnahme: ein
      # Tor, das eine maschinelle Zuordnung als amtlich entlarvt, gehört VOR den
      # Merge, nicht in einen Wächter danach (#425).
```

## ci-034 · tore · ZH-Vollständigkeit (Artefakt-Teil, ohne PDF)

```text
      # ZH-Vollständigkeit, ARTEFAKT-Teil (ZH-Fix-Runde 3, B7). Das Tor hält den
      # Snapshot gegen das amtliche PDF; sein PDF-Teil braucht den Roh-PDF-Cache
      # `daten/pdf-cache-zh/` (gitignored) und läuft darum lokal im `gate` und
      # im Netz-Teil unter `check:netz`. Was OHNE PDF entscheidbar ist — kein
      # Block endet auf einem Trennstrich, kein Gliederungstitel steht im
      # Normtext —, gehört in jeden PR: genau diese zwei Klassen sind in den
      # Runden 1–3 dreimal aufgetreten.
```

## ci-035 · tore · ZH-Randtitel (Artefakt-Teil, ohne PDF)

```text
      # Randtitel/Gliederung der ZH-Sidecars (R1, 2.9.2026). Der Artefakt-Teil
      # braucht kein PDF: er haelt die Sidecars gegen die Snapshots und gegen
      # die eingefrorene Deckungs-Messreihe. Die Zweitlesung aus dem Roh-PDF
      # laeuft lokal im `gate` (Cache ist gitignored).
```

## ci-036 · tore · Normtext-Korpus (Drift/Coverage · Struktur-Konsistenz · Verklebung · Stand-Zukunft)

```text
      # Verdrahtet 15.8.2026 (QS-AUTOMATIK-PARITAET lit. b): diese drei standen
      # bis dahin NUR in fedlex-frische.yml — einem schedule-Workflow. Das ist
      # Wächter-, nicht PR-Deckung: er meldet Korpus-Drift erst NACH dem Merge
      # und kann keinen verhindern (Fehlerklasse #425). Ein PR, der Snapshots
      # oder Struktur-Sidecars ändert, blieb hier ungeprüft.
      # Alle drei lesen offline nur die committeten Projektionen unter
      # public/normtext/** (kein daten/*.db, kein Netz) und sind wanduhr-
      # unabhängig — anders als check:verfall oben. Gemessen 15.8.2026 unter
      # CI=1: 0.6 s + 0.9 s + 0.4 s = rund 2 s zusammen.
      # `check:stand-zukunft` steht hier seit 29.8.2026 (Gegenprüfung PR #572,
      # Befunde B1/B5). Es prüft die quellenunabhängige Invariante «kein Stand
      # liegt nach seinem Abrufdatum» über alle rund 56'000 Snapshot-Einträge und
      # fing bei seiner Einführung genau die zwei falsch datierten Erlasse:
      # TI-ti-181 (stand 2027-01-01 statt 17.5.2024, aus dem Ankündigungs-
      # Abschnitt «PROSSIME VARIAZIONI») und SZ-213.512 (stand 2027-02-01, aus
      # der SRSZ-Ausgabemarke — vorbestehend auf main). Offline, wanduhr-
      # UNabhängig (Referenz ist das committete `abgerufen`, nicht die Systemzeit
      # — darum färbt es anders als check:verfall keine fremden PRs rot).
      # Gemessen 29.8.2026: unter 1 s.
```

## ci-037 · tore · Normtext-Leerstellen (aufgehoben strukturell, Zuwachs-Riegel)

```text
      # W2·27 (14.9.2026): eine «ungeklärte Leerstelle» ist ein Artikel mit leerem
      # bzw. «…»-Body, den die amtliche Fedlex-Fussnote NICHT als aufgehoben
      # ausweist — die exakte Signatur eines Extraktionsfehlers, die bis hierher
      # still als «aufgehoben» angezeigt wurde (§7/§8). Das Tor hält die Menge auf
      # ihrer committeten Basislinie fest (Bund 98, Kanton 481) und faerbt bei
      # ZUWACHS je Erlass rot — nicht bloss in der Summe. Offline, <2 s.
```

## ci-038 · tore · Confidence-Frische (korpus.sha ↔ daten-manifest.json)

```text
      # Wurzel-Fix Prüfer-Befund #848 (15.9.2026, §17): confidence.json trug
      # nur ein von Hand gesetztes `erzeugt`-Datum, gekoppelt an nichts — alterte
      # 3 Monate unbemerkt. Prüft korpus.sha (aus daten-manifest.json) und die
      # Erlass-Anzahl gegen den aktuellen Dateibestand. Offline, <1 s.
```

## ci-039 · tore · Golden-Vollständigkeit (Normtext-Index ⊇⊆ Snapshots)

```text
      # Das §6-Beweismittel selbst: golden/normtext-snapshot.json wird vom
      # Generator PAUSCHAL ueberschrieben (PR #383 Runde 2: 55'763 -> 32'639
      # Eintraege aus einem partiellen Korpus) und wurde bis 27.7.2026 von KEINEM
      # Tor gelesen. Laeuft offline in <1 s.
```

## ci-040 · tore · Datenhaltungs-Manifest · Byte-Parität DB↔Projektion · Feed

```text
      # Verdrahtet 4.8.2026 (F2b-Vorfall #425): 226 geänderte Normtext-Snapshots
      # ohne daten-manifest.json-Nachzug passierten das PR-CI grün — die Drift
      # meldete erst der POST-merge-Wächter turso-sync.yml (rot 21:52, Serving-
      # Sync blockiert). In-Memory-Ingest, ~21 s auf dem CI-Runner (gemessen
      # Lauf 30856208988), kein daten/*.db nötig.
      # check:paritaet kam 15.8.2026 dazu (QS-AUTOMATIK-PARITAET lit. b) — es
      # gehört zur selben Fehlerklasse und derselben Mechanik wie das Tor
      # daneben: Es baut drei In-Memory-DBs aus den committeten JSONs und
      # beweist, dass jede der 8377 Dateien byte-gleich zurückprojiziert wird.
      # Auch dieses Tor lief bis dahin nur in fedlex-frische.yml (Wächter, post
      # merge). Gemessen 15.8.2026 unter CI=1: 3.4 s, kein daten/*.db nötig.
      # check:feed kam 5.9.2026 dazu (QS-VERWENDEN V5b, Nachzug zu H-2/2.9.2026):
      # bis dahin stand es NUR in der Allowlist von check-tor-paritaet.ts, mit dem
      # Vermerk, die Verdrahtung sei ein eigener nachgelagerter Schritt. Prüft
      # `public/feed.xml` gegen den deterministischen Generator (`--check`,
      # keine Netz-/DB-Abhängigkeit) — dieselbe Fehlerklasse wie das Tor daneben.
```

## ci-041 · e2e · if

```text
    # ── M4 (QS-CI-MINUTEN, 8.9.2026): Job-`if:` statt Leerlauf-Quittung ──────
    # Bei art=doku ODER art=code-fern liefen die Shard-Jobs bisher nur an, um
    # eine echo-Zeile zu melden — 4 × 1 min Mindestabrechnung je Lauf, ohne
    # einen einzigen Test. Begründung und Beleg, warum ein per `if:`
    # übersprungener Job den Required-Kontext trotzdem erfüllt: im `bau`-Job
    # oben. Fachlich ändert sich NICHTS: bei doku/code-fern liefen hier auch
    # vorher keine Browser-Tests (`code-fern`-Flächen berühren die
    # ausgelieferte App nachweislich nicht, Bau + alle Node-Tore laufen für sie
    # trotzdem voll).
    # Dazu die Push-Diät (M1): auf main läuft kein zweites Mal, was der
    # merge_group-Lauf am selben SHA schon grün gefahren hat (bis 19.9.2026:
    # der PR-Lauf).
    # Die Klassen stehen bewusst als NEGATIV-Liste (`!= doku`, `!= code-fern`)
    # statt als `== code`: fällt `diff` aus, ist `art` leer — dann laufen die
    # Shards (Fehlerseite = prüfen). `bau` muss erfolgreich sein, sonst gibt
    # es kein dist-Artefakt.
```

## ci-042 · e2e · timeout-minutes

```text
    # Harter Deckel je Shard (QS-E2E-STABIL, Beleg 7.8.2026). Ohne Angabe gilt der
    # GitHub-Default von 360 min — ein systemisch hängender Shard hätte also bis zu
    # SECHS Stunden Runner-Zeit gebrannt und die Merge-Kette so lange blockiert.
    # Gemessen (M3, 8.9.2026): ein grüner Shard braucht ~7.8–8.6 min Testzeit plus
    # ~1.3 min Rüstzeit (npx -y npm@11 ci, Chromium, dist-Download) — vor der
    # Halbierung der Shard-Zahl waren es ~4.2 min Testzeit. 25 min bleiben
    # UNVERÄNDERT (bewusst nicht angehoben, §17-Gegengewicht: einen Deckel
    # lockert man nicht nebenbei): Worst case ist 10 min apt-Stall + 8.6 min
    # Tests + 1.3 min Rüstzeit = 19.9 min, der Deckel schlägt also weiterhin
    # nur zu, wenn etwas grundsätzlich klemmt.
    # KORREKTUR-NACHTRAG 8.9.2026 (die M3-Zahl darüber bleibt als Beleg ihres
    # Standes stehen, §0 Ziff. 2b — sie war eine Prognose aus dem 30-Tage-
    # Durchschnitt und ist durch die Direktmessung überholt): der Durchschnitt
    # war schon bei der Verschmelzung veraltet, weil die R8-/A11y-Specs vom
    # 6./7.9. die Gesamt-Testzeit fast verdoppelt haben. GEMESSEN am grünen
    # 8-Shard-Lauf 34209371435 (alle acht JSON-Reports, 152 Specs): 58.7 min
    # Testzeit im Erstversuch — nicht ~33 min. Die M3-Gruppen liefen damit
    # 13.8 / 25.8 / 11.5 / 12.6 min; Gruppe 2 riss den Deckel hier zweimal
    # (Lauf 34208005217), und zwar VÖLLIG ZU RECHT: nicht der Deckel war zu
    # eng, die Packung war schief. Nach der LPT-Neupackung (s. `_kommentar` in
    # e2e/shard-gruppen.json) tragen alle vier Gruppen je 14.7 min.
    # 25 min bleiben WEITERHIN unverändert: 14.7 min Tests + ~1.3 min Rüstzeit
    # = 16 min, und selbst eine volle Wiederholung von kein-abschnitt.e2e.ts
    # in Gruppe 2 landet bei 20.7 min. Ein Deckel wird nicht angehoben, damit
    # etwas durchläuft — er wird angehoben, wenn die Messung zeigt, dass die
    # ehrliche Arbeit nicht mehr hineinpasst. Sie passt.
    # ROT BLEIBT ROT: der Deckel bricht ab und meldet FEHLGESCHLAGEN — er macht
    # nichts grün, er kürzt nur die Brenndauer (§17: Wurzel-Deckel statt Umschiffen).
    # NACHTRAG (Opus-Gegenprüfung PR #785, read-only, 8.9.2026 — Auflage B1):
    # scripts/ci/playwright-install.sh rechnet jetzt mit bis zu
    # 2 × (30 s Sperre + 240 s Install + 15 s Kill-Kulanz) + 60 s
    # dpkg-Configure-Vorlauf ≈ 630 s (10,5 min) Worst Case — Rechnung im
    # Skript-Kopf. Das reisst die bisherige Reserve von 540 s (25 min − 16 min
    # Regelfall Tests+Rüstzeit, s. oben): Deckel darum auf 28 min angehoben,
    # neue Reserve 720 s ≥ 630 s Rechnung (Puffer 90 s).
```

## ci-043 · e2e · e2e-Shard-Union-Wächter (Gruppen == playwright --list)

```text
      # Union-Wächter VOR den Shards: beweist, dass die Gruppen in
      # e2e/shard-gruppen.json exakt die von Playwright gesammelte Spec-Menge
      # abdecken (kein Test doppelt, keiner verloren). Läuft in jedem Matrix-Job
      # (billig, `playwright --list` ohne Browser/Server) — reisst die Kette,
      # bevor eine unbalancierte oder lückenhafte Verteilung Tests verschluckt.
```

## ci-044 · e2e · Playwright-Browser (Chromium)

```text
      # Ein Mirror-Stall im apt-Teil von `--with-deps` hat am 5.9.2026 den
      # Shard 5 gekippt: `Fetched 21.1 MB in 22min 56s (15.3 kB/s)` —
      # xfonts-scalable tröpfelte von azure.archive.ubuntu.com, während die
      # sieben übrigen Shards DESSELBEN Laufs dieselben Pakete in 0–8 s holten
      # (Lauf 33937186925, Job 101227653560). Der Playwright-Lauf startete
      # darum erst 02:14:11 — 24 min nach Job-Start — und wurde 50 s später
      # vom 25-min-Deckel gekappt: «cancelled», kein einziger Test bewertet.
      # Die Ursache ist NICHT der Spec-Inhalt; es ist genau die
      # Runner-Stall-Klasse, die `e2e/shard-gruppen.json` am 15.8.2026 als
      # offenen §17-Punkt notiert hat («Indiz für Runner-Queueing/Kontention,
      # nicht für eine Spec-Schieflage») — hier zum ersten Mal mit Log-Beleg.
      #
      # WURZEL-FIX statt Deckel-Erhöhung: je Versuch ein hartes 5-min-Limit,
      # zwei Versuche. Ein hängender Spiegel kostet damit 10 statt 23 min, und
      # der Retry ist billig — apt hat die bereits geholten .debs im Cache.
      # Rechnung gegen den 25-min-Job-Deckel: 10 min Install (worst case)
      # + ~8 min langsamster Shard + ~2 min Rüstzeit = 20 min, der Deckel
      # bleibt also scharf. ROT BLEIBT ROT (§6.7): scheitern beide Versuche,
      # endet der Schritt rot mit ::error — die Schriftart-Pakete werden NICHT
      # übersprungen, weil fehlende Fonts die Pixel-Vergleiche still verschöben.
      #
      # NACHTRAG 8.9.2026 (§17-Wurzel-Fix, Lauf 34241159277, Job 102112456997,
      # PR #779): Versuch 1 lief ins 5-min-Limit; `timeout` tötete nur den
      # direkten Kindprozess (npx) — das per sudo (eigene PTY-Session) von
      # Playwright gestartete `apt-get` (PID 2785) lief als Waise weiter und
      # hielt /var/lib/dpkg/lock-frontend. Versuch 2 scheiterte binnen 3 s:
      # «E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by
      # process 2785 (apt-get)» → «Installation process exited with code:
      # 100». Der Retry war damit strukturell wirkungslos.
      #
      # NACHBESSERUNG PR #785 (September 2026): der Kill-und-Retry-Block ist
      # nach scripts/ci/playwright-install.sh ausgelagert (§5 Single Source of
      # Truth — der Perf-Budget-Job unten ruft dieselbe Datei auf und bekommt
      # denselben Schutz); dort auch Rationale + Zeitbudget-Rechnung für die
      # dpkg-Sperre, den dpkg-Configure-Vorlauf und den Prozessgruppen-Kill.
```

## ci-045 · e2e · Browser-Smoke (Playwright, e2e/ gegen dist — Gruppe ${{ matrix.gruppe }}/8)

```text
      # `npm run preview` serviert das heruntergeladene dist/ (kein Rebuild);
      # jeder Job fährt nur die Specs SEINER dauer-gepackten Gruppe seriell
      # (workers:1 bleibt, damit die Contention NICHT in EINEN Runner zurückkehrt)
      # → e2e-Wand auf acht Gruppen verteilt (seit 21.9.2026). Die Dauern im
      # Block über der Matrix stammen aus der 4-Gruppen-Phase; für 8 Gruppen
      # ist die Packung noch nicht geeicht (Posten LPT).
```

## ci-046 · e2e · Playwright-JSON-Report ablegen (Shard-Balancing-Datengrundlage)

```text
      # Per-Spec-CI-Dauern sichern (auch bei rotem Shard — gerade dann sind sie
      # interessant). Damit lässt sich `e2e/shard-gruppen.json` künftig gegen
      # GEMESSENE CI-Zeiten packen statt gegen lokale, die nicht uniform skalieren
      # (a33: lokal 92 s, CI ~360 s). Begründung in playwright.config.ts.
      # continue-on-error (QS-CI-MINUTEN, 8.9.2026): Lauf 34246217673, Job
      # 102130311970 (Shard 3/4, PR #783) — Tests grün (2 flaky, Melde-Modus),
      # der Upload aber rot mit «Failed to FinalizeArtifact: Received
      # non-retryable error: Failed request: (403) Forbidden: Error from
      # intermediary», während die drei anderen Shards mit demselben Token
      # hochluden — transienter Speicherfehler des Anbieters. Diese Datei ist
      # nur Datengrundlage fürs Shard-Balancing, kein Tor: der Flacker-Wächter
      # oben liest `playwright-report.json` LOKAL im selben Shard, kein Job
      # lädt dieses Artefakt herunter (die zwei `download-artifact`-Schritte
      # im Workflow holen `dist`, nicht diesen Report). Ein Ablage-Fehler darf
      # eine bestandene Prüfung nicht rot färben.
```

## ci-047 · e2e · Flacker-Wächter (Retry-Grün ist kein Grün)

```text
      # ── Flacker-Wächter (QS-CI-MINUTEN, 8.9.2026) ────────────────────────
      # Playwright fährt hier `retries: 2`. Ein Test, der im Erstversuch rot
      # und im zweiten grün ist, zählt als `flaky`: der Prozess endet mit
      # Exit 0, der Job wird «success», GitHub meldet grün. Genau so verdeckte
      # Lauf 34209371435 (Shard 8/8) den echten Defekt
      # `a-ueberlauf-ohne-scroller` — Attempt 0 rot, Attempt 1 grün, Gesamt
      # «success». Ein Lauf, der nur im Wiederholungsversuch grün wird, ist
      # kein grüner Lauf. Der Wächter liest den JSON-Report dieses Shards und
      # macht Flackern ROT — ausser die Spec steht mit Datum und Grund in
      # `e2e/flake-ausnahmen.json` (Höchstdauer 30 Tage, danach wieder rot).
      # Regel und Fehlerseite: scripts/check-e2e-flake.ts.
      #
      # MELDE-MODUS mit Stichtag (Entscheid Orchestrator 8.9.2026, gesteuert
      # über `e2e/flake-modus.json`): Messung im eigenen PR #779 zeigte 6
      # verschiedene, je Lauf wechselnde flackernde Specs — eine wachsende
      # Ausnahmeliste wäre kein Wächter mehr. Bis zum 22.9.2026 meldet der
      # Wächter Flackern nur (`::warning`, Exit 0); ab dem Stichtag gilt
      # wieder die harte Regel oben. Fehlt die Modus-Datei, gilt hart.
      #
      # STELLUNG im Job: NACH dem Report-Upload — der Report bleibt als
      # Artefakt erhalten, auch wenn dieser Schritt rot wird.
      # `!cancelled()` statt `always()`: der Schritt soll auch nach ROTEM
      # Playwright-Lauf lesen (dort sind die Flakes besonders interessant),
      # aber ein vom 25-min-Deckel GEKAPPTER Job hat gar keinen Report — dort
      # wäre ein zusätzliches Rot nur Rauschen über einer schon abgebrochenen
      # Ausführung. Er ÜBERDECKT nie ein bestehendes Rot: ein bereits roter
      # Testlauf bleibt rot, ganz gleich, wie dieser Schritt ausgeht.
```

## ci-048 · e2e · Playwright-Traces ablegen (nur bei rotem Shard)

```text
      # Playwright-Traces sichern — NUR bei rotem Shard (QS-E2E-STABIL, 7.8.2026).
      # Bisher zeichnete Playwright Traces auf, legte sie unter `test-results/` ab
      # und warf sie mit dem Runner weg. Beim Hänger vom 7.8. blieb darum nur der
      # JSON-Report; der Stall musste lokal nachgestellt werden, um überhaupt zu
      # sehen, WORAUF der Klick wartete. Mit diesem Schritt dokumentiert sich der
      # nächste Hänger selbst: `npx playwright show-trace <zip>` zeigt DOM-Snapshot,
      # Netzwerk und Call-Log jedes Versuchs.
      # Grössen-Folgen (lokal gemessen am Vorfall): ~12 MB je hängendem Test, also
      # ~50 MB für einen Shard mit vier Hängern. `trace: 'on-first-retry'` (siehe
      # playwright.config.ts) beschränkt das auf Wiederholungen, `maxFailures: 3`
      # auf höchstens drei Tests, `if: failure()` auf rote Läufe. Ein grüner Lauf
      # lädt NICHTS hoch. Retention 7 Tage wie beim Report — lang genug für die
      # Diagnose, kurz genug fürs Speicherkonto.
```

## ci-049 · e2e-ergebnis · e2e-ergebnis

```text
  # ── Sammel-Kontext der Browser-Tests (M4-Nachtrag, 8.9.2026) ───────────────
  # WARUM ES DIESEN JOB GIBT: siehe «M4-NACHTRAG» im Kopf. Kurz: ein per `if:`
  # übersprungener MATRIX-Job meldet GitHub gegenüber genau einen Check-Run mit
  # dem unexpandierten Namen «… Shard ${{ matrix.gruppe }}/N …» (Beleg damals
  # mit N=4, seit 21.9.2026 N=8); die
  # Shard-Kontexte, die der Branch-Schutz als Pflicht führte, kamen nie an und
  # jeder Doku-PR hing (PR #776/#777). Dieser Job hat KEINE Matrix, läuft immer
  # und ist ab jetzt der EINZIGE Pflicht-Kontext der Browser-Tests.
  #
  # KOSTEN: kein Checkout, kein npm, kein dist — ein Runner-Anlauf und ein
  # Shell-Vergleich (Mindestabrechnung 1 min je Lauf). Das ist der Preis dafür,
  # dass die 4 Shard-Jobs bei doku/code-fern/Push-Diät GAR nicht mehr anlaufen
  # (bisher 4 × 1 min je Lauf) — der Sparplan bleibt netto positiv.
  #
  # ROT-BEWEIS (§6.7): die Bedingung unterscheidet fünf Fälle, dokumentiert am
  # Schritt. Ein Skip OHNE begründende Diff-Klasse ist ROT — sonst wäre dieser
  # Job ein Tor, das nicht scheitern kann.
  #   (1) e2e=success              → grün (Shards gelaufen und bestanden)
  #   (2) e2e=skipped, art=doku    → grün (M4: Doku rührt die App nicht an)
  #   (2b) e2e=skipped, art=code-fern → grün (QS-PLAN-EINFACH 14.8.2026)
  #   (2c) e2e=skipped, push_diaet=true → grün (M1: derselbe SHA war im
  #                                  merge_group-Lauf grün; bis 19.9.2026: als PR)
  #   (3) e2e=skipped, art=code    → ROT (verirrter Skip, z. B. rotes `bau` oder
  #                                  eine künftig falsch verdrahtete `if:`-Zeile)
  #   (4) e2e=failure              → ROT
  #   (5) e2e=cancelled            → ROT
  # Fällt `diff` selbst aus, sind `art`/`push_diaet` LEER — dann greift keine
  # Ausnahme und ein Skip ist rot (Fehlerseite = melden, nicht durchwinken).
  #
  # WARUM `bau` NICHT in `needs` steht: ein rotes `bau` liefert kein
  # dist-Artefakt, worauf `tore` (Pflicht-Kontext) beim Download rot wird. Der
  # Fall ist also schon gedeckt; hier bliebe er zusätzlich in Fall (3) hängen,
  # weil ein rotes `bau` nur bei art=code/code-fern vorkommen kann und
  # code-fern-Läufe ihre Shards ohnehin nie fahren.
```

## ci-050 · e2e-ergebnis · if

```text
    # `!cancelled()`: läuft auch, wenn `e2e` rot oder übersprungen ist — genau
    # dafür ist er da. Nur ein Abbruch des GANZEN Laufs überspringt ihn (dann
    # meldet GitHub `skipped`, wie bei jedem anderen Job auch).
```

## ci-051 · perf · if

```text
    # §15-Gegenkopplung «Tempo zählt nur, wenn die Treue grün bleibt»: perf läuft
    # ERST, wenn Tore UND alle e2e-Shards grün sind — ein rotes Shard hält die
    # Messung zurück. Seit 26.7.2026 (Entscheid David) nur noch auf main/
    # merge_group statt auf jedem PR-Lauf: das §15-Budget wird weiterhin bei
    # jedem Deploy-Stand gemessen, hängt aber nicht mehr am kritischen PR-Pfad.
    # `art != code` kam mit dem Doku-Kurzpfad für push dazu (14.8.2026): Bis
    # dahin hielt der `paths-ignore`-Filter reine Doku-Pushes von der ganzen
    # Datei fern und damit auch von hier. Ohne diese Bedingung liefe Lighthouse
    # (4× CPU, langsames 4G, eigener Chromium) für jede Roadmap-Pflege — und
    # zwar gegen ein dist, das der Doku-Pfad gar nicht gebaut hat.
    # merge_group (19.9.2026): seit der Queue-Klassierung ist `art` dort nicht
    # mehr pauschal `code` — bei doku/code-fern wird dieser Job per `if:`
    # übersprungen und meldet `skipped`. Das erfüllt den Pflicht-Kontext
    # (docs.github.com «Troubleshooting required status checks», Abruf
    # 19.9.2026: «A job is skipped by a conditional» ⇒ «The job reports
    # "Success"»; empirisch: auf JEDEM PR seit 26.7.2026 so, zuletzt #922 —
    # Perf `skipped`, PR in die Queue aufgenommen und gelandet). Das §15-Budget
    # misst für solche Einträge weiterhin der push-Lauf je Deploy-Stand.
    # M1 (8.9.2026): `perf` BLEIBT auf main — das §15-Budget wird weiterhin je
    # Deploy-Stand gemessen. Weil `tore`/`e2e` dort jetzt übersprungen sein
    # KÖNNEN (Push-Diät), zieht die Standard-Skip-Logik `perf` sonst mit; die
    # Gegenkopplung «erst bei grüner Treue» ist darum als explizite
    # Ergebnis-Prüfung ausgeschrieben: rot oder abgebrochen ⇒ keine Messung,
    # übersprungen ⇒ die Treue ist im merge_group-Lauf am selben SHA bewiesen
    # (bis 19.9.2026: im PR-Lauf). `bau` muss grün sein,
    # sonst fehlt das dist-Artefakt.
    #
    # NACHTRAG 21./22.9.2026 (M1-Nachtrag — löst den Satz «perf BLEIBT auf
    # main» oben ab; er bleibt als Beleg seines Standes stehen): `perf` läuft
    # auf main nicht erneut, wenn `bau_perf_belegt` = true (Begründung und
    # Messung am Job `bau`); sonst misst `perf` weiterhin echt.
```

## ci-052 · perf · needs

```text
    # PRÜFUNG 21.9.2026 (QS-CI-MINUTEN Wanduhr-Auftrag): `e2e` aus `needs`
    # zu nehmen, damit `perf` parallel zu den Shards statt danach liefe, WURDE
    # GEPRÜFT UND VERWORFEN — der Grund ist keine Falsch-Rot-Episode, sondern
    # die §15-Gegenkopplung selbst («Tempo zählt nur, wenn die Treue grün
    # bleibt», Kommentar oben): ohne `e2e` würde `perf` messen, BEVOR die
    # Browser-Shards die Korrektheit bewiesen haben — Tempo vor Treue, genau
    # das Gegenteil von §15. Bleibt an `needs.e2e`.
```

## ci-053 · perf · Playwright-Browser (Chromium)

```text
      # Lighthouse steuert Chromium — derselbe Browser wie e2e, hier eigener Job.
      # PR #785: derselbe apt/dpkg-Sperren-Schutz wie im e2e-Shard-Job, §5
      # Single Source of Truth statt Duplikat — Details in
      # scripts/ci/playwright-install.sh.
```

## ci-054 · merge-schutz · merge-schutz

```text
  # ── Dedizierter Required-Kontext «Merge-Schutz» (25.7.2026, Blanko-Go David) ──
  # Das Tor läuft ZUSÄTZLICH als Step im «Tore»-Job (Belt+Suspenders). Der eigene
  # Job existiert, damit der Required-Kontext UNABHÄNGIG ist: würde der Step im
  # Tore-Job entfernt, bliebe «Tore» grün — ein entfernter DEDIZIERTER Job dagegen
  # hinterlässt einen «expected»-Block (GitHub wartet ewig auf den Kontext). Erst
  # damit ist §9/F1 (Vorfall #309) maschinenunabhängig hart. Branch-Regel-Eintrag
  # erfolgt nach dem ersten grünen Lauf dieses Jobs (gh api PATCH).
```

## ci-055 · merge-schutz · if

```text
    # M1 (8.9.2026): auf `push` übersprungen — und zwar OHNE Push-Diät-Bedingung
    # und bewusst OHNE `needs: diff`. Grund: `check:merge-schutz` bildet
    # merge-base(origin/main, HEAD); auf main IST HEAD die Basis, der geprüfte
    # Bereich also leer — der Job war dort schon vorher ein garantiert grüner
    # Leerlauf (348 Läufe à 1.32 min in 30 Tagen). Seine Schutzwirkung entsteht
    # ausschliesslich im PR (Vorfall #309). Kein `needs`, damit dieser Kontext
    # als einziger auch dann gemeldet wird, wenn die Klassierung selbst ausfällt.
```

## ci-056 · deploy · deploy

```text
  # ── Prod-Deploy aus der CI (QS-AUTOMATIK, Entscheid David 17.8.2026, «Weg b») ─
  # ANLASS: Vercel legte bei JEDEM Push auf JEDEN Branch ein Deployment an — auch
  # das sofort «Canceled by Ignored Build Step». Am 16.8.2026 abends riss das die
  # Free-Grenze von 100 Deployments/Tag; der Prod-Deploy von #540 war 24 h
  # blockiert. Wurzel-Fix (§17): Die Git-Auto-Deploys sind aus
  # (`vercel.json` → `git.deploymentEnabled: false`), Prod liefert dieser Job.
  # Ein Deployment entsteht jetzt nur noch je Merge auf main, nicht je Push.
  #
  # «MERGE NACH main IST DER DEPLOY» BLEIBT WAHR (§9): der Merge löst diesen Job
  # aus. Neu ist nur, dass er ERST NACH grünen Toren liefert — vorher baute
  # Vercel parallel zur CI und konnte einen Stand ausliefern, dessen Tore noch
  # liefen oder rot wurden.
  #
  # needs (§6.7-Fehlerseite): diff · tore · bau · e2e. BIS 8.9.2026 galt hier
  # «nur Jobs OHNE eigenes Job-`if:` dürfen in needs», weil ein übersprungener
  # needs-Job den abhängigen Job in den Skip zieht — ein `code-fern`-Merge wäre
  # sonst still nie ausgeliefert worden. Mit M4/M1 (QS-CI-MINUTEN) haben `bau`,
  # `tore` und `e2e` selbst ein Job-`if:`; die Regel wird darum durch eine
  # EXPLIZITE Ergebnis-Prüfung ersetzt statt aufgegeben:
  #   `!cancelled()` schaltet die Standard-Skip-Logik ab, danach wird jedes
  #   `needs`-Ergebnis einzeln gefordert — `bau` MUSS erfolgreich sein (ohne
  #   grünen Bau kein Deploy), `tore`/`e2e` dürfen `success` ODER `skipped`
  #   sein, aber niemals `failure`/`cancelled`.
  # Damit gilt unverändert: rote Treue ⇒ kein Deploy. Übersprungen ist genau
  # dann zulässig, wenn die Klassierung (`code-fern`) oder die Push-Diät (M1,
  # merge_group-Lauf hat denselben SHA schon grün gefahren; bis 19.9.2026: der
  # PR-Lauf) das begründet.
  #
  # NACHTRAG 21./22.9.2026 (M1-Nachtrag — der Satz «bau MUSS erfolgreich
  # sein» oben ist überholt und bleibt als Beleg seines Standes stehen): `bau`
  # darf `skipped` sein, wenn `bau_perf_belegt` = true — Begründung am Job `bau`.
  #
  # BUILD-PARITÄT: `vercel pull` holt die Projekt-Einstellungen, `vercel build`
  # fährt `buildCommand` aus vercel.json — dort seit 17.8.2026 explizit
  # `npm run build` (gen:suchindex + tsc -b + vite build + prerender), damit die
  # Kette nicht mehr an der impliziten Vite-Preset-Auflösung hängt (§5).
  # Absichtlich KEIN Download des `dist`-Artefakts aus `bau` und kein eigenes
  # `npm ci`: `vercel build` installiert und baut selbst, genau wie es die
  # Plattform tat — jeder Fremd-dist wäre ein zweiter Bauweg.
```

## ci-057 · deploy · concurrency

```text
    # Seriell: zwei gleichzeitige Prod-Deploys sind ein Rennen um denselben
    # Alias. `cancel-in-progress: false` — ein laufender Deploy wird NIE
    # abgeschnitten, der nächste Merge wartet.
```

## ci-058 · deploy · VERCEL_GIT_COMMIT_SHA

```text
      # Speist `<meta name="lexmetrik-build">` (vite.config.ts liest
      # VERCEL_GIT_COMMIT_SHA). Im CI-Build setzt die Variable niemand — ohne
      # diese Zeile stünde «dev» in der Seite und der Prod-Stand-Wächter
      # (`pruefeBuildStand`, scripts/betrieb/prod-smoke.ts) wäre zu Recht rot.
```

## ci-059 · deploy · VERCEL_TOKEN

```text
      # Reihenfolge ist Absicht: `A && secret || ''`. Die naive Fassung
      # `probe && '' || secret` liefert IMMER das Secret, weil der leere String
      # falsy ist und `||` weiterfällt — die Probe wäre wirkungslos grün.
```

## ci-060 · deploy · Nachkontrolle — live ausgelieferter Build == dieser Commit

```text
      # Der Deploy-Befehl kehrt zurück, sobald das Deployment bereit ist; die
      # Umschaltung der Produktions-Aliasse braucht danach noch Sekunden. Darum
      # drei Versuche — und dann hart rot: ein Job, der «deployed» meldet, ohne
      # dass der Stand live ist, ist genau der Vorfall vom 15./16.8.2026
      # (sieben Merges auf main, nie ausgeliefert, Prod-Smoke sah nur HTTP 200).
```

## ci-061 · deploy · Vercel — alte Stände aufräumen (Deployment Storage)

```text
      # ── Deployment Storage aufräumen (QS-AUTOMATIK, 8.9.2026) ──────────────
      # ANLASS: Vercel-Nutzungsseite Team `david-legal-projects` am 8.9.2026:
      # Deployment Storage 261.91 GB gegen eine Hobby-Grenze von 10 GB, davon
      # 100 % Projekt `lexmetrik`. Ein Stand (`dist`) wiegt 738 MB bei 18 321
      # Dateien, bei 10–20 Landungen pro Tag. Vercel-Mail 8.9.2026 02:35:
      # «100 % of Deployment Storage (10 GB) … Upgrade now to avoid service
      # disruption».
      #
      # WARUM RETENTION ALLEIN NICHT REICHT: die Aufbewahrungsfrist des Projekts
      # steht seit 8.9.2026 auf «1 day» (alle vier Arten). Vercel behält davon
      # unabhängig IMMER die letzten 20 Produktions-Deployments UND die letzten
      # 10 Deployments überhaupt — bei 738 MB je Stand rund 15 GB, also weiter
      # über der Grenze. Wurzel-Fix (§17): dieser Schritt behält nur die 3
      # neuesten Produktions-Stände (plus den eben ausgelieferten, den
      # Alias-Träger und alles jünger als 1 h) und löscht den Rest.
      #
      # WIEDERHERSTELLUNG: gelöschte Stände bleiben 30 Tage zurückholbar über
      # Vercel → Settings → Security → Recently Deleted.
      #
      # `continue-on-error: true` ist Absicht: der Deploy IST an dieser Stelle
      # gelaufen und live verifiziert. Aufräumen ist Hausarbeit — ein roter Job
      # hier würde einen gelungenen Deploy als gescheitert melden und die
      # Landungs-Nachkontrolle in die Irre schicken. Der Befund steht in der
      # Summenzeile «Vercel-Aufräumen: …» im Log (Skill `landung` §4).
```

## ci-062 · deploy · timeout-minutes

```text
        # Der Job hat 20 min gesamt (siehe `timeout-minutes: 20` oben). Ein
        # hängender Aufräumer darf den bereits live verifizierten Deploy
        # nicht als Job-Timeout rot machen — darum ein eigenes, kleineres
        # Zeitlimit für diesen Schritt (Auflage Gegenprüfung, PR #774).
```
