# Amtliche Erlass-Abkürzungen DE/FR/IT aus Fedlex (`jolux:titleShort`)

**Erstellt 28.7.2026 · Ausführungsbeleg §11 zur Bau-Einheit ROADMAP `W2·6-NKEY` (Baustein b).**
**Stand:** 28.7.2026, Stichtag des gepinnten Laufs `--datum=2026-07-28`; Abdeckung **200/230 SR**
(de 200 · fr 199 · it 198). **Status:** ZWEIFACH GEPRÜFT (Bau + adversariale Gegenprüfung Opus,
4 Runden, frischer Kontext); fachliche Abnahme durch David offen.

**Nachtrag 28.7.2026 — Status: GEBAUT, ZWEI GEGENPRÜFUNGS-RUNDEN WIDERLEGT.** Runde 1 widerlegte
die Begründung von Regel 5 und die blinde Verlust-Gegenprobe; Runde 2 widerlegte die feste
Füll-Auswahl und den Prozess-Exit vor der zweiten Nachfrage (sechs SR wären dauerhaft
unbeurteilbar geblieben). Beides ist unten korrigiert, beide Widerlegungen sind als Lehre
festgehalten. **Runde 3 ist offen**, ebenso die fachliche Abnahme durch David.

Drei Ergänzungen gegenüber #397: (1) Das
Artefakt hat jetzt ein **Drift-Tor** `check:fedlex-abk-netz` — damit trägt es das vierte Merkmal
der Zitat-Ausnahme (§7 lit. d), das ihm bis hierher fehlte; siehe *Drift-Erkennung* unten.
(2) Die eine offene **Divergenz Register ↔ amtliches Kürzel** (SR 0.142.30) ist unten als
Entscheid-Vorlage für David festgehalten. (3) Die **Korpus-Kandidaten** aus dem überholten
Parallelbau (PR #398) sind unten mit SR-Nummer und gemessener Nennungszahl nachgetragen.

## Wozu

Ein Bundesgerichtsentscheid in französischer Amtssprache zitiert «art. 42 **LTF**», ein
italienischer «art. 41 **CO**» — dasselbe Bundesgesetz, ein anderes amtliches Kürzel. Die
normKeys-Zuordnung kannte nur die deutsche Anzeige-Abkürzung aus dem `ERLASS_REGISTER`, darum
verschwand jedes fr/it-Zitat lautlos. Diese Kette liefert die fehlende **Alias-Ebene**: amtliche
Kurzbezeichnung je SR-Nummer und Amtssprache, nicht geraten, nicht übersetzt, nicht aus
Modellwissen (§7).

Die Aliase sind **keine zweite Wahrheit** (§5): der Erlass-Bestand bleibt das Register, das
generierte Artefakt trägt nur dessen fremdsprachige Namen.

## Regel (Eingabe → Ausgabe)

**Eingabe:** SR-Nummer eines Bund-Erlasses aus `ERLASS_REGISTER` + Stichtag `YYYY-MM-DD`.
**Ausgabe:** 0..3 Zeilen `{ sr, sprache, abk }` — die amtliche Kurzbezeichnung der am Stichtag
geltenden Konsolidierung, je Amtssprache; leer, wenn Fedlex für diesen Erlass keine führt.

**Property:** `jolux:titleShort` am sprachlichen Ausdruck (`jolux:isRealizedBy`) des
`jolux:ConsolidationAbstract`, das über `jolux:classifiedByTaxonomyEntry` an der SR-Notation hängt.

## Die fünf Regeln, ohne die das Artefakt falsch wird

1. **Datentyp-IRI an der Notation ist Pflicht.** `?e skos:notation "220"` trifft ohne Typ-IRI auch
   die Notationstypen `id` und `id-amt` — also **fremde Erlasse mit derselben Zeichenkette**. Nur
   `"220"^^<https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique>` ist die
   SR-Nummer.
2. **Currency-Fenster gegen Schatten-Abstracts.** An einer SR-Nummer hängen historische
   Konsolidierungs-Abstracts abgelöster Erlasse: SR 173.110 trägt BGG **und** OG, SR 101 trägt BV
   **und** BV 1874. Ohne Fenster liefert dieselbe `(sr, sprache)` zwei verschiedene Kürzel.
   Fenster = `dateEntryInForce <= Stichtag` UND **kein** `dateNoLongerInForce <= Stichtag`.
   Empirisch (27.7.2026, 227 SR): mit Fenster **0 Konfliktgruppen**.
3. **Trim + Leerstring-Verwurf.** Der Endpoint liefert 42 Zeilen mit führendem Leerzeichen
   (z. B. `' LRD'`) und 761 Zeilen mit leerem `titleShort`. Beides wird in der Abfrage bereinigt
   und in TypeScript ein zweites Mal geprüft — billig, und es hält das Artefakt sauber, falls der
   Endpoint sich ändert.
4. **Stille Teilergebnisse — der gefährlichste Befund.** Der Endpoint antwortet gelegentlich
   (**≈2 von 20 Läufen**) mit HTTP 200 und **fehlenden Zeilen**. Ein Generator ohne Gegenprobe
   schriebe ein stillschweigend unvollständiges Artefakt, und niemand bemerkte die fehlenden
   Kürzel (§6.7). Darum je Batch (40 SR) ein **COUNT-Gate über dieselbe DISTINCT-Projektion**,
   bis zu 5 Anläufe, danach Abbruch ohne Schreiben. **Je Anlauf ein frisches Paar** (COUNT +
   Zeilen): ein Vergleich, dessen Referenz denselben Fehler haben kann wie der Prüfling, prüft
   nichts — war der erste COUNT der verstümmelte, bestätigte das «Tor» sonst ein Teilergebnis.
   Global zusätzlich: sinkt die Zeilenzahl unter die des committeten Artefakts, bricht der
   Generator ab — ein Netz-Ausfall darf Bestand nicht löschen.

5. **Stille Kappung — sie hängt an der ZUSAMMENSETZUNG der Abfrage, nicht an ihrer Grösse.**
   *(Befund 28.7.2026. Diese Regel stand zwischenzeitlich falsch hier — «Ein-Element-Batches
   liefern 0 Zeilen» —, und zwar in beiden Hälften. Die adversariale Gegenprüfung hat sie
   widerlegt: die Einzelmessungen waren richtig, der Schluss daraus nicht. Die Korrektur steht
   hier statt einer stillen Löschung, weil der Fehlschluss selbst die Lehre ist — zwei
   zusammenpassende Messungen sind noch keine Ursache.)*

   Gemessen (deterministisch über 5–6 Läufe, HTTP 200, COUNT stets = Zeilenzahl):

   | `VALUES`-Liste | Ergebnis |
   |---|---|
   | `{281.1}` allein | **3/3** — ein Ein-Element-`VALUES` ist also nicht per se kaputt |
   | `{0.142.30}` allein | **0/0** — obwohl `dateEntryInForce` = 1955-04-21 |
   | `{0.142.30, 281.1}` | **3/3**, 6× hintereinander — die `FK`-Zeile fehlt still |
   | `{0.142.30, 281.1, 220}` | **7/7** — `FK` wieder da |
   | `{0.101, X}`, X ∈ {221.213.11, 221.411.1, 955.033.0} | je **3/3** über 5 Läufe, X still weg, `0.101` vollständig |
   | dieselben X im 4er-Batch | **12/12** — X vorhanden |
   | `{0.101, 0.142.112.681, 0.142.30, X}` (= die alte Füllung `slice(0,3)`), X ∈ {142.204, 161.1, 170.512, 211.412.411, 251, 946.512} | je **7/7** über 5 Läufe, X still weg — **sechs** von 200 Alias-SR |
   | dieselben sechs X in gestreuter Füllung (13 SR) | **HIT** — X vorhanden |
   | `{0.101, 220, 251}` und `{220, 210, 251}` | je **6/6**, 251 weg — die Pathologie ist NICHT auf `0.*`-Füller beschränkt |
   | identische Wertemenge vorwärts vs. rückwärts | beide **7/7**, X beide Male weg — **Reihenfolge ist kein Wirkmittel** |

   Stufenweise isoliert für `{0.142.30}`: Notations-Join 1 → plus `ConsolidationAbstract` 25 →
   plus `dateEntryInForce` 25 → **plus `FILTER(?von <= "2026-07-28"^^xsd:date)` 0**. Bei einem
   Inkrafttretens-Datum von 1955 kann dieser Filter logisch nicht greifen: es ist eine daten- und
   planabhängige Endpoint-Pathologie, keine Semantik.

   **Warum das die gefährlichste Fehlerart ist:** Regel 4 kann sie prinzipiell nicht sehen —
   Zeilen- und COUNT-Abfrage sind gleich falsch (§6.7). Und **keine Batch-Grösse ist beweisbar
   sicher**, weil die Kappung an den Werten hängt, nicht an ihrer Anzahl. `batchListe()` hält
   Batches darum bei ≥ 3 SR als billigen Gürtel **ohne Garantie**; tragend ist allein die
   Verlust-Gegenprobe des Drift-Tors mit mehreren gestreuten Zusammensetzungen (unten).

**Konflikte werden nicht geraten (§8):** trägt eine `(sr, sprache)` trotz Fenster zwei
verschiedene Kürzel, bricht der Generator mit Fehler ab, statt still zu tiebreaken.

## Geltungsbereich und Ausnahmen

- **Nur Bund-Einträge.** Bei kantonalen Registereinträgen trägt `sr` die **kantonale**
  Systematiknummer, die einer Bundes-SR zufällig gleichen kann («161.12» in BE) — eine Auflösung
  darüber zeigte auf einen völlig anderen Erlass (§1). Staatsverträge (SR `0.*`) sind erfasst.
- **Ausschluss wirkt auch auf Aliase.** SR 641.10 (Stempelabgaben) ist als `StG` föderal/kantonal
  mehrdeutig und darum in `ABK_AUSSCHLUSS`; die amtlichen Kürzel `LT` (fr) und `LTB` (it) sind es
  nicht und würden denselben Key `STG` **durch die Hintertür** in den Korpus tragen. Das wäre eine
  fachliche Entscheidung, und die trifft kein Build-Schritt nebenbei (§7/§8).
- **30 der 230 SR führen kein `titleShort`** — das ist eine Quellen-Eigenschaft, kein Fehler.
- **62 der 597 Zeilen sind im Fliesstext-Pfad strukturell unerreichbar** (Leerzeichen im Kürzel,
  Trennzeichen, Akzent im Wortinnern …); im `statutes`-Pfad wirken sie. `check:normkeys` weist sie
  einzeln mit Ursache und Korpus-Beleg aus, statt sie zu verschweigen.

## Regenerieren

```
npm run gen:abk-aliase -- --datum=$(date +%F)
```

Stichtag ist **Pflicht** (§2): er geht ins Currency-Fenster ein, steht im Datei-Kopf und macht den
Lauf reproduzierbar — kein `Date.now()`.

- **Generator:** `scripts/normtext/abk-aliase-generieren.ts`
- **Artefakt:** `src/lib/normtext/abk-aliase.generated.ts` (`merge=regen` §12; nicht aus `src/`
  importieren — reine Build-Zeit-Quelle, §15)
- **Verbraucher:** `scripts/normtext/entscheide-mapping.ts` (löst je Zeile `sr` → Register-key auf)
- **Tore:** `npm run check:normkeys` misst Abdeckung, Kollisionen und die unerreichbaren Formen ·
  `npm run check:fedlex-abk-netz` misst Drift gegen die Amtsquelle (unten)

## Drift-Erkennung (`check:fedlex-abk-netz`, seit 28.7.2026)

Ein gespeicherter Rechtswert ohne Drift-Erkennung ist keine Abschrift, sondern eine zweite
Wahrheit (§5/§7 lit. d): ändert Fedlex ein `titleShort`, wird ein Erlass abgelöst oder kommt ein
Kürzel hinzu, bliebe das committete Artefakt still falsch. Das Tor ist der **`--check`-Modus
desselben Generators**, nicht ein zweites Skript — Prüfling und Prüfer benutzen damit dieselbe
SPARQL-Kette, dieselben fünf Regeln und dieselbe Zeilenberechnung (§5). Ein Parallel-Skript
verglich am Ende zwei Abfragen und driftete unbemerkt vom Generator weg (§6.7).

**Regel (Eingabe → Ausgabe).** Eingabe: committetes Artefakt + Live-Abfrage zum Stichtag
(Prüf-Modus ohne `--datum` = heute). Ausgabe: grün nur bei **mengengleicher** Deckung in beide
Richtungen; sonst rot mit drei getrennten Klassen — `GEÄNDERT` (dieselbe `(sr, sprache)`, anderes
Kürzel), `NEU` (Fedlex führt ein Kürzel, das Artefakt nicht), `WEGGEFALLEN` (Artefakt führt eines,
Fedlex am Stichtag nicht mehr).

Warum die drei Riegel so gebaut sind — und wie sie am 28.7.2026 **rot gezeigt** wurden (§6.7):

| Riegel | Verhalten | Sabotage-Probe (Manipulation nicht committet) |
|---|---|---|
| Drift | exit 1, je Klasse einzeln benannt | manipulierte Artefakt-Kopie → `1 geändert · 1 neu · 1 weggefallen` |
| Netzfehler | eigener Pfad, spricht die Nicht-Aussage aus | falscher Host → «fetch failed»; falscher Pfad → «antwortet 405» |
| leeres/partielles SPARQL-Resultat | nie grün | `FILTER(false)` in der Abfrage → «ENDPOINT LIEFERTE 0 ZEILEN … Quellen-, kein Rechts-Befund» |

Ein Teilergebnis kann nicht als «kein Drift» durchgehen: es erscheint zwingend als
`WEGGEFALLEN`. Zusätzlich gilt je Batch weiterhin das COUNT-Tor mit frisch geholtem Paar
(Regel 4 oben).

### Verlust-Gegenprobe — zweimal widerlegt, bevor sie trug

Ein weggefallenes Kürzel und ein still gekapptes Resultat sehen im Vergleich **identisch** aus.
Die Geschichte dieser Gegenprobe ist die Lehre:

- **Fassung 1** fragte nur die betroffene SR nach. Wegen Regel 5 kam 0/0 zurück — sie
  «bestätigte» damit **jeden** Verlust. Ein Prüfer, der immer bestätigt, prüft nichts (§6.7).
- **Fassung 2** nahm «drei Kanarienvögel» dazu — tatsächlich `live.slice(0, 3)`, also die
  **drei Sprachzeilen EINER fremden SR**, faktisch ein einziger Kanarienvogel. Ergebnis: eine
  2-SR-Nachfrage, in der die fremde SR lebte und die betroffene still gekappt wurde. Die
  adversariale Gegenprüfung hat das an drei Fällen belegt (`{0.101, X}` mit
  X ∈ 221.213.11 / 221.411.1 / 955.033.0, je 5/5 Läufe): das Tor meldete «Verlust in der
  Gegenprobe bestätigt» für Kürzel, die Fedlex führt — eine **erfundene Rechtsänderung** samt
  Aufforderung, sie ins Artefakt zu übernehmen (§8). Eine Kontrolle, die systematisch woanders
  hinschaut als der Prüfling, ist keine.

- **Fassung 3** streute nicht: sie füllte mit `fremde.slice(0, 3)`, also immer denselben drei
  codepoint-kleinsten SR — einer nachweislich pathologischen Wertemenge (Regel 5, Nachtrag: sechs
  SR werden davon deterministisch gekappt). Schlimmer war die Kontrollstruktur: eine nicht
  aussagekräftige Nachfrage **beendete den Prozess**, womit jede weitere Zusammensetzung toter
  Code war. Für diese sechs SR — darunter **SR 251 (KG)** — hätte es damit *nie* ein Urteil
  gegeben: echter Drift hätte den Wochen-Cron dauerhaft rot gefahren, mit Schuldzuweisung an den
  Endpoint und ohne Heilungsweg. Ein Tor, das nicht heilen kann, ist kein Tor, sondern ein Alarm,
  den man abstellt.

**Fassung 4 (geltend).** Sechs Bedingungen; welche davon rot gezeigt sind, steht in der Spalte —
die frühere Behauptung «jede Bedingung einzeln rot gezeigt» war zu weit gefasst:

| # | Bedingung | Nachweis |
|---|---|---|
| 1 | Bis zu **4 gestreute** Zusammensetzungen (gleichmässige Schritte mit Offset, nicht der Listenanfang); eine nicht aussagekräftige wird **übersprungen**, nicht abgebrochen | rot gezeigt: erzwungene pathologische Komposition 1 → `Nachfrage 1 NICHT aussagekräftig … nächste versuchen`, Kompositionen 2 + 3 tragen das Urteil |
| 2 | Verlust erst bestätigt, wenn **2 aussagekräftige, verschiedene** Wertemengen ihn einig vermissen (Hauptlauf = weitere Zusammensetzung) | rot gezeigt: Phantom-Zeile → `Verlust in 2 aussagekräftigen, verschiedenen Zusammensetzungen bestätigt` |
| 3 | **Positivkontrollen derselben SR**, kein Fremd-SR-Ersatz | rot gezeigt (Fassung 2 fiel genau hier durch) |
| 4 | Nicht absicherbar (keine Live-Zeile der SR) ⇒ **kein Urteil**, «nichts löschen» | rot gezeigt an je 3 + 6 SR |
| 5 | Zu wenige fremde SR für verschiedene Wertemengen ⇒ ehrlicher Abbruch | rot gezeigt: `nur 3 fremde SR … nötig sind 6` |
| 6 | Leere Kontroll-Liste ⇒ Abbruch | **nicht rot gezeigt, weil unerreichbar** — Bedingung 4 filtert vorher jede SR ohne Live-Zeile. Steht als Konstruktions-Zusicherung (`throw`) für künftige Umbauten, nicht als geprüfter Riegel (§6.7-Ehrlichkeit) |

Die **Reihenfolge** der Werte ist gemessen wirkungslos (identische Wertemenge kappt vorwärts wie
rückwärts identisch) und wird darum nicht mehr als Diversifizierung behauptet; es zählt allein die
Wertemenge.

Auch ein *bestätigter* Verlust führt nicht mehr zur Regenerier-Empfehlung ohne Warnung: die
Löschung eines amtlichen Kürzels ist eine fachliche Abnahme, kein Build-Schritt (§7/§8). Der Stichtag ist im Prüf-Modus **absichtlich** der heutige Tag: gegen den
eingefrorenen Artefakt-Stichtag geprüft, könnte das Tor die wichtigste Drift-Art — eine erst
NACH dem Artefakt-Stand in Kraft getretene Konsolidierung — gar nicht sehen. Wanduhr steckt damit
nur im Prüf-Pfad, nie im Schreib-Pfad und nie in der Rechenlogik (§2).

Eingehängt am Ende der `check:netz`-Kette; ausgeführt wird sie in
`.github/workflows/normen-monitor.yml`.

## Offene Divergenz: Register «GFK» ↔ amtlich «FK» (SR 0.142.30) — ENTSCHEID DAVID

Der `--check`-Lauf weist eine Divergenz als **HINWEIS ohne Tor** aus (28.7.2026: genau eine):

| | Wert | Fundort |
|---|---|---|
| Register (Anzeigeform) | `GFK` | `src/lib/normtext/register.ts:331` (`bund('GFK', 'GFK', …, '0.142.30', …)`) |
| Fedlex `jolux:titleShort` (de) | `FK` | Artefakt-Zeile 19, `src/lib/normtext/abk-aliase.generated.ts` |

**Amtliche Belegstelle (§7, Abruf 28.7.2026).** Fedlex-SPARQL, Konsolidierungs-Abstract
`https://fedlex.data.admin.ch/eli/cc/1955/443_461_469`, `jolux:dateEntryInForce` 1955-04-21, kein
`dateNoLongerInForce`: `jolux:title` (de) = «Abkommen vom 28. Juli 1951 über die Rechtsstellung
der Flüchtlinge (mit Anhang)», `jolux:titleShort` (de) = **«FK»**. Geltende Fassung:
<https://www.fedlex.admin.ch/eli/cc/1955/443_461_469/de>.

Der amtliche Titel führt die Wendung «Genfer Flüchtlingskonvention» **nicht**; «GFK» ist die in
der Rechtsprechung gebräuchliche Form, nicht die amtliche Kurzbezeichnung. Korpus-Beleg (Treffer
mit Wortgrenze, 28.7.2026): **8 Entscheid-Snapshots** verwenden «GFK», keiner «FK» für diesen
Erlass — z. B. `kanton/BS/bs_appellationsgericht/SB.2021.37`: «Gemäss Art. 33 Abs. 1 des
Abkommens über die Rechtsstellung der Flüchtlinge (GFK, SR 0.142.30) …». Beide Lesarten sind
vertretbar: `FK` ist amtlich (§7), `GFK` ist die Form, unter der Nutzer suchen und zitieren
(§8) — und im eigenen Korpus die einzige belegte.

**Nicht entschieden, absichtlich.** `register.ts` bleibt unberührt: welche Form im UI steht, ist
eine fachliche Entscheidung über die Anzeige und kein Build-Fakt — ein Skript, das sie nebenbei
trifft, wäre genau die stille Regeländerung, die §7/§8 verbieten. Rot machen darf das Tor deshalb
auch nicht (es erzwänge eine Antwort, die nur David geben kann); still lassen wäre Vergessen.
Darum: Ausweisung im Tor-Log + diese Aktenlage.

**Mechanisch harmlos — nachgemessen 28.7.2026.** Die Divergenz kostet keine Verzahnung: `FK`
(Alias-Zeile, Auflösung über `sr` → Register-key) und `GFK` (Register-Kürzel) sind zwei
verschiedene Token, die **auf denselben Key** zeigen. Gemessen über die Produktfunktion:
`normKeyFuerAbk('FK') = GFK`, `normKeyFuerAbk('GFK') = GFK` (ebenso klein geschrieben, die
Normalisierung greift). Beide Zitierweisen werden also erkannt. Zu entscheiden ist ausschliesslich
die **Anzeige- und Massgeblichkeitsfrage**, nicht die Erkennung.

Zu entscheiden ist genau eines: Anzeige-Kürzel für SR 0.142.30 bleibt `GFK` (dann bleibt die
Divergenz als deklarierte Anzeigeform stehen) **oder** wird auf `FK` gezogen (dann bleibt «GFK»
über das Register-Kürzel weiterhin auflösbar, sofern es dort als Kürzel oder Alias erhalten
bleibt).

### Drei benachbarte Fälle, die KEINE Divergenz sind (je ein Satz, Fundort statt Wiederholung)

- **SR 0.211.231.011 — Abdeckungs-Lücke, nicht Namensstreit.** Register-Kürzel `HKsÜ` **stimmt**
  mit dem deutschen `titleShort` überein; Fedlex führt zusätzlich `CLaH 96` (fr) und **kein**
  italienisches Kürzel — italienische Zitate dieses Übereinkommens werden darum nicht erkannt
  (Artefakt: zwei Zeilen für diese SR).
- **SR 641.10 (`StG` / `LT` / `LTB`)** ist bereits oben unter *Geltungsbereich und Ausnahmen*
  behandelt (Ausschluss wirkt auch auf die fremdsprachigen Aliase) — hier nicht wiederholt.
- **`VBB` vs. `VFRR`** ist **key ≠ Kürzel**, keine Divergenz zum amtlichen Kürzel: der
  Register-Eintrag `src/lib/normtext/register.ts:212` trägt den Snapshot-Key `VBB` und das
  Kürzel `VFRR` — und `VFRR` ist genau das deutsche `titleShort` zu SR 281.31 (Artefakt Zeile 220).
  Abweichend von der Übergabe-Notiz steht der Fall nicht in einem Mapping-Kommentar, sondern in
  dieser Registerzeile.

## SR-Nummern ohne amtliches `titleShort` (30 von 230) — vollständige Liste

Bisher war nur die Quote (200/230) festgehalten, nicht **welche**. Damit war die praktisch
wichtige Aussage — für diese Erlasse gibt es keinen fremdsprachigen Zugang — nirgends nachlesbar.
Quelle: eigener SPARQL-Abruf (dieselbe Kette wie oben), **Stand 28.7.2026**, Stichtag 2026-07-28;
`kein titleShort in der geltenden Fassung` ist eine Eigenschaft der Quelle, kein Fehler.

**Behandlung:** kein Alias · das **deutsche Register-Kürzel ist der einzige Zugang** · Zitate
dieser Erlasse in französischer oder italienischer Amtssprache werden **nicht erkannt** und
erscheinen nicht in der Verzahnung. Kommt ein solcher Erlass fremdsprachig gehäuft vor, ist das
kein Alias-Problem, sondern eine bewusste fachliche Entscheidung über ein Hand-Kürzel (§5/§7).

| SR | Register-key | Kürzel |
|---|---|---|
| 0.103.1 | UNO_PAKT_I | UNO-Pakt I |
| 0.103.2 | UNO_PAKT_II | UNO-Pakt II |
| 0.105 | UNO_ANTIFOLTER | UN-Antifolterkonvention |
| 0.107 | KRK | KRK |
| 0.108 | CEDAW | CEDAW |
| 0.109 | UNO_BRK | UNO-BRK |
| 0.111 | VRK | VRK |
| 0.142.40 | STAATENLOSE | Staatenlose |
| 0.172.030.4 | APOSTILLE | Apostille-Übk. |
| 0.211.213.02 | HUVUE | HUVÜ |
| 0.211.221.311 | HAUE | HAÜ — amtliche Kurzform aus dem Ingress des BG-HAÜ (SR 211.221.31, Fassung 1.1.2013, https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2002/639/20130101/de/html/fedlex-data-admin-ch-eli-cc-2002-639-20130101-de-html-6.html, abgerufen 25.9.2026); bis 25.9.2026 Hand-Kürzel «HAdoptÜ» (Gegenprüfung HN-04 B1) |
| 0.211.230.02 | HKUE | HKÜ |
| 0.211.232.1 | HEUE | HEsÜ |
| 0.221.211.1 | CISG | CISG |
| 0.231.15 | RBUE | RBÜ |
| 0.232.04 | PVUE | PVÜ |
| 0.274.131 | HZUE | HZÜ |
| 0.274.132 | HBEWUE | HBewÜ |
| 0.277.12 | NYUE | NYÜ |
| 0.311.35 | ISTANBUL | Istanbul-Konv. |
| 0.353.1 | EAUE | EAUe |
| 0.748.0 | ICAO | ICAO-Übk. |
| 0.748.411 | MONTREAL | Montrealer Übk. |
| 142.513 | ZEMIS_V | ZEMIS-V |
| 232.16 | SORTG | SortG |
| 360.1 | ZENTV | ZentV |
| 641.71 | CO2_GESETZ | CO2-Gesetz |
| 642.118.1 | BKV | BKV |
| 810.21 | TXG | TxG |
| 944.3 | PRG | PRG |

23 der 30 sind **Staatsverträge** (SR `0.*`) — dort ist die fehlende Kurzbezeichnung der
Normalfall, nicht die Ausnahme. Der belegte Folgefall ist das Token `CV`: die
Wiener Vertragsrechtskonvention (VRK, SR 0.111) führt kein `titleShort`, also bleiben die
französischen/italienischen Zitate («Convention/Convenzione de Vienne») unauflösbar — gemessen
**18 Snapshots** und damit knapp unter der Tor-Schwelle von 20, weshalb `check:normkeys` sie heute
nicht einmal einfordert.

## Korpus-Kandidaten (Nachtrag 28.7.2026 aus dem überholten Parallelbau PR #398)

Bundeserlasse, die im Rechtsprechungs-Korpus **zitiert werden, aber nicht im `ERLASS_REGISTER`
stehen**. Das ist eine Ausbau-Liste, kein Mangel: die Lücke schliesst man durch **Aufnahme des
Erlasses**, nie durch ein Hand-Alias (das wäre eine zweite Wahrheit, §5).

**Was main schon deklariert:** `scripts/normtext/check-normkeys-abdeckung.ts` führt zwei Einträge
mit `srNummer` und weist sie im Tor-Log als KORPUS-KANDIDATEN aus — **BZP** (SR 273, 56 Snapshots)
und **WG** (SR 514.54, 22 Snapshots). Beide liegen über der Tor-Schwelle von 20 Snapshots und
brauchen darum ohnehin eine Deklaration. Die 22 Kandidaten unten liegen **unter** der Schwelle;
sie machen kein Tor rot und waren deshalb bisher nirgends festgehalten — genau die Sorte Wissen,
die sonst mit dem Branch verschwindet (§11).

**Verifikation (§7).** SR-Nummer ↔ Kürzel je Zeile live gegen Fedlex-SPARQL geprüft (Abruf
28.7.2026, `jolux:titleShort` am Konsolidierungs-Abstract im Currency-Fenster; dieselbe Kette wie
oben) — 22 Kandidaten-Zeilen über **18 distinkte SR-Nummern** (vier SR tragen je ein deutsches und ein fremdsprachiges Kürzel: 455, 651.1, 823.11, 851.1); der Abruf umfasste 20 SR, davon sind BZP/273 und WG/514.54 bereits im Tor deklariert. Keine der 20 steht im `ERLASS_REGISTER`. Nennungszahlen mit der
Messmechanik des Tors selbst erhoben (`check:normkeys`, committeter Korpus, 5 093 Snapshots):
`Snapshots` = in wie vielen Entscheiden das Token vorkommt, `roh` = Roh-Nennungen
statutes-/Fliesstext-Pfad.

Die Erlass-Spalte nennt die geläufige Kurzbezeichnung, **nicht** den wörtlichen amtlichen Titel —
massgeblich ist immer die Fedlex-Fassung zur SR-Nummer.

| Abk | SR | Erlass (Kurzbezeichnung) | Sprache des Kürzels | Snapshots | roh (stat./fliess.) |
|---|---|---|---|---:|---|
| LPA | 455 | Tierschutzgesetz (de: TSchG) | fr | 13 | 5 / 25 |
| ZG | 631.0 | Zollgesetz | de | 12 | 5 / 53 |
| AVG | 823.11 | Arbeitsvermittlungsgesetz | de | 11 | 7 / 20 |
| LAAF | 651.1 | Steueramtshilfegesetz (de: StAhiG) | fr + it | 9 | 20 / 51 |
| ZUG | 851.1 | Zuständigkeitsgesetz | de | 7 | 23 / 61 |
| STAHIG | 651.1 | Steueramtshilfegesetz | de | 6 | 7 / 22 |
| LRTV | 784.40 | Radio- und Fernsehgesetz (de: RTVG) | fr + it | 6 | 8 / 22 |
| LAS | 851.1 | Zuständigkeitsgesetz | fr + it | 5 | 7 / 14 |
| LSE | 823.11 | Arbeitsvermittlungsgesetz | fr | 5 | 12 / 21 |
| STROMVG | 734.7 | Stromversorgungsgesetz | de | 4 | 12 / 44 |
| ENV | 730.01 | Energieverordnung (de: EnV) | de | 4 | 6 / 14 |
| TSCHG | 455 | Tierschutzgesetz | de | 4 | 5 / 26 |
| ZV | 631.01 | Zollverordnung | de | 4 | 5 / 18 |
| SRVG | 196.1 | BG über gesperrte Vermögenswerte | de | 3 | 8 / 17 |
| AVEG | 221.215.311 | BG über die Allgemeinverbindlicherklärung von GAV | de | 3 | 6 / 13 |
| LFH | 721.80 | Wasserrechtsgesetz (de: WRG) | fr | 3 | 6 / 25 |
| AUFRBGER | 173.110.132 | Aufsichtsreglement des Bundesgerichts (de: AufRBGer) | de | 2 | 6 / 6 |
| BPI | 361 | BG über die polizeilichen Informationssysteme | de | 2 | 5 / 6 |
| LVA | 741.71 | Nationalstrassenabgabegesetz (de: NSAG) | fr | 1 | 7 / 14 |
| PRSG | 930.11 | Produktesicherheitsgesetz (de: PrSG) | de | 1 | 7 / 9 |
| LTEO | 661 | Wehrpflichtersatzabgabe-Gesetz (de: WPEG) | fr + it | 1 | 5 / 8 |
| NSG | 725.11 | Nationalstrassengesetz | de | 1 | 5 / 14 |

**Vor der Aufnahme je Kandidat zu klären (nicht geprüft, §1).** Ob das Kürzel einen **kantonalen
Namensvetter** hat — «LPA» ist in mehreren französischsprachigen Kantonen die Abkürzung eines
Verwaltungsverfahrensgesetzes, und ein Bundes-key wäre dort falsch. Dasselbe gilt für kurze,
gattungsartige Formen (`ZG`, `ZV`, `EnV`, `AVG`). Die Aufnahme eines Erlasses ist deshalb kein
Listen-Abarbeiten, sondern je Zeile ein Beleg-Entscheid; die Reihenfolge oben ist nur die
Häufigkeits-Priorität.

### Rohbefund: alle ungemappten Token ab 5 Snapshots (selbst gemessen, 28.7.2026)

Erhebung: `scripts/normtext/check-normkeys-abdeckung.ts` mit **temporär auf 5 gesenkter Schwelle**
(Änderung nicht committet), committeter Korpus, 5 093 Snapshots. Ergebnis: **70 ungemappte Token**
ab 5 Snapshots ohne Ignore-Eintrag. Die Liste ist ein **Rohbefund**, keine Kandidatenliste: sie
mischt Bundeserlasse ohne Register-Eintrag, kantonale Erlasse, EU-Recht, Alt-Fassungen und
Extraktions-Kappungen. Verifiziert sind bisher nur die 22 Zeilen der Tabelle oben.

```
CV 18 · COVID 16 · OBG 16 · OPP 15 · ACP 14 · CDI 14 · DBA 14 · PCF 14 · SCHLT 14 ·
EG 13 · GEBV 13 · LPA 13 · GOG 12 · VE 12 · ZG 12 · AVG 11 · OECD 11 · VFP 11 ·
AVV 10 · HVI 10 · LETR 10 · SDÜ 10 · AOR 9 · GAV 9 · LAAF 9 · PATGG 9 · ACO 8 ·
AVVG 8 · CDE 8 · ACC 7 · AEUV 7 · ANAG 7 · FN 7 · GE 7 · KVZH 7 · MC 7 · OPC 7 ·
ZUG 7 · AIVG 6 · DNA 6 · EPÜ 6 · GSOG 6 · LC 6 · LRTV 6 · NDG 6 · PC 6 · RTVG 6 ·
STAHIG 6 · STGBNEU 6 · TIT 6 · VRPGBE 6 · VSKV 6 · AELG 5 · AOG 5 · CDF 5 · CIAP 5 ·
ED 5 · EUGVVO 5 · KUVG 5 · KVAG 5 · KVBE 5 · LAS 5 · LCHP 5 · LCP 5 · LIVD 5 ·
LOI 5 · LSE 5 · OC 5 · OSE 5 · VEP 5
```

**Eine eigene Klasse: `a`-Präfix = Alt-Fassung, nicht eigener Erlass.** `ACP` (14 Snapshots) ist
«aCP» — die im Tatzeitpunkt geltende Fassung des Code pénal; Korpus-Beleg mit Wortgrenze: «… en
application de l'art. 34 al. 1 aCP, en vigueur au moment des faits». Das ist die
französisch-italienische Entsprechung der im Tor schon deklarierten deutschen Fälle `ASTGB`
(«aStGB») und `ABV` («aBV») und gehört wie diese **nicht** gemappt: die Artikel-Nummern der
Alt-Fassung treffen im Snapshot der geltenden Fassung anderes Recht (§1). Verdachtsfälle derselben
Klasse, **nicht verifiziert**: `ACC` («aCC»), `AOR` («aOR»); `ANAG` und `KUVG` sind vermutlich
aufgehobene Erlasse und damit eine benachbarte, andere Klasse — je Token am Korpus zu belegen.

**Warnung gegen Muster-Schlüsse — belegter Gegenfall.** `ACO` (8 Snapshots) ist **nicht** «ancien
CO», sondern die Kappung von «**aCO2-Gesetz**»: «… Reduktion der CO2-Emissionen vom 8. Oktober
1999 (aCO2-Gesetz, SR 641.17)». Wer die Klasse per Namensmuster abarbeitet statt je Token am
Korpus zu belegen, ordnet solche Token falsch zu — und eine Fehlzuordnung macht `check:normkeys`
sogar grüner, nicht röter (Richtungs-Umkehr, im Kopf des Tor-Skripts beschrieben).

**Nicht alle Lücken sind Alias-Lücken.** Ein Teil der Liste entsteht erst in der Erkennung
(abgeschnittene Codes, Verbund-Formen, `§`-Zitate). Die abschliessende Aufzählung dieser Grenzen
steht als Block **L1–L8** im Kopf von `src/lib/rechtsprechung/zitat-extraktion.ts` — dort und nur
dort gepflegt; hier bewusst nur der Verweis.

## Pflegebedarf

Kein Verfallsdatum im engen Sinn — die Kette ist **reproduzierbar**, nicht datenhaltend. Neu
aufzufrischen ist sie, wenn (a) neue Erlasse ins `ERLASS_REGISTER` kommen, (b) ein Erlass abgelöst
wird (Schatten-Abstract-Fall: das Fenster fängt es, aber nur beim Neulauf), oder (c)
`check:normkeys` fr/it-Kürzel über der Schwelle meldet, die das Artefakt nicht kennt.

## Abnahme-Status

Bau + 4 adversariale Gegenprüfungs-Runden (Opus, frischer Kontext) bestanden; Register-Zeile
28.7.2026 in `bibliothek/register/gegenpruefung-register.md`. **Fachliche Abnahme durch David
offen** — `verified`/«geprüft» wird nie automatisch gesetzt (§7).
