<!-- @posten
dach: QS-CI-MINUTEN
titel: HN-21 — Test-Hygiene: Selbstvergleiche, doppelte E2E, Skips, SSR-Smoke
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-21 (VS-18, PS-20, PS-21, PS-22, PS-23); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: VS-18, PS-20, PS-21, PS-22, PS-23 (tief · EA).
- Dateien: 51 Zusicherungen `expect(f(x)).toEqual(f(x))` (13 Property-Dateien + 30 weitere; Liste `soll-und-laeufe/pruefsystem/laeufe/selbstvergleiche.tsv`) nicht als Abdeckung zählen; `pdf.test.ts:381–425` (PDF-Generatoren nach `scripts/`); `e2e/w224-plus-reiter.e2e.ts:70–119` gegen `w224-r14-reiter-modell.e2e.ts:96–107, :161 ff.`; `e2e/materialien-m1…m4`; `zh-pdf-runde2/3/4` + `zh-pdf-seitenmontage`, `zh-211.11-staffel` + `zh-streitwert-staffel`; 12 `goto` mit `?leser=v3`; `e2e/leser-optionen.e2e.ts:343` (Skip → `expect(anzahl).toBeGreaterThan(0)`); `e2e/kein-abschnitt.e2e.ts:80–87, :347` (Obergrenze für Werkzeugfehler); `scripts/smoke-render.tsx` (Seitenliste aus der Routen-SSoT, 22 fehlende Seiten).
- Klasse bau (Tests) · Tests zu Risiko-Engines (ZH-PDF, Staffeln) → GP · §6.3: keine Assertion geht verloren (`scripts/analyse/test-assertion-diff.ts`); Zusammenlegen als deklarierter `test(`-Commit.
- PRs 1–2 · Abh.: — · Blocker: keiner.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-21 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
