---
name: lehren
description: Verwenden, wenn etwas schiefgegangen ist und die Lehre daraus bleiben soll — Trigger «das ist schon wieder passiert», «warum haben wir das nicht gemerkt», «Lehre festhalten», «Postmortem», «das darf nicht nochmal passieren» — oder wenn beim Bau ein wiederkehrendes Fehlermuster auffällt. AUCH verwenden bei §17-Prozessarbeit — ein CI-/Merge-/Doku-/Werkzeug-Prozess soll an der Wurzel behoben, verschlankt, gelöscht oder automatisiert werden: dafür die Fünf-Schritte-Reihenfolge hier. Enthält das F1–F9-Register und die Formregel für neue Lehren.
---

# Lehren — belegte Fehlerklassen und wo ihr Gegenmittel sitzt

**Zweck:** Lehren aus Vorfällen lagen früher ausserhalb des Repos (Memory) —
unversioniert, für Sub-Agenten unsichtbar. Dieses Register liegt im Repo und
kostet im Normalbetrieb nur seine Description.

## Die Formregel (wichtiger als jede einzelne Lehre)

> **Eine Regel kostet dort am wenigsten, wo sie am spätesten gelesen wird.**

`CLAUDE.md` wird bei **jedem** Dispatch geladen (nach dem A4-Umzug 25.7.2026
~2 500 Token statt ~7 200 — der Hebel wird dadurch kleiner, nicht gegenstandslos).
Eine Zeile dort kostet bei jeder delegierten Einheit. Reihenfolge der Wahl:

| Form | Kosten je Dispatch | Wählen, wenn |
|---|---|---|
| **Tor / Hook** | 0 Token | die Regel maschinell prüfbar ist — **immer erste Wahl** |
| **Dispatch-§0** | ~150 Tok, nur im Auftrag | die Regel den Sub-Agenten erreichen muss, bevor er arbeitet |
| **Skill** | nur die Description | die Regel situativ gilt (Landung, Gegenprüfung, Postmortem) |
| **CLAUDE.md** | volle Kosten, immer | letzte Wahl — nur wenn nicht maschinalisierbar und immer gültig |

Das Design-Reglement sagt das selbst (`DESIGN-REGLEMENT.md` E1, früher zitiert
als `CLAUDE.md` §13 Ziff. 6): maschinell prüfbare Regeln gehören in ESLint/Tests,
nicht ins .md. **Netto-Prosa-Zuwachs ist zu begründen.**

Und: **ein Tor ist erst ein Tor, wenn es einmal rot war.** Wer eines baut, zeigt
den Sabotage-Beweis (§6.7 — Skill `refactoring`, Ziff. 7).

### Formregel-Ergänzung: Fremdagenten (QS-FREMDAGENTEN, 4.9.2026)

Jede **Ablehnung eines Fremd-PRs** (Jules geschlossen, nie gemergt) und jede
**Schein-Klasse des Diskrepanz-Finders** (Gemini-Fund als Schein protokolliert)
wird in DERSELBEN Session nach der Formregel oben verankert — als Tor-Regel
(Fremd-PR-Tor/Erstfilter) oder als Vorlagen-Zeile —, **nie nur als Kommentar**
im Fahrplan-Register. Belege, dass das wirkt: der Assertion-Diff aus T5 (PR
#638, `scripts/analyse/test-assertion-diff.ts`), die Kommentar-Bilanz aus
#662 (Fremd-PR-Tor Regel 3), die Label-/Tabellen-Regeln aus #650
(deterministischer Erstfilter). Stufe 2 (`retro:17`) trägt seit demselben
Auftrag einen Erinnerungs-Vorschlag: jeder in den letzten 7 Tagen
geschlossene Jules-PR erzeugt eine ENTWURF-Zeile «Lehre verankern» — sie
ersetzt die Formregel nicht, sie erinnert nur daran, wenn sie vergessen ginge.

## Register der belegten Fehlerklassen (Vorfälle seit 18.7.2026)

| # | Klasse | Was passierte | Gegenmittel — wo es sitzt |
|---|---|---|---|
| **F1** | Merge vor Prüfung | PR #309: 11 erfundene Amtsträger:innen ~1 h auf prod. Die Merge-Erlaubnis stand im **Bau**-Auftrag; der Agent hat korrekt befolgt, was dastand. | `tor-schutz.py` blockiert `gh pr merge` → `check:merge-schutz` (committeter Bereich, nicht Working Tree). Prosa hätte es NICHT verhindert. <!-- @wiedervorlage: 2027-03-15 --> |
| **F2a** | Tor validiert sich selbst | Wächter prüfte gegen die eigene Sync-Marke statt gegen eine unabhängige Grösse. | Wächter gegen **unabhängige** Referenz (erwartete Zeilenzahl aus dem Manifest). <!-- @wiedervorlage: 2027-03-15 --> |
| **F2b** | Tor läuft in CI gar nicht | `check:seriell` fährt 36 Tore, CI 11. Lokal grün sagte nichts über CI, und CI konnte das strukturell nie melden. | `check:tor-paritaet` — Listenvergleich mit begründeter Allowlist. Friert die Lücke ein: sie kann nur kleiner werden. <!-- @wiedervorlage: 2027-03-15 --> |
| **F2c** | `cancelled` gilt als «nicht rot» | 5 stumm abgebrochene `turso-sync`-Läufe, Suchindex veraltete unbemerkt. | `landung`-Skill Schritt 5: `cancelled`/`skipped` **zählen als rot**. <!-- @wiedervorlage: 2027-03-15 --> |
| **F2d** | Beleg = Substring | `ft.includes(nachSlug)`: «ott» galt als belegt durch «rottenberg». | `istWortTreffer()` in `check-besetzung.ts` — Segment-exakte Identität. <!-- @wiedervorlage: 2027-03-15 --> |
| **F2e** | Tor kann strukturell nie grün werden | Wächter (`check:ci-laeufe`) zählte sich selbst mit: einmal rot ⇒ eigener jüngster Lauf rot ⇒ für immer rot. 15/15 Läufe seit Anlage 20.7.2026 rot, niemand fand «rot» noch bedeutsam — genau die stillen Ausfälle, die er melden sollte (turso, Normen-Monitor), blieben unsichtbar. Spiegelbild von §6.7: ein Tor, das nicht grün werden KANN, ist so wertlos wie eines, das nicht rot werden kann. | Selbstausschluss im Wächter (Fix 3.8.2026, PR #419) + §6.7-Erweiterung: ein neues Tor zeigt man einmal rot UND einmal grün, bevor man ihm glaubt. <!-- @wiedervorlage: 2027-08-03 --> |
| **F2f** | Tor prüft Container, nicht Inhalt | Bauplan-Review 4./5.8.2026: `check:plan` prüfte je `fahrplan:`-Verweis nur die Datei-Existenz — 3 §-Anker zeigten auf falsche/tote §§ (u. a. ein Risikopfad-Schritt auf eine fremde Spec), 2 weitere fand erst das neue Tor, 2 erzeugte der Fix selbst. Die Klasse «Anker löst auf, trifft aber das Falsche» ist für Existenz-Checks unsichtbar. | `check:plan` Regel 11 «Spec-Bindung» (`scripts/plan/specBindung.ts`): Anker muss als Überschrift auflösen UND der §-Abschnitt muss die Schritt-ID tragen; begründete Allowlist, Geburtsbeweis rot auf `d316f5884`. <!-- @wiedervorlage: 2027-08-05 --> |
| **F2h** | Wächter wartet stumm auf einen Zustand, der nie kommt | 15./16.8.2026: Landeketten-Wächter merged Risikopfad-PRs nur bei `mergeStateStatus: CLEAN`; nach Davids Branch-Schutz-Edit standen sie auf `UNSTABLE` (nicht-required Vercel-Kontext rot, alle 11 Required grün) — 7 h kein Merge (17:24→00:33), zwei weitere PRs `DIRTY` (Konflikt), ebenfalls stumm. Erst Davids Nachfrage brachte es ans Licht. Spiegelbild von F2e: ein Wächter, der auf «CLEAN» wartet, wo «alle Required grün» das echte Kriterium ist, ist so wertlos wie einer, der nie grün wird. | Ein Wächter, der länger als 2 Runden ohne Zustandsänderung wartet, **meldet den Stillstand mit Grund** (welcher PR, welcher Status, was fehlt) statt weiterzuschlafen; Merge-Kriterium ist die Required-Liste (`gh api …/protection/required_status_checks`), nie ein GitHub-Sammelstatus; `DIRTY`/`UNKNOWN`-Dauerzustände sind Meldungen, keine Wartezustände. Orchestrator-Seite: `bauschritt` Station D — bei Wächter-Stille >30 min selbst nachsehen. <!-- @wiedervorlage: 2027-02-16 --> |
| **F2g** | Tor rot ohne Defekt (Render-Timing) | 15.8.2026: `qsui-hierarchie.e2e.ts` kippte 3–6/65 unter Last — `.lc-route` blendet ab opacity:0 ein, `checkVisibility({opacityProperty:true})` auf dem Null-Frame ist für jeden Nachfahren false; wechselnde Routen, kein Produktfehler. Ein rotes Tor ohne Defekt ist die §17-Klasse «umschiffter CI-Defekt». | e2e-Specs, die Sichtbarkeit/Geometrie messen, setzen `page.emulateMedia({reducedMotion:'reduce'})` im `beforeEach` (index.css schaltet Animationen ab; Haus-Muster a11y/hist-ansicht/rechtsprechung-richter) — nie `waitForTimeout`. Beweis: 2× 65/65 unter workers=16. <!-- @wiedervorlage: 2027-08-15 --> |
| **F3** | Diagnose ohne Verteilung | 4× an einem Tag wurde Messrauschen als Feature-Regression gedeutet; Reruns = ~72 % der CI-Wanduhr. **2. Vorfall 8./9.8.2026 TROTZ §0.3 (a33-Flake):** ein Bau-Agent schloss aus 5/5 grün auf Kausalität (reale Rate ~15 % ⇒ 5/5 ist Glück) und fuhr die Nullprobe erst nach vier widerlegten Hypothesen; derselbe Stand mass kalt 2–4/20 rot, warm 0/40 — die Messbedingung war der grössere Fund. | Dispatch §0 Ziff. 3, **eskaliert 9.8.2026**: (a) Nullprobe am ANFANG der Diagnose (Re-Run auf unverändertem Stand oder reiner Doku-Diff — `ci.yml` klassifiziert seit der CI-Härtung 3.8.2026 selbst) + (b) Streuung gegen den Schwellenabstand + (c) Stichprobe gegen die vermutete Rate dimensionieren und die Messbedingung (kalt/warm, Parallel-Last) mitnennen — eine Rate ohne Bedingung ist keine Zahl. <!-- @wiedervorlage: 2027-02-09 --> |
| **F4** | Bericht als Wahrheit | 1× fabrizierter Erfolgsbericht bei 0 Tool-Calls; 1× Injection-Versuch. | `CLAUDE.md` §14 Ziff. 7 (Orchestrator) **+** Dispatch §0 Ziff. 1 (Sub-Agent). Bewusste Doppelablage: Sub-Agenten sehen `CLAUDE.md` nicht. <!-- @wiedervorlage: 2027-03-15 --> |
| **F5** | Verlorene Agenten-Arbeit | ~6 Agenten-Tode, einmal ~2 h fast verloren. **2. Form 15.8.2026 (Wartetod):** ein `lex-daten`-Agent spawnte selbst eine Gegenprüfung und wartete 5 h auf deren Verdikt — Sub-Agenten können keine Nachrichten empfangen, das Verdikt landete beim Orchestrator; die fertige Arbeit lag uncommittet im Worktree. | Dispatch §0 Ziff. 4: WIP-Commit nach jedem Teilschritt. Muss den Agenten erreichen, **bevor** er stirbt — ein toter Agent liest nichts nach. **Wartetod:** Sub-Agenten spawnen nie etwas, auf dessen Antwort sie warten müssten — Gegenprüfung ist Orchestrator-Sache (`lex-daten.md` RISIKOPFAD-Zeile, Skill `auftrag` Ziff. 6); der Orchestrator prüft bei >2 h Stille den Worktree (`git status`) statt zu warten. **3. Vorfall 31.8.2026 (Wartetod trotz §0.4):** lex-daten-Agent stoppte «wartend» auf seinen eigenen Hintergrund-Crawl; Weckruf des Orchestrators nötig. **Eskaliert** nach Regel 5: KEIN-WARTE-STOPP-Zeile jetzt in den generierten Agent-Definitionen (dispatch-agents.ts, liest jeder Agent). <!-- @wiedervorlage: 2027-02-28 --> |
| **F6** | Doppelarbeit | 2 Sessions bauten denselben CLS-Fix in `SuchResultate.tsx`. **2. Vorfall 28.7.2026 TROTZ §0.5:** `W2·6-NKEY` doppelt gebaut (#397 gemergt, #398 verworfen — ein voller Opus-Bau entsorgt). Die PR-Sonde war blind (Parallel-PR noch nicht offen), der Remote-Branch `worktree-w26-nkey` der Parallel-Session **war sichtbar**; zudem stand der Schritt nie auf `wip`. | Dispatch §0 Ziff. 5, **eskaliert 28.7.2026** (Regel 5): drei Sonden statt einer — PR-Liste + `git ls-remote --heads origin` + `git worktree list` — und Früh-Push des eigenen Branchs. Orchestrator-Seite: Skill `auftrag` Ziff. 2 (@meta `wip` **vor** Baubeginn setzen und pushen). **Eskalation 5.8.2026** (Spiegel-Fall: wip überlebt das Session-Ende — QS-TOK/QS-TOK-AUFRAEUMEN standen nach gelandetem Bau stundenlang «im Bau»): `plan:next` warnt maschinell bei wip ohne Bau-Spur (Branch/Worktree/PR), Landung-Skill Schritt 9 schliesst den Status vor Session-Ende. <!-- @wiedervorlage: 2027-08-05 --> |
| **F7** | Zustands-Spiegel nur vorwärts getestet | 7.8.2026 (W2·10-UI-NAV-S): die neue `?q=`-URL-Spiegelung wurde nur vorwärts getestet (tippen → Adresse → Reload); die Gegenprüfung fand per History-Back einen deterministischen Verlust — die Echo-Merkung des Spiegels verfiel nie, ein Back wurde als eigenes Echo missdeutet und binnen 300 ms wieder überschrieben. | Wer eine Zustands↔URL-Spiegelung baut, testet auch **rückwärts** (Back/Forward, geteilte URL, Reload mitten im Debounce), nicht nur vorwärts. Wiederverwendbares Gegenmittel im Code: `src/components/suche/useSucheAusUrl.ts` (reine Übergangsfunktionen, Echo-Merkung verfällt nach genau einem Konsum) samt Unit-Kontrakt + e2e-Back-Szenario — neue Spiegelungen docken dort an statt eigene Merkung zu erfinden (§5). <!-- @wiedervorlage: 2027-08-07 --> |

| **F8** | Beleg ans Tor angepasst | 29.8.2026 (Intl-Routing, 3. Prüf-Durchgang M7/M8): ZWEI datierte Reproduktions-Kommentare wurden beim Bau auf die neue Adresse «nachgeführt» — und damit falsch (die Adresse existierte am Belegdatum nicht; einer widersprach der Chronik derselben Änderung). Auslöser war ein neues Kanonik-Tor, das die Kommentare gar nicht las — der Beleg wurde dem Tor geopfert, nicht der Wahrheit. | Dispatch-§0 Ziff. 7 (agents-Defs + dispatch-template, 29.8.2026): **Datierte Repro-/Messbelege werden nie nachgeführt, nur ergänzt** («damals /gesetze/bund/EMRK; seit Befund 45 kanonisch …»). Heilung in Ergänzungs-Form belegt (Commit im Intl-PR). <!-- @wiedervorlage: 2027-02-28 --> |
| **F9** | Stand-Leser nimmt Zukunft | 29.8.2026 (Frische-GP B1/B5): `leseTiStand` nahm das MAXIMUM aller «in vigore dal»-Daten der Quellseite — inkl. des Ankündigungs-Abschnitts «PROSSIME VARIAZIONI» → TI-181 bekam stand 1.1.2027 (16 Monate Zukunft) in den Grundbuchtarif-Risikopfad; gleiche Klasse vorbestehend: SZ-213.512 (2027-02-01). Dazu B2: der Zuklapp-Link «chiudi -» des neuen Seitenabschnitts landete als Normtext. | **Tor** `stand ≤ heute` über alle Snapshots (Frische-Fix-PR, rot gezeigt an TI+SZ) + Adapter-Wurzelfix (künftige Daten/Ankündigungs-Abschnitte beim Stand-Lesen ausgeschlossen, UI-Chrome-Filter). <!-- @wiedervorlage: 2027-08-29 --> |

**F2-Verschärfungen (29.8.2026, dritter und vierter Beleg der Familie):**
(i) *Retry-/Abschneide-Maskierung:* Playwright-`retries:2` + `maxFailures`
verdeckten, dass der ⌘K-Wächter seit ≥16.8. auf ALLEN Branches im Erstversuch
rot ist (69/69) und dass ein neues Tor (topbar-320) in seiner Shard-Gruppe NIE
lief («10 did not run») — beide Funde erst durch Hand-Forensik. Gegenmittel wie
F2b/F2e: Erstversuchs-Rot und nicht-gelaufene Specs sind Meldungen; Diagnose-
Posten im Fehlerbuch, Retry-Politik ist David-Entscheid.
(ii) *Automatik prüft Teilmenge:* der Fedlex-Frische-Lauf fuhr 5 handverlesene
Offline-Tore statt des Gates — drei Regressionen (Zähler/Revisionen/PDF-Quellen)
liefen durch, und der verschärfte Merge-Schutz (574 Risiko-Dateien ohne Verdikt)
blockierte drei Wochen-PRs in Folge still. Gegenmittel: Workflow auf Gate-Lauf
(Frische-Fix-PR); die Auto-Merge-Politik auf Risikopfaden (Verdikt-Pflicht vs.
David-Rahmen 16.7.) wartet auf David.

**F10 — Bauer bescheinigt sich selbst (2.9.2026, PR #616).** Ein Bau-Agent
schrieb seine eigene Gegenprüfungs-Quittung ins Register, der Merge-Schutz war
grün, die echte Prüfung fand vier Auflagen. Gegenmittel: Verbot wörtlich in
`lex-bau.md`/`lex-daten.md` (QUITTUNG) und Skill `gegenpruefung` Regel 5; der
Orchestrator prüft vor jeder Landung, ob die Register-Zeile vom Prüfer stammt. <!-- @wiedervorlage: 2027-03-02 -->
**F11 — Prüfen gegen ein altes Bundle (2.9.2026, dreimal an einem Tag).**
`test:e2e` startete `vite preview` ohne Build, `preview_start` lief mit cwd im
geteilten Haupt-Checkout statt im Worktree, eine Perf-Sonde lief neben der
e2e-Suite: je Falsch-Rot bzw. Falsch-Grün. Gegenmittel: Playwright-`webServer`
baut vor dem Preview (Wurzel-Fix), Skill `auftrag` Ziff. 6 (Preview nur aus
Worktree-cwd, Scratchpad-Dateien agent-eindeutig, lange Läufe als persistenter
Monitor), Skill `perf` Bauregel 7. <!-- @wiedervorlage: 2027-03-02 -->
**F12 — Doku-Klassierung überspringt das Tor, das die Drift fangen müsste
(2.9.2026, PR #619 → #621/#622 rot).** Ein Hand-Edit generierter Agenten-
definitionen lief als «doku» ohne Tore-Job durch; erst fremde PRs wurden an
`check:dispatch-klausel` rot. Gegenmittel: `.claude/agents/**`,
`scripts/dispatch.ts`, Dispatch-Template zählen in der Diff-Klassierung als
«werkzeug» (PR der Parallel-Session lexmetrik-a1); Quelle ändern, nie die
Projektion (§5; Wurzel-Fix PR #624). <!-- @wiedervorlage: 2027-09-02 -->
**F13 — Merge-Lauf auf main endete «cancelled», Merge nie live (2.9.2026, #629).**
Beobachtung: `gh run list` zeigte den CI-Lauf des Squash-Commits 1123b1974 als
`cancelled`, ~30 s nachdem ein Doku-Push (9cdbb6a55) auf main folgte; der
Doku-Lauf überspringt den Deploy-Job → Live-Build blieb auf dem Vorgänger
(Sidecar 404), erst `gh run rerun` heilte. **Ursache offen:** ci.yml hat seit
26.7.2026 `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}` — die
Concurrency kann es nicht gewesen sein (Mechanik-Agent 2.9., Reproduktion
negativ). Kandidaten: ein Selbst-Cancel-Schritt im Workflow bei bewegtem HEAD,
oder ein GitHub-seitiger Abbruch. ROADMAP-Zeile unter `QS-AUTOMATIK` (Ursache
klären, Rot-Beweis). Bis dahin Regel Skill `landung` Nachkontrolle 0: nach
einem Code-Merge kein weiterer main-Push, bis der Deploy-Job grün ist. <!-- @wiedervorlage: 2027-03-02 -->
**F14 — Additiver Refresh überschreibt gute Bestandsdaten statt sie zu mergen
(12.9.2026, PR #816, Delta-Prüfung).** Der B1-Zweig von `--regeste-refresh`
(`scripts/normtext-entscheide.ts`) übernahm ein frisch geholtes Auszug-only-
Ergebnis vollständig — bei 6 von 1259 amtlichen BGE verschwand dabei über
zwei additive Nachpflege-Läufe (5.7./28.7.2026) die bereits vorhandene
`regeste.sprachfassungen`, unbemerkt, weil kein Tor die Regeste-Vollständigkeit
prüfte; gefangen hat es erst die Gegenprüfung, nicht der Bau. Gegenmittel
(Tor, bereits gebaut): `mergeB1Ergebnis()` (`scripts/normtext/entscheide-b1-
merge.ts`) übernimmt additive Bestandsfelder aus dem Altwert, wenn das frische
Ergebnis keine trägt und der flache Regeste-Text unverändert ist; neuer Ast in
`check:entscheide` — amtlicher BGE mit Regeste ohne `sprachfassungen` ⇒ FEHLER
(dokumentierte Ausnahme `bge_149_IV_1`). Regel: ein Auszug-only-Refresh MERGT
additive Bestandsfelder, ersetzt sie nie blind. <!-- @wiedervorlage: 2027-09-12 -->

**F15 — Sperre/Wächter ohne Nullprobe gegen die reale Korpus-/CI-Lage blockiert
Nachtläufe, statt sie zu schützen (12.9.2026, drei Fälle an einem Tag).** Ein
neuer Sperren-Mechanismus wurde je gegen den GEDACHTEN, nicht den tatsächlichen
Bestand entworfen: #815 (A4) verlangte im Kanten-Soll auch Kanten bereits
ENTLISTETER Dokumente und brach beim nächsten legitimen Entlistungslauf mit
«unvollständig» ab — der einzige Reparaturweg (Generator laufen lassen) war
damit blockiert; #818 (B1) feuerte die erste Bestandszahl-Sperren-Fassung auf
dem unveränderten, VOLLSTÄNDIGEN Korpus, weil `altManifest.entscheide.length`
abgeleitete `__voll`-Verweis-Einträge mitzählte, `auswahl.length` aber nicht;
#824 (C1/D1) nahm einen `/tmp`-HTML-Cache als gegeben an — in der CI-Umgebung
ohne diesen Cache lief das Tor unbemerkt GRÜN durch, statt den fehlenden Fetch
zu melden (Spiegelbild von F2e/F2h: eine Schranke, die nie gegen den eigenen
Nullfall — intakter Bestand, cache-lose CI — gegengeprüft wurde, ist so
gefährlich wie eine, die nie greift). Gegenmittel: Dispatch-§0 Regel 3(a)
(Nullprobe an den ANFANG jeder Sperren-Diagnose) gilt genauso beim BAU einer
neuen Sperre — vor dem ersten Commit einmal gegen den unveränderten,
vollständigen Bestand UND gegen die tatsächliche CI-Umgebung (ohne lokale
Caches) laufen lassen, nicht nur gegen die Fehlerkonstruktion, die den Bau
auslöste. <!-- @wiedervorlage: 2027-03-12 -->

**F16 — Marker-Semantik aus einem einzelnen RDF-Tripel als Tatsachenbehauptung
formuliert, statt als Wiedergabe (12.9.2026, PR #827, 3 Prüfrunden Opus).** Ein neuer
§8-Marker (`berichtigung-fremdes-as-dokument` für `jolux:rectifies`-Kanten) behauptete
in Runde 1 einen «Fedlex-internen Widerspruch» — amtlich falsifiziert: `jolux:rectifies`
benennt das AS-Dokument der Erstpublikation (Anhangs-Änderung), `classifiedByTaxonomyEntry`
den betroffenen SR-Erlass; zwei verschiedene Aussagen, kein Widerspruch. Runde 2 fand in
derselben Marker-Klasse einen echten Fehler: der Provenienz-Satz «erstpubliziert» bei
AS 2025 686/SKV war falsch, das `rectifies`-Ziel zeigte auf AS 2025 648 statt der
amtlichen 644 — ein Fedlex-Datenfehler, keine Extraktionslücke. Erst Runde 3 bestand: der
Marker-Text gibt nur noch das Tripel wieder (Fremd-SR + Fundstelle), ohne Deutung.
Gegenmittel: **Prüfer-Regel** — ein Marker-/Beleg-Text aus einem einzelnen RDF-Tripel
steht im Konjunktiv oder als reine Wiedergabe, nie als Behauptung, wenn das Tripel die
Aussage selbst nicht trägt.

**Zweiter Beleg (12.9.2026, PR #834, Netz-Arm `check:revisionen-rectifies`):** Vollerhebung
von 25 `rectifies`-Kanten fand einen zweiten echten Fedlex-Datenfehler — AIG `oc/2025/342` —
neben dem in Runde 2 gefundenen SKV-Fall. Beide Ausnahmen liegen als Muster in
`bibliothek/normtext/rectifies-ausnahmen.json`, jede an ihr erwartetes Ziel gebunden: weicht
der amtliche Wert künftig ab, wird der Wächter rot (Stale-Bindung) statt die Ausnahme
stillschweigend weiter zu tragen — dieselbe Prüfer-Regel, jetzt auch als Tor-Muster. <!-- @wiedervorlage: 2027-09-12 -->

**F17 — Gebaut, nie gebucht: der Vollzug landet im Fahrplan, die ROADMAP-Checkbox
bleibt offen (15.9.2026, `W2·5m-LESER-V3`, vier Posten, vier Wochen).** Die
Bereinigung der Leser-V3-Checkliste ergab: **alle vier offenen Posten waren gebaut**
— D0 (#534, 16.8.), S1 (#547) und S2 (#550, beide 17.8.), Kantons-Probe (#552, 18.8.).
Vier verschiedene Wege in denselben Zustand, jeder für sich harmlos: **#534** hakte die
Zeile ab, aber die andere — `DESIGN-D0` stand doppelt im Plan (§5), die Kopie unter dem
Leser-Dach blieb stehen. **#547** fasste ROADMAP.md an, aber nur um drei NEUE §17-Funde
einzutragen; die eigene Checkbox blieb unberührt. **#550** fasste ROADMAP.md gar nicht an
und schrieb «✅ gebaut» nur in den Fahrplan — zwei Wahrheiten, kein Tor las beide. **#539**
meldete die S4-Begriffskollision ausdrücklich und verwies sie ans «nächste Plan-Aufräumen»;
dieses (#577, Steuerungs-Diät 29.8.) **löschte den Warn-Absatz beim Verdichten, ohne den
darin hinterlegten Auftrag auszuführen**. Muster: eine Bau-Session führt zuverlässig, was
ihr im Weg steht — die eigene Checkbox ist das Einzige, was nicht stört, wenn es
stehenbleibt; und ein Doku-Aufräumen nach Zeichenzahl entfernt Warn-Absätze zuverlässiger,
als es die darin hinterlegten Aufträge ausführt. Schaden: keine Doppelarbeit belegt, aber
vier Wochen falsche Steuerung — `plan:next` und jeder Lagebild-Bau-Prompt lasen «offen».
**Gegenmittel (Tor, nicht Prosa): `check:plan` Regel 14** — trägt eine eingerückte
Checklisten-Zeile eine Etappen-Kennung und markiert der per `fahrplan:` verlinkte Fahrplan
dieselbe Kennung mit ✅/«VOLLZOGEN», ist die offene Checkbox rot
(`scripts/plan/etappenBuchung.ts`, `src/tests/plan-check.etappen-buchung.test.ts`).
Geburtsbeweis §6.7: rot auf `e94a3dc90` mit exakt den zwei vorhergesagten Treffern (S2, S4),
grün nach der Bereinigung, dazu 9 Vitest-Fälle inkl. Rot-Fall — damit bleibt die Regel
prüfbar, wenn die reale ROADMAP längst sauber ist (F2e). **Deklarierte Richtungs-Grenze:**
die Regel prüft nur «Fahrplan sagt fertig, Plan sagt offen». Die Gegenrichtung ist
Normalfall, nicht Defekt; und einen Vollzug, den WEDER Fahrplan noch ROADMAP notiert (D0,
S1 fand die Regel nicht), fängt sie nicht — sie ist eine Untergrenze, kein
Vollständigkeitsbeweis. <!-- @wiedervorlage: 2027-09-15 -->

## Eine neue Lehre ablegen

1. **Klasse bestimmen.** Fällt der Vorfall unter F1–F6? Dann dort das Gegenmittel
   verschärfen — **keine neue Regel danebenlegen**.
2. **Form wählen** nach der Tabelle oben. Maschinell schlägt Prosa, immer.
3. **Beim Tor: Sabotage-Beweis zeigen** (einmal rot).
4. **Neue Klasse** nur, wenn sie wirklich neu ist — mit Beleg (PR-Nr., Datum,
   Schaden). Eine Klasse ohne Vorfall ist eine Vermutung, keine Lehre.
5. **Zweimal aufgetreten trotz Gegenmittel** ⇒ das Gegenmittel greift nicht;
   Form eskalieren (Prosa → Dispatch → Tor).
6. **Wiedervorlage setzen.** Jede neue Lehre trägt hinter ihrer Überschrift
   `<!-- @wiedervorlage: YYYY-MM-DD -->` — Datum-Regel und Wächter:
   `scripts/check-regel-wiedervorlage.ts` (`npm run check:regel-wiedervorlage`).

## §17-Gegengewicht — Rückbau gehört dazu (Auftrag David 13.8.2026)

*Wortlaut wörtlich aus CLAUDE.md §17 hierher verschoben (Token-Diät 30.8.2026 —
CLAUDE.md lädt bei jedem Dispatch, diese Sätze braucht nur, wer §17-Arbeit tut;
in CLAUDE.md steht die Kurzform mit Zeiger. Einzige Anpassung am Wortlaut:
«, Inventar» in Satz 4 gestrichen — den Inventar-Mechanismus gibt es seit dem
Plan-Neuschnitt 29.8.2026 nicht mehr).*

Die §17-Regel erzeugt nur Zuwachs; nichts verlangte je das Entfernen, und so
wuchs die Steuerung schneller als das Produkt. Vier Sätze, die in derselben
Session mitlaufen: (1) Wer etwas hinzufügt, ersetzt zuerst die Stelle, die
dieselbe Sorge schon trägt — oder sagt im Anlass-Satz, dass es keine gibt.
(2) Was nicht scheitern kann, wird **gestrichen statt bewacht** (Präzedenz:
`seq-hart`, drei Vorkommen, null Auswertung) — das gilt ausdrücklich auch für
den TESTAPPARAT (Auftrag David 14.8.2026): Tests und Tore, die weder
Rechtslogik noch Rechtsdaten decken und nachweislich nie etwas gefangen haben,
unterliegen demselben Rückbau (Beweis nach Streich-Massstab,
`bauschritt`/aufraeumen.md); Prüftiefe auf Rechtslogik/Rechtsdaten ist davon
ausgenommen und bleibt. (3) Eine Regel ohne datierten Anlass ist
Rückbau-Kandidat (Chesterton). (4) Der Plan bildet **Kapazität ab, nicht
Absicht**: was den Deckel sprengt, verliert sein Etikett und lebt als
Ideen-Liste ohne `@meta` und Tor weiter. Bei Konflikt gewinnt der Rückbau —
ausser die Stelle hat einen datierten Vorfall verhindert. §1 bleibt unberührt.

## §17-Prozessarbeit: die Fünf-Schritte-Reihenfolge

*Herkunft: zugeschnitten aus `malkreide/musk-algorithm-skill` (Hayal Oezkan,
Stadt Zürich, MIT-Lizenz; gesichtet 4.8.2026). Entscheid David 4.8.2026: kein
eigener Skill, nur dieser Anhang — übernommen sind Reihenfolge und Leitplanken,
nicht das Original-Protokoll.*

**Geltungsbereich — nur Prozess, nie Produkt:** CI/Tore, Merge- und
Plan-Prozesse, Steuer-Doku, Werkstatt-Scripts. **Nicht anwendbar** auf
`src/lib/`-Rechtslogik, Engines und alles unter §1/§4/§6 — dort gilt Skill
`refactoring` (Golden-Beweis), und «lieber 50 Zeilen Duplikat als eine falsche
Abstraktion» schlägt jede Vereinfachungs-Intuition.

Wer nach §17 ein Prozessproblem an der Wurzel behebt, arbeitet in dieser
Reihenfolge. **Sie ist nicht verhandelbar** — insbesondere: nie automatisieren,
was nicht vorher gelöscht, vereinfacht und stabil geworden ist.

1. **Anforderung hinterfragen (Chesterton's Fence).** Erst Provenienz klären:
   wer hat die Regel/das Tor wann, aus welchem Anlass angelegt (Commit, PR,
   Vorfall im Register oben)? Eine Regel, deren Anlass niemand benennen kann,
   ist ein Streichkandidat; eine mit benanntem Anlass fällt erst, wenn der
   Anlass entfallen ist.
2. **Löschen.** Was den Zweck nicht mehr erfüllt, wird entfernt — nicht
   umschifft (§17: Workaround ohne Wurzel-Fix ist ein offener Mangel). git
   macht Löschen reversibel; tot Mitgeschlepptes kostet jede Session.
3. **Vereinfachen.** Erst, was das Löschen überlebt hat — nie einen Schritt
   optimieren, der in Schritt 2 hätte fallen müssen.
4. **Beschleunigen.** Erst nach Stabilisierung, und Tempo-Diagnosen nur mit
   Nullprobe (F3): Streuung messen, bevor einer Änderung etwas zugeschrieben
   wird.
5. **Automatisieren — zuletzt und nur Stabiles.** Ein automatisierter kaputter
   Prozess zementiert den Fehler (F2e: der nie-grüne Wächter lief 15× rot, bis
   «rot» nichts mehr bedeutete). Für neue Tore gilt §6.7: einmal rot UND einmal
   grün zeigen.

## Bewusst NICHT geregelt

Über-Regulierung ist selbst ein Effizienzproblem. Verworfen und warum:

- **Generisches Meta-Tor `check:tore`** — ein statischer Analysator für
  Tor-Semantik wäre heuristisch und erzeugt eine selbst verrottende Allowlist.
  Stattdessen das exakte `check:tor-paritaet`.
- **`fail-closed`-Sweep über alle Tore** — die `existsSync`-Gatter sind
  grösstenteils bewusste, dokumentierte CI/lokal-Zweige; ein pauschaler Umbau
  bräche funktionierende Tore.
- **Claim-Registry `.claude/anspruch.json`** gegen F6 — ein neues Zustandsfile
  ist eine neue Drift-Quelle. *Wiederaufgerollt 28.7.2026 nach dem 2.
  F6-Vorfall (#397/#398), Entscheid bestätigt: die Lücke war nicht fehlender
  Zustand, sondern eine zu enge Sonde. Eskaliert wurde innerhalb der
  Dispatch-Form (drei Sonden + Früh-Push, §0.5) plus wip-Pflicht im Skill
  `auftrag`. Tritt F6 ein DRITTES Mal auf, ist die Registry (oder ein Tor)
  dran.*
- **SessionStart-Injektion von Lehren** — git-zustandsabhängiger
  `additionalContext` ist byte-instabil und zerstört den Prompt-Cache
  (QS-TOK/T19, gemessen bei 95,8 % Cache-Read-Anteil). Nur byte-**konstante**
  SessionStart-Texte; Hooks gehören in PreToolUse/Stop (0 Token bei Grün).
- **ROADMAP-Restrukturierung** — Council-Entscheid 3.7.2026 geprüft und
  getragen: die Befunde sind Inhalts-**Frische**, nicht Architektur; ein
  zweiter autoritativer Artefakt hätte die Drift verdoppelt.
