<!-- @posten
dach: QS-FREMDAGENTEN
titel: HN-19 — Fremdagenten-Werkzeuge zurückbauen
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-19 (VS-16); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
wartet-auf: david
-->

*(wartet auf W-HN-1)*

- Befunde: VS-16 (tief · EA).
- Dateien: `scripts/analyse/gemini-diskrepanz.ts` (618 Z.), `gemini-diskrepanz-text.ts` (553), `src/tests/gemini-diskrepanz-text.test.ts` (397), `fremdagenten-messung.ts` (643), `agy-status.ts` (41); bleibt: `kommentar-bilanz.ts` (234) + Test (172).
- Klasse mechanisch (Rückbau) · Risikopfad nein · neutral ja (ohne Produktwirkung) · Commit-Typ nicht `refactor(`, weil eine Testdatei fällt (§0 Ziff. 4) → `chore(`.
- Tests: `tsc -b` grün; verbleibende Vitests grün; Fremd-PR-Tor probeweise rot (Rot-Beweis der Kommentar-Bilanz).
- Steuerfläche: ≈ −76 KB (Grössen aus bauplan-inventar §1) — grösster Einzelhebel; bei Davids Ja **vorziehen** (vor HN-14).
- PRs 1 · Abh.: — · Blocker: W-HN-1.

Wartet auf David (W-HN-1): Werkzeuge für fremde Agenten zurückbauen? Empfehlung (a) zurückbauen, Kommentar-Bilanz behalten; Wirkung ≈ −76 KB Steuerfläche.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-19 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
