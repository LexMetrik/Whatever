# FAHRPLAN — Plan-Steuerung «ein Etikett pro Schritt» (Detailquelle)
<!-- @lagebild name: Plan-Steuerung · zweck: Werkzeuge, mit denen der Plan selbst geführt wird (plan:next, dieses Lagebild). -->

> **Stand 1.7.2026.** Detailquelle zum Querschnitt **`QS-PH`** (Plan-Hygiene-Wächter) in
> `ROADMAP.md`. Verlinkt aus dem `QS-PH`-Eintrag des Querschnitt-Bands (Pflicht §14.1; das Tor
> `check:plan` setzt die Verlinkung selbst durch — s. u.). *Das Wie steht hier; gesteuert wird über
> `ROADMAP.md`.*
>
> **Doppelt verifiziert:** dieser Spec wurde gegen das reale Repo geprüft (Struktur von `ROADMAP.md`,
> `package.json`-Scripts, `scripts/gate.sh`, `CLAUDE.md` §-Regeln) **und** durch einen unabhängigen
> adversarialen Opus-Agenten auf Lücken durchgesehen (16 Befunde, alle hier eingearbeitet).

---

> Erledigt-/Stand-Abschnitte vom 14.8.2026 nach `archiv/FAHRPLAN-ERLEDIGT-ABSCHNITTE.md` verschoben (QS-PLAN-EINFACH).

## §0 · Zweck

Detailquelle zu `QS-PH` — die `@meta`-DSL (Etiketten, Felder, Tor `check:plan`),
mit der `ROADMAP.md` ihren Zustand deterministisch statt in Prosa trägt. **Das
Wie steht hier; gesteuert wird über `ROADMAP.md`.** Einzige Doku der `@meta`-DSL —
keine Ersatz-Heimat (vgl. `FAHRPLAN-ARCHIV-RESTPUNKTE.md`).

---

## Das Etikett `@meta` — 4 Pflichtfelder + 2 optionale *(Stand 29.8.2026)*

Eine Kommentar-Zeile direkt **unter** der ersten Zeile der Einheit (Schritt-Bullet bzw. Überschrift),
Felder durch ` · ` getrennt:

```
- [ ] **Konsultieren-Klingen** *(`W2·6`, `[OF]`, amtlich)*
  <!-- @meta id: W2·6 · status: ready · blocker: null · dep: [] · feld: rechtsprechung · fahrplan: fahrplaene/FAHRPLAN-RECHTSPRECHUNG.md -->
  Ziel und Grenze in 2–4 Zeilen; Detail-WIE über den `fahrplan:`-Zeiger.
```

Checkbox-lose Einheiten tragen es analog direkt unter Überschrift/Bullet.

| Feld | Bedeutung | Werte |
|---|---|---|
| `id` | Stabile Schritt-ID (explizit) | `W1·1` · `W2·6` · `W3·12` · `QS-PERF` · Bündel `W2·6-B1` |
| `status` | Die Ampel | `ready` · `wip` · `blocked` · `done` · `parked` (Grammatik s. u.) |
| `blocker` | Token, falls `blocked`/`parked` | Token aus dem Blocker-Register oder `null` |
| `dep` | Einheiten, die erst `done` sein müssen | Liste von IDs, z. B. `[W1·4]` oder `[]` |
| `feld` | **Baufeld** — die eine Code-Fläche des Schritts | `leser` · `korpus` · `rechtsprechung` · `suche` · `design` · `werkzeuge` · `betrieb` |
| `fahrplan` | Detail-Datei (optional) | Pfad (`fahrplaene/…` bzw. `archiv/…`) oder leer |

**Massgeblich ist der Code, nicht diese Tabelle** (§5): Vokabular und Semantik von `feld` stehen in
`scripts/plan/etikett.ts`, die Prüfregeln in `scripts/plan/check.ts`. Diese Datei erklärt, WARUM es
so ist.

### Feld `feld` — das Baufeld (Plan-Neuschnitt 29.8.2026, Auftrag David)

Ein Schritt liegt auf genau EINER Code-Fläche; das Feld benennt sie, und die ROADMAP gliedert nach
denselben sieben Werten. Es beantwortet maschinell genau eine Frage — **können zwei Schritte
gleichzeitig gebaut werden?** — nach der Regel: *dasselbe Feld nie parallel, verschiedene Felder
immer.* Fehlt es, gilt der Schritt konservativ als «kollidiert mit allem» (eigene Lane).

Ausgewertet wird es an drei Stellen: Lane-Bildung in `resolve()` (`aufloesen.ts`), die
Kollisionswarnung von `plan:next` (gleiches Feld auf `wip`) und die Wirkungsbereich-Anzeige des
Lagebilds (`FELD_PFADE` in `bildHtml.ts`). `check:plan` **Regel 14** erzwingt Pflicht und Vokabular;
`parseEtikett` wirft dabei bewusst NICHT — ein Tippfehler gehört als benannte Tor-Meldung ins Tor,
nicht als Absturz in die ganze Werkzeugkette (`plan:next`, `plan:set`, `plan:bild` parsen dieselbe
Zeile).

*(**Gestrichen 29.8.2026, Plan-Neuschnitt:** `kollision` (ersetzt durch `feld` — 43 von Hand
gepflegte Pfadlisten für eine Ja/Nein-Frage), `26x` und `slot` (die 26×-Slot-Mechanik samt
check:plan 5/5b/5c; die Reihenfolge steht jetzt als `dep` am Schritt), `groesse` (reine Lese-Hilfe
ohne Auswerter, seit 14.8.2026 ohne Vokabelprüfung und seit 15.8.2026 aus dem Bau-Prompt entfernt)
und `worktree` (§12 gilt für jede Parallel-Session ohnehin). Ebenfalls weg: die Inventar-Liste
`scripts/plan/inventar.ts` samt check:plan-Regel 1 — Doppelbuchführung, deren Anlass «Waisen
mergten grün» durch den CI-Einbau von `check:plan` behoben ist. Der frühere Wortlaut dieses
Abschnitts steht in `archiv/fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md`.)*

*(**Gestrichen 14.8.2026, `QS-PLAN-EINFACH`:** `of` (20 686× «ja», 0× «nein»),
`seq-hart`/`seq-weich` (3 Vermerke, 0 auswertende Code-Stellen) und der `status`-Agent-Zusatz
`wip(agent)` (0 Vorkommen). Der Parser toleriert alle Altfelder im Bestand, der Serializer schreibt
sie nie — `plan:set` räumt Reste beim nächsten Schreiben mechanisch ab.)*

**Status-Grammatik (Befund #11):** `status := <wert> ('(' <agent/worktree> ')')?`. Der Schema-Check
prüft nur den `<wert>` vor der Klammer gegen die erlaubte Menge; die optionale Klammer-Annotation hält
bei `wip` den Bauenden fest: `status: wip(reader-wt)` → Selbst-Koordination paralleler Agenten (heute
manuell: «an Bündel R sitzt ein anderer Agent»).

**IDs** folgen §14.5 (`W2·6` = «Welle 2 · Schritt 6»). `S0` und `W3·12` sind feste IDs (Beispiel-ID nachgezogen 15.8.2026, Etiketten-Konsolidierung). Bündel erben den
Eltern-Präfix (`W2·6-B1`). Vorbestehende CLAUDE.md-Drift «S0 + Wellen 1–13» (Schritt 14 existiert)
wird **nicht** in diesem Schritt gefixt (fremde Datei), nur notiert.

---

## Eine Wahrheit: `@meta` zählt, Prosa ist Historie (Befund #4)

`check:plan` und der Resolver lesen **ausschliesslich** das `@meta` (und, wo vorhanden, die Checkbox als
gekoppelte Zweitanzeige). **Nicht** als Wahrheit gelesen werden: die Status-Sätze in der Schritt-Prosa
(«✅ FERTIG + LIVE», «erledigt 28.6.»), der `> ■ Auftrags-Eingang 30.6.`-Blockquote und der frühere
Fortschritts-Block. Diese sind **narrative Historie**. Die Erst-Befüllung löst den **Fortschritts-Block**
in `@meta`+Checkboxen auf und entfernt ihn; Blockquote und Schritt-Prosa bleiben als Geschichte stehen,
sind aber per dieser Regel ausdrücklich nicht-autoritativ.

**Folgeregel für Stand-Prosa (5.8.2026, Bauplan-Review-Befund B2): einen gemessenen Wert nennt
die Prosa nie als Zahl, sondern als Messwerkzeug.** Statt «das Ceiling ist wieder eingehalten»
oder «Ist-Stand 110.0 KB» gehört dorthin der Befehl, der die Zahl im Moment des Lesens liefert
(hier `python3 .claude/hooks/struktur-rotieren.py --check`). Anlass: der QS-TOK-Satz «Das
ROADMAP-Ceiling ist am 3.8.2026 wieder eingehalten» war rund **drei Stunden** wahr — beim
nächsten Doku-Commit war er falsch und blieb es tagelang, ohne dass ein Tor ihn sehen konnte.
Ein Momentwert in nicht-autoritativer Prosa altert unbemerkt und wird trotzdem gelesen; der
Messbefehl altert nicht. Wo ein historischer Zahlenstand belegt werden soll, gehört er in einen
**datierten** Beleg-Satz («Stand 31.7.2026: 110.0 KB»), nie in eine Gegenwarts-Aussage.

### Checkbox ↔ Status (Befund #2, #5)

Wo eine Einheit eine Checkbox hat, gilt die Kopplung — und **nur dort**:

| Checkbox | erlaubter `status` |
|---|---|
| `[x]` | `done` |
| `[~]` | `wip` |
| `[ ]` | `ready` · `blocked` · `parked` |
| `[d]` / `[D]` | `parked` · `blocked` (Legendenmarke «geparkt/zurückgestellt») |

**Normalform ist `[ ]`** (Richtigstellung 31.7.2026, Endprüfungs-Fund R3-2). `plan:set` **erzeugt**
die Legendenmarke `[d]` nie — es **bewahrt** sie nur: eine vorhandene `[d]`/`[D]` überlebt einen
Wechsel nach `parked` oder `blocked`, eine nicht passende Marke wird auf `[ ]` nachgezogen. Kurzzeitig
galt am selben Tag das Gegenteil (`CHECKBOX_FUER` erzeugte `[d]` für beide Status); das beschriftete
einen bloss blockierten Schritt als «geparkt/zurückgestellt» (§8) und liess denselben Status je nach
Vorzustand als `[ ]` **oder** `[d]` erscheinen, ohne dass ein Tor es sah — die Tabelle duldet beides.
Wer parken **will**, setzt `[d]` von Hand.

Checkbox-lose Einheiten (S0-Überschrift, Querschnitt-Stränge) haben **keine** Kopplungs-Prüfung; ihr
`status` ist die alleinige Wahrheit (kein Häkchen-Konflikt möglich). `[~]` wird als gültiger
Checkbox-Zustand anerkannt (real bei Schritt 5).

**Wie die Checkbox gefunden wird (Neufassung 31.7.2026, Endprüfungs-Fund R2-1/R2-10).** Bis dahin
galt «die nächste nicht-leere Zeile über dem `@meta`». Eine einzige Prosa-Zeile dazwischen kappte
die Bindung — `checkbox = null` —, und weil die Kopplungsregel nur *bei vorhandener* Checkbox
prüft, war das Tor genau dort blind: `plan:set … status=done` schrieb das `@meta`, die sichtbare
Liste blieb auf «offen», `check:plan` blieb grün. Gültig ist jetzt:

> Rückwärts vom `@meta` bis zur **ersten Listen-Bullet-Zeile**; deren Checkbox bindet. Trägt sie
> keine, bindet nichts (Querschnitt-Fall). Abbruch an Überschrift, Kommentar-Grenze (`<!--`/`-->`,
> also auch an einem fremden `@meta`) und an einer doppelten Leerzeile. Der Bullet-Test läuft
> **vor** der Kommentar-Grenze: eine Bullet-Zeile ist nie eine Kommentar-Grenze, auch wenn sie
> `-->` oder `<!--` als Fliesstext im eigenen Titel führt (Fund R3-7 — ein Pfeil im Schritt-Namen
> kappte sonst die Bindung und machte Regel 10 falsch-positiv rot).

Dieselbe Funktion (`bindeCheckbox` in `scripts/plan/parse.ts`) bedient Parser UND `plan:set` — zwei
Kopien derselben Nachbarschafts-Regel wären zwei Wahrheiten (§5). Gegenprobe von vorn erzwingt
**Regel 10** in `check:plan`: steht unter einer Checkbox-Bullet ein `@meta`, bevor die nächste
Bindungs-Einheit beginnt, MUSS es daran gebunden sein — sonst rot. Praktische Folge für Autoren:
**`@meta` gehört unmittelbar unter seine Bullet-Zeile**; Begründungs-Prosa steht darunter, nicht
dazwischen.

**Was die Bindungs-Einheit beendet (Nachschärfung 31.7.2026, Endprüfungs-Fund R3-1/R3-9).** Nur eine
**gleich- oder höherrangige** Bullet, eine Überschrift oder eine doppelte Leerzeile. Eine **tiefer
eingezogene** Unter-Bullet tut es nicht — sie gehört noch zum Block ihrer Dach-Bullet, und ihr
bereits gebundenes `@meta` wird beim Weiterlaufen übersprungen statt zum Abbruch genommen. Vorher
beendete jede Checkbox-Bullet jeder Tiefe die Einheit; eine Dach-Bullet, deren eigenes `@meta`
**hinter** dem `@meta` ihres Unterschritts stand, fiel damit durch beide Netze — der Vorwärts-Blick
brach an der Unter-Bullet ab, die Rückwärts-Bindung am `@meta` des Unterschritts. Genau diese Drift
war im Bestand **live** an `W2·7-BEZUG`: `plan:set … status=wip` schrieb das `@meta`, die sichtbare
`- [x]` blieb stehen, und `check:plan` meldete null Probleme. Der Test-Satz führt das alte
ROADMAP-Layout jetzt als **Negativ**-Fixture (es stand dort zuvor als «GEGENPROBE», also als
gewolltes Verhalten — eine Grenze, die keine war).

---

## Blocker-Register (Befund #9 — keine Zeilennummern, keine Prosa)

Blocker-Tokens werden gegen ein **explizites Register** validiert, nie gegen Fliesstext/Zeilennummern.
Das Register ist ein benannter HTML-Kommentar-Block in `ROADMAP.md` (bei den «Verifikations-Blockaden»):

```
<!-- @blockers
wbqdyap3x: Prozesskosten I2 — Schlichtungs-/Reduktionsfaktoren (Recherche offen)
§4-lizenz: Live-Rechtsprechung — CC-BY-SA vs. Art. 5 URG, CORS/Rate-Limits unbestätigt
-->
```

`check:plan`: jede `blocker`-Token eines `blocked`/`parked`-Schritts muss im Register stehen; jede
`dep`-ID muss als etikettierte Einheit existieren. Keine Logik hängt an Zeilennummern (die die Erst-Befüllung
ohnehin verschiebt).

---

## Der `next`-Resolver — Regeln + vollständige Ausgabe (Befund #6, #7, #12, #13, #16)

**`ready-now` (grün, jetzt baubar)** wenn **alle**: `status==ready` · `blocker==null` · alle `dep`
sind `done`. Mehr Bedingungen gibt es seit dem Plan-Neuschnitt 29.8.2026 nicht — die frühere
26×-Slot-Sperre (`falls 26x==ja: kein anderes 26× aktiv oder empfohlen`) ist entfallen und durch
eine WARNUNG ersetzt (s. u.). Grund: ein Baufeld bündelt sieben statt hunderter Flächen; eine harte
Sperre auf dieser Körnung hielte Baubares auf. Die Reihenfolge, die das Leitprinzip 4 verlangt
(«eine Datensäule fertig führen»), steht seither als `dep` am Schritt und wird von den Regeln
4/4b/4c geprüft.

**`npm run plan:next` druckt ALLE Buckets** (nichts verschwindet lautlos — der Fehlermodus, den der
Spec heilt):
1. **`ready-now`** + welche **parallel** gehen — Lanes über das `feld:`: greedy in
   `ready-now`-Reihenfolge (@queue-Rang vor Dokumentreihenfolge), ein Schritt steigt in die erste
   Lane, in der niemand sein Baufeld hält. **Fehlendes `feld` = undeklariert → konservativ eigene
   Lane** (nie blind parallelisiert) — dieselbe Vorsichtsregel wie früher bei leerer `kollision`.
2. **wartet auf dep** (mit der offenen dep-ID)
3. **blockiert** (mit Blocker-Token + Klartext aus dem Register)
4. **geparkt**
5. **in Arbeit (wip)** — die aktiven `wip`-Einheiten (dürfen nicht lautlos verschwinden)
6. **Kollisionswarnung** je ready-Schritt, dessen Baufeld gerade ein `wip`-Schritt hält: «Baufeld X
   ist von <id> (wip) belegt — nur im eigenen Worktree bauen (§12)». Sie SPERRT nicht. Dazu bleiben
   die drei F6-Sonden im Lage-Block darunter (offene PRs, lokale Branches, `git worktree list`).

Determinismus (§2): gleiche ROADMAP → gleiche Ausgabe. Tagesbezug nie in der Auswahllogik.

---

## Bausteine (alle unter `scripts/plan/`, Runner `vite-node`)

| Baustein | Datei / Script | Aufgabe |
|---|---|---|
| **Grammatik** | `scripts/plan/etikett.ts` | `@meta`-Parse/Serialize + Feld-Schema + Baufeld-Vokabular. Einmal (§5). |
| **Auflösung** | `scripts/plan/aufloesen.ts` | `resolve()` nebenwirkungsfrei: Buckets, Lanes, Feld-Warnung. |
| **Leser** | `scripts/plan/parse.ts` | `ROADMAP.md` → Einheiten-Objekte (Sektion-bewusst, s. Geltungsbereich). |
| **Resolver** | `scripts/plan/next.ts` → `npm run plan:next` | Regeln + alle Buckets + Lanes. |
| **Setzer** | `scripts/plan/set.ts` → `npm run plan:set -- <id> <feld>=<wert>` | Mutiert Feld **und** toggelt die gekoppelte Checkbox (Befund #3). |
| **Wächter** | `scripts/plan/check.ts` → `npm run check:plan` | Schema + Logik + FAHRPLAN-Link (s. u.). |

**`plan:set` toggelt die Checkbox mit (Befund #3):** ändert es `status`, setzt es die Checkbox der
Einheit konsistent (`done→[x]` · `wip→[~]` · sonst `[ ]`); checkbox-lose Einheiten unverändert. So kann
der unmittelbar danach laufende `check:plan` nie an der eigenen Setzer-Aktion rotschlagen.

### `check:plan` — die Prüfungen (das ist die `QS-PH`-Schärfe)

- **Schema (Regel 1 + 14):** keine doppelt vergebene ID; jedes `@meta` trägt ein `feld:` aus dem
  Vokabular der sieben Baufelder. *(Die frühere Inventar-Abdeckung — «jede Inventar-ID hat ein
  @meta, kein verwaistes @meta» — ist am 29.8.2026 gestrichen: Doppelbuchführung, deren Anlass
  «Waisen mergten grün» durch den CI-Einbau von `check:plan` behoben ist.)*
- **Checkbox-Kopplung:** nur für Einheiten **mit** Checkbox, gemäss Tabelle oben.
- **Blocker/dep:** Tokens im `@blockers`-Register; dep-IDs existieren als Einheit; **dep-Graph azyklisch**
  (Zyklus → rot, Befund #13).
- *(Gestrichen 29.8.2026: die 26×-Regeln 5/5b/5c und die `kollision`-Pfad-Existenz (Regel 6) —
  beide Felder gibt es nicht mehr. An ihre Stelle tritt Regel 14 oben.)*
- **FAHRPLAN-Link-Check (eingegliedertes Ur-`QS-PH`, Befund #8):** jede `FAHRPLAN-*.md` im Repo-Wurzel
  ist aus `ROADMAP.md` verlinkt — **ausser** den im `ARCHIV_BACKLOG` grandfatherten Altlasten
  (Archiv-Kandidaten, s. ROADMAP «Strang-Detailpunkte»); eine **NEUE/neu referenzierte** unverlinkte
  FAHRPLAN wird rot. Damit ist `check:plan` ⊇ dem ursprünglich für `QS-PH` geplanten Verlinkungs-
  Wächter — kein zweites Tool, nichts fällt unter den Tisch.
- **Nur Prüflogik** → golden byte-gleich (§6).

**Einhängung — Stand 20.7.2026 (as-built, ersetzt die Bau-Zeit-Planung):** `check:plan` läuft in
`check:seriell` (`package.json`) **und** als Schritt in `.github/workflows/ci.yml` — also nicht mehr
nur lokal. `npm run check:plan` grün verifiziert 20.7.2026. Muster = reale `check:*`-Skripte
(`check:perf-budget`, `check:design-tokens`). **Korrektur:** die frühere Zeile «`check:gegenpruefung`
ist noch nicht gebaut» ist überholt — das Tor steht seit PR #67 (1.7.2026, Bausteine a+b+c) und ist
seither eine taugliche Vorlage. Neue `.ts` müssen `npm run lint` (eslint, in `gate voll`) bestehen.

---

## Selbstverweise in Fahrplänen — Konvention (AP-11, Nachtrag 31.7.2026)

Der AP-8-Umzug nach `fahrplaene/` hat in den Fahrplänen selbst Links hinterlassen, die auf die
eigene Datei zeigten und nach dem Umzug ins Leere liefen. Die Fix-Runde 1 hat 68 solcher Stellen
auf «diese Datei» neutralisiert — jedoch nicht regelgeleitet: in
`FAHRPLAN-FEDLEX-PORTFOLIO.md` blieben zwei Zeilen weiter unten und in derselben Datei drei
weitere Selbstnamen bar stehen (Endprüfungs-Fund R2-24). Damit war für Leser unklar, welchen
Status die jeweils andere Form hat.

**Konvention (ab 31.7.2026 verbindlich):**

1. Der **bare Selbstname** ist zulässig und die Normalform: `` `FAHRPLAN-X.md` `` innerhalb von
   `FAHRPLAN-X.md`. Er ist stabil, umzugsfest und für die Suche auffindbar.
2. Gestrippt wird ausschliesslich der **tote Selbst-Link**: `[FAHRPLAN-X.md](fahrplaene/FAHRPLAN-X.md)`
   → `` `FAHRPLAN-X.md` ``. Ein Link, dessen Ziel die Datei ist, in der er steht, ist kein Zeiger,
   sondern eine Schleife.
3. Formulierungen wie «diese Datei» sind **erlaubt, aber nicht Pflicht**. Wo sie in einem Block
   stehen, der sich als wortgleiche ROADMAP-Kopie deklariert, trägt der Block eine
   Deklarationszeile («Wörtlich bis auf die Selbstverweise …») — sonst behauptet er eine
   Provenienz, die er nicht mehr hat (§8, Fund R2-18).
4. **Abschnitts-Anker** in Selbstverweisen nennen die Überschrift, nie eine Zeilennummer
   (§0.2-Anker-Regel aus `FAHRPLAN-UI-BEFUNDE.md`, hier als Konvention für alle Fahrpläne
   übernommen — die Fehlerklasse ist repo-weit, s. Fund R2-2/R2-20).

**Restbestand:** Die Durchsicht des 31.7.2026 hat die Deklarationszeilen gesetzt und die
FEDLEX-Portfolio-Inkonsistenz auf Form 1 vereinheitlicht. Ein flächiger Durchgang über alle
Fahrpläne ist **nicht** gelaufen und wird nicht behauptet; er läuft mit, wenn eine Datei ohnehin
angefasst wird.

## Selbstoptimierender Bau (`QS-SELBSTOPT` — EIN Schritt, eine ganze Session, ergebnisoffen)

**Anlass:** Auftrag David 5.8.2026; Recherche mit allen Quellen und drei bewussten
Absagen (SaaS/§5 · Auto-Merge/§17 · Rechtslogik nie selbstoptimierend):
`bibliothek/recherche/selbstoptimierender-bau-2026-08-05.md`.

**Mandat:** Entscheid David 5.8.2026 — der Schritt ist bewusst EIN Gesamtschritt: eine
ganze Session widmet sich der Selbstoptimierung und entscheidet ergebnisoffen, was den
Bau am meisten verbessert. Der folgende Zwei-Stufen-Pfad ist Empfehlung, kein Korsett.

**Stufe 1 — erst messen:** Ein generiertes JSON (reine
§5-Projektion, nie handgepflegt) sammelt je Zeitpunkt: Tor-Rot-Ereignisse je
`check:*` · CI-Failure-Rate/Rerun-Rate aus der nativen GitHub-Actions-Metrics-API
(GA seit 3/2025, kein Fremddienst) · Rework-Heuristik (Folge-Commits kurzer Frist
auf denselben Dateien — Beobachtungsgrösse, nie Tor-Kriterium) · Flaky-Retry-Zähler
aus den e2e-Shards · Rückfall-Zähler je F-Klasse des Lehren-Registers. Andockt an
`scripts/plan/lage.ts` (Anzeige im Lagebild) und das Muster von
`scripts/check-ci-laeufe.ts`. Fertig, wenn die Zeitreihe zwei reale Läufe trägt und
das Lagebild sie zeigt; Scheiterns-Fähigkeit einmal gezeigt (§6.7).

**Ent-Regulierung — gleichwertige Stufe (Auftrag David 5.8.2026):** Die Session prüft
bestehende Sicherungen mit dem offiziellen Anthropic-Löschkriterium («would removing this
cause mistakes? If not, cut it») und der Zeitreihe als Beleg: ein Tor, das seit Geburt nie
rot war, aber Laufzeit kostet, ist Streichkandidat — vorher Provenienz klären (Skill
`lehren`, Fünf-Schritte: Hinterfragen → Löschen zuerst). Cherny-Muster als Rhythmus-Idee:
periodisches radikales Entrümpel-Review von CLAUDE.md/Skills/Hooks, weil viele Regeln
Patches für Schwächen des DAMALIGEN Modells sind. Belege: Runde 2 der Recherche.

**Stufe 2 — dann deuten, manuell:** `npm run retro:17`
liest NUR Zeitreihe + Chronik und formuliert einen als ENTWURF markierten
ROADMAP-Vorschlagsblock (kein Auto-Commit, kein Auto-PR); die startende Session
entscheidet über Übernahme. Hebung zu einem geplanten Agenten (Safe-Outputs-Muster)
erst nach Bewährung und mit David-Entscheid — §17-Fünf-Schritte: Automatisieren
zuletzt. Ausdrücklich ausgenommen bleiben Rechtslogik, Engines und Korpus (§1/§2/§7).

**Entscheid David 7.8.2026 («stufe 1 ja»):** Der Vorschlags-Autopilot — Stufe 1 der
drei aufgeklärten Autopilot-Stufen: Cron-Lauf führt `retro:17` aus und eröffnet bei
Befunden einen Entwurfs-PR, kein Auto-Merge — ist **freigegeben**, gebunden an die
Mindestdatenlage ≥ 5 Snapshots (Schritt `QS-AUTOPILOT-STUFE1`, Blocker
`zeitreihe-5-snapshots`). Stufe 2 (autonome Umsetzung auf Prozess-Fläche) und
Stufe 3 (autonomer Bau) sind ausdrücklich NICHT freigegeben — je eigener künftiger
David-Entscheid.

**Gebaut 31.8.2026** (`QS-AUTOPILOT-STUFE1`): Die Mindestdatenlage war mit 14 Snapshots
erfüllt (Selbstauskunft von `retro:17`, Beleg in `ROADMAP-CHRONIK.md`), der Blocker
`zeitreihe-5-snapshots` entfiel. Träger ist `.github/workflows/autopilot.yml` — montags
07:29 UTC plus `workflow_dispatch`: er fährt `retro:17`, zählt die `ENTWURF_MARKE` im
Ergebnis und eröffnet nur bei ≥ 1 Marke einen `--draft`-PR mit dem Entwurf als Datei
unter `messwerte/autopilot/`. Keine Marke ⇒ kein PR, grüner Lauf, `::notice::`-Zeile.
Bewusst nicht darin: kein Merge, kein Auto-Merge, kein Schreibzugriff auf `ROADMAP.md`
oder `main`, kein `selbstopt:erheben` (Erheben wäre ein Schreibzugriff auf `main` und
ist für Stufe 1 nicht nötig — Folge, ehrlich benannt: die Frische der Vorschläge hängt
weiterhin an den Sessions). Höchstens EIN offener Entwurfs-PR gleichzeitig
(Flut-Sperre), sonst ergäben 52 Läufe im Jahr 52 offene PRs.

**Rückbau 20.9.2026 (Entscheid David, QS-EFFIZIENZ):** Der gesamte Kreislauf —
Stufe 1 (`selbstopt:erheben`), Stufe 2 (`retro:17`) und der Autopilot-Cron
(`.github/workflows/autopilot.yml`) — ist abgebaut, die Zeitreihe entfällt.
Nachfolge-Messung `npm run tor:bewaehrung`. Der Abschnitt bleibt als
historischer Baubericht stehen (§2b), beschreibt aber kein lauffähiges
Werkzeug mehr.




---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md`](../archiv/fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- Anlass (gemessen in dieser Session, 30.6.2026)
- Leitentscheid: eingebettet als HTML-Kommentar, nicht separate Datei
- Geltungsbereich — welche Einheiten ein `@meta` tragen (Befund #1, #10, #15)
- Einmalige Erst-Befüllung (die eigentliche Heilung)
- Risiko, Tore, Hygiene
- Definition of Done
- Bewusst NICHT im Scope (YAGNI)
- Lagebild-Generator `plan:bild` (Schritt `QS-PLAN-BILD`, Auftrag David 4.8.2026)
- Bauplan-Review 4.8.2026 — Befunde, Umsetzung, Prävention (Spec-§ für `QS-PLAN-REVIEW`)
