<!-- @posten
dach: QS-KORPUS
titel: Literatur-Filter übersieht «a.a.O., Art. N HZÜ N x»
anlass: PR #1112
-->

Befund Gegenprüfung PR #1112 (25.9.2026): In BS DGZ.2025.8 steht «a.a.O., Art. 4 HZÜ N 4» — ein Kommentar-Verweis (Randnote), den die Literatur-Kontext-Regel (literaturEntfernteNormKeys / fliesstextOhneApparat) nicht als Zitier-Apparat erkennt. Die normKey-Zuordnung ist hier zufällig richtig, weil Art. 4 HZÜ auch im Fliesstext zitiert ist. Wurzel-Fix: «a.a.O.» plus «N <Zahl>» als Apparat-Marker aufnehmen, mit Rot-Beweis an einem Fall, wo der Artikel NUR im Apparat steht.
