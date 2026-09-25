<!-- @posten
dach: QS-KORPUS
titel: BGE 152 I 2 mit amtlichem clir-Auszug aufnehmen
anlass: Gegenprüfung PR #1099 (BGE-Band-Nachzug 152), 25.9.2026
-->

25.9.2026: BGE 152 I 2 fehlt im Korpus, weil OCLs Basis-Record als Auszug den Text von 152 I 20 liefert (Konflations-Guard, PR #1099); Regeste (clir) und aza-Volltext 1C_435/2024 sind korrekt. Fix: den amtlichen Sammlungs-Auszug aus bger.ch clir statt aus OCL holen und den Entscheid dann additiv nachziehen.

**Erledigt 2026-09-25:** Branch feat/qs-korpus-bge-152-i-2 — clir-auszug.ts (parseClirAuszug/ersetzeKonflatiertenAuszug), Nachzug Band 152 +1 BGE
