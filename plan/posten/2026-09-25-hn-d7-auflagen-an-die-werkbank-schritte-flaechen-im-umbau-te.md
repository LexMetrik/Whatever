<!-- @posten
dach: W2·29-WERKBANK-REST
titel: HN-D7 — Auflagen an die Werkbank-Schritte (Flächen im Umbau) (Teil REST)
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-D7 (DK-09, DK-06, DK-21, VS-08); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

*(keine eigene Arbeit — in die laufenden W2·29-Scheiben)*

Gemeinsam für alle Design-Einheiten: Massstab ist das Reglement in der Fassung vom 23.9.2026 (F0.5 «Rundung mit Mass»: 4 · 8 · 10 · 14 px, Pille — nicht «Radius 0»). Klasse bau, Risikopfad nein (ausser `src/lib/fedlex/**`), Normtext-Körper golden byte-gleich, GP empfohlen bei geteilten Bausteinen. e2e-Selektoren und Screenshot-Basislinien ziehen mit (vor dem Push alle Sonden auf den alten Selektor greppen; Leser-Änderungen in allen Ansichtsmodi prüfen); vor dem Push `npx vitest run src/tests/design-`.

- **An `W2·29-WERKBANK-REST`** (Druckansicht, Entscheid-Leser, Materialien, Alt-Stylesheet-Reste): DK-09 (mittel · EA; erst HN-DESIGN-NACHZUG Sonde D) Druck aus dem Dunkelmodus — im Druckblock `index.css:1976–2008` die hellen Tinten-Token erzwingen, Test Druck × dunkel; DK-06-Code in `entstehung/*` (S2); Umzug der Ladeanzeige (DK-21); VS-08 tote Klasse `.lc-scrollrand-grund-surface` (`index.css:2896`) und Kommentare aus der Sediment-Suche (`check-sediment.ts:100–108`; REST verlangt «`check:sediment` grün ohne Ausnahme»; UD → nach HN-13); den bestehenden Posten Kontrast `.lc-termin-ring`/`.text-auf-gold` **vorziehen** — er blockiert Dependabot #918 und damit Updates der Browser-Tests.
- Befunde: DK-09 (mittel · EA); DK-06-Code in entstehung/*, DK-21, VS-08 (tief · EA).
- PRs +1–3 in Werkbank-PRs · Abh.: jeweilige Scheibe · Blocker: W-HN-3 (nur DK-26).
- Stand 25.9.2026: Blocker HN-DESIGN-NACHZUG (DK-09) entfällt — Live-Nachmessung bestätigt DK-09: Druck aus dem Dunkelmodus setzt Fliesstext #E2E0DC auf Weiss (1.32:1; hell 15.68:1), Gesetzes- UND Entscheid-Leser (Bericht `berichte/design-nachzug-2026-09-25.md` im HN-Projektordner, Meldung Session QS-KORPUS). Fix in REST S3 (Druck), Test Druck × dunkel.

Dazu aus HN-D4 (DK-06): `ink-400`-Text in `entstehung/*` (SynopseKarte.tsx, EntstehungsBlock.tsx, MaterialEntstehung.tsx) auf ink-500/600, wenn S2 den Alt-Block umbaut. Aus HN-D5: Ladeanzeige auf Entscheid-Leser, Materialien, Rechtsprechung aus dem einen Baustein. Der Kontrast-Posten (Dependabot #918) trägt den Vorzieh-Vermerk.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-D7 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
- Stand 25.9.2026 (REST S2): DK-06 erledigt (ink-400→ink-500 in entstehung/*, 5.57:1 hell / 5.32:1 dunkel), VS-08 Klasse `.lc-scrollrand-grund-surface` gelöscht; offen: VS-08-Rest `check-sediment.ts` zählt Kommentare, DK-09 (S3), DK-21 Ladeanzeige (S1 + Gesetze.tsx), Kontrast-Posten Dependabot #918 (S3).
