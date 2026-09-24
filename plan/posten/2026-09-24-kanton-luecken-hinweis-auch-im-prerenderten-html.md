<!-- @posten
dach: W2·13-KANTONE
titel: Kanton-Lücken-Hinweis auch im prerenderten HTML
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-KANTONE.md §2, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Kanton-Lücken-Hinweis auch im prerenderten HTML** *(Auflage F4 Gegenprüfung PR #616, 2.9.2026)* — der Hinweis «Nicht vollständig erfasst» erscheint erst nach Hydration; `scripts/prerender.ts` (`erlassVolltextHtml`) kennt den Sidecar `kanton-luecken.json` nicht ⇒ §8-Offenlegung fehlt für Crawler/No-JS, und `check:perf-lighthouse` misst nur `/gesetze/bund/OR` (CLS des Kanton-Kopfs unbewacht). Zwei Renderpfade, einer offenbart (§5).

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-KANTONE.md` (§2, Restposten aus ROADMAP.md, vormals Z. 228) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
