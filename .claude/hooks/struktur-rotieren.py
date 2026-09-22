#!/usr/bin/env python3
"""STRUKTUR.md-Rotation + Re-Akkumulations-Wächter (QS-TOK / FAHRPLAN-TOKEN-OEKONOMIE.md §3 T1).

STRUKTUR.md wird in JEDER Session und jedem Subagenten gelesen (Pflicht-Read). Die
Session-Karten wuchsen trotz Pflegeregel bis 452 KB (§1 Ist-Befund) — die manuelle
Rotation blieb liegen, der bestehende Hook WARNTE nur. T1 mechanisiert das Verschieben:
abgeschlossene Karten (älter als ~2 Arbeitstage) wandern BYTE-GENAU nach
`archiv/STRUKTUR-SESSIONKARTEN.md`; im Kopf bleibt der Verweis-Abschnitt.

LEITPLANKE (§3 T1 R): **verschieben, NIE zusammenfassen** (Zusammenfassen = ~40 %
Retrieval-Verlust). Kein Inhalt geht verloren — Byte-Bilanz beweist Erhalt.

Modi:
  --hook       SessionStart-Verhalten: rotieren + committen NUR im sicheren Kontext
               (K §3 T1: Haupt-Checkout [git-dir == git-common-dir, kein Worktree],
               git-clean, sofort `docs(STRUKTUR…)`-Commit statt WIP — §12.1). Sonst
               reiner No-op. Danach Re-Akkumulations-Wächter als weicher Hinweis
               (blockiert NIE — §3 T1 R «nie blockieren»).
  --write      Rotation ausführen + Dateien schreiben, NICHT committen (manuell/Dogfood;
               Pathspec-Commit macht der Aufrufer). Druckt Byte-Bilanz.
  --dry-run    Rotationsplan + Byte-Bilanz drucken, nichts schreiben.
  --check      Nur Re-Akkumulations-Wächter (T7-K Teil 2). Exit 1, wenn ein
               Steuer-Dokument sein Budget überschreitet (optionaler Riegel; NICHT im
               Required-Gate verdrahtet, damit Parallel-PRs nie blockiert werden).

git nicht verfügbar / Fehler / kein sicherer Kontext → still Exit 0 (nie stören).
"""
import json
import os
import re
import subprocess
import sys
from datetime import date

# Re-Akkumulations-Ceilings (T7-K Teil 2). Bytes. Der Wächter soll ECHTES
# Wieder-Anschwellen fangen (STRUKTUR erreichte einst 452 KB, §1 Ist-Befund) — nicht
# bei jeder Session nörgeln. Darum liegt jedes Ceiling über der gesunden rotierten
# Grundlinie:
#  · STRUKTUR.md 60 KB = §3 T1 DoD; nach der Rotation ~37 KB → Wächter schweigt,
#    meldet erst echtes Re-Anschwellen.
#  · ROADMAP.md 120 KB = NUR WARNUNG (NUR_WARNUNG, Exit 0) seit 18.9.2026, Entscheid David:
#    54 % offene Zeilen, Erledigtes 0,4 KB — vier Überführungen in fünf Tagen kauften je < 3 KB
#    und färbten fremde Läufe rot. Hebel: Befund-Prosa in die Fahrpläne (ROADMAP QS-EFFIZIENZ).
#  · CLAUDE.md 14 KB = Drift-Wächter (QS-AUDIT-VERWEISE 8.8.2026; Audit 7.8.:
#    36 von 38 Commits vergrössern die Datei, Kürzungen in 5–11 Tagen wieder
#    aufgeholt — Drift ist strukturell). Ist beim Setzen: ~11.8 KB / 234 Z.;
#    ~2 KB Luft = Platz für Pflege, Alarm bei neuem Prosa-Anbau. Reisst das
#    Ceiling, ist der Weg NICHT «Ceiling anheben», sondern Regel als Tor/Hook
#    verankern und Prosa in den tragenden Skill (Grundsatz Entscheid David
#    7.8.2026: neue Regeln nur als Tor/Hook, nie als Prosa).
BUDGET = {
    "STRUKTUR.md": 60 * 1024,
    "ROADMAP.md": 120 * 1024,
    "CLAUDE.md": 14 * 1024,
}
NUR_WARNUNG = {"ROADMAP.md"}
# Steuerungs-Deckel (Auftrag David 15.8.2026, «Steuerungszuwachs minimieren, und
# darauf achten, dass es immer so bleibt»): dieselbe Mechanik für FLÄCHEN statt
# Einzeldateien — Summe der Bytes je Glob. Anlass: 15.8. wuchsen Hooks/Wächter
# um ~+240 Zeilen, während Prosa fiel; jede Lehre wurde ein eigener Wächter.
# Reisst ein Flächen-Deckel, ist vor dem nächsten Wächter ein Rückbau fällig
# (Streich-Massstab bauschritt/aufraeumen.md §3, Kandidaten aus `retro:17`
# Regel «nie rot»). Rechtsdaten-Tore (scripts/normtext, scripts/materialien …)
# bleiben AUSSERHALB — Prüftiefe auf Rechtslogik/Rechtsdaten ist vom Rückbau
# ausgenommen (§17-Gegengewicht). Ist 15.8.2026 (nach #516): hooks 71.2 KB ·
# check-*.ts 182.5 KB → Deckel Ist + ~5 %. Rot-Beweis 15.8.: Deckel 60 KB ⇒
# Exit 1 — und der erste CI-Lauf von #529 riss den 182-KB-Deckel real (182.5),
# weil #516 dazwischen landete: der Deckel wirkt.
FLAECHEN_BUDGET = {
    ".claude/hooks/*.py": 76 * 1024,
    # 2.9.2026 QS-VERWENDEN V1: +12 KB für check-lizenzen.ts (neues Tor, Lizenz-Allowlist);
    # Rückbau-Kandidat offen — retro:17 «40 Tore auf Wirksamkeit prüfen»
    # 22.9.2026 #979: +14 KB check-sediment.ts (Nullprobe 0.2 KB Luft); Rückbau-Kandidat gleich
    "scripts/check-*.ts": 218 * 1024,
}
KARTEN_ANKER = "<!-- KARTEN -->"
ARCHIV = "archiv/STRUKTUR-SESSIONKARTEN.md"
# Karten älter als so viele ARBEITSTAGE (Mo–Fr) gegenüber der jüngsten Karte rotieren.
BEHALTE_ARBEITSTAGE = 2
# Budget-getriebene Nachrotation (Fix 4.8.2026, s. FAHRPLAN-TOKEN-OEKONOMIE §Stand):
# auch wenn STRUKTUR.md nach der Alters-Rotation noch über dem Budget liegt, bleiben
# IMMER mindestens so viele Karten stehen — harte Untergrenze, danach nur noch Warnung.
MINDEST_BEHALT = 3
SESSION_RE = re.compile(r"^## Session ", re.MULTILINE)
NICHT_SESSION_H2_RE = re.compile(r"^## (?!Session )", re.MULTILINE)
# Erkennt sowohl Einzel-Datum («## Session 24.7.2026») als auch Doppel-Datum
# («## Session 24./25.7.2026», Tag1./Tag2.Monat.Jahr, gleicher Monat). Bei Doppel-Datum
# ist Gruppe 2 (Tag2) gesetzt — massgeblich ist dann das SPÄTESTE genannte Datum
# (Fix 4.8.2026: vorher matchte die Doppel-Datum-Form gar nicht, Karte blieb
# undatiert und rotierte NIE — Rot-Beweis in FAHRPLAN-TOKEN-OEKONOMIE §Stand).
DATUM_RE = re.compile(r"^## Session (\d{1,2})\.(?:/(\d{1,2})\.)?(\d{1,2})\.(\d{4})")


def repo_dir():
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )


def git(repo, *args, timeout=20):
    return subprocess.run(
        ["git", *args], cwd=repo, capture_output=True, text=True, timeout=timeout
    )


def arbeitstage_abstand(fruehr: date, spaeter: date) -> int:
    """Zahl der Arbeitstage (Mo–Fr), die man von `fruehr` bis `spaeter` vorrückt."""
    if spaeter <= fruehr:
        return 0
    n = 0
    d = fruehr
    while d < spaeter:
        d = date.fromordinal(d.toordinal() + 1)
        if d.weekday() < 5:  # 0=Mo … 4=Fr
            n += 1
    return n


def parse_karten(struktur: str):
    """Zerlegt STRUKTUR.md in (kopf, karten[list[str]], schwanz).

    kopf   = alles bis zur ersten `## Session`-Karte (inkl. evtl. Anker).
    karten = die zusammenhängenden `## Session`-Blöcke, byte-genau (jeder Block
             läuft bis zum nächsten `## Session` bzw. bis zum ersten Nicht-Session-`## `).
    schwanz= Verweis-Abschnitt + Struktur-Sektionen ab dem ersten Nicht-Session-`## `.
    """
    m0 = SESSION_RE.search(struktur)
    if not m0:
        return struktur, [], ""
    erste = m0.start()
    # Schwanz beginnt beim ersten Nicht-Session-`## ` NACH der ersten Karte.
    schwanz_start = len(struktur)
    for m in NICHT_SESSION_H2_RE.finditer(struktur, erste):
        schwanz_start = m.start()
        break
    kopf = struktur[:erste]
    karten_region = struktur[erste:schwanz_start]
    schwanz = struktur[schwanz_start:]
    # karten_region in einzelne `## Session`-Blöcke schneiden (byte-genau).
    grenzen = [m.start() for m in SESSION_RE.finditer(karten_region)]
    karten = []
    for i, g in enumerate(grenzen):
        e = grenzen[i + 1] if i + 1 < len(grenzen) else len(karten_region)
        karten.append(karten_region[g:e])
    return kopf, karten, schwanz


def karten_datum(block: str):
    m = DATUM_RE.match(block)
    if not m:
        return None
    tag1, tag2, monat, jahr = m.groups()
    # Doppel-Datum («24./25.7.2026»): Tag2 ist gesetzt und massgeblich — es ist
    # im gleichen Monat stets das spätere der beiden genannten Daten.
    tag = int(tag2) if tag2 else int(tag1)
    try:
        return date(int(jahr), int(monat), tag)
    except ValueError:
        return None


# Hysterese der Budget-Rotation (QS-PLAN-EINFACH 14.8.2026): Ausgelöst wird bei
# Budget-Riss, geräumt aber bis auf ZIEL_FAKTOR·Budget. Vorher stoppte die
# Rotation beim ersten Byte unter der Marke (real: 49 Byte Luft) — der nächste
# Doku-Commit riss sie erneut, gemessen 3 h 43 min später.
ZIEL_FAKTOR = 0.9


def budget_erweitern(karten, index_datum, rotate_idx, kopf, schwanz, budget):
    """Erweitert `rotate_idx` (Alters-Rotation) um weitere Karten, solange
    STRUKTUR.md nach der Alters-Rotation noch über `budget` liegt; geräumt
    wird dann mit Hysterese bis unter ZIEL_FAKTOR·budget (s. oben).

    Rotiert wird je Schritt die ÄLTESTE verbleibende DATIERTE Karte (Tie-Break bei
    gleichem Datum: die im Dokument am weitesten unten stehende — in der
    newest-first-Kartenregion ist das die chronologisch ERSTE Session jenes Tages,
    sie hält beim Archiv-Prepend die Ordnung kohärent; Befund Gegenprüfung 4.8.2026). Harte Untergrenze MINDEST_BEHALT — danach Abbruch, auch wenn
    das Budget dann gerissen bleibt (der Re-Akkumulations-Wächter warnt weiter).
    Undatierte Karten werden nie angefasst (konservativ, wie bei der Alters-Rotation).
    Deterministisch: gleiche Eingabe → gleiche Auswahl, keine Heuristik.
    """
    rotate_idx = set(rotate_idx)
    # Ziel greift erst, wenn das Budget WIRKLICH gerissen ist — unter der Marke
    # wird nie vorsorglich rotiert (Verhalten unverändert konservativ).
    # ACHTUNG Namensraum: die Schleife unten nutzt `ziel` bereits als
    # Karten-INDEX — das Byte-Ziel heisst darum `ziel_bytes` (Gegenprüfungs-
    # Befund B1, 14.8.2026: der Schatten liess die Rotation bis MINDEST_BEHALT
    # durchlaufen statt bis 90 %).
    rest0 = [i for i in range(len(karten)) if i not in rotate_idx]
    text0 = anker_einfuegen(kopf, [karten[i] for i in rest0]) + schwanz
    ziel_bytes = budget if len(text0.encode("utf-8")) <= budget else int(budget * ZIEL_FAKTOR)
    while True:
        rest_idx = [i for i in range(len(karten)) if i not in rotate_idx]
        if len(rest_idx) <= MINDEST_BEHALT:
            break
        text = anker_einfuegen(kopf, [karten[i] for i in rest_idx]) + schwanz
        if len(text.encode("utf-8")) <= ziel_bytes:
            break
        kandidaten = [(d, i) for i, d in index_datum if d is not None and i not in rotate_idx]
        if not kandidaten:
            break  # nur noch undatierte Karten übrig — konservativ stehen lassen
        aeltestes = min(d for d, _ in kandidaten)
        ziel = max(i for d, i in kandidaten if d == aeltestes)
        rotate_idx.add(ziel)
    return rotate_idx


def plane_rotation(struktur: str, budget: int = None):
    """Gibt (behalten[list], rotieren[list], kopf, schwanz) zurück.

    Rotiert werden zuerst Karten, die > BEHALTE_ARBEITSTAGE gegenüber der jüngsten
    datierten Karte zurückliegen (Alters-Rotation). Karten ohne parsebares Datum
    bleiben (konservativ). Liegt STRUKTUR.md danach noch über `budget`, rotiert
    zusätzlich `budget_erweitern()` — siehe dort.
    """
    if budget is None:
        budget = BUDGET["STRUKTUR.md"]
    kopf, karten, schwanz = parse_karten(struktur)
    index_datum = [(i, karten_datum(k)) for i, k in enumerate(karten)]
    datierte = [d for _, d in index_datum if d]
    if not datierte:
        return karten, [], kopf, schwanz
    referenz = max(datierte)
    rotate_idx = {
        i for i, d in index_datum
        if d and arbeitstage_abstand(d, referenz) > BEHALTE_ARBEITSTAGE
    }
    rotate_idx = budget_erweitern(karten, index_datum, rotate_idx, kopf, schwanz, budget)
    behalten = [k for i, k in enumerate(karten) if i not in rotate_idx]
    rotieren = [k for i, k in enumerate(karten) if i in rotate_idx]
    return behalten, rotieren, kopf, schwanz


def anker_einfuegen(kopf: str, behalten):
    """Setzt den KARTEN-Anker an den Anfang des Kartenblocks (idempotent)."""
    if KARTEN_ANKER in kopf or any(KARTEN_ANKER in b for b in behalten):
        return kopf + "".join(behalten)
    # Kopf endet auf Newline(s); Anker als eigener Absatz vor die erste Karte.
    return kopf + KARTEN_ANKER + "\n\n" + "".join(behalten)


def baue_neues_struktur(struktur: str):
    """(neuer_text, rotierte_blöcke) — oder (None, []) wenn nichts zu tun."""
    behalten, rotieren, kopf, schwanz = plane_rotation(struktur)
    anker_fehlt = KARTEN_ANKER not in kopf and not any(
        KARTEN_ANKER in b for b in behalten
    )
    if not rotieren and not anker_fehlt:
        return None, []
    neu = anker_einfuegen(kopf, behalten) + schwanz
    return neu, rotieren


def archiv_prepend(archiv_text: str, rotierte) -> str:
    """Hängt rotierte Blöcke byte-genau direkt unter den Archiv-Kopf (neueste zuerst)."""
    block = "".join(rotierte)
    m = SESSION_RE.search(archiv_text)
    if not m:
        # Kein bestehender Karten-Block: unter Kopf/Trenner anhängen.
        return archiv_text.rstrip("\n") + "\n\n" + block
    return archiv_text[: m.start()] + block + archiv_text[m.start() :]


# ── Monats-Archiv (QS-PLAN-EINFACH 14.8.2026, Halden-Abbau) ──────────────────
# Die frühere Einzeldatei ARCHIV wuchs auf 791 KB (+12 KB/Tag) ohne Leser.
# Karten wandern jetzt in archiv/struktur-sessionkarten/<JJJJ-MM>.md — der
# Monat kommt aus dem KARTEN-Datum (deterministisch, keine Wanduhr). Die
# Stammdatei ARCHIV trägt nur noch das Verzeichnis (zählerfrei, damit es nie
# veraltet) und allfällige Karten ohne parsebares Datum.
ARCHIV_DIR = "archiv/struktur-sessionkarten"
MONATS_KOPF = "# STRUKTUR-Session-Karten — Archiv {ym}\n\n"
VERZEICHNIS_ANKER = "## Monatliche Archive\n"


def monats_name(block: str):
    d = karten_datum(block)
    return f"{d.year}-{d.month:02d}" if d else None


def verteile_rotierte(repo, rotierte):
    """Schreibt rotierte Karten in ihre Monatsdateien (Prepend, neueste zuerst).

    Gibt die Summe der geschriebenen KARTEN-Bytes zurück (Kopf-/Verzeichnis-
    Bytes neu angelegter Monate zählen nicht — die Byte-Bilanz vergleicht
    Karten gegen Karten). Karten ohne Datum landen im Stammdatei-Abschnitt
    «Karten ohne Datum».
    """
    gruppen: dict = {}
    for b in rotierte:
        gruppen.setdefault(monats_name(b), []).append(b)

    karten_bytes = 0
    for ym, bloecke in gruppen.items():
        if ym is None:
            stamm = lese(repo, ARCHIV)
            block = "".join(bloecke)
            stamm = stamm.replace("## Karten ohne Datum\n\n(keine)\n",
                                  "## Karten ohne Datum\n\n" + block, 1) \
                if "## Karten ohne Datum\n\n(keine)\n" in stamm \
                else stamm.rstrip("\n") + "\n\n" + block
            schreibe(repo, ARCHIV, stamm)
            karten_bytes += len(block.encode("utf-8"))
            continue
        pfad = f"{ARCHIV_DIR}/{ym}.md"
        voll = os.path.join(repo, pfad)
        if os.path.exists(voll):
            alt = lese(repo, pfad)
        else:
            os.makedirs(os.path.join(repo, ARCHIV_DIR), exist_ok=True)
            alt = MONATS_KOPF.format(ym=ym)
            # Neuen Monat ins Verzeichnis der Stammdatei eintragen (oberste Zeile).
            stamm = lese(repo, ARCHIV)
            zeile = f"- [{ym}](struktur-sessionkarten/{ym}.md)\n"
            if zeile not in stamm and VERZEICHNIS_ANKER in stamm:
                stamm = stamm.replace(VERZEICHNIS_ANKER + "\n",
                                      VERZEICHNIS_ANKER + "\n" + zeile, 1)
                schreibe(repo, ARCHIV, stamm)
        neu = archiv_prepend(alt, bloecke)
        schreibe(repo, pfad, neu)
        karten_bytes += sum(len(b.encode("utf-8")) for b in bloecke)
    return karten_bytes


def waechter_meldungen(repo, nur_harte=False):
    """Re-Akkumulations-Wächter (T7-K Teil 2); `nur_harte` lässt NUR_WARNUNG aus."""
    out = []
    for name, budget in BUDGET.items():
        if nur_harte and name in NUR_WARNUNG:
            continue
        p = os.path.join(repo, name)
        try:
            groesse = os.path.getsize(p)
        except OSError:
            continue
        if groesse > budget:
            out.append(
                f"  - {name}: {groesse/1024:.1f} KB > Budget {budget/1024:.0f} KB "
                f"(+{(groesse-budget)/1024:.1f} KB)"
            )
    # Flächen-Deckel: Summe je Glob (*.test.ts zählt nicht — Prüftiefe, kein
    # Steuerungs-Zuwachs).
    import glob as _glob
    for muster, budget in FLAECHEN_BUDGET.items():
        dateien = [f for f in _glob.glob(os.path.join(repo, muster)) if not f.endswith(".test.ts")]
        summe = sum(os.path.getsize(f) for f in dateien)
        if summe > budget:
            out.append(
                f"  - Steuerungs-Fläche {muster}: {summe/1024:.1f} KB > Deckel {budget/1024:.0f} KB "
                f"(+{(summe-budget)/1024:.1f} KB, {len(dateien)} Dateien) — vor dem nächsten "
                f"Wächter einen streichen (retro:17 «nie rot», aufraeumen.md §3)"
            )
    return out


def lese(repo, name):
    with open(os.path.join(repo, name), encoding="utf-8") as f:
        return f.read()


def schreibe(repo, name, text):
    with open(os.path.join(repo, name), "w", encoding="utf-8") as f:
        f.write(text)


def rotiere_und_schreibe(repo, commit: bool):
    """Führt die Rotation aus. Gibt (anzahl_rotiert, byte_bilanz_ok) zurück."""
    struktur = lese(repo, "STRUKTUR.md")
    neu, rotierte = baue_neues_struktur(struktur)
    if neu is None:
        return 0, True
    # Byte-Bilanz: die aus STRUKTUR entfernten Karten-Bytes == die in die
    # Monats-Archive geschriebenen Karten-Bytes (Kopf-/Verzeichnis-Zeilen neu
    # angelegter Monate sind ZUSATZ-Marker, kein Karten-Inhalt).
    entfernt = sum(len(b.encode("utf-8")) for b in rotierte)
    hinzugefuegt = verteile_rotierte(repo, rotierte)
    bilanz_ok = entfernt == hinzugefuegt
    if rotierte and not bilanz_ok:
        raise RuntimeError(
            f"Byte-Bilanz verletzt: entfernt {entfernt} != hinzugefügt {hinzugefuegt}"
        )
    schreibe(repo, "STRUKTUR.md", neu)
    if commit:
        git(repo, "add", "--", "STRUKTUR.md", ARCHIV, ARCHIV_DIR)
        git(
            repo,
            "commit",
            "-m",
            "docs(STRUKTUR): Session-Karten älter ~2 Arbeitstage byte-genau ins "
            "Archiv rotiert (QS-TOK/T1, automatisch)",
        )
    return len(rotierte), bilanz_ok


def sicherer_haupt_checkout(repo) -> bool:
    """K §3 T1: nur Haupt-Checkout (kein Worktree) UND git-clean."""
    try:
        gd = git(repo, "rev-parse", "--git-dir")
        gcd = git(repo, "rev-parse", "--git-common-dir")
        if gd.returncode or gcd.returncode:
            return False
        # Worktrees: git-dir != git-common-dir → No-op.
        if os.path.realpath(os.path.join(repo, gd.stdout.strip())) != os.path.realpath(
            os.path.join(repo, gcd.stdout.strip())
        ):
            return False
        status = git(repo, "status", "--porcelain")
        if status.returncode or status.stdout.strip():
            return False  # nur git-clean
        return True
    except Exception:
        return False


def modus_hook(repo):
    try:
        json.load(sys.stdin)  # SessionStart-Input konsumieren, Inhalt egal
    except Exception:
        pass
    # Rotation nur im sicheren Kontext; jeder Fehler ist still (nie stören).
    try:
        if os.environ.get("LEXMETRIK_NO_ROTATE"):
            pass
        elif sicherer_haupt_checkout(repo):
            rotiere_und_schreibe(repo, commit=True)
    except Exception:
        pass
    # Re-Akkumulations-Wächter: weicher Hinweis, blockiert NIE.
    try:
        meldungen = waechter_meldungen(repo)
    except Exception:
        meldungen = []
    if meldungen:
        hinweis = (
            "⚠️ Steuer-Doku-Budget überschritten (QS-TOK Re-Akkumulations-Wächter):\n"
            + "\n".join(meldungen)
            + "\n\nAbschluss-Prosa gehört DIREKT in die Chronik/ins Archiv "
            "(ROADMAP-CHRONIK.md bzw. archiv/STRUKTUR-SESSIONKARTEN.md), nicht in den "
            "Session-Einstieg. Rotation läuft automatisch nur im sauberen Haupt-Checkout; "
            "hier ggf. `npm run struktur:rotieren -- --write` und Karten/Chronik pflegen."
        )
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "SessionStart",
                        "additionalContext": hinweis,
                    }
                }
            )
        )
    sys.exit(0)


def modus_dry_run(repo):
    struktur = lese(repo, "STRUKTUR.md")
    behalten, rotieren, _, _ = plane_rotation(struktur)
    entfernt = sum(len(b.encode("utf-8")) for b in rotieren)
    print(f"STRUKTUR.md: {len(struktur.encode('utf-8'))/1024:.1f} KB")
    print(f"  Karten gesamt: {len(behalten) + len(rotieren)}")
    print(f"  behalten:      {len(behalten)}")
    print(f"  rotieren:      {len(rotieren)}  ({entfernt/1024:.1f} KB)")
    for b in rotieren:
        kopf = b.splitlines()[0] if b.splitlines() else "?"
        print(f"    → {kopf[:90]}")
    rest = len(struktur.encode("utf-8")) - entfernt
    print(f"  STRUKTUR.md danach: ~{rest/1024:.1f} KB (Budget {BUDGET['STRUKTUR.md']/1024:.0f} KB)")
    sys.exit(0)


def modus_write(repo):
    struktur_vorher = len(lese(repo, "STRUKTUR.md").encode("utf-8"))
    n, ok = rotiere_und_schreibe(repo, commit=False)
    struktur_nachher = len(lese(repo, "STRUKTUR.md").encode("utf-8"))
    print(f"rotiert: {n} Karte(n); Byte-Bilanz {'OK' if ok else 'VERLETZT'}")
    print(
        f"STRUKTUR.md: {struktur_vorher/1024:.1f} KB → {struktur_nachher/1024:.1f} KB "
        f"(Budget {BUDGET['STRUKTUR.md']/1024:.0f} KB)"
    )
    sys.exit(0)


def modus_check(repo):
    harte = waechter_meldungen(repo, nur_harte=True)
    for m in waechter_meldungen(repo):
        if m not in harte:
            print("GELB (nur Warnung, blockiert nicht):\n" + m)
    if harte:
        print("Re-Akkumulations-Wächter ROT:")
        for m in harte:
            print(m)
        sys.exit(1)
    print("Re-Akkumulations-Wächter grün (Steuer-Doks im Budget).")
    sys.exit(0)


def main():
    repo = repo_dir()
    args = sys.argv[1:]
    if "--hook" in args:
        modus_hook(repo)
    elif "--dry-run" in args:
        modus_dry_run(repo)
    elif "--write" in args:
        modus_write(repo)
    elif "--check" in args:
        modus_check(repo)
    else:
        print(__doc__)
        sys.exit(0)


if __name__ == "__main__":
    main()
