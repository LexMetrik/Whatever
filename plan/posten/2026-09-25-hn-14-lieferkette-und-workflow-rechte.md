<!-- @posten
dach: QS-BASIS
titel: HN-14 — Lieferkette und Workflow-Rechte
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-14 (SA-03, SA-01, SA-02, SA-04, PS-12); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: SA-03 (tief · b; 41 `uses:`); Beifang SA-01, SA-02, SA-04 (tief · EA); PS-12 (mittel · b — bestätigt 24.9. Orchestrator und 25.9. HN-00; Handgriff W-HN-4).
- Dateien: `.github/workflows/*.yml` (41 `uses:` auf Commit-SHA mit Versionskommentar; `.github/dependabot.yml:34–37` hält sie aktuell); `permissions: {contents: read}` für die Jobs bau, tore, e2e, e2e-ergebnis, perf, merge-schutz (oder ein Top-Level-Default); `vercel.json:14–24` `Permissions-Policy` (u. a. geolocation, camera, microphone, payment leer), `:22` Kommentar, warum `style-src 'unsafe-inline'` bleibt (55 `style={{`); GitHub-Einstellung: Pflicht-Kontext «Browser-Smoke (Ergebnis)» an App 15368 binden (David).
- Klasse bau (CI) · Tor-Pfad (Workflows) → GP Pflicht · verhaltensneutral ja.
- Tests: Workflow-Lauf grün (Nullprobe mit Doku-PR); nach Deploy zeigt `curl -sI` den Header `permissions-policy`.
- Steuerfläche: ≈ +2 KB (Schätzung) → nach HN-12.
- PRs 1–2 · Abh.: HN-12; HN-00 für PS-12 · Blocker: W-HN-4 nur für den Branch-Schutz-Handgriff.

**Stand 25.9.2026:** PS-12 bestätigt (`gh api repos/LexMetrik/Whatever/branches/main/protection/required_status_checks`: «Browser-Smoke (Ergebnis)» app_id null, die drei übrigen Pflicht-Kontexte app_id 15368; der Check-Run stammt von github-actions 15368 — die Bindung bricht nichts). Handgriff: eigener Posten W-HN-4 (wartet auf David).

**HN-00 erledigt 25.9.2026:** Die Zweitprüfung (Sonnet, `berichte/zweitpruefung-nachzug-hn00.md` im Projektordner) hat PS-02, PS-06, PS-07, PS-08, PS-11, PS-12, VS-02, VS-03 und ZP-SA-N1 bestätigt, keiner widerlegt — Abhängigkeiten auf HN-00 sind erfüllt.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-14 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
