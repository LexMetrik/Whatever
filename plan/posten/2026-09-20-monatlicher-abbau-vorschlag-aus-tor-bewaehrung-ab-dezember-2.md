<!-- @posten
dach: QS-EFFIZIENZ
titel: Monatlicher Abbau-Vorschlag aus tor:bewaehrung (ab Dezember 2026)
anlass: Entscheid David 20.9.2026, Teil 3
wartet-auf: david
-->

EIN Kandidat pro Monat, nicht mehr — Vorschlag, kein Automatismus.

Kandidaten-Regel: ein Tor, das seit >= 90 Tagen NIE rot war UND nicht auf der
Rechtsschutz-Liste von scripts/analyse/steuerflaecheKern.ts steht. Quelle ist
messwerte/tor-bewaehrung.json (npm run tor:bewaehrung).

Zwei Vorbedingungen, beide offen:
1. Der Fang-Scanner-Bug in der Bewaehrungs-Erhebung ist zuerst zu beheben —
   ohne ihn zaehlt die Historie falsch, und ein falscher Nie-rot-Befund
   streicht ein wirksames Tor.
2. Die Historie muss >= 90 Tage tragen. Erhebungsbeginn beachten; vor
   Dezember 2026 ist die Reihe zu kurz, der Vorschlag waere geraten.

Ergebnis je Monat: EIN Posten mit wartet-auf david, der das Tor benennt, den
Nie-rot-Zeitraum belegt und den Chesterton-Vorbehalt aus dem Skill lehren
(Satz 3) ausdruecklich prueft. Entscheid trifft David, nie die Session.
