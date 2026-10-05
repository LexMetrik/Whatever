<!-- @posten
dach: QS-EFFIZIENZ
titel: Verbrauchs-Summe als npm-Script
anlass: Mutter/Tochter-Durchlauf 2, 21.9.2026
-->

Skript `plan/posten/anhang/2026-09-21-verbrauch-summe.py` (kopiert aus `.claude/notizen/verbrauch-summe.py`, byte-gleich) als `npm run`-Script verdrahten, damit der Aufruf nicht mehr per `python3 <voller-pfad>` erfolgen muss. Methode: je `message.id` das Maximum je Feld, je Modell (naiv zaehlt jede Transkriptzeile mit `usage` und liegt 1,6-2x zu hoch, weil eine Antwort je Inhaltsblock auf einer eigenen Zeile steht). Offene Methodenfrage: faellt Cache-Write immer zum 1-h-Tarif, oder waere ein Teil zum guenstigeren 5-min-Tarif zu buchen (37,5% Unterschied in dieser Position, nicht belegt). Preise USD/MTok, Abruf 21.9.2026: Fable 5.1 10/50/20/0,25 (in/out/cache-write-1h/cache-read) - Opus 5 5/25/10/0,50 - Sonnet 5 2/10/4/0,20. Quelle: .claude/notizen/archiv/2026-09-21-mutter-tochter-durchlauf-2.md §3/§8.
