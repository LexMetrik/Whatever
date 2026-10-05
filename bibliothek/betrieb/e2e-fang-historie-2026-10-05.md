# e2e-Fang-Historie 5.10.2026 — was die Browser-Specs in 2½ Monaten gefangen haben (QS-CI-ZEIT)

**Erstellt:** 5.10.2026 — Recherche für Davids Entscheid zu den nie-roten
Browser-Specs (Chat 5.10.2026), Folge von QS-CI-ZEIT (#1321/#1323). Zweck: die
Lücke schliessen, die `testapparat-fang-historie-2026-08-31.md` offen liess
(«kein Fehlerbuch, das Fänge Tests zuordnet») — diesmal aus den CI-Artefakten
selbst rekonstruiert, je Spec.

**Status:** einfach belegt (eine Erhebung, ein Rechenweg, Skripte und
Rohtabellen daneben). **Abnahme-Status:** Grundlage des Entscheids David
5.10.2026 «(a) Nachts statt Queue» — die Einstufung Queue/Nacht (§4) ist
Bau-Arbeit nach seiner Grenze, nicht von ihm Spec für Spec abgenommen.

## Quellen mit Stand

- GitHub-Actions-Läufe von `ci.yml` (pull_request, merge_group, push main,
  workflow_dispatch) **18.7.–4.10.2026**, davon **261 Läufe mit
  Browser-Befund** (mindestens ein roter oder erst im Wiederholungsversuch
  grüner Test). Je Lauf: Shard-Logs (`##[error]`-Zeilen mit Spec/Test) und
  Versuchsnummer; je PR: Commit-Kette und geänderte Dateien (`gh api`).
- Testdauern je Spec: Queue-Lauf **37344516589** (5.10.2026, alle 203 Specs,
  Summe 93,6 Testminuten, `playwright-report-gruppe-*`-Artefakte).
- Daten: [`e2e-fang-historie-2026-10-05/`](e2e-fang-historie-2026-10-05/)
  — `treffer.csv` (709 Zeilen: ein Test-Ereignis je Lauf), `spec-tabelle.csv`
  (203 Specs, Zähler je Klasse, Testzahl, Dauer in s), `einstufung-nie-rot.tsv`
  (§4), Skripte `parse.py`/`parse2.py`/`klass.py`/`final.py` (brauchen die
  nicht archivierten Roh-Dumps aus dem Session-Scratchpad; hier als
  Methodenbeleg).

## 1 Methode — die Klassen

Ein **Ereignis** ist ein roter Test in einem Lauf. Gezählt wird unten je
(Lauf, Spec), damit ein Lauf mit zehn roten Fällen derselben Spec nicht
zehnfach zählt. Die Klasse folgt aus dem, was NACH dem roten Lauf im selben PR
bis zum nächsten grünen Lauf derselben Spec geändert wurde:

| Klasse | Regel (klass.py) |
|---|---|
| FANG-PRODUKT | danach nur Produktcode (`src/`, `public/`) geändert, weder die Spec noch e2e-Helfer — der Test hat einen echten Defekt gefangen |
| FANG-GEMISCHT | Produktcode UND Spec/Helfer geändert — Fang wahrscheinlich, Anteil Testkorrektur unklar |
| FANG-TEST | nur Spec/Helfer geändert — der Test war falsch, nicht das Produkt |
| FANG-BAU | die Spec kam im selben PR neu dazu — rot während ihres eigenen Baus |
| FLAKE | im Wiederholungsversuch grün (RETRY), im Re-Run desselben Stands grün (RERUN), gemergt ohne Fix, oder auf main rot und beim nächsten grünen Push ohne Spec-Änderung grün |
| OFFEN/UNKLAR | PR ohne Fix geschlossen, kein späterer grüner Lauf, oder nur fachfremde Dateien geändert |
| INFRA | Shard rot ohne zuordenbaren Test (Runner, Union-Wächter, Abbruch) — Job-Ebene, keine Spec |

**Grenzen.** (a) Lokale Fänge sind unsichtbar: was ein Bauer vor dem Push mit
Playwright fand, steht in keinem CI-Log — die Zahlen unterschätzen den Nutzen.
(b) Abschreckung ist nicht messbar: ein Test, der einen Fehler verhindert, weil
der Bauer ihn kennt, wird nie rot. (c) Flakes in insgesamt grünen Läufen sind
nur erfasst, soweit sie als `##[error]` im Log stehen; bis 5.10. machte ein
Retry-Grün den Shard rot, seither nicht mehr — spätere Zählungen sind nicht
direkt vergleichbar. (d) Die Klasse ist eine Indizienregel am Diff, kein
Gutachten je Fall; der A33/A9-CLS-Cluster (Lese-Scroll unter CPU-Drossel) ist
wacklig und landet je nach Kette in GEMISCHT oder FLAKE. (e) 14 Ereignisse
betreffen inzwischen gelöschte/umbenannte Specs; sie stehen in `treffer.csv`,
nicht in `spec-tabelle.csv` (deren Summen darum leicht tiefer: 50/55/30/12/258/46).

## 2 Kernzahlen (je Lauf und Spec)

Zählweg: `python3` über `treffer.csv`, Schlüssel (lauf_id, spec), Klassen
gruppiert wie in §1; INFRA je Zeile (Job-Ebene).

| Klasse | Ereignisse | Anmerkung |
|---|---:|---|
| FANG-PRODUKT | **54** | in **28 Specs**, **26 PR** |
| FANG-GEMISCHT | 58 | |
| FANG-TEST | 30 | |
| FANG-BAU | 12 | |
| FLAKE | **265** | RETRY, RERUN, gemergt ohne Fix, main |
| OFFEN/UNKLAR | 46 | |
| INFRA | 44 Job-Zeilen | ohne Spec |

**Nie rot:** **107 von 203 Specs** (0 Ereignisse in allen Klassen) mit 784
Tests und 31,2 von 93,6 Testminuten (**33 %** der Browser-Testzeit je
Queue-Lauf).

Beispiele echter Produkt-Fänge (FANG-PRODUKT, Beleg-Commit aus `treffer.csv`):

- **PR #566** (29.8.) `a11y.e2e.ts` + `gesetze-ia7-sidebar-badges.e2e.ts` —
  Kontrast/Badges der Seitenleiste (Kanton BS eingeklappt), Fix `81d586126`.
- **PR #559** (21.8.) `leser-v3-kontext-cls.e2e.ts`, `leser-v3-rahmen.e2e.ts` —
  Layout-Sprung im Lesekörper beim Öffnen des Blatts, Fix `a49178aee`.
- **PR #539** (16.8.) `leser-optionen.e2e.ts` — Fussnoten-Schalter liess
  Fussnoten stehen, Fix `05acf0fe3`.
- **PR #1277** (2.10.) `w229-w1f-blatt-artikel.e2e.ts` — Blatt-Artikel im
  Einzelmodus (Menü-Guard), Fix `1facb2339`.
- **PR #674** (4.9.) `rechtsprechung-richter.e2e.ts` — das Richter-Feld
  wechselte mit dem Zustand seinen zugänglichen Namen (aria-label, WCAG 4.1.2;
  Fix-Kommentar in `RichterFilter.tsx`), Fix `7bd859158`.

## 3 Entscheid David 5.10.2026

Frage: «Was soll mit den 107 Browser-Testdateien geschehen, die in 2½ Monaten
nie rot waren?» — Antwort **«(a) Nachts statt Queue»**. **Grenze** (Teil der
Freigabe): Tests, die Rechenergebnisse oder die Anzeige von Gesetzestexten
prüfen, bleiben in der Warteschlange, auch wenn nie rot. **Löschen ist nicht
freigegeben.** Der Rest läuft nächtlich gegen main, bei Rot ein Zettel.

Umsetzung (PR QS-CI-ZEIT/e2e-nacht): Kopf-Annotation `// @shard-gruppe: nacht`,
Liste `nacht` in `e2e/shard-gruppen.json`, Union-Wächter Queue ∪ Nacht ==
`playwright --list`, Nachtjob `e2e-nacht` in `.github/workflows/perf-nacht.yml`
(Zettel `alarm:e2e-nacht`), Queue-Shards 8 → 6 (Begründung im `_kommentar` der
JSON und in `archiv/ci-yml-kommentare.md` ci-072/ci-073).

## 4 Einstufung der 107 nie-roten Specs

**Regel (deterministisch):** QUEUE, wenn eine Assertion Inhalt, Vollständigkeit,
Reihenfolge oder Fundort von Gesetzes-/Urteilstext betrifft (Normtext,
Fussnoten, Tabellenzeilen in Normtexten, Wortlaut, Stand-/Fassungsangabe, das
richtige Sprungziel eines Tieflinks/Ankers, Volltext im Prerender, amtlicher
Live-Link) oder ein Rechenergebnis bzw. dessen Export (Frist, Behörde,
Rechenweg, ICS, Vorlagen-Export). NACHT, wenn sie nur Geometrie, Überlauf, CLS,
Fokus, Tastatur, Seitenleiste/Reiter/Kopf oder die Bedienung von Such-/Filter-
Feldern prüft — auch auf Leser-Seiten. **Im Zweifel QUEUE** (in der Tabelle mit
«Zweifel» markiert). Grundlage je Spec: Kopfkommentar, Testtitel, angefahrene
Routen (gelesen am Stand `b1d4f029b`).

**Ergebnis** (Zählweg: `.gate/e2e-nacht-zaehlen.py` gegen `spec-tabelle.csv`):

| | Specs | Tests | Testminuten |
|---|---:|---:|---:|
| nie rot → QUEUE | 41 | 221 | 9,2 |
| nie rot → NACHT | 66 | 563 | 22,1 |
| Queue gesamt (inkl. aller je roten) | 137 | 1381 | 71,5 |
| Nacht gesamt | 66 | 563 | 22,1 |

| Spec | Lauf | Grund |
|---|---|---|
| `a31a-fussnote-inline` | QUEUE | Fussnoten-Position im Normtext (ZGB 798a, SchKG 56) |
| `ag-gruendung-wizard` | QUEUE | Vorlagen-Durchlauf bis «Checkliste & Dokumente» (Zweifel: Vorlage) |
| `bild-block-items` | QUEUE | Normtext-Bildblock zeigt Bild und lit./Ziff.-Items samt Fundstelle (DBG 22, STHG 7) |
| `d36-einstellungen-fuss` | NACHT | Lage des Eintrags «Einstellungen» in der Seitenleiste |
| `deckung-seite` | NACHT | Deckungs-Übersicht (Bestandszahlen, kein Rechtstext), Sortierung, Breite |
| `design-tinte-leise` | NACHT | Designsystem-Farbrolle |
| `entscheid-verweis-praezision` | QUEUE | Urteilstext BGE 151 III 377: Verweis-Verlinkung und Sprung zur Erwägung |
| `expect-vorwarten` | QUEUE | Stolperdraht des zentralen expect-Helfers (Scheitern bleibt Scheitern) — schützt die Aussagekraft der Queue-Specs |
| `fn5-wortposition` | QUEUE | Fussnoten-Marker an der amtlichen Wortstelle im Normtext |
| `fremdgesetz-verweis-aig` | QUEUE | Verweise im Normtext (AIG 5) zeigen auf StGB/MStG statt auf das AIG |
| `fussnote-absatz-altform` | QUEUE | Fussnoten im richtigen Absatz (VZG, KOV) |
| `gesetze-ia4-scope` | NACHT | Filter-Bedienung der Gesetze-Übersicht |
| `gesetze-ia5-rechtsgebiet-kanon` | NACHT | URL-Alias und Umschalter der Gesetze-Übersicht |
| `gesetze-rechtsgebiet-g6` | NACHT | Rechtsgebiets-Sicht der Übersicht (Navigation, Overflow) |
| `gesetze-rechtsgebiet-uebersicht-j3` | NACHT | Rechtsgebiets-Gliederung der Übersicht, axe |
| `gesetze-schnellzugriff-filter` | NACHT | Kürzelzeile der Übersicht beim Filtern |
| `gesetze-wahl-kopf-reserve` | NACHT | Spaltenkopf-Breite der Gesetze-Wahl |
| `ics-export-z1` | QUEUE | ICS-Export enthält das berechnete Fristende (Export-Inhalt) |
| `info-seiten-breite` | NACHT | Titelband-Breite der Info-Seiten |
| `international-adresse-b45` | QUEUE | Erlass-Adresse und Weiterleitung: Alt-Link landet auf demselben Artikel (Zweifel) |
| `katalog-breite` | NACHT | Raster/Zeilenlänge der Katalog-Übersichten |
| `katalog-themenleiste-fokusring` | NACHT | Fokusring der Themenleiste |
| `katalog-themenleiste-sticky` | NACHT | Klebende Themenleiste |
| `katalog-zeile-untertitel-kappung` | NACHT | Untertitel-Kappung im Katalog |
| `klebende-leisten-abstand` | NACHT | Abstand klebender Leisten und Sprungziele unter der Arbeitsleiste (Geometrie) |
| `kontrast-fristmarker` | NACHT | Farbkontrast der Frist-Marken (kein Rechenwert) |
| `kopfsuche-esc` | NACHT | Esc-Verhalten der Kopf-Suche |
| `leser-bezuege-fuss-d34` | QUEUE | Tieflink landet nach dem Nachrendern auf dem Zielartikel |
| `leser-gliederung-klappen-w217` | NACHT | Klappen/Tastatur der Gliederung |
| `leser-kein-ueberlauf` | QUEUE | Normtext-Tabelle ZH-211.11 bleibt im Scroller (Tabellen in Normtexten, Zweifel) |
| `leser-klapp-sonde` | NACHT | Kopf-Geometrie beim Klappen |
| `leser-kopf-cls-s3` | NACHT | CLS des Erlass-Kopfs |
| `leser-lade-cls` | NACHT | Lade-CLS Entscheid-/Material-Leser |
| `leser-nachbar-rohdaten` | QUEUE | Nachbar-Pfeile führen zum richtigen Artikel (337b/337d), Anker-Integrität |
| `leser-suche-klappzustand` | NACHT | Suche × Klappzustand (Bedienung) |
| `leser-suche-vertrag-b8` | QUEUE | Suchmarken im Normtext: gemalt ≤ gezählt, Beträge/«aufgehoben» (Zweifel: Markierung im Rechtstext) |
| `leser-suchfeld` | NACHT | Enter-/Highlight-Bedienung des Suchfelds |
| `leser-tabelle-nachspann` | QUEUE | EMRK-Tabelle: keine Zeile verloren, Fussnoten als Nachspann |
| `leser-tastatur-menue-tabelle` | NACHT | Tastatur im Leser (Menü, Tabelle scrollen, Overlay) |
| `leser-tieflink-robust-w217` | QUEUE | Tieflinks landen auf dem Artikel bzw. stürzen nicht ab (ZH-230 Art. 5) |
| `leser-toc-sprung` | QUEUE | Gliederungs-Klick landet auf dem Abschnitt, nicht davor |
| `leser-v3-auskunft` | NACHT | Suchfeld/Trefferliste: Fokusring, Zähler, Platzhalter |
| `leser-v3-esc-ohne-sprung` | NACHT | Esc ohne Scrollsprung |
| `leser-v3-fokusring-suchfeld` | NACHT | Fokusring des Suchfelds |
| `leser-v3-kopf` | QUEUE | Standausweis, «nächste Fassung ab», nicht konsolidierte Änderung im Kopf |
| `leser-v3-ortsangabe` | QUEUE | Ortsangabe nennt die tatsächlich sichtbare Bestimmung (Zweifel) |
| `leser-v3-panel-blatt-leerstellen` | NACHT | Methoden-Hinweis im Materialien-Blatt (kein Rechtstext) |
| `leser-v3-panel-erlaeuterungen` | NACHT | Panel-Reiter Erläuterungen/Werkzeuge |
| `leser-v3-panel-facetten` | NACHT | Panel-Facetten, Reiter, axe |
| `leser-v3-panel-filter-befunde` | NACHT | Bedienung des Entscheide-Filters |
| `leser-v3-panel-revision-badge` | QUEUE | Revisions-Badge mit Revisionsdatum und AS-Fundstelle am Entscheid |
| `leser-v3-prerender-bezuege` | QUEUE | Prerender trägt den Artikel-Volltext, lesbar ohne JavaScript |
| `leser-v3-schriftskala` | NACHT | Schriftgrössen-Regler |
| `leser-v3-suche-sprung` | QUEUE | Eingabe «429» springt zu Art. 429 (Zweifel: Sprungziel) |
| `leser-v3-suchfeld-ueberall` | NACHT | Erreichbarkeit des Suchfelds je Breite |
| `leser-v3-treffer-deckel` | NACHT | Trefferliste deckt das Suchfeld nicht zu |
| `leser-v3-treffer-reihenfolge` | NACHT | Reihenfolge/Gruppierung der Trefferliste |
| `leser-v3-uebersicht` | QUEUE | Übersichtsbox: Stand/Erlassdatum nicht gekappt, nicht doppelt (Zweifel: Erlass-Metadaten) |
| `leser-w224-g` | NACHT | Panel-Reiter und Kopfzeile passen ins Blatt |
| `leser-w228-landkarte` | NACHT | Treffer-Landkarte (Bedienung) |
| `leser-wortlaut-w217` | QUEUE | Wortlaut-Darstellung (Anhang-Titel, Jahreszahl, lit. unter Ziff., Marke) |
| `leser-ziffer-fragment-w227` | QUEUE | Ziffer-Anker landet auf der Ziffer (BV 197, StGB 187, MStG 122) |
| `leser-zukunftsfassung-w2-27` | QUEUE | Hinweis auf künftige Fassung mit Link zur datierten amtlichen Fassung |
| `material-leser-randspalte` | NACHT | Spalten-Layout des Material-Lesers |
| `materialien-cls` | NACHT | Lade-CLS /materialien |
| `materialien-deckel` | NACHT | DOM-Deckel und «Weitere anzeigen» |
| `materialien-m1-estv-mwst` | QUEUE | Sichtbarer amtlicher Live-Link der Material-Karte (§7 lit. c, Zweifel) |
| `materialien-m2-seco` | QUEUE | Sichtbarer amtlicher Live-Link der Material-Karte (§7 lit. c, Zweifel) |
| `materialien-m3-edoeb` | QUEUE | Sichtbarer amtlicher Live-Link der Material-Karte (§7 lit. c, Zweifel) |
| `materialien-m4-estv-ks` | QUEUE | Sichtbarer amtlicher Live-Link der Material-Karte (§7 lit. c, Zweifel) |
| `materialien-m5-verzahnung` | QUEUE | «nur Verweis»-Ausweis der Material-Karte (§7/§8, Zweifel) |
| `plz-wahl` | QUEUE | PLZ-Wahl setzt Gemeinde und Kanton für Betreibungsort/Zuständigkeit (Rechenergebnis) |
| `rechner-breite` | NACHT | Spalten-Layout der Rechner @1920 |
| `rechtsprechung-besetzung-links` | NACHT | Verlinkung der Besetzung, a11y, CLS (Urteilstext unberührt) |
| `rechtsprechung-breite` | NACHT | Breitenstufe der Rechtsprechung |
| `reiter-fokusring` | NACHT | Fokusring der Reiter |
| `schnellrechner-kalender` | NACHT | Lage/Overflow des Kompakt-Kalenders |
| `smoke` | QUEUE | Kernrouten (auch Rechner/Leser) rendern mit Inhalt ohne Fehler (Zweifel: weisser Bildschirm) |
| `startseite-blatt` | NACHT | Kachelfeld/Blatt der Startseite |
| `startseite-breite` | NACHT | Breitenstufe der Startseite |
| `startseite-schnellwerkzeug` | QUEUE | Schnell-Fristrechner: Rechnen, Normbezüge je Ferien-Regime |
| `suche-randspalte` | NACHT | Spalten-Layout der Suche |
| `tagerechner-datum-ungueltig` | QUEUE | Unmögliches Datum leert das alte Fristende (Rechenergebnis) |
| `tagerechner-rechenweg-sync` | QUEUE | Rechenweg folgt den Eingaben, Regime im Hash (Rechenergebnis) |
| `topbar-kein-ueberlauf-320` | NACHT | Topbar @320 |
| `uinav-o2-sidebar` | NACHT | Seitenleisten-Navigation |
| `verlauf-o1` | NACHT | Verlauf-Panel |
| `vorlagen-hinweise-lesemass` | NACHT | Zeilenlänge der Vorlagen-Hinweise |
| `vorlagen-pruefschritt-d5` | QUEUE | Prüfschritt vor dem Dokument-Export einer Vorlage |
| `vorlagen-wizard-fokus` | NACHT | Fokus beim Schrittwechsel |
| `w223b-kopf-seitenleiste` | NACHT | Kopf-Suche und Seitenleiste |
| `w224-d35-f2-kopf` | NACHT | Kopf ohne Entscheid-Zahl |
| `w224-d35-f3-vermerke` | QUEUE | Fussnoten-Schalter: ob Fussnoten im Normtext stehen, Migration ohne stilles Kippen |
| `w224-d37-seitenleiste-gruppen` | NACHT | Seitenleisten-Abschnitte starten zu |
| `w224-ga-kopf` | NACHT | Kopfangaben nicht doppelt (Chrome) |
| `w224-kopfsuche-d23` | NACHT | Geometrie der Kopf-Suche |
| `w224-leser-d32-d33` | NACHT | Geometrie der Leser-Kopfzone |
| `w224-plus-reiter` | NACHT | Reiter per «+» |
| `w224-r13-reiter` | NACHT | Reiterleiste |
| `w224-r13b-reiter-cls` | NACHT | CLS der Reiterleiste |
| `w224-r14-reiter-modell` | NACHT | Reiter-Modell |
| `w224-r14b-meta-reiter` | NACHT | Meta-Seiten-Reiter |
| `w224-r6i-vorschau-schrift` | QUEUE | Tieflink landet auf der Leselinie (OR 336c), Insel ohne Umbruch (Zweifel) |
| `w229-blatt-runde2` | QUEUE | Einzelmodus-Anker zeigt Art. 336c, «Entwurf»-Status je Werkzeug (Zweifel) |
| `w229-w1f-blatt-scroll` | NACHT | Scroll-Reset des Blatts |
| `werkzeugkopf-intro-mobil` | NACHT | Kürzung der Werkzeugkopf-Einleitung |
| `zustaendigkeit-fluss` | QUEUE | Zuständigkeits-Rechner bis zum Behörden-Ergebnis |

## Nachtrag 5.10.2026 — nach Gegenprüfung (PR #1326) zurück in die Queue

Die Gegenprüfung von PR #1326 widerlegte die Einstufung für acht Specs. Die
Tabellen in §3/§4 oben stehen unverändert als Stand der Erhebung; hier gilt
seither der Ist-Stand. Zählweg: `.gate/nz-zaehlen.py` gegen `spec-tabelle.csv`
(Tests, `dauer_s`) und `einstufung-nie-rot.tsv` (nie rot: 107 Specs).

**Nach Gegenprüfung 5.10.2026 zurück in die Queue** (die Spalte `nachtrag` der
Einstufungstabelle trägt dieselben Gründe):

| Spec | Grund |
|---|---|
| `rechtsprechung-besetzung-links` | **blockierend:** Test 1 prüft den amtlichen Rubrum-Wortlaut «Besetzung» per toBe — Anzeige von Urteilstext (die Einstufung las «Urteilstext unberührt») |
| `leser-gliederung-klappen-w217` | **blockierend:** Test f prüft die NHG-Artikelreihenfolge (Regression B7), EMRK-Anhang/VwVG-Index — Reihenfolge/Inhalt von Gesetzestext (die Einstufung las «Klappen/Tastatur») |
| `leser-v3-treffer-reihenfolge` | im Zweifel Queue: Trefferliste in der Reihenfolge des Gesetzestexts, eine Zeile je Fundstelle |
| `leser-suchfeld` | im Zweifel Queue: Enter springt zur Fundstelle im Normtext, aktive Fundstelle wird markiert |
| `leser-suche-klappzustand` | im Zweifel Queue: Treffer in zugeklappter Sektion öffnet und markiert die Fundstelle im Normtext |
| `leser-v3-panel-erlaeuterungen` | im Zweifel Queue: welche Erläuterungen/Werkzeuge je Erlass erscheinen (Inhalt, nicht nur Bedienung) |
| `leser-v3-panel-filter-befunde` | im Zweifel Queue: Kantons-/Zeitraumfilter bestimmen, welche Urteile gelistet bleiben |
| `leser-w228-landkarte` | im Zweifel Queue: Marken sind die Treffer im Gesetzestext, Klick führt an die richtige Stelle |

**Neue Zählung** (nie rote Specs, Stand nach Gegenprüfung):

| | Specs | Tests | Testminuten |
|---|---:|---:|---:|
| nie rot → QUEUE | 49 | 279 | 14,3 |
| nie rot → NACHT | 58 | 505 | 17,0 |
| Queue gesamt (inkl. aller je roten) | 145 | 1439 | 76,6 |
| Nacht gesamt | 58 | 505 | 17,0 |

(Vorher 41/66 Specs, 221/563 Tests, 9,2/22,1 min. Unverändert die Summen: 107
nie rote Specs mit 784 Tests und rund 31 min (Rundung der Dauern je Spec); alle 203 Specs mit 1944 Tests und
93,6 min. Zählung per Skript, nicht von Hand.)

**Neupackung** der 145 Queue-Specs auf 6 Gruppen mit derselben Mechanik wie
im Nachtrag N2 (LPT: Greedy nach absteigender Spec-Dauer, Gleichstand →
niedrigste Gruppe; Dauern aus dem Queue-Lauf 37344516589): je 765–767 s
Testzeit, Spanne 1,2 s (vorher 715–716 s). Die Probe der Mechanik auf den 137
alten Queue-Specs reproduziert die damalige Packung exakt (0 Wechsel); mit
den acht neuen wechseln 109 der 137 Altspecs die Gruppe (der inkrementelle
Einbau der acht ohne Umzug hätte 87 s Spanne ergeben und wurde verworfen). Die
Zeitrechnung (Testsumme / Shards / 2 Worker + ~70 s Rüstzeit) ergibt bei
6 Shards ~7,5 min Wanduhr je Shard (8: 6,0 · 7: 6,6 · 5: 8,8 · 4: 10,7); die
Gruppenzahl bleibt 6 (Entscheid David 5.10.2026).

**Offener Fund aus derselben Gegenprüfung (kein Umbau hier):**
`e2e/leser-kopf-cls-s3.e2e.ts:80-84` wartet auf den Fedlex-Konsolidierungshinweis
an der StPO und fällt rot, sobald Fedlex konsolidiert, ohne Produktdefekt
(EINGANG-Zeile in `ROADMAP.md`). Die Spec bleibt vorerst in der Nacht.

## Nachtrag 2, 5.10.2026 — Gegenprüfung Runde 2: 6 weitere Specs zurück in die Queue

Die zweite Gegenprüfungs-Runde (GP R2) von PR #1326 fand sechs weitere Specs,
deren Einstufung in der Nacht nicht haltbar ist. Neubewertung je Spec aus den
Asserts:

| Spec | Grund |
|---|---|
| `startseite-blatt` | Suchtreffer-Zähler und Registerzähler sind Dateninhalte (Suchdaten) |
| `leser-v3-auskunft` | Normtext-Schnipsel mit Markierungen, Artikel-/Paragraph-Zählung im Suchfeld |
| `gesetze-rechtsgebiet-g6` | Artikelspanne «Art. 319–362» ist ein Normtext-Verweis |
| `deckung-seite` | Summen und Quote der Deckungsübersicht sind Rechnergebnisse |
| `w224-plus-reiter` | Zitat-Auflösung «OR 257d» → «#art-257_d» ist ein Normtext-Sprungziel |
| `leser-v3-panel-facetten` | Erscheinende Entscheide je Erlass (Urteils-Auswahl) —Inhalt/Filterung, nicht Bedienung |

**Neue Zählung** (nie rote Specs, Stand nach Gegenprüfung R2):

| | Specs | Tests | Testminuten |
|---|---:|---:|---:|
| nie rot → QUEUE | 55 | 351 | 16,6 |
| nie rot → NACHT | 52 | 433 | 14,7 |
| Queue gesamt (inkl. aller je roten) | 151 | 1511 | 78,9 |
| Nacht gesamt | 52 | 433 | 14,7 |

(Vorher nach GP R1: 49/58 Specs, 279/505 Tests, 14,3/17,0 min. Unverändert die
Summen: 107 nie rote Specs mit 784 Tests und rund 31 min; alle 203 Specs mit
1944 Tests und ~93,6 min. Die Packungs-Spanne «1,2 s» im Nachtrag 1 beruht auf
ungerundeten Lauf-Dauern; aus der ganzzahligen spec-tabelle.csv ergeben sich
~6 s bei der Neupackung der 151 Queue-Specs auf 6 Gruppen.)

**Neupackung** mit derselben LPT-Mechanik (Dauern aus Queue-Lauf 37344516589):
151 Queue-Specs auf 6 Gruppen; je 751–757 s je Shard, Spanne 6 s. Alle 203
Specs mit 1944 Tests und ~93,6 Testminuten je Queue-Lauf.

## Pflegebedarf

- **Neue Spec:** trägt eine Zahl (Queue) oder `nacht`; die Grenze aus §3 gilt
  weiter — Rechen-/Rechtstext-Prüfung gehört in die Queue.
- **Neu einstufen**, wenn eine Nacht-Spec im Nachtlauf einen Produkt-Defekt
  fängt (Zettel `alarm:e2e-nacht`): dann zurück in die Queue und hier einen
  Nachtrag.
- **Erneute Erhebung** sinnvoll nach ~3 Monaten Nachtbetrieb (Januar 2027) —
  mit der seit 5.10. geänderten Flake-Wertung (Grenze c).
