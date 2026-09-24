# Gesetzliche Feiertage je Kanton (BJ-Verzeichnis) – Regelwerk für die Fristen-Engines

**Speist:** `src/data/zpoFeiertage.ts` (`istFeiertag`/`istArbeitsfreierTag`/`naechsterWerktag`)
– massgebend für die Endverschiebung Art. 142 Abs. 3 ZPO, Art. 31 SchKG und die
3-Werktage-Zählung Art. 63 SchKG (`nthWerktagNach`). *Seit dem RL-22-Nachzug
(25.9.2026) mit Feiertags-Kontext* (`zpo`/`stpo`/`bgg`/`vwvg`/`schkg`/`allgemein`):
bedingte kantonale Feiertage zählen nur im belegten Verfahren, s. Abschnitt
«Geltungsbereich bedingter kantonaler Feiertage» unten.

**Quelle (Grundgerüst):** BJ/EJPD, «Gesetzliche Feiertage und Tage, die in der Schweiz wie
gesetzliche Feiertage behandelt werden», Verzeichnis nach Art. 11 des Europäischen
Übereinkommens vom 16.5.1972 über die Berechnung von Fristen (SR 0.221.122.3),
**Stand 1.1.2011** – alle 26 Sektionen am 6.6.2026 zeilenweise extrahiert und gegen
die Code-Matrix abgeglichen (Doppelcheck-Auftrag David).
URL (bis 2026): https://www.bj.admin.ch/dam/bj/de/data/publiservice/service/zivilprozessrecht/kant-feiertage.pdf.download.pdf/kant-feiertage-dfi.pdf
— am 23.9.2026 HTTP 502 (F1-08); gleiche Liste, inhaltlich weiterhin «Stand: 1. Januar
2011», abrufbar unter https://www.rhf.admin.ch/dam/de/sd-web/S6PzMB44EXP9/kant-feiertage.pdf
(V8, HTTP 200 am 23.9.2026).

**Quelle (massgebend, seit RL-22 24.9.2026):** das geltende kantonale Recht — Art. 142
Abs. 3 ZPO verlangt «vom kantonalen Recht anerkannte» Feiertage. Wo ein Kanton für
Fristen eine eigene Norm führt, geht sie der BJ-Liste vor (R1-05/F1-08, Prüfung
Rechtslogik 23.9.2026). Stand je Kanton: Abschnitt «Kantonale Spezialnormen» unten.

**Status: zweifach geprüft** (unabhängiger Recherche-Agent + eigener
Vollabgleich am PDF-Text). Fachliche Abnahme durch David ausstehend.

## Grundsätze (deterministische Regeln)

1. **lit. a = lit. b:** «Wie gesetzliche Feiertage behandelte» Tage (lit. b der
   BJ-Liste) zählen für die Fristverschiebung gleich wie anerkannte (lit. a) –
   beide fallen unter das Übereinkommen. Der Code unterscheidet nicht.
2. **Bundesweit kraft Bundesrechts:** 1. August (Art. 110 Abs. 3 BV) – steht in
   keiner Kantonsliste, gilt überall. Neujahr/Auffahrt/Weihnachten listen alle
   Kantone selbst.
3. **Bedingte Feiertage** (BJ-Fussnoten, im Code als `giltImJahr`):
   – **NE:** 2.1. und 26.12. sind NUR Feiertage, wenn der 1.1. bzw. 25.12. ein
     **Sonntag** ist (Fn. 10).
   – **UR/AR/AI:** der 26.12. ENTFÄLLT, wenn der 25.12. auf **Montag oder
     Freitag** fällt (Fn. 1/7/9).
4. **Bewegliche Spezialtage:**
   – **GL Näfelser Fahrt:** 1. Donnerstag im April; fällt er in die Karwoche
     (= Gründonnerstag, Ostern −3), **+1 Woche** (amtlich gl.ch; 2026: 9.4.
     statt 2.4.).
   – **GE Jeûne genevois:** Donnerstag nach dem 1. Sonntag im September.
   – **VD Lundi du Jeûne fédéral:** Montag nach dem 3. Sonntag im September.

## Matrix (X = lit. a · b = lit. b · Fussnoten in Klammern)

| Tag | ZH | BE | LU | UR | SZ | OW | NW | GL | ZG | FR | SO | BS | BL | SH | AR | AI | SG | GR | AG | TG | TI | VD | VS | NE | GE | JU |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Berchtoldstag 2.1. | X | X | X | – | – | b | b | b | b | b | b | – | – | b | – | – | b | – | X | X | – | X | b | (10) | – | X |
| Dreikönige 6.1. | – | – | – | X | X | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X | – | – | – | – | – |
| 1. März | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X | – | – |
| Josephstag 19.3. | – | – | – | X | X | – | X | – | – | – | (G) | – | – | – | – | – | – | – | – | – | X | – | X | – | – | – |
| Karfreitag | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | b | X | X | – | X | – | X | X | X |
| Ostermontag | X | X | X | X | X | b | b | X | b | b | b(4) | X | X | X | X | X | X | X | X | X | X | X | b | – | X | X |
| Näfelser Fahrt | – | – | – | – | – | – | – | X | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| 1. Mai | X | – | – | – | – | – | – | – | – | – | (½) | X | X | X | – | – | – | – | X | X | X | – | – | X | – | X |
| Auffahrt | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X | X |
| Pfingstmontag | X | X | X | X | X | b | b | X | b | b | b(4) | X | X | X | X | X | X | X | X | X | X | X | b | – | X | **X** |
| Fronleichnam | – | – | X | X | X | X | X | – | X | X(2) | X(3) | – | – | – | – | X | – | – | X | – | X | – | X | (L) | – | X |
| 23. Juni | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X |
| Peter & Paul 29.6. | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X | – | – | – | – | – |
| M. Himmelfahrt 15.8. | – | – | X | X | X | X | X | – | X | X(2) | X(3) | – | – | – | – | X | – | – | X | – | X | – | X | – | – | X |
| Jeûne genevois | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X | – |
| Lundi du Jeûne | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X | – | – | – | – |
| Mauritiustag 22.9. | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X(8) | – | – | – | – | – | – | – | – | – | – |
| Bruder Klaus 25.9. | – | – | – | – | – | X | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| Allerheiligen 1.11. | – | – | X | X | X | X | X | **X** | X | X(2) | X(3) | – | – | – | – | X | X | – | X | – | X | – | X | – | – | X |
| M. Empfängnis 8.12. | – | – | X | X | X | X | X | – | X | **X(2)** | – | – | – | – | – | X | – | X(†) | X | – | X | – | X | – | – | – |
| Stephanstag 26.12. | X | X | X | (1) | X | b | b | **X** | b | b | b(4) | X | X | X | (7) | (9) | X | X | X | X | X | – | **b** | (10) | – | – |
| 31. Dezember | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | X | – |

(†) GR führt Mariä Empfängnis NICHT (BJ Ziff. 18) – Spalteneintrag «–» wäre
korrekt; im Code ist GR nicht enthalten. ✓ *(Tabellenzelle zur Sicherheit
doppelt geprüft: BJ GR = nur Neujahr/Ostermontag/Auffahrt/Pfingstmontag/
Weihnachten/Stephanstag + Karfreitag lit. b – keine katholischen Tage
kantonsweit.)*

Fussnoten der BJ-Liste:
(1)/(7)/(9) Stephanstag entfällt, wenn Weihnachten Mo/Fr ist · (2) ausser
21 Gemeinden des FR-Seebezirks · (3) ausser Bezirk Bucheggberg ·
(4) nur in einzelnen SO-Gemeinden anerkannt · (½) SO: 1. Mai erst ab 12.00 Uhr ·
(8) nur innerer Landesteil AI · (10) NE: nur wenn 1.1./25.12. Sonntage ·
(G) SO-Josephstag nur in 8 Gemeinden · (L) NE-Fronleichnam nur Le Landeron.

## Code-Abbildung und bewusste Annahmen (offengelegt, §8)

- **Kantonsweit geführt trotz Teilgebiets-Fussnote** (konservativ, zugunsten
  der Fristverschiebung): FR-Tage mit Fn. 2 (Seebezirk), SO-Tage mit Fn. 3/4
  (Bucheggberg/einzelne Gemeinden), AI-Mauritiustag (innerer Landesteil –
  der Gerichtsort Appenzell liegt darin). *Ergänzung RL-22 (24.9.2026):* für FR
  und SO ist das nicht mehr Annahme, sondern geltendes Recht — FR JG Art. 121
  Abs. 2 «im ganzen Kanton», SO EG ZPO § 22 Abs. 2 kantonsweit (R1-05).
  *Ergänzung RL-22c (25.9.2026):* für SO gilt das nur in den Kontexten `zpo`
  und `stpo` (EG ZPO § 22 Abs. 2, EG StPO § 10bis); ausserhalb davon trägt
  der Bucheggberg-Vorbehalt (Fn. 3 = Ruhetagsgesetz SO § 2 Abs. 1 lit. b)
  wieder — Tag zählt, aber mit Warnung (Abschnitt «Solothurn» unten).
- **Bewusst WEGGELASSEN:** SO-Josephstag und -Patrozinien (nur einzelne
  Gemeinden; § 22 Abs. 2 EG ZPO SO nennt sie nicht) · NE-Fronleichnam (nur
  Le Landeron). *Bis 24.9.2026 zusätzlich SO-1.-Mai* («halber Tag ab 12 Uhr»
  — Begründung aus dem Ruhetagsrecht; seit RL-22 geführt, s. unten, R1-02).
- **Korrigiert am 6.6.2026** (vorher falsch im Code): LU-Berchtoldstag,
  GL-Allerheiligen, GL- und VS-Stephanstag, JU-Pfingstmontag,
  FR-Mariä-Empfängnis, AI-Mauritiustag, NE/UR/AR/AI-Bedingungen,
  Näfelser-Fahrt-Karwoche-Regel.

## Kantonale Spezialnormen (RL-22, 24.9.2026)

Quelle der Belege: Prüfung Rechtslogik 23.9.2026 (Berichte R1, Zweitprüfung V8,
amtliche Sammlungen geöffnet am 23.9.2026) — Projektordner
`pruefung-rechtslogik-2026-09-23/berichte/`. Eigene Nachprüfung im RL-22-Bau:
siehe Spalte «RL-22».

| Kanton | Norm | Fassung | Wirkung im Code | RL-22 |
|---|---|---|---|---|
| SO | EG ZPO § 22 Abs. 2 (BGS 221.2) https://bgs.so.ch/app/de/texts_of_law/221.2 | 1.1.2025 | 1. Mai ganztags **neu geführt** (R1-02); Katalog kantonsweit; 8.12. nicht. *Nachzug 25.9.2026:* nur Kontext `zpo` (Wortlaut «Für die Fristbestimmung gemäss Artikel 142 ZPO»), sonst Warnung. *Ergänzung RL-22c 25.9.2026:* zusätzlich `stpo` (EG StPO SO § 10bis, BGS 321.3); 2.1./Ostermontag/Pfingstmontag/26.12. seither ebenfalls bedingt (Abschnitt «Solothurn») | Beleg R1+V8; **amtlich selbst geöffnet 25.9.2026** (API bgs.so.ch, Fassung in Kraft seit 1.1.2025; Wortlaut gleich in den Fassungen ab 1.3.2015) |
| UR | Ruhetagsgesetz Art. 9 lit. b (RB 70.1421) https://rechtsbuch.ur.ch/app/de/texts_of_law/70.1421 | 1.1.2003 | Stephanstag **unbedingt** (R1-03) | Beleg R1+V8; **amtlich selbst geöffnet 25.9.2026** (API rechtsbuch.ur.ch, «… Weihnachten und Sankt-Stefans-Tag» ohne Vorbehalt; Arbeitsverordnung RB 20.1111 Art. 6 und GOG RB 2.3221 ohne abweichende Regel) |
| AR | V ArG Art. 7 (822.11) https://ar.clex.ch/app/de/texts_of_law/822.11 | 1.1.2016 | Stephanstag entfällt bei Weihnachten Mo/Fr (unverändert) | Snapshot `public/normtext/kanton/AR-822.11.json` (abgerufen 23.6.2026) |
| FR | JG Art. 121 Abs. 2 (SGF 130.1) https://bdlf.fr.ch/app/de/texts_of_law/130.1 | 1.1.2024 | Seebezirk-Fn. 2 obsolet («im ganzen Kanton») | Beleg R1 |
| ZH | GOG § 122 (LS 211.1) | 1.1.2026 (Fassung 131) | deckungsgleich | Snapshot `ZH-211.1.json` (abgerufen 1.9.2026) |
| BS | RLG § 2 (SG 811.100) | 1.7.2020 | deckungsgleich | Snapshot `BS-811.100.json` (abgerufen 23.6.2026) |
| AG · OW · ZG · VS · NW · BE | EG ZPO § 21 (SAR 221.200) · GOG Art. 28 Abs. 2 (GDB 134.1) · GOG § 10 (BGS 161.1) · RPflG Art. 37 (SGS 173.1) · GerG Art. 69 (**NG 261.1**, nicht «262.1», R1-09) · FRG Art. 2 (BSG 555.1) | s. R1/V8 | deckungsgleich | Beleg R1/V8 |
| SG · SH · GL (2.1.) | sGS 143.11 Art. 59 Abs. 1 + KG SG FS.2012.1 · SHR 180.111 § 33 Abs. 1 + OGE 40/2018/1/K · GS II A/6/2 Art. 19 Abs. 2 lit. a (GL ohne Gerichtspraxis) | 1.1.2026 / 1.1.2026 / 1.7.2026 | 2.1. bleibt (R1-01 durch V8 widerlegt); *RL-23 (25.9.2026):* GL-2.1. als unsicher gezählter bedingter Tag mit Warnung, s. Abschnitt «Glarus 2. Januar» | Beleg V8; GL **amtlich selbst geöffnet 25.9.2026** (s. unten) |
| NE | LI-CPC Art. 10a (RSN 251.1) https://rsn.ne.ch/DATA/program/books/rsne/pdf/2511.pdf — Schliesstage der Kantonsverwaltung (mind. halbtags) = Feiertag für Art. 142 ZPO | Etat 1.7.2019 (in Kraft 1.4.2015) | **neu geführt** je Jahr mit amtlicher Liste (`NE_SCHLIESSTAGE`): 2026 = 2.1., Ostermontag, Fr n. Auffahrt, Pfingstmontag, Lundi du Jeûne, 24.12., 26.12., 31.12. (ne.ch «Jours fériés officiels»); andere Jahre nur RSN 941.02 Art. 3 (W-10 a). *Nachzug 25.9.2026:* stehende Regel RDF Art. 11 Abs. 1 für alle Jahre ab 1.4.2015 statt Jahrestabelle; zählt in `zpo`/`stpo`/`bgg`/`vwvg`, nicht in `schkg`/`allgemein` (Warnung) | Beleg V8; Eigenabruf 24.9.2026 durch Netzsperre verhindert; **amtlich selbst geöffnet 25.9.2026** (PDF Etat 1.7.2019, Randtitel «Jours fériés (art. 142 CPC)») |
| BL | GOG § 46 Abs. 2 (SGS 170) — Schliesstage | 1.1.2020 | **nicht geführt**, nur Hinweis (W-10; Geltung für ZPO offen) | Beleg V8 |
| VD | LVLP Art. 73 Abs. 2 (BLV 280.05) — nur SchKG | 1.1.2018 | **nicht geführt**, nur Hinweis (W-10) | Beleg V8 (via LexFind) |

## Geltungsbereich bedingter kantonaler Feiertage (RL-22-Nachzug, 25.9.2026)

Anlass: Der Erstbau (24.9.2026) zählte die NE-Schliesstage und den SO-1.-Mai in
**jeder** Frist-Engine. Beide Regeln sind verfahrensgebunden; wo sie nicht gelten,
rechnete LexMetrik ein zu spätes Fristende (gefährliche Richtung). Eigener Abruf
aller Belege am 25.9.2026 (Netz wieder verfügbar; curl ohne -4/-6 erfolgreich, nur bger.ch HTTP 503).

**Regel (deterministisch):** Ein bedingter Tag zählt nur im Feiertags-Kontext, für
den die Gleichstellung belegt ist. Sonst zählt er NICHT (früheres = sicheres
Fristende), und die Engine gibt einen Warnsatz mit beiden Daten aus. Wo der
SPÄTERE Tag sicher ist (SchKG-Wartefrist: frühestes Datum; Rückwärtsfrist mit
Vorverlegung), zählen alle bedingten Tage (Kontext `weitest`), ebenfalls mit Warnung.

| Bedingter Tag | Grundlage (Tag) | belegt für | Beleg | nicht belegt → Warnung |
|---|---|---|---|---|
| NE-Schliesstage: 31.12., 1./2.1., 1.3., Karfreitag, Ostermontag, 1.5., Auffahrt + Freitag danach, Pfingstmontag, 1.8., Lundi du Jeûne, 24./25./26.12. | RDF Art. 11 Abs. 1 (RSN 152.512, Etat 1.1.2023, Wortlaut seit 9.3.2005): «Le personnel a congé et les bureaux … sont fermés toute la journée» — https://rsn.ne.ch/DATA/program/books/rsne/pdf/152512.pdf | ZPO | LI-CPC Art. 10a (RSN 251.1), Randtitel «Jours fériés (art. 142 CPC)», in Kraft 1.4.2015 | SchKG (Art. 31 SchKG; LILP NE RSN 261.1 ohne Regel) |
| | | StPO | LI-CPP Art. 9a (RSN 322.0, Etat 13.3.2024), Randtitel «Jours fériés (art. 90 CPP)», in Kraft 1.4.2015 — https://rsn.ne.ch/DATA/program/books/rsne/pdf/3220.pdf | OR Art. 78 («staatlich anerkannter Feiertag») |
| | | BGG Art. 45 | BGer 9C_396/2018 vom 20.12.2018 E. 2.3 (Pfingstmontag NE «jour férié selon le droit cantonal», gestützt auf LPJA Art. 20 Abs. 2) — Text über entscheidsuche.ch (Spiegel von relevancy.bger.ch; bger.ch am 25.9.2026 HTTP 503) | |
| | | VwVG Art. 20 Abs. 3 | BVGer D-837/2025 vom 26.2.2025 (24./26.12.2024 NE; Verweis auf E-2540/2019) — https://bvger.weblaw.ch/pdf/D-837-2025_2025-02-26_de3689cc-4a91-4f64-9179-4f6ac251689b.pdf | |
| | | kant. Verwaltungsverfahren | LPA Art. 33 Abs. 3 (RSN 152.130, État 1.1.2026) — keine Engine | |
| SO 1. Mai (ganztags) | EG ZPO § 22 Abs. 2 (BGS 221.2): «Für die Fristbestimmung gemäss Artikel 142 ZPO …» | ZPO | Wortlaut selbst | BGG, VwVG, StPO, SchKG, OR — allgemein nur «1. Mai ab 12.00 Uhr» (Ruhetagsgesetz SO § 2 Abs. 1 lit. b, BGS 512.41, Stand 1.9.2014, https://bgs.so.ch/app/de/texts_of_law/512.41) — *Ergänzung RL-22c 25.9.2026: StPO seit 1.3.2015 belegt (EG StPO SO § 10bis), zählt jetzt in `stpo`* |
| SO 2. Januar, Ostermontag, Pfingstmontag, 26. Dezember (RL-22c) | EG ZPO § 22 Abs. 2, EG StPO § 10bis, VRG § 9 Abs. 1 (je ab 1.3.2015); Ruhetagsgesetz SO § 2 Abs. 1 nennt sie nicht | ZPO, StPO | Wortlaut selbst (s. Abschnitt «Solothurn») | BGG, VwVG, SchKG, OR 78 |
| SO Fronleichnam, Mariä Himmelfahrt, Allerheiligen (RL-22c) | Ruhetagsgesetz SO § 2 Abs. 1 lit. b «mit Ausnahme Bezirk Bucheggberg»; EG ZPO/EG StPO kantonsweit | alle Kontexte — **zählt**; ausserhalb ZPO/StPO **unsicher** (Bucheggberg) → Warnung mit strengem Ende | Wortlaut selbst | — |

Gegenprobe NE: ne.ch «Jours fériés officiels» (abgerufen 25.9.2026), Tabelle
«Jours fériés dans l'administration cantonale» 2026 und 2027 — deckungsgleich mit
RDF Art. 11 Abs. 1 (2027 zusätzlich: 2.1., 29.3., 7.5., 17.5., 20.9., 24.12., 26.12., 31.12.).

**§7-Abweichung zum Erstbau:** Der Erstbau hielt eine stehende NE-Regel für nicht
belegt und zitierte RDF als «jours désignés par le Conseil d'Etat»; RDF Art. 11
Abs. 1 enthält eine feste Liste. Daher jetzt Regel statt Jahrestabelle.

| GL 2. Januar (RL-23) | nur BJ-Liste Ziff. 8 lit. b (Art. 11 EuFrÜb) + PV GL Art. 19 Abs. 2 lit. a («arbeitsfreier Tag»); Ruhetagsgesetz GL Art. 2 Abs. 1 nennt ihn nicht | ZPO, SchKG, BGG, VwVG, OR 78 — **zählt, aber unsicher** (W-11 a) → Warnung mit strengem Ende | Art. 5 EuFrÜb (Zivil-, Handels-, Verwaltungsrecht, Art. 1 Abs. 1); kein Glarner Urteil | StPO (EuFrÜb gilt nicht; Art. 90 Abs. 2 StPO nur kantonales Recht) → nicht gezählt + Warnung |

**Engines (Stand 25.9.2026):** zpoFristen `zpo` · bggVwvgFristen `bgg`/`vwvg` ·
bgerRechtsweg `bgg` · schkgFristen `schkg` (Wartefrist-Folgetag `weitest`) ·
allgemeineFrist `allgemein` (Rückwärts-Vorverlegung `weitest`) · mietrecht,
verjaehrung `allgemein` · FristenKalender (Anzeige) Voreinstellung `allgemein`.

**Offen:** RDF Art. 11 Abs. 2 (Ersatzfreitage des Conseil d'État, wenn Tage auf
Sa/So fallen) — ob die Büros dann geschlossen sind, ist nicht belegt; nicht
abgebildet. SchKG-Geltung über Art. 31 SchKG (Wortlaut LI-CPC «dans le canton»
spricht eher dafür) — Entscheid/Rechtsprechung fehlt.

## Glarus 2. Januar (RL-23, 25.9.2026)

Befund Q5 (Prüfung Rechtslogik 23.9.2026), Entscheid **W-11 (a)** (David 24.9.2026
«nach Empfehlung»): zählen + Warnung. Eigener Abruf aller Belege am 25.9.2026:

- **Ruhetagsgesetz GL** (GS IX B/21/1, Version 1.7.2019) Art. 2 Abs. 1 lit. b:
  «die allgemeinen Feiertage: Neujahr, Fahrtsfest, Ostermontag, Auffahrt,
  Pfingstmontag, 1. August, Allerheiligen und Stephanstag»; lit. c hohe Feiertage —
  **kein 2. Januar**. API https://gesetze.gl.ch/api/de/texts_of_law/IX%20B%2F21%2F1
- **Personalverordnung GL** (GS II A/6/2, Fassung 1.7.2026) Art. 19 Abs. 2: «bezahlten
  arbeitsfreien Tage: a. Berchtoldstag; b. Heiligabend; c. Silvester» — ausdrücklich
  getrennt von den «Feiertagen» nach Abs. 1. API https://gesetze.gl.ch/api/de/texts_of_law/II%20A%2F6%2F2
- **BJ-Verzeichnis** (Stand 1.1.2011) Ziff. 8 lit. b «Tage, die wie gesetzliche
  Feiertage behandelt werden – Berchtoldstag, 2. Januar» (PDF oben, HTTP 200 am 25.9.2026).
- **EuFrÜb** SR 0.221.122.3 (Fedlex-Filestore eli/cc/1983/500_500_500, Stand 1.1.2011):
  Art. 1 Abs. 1 — anwendbar «auf dem Gebiet des Zivil-, Handels- und Verwaltungsrechts
  einschliesslich des diese Gebiete betreffenden Verfahrensrechts»; Art. 5 verlängert
  auch bei einem Tag, «der wie ein gesetzlicher Feiertag behandelt wird».

**Regel (deterministisch):** GL-2.1. zählt in den Kontexten `zpo`, `schkg`, `bgg`,
`vwvg`, `allgemein` (und `weitest`); jede Frist-Engine vergleicht mit der strengen
Lesart ohne den Tag und warnt mit dem früheren Ende («sicherheitshalber bis …»).
Im Kontext `stpo` zählt der Tag NICHT (EuFrÜb nicht anwendbar, GL-Recht nennt ihn
nicht) — Warnung wie bei den übrigen bedingten Tagen. **SG/SH** unverändert ohne
Warnung (kantonaler Normwortlaut «Ruhetag»/«Feiertag» + Gerichtspraxis).

**Kommunale Ruhetage (Q8-04):** BGer 6B_730/2013 vom 10.12.2013 E. 1.2 prüft für
Art. 90 Abs. 2 StPO auch einen kommunalen Ruhetag am Wohnsitz (SO: Gemeinden können
zusätzliche Ruhetage bezeichnen, heute Ruhetagsgesetz SO § 2 Abs. 2, BGS 512.41).
Die Matrix führt nur kantonale Tage → Fristende allenfalls zu früh (sichere
Richtung); offengelegt im StPO-Hinweis des allgemeinen Rechners.

**Offen:** Glarner Gerichtspraxis (keine publizierte gefunden, Q5); ob der Kontext
`bgg` bei Beschwerden in Strafsachen wie `stpo` zu behandeln wäre (EuFrÜb gilt
dort nicht) — heute zählt `bgg` einheitlich, mit Warnung.

## Solothurn (RL-22c, 25.9.2026)

Befund (Nebenfund RL-23-Bau): SO zählte 2.1., Ostermontag, Pfingstmontag und
26.12. in jedem Kontext. Eigener Abruf aller Belege am 25.9.2026 über die API
`https://bgs.so.ch/api/de/texts_of_law/<BGS>` (in Kraft stehende Fassung) bzw.
`…/texts_of_law/<BGS>/versions/<id>` (Vorfassungen):

- **Ruhetagsgesetz SO** (BGS 512.41, Version 4319, in Kraft seit 1.9.2014) § 2
  Abs. 1: lit. b «die Feiertage: Neujahr, Auffahrt, 1. Mai ab 12.00 Uhr,
  Eidgenössischer Bettag, sowie - mit Ausnahme Bezirk Bucheggberg - Fronleichnam,
  Maria Himmelfahrt, Allerheiligen»; lit. c «Karfreitag, Ostern, Pfingsten,
  Weihnachten». **Kein 2.1., Ostermontag, Pfingstmontag, 26.12.**
- **EG ZPO SO** (BGS 221.2) § 22 Abs. 2, **EG StPO SO** (BGS 321.3) § 10bis
  («gemäss Artikel 90 Absatz 2 StPO») und **VRG SO** (BGS 124.11) § 9 Abs. 1
  (kantonales Verwaltungsverfahren): wortgleicher Katalog «Neujahr, der 2. Januar,
  Karfreitag, der Ostermontag, Auffahrt, der Pfingstmontag, der 1. Mai,
  Fronleichnam, Mariä Himmelfahrt, Allerheiligen, der 25. und der 26. Dezember»,
  je **in Kraft seit 1.3.2015** (KRB 12.11.2014). Vorfassungen: EG StPO 4291
  und VRG 4089 ohne Katalog; EG ZPO 3367/3903 (1.1.2011–28.2.2015): nur
  «Pfingstmontag, 1. Mai, Fronleichnam, Mariä Himmelfahrt und Allerheiligen».
- **BGer 6B_730/2013** vom 10.12.2013 E. 1.2 (Pfingstmontag 20.5.2013, Berufung
  Art. 399 Abs. 3 StPO, Wohnsitz SO): EG StPO «enthält keine Fristbestimmungen»
  → Pfingstmontag nicht kantonal anerkannt (Beschwerde dennoch gutgeheissen
  wegen überspitzten Formalismus, E. 1.3). Text: entscheidsuche.ch
  (CH_BGer_006_6B-730-2013_2013-12-10; bger.ch am 25.9.2026 HTTP 503). Dort
  zitiert: 1P.184/2001 (Stephanstag SO nicht anerkannt).
- **SO-Praxis:** OG SO ZKBES.2023.63 und .64 (Pfingstmontag 29.5.2023 nach § 22
  Abs. 2 EG ZPO gezählt); VSG SO VSBES.2023.213 vom 22.10.2024 (Ostermontag in SO
  «kein gesetzlich anerkannter» Feiertag, Arbeitsrecht). Keine BGer-/BVGer-Praxis
  zu SO unter Art. 45 BGG / Art. 20 Abs. 3 VwVG gefunden (entscheidsuche.ch,
  Volltextsuche 25.9.2026).

**Regel (deterministisch):** 2.1./Ostermontag/Pfingstmontag/26.12. SO zählen ab
1.3.2015 in `zpo` und `stpo` (+ `weitest`), sonst nicht (Warnung mit beiden
Daten; Wartefrist/Rückwärtsfrist über `weitest` spätere bzw. frühere sichere
Seite). 1. Mai SO zusätzlich in `stpo`. Fronleichnam/Mariä Himmelfahrt/
Allerheiligen SO zählen überall; in `bgg`/`vwvg`/`schkg`/`allgemein` (und `stpo`
vor 1.3.2015) als unsicherer Tag mit Warnung (Bucheggberg).

**Offen:** (a) BGG/VwVG — trägt der VRG-SO-Katalog als «vom kantonalen Recht
anerkannter Feiertag» (Analogie NE: BGer 9C_396/2018 E. 2.3 stützte sich auf das
kantonale Verwaltungsverfahrensgesetz)? Dann würden die vier Tage auch dort
zählen. (b) SchKG — erfasst «Fristbestimmung gemäss Artikel 142 ZPO» über
Art. 31 SchKG auch Betreibungsfristen? Kein SO-EG-SchKG-Katalog gefunden.
(c) ZPO 1.1.2011–28.2.2015: Pfingstmontag und 1. Mai waren gleichgestellt, der
Code zählt sie erst ab 1.3.2015 (zu früh = sichere Richtung).

## Pflegebedarf / Verifikations-TODO

- Die BJ-Liste trägt **Stand 1.1.2011**; rechtlich massgebend ist das aktuelle
  kantonale Feiertagsrecht. TODO (offen): Stichproben gegen die geltenden
  kantonalen Ruhetags-/Feiertagserlasse ziehen (Daueranweisung: amtliche
  Erlasssammlungs-APIs, `abrogated` prüfen). Bekannte Spannung: AG regelt
  konfessionelle Tage heute bezirks-/gemeindeweise; die BJ-Liste führt sie
  kantonsweit – Code folgt der BJ-Liste (für Art. 142 Abs. 3 massgebender
  Katalog), Abweichung offengelegt.
- Kein datierter Parameter (keine Verfallsregister-Pflicht), aber bei jeder
  neuen BJ-Publikation: Matrix neu abgleichen.
- *Überholt am 25.9.2026 (RL-22-Nachzug, stehende Regel RDF Art. 11 Abs. 1 —
  s. Abschnitt «Geltungsbereich»); Pflege jetzt: bei jeder RDF-Revision und
  jährlich Stichprobe gegen die ne.ch-Tabelle.* Ursprünglicher Eintrag 24.9.2026:
- **NE-Schliesstage (RL-22):** jährlich. Die Tage legt der Conseil d'État fest
  (RDF RSN 152.512, «jours désignés par le Conseil d'Etat» — Wortlaut noch
  amtlich zu öffnen). Eine stehende Regel ist nicht belegt; darum führt der Code
  nur Jahre mit amtlich publizierter Liste. Für 2027 ff. die Liste auf
  https://www.ne.ch/themes/economie-et-emploi/jours-feries-officiels abrufen
  und `NE_SCHLIESSTAGE` + Gegenprobe-Ausnahme (`feiertage-gegenprobe.test.ts`)
  ergänzen — sonst zeigt LexMetrik in NE ein zu frühes Fristende (sichere
  Richtung).

## Quellen

- BJ-Verzeichnis (PDF, Stand 1.1.2011): s. oben – Volltext-Extrakt am 6.6.2026.
- Näfelser Fahrt amtlich: https://www.gl.ch/public-newsroom.html/31/newsroomnews/14237/title/n%C3%A4felser-fahrt (2026: 9. April) ·
  Regel: https://www.ferienwiki.ch/feiertage/naefelser-fahrt
- SECO-Anhang «Feiertage Schweiz» (Art. 20a ArG) als Plausibilitäts-Querquelle.
