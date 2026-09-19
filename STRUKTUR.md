# LexMetrik — Struktur & aktueller Stand

**Verbindliche Grundprinzipien: `CLAUDE.md`** (§1 Logik vor allem; §6
Refactoring-Protokoll) — dieses Dokument hier beschreibt den Zustand.

**Dokument-Ordnung im Root (Aufräumung 10.6.2026, Auftrag David):** Im Root
liegen nur AKTIVE Steuerungsdokumente — CLAUDE/README/STRUKTUR/ROADMAP,
Projekt- und Strategie-Papiere (PROJEKTBESCHRIEB, STRATEGIE-PLATTFORM,
WACHSTUM-REGLEMENT, BETRIEB, KATALOG-ROADMAP). Die AG-Bausteinliste ist seit
dem 14.8.2026 (Entscheid David) **kein Bestand mehr**, sondern ein Erzeugnis:
`npm run abnahme:ag` schreibt sie bei Bedarf in <1 s ins Root, gitignoriert. Die
laufenden Fahrpläne liegen seit AP-8 der QS-TOK-Aufräumwelle (31.7.2026) NICHT
mehr im Root, sondern in **`fahrplaene/`** (Stand 3.8.2026: 27 Dateien —
NOTEBOOKLM-EINSATZ und OPENCASELAW-QUELLEN sind mit der Aufräumung 3.8.2026 nach
`archiv/` gewandert; Dateinamen unverändert, geführt über `ROADMAP.md` /
`npm run plan:next`; das Link-Tor `check:plan` scannt genau diesen Ordner). Aus der früheren Aufzählung
ist nur noch VORLAGEN-AUSBAU aktiv; GRUNDLAGEN, GMBH-GRUENDUNG, BGER-RECHTSWEG,
VERTRAGS-VARIANTEN und FUNDAMENT-UMBAU sind mit der Archiv-Welle 31.7.2026
nach `archiv/` gewandert, AG-GRUENDUNG schon am 7.6.2026. Abgeschlossene
Fahrpläne (DESIGN, RECHNER-DESIGN, VEREINHEITLICHUNG, TOKEN-DISZIPLIN — ins
Archiv 13.6.2026; die 11 verwaisten Fahrpläne der QS-TOK-Aufräumwelle —
31.7.2026) und historische Dokumente liegen in
**`archiv/`** (Index: `archiv/README.md`; Dateinamen unverändert, damit
Verweise in Code-Kommentaren per grep auffindbar bleiben). Wissens-Quellen
(PDF/DOCX, gitignored) in `bibliothek/quellen/` (`SICHTUNG.md`).

**Pflegeregel Session-Karten (Token-Disziplin 11.6.2026; mechanisiert 10.7.2026,
QS-TOK/T1):** Dieses Dokument ist Nachschlagewerk, keine Pflichtlektüre (T19;
die frühere Kopfzeile «wird in jeder Session gelesen» war seit der Entkopplung
falsch — korrigiert 30.8.2026). Karten abgeschlossener Sessions (älter als
~2 Arbeitstage) wandern BYTE-GENAU nach `archiv/STRUKTUR-SESSIONKARTEN.md`
(neue Blöcke oben anhängen); hier bleibt der Verweis-Abschnitt. Neue Karten
werden direkt unter dem KARTEN-Anker eingefügt (jüngste zuoberst).

<!-- KARTEN -->
## Session 19.9.2026 (3) — `QS-MONITOR-ROT`: rectifies-Tor Runde 2 + wartende Automatik-PRs (4 PRs gelandet, 1 offen, Risikopfad)

- Schritt `QS-MONITOR-ROT` (`feld: korpus`), zurück auf `status: ready` (Unterpunkte offen). **Gelandet:** #913 `135ec0cba` (BS-Monatslauf, Identitätsbeleg data.bs.ch) · #925 `95cb5a712` (Merge-Schutz liest Verdikt aus dem Queue-Squash — Wurzel: GitHub bricht den PR-Body bei 72 Zeichen um und hängt den Co-author-Absatz an; erster Risikopfad-PR in der Queue, #921, war daran gescheitert, Lauf 35449385978; Echt-Beleg grün: `merge_group` 35455945280) · #921 `2db154675` (Curia-/Materialien-Teilkaskade, BS-Sortier-Wächter) · #926 `c9e2e32cb` (rectifies-Tor Runde 2).
- **Offen:** #909 (Nach-Verdikt «bestanden» 19.9.2026, noch nicht eingereiht) · #934 Entwurf (Curia-Monatslauf, wartet auf Gegenprüfung, Ablauf 1.10.2026).
- Prozess: Bau Sonnet, Gegenprüfung Opus, je frischer Kontext; 7 Prüfrunden, davon 5 mit Auflagen.
- **Offene Enden:** `AUTOMERGE_TOKEN` nach dem Org-Umzug ohne Zugriff (wartet auf David) → Automatik-PRs entstehen nicht, Nachweis «Curia-Job grün» steht deshalb aus · Pflegetermin 1.10.2026 (14 «Künftige Fassung»-Einträge) unberührt offen · Punkt 5 des Auftrags (Pin-Marker-Wurzel `cache-pin-befund.ts`) NICHT gebaut. Fachliche Abnahme David offen (kein `verified`).

## Session 19.9.2026 (2) — `W2·5m-LESER-V3`: Gliederung — Art. 26 SVG unsichtbar, unterste Ebene klappte nicht auf (2 PRs, davon 1 Risikopfad)
- Befund David 19.9.2026 («svg art. 26 nicht ersichtlich … unterste ebene klappt oft nicht auf», Nachtrag «auch das aufklappen soll optimiert werden»). Gemessen statt geraten (echte Leser-Kette, 231 Bundeserlasse): Daten korrekt, Fehler in der Anzeige — eigener Offen-Schlüssel der Artikel-Ebene (`art@`) lief mit dem Zeilenzustand auseinander (4'586 «offen, aber leer»-Zeilen nach Mitlaufen/Sprung), Artikel direkt unter gemischten Knoten ausgefiltert.
- #924 (Anzeige, kein Risikopfad): «offen» aus dem Sichtbaren (`zeilenAnsicht`), alle Öffner/Schliesser über `klappKarte.ts`, ein Klick öffnet ganz, Marke nach Sprung auf dem Artikel; Wächter `gliederung-sichtbarkeit` + `gliederung-zustandsfolgen` (je rot gezeigt). Zwei Code-Zweitblicke (Sonnet): 1. fand Tieflink→Auto-Zu→Mitlaufen-Leck → Nachzug; 2. ok, Tradeoff offengelegt (direkte Artikel gemischter Knoten beim Mitlaufen, max. 26 Zeilen AHVV; a33-CLS grün). Browser-Probe lokal (SVG, OR).
- #923 (Risikopfad, Extraktor): SVG-Randtitel-Container `tit_3/lvl_u1` vererbte «Grundregel» an Art. 27–57b; Fix generisch in `struktur-extrahiere.ts`, nur `SVG.json` geändert. Gegenprüfung bestanden (Sonnet, `8c713fca4`). Im Queue-Lauf von `check:merge-schutz` abgewiesen (Verdikt-Trailer im Queue-Squash nicht gelesen — Wurzel-Fix #925, fremde Session); danach neu eingereiht.
- Lehre verankert: `.claude/rules/webseiten-pruefung.md` «Drittens — Zustand ist eine Folge». Nebenfunde als Checklisten-Zeilen unter W2·5m-LESER-V3 (8 Artikel ohne eigene Zeile, Extraktor HTML statt XML-`role=marginal`, CLS-Flake `leser-funktionszeile-zaehler`).

## Session 19.9.2026 — `QS-ORG-UMZUG`: Merge-Queue steht, BEHIND-Mechanik zurückgebaut (PR #927, kein Risikopfad)

- **Entscheid David 19.9.2026** (wörtlich): «ja mach so, alles durch die warteschlange» — kein Admin-Bypass, Doku-PR statt Sammel-Push, Plan-Status fährt im PR mit, STRUKTUR-Rotation nicht mehr am SessionStart (`LEXMETRIK_NO_ROTATE=1`, `1ef2797f4`), sondern im Doku-PR.
- **Belegt:** Repo seit 19.9.2026 `LexMetrik/Whatever` (Organisation, Free, public); Merge-Queue-Ruleset 23699779 (SQUASH, ALLGREEN, max 3, Timeout 60 min, keine Bypass-Akteure), `strict` AUS. Erster Durchlauf: #922 (`06489b10c`) + #917 (`9b125ce8e`) gemeinsam gelandet 15:05:00Z; `merge_group`-Lauf 35449369984 alle vier Required grün (inkl. Perf-Budget), Push-Lauf 35450690297 Deploy grün, live `lexmetrik-build=9b125ce8`.
- **Gebaut (Doku-PR-Zweig `feat/qs-org-umzug`):** Rückbau BEHIND-Nachzug in `waechter.yml` (`5b5650304`) · `landung-kette.sh` auf Queue-Poll (`97641800d`, gegen eine echte Queue UNGETESTET) · Dependabot-Kommentare (`89ff86e93`/`1a1e52d4f`) · `ci.yml`: `merge_group` klassiert den Diff je Queue-Eintrag (`1afe8c1a9`) und die Push-Diät belegt am gepushten SHA statt am PR-Kopf (`6d8c99893`) — **Gegenprüfung Opus lief bei Redaktion dieser Karte noch, also gebaut, nicht abgenommen** · `BETRIEB.md`/`PROJEKTBESCHRIEB.md` Repo-Pfad (`aed15a7b8`) · Skills `landung`/`bauschritt`/`auftrag` auf Queue-Betrieb (`359536575`/`f91e1fc3b`/`82c6fc5c0`).
- **Geprüft:** `ci.yml`-Umbau (`1afe8c1a9`, `6d8c99893`) Opus-Gegenprüfung «BESTANDEN MIT AUFLAGEN» — Auflagen 1–3 erfüllt (`16ff18090` `previous_filename`, `3250196c4` Kommentare, `a80a6a3bd` Verhaltens-Parität Bash↔TS mit drei Rot-Proben), Auflage 4 = Beobachtung erster Doku-Eintrag. Fable-Bug-Check `landung-kette.sh`: zwei MAJOR + sechs kleinere, behoben in `377ea3c11` (Simulation a–g, Rot-Beweis gegen die alte Schleife). Zweite Falle: `gh pr merge --squash` auf nicht-grünem PR schärft STILL Auto-Merge (Skill `landung`, Merge-Queue-Kopf).
- **Werkzeug-Falle (§17, gemessen):** die Squash-Nachricht der Queue = PR-Titel (#N) + PR-Body, aber **bei 72 Zeichen umbrochen** und mit `---------` + `Co-authored-by` als letztem Absatz ⇒ `%(trailers)` am Squash liest nur `Co-authored-by`. Wer Trailer am gelandeten Commit auswertet (`plan-buchung.yml`, Merge-Schutz), verliert sie — der Fix für den Merge-Schutz ist Posten der Parallel-Session QS-MONITOR-ROT (`fix/qs-monitor-rot-merge-schutz-queue`, Beleg `merge_group`-Lauf 35449385978, #921).
- **Offene Enden in die ROADMAP gebucht** (`QS-CI-MINUTEN`: Plan-Buchung messen/zurückbauen, erster Doku-Eintrag in der Queue, `landung-kette.sh` real fahren, `diff-klassieren.ts`-Kommentar · `QS-BASIS`: Zugangsschlüssel am Lauf 21.9., **wartet auf David** beim Hook-Diff `LEXMETRIK_MAIN_PUSH=1`, Notizen-Datei aus dem Worktree, `README.md`-Fossil, Vercel Deployment Storage, fehlendes `shellcheck`). UNGEMESSEN bleibt, ob das Ruleset Direkt-Pushes auf `main` (auch den von `plan-buchung.yml`) serverseitig ablehnt.
- `QS-ORG-UMZUG` auf `done`, Blocker `david-entscheid-org-umzug` entfallen; Wortlaut samt Merge-Queue-Herleitung aus `QS-CI-MINUTEN`: ROADMAP-CHRONIK.md, Umschichtung 19.9.2026.

## Session 18.9.2026 (3) — `W2·5m-LESER-V3`: Standort-Marke lief beim Lesen nie mit — verhungerte Entprellung (2 PRs, kein Risikopfad)

- Orchestrator Opus 5; Bau `lex-bau` auf Opus, Gegenprüfung `lex-pruefung` auf Sonnet (Prüfer ≠ Bau-Modell), Ist-Inventar `lex-recherche` auf Sonnet. **Gelandet:** #914 Fix + Wächter (`606b19066`, Deploy-Job success, Perf-Budget success) · #916 Wächter auf Synchronität geschärft.
- **Der Defekt.** Marke und Baum-Akkordeon lagen in **einem** 200-ms-Trailing-Timer, den JEDER Artikelwechsel neu ansetzt; beim Lesen kommen die Artikelgrenzen alle ~70 ms ⇒ der Timer verhungerte, `setAktivIds` lief **nie** (gemessen: 27 Artikelwechsel → 27 Neuansetzungen, `anwenden` lief 1×, am Schluss). Fix = ein aus dem entprellten Closure herausgezogenes Statement (`inhalt-hooks.tsx`); Akkordeon + Ruhe-Tor unverändert. Live nachgemessen (headless, `visibilityState=visible`): erste Marke **52 ms**, 0/63 Proben ohne Marke, 11 distinkte Standorte — vorher über dieselbe Strecke keine einzige.
- **Warum es niemand merkte — und die Lehre (§17, verankert `.claude/rules/webseiten-pruefung.md`).** (a) `document.visibilityState` ist im Browser-Pane des Desktop-Clients **dauerhaft `hidden`** ⇒ keine rAF-Callbacks ⇒ jedes rAF-gebundene Verhalten misst sich dort als kaputt; drei von vier meiner daraus abgeleiteten Ursachen-Verdachte waren falsch. Solche Messungen gehören headless zu Playwright, mit Beleg `visible`. (b) **Stop-and-go ist kein Lesen:** `leser-gliederung-a33` (F1 «Highlight folgt») wartet nach jedem 120-px-Schritt 260 ms und liess damit genau den Timer feuern, der beim echten Lesen verhungert — das Tor mass seine eigene Messpause.
- **Zwei Orchestrator-Befunde widerlegt (§7, beide vom Bau-Agenten).** «Dev läuft, Prod nicht» trägt nicht — der Defekt ist überall, er zeigt sich nur, wenn der Leser *nicht* anhält. Und der «fehlende» 3-px-Standort-Strich liegt seit #894 an (Geschwister-`<span>`, **8,26:1 hell / 10,62:1 dunkel**); meine Messung las das `<a>`. ROADMAP-Zeile «Standort-Fläche `brass-100` — Token-Entscheid» darum **geschlossen statt bebaut** (§17 Gegengewicht).
- **#916 — der Wächter, der seinen eigenen Rückfall fangen muss.** Die Gegenprüfung konstruierte die Umgehung: eine 120-ms-Trailing-Entprellung bestand alle drei ms-Proben. Blosses Senken der Schranke war nicht der Weg (2-vCPU-Runner, reflow-schwerste Seite ⇒ Lücke gegen Flakiness getauscht). Neue Probe misst **Rückstand in Gliederungs-Einträgen statt Millisekunden**, SOLL unabhängig aus `a[href^="#art-"]` + DOM-Artikelfolge (nicht aus der bewachten Marke), Schranken auf Anteilen (≥ 90 % treu, ≤ 5 % mit ≥ 2 Einträgen Rückstand), Selbstschutz `visibilityState` + `distinktSoll ≥ 5`. Rot gegen Original-Defekt (**0/40**) und gegen den Halb-Fix (**9/40**, `--workers=1` = CI-Bedingung), 3× grün, gedrosselt 6×/10× grün. Schranken bewusst NICHT aufs gemessene Maximum gesetzt — der Ist-Stand berührt es unter Drossel.
- **Nebenfunde gebucht** (ROADMAP unter W2·5m): Bezugslinien-Orakel jetzt in zwei Specs (§5, eigener Schritt) · Empfindlichkeitsgrenze der Sonde (60-ms-Entprellung = 86 % treu, die 90 % nie blind hochschieben) · Akkordeon klappt nur bei Scroll-Ruhe tiefer auf · F1 auf pausenlose Strecke heben · `w224-d35-f2-kopf:96` Last-Flake (Indiz, kein Beweis: lokal 10 vCPU gegen CI 2). Unter `QS-CI-MINUTEN`: datierter **Merge-Queue-Beleg** — #914 war mit allen Toren grün, verlor aber das `BEHIND`-Rennen gegen die Parallel-Session und kostete einen vollen zweiten CI-Zyklus (Präzedenz #892, fünf Läufe); **wartet auf David** (Repo-Einstellung).
- **Parallel-Session:** deren #912 (Re-Pin `uno_antifolter`) machte `check:p-klassen`/`check:vollstaendigkeit` auf JEDEM lokalen Checkout rot — mit Nullprobe gegen blankes `origin/main` als fremd belegt, gemeldet, dort geheilt und als Wurzel-Fix gebucht. Kein Eingriff ins fremde Feld `korpus`.

## Session 18.9.2026 (2) — `QS-MONITOR-ROT`: sechs Daten-Befunde des Normen-Monitors behoben, Fedlex-Frische an der Wurzel (6 PRs, Risikopfad)

- Orchestrator Fable; Bau `lex-daten` auf **Sonnet** (offengelegte Abweichung von «nie unter stark»: Obergrenze Opus + Prüfer ≠ Bau-Modell), Prüfung `lex-pruefung` auf Opus, je frischer Kontext. **Gelandet:** #907 Fedlex-Frische fährt die volle Projektions-Kaskade (`scripts/normtext-repin-kaskade.sh`, `npm run projektionen:normtext`; Bug-Check fand latenten 4. Einzelfall `gen:artikel-bestand`; `745b276b7`; Nachweislauf 35365372442 erstmals wieder grün) · #908 rectifies-Parser liest «AS JJJJ N, M», Klassierung nach Headline-Blöcken — VTS `oc/2025/691` war Parser-Lücke, KEIN Fedlex-Fehler, kein Ausnahme-Eintrag (`790a32bf5`; GP 2 Durchgänge, 1. fand Schlupfloch Mehrfach-Nummer ohne Ziel-Vergleich) · #910 EDÖB-Merkblatt, AVG-Botschaften + Revisionen-Sidecar, BS-GR 26.0508, Vernehmlassungs-Status inkl. drei vom 8-Erlass-Tor ungesehener Deltas (`f7aa5c12d`; GP 2 Prüfer, Vollabgleiche 831 Einträge / 441 Dokumente = 0 Abw.) · #911 Fedlex-Abkürzungen EÖBV/AVG de/fr/it, it-«LC» als Waadtländer Homonym gesperrt (`59ac17fcd`; GP 4 Durchgänge — der 1. WIDERLEGTE den Bau: BGE 149 I 343 hätte AVG bekommen) · #912 Re-Pin `uno_antifolter` html-1, aus #909 vorgezogen (`a1d099a79`)
- **Nicht gelandet, bewusst:** Automatik-PR #909 — Gegenprüfung «Auflage blockierend»: der Lauf materialisiert erstmals `rectifiesInfoProOc` (latent seit #827), rectifies-Kanten 31 → 82, vier neu rot (3 Parser-Lücken, LRV `oc/2025/448` echte Abweichung). Folge-Schritt «rectifies-Tor Runde 2» in der ROADMAP (`QS-MONITOR-ROT`), Verdikt am PR. **VRV/VTS-Pflegetermin steht bis dahin auf 1.1.2031 statt 1.10.2026.**
- **Lehren verankert (§17):** Skill `bauschritt` (lange Tor-Ausgaben in Logdatei + Exit-Code) · Skill `auftrag` Modellwahl (unter Obergrenze Opus: Risikopfad-Bau Sonnet, Prüfung Opus) · `korpus-werkstatt/tools/verifikation.md` (BGE-Snapshots tragen zwei Textschichten; `relevancy.bger.ch` als Zweithost; «Text nennt ∅» heisst zuerst Parser prüfen). Wurzel-Fixe als ROADMAP-Zeilen: rectifies-Tor Runde 2, Materialien-Kaskade als ein Skript + sortierte raw-Caches, Vollabgleich-Tor Vernehmlassungen, ehrliche Automatik-PR-Titel.
- **Schlussnachweis:** Normen-Monitor-Lauf 35373415150 auf `a1d099a79`: Job «Rechtsstände (check:netz) · Live-Site-Smoke · Runtime-APIs» GRÜN, Issue #754 vom Lauf selbst geschlossen (#750 bleibt by design bis Turso-Reset 1.10. offen); Monatsjobs Vernehmlassungen + Basel-Stadt grün (BS öffnete Automatik-PR #913), Curia-Vista-Monatsjob ROT = dokumentierter Rest (Kaskaden-Lücke, eigene Zeile) · `QS-MONITOR-ROT` zurück auf `ready` (offene Unterpunkte), `W2·27-BUND-FERTIG` wip ohne Bau-Spur → `ready`.

## Session 18.9.2026 — Aufräumen: nur noch ein main, rote Läufe an der Wurzel, Gedächtnis (3 PRs)

- Gelandet: #902 Normen-Monitor-Zeitlimit 25→45 min · Fedlex-Frische `gen:verfall` nach Wiedervorlage-Refresh · Chronik-Überführung (`0905598c8`) · #904 Fedlex-Frische volle Historie (`969c5efc5`) · #905 Monats-Jobs npm 11 + ROADMAP-Deckel nur Warnung (Entscheid David 18.9.2026) + Vormerkung Hebel «Befund-Prosa in die Fahrpläne». Roadmap: `QS-MONITOR-ROT` / `QS-EFFIZIENZ`.
- Aufgeräumt: 3 Worktrees, 5 gelandete Zweige, `feat/qs-basis-hydrate` → Tag `archiv/qs-basis-hydrate-2026-09-18`, Autopilot-Entwurf #867 geschlossen (nichts übernommen, Begründung am PR), Issues #742/#722/#723 geschlossen; Vault LexMetrik 29 → 20 Einträge (7 archiviert, 3 zusammengelegt, Prüfer 0 Fehler).
- Befund: Normen-Monitor läuft wieder durch (28 min) und ist ECHT rot, 6/16 Netz-Tore — Übergabe an die Folge-Session. Lehre verankert: Skill `auftrag` Ziff. 6 (j). *(Karte nachgetragen von der Folge-Session, Wortlaut der Aufräum-Session.)*

## Session 17.9.2026 — Startseiten-Gruss pro Besuch + Sprachregionen (Buchung, 2 PRs)

- Gelandet: #899 Startseiten-Gruss wieder pro Besuch + Tageszeit (Inline-Skript vor Erstem Paint, CSP-Hash in `vercel.json`, StrictMode-/Suspense-fester Einmal-Verbrauch; `c18e65574`) · #900 88 neue Grüsse aus vier Sprachregionen, Rätoromanisch per Pledari Grond belegt (`e4189bed6`). Entscheid David 16.9.2026 «a» (Gruss pro Besuch) + Auftrag «mehr Grüsse aus allen Sprachregionen». Roadmap: `QS-PERF` (LCP-Messreihe, Suspense-Verdacht) / `QS-UI`.
- Lehren verankert (§17): Skill `perf` (Perf-Massnahme mit stiller Produkt-Rücknahme = wartet auf David, Wirkung vor Opfer nachmessen) · Skill `gegenpruefung` (Prüfer-Befund zu Render-/Lifecycle-Mechanismen braucht einen echten Repro-Test) · Skill `auftrag` Ziff. 6 (PR-Body-Trailer-Reihenfolge für Bau-Agenten explizit gemacht, landung Formregel 5). Details je Fundort.
- Nebenfunde gebucht (kein Bau, nur Steuer-Doku): `QS-PERF`-Checkliste (LCP-Ursache offen, CSP-Hash-Prüftiefe), `QS-BASIS` (Branch-Kollision `feat/qs-basis-hydrate`, `linkedom`-`window`-Leck), `QS-EFFIZIENZ` (`check:lizenzen` in node_modules-losen Worktrees).

## Ältere Session-Karten und Chroniken — rotiert ins Archiv

Verbatim verschoben nach `archiv/STRUKTUR-SESSIONKARTEN.md`
(FAHRPLAN-TOKEN-DISZIPLIN.md T-4): **13.6.2026** alle sieben 11.6.-Karten
(früher Abend · später Nachmittag · abends · nachmittags · vormittags ·
über Nacht · Tag «Schlichtung fertig + Vollerhebungen») · **11.6.2026**
Sessions 10.6. abends (STRUKTUR-UMBAU S-1–S-6) und nachmittags
(Fristen-Einheit FE-1–FE-6) · 7.6. abends (Betreibungsamt-Finder) und
nachts (Plan 9b Volldokumente) · 6.6. abends und nachmittags ·
Verschlankung 5.6.2026 · Session-Abschluss 6.6.2026 · **10.7.2026** alle
139 Session-Karten datiert 12.6.2026–3.7.2026 (Rotations-Auftrag «Karten
≤3.7.2026 ins Archiv»; neuester Block liegt jetzt zuoberst im Archiv,
Reihenfolge unverändert). · **10.7.2026 (QS-TOK/T1, mechanisiert):** 34 Karten
≤6.7.2026 byte-genau ins Archiv rotiert (nur die drei 10.7.-Karten bleiben);
Byte-Bilanz bestätigt (kein Inhaltsverlust), Rotation läuft künftig automatisch.

## Verifikationsstand (eine Zeile)

Stand 11.6.2026: Build + 38 Prerender-Routen ✓ · Lint 0/0 ✓ · Suite 1404
grün + 2 skipped (78 Dateien) ✓ · tsc STRICT · Golden 104/104 byte-gleich ✓
· Logik-Sweep 14'448 Kombinationen ✓ — Workflow: **`npm run gate`** (bzw.
`gate:schnell` pro Iteration; leise bei Grün, volle Ausgabe nur für rote
Tore, CLAUDE.md §6 Ziff. 1/5); `npm run check` für die Offline-Checks,
`npm run check:netz` für Fedlex; vor Deploys unabhängige Review-Agents
(Skill `landung`).

**Informationsbibliothek: `bibliothek/INDEX.md`** — Quellen-Register
(verifizierte Fedlex-Stände inkl. ZPO-Revision 2025), Parameter-
Verfallsregister, Recherche-Dossiers (Schlichtungsbehörden 26 Kantone),
ZPO-Normtexte für die Zuständigkeitsengine.

**Zuständigkeitsengine (`src/lib/zustaendigkeit.ts`, Phase 1 — entwurf):**
Bundesrechtsschicht nach ZUSTAENDIGKEIT-AUFTRAG.md (Spezifikation im
Repo-Root): Verfahrensart (Art. 243 inkl. Abs.-3-Vorbehalt), Schlichtung
(197–200), Entscheidkompetenz (210/212, Revision 2025: 10'000),
Gerichtsstände (10/32–35), HG-/Direktklage-Weichen (6/8). 30 Tests mit
beidseitigen Schwellen-Grenzwerten. **Phase 2 erledigt:** Kantonsschicht
`data/zustaendigkeitKantone.ts` (BS-Pilot, Stellen-Auflösung über
behoerden.ts, GOG-Schwelle bewusst null/offen) + SG_SCHWELLEN beziehen
die Zuständigkeits-Schwellen aus ZPO_SCHWELLEN (SSoT §5, golden-bewiesen
byte-gleich). **Phase 3 erledigt:** /rechner/zustaendigkeit (Form §3-rein,
Eckdaten-Tiles, Stelle mit Adresse/Quelle, Weichen offen, PDF-Bericht);
Katalogkarte `zustaendigkeit` (pro/entwurf) ersetzt die drei geplanten
Karten gerichtsstand/verfahrensart/schlichtung. **Phase 4 erledigt:**
Prefill-CTA → Schlichtungsgesuch BS (sgPrefillKodieren/Lesen; nur bei
ordentlicher Behörde + erfasster Stelle; Golden byte-gleich) — MVP
end-to-end. OFFEN: weitere Kantone (nach Dossier-Abnahme), weitere
Ziel-Vorlagen. Davids fachliche Abnahme steht aus.

## Informationsarchitektur (Stand EINE Hauptseite 7.6.2026)

**EINE Hauptseite (FAHRPLAN-EINE-HAUPTSEITE.md, Auftrag David 7.6.2026 —
hebt die Free/Pro-Zweiteilung vom 5.6. wieder auf):** `/` trägt den
VOLLSTÄNDIGEN Katalog (Gebiets-Kacheln, Suche `?q=`, Panel `?gebiet=`,
Anliegen-Zeile, «Zuletzt verwendet») hinter einem kompakten Hero
(Free-Nutzen-Headline in h2-Höhe; Kennzahlen OHNE Preisaussage bis
Monetarisierungs-Entscheid G1). Davor eine kuratierte Chip-Zeile
**«Häufig gebraucht»** (`lib/haeufigGebraucht.ts`, Nachfolger der
Free-Kachelwand-Kuratierung; nur Verfügbare erscheinen). `tier`-Feld,
`PAYWALL_ACTIVE`, `lib/proSession.ts` (Pseudo-Login) und der
Header-Pro-Button sind ENTFERNT (D-3; Stand vor dem Rückbau: Git-Historie
bis `2e80daf`). `/pro`, `/fachpersonen`, `/rechner` → DAUERHAFTE Redirects
auf `/` mit erhaltenem Suchstring (Permalink-/.ics-Link-Erbe). Mobil erbt
die Hauptseite den vorbestehenden 390px-Overflow des Katalogs
(FAHRPLAN-DESIGN Etappe 4, offener Strang).

**Katalog-Gliederung: primär nach RECHTSGEBIET** (17 kanonische Sektionen
in fester Auftrags-Reihenfolge, `RECHTSGEBIET_SEKTIONEN`), darunter je die
Untergruppen **Rechner** und **Vorlagen** (nur nicht-leere). Output-Typ
(Rechner) und Dokument-Typ (Vorlagen) sind FILTER; Rechtsbereich-Filter und
Suche bleiben. **Der frühere Modus-Umschalter (Primärweiche Rechner |
Vorlagen) ist damit abgelöst und entfernt**; `?modus=`-Links bleiben
harmlos; die Alt-Gliederungen ('art'/'bereich') sind aus dem Code
entfernt. Header = Zwei-Zonen (Logo links, Aktionscluster rechts:
Sprache · Methodik — Pro-Button entfernt 7.6.2026, Methodik seither auch
mobil), Mitte leer; Utility-Bar nur Pflichthinweis rechts, mobil
ausgeblendet.

**Design-Tokens (Feinschliff 5.6.2026, single source tailwind.config +
index.css):** Typo-Skala GESCHLOSSEN — micro 11 · overline 11 · xs 12 ·
body-s 14 · base 16 · body-l 18 · h3 20 · h2 25.6 (auch Ergebnis-Hauptwerte
mit `leading-none`) · h1 32 · display 36/44 (Heroes). **`text-sm`/`text-lg`
sind verboten** (Tailwind-lh weicht ab; body-s/body-l verwenden). Radien
komplett tokenisiert (--radius-sm…2xl). Status-Hintergründe nach EINEM
Rezept (`color-mix --status-tint 10%` auf Papier; AA geprüft). Motion:
--dur-fast/base/slow + --ease, Default-Easing global. Komponenten-Anatomie:
`lc-tile` (Ergebnis-Kachel) · `lc-notice[-warn|-danger]` eigenständig (kein
Inline-Padding!) · `lc-btn-sm` (36px) · disabled steckt in den
lc-btn-Klassen (keine disabled:-Utilities) · ein Aktions-Akzent
(lc-btn-primary; lc-btn-brass entfernt).

**Layout:** Inhaltsspalte einheitlich `max-w-content` = **70rem (~1120px)**
(Token in tailwind.config); 8-px-Skala `--space-1…24`, `--control-h` 44px,
`--pill-h` 36px. Hero text-geführt einspaltig (keine Deko-Grafik, bewusst
nicht animiert), Untertext ≤ 58ch; Determinismus-Claim genau EINMAL (Hero).
Kartenraster `repeat(auto-fill, minmax(340px, 1fr))`; Titel ohne Silben-
trennung (`text-balance`); Pills im Inhaltsblock, nur CTA per `mt-auto`
unten. Keine Ziffern in Sektionsköpfen/Sidebar (konsistent nirgends).

**Pro-Katalog = KACHEL-KATALOG (Umbau 6.6.2026 nachts, Live-Auftrag David;
Roadmap + Entscheide: FAHRPLAN-KATALOG-UI.md):** Die 17 Rechtsgebiete sind
kompakte Kacheln unter den 5 Obergruppen (Name · Zähler «X verfügbar · Y in
Vorbereitung» · verfügbare Werkzeug-Titel, geklemmt). Klick öffnet das
Gebiet als Panel in voller Breite unter der Kachel-Zeile (`?gebiet=` in der
URL, teilbar; nur ein Panel zugleich); die Disclosure-Sektionen samt
Scrollspy sind entfernt. Darüber: Anliegen-Zeile (lib/anliegen.ts, 8
situative Einstiege — ENTWURF, Abnahme David offen) + «Zuletzt verwendet».

**Suche:** EIN kompaktes Suchfeld in der Katalog-Seitenleiste (Desktop)
bzw. im Filter-Drawer (mobil) — filtert den Katalog live. Die frühere
⌘K-Befehlspalette ist entfernt (Entscheid David 5.6.2026). Seit 6.6.2026:
Suche/Filter aktiv → flache, gerankte Trefferliste statt Kacheln (Rang:
Titel > Keyword exakt > Keyword > Norm > Gebiet; lib/katalogSuche.ts —
dieselbe Logik testet die Suchbegriff-Goldliste katalogSuche.test.ts,
48 Paare Laie/Fach/Norm); `?q=` in der URL; «/» fokussiert das Feld;
Keywords kompakt verglichen wie Normen («Art.311» = «311 ZPO»).
Metadaten-Inventur: `npx vite-node scripts/katalog-inventur.ts`.

**Sprachen:** Umschalter sichtbar (Header); EN/FR/IT «in Bearbeitung» mit
DE-Fallback + persistentem Banner; KEINE maschinelle Übersetzung (fachkundige
Person später). `<html lang>` folgt der Locale; Fedlex-Links ebenfalls
(fr/it amtlich — Anker stichprobenverifiziert sprachunabhängig; en → de).

## Status-Modell (ehrlich, drei Zustände)

`entwurf` (oranger Top-Rand `--warn-500` + Outline-Badge «Entwurf»
(`.lc-badge-entwurf`), Tooltip «erstellt, fachlich noch nicht geprüft»;
dazu EINE Status-Legende über der Startseiten-Kachelwand statt lauter
Einzel-Badges — Design-Review 6.6.2026, Freigabe David) = gebaut, ungeprüft ·
`geprüft` (Goldrand, KEIN Wort-Badge) = fachlich geprüft — **aktuell
nirgends vergeben** · `geplant` (gedämpft, AA-konform ohne Opacity) =
«In Vorbereitung», ohne Norm-Pills/Artikel-/Tagesangaben.
**Alle NormRefs tragen `verified: false`**, bis David sie fachkundig gegen
Fedlex prüft (Anker selbst sind build-verifiziert, Format `art_335_c`).
Form-Gates der Vorlagen bleiben im Entwurf-Status voll funktional.
Status-Filter heisst «Nur verfügbare» (= nicht geplant).

## Katalog (Quelle: src/lib/startseiteConfig.ts — Single Source of Truth)

**111 Einträge: 64 Rechner + 47 Vorlagen** (Katalog-Ausbau 5.6.2026: +59
geplante Karten gemäss KATALOG-ROADMAP.md; Soll-Inventar dort gepflegt).
Felder: modus, art, rechtsgebiet (kanonisch, 17 Werte),
**rechtsbereich** (privat/oeffentlich/straf/uebergreifend), status, norms
(NormRef mit verified), href, schemaId/formvorschrift/output (Vorlagen),
szenarien (konsolidierte Rechner), related (modusübergreifend), keywords
(**tier entfernt 7.6.2026**, FAHRPLAN-EINE-HAUPTSEITE). VorlageArt um
**korrespondenz** («Schreiben & Erklärungen») erweitert. Neue geplante
Karten: norms [], kein href, neutrale Beschreibungen (Normentreue);
Roadmap-«[Gerüst]» als «Strukturiertes Gerüst …» im Text.

**Konsolidierung (43→34):** 9 Einzelkarten absorbiert — Klagebewilligung +
Fristwiederherstellung → ZPO-Fristen; Rechtsöffnung/Aberkennung/Kollokation
+ Arrest → SchKG-Phasen; missbräuchl. Kündigung + Massenentlassung →
«Arbeitsrecht — Fristen»; Miet-Anfechtung → «Mietrecht — Fristen»;
Verzugszins-vertieft → Verzugszins; SV-Leistungsverwirkung → ATSG-Karte.
`RechnerCard.szenarien` zeigt abgedeckte/geplante Szenarien auf der Karte.

**Spät-Session 7.6.2026 (Kurzspiegel; Details ROADMAP.md A.0):**
Daueranweisungen §0 Mehrwert-Test + §0a Perfektion-vor-Neubau · Roadmap
−7 geplante Karten (verifiziert) · AG-Programm fertig inkl. Notariats-
tarif-Korrekturen (ZH-Rahmen 123! SG floor!) · Startseite: leere Gebiete
als «In Vorbereitung»-Zeile, Rubrik einzeilig · Vereinheitlichung Runde 1
(Tagerechner-Hash/geteilter Teilen-Button, 7 Titel-Paare + Invariante) ·
Dossiers neu: gmbh-deltas-g0, gmbh-qualifizierte-gruendung,
ag-kapitalkategorien (Bau gesperrt), BGerR-Verifikation (35/35a-Split).

**Konsolidierung Runde 2 (7.6.2026, FAHRPLAN-KATALOG-KONSOLIDIERUNG,
Auftrag David «simplifizieren — ein Einstieg pro Rechtsfrage»):** Katalog
gesamt 115→112, verfügbar 35→32 gebaut, davon **28 sichtbar**. (a) GELÖSCHT
die 3 reinen Hash-Deep-Link-Karten: untermietvertrag → Karte «Mietvertrag
(Wohnen · Geschäft · Untermiete)»; schkg-/straf-zustaendigkeit → EINE Karte
«Zuständigkeit (Zivilprozess · Betreibung · Strafverfahren)» mit szenarien
(kehrt den Katalog-Split vom 6.6. um — Davids Delegation 7.6.). (b) NEU
`imKatalog:false` (BaseItem) + `KATALOG_KARTEN`: die 4 Kündigungs-Masken
(AN/AG/Mieter/Vermieter-Checkliste) behalten ihre Karten als SSoT der
Masken-Seiten (`karte(id)`!), erscheinen aber nicht mehr im Register/Suche —
ihre Auffindbarkeit tragen die Themen-Einstiege «Kündigung & Fristen im
Arbeitsverhältnis» (ex «Arbeitsrecht – Fristen») und «… im Mietverhältnis»
(ex «Mietrecht – Fristen»), deren Rechner-Seiten die Masken direkt verlinken.
(c) Kachel-Overline zeigt jetzt `Gebiet · Rechner/Vorlage` (Funktions-
Kennzeichen, EIN Template-Literal wegen SSR-Marker). Ausdrücklich NICHT
gemergt: GmbH-/AG-Gründung (zwei Werkzeuge, echte Rechtsform-Entscheidung),
Tagerechner↔ZPO/SchKG (gewollter Laien-/Fach-Doppeleinstieg), Rechner↔
Vorlage-Paare (§5: eine Engine, zwei Ausgabeformen). Goldliste deklariert
nachgezogen (misst jetzt KATALOG_KARTEN); Davids Abnahme der neuen
Titel-Wortlaute offen.

**Gliederung (seit Katalog-Ausbau):** beide Seiten = Rechtsgebiet-Sektionen
(GebietSektion, feste §4-Reihenfolge OHNE Relevanz-Sortierung) mit
Untergruppen Rechner/Vorlagen; innerhalb der Gruppen verfügbare vor
geplanten (sortiereKarten). Filter: Status («Nur verfügbare») · auf /pro
zusätzlich Rechtsbereich · Output-Typ (Rechner) · Dokument-Typ (Vorlagen);
Suche in der Seitenleiste. Grenzfall Vorlage «Einsprache»: straf
(Strafbefehl häufiger), Verwaltungsbefehl via Keywords.

## Rechner (Engines in src/lib/, alle rein/deterministisch, kein LLM)

Gebaut (entwurf): zpo-fristen, schkg-fristen, kuendigung-sperrfristen
(inkl. **Sperrtage-Zähler**: Kontingent 30/90/180 je DJ, beansprucht nach
Art.-77-Zählung, verbleibend, Rückfall-Zeilen — Komponente
SperrtageZaehler, auch in der kombinierten Ansicht), mietrecht,
verjaehrung (Zwei-Fristen, Stillstand-Union), gewaehrleistung (Zwei-Regime
1.1.2026), verzugszins (Segmente, Art. 85-Anrechnung), lohnfortzahlung
(Skalen; Engine-Guard AUF 1–100 %), erbteilung, **allgemeineFrist**
(Free-Tagerechner, Auftrag 5.6.2026: dünne Engine auf fristenEngine/
zpoFeiertage — dies a quo IDENTISCH zu zpoFristen, Systemtest AF-14;
getrennte Wochenend-/Feiertags-Toggles, Tage-zwischen-Hilfsmittel;
SR 173.110.3 als Gesetzes-Seiten-Pill, ELI SPARQL-verifiziert).
Feiertage algorithmisch (Computus) — keine Jahres-Klippe.

## Vorlagen-Plattform (src/lib/vorlagen/)

Generische Engine: `assemble(schema, antworten)` rein/deterministisch
(Bedingungs-Algebra eq/in/nichtLeer/and/or/not; wiederholeUeber; nummeriert
mit Leerlisten-Guard; Interpolation; Bausteinprotokoll). Renderer aus EINER
Quelle: vorlagenPdf (jsPDF, Banner-API, WinAnsi-Sicherung) + vorlagenDocx
(docx-Lib, lazy geladen, Word-Formatvorlagen; XLSX architektonisch
vorbereitet, nirgends ausgeliefert). Geteilte Wizard-UI:
components/vorlagen/ui.tsx (Field, NormLink locale-bewusst, Stepper).

**8 gebaute Vorlagen (alle entwurf):**
1. **Testament** (/vorlagen/testament) — eigenhändig: Abschreib-Mustertext,
   Pflichtteils-Panel, Gates 467/505/481/472. KEIN DOCX (Eigenhändigkeit).
2. **Patientenverfügung** (/vorlagen/patientenverfuegung) — Schriftform;
   Konsistenz-Engine R1/R2, harter Sterbehilfe-Block R6 (Art. 114/115 StGB);
   PDF + DOCX (Pilot Mehrformat).
3. **Vorsorgeauftrag** (/vorlagen/vorsorgeauftrag) — formMode-Weiche
   eigenhändig (Mustertext) / beurkundet (Entwurf, DOCX nur hier);
   Eligibility-Gate Art. 13; Grundstück-Sondervollmacht erzwungen.
4. **Schlichtungsgesuch Basel-Stadt** (/vorlagen/schlichtungsgesuch-bs,
   tier experte) — Routing mit Stopp-Karten (Miete/GlG → eigene Stellen,
   Art. 198), Mängelliste mit Schritt-Sprung, SG_SCHWELLEN hart codiert,
   Behörden-Stammdaten BS, Form-Gate (Exemplare = 1+Beklagte), PDF+DOCX,
   BEWUSST ohne localStorage (Anweisung); 12 Akzeptanztests.
5. **Einzelarbeitsvertrag** (/vorlagen/arbeitsvertrag) — ERSTE Vorlage auf
   dem generischen Wizard-Rahmen. Grundlage: normverifiziertes Gutachten
   Art. 319 ff. OR (5.6.2026); Validierungskern = Matrix absolut/relativ
   zwingend (Art. 361/362) + Schriftform-Klauseln (durch beidseitige
   Unterschrift erfüllt) + Disclosure (BGE 145 III 365, 149 III 202,
   129 III 276). Harte Gates: Probezeit ≤ 3 Mte, Frist ≥ 1 Mt (bei
   Befristung neutralisiert), Ferien ≥ 4/5 Wochen, Ferienabgeltung bei
   Vollzeit gesperrt, KV nur mit Ort/Zeit/Gegenstand + Einblicks-
   Bestätigung. Kantonale Mindestlöhne als DATIERTE Parameter
   (AV_MINDESTLOEHNE, jährlich verifikationspflichtig!). ArG in fedlex.ts
   ergänzt (Anker art_9/12/13/46 empirisch verifiziert). PDF+DOCX;
   16 Akzeptanztests. Deklarierte Gutachten-Abweichung: einheitliche
   Frist < Staffel zulässig per Art. 335c Abs. 2 (Hinweis statt Verbot).
6. **Mietvertrag Wohn-/Geschäftsräume** (/vorlagen/mietvertrag, Karte
   mietvertrag-wohnen) — Gutachten Art. 253 ff. OR/VMWG (5.6.2026).
   Zentrale Weiche objektTyp + Kanton. Gates: Kaution ≤ 3 Monatszinse
   (nur Wohnraum), Fristen 3/6 Mte, Index ≥ 5 J/LIK + Staffel ≥ 3 J
   (beide am Fedlex-WORTLAUT verifiziert), NK-Einzelausweis, MWST nur
   Geschäftsraum. DATIERTE Parameter: Referenzzins 1.25 % (1.6.2026,
   quartalsweise!), MWST 8.1 %, Formularpflicht-Kantone (BWO 4.2.2026,
   BE-Diskrepanz offengelegt, dynamisch per 1.11.). PDF+DOCX; 14 Tests.
7. **Vollmacht** (/vorlagen/vollmacht, Karte `vollmacht`) — EINE Maske mit
   Typ-Schalter Anwalts-/General-/Spezialvollmacht (Entscheid David
   5.6.2026 statt zweier Vorlagen; Grundlagen-Bericht «Vollmachten»,
   Downloads). Formfrei (Art. 11 OR) → ausgabeArt `fertig`, PDF+DOCX.
   Gemeinsamer OR-AT-Kern (Parteien natürlich/juristisch, mehrere
   Bevollmächtigte einzeln/gemeinsam, Substitution, Widerruf Art. 34,
   Befristung, transmortale Klausel Art. 35); besondere Ermächtigungen
   als Katalog wortlautnah zu Art. 396 Abs. 3 OR. Deterministische
   Form-Gates: Bürgschaft = SPERRE (Art. 493 Abs. 6 OR), Grundstück =
   Warnung (Art. 216 OR / Art. 86 GBV / Formfrage offen BGE 112 II 330),
   Bank = bankeigene Formulare, Prozess-Bereich = Art. 68 ZPO-Warnung,
   Vorsorgefall = Weiche zu Vorsorgeauftrag/PV (Gesundheits-Bereich
   bewusst NICHT wählbar). Ersetzt die geplanten Karten generalvollmacht/
   bankvollmacht. StPO/VwVG in fedlex.ts ergänzt (Anker art_129/art_11
   empirisch verifiziert). 20 Akzeptanztests.
8. **Klage im vereinfachten Verfahren – BS** (/vorlagen/klage-vereinfacht,
   Karte `klage-vereinfacht`) — zweite BS-Eingabe der SG-Familie
   (normverifizierter Auftrag 5.6.2026). Deterministisches BS-Routing:
   Arbeit ≤30k → Arbeitsgericht (§§ 73 f. GOG), GlG/Mitwirkung →
   Dreiergericht, Gewaltschutz/DSG/Miete-Kern → Einzelgericht (§ 71 GOG);
   ehrliche Stopps (>30k ohne Abs.-2-Materie → ordentlich; Arbeit >30k →
   § 73 Abs. 2-Hinweis; KVG-Zusatz → Sozialversicherungsgericht).
   Schwellen aus ZPO_SCHWELLEN (SSoT); Klagefrist Art. 209 Abs. 3/4 über
   die zpoFristen-Engine ('klagefrist_klagebewilligung', Gerichtsferien).
   ABWEICHUNG vom Auftrag offengelegt: Art. 114 ZPO kennt KEINE Miete-
   Position (lit. d = Mitwirkungsgesetz) → Miete im Entscheidverfahren
   nicht kostenfrei. Begründung = freiwilliger strukturierter Platzhalter
   (Behauptungs-Liste + Beweismittel) mit Verzichts-Baustein (Art. 245
   Abs. 1); Begehren beziffert/unbeziffert (Art. 84/85), Rechtsöffnungs-
   Antrag, Beilagen-Automatik (KB/Ausnahme/Vollmacht/Urkunden), Doppel-
   Hinweis Art. 131. SG-Parteitypen wiederverwendet (parteiZeilen & Co.
   exportiert). PDF+DOCX, ohne localStorage (wie SG). 20 Akzeptanztests.

Wizards 1–3 und 7 mit localStorage (`lexmetrik.vorlage.*.v1`, Hydration
array-gesichert); Vorschau als Funktionsaufruf (kein Remount). Eingaben
(4, 8) bewusst OHNE localStorage.

## PDF-Rechenbericht (src/lib/pdf/)

**Abend-Paket (5.6.2026):** Formulierungskonventionen (lib/konventionen.ts
SSoT + Linter-Test über echte Textausgabe; — → – plattformweit, «5 %»,
SG-Floskeln, Golden-Diff programmatisch als rein konventionell bewiesen).
Free-KACHELWAND (flach, FREE_REIHENFOLGE, Hero neu «Schweizer Recht,
berechenbar.»; Katalog.tsx pro-only). Versimplung: ui/Tabs + ui/
SelectionGrid (14+3 Stellen entdoppelt, SSR-byte-identisch), chf()
kanonisch, tote Katalog-Props raus (netto −175 Z.). Pro: Sektionen
starten EINGEKLAPPT, Zivilprozess & Vollstreckung zuerst. KOMBINIERTER
FRISTENRECHNER free (/rechner/tagerechner: Verfahrens-Tabs Allgemein/
ZPO/SchKG → bestehende Forms; §4 unangetastet; Trennungs-Querschnitt-
Test). Mobile-Check: Tabs-Overflow gefixt (overflow-x-auto), Grids
mobil-Basis. PROJEKTBESCHRIEB.md neu geschrieben.

**Pro-Katalog-Umbau (5.6.2026, Auftrag):** Tabs Verfügbar(17)/Gesamt(111)
(?ansicht=, Default Verfügbar), juristische Obergruppen als Super-Trenner
(lib/rechtsbereichGruppen.ts, 5er-Modell, 4er-Fallback per GRUPPEN_MODELL),
gruppierte Scrollspy-Seitenleiste (Rechtsbereich-Filter+Direkteinstieg
entfernt), Schnellzugriff ★Favoriten+Zuletzt (lib/schnellzugriff.ts,
localStorage, Stern nie auf geplant), istVerfuegbar()-Prädikat, Hero «17
sofort verfügbar». Free unverändert. BetragsFeld: Tausender-Apostroph in
22 CHF-Feldern. Visual-Checks (2 Agenten) GRÜN; P1–P3 gefixt.

**Teuerungsrechner (5.6.2026, /rechner/teuerung, Free):** LIK-Indexierung
mit amtlicher BFS-Reihe (src/data/likReihe.ts, generiert via scripts/
lik-reihe-generieren.py aus cc-d-05.02.08; 10 Originalbasen 1966–Mai 2026;
OPEN-BY). Basis-AUTO wie BFS-Rechner; Modi Indexmiete (Art. 17 VMWG
wortlaut-verifiziert, Senkungspflicht)/Unterhalt (286/128 ZGB)/generisch.
VMWG neu in fedlex.ts. MONATLICHE PFLEGE: Reihe nach BFS-Publikation
regenerieren. Eingaben: Behörden-Registry +Miete/Diskriminierung BS
(Staatskalender 5.6.2026); SG-Forum-Häkchen entfernt (Kantonswahl).

**Logik-Nachrechnung + Versimplung (5.6.2026):** 4 Cluster unabhängig vom
Code aus dem Gesetz nachgerechnet (100+ Handfälle, 6912er-Erbrecht-Gitter,
576er-ZPO≡Allgemein-Gitter): KEINE Berechnungsfehler. Offen für Davids
Entscheid: Sperrtage-ANZEIGE-Konvention (beansprucht Art.-77 vs.
Kalendertage; Endtermine identisch). Versimplung golden-bewiesen
(scripts/golden-outputs.ts, 53 Fälle byte-gleich): naechsterWerktag/
dauerTageInklusiv kanonisch, fmt/iso ×7 dedupliziert, Vorlagen-Helfer
zentral, Rückwärts-Spiegelung direkt.

**Tagerechner-P1 (5.6.2026, Auftrag «Verbesserung Fristenrechner»):**
Rückwärtsmodus (spätester Handlungstag; Verschiebung defensiv «keine»,
Vorverlegung nur mit Ungeklärt-Vorbehalt), Zustell-Helfer (rein informativ:
7-Tage-Fiktion, A-Post Plus Art. 142 Abs. 1bis ZPO), .ics-Export (RFC-5545
inkl. Folding, deterministisch) + Permalink (validiert), Validierung/A11y;
BGE 150 III 367 nachgeführt. AV/MV-Schemas: v1.1.0 (Vertiefungs-Gutachten).
Golden-Output-Protokoll: scripts/golden-outputs.ts (53 Fälle, vergleich-Modus).

**Formatvorlagen-SSoT (5.6.2026, `formatvorlagen.ts` — drei Grundlagen-
Berichte):** Typografie je Format + AUSGABE_REGELN je AusgabeArt
(abschrift = DOCX hart gesperrt · entwurf = PDF-Wasserzeichen «ENTWURF»
[VA beurkundet] · fertig). Eingaben mit Korrekturrand 3.5 cm rechts,
Anrede/Schlussformel/«im Doppel» (Rollen anrede/schlussformel);
Verträge mit Ausfertigungs-Vermerk + QES-Hinweis (Art. 14 Abs. 2bis OR).
Pro-SITZUNG (lib/proSession.ts): Pro betreten = eingeloggt (localStorage,
Reload-fest, «/»→/pro), Header «Ausloggen»; Andockpunkt Zahlungs-Gate (System offen).
Einzeilen-Heros Free+Pro; Gebiets-Titel in Sans.

**Formatvorlagen der Vorlagen-Renderer (5.6.2026, Referenz-Layouts):**
Schemas deklarieren `format` (verfuegung·vertrag·eingabe) + Absatz-`rolle`n
(absender/adressat/datumzeile/betreff/rubrum/parteien/unterschrift); PDF,
DOCX UND Live-Vorschau interpretieren beide aus EINER Quelle. Arial/
Helvetica 11, Haarlinien unter Titel/Betreff, hängende Einzüge (1./–),
gezeichnete Unterschriftslinien, Fusszeile je Seite, Disclaimer 8pt am
Ende; Eingaben OHNE Dokumenttitel (Betreff trägt ihn), langes Datum.
Engine-Konvention: Platzhalter auf …Satz/…Zeile verschwinden leer
ersatzlos (sonst «________»-Vorschau-Strich). Visuell verifiziert via
`.scratch/pdf-beispiele.ts` + qlmanage-Thumbnails.

pdfModel (reines Block-Modell: kopf/hero/tabelle/schritt/hinweisbox/norm)
+ pdfRender mit **eingebetteten Markenschriften** (Fraunces/Geist/GeistMono
als Base64-TTF, ~0.4 MB NUR im lazy Klick-Chunk). Hero-Hauptkennzahl,
Eingaben-Tabelle (Mono rechtsbündig), unzerreissbare Schritte mit
klickbaren Norm-Pills (Vormessung inkl. Pill-Umbrüchen), sichtbare URLs,
Status «Berechnung vollständig». Verzugszins + Kündigung liefern hero.
Visuelle Prüfung: qlmanage-Thumbnails + Swift-PDFKit-Split.

## Oberste Ebene: vier Output-Typen

| Sektion (`art`) | Inhalt |
|---|---|
| Fristen (`frist`) | Prozessuale und materielle Fristen |
| Beträge & Quoten (`betrag`) | Geldansprüche, Zinsen, Kosten, Quoten |
| Zuständigkeit & Einordnung (`zuordnung`) | Gericht, Recht, Verfahrensart |
| Werkzeuge (`werkzeug`) | Rechtsgebietsübergreifende Hilfsrechner |

## Grossausbau 5./6.6.2026 — Zuständigkeits-Plattform (Kurzkarte)

**Drei Rechtswege live** im Zuständigkeitsrechner (je EIGENE Engine, §4):
- **Zivil** (`lib/zustaendigkeit.ts`): 9 Streitsachen · Fahrplan + kantonale
  Kosten-Rahmen (alle 26, `data/zustaendigkeitKosten.ts`) · Art.-113-Kosten-
  freiheit · konkrete Schlichtungsstelle aller 26 Kantone
  (`data/schlichtungsstellen.ts`) mit **PLZ→Gemeinde→Amt** gemeindescharf in
  ZH/AG/SG/TG/FR/ZG/AI (`data/schlichtung/*`, amtliches swisstopo/BFS-Register,
  Generator `scripts/plz-generieren.ts`) · **Handelsgerichte** ZH/BE/AG/SG ·
  **Rechtsmittel-Modus**: Berufung/Beschwerde-Weiche (308/319 ZPO) + obere
  Instanz aller 26 Kantone (`data/obereInstanzen.ts`) + BGer-Schwellen
  (Art. 74 BGG, BGG-Cache verifiziert).
- **SchKG** (`lib/schkgZustaendigkeit.ts`): Betreibungsort-Kaskade 46–55,
  11 Anliegen (Rechtsöffnung/Aberkennung/Widerspruch/Kollokation/Arrest/
  Konkurs/Aufsichtsbeschwerde) mit Verwirkungsfristen-Badges; Gebühr
  Zahlungsbefehl nach Art. 16 GebV SchKG (Stand 1.1.2022, 2026-Vorbehalt
  im Verfallsregister); BJ-Betreibungsämter-Verzeichnis verlinkt.
- **Straf** (`lib/strafZustaendigkeit.ts`): StPO-Decision-Tree (Spezialforen
  35–37 → Tatort 31 → Kaskade 32; Weichen 33/34/38/40/41/42); Anzeige-
  Fahrplan (301; Strafantrag 3 Mt., Art. 31 StGB); zentrale StA aller
  26 Kantone + Bundesanwaltschaft (`data/staatsanwaltschaften.ts`).

**Vorlage Schlichtungsgesuch kantonsübergreifend:** Behörden-Auflösung für
alle 26 Kantone (`components/vorlagen/SgBehoerdenWahl.tsx`; Adressat-Kette
Hand > BS-Registry > Recherche > Platzhalter). **UX-Programm** (9 Etappen-
Commits) + Design-Konsistenz-Sweep abgeschlossen. **Bibliothek:** 21 Dossiers
(4 Regelwerke ZPO/SchKG/StPO/Erbrecht; Behörden Zivil/Straf/Erbgang; Kosten)
— Status je Dossier in bibliothek/INDEX.md (SSoT-Karte dort).

## Offene Punkte (nächste Session)

1. **Fachliche Abnahme durch David** (er ist die «fachkundige Person»):
   **Erste Sichtung aller 4 Vorlagen am 5.6.2026 erfolgt** (Bausteine,
   Gates, Schwellen vorläufig für gut befunden). SEIN ENTSCHEID: **alles
   bleibt `entwurf` / `verified: false`** bis zur Wort-für-Wort-
   Detailüberarbeitung («wir überarbeiten alles später»). Erst danach
   NormRefs auf verified:true und Einträge einzeln auf «geprüft» (Goldrand).
2. **Seine Antworten ausstehend:** redundante Tageszählungs-Hinweise im
   Verzugszins-Bericht kürzen? · DOCX-Standardannahmen ok (Testament ohne,
   VA nur beurkundet)? · Bausteinprotokoll in PDF/DOCX-Exporte aufnehmen?
3. ~~Phase 4: Experten-Gating als Wrapper um /fachpersonen~~ → **entfällt
   ersatzlos** (Aufhebung der Free/Pro-Zweiteilung, Auftrag David
   7.6.2026); eine spätere Monetarisierung bekäme einen neuen,
   funktionsbezogenen Zuschnitt (STRATEGIE-PLATTFORM, Gate G1).
4. **Schlichtungsgesuch:** offene Verifikationen (kantonale §§ GOG/EG ZPO/
   GGR, PLZ 4001/4051, Art.-135-Randtitel) — in der UI offengelegt.
5. Kleineres: Detailseiten-Titel (calculators.ts) an neue Katalog-Titel
   angleichen? · Datepicker-Pfeiltasten (A11y-Kür) · Markenschriften auch
   für Vorlagen-PDFs · ggf. sichtbare Rechtsgebiet-Zwischentitel in den
   Untergruppen.
6. ~~Verschlankung Stufe 2~~ → **erledigt 5.6.2026** (generischer Rahmen
   in components/vorlagen/wizard.tsx, s. oben). Optional verbleibend:
   Form-Gate-Sektion (brass-Box mit Checkliste) als vierte geteilte
   Komponente — Texte sind je Vorlage fachlich verschieden, daher bewusst
   zurückgestellt.

## Backlog (bewusst NICHT gerendert)

Aufnahme nur bei klar regelbasiertem, deterministischem Umfang — sonst
Widerspruch zu «feste Rechenregeln, keine Schätzung»: Konsumkredit-Widerruf
(Anwendungsbereich klären) · Schadenersatz/Genugtuung · Unterhalt ·
Tagessatz · Mietzinsherabsetzung · Konkurrenzverbot (alle wertend/Ermessen).
