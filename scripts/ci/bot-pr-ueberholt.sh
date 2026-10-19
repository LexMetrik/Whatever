#!/usr/bin/env bash
# scripts/ci/bot-pr-ueberholt.sh <branch-praefix> <neuer-branch> <neue-pr-nr>
# PRUEF-AUTOMATIK (19.10.2026): schliesst ältere OFFENE PRs desselben Daten-Bots
# mit Kommentar «Überholt durch #<neu>» und löscht ihren Branch — sonst bleiben
# überholte Bot-PRs (Frische #1311, #1367) ewig offen und stauen die Prüf-Routine.
#
# Trefferregel (Zweig): `<praefix><YYYY-MM>` oder `<praefix><YYYY-MM-DD>` — das
# Datumsschema der Bots (fedlex-frische, normen-monatslauf: ISO-Datum;
# lik-nachzug: Monat) —, ÄLTER als der neue Zweig. Kein blosses Präfix: ein
# Handzweig wie `chore/lik-nachzug-fix` wird nie getroffen.
#
# Geschont wird (sinngemäss wie inPruefung() in wochenlauf-kern.ts, A9) jeder PR,
# an dem schon gearbeitet wird — gleich ob Draft oder nicht:
#   · Label `in-pruefung`,
#   · ein Commit, dessen Autor ODER Committer nicht der Bot ist (<name>-bot),
#   · ein Verdikt `Gegenpruefung: <nicht «ausstehend»>` im PR-Text oder in einer
#     Commit-Message,
#   · ein Kommentar/Review eines Menschen (user.type «User», keine Bots).
# Lässt sich die Lage eines PR nicht lesen, wird er ebenfalls geschont.
# Geschlossen wird nur, wenn keine dieser Spuren vorliegt (auch ein Draft ohne
# Label wird dann geschlossen). Fehler sind nie fatal (Warnung, Exit 0).
set -uo pipefail
praefix="${1:?Branch-Praefix}"; neu="${2:?neuer Branch}"; nr="${3:?neue PR-Nr}"
# Bot-Name aus dem Präfix: «chore/fedlex-frische-» → «fedlex-frische-bot».
bot="${praefix#chore/}"; bot="${bot%-}-bot"

json=$(gh pr list --state open --limit 200 --json number,headRefName) \
  || { echo "::warning::Liste offener Bot-PRs nicht lesbar — nichts geschlossen."; exit 0; }
liste=$(printf '%s' "$json" | jq -r --arg p "$praefix" --arg neu "$neu" '
  .[] | select(
    (.headRefName | startswith($p))
    and (.headRefName < $neu)
    and (.headRefName[($p | length):] | test("^[0-9]{4}-[0-9]{2}(-[0-9]{2})?$"))
  ) | "\(.number) \(.headRefName)"') \
  || { echo "::warning::Liste offener Bot-PRs nicht auswertbar — nichts geschlossen."; exit 0; }
[ -z "$liste" ] && { echo "Kein älterer offener PR mit Präfix ${praefix}<Datum>."; exit 0; }

# Gibt den Grund aus, warum PR $1 geschont wird; leer = unberührt (schliessbar).
schon_grund() {
  local n="$1" pr commits aus
  pr=$(gh pr view "$n" --json body,labels </dev/null) || { echo "PR-Lage nicht lesbar"; return; }
  if printf '%s' "$pr" | jq -e '[.labels[].name] | index("in-pruefung")' >/dev/null; then
    echo "Label in-pruefung"; return
  fi
  commits=$(gh api --paginate "repos/{owner}/{repo}/pulls/${n}/commits" </dev/null) || { echo "Commits nicht lesbar"; return; }
  aus=$(printf '%s' "$commits" | jq -r --arg bot "$bot" \
    '.[] | select(.commit.author.name != $bot or .commit.committer.name != $bot) | "\(.commit.author.name)/\(.commit.committer.name)"' | head -1)
  [ -n "$aus" ] && { echo "fremder Commit (Autor/Committer ${aus})"; return; }
  aus=$({ printf '%s' "$pr" | jq -r '.body // ""'; printf '%s' "$commits" | jq -r '.[].commit.message'; } \
    | grep -E '^Gegenpruefung:' | grep -vE '^Gegenpruefung:[[:space:]]*ausstehend' | head -1)
  [ -n "$aus" ] && { echo "Verdikt: ${aus:0:60}"; return; }
  for pfad in "issues/${n}/comments" "pulls/${n}/reviews" "pulls/${n}/comments"; do
    aus=$(gh api --paginate "repos/{owner}/{repo}/${pfad}" </dev/null) || { echo "Kommentare nicht lesbar"; return; }
    aus=$(printf '%s' "$aus" | jq -r '.[] | select(.user.type == "User") | .user.login' | head -1)
    [ -n "$aus" ] && { echo "Kommentar/Review von ${aus}"; return; }
  done
}

while read -r alt zweig <&3; do
  grund=$(schon_grund "$alt")
  if [ -n "$grund" ]; then
    echo "PR #${alt} (${zweig}) geschont: ${grund}."
    continue
  fi
  if gh pr close "$alt" --delete-branch --comment "Überholt durch #${nr} — baut vom aktuellen main." </dev/null; then
    echo "PR #${alt} (${zweig}) geschlossen, Zweig gelöscht."
  else
    echo "::warning::PR #${alt} (${zweig}) nicht schliessbar."
  fi
done 3<<< "$liste"
exit 0
