<!-- @posten
dach: QS-CI-MINUTEN
titel: Playwright-Trace auch beim ersten Fehlversuch sichern (heute on-first-retry)
anlass: Verwaiste Session-Notiz, triagiert 24.9.2026 auf main a3d27e47c (2026-09-22-inventar-funktionen:217)
-->

playwright.config.ts:126: Trace erst ab dem Retry, der Erstfehler bleibt ohne Spur. Kosten (Artefakt-Grösse, Minuten) zuerst messen.
