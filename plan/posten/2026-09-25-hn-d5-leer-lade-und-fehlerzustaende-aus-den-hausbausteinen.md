<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: HN-D5 — Leer-, Lade- und Fehlerzustände aus den Hausbausteinen
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-D5 (DK-05, DK-21, DK-27); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

Gemeinsam für alle Design-Einheiten: Massstab ist das Reglement in der Fassung vom 23.9.2026 (F0.5 «Rundung mit Mass»: 4 · 8 · 10 · 14 px, Pille — nicht «Radius 0»). Klasse bau, Risikopfad nein (ausser `src/lib/fedlex/**`), Normtext-Körper golden byte-gleich, GP empfohlen bei geteilten Bausteinen. e2e-Selektoren und Screenshot-Basislinien ziehen mit (vor dem Push alle Sonden auf den alten Selektor greppen; Leser-Änderungen in allen Ansichtsmodi prüfen); vor dem Push `npx vitest run src/tests/design-`.

- Befunde: DK-05 (mittel · b); DK-21, DK-27 (tief · EA).
- Dateien: `WerkzeugeBlatt.tsx:141, :168`; `GesetzeBlatt.tsx:205–207, :234` (seit #1069 umgebaut, neu `GesetzeSuche.tsx` — Fundstellen nachmessen) → `Leerzustand art="filter"` mit Weiterweg «Suche leeren», Fehler über `FehlerBox` (`vorlagen/ui.tsx:364`); ein `Ladeanzeige`-Baustein mit Text-Prop (`RouteHuelle.tsx:49` «der eine Lade-Zustand» + 7 Kopien); Status «in Vorbereitung» im Werkzeuge-Blatt als `lc-badge-geplant`.
- `W2·29-WERKBANK-START` steht auf done → keine Umbau-Ausnahme (Zweitprüfer, Nachtrag Orchestrator). Den Umzug der Ladeanzeige auf Entscheid-Leser, Materialien, Rechtsprechung (REST) und Gesetzesleser (LESER) übernehmen die Werkbank-Schritte als Auflage.
- Neutral: nein (Weiterweg neu) · Tests: die Sonde `leerzustand-d7.test.tsx` so erweitern, dass sie auch Stellen ohne Import sieht; Render-Tests.
- PRs 1 · Abh.: — · Blocker: keiner.

Umzug der Ladeanzeige auf die Umbau-Flächen steht in den HN-D7-Posten unter W2·29-WERKBANK-REST und -LESER.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-D5 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
