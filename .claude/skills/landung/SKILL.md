---
name: landung
description: Verwenden, wenn ein fertiger Stand nach main soll — Trigger «landen», «Landung», «PR mergen», «einsammeln», «rebasen auf main», «Merge-Kette abarbeiten», «einreihen», «Merge-Queue», «Push», «Deploy», «Live-Gang», «bring das auf Prod», «Release-Stand prüfen». Kodifiziert §12 (serielle Landung, Merge-Treiber) UND §9 (Merge nach main IST der Deploy, ausgeliefert vom CI-Job «Deploy (Prod, Vercel CLI)»).
---

# Landung nach main = Deploy (§12 + §9, «Weg 1»)

**Dieser Skill trägt §12 UND §9** (A4-Umzug 25.7.2026). Bei Widerspruch zu
einer älteren §9-/§12-/deploy-check-Erinnerung gewinnt **dieser Text**.

*Diät 31.8.2026/19.9.2026: die REGELN hier sind vollzählig; Anlässe und
Historie stehen wörtlich in `referenz-ci.md`, `referenz-ausnahmen.md`,
`referenz-jules.md`.*

**Kernmodell (Weg 1):** **Der Merge nach `main` IST der Deploy** — kein
separater Handschritt. Die gesamte §9-Sorgfalt (Tore grün, Bug-Check, Golden
byte-gleich, doppelt verifiziert) liegt zwingend **VOR dem Einreihen in die
Merge-Queue**; übergeordnet §1, §6, §8. **`main` nimmt nur die Queue** — kein
direkter Push, kein Bypass (Entscheid David 19.9.2026, Chat: «alles durch die
warteschlange»). Generierte Dateien nie von Hand mischen.

**Wer ausliefert: der CI-Job «Deploy (Prod, Vercel CLI)»** auf `push: main`
(`needs: [diff, tore, bau, e2e]` — Prod bekommt nur, was die Tore freigaben;
im `merge_group`-Lauf ist er designt geskippt).
Vercel-Git-Deploys sind abgeschaltet; Folgen: Push kostet keinen Deploy, es
gibt keinen Vercel-Check am PR (fehlender Vercel-Kontext = Normalfall),
Deploy-Rot ist ein CI-Job-Rot, **Handdeploy bleibt verboten** (Ausnahmen:
`referenz-ausnahmen.md`). Anlass + Details: `referenz-ci.md` §Auslieferung.

## Merge-Queue auf `main` (seit 19.9.2026, QS-ORG-UMZUG)

Repo `LexMetrik/Whatever` (Organisation, Plan Free; **muss public bleiben** —
privat ≈ 467 $/Monat CI, `bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md`).
Ruleset 23699779: SQUASH · ALLGREEN · max. 3 Einträge · Wartezeit 5 min ·
Check-Timeout 60 min · kein Bypass; im Branch-Schutz ist `strict` AUS.
Belege: `referenz-ci.md` §Merge-Queue.

- **`gh pr merge <n> --squash` REIHT EIN**, mergt nicht sofort; `--auto
  --squash` reiht selbst ein, sobald die PR-Checks grün sind. BEHIND ist kein
  Hindernis mehr; der frühere Pflicht-Nachzug ist ersatzlos weg. **Falle:**
  auf einem noch nicht grünen PR weist `gh` das Kommando NICHT ab, sondern
  schärft still Auto-Merge (cli `merge.go`; belegt #922) — zurück mit
  `--disable-auto`.
- **Ablauf:** ein `merge_group`-Lauf prüft PR + aktuellen main (+
  Vordermänner) auf `gh-readonly-queue/main/pr-<n>-<sha>` gegen alle vier
  Required; bei Grün wird main auf GENAU diesen Commit vorgespult
  (`mergeCommit.oid` = Queue-Commit) — mehrere Einträge auch in EINEM Push.
- **Die Queue stapelt spekulativ** (Eintrag 2 = main + Eintrag 1): gleiche
  Datei wie ein Vordermann ⇒ UNMERGEABLE, auch wenn der PR für sich CLEAN ist
  (Ziff. 3.2).
- **PR-Titel = Squash-Betreff:** der Commit auf main trägt den PR-Titel. Ändert
  der PR Test-Dateien, darf der Titel-Typ nicht `refactor` sein (§6.3) — sonst
  fällt er im `merge_group`-Lauf an `check:testtreue` (Beleg #1023, 23.9.2026;
  seither meldet das Tor es schon im PR-Lauf).
- **Queue-Abfrage** (QUEUED · AWAITING_CHECKS · MERGEABLE · UNMERGEABLE ·
  LOCKED):
  `gh api graphql -f query='{repository(owner:"LexMetrik",name:"Whatever"){mergeQueue(branch:"main"){entries(first:10){nodes{state position pullRequest{number}}}}}}'`
- **Rauswurf:** ein roter oder flackernder `merge_group`-Lauf wirft den
  Eintrag und baut die Nachfolger neu. ERST den Lauf lesen, dann neu
  einreihen — nie blind.
- **Kosten:** der `merge_group`-Lauf klassiert den Diff des Eintrags wie der
  PR-Lauf (reine Doku ohne Bau/Browser-Tests, ~1 min; Code voll, ~20+ min).
  Ein übersprungenes «Perf-Budget» zählt in der Queue als erfüllt (gemessen
  19.9.2026, #931, Lauf 35456359531). Doku trotzdem bündeln — gleiche
  Steuer-Datei wie ein Vordermann ⇒ UNMERGEABLE.

## §12 · Isolation — die Grundregeln vor jeder Landung

1. **Zweite und jede weitere Session arbeitet in einem eigenen git-Worktree**
   und bringt Ergebnisse als Commits zurück. Fremder WIP in `git status` ⇒
   **vor** Struktur-Arbeiten in einen Worktree wechseln.
2. **Im geteilten Verzeichnis zwingend:** Commits nur mit explizitem Pathspec
   (`git commit -m "…" -- <dateien>`) · **kein** `git stash` bei fremdem WIP ·
   **kein** `git commit --amend` (Hook blockt) · nach jedem Commit die
   `--stat`-Dateizahl gegen die eigene add-Liste prüfen.
3. **Deploys nie aus dem Arbeitsverzeichnis** — einziger Fall: Ausnahme
   «manueller Deploy» (`referenz-ausnahmen.md`).
4. **Merge-Treiber-Politik** (`.gitattributes`, aktiv via `prepare` →
   `scripts/git-setup.sh`): Append-Register `merge=union`; generierte
   Projektionen (`daten-manifest.json`, `*.generated.ts`,
   rechtsprechung-Indexe) `merge=regen` (eigene Seite behalten, **Generator
   neu laufen**). `golden/*.json` und `public/normtext/**` bewusst OHNE
   Treiber — dort SOLL der Konflikt anhalten. `rerere` aktiv. Treiber greifen
   nur lokal, nie beim GitHub-Server-Merge.
   *(Anker-Konkordanz «§12.x»: `referenz-ci.md`.)*

---

## 0 · Vorbedingungen

Einmal pro Clone/Worktree: `npm install` (setzt Treiber + rerere), sonst
`bash scripts/git-setup.sh`. Jedes Tor-Kommando NACKT (keine Pipes — Hook
blockt sie), volle Ausgabe lesen, Exit-Code prüfen. Dann:

1. `git status` — fremden WIP identifizieren; §12 Ziff. 2 ist das Minimum.
2. Review-Schrott räumen: `find src -name '__*'` muss leer sein.
3. Untracked Root-Ballast (PDFs) nie committen (Gefahr: `git add -A`).

## 1 · Tore vor dem Merge (alle grün, volle Ausgabe)

```
npx tsc -b
npm test
npm run lint        # nie tail/Pipe
npm run build
npm run golden:vergleich   # byte-gleich; Exit-Code prüfen!
npm run check
npm run test:e2e           # braucht dist; startet vite preview selbst
npm run check:perf-budget  # liest dist, Chrome-frei
```

- **`test:e2e` und `check:perf-budget` sind zwingend vor jedem Merge nach
  main** und bewusst nicht im schnellen `gate` — Begründung: `referenz-ci.md`.
- Golden-Abweichungen ERST den interleaved Commits der Parallel-Session
  zuordnen, dann über Neu-Schreiben entscheiden (nur deklariert).
- Bei zusätzlichem `check:netz`/`check:zitate`: vorher Anker-Count der
  /tmp-Fedlex-Caches verifizieren (Workflow-Agents überschreiben sie).

## 2 · Bug-Check §9 (nach Diff-Klasse, 15.8.2026)

- **Produkt-/Werkzeug-Diff** (`src/**`, `scripts/**`, `.github/**`,
  `vercel.json`, `package.json`): unabhängige Review-Agents über das
  Deploy-Delta (Code-Lupe + empirische Repros; grosse Deltas: 6 Strang-Finder
  × 2 adversariale Lupen). Bestätigte Befunde fixen, Regressionstests dazu,
  Tore aus Schritt 1 erneut.
- **Reiner Doku-/Plan-/Test-Diff** (`*.md`, `fahrplaene/`, `bibliothek/`,
  `.claude/`, `src/tests/**` ohne `src/lib`): **kein** Agenten-Bug-Check —
  die Tore sind die Prüfung (15.8.: ~40–80k Token je Leerprüfung).
  Risikopfad-Anteile: Gegenprüfung bleibt eigene Pflicht (unten).

## 3 · Serielle Landung — strikt der Reihe nach, EIN Kommando aufs Mal

1. **Landungs-Rolle ansagen — nur bei sichtbarer Parallel-Session** (fremder
   wip/Worktree/Branch/PR auf gleicher Fläche): PR-Kommentar «Landung
   übernommen — <Session>»; wer einen fremden jüngeren Landungs-Kommentar
   sieht, merged NICHT. Ein-Session-Betrieb: entfällt.
2. **Kollisionen sichten:** `gh pr list --state open` UND die Queue-Abfrage
   (oben). Ändert der PR eine Datei, die ein offener oder bereits
   EINGEREIHTER PR auch ändert ⇒ erst den Vordermann landen lassen, dann
   Ziff. 3–6, dann einreihen — sonst UNMERGEABLE in der Queue (Beleg #921).
   Nie zwei kollidierende PRs gleichzeitig.
3. **origin/main einziehen:** `git fetch origin`, dann Merge/Rebase in den
   Feature-Branch (lokale Treiber greifen).
4. **Konflikte — nie von Hand mischen:** generierte Datei ⇒ **Generator neu
   laufen** (`daten-manifest.json` → `npm run datenhaltung:manifest`;
   `*.generated.ts` → Banner-`gen:*`; rechtsprechung-Indexe →
   entscheide-Pipeline). Append-Register: union hat beide Seiten — nur
   prüfen. **GitHub kennt den union-Treiber nicht:** jeder gelandete
   Risikopfad-PR hängt eine Register-Zeile an, danach meldet GitHub die
   übrigen Risiko-PRs DIRTY und startet keine CI — also nach jeder Landung
   `origin/main` lokal in den nächsten Zweig mergen, Tore, push, dann erst
   einreihen — die Queue heilt das nicht, sie wirft den Eintrag (15.9.2026,
   #888–#892 in Serie; 19.9. #921). **Nur für Risikopfad-PRs (Register-Zeile)
   und PRs mit generierten Dateien; überschneidungsfreie Doku-/Code-PRs
   brauchen ihn nicht** — die Queue baut main + Eintrag selbst (20.9.2026;
   4 von 10 Rauswürfen `merge_conflict`, alle an geteilten Dateien).
   `golden/*.json`: von Hand, dann `npm run golden`, Byte-Diff bewusst
   bestätigen. `public/normtext/**`: Konflikt SOLL anhalten ⇒ Gegenprüfung.
   Steuer-Doku (STRUKTUR/ROADMAP/FAHRPLAN/INDEX): von Hand, beide Beiträge.
5. **Gate:** `npm run gate` grün — erzwingt die Regeneration aus Schritt 4.
6. **CI-Grün verifizieren — zweimal:** vor dem Einreihen Push +
   `gh pr checks <nr> --watch` bis grün; nach dem Einreihen den
   `merge_group`-Lauf bis MERGED verfolgen (pollen, Ziff. 7c).
   **`cancelled`/`skipped` zählen als ROT**; einzige Ausnahme: dokumentiert
   designter konditionaler Skip mit anderweitig belegter Substanz (heute:
   «Perf-Budget» auf `pull_request` — läuft im `merge_group`; «Deploy» im
   `merge_group`). **FEHLENDE Checks zählen als PENDING, nie als grün** —
   nach dem Push die Präsenz der Kern-Batterie (Tore + Bau +
   letzter Shard) verifizieren. Keine überflüssigen Zwischen-Pushes.
   Sonderfälle (kein pull_request-Lauf, Grenzfall-Skip) + Wortlaute:
   `referenz-ci.md`.

6b. **Daten-/Extraktions-PRs: Identitätsbeleg.** Neue Entitäten vor Live-Gang:
   Stichprobe **n ≥ 10** gegen die **amtliche Quelle**, Trefferquote im PR.
   Belege sind Identitäts-Treffer mit Wortgrenze, nie Substring (Vorfall
   PR #309 passierte genau hier).

7. **Einreihen = Deploy — die eine Regel:** **Nicht-Risiko** ⇒ `gh pr merge
   <nr> --squash --auto`, sobald Ziff. 0–2 durch sind (grüne CI ersetzt sie
   nicht); **Risikopfad** ⇒ nach Verdikt von Hand `gh pr merge <nr> --squash`,
   nie `--auto`. Ein roter PR wird nie eingereiht: rot = Stopp, kein «mergen
   und nachbessern».
   **Push auf den Feature-Branch ist stehend freigegeben** (David 2.7.2026);
   der Live-Gang-Entscheid ist die Merge-Freigabe. **Direkte main-Pushes gibt
   es nicht mehr** — auch nicht gebündelt am Session-Ende (Ruleset + Hook; der
   Auto-Modus-Klassifikator lehnt `git push origin …:main` als CI-Bypass ab).
   **Feature einzeln landen, Verwaltung bündeln** (David 15.8.2026): sie fährt
   im Feature-PR mit (Ziff. 9), Rest-Doku am Session-Ende als EIN Doku-PR
   (`bauschritt` Station E). **Verboten:** jeder Handdeploy und jeder zweite
   Deploy-Pfad (Race — Abschnitt unten). Historie/Realfälle: `referenz-ci.md`.

7c. **Die Kette als Werkzeug:** `scripts/landung/landung-kette.sh <log> <PR>…`
   reiht seriell ein und pollt `mergeQueueEntry.state` bis MERGED
   (Queue-Umbau 19.9.2026; Gut-Pfad real belegt mit #919, MERGED
   `661612cea` — die Halte-Pfade sind nur simuliert). Sie
   hält an bei rotem PR und bei UNMERGEABLE/LOCKED/verschwundenem Eintrag,
   reiht nie selbst neu ein und löscht den Zweig erst nach MERGED. Zwei
   Fallen sind darin verdrahtet: `gh run watch` bricht vorzeitig mit Exit 1
   ab — Status pollen (`gh run view --json status`), nie watchen; und «kein
   CI-Lauf» heisst zuerst «Konflikt?» (DIRTY, Formregel 3; L-O8, 7.9.2026).
   Die Ziff. 0–2 ersetzt sie nicht.

7b. **Ketten-Wächter (F2h):** vor dem Hand-Einreihen eines Risikopfad-PR
   auf «alle Required grün» prüfen (`gh api …/protection/
   required_status_checks`), nie auf `mergeStateStatus: CLEAN`;
   `DIRTY`/`UNKNOWN` > 2 Runden, UNMERGEABLE oder verschwundener Eintrag ⇒
   laut melden; Eintrag > 60 min (Check-Timeout) ohne Ergebnis ⇒ Stillstand
   melden (Realfall 7 h: `referenz-ci.md`).

8. **Nächste PR:** mit Überschneidung erst, wenn der Vordermann auf main ist
   (Ziff. 3.2, zurück zu Schritt 1); überschneidungsfreie dürfen
   nebeneinander in der Queue stehen.

9. **Schritt-Status schliessen — wip verlässt die Session nie.** **Der PR,
   der den Schritt abschliesst, trägt den Status im Diff:** `plan:set --
   <id> status=done|ready|parked` + `check:plan`, im eigenen PR committet.
   Keine Auto-Buchung mehr: `plan-buchung.yml` ist am 20.9.2026 abgebaut
   (QS-CI-MINUTEN, 0 Buchungs-Commits in 12 Läufen seit der Merge-Queue
   19.9.2026 — der Status fuhr da schon im PR mit). Zuordnung weiter per
   Trailer **im PR-BODY**, eigener letzter Absatz, unformatiert: `Roadmap:
   <ID>` — kein `Roadmap-Status:` mehr nötig, auch wenn der Schritt `wip`
   bleibt. Form: Skill `auftrag` Ziff. 5, Formregel 5 unten; Historie:
   `referenz-ci.md`.

### Auto-Merge ist auf Risiko-Pfaden gesperrt

`--auto` ist auf Risiko-Pfaden (`istRisikoPfad()` in
`scripts/gegenpruefung/kern.ts`) gesperrt, weil es nur den Stand beim
Aktivieren prüft (Regel: Ziff. 7). Das Verdikt braucht prüfbare Form **und**
Zuwachs im committeten Gegenprüfungs-Register — ein Trailer allein ist
Behauptung. Maschinell dreifach: Required-Check
«Merge-Schutz» · derselbe Check im Hook vor jedem Merge-Kommando ·
`check:gegenpruefung` in `npm run gate`. Erzwungen durch Vorfall PR #309
(elf erfundene Amtsträger:innen ~1 h auf Prod).
**Verdikt im Queue-Squash (behoben 19.9.2026, #925 `95cb5a712`):** Das
`Gegenpruefung:`-Verdikt gehört in den Trailer-Block des **PR-BODY**. Der
Queue-Squash bricht ihn bei 72 Zeichen um und hängt die Co-author-Sektion
an; `scripts/gegenpruefung/squash-trailer.ts` liest das seither (Anlass: Lauf
35449385978, #921 rot im `merge_group`). Echt-Beleg: #921 gelandet
`2db154675` (19.9.2026). Risikopfad-PRs weiter strikt einzeln einreihen —
jeder hängt eine Register-Zeile an (Ziff. 3.4).
**Falle (gemessen 19.9.2026, #923, Lauf 35458509735):** lokales
`check:merge-schutz` liest die ZWEIG-Commits, die Queue den Squash aus
PR-Titel + PR-Body — ein im Body verkürztes Verdikt («… — keine», Befund-Teil
< 15 Zeichen) ist lokal grün und fällt in der Queue. Das Verdikt im PR-Body
muss dieselbe volle Form haben wie im Commit; vor dem Einreihen den Body
gegenlesen (Vorab-Check: ROADMAP `QS-CI-MINUTEN`).

### Ausnahmefall manueller Deploy · Ausreden-Tabelle → referenz-ausnahmen.md

Wer einen manuellen Deploy erwägt ODER sich beim Rationalisieren eines Red
Flags ertappt, liest ZUERST `referenz-ausnahmen.md` (zwei Ausnahme-Prädikate,
belegte Ausreden, Umgehungs-Aufzählung «Buchstabe = Geist»).

### Fremde PRs (Jules) — vor der Reihe, nicht in ihr

Ein PR eines fremden Agenten wird erst geprüft, dann eingereiht — Checkliste
(8 Schritte + Entwurfs-Antwort) wörtlich in `referenz-jules.md`, dort lesen,
sobald die Erkennung anschlägt:

```
gh pr list --state open --json number,headRefName \
  -q '.[] | select(.headRefName|test("[0-9]{19}|^jules[-/]"))'
```

Nie Auto-Merge, nie `gh pr update-branch` auf einem Jules-PR (Beleg #710);
Landung als Cherry-Pick.

### Red Flags — STOP

- `npx vercel --prod` ohne erfülltes Ausnahme-Prädikat (ausdrückliche
  Anordnung ODER nachweislich ausgefallener Git-Deploy).
- `/tmp/lexmetrik-deploy` für einen Normalfall.
- `--auto` vor Abschluss der Schritte 0–2.
- Direkter main-Push oder Bypass-Wunsch (Admin-Bypass, Ruleset lockern,
  Klassifikator/Hook umgehen) — auch «nur für Doku».
- Blindes Neu-Einreihen nach einem Rauswurf, ohne den Lauf gelesen zu haben.
- David separat um Push-Bestätigung bitten.
- Einreihen bei rotem Schritt-1-Tor oder offenem Schritt 2.
- Berufung auf die gestrichene §9-Zeile «Prod: `npx vercel --prod`».
- Nach dem Merge «zur Sicherheit» manuell nachdeployen.

### Prüfstrasse seit 8.9.2026 (QS-CI-MINUTEN, Sparplan M1–M5)

Anlässe im Wortlaut: `referenz-ci.md` §Umzug 19.9.2026.

- **Pflicht-Kontexte abschliessend:** Tore · Merge-Schutz · Perf-Budget · Browser-Smoke
  (Ergebnis). Der Sammel-Job (#780) ist grün bei Shard-Erfolg oder begründetem Skip, **rot**
  bei jedem Shard-Fehler und unbegründeten Skip; Shard-Zahl nur in der ci.yml-Matrix
  (`scripts/e2e-shard-anzahl.mjs`, Wächter `check:e2e-shards`).
- **Pflicht-Kontexte umstellen:** vorher `referenz-ci.md` §Pflicht-Kontexte lesen (Lehre
  8.9.2026, #774: erst alten UND neuen Kontext melden, dann Branch-Schutz umstellen; der
  Nachzug offener PRs ist unter der Queue UNGEMESSEN).
- **Flacker-Wächter** `check:e2e-flake` (#779): ein Shard, der nur im Wiederholungsversuch grün
  wird, ist rot — ausser die Spec steht mit Datum/Grund in `e2e/flake-ausnahmen.json` (Verfall
  30 Tage). **Melde-Modus bis 22.9.2026** (`e2e/flake-modus.json`), danach automatisch hart;
  fehlende/kaputte Modus-Datei ⇒ hart. Wurzel je Spec messen
  (Fehlerbuch FAHRPLAN-OFFENE-BEFUNDE §4), nicht Ausnahmen sammeln.
- **Browser-Installation** über `scripts/ci/playwright-install.sh` (#785). Ein roter Shard ohne
  rote Tests ⇒ zuerst den Schritt lesen, nicht die Suite verdächtigen.
- **Reine Doku-PRs** (Diff-Klasse «doku») überspringen `bau` und `e2e`; die Doku-Tore laufen
  weiter. Ein per `if:` übersprungener Pflicht-Job gilt bei GitHub als erfüllt — deshalb
  bleibt `tore` immer aktiv.
- **Push auf `main`** läuft nur `bau` + `deploy` («Push-Diät»), wenn der `diff`-Job den
  Commit als schon geprüft belegt findet — sonst volles Programm. Beleg seit 19.9.2026: ein
  grüner `merge_group`-Lauf am GEPUSHTEN SHA mit allen vier Required-Kontexten (fällt die
  Queue weg, gibt es keinen solchen Lauf ⇒ von selbst Volllauf); massgeblich: `ci.yml`-Kopf.
- **Dependabot** läuft monatlich ohne Auto-Rebase; Einordnung je Session: «Session-Ende» Ziff. 3.
- Nachmessung Sparplan fällig **8.10.2026** (Datei siehe Merge-Queue-Kopf; gleiche Methode:
  Jobs je Lauf aufgerundet; Ausgangswert 61 381 min/30 Tage).

### Session-Ende: Bau-Flächen hinterlassen keine Zweige (Lehre 8.9.2026)

Beleg: `referenz-ci.md` §Umzug 19.9.2026. Regel:
1. **Eigene Worktrees und Branches** verlassen die Session nur gemergt oder
   gelöscht; fertige Arbeit ohne Landung = PR (Risikopfad: ohne `--auto`,
   Gegenprüfung nennen). Handgriff: `npm run aufraeumen:git`
   (`-- --ausfuehren` räumt ab) — **nur LOKAL**: Remote-Zweige ungelandeter
   oder geparkter Arbeit von Hand (`git push origin --delete <branch>`),
   gelandete löscht GitHub selbst. 21.9.2026: 20 Branches, 18 leere Hüllen
   (7 gelandet, 5 `claude/*`, 6 `worktree-agent-*`), 2 ungelandet ohne PR.
   Diese Ziffer sah nur EIGENE Flächen — daher Anzeige + Befehl (`lehren` 5).
2. **Geparkte Stände sind Tags, keine Branches:** `git tag
   archiv/<slug>-<datum> <sha>` pushen, Branch löschen.
3. **Dependabot je Session einordnen:** Patch/Minor einreihen (`gh pr merge
   <n> --squash`, `--auto` zulässig — kein Risikopfad, kein Nachzug),
   Hauptversionen mit Begründung schliessen — nie liegen lassen (8.9.2026:
   113 CI-Läufe aus 13 Zweigen).
4. **Autopilot-/Entwurfs-PRs** tragen ein Ablaufdatum; danach schliessen.
5. **Den EIGENEN Worktree zuletzt entfernen — oder gar nicht** (18.9.2026):
   ist der Pfad weg, stehen Bash UND Read still (Hooks
   lösen nicht mehr auf). Reihenfolge: Doku-PR landen, abräumen,
   Nachkontrolle, Bericht — **erst zuletzt** der eigene. Festgefahren:
   `git worktree add --detach <pfad> main`; nie Ersatz-Hooks.
Wächter: `plan:next` (Lage-Block + Flächen-Zeile), auch am Session-Ende.

## 4 · Nachkontrolle

0. **F13 (#629, Ursache offen — Skill `lehren`):** endet ein Push-Lauf auf
   main «cancelled», ist der Stand unausgeliefert ⇒ `gh run rerun <id>`. Der
   Auslöser von damals (Doku-Push kurz nach dem Merge) entfällt; zwei
   Queue-Landungen kurz nacheinander sind UNGEMESSEN (`ci.yml`: auf main wird
   nie gecancelt, Deploys seriell über `prod-deploy`).
1. **Deploy dem Merge-Commit zuordnen:** Job «Deploy (Prod, Vercel CLI)» im
   **Push-Lauf auf main** grün (nicht im `merge_group`-Lauf); landen mehrere
   PRs im selben Push-Ereignis, gibt es EINEN Push-Lauf am Kopf-SHA. Er
   verifiziert die Live-Kennung selbst (`<meta lexmetrik-build>`, 3×20 s).
   **Skipped ist hier NICHT grün** (erwartbar nur bei `art=doku`). Gegenprobe:
   `curl -s https://lexmetrik.vercel.app/ | grep lexmetrik-build` = Kurz-SHA
   des main-Kopfs. Realfälle + Historie (Vercel-Ära): `referenz-ci.md`.
1b. **Aufräum-Summenzeile im Deploy-Log lesen** (`Vercel-Aufräumen: N
   gelöscht · M behalten · K übrig`, seit 8.9.2026): der Schritt trägt
   `continue-on-error: true`, ist also NIE am Job-Rot erkennbar. Fehlt die
   Zeile oder steht dort `::warning::` ⇒ §17-Fall, nicht liegen lassen
   (10-GB-Grenze; Anlass + offene Nachmessung: `referenz-ci.md`).
2. Asset-Hash live = lokal (index.html der Prod-URL gegen `dist/`).
3. Kernrouten HTTP 200: `/`, `/rechner/tagerechner`, `/rechner/zustaendigkeit`,
   `/rechner/verjaehrung`, `/rechner/mietrecht`, `/vorlagen`, eine
   Vorlagen-Detailroute. Prod = https://lexmetrik.vercel.app (lexmetrik.ch
   existiert NICHT).
4. Lighthouse (QS-PERF/§15): läuft automatisiert als `check:perf-lighthouse`
   nach dem Merge (Solls: `fahrplaene/FAHRPLAN-PERFORMANCE.md`); manuell nur
   bei Verdacht.
5. Aufräumen: gemergten Branch + Worktree entfernen (lokal + remote).
6. Hat der Merge `package-lock.json` geändert: `npm ci` im Haupt-Checkout
   nachziehen (Beleg 3.9.2026: fehlende `valibot`/`date-holidays` machten
   `npm test` in jedem neuen Worktree rot).
7. **Projektionen nachziehen:** `npm run projektionen` (Zähler/Feed/Historie +
   `gen:e2e-shards`, seriell) — vor dem Öffnen eines PR, der Quelldaten
   ändert, und nach einer Landekette mit mehreren Daten-PRs (Beleg 5.9.2026,
   5 CI-Läufe verloren). Das Datenhaltungs-Manifest ist bewusst NICHT dabei:
   `datenhaltung:manifest` nur nach rotem `check:datenhaltung`, mit
   Begründung im Commit (Gegenprüfung #717, §6.7).
8. Prüf-Worktrees: nach `git worktree add` immer `npm ci` (frischer Checkout
   trägt noch kein `node_modules`) — sonst laufen Tore/Tests dort nicht an
   (Beleg gleiche Session, 5.9.2026).

## Trailer- und PR-Formregeln (CI-Rot-Lehren 31.8./1.9.2026, §17)

1. **Trailer nur im SCHLUSSBLOCK:** `Roadmap:`/`Gegenpruefung:`/
   `Co-Authored-By:` in EINEM letzten Absatz ohne Leerzeilen dazwischen —
   `git %(trailers)` liest nur den letzten Block (PR #604: Verdikt war da,
   aber durch eine Leerzeile unsichtbar → Merge-Schutz rot). Vor jedem PR
   lokal `npm run check:merge-schutz` (Sekunden, spart den CI-Lauf).
2. *(entfällt 20.9.2026 — galt nur für die abgebaute `plan-buchung.yml`-
   Auto-Buchung; `@blockers`-Slug bleibt Pflicht, das prüft `check:plan`.)*
3. **PR zeigt «no checks reported» → ZUERST Mergeability prüfen**
   (`gh pr view N --json mergeable`): bei CONFLICTING baut GitHub gar keinen
   CI-Lauf (PR #605). Fix ist der main-Merge, nicht das Neu-Triggern.
4. **Quittungs-Hash überlebt einen main-Merge**, solange der Merge den
   Endinhalt der Risiko-Dateien des eigenen Diffs nicht ändert; ändert die
   Regeneration eine Risiko-Projektion (register.json!), braucht der
   Merge-Stand ein enges Nach-Verdikt derselben Prüf-Instanz (belegt 1.9.2026,
   ZH-Tranche).
5. **Der Roadmap-Trailer-Block muss der LETZTE Absatz im PR-Body sein — auch
   nach der Zeile «🤖 Generated with …» —, jede Zeile < 72 Zeichen.** Die
   Queue-Squash-Nachricht ist PR-Titel `(#N)` + PR-Body (`--subject/--body`
   wird NICHT übernommen); GitHub bricht bei 72 Zeichen um und hängt
   `---------` + `Co-authored-by:` als letzten Absatz an ⇒ `%(trailers)`
   sieht am Squash-Commit NUR Co-authored-by, lange Trailer zerfallen in
   Fortsetzungszeilen (Beleg 9b125ce8e). Gelesen wird darum der PR-Body per
   API (PR #628, 2.9.2026). Mehrere IDs nie auf mehrere `Roadmap:`-Zeilen
   verteilen — nur die letzte Zeile gilt als Konvention (kein automatischer
   Leser mehr seit dem Abbau der `plan-buchung.yml`-Auto-Buchung 20.9.2026).
