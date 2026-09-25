<!-- @posten
dach: QS-KORPUS
titel: check:verfall — 19 Termine am 1.10./1.11.2026 fällig, trifft jeden PR ab 1.10.
anlass: Gegenprüfung #1113 Nebenfund N4, 25.9.2026
-->

npm run check:verfall (Stand 25.9.2026) meldet 19 fällige Termine: 18× «Künftige Fassung <Erlass>» zum 1.10.2026 (VZAE, VEV, ZEMIS-V, RVOV, OR, HRegV, StGB, BBG, BBV, VRV, SSV, VTS, FIDLEG, KAG, BankG, FINIG, GwG, BEG) + 1× «Formularpflicht-Kantone (Mietzins)» zum 1.11.2026. Liste-Ort: scripts/verfall-pruefen.ts liest die Termine aus den jeweiligen Normtext-/Tarif-Datensätzen (Tabellen-Metadaten), nicht aus einer eigenen Datei. Der Gate ist kalenderabhängig: sobald das Systemdatum 1.10.2026 erreicht, wird check:verfall für JEDEN PR rot, nicht nur für den Wochenlauf, bis die 18 Fassungswechsel nachgezogen sind. Dach hier gewählt, weil fast alle Termine Normtext-Fassungswechsel sind (Korpus-Pflege); der CI-weite Ausfall ab 1.10. ist eine Nebenwirkung, keine eigene Ursache. Vor dem 1.10.2026 einplanen: je Erlass die konsolidierte Fassung nachziehen (gen:fedlex bzw. Kanton-Pipeline) oder den Termin bewusst mit Begründung verschieben (§7).
