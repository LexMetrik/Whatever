---
name: bauschritt
description: Verwenden für einen Bau-Auftrag von David oder ein Vorhaben aus ROADMAP.md (JETZT) — Trigger «Baue …», «bau das», «nimm das nächste Vorhaben». Kodifiziert Einstieg → Bau → Prüfung → Landung → Weiterbau → Abschluss sowie, via aufraeumen.md, das Steuer-Doku-Aufräumen («räum die Roadmap auf», «Ceiling gerissen», «struktur-rotieren.py --check rot», «ROADMAP zu gross», «Steuer-Doku verschlanken», «aufraeumen:git»).
---

# Bauschritt — Standard-Lebenszyklus einer Bau-Session

**Anlass-Kopf — Ritual-Diät 29.8.2026 (Auftrag David: «Kontrolle abbauen, wo
sie nichts trägt»).** Der frühere «leichte Pfad» ist ab hier der NORMALFALL:
Station A hat 4 Punkte (Nachtrag 15.9.2026: Session-Notizen-Datei), Station E 3
(Abschluss-Diät 20.9.2026). Was gestrichen wurde und warum, steht
unten unter «Gestrichene Pflichten» — **Station C (Prüfung) ist unverändert**,
und §9/§12/§14.7/§18 bleiben Wort für Wort in Kraft.

**Dünne Klammer, keine Kopien:** entscheidet nur *was wann* dran ist, nicht
*wie* (§5). **Eine Bau-Einheit = ein Vorhaben:** angefangen, geprüft, gelandet,
aus JETZT gestrichen; Neues unterwegs → EINGANG (Station B), nicht in die
Session. Nach Landung baut eine tragfähige Session automatisch weiter
(Station W). Davids einziger Input ist der Bau-Prompt — alles Übrige läuft
ohne Rückfrage nach diesem Zyklus.

## Station A — Einstieg (4 Punkte)

1. **Startabfrage** (Regel 6 unten): `git fetch --prune`;
   `gh pr list --state open`; `git worktree list`;
   `gh issue list --state open --author "github-actions[bot]"` (Bot-Alarme —
   einziger Leser seit 5.10.2026). Dann `ROADMAP.md` lesen (ZIEL · JETZT ·
   EINGANG). Fremder Zweig, Worktree oder PR auf derselben Fläche =
   Kollision → melden, nie parallel in dieselbe Fläche bauen.
2. **Was gebaut wird:** was David im Chat aufträgt, sonst das oberste freie
   JETZT-Vorhaben. Belegt (Zweig, Worktree oder PR, dessen Name das Kürzel enthält —
   `git branch -r | grep -i <Kürzel>`, Gross-/Kleinschreibung egal) ⇒
   **STOPP, melden**.
3. **Sichtbar werden** (F6, Regel 7 unten): Zweig anlegen und **pushen,
   bevor der Detailplan entsteht** — nie main (main nimmt seit 19.9.2026 nur
   die Merge-Queue, kein Bypass; Hook `tor-schutz.py` blockt, Skill
   `landung` Ziff. 7). Parallel-Session ⇒ eigener Worktree (§12). Detailplan
   danach aus Fahrplan-Slice (`npm run fahrplan -- <fahrplan-datei> <§>`)
   und Merkzetteln des Themas, geprüft gegen den Ist-Stand.
4. **Notizen-Datei anlegen** (§17, Weisung David 15.9.2026): aus der Vorlage
   `docs/token-oekonomie/session-notizen-vorlage.md` unter
   `<Haupt-Checkout>/.claude/notizen/<YYYY-MM-DD>-<session-slug>.md`
   (gitignored; aus einem Worktree per Bash, `cat > … <<'EOF'` — das
   Write-Werkzeug sperrt `<Haupt-Checkout>/.claude/`). Liegt dort eine
   Vorgänger-Datei mit offenen Punkten, wird sie ÜBERNOMMEN (weiterführen),
   nicht ignoriert.
   **Falle (Beleg 20.9.2026):** `tor-schutz.py` blockt das Bash-Kommando
   schon, wenn die Hauptzweig-Push-Zeichenfolge nur als ZITAT im
   Heredoc-Text der Notiz steht (keine Ausführung) — solche Zitate beim
   Formulieren umschreiben; ohne Worktree (Haupt-Session) geht `Write`/`Edit`
   mit dem absoluten Haupt-Checkout-Pfad direkt, statt des Heredoc-Umwegs.

### Plan-Regeln (Umstieg 5.10.2026, Freigabe David)

4. Gibt David ein Bau-Go, schreibt die Session den Gedächtnis-Eintrag und im
   selben Zug eine EINGANG- oder JETZT-Zeile mit der Marke «Go David
   TT.MM.»; sie verfällt nie; nach 14 Tagen ohne Bau nennt der
   Abschlussbericht sie einmal mit Grund.
5. Jede Änderung an JETZT steht als eine Zeile im Abschlussbericht (Davids
   Veto).
6. Die Startabfrage (Station A Ziff. 1) ersetzt den Lage-Block von
   `plan:next`.
7. Der Zweigname beginnt mit dem Vorhaben-Kürzel; der Zweig wird
   hochgeladen, BEVOR der Detailplan geschrieben wird (so sieht eine zweite
   Session die Belegung).

## Station B — Bau

- Nach **Bau-Prompt + Fahrplan-Spec**, nicht nach Erinnerung.
- **Lebendige Spec (David 15.8.2026):** Weicht die Spec vom Ist-Code ab, wird
  sie **sofort in der Fahrplan-Datei korrigiert** (datiert, Anlass-Halbsatz)
  und weitergebaut — nie gegen die veraltete Spec bauen, nie die Abweichung
  nur im Chat vermerken. Spec-Korrektur bleibt erlaubt; «eingefroren»
  betrifft nur Fortschritts-Häkchen und Bau-Stand.
- **Delegation:** Klassen/Stufen/Dispatch-Vorlage → Skill `auftrag` Ziff. 6;
  diese Session orchestriert und landet.
- **WIP-Commit nach jedem Teilschritt** (F5) — nie über längere Arbeit
  uncommittet bleiben.
- **Auftrags-Wachstum ⇒ neuer Agent.** Zusatzpunkte (Prüfer-Befunde,
  David-Anmerkungen) bekommen einen frischen Agent mit frischem Kontext als
  eigenen Nachzug — nie in den laufenden Bau nachschieben (16.8.2026:
  H2-Agent lieferte nach ~470k Token sichtbar weniger als beauftragt).
- **Im «run till dry» nie mit leerer Antwort enden.** Nach jeder Agenten-Rückmeldung
  folgt der nächste Zug oder ein ausdrücklicher Zwischenstand — eine leere Antwort
  archiviert die Session, und der Bau steht bis zum nächsten Menschen still (Nacht
  5./6.9.2026).
- **Nebenfunde** nie in diese Session oder als Chip: neuer echter Fehler ⇒
  eine EINGANG-Zeile in `ROADMAP.md`, sonst verwerfen; weiterbauen.
- **Jeder Agentenbericht: Punkt «Nebenfunde/Abweichungen» und jede
  aufkommende Lehre SOFORT in die Notizen-Datei**, vor dem nächsten Dispatch —
  der Chat ist kein Speicher (Kompaktierung bei 700k; Weisung David
  15.9.2026). Auch Arbeitslisten langer Läufe (Inventar, Befundliste): nie nur
  im Scratchpad — der App-Neustart leerte ihn (2.10.2026: 464 Funktionen,
  ~45 Befunddateien weg).

## Station C — Prüfung (unverändert)

- Genannte **Tore nackt fahren** (kein `--silent`, keine Filter, volle
  Ausgabe lesen); Abschluss `npm run gate`.
- **Rot-Beweise (§6.7) nur mit sauberem Index:** erst eigene neue Dateien
  committen, DANN Wegwerf-Probe-Commit anlegen/verwerfen — `git reset
  --hard` danach verschluckt sonst untracked Neu-Dateien und uncommittete
  Nachbar-Änderungen (Beleg: 8.8.2026, QS-AUDIT-VERWEISE).
- **Risiko-Pfad** (`istRisikoPfad`, `scripts/gegenpruefung/kern.ts`) im
  Diff ⇒ Skill **`gegenpruefung`** Pflicht, Merge gesperrt bis Verdikt.
- Verhaltensändernd ⇒ golden byte-gleich (§6, Skill `refactoring`).

## Station D — Landung

Skill **`landung`** Schritt für Schritt (§12 + §9: Tore vor Merge, Bug-Check,
Einreihen in die Merge-Queue, CI-Grün, Nachkontrolle). **JETZT nachführen
gehört IN den PR**, der das Vorhaben abschliesst: der letzte PR streicht es
aus JETZT, legt erledigte Merkzettel nach `archiv/posten/` und rückt nach
(Reihenfolge-Regel im ROADMAP-Kopf; `landung` Ziff. 9) — nicht hinter die
Landung.

**Kein Stillstand ohne David (Auftrag 16.8.2026, nach 7 h stummem Warten):**
Wer eine Landekette per Wächter begleitet, setzt einen **Stillstands-Anker** —
Hintergrund-Bash mit `until … done` (alle 5 min `git fetch`; 60 min
[Check-Timeout der Queue; Durchlauf belegt ~30 min] kein neuer main-Merge
UND noch Einträge in der Queue ⇒ «STILLSTAND»), worauf die Session SELBST
eingreift (Konflikt lösen; nach Rauswurf ERST den `merge_group`-Lauf lesen,
dann neu einreihen — `landung` §Merge-Queue).
Keine Monitor-Streams — die liefen am 16.8.2026 mehrfach still aus. Massgeblich
ist der Merge-Zeitstempel auf origin/main.

## Station W — Weiterbau (David 8.8.2026)

Gelandet + Session tragfähig ⇒ **nicht abschliessen**, weiterbauen:
(a) nächster offener Merkzettel desselben Vorhabens; (b) oberstes freies
JETZT-Vorhaben **gleicher Risikoklasse** (Startabfrage als
Kollisionsprüfung); (c) nichts Sinnvolles mehr ⇒ Station E.

Je Weiterbau voller Zyklus im Kleinen (Zweig zuerst hochladen, volle
Sorgfalt, eigener Commit mit eigenem Roadmap-Trailer).
**NIE sortenrein-widrig auf Risikopfade wechseln**; Schluss
**spätestens bevor der Kontext zur Neige geht** — lieber sauber landen.

## Station E — Abschluss (3 Punkte)

- [ ] **Notizen-Datei überführen:** «Nebenfunde»/«Wartet auf David» von Hand
      als EINGANG-Zeilen in `ROADMAP.md`; der Rest an seinen Repo-Ort
      (Skill, Tor) oder verwerfen. Einzeilig dabei der **§17-Lehren-Check**: Lehre aufgekommen
      ⇒ verankert nach Formregel Skill `lehren` (Tor > Dispatch-§0 > Skill >
      Prosa) — nur im Chat gilt als nicht gezogen. Danach Datei löschen;
      Übergabe: Datei bleibt, Pfad im Chip. Einen PR/Zweig nennt die Übergabe
      nur mit Beleg «fertig» (gate-Exit 0 + Kopf-SHA), sonst «in Arbeit» —
      Beleg D2/#1072 (24.9.2026): «fertig, nicht eingereicht», war gate-rot
      mit 5 Tests, Lint und Schlankheit (§14.7).
- [ ] **JETZT nachgeführt** im abschliessenden PR (Station D); jede
      Änderung an JETZT als Zeile im Abschlussbericht (Regel 5), Go-Marken
      nach Regel 4. Ein **separater Doku-PR nur dann**,
      wenn danach wirklich noch Rest-Doku offen ist (Skill `landung` Ziff. 7)
      — nicht als Ritual.
- [ ] **Bau-Flächen abräumen:** `npm run aufraeumen:git` (räumt nur LOKAL;
      Remote-Zweige ungelandeter Arbeit von Hand) + Scratch-Dateien,
      `git checkout main && git pull`; den EIGENEN Worktree zuletzt
      (`landung` §Session-Ende). Dazu der
      **Klartext-Schlusssatz an David**: was live ist, «nichts wartet auf dich»
      oder genau *was* und warum.

Nur wenn Jules oder Gemini an der Session beteiligt war: Messwerte + `npm run
fremdagenten:messung -- --kontingent` nach Skill `auftrag` Ziff. 4 Punkt 7.

### Gestrichene Pflichten (29.8.2026, ergänzt 20.9.2026) — je mit Anlass

- **Volle Session-Karte als Default** — nur noch bei Risikopfad/Lehre;
  15.8.2026 gemessen: 51 % aller Commits waren reine Doku-/Plan-Pflege.
- **`npm run plan:bild`** — Lagebild abgebaut 5.10.2026 (Umstieg).
- **`struktur-rotieren.py --check`** — läuft als SessionStart-Hook, dort nur
  prüfend (`LEXMETRIK_NO_ROTATE=1` in `.claude/settings.json` schaltet die
  Rotation ab; sie läuft von Hand, wenn der Wächter meldet), UND als CI-Tor
  `check:steuerdeckel`; eine dritte Handprüfung fängt nichts — ausser
  nach einem Edit an `.claude/hooks/*.py` oder `scripts/check-*.ts`: dort
  einmal von Hand vor dem Push (Flächen-Deckel; Beleg #895, 15.9.2026: ein
  CI-Lauf verloren).
- **Karten-ZEILE / Session-Karte in `STRUKTUR.md`** (20.9.2026) — kein
  Werkzeug liest den Karten-INHALT: `struktur-aktuell.py` (abgebaut
  5.10.2026) mass nur den git-Abstand, `struktur-rotieren.py` nur Grösse und Alter; gemessen ~1 500
  geänderte Zeilen in 14 Tagen reine Ablage. Ersatz ist der PR-Body.
  STRUKTUR.md bleibt als Struktur-Nachschlagewerk.
- **Fremdagenten-Messwerte und Kontingent-Lauf als Pflichtpunkte** (20.9.2026)
  — jetzt bedingt (Station E, letzter Absatz): Jules-Suggestions sind seit
  14.9.2026 aus.
- **Memory-Durchsicht** — nur wenn die Session das Memory berührt hat.
- **Grössen-Check (`groesse:`)** — Feld existiert nicht mehr.

---

## Token-Regeln (in jeder Station)

- **Slices statt Dateien:** `fahrplan -- <datei> <§>`; STRUKTUR nie am
  Stück gelesen.
- **Nichts doppelt lesen:** Unteragenten-Bericht ist das Ergebnis.
- **Mechanik nach unten delegieren** (Verschieben/Formatieren/Umbenennen/
  Sweeps auf günstigere Stufe, Skill `auftrag` Klassen-Palette).
- **Lange Tor-Ausgaben in eine Logdatei, Exit-Code lesen** (Orchestrator):
  `npm run <tor> > <scratchpad>/x.log 2>&1; echo $?` ist keine Pipe (der Hook
  lässt es zu) und hält 200+ Zeilen aus dem Kontext — `check:fedlex-versionen`
  druckt 232 Zeilen (Beleg 18.9.2026). Bei Exit ≠ 0 die Logdatei gezielt lesen.
- **Antworten kurz:** kein Nacherzählen von Tool-Ausgaben.
