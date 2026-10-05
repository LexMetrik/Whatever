# Roadmap/Struktur aufräumen (Referenzdatei des Skills `bauschritt`)

**Laden, wenn** die Steuer-Doku aufgeräumt werden soll — «räum die Roadmap
auf», «Ceiling gerissen», `struktur-rotieren.py --check` rot — oder wenn der
Re-Akkumulations-Wächter ein Steuerdokument über Budget meldet. Ziel:
`ROADMAP.md` bleibt schlank (ZIEL · JETZT · EINGANG).

**Leitplanke:** diese Datei trägt die Prozedur, keine Zahlen — Ceilings misst
nur `struktur-rotieren.py`; ein Zahlen-Zweitstand veraltet unbemerkt (§5).

*Gestrafft 5.10.2026 (Umstieg, Planwerkzeug abgebaut): Chronik-Überführung
(§2), Fahrplan-Archivierung (§4) und die Plan-Tor-Reihenfolge (§5) entfallen;
die Nummern bleiben, damit Verweise (`struktur-rotieren.py` → §3) auflösen.*

## 1 · Ist-Messung

`python3 .claude/hooks/struktur-rotieren.py --check` — einzige Messquelle,
Exit 1 nennt Steuerdokument + Überschreitung; Ceilings stehen im Skript-Kopf
(`BUDGET`-Dict). Ohne Ist-Messung kein Aufräumen (§0.3: Verdacht ≠ Ursache).

**Dazu je Aufräum-Runde zwei Läufe** (QS-BEWAEHRUNG A, 15.9.2026): `npm run
tor:bewaehrung -- --import-ci` — Einstufung `RÜCKBAU-KANDIDAT` als
EINGANG-Zeile in `ROADMAP.md` vermerken, nie direkt streichen (Chesterton,
§3); `npm run prozess:kennzahlen -- --schreiben` — eine Zeile je Runde nach
`messwerte/prozess-kennzahlen.csv`. Ebenso `npm run check:regel-wiedervorlage`:
fällige Regeln als EINGANG-Zeile vermerken (Vorschlag — streichen tut David).

## 2 · (entfallen 5.10.2026 — Chronik-Überführung; Chronik eingefroren)

## 3 · Streich-Massstab

**Steuerungs-Deckel (David 15.8.2026):** `check:steuerdeckel` (Kette + CI)
misst neben STRUKTUR/ROADMAP/CLAUDE auch `.claude/hooks/*.py` und
`scripts/check-*.ts` gegen Byte-Budgets (`FLAECHEN_BUDGET` in
`struktur-rotieren.py`). Rot ⇒ vor dem nächsten Wächter einen streichen;
Kandidaten liefert `npm run tor:bewaehrung` (Regel «nie rot ≥ 90 Tage»,
Chesterton-Vorbehalt dort — Nachfolger des entfallenen `retro:17`, Entscheid
David 20.9.2026, Rückbau QS-EFFIZIENZ). Rechtsdaten-Tore sind ausgenommen.

**Sperrklinke über die gesamte Steuerungs-Fläche (David 20.9.2026,
`check:steuerflaeche`):** Byte-Summe der GESAMTEN Steuerungs-Fläche
gegen `messwerte/steuerflaeche.json`; die Grenze sinkt nur (`npm run
steuerflaeche -- --nachziehen`), Anhebung nur mit datiertem David-Entscheid.
Rot ⇒ streichen, bevor etwas dazukommt; die zehn grössten Zuwächse nennt das
Tor selbst, Stand `npm run steuerflaeche -- --stand`. Rechtsschutz
ausgenommen (Liste im Kopf von `scripts/analyse/steuerflaecheKern.ts`).

Vor jeder Streichung (echtes Entfernen, keine Verschiebung): **«Steuert der
Eintrag noch etwas?»** Ein Eintrag ohne Bezug in JETZT/EINGANG, dessen
Anlass entfallen ist, fällt. Jede Streichung bekommt im Commit-Text eine
**Begründungszeile** (Vorbild «Streichungen 3.8.2026», bis 5.10.2026 in
`ROADMAP-CHRONIK.md`):

```
- **`<ID>`** — gestrichen <Datum>: <ein Satz Begründung, warum der Anlass
  entfallen ist oder wer den Eintrag abgelöst hat>.
```

Ohne sie verschwindet ein Eintrag stillschweigend — der Verlust, den §11
verhindern soll.

**Für CODE gilt derselbe Massstab in beweisbarer Form (Auftrag David
14.8.2026, «was keine Fehlfunktion auslöst, kann weg» — präzisiert, weil
unbeobachtet ≠ unbenutzt):** Eine Zeile/Datei darf weg, wenn der NACHWEIS des
Nichttragens VOR der Löschung steht — (a) keine eingehenden Verweise
(Sweep-Guards unten, `git ls-files`-Bestand), (b) alle Tore grün UND golden
byte-gleich nach dem Entfernen, (c) bei Rechtslogik zusätzlich §1-Blick:
trägt die Stelle einen ungetesteten Rechtsfall, fällt sie NICHT. Beweis vor
Löschung, nie löschen-und-schauen.

**Fang-Vermerk-Pflicht (Anlass 31.8.2026):** Wer einen Defekt fixt, den ein
Test oder Tor gefangen hat, schreibt der Commit-/Fehlerbuch-Zeile den FÄNGER
zu («gefangen von `<spec/tor>`»). Ohne Fang-Protokoll bleibt jeder spätere
Rückbau Indizienarbeit — Beleg: Fang-Historie 31.8.2026, genau EIN belegter
e2e-Fang in 116 Specs (`bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md`).

## 4 · (entfallen 5.10.2026 — Fahrplan-Archivierung; Fahrpläne eingefroren)

## 5 · (entfallen 5.10.2026 — Plan-Tor-Reihenfolge; `check:plan` abgebaut)

## Verwaisungs-Sweep — vier Guards (Lehren 14.8.2026, QS-EFFIZIENZ)

1. Nur **`git ls-files`-Bestand** ist Kandidat (Beinahe-Fall COWORK.md).
2. **Backlink-Suche ohne Verzeichnis-Ausschluss** — `archiv/`-Treffer als «nur
   historisch» ausweisen, nicht verschweigen.
3. **`*.test.ts` ist nie verwaist** (Vitest-Autodiscovery); Dateien mit
   dokumentierter `vite-node <pfad>`-CLI im Kopf sind Werkzeuge — ausfiltern.
4. **Löschen erst nach unabhängigem Guard** im ausführenden Auftrag
   (Basisnamen-Gegensuche vor jedem `git rm`) — der Sweep ist Verdacht.

## Nachbar-Instrumente · Wann NICHT

- **`lehren`** — ein wiederkehrendes Prozessproblem gehört ins Register dort,
  nicht als Prosa hierher. **`landung`** — nie mitten in eine fremde, laufende
  Landekette aufräumen (§12 gilt auch für Steuer-Doku). **`auftrag`** Ziff. 1 —
  Root-Markdown-Deckel (~20 Dateien) ist eine eigene Grenze.
- Nicht mid-Kampagne an `CLAUDE.md`; nicht in einer Kollisionsfläche mit
  paralleler Session (drei Sonden, §0.5); nicht ohne Ist-Messung (Schritt 1).
