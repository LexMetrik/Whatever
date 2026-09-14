# retro:17 — ENTWURF vom 2026-09-14 (Vorschlags-Autopilot, Stufe 1)

**Status: ENTWURF. Übernahme nur durch Session-/David-Entscheid.**

Maschinell erzeugt von `.github/workflows/autopilot.yml` (Wochen-Cron) aus
`npm run retro:17`. Der Autopilot merged nichts, ändert `ROADMAP.md` nicht und
vergibt keine `@meta`-Etiketten — er legt nur vor. Wer eine Zeile übernimmt,
vergibt selbst ID und `@meta` und verantwortet sie als eigenen Entscheid.

Diese Datei ist **nicht zum Mergen** gedacht: sie ist die Lesefläche des PR.
Nach dem Abarbeiten wird der PR geschlossen, nicht gelandet.

```
═══════════════════════════════════════════════════════════════════════
retro:17 — ENTWURF eines ROADMAP-Vorschlagsblocks (Stufe 2, QS-SELBSTOPT)
═══════════════════════════════════════════════════════════════════════

Quellen: messwerte/selbstopt-zeitreihe.json (17 Snapshots) · ROADMAP-CHRONIK.md
Letzte Erhebung: 2026-09-04

Dieses Werkzeug SCHLÄGT VOR und entscheidet nichts. Es schreibt keine Datei,
committet nicht und öffnet keinen PR. Wer eine Zeile übernimmt, vergibt selbst
ID und `@meta` (eine erfundene ID kollidiert womöglich mit einer echten und macht check:plan
rot) und verantwortet den Vorschlag als eigenen Entscheid.

10 Vorschlagsblöcke — zum Prüfen, nicht zum Übernehmen:

- [ ] **`gate:check` stabilisieren — häufigstes Rot der Messreihe** *(Anlass: 10 von 61 Läufen rot (16 %); Schwelle 10 % und mindestens 3 rote Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt)* — Erst die Ursachen der roten Läufe auszählen (echter Fund vs. Umgebung vs. Flake), dann entscheiden — ein oft rotes Tor kann das wertvollste sein.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **40 Tore auf Wirksamkeit prüfen — nie rot über die ganze Messreihe** *(Anlass: über 17 Snapshots je 0 rot; Schwelle 30 Läufe. check:artikel-revisionen (69 Läufe; die Chronik nennt check:artikel-revisionen 5×) · check:besetzung (69 Läufe; die Chronik nennt check:besetzung 2×) · check:bezuege (69 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · check:bilder (69 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · check:bs-entscheide (69 Läufe; die Chronik nennt check:bs-entscheide 3×) · check:datenhaltung (69 Läufe; die Chronik nennt check:datenhaltung 16×) · check:design-tokens (69 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · check:dispatch-klausel (69 Läufe; die Chronik nennt check:dispatch-klausel 2×) · check:dossiers (69 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · check:entscheide (69 Läufe; die Chronik nennt check:entscheide 12×) · check:farbwelt (69 Läufe; die Chronik nennt check:farbwelt 1×) · check:golden-normtext (69 Läufe; die Chronik nennt check:golden-normtext 4×) · check:grundart (69 Läufe; die Chronik nennt check:grundart 2×) · check:historie (69 Läufe; die Chronik nennt check:historie 7×) · check:invarianten (69 Läufe; die Chronik nennt check:invarianten 2×) · check:linien-kanon (69 Läufe; die Chronik nennt check:linien-kanon 5×) · check:materialien (69 Läufe; die Chronik nennt check:materialien 15×) · check:normkeys (69 Läufe; die Chronik nennt check:normkeys 2×) · check:normtext (69 Läufe; die Chronik nennt check:normtext 4×) · check:p-klassen (69 Läufe; die Chronik nennt check:p-klassen 3×) · check:paritaet (69 Läufe; die Chronik nennt check:paritaet 13×) · check:pdf (69 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · check:pdf-quellen (69 Läufe; die Chronik nennt check:pdf-quellen 1×) · check:plan (69 Läufe; die Chronik nennt check:plan 17×) · check:revisionen (69 Läufe; die Chronik nennt check:revisionen 11×) · check:seo-index (69 Läufe; die Chronik nennt check:seo-index 3×) · check:smoke (69 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · check:struktur-konsistenz (69 Läufe; die Chronik nennt check:struktur-konsistenz 8×) · check:sweep (69 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · check:tabellen (69 Läufe; die Chronik nennt check:tabellen 4×) · check:tor-paritaet (69 Läufe; die Chronik nennt check:tor-paritaet 5×) · check:ui-normzitate (69 Läufe; die Chronik nennt check:ui-normzitate 1×) · check:verfall (69 Läufe; die Chronik nennt check:verfall 6×) · check:verfall-ui (69 Läufe; die Chronik nennt check:verfall-ui 2×) · check:verklebung (69 Läufe; die Chronik nennt check:verklebung 2×) · check:vollstaendigkeit (69 Läufe; die Chronik nennt check:vollstaendigkeit 1×) · check:zaehler (69 Läufe; die Chronik nennt check:zaehler 2×) · check:zyklen (69 Läufe; die Chronik nennt check:zyklen 1×) · gate:golden:vergleich (79 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt) · gate:tsc -b (79 Läufe; in der Chronik bisher nicht als Bau-Gegenstand belegt))* — PRÜFkandidaten, kein Streich-Auftrag (Chesterton): «nie rot» belegt genauso gut, dass das Tor wirkt — der Fehler wird nicht mehr gebaut, WEIL es da ist. Vor jeder Streichung die Sabotage-Probe: Defekt einpflanzen, prüfen ob es rot wird, byte-gleich zurückbauen. Wird es rot, ist es wirksam und bleibt. Je Tor einzeln entscheiden, nie als Paket.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Fehlerklasse F2g eskalieren — Gegenmittel greift nicht** *(Anlass: datierte Vorfälle 0 → 1 zwischen dem ersten (2026-08-07) und dem letzten Snapshot (2026-09-04); Quelle: Spalte «Was passierte» des Registers im Skill `lehren` — Reparaturdaten zählen dort nicht mit)* — Regel 5 des Skills `lehren`: zweimal trotz Gegenmittel ⇒ Form eskalieren (Prosa → Dispatch → Tor). Keine neue Regel danebenlegen, das bestehende Gegenmittel verschärfen.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Fehlerklasse F2h eskalieren — Gegenmittel greift nicht** *(Anlass: datierte Vorfälle 0 → 1 zwischen dem ersten (2026-08-07) und dem letzten Snapshot (2026-09-04); Quelle: Spalte «Was passierte» des Registers im Skill `lehren` — Reparaturdaten zählen dort nicht mit)* — Regel 5 des Skills `lehren`: zweimal trotz Gegenmittel ⇒ Form eskalieren (Prosa → Dispatch → Tor). Keine neue Regel danebenlegen, das bestehende Gegenmittel verschärfen.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Fehlerklasse F5 eskalieren — Gegenmittel greift nicht** *(Anlass: datierte Vorfälle 0 → 1 zwischen dem ersten (2026-08-07) und dem letzten Snapshot (2026-09-04); Quelle: Spalte «Was passierte» des Registers im Skill `lehren` — Reparaturdaten zählen dort nicht mit)* — Regel 5 des Skills `lehren`: zweimal trotz Gegenmittel ⇒ Form eskalieren (Prosa → Dispatch → Tor). Keine neue Regel danebenlegen, das bestehende Gegenmittel verschärfen.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Fehlerklasse F7 eskalieren — Gegenmittel greift nicht** *(Anlass: datierte Vorfälle 0 → 1 zwischen dem ersten (2026-08-07) und dem letzten Snapshot (2026-09-04); Quelle: Spalte «Was passierte» des Registers im Skill `lehren` — Reparaturdaten zählen dort nicht mit)* — Regel 5 des Skills `lehren`: zweimal trotz Gegenmittel ⇒ Form eskalieren (Prosa → Dispatch → Tor). Keine neue Regel danebenlegen, das bestehende Gegenmittel verschärfen.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Fehlerklasse F8 eskalieren — Gegenmittel greift nicht** *(Anlass: datierte Vorfälle 0 → 1 zwischen dem ersten (2026-08-07) und dem letzten Snapshot (2026-09-04); Quelle: Spalte «Was passierte» des Registers im Skill `lehren` — Reparaturdaten zählen dort nicht mit)* — Regel 5 des Skills `lehren`: zweimal trotz Gegenmittel ⇒ Form eskalieren (Prosa → Dispatch → Tor). Keine neue Regel danebenlegen, das bestehende Gegenmittel verschärfen.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Fehlerklasse F9 eskalieren — Gegenmittel greift nicht** *(Anlass: datierte Vorfälle 0 → 2 zwischen dem ersten (2026-08-07) und dem letzten Snapshot (2026-09-04); Quelle: Spalte «Was passierte» des Registers im Skill `lehren` — Reparaturdaten zählen dort nicht mit)* — Regel 5 des Skills `lehren`: zweimal trotz Gegenmittel ⇒ Form eskalieren (Prosa → Dispatch → Tor). Keine neue Regel danebenlegen, das bestehende Gegenmittel verschärfen.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Ticketzahl auf 3–5 anheben (Phase 4)** *(Anlass: Landungsquote (gemerged ÷ (gemerged + geschlossen), Proben ausgeschlossen) 83 % über n=6 PRs · Median-Dauer 30 min; 1 Probe(n) mit Label `probe` ausgeschlossen; Entwurf-Antworten in dieser Messung nicht unterschieden (Schema < 5); Schwellen 83 %, ≤ 45 min und n ≥ 6 (Fahrplan §3 «Skalierung Jules»))* — geschlossen ≠ Nacharbeit; handgeführte Nacharbeits-Quote steht in Fahrplan §5 — erst diese Spalte gegenlesen, dann seriell auf 3–5 Tickets pro Session anheben (Stückzahl entsperrt 4.9.2026, Messung bleibt Pflicht).
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

- [ ] **Lehre verankern: Tor-Regel oder Vorlagen-Zeile je abgelehntem Jules-PR** *(Anlass: neu geschlossene(r) Jules-PR(s): #662 (Quelle: Jules-Messung, letzte 7 Tage; bereits in früheren Snapshots genannte Nummern lösen nicht erneut aus))* — Formregel Skill `lehren`, Ergänzung Fremdagenten: die Ablehnung noch in DERSELBEN Session als Tor-Regel (Fremd-PR-Tor/Erstfilter) oder Vorlagen-Zeile verankern — nie nur als Kommentar.
  <!-- ENTWURF retro:17 — Übernahme nur durch Session-/David-Entscheid -->

Gesetzte Schwellen (keine Messwerte): Rot-Häufung ab 10 % und 3 roten Läufen · «nie rot» ab 30 Läufen und 5 Snapshots · CI-Failure ab 20 % · CI-Rerun ab 15 %.
```
