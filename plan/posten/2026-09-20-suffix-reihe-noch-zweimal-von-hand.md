<!-- @posten
dach: W2·22-VERWEIS-FEDLEX
titel: Suffix-Reihe noch zweimal von Hand
anlass: §5-Duplikat, Nebenfund #852
-->

  - [ ] **Suffix-Reihe noch zweimal von Hand** *(§5-Duplikat, Nebenfund #852)* — `src/lib/normtext/passus.ts`
    endet bei `quinquies`, `src/lib/suche/normQuery.ts` und `src/lib/pdf/normLinks.ts` tragen verkürzte
    Reihen; alle drei auf `ART_SUFFIXE` (`src/lib/fedlex/nummer.ts`) umstellen. Dazu die Zähl-Divergenz
    `struktur-extrahiere.ts` ↔ `fussnoten-extrahiere.ts` (verschiedene Regex-Mengen für `__N`) auf eine
    gemeinsame Funktion ziehen. Korrektur zur Zeile (a): es sind **sechs** Konsumenten, nicht vier
    (`url`, `erkennung`, `parser`, `spannen`, `NormText.tsx`, `verweis-inventar-transkription`).
