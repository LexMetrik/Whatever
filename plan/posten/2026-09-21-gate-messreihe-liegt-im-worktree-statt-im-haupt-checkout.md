<!-- @posten
dach: QS-EFFIZIENZ
titel: Gate-Messreihe .selbstopt-ereignisse.jsonl liegt im jeweiligen Worktree statt im Haupt-Checkout
anlass: erster Trockenlauf von `npm run aufraeumen:git` auf main, 21.9.2026 (nach #955)
-->

  - [ ] **Gate-Messreihe in den Haupt-Checkout schreiben** *(Beleg 21.9.2026)* — `scripts/gate.sh` und `scripts/run-parallel.ts` schreiben die gitignorte Messreihe `.selbstopt-ereignisse.jsonl` (Leser: `scripts/analyse/tor-bewaehrung.ts`) in das Verzeichnis, in dem das Gate läuft — also in den jeweiligen Agenten-/Session-Worktree. Zwei Folgen: (1) jeder Worktree, der je das Gate fuhr, bleibt für `aufraeumen:git` dauerhaft «nicht sauber — 1 ignorierter Eintrag» und ist nie abräumbar (der Schutz ist korrekt: die Datei ist eine Messreihe, kein Bau-Cache — belegt an `agent-ab88f94b57efc9f81` und `agent-a0f560db1a4313a29`); (2) zu prüfen: erreichen die Gate-Ergebnisse aus Worktrees `tor:bewaehrung` überhaupt, oder liest es nur die Datei des Haupt-Checkouts — dann misst es die meisten Gate-Läufe (die in Worktrees stattfinden) nie. Wurzel-Fix-Kandidat: Pfad über `git rev-parse --git-common-dir` auf den Haupt-Checkout auflösen, wie `scripts/plan/notizen.ts` es für die Notizen-Dateien tut (anhängendes Schreiben, eine Zeile je Ereignis — auf parallele Schreiber achten). Bis dahin NICHT auf die Bau-Cache-Allowlist von `gitFlaechen.ts` setzen.
