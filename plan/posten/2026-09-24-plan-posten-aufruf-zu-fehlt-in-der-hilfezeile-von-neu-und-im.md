<!-- @posten
dach: QS-EFFIZIENZ
titel: plan:posten — Aufruf «zu» fehlt in der Hilfezeile von «neu» und im Skill bauschritt Station B
anlass: Nebenbefund des Postens «plan:posten neu bricht sporadisch …» (21.9.2026), weitergeführt 24.9.2026
-->

Wortlaut des Nebenbefunds (21.9.2026): «Das Werkzeug zum SCHLIESSEN eines Postens existiert («plan:posten -- zu <datei> --beleg …»), wurde aber nicht gefunden (von Hand git mv + Erledigt-Zeile) — der Aufruf «zu» fehlt in der Hilfezeile von «neu» und im Skill bauschritt Station B.»

Stand 24.9.2026: `.claude/skills/bauschritt/aufraeumen.md` Z.50 nennt «zu»; `SKILL.md` Station B und die Hilfezeile von «neu» (`scripts/plan/posten.ts:85`) nennen es weiterhin nicht. Steuerfläche beachten (Skill und scripts/plan zählen mit). Der Hauptbefund (EAGAIN) ist behoben, der Ursprungs-Posten geschlossen (archiv/posten/).
