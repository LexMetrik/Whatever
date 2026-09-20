<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: Kontrast unter 4,5:1 an zwei Tokens — blockiert Dependabot #918
anlass: 19.9.2026
-->

  - [ ] **Kontrast unter 4,5:1 an zwei Tokens — blockiert Dependabot #918** *(19.9.2026)* — das axe-Update der Gruppe `browser-tests` meldet echte Verstösse: `.lc-termin-ring` 4,45:1 und `.text-auf-gold` 3,46:1 (WCAG AA verlangt 4,5:1 für Normaltext). Tokens in `src/index.css` auf ≥ 4,5 heben (Reglement §F0; Farbwahl: David darf bestimmen, sonst minimal abdunkeln), dann #918 einreihen. Kommentar mit den Messwerten steht am PR.
