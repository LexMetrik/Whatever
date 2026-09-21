<!-- @posten
dach: QS-CODE-LFZ-GRENZE
titel: Gegenprüfung nicht erforderlich — gemessen, nicht geraten
anlass: 14.9.2026
-->

  - [ ] **Gegenprüfung nicht erforderlich — gemessen, nicht geraten** *(14.9.2026)*: `istRisikoPfad()` ist für alle vier Dateien **false**. **Offener Punkt daraus:** `src/lib/datumsUtils.ts` trägt die 324a-Grenze, fällt aber aus dem Klassifikator (`RECHNEN_RE` trifft den Dateinamen nicht) — mit Rot-Beweis (§6.7) entscheiden, **bevor** dort jemand Rechenlogik ändert.
