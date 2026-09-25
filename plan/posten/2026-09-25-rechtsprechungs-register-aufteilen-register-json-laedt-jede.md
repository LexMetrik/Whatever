<!-- @posten
dach: QS-PERF
titel: Rechtsprechungs-Register aufteilen (register.json lädt jede Leserseite)
anlass: PR #1112, Budget-Freigabe David 25.9.2026
-->

25.9.2026: public/rechtsprechung/register.json liegt nach BS-Delta bei 795 KB gzip und lädt jede Leserseite (scripts/perf/daten-budget.ts). Budget auf Davids Entscheid 780 → 900 KB angehoben (Reserve ~3–4 Monate Wochen-Zuwachs, #1113). Wurzel-Fix: Register nach Rolle/Gericht aufteilen (z. B. schlanke Such-/Kartenprojektion + je Gericht nachladen), §15-Logikverlust-Bewertung, danach Budget wieder auf Ist + Reserve senken.

**DRINGLICH (Gegenprüfung #1113, 25.9.2026):** register.json steht bei 819'014 B gzip = 88,9 % des 900-KB-Budgets — die 90-%-Warnung fällt vermutlich schon im nächsten Wochenlauf. Bei ~7–12 KB/Woche Zuwachs (Messbericht A Ziff. 12) bleiben ab jetzt nur noch ~7 Wochen Reichweite, nicht die ursprünglich angenommenen 3–4 Monate. David informiert.
