<!-- @posten
dach: W2·29-WERKBANK-REST
titel: Marken-Schalter «Hervorhebung» setzt sich nach Leeren der Suche nie zurück — Kommentar verspricht das Gegenteil (beide Leser)
anlass: Bau Entscheid-Suche «ein Stand» (Tochter B, 21.9.2026) — Code-Beleg durch Bau- und Orchestrierungs-Session
-->

  - [ ] **§8: Kommentar und Verhalten widersprechen sich** — `src/pages/EntscheidLeser.tsx` (Block «W2·28 · L-2 · EIN Schalter …») verspricht «Wer das Feld leert, findet beim nächsten Suchen wieder Farbe vor». Tatsächlich wird `markenAusRoh` nie zurückgesetzt (einziger Setzer: Schalter-Klick); `markenAus = suche nicht leer && markenAusRoh` MASKIERT nur, solange das Feld leer ist. Nach Leeren + Neu-Tippen ist die Hervorhebung wieder aus. Gleiches Muster Gesetz-Leser `useMarkenSchalter` (`src/pages/gesetz-leser/inhalt-suchtreffer.tsx`). Entscheiden, was gilt (Rücksetzen beim Leeren ODER Kommentar berichtigen), dann beide Leser gleich bauen, mit Test (Leeren → Neu-Tippen → Hervorhebung an/aus). Im Bau «ein Stand» bewusst NICHT geändert (Semantik beider Leser).

Umgehängt 24.9.2026 (W2·17-UI-BEFUNDE → W2·29-WERKBANK-REST, Bündelung in den Werkbank-Umbau, Auftrag David 24.9. «was das Gleiche oder Ähnliches betrifft, auch in diesen Umbau»): Entscheid-Leser-Teil in S1; Gesetzes-Leser-Teil ist LESER-Fläche → in NACHLAUF N2 nachziehen.

**Erledigt 2026-09-25:** REST S1: Entscheid-Leser gebaut (Rücksetzen beim Leeren, Test rest-s1-entscheid-suche); Gesetzes-Leser-Teil als NACHLAUF-Posten umgebucht
