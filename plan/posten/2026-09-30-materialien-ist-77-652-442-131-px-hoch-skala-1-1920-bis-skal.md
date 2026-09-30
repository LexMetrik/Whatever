<!-- @posten
dach: W2·31-BILDSCHIRMBREITE
titel: /materialien ist 77'652–442'131 px hoch (Skala 1 @1920 bis Skala 1.4 @375)
anlass: Session-Notizen 2026-09-30
-->

Ursache ungeklärt, Geräte-Last/§15 prüfen (Bau L #1174)

**Stand 30.9.2026 (W2·31 P6, teilweise):** Ursache gefunden und reproduziert — `Materialien.tsx` renderte alle 1'684 Register-Einträge als Karte (78'552 px @1920/Skala 1, 443'031 px @375/Skala 1.4, 17'158 DOM-Knoten; Messung `vite preview`, headless, Build vor dem Fix). Behoben durch den DOM-Deckel je Behörde (100 + «Weitere anzeigen», Hausmuster `/rechtsprechung`; `MaterialRaster.tsx`): jetzt 25'323 px @1920, 140'002 px @375/1.4, 5'610 Knoten, 528 Karten (-68 %). Offen [D]: 528 Karten sind auf Skala 1.4 @375 immer noch ~140'000 px. Optionen: (a) Deckel auf 50/24 senken (Hausmuster bleibt, Seite ~13'000/~70'000 px); (b) Behörden-Gruppen einklappbar (Kopf als Akkordeon, nur geöffnete Gruppe im DOM — Sprungziel `#b-…` müsste öffnen); (c) so lassen (Seite liest sich als Register, nicht als Fliesstext). Entscheid Design/David.
