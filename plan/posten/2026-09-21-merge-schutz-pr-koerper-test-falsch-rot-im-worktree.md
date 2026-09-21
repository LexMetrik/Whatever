<!-- @posten
dach: QS-EFFIZIENZ
titel: merge-schutz-pr-koerper.test.ts falsch-rot in Worktrees ohne eigenes node_modules
anlass: Nullprobe 21.9.2026 auf unverändertem origin/main, Klasse F11/F2g (Tor rot ohne Defekt)
-->

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
