#!/usr/bin/env bash
# scripts/gate.sh — Prüf-Gates: leise bei Grün, volle Ausgabe nur bei Rot.
# Aufruf:  npm run gate          (volle Fünferkette)
#          npm run gate:schnell  (nur tsc · vitest · golden, ~36 s — gemessen
#                                 7.8.2026, 10-Kern: 35.9 s / 35.5 s in zwei Läufen)
#
# WER DIESES GATE IN EINEN Stop-HOOK HÄNGT, muss eines wissen: Claude Code
# übersteuert einen Stop-Hook nach 8 Blockierungen in Folge (Quelle:
# code.claude.com/docs/en/best-practices, Abruf 7.8.2026). Ein Stop-Hook ist
# damit ein BREMSKLOTZ, kein Zaun — er kostet die neunte Wiederholung nichts.
# Harte Sperren bleiben deshalb `PreToolUse` (blockiert den Aufruf selbst, s.
# .claude/hooks/tor-schutz.py) und das Berechtigungssystem; ein Stop-Hook darf
# nur bequemer machen, was ohnehin schon erzwungen ist.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

# ─── KONDENSAT 5.9.2026 (QS-EFFIZIENZ) ───────────────────────────────────────
# Befund (gemessen, 5.9.2026): bei einem roten Tor druckte `run()` die VOLLE
# Ausgabe (`printf '%s\n' "$log"`) in den Chat-Kontext. Bei 15 gleichartigen
# Vitest-Fehlschlägen waren das ~800 Zeilen (kompletter Expected/Received-Diff
# + Code-Frame je Fehler) — zweimal pro Session ~25 000 Token. Ab jetzt: die
# volle Ausgabe geht in `.gate/<name-slug>.log` (gitignoriert, s. .gitignore),
# in den Chat nur ein KONDENSAT (Funktion `kondensiere` unten). Kein Fehler
# verschwindet — jeder rote Testname bleibt im Kondensat (FAIL-Zeile), nur der
# Expected/Received-Diff und der Code-Frame entfallen; wer die Details braucht,
# liest das Volllog (Pfad steht in der letzten Kondensat-Zeile). Exit-Codes
# unverändert: `code=$?` des Tools bleibt massgeblich, nie der von grep/wc/sed
# in der Kondensierung (die läuft NACH der Verdikt-Bildung, wie das
# Ereignis-Log oben).
mkdir -p .gate 2>/dev/null || true

kondensiere() {
  local name="$1" log="$2"
  local slug logfile n_zeilen
  slug="$(printf '%s' "$name" | tr 'A-Z' 'a-z' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  logfile=".gate/${slug}.log"
  printf '%s\n' "$log" > "$logfile" 2>/dev/null || true
  n_zeilen="$(printf '%s\n' "$log" | wc -l | tr -d ' ')"
  if [ "$name" = "vitest" ]; then
    # Vitest-Kondensat: FAIL-Zeilen (Testname), × -Marker, Fehler-Erstzeile
    # (AssertionError/Error:), ❯-Fundstelle (src/…:Zeile) und der Summen-Block
    # — nie den Expected/Received-Diff oder den Code-Frame. Deckelung 80 Zeilen.
    printf '%s\n' "$log" \
      | grep -E 'FAIL |× |AssertionError|Error:|❯ src/|Test Files|Tests |Duration' \
      | head -80
  else
    if [ "$n_zeilen" -gt 60 ]; then
      printf '%s\n' "$log" | head -40
      echo "  …"
      printf '%s\n' "$log" | tail -15
    else
      printf '%s\n' "$log"
    fi
  fi
  printf '  … Volllog: %s (%s Zeilen)\n' "$logfile" "$n_zeilen"
}

# Zeitzone BEDINGUNGSLOS festnageln (26.7.2026): die Golden-Basis ist in
# Europe/Zurich erzeugt, auf einer UTC-Maschine meldet `golden:vergleich` sonst
# `kuendigung:dj1`/`dj10` falsch-rot (kostete am 20.7. den Auftakt von
# fedlex-frische.yml). Absichtliche TZ-Proben: `TZ=<zone> npm run golden:vergleich`.
export TZ=Europe/Zurich

mode="${1:-voll}"
fail=0

# ─── Tor-Ereignis-Log ─────────────────────────────────────────────────────
# Jeder Gate-Schritt hinterlässt eine JSONL-Zeile {ts, tor, ok} in
# `.selbstopt-ereignisse.jsonl` (gitignoriert, je Maschine eigen). Ohne diese
# Spur gibt es keine Antwort auf «welches Tor kostet uns wie oft Zeit» — die
# Tor-Läufe waren bisher flüchtig, jeder rote Lauf verschwand mit dem Terminal.
# Ausgewertet wird sie von `npm run tor:bewaehrung -- --import-ci`
# (scripts/analyse/tor-bewaehrung.ts) — früher zusätzlich von
# `npm run selbstopt:erheben`, entfallen 20.9.2026 (Entscheid David, Rückbau
# QS-EFFIZIENZ).
#
# DREI EIGENSCHAFTEN, die nicht verhandelbar sind:
#  * Das Logging ist ein NEBENEFFEKT. Es schreibt nichts nach stdout/stderr, es
#    ändert keinen Exit-Code, und es läuft nach der Verdikt-Bildung. Zieht man
#    die Zeile ab, ist gate.sh byte-gleich zu vorher.
#  * Es kann das Gate NICHT rot machen: `|| true` am Ende. Ein volles
#    Dateisystem oder ein schreibgeschützter Baum darf keine Prüfung kosten.
#  * `set -uo pipefail` ist gesetzt, aber kein `-e` — der Schreibfehler bräche
#    also ohnehin nicht ab; das `|| true` sagt es trotzdem ausdrücklich.
# Die Tor-Namen hier sind fest verdrahtete Literale ohne Anführungszeichen —
# es gibt also nichts zu escapen.
#
# ECHTE MILLISEKUNDEN, nicht fingierte (Gegenprüfung 7.8.2026): Die erste
# Fassung hängte hart `.000Z` an. Der Sammler schneidet Ereignisse aber mit
# `e.ts > letzterSnapshot` (String-Vergleich) — ein Gate-Ereignis aus DERSELBEN
# Sekunde wie ein Snapshot fiel damit unter das Watermark und war verloren.
# BSD-`date` (macOS) kennt kein `%N`, GNU-`date` schon; statt auf die Plattform
# zu wetten, stempelt python3. Die Kosten fallen nicht ins Gewicht: höchstens
# fünf Aufrufe je Gate-Lauf (ein Gate-Schritt dauert Sekunden bis Minuten), und
# das Repo setzt python3 ohnehin voraus (`struktur:rotieren`, die Hooks).
# Fehlt python3 wider Erwarten, greift der `date`-Rückfall mit
# Sekunden-Auflösung — dann kann im Grenzfall EIN Ereignis je Snapshot
# verlorengehen, was ein Verlaufs-Signal nicht umwirft.
EREIGNIS_LOG=".selbstopt-ereignisse.jsonl"
jetzt_iso() {
  python3 -c 'import datetime as d; print(d.datetime.now(d.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z")' 2>/dev/null \
    || date -u +%Y-%m-%dT%H:%M:%S.000Z
}
ereignis() {
  printf '{"ts":"%s","tor":"%s","ok":%s}\n' \
    "$(jetzt_iso)" "$1" "$2" >> "$EREIGNIS_LOG" 2>/dev/null || true
}

run() {
  local name="$1"; shift
  local log code
  log="$("$@" 2>&1)"; code=$?
  if [ "$code" -eq 0 ]; then
    printf '  ok   %s\n' "$name"
  else
    fail=1
    printf '  ROT  %s (exit %s)\n' "$name" "$code"
    kondensiere "$name" "$log"   # Kondensat NUR für das rote Gate, Volllog in .gate/
  fi
  # Präfix `gate:` trennt den Gate-SCHRITT vom einzelnen Tor: `npm run check`
  # erscheint hier als `gate:check`, seine 43 Sub-Tore protokolliert
  # run-parallel.ts einzeln unter ihrem eigenen `check:*`-Namen. Ohne den
  # Präfix zählte der Sammelschritt in derselben Namensmenge wie die Tore, die
  # er enthält — und jede Aggregation wäre doppelt.
  if [ "$code" -eq 0 ]; then ereignis "gate:$name" true; else ereignis "gate:$name" false; fi
}

echo "Gates (${mode}):"
# Vorprüfung Abhängigkeiten (Lehre 24.9.2026, W2·30-RL-W1): ein App-Worktree
# brachte ein veraltetes node_modules mit (Stand 3.9.) — fehlende Pakete lösten
# über den Elternordner in den Haupt-Checkout auf, zwei React-Kopien, ~60 rote
# Tests ohne Code-Fehler, ein Gate-Lauf (5 min) verloren. `npm ls` erkennt den
# Drift (gemessen: frisch nach npm ci Exit 0, drei veraltete Worktrees Exit 1).
# `--all` statt `--depth=0` (Gegenprüfung 24.9.2026): --depth=0 übersah einen
# verschachtelten Versionskonflikt (Paket verlangt react@^19, lokal 18) — genau
# das Zwei-Kopien-Muster; Laufzeit gleich (~0.25 s).
# Abbruch statt `run`: die Folge-Tore wären nur Rauschen.
if ! npm ls --all >/dev/null 2>&1; then
  printf '  ROT  node_modules passt nicht zu package-lock.json — zuerst «npm ci» (kein Code-Fehler; Details: npm ls --all)\n'
  ereignis "gate:npm-ls" false
  exit 1
fi
run "tsc -b"            npx tsc -b
run "vitest"            npm test
run "golden:vergleich"  npm run golden:vergleich
if [ "$mode" = "voll" ]; then
  run "lint"   npm run lint
  run "check"  npm run check
  # §17-Wurzelfix (Beleg 5.9.2026, Jules-PR #709): §6.3-Tor läuft auch lokal,
  # nicht nur in ci.yml. Seit RL-03 (23.9.2026) check:fachaenderung (Nachfolger
  # von check:testtreue); Basis `origin/main` wie im CI-Schritt.
  run "fachaenderung" npm run check:fachaenderung
  # Wiedervorlage-Register der Prosa-Regeln (QS-BEWAEHRUNG B). Bewusst NUR hier
  # und nicht in check:seriell/ci.yml: das Tor ist rot nur bei struktureller
  # Verletzung, seine eigentliche Ausgabe ist die Fälligkeitsliste — die gehört
  # vor den Deploy und ins Aufräumen, nicht in jeden fremden Produkt-PR.
  run "regel-wiedervorlage" npm run check:regel-wiedervorlage
  # ── ZH-Vollständigkeit (ZH-Fix-Runde 3, B7) ────────────────────────────────
  # Das Tor hält die ZH-Snapshots gegen das amtliche PDF. Zwei Teile:
  #  · ARTEFAKT — braucht kein PDF (Trennstrich-Enden, Gliederungstitel im
  #    Normtext). Läuft immer, auch in CI (ci.yml).
  #  · OFFLINE — die vollen zehn Prüfungen gegen den Roh-PDF-Cache
  #    `daten/pdf-cache-zh/`. Der Cache ist gitignored (er ist eine
  #    wiederherstellbare Kopie der amtlichen Quelle, kein Artefakt), also kann
  #    CI ihn nicht haben. Lokal ist er nach `npm run zh:cache` da.
  # Fehlt der Cache, wird der Offline-Teil ÜBERSPRUNGEN und das laut gesagt —
  # ein stilles Weglassen wäre ein Tor, das nicht scheitern kann (§6.7).
  run "zh-artefakt" npx vite-node scripts/normtext/check-zh-vollstaendigkeit.ts -- --artefakt
  # Dieselbe Zweiteilung fuer die ZH-RANDTITEL (R1, 2.9.2026): die Pruefungen
  # 1-5 sind reine Artefakt-Aussagen (kein erfundener Token, Form, Gliederung
  # lueckenlos, Messreihe), Pruefung 6 ist die Zweitlesung aus dem PDF.
  run "zh-randtitel-artefakt" npx vite-node scripts/normtext/check-zh-randtitel.ts -- --artefakt
  if [ -d daten/pdf-cache-zh ] && [ -n "$(ls -A daten/pdf-cache-zh 2>/dev/null)" ]; then
    run "zh-vollstaendigkeit" npx vite-node scripts/normtext/check-zh-vollstaendigkeit.ts -- --offline
    run "zh-randtitel" npx vite-node scripts/normtext/check-zh-randtitel.ts
  else
    printf '  --   %s\n' "zh-vollstaendigkeit ÜBERSPRUNGEN: Roh-PDF-Cache leer — 'npm run zh:cache' füllt ihn"
    ereignis "gate:zh-vollstaendigkeit-uebersprungen" true
    printf '  --   %s\n' "zh-randtitel ÜBERSPRUNGEN: Roh-PDF-Cache leer — 'npm run zh:cache' füllt ihn"
    ereignis "gate:zh-randtitel-uebersprungen" true
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo "GATE ROT — Ursache im Code beheben. Kein 'npm run golden', Test nicht aufweichen (§6 Ziff. 3)."
  exit 1
fi
echo "GATE GRÜN."
exit 0
