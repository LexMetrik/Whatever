# FAHRPLAN — Werkbank-Umbau: das neue Design an Ort, Rubrik für Rubrik
<!-- @lagebild name: Werkbank-Umbau · zweck: Die Website bekommt das Aussehen des Werkbank-Entwurfs — eine Rubrik nach der anderen, und die alte Hülle wird dabei jedes Mal gelöscht. -->

> **ROADMAP-Dach:** sieben Schritte `W2·29-WERKBANK-*` (TOR · TOKENS · LESER · KATALOGE ·
> VORLAGEN · RECHNER · REST), Trailer `Roadmap: W2·29-WERKBANK-<X>`. Serielle `dep`-Kette —
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
- **Löschbilanz je Rubrik-PR:** gelöschte Zeilen ≥ 50 % der hinzugefügten in `src/components`
  + `src/pages`. Wächst der Bestand netto, war es kein Umbau, sondern eine zweite Hülle.

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

## §4 · Schritt 1 — Tokens (`W2·29-WERKBANK-TOKENS`, `feld: design`, dep `TOR`)

**Ziel:** eine Token-Quelle im Repo. `tokens.json` des Design-Systems kommt an **einen** Ort; ein
Generator erzeugt daraus die `:root`- und `html.dark`-Blöcke in `src/index.css` sowie die Farb-
und Typo-Teile von `tailwind.config.js`; `check:design-tokens` prüft die Drift generiert ↔ Quelle.
Die fünf `DESIGN-REGLEMENT*.md` werden auf **ein** Reglement konsolidiert, das die Token-Datei
kommentiert — keine zweite Wahrheit (§5).

**Grenzen:** Kontrast-Tore (`check:farbwelt`, axe, APCA) grün; Normtext-Körper farbfrei; keine
Rohwerte in Komponenten; Golden byte-gleich. **Die Startseite bleibt unberührt** — V4 Werkbank ist
seit 5.9.2026 live (`a66421362`).

**Vorbedingung — drei Entscheide Davids** (Blocker `david-design-entscheide`):

1. Seitenleiste: Variante 1, 2 oder 3 (Board «Seitenleiste drei Varianten»).
2. Startseiten-Kachel: «49» (23 Rechner-Karten + 26 Vorlagen im Register) oder «20 Rechner ·
   30 Vorlagen» (Routen)? — Inventar, «Zahlen im Entwurf gegen Zahlen im Produkt».
3. «Farbe als Fläche» ja oder nein (ändert F0.2 und `check:farbwelt`).

## §5 · Die fünf Rubrik-Schritte

Reihenfolge nach Produktwert, Dep-Kette
`TOR → TOKENS → LESER → KATALOGE → VORLAGEN → RECHNER → REST`.

| Schritt | `feld:` | Abnahmeliste (Inventar) | Richtung (Boards) | Grenzen |
|---|---|---|---|---|
| **`W2·29-WERKBANK-LESER`** — Gesetzes-Leser, grösster Korpus | `leser` | Abschnitt 2 (ganz) | Gesetz (ein Artikel) · Fliesstext, Erlass-Blatt offen/zu | **Normtext-Körper bleibt golden byte-gleich**; Fassungen, Revisionen, Verknüpfungen ziehen mit, werden nicht umgebaut |
| **`W2·29-WERKBANK-KATALOGE`** — die vier Kataloge | `design` | 2.2 · 3.2 · 4.2 · 5.2 | vier Katalog-Boards + Suche · Abdeckung · Einstellungen | Status-Modell sichtbar (§8); Kantons-Auswahl mit Schweizkarte hat kein Board — Session entscheidet |
| **`W2·29-WERKBANK-VORLAGEN`** — ein Assistenten-Rahmen, dann die 30 | `werkzeuge` | 5.3 · 5.4 · 5.5 | Vorlage Arbeitsvertrag (Schritt 4 von 7) | Rahmen **aus den bestehenden** `src/lib/vorlagen/*Schemas.ts`, kein zweites Schema-Modell; PDF und DOCX aus demselben Assemble-Ergebnis (§5); die 42 geplanten fallen danach aus demselben Rahmen |
| **`W2·29-WERKBANK-RECHNER`** — die 20 einzeln | `werkzeuge` | 4.3 · 4.4 | Fristenrechner ZPO | Gemeinsamer Rahmen **nur** für Kopf, Ergebnisblock, Exportleiste. **Rechenfälle nie abstrahiert (§1)** — 20 Rechner bleiben 20 Handgriffe |
| **`W2·29-WERKBANK-REST`** — Rest und Rückbau | `design` | 1.5 · 1.6 · 3.3–3.7 · 6 | Entscheid · Materialien | Entscheid-Leser, Materialien, statische Seiten, mobile Breite, Druckansicht; **hier fallen die letzten Alt-Stylesheet-Reste und die abgelösten Reglemente** (§7) |

**Definition of Done jedes Rubrik-Schritts** (zusätzlich zu Skill `auftrag` Ziff. 4): **«Rückbau-
Liste dieses Schritts abgearbeitet (Dateien gelöscht, Posten/Schritte in die Chronik, Fahrpläne
ins Archiv), `check:sediment` grün.»** Ohne Rückbau ist der Schritt nicht `done`.

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
| `public/icons.svg` (5 KB Sprite) | schon heute ohne Gegenstand — **0 Verweise repo-weit** (Sonde 22.9.2026) | löschen | TOR (dieser PR ist doku-only) |
| Doppelte Rechner-Metadaten `src/lib/calculators.ts` ↔ `startseiteConfig.ts` | TOR (c) | eine Quelle, die andere löschen | TOR |
| Die fünf `DESIGN-REGLEMENT*.md` (159 KB) | TOKENS — `tokens.json` ist die Quelle | auf **ein** Reglement konsolidieren; die Normtext-Darstellungsregeln (Tabellen T-A…T-F, `p`-Klassen) bleiben — Rechtsdarstellung, nicht Hülle | TOKENS |
| `.claude/rules/design.md` | TOKENS | auf das eine Reglement nachziehen (zählt zur Steuerfläche — Rückbau, nicht Zuwachs) | TOKENS |
| Alt-Blöcke in `src/index.css` (4 799 Z.) · ungenutzte Teile `tailwind.config.js` (429 Z.) | jede Rubrik löst ihren Teil ab | rubrikweise löschen, Rest bei REST; `check:sediment` (a) ist der Nachweis | je Rubrik |
| `FAHRPLAN-LESER-V3.md` + `W2·5m-LESER-V3` («Hülle neu, Kern unangetastet») | LESER — dasselbe Ziel, anderer Weg | Posten unter LESER, Schritt in die Chronik, Fahrplan ins Archiv | LESER |
| `FAHRPLAN-SPLIT-VIEW.md` · `FAHRPLAN-GESETZES-UX.md` (beide ohne lebenden Schritt) | LESER | prüfen, was noch Referenz ist (`DESIGN-REGLEMENT-NORMTEXT.md` zeigt auf GESETZES-UX), Rest ins Archiv | LESER |
| `FAHRPLAN-UI-BEFUNDE.md` (210 Befunde an der alten Hülle) + `W2·17-UI-BEFUNDE` | jede Rubrik löst ihre Befunde ab | je Rubrik abhaken oder als gegenstandslos in die Chronik; Rest ins Archiv | je Rubrik, Schluss REST |
| `FAHRPLAN-UI-QUALITAET.md` + `QS-UI` · `FAHRPLAN-DESIGN-KONSISTENZ.md` + `W2·19-DESIGN-KONSISTENZ` | der Umbau stellt gleiche Dinge gleich dar — das **ist** die Konsistenz-Arbeit | absorbieren, Schritte in die Chronik, Fahrpläne ins Archiv | REST |
| `FAHRPLAN-DESIGN-IDENTITAET.md` §8-Reste + `W2·24-C` | KATALOGE / REST | Posten unter die Rubrik, Rest ins Archiv. **`W2·24-PERF-REST` bleibt** — CLS/Mount ist §15, keine Hülle | KATALOGE / REST |
| `W2·9` (a) Kachel-Höhen | KATALOGE | mitziehen. **(b) Schalter «aufgehobene Normen ausblenden» bleibt** — Funktion, nicht Hülle | KATALOGE |
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
