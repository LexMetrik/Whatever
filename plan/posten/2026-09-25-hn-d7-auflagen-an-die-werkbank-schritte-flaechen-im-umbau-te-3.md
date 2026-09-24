<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: HN-D7 — Auflagen an die Werkbank-Schritte (Flächen im Umbau) (Teil NACHLAUF)
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-D7 (DK-19, DK-20, VS-09, VS-15, PS-16, DK-25, DK-28); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

*(keine eigene Arbeit — in die laufenden W2·29-Scheiben)*

Gemeinsam für alle Design-Einheiten: Massstab ist das Reglement in der Fassung vom 23.9.2026 (F0.5 «Rundung mit Mass»: 4 · 8 · 10 · 14 px, Pille — nicht «Radius 0»). Klasse bau, Risikopfad nein (ausser `src/lib/fedlex/**`), Normtext-Körper golden byte-gleich, GP empfohlen bei geteilten Bausteinen. e2e-Selektoren und Screenshot-Basislinien ziehen mit (vor dem Push alle Sonden auf den alten Selektor greppen; Leser-Änderungen in allen Ansichtsmodi prüfen); vor dem Push `npx vitest run src/tests/design-`.

- **An `W2·29-WERKBANK-NACHLAUF`** (CSS-Querschnitt, Dunkel-Paket): DK-19 benannte Umbruch-Tokens (480 px überlappt); DK-20 + VS-09 gemeinsam (Tokens anschliessen oder streichen, Abschnitt 5); VS-15 `index.css` in Schicht-Dateien (Skizze VS-15), `e2e/` und `.css` in `check:schlankheit` (UD → nach HN-13); PS-16 Farbwelt scharf schalten, sobald `danger-500/paper` dunkel ≥ 3:1 (heute 2,80), RISS-Basislinie 2,72 → 2,80; bestehende Posten ergänzen: «Registerstrich + Radius» (DK-25: `ArtikelBody.tsx:402–405, :647`) und Favicon (DK-28: Papierwert `#FDFCFA`, PNG-/apple-touch-icon-Rückfall).
- Befunde: DK-19, DK-20, VS-09, VS-15, PS-16, DK-25, DK-28 (tief · EA).
- PRs +1–3 in Werkbank-PRs · Abh.: jeweilige Scheibe · Blocker: W-HN-3 (nur DK-26); HN-DESIGN-NACHZUG (nur DK-09).

DK-28 Favicon hat keinen bestehenden Posten und steht darum hier: Papierwert `#FDFCFA`, PNG-/apple-touch-icon-Rückfall. DK-25 als Ergänzung im Posten «Muster Registerstrich + Radius»; HN-D2 als Ergänzung in «Titelschrift klären» und «Zwei Band-Rezepte».

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-D7 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
