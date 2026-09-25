---
name: korpus-werkstatt
description: "Verwenden bei «neuen Bundeserlass/Kantonserlass hinzufügen», «Erlass/Snapshot aktualisieren», «verifizier den Erlass X», «stimmt der Anker/Stand?», «Render-Bug / falsches «aufgehoben» / Tausendertrenner / text-indent / zerrissene Abkürzung», «Rechtsprechungs-Korpus erweitern», «BGE-Leitentscheid», «Snapshot generieren», «review / prüf das», «prüf und lande die Rechtsprechung» (Wochen-Nachzug) — Content-Produktion + Verifikation für die Lexmetrik-Korpora Normtext (Gesetze) und Rechtsprechung (Urteile): Erlass/Entscheid extrahieren, mit Norm+Link+Stand belegen, Render/Extraktion prüfen."
---

# Korpus-Werkstatt LexMetrik (Normtext + Rechtsprechung)

Die Orchestrierungs- und Verifikations-Schicht VOR Abnahme und Deploy: einen
neuen Erlass/Entscheid extrahieren, jeden Wert mit Norm+Link+Stand belegen,
Render und Extraktion adversarial prüfen. Sie übernimmt weder das §9-Deploy-Tor
(→ `landung`) noch die fachliche Abnahme (→ `abnahme`), sondern bringt den
Korpus prüffertig bis zu deren Eingang.

Dieser Skill wird **selten** aufgerufen — er setzt darum nichts voraus und
verweist auf die Single Source of Truth, statt sie zu kopieren (§5).

## So ist dieser Skill aufgebaut (Progressive Disclosure)

Drei Schichten, bewusst getrennt:

- **`methodology/`** — *was + warum* (fachliche Reihenfolge je Korpus):
  `normtext.md` (Bund + Kanton), `rechtsprechung.md`.
- **`tools/`** — *wie* (Befehle, JSON-Schema, Editier-Stellen):
  `normtext-pipeline.md`, `rechtsprechung-pipeline.md`, `verifikation.md`.
- **`review.md`** — der user-getriggerte adversariale Zusatz-Audit (Bugklassen),
  nie automatisch (= der «Zusatz-Pass» aus ‹Verifikation — zwei Pässe›).

**Eine `tools/`-Datei erst beim jeweiligen Schritt in den Kontext ziehen, nicht
alle vorab** — sonst lädt dieser selten genutzte Skill seinen ganzen
Mechanik-Ballast vorsorglich.

## Klassifizieren und routen

Die **Aufgabe** ist die Weiche, nicht der Inhaltstyp allein. Für «verifizieren»
und «Render-Bug fixen» ist `methodology` der FALSCHE Zweig — diese überspringen
die Produktions-Pipeline.

| Inhaltstyp | **neu produzieren** | **bestehendes verifizieren** | **Render-Bug fixen** |
|---|---|---|---|
| Normtext-Bund | `methodology/normtext.md` → `tools/normtext-pipeline.md` → nach Produktion `review.md` | `review.md` + `tools/verifikation.md` (Pipeline/methodology überspringen) | `tools/verifikation.md` (Playwright/Screenshots via Bash) + zugehörige `review.md`-Bugklasse (methodology überspringen) |
| Normtext-Kanton | `methodology/normtext.md` (Kanton-Spur) → `tools/normtext-pipeline.md` (Kanton-Tor-Block) → `review.md` | `review.md` + `tools/verifikation.md` | `tools/verifikation.md` + `review.md`-Bugklasse |
| Rechtsprechung | `methodology/rechtsprechung.md` → `tools/rechtsprechung-pipeline.md` → `review.md` | `review.md` + `tools/verifikation.md` | `tools/verifikation.md` + `review.md`-Bugklasse |

## Zielgerichtet vs. offen — «Stop early»

Die methodology-Dateien geben eine **Default-Reihenfolge für offene Aufgaben**.
Eine **gezielte** Anfrage springt direkt zum relevanten Schritt — «verifizier
Art. 335c OR» → `review.md`; «Render-Bug: Tausendertrenner in DBG» →
`tools/verifikation.md` + passende `review.md`-Bugklasse; «BGE-Leitentscheid zu
X» → `methodology/rechtsprechung.md`, Zweig BGE-Leitentscheide. Den vollen
Ablauf nur bei wirklich offener Aufgabe fahren; Stop, sobald das Nötige
erreicht ist.

## Disambiguierung (EINE Rückfrage bei Unklarheit)

Ist der **Inhaltstyp** (Bund / Kanton / welcher Kanton / Rechtsprechung) **oder**
die **Aufgabe** (produzieren / verifizieren / Render-Bug) nicht eindeutig aus dem
Auftrag ableitbar → **eine** gezielte Rückfrage, bevor in methodology/tools
geroutet wird: eine Fehlroute riskiert verifizierte Kantons-Snapshots (vgl.
`--nur=bund`, §2) und ist teurer als die Rückfrage.

## Grenzen (kein Duplikat — nur Verweise)

- **Dach:** `CLAUDE.md` §2 (Determinismus), §5 (Single Source of Truth), §7
  (Kernsatz + Zitat-Ausnahme (a)–(d); die Build-Regeln stehen seit 25.7.2026
  **in diesem Skill**), §8 (Status/Ehrlichkeit), §11 (Wissensablage);
  §14.4/§14.5 im Skill `auftrag`.
- **Bibliotheks-Standards:** `bibliothek/STANDARDS.md` — **S2**
  (Status-Vokabular, koppelt an `verifiziert`/«geprüft»), **S5**
  (Negativbefunde), **S6** (Datiertes ins Verfallsregister), **S8**
  (Korrektur-Protokoll).
- **Übergabe:** Release → Skill `landung`. Fachliche Abnahme → Skill `abnahme`.
- **Nicht-Ziele:** kein Endnutzer-Feature, keine LLM-Schicht in der App (§2);
  keine Tarife/Vorlagen; keine Fremd-/Sekundärliteratur (Art. 5 URG);
  zustandslos.

## Eiserne Regeln

- **Snapshots nie von Hand editieren** — nur über den Generator
  (`npm run normtext …` bzw. `npm run entscheide …`); Build-Regel §7.
- **Datum immer aus der Shell:** `--datum=$(date +%F)` (§2 Determinismus, kein
  `Date.now()`/kein abgetipptes Datum).
- **`verifiziert`/«geprüft»/`verified:true` nie automatisch** — das setzt Davids
  fachliche Abnahme voraus (§7/§8, Zeitsperre bis 1.12.2026); Hebung nur über den
  Skill `abnahme`.
- **Jeder Rechtswert mit Norm + Link + Stand** (§13 D1, verzahnt mit §7).
- **Nur amtliche / URG-freie Quellen** (Art. 5 URG, S3): Fedlex (Bund), kantonale
  Erlasssammlungen via API, amtliche Gerichts-/Behördenseiten — keine Kommentare.
- **Mutationsproben auf generierten Artefakten erst NACH dem Commit der
  Regeneration fahren — und nie mit `git checkout <datei>` zurücksetzen**
  (das stellt den ALTEN committeten Stand her und vernichtet die uncommittete
  Regeneration; Beleg 31.8.2026, ZH-Fix-Runde 2: kostete einen vollen
  zweiten Generatorlauf). Rücksetzen der Probe = Regenerat aus Sicherungs-
  kopie zurückkopieren oder neu generieren.

## §7 · Quell-Wahl und Build-Regeln Norm-Snapshots (wohnen hier)

Seit dem A4-Umzug (25.7.2026) stehen die §7-Build-Regeln in diesem Skill;
`CLAUDE.md` §7 trägt weiterhin den Kernsatz («verifizieren, nicht vertrauen»)
und die Zitat-Ausnahme (a)–(d), weil beides Invarianten sind.

**Quell-Wahl zuerst.** Vor jeder Datenextraktion aus einer amtlichen Quelle
**empirisch erheben, welches Format oder welcher Endpunkt das Ziel technisch am
besten erreicht** — strukturiertes Schema > gerendertes HTML > PDF; an die
**höchste verfügbare Struktur** andocken, nicht reflexhaft die naheliegende
Quelle nehmen. Probe-Fetch je Kandidat, Inhalt prüfen (Soft-404-Shells
erkennen — **Falle 19.9.2026:** der Fedlex-Filestore antwortet auf ein
fehlendes Berichtigungs-Dokument mit HTTP 200 + Angular-Shell
(`<title>Casemates</title>`) statt 404; ohne Content-Type-/`%PDF`-/
`<!DOCTYPE`-Prüfung landet die Shell als «Dokument» im Cache). **Aber:** ein Quell- oder Formatwechsel wird per Messung (POC,
Differenz) belegt, nie angenommen — Fehler sitzen oft in der eigenen
Transformation, nicht in der Quelle. Wechsel inkrementell, nie Big-Bang.
Beispiel und Detail: Memory `extraktion-amtliche-quellen-beste-option`,
`fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md §Quell-Architektur-Entscheid` (Fedlex-HTML
vs. Akoma-Ntoso-XML).

**Die sechs Build-Regeln.** Die Volltext-Snapshots (`public/normtext/`) werden
ausschliesslich vom Generator erzeugt
(`npm run normtext -- --datum=$(date +%F)`), nie von Hand editiert. Jede neue
Quelle folgt zwingend diesem Muster:

1. **Vollabdeckung** — ALLE Artikel je Erlass extrahieren (Bund: jedes
   `<article id="art_*">` der gepinnten Fedlex-Konsolidierung; Kanton: jeder
   Artikel des LexWork-Erlasses), nicht nur die zitierten.
2. **Aufzählungen vollständig** — lit. und Ziff. als `items` je Absatz; nichts
   abschneiden, sonst wirkt die Bestimmung unvollständig.
3. **Immer die GELTENDE Fassung** — Bund über die gepinnte, als aktuell
   verifizierte Konsolidierung (`scripts/fedlex-cache.sh` +
   `check:fedlex-versionen`); Kanton über `current_version` der LexWork-API
   (`version_uid` als Drift-Token). Künftige, noch nicht in Kraft stehende
   Fassungen werden NICHT verlinkt.
4. **Provenienz je Eintrag** — `stand` (In-Kraft-Datum), `quelleUrl`,
   `fassungsToken`, `sha` über Text und items; deckt die Zitat-Ausnahme
   (a)–(d) aus `CLAUDE.md` §7.
5. **Drift-Tor** — `check:normtext` (offline) und `check:normtext-netz` (live
   version_uid/Konsolidierung) müssen grün sein; im `gate` und `check:netz`
   verdrahtet. Neue Quellen ergänzen einen **browserlosen** Adapter (Fetch +
   strukturierte Extraktion + Drift-Token) — kein Headless-Browser, kein
   Scraping pro Kanton.
6. **DB-Artefakt als kanonische Zwischenschicht** — `public/*.json` und die
   prerenderten Seiten dürfen deterministische Projektion aus
   `daten/lexmetrik.db` sein. `check:paritaet` beweist die Projektion
   byte-gleich; die Drift-Tore aus Regel 5 bleiben Arbiter gegen die amtliche
   Quelle. Massgeblich ist immer die amtliche Fassung, nie das Artefakt
   (`CLAUDE.md` §5). Bedingungen im Detail: `fahrplaene/FAHRPLAN-DATENHALTUNG.md`.

Quellen-Priorität und PDF-Extraktionsregeln im Detail:
`bibliothek/normen/norm-vorschau-snapshot-system.md`.

## Verifikation — zwei Pässe, sauber getrennt

- **Pflicht-Pass (§14.4):** Nach **jeder** Extraktions-Produktion auf einem
  Risiko-Pfad ist die adversariale Gegenprüfung **verpflichtend**, nicht auf
  Abruf. Das Tor `check:gegenpruefung` erzwingt sie über `istRisikoPfad()`
  (`scripts/gegenpruefung/kern.ts`): Normtext-Pfade und der Entscheid-Generator
  `scripts/normtext-entscheide.ts` sind Risiko-Pfade, die reinen
  Entscheid-Outputs `public/rechtsprechung/**` NICHT — dort greift das Tor
  nicht, die Pflicht-Gegenprüfung wird dennoch gefahren und im §14.5-Trailer
  quittiert. Beweismittel und Werkzeugkasten: `tools/verifikation.md`.
- **Zusatz-Pass (on-demand):** Davon getrennt der **user-getriggerte**
  `review.md`-Audit («prüf das», «stimmt das?», «review»). Das ist **nicht** der
  §14.4-Pflicht-Pass, sondern ein zusätzlicher Audit — nie automatisch starten.

## Wochen-Nachzug prüfen und landen («prüf und lande die Rechtsprechung»)

Montags öffnet `rechtsprechung-wochenlauf.yml` EINEN PR `auto/rechtsprechung-*`
(Entscheid David 25.9.2026: «Vorbereiten, Prüfung vor Live», kein Auto-Merge).
Body = Bericht aus `scripts/rechtsprechung/wochenlauf.ts`: Zahlen je Gericht,
Ausfälle, Befunde der Guards, BS-Takedowns/-Aktualisierungen, Tore (npm test,
npm run check, Build, perf-budget, Korpus-e2e — wie merge_group), Budget,
Frische je Gericht, Stichprobe (auch PDF). Am 3. des Monats statt dessen der
BS-Vollabgleich (Inhalts-Hash aller BS-Dokumente). Ein offener, unberührter
Auto-PR wird fortgeführt (main eingemergt, Vorwoche bleibt), nie dupliziert.
Signale: ENTWURF ⇒ Draft + `::warning::` + Summary-Kopf «ENTWURF — ROT»,
Lauf grün (Exit 0); Exit 1 nur bei Absturz oder kein Diff mit Quellen-Ausfall
(Wächter-Issue). Ohne Risiko-Datei im Diff (public/rechtsprechung/** allein
sperrt nicht) ⇒ Entwurf, weil check:merge-schutz dann nicht sperrte.

0. **In Prüfung nehmen:** Label `in-pruefung` setzen (oder kommentieren/
   committen) — der nächste Lauf überschreibt den PR dann nicht, er setzt aus
   (das Label legt der Lauf selbst an).
1. PR lesen. ENTWURF = etwas war rot (Grund im Kopf) — erst beheben, dann weiter.
   «Kalendergebunden» (check:verfall u. a.) trifft auch main: dort fixen.
   Offene Befunde stehen im Kommentar-Block `wochenlauf-befunde` des Bodys;
   der nächste Lauf prüft sie zwingend erneut und hebt den Entwurf erst auf,
   wenn jeder erneut grün ist. Von Hand quittieren = Eintrag aus dem Block
   streichen (mit Begründung im PR). BE ist wie SG/AG/GR ausgenommen (Datum
   aus OCL unzuverlässig, `AUSGENOMMEN` in wochenlauf-kern.ts).
2. Pflicht-Gegenprüfung (Skill `gegenpruefung`, Prüfer ≠ Bau-Modell) mit den
   Linsen aus «Verifikation» oben, dazu **normKeys inhaltlich** (Remap-Zuwachs
   an Stichproben gegen den Entscheidtext, Lehre #1099). Die Auto-Stichprobe
   ersetzt die blinde Stichprobe nicht; «nicht prüfbar» von Hand.
3. Quittung `npm run gegenpruefung:ok` (Register), Verdikt-Commit auf den Zweig.
4. Im PR-Body die Zeile `Gegenpruefung: ausstehend …` durch das Verdikt
   ersetzen — sonst bleibt `check:merge-schutz` rot (Queue-Squash liest den Body).
5. Zahl-Pins in Tests/e2e, die am Zuwachs reissen, als eigenen `test(`-Commit
   nachziehen; dann einreihen per Skill `landung`.

## Optionaler Zweitblick (Diskrepanz-Finder)

Zusätzlich zum Pflicht-Pass — nicht statt ihm. Bei einem **neuen oder
aktualisierten Bund-Erlass** gleicht `scripts/analyse/gemini-diskrepanz.ts`
den amtlichen Fedlex-Text gegen unseren Snapshot ab. Der Wert liegt in der
Unabhängigkeit: ein zweiter, eigenständiger Parser sieht einen Bug, den der
eigene Extraktor sich selbst nicht zeigt.

**Vorbedingung:** `agy` 1.1.24 angemeldet (`agy models`), Permissions global
gesetzt (David), Fedlex-Pin vorhanden; Bash-Timeout ≥ `--print-timeout` + 30 s;
`--effort low|high` (medium gibt es nicht); bei Sperre/Timeout: kleineres
`--artikel`-Fenster, später erneut — nie `--dangerously-skip-permissions`.

```
bash scripts/fedlex-cache.sh                            # Pin-Cache füllen (einmalig/aktuell halten)
npx vite-node scripts/analyse/gemini-diskrepanz.ts bund/<ERLASS> --nur-diff        # Schritt 1, kostenlos
npx vite-node scripts/analyse/gemini-diskrepanz.ts bund/<ERLASS> [--artikel N-M] [--effort low|high] [--kontext N] [--out pfad]
```

**Zwei Schritte, in dieser Reihenfolge — der Diff kommt zuerst.**

1. **Deterministisch (Schritt 1, kostenlos).** Ein String-Diff über beide
   Klartext-Reduktionen listet jede Abweichung mit Artikel, Zeile, «Quelle
   sagt», «Snapshot sagt». Reproduzierbar, modellunabhängig, ohne Netz —
   **das ist der Beleg.** Mit `--nur-diff` bekommst du ihn allein; in vielen
   Fällen ist danach schon alles klar und es braucht keinen Modell-Lauf.
2. **Gemini (Schritt 2, optional).** Nur die Artikel MIT Differenz (plus
   `--kontext` Nachbarn, Default ±1) gehen an das Modell, und zwar für die
   eine Frage, die ein Diff nicht beantwortet: was die Abweichung *bedeutet*
   (drop/leak/tabelle/bister/zahl/sonst). Kein Artikel ohne Differenz kostet
   Tokens.

**Warum nicht umgekehrt.** Die erste Fassung liess Gemini alle Artikel lesen
und die Abweichungen selbst suchen. Der AMBV-Pilot vom 4.9.2026 hat das
widerlegt: der Diff fand 5 echte Snapshot-Defekte (zerrissene Wörter,
Leerzeichen vor Satzzeichen), Gemini bei `--effort high` **null davon** — und
brauchte dafür >600 s je Gruppe. Zeichengenauer Abgleich ist genau das, was
ein Sprachmodell am schlechtesten kann und ein Diff perfekt. Seitdem macht
jedes Werkzeug das, worin es gut ist.

- **Verdachtsliste, nie Beleg (§14.7).** Das gilt für **Teil 2** des Berichts.
  Gemini hat nachweislich Taten behauptet, die nicht stattfanden
  (FAHRPLAN-FREMDAGENTEN §4); jede Klassierung gehört von Hand oder in der
  Gegenprüfungs-Session gegen die amtliche Quelle geprüft, bevor sie «Befund»
  heisst. Auch das Feld `modell` ist nur eine **Selbstauskunft** — es belegt
  nicht, welches Modell wirklich antwortete. Teil 1 ist demgegenüber ein
  echter Beleg: er ist nachrechenbar.
- **Sichtwerkzeug, kein Tor.** Exit 0 bei technisch gelungenem Lauf,
  unabhängig vom Fundinhalt; nicht in CI. Exit 2 heisst falsch aufgerufen,
  Exit 1 Abbruch vor dem ersten Lauf, Exit 3 heisst Kontingent gesperrt
  (Musterprüfung `scripts/analyse/agy-status.ts`, Fahrplan §4 «Limite
  erkennen») — dann zurück an Claude statt Fehlersuche.
- **Mindestens zwei Läufe, nur Konsens zählt.** Ein Fund gilt nur, wenn er in
  **allen** `agy`-Läufen auftaucht (gleicher Artikel, gleiche Klasse,
  überlappender Text). `--laeufe 1` wird abgelehnt: ohne Konsens ist das
  Verfahren keins.
- **Denkstufe: `--effort low` ist der Default, und das ist Absicht.** Die
  Stufe steckt bei `agy` im Modellnamen (`gemini-3.1-pro-low|-high`); eine
  Medium-Stufe gibt es bei Gemini 3.1 Pro nicht. `high` lieferte im Pilot
  keinen Mehrwert, aber Laufzeiten über 600 s — `--effort high` also nur
  gezielt, wenn `low` bei einer konkreten Gruppe unschlüssig bleibt.
- **Kosten.** Durch den Erstfilter hängen sie an der Zahl der ABWEICHENDEN
  Artikel, nicht an der Erlassgrösse: ein sauberer Erlass kostet null (Schritt
  2 entfällt ganz). Grundlast je Gruppe/Lauf ~15–40k Tokens (T2-Messung,
  `scratchpad/t2-recall/ERGEBNIS.md`); Gruppenbudget ~90k Zeichen, begrenzt
  durch die Linux-Grenze für ein einzelnes Kommandozeilen-Argument.
- Voraussetzung ist ein gepinnter Fedlex-Cache (`scripts/fedlex-cache.sh`) —
  das Skript lädt **nicht live** und bricht bei fehlendem Pin/Cache mit
  Hinweis ab.
- **Bekannte Restklassen** (bewusst nicht weggeraten, §7): eine reine
  Spalten-Verschiebung innerhalb einer Tabelle bleibt unsichtbar, weil der
  Vergleich Zellinhalte ohne Zellgrenzen prüft; und wo die amtliche Quelle
  eine Verschachtelung strukturell gar nicht ausdrückt (Aufzählung, die durch
  eine eingeschobene Formel-Grafik zerteilt wird — DBG Art. 22), meldet der
  Diff einen Versatz, den unser Snapshot korrekt aufgelöst hat.

Funde als `- [ ]`-Kleinbefund unter den Korpus-Dach-Schritt (`QS-KORPUS`), nie
ins Fehlerbuch (Risikopfad).

## Definition of Done (§14.4/§14.5 — am Produktionsabschluss abhaken)

Wortlaut von §14.4/§14.5 seit 25.7.2026 im Skill `auftrag`, Ziff. 4/4a/5.

- [ ] §6-/§9-Tore grün (Tor-Status pro Schritt notiert).
- [ ] Pflicht-Gegenprüfung gelaufen (Risiko-Pfad, §14.4).
- [ ] Status-Marker §8 gesetzt — «verifiziert»/«geprüft» **nie automatisch**.
- [ ] §11-Wissensablage erfolgt (Schritt in der jeweiligen `methodology/`-Datei).
- [ ] §14.5-Trailer am Produktions-Commit: `Roadmap: <ID>` und auf Risiko-Pfaden
      zusätzlich `Gegenpruefung: <Verdikt> (<Modell>, <Linsen>) — <Befunde>`
      (bzw. `Gegenpruefung: n/a — reine Prüflogik`).

## Fehlerfälle — Tor rot / Quelle fehlt (je eine Sofortmassnahme)

1. **Cache/Stand-Tor rot** (`check:fedlex-versionen` Exit 1) → geltende
   Konsolidierung neu pinnen, Zeile in `scripts/fedlex-cache.sh` aktualisieren,
   Cache neu laden — **nie aus dem Gedächtnis rekonstruieren**.
2. **Quelle / OCL nicht erreichbar** → Lauf abbrechen statt halben Korpus
   schreiben; offline über `npm run entscheide:seed` / Fixtures; ehrlicher
   §8-Fallback-Status statt erfundener Werte.
3. **SR-Kollision** → Quarantäne; Identität in `src/lib/normtext/register.ts`
   (`fedlexKey`, `kuerzel` — seit HN-04 die einzige Kürzel-Quelle, `ERLASS_MAP`
   gestrichen) und `FEDLEX` in `src/lib/fedlex.ts` klären (Identität ≠ Normtext); **erst dann**
   Snapshot generieren.
4. **Gate / vitest rot** → §6.5-Diagnoseweg (Skill `refactoring`, Ziff. 6): nur
   die rote Datei einzeln, `npm run golden:diff -- <id>`; **nie
   `dist`/`golden`/Lock direkt lesen**.

**Abschluss-Regel:** Bei rotem Tor **kein Push, keine Übergabe an `landung`**
(§9). Ausführlich — inkl. Update-Pfaden — in `tools/verifikation.md` bzw.
`methodology/normtext.md`; hier steht nur die Sofortmassnahme (§5: ein Ort).
