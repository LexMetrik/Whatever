<!-- @posten
dach: W2·18-FEHLERBUCH
titel: rectifies-Wächter blind für Fedlex-Berichtigungen ohne HTML
anlass: Gegenprüfung #834, 12.9.2026
-->

  - [ ] **rectifies-Wächter blind für Fedlex-Berichtigungen ohne HTML** *(Gegenprüfung #834, 12.9.2026)* — 7 von 25 geprüften `rectifies`-Kanten sind nicht abrufbar, weil Fedlex die Berichtigung nur als doc/pdf-a führt, nicht als HTML; lesbar via `textutil -convert txt` (macOS) bzw. PyMuPDF. Tor um die doc-Manifestation erweitern, damit die Klasse «nicht abrufbar» auf 0 sinkt.
