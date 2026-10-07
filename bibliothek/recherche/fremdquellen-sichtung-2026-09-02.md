# Fremdquellen-Sichtung 2.9.2026 — «Verwenden statt bauen»

**Anlass:** David, 1./2.9.2026: acht Links (GitHub-Topic legal-tech, awesome-legaltech, droid-f/fedlex, awesome-open-legal-switzerland, awesome-ogd-switzerland, SwissFederalArchives/LD-Tutorials, swiss-legal-renewal-radar, Legal-Text-Analytics, openlex-mcp), dann Weisungen «suche selbst» · «auch Chancen, nicht nur Lücken» · «Sachen, die wir verwenden können und nicht selbst bauen müssen» · «in verschiedene Richtungen» · «auch zum Datenmanagement» · **«noch nichts einbauen, erst mal sortieren»**.
**Methode:** 19 Unteragenten-Sichtungen (Opus/Sonnet, read-only), Metadaten per GitHub-/npm-/HF-API, amtliche Endpoints live geprüft (Fedlex-SPARQL, SHAB, UID, SNB, RIS-AT, NeuRIS-DE). Alle Zahlen Stand 2.9.2026.
**Stand:** Dokumentation. Kein Code, keine Roadmap-Änderung — Priorisierung wartet auf David.
**Abnahme-Status:** entwurf (Recherche, keine fachliche Abnahme nötig; Lizenz-Einordnungen sind Einschätzungen, keine Rechtsauskunft).


**Ergänzt:** die Sichtung vom [1.9.2026](#0-vorsichtung-192026-absorbiert) (opencaselaw/CLDS/SCD dort bereits erfasst; seit 2.9.2026 in Abschnitt 0 dieser Datei absorbiert, vormals eigene Datei, PR #615) — diese Runde bringt 19 neue Sichtungen, eine Rangliste (20 Bau-Schritte) und 10 Chancen; Priorisierung wartet auf David.

---

## 1. Rangliste — lohnt Bauarbeit (wartet auf David)

Sortiert nach Ertrag × Aufwand. «Risiko» nach `istRisikoPfad()`: Verweise/Korpus/Rechnen = Gegenprüfung Pflicht.

| # | Schritt (Vorschlagstitel) | Wirkungsbereich | Fund / Quelle | Warum | Risiko |
|---|---|---|---|---|---|
| 1 | **Erlass-Verweis ohne Artikelnummer verlinken** («richten sich nach der ZPO», «des Datenschutzgesetzes vom 25.9.2020») | Gesetzes- & Urteilsdaten | Abgleich gegen Fedlex `jolux:Citation` (OR-Stichprobe: 13/13 LexMetrik-Links amtlich bestätigt, 0 falsch; 59 Nur-Fedlex-Fälle, davon diese Klasse die einzige echte Lücke) | Positivliste V-7 kennt die Namen, wertet sie aber nur hinter «Artikel N» aus | Risikopfad |
| 2 | **Fedlex-Zitatgraph als Warn-Bericht + «zitiert von»-Schicht (nur Bund)** | Gesetzes- & Urteilsdaten | `jolux:Citation`, 3 163 348 Objekte, Rückwärts-Abfrage via `citationToRs` ~0,1 s/Erlass; Build-Zeit-Artefakt `messwerte/fedlex-zitatgraph.json` | Ersetzt die Heuristik **nicht** (kein Artikel-Ziel, 97 % aus Fussnoten); einseitiges Orakel «LexMetrik behauptet X, Fedlex kennt X nicht» + Rückverweise auf Erlassebene. Erst nach #1 | Risikopfad |
| 3 | **Lizenz-Tor: Allowlist + SBOM** (Muster NeuRIS `allowed-licenses.json`; cyclonedx-node-npm) | Auslieferung & Prüfstrasse | Diese Sichtung selbst: die besten Reader-Bausteine sind LGPL/GPL/NOASSERTION | Billig, scharf, §6.7-beweisbar (einmal GPL-Paket einfügen → rot). Muss **vor** jeder Komponenten-Übernahme stehen | gering |
| 4 | **Fassungs-Drift-Tor für PDF-Snapshots** (ROADMAP Z. 211, SG-2808) | Auslieferung & Prüfstrasse | LexWork-Adapter liefert `current_version` bereits | Keine externe Quelle nötig, billigster §17-Wurzel-Fix der Liste | gering |
| 5 | **Sprengel-Zuordnung Bern aus amtlichen Geodaten** | Gesetzes- & Urteilsdaten | opendata.swiss «Regionalgerichte», «Regionale Staatsanwaltschaften» (Amt für Geoinformation BE, GPKG/Parquet) | Macht `zustaendigkeitKantone.ts` deterministisch; BE = nächster Kanton nach ZH/BS (§5 FAHRPLAN-KANTONE) | Korpus |
| 6 | **Kantonale Materialien BS/ZH an die Botschaften-Pipeline** | Gesetzes- & Urteilsdaten | BS: Grosser Rat Geschäfte/Dokumente (CSV/JSON/RDF); ZH: `parlzhcdws.cmicloud.ch` (XML, `license_title: None` → klären) | Bund-Pipeline `check:botschaften-netz` existiert; Erlass ↔ Vorstoss/Weisung | Korpus |
| 7 | **Fedlex-Fussnoten als Änderungsgeschichte je Artikel** | Gesetzes- & Urteilsdaten | AKN `<ref>` im OR: 2 315, **alle** in `<authorialNote>`, 2 236 davon AS/BBl-Fundstellen; `adapter-htm.ts:109,190,740` strippt Fussnoten | Der grössere Datenschatz hinter dem Zitatgraph; heute weggeworfen | Korpus |
| 8 | **Korpus-Delta: `sqldiff --changeset --vtab` + `node:sqlite` Session** | Datenhaltung | SQLite-Kernwerkzeug (Public Domain); Session in Node 24.16 vorhanden | Turso-Delta statt Voll-Rebuild (61k Zeilen), Prerender nur geänderter Erlasse. **Nur ergänzend** — Voll-Rebuild ist bewusst gewählt, Manifest bleibt Nach-Beweis | gering |
| 9 | **Raw-Store für Fedlex-Rohdaten** (GitHub Releases, 2 GiB/Datei, keine Bandbreitenkosten; + `actions/attest-build-provenance`) | Datenhaltung | `scripts/fedlex-cache.sh` cached nach `/tmp` («überleben Neustarts nicht») | «Raw ist Golden, nie re-crawlen» ist für Bund faktisch **nicht** erfüllt; zieht Fedlex eine Fassung zurück, ist die Extraktionsgrundlage weg | gering |
| 10 | **DB-Artefakt aus GH-Actions-Cache** (Schlüssel = `daten-manifest.json`-sha) | Auslieferung & Prüfstrasse | 683 MB DB-Bau je CI-Lauf; 10 GB/Repo gratis | Schlüssel existiert, wird nur nicht benutzt | gering |
| 11 | **pagefind-Spike gegen `suche-eval-gold`** | Auslieferung & Prüfstrasse | pagefind 1.5.2 MIT, 5 436★ | Index-Fragmente statt Vollindex — genau das Problem hinter QS-BASIS (d) (−4.66 MiB gzip, Kanton gestrichen). Erste Frage: führen prerenderte Seiten den vollen Artikeltext? | gering |
| 12 | **JSON-LD vervollständigen: `legislationDate`/`legislationLegalForce`/`legislationChanges`** | Gesetzes- & Urteilsdaten | `seo-detail.ts:169` hat `schema.org/Legislation`, Felder bewusst leer («TODO(David)»); NeuRIS-DE liefert amtlich Hydra/JSON-LD + ELI als Vorbild | Reine Projektion aus Konsolidierungsdatum (§5) | gering |
| 13 | **Zitat kopieren nach GTR Anhang 3 + BGer-Zitierregeln, plus RIS/BibTeX/COinS** | Benutzeroberfläche | GTR Anhang 3 (BK, Stand 5.6.2026, amtlich); BGer-Zitierreglement; CSL «juristische-zitierweise-schweizer» existiert. Zotero-Translators für fedlex/bger: **0** | Kein Stil zu erfinden; Eigenbau ist kürzer als `citeproc` (CPAL/AGPL) | gering |
| 14 | **Atom-Feed «geänderte Erlasse» aus dem Korpus-Manifest** (`feed` 6.0.0 MIT) | Auslieferung & Prüfstrasse | Heute kein Feed (`public/*.xml` leer); Änderungserkennung existiert (Manifest + Drift-Tore) | Direktester Nutzen der Drift-Tore für Juristen | gering |
| 15 | **Feiertags-Gegenprobe (nur Test)**: kantonale Formeln vs. OpenHolidays (ODbL, CH bis Gemeinde, `Public` vs. `Optional`) und/oder date-holidays | Rechtslogik & Berechnungen | Fristen-Richtung sonst leer (keine OSS-Fristenlogik, keine Golden-Sets) | §7 verbietet Übernahme; als CI-Diff = Prüfauftrag statt stiller Fehler | Rechnen (Test-only) |
| 16 | **Formprüfung an Datei-Grenzen (valibot 1.4.2)** für Manifeste/generierte JSON | Datenhaltung | heute `typeof`-Handprüfung oder gar keine | Additiv, nie in Engines | gering |
| 17 | **Fassungs-Zeitleiste je Erlass** (point-in-time-Modell legislation.gov.uk, OGL) | Gesetzes- & Urteilsdaten | Fedlex liefert Konsolidierungsdaten inkl. Zukunftsfassungen | Leser-Feature; #12 fällt als Nebenprodukt ab | Korpus |
| 18 | **Sozialversicherungs-Stammdaten**: BSV «Familienzulagen 2026» (26 Kantone) + BSV «Beträge ab 1.1.2026» | Rechtslogik & Berechnungen | amtliche PDF-Tabellen | Reines Nachschlagen (§2); ein Stammdatensatz speist Koordinationsabzug, 3a, UVG-Grenze, EL | Rechnen |
| 19 | **Turborepo + Vercel Remote Cache** (gratis auf allen Plänen) für die teuren Generator-Ketten | Auslieferung & Prüfstrasse | 165 npm-Skripte, kein Task-Graph | Erst nach Messung, welche Tore die Zeit kosten (48 serielle `check:*`) | gering |
| 20 | **Prüf-Roboter als GitHub Actions**: axe-core/Pa11y/Lighthouse-CI (eCH-0059 = WCAG 2.1 AA), lychee (Erreichbarkeit amtlicher Links), REUSE (Lizenz-Linter) | Auslieferung & Prüfstrasse | alle gratis, fertig | Ersetzt nur Transport, nie §7-Inhalts-Drift | gering |

## 2. Chancen — neue Werkzeuge aus amtlichen Quellen (alle live geprüft, keine Bedarfslücke heute)

| Quelle | Format / Lizenz | Was deterministisch baubar wäre | Note |
|---|---|---|---|
| **SHAB-API** `shab.ch/api/v1/publications`, `/rubrics` | JSON ohne Schlüssel; Nutzungsbedingungen nicht publiziert → Art.-5-URG-Einordnung nötig | Fristenrechner auf Publikationsdatum (Schuldenruf, Kollokation, Konkurs-Eingaben); Publikations-Nachschlagedienst | hoch |
| **UID-Register** `uid-wse.admin.ch/V5.0/PublicServices.svc` (WSDL 200) | SOAP/XML, öffentlich (Zefix-REST: 401 seit 7.6.2026 offen) | Partei-Identifikation in Vorlagen: UID → Firma/Sitz/Rechtsform statt Freitext im Rubrum | hoch |
| **SNB-Datenportal** `data.snb.ch/api/cube/<id>` | JSON, amtlich | Stichtagsbezogene Zinsreihen für Verzugs-/Schadenszins | mittel |
| **opencaselaw auf HF** `voilaj/swiss-caselaw` | CC0 (EGMR-Teil nicht), täglich, 1,05 Mio. Entscheide, 10 Mio. Zitat-Referenzen mit Konfidenz | Validierungskorpus für `zitat-extraktion.ts`; Delta-Sweep gegen Stand 2.7.2026 (`archiv/PLAN-OCL-ABBAU.md`) | hoch |
| **RIS-OGD-API Österreich v2.6** `data.bka.gv.at/ris/api/v2.6` | JSON, keyless, ELI; Lizenzseite 404 → offen | Zielauflösung für AT-Verweise in CH-Texten | mittel |
| **Browser-Erweiterung «Schweizer Normzitate überall verlinken»** | Eigenbau-Hülle um bestehende Erkennung | Für CH existiert nichts (DE: lawlink, Jura-Links) | mittel |
| Kantonale Vernehmlassungen BS/SG (opendata.swiss) | CSV/JSON/RDF | Vorwarn-Dienst «welche Norm ändert demnächst» kantonal | mittel |
| Steuerfüsse als Zeitreihe (BL seit 1975, ZH, ZG, TG) | CSV/JSON | Historisierter Nachschlagedienst je Gemeinde/Jahr | mittel |
| CKAN-Katalog `ckan.opendata.swiss/api/3/action/package_search` (nicht `opendata.swiss/api` → Redirect-Text) | JSON | Dauerwächter für neue amtliche Rechtsdatensätze | mittel |
| Zenodo DOI je Korpus-Stand / HF Hub als CC0-Spiegel | gratis | Zitierbarer, unveränderlicher Stand («Korpus-Stand 1.9.2026, DOI …») | mittel |
| **Markt-Beleg:** iusLink verkauft CHF 59/Mt. maschinellen Zugriff auf dieselben Quellen; ein offener MCP-Server wäre klein und strategisch — **Produktentscheid David** | — | — | — |

## 3. Umfeld — Entscheide für David

| Fund | Stand | Passung | Frist |
|---|---|---|---|
| **Prototype Fund Schweiz 2026–27** (opendata.ch/Mercator), **verifiziert 2.9.2026** an prototypefund.opendata.ch: bis CHF 50 000 je Team «depending on proposal quality» (bis 2025: 100 000/6 Mt.), 4 Monate Prototyping mit Coaching/Workshops; ≥18 J., Arbeitserlaubnis CH, Einzelpersonen zulässig, bei Zuschlag Rechtsform mit Bankkonto nötig; Open-Source-Elemente Pflicht, keine bestimmte Lizenz; 2–3 Teammitglieder an Pflicht-Events; Bewerbung auf Englisch (Formularfelder nur nach Login sichtbar); Jury-Auswahl 5 Projekte 22.9.2026, Start Mitte Oktober, Final Pitch 11.2.2027 | Fokus 2026 wörtlich «Responsible and Sustainable AI»; FAQ: «Highly relevant potential solutions can exist without explicitly needing an AI component». Kriterien: Fairness/Bias, Transparenz, Datenschutz, Governance, Robustheit, Public-Interest-Impact, Umwelt. Frühere Projekte nur parlaments-/verwaltungsnah (Demokratis, VoteLog, smartask), keines mit Gesetzestext-/Gerichtsbezug | Passt (Transparenz, Nachvollziehbarkeit, Public Interest); Nebenberuflichkeit nicht geregelt (offen) | **Portal schliesst 6.9.2026, Mitternacht** |
| NLnet NGI Zero Commons Fund | **Programm geschlossen** — 13. und letzter Call endete 1.6.2026 (nlnet.nl/commonsfund); Nachfolgeprogramme unter nlnet.nl/funding.html, CH-Zulässigkeit dort nicht verifiziert | — | — |
| Swiss LegalTech Association (Mapping) · UZH CLDS · BFH IPST | — | Sichtbarkeit bei Juristen; methodische Validierung | — |
| Digital Public Goods Alliance | 9-Indikatoren-Standard | Gütesiegel, kein Geld | — |
| Standards: eCH-0059 (WCAG 2.1 AA), DCAT-AP CH 2.0, REUSE 3.3; **ECLI: BGer nutzt es nicht** → eigenes Urteils-ID-Schema (Diskrepanz: `src/lib/rechtsprechung/ecli.ts` existiert — prüfen, was es tatsächlich erzeugt) | — | — | — |

## 4. Pflege und Provenienz (kein Bau)

- **Referenzzinssatz-Prüftermin «Anfang Sept. 2026» ist fällig** (`parameter-verfall.md`); keine maschinenlesbare amtliche Reihe (BWO nur HTML-SPA, opendata.swiss 0 Treffer) → Handpflege, allenfalls HTML-Drift-Wächter.
- Herkunft `src/data/plz/plzVerzeichnis.json` am BFS-Gemeindeverzeichnis belegen (5 Min.).
- `git gc --aggressive` überfällig (735 MiB Pack, 46 Packs).
- `.gitattributes` (textueller Diff für `public/normtext/**`) und Git LFS sind unvereinbar — dort als Satz festhalten, sonst schlägt es eine künftige Session erneut vor.
- Soft-200-Falle gilt auch am **SPARQL-Endpoint** (HTML-Fehlerseite mit Status 200 bei bestimmter Abfrageform) — in `scripts/fedlex-sparql.ts` Content-Type prüfen (offen).
- `fast-check@4.9.0` und `hyparquet` sind Dependencies; ob `fast-check` gegen die Engines läuft, ungeprüft.
- `pdf-lib` seit 17.7.2024 ohne Push — in keinem Plan mehr als Ausweichkandidat führen.

## 5. Korrekturen falscher Prämissen (§7: abweichend umgesetzt, offengelegt)

- **BE/AG/SG/LU/TG/SO/ZG sind keine Lücke** — alle acht auf der angebundenen LexWork-Plattform (`adapter-lexwork.ts:743`), nur ZH ist PDF-only.
- **Fedlex-RSS ist gebaut** (`fedlex-rss-oc-pruefen.ts`) — Vorschlag eines Agenten gestrichen.
- **Datenhaltung am Edge ist kein Eigenbau-Strohmann** — Turso/libSQL läuft mit Messwerten; sql.js-httpvfs-Muster (Range-VFS auf `@sqlite.org/sqlite-wasm`, ~300 Z., Referenzprojekt seit 2024 tot) wäre ein Vendor-Vergleich, kein Ersatz für Eigenbau.
- Die Hälfte der «neuen Rechner»-Ideen ist gebaut (GebV SchKG, Pflichtteil, Referenzzins-Miete, Lohnfortzahlung, Ferien, AHV, Prozesskosten).
- Wikidata P5743 «SR Number»: 64 von ~4 500 Items — Sackgasse.

## 6. Verworfen (mit Grund)

| Quelle | Grund |
|---|---|
| GitHub-Topic legal-tech (200 Repos) | ~80 % LLM/MCP/CRM; einziger Neufund eyecite-ts (TS-Port, 6★) als Lese-Referenz |
| Vaquill-AI/awesome-legaltech | kommerzielle Marketing-Liste (9 Sponsor-Marker), Schweiz-blind; Idee: citeurl (Verweisregeln als YAML-Daten statt Code) |
| droid-f/fedlex + -assets | reine Metadaten, 1,87 GB; **NC-Lizenz nur in README, keine LICENSE-Datei**, am Inhalt vermutlich nicht haltbar (amtlich, unverändert) — trotzdem nicht einbinden, gleicher Endpoint direkt. Einzig echter Wert: 16 455 Commits seit 2021 = Rückblick «wann hat Fedlex was geändert»; nachbaubar als eigenes Journal `QS-FEDLEX-JOURNAL` (append-only je Pin: ELI · Datum · `dateApplicability` · `inForceStatus` · Hash) |
| rnckp/awesome-open-legal-switzerland | keine neue Kantonsquelle; punktuell: Amtsblattportal-API, WEKO/ElCom/ComCom-Entscheide (Korpus-Breite) |
| rnckp/awesome-ogd-switzerland | nichts Neues (BFS-Gemeindeverzeichnis, Zefix-401 bekannt) |
| SwissFederalArchives/LD-Tutorials (→ `swiss/fedlex-sparql`) | **der einzige echte Fund** (jolux:Citation, historisiertes Gemeindeverzeichnis `ld.admin.ch`/`geo.ld.admin.ch` mit Fusionshistorie); Abfragemuster identisch zu unseren; beide Repos ohne Lizenzdatei |
| TamasCsakvari/swiss-legal-renewal-radar | Vertrags-Kündigungsfrist-Extraktor mit Mini-LLM, 0★, Einmal-Commit — Name irreführend |
| Liquid-Legal-Institute/Legal-Text-Analytics | Liste seit 11/2024 tot; einzig `openlegaldata/legal-reference-extraction` (DE, MIT, aktiv) enger Blick wert |
| malkreide/openlex-mcp | ZH-only-Prototyp, PDF-Parsing, Datenstand 2023-01-01 |
| LobeHub | nur LLM-Wrapper um bekannte Quellen |
| Hugging Face sonst | `voilaj/swiss-legislation` («internal working mirror, not for redistribution»), `liechticonsulting/*` ohne Dataset-Cards; **Tabu:** `voilaj/swiss-law-commentary` (Kommentarliteratur) |
| Zenodo | leer. LINDAS: zweimal Timeout, offen |
| Git LFS / DVC / Dolt / lakeFS | LexMetrik ist invertiert (Text in git = Quelle, DB = ableitbar); `daten-manifest.json` (Tabellen-sha) schlägt jedes Datei-Hash-Werkzeug |
| Litestream/LiteFS, Atlas/dbmate, Kysely/Drizzle | kein Live-Schreiben, Voll-Rebuild macht Migrationen überflüssig |
| law-widgets / indigo-akn (LGPL), ris-norms/ris-search (GPL), bluebell (GPL), legislation.gov.uk (NOASSERTION) | nur als Muster/Fall-Katalog/A11y-Testfälle, nie als Abhängigkeit → #3 |
| ESTV-Steuerrechner-Proxy | Daten nicht offen (schriftliche Genehmigung nötig) |
| @tanstack/react-virtual | bewusst nicht (kostet Ctrl+F); wenn Last drückt: CSS `content-visibility` |
| Wo Eigenbau richtig ist | Fedlex-/ZH-Extraktion, Verweis-/Zitat-Erkennung, Norm-Query/Ranking, Fristen-/Feiertagslogik, ICS-Determinismus (`ics` erzeugt UID/DTSTAMP nicht deterministisch), e2e-Shard-Balancing, Golden-Vergleich, Hrana-Transport (43× gemessen), Schatten-Tabellen, DDL-Vergleich, Byte-Roundtrip-Projektion — alle mit datiertem Vorfall (§17-Gegengewicht) |

## 7. Bilanz der Suchräume (für künftige Recherchen)

- **Amtliche Doku schlägt Verzeichnisse.** Der eine grosse Fund (jolux:Citation) kam aus einem Bundesarchiv-Tutorial, nicht aus einer der fünf Awesome-Listen. Kuratierte Listen sind in der Schweiz Schweiz-blind (awesome-legaltech) oder statisch (rnckp).
- **Einstieg für Behörden-Repos:** `github.com/swiss/index` (Verzeichnis aller Bundes-Repo-Organisationen) statt geratener Org-Namen (`bl-openit`, `KantonZuerich`, `egovernment-schweiz` existieren nicht).
- **Lizenz ist der Engpass, nicht Verfügbarkeit:** SHAB ohne publizierte Bedingungen, ZH-Parlamentsdaten `license_title: None`, droid-f NC nur in Prosa, Reader-Bausteine LGPL/GPL, `citeproc` CPAL/AGPL, RIS-AT-Lizenzseite 404. Vor jedem Andocken Art.-5-URG-Einordnung ins Dossier.
- Ertrag pro Quelle klar sinkend nach ~10 Sichtungen; künftig gezielt (LINDAS erneut, `swiss/index`, opendata.swiss Justiz-Gruppe auf Datensatz-Ebene), nicht breit.

## 0. Vorsichtung 1.9.2026 (absorbiert)

**Ursprünglich:** eigene Datei `fremdquellen-sichtung-2026-09-01.md`, gelandet mit PR #615. Bei
Zusammenführung der beiden Sichtungen (2.9.2026, Absprache Sessions e5/a1, PR #617) hierher
übernommen — Inhalt wörtlich, Datum und Provenienz unverändert (§2b: Belege altern nicht, sie
werden ergänzt).

**Querverweis statt Dublette:** Die Zeile „github.com/jonashertner/opencaselaw · opencaselaw.ch"
unten deckt sich mit der Chancen-Zeile „opencaselaw auf HF `voilaj/swiss-caselaw`" (Abschnitt 2
oben) — dieselbe Quellenfamilie aus zwei Sichtungsrunden, nicht doppelt bewerten. „clds.uzh.ch/
knowledge/databases" (SCD) hat in dieser Sichtung (09-02) keine eigene Zeile: Zeile 9 oben nennt
opencaselaw/CLDS/SCD als in dieser Runde bereits erfasst und darum nicht erneut gesichtet.

---

### Fremdquellen-Sichtung 1.9.2026 — neun Repos/Datensätze auf Nutzen für LexMetrik

**Erstellt:** 1.9.2026 — Session Zielbild Gesetzesleser, Sichtung auf Auftrag David.

**Anlass:** David reichte am 1.9.2026 im Chat neun Quellen ein («untersuche repos … allgemein nützlich
für lexmetrik»). Sichtung read-only (GitHub-API, README, Stichproben), kein Einbau. Abnahme-Status: alle
Einträge **entwurf** (Sichtung, keine fachliche Abnahme). Regel: Fremddaten sind nie Wahrheit, nur
Wegweiser oder Zweitlesung (§7); Quelle der Texte bleibt die amtliche Fassung.

| Quelle | Was es ist (Stand 1.9.2026) | Lizenz | Nutzen für LexMetrik | Geltung/Grenze | Pflege |
|---|---|---|---|---|---|
| github.com/legalize-dev/legalize-ch | 5'789 SR-Erlasse als Markdown, ein Commit je Reform (Fedlex AKN-XML, SPARQL), nur DE, Historie ab ~2011/2021; letzter Push 23.6.2026, 7★ | Code MIT, Daten gemeinfrei | Beleg: Bund-Vollabdeckung machbar (→ `W2·5n-BUND-VOLL`); Fedlex-Versionen als Historie (→ `W2·5g-ZEIT`); Dateiliste als Inventar-Zweitlesung | Markdown verlustbehaftet (Fussnoten als Hochzahlen, keine eId) — nie als Textquelle | Inventar bei Bund-Voll einmal ziehen |
| github.com/opendatazurich | CKAN-Infrastruktur des Open-Data-Portals Stadt Zürich (41 Repos) | divers | keiner; Datenkatalog enthält keine Rechtstexte (Suche «Rechtssammlung» 0) | Stadt-ZH-Amtliche-Sammlung bleibt nur per Web + robots.txt-Hürde | — |
| github.com/jonashertner/opencaselaw · opencaselaw.ch | 1,05 Mio. Entscheide (118 Gerichte, 1875–heute, DE/FR/IT), 5'525 Bund- + 15'600 Kantons-Erlasse (Artikel-Index), ~10 Mio. Zitatkanten, 12,4 Mio. Entscheid→Artikel, 84'000 Botschafts-Verweise, REST/MCP, tägliche Parquet (HuggingFace voilaj/swiss-caselaw); Push 1.9.2026, 60★ | Daten CC0, Code MIT (Kommentare OnlineKommentar CC-BY) | **Zulieferer-Kandidat** für Nachweis-Index, Botschaften-Index, Zitationsgraph (→ `W2·21-ZULIEFERER`); Kantons-Scraper `scrapers/cantonal_laws/*.py` als Portal-Vorlage + Artikelzahlen als Zweitlesung (→ `W3·12`); `/attest`-Endpunkt als Zweitlesung für Phantom-Kanten; ZH-Weg identisch zu unserem (zh.ch-JSON + notes.zh.ch-PDF), Extraktion aber nur PyMuPDF-Text + Regex | §2: `/verify-claim` ist LLM-Richter — nie im Produkt; Repo enthält `deploy_incapsula_bypass.sh` (Bot-Schutz-Umgehung) — betroffene Gerichte ausschliessen; Kommentare per Leitbild ausgeschlossen (David-Frage) | monatlich Gesetze, täglich Entscheide |
| github.com/JoelNiklaus/SwissJudgementPrediction (+ HF rcds/swiss_judgment_prediction) | Forschungscode Uni Bern 2021: Urteilsvorhersage BGer; Datensatz 85'000 BGer-Entscheide 2000–2020, DE/FR/IT, Sachverhalt/Erwägungen/Ausgang getrennt | Repo ohne Lizenz; Datensatz auf Zenodo/HF | nur Prüfkorpus für Zitat-Erkennung/Erwägungs-Trennung; Schwester-Repo SCRC (Spider je Gericht) als Quellenreferenz | Prognose per Modell = §2-Verstoss, Richter-Gate — nie Produkt | — |
| clds.uzh.ch/knowledge/databases | Linkliste Center for Legal Data Science UZH; darin **SCD** (Zenodo 7793043): 116'000 BGer-Fälle seit 2007, 31 Variablen (Rechtsgebiet, Abteilung, Parteitypen, Ausgang) | offen (Zenodo) | Rechtsgebiet-/Abteilungs-Facette am Entscheid, deterministisch aus Tabelle (→ `W2·7-VZUI-SACHGEBIET`, `W2·21` Ziff. 5) | nur deskriptiv; Ausgang/Parteien nie als Quote (Richter-Gate) | Zenodo-Version prüfen |
| zenodo.org/records/13347459 | Staatsarchiv ZH: sämtliche Erlasse der Offiziellen Sammlung 1803–1998 als TEI-XML, ~10'000 Dateien, Metadaten Titel/Datum/Band/Seite/Ordnungsnummer (ab 1981), Bezüge, NER (ungeprüft); V4 20.8.2024, 122 MB | Zenodo: CC-BY 4.0; Text: CC-BY-SA 4.0 (Widerspruch klären); amtliche Erlasse ohnehin Art. 5 URG | Fussnoten-Apparat ZH mit auflösbaren OS-Fundstellen (R3), Zeitmaschine ZH 1803–heute zusammen mit zhlex-Vorfassungen (R7/R12) — FAHRPLAN-KANTONE §5 | endet 1998 — nie für geltendes Recht; Word→TEI-Makro mit Tabellen-/Formelfehlern → Zweitlesung gegen PDF-Bände | statisch |
| github.com/stazh/ZSZH-Word2XML | Konvertierungsskripte (VBA/Python) Word→TEI des Staatsarchivs ZH für OS, KRP, RRB; 0★, keine Lizenz | keine | nur TEI-Struktur-Doku für den Zenodo-Datensatz; **Fund:** Zentrale Serien = Kantonsratsprotokolle + Regierungsratsbeschlüsse als TEI = Materialien Kanton ZH (→ `W2·21` Ziff. 5, Block 4) | Lizenz je Serie, Abdeckung, §-genaue Zitierbarkeit zu klären | — |
| github.com/swiss/oss-catalog · opensource.admin.ch | Katalog-Infrastruktur (publiccode.yml-Crawler, DB, Client) für Bundes-OSS; AGPL, 18★ | AGPL-3.0 | keiner für den Bau; später publiccode.yml im Repo für Auffindbarkeit (Launch-Phase) | — | — |
| github.com/swiss/designsystem | Webguidelines Bund: HTML/CSS/Figma, Vue/Nuxt, Storybook; 103★, Push 4.6.2026, Lizenz nicht deklariert | NOASSERTION | Referenz für Barrierefreiheit (Tastatur, Kontrast, Tabellen, Brotkrume; → `SEO-A11Y`) und Typografie langer Texte (Leser-V3 F3) | nicht übernehmen: Vue-fremd, und Bundes-Look wäre für Nutzer irreführend (§8) | — |

**Einordnungs-Ergebnis (Chat 1.9.2026, von David gebucht):** Bau-Reihenfolge angepasst — Bund-Vollabdeckung
als Block 3a (`W2·5n-BUND-VOLL`), Zulieferer-Entscheid als Prüfschritt nach Block 2 (`W2·21-ZULIEFERER`),
Kantons-Ausbau mit Fremd-Portalwissen als Vorlage und Zweitlesung (`W3·12`-Methode). Marktbild: Daten-
lieferanten für KI (OpenCaseLaw, Legalize) vs. Werkzeuge für Menschen (LexMetrik) — Zulieferer nutzen,
nicht nachbauen; Unterschied bleibt Text-Treue, Leser, Verzahnung, Kantone, Zürich-Tiefe.

---

## Nachtrag 6.9.2026 — Integration in die Roadmap (Auftrag David 5./6.9.2026: «leg alles in roadmap ab was sinnvoll ist»)

| Rangliste/Chance | Roadmap-Ort | Bemerkung |
|---|---|---|
| #1, #2 | `W2·22-VERWEIS-FEDLEX` | schon seit 2.9. |
| #3, #4, #8–#12, #14–#16 | `QS-VERWENDEN` V1–V8 | gebaut/gemessen bis 5.9. |
| #5 Sprengel BE, #6 Materialien BS/ZH | `W2·13-KANTONE-DATEN` K-15/K-16 | neu 6.9. |
| #7 Fedlex-Fussnoten, #17 Fassungs-Zeitleiste | `W2·5l-NORMTEXT-B2` M15/M16 | neu 6.9.; Muster legalize-ch/Indigo aus der Rules-as-Code-Sichtung 5.9. |
| #13 Zitierstil GTR | `W2·8` | neu 6.9. |
| #18 Sozialversicherungs-Stammdaten; Chancen SHAB/UID/SNB | `W3-AUSBAU` | neu 6.9.; Zeitreihen-Form folgt `W3-TARIF-STAND` |
| #19 Turborepo, #20 Prüf-Roboter, Zenodo, CKAN | `QS-VERWENDEN` V9–V12 | neu 6.9. |
| Browser-Erweiterung, MCP-Server | Geparkt | Produktentscheide, wartet auf David |
| Steuerfüsse-Zeitreihe, kantonale Vernehmlassungen | nicht aufgenommen | Vernehmlassungen decken `W3-AUSBAU` «Gesetzgebungs-Tracking» ab; Steuerfüsse ohne Werkzeug-Bedarf |
| opencaselaw-Delta, RIS-AT | `W2·21-ZULIEFERER`, `W2·13-KANTONE-DATEN` | schon verankert |


## Nachtrag 6.9.2026 (abends) — zwei Repos aus Davids Hinweisen

| Quelle | Was es ist (Stand 6.9.2026) | Lizenz | Nutzen für LexMetrik | Geltung/Grenze | Pflege |
|---|---|---|---|---|---|
| github.com/swiss/fedlex-sparql | SPARQL-Tutorial der Bundeskanzlei, JupyterLite, letzter Push 22.11.2024, keine Lizenzdatei, 3★ | keine | keiner — bereits als «SwissFederalArchives/LD-Tutorials (→ swiss/fedlex-sparql)» in der Haupttabelle erfasst; Abfragemuster identisch zu unseren | nichts Neues gegenüber dem bestehenden Eintrag | — |
| github.com/gemeinde-bister/openmun-lex | Gemeinde Bister VS + Firntec GmbH, Python (Starlette/Tantivy/ProseMirror), Akoma-Ntoso-Leser und -Editor für Bund (4700 Erlasse, Fedlex-Sync dreisprachig de/fr/it), Kanton Wallis (685 Erlasse aus lex.vs.ch REST-API, Fassungen je Datum) und Gemeindereglemente (ELI-Schema `/eli/mun/{bfs}/…`); erstellt 12.2.2026, Push 7.8.2026, 0★ | EUPL-1.2 (Copyleft → nur Blaupause, kein Code); Daten OGD | `lex.vs.ch` als zweiter Kanton mit sauberer API nach BS (→ `W2·13-KANTONE-DATEN`); dreisprachiger Fedlex-Sync als Blaupause für FR/IT (→ `W3-AUSBAU` FR/IT); Gemeinde-Ebene = Produktentscheid David | für Materialien irrelevant (keine Botschaften, keine Historie) | — |
