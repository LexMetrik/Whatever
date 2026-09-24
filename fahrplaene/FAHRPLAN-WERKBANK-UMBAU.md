# FAHRPLAN — Werkbank-Umbau: das neue Design an Ort, Rubrik für Rubrik
<!-- @lagebild name: Werkbank-Umbau · zweck: Die Website bekommt das Aussehen des Werkbank-Entwurfs — eine Rubrik nach der anderen, und die alte Hülle wird dabei jedes Mal gelöscht. -->

> **ROADMAP-Dach:** neun Schritte `W2·29-WERKBANK-*` (TOR · TOKENS · LESER · KATALOGE ·
> VORLAGEN · RECHNER · REST, dazu parallel GRUNDTON · START), Trailer `Roadmap: W2·29-WERKBANK-<X>`. Serielle `dep`-Kette —
> Grund in §2 (Abbruchkriterium).

## §1 · Anlass und Entscheid (22.9.2026)

**Auftrag David 22.9.2026: «go».** Die Website soll aussehen wie der Werkbank-Entwurf. Der
Entwurf ist **Ausgangspunkt, nicht Pflichtenheft**: die bauende Session entscheidet die Umsetzung
selbst, innerhalb des Design-Systems. Davids Last schrumpft damit auf die drei offenen
Design-Entscheide (§4) und die fachliche Abnahme (§7/§8 CLAUDE.md).

**Rats-Verdikt 22.9.2026** (fünf Berater + Gegenlese + Advocatus; die Session-Notiz liegt nicht im
Repo — die bindende Substanz steht hier in §1, §2 und §6) in fünf Sätzen:

1. **Kein Abriss** — die 1 158 Importe aus `src/lib` sind Typen, keine Logik-Duplikate.
2. **Kein neues Repo** — zwei Wahrheiten für `src/lib` verletzen §5.
3. **Keine Parallelhülle** — wer im selben PR löscht, baut ohnehin an Ort.
4. **Kein Flag** — der «eine Umschalt-Schritt» ist ein Monster-PR gegen 91 Tore.
5. **Kein Stack-Wechsel** — reisst SSG-Prerender, 168 e2e-Dateien und 91 Tore gleichzeitig auf.

**Ergebnis: Umbau an Ort mit Durchsetzung.** Entscheidend ist nicht die Variante, sondern ob der
Rückbau der alten Hülle **erzwungen** wird (§2) statt gehofft. **Quellen:**

- Werkbank-Entwurf, 18 Boards: <https://claude.ai/artifact/QAxEfCbtbK6AWSCmrbvH3A>
- Design-System mit `tokens.json`: <https://claude.ai/artifact/UqicjE8dbG5bnmfxSTZpaY>
- **Funktions-Inventar `docs/INVENTAR-FUNKTIONEN.md` = die Abnahmeliste je Rubrik.** Jede Fläche,
  jedes Feld, jeder Zustand wird beim Umzug daran abgehakt; die Rubriken-Karte in seinem Kopf
  ordnet Abschnitte den Rubriken zu, die Liste «Im Inventar, aber ohne Board» sagt, was der
  Entwurf **nicht** zeigt und die Session selbst entscheidet.

## §2 · Die vier bindenden Auflagen (wörtlich aus dem Verdikt)

1. **Löschpflicht im selben PR.** Eine Rubrik gilt erst als umgebaut, wenn ihre alte Komponente
   im selben PR verschwunden ist. Keine Koexistenz über einen PR hinaus.
2. **Eine Token-Quelle.** `tokens.json` wird generierende Quelle für `tailwind.config.js` und die
   `:root`-Blöcke in `src/index.css`; die fünf Reglemente werden zu Kommentaren darauf, nicht zur
   zweiten Wahrheit.
3. **`check:sediment` ohne Baseline-Ausnahme.** Keine Bestandsliste, keine Warnung-statt-Fail.
   Was heute rot ist, wird gefixt, nicht grandfathered.
4. **Abbruchkriterium je Rubrik.** Ist eine Rubrik nach drei Sessions nicht fertig, bleibt die
   alte Hülle und die Rubrik wird zurückgestellt. *(Daher die serielle `dep`-Kette: zwei offene
   Rubriken zugleich machen die Regel unprüfbar.)*

**Leitplanken.**

- **§1 / §3 / §5 / §6:** Golden byte-gleich, Engine-Tests unverändert (§6.3), Rechenfälle nie
  abstrahiert. e2e-Selektoren ziehen **mit der Rubrik** um — vor jedem Push die Sonden greppen
  (`e2e/**`, `src/tests/**`), Sweep `e2e/kein-abschnitt.e2e.ts` eingeschlossen.
- **§8 Ehrlichkeit:** die 39 geplanten Rechner- und 42 geplanten Vorlagen-Stubs bleiben als
  «In Vorbereitung» lesbar — der Entwurf darf sie nicht zu fertigen Werkzeugen machen.
- **Korpus-Pflege läuft parallel weiter** — §7-Frische-Workflows (Fedlex, Normen-Monitor,
  Currency) sind unberührt.
- **«Farbe als Fläche»** ändert F0.2 und `check:farbwelt` — **nur mit Davids Entscheid**.
- **Grundregel (Weisung David 22.9.2026, wörtlich: «grundregel für diesen umbau wenn möglich
  aufräumen» und «evtl. dinge auch nach obsidian vault auslagern soweit sinnvoll»):** jeder
  Schritt der Kette räumt, was er berührt — ungenutzte Exporte (`W2·29-WERKBANK-EXPORTE`),
  e2e-Sonden und Vitest-Ratschen, die eine gelöschte Hülle prüfen, gehen **mit der Hülle**
  (deklarierte Test-Änderung, §6.3); datierte Belege, die kein Werkzeug liest und kein Skill
  als Pflichtlektüre nennt, wandern in den Vault `03_Projekte/LexMetrik/archiv-belege/`
  (Kriterium und Erstfall: ROADMAP `QS-DOKU-DIAET`). Nach der Kette folgen `QS-TORE-DIAET`
  und `QS-DOKU-DIAET` (Go David 22.9.2026 «einverstanden zu allem»).
- **Löschbilanz je Rubrik-PR:** gelöschte Zeilen ≥ 50 % der hinzugefügten in `src/components`
  + `src/pages`. Wächst der Bestand netto, war es kein Umbau, sondern eine zweite Hülle.
- **Flacker-Regel (David 23.9.2026, Chat: ‹können solche probleme gleich mitgefixt werden?› — ja):**
  Jeder Rubrik-Schritt fixt die flackernden e2e-Specs seines Bereichs an der Wurzel statt
  Ausnahmen zu sammeln; Nachweis `check:e2e-flake` grün ohne neuen Ausnahme-Eintrag, Wurzel im
  Commit-Body.

## §3 · Schritt 0 — das Tor (`W2·29-WERKBANK-TOR`, `feld: betrieb`)

**Ziel:** ein Tor `check:sediment` gegen drei Gattungen, für die heute keine Wache existiert:

- **(a) tote CSS-Klassen** in `src/index.css` (Präfixe `lc-`, `lr7-` u. ä.) ohne Verwender in `src/**`;
- **(b) verwaiste Module** unter `src/components` / `src/pages` ohne Importer — **erst prüfen, ob
  das vorhandene `knip` das schon leistet**; wenn ja, einhängen statt verdoppeln
  (§17-Gegengewicht: keine Doppelwache);
- **(c) doppelte Metadaten-Quellen** — `src/lib/calculators.ts` gegen `startseiteConfig.ts` (Titel
  und Kurztexte der 20 Rechner): die dokumentierte §5-Verletzung, an der das Tor seinen
  Geburtsbeweis führt.

**Geburtsbeweis (§6.7):** Das Tor läuft auf dem heutigen Stand **rot** gegen (c); der PR zeigt die
Ausgabe rot **und** nach dem Fix (eine Quelle) grün. Keine Baseline, keine Ausnahmeliste, kein
Warnung-statt-Fail. Tor ins `gate:` einhängen, `check:tor-paritaet` grün.

**Bedingung des Rats:** Fällt das Tor **nicht** rot, fällt der Umbau-Plan — dann bleibt es beim
Restyling und TOKENS…REST werden gestrichen, nicht gebaut.

**Stand 22.9.2026:** gebaut und rot/grün bewiesen (PR #979: a 7→0 · b 4→0 · c 113→0; Census nach
Gegenprüfung auf postcss, 202 Klassen). **Nachtrag (d) — `W2·29-WERKBANK-EXPORTE`** (Go David
22.9.2026 «einverstanden zu allem»): vierte Gattung **ungenutzte Exporte und exportierte Typen**
ohne Importer — knip liefert sie bereits (`--include exports,types`; gemessen 22.9.2026: 84 + 43),
das Tor wertet die JSON-Liste wie bei (b) aus, kein Nachbau. Geburtsbeweis rot, dann jeder Fund
im selben PR beseitigt (Export-Schlüsselwort entfernen, wenn intern genutzt; sonst Code löschen),
keine Baseline. Grenzen: `src/lib/**` nur Export-Schlüsselwort (§3), Golden byte-gleich, e2e-Helfer
(`e2e/helpers/**`) sind Teil des Umfangs.

## §4 · Schritt 1 — Tokens (`W2·29-WERKBANK-TOKENS`, `feld: design`, dep `TOR`)

**Ziel:** eine Token-Quelle im Repo. `tokens.json` des Design-Systems kommt an **einen** Ort; ein
Generator erzeugt daraus die `:root`- und `html.dark`-Blöcke in `src/index.css` sowie die Farb-
und Typo-Teile von `tailwind.config.js`; `check:design-tokens` prüft die Drift generiert ↔ Quelle.
Die fünf `DESIGN-REGLEMENT*.md` werden auf **ein** Reglement konsolidiert, das die Token-Datei
kommentiert — keine zweite Wahrheit (§5).

**Grenzen:** Kontrast-Tore (`check:farbwelt`, axe, APCA) grün; Normtext-Körper farbfrei; keine
Rohwerte in Komponenten; Golden byte-gleich. **Die Startseite bleibt unberührt** — V4 Werkbank ist
seit 5.9.2026 live (`a66421362`).

**Die drei Entscheide Davids — entschieden 22.9.2026 (Chat, Blocker gelöst):**

1. **Seitenleiste: Aufbau bleibt wie heute im Produkt.** Keine der drei Entwurfs-Varianten
   ändert die Struktur (Einträge, Gruppen, Auf-/Zuklappen); nur Stil und Tokens ziehen nach.
2. **Startseite: Empfehlung des Orchestrators übernommen** — vier Kacheln (Gesetze · Rechtsprechung ·
   Materialien · Werkzeuge); die Zahl kommt aus dem generierten Zähler
   (`startseiteZaehler.generated.ts`, heute 23 Rechner-Karten + 26 Vorlagen im Register = 49),
   Unterzeile aus derselben Quelle, nie von Hand (§5/§8). Umsetzung im Schritt, der die
   Startseite anfasst — **seit 23.9.2026 KATALOGE statt REST** (§5, Entscheid David 23.9.2026).
3. **Farbe als Fläche: ja.** Reglement F0.2 («nie als Fläche») wird im Tokens-Schritt geändert,
   `check:farbwelt` auf die Flächen-Regel umgestellt — Kontrast-Schwellen bleiben unverändert.

**Stand 23.9.2026 — Schritt gebaut in zwei PRs.** T1 Code **#981** (`feat/w229-werkbank-tokens`):
`design/tokens.json` als eine Quelle, `npm run gen:tokens`, Tor `check:tokens-drift`, vier
Flächen-Token `--reg-*-flaeche` mit Pflichtpaaren in `check:farbwelt`. T2 Doku
(`docs/w229-tokens-reglement`, setzt #981 voraus): die fünf Reglemente sind **ein**
`DESIGN-REGLEMENT.md` (Teil I Dach, Teil II §N/§R/§J/§V), datierte Belege in
`archiv/DESIGN-REGLEMENT-BELEGE-2026.md`, F0.2 in der Fassung «Farbe als Fläche». Die
Schrumpfungs-Vorgabe ≥ 40 % ist **nicht** erreicht (Zahlen im T2-PR): die Normtext-Regeln
§N-4b/§N-4b-B/§N-4c bleiben wörtlich (Rechtsdarstellung), weiteres Kürzen hiesse Regeln streichen
— das bleibt ein Entscheid, kein Konsolidierungs-Nebeneffekt.

## §5 · Die fünf Rubrik-Schritte

Reihenfolge nach Produktwert, Dep-Kette
`TOR → TOKENS → LESER → KATALOGE → VORLAGEN → RECHNER → REST`; parallel `GRUNDTON → START` (§5d, David 23.9.: «beginne dann gleich»).

| Schritt | `feld:` | Abnahmeliste (Inventar) | Richtung (Boards) | Grenzen |
|---|---|---|---|---|
| **`W2·29-WERKBANK-LESER`** — Gesetzes-Leser, grösster Korpus | `leser` | Abschnitt 2 (ganz) | Gesetz (ein Artikel) · Fliesstext, Erlass-Blatt offen/zu | **Normtext-Körper bleibt golden byte-gleich**; Fassungen, Revisionen, Verknüpfungen ziehen mit, werden nicht umgebaut |
| **`W2·29-WERKBANK-KATALOGE`** — die vier Kataloge | `design` | 2.2 · 3.2 · 4.2 · 5.2 · 1.2 Startseite (seit 23.9.) | vier Katalog-Boards + Suche · Abdeckung · Einstellungen · Main | Status-Modell sichtbar (§8); Kantons-Auswahl mit Schweizkarte hat kein Board — Session entscheidet |
| **`W2·29-WERKBANK-VORLAGEN`** — ein Assistenten-Rahmen, dann die 30 | `werkzeuge` | 5.3 · 5.4 · 5.5 | Vorlage Arbeitsvertrag (Schritt 4 von 7) | Rahmen **aus den bestehenden** Vorlagen-Modulen in `src/lib/vorlagen/` samt `registry.ts` (korr. 23.9.2026: `*Schemas.ts` trifft nur die Gründungen), kein zweites Schema-Modell; PDF und DOCX aus demselben Assemble-Ergebnis (§5); die 42 geplanten fallen danach aus demselben Rahmen |
| **`W2·29-WERKBANK-RECHNER`** — die 20 einzeln | `werkzeuge` | 4.3 · 4.4 | Fristenrechner ZPO | Gemeinsamer Rahmen **nur** für Kopf, Ergebnisblock, Exportleiste. **Rechenfälle nie abstrahiert (§1)** — 20 Rechner bleiben 20 Handgriffe |
| **`W2·29-WERKBANK-REST`** — Rest und Rückbau | `design` | 1.5 (ohne `/abdeckung`) · 3.3–3.7 · 6 | Entscheid · Materialien | Entscheid-Leser, Materialien, statische Seiten, mobile Breite, Druckansicht; **hier fallen die letzten Alt-Stylesheet-Reste und die abgelösten Reglemente** (§7) |

**Nachtrag 23.9.2026 (Entscheid David, Chat, Option A):** Startseite aus REST in KATALOGE geholt
(vier Kacheln mit denselben Karten-Bauteilen wie die Kataloge, als letzte Scheibe), KATALOGE parallel
zu LESER — dep `[W2·29-WERKBANK-LESER]` aufgehoben; die Sessions stimmen Sperrflächen (geteilte
Such-Bauteile bis LESER-S4) und Merge-Queue (LESER hat Vorrang) direkt ab. Die übrige Kette bleibt
seriell.

**Definition of Done jedes Rubrik-Schritts** (zusätzlich zu Skill `auftrag` Ziff. 4): **«Rückbau-
Liste dieses Schritts abgearbeitet (Dateien gelöscht, Posten/Schritte in die Chronik, Fahrpläne
ins Archiv), `check:sediment` grün.»** Ohne Rückbau ist der Schritt nicht `done`.

## §5a · LESER — Bauplan in Scheiben (Planung 23.9.2026)

**Kernbefunde** (Planung lex-recherche Opus, 23.9.2026): (1) Kein Leser-PR landet automatisch,
solange die zwei Flackerer vom 22.9. nicht behoben sind — sie stehen nicht in
`e2e/flake-ausnahmen.json`, der Wächter ist hart → **S0 zuerst**. (2) Für «Normtext-Körper golden
byte-gleich» gab es kein Instrument (`golden/lexmetrik-golden.json` nur 256 Rechner-/Vorlagen-Fälle,
Normtext-Snapshot nur Daten) → S0 baut die Kern-Probe. (3) `norm-sprung.e2e.ts` ist kein Leser-Test
(`/gesetze`, globale Kopf-Suche) — S0 nimmt ihn trotzdem mit.

### 1 Ist-Karte (gl/ = `src/pages/gesetz-leser/`; CSS-Zeilen im Tokens-Zweig)

| Bauteil | Hauptdateien | Zeilen | CSS |
|---|---|---|---|
| Kopf+Titelblatt+Übersicht | v3/LeserKopf, LeserAnsichtV3, LeserModusWahl/RubrikenWahl/AenderungsWahl, kopfStufen.ts, parts/ErlassLeserKopf(489), ErlassKopfBlock, v3/LeserErlassKopfZone, LeserUebersicht, UebersichtBox, uebersichtAngaben.ts(417/420), WeiterlesenChip | 3380 | lc-v3-*, Ä1 1584ff, Fokusring 2335–2387, D5 2930ff, Chip-Metazeile 2636ff |
| Seitenspalte/Gliederung | parts/SektionBaumTOC(602), v3/LeserGliederung, LeserSeitenleiste, LeserGliederungSchiene, parts/GliederungSheet, v3/LeserLeisteSheet, parts/ArtikelIndex, leisteAufbau | 1364 (+2103 Modell bleibt) | lc-leiste-*, 2388ff, 3828ff, 3842ff |
| Lesespalten-Hülle | v3/LeserRahmenV3(418), LeserLeseZeile, LeserLesespalte, rahmenSpalten, leserGeometrie, satzspiegel, parts/SektionKopf | 1964 | lc-leser, Schriftskala 1609ff, Zeilenmass 1704ff, nt-art-cv/nt-anker 1880–1921 |
| Artikel-Rahmen+Funktionszeile | parts/ArtikelLeser(777), .kopfteile, .bezuegeFuss, .leitfaelle, Funktionszeile, BezuegeZeile, ArtikelAktionen, ArtikelHistorie | 2603 | lr7-bez*/lr7-kopf* 4044–4396, 4080ff, D30 4240ff, lr-/lr6- 3998–4111 |
| Such-Zone | v3/SuchZone, SuchSprungFeld, SuchBereichWahl, TrefferLeiste, LeserTrefferListe, LeserTrefferSpalte, LandkarteZone; `src/components/leser/*` (GETEILT mit EntscheidLeser) | 2151 (+1557 Suchlogik bleibt) | 3520–3700, ::highlight 3894 |
| Erlass-Blatt/Beiwerk | v3/LeserPanel, LeserPanelZone, LeserPanelOeffner, Panel{Entscheide,Materialien,Aenderungen,Anwendung,Sachgebiet,FilterZeile}, ReiterAktion, panelModell | 2259 | Popover 3471ff, Reiter/Boden 3092–3295 (teils geteilt) |
| Einzel-Artikel | v3/LeserEinzelAnsicht, einzelModus, useEinzelModus, parts/ArtikelDossier, ArtikelNachbarn | 1032 | lr7-einzel-*, lr7-dossier-* |
| Normtext-Kern (**bleibt byte-gleich**) | `src/components/normtext/ArtikelBody*`, ArtikelTabellen, BildElemente, tarifText, wortverbinder | 1326 | [data-lese], Tabellen-Regeln |

Nicht LESER: normtext/{ErlassKarte, GesetzeGliederung, RechtsgebietSicht, InternationalRubriken,
Erfassungsgrad, MassgebendeGesetze} → KATALOGE. Geteilt: lr8-* und einzelne lr7-* an
`src/components/entstehung/*` → bis REST. CSS: 189 Klassen mit Leser-Präfix, nur 50 exklusiv;
~253 Regelzeilen in 100 Blöcken; index.css 3678/5206 Zeilen Kommentar.

### 2 Soll (Board) → Bauteil

- **Kopfzeile** «‹ Gesetze · OR Erlass ▾ · Gliederung ausblenden · ◧ · Ansicht ▾»: Werkbank-Typo,
  2-px-Tintenlinie, Textknöpfe; bleiben: alle Griffe/Menüs (2.3.12), Stand-Zeile, `data-v3-*`.
- **Titelblatt:** ein Block statt drei Bausteinen; alle Angaben 2.3.5 wörtlich (§8).
- **Gliederung links 250 px:** aktiver Eintrag `--reg-g-flaeche` (Board #EEF1F6 ist kein Token;
  Token gilt); Aufbau/Klapp/Spy/Sheet <1024 bleiben.
- **Artikel:** Randtitel/«Art. N» Werkbank-Satz, Funktionszeile als Linienzeile; Kern byte-gleich;
  2.3.9 vollständig.
- **Blatt offen 380 px:** Reiter als Registerfläche reg-r/m/w/g-flaeche; Inhalte/Filter/Zähler
  2.3.6–2.3.8, 2.4 bleiben.
- **Blatt zu (52-px-Schiene), Suche oben:** Feld/Panel Werkbank-Stil; Feld IMMER im Kopf (2.3.11),
  D38-Liste, Deterministik.
- **Unter-Gesetze (ein Artikel):** Karten/Pfad Werkbank-Stil; ←/→, Nachbarn, Dossier bleiben.

NICHT bauen (Board > Produkt): «Entscheide zu den Artikeln auf dieser Seite» mit Zählern,
«Mappen»-Reiter, gelbe aktive Fundstelle #F3E3A6.

### 3 Scheiben (Session 1: S0+S1 · 2: S2+S3 · 3: S4+S5; jede allein landbar)

- **S0 Prüfstrasse vorab** (`feld: betrieb`, unsichtbar): Flacker-Fixes (Ziff. 4); Kern-Probe als
  ERWEITERUNG `src/tests/ArtikelBody.test.tsx` (kein neues Tor): `renderToStaticMarkup` über feste
  Stichprobe (OR 257d, je ein Fall T-A…T-F, Formelbild, «aufgehoben», «leer, ungeklärt»,
  Kantonsartikel), zwei Hashes (mit/ohne class-Attribute). Stichprobe eingefroren als Fixture
  (Gegenprüfung #984, 23.9.2026): `src/tests/fixtures/kern-probe-artikel.json`, damit ein
  Fedlex-Frische-Lauf (OR 1.10.2026, AHVG/AHVV/DBG angekündigt) die Hashes nicht kippt. Zaunliste
  im PR-Body:
  `git diff --stat origin/main -- src/components/normtext/{ArtikelBody*,ArtikelTabellen.tsx,BildElemente.tsx,tarifText.ts,wortverbinder.ts} src/lib/normtext/`
  leer. Sonden `leser-suche-a35-a40-a41`, `norm-sprung`, `helpers/leserBereit.ts` (geprüft,
  verworfen). Rot-Beweis: Kern-Probe rot (vertauschte p-Klasse); Flackerer rot→grün je n=20 unter
  Last. dep keine.
- **S1 Artikel-Rahmen, Lesespalte, Funktionszeile:** Klassen-/Token-Tausch in
  parts/ArtikelLeser.kopfteile, Funktionszeile, BezuegeZeile, ArtikelAktionen, .bezuegeFuss,
  ArtikelHistorie, SektionKopf, v3/LeserLesespalte, LeserLeseZeile; ArtikelLeser.tsx nur Klassen
  (Struktur-Hash gleich). Löschen lr7-bez*/lr7-kopf*, lr-/lr6-Reste samt Kommentarblöcken
  4044–4396, 4080–4270. Sonden: leser-d35-f1-funktionszeile, w226-funktionszeile,
  leser-bezuege-fuss-d34, leser-funktionszeile-zaehler (CLS), leser-marken-geometrie,
  w224-d40-fassung, gesetze-historie-badge, leser-lesemass, druck-fundstellen-z2,
  a31a-fussnote-inline. Risiko 2.3.9 (Akkordeon, Esc, Hover, Druck), Lesemass. dep S0.
- **S2 Kopf, Titelblatt, Übersicht:** ErlassLeserKopf+LeserErlassKopfZone+ErlassKopfBlock → EIN
  Titelblatt (ErlassLeserKopf bleibt für FruehAnsicht pdf-embed/nur-live-link); Kopf restylen;
  uebersichtAngaben.ts zuerst schneiden (3 Zeilen Luft zum 420-Deckel leser-v3-fundament.test.ts).
  Sonden 45 Kopf-Specs (leser-v3-kopfzeile, leser-v3-kopf, leser-kopf-v2, leser-kopf-cls-s3,
  leser-v3-kontext-cls, w224-d35-f2-kopf, leser-v3-uebersicht, leser-v3-schriftskala,
  leser-optionen, w224-d35-f4-menue). Ziel netto −150 src. Risiko CLS, `--nt-stick`/
  useStickAusgleich. dep S1.
- **S3 Seitenspalte/Gliederung:** Stil SektionBaumTOC, v3/LeserGliederung, LeserSeitenleiste,
  LeserGliederungSchiene, GliederungSheet, LeserLeisteSheet, ArtikelIndex; aktiv
  `--reg-g-flaeche`; wenn möglich Schiene+LeisteSheet in leisteAufbau aufgehen; Modell-Dateien
  unberührt. Sonden 32 (leser-gliederung-a33, leser-spy-w25d, leser-marke-mitlaufen,
  leser-klapp-sonde, leser-toc-sprung, gesetze-ux-9punkte); Vitest gliederung-sichtbarkeit/
  -zustandsfolgen UNVERÄNDERT. Risiko Scroll-Spy/rAF — nur headless
  (`.claude/rules/webseiten-pruefung.md`). dep S2.
- **S4 Such-Zone, Trefferliste, Landkarte:** Stil v3/SuchZone, SuchSprungFeld, SuchBereichWahl,
  TrefferLeiste, LeserTrefferListe, LeserTrefferSpalte, LandkarteZone; `src/components/leser/*`
  nur Token-Tausch (geteilt); leserSuche.ts, suchHighlight.ts, inhalt-suchtreffer.tsx unberührt;
  CSS 3520–3700 löschen. Sonden 24 (leser-v3-suchfeld-ueberall, leser-d38-treffer-lesespalte,
  leser-suche-vertrag-b8, leser-w228-landkarte, leser-v3-fokusring-suchfeld,
  leser-v3-highlight-split, entscheid*). Ausnahme leser-v3-suche-ohne-gliederung (19/20) an der
  gemessenen Wurzel fixen und streichen (kein S0-Helfer: ausgebaut 23.9.2026). dep S3.
- **S5 Erlass-Blatt, Einzel-Artikel, Rückbau:** Blatt-Reiter Registerfläche; Panel*.tsx,
  ReiterAktion; LeserEinzelAnsicht, ArtikelNachbarn, ArtikelDossier; CSS lr7-einzel-*,
  lr7-dossier-* löschen; Rückbau Ziff. 5. Sonden 23 Blatt (leser-v3-blatt Ausnahme 7/20 abbauen,
  leser-v3-panel-*, leser-v3-scrim-b7n1, hist-ansicht-w25i, entstehung-synopse-leser) + 3 Einzel
  (leser-einzelmodus, leser-nachbar-rohdaten, a11y). 2.4 zieht nur mit. dep S4.

**Querschnitt:** `data-*`-Hooks unverändert (e2e greift fast nur darüber: data-v3-kopf 104 Treffer;
.lc-leser 61, lr7-* 101). 78 Vitest-Dateien lesen Leser-/Normtext-/CSS-Quellen → vor Push greppen,
deklariert mitziehen. 116/168 e2e-Specs mit gesetze/. Keine Screenshot-Tests → Sichtprüfung
1280/390 hell/dunkel in den PR-Body.

### 4 Flacker-Fixes (S0) — Beleg Lauf 35779952911, Job 106923708900, Shard 3/8, Artefakt 10717927859

- **leser-suche-a35-a40-a41:** Z. 89 `[data-treffer-leiste]` 15 s nicht gefunden, Region «sucht …».
  Hypothese: Wartestelle Z. 72 (`#art-1`) schon durch Prerender-HTML erfüllt
  (`scripts/prerender.ts:210ff`); Z. 75 füllt Feld während die Nachlade-Kette den Main-Thread hält;
  Commit nach 200-ms-Entprellung (gl/inhalt-zustand.tsx:106) kippt sucheAktiv
  (gl/v3/leserV3Modell.ts:369 → LeserTrefferSpalte.tsx:121/143) → ganze Lesespalte rendert neu
  (1686 Artikel), Beobachter neu (gl/inhalt-suchtreffer.tsx:250); auf 2 vCPU >15 s. Fix
  testseitig: echter Bereitschaftsmarker `data-leser-bereit` (nach Einträgen, Struktur, erster
  Leerlauf-Welle), zentral `helpers/leserBereit.ts`. Produktseitig nur wenn CPU×4-Messung
  Eingabe→sucheAktiv >1 s: §15-Posten, useDeferredValue.
- **norm-sprung** (Katalog `/gesetze`, globale Suche): Z. 117 sprungZeile 10 s nicht gefunden,
  Gruppen «wird durchsucht …». Entscheid-Sprung braucht nachgeladenes Entscheid-Manifest
  (`src/components/suche/useUniversalSuche.ts:131-132`, `src/lib/universalSuche.ts:114`) — Produkt
  korrekt (§8). Schwester Z. 96 gleiche Abhängigkeit, verdeckt durch Z. 103–104. Fix: vor Z. 117
  `warteAufSuchindex` (`e2e/helpers/warteAufSuchindex.ts`).

Beide Hypothesen waren bei der Planung nicht reproduziert — Messung unter Last ist S0-Aufgabe.
**Befund S0 (Bau 23.9.2026, Ergänzung; Messreihen in den Commit-Bodies S0-A1/A2):**
norm-sprung **bestätigt** (10× CPU-Drossel, 8 Worker, n=20 je BGE-Fall: vorher 14/60 rot,
nachher 0/60; Fix auch an Z. 96 und Z. 122). A35: Teil-Hypothese «`#art-1` im Prerender»
**verworfen** (`grep -c 'id="art-' dist/gesetze/bund/OR.html` = 0); Warten auf
`data-leser-bereit` ändert die Arbeit nach der Eingabe nicht (Longtask-Profil gleich); lokal 0 rot
in 340 Läufen — Wurzel **unbestätigt**. Der Wartepunkt wurde darum **wieder ausgebaut**
(Entscheid Haupt-Session 23.9.2026, §17 Gegengewicht: ohne belegte Wirkung, +16 s Median je
Lauf). CI-Bild: 1 von 20 Shard-3-Jobs, im selben Job flackerten binnen 2 min auch norm-sprung
und rechtsprechung → Verdacht Runner-Einbruch; A35 bleibt Beobachtungsfall. §15-Posten:
Eingabe→Trefferleiste bei CPU×4 med 1.34 s.

### 5 Rückbau (§7)

- FAHRPLAN-LESER-V3.md + `W2·5m-LESER-V3` → S5 Chronik/Archiv; dessen §16 «leserV3Modell/
  uebersichtAngaben schneiden» → S2; §16 CLS-Flake leser-funktionszeile-zaehler:80 + ArtikelLeser
  Z. 621 Kommentar → S1; §16 Bezugslinien-Orakel doppelt, Stop-and-go-Wächter → S3; §16
  «Akkordeon nur bei Scroll-Ruhe», «8 Artikel ohne Zeile», Struktur-Extraktor (Risikopfad),
  NormText.tsx 795/800 → UMBUCHEN, nicht im Umbau; E3 Druck → REST; Fassungs-Diff → eigener Schritt.
- FAHRPLAN-SPLIT-VIEW.md → S5 Archiv; vorher `plan/posten/2026-06-29-multi-pane-split-view.md`
  (B3 offen) umhängen, Beispiel in `scripts/fahrplan-slice.ts` nachziehen.
- FAHRPLAN-GESETZES-UX.md → BLEIBT Referenz (erfassungsgrad.ts:20 «Änderung NUR per Spec-Änderung
  an §11.2», DESIGN-REGLEMENT-NORMTEXT.md:10); nur Hülle-Abschnitte ins Archiv (S5).
- UI-BEFUNDE Leser offen LM-163, LM-114 (S5), LM-183, LM-197 (S2).

### 6 Entscheide (Bau darf, mit Empfehlung)

1 Hooks/Klassennamen nicht umbenennen (N8 bleibt) — ja. 2 Suchfeld bleibt im Kopf (2.3.11 vor
Board). 3 Aktive Fundstelle nur mit bestehenden Tokens. 4 Kern-Probe erweitert
ArtikelBody.test.tsx, kein neues Tor. 5 Je PR «netto ≤ 0» in src anstreben. 6 Bereitschaftsmarker
als Produkt-Attribut — nur mit gemessener Wirkung (S0: ohne Wirkung, ausgebaut 23.9.2026). **Wartet auf David:** nichts. (Funktionszeile im Einzelmodus nicht
durch Board-Karten ersetzen = Funktionsänderung 2.3.9 — nicht tun.)

### 7 Nebenfunde

1 design.md Ziff. 4 sagt noch «nie Fläche» → T2 muss vor S3/S5 landen. 2 Weitere bis 20.10.
geduldete Leser-Specs: leser-v3-suche-ohne-gliederung 19/20, leser-v3-blatt 7/20,
leser-ruecksprung-r5-r7, verweis-u — gleiche Wettlauf-Familie; S0/S4/S5. 3 420-Deckel v3/:
leserV3Modell.ts 419, uebersichtAngaben.ts 417. 4 index.css ~71 % Kommentare → QS-DOKU-DIAET.
5 Board #EEF1F6 ≠ `--reg-g-flaeche` #D9DEE4 — Token gilt.

## §5b · KATALOGE — Bauplan in Scheiben (Planung 23.9.2026)

**Kernbefunde** (lex-recherche Opus, 23.9.2026): (1) EINE Kachel = `ui/RubrikKachel` + Prop `reg`
(Registerstrich, `--reg-*-flaeche`); `start/BereichsReihe` (fünf Kacheln) fällt. Katalog-Kopf =
`layout/SeitenKopf` + `.ub-*` (färbt Materialien/statische Seiten mit — gewollt). Zeilen bleiben je
Rubrik (ErlassKarte · EntscheidZeile · TrefferZeile), nur Stil (§1). (2) In gesperrte Leser-Flächen
reichen `.fc-*`/`ui/FacettenGruppe`, `ui/GruppenKopf`, `ui/SchriftgroessenRegler` — unberührt bzw. K6.
(3) Nicht bauen (Board > Produkt): Schnellwerkzeug, feste H1, Linklisten in Kacheln, «44».

**Scheiben** (‖ = parallel nach K1; Sichtprüfung 1280/390 hell/dunkel im PR-Body):
- **K0 Prüfstrasse** ‖ K1: §8-Ratsche in `katalog.test.tsx` (39/42 «In Vorbereitung»); Flacker-Wurzeln
  `rechtsprechung`, `uinav-j-rechtsprechung` (201/200 Links), `rechtsprechung-richter`.
- **K1 Rahmen:** SeitenKopf, `.ub-*`, RubrikKachel(`reg`), TrefferZeile.
- **K2 Gesetze** ‖: Gesetze.tsx (60 Z. unter Deckel, netto ≤ 0), gesetze-teile/*, normtext-Katalogteile,
  ListenTabelle, `.tb-*`; Kantons-Auswahl/Schweizkarte: Aufbau bleibt, nur Stil (Entscheid Session).
- **K3 Rechtsprechung** ‖: Seite + rechtsprechung/* ohne FacettenGruppe; LM-117 nicht (§1-nah).
- **K4 Rechner-/Vorlagen-Katalog** ‖: Katalog, Übersichten, Legende/Hinweis/Einstieg;
  `start/Zeiterfassung` zum einzigen Verwender.
- **K5 Abdeckung + Einstellungen** ‖: Abdeckung zählt aus `STARTSEITE_ZAEHLER` (heute drei Manifeste,
  eigene Regel — zweite Quelle §5; Zahlwechsel deklarieren); Einstellungen nur Seitenebene.
- **K6 Suche + Facetten:** dep **LESER-S4 gelandet**.
- **K7 Startseite (zuletzt):** vier RubrikKachel (Werkzeuge → `/rechner`, Unterzeile «N Rechner · M
  Vorlagen» aus dem Zähler); Begrüssung, Zuletzt, Module, Anpassen-Blatt bleiben (1.2.1–1.2.3).
  Deklariert: `startseite-pult-r10.e2e.ts:80` (fünf → vier), `katalog.test.tsx:252` (Titel).

**Abbruch-Zählung (§2 Ziff. 4)** läuft je Rubrik getrennt (LESER und KATALOGE parallel).

**Stand 23.9.2026 — Schritt gebaut in einer Session:** K0 #994 · K1 #993 · K2 #995 · K3 #998 · K4 #997 ·
K5 #999 (eine Zählquelle: /abdeckung 5'093 statt 6'345, /gesetze-Kopf 203 statt 231, /vorlagen-Fuss 26) ·
K6 #1000 · K7 #1004 (Startseite vier Kacheln) · K8 #1005 (Amtlicher Zitierer auf /rechner, Entscheid
David 23.9.2026) · K9 #1008 (Gruss-Flackern: Render-Sperre `rel=expect` bis nach dem Wahl-Skript). Nebenfunde als Posten unter VORLAGEN/RECHNER/REST/`W2·18`/`QS-EFFIZIENZ`.

## §5c · VORLAGEN — Bauplan in Scheiben (Planung 23.9.2026)

**Kernbefunde** (lex-recherche Opus, 23.9.2026): (1) Der Rahmen existiert: `vorlagen/wizard.tsx`
(Rahmen, Vorschau, ExportLeiste) + `VorlagenSeite` — nur 11 der 30 nutzen die Orchestrierung, 18
rufen den Rahmen direkt (6'952 Z., 38 Inline-DOCX-Gates statt `docxAktiv`) → die Löschbilanz kommt
aus der Migration, nicht aus CSS. (2) Kein Eingriff in `src/lib/vorlagen`; PDF/DOCX laufen schon aus
demselben `ergebnis`. (3) `vorlagen/ui.tsx`, `NormChip`, `ui/SelectionGrid` sind mit RECHNER/LESER
geteilt → Änderung nur per Prop.

**Scheiben** (kein Risikopfad; Sichtprüfung 1280/390 hell/dunkel im PR-Body):
- **V0 Prüfstrasse:** SSR-Ratsche über die 30 Routen (Schrittnamen 5.4, Badge, DOCX-Knopf ⇔
  `docxAktiv`) als Fixture; Rot-Beweis.
- **V1 Rahmen-Optik:** wizard.tsx, Stepper (Reiterzeile, `--reg-w`), VariantenKopf (SelectionGrid-
  Prop `reg`), PruefBefund, Papier-Vorschau; Kopf als `layout/WerkzeugKopf` (RECHNER übernimmt).
- **V2a–d Migration** auf `VorlagenSeite` (Kündigungen · Familie/Klagen · Verträge ·
  Vorsorge/Vollmacht; Schlichtungsgesuch zuletzt), je PR Löschbilanz ≥ 50 %, Slots statt Fachlogik
  im Rahmen; Gegenprüfung Verhaltensgleichheit. Dep V1, untereinander ‖.
- **V3 Mappen** ‖ V2: Dokumentmappe, GmbH-/AG-Gründung, Kapitalerhöhung (Reiter `--reg-w-flaeche`).
- **V4 Checkliste + Rückbau:** KuendigungVermieter; Inventar 5.3 datiert nachführen; Posten schliessen.
  *Stand 23.9.2026 (V4 gebaut):* Vermieter-Checkliste im `WerkzeugKopf`; Inventar 5.3/5.5
  datiert korrigiert; Slot-Inventar im Kopf von `VorlagenSeite.tsx` (kein Slot tot,
  Einzel-Nutzer bleiben bis zu einer deklarierten Angleichung); Verhaltens-Nebenfunde aus
  V2b/V2e als Posten, nicht im Rückbau. **Auswahl-Karten, zwei Looks — bewusst vertagt:**
  der Kopf-Segmentschalter (`VariantenKopf`, `SelectionGrid reg="w"`) trägt den Board-Strich
  OBEN, die Auswahl-Kacheln in den Formular-Schritten die Haus-Zeile (Haarlinie oben +
  Innenstrich LINKS) — dieselbe Klasse `.lc-wahl-kachel` mit ~60 Aufrufern, auch in den
  Rechnern. Eine Vereinheitlichung ist eine globale CSS-Entscheidung beider Register und
  gehört in W2·29-WERKBANK-RECHNER (Posten dort), nicht halb in VORLAGEN.
- **V5 Musterdaten für alle Vorlagen** (David 23.9.2026: «ich möchte dass alle vorlagen
  musterdaten möglich haben.»): Knopf «Mit Musterdaten füllen» im gemeinsamen Rahmen
  (`VorlagenSeite`-Slot `musterdaten`), Daten aus EINER Quelle (die Golden-Eingaben,
  Vorbild AG `musterdatenFuellen`), Nachfrage vor dem Überschreiben, kein Wasserzeichen.
  Mappen: `#mappe-beispiel` angleichen. V0-Fixture = deklarierte Änderung (neuer Knopf).
  Liegt der SSoT-Ort in `src/lib/vorlagen` oder berührt er `startseiteVorlagen*`:
  Risikopfad → Gegenprüfung vor dem Einreihen.
  *Stand 23.9.2026 (V5 gebaut):* SSoT = `src/components/vorlagen/musterdaten.ts` (nur
  `import type`, §15) + `musterdaten-mappen.ts` (Mappen, Engine-Import) — kein Risikopfad.
  Die Golden-Eingaben taugen nicht als Demo («A»/«B», inline); der Wächter
  `vorlagen-musterdaten.test.ts` beweist stattdessen je Vorlage den Durchlauf ohne Blocker
  (mit Gegenprobe). V0-Fixture unverändert (der Knopf ist kein eingefrorenes Merkmal). AG:
  eigener Demo-Knopf entfällt, Rahmen-Knopf ersetzt den ganzen Stand (vorher Teil-Update).

**Nicht bauen:** «44», Status-Zeile «Ausgabe als PDF und Word» (Testament: kein DOCX),
Seitenleisten-Baum, Board-Hex (Token gilt), gemeinsame Exportleiste (erst RECHNER).

## §5e · RECHNER — Bauplan in Scheiben (Planung 24.9.2026)

**Befund** (lex-recherche Opus, 24.9.): Ergebnisblock, -Anzeige, Eckdaten, Platzhalter, Stepper
sind schon je EINMAL geteilt (auch ZustaendigkeitForm nutzt den `Stepper` aus `vorlagen/ui.tsx`);
neu sind nur Kopf und eine gemeinsame Exportzeile (heute 25× inline). Kein Risikopfad.
- **R0** Ratsche `rechner-flaechen-ratsche.test.tsx` (20 Routen, Erst-Render). **R1** `RechnerKopf`
  = Aufsatz auf `WerkzeugKopf`; Overline ohne «· Rechner» (Krume nennt es, `w224-ga-kopf`);
  `etikett` frei für RL-12. Deklarierte Optik (Gegenprüfung 24.9.): H1 + Kurzbeschrieb serif wie die
  Vorlagen (§e «getragene Titel»), `&` ohne `sansAmp` (nur für die Display-Stimme), Abstand Kopf→Karte
  24 statt 32 px (Seiten-`space-y-6`, wie Vorlagen). *Gebaut 24.9.*
- **R2** `.lc-akzent-w` (Strich + Fläche `--reg-w`), Karte/ErgebnisAnzeige als Abschnitt mit Strich statt Kasten
  (bündig, ohne Seitenpolster; der zweite Strich in der Karte trennt Eingaben/Ergebnis wie im Board), ink-500/`.lc-overline`
  auf der Fläche → ink-600 (dunkel 4.18:1, axe-Punkt `rechner-mietrecht`); Posten Kontrast (Pflichtpaar) und A3 zu. *Gebaut 24.9.*
- **R3** `ErgebnisExport` (Aktenzeichen → PDF → ICS → Teilen → children): 21 Stellen in 20 Formularen; Ratsche
  `rechner-export-ratsche` (20 Routen + 16 Beispiel-Queries). Offen: 4 Kosten-Rechner (Posten §R-5), EreignisFristen/Schnellrechner bewusst eigen. *Gebaut 24.9.*
- **R4** Auswahl-Kacheln ein Look · `vorlagen/ui.tsx` an neutralen Ort · `Card`. **R5** Sonderseiten
  (Tagerechner, Board, Inkasso, Zuständigkeit), Inventar 4.3/4.4 nachführen.
- **Nicht bauen:** rechte Normen-/Annahmen-Spalte des Boards, Streichung von PDF/Teilen/Aktenzeichen
  (Board ist Richtung; Inventar 4.3 R3–R5 gilt).

## §5d · GRUNDTON + START — aufklappende Startseite (Entscheide David 23.9.2026)

Prototyp (klickbar): https://claude.ai/artifact/JnPeKNP1cu2TRhjErP8vck · volle Spec mit Davids
Wortlaut: `~/Documents/David/03_Projekte/LexMetrik/start-prototyp/SPEC-START-UND-GRUNDTON.md`.

**`W2·29-WERKBANK-GRUNDTON`** (David: «als grundregel für den gesamten umbau»): `paper` hell `#FDFCFA` wie Board
«Main» (dunkel gleich), `reg-*-flaeche` neu rechnen + `check:farbwelt`; Radien 14 Flächen · 10
Karten/Felder · 8 Knöpfe/Zeilen · Chips Pille, «modern, aber nicht trashy»; Linien, Listen,
Normtext gerade. «Kanten statt Kissen» im Reglement datiert ablösen.

**`W2·29-WERKBANK-START`:** 2×2-Kacheln (Flächenton, Zahl aus dem Zähler, **keine** Linkzeilen), darunter «Neueste
Entscheide», rechts «Zuletzt» + «Schnellwerkzeug». Klick → Kachel wächst **nur übers Kachelfeld**
bis zum Ziel: Gesetze → Bund (Rechtsgebiet → Erlassliste) | Kantone (Landeskarte → Erlassliste) ·
Rechtsprechung, Materialien → sofort Suche · Werkzeuge → Rechner | Vorlagen → Liste. Jede Stufe
eine Adresse, Browser-Zurück = eine Stufe. Animation «natürlich, nicht ruckeln»: `clip-path`-
Aufdeckung + Farbschicht mit Kachel-Gesicht, `cubic-bezier(.2,0,0,1)`, 450/350 ms, nur Compositor,
`prefers-reduced-motion`; Handy Vollbild-Blatt. Suchdaten erst beim Öffnen (§15).
*Geklärt 23.9.2026 (GRUNDTON-Session):* **Internationales Recht** = dritte Wahl «Bund · Kantone ·
International» (Auswahlfrage David «Dritte Wahl», → Liste der Staatsverträge) · **Zähler Vorlagen 26
bleibt**: 30 = `ALLE_KARTEN`, 26 = `KATALOG_KARTEN`; die vier Kündigungen sind `imKatalog: false`
(E3, Einstieg über die Miet-/Arbeits-Themen) — Kachel-Zahl = Einträge der Liste (§8).

**GRUNDTON gebaut (23.9.2026):** `paper` hell `#FDFCFA`, `surface` `#FEFDFB` (Leiter), `paper-sunken`/
`well` `#F6F4F0`, `reg-*-flaeche` hell neu gerechnet; Radius `sm 4 · md 8 · lg 10 · xl/2xl 14`
(`rounded` Marken · `rounded-md` Knöpfe/Zeilen · `rounded-lg` Karten/Schwebeflächen · `rounded-xl`
Flächen/Kacheln/Blätter). Gerade per Regel: `.lc-chip`, `.lc-notice` (Registerstriche), `.lc-input`
(Unterstrich-Anatomie), Linien-Karten `.lc-card/.lc-tile/.lc-panel`, und der Normtext-Körper per
CSS-Scope `[data-lese]`/`.lc-normtext-koerper` (Markup byte-bewacht, `ArtikelBody.test` Kern-Probe).

**START in Scheiben (Planung 23.9.2026, GRUNDTON-Session).** Entscheide David 23.9.2026 (Auswahlfragen):
**Begrüssung bleibt** (SuchBlock mit Begrüssung, Datum, Suchfeld — NICHT «Ihr Tag, Ihre Akten.») ·
**Modul-Baukasten fällt** (Ein-/Aus-/Umordnen samt gespeicherter Einstellung). Jede Scheibe allein landbar,
`check:sediment` je Scheibe grün (was nicht mehr gebraucht wird, geht im selben PR).
- **S1 Seite + Blatt + Gesetze.** Unter dem SuchBlock ab `lg` zweispaltig: links 2×2-Kachelfeld
  (`RubrikKachel` als Knopf, `rounded-xl`, Flächenton, Zahl aus dem Zähler, keine Links) und «Neueste
  Entscheide»; rechts «Zuletzt» (nach Rubrik) und «Schnellwerkzeug» (`EinfacheFristForm`, echte Engine).
  Blatt über dem Feld: `clip-path`-Aufdeckung von der Kachel-Kontur, Farbschicht mit Kachel-Gesicht,
  `cubic-bezier(.2,0,0,1)` 450/350 ms, nur Compositor, `prefers-reduced-motion` sofort; Handy (< 760 px)
  Vollbild-Blatt von unten. Adresse `/?blatt=<rubrik>/<stufe…>` (Router-Query; `tabSchluessel` ignoriert
  sie, der Reiter «/» bleibt einer), Browser-Zurück = eine Stufe, Deep-Link öffnet ohne Animation erst
  nach der Hydration (Prerender = zu), ✕/Escape schliesst ganz, Fokus zurück auf die Kachel. Gesetze:
  **Bund · Kantone · International** → Bund: Gebiete 01–05 (`SYSTEMATIK` + `ERLASS_REGISTER`, im Bündel)
  → Erlassliste mit Filterfeld → Leser; Kantone: Landeskarte + Tastatur-Liste der 26 → Erlassliste
  (`register.json` erst beim Betreten, §15) → Leser; International → Staatsverträge → Leser. R/M/W-Kacheln
  führen in S1 noch auf ihre Rubrikseite (Zwischenstand, sichtbar ehrlich). Löschen: `PultModul`,
  `PultAbschluss`, `startseiteModule`/`-ModulTypen`/`-Einstellung` samt Tests, `MaterialienListe`,
  `start/Werkzeuge`, nicht wiederverwendete Modul-Bausteine.
- **S2 Werkzeuge — GEBAUT (23.9.2026).** Rechner | Vorlagen → Liste nach Rechtsgebiet aus `KATALOG_KARTEN`
  (gebaute zuerst, «In Vorbereitung» sichtbar, §8) → Werkzeug-Seite. `werkzeuge/(rechner|vorlagen)` als
  Blatt-Stufen (`startBlatt.ts`), `start/WerkzeugeBlatt.tsx` als dritter `ui/RubrikKachel`-Konsument —
  Gruppierung/Liste WIEDERVERWENDET `Katalog.tsx` (`KategorieSektion`/`OBERKATEGORIEN`/`kartenDerKategorie`,
  dieselbe Quelle wie `/rechner` und `/vorlagen`), Filterfeld wie in `GesetzeBlatt`. Zweig `feat/w229-werkbank-start-s2`.
  **Nachzug 24.9.2026** (Gegenprüfung ROT): `KategorieSektion` bekommt die Prop `ohneGebietsFilter` (Standard
  aus, `/rechner`+`/vorlagen` unverändert) — im Blatt schaltet sie ihr eigenes Rechtsgebiet-Feld ab, das
  `setSearchParams` ohne den Blatt-Verlaufsstatus (`useBlattOrt.ts`) aufrief und `?rg=…` im Verlauf stehen
  liess (Browser-Zurück öffnete das Blatt erneut). e2e ergänzt: «In Vorbereitung» ohne Link, sowie
  Werkzeuge→Vorlagen→✕ mit sauberer Adresse und geschlossenem Verlauf.
- **S3 Rechtsprechung + Materialien.** Blatt öffnet mit Suchfeld (Fokus drin), Filter, Trefferliste;
  Daten erst beim Öffnen — `public/rechtsprechung/register.json` (9.4 MB) nie, kleineren Index messen und
  nutzen → Entscheid- bzw. Material-Seite.
  **Nachtrag 23.9.2026 (Bau-Session, Messwerte):** Materialien GEBAUT und gelandet-bereit — Suchfeld
  (Fokus drin), Filter Behörde/Art, Trefferliste (Portion 20 + «Weitere anzeigen»), wiederverwendet
  `lib/materialien/browse.ts` + `ui/TrefferZeile` (§10); Register lädt erst beim Öffnen
  (`public/materialien/register.json`, 1'516'755 B ≈ 1,45 MiB — GRÖSSENORDNUNG identisch mit
  `public/normtext/register.json`, 1'518'387 B, das die Gesetze-Kachel bereits beim Betreten einer
  Erlassliste lädt). Rechtsprechung ZURÜCKGESTELLT (§15 hart, kein stiller Bau): gemessen
  `public/rechtsprechung/register.json` = 9'458'225 B ≈ 9,02 MiB, gzip 775'098 B ≈ 757 KiB — das
  6,2-Fache der Materialien-/Normtext-Vergleichsgrösse. Gemessen (`ladeEntscheidManifest`,
  `lib/rechtsprechung/browse.ts`): die bestehende kuratierte Rechtsprechungs-Suche (Filter
  Leitentscheide/Bundesgericht/Kantonal — genau die vom Auftrag verlangten Facetten) lädt SELBST das
  volle Register, es existiert keine kleinere Quelle mit denselben Facetten. Die einzige lokale
  Alternative ohne Registerlast ist `components/rechtsprechung/LiveSuche.tsx` (externe Live-Suche
  entscheidsuche.ch, 0 Byte lokal) — trägt aber keine Leitentscheid-Facette. Entscheid David offen:
  (a) 9,4-MB-Last beim Blatt-Öffnen akzeptieren (Parität mit dem vollen Besuch von `/rechtsprechung`),
  (b) Rechtsprechungs-Blatt vorerst nur mit der externen Live-Suche (schlankere Facetten), oder
  (c) eigener Daten-Auftrag: schlanker Such-Index nur für dieses Blatt (Klasse daten, eigene
  Gegenprüfung). Bis dahin bleibt die Rechtsprechung-Kachel ein Link auf `/rechtsprechung` (S1-Stand).
  Nebenfund behoben: `start/EntscheideListe.tsx` lud dasselbe 9,4-MB-Register nach der Hydration für
  sechs Zeilen — die Auswahl läuft jetzt unverändert (`nachDatum`/`normLabel` aus
  `lib/rechtsprechung/browse.ts`, §10) zur Buildzeit im Zähler-Generator (`neuesteEntscheide`-
  Projektion in `startseiteZaehler.generated.ts`), die Liste rendert synchron ohne Fetch.
  **Nachtrag 24.9.2026 (Bau-Session S3-Nachzug):** Entscheid David zu den drei offenen Optionen —
  **(a) «Beim Öffnen laden»** — das 9,4-MB/775-KB-gzip-Register kostet beim Aufklappen der
  Rechtsprechung-Kachel genau so viel wie heute der Klick auf `/rechtsprechung`, nicht mehr: es lädt
  über denselben Lader (`ladeEntscheidManifest`) erst beim Mounten von `start/RechtsprechungBlatt.tsx`.
  Auf «/» selbst, beim Hover und bei der Hydration bleibt es unangetastet (e2e-Beleg: «Register wird
  genau beim Öffnen angefragt» in `e2e/startseite-blatt.e2e.ts`). Rechtsprechung ist damit die DRITTE
  Kachel in `startBlatt.ts::AUFKLAPPBAR`, Filter beschränkt auf die drei Facetten aus dem Auftrag
  (Leitentscheide · Bundesgericht · Kantonal), Suchlogik/Filter/Treffer-Zeile wiederverwendet aus
  `lib/rechtsprechung/browse.ts` + `ui/TrefferZeile` (§10), Ziel jeder Zeile die bestehende Detailseite
  `/rechtsprechung/:key`. **Offen, NICHT Teil dieser Scheibe:** ein schlankerer Such-Index nur für das
  Blatt (Option c des Nachtrags vom 23.9.) bleibt ein eigener, späterer Daten-Schritt (Klasse daten,
  eigene Gegenprüfung) — die 9,4-MB-Last bleibt bis dahin bestehen, sie ist nur nicht mehr grösser als
  der bestehende Weg über `/rechtsprechung`.
- **S4 Abschluss.** e2e (Aufklappen, Stufe zurück, Deep-Link, Escape, Tastatur), Sichtprüfung 1280/390
  hell/dunkel, Löschbilanz, `status=done`. **Erledigt 24.9.2026** im S3-PR: e2e voll, Sichtprüfung
  1280/390 hell/dunkel, Nebenfunde als Posten unter `W2·29-WERKBANK-REST`.
- **FEINSCHLIFF (`W2·29-WERKBANK-START-FEINSCHLIFF`, David 24.9.2026** «dass das schöner ist … überprüft,
  dass nicht abgeschnitten ist»): erst messen (alle Blätter und Stufen, 1280/1024/768/390/360, hell/dunkel),
  dann beheben; R8 (`e2e/kein-abschnitt.e2e.ts`) um die offenen Blätter erweitern. Vier Posten dorthin
  umgehängt (Escape in der Öffnung, Resize-Remount, Verweis-Einträge, geteilte Bausteine/aria-live).
  **Erledigt 24.9.2026:** Messung 234 R8-Funde in 11 Blatt-Zuständen → 0 (Rechtsgebiete überlappten, Kantone
  gekappt, ✕-Box); Bewegung: Gesicht = `RubrikKachel alsBild` (sprang), Laden erst nach der Öffnung
  (`blattRuhe.ts`, 83-ms-Bild weg), Kacheln kehren beim Schliessen gleichzeitig zurück; feste Portal-Bühne; unterer Rand blendet aus (David «verläufe in ordnung»).

## §6 · Prüfen und Frühsignale

1. **Rot-Beweis (§6.7)** beim Tor: Ausgabe rot *und* grün im PR. Ein Baseline-Eintrag macht es
   zur 92. weichen Wache — dann ist das Tor nicht gebaut.
2. **Löschbilanz** je Rubrik-PR (§2) im PR-Body nachweisen (`git diff --stat`).
3. **Basisraten-Check.** Referenzklasse sind die zwei mittendrin geparkten Redesign-Anläufe
   (`ROADMAP-CHRONIK.md`, Z. 1415 / 2230) und `a66421362`. **Abbrechen und beim Restyling
   bleiben**, sobald nach der ersten Rubrik eines eintritt: (a) eine zweite Hülle koexistiert
   länger als eine Session · (b) im Sediment-Tor wird die erste Ausnahme eingetragen · (c) die
   `@queue` zieht zwei Bau-Einheiten hintereinander vor.

**Was damit aufgegeben ist** (Verdikt, ehrlich): Es wird keinen Tag geben, an dem «das neue Design
fertig» ist — die Seite ist monatelang gemischt, Zwischenzustände sind live. Bei null Nutzern
verkraftbar, mit Nutzern nicht.

## §7 · Rückbau-Liste — was der Umbau unnütz macht

Weisung David 22.9.2026: «achte darauf, dass im fahrplan dinge gelöscht werden die dadurch unnütz
werden». **Grundsatz:** Was die alte Hülle **beschreibt oder bewacht**, fällt mit der Hülle; was
Rechtslogik, Korpus oder Prüfstrasse betrifft, bleibt. Datierte Belege altern nicht und werden
**nie** zurückgebaut.

| Gegenstand | wird unnütz durch | Aktion | wann |
|---|---|---|---|
| Schritt `W2·11-DESIGN` (Design-Wärme) | ganzer Umbau — die Brass-Wärme ist Gegenstand des Token-Tauschs | wörtlich in `ROADMAP-CHRONIK.md`, Schritt gestrichen | **jetzt** |
| `fahrplaene/FAHRPLAN-DESIGN-WAERME.md` | dito | `git mv` nach `archiv/`, Index-Zeile in `archiv/README.md` | **jetzt** |
| `public/icons.svg` (5 KB Sprite) | schon heute ohne Gegenstand — **0 Verweise repo-weit** (Sonde 22.9.2026) | löschen | **erledigt 22.9.2026, PR #979** |
| Doppelte Rechner-Metadaten `src/lib/calculators.ts` ↔ `startseiteConfig.ts` | TOR (c) | eine Quelle, die andere löschen | **erledigt 22.9.2026, PR #979** |
| Die fünf `DESIGN-REGLEMENT*.md` (159 KB) | TOKENS — `tokens.json` ist die Quelle | auf **ein** Reglement konsolidieren; die Normtext-Darstellungsregeln (Tabellen T-A…T-F, `p`-Klassen) bleiben — Rechtsdarstellung, nicht Hülle | **erledigt 23.9.2026, PR #981 (Token-Quelle) + T2 `docs/w229-tokens-reglement`** |
| `.claude/rules/design.md` | TOKENS | auf das eine Reglement nachziehen (zählt zur Steuerfläche — Rückbau, nicht Zuwachs) | **erledigt 23.9.2026, T2** (Zeilenzahl gleich, Z. 10–12 offen — s. T2-PR) |
| Alt-Blöcke in `src/index.css` (4 799 Z.) · ungenutzte Teile `tailwind.config.js` (429 Z.) | jede Rubrik löst ihren Teil ab | rubrikweise löschen, Rest bei REST; `check:sediment` (a) ist der Nachweis | je Rubrik |
| `FAHRPLAN-LESER-V3.md` + `W2·5m-LESER-V3` («Hülle neu, Kern unangetastet») | LESER — dasselbe Ziel, anderer Weg | Posten unter LESER, Schritt in die Chronik, Fahrplan ins Archiv | **erledigt 23.9.2026, S5** — `archiv/FAHRPLAN-LESER-V3.md`, Chronik «Ablösung 23.9.2026» (Verbleib je §16-Zeile) |
| `FAHRPLAN-SPLIT-VIEW.md` · `FAHRPLAN-GESETZES-UX.md` (beide ohne lebenden Schritt) | LESER | prüfen, was noch Referenz ist (`DESIGN-REGLEMENT.md` §N zeigt auf GESETZES-UX), Rest ins Archiv | **S5 23.9.2026:** SPLIT-VIEW → `archiv/` (Posten B3 zeigt dorthin); GESETZES-UX **bleibt** Referenz — keine eindeutige Hülle-Sektion abtrennbar, Hülle-Anteile längst in `archiv/fahrplaene/` |
| `FAHRPLAN-UI-BEFUNDE.md` (210 Befunde an der alten Hülle) + `W2·17-UI-BEFUNDE` | jede Rubrik löst ihre Befunde ab | je Rubrik abhaken oder als gegenstandslos in die Chronik; Rest ins Archiv | je Rubrik, Schluss REST |
| `FAHRPLAN-UI-QUALITAET.md` + `QS-UI` · `FAHRPLAN-DESIGN-KONSISTENZ.md` + `W2·19-DESIGN-KONSISTENZ` | der Umbau stellt gleiche Dinge gleich dar — das **ist** die Konsistenz-Arbeit | absorbieren, Schritte in die Chronik, Fahrpläne ins Archiv | REST |
| `FAHRPLAN-DESIGN-IDENTITAET.md` §8-Reste + `W2·24-C` | REST (Planung 23.9.: kein Posten betrifft Kataloge) | Posten unter die Rubrik, Rest ins Archiv. **`W2·24-PERF-REST` bleibt** — CLS/Mount ist §15, keine Hülle | KATALOGE / REST |
| `W2·9` (a) Kachel-Höhen | RECHNER (Gegenstand `GebvKostenForm.tsx:97`, Planung 23.9.) | mitziehen. **(b) Schalter «aufgehobene Normen ausblenden» bleibt** — Funktion, nicht Hülle | KATALOGE |
| `abnahme/**`, `docs/ui-befunde-2026-07/**` | — | **bleiben** (datierte Belege); nur das Kontrast-Protokoll zieht als lebende Referenz mit den Tokens um | — |
| `FAHRPLAN-GESETZESDARSTELLUNG-V2.md` (`W2·5g-ZEIT`) · `FAHRPLAN-NORMTEXT-DARSTELLUNG.md` (`W2·5l-NORMTEXT-B2`) | — | **bleiben** — Gegenstand ist Fassungs-/Textdaten (Korpus) | — |

## §8 · Abgelöst und absorbiert

- **`W2·11-DESIGN` (Design-Wärme) ist abgelöst** — Wortlaut und Begründung in `ROADMAP-CHRONIK.md`
  («Ablösung 22.9.2026»), Fahrplan in `archiv/FAHRPLAN-DESIGN-WAERME.md`. Seine sechs offenen
  Posten (D-6 · D-7 · D-8a/b/c · Qualitäts-Pass Gesetzes-Bereich) hängen jetzt unter
  `W2·29-WERKBANK-TOKENS` bzw. `-REST`.
- **`W2·24-C` und `W2·19-DESIGN-KONSISTENZ` bleiben vorerst bestehen** — ihre Posten werden je
  Rubrik mitgebaut. Das ist ein Hinweis, **keine Umbuchung**: dort läuft möglicherweise noch
  Arbeit. Die Umbuchung erfolgt beim Bau der jeweiligen Rubrik (§7).
- **Nebenfunde der Design-Session 22.9.2026** (20 Punkte) liegen im Gedächtnis-Vault, Eintrag
  «Werkbank-Entwürfe». Beim Bau der Rubrik als Posten unter deren Dach anlegen:
  `npm run plan:posten -- neu --dach W2·29-WERKBANK-<X> --titel "…"`.
