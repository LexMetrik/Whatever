<!-- @posten
dach: QS-BASIS
titel: HN-11 — Prod-Zugänge schützen: Such-API ohne Fehlerdetails, Vercel-CLI mit fester Version
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-11 (SA-05, ZP-SA-N1, ZP-SA-N2, ZP-SA-N3); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: SA-05 (mittel · b); ZP-SA-N1 (mittel · b — HN-00 bestätigt 25.9.2026); Beifang ZP-SA-N2, ZP-SA-N3 (tief).
- Dateien: `api/suche.ts:169` (`detail: String(e)` weg, dafür serverseitig `console.error` — sonst verschwindet die einzige Diagnosespur), `:83–84` (Fehler einer SQL-Anweisung → 200 mit 0 Treffern: offenlegen); `.github/workflows/ci.yml:1646, :1648, :1653` (`npx -y vercel@latest` → feste Version bzw. devDependency), `:1611–1626` (`VERCEL_TOKEN` von der Job- auf die Schritt-Ebene); `scripts/datenhaltung/check-turso-frische.ts:18–19`, `turso-skip.ts:35, :233` (Kommentare nachführen); `docs/betrieb/env-inventar.md:12, :35`.
- PR-Schnitt: **PR a** (bau) Such-API + Doku-Drift · **PR b** (bau, Tor-Pfad) Deploy-Job.
- Risikopfad: `api/suche.ts` nein (GP empfohlen), `ci.yml` Tor-Pfad → GP Pflicht · nicht neutral (Antwortkörper).
- Tests: Unit-Test mit gemocktem `fetch` — Token mit eingebettetem LF/CR → der Antworttext enthält ihn nicht; 502 ohne `detail`; `prod-smoke` unverändert (liest nur Status und Content-Type). Deploy-Job: nach dem Merge das Deploy-Log prüfen.
- Steuerfläche: PR b ≈ byte-neutral (Versionsnummer statt «latest»).
- PRs 1–2 · Abh.: HN-00 nur für den N1-Teil (formal) · Blocker: keiner; der Turso-Lese-Token (David, bestehend) mindert die Tragweite, blockiert aber nichts.

**HN-00 erledigt 25.9.2026:** Die Zweitprüfung (Sonnet, `berichte/zweitpruefung-nachzug-hn00.md` im Projektordner) hat PS-02, PS-06, PS-07, PS-08, PS-11, PS-12, VS-02, VS-03 und ZP-SA-N1 bestätigt, keiner widerlegt — Abhängigkeiten auf HN-00 sind erfüllt.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-11 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
