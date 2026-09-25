<!-- @posten
dach: QS-KORPUS
titel: BGE 152 III 205: Volltext-Parser erzeugt Phantom-Block «E. 10»
anlass: Gegenprüfung PR #1099 (BGE-Band-Nachzug 152), 25.9.2026
-->

25.9.2026: Im Volltext von BGE 152 III 205 erzeugt der Parser aus «n o 10 ad art. 45» einen falschen Erwägungsblock «E. 10», und E. 6 geht in E. 5.4 auf (check:entscheide WARN «Erwägungs-Top-Sprung 5→10», PR #1099). Fix: Marken-Erkennung gegen «n o <Zahl>»-Kommentarzitate härten, dann den Snapshot per Generator neu ziehen.
