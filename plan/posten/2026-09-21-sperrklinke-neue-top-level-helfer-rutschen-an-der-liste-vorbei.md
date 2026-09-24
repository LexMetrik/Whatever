<!-- @posten
dach: QS-TORE-DIAET
titel: Sperrklinke — neue Top-Level-Helfer unter scripts/ rutschen an der abschliessenden Liste vorbei
anlass: Bug-Check der Sperrklinke (Sonnet, 21.9.2026), Auflage 2; Entscheid David 21.9.2026 «kleiner weg ist gut»
-->

  - [ ] **Sperrklinke: Strukturlücke der abschliessenden Helfer-Liste** *(Bug-Check 21.9.2026, Auflage 2)* — `scripts/analyse/steuerflaecheKern.ts` zählt unter `scripts/` nur `check-*.ts`, `plan/`, `analyse/` und eine ABSCHLIESSEND benannte Helfer-Liste. Ein neuer Steuerungs-Helfer mit unbekanntem Namen direkt unter `scripts/` zählt nicht mit — belegt am selben Tag durch `scripts/aufraeumen-git.ts` (#955), das nur per Hand-Nachtrag auf die Liste kam. Bewusst NICHT auf `scripts/*.ts` geöffnet: dort liegt überwiegend Produkt-/Datenwerkzeug, der Messwert spränge, und ein Anheben der Grenze braucht einen datierten David-Entscheid. Wurzel-Fix-Kandidat ohne Grenz-Sprung: `check:steuerflaeche` meldet (nicht rot, nur Hinweis) jede NEUE Datei direkt unter `scripts/`, die weder auf der Helfer-Liste noch auf einer Produkt-Liste steht — dann ist die Einordnung eine bewusste Zeile im PR statt ein stilles Durchrutschen.

Umgehängt 24.9.2026 von `QS-EFFIZIENZ` nach `QS-TORE-DIAET` (M-16: Tor-/Deckel-Thema; Bauplan-Konsolidierung, QS-DOKU-DIAET).

**Nachzug 24.9.2026** (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET): 1 Fahrplan-Eintrag derselben Sorge ist hier im Wortlaut aufgenommen; im Fahrplan steht an seiner Stelle je ein Zeiger hierher. Nichts gekürzt.

### 1 · §17 · Steuerdeckel-Glob umgehbar durch Dateinamen-Wahl *(aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md`, §2, Restposten aus ROADMAP.md, vormals Z. 203)*

  - [ ] **§17 · Steuerdeckel-Glob umgehbar durch Dateinamen-Wahl** *(Prüfer/Fixer #856, 14.9.2026)* — der 204-KB-Deckel auf `scripts/check-*.ts` steht bei 203,8 KB, sieht aber die Seitenwagen der gleichen Steuerungsfläche nicht: `scripts/verweis-inventar-messung.ts`, `scripts/ui-normzitate-kommentare.ts`, `scripts/tor-paritaet-sonden.ts` u. a. = 75,4 KB ausserhalb des Globs. Wer den Deckel reissen würde, benennt die Datei anders — das ist kein Budget, das ist eine Namenskonvention. Wurzel-Fix: Glob auf die Steuerungsfläche erweitern **oder** ein zweites, deklariertes Flächenbudget; einmal rot zeigen (§6.7).
