#!/usr/bin/env python3
"""PreToolUse-Guard (Read + Bash + MCP-Kanäle) — QS-TOK T5(a): verhindert Katastrophen-Reads,
die stumm 100k–500k Token in den Kontext ziehen (FAHRPLAN-TOKEN-OEKONOMIE §1/§4).

Weich und überwindbar — kein Beweis-Read wird verhindert:

  Rule A (Grösse):  Read einer Datei > ~200 KB OHNE offset/limit → Soft-Block.
                    Override: denselben Read mit offset/limit (gebundener Ausschnitt)
                    ODER die Daten-Sonde `npm run zeige -- <Erlass> <Artikel>` (T6).
  Rule B (Pfad):    Read/cat der Dateien, die §6 NIE direkt gelesen werden
                    (golden/*.json, package-lock.json, dist/**, fontData.ts) →
                    Block mit Verweis auf das richtige Werkzeug (golden:diff / zeige / npm ls).
                    0-Treffer-Fallen (still leeren) vermeiden wir bewusst — hier
                    kommt eine sichtbare Meldung statt eines False-Negative.

Generatoren/Tore/CI lesen dieselben Dateien per fs im Subprozess — die berührt
dieser Hook NICHT (er feuert nur auf die Tool-Aufrufe des Agenten). Leitplanke:
kein Tor, kein Build, kein Generator-Lauf wird blockiert.

MCP-Kanal-Deckung (QS-EFFIZIENZ 15.8.2026, Werkzeug-Analyse Befund 3): Der Hook
hing allein an den Matchern `Read`/`Bash`. Dieselbe Lese-Wirkung erzielen
`read_file`/`read_multiple_files`, dieselbe Shell-Wirkung
`start_process`/`interact_with_process` (Desktop Commander u. a.) — nur unter
anderen Feldnamen (`path`/`paths`/`length` statt `file_path`/`limit`, `input`
statt `command`). Unten wird ausschliesslich die HERKUNFT normalisiert; Rule A
und Rule B sind Wort für Wort unverändert, Read- und Bash-Pfad bleiben
byte-gleich.

Exit 2 = Aufruf blockieren, stderr geht als Feedback an Claude. Bei jeder
Unsicherheit (Stat schlägt fehl, Pfad unbekannt) → Exit 0 (nie fälschlich blocken).
"""
import json
import os
import re
import sys

SCHWELLE = 200 * 1024  # ~200 KB

# §6: diese Dateien werden NIE direkt gelesen — Werkzeug-Hinweis statt Read.
# Pfad-Token wird per Wortgrenze erkannt (Anfang, Whitespace, Quote, '=' oder '/'),
# damit er sowohl als Read-file_path (voll) wie eingebettet in ein Bash-Kommando greift.
_G = r"(?:^|[\s\"'=/])"
PFAD_MUSTER = re.compile(
    _G + r"golden/[^\s\"';|]*\.json\b"
    r"|" + _G + r"package-lock\.json\b"
    r"|" + _G + r"dist(?:-ssr)?/"
    r"|fontData\.ts\b"
)
WERKZEUG_HINWEIS = (
    "golden/* → `npm run golden:diff -- <id>` bzw. `golden:vergleich`; "
    "package-lock.json → `npm ls <paket>`; dist/** = Build-Artefakt (Quelle lesen); "
    "fontData.ts = Base64-Blob (nicht lesen)."
)
SONDE_HINWEIS = (
    "Statt der Riesendatei: gezielt mit offset/limit lesen, oder die Daten-Sonde "
    "`npm run zeige -- <Erlass> <Artikel>` (normtext, byte-treu) / `golden:diff` nutzen "
    "(FAHRPLAN-TOKEN-OEKONOMIE §4 T6). PDF oder andere Binärdatei (auch im Scratchpad, "
    "z. B. amtliche Fedlex-/BBl-PDF): Text VORHER extrahieren — PyMuPDF "
    "`python3 -c \"import fitz; d=fitz.open('<pfad>'); print(d[0].get_text())\"` "
    "(kein pdftotext auf dieser Maschine; Befund 15.9.2026) — und dann gezielt lesen."
)


def blockiere(msg):
    print(msg, file=sys.stderr)
    sys.exit(2)


try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

ti = data.get("tool_input")
# Gegenprüfungs-Auflage 15.8.2026: kein Traceback auf exotischen Payloads —
# Nicht-dict/Nicht-str fällt kontrolliert durch (lese-schutz blockt nie
# fälschlich), statt per Exit 1 undefiniert zu enden.
if not isinstance(ti, dict):
    ti = {}


def norm(p):
    return (p or "").replace("\\", "/")


def kanal(tool_name):
    """MCP-Tools heissen `mcp__<server>__<tool>` — massgeblich ist der Tool-Teil.
    Nicht-MCP-Namen bleiben unverändert (`Read` → `Read`). Fremde Tools mit
    ähnlichem Namen (z. B. `read_file_content`) fallen bewusst durch."""
    return tool_name.rsplit("__", 1)[-1] if tool_name.startswith("mcp__") else tool_name


tool = kanal(str(data.get("tool_name") or ""))

# Lese-Kanäle: Read (file_path/limit) · MCP read_file (path/length) ·
# MCP read_multiple_files (paths, kennt gar keine Begrenzung).
if tool in ("Read", "read_file", "read_multiple_files"):
    if tool == "read_multiple_files":
        pfade = list(ti.get("paths") or [])
        gebunden = False
    else:
        pfade = [ti.get("file_path") or ti.get("path") or ""]
        gebunden = (
            ti.get("offset") is not None
            or ti.get("limit") is not None
            or ti.get("length") is not None
        )
    for pfad in pfade:
        if not pfad or not isinstance(pfad, str):
            continue
        np = norm(pfad)
        if PFAD_MUSTER.search(np):
            blockiere(
                f"BLOCKIERT (§6/QS-TOK T5): «{os.path.basename(np)}» wird nie direkt "
                f"gelesen — es kippt nur Token in den Kontext. {WERKZEUG_HINWEIS}"
            )
        # Rule A: gebundener Read (offset/limit) ist immer erlaubt.
        if gebunden:
            continue
        try:
            groesse = os.path.getsize(pfad)
        except Exception:
            continue
        if groesse > SCHWELLE:
            blockiere(
                f"BLOCKIERT (QS-TOK T5): «{os.path.basename(np)}» ist "
                f"{groesse // 1024} KB (> {SCHWELLE // 1024} KB) und würde ungebremst "
                f"~{groesse // 4000}k Token ziehen. {SONDE_HINWEIS}"
            )
    sys.exit(0)

# Shell-Kanäle: Bash/start_process (command) · interact_with_process (input).
if tool in ("Bash", "start_process", "interact_with_process"):
    cmd = ti.get("input", "") if tool == "interact_with_process" else ti.get("command", "")
    if not cmd or not isinstance(cmd, str):
        sys.exit(0)
    # Nur die inhalts-dumpenden Leser fangen; head -c / wc / jq-Selektion sind
    # gebunden und bleiben erlaubt.
    for seg in re.split(r"&&|\|\||;|\n|\|", cmd):
        s = seg.strip()
        if not re.match(r"^(sudo\s+)?(cat|less|more|bat|nl|most|view)\b", s):
            continue
        if PFAD_MUSTER.search(norm(s)):
            blockiere(
                "BLOCKIERT (§6/QS-TOK T5): cat/less auf eine nie-direkt-zu-lesende "
                f"Datei. {WERKZEUG_HINWEIS} (Statt `cat` das Werkzeug nutzen.)"
            )
    sys.exit(0)

sys.exit(0)
