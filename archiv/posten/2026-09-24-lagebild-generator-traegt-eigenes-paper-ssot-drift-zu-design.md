<!-- @posten
dach: W2·29-WERKBANK-REST
titel: Lagebild-Generator trägt eigenes --paper (SSoT-Drift zu design/tokens.json)
anlass: Gegenprüfung GRUNDTON 23.9.2026
-->

scripts/plan/bildHtml.ts:62 setzt --paper:#FCFAF6 statt aus design/tokens.json (seit GRUNDTON #FDFCFA) — §5.

**Erledigt 2026-09-25:** scripts/plan/bildHtml.ts liest --paper jetzt aus design/tokens.json (Token paper, PAPER.light/dark), 18 neue Zeilen; npm run plan:bild einmal gefahren, tmp/plan-bild*.html zeigt --paper:#FDFCFA/#1B1917 (SSoT-Wert statt altem #FCFAF6/#16150F), tmp/ gitignored, nicht committet; vitest src/tests/plan-bild-bloecke.test.ts + plan-bild-lage.test.ts grün (86 Tests)
