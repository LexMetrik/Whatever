#!/usr/bin/env python3
"""SubagentStop-Hook: §14.7 durchsetzbar machen (QS-HOOKS-AUSBAU, 14.8.2026).

WARUM (F4-Klasse, Register Skill `lehren`): Ein Erfolgsbericht ohne prüfbares
Artefakt (Commit-SHA, PR-Nummer, Tor-Ausgabe mit Exit-Code) gilt als NICHT
erfolgt — bisher stand das nur als Prosa in CLAUDE.md §14.7 und im
Rückgabe-Schema der lex-Agenten. Belegter Anlass: 1× fabrizierter
Erfolgsbericht bei 0 Tool-Calls (F4, 18.–20.7.2026). Dieser Hook verschiebt
die Regel auf die Tool-Ebene: meldet ein SCHREIBENDER Sub-Agent Erfolg ohne
Artefakt, wird sein Abschluss EINMAL blockiert und er nachweispflichtig.

Geltungsbereich (bewusst eng, False-Positive ist der teurere Fehler):
  - Nur schreibende Klassen lex-bau / lex-daten / lex-mechanisch /
    lex-synthese; deren RÜCKGABE-Schema verlangt seit 14.8.2026 explizit den
    Commit-SHA (dispatch.ts — Gegenprüfungs-Auflage B1: Hook und Schema
    müssen dieselbe Pflicht tragen, sonst mahnt der Hook schema-treue
    Berichte ab). Read-only-Klassen und generische Agenten bleiben unberührt.
  - Nur wenn der Bericht ERFOLG behauptet; verneinte Erfolgswörter («nicht
    erledigt», «unerledigt») und Misserfolgs-Berichte passieren ungehindert
    (§8: Ehrlichkeit wird nie bestraft; Gegenprüfungs-Auflage B2).

Loop-Schutz: SubagentStop liefert in der installierten Binary (2.1.220,
zod-Schema; Gegenprüfungs-Befund B3 — die Web-Doku schwieg dazu) sehr wohl
`stop_hook_active`; folgt dieser Stopp bereits auf einen Block, lassen wir
durch. Die frühere eigene Merkdatei ist damit gestrichen statt bewacht
(§17-Gegengewicht Satz 2).

BEWUSSTE GRENZEN (ehrlich, §8):
  - Greift nur, wo diese settings.json gilt, und nur für lex-*-Dispatches.
  - Ob `agent_type` zur Laufzeit wirklich «lex-bau» etc. trägt, kann nur ein
    Live-Dispatch beweisen (Feld im Binary-Schema vorhanden; Wertquelle nicht
    zurückverfolgt — Gegenprüfung 14.8.2026 «nicht prüfbar»). Leeres Feld ⇒
    stiller No-op; die übrige Logik fror src/tests/hooks-wache.test.ts ein (Test gelöscht 10.10.).
  - Artefakt-Muster sind Heuristik und kontextgebunden (ein SHA zählt nur mit
    «Commit/SHA/HEAD» in der Nähe — Auflage B4), aber fälschbar: der Hook
    erzwingt die FORM des Nachweises; die Orchestrator-Pflicht, gegen
    prüfbare Artefakte zu VERIFIZIEREN (§14.7), bleibt bestehen.

Exit 2 = Abschluss blockieren, stderr geht als Feedback an den Sub-Agenten.
Bei jeder Unsicherheit (kaputtes JSON, fehlende Felder) → Exit 0.
"""
import json
import re
import sys

# Schreibende Klassen: von ihnen verlangt das Rückgabe-Schema den Commit-SHA.
SCHREIBENDE = {"lex-bau", "lex-daten", "lex-mechanisch", "lex-synthese"}

# Erfolg wird behauptet … (Wortgrenzen: «unerledigt» darf nie treffen — B2)
ERFOLG = re.compile(
    r"\b(?:erledigt|fertig(?:gestellt)?|abgeschlossen|umgesetzt|gebaut|"
    r"implementiert|committed|gelandet|erfolgreich|done|completed)\b"
    r"|alle\s+(?:Tore|Tests?|Checks?)\s+(?:sind\s+)?gr[üu]n",
    re.IGNORECASE,
)
# … und zwar unverneint: Fenster vor dem Treffer auf Negation prüfen (B2).
NEGATION = re.compile(r"(?:\bnicht|\bkein\w*|\bnie)\s*(?:\w+\s+){0,2}$", re.IGNORECASE)

# Als Artefakt zählt (§14.7): kontextgebundener Commit-SHA · PR-Nummer/-URL ·
# Tor-/Testausgabe mit Exit-Code oder Zählern. Nackte Zahlen zählen NICHT (B4).
ARTEFAKT = re.compile(
    r"(?:commit|sha|head)\W{0,20}[0-9a-f]{7,40}\b"  # SHA nur mit Kontextwort
    r"|\bPR\s*#?\d+"
    r"|/pull/\d+"
    r"|exit(?:[- ]?code)?\s*[:=]?\s*\d"
    r"|\b\d+\s+passed\b"
    r"|\b\d+\s+Tests?\s+gr[üu]n",
    re.IGNORECASE,
)

# Ausdrückliche Misserfolgs-Marker: solche Berichte nie behelligen (B2-erweitert).
KEIN_ERFOLG = re.compile(
    r"\bblockiert|fehlgeschlagen|gescheitert|unerledigt|abgebrochen|Abbruch\b|"
    r"\brot\b|nicht\s+(?:erfolgt|reproduzierbar|gebaut|umsetzbar|m[öo]glich)|"
    r"nichts\s+ge[äa]ndert|Befund\s+an\s+David|keine\s+Änderung(?:en)?",
    re.IGNORECASE,
)


def erfolg_behauptet(text: str) -> bool:
    """Mindestens EIN unverneinter Erfolgs-Treffer."""
    for m in ERFOLG.finditer(text):
        if not NEGATION.search(text[max(0, m.start() - 32):m.start()]):
            return True
    return False


try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

if data.get("hook_event_name") not in (None, "SubagentStop"):
    sys.exit(0)
if data.get("stop_hook_active"):  # dieser Stopp folgt schon auf einen Block
    sys.exit(0)
if str(data.get("agent_type") or "") not in SCHREIBENDE:
    sys.exit(0)

bericht = str(data.get("last_assistant_message") or "")
if not bericht:
    sys.exit(0)
if KEIN_ERFOLG.search(bericht):
    sys.exit(0)
if not erfolg_behauptet(bericht):
    sys.exit(0)
if ARTEFAKT.search(bericht):
    sys.exit(0)

print(
    "SUBAGENT-WACHE (§14.7): Dein Bericht behauptet Erfolg, enthält aber KEIN "
    "prüfbares Artefakt. Ein Erfolgsbericht ohne Artefakt gilt als nicht "
    "erfolgt.\n\n"
    "  Ergänze im Abschlussbericht mindestens eines:\n"
    "    - Commit-SHA DEINER Arbeit, mit Kontextwort (z. B. «Commit ab12cd3»),\n"
    "    - Tor-/Testausgabe mit Exit-Code (z. B. «npm run gate → exit 0»),\n"
    "    - PR-Nummer, falls einer angelegt wurde.\n"
    "  ODER stelle klar, dass nichts gebaut/geändert wurde (dann ist der "
    "Bericht ein Befund, kein Erfolgsbericht).",
    file=sys.stderr,
)
sys.exit(2)
