<!-- @posten
dach: W2·29-WERKBANK-LESER
titel: D2-Nachläufer: datumloser BS-Entscheid nur noch als Test-Fixture, BezugsBefund-Zähler nicht persistiert
anlass: Session-Notizen 2026-09-25 (LESER-Landungen, Session 4)
-->

(1) Seit #1072 (B-1 Deckblatt-Datum) trägt kein BS-Entscheid mehr datumUnbekannt (register.json 0, vorher 42); e2e/rechtsprechung.e2e.ts prüft den datumlosen Fall nur per page.route-Fixture auf BES.2025.17. Taucht wieder ein echter datumloser Entscheid auf, als Fixture zurückwechseln. (2) Nebenfund Gegenprüfung D2: die Zähler dublettenVerworfen/unpubliziertUmgelenkt werden weder in bezuege-bilanz.json noch im Log persistiert — für künftige Prüfungen festhalten (Risikopfad, Gegenprüfung).

**Abschluss 25.9.2026 (#1096):** (1) bestätigt — register.json ohne datumlosen Entscheid. (2) BezugsBefund-Zähler persistieren braucht Rechtsprechungs-Korpus-Neubau → eigener Posten unter BUND-FERTIG.

**Erledigt 2026-09-25:** PR #1096
