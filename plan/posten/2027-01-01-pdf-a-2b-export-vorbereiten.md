<!-- @posten
dach: W3-AUSBAU
titel: PDF/A-2b-Export vorbereiten
anlass: Wiedervorlage 1.1.2027
-->

  - [ ] **PDF/A-2b-Export vorbereiten** *(Wiedervorlage 1.1.2027)* — BEKJ tritt 1.7.2027 in Kraft, `jspdf` erreicht PDF/A-2b nicht → Export-Schicht-Umbau mit Vorlauf. *Nachtrag 6.9.2026: BEKJ-Pflicht für berufsmässige Akteure spätestens Mitte 2032, Plattform frühestens 1.7.2028; justitia.swiss publiziert bisher keine PDF/A-Version, eCH-Nummer oder Metadaten-Vorgabe — nicht an eine Formatvorgabe binden. Quelle: Fremdnutzen-Suchrunde 2 (6.9.2026) §3 A.*

**Erweitert 22.9.2026 — zwei kleine Vorstufen, die schon heute tragen** (Messung Recherche-Session
21./22.9.2026; Detail `bibliothek/recherche/legal-design-und-korrektheits-recherche-2026-09-21.md`
Ziff. 9):

  - [ ] **DOCX: Dokumentsprache + echte Listen.** `docx ^9.7.1` erzeugt bereits echte Headings
        (`vorlagenDocx.ts:98,107,257-262`), aber **keine** Dokumentsprache und **keine** echten
        Listen — ein Screenreader liest die Aufzählungen als Fliesstext und rät die Sprache. Klein.
  - [ ] **PDF: Metadaten Titel + Sprache.** `jspdf ^4.2.1` (`vorlagenPdf.ts:48`) setzt weder
        `setProperties` noch `setLanguage`, kein Tagging, nur Helvetica-Standardfont. Ob die API in
        4.2.1 vorhanden ist, ist **nicht verifiziert** — vor dem Bau prüfen. Klein.

**Auflage für beide:** sie ändern Export-Bytes ⇒ **deklarierte Golden-Änderung**, kein
verhaltensneutraler Umbau. Prüfwerkzeug CI-fähig: veraPDF.

**Pflicht-Lage (Stand 22.9.2026):** heute keine — eCH-0059 V3.0 gilt nur für die Verwaltung; die
BehiG-Teilrevision (Botschaft 20.12.2024, Inkrafttreten evtl. 1.1.2027) ist nicht geltendes Recht;
der EAA erfasst nur die Anhang-I-Kategorien. Art. 6 VeÜ-ZSSV verlangt PDF, eine **PDF/A-Pflicht ist
nicht belegt**. Volles PDF/UA lohnt darum jetzt nicht: kein Browser-JS-PDF-Erzeuger erreicht es 2026.
