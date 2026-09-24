<!-- @posten
dach: QS-BASIS
titel: HN-16 — Blinde Tore schärfen
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-16 (PS-03, PS-05, PS-13, PS-17, PS-25); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: PS-03, PS-05 (mittel · b); Beifang PS-13, PS-17, PS-25 (tief · EA).
- Dateien: `scripts/check-e2e-flake.ts:250` + `e2e/flake-ausnahmen.json` (Ausnahme an Testtitel oder Titelmuster binden); `scripts/tor-paritaet-sonden.ts:107–136` (Job-/Schritt-`if:`, `continue-on-error`, `||`-Schlucker; Teilmodus `-- --artefakt` als eigene Deckungsklasse); `scripts/check-tor-paritaet.ts:33` + `run-parallel.ts:170–173` (Allowlist-Grund für `check:schlankheit`); `scripts/bibliothek-check.sh:19, :37–38, :57–58` (`mktemp`, Link-Treffer statt Substring); `package.json` `lint` mit `--max-warnings=0` nach dem Fix der Warnung in `useUniversalSuche.ts:176`.
- Klasse bau (Tor) · Risikopfad nein; nach HN-10 sind `check-e2e-flake.ts`, `tor-paritaet-sonden.ts`, `run-parallel.ts` Tor-Pfad → GP Pflicht · neutral ja (Produkt).
- Tests: Fixture «neuer Flake in einer Ausnahme-Datei» → rot; Fixture-YAML mit `if: false`, `continue-on-error`, `|| true` → nicht PR-gedeckt (Rot-Beweis; die Fixtures beider Prüfer als Vorlage).
- Steuerfläche: ≈ +2–4 KB (Schätzung) → nach HN-12; UD → nach HN-13.
- PRs 1–2 · Abh.: HN-10, HN-12, HN-13 · Blocker: M-25-Handgriff (indirekt über HN-13).

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-16 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
