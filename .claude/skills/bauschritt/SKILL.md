---
name: bauschritt
description: Verwenden für einen Bau-Auftrag oder ein Vorhaben aus ROADMAP.md (JETZT) — Trigger «Baue …», «bau das», «nimm das nächste Vorhaben», «Auftrag aufnehmen», «neuer Auftrag», «neuer Wunsch», «Fahrplan anlegen», «Dispatch», «Sub-Agent beauftragen», «räum die Roadmap auf». Lebenszyklus Einstieg → Bau → Prüfung → Landung → Weiterbau → Abschluss; dazu Aufnahme und Einordnung (§14.1–14.3), Definition of Done (§14.4), Trailer (§14.5), Delegation und Kontext-Hygiene (§14.6), Rahmen vor Feature (§10).
---

# Bauschritt — Aufnahme und Lebenszyklus einer Bau-Session

Eine Bau-Einheit = ein Vorhaben: angefangen, geprüft, gelandet, aus JETZT
gestrichen. Davids einziger Input ist der Bau-Prompt.

## Aufnahme (§14.1–§14.3)

- **Eingang ist `ROADMAP.md`** (ZIEL · JETZT · EINGANG; Form, Grenzen und
  Reihenfolge-Regel im ROADMAP-Kopf). Neuer Fehler → Zeile in
  `plan/FEHLERBESTAND.md` Teil A oder EINGANG; Frist, offenes Go, Idee →
  EINGANG; sessionfähiges Vorhaben → JETZT. Spec-Prosa in Detailplan bzw.
  Fahrplan, nie als zweiter Einstieg.
- Vorhaben nennen Ziel und Grenzen, nicht den Weg. Kürzel mit sprechendem
  Namensteil plus Klartext-Titel; bestehende Kürzel nie umbenennen
  (Verweis-Anker).
- Bau-Go von David ⇒ im selben Zug EINGANG- oder JETZT-Zeile mit Go-Marke;
  sie verfällt nie, nach 14 Tagen ohne Bau nennt der Abschlussbericht sie
  einmal.
- **Bündeln** bei gleicher Fläche (Dateien, Subsystem, Prüf-Fläche). **Nie
  Risiko-Klassen mischen** (Rechtsinhalt ≠ reines UI); nie zwei Vollausbauten
  über alle Kantone parallel. Klein trägt nie allein, mittel ist ein
  Session-Teil, gross nur bei echtem Serialisierungs- oder Risikozwang
  schneiden. Überschneidung ⇒ zusammenführen statt daneben.
- **Rahmen vor Feature (§10):** neue Vorlagen und Rechner nutzen Engine-Muster,
  Wizard-Rahmen, `ui.tsx`, Renderer; fehlt der Rahmen, wird erst er gebaut
  (Skill `refactoring`).

## A — Einstieg

1. **Startabfrage:** `git fetch --prune` · `gh pr list --state open` ·
   `git worktree list` · `gh issue list --state open --author
   "github-actions[bot]"` (Bot-Alarme); dann `ROADMAP.md`.
2. **Was gebaut wird:** Davids Chat-Auftrag, sonst das oberste freie
   JETZT-Vorhaben. Belegt (Zweig, Worktree oder PR beginnt mit dem Kürzel;
   Remote ohne PR: `git branch -r | grep -iE '^ *origin/<Kürzel>(/|-|$)'`)
   ⇒ STOPP, melden.
3. **Sichtbar werden:** Zweig `<Kürzel>/<slug>` anlegen und pushen, BEVOR der
   Detailplan entsteht (nur so sieht eine zweite Session die Belegung); main
   nimmt nur die Merge-Queue. Parallel-Session ⇒ eigener Worktree (§12).
   Detailplan aus dem Slice `npm run fahrplan -- <datei> <§>`, geprüft gegen
   den Ist-Stand.
4. **Notizen-Datei** `<Haupt-Checkout>/.claude/notizen/<YYYY-MM-DD>-<slug>.md`
   (gitignored; aus einem Worktree per Bash-Heredoc, weil Write dort sperrt;
   `tor-schutz.py` blockt auch eine bloss zitierte Hauptzweig-Push-Zeichenfolge). Vorgänger-Datei mit offenen Punkten weiterführen. Gerüst:

   ```
   Session: <Datum> <slug> · Vorhaben: <Kürzel oder Chat-Auftrag>
   ## Korrekturen David (Wortlaut)
   ## Nebenfunde (→ FEHLERBESTAND oder EINGANG)
   ## Lehren-Kandidaten (Skill lehren)
   ## Wartet auf David
   ```

## B — Bau

- Weicht die Spec vom Ist-Code ab: sofort in der Fahrplan-Datei korrigieren,
  dann weiterbauen.
- WIP-Commit nach jedem Teilschritt.
- Zusatzpunkte (Prüfer-Befunde, Davids Anmerkungen) bekommen einen frischen
  Agenten als Nachzug, nie den laufenden Bau.
- Nie mit leerer Antwort enden — sie archiviert die Session.
- Nebenfunde nie in diese Session und nie als Chip: echter Fehler ⇒ eine
  Zeile (FEHLERBESTAND/EINGANG), sonst verwerfen.
- Nebenfunde, Abweichungen und Lehren aus jedem Agentenbericht sofort in die
  Notizen-Datei, vor dem nächsten Dispatch; Arbeitslisten langer Läufe nie nur
  im Scratchpad.

## Delegation und Kontext-Hygiene (§14.6)

- **Weg:** Agent-Typen `lex-<klasse>` (bau · daten · pruefung · recherche ·
  mechanisch · synthese). Der Auftrag trägt Rolle, Whitelist, TABU,
  Rückgabe-Schema und CLAUDE.md §14.7 wörtlich; lange Specs als Datei-Zeiger.
  Webseiten-Sichtung: `.claude/rules/webseiten-pruefung.md` mitgeben.
- **Last:** höchstens 3–4 Agenten gleichzeitig; erst ein Recherche-Agent,
  nachfassen statt doppeln, vorher `bibliothek/` greppen.
- **Selbst macht der Orchestrator:** Plan- und Doku-Buchhaltung,
  Landungsmechanik, kleine verifizierte Fixes, Notizen-Datei.
  **Delegationspflichtig:** Gegenprüfung, Risiko-Pfad-Bau, Parallelisierbares,
  Kontextschweres.
- **Modell:** anspruchsvoller Bau stark, eng umrissener nicht-riskanter Bau
  mittel, Mechanik klein, Synthese mindestens mittel; Gegenprüfung stets auf
  einem anderen Modell als der Bau (bei Obergrenze Opus: Risikopfad-Bau Sonnet,
  Prüfung Opus, im Bericht offenlegen).
- **Fortsetzen statt neu spawnen** bei Folge-Slices derselben Fläche — nie für
  die Gegenprüfung, nie über Klassengrenzen, nicht ab ~300k Token Last.
- **Agenten-Behauptungen:** «Vorbestand/Flake per Nullprobe» gilt nur mit
  Kommando und Ausgabe; «es gibt kein X» nur nach repo-weiter Suche — auch für
  den Orchestrator: nie `head` auf einen Negativ-Grep (#1361: Treffer abgeschnitten,
  Gewinn halbiert); verhaltensneutral an mehreren Stellen ⇒ je Stelle Zusicherung
  und Rot-Probe.
- **Fallen:** Bau-Agenten isoliert (`isolation: "worktree"`, eigenes
  `npm ci --prefer-offline`, nie `node_modules`-Symlink); Worktrees als eigener
  Schritt mit absolutem Pfad anlegen. Einen abgebrochenen Isolations-Agenten neu
  dispatchen, nicht fortsetzen; vor einem Nachzug auf denselben Zweig den alten
  Worktree entfernen. Kein Fixer in einen Worktree mit laufender Prüfung, keine
  Orchestrator-Commits, wo ein Agent baut (geteilter Index). Scratchpad-Namen agentenspezifisch. Hintergrund-Bash stirbt nach
  10 min. CI-Wächter aus EINER Abfrage je voller SHA. `gh pr merge` immer als
  eigenen Befehl (der Hook blockt sonst den ganzen Mehrfach-Befehl). Kein `[skip ci]` in
  irgendeinem PR-Commit (der Squash trägt alle Betreffe nach main).
  Normtext-Bewegung ⇒ `npm run projektionen:normtext -- --datum=…`, Materialien
  ⇒ `npm run materialien:kaskade -- --datum=…`, nie Einzelbefehle. Vor dem
  ersten Push eines Daten- oder Bot-PR die Schritte von «Tore · Checks» einzeln
  fahren (der Job bricht beim ersten Rot ab).

## C — Prüfung

- Tore nackt, volle Ausgabe; lange Ausgaben `npm run <tor> > <log> 2>&1; echo $?`
  und bei Exit ≠ 0 gezielt lesen. Abschluss = CI-Lauf grün am Kopf-SHA
  (Lauf-ID), kein lokales gate.
- Rot-Beweise (§6.7) nur mit sauberem Index: erst eigene Dateien committen,
  dann Probe-Commit — sonst verschluckt `git reset --hard` Untracked.
- Risiko-Pfad (`istRisikoPfad`) im Diff ⇒ Skill `gegenpruefung`, Merge
  gesperrt bis Verdikt.

## Definition of Done (§14.4)

1. CI grün am Kopf-SHA. 2. Risiko-Pfade: Gegenprüfung gelaufen,
`npm run gegenpruefung:ok`. 3. Struktur-Umbau: golden byte-gleich (Skill
`refactoring`). 4. Status-Marker (§8). 5. Regeländerung: alle Stellen
greppen, die sie zitieren (Reglemente, `.claude/rules/*`, Skills). 6. JETZT
und EINGANG im abschliessenden PR nachgeführt.

## Trailer (§14.5)

- `Roadmap: <Kürzel>` · Risiko-Pfad `Gegenpruefung: <Verdikt> (<Modell>,
  <Linsen>) — <Befunde ≥ 15 Zeichen>` bzw. `Gegenpruefung: n/a — reine
  Prüflogik` · geänderte Assertion in Risiko-Engine-Tests oder Golden-Diff:
  `Fachaenderung: <Norm> — <Begründung ≥ 15 Zeichen>`.
- Block-Form: eine Leerzeile davor, keine darin, jede Zeile einzeilig (git
  liest nur den letzten Absatz). Prüfen: `git log -1
  --format='%(trailers:key=Roadmap,valueonly)'` und `npm run check:merge-schutz`.
  PR-Body: Prosa → «🤖 Generated with …» → Leerzeile → Trailer-Block (Skill
  `landung`).

## D — Landung · W — Weiterbau

Skill `landung`. Der PR, der das Vorhaben abschliesst, streicht es aus JETZT
und rückt nach. Begleitet die Session eine Landekette: Stillstands-Anker als
Hintergrund-`until`-Schleife (alle 5 min `git fetch`; 60 min kein main-Merge
bei Queue-Einträgen ⇒ «STILLSTAND»), dann selbst eingreifen; keine
Monitor-Streams.

Gelandet und Kontext tragfähig ⇒ weiterbauen: nächster Teil desselben
Vorhabens, sonst oberstes freies JETZT-Vorhaben **gleicher Risikoklasse**
(Startabfrage als Kollisionsprüfung), sonst E. Je Weiterbau voller Zyklus;
Schluss, bevor der Kontext knapp wird.

## E — Abschluss

- Notizen-Datei überführen: Nebenfunde und «Wartet auf David» →
  FEHLERBESTAND/EINGANG, Lehren → Skill `lehren`, Rest verwerfen; Datei
  löschen. Bei Übergabe bleibt sie, Pfad in den Chip.
- «Fertig» nur mit CI grün und Kopf-SHA, sonst «in Arbeit».
- Jede Änderung an JETZT als Zeile im Abschlussbericht (Davids Veto); ein
  separater Doku-PR nur bei echtem Rest.
- Bau-Flächen abräumen (Skill `landung` Session-Ende), eigener Worktree zuletzt.
- Bericht beginnt mit der Fortschrittszeile aus ROADMAP ZIEL samt Änderung;
  Schlusssatz: was live ist, was auf David wartet und warum.

## Plan-Pflege und Rückbau

Vor jeder Streichung: «Steuert der Eintrag noch etwas?» — Streichung mit
Begründungszeile im Commit. Code fällt nur mit Beweis vorher: keine
eingehenden Verweise (nur `git ls-files`-Bestand; Backlink-Suche ohne
Verzeichnis-Ausschluss; `*.test.ts` ist nie verwaist), Tore und Golden grün
danach, bei Rechtslogik kein ungetesteter Rechtsfall daran. Wer einen
gefangenen Defekt fixt, nennt den Fänger («gefangen von `<spec/tor>`»).
