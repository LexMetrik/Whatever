<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: HN-D4 — Farbe und Kontrast: Text über AA, Registerfarbe, ein Farbrezept
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-D4 (DK-06, DK-15, DK-16, DK-17, DK-22); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

Gemeinsam für alle Design-Einheiten: Massstab ist das Reglement in der Fassung vom 23.9.2026 (F0.5 «Rundung mit Mass»: 4 · 8 · 10 · 14 px, Pille — nicht «Radius 0»). Klasse bau, Risikopfad nein (ausser `src/lib/fedlex/**`), Normtext-Körper golden byte-gleich, GP empfohlen bei geteilten Bausteinen. e2e-Selektoren und Screenshot-Basislinien ziehen mit (vor dem Push alle Sonden auf den alten Selektor greppen; Leser-Änderungen in allen Ansichtsmodi prüfen); vor dem Push `npx vitest run src/tests/design-`.

- Befunde: DK-06 (mittel · b); DK-15 (tief · EA; wartet auf W-HN-2), DK-16, DK-17, DK-22 (tief · EA).
- Dateien: DK-06 `ink-400`-Text → ink-500/600 in `MappenDialog.tsx:151`, `TabPanel.tsx:214` (die `entstehung/*`-Stellen `SynopseKarte.tsx`, `EntstehungsBlock.tsx`, `MaterialEntstehung.tsx` sind Alt-Block → Auflage `W2·29-WERKBANK-REST` S2); Tor: `text-ink-300|400` an Textknoten verbieten, `aria-hidden` ausgenommen (`scripts/check-design-tokens.ts:81` — SF und UD → nach HN-12/HN-13 oder als Vitest); DK-16 Flächen-Rolle «Tinte leise je Fläche» statt Selektorliste (`index.css:4219, :4679–4682`; `RubrikKachel.tsx:68–70`; `BlattBausteine.tsx:64`, seit #1069 geändert) und das Paar ins Farbwelt-Tor (`scripts/farbwelt-tabellen.ts:215–225`, nicht auf der Fläche); DK-17 `KuendigungTimeline.tsx:35, :102` Beschriftung in Tinte; DK-22 `Shell.tsx:449` `in oklab`; DK-15 nach W-HN-2.
- Neutral: ja (Werte) · Tests: Farbwelt-Paar `ink-500` auf Registerflächen (Rot-Beweis: heute 4,15–4,42:1).
- PRs 1–2 · Abh.: HN-12/HN-13 nur für den `check-design-tokens`-Teil · Blocker: W-HN-2 nur für DK-15.

DK-15 (Registerfarbe als Schrift) wartet auf den eigenen Posten W-HN-2.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-D4 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
