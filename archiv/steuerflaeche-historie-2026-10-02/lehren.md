# Steuerflächen-Diät 2.10.2026 — Belege aus `.claude/skills/lehren/SKILL.md`

Verschoben 2026-10-02 (QS-DOKU-DIAET, Auftrag David «räum die plan-doku auf», Spec `.claude/notizen/2026-10-02-steuerflaeche-diaet-spec.md`). Quelle: `.claude/skills/lehren/SKILL.md`.
Wortlaut der Passagen unverändert (Byte-Kopie der Spanne); am Ursprungsort bleiben Regel + Zeiger «Archiv §<Label>». Datierte Belege werden hier nie nachgeführt, nur ergänzt (Dispatch-§0 Ziff. 2b).

## §Formregel-Fremdagenten

Stelle: Abschnitt «Formregel-Ergänzung: Fremdagenten», Schluss

Belege, dass das wirkt: der Assertion-Diff aus T5 (PR
#638, `scripts/analyse/test-assertion-diff.ts`), die Kommentar-Bilanz aus
#662 (Fremd-PR-Tor Regel 3), die Label-/Tabellen-Regeln aus #650
(deterministischer Erstfilter). `retro:17` erinnerte daran mit einer ENTWURF-Zeile
je frisch geschlossenem Jules-PR; das entfällt mit dem retro:17-Rückbau
(Entscheid David 20.9.2026) und fiel seit dem Jules-Stopp 14.9.2026 auf
nichts — Nachfolge-Messung `npm run tor:bewaehrung`.

## §F1

Stelle: Register (Spalte «Was passierte») F1

PR #309: 11 erfundene Amtsträger:innen ~1 h auf prod. Die Merge-Erlaubnis stand im **Bau**-Auftrag; der Agent hat korrekt befolgt, was dastand.

## §F2a

Stelle: Register (Spalte «Was passierte») F2a

**2. Beleg 21.9.2026 (PR #960, Curia-Publikationen):** die «Kreuzprobe» zählte dieselben sechs Felder über dieselben Normalisierer wie der geprüfte Dedupe-Schlüssel — dieselbe Entscheidung zweimal; die Gegenprüfung konstruierte drei Fälle, in denen beide Wege denselben Fehler machen, und 11 amtliche Zeilen blieben bei grünem Tor verschmolzen.

## §F2d

Stelle: Register (Spalte «Was passierte») F2d

**2. Beleg 25.9.2026 (Gegenprüfung #1113):** eine Log-Sonde «Gericht X kommt im Log vor» prüfte nur Substring-Präsenz — die npm-Kopfzeile (`> node … --courts=…`) enthält jeden Gerichtscode und erfüllt damit JEDE Sonde, egal ob der Schritt wirklich lief.

## §F2e

Stelle: Register (Spalte «Was passierte») F2e

15/15 Läufe seit Anlage 20.7.2026 rot, niemand fand «rot» noch bedeutsam — genau die stillen Ausfälle, die er melden sollte (turso, Normen-Monitor), blieben unsichtbar.

## §F2f

Stelle: Register (Spalte «Was passierte») F2f

Bauplan-Review 4./5.8.2026: `check:plan` prüfte je `fahrplan:`-Verweis nur die Datei-Existenz — 3 §-Anker zeigten auf falsche/tote §§ (u. a. ein Risikopfad-Schritt auf eine fremde Spec), 2 weitere fand erst das neue Tor, 2 erzeugte der Fix selbst.

## §F2g

Stelle: Register (Spalte «Was passierte») F2g

15.8.2026: `qsui-hierarchie.e2e.ts` kippte 3–6/65 unter Last — `.lc-route` blendet ab opacity:0 ein, `checkVisibility({opacityProperty:true})` auf dem Null-Frame ist für jeden Nachfahren false; wechselnde Routen, kein Produktfehler.

## §F2h

Stelle: Register (Spalte «Was passierte») F2h

15./16.8.2026: Landeketten-Wächter merged Risikopfad-PRs nur bei `mergeStateStatus: CLEAN`; nach Davids Branch-Schutz-Edit standen sie auf `UNSTABLE` (nicht-required Vercel-Kontext rot, alle 11 Required grün) — 7 h kein Merge (17:24→00:33), zwei weitere PRs `DIRTY` (Konflikt), ebenfalls stumm. Erst Davids Nachfrage brachte es ans Licht.

## §F3

Stelle: Register (Spalte «Was passierte») F3

4× an einem Tag wurde Messrauschen als Feature-Regression gedeutet; Reruns = ~72 % der CI-Wanduhr. **2. Vorfall 8./9.8.2026 TROTZ §0.3 (a33-Flake):** ein Bau-Agent schloss aus 5/5 grün auf Kausalität (reale Rate ~15 % ⇒ 5/5 ist Glück) und fuhr die Nullprobe erst nach vier widerlegten Hypothesen; derselbe Stand mass kalt 2–4/20 rot, warm 0/40 — die Messbedingung war der grössere Fund.

## §F4

Stelle: Register (Spalte «Was passierte») F4

**Leise Form 21.9.2026 (PR #960):** ein Bau-Agent übernahm eine Zahl aus der Auftrags-Tabelle («27 wiedergefundene Fundstellen», Summe über neun Geschäfte) in den Titel eines Commits, der nur zwei davon enthielt — belegt waren 13; die übrigen Zahlen derselben Tabelle hatte er nachgemessen, diese nicht. Vor der Landung berichtigt.

## §F5

Stelle: Register (Spalte «Was passierte») F5

**2. Form 15.8.2026 (Wartetod):** ein `lex-daten`-Agent spawnte selbst eine Gegenprüfung und wartete 5 h auf deren Verdikt — Sub-Agenten können keine Nachrichten empfangen, das Verdikt landete beim Orchestrator; die fertige Arbeit lag uncommittet im Worktree.

## §F6

Stelle: Register (Spalte «Was passierte») F6

**2. Vorfall 28.7.2026 TROTZ §0.5:** `W2·6-NKEY` doppelt gebaut (#397 gemergt, #398 verworfen — ein voller Opus-Bau entsorgt). Die PR-Sonde war blind (Parallel-PR noch nicht offen), der Remote-Branch `worktree-w26-nkey` der Parallel-Session **war sichtbar**; zudem stand der Schritt nie auf `wip`.

## §F7

Stelle: Register (Spalte «Was passierte») F7

7.8.2026 (W2·10-UI-NAV-S): die neue `?q=`-URL-Spiegelung wurde nur vorwärts getestet (tippen → Adresse → Reload); die Gegenprüfung fand per History-Back einen deterministischen Verlust — die Echo-Merkung des Spiegels verfiel nie, ein Back wurde als eigenes Echo missdeutet und binnen 300 ms wieder überschrieben.

## §F8

Stelle: Register (Spalte «Was passierte») F8

29.8.2026 (Intl-Routing, 3. Prüf-Durchgang M7/M8): ZWEI datierte Reproduktions-Kommentare wurden beim Bau auf die neue Adresse «nachgeführt» — und damit falsch (die Adresse existierte am Belegdatum nicht; einer widersprach der Chronik derselben Änderung). Auslöser war ein neues Kanonik-Tor, das die Kommentare gar nicht las — der Beleg wurde dem Tor geopfert, nicht der Wahrheit.

## §F9

Stelle: Register (Spalte «Was passierte») F9

29.8.2026 (Frische-GP B1/B5): `leseTiStand` nahm das MAXIMUM aller «in vigore dal»-Daten der Quellseite — inkl. des Ankündigungs-Abschnitts «PROSSIME VARIAZIONI» → TI-181 bekam stand 1.1.2027 (16 Monate Zukunft) in den Grundbuchtarif-Risikopfad; gleiche Klasse vorbestehend: SZ-213.512 (2027-02-01). Dazu B2: der Zuklapp-Link «chiudi -» des neuen Seitenabschnitts landete als Normtext.

## §F2-Verschaerfungen

Stelle: Absatz «F2-Verschärfungen», (i) Retry-/Abschneide-Maskierung

Playwright-`retries:2` + `maxFailures`
verdeckten, dass der ⌘K-Wächter seit ≥16.8. auf ALLEN Branches im Erstversuch
rot ist (69/69) und dass ein neues Tor (topbar-320) in seiner Shard-Gruppe NIE
lief («10 did not run») — beide Funde erst durch Hand-Forensik.

## §F2-Verschaerfungen-ii

Stelle: Absatz «F2-Verschärfungen», (ii) Automatik prüft Teilmenge

der Fedlex-Frische-Lauf fuhr 5 handverlesene
Offline-Tore statt des Gates — drei Regressionen (Zähler/Revisionen/PDF-Quellen)
liefen durch, und der verschärfte Merge-Schutz (574 Risiko-Dateien ohne Verdikt)
blockierte drei Wochen-PRs in Folge still.

## §F13

Stelle: F13 Beobachtung

Beobachtung: `gh run list` zeigte den CI-Lauf des Squash-Commits 1123b1974 als
`cancelled`, ~30 s nachdem ein Doku-Push (9cdbb6a55) auf main folgte; der
Doku-Lauf überspringt den Deploy-Job → Live-Build blieb auf dem Vorgänger
(Sidecar 404), erst `gh run rerun` heilte.

## §F14

Stelle: F14 Beleg-Erzählung

Der B1-Zweig von `--regeste-refresh`
(`scripts/normtext-entscheide.ts`) übernahm ein frisch geholtes Auszug-only-
Ergebnis vollständig — bei 6 von 1259 amtlichen BGE verschwand dabei über
zwei additive Nachpflege-Läufe (5.7./28.7.2026) die bereits vorhandene
`regeste.sprachfassungen`, unbemerkt, weil kein Tor die Regeste-Vollständigkeit
prüfte; gefangen hat es erst die Gegenprüfung, nicht der Bau.

## §F15

Stelle: F15 Beleg-Erzählung (drei Fälle 12.9.2026)

Ein
neuer Sperren-Mechanismus wurde je gegen den GEDACHTEN, nicht den tatsächlichen
Bestand entworfen: #815 (A4) verlangte im Kanten-Soll auch Kanten bereits
ENTLISTETER Dokumente und brach beim nächsten legitimen Entlistungslauf mit
«unvollständig» ab — der einzige Reparaturweg (Generator laufen lassen) war
damit blockiert; #818 (B1) feuerte die erste Bestandszahl-Sperren-Fassung auf
dem unveränderten, VOLLSTÄNDIGEN Korpus, weil `altManifest.entscheide.length`
abgeleitete `__voll`-Verweis-Einträge mitzählte, `auswahl.length` aber nicht;
#824 (C1/D1) nahm einen `/tmp`-HTML-Cache als gegeben an — in der CI-Umgebung
ohne diesen Cache lief das Tor unbemerkt GRÜN durch, statt den fehlenden Fetch
zu melden 

## §F16

Stelle: F16 Beleg-Erzählung (PR #827, drei Prüfrunden)

Ein neuer
§8-Marker (`berichtigung-fremdes-as-dokument` für `jolux:rectifies`-Kanten) behauptete
in Runde 1 einen «Fedlex-internen Widerspruch» — amtlich falsifiziert: `jolux:rectifies`
benennt das AS-Dokument der Erstpublikation (Anhangs-Änderung), `classifiedByTaxonomyEntry`
den betroffenen SR-Erlass; zwei verschiedene Aussagen, kein Widerspruch. Runde 2 fand in
derselben Marker-Klasse einen echten Fehler: der Provenienz-Satz «erstpubliziert» bei
AS 2025 686/SKV war falsch, das `rectifies`-Ziel zeigte auf AS 2025 648 statt der
amtlichen 644 — ein Fedlex-Datenfehler, keine Extraktionslücke. Erst Runde 3 bestand: der
Marker-Text gibt nur noch das Tripel wieder (Fremd-SR + Fundstelle), ohne Deutung.

## §F17-Vollzug

Stelle: F17 Beleg-Erzählung (vier Wege in denselben Zustand)

Die
Bereinigung der Leser-V3-Checkliste ergab: **alle vier offenen Posten waren gebaut**
— D0 (#534, 16.8.), S1 (#547) und S2 (#550, beide 17.8.), Kantons-Probe (#552, 18.8.).
Vier verschiedene Wege in denselben Zustand, jeder für sich harmlos: **#534** hakte die
Zeile ab, aber die andere — `DESIGN-D0` stand doppelt im Plan (§5), die Kopie unter dem
Leser-Dach blieb stehen. **#547** fasste ROADMAP.md an, aber nur um drei NEUE §17-Funde
einzutragen; die eigene Checkbox blieb unberührt. **#550** fasste ROADMAP.md gar nicht an
und schrieb «✅ gebaut» nur in den Fahrplan — zwei Wahrheiten, kein Tor las beide. **#539**
meldete die S4-Begriffskollision ausdrücklich und verwies sie ans «nächste Plan-Aufräumen»;
dieses (#577, Steuerungs-Diät 29.8.) **löschte den Warn-Absatz beim Verdichten, ohne den
darin hinterlegten Auftrag auszuführen**.

## §F17-Schaden

Stelle: F17 Schaden

Schaden: keine Doppelarbeit belegt, aber
vier Wochen falsche Steuerung — `plan:next` und jeder Lagebild-Bau-Prompt lasen «offen».

## §F17-Geburtsbeweis

Stelle: F17 Geburtsbeweis

Geburtsbeweis §6.7: rot auf `e94a3dc90` mit exakt den zwei vorhergesagten Treffern (S2, S4),
grün nach der Bereinigung, dazu 9 Vitest-Fälle inkl. Rot-Fall — damit bleibt die Regel
prüfbar, wenn die reale ROADMAP längst sauber ist (F2e).

## §F17-Richtung2-Anlass

Stelle: F17 zweite Richtung 20.9.2026, Anlass-Erzählung

Die
Richtungs-Grenze oben wurde nach fünf Tagen real konsumiert — diesmal INNERHALB der
ROADMAP. Zwei Schritte standen auf `status: done` und trugen darunter zusammen **15
offene `- [ ]`-Posten** (6 unter dem Design-Kopf, 8 unter dem Tarif-Kopf, einer hinter
den Feldtrenner `---` gerutscht). `plan:next` liest den Status des KOPFES, nie die
Checkboxen darunter — die Arbeit stand im Plan und war im Plan unsichtbar, wochenlang,
bei grünem `check:plan`. Schaden: 15 Posten, die keiner Session je angezeigt wurden,
darunter **eine seit dem 5.9.2026 offene Fachfrage an David** («WARTET AUF DAVID
(fachlich, §7): Verjährungsrevision 2020 … `verjaehrung.ts:547`») — ein Wartestand, der
in einem `done`-Block verschwand. Zweiter Fall derselben Klasse im selben Plan: ein
Verweis auf einen Schritt `W3-TARIF-NACHVERIFIKATION`, den es nie gab. 

## §F17-Richtung2-Geburtsbeweis

Stelle: F17 zweite Richtung, Geburtsbeweis §6.7 + Streuungs-Probe

Geburtsbeweis §6.7: **rot auf `0e4999b48`** mit exakt den
14 vorhergesagten Treffern (Z. 585/587/590/591/592/594 und 723–730), **grün auf
`8f6fe6971`** mit 0 Treffern; Streuungs-Probe über 10 historische ROADMAP-Stände: 5
Stände mit Treffern (1–25), Stichproben durchweg echte Fälle derselben Klasse, kein
Fehlalarm. 

## §Bewusst-nicht-F6-Registry

Stelle: Abschnitt «Bewusst NICHT geregelt», Claim-Registry

*Wiederaufgerollt 28.7.2026 nach dem 2.
  F6-Vorfall (#397/#398), Entscheid bestätigt: die Lücke war nicht fehlender
  Zustand, sondern eine zu enge Sonde. Eskaliert wurde innerhalb der
  Dispatch-Form (drei Sonden + Früh-Push, §0.5) plus wip-Pflicht im Skill
  `auftrag`. 

## §Bewusst-nicht-ROADMAP-Restrukturierung

Stelle: Abschnitt «Bewusst NICHT geregelt», ROADMAP-Restrukturierung, Nachsatz 20.9.2026

*Nachsatz 20.9.2026:* nach Messung (Deckel alle 8–15 Tage gerissen,
  `ROADMAP.md` in 50 % der PRs, 4 von 10 Queue-Rauswürfen Konflikte) gab David
  das **Posten-Modell** frei: ein Nebenfund = eine Datei unter `plan/posten/`,
  Wächter `check:plan` 16 — keine zweite Wahrheit, sondern Auslagerung der
  Nebenfunde aus der einen. Keine neue F-Klasse.
