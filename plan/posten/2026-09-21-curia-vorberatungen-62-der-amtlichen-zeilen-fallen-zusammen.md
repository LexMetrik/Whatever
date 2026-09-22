<!-- @posten
dach: QS-KORPUS
titel: Curia-Vorberatungen — Variante C bauen (Zeile je Zuweisung, Entwürfe als Liste)
anlass: Vollzensus 21.9.2026 beim Fix des Publikations-Dedupe; Nachrecherche 22.9.2026; Entscheid David 22.9.2026
-->

**ENTSCHEID DAVID 22.9.2026 (Chat, Wortlaut «dann c»): Variante C.** Eine Zeile je Kommission und
Zuweisung, die betroffenen Entwürfe als Liste mitgeführt — verlustfrei, ohne Doppelungs-Optik.
Marker `wartet-auf: david` entfernt. **Risikopfad Korpus** (`lex-daten` + Gegenprüfung),
Reihenfolge nach `@queue`/`QS-KORPUS`.

## Was gebaut wird

`vorlage` (bzw. die Entwurfs-Liste) wandert ins Datenmodell von `CuriaKommission`
(`scripts/entstehung/curia.ts:142`), der Schlüssel `[datum, CommitteeName]` (`:226`/`:239`) bleibt —
die heute verworfenen `BillNumber`/`IdBill` werden gesammelt statt weggeworfen. Bestand bleibt bei
rund 790 Zeilen statt ~2093 (Variante B), kein Eintrag geht verloren.

## Tatsachen, die den Bau binden (Nachrecherche 22.9.2026)

  - **`PreconsultationDate` ist KEIN Sitzungsdatum**, sondern ein Zuweisungs- bzw.
    Einreichungsdatum. Belegt: 08.053 = `Business.SubmissionDate`; 01.023, 02.046, 09.043, 16.077,
    19.046 = Botschaftsdatum; 24.041 ungeklärt. **Eine Beschriftung «Kommission X beriet am Y» wäre
    falsch (§8)** — unabhängig von der Variante. Auch die frühere Posten-Begründung «je Sitzung»
    trägt damit nicht; sie ist mit diesem Nachtrag ersetzt.
  - `$metadata`: `Preconsultation` hat Schlüssel `ID` + `Language` und Beziehungen zu `Bill`
    (`IdBill`) und `Business`, **keine** zu Meeting oder Session — die Zeile ist amtlich «je Entwurf».
  - Stichprobe über 8 Geschäfte: zusammenfallende Zeilen unterscheiden sich in 8/8 nur in
    `BillNumber`/`IdBill`, in 2/8 zusätzlich in `TreatmentCategory` (09.043, 24.041; Bedeutung
    **nicht amtlich belegt**). Kein Fall «Entwurf 1 zugewiesen, Entwurf 2 nicht».
  - **Nebenfund, im selben Zug zu beheben:** `scripts/entstehung/curia.ts:229` verwirft mit
    `if (!name) continue` amtliche Zeilen **ohne** `CommitteeName` ersatzlos (24.041: 3 Zeilen) —
    ein eigener kleiner Verlust, unabhängig von der Variante.
  - Die Liste wird heute **nirgends angezeigt** (Grep über `src/**`) → reiner Daten-Entscheid; die
    Beschriftungsfrage stellt sich erst, wenn sie eine Oberfläche bekommt.
  - Tor `curia-tor.ts:145`/`:230` hat für die Vorberatungen **keine unabhängige Referenz** —
    beim Bau mitdenken. Zähler: `curia-run.ts:124/130/180`.

## Auflage der Quelle

parlament.ch «Open Data / Web Services»: vier gleichrangige Auflagen — kein amtlicher Anschein ·
Quellenangabe · **inhaltlich nicht verändern** · Downloadzeitpunkt ersichtlich (FR: «Le contenu des
données doit rester inchangé»). Keine amtliche Auslegungshilfe gefunden. **§14.7-Warnung:** eine
WebFetch-Zusammenfassung der «Rahmenregeln Parlamentsdaten» (Sept. 2022) erfand ein
Veränderungsverbot samt Aggregations-Erlaubnis — im Volltext null Treffer, **nicht zitieren**.

## Messung (Stand 21.9.2026, unverändert als Beleg)

| Menge | amtliche Zeilen | gespeichert | Differenz | Herkunft |
|---|---|---|---|---|
| über 385 Shard-Geschäfte | 2093 | **790** | **−1303 (62 %)** | eigene Messung, vor dem Vollabgleich |
| über 386 Shard-Geschäfte | 2249 | **792** | **−1457 (65 %)** | Gegenprüfung #960, nach dem Vollabgleich |
| korpusweit (DE) | 32 031 | 22 542 | −9489 | eigene Messung |

Stichproben: Geschäft 08.053 16 Zeilen → 2 · Geschäft 24.041 23 → 5.

**Offen:** **Zählwiderspruch** korpusweit — 35 309 amtliche Zeilen (Messung 22.9.2026) gegen
32 031 oben (21.9.2026); vor dem Bau nachmessen. Darstellung auf parlament.ch (JS-Hülle) nicht
belegbar; andere Weiterverwender nicht geprüft.

Vollständige Belegkette: `bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md`
Ziff. 17.
