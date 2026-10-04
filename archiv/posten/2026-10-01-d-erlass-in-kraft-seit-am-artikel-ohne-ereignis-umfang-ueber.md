<!-- @posten
dach: W2·27-BUND-FERTIG
titel: [D] «Erlass in Kraft seit …» am Artikel ohne Ereignis: Umfang über SR 0.* hinaus?
-->

P5 (1.10.2026) liefert die Zeile ENG nur für SR 0.* (28 Staatsverträge, 1 511 Artikel, davon 1 476 ohne Ereignis vor Leerstellen-/Residuum-Gate). Die Ausweitung auf ALLE Bund-Artikel ohne Ereignis (~12 460, z. B. OR Art. 1) ist ein Ein-Zeilen-Schalter: erlassStandErlaubt in src/pages/gesetz-leser/v3/PanelTafeln.tsx auf true (Gate-Test src/tests/leser-blatt-fassung-erlassstand-w227.test.tsx mitziehen). Wartet auf David: Umfang ja/nein. Empfehlung: ja, datengesteuert (eine Regel statt zwei, §17), sobald die Residuum-Zahl (Bund 76 Artikel) akzeptiert ist.

**Erledigt 2026-10-02:** Entscheid David 2.10.2026 + PR #1263
