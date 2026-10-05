#!/usr/bin/env python3
"""VORSCHLAGSDATEI (QS-SELBSTOPT 7.8.2026) — ersetzt .claude/hooks/gate-stopp.py.

Anwendung durch David (die Berechtigungsschicht sperrt Hook-Änderungen für
Sessions — zu Recht):

    cp scripts/hooks-vorschlag-gate-stopp.py .claude/hooks/gate-stopp.py
    git add .claude/hooks/gate-stopp.py scripts/hooks-vorschlag-gate-stopp.py
    git rm scripts/hooks-vorschlag-gate-stopp.py

Danach diese Vorschlagsdatei löschen (sonst zweite Wahrheit, §5).

────────────────────────────────────────────────────────────────────────────
Stop-Hook (FAHRPLAN-TOKEN-DISZIPLIN.md T-2, Ja David 11.6.2026): fährt
das schnelle Tor (tsc · vitest · golden:vergleich via scripts/gate.sh
schnell) NATIV nach jeder Antwort, wenn tor-relevante Dateien geändert sind.

- GRÜN  → Exit 0, nichts gelangt in den Kontext (0 Tokens).
- ROT   → Exit 2, das Stoppen wird EINMAL blockiert und die volle
          Tor-Ausgabe geht als Feedback an Claude (volle Fidelity, §6).
          stop_hook_active verhindert die Endlosschleife.
- Keine relevanten Änderungen / git nicht verfügbar → Exit 0 (still).

§17-Nachtrag 7.8.2026 (QS-SELBSTOPT, Ent-Regulierung; Freigabe David im Chat):
GRÜN-FINGERABDRUCK. Der Lauf kostete gemessen ~36–38 s (die «~7 s» der Anlage
waren 5× überholt) und feuerte nach JEDER Antwort, auch wenn sich seit dem
letzten grünen Lauf nichts geändert hatte. Jetzt wird der Zustand (HEAD +
Dirty-Liste + mtime/Grösse je Datei) gehasht; ist er identisch mit dem zuletzt
GRÜN geprüften, wird übersprungen. Kein Schutzverlust: jeder neue Zustand
läuft weiterhin; Rot speichert nie einen Fingerabdruck. mtime als Zutat ist
bewusst konservativ — erneutes Speichern erzeugt höchstens einen ÜBERFLÜSSIGEN
Lauf, nie einen übersprungenen nötigen.

§17-Nachtrag 5.10.2026 (QS-CPU, feste Regel David «schwere Läufe in die
CI»): statt `gate.sh schnell` (tsc · VOLLE vitest-Suite · golden, nach jeder
Antwort jeder parallelen Session — Mac-Load ~27) läuft nur noch
`vitest related` für die geänderten src/scripts-Dateien (gezielt, lokal
höchstens 2 Worker per vite.config.ts). Typen, volle Suite und Golden
belegt der PR-Lauf (Lauf-ID am Kopf-SHA).

Grenze (Anthropic best-practices, Abruf 7.8.2026): Claude Code übersteuert
einen Stop-Hook nach 8 Blockierungen in Folge — dieser Hook ist ein
Bremsklotz, kein Zaun. Harte Sperren bleiben PreToolUse + Berechtigungssystem.
"""
import hashlib
import json
import os
import subprocess
import sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

# Loop-Guard: dieser Stopp folgt bereits auf einen Hook-Block dieses Turns.
if data.get("stop_hook_active"):
    sys.exit(0)

repo = os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

# Nur prüfen, wenn tor-relevante Dateien im Arbeitsverzeichnis geändert sind
# (Pfadliste = Wartungsregel 2 in FAHRPLAN-TOKEN-DISZIPLIN.md).
PFADE = ["src", "scripts", "package.json", "vite.config.ts",
         "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"]
try:
    st = subprocess.run(
        ["git", "status", "--porcelain", "--", *PFADE],
        cwd=repo, capture_output=True, text=True, timeout=15,
    )
    kopf = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=repo, capture_output=True, text=True, timeout=15,
    )
except Exception:
    sys.exit(0)
if st.returncode != 0 or not st.stdout.strip():
    sys.exit(0)

# ── Grün-Fingerabdruck: identischen, bereits grün geprüften Zustand überspringen
CACHE = os.path.join(repo, ".gate-stopp-gruen")  # gitignored


def fingerabdruck() -> str:
    h = hashlib.sha256()
    h.update(kopf.stdout.strip().encode())
    h.update(st.stdout.encode())
    for zeile in st.stdout.splitlines():
        # porcelain: "XY pfad" bzw. "XY alt -> neu" — letzter Pfad zählt
        pfad = zeile[3:].split(" -> ")[-1].strip().strip('"')
        voll = os.path.join(repo, pfad)
        try:
            s = os.stat(voll)
            h.update(f"{pfad}:{s.st_mtime_ns}:{s.st_size}".encode())
        except OSError:
            h.update(f"{pfad}:weg".encode())
    return h.hexdigest()


abdruck = fingerabdruck()
try:
    with open(CACHE, encoding="utf-8") as f:
        if f.read().strip() == abdruck:
            sys.exit(0)  # exakt dieser Zustand war schon grün
except OSError:
    pass

# Gezielt statt voll: nur Tests, die von den geänderten Quellen abhängen.
ziele = []
for zeile in st.stdout.splitlines():
    pfad = zeile[3:].split(" -> ")[-1].strip().strip('"')
    if pfad.startswith(("src/", "scripts/")) and pfad.endswith((".ts", ".tsx")) \
            and os.path.exists(os.path.join(repo, pfad)):
        ziele.append(pfad)
if not ziele:
    sys.exit(0)  # nur Konfig/Doku/gelöscht: Beleg ist der PR-Lauf

try:
    gate = subprocess.run(
        ["npx", "vitest", "related", "--run", "--passWithNoTests",
         "--reporter=dot", *ziele],
        cwd=repo, capture_output=True, text=True, timeout=240,
    )
except Exception as e:
    print(f"gate-stopp.py: vitest related fehlgeschlagen ({e}) — gezielt "
          f"`npx vitest run <datei>` fahren, Rest belegt der PR-Lauf.",
          file=sys.stderr)
    sys.exit(2)

if gate.returncode == 0:
    try:  # Fingerabdruck NUR bei Grün persistieren; Fehler hier nie fatal
        with open(CACHE, "w", encoding="utf-8") as f:
            f.write(abdruck + "\n")
    except OSError:
        pass
    sys.exit(0)

print(
    "STOP-HOOK: `vitest related` ist ROT (automatischer Lauf nach deiner "
    "Antwort für die geänderten Dateien).\n\n"
    + "\n".join((gate.stdout + gate.stderr).splitlines()[-120:]) +
    "\nUrsache im Code beheben (§6: kein `npm run golden`, Tests nicht "
    "aufweichen; Diagnose nach §6 Ziff. 5 — rote Datei gezielt, "
    "golden:diff je Fall). Stammt der Bruch NICHT von deiner Änderung "
    "(§12 Parallel-Session): nicht hineinfixen, sondern David den Befund "
    "melden und stoppen.",
    file=sys.stderr,
)
sys.exit(2)
