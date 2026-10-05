<!-- @posten
dach: W2·18-FEHLERBUCH
titel: scripts/ui-normzitate-kommentare.ts:40 — Hand-Lexer wertet // in URLs als Kommentar
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §4, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

- [ ] **`scripts/ui-normzitate-kommentare.ts:40` — Hand-Lexer wertet `//` in URLs als Kommentar** *(Prüfer #856, latent)* — steht in ausgeliefertem JSX-Text eine URL (`https://…`) und im selben Text ein falsches Zitat, gilt der Rest der Zeile als Kommentar und das Tor bleibt grün. **Heute 0 reale Fälle.** Fix: `//` nur dann als Kommentar werten, wenn kein `:` unmittelbar vorangeht.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§4, vormals Z. 278) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
