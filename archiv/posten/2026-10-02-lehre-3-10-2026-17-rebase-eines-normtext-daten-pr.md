<!-- @posten
dach: QS-DATA-INGEST-DRIFT
titel: Lehre 3.10.2026 (§17): Rebase eines Normtext-Daten-PR
anlass: Session-Notizen 2026-10-02
-->

der merge=regen-Treiber für daten-manifest.json erzeugte main's Manifest-sha (stale DB) statt des PR-Datenstands; CI meldete nur check:confidence-frische (korpus.sha ≠ Manifest), lokal check:datenhaltung rot. Reparatur: datenhaltung:manifest (2× bis deterministisch) + report:confidence. Wurzel-Fix: Treiber baut DB aus dem Merge-Ergebnis neu bzw. confidence.json in die regen-Kaskade (#1292)
