<!-- @posten
dach: W2·18-FEHLERBUCH
titel: katalogKurzform() liefert null für Katalog-Karten ohne kurz → Volltitel in Reitern und Treffern (D23-F1)
anlass: Nebenfund Design-Entwurf 22.9.2026 (Entscheid David «alle aufnehmen»), nachgeprüft auf main a3d27e47c am 24.9.2026
-->

verlaufLabel.ts:56 gibt null zurück, wenn karte.kurz fehlt; tabs.ts:342 und trefferAnatomie.ts:39 fallen dann auf den Volltitel zurück. Kurzformen ergänzen oder ableiten.
