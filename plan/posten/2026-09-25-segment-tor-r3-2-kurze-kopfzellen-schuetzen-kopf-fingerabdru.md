<!-- @posten
dach: QS-KORPUS
titel: Segment-Tor R3-2: kurze Kopfzellen schützen (Kopf-Fingerabdruck)
anlass: Gegenprüfung 3 Segment-Tor 25.9.2026, Befund R3-2
-->

Befund R3-2 (Gegenprüfung 3, 25.9.2026): Kopfzeilen tragen im Segment-Tor check:segmente keinen Zeilen-Fingerabdruck, und Zellen unter 8 Zeichen werden nicht geprüft. Kopfzeilen, in denen jede Zelle kürzer als 8 Zeichen ist, sind darum ganz ungeschützt: rund 63 solche Zeilen (Näherung per lxml, GP-Skript py/kopf.py), u. a. AHVV (SR 831.101) Art. 56bis/56quater (Monate 0–11), ERV Anhang 2 (Ratingklassen 1–7), ZEMIS-V Anhang 1 (Spaltenköpfe der Zugriffsmatrix), LSV Tag/Nacht, VTS Anhang 9/10. Beleg: AHVV Art. 56bis Abs. 1, Köpfe 1–11 aus der Projektion gelöscht (M2b) und Köpfe 7/8 vertauscht (M2): Modus B und C grün. Heute fehlt keine dieser Kopfzellen (py/kopfverlust.py: 0), die Lücke betrifft nur künftige Verluste. Vorschlag GP: ein Kopf-Fingerabdruck über die Titel-Folge, ohne die typ-Strings der Projektion (die trennen heute die Verkettung). Folge: SEGMENTER_VERSION-Wechsel, Soll neu per --schreiben. Dokumentiert im Dateikopf scripts/normtext/check-segmente.ts (PRÜFGRENZEN). GP-Bericht: ~/Documents/David/03_Projekte/LexMetrik/pruefung-herz-nieren-2026-09-24/berichte/gegenpruefung-segment-tor-runde3-2026-09-25.md; Proben: .../soll-und-laeufe/normtext-treue/gp-segmente-3-2026-09-25/.
