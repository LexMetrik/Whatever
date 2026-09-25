<!-- @posten
dach: QS-BASIS
titel: main.tsx nutzt createRoot statt hydrateRoot
anlass: Fahrplan-Einträge fahrplaene/FAHRPLAN-BASIS-AUSBAU.md §2, Restposten aus ROADMAP.md · fahrplaene/FAHRPLAN-BASIS-AUSBAU.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **`main.tsx` nutzt `createRoot` statt `hydrateRoot`** — prerendertes DOM wird 27–78 ms nach `load` verworfen (Nullprobe auf main bestätigt); Wurzel der «flaky» Tastatur-/Skip-Link-Specs und ein CLS-/TTI-Posten. Fix mit Hydrations-Fehler-Wächter, Vorher/Nachher-Messung, Gegenprüfung, eigener PR.

### Ebenso im Fahrplan: `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 193)

  - [ ] **Geparkter Stand `hydrateRoot` (9 Commits, still seit 15.9.) — Tag `archiv/qs-basis-hydrate-2026-09-18` (ae04f6caf), Branch + Worktree am 18.9.2026 abgeräumt; kollidiert nach #899 mit `Begruessung.tsx`/`SuchBlock.tsx`/`prerender.ts`** *(17.9.2026)* — Wiederaufnahme aus dem Tag (`git switch -c feat/qs-basis-hydrate archiv/qs-basis-hydrate-2026-09-18`), dabei `anfangsGruss()` in `useHeute` übernehmen.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 192) und `fahrplaene/FAHRPLAN-BASIS-AUSBAU.md` (§2, Restposten aus ROADMAP.md, vormals Z. 193) — dort steht jetzt je ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
