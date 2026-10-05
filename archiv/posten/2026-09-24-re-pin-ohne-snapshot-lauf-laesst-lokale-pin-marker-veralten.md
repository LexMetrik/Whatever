<!-- @posten
dach: QS-MONITOR-ROT
titel: Re-Pin ohne Snapshot-Lauf lässt lokale Pin-Marker veralten
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Re-Pin ohne Snapshot-Lauf lässt lokale Pin-Marker veralten** *(18.9.2026, nach #912; Meldung Leser-Session)* — ein Re-Pin, der nur `scripts/fedlex-cache.sh` ändert, macht auf JEDEM lokalen Checkout `check:p-klassen` + `check:vollstaendigkeit` rot («Pin-Marker weicht ab … Neuabruf nötig»; CI grün, weil dort /tmp leer). `.pin` stempelt nur `sicherstelleCaches` (`normtext-snapshot.ts`/`struktur-run.ts`); Cache löschen hilft nicht (Teilbestand-Fehler 230/231). Heil-Weg heute: `npm run normtext -- --nur=bund --erlass=<key> --datum=$(date +%F)`, Datums-Diff verwerfen (18.9.: 36/36 sha gleich). Wurzel-Fix: Fehlermeldung in `cache-pin-befund.ts` nennt diesen Befehl ODER ein Stempel-Kommando ohne Snapshot-Schreiben (`check:caches -- --stempeln`, gleiche mtime-Sonde); und die Re-Pin-Kaskade (#907) regeneriert den betroffenen Erlass immer mit.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§2, Restposten aus ROADMAP.md, vormals Z. 131) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
