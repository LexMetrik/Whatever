# ESTV-Kreisschreiben: Dokumentdatum und Ersetzung — Messung 25.9.2026

Anlass: Erlass-Blatt Welle 2 Daten-Rest (W2·29-WERKBANK-LESER), Befunde AN-1, AN-2, AN-13
aus dem Reiter «Behördliche Erläuterungen» (Befund-Sammlung 23.9.2026).

## Quelle mit Stand

- ESTV-Indexseite «Kreisschreiben direkte Bundessteuer»,
  https://www.estv.admin.ch/de/kreisschreiben-direkten-bundessteuer, Abruf 25.9.2026
  (server-gerendert, 79 `download-item`-Anker). Gleiche Struktur auf den Seiten
  Verrechnungssteuer und Stempelabgaben (Adapter `scripts/materialien/adapter-estv-ks.ts`).
- PDF-Volltexte der Kreisschreiben 11a, 18a, 22a, 23a, 26 (Version 2024), 29a, 37a, 50, 50a
  (Links aus `public/materialien/register.json`), Abruf 25.9.2026, Text mit `pdfjs-dist`.

## Regeln (deterministisch)

1. **Dokumentdatum (AN-2).** Jeder Anker trägt drei Datumsangaben: im Titel nur bei der
   W-Serie/Mitteilung («W95-002D vom 12.11.1992»), in der Beschreibung die amtliche Datierung
   des Dokuments («… vom 31.08.2005 (Direkte Bundessteuer)» an KS Nr. 11) und das
   `meta-info`-Label, das das Upload-Datum ist (bei 50 von 70 Einträgen einheitlich
   «10. Oktober 2023»). Massgeblich: Titel → erste Zeile der Beschreibung, numerische Form
   «vom DD.MM.YYYY» → Label. **Nicht** bei Beilagen: deren Beschreibung datiert das
   Haupt-Kreisschreiben («Spartenrechnung gemäss Kreisschreiben Nr. 23 vom 17.12.2008»).
   Folgezeilen der Beschreibung listen Anhänge mit fremden Daten («Kreisschreiben Nr. 30 der
   SSK vom 22. August 2007» an KS Nr. 20) und zählen nicht. `stand_quelle` =
   `hub-beschreibung`.
2. **W-Serie (AN-13).** Der Titel ist nur «Signatur vom Datum»; der Gegenstand steht allein in
   der ersten Beschreibungszeile («W01-006D vom 06.06.2001 | Verordnung über die pauschale
   Steueranrechnung»). Die Signatur im Titel weicht vom Dateinamen ab: `dbst-ks-w03-006` ↔
   «W01-006D», `dbst-ks-w03-008` ↔ «W02-008D» (`w03-001` ↔ «W03-001D» deckungsgleich). Anzeige-
   Nummer = Titel-Signatur ohne Sprachkürzel «D»; der Key bleibt dateinamen-stabil (§2.6).
3. **Ersetzung (AN-1) — NICHT auf der Indexseite.** Die Indexseite führt Original und
   Nachfolger nebeneinander (11/11a, 18/18a, 22/22a, 23/23a, 50/50a, 26/26-Version 2024, 5/5a)
   ohne Kennzeichnung; weder «ersetzt» noch «aufgehoben» kommt im Seitentext vor. Die
   Ersetzung steht nur im PDF des Nachfolgers, und nicht einheitlich:
   - KS 50 (13.7.2020), Ziff. «Inkrafttreten und Aufhebungen»: das Kreisschreiben Nr. 16 vom
     13. Juli 2007 wird aufgehoben.
   - KS 11a, Ziff. 7 «Geltungsbereich»: «Dieses Kreisschreiben ersetzt das Kreisschreiben Nr. 11».
   - KS 18a: «Es ersetzt das Kreisschreiben Nr. 18».
   - KS 22a, 23a (31.1.2020): keine Ersetzungs- oder Aufhebungsklausel gefunden — die a-Fassungen
     gelten für neuere Steuerperioden, die Originale bleiben für frühere massgeblich.

## Geltung / Ausnahmen

- Regel 1 und 2 gelten für die drei ESTV-KS-Indexseiten (DBG/VStG/StG). Die kuratierten
  Einträge (KS 5a, 6a, 32a, 37) sind vom Adapter ausgenommen und tragen ihr kuratiertes Datum.
- Regel 3 ist eine Messung, keine Bauregel: eine «ersetzt durch»-Kennzeichnung braucht eine
  neue Quelle (PDF-Volltext, Abschnitt Inkrafttreten/Aufhebung/Geltungsbereich) und einen
  fachlichen Entscheid, wie «aufgehoben» von «für frühere Steuerperioden massgeblich»
  unterschieden und angezeigt wird (22/22a, 23/23a).

## Pflegebedarf

- Der Adapter erkennt ein geändertes Beschreibungs-Datum über `sha`/`stand` im Zustandsträger
  (`bibliothek/register/soft-law-zustand.jsonl`); `check:materialien-netz` meldet Drift.
- Ersetzungs-Relation: offen (Frage an David, s. Befund AN-1).

## Abnahme-Status

Maschinell gemessen, nicht fachlich abgenommen.
