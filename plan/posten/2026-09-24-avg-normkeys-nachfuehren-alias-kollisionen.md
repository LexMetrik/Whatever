<!-- @posten
dach: QS-KORPUS
titel: AVG-normKeys nachführen + Alias-Kollisionen
anlass: Fahrplan-Eintrag fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md §1, Restposten aus ROADMAP.md, migriert 24.9.2026 (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET)
-->

  - [ ] **AVG-normKeys nachführen + Alias-Kollisionen** *(Gegenprüfung #911, 18.9.2026)* — 11 Snapshots (5 BGE 147 II 397 · 148 II 203 · 148 II 426 · 151 II 178 · 151 III 143; 6 BS BEZ.2023.59 · VD.2025.49 · ZB.2023.64 · ZB.2023.66 · ZB.2024.11 · AH.2023.9) tragen `AVG` erst nach dem Voll-Lauf `npm run entscheide` · Tor-Kandidat: neue Fedlex-Aliase gegen kantonale Kürzel prüfen (it-«LC» = Waadtländer LC, gesperrt in `ABK_AUSSCHLUSS`; im Korpus dazu «Least Concern», «RS/GE LC», «letter of credit»; «LSE» = Lohnstrukturerhebung latent); feiner als die Sperre wäre der B1-Riegel `fremdDefinierteKeys` (`bezuege-bauen.ts:339 ff.`, dritter Fall 149 I 343) · `GESETZ_CODE` (`zitat-extraktion.ts:271`) erlaubt Umlaut nur am Code-Ende ⇒ «Art. 7 EÖBV» im Fliesstext unauflösbar (24/549 Kürzel) · `check:normkeys`: IGNORE 'VO' unter Schwelle (19 < 20) = Streich-Kandidat.

Migriert 24.9.2026 aus `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md` (§1, Restposten aus ROADMAP.md, vormals Z. 48) — dort steht jetzt ein Zeiger hierher (Bauplan-Konsolidierung M-28, QS-DOKU-DIAET).
