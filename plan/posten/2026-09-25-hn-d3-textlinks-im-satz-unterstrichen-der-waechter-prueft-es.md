<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: HN-D3 — Textlinks im Satz unterstrichen, der Wächter prüft es
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-D3 (DK-03); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»); Umsetzungs-Go David 24.9.2026 «ja unbedingt» (übermittelt vom Orchestrator)
-->

*(Go David 24.9.2026, übermittelt)*

Gemeinsam für alle Design-Einheiten: Massstab ist das Reglement in der Fassung vom 23.9.2026 (F0.5 «Rundung mit Mass»: 4 · 8 · 10 · 14 px, Pille — nicht «Radius 0»). Klasse bau, Risikopfad nein (ausser `src/lib/fedlex/**`), Normtext-Körper golden byte-gleich, GP empfohlen bei geteilten Bausteinen. e2e-Selektoren und Screenshot-Basislinien ziehen mit (vor dem Push alle Sonden auf den alten Selektor greppen; Leser-Änderungen in allen Ansichtsmodi prüfen); vor dem Push `npx vitest run src/tests/design-`.

- Befunde: DK-03 (mittel · b).
- Dateien: `TagerechnerRueckverweis.tsx:11`, `ThemenEinstieg.tsx:26`, `vorlagen/PassendeRechner.tsx:27` (`no-underline` → `.lc-link`); 35 Klassenzeilen `hover:underline` ohne Grundstrich in 23 Dateien (u. a. `VorlageVollmacht.tsx:67, :69, :217, :218, :270`, `VorlageSchlichtungsgesuchBs.tsx:613`; Leser-Kontext `KontextPanel.tsx:579, :645`, `VerweisKontext.tsx:83, :107` → Sonde LESER); Wächter `src/tests/design-r9-link-form.test.ts:41` auf «Textlink im Fliesstext ohne Strich» erweitern.
- Neutral: ja · Tests: Rot-Beweis — der erweiterte Wächter ist heute rot (3 Bausteine + 35 Zeilen) und danach grün.
- Steuerfläche: der Wächter ist ein Vitest in `src/tests` und liegt **nicht** auf der Steuerfläche — kein Rückbau nötig. Wählt der Bau stattdessen ein Tor in `scripts/check-*.ts`, dann hinter HN-12/HN-13.
- PRs 1 · Abh.: — · Blocker: keiner.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-D3 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
