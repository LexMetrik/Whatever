<!-- @posten
dach: W2·30-RL-W3
titel: verjaehrung.ts aufteilen (807 Z. > 800, §6.6)
anlass: Paket C 24.9.2026: RL-08 (Altrecht) + RL-14 PR 2 (Verzicht) liessen die Engine über die Schwelle wachsen; bewusst in die Schlankheits-Baseline aufgenommen
-->

Kandidaten: pruefeAltrecht (Art. 49 SchlT ZGB) und die Verzichts-Logik (Art. 141 OR) in eigene Module unter src/lib/verjaehrung/; Fassade behalten. Risikopfad ⇒ Refactoring-Protokoll (golden byte-gleich, Tests unverändert) + Gegenprüfung; danach Baseline-Eintrag in scripts/schlankheit-bestand.json streichen.
