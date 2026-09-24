<!-- @posten
dach: QS-DOKU-DIAET
titel: STRUKTUR-Session-Karte streichen
anlass: Entscheid David 20.9.2026 («mach alle 4 wie empfohlen», Punkt 2) — nie umgesetzt
wartet-auf: david
-->

**Entscheid (Notiz `.claude/notizen/2026-09-20-roadmap-deckel-landestrecke.md` Z. 53,
wörtlich «mach alle 4 wie empfohlen»):** STRUKTUR-Session-Karte streichen — Begründung
war die Messung «kein Werkzeug liest den Karten-INHALT» (`struktur-aktuell.py` misst nur
den Git-Abstand, `struktur-rotieren.py` nur Grösse/Alter, ~1500 geänderte Zeilen in
14 Tagen reine Ablage). Ersatz ist der PR-Body.

**Verifiziert 21.9.2026 — Stand ist gemischt, die Notiz ist hier teilweise überholt (§2b,
nicht nachgeführt, nur ergänzt):**
- `bauschritt` **Station E** trägt die Pflicht bereits NICHT mehr — sie steht unter
  „Gestrichene Pflichten" als „Karten-ZEILE / Session-Karte in STRUKTUR.md (20.9.2026)"
  (`.claude/skills/bauschritt/SKILL.md` Z. 158–162). Dieser Teil ist erledigt.
- `auftrag` Ziff. 4 Punkt 6 und `landung` „Nachkontrolle" Punkt 7 zeigen HEUTE auf andere
  Themen (Fremdagenten-Messwerte bzw. `npm run projektionen`) — dort ist inzwischen kein
  Session-Karten-Bezug mehr zu streichen; die Notiz-Referenz war entweder schon vor dem
  20.9. ungenau oder die Nummerierung hat sich seither verschoben.
- **Noch offen:** `STRUKTUR.md` selbst trägt weiterhin den vollen Abschnitt „Pflegeregel
  Session-Karten" (Z. 27–33) plus den `<!-- KARTEN -->`-Inhalt (aktuell ~130 Zeilen
  Session-Karten-Prosa, Z. 35 ff.) — STRUKTUR.md ist für diese Session TABU, nicht
  angefasst.
- Zwei Hooks lesen/erzeugen den Karten-Mechanismus mechanisch und werden mit dem Streichen
  gegenstandslos: `.claude/hooks/struktur-aktuell.py` (meldet fehlende Karten anhand des
  Git-Abstands zu `STRUKTUR.md`, Zeilen 78–86 der Meldungstext) und
  `.claude/hooks/struktur-rotieren.py` (rotiert Karten byte-genau ins Archiv,
  `KARTEN_ANKER`-Logik ab Z. 75). Session-Edits an `.claude/hooks/**` sind TABU — der
  Klassifizierer blockt sie; darum **Hook-Diff für David vorbereiten**, nicht selbst
  anwenden (gleiches Muster wie im offenen Posten
  `plan/posten/2026-09-20-hook-prosa-nennt-retro-17-das-abgebaut-wird.md`, dort für die
  retro:17-Prosa — beide Diffs liessen sich in derselben David-Runde vorlegen).
- Weitere Fundstellen, ungeprüft, beim Bau mitzunehmen: `scripts/dispatch-agents.ts`,
  `scripts/plan/bildMethode.ts`, `.claude/agents/lex-synthese.md`,
  `src/tests/plan-bild-lage.test.ts`, `fahrplaene/FAHRPLAN-ARCHIV-RESTPUNKTE.md`,
  `fahrplaene/FAHRPLAN-DESIGN-IDENTITAET.md`, `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`
  (alle per `grep -rli 'session-karte' --include=*.md --include=*.py --include=*.ts .`
  gefunden, 21.9.2026 — Treffer in `archiv/**` bewusst ausgeklammert, dort bleibt der
  Wortlaut historisch stehen).

**Nächster Schritt:** STRUKTUR.md-Abschnitt + `<!-- KARTEN -->`-Inhalt streichen (Karten
selbst sind bereits vollständig im Archiv nachvollziehbar, `archiv/STRUKTUR-SESSIONKARTEN.md`
+ `archiv/struktur-sessionkarten/*.md` — kein Datenverlust), die beiden Hooks als
Diff für David vorbereiten, übrige Fundstellen einzeln prüfen.

Umgehängt 24.9.2026 von `QS-EFFIZIENZ` nach `QS-DOKU-DIAET` (M-16: Doku-/Chronik-Thema; Bauplan-Konsolidierung, QS-DOKU-DIAET).

**Ergänzung 25.9.2026 (Bauplan-Inventar M-25; Herz-und-Nieren-Prüfung HN-13) — wartet auf David:** Der Rückbau liegt als fertiger Patch vor: `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/patches/m25-session-karten-rueckbau.patch` (vorbereitet 25.9.2026 auf docs/qs-doku-diaet @ aa38550d4, Anleitung im Patch-Kopf). Hook-Edits blockt der Klassifizierer, darum Handgriff David. Wirkung ≈ −15…18 KB Steuerfläche. Vor dem Anwenden `git apply --check`. HN-13 will im selben Handgriff den doppelten Flächen-Deckel `FLAECHEN_BUDGET` (`.claude/hooks/struktur-rotieren.py` ~69–76) streichen, weil `check:steuerflaeche` dieselbe Sorge trägt; diese Streichung ist noch NICHT im Patch. HN-00-Verdikt 25.9.2026 zu PS-07: BESTÄTIGT, kein datierter Vorfall, den nur dieser Deckel verhindert. ABER (Zusatzbefund HN-00): `FLAECHEN_BUDGET` ist heute das einzige LOKALE Flächen-Signal — `.claude/settings.json` ruft `struktur-rotieren.py --hook` als SessionStart-Hook, `waechter_meldungen()` wertet den Deckel aus —, während `check:steuerflaeche` nur im CI-Job «Tore» läuft (weder in `scripts/gate.sh` noch in den Hooks). Der M-25-Patch entfernt den SessionStart-Hook ganz; beim Anwenden darum `npm run check:steuerflaeche` in `scripts/gate.sh` verdrahten, sonst entsteht ein Feedback-Loch zwischen Session- und CI-Zeit. Folgestellen ausserhalb des Patches nennt der Patch-Kopf.
