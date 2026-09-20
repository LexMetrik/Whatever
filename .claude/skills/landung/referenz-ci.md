# Landung — Referenz: CI-Grün, Vercel, Trailer (Vorfalls-Wortlaut)

<!-- Wortlaut unverändert aus SKILL.md ausgelagert (QS-EFFIZIENZ 15.8.2026,
     Skills-Diät). Die REGELN stehen weiterhin im Skill; hier liegen die
     ausführlichen Vorfalls-Belege und die selten gebrauchten Sonderfälle.
     Laden, wenn ein CI-/Vercel-Sonderfall eintritt: kein pull_request-Lauf,
     skipped/cancelled-Bewertung, Vercel-Limit, stille Plan-Buchung. -->

### Warum `test:e2e` und `check:perf-budget` erst hier laufen

- **`test:e2e` zwingend vor jedem Merge nach main** — es ist bewusst NICHT im
  schnellen `gate` (build+Browser, zu langsam pro Iteration); ohne diesen Lauf
  rottet die Suite (axe-Befunde, veraltete Locator). Die a11y-Prüfpunkte pinnen
  das Theme (hell + Reader zusätzlich dunkel) → uhrzeitunabhängig deterministisch.
- **`check:perf-budget` zwingend vor jedem Merge nach main** (QS-PERF/§15):
  sichert die vendor-react-Topologie (ein stabiler Chunk, kein Doppel-React) und
  die gzip-Budgets; deterministisch, braucht das gebaute `dist` → nur hier, nicht
  im schnellen `gate`. Die Lighthouse-Metrik-Schranken bleiben der Mess-Schritt
  in der Nachkontrolle (Skill, Abschnitt 4, Punkt 4).

### Anlass der Landungs-Rolle (Schritt 3.1)

*(Anlass 3./4.8.2026: drei Parallel-Sessions, zwei beanspruchten dieselbe Rolle,
mehrere PRs wurden bei Grün extern gemergt, einer davon vor Abschluss des
laufenden §9-Bug-Checks — gutgegangen, aber nur zufällig.)*

### Scharfer Auto-Merge bei `BEHIND` (Schritt 3.2)

*Seit 19.9.2026 durch die Merge-Queue gegenstandslos (§Merge-Queue unten) — Wortlaut bleibt als Beleg stehen.*

**Scharfer Auto-Merge ist keine Landung:** bei `mergeStateStatus: BEHIND`
(Branch hinter main, Required «up to date») feuert er NIE von selbst —
nach jeder main-Landung die verbleibenden Auto-Merge-PRs per
`gh pr view <n> --json mergeStateStatus` prüfen und bei BEHIND
`gh pr update-branch` fahren. Realfall #445 (5.8.2026): 16 h scharf,
alle Checks grün, kein Merge — Ursache waren fünf zwischenzeitliche
main-Landungen.

### `cancelled`/`skipped` und die designte Ausnahme (Schritt 6)

**`cancelled` und `skipped` zählen als ROT**, nicht als «nicht rot» — ein
abgebrochener Lauf hat nichts bewiesen. (Realfall 20.7.2026: 5 stumm
abgebrochene `turso-sync`-Läufe, der Suchindex veraltete unbemerkt.)
**Ausnahme — DESIGNTE konditionale Jobs:** `Perf-Budget (§15 — nur bei
grüner Treue)` skippt auf JEDEM `pull_request`-Lauf per
`if: github.event_name != 'pull_request'` (ci.yml, Entscheid David
26.7.2026 — gemessen wird nach dem Merge auf main); dieser Skip ist
mergefähig, die §15-Substanz wird lokal per `npm run check:perf-budget`
auf dem gemergten Stand belegt. Gleiches gilt für Vercel «Canceled by
Ignored Build Step» = success (#445). Massstab: Ein Skip zählt nur dann
als erfüllt, wenn seine Bedingung DOKUMENTIERT designt ist UND die
Substanz anderweitig belegt wurde — jeder andere skipped/cancelled
bleibt ROT.

**Und: FEHLENDE Checks zählen als PENDING, nie als grün.** Im Fenster
direkt nach einem Push sind die Checks des neuen Heads noch nicht
registriert — wer dann «kein pending, kein fail» als grün liest, merged
ungeprüft. Vor der Bewertung die Präsenz der Kern-Batterie verifizieren
(Tore + Bau + letzter Playwright-Shard). (Realfall 4./5.8.2026: Wächter
meldete GRÜN, während Bau/Tore noch gar nicht liefen — nur der
Verifikations-Zwischenschritt vor dem Merge fing es ab.)

### Wenn nach einem Push KEIN `pull_request`-Lauf erscheint

(Realfälle 3.8.2026, PRs #414/#417): erst die Ursache prüfen, dann das passende
Mittel — (a) leerer Diff / md-only: seit der CI-Härtung klassifiziert `ci.yml`
selbst, ein Lauf muss IMMER erscheinen; fehlt er, `gh api
commits/<head>/check-suites` ansehen; (b) Event nicht zugestellt: der Wächter
zieht fehlende Required-Kontexte an offenen PRs täglich per `workflow_dispatch`
nach — manuell geht `gh workflow run ci.yml --ref <branch>` sofort; (c) ein
leerer Commit hilft nur bei hängendem VERCEL-Kontext, er erzeugt KEINEN
Actions-Lauf (kein Datei-Diff) und schiebt den Head von bereits grünen
Check-Runs weg.

### Vercel-Tageslimit (Free-Tier ~100 Deploys/Tag)

Die Wurzel ist seit dem #445-Merge (5.8.2026, QS-CI-VERCEL) behoben — der
Ignored Build Step lässt App-fremde Diffs den Vercel-Build gar nicht erst
verbrauchen; ein übersprungener Build meldet den Check als `success` («Canceled
by Ignored Build Step») und ist mergefähig. Das frühere Admin-Bypass-Interim
(«lass vercel aus dem spiel», David 4.8.2026) ist damit GESTRICHEN: Reisst das
Limit trotzdem (App-Diff-Ketten), ist das kein Bypass-Fall mehr, sondern
Warten/Re-Trigger nach Reset — ein leerer Commit auf den Branch genügt als
Vercel-Re-Trigger (er erzeugt keinen Actions-Lauf, schiebt aber den Head;
Realfall 5.8.2026: #445 selbst so gelandet). Unverändert gilt: ein Vercel-Rot
mit echtem Build-Fehler bleibt Rot, und an landeintensiven Tagen frisst jedes
`update-branch` einen App-Deploy — Kette seriell und ohne überflüssige
Zwischen-Pushes fahren.

**Stand 16.8.2026:** Der Vercel-Kontext ist KEIN Required Check mehr
(David, Branch-Schutz-Edit 15.8. nach dem Tageslimit-Stau) und Feature-
Branches bauen keine Previews (vercel.json, #519). Die Klasse «PR wartet auf
Vercel» existiert damit nicht mehr; ein Admin-Bypass hat keinen Anlass. Ein
Vercel-Rot auf `main` (echter Build-Fehler) bleibt Rot — sichtbar über den
Prod-Deploy-Status, nicht über einen PR-Check.

**Stand 17.8.2026 — alles darüber ist Historie.** Der Ignored Build Step
reichte nicht: Vercel legte trotzdem für JEDEN Push auf JEDEN Branch ein
Deployment an und zählte es ans Tageslimit, auch wenn es sofort «Canceled by
Ignored Build Step» hiess. Am 16.8. abends riss das die 100/Tag und blockierte
Prod 24 h (Vorfall #540). Wurzel-Fix (Entscheid David «Weg b»):
**Git-Auto-Deploys sind aus** (`vercel.json` → `git.deploymentEnabled: false`),
Prod liefert der CI-Job «Deploy (Prod, Vercel CLI)» per
`vercel deploy --prebuilt --prod`. Damit gilt:

- Ein Deployment entsteht **je Merge auf `main`**, nicht je Push. Das
  Tageslimit ist für Branch-Arbeit kein Thema mehr; `update-branch` und
  Zwischen-Pushes kosten keinen Deploy.
- **Kein Vercel-Commit-Status mehr** — weder grün noch rot, auch nicht auf
  `main`. Sein Fehlen ist der Normalfall, kein Verdacht; Deploy-Rot steht im
  Actions-Lauf des Merge-Commits.
- `scripts/vercel-ignore.sh` und sein Tor bleiben als Sicherung liegen, falls
  Git-Deploy je wieder eingeschaltet wird; im Normalbetrieb läuft es nie.

### Warum der Trailer zusätzlich in den PR-Body gehört (Schritt 9)

**Denselben Trailer-Block zusätzlich als eigenen Absatz in den PR-BODY**
(unformatiert, nicht eingerückt, kein Code-Fence; BEIDE Zeilen im SELBEN
Absatz — getrennte Absätze buchten bis 15.8. still nichts, seither macht ein
halber Block den Buchungs-Lauf laut rot; der 🤖-Footer darf danach folgen):
mergt jemand per GitHub-Auto-Merge mit Standard-Squash-Text, geht der
Commit-Trailer verloren — der Workflow liest ihn dann ersatzweise aus dem
PR-Body (Lehre 14.8.2026, PR #491: Auto-Buchung blieb still, Hand-Buchung
nötig). Fällt beides aus: von Hand `plan:set <id> status=…` + committen (done ⇒
Block per Ziff. 6 in die Chronik). Realfall 5.8.2026: `QS-TOK`/
`QS-TOK-AUFRAEUMEN` blieben nach Session-Ende stundenlang `wip`, das Lagebild
zeigte falschen Bau — seither warnt `plan:next` bei wip ohne Bau-Spur, aber die
Warnung ist das Netz, nicht der Prozess.

---

## Umzug 31.8.2026 (Landung-Diät, QS-EFFIZIENZ) — Wortlaute aus SKILL.md

### §Auslieferung — Wer ausliefert: seit 17.8.2026 die CI, nicht mehr Vercel selbst

Vercel-Git-Deploys sind abgeschaltet (`vercel.json` → `git.deploymentEnabled:
false`; Entscheid David «Weg b»). Ausgeliefert wird im Job **«Deploy (Prod,
Vercel CLI)»** in `ci.yml`: ausgelöst vom `push` auf `main`, mit
`needs: [diff, tore, bau, e2e]` — Prod bekommt also nur, was die Tore
freigegeben haben. Anlass: Vercel legte bei JEDEM Push auf JEDEN Branch ein
Deployment an (auch das sofort «Canceled by Ignored Build Step»); am 16.8.2026
riss das die Free-Grenze von 100/Tag und blockierte Prod 24 h. Folgen für die
Landung: Push kostet keinen Deploy mehr (die §0-Sparregel «nur bei
Meilensteinen pushen» bleibt gute Sitte, ihr Vorfallsgrund ist entfallen) ·
kein Vercel-Check am PR (ohne Git-Deploy kein Vercel-Commit-Status; auch kein
Required Check mehr, Branch-Schutz-Edit 15.8.2026 — ein fehlender
Vercel-Kontext ist der Normalfall, kein Verdacht) · Deploy-Rot ist ein
CI-Job-Rot (steht im Actions-Lauf des Merge-Commits, nicht im
Vercel-Dashboard) · Handdeploy bleibt verboten (racender Doppel-Deploy; wenn
lokal HEAD ≠ origin/main, geht ein ANDERER Commit live als der gemergte).

### Anker-Konkordanz «§12.x» (Audit-Befund 7.8.2026, QS-AUDIT-VERWEISE)

«CLAUDE.md §12.2» = Ziff. 2 der §12-Grundregeln (Pathspec-Commits, kein
stash/amend), «§12.3» = Ziff. 3 (Deploy nur aus sauberem HEAD-Worktree).
Fahrpläne nummerieren ihre eigenen Abschnitte dateiintern ebenfalls «§12.x» —
solche Verweise sind dateigebunden, nie Reglement-Anker.

### Realfall #445 (5.8.2026) — scharfer Auto-Merge ist keine Landung

*Seit 19.9.2026 durch die Merge-Queue gegenstandslos (§Merge-Queue unten) — Wortlaut bleibt als Beleg stehen.*

16 h scharf, grün, kein Merge: bei `mergeStateStatus: BEHIND` feuert
Auto-Merge NIE von selbst. Darum nach jeder main-Landung die verbleibenden
Auto-Merge-PRs per `gh pr view <n> --json mergeStateStatus` prüfen und bei
BEHIND `gh pr update-branch` fahren.

### Realfälle zu Schritt 6 (CI-Grün)

`cancelled`/`skipped` zählen als ROT: Realfall 20.7.2026, fünf stumme
`turso-sync`-Abbrüche — GitHub färbt cancelled GRAU, der Suchindex veraltete
unbemerkt. FEHLENDE Checks zählen als PENDING, nie als grün: Realfall
4./5.8.2026 — nach einem Push fehlte die Kern-Batterie im Lauf, beinahe
ungeprüft gemerged. Ein Vercel-Rot mit echtem Build-Fehler bleibt Rot; an
landeintensiven Tagen die Kette seriell und ohne überflüssige Zwischen-Pushes
fahren (jedes `update-branch` frisst einen App-Deploy — Ära vor dem
17.8.2026; seither kostet es nur CI-Minuten).

### Realfall 15.8.2026 zu Schritt 7 (Verwaltung bündeln)

*Seit 19.9.2026: der «Sammel-Push» ist ersatzlos entfallen (§Merge-Queue unten); die Regel «Verwaltung bündeln» lebt als Doku-PR weiter.*

~15 Verwaltungs-Pushes (Doku/Plan/Buchung/wip-Marker direkt auf main) rissen
das Vercel-Tageslimit, sechs fertige PRs standen stundenlang: jeder
main-Push kostete damals einen Deploy UND warf jeden offenen Auto-Merge-PR
auf BEHIND (= je ein weiterer Deploy pro Nachzug). Daraus die Regel
«Feature einzeln landen, Verwaltung bündeln» und der Hook-Block für direkte
main-Pushes; der Ausnahmefall «Hand-Buchung nach stiller Auto-Buchung»
gehört ebenfalls in den nächsten Sammel-Push, nicht sofort auf main.

### Realfall 15./16.8.2026 zu Schritt 7b (Ketten-Wächter, F2h)

Der Landeketten-Wächter mergte Risikopfad-PRs nur bei `mergeStateStatus:
CLEAN`; nach Davids Branch-Schutz-Edit standen sie auf `UNSTABLE`
(nicht-required Vercel-Kontext rot, alle 11 Required grün) — 7 h kein Merge
(17:24→00:33), zwei weitere PRs `DIRTY` (Konflikt), ebenfalls stumm. Erst
Davids Nachfrage brachte es ans Licht.

### Historie zu Schritt 9 (Trailer im PR-Body)

Vereinfachung 15.8.2026 (§5): vorher Commit-Trailer UND PR-Body — heute 2×
still verloren, 3× nachgebessert. Der Standard-Squash-Text verliert
Commit-Trailer ohnehin (PR #491); seither liest `plan-buchung.yml` den Block
aus dem PR-Body und macht einen halben Block laut rot.

### Realfälle zur Nachkontrolle 1 (Deploy-Zuordnung)

Realfall 15./16.8.2026: 7 Merges #519–#530 waren auf main, aber nie live
(`git rev-parse --verify` schlug bei fehlendem Objekt fehl) — den Fall fängt
seither der Deploy-Job selbst (Live-Kennungs-Probe, 3 Versuche à 20 s),
zusätzlich der Wächter `pruefeBuildStand` im Prod-Smoke (#531). Historisch:
bis 17.8.2026 baute Vercel per Git-Integration; ein «Canceled by Ignored
Build Step» auf einem Code-Commit war dort ROT. Diese Deploy-Art gibt es
nicht mehr.

---

## §Merge-Queue — seit 19.9.2026 (QS-ORG-UMZUG; gemessen 19.9.2026)

**Anlass:** Umzug des Repos in die GitHub-Organisation `LexMetrik`
(`LexMetrik/Whatever`, Plan Free, public; der alte Pfad
`davidgraf95-sys/Whatever` leitet weiter, das Remote im gemeinsamen `.git`
ist umgestellt). Public ist Bedingung: privat ≈ 467 $/Monat CI
(`bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md`). Entscheid David
19.9.2026 (Chat, wörtlich): «ja mach so, alles durch die warteschlange» —
kein Admin-Bypass.

**Einstellung:** Ruleset 23699779 «Merge-Warteschlange main» — SQUASH,
ALLGREEN, max. 3 Einträge bauen/mergen, min. 1, Wartezeit 5 min,
Check-Timeout 60 min, `bypass_actors: []`. Der klassische Branch-Schutz
bleibt mit vier Required-Kontexten (Tore · Merge-Schutz · Perf-Budget ·
Browser-Smoke (Ergebnis)); `strict` ist AUS.

**Belegter Durchlauf #922/#917:** eingereiht 14:35Z/14:38Z, beide gelandet
15:05:00Z in EINEM Push-Ereignis (Kopf 9b125ce8e). `merge_group`-Lauf von
#917 = 35449369984: alle vier Required grün, inkl. «Perf-Budget» (läuft im
`merge_group`, auf `pull_request` designt geskippt); Deploy im `merge_group`
geskippt (richtig), ausgeliefert hat der Push-Lauf auf main 35450690297.
`mergeCommit.oid` == Queue-Commit == main-SHA. `--auto`: bei #917 wurde der
PR-Rerun 14:38Z grün ⇒ automatisch eingereiht, kein Nachzug, kein zweiter
PR-Lauf.

**Spekulatives Stapeln (#921):** Eintrag 2 wird auf «main + Eintrag 1»
gebaut, Eintrag 3 auf «main + 1 + 2». #921 war für sich MERGEABLE/CLEAN und
stand in der Queue auf UNMERGEABLE, weil ein Vordermann dieselbe Datei
änderte (Steuer-Doku ROADMAP.md, Gegenprüfungs-Register — der union-Treiber
gilt bei GitHub nicht).

**Squash-Nachricht (Queue-Commit 9b125ce8e, von zwei Sessions unabhängig
gemessen):** PR-Titel `(#N)` + PR-Body (Repo-Vorgabe `PR_TITLE`/`PR_BODY`;
`--subject/--body` des Merge-Kommandos wird nicht übernommen). GitHub bricht
den Body bei 72 Zeichen um und hängt `---------` + `Co-authored-by: …` als
LETZTEN Absatz an ⇒ `git log -1 --format='%(trailers)'` sieht am
Squash-Commit nur die Co-authored-by-Zeile; lange Trailer (`Gegenpruefung:
…`, mehrere Roadmap-IDs) zerfallen in Fortsetzungszeilen. Damit ist die
Aussage der früheren Formregel 5 («Squash-Merges übernehmen den PR-Body
nicht in den Commit», 2.9.2026) für die Queue überholt.

**Offen, Stand 19.9.2026:**
- Risikopfad-PRs scheitern im `merge_group` an «Merge-Schutz»/«Tore» («KEIN
  'Gegenpruefung:'-Verdikt in den Commits», Lauf 35449385978, #921).
  Wurzel-Fix baut die Parallel-Session QS-MONITOR-ROT in
  `scripts/check-merge-schutz.ts` (Zweig
  `fix/qs-monitor-rot-merge-schutz-queue`) — hier NICHT als gelöst führen,
  bis er auf main ist.
- `plan-buchung.yml` liest zuerst `%(trailers)` am Head-Commit (in der Queue
  leer), dann den PR-Body-Fallback (Subject-Endung `(#N)` → `mergeCommit.oid
  == GITHUB_SHA` → Trailer per API). Lesen trägt voraussichtlich; UNGEMESSEN
  ist, ob der Buchungs-PUSH auf main vom Ruleset noch angenommen wird. Aus
  dem Code gefolgert, nicht gemessen: der Workflow liest `git log -1`, bei
  einer Sammel-Landung (mehrere PRs, ein Push-Ereignis) also nur den
  Kopf-Commit. Darum Status im PR-Diff mitführen (Skill Ziff. 9); ob der
  Workflow zurückgebaut wird, ist offener ROADMAP-Punkt. **Abgebaut
  20.9.2026** (QS-CI-MINUTEN): `plan-buchung.yml` und `scripts/plan/
  buchung.ts` sind gelöscht — Messung 19./20.9.2026 zeigte 12 Läufe, 0
  Buchungs-Commits auf main seit der Merge-Queue.
- Kosten: der `diff`-Job setzt im `merge_group` pauschal `art=code` — jeder
  Eintrag fährt das volle Programm, auch Doku-PRs (~20+ min). Umbau auf echte
  Diff-Klassierung im `merge_group` und der «Push-Diät» auf
  «Required-Kontexte stehen am gepushten SHA auf success» läuft parallel
  (nicht gelandet).
- `scripts/landung/landung-kette.sh` ist auf Queue-Betrieb umgestellt
  (Zweig `feat/qs-org-umzug`), gegen die echte Queue UNGETESTET.
- Zwei Queue-Landungen kurz nacheinander (zwei Push-Läufe auf main):
  UNGEMESSEN. `ci.yml` belegt nur die Absicht — `cancel-in-progress` ist auf
  main aus, der Deploy-Job läuft seriell in der Gruppe `prod-deploy`. F13
  (#629) bleibt ungeklärt.

**Flake (19.9.2026):** `e2e/leser-r1-r2.e2e.ts:420` (S8) im PR-Lauf von #917
auch im Retry rot, `gh run rerun <id> --failed` grün. Die Queue prüft alle
vier Required ein zweites Mal — ein Flackern wirft den Eintrag und baut die
Nachfolger neu.

**Rückbau (§17-Gegengewicht), alle 19.9.2026:** `autozug`-Job in
`waechter.yml` (BEHIND-Nachzug, QS-MERGE-AUTOZUG; Zweig `feat/qs-org-umzug`) ·
`gh pr update-branch` als Pflicht nach jeder Landung (Ausnahme-Verbot auf
Jules-PRs bleibt, `referenz-jules.md`) · Doku-Sammel-Push per
`LEXMETRIK_MAIN_PUSH=1 git push origin main` · Auflage «`strict: true` darf
nicht fallen» (falsch geworden: `strict` ist aus, geprüft wird der landende
Commit im `merge_group`) · STRUKTUR-Rotation am SessionStart
(`LEXMETRIK_NO_ROTATE=1` in `.claude/settings.json`; fährt neu im Doku-PR der
Session) · Nachkontrolle 0 alter Fassung («kein main-Push vor grünem
Deploy-Job») · Stillstands-Schwelle 25/30 min → 60 min (Check-Timeout; der
belegte Durchlauf dauerte 27–30 min, die alte Schwelle hätte jedes Mal
gefeuert). Dependabot: nach dem Umzug neu geöffnet; Patch/Minor werden
eingereiht (`--auto` zulässig), Hauptversionen mit Begründung geschlossen.

**Werkzeug-Falle:** aus einem Worktree sperrt das Write-Werkzeug der App
Schreibzugriffe auf `<Haupt-Checkout>/.claude/` — die Notizen-Datei dort nur
per Bash anlegen (Skill `bauschritt` Station A Ziff. 4).

---

## Umzug 19.9.2026 (Queue-Umbau, Skill darf nicht wachsen) — Wortlaute aus SKILL.md

Wörtlich, Stand vor dem 19.9.2026; wo die Queue etwas überholt hat, steht es
dabei.

### §Prüfstrasse — Browser-Shards, Flacker-Wächter, Browser-Installation

- **Vier Browser-Shards** statt acht. Pflicht-Kontext im Branch-Schutz ist der Sammel-Job
  «**Browser-Smoke (Ergebnis)**», nicht die einzelnen Shards (#780, 8.9.2026): Er ist grün bei
  Shard-Erfolg oder begründetem Skip (Diff-Klasse doku/code-fern, Push-Diät) und **rot** bei jedem
  Shard-Fehler und jedem unbegründeten Skip. Grund: ein per `if:` übersprungener **Matrix**-Job
  meldet nur einen Check-Run mit unexpandiertem Namen — Shard-Kontexte würden nie gemeldet, der
  PR hinge (K12-Falle). Die Shard-**Zahl** ist damit ohne Branch-Schutz-Anpassung änderbar;
  einzige Quelle der Zahl ist die ci.yml-Matrix (`scripts/e2e-shard-anzahl.mjs`), Union-Wächter
  `check:e2e-shards`. Pflicht-Kontexte abschliessend: Tore · Merge-Schutz · Perf-Budget ·
  Browser-Smoke (Ergebnis).
- **Flacker-Wächter** `check:e2e-flake` (#779): ein Shard, der nur im Wiederholungsversuch grün
  wird, ist rot — ausser die Spec steht mit Datum/Grund in `e2e/flake-ausnahmen.json` (Verfall
  30 Tage). Flackern wird also einmal angeschaut, nie stillschweigend weggeklickt.
  **Melde-Modus bis 22.9.2026** (`e2e/flake-modus.json`): Messung 8.9.2026 zeigte 6 verschiedene
  flackernde Specs über drei Läufe (je Lauf andere) — bis zum Stichtag nur `::warning`, danach
  automatisch hart; fehlende oder kaputte Modus-Datei ⇒ hart. Auftrag bis dahin: Wurzel je Spec
  messen (Fehlerbuch FAHRPLAN-OFFENE-BEFUNDE §4), nicht Ausnahmen sammeln.
- **Browser-Installation** läuft in beiden Playwright-Jobs über `scripts/ci/playwright-install.sh`
  (#785): zwei Versuche mit Prozessbaum-Kill, `dpkg --configure -a` und Warten auf die
  dpkg-Sperre — Anlass 8.9.2026: eine Timeout-Waise `apt-get` machte jeden Retry wirkungslos.
  Ein 403 beim Ablegen des Balancing-Reports färbt einen bestandenen Shard nicht mehr rot.
  Ein roter Shard ohne rote Tests ⇒ zuerst den Schritt lesen, nicht die Suite verdächtigen.

### §Pflicht-Kontexte umstellen, ohne fremde PRs zu blockieren

- **Pflicht-Kontexte umstellen, ohne fremde PRs zu blockieren** (Lehre der Parallel-Session
  8.9.2026: zwei Umstellungen vor der Landung des einführenden PR liessen #774 je ~1 h hängen):
  den neuen Job zuerst so einführen, dass der PR alten UND neuen Kontext meldet; Branch-Schutz
  erst umstellen, wenn dieser PR grün und mergebereit ist, sofort mergen, dann **alle** offenen
  PRs per `gh pr update-branch` nachziehen. Fenster ≈ Minuten statt Stunden.

*Seit 19.9.2026:* «sofort mergen» heisst einreihen; ein Pflicht-Nachzug per
`gh pr update-branch` existiert nicht mehr. Offene PRs brauchen nach einer
Umstellung einen frischen PR-Lauf, der den neuen Kontext meldet (main
einziehen + push) — unter der Queue UNGEMESSEN.

### Session-Ende — Beleg 8.9.2026 und Lehre 18.9.2026 (eigener Worktree)

Beleg: Aufräumen 8.9.2026 fand 22 Remote-Branches, 3 Worktrees, 5 Dependabot-PRs
(seit 14.8.), einen fertigen, nie eröffneten Risikopfad-Branch (9 Commits) und
einen Autopilot-Entwurf ohne Entscheid — niemand war zuständig. Regel:

5. **Den EIGENEN Worktree zuletzt entfernen — oder gar nicht** (Lehre
   18.9.2026, W2·5m-LESER-V3): `CLAUDE_PROJECT_DIR` der laufenden Session
   zeigt weiter auf den gelöschten Pfad, die Hooks lösen nicht mehr auf
   (`can't open file '…/.claude/hooks/tor-schutz.py'`) — und damit stehen
   Bash UND Read still, die Session kann sich nicht mehr selbst helfen.
   Reihenfolge also: Branches lokal + remote, `git worktree prune`,
   Doku-Push, Nachkontrolle, Bericht — und **erst als allerletzte Handlung**
   der eigene Worktree. Steckt eine Session schon fest: den Pfad einmal neu
   anlegen (`git worktree add --detach <pfad> main`), das stellt die Hooks
   wieder her. Nie Ersatz-Hooks schreiben — ein Durchlass-Stub nimmt die
   Wächter weg, statt sie zu reparieren.

*Seit 19.9.2026:* «Doku-Push» in der Reihenfolge = Doku-PR einreihen und
landen lassen.

### Nachkontrolle 1b und 8 — Anlass-Wortlaut

1b. **Aufräum-Summenzeile im Deploy-Log lesen** (seit 8.9.2026): der letzte
   Schritt «Vercel — alte Stände aufräumen» loggt
   `Vercel-Aufräumen: N gelöscht · M behalten · K übrig`. Er trägt
   `continue-on-error: true`, ist also NIE am Job-Rot erkennbar — fehlt die
   Zeile oder steht dort ein `::warning::`, ist das ein §17-Fall: das Team
   hängt an der Hobby-Grenze von 10 GB Deployment Storage (Anlass 8.9.2026:
   261.91 GB, ein Stand = 738 MB), und ohne diesen Lauf läuft sie in Tagen
   wieder voll. Nicht liegen lassen. Offen seit 8.9.2026: 48 h nach der ersten
   Landung die Vercel-Nutzungsseite (Deployment Storage, war 262 GB gegen
   10 GB Hobby-Grenze) messen; bleibt sie über 10 GB, ist der nächste Schritt
   das Auslagern der 455 MB Korpus-Dateien aus jedem Stand (Roadmap-Eintrag
   anlegen, sobald der Deckel Luft hat).

8. **Projektionen nachziehen:** `npm run projektionen` (Zähler/Feed/Historie +
   `gen:e2e-shards`, seriell) — vor dem Öffnen eines PR, der Quelldaten
   ändert, und nach einer Landekette mit mehreren Daten-PRs. Beleg: 5 CI-Läufe
   verloren #694/#695/#689, 5.9.2026. Das Datenhaltungs-Manifest ist bewusst
   NICHT dabei: `datenhaltung:manifest` pinnt den Ist-Zustand vor der
   Drift-Prüfung — nur nach rotem `check:datenhaltung`, mit Begründung im
   Commit (Gegenprüfung #717, §6.7).
