#!/usr/bin/env bash
# ─── LIK-Nachzug (Bot, MONITOR, Auftrag David 5.10.2026 «automatik-kandidaten») ──
#
# Zieht src/data/likReihe.ts auf die jüngste BFS-Indexierungstabelle nach — der
# Handablauf aus #499/#581/#1308 als ein Skript. Aufrufer: .github/workflows/lik-nachzug.yml
# (lokal genauso lauffähig, braucht python3 + openpyxl, curl, npm ci).
#
#   1. Asset-Seite cc-d-05.02.08 laden, GENAU EINE DAM-Asset-ID ablesen (sonst Abbruch).
#   2. XLSX laden; HTTP 200, Content-Type spreadsheetml, Grösse 20 KB–20 MB, ZIP-Signatur.
#   3. Generator (scripts/lik-reihe-generieren.py) mit Abrufdatum + Asset-ID.
#   4. Unabhängige Neu-Einlesung (scripts/lik/neu-einlesen.py) und Bot-Tor «nur Anfügung»
#      (scripts/lik/vergleich.ts) gegen den committeten Stand (HEAD).
#   5. status=keine     → Arbeitsbaum zurückgesetzt, kein PR (idempotent).
#      status=anfuegung → Export-Ratsche nachziehen, normaler PR (nie Auto-Merge: Risikopfad).
#      status=pruefen   → Export-Ratsche nachziehen, PR als ENTWURF mit Begründung.
#
# Ausgaben: Arbeitsverzeichnis $LIK_TMP (Default .gate/lik-nachzug, gitignoriert) mit
# pr-body.md und beleg.md; Schlüssel status/asset_id/abrufdatum/letzter_monat auf stdout
# und nach $GITHUB_OUTPUT. Exit ≠ 0 = Quelle unbrauchbar oder Lesefehler (Lauf rot).
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
TMP=${LIK_TMP:-$ROOT/.gate/lik-nachzug}
mkdir -p "$TMP"
SEITE=${LIK_ASSET_SEITE:-https://www.bfs.admin.ch/asset/de/cc-d-05.02.08}
ZIEL=src/data/likReihe.ts
ausgabe() { echo "$1"; [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1" >> "$GITHUB_OUTPUT"; return 0; }
fehler() { echo "::error::LIK-Nachzug: $1" >&2; exit 1; }

# ── 1. Asset-ID ────────────────────────────────────────────────────────────────
curl -m 60 -fsSL --retry 2 "$SEITE" -o "$TMP/asset.html" || fehler "Asset-Seite nicht ladbar ($SEITE)"
ids=$(grep -oE 'dam-api\.bfs\.admin\.ch/hub/api/dam/assets/[0-9]+/master' "$TMP/asset.html" \
  | sed -E 's#.*/assets/([0-9]+)/master#\1#' | sort -u || true)
anzahl=$(printf '%s' "$ids" | grep -c . || true)
[ "$anzahl" = 1 ] || fehler "Asset-Seite nennt ${anzahl} verschiedene DAM-Asset-IDs (erwartet genau 1): $(echo $ids)"
ID=$ids

# ── 2. XLSX ────────────────────────────────────────────────────────────────────
URL="https://dam-api.bfs.admin.ch/hub/api/dam/assets/${ID}/master"
curl -m 120 -fsSL --retry 2 -D "$TMP/kopf.txt" "$URL" -o "$TMP/lik.xlsx" || fehler "XLSX nicht ladbar ($URL)"
typ=$(tr -d '\r' < "$TMP/kopf.txt" | grep -i '^content-type:' | tail -1 | cut -d' ' -f2- || true)
case "$typ" in
  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet*) ;;
  *) fehler "unerwarteter Content-Type «${typ}» für $URL" ;;
esac
groesse=$(wc -c < "$TMP/lik.xlsx" | tr -d ' ')
{ [ "$groesse" -ge 20000 ] && [ "$groesse" -le 20000000 ]; } || fehler "XLSX-Grösse ${groesse} B ausserhalb 20 KB–20 MB"
[ "$(head -c 2 "$TMP/lik.xlsx")" = "PK" ] || fehler "XLSX ohne ZIP-Signatur"
geaendert_am=$(tr -d '\r' < "$TMP/kopf.txt" | grep -i '^last-modified:' | tail -1 | cut -d' ' -f2- || true)

# ── 3. Generator ───────────────────────────────────────────────────────────────
ABRUF=${LIK_ABRUFDATUM:-$(python3 -c "import datetime;d=datetime.date.today();print(f'{d.day}.{d.month}.{d.year}')")}
git show "HEAD:$ZIEL" > "$TMP/alt.ts"
python3 scripts/lik-reihe-generieren.py "$TMP/lik.xlsx" "$ABRUF" "$ID"

# ── 4. Gegenlesung + Bot-Tor ───────────────────────────────────────────────────
python3 scripts/lik/neu-einlesen.py "$TMP/lik.xlsx" > "$TMP/xlsx.json"
cp "$ZIEL" "$TMP/neu.ts"
GITHUB_OUTPUT= npx vite-node scripts/lik/vergleich.ts -- "$TMP/alt.ts" "$TMP/neu.ts" "$TMP/xlsx.json" "$TMP/beleg.md" \
  | tee "$TMP/vergleich.txt"
status=$(sed -n 's/^status=//p' "$TMP/vergleich.txt")
werte=$(( $(sed -n 's/^angefuegt=//p' "$TMP/vergleich.txt") + $(sed -n 's/^geaendert=//p' "$TMP/vergleich.txt") + $(sed -n 's/^entfernt=//p' "$TMP/vergleich.txt") ))
letzter=$(sed -n "s/^export const LIK_LETZTER_MONAT = '\(.*\)';/\1/p" "$ZIEL")

ausgabe "asset_id=$ID"
ausgabe "abrufdatum=$ABRUF"
ausgabe "letzter_monat=$letzter"

if [ "$status" = keine ]; then
  git checkout -- "$ZIEL"   # nur das Abrufdatum im Kopf hätte sich bewegt
  ausgabe "status=keine"
  echo "LIK-Nachzug: keine neuen Werte (Asset ${ID}, Reihe bis ${letzter}) — kein PR."
  exit 0
fi
if [ "$werte" = 0 ]; then
  git checkout -- "$ZIEL"
  cat "$TMP/beleg.md" >&2
  fehler "Bot-Tor rot ohne Datenänderung (Gründe oben) — kein PR. Häufigster Fall «XLSX trägt Basis/Basen, die der Generator nicht kennt»: das BFS hat eine neue Basis (Rebasierung) publiziert. Dann in einer Session scripts/lik-reihe-generieren.py um die Basis erweitern (Risikopfad, mit Gegenprüfung), Rebasierung gegen die BFS-Publikation belegen und den Lauf per workflow_dispatch neu starten. Bei «Abweichung(en) Generator ↔ Neu-Einlesung»: Spaltenzuordnung beider Leser gegen die XLSX-Kopfzeile prüfen."
fi

# ── 5. Export-Ratsche (eingefrorene Teuerungs-Exportzeile trägt den letzten Monat) ──
RECHNER_EXPORT_SCHREIBEN=1 npx vitest run src/tests/rechner-export-ratsche.test.tsx --maxWorkers=2 > "$TMP/ratsche.log" 2>&1 \
  || { tail -30 "$TMP/ratsche.log" >&2; fehler "Export-Ratsche liess sich nicht nachziehen"; }

{
  if [ "$status" = pruefen ]; then
    echo "**ENTWURF — Bot-Tor «nur Anfügung» NICHT erfüllt.** Der Nachzug ändert oder entfernt bestehende LIK-Werte oder weicht von der unabhängigen Neu-Einlesung ab. Bestehende Monatswerte sind rechtsrelevant (Indexmieten, indexierte Beträge): erst die Ursache gegen die BFS-Publikation klären, dann entscheiden."
  else
    echo "Der Teuerungsrechner kennt nach dem Merge die LIK-Monate bis **${letzter}**; bisher wurden sie mit «noch nicht publiziert» abgelehnt. Bestehende Werte bleiben unverändert (Bot-Tor «nur Anfügung» erfüllt)."
  fi
  echo
  echo "Quelle: Bundesamt für Statistik (BFS), Landesindex der Konsumentenpreise, Indexierungstabelle cc-d-05.02.08 — ${SEITE} · XLSX-Master ${URL} (Asset ${ID}, Last-Modified ${geaendert_am:-unbekannt}, ${groesse} B), abgerufen ${ABRUF}. Lizenz OPEN-BY."
  echo
  cat "$TMP/beleg.md"
  echo
  echo "Mitgeführt: \`src/tests/fixtures/rechner-export.json\` (eingefrorene Export-Zeile des Teuerungsrechners: Standard-Bis-Monat und PDF-sha folgen dem letzten LIK-Monat)."
  echo
  echo "Automatischer Lauf \`.github/workflows/lik-nachzug.yml\` (\`scripts/lik/nachzug.sh\`). KEIN Auto-Merge: \`src/data/likReihe.ts\` liegt auf dem Risikopfad (istRisikoPfad); der Merge-Schutz verlangt ein Gegenprüfungs-Verdikt."
  echo
  echo "Roadmap: MONITOR"
  echo "Gegenpruefung: ausstehend — Bot-PR, Session prüft"
} > "$TMP/pr-body.md"
ausgabe "status=$status"
echo "LIK-Nachzug: status=${status}, Reihe bis ${letzter} — PR-Text: $TMP/pr-body.md"
