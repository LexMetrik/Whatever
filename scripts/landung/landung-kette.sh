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
#     er aus der Queue faellt bzw. UNMERGEABLE darin stehen bleibt - dann haelt
#     die Kette an und meldet laut. Sie reiht NIE selbst neu ein: ein Rauswurf
#     heisst, dass der Lauf in der Queue rot war, und das ist ein Befund fuer
#     einen Menschen.
#
# NACHZUG 19.9.2026 (Bug-Check zur Umstellung, acht Befunde) - was dabei als
# falsch belegt wurde und hier jetzt anders steht:
#   · GraphQL-Fehler (RATE_LIMITED, NOT_FOUND) schreibt `gh` trotz `-q` und
#     `2>/dev/null` als JSON-Koerper auf stdout und endet mit rc=1. Eine
#     nicht-leere Antwort ist darum KEIN Zustand: jede Antwort wird gegen das
#     Muster «OPEN|MERGED|CLOSED <queue>» geprueft, alles andere ist Stoerung
#     (weiterpollen), nie ein Urteil.
#   · `gh pr merge --squash` weist einen ROTEN PR NICHT ab, sondern schaltet
#     still Auto-Merge scharf (cli/cli, pkg/cmd/pr/merge/merge.go: «a pull
#     request can always be added to the merge queue», setzt payload.auto;
#     eigene Hilfe: «If required checks have not yet passed, auto-merge will be
#     enabled»). Beleg #922: AutoMergeEnabledEvent 14:34:05Z, danach
#     AddedToMergeQueueEvent 14:35:13Z. Darum schaltet jeder Halt NACH dem
#     Merge-Kommando Auto-Merge wieder ab - sonst landet der PR von selbst,
#     waehrend das Log «von Hand neu einreihen» sagt.
#   · UNMERGEABLE heisst NICHT «gefallen»: der Eintrag steht weiter in der
#     Queue und blockiert sie (Beleg #921: eingereiht 14:38:46Z, entfernt erst
#     14:58:51Z mit reason: manual). gh (2.93.0) kennt kein Austrage-Kommando.
#
# Aufruf:  bash scripts/landung/landung-kette.sh <logdatei> <PR> [<PR> ...]
# Repo:    $LEXMETRIK_REPO, sonst das Haupt-Checkout unten.
#
# Die Kette HAELT AN, sobald ein PR rot, blockiert oder nicht gemerged ist -
# sie reiht nie einen roten PR ein und mischt nie Konflikte von Hand (§9).
# Sie ersetzt die Sorgfalt der Ziff. 0-2 NICHT: Tore, Bug-Check und
# Kollisions-Sichtung stehen vor dem Aufruf, nicht darin.

# ─── Funktionen ─────────────────────────────────────────────────────────────
# Stehen vor dem Rumpf, damit ein Test-Harness die Datei mit
# LANDUNG_KETTE_NUR_FUNKTIONEN=1 sourcen und die Entscheidungslogik mit
# gestubbtem `qzustand`/`gh`/`sleep` fahren kann (bash 3.2: kein mapfile,
# keine assoziativen Arrays).

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

# Ist die qzustand-Antwort ein ECHTER Zustand? Bei GraphQL-Fehlern landet der
# JSON-Fehlerkoerper auf stdout (siehe Kopf) - der matcht hier nicht.
zustand_gueltig() {
  case "$1" in
    "OPEN "*|"MERGED "*|"CLOSED "*) return 0 ;;
    *) return 1 ;;
  esac
}

schon_gemerged() { [ "$(gh pr view "$1" --json state -q .state 2>/dev/null)" = "MERGED" ]; }

# Zweig abraeumen. GitHub loescht den Head-Zweig nach dem Merge selbst
# (deleteBranchOnMerge: true, HeadRefDeletedEvent 1-2 s nach dem Merge bei
# #917/#922) - erst nachsehen, dann wahrheitsgemaess melden, statt bei jeder
# Landung eine git-Fehlerzeile vor «Zweig entfernt» zu schreiben.
zweig_abraeumen() {
  BR=$(gh pr view "$1" --json headRefName -q .headRefName 2>/dev/null)
  if [ -z "$BR" ]; then
    echo "PR #$1: Zweigname nicht lesbar - Zweig NICHT abgeraeumt, von Hand pruefen." >> "$LOG"
    return 0
  fi
  if ! git ls-remote --exit-code --heads origin "$BR" >/dev/null 2>&1; then
    echo "PR #$1 Zweig $BR von GitHub bereits geloescht (deleteBranchOnMerge)" >> "$LOG"
    return 0
  fi
  if git push -q origin --delete "$BR" >> "$LOG" 2>&1; then
    echo "PR #$1 Zweig $BR entfernt" >> "$LOG"
  else
    echo "PR #$1 Zweig $BR: Loeschen fehlgeschlagen - von Hand pruefen." >> "$LOG"
  fi
}

melde_bereits_gemerged() {
  echo "PR #$1 bereits MERGED $(gh pr view "$1" --json mergeCommit -q '.mergeCommit.oid[0:9]' 2>/dev/null)" >> "$LOG"
  zweig_abraeumen "$1"
}

# Nach JEDEM Halt, der auf das Merge-Kommando folgt und den PR offen laesst:
# das Kommando hat bei nicht-gruenen Checks still Auto-Merge scharfgeschaltet
# (siehe Kopf). Fehler werden toleriert und protokolliert.
auto_merge_abschalten() {
  gh pr merge "$1" --disable-auto >> "$LOG" 2>&1; RCD=$?
  echo "  Auto-Merge abgeschaltet (gh pr merge $1 --disable-auto, rc=$RCD) - der PR landet nicht von selbst." >> "$LOG"
  echo "  Achtung: --disable-auto traegt einen BESTEHENDEN Queue-Eintrag NICHT aus." >> "$LOG"
}

# Darf dieser mergeStateStatus eingereiht werden? CLEAN/BEHIND/HAS_HOOKS ja -
# BEHIND zieht die Queue selbst nach, HAS_HOOKS betrifft nur Push-Hooks.
# UNSTABLE NEIN: dabei ist ein nicht-required Kontext rot. Das Ruleset
# (ALLGREEN) prueft nur die required Checks und wuerde den PR annehmen - die
# Kette landet trotzdem nie einen roten PR (Skill `landung`), sie haelt an und
# laesst einen Menschen den roten Kontext lesen.
pruefe_einreihbar() {
  case "$2" in
    CLEAN|BEHIND|HAS_HOOKS) return 0 ;;
    UNSTABLE)
      echo "PR #$1: UNSTABLE - ein nicht-required Kontext ist ROT. Nicht eingereiht, Kette haelt an." >> "$LOG"
      echo "  Erst lesen (gh pr checks $1): ist der rote Kontext harmlos, von Hand einreihen." >> "$LOG"
      return 1 ;;
    *)
      echo "PR #$1 BLOCKIERT ($2) - Kette haelt an" >> "$LOG"
      return 1 ;;
  esac
}

# Warten, bis die Queue geurteilt hat. Grosszuegig ueber dem Queue-Check-
# Timeout (60 min): 120 × 60 s = 120 min, weil bis zu 3 Eintraege parallel
# bauen und der eigene dahinter stehen kann. Setzt ERGEBNIS und QST.
warte_auf_queue() {
  GESEHEN=0; ERGEBNIS=""; QST=""
  for i in $(seq 1 120); do
    Z=$(qzustand "$1"); RCQ=$?
    # Leere ODER unplausible Antwort (GraphQL-Fehlerkoerper, rc=1) = Stoerung,
    # kein Urteil: nur weiterpollen, nie als «aus der Queue gefallen» werten.
    if [ "$RCQ" != "0" ] || ! zustand_gueltig "$Z"; then
      echo "  PR #$1: Queue-Abfrage gestoert (Runde $i, rc=$RCQ) - kein Urteil, weiter gepollt: $(printf '%s' "$Z" | tr '\n' ' ' | cut -c1-120)" >> "$LOG"
      sleep 60; continue
    fi
    PRST=${Z%% *}; QST=${Z##* }
    [ "$PRST" = "MERGED" ] && { ERGEBNIS="MERGED"; return 0; }
    [ "$PRST" = "CLOSED" ] && { ERGEBNIS="CLOSED"; return 0; }
    case "$QST" in
      UNMERGEABLE) ERGEBNIS="RAUS:UNMERGEABLE"; return 0 ;;
      -) # Kein Eintrag. Vor dem ersten gesehenen Eintrag ist das die Anlaufzeit
         # (die Queue braucht ein paar Sekunden), danach ein Rauswurf.
         [ "$GESEHEN" = "1" ] && { ERGEBNIS="RAUS:kein-Eintrag"; return 0; }
         [ "$i" -ge 5 ] && { ERGEBNIS="RAUS:nie-eingereiht"; return 0; } ;;
      *) # QUEUED · AWAITING_CHECKS · MERGEABLE · LOCKED: alles «steht drin».
         # LOCKED war bis 19.9.2026 ein Haltegrund - unbelegt: die GitHub-Doku
         # nennt fuer LOCKED keinen Entfernungsgrund, und hiesse es «wird
         # gerade gemergt», haette die Kette bei einem ERFOLGREICHEN PR
         # angehalten. Bedeutung ungemessen, Stand 19.9.2026; der 120-min-
         # Deckel begrenzt das Warten ohnehin.
         GESEHEN=1 ;;
    esac
    sleep 60
  done
  return 0
}

# Halt nach dem Einreihen: laut melden, Zweig BEHALTEN, nie neu einreihen.
melde_halt_nach_einreihen() {
  case "$ERGEBNIS" in
    RAUS:UNMERGEABLE)
      echo "PR #$1 steht UNMERGEABLE in der Merge-Queue - Zweig bleibt." >> "$LOG"
      echo "  Der Eintrag ist NICHT von selbst gefallen: er steht weiter drin und blockiert die Queue." >> "$LOG"
      echo "  Ursache lesen: merge_group-Lauf (PR + aktueller main) rot, oder Konflikt mit dem Vordermann." >> "$LOG"
      echo "  Dann von Hand austragen - gh 2.93.0 kennt KEIN Austrage-Kommando (--disable-auto traegt NICHT aus):" >> "$LOG"
      echo "  ueber die Web-Oberflaeche (Merge-Queue-Ansicht des Zweigs) oder GraphQL dequeuePullRequest." >> "$LOG"
      auto_merge_abschalten "$1" ;;
    RAUS:*)
      echo "PR #$1 aus der Merge-Queue GEFALLEN ohne Merge (${ERGEBNIS#RAUS:}) - Zweig bleibt." >> "$LOG"
      echo "  Haeufigster Grund: der merge_group-Lauf (PR + aktueller main) war rot." >> "$LOG"
      echo "  Lauf pruefen, Ursache beheben, dann von Hand neu einreihen - die Kette tut das NIE selbst." >> "$LOG"
      auto_merge_abschalten "$1" ;;
    CLOSED)
      # Kein --disable-auto: der PR ist nicht mehr offen.
      echo "PR #$1 wurde GESCHLOSSEN statt gemerged - Zweig bleibt." >> "$LOG" ;;
    *)
      echo "PR #$1 nach 120 min in der Merge-Queue weder gemerged noch rausgefallen (Stillstand) - Zweig bleibt." >> "$LOG"
      echo "  Queue-Zustand zuletzt: ${QST:-unbekannt}. Actions-Liste und Queue-Ansicht pruefen." >> "$LOG"
      auto_merge_abschalten "$1" ;;
  esac
}

# Sourcebar fuer den Test-Harness: mit LANDUNG_KETTE_NUR_FUNKTIONEN=1 gesourct,
# stellt die Datei nur die Funktionen oben bereit und laeuft NICHT weiter. Beim
# normalen Aufruf ist die Variable leer, die Zeile bleibt folgenlos (das
# `return` wird dann nie ausgefuehrt).
[ -n "${LANDUNG_KETTE_NUR_FUNKTIONEN:-}" ] && return 0

# ─── Rumpf ──────────────────────────────────────────────────────────────────

LOG="$1"; shift
cd "${LEXMETRIK_REPO:-/Users/david/Developer/LexMetrik}" || exit 2
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner) || exit 2
OWNER=${REPO%%/*}; NAME=${REPO##*/}

for PR in "$@"; do
  echo "== PR #$PR $(date +%H:%M)" >> "$LOG"

  # Schon gelandet? Zuerst fragen, nicht erst nach dem CI-Warten: beim Neustart
  # einer Kette (oder wenn die Queue einen frueher eingereihten PR inzwischen
  # gemerged hat) spart das den ganzen Block, statt auf einen Lauf zu warten,
  # dessen Ergebnis niemanden mehr interessiert.
  if schon_gemerged "$PR"; then melde_bereits_gemerged "$PR"; continue; fi

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
  # Gezielt nach dem CI-Lauf DIESES Kopf-Commits fragen. Frueher lief hier ein
  # ungefiltertes `gh run list --limit 30` ueber ALLE Workflows - bei ~30 min je
  # Landung fiel der dritte/vierte PR einer Kette aus dem Fenster, die Kette
  # wartete 7 min und meldete dann falsch «kein CI-Lauf» (19.9.2026).
  R=""
  for i in $(seq 1 20); do
    R=$(gh run list --workflow ci.yml --commit "$HEAD" --event pull_request --limit 5 --json databaseId -q '.[0].databaseId' 2>/dev/null)
    [ -n "$R" ] && break; sleep 20
  done
  if [ -z "$R" ]; then
    echo "PR #$PR: kein CI-Lauf fuer $HEAD - Ursachen der Reihe nach: Konflikt (DIRTY)?, dann Skip-CI-Marker im PR?" >> "$LOG"
    echo "halt" >> "$LOG"; exit 1
  fi
  # Poll statt `gh run watch` (Falle 1 im Kopf), mit Deckel: 120 × 45 s = 90 min.
  # Ohne Deckel wurde aus einer gh-Stoerung (eine leere Antwort ist nie
  # "completed") eine Endlosschleife.
  FERTIG=0
  for i in $(seq 1 120); do
    [ "$(gh run view "$R" --json status -q .status 2>/dev/null)" = "completed" ] && { FERTIG=1; break; }
    sleep 45
  done
  if [ "$FERTIG" != "1" ]; then
    echo "PR #$PR: CI-Lauf $R nach 90 min nicht abgeschlossen (oder gh antwortet nicht) - Kette haelt an." >> "$LOG"
    echo "halt" >> "$LOG"; exit 1
  fi
  C=$(gh run view "$R" --json conclusion -q .conclusion); [ "$C" = "success" ] && RC=0 || RC=1
  echo "PR #$PR run $R exit $RC" >> "$LOG"

  # Waehrend des CI-Wartens kann die Queue den PR aus einem frueheren Einreihen
  # gemerged haben - dann ist nichts rot, Zweig abraeumen und weiter.
  if schon_gemerged "$PR"; then melde_bereits_gemerged "$PR"; continue; fi

  # NIE einen roten PR einreihen - und das SELBST entscheiden: `gh pr merge`
  # weist einen roten PR nicht ab, es schaltet still Auto-Merge scharf (Kopf,
  # Nachzug 19.9.2026). Das Ruleset faengt den Fehler also nicht fuer uns ab.
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
  if ! pruefe_einreihbar "$PR" "$ST"; then echo "halt" >> "$LOG"; exit 1; fi

  if ! gh pr merge "$PR" --squash >> "$LOG" 2>&1; then
    echo "PR #$PR: Einreihen in die Merge-Queue fehlgeschlagen - Kette haelt an" >> "$LOG"
    echo "halt" >> "$LOG"; exit 1
  fi
  echo "PR #$PR in die Merge-Queue eingereiht $(date +%H:%M)" >> "$LOG"

  warte_auf_queue "$PR"

  if [ "$ERGEBNIS" = "MERGED" ]; then
    echo "PR #$PR MERGED $(gh pr view "$PR" --json mergeCommit -q '.mergeCommit.oid[0:9]') $(date +%H:%M)" >> "$LOG"
    zweig_abraeumen "$PR"
    continue
  fi

  melde_halt_nach_einreihen "$PR"
  echo "halt" >> "$LOG"; exit 1
done
echo "fertig" >> "$LOG"
