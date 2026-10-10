---
name: gegenpruefung
description: Verwenden, wenn das Tor `check:gegenpruefung` rot ist, vor Commits auf Risiko-Pfaden (Extraktion, Rechnen, Norm-Tarif — src/lib/vorlagen, src/lib/tarif, src/lib/normtext, scripts/normtext, scripts/fedlex-*, daten/, scripts/materialien, Rechen-Engines; massgeblich abschliessend istRisikoPfad() in scripts/gegenpruefung/kern.ts) — und bei fachlicher Abnahme: Trigger «Abnahme», «abnehmen», «Abnahme-Paket», «geprüft setzen», «verified:true», «Protokoll nach SCHEMA.md».
---

# Gegenprüfung und Abnahme

Die teuersten Bugs (Tabellen-Drop, Fussnoten-Leak, `bis`/`ter`-Verlust,
falsche Frist oder Quote, erfundene Amtsträger auf Prod) entstehen an
Session-Blindheit: der Autor übersieht dieselbe Lücke zweimal. Die
Gegenprüfung ist der unabhängige Zweitdurchgang — Auftrag ist **widerlegen**,
nicht bestätigen. `check:gegenpruefung` (in `npm run gate`) blockiert jeden
Diff auf einer Risiko-Datei, bis für genau diesen Diff ein
`bestanden`-Nachweis vorliegt.

## Eiserne Regeln

1. **Unabhängig, frischer Kontext:** eigener Sub-Agent oder eigene Session,
   Modell Opus, anderes Modell als der Bau — nie im Gedankengang, der den
   Output erzeugt hat.
2. **Amtliche Quelle:** gegen die amtliche Fassung prüfen (Fedlex-Filestore-HTML
   für Bund, amtliche Sammlung für Kantone), nie gegen Code, eine zweite
   Ableitung oder ein Snippet. Quell-Wahl: Skill
   `scraping-swiss-official-sources`.
3. **Widerlegen, nicht abnicken:** erst ein gescheiterter ernsthafter
   Widerlegungsversuch ergibt `bestanden`.
4. **Belegpflicht:** jeder Befund und jedes `bestanden` mit Norm (Artikel) +
   Link + Stand. Technischer Befund (Render, Lifecycle, Race) ohne
   Reproduktions-Test ist Hypothese. Aussage aus einem einzelnen RDF-Tripel nur
   als Wiedergabe, nie als Behauptung, wenn das Tripel sie nicht trägt.
5. **Wer quittiert:** das Verdikt schreibt der Prüfer, die Quittung
   (`gegenpruefung:ok`, Register-Zeile, Trailer) setzt der Orchestrator —
   **nie der Bauer**. Vor jeder Landung prüfen, dass die Register-Zeile vom
   Prüfer stammt.

## Minimum eines echten Durchgangs

In **dieser** Prüfsession:

1. Die amtliche Quelle tatsächlich geöffnet.
2. Den unabhängigen Wert schriftlich notiert, BEVOR mit dem Output verglichen
   wird — wer den Ausgabewert kennt, ist geankert: blind aus der Norm
   ableiten, dann vergleichen. Code lesen ist kein Ersatz.
3. Mindestens einen Randfall durchgespielt (Staffelgrenze, Rundung,
   `bis`/`ter`, Regime-Wechsel).

Fehlt eines, ist das Verdikt nicht `bestanden`. Den Buchstaben erfüllen
(quittieren ohne echten Durchgang) verletzt den Geist — `gegenpruefung:ok`
prüft die Belege nicht, darum bist du die Prüfung.

**Praxis:** Erwartungen vor dem Ergebnis festhalten; Sabotage-Proben (Prüflogik
kaputt machen, Rot beobachten); den Bauer fragen, welcher Stelle er am
wenigsten traut. Delta-Runde: denselben Prüfer fortsetzen, nie einen
Bau-Agenten als Prüfer.

## Red Flags — STOP, dann `referenz-ausreden.md`

- Quittieren, ohne die amtliche URL in dieser Session geöffnet zu haben.
- Einziger Nachweis ist ein Kopf-Überschlag oder die Erinnerung an den Fix.
- Code gelesen statt aus der Norm gerechnet.
- Begründen, warum **diesmal** kein frischer Kontext oder Randfall nötig ist.
- «Nur noch die Quittung»; Grund ist Uhrzeit, wartender Merge, Sunk Cost.
- Verdikt aus Stichprobe oder früherem Durchgang auf den geänderten Diff
  übertragen.

## Auftrag an den Prüfer

- **Übergeben werden darf** die Beschaffung: gepinnter amtlicher
  Filestore-Pfad (`scripts/fedlex-cache.sh`) und der Scope-Anker aus der roten
  Tor-Meldung. **Beim Prüfer bleibt** die Re-Derivation aus der Norm.
- **Common-Mode-Schutz:** Currency-Check selbst fahren
  (`check:fedlex-versionen`/`check:caches`), Pin nur bei eigenem Grün
  übernehmen, sonst live holen. Nie den Grün-Status des Bau-Pfads übernehmen.
- **Geprüfter Stand = benannter SHA:** Auftrag nennt den Ziel-SHA, Prüfer
  bestätigt ihn (`git rev-parse HEAD`) und nennt ihn im Verdikt; ohne SHA gilt
  das Verdikt als nicht erfolgt.
- Stützt sich der Bau auf einen Entscheid Davids, zitiert der Auftrag Wortlaut
  und Quelle, nicht eine Paraphrase.

## Modus

**Extraktion/Darstellung** (`scripts/normtext/**`, `src/lib/normtext/**`,
`public/normtext/**.json`): Output zeichenweise gegen die Quellfassung; jagen:
Drop (Artikel, Absätze, lit., Ziff.), Leak (Fussnoten, Navigation),
zerrissene Abkürzungen, `bis`/`ter`-Verlust, Tabellenzellen,
Tausendertrenner, falsches «aufgehoben». Vollständigkeit: alle Artikel des
Erlasses, nicht nur die zitierten.

**Rechnen** (`src/lib/vorlagen/**`, `src/lib/tarif/**`, `src/data/tarif/**`,
`src/lib/fristenspiegel/**`, Rechen-Engines): unabhängig aus der Norm
nachrechnen, **Code nicht lesen**; Randfälle an Staffelgrenzen, Rundung,
Feiertags-/Computus-Verschiebung, Regime-Wechsel (Regimes nie kollabiert).

## Ergebnis

- **`widerlegt`** → Befunde mit Norm-Beleg zurück, nicht quittieren; fixen,
  neu prüfen.
- **`bestanden`** → im Repo-Wurzelverzeichnis:

  ```
  npm run gegenpruefung:ok -- --verdikt=bestanden \
    --engine="<Snapshot/Engine>" --quelle="fedlex <name> <YYYYMMDD>" \
    --notiz="<was gegen welche Norm/Quelle geprüft>"
  ```

  Berechnet den Diff-Hash, schreibt `bibliothek/.gegenpruefung-pending`, hängt
  die Register-Zeile an. Jeder weitere Edit kippt den Hash ⇒ neuer Durchgang.
  Auflagen vorher einbauen; das Werkzeug kennt nur `bestanden`.
- **Trailer:** `Gegenpruefung: bestanden (Opus, <Linsen>) — <Befunde>`,
  Befund-Teil ≥ 15 Zeichen (nie nur «keine», sondern «keine: <Beleg>»), bzw.
  `Gegenpruefung: n/a — reine Prüflogik`. Einzeilig, im letzten Absatz, nur
  Trailer-Zeilen dort.

Kein Aufweichen eines anderen Tors; alte Nachweise sind nicht recyclebar.

## Abnahme (Status entwurf → geprüft)

`verified: true` und «geprüft» setzt nur Davids ausdrückliches Verdikt zu
GENAU dieser Karte (CLAUDE.md §7) — auch nicht teilweise. Verbindlich:
`abnahme/SCHEMA.md` und `abnahme/VORLAGE.md`; `src/tests/abnahmeGate.test.ts`
bricht die Suite bei Status ohne Protokoll.

**Phase 1 — Paket** (ohne David), für die Karten-ID aus
`src/lib/startseiteConfig.ts`, als `.scratch/abnahme-paket-<id>.md`
(nicht committen):
1. Bausteine wortwörtlich (Vorlagen per Generator, z. B. `npm run abnahme:ag`;
   Rechner: alle Ergebnis-Sätze, Warnungen, Annahmen aus den Golden-Outputs).
2. Normgrundlage als Tabelle: Norm, ELI, Stand (`scripts/fedlex-cache.sh`),
   Fedlex-Link `art_x` daneben; Anker-Count des Caches vorher prüfen.
3. Golden-Referenzfälle mit amtlichem Beleg; fehlt einer, recherchieren und
   als Test ergänzen.
4. Edge-Case-Checkliste nach SCHEMA.md Ziff. 4 mit Ist-Befund.
5. Offene Annahmen und Known Limitations sammeln.
David den Pfad und die 3–5 wichtigsten Entscheidpunkte nennen. Ohne Verdikt
ist Phase 1 der fertige Stand — nicht drängen.

**Phase 2 — nur nach Davids Verdikt** (abgenommen / mit Auflagen /
zurückgewiesen): Auflagen als deklarierte fachliche Änderung umsetzen;
Protokoll `abnahme/<karten-id>.md` nach VORLAGE.md (Prüfer David Graf,
Abnahme-Art ehrlich); erst dann Status heben (startseiteConfig, `verified:true`);
Tore `npm test` · `npm run lint` · `npx tsc -b` · `npm run golden:vergleich`.

Red Flags: «David sagte mach fertig» ist kein Verdikt · Selbstabnahme gilt für
David, nie für einen Agenten · «teilweise geprüft» gibt es nicht. Eine
fachliche Änderung nach Abnahme macht das Protokoll ungültig (Status zurück
auf `entwurf`).
