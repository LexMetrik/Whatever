<!-- @posten
dach: W2·19-DESIGN-KONSISTENZ
titel: Rückbau-Kandidaten nach #1177 (Rolle «Tinte leise je Fläche» deckt sie): index.css ~4437 (.ub-kopf .lc-overline); ~5007 und ~5330 höhere Spezifität
anlass: Session-Notizen 2026-09-30
-->

vor Entfernen messen (Prüfer #1177)

**Stand 30.9.2026 (P1 Design-Kleinaufräumen):** Gemessen im Preview (1120 Kombinationen je Regel: Route `data-reg` × `header` × Band-Variante × Overline-Variante × hell/dunkel; Regel per CSSOM entfernt, berechnete Farbe vorher gegen nachher). (1) `.lc-route .ub-kopf .lc-overline, .ub-kopf .lc-overline` und (2) `.lc-titelblatt-band[data-reg] .lc-overline`: für Overlines OHNE eigene Farbe Farbe vorher = nachher, die Rolle «Tinte leise» trägt sie. Abweichung nur bei Overlines MIT eigener Farb-Utility (die Rolle schliesst sie bewusst aus, die Einzel-Regel schluckte deren Farbe); im Bestand steht dort keine. Beide entfernt, `rest-s1-entscheid-leser.test.tsx` liest jetzt die Rolle. (3) `.lc-route[data-reg="m"] .lc-titelblatt-band .lc-overline` bleibt: ohne sie fällt die Overline im Material-Band von ink-600 auf reg-m zurück (hell rgb 47,122,62 statt 92,86,74; der Kommentar am Fundort nennt 4.25:1 auf der Fläche, unter AA) — sie schlägt ③ (`.lc-route[data-reg] header .lc-overline`) und ist von der Rolle nicht gedeckt. Rest offen: nur rückbaubar, wenn ③ im Band für `reg-m` selbst auf Tinte gestellt wird (Designentscheid).
