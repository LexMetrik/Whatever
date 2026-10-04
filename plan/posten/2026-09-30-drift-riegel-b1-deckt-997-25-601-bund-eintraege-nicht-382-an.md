<!-- @posten
dach: W2·27-BUND-FERTIG
titel: Drift-Riegel Rest nach B1-Ausdehnung: Kanton-Labels ungeprüft (34 907 Einträge), freie Labels annex_u/decl (98) nur nichtleer, Datenfund VRV annex_II «+Anhang II».
anlass: Session-Notizen 2026-09-30; B1-Ausdehnung auf 997 Bund-Einträge gebaut (Branch fix/w227-drift-riegel-b1)
-->

**Stand 1.10.2026 (W2·27 P1 Tor-Härtung, Branch feat/w227-p1-tor-haertung):** Punkt 4 (B4 an gepinntes ELI/de gebunden, Regel `B4-basis-pin`) und der ORDINAL_SUFFIX-Rest (vicies ff.) sind gebaut. Offen bleiben: Punkte 3 und 5 → Paket P8 (Daten: VRV «+Anhang II» normalisieren + LABEL_AUSNAHMEN leeren; «Art. N und M»-Schreibweise, Trennzeichen-Wahl = Fachentscheid, siehe Posten drift-riegel-schreibt-normalisierung); Punkte 1 und 2 (Kanton-Labels je Kanton, freie Labels annex_u/decl) zurückgestellt auf Phase 2 Kanton — brauchen eine amtliche Label-Regel je Kanton/Erlass, nicht raten (§7).

Drift-Riegel Rest nach B1-Ausdehnung (30.9.2026): B1 deckt jetzt alle 25 601 Bund-Einträge (Label aus id für 25 474, Format/nichtleer für 126, 1 festgenagelte Ausnahme); B2 («Label = Basis + Wiederholungs-Adverb, eindeutig») und B4 (Mehrheits-Basis statt erster Eintrag) sind geschärft. Offen bleibt, was sich nicht aus der id ableiten lässt und in der Tor-Ausgabe als «UNGEPRÜFT» steht:

1. **Kanton-Labels (34 907 Einträge, `public/normtext/kanton`)**: kein `#Anker`, Label nicht aus der id ableitbar — eine Prüfung braucht eine amtliche Label-Regel je Kanton/Erlass (z. B. «§ n» vs. «Art. n»), nicht raten.
2. **Freie Labels** `annex_u` (81) und `decl` (17): Fedlex-Titel, nur «nichtleer» geprüft; `scope` (28) nur auf Format.
3. **Datenfund (Daten-Session, nicht im Riegel)**: `bund/VRV/annex_II` trägt `artikelLabel` «+Anhang II» — GP #1180 bestätigt: Artefakt der deutschen Fedlex-Fassung (VRV Filestore 20260701 html-8; FR «Annexe II», IT «Allegato II»); Extraktor soll auf «Anhang II» normalisieren, Snapshot per Generator korrigieren, danach `LABEL_AUSNAHMEN` in `scripts/normtext/drift-logik.ts` leeren (der Riegel meldet die überholte Ausnahme selbst).
4. **B4-Basis ungebunden (GP #1180 F1, mittel, vorbestehend)**: B4 prüft nur Einheitlichkeit je Erlass, nicht gegen das gepinnte ELI/Sprache — alle 118 VRV-URLs auf AIG-ELI oder `/fr` statt `/de` bleiben grün. Soll: Basis == `…/eli/<pin>/de` aus `scripts/fedlex-cache.sh`.
5. **«Art. N und M» (GP #1180 F2, tief)**: amtlich 12 Paare «und» (OR 10, AIG 1, AHVG 1), Snapshot/Riegel «Art. N–M» — wortgetreue Neu-Extraktion würde rot; ORDINAL_SUFFIX endet bei «decies».
