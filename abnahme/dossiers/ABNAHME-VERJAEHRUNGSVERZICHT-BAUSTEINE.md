# Abnahme-Dossier: Verjährungsverzicht — alle Bausteine Wort für Wort

**Zweck:** Wort-für-Wort-Abnahme durch David (fachkundige Person, CLAUDE.md §7).
Je Baustein eine Abhak-Zeile.

**Quelle:** `src/lib/vorlagen/verjaehrungsverzicht.ts (VV_SCHEMA)`. **Generiert:**
`npx vite-node scripts/abnahme-dossiers.ts` — nach Engine-Änderungen NEU
laufen lassen; das Dossier ist eine Ableitung, keine zweite Pflege-Stelle (§5).

**Lesehilfe:** «Aufnahme: immer» = Baustein steht in jedem Dokument; sonst die
lesbare `includeIf`-Bedingung über die Antwort-Felder. «wiederholt über» =
ein Absatz je Listeneintrag ({{item.…}}-Platzhalter). {{platzhalter}} werden
beim Erzeugen interpoliert; Fragment-Felder (…Satz/…Zeile) verschwinden leer
ersatzlos.


---

## Verjährungsverzichtserklärung

Schema `verjaehrungsverzicht` · Version 1.1.0 (Wettbewerbsanalyse V2; Art. 141 OR verifiziert 20260101; VB-01 Laufbeginn ab Erklärung) · Format eingabe · Ausgabe fertig

> **Disclaimer (Fusszeile):** Erstellt mit LexMetrik. Keine Rechtsberatung. Der Verzicht gilt längstens zehn Jahre ab dem Datum der Erklärung (Art. 141 Abs. 1 OR); massgebend sind Gesetz und konkreter Sachverhalt.


### 1. `VV_absender`

- [ ] **abgenommen** (David)
- **Aufnahme:** immer
- **Layout-Rolle:** absender
- **Begründung (Protokoll):** Schuldnerin/Schuldner als erklärende Partei – nur sie kann verzichten (Art. 141 Abs. 1 OR).

**Wortlaut:**

> {{absenderBlock}}

### 2. `VV_adressat`

- [ ] **abgenommen** (David)
- **Aufnahme:** immer
- **Layout-Rolle:** adressat
- **Begründung (Protokoll):** Gläubigerin/Gläubiger als Empfänger der Erklärung.

**Wortlaut:**

> {{adressatBlock}}

### 3. `VV_datumzeile`

- [ ] **abgenommen** (David)
- **Aufnahme:** immer
- **Layout-Rolle:** datumzeile
- **Begründung (Protokoll):** Ort und Datum der Erklärung – immer enthalten.

**Wortlaut:**

> {{ort}}, {{datumFmt}}

### 4. `VV_betreff`

- [ ] **abgenommen** (David)
- **Aufnahme:** immer
- **Layout-Rolle:** betreff
- **Begründung (Protokoll):** Betreff mit bestimmter Bezeichnung der Forderung.

**Wortlaut:**

> Verzicht auf die Einrede der Verjährung – {{forderungBeschrieb}}

### 5. `VV_anrede`

- [ ] **abgenommen** (David)
- **Aufnahme:** immer
- **Layout-Rolle:** anrede
- **Begründung (Protokoll):** Anrede – immer enthalten.

**Wortlaut:**

> Sehr geehrte Damen und Herren

### 6. `VV_verzicht`

- [ ] **abgenommen** (David)
- **Norm:** Art. 141 Abs. 1 OR
- **Aufnahme:** immer
- **Begründung (Protokoll):** Kern der Erklärung: befristeter Einredeverzicht; die Erklärung legt den Beginn selbst auf ihr Datum fest (das Gesetz lässt ihn offen, BBl 2014 235, S. 262) und begrenzt sich auf zehn Jahre ab diesem Datum – das Dokument hält die Höchstdauer des Art. 141 Abs. 1 OR damit unter jeder Lesart ein.

**Wortlaut:**

> Hinsichtlich Ihrer Forderung ({{forderungBeschrieb}}{{betragSatz}}) verzichte ich hiermit mit Wirkung ab dem Datum dieser Erklärung bis zum {{verzichtBisFmt}} auf die Erhebung der Einrede der Verjährung, längstens jedoch für zehn Jahre ab dem Datum dieser Erklärung (Art. 141 Abs. 1 OR).

### 7. `VV_vorbehalt`

- [ ] **abgenommen** (David)
- **Aufnahme:** vorbehaltEingetreten = true
- **Begründung (Protokoll):** Praxis-Standard: bereits eingetretene Verjährung bleibt vorbehalten (ein nachträglicher Verzicht auf die bereits eingetretene Verjährung wäre eine weitergehende Erklärung).

**Wortlaut:**

> Dieser Verzicht gilt nur, soweit die Verjährung im Zeitpunkt des Zugangs dieser Erklärung nicht bereits eingetreten ist.

### 8. `VV_keine_anerkennung`

- [ ] **abgenommen** (David)
- **Norm:** Art. 135 Ziff. 1 OR
- **Aufnahme:** keineAnerkennung = true
- **Begründung (Protokoll):** Abgrenzung zur verjährungsunterbrechenden Anerkennung – der Verzicht auf die Einrede ist keine Anerkennung der Forderung; die Klarstellung verhindert die gegenteilige Deutung.

**Wortlaut:**

> Mit dieser Erklärung ist keine Anerkennung der Forderung im Sinne von Art. 135 Ziff. 1 OR und keine Anerkennung ihres Bestands oder ihrer Höhe verbunden.

### 9. `VV_schluss`

- [ ] **abgenommen** (David)
- **Aufnahme:** immer
- **Layout-Rolle:** schlussformel
- **Begründung (Protokoll):** Schlussformel – immer enthalten.

**Wortlaut:**

> Freundliche Grüsse

### 10. `VV_unterschrift`

- [ ] **abgenommen** (David)
- **Aufnahme:** immer
- **Layout-Rolle:** unterschrift
- **Begründung (Protokoll):** Unterschrift der Schuldnerseite – Schriftform ist Gültigkeitsvoraussetzung (Art. 141 Abs. 1bis OR).

**Wortlaut:**

> ___________________________
> {{absenderName}}

---

**Summe:** 10 Bausteine in 1 Schemas.
