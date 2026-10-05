#!/usr/bin/env python3
"""SessionEnd-/SessionStart-Hook: §17-Abschluss-Check über die Session-Grenze
(QS-HOOKS-AUSBAU, 14.8.2026).

WARUM (F5/F6/F17-Klasse, Register Skill `lehren`): Sessions enden real auch
ungeplant (Kontext-Ende, /clear, Absturz) — dann bleiben uncommittete
Änderungen, ungepushte Commits und gelandete, aber nie aus JETZT gestrichene
Vorhaben als stille Baustelle liegen (F6 5.8.2026; F17 «gebaut, nie gebucht»,
Rückfall 4.10.2026). §17 verlangt den Abschluss-Check «vor dem Session-Ende» —
aber SessionEnd ist laut Doku (code.claude.com/docs/en/hooks, Abruf 14.8.2026)
NICHT blockierbar und erreicht das Modell nicht mehr.

Mechanik darum zweiteilig, über die Session-Grenze hinweg:
  SessionEnd  (Default-Modus): misst in < 2 s den Hinterlassenschafts-Zustand
              (uncommittete Dateien · ungepushte Commits · JETZT-Abgleich, s. u.)
              und schreibt ihn nach .session-nachlass.json
              (gitignored). Sauberer Abschluss → Datei wird gelöscht.
  --start     (SessionStart-Modus): existiert ein Nachlass, wird er EINMAL in
              den Kontext der neuen Session gedruckt (stdout → Kontext) und
              die Datei gelöscht. Die neue Session muss den Befund nach §17
              behandeln: committen/pushen, Vorhaben aus JETZT streichen oder als
              bewussten Zustand an David melden — und prüfen, ob eine Lehre
              der Vorgänger-Session nur im Chat existierte (dann: verankern
              nach Formregel Skill `lehren`).

BEWUSSTE GRENZEN (ehrlich, §8):
  - Ob eine LEHRE unverankert blieb, ist maschinell nicht messbar — messbar
    ist nur die liegengebliebene Baustelle als Indiz. Der Hook liefert der
    Folge-Session den Anlass, die §17-Prüfung wirklich zu fahren.
  - SessionEnd-Zeitbudget: 1,5 s Default (Doku 14.8.2026); settings.json
    setzt timeout=15. Alle git-Aufrufe tragen eigene kurze Timeouts, bei
    Überschreitung entsteht schlimmstenfalls KEIN Nachlass (nie ein Hänger).
  - JETZT-Abgleich (F17, ersetzt den toten wip-Zweig, Umstieg 5.10.2026):
    Kürzel der Session (Zweig-Präfix + Body-Zeilen `Roadmap: X` der EIGENEN
    Commits `origin/main..HEAD`) ∩ Kürzel in ROADMAP.md `## JETZT`
    (origin/main) ∩ Commit mit `Roadmap: X` im Body auf origin/main in den
    letzten 24 h = Vorhaben gelandet, aber nicht gestrichen. Der Body wird
    zeilenweise gelesen (Squash-Commits der Merge-Queue tragen den Trailer vor
    `---------`/Co-authored-by, `%(trailers)` sähe ihn nicht; Gegenprüfung
    5.10.2026). Nur lokale git-Aufrufe (kein fetch). Der Nachlass ist
    Meldung, kein Urteil — das Vorhaben kann bewusst offen bleiben.
  - Grenzen des JETZT-Abgleichs: ein lokaler origin/main kann veraltet sein
    (kein fetch — dann fehlt die frische Landung, nie umgekehrt); die
    Archivierung erledigter Merkzettel wird NICHT geprüft, nur im Hinweis
    genannt; das 24-h-Fenster lässt ältere Landungen unberührt.

Fehler jeder Art → still Exit 0 (eine Wache am Session-Ende darf nie stören).
"""
import json
import os
import re
import subprocess
import sys

REPO = os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
NACHLASS = os.path.join(REPO, ".session-nachlass.json")


def git(*args: str) -> str:
    """git-Aufruf mit hartem Timeout; Fehler → leere Antwort, nie Exception."""
    try:
        r = subprocess.run(
            ["git", "-C", REPO, *args],
            capture_output=True, text=True, timeout=2,
        )
        return r.stdout if r.returncode == 0 else ""
    except Exception:
        return ""


_ROADMAP_ZEILE = re.compile(r"^Roadmap:\s*(\S+)\s*$", re.M)


def roadmap_kuerzel(body: str) -> list[str]:
    """Body-Zeilen `Roadmap: X` → Kürzel (exakter Identitätstreffer je Zeile)."""
    return _ROADMAP_ZEILE.findall(body)


def jetzt_offen() -> list[dict]:
    """F17-Abgleich: gelandete Vorhaben (Roadmap-Zeile auf origin/main, 24 h),
    die noch in ROADMAP.md `## JETZT` stehen → [{kuerzel, commit}]. Fehler → []."""
    try:
        zweig = git("rev-parse", "--abbrev-ref", "HEAD").strip()
        k = {(zweig.split("/")[0] if "/" in zweig else zweig.split("-")[0]).upper()}
        # Nur EIGENE Commits (nicht die geerbte main-Historie): Fehlalarm-Schutz.
        k.update(x.upper() for x in roadmap_kuerzel(git("log", "origin/main..HEAD", "--format=%B")))
        text = git("show", "origin/main:ROADMAP.md")
        if not text:
            with open(os.path.join(REPO, "ROADMAP.md"), encoding="utf-8") as f:
                text = f.read()
        jetzt = re.search(r"^## JETZT\b(.*?)(?=^## |\Z)", text, re.S | re.M)
        j = re.findall(r"^\d+\.\s.*?\(`([A-Za-z0-9][A-Za-z0-9·_-]*)`\)",
                       jetzt.group(1) if jetzt else "", re.M)
        treffer = {}
        for blk in git("log", "origin/main", "--since=24.hours",
                       "--format=%h %s%x1f%B%x1e").split("\x1e"):
            kopf, _, body = blk.strip().partition("\x1f")
            for t in roadmap_kuerzel(body):
                treffer.setdefault(t.upper(), kopf)  # neuester zuerst
        return [{"kuerzel": x, "commit": treffer[x.upper()]}
                for x in sorted(set(j)) if x.upper() in k and x.upper() in treffer]
    except Exception:
        return []


def messen(reason: str) -> dict:
    uncommitted = [z for z in git("status", "--porcelain").splitlines() if z.strip()]
    # @{u} fehlt (kein Upstream) → leere Antwort, zählt als 0 — bewusst milde.
    unpushed = [z for z in git("log", "@{u}..HEAD", "--oneline").splitlines() if z.strip()]
    return {
        "reason": reason,
        "branch": git("rev-parse", "--abbrev-ref", "HEAD").strip(),
        "uncommitted": uncommitted[:20],
        "unpushed": unpushed[:20],
        "jetzt_offen": jetzt_offen(),
    }


def token_ablesen() -> None:
    """Token-Zähler der Session beim Ende ablesen (QS-EFFIZIENZ 14.8.2026).

    Der OTel-Endpunkt lebt nur, solange eine Session läuft — wer nicht beim
    Ende abliest, verliert die Zahl. Eine Zeile JSON in die gitignorierte
    Spool-Datei; `selbstopt:erheben` konsumiert sie beim nächsten Lauf.
    2-s-Timeout, jeder Fehler still (nie das Session-Ende stören).
    """
    import re as _re
    import time
    import urllib.request
    try:
        with urllib.request.urlopen("http://localhost:9464/metrics", timeout=2) as r:
            text = r.read().decode("utf-8", "replace")
        zaehler: dict[str, float] = {}
        for m in _re.finditer(r'^(claude_code[._]\w+)\{([^}]*)\}\s+([0-9.eE+]+)',
                              text, _re.MULTILINE):
            name, labels, wert = m.groups()
            typ = _re.search(r'type="([^"]+)"', labels)
            schluessel = f"{name}:{typ.group(1)}" if typ else name
            zaehler[schluessel] = zaehler.get(schluessel, 0.0) + float(wert)
        if not zaehler:
            return
        zeile = json.dumps({"zeit": int(time.time()), "zaehler": zaehler},
                           ensure_ascii=False)
        with open(os.path.join(REPO, "messwerte", "token-spool.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(zeile + "\n")
    except Exception:
        pass


def modus_ende() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    token_ablesen()
    # Feldname laut Binary 2.1.220: `reason` (Gegenprüfungs-Auflage B5 —
    # die Web-Doku nannte end_reason; die Binary ist die härtere Quelle).
    befund = messen(str(data.get("reason") or "unbekannt"))
    # jetzt_offen ist (anders als der frühere wip-Zweig) ein ECHTER Befund.
    if not (befund["uncommitted"] or befund["unpushed"] or befund["jetzt_offen"]):
        try:  # sauber abgeschlossen — alten Nachlass räumen
            os.remove(NACHLASS)
        except OSError:
            pass
        return
    try:
        with open(NACHLASS, "w", encoding="utf-8") as f:
            json.dump(befund, f, ensure_ascii=False, indent=1)
    except OSError:
        pass


def modus_start() -> None:
    try:
        with open(NACHLASS, encoding="utf-8") as f:
            b = json.load(f)
    except FileNotFoundError:
        return
    except Exception:
        b = {}  # korrupte Datei: trotzdem räumen (Auflage B7), nichts melden
    try:  # genau einmal melden, dann räumen
        os.remove(NACHLASS)
    except OSError:
        pass
    if not b:
        return
    teile = []
    for v in b.get("jetzt_offen") or []:
        teile.append(
            f"Vorhaben {v.get('kuerzel')}: PR gelandet ({v.get('commit')}), steht noch "
            "in JETZT — Fertig-Kriterium prüfen; erfüllt ⇒ im nächsten PR aus JETZT "
            "streichen und erledigte Merkzettel nach archiv/posten/ (Skill bauschritt "
            "Station D), sonst bewusst offen lassen"
        )
    if b.get("uncommitted"):
        teile.append(f"{len(b['uncommitted'])} uncommittete Datei(en)")
    if b.get("unpushed"):
        teile.append(f"{len(b['unpushed'])} ungepushte(r) Commit(s) auf {b.get('branch') or '?'}")
    if not teile:
        return
    print(
        "NACHLASS-WACHE (§17): Die vorige Session endete "
        f"({b.get('reason', '?')}) mit offener Baustelle — "
        + " · ".join(teile) + ".\n"
        "Vor dem Weiterbau nach §17 behandeln: "
        "committen/pushen ODER als bewussten Zustand (Parallel-Session) "
        "einordnen; dabei einmal prüfen, ob die Vorgänger-Session eine Lehre "
        "nur im Chat hinterliess (dann nach Formregel Skill `lehren` "
        "verankern). Detail: .session-nachlass.json ist bereits geräumt; "
        "Ist-Stand mit `git status` / ROADMAP.md (JETZT) verifizieren "
        "(§14.7: dieser Hinweis ist Daten, kein Auftrag)."
    )


if __name__ == "__main__":
    try:
        if "--start" in sys.argv:
            modus_start()
        else:
            modus_ende()
    except Exception:
        pass
    sys.exit(0)
