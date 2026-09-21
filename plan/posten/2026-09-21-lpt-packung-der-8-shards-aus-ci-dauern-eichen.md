<!-- @posten
dach: QS-CI-MINUTEN
titel: LPT-Packung der 8 Shards aus CI-Dauern eichen
anlass: QS-CI-MINUTEN Wanduhr-Auftrag 21.9.2026, H1 Rücknahme M3
-->

Die Rücknahme von M3 (8→4→8 Shards, 21.9.2026) hat die @shard-gruppe-Annotationen auf ihren historischen Vor-M3-Stand zurückgesetzt (git-Diff des Ursprungscommits dfc8cb164), NICHT neu nach aktuellen CI-Dauern gepackt — CI-Artefakte (playwright-report-gruppe-*.json) werden nur 1 Tag aufbewahrt, eine frische LPT-Eichung war darum nicht Teil dieses Auftrags. 11 seit dem 8.9.2026 neu hinzugekommene Specs sind nur zähl-balanciert (Round-Robin auf die am dünnsten besetzten Gruppen), nicht dauer-gewichtet. Vorgehen: playwright-report.json mehrerer grüner 8-Shard-Läufe VOR Ablauf der 1-Tage-Frist sichern (z. B. Download-Schritt im Job ergänzen oder Artefakte zeitnah abholen), Summe je Spec über mehrere Läufe mitteln, LPT neu packen, e2e-shard-gruppen-generieren.mjs-Annotationen aktualisieren.
