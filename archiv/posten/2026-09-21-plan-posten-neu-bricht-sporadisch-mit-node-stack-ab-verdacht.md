<!-- @posten
dach: QS-EFFIZIENZ
titel: plan:posten neu bricht sporadisch mit Node-Stack ab (Verdacht: readFileSync(0) auf leerem Nicht-TTY-stdin)
anlass: Mutter/Tochter-Durchlauf 2, Tochter A, 21.9.2026
-->

Befund: Erster Aufruf von «npm run plan:posten -- neu …» in einer Agenten-Shell brach mit Node-Stacktrace ab, der zweite identische Aufruf lief durch (nicht diagnostiziert, Stack nicht gesichert). HYPOTHESE (ungeprüft): scripts/plan/posten.ts:76 liest ohne --text den Körper per readFileSync(0), sobald stdin kein TTY ist — in Agenten-Shells ist stdin eine nicht-blockierende Pipe ohne Daten, das wirft EAGAIN. Erst reproduzieren (Aufruf mit stdin aus einer leeren, offenen Pipe), dann fixen: EAGAIN/leer als «kein Text» behandeln. Nebenbefund derselben Session: Das Werkzeug zum SCHLIESSEN eines Postens existiert («plan:posten -- zu <datei> --beleg …»), wurde aber nicht gefunden (von Hand git mv + Erledigt-Zeile) — der Aufruf «zu» fehlt in der Hilfezeile von «neu» und im Skill bauschritt Station B.

**Erledigt 2026-09-24:** Hauptbefund behoben: stdinText behandelt EAGAIN auf leerem Nicht-TTY-stdin als «kein Text» (scripts/plan/posten.ts, ead7a0a4f/#983, 23.9.2026); Nebenbefund «zu»-Hilfe weitergeführt in plan/posten/2026-09-24-plan-posten-aufruf-zu-fehlt-in-der-hilfezeile-von-neu-und-im.md (M-18, 24.9.2026)
