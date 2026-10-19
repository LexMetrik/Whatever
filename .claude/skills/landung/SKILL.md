---
name: landung
description: Verwenden, wenn ein fertiger Stand nach main soll — Trigger «landen», «Landung», «PR mergen», «einsammeln», «rebasen auf main», «Merge-Kette abarbeiten», «einreihen», «Merge-Queue», «Push», «Deploy», «Live-Gang», «bring das auf Prod», «Release-Stand prüfen», «Worktree», «Parallel-Session». Trägt §9 (Merge nach main IST der Deploy) und §12 (Isolation, serielle Landung, Merge-Treiber).
---

# Landung nach main = Deploy (§9 + §12)

**Der Merge nach `main` IST der Deploy.** Die ganze §9-Sorgfalt (Tore grün,
Bug-Check, Golden byte-gleich) liegt VOR dem Einreihen. `main` nimmt nur die
Merge-Queue — kein direkter Push, kein Bypass. Ausgeliefert wird vom CI-Job
«Deploy (Prod, Vercel CLI)» auf `push: main` (`needs: [diff, tore, bau, e2e]`);
Vercel-Git-Deploys sind aus. **Handdeploy verboten** — Ausnahme und Ausreden:
`referenz-ausnahmen.md`.

## §12 · Isolation

1. Jede weitere Session arbeitet in einem eigenen git-Worktree; fremder WIP
   in `git status` ⇒ in einen Worktree wechseln.
2. **Im geteilten Verzeichnis:** Commits nur mit Pathspec
   (`git commit -- <dateien>`) · kein `git stash` bei fremdem WIP · kein
   Amend (Hook blockt) · nach jedem Commit die `--stat`-Zahl gegen die eigene
   add-Liste prüfen.
3. Deploys nie aus dem Arbeitsverzeichnis.
4. **Merge-Treiber** (`.gitattributes`, gesetzt via `npm install` bzw.
   `bash scripts/git-setup.sh`): Append-Register `merge=union`; generierte
   Projektionen `merge=regen` (Generator neu laufen lassen); `golden/*.json`
   und `public/normtext/**` ohne Treiber — dort soll der Konflikt anhalten.
   `rerere` wendet Auflösungen auch fremd an: Paket-Zweige mit
   `git -c rerere.enabled=false merge`. Treiber wirken nur lokal.

## Merge-Queue

Ruleset: SQUASH · ALLGREEN · max. 3 Einträge · 60 min Check-Timeout · kein
Bypass. Repo bleibt public (CI-Kosten).

- `gh pr merge <n> --squash` reiht ein, `--auto` nach grünen Checks. **Falle:** auf nicht-grünem PR schärft `gh` still Auto-Merge —
  zurück mit `--disable-auto`.
- Die Queue stapelt spekulativ: gleiche Datei wie ein Vordermann ⇒ UNMERGEABLE.
- PR-Titel = Squash-Betreff; ändert der PR Tests, darf der Typ nicht
  `refactor` sein (`check:fachaenderung`).
- Queue-Stand nur per
  `gh api graphql -f query='{repository(owner:"LexMetrik",name:"Whatever"){mergeQueue(branch:"main"){entries(first:10){nodes{state position pullRequest{number}}}}}}'`.
- **Rauswurf:** erst den `merge_group`-Lauf lesen, dann neu einreihen. Bei
  `merge_conflict` reiht der Nachzug-Push nicht selbst ein. Ein Flake, der die
  Queue blockiert ⇒ Wurzel-Fix als eigener Mini-PR.
- Nie pushen, solange der PR in der Queue steht: austragen, pushen, einreihen.
- Folgezweig nach Squash der Basis: `git rebase --onto origin/main <alt-sha>`.
- Mehrere PRs mit Nachträgen an dieselbe Stelle: der letzte trägt gesammelt.

## Ablauf

**0 · Vorbedingungen.** Tor-Kommandos nackt, Exit-Code lesen; `find src -name
'__*'` leer; untracked Root-Ballast nie committen.

**1 · Tore.** Beleg = PR-Lauf grün am Kopf-SHA (Lauf-ID); build, e2e und
perf-budget belegt der `merge_group`-Lauf; lokal nur gezielte Einzelprüfungen.
Golden-Abweichung erst fremden Commits zuordnen.
`check:netz` Exit 2 heisst «unvollständig», nicht grün.

**2 · Bug-Check.** Produkt-/Werkzeug-Diff (`src/**`, `scripts/**`,
`.github/**`, `vercel.json`, `package.json`): unabhängige Review-Agenten über
das Deploy-Delta, Befunde mit Regressionstest fixen. Reiner
Doku-/Plan-/Test-Diff: kein Agenten-Bug-Check.

**3 · Serielle Landung, ein Kommando aufs Mal.**
1. Parallel-Session sichtbar ⇒ PR-Kommentar «Landung übernommen — <Session>»;
   wer einen jüngeren fremden sieht, merged nicht.
2. Kollisionen: `gh pr list --state open` und Queue-Abfrage; gemeinsame Datei
   mit offenem oder eingereihtem PR ⇒ erst den Vordermann landen.
3. origin/main in den Zweig ziehen.
4. Konflikte nie von Hand mischen: generierte Datei ⇒ Generator
   (`npm run datenhaltung:manifest`, Banner-`gen:*`, Entscheide-Pipeline);
   `golden/*.json` von Hand, `npm run golden`, Byte-Diff bewusst bestätigen;
   `public/normtext/**` ⇒ Gegenprüfung.
   GitHub kennt `union` nicht: nach jeder Landung eines Risikopfad- oder
   Generat-PR origin/main lokal in den nächsten solchen Zweig mergen, dann
   erst einreihen.
5. **CI zweimal verifizieren:** vor dem Einreihen PR-Checks grün; danach den
   `merge_group`-Lauf bis MERGED pollen. `cancelled`/`skipped` = ROT, ausser
   designte Skips (`bau`, Browser-Shards, «Perf-Budget» auf `pull_request`;
   «Deploy» im `merge_group`). Fehlende Checks = PENDING.
6. **Daten-/Extraktions-PR:** Stichprobe n ≥ 10 neuer Entitäten gegen die
   amtliche Quelle, Identitäts-Treffer mit Wortgrenze, Quote im PR.
7. **Einreihen:** Nicht-Risiko `gh pr merge <nr> --squash --auto` nach 0–2;
   **Risikopfad** nach Verdikt von Hand `gh pr merge <nr> --squash`, nie
   `--auto`. Nie bei Rot. Push auf den Feature-Zweig ist stehend freigegeben. Werkzeug: `scripts/landung/landung-kette.sh <log> <PR>…`
   (seriell, pollt bis MERGED, hält bei Rot/UNMERGEABLE/LOCKED); nie
   `gh run watch`. Kriterium ist die Required-Liste, nie `mergeStateStatus`;
   DIRTY/UNKNOWN > 2 Runden oder Eintrag > 60 min ⇒ Stillstand melden.
8. Der abschliessende PR streicht das Vorhaben aus JETZT, neue Funde als
   EINGANG- bzw. FEHLERBESTAND-Zeile.

## Risiko-Pfade und Trailer

`--auto` ist auf Risiko-Pfaden (`istRisikoPfad()`) gesperrt, weil es nur den
Stand beim Aktivieren prüft. Das Verdikt braucht prüfbare Form UND Zuwachs im
Gegenprüfungs-Register (erzwungen von «Merge-Schutz», Hook und
`check:gegenpruefung`). Risikopfad-PRs einzeln einreihen.

- Trailer (`Roadmap:`, `Gegenpruefung:`, `Fachaenderung:`) gehören in den
  **letzten Absatz des PR-Body**, nach «🤖 Generated with …», jede Zeile
  < 72 Zeichen (die Queue baut den Squash aus Titel + Body und bricht um).
  Volle Form wie im Commit; vorher `npm run check:merge-schutz`. Leser auf
  main-Commits werten Body-Zeilen, nie `%(trailers)`.
- `gh pr edit --body-file` und `gh pr merge` nie in einem Aufruf.
- «no checks reported» ⇒ zuerst Mergeability prüfen; bei Konflikt baut GitHub
  keinen Lauf.
- Ändert ein main-Merge den Endinhalt eigener Risiko-Dateien, braucht es ein
  Nach-Verdikt derselben Prüfinstanz.

## Prüfstrasse

- Pflicht-Kontexte: Tore · Merge-Schutz · Perf-Budget · Browser-Smoke. Ein per
  `if:` übersprungener Pflicht-Job gilt als erfüllt — `tore` bleibt immer aktiv.
- Specs mit `// @shard-gruppe: nacht` laufen nur nachts; `nacht` nur für reine
  Geometrie/Fokus/CLS/Navigation/Kontrast. Prüft eine Spec Rechenwerte oder
  Rechtstext-Inhalt ⇒ Queue; Einstufung nur nach vollständigem Lesen, im
  Zweifel Queue.
- Retry-Grün ist Warnung plus Issue `flake` = Wurzelfix-Posten.

## Nachkontrolle

1. Push-Lauf auf main «cancelled» ⇒ `gh run rerun <id>`.
2. Job «Deploy (Prod, Vercel CLI)» im Push-Lauf grün (skipped ≠ grün);
   Gegenprobe `curl -s https://lexmetrik.vercel.app/ | grep lexmetrik-build`
   = Kurz-SHA des main-Kopfs; Zeile `Vercel-Aufräumen: …` im Deploy-Log ohne
   `::warning::` (der Schritt wird nie rot).
3. Kernrouten HTTP 200 (`/`, `/rechner/tagerechner`, `/vorlagen`).
4. Neues `package-lock.json` ⇒ `npm ci` im Haupt-Checkout. Nach Daten-PRs
   `npm run projektionen`; `datenhaltung:manifest` nur nach rotem
   `check:datenhaltung`, mit Begründung.

## Session-Ende

Eigene Worktrees und Zweige verlassen die Session gemergt oder gelöscht
(lokal und remote). Geparkte Stände sind Tags (`archiv/<slug>-<datum>` auf den LOKALEN
Kopf). Dependabot: Patch/Minor einreihen, Major begründet schliessen,
Sicherheits-PRs sofort. Fremde Agenten-PRs erst prüfen, nie Auto-Merge.
Den EIGENEN Worktree zuletzt entfernen — ohne ihn stehen Bash und Read still.

## Red Flags — STOP

Handdeploy · `--auto` vor 0–2 · main-Push oder Bypass · blindes
Neu-Einreihen · Push-Bestätigung bei David erfragen · Einreihen bei Rot.
