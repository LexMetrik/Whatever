#!/usr/bin/env bash
# scripts/ci/flake-zettel.sh — Reparatur-Zettel für flackernde Browser-Tests.
#
# Aufruf (ci.yml, Job `e2e-ergebnis`, nur merge_group/push):
#   bash scripts/ci/flake-zettel.sh <ordner-mit-flake-funde-*.json>
#
# ANLASS (Entscheid David 5.10.2026, QS-CI-ZEIT E2): ein Test, der erst im
# Retry grün wird, macht den Shard nicht mehr rot (scripts/check-e2e-flake.ts).
# Damit das Flackern nicht still wird, legt dieses Skript je Spec EIN offenes
# GitHub-Issue an (Titel «Flackert: e2e/<spec>», Label `flake`) — Muster wie
# prod-smoke.yml «Bei Rot — sichtbaren Aufgaben-Zettel anlegen»:
#   · Dedup über den exakten Titel unter den offenen Bot-Issues (unabhängig vom
#     Label: scheitert die Label-Anlage, entsteht das Issue ohne Label und wird
#     trotzdem wiedergefunden).
#   · Besteht schon ein offener Zettel: höchstens EIN Kommentar je Tag (UTC,
#     gemessen an `updated_at`), sonst schriebe jeder Queue-Lauf einen.
#   · Nie rot: jeder Fehler wird zur ::warning, der Lauf bleibt unberührt
#     (die Wertung der Shards macht der Folgeschritt, nicht dieses Skript).
# BEKANNTE GRENZE: zwei gleichzeitige Queue-Läufe mit derselben flackernden Spec
# können beide «kein Zettel» sehen und zwei anlegen — dann einen von Hand
# schliessen; ein Sperr-Mechanismus über `concurrency` würde den Required-Job
# selbst abbrechen und ist darum bewusst nicht gebaut.
#
# Umgebung: GH_TOKEN, GH_REPO, RUN_URL, EVENT, REF (setzt ci.yml).
set -euo pipefail
trap 'echo "::warning::Zettel-Pflege gescheitert (Z. $LINENO), Lauf unberührt"; exit 0' ERR

ordner="${1:-flake-funde}"
shopt -s nullglob
dateien=("${ordner}"/*.json)
if [ "${#dateien[@]}" -eq 0 ]; then
  echo "Keine flackernden Specs in diesem Lauf — kein Zettel."
  exit 0
fi

gh label create flake --color FBCA04 \
  --description "Flackernder Browser-Test — Reparatur-Zettel aus ci.yml (QS-CI-ZEIT)" >/dev/null 2>&1 || true

offen=$(mktemp)
gh api --paginate "repos/${GH_REPO}/issues?state=open&creator=github-actions%5Bbot%5D&per_page=100" \
  -q '.[] | select(.pull_request|not) | "\(.number)\t\(.updated_at[0:10])\t\(.title)"' > "$offen"
heute=$(date -u +%F)

funde=$(jq -c '.funde[]' "${dateien[@]}")
while read -r fund; do
  [ -n "$fund" ] || continue
  spec=$(jq -r '.spec' <<< "$fund")
  retries=$(jq -r '.retries' <<< "$fund")
  titel=$(jq -r '.titel | join(" · ")' <<< "$fund")
  kopf="Flackert: e2e/${spec}"
  zeile="${heute} · ${EVENT:-?} · ${REF:-?} · ${retries}× Retry (${titel}) · Lauf: ${RUN_URL:-?}"
  treffer=$(awk -F'\t' -v t="$kopf" '$3 == t { print $1 " " $2; exit }' "$offen")
  if [ -n "$treffer" ]; then
    nr="${treffer%% *}"
    zuletzt="${treffer#* }"
    if [ "$zuletzt" = "$heute" ]; then
      echo "Zettel #${nr} (${spec}) heute schon fortgeschrieben — kein weiterer Kommentar."
      continue
    fi
    gh issue comment "$nr" --body "Wieder geflackert: ${zeile}"
    echo "Zettel #${nr} (${spec}) kommentiert."
    continue
  fi
  rumpf="Der Browser-Test \`e2e/${spec}\` war nur im Wiederholungsversuch grün (Playwright \`retries: 2\`). Seit dem Entscheid David 5.10.2026 macht das den Lauf NICHT mehr rot — dieser Zettel ist die Reparatur-Erinnerung. **Wurzel messen und beheben** (Report/Traces des Laufs, Skill \`lehren\` §17), dann schliessen. Erster Fund: ${zeile}"
  # shellcheck disable=SC2086 # $l ist bewusst ungequotet: leer = ohne Label (Fallback wie prod-smoke.yml)
  for l in "--label flake" ""; do gh issue create $l --title "$kopf" --body "$rumpf" && break; done
  echo "Zettel für ${spec} angelegt."
done <<< "$funde"
