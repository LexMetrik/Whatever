<!-- @posten
dach: QS-MONITOR-ROT
titel: fedlex-frische.yml schliesst offenen Alarm-Zettel bei Grün nicht selbst
anlass: Bug-Check #1254, 3.10.2026
-->

  - [ ] **fedlex-frische.yml ohne Auto-Schliessen bei Grün:** waechter, prod-smoke und normen-monitor schliessen ihren Alarm-Zettel bei grünem Lauf, fedlex-frische nicht — ein einmal angelegter Zettel bleibt offen und steht dann dauerhaft als `🚨 Alarme` in `plan:next`, bis jemand ihn von Hand schliesst. Wurzel-Fix: Schliess-Schritt wie in den drei anderen Monitoren nachziehen, Stub-Probe (gh als Shell-Funktion) zuerst rot zeigen. Fundort `.github/workflows/fedlex-frische.yml`.
