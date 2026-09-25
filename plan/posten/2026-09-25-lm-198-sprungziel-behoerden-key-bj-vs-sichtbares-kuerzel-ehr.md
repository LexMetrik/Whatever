<!-- @posten
dach: W2·29-WERKBANK-NACHLAUF
titel: LM-198 — Sprungziel/Behörden-Key «BJ» vs. sichtbares Kürzel «EHRA»: welcher Wert soll die Sprungmarke tragen? (Datenänderung)
anlass: Umgehängt 25.9.2026 (REST S5c) aus FAHRPLAN-UI-BEFUNDE.md LM-198 (archiviert)
wartet-auf: david
-->

Grep 25.9. bestätigt unverändert: src/lib/materialien/typen.ts:35 und register.ts:32 führen den Behörden-Key 'BJ' (Bundesamt für Justiz) mit sichtbarem Kürzel 'EHRA' (Eidg. Amt für das Handelsregister); die Sprungmarke /materialien#b-BJ zeigt auf eine Überschrift 'EHRA'. Beide Wege sind Korpus-Daten (Key umbenennen berührt alle liveLink-Aufrufe) bzw. Testerwartung (src/tests/materialien-register.test.ts, §6.3-Sperre) — Klasse daten, eigener Schritt mit Datenänderung nötig. Fachlich korrekt ist 'BJ' als Amt, 'EHRA' das Amt darin; Frage an David: welcher Wert soll die Sprungmarke selbst tragen?
