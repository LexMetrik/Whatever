<!-- @posten
dach: QS-BASIS
titel: HN-17 — CI-Integrität: Bau-Ergebnis, ZH-PDF-Zweitlesung, Squash-Schutz, Wächter-Quittung, Gate-Ausgabe
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-17 (PS-02, PS-06, PS-08, PS-14, PS-15); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: PS-02, PS-06, PS-08 (mittel · b — HN-00 bestätigt 25.9.2026; PS-08: 15/15 Schedule-Läufe rot 10.–24.9.); Beifang PS-14, PS-15 (tief · EA).
- Dateien: `ci.yml:875–879, :1404–1408, :1430, :1470–1477` (`bau` in die `needs` von `e2e-ergebnis`, «bau ≠ success bei art ≠ doku ⇒ rot», falscher Kommentar datiert ergänzt), `:316` (`^scripts/cowork/` zeigt ins Leere), `:822–823` (Squash-Schutz: API-Fehler rot oder SKIP statt grün), `:1071–1087`; `scripts/gate.sh:109–119, :139–143` (Fälligkeitszahl in die ok-Zeile), `:159–167`; `package.json` `check:netz:kette` (ZH-PDF-Teil als Netz-Glied, Cache im Lauf füllen); `.github/workflows/waechter.yml:176–190` + `scripts/check-ci-laeufe.ts:255–306` (befristete Quittung je Workflow, höchstens 14 Tage, mit Grund und Posten; neues oder abgelaufenes Rot färbt und öffnet einen eigenen Zettel).
- Klasse bau (CI/Tor) · Tor-Pfad → GP Pflicht · neutral ja.
- Tests: Rot-Beweis per Test-PR mit Typfehler in `scripts/plan` → `e2e-ergebnis` rot; Squash-Schutz mit simuliertem API-Fehler → nicht grün; Wächter: neues Rot trotz bestehender Quittung → rot.
- Steuerfläche: `ci.yml` und `gate.sh` zählen (≈ +1–3 KB, Schätzung); `waechter.yml` und `check-ci-laeufe.ts` sind Rechtsschutz (nicht auf der Fläche, `check-ci-laeufe.ts` aber im UD) → nach HN-12 und HN-13.
- PRs 1–2 · Abh.: HN-00, HN-12, HN-13 · Blocker: keiner.

**HN-00 erledigt 25.9.2026:** Die Zweitprüfung (Sonnet, `berichte/zweitpruefung-nachzug-hn00.md` im Projektordner) hat PS-02, PS-06, PS-07, PS-08, PS-11, PS-12, VS-02, VS-03 und ZP-SA-N1 bestätigt, keiner widerlegt — Abhängigkeiten auf HN-00 sind erfüllt.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-17 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
