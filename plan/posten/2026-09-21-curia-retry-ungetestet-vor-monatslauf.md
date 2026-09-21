<!-- @posten
dach: QS-KORPUS
titel: Curia-Retry ist ungetestet — vor dem Monatslauf 1.10.2026 absichern
anlass: Auflage 2 der Gegenprüfung zu PR #960 (21.9.2026) — FRIST 1.10.2026 (Monatslauf)
-->

**FRIST: vor dem Monatslauf am 1.10.2026.**

In PR #960 hat `odata()` (`scripts/entstehung/curia-run.ts`) einen begrenzten Wiederholversuch
bekommen — Anlass war ein realer Abbruch: der Vollabgleich starb am 21.9.2026 bei **250 von 403**
Geschäften an einem einzelnen `ConnectTimeoutError` und warf 20 Minuten weg. Genau daran hängt der
Monatslauf, der die wiedergefundenen Publikationen fortschreibt.

**Das Problem: der Retry ist durch keinen Test gedeckt.** Er sitzt in einer Funktion, die in
`curia-run.ts` eingeschlossen ist und von aussen nicht aufrufbar. Ein Wiederholversuch, der nie
scharf gestellt wurde, ist genau die Sorte Sicherung, die im Ernstfall nicht greift — und der
Ernstfall ist hier terminiert.

**Zu tun:**
1. `odata()` bzw. den Wiederhol-Helfer in ein importierbares Modul ziehen (kleine, verhaltensneutrale
   Verschiebung; Muster für den Test: `src/tests/normtext-netz-retry.test.ts`).
2. Drei scharfe Fälle testen, mit gefälschtem `fetch`:
   - **Netzfehler beim ersten Versuch ⇒ zweiter Versuch wird gefahren und gelingt** (der eigentliche
     Zweck);
   - **HTTP 404 ⇒ sofortiger Fehler, KEIN Wiederholversuch** (ein Retry auf 4xx verschleiert einen
     Aufruffehler und verdreifacht die Last);
   - **Antwort mit `__next` ⇒ sofortiger Fehler** (der Paging-Wächter darf vom Retry nicht
     überfahren werden).
3. Prüfen, dass jeder Wiederholversuch geloggt wird — ein stiller Dauer-Retry darf nicht wie ein
   gesunder Lauf aussehen.

**Klasse:** `daten` (Risikopfad `scripts/entstehung/`), aber verhaltensneutral + Testbau ⇒ klein.
