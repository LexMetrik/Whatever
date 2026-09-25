<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: LM-075 + LM-117 — native Datumsfelder (EntscheidFilter, /rechtsprechung) vs. DatumsFeld-Baustein: Entscheid-Frage an David
anlass: Umgehängt 25.9.2026 (REST S5c) aus FAHRPLAN-UI-BEFUNDE.md LM-075/LM-117 (archiviert); dieselbe Wurzel wie LM-073/074 aus Batch B12
wartet-auf: david
-->

Zwei native <input type=date> in EntscheidFilter.tsx (Grep 25.9. bestätigt: Kommentar R2-E/F1-1-AUSNAHME, Zeile ~286, mit Begründung 'Filter, kein fristauslösendes Feld' und Wächter src/tests/eingabe-bausteine-r2e.test.tsx/AUSNAHMEN) fallen aus dem Formularbild (Browser-Kalendersymbol, Platzhalter 'tt.mm.jjjj' statt 'TT.MM.JJJJ' wie in den Rechnern). Der Umstieg auf DatumsFeld kippt eine dokumentierte, seit R3-α (31.8.2026) benannte Ausnahme UND berührt Eingabe-Parsing/Datumsformat-Interpretation (§1-nah) — kein Batch-Fix. Gehört mit LM-073/074 (Batch B12, dieselbe Wurzel 'natives Browserfeld') zusammen entschieden: David-Frage, ob die Filter-Ausnahme bleibt oder gekippt wird.
