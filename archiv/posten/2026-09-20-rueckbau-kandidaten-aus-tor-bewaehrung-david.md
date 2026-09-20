<!-- @posten
dach: QS-EFFIZIENZ
titel: Rückbau-Kandidaten aus tor:bewaehrung (David)
wartet-auf: david
-->

  - [ ] **Rückbau-Kandidaten aus `npm run tor:bewaehrung` — wartet auf David:** `check:smoke` · `check:sweep` · `check:verfall` · `check:normtext` (je 83 Läufe, null Rot seit Einführung, Stand 15.9.2026); dazu entscheiden, ob `tor:bewaehrung` und `retro:17` (gleiche Frage, andere Zeitreihe) zusammengelegt werden (§17-Gegengewicht). Hook-Log-Diff für die 9 Hooks liegt bei David (`/tmp/qs-bewaehrung-hook-log.diff`).

**Erledigt 2026-09-20:** Entscheid 20.9.2026 nach Nachmessung: check:normtext, check:verfall (Rechtsdaten) und check:sweep (Rechtslogik) bleiben; check:smoke bleibt (Fang 24.6.2026 vor Deploy, toter Import — Betriebsnotiz); Zusammenlegung mit retro:17 gegenstandslos, retro:17 wird abgebaut (eigener PR).
