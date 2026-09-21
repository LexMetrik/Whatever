<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Entscheid-Suche — Zählzeile während der Rechenzeit und Mindestlänge des Suchbegriffs
anlass: Messung der W2·28-Bau-Session, 21.9.2026 (BS SB.2018.46); zwei Darstellungs-/Fach-Entscheide, die nicht aus der Messung folgen
wartet-auf: david
-->

  - [ ] **Zählzeile in den ~170 ms Rechenzeit: leer oder «wird gezählt»?** *(wartet auf David)* — der Platz ist reserviert (`min-h-12`, CLS 0). «Leer» ist ruhig; «wird gezählt» ist ehrlicher, erzeugt aber zusätzliche Sprechakte im aria-live-Bereich (Screenreader). Empfehlung der Bau-Session: leer lassen.
  - [ ] **Suche erst ab zwei Zeichen?** *(wartet auf David — fachlicher Entscheid, keine Messfrage)* — ein einzelnes Zeichen erzeugt auf einem langen Entscheid 15 019 Treffer in 201 Erwägungen und ~150 ms Arbeit; der teuerste Aufruf ist per Konstruktion der erste und bewusst unentprellt. Eine Mindestlänge wäre der einzige echte Hebel — sie ändert aber, was die Suche findet (ein Jurist sucht selten, aber nicht nie nach «§» oder einer Ziffer).
