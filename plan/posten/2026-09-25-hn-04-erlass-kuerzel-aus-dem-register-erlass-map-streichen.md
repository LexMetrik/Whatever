<!-- @posten
dach: QS-KORPUS
titel: HN-04 — Erlass-Kürzel aus dem Register (ERLASS_MAP streichen)
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-04 (VS-01, VS-20); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: VS-01 (mittel · b; amtlich falsch, Fedlex `shortForm` «DesG»); Beifang VS-20 Snapshot-Teil (tief · EA).
- Dateien: `scripts/normtext-snapshot.ts:79–260` (ERLASS_MAP, 171 Einträge = Register), `:1384–1385` (Rückfall `toUpperCase`), `:360, :366–368` (Zeilenverweise → Marker-Namen); `src/lib/normtext/register.ts` (231 Kürzel); `public/normtext/bund/*.json` (37 Erlasse, Feld `erlass`); `src/components/NormPopover.tsx:108, :133`.
- Klasse daten · Risikopfad ja → GP · nicht neutral (37 Felder, gewollt).
- Tests/Golden: Snapshot-Diff genau 37 Dateien, nur Feld `erlass`, sonst byte-gleich (`datenhaltung:doppellauf`, `check:golden-normtext`); Stichprobe DESG → DesG, BOEB → BöB, FINFRAG → FinfraG, APOSTILLE → Apostille-Übk., HAUE → HAdoptÜ.
- Nebenwirkung: −≈ 180 Zeilen in der Grenzdatei `normtext-snapshot.ts` (0 Zeilen Luft laut VS-02) — Rückbau zuerst.
- PRs 1 · Abh.: HN-03 · Blocker: keiner.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-04 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
