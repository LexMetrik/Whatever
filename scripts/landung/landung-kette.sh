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
# UMSTELLUNG AUF DIE MERGE-QUEUE (19.9.2026, QS-ORG-UMZUG): seit dem Umzug in
# die Organisation ist auf main die native GitHub-Merge-Queue scharf (Ruleset
# 23699779: SQUASH, ALLGREEN, max. 3 gleichzeitig, Check-Timeout 60 min).
# `gh pr merge --squash` MERGED darum nicht mehr, es REIHT EIN; die Queue baut
# PR + aktuellen main als `merge_group`-Lauf und landet nur bei gruen. Folgen
# fuer dieses Skript:
#   · Der BEHIND-Zweig (`gh pr update-branch` + 60 s Warten) ist ersatzlos
#     weg - die Queue zieht den Zweig selbst nach. Damit faellt auch die
#     Drei-Anlauf-Schleife, die es NUR fuer wiederholtes BEHIND gab.
#   · Nach dem Einreihen wird gepollt, bis der PR MERGED ist (Erfolg) oder bis
#     er aus der Queue FAELLT (mergeQueueEntry weg oder UNMERGEABLE/LOCKED) -
#     dann haelt die Kette an und meldet laut. Sie reiht NIE selbst neu ein:
#     ein Rauswurf heisst, dass der Lauf in der Queue rot war, und das ist ein
#     Befund fuer einen Menschen.
#
# Aufruf:  bash scripts/landung/landung-kette.sh <logdatei> <PR> [<PR> ...]
# Repo:    $LEXMETRIK_REPO, sonst das Haupt-Checkout unten.
#
# Die Kette HAELT AN, sobald ein PR rot, blockiert oder nicht gemerged ist -
# sie reiht nie einen roten PR ein und mischt nie Konflikte von Hand (§9).
# Sie ersetzt die Sorgfalt der Ziff. 0-2 NICHT: Tore, Bug-Check und
# Kollisions-Sichtung stehen vor dem Aufruf, nicht darin.

LOG="$1"; shift
cd "${LEXMETRIK_REPO:-/Users/david/Developer/LexMetrik}" || exit 2
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner) || exit 2
OWNER=${REPO%%/*}; NAME=${REPO##*/}

# PR-Zustand UND Merge-Queue-Eintrag in EINER Abfrage: «<state> <queue-state>».
# `mergeQueueEntry` gibt es nur in GraphQL, nicht in `gh pr view --json`.
# Queue-Zustaende: QUEUED · AWAITING_CHECKS · MERGEABLE · UNMERGEABLE · LOCKED;
# «-» heisst «kein Eintrag» (noch nicht eingereiht ODER rausgefallen).
qzustand() {
  gh api graphql \
    -f query='query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p){state mergeQueueEntry{state}}}}' \
    -F o="$OWNER" -F n="$NAME" -F p="$1" \
    -q '"\(.data.repository.pullRequest.state) \(.data.repository.pullRequest.mergeQueueEntry.state // "-")"' 2>/dev/null
}

for PR in "$@"; do
  echo "== PR #$PR $(date +%H:%M)" >> "$LOG"
  ST=$(gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus)
  # Direkt nach einem Push liefert GitHub den ALTEN Zustand (DIRTY/UNKNOWN), bis die
  # Mergbarkeit neu gerechnet ist — Vorfall 15.9.2026, PR #892: main war schon im
  # Zweig, die Kette hielt trotzdem mit DIRTY an. Darum erst nachfragen (bis 3×20 s).
  for w in 1 2 3; do
    [ "$ST" != "DIRTY" ] && [ "$ST" != "UNKNOWN" ] && break
    sleep 20; ST=$(gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus)
  done
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

  # Schon gelandet (die Queue hat den PR aus einem frueheren Einreihen gemerged)?
  # Dann ist nichts rot — Zweig abraeumen (Loeschung erst NACH bestaetigtem
  # MERGED, Hook-Regel) und weiter.
  if [ "$(gh pr view "$PR" --json state -q .state)" = "MERGED" ]; then
    echo "PR #$PR bereits MERGED $(gh pr view "$PR" --json mergeCommit -q '.mergeCommit.oid[0:9]')" >> "$LOG"
    BR=$(gh pr view "$PR" --json headRefName -q .headRefName)
    git push -q origin --delete "$BR" >> "$LOG" 2>&1 || true
    echo "PR #$PR Zweig $BR entfernt" >> "$LOG"
    continue
  fi

  # NIE einen roten PR einreihen. Das Ruleset (ALLGREEN) wuerde ihn ohnehin
  # abweisen — hier wird der Grund aber verstaendlich benannt, statt dass die
  # Session eine nackte gh-Fehlermeldung liest.
  if [ "$RC" != "0" ]; then
    echo "PR #$PR: CI-Lauf $R ist ROT ($C) - nicht eingereiht, Kette haelt an." >> "$LOG"
    echo "halt" >> "$LOG"; exit 1
  fi

  # UNKNOWN heisst bei GitHub «wird gerade neu berechnet» — direkt nach einem
  # frischen Push ist das der Normalfall, kein Rot. Erst nachfragen (bis 3×20 s),
  # dann urteilen. Vorfall 15.9.2026, PR #874.
  for w in 1 2 3; do
    ST=$(gh pr view "$PR" --json mergeStateStatus -q .mergeStateStatus)
    [ "$ST" != "UNKNOWN" ] && break; sleep 20
  done
  echo "PR #$PR state $ST" >> "$LOG"
  # BEHIND ist seit der Merge-Queue KEIN Haltegrund mehr: die Queue baut den PR
  # gegen den aktuellen main und zieht ihn dabei selbst nach.
  case "$ST" in
    CLEAN|BEHIND|HAS_HOOKS|UNSTABLE) ;;
    *) echo "PR #$PR BLOCKIERT ($ST) - Kette haelt an" >> "$LOG"; echo "halt" >> "$LOG"; exit 1 ;;
  esac

  if ! gh pr merge "$PR" --squash >> "$LOG" 2>&1; then
    echo "PR #$PR: Einreihen in die Merge-Queue fehlgeschlagen - Kette haelt an" >> "$LOG"
    echo "halt" >> "$LOG"; exit 1
  fi
  echo "PR #$PR in die Merge-Queue eingereiht $(date +%H:%M)" >> "$LOG"

  # Warten, bis die Queue geurteilt hat. Grosszuegig ueber dem Queue-Check-
  # Timeout (60 min): 120 × 60 s = 120 min, weil bis zu 3 Eintraege parallel
  # bauen und der eigene dahinter stehen kann.
  GESEHEN=0; ERGEBNIS=""
  for i in $(seq 1 120); do
    Z=$(qzustand "$PR")
    # Leere Antwort = GraphQL-Stoerung, kein Urteil: nur weiterpollen (nie als
    # «aus der Queue gefallen» werten).
    if [ -z "$Z" ]; then sleep 60; continue; fi
    PRST=${Z%% *}; QST=${Z##* }
    [ "$PRST" = "MERGED" ] && { ERGEBNIS="MERGED"; break; }
    if [ "$PRST" = "CLOSED" ]; then ERGEBNIS="CLOSED"; break; fi
    case "$QST" in
      UNMERGEABLE|LOCKED) ERGEBNIS="RAUS:$QST"; break ;;
      -) # Kein Eintrag. Vor dem ersten gesehenen Eintrag ist das die Anlaufzeit
         # (die Queue braucht ein paar Sekunden), danach ein Rauswurf.
         [ "$GESEHEN" = "1" ] && { ERGEBNIS="RAUS:kein-Eintrag"; break; }
         [ "$i" -ge 5 ] && { ERGEBNIS="RAUS:nie-eingereiht"; break; } ;;
      *) GESEHEN=1 ;;
    esac
    sleep 60
  done

  if [ "$ERGEBNIS" = "MERGED" ]; then
    echo "PR #$PR MERGED $(gh pr view "$PR" --json mergeCommit -q '.mergeCommit.oid[0:9]') $(date +%H:%M)" >> "$LOG"
    BR=$(gh pr view "$PR" --json headRefName -q .headRefName)
    git push -q origin --delete "$BR" >> "$LOG" 2>&1
    echo "PR #$PR Zweig $BR entfernt" >> "$LOG"
    continue
  fi

  # Alles andere: laut melden, Zweig BEHALTEN, nicht neu einreihen.
  case "$ERGEBNIS" in
    RAUS:*)
      echo "PR #$PR aus der Merge-Queue GEFALLEN ohne Merge (${ERGEBNIS#RAUS:}) - Zweig bleibt." >> "$LOG"
      echo "  Haeufigster Grund: der merge_group-Lauf (PR + aktueller main) war rot." >> "$LOG"
      echo "  Lauf pruefen, Ursache beheben, dann von Hand neu einreihen - die Kette tut das NIE selbst." >> "$LOG" ;;
    CLOSED)
      echo "PR #$PR wurde GESCHLOSSEN statt gemerged - Zweig bleibt." >> "$LOG" ;;
    *)
      echo "PR #$PR nach 120 min in der Merge-Queue weder gemerged noch rausgefallen (Stillstand) - Zweig bleibt." >> "$LOG"
      echo "  Queue-Zustand zuletzt: ${QST:-unbekannt}. Actions-Liste und Queue-Ansicht pruefen." >> "$LOG" ;;
  esac
  echo "halt" >> "$LOG"; exit 1
done
echo "fertig" >> "$LOG"
