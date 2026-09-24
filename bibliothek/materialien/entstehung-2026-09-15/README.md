# Entstehung am Artikel — Recherche-Runde 15.9.2026 (Stufe 4: Botschaftstext, Parlament je Artikel, Bulletin, Ursprung)

**Anlass:** David 15.9.2026: «Ist geplant, den Text aus Botschaften darzustellen?» → «Wäre das
möglich? Wichtig ist die Datenherkunft, und dass diese optimal ist» → «Ich will am Ende alles, was
die Schweiz an Behördeninformationen hat, auf LexMetrik abbilden und einfach besser verlinken.»
Drei Recherchen (read-only, Live-Abrufe 15.9.2026: zwei Opus, eine Sonnet), Berichte wörtlich
kopiert. Planungs-Session ohne Bau. **Bau-Spec:** `fahrplaene/FAHRPLAN-MATERIALIEN-VERZAHNUNG.md`
§12; Roadmap-Schritte `W2·6d-*`; Endziel als Leitprinzip 8 in `ROADMAP.md`.

## Befunde je Bericht

- **`botschaften-formate.md`** (Opus, Fedlex SPARQL + Filestore) — 407/407 Botschaften mit
  Manifestationen (Count-Gate). PDF/A 407/407, alle born-digital (auch 1999), einspaltig, kein
  Scan; XML/HTML (Akoma Ntoso) erst ab Jahrgang 2022 (43), DOCX 2020/21 (54, Absatzstil
  `TitelArtikelKomm` auf Artikel-Überschriften). Erläuterungs-Kapitel in 43/43 XML als `<level>`
  adressierbar; Artikel-Ebene strukturell nur 7/43, 31/43 als stilloses `<p>`. eId-Dubletten bei
  Mantelvorlagen (bis 134). Drift: `Last-Modified` + `If-Modified-Since` → 304; kein ETag; Soft-404;
  7 % Revisions-Suffixe. **Neue Falle:** Host-Tausch `isExemplifiedByPrivate` versagt bei fga-`doc`
  vor 2017 (Shell). Lizenz Art. 5 Abs. 1 lit. c URG.
- **`bulletin-vote-ursprung.md`** (Opus, ws.parlament.ch OData) — Join `SubjectBusiness` →
  `IdSubject` → `Transcript`. **`Vote.Subject` liefert NR-Abstimmungen je Artikel strukturiert**
  (181/188 gejoint), Ständerat nur Freitext (Zahlen im Text). Rollen ohne Personendaten erkennbar
  (`CouncilName eq 'Bundesrat'`, `Function eq '*'` = Berichterstatter, 115/115). Votum→Artikel per
  Text: ~81 % Präzision, ~50 % Recall — nur «maschinell». Volumen 385 Geschäfte: Volltext ≈ 370 MB,
  amtliche Voten ≈ 114 MB. Lizenz-Wortlaut erweitert (kein amtlicher Eindruck, Abrufdatum sichtbar).
  Ursprung: Vehikel (`BusinessType`, 15 Werte) deterministisch; Auslöser (Motion/Postulat) nur
  Prosa in `InitialSituation`, `RelatedBusiness` leer für alle vier Geschäfte.
- **`gesetzgebungsverfahren-bund.md`** (Sonnet, amtliche PDF ParlG/VlG/BV/PublG via PyMuPDF) —
  Verfahrensmodell Schritt × Norm × Dokument × Publikationsort × Fedlex-Code. Art. 141 Abs. 2 ParlG
  wörtlich (15 Pflichtinhalte); gilt sinngemäss für Kommissionsberichte (Art. 111 Abs. 3 ParlG) und
  Erläuternde Berichte (Art. 6a VlG) ⇒ ein Extraktionsschema für drei Dokumenttypen. Lücken: kein
  Fedlex-Code für den Anstoss (Motion/Pa.Iv./Kt.Iv./Legislaturplanung), keiner je Lesung,
  Botschaft/Zusatzbotschaft teilen Code 200. Status: **Entwurf**, fachliche Abnahme David offen
  (Zeitsperre); Vertiefung = Roadmap `W2·6d-VERFAHREN-RECHERCHE` (seit 24.9.2026 Etappe EA0 im Dach `W2·6d-ENTSTEHUNG`).

## Ergänzung zur Runde 6.9.2026 (keine Korrektur, §2b)

`nutzersicht-vorbilder.md` Zeile (c) «`Transcript` hat kein Artikel-Feld» bleibt richtig, ist aber
unvollständig: die Artikelzuordnung existiert strukturiert in `Vote.Subject` (NR). Vermerk dort
datiert nachgetragen.

## Abnahme-Status
Maschinell erhoben, alle Aussagen mit Abfrage + Datum; fachliche Abnahme David (§7/§8) offen.
Rohdaten lagen im Session-Scratchpad (43 XML, 13 PDF, 9 DOCX, Bulletin-JSON) und sind nicht
committet — Re-Messung über die im Bericht genannten Abfragen.
