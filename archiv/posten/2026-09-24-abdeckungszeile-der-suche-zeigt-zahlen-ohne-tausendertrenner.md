<!-- @posten
dach: W2·18-FEHLERBUCH
titel: Abdeckungszeile der Suche zeigt Zahlen ohne Tausendertrenner (zahlGruppiert fehlt)
anlass: Nebenfund Design-Entwurf 22.9.2026 (Entscheid David «alle aufnehmen»), nachgeprüft auf main a3d27e47c am 24.9.2026
-->

SuchResultate.tsx:515 rendert abdeckung.volltext/abdeckung.bge roh. Über zahlGruppiert führen (Lesbarkeit, Schweizer Tausendertrenner).
