<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Drift-Riegel Rest nach B1-Ausdehnung: Kanton-Labels ungeprüft (34 907 Einträge), freie Labels annex_u/decl (98) nur nichtleer, Datenfund VRV annex_II «+Anhang II».
anlass: Session-Notizen 2026-09-30; B1-Ausdehnung auf 997 Bund-Einträge gebaut (Branch fix/w227-drift-riegel-b1)
-->

Drift-Riegel Rest nach B1-Ausdehnung (30.9.2026): B1 deckt jetzt alle 25 601 Bund-Einträge (Label aus id für 25 474, Format/nichtleer für 126, 1 festgenagelte Ausnahme); B2 («Label = Basis + Wiederholungs-Adverb, eindeutig») und B4 (Mehrheits-Basis statt erster Eintrag) sind geschärft. Offen bleibt, was sich nicht aus der id ableiten lässt und in der Tor-Ausgabe als «UNGEPRÜFT» steht:

1. **Kanton-Labels (34 907 Einträge, `public/normtext/kanton`)**: kein `#Anker`, Label nicht aus der id ableitbar — eine Prüfung braucht eine amtliche Label-Regel je Kanton/Erlass (z. B. «§ n» vs. «Art. n»), nicht raten.
2. **Freie Labels** `annex_u` (81) und `decl` (17): Fedlex-Titel, nur «nichtleer» geprüft; `scope` (28) nur auf Format.
3. **Datenfund (Daten-Session, nicht im Riegel)**: `bund/VRV/annex_II` trägt `artikelLabel` «+Anhang II» (Quelltext-Artefakt?) — gegen Fedlex prüfen, Snapshot per Generator korrigieren, danach `LABEL_AUSNAHMEN` in `scripts/normtext/drift-logik.ts` leeren (der Riegel meldet die überholte Ausnahme selbst).
