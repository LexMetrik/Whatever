# Abnahme-Dossier: Werkvertrag — alle Bausteine Wort für Wort

**Zweck:** Wort-für-Wort-Abnahme durch David (fachkundige Person, CLAUDE.md §7).
Je Baustein eine Abhak-Zeile.

**Quelle:** `src/lib/vorlagen/werkvertrag.ts (WV_SCHEMA)`. **Generiert:**
`npx vite-node scripts/abnahme-dossiers.ts` — nach Engine-Änderungen NEU
laufen lassen; das Dossier ist eine Ableitung, keine zweite Pflege-Stelle (§5).

**Lesehilfe:** «Aufnahme: immer» = Baustein steht in jedem Dokument; sonst die
lesbare `includeIf`-Bedingung über die Antwort-Felder. «wiederholt über» =
ein Absatz je Listeneintrag ({{item.…}}-Platzhalter). {{platzhalter}} werden
beim Erzeugen interpoliert; Fragment-Felder (…Satz/…Zeile) verschwinden leer
ersatzlos.


---

## Werkvertrag

Schema `werkvertrag` · Version 1.0.0 (Wettbewerbsanalyse V3; Art. 363/366/367/368/370/371/372/373/377 OR verifiziert 20260101) · Format vertrag · Ausgabe fertig

> **Disclaimer (Fusszeile):** Erstellt mit LexMetrik. Keine Rechtsberatung. Der Werkvertrag ist formfrei gültig; die beidseitige Unterzeichnung dient dem Beweis. Die Rügefrist beim unbeweglichen Werk (60 Tage, Art. 367 Abs. 1bis OR) und das Rücktrittsrecht nach Art. 377 OR sind zwingend. Massgebend sind Gesetz (Art. 363 ff. OR) und der konkrete Einzelfall.


### 1. `WV01_parteien`

- [ ] **abgenommen** (David)
- **Norm:** Art. 363 OR
- **Aufnahme:** immer
- **Layout-Rolle:** parteien
- **Begründung (Protokoll):** Bezeichnung der Vertragsparteien – immer enthalten.

**Wortlaut:**

> zwischen
>
> {{bestellerBlock}}
> (Besteller)
>
> und
>
> {{unternehmerBlock}}
> (Unternehmer)

### 2. `WV02_werk` — «Werk»

- [ ] **abgenommen** (David)
- **Norm:** Art. 363 OR
- **Aufnahme:** immer
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Gegenstand des Werkvertrags (herzustellendes Werk + Art beweglich/unbeweglich) – immer enthalten.

**Wortlaut:**

> Der Unternehmer stellt für den Besteller das folgende Werk her: {{werkBeschrieb}} ({{werkArtWort}}).{{ablieferungSatz}}

### 3. `WV03_verguetung` — «Vergütung»

- [ ] **abgenommen** (David)
- **Norm:** Art. 372 Abs. 1 OR
- **Aufnahme:** immer
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Vergütungsregelung (Festpreis oder nach Aufwand) und Fälligkeit bei Ablieferung (Art. 372 Abs. 1 OR).

**Wortlaut:**

> {{verguetungText}} Die Vergütung ist bei der Ablieferung des Werkes zur Zahlung fällig (Art. 372 Abs. 1 OR).{{anzahlungSatz}}

### 4. `WV04_ausfuehrung` — «Ausführung und Termine»

- [ ] **abgenommen** (David)
- **Norm:** Art. 366 OR
- **Aufnahme:** detailgrad ∈ {"standard", "experte"}
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Ausführungspflicht und Verzugs-/Abhilferechte (Art. 366 OR) – ab Detailgrad «standard» (in «einfach» ausgeblendet).

**Wortlaut:**

> Der Unternehmer führt das Werk sorgfältig und vertragsgemäss aus. Beginnt er das Werk nicht rechtzeitig, verzögert er die Ausführung vertragswidrig oder ist eine mangelhafte Erstellung durch sein Verschulden bestimmt voraussehbar, so stehen dem Besteller die Rechte nach Art. 366 OR zu (Rücktritt bzw. Ersatzvornahme nach angemessener Nachfrist).

### 5. `WV05_abnahme` — «Abnahme und Mängelrüge»

- [ ] **abgenommen** (David)
- **Norm:** Art. 367 OR
- **Aufnahme:** immer
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Prüf- und Rügeobliegenheit (Art. 367/370 OR); Rügefrist- und Verdeckte-Mängel-Satz je Werkart (60 Tage zwingend beim unbeweglichen Werk und bei bauwerkskausalen Mängeln eines beweglichen Werks, Art. 367 Abs. 1bis / 370 Abs. 4 OR; sonst «sofort», Art. 370 Abs. 3 OR).

**Wortlaut:**

> Nach Ablieferung prüft der Besteller das Werk, sobald es nach dem üblichen Geschäftsgang tunlich ist, und zeigt dem Unternehmer Mängel an (Art. 367 Abs. 1 OR). {{ruegefristSatz}} {{verdecktSatz}}{{abnahmeProtokollSatz}}

### 6. `WV06_maengelrechte` — «Mängelrechte»

- [ ] **abgenommen** (David)
- **Norm:** Art. 368 OR
- **Aufnahme:** immer
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Mängelrechte nach Art. 368 OR – immer enthalten; beim unbeweglichen Werk mit Vorbehalt Art. 368 Abs. 3 OR (keine Annahmeverweigerung bei nicht ohne unverhältnismässige Nachteile entfernbaren Bauten) und Hinweis Art. 368 Abs. 2bis OR.

**Wortlaut:**

> Bei mangelhaftem Werk stehen dem Besteller die gesetzlichen Mängelrechte zu: Verweigerung der Annahme bei Unbrauchbarkeit, Minderung des Lohnes oder unentgeltliche Nachbesserung, soweit diese dem Unternehmer keine übermässigen Kosten verursacht, sowie Schadenersatz bei Verschulden (Art. 368 OR).{{bautenSatz}}

### 7. `WV07_verjaehrung` — «Verjährung der Mängelansprüche»

- [ ] **abgenommen** (David)
- **Norm:** Art. 371 OR
- **Aufnahme:** immer
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Verjährung der Mängelansprüche (Art. 371 OR) – Frist je Werkart.

**Wortlaut:**

> {{verjaehrungSatz}}

### 8. `WV08_ruecktritt` — «Rücktritt des Bestellers»

- [ ] **abgenommen** (David)
- **Norm:** Art. 377 OR
- **Aufnahme:** immer
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Zwingendes Rücktrittsrecht des Bestellers gegen volle Schadloshaltung (Art. 377 OR) – offengelegt (§8), nicht wegbedungen.

**Wortlaut:**

> Solange das Werk unvollendet ist, kann der Besteller jederzeit vom Vertrag zurücktreten; er schuldet dann die Vergütung der bereits geleisteten Arbeit und die volle Schadloshaltung des Unternehmers (Art. 377 OR).

### 9. `WV08b_verzug` — «Zahlungsverzug und Konventionalstrafe»

- [ ] **abgenommen** (David)
- **Norm:** Art. 104 Abs. 1 OR
- **Aufnahme:** detailgrad = "experte"
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Verzugszins (Art. 104 OR) und Konventionalstrafen-Rahmen (Art. 163 Abs. 3 OR) – Detailgrad «experte».

**Wortlaut:**

> Bei Verzug mit einer fälligen Vergütung schuldet der Besteller Verzugszins von 5 % (Art. 104 Abs. 1 OR). Für den Fall verspäteter Fertigstellung können die Parteien in der Beilage eine Konventionalstrafe vereinbaren; eine übermässige Strafe setzt der Richter herab (Art. 163 Abs. 3 OR).

### 10. `WV08c_gerichtsstand` — «Anwendbares Recht und Gerichtsstand»

- [ ] **abgenommen** (David)
- **Norm:** Art. 363 OR
- **Aufnahme:** detailgrad = "experte"
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Rechtswahl- und Gerichtsstandsklausel mit Vorbehalt zwingender Gerichtsstände – Detailgrad «experte».

**Wortlaut:**

> Dieser Vertrag untersteht schweizerischem Recht. Ausschliesslicher Gerichtsstand ist der Sitz des Bestellers, soweit nicht zwingende Gerichtsstände entgegenstehen.

### 11. `WV09_schluss` — «Schlussbestimmungen»

- [ ] **abgenommen** (David)
- **Norm:** Art. 363 OR
- **Aufnahme:** immer
- **Nummeriert** (fortlaufende Ziffer im Dokument)
- **Begründung (Protokoll):** Schriftformvorbehalt, Ausfertigung und Gesetzesverweis – immer enthalten.

**Wortlaut:**

> Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform. Dieser Vertrag wird in zwei Exemplaren ausgefertigt; jede Partei erhält ein unterzeichnetes Exemplar. Im Übrigen gelten die Bestimmungen des Obligationenrechts über den Werkvertrag (Art. 363 ff. OR).

### 12. `WV10_unterschriften`

- [ ] **abgenommen** (David)
- **Norm:** Art. 363 OR
- **Aufnahme:** immer
- **Layout-Rolle:** unterschrift
- **Begründung (Protokoll):** Ort, Datum und beidseitige Unterschriften – dienen dem Beweis (formfreier Vertrag).

**Wortlaut:**

> {{ort}}, {{datumFmt}}
>
>
> Der Besteller:
>
> ___________________________
> {{bestellerName}}
>
>
> Der Unternehmer:
>
> ___________________________
> {{unternehmerName}}

---

**Summe:** 12 Bausteine in 1 Schemas.
