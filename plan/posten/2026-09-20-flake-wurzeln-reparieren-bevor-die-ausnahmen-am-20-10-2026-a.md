<!-- @posten
dach: QS-CI-MINUTEN
titel: Flake-Wurzeln reparieren, bevor die Ausnahmen am 20.10.2026 ablaufen
anlass: Entscheid David 20.9.2026, PR #948
-->

Neun Browser-Tests werden nur im Wiederholungsversuch grün (Messung 18.–20.9.2026: 46 von 46 Code-Läufen betroffen; uinav-j-rechtsprechung 46/46, w224-r11-reiterleiste 43/46, leser-v3-suche-ohne-gliederung 43/46, leser-v3-blatt 13/46, übrige vereinzelt). Sie stehen befristet bis 20.10.2026 in e2e/flake-ausnahmen.json; der Flacker-Wächter ist seit 22.9.2026 hart. Je Spec die Wurzel MESSEN (Verdacht uinav-j/rechtsprechung: Reiterbreite am Ladezeitpunkt, 201 statt 200 Links — FAHRPLAN-OFFENE-BEFUNDE §4), nicht Ausnahmen verlängern und keine waitForTimeout-Pflaster. Vorrang vor neuem Bau im Feld, sobald die Frist näher als 14 Tage ist.

Umgehängt 24.9.2026 von `W2·18-FEHLERBUCH` nach `QS-CI-MINUTEN` (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET).

**Bündel 24.9.2026** (Bauplan-Konsolidierung M-17, QS-DOKU-DIAET): 6 weitere Posten derselben Sorge sind hier im Wortlaut aufgenommen — Titel, Anlass, alter Dach-Schlüssel und alte Datei je Punkt; die Dateien liegen mit Beleg «gebündelt in …» unter `archiv/posten/`. Nichts gekürzt.

### 1 · Flacker-Fall leser-v3-blatt (c) ⌘K im Split *(Anlass: CI #844, 13.9.2026; isoliert 6/6 grün auf Branch und main; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-13-flacker-fall-leser-v3-blatt-c-k-im-split.md`)*

  - [ ] **Flacker-Fall `leser-v3-blatt` (c) ⌘K im Split** *(CI #844, 13.9.2026; isoliert 6/6 grün auf Branch und main)* — last-/parallelbedingt, deckt sich mit «⌘K-Vorlauf im Split» (CI #711); Fahrplan §4.

### 2 · e2e-Klasse «einmalige count()/Zähler-Lesung direkt nach Klick/URL-Prüfung» *(Anlass: Session-Notizen 2026-09-23; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-23-e2e-klasse-einmalige-count-zaehler-lesung-direkt-nach-klick.md`)*

Sweep über weitere Specs (expect.poll)

### 3 · e2e w224-r11-reiterleiste «inaktive Reiter» lokal auch auf main rot (1 statt 3), CI grün → Umgebungsabhängigkeit *(Anlass: Session-Notizen 2026-09-23; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-23-e2e-w224-r11-reiterleiste-inaktive-reiter-lokal-auch-auf-mai.md`)*

e2e w224-r11-reiterleiste «inaktive Reiter» lokal auch auf main rot (1 statt 3), CI grün → Umgebungsabhängigkeit

### 4 · Fehlerbuch fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md: Befund 14.9. + Messung 20.9. zu rechtsprechung-Flackern → Wurzeln/Streichung (#994) nachtragen *(Anlass: Session-Notizen 2026-09-23; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-23-fehlerbuch-fahrplaene-fahrplan-offene-befunde-md-befund-14-9.md`)*

Fehlerbuch fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md: Befund 14.9. + Messung 20.9. zu rechtsprechung-Flackern → Wurzeln/Streichung (#994) nachtragen

### 5 · e2e w224-r11 :764 Mappe speichern/öffnen: Rechner-Reiter mit Query statt ohne *(Anlass: Session-Notizen 2026-09-24 W2·29-MARKE; vormals Dach `W2·18-FEHLERBUCH`, `plan/posten/2026-09-24-e2e-w224-r11-764-mappe-speichern-oeffnen-rechner-reiter-mit.md`)*

Lokal 24.9.2026 1× rot, 1× grün (CI grün): nach «speichern → alle schliessen → öffnen» stand /rechner/zpo-fristen mit Formular-Query (?e=2025-01-15&u=tage…) statt ohne im Speicher. Rennen zwischen Rechner-URL-Sync und Mappen-Schnappschuss? Wurzel messen, nicht Ausnahme eintragen.

### 6 · FRIST 22.9.2026: Flacker-Wächter wird automatisch hart *(Anlass: Session 20.9.2026, Prozess-Messung; vormals Dach `QS-CI-MINUTEN`, `plan/posten/2026-09-20-frist-22-9-2026-flacker-waechter-wird-automatisch-hart.md`)*

Der Melde-Modus in `e2e/flake-modus.json` endet am 22.9.2026; danach ist der Flacker-Wächter hart. Die verwaiste Übergabe `.claude/notizen/2026-09-19-org-umzug-uebergabe.md` im Haupt-Checkout nennt das DRINGEND, aber keine Session hat sie übernommen. Vor dem Stichtag die offenen Flake-Specs sichten.
