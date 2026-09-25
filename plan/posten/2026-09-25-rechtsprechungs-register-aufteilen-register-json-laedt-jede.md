<!-- @posten
dach: QS-PERF
titel: Rechtsprechungs-Register aufteilen (register.json lädt jede Leserseite)
anlass: PR #1112, Budget-Freigabe David 25.9.2026
-->

25.9.2026: public/rechtsprechung/register.json liegt nach BS-Delta bei 795 KB gzip und lädt jede Leserseite (scripts/perf/daten-budget.ts). Budget auf Davids Entscheid 780 → 900 KB angehoben (Reserve ~3–4 Monate Wochen-Zuwachs, #1113). Wurzel-Fix: Register nach Rolle/Gericht aufteilen (z. B. schlanke Such-/Kartenprojektion + je Gericht nachladen), §15-Logikverlust-Bewertung, danach Budget wieder auf Ist + Reserve senken.
