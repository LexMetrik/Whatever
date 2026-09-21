# Bibliothek — Informationsgrundlagen für LexMetrik

Zentrale Ablage für recherchierte Grundlagen, Quellenregister und Arbeitsmaterial,
das (noch) nicht Code ist. Gliederung in Ordnern (siehe unten); Bestandszahl
NICHT hier hartkodiert (Kurzregel 5 unten — Ordnerinhalt/Tabellen sind die
Wahrheit, keine von Hand geschriebene Kopfzahl).
Verbindlich seit 6.6.2026: **CLAUDE.md §11** — jede Recherche mündet hier in eine
geordnete, engine-orientierte Übersichtsliste mit INDEX-Eintrag.
**Verbindliche Mindeststandards S1–S10: [STANDARDS.md](STANDARDS.md)** —
maschinell durchgesetzt via `bash scripts/bibliothek-check.sh` (Teil des
§9-Bug-Checks). Kurzregeln:

1. **Nur amtliche Quellen als Beleg**, immer mit URL und Abrufdatum (§7);
   kantonale Erlasse stets in der geltenden konsolidierten Fassung via
   Erlasssammlungs-API (`abrogated`/`future_versions` prüfen — Daueranweisung).
2. **Status ehrlich tragen:** zweifach geprüft (Erstrecherche + adversarialer
   Durchgang) · einfach belegt · offen. Übernahme in Engines/Stammdaten erst
   nach fachlicher Abnahme durch David.
3. **Unsicherheiten bleiben sichtbar** (§8) — nie weggeglättet.
4. **Datiertes datiert halten** → [Parameter-Verfallsregister](register/parameter-verfall.md).
5. **Hartkodierte Bestandszahlen (Dokumenten-/Dossier-Anzahl u. Ä.) nur generator-
   gepflegt oder gar nicht** — eine von Hand geschriebene Kopfzahl veraltet
   unbemerkt und wird selbst zur zweiten Wahrheit (§5); Ordnerinhalt/Tabelle
   sind die Wahrheit, nicht ihre Zählung im Fliesstext.

## Gliederung

```
bibliothek/
  register/    Quellen-Register (Fedlex-Stände) · Parameter-Verfallsregister · Engine-Map
  normen/      Regelwerke ZPO·SchKG·StPO·Erbrecht·Feiertage — die Engine-Grundlagen
  behoerden/   Gerichte · Schlichtung · Strafverfolgung · Erbgang · Notariate (je 26 Kantone)
  kosten/      Schlichtungsgebühren · Gerichtskosten Bund · Anwaltstarife
  recherche/   Dossiers zu geplanten Engines/Vorlagen → eigener INDEX.md dort
  muster/      Amtliche Vorlagen verbatim (.txt) + MANIFEST (Quellen-URLs/Stände)
  rechtsprechung/  Register aller zitierten Bundesgerichtsentscheide (Links + Fundorte)
  materialien/ Amtliche Ressourcen / Soft-Law (Behörden-Publikationen) — Rubrik «Materialien»
  normtext/    Volltext-Nebenprodukte (Änderungshistorie/Revisionen-Timeline, Rohdaten) zu den Bund-Erlassen
  seo/         Sichtbarkeit & Performance (CWV-Baseline, Indexierung)
  betrieb/     Betriebs-/Infrastruktur-Dossiers (Hosting-Beschaffung, CI-/Prüf-Forensik)
  quellen/     Lokale Quellkopien aus Davids Ablagen (gitignored, Urheberrecht) — committet nur die Sichtung [SICHTUNG.md](quellen/SICHTUNG.md)
```

**Schnellster Einstieg beim Bauen:** [register/engine-map.md](register/engine-map.md)
— Code-Modul → tragende Dossiers → Bau-/Abnahme-Status (neu 7.6.2026).

**Recherche-Dossiers (27, Bau-Priorisierung):** [recherche/INDEX.md](recherche/INDEX.md) —
neu 6.6.2026: [gesellschaftsgruendung](recherche/gesellschaftsgruendung.md)
(Deep-Research, Dokumente je Rechtsform verbatim aus HRegV/OR + Notariats-Praxis)
+ Vertiefungen [gmbh-gruendung](recherche/gmbh-gruendung.md) (inkl. Bauspez.
Maske Gründungsunterlagen) und [ag-gruendung](recherche/ag-gruendung.md)
(inkl. Emissionsabgabe am neu gepinnten StG-Cache)

**Spruchkörper-Extraktion (Richter-Filter):** [rechtsprechung/besetzung-extraktion-2026-07-20.md](rechtsprechung/besetzung-extraktion-2026-07-20.md) —
Fundament des Richter-Filters (`R-RICHTER`, Block A): wie der amtliche Besetzungs-Block
aus BS-Rohdokumenten geschnitten und korpusweit zu Kanon-Slugs normalisiert wird.
Enthält die **Anonymisierungs-Grenze** als testbare Invariante (Leak-Scan korpusweit 0;
«Dr. med.» = legitimer Fachrichter, kein Ausschluss), vier belegte Korrekturen am
ursprünglichen Bauplan (Hidden-Spans, Voll-Vorname statt Initial, Absatz-Naht in
BEIDE Richtungen), die Abdeckungszahlen je Gericht und den Kollisions-Report
(false-merge/false-split) samt Alias-Tabelle. Abnahme-Status: Erstrecherche — die
fachliche Richtigkeit der Alias-Zusammenführungen ist Davids Abnahme.

**Rechtsprechungs-Register:** [rechtsprechung/bge-register.md](rechtsprechung/bge-register.md) —
alle 93 im Code zitierten BGE/BGer-Urteile mit amtlichem Link (URL-Schema §7-verifiziert
6.6.2026: ATF-Permalink bzw. AZA-Suche), Aussage, Code-Fundorten und Status; generiert
aus der SSoT `src/data/verifikation.ts` via `npx vite-node scripts/bge-register-generieren.ts`
(meldet Lücken — Stand 3.8.2026: 41, alle vorbestehend). Status je Entscheid in drei
Stufen: «zu verifizieren» → «Quelle geprüft (…)» (§7-Quellenprüfung durch eine Session)
→ «verifiziert» (Davids fachliche Abnahme, nie automatisch).

**BGE 151 III 81 — Quellenprüfung (Vorsorgeauftrag, Beurkundung):**
[rechtsprechung/bge-151-iii-81-verifikation-2026-08-03.md](rechtsprechung/bge-151-iii-81-verifikation-2026-08-03.md) —
Prüfung 3.8.2026 am amtlichen Entscheidtext (W2·8/V9.2): Trägt der Entscheid die von
Engine und UI behaupteten Aussagen? Verdikt **ja, beide** — E. 3.5.5 (Beurkundung nach
kantonalem Recht, Art. 55 SchlT ZGB) und E. 3.1/3.6 (zwei Zeugen von Bundesrechts wegen
nicht erforderlich), mit den tragenden Erwägungen wörtlich. Präzision: das
Zeugen-Erfordernis entfällt von BUNDESRECHTS wegen — ein kantonales Beurkundungsrecht
könnte Zeugen vorschreiben (im Fall SG tut es das nicht). Abnahme-Status: Quellenprüfung
bestanden, fachliche Abnahme David offen.

**BGE-Leitentscheide-Import:** [rechtsprechung/bge-leitentscheide-import.md](rechtsprechung/bge-leitentscheide-import.md) —
Stufe 1 des Rechtsprechungs-Ausbaus (Auftrag David 23.6.2026): Import der amtlichen
BGE-Leitentscheide ab 2024 (265 dt., curated statt Routine) aus OpenCaseLaw (Court `bge`);
Quelle/Stand, Pipeline (`adapter-entscheide`/`normtext-entscheide`), Datum via aza-Cross-Fetch
+ Bandjahr-Fallback, Sachgebiet-Ableitung. Inhaltliche Einzelabnahme: David, offen.

**BGE-Band-Nachzug 146–149 (2020–2023):** [rechtsprechung/bge-baender-146-149-nachzug-2026-07-12.md](rechtsprechung/bge-baender-146-149-nachzug-2026-07-12.md) —
Auftrag David 12.7.2026 «bge bis 2020 integrieren» (W2·6): die vollständigen amtlichen
BGE-Bände 146–149 (**788** BGE, alle Sprachen) additiv zum Bestand, **band-basiert de/fr/it**
enumeriert (Q1-Bandjahr-Quirk + Sprachfilter-Falle: `language=de` verlöre 247 fr/it-BGE);
aza-Bindung + Urteilsdatum aus dem amtlichen clir-Urteilskopf (Fix nach Gegenprüfungs-R1
`widerlegt`), dreisprachige clir-Regeste (A18). Band-weise (PR-A 146+147 = 404, PR-B
148+149 = 384), BUDGET_MB 35→100. Quelle/Stand, Regel, Band-Zählungen, Gegenprüfungs-Historie.

**BGer-Korpus-Ausbau (Zitiergraph-Pfad):** [rechtsprechung/bger-korpus-ausbau-2026-06-26.md](rechtsprechung/bger-korpus-ausbau-2026-06-26.md) —
Ausbau auf 610 Entscheide (580 Bund + 30 kantonal, +240 BGer) via Default-`bger`-
Citation-Graph (Auftrag David 26.6.2026, §12-isoliert auf Branch
`rechtsprechung/mehr-bge-leitentscheide`). Quelle/Stand, Rebuild-Befehl, der echte
«sinnvoll»-Deckel `BUDGET_MB=20` (18.93 MB), Superset-Garantie gegen main, sowie die
offene Entscheidung amtliche BGE (`bge`) vs. Zitiergraph-BGer (`bger`). Mechanik
verifiziert (Gate grün); Einzelabnahme: David, offen.

**Rubrum-Darstellung + Daten-Befund:** [rechtsprechung/rubrum-darstellung-regelwerk.md](rechtsprechung/rubrum-darstellung-regelwerk.md) —
einheitlicher BGE-Detailseiten-Kopf (Auftrag David 24.6.2026, ultracode); Cross-Check
gegen entscheidsuche-mcp deckte auf, dass alle 178 gespeicherten Rubrum-Felder
Falsch-Positive (Erwägungs-Fragmente) waren; deterministisches Plausibilitäts-Tor
`rubrumFeldPlausibel` (Anzeige + Extraktion + Bestands-Reinigung), narrative
Vorinstanz-Anreicherung §1-bedingt verworfen. Abnahme David offen.

**entscheidsuche-Live-Suche (B2) + Sachverhalt-Gliederung:** [rechtsprechung/entscheidsuche-livesuche-und-sachverhalt.md](rechtsprechung/entscheidsuche-livesuche-und-sachverhalt.md) —
Teil B (Auftrag David 24.6.2026): Browser-Live-Suche über den ganzen CH-Korpus via
`entscheidsuche.ch/_search.php` (CORS-verifiziert; MCP browser-untauglich/403), opt-in
+ extern markiert (§2/§8); plus sichere Sachverhalt-Gliederung (nur Sub-Marker A.a/B.b,
sequenzvalidiert, 0 Fehl-Splits über 258 BGE) inkl. Bug-Check-MAJOR-Fix (Schluss-Namen).
Branch, nicht deployt; Abnahme David offen.

**Render-Noise-Sweep (B1, Steuer-Liste für A1/A2):** [rechtsprechung/render-noise-sweep-2026-06-27.md](rechtsprechung/render-noise-sweep-2026-06-27.md) —
adversarialer read-only Sweep über den ganzen Entscheid-Korpus (327 Snapshots, 27.6.2026,
JETZT-MACHEN §4.2). Befunde: Inline-Seitenmarker in **273** Entscheiden (261 Auszug + 16 VOLL,
korrigiert die Plan-Annahme «0 in abschnitte»); **4** FR-Bodies fälschlich `sprache:'de'`
(korrigiert «genau ein FR-Body»: 151_IV_357/152_II_75/152_II_98/152_I_105); 7 gekappte
Sachverhalte; **Fussnoten-Leak Heuristik = Falsch-Positiv** (41 «Fn.»-Treffer = Doktrin-Zitate),
nur 1 echter kantonaler Superscript-Leak; Regeste-Leak/verirrte Marken = 0. Priorisierte
Fix-Liste steuert A1/A2/A3. Kein Code-Fix; `verifiziert:false`, Abnahme David offen.

**Neue eidg. Gerichte (Auftrag 9, read-only):** [rechtsprechung/neue-gerichte-dossier-2026-06-27.md](rechtsprechung/neue-gerichte-dossier-2026-06-27.md) —
Dossier BVGer/BStGer/BPatGer (Nacht-Session 27.6.2026, ultracode-Fan-out, doppelt
verifiziert). Je Gericht: Publikationsart + Leitentscheid-Kriterium, Portal/entscheidsuche-
Spider (`CH_BVGer`/`CH_BSTG`/bpatger), Geschäftsnummer-Regex, Sprachen (FR/IT zwingend → A2),
Regel-Synthese (Aufnahme→Manifest→Darstellung am BGer-Muster) + neueste Kandidaten. Steuert den
späteren Bau (nach A2); KEIN Code. Abnahme David offen.

**Sachgebiets-Klassierung Rechtsprechung — J3-Regelwerk (W2·10-UI-NAV-J3):** [rechtsprechung/sachgebiet-klassierung-j3-2026-08-29.md](rechtsprechung/sachgebiet-klassierung-j3-2026-08-29.md) —
Regel-Stand 29.8.2026 (deterministisch, §2): 2A/2C/2D-Default neu `oeffentlich` statt Pauschale
`sozial-abgaben`; `NORM_SIGNAL` + BGFA→öffentlich (Anlassfall BGE 150 II 300); BV bewusst KEIN
Signal (§7-Abweichung, kippte echte Steuerfälle). Bestands-Regen 119 Snapshots / 237 Register-Wechsel via
`remap-sachgebiet-j3.ts` (Gegenprüfungs-Befunde F1–F3 eingebaut); Quirks Q-J3-1…9 (Offline-Signalquelle, totes STG, Doppel-Topf
Steuern/Sozialversicherung → David-Entscheid, kantonale Präfix-Kollision BV/SG). Abnahme David offen.

**Eidg. Gerichte BVGer/BStGer/BPatGer — Aufnahme/Bau (Auftrag 9, Batch 3):** [rechtsprechung/eidg-gerichte-aufnahme-2026-06-27.md](rechtsprechung/eidg-gerichte-aufnahme-2026-06-27.md) —
Umsetzung des Dossiers (27.6.2026). Befund: OCL führt alle drei als eigene `court`-Codes
(`bvger`/`bstger`/`bpatger`) → kein entscheidsuche-Scraper nötig. Additiver Build
(`--additiv --eidg=…`, kein Bestand-Drift), 15 Urteile (de 10/fr 3/it 2, erste IT im
Korpus), alle `routine` (Leitentscheid-Welle offen), Instanz-Achse + B2-Golden +8
Zellen. `verifiziert:false`, Abnahme David offen.

## Amtliche Ressourcen / Materialien

**Materialien-Rubrik P0 (Auftrag 5):** [materialien/amtliche-ressourcen-2026-06-27.md](materialien/amtliche-ressourcen-2026-06-27.md) —
Grundlage der neuen Rubrik «Materialien» (`src/lib/materialien/`, `/materialien`). 28 Behörden-
Publikationen (Soft-Law, kein Gesetzesrang) von 7 Bundesbehörden (ESTV·EDÖB·SECO·BSV·EHRA·FINMA·IGE),
alle `nur-live-link` (Erreichbarkeit 27.6.2026 geprüft). Beschaffungs-Regel (stabile Verzeichnis-
URL vs. Direkt-Link), Determinismus/Tor, normKeys-Verzahnung, Pflegebedarf, P1-Backlog (SEM/BAG).
Maschinell kuratiert; fachliche Abnahme David offen (Zeitsperre bis 1.12.2026).

**Kantonale Materialien BS — Vormessung K-16 (W2·13-KANTONE-DATEN):** [materialien/2026-09-12-k16-bs-vormessung.md](materialien/2026-09-12-k16-bs-vormessung.md) —
Quellen data.bs.ch 100311/100313/100354/100355 (CC BY 4.0, Abruf 12.9.2026) + LexWork-API der
BS-Gesetzessammlung. Kernbefund zum Schlüssel Erlass ↔ Geschäft: ein amtlicher Schlüssel existiert
(Fussnote «Ratschlag Nr. 06.1970.01» = `signatur_dok`, gegen 100313 verifiziert), deckt aber nur
5 von 859 Korpus-Erlassen; `change_documents[].materials` der amtlichen Fassung ist leer (0/126);
tragfähig bleiben zwei maschinelle Wege (SG-Nummer im Geschäftstitel 20 Erlasse; Erlassdatum +
Titel/Stichwort genitiv-tolerant 37 Erlasse, 102 Kanten = 25,7 % der 136 adressierbaren Gesetze),
Datum allein ist als Schlüssel widerlegt (Kollision 161.100/162.100). Geltung: nur BS; ZH offen.
Pflegebedarf: Monatslauf ausserhalb der Gate-Kette. Maschinell; fachliche Abnahme David offen.
**Nachtrag §9 (12.9.2026):** LexWork-`versions`-Endpunkt liefert Volltext-XHTML je Fassung
(`old_versions[]`) — Grundlage für `R12a-ENTSTEHUNG-BS` (FAHRPLAN-KANTONE.md §5), Lizenz des
Endpunkts ungeklärt, Nicht-Bau-Entscheid unverändert.

**Materialien-Register — Deckel-Messung und Projektions-Entwurf vor ZH (W2·13-KANTONE-DATEN):** [materialien/2026-09-12-register-deckel-messung.md](materialien/2026-09-12-register-deckel-messung.md) —
Quelle: die committete Projektion `public/materialien/register.json` (Korpusstand `f6b5471fc`), gemessen
12.9.2026 mit `zlib.gzipSync`. Regel deterministisch: das Register wird nach NUTZUNGSZEITPUNKT geteilt
(Kern · `register-i18n.json` nur für locale fr/it · `register-provenienz.json` nie vom Browser), nicht nach
Herkunft — Herkunfts-Shards und Lazy-Detail sind mit Zahlen verworfen. Befund: `sha` kostet 59,2 KB gzip
(inkompressibel), FR/IT-Titel 70,6 KB, und vier Feldgruppen werden ausgeliefert, die keine Browser-Zeile
liest; 331,8 → 118,3 KB gzip, Deckel 400 → 280 KB gesenkt, ZH-Prognose 49 %. Geltung: Rubrik Materialien
und Kontext-Panel, alle Herkünfte. Pflegebedarf: drei Dateien entstehen in EINEM Generator-Lauf, `check:materialien`
prüft alle drei byte-gleich. Maschinell gemessen; fachliche Abnahme David offen.

**Botschaften / Entstehungsgeschichte (Fedlex-Portfolio Paket 2, W2·6):** [materialien/botschaften-2026-07-10.md](materialien/botschaften-2026-07-10.md) —
401 Botschaften des Bundesrates über die 218 Bund-Volltext-Erlasse, automatisch über den
Fedlex-Gesetzgebungs-Projekt-Graphen verknüpft (SPARQL-Reverse-Kette, `draftHasLegislativeTask`
statt STRSTARTS = 260× schneller). Behörde `BR`, Doktyp `botschaft`, `nur-live-link`; Join-Felder
`projEli/ocUris/botschaftDate` für Paket 5; im Norm-Kontext-Bus «Entstehungsgeschichte» (Bridge B1).
Drift-Tor `check:botschaften-netz`. Maschinell zugeordnet; fachliche Abnahme David offen.

**Entstehung am Artikel — Daten-Etappen E1/E2 (W2·6c, Go David 11.9.2026):** [materialien/entstehung-daten-2026-09-11.md](materialien/entstehung-daten-2026-09-11.md) —
Bau-Befunde zur Verzahnung Fassungskette ↔ Verfahrenskette: Vokabular `type-projet` vollständig
26 Codes (Recherche 6.9. hatte 15), 1 609 Verfahrens-Ereignisse über 407/407 Botschaften, Botschafts-Anker
4/43 HTML-Botschaften mit 189 eindeutigen Ankern (83 mehrdeutige eIds bewusst nicht ausgeliefert, §1),
Deckungs-Diagnose 39,6 % gesamt bei Spanne 0–100 % je Erlass, Parlaments-Etappen aus Curia Vista
(385/402 Geschäfte, 3 577 Rats-Beschlüsse, 790 Kommissions-Vorberatungen, 454 NR-Schlussabstimmungen
nur aggregiert und ohne jede Personenabfrage), Rückbau-Prüfung `artikel-revisionen`
(A13) mit Ergebnis **Behalt** (17 Konsumenten, andere Fachfrage). Tore `check:entstehung`,
`check:botschaften-netz`. Gegenprüfung ausstehend; fachliche Abnahme David offen.

**Curia Vista — `Voting.Decision`-Codes (W2·6c E4):** [register/curia-decision-codes.md](register/curia-decision-codes.md) —
die acht amtlichen Codes samt Erhebungsmethode (je Code eine eigene Live-Abfrage) und Gegenprobe an
der DSG-Schlussabstimmung. `$metadata` deklariert kein Enum; die Tabelle ist darum von Hand belegt,
ein unbekannter Code macht den Generator rot. Schliesst den offenen Punkt 2 aus R4.

**Curia Vista — Identität einer Publikation, `datum`, leere Schlussabstimmungen (21.9.2026):**
[materialien/curia-publikationen-identitaet-2026-09-21.md](materialien/curia-publikationen-identitaet-2026-09-21.md) —
Regel: bei fehlendem `PublicationYear`/`PublicationNumber` ist `ReferenceText` das **Identitäts-
merkmal**; der Dedupe-Schlüssel ohne ihn liess in 01.023 elf von 32 amtlichen Einträgen wegfallen
(BGG, SGG, VGG u. a.), FR gleich, IT 30→20. Echte Duplikate existieren daneben (08.053: 12 Zeilen,
8 distinkt), der Dedupe bleibt darum — mit Tiebreaker `text`→`art` gegen Reihenfolge-Zufall (§2).
Dazu zwei Beschriftungs-Regeln: `publikationen[].datum` ist Fedlex `jolux:dateDocument`, **nicht**
das BBl-Erscheinungsdatum (nur bei «Beratungsgegenstand / Entwurf», bis −74 Tage), und leeres
`schlussabstimmungen[]` heisst vor der Wintersession 2003 «keine Einzelstimmen-Daten», in neun
Fällen danach aber wirklich «keine Schlussabstimmung». Tor `check:entstehung` (Kreuzprobe gegen
die unabhängig gezählten distinkten Objective-Zeilen). Gegenprüfung läuft; fachliche Abnahme David offen.

**Änderungshistorie / Amtliche Sammlung (Fedlex-Portfolio Paket 5, W2·6-REV):** [normtext/revisionen-2026-07-10.md](normtext/revisionen-2026-07-10.md) —
je Bund-Volltext-Erlass eine «Änderungen / Revisionen»-Timeline (3108 AS/RO-Änderungs-Einträge über
218 Erlasse; SPARQL Pfad (b) über die SR-Taxonomie). RO-Fundstelle aus der oc-URI abgeleitet (100 %),
Botschafts-Join über `ocUris` (477), `nichtKonsolidiert`-Marker (Finding 4), Sammelerlass-Cross-Check
gegen Pfad (a) ab 2000 (1942 Marker). Sidecar `public/normtext/revisionen/<KEY>.json` (Übergangslösung
bis E1→`erlass_fassungen`); im Norm-Kontext-Bus «Änderungen / Revisionen» neben der Entstehungsgeschichte
(Bridge B1). Tore `check:revisionen`(-netz). Gegenprüfung bestanden; fachliche Abnahme David offen.

**Artikel-Revisions-Extrakt — Fussnoten-Formen-Zensus (W2·5i H1, Befund-Fix):** [normtext/artikel-revisionen-fussnotenformen-2026-07-26.md](normtext/artikel-revisionen-fussnotenformen-2026-07-26.md) —
welche amtlichen Formulierungen einer datierten Textänderung `revisionen-extrakt.ts` erkennt
(«in Kraft seit» · «mit Wirkung seit» · neu «in Kraft vom X bis zum Y» inkl. Jahr-Ellipse; 59 Fussnoten,
41 Artikel-Deltas) + Fremd-Adressierungs-Wächter «Art. \<Nr\> in Kraft …» (2 Korpus-Fälle) + bezifferte
Rest-Familie NICHT erkannter Formen (46 Artikel, 11 Varianten — Folge-Schritt über ROADMAP-Eingang).
Gegenprüfung Opus 2 Runden (R1 widerlegt → Wächter, R2 auf nachgebessertem Diff); Abnahme David offen.

**Vernehmlassungen / Gesetzgebung in Arbeit (Fedlex-Portfolio Paket 3, W3·11):** [materialien/vernehmlassungen-2026-07-10.md](materialien/vernehmlassungen-2026-07-10.md) —
**POC MACHBAR** (deterministisch · Füllraten status/Titel 100 % / Frist 96,6 % · amtlich · Join 173/218).
822 Vernehmlassungsverfahren über die 218 Bund-Volltext-Erlasse, automatisch über den Fedlex-
Gesetzgebungs-Graphen (**direkte** `foreseenImpactToLegalResource`-Kante — einfacher als Paket 2).
Behörde `BUND`, Doktyp `vernehmlassung`, `nur-live-link`; amtliches Status-Vokabular 0–6 (laufend/
abgeschlossen/zurückgezogen), Frist aus `ConsultationPhase`; Reichweite ~2000–2026. Im Norm-Kontext-Bus
«Gesetzgebung in Arbeit» (laufend zuerst, «läuft bis {Frist}»). Currency: Netz-Tor
`check:vernehmlassungen-netz` + Offline-Assertion `laufend && fristEnde<heute ⇒ rot`. Maschinell
zugeordnet (grob bei Mantelvorlagen, §8); fachliche Abnahme David offen.

**Entstehung am Artikel — Recherche-Runde 15.9.2026 (Stufe 4):** [materialien/entstehung-2026-09-15/README.md](materialien/entstehung-2026-09-15/README.md) —
drei Recherchen (read-only, Live-Abrufe 15.9.2026) zur Datenherkunft für
Botschaftstext je Artikel, Parlament je Artikel und Ursprung: Fedlex-
Manifestationen 407/407 (PDF/A alle born-digital, XML/HTML erst ab 2022: 43,
DOCX 2020/21: 54 mit Stil `TitelArtikelKomm`; Erläuterungs-Kapitel 43/43 als
`<level>`, Artikel-Ebene strukturell 7/43); Curia Vista `Vote.Subject` liefert
NR-Abstimmungen je Artikel strukturiert, Bulletin-Voten→Artikel nur ~81 %/50 %
(maschinell), Ursprung = Vehikel deterministisch, Auslöser nur Prosa;
Verfahrensmodell Bund (Art. 141 Abs. 2 ParlG wörtlich, Fedlex-Code-Lücken).
Regel deterministisch je Stufe in Fahrplan §12. Pflege: Drift über
`Last-Modified`/`Modified`. Maschinell erhoben; fachliche Abnahme David offen.

**Entstehung am Artikel — Recherche-Runde 6.9.2026:** [materialien/entstehung-2026-09-06/README.md](materialien/entstehung-2026-09-06/README.md) —
sieben Sonnet-Recherchen (read-only, Live-Abrufe 6.9.2026) zu Materialien-
Verzahnung und Gesetzgebungsprozess: Fedlex-Wissensgraph `type-projet`-Kette
(7299 Botschaften / 4931 Beschlüsse / 1868 Referendumsfristen / 629
Abstimmungstermine, SPARQL); BBl-Volltext mit `art_`-Ankern nur ab 2022 (44/
58/77/80/41 Treffer je Jahrgang 2022–2026); Curia Vista OData ohne Schlüssel
(49 Entitäten, `Objective`/`Voting`/`Resolution` als Join-Pfad, harte
1000er-Serverpaginierung). Kantonal: BS `data.bs.ch` CC BY 4.0 reichhaltig,
ZH nur CMI-Rohfeed ohne Materialien-Link. Bund-Wegleitungen: Top-8 BSV-Werke
priorisiert vor den übrigen Ämtern. Vorbild buzer.de-Muster (Point-in-Time-URL
je Paragraphenfassung, Absatz-Synopse). Maschinell recherchiert; fachliche
Abnahme David offen.

**Quelllücken der amtlichen Konsolidierung — Messung 12.9.2026:** [materialien/entstehung-2026-09-06/E5-quellluecken-2026-09-12.md](materialien/entstehung-2026-09-06/E5-quellluecken-2026-09-12.md) —
Quelle Fedlex-Filestore (AKN-XML, DE), Abruf 12.9.2026, vier Manifestationen von
CHEMRRV `cc/2005/478` mit Bytes und sha belegt. Befund: die Stände 2022-05-01 und
2022-10-01 führen nur `art_1`–`art_3` als `<article>`, die Artikel 3a–24 stehen in
derselben Datei als `<mod>`/`<quotedStructure>` eines Änderungsanhangs — eine
Konversions-Panne, keine Aufhebung. Regel deterministisch: eId fehlt in einem
lückenlosen Lauf von 1 … 3 Ständen und kehrt byte-gleich zurück ⇒ `zustand:
'quelle_unvollstaendig'` statt «entfallen» + «neu eingefügt», ohne gespeicherten
Wortlaut. Stichprobe n=22 (Vollerhebung) 22/22 wortgleich. Geltung: Bund, Fenster ab
1.1.2021; Ausnahme EPV `art_64_a_64_b` (Lücke 17 Stände, Deckel greift, folgenlos).
Pflegebedarf: Zahl der Lücken steht in der Schluss-Zeile von `check:entstehung`.
Abnahme David offen.

**Synopse alt/neu — Vor-Messung E5.0 11.9.2026:** [materialien/entstehung-2026-09-06/E5-0-vormessung.md](materialien/entstehung-2026-09-06/E5-0-vormessung.md) —
Quelle Fedlex SPARQL + Filestore (AKN-XML, DE), Abruf 11.9.2026, 8 Erlasse
disjunkt zu R2 (ZGB/STPO/STGB/SCHKG/VTS/AVIV/NHG/UVPV), 68 Konsolidierungs-
Schritte, 31 839 stabile eId-Vergleiche. Regel deterministisch: Diff-Einheit
ist die amtliche eId, Normalisierungs-Profil `entstehung-norm/1` (nie editieren,
Verbesserung = neue Nummer daneben) senkt die Roh-Falschtrefferquote von 16,9 %
auf 1,7 %; Stichprobe n=15 gegen die amtlichen Stände 15/15 echt, davon 11 mit
Fussnoten-Beleg. **Nachtrag 11.9.2026 (§6b):** Profil `/1` fiel in der
Gegenprüfung durch (Prüfer-Stichprobe n=13 nur auf `ohne_ereignis`: 11/13 =
84,6 %) an zwei Konversions-Klassen (wandernde Elementgrenze im Ordnungs-Suffix;
Satz+Liste wird Einleitung+Liste). Gelandet ist `entstehung-norm/2`; neue,
disjunkte Stichprobe n=13 über 13 Erlasse: 13/13 echt. Volumen nur-Alt korpusweit ≈ 3,1 MB über 1006 Schritte in 187
Erlassen (Deckel 8 MB / 2 MB je Erlass). Geltung: Bund, Fenster ab Stand
1.1.2021 — davor gibt es amtlich nur `doc`/`pdf-a`. Pflegebedarf: Nachlauf je
neuer Konsolidierung; Drift-Wächter in `check:entstehung`. Maschinell gemessen;
fachliche Abnahme David offen. **Nachtrag 11.9.2026 (§8, Befund Bauer #796):**
Generator und Leser trugen bis `/2` je eine eigene Normalisierung — 70 Alt-Blöcke
galten dem Leser als «kein Unterschied» trotz gebuchtem «geändert». Profil
`entstehung-norm/3`: EINE Vergleichsform (`src/lib/entstehung/normalisierung.ts`)
für beide Seiten, `flachText`-Scope auf `<paragraph>` beschränkt, Fussnoten- und
Nachlisten-Text aus dem Vergleich genommen. 70 → 10 Leer-Diff-Verletzungen
(Rest: andere Fehlerklasse, Token-Kontinuität, dokumentiert im Nachtrag). Regel
deterministisch (zweiter Lauf byte-gleich); fachliche Abnahme David offen.
**Nachtrag 12.9.2026 (§9, Gegenprüfung PR #798): Profil `entstehung-norm/4`.**
`/3` hatte einen SPEICHERverlust (Fliesstext nach `</blockList>`, 651 Absätze je
Stand) mit einer Vergleichsregel zugedeckt und damit vier echte Änderungen von
KLV Art. 12 Bst. e gelöscht; ausserdem machte es 35 reine Randtitel-Änderungen
unsichtbar (BVG 33b «ordentliches Rentenalter» → «Referenzalter»). `/4`
speichert Vor-/Zwischen-/Nachlauftext, vergleicht und speichert die
Sachüberschrift (`ueberschriftNeu`, 522 Blöcke, 31 davon ohne
Wortlaut-Unterschied) und prüft `art: 'entfallen'` im Leer-Diff-Wächter mit.
4651 Alt-Blöcke, 0 offene Verletzungen, 11 befristete Ausnahmen (CHEMRRV: die
Konsolidierung vom 2022-05-01 führt nur 3 statt 25 `<article>`; AVIV 57b:
Token-Kontinuität). **Nachtrag 12.9.2026 (§10, Auflage A5 der Neuprüfung):** `/4` buchte
zehn PHANTOM-Änderungen (amtlich wortgleich, nur die Elementgrenzen wandern — MWSTG 97,
KLV 7, GEBV_SchKG 9, VRV 67, FDV 36 ×2, HMG 9/67, STHG 25, BVV 2 55); Wurzeln: das
Absatz-Etikett kam aus einem Listenpunkt, und das Ordnungs-Suffix «bis»/«quater» wandert
zwischen `<num>` und Textanfang. Neu: `absatzKopf()`, Etikett im Vergleich genau einmal je
Absatz, Satzzeichen-Regel (a2), und als zweiter Tor-Ast `phantomVerletzungen()`.
Vollerhebung: 10 Blöcke weg, 0 neu, 330 Etiketten korrigiert; Stand 4641 Alt-Blöcke.
Regel deterministisch; fachliche Abnahme David offen.

## register/ — fortlaufend gepflegt

| Dokument | Inhalt |
|---|---|
| [quellen-register.md](register/quellen-register.md) | Verifizierte Fedlex-Quellen (ELI, Konsolidierung, geprüfte Anker, Filestore-Muster) |
| [suche-edge-nullprobe-2026-08-31.md](register/suche-edge-nullprobe-2026-08-31.md) | **QS-BASIS (d) K0 — Nullprobe Suche-Edge-Umzug Kanton** (31.8.2026): Kennzahlen VOR dem Umbau. Statischer Index 54 446 Artikel / 9.43 MiB gzip, davon **Kanton 4.26 MiB = 45.2 %** (die Zahl, an der eine K3-Scharfschaltung hängt); Recall-Felder `m/n/g/tb/f` = 21.5 % des Rohtextes. DB trägt Kanton vollständig (56 113 `fts_artikel`-Zeilen), HOT-Replika 665.46/1024 MiB. **Gemessene Lücke:** `fts_artikel` indexiert nur `bloeckeText` → Query «Miete» findet OR 253/267 am Edge NICHT (0 Treffer), während 10 kantonale Gebührenerlasse die Liste anführen; Struktur-Sidecar liegt mit 95.97 % Abdeckung bereits als `dokument`-Blob in der DB. Suchgüte-Baseline `eval:suche` gesamt R@1 0.623 / NDCG@10 0.668. Divergenz Index↔DB 1667 Artikel (Stubs ohne Volltext) beziffert | Messung, Status entwurf |
| [BS-RECHTSPRECHUNG-QUELLE-2026-07.md](register/BS-RECHTSPRECHUNG-QUELLE-2026-07.md) | **W2·6-BS** Amtliches BS-Rechtsprechungs-Portal (Findinfo/Omnis): URL-Templates + Fallen (GET-only, Template-Pflicht, Paging-Wrap, Windows-1252), Scope 2022+ (3'765 Dok., 42 datumlos), Count-Anker je Jahr, Delta-/Takedown-Regeln, Zahlenreport Vollimport 19.7.2026 |
| [p3-drop-klassen-inventar-2026-07-05.md](register/p3-drop-klassen-inventar-2026-07-05.md) | **W2·5b P3** Korpusweite `<p>`-Klassen-Drop-Inventur (218 Bund-Erlasse): welche `<p class>` der Extraktor still verwarf. Verdikt je Klasse (extrahieren: `man-template-tab-krpr`/OR 361-362 + bare `referenz`→grundlage; bewusst ignorieren: inkrafttreten/utit-Titel; deferiert: absatz-pt-Varianten/ParlG-Eid). Tor `check:p-klassen` friert das Vokabular ein |
| [poc-linkedom-tiefenzaehler-2026-07-05.md](register/poc-linkedom-tiefenzaehler-2026-07-05.md) | **W2·5b** linkedom-POC gegen die Regex-Tiefenzähler `findeDlEnde`/`findeDdEnde` (44 740 `<dl>`/`<dd>`-Grenzen, 0 Abweichungen) → Verdikt: Regex DOM-äquivalent, KEINE Migration (§7-Messung) |
| [e6a-quell-inventar-2026-07-03.md](register/e6a-quell-inventar-2026-07-03.md) | E6a-Quell-Inventar Verwaltungsverordnungen (9 Behörden, Probe-Fetches, Ranking: ESTV-MWST-HTML > ESTV-KS-PDF > BSV; VPB tot, Fallen dokumentiert) |
| [e4-lokal-2026-07-03.md](register/e4-lokal-2026-07-03.md) | **QS-DATA E4-Lokal** (Zitat-Graph → `norm_rangliste` + Oracle-Tor): Q4-law-code-Kanonisierung (DE/FR/IT→erlasse.key, SR-belegt, Abdeckung 35,2 %→78,4 %) · materialisierte topische In-degree (1 387 680 Zeilen, max gewicht 12 413 = BGE 133 II 249 @ BGG/106, idempotent) · **Oracle-Tor GRÜN 0 UNERKLÄRT** (462 identisch/284 erhöht/178 vintage-absent/7 erklärt-delta; Snapshot max BGE-Band 151) |
| [fedlex-gap-report-2026-07-02.md](register/fedlex-gap-report-2026-07-02.md) | **Fedlex Coverage-/Currency-Gap-Report Bund** (neu 2.7.2026, SPARQL-nativ): alle 229 Bund-Erlasse gegen `jolux:dateApplicability` — Coverage vollständig (218 Volltext, 11 bewusste Stubs); **20 stale** (neuere geltende Fassung, Juli-2026-Zyklus), davon **6 ungepinnte blinde Flecken** (AsylV 1/2/3, ArGV 2, EMRK, NYÜ — Cron `check:fedlex-versionen` sieht sie nicht) + 14 gepinnt-überholt; 56 angekündigte künftige Fassungen (Re-Extraktions-Horizont) + 11 Volltexte ohne Pin. Anlass: Analyse Dritt-Repo `droid-f/fedlex` (CC BY-NC-SA, nicht als Quelle genutzt) | Momentaufnahme; laufende Wahrheit bleibt `check:fedlex-versionen` |
| [fedlex-currency-2026-07-05.md](register/fedlex-currency-2026-07-05.md) | **Fedlex-Currency-Lauf 5.7.2026 — Paket 1 · P1-a + P1-b** (QS-CURRENCY): 18 überholte Bund-Snapshots + 2 PDF-Embeds (EMRK/NYÜ) auf die geltende Fassung; html-N SPARQL-kanonisch via `isExemplifiedBy` (klv/vrv=8, ssv=14); Artikel-Diff +85, 9 eId-Renames 1:1, 0 Verlust; Regex-Fix + Coverage-Assertion + PDF-Embed-Monitoring; `check:fedlex-versionen` Exit 0. Gegenprüfung bestanden. | Ausführungsbeleg §11 |
| [fedlex-staatsvertraege-2026-07-10.md](register/fedlex-staatsvertraege-2026-07-10.md) | **Fedlex-Portfolio Paket 4 — kuratierte Staatsverträge SR 0.*** (10.7.2026, W2·6, letztes Paket): 9 Verträge als Volltext (HKsÜ 96, HUVÜ 1973, EAUe, CMR, Montreal, RBÜ, UNO-BRK, Istanbul, Apostille) über die konsolidierte `eli/cc`-Pipeline (kein `eli/treaty`-Extraktor, kein neues Format). POC-Befund: Graph exponiert **keine** strukturierte Parteien-/Ratifikations-Kante → «Geltungsbereich»-Anhang verbatim als `annex_*`; html-0 bei 5/9 stale → kanonische html-N via `isExemplifiedBy` gepinnt; Apostille geltend 2024-09-04 (nicht 2016). 5 Kandidaten bewusst verworfen (ESÜ/WÜD/WÜK/DBA-DE/EPÜ). Gegenprüfung bestanden. | Ausführungsbeleg §11 |
| [fedlex-pin-kanonik-2026-07-11.md](register/fedlex-pin-kanonik-2026-07-11.md) | **Fedlex-Pin-Kanonik — Paket 1 · P1-a/b Querschnitts-Wurzel** (11.7.2026, W2·6): `fedlex-cache.sh` dockte bei **166/227** Pins an die nicht-kanonische Alias-URL (`…-de-html.html`) an → Alt-Generations-Dumps + Soft-404-Casemates-Shells. Alle html-N auf die registrierte `isExemplifiedBy`-Manifestation gehoben (`fedlex-manifest.ts`/`fedlex-repin-kanonik.ts`); **104 Snapshots + 130 Struktur-Sidecars** aus der kanonischen Fassung regeneriert (kein Parser-Eingriff → alle Diffs AMTLICH; OR-Kronjuwel-Korruption «2 e 3»→«2 und 3» geheilt; kein `art_`-Verlust). Neuer **Kanonik-Arbiter** in `check:fedlex-versionen` (html-N ≠ isExemplifiedBy ⇒ Exit 1) + cache.sh-Shell/Anker-Sonde + struktur-run «0 übersprungen». Gegenprüfung bestanden. | Ausführungsbeleg §11 |
| [fedlex-kernerlasse-2026-09-14.md](register/fedlex-kernerlasse-2026-09-14.md) | **Kernerlasse-Lücken Bund: EMRK, EÖBV, AVG** (14.9.2026, `QS-KORPUS`, Phase 1): die drei fehlenden Kernerlasse als Fedlex-Snapshots — EMRK SR 0.101 (`cc/1974/2151_2151_2151`, Kons. 2022-09-16, html-9, 59 Art.), EÖBV SR 211.435.1 (`cc/2018/29`, 2024-01-01, html-5, 28 Art. + 1 Anhang), AVG SR 823.11 (`cc/1991/392_392_392`, 2026-01-01, html-0, 49 Art.). **EMRK wechselt `pdf-embed` → `snapshot`**: Fedlex führt den Konsolidierungstext seit 2012-02-23 als HTML; die pdf-embed-Begründung von 2026-06-25 galt für den damaligen Pin 20050323 (dort ist `pdf-a` die einzige deutsche Manifestation) und wird ergänzt, nicht nachgeführt. **§17-Befund:** `fedlex:eli` löst zwei Klassen falsch auf — `LIMIT 200` schneidet die Datumsliste ab (EMRK: 1990 statt 2022) und `bindings[0].cc` greift bei mehreren Abstracts den **aufgehobenen Vorgänger** (EÖBV→NAG 1891, AVG→AVG 1951); Wurzel-Fix offen. Stichprobe 18 Artikel / 97 Textteile zeichengleich (Wortgrenze). | Ausführungsbeleg §11 |
| [bmv-totalrevision-2026-09-12.md](register/bmv-totalrevision-2026-09-12.md) | **BMV SR 412.103.1 — Totalrevision im Korpus** (12.9.2026, `W2·18-FEHLERBUCH`): die seit 1.3.2026 geltende Verordnung vom 13. Juni 2025 (ELI `cc/2025/408`, html-N=0 kanonisch, 36 Artikel) als **neuer Register-Key `BMV_2025`** aufgenommen; der aufgehobene Text von 2009 bleibt unter `BMV` (Rang ans Ende, roter «aufgehoben»-Marker). Amtsbeleg: Taxonomie 6599 `skos:notation` 412.103.1 + Art. 34/36 des Erlasses selbst. Verifikation: deterministischer Volltext-Diff 36/36 ohne Abweichung, Stichprobe 10/10. **Folgeregel:** die SR-Nummer ist kein eindeutiger Schlüssel — Rot-Beweis + Wurzelfix an `lesePinsMitSr()` (SR-Map, letzter Pin gewann). Abnahme durch David offen | Ausführungsbeleg §11 / Quellen-Befund §7 |
| [frit-drift-2026-08-15.md](register/frit-drift-2026-08-15.md) | **FR/IT-Sprach-Drift der Fedlex-eIds** (15.8.2026, `QS-FRIT-DRIFT`): Erstlauf des Sprachvergleichs über 30 Kern-Erlasse — 27 exakt gleich, **3 abweichend**: OR (fr: `art_219` fehlt/`art_221` doppelt; it: `art_219_a` fehlt/`art_219` doppelt), PatG (fr+it: `art_86_l` fehlt/`art_86_k` doppelt), BewG (fr: `disp_u2..4` fehlen). Mechanismus: ein **neu eingeschobener Artikel** bekommt in FR/IT keinen eigenen eId, sondern den des Vorgängers → Artikel-Text gegenüber eId **um eins versetzt**. Regel: **`eId` ist kein sprachübergreifender Join-Schlüssel** (Konsequenz für `W2·5g-ZEIT`: über `<num>` abgleichen); Residue unterhalb der Artikel-Ebene ist amtlich gewollt (OR Art. 1033). Fundstellen als `ANERKANNTE_DRIFT` deklariert und live überwacht. | Quellen-Befund §11/§7 |
| [parameter-verfall.md](register/parameter-verfall.md) | Datierte Parameter mit Prüfrhythmus — u. a. **SG GKV endet 30.6.2026**, GR HV/BE EAV 31.12.2026, NE-Umzug Sommer 2026, JU-Punktwert, BE-Formularpflicht 1.11.2026, Referenzzins; **neu 7.6.2026:** HReg-Gebühren · Fremdwährungsliste · Emissionsabgabe · MWST-Schwellen · Notariats-Listen (UR/AI/BL!) · Muster-Suiten |
| [engine-map.md](register/engine-map.md) | **Engine-Map** (neu 7.6.2026): jedes Code-Modul → tragende Dossiers/Stammdaten → Bau-/Abnahme-Status — der Rückweg zu §11 und die Checkliste je Abnahme |
| [property-invarianten-2026-08-15.md](register/property-invarianten-2026-08-15.md) | **Invarianten-Katalog der Rechen-Engines** (neu 15.8.2026, QS-CODE-PROP): je Engine die Eigenschaften, die für JEDE Eingabe gelten — Determinismus (§2) · Ordnung (Fristende nie vor Beginn) · Monotonie · Grenzen/Rundung · Regime-Trennung (§4) —, jede mit Norm-/Code-Herleitung und Status (technisch bewiesen vs. **fachlich vorzulegen**). Umgesetzt in 12 `src/tests/*.property.test.ts` mit fast-check (fester Seed, 89/89 Rot-Beweis nach §6.7, 7,6 s). Fund: Art. 63 SchKG ankert die Verlängerung am ENDE der Betreibungsferien → Fristende NICHT monoton (norm-getreu, Pin SF-8); zwei Punkte warten auf Davids fachlichen Entscheid (SF-F1/SF-F2) |
| [he-entity-korrekturen-2026-07-03.md](register/he-entity-korrekturen-2026-07-03.md) | **`he`-Entity-Umstellung Divergenz-Analyse** (neu 3.7.2026, Nulltarif-Paket): `html-entities.ts` Hand-Tabelle (75) → `he.decode` (WHATWG 2231); vollständige Divergenz-Tabelle (4: `&nbsp;`/`&mu;` Sonderfälle behalten, `&ldquo;`/`&rdquo;` ASCII-Abflachung korrigiert), Sandbox-Doppellauf Bund 218 Erlasse aus gepinnten Caches **0-Byte-Diff** (golden-neutral), Korpus-Impact der Korrektur heute NULL |
| [B2-POC-2026-07-03.md](register/B2-POC-2026-07-03.md) | **B2-POC DuckDB vs. TS für den E3-Ingest-Pfad** (neu 3.7.2026, QS-DATA §6.2): voll-massstäbliche Messung an voilaj `e2a0b95b…` (195 342 Bundes-Entscheide + 8,7M/11,9M Kanten), je Arm 2 Läufe — **VERDIKT TS** nach der fixierten 3×-Regel (Bulk 1,55× / Pipeline 1,92×; RSS 2,1 vs. 5,5 GB); Auflösungsquoten-Baseline 0,823; NBSP-Divergenz JS-`\s`↔RE2; E3-Mechanik-Empfehlung (Row-Group-Batches, PRAGMAs, key_map-Resolve) |
| [e3-lokal-2026-07-03.md](register/e3-lokal-2026-07-03.md) | **E3-Lokal BGer-Massen-Import** (neu 3.7.2026, QS-DATA §5 E3, 26×-Slot): produktiver Bau von `daten/masse.db` (gitignored, ~5,8 GB) — entscheide **195 342** · zitat_kanten **8 529 050** (UNIQUE-Δ 168 014 = POC) · norm_referenzen **10 031 306**; Auflösungsquote **0,8245** (= POC 0,823, je match_type ausgewiesen); 2 Voll-Läufe → identisches Dump-Manifest (Weiche C); §7 non-null, `quelle_url` = bger.ch-`source_url` verbatim (100 %). Amtliche Gegenprüfung DOPPELT (Autor-5er-Stichprobe + unabhängiger Opus-Durchgang mit 400/400 Kanten-Proben, BESTANDEN): fand+fixte doppeltes «BGE BGE …» (~98 % BGE) + fabrizierte Zitierform bei 474 Docket-Müll-bge (→ NULL, §8) + dokumentierte voilaj-datum-Quirks (194 NULL, ~61 % Bandjahr-Platzhalter). VPS-Upload-Checkliste (cold-FTS/Read-API/Long-Tail = Serving-Schritt) |
| [stabilitaets-report-2026-07-03.md](register/stabilitaets-report-2026-07-03.md) | **QS-DATA E1 Artikel-Stabilitäts-Basis** (neu 3.7.2026, read-only, `npm run datenhaltung:stabilitaet`): Struktur-Basis der 218 Bund-Erlasse (24858 art_id) aus dem Zielschema; ehrliche Grenze §8 — echter Fassungs-Diff (stabil/verändert/verschwunden) erst ab >1 Fassung je Erlass messbar |
| [gerichtskosten-tarife-kantone.md](register/gerichtskosten-tarife-kantone.md) | **Kantonale Gerichtskosten-Tarife** (neu 14.6.2026): alle 26 Kantone Entscheidgebühr Zivil erstinstanzlich, amtlich doppelt verifiziert — TarifRegel + Link + Erlass + Stand + kostenlose-Verfahren-Hinweis (Art. 113/114 ZPO); Vorlage für `src/data/tarif/gerichtskosten.ts` |
| [parteientschaedigung-tarife-kantone.md](register/parteientschaedigung-tarife-kantone.md) | **Kantonale Parteientschädigung/Anwaltshonorar** (neu 14.6.2026): alle 26 Kantone, amtlich doppelt verifiziert (+ Re-Verif AG/SZ/GL/SH/GR) — TarifRegel + Link + Erlass + Stand; Querschnitt Art. 113 Abs. 1 ZPO (keine Parteientschädigung in Schlichtung) |
| [bemessungskriterien-tarife-kantone.md](register/bemessungskriterien-tarife-kantone.md) | **Bemessungskriterien der Prozesskosten-Tarife** (neu 1.7.2026, I4): je Kanton GK + PE die allgemeine Bemessungsnorm (wonach die Behörde innerhalb des Rahmens festsetzt) mit Kriterienliste + wörtlichem Beleg + confidence; Vorlage für `kriterien`/`kriterienNorm` auf `KantonalerTarif`. Strukturbefund: zitierte Norm = meist nur Streitwert-Staffel, Kriterien in allgemeiner Bestimmung. GR gk = keine Kriteriennorm; 4 Titel-Korrekturen an Altdaten |
| [kosten-modifikatoren-kantone.md](register/kosten-modifikatoren-kantone.md) | **Kosten-Modifikatoren** (neu 14.6.2026, Workflow wbqdyap3x): je Kanton Faktoren für Schlichtung · vereinfacht · summarisch · Rechtsmittel (GK + Parteientschädigung), je mit Norm; doppelt verifiziert. Vorlage Cockpit-Modifikatoren |
| [sonderkonstellationen-kantone.md](register/sonderkonstellationen-kantone.md) | **Kantonale Sonderkonstellationen** (neu 14.–15.6.2026, Workflow wi80t134r): 877 kostenrelevante Sonderregeln über 26 Kantone (Erhöhung/Reduktion, einkommensabhängig, Materie-Sondertarife, Streitgenossen, MwSt/Auslagen), je mit §/Artikel; doppelt verifiziert |
| [gegenpruefung-register.md](register/gegenpruefung-register.md) | **Gegenprüfungs-Register** (neu 1.7.2026, QS-GP): protokollierte adversariale Zweitdurchgänge je Snapshot/Engine — Datum · Diff-Hash · Verdikt · Quelle-Pin · Beleg; automatisch von `npm run gegenpruefung:ok` gepflegt, Türsteher des Tors `check:gegenpruefung` (in `npm run gate`). Design: `docs/superpowers/specs/2026-07-01-gegenpruefung-gate-design.md` |
| [QS-GP-KAMPAGNE-2026-07-02.md](register/QS-GP-KAMPAGNE-2026-07-02.md) | **QS-GP-Kampagne Alt-Rechen-Engines** (2.7.2026, Baustein d): rückwirkende adversariale Gegenprüfung aller Alt-Rechen-Engines gegen die amtliche Norm — 127 Rohbefunde/38 Dateien, ~45 Fixes angewandt (7-Verifier-Doppelcheck 45 CONFIRMED/0 REFUTED), 3 Übergriffe → §9-Backlog. Report + Outcomes + Follow-ups; Verdikte im [Gegenprüfungs-Register](register/gegenpruefung-register.md) |
| [AUDIT-TARIF-2026-06-17.md](register/AUDIT-TARIF-2026-06-17.md) | **Tarif-Rechen-Audit 17.6.2026** (aus `bibliothek/` nach `register/` verschoben, H-1): 4-Agenten-Fan-out gegen ~250 Tarif-Einträge/lokale Normtext-Snapshots, Mehrheit OK; Kategorie A = echte Wert-/Norm-Abweichungen **OFFEN (Entscheid David 17.6.2026: nur geflaggt, Fix später)**; B/C dokumentiert für späteren Durchgang. Nichts an der Rechen-`regel` geändert |
| [AUDIT-TORE-2026-07-20.md](register/AUDIT-TORE-2026-07-20.md) | **Tor-Wirksamkeits-Audit 20.7.2026** (QS-BASIS (c), Auftrag R1): welchen Toren zu trauen ist. 58 `check:*`, 36 in `check:seriell`, davon **12 im PR-Pfad** und **20 in keinem Workflow**. Jede Allowlist-Begründung mit **Sabotage-Probe** falsifiziert (Defekt einpflanzen → prüfen, ob der behauptete Ersatz-Arbiter rot wird; je byte-gleich zurückgebaut): **17 halten nicht, 2 sind keine Begründung, 1 hält** (`check:gegenpruefung`). Die 9× genannte Delegation an `fedlex-frische.yml` ist gegenstandslos — der Workflow fährt diese Tore gar nicht, lief genau **einmal** und scheiterte. Nebenbefund: `check:paritaet` prüft gegen die **eigene Ladung** (Roundtrip, kein Inhalts-Arbiter, §6 Ziff. 7 lit. a); `waechter.yml` hat 0 Läufe. Alle 20 Allowlist-Tore laufen unter `CI=1` in **10 s** grün → kein Kostenargument. `scripts/`: 211 Dateien, nur **2** wirklich unerreichbar (nicht ~99). Signal-Ertrag: alle 17 roten CI-Läufe aus **zwei** Quellen (Perf-Lighthouse 6, e2e-Shards 11), 0 aus den schnellen Toren; belegte Fänge = CLS-Serie (Linux-Font-Swap) + `check:besetzung` (11 erfundene Amtsträger:innen) — letzteres ausgerechnet ein **Allowlist-Tor**. **Kein Streich-Vorschlag** — keine Delegation bestand ihre Probe |
| [AUDIT-CLAUDE-MD-REGLEMENT-2026-08-07.md](register/AUDIT-CLAUDE-MD-REGLEMENT-2026-08-07.md) | **Reglement-Audit CLAUDE.md 7.8.2026** (Auftrag David «unbefangener Blick», Stand `3a57cd29c`, 3 unabhängige Read-only-Agenten): Reglement wirkt fast nur, wo ein § als Tor existiert — Prosa-Regeln belegt gebrochen (§6.7 sechsmal/F2a–f, §12 Doppelbau, §3 Massenverstoss), §10 = Papier ohne Anlass; **~130 tote Unternummern-Verweise** (§15.x allein 111 Fundstellen — Konkordanz im Skill `perf` fehlt; §13.x 12; §12.2 mit Anker-Kollision), Präambel-Zahl «rund 200» real ~4 000–5 500; Drift messbar (36/38 Commits wachsen, Kürzungen in 5–11 Tagen aufgeholt, §16+§17 ≈ 15 % Memo); Skill-Drift: `perf` beschreibt `check:perf-budget` fachlich falsch (korrekt in `deploy-check`), `landung`/`deploy-check`-Altstände. 8-Punkte-Massnahmen-Rangfolge im Dossier; Umsetzung = Bau-Session |
| [AUDIT-BUGS-2026-06-19.md](register/AUDIT-BUGS-2026-06-19.md) | **Bug-/Logik-Audit 19.6.2026** (aus `bibliothek/` nach `register/` verschoben, H-1): zweistufiger read-only-Review der gesamten Codebasis (~87 500 LOC), 7+8 Reviewer/Sweeps; HOCH/MITTEL-Befunde adversariell mit Repro belegt. Status je Befund im Dokument — **nicht pauschal «erledigt»**, Einzelstand nachschlagen |

## normen/ — Regelwerke (Engine-Grundlagen, Wortlaute verbatim)

| Dokument | Inhalt | Verifikation |
|---|---|---|
| [zstgv-drift-erkennung-2026-08-03.md](normen/zstgv-drift-erkennung-2026-08-03.md) | ZStGV (SR 172.042.110): ELI/Konsolidierung/kanonisches html-N + Anhang 1 Ziff. 23 («75») wörtlich belegt — und der **Befund, warum ein blosser cache.sh-Pin nicht trägt** (jeder Pflicht-Anker braucht einen Bund-Snapshot). Zwei Wege für §7-Merkmal (d), Entscheid David offen; bis dahin ist CHF 75 unüberwacht (Teilrevision in Vernehmlassung bis 15.10.2026) | Quelle live SPARQL + Filestore 3.8.2026 ✓ · Umsetzung offen |
| [zpo-zustaendigkeit-regelwerk.md](normen/zpo-zustaendigkeit-regelwerk.md) | Art. 4–46 + Systematik (Bindungsgrade, HG-Revision 2025, perpetuatio fori, Art.-63-Rettung, IPRG-Weiche) mit Engine-Hinweisen | 17/17 Wortlaut-Proben am Cache ✓ |
| [zustaendigkeit-engine-verifikation.md](normen/zustaendigkeit-engine-verifikation.md) | Deep-Research-Vollverifikation von `zustaendigkeit.ts` (37 Behauptungs-Cluster, ZPO 20250101 + BGG 20250101 + BGE 133 III 393): **0 fristen-/ergebnisverfälschende Fehler**; Befunde B-1 Art. 113 II lit. g (DSG-Schlichtung kostenlos) und B-2 Art. 6 IV lit. c (internat. HG-Weiche) am 6.6.2026 umgesetzt | Kern zweifach (25 Claims à 3-0 adversarial) · Rest einfach belegt (6.6.2026) |
| [schkg-zustaendigkeit-regelwerk.md](normen/schkg-zustaendigkeit-regelwerk.md) | Betreibungsorte 46–55, Klage-Foren + Fristen (Aberkennung 20 T., Arrest-Kaskade), Gericht vs. Aufsicht; Synthese-Tabelle | Wortlaute verbatim Stand 1.1.2025 ✓ |
| [stpo-zustaendigkeit-regelwerk.md](normen/stpo-zustaendigkeit-regelwerk.md) | Behörden 12–18, Bund-Kataloge 23/24, Gerichtsstand 31–42 (Tatort/Prioritätsprinzip), Strafbefehl/abgekürzt (Rev. 2024); Decision-Tree | 13/13 substanzielle Proben ✓ |
| [erbrecht-regelwerk.md](normen/erbrecht-regelwerk.md) | 3 Teile: Erbfolge+Pflichtteile (Rev. 2023, Quoten-Synthesen beide Rechtsstände) · Verfügungen+Klagen (Fristen 521/533) · Erbgang+Teilung (22 Fristen, Ausgleichung 626 ff.); **Engine-Audits: erbteilung.ts + testament.ts bestanden** | 16/16 Wortlaut-Proben ✓ |
| [normtexte-zpo-zustaendigkeit.md](normen/normtexte-zpo-zustaendigkeit.md) | Wortlaut der 25 Schlüsselartikel (Erstbestand der Engine) | maschinell extrahiert |
| [lexwork-kantone-poc-19-verdikt.md](normen/lexwork-kantone-poc-19-verdikt.md) | **OpenCaseLaw Baustein 1** — empirisches 19-Kantone-LexWork-Verdikt (live 11.7.2026): 18/19 voll nutzbar, GL teilweise (Migration `gesetze.gl.ch`, `xhtml_tol`-Endpunkt tot → Currency-Befund); Kernbefund «Baustein 1 bereits gebaut+live» (Adapter/Discovery/1232 Snapshots/`check:normtext-netz`), kein Neubau; Gegenprüfung SO/AR-future/BS-abrogated bestanden | ZWEIFACH GEPRÜFT (11.7.2026) · Abnahme David offen |
| [fedlex-pin-nachverifikation-2026-06.md](normen/fedlex-pin-nachverifikation-2026-06.md) | §7-Nachverifikation der 5 überholten Pins (SchKG/StPO/VwVG/VMWG/BGG: Wortlaut-Diffs alt↔neu, Auslöser-Erlasse, Engine-Folgen — VMWG-19a-Auflösung!) + Voraus-Check StGB 12.6./ZGB+ZPO 1.7.2026 | zweifach (Diff-Agents + Nachextraktion) · Abnahme David offen |
| [zpo-fristen-bk-abgleich.md](normen/zpo-fristen-bk-abgleich.md) | Abgleich BK Art. 142–147 ZPO (Privatquelle) gegen `zpoFristen.ts`/`fristenEngine.ts`: 31 Regeln, 29 korrekt (19 empirische Sonden) — B-1 MITTEL Mindermeinungs-Modus verliert Stillstandsverlängerung am Stillstands-Folgetag · B-2/B-3 NIEDRIG | ERSTRECHERCHE (10.6.2026) · Befunde offen für David |
| [arbeitsrecht-shk-abgleich.md](normen/arbeitsrecht-shk-abgleich.md) | Abgleich SHK Art. 324a/b, 335c, 336c OR (Privatquelle) gegen `lohnfortzahlung.ts`/`kuendigungsfrist.ts`/`sperrfristen.ts`: 66 Regeln, 58 korrekt — **Skalen BS/BE/ZH byte-genau an SECO-Tabelle belegt**; B1 HOCH 335c III Vaterschafts-Resttage vom Monatsende-Rounding verschluckt · B2 HOCH 336c erneuter Unterbruch ab Dienstjahres-Jahrestag (BGE 133 III 517, 2. Konstellation) fehlt · 4 NIEDRIG | ERSTRECHERCHE (10.6.2026) · ALLE Befunde B1–B6 umgesetzt 10.6.2026 (Ja David) |
| [verzugszins-praejudizien-abgleich.md](normen/verzugszins-praejudizien-abgleich.md) | Abgleich Präjudizienbuch OR Art. 104 (11. Aufl. 2025, Privatquelle) gegen `verzugszins.ts`: 15 Komplexe, 10 korrekt, kein Rechenfehler im Hauptpfad — 2 MITTEL (kaufm. Satz ≤ 5 % ohne Warnung · Kumulationsverbot Schadens-/Verzugszins fehlt als Hinweis) · 2 NIEDRIG · §7-Abweichung Verfalltag (Buch: 108 Ziff. 1, Engine: 102 II — Engine gewinnt am Normtext) | ERSTRECHERCHE (10.6.2026) |
| [feiertage-kantone-bj.md](normen/feiertage-kantone-bj.md) | Feiertags-Matrix 26 Kantone (BJ-Verzeichnis SR 0.221.122.3, lit. a = lit. b) inkl. bedingter Tage (NE/UR/AR/AI-Fussnoten), Näfelser-Fahrt-Karwoche-Regel, offengelegte Annahmen | 26/26 Sektionen zweifach geprüft (Agent + Vollabgleich am PDF) ✓ |
| [hist-ansicht-h0-trennbarkeit.md](normen/hist-ansicht-h0-trennbarkeit.md) | **H0-Verdikt W2·5i (25.7.2026): BESTANDEN** — 37'849 Korpus-Fussnoten deterministisch klassifiziert (AENDERUNG 67 % · VERWEIS 27 % · GRAUZONE ~1–3 % · ZITAT 1.7 % · UNKLAR 2.8 %); Sicherheitsrichtung Substanz→ausgeblendet empirisch 0.008–0.04 % (Stichprobe n=300 gelabelt + Vollscan aller 25'367); Kanton ≠ Bund (11 % vs. 78 % Historie); H1-Auflagen 1–5. **Ziff. 7 = H1-Nachtrag (26.7.2026):** Regeln in die Generator-Schicht gehoben (Sidecar-Feld `kl`), Auflage 2 umgesetzt (13 Fussnoten verlassen AENDERUNG, alle kantonal → 25'354), NUR Bund regeneriert (227 Sidecars, 31'786 `kl`, Additivität bewiesen). **Ziff. 8 = adversariale Gegenprüfung (26.7.2026), Verdikt bestanden, 6 Befunde umgesetzt:** Befristungen («gilt bis», «in Kraft vom … bis») und «Laut Ziff.»-Anordnungen sind NICHT ausblendbar → 62× A→G, Bund A 24'693→24'631 / G 292→354; §2-Entscheid: auch ABGELAUFENE Befristungen → G (kein Datumsvergleich in der Regel). **Ziff. 7.4 nachgezogen (S1-Nachzug 17.8.2026):** der Schalter ist zweiwertig (dritte Ansicht «als Chronologie» gestrichen, David F1) und hat DREI Träger statt zwei — neu `[data-hist-slot]` (die «Fassung»-Overline am Artikelfuss, Befund K4). Folgeauflage §8: auf Erlassen ohne `kl:'A'` UND ohne Fassungs-Zeile wird der Schalter nicht mehr angeboten (1217 von 1420 Erlassen ohne `kl:'A'`; davon 2 mit wirksamer Fassungs-Zeile) | GEGENGEPRÜFT (26.7.2026) · H1 gebaut, Tore grün · Ziff. 7.4 auf den S1-Stand nachgezogen (17.8.2026) · **offen: fachliche Abnahme David (inkl. ZITAT-Entscheid)** |
| [norm-vorschau-snapshot-system.md](normen/norm-vorschau-snapshot-system.md) | **Volltext-Snapshot-System** (neu 16.6.2026): Popover mit Gesetzestext Bund (5760 Art./18 Gesetze, Vollabdeckung) + Kantone (LexWork-Adapter, 19 Kt.); Datenmodell, Build-Regel (CLAUDE.md §7), genuine Lücken, Drift-/Vollständigkeits-Checks; speist `public/normtext/` + NormPopover | ZWEIFACH GEPRÜFT (Extraktion + 2 Bug-Checks + Drift/Vollständigkeit grün); Abnahme David offen |
| [verweis-inventar-messung-2026-08-31.md](normtext/verweis-inventar-messung-2026-08-31.md) | **Verweis-Inventar des Normtext-Korpus** (31.8.2026, W2·20-VERWEIS-SCHAERFE): Erkenner-Replay über alle 1 458 Snapshots — 24 489 Zitat-Stellen, 71.1 % verlinkt; Formklassen-Tabelle mit heutigem Verhalten; Selbstmarker 548 verweis-tragend (18 fälschlich im des/der-Guard, 2 tote Ziele), 400 kantonale Grosswort-Kürzel eindeutig auflösbar, keine Aussen-Anzeige, Zeit-Kante (93 Übergangs-Stellen) als echtes §8-Risiko; Zahlen NICHT fortschreiben — V-1-Tor ersetzt sie | ERSTMESSUNG (Produktions-Erkenner importiert, Guards transkribiert); Abnahme David offen |
| [verweis-positivliste-messung-2026-09-01.md](normtext/verweis-positivliste-messung-2026-09-01.md) | **Erlassnamen-Positivliste + Kürzel-Schreibweisen** (1.9.2026, W2·20 V-7/V-8): des/der-Guard-Rest 1 516 Bund/795 Kanton, Kasus-Lücke 601 Stellen (BankG/AsylG/FinfraG …), Falschlink BE-154.21 (KDSG→DSG) und 198 falsche Self-Links (Passus vor «des Bundesgesetzes …») gemessen; kuratierte Tabellen mit Geltung je Ebene und Register-Beleg-Wächter; Bilanz FREMD 4 900→6 048, TEXT 9 715→8 799 | BAU-MESSUNG (Tor-Artefakt, Alt/neu-Diff); Abnahme der URL-belegten Kurztitel und Geltungen David offen |
| [verweis-traegergesetz-messung-2026-09-14.md](normtext/verweis-traegergesetz-messung-2026-09-14.md) | **Trägergesetz-Kontext «des Gesetzes» + Kurztitel mit Korpus-Ziel** (14.9.2026, W2·20 V-7-Bund-Rest): die namenlose Kurzform ist im Ingress der Vollzugsverordnung LEGALDEFINIERT «(Gesetz, ArG)» — 7 Verordnungen (ARGV1/ARGV2/UVV/MVV/LSV/LRV/VKL) → ArG/UVG/MVG/USG/KVG, 169 Glieder; davon waren 97 vorher FALSCHE Self-Links und 42 tote Self-Ziele. Dazu 15 amtliche Kurztitel mit Titel-Klammer-Beleg (28 Glieder). Gegenprobe: BANKG/GSCHG/LUGUE bleiben Text. Bilanz SELF 19 750→19 653, FREMD 11 390→11 616, TEXT 5 033→4 918 | BAU-MESSUNG (Tor-Artefakt, 2 Rot-Beweise, Bestandsprüfung 169+28, Fedlex-Stichprobe 21/21); fachliche Abnahme David offen |
| [dt-marken-inventar-2026-09-04.md](normtext/dt-marken-inventar-2026-09-04.md) | **Formklassen der `<dt>`-Marken im Fedlex-Bund-Korpus** (4.9.2026, QS-KORPUS): Messung am gepinnten Filestore-Cache (229 HTMLs) — 163 Marken in 32 Erlassen, die die alte Praefix-Regex kuerzte (Kategorien `BE:`, roemische `ii)`, Legenden `BAS`, Labels `Kolonne 1:`, aufgehobene Bereiche `e. und f.`, lat. Suffixe bis `decies`); Doppelpunkt = Label, Punkt/Klammer = Ordinalmarke (51 Doppelpunkt-Marken in genau 3 Erlassen, keine davon lit.-Aufzaehlung). Dazu die vier Namensraum-Tags der Fedlex-Konversion (`tmp:inl` 680, `w:smartTag` 64, `w:moveFromRange*` 4), die Woerter zerrissen. Zahlen NICHT fortschreiben (S6) | einfach belegt (deterministische Messung, nachrechenbar); Abnahme David offen |
| [rectifies-tor-runde2-2026-09-19.md](normtext/rectifies-tor-runde2-2026-09-19.md) | **rectifies-Tor Runde 2 + Nachzug R2b + Nachzug R2c** (19.9.2026, QS-MONITOR-ROT): Rot-Reproduktion auf dem #909-Datenstand (82 Kanten) fand 5 statt 4 `abweichend`-Fälle. Drei reine Parser-Lücken live belegt (KRK Staatsvertrags-Headline, VZAE Leerzeichen vor Semikolon, OR Fussnotenzeichen) + eine selbst gefundene Footnote-leak-Nebenfalle (BPV/oc-2026-324). Nachzug R2b: Klammer-Fenster strukturell eingegrenzt (F1, Falsch-Grün-Risiko), Ausnahme-Konsumption dreistufig (F2), Text-Stale-Sicherung bei Mehrfach-AS (F3). Nachzug R2c: Fugentrenner-Falsch-Grün-Risiko C1 geschlossen (Rot-Beweis A5/A5b, Regressionsscan 0/66 unverändert). Vier amtlich belegte Fedlex-Fehler derselben Fehlerklasse «falsches rectifies-Ziel»: SKV (oc-2025-686), AIG (oc-2025-342), LRV (oc-2025-448, `jolux:rectifies` zeigt auf den Grunderlass 1986/208 statt die Änderung `eli/oc/1992/124_124_124`), KLV (oc-2026-209, zeigt auf ein älteres, unabhängiges Änderungsdokument 2014/269 statt AS 2025 419/851 — Negativbefund zweifach nachgemessen, s. Dossier). Aussenfall derselben Fehlerklasse ausserhalb des Korpus: `oc/2025/227` | zweifach geprüft (Bau-Messung Sonnet + adversariale Opus-Gegenprüfung 19.9.2026, inkl. unabhängiger Re-Derivation des KLV-Negativbefunds am PDF-A oc/2014/269: 0 Treffer Syncytial/Synzytial/RSV, geändert nur Art. 12a Bst. a, b, d, f, g, i, j, l); fachliche Abnahme David offen |
| [kanton-gliederung-sidecar-luecke-2026-08-13.md](normen/kanton-gliederung-sidecar-luecke-2026-08-13.md) | **Kantonale Gliederungs-Sidecars — die 42 ohne Sidecar + Prüfauftrag SG-3849** (13.8.2026, W2·19B-KORPUS): deterministische Regel, welcher Kantons-Snapshot ein Sidecar tragen kann (LexWork-Leseadresse → 1189 · PDF-Adresse derselben Portal-Familie → 8, davon 4 erzeugbar · Fremdportal/lexfind → 34 nicht erzeugbar, mit Negativbefunden). 4 Sidecars nachgezogen (LU-3870, GR-3348, VS-1413, FR-8428), Artikel-Ebene je vollständig belegt; Fassungs-Tor real gegriffen (SG-2808 hängt an Version 2012, amtlich gilt 2026). **SG-3849-Verdikt: unsere Erfassung ist fehlerhaft, nicht lückenhaft** — der Erlass ist der GebT sGS 821.5 und führt amtlich GAR KEINE Artikel; alle 17 «Art. N» sind Fremdverweis-Fragmente (Stichprobe 17/17, zwei unabhängige Wege). Dazu Struktur-Typen-Inventur der 42 und Schema-Befund zum Typ Ziffern-Tarif | ERSTRECHERCHE (SG-3849-Kern zweiweg-belegt); Abnahme David offen |
| [gesetzessammlung-rubrik-v.md](normen/gesetzessammlung-rubrik-v.md) | **Rubrik V «Gesetze»** (neu 17.6.2026): browsbare Gesetzessammlung über den Snapshots — Erlass-Register (SSoT Identität+Taxonomie) → generiertes `register.json` → Übersicht + Lesesicht (Sticky-TOC, zuklappbare Bänder, In-Gesetz-Suche, Querverweis-Autolink, Popover-Brücke); Speicher-/Darstellungsregeln, 7 Konsistenz-Tore, Wettbewerbs-Differenzierung | ERSTRECHERCHE (gate-grün, browser-verifiziert); Abnahme David offen |
| [kantonale-tarif-zitat-befunde.md](normen/kantonale-tarif-zitat-befunde.md) | **Kantonale Tarif-Zitat-Befunde LU/OW/SH + NE/GE** (16.–17.6.2026): Befunde aus Norm-Vorschau-Vollständigkeitstest — LU GRUNDPFAND quelleUrl 228→258 (BEHOBEN); OW GDB 134.15 Art. 7 aufgehoben (Art. 9/12, BEHOBEN); SH 273.100 Art. 109 totes Recht (JG 173.200 Art. 82, **BEHOBEN 16.6.**, Commit `b7587a51`, fachl. freigegeben David — Fundorte schlichtung.ts/nicht-vermoegensrechtlich.ts/zustaendigkeitKosten.ts:141); **+ 5 NE/GE-Zitatkorrekturen 17.6.2026 (alle wertneutral BEHOBEN): NE Art. 54/81→Art. 14 ch. (RSN 166.31 endet Art. 17, Chiffres in Art. 14); NE GRUNDPFAND Art. 44→Art. 10 (LERF); GE GRUNDPFAND Art. 16/84→Art. 4 al. 6 (REmORFDIT — RTFMC-Hypothese live widerlegt)** | ZWEIFACH GEPRÜFT (live htm-Quelle + Token-Auflösung); golden byte-gleich; generelle Rechtssicherheits-Abnahme bleibt Davids Sache |
| [fortsetzungs-tiefe-bild-bloecke-2026-07-26.md](normen/fortsetzungs-tiefe-bild-bloecke-2026-07-26.md) | **Fortsetzungs-Tiefe bei bild-unterbrochenen Aufzählungen (26.7.2026, Befund 6 zu PR #372):** Fedlex rendert Fortsetzungs-Ziffern nach Formelbildern als anonyme `dl>dl` (Form A) oder flache Fortsetzungs-`dl` (Form B); Extraktor vertieft Form A strukturell und Form B über die enge Ziffern-Nachfolger-Regel am Bild-Block; Renderer baut die blockübergreifende Zitier-Kette (Abs.+lit. aus Vorgängerblöcken). 6 Fundstellen (DBG 22, STHG 7, RBUE 25+annex, HZUE annex, VVV annex_4) amtlich per PDF-x-Position belegt; 222 übrige Snapshots byte-gleich | ERSTRECHERCHE + adversariale Gegenprüfung (Verdikt im Commit-Trailer) |
| [fn5-wortgenaue-marker-2026-07-26.md](normen/fn5-wortgenaue-marker-2026-07-26.md) | **FN-5/M14 wortgenaue Fussnoten-Marker (26.7.2026, W2·5d):** Platzhalter-Parse + Zwei-Zeiger-Ausrichtung berechnet je Marker `pos{b,it,o,l}` im Struktur-Sidecar; Haupt-Snapshots byte-unverändert. 16'894 Marker mit Wortposition (81.6 % der block-verorteten, 97.7 % der text-verorteten); Restklassen ausgewiesen (`<dt>`-Marken 3'799 · Kopf/Sektion 10'453 korrekt ohne Textstelle); Differ-Beweis nur erzeugt+pos; Gegenprüfung Opus R1–R3 (B1 Marker-Verlust gefixt); `l`-Drift-Riegel im Reader | ERSTRECHERCHE + adversariale Gegenprüfung R1 widerlegt→gefixt→R2/R3 bestanden |
| [informations-nutzung-gesetze-2026-07-17.md](normen/informations-nutzung-gesetze-2026-07-17.md) | **Informations-Nutzung der Gesetze — Lücken-Katalog** (Auftrag David 17.7.2026 «nutzen wir wirklich alle Informationen aus unseren Gesetzen?»; 2 Miner Quelle-vs-Pipeline, empirisch am Korpus 227 Bund/1232 Kanton). **Verdikt: Normtext-KÖRPER Bund nahezu erschöpfend genutzt**; systematische Lücken = **relationale + temporale Metadaten + Such-Abdeckung**. Tier 1: **G-REF** (externe amtliche ELI-Verweise via `entferneTags` verworfen; INTERNE Kanten existieren in der Quelle gar nicht = keine Lücke) · **G-HIST** (artikel-genaue Historie liegt nur als Fussnoten-Prosa, unstrukturiert; nur EIN Ur-Inkrafttreten je Erlass) · **G-SUCH** (Suchindex omittiert Fussnoten/Tabellen). Tier 2: G-EID (→§12/#280), G-PRERENDER, G-ANNEX-META, G-FORMEL-FLAG. Tier 3: Formel/Bild-Semantik + FR/IT + LugÜ + Kantonal-Asymmetrie (Quell-Grenzen). Intake §14 → FAHRPLAN-NORMTEXT/UI-NAVIGATION/SEO | ERSTRECHERCHE (17.7.2026, empirisch verifiziert); **Bau-GO je Kandidat ausstehend (David) — Extraktion = Risikopfad** |
| [fedlex-quellfehler-argv5-vstv-2026-07-26.md](normen/fedlex-quellfehler-argv5-vstv-2026-07-26.md) | **Fedlex-Quellfehler ArGV 5 Art. 22 «20006» + VStV Art. 58 «Anteilsan»** (26.7.2026, aus FN-5-Gegenprüfung Befund B4): beide Artefakte stehen wortgleich im amtlichen Fedlex-Datenbestand — HTML **und** AKN-XML der gepinnten kanonischen Konsolidierung; ArGV 5: alte AS-2007-Fussnoten-Ziffer «6» als Fliesstext-Rest neben neuem Marker 15 (Mechanismus am AS-2007-4966-PDF belegt); VStV: Leerzeichen fehlt in der Quelle, Fussnote 90 (AS 2021 77) sitzt an dessen Stelle; FR je sauber → DE-Konversionsfehler. **Verdikt Fall (a): kein Pipeline-Bug (Negativbefund), keine Snapshot-«Korrektur» (§1/§7), selbstheilend beim Re-Pin; Fedlex-Meldung als Vorschlag an David** | ERSTRECHERCHE (26.7.2026, Artefakt je Fall in HTML + AKN-XML reproduziert; §9-Bug-Check-Nachprüfung) · Fedlex-Meldung: Entscheid David offen |

## behoerden/ — Behördenlisten

### Zivil (Gerichte + Schlichtung) — ZWEIFACH GEPRÜFT
| Dokument | Inhalt | Befund 2. Durchgang |
|---|---|---|
| [gerichtsbehoerden-kantone.md](behoerden/gerichtsbehoerden-kantone.md) | Master-Liste Gerichte 26 Kantone | 0 Widerlegungen, 8/8 Stichproben; Nachtrag 10.6.: ZH alle 12 BG amtlich (BG ZH Briefpost PF 8036!); offen nur AR-Hausnr. |
| [gerichte-bund.md](behoerden/gerichte-bund.md) | BGer/BStGer/BVGer/BPatGer | 1 Korrektur (BVGer-PLZ 9023) eingearbeitet |
| [gog-gerichtsorganisation-kantone.md](behoerden/gog-gerichtsorganisation-kantone.md) | Behörde→GOG-Artikel + kantonale Zivil-Gebührenstaffeln | 15/15 Stichproben bestätigt |
| [rechtsmittel-spruchkoerper-kantone.md](behoerden/rechtsmittel-spruchkoerper-kantone.md) | Spruchkörper Berufung (Art. 308 ZPO) / Beschwerde (Art. 319 ZPO) je Kanton + BGerR Art. 33/34 (I./II. zivilrechtl. Abt.) — Verdrahtungs-Empfehlung obereInstanzen.ts | **Erstrecherche** (6.6.2026); deterministisch nach Rechtsmittel nur VD (+ ZG-Teil); Rest (B)/(A) ehrlich offen |
| [schlichtungsbehoerden-kantone.md](behoerden/schlichtungsbehoerden-kantone.md) | Schlichtungsbehörden 26 Kantone | 2 Re-Checks + Schiedsrichter (BL/SH/TI entschieden) |
| [schlichtungsbehoerden-zh-vollerfassung.md](behoerden/schlichtungsbehoerden-zh-vollerfassung.md) | ZH: 171 FR-Ämter + 12 Miet-Stellen + GlG; Stadt: PLZ→Stadtkreis-Automatik (12.6.2026) | Stichproben ✓ — speist die PLZ-Auflösung + Kreis-Automatik |
| [gebaeudeadressverzeichnis-adressaufloesung.md](recherche/gebaeudeadressverzeichnis-adressaufloesung.md) | Adress-Ausbau Stufen 1–3 (12.6.2026): swisstopo-Gebäudeadressverzeichnis + Stadt-ZH-Strassen + geo.admin-API — speist zhStrassen/strassenVerzeichnis/AdresseBundSuche | Erstrecherche, empirisch verifiziert; Wortlaute abgenommen 12.6.2026 |
| [schlichtungsbehoerden-sz-bl-so-zg-sh-lu-vollerfassung.md](behoerden/schlichtungsbehoerden-sz-bl-so-zg-sh-lu-vollerfassung.md) | Vollerfassung SZ/BL/SO/ZG/SH/LU | Konflikte entschieden; SZ teiloffen (JS-Karte) |
| [schlichtungsbehoerden-ti-vs-gr-vollerfassung.md](behoerden/schlichtungsbehoerden-ti-vs-gr-vollerfassung.md) | TI 38 Giudicature + 11 Miete-Uffici gemeindescharf (Art. 5 LALoc, 12.6.2026), VS-Systematik, GR 11 Vermittlerämter | TI-Miete verdrahtet (Register §51) |
| [schlichtungsaemter-gemeindezuordnung.md](behoerden/schlichtungsaemter-gemeindezuordnung.md) | Gemeinde→Amt für AG/SG/TG/FR/ZG/AI (+ SZ/BL teiloffen) — **Quelle der generierten PLZ→Amt-Daten** (scripts/plz-generieren.ts) | zweifach belegt; SZ/BL am 6.6.2026 GESCHLOSSEN (Itingen→Kreis 13; personengebundene Adressen → Verzeichnis-Fallback bleibt) |
| [be-sprengel-geodaten-2026-09-12.md](behoerden/be-sprengel-geodaten-2026-09-12.md) | BE: Gemeinde→Regionalgericht (inkl. Aussenstelle Berner Jura) und →regionale Staatsanwaltschaft aus den amtlichen Geodaten des AGI BE (ADMRG/ADMRSA/GRENZ5) — Quelle der generierten Tabelle `src/data/zustaendigkeit/beSprengel.json` | Erstrecherche mit Vollerhebung 12.9.2026: 334/334 Gemeinden, 0 mehrdeutig; 0 Abweichungen gegen den Bestand; Normbasis Art. 80/81/92 GSOG; fachliche Abnahme offen |
| [gerichtsadressen-erstliste.md](behoerden/gerichtsadressen-erstliste.md) | Davids CSV (47) + Audit-Trail (21 ✓ / 26 abweichend) | abgeschlossen |
| [schlichtungsstellen-urls.md](behoerden/schlichtungsstellen-urls.md) | Direktlinks zu Schlichtungsstellen (48/85 WebFetch-verifiziert, 6.6.2026) | einfach belegt |

### Straf — ZWEIFACH GEPRÜFT
| Dokument | Inhalt | Befund 2. Durchgang |
|---|---|---|
| [strafbehoerden-kantone.md](behoerden/strafbehoerden-kantone.md) | Staatsanwaltschaften/Jugendanwaltschaften/Übertretungsbehörden 26 Kantone + Bund (BA/AB-BA), EG-StPO-Mapping | SZ-Korrektur (Schmiedgasse 21, JugA Bennau); ALLE Lücken geschlossen (AG-Hausnummern 6.6.; VD-Korrektur: Konstituierung in LMPu 173.21 Art. 3/4; VS LACPP Art. 6/7; JU → OJ statt LiCPP) |
| [strafgerichte-kantone.md](behoerden/strafgerichte-kantone.md) | Erstinstanzliche Strafgerichte 26 Kantone (Berufungsinstanzen aus obereInstanzen projiziert; BL amtlich Muttenz) | einfach belegt (6.6.2026) |

### SchKG (Betreibung) — ZWEIFACH GEPRÜFT
| Dokument | Inhalt | Befund 2. Durchgang |
|---|---|---|
| [betreibungskreise-kantone.md](behoerden/betreibungskreise-kantone.md) | Betreibungskreis-Systeme aller 26 Kantone (10 Einheitsamt · 10 Bezirks-/Regional · 2 Gemeinde · 4 gemischt) + Rechtsgrundlage, amtliches Verzeichnis, geprüfte Beispieladressen je Kanton; EasyGov-Finder-Analyse (kein offenes API, Negativbefund Bundes-Verzeichnis); **GEBAUT 7.6.2026**: `src/data/betreibungsaemter.ts` + Gemeinde-Auflösung `src/data/betreibung/` (Etappen 1–3: 10 Einheitsämter + 130 Kreis-Ämter in 13 Kt., Karten 11 Kt.; LU/AG/SG Verzeichnis-Link §8) im SchKG-Rechner | 52 Agents Recherche + 32 Agents Extraktion 7.6.2026 (je Kanton adversarial; Adress-Stichproben durchwegs bestätigt); TG-Zitate an geltender Fassung korrigiert; ZH-Reorganisation 56→34/18 in Vernehmlassung → Verfallsregister; Wortlaut-Lücken OW/FR (LexWork-Portale) markiert |

### Verwaltung — ZWEIFACH GEPRÜFT
| Dokument | Inhalt | Offen |
|---|---|---|
| [verwaltungsbehoerden-kantone.md](behoerden/verwaltungsbehoerden-kantone.md) | Wichtigste Verwaltungsbehörden je Kanton (VGer/Staatskanzlei/Steuer+Rekurs/StVA/Migration/SozVGer) — ALLE 26 Kantone (u. a. GR-Obergericht 1.1.2025, VD-Hermitage Juli 2025; JU: Cour des assurances eigenständig) | Doppelcheck ausstehend |

### Erbgang — ZWEIFACH GEPRÜFT
| Dokument | Inhalt | Befund 2. Durchgang |
|---|---|---|
| [erbgangsbehoerden-kantone.md](behoerden/erbgangsbehoerden-kantone.md) | Testamentseröffnung/Erbenschein/Ausschlagung je Kanton — 4 Grundmodelle + Aufgaben-Splits | 1 Korrektur (SO 6 Ämter, Breitenbach ergänzt); UR geschlossen (Gemeindemodell); ZH/BE/LU/GE/SG-§§ bestätigt |

### Notariat — ERSTRECHERCHE
| Dokument | Inhalt | Status |
|---|---|---|
| [notariate-kantone.md](behoerden/notariate-kantone.md) | Notariats-System + Anlaufstelle/Verzeichnis-Link je Kanton (wer beurkundet GmbH-/AG-Gründungen; Sonderregel SH: HRegA beurkundet selbst; keine örtliche Ausschliesslichkeit bei Gründungen) — Stammdaten-Quelle für `src/lib/notariate.ts` | Erstrecherche 7.6.2026 (Auftrag David); 23/26 URL-geprüft; UR/AI/BL unsicher markiert; Listen-PDFs datiert → Verfallsregister |

### Handelsregister — ERSTRECHERCHE
| Dokument | Inhalt | Status |
|---|---|---|
| [handelsregisteraemter-kantone.md](behoerden/handelsregisteraemter-kantone.md) | Adressdossier aller 26 kantonalen Handelsregisterämter: Amtsbezeichnung, Postadresse, PLZ/Ort, Telefon, E-Mail, amtliche Website je Kanton — je Eintrag Quelle + Abrufdatum 7.6.2026. Mehrfachstandorte offengelegt (VS 3 Arrondissements; TI Amt Biasca ≠ Sektion Bellinzona; SG Hauptsitz + Aussenstellen); Sitz ≠ Hauptort dokumentiert (BE Ostermundigen, BL Arlesheim, SO Klus-Balsthal, VD Moudon). Befund: kein Konkordat — OW/NW und AI/AR je eigenes Amt | Erstrecherche 7.6.2026 (Auftrag David); 26/26 Kantone; zefix-API (EHRA) 401 → amtliche kantonale Seiten als Quelle; 4 E-Mail-Lücken (LU/FR/AI/TG) ehrlich offen; zefix-Abgleich + Doppelcheck ausstehend |

## kosten/ — Tarife — ZWEIFACH GEPRÜFT

| Dokument | Inhalt | Befund 2. Durchgang |
|---|---|---|
| [schlichtungsgebuehren-kantone.md](kosten/schlichtungsgebuehren-kantone.md) | Schlichtungsgebühren 26 Kantone + Art.-113-Kopf — **Quelle von src/data/zustaendigkeitKosten.ts** | AG auf GebührD 662.110 korrigiert; Stichproben ✓ |
| [gerichtskosten-kantone.md](kosten/gerichtskosten-kantone.md) | TIEFENERFASSUNG: vollständige Zivil-Staffeln je Kanton (alle Bänder, summarisch, Rechtsmittel, Reduktionen, Vorschuss) — Teil A ZH–BL | einfach belegt; Teil B + Doppelcheck folgen |
| [gerichtskosten-bund.md](kosten/gerichtskosten-bund.md) | Tarife BGer/BVGer/BStGer/BPatGer wörtlich aus Fedlex | alle Stichproben wörtlich ✓, keine neueren Konsolidierungen |
| [anwaltstarife-kantone.md](kosten/anwaltstarife-kantone.md) | Anwaltstarife (Parteientschädigung/UR) 26 Kantone | GL-Tarif existiert doch (GS III I/5); UR-Staffel beschafft |
| [notariatstarife-gruendung-kantone.md](kosten/notariatstarife-gruendung-kantone.md) | **Notariatstarife für die Beurkundung der AG-Gründung** (Errichtungsakt), ZH/BE/AG/LU/SG/BS — Erlass+Stand je Kt (abrogated/future_versions API-geprüft), deterministische Gebührenregel (Promille/Staffel verbatim, Beispiel AK 100k), AG-Gründung in **AG nicht tarifiert → Aufwand** (ehrlich als Rahmen) | **ERSTRECHERCHE 7.6.2026** (Auftrag David §11/Punkt 11); ZH-Nachtrag-123 + SG-MWST + Agio offen; Engine NICHT geändert |
| [notariat-grundbuch-kantone.md](kosten/notariat-grundbuch-kantone.md) | **Notariats-, Grundbuch-, Grundpfand- & Handänderungssteuer-Tarife beim Grundstückkauf, alle 26 Kantone** — je Wert Erlass+Artikel+Link+Stand; Quelle von `src/data/tarif/notariat-grundbuch.ts` + `src/lib/notariatGrundbuch.ts` | **ERSTRECHERCHE 15.6.2026** (5-Cluster-Fan-out); Doppelcheck offen (GE ‰/%-Zeichen, JU Punktwert, VS Stufenmodus, ZG ESTV, BE Anhang-1-Staffel) |
| [grundbuchgebuehren-kantone.md](kosten/grundbuchgebuehren-kantone.md) | **Grundbuchgebühren je Eintragungsart, alle 26 Kantone** — 10 Eintragungsarten (Eigentum Kauf/Erbgang, Grundpfand, Dienstbarkeit, Vormerkung, Baurecht, Stockwerkeigentum, Parzellierung/Mutation, Anmerkung, Löschung) je Erlass+Artikel+Regel+Stand; Quelle von `src/data/tarif/grundbuch.ts` + `src/lib/grundbuchgebuehren.ts`; `eigentum_kauf`-Gegenprobe reproduziert die GRUNDBUCH-Schicht | **ERSTRECHERCHE 15.6.2026, doppelt verifiziert** (52 Agenten); Korrekturen BS Artikel / ZH § 11 / AI Löschung; Abnahme David ausstehend |
| [beurkundungstarife-kantone.md](kosten/beurkundungstarife-kantone.md) | **Beurkundungstarife (Notariatsgebühren) je Geschäftsart, alle 26 Kantone** — 14 Geschäftsarten (Testament, Erbvertrag, Ehevertrag, Schenkung, Vorsorgeauftrag, Vollmacht, AG/GmbH-Gründung, Kapitalerhöhung, Stiftung, Bürgschaft, Schuldanerkennung, Dienstbarkeit) je Erlass+Artikel+Regel+Stand; Quelle von `src/data/tarif/beurkundung.ts` + `src/lib/beurkundung.ts` | **ERSTRECHERCHE 15.6.2026, doppelt verifiziert** (Workflow find→Doppelcheck, 52 Agenten); Korrektur GE Bürgschaft 1‰; Abnahme David ausstehend |
| [tarif-drift-nachverifikation-2026-09-06.md](kosten/tarif-drift-nachverifikation-2026-09-06.md) | **Nachverifikation der 34 Tarif-Erlasse mit Fassungs-Drift** — jeder der 103 betroffenen Einträge in `src/data/tarif/**` gegen die geltende amtliche Fassung geprüft (URL + Fassungs-Id + Wortlaut je Erlass, Abruf 6.9.2026); Grundlage des Nachzugs W3-TARIF-NACHVERIFIKATION (89 Stand-/Pin-Nachführungen, 2 Erlass-Zuordnungen, 6 Wertkorrekturen) | **ERSTRECHERCHE 6.9.2026**, drei parallele Läufe; 97/103 GLEICH, kein Betrag durch die Drift falsch geworden; Tor danach DRIFT 0; David-Entscheide offen (VS DE/FR-Divergenz, FR 261.16 Auffangtatbestand, SG Rahmen-Verdoppelung) |

## muster/ — amtliche Vorlagen, verbatim archiviert (NEU 7.6.2026)

51 Text-Extrakte amtlicher Original-Vorlagen (EHRA · HRegA ZH inkl.
Kapitalerhöhungs-Suite · SG · GL · AR/BE-Einzelstücke) — die verbatim-Basis
der Wortlaut-Dossiers, zuvor nur flüchtig in `/tmp`. Quellen-URLs, Stände
und Pflege-Regeln: [muster/MANIFEST.md](muster/MANIFEST.md). Stand-Überwachung
im Verfallsregister («Amtliche Muster-Suiten»).

## Verdrahtung in den Code (SSoT-Karte)

| Dossier | speist |
|---|---|
| zpo-zustaendigkeit-regelwerk | `src/lib/zustaendigkeit.ts` (örtlich/sachlich/Rechtsmittel) |
| schkg-zustaendigkeit-regelwerk | `src/lib/schkgZustaendigkeit.ts` (Rechtsweg «Betreibung», 6.6.2026) |
| stpo-zustaendigkeit-regelwerk | `src/lib/strafZustaendigkeit.ts` (Rechtsweg «Straf», 6.6.2026) |
| erbrecht-regelwerk (Audits) | bestätigt `src/lib/erbteilung.ts` + `vorlagen/testament.ts`; Ausbaupunkt `erb-ausgleichung` |
| feiertage-kantone-bj | `src/data/zpoFeiertage.ts` (istFeiertag/naechsterWerktag – alle Fristen-Engines) |
| gerichtsbehoerden + erstliste (Audit) | `src/data/obereInstanzen.ts` (Rechtsmittel) · `src/data/handelsgerichte.ts` (Art. 6 ZPO) |
| strafbehoerden-kantone | `src/data/staatsanwaltschaften.ts` (26 + Bundesanwaltschaft) |
| schlichtungsbehoerden-* + gemeindezuordnung | `src/data/schlichtungsstellen.ts` · `src/data/schlichtung/*` (PLZ→Amt) · Vorlage Schlichtungsgesuch (SgBehoerdenWahl) |
| schlichtungsgebuehren + gog (Zivil-Staffeln) | `src/data/zustaendigkeitKosten.ts` (Fahrplan-Kosten) |
| strafgerichte-kantone | `src/data/strafgerichte.ts` (Straf-Rechtsweg, 6.6.2026) |
| schlichtungsstellen-urls | `src/data/schlichtungsstellen.ts` (Direktlinks in der UI) |
| recherche/bgg-beschwerde-engine | `bestimmeRechtsmittel` in `src/lib/zustaendigkeit.ts` (Rechtsmittel-Umbau 6.6.2026: Objekt-/Verfahrens-/Vorinstanz-Weichen, Fristen Art. 100/46 BGG) |

## Werkzeuge

- [werkzeuge/omnilex-ai-und-kaggle-legal-ir-2026-07-16.md](werkzeuge/omnilex-ai-und-kaggle-legal-ir-2026-07-16.md) — **Erstrecherche 16.7.2026 (Sidequest):** GitHub-Org Omnilex-AI + Kaggle-Competition «LLM Agentic Legal Information Retrieval» (CH-Recht, BGE/SR-Zitate). Fund: Apache-2.0-Starter-Repo als Ideen-Steinbruch (Zitat-Regex/Abkürzungsliste) + LLM-freier Retrieval-Eval-Harness (F1/MAP/NDCG → Such-Güte für `api/suche`). Basis-Datasets LEXam (CC-BY-4.0) / swiss_citation_extraction (**CC-BY-SA-4.0, viral** → Annotationsschicht NICHT übernehmen, Texte immer von Amtsquelle). Verdikt: F1/F2 bringen etwas (Werkzeug-Ebene), Produkt bleibt LLM-frei. **F2 UMGESETZT 16.7. (Roadmap W2·7-VZUI):** 10 Zitat-Muster-Varianten (BGE-Pinpoint · verkettete Sub-Marker · Nr./Umlaut-Endung/Bereich/ff.-Liste/Mehrfach/ECLI/SR-Locator) in `src/lib/rechtsprechung/zitat-extraktion.ts`, Regex-Formen aus Apache-2.0-Steinbruch (nicht das naive Substring-Matching); Gegenprüfung bestanden (0 Phantom, 0 Entscheid-Verlust, +2931 Refs); Kanten-Regen wartet auf `fix/a29-regesten` — siehe Abschnitt «Ausbeute F2»
- [werkzeuge/swisslegaltranslations-2026-07-16.md](werkzeuge/swisslegaltranslations-2026-07-16.md) — **Erstrecherche 16.7.2026 (Sidequest):** `JoelNiklaus/SwissLegalTranslations` (SwiLTra-Bench), Code-Repo das DE/FR/IT/RM/EN-Rechtsübersetzungen aus **Fedlex** generiert. **Code hat KEINE Lizenz → all rights reserved (nur Blaupause, nicht kopieren)**; Daten = amtliche Fedlex-Übersetzungen (URG-frei, keine virale Schicht → direkt von Fedlex). Fund: artikel-/absatzgenaue Alignment-Methodik = struktureller Join `rsNr+artNr+parNr` über identische Fedlex-`art_X`-IDs (kein ML) → **Blaupause für M15 (DE/FR/IT, G29) + W2·6 mehrsprachiger Normvergleich**. Unsere Fedlex-SPARQL ist bislang DEU-only; Sprachumschaltung = Filter-Tausch. Verdikt: F1 bringt etwas (Blaupause), Daten irrelevant (haben Fedlex direkt)
- [werkzeuge/suche-eval-baseline-2026-07-16.md](werkzeuge/suche-eval-baseline-2026-07-16.md) — **Suchgüte-Eval-Baseline 16.7.2026 (advisory, kein Gate):** `scripts/suche-eval.ts` (`npm run eval:suche`) misst die ECHTE Produkt-Suche gegen 69 verifizierte Gold-Paare (Gold `scripts/suche-eval-gold.json`), deterministisch/LLM-frei, Recall@1/5/10·MRR·NDCG@10 je Klasse. Baseline: normzitat/bge 0.83 (Rang-1-Zitate stark), **umgangssprache Recall@10 0.18 = grösste Lücke** (Kompositum ≠ FlexSearch-forward-Präfix), stichwort 0.75; Nebenfund: FR/SR-Alias im Norm-Sprung unvollständig (Cst/LDIP)
- `scripts/fedlex-cache.sh` — konsolidierte Filestore-HTMLs nach /tmp + Anker-Prüfung
- `scripts/plz-generieren.ts` — amtliches PLZ-Register (swisstopo) + Gemeinde→Amt-Daten
- `scripts/golden-outputs.ts` — Golden-Protokoll der Engines (Fallzahl nicht hier hartkodiert, §Kurzregel 5 — aktueller Stand: [`golden/lexmetrik-golden.json`](../golden/lexmetrik-golden.json))
- `scripts/og-bild.ts` — Generator der Social-Card `public/og.png` (W1.10, `npm run og:bild`)
- `scripts/messung-cwv.ts` — CWV-Messung am Indexierungs-Hebel (W1.11, `npm run messung:cwv`)

## seo/ — Sichtbarkeit & Performance (Strang B, ohne David-Fachzeit)

- [CWV-Baseline (W1.11)](seo/cwv-baseline.md) — LCP/Transfer/Requests der prerenderten Detailseiten; Befund: render-then-replace trägt die LCP auch bei OR/ZGB (~1.7/1.1 MB), W2.8-Splitting für LCP nicht dringlich
- [Kanton-Reader-Profil 31.8.2026 (K-11)](seo/kanton-reader-profil-2026-08-31.md) — Quelle: eigene Messreihen gegen `dist/` via `vite preview` + Playwright/CDP, Stand `0921112c2`, kalt je Lauf, n=3–12 je Bedingung. Regel deterministisch: Zeit bis zum ersten `article[id^="art-"]` = 437 ms ungedrosselt / 4595 ms @4×+4G / 17 360 ms @6×+3G (BS-154.100); **83 % davon vergehen, bevor der Snapshot überhaupt angefordert ist**. Drei Blocker-Kandidaten mit Logikverlust-Vorbewertung: 753 KB `rechtsprechung/register.json` auf jeder Gesetzes-Leserseite (A/B −16…−19 %), serielle Kette Register→Snapshot, Drei-Wellen-Chunk-Kaskade. Widerlegt: Marginalien-Kaskade (Render skaliert linear, ~1.4 ms/Artikel) und React-Compiler-Falle (heisser Pfad handmemoisiert). **50-s-Symptom NICHT reproduziert** (Höchstwert Kanton 21.6 s), Intermittenz nicht reproduziert (n=12, Spanne 8.7 %). Geltung: eine lokale Maschine — belastbar sind Verhältnisse und A/B-Differenzen, nicht Absolutwerte. Pflegebedarf: Zahlen altern mit Bundle-/Datenzuwachs, werden ergänzt statt nachgeführt; Wächter neu `check:perf-lighthouse`-Route `kantonleser`. **Status: einfach belegt (ERSTRECHERCHE); Fix-Auswahl offen, keine Massnahme beschlossen.**

- [Leser-Tempo QS-PERF 1.9.2026 (A/B)](seo/leser-tempo-qs-perf-2026-09-01.md) — Quelle: eigene A/B-Messreihen gegen `dist/` via `vite preview` + Playwright/CDP, Basis-Stand `cd4dc65cb`, kalt je Lauf, n=5 je Zelle, Werkzeug `npm run perf:leser` (`scripts/perf/leser-tempo.ts`, im Repo). Regel deterministisch: Zeit bis `[data-v3-ansicht]` («bedienbar», dieselbe Bedingung wie `e2e/helpers/leserBereit.ts`) sinkt durch zwei logikverlustfreie Massnahmen (bedarfsgerechter Manifest-Lader in `Shell.tsx`; `<link rel="preload">` für Register/Struktur im Prerender-Kopf) auf `/gesetze/bund/OR` von 10 368 → 7 613 ms @4×+4G (**−26.6 %**) und 38 296 → 27 432 ms @6×+3G (**−28.4 %**); Einzellauf-Spannen überlappen in keiner gedrosselten Zelle. Ungedrosselt **keine** Wirkung und keine nötig (788 → 780 ms). Werkzeug gegen das Kanton-Reader-Profil kalibriert (+3.6 / +6.8 %). Befunde: **B4/B5/B6 — der Leser hängt an der REIHENFOLGE, in der er Daten bekommt** (auch die verlustfreie Shell-Massnahme allein riss den Deep-Link-Test R7: Basis 0/10 · M1 1/5 · M1+M2 4/5). **B6: die Wurzel war eine MOUNT-Kopplung und ist gefixt** — `InhaltsKopf` montierte `RuecksprungChip`/`DeepLinkSkeleton` beim Wechsel auf `kopfzeileSelbst` um (verschiedene Kind-Position in zwei return-Zweigen), die Ansage blinkte; Aus-Flanke und Zweigwechsel fielen auf die Millisekunde zusammen (3/3). Fix: EIN Träger, zwei Zustände, Markup byte-gleich → R7 50/50, volle e2e 722/722, kein Test angepasst. Der Toter-Anker-Zweig ist gemessen entlastet (alle 232 BV-Artikel im selben Frame): ein Snapshot-Preload reisst 20 Leser-Specs in 8 Dateien (Spy, TOC-Ruhe, Weiterlesen-Chip, Kopf-Geometrie), sauber isoliert (Basis 49/49 · +Shell-Fix 49/49 · +Preload Register/Struktur 49/49 · +Snapshot 29/49) — der Preload ist darum ausgebaut (§1/§15), der latente Reihenfolge-Defekt ist der eigentliche Fund und sperrt jede Massnahme, die dem Leser Daten früher liefert; der 17.8.2026 datierte OR-Wert «8,4–17,2 s» ist ungedrosselt nicht mehr reproduzierbar (alter Wert **ergänzt, nicht nachgeführt**, §0/2b — Erklärungs-Hypothese `QS-BASIS (d) K3` ausdrücklich ungeprüft); die Strecke ist danach **bandbreiten-**, nicht mehr kettengebunden (~1.1 MB gzip kritischer Pfad); `crossorigin` am Preload ist Pflicht, sonst lädt die Datei zweimal. Geltung: eine lokale Maschine — belastbar sind A/B-Differenzen, nicht Absolutwerte. Pflegebedarf: Zahlen werden ergänzt statt nachgeführt; Wächter `check:perf-budget` + `check:perf-lighthouse`. Offen: Snapshot-Preload (+3–10 %, hängt an einer zweiten Reihenfolge-Stelle im Spy-Effekt), K3-Chunk-Kaskade, Reader-Kopf-Reflow (Design-Entscheid), `hydrateRoot` (eigener PR, `QS-BASIS`). **Status: einfach belegt (ERSTRECHERCHE); keine fachliche Abnahme nötig.**

## betrieb/ — Betrieb, Infrastruktur, Prüf-Forensik

- [Rekursive Selbstverbesserung bei Coding-Agenten — Forschungsstand vs. unser Prozess (15.9.2026, Auftrag David)](betrieb/rekursive-selbstverbesserung-gegenueberstellung-2026-09-15.md) — Quellen: 20 verifizierte Primärquellen (DGM arXiv 2505.22954 · AlphaEvolve 2506.13131 · SICA 2504.15228 · ADAS · STOP · Voyager · Reflexion · Survey 2608.03392 · CTIM-Rover 2505.23422 · Context Rot · Cursor-Bugbot 8.4.2026 · Anthropic Dreams/Harness-Beiträge), Abruf 15.9.2026; vier Quellen (PACE, PostTrainBench 23,2 %, RSI-Workshop-Checklisten, «Codex memories») ausdrücklich NICHT/teilverifiziert und tragen keine Aussage. Regel deterministisch: drei Ebenen (a Modell / b Scaffolding / c Prozess) — **unser Kreislauf ist (c) mit Anteilen (b)**; Ebene (a) und DGM-Stil-Selbstmodifikation bewusst nicht unser Weg (Kosten, Sicherheit, **keine Grundwahrheit für Rechtslogik ausser den Toren**). Gegenüberstellung der 8 Literatur-Schutzmechanismen: **VOLL gedeckt** bei ausführbarer Fitness (88 `check:*`-Tore, Golden byte-gleich, §6.3 «Tests nicht anpassen» = wörtlich Anthropics Harness-Regel) und beim Menschen-Gate (strenger als die Literatur — Berechtigungsschicht statt Prozedur); **TEILWEISE** bei Held-out-Set (§6.7-Rot-Beweis ist einmalig), unveränderlichem Eingang (Konsolidierung ungeplant) und Regel-Ablaufdatum (fehlt ganz); **NICHT ANWENDBAR, begründet** beim DGM-Archiv (wir sind linear). **Grösste Lücke: Rückbau ist deliberativ und unmessbar** — niemand erhebt, ob ein Tor oder eine Regel sich bewährt hat (Befund «1 belegter Fang in 116 e2e-Specs»; Bugbot schaltet unbewährte Regeln automatisch ab, bei uns steht dort nichts). **Kernverdikt: der Kreislauf deckt die Schutzmechanismen weitgehend ab, hat aber kein Fitness-Signal FÜR SICH SELBST** — die Tore messen den Code, nichts misst die Tore; Reward-Hacking (DGM-Knoten 114) ist bei uns als F2/F4 registriert, F2 kehrt aber in 8 Unterfällen wieder. Eigener Beleg für E8 der Forschung: Jules-Suggestions 3 von 76 ≈ 4 %. Vier Ableitungen als **Vorschlag, nicht gebaut** (Tor-Bewährungs-Zähler mit 90-Tage-Rückbauregel · Wiedervorlage-Datum für Prosa-Regeln · Prozess-Kennzahlen mit Trend · geplanter Kuratierungslauf); Entscheid David. Negativbefund: **keine Studie vergleicht «Agent pflegt Regeln» vs. «Mensch pflegt Regeln» im Einzelprojekt.** Pflegebedarf: Kennzahlen sind Momentwerte 15.9.2026 ohne Generator — nachmessen, nicht fortschreiben. **Status: ERSTRECHERCHE** (einfach belegt, keine Gegenprüfung — kein Risikopfad).

- [Turso-Schreibkontingent 15.9.2026 (Mail «Writes Blocked» — Zählweise, Messung, Wurzel-Fix)](betrieb/turso-schreibkontingent-2026-09-15.md) — Quelle: Turso-Preisseite (FAQ «rows written», Abruf 15.9.2026) + eigene Messung am lokalen HOT-Artefakt (`npm run datenhaltung:build`, Stand `daten-manifest.json` 14.9.2026), die die Gesamtzahl des CI-Laufs 14.9.2026 16:10 UTC exakt reproduziert. Regel deterministisch: **ein Voll-Sync schreibt 171 065 Zeilen** (Basis 63 648 · `fts_artikel`-Schatten 67 908 · `fts_entscheide_schaufenster`-Schatten 39 509), und er lief bei JEDEM Push auf main — **39 Läufe 1.–14.9.2026 = 6 671 535 Zeilen**, obwohl es in denselben 14 Tagen nur **7 Korpus-Änderungstage** gab (davon 2 mit Rechtsprechung). «Gesperrt» heisst **nicht** Ausfall: Lesen ist nie gedeckelt, `api/suche` lieferte am 15.9. HTTP 200 mit Treffern — die Suche wird nur nicht mehr frisch; die Sperre kommt als stmt-Fehler «Operation was blocked: SQL write operations are forbidden» INNERHALB einer HTTP-200-Antwort (Sonde Lauf 34948342923), nie als HTTP-Status. Wurzel-Fix `QS-TURSO-SCHREIBVOLUMEN`: Tageslauf statt Push-Trigger + Tabellen-Skip über `sig_<tabelle>` (Ziel-DDL + Inhalt) ⇒ dieselben 14 Tage kosten **1 000 078 statt 6 671 535 Zeilen = Faktor 6,7**. **Das §17-Ziel «≥ 10×» ist damit rechnerisch NICHT erreicht** (der Faktor hängt an der Zahl der Änderungstage: k=7 ⇒ ~11×, k=15 ⇒ 5,4×); das Erfolgsmass «≤ 1 Rebuild je Änderungstag, sonst nur 12 Marken» ist erfüllt. Geltung/Ausnahmen: Zeilen, nicht Turso-«rows written» (Index-Zeilen zählen zusätzlich, auf beiden Seiten gleich); Delta-Sync innerhalb einer Tabelle bleibt bewusst aus (Weiche C, §10(7)). Pflegebedarf: **entfällt mit dem VPS** (kein Zeilenkontingent mehr). **Status: ERSTRECHERCHE + Bau; Nachmessung in der Turso-Konsole (Oktober, David) offen.**

- [CI-Minuten-Sparplan 8.9.2026 (Auftrag David: privat schalten? Prüfstrasse sparsamer?)](betrieb/ci-minuten-sparplan-2026-09-08.md) — Vollerhebung 30 Tage (1998 Läufe, 15'647 Jobs): **61'381 abgerechnete Minuten/Monat**, davon `ci.yml` **97,5 %**, darin die 8 e2e-Shards **76,9 %** (47'209 min); Free-Kontingent 31×, Pro-Kontingent 20× überschritten. Sparplan M1–M5 (main-Push-Doppellauf kürzen, Dependabot-Rebase abstellen, Shards 8→4, Doku-Sammel-Kontext, Plan-Buchung-Reihenfolge) spart **24'300 min/Monat ohne Prüftiefe-Verlust** — bleibt bei 37'081 min, **31× Free / 12× Pro, reicht nicht annähernd**. Wurzel `strict: true` ⇒ nur eine Merge Queue (David-Gate `QS-ORG-UMZUG`) spart strukturell mehr. **Verdikt: öffentlich bleiben ist die einzige Null-Kosten-Option; privat + volle Prüftiefe geht nur mit Self-hosted Runner (GitHub rechnet dessen Minuten nicht ab); privat + zahlen kostet auch nach Sparplan ~273 $/Monat.** «Öffentlich, aber unauffindbar» funktioniert nicht (kein `noindex`, GH-Archive-Dumps, Mirror-Klone). **Status: ERSTRECHERCHE** (Zahlenerhebung, keine Gegenprüfung nötig — kein Risikopfad).
- [Testapparat-Fang-Historie 31.8.2026 (QS-EFFIZIENZ · Ent-Regulierung Runde 2)](betrieb/testapparat-fang-historie-2026-08-31.md) — gemessene Kostenverteilung der Prüfstrasse (CI-Lauf 33344001148: e2e-Shards 2737 s = **73 %**, alle ~45 `check:*` zusammen 101 s ⇒ der Hebel ist e2e, nicht die Tore) + Rot-Historie aus 60 lokalen Tor-Läufen (42 von 50 Toren 0× rot). Sechs Streich-Kandidaten mit Chesterton-Gegenargument, Tabu-Liste Rechtsdaten/Rechtslogik, Flake-vs-Defekt-Einordnung der letzten 10 CI-Failures. **Kernbefund: es gibt kein Fehlerbuch, das Fänge Tests zuordnet — 1 belegter e2e-Fang in 116 Specs; jeder Testapparat-Rückbau bleibt bis auf Weiteres Indizienarbeit.** Nachtrag 31.8. (Ist-Verifikation am Code `337d2c9ef`): V3-Alleinbetrieb bestätigt, «V2-Erbe» in `leser-kopf-v2`/`leser-kopf-paritaet` WIDERLEGT (beide prüfen den ausgelieferten V3-Stand), `check:inventur`-Leiche existiert nicht mehr. **Status: ERSTRECHERCHE — Abnahme-Status «Indizien, kein Fang-Protokoll vorhanden».**
- [CLAUDE.md-Gutachten 7.8.2026 — unbefangenes Fremd-Review](betrieb/claude-md-gutachten-2026-08-07.md) — frischer Fable-Agent ohne Session-Vorwissen, Stand main: Note «gut mit Verbesserungen — nahe an optimal», 15/18 §§ behalten; Lob für maschinelle Durchsetzung (§2-Lint, §6.7). Fünf Funde, alle am selben Tag umgesetzt (`53fb09e9d`): gegenpruefung-Skill ins Repo (deckungsgleich mit Ent-Regulierung — zwei unabhängige Prüfer), §3↔§4-Widerspruch aufgelöst, §18 Geheimnisse neu, §17 gestrafft, Intro-Doppelung weg. **Status: einfach belegt.**
- [Gliederungs-Performance-Diagnose 8.8.2026](betrieb/gliederung-perf-diagnose-2026-08-08.md) — Davids Harzig-/Sprung-/Zuklapp-/Hervorhebungs-Befunde am Gesetzes-Leser empirisch zerlegt (Opus, read-only, A/B-Messungen): Wurzel ist der Hover-Dimm-Effekt der LESESPALTE (1686 simultane Transitionen, 142k Ereignisse/7 s, TBT 8.9 s @4× — Maus am Rand: 0/0.3 s), dazu totes Auto-Zuklappen (0 Ereignisse, Baum wächst 18→140 Zeilen ⇒ die «komischen Sprünge»), unmemoisiertes Baum-Rendering (11 075 Knoten, Klick 231 ms) und sechsfache aria-current-Goldfläche. B4-N1 als Ursache widerlegt. Fix-Paket F1a/F2–F5 definiert. **Status: einfach belegt.**
- [Gliederungs-Perf-Nachmessung 9.8.2026 (DoD-Beleg W2·19 S1–S7)](betrieb/gliederung-perf-nachmessung-2026-08-09.md) — Burst-Kadenz @4×: TBT 8.9 s→232 ms (−97.4 %), Transitionen 142k→377, 60 fps, TOC-DOM −98.5 %, genau EINE Positionsmarke; Hover-Aufschlag U1 verschwunden (Text=Rand). Restposten: Klick-Pfad 161 ms @4× (OR/BGFA-Verhältnis 7→14.6 verschlechtert) und Lese-Kadenz-TBT ~10 s @4× (U3-Rest, nur langsamste Geräte). Kadenz-Messvorschrift als §17-Lehre in den Tabellenköpfen. **Status: einfach belegt.**
- [a33-Lese-Scroll-CLS: Alt-Flake mit Zielkonflikt 9.8.2026](betrieb/a33-lesescroll-cls-altflake-2026-08-09.md) — der bei der W2·19-Landung gefundene rote a33-Fall ist per Nullprobe ein Alt-Mangel auf main (4/20 kalt, identisch mit/ohne Umbau): das Auto-Akkordeon (Auftrag K 26.6.) wächst beim Lese-Scroll ~780 px IM Sichtband, Chromiums 500-ms-Input-Fenster entscheidet per Timing-Los über rot/grün; Messbedingung kalt/warm ist Teil der Wahrheit (kalt 2–4/20, warm 0/40). Zielkonflikt Auftrag K ↔ CLS-Kontrakt wartet auf David (drei Wege a/b/c). **Status: einfach belegt.**
- [Skill-Diät 8.8.2026 (QS-SKILL-DIAET) — Konsolidierungs-Protokoll](betrieb/skill-diaet-2026-08-08.md) — vier Skills am Übergang Bau → Landung → Abschluss (bauschritt-D/E, landung, deploy-check, aufraeumen; real 663 Z., nicht ~1500) auf zwei konsolidiert: `landung` trägt jetzt §12 UND §9 (deploy-check aufgegangen), `bauschritt` trägt Pfadwahl (leichter Pfad für sortenreine Nicht-Risiko-Fix-Batches), Station W (Weiterbau-Regel a/b/c) und `aufraeumen.md` als On-Demand-Referenzdatei. Zeilen-Konkordanz mit Löschkriterium je nicht übernommener Zeile (verschoben/dedupliziert/abgelöst), inkl. Versöhnung des dokumentierten `--auto`-Widerspruchs. **Status: einfach belegt.**
- [Ent-Regulierungs-Analyse 7.8.2026 (QS-SELBSTOPT)](betrieb/entregulierung-2026-08-07.md) — Tore/Hooks/Regelwerk gegen das Löschkriterium «würde das Fehlen einen realen Fehler verursachen?» geprüft, mit Laufzeitmessung (43 seriell-Tore parallel: 16,0 s; `gate:schnell`: 37,7 s statt dokumentierter ~7 s) und Provenienz-Pflicht. Umgesetzt: `report:tot`, `check:rss-oc` verdrahtet, `gate.sh`-Doku, §6.6-Split. Zwei Streich-Prämissen am Ist-Zustand widerlegt (`check:confidence` kein Waise, `check:suchindex`-Verdrahtung wäre F2a). **Vier Posten warten auf David** (Stop-Hook-Frequenz, `tor-schutz.py`-Patch, §16-Kurzform, Dispatch-§0-Prüfvariante). **Status: einfach belegt.**

- [Code-Inventur 4.8.2026 — Logik/Darstellung/Pipeline (QS-CODE-\*)](betrieb/code-inventur-2026-08-04.md) — drei read-only Explore-Analysen am Stand `2c4d97e54`: Bestand strukturell gesund (0× `any`, kein §3-Verstoss, Infra zentralisiert); Hebel: Turso-FTS-Durchsatz (~3.7× Reserve), Suchindex-Monolith 45.9 MB (Budget 91 %), `fristenEngine` mit 6 Testfällen, Entdopplung Darstellungsschicht (D1–D7), 6 Grossdatei-Splits. Bau-Specs: `fahrplaene/FAHRPLAN-CODE-VERBESSERUNG.md`. **Status: entwurf** — zwei David-Fragen offen (Manifest-Nullzeilen, `normalisiereTarifText`-Freigabe).

- [VPS-Bestell-Dossier (QS-BASIS B-5)](betrieb/vps-bestell-dossier-2026-07-17.md) — 3 live-verifizierte Angebote (17.7.2026), Empfehlung netcup RS 4000 G12; entsperrt E3-Serving/E4-Zitatgraph. **Blocker: Bestellung durch David.**
- [VPS-Neubewertung 8.9.2026 (Auftrag David: «eruier nochmals, was genau der beste VPS ist»)](betrieb/vps-auswahl-2026-09-08.md) — Neuprüfung gegen FAHRPLAN-DATENHALTUNG §13/§14 + ci-minuten-sparplan §3: **netcup RS 4000 G12 CHF 31.55 netto/Mt** unverändert bestätigt, Abstand zu Hetzner **vergrössert** seit dessen Preisrunde 15.6.2026 (CCX-Cloud ×2,2–2,7 teurer, Dedizierte neu strukturiert); Exoscale CH-Standort aber **CHF 352/Mt** (11×). Runner gehört **nicht** auf den Serving-Host (öffentliches Repo, GitHub warnt vor Self-hosted-Runnern bei Fremd-PRs); Storage Box BX11 CHF 3.01/Mt als Drittziel. Entscheid David 8.9.2026 dokumentiert (netcup + Mac mini als Prüfrechner, Bestellung So 13.9.2026). **Status: ERSTRECHERCHE.**
- [Serverlose Alternativen zum VPS 8.9.2026 (Auftrag David: «gibt es keine anderen Techniken?»)](betrieb/alternativen-serverlos-2026-09-08.md) — Gegenrechnung Weg B (Meilisearch/Typesense/Algolia/Elastic — keiner liefert live einen Endpreis für unsere 195k-Dokument-Grösse ohne Sales-Kontakt, geschätzt CHF 150–450+), Weg C (Fly/Railway/Render, 2–7× netcup, gleicher Betriebsaufwand wie VPS + Plattform-Lock-in), Weg D (Turso Pro CHF 341 zu teuer; Supabase/Neon CHF 25–40 günstig, aber FTS5→Postgres wäre Umbau der Rechenlogik, Gold-Testsatz `suche-eval-gold` müsste neu bestätigt werden). Objektspeicher/Backup (Vercel Blob, R2, Storage Box) sind in jedem Weg Pfennigbeträge. **Verdikt: Weg A (VPS) bleibt bestätigt** — einziger Weg ohne Code-Umbau und ohne Suchqualitäts-Risiko, zugleich günstigster. **Status: ERSTRECHERCHE.**
- [e2e-Flake-Forensik — drei 2-vCPU-Rotfälle (QS-PERF)](betrieb/e2e-flake-forensik-2026-07-26.md) — **Erstrecherche 26.7.2026:** je 4 gemessene Läufe im CI-Zweig zu den drei als 2-vCPU-flaky belegten e2e-Tests. Zwei Deckel kalibriert (`leser-kopf-a9` 5000 → 8000 ms nach der `QS-PERF`-Ziff.-5-Politik, mit Sabotage-Probe rot gezeigt; `gesetze-ia-v2-walks`-Kopfzeile 10 → 30 s, Wartezeit gemessen 11.4–12.2 s). **Dritter Fall als Flake WIDERLEGT:** `norm-sprung` A9 zeigt einen reproduzierbaren **bimodalen ~48-s-Stall** (≈12 s un-gedrosselt) ohne jede Contention, Test-Instrumentierung per Gegenprobe als Ursache ausgeschlossen — **nicht gehärtet**, Ursache offen; Signatur-Hypothese: dieselbe Wurzel wie der offene `QS-PERF`-Befund «OR-LCP ist bimodal»

- [Fremde Bau-Agenten unter Google AI Pro (QS-FREMDAGENTEN, 2./3.9.2026)](fremdagenten-google-ai-pro-2026-09.md) — **ERSTRECHERCHE**, drei read-only-Unteragenten (Hersteller-Doku Google + arXiv, Abruf 2./3.9.2026): was Jules (100 Tasks/Tag, liest `AGENTS.md` im Root, baut in eigener VM), die Antigravity CLI `agy` (1.1.24, `--mode plan` = Nur-Lese, Grundlast ~20–30k Input-Token pro Aufruf, Permissions NUR global) und die Gemini-App im Bau leisten können. Kernbefund: die **Review-Richtung** ist asymmetrisch belegt (arXiv 2607.21656v1 — Claude reviewt Codex +18.1 pp, umgekehrt −8.6 pp) ⇒ «Fremde bauen, Claude prüft» ist die Richtung, «Gemini prüft Claude» nur gezählter Messversuch. Negativbefunde: Gemini-API **nicht** im Abo, Gemini-CLI-Privatkonto-Login eingestellt (18.6.2026), MCP-Brücken experimentell (nicht übernommen), kein Vorbild für das Gesamtmuster. Trainings-Opt-out von David gesetzt 3.9.2026 = Betriebs-Voraussetzung. **Vertieft 3.9.2026** (Ziff. 8–10): Jules-Steuerwege inkl. REST-API v1alpha und Critic-Agent, undokumentierte Timeouts/Branch-Muster/Secret-Handling, offiziell nur Englisch · agy-Flags und fünf belegte Issues (#45 kein Read-only-Boden headless, #76/#115/#318 stdout, #581 stiller Modell-Fallback), Kontingent-Praxis 6–10-Tage-Lockouts statt 5-h-Fenster, offene Mindgard-Meldung ⇒ keine Schreibrechte, «Erfolg ohne Tat» mehrfach unabhängig belegt · Prüfer-Literatur (Recall ist der Schwachpunkt, Judge-Bias strukturell, Multi-Needle bei 1 Mio nur 89 % ⇒ Einheit ist der Erlass), Zitatfehler 17–34 % · Ökosystem-Belege inkl. «Lassen»-Gründen (GA4/EDÖB, Firebase-Studio-Einstellung, Custom Search bis 1.1.2027). Verdrahtet in `AGENTS.md` + [FAHRPLAN-FREMDAGENTEN.md](../fahrplaene/FAHRPLAN-FREMDAGENTEN.md); keine §7-Abnahme nötig (Prozesswissen, speist keine Engine)
- [CI-Fehlerklassen K1–K13 — Diagnose Phase A (3.8.2026)](ci-fehlerklassen-2026-08-03.md) — **Entwurf 3.8.2026**, Quelle «CI-Diagnose Phase A, Session 3.8.2026, 80 Läufe»: je Klasse Symptom · Wurzel · Fix/Status · Beleg-Run-ID. Belegt sind **9** Klassen (K1/K2/K3/K5/K6/K7/K11/K12/K13, behoben mit PR #419 `02df51a0a`) plus zwei Fixe ohne K-Nummer (Kanonik-Selbstheilung, stiller `fedlex-cache.sh`-Fallback). **K4/K8/K9/K10 tragen im Repo keinen Beleg** und sind bewusst NICHT rekonstruiert (§8). Dazu sechs abgeleitete Regeln (u. a. «ein Melder, der sich selbst überwacht, meldet seine eigene Vergangenheit») und der Pflegehinweis, dass GitHub Lauf-Logs nach 90 Tagen löscht
- [/sandbox prüfen — Bash-Sandboxing-Recherche (QS-HOOKS-AUSBAU Punkt 4, 14.8.2026)](recherche/sandbox-pruefung-2026-08-14.md) — amtliche Doku (code.claude.com/docs/en/sandboxing, Abruf 14.8.2026) + lokal verifiziert (`/usr/bin/sandbox-exec`, macOS 26.5.2, Claude Code 2.1.220): Seatbelt-Sandbox produktiv nutzbar, zwei Schichten (Filesystem/Network) + Credentials-Abschirmung, komplementär zu `permissions.allow` (Permissions = OB ein Tool läuft, Sandbox = WAS ein laufender Bash-Befehl anfassen darf; Read/Edit/Write/MCP laufen nicht durch die Sandbox). Dokumentierte Fallstricke (gh/gcloud/terraform-TLS, npm-Allowlist, docker inkompatibel, jest `--no-watchman`, git-merge-Unlink an geschützten Pfaden). **ENTSCHEID: jetzt nicht aktivieren** (Prozess-Delegation Audit-P8 8.8.2026, David-Veto möglich) — `gh` trägt die Landungs-Kette, ein TLS-Bruch dort kostet jede Landung; die belegten Vorfallsklassen sind bereits durch PreToolUse-Hooks + `permissions.allow` gedeckt. Wiedervorlage: TLS-Fallstricke als behoben dokumentiert ODER realer Vorfall «unbeabsichtigter Fremdzugriff». **Status: einfach belegt.**

## Verwandtes im Repo (nicht hier dupliziert)

- `src/lib/fedlex.ts` — verdrahtete Fedlex-Basis-URLs + Anker-Logik
- `src/data/verifikation.ts` — Rechtsprechungs-Register (BGE/BGer)
- `src/lib/vorlagen/behoerden.ts` — abgenommene Behörden-Stammdaten (BS)
- `STRUKTUR.md` — Gesamtstand · `KATALOG-ROADMAP.md` — Soll-Inventar
- [GlG-Schlichtungsstellen aller 26 Kantone](behoerden/glg-schlichtungsstellen-kantone.md) — Art. 200 Abs. 2 ZPO: je Kanton Norm WÖRTLICH + amtliche Stelle/Adresse (16 eigene · BE-Konzentration · GE/JU/VD Arbeitsgerichte · 7 ordentlich-paritätisch); Vollerhebung 11.6.2026, Abnahme ausstehend
- `recherche/selbstoptimierender-bau-2026-08-05.md` — Web-/GitHub-Recherche «Bau optimiert sich selbst»: GitHub-native Actions-Metrics (GA 3/2025), gh-aw-Safe-Outputs-Muster, skill-creator-Evals, DORA-Werkzeuge; 6 priorisierte LexMetrik-Vorschläge (Mess-Zeitreihe zuerst, Cron-Retro zuletzt), 3 bewusste Absagen (SaaS/§5, Auto-Merge/§17, Rechtslogik nie selbstoptimierend); Runde 2: Anthropic-Primärquellen (Löschkriterium, Halbjahres-Entrümpelung, Gotcha-Skills), Reflexion/Voyager/DGM/AlphaEvolve, Reward-Hacking-Zahl 0.94-vs-0.20, Goodhart — Essenz: Ent-Regulierung gleichwertig, Fitness nur deterministisch; 5.8.2026
- [State-of-the-Art-Abgleich selbstoptimierender Bau (QS-SELBSTOPT)](recherche/state-of-the-art-abgleich-2026-08-07.md) — Fortschreibung der Recherche vom 5.8.: 16 Quellen (Anthropic-Doku/Engineering, Willison), Abruf 7.8.2026. Befund: tragende Muster decken sich mit dem dokumentierten Stand (deterministische Tore = härteste empfohlene Variante; §14.7 inzwischen Produktverhalten; Auto-Merge-Absage durch Anthropics eigene 17-%-Fehlerquote belegt). 8 priorisierte Lücken — Token-Messung via lokalem OTel (eingebaut), SubagentStop-/SessionEnd-/ConfigChange-Hooks, `.claude/rules/`-Pfad-Scoping, Stop-Hook-Obergrenze (8 Blocks) — und 4 begründete Nicht-Übernahmen (Agent-Teams ~7× Token, Auto-Memory, Community-Selbstverbesserer, SaaS). **Status: einfach belegt**; 7.8.2026
- `recherche/zefix-api.md` — Zefix-REST-API + UID-Prüfziffer eCH-0097 für den UID-Lookup in Vorlagen (CORS/CSP, Felder, Handprobe; 11.6.2026)
- [Fremdquellen-Sichtung 2.9.2026 — «Verwenden statt bauen»](recherche/fremdquellen-sichtung-2026-09-02.md) — ergänzt die Sichtung vom 1.9.2026 (opencaselaw/CLDS/SCD dort bereits erfasst): 19 Unteragenten-Sichtungen (GitHub-Topic legal-tech, awesome-Listen, Fedlex-SPARQL-Tutorials, SHAB/UID/SNB/RIS-AT/NeuRIS-DE live geprüft), Rangliste 20 Bau-Schritte + 10 Chancen + Förder-Frist (Prototype Fund Schweiz, Portal schliesst 6.9.2026), dazu Korrekturen falscher Prämissen und Verworfenes mit Grund; in die Roadmap integriert 6.9.2026 (Nachtrag-Tabelle am Dateiende: W2·22, QS-VERWENDEN V1–V12, K-15/K-16, M15/M16, W2·8, W3-AUSBAU; Produktentscheide Browser-Erweiterung/MCP geparkt, wartet auf David) (absorbiert die Sichtung vom 1.9.2026)
- [pagefind-Spike 2.9.2026 — QS-VERWENDEN V8](recherche/pagefind-spike-2026-09-02.md) — Wegwerf-Worktree-Messung gegen `dist/gesetze` (main-Stand 2766c8dd7): prerenderte Seiten führen vollen Artikeltext (Bund+Kanton), Lazy-Chunk-Suche 130–630 KB/Anfrage statt heutigem Fix-Download 5.3/10 MB gzip, aber Trefferqualität ohne Norm-Sprung-Parser schwächer (Top-1 2/5 n=5) und Bund/Kanton ungewichtet; Verdikt **nicht ersetzen, nur als Kanton-Volltext-Ergänzung mit Scoping/Gewichtung/Re-Ranking, Aufwand mittel, §5-Spannung**; Status entwurf, kein Bau ausgelöst
- [Rules-as-Code-Sichtung 5.9.2026 — OpenFisca-Aotearoa und Catala gegen unsere Tarif-Stammdaten](recherche/rules-as-code-sichtung-2026-09-05.md) — drei read-only-Sichtungen (Auftrag David): OpenFisca-Aotearoa (NZ, AGPL, halb eingeschlafen; Muster: Norm-Anker je Wert-Änderung, `formula_<datum>`, YAML-Zeitreihen-Test) und Catala (Inria, Apache-2.0, v1.2.1; Regel/Ausnahme als Sprachkonstrukt, Z3-Beweis, kein JS/TS-Backend, 5-MB-Bundle, kein Deutsch) gegen den Ist-Stand `src/data/tarif/**` (~950 Einträge: Quelle/Anker je Eintrag vorhanden, aber `stand` nur Anzeigetext in ≥4 Formaten, keine Zeitachse, kein Tarif-Drift-Tor; Präzedenz SG-2808). Direkt verwendbar nur Catalas `dates-calc`-Semantik; alles andere als Muster. Kein RaC-Projekt CH belegt. Bau-Vorschlag §6 → Roadmap `W3-TARIF-STAND`. **§8 Repo-Suche Gemini ∥ Sonnet (5.9.2026):** 12 belegte Funde, einziger Direkt-Nutzen legalize-ch (5 139 SR-Erlasse als Git-Historie, MIT/gemeinfrei) als Test-Orakel für den Bund-Korpus; Gemini nannte 2 nicht existierende Repos und 3 falsche Lizenzen (Messzeile FAHRPLAN-FREMDAGENTEN §5). ERSTRECHERCHE 5.9.2026, keine fachliche Abnahme nötig.
- [Fremdnutzen-Suchrunde 2 (6.9.2026) — amtliche Rechner als Orakel · amtliche Sprachdaten · Bedienmuster der Gesetzesportale](recherche/fremdnutzen-suchrunde-2-2026-09-06.md) — drei parallele Sonnet-Recherchen (Auftrag David «können wir sonst noch von fremden sachen profitieren?»): (1) **Negativbefund** kein interaktiver amtlicher Gebührenrechner in 26 Kantonen/BGer, Golden nur VS-Excel 2025, SG-Notariatstabelle, BGer-Tarif, kantonale Existenzminimum-PDF; (2) TERMDAT via LINDAS-SPARQL (Lizenz offen), Fedlex-eId-Konsistenz DE/FR/IT unbelegt, MIT-Stemmer für die Suche, rcds-Korpora nur als Testdaten; (3) 12 Bedienmuster aus 8 live geprüften Portalen, 3 neu in die Roadmap (Nachbar-Artikel-Pfeile, Rohdaten-Link, Diff-Tab), BEKJ ohne Formatvorgabe, kein Zotero-Translator für fedlex/bger. ERSTRECHERCHE 6.9.2026; wartet auf David: TERMDAT-Lizenzanfrage, FR/IT-Reihenfolge.
- `recherche/fedlex-abkuerzungen-titleshort.md` — amtliche DE/FR/IT-Erlass-Abkürzungen aus Fedlex `jolux:titleShort`: die verifizierte SPARQL-Kette hinter `src/lib/normtext/abk-aliase.generated.ts` (W2·6-NKEY b) — Datentyp-IRI-Pflicht, Currency-Fenster gegen Schatten-Abstracts, COUNT-Gate gegen stille Teilergebnisse, Regenerier-Befehl; 200/230 SR, 28.7.2026. Nachtrag: Drift-Tor `check:fedlex-abk-netz` (zwei verschieden zusammengesetzte Nachfragen + Positivkontrollen) + Regel 5 (stille, zusammensetzungsabhängige Kappung mit passendem COUNT), Divergenz GFK/FK offen, 30 SR ohne `titleShort` namentlich, Korpus-Kandidaten
- [Agenten-Bauplanung SotA 08/2026 (QS-EFFIZIENZ · BAUPLAN-UMBAU)](betrieb/agenten-bauplanung-sota-2026-08-15.md) — Web-Recherche 15.8.2026 vor dem Bauplan-Umbau: OpenSpec-Muster «Delta-Spec + archive on apply» (→ Fahrplan-§-Diät aufraeumen.md §4b), Status-Pflege als Teil des Task-Abschlusses (Beads/Backlog.md), ETH-Studie gegen nacherzählende Kontextdateien (→ Kurzkarten-Default); «ein Task pro Session» bewusst nicht übernommen (Massstab 15.8.). **Status: entwurf** (Prozess-Wissen, keine Abnahme nötig).
- [Design-Identität, Nicht-KI-Webdesign, Bildschirm-Lesbarkeit — Fremdagenten-Recherche 5./6.9.2026 (W2·24-DESIGN-IDENTITAET)](recherche/design-identitaet-2026-09.md) — drei Aufträge parallel Gemini ∥ Sonnet: (1) Farb-/Schriftidentität Amtlich-Schweiz (nur Gemini belegt, Sonnet-Gegencheck fehlt), (2) Nicht-KI-Webdesign-Merkmale/Gegenmittel/Referenzen (Sonnet 15+15 Punkte je einzelbelegt, 35 849 Token/125 s; Gemini 10+10 mit Sammelquelle), (3) Bildschirm-Lesbarkeit/D12-Token-Werte (Sonnet 45 162 Token/167 s, selbst nachgerechnete WCAG-Werte; beide Agenten inhaltlich deckungsgleich). Divergenzen aufgelöst: Inter als neutral UND KI-Verwechslungssignal (beides belegt, kein Widerspruch), Creme/Gold als KI-Signal bei Gemini behauptet, bei Sonnet ausdrücklich unbelegt (§7: Sonnet massgeblich), Fedlex/NZZ als Referenz bei beiden ohne Fundstelle zur konkreten Behauptung (offen). D12-Token-Werte (Papier/Tinte hell+dunkel, Gewicht 450–500, opsz) direkt aus Sonnet-Lesbarkeitsrecherche in `w224-pruef-r2-funde.md` §D12 übernommen. **Status: einfach belegt je Aussage, keine eigene Gegenprüfung** — Abnahme David, Bau W2·24.
