<!-- @posten
dach: W2·7-VZUI
titel: Kantonaler Zitat-Resolver
-->

  - [ ] **Kantonaler Zitat-Resolver** — 9 674 kantonale Kanten haben weiterhin kein Sprungziel: `fedlexLinkFuerArtikel`/`normVerweiseImText` kennen nur Bundesrecht, und die wörtliche Regel greift nur, wo der Entscheid exakt `§ N <Kürzel>` schreibt. Nötig wäre eine Kürzel-/Alias-Tabelle je kantonalem Erlass **mit Kanton-Scoping** (ein «StG» in BS ist nicht das «StG» in ZH — ohne Scoping entstünde ein stumm falscher Sprung, §1). Risiko-Pfad Extraktion ⇒ eigener Schritt mit Gegenprüfung, nicht als UI-Nebenprodukt.
