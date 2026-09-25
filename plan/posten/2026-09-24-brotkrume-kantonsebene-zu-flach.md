<!-- @posten
dach: W2·18-FEHLERBUCH
titel: Brotkrume Kantonsebene zu flach
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Brotkrume Kantonsebene zu flach** — **Prämisse widerlegt (29.8.2026):** die Krume trägt bei KEINER Ebene eine Nummer (drei Stufen, `v3/erlassAnsicht.ts:377-386`); was wie «[SR 220]» aussieht, kommt aus dem Erlass-Kopf darunter — kein Bundes-Vorbild anzugleichen. Echter Unterschied: `zeigeVolltitel()` unterdrückt den Volltitel bei **775/1231 (63 %)** Kantonserlassen (Register-Kürzel = Volltitel). Sigle liegt schon im `sr` (ZH «LS 211.11», 1227/1231). Umsetzung: Ableitung in `erlassAnsicht.ts` + Geschwister-Element in `LeserKopf.tsx:204`. **Kein Fix-Batch-Posten** — vier e2e-Pins an der Ort-Zone, darunter die Ä-A4-Breitenfalle. 4/1231 ohne `sr` ⇒ muss entfallen können (§8). *(Befund 43/C8.)*

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 227) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
