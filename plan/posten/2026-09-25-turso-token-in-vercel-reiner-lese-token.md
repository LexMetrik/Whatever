<!-- @posten
dach: QS-BASIS
titel: Turso-Token in Vercel: reiner Lese-Token?
anlass: Herz-und-Nieren-Prüfung 24.9.2026, Zweitprüfung sicherheit-a11y (SA-05); UMSETZUNGSPLAN Abschnitt 8
wartet-auf: david
-->

Frage an David: Ist der Turso-Token, den Vercel für die Such-API nutzt, ein reiner Lese-Token? Ein Token mit Zeilenumbruch im Wert würde über `api/suche.ts:169` (`detail: String(e)`) wörtlich an anonyme Aufrufer gehen (SA-05, bestätigt). Optionen: (a) eigenen Lese-Token in Vercel hinterlegen · (b) lassen. Empfehlung: (a). Mindert HN-11, blockiert nichts.
