<!-- @posten
dach: QS-TORE-DIAET
titel: HN-15 — `tor:bewaehrung` reparieren (Voraussetzung der Tore-Diät)
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-15 (PS-11, PS-18); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: PS-11 (mittel · b — HN-00 bestätigt 25.9.2026); Beifang PS-18 (tief · EA).
- Dateien: `scripts/analyse/tor-bewaehrung.ts:235–265` (`stufeEin()` ohne Rechtsschutz-Ausnahme), `:739–752`, `:50–56`; `messwerte/tor-bewaehrung.json` (Phase 2 C5 frischt das Register auf, sofern GitHub erreichbar); Rechtsschutz-Liste aus `steuerflaecheKern.ts` übernehmen; Paritätsprüfung des Registers als `check:*` in `check:seriell`. PS-18 (ein CI-Schritt je Tor statt sieben Sammel-Schritte) nur, wenn die Fläche es nach HN-12 trägt — sonst die Messung über Schritt-Logs lösen; im Bau entscheiden.
- Klasse bau (Tor/Messung) · Risikopfad nein · neutral ja.
- Tests: `check:entscheide` ist kein Rückbau-Kandidat mehr; Rot-Beweis: Tor in `package.json` ohne Registereintrag → rot.
- Steuerfläche: `scripts/analyse` zählt, ≈ +1–2 KB (Schätzung) → nach HN-12.
- PRs 1 · Abh.: HN-00, HN-12 · Blocker: `QS-TORE-DIAET` hat `dep: [W2·29-WERKBANK-REST]`.

**HN-00 erledigt 25.9.2026:** Die Zweitprüfung (Sonnet, `berichte/zweitpruefung-nachzug-hn00.md` im Projektordner) hat PS-02, PS-06, PS-07, PS-08, PS-11, PS-12, VS-02, VS-03 und ZP-SA-N1 bestätigt, keiner widerlegt — Abhängigkeiten auf HN-00 sind erfüllt.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-15 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
