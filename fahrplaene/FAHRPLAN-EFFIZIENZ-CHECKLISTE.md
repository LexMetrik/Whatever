# FAHRPLAN — Effizienz-Checkliste (`QS-EFFIZIENZ`)
<!-- @lagebild name: Effizienz-Dauerauftrag · zweck: Laufend Token und Prozess sparen — Skills, Hooks, Tore und Steuer-Doku schlanker, ohne Prüftiefe zu verlieren. -->

**Zweck.** Stehender Auftrag David 14.8.2026 (Chat, «bau immer weiter an dingen die bei zukünftigem
bau token sparen … volle erlaubnis … bis ich stop sage»; Wortlaut: Memory
`dauerauftrag-effizienz-2026-08-14`). Fortlaufende, serielle Kleinschritte an Skills, Hooks, Toren
und Steuer-Doku — Prosa-Diät, tote Pfade, Wurzel-Fixes; je Punkt ein eigener Commit/PR, Grenzen
unverändert (§1, fachliche Abnahme, Risiko-Gegenprüfung).

**Warum diese Datei existiert.** Die Checkliste stand bis 29.8.2026 als EINE Zeile in ROADMAP.md und
war damit eine Merge-Konflikt-Falle: am 16.8.2026 erzeugte sie 6 Konflikte in derselben Zeile bei 15
offenen PRs, weil jede Buchung dort landet. Die Auslagerung war als Posten in der Liste selbst
vermerkt («Checkliste in `fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md` auslagern, hier nur Kopf +
Zeiger — Rückbau, kein Zuwachs») und ist mit dem Plan-Neuschnitt vollzogen.

---

## §1 — `QS-EFFIZIENZ` · Laufende Checkliste

**Massgeblich ist die Checkliste in `ROADMAP.md` am Schritt `QS-EFFIZIENZ`** (die Positionen
unter dem `@meta`-Block; Slice: `npm run fahrplan -- fahrplaene/FAHRPLAN-EFFIZIENZ-CHECKLISTE.md 1`
plus `sed -n '/id: QS-EFFIZIENZ/,/^$/p' ROADMAP.md`). Diese Datei trägt nur, was dort keinen Platz
hat: die **Altbestände vor dem Plan-Neuschnitt 29.8.2026**, die noch offen sind. Die 26 erledigten
Alt-Positionen (14.–30.8.2026) stehen wörtlich in der git-History dieser Datei (Stand vor
5.9.2026) — die Wörtlich-Kopie war eine zweite Wahrheit (§5) und kostete bei jedem Slice ~2 500
Token (Rückbau 5.9.2026, QS-EFFIZIENZ Runde 2).

Offen (Altbestand):

- [ ] **Prozess-Kleinfunde Session QS-MONITOR-ROT (18.9.2026)** — (a) `check:suchindex` läuft in keinem
  Workflow und keiner Tor-Kette (§6.7: Tor, das nie läuft) — einhängen oder streichen; (b) `plan:next`
  meldet eine Notizen-/Übergabe-Datei OHNE `- [ ]`-Zeilen als «abgearbeitet, löschen», obwohl sie offen
  ist (Anzeige liest nur Checkboxen) — Übergabe-Vorlage mit Pflicht-Checkbox oder Sonde auf Inhalt;
  (c) das Write-Werkzeug sperrt `<Haupt-Checkout>/.claude/notizen/` aus Worktree-Sessions — Notizen
  gehen nur per Shell-Heredoc; Skill `bauschritt` Station A Ziff. 4 sagt das nicht; (d) Skill `auftrag`
  Ziff. 6 (g) ist ein ~4500-Zeichen-Absatz — als Liste «Kaskade je Korpus-Art» gliedern; (e) Prüfer-
  Hinweis in den `lex-pruefung`-Auftrag: vite-node-Prüfskripte mit relativen Imports müssen im
  Repo-Wurzelverzeichnis liegen (Scratchpad-Skripte brauchen absolute Imports) und werden danach
  gelöscht; (f) Rot-Beweis mit Vorzustand: Backup per `git show <ref>:<pfad>` in den Scratchpad, nie
  Redirect auf eine getrackte Datei (Auto-Modus blockt).
- [ ] **LSP** — Befund 30.8.2026: `typescript-language-server` ist keine devDependency mehr
  (`npx` lädt remote nach). Rest-Auftrag: `WERKZEUG-VERDRAHTUNG.md`-Pflicht zurückbauen oder
  devDependency bewusst neu setzen — Entscheid in einer Session mit LSP-Bedarf.
- [ ] **Runner-Kontentions-Ausreisser beobachten** (14–15 Min bei identischem Inhalt; 2
  unabhängige Beobachtungen 14./15.8.2026 — Zuschreibung erst nach Verteilungsregel, dann ggf.
  eigener Schritt).
- [ ] **ENTREGULIERUNG RUNDE 2** — Startbedingung Token-Zeitreihe ≥ 5 Sessions (Stand 5.9.2026:
  17 Snapshots, Bedingung erfüllt); Prompt-Wortlaut: `bibliothek/betrieb/entregulierung-2026-08-07.md`
  § Runde 2.
- [ ] **subagent-wache Live-Beweis** (trägt `agent_type` zur Laufzeit «lex-…»? Beobachtung 30.8.:
  3 lex-Dispatches ohne Block, Berichte trugen Artefakte — beweisbar erst am echten Block-Fall).

Geschlossen 5.9.2026 (Belege):

- [x] **Auto-Buchungs-Push** — PAT-Weg steht: Lauf «Plan-Buchung» 33966105395 zu PR #717 endete
  `success` MIT Push (`01f6431c3` «QS-EFFIZIENZ -> ready (automatisch aus Merge-Trailer)»).
- [x] **QS-EFFIZIENZ-Zeile als Merge-Konflikt-Falle** — seit 29.8.2026 durch diese Datei gelöst.

Runde 2 (5.9.2026, Token-Messung dieser Session als Anlass — je Punkt ein Commit):

- [x] **Gate-Rot-Kondensat** — `scripts/gate.sh` schreibt bei Rot das Volllog nach `.gate/<tor>.log`
  und druckt nur Testnamen/Assertion/Ort/Summe (Messung: Vitest-Rot 800 Zeilen ≈ 25 000 Token, zweimal
  je Session über den Stop-Hook; Rot-Beweis 76 → 17 Zeilen). hooks-wache-Test fängt stderr (kein
  «SUBAGENT-WACHE»-Echo mehr in jeder Test-Ausgabe).
- [x] **run-parallel leise bei Grün** — Kopf + Summe mit drei langsamsten Toren statt 48 Zeilen
  (~600 Token je grünem Lauf); volle Liste bei `CI=1`/`--verbose`, Rot unverändert.
- [x] **Fahrplan-§1-Kopie zurückgebaut** (9 KB → 3 KB, ~2 500 Token je Slice).
- [x] **Landungs-Skill −3.5 KB** — Jules-Checkliste byte-treu nach `referenz-jules.md`, lädt nur bei
  offenem Jules-PR.

Runde 3 (20.9.2026, Anlass: ROADMAP-Deckel-Aufräumen — Nebenfunde aus vier Bau-Einheiten,
je Punkt ein eigener Commit/PR):

- [x] **`check:plan` Regel 15 «Kopf-Buchung»** — offene `- [ ]`-Posten unter einem `done`-Kopf
  werden rot (`scripts/plan/kopfBuchung.ts`, `src/tests/plan-check.kopf-buchung.test.ts`,
  F17-Erweiterung im Lehren-Register). Anlass: 15 Posten wochenlang unsichtbar, darunter eine
  offene §7-Fachfrage an David. Geburtsbeweis §6.7: rot 14/14 auf `0e4999b48`, grün 0 auf
  `8f6fe6971`, beide vom Orchestrator unabhängig nachgemessen. PR #942.
- [ ] **Tor «verwaister Posten ohne Kopf»** — eine eingerückte `- [ ]`-Zeile hinter einem `---`
  gehört zu keinem Schritt: Regel 10 sieht sie nicht (sucht `@meta`), Regel 15 per deklarierter
  Grenze auch nicht. Belegter Fall: Altstand `0e4999b48` Z. 734. Eigene Klasse, eigenes Tor.
- [ ] **Tor «Prosa-Verweis auf Schritt-ID ohne `@meta`»** — `ROADMAP.md` verwies auf einen nie
  angelegten Schritt `W3-TARIF-NACHVERIFIKATION` (angekündigt 6.9.2026, 0 Treffer am 20.9.2026).
  Regel 8.1 prüft nur `@queue`-IDs, nicht Fliesstext. Dritte Klasse derselben Familie.
- [ ] **`check:regel-wiedervorlage` härten** — bei zwei `@wiedervorlage`-Markern im selben Eintrag
  gilt still der letzte; der Leser sieht das nicht. Besser: zweiten Marker melden statt überschreiben.
- [ ] **`QS-CI-MINUTEN` widerspricht sich selbst** (§5, zwei Wahrheiten): Kopf sagt «Gebaut
  8.9.2026: M1–M5», führt M1–M5 aber weiter als offene Checkboxen. Im Schritt selbst auflösen.
- [ ] **Nachlass-Wache meldet Fehlalarm bei inhaltsgleichem Commit** — der SessionStart-Hook misst
  `ahead`, nicht Inhalts-Identität. Am 20.9.2026 gemeldeter «ungepushter Commit» war bereits
  upstream (andere SHA, von Parallel-Session gelandet), `git pull --rebase` verwarf ihn.
  Fix: Meldung um «patch evtl. schon upstream — erst rebasen» ergänzen.
- [ ] **Antigravity-Drift** agy 1.1.26 → 1.2.7 (Kontingent-Lauf 20.9.2026, kein Alarm).

**WARTET AUF DAVID (Planungsentscheid, kein Bau):** Der 120-KB-Deckel auf `ROADMAP.md` ist durch
die Verlagerung vom 20.9.2026 **entlastet, nicht stabilisiert**. Masse wandert in Fahrpläne, die
der Wächter **nicht misst** (`FAHRPLAN-OFFENE-BEFUNDE.md` 106.5 KB, `FAHRPLAN-UI-BEFUNDE.md`
155.1 KB). Rund 15 neue Befund-Zeilen aus einer Parallel-Session reissen den Deckel erneut —
am 20.9.2026 real passiert: 119.5 KB → 122.1 KB innerhalb einer Stunde. Offene Frage: brauchen
Fahrpläne ein eigenes Flächenbudget, oder soll ein Hook neue Befund-Zeilen unter einem Dach-Schritt
mit `fahrplan:`-Zeiger gleich in den Fahrplan lenken? Ohne Entscheid wiederholt sich der Nachzug.
