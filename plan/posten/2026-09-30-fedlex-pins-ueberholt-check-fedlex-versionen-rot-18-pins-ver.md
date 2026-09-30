<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Fedlex-Pins überholt: check:fedlex-versionen rot, 18 Pins veraltet (u. a. OR 20260101, StGB 20260612 → geltend 20261001; VTS 20260701), neue Konsolidierungen per 1.10.2026
anlass: Session-Notizen 2026-09-30
-->

Frische-Nachzug nötig (GP #1209/#1204).

- Befund 1.10.2026 (Übernahme-Session): der wöchentliche Frische-Lauf `fedlex-frische.yml` (Mo 04:43 UTC) scheiterte am 28.9.2026 (Lauf 36414198660) im Schritt «Offline-Tore vor dem PR» an `src/tests/rest-flaechen-ratsche.test.tsx` (S0 Rest-Flächen-Ratsche W2·29-WERKBANK-REST, `/methodik`: eingefrorene Fläche ≠ Ist — datenabhängige Zahlen) — kein Re-Pin-PR. Ohne Wurzel-Fix scheitert auch der Lauf vom 5.10.2026, und die per 1.10.2026 neu konsolidierten Erlasse bleiben auf alten Pins (§7). Erst Ratsche datenunabhängig machen bzw. den Lauf reparieren, dann Re-Pin.
