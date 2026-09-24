<!-- @posten
dach: W2·29-WERKBANK-LESER
titel: Flacker-Kandidaten Leser: leser-ruecksprung-r5-r7.e2e.ts:231 R7, hist-ansicht-w25i.e2e.ts:354, leser-links-p3 Wartezeit 20 s
anlass: Session-Notizen 2026-09-25 (LESER-Landungen, Session 4)
-->

Drei Flacker-Kandidaten aus den Landungen vom 24./25.9.2026, alle diff-fremd, Wurzel messen oder mit Datum und Grund in e2e/flake-ausnahmen.json:
- e2e/leser-ruecksprung-r5-r7.e2e.ts:231 R7 Deep-Link-Skeleton — warf #1062 aus der Queue (merge_group-Lauf 36048365734).
- e2e/hist-ansicht-w25i.e2e.ts:354 «der Schalter rührt die Fassung nicht an» (Helfer e2e/helpers/fassungsRubrik.ts, toHaveAttribute) — 1× Retry im PR-Lauf 36067525236 (#1072, Shard 5/8), Flacker-Wächter rot.
- e2e/leser-links-p3.e2e.ts (seit #1067): misst den Unterstrich an der verzögert ladenden Materialien-Gruppe und wartet bis 20 s auf den ersten Link — wird es flaky, liegt es an dieser Wartezeit.
