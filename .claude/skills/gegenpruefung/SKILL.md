---
name: gegenpruefung
description: Use when the LexMetrik gate `check:gegenpruefung` is red, or before committing changes to risk paths (Extraktion/Rechnen/Norm-Tarif). Trigger-Beispiele: src/lib/vorlagen, src/lib/tarif, src/lib/normtext, scripts/normtext, scripts/fedlex-*, daten/, scripts/materialien und die Rechen-Engines. Massgeblich (abschliessend): istRisikoPfad() in scripts/gegenpruefung/kern.ts.
---

# Gegenprüfung — adversariales Protokoll (QS-GP)

## Zweck

Die teuersten LexMetrik-Bugs (Tabellen-Drop, Footnote-Leak, `bis`/`ter`-Verlust,
falsche Frist/Quote — Vorfallswelle Juni/Juli 2026, prominentester Fall PR #309
am 20.7.2026: elf erfundene Amtsträger:innen ~1 h auf Prod; Tor-Geburtsbeweis
`f87921e53`) entstanden an **Session-Blindheit**: der Autor prüft seinen eigenen
Output und übersieht dieselbe Lücke zweimal. Dieser Skill ist der **unabhängige
Zweitdurchgang** — Auftrag ist nicht «bestätigen», sondern **widerlegen**.

Das Tor `check:gegenpruefung` (in `npm run gate`) blockiert jeden Diff auf einer
Risiko-Datei, bis genau für diesen Diff ein `bestanden`-Nachweis vorliegt.

## Eiserne Regeln

1. **Unabhängig & frischer Kontext.** Diesen Durchgang idealerweise als eigener
   Sub-Agent / eigene Session mit **frischem Kontext** und Modell **Opus**
   (Daueranweisung David) fahren — nicht im selben Gedankengang, der den Output
   erzeugt hat.
2. **Amtliche Quelle vor sich.** Immer gegen die **amtliche** Fassung prüfen
   (Fedlex-Filestore-HTML für Bund, LexWork/amtlicher Erlass für Kanton), nicht
   gegen den Code, nicht gegen eine zweite Ableitung. Bei Unsicherheit zur
   Quell-Wahl den Skill `scraping-swiss-official-sources` heranziehen.
3. **Widerlegen, nicht abnicken.** Aktiv nach dem Fehler suchen. Erst wenn ein
   ernsthafter Widerlegungsversuch scheitert, ist das Verdikt `bestanden`.
4. **Belegpflicht.** Jeder Befund UND jedes `bestanden` mit konkreter Norm
   (Artikel/§) + Link + Stand hinterlegen (Daueranweisung David: doppelt
   verifizieren, jeder Wert mit Norm-Anker). **Gilt sinngemäss ausserhalb der
   Norm-Prüfung:** ein Befund zu einem technischen Mechanismus (Render-/
   Lifecycle-Verhalten, Race Conditions) ohne echten Reproduktions-Test ist
   eine Hypothese, kein Fund. Beleg 15.9.2026 (PR #899): ein Sonnet-Prüfer
   nannte den falschen StrictMode-Mechanismus; erst ein Nachzug mit echtem
   Render-Test fand den realen Fall (verworfener Suspense-Render, auch Prod).
5. **Wer quittiert.** Das Verdikt schreibt der Prüfer, die Quittung
   (`gegenpruefung:ok`, Register-Zeile, `Gegenpruefung:`-Trailer) setzt der
   Orchestrator — **nie der Bauer**. Eine Selbstbescheinigung des Bau-Agenten
   macht den Merge-Schutz formal grün und ist inhaltlich wertlos (Vorfall
   PR #616, 2.9.2026: «Sonnet, Ladeschicht/Identitaet» vom Bauer selbst; erst
   die Opus-Prüfung fand vier Auflagen, darunter einen toten Link 0/15).

## Minimum eines echten Durchgangs

«Ernsthaft widerlegen» (Regel 3) und «echter Durchgang» heissen mindestens,
**in dieser Prüfsession**:

1. Die amtliche Quelle **tatsächlich geöffnet** — nicht aus Erinnerung zitiert,
   egal wie lange sie vorhin offen war.
2. Den unabhängigen Wert/Text **schriftlich notiert, BEVOR** mit dem Output
   verglichen wird. Wer den Ausgabewert schon gesehen hat — der Autor immer —,
   ist geankert: dann blind aus der Norm rechnen/ableiten, Resultat hinschreiben,
   erst danach vergleichen. Den Code zu lesen ist kein Ersatz: Lesen reproduziert
   dessen Fehler mitsamt der Autoren-Lücke; der Beweis ist das unabhängige
   Nachrechnen aus der Norm.
3. Mindestens einen **Randfall** konkret durchgespielt (Staffel-Grenze, Rundung,
   `bis`/`ter`, Regime-Wechsel).

Fehlt eines davon, ist das Verdikt nicht `bestanden` — egal wie plausibel der
Output wirkt. Das «idealerweise» in Regel 1 betrifft nur das Vehikel (Sub-Agent
vs. eigene Session); es erlaubt nie, dass der Autor im selben Gedankengang
abnickt. **Den Buchstaben der Gegenprüfung erfüllen (Token quittieren ohne
echten Widerlegungs-Durchgang) verletzt ihren Geist** — `gegenpruefung:ok`
prüft die Belege technisch nicht, genau deshalb bist du die Prüfung, nicht das
Tool.

## Praxis-Rezept (Beleg PR #963, 21.9.2026: 2 blockierende Lücken, 14 Mutationen)

- Erwartungen **vor** dem Ergebnis pre-registrieren (Ziff. 2 gilt sinngemäss
  auch ausserhalb der Norm-Prüfung).
- **Mutationen/Sabotage-Proben**: Prüf-Logik/Test kaputt machen, beobachten
  ob sie rot wird (§6.7).
- Den Bauer fragen, **welcher Stelle er am wenigsten traut**, dort zuerst.
- Delta-Runde: **denselben Prüfer fortsetzen** (SendMessage), nicht neu
  dispatchen — nie aber einen BAU-Agenten als Prüfer fortsetzen (Skill
  `auftrag` Ziff. 6).

## Red Flags — STOP und neu ansetzen

Wenn eines davon zutrifft, bist du gerade am Abnicken — dann **zuerst
`referenz-ausreden.md`** im Skill-Ordner lesen: die dreizehn belegten
Ausreden und warum keine zählt (ausgelagert QS-EFFIZIENZ 15.8.2026, Wortlaut
unverändert; Muster `landung/referenz-ausnahmen.md`).

- Du willst quittieren, ohne die amtliche URL **in dieser Prüfsession** geöffnet
  zu haben.
- Dein einziger «Nachweis» ist ein Überschlag im Kopf oder die Erinnerung an den
  eigenen Fix.
- Du hast den Code gelesen statt aus der Norm gerechnet.
- Du formulierst gerade, warum **diesmal** kein frischer Kontext / kein Randfall
  nötig ist.
- Du denkst «nur noch die Quittung» oder «Prüf-Theater».
- Der Grund fürs Quittieren ist die Uhrzeit, ein wartender Merge oder die bereits
  investierte Zeit — nicht ein gescheiterter Widerlegungsversuch.
- Du überträgst ein Verdikt aus einer Stichprobe oder einem früheren Durchgang
  auf den ganzen, inzwischen geänderten Diff.

## Beschaffung als Sub-Agent — was übergeben werden darf (QS-TOK/T11)

Wird dieser Durchgang als **eigener Sub-Agent** gefahren (Regel 1, empfohlen),
darf der Orchestrator dir die **Beschaffung** abnehmen — **nie die Prüfung**:

- **Übergeben werden darf:** der **gepinnte amtliche Filestore-HTML-Pfad** (via
  `scripts/fedlex-cache.sh`) und der **Scope-Anker aus der roten Tor-Meldung**.
- **Bei dir bleibt vollständig:** die **Re-Derivation aus der Norm** (unabhängig
  rechnen, Randfall, schriftlicher Wert VOR dem Vergleich, Beleg mit
  §/Link/Stand). Der Pin ersetzt das Öffnen der Quelle nicht — er IST die
  Quelle, die du öffnest.

**Common-Mode-Schutz (nicht verhandelbar):** Currency-Check **selbst** fahren
(`check:fedlex-versionen`/`check:caches`) und den Pin nur bei eigenem Grün
übernehmen — sonst die geltende Fassung **live** holen (Skill
`scraping-swiss-official-sources`). Nie den Grün-Status des Bau-Pfads
übernehmen, nie auf den Code oder eine zweite Ableitung zeigen (Regel 2 +
Minimum Ziff. 2 — der frühere Verweis «Regeln 2+5» lief ins Leere, es gibt nur
vier eiserne Regeln; korrigiert 15.8.2026).
Ein übergebener Pin ist ein Start-Artefakt, kein Verdikt.

**Geprüfter Stand = benannter SHA (Beleg 23.9.2026, V2d-Gegenprüfung):** Der
Auftrag nennt den Ziel-SHA; der Prüfer bestätigt ihn zuerst mit
`git fetch && git rev-parse HEAD` (sonst `git checkout --detach <ref>`) und
nennt den geprüften SHA im Verdikt. Ohne diesen Schritt prüfte ein Durchgang
teils einen anderen Baum (meldete migrierte Seiten als «nicht migriert»,
Testzahl eines älteren Stands) — ein Verdikt ohne SHA gilt als nicht erfolgt
(§14.7).

## Modus wählen

Sieh dir die geänderten Risiko-Dateien an (die rote Tor-Meldung listet sie):

### Modus Extraktion / Darstellung
für `scripts/normtext/**`, `src/lib/normtext/**`, `public/normtext/**.json`,
Snapshot-/Struktur-Outputs.

- Output **zeichenweise** gegen die amtliche Quellfassung vergleichen.
- Gezielt jagen: **Drop** (fehlende Artikel/Absätze/`items`/lit./Ziff.),
  **Leak** (Fussnoten-/Navigations-Text im Normtext), **zerrissene
  Abkürzungen**, **`bis`/`ter`-Verlust** (`art_335_c` etc.), Tabellen-Zellen,
  Tausendertrenner, falsches «aufgehoben».
- Vollständigkeit prüfen: **alle** Artikel des Erlasses vorhanden, nicht nur die
  zitierten (§7 Build-Regel).

### Modus Rechnen
für `src/lib/vorlagen/**`, `src/lib/tarif/**`, `src/data/tarif/**`,
`src/lib/fristenspiegel/**` und die Rechen-Engines
(`verjaehrung|streitwert|schkg|beurkundung|gruendung|frist|kosten|gebuehr|
zustaendigkeit|straf|bger`).

- **Unabhängig aus der Norm nachrechnen — den Code NICHT lesen.** Artikel für
  Artikel selbst rechnen (Frist, Quote, Gebühr, Zuständigkeit, Streitwert) und
  erst danach mit dem Ausgabewert vergleichen. Den Code zu lesen reproduziert
  dessen Fehler.
- Randfälle konstruieren: Grenzwerte der Staffeln, Rundung, Feiertags-/Computus-
  Verschiebung, Regime-Wechsel (§4 regime-treu — verschiedene Rechtsregimes
  dürfen nicht kollabiert sein).

### Station Phase-3-Zählung (QS-FREMDAGENTEN)

Läuft eine Prüfung Norm gegen Ausgabewert/Extrakt, kann der Prüfer zusätzlich
einen Gemini-Durchgang als Diskrepanz-Finder fahren (Aufruf: Skill
`korpus-werkstatt`); Verdikt bleibt beim Prüfer. Jeder Durchgang wird in
`fahrplaene/FAHRPLAN-FREMDAGENTEN.md` §5 Tabelle «Phase 3» gezählt
(echt/Schein/verpasst); nach fünf Durchgängen Rückbau-Schwelle §3 anwenden.

## Ergebnis

- **`widerlegt`** → Befunde mit Norm-Beleg zurückgeben; NICHT quittieren. Erst
  fixen, dann erneut prüfen.
- **`bestanden`** → im Repo-Wurzelverzeichnis quittieren:

  ```
  npm run gegenpruefung:ok -- --verdikt=bestanden \
    --engine="<Snapshot/Engine>" \
    --quelle="fedlex <name> <YYYYMMDD>" \
    --notiz="<kurzer Beleg: was gegen welche Norm/Quelle geprüft>"
  ```

  Das berechnet den Diff-Hash (gleiche Kernfunktion wie das Tor), schreibt
  `bibliothek/.gegenpruefung-pending` und hängt die Register-Zeile an. Danach
  ist das Tor grün — solange die Dateien unverändert bleiben (erneutes Editieren
  kippt den Hash ⇒ neuer Durchgang nötig).

- **Commit-Trailer** setzen (§14 Trailer-Konvention):
  `Gegenpruefung: bestanden (Opus, <Linsen>) — <Befunde/„keine">`
  bzw. bei reiner Tor-/Test-Änderung `Gegenpruefung: n/a — reine Prüflogik`.
  **EINZEILIG, im letzten Absatz, nur Trailer-Zeilen dort** (Falle 15.8.2026,
  QS-TYP-LUECKE): `git`'s `%(trailers)`-Parser erkennt den Block nur, wenn
  jede Zeile des letzten Absatzes ein `Key: Wert` ist — ein Zeilenumbruch
  mitten im Verdikt-Wert oder ein Prosa-Satz darunter macht den Trailer
  unsichtbar, `check:merge-schutz` bleibt rot trotz Register-Zeile.
  `gegenpruefung:ok` akzeptiert als Verdikt nur `bestanden` — Auflagen
  vorher einbauen, dann `bestanden` mit Auflagen-Vermerk im Prüfer-Feld.

## Nicht-Ziele

- Kein Aufweichen eines anderen Tors, kein `--verdikt=bestanden` ohne echten
  Durchgang. Der Nachweis ist an genau diesen Diff gebunden; Recyceln alter
  Token ist ausgeschlossen (der Hash passt dann nicht).
