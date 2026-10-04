<!-- @posten
dach: QS-BASIS
titel: Tor-Lücke: NormText.tsx und src/components/normtext/** entscheiden über Verweis-Links, stehen aber nicht in istRisikoPfad
anlass: Abschluss Session «Gesetzesleser Funktionen inventarisieren» 2.10.2026 (Station E)
-->

scripts/gegenpruefung/kern.ts (istRisikoPfad, ~Z.246) kennt src/lib/normtext/** und scripts/normtext/**, nicht aber src/components/NormText.tsx und src/components/normtext/** — dort wird die §1-Rechtsaussage getroffen, welcher Artikel gemeint ist (Verweis-Linker). Analog zur fedlex/-Präzedenz 2.9.2026 aufnehmen; Tor-Änderung = eigener Schritt mit Gegenprüfung (und Rot-Beweis §6.7). Beleg: Delta-Prüfung #1264, 2.10.2026; Platte-Stand 2.10.: grep «NormText» in kern.ts ohne Treffer.
