<!-- @posten
dach: W2·18-FEHLERBUCH
titel: Flake-Rauswürfe Merge-Queue
anlass: Session-Notizen 2026-10-01
-->

9 von 25 merge_group-Rauswürfen 19.9.–1.10. (36 %) durch Flacker-Wächter, Shard 5 allein 5×; Tests leser-ruecksprung-r5-r7 (R7 Overlay; Läufe 36073915574, 36048365734), leser-v3-panel-nachzug (35897193063), leser-marken-geometrie (35804826179), d39-begruessung (35801504874), leser-position-u (36780379937). Wurzel je Spec messen.

**Stand 1.10.2026 (Session flake-rauswuerfe, je Spec gemessen):**
- Basislinie korrigiert: 347 merge_group-Läufe 19.9.–1.10. (nicht 331), 25 failure (7,2 %); 9 mit rotem Browser-Shard = 8 Flacker-Wächter + 1 harter Ausfall (35815367580, Shard 4: OR/ZGB-Leser rendert auf einem Runner nicht, Gegenläufe grün, Artefakte verfallen — nicht reproduzierbar). 17 der 25 Rauswürfe am 23./24.9.
- Shard 5: Last erklärt die Häufung NICHT (Shard 6 trägt mehr Testzeit und schwere Specs, 0 Flacker); erklärt durch zwei Specs — leser-v3-panel-nachzug (f) 3× (35897193063, 35984783583, 36009374111) und leser-ruecksprung-r5-r7 R7 2×. `e2e/shard-gruppen.json` unverändert.
- d39-begruessung (35801504874): schon vor dieser Session behoben durch K9 #1008 (eb8b18889, 16 h nach dem Lauf); main 280/280 + TZ=UTC 40/40 grün.
- leser-marken-geometrie (35804826179): schon behoben durch #984 (72180b6c6, 2 h nach dem Lauf; Zähler linear statt quadratisch).
- leser-ruecksprung-r5-r7 R7: Test-Defekt (Gatter `toHaveCount(0)` vor dem Erscheinen vakuum-wahr) — PR #1238.
- leser-position-u A17: App-Defekt (Tieflink-Sprung gibt auf, wenn `currency.json` nach dem Erlass-Text eintrifft) — PR #1240.
- leser-v3-panel-nachzug (f): App-Defekt (`history.back()` beim Zuschnittwechsel bricht laufende Navigation ab) — PR #1239, erster Ansatz in der Prüfung widerlegt (Flake im eigenen PR-Lauf), Nachzug läuft.
