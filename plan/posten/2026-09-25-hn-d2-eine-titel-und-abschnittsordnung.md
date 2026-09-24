<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: HN-D2 — Eine Titel- und Abschnittsordnung
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-D2 (DK-07, DK-10, DK-18); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»); Umsetzungs-Go David 24.9.2026 «ja unbedingt» (übermittelt vom Orchestrator)
-->

*(Go David 24.9.2026, übermittelt)*

Gemeinsam für alle Design-Einheiten: Massstab ist das Reglement in der Fassung vom 23.9.2026 (F0.5 «Rundung mit Mass»: 4 · 8 · 10 · 14 px, Pille — nicht «Radius 0»). Klasse bau, Risikopfad nein (ausser `src/lib/fedlex/**`), Normtext-Körper golden byte-gleich, GP empfohlen bei geteilten Bausteinen. e2e-Selektoren und Screenshot-Basislinien ziehen mit (vor dem Push alle Sonden auf den alten Selektor greppen; Leser-Änderungen in allen Ansichtsmodi prüfen); vor dem Push `npx vitest run src/tests/design-`.

- Befunde: DK-07 (mittel · b); Beifang DK-10, DK-18 (tief · EA).
- Dateien: Titel-Tabelle (Stufe → Schriftfamilie/Gewicht) ins `DESIGN-REGLEMENT.md`, §R-4 (`:1564`) und §R-11 (`:1637–1638`) auf Ist ziehen (Ergebnis-Titel bleibt h2 wegen axe heading-order); `SeitenTitel.tsx:41, :51` (nur `LesemodusOverlay.tsx:182` zieht die Voreinstellung «display», `EntscheidLeser.tsx:663` setzt dieselbe Zitierung in Serif); `src/index.css:1266`, `:4218` (`.ub-kopf h1` Gewicht 400), `:4502–4508` (`.lc-randtitel`); `vorlagen/wizard.tsx:190` → `AbschnittKopf.tsx:21`; Formular-Unterabschnitte h4 (`VerzugszinsForm.tsx:174`, `SperrereignisseEditor.tsx:35`, `KombinierteAnsicht.tsx:183`) gegen `.lc-overline`; `ZweiachsigerEinstieg.tsx:41` (letzte Versal-Etikette → `.lc-overline`).
- Neutral: ja (kein Inhalt; sichtbar ja) · Tests: Überschriften-Signatur je Stufe als Test in `src/tests` (nicht in `scripts/check-*.ts`, sonst hinter HN-12/HN-13); Screenshot-Basislinien.
- PRs 2 (Reglement + Bausteine · Aufrufer) · Abh.: — · Blocker: keiner.
- Flächen im Umbau: Leser-Kopf → Auflage `W2·29-WERKBANK-LESER`; Entscheid- und Material-Kopf → `W2·29-WERKBANK-REST`.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-D2 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
