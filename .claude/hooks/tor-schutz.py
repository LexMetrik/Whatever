#!/usr/bin/env python3
"""PreToolUse-Hook (Bash + MCP-Shell-Kanäle). Blockiert (Exit 2, Grund auf stderr):

1.  Tor-Kommando hinter Pipe/|| — der Exit-Code ginge verloren.
2a. Merge und Branch-/Worktree-Löschen in einer Kommandozeile — scheitert der
    Merge, löscht die Kette trotzdem den Branch und der PR schliesst unmerged.
2b. Direkter Push auf main — jeder main-Push ist ein Deploy; Freigabe nur mit
    LEXMETRIK_MAIN_PUSH=1 im selben Kommando.
3.  Merge (auch --auto, gh api …/merge) auf Risiko-Pfad ohne Gegenprüfungs-
    Verdikt — nur die Tool-Ebene greift auch in Sub-Agenten.
4.  git commit --amend — schreibt sonst fremde Commits paralleler Sessions um.
"""
import json
import os
import re
import shlex
import subprocess
import sys

# Shell-Kanäle: Tool-Teil des Namens → Feld mit der Kommandozeile.
SHELL_KANAELE = {"Bash": "command", "start_process": "command", "interact_with_process": "input"}
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
data = data if isinstance(data, dict) else {}
name = str(data.get("tool_name") or "Bash")
feld = SHELL_KANAELE.get(name.rsplit("__", 1)[-1] if name.startswith("mcp__") else name)
if feld is None:
    sys.exit(0)
# Fail-safe: exotische Payloads hart koerzieren — ein Traceback wäre Fail-open.
ti = data.get("tool_input") if isinstance(data.get("tool_input"), dict) else {}
cmd = ti.get(feld, "")
cmd = cmd if isinstance(cmd, str) else str(cmd)
if not cmd:
    sys.exit(0)

probleme = []

# ── 1. Tor hinter Pipe — nur wenn das Tor an KOMMANDO-Position steht ──────
TOR_MUSTER = re.compile(
    r"npm run lint|npm test\b|npx vitest|npx tsc|golden:vergleich"
    r"|golden-outputs|npm run check|npm run golden|npx playwright test|npm run test:e2e"
    r"|bibliothek-check\.sh|scripts/check-[a-z-]+\.(?:ts|sh)"
)
STARTER = re.compile(
    r"^(?:[A-Za-z_]\w*=\S+|sudo|env|time|command|nice|xargs"
    r"|bash|sh|zsh|npx|node|python3?|vite-node|tsx|ts-node)$"
)
PFAD_ENDE = re.compile(r"(?:\./)?(?:[\w.-]+/)+$")

def ist_tor_lauf(stufe: str) -> bool:
    """Steht in dieser Pipeline-Stufe ein Tor als Kommando (nicht als grep-Argument)?"""
    m = TOR_MUSTER.search(stufe)
    if not m:
        return False
    kopf = PFAD_ENDE.sub("", stufe[: m.start()])
    return all(STARTER.match(t) for t in kopf.split())

for seg in re.split(r"&&|;|\n", cmd):
    if any(ist_tor_lauf(s) for s in seg.split("|")[:-1]):
        probleme.append("BLOCKIERT: Tor-Kommando hinter Pipe/|| — Exit-Code geht "
                        "verloren. Nackt laufen lassen bzw. in Datei umleiten.")
        break

# ── 4. git commit --amend (an Kommando-Position, nicht in grep-Argumenten) ──
if re.search(r"(?:^|[;&|\n(])\s*(?:[A-Za-z_]\w*=\S+\s+)*git\s+commit\b[^\n;&|]*--amend", cmd):
    probleme.append("BLOCKIERT: git commit --amend ist verboten — Nachzügler als "
                    "eigenen, additiven Commit.")

# ── Merge-Erkennung an Kommando-Position ───────────────────────────────────
MERGE_MUSTER = re.compile(r"\bgh\s+pr\s+merge\b|\bgh\s+api\b[^\n]*?/(?:pulls|merges)\b"
                          r"|\bgh\s+api\b[^\n]*?\bmerge\b")
SCHALTER = re.compile(r"^(?:-{1,2}[A-Za-z][\w-]*|[\"'])$")

def ist_merge_lauf(stufe: str) -> bool:
    m = MERGE_MUSTER.search(stufe)
    if not m:
        return False
    kopf = PFAD_ENDE.sub("", stufe[: m.start()])
    return all(STARTER.match(t) or SCHALTER.match(t) for t in kopf.split())

merge_stufen = [t for t in re.split(r"&&|\|\||[;|\n]", cmd) if ist_merge_lauf(t)]

def pr_nummer(stufen: list) -> str:
    """PR-Nummer aus dem Merge-Kommando; leer = Merge des aktuellen Branch."""
    for st in stufen:
        m = re.search(r"/pulls/(\d+)/merge\b", st)
        if m:
            return m.group(1)
        try:
            tok = shlex.split(st)
        except ValueError:  # unbalancierte Quotes: keine Nummer raten
            continue
        for i in range(len(tok) - 2):
            if tok[i].endswith("gh") and tok[i + 1] == "pr" and tok[i + 2] == "merge":
                for w in tok[i + 3:]:
                    if w.isdigit():
                        return w
    return ""

# ── 2a. Merge und Aufräumen nie in einer Kommandozeile ─────────────────────
if merge_stufen and re.search(r"git\s+push\b[^\n]*--delete|git\s+branch\s+-[dD]\b|git\s+worktree\s+remove", cmd):
    probleme.append("BLOCKIERT: Merge und Branch-/Worktree-Löschung in einer Zeile. "
                    "Erst mergen, `state: MERGED` prüfen, dann aufräumen.")

# ── 2b. Direkter Push auf main ─────────────────────────────────────────────
if re.search(r"\bgit\s+push\b[^\n|;&]*\borigin\s+(HEAD:)?main\b", cmd) \
        and "LEXMETRIK_MAIN_PUSH=1" not in cmd:
    probleme.append("BLOCKIERT: direkter Push auf main (= Deploy). Weg über PR — "
                    "oder bewusst `LEXMETRIK_MAIN_PUSH=1 git push origin main`.")

# ── 3. Merge-Sperre auf Risiko-Pfaden (geprüft wird der PR-Head, sonst HEAD) ──
if merge_stufen:
    projekt = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    umfeld = {k: v for k, v in os.environ.items() if k != "MERGE_SCHUTZ_KOPF"}
    flaeche = "der lokalen Arbeitskopie (HEAD)"
    nr = pr_nummer(merge_stufen)
    if nr:
        def lauf(*a):
            return subprocess.run(list(a), cwd=projekt, capture_output=True, text=True, timeout=300)
        try:
            v = lauf("gh", "pr", "view", nr, "--json", "headRefOid")
            oid = json.loads(v.stdout).get("headRefOid", "") if not v.returncode else ""
            if oid:
                lauf("git", "fetch", "-q", "origin", "main", f"pull/{nr}/head")
                if not lauf("git", "cat-file", "-e", oid + "^{commit}").returncode:
                    umfeld["MERGE_SCHUTZ_KOPF"] = oid
                    flaeche = f"PR #{nr} (Head {oid[:8]})"
        except Exception:  # noqa: BLE001
            pass  # ohne gh/Netz: Rückfall auf HEAD, im Text ausgewiesen
    try:
        p = subprocess.run(["npm", "run", "--silent", "check:merge-schutz"],
                           cwd=projekt, capture_output=True, text=True, timeout=300, env=umfeld)
        if p.returncode != 0:
            probleme.append("BLOCKIERT: Merge auf Risiko-Pfad ohne Gegenprüfungs-Verdikt. "
                            f"Geprüft: {flaeche}.\n\n" + (p.stdout or p.stderr).strip())
        elif any(re.search(r"--auto\b", t) for t in merge_stufen) \
                and "kein Risiko-Pfad" not in (p.stdout or ""):
            probleme.append("BLOCKIERT: `--auto` auf Risiko-Pfad — Auto-Merge prüft nur jetzt, spätere "
                            "Commits liefen ungeprüft durch. CI grün abwarten, dann ohne --auto mergen.")
    except Exception as e:  # noqa: BLE001
        # Fail-closed: läuft das Tor nicht, wird nicht durchgewinkt.
        probleme.append(f"BLOCKIERT: check:merge-schutz lief nicht ({e}) — Merge nicht freigegeben.")

if probleme:
    print("\n".join(probleme), file=sys.stderr)
    sys.exit(2)
sys.exit(0)
