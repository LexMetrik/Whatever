<!-- @posten
dach: W2·18-FEHLERBUCH
titel: e2e/verzahnung.e2e.ts:35 (MM3, Entscheid-Detail) flackert auf main (2/16)
anlass: Session-Notizen 2026-09-23
-->

ohne Ausnahme-Eintrag; Wurzel-Fix (REST/Entscheid-Leser)

Umgehängt 24.9.2026 (W2·18-FEHLERBUCH → W2·29-WERKBANK-REST, Bündelung in den Werkbank-Umbau, Auftrag David 24.9. «was das Gleiche oder Ähnliches betrifft, auch in diesen Umbau»): S0/S1 (Wurzel-Fix im Entscheid-Leser, wie der Posten selbst sagt).
- Stand 25.9.2026 (REST S1): lokal nicht reproduzierbar — 16× warm, 4× unter Last (132 grün), 12× CPU-Drossel 1/4/8, verzögerter Scheduler: nie rot. Vermutung Scroll-Listener `Shell.tsx` ↔ window-`scroll` mit scrollY=0 beim Pane-Öffnen selbst widerlegt. Braucht den Fehler-Trace aus einem roten CI-Lauf; bis dahin offen, keine Ausnahme.
Umgehängt 25.9.2026 (W2·29-WERKBANK-REST → W2·18-FEHLERBUCH, Abschluss REST): Flacker ohne lokale Reproduktion — gehört ins Fehlerbuch, braucht den Trace eines roten CI-Laufs.
