---
paths:
  - "src/lib/**"
---
# §4 Eine Engine pro Rechtsgebiet
<!-- @wiedervorlage: 2027-02-14 -->

<!-- Wortlaut unverändert aus CLAUDE.md §4 hierher verschoben (QS-HOOKS-AUSBAU
     14.8.2026). Lädt pfad-gescoped bei Berührung von src/lib/**. -->

Die Trennung der Engines (verjaehrung, sperrfristen, mietrecht, …) ist kein
Ballast, sondern ein Sicherheitsmerkmal: einzeln testbar, keine Querwirkungen
zwischen Rechtsgebieten. Geteilt wird **fachneutrale Infrastruktur**
(Datums-Arithmetik, Feiertage, Bruchrechnung, Fristen-Grundmuster) — nie
materielle Rechtsregeln.

Verschmelzung ist erlaubt, aber nur **golden-gegated** und **regime-treu**:
verschiedene Rechtsregimes bleiben im verschmolzenen Code als interne
Verzweigung erkennbar und werden nie zu einer gemeinsamen Regel kollabiert.
Protokoll: Skill **`refactoring`**.
