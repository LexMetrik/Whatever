<!-- @posten
dach: QS-CODE-PROP
titel: Runde 2: Weichen-Umstell-Test + Tor + Permalink ohne verwaiste Werte
anlass: Recherche-Session 21./22.9.2026; Wurzel-Fix zu den 4 Geister-Orten
-->

Wurzel der Geister-Klasse: Feld-Sichtbarkeit lebt in der Seite, Feld-Verwendung in Schema/Mapping/Gate — die Verknüpfung ist nirgends deklariert, also prüfbar auch nicht.
  - **Metamorpher Weichen-Test** generisch über `src/lib/vorlagen/registry.ts`: Relation «füll(a) → setze w=b» ≡ «frisch(b)», **inkl. Gates** (`Mängel(dirty) ≡ Mängel(clean)`) — ohne die Gates fängt er die disabled-bei-checked-Klasse nicht. Rot-Beweis geschenkt: scheitert heute an P07b und M05b.
  - **Statisches Tor** «Baustein-/Gate-Bedingung ⊇ Weichen-Bedingung», Feld→Weiche je Schema deklariert; F2f beachten (Implikation auswerten, nicht Existenz).
  - **Rechner-Seite**: dieselbe Relation auf Form-Zustand→Engine-Input **und** auf den Permalink (verwaiste Parameter nicht schreiben, `src/lib/liveUrlSync.ts:33`).
  - **Rest-Nachmessung** der ungeprüften Rechner: `StrafZustaendigkeitTeil.tsx`, `SchkgZustaendigkeitTeil.tsx`, `ZustErgebnis*`, `EreignisFristen.tsx`, `KombinierteAnsicht.tsx`, `RechnerTagerechner.tsx`, Inkasso-Strecke, Verjährungs-Board; dazu Beurkundung/Grundbucheintrag (`geschaeftswertCHF` bei `!wertNoetig`, nicht verifiziert).
Reihenfolge: nach den Sofort-Guards; die Lösungsrichtung (Maskierung vor `assemble()` vs. Mapping-Disziplin) entscheidet der Test-Befund. Detail: `bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md` Ziff. 5–7.
