<!-- @posten
dach: QS-PERF
titel: Eager-Kette Shell→Sidebar→lib/navigation→normtext/register lädt ~276 KB roh auf JEDER Route
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-PERFORMANCE.md §1-N, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **Eager-Kette `Shell→Sidebar→lib/navigation→normtext/register` lädt ~276 KB roh auf JEDER Route** *(Code-Inventur 4.8.2026)* — die Sidebar braucht aus `register.ts` nur die `GEBIETE`-Labels, zieht aber das ganze 189-KB-Register plus `startseiteConfig` (87 KB) in den kritischen Pfad; Entry gemessen 52.1 KB gz = 87 % des Budgets (Einzelwert, dist älter als HEAD — vor Zuschreibung §3-Streuung). Suchindex-Monolith 45.9 MB roh / 9.5 MB gz als EIN fetch, Budget zu 91 % ausgeschöpft. Zahlen: `bibliothek/betrieb/code-inventur-2026-08-04.md`.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-PERFORMANCE.md` (§1-N, vormals Z. 233) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
