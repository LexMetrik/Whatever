<!-- @posten
dach: W2·17-UI-BEFUNDE
titel: Marken-Schalter «Hervorhebung» setzt sich nach Leeren der Suche nie zurück — Kommentar verspricht das Gegenteil (beide Leser)
anlass: Bau Entscheid-Suche «ein Stand» (Tochter B, 21.9.2026) — Code-Beleg durch Bau- und Orchestrierungs-Session
-->

  - [ ] **§8: Kommentar und Verhalten widersprechen sich** — `src/pages/EntscheidLeser.tsx` (Block «W2·28 · L-2 · EIN Schalter …») verspricht «Wer das Feld leert, findet beim nächsten Suchen wieder Farbe vor». Tatsächlich wird `markenAusRoh` nie zurückgesetzt (einziger Setzer: Schalter-Klick); `markenAus = suche nicht leer && markenAusRoh` MASKIERT nur, solange das Feld leer ist. Nach Leeren + Neu-Tippen ist die Hervorhebung wieder aus. Gleiches Muster Gesetz-Leser `useMarkenSchalter` (`src/pages/gesetz-leser/inhalt-suchtreffer.tsx`). Entscheiden, was gilt (Rücksetzen beim Leeren ODER Kommentar berichtigen), dann beide Leser gleich bauen, mit Test (Leeren → Neu-Tippen → Hervorhebung an/aus). Im Bau «ein Stand» bewusst NICHT geändert (Semantik beider Leser).
