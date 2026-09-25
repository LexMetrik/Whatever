<!-- @posten
dach: QS-KORPUS
titel: Wochenlauf-Zeitfenster date_from statt fester Stückzahl (OCL-Pipeline)
anlass: OCL-Recherche 2 (ocl-pipeline-api.md), 25.9.2026
-->

OCL filtert /decisions nur über date_from/date_to (Gerichtsdatum), es gibt keinen «changed since»-Parameter. Gemessener Publikationsverzug Gericht→OCL: BGer ~8 Tage, be_verwaltungsgericht ~25 Tage (Abruf 25.9.2026). Unser Wochenlauf holt heute je Gericht nur die N neuesten IDs (listCompactIds/enumeriereNeueste, kein Datumsfenster) — bei Verzug oder mehr als N neuen Entscheiden entstehen so stille Lücken. Empfehlung: date_from = letzter erfolgreicher Lauf minus Sicherheitsmarge (z. B. 14 Tage) statt fixer Stückzahl je Gericht — Generator-Änderung in scripts/normtext-entscheide.ts/adapter-entscheide.ts. Geänderte Alt-Entscheide (unverändertes decision_date) bleiben nur per periodischem Voll-Hash-Diff auffindbar, dafür gibt es keinen API-Parameter. Umfang (Sicherheitsfenster, welche Gerichte, Budget) ist David-Entscheid, nicht Teil dieser Session. Quelle: Projektordner urteils-automatik-2026-09-25/anhang/ocl-pipeline-api.md.
