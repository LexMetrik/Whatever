#!/bin/bash
# Serielle Landung einer PR-Kette (Skill `landung` Ziff. 3, Schritte 2-8).
#
# Herkunft: am 7.9.2026 in der W2·24-Nachwunsch-Session als Wegwerf-Skript
# entstanden und dreizehn Landungen lang benutzt (#744-#758). Es wandert hier
# ins Repo, weil es zwei Fallen dieser Session fest verdrahtet und keine
# Folge-Session sie noch einmal von Hand lernen soll (§17):
#
#   (1) `gh run watch` brach zweimal vorzeitig mit Exit 1 ab, obwohl der Lauf
#       noch lief - darum wird der Status gepollt, nie gewatcht.
#   (2) GitHub startet auf einem PR im Zustand DIRTY (Konflikt mit main) gar
#       KEINEN `pull_request`-Lauf. «Kein CI-Lauf» heisst darum zuerst
#       «Konflikt?», nicht «Skip-CI-Marker?» (L-O8, 7.9.2026).
#
# Ausserdem verdrahtet: der Zweig wird erst geloescht, NACHDEM
# `gh pr view --json state` MERGED meldet - nicht schon nach dem
# Merge-Kommando (Vorfall #533, 16.8.2026; Hook `tor-schutz.py` bewacht das).
#
# Aufruf:  bash scripts/landung/landung-kette.sh <logdatei> <PR> [<PR> ...]
# Repo:    $LEXMETRIK_REPO, sonst das Haupt-Checkout unten.
#
# Die Kette HAELT AN, sobald ein PR rot, blockiert oder nicht gemerged ist -
# sie merged nie einen roten PR und mischt nie Konflikte von Hand (§9).
# Sie ersetzt die Sorgfalt der Ziff. 0-2 NICHT: Tore, Bug-Check und
# Kollisions-Sichtung stehen vor dem Aufruf, nicht darin.

LOG="$1"; shift
cd "${LEXMETRIK_REPO:-/Users/david/Developer/LexMetrik}" || exit 2
for PR in "$@"; do
  echo "== PR #$PR $(date +%H:%M)" >> "$LOG"
  for versuch in 1 2 3; do
    ST=$(gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus)
    # Direkt nach einem Push liefert GitHub den ALTEN Zustand (DIRTY/UNKNOWN), bis die
    # Mergbarkeit neu gerechnet ist — Vorfall 15.9.2026, PR #892: main war schon im
    # Zweig, die Kette hielt trotzdem mit DIRTY an. Darum erst nachfragen (bis 3×20 s).
    for w in 1 2 3; do
      [ "$ST" != "DIRTY" ] && [ "$ST" != "UNKNOWN" ] && break
      sleep 20; ST=$(gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus)
    done
    if [ "$ST" = "BEHIND" ]; then gh pr update-branch "$PR" >> "$LOG" 2>&1; sleep 60; fi
    if [ "$ST" = "DIRTY" ]; then
      echo "PR #$PR: DIRTY (Konflikt mit main) - GitHub startet keinen CI-Lauf." >> "$LOG"
      echo "  Erst main im Worktree in den Zweig mergen (Konflikte nach Ziff. 3.4), dann neu starten." >> "$LOG"
      echo "halt" >> "$LOG"; exit 1
    fi
    HEAD=$(gh pr view "$PR" --json headRefOid -q .headRefOid)
    R=""
    for i in $(seq 1 20); do
      R=$(gh run list --limit 30 --json databaseId,headSha,event,name -q ".[] | select(.headSha==\"$HEAD\" and .event==\"pull_request\" and .name==\"CI\") | .databaseId" | head -1)
      [ -n "$R" ] && break; sleep 20
    done
    if [ -z "$R" ]; then
      echo "PR #$PR: kein CI-Lauf fuer $HEAD - Ursachen der Reihe nach: Konflikt (DIRTY)?, dann Skip-CI-Marker im PR?" >> "$LOG"
      echo "halt" >> "$LOG"; exit 1
    fi
    # Poll statt `gh run watch` (Falle 1 im Kopf).
    while [ "$(gh run view "$R" --json status -q .status)" != "completed" ]; do sleep 45; done
    C=$(gh run view "$R" --json conclusion -q .conclusion); [ "$C" = "success" ] && RC=0 || RC=1
    echo "PR #$PR run $R exit $RC" >> "$LOG"
    # UNKNOWN heisst bei GitHub «wird gerade neu berechnet» — direkt nach einem
    # Auto-Merge oder einem frischen Push ist das der Normalfall, kein Rot. Erst
    # nachfragen (bis 3×20 s), dann urteilen. Vorfall 15.9.2026, PR #874: der PR war
    # per --auto schon MERGED, die Kette las UNKNOWN und hielt mit «ROT/BLOCKIERT» an.
    for w in 1 2 3; do
      ST=$(gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus)
      [ "$ST" != "UNKNOWN" ] && break; sleep 20
    done
    echo "PR #$PR state $ST" >> "$LOG"
    # Schon gelandet (Auto-Merge hat gezuendet)? Dann ist nichts rot — Zweig
    # abraeumen (Loeschung erst NACH bestaetigtem MERGED, Hook-Regel) und weiter.
    if [ "$(gh pr view "$PR" --json state -q .state)" = "MERGED" ]; then
      echo "PR #$PR bereits MERGED (Auto-Merge) $(gh pr view "$PR" --json mergeCommit -q '.mergeCommit.oid[0:9]')" >> "$LOG"
      BR=$(gh pr view "$PR" --json headRefName -q .headRefName)
      git push -q origin --delete "$BR" >> "$LOG" 2>&1 || true
      echo "PR #$PR Zweig $BR entfernt" >> "$LOG"
      break
    fi
    if [ "$RC" = "0" ] && [ "$ST" = "CLEAN" ]; then
      gh pr merge "$PR" --squash >> "$LOG" 2>&1
      sleep 10
      M=$(gh pr view "$PR" --json state,mergeCommit -q '"\(.state) \(.mergeCommit.oid[0:9])"')
      echo "PR #$PR $M" >> "$LOG"
      case "$M" in
        MERGED*)
          BR=$(gh pr view "$PR" --json headRefName -q .headRefName)
          git push -q origin --delete "$BR" >> "$LOG" 2>&1
          echo "PR #$PR Zweig $BR entfernt" >> "$LOG"
          ;;
        *)
          echo "PR #$PR NICHT gemerged - Zweig bleibt" >> "$LOG"
          echo "halt" >> "$LOG"; exit 1
          ;;
      esac
      break
    elif [ "$ST" = "BEHIND" ]; then continue
    else echo "PR #$PR ROT/BLOCKIERT - Kette haelt an" >> "$LOG"; echo "halt" >> "$LOG"; exit 1
    fi
  done
  # Drei Anlaeufe verbraucht (dreimal BEHIND, weil fremde PRs dazwischen landeten) und
  # trotzdem nicht gemerged: laut sagen, nicht still «fertig» melden (15.9.2026, #892:
  # #893/#891/#895 landeten waehrend dreier CI-Laeufe; Kette waere stumm ausgelaufen).
  if [ "$(gh pr view "$PR" --json state -q .state)" != "MERGED" ]; then
    echo "PR #$PR nach 3 Anlaeufen nicht gemerged (immer wieder BEHIND) - Kette neu starten" >> "$LOG"
    echo "halt" >> "$LOG"; exit 1
  fi
done
echo "fertig" >> "$LOG"
