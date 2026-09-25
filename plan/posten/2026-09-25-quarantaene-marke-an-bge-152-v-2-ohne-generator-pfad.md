<!-- @posten
dach: QS-KORPUS
titel: quarantaene-Marke an BGE 152 V 2 ohne Generator-Pfad
anlass: Gegenprüfung PR #1099 (BGE-Band-Nachzug 152), 25.9.2026
-->

25.9.2026: Die Warnmarke `quarantaene: 'ocl-konflation:152 V 20'` an bund/bge/152_V_2.json setzt kein Generator-Pfad (grep scripts/: nur Writer-Projektion und Typ, PR #1099-Befund) — ein Neuaufbau aus der Quelle verlöre sie still. Fix: Quarantäne-Menge im Generator führen und dort setzen.
