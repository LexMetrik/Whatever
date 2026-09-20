# FAHRPLAN — Basis-Ausbau LexMetrik (Fundament-Handlungsplan, Stand 17.7.2026)
<!-- @lagebild name: CI & Wächter · zweck: Zustandsberichte, tote Abhängigkeiten, Paritäts-Sonden — hält den Bau sicher. -->

> **Detailquelle zum ROADMAP-Querschnitt `QS-BASIS`** (§14.1) — nie zweiter Einstieg, immer
> nur verlinkte Detailquelle.

**Plan-Prinzip (Daueranweisung David, 17.7.2026, wörtlich):** «bauplan soll so aufgebaut sein,
dass handlungsschritte von meiner seite erst am schluss kommen und du alles baust was du kannst
ohne mich.»

**Umsetzung des Prinzips:** Dieser Plan ist in **zwei Blöcke** gegliedert — **§A Agent-baubar
ohne David** (die Bau-Reihenfolge, komplett autonom, terminkritischer Teil zuerst) und **§B
David-Schlussblock** (alle Beschaffungs-/Freigabe-Handschritte gebündelt ans Ende). Teilbare
Einheiten sind explizit gesplittet: der **baubare Anteil** (Dossier / Entwurf / Skript / Tor /
Vorbereitung) liegt in §A und wird jetzt gebaut; nur der **Handschritt** (Bestellung / Freigabe /
Kauf) wandert nach §B und wird am Schluss in ~30–45 Min in EINEM Block erledigt. Je Gate ist
notiert, **was danach noch zu VERDRAHTEN** bleibt (der kleine Rest-Bau nach dem Handschritt).

**Auftrag David (17.7.2026, wörtlich):** «überleg dir mit ultrathink und ultracode was ich
an der basis von lexmetrik verbessern kann offen und erstelle daraus handlungsplan».

**Methodik:** 5 Miner-Agenten (Vertrauen · Praxis · Burggraben · Ingenieur · Infra-Bestand,
read-only Repo-/Live-Erhebung 17.7.2026) → 3 Fable-Strategen (Wirkung÷Aufwand aus drei
Linsen) → **Fable-Judge** (Deduplikation gegen den Plan-Bestand nach §14, Priorisierung,
Verwerfung). Jede Kernaussage ist im Bestands-Anhang (§Quellen) belegt. Die Einordnung
folgt strikt §14: bereits geplante Flächen werden **nur referenziert, nie dupliziert**;
neu sind ausschliesslich die Fundament-Lücken ohne bestehende Schritt-ID.

**Leitplanke (Zeitsperre):** Alle Trust-/Nachweis-Posten bleiben **maschinell geprüft**,
nie «fachlich geprüft» — David hat bis ≥1.12.2026 keine Abnahme-Zeit
(`FAHRPLAN-LERNPHASE-2026.md`, Default-Abnahmewelle Feb 2027). Kein Posten fordert Fachzeit;
die David-Gates sind reine Beschaffungs-/Freigabe-Handschritte (fachzeit-arm).

---

## §0 · Zweck

Detailquelle zu `QS-BASIS` und `QS-AUTOMATIK` — was an der Basis von LexMetrik
verbessert werden kann. **Plan-Prinzip (Daueranweisung David, 17.7.2026, wörtlich):**
«handlungsschritte von meiner seite erst am schluss» — **§A Agent-baubar ohne
David** (autonome Bau-Reihenfolge) + **§B David-Schlussblock** (Freigabe-/
Beschaffungs-Handschritte gebündelt ans Ende), je Gate mit VERDRAHTEN-Rest notiert.

---

## §1 · ROADMAP-Spec QS-AUTOMATIK (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «§A — Agent-baubar OHNE David» (A1–A11) dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  **Gebündelt aus zwei Befunden vom 20.7., weil sie dieselbe Prüf-Fläche und dieselbe Risiko-Klasse haben**
  (Tor-/Automatik-Logik, kein Rechtsinhalt) — §14.2. Der Anlass ist die **zentrale Lektion des 20.7.:**
  *ein Tor, das sich gegen die eigene Ladung prüft, ist kein Tor* — dreimal an einem Tag aufgetreten
  (Turso-Sync→Marke→Wächter · selbst-attestierter Gegenprüfungs-Trailer · Hook-Probe mit selbstgebautem
  stdin). Dieser Querschnitt hält die Gegenfrage dauerhaft offen: **läuft die Automatik, und würde sie
  scheitern können?**
  - **a · Zwei tote Workflows** (gefunden von `waechter.yml`, sofort beim ersten Lauf):
    **`normen-monitor.yml` — letzter Erfolgslauf 22.6.2026, seither failure/cancelled, also ~4 Wochen
    still tot.** **`fedlex-frische.yml` — jüngster Lauf failure.** Der zweite wiegt schwerer, als er
    aussieht: er ist der benannte **Ersatz-Arbiter für neun nur-lokale Tore** — solange er rot ist,
    **läuft deren Allowlist-Begründung leer** (s. `QS-BASIS`, Tor-Parität 16/36). Erst diagnostizieren,
    dann fixen; nicht raten.
    - **a′ · `normen-monitor.yml` — Ursache diagnostiziert (20.7.2026, doppelt verifiziert, Beleg
      CI-Run `29727448005`).** Der Monitor ist seit 29.6. rot; die **aktuelle** Ursache liegt in
      `check:netz`/Kanonik-Arbiter: **`chemrrv`** (SR 814.81, `eli/cc/2005/478`, Konsolidierung
      `20260716`, gepinnt 16.7.) zeigt auf die **nicht-kanonische** Revisions-Wurzel `html-0`,
      kanonisch ist `html-1`. **Reparatur (offener Bau-Schritt, NICHT im reinen Doku-Schritt
      ausgeführt):** Re-Pin nur für `chemrrv` via `scripts/fedlex-repin-kanonik.ts` → Snapshot-
      Regeneration über den Generator → **Inhalts-Treue-Diff** (gleiche Konsolidierung ⇒ substanziell
      identischer Text; ~31 mehrspaltig-Tabellenblöcke stichprobenhaft) → dann `workflow_dispatch` des
      Normen-Monitors als Echt-Beweis. **Dringlichkeit:** die Rechtsstand-Wache ist bis zur Reparatur
      faktisch **blind**, weil das Dauer-Rot jede neue Drift maskiert. **Risiko-Klasse abweichend von
      der DoD dieses Querschnitts:** dieser Re-Pin ist ein **Extraktions-Risikopfad** (Fedlex-Snapshot,
      berührt `scripts/fedlex-*`/`public/normtext/**`) ⇒ **`QS-GP`-Gegenprüfung Pflicht, kein
      Auto-Merge vor Verdikt** (§14.4) — anders als die reine Workflow-Plumbing-Arbeit unter a/b. Die
      Re-Pin-Mechanik teilt sich mit **`QS-CURRENCY`** (Korpus-Pflege) und **`QS-OPT` O-2** (Batch-
      Re-Pin vor dem 1.8.-Berg); der `chemrrv`-Fix ist deren terminnahes Geschwister, wird aber hier
      geführt, weil er den Monitor entsperrt.
  - **b · Turso-Wächter-Abdeckung ausdehnen.** `check:turso-frische` (aus #313) prüft vierfach
    (Struktur · Vollständigkeit gegen Soll-Zahlen · `manifest_sha` · Alter) — offen bleibt: **wo überall**
    geprüft wird, eine **Laufzeit-Prüfung in `api/suche`** (der Ausfall vom 20.7. war im Betrieb
    unsichtbar: ein halber Gesetzesindex und **null** Entscheide, ohne je rot zu werden), ein definierter
    **Alarmpfad** (wer erfährt es, wie?) und **Wachstums-Schwellen** (Budget-Ist 652/1024 MiB = 64 %;
    ab welchem Füllstand wird gewarnt, bevor der Sync an die Wand fährt?).
  **Leitplanke für JEDE Massnahme hier (aus derselben Lektion):** das neue/erweiterte Tor gegen eine
  **unabhängige** Referenz prüfen und seine **Scheiterns-Fähigkeit an einem ECHTEN Aufruf** belegen —
  nicht an einer Nachbildung mit selbstgebauter Eingabe (CLAUDE.md §6 Ziff. 7).
  **DoD:** beide Workflows nachweislich wieder grün **mit protokollierter Ursache** (nicht durch Rerun
  grün gemacht) · `check:ci-laeufe` grün · Alarmpfad dokumentiert. Die Workflow-/Tor-Plumbing-Anteile
  (a/b) sind **reine Prüflogik ⇒ golden byte-gleich, `Gegenpruefung: n/a`**; der `chemrrv`-Re-Pin (a′)
  ist die **Ausnahme** — Extraktions-Risikopfad ⇒ eigener Commit mit `QS-GP`-Verdikt, kein Auto-Merge.
  Trailer `Roadmap: QS-AUTOMATIK`.

### §1-N · ROADMAP-Spec QS-AUTOMATIK — Nachzug (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)

*Herkunft: `ROADMAP.md`, Querschnitt-Band, Schritt `QS-AUTOMATIK` — AP-11 rückwirkend angewandt
(ROADMAP-Diät Welle 3, 4.8.2026). Der Wortlaut unten entstand grösstenteils nach Anlage von §1
(31.7.2026). In der ROADMAP bleiben Titel, `@meta`, der steuernde Kurzabsatz und der Pointer
hierher. Steuert nicht — Spec-Heimat. **→ Bau-Spec: §1 dieser Datei (a/b/a′).***

  **Leitplanke:** jedes Tor gegen eine *unabhängige*
  Referenz prüfen und seine Scheiterns-Fähigkeit an einem ECHTEN Aufruf belegen (§6 Ziff. 7).
  a/b sind reine Prüflogik (`Gegenpruefung: n/a`); der `chemrrv`-Re-Pin (a′) ist die Ausnahme —
  Extraktions-Risikopfad ⇒ eigener Commit mit `QS-GP`-Verdikt, kein Auto-Merge.
  **Stand 3.8.2026 (PR #419, K1–K13):** die beiden toten Workflows laufen wieder, der Alarmpfad ist
  gebaut (Monitor-Triage: Grün schliesst, 3× Rot eskaliert) und der Wächter zieht fehlende
  Required-Kontexte nach. **Offen bleibt** die Turso-Wächter-Abdeckung samt Wachstums-Schwellen —
  darum `ready` und nicht `done`; sie ist zugleich Posten (a) des QS-BASIS-Intakes und wird
  **allein hier** gebaut (Abgrenzung 3.8.2026, Wächter gegen eine UNABHÄNGIGE Grösse, nie gegen
  die Sync-Marke). Diagnose-Übersicht: `bibliothek/ci-fehlerklassen-2026-08-03.md`.
  **Mitnahme 4.8.2026 (Code-Inventur):** (a) ~~Manifest-Nullzeilen~~ **geklärt — gewollt**
  (Ausbaustufe, David 4.8.2026; keine Wächter-Lücke). (b) Prod-Smoke existiert
  doppelt (`.github/scripts/prod-smoke.sh` wöchentlich + `scripts/betrieb/prod-smoke.ts`
  6-stündlich, überlappende Prüfungen) — konsolidieren oder Schnitt dokumentieren.
  **Ist-Korrektur 15.8.2026 (Rückbau-Sweep, lebendige Spec):** NUR HALB doppelt — das
  bash-Skript prüft zusätzlich vier Korpus-JSONs (normtext/, rechtsprechung/,
  materialien/register.json, such-index/artikel.json), die der TS-Smoke nicht kennt;
  ein Löschen des `.sh` verlöre Rechtsdaten-Deckung. Richtiger Weg: Korpus-Sonden in
  `prod-smoke.ts` heben, DANN `.sh` streichen (Bau-, kein Rückbau-Schritt). Ebenfalls
  15.8.: die WARN-Stufe des TS-Smoke (konnte nie rot werden, §6.7) ist scharf gestellt.

  **Wächter-Röte 403/`bash -e` — nachgeprüft und ERLEDIGT (15.8.2026,
  `QS-AUTOMATIK`).** Die ältere Diagnose «der Branch-Schutz-Nachzug stirbt unter
  `bash -e` an HTTP 403» ist widerlegt und im Workflow bereits richtiggestellt;
  das verlangte Muster «Lesung optional, Urteil ohne sie ausweisen» ist in
  `waechter.yml` umgesetzt (`::warning::` + `exit 0`, nie stiller Skip) und die
  strukturelle Grenze dort ausformuliert. **Nichts zu bauen.** Empirischer
  Beleg heute, Lauf `31870641148` (15.8.2026, 06:55 UTC): der Job ist rot wegen
  `check:ci-laeufe ROT — 1 von 4 … normen-monitor.yml: jüngster Lauf 'failure'`
  — ein **korrektes Monitor-Urteil** (ESTV-Drift, eigener Bau), kein
  Wächter-Bug. Der 403 besteht unverändert fort und erscheint im selben Lauf als
  `##[warning]Branch-Schutz nicht lesbar (gh: Resource not accessible by
  integration (HTTP 403))`. **Offen bleibt** damit nicht die Behandlung, sondern
  die Wirkung: der Kontext-Nachzug läuft faktisch nie. `GITHUB_TOKEN` kann das
  Recht über keinen `permissions:`-Schlüssel erhalten (es gibt kein
  `administration:`); ein Fix bräuchte einen PAT mit Admin-Leserecht (Secret,
  §18) oder eine andere Quelle für die Required-Kontexte — eigener
  Roadmap-Schritt, ausserhalb dieses Bandes. Praktische Folge, hier schon
  gezogen: der BEHIND-Nachzug (§3.1) darf sich nicht auf diesen Nachzug
  verlassen und stösst `ci.yml` selbst an.

---

## §2 · ROADMAP-Spec QS-BASIS (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «§A — Agent-baubar OHNE David» + «§B — David-Schlussblock» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  Kritik-gefilterte Ablage des Ultracode-Fundament-Research (Auftrag David 17.7.2026: «was ich an der
  Basis von LexMetrik verbessern kann»; 5 Miner + 3 Fable-Strategen + Fable-Judge, dedupliziert gegen den
  Plan-Bestand nach §14). Detailquelle **`FAHRPLAN-BASIS-AUSBAU.md`** — 12 B-Einheiten (Wirkung÷Aufwand):
  **B-1** Betreiber-Identität (DS-Platzhalter + Impressum) · **B-2** Off-site-Backup + Restore-Probe für
  `daten/` (6,9 GB, heute **null Backup** = höchstes Einzelrisiko) · **B-3** Bund-Currency-Kette vor dem
  **1.8.-Verfall-Berg** (terminkritisch; Prämisse P1-a/b evtl. schon ✅, vor Bau festnageln) · **B-4** Domain
  `lexmetrik.ch` registrieren (Entscheid; Umzug bleibt SEO-A11Y W3.4) · **B-5** VPS-Bestell-Dossier +
  Blocker-Zeile (Serving = QS-DATA) · **B-6** Stand-Ausweis (Fassung/Abruf/Permalink) in jeder Kopie/Export ·
  **B-7** öffentlicher Determinismus-Nachweis auf `/methodik` (maschinell, nie fachlich) · **B-8**
  Kantons-Currency-Wachhund + FR/IT-Sprach-Label-Fix · **B-9** append-only Fassungs-Archiv (nach B-2) ·
  **B-10** Permalink-Beständigkeits-Vertrag (nach B-4) · **B-11** Prod-Watchdog (Delta zu QS-OPT O-1, +
  PR #244) · **B-12** Merge Queue (zuletzt, nach O-3.2/O-3.3).
  **Neu strukturiert (Daueranweisung David 17.7. «handlungsschritte von meiner seite erst am schluss …
  du alles baust was du kannst ohne mich»):** Plan in **§A Agent-baubar ohne David** (autonome Bau-Reihenfolge
  A1→A11: B-3→B-5-Dossier→B-6→B-8→B-11-Cron→B-1-Entwurf→B-2-Vorbereitung→B-10-Vorbereitung→B-7→B-9-Design→
  B-12-Vorbereitung) + **§B David-Schlussblock** (G1–G7 gebündelt am Ende, ~30–45-Min-Beschaffungs-/Freigabe-Block,
  je Gate notiert was danach noch zu VERDRAHTEN bleibt). Teilbare Einheiten gesplittet: Dossier/Entwurf/Skript/Tor
  = §A (jetzt), Bestellung/Freigabe/Kauf = §B. **§A wird jetzt autonom gebaut** (je Einheit Worktree+PR+Auto-Merge);
  Trailer `Roadmap: QS-BASIS`.

### QS-BASIS · §14-Intake 20.7.2026 (a)–(d) im Wortlaut (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026). Die ROADMAP führt*
*den Posten seither als Einzeiler; der Wortlaut unten ist die massgebliche Fassung.*

>   **§14-Intake 20.7.2026 (David):** (a) **Turso-Wächter-Abdeckung** — alle relevanten Stellen prüfen, gekoppelt an die Tor-Echtheit (Wächter gegen UNABHÄNGIGE Grösse, nicht gegen die Sync-Marke; `cancelled`/`skipped` zählen als rot — Auslöser `turso-sync.yml` timeout-minutes: 20). (b) **CI-Fehlläufe** (#30) — Referenz auf Worktree `lm-ci`, hier NICHT duplizieren; Playbook-Eintrag «CI-Starvation» ist WIDERLEGT (Queue-Wartezeit 0,0–0,3 min über 10 Läufe gemessen), Kostentreiber sind Reruns (~72 % der Wanduhr). (c) **CI/lokal-Tor-Parität** — `check:seriell` fährt 36 Tore, CI 11; `check:tor-paritaet` friert die Lücke ein, das Schliessen ist offen. **Stand 20.7.2026 (PR `docs/bau-fundament`): 16/36 in CI** (Detail: `ROADMAP-CHRONIK.md` → QS-BASIS). Rest-Lücke 20 Tore, davon 9 mit Ersatz-Arbiter `fedlex-frische.yml` — **dessen Lauf ist rot (#37), solange das gilt, läuft diese Begründung leer.** (d) **Datenhaltungs-Optimierung** *(§14-Intake David 20.7.2026; im ersten Intake-Durchgang verloren gegangen und durch die adversariale Prüfung von PR #315 wiedergefunden — Nachtrag 20.7.)*: **inkrementeller Sync** (nicht bei jedem Lauf den Vollbestand schieben) · **contentless-FTS** (`content=''` statt external content, wo der Rohtext schon im Serving-Store liegt) · **Index-Strategie** (welche Spalten tragen die realen Query-Pfade aus `api/suche`) · **Heiss/Kalt-Gate** (was gehört in die 1-GB-Turso-Replika, was bleibt kalt) · **Korpus aus git ausgliedern (R6)** — gemessen 20./21.7.2026 als **moderate Kosten** (git status 25–80 ms, CI shallow; real: ~400 MB je Worktree-Checkout, 273 MB Pack, minimaler Churn) ⇒ **kein Dringlichkeits-Fall**, Vorstufe/Teil dieses serverlosen Korpus-Serving-Vorhabens, nicht als isolierter git-Eingriff (Detail `FAHRPLAN-DATENHALTUNG.md` §12.4). Detailquelle `FAHRPLAN-DATENHALTUNG.md`; Bau-Strang W2·6-DATA (E4-Nachbarschaft). Kein eigener FAHRPLAN.


### Restposten aus ROADMAP.md *(verlagert 20.9.2026, Nachzug Deckel-Puffer)*

Herkunft: `ROADMAP.md`, Dach-Schritt `QS-BASIS`. Anlass: der 120-KB-Deckel des Plans (Nachzug
zum Umzug vom 20.9.2026, der nur 483 B Reserve liess). In `ROADMAP.md` bleiben Ziel, Status,
die beiden `WARTET AUF DAVID`-Posten im Wortlaut, die David-Handgriffe (`PLAN_BUCHUNG_TOKEN`,
Jules-GitHub-App), die Merge-Auflage «VOR DEM MERGE · Turso-Serving-Sync», der David-Entscheid
K3-Scharfschaltung und der Zeiger auf diesen §2; die Befundliste steht ab hier.
**Wortlaut byte-genau, nichts zusammengefasst, nichts gestrichen.** Die beiden zuletzt
aufgeführten Folgepunkte (Präfix-Parität, Umlaut-Faltung) gehören zum Posten «(d)
Datenhaltungs-Optimierung — Suche-Edge-Umzug Kanton», der in `ROADMAP.md` stehen bleibt; ihre
Auflagen (eigene Messung am Edge, eigene Gegenprüfung, linguistische Sorgfalt) gelten
unverändert.

  - [ ] **`main.tsx` nutzt `createRoot` statt `hydrateRoot`** — prerendertes DOM wird 27–78 ms nach `load` verworfen (Nullprobe auf main bestätigt); Wurzel der «flaky» Tastatur-/Skip-Link-Specs und ein CLS-/TTI-Posten. Fix mit Hydrations-Fehler-Wächter, Vorher/Nachher-Messung, Gegenprüfung, eigener PR.
  - [ ] **Geparkter Stand `hydrateRoot` (9 Commits, still seit 15.9.) — Tag `archiv/qs-basis-hydrate-2026-09-18` (ae04f6caf), Branch + Worktree am 18.9.2026 abgeräumt; kollidiert nach #899 mit `Begruessung.tsx`/`SuchBlock.tsx`/`prerender.ts`** *(17.9.2026)* — Wiederaufnahme aus dem Tag (`git switch -c feat/qs-basis-hydrate archiv/qs-basis-hydrate-2026-09-18`), dabei `anfangsGruss()` in `useHeute` übernehmen.
  - [ ] **`linkedom`-`window` ist Proxy auf `globalThis`: Werte lecken in Folgetests** (`begruessung-strictmode.test.tsx`, 17.9.2026).
  - [ ] **E2E-Flake Shard 2/8 — Wurzel messen statt neu starten** *(Befund QS-FREMDAGENTEN, Session 4.9.2026)* — Befund-Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 14.9.2026 (5); Bau-Einheit offen, Zeiger genügt zur Steuerung.
  - [ ] **§17 Doku-PR macht offene PRs nicht nur BEHIND, sondern DIRTY** *(Vorfall 14.9.2026, #870 gegen #869)* — BEHIND kostet einen CI-Lauf, DIRTY eine fremde Session. Befund, Regel und Wurzel-Kandidat: FAHRPLAN-OFFENE-BEFUNDE §4 («Doku-PR gegen offenen Bau-PR»).
  - [x] **§17 BEHIND-Schleife durch Plan-Buchung** *(2.9.2026)* — ✅ 19.9.2026, Wurzel-Kandidat «Merge-Queue» gezogen; Rest (Plan-Buchung selbst) unter `QS-CI-MINUTEN`. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026.
  - [ ] **§17 F13 klären: Warum wurde der main-Lauf 1123b1974 (#629) «cancelled»?** *(2.9.2026)* — `cancel-in-progress` ist für main seit 26.7. aus; trotzdem endete der Merge-Lauf ~30 s nach dem Folge-Push 9cdbb6a55 als cancelled, der Deploy fehlte (Sidecar 404, Heilung per `gh run rerun`). Kandidaten: Selbst-Cancel-Schritt («BEHIND-PR … nachziehen»/«Geplante Workflows»), GitHub-seitig. Rot-Beweis mit zwei schnellen main-Pushes, dann Wurzel-Fix; bis dahin Skill `landung` Nachkontrolle 0.
  - [ ] **§17 Notizen-Datei: Haupt-Checkout aus einem Worktree nur per Bash schreibbar** *(19.9.2026)* — das Write-Werkzeug sperrt aus einem Worktree Schreibzugriffe auf `<Haupt-Checkout>/.claude/`; die Regel (`bauschritt` Station A 4, globale CLAUDE.md) ist nur per `Bash` erfüllbar. Umgekehrt sehen Kompaktierungs-Hook und `plan:next` eine im Worktree abgelegte Datei nicht. Wurzel offen.
  - [ ] **`README.md` ist ein Fossil** *(19.9.2026)* — «Swiss Legal Calc – Modul 1: Arbeitsrecht» plus ein Architektur-Baum, den es nicht mehr gibt — für eine übernehmende Person die erste und irreführendste Datei (Zweck `BETRIEB.md`). Auf Ist-Stand bringen oder dorthin verweisen.
  - [ ] **Vercel Deployment Storage nachmessen — überfällig** *(Auftrag 8.9.2026, «48 h nach der ersten Landung»)* — war 261.91 GB gegen 10 GB Hobby-Grenze (ein Stand = 738 MB); über 10 GB ⇒ die 455 MB Korpus-Dateien je Stand auslagern. Wortlaut: `landung/referenz-ci.md` Ziff. 1b.
  - [ ] **`shellcheck` fehlt lokal** *(19.9.2026)* — `landung-kette.sh` und `scripts/ci/*.sh` prüft nur `bash -n` (Syntax), nicht Quoting/Wort-Trennung. Als Voraussetzung dokumentieren oder ein Tor bauen, das ohne shellcheck übersprungen wird — aber eines, das scheitern kann (§6.7).
  - [ ] **§17 · Steuerdeckel-Glob umgehbar durch Dateinamen-Wahl** *(Prüfer/Fixer #856, 14.9.2026)* — der 204-KB-Deckel auf `scripts/check-*.ts` steht bei 203,8 KB, sieht aber die Seitenwagen der gleichen Steuerungsfläche nicht: `scripts/verweis-inventar-messung.ts`, `scripts/ui-normzitate-kommentare.ts`, `scripts/tor-paritaet-sonden.ts` u. a. = 75,4 KB ausserhalb des Globs. Wer den Deckel reissen würde, benennt die Datei anders — das ist kein Budget, das ist eine Namenskonvention. Wurzel-Fix: Glob auf die Steuerungsfläche erweitern **oder** ein zweites, deklariertes Flächenbudget; einmal rot zeigen (§6.7).
  - [ ] Totcode-Meldung wird echtes Tor `check:tot` — blockierend bei NEUEN Meldungen (Basis: 1). §3.2.
  - [ ] Dependency-Frische: `npm audit` + Majors + knip-Unlisted als Meldung, nie Stopper. **Lockfile nur über `npx npm@10`.** §3.3.
  - [ ] tailwind 3→4-Migration (PR #503; ~249 className-Dateien visuelle Regression — kein Dependabot-Merge).
  - [ ] Dependabot-Lock-Wurzelfix: npm-Major-Mismatch erzeugt fehlende genestete Einträge (H-8-Muster) — Weg finden, der den Lock automatisch mit npm@10 nachzieht.
    - [ ] **Präfix-Parität des Edge-Weges** — der Client findet «Verjähr» (FlexSearch `tokenize: 'forward'`), der DB-Weg nicht. FTS5 könnte es (`"Verjähr"*`), aber Angleichen ist eine Recall-, RANG- und Latenz-Änderung auf jeder Query (GP-Messung 31.8.: Präfix hebt z. B. bei «Eigentum» OR 261/ZGB 200 via Marginalien-startsWith auf Stufe 0/Seite 1 — Rang-/Golden-Prüfung MIT budgetieren): lokal, warm, n=3 Median «Eigentum» 15,6 → 107,1 ms bei 658 → 1502 Treffern (6,9x), über Turso-HTTP ungemessen obendrauf. Braucht eigene Messung am Edge und eigene Gegenprüfung.
    - [ ] **Umlaut-Faltung ae/oe/ue** — «Verjaehrung» findet nichts, «Verjahrung» findet alle 259. `remove_diacritics 2` faltet ä→a, aber niemand faltet ae→ä. Betrifft **beide** Wege gleich (der Client strippt NFKD-Diakritika), ist also keine Edge-Lücke, sondern eine gemeinsame; ein Fix müsste beide Indizes zusammen ändern und braucht linguistische Sorgfalt («Aeroplan», «Israel», «Praesidium»).
---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

7 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-BASIS-AUSBAU.md`](../archiv/fahrplaene/FAHRPLAN-BASIS-AUSBAU.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- §A — Agent-baubar OHNE David (Bau-Reihenfolge, autonom)
- §B — David-Schlussblock (alle Handschritte gebündelt, ans Ende)
- §Verworfen (mit Grund)
- Bau-Go-Status
- §Quellen (Bestands-Anhang — read-only erhoben 17.7.2026, zusammengefasst)
- §3 · Kind-Schritte aus dem §14-Intake 3.8.2026 (`QS-AUTOMATIK-BERICHT`, `QS-BASIS-TOT`, `QS-BASIS-DEPS`)
- §3-N · ROADMAP-Spec-Nachzug der §3-Kind-Schritte (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
