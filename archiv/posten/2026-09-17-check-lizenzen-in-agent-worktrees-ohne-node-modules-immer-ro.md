<!-- @posten
dach: QS-EFFIZIENZ
titel: Worktree-/Parallel-Agenten-Umgebung — 11 Punkte gebündelt (node_modules, Fedlex-Cache, Messreihe, Scratchpad, Last, Obergrenze, Rückstände, Browser-Pane, Notizen-Schreibweg)
anlass: 17.9.2026
-->

*Titel bis 24.9.2026: «check:lizenzen in Agent-Worktrees ohne node_modules immer rot» — seither Kopf eines Bündels (unten).*

  - [ ] **`check:lizenzen` in Agent-Worktrees ohne `node_modules` immer rot** *(17.9.2026)* — meldet «0 Paket(e) geprüft» als Lizenzverstoss statt Umgebungsproblem. Fix: `node_modules` vor `npm ls` prüfen, sonst «npm ci» melden.

**Bündel 24.9.2026** (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET): 8 weitere Posten derselben Sorge sind hier im Wortlaut aufgenommen — Titel, Anlass, alter Dach-Schlüssel und alte Datei je Punkt; die Dateien liegen mit Beleg «gebündelt in …» unter `archiv/posten/`. Nichts gekürzt.

### 1 · Agenten-Rückstände: Worktrees und Branches ohne Schritt-Bezug *(Anlass: Session 20.9.2026, Prozess-Messung; vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-20-agenten-rueckstaende-worktrees-und-branches-ohne-schritt-bez.md`)*

Stand 20.9.2026: 2 detached Worktrees, 5 `worktree-agent-*`-Branches und 4 `claude/*`-Branches ohne Schritt-Bezug. `plan:next` meldet sie im Lage-Block, aber niemand räumt sie ab. Vorschlag: ein Modus `plan:next --aufraeumen`, der die Abräum-Kommandos ausgibt — nur für Zweige ohne offenen PR.

### 2 · Gate-Messreihe .selbstopt-ereignisse.jsonl liegt im jeweiligen Worktree statt im Haupt-Checkout *(Anlass: erster Trockenlauf von `npm run aufraeumen:git` auf main, 21.9.2026 (nach #955); vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-21-gate-messreihe-liegt-im-worktree-statt-im-haupt-checkout.md`)*

  - [ ] **Gate-Messreihe in den Haupt-Checkout schreiben** *(Beleg 21.9.2026)* — `scripts/gate.sh` und `scripts/run-parallel.ts` schreiben die gitignorte Messreihe `.selbstopt-ereignisse.jsonl` (Leser: `scripts/analyse/tor-bewaehrung.ts`) in das Verzeichnis, in dem das Gate läuft — also in den jeweiligen Agenten-/Session-Worktree. Zwei Folgen: (1) jeder Worktree, der je das Gate fuhr, bleibt für `aufraeumen:git` dauerhaft «nicht sauber — 1 ignorierter Eintrag» und ist nie abräumbar (der Schutz ist korrekt: die Datei ist eine Messreihe, kein Bau-Cache — belegt an `agent-ab88f94b57efc9f81` und `agent-a0f560db1a4313a29`); (2) zu prüfen: erreichen die Gate-Ergebnisse aus Worktrees `tor:bewaehrung` überhaupt, oder liest es nur die Datei des Haupt-Checkouts — dann misst es die meisten Gate-Läufe (die in Worktrees stattfinden) nie. Wurzel-Fix-Kandidat: Pfad über `git rev-parse --git-common-dir` auf den Haupt-Checkout auflösen, wie `scripts/plan/notizen.ts` es für die Notizen-Dateien tut (anhängendes Schreiben, eine Zeile je Ereignis — auf parallele Schreiber achten). Bis dahin NICHT auf die Bau-Cache-Allowlist von `gitFlaechen.ts` setzen.

### 3 · Geteilter lokaler Fedlex-Cache färbt fremde Worktrees rot (check:p-klassen, check:vollstaendigkeit) *(Anlass: Mutter/Tochter-Durchlauf 2, beide Töchter, 21.9.2026; vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-21-geteilter-lokaler-fedlex-cache-faerbt-fremde-worktrees-rot-c.md`)*

Befund: Solange der Zweig chore/fedlex-frische (#953) in einem Worktree lag, zog der GETEILTE lokale Fedlex-Cache den neuen Pin-Marker (hkue |4 statt |2 auf main). In zwei fremden Worktrees, deren Diff keine Normtext-Datei berührte, wurden dadurch check:p-klassen und check:vollstaendigkeit lokal rot (gate 3/55 rot). Beide Tochter-Sessions grenzten es selbst per Nullprobe ab (~5 min je Session); in CI trat es nicht auf. Wurzel-Fix-Kandidaten: Cache-Schlüssel um den Pin-Marker/Worktree erweitern (scripts/fedlex-cache.sh) ODER die zwei Tore melden «Cache-Pin ≠ Repo-Pin — Cache neu ziehen» statt fachlich rot. Risikopfad-Nähe (scripts/fedlex-*): Gegenprüfung nötig.

### 4 · merge-schutz-pr-koerper.test.ts falsch-rot in Worktrees ohne eigenes node_modules *(Anlass: Nullprobe 21.9.2026 auf unverändertem origin/main, Klasse F11/F2g (Tor rot ohne Defekt); vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-21-merge-schutz-pr-koerper-test-falsch-rot-im-worktree.md`)*

**Fundstelle:** `src/tests/merge-schutz-pr-koerper.test.ts:362` — `laufeTor()` spawnt das
Tor-Skript hartkodiert über
```
const vite = resolve(WURZEL, 'node_modules/.bin/vite-node');
```
(`WURZEL` = `resolve(dirname(fileURLToPath(import.meta.url)), '../..')`, Z. 33 — also
IMMER die Wurzel des aktuellen Checkouts/Worktrees, nie des Haupt-Checkouts).

**Reproduziert 21.9.2026 (§0 Ziff. 2 — erst gesehen, dann dokumentiert), Nullprobe auf
unverändertem `origin/main` (`2a08ea368`) in einem frischen Agenten-Worktree OHNE eigenes
`node_modules`:**
```
$ ls node_modules/.bin/vite-node
ls: node_modules/.bin/vite-node: No such file or directory
$ npx vitest run src/tests/merge-schutz-pr-koerper.test.ts --reporter=default
 Test Files  1 failed (1)
      Tests  4 failed | 22 passed (26)
```
Alle vier Fehlschläge sind dieselbe Form — `spawnSync` liefert `status: null` statt der
erwarteten 0/1, weil die Binary unter dem berechneten Pfad fehlt:
- „(d) kein Risiko-Diff ⇒ grün — eine boshafte gh-Attrappe (leerer Body) bleibt unbeachtet"
- „Risiko-Diff + gültiger Zweig-Trailer, aber PR-Body-Verdikt verkürzt ⇒ ROT …"
- „dieselbe Lage, aber PR-Body-Verdikt gültig ⇒ GRÜN …"
- „MERGE_SCHUTZ_KOPF gesetzt, aber kein PR-Treffer … ⇒ sauberer Überspring …"

Da dies exakt der unveränderte `origin/main`-Stand ist (keine eigenen Änderungen im
Diagnose-Worktree), liegt der Defekt strukturell auf `main`, nicht an einer lokalen
Änderung (§0 Ziff. 3a Nullprobe). Alle 22 übrigen Tests derselben Datei (reine
Funktions-Tests ohne `spawnSync`) sind unberührt und grün — betroffen ist ausschliesslich
der Integrations-Block, der das echte Sub-Prozess-Tor spawnt.

**Klasse:** Falsch-Rot ohne Produktdefekt — passt zu **F11** („Prüfen gegen ein altes
Bundle") in der Erweiterung „Prüfen gegen ein FEHLENDES Bundle" und zu **F2g** („Tor rot
ohne Defekt") im Lehren-Register (`.claude/skills/lehren/SKILL.md`) — kein neuer
Registereintrag nötig, der Fund gehört als Beleg zu den bestehenden Klassen, sobald der Fix
landet. `gate:schnell` meldet in jedem Agenten-Worktree ohne eigenes `node_modules` deshalb
Exit 1, unabhängig vom Bau-Inhalt.

**Wurzel-Fix-Kandidat:** dieselbe Klasse Problem (Haupt-Checkout aus einem Worktree
auflösen) hat `scripts/plan/notizen.ts` bereits gelöst und getestet — über
`git rev-parse --git-common-dir` + Auflösung eines relativen Ergebnisses gegen `cwd`
(Pfad-Bug vom 20.9.2026, siehe `src/tests/plan-notizen.test.ts`). `laufeTor()` sollte
denselben Weg nehmen: `vite-node` zuerst unter `WURZEL` suchen, sonst über
`git rev-parse --git-common-dir` das Haupt-Checkout auflösen und dort suchen — oder, falls
auch das fehlschlägt, den Integrations-Block mit einer sprechenden Meldung überspringen
(`it.skip`/`describe.skip` mit Begründung) statt `status: null` gegen `toBe(0)`/`toBe(1)`
laufen zu lassen. `TABU` für diese Doku-Session: `src/tests/**` ist Bau, nicht Plan — Fix
gehört in einen eigenen `fix(`-Auftrag.

### 5 · Geteiltes Scratchpad: parallele Agenten überschrieben msg1.txt/crop.py gegenseitig → Dispatch-§0/Auftrag: Scratch-Dateinamen mit Scheiben-Präfix (k2-) *(Anlass: Session-Notizen 2026-09-23; vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-23-geteiltes-scratchpad-parallele-agenten-ueberschrieben-msg1-t.md`)*

in Skill auftrag Dispatch-Vorlage verankern

### 6 · Parallel-Agenten-Last: Flacker-Messungen n=20 unter Fremdlast verfälscht *(Anlass: Session-Notizen 2026-09-23; vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-23-parallel-agenten-last-flacker-messungen-n-20-unter-fremdlast.md`)*

Messprotokoll sollte Load festhalten (Ort: Skill refactoring/§6.7 Flacker oder e2e-flake-Doku) — prüfen, ob LESER-Session das schon verankert.

### 7 · Worktrees für Agenten brauchen npm ci (sonst check:lizenzen/merge-schutz rot) *(Anlass: Session-Notizen 2026-09-23; vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-23-worktrees-fuer-agenten-brauchen-npm-ci-sonst-check-lizenzen.md`)*

Dispatch-Vorlage/Worktree-Einrichtung prüfen (Lehren-Kandidat)

Umgehängt 24.9.2026 (REST-Planung §5f, Entscheid David): gehört nicht in REST → QS-EFFIZIENZ.

### 8 · Worktree-Obergrenze: Warnung in plan:next/SessionStart ab N Worktrees mit node_modules (§17, Absturz 23.9.) *(Anlass: Verwaiste Session-Notiz, triagiert 24.9.2026 auf main a3d27e47c (2026-09-23-lage-nach-absturz:38); vormals Dach `QS-EFFIZIENZ`, `plan/posten/2026-09-24-worktree-obergrenze-warnung-in-plan-next-sessionstart-ab-n-w.md`)*

Am 23.9.2026 stürzte der Rechner bei rund 45 Worktrees (je mit node_modules) ab. aufraeumen:git existiert, aber keine Schwelle warnt vorher. Heute 19 Worktrees, 15 mit node_modules. Schwelle messen, Warnung in plan:next (Zeile Git-Flächen) und im SessionStart-Hook.

**Nachzug 24.9.2026** (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET): 2 Fahrplan-Einträge derselben Sorge sind hier im Wortlaut aufgenommen; im Fahrplan steht an ihrer Stelle je ein Zeiger hierher. Nichts gekürzt.

### 9 · Browser-Pane ist nicht Worktree-isoliert (§17-Werkzeugbefund 21.8.2026, zwei Agenten unabhängig) *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §4, vormals Z. 200)*

- [ ] **Browser-Pane ist nicht Worktree-isoliert (§17-Werkzeugbefund 21.8.2026, zwei Agenten unabhängig)** — fremde Tabs/Navigationen zwischen parallelen Worktree-Sessions, `preview_start` mit launch.json-Name serviert den HAUPT-Checkout statt des Worktrees, resize wirkungslos. Wurzel-Fix: Worktree-bewusste launch.json-Auflösung bzw. je-Session-Pane; bis dahin Workaround eigener Playwright-Lauf (in Dispatch-Berichten dokumentiert).

### 10 · §17 Notizen-Datei: Haupt-Checkout aus einem Worktree nur per Bash schreibbar *(aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md`, §2, Restposten aus ROADMAP.md, vormals Z. 199)*

  - [ ] **§17 Notizen-Datei: Haupt-Checkout aus einem Worktree nur per Bash schreibbar** *(19.9.2026)* — das Write-Werkzeug sperrt aus einem Worktree Schreibzugriffe auf `<Haupt-Checkout>/.claude/`; die Regel (`bauschritt` Station A 4, globale CLAUDE.md) ist nur per `Bash` erfüllbar. Umgekehrt sehen Kompaktierungs-Hook und `plan:next` eine im Worktree abgelegte Datei nicht. Wurzel offen.

Deckt sich mit Punkt (c) im Posten «Prozess-Kleinfunde Session QS-MONITOR-ROT (18.9.2026)» (`QS-EFFIZIENZ`, ebenfalls migriert 24.9.2026).
