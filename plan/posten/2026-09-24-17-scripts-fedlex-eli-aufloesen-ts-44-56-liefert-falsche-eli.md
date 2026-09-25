<!-- @posten
dach: QS-KORPUS
titel: §17 · scripts/fedlex-eli-aufloesen.ts:44-56 liefert falsche ELI
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §1, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **§17 · `scripts/fedlex-eli-aufloesen.ts:44-56` liefert falsche ELI** *(Prüfer #860, 14.9.2026)* — für 2 von 3 geprüften SR kommt ELI **und** Datum aus dem falschen Abstract: `LIMIT 200` kappt die Datumsliste (EMRK 1990 statt 2022), `bindings[0].cc` greift bei mehreren Abstracts den aufgehobenen Vorgänger (EÖBV → NAG 1891, AVG → AVG 1951); die SR-Sonde ist blind, weil die SR gleich bleibt. Repro: `npx vite-node scripts/fedlex-eli-aufloesen.ts -- 0.101 211.435.1 823.11`. Fix: `GROUP BY` je Abstract, kein `LIMIT`, Abstract-Wahl über die geltende Konsolidierung. Bestandspins unbetroffen (`check:fedlex-versionen` grün). *Risikopfad.*

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§1, Restposten aus ROADMAP.md, vormals Z. 57) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
