<!-- @posten
dach: W2·20-VERWEIS-SCHAERFE
titel: HN-09 — Verweis-Ziele: Schlussbestimmungen und Kurztitel ohne falsche Links
anlass: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN HN-09 (NT-08, NT-09); Einbuchung: Go David 24.9.2026 («gleich die befunde einbaust»)
-->

- Befunde: NT-08, NT-09 (mittel · b; NT-09 bekannt V-7, neu belegt).
- Dateien: `src/pages/gesetz-leser/inhalt-sprung.tsx:381` (`tokenMap`); `src/components/NormText.tsx:207` (`ART_INTERN`); `src/lib/fedlex/positivliste.ts`.
- PR-Schnitt: **PR a** (bau) in `disp_*`-Artikeln bare «Artikel N» zuerst gegen die Geschwister derselben Schlussbestimmung auflösen, «des Schlusstitels des Zivilgesetzbuches» als Fremdziel, sonst Text statt Link (§1: kein Link ist besser als ein falscher) · **PR b** (daten, Risikopfad) Positivliste: Nominativ-Kurztitel mit Korpus-Ziel (Kollektivanlagengesetz, Chemikalienverordnung) und «Verordnung (EU) …» als Fremd-Signal.
- Risikopfad: PR a nein (GP empfohlen), PR b ja → GP · nicht neutral.
- Tests: Render der echten `NormText`-Komponente (Methode des Zweitprüfers): UeB 2019 Art. 7 «Artikel 4» → disp_u9 Art. 4 oder kein Link; Gegenprobe «Artikel 622» → OR 622; «Artikel 697i des bisherigen Rechts» bleibt ohne Link (V-5); SchKG 39 → KAG 36; ChemRRV Anh. 1 Ziff. 17 → ChemV 2; «Verordnung (EU) 2018/858» → kein Link; BGG 123/124 «Kernenergiehaftpflichtgesetz» → nicht BGG 5.
- PRs 1–2 · Abh.: Kollision `W2·29-WERKBANK-LESER` (`NormText.tsx`, `inhalt-sprung.tsx`) — Sonde §0 Ziff. 5, offene LESER-PRs zuerst landen; gleiche Session wie HN-D1 (gleiche Datei), HN-09 zuerst · Blocker: keiner.

NT-09 zusätzlich als Ergänzung im Posten «V-7-Folgen» (2026-09-20-v-7-folgen.md) vermerkt.

Quelle: Herz-und-Nieren-Prüfung 24.9.2026, UMSETZUNGSPLAN.md Einheit HN-09 (Projektordner `~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/`; Belege in BEFUNDLISTE.md und berichte/). Kürzel: NT normtext-treue · PS pruefsystem · VS verschlankung · SA sicherheit-a11y · DK design-konsistenz · RR rechtslogik-rest; b = zweitgeprüft bestätigt, EA = nur Erstprüfer (vor dem Fix reproduzieren, sonst fällt der Beifang mit Begründungszeile im PR weg). Zeilenangaben Stand main 1d6eeb3c5 (24.9.2026) — vor dem Bau nachmessen.
