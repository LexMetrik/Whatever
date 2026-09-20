<!-- @posten
dach: W2·18-FEHLERBUCH
titel: Bund-Pfad löst «Art. 9 BMV» auf die aufgehobene Fassung auf
anlass: Gegenprüfung #833, 12.9.2026
-->

  - [ ] **Bund-Pfad löst «Art. 9 BMV» auf die aufgehobene Fassung auf** *(Gegenprüfung #833, 12.9.2026)* — `src/lib/fedlex/tabelle.ts` löst das Kürzel weiterhin auf die per 1.3.2026 aufgehobene Fassung `cc/2009/423` auf, obwohl `aufhebungen.ts` die Nachfolge kennt. Die in #823 gebaute Fassungs-Reihe (`normKeyFuerAbk` mit Datum) auch im Verweis-Resolver nutzen bzw. auf die geltende Fassung mit Datumskontext auflösen.
