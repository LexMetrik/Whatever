<!-- @posten
dach: W2·31-BILDSCHIRMBREITE
titel: B1 Grundlage für alle Seitenarten — Breitenstufe deklarieren, Fliesstext deckeln, Wächter
anlass: Inventar Bildschirmbreite 25.9.2026, Freigabe David
-->

Pflicht vor B2–B12. Statt Pfadvergleich `inhaltsbreiteFuer` eine deklarierte Breitenstufe je
Seitenart (Footer.tsx:54/142 und Pane.tsx:148 ziehen mit, Shell.tsx Mehrfenster beachten).
Ungedeckelte Fliesstexte deckeln: PflichtDisclaimer.tsx (973 px/128 Zeichen@1280, Chrome zeigt
zugeklapptes `<details>` sonst mit innerText 0), Katalog.tsx (796 px), MaterialKarte, Mappen-/
Kündigungslisten, Suche-Hinweis. Lesemass `max-w-reading`+`text-body-s` korrigieren (91–100
Zeichen statt versprochener 66–71 auf /ueber, /methodik, /materialien/deckung). e2e-Breitenwächter
für alle Seitenarten anlegen (Vorbild e2e/startseite-breite.e2e.ts). Messquelle:
~/Documents/David/03_Projekte/LexMetrik/bildschirmbreite-2026-09-25/inventar-seitenarten.md.
