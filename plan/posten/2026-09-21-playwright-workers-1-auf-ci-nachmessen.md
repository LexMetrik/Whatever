<!-- @posten
dach: QS-CI-MINUTEN
titel: Playwright workers:1 auf CI nachmessen
anlass: QS-CI-MINUTEN Wanduhr-Auftrag 21.9.2026
-->

playwright.config.ts:65 setzt workers auf 1 (Contention-Vermeidung); die vCPU-Zahl der GitHub-Actions-Runner ist dafür nie GEMESSEN worden. Falls die Standard-Runner ≥ 2 vCPU haben, könnte workers:2 die Testzeit je Shard senken, ohne die Contention-Sorge zu verletzen (jeder Shard läuft ohnehin isoliert auf einem eigenen Runner). Vorgehen: ≥ 10 Läufe kalt/warm mit workers:1 vs. workers:2 auf demselben Shard vergleichen, Flake-Rate UND Laufzeit messen, erst dann entscheiden. TABU dieses Auftrags — playwright.config.ts blieb unangetastet.
