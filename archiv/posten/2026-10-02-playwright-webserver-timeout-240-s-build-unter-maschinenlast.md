<!-- @posten
dach: QS-BASIS
titel: Playwright-webServer-Timeout (240 s Build) unter Maschinenlast: eigener Build + E2E_PORT-Preview als Notbehelf
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

Bericht #1255, 2.10.2026: bei Maschinenlast ~30 läuft der lokale webServer-Build der playwright.config in den 240-s-Timeout; der Agent half sich mit eigenem Build + E2E_PORT-Preview (Notbehelf, kein Wurzel-Fix). Wurzel: Timeout last-abhängig oder einen vorgebauten Server wiederverwenden (Hinweis §0 Ziff. 4c: lokal baut playwright.config vor `preview` neu, F11).
