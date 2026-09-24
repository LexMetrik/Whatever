<!-- @posten
dach: QS-BASIS
titel: HN-10 — Tor-Pfad schliessen (W-02 b vollständig umsetzen)
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-10 (PS-01); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: PS-01 (hoch · b).
- Dateien: `scripts/gegenpruefung/kern.ts:226–242` (Tor-Pfad-Liste), `:362–373` (`istPruefLogik`: «Basename enthält check»), `:391–393`; `src/tests/gegenpruefung.test.ts`.
- Aufzunehmen: `package.json` (scripts-Block), `vite.config.ts`, `playwright.config.ts`, `e2e/flake-ausnahmen.json`, `e2e/flake-modus.json`, `scripts/check-e2e-flake.ts`, `scripts/tor-paritaet-sonden.ts`, `scripts/check-tor-paritaet.ts`, `scripts/run-parallel.ts`, `scripts/logik-sweep.ts`, `scripts/tarif/tarif-drift.ts`, `golden/normtext-snapshot.json`, `src/tests/abnahmeGate.test.ts` und die Rechtsdaten-Tore `check-besetzung`, `check-entscheide`, `check-stand-zukunft`, `check-leerstellen`, `check-drift`, `check-paritaet`, `check-entstehung`, `check-bs-materialien`.
- Klasse bau (Tor) · Tor-Pfad → GP Pflicht; **Selbstbezug**: der PR ändert `kern.ts` und fällt selbst unter die neue Regel → GP von Hand anordnen (wie bei RL-02) · verhaltensneutral ja (Produkt).
- Tests: Klassifizierer-Test je neuem Pfad `true`, Gegenprobe (z. B. `src/components/*.tsx`) `false`; Rot-Beweis §6.7: neue Erwartungen gegen den alten `kern.ts` rot.
- Kosten: nur der scripts-Block von `package.json` (Dependabot ändert `dependencies` und bleibt ohne GP-Pflicht); kann der Klassifizierer nur ganze Dateien, im Bau entscheiden und im PR offenlegen. Steuerfläche: `kern.ts` zählt nicht — kein Rückbau nötig.
- PRs 1 · Abh.: — · Blocker: keiner (W-02 b deckt den Entscheid).

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-10 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
