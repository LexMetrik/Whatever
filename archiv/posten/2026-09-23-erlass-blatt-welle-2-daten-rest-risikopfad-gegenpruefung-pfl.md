<!-- @posten
dach: W2·29-WERKBANK-LESER
titel: Erlass-Blatt Welle 2 Daten-Rest (Risikopfad, Gegenprüfung Pflicht): M-4 PatG-Botschaft 04.054 statt 05.082, M-5 Mantel-Botschaften nur 1 Erlass, M-7 BBl-Fundstelle, B-12 Änderungen-Stand durchreichen, Beschlussdatum, D2 Bezüge (B-1 Datum, E-1 fremde BGE unter OR 41, E-7 Dubletten), D3 Regesten-Teil, AN-1/2/5/6/13
-->

Erlass-Blatt Welle 2 Daten-Rest (Risikopfad, Gegenprüfung Pflicht): M-4 PatG-Botschaft 04.054 statt 05.082, M-5 Mantel-Botschaften nur 1 Erlass, M-7 BBl-Fundstelle, B-12 Änderungen-Stand durchreichen, Beschlussdatum, D2 Bezüge (B-1 Datum, E-1 fremde BGE unter OR 41, E-7 Dubletten), D3 Regesten-Teil, AN-1/2/5/6/13

**Nachtrag 24.9.2026 (Session LESER):** Teil D2 ist fertig gebaut, aber nicht eingereicht: Zweig `feat/w229-leser-s6-d2-bezuege` (3 Commits: 4098c0d6d Projektionen-Drift AVG · e75e88143 BS-Entscheiddatum aus dem Deckblatt statt 01.01., 42 Dokumente, B-1 · d27da9667 E-1 unpublizierte Erwägungen aufs Volltext-Urteil, 12 414 BGE-Kanten umgelenkt, E-7 Dubletten). Basis ist der alte #1006-Kopf 5182e9916 → `git rebase --onto origin/main 5182e9916`, Projektionen neu erzeugen, dann Gegenprüfung (Klasse daten, anderes Modell) und Hand-Einreihen. Eigene Daten-Session, nicht zusammen mit UI-Bau (sortenrein). Dazu neu: Risikopfad-Kanten `mietrecht` ↔ Art. 257d/257f OR und `gewaehrleistung` ↔ Art. 219a OR nachtragen — `src/lib/normtext/werkzeuge.ts:301-305` stellte sie zurück «bis der Funktionszeilen-Leser suffix-exakt vergleicht»; seit #1006 (randNotizWerkzeuge trifftArtikel) und #1045 (Blatt-Werkzeuge artikelscharf) erfüllt.

**Nachtrag 24.9.2026 abends:** Kanten `mietrecht` ↔ Art. 257d/257f OR und `gewaehrleistung` ↔ Art. 219a OR sind mit #1056 (Gegenprüfung bestanden) erledigt. Offen bleiben M-4, M-5, M-7, B-12, Beschlussdatum, D2 (Zweig unverändert, eigene Daten-Session), D3, AN-1/2/5/6/13.

**Abschluss 25.9.2026 (#1096, Gegenprüfung Sonnet bestanden, live 1866236f):** M-4 (Typ-200-Regel, 05.082), M-5 (normKeys aus Fedlex-Auswirkungen, 222 Botschaften), M-7 (`fundstelle` 409/409), AN-2 (46 Dokumentdaten), AN-13 (Signaturen W01-006D/W02-008D) gefixt; Stichprobe 26/26. AE-9-Beschlussdatum und B-12-Stand: Daten liegen vor, Anzeige → NACHLAUF. Offen und umgehängt: D3 Regesten-Teil, D2-Nachläufer (2), Kanten-Shards-Neuprojektion → BUND-FERTIG; M-5-Rest (Deckel) und AN-1 (ersetzte Kreisschreiben) → eigene Posten «wartet auf David».

**Erledigt 2026-09-25:** PR #1096
