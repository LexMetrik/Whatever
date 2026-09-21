<!-- @posten
dach: QS-EFFIZIENZ
titel: Sperrklinke — neue Top-Level-Helfer unter scripts/ rutschen an der abschliessenden Liste vorbei
anlass: Bug-Check der Sperrklinke (Sonnet, 21.9.2026), Auflage 2; Entscheid David 21.9.2026 «kleiner weg ist gut»
-->

  - [ ] **Sperrklinke: Strukturlücke der abschliessenden Helfer-Liste** *(Bug-Check 21.9.2026, Auflage 2)* — `scripts/analyse/steuerflaecheKern.ts` zählt unter `scripts/` nur `check-*.ts`, `plan/`, `analyse/` und eine ABSCHLIESSEND benannte Helfer-Liste. Ein neuer Steuerungs-Helfer mit unbekanntem Namen direkt unter `scripts/` zählt nicht mit — belegt am selben Tag durch `scripts/aufraeumen-git.ts` (#955), das nur per Hand-Nachtrag auf die Liste kam. Bewusst NICHT auf `scripts/*.ts` geöffnet: dort liegt überwiegend Produkt-/Datenwerkzeug, der Messwert spränge, und ein Anheben der Grenze braucht einen datierten David-Entscheid. Wurzel-Fix-Kandidat ohne Grenz-Sprung: `check:steuerflaeche` meldet (nicht rot, nur Hinweis) jede NEUE Datei direkt unter `scripts/`, die weder auf der Helfer-Liste noch auf einer Produkt-Liste steht — dann ist die Einordnung eine bewusste Zeile im PR statt ein stilles Durchrutschen.
