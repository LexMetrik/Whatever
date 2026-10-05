<!-- @posten
dach: QS-KORPUS
titel: Homonym-Tor für Alias-Kürzel (normKeys) — Spec H
anlass: Punkt 5 Startauftrag Urteils-Automatik-Schärfung, 25.9.2026
-->

Ziel: ein Kürzel, das in einer Amtssprache ein Register-Erlass ist und bei Fedlex zugleich einen ANDEREN Erlass bezeichnet (Anlass #1099: AIMP/OCP/OS falsch zugeordnet), darf normKeys nur noch bilden, wenn geprüft oder gesperrt. Neues Tor check:abk-homonyme (offline, in gate) + check:abk-homonyme-netz (Drift, in check:netz). Weisung David 25.9.2026 «den Bauprozess aktuell nicht verlangsamen»: NUR (a) ein unklassiertes Alias-Kürzel mit Fedlex-Homonym ist rot; (b) ein ohne-treffer-Kürzel mit neuem Korpus-Treffer und (c) ein geprüftes Kürzel mit neuen Snapshots nach dem Prüfdatum in homonymer Sprache sind blosse Hinweise (Exit 0), die der Wochenlauf-Bericht zeigt. Muss: committetes Homonym-Artefakt (amtlich, §7, Fedlex-SPARQL titleShort je Sprache) + Klassierungsdatei (gesperrt/geprüft/ohne-treffer) je Kürzel mit Beleg; OR/COST gezielt am Korpus prüfen (Stichprobe n≥10 je Token). Bau-Spec vollständig: Projektordner urteils-automatik-2026-09-25/anhang/ua-spec-H.md. Bezug: plan/posten/2026-09-25-alias-kuerzel-mit-fedlex-homonymen-pruefen-sweep-restliste.md (38 Kürzel, dort nach dem Bau schliessen/ergänzen).
