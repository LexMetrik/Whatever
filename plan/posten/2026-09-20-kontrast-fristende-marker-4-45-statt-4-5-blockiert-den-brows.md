<!-- @posten
dach: W2·29-WERKBANK-REST
titel: Kontrast «Fristende»-Marker 4.45 statt 4.5 — blockiert den Browser-Test-Bump
anlass: 20.9.2026, Dependabot #918 geschlossen; `feld: design`, gehört fachlich zu `W2·17-UI-BEFUNDE` — hier abgelegt, weil die ROADMAP am 20.9. parallel umgeschichtet wurde; von dort hierher verschoben 20.9.2026, Freigabe der abgebenden Session
-->

  - [ ] **Kontrast «Fristende»-Marker 4.45 statt 4.5 — blockiert den Browser-Test-Bump** *(20.9.2026, Dependabot #918 geschlossen; `feld: design`, gehört fachlich zu `W2·17-UI-BEFUNDE` — hier abgelegt, weil die ROADMAP am 20.9. parallel umgeschichtet wurde; von dort hierher verschoben 20.9.2026, Freigabe der abgebenden Session)* — `@axe-core/playwright` 4.13.0 meldet in `e2e/a11y.e2e.ts` (Tagerechner, Tagerechner-Kalender, Tab-Streifen) `color-contrast (serious)`: `.text-auf-sage.bg-ok-solid.lc-termin-ring`, #faf7f2 auf #5f7a58, 14 px normal (Lauf 35513023881, deterministisch in allen drei Versuchen). Token `ok-solid` abdunkeln oder Schrift fetten (§13, Design-Reglement), danach `@dependabot reopen` auf #918 bzw. nächsten Monats-Bump landen.

Umgehängt 24.9.2026 (W2·17-UI-BEFUNDE → W2·29-WERKBANK-REST, Bündelung in den Werkbank-Umbau, Auftrag David 24.9. «was das Gleiche oder Ähnliches betrifft, auch in diesen Umbau»): S3, zusammen mit dem Kontrast-Posten vom 19.9. (derselbe Befund #918).
