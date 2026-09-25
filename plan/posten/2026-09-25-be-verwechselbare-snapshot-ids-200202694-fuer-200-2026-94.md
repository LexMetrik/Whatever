<!-- @posten
dach: QS-KORPUS
titel: BE: verwechselbare Snapshot-IDs (200202694 für «200 2026 94»)
anlass: Stichproben-Nachzug 25.9.2026, PR #1117
-->

docketSlug entfernt Leerzeichen: «200 2026 94» → 200202694, «200 2026 20» → 200202620. Mehrdeutig: «200 2026 94» und «200 202 694» bzw. «200 2026 20» und «200 20262 0» fallen zusammen; bei wachsendem BE-Korpus droht eine id-Kollision (Dedupe nach id verwürfe dann ein echtes Urteil still). Trennzeichen im Slug bewahren (z.B. 200_2026_94) mit deklarierter id-Migration.
