<!-- @posten
dach: QS-KORPUS
titel: Segment-Tor R3-1b: Teilstring-Maskierung innerhalb eines Ankers schliessen
anlass: Nachprüfung GP 3 Segment-Tor 25.9.2026 (auf 26e1c3eb4), Befund R3-1b
-->

Steht eine Zeile als Teilstring in einer anderen Zeile desselben Ankers, zählt der Blob-Treffer in `check:segmente` mit; ihre Löschung bleibt grün (B und C). Belege: LSV Anhang 5 ES I «50/55/65» (verdeckt durch «III 50 55 65»), VVEA Anhang 4 «Cadmium / 2» (durch «Cadmium 2.5»), GebV-HReg «Auflösung / 70.–», ZEMIS-V Anhang 1; Näherung 52 von 7 618 Zeilen-Gruppen (Prüfer-Skript `gp-segmente-3-2026-09-25/py/rest31.py`). Fix-Idee: Treffer an Stückgrenzen binden (Trenner im Blob je Zelle/Zeile) oder Treffer, die in einem längeren Soll-Treffer liegen, nicht mitzählen; neue SEGMENTER_VERSION. Grenze im Dateikopf `check-segmente.ts`; GP-Bericht `pruefung-herz-nieren-2026-09-24/berichte/gegenpruefung-segment-tor-runde3-2026-09-25.md` (Nachprüfung).
