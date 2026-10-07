# Externe Quellen, APIs und Repos — Sichtung 3.8.2026

**Erstellt:** 3.8.2026 — Auftrag David (Chat, dreistufig): (1) «bringt dieses
Repo etwas für lexmetrik» zu `github.com/benjamin-arfa/swiss-law` und
`rnckp/awesome-open-legal-switzerland`, (2) «suche weiter … ich will am Ende
eine Liste mit möglichen Funktionen … was würde uns das Leben einfacher
machen», (3) Einschränkung: «nichts überstürzen. es soll hauptsächlich
Bestehendes unterstützen».

**Status:** **BEWERTET 15.8.2026 (QS-EXTQUELLEN)** — jeder Befund trägt unten
einen datierten Entscheid-Block; die Lebensproben sind am 15.8.2026 wiederholt
worden (§6). Offen bleibt **genau eine** Frage, und sie ist keine technische:
der kommerzielle Betrieb (§5 Ziff. 5) — davon hängt allein die NC-Quelle
`droid-f/fedlex` ab. Alle übrigen §5-Fragen sind hier beantwortet
(Technik-Delegation David 8.8.2026).

*Voriger Status (3.8.2026): ERSTRECHERCHE. Jeder gelistete Endpunkt wurde am
3.8.2026 selbst angefragt; der HTTP-Code steht je Zeile. Die fachliche Bewertung
und die Verortung im Bauplan waren bewusst OFFEN — Auftrag David: «baue es
einfach als findings ein. andere session soll es dann nochmals neu evaluieren».*

**Ergebnis in einem Satz.** Von zwölf Kandidaten überlebt **einer als
Bau-Vorschlag** (BFS-Gemeindeliste, klein und begrenzt), **einer als
Vorlagen-Baustein** (QR-Rechnung), **einer wartet auf David** (NC-Lizenz); der
Rest ist verworfen oder bleibt geparkt — überwiegend, weil die Sorge, die er
tragen sollte, inzwischen anderweitig getragen wird.

**Umfang der Suche:** rund 60 Abfragen — GitHub-Repo-Suche über Fedlex, Korpus,
Kantonsrecht, Rechtsprechung, alle Rechner-Domänen (Fristen, Verjährung,
Mietrecht, SchKG, Tarife, Gerichtskosten), Stammdaten und Infrastruktur; dazu
`ckan.opendata.swiss`, Web-Suche zu amtlichen Schnittstellen und Live-Proben an
sieben Endpunkten.

---

## 1 — Stützt Bestehendes (Kern des Auftrags)

### 1.1 Feiertage — unabhängige Zweitquelle für eine tragende Annahme

**Befund.** [`src/data/zpoFeiertage.ts`](../../src/data/zpoFeiertage.ts) trägt
weit mehr als die ZPO: `zpoFristen`, `schkgFristen`, `erbFristen`,
`bggVwvgFristen`, `allgemeineFrist` und der gesamte Fristenspiegel greifen auf
`istFeiertag`/`naechsterWerktag` zu. Grundlage ist **eine** Quelle — das
BJ-Verzeichnis nach Art. 11 des Übereinkommens vom 16.5.1972 (SR 0.221.122.3),
**Stand 1.1.2011**, dokumentiert in
[`normen/feiertage-kantone-bj.md`](../normen/feiertage-kantone-bj.md).

**Was stützt.** Zwei Dinge, ohne Codeänderung:

1. Prüfen, ob das BJ inzwischen **neu publiziert** hat. Das ist keine neue
   Regel, sondern der bereits registrierte Prüfauftrag — Verfallsregister-Zeile
   «Feiertagsverzeichnis (EJPD)» nennt genau das («bei neuer BJ-Publikation
   Matrix neu abgleichen», Nächste Prüfung: offen). **Keine neue S6-Zeile
   nötig.**
2. **[HexagonSwiss/swiss_holidays](https://github.com/HexagonSwiss/swiss_holidays)**
   (MIT, Dart, letzter Push 30.7.2026, abgerufen 3.8.2026) — kantonale *und*
   kommunale Feiertage, je Eintrag mit zitierter **kantonaler Rechtsgrundlage
   und abgerufener URL**, dazu JSON-Schema und Golden-Tests. Zitiert damit
   nicht das BJ-Sammelverzeichnis, sondern die Norm selbst — genau die
   Unabhängigkeit, die eine Gegenprobe braucht.

**Vorbehalt (entscheidend).** `data/cantons/` enthält heute **nur `ch-zh.yaml`
und `ch-ti.yaml`** plus eine Gemeinde (Zürich, BFS 261). Als 26-Kantone-
Gegenprobe **heute unbrauchbar**; Wert = zwei Stichproben und ein Datenschema.
Der Repo-eigene `GAPS.md` benennt die Lücken.

**Berührt:** `src/data/zpoFeiertage.ts` · `src/data/schkgFeiertage.ts` ·
[`normen/feiertage-kantone-bj.md`](../normen/feiertage-kantone-bj.md) ·
[`register/parameter-verfall.md`](../register/parameter-verfall.md) (Zeile
«Feiertagsverzeichnis (EJPD)»).

**Entscheid 15.8.2026: VERWERFEN** (die Zweitquelle; der registrierte
Prüfauftrag bleibt unverändert bestehen).

Nachgeprüft am 15.8.2026 über die GitHub-API: `HexagonSwiss/swiss_holidays`
enthält in `data/cantons/` weiterhin **genau zwei Dateien** — `ch-zh.yaml` und
`ch-ti.yaml`; letzter Push 30.7.2026, seit der Erstrecherche **kein Zuwachs**.
Damit ist der Vorbehalt vom 3.8. nicht nur bestätigt, sondern verschärft: eine
Gegenprobe, die 2 von 26 Kantonen deckt, kann den Fehler, den sie finden soll —
eine falsche Kantonszeile in unserer Matrix — in 24 Fällen strukturell nicht
sehen. Ein Prüfmittel, das den gesuchten Fehler grossmehrheitlich nicht finden
kann, ist nach §6.7 kein Prüfmittel.

Was bleibt, ist **kein Datenbezug, sondern eine Formregel**: je Eintrag die
kantonale Rechtsgrundlage + abgerufene URL. Genau das verlangt die
Verfallsregister-Zeile ohnehin («je Kanton gegen geltendes kantonales Recht vor
‹geprüft›»). Es entsteht daraus **keine neue Plan- und keine neue
Registerzeile.**

*Wiedervorlage (Bedingung, nicht Datum):* erst prüfen, wenn `data/cantons/`
**≥ 20 der 26 Kantone** führt. Vorher lohnt der Blick nicht.

### 1.2 Normtext-Drift — unabhängiger Zweitbestand für ein bestehendes Tor

**Befund.** `check:fedlex-versionen`, `currency.json` und die Wiedervorlage
prüfen heute gegen **die Quelle**. Ein Ein-Quellen-Check kann nicht
unterscheiden zwischen «unser Snapshot ist aktuell» und «unser Pin ist stale,
aber konsistent stale». Ein unabhängiger Zweitbestand kann das.

| Kandidat | Umfang CH | Lizenz | Abruf 3.8.2026 |
|---|---|---|---|
| [benjamin-arfa/swiss-law](https://github.com/benjamin-arfa/swiss-law) | 9 038 Bunderlasse + 21 000+ kantonale, DE/FR/IT, Markdown + YAML-Frontmatter, ~59 600 rückdatierte Commits, wöchentlich | Pipeline MIT, Texte gemeinfrei | aktiv (Push < 3 h) |
| [legalize-dev/legalize](https://github.com/legalize-dev/legalize) ⭐266 | Rahmenwerk über 31 Jurisdiktionen; `legalize-ch` = 5 789 Bunderlasse | MIT | aktiv |
| [droid-f/fedlex](https://github.com/droid-f/fedlex) ⭐24 | **rohe Fedlex-Backend-JSON nach ELI-Pfad** — BBl ~146 000, AS ~45 000, SR ~17 000 Werke + ~50 000 Konsolidierungen, Staatsverträge, 40 Vokabulare; dazu `updates.json` (Änderungs-Zeitstempel je Datei) | **CC BY-NC-SA 4.0 — nicht kommerziell** | mehrmals täglich |

**Einordnung.** `swiss-law` läuft auf dem `legalize`-Rahmenwerk (Paket
`src/legalize_ch/`), ist für die Schweiz aber deutlich vollständiger als
`legalize-ch`. Für uns direkt verwertbar wäre der **Node/TypeScript-Client**
aus `legalize-sdks`. `droid-f` führt als einziger die **Konsolidierungs-
Metadaten**, ist damit für Pins und Wiedervorlage inhaltlich am nächsten — und
zugleich lizenzrechtlich am heikelsten (§4).

**Berührt:** `QS-CURRENCY-KANON` · `QS-CURRENCY-TESTS` · `QS-FRIT-DRIFT` ·
`W2·13-KANTONE-DRIFT` · `scripts/fedlex-versionen-pruefen.ts` ·
`scripts/fedlex-wiedervorlage-generieren.ts` · `public/normtext/currency.json`.

**Entscheid 15.8.2026: VERWERFEN** für `swiss-law` und `legalize` ·
`droid-f/fedlex`: **VERWERFEN** (Davids Antwort 15.8.2026 «nicht kommerziell»
hätte NC formal erlaubt — verworfen bleibt es trotzdem: kein Lizenztext im
Repo, Zweitbestand fachlich obsolet, s. §5 Ziff. 5).

*Tragender Grund — die Sorge ist inzwischen anderweitig getragen.* Der ganze
Wert des Zweitbestands lag in einer einzigen Fehlerklasse: «unser Pin ist stale,
aber konsistent stale», die ein Ein-Quellen-Check nicht sieht. Genau diese
Klasse wurde am 14.8.2026 **ohne jeden Dritt-Bestand** gefunden und behoben —
14 nicht-kanonische Fedlex-Pins, in zwei Gegenprüfungs-Runden 14/14 per
SPARQL **gegen die amtliche Quelle rederiviert** (PR #497, Checklisten-Zeile in
`QS-MONITOR-ROT`). Der Weg dorthin war die Rederivation aus der Quelle, nicht
der Vergleich mit einem Dritten. Ein Zweitbestand hätte hier nichts gezeigt, was
die Rederivation nicht zeigt — und trüge dafür dauerhaft Pflege- und
Lizenzlast.

*Faktenkorrekturen an der Erstrecherche (§7 — Belege prüfen, nicht
übernehmen), Stand GitHub-API 15.8.2026:*

- **`legalize-dev/legalize` ist nicht «aktiv».** Letzter Push **23.6.2026** —
  zum Bewertungsdatum knapp acht Wochen still (⭐267). Die Zeile «aktiv» in der
  Tabelle oben war schon am 3.8. unzutreffend.
- **`benjamin-arfa/swiss-law`: Lizenz präzisiert.** Die `LICENSE` trägt im
  Wortlaut «MIT License, Copyright (c) 2024–2026 Benjamin Arfa», GitHub
  klassiert sie aber als `NOASSERTION` (Datei nicht SPDX-rein erkannt). Für uns
  ohne Folge, da verworfen — aber die Tabellen-Angabe «Pipeline MIT» wäre allein
  auf die GitHub-Anzeige gestützt falsch gewesen. Letzter Push 10.8.2026.
- **`droid-f/fedlex` hat gar keine Lizenzdatei.** Die GitHub-Lizenz-API
  antwortet **404** (kein `LICENSE` im Repo-Wurzelverzeichnis); die
  CC-BY-NC-SA-4.0-Angabe stammt aus der README. Das macht die Lage **unsicherer,
  nicht besser**: NC-Behauptung ohne Lizenzdatei. Bis zu Davids Antwort wird das
  Repo **nicht berührt** — auch nicht lesend zu Vergleichszwecken.

*Was übernommen wird, ist eine Idee, keine Datei:* das Muster `updates.json`
(Änderungs-Zeitstempel je ELI-Objekt) ist aus **unserer eigenen** SPARQL
erzeugbar und bleibt als Anregung für die Wiedervorlage-Anzeige vermerkt —
Verortungs-Vorschlag `QS-FRIT-DRIFT` bzw. `W3-AUSBAU` · «Gesetzgebungs-/
Rechtsetzungs-Tracking». Kein eigener Schritt.

### 1.3 Gemeindeverzeichnis (BFS, historisiert) — macht Zuständigkeit auflösbar

**Quelle.** `https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=DD-MM-YYYY`
— **HTTP 200**, `text/plain`, CSV, abgerufen 3.8.2026. Spalten:
`HistoricalCode, BfsCode, ValidFrom, ValidTo, Level, Parent, Name, ShortName,
Inscription, Radiation`. Amtlicher Standard **eCH-0071** (historisiertes
Gemeindeverzeichnis, V1.2.0 vom 7.8.2023), Trägerin BFS, frei.

**Warum es Bestehendes stützt.** `zustaendigkeit.ts` und
`schkgZustaendigkeit.ts` bestimmen den Ort rechtlich korrekt (Art. 46–55 SchKG
bzw. ZPO), nehmen ihn aber als freie Eingabe entgegen. Das Verzeichnis macht
daraus eine gegen ein amtliches Register **prüfbare** Angabe — und der
Stichtags-Parameter löst Gemeindefusionen bei Altfällen deterministisch auf
(§2: gleiche Eingabe + gleicher Stichtag → gleiche Ausgabe).

**Berührt:** `src/lib/zustaendigkeit.ts` · `src/lib/schkgZustaendigkeit.ts` ·
`src/lib/kantone.ts` · Vorlagen mit Ortseingabe.

**Entscheid 15.8.2026: ÜBERNEHMEN — aber eng begrenzt.** Nur eine
**Validierungsliste des geltenden Stands**, kein historisierter Vollbestand
(damit ist §5 Ziff. 3 beantwortet).

*Gemessen statt geschätzt (Abruf 15.8.2026, Stichtag `15-08-2026`,
**HTTP 200**):* der Snapshot ist **135 173 Bytes / 2 281 Zeilen**, davon
**2 110 Gemeinden** (Level 3); der Rest sind Kantons- und Bezirksstufen. Das ist
kein Perf-Thema (§15) — als generierte, gzip-komprimierte Liste der
Level-3-Namen bleibt es deutlich unter dem, was eine einzelne Erlass-Seite
kostet.

*Warum begrenzt.* Der historisierte Vollbestand (mit `ValidFrom`/`ValidTo` und
Fusionsketten) wäre ein **zweites Register**, das gepflegt sein will — und
niemand liest ihn: `zustaendigkeit.ts` und `schkgZustaendigkeit.ts` lösen den
Ort **nicht datiert** auf, sie nehmen ihn entgegen. Ein Bestand ohne Leser ist
nach §5 eine zweite Wahrheit, nicht eine Stütze. Der Stichtags-Parameter der API
bleibt trotzdem der Grund, **warum** die Liste deterministisch reproduzierbar
ist (§2): der Generator pinnt den Stichtag, gleiche Eingabe → gleiche Ausgabe.

*Bau-Grenzen für die spätere Zeile:* Build-Time-Snapshot mit gepinntem Stichtag
(**nie** Laufzeit-Abfrage) · Wirkung ausschliesslich **Hinweis**, nie Blockade
einer Eingabe (ein nicht gefundener Ort kann eine Neufusion sein, §8) ·
Rechtslogik unberührt — keine Frist, keine Quote, keine Zuständigkeit ändert
sich (§1) · amtlicher Standard **eCH-0071**, Quelle + Abrufdatum im Artefakt.

### 1.4 Amtskreise je Kanton — die letzte Meile der SchKG-Zuständigkeit

**Quelle.** `ckan.opendata.swiss` `package_search` (**HTTP 200 nur mit
User-Agent-Header**; ohne → 403), abgerufen 3.8.2026:

- **BE:** «Betreibungs- und Konkursämter», «Regionalgerichte», «Regionale
  Staatsanwaltschaften», «Regionale Zwangsmassnahmengerichte» — GeoPackage
  **und Parquet** (Amt für Geoinformation)
- **ZH:** «Notariats-, Grundbuch- und Konkursamtskreise» — WFS/WMS
- SO, LU, TG: Grundbuch-/Notariatskreise in wechselnden Formaten

**Passt technisch.** Parquet wird bereits gelesen (`hyparquet` in
[`scripts/datenhaltung/masse-ingest.ts`](../../scripts/datenhaltung/masse-ingest.ts)).

**Vorbehalt.** Kantonal und lückenhaft — **es existiert kein nationales
Register** (§3). Vollabdeckung hiesse 26 Quellen pflegen, also potenziell ein
26×-Asset mit allen Folgen der Slot-Regel.

**Berührt:** `src/lib/schkgZustaendigkeit.ts` · `bibliothek/behoerden/`.

**Entscheid 15.8.2026: VERWERFEN** — Vollausbau wie Teilausbau (damit ist §5
Ziff. 4 beantwortet).

*Vollausbau:* ja, das ist ein **26×-Datenasset** im Sinn von Leitprinzip 4 der
ROADMAP — 26 Quellen in wechselnden Formaten (GeoPackage, Parquet, WFS/WMS),
jede mit eigener Pflegekadenz. Der 26×-Slot ist von `W3·12` (Kanton-Gesetze)
gehalten; «nie zwei 26×-Assets gleichzeitig offen» schliesst die Öffnung nicht
nur heute aus, sondern stellt sie hinter eine ganze Säule.

*Teilausbau BE/ZH:* verworfen aus einem anderen Grund als §8. Die
Vollabdeckungs-Erwartung liesse sich beschriften — der Nutzen aber nicht
herstellen: Der Rechenwert entsteht erst, wenn die Frage «welches Amt ist
zuständig?» **immer** beantwortet werden kann. Zwei Kantone erzeugen ein
Werkzeug, das in 24 Kantonen achselzuckt — und für die zwei bereits das leistet,
was die Nutzerin auch der kantonalen Amtsseite entnimmt. Kosten dauerhaft,
Nutzen punktuell.

*Bestehen bleibt* der Negativbefund §3 Ziff. 3 (kein nationales Register) als
Sperrgrund; er ist die eigentliche Wurzel und liegt ausserhalb unseres
Einflusses. Wiedervorlage-Bedingung: ein **nationales** Amtskreis-Register
(realistisch erst mit justitia.swiss, vgl. §2 «PDF/A»).

### 1.5 Rechtsprechung — Werkzeuge der Betreiber

[entscheidsuche-Organisation](https://github.com/entscheidsuche) (abgerufen
3.8.2026): `NeueScraper`, `entscheidsuche-feeder`,
`headless-scraping-subsystem`, `txt2chunk` — aktiv gepflegt (19–26 Tage). Dazu
[rnckp/entscheidsuche-client](https://github.com/rnckp/entscheidsuche-client)
(Python) als saubere Dokumentation der Endpunkte. API-Probe
`https://entscheidsuche.ch/_search.php` → **HTTP 200**.

Relevant nur bei Weiterarbeit am bestehenden Entscheid-Korpus.
**Berührt:** [FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md](../../fahrplaene/FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU.md).

**Entscheid 15.8.2026: ÜBERNEHMEN als Nachschlage-Verweis — ohne neue
Plan-Zeile.** Probe wiederholt: `https://entscheidsuche.ch/_search.php` →
**HTTP 200** (15.8.2026). Die Endpunkt-Dokumentation von
`rnckp/entscheidsuche-client` bleibt der schnellste Weg zu einer Frage, die im
`FAHRPLAN-ENTSCHEIDSUCHE-AUSBAU` ohnehin gestellt wird (dort aktiv: Entscheid-
Filter über die API, Richternamen-Auflösung). Sie gehört als Fussnote in diesen
Fahrplan, nicht in den Plan: eine Plan-Zeile «Doku eines Dritten lesen» ist kein
Bauschritt. Kein Datenbezug — die Betreiber-Werkzeuge sind Scraper, unser
Korpus-Weg bleibt unverändert.

### 1.6 Amtliche Referenzen ohne Code-Wert

[swiss/fedlex-jolux](https://github.com/swiss/fedlex-jolux) (JOLux-Ontologie-
Dokumentation) und [swiss/fedlex-sparql](https://github.com/swiss/fedlex-sparql)
(SPARQL-Tutorial) — Repos der Bundeskanzlei. Kein übernehmbarer Code, aber die
massgebliche Referenz für `scripts/fedlex-sparql.ts`.

**Entscheid 15.8.2026: ÜBERNEHMEN als Referenz — ohne Plan-Zeile.** Amtliche
Dokumentation der Ontologie, die wir bereits abfragen; sie ist Nachschlagewerk,
nicht Lieferant. Verortung, falls je gewünscht: ein Kommentar-Zweizeiler am Kopf
von `scripts/fedlex-sparql.ts` (heute steht dort kein Quellenverweis) — das ist
eine Beiläufigkeit im nächsten Bau an dieser Datei, kein eigener Schritt.

---

## 2 — Erweitert, statt zu stützen (geparkt, Auftrag David)

Fachlich belegt, aber jedes macht die Plattform **breiter**, nicht das
Bestehende sicherer. Hier festgehalten, damit die Recherche nicht wiederholt
wird — **nicht** als Bauvorschlag.

| Kandidat | Beleg (Abruf 3.8.2026) | Was es wäre |
|---|---|---|
| **SHAB-API** | `https://www.shab.ch/api/v1/publications?publicationStates=PUBLISHED&…` → **HTTP 200**, JSON, viersprachig, ohne Authentifizierung (**ohne** `publicationStates` → 401). `…/api/v1/rubrics` → 200, vollständiger Rubrikenbaum. Probe `rubrics=SB` lieferte SB02 «Zahlungsbefehl» / «Precetti esecutivi» | Publikationen, die Fristen auslösen: Zahlungsbefehl, Konkurseröffnung, Kollokationsplan-Auflage, Schuldenruf; über Mandanten-Rubriken auch kantonale Amtsblätter (Testamentseröffnung, Erbenaufruf, gerichtliche Vorladung). Die `legalRemedy`-Felder führen amtliche Rechtsmittelbelehrungen im Wortlaut. **Laufzeitdaten** — im Produktpfad nur als Build-Time-Snapshot analog `scripts/materialien/adapter-seco.ts` (§2) |
| **QR-Rechnung** | [schoero/swissqrbill](https://github.com/schoero/swissqrbill) ⭐241, TypeScript, Node **und** Browser, MIT | QR-Zahlteil in Vorlagen (Honorarnote, Kostenvorschuss, Mahnung). Läuft im Browser → zustandslos |
| **eSchKG-XML** | Standard des BJ, produktiv ist **allein Version 2.2.01**; ältere Versionen dürfen die Ämter zurückweisen. Schema + Handbuch publiziert ([eschkg.ch](https://www.eschkg.ch/), abgerufen 3.8.2026) | Betreibungsbegehren zusätzlich als amtskonformes XML. Reine deterministische Serialisierung. Nebenbefund: AS 2025 630 hat gerade Art. 15a/15b GebV SchKG zu eSchKG geändert |
| **PDF/A** | justitia.swiss seit März 2025 in BL im Pilot; **BEKJ in Kraft ab 1.7.2027** ([justitia40.ch](https://www.justitia40.ch/de), [SAV](https://digital.sav-fsa.ch/en/elektronischer-rechtsverkehr-justitia4.0-worum-geht-es)) | PDF-Export als PDF/A-2b statt generisch. Mit `jspdf` nicht sauber erreichbar. **Einziger Punkt dieser Liste mit einem Datum** |
| **CHLexML** | Verein [ejustice.ch](https://ejustice.ch/) führt den Standard neben Fedlex' JOLux | Nur relevant, falls Normtext je exportierbar werden soll; für die Extraktion ohne Wert |

**Entscheid 15.8.2026 — je Kandidat einzeln:**

- **SHAB-API → BLEIBT GEPARKT (kein Bau-Kandidat).** Probe wiederholt:
  `https://www.shab.ch/api/v1/rubrics` → **HTTP 200** (15.8.2026), unverändert
  ohne Authentifizierung. Der Befund hält — verworfen wird er trotzdem, weil er
  die Plattform **breitert statt stützt**: SHAB-Publikationen lösen Fristen aus,
  die wir heute nicht berechnen. Ein Build-Time-Snapshot amtlicher
  Publikationen wäre zudem am Tag nach dem Build falsch, und Laufzeitabfragen
  scheiden nach §2 aus. Erst wenn ein Rechner existiert, der eine
  SHAB-ausgelöste Frist führt, wird das hier wieder interessant — dann als
  Eingabe-Hilfe, nie als Fristenquelle. **Produktentscheid, gehört zu David,
  nicht in einen Technik-Entscheid dieser Session.**
- **QR-Rechnung (`schoero/swissqrbill`) → ÜBERNEHMEN als Vorlagen-Baustein.**
  Einziger Kandidat der Parkliste, der alle vier Hürden nimmt: MIT-lizenziert
  (GitHub-API 15.8.: `MIT`, ⭐242, Push 14.8.2026 — lebendig), browser-fähig
  also **zustandslos** (Leitbild), rein deterministisch (§2), und er nutzt den
  bestehenden Vorlagen-Rahmen statt einen neuen zu verlangen (§10). Bindung: er
  wird erst gebaut, **wenn eine Zahlungs-Vorlage existiert**, die einen Zahlteil
  trägt (Honorarnote, Kostenvorschuss, Mahnung) — sonst ist es ein Baustein ohne
  Bau. Vor der Aufnahme §15-Bewertung der Bundle-Wirkung (lazy, nur im
  betroffenen Vorlagen-Pfad).
- **eSchKG-XML 2.2.01 → VERWERFEN (vorerst).** Die Serialisierung selbst wäre
  deterministisch und damit zulässig — nur nützt sie niemandem: eSchKG-Dateien
  nehmen die Ämter über den eSchKG-Verbund entgegen, nicht als Datei-Anhang von
  Privaten. Ein Export, den die Nutzerin nirgends einreichen kann, ist nach §8
  ein Ehrlichkeitsproblem, kein Feature. *Nebenbefund geprüft und erledigt:* die
  AS-2025-630-Änderung an Art. 15a/15b GebV SchKG ist bei uns **gedeckt** — der
  Cache-Pin (`scripts/fedlex-cache.sh`) führt `gebv_schkg` auf Stand `20260101`
  und nennt `art_15_a` ausdrücklich unter den gepinnten Artikeln. Keine Zeile
  nötig.
- **PDF/A → BEHALTEN mit Termin (einziger Kandidat mit Datum).** BEKJ in Kraft
  **1.7.2027**; ab dann ist der elektronische Rechtsverkehr der Normalfall, und
  ein generisch erzeugtes PDF ist dort kein taugliches Format mehr. Das ist kein
  Quellen-, sondern ein Rechtsstands-Thema mit Vorlaufzeit: `jspdf` erreicht
  PDF/A-2b nicht sauber, der Ersatz ist ein Umbau der Export-Schicht.
  **Wiedervorlage 1.1.2027** (18 Monate Vorlauf sind knapp bemessen, nicht
  grosszügig).
- **CHLexML → VERWERFEN.** Ohne Normtext-**Export** wertlos, und ein solcher
  steht nicht im Plan; unsere Quelle ist und bleibt Fedlex/JOLux (§5 — eine
  Wahrheit). Wiedervorlage nur, falls je ein Erlass-Export gefordert wird.

---

## 3 — Negativbefunde (S5 — damit niemand dasselbe nochmals sucht)

1. **Keine brauchbaren Rechner-Repos.** Gesucht: `fristenrechner`, `deadline
   calculator legal`, `verjährung`, `mietrecht`, `schkg betreibung`, `anwalt
   tarif rechner`, `gerichtskosten`, `obligationenrecht`, `swiss civil
   procedure zpo`, `betreibungsamt`. Ergebnis durchweg null Treffer oder
   Studienprojekte und RAG-Chatbots. **Für die Rechen-Engines existiert weder
   eine Vorlage noch ein Zweitbestand** — die Gegenprobe bleibt der amtliche
   Wortlaut (§7).
2. **Kein maschinenlesbares nationales Gerichts- oder Behördenverzeichnis.**
   Die Bundeskanzlei verweist für den elektronischen Rechtsverkehr auf
   `ch.ch/ejustice`; die URL antwortet mit **HTTP 200, liefert aber eine
   404-Fehlerseite** (geprüft 3.8.2026, auch `/de/ejustice/`). Ein
   strukturiertes Verzeichnis ist erst mit justitia.swiss zu erwarten.
3. **Kein nationales Amtskreis-Register** — siehe §1.4, nur kantonal.
4. **Keine belegte offene ESTV-Schnittstelle** für MWST-Sätze oder
   Fremdwährungskurse. *Präzise:* der geratene Endpunkt
   `backend-rates.ezv.admin.ch/api/xmldaily` antwortete nicht (Code 000), und
   die Web-Recherche fand keine Dokumentation. Es ist damit **nicht bewiesen,
   dass keine existiert** — nur, dass sie nicht auffindbar publiziert ist.
5. **`rnckp/awesome-open-legal-switzerland`** (CC0, 15 Rubriken) ist eine
   Landkarte, kein Datenlieferant: Fedlex, LexFind, entscheidsuche, BGer und
   OpenCaseLaw sind bei uns bereits im Einsatz. Neu darin nur die 26
   Kantonsportal-URLs (Gegenprobe zu
   `scripts/normtext/kanton-discovery-quellen.ts`) und zwei Forschungs-
   datensätze (Swiss Federal Supreme Court Dataset, 127k Fälle 2007–2024, auf
   Zenodo; FSCS). Die Rubriken «Legal Commentary» und «Administrative
   Guidance» fallen unter die Art.-5-URG-Grenze (Leitbild) bzw. sind
   Sekundärquellen — bewusst nicht aufgenommen.
6. **MCP-Server** (`malkreide/*`, `bettercallclaude` u. a., teils Stunden alt)
   scheiden im Produktpfad aus (§2: kein Laufzeit-LLM, kein Mittelsmann).

**Entscheid 15.8.2026: alle sechs BESTÄTIGT — zwei davon frisch nachgemessen,
vier fortgeschrieben.** Negativbefunde sind das Wertvollste dieses Dossiers:
sie verhindern, dass eine Folge-Session dieselbe Suche noch einmal bezahlt.

- **Ziff. 2 nachgemessen (15.8.2026):** `https://www.ch.ch/de/ejustice/` liefert
  weiterhin **HTTP 200 mit einer 404-Seite** — die extrahierte Seite trägt im
  Fliesstext wörtlich «Error Page (404)». Der Befund ist damit nicht nur
  wiederholt, sondern in seiner Kuriosität bestätigt: der Statuscode lügt. **Für
  Folge-Sessions: HTTP 200 ist an dieser Stelle kein Lebenszeichen.**
- **Ziff. 4 nachgemessen (15.8.2026):** `backend-rates.ezv.admin.ch/api/xmldaily`
  antwortet weiterhin **nicht** (Code 000). Die vorsichtige Formulierung von
  damals bleibt richtig und wird nicht verschärft: nicht auffindbar publiziert
  ≠ nicht existent.
- **Ziff. 1, 3, 5, 6 fortgeschrieben, nicht neu gemessen** — und das ist eine
  bewusste Entscheidung, keine Lücke: zwölf Tage sind zu kurz, als dass eine
  Wiederholung von ~40 GitHub-Suchen etwas anderes zeigen würde. Ehrlich
  markiert: **Stand 3.8.2026.** Wiedervorlage frühestens in einem Jahr oder bei
  konkretem Anlass.

---

## 4 — Lizenz- und Doktrin-Fallen

- **`droid-f/fedlex` ist CC BY-NC-SA 4.0 — nicht-kommerziell.** Eine
  Datenübernahme scheidet damit praktisch aus. Verwertbar ist allenfalls das
  **Muster** `updates.json` (Änderungs-Zeitstempel je ELI-Objekt) für eine
  eigene Wiedervorlage-Anzeige; die Daten selbst holen wir ohnehin amtlich über
  `scripts/fedlex-sparql.ts`.
- **Dritt-Korpora sind nie Quelle.** Dieselbe Leitplanke wie bei OCL
  ([PLAN-OCL-ABBAU.md](../../archiv/PLAN-OCL-ABBAU.md), Ziff. 1): «Load-bearing = nie
  über OCL zur Laufzeit», Dritt-Repo ist Seed, Diff-Orakel und Technik-Vorlage,
  **nie Mittelsmann**. §7 verlangt amtliche Quelle-URL, Live-Link und
  Drift-Erkennung *gegen die Quelle*; ein Repo dazwischen wäre eine zweite
  Wahrheit (§5).
- **PDF→Markdown-Konvertierung Dritter** (`swiss-law` für 9 Kantone) ist
  genau die Fehlerklasse, die `scripts/normtext/adapter-pdf.ts` bei uns selbst
  absichert. Als Orakel brauchbar, als Inhalt nicht.

**Entscheid 15.8.2026: BESTÄTIGT und um einen Befund ergänzt.** Die drei
Leitplanken gelten unverändert. Neu belegt (GitHub-Lizenz-API, 15.8.2026):
**`droid-f/fedlex` führt überhaupt keine Lizenzdatei** — der `/license`-Endpunkt
antwortet 404, die NC-Angabe steht allein in der README. Damit ist die Falle
schärfer als notiert: es ist nicht «NC, also nur eingeschränkt nutzbar», sondern
**Lizenzlage ungeklärt bei behaupteter NC-Absicht**. Solange Davids Antwort zum
kommerziellen Betrieb aussteht, wird das Repo nicht berührt — weder Daten noch
Muster, auch nicht lesend zum Vergleich.

---

## 5 — Bewertungsfragen — beantwortet 15.8.2026 (bis auf Ziff. 5)

*Historischer Kopf (3.8.2026): «Ausdrücklich nicht hier entschieden — Auftrag
David: Neubewertung durch Folge-Session, Roadmap `QS-EXTQUELLEN`.» Die
Neubewertung hat am 15.8.2026 stattgefunden; die Antworten stehen je Frage
unmittelbar darunter. Ziff. 1–4 sind technische Entscheide (Delegation David
8.8.2026), Ziff. 5 ist eine Geschäftsfrage und bleibt bei David.*

1. Ist ein Dritt-Zweitbestand als **Diff-Orakel** doktrin-verträglich, oder ist
   er faktisch der Mittelsmann, den PLAN-OCL-ABBAU Ziff. 1 ausschliesst? Der
   Unterschied liegt darin, ob er je etwas *anzeigt* oder je etwas *liefert*.

   **Antwort 15.8.2026: doktrin-verträglich im Grundsatz — praktisch trotzdem
   verworfen.** Die gezogene Linie stimmt: ein Bestand, der ausschliesslich
   *anzeigt*, ist kein Mittelsmann. Aber sie ist nicht durch Vorsatz zu halten.
   Die Trennung «zeigt an / liefert» überlebt nur, wenn ein **Tor** sie erzwingt
   (kein Byte aus dem Dritt-Bestand erreicht je ein Artefakt) — und ein solches
   Tor müsste erst gebaut, gepflegt und einmal rot gezeigt werden (§6.7). Diese
   Kosten trägt der Nutzen nicht mehr, seit die Zielfehlerklasse ohne
   Dritt-Bestand gefunden wird (§1.2, PR #497). **Regel für die Zukunft:**
   Dritt-Korpus nur mit Tor, das die Lieferung technisch verunmöglicht — nie
   mit einer Absichtserklärung.

2. Feiertage: genügt die BJ-Neupublikations-Prüfung, oder ist die im
   Verfallsregister als «offen» geführte kantonale Einzelverifikation der
   eigentliche Schritt? Die Zweitquelle deckt heute 2 von 26 Kantonen.

   **Antwort 15.8.2026: die kantonale Einzelverifikation ist der eigentliche
   Schritt.** Die BJ-Neupublikations-Prüfung ist notwendig, aber nicht
   hinreichend: sie ersetzt keine Norm-Verankerung, weil auch ein frisches
   BJ-Sammelverzeichnis eine **Sekundär**-Zusammenstellung bleibt, während §7
   den Anker am kantonalen Erlass verlangt. Beide Prüfaufträge stehen bereits in
   **derselben** Verfallsregister-Zeile («Feiertagsverzeichnis (EJPD)»,
   Nächste-Prüfung-Spalte) — es entsteht **keine neue Zeile**, weder im Register
   noch im Plan. Die Zweitquelle spielt in dieser Antwort keine Rolle mehr
   (§1.1: verworfen).

3. Gemeindeverzeichnis: Build-Time-Snapshot des vollen historisierten Bestands
   oder nur eine Validierungsliste des geltenden Stands? Grössen- und
   Perf-Wirkung (§15) ungeprüft.

   **Antwort 15.8.2026: nur die Validierungsliste des geltenden Stands.**
   Grösse jetzt gemessen (§1.3): 135 KB / 2 281 Zeilen / 2 110 Gemeinden —
   Perf ist nicht das Argument, **§5 ist es**: der historisierte Vollbestand
   hätte keinen Leser, weil unsere Zuständigkeits-Logik den Ort nicht datiert
   auflöst. Ein gepflegter Bestand ohne Leser ist eine zweite Wahrheit.

4. Amtskreise: fällt der Vollausbau unter die **26×-Slot-Regel**? Und ist ein
   Teilausbau (BE, ZH) ehrlich darstellbar, ohne den Eindruck der
   Vollabdeckung zu erwecken (§8)?

   **Antwort 15.8.2026: ja — und der Teilausbau scheitert nicht an der
   Ehrlichkeit, sondern am Nutzen.** Vollausbau = 26×-Asset, Slot von `W3·12`
   gehalten (Leitprinzip 4). Teilausbau wäre mit klarer Beschriftung
   §8-konform darstellbar, liefert aber ein Werkzeug, das in 24 Kantonen
   achselzuckt (§1.4). Beides verworfen; Wiedervorlage erst bei einem
   nationalen Register.

5. **Frage an David:** wird LexMetrik kommerziell betrieben? Davon hängt ab,
   ob `droid-f/fedlex` (NC) überhaupt berührt werden darf.

   **Antwort David 15.8.2026 (Chat): «nein, nicht kommerziell.»** Damit ist
   NC-Material für LexMetrik lizenzrechtlich grundsätzlich zulässig; die
   Nutzungspflicht bleibt bei jeder Quelle die Namensnennung + Share-Alike.
   Für `droid-f/fedlex` ändert das nichts — VERWERFEN aus den zwei anderen
   Gründen (kein Lizenztext, Zweitbestand obsolet). Kein Punkt dieses
   Dossiers wartet mehr auf David. Präzisiert nach der Nachprüfung (§4): Das Repo führt **gar keine
   Lizenzdatei**, die NC-Angabe steht allein in der README. Die Frage ist damit
   zweistufig — (a) betreiben wir kommerziell? und (b) selbst bei «nein» bliebe
   eine Nutzung auf eine README-Zusage gestützt, ohne Lizenztext. **Empfehlung
   unabhängig von der Antwort: nicht nutzen.** Der einzige Wert des Repos war
   der Zweitbestand, und der ist aus fachlichen Gründen verworfen (§1.2); die
   Lizenzfrage entscheidet damit nur noch darüber, ob eine bereits verworfene
   Option zusätzlich rechtlich gesperrt ist. Davids Antwort bleibt trotzdem
   wertvoll — sie wirkt über dieses Dossier hinaus auf **jede künftige
   NC-Quelle**.

---

## 6 — Nachprüfung 15.8.2026 (QS-EXTQUELLEN)

Alle Proben mit `curl`, Zeitlimit 20 s, eigener User-Agent; GitHub-Angaben aus
`api.github.com`. **Keine Fedlex-Endpunkte angefragt** — die Bewertung brauchte
keine, und die Regeln des Skills `scraping-swiss-official-sources` gelten dort
ungeschmälert.

| Endpunkt / Repo | 3.8.2026 | 15.8.2026 | Folge |
|---|---|---|---|
| `agvchapp.bfs.admin.ch/api/communes/snapshot` | 200 | **200** (135 173 B, 2 281 Z., 2 110 Gemeinden) | §1.3 übernehmen |
| `entscheidsuche.ch/_search.php` | 200 | **200** | §1.5 Verweis |
| `shab.ch/api/v1/rubrics` | 200 | **200** | §2 geparkt |
| `ch.ch/de/ejustice/` | 200 mit 404-Seite | **200 mit 404-Seite** («Error Page (404)» im Text) | §3 Ziff. 2 bestätigt |
| `backend-rates.ezv.admin.ch/api/xmldaily` | 000 | **000** | §3 Ziff. 4 bestätigt |
| `HexagonSwiss/swiss_holidays` | 2 Kantone, MIT | **2 Kantone** (ch-zh, ch-ti), MIT, Push 30.7.2026 | §1.1 verwerfen |
| `benjamin-arfa/swiss-law` | «Pipeline MIT», aktiv | LICENSE-Wortlaut MIT, GitHub `NOASSERTION`, Push 10.8.2026 | §1.2 verwerfen |
| `droid-f/fedlex` | «CC BY-NC-SA 4.0» | **keine Lizenzdatei** (`/license` → 404), ⭐24, Push 15.8.2026 | §5 Ziff. 5 an David |
| `legalize-dev/legalize` | «aktiv» | Push **23.6.2026** (⭐267) — Angabe war falsch | §1.2 korrigiert |
| `schoero/swissqrbill` | ⭐241, MIT | ⭐242, **MIT**, Push 14.8.2026 | §2 übernehmen |

**Vorgeschlagene Plan-Zeilen (Vorschlag, nicht eingetragen — die ROADMAP wird
vom Orchestrator geführt):**

1. `W3-AUSBAU` · Fläche Rechner — «**Gemeinde-Validierungsliste (BFS eCH-0071)**:
   Build-Time-Snapshot mit gepinntem Stichtag, prüft Ortseingaben in
   `zustaendigkeit.ts`/`schkgZustaendigkeit.ts` und Vorlagen als **Hinweis**
   (nie Blockade, §8); kein historisierter Bestand, Rechtslogik unberührt (§1).
   Beleg: `bibliothek/recherche/externe-quellen-repos-2026-08-03.md` §1.3.»
2. `W3-AUSBAU` · Fläche Vorlagen — «**QR-Zahlteil (`swissqrbill`, MIT)** in
   Zahlungs-Vorlagen — gebunden an die Existenz einer solchen Vorlage
   (Honorarnote/Kostenvorschuss/Mahnung); browser-seitig und deterministisch,
   §15-Bewertung der Bundle-Wirkung vor Aufnahme. Beleg: ebd. §2.»
3. `W3-AUSBAU` · Fläche Vorlagen — «**PDF/A-2b-Export vorbereiten**, Wiedervorlage
   **1.1.2027**: BEKJ tritt 1.7.2027 in Kraft, `jspdf` erreicht PDF/A-2b nicht
   sauber → Export-Schicht-Umbau mit Vorlauf planen. Beleg: ebd. §2.»

Zeile 1 und 2 sind Bau-Zeilen, Zeile 3 ist eine Termin-Zeile. **Mehr nicht** —
alle übrigen elf Befunde enden hier, nicht im Plan.
