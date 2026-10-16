# Notariatstarife — Beurkundung der AG-Gründung (Errichtungsakt)

**Erstellt:** 7.6.2026 · **Abrufdatum durchgehend 7.6.2026** · **Status: ERSTRECHERCHE**
(Perfektions-Programm Punkt 11). Kantone dieses Durchgangs: **ZH, BE, AG, LU,
SG, BS.** Alle Erlasse aus den **amtlichen kantonalen Erlasssammlungen** (OrdoLex/
LexWork bzw. zhlex) in der **neusten geltenden konsolidierten Fassung**; je Kanton
`abrogated` und `future_versions` über die OrdoLex-API geprüft. Tarifzahlen
**verbatim aus dem amtlichen PDF** (`…/api/de/versions/{id}/pdf_file_with_annexes`).

**Regelungsgegenstand:** die kantonale Notariats-/Beurkundungsgebühr für die
**öffentliche Beurkundung des Errichtungsakts einer AG** (Art. 629/631 OR). NICHT
erfasst: HReg-Gebühren des Bundes (GebV-HReg, separat im Code), Emissionsabgabe
(StG, separat), MWST-Aufschlag, freies Anwaltshonorar für Statutenentwurf
ausserhalb der Tarifleistung.

**Methodischer Kernbefund (§2/§8):** Der Regel-TYP ist **nicht in allen sechs
Kantonen deterministisch**. Vier Kantone (ZH, BE, LU, SG, BS) tarifieren die
Gründungsbeurkundung wert-/kapitalabhängig (deterministisch berechen- oder
mindestens als Min/Mittel/Max-Rahmen bezifferbar). **Aargau tarifiert die
Gesellschaftsgründung NICHT** — sie läuft über den Aufwandtarif (Std.-Ansatz),
und ist damit **nicht amtlich-deterministisch erhebbar** (ehrlich als Rahmen
nach Aufwand auszuweisen, NIE schätzen).

---

## 0. Übersichts-Matrix (Regel-Typ + Beispiel AK CHF 100'000)

| Kt | Erlass (Nr.) | Stand | abrog. | Regel-Typ Gründung | Gebühr AK 100'000 (netto, ohne MWST/Auslagen) |
|----|--------------|-------|--------|--------------------|-----------------------------------------------|
| **ZH** | NotGebV, LS 243 | **1.1.2024 (Nachtrag 123, PDF verifiziert 7.6.2026)** | nein | **Promille mit Rahmen**: 1‰ vom Kapital, Rahmen 500–12'000 / 500–8'000 / 500–4'000 nach Revisionspflicht | 1‰ × 100'000 = **100** → Rahmen-Minimum **CHF 500** |
| **BE** | GebVN, BSG 169.81 | 1.3.2022 | nein | **Staffel-Rahmentarif** (Anhang 4): Min/Mittel/Max je Kapitalstufe | **Min 1'000 / Mittel 1'300 / Max 1'600** (bar-only: Min −50 % → 500) |
| **LU** | BeurkGebV, SRL 258 | 1.1.2022 | nein | **Progressive Promille-Staffel** (§ 37): 3‰ bis 500k …, min 1'000 / max 11'750 | 3‰ × 100'000 = 300 → Minimum **CHF 1'000** |
| **SG** | GebT, sGS 821.5 | 1.1.2026 | nein | **Lineare Staffel** (Nr. 60.13): 385 für erste 100k + 80 je weitere 100k, max 15'000 | **CHF 385** (netto; + 8,1 % MWST) |
| **BS** | Notariatstarif, SG 292.400 | 1.7.2016 | nein | **Staffel mit %-Zuschlag** (Ziff. 33 a): <100k → 750–2'000; =100k → 2'000; + Marginal-% darüber, max 50'000 | **CHF 2'000** |
| **AG** | Dekret Notariatstarif, SAR 295.250 | 1.1.2025 | nein | **KEINE Tarifierung der Gründung → Aufwandtarif** § 1 (Std.-Ansatz ≤ 300) | **nicht amtlich-deterministisch** (Rahmen nach Aufwand) |

> Quellen-IDs (OrdoLex `current_version_id`): BE 2543 · LU 3870 · SG-GebT 3849 ·
> BS 3875 · AG 3687. ZH (zhlex, keine API): aktueller Nachtrag 123 seit 1.1.2024
> — Nachtrag-PDF-Verifikation offen (siehe §3, **kein Tarif-Beleg auf Nachtrag 123,
> nur auf 095/066**).

---

## 1. Quelle + Stand je Kanton

### ZH — Zürich (Amtsnotariat)
- **Erlass:** Notariatsgebührenverordnung (**NotGebV**), **LS 243**, vom 9. März 2009,
  erlassen vom Kantonsrat gestützt auf § 36 Abs. 1 Notariatsgesetz (9.6.1985).
- **Stand:** Erlass-Seite zhlex listet Nachtrag **123 (aktuell, seit 1.1.2024)**;
  Vorgänger 095 (bis 1.1.2024), 087, 080, 066. **abrogated: nein** (Erlass in Kraft).
- **URL:** Erlass-Seite `https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung/zhlex-ls/erlass-243-2009_03_09-2009_07_01-095.html`
  · Tarifzahlen verbatim aus PDF Nachtrag 095 (`lexfind.ch/tolv/129646`) und 066
  (`www2.zhlex.zh.ch/.../243_9.3.09_66.pdf`). **Vorbehalt:** Nachtrag-123-PDF
  (Stand 1.1.2024) konnte nicht direkt bezogen werden (zhlex-SPA/410); Ziff.-4.4.3.1-
  Wortlaut in 066↔095 identisch, für 123 NICHT verifiziert → §3.

### BE — Bern (freies Notariat)
- **Erlass:** Verordnung über die Notariatsgebühren (**GebVN**), **BSG 169.81**,
  vom 26.4.2006, Regierungsrat, gestützt auf Art. 52 Abs. 2/4 Notariatsgesetz.
- **Stand:** **01.03.2022** (Beschluss 2.2.2022). **abrogated: false ·
  abrogated_scheduled: false · future_versions: null** (OrdoLex-API geprüft).
- **URL:** `https://www.belex.sites.be.ch/app/de/texts_of_law/169.81` ·
  API `…/api/de/texts_of_law/169.81` (current_version_id **2543**) · PDF mit Anhängen
  `…/api/de/versions/2543/pdf_file_with_annexes`.

### LU — Luzern (freies Notariat)
- **Erlass:** Verordnung über die Beurkundungsgebühren (**BeurkGebV**), **SRL 258**,
  vom 24.11.1973, Kantonsgericht, gestützt auf §§ 52a/52b/53/63 BeurkundungsG.
- **Stand:** **01.01.2022** (Beschluss 23.11.2021). **abrogated: false ·
  future_versions: keine** (OrdoLex-API; version_status "current").
- **URL:** `https://srl.lu.ch/app/de/texts_of_law/258` · current_version_id **3870** ·
  PDF `…/api/de/versions/3870/pdf_file_with_annexes`.

### SG — St. Gallen (gemischt: Amtsnotariate + freie Urkundspersonen)
- **Erlass:** **Gebührentarif für die Kantons- und Gemeindeverwaltung (GebT)**,
  **sGS 821.5**, vom 2.5.2000. (Die Beurkundungstaxen stehen in Abschnitt III
  «Beurkundungen und Beglaubigungen»; sGS 914.5 ist die **Grundbuch**-GebV und
  hier NICHT einschlägig — Falle vermieden.)
- **Stand:** Konsolidierung **9.12.2025, in Kraft 1.1.2026**. **abrogated: false ·
  future_versions: keine** (OrdoLex-API). current_version_id **3849**.
- **URL:** `https://www.gesetzessammlung.sg.ch/app/de/texts_of_law/821.5` ·
  PDF `…/api/de/versions/3849/pdf_file_with_annexes`. Kassen-Übersicht
  Amtsnotariate (sg.ch) nennt brutto CHF 378.25–16'215 inkl. 8,1 % MWST — der
  **massgebliche NETTO-Tarif steht im GebT** (siehe §2).

### BS — Basel-Stadt (freies Notariat)
- **Erlass:** Verordnung über den **Notariatstarif**, **SG 292.400**, vom 19.6.2001,
  Regierungsrat, gestützt auf § 23 Notariatsgesetz (27.4.1911).
- **Stand:** **01.07.2016** (letzte Änderung 28.6.2016). **abrogated: false** ·
  Status «currently in force» (OrdoLex-API). current_version_id **3875**.
- **URL:** `https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/292.400` ·
  PDF `…/api/de/versions/3875/pdf_file_with_annexes`.

### AG — Aargau (freies Notariat) — ⚠ KEINE Gründungs-Tarifierung
- **Erlass:** **Dekret über den Notariatstarif**, **SAR 295.250**, vom 30.8.2011,
  Grosser Rat, gestützt auf § 70 Abs. 4 Beurkundungs- und Beglaubigungsgesetz (BeurG).
- **Stand:** **01.01.2025** (Konsolidierung; Änderung 2.7.2024 zu §§ 2/6).
  **abrogated: false · future_versions: null** (OrdoLex-API). current_version_id **3687**.
- **URL:** `https://gesetzessammlungen.ag.ch/app/de/texts_of_law/295.250` ·
  PDF `…/api/de/versions/3687/pdf_file_with_annexes`.
- **⚠ abrogated-Falle:** Der frühere wertabhängige **Notariatstarif (alt, VKD-Linie)**
  ist mit dem BeurG/Dekret per **1.1.2013** abgelöst. Das geltende Dekret kennt nur
  (1) Aufwandtarif § 1 (Std.-Ansatz **höchstens Fr. 300**), (2) Promilletarif § 2
  **ausschliesslich für Grundstücke/Baurechte** und § 3 Grundpfandrechte, (3) Fixtarif
  § 6 Beglaubigungen. **Gesellschaftsgründungen sind im Promilletarif NICHT
  enthalten** → sie werden nach **Aufwand** (§ 1) abgerechnet. Nicht in eine
  Beispielzahl überführbar.

---

## 2. Regel deterministisch (decision-tree-fähig; Staffeln verbatim)

### ZH — NotGebV Ziff. 4.4.3.1 (verbatim)
> «**Gründung oder Kapitalerhöhung einer AG oder GmbH** — vom Kapital oder vom
> Erhöhungsbetrag … **1‰** — für Publikumsgesellschaften gemäss Art. 727 Abs. 1
> Ziff. 1 OR im Rahmen von **500–12'000** — für grössere Unternehmen gemäss
> Art. 727 Abs. 1 Ziff. 2 und 3 OR im Rahmen von **500–8'000** — für die übrigen
> Gesellschaften im Rahmen von **500–4'000**.»
>
> **Nachverifikation 7.6.2026 am amtlichen PDF** (notes.zh.ch …
> `243_9.3.09_123.pdf`, 22 S., Stand 1.1.2024): Die früher hier zitierten
> Rahmen 15'000/10'000/5'000 stammten aus den ALTEN Nachträgen 066/095 und
> waren überholt — Engine + Tests nachgezogen. «123» ist die Nachtrags-Nr.
> der Konsolidierung, KEIN Paragraph; eine eigene «Nachtrag zur Urkunde»-
> Position existiert nicht (übrige gesellschaftsrechtliche Urkunden =
> Ziff. 4.4.3.2: 0,2–0,5‰, übrige Ges. 250–2'000; Auffang Ziff. 4.7).

```
ZH_gruendung(kapital, revisionspflicht):
  basis = kapital * 0.001                  # 1‰
  if revision == "ordentlich_727_1_z1":  rahmen = (500, 12000)   # Nachtrag 123
  elif revision == "727_1_z2_oder_z3":   rahmen = (500, 8000)
  else:                                  rahmen = (500, 4000)   # eingeschränkt/keine Revision
  return clamp(basis, rahmen.min, rahmen.max)
```
Beispiel AK 100'000, keine ordentl. Revision (Normalfall KMU-Gründung):
1‰ × 100'000 = 100 → unter Min → **CHF 500.** (Die Untergrenze 500 greift bei
jeder Gründung bis Kapital 500'000, da 1‰ erst ab 500'000 die 500 überschreitet.)
Reduktion: Finanzdirektion kann Höchstbeträge bei geringerer Bedeutung auf 40 %
herabsetzen (Ziff. 4.4.3.2 a.E. — bezieht sich auf «übrige» Urkunden; Gründung
selbst unverändert).

### BE — GebVN Art. 21 + Anhang 4 (Staffel-Rahmentarif, verbatim)
Art. 1a Abs. 1: Geschäfte mit Geschäftswert → **gestaffelter Rahmentarif**.
Art. 21 Abs. 1: «Die Gebühr für die Beurkundung der Gründung einer AG, GmbH oder
KmAG bemisst sich nach dem **Gesellschaftskapital sowie einem allfälligen Agio**
und richtet sich … nach dem Tarif im **Anhang 4**.»
Art. 21 Abs. 5: Min-Gebühr darf **um max. 50 %** unterschritten werden, wenn das
Kapital **ausschliesslich bar** liberiert wird.
Art. 21 Abs. 6: **Online-Gründung** über Portal → Gebühr nach Zeitaufwand,
**mindestens 150**.
Art. 2 Abs. 1: konkrete Höhe innerhalb des Rahmens nach Arbeitsaufwand, Bedeutung,
Verantwortung (→ Mittelwert ist Richtwert, Abweichung begründungspflichtig Art. 6a).

**Anhang 4 zu Art. 21 (Stand 1.7.2006) — Kapital in CHF → Min / Mittel / Max:**

| Kapital bis CHF | Minimum | Mittel | Maximum |
|---|---|---|---|
| 200'000 | 1'000 | 1'300 | 1'600 |
| 300'000 | 1'150 | 1'500 | 1'850 |
| 400'000 | 1'300 | 1'700 | 2'100 |
| 500'000 | 1'450 | 1'900 | 2'350 |
| 600'000 | 1'600 | 2'100 | 2'600 |
| 700'000 | 1'750 | 2'300 | 2'850 |
| 800'000 | 1'900 | 2'500 | 3'100 |
| 900'000 | 2'050 | 2'700 | 3'350 |
| 1'000'000 | 2'200 | 2'900 | 3'600 |
| 2'000'000 | 2'950 | 3'900 | 4'850 |
| 3'000'000 | 3'700 | 4'900 | 6'100 |
| 4'000'000 | 4'450 | 5'900 | 7'350 |
| 5'000'000 | 5'200 | 6'900 | 8'600 |
| 10'000'000 | 8'950 | 11'900 | 14'850 |
| 15'000'000 | 12'700 | 16'900 | 21'100 |
| 20'000'000 | 16'450 | 21'900 | 27'350 |

Beispiel AK 100'000 (in Stufe «bis 200'000»): **Min 1'000 / Mittel 1'300 / Max 1'600.**
Bei reiner Barliberierung: Min darf bis **500** unterschritten werden (Art. 21 V).

### LU — BeurkGebV § 37 (progressive Promille-Staffel, verbatim)
§ 37 Abs. 1: «Bei der Gründung einer AG (Art. 629 OR) oder einer KmAG beträgt die
Gebühr … **mindestens Fr. 1'000.–, höchstens Fr. 11'750.–**»:
> **3‰** vom Grundkapital **bis Fr. 500'000.–**
> plus **2,5‰** vom Mehrbetrag über 500'000 bis 1'000'000
> plus **2‰** vom Mehrbetrag über 1'000'000 bis 2'000'000
> plus **1,5‰** vom Mehrbetrag über 2'000'000 bis 5'000'000
> plus **0,5‰** vom Mehrbetrag über 5'000'000 bis 10'000'000
> von dem 10 Mio. übersteigenden Grundkapital wird keine Gebühr erhoben.

§ 42 Abs. 1: **GmbH-Gründung** (Art. 777 OR) berechnet sich nach denselben Ansätzen
von § 37 (gleiche Staffel, min 1'000 / max 11'750).

```
LU_gruendung(kapital):  # marginal/progressiv
  k = min(kapital, 10_000_000)
  g  = min(k, 500_000)            * 0.003
  g += clamp(k-500_000,0,500_000) * 0.0025
  g += clamp(k-1_000_000,0,1_000_000) * 0.002
  g += clamp(k-2_000_000,0,3_000_000) * 0.0015
  g += clamp(k-5_000_000,0,5_000_000) * 0.0005
  return clamp(g, 1000, 11750)
```
Beispiel AK 100'000: 100'000 × 3‰ = 300 → unter Min → **CHF 1'000.**
(Die 3‰ überschreiten die 1'000 erst ab Kapital ≈ 333'334.)

### SG — GebT sGS 821.5 Nr. 60.13 (lineare Staffel, verbatim)
> «AG und GmbH (Art. 620 ff. und 772 ff.): **Errichtung von Aktien-, Partizipations-
> oder Stammkapital:** für die **ersten Fr. 100'000.– … 385.–**; für je weitere volle
> **Fr. 100'000.– … 80.–**; **höchstens 15'000.–**.»
> Kapitalerhöhung/Fusion/Kapitalherabsetzung: **mindestens 385.–** (im Übrigen nach
> Erhöhungs-/Herabsetzungsbetrag bemessen, Nr. 60.13). Statutenänderung ohne
> Kapitalbezug 220–2'200. Zuschlag bei GV ausserhalb des Sitzes der Urkundsperson:
> nach Aufwand, je Stunde 150, höchstens 1'000.

```
SG_gruendung(kapital):
  stufen = ceil(kapital / 100_000)          # je volle/erste 100k
  g = 385 + max(0, stufen-1) * 80
  return min(g, 15000)                       # netto, ohne MWST
```
Beispiel AK 100'000: **CHF 385** (netto). Brutto inkl. 8,1 % MWST ≈ 416 (Kasse
sg.ch nennt 378.25–16'215 — abweichende/ältere Wertbasis; **massgeblich ist der
GebT-Wert 385 netto**, Stand 1.1.2026).

### BS — Notariatstarif SG 292.400 Ziff. 33 lit. a (Staffel + %-Zuschlag, verbatim)
> «**33. AG, KmAG und GmbH: a) Vollständige Gründung** (einschliesslich Entwerfen/
> Umarbeitung von Statuten, exkl. Nebenverträge): bei einem Kapital **unter
> CHF 100'000 … 750 bis 2'000**; bei einem Kapital **von CHF 100'000 … 2'000**;
> vom Mehrbetrag über 100'000 … **0,24 %**; über 200'000 … **0,22 %**; über 1 Mio.
> … **0,2 %**; über 3 Mio. … **0,15 %**; über 5 Mio. … **0,1 %**; und über 10 Mio.
> … **0,075 %, höchstens jedoch CHF 50'000.**»

```
BS_gruendung(kapital):
  if kapital < 100_000:  return ("Rahmen", 750, 2000)   # § 5: nach Aufwand/Interesse
  g  = 2000
  g += clamp(kapital-100_000,0,100_000)   * 0.0024
  g += clamp(kapital-200_000,0,800_000)   * 0.0022
  g += clamp(kapital-1_000_000,0,2_000_000)*0.0020
  g += clamp(kapital-3_000_000,0,2_000_000)*0.0015
  g += clamp(kapital-5_000_000,0,5_000_000)*0.0010
  g += max(0,kapital-10_000_000)          * 0.00075
  return min(g, 50000)
```
Beispiel AK 100'000 (genau): **CHF 2'000** (fester Sockel; %-Zuschlag = 0). Bei
Kapital **< 100'000** (heute nicht mehr Mindestkapital, aber denkbar bei GmbH ≥
20'000): **Rahmen 750–2'000** nach § 5 (Interesse/Aufwand) → für die GmbH-Gründung
mit Stammkapital 20'000 ist die Gebühr ein **Rahmen**, nicht punktgenau.

### AG — keine Tarifierung der Gründung (ehrlich: nicht amtlich-deterministisch)
Dekret SAR 295.250 enthält für Gesellschaftsgründungen **keinen Promille- oder
Staffeltarif**. § 1: «Der Stundenansatz der Urkundsperson beträgt **höchstens
Fr. 300.–**.» § 2 Promilletarif gilt nur für Grundstücke/Baurechte. Mangels
Vereinbarung setzt die Gebühr nach §§ 73/74 BeurG die zuständige Stelle nach
Bedeutung/Schwierigkeit fest. → **Keine deterministische Beispielzahl** möglich;
in der UI als «Gebühr nach Aufwand, Std.-Ansatz ≤ 300; amtlich nicht beziffert»
auszuweisen (§8).

---

## 3. Geltungsbereich / Ausnahmen / offene Verifikationen

- **Notariatssystem (Tarifträger):** ZH = staatliche Notariate (Gebühr fliesst an
  den Staat) · BE/LU/BS/AG = freiberufliche Notare, Tarif verbindlich (Mindest-/
  Höchstrahmen) · SG = gemischt (4 Amtsnotariate + freie Urkundspersonen;
  GebT-Taxen gelten für die Amtsnotariate). Quelle System: `behoerden/notariate-kantone.md`.
- **MWST:** In allen Kantonen kommt die MWST (8,1 %) **zur Tarifgebühr hinzu** (BE
  Art. 1 Abs. 3 ausdrücklich; SG-Kasse weist brutto aus). Tarifzahlen oben sind
  **netto**.
- **Auslagen** (Porti, Reise, Handelsamtsblatt, HReg-Gebühr, Emissionsabgabe) sind
  **nicht** in der Beurkundungsgebühr enthalten und separat zu tragen.
- **Bemessungsgrundlage = Kapital (+ Agio in BE).** Bei BE zählt ein Agio zur Basis
  (Art. 21 I); bei ZH/LU/SG/BS knüpft der Wortlaut an «Kapital» bzw. «Grundkapital»
  an (Agio dort nicht ausdrücklich → konservativ Kapital ohne Agio, Verifikation
  offen).
- **Online-/Portalgründung BE:** Sonderregel Art. 21 VI → Zeitaufwand, min 150.
- **Barliberierungs-Rabatt BE:** Art. 21 V (Min −50 %, nur bar).
- **AG (Aargau):** Gründung **nicht tarifiert** → Aufwand; das ist KEIN Datenfehler,
  sondern geltendes Recht seit 1.1.2013 (BeurG-Ablösung des alten VKD-Tarifs).
- **ZH-Nachtrag-123-Vorbehalt:** Tarifzahlen (1‰, 500–15'000/10'000/5'000) sind aus
  Nachtrag **066/095** belegt; die aktuelle Fassung Nachtrag **123 (seit 1.1.2024)**
  konnte aus der zhlex-SPA nicht direkt als PDF gezogen werden (410/SPA). **Vor
  Abnahme:** Ziff. 4.4.3.1 in der 123er-Fassung gegenprüfen (zhlex/notes.zh.ch-PDF).
- **SG-Wertdivergenz:** GebT-PDF (Stand 1.1.2026) = 385 netto erste 100k; sg.ch-Kasse
  nennt 378.25 brutto (ältere/andere Basis). Massgeblich GebT. Vor Verdrahtung
  Brutto/Netto-Logik klären.

---

## 4. Pflegebedarf (datierte Parameter → Verfallsregister-Kandidaten)

Eingetragen in `bibliothek/register/parameter-verfall.md` (eine Sammelzeile):
- **BE GebVN 169.81 @ 1.3.2022**, Anhang-4-Staffel (Stand 1.7.2006) — bei RR-Teuerungs-
  anpassung (Art. 3a III analog) neu ziehen.
- **LU BeurkGebV 258 @ 1.1.2022**, § 37-Promillestaffel + min/max.
- **SG GebT 821.5 @ 1.1.2026** (frisch konsolidiert!) — Nr. 60.13 (385/80/15'000);
  jährlich, da GebT laufend nachgetragen wird.
- **BS Notariatstarif 292.400 @ 1.7.2016**, Ziff. 33 (Sockel 2'000, Marginal-%, Cap 50'000).
- **AG Dekret 295.250 @ 1.1.2025** — Std.-Ansatz ≤ 300 (§ 11: RR kann frankenmässige
  Beträge inkl. Promillesätze um ~10 % an Teuerung anpassen → Anpassungsklausel
  beobachten).
- **ZH NotGebV 243** — **Nachtrag-123-Verifikation der Ziff. 4.4.3.1 ausstehend**
  (Tarif-Beleg bisher nur auf 066/095).

Alle Beträge **netto**; MWST-Satz 8,1 % als separater Parameter (bereits im Register
unter MWST-Normalsatz geführt).

---

## 5. Abnahme-Status

**ERSTRECHERCHE (7.6.2026).** Je Kanton aus der amtlichen Erlasssammlung in der
neusten Fassung bezogen; `abrogated`/`future_versions` API-geprüft (ZH ohne API:
Nachtrag-Liste der zhlex-Seite). Tarifzahlen verbatim aus den amtlichen PDF.
**Offen vor «geprüft»:** (1) ZH-Nachtrag-123-PDF-Beleg der Ziff. 4.4.3.1;
(2) SG Brutto/Netto-MWST-Logik; (3) Agio-Behandlung ZH/LU/SG/BS; (4) adversarialer
Zweitdurchgang der Staffeln; (5) fachliche Abnahme durch David (§7). Keine
Engine-/UI-Änderung in diesem Auftrag.


## Nachverifikation 7.6.2026 (AG-4, amtliche PDFs/IDs: SG 3849 · BS 3875 · LU 3870 · ZH Nachtrag 123)

- **SG «volle» Stufen = FLOOR** (deklarierte fachliche Änderung in der
  Engine): Nr. 60.13 «je weitere VOLLE Fr. 100'000»; derselbe GebT schreibt
  «ganze oder angebrochene» (Nr. 52.03), wo aufgerundet werden soll; keine
  allgemeine Anbruchsregel in sGS 821.5/821.1. Frühere ceil-Lesart
  überzeichnete jede nicht-glatte Summe (250'000: 545 statt 465).
  Amtliches Rechenbeispiel fehlt — Abnahme David.
- **Agio-Basis BELEGT:** ZH «vom Kapital» · LU «Grundkapital» (§ 37) ·
  SG «Stammkapital» (60.13) · BS «Kapital» (Ziff. 33) — Agio NIRGENDS
  Bemessungsbasis; einzig BE Art. 21 Abs. 1 GebVN ausdrücklich MIT Agio
  (Engine bildet das bereits ab). Status von «offen» auf «belegt
  (Erstrecherche)» gehoben.

## Nachtrag 15.10.2026 (RL-36, RV-27, B2-10) — alte Werte oben bleiben als Historie

**BE über CHF 20 Mio.:** GebVN BSG 169.81 (Version in Kraft seit 1.3.2022,
belex-API, abgerufen 15.10.2026), Art. 21 Abs. 1 verweist für die Gründung auf
Anhang 4; dessen letzte Zeile «20 000 000 | 16450 | 21900 | 27350» trägt die
Marke «Maximum» (PDF mit Anhängen gelesen; in allen gelesenen Zeilen ist
Mittel = arithmetisches Mittel von Minimum und Maximum). Über 20 Mio. gilt
die Höchststufe: Rahmen 16'450–27'350 (Mittel 21'900); die frühere Lesart
«offen» entfällt. Die Marke ist die Quelle der Lesart «Höchststufe gilt
weiter» (Auslegung, kein ausdrücklicher Wortlaut «darüber»).
**Kopie abgebaut:** `src/lib/notariatsgebuehrenGruendung.ts` hält keine
eigene Tarifkopie mehr, sondern ist Adapter auf
`SONDERTARIFE.ag_gruendung` (src/data/tarif/beurkundung.ts). VD/GE/TI/weitere
Kantone liefern damit Engine-Werte statt «ehrliche Lücke (null)»; AG/UR
bleiben «nicht beziffert». Eingabe-Guard: negatives/nicht endliches Kapital
wirft einen Fehler (kein Clamp auf den Mindestbetrag).
