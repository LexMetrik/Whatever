#!/usr/bin/env bash
# scripts/ci/playwright-install.sh — robuste Playwright-Browser-Installation
# für CI (e2e-Shard-Job UND Perf-Budget-Job, §5 Single Source of Truth statt
# Duplikat-Block je Job).
#
# Anlass (Lauf 34241159277, Job 102112456997, 8.9.2026): Versuch 1 lief ins
# 5-min-Limit; das per sudo (eigene PTY-Session) von Playwright gestartete
# `apt-get` überlebte als Waise und hielt /var/lib/dpkg/lock-frontend.
# Versuch 2 scheiterte binnen 3 s mit Exit 100 — der Retry war strukturell
# wirkungslos.
#
# Nachbesserung PR #785 (September 2026), drei Punkte (STAND vor der
# Gegenprüfung, §0 Ziff. 2b — bleibt als Beleg ihres Standes stehen):
#  1. Ein per KILL beendeter apt-get/dpkg kann dpkg halb konfiguriert
#     zurücklassen ("dpkg was interrupted, you must manually run
#     'dpkg --configure -a'"); daher vor jedem WEITEREN Versuch
#     `dpkg --configure -a` (Exit-Code nur gewarnt, nie fatal).
#  2. Wartezeit auf die dpkg-Sperre von 240 s auf 120 s gesenkt — nach dem
#     Prozessgruppen-Kill ist die Sperre ohnehin sofort frei. Worst case
#     damit 2 × (120 s Warten + 300 s Install + 15 s Kill-Kulanz) = 870 s
#     ≈ 14,5 min — nur im Störfall (beide Versuche brauchen die volle Zeit);
#     im Regelfall (Sperre frei, Install durch) ist der Schritt in unter
#     einer Minute fertig.
#  3. Der Schleifen-Block steht jetzt genau einmal hier; e2e-Shard-Job UND
#     Perf-Budget-Job rufen `bash scripts/ci/playwright-install.sh` auf und
#     bekommen denselben Schutz.
#
# NACHBESSERUNG nach Opus-Gegenprüfung (read-only, Verdikt «bestanden mit
# Auflagen», PR #785, 8.9.2026) — Auflagen B1–B4:
#  B1 Zeitbudget zu knapp gegen den 25-min-Deckel des e2e-Jobs (2 × 870 s
#     Störfall > Reserve). Defaults gesenkt auf sperre_max=30, install_
#     timeout=240, UND der dpkg-configure-Vorlauf bekommt ein eigenes
#     60-s-Limit über `laufe_mit_wache` (vorher unbegrenzt). Neue Rechnung:
#     2 × (30 s Sperre + 240 s Install + 15 s Kill-Kulanz) + 60 s dpkg-
#     configure ≈ 630 s (10,5 min) Worst Case. Das reisst die alte Reserve
#     (540 s = 25 min Deckel − 16 min Regelfall Tests+Rüstzeit) immer noch —
#     darum zusätzlich `timeout-minutes` des e2e-Jobs in ci.yml auf 28
#     angehoben (neue Reserve 720 s ≥ 630 s, Puffer 90 s).
#  B2 Testmodus-Riegel: LEXMETRIK_SPERRE_TEST/LEXMETRIK_INSTALL_CMD dürfen in
#     echter CI (GITHUB_ACTIONS gesetzt) nie gesetzt sein — sonst liefe der
#     Job mit einem Fake-Install still grün. Sofortiger Abbruch, siehe unten.
#  B3 `( set -m; exec "$@" ) &` isoliert KEINE eigene Prozessgruppe (Beweis
#     der Gegenprüfung: Enkel-Prozesse überlebten den Kill, PGID des
#     Kommandos == PGID der aufrufenden Shell). Fix: PGID zur Laufzeit
#     ermitteln und nur dann per Gruppen-Kill (`kill -- -PGID`) beenden, wenn
#     sie sich von der eigenen Shell-PGID unterscheidet (setsid-Fall); sonst
#     Einzel-Kill des Prozesses plus rekursiv ermittelter Kinder
#     (`kinder_rekursiv`, über `pgrep -P`).
#  B4 `pkill -9 -f 'apt-get|dpkg'` ist ein Substring-Match und kann den
#     eigenen Eltern-sudo oder die fuser-Zeile dieses Skripts selbst treffen.
#     Fix: exakter Prozessname (`pkill -9 -x apt-get`, `pkill -9 -x dpkg`).
#  Hinweis (i) der Gegenprüfung: sudo mit `use_pty` kann den von ihm
#     gestarteten apt-get aus der Prozessgruppe heben (genau der Anlass oben,
#     8.9.2026) — der nachgelagerte `pkill -x` bleibt deshalb Pflicht, auch
#     wenn der Gruppen-Kill im Regelfall greift.
#  Hinweis (ii): fehlen sowohl `fuser` als auch `lsof` auf dem Runner, würde
#     `sperre_belegt` sonst mit Exit 127 "frei" vortäuschen und die
#     Wartelogik still abschalten. Fix: einmalige `::warning` beim Start und
#     bewusstes Überspringen der Wartelogik statt eines stillen Fehlschlags.
#
# Wurzel-Fix «apt nur wenn nötig» (W2·18-FEHLERBUCH, 1.10.2026): vier
# Merge-Queue-/PR-Rauswürfe an einem Tag (Läufe 36893290218 Shard 1+2,
# 36887676700 Shard 3, 36890985162 Shard 8, 36885150267) — Browser-Cache war
# HIT, aber `install --with-deps` zog trotzdem 4 Upgrades + 10 Pakete (v. a.
# Fonts, 32 MB) vom Ubuntu-Spiegel mit ~50 kB/s und lief zweimal ins 240-s-
# Limit (Exit 124). ZUERST jetzt: `playwright install chromium` ohne apt (lädt
# nur bei Cache-Miss), dann Startprobe (Chromium headless + leere Seite).
# Startet er, ist der Schritt fertig; sonst läuft der Weg unten UNVERÄNDERT.
# Kein stiller Grün-Durchlauf: scheitern Probe UND apt, bleibt der Shard rot.
# Zeitbudget (B1): Weg 1 kostet im Störfall höchstens 45+15 s (no-deps) +
# 15+15 s (Probe) = 90 s zusätzlich → Worst Case 630+90 = 720 s = Reserve des
# 28-min-Jobs; Regelfall: ~3 s. Limits bewusst knapp, nicht erhöhen.
#
# Testmodus für lokale Beweise (kein echtes CI, kein sudo nötig):
#   LEXMETRIK_SPERRE_TEST=<pfad>   sperre_belegt() prüft "Datei existiert"
#                                  statt `sudo fuser`/`sudo lsof`; alle
#                                  Sudo-Aufrufe (dpkg --configure, pkill)
#                                  werden dann nur echot, nicht ausgeführt.
#   LEXMETRIK_INSTALL_CMD=<cmd>    ersetzt den Playwright-Install-Aufruf
#                                  (Default: "npx playwright install --with-deps chromium")
#   LEXMETRIK_SPERRE_MAX=<s>       überschreibt die 30-s-Wartegrenze
#   LEXMETRIK_INSTALL_TIMEOUT=<s>  überschreibt die 240-s-Versuchsdauer
#   LEXMETRIK_NODEPS_CMD=<cmd>     ersetzt `npx playwright install chromium` (ohne apt)
#   LEXMETRIK_PROBE_CMD=<cmd>      ersetzt die Chromium-Startprobe
#   LEXMETRIK_PROBE_TIMEOUT=<s>    überschreibt die 15-s-Dauer der Startprobe
#   Diese Variablen sind in echter CI gesperrt (B2) — siehe Riegel unten.
#
# Portabilität (KORRIGIERT nach Opus-Gegenprüfung 8.9.2026 — die vorherige
# Behauptung war falsch, s. B3): kein externes `timeout`-Binary vorausgesetzt
# (macOS hat es nicht) — `laufe_mit_wache` unten implementiert das Zeitlimit
# selbst. Für den Gruppen-Kill gilt: wo `setsid` verfügbar ist (Ubuntu/CI),
# bekommt das Kommando eine eigene Session/Prozessgruppe und der Gruppen-Kill
# (`kill -- -PGID`) trifft den ganzen Baum. Wo `setsid` fehlt (macOS), isoliert
# der Bash-Fallback `( set -m; exec "$@" ) &` NICHT zuverlässig — die PGID
# bleibt gleich der aufrufenden Shell. `laufe_mit_wache` erkennt diesen Fall
# zur Laufzeit (PGID-Vergleich) und tötet dann den Baum per `pgrep -P`
# (rekursiv, `kinder_rekursiv`) statt per Gruppen-Kill, damit nicht versehentlich
# die eigene Shell mitgetroffen wird.
set -euo pipefail

sperre_max="${LEXMETRIK_SPERRE_MAX:-30}"
install_timeout="${LEXMETRIK_INSTALL_TIMEOUT:-240}"
install_cmd="${LEXMETRIK_INSTALL_CMD:-npx playwright install --with-deps chromium}"
nodeps_cmd="${LEXMETRIK_NODEPS_CMD:-npx playwright install chromium}"
nodeps_timeout=45
probe_timeout="${LEXMETRIK_PROBE_TIMEOUT:-15}"

testmodus=0
if [ -n "${LEXMETRIK_SPERRE_TEST:-}" ]; then
  testmodus=1
fi

# B2: Testmodus-Variablen dürfen in echter CI nie gesetzt sein — sonst liefe
# ein Fake-Install still grün durch, ohne dass jemand es merkt.
if [ -n "${GITHUB_ACTIONS:-}" ] && [ -n "${LEXMETRIK_SPERRE_TEST:-}${LEXMETRIK_INSTALL_CMD:-}${LEXMETRIK_NODEPS_CMD:-}${LEXMETRIK_PROBE_CMD:-}${LEXMETRIK_PROBE_TIMEOUT:-}" ]; then
  echo "::error::Testmodus-Variablen in CI gesetzt — Abbruch"
  exit 1
fi

# Hinweis (ii): ohne fuser UND lsof kann sperre_belegt() nicht mehr prüfen,
# ob dpkg/apt gerade eine Sperre halten — Exit 127 sähe sonst wie "frei" aus
# und die Wartelogik schaltete sich still ab. Einmal warnen, dann bewusst
# überspringen (nie stillschweigend).
sperre_pruefung_verfuegbar=1
if [ "$testmodus" -eq 0 ]; then
  if ! command -v fuser >/dev/null 2>&1 && ! command -v lsof >/dev/null 2>&1; then
    echo "::warning::weder fuser noch lsof verfuegbar — Sperrpruefung uebersprungen (kann nicht mehr auf eine dpkg-Sperre warten)."
    sperre_pruefung_verfuegbar=0
  fi
fi

fuehre_sudo_aus() {
  if [ "$testmodus" -eq 1 ]; then
    echo "(testmodus) uebersprungen: sudo $*"
  else
    sudo "$@"
  fi
}

sperre_belegt() {
  if [ "$testmodus" -eq 1 ]; then
    [ -e "$LEXMETRIK_SPERRE_TEST" ]
  elif command -v fuser >/dev/null 2>&1; then
    sudo fuser /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock >/dev/null 2>&1
  else
    sudo lsof /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock >/dev/null 2>&1
  fi
}

warte_auf_dpkg_sperre() {
  if [ "$testmodus" -eq 0 ] && [ "$sperre_pruefung_verfuegbar" -eq 0 ]; then
    return 0
  fi
  local gewartet=0
  while sperre_belegt; do
    if [ "$gewartet" -ge "$sperre_max" ]; then
      echo "::error::dpkg-Sperre nach ${sperre_max}s nicht freigegeben — Blockade haelt an, Abbruch."
      return 1
    fi
    if [ "$testmodus" -eq 1 ]; then
      echo "warte auf dpkg-Sperre (Testdatei ${LEXMETRIK_SPERRE_TEST}), ${gewartet}s/${sperre_max}s"
    elif command -v fuser >/dev/null 2>&1; then
      haltende_pid=$(sudo fuser /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock 2>&1 | tr -s ' \t' ' ' | awk '{print $NF}')
      echo "warte auf dpkg-Sperre (PID ${haltende_pid:-?}), ${gewartet}s/${sperre_max}s"
    else
      haltende_pid=$(sudo lsof -t /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock 2>/dev/null | head -1)
      echo "warte auf dpkg-Sperre (PID ${haltende_pid:-?}, via lsof), ${gewartet}s/${sperre_max}s"
    fi
    sleep 5
    gewartet=$((gewartet + 5))
  done
  return 0
}

# Ermittelt rekursiv alle Nachkommen-PIDs von $1 (eine Ebene reicht nicht —
# ein Installer kann mehrstufig forken). Gibt eine PID pro Zeile aus.
kinder_rekursiv() {
  local eltern="$1"
  local kind
  for kind in $(pgrep -P "$eltern" 2>/dev/null); do
    printf '%s\n' "$kind"
    kinder_rekursiv "$kind"
  done
}

# Startet "$2..$n" und wacht bis zu $1 Sekunden; danach TERM, nach 15 s
# Kulanz KILL. Gibt 124 zurück, wenn das Zeitlimit griff, sonst den
# Exit-Code des Kommandos.
#
# B3 (Opus-Gegenprüfung 8.9.2026): welcher Kill-Weg zulässig ist, hängt davon
# ab, ob das Kommando tatsächlich in einer eigenen Prozessgruppe läuft — das
# wird zur LAUFZEIT per PGID-Vergleich geprüft, nicht angenommen (Beweis: der
# `set -m`-Fallback isoliert NICHT, PGID blieb identisch mit der aufrufenden
# Shell; ein Gruppen-Kill hätte dort die eigene Shell mitgetroffen).
laufe_mit_wache() {
  local budget_s="$1"
  shift
  if command -v setsid >/dev/null 2>&1; then
    setsid "$@" &
  else
    ( set -m; exec "$@" ) &
  fi
  local pid=$!
  local eigene_pgid
  eigene_pgid=$(ps -o pgid= -p $$ 2>/dev/null | tr -d ' ')
  local gewartet=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$gewartet" -ge "$budget_s" ]; then
      local pgid
      pgid=$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')
      if [ -n "$pgid" ] && [ -n "$eigene_pgid" ] && [ "$pgid" != "$eigene_pgid" ]; then
        # Echte eigene Prozessgruppe (setsid) — Gruppen-Kill trifft den
        # ganzen Baum in einem Rutsch.
        kill -TERM -- "-${pgid}" 2>/dev/null || true
        sleep 15
        kill -KILL -- "-${pgid}" 2>/dev/null || true
      else
        # Keine isolierte Gruppe (macOS-Fallback ohne setsid) — Baum per
        # pgrep -P ermitteln und einzeln beenden, statt versehentlich die
        # eigene Shell per Gruppen-Kill mitzutreffen.
        local baum
        baum=$(kinder_rekursiv "$pid")
        kill -TERM "$pid" 2>/dev/null || true
        for kind in $baum; do
          kill -TERM "$kind" 2>/dev/null || true
        done
        sleep 15
        kill -KILL "$pid" 2>/dev/null || true
        for kind in $baum; do
          kill -KILL "$kind" 2>/dev/null || true
        done
      fi
      wait "$pid" 2>/dev/null || true
      return 124
    fi
    sleep 1
    gewartet=$((gewartet + 1))
  done
  wait "$pid"
}

# B1: dpkg --configure -a bekommt jetzt ein eigenes 60-s-Limit (vorher
# unbegrenzt) — geht in die Zeitbudget-Rechnung im Skript-Kopf ein.
fuehre_dpkg_configure() {
  if [ "$testmodus" -eq 1 ]; then
    echo "(testmodus) uebersprungen: sudo dpkg --configure -a"
    return 0
  fi
  local status=0
  laufe_mit_wache 60 sudo dpkg --configure -a || status=$?
  if [ "$status" -ne 0 ]; then
    echo "::warning::dpkg --configure -a nicht sauber (Exit ${status}) — Versuch trotzdem"
  fi
}

# Startprobe: echter Browser-Start + leere Seite. Nur Exit 0 zählt; jede
# fehlende Systembibliothek («error while loading shared libraries») macht den
# Start rot und schickt uns in den apt-Zweig (§6.7: die Probe kann scheitern).
probe_js='const{chromium}=require("@playwright/test");(async()=>{const b=await chromium.launch();try{const p=await b.newPage();await p.setContent("<p>ok</p>");}finally{await b.close();}})().catch(e=>{console.error(String(e.message).split("\n").slice(0,6).join("\n"));process.exit(1);});'

chromium_startet() {
  local status=0
  if [ -n "${LEXMETRIK_PROBE_CMD:-}" ]; then
    read -ra probe_arr <<< "$LEXMETRIK_PROBE_CMD"
    laufe_mit_wache "$probe_timeout" "${probe_arr[@]}" || status=$?
  else
    laufe_mit_wache "$probe_timeout" node -e "$probe_js" || status=$?
  fi
  return "$status"
}

# Weg 1 (kein apt): Browser nur laden, wenn der Cache fehlt, dann Startprobe.
# Ein Fehlschlag hier ist nie fatal — er führt nur in den apt-Weg unten.
read -ra nodeps_arr <<< "$nodeps_cmd"
nodeps_status=0
laufe_mit_wache "$nodeps_timeout" "${nodeps_arr[@]}" || nodeps_status=$?
if [ "$nodeps_status" -eq 0 ]; then
  probe_status=0
  chromium_startet || probe_status=$?
  if [ "$probe_status" -eq 0 ]; then
    echo "::notice::Chromium startet, Systembibliotheken vorhanden — apt übersprungen."
    exit 0
  fi
  echo "::warning::Chromium-Startprobe fehlgeschlagen (Exit ${probe_status}) — Systembibliotheken fehlen, apt-Weg folgt."
else
  echo "::warning::playwright install chromium (ohne apt) fehlgeschlagen (Exit ${nodeps_status}) — apt-Weg folgt."
fi

if [ "$testmodus" -eq 0 ]; then
  echo 'Acquire::Retries "3"; Acquire::http::Timeout "30"; Acquire::https::Timeout "30";' \
    | sudo tee /etc/apt/apt.conf.d/99-lexmetrik-geduld > /dev/null
fi

for versuch in 1 2; do
  if [ "$versuch" -gt 1 ]; then
    fuehre_dpkg_configure
  fi

  warte_auf_dpkg_sperre || exit 1

  read -ra cmd_arr <<< "$install_cmd"
  # NICHT `if laufe_mit_wache …; then … fi; status=$?` — bei nicht
  # ausgeführtem then-Zweig liefert die if-Konstruktion laut POSIX/Bash
  # immer Exit 0 zurück, der echte Fehlercode ginge verloren. Mit `||`
  # bleibt der Aufruf unter `set -e` unkritisch UND der Code landet in
  # $status.
  status=0
  laufe_mit_wache "$install_timeout" "${cmd_arr[@]}" || status=$?
  if [ "$status" -eq 0 ]; then
    echo "playwright install: Versuch ${versuch}/2 durch."
    exit 0
  fi

  echo "::warning::playwright install: Versuch ${versuch}/2 nach spätestens ${install_timeout}s abgebrochen oder fehlgeschlagen (Exit ${status}) — räume verwaiste apt/dpkg-Prozesse auf, dann Wiederholung."
  # B4: exakter Prozessname statt Substring-Match (`-f 'apt-get|dpkg'` hätte
  # auch den eigenen Eltern-sudo und die fuser-Zeile dieses Skripts treffen
  # können). Hinweis (i): sudo mit use_pty kann apt-get aus der von ihm
  # gestarteten Gruppe heben — dieser pkill bleibt deshalb Pflicht, auch wenn
  # der Gruppen-Kill oben im Regelfall schon greift.
  fuehre_sudo_aus pkill -9 -x apt-get 2>/dev/null || true
  fuehre_sudo_aus pkill -9 -x dpkg 2>/dev/null || true
done

echo "::error::playwright install kam in zwei Versuchen nicht durch — Paketspiegel gestört, Shard rot (nicht still übersprungen)."
exit 1
