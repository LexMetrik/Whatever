<!-- @posten
dach: W2·27-BUND-FERTIG
titel: aufhebung-signal.ts erkennt Fussnote «Diese aufgehobenen Art. …» nicht (StGB 201–212 ohne Feld, jetzt neutral statt «aufgehoben»; GP #1201 A5, tief, Risikopfad daten).
anlass: Session-Notizen 2026-09-30
-->

aufhebung-signal.ts erkennt Fussnote «Diese aufgehobenen Art. …» nicht (StGB 201–212 ohne Feld, jetzt neutral statt «aufgehoben»; GP #1201 A5, tief, Risikopfad daten).

**ERLEDIGT 2026-10-01** (Zweig `feat/w227-aufhebung-signal-sammel`, W2·27-BUND-FERTIG): `scripts/normtext/aufhebung-signal.ts` erkennt «Diese aufgehobenen Art(.|ikel) …» am Fussnoten-Anfang; StGB Art. 201–212 trägt `aufgehoben` (Beleg: Fedlex-HTML StGB 20260612, Fussnote 291; Test `normtext-aufhebung-sammel-w227.test.ts`). Sweep über alle 231 Bund-Erlasse / 25 604 Einträge: genau 3 Feldänderungen, 0 sonstige.
