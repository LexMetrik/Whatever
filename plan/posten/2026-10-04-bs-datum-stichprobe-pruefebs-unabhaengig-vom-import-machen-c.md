<!-- @posten
dach: QS-KORPUS
titel: BS-Datum: Stichprobe pruefeBs unabhaengig vom Import machen, check:bs-entscheide gegen den Kopf
anlass: Gegenpruefung #1303, 4.10.2026
-->

pruefeBs (scripts/rechtsprechung/wochenlauf-kern.ts) nutzt dieselbe Regel waehleBsDatum wie der Import und ist damit nicht unabhaengig (§6.7): ein Regelfehler wuerde beidseitig durchgehen. Zweiter, regelfreier Leser noetig (z. B. Titel/Datum direkt aus dem Deckblatt-Text ohne Plausibilitaetslogik). Ausserdem vergleicht check:bs-entscheide datum nicht mit dem Kopf: ein falsches Datum unter 60 Tagen faellt nur bei Register-Abweichung auf; Rohdokumente liegen im Tor nicht vor, daher z. B. Kopf-Datum als Provenienzfeld ablegen oder das Tor auf Stichprobe-gegen-Netz verlagern. Nicht erkannte Titel: URTEIL (Rektifikat), REKTIFIKAT (15 Dokumente ohne lesbaren Kopf).
