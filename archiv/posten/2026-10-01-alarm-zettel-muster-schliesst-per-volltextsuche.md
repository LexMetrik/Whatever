<!-- @posten
dach: QS-MONITOR-ROT
titel: Alarm-Zettel-Muster schliesst per Volltextsuche
anlass: Session-Notizen 2026-10-01
-->

prod-smoke.yml und waechter.yml suchen den offenen Zettel per `in:title`-Volltext; ein von Hand angelegter Zettel mit denselben Titelwörtern würde mitgeschlossen, und ein Ausfall von `gh issue list` färbt einen grünen Lauf rot (Zweitprüfung #1224, B3). Besser: Label statt Titelsuche.

**Erledigt 2026-10-01:** —
