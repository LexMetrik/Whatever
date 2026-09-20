<!-- @posten
dach: QS-PERF
titel: Startseite LCP 9,3 s — wahre Ursache offen
anlass: Lighthouse Mobil, 17.9.2026
-->

  - [ ] **Startseite LCP 9,3 s — wahre Ursache offen** *(Lighthouse Mobil, 17.9.2026)* — 9,38 s/66 vor #879; 9,33 s/66 nach #879 (`13fbaaead`, 35015052713, kein Gewinn); 9,34 s/69 nach #899 (`c18e65574`, 35222958433); 9,40 s/66 nach #900 (`e4189bed6`). TTI==LCP, Budget 10,0 s. Verdacht: Route-Suspense zeigt Startseite erneut (#899). `perf-budget` 58,0/60 KB knapp.
