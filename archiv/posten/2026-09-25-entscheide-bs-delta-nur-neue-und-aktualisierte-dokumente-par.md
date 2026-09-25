<!-- @posten
dach: QS-KORPUS
titel: entscheide:bs --delta: nur neue und aktualisierte Dokumente parsen
anlass: Gegenprüfung PR #1099 (BGE-Band-Nachzug 152), 25.9.2026
-->

25.9.2026: `npm run entscheide:bs -- --delta` holt und parst ohne lokalen Roh-Store (daten/bs-fiw/raw/ leer, nicht eingecheckt) alle ~3950 Dokumente neu und stempelt dabei den ganzen Bestand um (`abgerufen` = Laufdatum, fehlender checkpoint.json). Wurzel-Fix: nur neue/aktualisierte Keys fetchen und parsen, den Rest byte-treu von der Platte übernehmen; Kopfkommentar in scripts/rechtsprechung/bs-import.ts korrigieren. Wartend laut Inventar-Probe 25.9.2026: +185 neu, 41 aktualisiert, 0 Takedowns, neuester Entscheid 17.9.2026.

**Erledigt 2026-09-25:** PR #1112 (Fix 255bc973d, Delta-Lauf 3d18122f4: +185 neu, 41 aktualisiert, 0 Takedowns)
