<!-- @posten
dach: W2·31-BILDSCHIRMBREITE
titel: Startseite Gesetze-Blatt: Kantone-Spalte wirkt @1536–1920 um die feste 216-px-Karte leer
anlass: Session-Notizen 2026-09-30
-->

nicht lösbar ohne Umbau der Spalten-Höhenverteilung, 0 px U13-Reserve gemessen (Rest-Teil des Postens, #1157).

**Messung W2·31 J (30.9.2026, Ergänzung):** @1536–1920 Standardschrift, Karte 216×153, Spalten alle 419 px (subgrid, Bund-Liste bestimmt); Gesetze-Wahl natürlich 469 px; Reserve 27 px (Korrektur 30.9.2026 Gegenprüfung: 528 − 2×16 Padding = 496 Innensicht; 496 − 469 = 27 px — die frühere Schreibweise «in 528 px Inhaltssicht» rechnete ohne Padding) (nicht 0: «scrollHeight === clientHeight» misst die gestreckte Stufe, nicht die natürliche Höhe). Deckel `2xl:max-w-[15.5rem]` aufgehoben: Karte 340×240, Spalte 484 px, Inhalt 534 > 528 → −38 px Überlauf (U13 rot). Ohne Überlauf wüchse die Karte höchstens um 22 px (Kantone-Spalte liegt unter der Bund-Spalte) + 27 px Reserve auf ≈ 285×202 px — das verbrauchte die letzte Reserve (@1280 und 1536 mit Seitenleiste nur 8 px) und die Spalte (372 px) bliebe breit leer. Nicht lösbar ohne Umbau der Höhenverteilung (z. B. Karte höhenbegrenzt + «Alle 26 Kantone» neben statt unter der Karte); Posten bleibt offen.
