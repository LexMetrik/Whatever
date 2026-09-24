<!-- @posten
dach: QS-CI-MINUTEN
titel: Browser-Smoke-Shard bricht nach 4 Fehlern ab: Folgefehler bleiben unsichtbar, kosten je einen weiteren CI-Lauf
anlass: Session-Notizen 2026-09-25 (LESER-Landungen, Session 4)
-->

Beleg #1072 (Lauf 36061643618, Shard 6/8): nach vier Fehlern Abbruch, 59 Tests liefen nie; ein dritter echter Fehler (leser-v3-panel-entscheide-s6.e2e.ts:34) zeigte sich erst lokal. Prüfen: maxFailures im Shard anheben oder bei Rot die restlichen Specs des Shards trotzdem fahren — Abwägung gegen CI-Minuten.
