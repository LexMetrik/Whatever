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

  - [x] **M1** main-Push-Lauf auf Bau/Perf/Deploy kürzen (−15'050/Mt,
    Bauschritt + §6.7-Tor: Head ist Squash-Merge eines grünen PR, sonst
    Volllauf). Bedingung `strict==true` (Posten-Text bis 21.9.2026 — `strict`
    ist seit 19.9.2026 AUS) ist LÄNGST ersetzt durch den grünen
    `merge_group`-Lauf am gepushten SHA (`ci.yml`-Kommentar «Push-Diät
    prüfen»). ✅ 21.9.2026: Diät auf `bau`/`perf` ausgedehnt (QS-CI-MINUTEN
    Wanduhr-Auftrag, Branch `feat/qs-ci-minuten-wanduhr`) — Diät-Push fährt
    jetzt nur noch `diff · e2e-ergebnis · deploy`.
  - [x] **M3** e2e-Shards 8 → 4 (−3'800, Bauschritt + Branch-Regel).
    Umgesetzt 8.9.2026 (`dfc8cb164`, #773). **Zurückgenommen 21.9.2026**
    (Entscheid David: «versuch das zu kürzen» / «Zurück auf 8 Pakete» —
    Wanduhr vor kostenlosen Minuten, Repo öffentlich, `.../timing` meldet
    `{"billable":{}}`, `bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md:163`).
    `@shard-gruppe`-Annotationen auf den historischen Vor-M3-Stand
    zurückgesetzt, 11 seither neue Specs zähl- statt dauer-balanciert
    zugeteilt (offener Posten unten).
  - *Seit 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET): offene Befund-Einträge stehen im Wortlaut als Posten-Dateien, hier je ein Zeiger «→ Posten».*
  - → Posten `plan/posten/2026-09-24-qs-ci-minuten-widerspricht-sich-selbst-m1-m5-gebaut-aber-als.md` (QS-CI-MINUTEN widerspricht sich selbst — M1–M5 gebaut, aber als offen geführt (M4 im Fahrplan, M5- und M2-Posten))
  - [x] Wurzel `strict: true` ⇒ Merge Queue (Gate G7) — ✅ 19.9.2026, Ruleset 23699779, `strict` AUS.
  - [x] **Plan-Buchung: messen, dann zurückbauen** *(19.9.2026, UNGEMESSEN)* — passiert der `[skip ci]`-Push von `plan-buchung.yml` das Ruleset 23699779 noch? Wurzel ist ohnehin der Rückbau: der Status fährt seit 19.9.2026 im PR mit (`landung` Ziff. 9) ⇒ streichen oder auf reine Prüfung umstellen. Zwei Defekte in denselben Schnitt: `git log -1` sieht bei Sammel-Landung nur den Kopf-PR; eine `Co-Authored-By:`-Zeile im Trailer-Absatz leert den Fallback (`extractTrailerBlock`, `scripts/plan/buchung.ts`). **Messung 19./20.9.2026: 12 Läufe, 0 Buchungs-Commits auf main — Leerlauf; Rückbau steht.** ✅ 20.9.2026 abgebaut — Messung 12 Läufe/0 Buchungen; dieser PR.
  - [x] **Ersten reinen Doku-Eintrag in der Queue beobachten** — ✅ 19.9.2026, #931 (`951382d26`). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026 (2).
  - [x] **Doku-Abkürzung im `merge_group` bestätigt** — ✅ Entscheid David 20.9.2026: Ja. Messung 19./20.9.2026: ein reiner Doku-Eintrag fährt 1,1 min statt 25,5 min (n = 10 von 16 Einträgen). Der «zur Bestätigung vorgelegt»-Vermerk im `ci.yml`-Kopf ist damit eingelöst.
  - [x] **`scripts/landung/landung-kette.sh` real gegen die Queue fahren** — ✅ 19.9.2026, PR #919 (`661612cea`); Halte-Pfade weiterhin nur simuliert. Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026 (2).
  - → Posten `plan/posten/2026-09-24-landung-kette-sh-test-harness-ins-repo.md` (landung-kette.sh: Test-Harness ins Repo)
  - → Posten `plan/posten/2026-09-24-check-schlankheit-sieht-keine-sh-dateien.md` (check:schlankheit sieht keine .sh-Dateien)
  - [x] **§17 · `check:merge-schutz` prüft lokal nicht, was die Queue liest** *(Befund Session Gliederung 19.9.2026, #923 fiel zweimal aus der Queue, Lauf 35458509735)* — lokal zählen die Zweig-Commits, in der Queue der Squash aus PR-Titel + PR-Body; ein im Body verkürztes Verdikt («Befund-Teil < 15 Zeichen») ist lokal grün, in der Queue rot. Wurzel-Fix: `check:merge-schutz --pr <n>` liest `gh pr view --json title,body` und fährt `leseGegenpruefungAusRohLog` + `pruefeVerdiktForm` darüber; der Hook vor `gh pr merge` ruft diese Form. Risikopfad-nah (`scripts/gegenpruefung/`) ⇒ Bau mit Gegenprüfung. Bis dahin: Satz im Skill `landung`. ✅ 20.9.2026, PR #946 `2146ef631`.
  - → Posten `plan/posten/2026-09-24-dequeue-helfer-fehlt.md` (Dequeue-Helfer fehlt)
  - → Posten `plan/posten/2026-09-24-rename-schutz-der-diff-klassierung-ohne-dauerhaftes-tor.md` (Rename-Schutz der Diff-Klassierung ohne dauerhaftes Tor)
  - → Posten `plan/posten/2026-09-24-ci-yml-ca-z-300-keine-direkt-pushes-mehr-ist-ungenau.md` (ci.yml ca. Z. 300: «keine Direkt-Pushes mehr» ist ungenau)
  - [x] **Erster `merge_group`-Lauf der neuen Klassierung** — ✅ 19.9.2026, Lauf 35454618928 (#927). Wortlaut: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026 (2).
  - → Posten `plan/posten/2026-09-24-scripts-ci-diff-klassieren-ts-kopf-kommentar-behauptet-einen.md` (scripts/ci/diff-klassieren.ts: Kopf-Kommentar behauptet einen Aufrufer, den es nicht gibt)
  - → Posten `plan/posten/2026-09-05-or-leser-e2e-timeouts-app-weit-haerten-shard-laufzeit-deckel.md` (Punkt 5: Such-Tests (FlexSearch ~54k Artikel) unter Parallel-Last in Hook-Timeouts)
