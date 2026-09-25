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
## Session 20.9.2026 (2) — ROADMAP-Deckel: Aufräumen, Struktur-Reparatur, neues Tor (2 PRs gelandet, §17-Lehre, kein Risikopfad)

- **Auslöser** Weisung David «räum die roadmap auf» + Re-Akkumulations-Wächter GELB (141.9 KB > 120 KB). Befund gegen die Erwartung: der Deckel war **nicht** durch `done`-Stau gerissen — von 64 Schritten standen 2 auf `done`, und 8.6 der 10 KB erledigter Zeilen zeigten längst in die Chronik. Die Masse waren offene `- [ ]`-Posten (69.5 KB). Chronik-Überführung allein brachte 141.6 → 141.1 KB; Befund und Rechnung in **#938**.
- **#941 gelandet** (`c94967134`): (a) 15 offene Posten aus den `done`-Köpfen `W2·24-DESIGN-IDENTITAET` und `W3-TARIF-STAND` herausgelöst in vier eigene Schritte (`W2·24-C`, `W2·24-PERF-REST`, `W3-TARIF-FOLGE`, `W3-RECHTSSTAND-WEICHE`) — `plan:next` **44 → 48** baubare Schritte, Davids §7-Fachfrage (Verjährungsrevision 2020, `verjaehrung.ts:547`) wieder sichtbar; (b) Restposten-Listen nach ROADMAP-Protokoll Ziff. 4 in die Fahrpläne verlagert, **`FAHRPLAN-CI-MINUTEN.md` neu angelegt**; (c) Zeiger-Drift Z. 692/693/946 repariert, toter Verweis `W3-TARIF-NACHVERIFIKATION` auf Ist-Zustand umgeschrieben (Schritt **nicht** eigenmächtig angelegt). **141.9 → 110.2 KB, 7 160 B Reserve**, Wächter grün. Gegenzählung maschinell: kein Zeilenverlust, 128 Zeilen byte-genau in Fahrplänen wiedergefunden.
- **#942 gelandet** — **§17-Lehre als Tor:** `check:plan` **Regel 15 «Kopf-Buchung»** (`scripts/plan/kopfBuchung.ts`) macht offene `- [ ]`-Posten unter einem `done`-Kopf rot. Eingeordnet als **F17-Erweiterung**, nicht als neue Klasse — F17 «Gebaut, nie gebucht» deckt per deklarierter Richtungs-Grenze nur «Fahrplan fertig, Plan offen» ab. Geburtsbeweis §6.7 angesagt-dann-gemessen: **rot 14/14** auf `0e4999b48`, **grün 0** auf `8f6fe6971`, Verdrahtungsprobe über `pruefe()` (gesamt 14, davon Regel 15: 14 — alle übrigen Regeln null). Streuung über 10 historische Stände: 5 mit Treffern, Einzelfälle von Hand als echt bestätigt. Beide Beweisläufe vom Orchestrator unabhängig nachgemessen.
- **Parallel-Session** «QS-MONITOR-ROT» im selben Checkout: Sperrzonen (`QS-MONITOR-ROT`, `QS-BASIS`/`AUTOMERGE_TOKEN`) beidseitig vereinbart und eingehalten (Diff-Grep: 0 Treffer), Landereihenfolge #938 → #940 → #941 → #942 seriell abgestimmt. Nach ihrem Merge die freigegebene Zeile «Kontrast Fristende-Marker» von `QS-MONITOR-ROT` nach `W2·17-UI-BEFUNDE` verschoben (Herkunft ergänzt, nicht nachgeführt — §2b).
- **Gelernt, dass die Punktlandung nicht hält:** Durchgang 2 endete 483 B unter dem Deckel; der Merge von #940 hat die Reserve binnen einer Stunde aufgebraucht (119.5 → 122.1 KB). Erst der Nachzug (Durchgang 3, `QS-MONITOR-ROT` + `QS-BASIS` nach Aufhebung der Sperre) brachte echten Puffer.
- **Offene Enden:** Der Deckel ist **entlastet, nicht stabilisiert** — Masse wandert in Fahrpläne, die der Wächter nicht misst (`FAHRPLAN-OFFENE-BEFUNDE.md` 106.5 KB, `FAHRPLAN-UI-BEFUNDE.md` 155.1 KB). **Planungsentscheid David** offen (eigenes Flächenbudget für Fahrpläne, oder Hook der neue Befund-Zeilen gleich in den Fahrplan lenkt) — notiert in `FAHRPLAN-EFFIZIENZ-CHECKLISTE.md` Runde 3. Dort auch zwei unbewachte Nachbarklassen (verwaister Posten ohne Kopf · Prosa-Verweis auf ID ohne `@meta`), die Härtung von `check:regel-wiedervorlage`, der Selbstwiderspruch in `QS-CI-MINUTEN` (§5) und der Fehlalarm der Nachlass-Wache. Kein `verified` gesetzt, kein Risikopfad berührt.

## Session 20.9.2026 — `QS-MONITOR-ROT`: Token-Nachweis, #934 nachgezogen, Session auf Davids Wunsch beendet (0 PRs gelandet, Risikopfad berührt, Übergabe)

- Schritt `QS-MONITOR-ROT` (`feld: korpus`), zurück auf `status: ready`. **Nichts gelandet.** #934 (Curia-Monatslauf 2026-09-19, später durch #939 ersetzt): origin/main eingezogen + Teilkaskade, Kopf `3047b63ae`, Einzeltore Exit 0, `gate` rot nur `check:gegenpruefung`; 386 curia-Dateien (1 neu `02.008`, `beschriftung` 908× ungeklärt). Opus-Gegenprüfung dispatcht und auf Davids «stop» abgebrochen — **frisch neu dispatchen** (Prüfauftrag P1–P8: `<Haupt-Checkout>/.claude/notizen/2026-09-20-gp-934-pruefauftrag.md`), Ablauf des Entwurfs 1.10.2026.
- **Token:** David hat `AUTOMERGE_TOKEN` am 20.9.2026 13:30Z getauscht. Beleg: Lauf 35513728588 eröffnete #936 (BS) und #937 (Vernehmlassungen) selbst — beide reiner Datums-Churn, mit Begründung geschlossen. Curia-Job danach vollständig grün (Vollabgleich · Teilkaskade · Vorflug · «PR eröffnen») ⇒ **#939** (Curia-Monatslauf 2026-09-20, Kopf `91ce52263`) — nach Datums-Normalisierung inhaltsgleich mit #934, darum #934 als überholt geschlossen; **die Gegenprüfung geht auf #939 über.**
- **Dependabot #918 geschlossen, kein Flake:** `@axe-core/playwright` 4.13.0 findet echten Kontrast-Befund («Fristende»-Marker 4.45 statt 4.5) — ROADMAP-Zeile, danach `@dependabot reopen`.
- **Pflegetermin 1.10.2026:** nur recherchiert (18 statt 14 Einträge, alle per Fedlex-SPARQL bestätigt, `check:verfall` rot erst ab 2.10., Re-Pin frühestens Mo 5.10. via `fedlex-frische`), nichts gebaut.
- **Offene Enden:** `PLAN_BUCHUNG_TOKEN` alt, Direkt-Push der Plan-Buchung scheitert vermutlich am Queue-Ruleset (ungemessen) · Restbefunde Auftragspunkt 5 unberührt · Fedlex-Frische-Lauf Mo 21.9. 04:43 UTC prüfen (eröffnet er seinen PR selbst?). Kein `verified` gesetzt.

## Session 19.9.2026 (3) — `QS-MONITOR-ROT`: rectifies-Tor Runde 2 + wartende Automatik-PRs (5 PRs gelandet, Risikopfad)

- Schritt `QS-MONITOR-ROT` (`feld: korpus`), zurück auf `status: ready` (Unterpunkte offen). **Gelandet:** #913 `135ec0cba` (BS-Monatslauf, Identitätsbeleg data.bs.ch) · #925 `95cb5a712` (Merge-Schutz liest Verdikt aus dem Queue-Squash — Wurzel: GitHub bricht den PR-Body bei 72 Zeichen um und hängt den Co-author-Absatz an; erster Risikopfad-PR in der Queue, #921, war daran gescheitert, Lauf 35449385978; Echt-Beleg grün: `merge_group` 35455945280) · #921 `2db154675` (Curia-/Materialien-Teilkaskade, BS-Sortier-Wächter) · #926 `c9e2e32cb` (rectifies-Tor Runde 2).
- **Nachtrag gleicher Abend:** #909 `6de24c805` gelandet (Fedlex-Frische 2026-09-18, von Hand nach Opus-Nach-Verdikt «bestanden» 24/24 + Delta-Prüfung; fiel einmal als UNMERGEABLE aus der Queue — Stapelkonflikt Register/Manifest mit #923 —, danach einzeln eingereiht) · #930 Dependabot knip.
- **Offen:** #934 Entwurf (Curia-Monatslauf, wartet auf Gegenprüfung, Ablauf 1.10.2026).
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

*Archiviert 24.9.2026 — Wortlaut: [`archiv/STRUKTUR-ZUSTAND-2026-06.md`](archiv/STRUKTUR-ZUSTAND-2026-06.md) (jüngste Zeile 7.6.2026, nicht gegen den Code verifiziert). Ist-Zustand heute: [`docs/INVENTAR-FUNKTIONEN.md`](docs/INVENTAR-FUNKTIONEN.md) (#975, 22.9.2026).*

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

*Archiviert 24.9.2026 — Wortlaut: [`archiv/STRUKTUR-ZUSTAND-2026-06.md`](archiv/STRUKTUR-ZUSTAND-2026-06.md) (jüngste Zeile 14.8.2026, nicht gegen den Code verifiziert). Ist-Zustand heute: [`docs/INVENTAR-FUNKTIONEN.md`](docs/INVENTAR-FUNKTIONEN.md) (#975, 22.9.2026).*

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

*Archiviert 24.9.2026 — Wortlaut: [`archiv/STRUKTUR-ZUSTAND-2026-06.md`](archiv/STRUKTUR-ZUSTAND-2026-06.md) (jüngste Zeile 5.6.2026, nicht gegen den Code verifiziert). Ist-Zustand heute: [`docs/INVENTAR-FUNKTIONEN.md`](docs/INVENTAR-FUNKTIONEN.md) (#975, 22.9.2026).*

## PDF-Rechenbericht (src/lib/pdf/)

*Archiviert 24.9.2026 — Wortlaut: [`archiv/STRUKTUR-ZUSTAND-2026-06.md`](archiv/STRUKTUR-ZUSTAND-2026-06.md) (jüngste Zeile 6.6.2026, nicht gegen den Code verifiziert). Ist-Zustand heute: [`docs/INVENTAR-FUNKTIONEN.md`](docs/INVENTAR-FUNKTIONEN.md) (#975, 22.9.2026).*

## Oberste Ebene: vier Output-Typen

| Sektion (`art`) | Inhalt |
|---|---|
| Fristen (`frist`) | Prozessuale und materielle Fristen |
| Beträge & Quoten (`betrag`) | Geldansprüche, Zinsen, Kosten, Quoten |
| Zuständigkeit & Einordnung (`zuordnung`) | Gericht, Recht, Verfahrensart |
| Werkzeuge (`werkzeug`) | Rechtsgebietsübergreifende Hilfsrechner |

## Grossausbau 5./6.6.2026 — Zuständigkeits-Plattform (Kurzkarte)

*Archiviert 24.9.2026 — Wortlaut: [`archiv/STRUKTUR-ZUSTAND-2026-06.md`](archiv/STRUKTUR-ZUSTAND-2026-06.md) (jüngste Zeile 6.6.2026, nicht gegen den Code verifiziert). Ist-Zustand heute: [`docs/INVENTAR-FUNKTIONEN.md`](docs/INVENTAR-FUNKTIONEN.md) (#975, 22.9.2026).*

## Offene Punkte (nächste Session)

*Archiviert 24.9.2026 — Wortlaut: [`archiv/STRUKTUR-ZUSTAND-2026-06.md`](archiv/STRUKTUR-ZUSTAND-2026-06.md) (jüngste Zeile 7.6.2026, nicht gegen den Code verifiziert). Ist-Zustand heute: [`docs/INVENTAR-FUNKTIONEN.md`](docs/INVENTAR-FUNKTIONEN.md) (#975, 22.9.2026).*

## Backlog (bewusst NICHT gerendert)

Aufnahme nur bei klar regelbasiertem, deterministischem Umfang — sonst
Widerspruch zu «feste Rechenregeln, keine Schätzung»: Konsumkredit-Widerruf
(Anwendungsbereich klären) · Schadenersatz/Genugtuung · Unterhalt ·
Tagessatz · Mietzinsherabsetzung · Konkurrenzverbot (alle wertend/Ermessen).
