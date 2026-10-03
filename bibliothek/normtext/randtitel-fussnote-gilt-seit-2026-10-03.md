# Fussnote am eigenen Randtitel und «Gilt seit» — amtliche Abgrenzung ZGB 299/300 ↔ VVG 47a / NHG 3 (3.10.2026)

**Erstellt:** 3.10.2026 — Anlass: Entscheid David 3.10.2026 «Randtitel zählt nicht» (ZGB 299/300) im Roadmap-Schritt W2·27-BUND-FERTIG; Abgrenzung zu VVG 47a (Fassung 2022) und NHG 3 (Fassung 2000) war amtlich zu klären.
**Quellen (alle Abruf 3.10.2026):**
- Fedlex-AKN-XML der gepinnten Konsolidierungen (lokaler Filestore-Cache der Pins: ZGB cc/24/233_245_233 Stand 20260701; VVG cc/24/719_735_717 Stand 20240101; NHG cc/1966/1637_1694_1679 Stand 20250801; Erzeugung wie `scripts/normtext/fedlex-xml-cache.ts`).
- Änderungserlasse der Amtlichen Sammlung (SPARQL `isExemplifiedBy`, `pdf-a`): AS 2017 3699 = <https://fedlex.data.admin.ch/eli/oc/2017/425> (ZGB Adoption); AS 1999 3071 = <https://fedlex.data.admin.ch/eli/oc/1999/472> (NHG, Koordination Entscheidverfahren); AS 2021 758 = <https://fedlex.data.admin.ch/eli/oc/2021/758> (VVG, AHV-Nummer).
- Gesetzestechnische Richtlinien des Bundes (GTR), Bundeskanzlei, Stand 5. Juni 2026: <https://www.bk.admin.ch/dam/de/sd-web/q96zQo4nmf7w/GTR_DE_20260605.pdf> — Rz. 79 (Sachüberschrift), Rz. 81 (Randtitel/Marginalie), Rz. 322 (Änderung von Sachüberschrift/Randtitel im Änderungserlass).
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
| ZGB 299, 300 | AS 2017 3699 Ziff. I: «Art. 299 Randtitel» · «Art. 300 Randtitel» (Randtitel-Text «Asexies. Stiefeltern» / «Asepties. Pflegeeltern» im Rand; Randtitel-Änderung = Gliederungsbuchstabe «Asexies.»/«Asepties.», nach Einfügung von Art. 298a–298e davor (Deutung, nicht amtlich ausgesprochen)) | **nein** — der Körper trägt weiter nur die Fussnote «Fassung gemäss … 1976, in Kraft seit 1. Jan. 1978 (AS 1977 237)» an der Artikelnummer |
| NHG 3 | AS 1999 3071 Ziff. I 3 (S. 3073): «Art. 3 Randtitel und Abs. 4» | **ja** (Abs. 4 eingefügt, 2014 wieder aufgehoben) |
| VVG 47a | AS 2021 758 Anhang Ziff. 4, Ersatz von Ausdrücken: Ziff. 1 «In Artikel 47a Randtitel wird … ersetzt», Ziff. 2 «In Artikel 47a wird «Versichertennummer der AHV» durch «AHV-Nummer» ersetzt» | **ja** (Körper, ohne eigene Körper-Fussnote — die Ausdruck-Fussnote am Heading deckt beides) |

GTR Rz. 322: Wird bei der teilweisen Änderung eines Artikels die Sachüberschrift oder der Randtitel geändert, weist die Anweisung eigens darauf hin («Sachüberschrift» / «Randtitel»); der Körper steht in derselben Anweisung als «Abs. …». GTR Rz. 81: Randtitel (Marginalien) anstelle von Sachüberschriften bleiben nur bei bestehenden Kodifikationen (ZGB, OR, StGB); tragen sie eine Gliederung mit Ziffern oder Buchstaben, ist das Teil der Gliederung des ganzen Erlasses. Eine Sachüberschrift (Rz. 79) hat kein Gliederungszeichen.

## Regel (deterministisch; umgesetzt in `src/lib/normtext/historie-parse.ts`)

1. Eine Fassungs-Fussnote (`Fassung gemäss` / `Eingefügt durch` / `Ausdruck gemäss`) an einem **eigenen Randtitel des Artikels MIT Gliederungszeichen** (`randtitelMitAufzaehler`: Buchstabe, Ziffer, römische Zahl, ggf. mit lat. Suffix, auch als Lauf «V.–VII.») ist ein Überschrift-Ereignis: sie speist nur die Chronik (`ueberschrift` = Randtitel-Label), nie «Gilt seit» (gleiche Mechanik wie Regel C).
2. **Ausnahme (Körper mit angefasst):** nennt eine ANDERE Fussnote desselben Artikels ohne `sektion` (Artikelnummer, Absatz, Buchstabe) dieselbe AS-Fundstelle (`eli/oc`-Link oder «AS Jahr Seite» im Wortlaut), hat der Änderungserlass auch den Körper geändert («Randtitel und Abs. …») — das Datum bleibt eigen. Ohne gemeinsame Fundstelle (auch ohne Link) gilt: reine Randtitel-Änderung.
3. Die **Sachüberschrift ohne Gliederungszeichen** (VVG 47a «AHV-Nummer», NHG 3 «Pflichten von Bund und Kantonen») bleibt eigen — unverändert; ebenso ein amtlicher Gliederungsknoten (Titel/Abschnitt/Kapitel) mit genau einem Artikel (Vorgabe B4, #1286, unberührt).

Die Regel ist ein **Stellvertreter** für die amtliche Anweisung (die selbst nicht im Fedlex-Konsolidierungstext steht, sondern nur im AS-Erlass): sie trifft ZGB 299/300 und lässt VVG 47a/NHG 3, ist aber nicht für jeden Einzelfall amtlich gleichwertig (siehe Grenzen).

## Messung (3.10.2026, Skript `vite-node` über alte/neue Historie-Sidecars, alle 212 Shards)

- 87 Bund-Artikel ändern «Gilt seit» (in 12 Erlassen: ENTG, IPRG, KOV, LFG, OR, PATG, SCHKG, STGB, VSTV, VWVG, VZG, ZGB), 16 weitere erhalten nur das Chronik-Merkmal `ueberschrift` bei unverändertem «Gilt seit»; **0 Änderungen ausserhalb dieser Klasse** (Vollvergleich Artikel für Artikel, Kopffelder und alle Nicht-Klassen-Felder identisch).
- ZGB 299/300: 2018-01-01 → 1978-01-01 (Fassung am Artikel selbst, AS 1977 237); VVG 47a 2022-01-01 und NHG 3 2000-01-01 unverändert.
- AS-Gegenprobe aller 87 (Wortlaut «Art. N Randtitel» im AS-Erlass, pdf-a): 64 mit abrufbarem Erlass — **59 «nur Randtitel»**, 1 «Randtitel und Abs. 1» (ZGB 286, «Betrifft nur den italienischen Text» ⇒ deutscher Körper unverändert), 3 uneindeutige Treffer (ZGB 255 = «Art. 255 Randtitel» an zweiter Stelle; VWVG 44 und LFG 37u = Umnummerierung «Bisheriger Art. 36e»), 1 nicht auffindbar (Schlusstitel-Token `dispu1art55`); 23 ohne AS-Link bzw. ohne abrufbare PDF-Fassung (Erlasse vor 2000 u. a.) — dort bleibt die Regel Stellvertreter.
- Belege (Identitätstreffer «Art. N Randtitel» im AS): ENTG 53 (oc/2020/748), LFG 22 (oc/2011/165), OR 676 und OR 717 (oc/2020/746), OR 956 (oc/2015/609), PATG 36 (oc/2008/526), SCHKG 302/303 (oc/2013/757), STGB 355b (oc/2010/267), VWVG 75/77 (oc/2006/352), ZGB 177 und 310 (oc/2015/728, oc/2014/53), ZGB 975/977 (oc/2011/666), ZGB 299/300 (oc/2017/425).

## Geltung / Ausnahmen / Grenzen

- Gilt für Bund-Erlasse im Sidecar-Korpus (`public/normtext/struktur/bund/`); Kantone unberührt (eigene Historie-Linie).
- **Nicht gelöst (offen für David):** (a) amtliche Gliederungsknoten mit genau einem Artikel (B4: «eigen», z. B. AHVV 43 «F. Haftung der Erben», 220 Artikel im Korpus) — dieselbe Frage wie «Randtitel», aber vom Entscheid nicht erfasst; (b) bei «Randtitel und Abs. …»-Erlassen, deren Absatz später aufgehoben wurde, bleibt das Randtitel-Datum «Gilt seit» (NHG 3: Abs. 4 2014 aufgehoben, «Gilt seit» 2000) — Teilaufhebungen zählen im Modell nirgends in «Gilt seit».
- Die Aufzähler-Erkennung in `darstellung.ts` (ENUM) kennt «Asexies.»/«Asepties.» nicht (nur bis 4 Buchstaben): die Anzeige führt diese Randtitel als Blatt-Sachüberschrift. Nicht geändert (Anzeige, §3); die Regel hier nutzt ein eigenes Prädikat.

## Pflegebedarf

- Neue lat. Suffixe in Gliederungszeichen (über «decies» hinaus) in `GLIEDERUNG_SUFFIX` nachtragen.
- Nach jedem Re-Pin/neuer Extraktion: `npm run gen:historie` (Sidecars sind Projektion der Struktur-Sidecars); der Test `src/tests/normtext-historie-ueberschrift-w227.test.ts` hält ZGB 299/300, VVG 47a, NHG 3 fest.
