<!-- @posten
dach: QS-EFFIZIENZ
titel: HN-20 — Skript-Hygiene: knip-Einstiege, tote Skripte, Zähler zur Build-Zeit, Abhängigkeiten
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-20 (VS-04, VS-05, VS-06, VS-07, VS-12, VS-17, VS-19, VS-20, PS-24); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: VS-04, VS-05, VS-06, VS-07, VS-12, VS-17, VS-19, VS-20 Plan-Teil, PS-24 (tief · EA).
- Dateien: `knip.json:5, :12, :19` (Einstiege aus `package.json`/CI statt `scripts/**`; Rot-Beweis: knip meldet danach die toten Dateien) und `check-sediment.ts:26` (Kommentar); 9 Einmal-Skripte (Liste `soll-und-laeufe/verschlankung/kandidaten.md` W1; 8 davon Risikopfad → eigener PR mit GP); `scripts/archiv/*.ts` (8) + `tsconfig.scripts.json:57` → Commit-Kennungen im README (Provenienz bleibt, §2b); `scripts/rechtsprechung/fixtures/zg-k5-2023-13.html`; `src/data/startseiteZaehler.generated.ts` + `scripts/gen-startseite-zaehler.ts` + `package.json:9` (`check:zaehler`) → zur Build-Zeit, prerendertes HTML byte-gleich; Massen-Pipeline (masse-ingest, baue-rangliste, backe-rangliste-shards, masse-invarianten) bis zum VPS-Entscheid als ruhend markieren, `check:netz:kette` (`package.json:36`) streichen, 3 manuelle Generatoren als npm-Skript; `valibot` → devDependencies, `react-router`/`playwright` listen, `@ast-grep/cli` knip-ignore, 11 Test-Exporte; `scripts/plan/bildSeiten.ts:543` `slug` importieren (`lage.ts:96`); `e2e/px-textkoerper.e2e.ts-snapshots/` + `playwright.config.ts:59–60, :162–171`.
- PR-Schnitt: **PR a** Löschungen auf Risikopfaden (GP) · **PR b** übrige Löschungen, knip, Abhängigkeiten · **PR c** Zähler zur Build-Zeit (M).
- Klasse mechanisch · Risikopfad je PR getrennt · neutral ja · Tests: `tsc -b`, «knip leer», prerender byte-gleich.
- PRs 2–3 · Abh.: HN-12 (`check-sediment.ts` liegt auf der Fläche) · Blocker: keiner (`scripts/archiv/`: kein David-Entscheid, siehe Befundliste).

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-20 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
