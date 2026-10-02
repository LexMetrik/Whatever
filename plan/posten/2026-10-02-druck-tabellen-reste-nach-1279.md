<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Druck-Tabellen nach #1279: Hinweis-Link ohne Artikel-Anker, 2 verpasste/5 überflüssige Querformat-Markierungen, nur Chromium geprüft
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

#1279 gelandet 2.10.2026 (4 Prüfrunden Opus; echter page.pdf-Sweep 150 Erlasse/676 Tabellen: keine Zelle fehlt). Reste: (a) Die gedruckte Hinweiszeile «Tabelle im Druck stark verkleinert oder gekürzt – vollständig und lesbar: <Link>» verlinkt nur den Erlass, nicht den Artikel (`#art-…` fehlt); bei CHEMRRV (576 S.) und FINFRAV muss man den Anhang selbst suchen. Betroffen: VVK, ZEMIS-V, ERV, FINFRAV Anh. 2/4, FINFRAV-FINMA, CHEMRRV, VAM, ASYLV3 Anh. 5. (b) Statische Vorab-Markierung `vorabDruck` (src/components/normtext/tabellenDruck.ts, Kalibrierung 1.15): verpasst VZV Anh. 12 und LRV Anh. 3 (hochkant zu breit, Inhalt vollständig); markiert unnötig AVO Anh. 4, FIDLEV Anh. 9, RVOV Anh. 1, UVV Anh. 2, NW-265.51 a1-1 (Querseite, Zoom 0.8, nichts verloren). (c) Nur Chromium (page.pdf) geprüft, Firefox/Safari-Druck offen. (d) Lesespalte sitzt im Druck rechts der Mitte (ml-52 + Raster), nutzbare Breite darum 20.5 cm statt ~26 cm quer. Quelle: Prüfberichte #1279 (Session «Gesetzesleser Funktionen inventarisieren»).
