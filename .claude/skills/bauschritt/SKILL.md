---
name: bauschritt
description: Verwenden für einen Lagebild-Bau-Prompt oder einen einzelnen Roadmap-Schritt — Trigger «Baue den LexMetrik-ROADMAP-Schritt …», «bau das», «nimm den nächsten Schritt», Bau-Auftrag aus plan-bild.html. Kodifiziert Einstieg → Bau → Prüfung → Landung → Weiterbau → Abschluss sowie, via aufraeumen.md, das Steuer-Doku-Aufräumen («räum die Roadmap auf», «Ceiling gerissen», «struktur-rotieren.py --check rot», «ROADMAP zu gross», «Chronik-Überführung», «Fahrplan archivieren», «Steuer-Doku verschlanken»).
---

# Bauschritt — Standard-Lebenszyklus einer Bau-Session

**Anlass-Kopf — Ritual-Diät 29.8.2026 (Auftrag David: «Kontrolle abbauen, wo
sie nichts trägt»).** Der frühere «leichte Pfad» ist ab hier der NORMALFALL:
Station A hat 4 Punkte (Nachtrag 15.9.2026: Session-Notizen-Datei), Station E 3
(Abschluss-Diät 20.9.2026). Was gestrichen wurde und warum, steht
unten unter «Gestrichene Pflichten» — **Station C (Prüfung) ist unverändert**,
und §9/§12/§14.7/§18 bleiben Wort für Wort in Kraft.

**Dünne Klammer, keine Kopien:** entscheidet nur *was wann* dran ist, nicht
*wie* (§5). **Eine Bau-Einheit = ein Schritt:** angefangen, geprüft, gelandet,
Status geschlossen; Neues unterwegs → in den Plan (Station B), nicht in die
Session. Nach Landung baut eine tragfähige Session automatisch weiter
(Station W). Davids einziger Input ist der Bau-Prompt — alles Übrige läuft
ohne Rückfrage nach diesem Zyklus.

## Station A — Einstieg (4 Punkte)

1. **`git fetch --prune`, dann `plan:next`**, Lage-Block **lesen**: stale
   `wip`, gleiches `feld:` auf `wip`, fremde Bau-Plätze = Kollisionsmeldung →
   melden, nie parallel in dieselbe Fläche bauen. Bündeln nach `feld:`:
   kollisionsfreie `ready-now`-Nachbarn desselben Feldes gleich mitnehmen
   (je eigener Commit/Trailer), bis die Session gefüllt ist.
2. **ID gegen `ready-now`.** Nicht darin (Abhängigkeit offen, `done`,
   blockiert) ⇒ **STOPP, melden, nicht bauen** — massgeblich ist `plan:next`,
   nicht der Prompt.
3. **Sichtbar werden** (F6): Branch `feat/<slug-der-id>` anlegen,
   `plan:set -- <id> status=wip && check:plan`, committen, **Feature-Branch**
   pushen — nie main (main nimmt seit 19.9.2026 nur die Merge-Queue, kein
   Bypass; Hook `tor-schutz.py` blockt, Skill `landung` Ziff. 7).
   Parallel-Session ⇒ eigener Worktree (§12). Bau-Spec bei Bedarf
   als Slice: `npm run fahrplan -- <fahrplan-datei> <§>`.
4. **Notizen-Datei anlegen** (§17, Weisung David 15.9.2026): aus der Vorlage
   `docs/token-oekonomie/session-notizen-vorlage.md` unter
   `<Haupt-Checkout>/.claude/notizen/<YYYY-MM-DD>-<session-slug>.md`
   (gitignored; aus einem Worktree per Bash, `cat > … <<'EOF'` — das
   Write-Werkzeug sperrt `<Haupt-Checkout>/.claude/`). Zeigt `plan:next`
   eine Vorgänger-Datei mit offenen Posten (`📝 Session-Notizen: … — N
   offen`), wird sie ÜBERNOMMEN (weiterführen), nicht ignoriert.
   **Falle (Beleg 20.9.2026):** `tor-schutz.py` blockt das Bash-Kommando
   schon, wenn die Hauptzweig-Push-Zeichenfolge nur als ZITAT im
   Heredoc-Text der Notiz steht (keine Ausführung) — solche Zitate beim
   Formulieren umschreiben; ohne Worktree (Haupt-Session) geht `Write`/`Edit`
   mit dem absoluten Haupt-Checkout-Pfad direkt, statt des Heredoc-Umwegs.

## Station B — Bau

- Nach **Bau-Prompt + Fahrplan-Spec**, nicht nach Erinnerung.
- **Lebendige Spec (David 15.8.2026):** Weicht die Spec vom Ist-Code ab, wird
  sie **sofort in der Fahrplan-Datei korrigiert** (datiert, Anlass-Halbsatz)
  und weitergebaut — nie gegen die veraltete Spec bauen, nie die Abweichung
  nur im Chat vermerken. Erledigte §§ wandern bei der Rotation ins Archiv
  ([aufraeumen.md](aufraeumen.md)).
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
- **Nebenfunde in den Plan**, nie in diese Session oder als Chip:
  `plan:posten -- neu --dach <ID> --titel "…"`, sonst ROADMAP-Schritt (Skill
  `auftrag` Ziff. 3), weiterbauen.
- **Jeder Agentenbericht: Punkt «Nebenfunde/Abweichungen» und jede
  aufkommende Lehre SOFORT in die Notizen-Datei**, vor dem nächsten Dispatch —
  der Chat ist kein Speicher (Kompaktierung bei 700k; Weisung David
  15.9.2026).

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
Einreihen in die Merge-Queue, CI-Grün, Nachkontrolle). **Status schliessen
gehört IN den PR**, der den Schritt abschliesst (`plan:set -- <id>
status=done`/`ready`/`parked`, `check:plan`, committen — `landung` Ziff. 9),
nicht hinter die Landung.

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
(a) nächster offener Posten desselben Dachs (`plan:posten -- <ID>`); (b) oberster `ready`-Schritt
**gleicher Risikoklasse** und möglichst gleichen `feld:`-Werts (`plan:next` +
Kollisionsprüfung); (c) nichts Sinnvolles mehr ⇒ Station E.

Je Weiterbau voller Zyklus im Kleinen (`status=wip`, volle Sorgfalt, eigener
Commit mit eigenem Roadmap-Trailer).
**NIE sortenrein-widrig auf Risikopfade wechseln**; Schluss
**spätestens bevor der Kontext zur Neige geht** — lieber sauber landen.

## Station E — Abschluss (3 Punkte)

- [ ] **Notizen-Datei überführen:** `plan:posten -- aus-notizen <datei>` erntet
      «Nebenfunde»/«Wartet auf David»; der Rest an seinen Repo-Ort (Fahrplan,
      Skill, Tor). Einzeilig dabei der **§17-Lehren-Check**: Lehre aufgekommen
      ⇒ verankert nach Formregel Skill `lehren` (Tor > Dispatch-§0 > Skill >
      Prosa) — nur im Chat gilt als nicht gezogen. Danach Datei löschen;
      Übergabe: Datei bleibt, Pfad im Chip.
- [ ] **Status geschlossen:** `plan:set -- <id> status=done` + `check:plan`
      stehen im Feature-PR (Station D). Ein **separater Doku-PR nur dann**,
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
- **`npm run plan:bild`** — auf Abruf (David fragt das Lagebild an, wenn er
  es braucht); die Dock-Datei steuert keinen Bau.
- **`npm run selbstopt:erheben`** — war bis 20.9.2026 auf Abruf; seither
  ENTFALLEN samt der Zeitreihe (Entscheid David, Rückbau QS-EFFIZIENZ) —
  Nachfolge-Messung `npm run tor:bewaehrung`.
- **`struktur-rotieren.py --check`** — läuft als SessionStart-Hook, dort nur
  prüfend (`LEXMETRIK_NO_ROTATE=1` in `.claude/settings.json` schaltet die
  Rotation ab; sie läuft von Hand, wenn der Wächter meldet), UND als CI-Tor
  `check:steuerdeckel`; eine dritte Handprüfung fängt nichts — ausser
  nach einem Edit an `.claude/hooks/*.py` oder `scripts/check-*.ts`: dort
  einmal von Hand vor dem Push (Flächen-Deckel; Beleg #895, 15.9.2026: ein
  CI-Lauf verloren).
- **Karten-ZEILE / Session-Karte in `STRUKTUR.md`** (20.9.2026) — kein
  Werkzeug liest den Karten-INHALT: `struktur-aktuell.py` misst nur den
  git-Abstand, `struktur-rotieren.py` nur Grösse und Alter; gemessen ~1 500
  geänderte Zeilen in 14 Tagen reine Ablage. Ersatz ist der PR-Body.
  STRUKTUR.md bleibt als Struktur-Nachschlagewerk.
- **Fremdagenten-Messwerte und Kontingent-Lauf als Pflichtpunkte** (20.9.2026)
  — jetzt bedingt (Station E, letzter Absatz): Jules-Suggestions sind seit
  14.9.2026 aus.
- **Memory-Durchsicht** — nur wenn die Session das Memory berührt hat.
- **Grössen-Check (`groesse:`)** — Feld existiert nicht mehr; Bündelung
  läuft über `feld:` (Station A Ziff. 1).

---

## Token-Regeln (in jeder Station)

- **Slices statt Dateien:** `fahrplan -- <datei> <§>`, `plan:next` —
  ROADMAP/STRUKTUR nie am Stück gelesen.
- **Nichts doppelt lesen:** Unteragenten-Bericht ist das Ergebnis.
- **Mechanik nach unten delegieren** (Verschieben/Formatieren/Umbenennen/
  Sweeps auf günstigere Stufe, Skill `auftrag` Klassen-Palette).
- **Lange Tor-Ausgaben in eine Logdatei, Exit-Code lesen** (Orchestrator):
  `npm run <tor> > <scratchpad>/x.log 2>&1; echo $?` ist keine Pipe (der Hook
  lässt es zu) und hält 200+ Zeilen aus dem Kontext — `check:fedlex-versionen`
  druckt 232 Zeilen (Beleg 18.9.2026). Bei Exit ≠ 0 die Logdatei gezielt lesen.
- **Antworten kurz:** kein Nacherzählen von Tool-Ausgaben.
