<!-- @posten
dach: W2·31-BILDSCHIRMBREITE
titel: Startseite @1280 + Seitenleiste 460 Skala 1.4: Kachel 113 px breit, 1224 px hoch, Seite springt beim Aufklappen auf sy=330 (Prüfer #1162 N1, main=PR)
anlass: Session-Notizen 2026-09-30
-->

Startseite @1280 + Seitenleiste 460 Skala 1.4: Kachel 113 px breit, 1224 px hoch, Seite springt beim Aufklappen auf sy=330 (Prüfer #1162 N1, main=PR)

**Stand 1.10.2026 (W2·31 P15, teilweise):** die Breitenursache ist behoben — die Startseite schaltet im Einzelfenster auf Zweispaltigkeit nach ihrer EIGENEN Breite (`@container/start`, Schwelle 960 px, `Startseite.tsx`) statt nach dem Fenster. Gemessen Skala 1.4, @1280×1200 mit Seitenleiste 460: vorher Kachel 113 px breit (Blatt 2470 px hoch), nachher einspaltig, Kachel 360–365 × 415–422 px, Blatt 753 px breit (`.gate/p15-messung-skala14-nachher.txt`). OFFEN bleibt U13 bei Skala 1.4 selbst (Blatt-Unterkante 1196–1247 px bei 1200 px Fenster, Gesetze-Wahl 143 px Überlauf im Blatt, Werkzeuge 123 px) — hängt am David-Entscheid zum Posten «U13 bei Schriftskala 1.4» ([D], unverändert).
