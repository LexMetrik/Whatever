# Wachstums-Reglement — Checkliste für jeden neuen Einstieg

Stand: 10.6.2026 (FAHRPLAN-GRUNDLAGEN G4.3). Dieses Dokument hebt die
Leitprinzipien §0/§0a (ROADMAP, früher HANDLUNGSPLAN) und §10/§11 (CLAUDE.md) in eine
**stabile Checkliste**, die jeder künftige Rechner-/Vorlagen-Einstieg
besteht, BEVOR gebaut wird. Es ändert sich selten; tagesaktuelle Sperren
und Prioritäten leben in der ROADMAP und in der Praxis-Abdeckungskarte
(`KATALOG-ROADMAP.md`).

## Vorbedingung: Bau-Fenster offen?

Die §0a-Sperre («Perfektion vor Neubau», Daueranweisung David 7.6.2026)
gilt, bis David den Neubau öffnet. Solange sie gilt, ist diese Checkliste
nur für **Vorbereitung** (Dossiers, Klassifizierung) in Gebrauch — nicht
für Bau.

## Die Checkliste (alle 6 Fragen müssen bestehen)

1. **Praxis-Klassifizierung (G1):** Ist die Aufgabe in der
   Praxis-Abdeckungskarte erfasst und als ✅ «rein» klassifiziert
   (eigenes deterministisches Regime, von David entschieden)? ◐-Aufgaben
   werden nur als Hinweis/Checkliste gebaut (Präzedenz: beurkundungs-
   pflichtige Gründung, §8); ✗-Aufgaben gar nicht.
2. **Mehrwert-Test (§0):** Liefert der Einstieg echten Mehrwert über die
   generischen Werkzeuge? Fristen ohne eigenes Berechnungs-Regime (kein
   Stillstand, keine Sonderunterbrechung, keine abweichende Berechnungs-/
   Zustellregel, keine Spezial-Gates) → Preset im Tagerechner, kein
   eigener Einstieg. Regime-Freiheit **am Gesetz verifizieren** (§7),
   Streichungs-Begründung in `KATALOG-ROADMAP.md`.
3. **Determinismus (§2):** Ist der Umfang klar regelbasiert — gleiche
   Eingabe → gleiche Ausgabe, kein Ermessen, keine Schätzung? Ermessens-
   Anteile werden offengelegt und NIE gerechnet (Vorbild: Streitwert-
   Rechner, unbezifferte Begehren).
4. **Rahmen vorhanden (§10):** Nutzt der Einstieg die geteilten Bausteine
   (Engine-Muster, Wizard-Rahmen, `ui.tsx`, Export-/PDF-Renderer,
   Permalink-/ICS-/Begründungs-Bausteine)? Fehlt ein Rahmen → **erst den
   Rahmen** bauen (verhaltensneutral nach §6), dann das Feature.
   Rechner-UIs folgen zwingend dem Aufbau-Reglement
   `DESIGN-REGLEMENT.md` §R (§R-1–§R-12: Seiten-/Formular-/
   Ergebnisblock-Skelett, ErgebnisBlock-Rahmen, Export-Reihenfolge).
5. **Bibliothek zuerst (§11):** Liegt ein engine-orientiertes Dossier in
   `bibliothek/` (Quelle+Stand · Regel decision-tree-fähig · Geltungs-
   bereich/Ausnahmen · Pflegebedarf/Verfallsregister · Abnahme-Status),
   mit Eintrag in `INDEX.md` und Aufnahme in `engine-map.md`?
6. **Abnahme- und Export-Pfad geklärt (§7/§8):** Wie wird das Werkzeug
   «geprüft» (Abnahme-Protokoll `abnahme/<id>.md`, Gate scharf)? Welche
   Exporte sind formrechtlich zulässig (Eigenhändigkeit/Beurkundung →
   ggf. Checkliste statt Export)? Karte startet als `entwurf` mit
   ehrlichen Grenzen in der UI.

## Bau-Begleitpflichten (während der Umsetzung)

- **Norm-Anker empirisch** gegen Fedlex-Cache prüfen (§7); kantonale
  Erlasse NUR über amtliche Erlasssammlungs-APIs in neuster Konsolidierung.
- Datierte Parameter ins **Verfallsregister** (`parameter-verfall.md`).
- **Tests:** Akzeptanztests + Konventions-/Invarianten-Abdeckung; neue
  Engine-Hinweis-Maximalkombinationen in den Konventions-Test eintragen.
- **Golden:** neue Fälle in die Matrix (`scripts/golden-outputs.ts`),
  Basis deklariert regenerieren (`npm run golden`).
- Norm-Zitate-Prüfer (`scripts/norm-zitate-pruefen.ts`) um neue Engines
  erweitern; `logik-sweep.ts` bei Engine-Änderungen mitlaufen lassen.
- Felder, die in Satz-Schablonen landen, enden auf **Satz/Zeile**
  (Fragment-Falle); Geviertstriche/Apostroph-Konventionen beachten.
- Wizard-Hydration-Guards für Array-Felder (normalisieren-Callback) sind
  Pflicht-Konvention.

## Reihenfolge des Wachstums

Die Bau-Reihenfolge folgt der **G1-Rangliste** (Praxiswert: Häufigkeit ×
Risiko-bei-Fehlen × Determinismus-Klarheit), nicht der Baubequemlichkeit.
Es gilt «Bau-Rate ≤ Abnahme-Rate» (STRATEGIE-PLATTFORM): Neues kommt erst,
wenn der Abnahme-Rückstau es zulässt.
