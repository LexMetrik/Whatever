# Gestaffeltes Inkrafttreten von Bundeserlassen — Erkennungssignale (2.10.2026)

**Erstellt:** 2.10.2026 — Anlass: ROADMAP `W2·27-BUND-FERTIG` E1
**Status:** Gegenprüfung Opus bestanden (3 Runden) — fachliche Abnahme David offen. Kein `verified`/«geprüft» gesetzt.

**Hintergrund:** (Zeile «Erlass in Kraft seit <Ur-Datum>», Draft #1263). Bei
Erlassen, die nicht an einem Tag in Kraft traten, wäre das Ur-Datum für einzelne Artikel falsch
(§8). Umgesetzt in PR #1288 (`scripts/normtext/inkrafttreten-generieren.ts`,
`scripts/normtext/inkrafttreten-fedlex-datum.ts` → `public/normtext/inkrafttreten.json` Felder
`gestaffelt`, `gestaffeltGrund[]`, `teilDaten[]` → `register.json` `inkraftGestaffelt`).

## Quelle mit Stand
- Fedlex SPARQL `https://fedlex.data.admin.ch/sparqlendpoint`, Abruf 2.10.2026:
  `jolux:dateEntryInForce` am Abstract; Konsolidierungen `jolux:isMemberOf` + `jolux:dateApplicability`.
- Fedlex-Filestore-XML der gepinnten Fassung (Pin-Konvention `fedlex-xml-cache.ts`): Absatz
  «Datum des Inkrafttretens: …» an der Inkrafttretensbestimmung (89 von 231 Erlassen).

## Regel (deterministisch, erlassweit, fail-closed)
`gestaffelt = true`, wenn eines zutrifft:
1. **fedlex-inkrafttretensdatum:** Datums-Absatz («Datum des Inkrafttretens:», Variante
   «…Inkrafttreten:», Absatzanfang «Inkrafttreten:») nennt > 1 verschiedenes Datum
   (Fussnoten-Daten ausgeblendet; Monatsabkürzungen inkl. «Febr.», Zahldaten d.m.yyyy).
2. **fedlex-zeitleiste:** früheste Konsolidierung liegt vor dem Ur-Datum.
3. **wortlaut-hauptklausel:** Hauptklausel mit Vorbehalt/Ausnahme/Teil-Klausel («unter Vorbehalt
   von …», «mit Ausnahme von Art. …», «Artikel N … treten … in Kraft», vorzeitig, gestaffelt …).
   Nicht: «unter Vorbehalt von Absatz N», wenn derselbe Artikel einen Referendums-Absatz hat.
4. **fussnote-teildatum** / **fussnote-inkraftsetzungs-v** an der Inkrafttretensbestimmung.
Fail-closed: Quelle nicht abrufbar, Datum unlesbar oder ungelesene Jahreszahl im Datums-Absatz ⇒
`gestaffelt: true`, Grund `unbekannt`. Fehlendes Feld beim Konsumenten = wie `true`.
**Kein Signal:** `dateEntryInForce` (alle 231 genau 1 Datum; Fedlex setzt teils den frühesten
Teil-Termin, z. B. KG, AVIG, ENTSG, FMG, BEG, IVG, teils den Haupttermin, z. B. ATSG);
«Der Bundesrat bestimmt das Inkrafttreten» allein (ZPO Art. 408 nicht gestaffelt).

## Geltung / Ausnahmen
Stand 2.10.2026: 61/231 gestaffelt. Bewusst übervorsichtig: FINIG, BGFA, PARTG, TXG, SCHKG
(Zeitleisten-Artefakt 1876). 142 Erlasse ohne Datums-Absatz hängen an Signalen 2–4
(Restrisiko falsch-negativ; latente Wortlaut-Formen als Posten). Artikelgenaue Auflösung nicht
allgemein möglich (Freitext; nur MWSTG, ZSTV, AHVG mit Datum je Artikel).

## Pflegebedarf
Bei jedem `npm run gen:inkrafttreten` (Netzlauf, sequentiell ≤ 231 XML). Korpus-Test
`src/tests/inkrafttreten-gestaffelt.test.ts` hält die Golden-Menge und die Kontrollen
(OR, BV, ZPO, DSG, BGG, IPRG, VVG, StPO, ArG, VwVG, DBG, StHG, BankG, GSchG, OHG = false).

## Abnahme-Status
Gegenprüfung Opus 3 Runden bestanden (231/231 unabhängig geparst, 0 falsch-negativ).
Fachliche Abnahme David offen.
