<!-- @posten
dach: QS-KORPUS
titel: HN-03 — Korpus-Prüfbarkeit zuerst: Golden-Prüfsummen hart, Tabellen-Untergrenze, NUL-Bytes
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-03 (PS-04, PS-09, PS-19); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: PS-04 (mittel · b), PS-09 (mittel · b, rezidivierend); Beifang PS-19 (tief · EA).
- Dateien: `scripts/check-golden-normtext.ts:37–39, :231–245` (DIAGNOSE wird Rot; Regeneration nur deklariert); `scripts/normtext/check-tabellen.ts:76–80, :86` (Untergrenze «kanonische Blöcke ≥ Basis», Parse-Fehler rot); literales NUL → `'\u0000'` in `scripts/datenhaltung/doppellauf.ts` (Byte 4253), `scripts/materialien/soft-law-projektion.ts` (7616), dazu laut Zweitprüfer `adapter-seco.ts` (9468) und `abk-aliase-generieren.ts` (40964).
- PR a (bau, Tore): Risikopfad nein, `check-golden-normtext.ts` ist Rechtsschutz-Tor → GP empfohlen; nicht neutral (Tor schärfer). PR b (mechanisch, NUL-Escape): Risikopfad ja → GP Pflicht; neutral → `datenhaltung:doppellauf` und Golden byte-gleich.
- Tests: PR a Rot-Beweis mit Fixture «Golden-sha manipuliert» (heute Exit 0; Fixtures beider Prüfer liegen vor) und Nullprobe `check:tabellen` im leeren Arbeitsverzeichnis (heute grün); PR b eine Rezidiv-Wache mit Rot-Beweis (Datei mit literalem NUL → rot) — Ort im Bau wählen (Vorfall c754e1c5e → 54b180daa).
- Steuerfläche: `check-golden-normtext.ts` zählt nicht zur Fläche (Rechtsschutz), wohl aber zum UD `scripts/check-*.ts` (4 B) → byte-neutral bauen (der DIAGNOSE-Zweig wird zum Rot-Zweig) oder nach HN-13.
- PRs 2 · Abh.: — · Blocker: keiner.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-03 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
