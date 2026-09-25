<!-- @posten
dach: W2·29-WERKBANK-REST
titel: Entscheid-Suche — Zählzeile während der Rechenzeit und Mindestlänge des Suchbegriffs
anlass: Messung der W2·28-Bau-Session, 21.9.2026 (BS SB.2018.46); zwei Darstellungs-/Fach-Entscheide, die nicht aus der Messung folgen
-->

**Entscheid David 22.9.2026 (Chat):** Zählzeile **«leer lassen»** · Suche **«ab zwei Zeichen»**.
Beide Fragen sind damit beantwortet, der Marker `wartet-auf: david` ist entfernt — **der Posten ist
baubar.**

  - [ ] **Zählzeile in den ~170 ms Rechenzeit bleibt LEER** *(Entscheid David 22.9.2026)* — der Platz ist reserviert (`min-h-12`, CLS 0). Kein «wird gezählt»: das erzeugte zusätzliche Sprechakte im aria-live-Bereich. Deckt sich mit der Empfehlung der Bau-Session.
  - [ ] **Suche erst ab zwei Zeichen** *(Entscheid David 22.9.2026)* — ein einzelnes Zeichen erzeugt auf einem langen Entscheid 15 019 Treffer in 201 Erwägungen und ~150 ms Arbeit; der teuerste Aufruf ist per Konstruktion der erste und bewusst unentprellt. Die Mindestlänge ändert bewusst, was die Suche findet (Einzelzeichen wie «§» oder eine Ziffer fallen weg) — das ist der getroffene fachliche Entscheid, nicht ein Nebeneffekt.

Umgehängt 24.9.2026 (W2·17-UI-BEFUNDE → W2·29-WERKBANK-REST, Bündelung in den Werkbank-Umbau, Auftrag David 24.9. «was das Gleiche oder Ähnliches betrifft, auch in diesen Umbau»): S1 (EntscheidLeser); Verhaltensänderung → eigener Commit, getrennt vom Byte-Gleich-Beweis des Körpers.

**Erledigt 2026-09-25:** REST S1 (Kopf vor Rebase c0bf8b106, PR folgt): gebaut, Bug-Check Sonnet bestanden
