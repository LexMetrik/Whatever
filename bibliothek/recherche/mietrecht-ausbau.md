# Recherche-Dossier «Mietrecht-Ausbau»

**Cluster:** Mietzinsanpassung (Herzstück) + Anfechtung & Erstreckung Fristen
**Datum:** 6. Juni 2026
**Verfasser:** Recherche-Agent (für David, fachkundige Person)
**Status:** Recherche/Konzept — keine Engine geschrieben (Auftrag: nur dieses Dossier)

## Quellenlage

- **OR** SR 220, Cache `/tmp/or.html` (Konsolidierung 20260101). Alle Anker
  empirisch geprüft und FOUND: `art_269`, `art_269_a`, `art_269_b`,
  `art_269_c`, `art_269_d`, `art_270`, `art_270_a`, `art_270_b`, `art_270_c`,
  `art_270_d`, `art_272`, `art_272_a`, `art_272_b`, `art_272_c`, `art_272_d`,
  `art_273`. Wortlaute byte-genau aus Cache extrahiert (siehe Zitate unten).
- **VMWG** SR 221.213.11, Cache `/tmp/vmwg.html` (Konsolidierung 20250101).
  Art. 11, 12, 12a, 13, 14, 16, 17, 19, 20 wörtlich extrahiert.
- **BWO** Referenzzinssatz: aktueller Stand und Historie via WebFetch
  bwo.admin.ch + hev-schweiz.ch (Juni 2026), Werte unten.
- **Bestehende Engines gelesen:** `src/lib/mietrecht.ts` (Kündigungs-Engine,
  inkl. Anfechtungs-/Erstreckungs-30-Tage-Frist im `abschluss()`),
  `src/lib/teuerung.ts` (LIK-Engine `berechneTeuerung`, Modus `indexmiete`
  bereits live), `src/data/likReihe.ts` (LIK bis 2026-05),
  `src/lib/vorlagen/mietvertrag.ts` (verwendet Referenzzins 1.25 % bereits als
  datierten Parameter), `src/data/mietTermine.ts` (Ortstermine je Kanton).

## Verifikations-TODOs (vor «geprüft»/`verified:true` durch David)

1. **VMWG Art. 13 vs. Praxis-Senkungssätze:** Die VO nennt für die
   **Erhöhung** 2 % / 2,5 % / 3 % je ¼-Punkt (siehe Wortlaut). Die im Auftrag
   genannten **2,91 % / 2,44 % / 1,96 %** sind NICHT der VO-Wortlaut, sondern
   die mathematisch exakten **Senkungssätze** (Umkehrung der Erhöhung, BGer-
   Praxis: eine Senkung soll die frühere Erhöhung exakt rückgängig machen —
   3 % Erhöhung auf 1000 → 1030; zurück auf 1000 erfordert nur −2,91 %). Diese
   Asymmetrie MUSS in der Engine korrekt abgebildet werden (Erhöhung ≠
   Senkung-Betrag). BGer-Aktenzeichen für die exakte Umkehrung noch zu
   verifizieren (häufig zitiert: BGE 4A_ … / Mietrechtspraxis — David vorlegen).
2. **BGE 4A_554/2019** (Nettorendite-Praxisänderung): 100 % statt 40 %
   Teuerung auf Eigenkapital; Zuschlag 2 % statt 0,5 % über Referenzzins bei
   Referenzzins ≤ 2 %. **Wichtige Abgrenzung:** Das betrifft die **absolute
   Methode (Nettorendite, Art. 269 OR)**, NICHT Art. 16 VMWG (40 % LIK in der
   relativen Methode). Aktenzeichen empirisch verifizieren.
3. **Kostensteigerungspauschale** 0,5–1 % p.a.: kantonale/Schlichtungspraxis,
   reines Ermessen — KEIN gesetzlicher Satz. → als Eingabefeld, nicht als
   Default rechnen (siehe §2-Beurteilung).
4. Referenzzins-Historie (Tabelle unten) gegen das BWO-PDF gegenprüfen, sobald
   sie ins Verfallsregister/eine Datenschicht übernommen wird.

---

## RECHNER 1 — Mietzinsanpassung (KOMPLETT)

### 1.1 Nutzerfrage

«Um wie viel darf/muss mein Nettomietzins angepasst werden, wenn sich der
Referenzzinssatz, die Teuerung und/oder die allgemeinen Kosten seit der letzten
Anpassung verändert haben?» — wahlweise aus **Vermietersicht** (Erhöhung,
Art. 269d OR) oder **Mietersicht** (Senkungsbegehren, Art. 270a OR,
spiegelbildlich).

### 1.2 Normbasis (Stand 2026)

- **Art. 269 OR** — Missbrauch: übersetzter Ertrag / übersetzter Kaufpreis
  (absolute Methode/Nettorendite).
- **Art. 269a lit. b OR** — nicht missbräuchlich, wenn durch
  **Kostensteigerungen oder Mehrleistungen** begründet. Wortlaut lit. b:
  «durch Kostensteigerungen oder Mehrleistungen des Vermieters begründet sind».
- **Art. 269a lit. e OR** — Ausgleich der **Teuerung auf dem risikotragenden
  Kapital**. Wortlaut: «lediglich die Teuerung auf dem risikotragenden Kapital
  ausgleichen».
- **Art. 12 VMWG** — Kostensteigerungen (Hypozins, Gebühren, Objektsteuern,
  Baurechtszinse, Versicherungsprämien, Unterhaltskosten).
- **Art. 12a VMWG** — **Referenzzinssatz**: vierteljährlich, volumengewichteter
  Durchschnittszinssatz inländischer Hypothekarforderungen, kaufmännische
  Rundung in Viertelprozenten; Bekanntgabe durch das WBF.
- **Art. 13 VMWG** — Hypothekarzins-Staffel (Wortlaut Cache):
  > Eine Hypothekarzinserhöhung von einem Viertel Prozent berechtigt in der
  > Regel zu einer Mietzinserhöhung von höchstens: a. 2 Prozent bei
  > Hypothekarzinssätzen von mehr als 6 Prozent; b. 2,5 Prozent bei
  > Hypothekarzinssätzen zwischen 5 und 6 Prozent; c. 3 Prozent bei
  > Hypothekarzinssätzen von weniger als 5 Prozent. Bei Hypothekarzinssenkungen
  > sind die Mietzinse entsprechend herabzusetzen …
  Abs. 4: frühere Hypozinsänderungen sind zu berücksichtigen (relative Methode).
- **Art. 14 VMWG** — Mehrleistungen (umfassende Überholungen i.d.R. 50–70 %
  wertvermehrend; energetische Verbesserungen).
- **Art. 16 VMWG** — **Teuerung: höchstens 40 %** der LIK-Zunahme auf das
  risikotragende Kapital, nur seit der letzten Mietzinsfestsetzung.
- **Art. 269d OR / Art. 19, 20 VMWG** — Mitteilung Erhöhung: amtliches Formular,
  Begründung, Einzelbeträge je Erhöhungsgrund (Art. 19 Abs. 1 lit. a Ziff. 4),
  mind. 10 Tage vor Beginn der Kündigungsfrist; Nichtigkeit bei Formfehler
  (Art. 269d Abs. 2). Begründungspflicht/Belegrecht (Art. 20 VMWG).
- **Art. 270a OR** — Senkungsbegehren des Mieters (schriftlich an Vermieter,
  30 Tage Stellungnahme, dann 30 Tage Schlichtungsbehörde).
- **BWO-Referenzzinssatz (Stand Juni 2026):** **1,25 %**, gültig seit
  **02.09.2025**, letzte Bekanntgabe **01.06.2026 (unverändert)**, nächste
  Termine 01.09.2026 / 01.12.2026.

### 1.3 Regelwerk-Skizze mit KONKRETEN FORMELN

**Kernformel (relative Methode, Kombination der Gründe):**

    Mietzins_neu = Mietzins_alt × (1 + Σ Anpassungssätze)

wobei Σ über die je einzeln ausgewiesenen Gründe läuft (Art. 19 Abs. 1
lit. a Ziff. 4 VMWG verlangt Einzelbeträge):

**(a) Referenzzins-Komponente** — pro ¼-Punkt-Schritt zwischen Alt- und
Neusatz, Satz abhängig vom NIVEAU:

| Hypothekar-/Referenzzins-Niveau | Erhöhung je ¼-Pkt (Art. 13 VMWG) | Senkung je ¼-Pkt (Praxis, exakte Umkehr) |
|---|---|---|
| < 5 % | +3,0 % | −2,91 % |
| 5–6 % | +2,5 % | −2,44 % |
| > 6 % | +2,0 % | −1,96 % |

Achtung: Bei mehreren Schritten ist die Staffel je Schritt anzuwenden; bei
gemischten Niveaus pro durchschrittenes Viertel den am jeweiligen Niveau
geltenden Satz. Senkungssatz = 1 − 1/(1+Erhöhungssatz): 1−1/1,03 = 2,913 %;
1−1/1,025 = 2,439 %; 1−1/1,02 = 1,961 %. **Anzeige: 2,91 % / 2,44 % / 1,96 %.**

**(b) Teuerungs-Komponente (Art. 16 VMWG):** 40 % der LIK-Zunahme seit der
letzten Festsetzung:

    Teuerungssatz = 0,40 × (LIK_neu − LIK_alt) / LIK_alt

→ **direkt aus `teuerung.ts` / `likReihe` wiederverwendbar** (Faktor 0,40 auf
die dort berechnete prozentuale Veränderung anwenden).

**(c) Allgemeine Kostensteigerung (Art. 269a lit. b / Art. 12 VMWG):**
Pauschale × Anzahl Jahre seit letzter Festsetzung. KEIN gesetzlicher Satz →
Eingabefeld (Praxis 0,5–1 %/Jahr, siehe §2).

    Kostensteigerungssatz = Pauschale_pro_Jahr × Jahre

**(d) Mehrleistungen (Art. 14 VMWG):** wertvermehrender Investitionsanteil →
Verzinsung + Amortisation + Unterhalt; eigener Berechnungspfad (optional, L).

**Beispielrechnung Referenzzins 1,75 % → 1,25 % (Senkung, 2 Schritte à ¼):**
Niveau < 5 % → Senkungssatz je Schritt −2,91 %.
- Schritt 1: Faktor 1/1,03; Schritt 2: Faktor 1/1,03 → Gesamtfaktor
  (1/1,03)² = 0,9426 → **−5,73 %** (NICHT −5,82 % = 2×2,91 %!).
- Mietzins alt CHF 1500 → 1500 × 0,9426 = **CHF 1414** (auf CHF gerundet) bzw.
  CHF 1413,75 (auf 5 Rp.).
- Alternative Lesart (additiv −2×2,91 % = −5,82 % → CHF 1412,70): zu klären,
  welche Konvention (multiplikativ je Schritt vs. additiv) der Praxis
  entspricht. **Empfehlung: multiplikativ je ¼-Punkt-Schritt** (entspricht der
  exakten Rückabwicklung mehrerer früherer Erhöhungen, Art. 13 Abs. 4 VMWG).
  → David vorlegen.

**Beispiel Erhöhung 1,25 % → 1,75 % (2 Schritte, Niveau < 5 %):**
- (1,03)² = 1,0609 → **+6,09 %**; CHF 1500 → CHF 1591,35 (5 Rp.) bzw. CHF 1591.

**Rundung:** Mietzins auf 5 Rappen oder ganze Franken (Praxis). `teuerung.ts`
hat `runden()` mit '0.01'/'0.05'/'1' — **direkt wiederverwendbar.**
Anpassungssätze auf 0,01 % (zwei Dezimalstellen) ausweisen.

### 1.4 §2-Beurteilung (Determinismus)

- **Referenzzins-Komponente:** vollständig regelbasiert, deterministisch
  (Niveau-Staffel + Schrittzahl). ✅ Engine-tauglich.
- **Teuerung (40 %):** deterministisch via LIK. ✅
- **Kostensteigerungspauschale 0,5–1 %:** **Ermessen/Tatfrage** der
  Schlichtungspraxis — NICHT deterministisch herleitbar. → **Eingabefeld**
  (Nutzer/Vermieter gibt die geltend gemachte Pauschale ein), Engine rechnet
  nur die Folge. Als Annahme deklarieren («Pauschale ist Ermessenssache der
  Schlichtungsbehörde, hier eingegeben: X %/Jahr; Praxis-Spanne 0,5–1 %»).
  Kein hartcodierter Default. Entspricht §2/§8 (Ehrlichkeit, keine Schätzung).
- **Nettorendite/absolute Methode (Art. 269, BGE 4A_554/2019):** komplex,
  zahlreiche Ermessensfaktoren (Eigenkapital, Anlagekosten). → **NICHT** im
  ersten Wurf; ggf. eigener Rechner (L). Im relativen Rechner nur als Warnung
  (Vorbehalt absolute Methode / Mietzinsreserve).

### 1.5 Datenbedarf + VERFALLSREGISTER

- **Referenzzinssatz-Historie ab 2008** (NEU als Datenschicht — analog
  `likReihe`, quartalsweise Verfallsregister-Eintrag). Distinkte Änderungs-
  Stichtage (gültig ab → Satz):

  | gültig ab | Satz | | gültig ab | Satz |
  |---|---|---|---|---|
  | 10.09.2008 | 3,50 % | | 02.06.2017 | 1,50 % |
  | 02.06.2009 | 3,25 % | | 02.03.2020 | 1,25 % |
  | 02.09.2009 | 3,00 % | | 02.06.2023 | 1,50 % |
  | 02.12.2010 | 2,75 % | | 02.12.2023 | 1,75 % |
  | 02.12.2011 | 2,50 % | | 04.03.2025 | 1,50 % |
  | 02.06.2012 | 2,25 % | | **02.09.2025** | **1,25 %** (aktuell) |
  | 03.09.2013 | 2,00 % | | 01.06.2026 | 1,25 % (Bekanntgabe, unverändert) |
  | 02.06.2015 | 1,75 % | | | |

  → **Verfallsregister:** quartalsweise prüfen (Bekanntgaben 1.3./1.6./1.9./
  1.12.); aktueller Wert 1,25 % seit 02.09.2025, nächster Check 01.09.2026.
- **LIK:** bereits vorhanden (`likReihe`, bis 2026-05). ✅
- Eingaben Nutzer: Alt-Referenzzins (oder Datum→Lookup), Neu-Referenzzins,
  LIK-Stand alt/neu (Datum), Kostensteigerungspauschale + Jahre, Mietzins alt,
  Partei (Erhöhung/Senkung).

### 1.6 Fallstricke

- **Relative vs. absolute Methode:** Die ¼-Punkt-Staffel ist die **relative
  Methode** (Veränderung der Berechnungsgrundlagen). Sie steht unter dem
  Vorbehalt der **absoluten Methode** (Nettorendite/Orts- und
  Quartierüblichkeit) und der **Mietzinsreserve/Vorbehalte** des Vermieters.
  → Warnung ausgeben (gerichte-zh.ch: Verhältnis der Kriterien).
- **Asymmetrie Erhöhung/Senkung** (siehe TODO 1): Erhöhungs- und
  Senkungssätze sind NICHT identisch. Engine muss beide Sätze führen.
- **Senkungsbegehren (Art. 270a OR):** spiegelbildlich; Mieter muss bei
  gesunkenem Referenzzins selbst aktiv werden (kein Automatismus). Verrechnung
  mit zwischenzeitlichen Kostensteigerungen zulässig (Art. 13 Abs. 1 Satz 2
  VMWG: «oder die Einsparungen mit … Kostensteigerungen zu verrechnen»).
- **Art. 13 Abs. 4 VMWG:** frühere Hypozinsänderungen, die bereits zu
  Anpassungen geführt haben, sind anzurechnen — kein Doppelzählen.
- **Formularpflicht/Frist:** Erhöhung nur auf nächsten Kündigungstermin,
  amtliches Formular, 10 Tage vor Fristbeginn (Art. 269d OR) — die
  Termin-/Fristlogik liegt bereits in `mietrecht.ts`/`mietTermine` und ist
  wiederverwendbar. Anfangsmietzins-Formularpflicht-Kantone (Art. 270 Abs. 2
  OR) sind in der App bereits hinterlegt (`mietvertrag.ts`).
- **BGE 4A_554/2019** betrifft NICHT diesen Rechner direkt (absolute Methode);
  nicht mit Art. 16 VMWG (40 %) vermischen.

### 1.7 Aufwand + Wiederverwendung

- **Referenzzins-Komponente (Staffel + Historie-Datenschicht):** **M**.
- **Teuerungs-Komponente:** **S** — `teuerung.ts`/`likReihe`/`runden()`
  direkt nutzen (Faktor 0,40).
- **Kostensteigerung (Eingabefeld):** **S**.
- **Mehrleistungen / Nettorendite:** **L** — separater Ausbau, nicht Phase 1.
- **Fristen/Termine der Erhöhungsmitteilung:** Wiederverwendung
  `mietrecht.ts` (Terminsuche; seit RL-04 24.9.2026 ohne Art.-78-Verschiebung
  des spätesten Zugangs, F4-01) + `mietTermine`.

---

## RECHNER 2 — Anfechtung & Erstreckung (Fristen)

### 2.1 Nutzerfrage

«Bis wann muss ich (Mieter) eine Kündigung/Mietzinserhöhung/den
Anfangsmietzins anfechten bzw. eine (Zweit-)Erstreckung verlangen — und wie
lange kann das Mietverhältnis erstreckt werden?»

### 2.2 Normbasis (OR, Cache-Wortlaute geprüft)

- **Art. 270 OR** — **Anfangsmietzins**: 30 Tage **nach Übernahme der Sache**
  (lit. a Notlage/Marktlage; lit. b erhebliche Erhöhung ggü. Vormiete).
- **Art. 270a OR** — Herabsetzung während der Mietdauer: schriftlich an
  Vermieter → 30 Tage Stellungnahme → 30 Tage Schlichtungsbehörde
  (Abs. 2; Abs. 3 Ausnahme bei gleichzeitiger Anfechtung einer Erhöhung).
- **Art. 270b OR** — **Mietzinserhöhung**: 30 Tage **nachdem sie mitgeteilt
  worden ist** (Abs. 1; Abs. 2 auch bei anderen einseitigen Änderungen).
- **Art. 273 Abs. 1 OR** — **Kündigungsanfechtung**: 30 Tage **nach Empfang
  der Kündigung** an die Schlichtungsbehörde.
- **Art. 273 Abs. 2 OR** — **Erstreckung**: lit. a unbefristet → 30 Tage nach
  Empfang der Kündigung; lit. b **befristet → spätestens 60 Tage vor Ablauf
  der Vertragsdauer**.
- **Art. 273 Abs. 3 OR** — **Zweiterstreckung**: spätestens **60 Tage vor
  Ablauf der ersten** Erstreckung.
- **Art. 272b OR** — **Höchstdauer**: Wohnräume **4 Jahre**, Geschäftsräume
  **6 Jahre**; eine oder zwei Erstreckungen innerhalb der Höchstdauer
  (Abs. 2: bei Parteivereinbarung keine Höchstdauer-Bindung).
- **Art. 272 Abs. 3 OR** — bei Zweiterstreckung prüft Behörde, ob Mieter alles
  Zumutbare unternommen hat.
- **Art. 272a OR** — **Ausschluss** der Erstreckung (Art. 257d Zahlungsverzug;
  257f Abs. 3/4; 266h Konkurs; Abbruch-/Umbau-Zeitmietvertrag lit. d).
- **Art. 272d OR** — Kündigung während der Erstreckung (≤ 1 Jahr: 1 Monat auf
  Monatsende; > 1 Jahr: 3 Monate auf gesetzlichen Termin).

### 2.3 Regelwerk-Skizze (Formeln/Fristen)

Alle Verwirkungsfristen sind reine Datums-Arithmetik:

- Anfechtung Kündigung: `Empfang + 30 Tage` (Art. 273 Abs. 1).
- Anfechtung Erhöhung: `Mitteilung + 30 Tage` (Art. 270b).
- Anfangsmietzins: `Übernahme + 30 Tage` (Art. 270).
- Herabsetzung: `Begehren_an_Vermieter` → +30 Tage Stellungnahme →
  +30 Tage Schlichtung (Art. 270a Abs. 2). Zweistufig abbilden.
- Erstreckung befristet: `Vertragsablauf − 60 Tage` (RÜCKWÄRTSFRIST!).
- Zweiterstreckung: `Ende_1.Erstreckung − 60 Tage` (RÜCKWÄRTSFRIST!).
- **Art. 78 OR** (Wochenend-/Feiertagsverschiebung): bei den 30-Tage-
  Anfechtungsfristen auf den nächsten Werktag (wie in `mietrecht.ts` für die
  Anfechtung bereits umgesetzt). Bei den **60-Tage-Rückwärtsfristen** ist die
  Behandlung von Art. 78 zu klären (Rückwärtsfrist → eher KEINE Verschiebung
  zugunsten Verlängerung; konservativ: früher einreichen). → David vorlegen.

### 2.4 Abgrenzung zur bestehenden `mietrecht.ts`

Die Kündigungs-Engine berechnet im `abschluss()` bereits **eine** 30-Tage-
Anfechtungs-/Erstreckungsfrist (`anfechtungBis`/`erstreckungBis`, mit Art. 78),
aber **nur** als Nebenprodukt der Vermieter-Kündigung und nur für Wohn-/
Geschäftsräume. **Es fehlt konkret:**
1. Anfangsmietzins-Frist (Art. 270 — ab Übernahme, nicht ab Kündigung).
2. Erhöhungs-Anfechtung (Art. 270b — ab Mitteilung).
3. Herabsetzungs-Verfahren (Art. 270a — zweistufig 30+30).
4. **Erstreckung bei befristeten** Verhältnissen (60 Tage vor Ablauf) und
   **Zweiterstreckung** (60 Tage vor Ablauf der ersten) — beides
   RÜCKWÄRTSFRISTEN, die `mietrecht.ts` gar nicht kennt.
5. Höchstdauer-Berechnung (Art. 272b: 4/6 Jahre ab Kündigungstermin) und
   Ausschlussgründe-Prüfung (Art. 272a).
6. Kündigung während Erstreckung (Art. 272d).

→ Empfehlung: **eigener Rechner** «Fristen Anfechtung & Erstreckung», der die
Datums-Bausteine aus `mietrecht.ts`/`fristenEngine`/`zpoFeiertage` nutzt, aber
die mietrechtliche Kündigungs-Engine nicht aufbläht (§4: keine Fusion). Die
bestehende `anfechtungBis`-Anzeige in `mietrecht.ts` bleibt unverändert.

### 2.5 §2-Beurteilung

Vollständig deterministisch (Datums-Arithmetik + feste Fristen). ✅
Ermessensfrei. Erstreckungs-**Dauer** (4/6 J. ist Höchstmass, konkrete
Gewährung ist Ermessen) NICHT berechnen — nur Höchstdauer und Fristen anzeigen,
Härteabwägung (Art. 272 Abs. 2) als nicht-deterministisch deklarieren.

### 2.6 Fallstricke

- Anfangsmietzins läuft ab **Übernahme**, nicht ab Vertragsschluss.
- 60-Tage-Fristen sind **Rückwärtsfristen** (vom Ablauf gerechnet) — anderes
  Muster als die 30-Tage-Vorwärtsfristen; Art.-78-Behandlung klären (2.3).
- Erstreckung ausgeschlossen bei Art. 257d/257f/266h (Art. 272a) — Konsistenz
  mit `mietrecht.ts` (`erstreckungAusgeschlossen`-Flag bereits vorhanden).
- Empfangstheorie für Kündigung/Mitteilung (absolute vs. relative) — in
  `mietrecht.ts` bereits sauber dokumentiert; übernehmen.

### 2.7 Aufwand + Wiederverwendung

**M.** Wiederverwendung: `mietrecht.ts`-Empfangstheorie-Texte,
`zpoFeiertage`/`naechsterWerktag` (Art. 78), `fristenEngine`/Tagerechner-
Bausteine für die Datums-Arithmetik (vorwärts UND rückwärts), `mietTermine`
für die Kündigung-während-Erstreckung-Termine (Art. 272d).

---

## Priorisierte Bau-Reihenfolge

1. **Referenzzins-Datenschicht** (Historie ab 2008 als Verfallsregister,
   analog `likReihe`) — Fundament, M.
2. **Rechner Mietzinsanpassung Phase 1** (Referenzzins-Staffel + 40 %-Teuerung
   aus `teuerung.ts` + Kostensteigerungs-Eingabefeld; Erhöhung UND
   Senkungsbegehren) — Herzstück, M/S.
3. **Rechner Anfechtung & Erstreckung Fristen** (eigener Rechner, M).
4. **Später (L):** Mehrleistungen (Art. 14), Nettorendite/absolute Methode
   (Art. 269, BGE 4A_554/2019) — eigener Rechner, viel Ermessen.

Klärungen für David vor Bau: (a) Senkungs-Sätze 2,91/2,44/1,96 + multiplikativ
je Schritt bestätigen; (b) Kostensteigerung als Eingabefeld; (c) Art.-78 bei
60-Tage-Rückwärtsfristen; (d) BGer-Aktenzeichen für exakte Senkungs-Umkehr und
BGE 4A_554/2019 verifizieren.
