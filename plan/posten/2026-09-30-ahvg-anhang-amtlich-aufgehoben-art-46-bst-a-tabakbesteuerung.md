<!-- @posten
dach: W2·27-BUND-FERTIG
titel: AHVG Anhang amtlich aufgehoben (Art. 46 Bst. a Tabakbesteuerung 1969), Körper nur Untertitel «Tarif der Tabakzölle» → Regel «nur bei leerem Körper» zeigt ihn als lebend (GP #1183).
anlass: Session-Notizen 2026-09-30
-->

AHVG Anhang amtlich aufgehoben (Art. 46 Bst. a Tabakbesteuerung 1969), Körper nur Untertitel «Tarif der Tabakzölle» → Regel «nur bei leerem Körper» zeigt ihn als lebend (GP #1183).

Ursache und Fix-Vorschlag (P7, 1.10.2026, nicht gebaut — der Fix liegt in `scripts/normtext/extrahiere-fedlex.ts`, das P4/P6/P8 bauen): `extrahiereAnhang` wertet `anhangAmtlichesSignal(innerRoh)` nur bei `bloecke.length === 0`. AHVG `annex_u1` hat den Block «Tarif der Tabakzölle» (`titel: 2`, nur Untertitel einer leeren Unter-Sektion), also wird die Kopf-Fussnote «Aufgehoben durch Art. 46 Bst. a des BG vom 21. März 1969 über die Tabakbesteuerung» (AS 1969 645) nie gelesen. Fix: die Bedingung auf «keine Blöcke ODER alle Blöcke reine Untertitel (`titel` gesetzt, kein `items`/`tabelle`/`mehrspaltig`/`bild`)» erweitern. Korpus-Messung 1.10.2026: genau 4 Anhänge sind reine Untertitel-Anhänge (AHVG annex_u1, CHEMRRV annex_1/annex_2, GSCHV annex_3); nur AHVG trägt den Aufhebungs-Vermerk. Danach Normtext-Kaskade (AHVG normtext + DB-Artefakt).

