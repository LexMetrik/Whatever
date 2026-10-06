#!/usr/bin/env bash
# ─── Materialien-Nachzug: Bash-Rümpfe der Workflow-Stufen (MONITOR, 6.10.2026) ──────────────
# Aufrufer: .github/workflows/materialien-nachzug.yml, je Stufe `bash <dieses Skript> <stufe>`.
# Die `if:`-Bedingungen bleiben im Workflow (sie steuern die Stufen); hier stehen nur die Rümpfe,
# ausgelagert am 6.10.2026 gegen den Steuerflächen-Deckel (check:steuerflaeche, §17-Gegengewicht:
# erst streichen, dann hinzufügen). Tests: src/tests/materialien-nachzug.test.ts fährt jede Stufe
# über die run-Zeile des Workflows gegen Ersatz-gh/-git/-npm.
#
# Auftrag David 6.10.2026 «mach die materialien». Bis dahin meldete check:materialien-netz Drift
# nur im Wochenbericht des Normen-Monitors (check:netz:bericht); nachgeführt wurde von Hand
# (materialien:snapshot je Quelle + materialien:kaskade). Der Bot macht den Handablauf.
#
# Ablauf: npm run materialien:nachzug (scripts/materialien/nachzug.ts, Begründungen dort):
#   check:materialien-netz → je driftender Quelle materialien:snapshot + materialien →
#   materialien:kaskade --ohne-revisionen → Pfad-Wache → Rauschschutz (angehängte dok-Zeilen).
#   Vorprüfung (vor jedem Netz-Abruf, Gegenprüfung 6.10.2026 B1/B2; vorpruefung() in nachzug.ts):
#   offener Nachzug-PR oder (schedule) offener Pause-Zettel alarm:materialien-nachzug ⇒
#   ::notice::, status=keine — kein Wiederholungs-Vollcrawl; workflow_dispatch übersteuert den
#   Pause-Zettel. Jeder rote Lauf legt den Pause-Zettel an; nur ein grüner Lauf mit echtem
#   Ergebnis (nachgeladen/keine Drift) schliesst ihn — nach Reparatur per workflow_dispatch. Ein
#   geschlossener, nicht gemergter Nachzug-PR gibt frei (Schliessen = Entscheid). trockenlauf
#   fasst keine Zettel an.
#   status=keine     → nichts zu tun / nur Datumsstempel / Netzfehler beim Nachladen, kein PR
#                      (Netzfehler: Zettel alarm:materialien-nachzug-netz; zweiter in Folge ⇒ rot).
#   status=anfuegung → nur neue Dokumente: normaler PR.
#   status=pruefen   → Dokument geändert, entlistet oder wieder gelistet: PR als ENTWURF.
# Netz-/Count-Gate-Befunde (nicht von echter Drift unterscheidbar) sind ::warning::, kein PR,
# kein Rot. Rot NUR bei Werkzeugfehler (Exit 1 des Bots, Widerspruch Detektor ↔ Snapshot, rote
# Tore auf dem nachgeführten Stand, zweiter Netzfehler in Folge) — check:ci-laeufe sieht den Lauf.
#
# ESTV-MWST (robots.txt `Disallow: /`): Vollabruf (~3100 Abrufe, Concurrency ≤ 2, 300 ms Delay,
# identifizierender UA — adapter-estv-mwst.ts) NUR bei erkannter Änderung. Entscheid David
# 6.10.2026 (Chat): «Ja, mit einschliessen»; Grenze: kein zusätzlicher periodischer Vollcrawl.
# Der Step-Timeout der Stufe «Nachzug» (110) liegt unter dem Job-Timeout (120): eine
# Zeitüberschreitung des Vollcrawls färbt die Stufe rot, failure() greift sicher und der
# Pause-Zettel entsteht (bei Job-Timeout ist das Laufen der cancelled()-Stufe nicht belegt; GP 6.10.).
#
# NIE Auto-Merge: public/materialien/** und das Zustands-Manifest liegen auf dem Risikopfad
# (istRisikoPfad, scripts/gegenpruefung/kern.ts); der Merge-Schutz verlangt ein Verdikt.
# Takt montags 05:43 UTC: nach dem Reparatur-Arm fedlex-frische.yml (04:43), vor dem
# Normen-Monitor (07:17) — der Wochenbericht misst dann den nachgeführten Stand (Bauplan Befund 6).
#
# Stufen (Umgebung setzt der Workflow je Stufe):
#   lauf         Vorab-Abfragen (offene PR-Köpfe, Pause- und Netz-Zettel) VOR dem Bot-Aufruf,
#                dann npm run materialien:nachzug. Env: QUELLEN AUSLOESER DATUM GH_TOKEN.
#   netz-zettel  Netz-Zettel (Muster normen-monitor.yml): anlegen | kommentieren | schliessen.
#                FAIL-SAFE: scheitert Anlegen/Kommentieren, wird der Lauf ROT — ohne Zettel griffe
#                die Zwei-Läufe-Grenze nie. Schliessen scheitert ⇒ Warnung (wie Monitor).
#   tore         Tore auf dem nachgeführten Stand; rc nach $GITHUB_OUTPUT, Stufe selbst grün.
#   trocken      trockenlauf: Änderungen nur anzeigen.
#   pr           Zweig, Commit, PR (Entwurf bei status=pruefen), CI-Dispatch. NIE Auto-Merge.
#   rot          Lauf rot färben (Widerspruch, Tore rot, zweiter Netzfehler in Folge).
#   pause-rot    Pause-Zettel anlegen oder kommentieren (jeder rote/abgebrochene Lauf).
#                FAIL-SAFE: scheitert die Pflege, bleibt der Lauf rot.
#   pause-gruen  Pause-Zettel schliessen (grüner Lauf mit echtem Ergebnis); Scheitern ⇒ Warnung.

# Arbeitsordner (PR-Text, Commit-Text). NICHT im Job-level env des Workflows: dort gibt es den
# runner-Kontext nicht, GitHub verwarf die ganze Datei (HTTP 422, Vorfall #1336, 6.10.2026; Tor
# src/tests/workflow-kontexte.test.ts). RUNNER_TEMP ist in jeder Stufe gleich; Default wie nachzug-run.ts.
NACHZUG_TMP="${NACHZUG_TMP:-${RUNNER_TEMP:-.gate}/materialien-nachzug}"
export NACHZUG_TMP

PAUSE_ABFRAGE="repos/$GITHUB_REPOSITORY/issues?labels=alarm:materialien-nachzug&state=open&creator=github-actions%5Bbot%5D"
NETZ_ABFRAGE="repos/$GITHUB_REPOSITORY/issues?labels=alarm:materialien-nachzug-netz&state=open&creator=github-actions%5Bbot%5D"
ERSTE_NR='[.[]|select(.pull_request|not)][0].number // empty'

case "${1:-}" in
  lauf)
    set -euo pipefail
    OFFENE_KOEPFE=$(gh pr list --state open --limit 500 --json headRefName --jq '.[].headRefName')
    PAUSE_ZETTEL=$(gh api "$PAUSE_ABFRAGE" -q "$ERSTE_NR")
    NETZ_ZETTEL=$(gh api "$NETZ_ABFRAGE" -q "$ERSTE_NR")
    export OFFENE_KOEPFE PAUSE_ZETTEL NETZ_ZETTEL
    npm run materialien:nachzug -- --datum="${DATUM}" --quellen="${QUELLEN}"
    ;;

  netz-zettel)
    set -euo pipefail
    trap 'echo "::error::Netz-Zettel-Pflege gescheitert (Z. $LINENO) — ohne Zettel greift die Zwei-Läufe-Grenze nie, darum Lauf ROT (fail-safe)"; exit 1' ERR
    case "$AKTION" in
      schliessen)
        trap 'echo "::warning::Netz-Zettel-Schliessen gescheitert (Z. $LINENO), Lauf unberührt"; exit 0' ERR
        gh issue close "$NR" --reason completed --comment "🟢 Materialien-Nachzug am $(date +%F) wieder ohne Netzfehler. Lauf: ${RUN_URL}"
        ;;
      kommentieren)
        gh issue comment "$NR" --body "Erneut Netzfehler beim Nachladen am $(date +%F) — Lauf ROT (Zwei-Läufe-Grenze); der Takt pausiert bis zu einem grünen Lauf per workflow_dispatch. ${NETZFEHLER}. Lauf: ${RUN_URL}"
        ;;
      anlegen)
        gh label create alarm:materialien-nachzug-netz --color FBCA04 --description "Materialien-Nachzug: Netzfehler beim Nachladen (materialien-nachzug.yml)" >/dev/null 2>&1 || true
        gh issue create --label alarm:materialien-nachzug-netz --title "🟠 Materialien-Nachzug: Netzfehler beim Nachladen ($(date +%F))" --body "Snapshot nach erkannter Drift an einem erschöpften Abruf abgebrochen, Änderungen verworfen: ${NETZFEHLER}. Bleibt das im nächsten Lauf so, wird er ROT. Lauf: ${RUN_URL}"
        ;;
      *) echo "::error::Unbekannte Zettel-Aktion «${AKTION}»"; exit 1 ;;
    esac
    ;;

  tore)
    set +e
    rc=0
    npm run check:materialien || rc=1
    npm run check:entstehung || rc=1
    npm run check:zaehler || rc=1
    npm run check:paritaet || rc=1
    npm run check:datenhaltung || rc=1
    npx vitest run src/tests/materialien-register.test.ts src/tests/materialien-zustand.test.ts src/tests/soft-law-zustand.test.ts src/tests/kanten-erlasse.test.ts src/tests/materialien-nachzug.test.ts --maxWorkers=2 || rc=1
    echo "rc=$rc" >> "$GITHUB_OUTPUT"
    if [ "$rc" != 0 ]; then echo "::warning::Tore rot auf dem nachgeführten Materialien-Stand"; fi
    exit 0
    ;;

  trocken)
    git -c core.quotePath=false status --short | head -200
    git diff --stat | tail -5
    cat "$NACHZUG_TMP/pr-body.md" >> "$GITHUB_STEP_SUMMARY"
    ;;

  pr)
    set -euo pipefail
    # Nur neue Dokumente, aber Tore rot: kein PR, Lauf rot (Wächter). Ein Entwurf (pruefen)
    # geht mit Tor-Vermerk raus — er braucht ohnehin eine Session.
    if [ "$STATUS" = anfuegung ] && [ "$TORE" != 0 ]; then
      echo "::error::Nur neue Dokumente, aber Tore rot — kein PR. Log der Tor-Stufe lesen."
      exit 1
    fi
    # Offener Bot-PR ⇒ schon die Stufe «Nachzug» bricht ab (vorpruefung, B1) — hier kein Zweitcheck.
    branch="chore/materialien-nachzug-${DATUM}"
    body="$NACHZUG_TMP/pr-body.md"
    if [ "$TORE" != 0 ]; then
      printf '\n**Tore im Bot-Lauf: ROT** — Log des Laufs %s/%s/actions/runs/%s.\n' \
        "$GITHUB_SERVER_URL" "$GITHUB_REPOSITORY" "$GITHUB_RUN_ID" >> "$body"
    else
      printf '\nTore im Bot-Lauf grün: check:materialien · check:entstehung · check:zaehler · check:paritaet · check:datenhaltung · vitest Materialien-Register/-Zustand/Kanten/Nachzug.\n' >> "$body"
    fi
    git config user.name  "materialien-nachzug-bot"
    git config user.email "noreply@anthropic.com"
    git checkout -b "$branch"
    # GENAU die erlaubten Pfade (ERLAUBTE_PFADE in scripts/materialien/nachzug.ts — Test koppelt);
    # -A, damit verwaiste Kanten-Shards als Löschung mitgehen.
    git add -A -- bibliothek/register/soft-law-zustand.jsonl public/materialien/ src/data/startseiteZaehler.generated.ts daten-manifest.json
    {
      echo "chore(materialien): Soft-Law-Nachzug ${DATUM} (${QUELLEN_LAUF})"
      echo
      echo "Automatischer Lauf materialien-nachzug.yml (scripts/materialien/nachzug.ts),"
      echo "Bot-Tor: ${STATUS}. Je Quelle materialien:snapshot + materialien, dann"
      echo "materialien:kaskade --ohne-revisionen. Quellen: amtliche Publikationen von"
      echo "SECO, EDOEB und ESTV (Hub-/Index-/ToC-Seiten, Abruf ${DATUM})."
      echo
      echo "Roadmap: MONITOR"
      echo "Gegenpruefung: ausstehend — Bot-PR, Session prüft"
      echo "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
    } > "$NACHZUG_TMP/commit.txt"
    git commit -F "$NACHZUG_TMP/commit.txt"
    # Bot-eigener Zweig: ein Rest aus einem abgebrochenen Lauf (Zweig ohne PR) wird überschrieben.
    git push --force -u origin "$branch"
    if [ "$STATUS" = pruefen ]; then
      gh pr create --draft --base main --head "$branch" \
        --title "chore(materialien): Soft-Law-Nachzug ${DATUM} — ENTWURF, geänderte/entlistete Dokumente prüfen" \
        --body-file "$body"
    else
      gh pr create --base main --head "$branch" \
        --title "chore(materialien): Soft-Law-Nachzug ${DATUM} — neue Dokumente (${QUELLEN_LAUF})" \
        --body-file "$body"
    fi
    # CI anstossen (github.token löst keine PR-Workflows aus; workflow_dispatch ist die Ausnahme).
    if gh workflow run ci.yml --ref "$branch"; then
      echo "CI (ci.yml) auf '${branch}' angestossen."
    else
      echo "::warning::ci.yml-Dispatch auf '${branch}' fehlgeschlagen — der Wächter zieht die Kontexte nach."
    fi
    ;;

  rot)
    if [ "$ZETTEL" = kommentieren ]; then echo "::error::Zweiter Netzfehler beim Nachladen in Folge (Netz-Zettel offen) — Zwei-Läufe-Grenze."; fi
    if [ -n "$WIDERSPRUCH" ]; then
      echo "::error::Widerspruch ${WIDERSPRUCH}: check:materialien-netz meldet Drift, der Snapshot schrieb keine Zustandsänderung — Detektor oder Snapshot defekt."
    fi
    if [ "${TORE:-0}" != 0 ]; then echo "::error::Tore auf dem nachgeführten Materialien-Stand rot — siehe Stufe «Tore»."; fi
    exit 1
    ;;

  pause-rot)
    set -euo pipefail
    trap 'echo "::error::Pause-Zettel-Pflege gescheitert (Z. $LINENO) — der Takt pausiert NICHT, Lauf-Log lesen"; exit 1' ERR
    grund=""
    [ "$LAUF" = failure ] && grund="${grund} Werkzeugfehler des Bots (Stufe «Nachzug»);"
    [ -n "$WIDERSPRUCH" ] && grund="${grund} Widerspruch Detektor ↔ Snapshot (${WIDERSPRUCH});"
    [ -n "$TORE" ] && [ "$TORE" != 0 ] && grund="${grund} Tore rot auf dem nachgeführten Stand;"
    [ "$ZETTEL" = kommentieren ] && grund="${grund} zweiter Netzfehler beim Nachladen in Folge;"
    [ -z "$grund" ] && grund=" Lauf rot oder abgebrochen in einer anderen Stufe (PR, Zettel, Zeitüberschreitung);"
    text="Lauf ROT am $(date +%F):${grund} Nach Reparatur: workflow_dispatch; ein grüner Lauf schliesst den Zettel. Lauf: ${RUN_URL}"
    nr=$(gh api "$PAUSE_ABFRAGE" -q "$ERSTE_NR")
    if [ -n "$nr" ]; then
      gh issue comment "$nr" --body "$text"
    else
      gh label create alarm:materialien-nachzug --color D93F0B --description "Materialien-Nachzug: roter Lauf, schedule pausiert (materialien-nachzug.yml)" >/dev/null 2>&1 || true
      gh issue create --label alarm:materialien-nachzug --title "🔴 Materialien-Nachzug pausiert ($(date +%F)) — roter Lauf" --body "$text"
    fi
    ;;

  pause-gruen)
    set -euo pipefail
    trap 'echo "::warning::Pause-Zettel-Schliessen gescheitert (Z. $LINENO) — schedule bleibt pausiert"; exit 0' ERR
    gh issue close "$NR" --reason completed --comment "🟢 Materialien-Nachzug am $(date +%F) grün mit echtem Ergebnis — schedule läuft wieder. Lauf: ${RUN_URL}"
    ;;

  *) echo "::error::nachzug-stufen.sh: unbekannte Stufe «${1:-}»" >&2; exit 1 ;;
esac
