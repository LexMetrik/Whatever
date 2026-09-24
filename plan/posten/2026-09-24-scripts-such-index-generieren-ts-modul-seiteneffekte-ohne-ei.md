<!-- @posten
dach: W2·18-FEHLERBUCH
titel: scripts/such-index-generieren.ts: Modul-Seiteneffekte ohne Einstiegs-Wächter
anlass: Nebenfund Design-Entwurf 22.9.2026 (Entscheid David «alle aufnehmen»), nachgeprüft auf main a3d27e47c am 24.9.2026
-->

Z. 36–38 rechnen Pfade auf Modulebene; es gibt keinen Wächter, der den CLI-Teil nur beim direkten Aufruf laufen lässt (nur process.argv.includes('--check') in einer Funktion, Z. 266). Muster Kern/Hülle wie scripts/plan/posten.ts ↔ postenKern.ts.
