# Fussnote am eigenen Randtitel und «Gilt seit» — amtliche Abgrenzung ZGB 299/300 ↔ VVG 47a / NHG 3 (3.10.2026)

**Erstellt:** 3.10.2026 — Anlass: Entscheid David 3.10.2026 «Randtitel zählt nicht» (ZGB 299/300) im Roadmap-Schritt W2·27-BUND-FERTIG; Abgrenzung zu VVG 47a (Fassung 2022) und NHG 3 (Fassung 2000) war amtlich zu klären.
**Quellen (alle Abruf 3.10.2026):**
- Fedlex-AKN-XML der gepinnten Konsolidierungen (lokaler Filestore-Cache der Pins: ZGB cc/24/233_245_233 Stand 20260701; VVG cc/24/719_735_717 Stand 20240101; NHG cc/1966/1637_1694_1679 Stand 20250801; Erzeugung wie `scripts/normtext/fedlex-xml-cache.ts`).
- Änderungserlasse der Amtlichen Sammlung (SPARQL `isExemplifiedBy`, `pdf-a`): AS 2017 3699 = <https://fedlex.data.admin.ch/eli/oc/2017/425> (ZGB Adoption); AS 1999 3071 = <https://fedlex.data.admin.ch/eli/oc/1999/472> (NHG, Koordination Entscheidverfahren); AS 2021 758 = <https://fedlex.data.admin.ch/eli/oc/2021/758> (VVG, AHV-Nummer).
- Gesetzestechnische Richtlinien des Bundes (GTR), Bundeskanzlei, Stand 5. Juni 2026: <https://www.bk.admin.ch/dam/de/sd-web/q96zQo4nmf7w/GTR_DE_20260605.pdf> — Rz. 79 (Sachüberschrift), Rz. 81 (Randtitel/Marginalie), Rz. 322 (Änderung von Sachüberschrift/Randtitel im Änderungserlass).
**Nachzug 3.10.2026 (Gegenprüfung GP #1298: H1 hoch, M2 mittel):** Regel um die Ausnahme «Ausdruck-Fussnote» erweitert (3 Artikel waren fälschlich betroffen), GTR-Zitat Rz. 81 berichtigt, Tabelle ZGB 299/300 berichtigt, Abschnitt «Bekannte Grenze: Generalanweisungen» neu. Zahlen unten: «Erstbau» bleibt als Beleg stehen, «Nachzug» ergänzt.
**Status:** Messung + Regel (Bau-Agent Sonnet) — Gegenprüfung durch die Orchestrator-Session ausstehend; fachliche Abnahme David: **entwurf** (Regel C und «Randtitel zählt nicht» sind Davids Entscheide; die technische Abgrenzung unten ist nicht abgenommen). Kein `verified`/«geprüft» gesetzt.

## Befund: in Fedlex stehen alle drei Fälle STRUKTURELL GLEICH

Im AKN-XML hängt die Fussnote in allen drei Fällen im `<heading>` einer Ebene `<level fedlex:role="marginal">`, die genau diesen einen Artikel umschliesst:

| Fall | Ebene im XML | Fussnote | Gliederungszeichen (`<num>`) |
|---|---|---|---|
| ZGB 299 / 300 | `lvl_A_sexies` / `lvl_A_septies` | «Fassung gemäss Ziff. I des BG vom 17. Juni 2016 (Adoption), in Kraft seit 1. Jan. 2018 (AS 2017 3699)» | **ja**: `<num>A<sup>sexies</sup>.</num>` |
| NHG 3 | `lvl_u1/chap_1/lvl_u2` | «Fassung gemäss Ziff. I 3 des BG vom 18. Juni 1999 …, in Kraft seit 1. Jan. 2000 (AS 1999 3071)» | nein (`lvl_u` = ohne Nummer) |
| VVG 47a | `chap_1/sec_8/lvl_u9` | «Ausdruck gemäss Anhang Ziff. 4 des BG vom 18. Dez. 2020 …, in Kraft seit 1. Jan. 2022 (AS 2021 758)» | nein (`lvl_u`) |

Der Fussnoten-Ort (Randtitel/Sachüberschrift im Artikelkopf gegen Artikelnummer) trennt die Fälle also **nicht**. Ein Unterschied liegt nur im Gliederungszeichen und im Inhalt des Änderungserlasses.

## Was die Änderungserlasse tatsächlich änderten (Primärquelle AS)

| Artikel | AS-Anweisung (Wortlaut) | Körper geändert? |
|---|---|---|
| ZGB 299, 300 | AS 2017 3699 Ziff. I: «Art. 299 Randtitel» · «Art. 300 Randtitel» (Randtitel-Text «Asexies. Stiefeltern» / «Asepties. Pflegeeltern» im Rand; Randtitel-Änderung = Gliederungsbuchstabe «Asexies.»/«Asepties.», nach Einfügung von Art. 298a–298e davor (Deutung, nicht amtlich ausgesprochen)) | **Durch AS 2017 3699: nein. Aber durch eine ANDERE Anweisung ja:** AS 1999 1118 S. 1143, «Ersatz von Ausdrücken» Abs. 3: «Gewalt» → «Sorge» in «Art. 25 Abs. 1, 271 Abs. 3, **299, 300 Abs. 1**, 305 Abs. 1, …», in Kraft 1.1.2000 (Abruf AS-PDF 3.10.2026). Am Artikel steht dazu KEIN Vermerk; die Fussnote «Fassung gemäss … 1976, in Kraft seit 1. Jan. 1978 (AS 1977 237)» bleibt die einzige Körper-Fussnote (siehe «Bekannte Grenze: Generalanweisungen») |
| ZGB 124 | AS 2023 92 Anhang Ziff. 1: «In den Artikeln 124 **Randtitel und Absatz 1** … wird «Rentenalter» durch «Referenzalter» ersetzt» (Ausdruck-Fussnote am Randtitel «III. Ausgleich bei Invalidenrenten …») | **ja** (Absatz 1) |
| OR 928c | AS 2021 758 Ziff. 3 Anhang: «In Artikel 928c **Randtitel sowie Absätze 1 und 2** …» (Ausdruck-Fussnote am Randtitel «D. AHV-Nummer und Personennummer») | **ja** (Absätze 1 und 2) |
| ZGB 4 | AS 1999 1118 S. 1143, Ersatz von Ausdrücken: Abs. 1 nennt «Art. 1 Abs. 2, **4**, …» («der Richter» → «das Gericht»), Abs. 2 «**Randtitel von Art. 4**» («richterlich» → «gerichtlich») (Ausdruck-Fussnote am Randtitel «III. Gerichtliches Ermessen») | **ja** (Körper nach Abs. 1) |
| NHG 3 | AS 1999 3071 Ziff. I 3 (S. 3073): «Art. 3 Randtitel und Abs. 4» | **ja** (Abs. 4 eingefügt, 2014 wieder aufgehoben) |
| VVG 47a | AS 2021 758 Anhang Ziff. 4, Ersatz von Ausdrücken: Ziff. 1 «In Artikel 47a Randtitel wird … ersetzt», Ziff. 2 «In Artikel 47a wird «Versichertennummer der AHV» durch «AHV-Nummer» ersetzt» | **ja** (Körper, ohne eigene Körper-Fussnote — die Ausdruck-Fussnote am Heading deckt beides) |

GTR Rz. 322: Wird bei der teilweisen Änderung eines Artikels die Sachüberschrift oder der Randtitel geändert, weist die Anweisung eigens darauf hin («Sachüberschrift» / «Randtitel»); der Körper steht in derselben Anweisung als «Abs. …». GTR Rz. 81 (Wortlaut sinngemäss): Randtitel (Marginalien) anstelle von Sachüberschriften werden nur bei bestehenden Kodifikationen (z. B. StGB, ZGB, OR) beibehalten; bei revidierten anderen Erlassen sind sie bei grösseren Teilrevisionen in Sachüberschriften umzuwandeln. Enthalten die Randtitel keine Gliederung mit Ziffern oder Buchstaben, genügt dafür eine Generalanweisung (Rz. 327); **enthalten sie eine Gliederung mit Ziffern oder Buchstaben, so muss die Gliederung des ganzen Erlasses überdacht werden.** Das sagt NICHT, ein Randtitel mit Gliederung sei keine Artikel-Sachüberschrift oder seine Änderung betreffe den Körper nicht — Rz. 81 trägt das Gliederungszeichen also nicht als amtliches Kriterium. Das Gliederungszeichen ist ein **Stellvertreter** (Abgrenzungshilfe, Entscheid David 3.10.2026 «Randtitel zählt nicht»), keine GTR-Regel (Berichtigung Gegenprüfung 3.10.2026, M2). Rz. 79: Sachüberschrift neben der Artikelnummer; Rz. 322: «Randtitel» bzw. «Sachüberschrift» wird in der Änderungsanweisung eigens genannt.

## Regel (deterministisch; umgesetzt in `src/lib/normtext/historie-parse.ts`)

1. Eine Fassungs-Fussnote (`Fassung gemäss` / `Eingefügt durch` / `Ausdruck gemäss`) an einem **eigenen Randtitel des Artikels MIT Gliederungszeichen** (`randtitelMitAufzaehler`: Buchstabe, Ziffer, römische Zahl, ggf. mit lat. Suffix, auch als Lauf «V.–VII.») ist ein Überschrift-Ereignis: sie speist nur die Chronik (`ueberschrift` = Randtitel-Label), nie «Gilt seit» (gleiche Mechanik wie Regel C).
2. **Ausnahme (Ausdruck-Fussnote, Nachzug 3.10.2026 H1):** ist eine Fussnote an diesem Randtitel eine «Ausdruck»-Fussnote («Ausdruck gemäss …», meist mit dem Zusatz «Diese Änd. wurde in den in der AS genannten Bestimmungen vorgenommen» bzw. «Diese Änd. ist im ganzen Erlass berücksichtigt»), ist sie kein reines Randtitel-Ereignis: der Ersatz von Ausdrücken (GTR Rz. 327–330) nennt den Randtitel nur als eine der betroffenen Stellen und ändert auch den Körper (ZGB 124, OR 928c, ZGB 4, Tabelle oben). Solche Fussnoten zählen weiter für «Gilt seit» (wie auf main). Erkennung `ausdruckFussnote`/`randtitelNurRandtitel` in `historie-parse.ts`; bei gemischten Fussnoten desselben Randtitels gewinnt die Ausnahme.
3. **Ausnahme (Körper mit angefasst):** nennt eine ANDERE Fussnote desselben Artikels ohne `sektion` (Artikelnummer, Absatz, Buchstabe) dieselbe AS-Fundstelle (`eli/oc`-Link oder «AS Jahr Seite» im Wortlaut), hat der Änderungserlass auch den Körper geändert («Randtitel und Abs. …») — das Datum bleibt eigen. Ohne gemeinsame Fundstelle (auch ohne Link) gilt: reine Randtitel-Änderung.
4. Die **Sachüberschrift ohne Gliederungszeichen** (VVG 47a «AHV-Nummer», NHG 3 «Pflichten von Bund und Kantonen») bleibt eigen — unverändert; ebenso ein amtlicher Gliederungsknoten (Titel/Abschnitt/Kapitel) mit genau einem Artikel (Vorgabe B4, #1286, unberührt).

Die Regel ist ein **Stellvertreter** für die amtliche Anweisung (die selbst nicht im Fedlex-Konsolidierungstext steht, sondern nur im AS-Erlass): sie trifft ZGB 299/300 und lässt VVG 47a/NHG 3, ist aber nicht für jeden Einzelfall amtlich gleichwertig (siehe Grenzen).

## Messung Nachzug (3.10.2026, GP H1) — Vollvergleich origin/main ↔ neuer Kopf

Skript `.gate/nachzug-vergleich.mjs` (Node, Shard-für-Shard über alle 212 Historie-Shards; Kommando `node .gate/nachzug-vergleich.mjs <main-Shards> public/normtext/historie --liste`, Basis = `git archive origin/main public/normtext/historie`): **84** Bund-Artikel ändern «Gilt seit» (Erstbau: 87), davon **56 → null** (Erstbau 58) und **28 → älter** (Erstbau 29), 0 → neuer; 16 weitere nur Chronik-Merkmal (unverändert). Die 3 zurückgenommenen Artikel sind genau die «Ausdruck»-Randtitel: **ZGB 124** (2024-01-01), **OR 928c** (2022-01-01), **ZGB 4** (2000-01-01) — Eintrag je byte-gleich wie auf main, ebenso VVG 47a (2022-01-01) und NHG 3 (2000-01-01). Messung H1: von den 87 des Erstbaus trugen 3 eine «Ausdruck»-Randtitel-Fussnote (`.gate/h1-messung.mjs`; übrige Randtitel-Fussnoten der 87: 84 «Fassung gemäss», 2 «Eingefügt durch», 1 «Nummerierung gemäss» (ENTG 20), 1 «Durch Ziff. I … wurden sämtliche Art. mit Randtiteln versehen» (SchKG 1)).

## Messung Erstbau (3.10.2026, Skript `vite-node` über alte/neue Historie-Sidecars, alle 212 Shards)

- 87 Bund-Artikel ändern «Gilt seit» (in 12 Erlassen: ENTG, IPRG, KOV, LFG, OR, PATG, SCHKG, STGB, VSTV, VWVG, VZG, ZGB), 16 weitere erhalten nur das Chronik-Merkmal `ueberschrift` bei unverändertem «Gilt seit»; **0 Änderungen ausserhalb dieser Klasse** (Vollvergleich Artikel für Artikel, Kopffelder und alle Nicht-Klassen-Felder identisch).
- ZGB 299/300: 2018-01-01 → 1978-01-01 (Fassung am Artikel selbst, AS 1977 237) — **Wert offen**, wartet auf Entscheid David zur Generalanweisung AS 1999 1118 (GP #1298 H2, siehe unten); VVG 47a 2022-01-01 und NHG 3 2000-01-01 unverändert. (Erstbau-Zahlen; die Zeilen oben unter «Nachzug» gelten.)
- AS-Gegenprobe aller 87 (Wortlaut «Art. N Randtitel» im AS-Erlass, pdf-a): 64 mit abrufbarem Erlass — **59 «nur Randtitel»**, 1 «Randtitel und Abs. 1» (ZGB 286, «Betrifft nur den italienischen Text» ⇒ deutscher Körper unverändert), 3 uneindeutige Treffer (ZGB 255 = «Art. 255 Randtitel» an zweiter Stelle; VWVG 44 und LFG 37u = Umnummerierung «Bisheriger Art. 36e»), 1 nicht auffindbar (Schlusstitel-Token `dispu1art55`); 23 ohne AS-Link bzw. ohne abrufbare PDF-Fassung (Erlasse vor 2000 u. a.) — dort bleibt die Regel Stellvertreter.
- Belege (Identitätstreffer «Art. N Randtitel» im AS): ENTG 53 (oc/2020/748), LFG 22 (oc/2011/165), OR 676 und OR 717 (oc/2020/746), OR 956 (oc/2015/609), PATG 36 (oc/2008/526), SCHKG 302/303 (oc/2013/757), STGB 355b (oc/2010/267), VWVG 75/77 (oc/2006/352), ZGB 177 und 310 (oc/2015/728, oc/2014/53), ZGB 975/977 (oc/2011/666), ZGB 299/300 (oc/2017/425).

## Geltung / Ausnahmen / Grenzen

- Gilt für Bund-Erlasse im Sidecar-Korpus (`public/normtext/struktur/bund/`); Kantone unberührt (eigene Historie-Linie).
- **Nicht gelöst (offen für David):** (a) amtliche Gliederungsknoten mit genau einem Artikel (B4: «eigen», z. B. AHVV 43 «F. Haftung der Erben», 220 Artikel im Korpus) — dieselbe Frage wie «Randtitel», aber vom Entscheid nicht erfasst; (b) bei «Randtitel und Abs. …»-Erlassen, deren Absatz später aufgehoben wurde, bleibt das Randtitel-Datum «Gilt seit» (NHG 3: Abs. 4 2014 aufgehoben, «Gilt seit» 2000) — Teilaufhebungen zählen im Modell nirgends in «Gilt seit».
- Die Aufzähler-Erkennung in `darstellung.ts` (ENUM) kennt «Asexies.»/«Asepties.» nicht (nur bis 4 Buchstaben): die Anzeige führt diese Randtitel als Blatt-Sachüberschrift. Nicht geändert (Anzeige, §3); die Regel hier nutzt ein eigenes Prädikat.

## Bekannte Grenze: Generalanweisungen (Nachzug 3.10.2026, GP #1298 H2)

Eine **Generalanweisung** «Ersatz von Ausdrücken» (GTR Rz. 327–330) im Änderungserlass ändert den Körper eines Artikels, **ohne dass am Artikel ein Vermerk steht** (Fedlex setzt nur teilweise eine «Ausdruck gemäss …»-Fussnote). Das Modell (Historie aus Fussnoten) sieht diese Änderung dann nicht; «Gilt seit» bleibt auf einem **falschen älteren Datum**. Beleg AS 1999 1118 S. 1143 (ZGB, in Kraft 1.1.2000): Abs. 3 «Gewalt» → «Sorge» in Art. 299 und 300 Abs. 1 (ohne Fussnote an Art. 299/300), Abs. 1 «der Richter» → «das Gericht» u. a. in Art. 28a Abs. 1 (ohne Fussnote an Art. 28a), Art. 313 Abs. 2 (Abs. 3 «Gewalt» → «Sorge»).

- Schon auf **main** sichtbar (Befund GP, Mess-Kommando offen): ZGB 307, 313, 320, 322, 324, 325 (Datum 1978-01-01, trotz Generalanweisung ab 2000; hier nur 313 in der Ersatzliste des AS-PDF geprüft, für die übrigen nicht gegen den AS-Wortlaut bestätigt).
- Durch den PR **zusätzlich** betroffen: ZGB 28a (2007-07-01 → 1985-07-01), ZGB 299 und 300 (2018-01-01 → 1978-01-01), ZGB 310 (2014-07-01 → 1978-01-01; in der Ersatzliste des AS-PDF nicht genannt, Ursache für 1978 dort ungeklärt). Kommando: `node .gate/generalanweisung.mjs` (Nachzug-Lauf 3.10.2026).
- **ZGB 299/300: Wert offen, wartet auf Entscheid David** zur Generalanweisung AS 1999 1118 (H2). Der Generator liefert derzeit 1978-01-01; das ist **nicht** als korrekt zugesichert (der Test sichert nur «nicht mehr 2018-01-01 (Randtitel zählt nicht)»).

## Pflegebedarf

- Neue lat. Suffixe in Gliederungszeichen (über «decies» hinaus) in `GLIEDERUNG_SUFFIX` nachtragen.
- Nach jedem Re-Pin/neuer Extraktion: `npm run gen:historie` (Sidecars sind Projektion der Struktur-Sidecars); der Test `src/tests/normtext-historie-ueberschrift-w227.test.ts` hält ZGB 299/300 (nur «nicht 2018»), ZGB 124 / OR 928c / ZGB 4 (Ausdruck-Ausnahme), VVG 47a, NHG 3 fest.
