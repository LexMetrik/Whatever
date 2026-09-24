<!-- @posten
dach: W2·27-BUND-FERTIG
titel: HN-22 — Normtext-Typografie und Anzeige ganz aufgehobener Artikel
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-22 (NT-12, NT-13, NT-14); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: NT-12, NT-13, NT-14 (tief · EA).
- Dateien: `scripts/normtext/html-entities.ts:20–21, :31` und `extrahiere-fedlex.ts:970` (geschützte Leerzeichen erhalten, die Anzeige entscheidet); `extrahiere-fedlex.ts:944–947` (Hoch/Tief nur neben Ziffern trennen); `:399, :1611` (kein «…», amtlicher Aufhebungsvermerk); `fussnoten-extrahiere.ts:63`.
- Klasse daten · Risikopfad ja → GP · nicht neutral (Re-Extraktion aller Erlasse, Golden-Normtext deklariert neu).
- Bündeln mit der nächsten Voll-Re-Extraktion (Pin-Nachzug oder `W2·5n-BUND-VOLL`), **nicht** mit HN-05 — sonst verdeckt der Typografie-Diff die echten Fixes.
- PRs 1–2 · Abh.: HN-05 · Blocker: keiner.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-22 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
