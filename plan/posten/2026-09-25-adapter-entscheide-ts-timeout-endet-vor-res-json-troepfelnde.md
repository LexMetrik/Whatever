<!-- @posten
dach: QS-KORPUS
titel: adapter-entscheide.ts: Timeout endet vor res.json() (tröpfelnder Body ohne Grenze)
anlass: W-Nachzug #1113, Nach-Verdikt 25.9.2026
-->

scripts/normtext/adapter-entscheide.ts ~Z. 65 (jget): der AbortController-Timeout liegt auf dem fetch()-Aufruf, res.json() läuft danach ohne eigene Grenze weiter — ein langsam/tröpfelnd antwortender Server kann den Timeout so umgehen. Wurzel-Fix: das Timeout/AbortSignal auch um die json()-Auswertung legen oder eine Gesamtdeadline für den ganzen Request-Zyklus setzen. Zusatzbefund: die Datei liegt an der 800-Zeilen-Schlankheitsgrenze (Skill refactoring) — vor der nächsten Erweiterung (z. B. dem date_from-Umbau, Posten Wochenlauf-Zeitfenster) prüfen, ob sie aufgeteilt werden muss.
