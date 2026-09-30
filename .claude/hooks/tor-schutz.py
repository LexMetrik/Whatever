#!/usr/bin/env python3
"""PreToolUse-Hook (Bash + MCP-Shell-Kanäle): blockiert die drei teuersten
Unfall-Muster.

1. Tor-Kommandos (Lint/Test/tsc/Golden/Check) durch Pipes jagen —
   Pipes verschlucken den Exit-Code (real passiert: 8 Lint-Fehler und
   eine Golden-Abweichung gingen so verloren).
2. git commit --amend — hat bei laufender Parallel-Session einen
   fremden Commit umgeschrieben. Nur additive Commits.
3. `gh pr merge` auf einem Risiko-Pfad ohne Gegenprüfungs-Verdikt
   (Vorfall PR #309, 20.7.2026: 11 erfundene Amtsträger:innen ~1 h auf
   prod). Prosa hätte #309 NICHT verhindert — der Agent hat korrekt
   befolgt, was im Auftrag stand. Nur die Tool-Ebene greift auch dann,
   wenn die Merge-Erlaubnis im falschen Prompt-Block steht, und auch in
   Sub-Agenten, die CLAUDE.md gar nicht sehen.

Prompt-Cache (QS-TOK/T19): PreToolUse liegt AUSSERHALB des gecachten
Präfix — dieser Hook kostet bei Grün 0 Token und keine Cache-Invalidierung.

MCP-Kanal-Deckung (QS-EFFIZIENZ 15.8.2026): `start_process`/
`interact_with_process` starten dieselbe Shell (Feld `command` bzw. `input`);
unten wird nur die HERKUNFT normalisiert, der Bash-Pfad bleibt byte-gleich.

Exit 2 = Aufruf blockieren, stderr geht als Feedback an Claude.
"""
import json
import os
import re
import shlex
import subprocess
import sys

# Shell-Kanäle: Tool-Name → Feld im tool_input, das die Kommandozeile trägt.
SHELL_KANAELE = {
    "Bash": "command",
    "start_process": "command",
    "interact_with_process": "input",
}


def kanal(tool_name: str) -> str:
    """MCP-Tools heissen `mcp__<server>__<tool>` — massgeblich ist der Tool-Teil.
    Nicht-MCP-Namen bleiben unverändert (`Bash` → `Bash`)."""
    return tool_name.rsplit("__", 1)[-1] if tool_name.startswith("mcp__") else tool_name


try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

feld = SHELL_KANAELE.get(kanal(str(data.get("tool_name") or "Bash")))
if feld is None:
    sys.exit(0)
# Gegenprüfungs-Auflage 15.8.2026: Nicht-String-Input (Zahl, Liste) warf hier
# einen Traceback → Exit 1 → Claude Code wertet das als non-blocking = FAIL-OPEN
# eines Wächters. Darum: tool_input hart auf dict koerzieren, Kommando auf str —
# der Muster-Scan läuft dann auch über exotische Payloads statt zu sterben.
ti = data.get("tool_input")
if not isinstance(ti, dict):
    ti = {}
cmd = ti.get(feld, "")
if not isinstance(cmd, str):
    cmd = str(cmd)
if not cmd:
    sys.exit(0)

probleme = []

TOR_MUSTER = re.compile(
    r"npm run lint|npm test\b|npx vitest|npx tsc|golden:vergleich"
    r"|golden-outputs|npm run check|npm run golden"
    # §17-Nachtrag 4.8.2026: `npx playwright test … | tail` rutschte durch und
    # verschluckte prompt 4 rote Specs (e2e-Re-Run der FRISTENKERN-Session) —
    # e2e-Läufe sind Tore wie alle anderen.
    r"|npx playwright test|npm run test:e2e"
    # §17-Nachtrag 5.8.2026: Direktaufrufe der Tor-Skripte rutschten durch —
    # `bash scripts/bibliothek-check.sh | tail` verschluckte 2 Verstösse, der
    # Commit ging trotz rotem Tor raus (Realfall Bibliotheks-Recherche 5.8.).
    # Tor bleibt Tor, egal ob via npm-Alias oder Skript-Pfad aufgerufen.
    r"|bibliothek-check\.sh|scripts/check-[a-z-]+\.(?:ts|sh)|struktur-rotieren\.py --check"
)
# §17-Nachtrag 29.8.2026: Regel 1 greift nur, wenn das Tor SELBST ausgefuehrt
# wird (KOMMANDO-POSITION: davor nur Umgebungs-Zuweisungen, Starter und ein
# anhaengender Pfad). Das blosse Vorkommen im Segment blockte rein lesende
# Aufrufe (3 Fehlalarme: `grep -n "check:plan" scripts/check-tor-paritaet.ts
# | head`, unquoted, `wc -l scripts/check-plan.ts | tail`); die Quote-Ausnahme
# fuer grep/rg (7.8.2026) entfaellt damit. Beides getestet: `rg 'npm run lint'
# f | head` durch, `grep "x" f | npm run lint | tail` blockiert.
STARTER = re.compile(
    r"^(?:[A-Za-z_]\w*=\S+|sudo|env|time|command|nice|xargs"
    r"|bash|sh|zsh|npx|node|python3?|vite-node|tsx|ts-node)$"
)
PFAD_ENDE = re.compile(r"(?:\./)?(?:[\w.-]+/)+$")


def ist_tor_lauf(stufe: str) -> bool:
    """Wird in dieser Pipeline-Stufe ein Tor als KOMMANDO ausgefuehrt?"""
    m = TOR_MUSTER.search(stufe)
    if not m:
        return False
    kopf = PFAD_ENDE.sub("", stufe[: m.start()])
    return all(STARTER.match(t) for t in kopf.split())


# je Segment (getrennt durch && ; oder Zeilenende): schluckt eine Pipe bzw.
# ein '||' den Exit-Code eines Tores? Nur Stufen VOR der letzten sind relevant —
# dort geht der Exit-Code verloren ('|| true' zerfaellt ebenfalls hier).
for seg in re.split(r"&&|;|\n", cmd):
    stufen = seg.split("|")
    if any(ist_tor_lauf(s) for s in stufen[:-1]):
        probleme.append(
            "BLOCKIERT (§6/§9): Tor-Kommando durch Pipe/|| gejagt — der "
            "Exit-Code wird verschluckt (Lektion vom 6./7.6.: 8 Lint-Fehler "
            "bzw. eine Golden-Abweichung gingen so verloren). Kommando NACKT "
            "laufen lassen und die volle Ausgabe lesen."
        )
        break

# 1b. Push nur per `&&` hinter einem Tor (#1194, 30.9.2026: `gate; echo $?; git push`).
def ist_lauf(muster: str, stufe: str) -> bool:
    m = re.search(muster, stufe)
    return bool(m) and all(STARTER.match(t) for t in PFAD_ENDE.sub("", stufe[: m.start()]).split())


teile = re.split(r"(&&|\|\||;|\n)", cmd)
tor_da, nur_und = False, True
for i in range(0, len(teile), 2):
    nur_und = nur_und and (i == 0 or teile[i - 1] == "&&")
    if tor_da and not nur_und and ist_lauf(r"\bgit\s+push\b", teile[i]):
        probleme.append(
            "BLOCKIERT (landung Ziff. 7, #1194): `git push` nach einem Tor nur "
            "per `&&` — sonst laeuft der Push auch bei rotem Tor."
        )
        break
    if any(ist_tor_lauf(t) or ist_lauf(r"npm run gate\b", t) for t in teile[i].split("|")):
        tor_da, nur_und = True, True

if re.search(r"git\s+commit\b[^\n]*--amend", cmd):
    probleme.append(
        "BLOCKIERT: git commit --amend ist in diesem Repo verboten "
        "(Lektion 6.6.: hat bei laufender Parallel-Session einen fremden "
        "Commit umgeschrieben). Nachzügler als eigenen, additiven Commit."
    )

# ── Merge-Erkennung: Kommando-Position, nicht Textvorkommen ───────────────
# BEFUND adversariale Pruefung 20.7.2026: die erste Fassung traf nur
# /\bgh\s+pr\s+merge\b/. Zwei Umgehungen: (a) `gh api -X PUT
# repos/o/r/pulls/315/merge …` passierte bei rotem Tor (unten mitgefasst);
# (b) `gh pr merge --auto` prueft nur beim AKTIVIEREN, danach gepushte
# Risiko-Commits merged GitHub serverseitig ohne Hook — per PreToolUse nicht
# schliessbar, darum `--auto` auf Risikopfaden GANZ gesperrt. Eigentlicher
# Schliesser: der Required Check der Branch-Regeln (DAVID-GATE).
#
# §17-Wurzelfix 5.9.2026: das Muster traf jedes TEXTvorkommen — ein
# `grep 'gh pr merge' src/` wurde blockiert (reproduziert 5.9.). Massstab ist
# jetzt die KOMMANDO-POSITION wie in Regel 1: davor nur Starter, Schalter und
# ein oeffnendes Quote (`bash -c "gh pr merge 5"` gedeckt, `grep "…"` nicht).
MERGE_MUSTER = re.compile(
    r"\bgh\s+pr\s+merge\b"                       # gh pr merge …
    r"|\bgh\s+api\b[^\n]*?/(?:pulls|merges)\b"   # gh api …/pulls/N/merge, …/merges
    r"|\bgh\s+api\b[^\n]*?\bmerge\b"
)
SCHALTER = re.compile(r"^(?:-{1,2}[A-Za-z][\w-]*|[\"'])$")


def ist_merge_lauf(stufe: str) -> bool:
    """Wird in dieser Stufe ein Merge als KOMMANDO ausgefuehrt?"""
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
        except ValueError:
            continue  # unbalancierte Quotes: keine Nummer raten
        for i in range(len(tok) - 2):
            if tok[i].endswith("gh") and tok[i + 1] == "pr" and tok[i + 2] == "merge":
                for w in tok[i + 3:]:
                    if w.isdigit():
                        return w
    return ""


# ── 2a. Merge und Aufraeumen nie in EINER Kommandozeile (Vorfall 16.8.2026) ──
# `gh pr merge 533 …; git push origin --delete <branch>` — der Merge scheiterte
# (BEHIND/BLOCKED), die Kette lief weiter, der Remote-Branch war weg, GitHub
# schloss den PR unmerged. Aufraeumen (Branch/Worktree loeschen) erst NACH dem
# geprueften `state: MERGED`, in einem eigenen Kommando.
if merge_stufen and re.search(
    r"(git\s+push\b[^\n]*--delete|git\s+branch\s+-[dD]\b|git\s+worktree\s+remove)", cmd
):
    probleme.append(
        "BLOCKIERT (Skill landung Ziff. 7/Nachkontrolle 5, Vorfall 16.8.2026): "
        "`gh pr merge` und Branch-/Worktree-Loeschung in EINER Kommandozeile — "
        "scheitert der Merge (BEHIND/BLOCKED), loescht die Kette trotzdem den "
        "Branch und GitHub schliesst den PR unmerged (#533). Erst mergen, dann "
        "`gh pr view --json state` == MERGED pruefen, DANN aufraeumen."
    )

# ── 2b. Direkter main-Push = Deploy (Auftrag David 15.8.2026) ─────────────
# Jeder Push auf origin/main loest einen Vercel-Deploy aus UND laesst jeden
# offenen Auto-Merge-PR auf BEHIND fallen. Realfall 15.8.2026: ~15 kleine
# Verwaltungs-Pushes rissen das Tageslimit, sechs fertige PRs standen
# stundenlang. Regel (Skill landung Ziff. 7): Feature einzeln per PR, Verwaltung
# im PR oder am Session-Ende in EINEM Push. Freigabe fuer diesen Schluss-Push:
# `LEXMETRIK_MAIN_PUSH=1` im selben Kommando; `gh pr merge` bleibt unberuehrt.
if re.search(r"\bgit\s+push\b[^\n|;&]*\borigin\s+(HEAD:)?main\b", cmd) \
        and "LEXMETRIK_MAIN_PUSH=1" not in cmd:
    probleme.append(
        "BLOCKIERT (Skill landung Ziff. 7, David 15.8.2026): direkter Push "
        "auf main. Jeder main-Push ist ein Vercel-Deploy und wirft alle "
        "offenen Auto-Merge-PRs auf BEHIND. Weg: Aenderung in den "
        "Feature-Branch/PR (Buchung per Trailer, Ziff. 9) — oder Doku am "
        "Session-Ende in EINEM Push buendeln: `LEXMETRIK_MAIN_PUSH=1 git "
        "push origin main` (bewusste Freigabe im selben Kommando)."
    )

# ── 3. Merge-Sperre auf Risiko-Pfaden ──────────────────────────────────
# Nur bei Merge-Kommandos (selten) — die ~3 s Laufzeit fallen sonst nie an.
# Muster und Umgehungs-Befunde stehen oben bei MERGE_MUSTER.
#
# §17-Wurzelfix 5.9.2026: geprueft wurde die LOKALE Arbeitskopie; ein fremder
# Risiko-Branch im Haupt-Checkout blockierte die Landung reiner UI-PRs (#679).
# Nennt das Kommando eine PR-Nummer, wird darum der PR-HEAD geprueft
# (MERGE_SCHUTZ_KOPF). Ohne `gh`/Netz Rueckfall auf HEAD — nie still gruen (§6.7).
if merge_stufen:
    projekt = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    umfeld = dict(os.environ)
    umfeld.pop("MERGE_SCHUTZ_KOPF", None)
    flaeche = "der lokalen Arbeitskopie (HEAD)"
    nr = pr_nummer(merge_stufen)
    if nr:
        def lauf(*a):
            return subprocess.run(list(a), cwd=projekt, capture_output=True,
                                  text=True, timeout=300)
        try:
            v = lauf("gh", "pr", "view", nr, "--json", "headRefOid")
            oid = json.loads(v.stdout).get("headRefOid", "") if not v.returncode else ""
            if oid:
                # `pull/<nr>/head` deckt auch Forks; holt nur FETCH_HEAD, bewegt
                # keine lokale Referenz und beruehrt keinen Worktree.
                lauf("git", "fetch", "-q", "origin", "main", f"pull/{nr}/head")
                if not lauf("git", "cat-file", "-e", oid + "^{commit}").returncode:
                    umfeld["MERGE_SCHUTZ_KOPF"] = oid
                    flaeche = f"PR #{nr} (Head {oid[:8]})"
        except Exception:  # noqa: BLE001
            pass  # ohne gh/Netz: Rueckfall auf HEAD, unten im Text ausgewiesen
    try:
        p = subprocess.run(
            ["npm", "run", "--silent", "check:merge-schutz"],
            cwd=projekt, capture_output=True, text=True, timeout=300, env=umfeld,
        )
        if p.returncode != 0:
            probleme.append(
                "BLOCKIERT (§9/§14 Ziff. 4): Merge auf einem Risiko-Pfad ohne "
                f"Gegenpruefungs-Verdikt. Geprueft wurde {flaeche}.\n\n"
                + (p.stdout or p.stderr).strip()
            )
        elif any(re.search(r"--auto\b", t) for t in merge_stufen) \
                and "kein Risiko-Pfad" not in (p.stdout or ""):
            # Tor ist JETZT gruen — aber `--auto` merged erst spaeter, ohne
            # erneute Pruefung. Auf Risikopfaden ist das die Luecke aus
            # Befund (b): ein danach gepushter Risiko-Commit faehrt
            # ungeprueft auf prod. Urteil aus demselben Lauf (der zweite
            # Tor-Lauf von frueher war Doppelarbeit).
            probleme.append(
                "BLOCKIERT (§9): `--auto` auf einem Risiko-Pfad.\n\n"
                "  Auto-Merge prueft den Stand nur JETZT. Jeder danach "
                "gepushte Risiko-Commit wird serverseitig gemergt, ohne "
                "dass dieses Tor je wieder laeuft.\n"
                "  Weg: CI gruen abwarten, dann OHNE --auto mergen.\n"
                "  (Davids Daueranweisung 'Auto-merge bei gruener CI' "
                "bleibt fuer alle Nicht-Risiko-PRs unveraendert.)"
            )
    except Exception as e:  # noqa: BLE001
        # Fail-closed: kann das Tor nicht laufen, wird NICHT durchgewinkt.
        # Ein Tor, das bei Störung still grün wird, ist kein Tor (§6 Ziff. 7).
        probleme.append(
            f"BLOCKIERT: check:merge-schutz konnte nicht laufen ({e}). "
            "Merge nicht freigegeben — erst das Tor lauffähig machen "
            "(`npm run check:merge-schutz`), dann erneut."
        )

if probleme:
    print("\n".join(probleme), file=sys.stderr)
    sys.exit(2)

sys.exit(0)
