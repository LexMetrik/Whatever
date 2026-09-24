<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: HN-D1 — Normverweise mit einem Ziel
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-D1 (DK-01); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»); Umsetzungs-Go David 24.9.2026 «ja unbedingt» (übermittelt vom Orchestrator)
-->

*(Go David 24.9.2026 «ja unbedingt», übermittelt vom Orchestrator)*

Gemeinsam für alle Design-Einheiten: Massstab ist das Reglement in der Fassung vom 23.9.2026 (F0.5 «Rundung mit Mass»: 4 · 8 · 10 · 14 px, Pille — nicht «Radius 0»). Klasse bau, Risikopfad nein (ausser `src/lib/fedlex/**`), Normtext-Körper golden byte-gleich, GP empfohlen bei geteilten Bausteinen. e2e-Selektoren und Screenshot-Basislinien ziehen mit (vor dem Push alle Sonden auf den alten Selektor greppen; Leser-Änderungen in allen Ansichtsmodi prüfen); vor dem Push `npx vitest run src/tests/design-`.

- Befunde: DK-01 (mittel · b).
- Dateien: `src/components/NormText.tsx:118–123` und die `zielIntern={false}`-Aufrufe `:454, :568, :666, :789` (Zweitprüfer: `NormText` erzwingt Fedlex für jeden Querverweis im Fliesstext); `NormChip.tsx:55` (Voreinstellung intern); `DESIGN-REGLEMENT.md:1593–1594` (§R-6 Ziff. 5 nachführen); Belegflächen Verzugszins (Hilfetext Art. 104 Abs. 1 OR), Lohnfortzahlung (Art. 324b OR), Vorlage Testament (Art. 467 ZGB).
- Soll: jeder Normverweis öffnet zuerst den eigenen Leser, «Amtliche Fassung ↗» als Zweitweg; ohne Snapshot bleibt Fedlex das Ziel.
- Neutral: nein (Linkziel) · Tests: Render-Test Querverweis ausserhalb des Lesers → `/gesetze/bund/OR#art-104` + Fedlex-Zweitweg; Verhalten im Leser unverändert; E2E-Sonden auf Fedlex-Links greppen.
- PRs 1 · Abh.: HN-09 (gleiche Datei, zuerst die Zielkorrektheit), Landung offener `W2·29-WERKBANK-LESER`-PRs · Blocker: keiner.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-D1 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
