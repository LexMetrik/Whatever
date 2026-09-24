<!-- @posten
dach: W2·30-RL-W2A
titel: sperrfristen.ts aufteilen (850 Z. > 800, §6.6) — nach RL-16 in Baseline
-->

sperrfristen.ts aufteilen (850 Z. > 800, §6.6) — nach RL-16 in Baseline

Anlass: RL-16 (Probezeit, W2·30-RL-W2A Paket 4) hob src/lib/sperrfristen.ts auf 850 Zeilen (Schwelle 800, §6.6). Am 25.9.2026 bewusst in scripts/schlankheit-bestand.json aufgenommen, um die gegengeprüfte Fachänderung nicht mit einem Struktur-Umbau zu mischen. Aufteilen nach Skill refactoring (Fassade, golden byte-gleich, Gegenprüfung Risikopfad), z. B. Probezeit-Warnung/Rückfall-Logik auslagern. Vorbild: Posten «verjaehrung.ts aufteilen».
