<!-- @posten
dach: W2·18-FEHLERBUCH
titel: rectifies-Wächter blind für Fedlex-Berichtigungen ohne HTML
anlass: Gegenprüfung #834, 12.9.2026
-->

  - [ ] **rectifies-Wächter blind für Fedlex-Berichtigungen ohne HTML** *(Gegenprüfung #834, 12.9.2026)* — 7 von 25 geprüften `rectifies`-Kanten sind nicht abrufbar, weil Fedlex die Berichtigung nur als doc/pdf-a führt, nicht als HTML; lesbar via `textutil -convert txt` (macOS) bzw. PyMuPDF. Tor um die doc-Manifestation erweitern, damit die Klasse «nicht abrufbar» auf 0 sinkt.

**Nachzug 24.9.2026** (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET): 1 Fahrplan-Eintrag derselben Sorge ist hier im Wortlaut aufgenommen; im Fahrplan steht an seiner Stelle je ein Zeiger hierher. Nichts gekürzt.

### 1 · rectifies-Tor: 20 Berichtigungen nur als doc/pdf, Obergrenze 20/20 ohne Luft *(aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`, §2, Restposten aus ROADMAP.md, vormals Z. 139)*

  - [ ] **rectifies-Tor: 20 Berichtigungen nur als doc/pdf, Obergrenze 20/20 ohne Luft** *(19.9.2026)* — docx/pdf-Leser bauen; sonst macht die nächste Berichtigung ohne HTML das Tor sachfremd rot. Tor zudem DE-only.
