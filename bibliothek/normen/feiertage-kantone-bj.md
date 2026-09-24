# Gesetzliche Feiertage je Kanton (BJ-Verzeichnis) – Regelwerk für die Fristen-Engines

**Speist:** `src/data/zpoFeiertage.ts` (`istFeiertag`/`istArbeitsfreierTag`/`naechsterWerktag`)
– massgebend für die Endverschiebung Art. 142 Abs. 3 ZPO, Art. 31 SchKG und die
3-Werktage-Zählung Art. 63 SchKG (`nthWerktagNach`).

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
| SO | EG ZPO § 22 Abs. 2 (BGS 221.2) https://bgs.so.ch/app/de/texts_of_law/221.2 | 1.1.2025 | 1. Mai ganztags **neu geführt** (R1-02); Katalog kantonsweit; 8.12. nicht | Beleg R1+V8 |
| UR | Ruhetagsgesetz Art. 9 lit. b (RB 70.1421) https://rechtsbuch.ur.ch/app/de/texts_of_law/70.1421 | 1.1.2003 | Stephanstag **unbedingt** (R1-03) | Beleg R1+V8 |
| AR | V ArG Art. 7 (822.11) https://ar.clex.ch/app/de/texts_of_law/822.11 | 1.1.2016 | Stephanstag entfällt bei Weihnachten Mo/Fr (unverändert) | Snapshot `public/normtext/kanton/AR-822.11.json` (abgerufen 23.6.2026) |
| FR | JG Art. 121 Abs. 2 (SGF 130.1) https://bdlf.fr.ch/app/de/texts_of_law/130.1 | 1.1.2024 | Seebezirk-Fn. 2 obsolet («im ganzen Kanton») | Beleg R1 |
| ZH | GOG § 122 (LS 211.1) | 1.1.2026 (Fassung 131) | deckungsgleich | Snapshot `ZH-211.1.json` (abgerufen 1.9.2026) |
| BS | RLG § 2 (SG 811.100) | 1.7.2020 | deckungsgleich | Snapshot `BS-811.100.json` (abgerufen 23.6.2026) |
| AG · OW · ZG · VS · NW · BE | EG ZPO § 21 (SAR 221.200) · GOG Art. 28 Abs. 2 (GDB 134.1) · GOG § 10 (BGS 161.1) · RPflG Art. 37 (SGS 173.1) · GerG Art. 69 (**NG 261.1**, nicht «262.1», R1-09) · FRG Art. 2 (BSG 555.1) | s. R1/V8 | deckungsgleich | Beleg R1/V8 |
| SG · SH · GL (2.1.) | sGS 143.11 Art. 59 Abs. 1 + KG SG FS.2012.1 · SHR 180.111 § 33 Abs. 1 + OGE 40/2018/1/K · GS II A/6/2 Art. 19 Abs. 2 lit. a (GL ohne Gerichtspraxis) | 1.1.2026 / 1.1.2026 / 1.7.2026 | 2.1. bleibt (R1-01 durch V8 widerlegt); GL-Hinweis folgt RL-23 (W-11) | Beleg V8 |
| NE | LI-CPC Art. 10a (RSN 251.1) https://rsn.ne.ch/DATA/program/books/rsne/pdf/2511.pdf — Schliesstage der Kantonsverwaltung (mind. halbtags) = Feiertag für Art. 142 ZPO | Etat 1.7.2019 (in Kraft 1.4.2015) | **neu geführt** je Jahr mit amtlicher Liste (`NE_SCHLIESSTAGE`): 2026 = 2.1., Ostermontag, Fr n. Auffahrt, Pfingstmontag, Lundi du Jeûne, 24.12., 26.12., 31.12. (ne.ch «Jours fériés officiels»); andere Jahre nur RSN 941.02 Art. 3 (W-10 a) | Beleg V8; Eigenabruf 24.9.2026 durch Netzsperre verhindert |
| BL | GOG § 46 Abs. 2 (SGS 170) — Schliesstage | 1.1.2020 | **nicht geführt**, nur Hinweis (W-10; Geltung für ZPO offen) | Beleg V8 |
| VD | LVLP Art. 73 Abs. 2 (BLV 280.05) — nur SchKG | 1.1.2018 | **nicht geführt**, nur Hinweis (W-10) | Beleg V8 (via LexFind) |

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
