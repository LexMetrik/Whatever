---
name: refactoring
description: Protokoll für jeden Struktur-Umbau ohne Verhaltensänderung — Golden-Beweis, Reihenfolge der Tore, Datei-Schlankheit, Fassaden-Muster, sparsame Diagnose und die vollständige Tor-Definition. Verwenden bei Refactoring, Umbau, Aufteilen grosser Dateien, Entdopplung, Engine-Verschmelzung, Code-Splitting, Lazy Loading und beim Bau eines neuen `check:*`-Tors.
---

# Refactoring — verhaltensneutral und bewiesen

Ein Refactoring behauptet, nichts geändert zu haben. Diese Behauptung ist zu
beweisen. Grundlage ist §1 der `CLAUDE.md`: Korrektheit schlägt jede
Strukturverbesserung.

## 1. Ablauf

1. **Vorher grün.** `npm run gate` (bzw. `gate:schnell` pro Iteration). Die
   Einzelbefehle `npx tsc -b` · `npm test` · `npm run lint` · `npm run build`
   mit **voller Ausgabe** nur zur Diagnose eines roten Gates, nie `tail -1`.
   Der Wrapper kürzt ausschliesslich die grüne Ausgabe.
2. **Golden festhalten**, wo Texte oder Dokumente entstehen (assemble,
   PDF-Modell, Warnungen): Snapshot bzw. Vergleichslauf **vor** dem Umbau.
3. **Umbauen.**
4. **Nachher beweisen.** `npm run golden:vergleich` byte-gleich, Gate grün.
   Vor jedem Kontrolllauf, der Code austauscht (`git checkout <ref> -- <pfad>`,
   `stash`, Branch-Wechsel): `git status --short` muss **leer** sein — sonst
   überschreibt der Vergleich uncommittete Arbeit (Vorfall 5.8.2026: drei
   Nachträge eines Bau-Agenten verloren und neu geschrieben).

## 2. Die zwei nicht verhandelbaren Sätze

- **Tests werden bei Refactorings nicht angepasst.** Muss ein Test geändert
  werden, ist es eine fachliche Änderung → eigener, deklarierter Schritt mit
  Begründung. Ein angepasster Test ist kein Beweis, sondern dessen Aufgabe.
- **Kein `npm run golden` zum Reparieren einer Abweichung.** Golden neu zu
  schreiben, weil der Vergleich rot ist, zerstört das Orakel.

Ergänzend zum ersten Satz: **Ein Test fällt nur mit dem Code, den er
prüft.** Vor dem Mitlöschen jeder Testdatei ihre Importe lesen: zeigt einer auf ein Modul, das bleibt,
bleibt der Test (Umstieg L1, 5.10.2026: `plan-fremdagenten.test.ts`
mitgelöscht, obwohl `fremdagenten-messung.ts` weiterlebt — Gegenprüfung
fand es; Lehre aufgenommen auf Wort David 5.10.2026).

## 3. Was verschmolzen werden darf — und was nicht

Engine-Verschmelzung ist erlaubt unter zwei Bedingungen:

1. **Golden-Protokoll** nach Ziff. 1, Ergebnis byte-gleich.
2. **Regime-Treue:** Verschiedene Rechtsregimes bleiben im verschmolzenen Code
   als interne Verzweigung erkennbar. Sie werden nie zu einer gemeinsamen Regel
   kollabiert.

Risikoärmste Merges zuerst — geteilte Infrastruktur hinter den Regime-Engines.
Materielle Rechtsregeln werden nie geteilt (§4).

**Gegenrichtung:** Aufteilen ist immer erlaubt und erwünscht. Es ist das
Gegenteil der eingeschränkten Verschmelzung.

## 4. Datei-Schlankheit

Eine Datei der **Darstellungs- oder Datenschicht** (`src/pages/`,
`src/components/`, Vorlagen-Schemas, Config- und Datentabellen) über **~800
Zeilen** wird in Geschwister-Dateien plus schlankes Barrel gesplittet,
verhaltensneutral nach Ziff. 1.

**Fassaden-Muster beim Split:** Inhalt in Geschwister-Dateien verschieben, das
alte Modul wird zur schlanken Fassade (`export * from './geschwister'`),
Konsumenten-Importpfade bleiben unverändert. Beweis ist **Byte-Identität des
Outputs**, nicht nur ein grünes `tsc`.

**Split einer Risiko-Datei ⇒ `istRisikoPfad()` mitprüfen (§17, 4.8.2026):**
`scripts/gegenpruefung/kern.ts` klassifiziert teils über exakte Pfade bzw.
`^src/lib/[^/]+\.ts$` — wandert Engine-Logik in einen Unterordner, verliert
sie SONST still die Risiko-Klassifikation (nur noch die leere Fassade träfe).
Beim Split empirisch belegen: neue Modul-Pfade → `RISIKO`; fehlt der
Ordner-Zweig in `kern.ts`, gehört er in denselben PR. Zweifach belegt am
4.8.2026 (besetzung- und zustaendigkeit-Split, unabhängig gefunden).

**Geteilte Infrastruktur statt lokaler Kopie:** Zahl- und CHF-Parser,
Datums-Formatter aus `lib/format.ts` (fachneutral), Datums-Rechnen und
-Validierung aus `datumsUtils.ts`. Ausnahme nur, wenn die Semantik fachlich
bewusst abweicht — dann am Fundort begründen (§1).

## 5. Performance-Massnahmen

Lazy Loading und Code-Splitting ändern nur den **Ladezeitpunkt**, nie Inhalt
oder Reihenfolge der Logik. Bauregeln und Logikverlust-Bewertung: Skill `perf`.

## 6. Diagnose sparsam

- Rotes vitest: zuerst nur die rote Datei nachfahren
  (`npx vitest run src/tests/<datei>`), nicht die Suite.
- Golden-Abweichung je Fall: `npm run golden:diff -- <id>`.
- Die Lese-Verbote (`golden/*.json`, `dist/`, `package-lock.json`) erzwingt
  `lese-schutz.py` und nennt in der Fehlermeldung das richtige Werkzeug.

**Vorher/Nachher-Messung nie per `git checkout <sha> -- <datei>` (2.9.2026, W2·22 Z5):**
der Befehl überschreibt uncommittete Änderungen der Datei stillschweigend. Für
Messungen gegen einen älteren Stand: eigenen Commit setzen (WIP) und danach
`git diff`, oder `git stash push -- <datei>` … `git stash pop`, oder den alten
Stand per `git show <sha>:<pfad> > /tmp/…` daneben legen.

## 7. Wann ein Tor ein Tor ist

Ein `check:*` zählt erst als Tor, wenn alle vier Bedingungen erfüllt sind:

- **(a) Unabhängige Referenz.** Es prüft nie gegen die eigene Ladung desselben
  Laufs.
- **(b) Kein stilles Grün.** Bei fehlender Voraussetzung wird es rot oder
  protokolliert explizit `SKIP`.
- **(c) Sein Nicht-Laufen ist sichtbar.** `cancelled` und `skipped` zählen als
  rot; ein grauer Lauf ist kein bestandener Lauf. Erzwungen durch
  `check:ci-laeufe` (`waechter.yml`, täglich) über jeden `schedule:`-Workflow.
- **(d) Identitäts-Treffer mit Wortgrenze**, nie Substring-Präsenz.

**Sabotage-Probe:** Wer ein Tor baut, zeigt es einmal rot. Ein Tor, das nicht
scheitern kann, ist gefährlicher als keines.

**Kennzahl-Regel bei UND-Bedingungen** (Gegenprüfung PR #828 Runde D1, 12.9.2026):
Bei Wächtern mit UND-verknüpften Bedingungen genügt «einmal rot, einmal grün»
nicht — eine UND-Verknüpfung kann still 0 statt der erwarteten Trefferzahl
messen, ohne dass der Test es bemerkt, wenn keine Teilbedingung je einzeln
geprüft wird. Die Ist-Kennzahl JEDER Teilbedingung gehört einmal in den
Testbeweis, nicht nur das 0/&gt;0-Gesamtergebnis. Beleg: der Vollabdeckungs-
Wächter im `--nur`-Pfad (Kanton-Fremd-Drift, PR #828) prüfte die Bedingung
`erlassNr === '' && erlassName === ''` — sie mass 0, obwohl die richtige
Teil-Kennzahl `erlassNr === ''` bei 267 lag (Mehrheits-Heuristik statt
1:1-Übernahme hatte `erlassName` unbemerkt mitbefüllt).

**Einordnung beim Bau** (Klassierung, damit die lokale Kette nicht monoton
wächst):

- **K1** — schützt Rechtsinhalt oder Datentreue → lokale `gate`-Kette.
- **K2** — schützt Konsistenz oder Stil → nur CI.

Ein neues Tor ohne Klasse wird nicht aufgenommen.

## 8. §-Konkordanz (für Alt-Verweise im Bestand)

Die Unterparagraphen von §6 sind seit dem A4-Umzug (25.7.2026) hier; rund 220
Bestands-Verweise zeigen weiterhin auf die alten Nummern. Volle
Auflösungs-Tabelle: **`referenz-konkordanz.md`** im Skill-Ordner — nur laden,
wenn wirklich ein «§6.x» aufzulösen ist. Merkhilfe: §6.1/§6.2 → Ziff. 1,
§6.3 → Ziff. 2, §6.4 → Ziff. 5, §6.5 → Ziff. 6, §6.6 → Ziff. 4,
§6.7 → Ziff. 7.
