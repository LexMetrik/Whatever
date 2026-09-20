# Roadmap/Struktur aufräumen (Referenzdatei des Skills `bauschritt`)

**Laden, wenn** die Steuer-Doku aufgeräumt werden soll — «räum die Roadmap
auf», «Ceiling gerissen», `struktur-rotieren.py --check` rot, «Chronik-
Überführung», «Fahrplan archivieren» — oder wenn der Re-Akkumulations-Wächter
ein Steuerdokument über Budget meldet. Ziel: `ROADMAP.md` bleibt schlank,
Erledigtes zieht wörtlich um (Vorbild `793e9aee3`, 3.8.2026: 117.4→97.7 KB).

**Leitplanke:** diese Datei trägt die Prozedur, keine Zahlen — Ceilings misst
nur `struktur-rotieren.py`; ein Zahlen-Zweitstand veraltet unbemerkt (§5).

*Gestrafft 29.8.2026 (Ritual-Diät): der «zwingende Zweitschritt
`scripts/plan/inventar.ts`» ist ersatzlos entfallen — Inventar-Datei und
check:plan-Regel 1 existieren nach der Steuerungs-Diät nicht mehr.*

## 1 · Ist-Messung

`python3 .claude/hooks/struktur-rotieren.py --check` — einzige Messquelle,
Exit 1 nennt Steuerdokument + Überschreitung; Ceilings stehen im Skript-Kopf
(`BUDGET`-Dict). Ohne Ist-Messung kein Aufräumen (§0.3: Verdacht ≠ Ursache).

**Dazu je Überführung zwei Läufe** (QS-BEWAEHRUNG A, 15.9.2026): `npm run
tor:bewaehrung -- --import-ci` — Einstufung `RÜCKBAU-KANDIDAT` als
Streichkandidat unter QS-EFFIZIENZ in `ROADMAP.md` vermerken, nie direkt
streichen (Chesterton, §3); `npm run prozess:kennzahlen -- --schreiben` —
eine Zeile je Überführung nach `messwerte/prozess-kennzahlen.csv`.

## 2 · Erledigtes wörtlich nach `ROADMAP-CHRONIK.md`

**Geltende Fassung** (ROADMAP Ziff. 6, seit 3.8.2026): ein `done`-Schritt
wandert **vollständig** — Checkbox, `@meta`, Prosa — nach
`ROADMAP-CHRONIK.md`; in `ROADMAP.md` bleibt **nichts** stehen (ältere
Teil-Fassung ist in der Chronik als «abgelöst» archiviert, gilt nicht
mehr). Ausnahme (22.7.2026): **datierte ✅-Teilerfolgs-Prosa aus einem noch
OFFENEN Schritt** wandert ebenfalls wörtlich in die Chronik, im Plan bleibt
ein ✅-Einzeiler + Pointer.

**Befund 20.9.2026 (Deckel-Alarm 130,7 KB): diese Ausnahme wird laufend
NICHT angewandt.** Gemessen am Altstand `0e4999b48`: 63 Schritte, davon nur
**2 × `status: done`** (6,7 KB) — der Deckel war also nicht durch einen
`done`-Stau gerissen, sondern durch **58 ✅-Zeilen Teilerfolgs-Prosa in
OFFENEN Schritten**. Die Ausnahme greift heute erst, wenn der Wächter rot
wird; bis dahin sammelt sich die Masse. Sie gilt **bei jeder Landung**, nicht
erst beim Alarm: wer einen ✅-Teilerfolg in einen offenen Schritt schreibt,
legt den Wortlaut gleich in die Chronik und lässt im Plan den Einzeiler.

**Seit 20.9.2026 (Posten-Modell)** trägt ein offener Schritt gar keine
eingerückte Checklisten-Zeile mehr (`check:plan` 16): die Ausnahme oben betrifft
nur noch ✅-Prosa im Schritt-Rumpf. Unterposten leben je als Datei in
`plan/posten/` und werden mit `plan:posten -- zu <datei> --beleg "…"` geschlossen.

**Ablageort** (`793e9aee3`): neuer datierter Block ans **Dateiende**, z. B.
`# Umschichtung <Datum> — erledigte Schritte aus dem Steuerungsplan`; je
Schritt `## <ID> — <Titel> *(<Status>, verschoben <Datum>)*` + Original-
Wortlaut samt `@meta`. Nicht am Kopf einsortieren — wächst seit 10.7.2026
nur am Ende.

**Nie zusammenfassen** — ~40 % Retrieval-Verlust; die Chronik ist Archiv,
kein Extrakt.

**Regel-Wiedervorlage mitnehmen:** `npm run check:regel-wiedervorlage` laufen
lassen; fällige Regeln als Streichkandidaten in ROADMAP `QS-EFFIZIENZ`
vermerken (Vorschlag — streichen tut David).

**`@meta` LEBENDER Schritte ist unantastbar.** Nur das `@meta` eines
tatsächlich wandernden Schrittes (`done` bzw. ✅-Teilerfolg oben) wird
verschoben; `@meta` eines offenen Schrittes (Status, `dep`, `blocker`,
`feld`, `fahrplan:` — steuert `check:plan`/`plan:next`/Queue) wird nie
verändert oder gelöscht, auch nicht formatierend.

## 3 · Streich-Massstab

**Steuerungs-Deckel (David 15.8.2026, ab 20.9.2026 `check:steuerflaeche`):**
Byte-Summe der GESAMTEN Steuerungs-Fläche gegen `messwerte/steuerflaeche.json`;
die Grenze sinkt nur (`npm run steuerflaeche -- --nachziehen`), Anhebung nur mit
datiertem David-Entscheid. Rot ⇒ streichen, bevor etwas dazukommt; die zehn
grössten Zuwächse nennt das Tor selbst, Stand und Trend die letzte Zeile von
`plan:next`. Rechtsschutz ausgenommen (Liste im Kopf von
`scripts/analyse/steuerflaecheKern.ts`).

Vor jeder Streichung (echtes Entfernen, keine Verschiebung): **«Steuert der
Schritt noch etwas?»** Ein Posten ohne `dep`-/`@queue`-/Blocker-Referenz,
dessen Anlass entfallen ist, fällt. Jede Streichung bekommt in
`ROADMAP-CHRONIK.md` eine **Begründungszeile** (Vorbild «Streichungen
3.8.2026»):

```
- **`<ID>`** — gestrichen <Datum>: <ein Satz Begründung, warum der Anlass
  entfallen ist oder wer den Posten abgelöst hat>.
```

Ohne sie verschwindet ein Posten stillschweigend — der Verlust, den §11
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
Test oder Tor gefangen hat, schreibt der Chronik-/Fehlerbuch-Zeile den FÄNGER
zu («gefangen von `<spec/tor>`»). Ohne Fang-Protokoll bleibt jeder spätere
Rückbau Indizienarbeit — Beleg: Fang-Historie 31.8.2026, genau EIN belegter
e2e-Fang in 116 Specs (`bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md`).

## 4 · Fahrplan-Archivierung — verify-then-archive

`check:plan` koppelt **Regel 7** (jede `FAHRPLAN-*.md` unter `fahrplaene/`
muss aus `ROADMAP.md` verlinkt sein) und **Regel 9** (jeder `fahrplan:`-Zeiger
muss auf eine existierende Datei zeigen). Darum in dieser Reihenfolge:

1. **Verify.** `grep -rn <Basename> ROADMAP.md fahrplaene/ bibliothek/ docs/ *.md`
   — kein lebender Zeiger mehr? Nur dann weiter. Treffer ausserhalb der
   Steuer-Doku auf `archiv/…` umschreiben, `check:bibliothek` lokal grün VOR
   dem Push (Doku-Pushes laufen an der CI vorbei — Beleg 7.8.2026,
   `2a890c50d`). **Nicht** gegen `ROADMAP-CHRONIK.md` grepen (Regel 7/9 lesen
   die Chronik nicht).
2. **Archive.** `git mv fahrplaene/FAHRPLAN-X.md archiv/`. Bleibt ein Schritt
   aktiv trotz archiviertem Fahrplan, den Zeiger auf `archiv/…` umschreiben
   (Regel 9 prüft nur Existenz, nicht den Ort) und sichtbar markieren, dass
   Restpunkte noch zu extrahieren sind.

**§-Diät lebender Fahrpläne (BAUPLAN-UMBAU 15.8.2026):** erledigte §§ wandern
wörtlich nach `archiv/<FAHRPLAN-NAME>-erledigt.md` (datierter Block ans
Dateiende, nie zusammenfassen); im Fahrplan bleibt je § die Stub-Zeile
`## §N — <Titel> ✅ (erledigt <Datum>, Wortlaut: archiv/…)`, damit Regel 11
(Spec-Bindung) und §-Verweise weiter auflösen.

## 5 · Tor-Reihenfolge

1. `npm run check:plan`
2. `python3 .claude/hooks/struktur-rotieren.py --check`
3. Plan-Tests (`vitest` auf `src/tests/plan-*.test.ts` + `fahrplanSlice`)

**Bündelungsgrund:** Chronik-Überführung, Streichung, Fahrplan-Archivierung
in **einem** Commit — Regel 9/7 sind mechanisch gekoppelt, kein Tor liest die
Chronik; ein Zwischenstand wäre rot.

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
