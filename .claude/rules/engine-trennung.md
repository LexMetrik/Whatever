---
paths:
  - "src/lib/**"
---
# §4 Eine Engine pro Rechtsgebiet

Die Trennung der Engines (verjaehrung, sperrfristen, mietrecht, …) ist kein
Ballast, sondern ein Sicherheitsmerkmal: einzeln testbar, keine Querwirkungen
zwischen Rechtsgebieten. Geteilt wird **fachneutrale Infrastruktur**
(Datums-Arithmetik, Feiertage, Bruchrechnung, Fristen-Grundmuster) — nie
materielle Rechtsregeln.

Verschmelzung ist erlaubt, aber nur **golden-gegated** und **regime-treu**:
verschiedene Rechtsregimes bleiben im verschmolzenen Code als interne
Verzweigung erkennbar und werden nie zu einer gemeinsamen Regel kollabiert.
Protokoll: Skill **`refactoring`**.

## Code-Konventionen

- **Datums-Engines:** `Date.UTC`, `new Date(iso)` und `toISOString` nie mit
  lokalen Datums-Komponenten mischen. Lokal konstruieren, mit `formatISO`
  ausgeben und als ISO-String vergleichen. CI läuft in UTC und maskiert
  solche Fehler.
- **Engine-Textfelder** enden auf einen ganzen Satz oder eine ganze Zeile.
  Halbgeviertstrich und U+2019 nur in neuen Strings verwenden: eine
  Massen-Ersetzung im Bestand bricht alle Golden-Outputs auf einmal.
