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

*(Anlass 3./4.8.2026: Archiv §Landungs-Rolle.)*

### Scharfer Auto-Merge bei `BEHIND` (Schritt 3.2)

*Seit 19.9.2026 durch die Merge-Queue gegenstandslos (§Merge-Queue unten) — Wortlaut bleibt als Beleg stehen.*

(Wortlaut der überholten Regel «Scharfer Auto-Merge ist keine Landung» bei `BEHIND`, Realfall #445 5.8.2026: Archiv §Scharfer-Auto-Merge.)

### `cancelled`/`skipped` und die designte Ausnahme (Schritt 6)

**`cancelled` und `skipped` zählen als ROT**, nicht als «nicht rot» — ein
abgebrochener Lauf hat nichts bewiesen. (Realfall 20.7.2026: Archiv §cancelled-skipped/1.)
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
(Tore + Bau + letzter Playwright-Shard). (Realfall 4./5.8.2026: Archiv §cancelled-skipped/2.)

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

(Die Stände 5.8. und 16.8.2026 dieses Abschnitts — Ignored Build Step, Admin-Bypass-Interim gestrichen, Vercel-Kontext nicht mehr Required — sind durch den Stand 17.8.2026 überholt; Wortlaut: Archiv §Vercel-Tageslimit-bis-16.8.)

**Stand 17.8.2026 — alles darüber ist Historie.** Anlass: Vorfall #540 (16./17.8.2026, Prod 24 h blockiert; Archiv §Vercel-Tageslimit-17.8). Wurzel-Fix (Entscheid David «Weg b»):
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

*(Seit 20.9.2026 überholt: die Auto-Buchung `plan-buchung.yml` ist abgebaut; geltende Form: Skill `landung` Ziff. 9 und Formregel 5. Wortlaut der früheren Begründung samt Realfall 5.8.2026 `QS-TOK`: Archiv §Trailer-PR-Body.)*

---

## Umzug 31.8.2026 (Landung-Diät, QS-EFFIZIENZ) — Wortlaute aus SKILL.md

### §Auslieferung — Wer ausliefert: seit 17.8.2026 die CI, nicht mehr Vercel selbst

Vercel-Git-Deploys sind abgeschaltet (`vercel.json` → `git.deploymentEnabled:
false`; Entscheid David «Weg b»). Ausgeliefert wird im Job **«Deploy (Prod,
Vercel CLI)»** in `ci.yml`: ausgelöst vom `push` auf `main`, mit
`needs: [diff, tore, bau, e2e]` — Prod bekommt also nur, was die Tore
freigegeben haben. Anlass: Vorfall 16.8.2026, Prod 24 h blockiert (Archiv §Auslieferung-Anlass). Folgen für die
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

### Realfall 15.8.2026 zu Schritt 7 (Verwaltung bündeln)

*Seit 19.9.2026: der «Sammel-Push» ist ersatzlos entfallen (§Merge-Queue unten); die Regel «Verwaltung bündeln» lebt als Doku-PR weiter.*

(Realfall 15.8.2026 — Herkunft der Regel «Feature einzeln landen, Verwaltung bündeln» und des Hook-Blocks für direkte main-Pushes: Archiv §Realfall-Schritt7.)

### Realfall 15./16.8.2026 zu Schritt 7b (Ketten-Wächter, F2h)

(Realfall 15./16.8.2026, 7 h stumm: Archiv §Realfall-7b; Regel: Skill `landung` Ziff. 7b, Skill `lehren` F2h.)

### Realfälle zur Nachkontrolle 1 (Deploy-Zuordnung)

Seither fängt den Fall der Deploy-Job selbst (Live-Kennungs-Probe, 3 Versuche à 20 s) plus der Wächter `pruefeBuildStand` im Prod-Smoke (#531); die Vercel-Git-Deploy-Art gibt es seit 17.8.2026 nicht mehr (Realfall 15./16.8.2026: 7 Merges #519–#530 nie live — Archiv §Realfall-Nachkontrolle-1).

---

## §Merge-Queue — seit 19.9.2026 (QS-ORG-UMZUG; gemessen 19.9.2026)

**Anlass:** Umzug des Repos in die GitHub-Organisation `LexMetrik` (`LexMetrik/Whatever`, Plan Free, public; privat ≈ 467 $/Monat CI) — Entscheid David 19.9.2026 «alles durch die warteschlange», kein Admin-Bypass (Wortlaut: Archiv §Merge-Queue-Anlass).

**Einstellung:** Ruleset 23699779 «Merge-Warteschlange main» — SQUASH,
ALLGREEN, max. 3 Einträge bauen/mergen, min. 1, Wartezeit 5 min,
Check-Timeout 60 min, `bypass_actors: []`. Der klassische Branch-Schutz
bleibt mit vier Required-Kontexten (Tore · Merge-Schutz · Perf-Budget ·
Browser-Smoke (Ergebnis)); `strict` ist AUS.

**Belegter Durchlauf #922/#917 (19.9.2026):** Gut-Pfad gemessen, beide Einträge in EINEM Push gelandet; Läufe und SHAs im Wortlaut: Archiv §Merge-Queue-Durchlauf.

**Spekulatives Stapeln (#921):** Eintrag 2 wird auf «main + Eintrag 1» gebaut; gleiche Datei wie ein Vordermann ⇒ UNMERGEABLE (Belegtext: Archiv §Merge-Queue-Stapeln).

**Squash-Nachricht (Queue-Commit 9b125ce8e, von zwei Sessions unabhängig
gemessen):** PR-Titel `(#N)` + PR-Body (Repo-Vorgabe `PR_TITLE`/`PR_BODY`;
`--subject/--body` des Merge-Kommandos wird nicht übernommen). GitHub bricht
den Body bei 72 Zeichen um und hängt `---------` + `Co-authored-by: …` als
LETZTEN Absatz an ⇒ `git log -1 --format='%(trailers)'` sieht am
Squash-Commit nur die Co-authored-by-Zeile; lange Trailer (`Gegenpruefung:
…`, mehrere Roadmap-IDs) zerfallen in Fortsetzungszeilen. Damit ist die
Aussage der früheren Formregel 5 («Squash-Merges übernehmen den PR-Body
nicht in den Commit», 2.9.2026) für die Queue überholt.

**Offen, Stand 19.9.2026** (zeitgebundene Liste; Wortlaut samt Stand-Vermerken wie «Abgebaut 20.9.2026»: Archiv §Merge-Queue-Offen). Weiterhin so geführt: zwei Queue-Landungen kurz nacheinander UNGEMESSEN, F13 (#629) ungeklärt.

**Flake (19.9.2026, #917):** Die Queue prüft alle vier Required ein zweites
Mal — ein Flackern wirft den Eintrag und baut die Nachfolger neu.

**Rückbau (§17-Gegengewicht), alle 19.9.2026:** `autozug`-Job · Pflicht-`update-branch` · Doku-Sammel-Push · Auflage «`strict: true`» · STRUKTUR-Rotation am SessionStart · alte Nachkontrolle 0 · Stillstands-Schwelle 25/30 → 60 min (Wortlaut mit Gründen: Archiv §Merge-Queue-Rueckbau).

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
  **Melde-Modus bis 22.9.2026** (`e2e/flake-modus.json`, dort Grund und Messung 8.9.2026): bis
  zum Stichtag nur `::warning`, danach automatisch hart; fehlende/kaputte Modus-Datei ⇒ hart.
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

Beleg 8.9.2026 (Archiv §Session-Ende-Beleg). Regel:

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
