<!-- @posten
dach: QS-CI-MINUTEN
titel: Prod-Deploy läuft auch für code-ferne Änderungen
anlass: Session 20.9.2026, Prozess-Messung
-->

Die Deploy-Bedingung schliesst nur `art=doku` aus. #933 und #938 änderten ausschliesslich `.claude/**` und lösten trotzdem Deploys aus. Beim Nachschärfen muss `NUR_DOKU` in `scripts/betrieb/prod-smoke.ts:181` im selben Schnitt gleichziehen, sonst laufen Klassierung und Smoke auseinander (§5).
