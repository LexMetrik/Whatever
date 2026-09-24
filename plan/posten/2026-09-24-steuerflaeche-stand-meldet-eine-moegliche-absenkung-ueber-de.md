<!-- @posten
dach: QS-EFFIZIENZ
titel: steuerflaeche --stand meldet eine «mögliche Absenkung» über der Grenze (irreführend, §8)
anlass: Bauplan-Inventar 24.9.2026 §5.8, reproduziert 24.9.2026 in Phase 2
-->

`npm run steuerflaeche -- --stand` druckte am 24.9.2026 «Steuerungs-Fläche: 1291.4 KB · Grenze 1295.0 KB · Luft 3.6 KB» und gleich danach «Mögliche Absenkung per --nachziehen: 1356.0 KB» — ein Wert ÜBER der Grenze, also keine Absenkung. Ursache: `scripts/analyse/steuerflaeche.ts:26` gibt `zielGrenze(ist)` (Ist + 5 %) ohne Vergleich mit der Grenze aus; `--nachziehen` selbst prüft korrekt («Keine Absenkung … Die Klinke hebt nie an»). Fix-Idee: dieselbe Bedingung wie in `--nachziehen` auch in `--stand` («keine Absenkung möglich»). Steuerfläche beachten (scripts/analyse zählt mit).
