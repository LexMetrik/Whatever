<!-- @posten
dach: QS-EFFIZIENZ
titel: Planwerkzeug liest 512 KB Chronik bei jedem Aufruf
anlass: Session 20.9.2026, Prozess-Messung
-->

Gebraucht wird aus `ROADMAP-CHRONIK.md` nur die Menge der erledigten IDs, gelesen wird die ganze Datei — `npm run plan:dump` lief am 20.9.2026 in 120 s nicht durch. Index-Datei mit den done-IDs oder Monats-Split der Chronik. Verwandt: der offene Posten «Chronik-Hygiene».

**Nachtrag 20.9.2026 (nachgemessen):** `npm run plan:dump` läuft im Haupt-Checkout zügig durch, `check:plan`/`plan:next` brauchen warm rund 0,3 s — der berichtete 120-s-Abbruch war ein Artefakt der Recherche. Nicht dringend; erst angehen, wenn die Laufzeit messbar stört.
