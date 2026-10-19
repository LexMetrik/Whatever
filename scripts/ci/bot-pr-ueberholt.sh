#!/usr/bin/env bash
# scripts/ci/bot-pr-ueberholt.sh <branch-praefix> <neuer-branch> <neue-pr-nr>
# PRUEF-AUTOMATIK (19.10.2026): schliesst ältere OFFENE PRs desselben Daten-Bots
# (gleiches Branch-Präfix) mit Kommentar «Überholt durch #<neu>» und löscht ihren
# Branch — sonst bleiben überholte Bot-PRs (Frische #1311, #1367) ewig offen und
# stauen die Prüf-Routine. Ausgenommen: der neue Branch selbst, Drafts mit Label
# `in-pruefung` (eine Session arbeitet daran). Fehler sind nie fatal (Warnung).
set -uo pipefail
praefix="${1:?Branch-Praefix}"; neu="${2:?neuer Branch}"; nr="${3:?neue PR-Nr}"
liste=$(gh pr list --state open --limit 200 --json number,headRefName,labels \
  --jq ".[] | select((.headRefName | startswith(\"${praefix}\")) and .headRefName != \"${neu}\" and ([.labels[].name] | index(\"in-pruefung\") | not)) | \"\(.number) \(.headRefName)\"") \
  || { echo "::warning::Liste offener Bot-PRs nicht lesbar — nichts geschlossen."; exit 0; }
[ -z "$liste" ] && { echo "Kein älterer offener PR mit Präfix ${praefix}."; exit 0; }
while read -r alt zweig; do
  if gh pr close "$alt" --delete-branch --comment "Überholt durch #${nr} — baut vom aktuellen main."; then
    echo "PR #${alt} (${zweig}) geschlossen, Zweig gelöscht."
  else
    echo "::warning::PR #${alt} (${zweig}) nicht schliessbar."
  fi
done <<< "$liste"
