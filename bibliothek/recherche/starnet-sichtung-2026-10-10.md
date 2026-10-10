# StarNet-Sichtung 10.10.2026 — was LexMetrik von StarNet und verwandten Projekten lernen kann

**Erstellt:** 10.10.2026 — Auftrag David 10.10.2026 (Chat): «was kann LexMetrik von StarNet und verwandten Projekten lernen». Nur Empfehlung, nichts gebaut; die Auswahl hat David am selben Tag getroffen (§4).
**Status:** ERSTRECHERCHE, einfach belegt (Haiku-Vergleich, Sonnet-Bestandsaufnahme und -StarNet-Sichtung, Opus-Bewertung mit Stichproben). Keine fachliche Abnahme; diese Datei ändert weder Code noch Roadmap.

**Methode:** `gh api` read-only, nichts geklont, nichts ausgeführt. Dazu Davids eigener Praxistest mit StarNet v0.13.2 am 10.10.2026 (Beobachtungen in §3, nur im Chat berichtet, nicht archiviert). Keine Prompt-Injection in den gelesenen Repos gefunden (Sonnet-Berichte; Datei-Inhalte wurden als Daten behandelt, §14.7).

**Quellen (Abruf 10.10.2026):**
- StarNet: <https://github.com/androoAGI/starnet> (Andrew Sims; 12'916 Commits; `.claude/` im Repo nicht öffentlich; `docs/` rund 190 Dateien, darunter `MISTAKES.md`)
- pixel-agents: <https://github.com/pixel-agents-hq/pixel-agents>
- agent-office: <https://github.com/AgentSystemLabs/agent-office>

**§11-Pflichtfelder:**
- **Quelle mit Stand:** oben, Abruf 10.10.2026 (Fundstellen = Datei:Zeile im Stand dieses Tages).
- **Regel/Befund:** §1–§5.
- **Geltung/Ausnahmen:** Ideen für den Claude-Code-Arbeitsprozess und die Steuer-Doku, nicht für Rechtslogik oder Produkt (§2 Determinismus bleibt unberührt).
- **Pflegebedarf:** keiner, einmalige Sichtung. StarNet ändert sich täglich, die Fundstellen-Zeilen veralten.
- **Abnahme-Status:** Empfehlung; Auswahl von David am 10.10.2026 freigegeben (§4).

**Lizenz:** Code MIT; Name, Logo, Artwork und Sprites sind nicht lizenziert (StarNet `TERMS.md` §7, Z. 87–91). Übernommen werden nur Ideen, kein Code. Fork verworfen: Pflegelast, anderer Zweck, Vertraulichkeit.

---

## §1 Mechanismen von StarNet gegen den LexMetrik-Bestand

Fundstelle = Datei im StarNet-Repo (Z. wo angegeben). Bestand und Entscheid: Bestandsaufnahme (Sonnet) und Bewertung (Opus, mit eigenen Stichproben) vom 10.10.2026.

| Mechanismus (StarNet) | Fundstelle | LexMetrik-Bestand | Entscheid |
|---|---|---|---|
| Consent-Broker: Leiter HARDLINE → Bypass → Einzel-Grant → Exec-Lockout → Cache → Resolve; autonom + Mutation ⇒ Ablehnung; Danger-Key nach Gefahrenklasse; nie Dauer-Grant | `permissions.js` Z. 15–29, 183–226 | teilweise (allow-Liste + `tor-`/`deploy-`/`dispatch-schutz.py`) | nicht (kein Vorfall, Aufwand L) |
| Grants unbeaufsichtigter Läufe nur aus persistiertem Job-Eintrag, nie aus Modell-Output | — | teilweise | nicht bauen; nur Argument zur ruhenden Frage «Auto-Merge beim Fedlex-Abgleich» (ROADMAP Zurückgestellt) |
| Untrusted-Fence + Taint-Regel: nach Fremdinhalt im Kontext entzieht der Host Shell, Web mit Zugang, Connector-Write (Lücke: `cat` umgeht) | `fence.js`, `taint.js` | teilweise (pauschal §14.7, Dispatch-§0; 1× Injection abgefangen, Skill `lehren` F4) | nicht (in Claude Code ohne grossen Hook-Bau nicht abbildbar) |
| Lauf-Protokoll `runs.jsonl` mit `reason`-Enum (done, max_iters, budget, cancelled, error, empty, refusal, clarifying, interrupted); unbekannt wird auf `done` geklemmt | `runstore.js` | teilweise (Nachlass-Hook `abschluss-wache.py`); die Klemmung ist Gegenbeispiel (§5) | nicht |
| Run-Journal hash-verkettet; `interrupted` ⇒ `spendUnknown` statt 0; Idempotenz-Ledger sha256(scope+tool+args) | — | teilweise (WIP-Commits, Notizen-Datei, Nachlass-Hook) | nicht |
| Task Briefs: Host validiert, 2–3 Optionen, `recommended` genau eine, höchstens 2 Fragen (Anlass: Substring-Vorfall «do not publish» → «publish») | `taskbrief-policy.js` | vorhanden für den Chat (globale CLAUDE.md, Kommunikation Ziff. 2: Optionen + Empfehlung); Format Agent → Orchestrator fehlt | nicht |
| Gedächtnis-Kandidaten Keep/Edit/Discard, declined-Liste, nur der Host setzt `confirmed` | `reflect.js` | teilweise (Provenienz: Wortlaut-Pflicht, `abgeleitet_von_ki`/`bestaetigt`; kein Keep/Edit/Discard) | nicht |
| Skill-Authoring: erst list, patchen statt duplizieren, «Never save a procedure you have not seen work», agent-Skills nach 90 Tagen archiviert, Guard mit Digest-Freigabe | — | teilweise (Selbstanlage bewusst nicht) | nicht |
| `qa:ready`: offene P0/P1 = 0, frisch, an Kandidaten-Baum gebunden, «No-fake-green» (fehlendes Artefakt ⇒ NOT READY) | `ready.mjs` | vorhanden (SHA-gebundene Gates/Verdikt) | nicht |
| Claims-Ledger: jede öffentliche Aussage mit Locator + Verdikt, Dateien per sha256 gesperrt | `claims.json` | teilweise (Zahlen generiert + `check:zaehler`, Status-Modell §8; Prosa ungeprüft) | umsetzen nur als Textpflege (§4 Punkt 1), kein Ledger mit Hash (neue Zustandsdatei = Drift-Quelle) |
| Autonomie-Ledger + «While you were away»-Bericht (nur echte Datenzeilen, nichts ⇒ kein Bericht) | — | teilweise (Nachlass-Hook; keine Live-Übersicht/Notification-Hook) | nicht (kein Vorfall) |
| Consent-Wait: Auto-Deny nach Timeout; Loop-Breaker (Erkennung, keine Quote) | — | fehlt | nicht (kein Vorfall) |
| Budget pro Lauf/Agent/Tag (25 $), Abbruch `reason=budget` | — | teilweise (`verbrauch-summe.py` nur Anhang, nicht verdrahtet; OTEL-Export ohne Auswertung) | später: Budget erst messen; vorher Rückbau (§4 Punkt 3) |
| Scheduler-Audit: at-least-once offen | — | fehlt | nicht (kein Vorfall) |

---

## §2 Vergleichsprojekte

**pixel-agents** (MIT, 9'620 Sterne, 18 Mitwirkende). Beobachtet Claude-Code-Sitzungen über Hooks (PermissionRequest, Notification, Stop) und das Transkript-JSONL; zeigt «Freigabe nötig» und Kontext an. **Warnungen:** installiert seine Hooks in `~/.claude/settings.json` (fremder Eingriff in die globale Konfiguration); Token in der URL (Sicherheitsmuster nicht übernehmen). Nutzen für uns: nur die Idee einer Live-Übersicht (Bestand Pos. 14), kein Einsatz.

**agent-office** (MIT, zwei Wochen alt). Kosten aus Transkripten, Budget-Pause. **Warnungen:** Versionswiderspruch (Release v0.1.211 gegen `package.json` 0.1.0); sehr jung, kein Reifenachweis. Nutzen: Idee «Kosten aus Transkripten statt aus Telemetrie» — relevant erst, wenn wir Verbrauch wirklich messen wollen.

Beide: nur Ideen, kein Code; keine Injection gefunden.

---

## §3 Beobachtete Schwächen im Praxistest (Davids Test, StarNet v0.13.2, 10.10.2026) als Lehren

Die Beobachtungen stammen aus Davids Chat-Bericht; die Session-Notizen halten sie nicht im Detail fest. Die Spalte «bei LexMetrik abgedeckt durch» gibt nur wieder, was die Notizen belegen; fehlende Zuordnung ist als solche genannt.

| Beobachtung | Lehre | Bei LexMetrik abgedeckt durch |
|---|---|---|
| Hoher Tokenverbrauch | Verbrauch sichtbar machen, bevor man begrenzt | teilweise: `verbrauch-summe.py` (nur Anhang, nicht verdrahtet), OTEL-Export ohne Auswertung → Rückbau statt Ausbau (§4 Punkt 3) |
| Abbruch beim Neustart | Lauf muss einen Neustart überleben | vorhanden: Neustart-Robustheit (Bestand Pos. 13) |
| Provenienz «Halte es kurz» (eigene Weisung als Nutzerwunsch dargestellt) | Herkunft jeder Weisung kennzeichnen | Gedächtnis-Provenienz `abgeleitet_von_ki`/`bestaetigt` (Pos. 5); §14.7 für Tool-Rückgaben |
| Inhaltsdrift «Im Sommer» (beim Verdichten/Lektorat geändert) | Verdichtung darf Zahl, Datum, Verneinung nie ändern | fehlt (Lektorat-Inhaltsinvarianz, Pos. 11) → Entscheid 2 (§4) |
| Eigenmächtige Ausführung | Freigabe pro Handlung | teilweise: allow-Liste + Hooks; read-only für Recherche/Prüfung nur Prosa (Bash in `tools`) — technisch erzwingen: nicht, Prüfer braucht Bash (z. B. `check:fedlex-versionen`) |
| Tippfehler «Stargate» (statt StarNet) als Programm missverstanden | Unklares nicht ausdeuten, sondern offenlegen/zurückgeben | vorhanden: CLAUDE.md §7 «abweichend umsetzen und die Abweichung offenlegen», `lex-mechanisch` «zurückgeben, nicht raten» |

---

## §4 Entscheid David 10.10.2026

Wortlaut der Auswahl: alle drei empfohlenen Punkte, «In Bestehendes» (keine neue Roadmap-Zeile; EINGANG war mit 30 Zeilen voll, eine neue Zeile hätte «E3·W 8.10. Werkzeug-Defekte» verdrängt). Alle drei Aufwand S.

1. **Datenschutz-Seite §2 nennt den Suchdienst.** `src/pages/Datenschutz.tsx` §2 erwähnt nicht, dass Suchbegriffe an `/api/suche` gehen (heute kantonal, nach A1(a) alle). Teil von JETZT 2 A1-FUNDAMENT. Die Abdeckung-Seite (`src/pages/Abdeckung.tsx` Z. 66–67, «Index Bund-only») zieht PR #1352 schon nach.
2. **Faktenschutz bei Verdichtung/Lektorat** (Zahl, Datum, Verneinung nie ändern) als Erweiterung von dispatch-template §0 Ziff. 2b. Anlass: Vorfall #1310, «371 falsche Selbstlinks». Ort: Merkzettel `plan/posten/2026-10-08-werkzeug-defekte-eingang.md`.
3. **Rückbau der OTEL-Kette** (§17 Gegengewicht): `.claude/settings.json` env `OTEL_METRICS_EXPORTER` (prometheus, seit 7.8.2026 ohne Sammler) und `CLAUDE_CODE_ENABLE_TELEMETRY`; `token_ablesen` in `abschluss-wache.py` (Spool rund 140 Zeilen, ohne Leser); toter Verweis auf das gelöschte `selbstopt:erheben` im Kommentar Z. 126. Ort: derselbe Merkzettel. Hook-Diff geht an David.

Rest der Vorschläge: nicht umsetzen bzw. später (Budget erst messen).

---

## §5 Gegenbeispiel-Lehre

StarNet klemmt einen unbekannten Abbruchgrund auf `done` (`runstore.js`, `reason`-Enum). Das widerspricht dem eigenen Wahrheitsgebot: ein unbekannter Zustand wird als Erfolg ausgewiesen. Die eigene `MISTAKES.md` führt dieselbe Fehlerklasse als «Fake done» und «Plan docs lie». Für LexMetrik gilt das spiegelbildlich: ein unbekannter Zustand bleibt unbekannt (fail-closed, CLAUDE.md §8 und §14.7: Erfolgsbericht ohne prüfbares Artefakt gilt als nicht erfolgt).
