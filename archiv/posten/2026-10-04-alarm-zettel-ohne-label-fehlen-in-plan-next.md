<!-- @posten
dach: QS-MONITOR-ROT
titel: Ersatzweise ohne Label angelegte Alarm-Zettel fehlen in plan:next
anlass: Bug-Check #1254, 3.10.2026
-->

  - [ ] **Alarm-Zettel ohne `alarm:*`-Label unsichtbar:** legen die Monitor-Workflows den Zettel ersatzweise ohne Label an (Label-Anlage scheitert), filtert die Alarm-Zeile in `scripts/plan/lage.ts` (`alarmZeile`) ihn weg — der Alarm existiert, `plan:next` meldet «keine offenen». Wurzel-Fix: Zettel ohne Label, aber mit Alarm-Titel-Präfix (Autor github-actions[bot]) als «?» mitzählen oder den Workflow bei Label-Fehler laut scheitern lassen; Test zuerst rot.
