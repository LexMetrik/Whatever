<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: LM-110 — Prune-Prädikat der Filterchips erkennt nicht, wenn ALLE Optionen einer Achse dieselbe Zahl liefern
anlass: Umgehängt 25.9.2026 (REST S5c) aus FAHRPLAN-UI-BEFUNDE.md LM-110 (archiviert)
-->

Grep 25.9. bestätigt unverändert: EntscheidFilter.tsx:121/139/151 filtert nur o.id==='alle' || o.n>0 || o.aktiv — erkennt nicht den Fall 'alle Optionen dieser Achse liefern dasselbe Ergebnis' (dann sollten die Chips gedämpft/ausgeblendet werden wie ein einzelner wirkungsloser Schalter, Muster aus W2·7-BEZUG B7 (c)/PR #406). Fix sitzt im Prune-Prädikat selbst — Filter-/Query-Logik (§0.3), kein reiner Formatierungs-Fix, darum nicht in einem Design-Batch.
