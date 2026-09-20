# FAHRPLAN — Prüfstrasse sparsamer ohne Prüftiefe-Verlust
<!-- @lagebild name: CI-Minuten · zweck: Die Prüfstrasse billiger fahren, ohne ein Tor oder Prüftiefe aufzugeben. -->

> **ROADMAP-Schritt:** `QS-CI-MINUTEN` (Auftrag David 8.9.2026). Ziel unverändert im Plan:
> CI-Minuten senken, **kein Tor entfällt**, `check:e2e-shards` bleibt.
> **Datenquelle der Sparrechnung:** [`bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md`](../bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md)
> — 61 381 min/Monat, `ci.yml` 97,5 %, Sparplan −24 300 ohne Prüftiefe-Verlust.

**Zweck dieser Datei.** `QS-CI-MINUTEN` trug seine Restposten bis zum 20.9.2026 im Plan
selbst. Als `ROADMAP.md` den 120-KB-Deckel riss, entschied David am 20.9.2026, die langen
Unterpunkt-Listen der grossen Schritte in den jeweils verlinkten Fahrplan zu verlagern; der
Schritt hatte als einziger der vier Flächen keinen — diese Datei ist er (§10: erst der
Rahmen, dann darauf bauen). Aufbau und Ton sind
[FAHRPLAN-OFFENE-BEFUNDE.md](FAHRPLAN-OFFENE-BEFUNDE.md) nachgebildet.

**Belege altern nicht.** Datierte Mess- und Reproduktionsangaben in dieser Datei werden nie
an einen neuen Ist-Stand «nachgeführt», nur ergänzt. Wer eine Position abarbeitet, hakt sie
in `ROADMAP.md` ab und trägt das Ergebnis in `ROADMAP-CHRONIK.md` nach.

---

## §1 — `QS-CI-MINUTEN` · Restposten im Wortlaut *(verlagert 20.9.2026)*

Wörtlich aus `ROADMAP.md` (Stand 20.9.2026), **byte-genau, nichts zusammengefasst**
(~40 % Retrieval-Verlust). Bewusst in `ROADMAP.md` geblieben und darum hier NICHT
wiederholt: die beiden David-Freigabe-Posten **M2** (Dependabot) und **M5** (Plan-Buchung
`npm ci`), der Flacker-Stichtag 22.9.2026 samt Nachmessungs-Termin 8.10.2026 und die
Ziel-/Auflagen-Zeilen des Schrittes.

  - [ ] **M1** main-Push-Lauf auf Bau/Perf/Deploy kürzen (−15'050/Mt,
    Bauschritt + §6.7-Tor: Head ist Squash-Merge eines grünen PR, sonst
    Volllauf). **Bedingung `strict==true` neu fassen** — `strict` ist seit
    19.9.2026 AUS (Merge-Queue).
  - [ ] **M3** e2e-Shards 8 → 4 (−3'800, Bauschritt + Branch-Regel).
  - [ ] **M4** Doku-Läufe: 8 Shard-Kontexte → 1 Sammel-Kontext (−1'500,
    Bauschritt + Branch-Regel — **Fallstrick:** Required-Check-Name ändert,
    `check:merge-schutz`-Liste im selben Schritt nachziehen).
  - [x] Wurzel `strict: true` ⇒ Merge Queue (Gate G7) — ✅ 19.9.2026, Ruleset 23699779, `strict` AUS.
  - [ ] **Plan-Buchung: messen, dann zurückbauen** *(19.9.2026, UNGEMESSEN)* — passiert der `[skip ci]`-Push von `plan-buchung.yml` das Ruleset 23699779 noch? Wurzel ist ohnehin der Rückbau: der Status fährt seit 19.9.2026 im PR mit (`landung` Ziff. 9) ⇒ streichen oder auf reine Prüfung umstellen. Zwei Defekte in denselben Schnitt: `git log -1` sieht bei Sammel-Landung nur den Kopf-PR; eine `Co-Authored-By:`-Zeile im Trailer-Absatz leert den Fallback (`extractTrailerBlock`, `scripts/plan/buchung.ts`).
  - [x] **Ersten reinen Doku-Eintrag in der Queue beobachten** — ✅ 19.9.2026, #931 (`951382d26`). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026 (2).
  - [x] **`scripts/landung/landung-kette.sh` real gegen die Queue fahren** — ✅ 19.9.2026, PR #919 (`661612cea`); Halte-Pfade weiterhin nur simuliert. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026 (2).
  - [ ] **`landung-kette.sh`: Test-Harness ins Repo** *(19.9.2026)* — die Simulation a–g samt Rot-Beweis lag nur im Session-Scratchpad und ist weg; ohne sie ist jeder Folge-Edit an den Halte-Pfaden ungeprüft. Als `scripts/landung/*.test.*` mit gefälschtem `gh` im PATH nachbauen (§6.7: einmal rot zeigen).
  - [ ] **`check:schlankheit` sieht keine `.sh`-Dateien** *(19.9.2026)* — `landung-kette.sh` und `scripts/ci/*.sh` wachsen ohne Deckel. Glob erweitern oder bewusst ausnehmen und begründen.
  - [ ] **§17 · `check:merge-schutz` prüft lokal nicht, was die Queue liest** *(Befund Session Gliederung 19.9.2026, #923 fiel zweimal aus der Queue, Lauf 35458509735)* — lokal zählen die Zweig-Commits, in der Queue der Squash aus PR-Titel + PR-Body; ein im Body verkürztes Verdikt («Befund-Teil < 15 Zeichen») ist lokal grün, in der Queue rot. Wurzel-Fix: `check:merge-schutz --pr <n>` liest `gh pr view --json title,body` und fährt `leseGegenpruefungAusRohLog` + `pruefeVerdiktForm` darüber; der Hook vor `gh pr merge` ruft diese Form. Risikopfad-nah (`scripts/gegenpruefung/`) ⇒ Bau mit Gegenprüfung. Bis dahin: Satz im Skill `landung`.
  - [ ] **Dequeue-Helfer fehlt** *(19.9.2026)* — `gh` kennt keinen Befehl, einen PR aus der Queue zu nehmen (nur Web oder GraphQL `dequeuePullRequest`); ein irrtümlich eingereihter PR ist heute nur von Hand zu stoppen. Kleiner Helfer unter `scripts/landung/` plus Zeile im Skill `landung`.
  - [ ] **Rename-Schutz der Diff-Klassierung ohne dauerhaftes Tor** *(Gegenprüfung 19.9.2026)* — `previous_filename` fliesst seit 16ff18090 in alle drei `ci.yml`-Zweige, belegt ist das nur durch die einmalige Prüfer-Probe; die Vitest-Parität (a80a6a3bd) deckt die Muster, nicht die jq-Zeile `DATEI_JQ`. Probe mit aufgezeichneter Compare-Antwort nachziehen.
  - [ ] **`ci.yml` ca. Z. 300: «keine Direkt-Pushes mehr» ist ungenau** *(19.9.2026)* — das Ruleset 23699779 trägt nur die Regel `merge_queue`; ob der Server einen Direkt-Push ablehnt, ist UNGEMESSEN (der Klassifikator blockt den Versuch). Kommentar auf «per Hook und Entscheid David 19.9.2026 gesperrt, serverseitig ungemessen» richtigstellen.
  - [x] **Erster `merge_group`-Lauf der neuen Klassierung** — ✅ 19.9.2026, Lauf 35454618928 (#927). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026 (2).
  - [ ] **`scripts/ci/diff-klassieren.ts`: Kopf-Kommentar behauptet einen Aufrufer, den es nicht gibt** *(§5-Nebenfund 19.9.2026)* — `ci.yml` ruft die Funktion nicht auf, sondern trägt eine wortgleiche Shell-Fassung. Kommentar richtigstellen oder Doppelpflege beenden (§5).
  - [ ] **Such-Tests (FlexSearch ~54k Artikel) unter Parallel-Last in Hook-Timeouts** *(2 Belege 19.9.2026, isoliert + Re-Run grün)* — `scripts/datenhaltung/suche*.test.ts`, `src/tests/suche/rankingTestset.test.ts`, `allgemeineFrist.property.test.ts`.
