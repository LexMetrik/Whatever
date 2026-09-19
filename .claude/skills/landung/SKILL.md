---
name: landung
description: Verwenden, wenn ein fertiger Stand nach main soll — Trigger «landen», «Landung», «PR mergen», «einsammeln», «rebasen auf main», «Merge-Kette abarbeiten», «Push», «Deploy», «Live-Gang», «bring das auf Prod», «Release-Stand prüfen». Kodifiziert §12 (serielle Landung, Merge-Treiber) UND §9 (Merge nach main IST der Deploy, ausgeliefert vom CI-Job «Deploy (Prod, Vercel CLI)»).
---

# Landung nach main = Deploy (§12 + §9, «Weg 1»)

**Dieser Skill trägt §12 UND §9** (A4-Umzug 25.7.2026). Bei Widerspruch zu
einer älteren §9-/§12-/deploy-check-Erinnerung gewinnt **dieser Text**.

*Diät 31.8.2026 (QS-EFFIZIENZ, Token-Dauerlast: der Skill lädt bei jeder
Landung): Vorfalls-Erzählungen und Historie wörtlich nach `referenz-ci.md`
bzw. `referenz-ausnahmen.md` verschoben — die REGELN hier sind vollzählig;
wer einen Anlass nachlesen will, findet den Wortlaut dort; 5.9.2026
Jules-Checkliste nach `referenz-jules.md`.*

**Kernmodell (Weg 1):** **Der Merge nach `main` IST der Deploy** — kein
separater Handschritt. Die gesamte §9-Sorgfalt (Tore grün, Bug-Check, Golden
byte-gleich, doppelt verifiziert) liegt zwingend **VOR dem Merge/Push auf
main**; übergeordnet §1, §6, §8. Ziel der Mechanik: **EINE** PR aufs Mal,
generierte Dateien nie von Hand mischen.

**Wer ausliefert: der CI-Job «Deploy (Prod, Vercel CLI)»** auf `push: main`
(`needs: [diff, tore, bau, e2e]` — Prod bekommt nur, was die Tore freigaben).
Vercel-Git-Deploys sind abgeschaltet; Folgen: Push kostet keinen Deploy, es
gibt keinen Vercel-Check am PR (fehlender Vercel-Kontext = Normalfall),
Deploy-Rot ist ein CI-Job-Rot, **Handdeploy bleibt verboten** (Ausnahmen:
`referenz-ausnahmen.md`). Anlass + Details: `referenz-ci.md` §Auslieferung.

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
2. **Kollisionen sichten:** `gh pr list --state open` — Überschneidung ⇒ erst
   den anderen landen, dann diesen rebasen. Nie zwei kollidierende PRs
   gleichzeitig. **Scharfer Auto-Merge ist keine Landung:** bei
   `BEHIND` feuert er nie — nach jeder main-Landung verbleibende
   Auto-Merge-PRs prüfen und bei BEHIND `gh pr update-branch` (Realfall #445:
   `referenz-ci.md`).
3. **origin/main einziehen:** `git fetch origin`, dann Merge/Rebase in den
   Feature-Branch (lokale Treiber greifen).
4. **Konflikte — nie von Hand mischen:** generierte Datei ⇒ **Generator neu
   laufen** (`daten-manifest.json` → `npm run datenhaltung:manifest`;
   `*.generated.ts` → Banner-`gen:*`; rechtsprechung-Indexe →
   entscheide-Pipeline). Append-Register: union hat beide Seiten — nur
   prüfen. **GitHub kennt den union-Treiber nicht:** jeder gelandete
   Risikopfad-PR hängt eine Register-Zeile an, danach meldet GitHub die
   übrigen Risiko-PRs DIRTY und startet keine CI — also nach JEDER Landung
   `origin/main` lokal in den nächsten Zweig mergen, Tore, push, dann erst
   die Kette (15.9.2026, vier Risiko-PRs #888–#892 in Serie). `golden/*.json`: von Hand, dann `npm run golden`, Byte-Diff bewusst
   bestätigen. `public/normtext/**`: Konflikt SOLL anhalten ⇒ Gegenprüfung.
   Steuer-Doku (STRUKTUR/ROADMAP/FAHRPLAN/INDEX): von Hand, beide Beiträge.
5. **Gate:** `npm run gate` grün — erzwingt die Regeneration aus Schritt 4.
6. **CI-Grün verifizieren:** Push, `gh pr checks <nr> --watch` bis grün.
   **`cancelled`/`skipped` zählen als ROT**; einzige Ausnahme: dokumentiert
   designter konditionaler Skip mit anderweitig belegter Substanz (heute:
   «Perf-Budget» auf `pull_request`). **FEHLENDE Checks zählen als PENDING,
   nie als grün** — nach dem Push die Präsenz der Kern-Batterie (Tore + Bau +
   letzter Shard) verifizieren. Kette seriell, ohne überflüssige
   Zwischen-Pushes. Sonderfälle (kein pull_request-Lauf, Grenzfall-Skip,
   Vercel-Limit) + Vorfalls-Wortlaute: `referenz-ci.md`.

6b. **Daten-/Extraktions-PRs: Identitätsbeleg.** Neue Entitäten vor Live-Gang:
   Stichprobe **n ≥ 10** gegen die **amtliche Quelle**, Trefferquote im PR.
   Belege sind Identitäts-Treffer mit Wortgrenze, nie Substring (Vorfall
   PR #309 passierte genau hier).

7. **Push + Merge = Deploy.** **Push ist stehend freigegeben** (David
   2.7.2026); der Live-Gang-Entscheid ist die Merge-Freigabe. **Feature
   einzeln landen, Verwaltung bündeln** (David 15.8.2026): direkte
   main-Pushes für Doku/Plan/Buchung sind verboten (Hook blockt) — sie fahren
   im Feature-Branch/PR mit (Trailer, Ziff. 9); PR-lose Doku am Session-Ende
   in EINEM Sammel-Push (`bauschritt` Station E). Merge: `gh pr merge <nr>
   --squash`. **`--auto` ist der Deploy-Zünder** — erst scharf, wenn
   Schritte 0–2 abgeschlossen sind; grüne CI ERSETZT sie nicht. Nie einen
   roten PR mergen. **Verboten im Normalfall:** `npx vercel --prod`, jeder
   /tmp-Worktree-Deploy, jeder zweite Deploy-Pfad (Race; auch «technisch
   andere» Wege wie promote/prebuilt/Dashboard-Redeploy — Aufzählung:
   `referenz-ausnahmen.md`). Rot = Stopp, kein «mergen und nachbessern».
   Realfall-Wortlaute (Tageslimit 15.8.): `referenz-ci.md`.

7c. **Die Kette als Werkzeug:** `scripts/landung/landung-kette.sh <log> <PR>…`
   fährt die Schritte 2–8 seriell (7.9.2026 über dreizehn Landungen benutzt).
   Sie hält an, statt einen roten PR zu mergen, und löscht den Zweig erst,
   nachdem `gh pr view --json state` MERGED meldet. Zwei Fallen sind darin
   verdrahtet: **`gh run watch` bricht vorzeitig mit Exit 1 ab, obwohl der
   Lauf noch läuft** — Status pollen (`gh run view --json status`), nie
   watchen; und **ein PR im Zustand DIRTY bekommt von GitHub gar keinen
   `pull_request`-Lauf** — «kein CI-Lauf» heisst darum zuerst «Konflikt?»,
   nicht «Skip-CI-Marker?» (L-O8, 7.9.2026; bei DIRTY erst main im Worktree
   in den Zweig mergen, Ziff. 3.4). Die Ziff. 0–2 ersetzt sie nicht.

7b. **Ketten-Wächter (F2h):** prüft bei Risikopfad-Hand-Merges auf «alle
   Required grün» (Required-Liste per `gh api …/protection/
   required_status_checks`), nie auf `mergeStateStatus: CLEAN`;
   `DIRTY`/`UNKNOWN` > 2 Runden ⇒ laut melden; > 30 min ohne Zustandsänderung
   ⇒ Stillstand melden (Realfall 7 h: `referenz-ci.md`).

8. **Nächste PR erst danach** — erst wenn diese auf main ist, die nächste auf
   das neue main rebasen (zurück zu Schritt 1).

9. **Schritt-Status schliessen — wip verlässt die Session nie.** EINE Quelle:
   Trailer-Block **im PR-BODY**, eigener Absatz, beide Zeilen, unformatiert:
   ```
   Roadmap: <ID>
   Roadmap-Status: done|ready|parked(<token>)
   ```
   `plan-buchung.yml` liest ihn nach dem Squash-Merge; ein ECHTER halber
   Block (`Roadmap-Status:` ohne `Roadmap:`, oder beide Zeilen in
   verschiedenen Absätzen) = Lauf laut rot. Commit-Trailer zusätzlich
   erlaubt, keine Pflicht. Fällt die Auto-Buchung aus: `plan:set` im
   nächsten PR/Sammel-Push (kein direkter main-Push). Form: Skill `auftrag`
   Ziff. 5; Historie: `referenz-ci.md`.
   **Bleibt der Schritt nach der Landung `wip`:** im PR-Body nur
   `Roadmap: <ID>`, kein Status — das Skript bucht dann nichts (seit
   3.9.2026, Wurzel-Fix Workflow-Lauf 33694227189 bei PR #636).

### Auto-Merge ist auf Risiko-Pfaden gesperrt

Auf Risiko-Pfaden (`istRisikoPfad()` in `scripts/gegenpruefung/kern.ts`) wird
**erst nach vorliegendem Gegenprüfungs-Verdikt** gemergt; `--auto` ist dort
**ganz gesperrt** (prüft nur den Stand beim Aktivieren). Das Verdikt braucht
prüfbare Form **und** Zuwachs im committeten Gegenprüfungs-Register — ein
Trailer allein ist Behauptung. Maschinell dreifach: Required-Check
«Merge-Schutz» · derselbe Check im Hook vor jedem Merge-Kommando ·
`check:gegenpruefung` in `npm run gate`. Erzwungen durch Vorfall PR #309
(elf erfundene Amtsträger:innen ~1 h auf Prod).

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
- David separat um Push-Bestätigung bitten.
- Mergen bei rotem Schritt-1-Tor oder offenem Schritt 2.
- Berufung auf die gestrichene §9-Zeile «Prod: `npx vercel --prod`».
- Nach dem Merge «zur Sicherheit» manuell nachdeployen.

### Prüfstrasse seit 8.9.2026 (QS-CI-MINUTEN, Sparplan M1–M5)

- **Vier Browser-Shards** statt acht. Pflicht-Kontext im Branch-Schutz ist der Sammel-Job
  «**Browser-Smoke (Ergebnis)**», nicht die einzelnen Shards (#780, 8.9.2026): Er ist grün bei
  Shard-Erfolg oder begründetem Skip (Diff-Klasse doku/code-fern, Push-Diät) und **rot** bei jedem
  Shard-Fehler und jedem unbegründeten Skip. Grund: ein per `if:` übersprungener **Matrix**-Job
  meldet nur einen Check-Run mit unexpandiertem Namen — Shard-Kontexte würden nie gemeldet, der
  PR hinge (K12-Falle). Die Shard-**Zahl** ist damit ohne Branch-Schutz-Anpassung änderbar;
  einzige Quelle der Zahl ist die ci.yml-Matrix (`scripts/e2e-shard-anzahl.mjs`), Union-Wächter
  `check:e2e-shards`. Pflicht-Kontexte abschliessend: Tore · Merge-Schutz · Perf-Budget ·
  Browser-Smoke (Ergebnis).
- **Pflicht-Kontexte umstellen, ohne fremde PRs zu blockieren** (Lehre der Parallel-Session
  8.9.2026: zwei Umstellungen vor der Landung des einführenden PR liessen #774 je ~1 h hängen):
  den neuen Job zuerst so einführen, dass der PR alten UND neuen Kontext meldet; Branch-Schutz
  erst umstellen, wenn dieser PR grün und mergebereit ist, sofort mergen, dann **alle** offenen
  PRs per `gh pr update-branch` nachziehen. Fenster ≈ Minuten statt Stunden.
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
- **Reine Doku-PRs** (Diff-Klasse «doku») überspringen `bau` und `e2e`; die Doku-Tore laufen
  weiter. Ein per `if:` übersprungener Pflicht-Job gilt bei GitHub als erfüllt — deshalb
  bleibt `tore` immer aktiv.
- **Push auf `main`** läuft nur noch `bau` + `deploy` («Push-Diät»), weil `strict: true` den
  PR-Lauf auf exakt den landenden Baum zwingt; der `diff`-Job prüft das (grüner
  PR-Check-Run für den Merge-Commit) und schaltet sonst das volle Programm ein.
  **`strict: true` darf nicht fallen**, sonst wird main ungeprüft deployt.
- **Dependabot** läuft monatlich ohne Auto-Rebase: die landende Session zieht offene
  Dependabot-PRs per `gh pr update-branch` nach und setzt Auto-Merge (Patch/Minor), schliesst
  Hauptversionen mit Begründung.
- Messung/Nachmessung: `bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md` (61 381 min/30 Tage
  vor dem Sparplan; Nachmessung fällig **8.10.2026**, gleiche Methode: Jobs je Lauf aufgerundet).

### Session-Ende: Bau-Flächen hinterlassen keine Zweige (Lehre 8.9.2026)

Beleg: Aufräumen 8.9.2026 fand 22 Remote-Branches, 3 Worktrees, 5 Dependabot-PRs
(seit 14.8.), einen fertigen, nie eröffneten Risikopfad-Branch (9 Commits) und
einen Autopilot-Entwurf ohne Entscheid — niemand war zuständig. Regel:
1. **Eigene Worktrees und Branches** verlassen die Session nur gemergt oder
   gelöscht (`git worktree remove`, Branch lokal + remote). Fertige Arbeit
   ohne Landung = PR eröffnen (Risikopfad: ohne `--auto`, Gegenprüfung nennen),
   nie stumm liegen lassen.
2. **Geparkte Stände sind Tags, keine Branches:** `git tag archiv/<slug>-<datum>
   <sha>`, Tag pushen, Branch löschen; Wiederaufnahme aus dem Tag.
3. **Dependabot je Session einordnen:** Patch/Minor-Bumps landen (Rebase +
   Auto-Merge, kein Risikopfad), Hauptversionen schliessen mit Begründung —
   nie liegen lassen (jeder liegende PR rebasiert bei jeder Landung mit,
   Messung 8.9.2026: 113 CI-Läufe aus 13 Zweigen).
4. **Autopilot-/Entwurfs-PRs** tragen ein Ablaufdatum in der Beschreibung;
   danach schliessen oder entscheiden.
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
Wächter: `npm run plan:next` zeigt Worktrees/Branches ohne Schritt-Bezug
(Lage-Block) — am Session-Ende lesen, nicht nur am Anfang.

## 4 · Nachkontrolle

0. **Kein main-Push vor grünem Deploy-Job (F13, 2.9.2026):** Beleg #629 — der
   Lauf des Merge-Commits endete «cancelled», nachdem ~30 s später ein Doku-Push
   folgte; der Doku-Lauf deployt nicht, der Merge blieb unausgeliefert (Ursache
   offen, siehe Skill `lehren` F13). Erst Nachkontrolle 1 abschliessen, dann
   Doku pushen; ein gecancelter Merge-Lauf wird mit `gh run rerun <id>` geheilt.
1. **Deploy dem Merge-Commit zuordnen:** Job «Deploy (Prod, Vercel CLI)» im
   Actions-Lauf des Merge-Commits grün — er verifiziert die Live-Kennung
   selbst (`<meta lexmetrik-build>`, 3×20 s). **Skipped ist hier NICHT grün**
   (erwartbar nur bei `art=doku`). Gegenprobe:
   `curl -s https://lexmetrik.vercel.app/ | grep lexmetrik-build` = Kurz-SHA.
   Realfälle + Historie (Vercel-Ära): `referenz-ci.md`.
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
7. Karten-ZEILE in `STRUKTUR.md` (deployter Stand, Commit-Hash) — Form:
   Skill `bauschritt` Station E.
8. **Projektionen nachziehen:** `npm run projektionen` (Zähler/Feed/Historie +
   `gen:e2e-shards`, seriell) — vor dem Öffnen eines PR, der Quelldaten
   ändert, und nach einer Landekette mit mehreren Daten-PRs. Beleg: 5 CI-Läufe
   verloren #694/#695/#689, 5.9.2026. Das Datenhaltungs-Manifest ist bewusst
   NICHT dabei: `datenhaltung:manifest` pinnt den Ist-Zustand vor der
   Drift-Prüfung — nur nach rotem `check:datenhaltung`, mit Begründung im
   Commit (Gegenprüfung #717, §6.7).
9. Prüf-Worktrees: nach `git worktree add` immer `npm ci` (frischer Checkout
   trägt noch kein `node_modules`) — sonst laufen Tore/Tests dort nicht an
   (Beleg gleiche Session, 5.9.2026).

## Trailer- und PR-Formregeln (CI-Rot-Lehren 31.8./1.9.2026, §17)

1. **Trailer nur im SCHLUSSBLOCK:** `Roadmap:`/`Roadmap-Status:`/`Gegenpruefung:`/
   `Co-Authored-By:` in EINEM letzten Absatz ohne Leerzeilen dazwischen —
   `git %(trailers)` liest nur den letzten Block (PR #604: Verdikt war da,
   aber durch eine Leerzeile unsichtbar → Merge-Schutz rot). Vor jedem PR
   lokal `npm run check:merge-schutz` (Sekunden, spart den CI-Lauf).
2. **`Roadmap-Status: parked(<slug>)` nur mit REGISTRIERTEM Slug:** der Slug
   muss VOR dem Merge im `@blockers`-Register der ROADMAP stehen, sonst
   verweigert das Konsistenz-Tor die automatische Plan-Buchung (Main-CI rot,
   PR #604). Reihenfolge: Blocker-Zeile im PR mitliefern, dann Status-Trailer.
3. **PR zeigt «no checks reported» → ZUERST Mergeability prüfen**
   (`gh pr view N --json mergeable`): bei CONFLICTING baut GitHub gar keinen
   CI-Lauf (PR #605). Fix ist der main-Merge, nicht das Neu-Triggern.
4. **Quittungs-Hash überlebt einen main-Merge**, solange der Merge den
   Endinhalt der Risiko-Dateien des eigenen Diffs nicht ändert; ändert die
   Regeneration eine Risiko-Projektion (register.json!), braucht der
   Merge-Stand ein enges Nach-Verdikt derselben Prüf-Instanz (belegt 1.9.2026,
   ZH-Tranche).
5. **Der Roadmap-Trailer-Block muss der LETZTE Absatz im PR-Body sein — auch
   nach der Zeile «🤖 Generated with …»:** Squash-Merges übernehmen den
   PR-Body nicht in den Commit, und der Fallback in `plan-buchung.yml` liest
   den letzten Absatz des Bodys; stand der Block davor, blieb die Buchung
   aus («Kein vollständiger Buchungs-Trailer», PR #628, 2.9.2026).
