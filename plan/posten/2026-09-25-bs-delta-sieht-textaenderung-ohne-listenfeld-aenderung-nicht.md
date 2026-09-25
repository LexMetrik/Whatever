<!-- @posten
dach: QS-KORPUS
titel: BS-Delta sieht Textänderung ohne Listenfeld-Änderung nicht
anlass: PR #1112
-->

Grenze des reparierten entscheide:bs --delta (PR #1112, scripts/rechtsprechung/bs-delta.ts Kopf): der Plan vergleicht nur die Listenfelder (GN, Sekundär-GN, Datum, Erstpublikation, Aktualisierung, Titel). Ändert das Portal einen Dokumenttext ohne eines davon zu ändern (oder entzieht es ein Entscheiddatum), bleibt der Snapshot stehen. Messung 25.9.2026: alle 8 Textänderungen trugen ein neues Aktualisierungsdatum — die Grenze ist bisher nicht belegt verletzt. Wurzel-Fix: periodischer Voll-Abgleich (Content-Hash-Probe: Roh-HTML holen, abschnitte-sha gegen Bestand, ohne zu schreiben) z.B. monatlich oder als Stichprobe je Delta-Lauf.
