# Funktions-Inventar LexMetrik

**Stand:** `main@a2ad90c7d`, 22.9.2026. Zahlen aus den generierten Registern
(`public/normtext/register.json` erzeugt 2026-09-21 · `public/rechtsprechung/register.json`
erzeugt 2026-09-12 · `public/materialien/register.json` erzeugt 2026-09-18 ·
`src/data/startseiteZaehler.generated.ts`).

**Zweck.** Dieses Dokument beschreibt vollständig, **was** LexMetrik heute tut —
jede Seite, jedes Werkzeug, jedes Feld, jeden Zustand, jeden Text. Es richtet sich
an einen Design-Agenten, der den Code nicht sieht und die Anwendung auf dem neuen
Design «Werkbank» nachbauen und später umbauen soll. Es beschreibt **Verhalten,
Inhalte, Zustände und Interaktionen** — keine Farbwerte, keine Typografie-Skalen,
keine Tokens: die stehen im separaten Design-System-Artefakt (Farben, Typografie,
16 Komponenten-Karten). Wo dieses Inventar und das Design-System sich berühren
(Badge-Anatomie, Notice-Familie), ist hier nur die **Bedeutung** notiert, nie der Wert.

## Leseanleitung

Jede Seite, jedes Werkzeug und jede Unterfunktion folgt derselben Blockstruktur:

| Block | Inhalt |
|---|---|
| **Zweck** | Wozu die Fläche da ist, in einem bis drei Sätzen. Der fachliche Auftrag, nicht die Technik. |
| **Elemente** | Was auf der Fläche steht, in Leserichtung. Beschriftungen sind wörtlich zitiert — sie sind der Wert dieses Dokuments und dürfen beim Nachbau nicht umformuliert werden. |
| **Eingaben & Interaktionen** | Was die Nutzerin tun kann: Felder mit Typ und Pflicht/optional, Optionslisten vollständig, Klicks, Tasten, Weichen. |
| **Zustände** | Lädt · leer · Fehler · Sonderfälle. Jeder Zustand mit seinem sichtbaren Text. |
| **Persistenz** | Was die Fläche sich merkt und wo (URL · `localStorage` · `sessionStorage` · gar nicht). Nichts verlässt je den Browser. |
| **Quelle** | Dateipfade. **Nur für den späteren Umbau** — der Design-Agent braucht sie nicht, um nachzubauen; er braucht sie, wenn jemand später fragt «wo steht das?». |

**Begriffe.** Im Fliesstext stehen Klartext-Namen («Reiterleiste», «Gliederung»,
«Funktionszeile»); Code-Namen stehen nur in Klammern oder in `Quelle`-Zeilen.
Überschriften-Ebenen: `##` Abschnitt · `###` Seite oder Werkzeug · `####` Unterfunktion.

**Doppelungen.** Bausteine, die in mehreren Abschnitten auftauchen (Rechtsprechungs-Link,
Norm-Popover, Status-Modell, Permalink, Kopier-Quittung, Leerzustand, Fehlseite),
sind **einmal** ausführlich beschrieben — meist in Abschnitt 6 — und sonst nur
verwiesen. Widersprüche zwischen den Rohabschnitten sind **nicht** stillschweigend
geglättet: sie stehen an Ort und Stelle markiert (`⚠ Widerspruch Wn`) und gesammelt
in Abschnitt 8.

## Rubriken-Karte: Inventar → Werkbank

Das neue Design ordnet alles vier Rubriken plus einem Rahmen zu. So fällt das
Inventar darauf:

| Werkbank-Rubrik | Abschnitte dieses Inventars | Routen |
|---|---|---|
| **Rahmen** (Startseite «Pult», Seitenleiste, Reiterleiste, Suche, Einstellungen) | 1 (ganz), 6 (ganz) | `/`, `/suche`, `/einstellungen`, `/methodik`, `/ueber`, `/kontakt`, `/datenschutz`, `/abdeckung`, 404 |
| **Gesetze** | 2 (ganz) | `/gesetze`, `/gesetze/:ebene`, `/gesetze/:ebene/:key` |
| **Rechtsprechung** | 3.1–3.3, 3.7 | `/rechtsprechung`, `/rechtsprechung/:key` |
| **Materialien** | 3.1, 3.4–3.7 | `/materialien`, `/materialien/deckung`, `/materialien/:key` |
| **Werkzeuge** (= Rechner + Vorlagen) | 4 (Rechner), 5 (Vorlagen) | `/rechner`, `/rechner/*`, `/vorlagen`, `/vorlagen/*` |

Der Abschnitt 6 (Bausteine, Zustände, Konventionen) gilt **quer über alle vier
Rubriken** — er ist kein eigener Bereich der Oberfläche, sondern deren gemeinsame
Grammatik.

## Abgleich mit dem Werkbank-Entwurf (Stand 22.9.2026)

Der Werkbank-Entwurf (Design-Artefakt «LexMetrik Werkbank», 18 Boards auf acht Seiten)
zeigt heute **eine Auswahl** der Flächen. Die Tabelle sagt, welcher Inventar-Abschnitt
zu welchem Board gehört, und die Liste danach, was im Inventar steht, aber noch
**kein Board** hat. Der Design-Agent findet so, was beim Nachbau fehlt.

| Seite im Entwurf | Board | Inventar-Abschnitt |
|---|---|---|
| 1 · Start | Startseite (hell, dunkel) | 1.2 Startseite «Pult», 1.3 Layout und Rahmen |
| 2 · Gesetz lesen | Gesetz (ein Artikel) · Gesetz im Fliesstext, Erlass-Blatt offen und eingeklappt | 2.3 Gesetzes-Leser, 2.4 Verknüpfungen |
| 3 · Entscheid lesen | Entscheid | 3.3 Entscheid-Leser, 3.7 Verzahnung |
| 4 · Materialien lesen | Materialien (Register mit geöffnetem Dokument) | 3.4 Materialien-Übersicht, 3.5 Material-Leser |
| 5 · Kataloge | Gesetze-Katalog · Rechtsprechung-Register · Rechner-Katalog · Vorlagen-Katalog | 2.2 Gesetzes-Übersicht, 3.2 Rechtsprechung-Übersicht, 4.2 Rechner-Übersicht, 5.2 Vorlagen-Übersicht |
| 6 · Werkzeuge | Fristenrechner ZPO · Vorlage Arbeitsvertrag (Schritt 4 von 7) | 4.3 Rechner-Rahmen + 4.4.2, 5.3 Vorlagen-Rahmen + 5.4 (Arbeitsvertrag) |
| 7 · Suche & Einstellungen | Suche · Was ist durchsuchbar · Einstellungen | 1.4 Suche, 1.5 Statische Seiten (`/abdeckung`), 1.6 Einstellungen |
| 8 · Zur Wahl | Seitenleiste drei Varianten · Farbstufen-Vergleich | 1.3 Layout und Rahmen (Seitenleiste) |

**Im Inventar, aber ohne Board:**

- 19 der 20 Rechner (4.4.1, 4.4.3 bis 4.4.20) — der Entwurf zeigt nur den ZPO-Fristenrechner. Besonders eigenständige Flächen: Tagerechner mit Weiss-nicht-Weiche (4.4.13), Zuständigkeit mit drei Reitern (4.4.15), Verzugszins mit Zeitstrahl (4.4.3), Kündigung mit Zeitleiste und Sperrfristen (4.4.1).
- 29 der 30 Vorlagen (5.4) und die Gründungs-Mappen mit mehreren Dokumenten (5.5) — der Entwurf zeigt nur den Arbeitsvertrag-Assistenten.
- Der Stub für geplante Werkzeuge (`/rechner/:slug`, 1.1 und 4.2) und die «In Vorbereitung»-Karten in den Katalogen (6.5).
- Deckungsseite der Materialien (3.6).
- Statische Seiten Methodik, Über, Kontakt, Datenschutz, Nicht gefunden (1.5).
- Kantons-Auswahl mit Schweizkarte in der Gesetzes-Übersicht (2.2).
- Fassungen und Revisionen am Artikel (2.3), Bezüge-Panels im Detail (3.7).
- Reiter- und Mappen-Mechanik: Anheften, Umsortieren, Wiederherstellen, geteilte Ansicht (1.3).
- Alle Zustände: leer, lädt, Fehler, Kopiert-Quittung, Chunk-Ladefehler (6.6); Formular-Fehler nach erster Eingabe (6.7).
- Mobile Breite, Druckansicht (6.10); Tastenkürzel (6.9).

**Zahlen im Entwurf gegen Zahlen im Produkt:** Die Startseite des Entwurfs zeigt
«49 · 20 Rechner · 29 Vorlagen». Das Produkt zählt 49 als 23 Rechner-Karten plus
26 Vorlagen im Register (siehe Kennzahlen); 20 und 30 sind die Routen. Welche
Lesart die Kachel tragen soll, ist ein offener Entscheid (Vault-Eintrag
«Werkbank-Entwürfe», Punkt d).

## Kennzahlen

| Grösse | Zahl | Quelle / Zählregel |
|---|---:|---|
| Routen gesamt (feste Pfade + Muster) | 26 Muster | `src/App.tsx`, `src/RouteSwitch.tsx`, `src/routesManifest.ts` (Abschnitt 1.1) |
| davon Rechner-Routen | 20 | `routesManifest.ts`, eindeutige `/rechner/<slug>` |
| davon Vorlagen-Routen | 30 | `routesManifest.ts`, eindeutige `/vorlagen/<slug>` — ⚠ Widerspruch W1 |
| Erlasse im Register gesamt | 1'580 | `public/normtext/register.json` |
| — Bund (`ebene: bund`) | 241 | davon 231 mit Volltext-Snapshot |
| — Kantone (26 Kantone) | 1'339 | alle mit Volltext-Snapshot |
| — davon Rechtsgebiet «international» | 37 | alle mit `ebene: bund`; 28 mit Volltext-Snapshot — ⚠ Widerspruch W2 |
| Erlasse im Volltext (Startseiten-Zähler) | 1'570 | `gesetzeVolltext` = 231 Bund + 1'339 Kanton |
| Entscheide im Register | 6'345 | `public/rechtsprechung/register.json` |
| — davon eigener Volltext (Nicht-Verweise) | 5'093 | `rechtsprechungVolltext`; 1'252 Einträge sind Verweis-Stubs |
| — davon amtliche Leitentscheide (BGE) | 1'259 | `rechtsprechungLeitentscheide` |
| Materialien (Behördenpublikationen) | 1'683 | `public/materialien/register.json`, alle `status: nur-live-link` |
| Rechner gebaut (eigene Route) | 20 | 23 Katalogkarten mit `href` auf 20 Routen (drei Karten-Paare teilen sich eine Route) |
| Rechner geplant (Stub) | 39 | Katalogkarten `status: geplant`, ohne `href` (nachgezählt 22.9.2026 über `ALLE_KARTEN`) |
| Rechner-Katalogkarten gesamt | 62 | `modus: 'rechner'` über drei Karten-Module (nachgezählt 22.9.2026) |
| Startseiten-Zähler «Werkzeuge» | 49 | `startseiteZaehler.generated.ts`: `rechner` = 23 (Karten mit `href`, Anker-Varianten einzeln) + `vorlagen` = 26 (Karten im Register) — nicht 20 + 30 |
| Vorlagen gebaut (eigene Route) | 30 | `routesManifest.ts`; im Register sichtbar sind 26 (vier Karten `imKatalog: false`) |
| Vorlagen geplant | 42 | Katalogkarten `status: geplant`, kein Export |
| Vorlagen-Katalogkarten gesamt | 72 | `modus: 'vorlage'` |
| Katalogeinträge mit Status «geprüft» | 0 | kein Eintrag; Statusmodell §8 (Abschnitt 6.5) |
| UI-Bausteine (`src/components/ui/`) | 23 Komponenten + 2 Helfer-Module | Verzeichnis-Zählung |
| Formular-Bausteine (Vorlagen/Rechner) | 16 benannte | Abschnitt 6.2 |
| Icons im Set | 8 | `src/components/Icon.tsx` (Abschnitt 6.12) |
| Tastenkürzel (global/Layout) | 14 | Abschnitt 6.9 |

---

## 1 Rahmen, Navigation, Startseite, Suche

### 1.1 Routentabelle

| Pfad | Seite (Klartext) | Zweck | Sonderfall |
|---|---|---|---|
| `/` | Startseite («Pult») | Einstieg: Begrüssung, 5 Bereiche, Zuletzt, ein-/ausblendbare Module | prerendert |
| `/rechner` | Rechner-Übersicht | Browsbare Liste aller Rechner | — |
| `/vorlagen` | Vorlagen-Übersicht | Browsbare Liste aller Vorlagen | — |
| `/recherche` | — | — | Redirect → `/rechner` (Alt-Link-Erbe) |
| `/pro`, `/fachpersonen` | — | — | Redirect → `/` + Query (aufgehobene Free/Pro-Zweiteilung) |
| `/rechner/<slug>` (20 feste Pfade) | einzelner Rechner | Fristen/Gebühren/Zuständigkeit je Rechtsgebiet | aus `routesManifest.ts`, datengetrieben |
| `/vorlagen/<slug>` (30 feste Pfade) | einzelne Vorlage | Vertrag/Klage/Gesuch als Wizard | aus `routesManifest.ts`, datengetrieben |
| `/rechner/fristenspiegel` | — | — | Redirect, liest `?ev=` und leitet mit Query auf den passenden Fach-Rechner (aufgelöster «Fristenspiegel») |
| `/rechner/:slug` (alles andere) | Rechner-Stub | «In Vorbereitung»-Platzhalter für noch nicht gebaute Rechner | Stub — 404 falls Slug unbekannt |
| `/gesetze` | Gesetze-Übersicht | Browsen Bund/Kantone/International | prerendert |
| `/gesetze/:ebene` | — | — | Redirect: bekannte Ebene (bund/kanton/international) → `/gesetze?ebene=…`, unbekannte → `/gesetze` |
| `/gesetze/:ebene/:key` | Gesetzes-Leser | Volltext-Lesesicht eines Erlasses | client-lazy (SPA-Fallback) |
| `/rechtsprechung` | Rechtsprechung-Übersicht | Browsen Gerichtsentscheide | prerendert |
| `/rechtsprechung/:key` | Entscheid-Leser | Volltext-Lesesicht eines Entscheids | client-lazy |
| `/international` | — | — | Redirect → `/gesetze?ebene=international` (+ Anker-Abbildung der 5 Sach-Anker) |
| `/materialien` | Materialien-Übersicht | Amtliche Ressourcen nach Behörde | prerendert |
| `/materialien/deckung` | Materialien-Deckung | «Was wir nicht haben» | steht bewusst VOR `/materialien/:key`, damit sie den Schlüssel nicht verschattet |
| `/materialien/:key` | Material-Leser | Metadaten-/Live-Link-Seite | — |
| `/methodik` | Methodik | Wie LexMetrik rechnet (Prosa) | statisch |
| `/ueber` | Über | Entstehungsgeschichte, Grundsätze | statisch |
| `/kontakt` | Kontakt | Kontaktformular (mailto) | statisch |
| `/datenschutz` | Datenschutzerklärung | Rechtstext, Status «Entwurf» | statisch |
| `/einstellungen` | Einstellungen | Nutzer-Defaults | statisch |
| `/abdeckung` | Abdeckung | «Was ist durchsuchbar» | statisch |
| `/suche` | Volltext-Suchseite | Ungekappte Trefferliste zu `?q=` | prerendert (Shell), Treffer client-seitig |
| `*` | NotFound (404) | Fehlseite mit 3 Wegen | eigener `<title>`/`noindex`, kein Sitemap-Eintrag |

Nicht im Katalog, aber real existierende Seiten: `/rechner/fristenspiegel`,
`/rechner/:slug`-Stub, `/international`-Redirect, `/materialien/deckung` — bewusst
ausserhalb des Routen-Manifests deklariert.

> ⚠ **Widerspruch W1.** Der Rohabschnitt «Rahmen» nannte 25 feste Vorlagen-Pfade,
> der Rohabschnitt «Vorlagen» nannte 30. **Schiedsspruch am Code:**
> `src/routesManifest.ts` führt **30** eindeutige `/vorlagen/<slug>`-Pfade
> (gemessen 22.9.2026). Der Wert 25 ist überholt.

**Quelle:** `src/App.tsx`, `src/RouteSwitch.tsx`, `src/routesManifest.ts`.

### 1.2 Startseite («Pult»)

**Zweck.** Einstieg der App: Begrüssung, Übersicht über die vier Rubriken, zuletzt
Besuchtes, darunter fünf ein-/ausblendbare, umsortierbare Inhaltsmodule.
Referenzbild `abnahme/design-identitaet/pult-freigegeben.html`, von David am
6.9.2026 freigegeben, seither mehrfach nachgezogen (zuletzt 7.9.2026).

**Elemente** (Leserichtung, feste Ebenen zuerst):

1. **Begrüssung** — grosse Überschrift mit tageszeitabhängigem Gruss («Guten Morgen»
   o. ä., aus einem client-seitig gewählten Wortpool), darunter kleiner: Wochentag,
   Datum, Uhrzeit (minütlich nachgeführt). **Keine eigene Suchleiste auf `/`** — die
   einzige Suche der App ist die Kopf-Suche im Titelblatt (1.4).
2. **Rubrik-Kacheln** (seit W2·29-KATALOGE K7, Entscheid David 22.9.2026) — vier
   `ui/RubrikKachel` in einem Navigationsblock mit der Beschriftung «Bereiche der
   Sammlung»: **Gesetze · Rechtsprechung · Materialien · Werkzeuge** (Rechner und
   Vorlagen zusammen, Ziel `/rechner`). Jede Kachel: Registerfläche mit Strich oben,
   eine **gemessene** Zahl aus `STARTSEITE_ZAEHLER` (build-generiert, nie hartcodiert;
   Werkzeuge = Rechner + Vorlagen), Einheit-Beschriftung, Name, erklärender Satz;
   Gesetze und Werkzeuge zusätzlich die Aufschlüsselung («203 Bundeserlasse · 1'339
   Kantonserlasse · 28 Staatsverträge», «23 Rechner · 26 Vorlagen», Stand 21.9.2026).
   Die ganze Kachel ist der eine Link (kein Link im Link).
3. **Zuletzt geöffnet** — Zeile mit Etikett «Zuletzt» und bis zu einigen Links
   (Registerstrich + Titel) auf zuletzt besuchte Inhaltsrouten. Leer, solange kein
   Verlauf existiert — kein Etikett ohne Inhalt.
4. **Fünf Module** (1.2.2), je in einer Modul-Zeile: 3-px-Registerstrich +
   Modul-Titel links, Schalter «Anzeigen»/«Ausblenden» rechts, Inhalt darunter.
   Zugeklappt bleibt der Inhalt im DOM (nur versteckt).
5. **Abschluss-Zeile** — links der Korpus-Stand (Datum des letzten Registerbaus),
   rechts der Textknopf «Startseite anpassen» → öffnet ein Bottom-Sheet (1.2.3).
6. **Vertrauens-Fuss** — zwei Spalten Feinschrift: Anti-KI-Satz + Status-Satz und
   ein Rechtlicher-Hinweis-Absatz («keine Rechtsberatung»).

**Eingaben & Interaktionen.** Klick auf Modul-Schalter (an/aus), Klick bzw.
Pfeiltasten im Anpassen-Blatt, `Esc` oder Klick auf den Scrim schliesst das Blatt,
Klick auf jeden Link navigiert. Keine eigenen Tastenkürzel für die Startseite
(⌘K und `/` fokussieren die globale Kopf-Suche, 1.4).

**Zustände.**

- **Lädt:** Entscheide-Modul zeigt eine höhenreservierte leere Fläche, bis das
  Manifest geladen ist (kein Sprung).
- **Leer:** «Zuletzt»-Zeile rendert nichts (kein leeres Etikett); das Entscheide-Modul
  kollabiert bei leerem Register vollständig.
- **Gespeichert/verändert:** Weichen Modul-Reihenfolge oder An/Aus-Zustand von der
  Werkseinstellung ab, wird die «Werkseinstellung»-Zeile im Blatt zum aktiven
  Rücksetz-Knopf.
- **Mobil vs. Desktop:** Rubrik-Kacheln 2 → 4 Spalten (390/1024 px),
  Kantone-Raster 3 → 6 → 9 Spalten, Modul-Kopfspalte erst ab dem grossen
  Breakpoint zweispaltig (13 rem + Inhalt), darunter gestapelt.
- **Server/Prerender:** Der Build hat kein `localStorage` — ausgeliefert wird immer
  die Werkseinstellung; der Client liest beim ersten Render synchron nach und zieht
  Attribute nach der Hydration nach.

**Persistenz.** `localStorage['lexmetrik-startseite']` — JSON `{reihenfolge: string[],
an: string[]}` (nur Modul-Kürzel, nie Formularinhalte). Fällt `localStorage` aus
(privater Modus, Quota), lebt die Wahl nur noch im Arbeitsspeicher der Sitzung
weiter — kein Absturz, kein wirkungsloser Schalter. Abgleich zwischen Browser-Tabs
über das `storage`-Ereignis plus ein eigenes App-Ereignis.

**Quelle:** `src/pages/Startseite.tsx`, `src/lib/startseiteModule.tsx`,
`src/lib/startseiteModulTypen.ts`, `src/lib/startseiteEinstellung.ts`,
`src/components/ui/RubrikKachel.tsx`, `src/components/start/{SuchBlock,ZuletztVerwendet,PultModul,PultAbschluss,VertrauensFuss,SystematikListe,KantoneRaster,EntscheideListe,MaterialienListe,Werkzeuge}.tsx`,
`src/lib/zuletztVerwendet.ts`, `src/components/ZuletztTracker.tsx`,
`src/lib/verlaufGruppen.ts`, `src/data/startseiteZaehler.generated.ts`.

#### 1.2.1 Begrüssungs-Mechanik

Der Server liefert einen Build-Zeit-Gruss; ein Inline-Skript (SSR-sicher, vor der
Hydration) tauscht ihn client-seitig gegen einen zur Besuchsstunde passenden Gruss
aus einem Wortpool. Die Uhrzeit ist vor der Hydration leer, ihr Platz wird per
`visibility:hidden` reserviert — kein Layout-Sprung.

**Quelle:** `src/components/start/Begruessung.tsx`.

#### 1.2.2 Die fünf Module

Feste Werks-Reihenfolge:

| Kürzel | Titel (wörtlich) | Register | Werkseinstellung |
|---|---|---|---|
| `systematik` | «Bundesrecht, systematische Ordnung» | g (Gesetze) | offen |
| `kantone` | «Kantone, erfasste Erlasse» | g (Gesetze) | zu |
| `frist` | «Frist berechnen» | w (Werkzeuge) | offen |
| `entscheide` | «Jüngste Entscheide im Korpus» | r (Rechtsprechung) | offen |
| `behoerden` | «Amtliche Materialien nach Behörde» | m (Materialien) | zu |

Modul-Inhalte im Detail:

- **Bundesrecht, systematische Ordnung** — zweispaltige Liste der
  Bund-Systematikkategorien: Nummer, Titel als Link auf `/gesetze?ebene=bund#sys-<id>`,
  bis zu vier Erlass-Kürzel als eigene Links, Anzahl Volltext-Erlasse rechts.
- **Kantone, erfasste Erlasse** — Raster aller 26 Kantone (3/6/9 Spalten responsiv),
  je Kürzel + Zahl erfasster Erlasse, punktierte Linie; die Vorlesehilfe nennt
  zusätzlich das Zustands-Wort («erfasst» / «Auswahl» / «dünn»).
- **Frist berechnen** — hostet das **echte** Fristformular in der Zeilen-Variante
  (derselbe Schnellrechner wie auf `/rechner/tagerechner`, siehe 4.4 Block 13),
  darunter Fliesstext mit Links zu Tagerechner, Prozesskosten, Zuständigkeit, allen
  Rechnern, Arbeitsvertrag, allen Vorlagen.
- **Jüngste Entscheide im Korpus** — bis zu 6 jüngste Bundesgerichtsentscheide, lazy
  nachgeladen **nur wenn das Modul offen ist**, nach Datum gruppiert (Datum einmal je
  Gruppe), je Zeile Zitierung (Link), Gebiet, Leitentscheid-Badge, Regeste oder
  angewandte Normen. Fuss verlinkt «alle Entscheide».
- **Amtliche Materialien nach Behörde** — Raster der Behörden mit Kürzel + Zahl,
  Link «Alle Behörden →».

#### 1.2.3 Blatt «Startseite anpassen»

Bottom-Sheet im gleichen Rahmen wie die Leser- und Rechtsprechungs-Filter. Zeigt alle
5 Module mit Ankreuzfeld (an/aus) und zwei Pfeil-Knöpfen (↑/↓, am Rand deaktiviert)
zum Umsortieren — **bewusst kein Drag & Drop** (Vorgabe David 6.9.2026: Tastatur-
und Screenreader-Parität ohne zweite Mechanik). Zeigt «Werkseinstellung» als Label,
solange die Werkseinstellung gilt, sonst als Rücksetz-Knopf; dieser **löscht** den
Speicher-Eintrag, statt ihn zu überschreiben — damit künftige Werksänderungen
automatisch greifen.

**Quelle:** `src/components/start/PultAbschluss.tsx`.

### 1.3 Layout und Rahmen

**Grundstruktur.** Desktop: links eine persistente, klebende, ziehbare Seitenleiste
(208–460 px), rechts eine Spalte mit Titelblatt (klebend, genau 4 rem/64 px hoch) →
Arbeitsleiste (Reiterleiste) → Ausgabe-Zeile (Korpus-Stand) → optionaler
Nicht-Deutsch-Hinweis → Einzelansicht-Kopf (Brotkrumen, nur auf Inhaltsrouten ohne
geteilte Ansicht) → Inhalt → Fusszeile. Mobil: kein Seitenleisten-Sockel, stattdessen
eine Schublade von der Seite (☰-Knopf, an den Dokumentkörper portiert, mit Fokusfalle,
Escape-Schluss und Fokus-Rückgabe).

**Geteilte Ansicht / mehrere Fenster** (ab dem grossen Breakpoint): Es lassen sich bis
zu einer festen Höchstzahl zusätzliche «Fenster» (Panes) nebeneinander öffnen — über
⧉ «daneben öffnen» im Reiter-Kontextmenü, per Ziehen eines Reiters in die rechte
Hälfte, oder mit `Alt+Enter` aus der Suche. Jedes Fenster hat eigenen Bildlauf, einen
eigenen Kopf (Brotkrumen, ⧉-Teilen-Knopf mit Kopier-Quittung, ✕) und ziehbare
Breiten-Griffe dazwischen; `F6`/`Shift+F6` springt zyklisch zwischen den Fenstern. Auf
Mobil und Tablet wird daraus ein horizontales Wisch-/Schnapp-Falten statt eines
Nebeneinanders.

**Ein- und Ausklappen der Seitenleiste.** Knopf im Titelblatt (mit gedrücktem
Zustand), Ziehgriff am rechten Rand (Maus, Touch **und** Tastatur `←`/`→`, als
Trenner ausgezeichnet). Breite und Eingeklappt-Zustand in `localStorage`
(`lexmetrik-seitenleiste-breite`, `lexmetrik-seitenleiste-eingeklappt.v2`).

**Titelblatt (Topbar)**, klebend, exakt 4 rem hoch — diese Höhe ist in der
Leser-Geometrie fest verdrahtet für Sprungziele, darum bewusst nicht gewachsen:
mobil ☰-Menü-Knopf · Desktop Seitenleisten-Schalter · Marke (Siegel immer, Wortmarke
ab dem kleinen Breakpoint, unter 480 px ganz weg — dann nur in der Schublade) ·
Kopf-Suche (1.4) · rechts: Verlauf-Übersicht (🕐-Knopf, ausgeblendet unter 480 px),
Thema-Umschalter (☀/☾/◐), Sprach-Umschalter (DE/EN/FR/IT). Darunter: Arbeitsleiste
(offene Reiter, 1.3.2) und Ausgabe-Zeile (Korpus-Stand, ab dem kleinen Breakpoint,
nicht im Druck).

**Quelle:** `src/components/layout/Shell.tsx`, `Topbar.tsx`, `Sidebar.tsx`,
`Reiterleiste.tsx`, `Footer.tsx`, `bereiche.ts`, `src/lib/navigation.ts`.

#### 1.3.1 Seitenleiste

Datengetrieben aus einer einzigen Quelle für Desktop-Leiste **und** mobile Schublade.
Aufbau:

- Kopf: Marke (nur in der Schublade bzw. unter 480 px sichtbar)
- «Start»-Link (Haarlinie darunter)
- Fünf **Abschnitte**, jeder mit eigenem Registerstrich, klickbarer Überschrift
  (führt auf die Übersicht) und eigenem Klapp-Chevron:
  1. **Gesetze** — direkt darunter alle **Kernerlasse** (OR, ZGB, ZPO …) als
     Direktlinks (Kürzel, voller Titel im Tooltip), dann «Alle Bundeserlasse», dann
     die aufklappbare Untergruppe **Kantone** (26, alphabetisch nach Vollname, je mit
     Erlasszahl-Abzeichen und sichtbarem Zustands-Wort «Auswahl»/«dünn»), dann die
     aufklappbare Untergruppe **International** (5 Sach-Rubriken: Menschenrechte ·
     Int. Privat- & Zivilrecht · Rechtshilfe (Haager) · Schweiz–EU · EU-Verordnungen).
  2. **Rechtsprechung** — je Sachgebiet ein Direktlink mit Entscheidzahl, dazu
     «Leitentscheide».
  3. **Materialien** — je Behörde ein Direktlink mit Zahl, dazu «Alle Materialien».
  4. **Rechner** — die 5 meistgebrauchten Rechner (ZPO-Fristen, Prozesskosten,
     Verjährung, Zuständigkeit, Verzugszins) direkt, dazu «Alle Rechner».
  5. **Vorlagen** — fünf aufklappbare Dokument-Gruppen (nach Vorlagen-Art); Ziel der
     Gruppen-Überschrift ist ein Anker auf der Vorlagen-Übersicht.
- Fuss (immer unten): «Einstellungen» (durch Haarlinie abgesetzt), darunter der
  Korpus-Stand.
- **Nicht** in der Leiste (stattdessen in der Fusszeile): Methodik, Über, Kontakt,
  Datenschutz.

**Aktiv-Markierung.** 2-px-Registerfarbstrich links am Eintrag plus
Auszeichnung `aria-current="page"` für Vorleseprogramme (kein sichtbarer Text). Die Übereinstimmungsprüfung ist eng gefasst
(Pfad + Query-Unterscheider + Anker); der spezifischste Eintrag gewinnt — ein
Kernerlass-Link sticht «Alle Bundeserlasse» aus.

**Auf- und Zuklapp-Zustände.** **Abschnitte** starten zugeklappt, ausser demjenigen,
der die aktuelle Route enthält (rekursiv geprüft); eine bewusste Chevron-Wahl wird nur
für die Sitzung gemerkt (`sessionStorage`, Schlüssel
`lexmetrik-sidebar-abschnitt-offen.<titel>`). **Untergruppen** (Kantone,
International, Vorlagen-Gruppen) starten zu, ausser sie enthalten die aktive Route;
ihr Zustand ist rein lokal (kein Speicher), öffnet aber automatisch, wenn die
Navigation in eine zugeklappte, jetzt aktive Gruppe führt. Ein Klick auf eine
Abschnitts-Überschrift klappt zusätzlich alle Untergruppen wieder auf ihren Vorgabe-
Zustand zu.

**Mobiles Verhalten.** Identische Komponente in einer Schublade (☰ im Titelblatt), mit
eigenem Kopf (Marke + Schliessen-✕), Fokusfalle und Escape-Schluss; sie schliesst
automatisch bei jedem Klick auf einen Link.

#### 1.3.2 Arbeitsleiste / Reiterleiste

Browser-Tab-artige Leiste; ersetzt seit 6.9.2026 die frühere ☰-Dropdown-Übersicht.
Zeigt jede besuchte Inhaltsroute als Reiter mit Registerfarben-Strich,
Kurzform-Titel und ✕ zum Schliessen.

- **Persistenz** in `localStorage['lexmetrik-tabs']`, Pfad **inklusive `#anker`** — die
  Lesestellung überlebt einen Neustart.
- Navigation **ersetzt** normalerweise den aktiven Reiter, statt einen neuen
  anzuhängen (kein «Reiter-Wildwuchs»); `Ctrl/⌘+Enter` bzw. ein Klick mit
  Zusatztaste aus der Suche öffnen stattdessen einen **neuen** Reiter.
- **Umsortieren** per Ziehen oder Tastatur `Alt+Shift+←/→` (kein Umlauf am Rand).
  Reiter dürfen nur innerhalb derselben Gruppe verschoben werden (Kategorie; bei
  Gesetzen zusätzlich gleiche Herkunft Bund/Kanton/International).
- **Überlauf-Blatt** («+N»-Knopf) mit Suche über alle Reiter, gruppiert nach den 6
  Kategorien — Gesetze, Rechtsprechung, Materialien, Vorlagen, Rechner, Weitere
  (Piktogramme § ⚖ ❑ ✎ ∑ ◦) — bei Gesetzen zusätzlich nach Herkunft.
- **Kontextmenü je Reiter** (lazy geladen bei erster Berührung der Leiste, nicht beim
  App-Start): Schliessen (`Alt+W`) · Andere schliessen · Rechts davon schliessen ·
  Nach links/rechts verschieben (`Alt+Shift+←/→`) · Anheften/Loslösen · in Mappe
  übernehmen.
- **Mappen** — benannte, gespeicherte Reiter-Sammlungen; ein Dialog erlaubt
  Speichern, Laden und Löschen. «Übernehmen» **ersetzt** die offenen Reiter durch die
  der Mappe.
- **Weitere Kürzel:** neuer Reiter `Alt+T`; zuletzt geschlossenen wiederherstellen
  `Alt+Shift+T` (auch als Kontextmenü-Eintrag und als «+N»-Zeile bei leerer Leiste);
  zwischen den zwei zuletzt benutzten Reitern pendeln; `Alt+1…9` springt auf den n-ten
  sichtbaren Reiter; `Alt+PageUp/PageDown` blättert umlaufend. Eine Hover-Karte
  (verzögert, 600 ms) zeigt Details zum Reiter. Bewusst `Alt+…` statt `Ctrl/⌘+…`, weil
  der Browser Letzteres für seine eigenen Tabs abfängt.
- Reiter eines zweiten Fensters (geteilte Ansicht) sind in der Leiste markiert
  («Fenster links» / «Fenster rechts»).

**Quelle:** `src/components/layout/Reiterleiste.tsx`, `TabPanel.tsx`,
`ReiterMenue.tsx`, `src/lib/tabs.ts`, `src/lib/mappen.ts`, `src/lib/tabGruppen.ts`.

#### 1.3.3 Fusszeile

Auf jeder Route ohne geteilte Ansicht, unten; drei Spalten:

- Marke + Kurzbeschrieb der Sammlung
- Navigation: Rechner · Vorlagen · Methodik · «Über LexMetrik» · Kontakt ·
  «Datenschutzerklärung»
- Hinweise: drei Sätze — keine Rechtsberatung · Fedlex-Link · Datenverbleib

Darunter eine Feinschrift-Zeile: «© 2026 LexMetrik» · «Orientierungsrechner · keine
Rechtsberatung · läuft vollständig im Browser».

### 1.4 Suche

Es gibt **eine** Such-Engine mit **zwei** Oberflächen.

#### 1.4.1 Kopf-Suche (Titelblatt, auf jeder Route identisch)

**Zweck.** Der eine Sucheinstieg der App. Bis 6.9.2026 hatte die Startseite eine
eigene grosse Suche — die ist ersatzlos entfallen.

**Elemente.** Ein Kombinationsfeld mit dem Platzhalter
**«Suchen · «OR 257d» springt zum Artikel»**. Es öffnet ein Aufklapp-Feld direkt unter
dem Feld (nicht an `?q=` gekoppelt), sobald das Feld den Fokus erhält — auch leer,
dann mit Leerzustand aus Verlauf und kuratierten Einstiegen. Entprellung rund 120 ms.
Unter 480 px klappt das Feld zu einer Lupe zusammen; ein Tipp darauf öffnet einen
Vollbreiten-Fokusmodus, die Nachbarn weichen, ✕ schliesst.

#### 1.4.2 Suchseite `/suche`

**Zweck.** Dieselbe Engine ungekappt: bis zu 500 Treffer je Gruppe statt 6, mit
Inhaltstyp-Facette (Chips «Alle» plus je vorhandener Gruppe mit Zähler) und
Deep-Link `?q=`. Macht die im Aufklapp-Feld gekappten Treffer erreichbar — die
«alle N →»-Links aus dem Aufklapp-Feld führen hierher.

#### 1.4.3 Was durchsucht wird

Feste Reihenfolge nach Relevanz — Rechtsinhalte vor Werkzeugen:

1. **Norm-Sprung** («Sprung», z. B. «OR 257d») — deterministischer Direktsprung zum
   Artikel, wenn die Eingabe eindeutig eine Norm ist.
2. **Entscheid-Sprung** — BGE-Zitat-Erkennung («BGE 152 I 65»). Im Bestand:
   Direktlink. Nicht im Bestand: ehrlicher Hinweis plus externer Link zur
   Bundesgerichts-Suche.
3. **Gesetze** — Erlass-Titel und -Kürzel aus dem Browse-Manifest, mit Entdopplung
   gleichlautender kantonaler Gemeinde-Sammlungs-Dubletten.
4. **Gesetzestext** (Artikel-Volltext) — Volltext-Index, **Bund-only seit 1.9.2026**;
   kantonaler Volltext nur über die Online-Suche-Gruppe. Hinweiszeilen, wenn Ebenen
   noch laden oder dauerhaft fehlen.
5. **Rechtsprechung** — Entscheid-Zitierung und Metadaten.
6. **Materialien** — Behörden-Publikationen.
7. **Rechner & Vorlagen** (Katalog).
8. **Fristen-Vorlagen** (Presets im Tagerechner).
9. **Online-Suche** (Edge-Dienst) — wird **hinter** die statischen Gruppen gehängt,
   nicht Teil des synchronen Aggregators.

Jede Gruppe kann in drei Zuständen stehen: **lädt** (Platzhalter) · **teilweise**
(schon Treffer, Menge wächst noch — etwa während der Artikel-Index gestaffelt
aufgebaut wird) · **eingeschränkt** (dauerhafte Lücke, etwa kantonaler Volltext nur
online) — je mit eigenem erklärendem Satz. Das ist das Ehrlichkeits-Prinzip:
Lücken werden benannt, nie stillschweigend als «nichts gefunden» verkauft.

**Tastatur.** `/` und `⌘K`/`Ctrl+K` fokussieren die Kopf-Suche von überall (`/` nicht
aus Eingabefeldern heraus) · `↑`/`↓` wählt Treffer bzw. Leerzustand-Optionen ·
`Enter` öffnet den gewählten oder obersten Treffer · `Ctrl/⌘+Enter` öffnet in neuem
Reiter · `Alt+Enter` öffnet daneben (zweites Fenster, nur wenn geteilte Ansicht
möglich) · `Esc` leert und schliesst. Vollständige Kürzel-Tabelle: 6.9.

**Leerzustand** (kein Suchtext, Feld fokussiert bzw. per `⌘K` geöffnet): zeigt den
Verlauf (bis zu 5 Einträge) plus kuratierte Einstiege.

**Persistenz.** Kopf-Suche: keine (Aufklapp-Feld ist flüchtig, der Verlauf kommt aus
dem «Zuletzt»-Speicher). Suchseite: `?q=` in der URL, teilbar.

**Quelle:** `src/pages/Suche.tsx`, `src/lib/universalSuche.ts`,
`src/components/layout/HeaderSuche.tsx`,
`src/components/suche/{SuchResultate,SucheLeerzustand}.tsx`,
`src/components/suche/{useUniversalSuche,trefferAuswahl,fruehesSuchKuerzel,useSucheAusUrl}.ts`,
`src/lib/suche/{artikelRanking,bgeQuery,hervorhebung,normQuery,onlineVolltext,vokabular,vorschlag}.ts`.

### 1.5 Statische Seiten

#### `/methodik` — Methodik

**Zweck.** Erklärt die Prinzipien: «Deterministisch gerechnet» · «Jeder Schritt liegt
offen» · «Strittige Fragen offengelegt» · «Geprüft oder In Vorbereitung» · «Wie
Vorlagen entstehen» · «Daten bleiben bei Ihnen».
**Elemente.** Sechs Prosa-Abschnitte, eine Verfall-Übersicht als Kachelliste, ein
Grenzen-Hinweiskasten.
**Zustände.** Reiner Prerender-Inhalt, keine Interaktion.
**Quelle:** `src/pages/Methodik.tsx`.

#### `/ueber` — Über

**Zweck.** Entstehungsgeschichte (Anwaltsprüfung Basel-Stadt), was LexMetrik ist,
wonach gebaut wurde, Signatur David Graf mit LinkedIn-Link.
**Elemente.** Fliesstext, zwei Listen, interne Links (Abdeckung, Methodik, Kontakt).
**Quelle:** `src/pages/Ueber.tsx`.

#### `/kontakt` — Kontakt

**Zweck.** Kontaktaufnahme ohne Backend.
**Elemente.** Formular in einer Karte: Name (optional) · E-Mail · Betreff (optional) ·
Nachricht · Einwilligungs-Ankreuzfeld. «Nachricht senden» öffnet einen
`mailto:`-Link; ein «Kopieren»-Knopf legt den zusammengesetzten Text in die
Zwischenablage.
**Zustände.** Fehleranzeige erst nach erster Berührung des Formulars. Ist kein
Empfänger konfiguriert: Warnhinweis, Senden-Knopf deaktiviert.
**Quelle:** `src/pages/Kontakt.tsx`.

#### `/datenschutz` — Datenschutzerklärung

**Zweck.** DSG-Erklärung, Status «Entwurf», Stand 5.6.2026.
**Elemente.** 8 Abschnitte: Verantwortliche Stelle · Browser-Verarbeitung · kein
Tracking · Hosting/Vercel · Kontaktaufnahme · externe Links · Rechte · Änderungen.
Platzhalter `[…]` für noch fehlende Angaben (verantwortliche Person, Vercel-AVV) sind
**absichtlich sichtbar**.
**Zustände.** Badge «Entwurf».
**Quelle:** `src/pages/Datenschutz.tsx`.

#### `/abdeckung` — Abdeckung

**Zweck.** «Was ist durchsuchbar».
**Elemente.** Je Bestand eine Zeile (Gesetze · Rechtsprechung · Materialien) mit
Zahlen aus dem generierten Zähler `STARTSEITE_ZAEHLER` — derselben Quelle wie
Startseite und Übersichten (seit K5, 23.9.2026; vorher live aus drei Manifesten mit
eigener Regel): Erlasse im Volltext (Bundesrecht, Staatsverträge, Kantone), Entscheide
im Volltext, davon BGE, dazu getrennt die Verweis-Einträge (vollständiges Urteil zu
einem BGE), Materialien; eine abgesetzte Zeile «Grenzen der Suche». Abschnitt
«Gesetze» mit dem Hinweis, dass der Volltext-Artikelindex seit 1.9.2026 wieder
Bund-only ist (kantonale Artikel kommen vom Suchdienst).
**Zustände.** Keine Ladezustände — die Zahlen stehen beim Bau fest.
**Quelle:** `src/pages/Abdeckung.tsx`.

#### 404 — Seite nicht gefunden

Gemeinsamer Baustein «Fehlseite» (6.1) mit drei Wegen: Katalog · Methodik · Kontakt.
Eigener Seitentitel «Seite nicht gefunden — LexMetrik» plus `noindex`; räumt den
Dokumentkopf beim Verlassen wieder auf.
**Quelle:** `src/pages/NotFound.tsx`.

#### Redirect-Seiten

| Seite | Zweck | Verhalten |
|---|---|---|
| `/international` | Link-Erbe der aufgelösten International-Seite | Ersetzender Sprung auf `/gesetze?ebene=international`; bildet 5 alte Anker auf dieselben IDs der Säule ab; client-seitiges Pendant zum Server-308 |
| `/rechner/fristenspiegel` | Link-Erbe des aufgelösten Fristenspiegels | Liest `?ev=` (z. B. `zivilentscheid`, `zahlungsbefehl`, `agkuendigung`, `vermieterkuendigung`) und leitet mit oder ohne Query auf den passenden Fach-Rechner; Rückfall `/rechner/tagerechner` |
| `/rechner/:slug` (Stub) | Platzhalter für nicht implementierte Rechner | Rechner-Kopf + Badge «In Vorbereitung» + Erklärsatz + Zurück-Link; unbekannter Slug → 404 |

### 1.6 Einstellungen

**Zweck.** Ein Ort für alle Nutzer-Vorgaben der App — teils mit eigenem Speicher,
teils «gebrückt» in bereits bestehende Speicher (Thema, Vorlagen-Schriftbild,
Rechtsprechungs-Ansicht), um keine zweite Wahrheit zu führen.

**Elemente** (5 Gruppen, ab 1100 px zweispaltig):

1. **Standard-Kanton** (Auswahlliste, alle 26 Kantone) + **Profil** (Name, Adresse —
   füllt die Absenderfelder der Vorlagen vor).
2. **Schriftgrösse — ganze Seite** (A−/A+-Regler, wirkt sofort global; der
   Gesetzestext-Leser hat zusätzlich einen eigenen Regler in seinem Menü «Ansicht»)
   + **Farbschema** (Segment Hell / Dunkel / Automatisch).
3. **Vorlagen — Detailgrad** (Einfach / Standard / Experte) + **Vorlagen —
   Schriftbild** (Modern / Nüchtern).
4. **Rechtsprechung — Trefferliste** (Liste / Karten) + **Rechtsprechung —
   Lesegrösse** (Klein / Normal / Gross / Sehr gross).
5. **Zurücksetzen** — löscht nach Bestätigungsdialog **alle** `localStorage`-Einträge
   mit den Präfixen `lexmetrik`, `rsp:`, `rsp-` (Einstellungen, Reiter, Favoriten,
   Vorlagen-Entwürfe, Zeiterfassung) und lädt die Seite neu.

**Sprache.** Vier Sprachen: Deutsch (aktiv), English / Français / Italiano («in
Bearbeitung» — der Umschalter funktioniert, **alle** Inhalte fallen auf Deutsch
zurück, keine maschinelle Übersetzung). Der Umschalter sitzt im Titelblatt
(Aufklappliste mit Radiopunkt-Optik, kein Menü-Muster). Bei Nicht-Deutsch zeigt der
Rahmen einen dauerhaften Balken: «Diese Sprachfassung ist in Bearbeitung … Inhalte
werden vorerst auf Deutsch angezeigt», mit Knopf «Zu Deutsch wechseln».
Fedlex-Links werden bei fr/it auf die jeweilige amtliche Sprachfassung umgeschrieben;
bei en bleibt es Deutsch (es gibt keine amtliche englische Fassung).

**Farbschema.** Dreier-Zyklus Hell → Dunkel → Automatisch über den Knopf im
Titelblatt (☀/☾/◐). «Automatisch» folgt der Systemeinstellung live. Vor der ersten
ausdrücklichen Wahl folgt die App ebenfalls dem System (kein zeitbasierter Default
mehr, Entscheid David 8.8.2026).

**Persistenz** — alles `localStorage`, nichts wird an einen Server gesendet:

- `lexmetrik.einstellungen.v1` — Standard-Kanton, Profil, Vorlagen-Detailgrad
- `lexmetrik.locale` — Sprachwahl
- `rsp:dichte`, `rsp-fs-idx` — Rechtsprechungs-Trefferliste und -Lesegrösse (direkt
  aus der Einstellungen-Seite geschrieben, ohne eigenen Speicher-Baustein)
- Thema und Vorlagen-Schriftbild in eigenen Speichern
- Schriftskala in einem eigenen Hook

**Quelle:** `src/pages/Einstellungen.tsx`, `src/lib/einstellungen.ts`,
`src/components/locale.tsx`, `src/components/SprachUmschalter.tsx`,
`src/components/layout/ThemaUmschalter.tsx`, `src/components/thema.ts`,
`src/components/vorlagen/ausgabeStil.ts`, `src/components/layout/useSchriftskala.ts`.

### 1.7 Querschnitt des Rahmens

| Baustein | Verhalten | Quelle |
|---|---|---|
| Seiten-Metadaten | Führt Titel, Beschreibung, Social-Tags und den kanonischen Link bei Client-Navigation nach (der Prerender liefert sie initial). Stub, 404 und Redirects liefern nichts — der Dokumentkopf bleibt unverändert; die 404 setzt ihren Kopf selbst. | `src/components/RouteMeta.tsx`, `src/lib/seo.ts` |
| Fehler-Auffangnetz | Fängt Render-Fehler ab, zeigt «Diese Ansicht konnte nicht angezeigt werden» mit technischer Meldung, Knopf «Seite neu laden» und optional «Fehler melden» (`mailto:`, nur wenn ein Empfänger konfiguriert ist). **Kein** automatisches Neuladen aus dem Auffangnetz heraus — bewusst, wegen möglicher Endlosschleife bei deterministischen Fehlern. Volltexte: 6.4. | `src/components/ErrorBoundary.tsx` |
| Lazy-Wiederholung | Kapselt jeden lazy geladenen Seitenimport mit bis zu 3 Wiederholungen (250/500/750 ms) und — bei anhaltendem Scheitern, typischerweise ein veralteter Chunk nach einem Deploy — **genau einem** automatischen Neuladen, gegen Endlosschleife per Sitzungs-Flag abgesichert. | `src/lazyRetry.ts` |
| Permalink / Live-URL | Der Rechenzustand eines Rechners wird schon bei jeder Eingabe entprellt (400 ms) in die Adresse geschrieben, **ohne** Verlaufseintrag — und **nicht** beim Scrollen (ausdrücklicher Entscheid gegen Scroll-Anker-Abgleich). Der Teilen-Knopf schreibt zusätzlich sofort und kopiert den vollen Link. | `src/lib/permalink.ts`, `src/lib/liveUrlSync.ts`, `src/components/LinkTeilenButton.tsx` |
| Kopier-Hook | App-weiter Kanon: 1600 ms Quittungsdauer; Erfolg wird erst **nach** erfolgreichem Schreiben in die Zwischenablage angezeigt, nie optimistisch. Detail: 6.4. | `src/components/useKopieren.ts` |
| Pflicht-Disclaimer | Aufklappbarer Block «Rechtlicher Hinweis – keine Rechtsberatung» auf jeder Rechnerseite, mit optionalem rechtsgebietsspezifischem Kurztext und Standard-Fliesstext. Wortlaut: 6.4. | `src/components/PflichtDisclaimer.tsx` |

---

## 2 Gesetze — Korpus und Leser

### 2.1 Datenbestand

| Ebene | Einträge im Register | davon Volltext | Bemerkung |
|---|---:|---:|---|
| Bund (`ebene: bund`) | 241 | 231 | Gesetze und Verordnungen, SR-Systematik; die 231 schliessen die 28 Volltext-Staatsverträge ein |
| davon Rechtsgebiet «international» | 37 | 28 | alle mit `ebene: bund`; 8 nur Live-Link, 1 eingebettetes PDF |
| Kantone (26) | 1'339 | 1'339 | siehe Kantons-Tabelle |
| **Total** | **1'580** | **1'570** | `public/normtext/bund` 38 MB, `public/normtext/kanton` 45 MB |

Statusverteilung über das ganze Register: `snapshot` 1'570 · `nur-live-link` 9 ·
`pdf-embed` 1 (NYUE, New Yorker Übereinkommen).
Sprachen: `de` 1'578 · `fr` 2 (`FR-130.11-fr` «Règlement sur la justice»,
`VS-173.8-fr`) — jeweils als **eigener Registereintrag neben der deutschen Fassung**.
Rechtsgebiete register-weit: `oeffentlich` 1'446 · `international` 37 · `privat` 31 ·
`sozialversicherung` 29 · `prozess` 12 · `straf` 11 · `steuern` 9 · `schkg` 5.

> ⚠ **Widerspruch W2.** Der Rohabschnitt «Gesetze» rechnete «Bund 231 = 241 minus 10
> international-mit-`ebene=bund`». **Schiedsspruch durch Messung am Register**
> (22.9.2026): es gibt 37 international-Einträge, **alle** mit `ebene: bund`; davon
> 28 mit Volltext-Snapshot. 203 nicht-internationale Bund-Snapshots + 28
> internationale = **231**. Die 231 des Startseiten-Zählers enthalten die 28 also
> bereits. Die Ausgabe-Zeile der Gesetzes-Übersicht («231 Bundeserlasse · 1'339
> Kantonserlasse · 28 Staatsverträge im Volltext») zählt die 28 damit **doppelt**.
> Für den Nachbau: Zahlen so übernehmen wie sie sind, aber den Befund kennen
> (Nebenfund N14).

**Beispiel-Erlasse Bund** (wörtlich aus dem Register):

| Key | Titel | SR | Artikel | Stand |
|---|---|---|---:|---|
| ZGB | Schweizerisches Zivilgesetzbuch | 210 | 1277 | 2026-07-01 |
| OR | Bundesgesetz betreffend die Ergänzung des Schweizerischen Zivilgesetzbuches (Fünfter Teil: Obligationenrecht) | 220 | 1686 | 2026-01-01 |
| VVG | Bundesgesetz über den Versicherungsvertrag | 221.229.1 | 112 | 2024-01-01 |

**International ohne Volltext im Haus** (`status: nur-live-link`, nur amtlicher Link):
PRHG (SR 221.112.944) · DSGVO (EU 2016/679) · DSA (EU 2022/2065) · DMA (EU 2022/1925) ·
KI_VO (EU 2024/1689, «AI Act»). **Eingebettetes amtliches PDF** (`status: pdf-embed`):
NYUE (New Yorker Übereinkommen über die Anerkennung ausländischer Schiedssprüche).
Vier Kürzel führt die Startseite als Beispiele der Säule: EMRK · CISG · LugÜ · HZÜ.

**Erlasse je Kanton:**

| Kanton | n | Kanton | n | Kanton | n |
|---|---:|---|---:|---|---:|
| BS | 859 | GR | 6 | NW | 4 |
| AR | 266 | JU | 7 | OW | 3 |
| ZH | 111 | LU | 5 | SH | 3 |
| VD | 7 | NE | 4 | SO | 2 |
| VS | 6 | SG | 5 | UR | 1 |
| FR | 6 | BL | 5 | ZG | 4 |
| TI | 5 | BE | 5 | AG | 5 |
| GE | 4 | AI | 4 | GL | 4 |
| SZ | 4 | TG | 4 | | |

Alle 26 Kantone haben mindestens einen Erlass. **Erfassungsgrad-Einstufung:**
Schwelle n ≥ 20 → Stufe «Auswahl», sonst «dünn». Die Stufe «vollständig» ist heute
für **keinen** Kanton belegt — die Beleg-Konstante ist bewusst leer gehalten, weil
kein amtliches Gesamt-N erhoben ist (Prinzip «nie raten»). Wörtliche Zustandswörter:
**vollständig · Auswahl · dünn**.

**Beispiel-Artikeldatensatz** (`public/normtext/bund/OR.json`, Eintrag `bund/OR/art_1`):

```
"artikelLabel": "Art. 1",
"bloecke": [
  { "absatz": "1", "text": "Zum Abschlusse eines Vertrages ist die übereinstimmende
     gegenseitige Willensäusserung der Parteien erforderlich." },
  { "absatz": "2", "text": "Sie kann eine ausdrückliche oder stillschweigende sein." }
],
"stand": "2026-01-01",
"quelleUrl": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_1"
```

Weitere Felder je Erlass im Snapshot: `abgerufen`, `fassungsToken`, `sha`
(Integritäts-Hash je Artikel).

**Weitere Korpus-Dateien** unter `public/normtext/`: `confidence.json` ·
`currency.json` (Aktualitäts- und Fassungsstand je Erlass, Frische-Beweis «geltend
geprüft am … (maschinell)») · `inkrafttreten.json` · `kanton-luecken.json` ·
`kanton-systematik.json` (amtliche Systematik je Kanton) · `struktur/bund` und
`struktur/kanton` (Gliederungs-Sidecars) · `historie/` (Fassungs-Shards je Erlass) ·
`revisionen/` · `pdf/` mit `pdf-index.json` und `pdf-quellen.json` · `bilder/`
(Formel- und Tabellenbilder). Massgebliche Quelle sind laut `daten-manifest.json`
drei generierte Datenbank-Artefakte (`normtext.db`, `rechtsprechung.db`,
`soft-law.db`); die JSON-Dateien unter `public/` sind deterministische Projektionen
daraus.

### 2.2 Gesetzes-Übersicht (`/gesetze`)

**Zweck.** Einstiegspunkt in den gesamten Normtext-Korpus. Der Landeplatz ohne
`?ebene=` zeigt **drei gleichwertige Säulen** (Bund / Kantone / International) statt
eines stillen Bund-Defaults.

**Elemente** (Leserichtung):

1. Seitenkopf mit Titel «Gesetze» und Ausgabe-Zeile «231 Bundeserlasse · 1'339
   Kantonserlasse · 28 Staatsverträge im Volltext» (Zahlen aus dem generierten
   Zähler, Schweizer Tausendertrennzeichen).
2. Filterfeld mit Label «Filtern», Platzhalter «Kürzel, Titel, SR-Nr. …», Feldtyp
   Suche; darunter eine Bereichs-Zeile, die den aktuell wirksamen Suchbereich nennt
   und bei aktiver Säule oder aktivem Kanton den Text-Schalter «auf alle Ebenen
   erweitern» zeigt.
3. **Ebenen-Schalter** — vier Text-Schalter «Alle · Bund · Kantone · International»
   (als Gruppe mit Beschriftung «Ebene», mit gedrücktem Zustand); Unterstrich statt
   Kasten.
4. **Kernerlass-Zeile** — zehn feste Kürzel als Direktlinks: **OR · ZGB · ZPO · STGB ·
   STPO · SCHKG · BV · DBG · VWVG · BGG**. Blendet bei aktivem Filterbegriff aus
   (unsichtbar, aber nicht entfernt — reserviert die Zeilenhöhe gegen Layout-Sprung).
5. **Landeplatz-Inhalt** (ohne Suche, ohne gewählte Ebene): drei Einstiegskacheln
   «Bundesrecht» (Zahl Erlasse + Artikel), «Kantone» (Zahl Kantone +
   Erfassungsgrad-Kurzlegende), «International» (Zahl Erlasse). Darunter eine
   Rechtsgebiets-Übersicht (dichte Spalten je Rechtsgebiet, nur Bund) und ein
   A–Z-/Kürzel-Register als zweiter, alphabetischer Zugang.
6. **Nach Ebenen-Wahl:** der **Gliederungs-Umschalter** mit drei Gliederungen
   «Relevanz · Systematisch · Rechtsgebiet», einheitlich für alle drei Säulen.
   Vorrang: URL `?gliederung=` > `localStorage lm.gesetze.gliederung` > Vorgabe
   `systematisch`.
7. **Bund-Panel:** je nach Gliederung Relevanz-Gitter, Rechtsgebiets-Sicht oder
   Bund-Systematik 01–05 (2.2.1).
8. **Kantone-Panel:** ohne gewählten Kanton die Kantons-Auswahl (Karte/Liste-Umschalter,
   Sortierung); mit gewähltem Kanton (`?kt=XX`) ein Kopf mit Wappen, Name,
   Erfassungszahl + Stufen-Abzeichen, Link «Kantonale Gesetzessammlungen (lexfind) ↗»
   und Link «Was ist durchsuchbar» (→ `/abdeckung`), dann je nach Gliederung
   Relevanz-Liste, Gebiets-Gruppen oder kantonale Systematik.
9. **International-Panel:** Erklärtext, Gliederungs-Umschalter, dann Relevanz-Gitter,
   Rechtsgebiets-Sicht oder die fünf International-Rubriken.
10. **Fusszeile:** «Geltende Fassung mit Stand und amtlichem Live-Link je Erlass;
    massgeblich bleibt stets die amtliche Fassung.»

**Eingaben & Interaktionen.** Freitext-Filter (Kürzel, Titel, SR-Nummer) ·
Ebenen-Wahl · Gliederungs-Wahl · Kanton-Wahl (Klick auf die Wappen-Pille mit
Erlasszahl-Abzeichen) · Karte/Liste-Umschalter der Kantonsübersicht · «Alle
aufklappen/einklappen» in den Systematik-Sichten · Sidebar-Deeplink `#sys-<id>`
öffnet direkt eine Bund-Kategorie.

**Zustände.**

| Zustand | Sichtbarer Text |
|---|---|
| Noch nicht geladen | reservierte Ladefläche «Die Sammlung wird abgerufen …» |
| Ladefehler | Warnhinweis «Die Gesetzessammlung konnte nicht geladen werden.» |
| Leer nach Suche | Leerzustand «Kein Erlass gefunden.» mit Weiterweg «Suche zurücksetzen» |
| Leer im Kanton-Bereich | eigene Abdeckungslücken-Notiz mit Link zu lexfind und `/abdeckung` — statt einer Sackgasse |
| Leerer Gesamtbestand ohne Suche | Leerzustand der Art «Bestand», **ohne** Weiterweg (keine Fehlversprechung) |

**Persistenz.** `?ebene=`, `?kt=`, `?gliederung=`, `?q=` in der URL (teilbar);
Gliederungs-Wahl zusätzlich in `localStorage lm.gesetze.gliederung`. Die
Karte/Liste-Ansicht der Kantonsübersicht lebt nur im Komponenten-Zustand — bewusst
weder URL noch Speicher: «eine Vorliebe, kein teilbarer Ort».

**Quelle:** `src/pages/Gesetze.tsx`, `src/pages/gesetze-teile/*`,
`src/lib/normtext/browse.ts`, `src/lib/normtext/gliederung.ts`,
`src/components/gesetze/kernerlasse.ts`.

#### 2.2.1 Bund-Systematik (01–05)

Fünf Hauptkategorien mit Nummer, je in Untergruppen mit Erlass-Kürzel-Listen. Die
Zahlen sind gezählte Volltext-Erlasse:

| Nr | Kategorie | Erlasse | Beispiel-Kürzel | Beispiel-Untergruppen |
|---|---|---:|---|---|
| 01 | Staats- und Verfassungsrecht | 9 | BV, ParlG, RVOG, RVOV | Verfassung & Bundesorgane |
| 02 | Privatrecht | 33 | ZGB, ZStV, GBV, TGBV | ZGB & Grundbuch · OR & Handelsregister · Immaterialgüter & Wettbewerb · Internationales Privatrecht & weitere Erlasse |
| 03 | Zivilprozess- und Zwangsvollstreckungsrecht | 6 | ZPO, SchKG, GebV SchKG, KOV | ZPO · SchKG-Gruppe |
| 04 | Strafrecht und Strafverfahren | 14 | StGB, StPO, JStPO, JStG | StGB · Strafverfahren · Neben- & Militärstrafrecht |
| 05 | Verwaltungsrecht | 141 | VwVG, VGG, VGKE, VGR | Verwaltungsverfahren & Rechtspflege · Steuern & Abgaben · Sozialversicherung · Migration & Gleichstellung · Raumplanung/Bau/Umwelt · Wirtschaft & Finanzmarkt · Gesundheit & Lebensmittel · Beschaffung/Verkehr/Kommunikation · Arbeit/Bildung/Anwaltsrecht |

Die Kategorien rendern standardmässig **eingeklappt** (Auftrag David 25.6.2026);
ein Schalter «Alle aufklappen/einklappen» steht darüber. Nicht zugeordnete Erlasse
landen unter **«Weitere Erlasse»** — kein Verlust.

**Kantonale Systematik:** je Kanton ein Baum aus dem amtlichen Sachgebiets-Verzeichnis
(Nummer + Name), Beispiel Zürich: «1 Verfassung - Kantonsgebiet - Gemeinden -
Bürgerrecht - PolitischeRechte - Behörden» … «10 Finanzhaushalt - Steuern - Gebühren»
… «11 Raumplanung - Baurecht - Umweltschutz».

**Quelle:** `src/lib/normtext/systematik.ts`,
`src/pages/gesetze-teile/BundSystematik.tsx`, `public/normtext/kanton-systematik.json`.

#### 2.2.2 Rechtsgebiets-Obergruppen

Zwei alternative Gruppierungsmodelle für die 17 Rechtsgebiete des Katalogs — ein
Fünfer- und ein Vierer-Modell. Das Fünfer-Modell: «Zivilprozess & Vollstreckung» ·
«Zivilrecht (materiell)» · «Strafrecht & Strafprozess» · «Öffentliches Recht» ·
«Übergreifend» (immer am Ende). Diese Landkarte ist **nicht** identisch mit der
Bund-Systematik 01–05 oben.

> **Hinweis zum Umbau:** Diese Obergruppen werden von der Seitenleiste **nicht mehr**
> konsumiert (sie zeigt seit der Neugestaltung Kernerlasse, Sachgebiete und Behörden
> direkt). Sie leben heute nur noch in den Rechner- und Vorlagen-Übersichtsseiten
> weiter. Siehe Nebenfund N12.

**Quelle:** `src/lib/rechtsbereichGruppen.ts`, `src/lib/oberkategorien.ts`.

### 2.3 Gesetzes-Leser (`/gesetze/:ebene/:key`)

**Zweck.** Vollständige, amtstreue Darstellung eines Erlasses im Volltext. Leitsatz
des Normtext-Reglements: «gleich fundiert wie Fedlex … aber nützlicher und
praxistauglicher».

**Aufbau** (von oben):

```
Leser-Kopf   klebt · Kürzel · ⚖ · ☰ · Ansicht · Such-Zone
┌ Seitenspalte ─────┬ Zelle ───────────────────────────┐
│ Übersicht (zu)    │ Titelblatt (Kopf + Ingress)      │
│ Gliederung klebt  │ Lesespalte ← KERN                │
└───────────────────┴──────────────────────────────────┘
```

Die aktuelle Fassung heisst intern «Leser V3»; der Vorgänger ist seit 21.8.2026
vollständig abgelöst, es gibt keine zwei Code-Pfade mehr.

**Eingaben & Interaktionen (Überblick).** Freitext-Suche im Erlass · Artikel-Sprung
(«OR 257d» über die globale Kopf-Suche, `⌘K` oder `/`) · Klick auf Einträge des
Inhaltsverzeichnisses · Klick auf Randtitel-Gruppen · Tastatur `j`/`k` (Artikel vor
bzw. zurück) · `←`/`→` (Blättern im Einzelmodus) · `r` (Beiwerk-Blatt öffnen) · Klick
auf Fussnoten-Marker · Klick auf die Rubrik-Griffe der Funktionszeile ·
«Ansicht»-Aufklappliste (Fussnoten und Verweise an/aus) · «⧉ Daneben öffnen»
(geteilte Ansicht) · Gliederung ein-/ausklappen.

**Zustände auf Erlass-Ebene:**

| Zustand | Auslöser | Darstellung |
|---|---|---|
| Laden | Snapshot noch nicht geladen | Lade-Platzhalter, reservierte Höhe |
| Fehler (Key unbekannt) | Key nicht im Register | Gesetzes-Fehlseite — nennt den angefragten Key **wörtlich**, macht Fuzzy-Vorschläge «Meinten Sie …?» und bettet ein Erlass-Suchfeld ein |
| Aktualitätsangabe ausstehend | Erlass geladen, Frische-Daten noch nicht | Kopf-Reservierung ohne Inhalt (gegen Layout-Sprung) |
| Nur eingebettetes PDF | `status: pdf-embed` (z. B. NYUE) | amtliches PDF in der App statt Volltext-HTML |
| Nur Live-Link | `status: nur-live-link` (z. B. DSGVO, DSA, DMA, KI_VO) | Kopf + Übersicht, **kein** Volltext, Verweis auf die amtliche Quelle |
| Adress-Umzug | Alt-Adresse eines Staatsvertrags | ersetzender Sprung auf die kanonische Adresse samt Anker und Query |
| Geladen | Snapshot + Sidecar da | vollständiger Leser |

**Persistenz.** Ansichts-Schalter (Fussnoten, Verweise) in `localStorage
lm.leser.optionen`, vor dem ersten Zeichnen angewandt (kein Flackern) · Leseposition
und «Weiterlesen»-Chip · Schriftgrössen-Stufe (100/108/118/130 %) · die URL trägt
Erlass, Anker `#art-<token>`, Suchbegriff und den Zustand der geteilten Ansicht.

**Quelle:** `src/pages/GesetzLeser.tsx`, `src/pages/gesetz-leser/v3/LeserRahmenV3.tsx`,
`src/pages/gesetz-leser/**`, `src/components/normtext/*`, `src/lib/normtext/*`,
`DESIGN-REGLEMENT.md` §N. Der Leser lädt Snapshot
(`public/normtext/{bund,kanton}/<KEY>.json`), Struktur-Sidecar, Historie-Shard,
Bezüge-Shards (Entscheide, Materialien) und `currency.json` asynchron nach.

#### 2.3.1 Gliederung (Inhaltsverzeichnis)

Baumstruktur aus dem Struktur-Sidecar. Verhalten laut Normtext-Reglement §4:
**lückenlos** — zeigt alle Randtitel einer Ebene, auch Blatt-Knoten ohne Unterknoten,
damit keine löchrige Buchstabenfolge «B, C, E» entsteht. Ein Scroll-Beobachter
markiert die aktive Sektion; ein Klick springt zum Artikel. Auf- und Zuklapp-Zustand
je Knoten wird gehalten.

Ab 1024 px steht die Gliederung als **zweite Spalte**, darunter als **Bottom-Sheet**
hinter dem «☰»-Griff im klebenden Kopf — inklusive eigenem Such-/Sprungfeld, weil der
Fokus den Dialog nicht verlassen darf. Ein Griff «‹ Gliederung ausblenden» bzw.
«einblenden» steht im linken Streifen der Kopfzeile, sobald die Spalte steht.

Keine vertikale Führungslinie mehr (aufgehoben 16.8.2026) und kein Tiefen-Einzug mehr
(aufgehoben 29.8.2026) — die Tiefe trägt ausschliesslich die Typografie.

**Quelle:** `src/pages/gesetz-leser/parts/SektionBaumTOC.tsx`,
`gliederungsArtikel.ts`, `gliederungsModell.ts`, `gliederungsTypen.ts`,
`GliederungSheet.tsx`, `LeserKopf.tsx`, `klappKarte.ts`.

#### 2.3.2 Artikelansicht

Je Snapshot-Eintrag zweispaltig: **links** «Art. N» als ruhiger Anker, darunter die
Randtitel — aber nur die gegenüber dem Vorartikel **geänderten** Stufen; **rechts**
der Bestimmungstext in der Serifenschrift. Absätze und Ziffern erscheinen als
hängender Einzug (amtliche Absatz-Auszeichnung, unabhängig vom aufgehobenen
Tiefen-Einzug). Tabellen sind eine dumme Projektion aus der Spaltenzahl, ausgerichtet
nach Spaltentyp. Formelbilder zeigen die amtlichen Bilder **unverändert** — kein OCR,
kein LaTeX, und das steht ehrlich dabei.

**Leerstellen-Zustände eines Artikels** (Entscheid 15.9.2026):

| Status | Beleg | Statuszeile |
|---|---|---|
| lebt | lebender Wortlaut oder Tabelle | keine Zeile |
| aufgehoben | amtlich belegt (Bund aus der Fedlex-Aufhebungsfussnote, Kanton aus einem LexWork-Segment ohne Körper) | «· aufgehoben» (gedämpft, dauerhaft sichtbar) |
| leer, ungeklärt | nur Text-Heuristik (Körper leer oder «…»), keine amtliche Aufhebung nachweisbar | «kein Text im Snapshot» mit Erläuterung: «Die amtliche Quelle zeigt hier keinen Wortlaut — Änderungsartikel, künftige Bestimmung oder Aufhebung ohne Vermerk. Massgeblich ist die amtliche Fassung.» |

Anlass der Unterscheidung: 98 Bund- und 481 Kanton-Artikel trugen vor der Korrektur
fälschlich «· aufgehoben», obwohl sie geltendes Recht sind (Beispiele: AVIG Art. 115,
BGFA Art. 35, AIG Art. 126f, StGB Art. 108).

Ein vollständig aufgehobener Artikel trägt **kein** Klapp-Chevron (es gibt nichts zu
entfalten); die amtliche Aufhebungs-Zitatzeile («Aufgehoben durch … [AS …]») steht
als Fussnote hinter dem Fussnoten-Schalter, nicht standardmässig offen.

**Quelle:** `src/pages/gesetz-leser/parts/ArtikelLeser.tsx`,
`src/components/normtext/ArtikelBody.tsx`, `ArtikelTabellen.tsx`, `BildElemente.tsx`,
`src/lib/normtext/darstellung.ts`.

#### 2.3.3 Randtitel und Marginalien

Zwei Satzspiegel-Formen:

- **`zeile`** — Randtitel als Zeile **über** der Artikelnummer, Beiwerk unter dem
  Wortlaut. Gilt in Fenstern der geteilten Ansicht, auf schmalen Flächen und in der
  Trefferliste.
- **`breit`** — ab 28 rem Lese-Zelle: Randtitel kursiv im Artikelkopf über der
  Artikelnummer, Fassungsdatum klein daneben.

Mehrzeilige Randtitel bekommen einen Hänge-Einzug-Schutz.

**Quelle:** `src/pages/gesetz-leser/parts/ArtikelLeser.kopfteile.tsx`,
`src/pages/gesetz-leser/v3/satzspiegel.ts`.

#### 2.3.4 Sprachen

**Keine** Sprachumschaltung innerhalb eines Artikels oder Erlasses. Jede Sprachvariante
eines Erlasses ist ein eigener Registereintrag (z. B. `FR-130.11-de` und
`FR-130.11-fr`), ohne erkennbare Querverlinkung im Leser — siehe Abschnitt 9. Der
Sprach-Umschalter im Titelblatt ist ein **Oberflächen**-Umschalter (1.6), er betrifft
den Normtext nicht.

#### 2.3.5 Stand, Live-Link und die Zitat-Ausnahme

Jeder Snapshot trägt: `stand` (Konsolidierungsdatum) · `quelleUrl` (amtlicher Fedlex-
oder Kanton-Link, bei Artikel-Snapshots mit `#art_N`-Anker) · `abgerufen`
(Abrufdatum) · `fassungsToken` · `sha`.

Im Leser öffnet die Aktion **«Amtliche Fassung ↗»** je Artikel den amtlichen
Deep-Link genau an dieser Stelle in einem neuen Tab. Der Erlass-Kopf trägt denselben
Vorbehalt-Satz: «massgeblich bleibt stets die amtliche Fassung».

**Drift- und Aktualitätsanzeige.** Ein Frische-Chip in zwei Tönen:

- ruhiger Ton: «geltend geprüft am … (maschinell)» — neutral, **kein** Rechtsstatus-Urteil
- Warn-Ton: «nächste Fassung ab …» — echter Fassungsvorbehalt, angekündigt, aber noch
  nicht in Kraft

**Quelle:** `src/pages/gesetz-leser/parts/ArtikelAktionen.tsx`,
`public/normtext/currency.json`, `DESIGN-REGLEMENT.md` §N-4b-B.

#### 2.3.6 Fassungen und Revisionen

Je Artikel gibt es die Rubrik **«Fassung»** in der Funktionszeile (2.3.9), gespeist aus
dem erlass-lokalen Historie-Shard. Zugeklappt zeigt die Marke den Stand («Gilt seit
1.1.2023 ›»), aufgeklappt die Zahl der Änderungsstände («3 Fassungen») plus eine
Zeitleiste mit den Ereignissen. Daneben gibt es ein separates Modul für
Artikel-Revisionen sowie eine eigene Behandlung künftiger, angekündigter Fassungen.

**Quelle:** `public/normtext/historie/<KEY>.json`,
`src/lib/normtext/historie-laden.ts`, `src/pages/gesetz-leser/parts/ArtikelHistorie.tsx`,
`src/lib/verzahnung/artikel-revisionen.ts`, `public/verzahnung/artikel-revisionen/`,
`src/pages/gesetz-leser/zukunftsfassungen.ts`,
`src/pages/gesetz-leser/v3/{LeserAenderungsWahl,PanelAenderungen}.tsx`.

#### 2.3.7 Bezüge zu Entscheiden

Zwei Ebenen:

1. **Inline im Artikeltext** — eine «Leitfälle»-Zeile mit BGE-Chips, über die
   Ansicht-Aufklappliste unter «Entscheide» abschaltbar (Vorgabe: AN), mit
   Zeitraum-Filter «alle · 20 · 10 · 5 J.».
2. **Rubrik «Entscheide»** der Funktionszeile am Artikelende: Zahl gezählter
   Entscheide, aufklappbar; ein Sekundär-Griff «im Blatt öffnen ›» öffnet das
   Beiwerk-Blatt auf dem Reiter «Entscheide».

**Quelle:** `ArtikelLeser.leitfaelle.tsx`, `PanelEntscheide.tsx`,
`src/components/RechtsprechungLink.tsx`, `bezuegeLaden.ts`, `bezuegeZaehler.ts`.

#### 2.3.8 Materialien-Verknüpfung

Rubrik **«Materialien»** der Funktionszeile (Entstehungsgeschichte, Botschaften,
Vernehmlassungen, amtliche Materialien). **Dichte-Regel:** artikelscharfe Kanten
stehen prominent (mit Fundstellen-Unterzeile, Behörden-Kürzel, Dokument-Stand),
reine Erlass-Ebene-Kanten verschwinden hinter einem Zähler «n Dokumente auf
Erlass-Ebene» in einem Klappelement.

**Quelle:** `PanelMaterialien.tsx`, `artikelMaterialienLaden.ts`,
`src/lib/normtext/werkzeuge.ts`.

#### 2.3.9 Funktionszeile am Artikelende — die fünf Rubriken

| Buchstabe | Rubrik (Einzahl/Mehrzahl) | Register | Inhalt beim Aufklappen |
|---|---|---|---|
| f | Fassung / Fassungen | Gesetze | Fassungs-Zeitleiste (2.3.6); zugeklappt «Gilt seit …» statt einer Zahl |
| r | Entscheid / Entscheide | Rechtsprechung | Leitfall- und Entscheid-Liste plus «im Blatt öffnen ›» |
| m | Materialie / Materialien | Materialien | Materialien-Liste |
| g | Verweis / Verweise | Gesetze | aufgelöste Normverweise dieses Artikels |
| w | Rechner / Rechner | Werkzeuge | Werkzeuge an diesem Artikel; Leerzustand: «Zu dieser Bestimmung führen wir bisher keinen Rechner und keine Vorlage.» |

Rechts in derselben Zeile stehen die Aktionen (2.3.10). **Regeln:**

- Genau **eine** Rubrik gleichzeitig offen (Akkordeon); `Escape` schliesst und gibt den
  Fokus zurück.
- Beim Laden ist alles zu — **kein** Speicher-Merker mehr.
- Eine Rubrik mit Zahl 0 erscheint gar nicht.
- Die Zeile selbst erscheint nur, wenn mindestens eine Rubrik oder die Aktionen etwas
  zu zeigen haben.
- Aktionen sind im DOM nur bei Hover oder Fokus an der Zeile — **oder**, auf Geräten
  ohne Hover (Telefon, Tablet), immer sichtbar.
- Im Ausdruck ausgeblendet.

**Quelle:** `src/pages/gesetz-leser/parts/Funktionszeile.tsx`. **Umbau-Hinweis:** die
Datei trägt noch die CSS-Klassen `.lr7-bez*` aus ihrem alten Namen `BezuegeKopf.tsx`
und behält sie bewusst — siehe Nebenfund N8.

#### 2.3.10 Kopieren, Zitieren, Teilen

Drei Aktionen je Artikel:

- **«Zitat»** — kopiert das Voll-Zitat inklusive Stand-Ausweis (SR-Nummer, Stand,
  Abrufdatum, Permalink, amtlicher Deep-Link). Der Knopf zeigt danach «✓ kopiert»;
  eine Marke sorgt dafür, dass nur der geklickte Knopf reagiert.
- **«Link»** — kopiert den Permalink und schreibt zusätzlich im **primären** Fenster
  die Browser-Adresse auf `#art-<token>` nach (ohne neuen Verlaufseintrag). Im
  **sekundären** Fenster der geteilten Ansicht wird die Adresse nicht angefasst.
- **«Amtliche Fassung ↗»** — Link zur amtlichen Fassung an genau dieser Stelle
  (Fedlex-ELI-Form), öffnet in neuem Tab. Erscheint **nur**, wenn ein verifizierter
  Link existiert — nie ein geratener.

**Kein Export einzelner Artikel** (weder PDF noch DOCX). «In neuem Reiter» und
«Daneben öffnen» öffnen den **ganzen** Erlass in einem zweiten Fenster.

**Quelle:** `src/pages/gesetz-leser/parts/ArtikelAktionen.tsx`, `ReiterAktion.tsx`.

#### 2.3.11 Suche innerhalb des Erlasses

Eine reine, deterministische Teilstring-Suche (akzenttreu, ab dem ersten Zeichen) über
Snapshot und Struktur-Sidecar: Artikel-Label, Wortlaut, Randtitel und Marginalien,
Gliederungstitel, Tabellen, Bild-Alternativtexte, Rechtsgrundlage und Fussnoten.
**Bewusst nicht** über den globalen Suchindex (48 MB, Leistungsbudget).

Treffer werden im Fliesstext hervorgehoben; die Trefferliste steht in einer eigenen
Spalte über der Lesespalte. Navigation per `↑`/`↓` im Feld oder über die Griffe
`‹ ›` im Kopf der Trefferliste — dieselbe Fundstellen-Folge.

**Schnellsprung «Art. N».** Getippte Artikel-Bezeichnungen werden gegen die geladenen
Artikel-Token aufgelöst; normalisiert erreichen «Art. 6a», «6 a», «ART.6A» und «6a»
denselben Token. Kein Treffer liefert **nichts** statt eines geratenen Sprungs.

Das Suchfeld sitzt seit 6.9.2026 **immer** im klebenden Kopf-Block, unabhängig davon,
ob die Gliederung ein- oder ausgeklappt ist.

**Quelle:** `src/pages/gesetz-leser/leserSuche.ts`, `suchHighlight.ts`,
`suchTreffer.ts`, `LeserTrefferSpalte.tsx`.

#### 2.3.12 Schriftgrösse und Leseansicht

Vier Stufen: **100 / 108 / 118 / 130 %**, vor dem ersten Zeichnen angewandt (kein
Flackern). Basis-Fliesstext 18 px Serif (Literata), Zeilenhöhe 1.62, Zeilenmass-Deckel
65–72 Zeichen, skaliert mit der Schriftstufe.

Die **«Ansicht»**-Aufklappliste im Kopf trägt zwei dauerhafte, rein visuelle Schalter:

- **Fussnoten** — Marker und Apparat sichtbar bzw. verschwunden; der Normtext bleibt
  stets durchsuchbar.
- **Verweise** — Unterstreichung an/aus; Farbe und Funktion bleiben.

**Quelle:** `src/pages/gesetz-leser/leserSchrift.ts`, `LeserAnsichtV3.tsx`,
`tailwind.config.js`, `src/index.css`.

#### 2.3.13 Druck

Funktionszeile, Suchzone und weitere Bedienelemente sind im Druck ausgeblendet. Im
Druck trägt der Artikelkopf den Randtitel, die Funktionszeile fällt weg. Fussnoten
folgen dem Schalter — AUS heisst: auch im Druck weggelassen.

#### 2.3.14 Mobil

Unter der Spaltenschwelle (< 1024 px bzw. schmales Fenster): Gliederung als
Bottom-Sheet hinter «☰», Suchfeld bleibt im klebenden Kopf. Das Beiwerk-Blatt
(Entscheide, Materialien, Verweise, Rechner, Fassung) öffnet als Sheet statt als
Spalte. Die Artikelform bleibt in der schmalen Variante `zeile` (Randtitel als Zeile
über der Artikelnummer). Mobil-Boden des Zeilenmasses: mindestens 31 Zeichen bei
390 px.

#### 2.3.15 Erlass-Blatt und Einzel-Artikel

**Erlass-Blatt** («Rechtsprechung & Kontext», Öffner im Kopf, Taste `r`): ab dem
grossen Breakpoint ein rechtes Blatt von 380 px über der Lesespalte (nicht modal,
der Lesetext bleibt bedienbar), auf dem Handy und in jedem Fenster der geteilten
Ansicht ein Bottom-Sheet. Kopf nennt beim Reiter «Entscheide» den Artikel, sonst das
Erlass-Kürzel, und trägt den Schliessen-Knopf (`Esc`). Darunter die optionale
Steckbrief-Zeile, dann vier Reiter als Registerfläche — **Entscheide** (Register r),
**Änderungen** (g), **Materialien** (m), **Anwendung** (w); der aktive steht auf
der getönten Registerfläche mit Registerkante, alle vier passen in eine Zeile
(Umbruch nur bei grosser Schriftstufe, nie abgeschnitten). Pfeiltasten wechseln
den Reiter; nur die aktive Tafel wird geladen. Inhalte, Filterzeile und Zähler der
Tafeln wie 2.3.6–2.3.8 und 2.4.

**Einzel-Artikel** (`?ansicht=artikel`; «Ganzer Erlass» ist Vorgabe und steht nie
in der Adresse): genau eine Bestimmung. Darüber der Gliederungspfad — jede Stufe
mit eigenem Artikel führt zurück in den ganzen Erlass, sonst bleibt sie Text.
Darunter das Pfeilpaar «davor / danach» in voller Tap-Höhe, die Zeile
«← → blättert vor und zurück» (auf Geräten ohne Tastatur ausgeblendet), die
Nachbarn-Vorschau mit Nummer und Randtitel (am ersten/letzten Artikel entfällt
die leere Seite) und das Dossier: dieselben Rubriken wie die Funktionszeile
(2.3.9), gestapelt und einzeln aufklappbar. Die Funktionszeile am Artikel bleibt
auch im Einzelmodus.

**Teilerfassung ohne Klick** (§8): ein belegter Fehl- oder Teilerfassungs-Befund
(z. B. SG-3849) steht als Hinweis direkt im Titelblatt, nicht nur in der
zugeklappten Übersicht.

**Quelle:** `src/pages/gesetz-leser/v3/{LeserPanel,LeserPanelZone,Panel*,panelModell}.tsx`,
`v3/{LeserEinzelAnsicht,einzelModus,leserModus}.ts(x)`,
`parts/{ArtikelNachbarn,ArtikelDossier,ErlassLeserKopf}.tsx`.

### 2.4 Verknüpfungen vom Artikel in andere Bereiche

| Ziel | Mechanik | Quelle |
|---|---|---|
| Rechtsprechung | Rubrik «Entscheide» (Zahl + Liste); Sekundär-Griff «im Blatt öffnen ›» öffnet das Beiwerk-Blatt auf dem Reiter «Entscheide»; inline die Leitfall-Zeile mit BGE-Chips | `ArtikelLeser.leitfaelle.tsx`, `PanelEntscheide.tsx`, `RechtsprechungLink.tsx` |
| Materialien | Rubrik «Materialien» | `PanelMaterialien.tsx`, `artikelMaterialienLaden.ts` |
| andere Normen (Bund→Bund, Bund→Kanton) | Inline-Verweis-Linker im Fliesstext und in Fussnoten. Ein Klick öffnet das **Norm-Popover** (Wortlaut des Zielartikels, Stand, Live-Link, «Wird zitiert von» / «Legt aus») oder springt bei internem Bestand direkt in den Leser. Fehlt der Zielerlass im Haus, bleibt der Fedlex-Link als Rückfall. | `src/components/NormText.tsx`, `NormPopover.tsx`, `KantonNormText.tsx`, `src/lib/fedlex*.ts` |
| Rechner / Vorlagen | Rubrik «Rechner»; Leerzustand-Satz, wenn kein Werkzeug hinterlegt ist | `ArtikelLeser.bezuegeFuss.tsx`, `randNotizWerkzeuge.ts` |
| Geteilte Ansicht («⧉ Daneben öffnen») | Öffnet denselben oder einen anderen Erlass im zweiten Fenster; nur ab dem grossen Breakpoint und bei freier Kapazität | `LeserPanelOeffner.tsx`, `ReiterAktion.tsx` |
| Kantonale Quellenangabe | Link auf die amtliche kantonale Gesetzessammlung; Wappen-Icon je Kanton | `src/components/KantonQuelleLink.tsx`, `KantonWappen.tsx` |

Von der Gesetzes-Übersicht führt der Link «Was ist durchsuchbar» auf `/abdeckung`.

---

## 3 Rechtsprechung und Materialien

### 3.1 Datenbestand

#### 3.1.1 Rechtsprechung

Register `public/rechtsprechung/register.json`, erzeugt 2026-09-12, **6'345 Einträge**.
Davon tragen **5'093** einen eigenen Volltext; die übrigen **1'252** sind Verweis-Stubs
(sie leiten auf das Ziel-BGE um, siehe 3.3 Zustände). Volltexte liegen als
Einzeldateien unter `public/rechtsprechung/bund/{bge,bger}/*.json` bzw.
`public/rechtsprechung/kanton/<KT>/<gericht>/*.json`.

| Gericht | Einträge | Gerichtstyp |
|---|---:|---|
| Appellationsgericht Basel-Stadt | 2'839 | kantonal |
| Bundesgericht (übrige Urteile) | 1'276 | bundesgericht |
| Bundesgericht (amtliche Sammlung, BGE) | 1'259 | bundesgericht |
| Sozialversicherungsgericht Basel-Stadt | 924 | kantonal |
| Gerichte Graubünden | 6 | kantonal |
| Verwaltungsgericht Bern | 6 | kantonal |
| Obergericht Zürich | 6 | kantonal |
| Gerichte St. Gallen | 6 | kantonal |
| Gerichte Aargau | 6 | kantonal |
| Bundesverwaltungsgericht | 5 | bundesverwaltungsgericht |
| Bundesstrafgericht | 5 | bundesstrafgericht |
| Bundespatentgericht | 5 | bundespatentgericht |
| Zivilgericht Basel-Stadt | 2 | kantonal |

Nach Kanton: BS 3'765 · CH (Bund) 2'550 · GR 6 · BE 6 · ZH 6 · SG 6 · AG 6.
Jahrgänge 2007–2026. Leitcharakter: 1'259 `leitentscheid` (= alle BGE-Einträge),
5'086 `routine`. **Kuratierung bei allen 6'345 Einträgen: `maschinell`** — keiner ist
fachlich abgenommen. Bestand bei allen: `snapshot`.

Entscheide je Sachgebiet (Nicht-Verweise, Startseiten-Zähler): Strafrecht 1'419 ·
Öffentliches Recht 1'330 · Sozialversicherung 1'150 · Privatrecht 992 · Steuern &
Abgaben 116 · Verfahrensrecht 86.

**Felder eines Register-Eintrags:** `key`, `gericht`, `gerichtName`, `gerichtstyp`,
`kanton`, `nummer`, `bgeReferenz` (kann leer sein), `datum`, `datumUnbekannt`,
`zitierung`, `leitcharakter`, `regesteVorhanden`, `regesteKurz`, `sachgebiet`,
`sprache`, `normKeys[]`, `bestand`, `kuratierung`, `verweis`, `quarantaene`, `datei`,
`quelle`, `quelleUrl`, `fassungsToken`, `richter[]`.

**Zusätzliche Felder im vollen Entscheid-Snapshot:** `abteilung` · `azaUrteil` (das
unterliegende BGer-Urteil eines BGE) · `ecli` (deterministisch gemintet, optional) ·
`erstpublikation`/`aktualisiert` · `nummerSekundaer` · `legalArea` (Rohfeld der
Quelle) · `rubrum` (Besetzung, Parteien, Gegenstand, Vorinstanz) · `regeste` inkl.
`sprachfassungen[]` DE/FR/IT mit `weitereRegesten` bei mehrteiliger amtlicher
Regeste · `regesteAmtlich` · `abschnitte[]` (`regeste | sachverhalt | erwaegung |
dispositiv`, je mit Blöcken aus Marke, Tiefe und Text) · `auszugAbschnitte` (nur BGE
mit aufgelöstem Volltext — der amtliche Sammlungs-Auszug getrennt vom vollständigen
Urteil) · `dispositivOrders[]` · `zitierteNormen[]` · `zitierteEntscheide[]` · `sha`.

**Quelle:** `src/lib/rechtsprechung/typen.ts`, `public/rechtsprechung/register.json`,
`public/rechtsprechung/richter.json`.

#### 3.1.2 Materialien

Register `public/materialien/register.json`, erzeugt 2026-09-18, **1'683 Einträge**.
Drei getrennte Projektionen aus einem Generator-Lauf: `register.json` (Kern),
`register-i18n.json` (FR/IT-Titel), `register-provenienz.json` (Hashes und
Verfahrensfelder — vom Browser **nie** geladen).

| Behörde | Anzahl | | Dokumenttyp | Anzahl |
|---|---:|---|---|---:|
| Bund (Vernehmlassungen) | 831 | | `vernehmlassung` | 831 |
| Bundesrat (Botschaften) | 408 | | `botschaft` | 408 |
| SECO | 155 | | `wegleitung` | 156 |
| ESTV | 144 | | `ratschlag` | 84 |
| Grosser Rat Basel-Stadt | 117 | | `kreisschreiben` | 55 |
| EDÖB | 19 | | `gr-bericht` | 32 |
| BSV | 3 | | `mwst-branchen-info` | 27 |
| EHRA (BJ) | 2 | | `mwst-info` | 22 |
| FINMA | 2 | | `ks-anhang` | 22 |
| IGE | 2 | | `weisung` | 15 |
| | | | `merkblatt` | 11 |
| | | | `leitfaden` | 8 |
| | | | `rundschreiben` | 3 |
| | | | `mitteilung` | 3 |
| | | | `anleitung` | 2 |
| | | | `richtlinie` | 2 |
| | | | `taetigkeitsbericht` | 1 |
| | | | `gr-initiative` | 1 |

**Alle 1'683 Einträge haben `status: nur-live-link`** — kein eingebettetes PDF, kein
gespeicherter Volltext.

**Felder eines Eintrags** (Beispiel `ESTV-KS-DBG-5A`): `key`, `behoerde`,
`behoerdeName`, `behoerdeKuerzel`, `doktyp`, `doktypLabel`, `titel`
(«Umstrukturierungen»), `nummer` («Nr. 5a»), `rechtsgebiet` («steuern»), `sprache`,
`status`, `quelleUrl`, `stand` («2022-02-01»), `rang`, `normKeys[]` (hier `["DBG",
"FUSG"]`), `hinweis` (optionaler Text).

Bei `doktyp === 'vernehmlassung'` zusätzlich ein Block mit Status, Fristbeginn,
Fristende und Projekt-Kennung; das amtliche Status-Vokabular lautet:
`in-vorbereitung · geplant · laufend · abgeschlossen-stellungnahmen ·
abgeschlossen-bericht · abgeschlossen · zurueckgezogen`.

Nur build-seitig geführte Felder: `titelFr`/`titelIt`, `projEli`, `ocUris[]`,
`botschaftDate`, `artAnker[]`, `ereignisse[]` (Verfahrenskette), `artikelBezuege[]`
(kuratierte Artikel-Zuordnung), `bsKanten[]` (Herkunft einzelner
BS-Erlassverknüpfungen: Quelle amtlich oder maschinell, Regel Fussnote /
SG-Nummer / Datum-Titel).

**Quelle:** `src/lib/materialien/typen.ts`, `public/materialien/register.json`.

#### 3.1.3 Verzahnungs-Artefakte

Unter `public/verzahnung/`: `artikel-revisionen/<ERLASS>.json` (Revisionsdaten je
Erlass, für den Revisions-Hinweis an zitierten Normen) sowie Unterordner für
Entscheid-Kanten und Glossar-Daten.

Unter `public/materialien/`: `entstehung/<ERLASS>.json` (Entstehungsgeschichte je
Erlass) · `anker/` (Sidecar mit Bundesblatt-Sprungmarken auf einzelne Artikel, nur
bei Botschaften mit amtlicher Anker-Vergabe) · `synopse/` und `synopse-entwurf/` ·
`kanten/` · `curia/` · `deckungs-sicht.json` (Datengrundlage der Deckungsseite).

### 3.2 Rechtsprechung-Übersicht (`/rechtsprechung`)

**Zweck.** Kuratierter Einstieg in den Entscheid-Korpus: Sachgebiets-Schiene,
Leitentscheide-zuerst-Gruppierung, Norm-Verzahnung über `?norm=` — bewusst **keine**
flache Trefferliste.

**Elemente** (Leserichtung):

1. Seitenkopf: Überschrift «Rechtsprechung» und Ausgabe-Zeile «<N> Entscheide des
   Bundesgerichts und kantonaler Gerichte im Volltext».
2. Zweispaltiges Layout ab dem grossen Breakpoint (bzw. entsprechender Fensterbreite):
   links die Sachgebiets-Schiene (vertikal, klebend; mobil ein horizontales
   Chip-Band), rechts die Ergebnis-Spalte.
3. **Sachgebiets-Kacheln:** Eintrag «Alle Sachgebiete» mit Gesamtzahl plus ein Eintrag
   je Sachgebiet mit Trefferzahl; der aktive Eintrag ist hervorgehoben.
4. **Live-Suche:** eingeklappter Link «Nicht dabei? Im gesamten Schweizer Korpus
   suchen (entscheidsuche.ch) →». Aufgeklappt: Suchfeld + Sortierung
   (Relevanz/Neueste) + Ergebnisliste **externer, nicht geprüfter** Treffer mit
   Kanton, Datum, Aktenzeichen und externem Link. Ausdrücklich **«Discovery, keine
   Engine»** — der Suchbegriff geht erst nach einem bewussten Klick an
   entscheidsuche.ch (Berufsgeheimnis-Hinweis im Code).
5. **Filter-Sheet** mit dem Entscheid-Filter darin (mobil ein Bottom-Sheet hinter
   «Filter (n)», ab dem grossen Breakpoint inline).
6. **Entscheid-Filter:**
   - Filterfeld «Filtern» (volle Breite, Platzhalter «Thema, Aktenzeichen, Norm,
     Gericht …»), Fuss-Hinweis zum Suchumfang.
   - Zeile **Sortierung** (Auswahlliste): «Leitentscheide zuerst» · «Neueste zuerst» ·
     «Älteste zuerst» · «Bund → Kantone» — daneben der Ansichts-Umschalter «Liste» /
     «Karten» als Text-Schalter.
   - Facetten-Leiste **«Gemeinwesen»** (Alle / Bund / Kantone; bei mehreren Kantonen
     einzelne Kantons-Chips) — nur sichtbar, wenn kantonale Daten vorhanden sind.
   - Facetten-Leiste **«Instanz»** (Alle / BGer / BVGer / BStGer / BPatGer / Kantone) —
     erst ab mehr als einer belegten Instanz.
   - Facetten-Leiste **«Sprache»** — nur bei mehrsprachigem Bestand.
   - **«Richter:in»** — Autocomplete-Kombinationsfeld (Freitext,
     Pfeiltasten-Navigation, Listbox mit einer Höchstzahl sichtbarer Treffer plus «n
     weitere»); erscheint nur, wenn die aktuelle Auswahl erfasste Besetzungen trägt.
   - Aufklappbares **«Erweiterte Filter»**: Auswahlliste **Gericht** (mit Trefferzahl
     je Option; bei mehrdeutigem Gerichtsnamen mit dem Zusatz «amtliche Sammlung
     (BGE)» vs. «übrige Urteile») · Datumsfelder **«Entscheid ab»** / **«bis»** ·
     Ankreuzfeld **«Nur Leitentscheide (amtliche BGE)»**.
   - Zeile entfernbarer Aktiv-Filter-Chips plus Knopf **«zurücksetzen»** (setzt alles
     ausser dem Sachgebiet zurück).
7. **Norm-Kontextstreifen** (nur bei `?norm=`): «Rechtsprechung zu <Norm> — n
   Entscheide» plus Knopf «aufheben».
8. **Treffer-Zähler-Zeile:** «<n> Entscheid(e) · <n> Leitentscheide · <n>
   Volltext-Verweise» — **immer alle drei Zahlen, auch 0**.
9. **Trefferbereich.** Bei Vorgabe-Sortierung ohne aktive Suche oder Norm: drei
   Sektionen — «Amtliche Leitentscheide (BGE)» · «Vollständige Urteile zu den
   Leitentscheiden» (nur wenn vorhanden) · «Weitere Entscheide — nicht in der
   amtlichen Sammlung (BGE)», gruppiert nach Instanz in der Reihenfolge Bundesgericht
   → Bundesverwaltungsgericht → Bundesstrafgericht → Bundespatentgericht → Kantonale
   Gerichte. Sonst (aktive Suche/Norm oder andere Sortierung): ein sortierter Strom
   mit **Jahrgangs-Sprungleiste** («Jahrgang» + Chips mit Trefferzahl je Jahr, nur bei
   chronologischer Sortierung mit mehr als einem Jahrgang).
10. Jede Liste zeigt höchstens **100** Einträge; «Weitere anzeigen (n weitere)» bzw.
    «Frühere anzeigen (n darüber)» erweitern stapelweise bis zu einem Fenster von
    **2'000**.
11. Leerzustand bei 0 Treffern: «Kein Entscheid gefunden.» plus Knopf «Filter
    zurücksetzen».
12. Fuss-Hinweis: «Keine Rechtsberatung. „ungeprüft" = maschinell erfasst, fachlich
    noch nicht abgenommen; massgeblich ist stets die amtliche Fassung (Link je
    Entscheid).»

#### 3.2.1 Trefferdarstellung «Karten»

Statuszeile: Leitentscheid-Badge oder «Vollständiges Urteil»-Badge plus
Sachgebiets-Label links; rechts gegebenenfalls Quarantäne-Hinweis «Volltext nicht
verfügbar», «ohne amtl. Regeste», «amtl. Betreff» sowie das Status-Badge
«maschinell». Thema-Zeile über zwei Zeilen gekappt: echte Regeste in der
Serifenschrift, synthetische Sachzeile in der Groteskschrift mit kursivem Marker.
Norm-Chip-Zeile (höchstens 4 plus «+n weitere»). Metazeile: Identität (BGE-Referenz
fett, sonst Aktenzeichen gedämpft) · Gericht · Datum · gegebenenfalls abweichendes
Aktenzeichen in Klammern · Sprachbadge bei Nicht-Deutsch · Link «↗ amtlich» zur
Gerichtsquelle.

#### 3.2.2 Trefferdarstellung «Liste»

Datum links in fester Spalte (Platzhalter «JJJJ, o. D.» bei unbekanntem Datum),
Bezeichnung (Thema bzw. Leitsatz, gekappt mit Tooltip), BGE-Referenz oder
Aktenzeichen rechtsbündig, darunter die Metazeile (Sachgebiet, Status-Marker,
Norm-Chips bis 5 plus «+n weitere»).

**Eingaben & Interaktionen.** Freitextsuche (URL `?q=`, entprellt gespiegelt) ·
Sachgebiets-Klick (`?rg=`) · Norm-Chip-Klick (`?norm=`) · Gemeinwesen-, Instanz- und
Sprach-Schalter (`?ebene=`, `?kanton=`, `?instanz=`, `?sprache=`) · Richter-Auswahl
(`?richter=`) · Gericht-Auswahlliste (`?gericht=`) · Datumsfelder (`?von=`, `?bis=`) ·
Ankreuzfeld «nur Leitentscheide» (`?leit=1`) · Sortierung und Dichte (lokal) · Klappe
«Erweiterte Filter» (lokal) · Jahrgangs-Sprung und «Weitere/Frühere anzeigen»
(Sitzungs-Fenster).

**Zustände.** Laden (Platzhalter-Balken, «Die Sammlung wird abgerufen …») · Fehler
(Warnhinweis «… konnte nicht geladen werden») · leerer Bestand («Es sind noch keine
Entscheide erfasst …») · 0 Treffer nach Filter (Leerzustand mit Rücksetz-Knopf) ·
normaler Zustand mit Daten.

**Persistenz — strikte Dreiteilung:**

| Art | Was | Wo |
|---|---|---|
| **Inhalt** (was gefiltert wird) | `rg`, `norm`, `richter`, `ebene`, `kanton`, `instanz`, `sprache`, `gericht`, `von`, `bis`, `leit`, `q` | **URL** (ersetzend, kein Verlaufseintrag) — teilbar und reload-fest |
| **Darstellung** | Dichte (`rsp:dichte`), Sortierung (`rsp:sort`), Klappe (`rsp:filter-offen`) | **localStorage** |
| **Navigation** | Listenfenster je Liste (Präfix `rsp:deckel:`) | **sessionStorage** — nur für den aktuellen Besuch, dient dem Rückweg Treffer → Detail → zurück |

**Quelle:** `src/pages/Rechtsprechung.tsx`,
`src/components/rechtsprechung/{SachgebietKacheln,LiveSuche,FilterSheet,EntscheidFilter,RichterFilter,EntscheidKarte,EntscheidZeile}.tsx`,
`src/components/rechtsprechung/zustand.ts`,
`src/lib/rechtsprechung/livesuche.ts`. Daten: `GET /rechtsprechung/register.json`
(client-seitig gefiltert und sortiert, **kein** Server-Suchindex), Richter-Namen aus
`GET /rechtsprechung/richter.json`, Live-Suche gegen die externe API von
entscheidsuche.ch.

### 3.3 Entscheid-Leser (`/rechtsprechung/:key`)

**Zweck.** Volltext-Lesebild eines einzelnen Entscheids nach amtlicher Gliederung
(Regeste → Sachverhalt → Erwägungen → Dispositiv, Art. 112 BGG), mit Zitierfunktion,
Norm- und Entscheid-Verzahnung und zwei Ansichten beim BGE.

**Kopf-Elemente** (Leserichtung):

1. Overline: Gericht (nur wenn die Zitierung es nicht selbst nennt) · Abteilung ·
   Sachgebiet.
2. Überschrift = amtliche Zitierung («BGE 145 III 72» bzw. «BGer 6B_1293/2023 vom …»),
   Serifenschrift, Ziffern in fester Breite.
3. Gegebenenfalls eine abgeleitete Sachgebiets-Leitzeile mit dem Marker «Sachgebiet
   aus der Aktenstruktur abgeleitet — keine amtliche Regeste vorhanden.» (nur wenn
   weder Rubrum-Gegenstand noch Regeste das Thema tragen).
4. Herkunfts-Hinweis bei Aufruf über `?norm=`: «Aufgerufen über <Norm>» plus Knopf
   «↓ Fundstelle i/n» (springt zyklisch zur nächsten wörtlichen Nennung in den
   Erwägungen) — oder ein ehrlicher Hinweis «im Text markiert, kein Erwägungs-Anker»
   bzw. «im Text nicht wörtlich genannt».
5. Rubrum-Zeilen (nur in der Voll-Ansicht, nur befüllte Felder): Gegenstand · Parteien ·
   Vorinstanz · Besetzung (Richter-Namen gegebenenfalls verlinkt).
6. Fakten-Zeile: Entscheiddatum (falls nicht schon im Titel) · BGE-Referenz (falls
   nicht im Titel) · parallele Zweit-Geschäftsnummer.
7. **Ehrlichkeits-Zeile:** Leitentscheid-Badge (interaktiv, mit Begriff-Tooltip) ·
   Sprachbadge · «maschinell»-Badge · Satz «Wiedergabe des amtlichen Urteilstexts —
   massgeblich ist stets die amtliche Fassung.»
8. Aktionen: Link **«massgebliche Fassung»** (folgt der aktiven Ansicht: Urteil bzw.
   BGE-Sammlung; Marker «(Urteil n. v.)», wenn das unterliegende Urteil nicht
   aufgelöst ist) · Schriftgrad-Steller **«Nur Entscheidtext A− A+»** (vier Stufen
   1.0 / 1.08 / 1.18 / 1.3 rem, in `localStorage`) · Knopf **«⧉ Zitat kopieren»**
   (Zitierung + Abrufdatum + Permalink) · Knopf **«▭ Lesemodus»**.

**Klebende Zwischenleiste.** Bei einem BGE mit aufgelöstem Volltext: Reiter
**«Amtlicher BGE-Auszug»** / **«Vollständiges Urteil <Aktenzeichen>»** (spiegelt
`?ansicht=`). Darunter Sprung-Navigation zu den vorhandenen Abschnitten
(Regeste/Zusammenfassung · Sachverhalt · Erwägungen · Dispositiv) mit
Scroll-Hervorhebung.

**Lesefläche** (zweispaltig ab dem sehr grossen Breakpoint). **Links** die
Erwägungs-Schiene: Suchfeld «Im Entscheid suchen …», ein reservierter Auskunfts-Slot
(Trefferzahl je Fassung, Schalter «Hervorhebung» bei Treffern), darunter das
Verzeichnis (Gliederung der Erwägungen bzw. bei aktiver Suche die Treffer-Liste),
darunter **«Angewandte Normen»** (Chips, springen zur Fundstelle **im Text**). Bei
laufender, hervorhebender Suche zusätzlich eine **Treffer-Landkarte** (feste
Positions-Spur am Fensterrand, nur ab dem sehr grossen Breakpoint, nicht in einem
Fenster der geteilten Ansicht). **Rechts** (mobil darunter) die Lesespalte
(60–75 Zeichen): Regeste-Block (nur im Auszug bzw. bei Nicht-BGE) und Entscheid-Körper.

#### 3.3.1 Regeste-Block

Titel **«Regeste»** (amtlich) oder **«Zusammenfassung»** (maschinell). Regestenkopf
fett, darunter die Textabsätze. Bei mehrteiliger amtlicher Regeste («Regeste a/b/c»)
je Teil mit Label. FR- und IT-Fassungen stehen in einem Klappelement **«Weitere
Sprachfassungen»**. Quellenzeile mit Link «bger.ch ↗» bzw. «Quelle: OpenCaseLaw».

#### 3.3.2 Entscheid-Körper

Abschnitte in fester Reihenfolge Sachverhalt → Erwägungen → Dispositiv.

- **Erwägungen** nach Top-Ziffer gruppiert; jede «N.» ist eine Kopfzeile mit
  Trennlinie, Unter-Erwägungen sind nach Tiefe eingerückt. **Jede Erwägungs-Ziffer ist
  Anker und Klick-Kopie der vollen Fundstelle** (z. B. «BGE 145 III 72, E. 2.3») inkl.
  Abrufdatum und Permalink, mit höflicher Vorlese-Bestätigung.
- **Sachverhalt:** Buchstaben-Gliederung (A.a / A.b / B.a …) je Absatz.
- **Dispositiv:** nummerierte Liste plus gedämpfte Schlussformel.
- Norm-Zitate im Fliesstext sind dezent unterstrichen verlinkt (gemeinsamer
  Norm-Baustein, 2.4).

**Sonderzustände im Körper:** Kein erfasster Text → Hinweisbox («… massgeblich ist die
amtliche Fassung …», bei bekannter Quarantäne mit Nennung des vermischten BGE).
Fehlende Gliederung → Hinweis «Strukturierte Gliederung … nicht verfügbar — der Text
wird unverändert wiedergegeben.» Erwägungen ohne erkennbares Dispositiv → eigene
Hinweiszeile.

#### 3.3.3 Lesemodus

Ablenkungsfreies Vollbild — in der geteilten Ansicht **auf das jeweilige Fenster
begrenzt**, nicht app-weit: grosse Serifen-Lesespalte, Kopf reduziert auf Titel,
Rubrum und «massgebliche Fassung»; `Esc` schliesst; Fokus-Falle; der Seiten-Bildlauf
ist gesperrt (nur ausserhalb eines Fensters). `?lese=1` in der URL öffnet ihn direkt
beim Laden.

#### 3.3.4 Provenienz-Fuss

Link «massgebliche Fassung» plus «Daten: <Quelle>» (OpenCaseLaw · entscheidsuche.ch ·
«Rechtsprechungs-Datenbank der Gerichte Basel-Stadt (amtlich)»). Satz: «Der
Urteilstext ist als amtliches Werk gemeinfrei (Art. 5 URG). Eine allfällige Regeste
ist redaktionell. Diese Wiedergabe ersetzt die amtliche Fassung nicht und stellt keine
Rechtsberatung dar. […]» Dazu der Hinweis, dass genannte Bundesnormen im Text verlinkt
sind.

#### 3.3.5 Kontext-Blatt am Dokumentfuss

Zwei Gruppen:

- **«Zitierte Normen»** — artikelscharf; ein Chip pro Norm springt zur Fundstelle im
  Urteilstext bzw. zur Regeste; ⧉ öffnet den Artikel im zweiten Fenster; Badge
  **«↻ revidiert»**, falls die Norm seit dem Entscheid geändert wurde.
- **«Zitierte Entscheide»** — Zähler «n erfasste Zitate, davon k im Korpus»; nur
  aufgelöste Treffer erscheinen als Chips, mit Sprung «↳ E. x.y» zur zitierenden
  Stelle im aktuellen Text; ⧉ öffnet den zitierten Entscheid im zweiten Fenster.

**Eingaben & Interaktionen.** Reiter-Wechsel Auszug/Volltext (`?ansicht=`) ·
Sprung-Chips und Schienen-Klicks (Anker `#abschnitt-…` / `#e-…`, ersetzend, kein
Verlaufseintrag) · Suchfeld im Entscheid (lokal, 200 ms entprellt für Verzeichnis und
Treffer; Hervorhebung und Feld selbst unverzögert) · Schalter «Hervorhebung» ·
Klick auf eine Erwägungs-Ziffer kopiert die Fundstelle · «Zitat kopieren» ·
«Lesemodus» öffnen/schliessen · Schriftgrad A−/A+ · Norm- und Entscheid-Chips im Fuss
(Sprung, Fenster öffnen).

**Zustände.** Laden («Der Entscheid wird abgerufen …») · nicht gefunden (Fehlseite,
Bereich «Rechtsprechung», Objekt «Entscheid», Erklärung «Möglicherweise wurde er noch
nicht erfasst.», Weg «Zur Rechtsprechung») · **Verweis-Eintrag ohne eigenen Snapshot
→ automatischer Redirect auf das Ziel-BGE** (das betrifft die 1'252 Verweis-Stubs aus
3.1.1) · Quarantäne (bekannter Quellenkonflikt) → präzisierter Hinweis statt einem
generischen «kein Text» · normaler geladener Zustand.

**Persistenz.** `?ansicht=`, `?norm=`, `?lese=1` in der URL; Schriftgrad des
Entscheidtexts in `localStorage`.

**Quelle:** `src/pages/EntscheidLeser.tsx`,
`src/components/rechtsprechung/{RegesteBlock,EntscheidBody,LesemodusOverlay,EntscheidVerzahnung,ErwaegungsRail}.tsx`,
`src/components/layout/LeserKopfGeruest.tsx`, `src/pages/entscheidErwBereich.tsx`,
`src/components/kontext/KontextPanel.tsx`, `src/components/leser/TrefferLandkarte.tsx`.
Daten: Manifest-Eintrag aus dem bereits geladenen Register plus Volltext-Datei
`GET /rechtsprechung/<eintrag.datei>` (lazy, gecacht); Richter-Register für
Besetzungs-Links; Revisions-Shards für die «revidiert»-Badges; das Entscheid-Manifest
erneut für die Auflösung zitierter Entscheide.

### 3.4 Materialien-Übersicht (`/materialien`)

**Zweck.** Katalog praxisleitender Behörden-Publikationen («Soft Law» —
Kreisschreiben, Wegleitungen, Leitfäden, Botschaften, Vernehmlassungen,
BS-Ratschläge). Je Karte führt eine In-App-Detailseite mit bibliografischen
Metadaten und Live-Link — **kein gespeicherter Volltext**.

**Elemente.** Seitenkopf (Überschrift «Materialien» + Ausgabe-Zeile «<N>
Publikationen der Bundesbehörden, bibliografisch mit Live-Link») · Filterfeld
«Filtern» (Platzhalter «Titel, Nummer oder Behörde …», Fuss-Hinweis zum Suchumfang)
plus zwei Auswahllisten **«Behörde»** (mit «Kürzel — Name» je Option) und
**«Dokumenttyp»**. Darunter je Behörde eine Sektion (Gruppenkopf mit Kürzel und
Anzahl, ausgeschriebener Name darunter) mit einem Karten-Raster (1/2/3 Spalten je
Breakpoint). Fuss: Hinweis «Faktisches „Soft-Law", kein Gesetzesrang. Diese Rubrik
führt keine eigenen Volltexte; …» plus Link **«Was wir nicht haben»** zur
Deckungsseite.

**Material-Karte.** Overline «<Doktyp-Label> · <Nummer>» (oder nur das Doktyp-Label)
plus Sprachbadge bei Nicht-Deutsch · Titel (drei Zeilen gekappt) · Stand-Chip am
Kartenfuss · Zeile **«Details & amtliche Fassung →»** (dauerhaft sichtbar, nicht nur
bei Hover).

**Eingaben & Interaktionen.** Freitextsuche (`?q=` beim Einstieg über die
Universalsuche vorbelegt, sonst lokal) · Behörde-Auswahlliste · Dokumenttyp-Auswahlliste.

**Zustände.** Laden · Fehler («Die Übersicht konnte nicht geladen werden.») ·
0 Treffer (Leerzustand «Kein Material gefunden.» plus Knopf «Filter zurücksetzen»,
der Behörde, Doktyp und Suche zurücksetzt) · normal.

**Persistenz.** Behörde und Doktyp leben **nur** im Komponenten-Zustand (keine
URL-Spiegelung); die Suche wird beim Einstieg aus `?q=` gelesen.

**Quelle:** `src/pages/Materialien.tsx`,
`src/components/materialien/MaterialKarte.tsx`; Daten `GET
/materialien/register.json` (client-seitig gefiltert und gruppiert).

### 3.5 Material-Leser (`/materialien/:key`)

**Zweck.** Bibliografische Detailseite **eines** Materials — Metadaten plus
Live-Link, kein gehosteter Dokumentinhalt.

**Elemente.** Leser-Kopfgerüst: Overline (Behördenkürzel · Doktyp + Nummer ·
Rechtsgebiet) · Überschrift = Volltitel in Serifenschrift · Fakten-Zeile
(Behördenname · «Stand <Datum>» · Sprache) · Ehrlichkeits-Zeile mit dem Status-Badge
**«nur Verweis»** (Vorlesetext: «nur Verweis — kein aufbereiteter Volltext, nur
amtlicher Live-Link») · Aktions-Chip zur amtlichen Fassung, **darunter die rohe URL
als sichtbarer Text** (Transparenz vor dem Klick).

Hinweisbox: «**Behördenpublikation, kein Gesetzesrang.** Verwaltungsverordnungen
(Kreisschreiben, Wegleitungen, Leitfäden u. a.) binden die Verwaltung intern und sind
faktisch praxisleitend, aber für Gerichte und Private nicht direkt verbindlich. […]
Maschinell erfasst, fachlich noch nicht geprüft.» Dazu ein optionaler eintrags-eigener
Hinweistext.

Darunter das Kontext-Blatt (Typ «Material», Norm-Bezüge über `normKeys`) und — nur bei
Dokumenttyp `botschaft` mit Anker-Sidecar — die Entstehungs-Verknüpfung (3.7).
Fuss: Knopf **«← Alle Materialien»**.

**Eingaben & Interaktionen.** Klick auf «amtliche Fassung» (externer Link) ·
Anker-Links der Entstehungs-Verknüpfung (Sprung ins Gesetz bzw. externer Link ins
Bundesblatt).

**Zustände.** Laden · nicht gefunden (Fehlseite: Bereich «Amtliche Ressourcen»,
Objekt «Material», Erklärung «Dieser Eintrag existiert nicht (mehr).», Weg «Alle
Materialien») · normal.

**Persistenz.** Keine — reiner Leser ohne lokalen Zustand ausser dem Ladezustand.

**Quelle:** `src/pages/MaterialLeser.tsx`,
`src/components/entstehung/MaterialEntstehung.tsx`, `src/lib/entstehung/anker.ts`.

### 3.6 Deckungsseite (`/materialien/deckung`)

**Zweck.** Öffentliche Transparenz-Seite **«Was wir nicht haben»** — zeigt je Ebene
und je Erlass, was an Entstehungsgeschichte erfasst ist und was nicht. Ausdrücklich
**keine Fehlerquote**, sondern eine Vollständigkeits-Auskunft.

**Elemente.** Abschnitt **«Ebene für Ebene»**: eine Zeile je Ebene mit Name, Quelle
und Stand, der Zahl «haben» gegebenenfalls gegen «gesamt» — oder dem ehrlichen Vermerk
«Grundgesamtheit nicht erhoben», **nie eine erfundene 0** — plus erklärendem
Hinweistext. Belegte Ebenen-Zeilen: «Fussnoten-Fundstellen in der
Fedlex-Änderungsliste» · «Änderungen mit erfasster Botschaft (Bund)» · «Botschaften
mit Sprungmarken auf einzelne Artikel» (weitere Zeilen folgen demselben Muster,
siehe Abschnitt 9).

Darunter eine sortierbare Tabelle je Erlass mit den Spalten **Erlass · Fussnoten-Deckung
(Quote) · Fundstellen · Änderungen mit Botschaft · Alt-Blöcke · davon ohne Ereignis**.
Die Spaltenköpfe sind klickbar und sortieren auf- bzw. absteigend.

**Eingaben & Interaktionen.** Spaltenkopf-Klick sortiert die Erlass-Tabelle; ein
erneuter Klick auf dieselbe Spalte dreht die Richtung.

**Zustände.** Die Seite berechnet nichts — sie stellt eine geladene JSON-Projektion
dar. Lade- und Fehlerzustand liegen in der äusseren Hülle.

**Persistenz.** Keine.

**Quelle:** `src/pages/MaterialienDeckung.tsx`; Daten `GET
/materialien/deckungs-sicht.json` (eigene, kompakte Projektion — 78 KB roh, 11 KB
gzip —, ausdrücklich **nicht** die grossen Rohartefakte).

### 3.7 Verzahnung: Rechtsprechung ↔ Materialien ↔ Gesetze

Zentraler, für alle drei Korpora geteilter Baustein ist das **Kontext-Blatt** mit den
drei Typen `norm`, `entscheid`, `material` — je nach Typ blendet es die passenden
Gruppen ein und aus. Dazu kommen domänen-eigene Gruppen im Entscheid-Leser und im
Material-Leser.

| Von | Nach | Anzeigeort | Beschriftung / Mechanik |
|---|---|---|---|
| Entscheid (Erwägung) | Norm/Artikel | Fliesstext des Entscheid-Körpers | Inline-Link über den Norm-Baustein (dezente Unterstreichung); nur bei eindeutiger Auflösung |
| Entscheid | Normen (artikelscharf) | Kontext-Blatt, Gruppe «Zitierte Normen» | Chip pro Norm; Klick springt zur Fundstelle in der aktuellen Erwägung bzw. zur Regeste; ⧉ öffnet den Artikel im zweiten Fenster; Badge «↻» bei Norm-Revision seit dem Entscheid |
| Entscheid | anderer Entscheid | Kontext-Blatt, Gruppe «Zitierte Entscheide» | Nur aufgelöste Treffer als Kanten-Chip (mit Leitentscheid-Kennzeichnung), Sprung «↳ E. x.y» zur zitierenden Stelle, ⧉ öffnet im zweiten Fenster; Zähler «n erfasste Zitate, davon k im Korpus» |
| Entscheid | Navigation im Entscheid selbst | Erwägungs-Schiene, «Angewandte Normen» | Chip springt **innerhalb** desselben Entscheids zur Fundstelle — bewusst **kein** Sprung in die Gesetzessammlung (das übernimmt der Fuss) |
| Norm/Artikel | Botschaft (Entstehungsgeschichte) | Kontext-Blatt (Typ Norm), Gruppe «Entstehungsgeschichte» | Chip bzw. Zeile mit Botschafts-Titel und Datum, verlinkt `/materialien/:key` |
| Norm/Artikel | Vernehmlassung | Kontext-Blatt (Typ Norm), Gruppe «Gesetzgebung in Arbeit» | Zeile mit Status-Label (amtliches Vokabular) und gegebenenfalls Fristangabe |
| Norm/Artikel | Bundesgerichtsentscheide | Kontext-Blatt (Typ Norm), Gruppe «Bundesgerichtsentscheide» | Entscheid-Kanten aus den Leitfall-Shards |
| Norm/Artikel | Amtliche Materialien (Soft Law) | Kontext-Blatt (Typ Norm), Gruppe «Amtliche Materialien» | Materialien mit passendem `normKeys`-Eintrag |
| Material (Botschaft) | Artikel, den sie erläutert | Entstehungs-Verknüpfung, «Erläutert diese Artikel» | **Nur** wenn ein Anker-Sidecar existiert; Link zum Artikel-Anker `#art-<token>` bei genau einem, eindeutigen Erlass; sonst nur der externe Pfeil-Link ins Bundesblatt-HTML. Sidecar-Deckung laut Kommentar rund 22 % der Botschaften |
| Erlass-weite Deckung | — | `/materialien/deckung` | Tabellarische Übersicht, was erfasst ist und was fehlt, je Erlass und je Ebene |
| Erzeugter Fliesstext (Vorlagen/Rechner) | BGE-/BGer-Zitat im Text | Rechtsprechungs-Link-Baustein | Erkennt «BGE <Band> <Teil> <Seite>» bzw. «<Abteilung>_<Nr>/<Jahr>» im Text und verlinkt **deterministisch** auf bger.ch (Permalink bzw. Suche); der Text bleibt zeichenidentisch |

**Verzahnungs-Grammatik** (bewusst zweigleisig benannt): **«Wendet an»**
(Entscheid/Material → Norm) · **«Wird zitiert von»** (Norm → Entscheid) · **«Legt
aus»** (Norm → Material) · **«Zitiert»** (Entscheid → Entscheid).

**Alle Verknüpfungen sind maschinell**, keine redaktionelle Auswahl — das steht so im
Kopfkommentar des Kontext-Blatts und gilt für den Nachbau als Ehrlichkeits-Pflicht.

**Quelle:** `src/components/kontext/KontextPanel.tsx`,
`src/components/rechtsprechung/EntscheidVerzahnung.tsx`,
`src/components/entstehung/MaterialEntstehung.tsx`,
`src/components/RechtsprechungLink.tsx`, `src/lib/rechtsprechung/norm-index.ts`.

---

## 4 Rechner (Werkbank-Rubrik «Werkzeuge», Teil A)

**Zwei parallele Metadaten-Quellen.** Der Katalog speist die Übersicht `/rechner` und
die Suche; die **Seitenköpfe** der 20 gebauten Rechner lesen dagegen eine zweite,
redundante Liste mit eigenem Titel, eigener Kategorie, eigenem Kurztext und eigenen
Normen je Slug. Beide Register werden von Hand parallel gepflegt — siehe Nebenfund N1.
Für den Nachbau heisst das: **Kopftitel einer Rechnerseite ≠ Kartentitel in der
Übersicht.**

### 4.1 Katalog aller Rechner-Karten

Spalten wörtlich aus dem Katalog. «Pfad» ist das `href`-Feld der Karte; bei
`geplant` fehlt es — die Karte ist über `/rechner/<id>` erreichbar und rendert dort
den Stub. «Normen» ist nur bei Status `entwurf` befüllt (geplante Karten tragen keine
Artikel-Pills). Alle hier aufgeführten Rechner-Karten sind im Katalog sichtbar.

| id (Katalog) | Pfad (href) | Titel | Kurzbeschrieb | Rechtsgebiet | Status | Normen |
|---|---|---|---|---|---|---|
| `zpo-fristen` | `/rechner/zpo-fristen` | Verfahrens- & Rechtsmittelfristen (kurz: ZPO-Fristen) | «Verfahrens- und Rechtsmittelfristen mit Gerichtsferien und Stillstand.» | Zivilprozess (ZPO) & Bundesgericht | entwurf | Art. 142–147 ZPO |
| `schkg-fristen` | `/rechner/schkg-fristen` | Betreibungs- & Konkursfristen (kurz: SchKG-Fristen) | «Fristen im Betreibungs- und Konkursverfahren mit Betreibungsferien (Art. 63 SchKG) und ZPO-Stillstand für gerichtliche Klagen.» | Betreibung & Konkurs (SchKG) | entwurf | Art. 56 SchKG · Art. 63 SchKG · Art. 145 ZPO |
| `betreibungskosten` | `/rechner/betreibungskosten` | Betreibungskosten (GebV SchKG) | «Amtliche Gebühren je Betreibungsschritt nach der bundesrechtlich abschliessenden GebV SchKG (Stand 1.1.2026, Tarif Wert für Wert amtlich verifiziert) …» | Betreibung & Konkurs (SchKG) | entwurf | Art. 16/20/30/48 GebV SchKG · Art. 68 SchKG |
| `kuendigung-sperrfristen` | `/rechner/kuendigung#kuendigung` | Kündigung & Fristen im Arbeitsverhältnis | «Ordentliche Kündigungsfristen und Sperrfristen (Kündigung zur Unzeit) im Arbeitsverhältnis – mit Direkteinstieg zu den Kündigungsschreiben (Arbeitnehmer:in/Arbeitgeber:in).» | Arbeit | entwurf | Art. 335c OR · Art. 336c OR |
| `mietrecht` | `/rechner/mietrecht` | Kündigung & Fristen im Mietverhältnis | «Kündigungstermine und -fristen für Wohn- und Geschäftsräume – mit Termin-Hierarchie, Formprüfung und ausserordentlichen Kündigungen; Direkteinstieg zum Kündigungsschreiben (Mieter:in) und zur Vermieter-Checkliste (amtliches Formular).» | Miete | entwurf | Art. 266a–o OR · Art. 257d OR · Art. 257f OR |
| `beschwerde-verwaltung` | – (Stub) | Verwaltungs- & Steuerverfahren – Fristen | «Einsprache- und Beschwerdefristen im Verwaltungs- und Steuerverfahren – nicht eidgenössisch vereinheitlicht; kantonale Vielfalt wird gekennzeichnet.» | Verwaltungsrecht | geplant | – |
| `sozialversicherung` | – (Stub) | Sozialversicherung (ATSG) – Fristen | «Einsprache- und Beschwerdefristen sowie Leistungsverwirkung und Nachzahlung – IV, AHV, Unfall- und Krankenversicherung.» | Sozialversicherungsrecht | geplant | – |
| `verjaehrung` | `/rechner/verjaehrung` | Verjährung | «Ordentliche und kurze Verjährung sowie deliktische und bereicherungsrechtliche Ansprüche – mit Stillstand, Unterbrechung und Einredeverzicht.» | Vertrag & Forderung (OR) | entwurf | Art. 60 OR · Art. 67 OR · Art. 127–142 OR |
| `gewaehrleistung` | `/rechner/gewaehrleistung` | Gewährleistung & Mängelrüge | «Rüge- und Verjährungsfristen bei Kauf, Werkvertrag und Grundstückkauf – mit Zwei-Regime-Weiche zur Baumängel-Revision 2026.» | Vertrag & Forderung (OR) | entwurf | Art. 201/210/219a/367/371 OR |
| `verjaehrung-board` | `/rechner/verjaehrung-board` | Verjährungs- & Gewährleistungs-Board | «Die sechs Verjährungs-Regime auf einen Blick, der Gewährleistungs-Sonderfall (Rüge- und Verjährungsfristen bei Kauf/Werkvertrag) und die Brücke zur AT-Mechanik – internationaler Warenkauf (CISG) verlinkt.» | Vertrag & Forderung (OR) | entwurf | Art. 127/128/210/371 OR |
| `erbrecht-fristen` | `/rechner/erb-fristen` | Erbrecht – Fristen | «Ausschlagung, öffentliches Inventar sowie Ungültigkeits-, Herabsetzungs- und Erbschaftsklage – 15 Tatbestände mit exaktem Fristbeginn (Art. 521/533/567 ff. ZGB).» | Erbrecht | entwurf | Art. 567/580/521/533/600 ZGB |
| `familie-fristen` | – (Stub) | Familienrechtliche Fristen | «Fristen bei Scheidung und Anfechtung des Kindesverhältnisses.» | Familienrecht | geplant | – |
| `gesellschaftsrecht-fristen` | – (Stub) | Gesellschaftsrechtliche Fristen | «Einberufungs- und Traktandierungsfristen sowie Verjährung der Verantwortlichkeitsklage.» | Gesellschaftsrecht | geplant | – |
| `bgg-fristen` | `/rechner/bgg-fristen` | Beschwerde ans Bundesgericht (BGG) (kurz: BGG-Beschwerde) | «Weiterzug ans Bundesgericht für alle vier Beschwerdewege: Zulässigkeit (Streitwertgrenzen mit Ausnahmen), Frist 30/10/5/3 Tage mit Stillstand und konkretem Fristende, zuständige Abteilung – inkl. subsidiärer Verfassungsbeschwerde.» | Zivilprozess (ZPO) & Bundesgericht | entwurf | Art. 74/100/46/113 BGG · Art. 33 BGerR |
| `straf-verjaehrung` | – (Stub) | Strafrechtliche Verjährung | «Verfolgungs- und Vollstreckungsverjährung nach Strafrahmen.» | Strafrecht & Strafprozess | geplant | – |
| `verzugszins` | `/rechner/verzugszins` | Verzugszins | «Verzugszins bei Schuldnerverzug – Zeitraum, Satz und Betrag.» | Vertrag & Forderung (OR) | entwurf | Art. 104 OR |
| `inkasso-strecke` | `/rechner/inkasso-strecke` | Forderungs- & Inkasso-Strecke | «Die Schritte der Geldforderungs-Durchsetzung als stateless Strecke: Verzug (Art. 102 OR), Verzugszins (Art. 104 OR), Mahnung, Betreibung und Fristen – jeder Schritt mit dem zuständigen Werkzeug.» | Vertrag & Forderung (OR) | entwurf | Art. 102/104 OR · Art. 67 SchKG |
| `lohnfortzahlung` | `/rechner/kuendigung#lohnfortzahlung` | Lohnfortzahlung (kantonale Skala) | «Lohnfortzahlung bei unverschuldeter Verhinderung nach kantonaler Skala (Basel/Bern/Zürich).» | Arbeit | entwurf | Art. 324a OR |
| `erbteilung` | `/rechner/erbteilung` | Pflichtteil & verfügbare Quote | «Gesetzliche Erbteile, Pflichtteile und verfügbare Quote – mit Todesdatum-Weiche für die Revision 2023 und güterrechtlicher Vorstufe.» | Erbrecht | entwurf | Art. 457 ff. ZGB · Art. 470 f. ZGB |
| `prozesskosten` | `/rechner/prozesskosten` | Prozesskosten (Gerichts- & Parteikosten) | «Gerichtskosten (Entscheidgebühr) und Parteientschädigung im erstinstanzlichen Zivilprozess nach Streitwert – amtlich verifizierte Tarife aller 26 Kantone, mit interkantonaler Vergleichstabelle. Kostenlose Verfahren (Art. 113/114 ZPO) und Schlichtung/Entscheid berücksichtigt; Ermessenstarife als Spanne.» | Zivilprozess (ZPO) & Bundesgericht | entwurf | Art. 95/96/98/113/114 ZPO |
| `notariat-grundbuch` | `/rechner/notariat-grundbuch` | Notariats- & Grundbuchkosten | «Beurkundungs- und Grundbuchkosten aller 26 Kantone in drei Bereichen: Grundstückkauf (…), Beurkundung (Notariat) je Geschäftsart (…) und Grundbuch je Eintragungsart (…) – kantonale Tarife mit amtlicher Quelle, interkantonaler Vergleich. Rahmen-/Aufwandtarife (freies Notariat) ehrlich als Spanne. Doppelt verifiziert, nicht abgenommen.» | Immobilien & Beurkundung | entwurf | Art. 216 OR · Art. 499 ZGB · Art. 629 OR |
| `streitwert` | `/rechner/streitwert` | Streitwert (ZPO) | «Streitwert aus den Rechtsbegehren nach Art. 91–94a ZPO: Kapitalisierung wiederkehrender Leistungen (× 20, Leibrenten-Barwert als Weiche), Klagenhäufung mit Ausschliesslichkeits-Schalter, Widerklage mit getrennter Kosten-Bemessungsgrundlage und Teilklage-Sonderregel (Revision 2025). Ermessens-Konstellationen (…) werden offengelegt, nie geschätzt.» | Zivilprozess (ZPO) & Bundesgericht | entwurf | Art. 91/92/93/94 ZPO |
| `arbeit-entschaedigung` | – (Stub) | Arbeitsrechtliche Entschädigungen & Zuschläge | «Überstunden, Ferienlohn, 13. Monatslohn pro rata sowie Entschädigung bei missbräuchlicher oder fristloser Kündigung.» | Arbeit | geplant | – |
| `erb-ausgleichung` | – (Stub) | Erbrechtliche Ausgleichung & Güterrecht | «Ausgleichung und Hinzurechnung sowie güterrechtliche Auseinandersetzung als Vorstufe.» | Erbrecht | geplant | – |
| `mietzinsanpassung` | – (Stub) | Mietzinsanpassung (Referenzzinssatz) | «Anpassung des Mietzinses nach Referenzzinssatz, Teuerung und Kostensteigerung.» | Miete | geplant | – |
| `vorsorgeausgleich` | – (Stub) | Vorsorgeausgleich (BVG) bei Scheidung | «Teilung der während der Ehe geäufneten Austrittsleistungen der beruflichen Vorsorge.» | Familienrecht | geplant | – |
| `existenzminimum` | – (Stub) | Existenzminimum & Pfändungsquote | «Ermittlung des pfändbaren Betrags; Richtlinien- und kantonsabhängig.» | Betreibung & Konkurs (SchKG) | geplant | – |
| `zustaendigkeit` | `/rechner/zustaendigkeit` | Zuständigkeit Zivilprozess | «Welches Gericht und welches Verfahren im Zivilprozess: Verfahrensart, Schlichtungspflicht und -behörde, örtlicher Gerichtsstand nach ZPO sowie die Rechtsmittel-Strecke (Berufung/Beschwerde samt Fristen); konkrete Stelle mit Adresse für erfasste Kantone.» | Zivilprozess (ZPO) & Bundesgericht | entwurf | Art. 197/199/200/210/243 ZPO |
| `schkg-zustaendigkeit` | `/rechner/zustaendigkeit#schkg` | Zuständigkeit Vollstreckung (SchKG) | «Betreibungsort (Art. 46–55 SchKG), zuständige Stelle (Betreibungsamt, Gericht oder Aufsichtsbehörde) und Fristen je Anliegen – von der Einleitung der Betreibung bis zur Beschwerde gegen das Amt; konkrete Amtsadresse für erfasste Kantone.» | Betreibung & Konkurs (SchKG) | entwurf | Art. 46/84/17 SchKG |
| `straf-zustaendigkeit` | `/rechner/zustaendigkeit#straf` | Zuständigkeit Strafverfahren | «Örtlicher Gerichtsstand und zuständige Strafbehörde (Art. 31–42 StPO), Anzeige-Fahrplan sowie das statthafte Rechtsmittel mit Fristen (Art. 379 ff. StPO); Staatsanwaltschafts-Adresse für erfasste Kantone.» | Strafrecht & Strafprozess | entwurf | Art. 31 StPO · Art. 301 StPO |
| `verwaltung-zustaendigkeit` | – (Stub) | Zuständigkeit Verwaltungsverfahren | «Zuständige Behörde und Beschwerdeinstanz im Verwaltungsverfahren (VwVG/kantonal) – Einsprache, Beschwerde und Rechtsmittelweg.» | Verwaltungsrecht | geplant | – |
| `iprg` | – (Stub) | Anwendbares Recht (IPRG) | «Anwendbares Recht und Gerichtsstand bei internationalem Bezug.» | Weitere Rechtsgebiete | geplant | – |
| `tagerechner` | `/rechner/tagerechner` | Fristenrechner (Tage · ZPO · SchKG) | «EIN Fristenrechner für die meisten Verfahren: allgemeine Vertrags- und Verwirkungsfristen (…), Zivilprozess mit Stillstand nach Art. 145 ZPO sowie Betreibungsferien und Rechtsstillstand nach SchKG – getrennt gerechnete Engines, ein Einstieg.» | Übergreifende Werkzeuge | entwurf | Art. 77/78 OR · SR 173.110.3 · Art. 145 ZPO · Art. 56 SchKG |
| `ferien-checker` | – (Stub) | Gerichts- & Betreibungsferien-Checker | «Prüft, ob ein Datum in Gerichts- oder Betreibungsferien fällt.» | Übergreifende Werkzeuge | geplant | – |
| `teuerungsrechner` | `/rechner/teuerung` | Teuerungsrechner (LIK-Indexierung) | «Indexierung nach dem Landesindex der Konsumentenpreise mit amtlicher BFS-Reihe (…): Indexmiete mit 100-%-Weitergabe und Senkungspflicht, Unterhaltsbeiträge nach Urteilsklausel, generische Wertsicherung – Rechenweg und Quelle vollständig offengelegt.» | Übergreifende Werkzeuge | entwurf | Art. 269b OR · Art. 17 VMWG · Art. 286/128 ZGB |
| `gerichtszitat` | `/rechner/gerichtszitat` | Amtlicher Zitierer (BGE/BGer) | «Fundstellen bundesgerichtlicher Entscheide nach der Zitierkonvention formatieren: BGE (Band · Teil · Seite) und nicht publizierte Urteile (Geschäftsnummer · Datum), mit Erwägungsangabe. Reine Zitierhilfe – prüft nicht, ob der Entscheid existiert.» | Übergreifende Werkzeuge | entwurf | Art. 112 BGG |
| `ferien-assistent` | – (Stub) | Friststillstand- & Ferien-Assistent (alle Verfahren) | «Stillstand und Gerichts-/Betreibungsferien über ZPO, StPO, BGG und Verwaltungsverfahren.» | Übergreifende Werkzeuge | geplant | – |
| `bundesgerichtsgebuehren` | – (Stub) | Bundesgerichtsgebühren | «Gerichtsgebühren der eidgenössischen Gerichte nach Streitwert und Verfahrensart.» | Zivilprozess (ZPO) & Bundesgericht | geplant | – |
| `kostenvorschuss` | – (Stub) | Kostenvorschuss | «Vorschuss auf die Gerichtskosten im Zivilprozess.» | Zivilprozess (ZPO) & Bundesgericht | geplant | – |
| `parteientschaedigung-sicherheit` | – (Stub) | Sicherheit für die Parteientschädigung | «Sicherstellung der Parteientschädigung bei besonderen Risiken auf Klägerseite.» | Zivilprozess (ZPO) & Bundesgericht | geplant | – |
| `rechtsmittelpruefung` | – (Stub) | Rechtsmittelprüfung | «Welches Rechtsmittel gegen welchen Entscheid offensteht – Weg, Instanz und Anforderungen.» | Zivilprozess (ZPO) & Bundesgericht | geplant | – |
| `ferienanspruch` | – (Stub) | Ferienanspruch | «Ferienguthaben nach Alter, Pensum und Ein- oder Austritt im Dienstjahr.» | Arbeit | geplant | – |
| `ferienkuerzung` | – (Stub) | Ferienkürzung | «Kürzung des Ferienanspruchs bei längeren Absenzen.» | Arbeit | geplant | – |
| `dreizehnter-monatslohn` | – (Stub) | Anteiliger 13. Monatslohn | «Pro-rata-Anteil des 13. Monatslohns bei unterjährigem Ein- oder Austritt.» | Arbeit | geplant | – |
| `ueberstunden-zuschlag` | – (Stub) | Überstunden- & Überzeitzuschlag | «Vergütung von Überstunden und Überzeit samt Zuschlägen.» | Arbeit | geplant | – |
| `schadenszins` | – (Stub) | Schadenszins | «Zins auf Schadenersatzforderungen vom Schadenseintritt bis zur Zahlung.» | Vertrag & Forderung (OR) | geplant | – |
| `gueterrecht-vorschlag` | – (Stub) | Güterrechtliche Auseinandersetzung / Vorschlag | «Aufteilung von Errungenschaft und Vorschlag bei Auflösung des Güterstands.» | Familienrecht | geplant | – |
| `beteiligungsquoten` | – (Stub) | Beteiligungs- & Stimmrechtsquoten | «Kapital- und Stimmenanteile sowie Schwellen für Beschlüsse und Rechte.» | Gesellschaftsrecht | geplant | – |
| `liberierungsgrad` | – (Stub) | Liberierungsgrad | «Einbezahltes Kapital im Verhältnis zum Nennkapital.» | Gesellschaftsrecht | geplant | – |
| `kapitalverlust` | – (Stub) | Kapitalverlust | «Feststellung eines Kapitalverlusts und der daran geknüpften Handlungspflichten.» | Gesellschaftsrecht | geplant | – |
| `ueberschuldung` | – (Stub) | Überschuldung | «Prüfung der Überschuldung und der Pflichten des Verwaltungsrats.» | Gesellschaftsrecht | geplant | – |
| `baurecht-fristen` | – (Stub) | Bau- & planungsrechtliche Fristen | «Einsprache- und Beschwerdefristen in Bau- und Planungsverfahren.» | Verwaltungsrecht | geplant | – |
| `vergabe-fristen` | – (Stub) | Vergaberechtliche Beschwerdefristen | «Fristen im öffentlichen Beschaffungswesen.» | Verwaltungsrecht | geplant | – |
| `steuer-verjaehrung` | – (Stub) | Steuerrechtliche Verjährung | «Veranlagungs- und Bezugsverjährung im Steuerrecht.» | Steuerrecht | geplant | – |
| `verrechnungssteuer` | – (Stub) | Verrechnungssteuer | «Abzug und Rückerstattung der Verrechnungssteuer.» | Steuerrecht | geplant | – |
| `grundstueckgewinnsteuer` | – (Stub) | Grundstückgewinn- & Handänderungssteuer (kantonal) | «Kantonale Steuern bei der Veräusserung von Grundstücken.» | Steuerrecht | geplant | – |
| `ahv-beitraege` | – (Stub) | AHV-Beiträge | «Beiträge an AHV/IV/EO für Angestellte, Selbständige und Nichterwerbstätige.» | Sozialversicherungsrecht | geplant | – |
| `datenschutz-fristen` | – (Stub) | Datenschutzrechtliche Fristen | «Fristen rund um Auskunft, Meldung und Aufbewahrung.» | Datenschutzrecht | geplant | – |
| `auslaenderrecht-fristen` | – (Stub) | Ausländer- & asylrechtliche Fristen | «Fristen in ausländer- und asylrechtlichen Verfahren.» | Ausländerrecht | geplant | – |
| `checklisten` | – (Stub) | Checklisten | «Strukturierte Prüf- und Arbeitslisten für wiederkehrende Abläufe.» | Übergreifende Werkzeuge | geplant | – |
| `mandatsaufnahme` | – (Stub) | Mandatsaufnahme-Formular | «Strukturierte Erfassung der Eckdaten eines neuen Mandats.» | Übergreifende Werkzeuge | geplant | – |
| `kostenblatt-export` | – (Stub) | Kostenblatt-Export | «Zusammenstellung von Kosten und Auslagen als Exportblatt.» | Übergreifende Werkzeuge | geplant | – |

**Rechnerei dazu.** 62 Katalogkarten mit `modus: 'rechner'` (aus drei
Karten-Modulen, nachgezählt 22.9.2026). 23 Karten tragen ein `href` — auf **20 eindeutige Routen**, weil
sich zwei Karten-Gruppen je einen Rechner mit unterschiedlichem URL-Anker teilen:
`kuendigung-sperrfristen` und `lohnfortzahlung` zeigen beide auf `/rechner/kuendigung`;
`zustaendigkeit`, `schkg-zustaendigkeit` und `straf-zustaendigkeit` zeigen alle auf
`/rechner/zustaendigkeit`. 39 Karten sind `geplant` und rendern unter `/rechner/<id>`
den Stub.

**Quelle:** `src/lib/startseiteKartenFristen.ts`,
`src/lib/startseiteKartenBetraegeWerkzeuge.ts`, `src/lib/startseiteKartenAusbau.ts`
(zusammengeführt in `src/lib/startseiteKarten.ts`, Typen in
`src/lib/startseiteConfigTypen.ts`); Routen `src/routesManifest.ts`; zweite
Metadatenliste `src/lib/calculators.ts`.

### 4.2 Rechner-Übersicht (`/rechner`)

**Zweck.** Einstiegs- und Suchseite für alle Rechner: drei Rechner-Oberkategorien als
vollständige Sektionen auf einer Seite, plus ein zweiachsiger Themen-Einstieg
(Rechtsgebiet × Aufgabe).

**Elemente** (Reihenfolge):

1. Seitenkopf — Titel «Rechner», Ausgabe-Zeile «23 Rechner nach Rechtsgebiet und nach
   Aufgabe» (Zahl aus dem generierten Zähler — das sind die 23 Karten mit `href`,
   nicht die 20 Routen).
2. Filterzeile: Label «Filtern», Suchfeld vom Typ Suche mit Platzhalter «Titel,
   Rechtsgebiet oder Norm …», daneben die **Entwurf-Legende** (Zeichenerklärung der
   Status-Badges, siehe 6.4).
3. **Zweiachsiger Einstieg** — nur im ungefilterten Zustand.
4. Je Kategorie eine Kategorie-Sektion mit den zugehörigen Karten.
5. Leerzustand bei aktivem Filter ohne Treffer: «Kein Rechner für «{q}» gefunden.»
   mit Weiterweg «Filter zurücksetzen».
6. Nur ungefiltert: Abschnitt **«Werkzeuge»** mit der Zeiterfassungs-Komponente, der
   Liste «Massgebende Gesetze» (Modus Rechner) und dem Katalog-Hinweis.

**Eingaben & Interaktionen.** Tippen im Suchfeld filtert **client-seitig sofort**
(kein Absenden), mit derselben Treffer-Logik wie die Kopf-Suche. Bei aktivem Filter
werden nur Kategorien mit Treffern gezeigt, und deren «In Vorbereitung»-Klappelemente
öffnen sich automatisch. «Filter zurücksetzen» leert das Suchfeld.

**Zustände.** Ungefiltert (Vollansicht mit zweiachsigem Einstieg) · gefiltert mit
Treffern (nur passende Kategorien, geöffnete Klappelemente) · gefiltert ohne Treffer
(Leerzustand).

**Persistenz.** Keine (Filter lebt im Komponenten-Zustand).

**Quelle:** `src/pages/RechnerUebersicht.tsx`; Kategorien `src/lib/oberkategorien.ts`;
Trefferlogik `src/lib/katalogSuche.ts`; Kategorie-Filter `src/lib/katalogKategorie.ts`;
`src/components/{Katalog,KatalogHinweis,ZweiachsigerEinstieg,EntwurfLegende}.tsx`.

### 4.3 Gemeinsamer Rechner-Rahmen

Verbindliche Reihenfolge und Bausteine laut `DESIGN-REGLEMENT.md` §R (§R-1–§R-14).
Jeder der 20 Rechner folgt diesem Schema oder ist eine **deklarierte** Ausnahme (R12).

#### R1 — Seiten-Skelett (fix)

1. **Rechner-Kopf** (Überschrift, Kategorie-Overline, Kurzbeschrieb, Norm-Chips) —
   **immer**.
2. **Tagerechner-Rückverweis** — nur bei materiellen Fristen-Spezialrechnern
   (Kündigung, Erb-Fristen, Mietrecht, Verjährung, Gewährleistung).
   Verfahrens-Regime-Rechner (ZPO, SchKG) und Beträge-/Zuständigkeits-Rechner tragen
   ihn **nicht** (R2).
3. **Werkzeug-Karte** mit genau **einem** Formular (oder einer Reiter-Weiche über
   Teil-Formulare).
4. **Ereignis-Fristen-Sektion** — nur auf den Seiten, die ein auslösendes Ereignis
   berechnen (ZPO, SchKG, Erb-Fristen, Kündigung; R9).
5. **Themen-Einstieg** — nur wenn passende Vorlagen existieren (R10).

#### R3 — Formular-Skelett (fix)

Pflicht-Disclaimer (immer zuoberst) → Anwendungsfall bzw. Preset (falls vorhanden) →
Eingabe-Felder (zweispaltiges Raster ab dem kleinen Breakpoint, je in einem
Feld-Rahmen) → optionales Akkordeon «Optionale Funktionen (…)» (falls vorhanden) →
**Fehlerbox** (die einzige Fehlerdarstellung) → Ergebnisblock (nur wenn ein Ergebnis
vorliegt). Beispiel-Chips stehen, wo vorhanden, zwischen Preset und Eingaben.
**Das Aktenzeichen ist kein Eingabefeld des Falls** — es steht im Ergebnisblock.

#### R4 — Ergebnisblock-Skelett (fix)

1. **Eckdaten-Kacheln** (höchstens 3; die Kachel des massgeblichen Werts trägt die
   Messing-Oberkante, ein Sperr- oder Nichtig-Fall die Gefahr-Oberkante).
2. **Ergebnis-Anzeige**: Status-Badge → Hauptsatz → Vorbehalte/Warnungen → Rechenweg →
   Annahmen → Normverweise → Volltext-Disclaimer.
3. **Visualisierung** (Fristenkalender · Kündigungs-Zeitstrahl · Verzugszins-Zeitstrahl ·
   Erben-Tabelle/Quoten-Balken u. a.) — falls vorhanden.
4. **Begründungs-Absatz** — zitierfähiger Fliesstext.
5. **Aktenzeichen-Feld**.
6. **Export-Zeile** (R5).
7. **Quellen-Mikrozeile** — nur bei amtlicher Datenquelle (z. B. BFS/LIK).

#### R5 — Export-Zeile

Feste Reihenfolge **PDF → ICS → Teilen** in einer Zeile. Jeder Rechner mit
PDF-Export hat ein Aktenzeichen-Feld.

#### R6 — Hierarchie der Rechtsinformation

Verdikt (Status-Badge + vollständiger Satz) → Vorbehalte/Warnungen (bei Status
≠ «ok» standardmässig aufgeklappt) → Rechenweg (einklappbar; ein Schritt =
Beschreibung + Zwischenergebnis + Normen) → Annahmen (einklappbar) → Normverweise
(immer als Norm-Chips, nie als blosser Text) → Begründungs-Absatz.

#### R7 — Disclaimer-Zweistufigkeit

Der Pflicht-Disclaimer erhält einen rechtsgebietsspezifischen Kurzsatz **und** den
Volltext (der auch in die PDF-Konfiguration geht); der Klappkasten trägt die
Zusammenfassung «Rechtlicher Hinweis – keine Rechtsberatung».

#### R8 — Fehleranzeige

Eingabe- und Berechnungsfehler ausschliesslich über die **Fehlerbox** (mit
Alarm-Rolle), zwischen Eingaben und Ergebnisblock. **Fachliche Hard-Stops der Engine**
(Status `nichtig`/`unzulaessig`) sind **keine** Fehler — sie laufen als Verdikt durch
die Ergebnis-Anzeige.

#### R9 — Ereignis-Fristen-Regel

Die Ereignis-Fristen-Sektion (ein Ereignis → mehrere parallele Fristen als Tabelle)
steht auf der Seite des Rechners, der das auslösende Ereignis berechnet: ZPO
(Zivilentscheid, Klagebewilligung) · SchKG (Zahlungsbefehl) · Erb-Fristen (Erbgang) ·
Kündigung (Art. 336b OR). **Es gibt keinen zentralen Fristenspiegel.**

#### R10 — Themen-Einstieg

Wo passende Vorlagen existieren, steht nach der Werkzeug-Karte genau **ein**
Themen-Einstieg (Label + Direktlinks), nie ein frei formatierter Link-Absatz.

#### R12 — Deklarierte Ausnahmen

- Der **Schnellrechner** des Tagerechners ist bewusst minimal: keine
  Eckdaten-Kacheln, kein PDF (sein PDF-Fall ist der jeweilige Regime-Voll-Rechner),
  aber derselbe Ergebnis-Rahmen.
- Die **Ereignis-Fristen-Sektion** listet als Tabellenmuster (je Frist eine Zeile mit
  ICS), ohne Verdikt der Ergebnis-Anzeige.
- Das **Zuständigkeits-Trio** (Zivil/SchKG/Straf) nutzt Wizard-Schritte statt eines
  Eingabe-Rasters; ab dem Ergebnisblock gilt R4 unverändert.
- Der **amtliche Zitierer** liefert bewusst **kein** Berechnungsergebnis (reiner
  Formatierer) — keine Ergebnis-Anzeige, kein PDF-Export.

#### R13 — Leerzustand des Ergebnisplatzes

Ein Rechner, der ohne Eingabe kein Ergebnis zeigen kann, zeigt an dessen Stelle einen
**Ergebnis-Platzhalter** (Overline «Ergebnis» plus ein Satz, welche Eingabe fehlt).
Er reserviert die Fläche gegen Layout-Sprünge und zeigt **vor der ersten Eingabe
keinen Fehler**. Belegt in: Streitwert, Betreibungskosten, Prozesskosten,
Notariat/Grundbuch, Gerichtszitat.

#### R14 — Repeater

Jede wiederholbare Eingabezeile (Teilzahlungen, Unterbrechungen, Stämme, Begehren,
Sperrereignisse …) kommt aus dem geteilten **Listen-Editor**: Behälter, Kopfzeile
«‹Element› N» plus roter Text-Link «entfernen», Knopf «+ ‹Element›» unter der Liste.

#### 4.3.1 Weitere geteilte Rechner-Bausteine

- **Kein Eingabefehler vor der ersten Eingabe.** Ein Berührt-Rahmen hält den Kontext
  «berührt» auf falsch, bis das erste Eingabe- oder Änderungs-Ereignis im Formular
  feuert; die Fehlerbox rendert vorher nichts (Grundsatz David 14.6.2026). Detail 6.7.
- **Live-Berechnung ohne «Berechnen»-Knopf.** Alle Formulare rechnen bei jeder
  Eingabeänderung sofort neu (kein Absenden); eine Live-Kopfzeile zeigt im
  Ergebnisblock «Live-Berechnung – aktualisiert sich automatisch».
- **Permalink / «Link teilen».** Der Fall wird als kurzer Query-String in die Adresse
  geschrieben (je Rechner eine eigene Kodier-Spezifikation). Seit LM-205 schreibt
  **jede Eingabeänderung** die URL bereits live (entprellt, ohne Verlaufseintrag,
  kein Klick nötig); der Knopf kopiert zusätzlich den vollständigen Link. Kein
  Tracking, keine Server-Persistenz — nur die (flüchtige) Adressleiste.
- **PDF-Export.** Der Renderer wird erst beim Klick nachgeladen. Konfiguration je
  Rechner (Titel, Domäne, Eingaben, Ergebnis-Sektionen, Disclaimer, optionales
  Aktenzeichen und Hero). Knopftext **«PDF-Rechenbericht»**, während des Ladens
  **«PDF wird erstellt …»** (deaktiviert, als beschäftigt ausgezeichnet); ein
  Fehlschlag zeigt die Fehlerbox.
- **ICS-Export** (RFC 5545). Beschriftung **«In Kalender (.ics)»**; rendert nur bei
  gültigem ISO-Datum. Standard-Vorfrist-Alarm 3 Tage (0 bei «frühestens neu
  kündbar»-Fällen). Trägt Aktenzeichen und Rücklink (dieselbe Permalink-Kodierung wie
  «Link teilen») im Kalendereintrag mit.
- **Reset.** **Kein eigener «Zurücksetzen»-Knopf irgendwo im Rechner-Bestand.** Der
  einzige Weg zu den Vorgabewerten ist ein Beispiel aus den Beispiel-Chips, ein neuer
  Permalink oder ein Seiten-Neuladen. Siehe Nebenfund N7.
- **Beispiele und Presets** sind zwei getrennte Mechaniken: **Beispiel-Chips**
  (Beschriftung «Beispiel laden:») setzen den kompletten Formularzustand;
  **Preset-Aufklapplisten** (ZPO und SchKG: «Frist-Vorlage») setzen mehrere Felder
  inklusive Norm-Hinweis.
- **Feldtypen.** Datumsfeld (Texteingabe TT.MM.JJJJ plus aufklappbarer Kalender, Wert
  intern ISO `yyyy-MM-dd`) · Betragsfeld (CHF-Tausenderapostroph live beim Tippen,
  liefert den bereinigten Rohwert) · native Auswahllisten für feste Optionslisten ·
  native Zahlenfelder für ganzzahlige und Dezimal-Werte ohne CHF-Formatierung.
  Volle Beschreibung: 6.2.
- **Kalender-Visualisierung.** Der **Fristenkalender** (Monatsraster mit Fristband,
  Doppelring-Marker für das Fristende, Schraffur für Gerichts- und Betreibungsferien)
  ist die eine geteilte Komponente für alle Fristen-Rechner sowie — in der kompakten
  Variante — für den Schnellrechner des Tagerechners.

**Quelle:** `DESIGN-REGLEMENT.md` §R, `src/components/vorlagen/ui.tsx`,
`src/components/{PdfExport,IcsExportButton,LinkTeilenButton,AktenzeichenFeld,DatumsFeld,BetragsFeld,FristenKalender}.tsx`,
`src/lib/{permalink,icsExport}.ts`, `src/lib/pdf/pdfRender.ts`.

**Die 20 gebauten Rechner im Einzelnen.** Reihenfolge wie in der Recherche; jeder
Block trägt Zweck, Struktur, Eingaben (vollständig), Ausgaben, besondere Zustände,
Exporte, Status und Quelle.

### 4.4.1 `/rechner/kuendigung` — Kündigung & Fristen im Arbeitsverhältnis

**Zweck.** Drei Berechnungsmodi zur Beendigung eines Arbeitsverhältnisses:
Lohnfortzahlung bei Verhinderung, ordentliche Kündigung mit Sperrfristen, und eine
kombinierte Ansicht beider.

**Struktur.** Rechner-Kopf → Tagerechner-Rückverweis → Reiter-Leiste (zweizeilige
Variante): **«A – Lohnfortzahlung»** (Art. 324a OR) · **«B+C – Kündigung»**
(Art. 335c/336c OR) · **«Kombiniert»** (A+B+C) → je Reiter ein Formular in einer
Karte → Ereignis-Fristen-Sektion (Ereignis Arbeitgeberkündigung, Anker
`#ereignis-336b`) → Themen-Einstieg **«Kündigungsschreiben erstellen:»** mit Links zu
`/vorlagen/kuendigung-arbeitnehmer` und `/vorlagen/kuendigung-arbeitgeber`. Die Anker
`#lohnfortzahlung` und `#kuendigung` wählen den Reiter vor.

#### Reiter A — Lohnfortzahlung

**Eingaben:**

- Vertragsbeginn (Datum, Pflicht)
- Beginn der Arbeitsverhinderung (Datum, Pflicht, Hinweis «Stichtag für
  Dienstjahr-Berechnung»)
- Verhinderungsgrund (Auswahl: Krankheit · Unfall (UVG) · Schwangerschaft
  (Art. 324a Abs. 3) · Militär-/Zivil-/Schutzdienst (EO) · Öffentliches Amt · Übrige
  persönliche Gründe)
- Kanton (Auswahl, 26 Kantone, Hinweis «BS/BL → Basler Skala · ZH/SH/TG → Zürcher
  Skala · Übrige → Berner Skala»)
- Arbeitsunfähigkeit (%) (Zahl 1–100, Schritt 5)
- Monatslohn brutto (CHF, optional, Betragsfeld)
- Beschäftigungsgrad/Pensum (%) (Zahl 1–100, Schritt 5)
- KTG-Versicherung gleichwertig? (Radio: Nein (Skala gilt) / Ja (KTG-Regime,
  Art. 324b OR))
- Bei «Ja»: Gleichwertigkeits-Checkliste (Art. 324a Abs. 4 OR) — Taggeld (% des
  Lohnes, Richtwert ≥ 80 %), Leistungsdauer (Tage, Richtwert ≥ 720), Karenzfrist
  (Tage, max. 3), Arbeitgeber-Prämienanteil (%, mind. 50 %), Ankreuzfelder
  «Schriftlich/in GAV-NAV vereinbart» und «Alle relevanten Risiken abgedeckt»
- Akkordeon **«Erweiterte Eingaben (Anspruch, DJ-übergreifend, Lohnbasis)»**: Ende der
  Verhinderung (optional) · Bereits bezogene Tage im laufenden Dienstjahr (optional) ·
  Ende des Arbeitsverhältnisses (optional) · Vereinbarte Kündigungsfrist in Monaten
  (optional) · Anrechenbare Vordienstzeit in Monaten (optional) · Ankreuzfelder
  «Befristeter Vertrag fester Dauer > 3 Monate» und «13. Monatslohn (anteilig)
  berücksichtigen»
- 4 Beispiel-Chips: «Krankheit 3. DJ (BS)» · «Teil-AUF 50 %» · «DJ-übergreifend» ·
  «KTG vorhanden»

**Ausgaben.** Ergebnis-Anzeige «Lohnfortzahlung (Art. 324a OR)»; bei Status «ok» mit
Zeitraum ein Fristenkalender (Labels «Beginn der Verhinderung» / «Letzter bezahlter
Tag», ohne Feiertags- und Stillstand-Schraffur); Begründungs-Absatz;
Aktenzeichen-Feld; Export-Zeile PDF + Teilen (**kein ICS**).

#### Reiter B+C — Kündigung

**Eingaben:**

- Vertragsbeginn (Datum)
- Zugang der Kündigung (Empfänger) (Datum, Hinweis «Stichtag für Dienstjahr und
  Sperrfrist-Prüfung»)
- Kündigende Partei (Auswahl: Arbeitgeber / Arbeitnehmer)
- Probezeit in Monaten (Zahl 0–3)
- Abweichende Frist in Monaten (optional, Zahl, Platzhalter «Leer = gesetzliche
  Frist»); bei gesetztem Wert: Ankreuzfelder «Schriftlich / GAV / NAV» und «Quelle GAV»
- Nur bei Arbeitgeber-Kündigung: Urlaub des andern Elternteils (Art. 329g) – nicht
  bezogene Tage (optional, Zahl)
- Kündigungstermin (Radio: Monatsende (Standard) / Freies Datum)
- **Sperrereignisse (Art. 336c OR)** (Listen-Editor): Typ-Auswahl aus 8 Optionen —
  Krankheit/Unfall lit. b · Schwangerschaft lit. c · Verlängerter Mutterschaftsurlaub
  lit. cbis · Zusatzurlaub Tod des anderen Elternteils lit. cter · Urlaub nach Tod der
  Mutter lit. cquinquies · Militär/Zivildienst lit. a · Hilfsaktion lit. d ·
  Betreuungsurlaub lit. cquater/Art. 329i — je Ereignis Von/Bis-Datum; bei zwei Typen
  zusätzlich ein Niederkunftsdatum

**Ausgaben.** Bei Status «nichtig» drei Kacheln (Status **«NICHTIG»** mit
Gefahr-Akzent, Beendigungsdatum «– (keines)», Frühestens neu kündbar); sonst drei
Kacheln (Status «Gültig», Beendigungsdatum mit Messing-Akzent, Hemmung in Tagen). Bei
vorhandenen Sperrereignissen ein Hinweis-Kasten **«Querverbindung: Art. 336c ↔
Art. 324a»**. Dann Ergebnis-Anzeige · Kündigungs-Zeitstrahl (Zugang, Sperrfrist-Band,
Beendigung bzw. «frühestens neu kündbar») · Sperrtage-Zähler (Kontingent-Füllbalken je
Ereignistyp, sofern Sperrtage vorliegen) · Begründungs-Absatz · Aktenzeichen-Feld ·
Export-Zeile PDF + ICS (bei Nichtigkeit: Titel «Frühestens neu kündbar», keine
Vorfrist-Erinnerung; sonst «Beendigung Arbeitsverhältnis») + Teilen. Bei gültiger
Arbeitgeberkündigung zusätzlich ein Link «336b-Fristen (Einsprache & Klage) unten
anzeigen →» zum Ereignis-Block.

#### Reiter Kombiniert

Dieselben Eingaben wie A und B+C in einem Formular (eigener Zustand, eigene
Vorgabewerte); rechnet Lohnfortzahlung **und** Sperrfristen aus denselben Eingaben.
Die Ausgabe vereint beide Module (Zeitstrahl, Kalender, Sperrtage-Zähler) in einem
Block.

**Besondere Zustände.** Status-Badges «Gültig» / «NICHTIG»; Warnhinweis
«Querverbindung Art. 336c ↔ Art. 324a» (die beiden Fristen sind unabhängig);
Ereignis-Block «336b-Fristen» nur nach gültiger Arbeitgeberkündigung mit
Beendigungsdatum.

**Exporte.** Reiter A: PDF, Teilen. Reiter B+C und Kombiniert: PDF, ICS, Teilen.

**Status.** entwurf (Katalogkarten `kuendigung-sperrfristen`, `lohnfortzahlung`).

**Quelle.** `src/pages/RechnerKuendigung.tsx`;
`src/components/forms/{LohnfortzahlungForm,KuendigungSperrForm,KombinierteAnsicht,SperrereignisseEditor}.tsx`;
Engines `src/lib/lohnfortzahlung.ts`, `src/lib/sperrfristen.ts`.

### 4.4.2 `/rechner/zpo-fristen` — Verfahrens- & Rechtsmittelfristen (ZPO)

**Zweck.** Fristende im Zivilprozess berechnen: freie Eingabe oder Presets je
Verfahrensphase, inklusive Gerichtsferien-Stillstand, Zustellfiktion-Helfer und
Erstreckung.

**Struktur.** Rechner-Kopf → Karte mit dem ZPO-Fristen-Formular →
Ereignis-Fristen-Sektion (Ereignisse Zivilentscheid, Klagebewilligung) →
Themen-Einstieg **«Frist reicht nicht aus:»** → `/vorlagen/fristerstreckung`.

**Eingaben:**

- **Verfahrensphase** (Reiter) — bestimmt die Preset-Liste darunter. Der Sonderwert
  «materiell» zeigt statt des Formulars einen Warnhinweis «Materielle Frist – nicht von
  diesem Rechner erfasst».
- **Frist-Vorlage** (Auswahl, optional): «– Vorlage wählen (oder manuell unten) –»
  plus Presets «Label · Norm» je Phase (z. B. Berufungs- und Beschwerdefristen
  Art. 311/314/321 ZPO, Klagebewilligung Art. 209 ZPO). Bei Wahl erscheint ein
  Hinweis-Kasten mit dem Preset-Text.
- **Auslösendes Ereignis** (Datum) — Hinweis «Zustellung/Eröffnung der
  fristauslösenden Mitteilung»
- **Länge** (Zahl, ganzzahlig > 0) + **Einheit** (Auswahl: Tage / Wochen / Monate /
  Jahre) in einem zusammengesetzten Feld
- **Verfahrensart** (Auswahl: Ordentliches Verfahren · Vereinfachtes Verfahren ·
  Familienrechtliches Verfahren (nicht summarisch) · Klagefrist nach Klagebewilligung
  (Art. 209) · Schlichtungsverfahren · Summarisches Verfahren · Rechtsmittel gegen
  summarischen Entscheid) — der Hinweis zeigt live, ob Stillstand gilt
- Bei stillstandsfreier Verfahrensart: Ankreuzfeld «Hinweis des Gerichts auf
  Nichtgeltung des Stillstands? … Gericht hat hingewiesen (sonst gilt der Stillstand
  gleichwohl)» (Art. 145 Abs. 3 ZPO)
- **Gerichtsort (Kanton)** (Auswahl, 26 Kantone)
- **Fristnatur** (Auswahl: Gesetzliche Frist / Gerichtliche Frist)
- **Zustellart** (Auswahl, optional: Gegen Empfangsbestätigung (eingeschrieben/GU) /
  Gewöhnliche Post (A-/B-Post))
- Akkordeon **«Optionale Funktionen (Berechnungsmodus, Erstreckung,
  Zustellfiktion)»**: Berechnungsmodus (Auswahl, als «[UMSTRITTEN]» gekennzeichnet:
  Bundesgerichtliche Praxis (dies a quo = Ereignistag) / Mindermeinung (dies a quo =
  Folgetag) – Fristrisiko) · bei gerichtlicher Fristnatur Ankreuzfeld «Erstreckung
  berechnen (Art. 144 Abs. 2 ZPO)» mit Länge- und Einheit-Feldern (Tage/Wochen) ·
  Zustellfiktion-Helfer (Datum des erfolglosen Zustellversuchs + Knopf «→ als
  Ereignis übernehmen», Art. 138 Abs. 3 lit. a)

**Ausgaben.** Drei Eckdaten-Kacheln (Massgeblicher Ereignistag · Fristbeginn dies a
quo · Fristende dies ad quem mit «24.00 Uhr», akzentuiert); bei Erstreckung ein
grüner Hinweiskasten «Nach Erstreckung: …»; Ergebnis-Anzeige; Fristenkalender
(Ereignis, dies a quo, dies ad quem, Kanton, Stillstand-Schraffur); Begründungs-Absatz
mit Fristbeginn-Zusatz; Aktenzeichen-Feld; Export-Zeile PDF + ICS (Titel «Fristende –
<Preset-Label> (<Norm>)» bzw. generisch) + Teilen.

**Besondere Zustände.** Phase «materiell» blockiert das Formular vollständig (als
Status ausgezeichnet, **kein** Fehler); der Preset-Hinweis verschwindet, sobald die
Werte vom Preset abweichen.

**Exporte.** PDF, ICS, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerZpo.tsx`, `src/components/forms/ZpoFristenForm.tsx`,
Presets `src/lib/zpoPresets.ts`, Engine `src/lib/zpoFristen.ts`.

### 4.4.3 `/rechner/verzugszins` — Verzugszins

**Zweck.** Verzugszins auf einem Kapitalbetrag berechnen, inklusive Teilzahlungen und
Satzänderungen im Zeitverlauf.

**Struktur.** Rechner-Kopf → Karte mit dem Verzugszins-Formular. **Kein**
Tagerechner-Rückverweis, **kein** Themen-Einstieg auf dieser Seite — der Einstieg
«Mahnung erstellen» liegt stattdessen auf der Inkasso-Strecke.

**Eingaben:**

- Geschuldeter Betrag (CHF) (Betragsfeld, Hinweis «Verzugszins fällt nur auf dem
  tatsächlich geschuldeten Betrag an»)
- Zinssatz (%) (Zahl, Vorgabe 5, Schritt 0.25, Hinweis «Default 5 % (Art. 104 Abs. 1
  OR); z. B. ATSG 5 %, Steuern variabel»)
- Verzugsbeginn (Datum)
- Art des Verzugsbeginns (Auswahl: Mahnung – ab Erhalt (Art. 102 Abs. 1) · Verfalltag
  – Zins ab Folgetag (Art. 102 Abs. 2) · Klage/Betreibung – ab Zustellung)
- Stichtag (Berechnung bis) (Datum + Knopf «heute»)
- Grundlage des Zinssatzes (Auswahl: Gesetzlich – 5 % (Art. 104 Abs. 1) · Vertraglich
  höher (Art. 104 Abs. 2) · Kaufmännischer Diskonto (Art. 104 Abs. 3))
- Tageszählung (Auswahl: Tatsächliche Tage/365 (Zürcher Gerichtsrechner) ·
  Tatsächliche Tage/360 (Bankusanz) · 30E/360 (kaufmännisch))
- Rückständige Zins-/Rentenforderung? (Ankreuzfeld «Ja – Verzinsung erst ab
  Betreibung/Klage (Art. 105 Abs. 1 OR)»)
- **Teilzahlungen & Satzänderungen (Art. 85 OR)** (Listen-Editor mit zwei
  Hinzufügen-Knöpfen «+ Teilzahlung» / «+ Satzänderung»): je Zeile Typ (Teilzahlung
  (CHF) / Satzänderung (%)), Datum, Betrag bzw. neuer Satz
- 4 Beispiel-Chips: «Rechnung offen, 5 %» · «Mit Teilzahlung» · «Vertraglich 8 %» ·
  «Satzwechsel»

**Ausgaben.** Bei Status «ok» drei Eckdaten-Kacheln (Verzugszins gesamt, akzentuiert ·
Offenes Kapital · Total offen); bei getilgtem Zins ein Zusatzsatz mit Beträgen und
Tagen; Ergebnis-Anzeige; Verzugszins-Zeitstrahl (Segment je Zinssatz-Abschnitt plus
Balken mit Überzeile «Total offen: CHF …», der offenes Kapital gegen offenen Verzugszins
setzt — der Balken selbst trägt keine sichtbare Beschriftung);
Begründungs-Absatz; Aktenzeichen-Feld; Export-Zeile PDF + Teilen (**kein ICS**).

**Besondere Zustände.** Farbige Segmentierung des Zeitstrahls pro Zinssatz-Abschnitt
(kategoriale Farbreihe, **keine** Status-Aussage); «getilgt»-Segment bei vorzeitiger
Volltilgung.

**Exporte.** PDF, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerVerzugszins.tsx`,
`src/components/forms/VerzugszinsForm.tsx`, Engine `src/lib/verzugszins.ts`,
Visualisierung `src/components/VerzugszinsTimeline.tsx`.

### 4.4.4 `/rechner/gerichtszitat` — Amtlicher Zitierer (BGE/BGer)

**Zweck.** Reine Formatierungshilfe: setzt eine bundesgerichtliche Fundstelle nach der
Plattform-Zitierkonvention zusammen — **kein** Rechenergebnis, keine Recherche, keine
Existenzprüfung des Entscheids (deklarierte R12-Ausnahme).

**Struktur.** Rechner-Kopf → Karte mit dem Gerichtszitat-Formular. Keine
Ergebnis-Anzeige, kein PDF-Export, keine Ereignis-Fristen-Sektion, kein
Themen-Einstieg.

**Eingaben:**

- Typ-Auswahl (zwei Auswahlkacheln): **«BGE (amtliche Sammlung)»** (Leitentscheid:
  Band · Teil · Seite) / **«BGer (Geschäftsnummer)»** (Nicht publiziert: Nummer ·
  Datum)
- Bei BGE: Band (Text, numerisch, Platzhalter «140») · Teil (Auswahl aus den
  BGE-Teilen, Hinweis «z. B. III (Zivilrecht)») · Seite (Text, numerisch, Platzhalter
  «409»)
- Bei BGer: Geschäftsnummer (Text, Platzhalter «5A_691/2023») · Urteilsdatum
  (Datumsfeld)
- Erwägung (Text, optional, Platzhalter «4.3», Hinweis «erscheint als «E. 4.3»»)

**Ausgaben.** Bei ungültiger Eingabe die Fehlerbox mit den Meldungen aus der Engine.
Ohne Ergebnis und ohne Fehler der Ergebnis-Platzhalter: «Band und Seite (bzw.
Geschäftsnummer und Datum) eingeben — hier erscheint die formatierte Fundstelle.» Bei
Erfolg ein Panel mit Overline **«Fundstelle»**, dem formatierten Zitat (Monospace,
Ziffern) und einem Kopier-Knopf **«Fundstelle kopieren»**; optional eine «Langform»
mit eigenem Kopier-Knopf; darunter Hinweistexte aus der Engine.

**Besondere Zustände.** Keine — reiner Formatierer, keine kantonalen Weichen.

**Exporte.** Nur Kopieren (kein PDF, kein ICS, kein Teilen). **Status.** entwurf.

**Quelle.** `src/pages/RechnerGerichtszitat.tsx`,
`src/components/forms/GerichtszitatForm.tsx`, Engine `src/lib/gerichtszitat.ts`.

### 4.4.5 `/rechner/verjaehrung-board` — Verjährungs- & Gewährleistungs-Board

**Zweck.** Übersichts-«Board»: Rückgrat ist eine **statische** Regime-Tabelle der
sechs OR-Verjährungsfristen, darunter der interaktive Gewährleistungs-Rechner als
eingebettetes Formular. Reine Darstellung auf bestehenden Engines, **keine eigene
Rechtslogik**.

**Struktur.** Rechner-Kopf → Karte 1 **«Übersicht»**: Tabelle der sechs Regime +
Hinweiskasten **«Verzahnung: Rügefrist ↔ Verjährung»** + Hinweiskasten
**«Internationaler Warenkauf»** (Link auf CISG SR 0.221.211.1 bei Fedlex, nur Link) →
Karte 2 **«Sonderfall Kauf / Werkvertrag»** mit dem eingebetteten
Gewährleistungs-Formular.

**Eingaben.** Keine eigenen — die Tabelle ist statisch; alle Eingaben laufen über das
eingebettete Gewährleistungs-Formular (4.4.12).

**Ausgaben.** Tabelle mit den Spalten **Anspruchstyp · Relative Frist · Absolute
Frist · Fristbeginn · Normen** (als Norm-Chips), Zeilen: Ordentliche Forderung (10 J.) ·
Katalogforderung (5 J.) · Unerlaubte Handlung (3/10 J.) · Unerlaubte Handlung
Personenschaden (3/20 J.) · Vertraglicher Personenschaden (3/20 J.) · Ungerechtfertigte
Bereicherung (3/10 J.). Darunter die vollständige Ausgabe des Gewährleistungs-Rechners.

**Besondere Zustände.** Keine eigenen.

**Exporte.** Keine auf Board-Ebene; die des eingebetteten Gewährleistungs-Rechners
(PDF, 2 × ICS, Teilen). **Status.** entwurf.

**Quelle.** `src/pages/RechnerVerjaehrungBoard.tsx`, Regime-Daten
`src/lib/verjaehrung.ts`, eingebettetes Formular
`src/components/forms/GewaehrleistungForm.tsx`.

### 4.4.6 `/rechner/inkasso-strecke` — Forderungs- & Inkasso-Strecke

**Zweck.** Zustandsloser «Reverse-Reader»: listet die fünf Schritte der
Geldforderungsdurchsetzung als Übersicht mit Verweisen auf die zuständigen Werkzeuge
und Vorlagen, gefolgt vom eingebetteten Verzugszins-Rechner. **Keine eigene
Rechtslogik.**

**Struktur.** Rechner-Kopf → Karte 1 **«Übersicht: Von der offenen Forderung zur
Betreibung»** mit nummerierter Liste (5 Einträge) → Karte 2 **«Schritt 2: Verzugszins
berechnen»** mit dem eingebetteten Verzugszins-Formular.

**Eingaben.** Keine eigenen auf Strecken-Ebene; Schritt 2 nutzt vollständig das
Verzugszins-Formular (4.4.3).

**Ausgaben.** Fünf Schritt-Karten, je mit Nummer-Abzeichen, Titel, Norm-Chip,
Beschreibungstext und optionalem Ziel-Link:

1. «Fälligkeit & Verzug» (Art. 102 OR) — kein Ziel-Link
2. «Verzugszins berechnen» (Art. 104 OR) — kein Ziel-Link (Rechner direkt darunter)
3. «Mahnung / Inverzugsetzung schreiben» (Art. 102 OR) — Ziel «Mahnung erstellen» →
   `/vorlagen/mahnung`
4. «Betreibung einleiten» (Art. 67 SchKG) — Ziel «Betreibungskosten» →
   `/rechner/betreibungskosten`
5. «Fristen im Betreibungsverfahren» (Art. 74 SchKG) — Ziel «Betreibungs- &
   Konkursfristen» → `/rechner/schkg-fristen`

Danach die vollständige Ausgabe des Verzugszins-Formulars.

**Besondere Zustände.** Keine eigenen. **Exporte.** Keine auf Strecken-Ebene; die des
eingebetteten Verzugszins-Rechners (PDF, Teilen). **Status.** entwurf.

**Quelle.** `src/pages/RechnerInkassoStrecke.tsx` (Schritt-Daten lokal in der Seite),
`src/components/forms/VerzugszinsForm.tsx`.

### 4.4.7 `/rechner/schkg-fristen` — Betreibungs- & Konkursfristen

**Zweck.** Fristende im Betreibungs- und Konkursverfahren berechnen: Presets je
Verfahrensphase, Stillstand-Regime-Wahl (Betreibungsferien gegen ZPO-Stillstand),
Hemmung und Rechtsstillstand. Einzelne Presets liefern ein **Fristen-Paar**
(Wartefrist + Verwirkungsfrist).

**Struktur.** Rechner-Kopf → Karte mit dem SchKG-Fristen-Formular →
Ereignis-Fristen-Sektion (Ereignis Zahlungsbefehl) → Themen-Einstieg **«Nach erhobenem
Rechtsvorschlag:»** → `/vorlagen/nichtbekanntgabe-betreibung`.

**Eingaben:**

- Verfahrensphase (Reiter)
- **Frist-Vorlage** (Auswahl, als «empfohlener Einstieg» mit hervorgehobenem Rahmen):
  Presets je Phase im Format «Label · Norm»
- gegebenenfalls **Rechtsprechungs-Hinweise** des gewählten Presets (Badge
  «verifiziert» / «zu verifizieren» + Aktenzeichen + Aussage)
- Auslösendes Ereignis (Datum, Hinweis = Auslöser-Text des Presets, z. B. «Zustellung
  Zahlungsbefehl»)
- Fristtyp & Länge (nur ohne Dual- oder Info-Preset): Zahl + Einheit (Tage / Monate /
  Jahre)
- **Stillstand-Regime** (Auswahl: SchKG-Betreibungsferien (Art. 56/63) – kein Ruhen ·
  ZPO-Stillstand (gerichtliche Klage, Art. 56 Abs. 2 SchKG) · Kein Stillstand)
- **Rechtsnatur** (Auswahl, nur ohne Dual- oder Info-Preset: Frist · Verwirkungsfrist ·
  Wartefrist (frühestens) · Beschwerdefrist · Klagefrist · Ordnungsfrist)
- Kanton (Auswahl, 26 Kantone)
- Bei umstrittenem Preset-Modus: Override-Auswahl (Regime-Wahl gegen die Vorgabe)
- Ankreuzfeld «Hemmung der Verwirkungsfrist (Art. 88 Abs. 2 / Art. 166 Abs. 2 SchKG)»
  mit Von/Bis-Datumsfeldern
- Ankreuzfeld «Schuldnerbezogener Rechtsstillstand (Art. 57–62 SchKG)» mit
  Von/Bis-Datumsfeldern

**Ausgaben.** Bei einem **Info-Only-Preset** (keine berechenbare Frist) ein
Hinweiskasten statt eines Ergebnisses. Sonst je Ausgabe — bei einem **Dual-Preset**
zwei Blöcke **«Wartefrist (frühestens)»** und **«Verwirkungsfrist (spätestens)»**, je
mit Natur-Badge: drei Eckdaten-Kacheln (Auslösendes Ereignis · Fristbeginn dies a quo ·
Fristende dies ad quem mit «24.00 Uhr», akzentuiert) · Ergebnis-Anzeige ·
Fristenkalender · Begründungs-Absatz mit Fristbeginn-Zusatz · je Frist ein kleiner
ICS-Knopf «In Kalender (.ics)» direkt beim Block. Am Ende gemeinsam Aktenzeichen-Feld
und Export-Zeile PDF + Teilen.

**Besondere Zustände.** Info-Only-Presets (keine bezifferbare Frist, z. B.
Konkursandrohung ohne feste Länge) · Dual-Presets mit zwei parallelen Fristen ·
umstrittene Regime-Zuordnung mit Override.

**Exporte.** PDF, ICS (je Frist), Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerSchkg.tsx`, `src/components/forms/SchkgFristenForm.tsx`,
Presets `src/lib/schkgPresets.ts`, Engine `src/lib/schkgFristen.ts`.

### 4.4.8 `/rechner/erbteilung` — Pflichtteil & verfügbare Quote

**Zweck.** Gesetzliche Erbteile, Pflichtteile und verfügbare Quote berechnen — mit
Todesdatum-Weiche (Revision 2023) und optionaler güterrechtlicher Herleitung des
Nachlasses.

**Struktur.** Rechner-Kopf → Karte mit dem Erbteilungs-Formular. Kein
Tagerechner-Rückverweis, kein Themen-Einstieg, kein Ereignis-Block (der Erbgang-Block
liegt auf `/rechner/erb-fristen`).

**Eingaben:**

- Todesdatum (Datum, Hinweis «Recht-Schalter: bis 31.12.2022 altes Recht, ab 1.1.2023
  neues Recht»)
- Zivilstand des Erblassers (Auswahl: Verheiratet · Eingetragene Partnerschaft ·
  Ledig/verwitwet/geschieden)
- Nachlass (CHF) (Zahl, optional, **deaktiviert**, wenn die güterrechtliche Vorstufe
  aktiv ist)
- Bei nicht-ledig: Ankreuzfeld «Scheidungs-/Auflösungsverfahren beim Tod hängig»,
  darunter «Voraussetzungen von Art. 472 ZGB erfüllt …»
- **1. Parentel:** Lebende Kinder (Anzahl, 0–30) · Vorverstorbene Kinder mit
  Nachkommen («Stämme», Listen-Editor, je Zeile Anzahl Nachkommen)
- **Nur ohne 1. Parentel — 2. Parentel:** Vater / Mutter (je Auswahl: – keine Angabe/
  nicht vorhanden – · lebt · vorverstorben, hat Nachkommen (Geschwister) ·
  vorverstorben, ohne Nachkommen); bei beiden «keine Angabe» und Zivilstand ledig:
  Ankreuzfeld «3. Parentel vorhanden»
- Akkordeon **«Güterrechtliche Vorstufe – Nachlass herleiten (optional)»**: Güterstand
  (Auswahl: Errungenschaftsbeteiligung · Gütertrennung · Gütergemeinschaft), je nach
  Güterstand unterschiedliche CHF-Felder (Eigengut/Vorschlag Erblasser, Vorschlag
  Überlebender, Gesamtgut, Vermögen)

**Ausgaben.** Drei Eckdaten-Kacheln (Rechtsstand · Verfügbare Quote als Bruch und in
CHF, akzentuiert · Nachlass in CHF oder «nur Quoten»). Ergebnis-Anzeige. Tabelle
**«Erbteile & Pflichtteile»** mit den Spalten Erbe / Gesetzlicher Erbteil /
Pflichtteil / [Erbteil CHF] / [Pflichtteil CHF] und einer Summenzeile «Verfügbare
Quote». Quoten-Balken (gebundene Pflichtteile gegen verfügbare Quote, Legende «Gelb:
Pflichtteile … Gold: frei verfügbar»). Begründungs-Absatz. Aktenzeichen-Feld.
Export-Zeile PDF + Teilen (**kein ICS**).

**Besondere Zustände.** Die güterrechtliche Vorstufe übersteuert das direkte
Nachlass-Feld; Quoten werden als Bruch dargestellt, CHF nur wenn ein Nachlass bekannt
ist.

**Exporte.** PDF, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerErbteilung.tsx`,
`src/components/forms/ErbteilungForm.tsx`, Engines `src/lib/erbteilung.ts`,
`src/lib/bruch.ts`.

### 4.4.9 `/rechner/erb-fristen` — Erbrecht: Fristen

**Zweck.** Erbrechtliche Fristen (Ausschlagung, öffentliches Inventar, Klagefristen)
aus einem Tatbestands-Katalog berechnen; 15 Tatbestände mit exaktem Fristbeginn.

**Struktur.** Rechner-Kopf → Tagerechner-Rückverweis → Karte mit dem
Erb-Fristen-Formular → Ereignis-Fristen-Sektion (Ereignis Erbgang).

**Eingaben:**

- **Tatbestand** (Auswahl mit zwei Optionsgruppen: **«Erbgang: Ausschlagung &
  Inventar»** und **«Klagefristen (1/10/30-Muster)»**)
- Auslösendes Ereignis (Datum, Hinweis = Trigger-Beschreibung des gewählten
  Tatbestands)
- Ankreuzfeld «Fristende auf Sa/So/Feiertag → nächster Werktag (Art. 78 OR analog)»
- Bei aktivierter Verschiebung: Kanton (Behördensitz) (Auswahl, 26 Kantone)

**Ausgaben.** Drei Eckdaten-Kacheln (Fristende + Wochentag, akzentuiert · Frist als
«N Monat(e)/Jahr(e)» + Norm · Verschoben ja/nein + Grund); Ergebnis-Anzeige (Titel
«Erb-Frist: <Tatbestand>»); Begründungs-Absatz; Aktenzeichen-Feld; Export-Zeile PDF +
ICS (Titel «Fristende – <Tatbestand>») + Teilen.

**Besondere Zustände.** Keine kantonale Weiche in der Fristberechnung selbst — der
Kanton dient nur der Werktagsverschiebung.

**Exporte.** PDF, ICS, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerErbFristen.tsx`,
`src/components/forms/ErbFristenForm.tsx`, Engine `src/lib/erbFristen.ts`.

### 4.4.10 `/rechner/mietrecht` — Kündigung & Fristen im Mietverhältnis

**Zweck.** Kündigungstermine und -fristen für Wohn- und Geschäftsräume berechnen,
inklusive Termin-Hierarchie, Formprüfung (amtliches Formular, Familienwohnung) und
ausserordentlicher Kündigungsarten.

**Struktur.** Rechner-Kopf → Tagerechner-Rückverweis → Karte mit dem
Mietrechts-Formular → Themen-Einstieg **«Kündigung aussprechen:»** mit Links zu
`/vorlagen/kuendigung-mieter` und `/vorlagen/kuendigung-vermieter`.

**Eingaben:**

- **Kündigungsart** (Auswahl: Ordentliche Kündigung (Art. 266a–f) · Zahlungsverzug
  (Art. 257d) · Schwere Pflichtverletzung (Art. 257f Abs. 3) · Wichtige Gründe
  (Art. 266g) · Tod des Mieters (Art. 266i) · Eigentümerwechsel/dringender Eigenbedarf
  (Art. 261 Abs. 2) · Konsumgütermiete (Art. 266k))
- **Mietobjekt** (Auswahl: Wohnräume (3 Mt., Art. 266c) · Geschäftsräume (6 Mt.,
  Art. 266d) · Unbewegliche Sache/Fahrnisbaute (3 Mt., Art. 266b) · Möbliertes
  Zimmer/Einstellplatz (2 Wo., Art. 266e) · Bewegliche Sache (3 Tage, Art. 266f))
- Kündigende Partei (Auswahl: Mieter / Vermieter)
- Zugang der Kündigung (Datum, Hinweis «absolute Empfangstheorie; bei Einschreiben
  i. d. R. Folgetag der Abholungseinladung»)
- Kanton (Auswahl, 26 Kantone, Hinweis je nach Datenlage der ortsüblichen Termine)
- Bei ordentlicher Kündigung (ausser bewegliche Sache und möbliertes Zimmer):
  **Kündigungstermine – Quelle** (Auswahl: Ortsüblicher Termin (Tatfrage) ·
  Vertraglich vereinbarte Termine (Monatsenden) · Vertragsklausel «auf jedes
  Monatsende» · Gesetzliche Auffangregel)
- Bei Quelle «vertraglich vereinbarte Monatsenden»: Monats-Schalter (12 Monate,
  Mehrfachauswahl)
- Bei Quelle «jedes Monatsende»: Ankreuzfeld «Ausnahme: nicht auf den 31. Dezember»
- Bedingt: Mietbeginn (Datum) für die gesetzliche Auffangregel bzw. bestimmte Fälle
- Bei ordentlicher Kündigung und Räumen: Vereinbarte Kündigungsfrist in Monaten
  (optional)
- Bei Zahlungsverzug: Zugang der Zahlungsaufforderung Stufe 1 (Datum, Hinweis
  «relative Empfangstheorie, BGE 119 II 147»)
- Bei Räumen: **Form-Block (Art. 266l–266o OR)** — Ankreuzfeld «Amtlich genehmigtes
  Kündigungsformular verwendet» (nur Vermieter) · Ankreuzfeld «Familienwohnung
  (Sonderschutz Art. 266m/266n)» · bei Familienwohnung je nach Partei «Kündigung
  beiden Ehegatten/Partnern separat zugestellt» bzw. «Ausdrückliche Zustimmung des
  Ehegatten/Partners liegt vor»

**Ausgaben.** Drei Eckdaten-Kacheln (Status bzw. «Mietverhältnis endet am»,
akzentuiert bei gültiger Kündigung — bei Nichtigkeit **«NICHTIG (Art. 266o OR)»** ·
Spätester Zugang für diesen Termin · Zahlungsfrist bzw. Anfechtung/Erstreckung bis).
Ergebnis-Anzeige. Bei berechnetem Endtermin ein Fristenkalender (Labels «Zugang der
Kündigung» / «Vertragsende»). Begründungs-Absatz. Aktenzeichen-Feld. Export-Zeile
PDF + ICS (Titel «Mietende (Kündigungstermin)») + Teilen.

**Besondere Zustände.** Nichtigkeit bei Formmangel (Art. 266o OR); Platzhaltertext
**«kein Datum berechnet»** statt eines blossen Strichs für nicht anwendbare oder nicht
berechenbare Werte.

**Exporte.** PDF, ICS, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerMietrecht.tsx`, `src/components/forms/MietrechtForm.tsx`,
Engine `src/lib/mietrecht.ts`, Termindaten `src/data/mietTermine.ts`.

### 4.4.11 `/rechner/verjaehrung` — Verjährung

**Zweck.** Ordentliche und kurze Verjährung sowie deliktische und
bereicherungsrechtliche Ansprüche berechnen, mit Stillstand, Unterbrechung und
Einredeverzicht.

**Struktur.** Rechner-Kopf → Tagerechner-Rückverweis → Karte mit dem
Verjährungs-Formular → Themen-Einstieg **«Verjährung vertraglich hinausschieben:»** →
`/vorlagen/verjaehrungsverzicht`.

**Eingaben:**

- 3 Beispiel-Chips: «Offene Rechnung (10 J.)» · «Mietzins (5 J.)» · «Delikt (3/10 J.)»
- **Anspruchstyp/Rechtsgrund** (Auswahl, 6 Regime, je mit Hinweistext): Ordentliche
  Forderung – 10 J. (Art. 127) · Katalogforderung – 5 J. (Art. 128) · Unerlaubte
  Handlung – 3/10 J. (Art. 60 Abs. 1) · Unerlaubte Handlung Personenschaden – 3/20 J.
  (Art. 60 Abs. 1bis) · Vertraglicher Personenschaden – 3/20 J. (Art. 128a) ·
  Ungerechtfertigte Bereicherung – 3/10 J. (Art. 67)
- Beginn der relativen Frist (Datum; das Label wechselt je Regime: «Kenntnis von
  Schaden und Person» / «Kenntnis des Anspruchs» / «Fälligkeit der Forderung»)
- Nur Regime mit absoluter Frist: Beginn der absoluten Frist (Datum, Label
  «Schädigendes Verhalten (bzw. dessen Ende)» / «Entstehung des Anspruchs»)
- Stichtag (Prüfdatum) (Datum)
- Kanton (Feiertage am Erfüllungsort) (Auswahl, 26 Kantone)
- Nur bei Delikts- und Personenschaden-Regimen: Ankreuzfeld «Das schädigende Verhalten
  ist eine strafbare Handlung (Art. 60 Abs. 2 OR)»
- **Unterbrechungen (Art. 135 OR)** (Listen-Editor): Typ (Anerkennung · Anerkennung
  durch Urkunde/Urteil → 10 Jahre · Betreibungsakt · Schlichtungsgesuch/Klage) +
  Datum; bei Typ «Schlichtungsgesuch/Klage» zusätzlich «rechtskräftig erledigt am» und
  Ankreuzfeld «durch Urteil (→ 10 Jahre)»
- **Stillstand/Hemmung (Art. 134 OR)** (Listen-Editor): Grund (Auswahl aus 8
  gesetzlichen Ziffern) + Von/Bis-Datum
- Ankreuzfeld «Schriftlicher Verzicht auf die Verjährungseinrede (Art. 141 OR)» mit
  «erklärt am» (Datum) und «für … Jahre» (Zahl, max. 10)

**Ausgaben.** Eckdaten-Kacheln: Relative Frist (bzw. nur «Frist», wenn es kein
absolutes Regime gibt) · Absolute Frist (falls vorhanden) — beide mit dem Badge
**«massgeblich»** auf der jeweils früher eintretenden · Verjährungseintritt
(akzentuiert) · plus eine Statuskachel **«Am Stichtag (…)»** mit «verjährt (Einrede,
Art. 142 OR)» oder «nicht verjährt». Bei Einredeverzicht ein Zusatzsatz.
Ergebnis-Anzeige. Begründungs-Absatz. Aktenzeichen-Feld. Export-Zeile PDF + ICS (Titel
«Verjährungseintritt – <Regime>») + Teilen.

**Besondere Zustände.** **«steht still (Art. 138 Abs. 1)»** statt eines Datums, solange
die relative Frist durch Stillstand nicht läuft; **«noch offen»** statt eines Datums,
wenn keine Verjährung eintritt.

**Exporte.** PDF, ICS, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerVerjaehrung.tsx`,
`src/components/forms/VerjaehrungForm.tsx`, Engine `src/lib/verjaehrung.ts`.

### 4.4.12 `/rechner/gewaehrleistung` — Gewährleistung & Mängelrüge

**Zweck.** Rüge- und Verjährungsfristen bei Kauf, Werkvertrag und Grundstückkauf
berechnen — mit Regime-Weiche zur Baumängel-Revision (in Kraft seit 1.1.2026).

**Struktur.** Rechner-Kopf → Tagerechner-Rückverweis → Karte mit dem
Gewährleistungs-Formular. Kein Themen-Einstieg, kein Ereignis-Block. Dasselbe
Formular ist zusätzlich im Verjährungs-Board eingebettet (4.4.5).

**Eingaben:**

- Vertragstyp (Auswahl: Fahrniskauf (Art. 197 ff.) · Werkvertrag (Art. 367 ff.) ·
  Grundstückkauf (Art. 219/219a))
- Vertragsschluss (Datum, Hinweis «Recht-Schalter: ab 1.1.2026 gilt die
  Baumängel-Revision»)
- Nur ohne Grundstückkauf: Objekt (Auswahl, je Vertragstyp unterschiedlich: Bewegliche
  Sache · In ein unbewegliches Werk integriert · Bewegliches Werk · Unbewegliches Werk
  (Baute) …)
- Übergabe/Abnahme/Besitzesantritt (Datum, Label je Vertragstyp)
- Nur Grundstückkauf: Eigentumserwerb (Grundbucheintrag) (Datum)
- **Art des Mangels** (Reiter: offen erkennbar / versteckt)
- Nur «versteckt»: Entdeckung des Mangels (Datum)
- Rüge erhoben am (Datum, optional)
- Vereinbarte Verjährungsfrist in Jahren (Zahl, optional, Schritt 0.5)
- Ankreuzfeld «Absichtliche Täuschung durch Verkäufer/Unternehmer (Art. 203/210
  Abs. 6 OR)»
- Nur Fahrniskauf: Ankreuzfeld «Konsumentenkauf (Art. 210 Abs. 4 OR)»; bei Aktivierung
  zusätzlich «Gebrauchte Sache (Mindestfrist 1 statt 2 Jahre)»
- Nur Werkvertrag: Ankreuzfeld «SIA-Norm 118 vereinbart (…)»
- Stichtag (Prüfdatum) (Datum)
- Kanton (Feiertage am Erfüllungsort) (Auswahl, 26 Kantone)

**Ausgaben.** Zwei Kacheln nebeneinander:

- **«Mängelrüge – Verwirkungsfrist»** (Badge «zwingend», wo einschlägig) — drei
  Ausprägungen: «entfällt (Arglist, Art. 203 OR)» / ««sofort» – Richtwert …» mit
  sicher- und äusserstens-Zusatz / «bis …» mit Basis-Datum
- **«Verjährung – Einrede (Art. 142 OR)»** (Badge «teilzwingend») — Jahre → Enddatum,
  Status verjährt/nicht verjährt am Stichtag, Link «Verjährungsrechner →»

Dann Ergebnis-Anzeige, Begründungs-Absatz, Aktenzeichen-Feld, Export-Zeile PDF +
**2 × ICS** (Titel «Rügefrist-Ende (Mängelrüge)» und «Verjährung Mängelrechte») +
Teilen. Bei Fehler-Status: ein Alarm-Kasten statt des Ergebnisblocks.

**Besondere Zustände.** Zwei getrennte Fristregimes im selben Rechner — Rüge =
Verwirkung, keine Hemmung/Unterbrechung; Verjährung = Einrede, deren allgemeine
Mechanik separat im Verjährungsrechner liegt. Regime-Weiche zum 1.1.2026
(Baumängel-Revision).

**Exporte.** PDF, 2 × ICS, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerGewaehrleistung.tsx`,
`src/components/forms/GewaehrleistungForm.tsx`, Engine `src/lib/gewaehrleistung.ts`.

### 4.4.13 `/rechner/tagerechner` — Fristenrechner (Tage · ZPO · SchKG)

**Zweck.** Ein Einstieg für die meisten Fristenfragen: ganz oben ein «ganz simpler»
Schnellrechner (Datum + Dauer + Ferien-Regime), darunter Presets über alle Regimes
sowie die Voll-Rechner ZPO und SchKG als Reiter. **Live-Brücke:** Eingaben des
Schnellrechners fliessen automatisch in das passende Voll-Formular.

**Struktur.** Rechner-Kopf → Karte 1 **«Einfacher Fristenrechner»** (Schnellrechner +
Abschnitt «Kalender-Ansicht» mit dem kompakten Fristkalender) → Karte 2 **«Mit
Vorauswahl (Presets · ZPO · SchKG · Rückwärts)»**: Preset-Suchfeld «Frist suchen (alle
Verfahren)», darunter «In welchem Verfahren läuft die Frist?» (Reiter: Allgemein
(Vertrag/OR) / Zivilprozess (ZPO) / Betreibung (SchKG)) plus Textknopf **«Weiss
nicht?»** (öffnet eine geführte 3-Fragen-Weiche), dann das gewählte Voll-Formular.

#### Schnellrechner

**Eingaben:**

- Datum (Ereignis) (Datumsfeld, Vorgabe heute)
- Frist: Länge (Zahl, ganzzahlig > 0) + Einheit (Auswahl: Tage / Wochen / Monate /
  Jahre; bei SchKG-Regime ohne Wochen)
- Kanton (Feiertage) (Auswahl, 26 Kantone)
- **Ferien/Stillstand** (5 Radiokarten mit Untertext): Keine Ferien (Art. 77/78 OR) ·
  Gerichtsferien (ZPO, Art. 145) · Betreibungsferien (SchKG, Art. 56/63) ·
  Verwaltungs-Stillstand (VwVG, Art. 22a) · BGG-Stillstand (Bundesgericht, Art. 46)

**Ausgaben.** Fristende-Anzeige (Wochentag + Datum), Verschiebungs- und
Stillstand-Zusatztext, Hinweiszeilen aus der jeweiligen Engine, ICS-Export «In
Kalender (.ics)»; darunter derselbe Wert im kompakten Fristkalender. Bei ZPO- oder
SchKG-Regime ein Link **«verfeinern»** auf den jeweiligen Voll-Rechner mit denselben
Werten.

#### Preset-Suche

Suchfeld **«Frist suchen (alle Verfahren)»** (z. B. «Berufung», «Rechtsvorschlag»,
«Art. 256c ZGB») — Treffer aus allen Regimes als Klickliste (Label · Norm ·
Regime-Badge). Ohne Treffer zusätzlich **«Abzweigungen»** zu Spezialrechnern mit
eigenem Regime (z. B. Verjährung, Kündigungsfristen) samt Warum-Satz.

#### Weiss-nicht-Weiche

Drei Fragen als Liste, je mit einem Direktwahl-Knopf:
1. «Läuft die Frist in einer Betreibungssache (Zahlungsbefehl, Rechtsvorschlag, Fortsetzung, Konkursandrohung – auch gerichtliche Fristen daraus, z. B. Rechtsöffnung)?» → Knopf «→ Betreibung (SchKG)»
2. «Hat sonst ein Zivilgericht oder die Schlichtungsbehörde die Frist nach ZPO gesetzt (Klage, Stellungnahme, Berufung, Vorschuss)?» → Knopf «→ Zivilprozess (ZPO)»
3. «Sonst – Vertrags- oder Gesetzesfrist ausserhalb eines solchen Verfahrens:» → Knopf «→ Allgemein (Vertrag/OR)», dahinter grau «– rechnet ohne Gerichtsferien; …»
Dazu ein Hinweis, dass Straf- (StPO), Verwaltungs- (VwVG) und Bundesgerichtsverfahren (BGG)
eigenen Stillstandsregeln folgen und dieser Rechner sie nicht abdeckt (Wortlaut sinngemäss,
vollständiger Satz in `src/pages/RechnerTagerechner.tsx` ab Z. 296).

#### Reiter «Allgemein» (drei Unter-Reiter)

- **«Fristende berechnen»**: optionaler Zustell-/Zugangs-Helfer (Akkordeon, rein
  informativ) mit Zustellart (Auswahl: Persönliche Übergabe/Empfang · Einschreiben –
  erfolgloser Zustellversuch · Gewöhnliche Post/A-Post Plus …) + Datum. Hauptfelder:
  Startdatum (auslösendes Ereignis, Hinweis «dies a quo non computatur») · Länge +
  Einheit · «Fristende verschieben» (Ankreuzfelder Wochenende, Feiertage) · Kanton
  (Erfüllungsort, Hinweis «EJPD-Verzeichnis Stand 2011»)
- **«Rückwärts (spätester Tag)»**: Stichtag/Termin · Länge + Einheit · «Bei
  Wochenende/Feiertag» (Vorverlegung, **als höchstrichterlich ungeklärt
  gekennzeichnet**) · Kanton
- **«Tage zwischen zwei Daten»**: Von/Bis-Datumsfelder, rein informativ (Kalendertage
  und Werktage Mo–Fr)

**Ausgaben Reiter «Allgemein».** Eckdaten-Kacheln, Ergebnis-Anzeige bzw. Ergebnistext,
Fristenkalender (nur im Modus «Fristende berechnen»), PDF + ICS + Teilen (Modi 1 und
2). Im Modus «Tage zwischen» reine Zahlenausgabe **ohne Rechtsverdikt**.

#### Reiter «ZPO» / «SchKG»

Dieselben Formulare wie 4.4.2 und 4.4.7, hier jedoch **ohne** eigene
Ereignis-Fristen-Sektion.

**Besondere Zustände.** Live-Brücke: Änderungen im Schnellrechner spiegeln sich,
solange das Voll-Formular «unberührt» ist, in das passende Voll-Formular; ein
manueller Reiter-Wechsel bricht die Brücke. Anker `#allgemein` / `#zpo` / `#schkg` je
Reiter.

**Exporte.** ICS im Schnellrechner; PDF, ICS und Teilen in den Voll-Reitern (**kein
PDF im Schnellrechner selbst**). **Status.** entwurf.

**Quelle.** `src/pages/RechnerTagerechner.tsx`,
`src/components/forms/{EinfacheFristForm,FristKalenderKompakt,AllgemeineFristForm}.tsx`,
`src/components/forms/einfacheFristTexte.ts`,
Engines `src/lib/allgemeineFrist.ts`, `src/lib/bggVwvgFristen.ts`, Preset-Index
`src/lib/presetIndex.ts`.

### 4.4.14 `/rechner/teuerung` — Teuerungsrechner (LIK-Indexierung)

**Zweck.** Indexierung eines Betrags nach dem Landesindex der Konsumentenpreise (LIK),
amtliche BFS-Reihe; drei Anwendungsfälle mit automatischer Basis-Wahl.

**Struktur.** Rechner-Kopf → Karte mit dem Teuerungs-Formular. Kein Themen-Einstieg,
kein Ereignis-Block.

**Eingaben:**

- **Anwendungsfall** (3 Auswahlkacheln): **Wertsicherung (generisch)** – «Renten,
  Pacht, Lizenzen – BFS-Dreisatz» · **Indexmiete** – «100 %-Weitergabe (Art. 269b OR /
  Art. 17 VMWG)» · **Unterhaltsbeitrag** – «Art. 286/128 ZGB – Index gemäss Urteil»
- Betrag alt (CHF) (Betragsfeld; das Label wechselt je Modus: «Nettomietzins alt
  (CHF/Monat)» / «Unterhaltsbeitrag gemäss Urteil (CHF)» / «Betrag alt (CHF)»)
- Rundung (Auswahl: Default je Modus (auf den Rappen / auf 5 Rappen) · auf den Rappen ·
  auf 5 Rappen · auf ganze Franken)
- Ausgangsmonat (Index alt) (Monat + Jahr als Doppel-Auswahl, Label je Modus)
- Zielmonat (Index neu) (Monat + Jahr als Doppel-Auswahl, Vorgabe = letzter
  publizierter LIK-Monat; der Hinweis nennt diesen Monat)

**Ausgaben.** Drei Eckdaten-Kacheln (Indexierter Betrag, akzentuiert · Veränderung in
% · Index «Basis … = 100» alt → neu). Ergebnis-Anzeige (Titel «LIK-Indexierung
(Basis … = 100)»). Begründungs-Absatz. Aktenzeichen-Feld. Export-Zeile PDF + Teilen.
**Quellen-Mikrozeile:** «Quelle: <LIK-Quelle> · <LIK-Stand> · freie Nutzung,
Quellenangabe Pflicht (OPEN-BY)» plus Hinweis, falls die Basis automatisch gewählt
wurde.

**Besondere Zustände.** Automatische Basis-Wahl je nach gewähltem Zeitraum
(Original-Basiswechsel der BFS-Reihe), im Kernresultat offengelegt.

**Exporte.** PDF, Teilen (**kein ICS**). **Status.** entwurf.

**Quelle.** `src/pages/RechnerTeuerung.tsx`, `src/components/forms/TeuerungForm.tsx`,
Engine `src/lib/teuerung.ts`, Datenreihe `src/data/likReihe.ts`.

### 4.4.15 `/rechner/zustaendigkeit` — Zuständigkeit (Zivilprozess · SchKG · Straf)

**Zweck.** Vierteilige Zuständigkeits-Ermittlung mit geführtem Schritt-Dialog:
Rechtsweg wählen (Zivil, SchKG und Straf aktiv, Verwaltung «in Vorbereitung»), dann je
nach Rechtsweg Streitsache bzw. Konstellation, Ort, Streitwert, Sonderfälle. Ergebnis
ist eine **konkrete Behörde mit Adresse**, dazu Fristen und ein Sprung zur passenden
Vorlage.

**Struktur.** Rechner-Kopf (mit Kopf-Override je Rechtsweg: SchKG und Straf zeigen
eigene Kategorie, eigenen Kurzbeschrieb und eigene Normen) → Karte mit dem
Zuständigkeits-Formular. Die Anker `#schkg` und `#straf` wählen den Rechtsweg vor.

Innerer Ablauf: Pflicht-Disclaimer (Text je Rechtsweg) → **Schrittleiste** (klickbare
Schritt-Navigation) → Schritt **«Was möchten Sie tun?»** (Rechtsweg-Kacheln; bei SchKG
und Straf ein eigener Teil-Wizard) → bei Zivil weiter: **«Was suchen Sie?»**
(Verfahren einleiten / Rechtsmittel ergreifen) → gegebenenfalls **«Was wird
angefochten?»** → **«Art des Streits»** → **«Örtliche Anknüpfung»** → **«Um wie viel
geht es?»** (Streitwert) → **«Weitere Angaben – Sonderfälle»** (optional) →
Ergebnis-Teile → Navigation «← Zurück» / «Weiter →».

#### Zivil-Zweig — Eingaben

- **Rechtsweg** (4 Auswahlkacheln): Zivilprozess (aktiv) · SchKG (aktiv) ·
  Strafverfahren (aktiv) · Verwaltungsverfahren («In Vorbereitung», deaktiviert)
- **Was suchen Sie?** (Auswahlkacheln): Verfahren einleiten / Rechtsmittel ergreifen
- Nur Rechtsmittel: **Was wird angefochten?** (Auswahlkacheln: Endentscheid ·
  Zwischenentscheid · Vorsorgliche Massnahme · Prozessleitende Verfügung) ·
  Verfahrensart der Vorinstanz (Auswahl: Ordentlich/vereinfacht · Summarisch) · Wer
  hat entschieden? (Auswahl: Erstinstanzliches Gericht · Handelsgericht · Oberes
  Gericht nach Direktklage) · bei Summarisch zusätzlich Ankreuzfeld «Familienrechtliche
  Streitigkeit nach Art. 271/276/302/305 ZPO …»
- **Art des Streits** (Auswahlkacheln), je nach Wahl bedingte Unterfall-Auswahllisten:
  Miet-Unterfall · Delikts-Unterfall · Persönlichkeit-Unterfall · Art.-5-Materie
  (IP/Wettbewerb) mit Ankreuzfeld «Der Bund übt sein Klagerecht aus»
- **Örtliche Anknüpfung:** PLZ + Gemeinde (mit Abgleich gegen das
  Ortschaftenverzeichnis, Mehrdeutigkeits-Auswahl, Adress-Suche über die Bundes-API) ·
  Kanton (Forum)
- **Streitwert (CHF)** + Ankreuzfeld «nicht vermögensrechtliche Streitigkeit»
- **Sonderfälle** (optional, Block): diverse Ankreuzfelder je nach Streitsache —
  Konsumentenvertrag · Forderung aus Vertrag · Personalverleih/-vermittlung ·
  Gerichtsstandsvereinbarung · Konsumentin klagt · Gleichstellungsgesetz · Beklagte im
  Ausland/unbekannt · Widerklage/gerichtliche Klagefrist — sowie ein aufklappbarer
  Block **«Handelsgerichts-Konstellation»** (3 Ankreuzfelder)

#### SchKG-Teil

Schritte: **«2 · Worum geht es?»** (Auswahlkacheln) · **«3 · Schuldnerin/Schuldner und
Konstellation»** (Schuldner-Typ, Pfandsicherung, Forderung CHF,
Widerspruchs-Konstellation, Verfahren, Titel) · **«3b · Betreibungsort lokalisieren
(optional)»** (PLZ, Politische Gemeinde, Kanton).
Ausgabe: «Betreibungsort (Wurzelgrösse)» · «Fristen» · «Ihr Fahrplan» ·
«Voraussichtliche Kosten».

#### Straf-Teil

Schritte: **«2 · Worum geht es?»** (Auswahlkacheln) · **«3 · Konstellation»**
(Tatort-Lage, Kaskade, Spezialforum, Beteiligung, Kanton des Forums).
Ausgabe: «Örtliches Forum» · «Sachlich zuständige Gerichte» · «Fristen» · «Ihr
Fahrplan». Im Rechtsmittel-Zweig stattdessen **«3 · Angefochtener Entscheid»**
(Entscheidtyp, Wer ficht an, Anfechtungsziel, gegebenenfalls Revisionsgrund, Kanton)
mit der Ausgabe «Statthaftes Rechtsmittel» · «Konkrete Instanz» · «Fristen — kein
Stillstand» · «Weiterzug ans Bundesgericht».

**Ausgaben (gemeinsam).** Abschnitt **«Fahrplan»** mit Eckdaten-Kacheln ·
gegebenenfalls ein Zweig «Handelsgericht (<Kanton>)» · **«Passende Vorlage für Ihre
Eingabe»** (Link «Weiter zur Vorlage →» oder «In Vorbereitung») · **«Zuständige
Schlichtungsstelle (<Kanton>)»** mit Adresse · **«Ihr Fahrplan»** ·
**«Voraussichtliche Kosten»** · Aktenzeichen-Feld · PDF-Export · Teilen. Im
Rechtsmittel-Zweig zusätzlich: «1 · Statthaftes Rechtsmittel (kantonal)» · «2 ·
Wohin?» · «3 · Frist (kantonal)» · «4 · Weiterzug ans Bundesgericht».

**Besondere Zustände.** SchKG und Straf sind **vollständig getrennte Teil-Wizards mit
eigener Engine**. Das Verwaltungsverfahren ist eine ehrliche «In Vorbereitung»-Kachel
ohne Engine. Behörden-Auflösungen tragen keine Quelle-/Status-Fusszeile, jede
aufgelöste Stelle aber einen amtlichen Link. Warnhinweis, wenn die gewählte Gemeinde
nicht zum gewählten Kanton passt.

**Exporte.** PDF, Teilen (**kein ICS in diesem Rechner**). **Status.** entwurf (alle
drei Katalogkarten).

**Quelle.** `src/pages/RechnerZustaendigkeit.tsx`,
`src/components/forms/{ZustaendigkeitForm,SchkgZustaendigkeitTeil,StrafZustaendigkeitTeil,ZustErgebnisEinleitung,ZustErgebnisRechtsmittel}.tsx`,
`src/components/forms/{useZustaendigkeitForm,zustaendigkeitFormDaten}.ts`,
Engine `src/lib/zustaendigkeit.ts`, Kantonsdaten `src/data/zustaendigkeitKantone.ts`.

### 4.4.16 `/rechner/streitwert` — Streitwert (ZPO)

**Zweck.** Streitwert aus den Rechtsbegehren nach Art. 91–94a ZPO ermitteln:
Kapitalisierung wiederkehrender Leistungen, Klagenhäufung, Widerklage, Teilklage;
anschliessend Abgleich gegen die ZPO-Verfahrensart- und BGG-Streitwertgrenzen.

**Struktur.** Rechner-Kopf → Karte mit dem Streitwert-Formular. Kein Themen-Einstieg.

**Eingaben:**

- **Begehren** (Listen-Editor, 1–10 Einträge «Begehren N»): Art des Begehrens
  (Auswahl: einmalig bezifferte Forderung / wiederkehrende Nutzung oder Leistung
  (Art. 92) / nicht beziffert · Naturalleistung · Verbandsklage). Bei «einmalig»:
  Forderungsbetrag (CHF). Bei «wiederkehrend»: Dauer (Auswahl:
  ungewiss/unbeschränkt × 20 · bestimmte Dauer · Leibrente (Barwert)) plus Jahresbetrag
  bzw. Dauer in Jahren bzw. Barwert. Bei «unbeziffert»: Hinweistext statt Feld.
- Bei mehreren Begehren: Ankreuzfeld «die Begehren schliessen sich gegenseitig aus
  (Art. 93 ZPO)»
- Widerklage (CHF) (optional); bei gesetztem Wert: Ankreuzfelder «Klage und Widerklage
  schliessen sich gegenseitig aus (Art. 94 Abs. 2)» und «die Hauptklage ist eine
  Teilklage (Art. 94 Abs. 3)»

**Ausgaben.** Ohne Eingabe der Ergebnis-Platzhalter: «Forderungsbetrag eingeben — hier
erscheinen Streitwert, Verfahrensart (Art. 243 ZPO) und der BGG-Abgleich.» Bei
Ergebnis: Eckdaten-Kachel(n) (Streitwert Verfahren bzw. Rechtsmittel, akzentuiert; bei
abweichender Kostenbasis zusätzlich «Kosten-Bemessungsgrundlage (Art. 94 ZPO)»);
Ergebnis-Anzeige; Abschnitt **«Grenzwert-Abgleich»** mit einem Gebiets-Umschalter
(Pillen-Variante: übrige / Miete-Arbeit — nur für die BGG-Grenze) und je Regime einer
Kachel (Titel, Aussage, optionale «selbst prüfen»-Liste); Begründungs-Absatz;
Aktenzeichen-Feld; Export-Zeile PDF + Teilen (**kein ICS**).

**Besondere Zustände.** Ermessens-Konstellationen (unbeziffert, Verbandsklage) werden
**offengelegt, nie geschätzt**; ZPO-Verfahrensart-Schwelle und BGG-Beschwerde-Schwelle
sind strikt getrennt dargestellt.

**Exporte.** PDF, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerStreitwert.tsx`,
`src/components/forms/StreitwertForm.tsx`, Engine `src/lib/streitwert.ts`.

### 4.4.17 `/rechner/betreibungskosten` — Betreibungskosten (GebV SchKG)

**Zweck.** Amtliche Gebühren je Betreibungsschritt nach der bundesrechtlich
abschliessenden Gebührenverordnung SchKG berechnen (Zahlungsbefehl, Pfändung,
Verwertung, Einzahlung, gerichtlicher Entscheid in Summarsachen).

**Struktur.** Rechner-Kopf → Karte mit dem GebV-Kosten-Formular. Kein Themen-Einstieg,
kein Ereignis-Block. (Dasselbe Formular hat einen `minimal`-Modus für den
Startseiten-Schnellrechner; hier läuft es voll.)

**Eingaben:**

- Forderung in Betreibung (CHF) (Betragsfeld, Hinweis «bezifferte Forderung — nicht
  bezifferte Zinsen ausser Betracht»)
- **Zahlungsbefehl (Art. 16)** (Ankreuzfeld «Zahlungsbefehl erlassen/zugestellt»); bei
  Aktivierung: weitere Ausfertigungen (Zahl 0–20) + Zustellversuche Abs. 3 (Zahl 0–20)
- **Pfändung (Art. 20)** (Auswahl: keine · vollzogen (inkl. Pfändungsurkunde) ·
  fruchtlos (halbe Gebühr, min. CHF 10) · erfolgloser Versuch (CHF 10))
- **Verwertung (Art. 30)** (Betragsfeld Erlös/Schätzwert); bei gesetztem Wert
  Ankreuzfeld «kein Erwerber gefunden (½, max. CHF 1'000 — Abs. 4)»
- **Einzahlung/Überweisung (Art. 19)** (Betragsfeld)
- **Gerichtsentscheid Summarsache (Art. 48)** (Betragsfeld Streitwert, Hinweis
  «Ausgabe als RAHMEN, nie als Punktwert»)

**Ausgaben.** Ohne Eingabe der Ergebnis-Platzhalter: «Forderungsbetrag eingeben — hier
erscheinen die Betreibungskosten und ihre Herleitung.» Bei Ergebnis die
Ergebnis-Anzeige «Betreibungskosten (GebV SchKG)», Begründungs-Absatz,
Aktenzeichen-Feld, Export-Zeile PDF + Teilen (**kein ICS**).

**Besondere Zustände.** Rahmengebühren (z. B. Rechtsöffnung) werden ehrlich als
Bandbreite statt als Punktwert ausgegeben; Auslagen und die Überwälzung auf den
Schuldner (Art. 68 SchKG) erscheinen nur als Hinweis, nicht beziffert.

**Exporte.** PDF, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerGebvKosten.tsx`,
`src/components/forms/GebvKostenForm.tsx`, Engine `src/lib/gebvKosten.ts`.

### 4.4.18 `/rechner/prozesskosten` — Prozesskosten (Gerichts- & Parteikosten)

**Zweck.** Gerichtskosten (Entscheidgebühr) und Parteientschädigung im
erstinstanzlichen Zivilprozess nach Streitwert für alle 26 Kantone berechnen — mit
interkantonalem Vergleich, Kostenrisiko bei Teilobsiegen, Kostenvorschuss,
MwSt.-Aufschlag, Instanzenzug-Gesamtkosten und Sicherheitsleistung.

**Struktur.** Rechner-Kopf → Karte mit dem Prozesskosten-Formular. Kein
Themen-Einstieg, kein Ereignis-Block.

**Eingaben:**

- Ankreuzfeld «Nicht vermögensrechtliche Streitigkeit (kein Streitwert)»
- Kanton (Auswahl, 26 Kantone)
- Streitwert (CHF) (Betragsfeld, nur wenn nicht «nicht vermögensrechtlich»)
- Instanz (Auswahl, u. a. Erstinstanz, Handelsgericht, Bundesgericht)
- Verfahrensphase (Auswahl, z. B. Schlichtung / Entscheid; entfällt bei Einzelinstanz)
- Verfahrensart (Auswahl, z. B. ordentlich / summarisch / vereinfacht; nur wenn die
  Phase «Entscheid» ist und keine Einzelinstanz vorliegt)
- Materie (Auswahl, für kostenlose Verfahren nach Art. 113/114 ZPO)

Nach dem Ergebnis zusätzliche, per Textlink aufklappbare Blöcke:

- **«Kostenrisiko bei Teilobsiegen berechnen →»**: Verfahrensausgang (Auswahl); bei
  «Quote» ein Schieberegler «Ihre Obsiegensquote» (0–100 %, Schritt 5); Ankreuzfeld
  «Unentgeltliche Rechtspflege bewilligt (Art. 117 ff. ZPO)»
- **«Was würde es in anderen Kantonen kosten? →»** (interkantonaler Vergleich, nicht
  bei Einzelinstanz)
- **«Gesamtkosten über den Instanzenzug →»** (nicht bei Einzelinstanz)
- **«Sicherheit für die Parteientschädigung (Art. 99) →»**
- Ankreuzfeld «Berechtigte Partei nicht vorsteuerabzugsberechtigt … MwSt auf die
  Parteientschädigung hinzurechnen» (nur wenn die Parteientschädigung nicht kostenlos
  ist)

**Ausgaben.** Ohne Eingabe der Ergebnis-Platzhalter: «Kanton und Streitwert wählen —
hier erscheinen Gerichtskosten und Parteientschädigung mit ihrer Herleitung.» Bei
Ergebnis:

- zwei **Posten-Karten** (Gerichtskosten, Parteientschädigung) — je mit Betrag oder
  Spanne, Quelle (Erlassname, Artikel-Trigger, Stand, gegebenenfalls «nicht
  abgenommen») und Link «amtliche Quelle ↗»
- Kachel **«Mutmasslicher Kostenvorschuss»**
- bei MwSt-Zuschlag eine akzentuierte Kachel
- Hinweisliste
- Klappelement **«Weitere Kostenposten (nicht beziffert)»**
- Querverweis-Sätze zum Betreibungskosten- und zum Notariats-/Grundbuch-Rechner
- bei geöffnetem Kostenrisiko-Panel: drei Kacheln (Gerichtskosten zu Ihren Lasten ·
  Parteientschädigung-Saldo · Netto-Kostenbelastung, akzentuiert) plus Hinweisliste
  plus Klappelement «Verteilungs-Sonderfälle»
- bei geöffnetem Vergleich: Tabelle Kanton / Gerichtskosten / Parteientschädigung,
  aufsteigend sortiert, aktueller Kanton hervorgehoben
- bei geöffnetem Instanzenzug: Tabelle je Stufe plus Summenzeile
- bei geöffneter Sicherheitsleistung: Betrag oder Spanne bzw. Ausschlussgrund plus
  Hinweisliste
- Aktenzeichen-Feld, PDF-Export, Teilen — **der Permalink trägt auch die geöffneten
  Zusatzpanels**

**Besondere Zustände.** Ermessenstarife immer als Spanne, nie als erfundener
Punktwert; kostenlose Verfahren (Art. 113/114 ZPO) und die Schlichtungspauschale
gesondert ausgewiesen; das Handelsgericht erzwingt die Phase «Entscheid» (kein
Schlichtungsverfahren, Art. 198 lit. f).

**Exporte.** PDF, Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerProzesskosten.tsx`,
`src/components/forms/ProzesskostenForm.tsx`, Engine `src/lib/prozesskosten.ts`,
Kantonsdaten `src/data/tarif/`.

### 4.4.19 `/rechner/notariat-grundbuch` — Notariats- & Grundbuchkosten

**Zweck.** Beurkundungs- und Grundbuchkosten aller 26 Kantone in drei Bereichen:
Grundstückkauf (vier Kostenblöcke), Beurkundung je Geschäftsart, Grundbuch je
Eintragungsart.

**Struktur.** Rechner-Kopf → Karte mit dem Beurkundungs-Formular: Pflicht-Disclaimer →
Reiter (Bereich: **Grundstückkauf** / **Beurkundung (Notariat)** / **Grundbuch
(Eintragung)**) → je Bereich ein eingebettetes Unterformular.

**Eingaben Bereich «Grundstückkauf».** Kanton (Auswahl) · Kaufpreis (CHF) ·
Ankreuzfeld «Grundpfand (Schuldbrief/Hypothek) mitberechnen» mit optionaler Pfandsumme
(CHF, Vorgabe = Kaufpreis) · Ankreuzfeld «Handänderungssteuer einbeziehen».

**Eingaben Bereich «Beurkundung».** Geschäftsart (Auswahl mit Optionsgruppen, z. B.
Testament, Erbvertrag, Ehevertrag, Schenkung, Vorsorgeauftrag, Vollmacht, Gründungen
AG/GmbH, Stiftung, Bürgschaft, Dienstbarkeiten — **Grundstückkauf ist ausgeschlossen**,
er hat einen eigenen Bereich) · Kanton · bei wertbasiertem Tarif zusätzlich
Geschäftswert (CHF, Label und Hinweis je Geschäftsart).

**Eingaben Bereich «Grundbuch».** Eintragungsart (Auswahl mit Optionsgruppen, z. B.
Grundpfand, Dienstbarkeit, Vormerkung, Mutation — **Eigentumsübertragung durch Kauf
ist ausgeschlossen**) · Kanton · bei wertbasiertem Tarif Wert (CHF).

**Ausgaben** (alle drei Bereiche nach demselben Muster). Posten-Karte(n) je Kostenart
mit Betrag oder Spanne bzw. **«In Recherche»** (Tarif noch nicht verifiziert —
bewusst **kein** geschätzter Betrag) bzw. **«Entfällt»** (Position existiert im Kanton
nicht), je mit Quelle (Erlassname, Artikel-Trigger, Stand, gegebenenfalls «nicht
abgenommen», amtlicher Link). Im Grundstückkauf-Bereich zusätzlich eine Gesamt-Kachel
(«Gebühren gesamt» bzw. «Total inkl. Handänderungssteuer»). Im Beurkundungs-Bereich
gegebenenfalls **«Weitere Transaktionskosten (Schätzung)»** (MwSt. freies Notariat,
Handelsregister-Gebühr, Emissionsabgabe) und ein Gesamt-Total. Dazu Hinweisliste,
Textlink **«Was kostet es in anderen Kantonen? →»** (interkantonale Vergleichstabelle,
aufsteigend sortiert), Aktenzeichen-Feld, PDF-Export, Teilen (je Bereich eine eigene
Permalink-Spezifikation).

**Besondere Zustände.** Drei parallele Tarifquellen (Kaufvertrag, Beurkundung,
Grundbuch) je Kanton; Rahmen- und Aufwandtarife (freies Notariat) als Spanne oder
«nach Vereinbarung»; ein fehlender kantonaler Tarif wird als **«In Recherche»**
ausgewiesen, nie geschätzt.

**Exporte.** PDF, Teilen (**kein ICS**). **Status.** entwurf.

**Quelle.** `src/pages/RechnerNotariatGrundbuch.tsx`,
`src/components/forms/{BeurkundungForm,NotariatGrundbuchForm,GrundbuchEintragForm}.tsx`,
Engines `src/lib/{notariatGrundbuch,beurkundung,grundbuchgebuehren,beurkundungZusatzkosten}.ts`,
Tarifdaten `src/data/tarif/`.

### 4.4.20 `/rechner/bgg-fristen` — Weiterzug ans Bundesgericht (BGG)

**Zweck.** Beschwerdetyp, Zulässigkeit, Frist (30/10/5/3 Tage) und zuständige
Abteilung für den Weiterzug ans Bundesgericht bestimmen — alle vier Beschwerdewege
inklusive subsidiärer Verfassungsbeschwerde.

**Struktur.** Rechner-Kopf → Karte mit dem Rechtsweg-Formular → Themen-Einstieg **«Vor
dem Weiterzug:»** mit Links zu `/rechner/zustaendigkeit`, `/rechner/streitwert`,
`/rechner/tagerechner`.

**Eingaben:**

- **Rechtsweg** (4 Auswahlkacheln): Zivilsache (Art. 72 ff., inkl. SchKG-Entscheide der
  Gerichte) · SchKG-Aufsichtsentscheid (Art. 19 SchKG, 10 Tage) · Strafsache
  (Art. 78 ff.) · Öffentlich-rechtliche Sache (Art. 82 ff., Ausnahmekatalog Art. 83)
- Nur Zivil: **Rechtsgebiet** (Auswahl, 14 Optionen): Schuldrecht/Vertrag ·
  Arbeitsrecht · Miete/Pacht · Versicherungsvertrag · Haftpflicht · Wettbewerbsrecht ·
  Immaterialgüterrecht · Rechtsöffnung · Übriges SchKG · Personenrecht · Familienrecht ·
  Erbrecht · Sachenrecht · Bäuerliches Bodenrecht
- Nur Verwaltung: **Sonderfall** (Auswahl): kein Sonderfall (30 Tage) · internat.
  Rechtshilfe Straf/Amtshilfe Steuern (10 Tage) · öffentliche Beschaffung (30 Tage,
  kein Stillstand) · Stimmrechtssache kantonal (30 Tage, kein Stillstand) · eidg.
  Abstimmung (5 Tage) · Nationalratswahl (3 Tage)
- **Anfechtungsobjekt** (Auswahl, nicht bei Schiedsgericht): Endentscheid (Art. 90) ·
  Teilentscheid (Art. 91) · Zwischenentscheid Zuständigkeit/Ausstand (Art. 92) ·
  anderer Vor-/Zwischenentscheid (Art. 93)
- Nur Zivil: Ankreuzfeld «vermögensrechtliche Angelegenheit (Streitwertgrenze Art. 74
  Abs. 1)»; bei Aktivierung Streitwert (CHF). Ankreuzfelder «einzige kantonale Instanz
  hat entschieden», «Entscheid des Konkurs-/Nachlassrichters», «Schiedsentscheid
  (Art. 77)», «vorsorgliche Massnahme/aufschiebende Wirkung». Bei Rechtsgebiet
  Immaterialgüterrecht zusätzlich «Entscheid im Markenwiderspruchsverfahren»; bei
  Familienrecht zusätzlich «Eheschutzentscheid» und «Kindesrückgabe (HKÜ/ESÜ)»
- Nur SchKG-Aufsicht: Ankreuzfeld «Wechselbetreibung (5 Tage, kein Stillstand)»
- Straf / Verwaltung / SchKG-Aufsicht: Ankreuzfeld «Verfahren betreffend aufschiebende
  Wirkung/vorsorgliche Massnahmen»
- Eröffnung der vollständigen Ausfertigung (Datum, optional)
- Kanton (Auswahl, 26 Kantone, Hinweis «Wohnsitz-/Sitzkanton der Partei oder
  Vertretung»)

**Ausgaben.** Drei Eckdaten-Kacheln (Beschwerde-Typ + Fristnorm · Frist in Tagen oder
«jederzeit» + Stillstand-Hinweis · Letzter Tag bei bekannter Eröffnung, akzentuiert —
sonst stattdessen die Abteilung). Ergebnis-Anzeige «Weiterzug ans Bundesgericht
(BGG)». Begründungs-Absatz. Aktenzeichen-Feld. Export-Zeile PDF + ICS (nur bei
bekanntem Fristende, Titel «Beschwerdefrist Bundesgericht (BGG)») + Teilen.

**Besondere Zustände.** Rechtsfragen (grundsätzliche Bedeutung, nicht wieder
gutzumachender Nachteil, Ermessens-Streitwerte) werden **offengelegt, nie
entschieden**; **«jederzeit»** statt einer Tageszahl bei unbefristeter
Beschwerdemöglichkeit (Art. 100 Abs. 7).

**Exporte.** PDF, ICS (bedingt), Teilen. **Status.** entwurf.

**Quelle.** `src/pages/RechnerBgerRechtsweg.tsx`,
`src/components/forms/BgerRechtswegForm.tsx`, Engine `src/lib/bgerRechtsweg.ts`.

---

## 5 Vorlagen (Werkbank-Rubrik «Werkzeuge», Teil B)

30 Routen unter `/vorlagen/…` plus die Übersichtsseite `/vorlagen`. Jede Vorlage läuft
durch denselben **Wizard-Rahmen** und dieselbe deterministische **Assemble-Engine**:
feste Textbausteine, keine KI, kein Zufall. Einzige Quelle für Titel, Beschrieb,
Normen, Formvorschrift und Export ist die Katalogkarte.

### 5.1 Katalog

72 Katalog-Einträge mit `modus: 'vorlage'`: **30 gebaut** (Status `entwurf`, je eine
Route — entspricht exakt den 30 Einträgen im Routen-Manifest) und **42 geplant**
(Status `geplant`, kein Export, keine Norm-Pills, Vermerk «In Vorbereitung»). **Kein
Katalog-Eintrag trägt Status «geprüft».** Titel und Kurzbeschrieb sind wörtliche
Zitate.

#### 5.1.1 Gebaut (Status `entwurf`, 30 Routen)

| Pfad | Titel | Kurzbeschrieb | Kategorie (art) | Form-Gate | Formvorschrift (Wizard-Kopf) | Export | Normen | im Register |
|---|---|---|---|---|---|---|---|---|
| `/vorlagen/eheschutzgesuch` | Eheschutzgesuch | Gesuch um Regelung des Getrenntlebens (Art. 175 f. ZGB, summarisches Verfahren) – Begehren-Katalog mit Wohnung/Auszugsfrist, Obhut, Bar- und Betreuungsunterhalt, Rückwirkung (Art. 173 Abs. 3 ZGB), Gütertrennung, Schuldneranweisung und Verfügungsbeschränkung. | I Behördeneingaben | fertig | Unterschreiben und im Doppel einreichen (Art. 131 ZPO); summarisches Verfahren – Belege zur Glaubhaftmachung beilegen. | pdf, docx | Art. 175 ZGB; Art. 176 ZGB; Art. 271 ZPO | ja |
| `/vorlagen/fristerstreckung` | Fristerstreckungsgesuch | Gesuch an das Gericht, eine gerichtliche Frist zu erstrecken (Art. 144 Abs. 2 ZPO) – mit Frist-Art-Weiche (gesetzliche Fristen sind nicht erstreckbar) und Vor-Fristablauf-Prüfung. | I Behördeneingaben | fertig | Unterzeichnete Eingabe an das Gericht – vor Fristablauf einreichen (Art. 144 Abs. 2 ZPO). | pdf, docx | Art. 144 ZPO; Art. 143 ZPO | ja |
| `/vorlagen/scheidungsbegehren-gemeinsam` | Gemeinsames Scheidungsbegehren | Gemeinsame Eingabe beider Ehegatten (Art. 285/286 ZPO) – Weiche umfassende Einigung (Art. 111 ZGB) oder Teileinigung mit Pflicht-Antrag auf gerichtliche Beurteilung der streitigen Folgen (Art. 112 ZGB). | I Behördeneingaben | fertig | Von BEIDEN Ehegatten zu unterzeichnen; mit Vereinbarung und Belegen beim Gericht am Wohnsitz einer Partei einzureichen. | pdf, docx | Art. 285 ZPO; Art. 286 ZPO; Art. 111 ZGB; Art. 112 ZGB | ja |
| `/vorlagen/klage-ordentlich` | Klage (ordentliches Verfahren) | Klageschrift nach Art. 221 ZPO aus festen Bausteinen: Rechtsbegehren, Streitwertangabe, Tatsachenbehauptungen mit Beweisofferte je Ziffer (Pflicht), fakultative rechtliche Begründung, Beweismittel- und Beilagenverzeichnis – Gerichts-Adressat für alle 26 Kantone, Klagefrist mit Gerichtsferien. | I Behördeneingaben | fertig | – | pdf, docx | Art. 220 ZPO; Art. 221 ZPO; Art. 209 ZPO | ja |
| `/vorlagen/klage-vereinfacht` | Klage (vereinfachtes Verfahren) | Klage nach Art. 244 ZPO aus festen Bausteinen: Rechtsbegehren (beziffert/unbeziffert), Streitgegenstand, freiwillige strukturierte Begründung mit Beweismitteln, Beilagen mit Klagebewilligung – Gerichts-Adressat für alle 26 Kantone (Spruchkörper-Routing amtlich abgenommen für Basel-Stadt), Kostenfreiheits-Prüfung und Klagefrist mit Gerichtsferien. | I Behördeneingaben | fertig | Unterschreiben und im Doppel einreichen (Art. 131 ZPO) | pdf, docx | Art. 243 ZPO; Art. 244 ZPO; Art. 209 ZPO; Art. 114 ZPO; Art. 145 ZPO | ja |
| `/vorlagen/nichtbekanntgabe-betreibung` | Nichtbekanntgabe einer Betreibung («Löschung» im Auszug) | Gesuch an das Betreibungsamt, eine Betreibung mit erhobenem Rechtsvorschlag Dritten nicht mehr bekannt zu geben (Art. 8a Abs. 3 lit. d SchKG) – mit deterministischer 3-Monats-Schwelle seit Zustellung des Zahlungsbefehls. | I Behördeneingaben | fertig | Unterzeichnete Eingabe an das Betreibungsamt – frühestens drei Monate nach Zustellung des Zahlungsbefehls (Art. 8a Abs. 3 lit. d SchKG). | pdf, docx | Art. 8a SchKG | ja |
| `/vorlagen/rubrum` | Rubrum (Entscheidkopf) | Gerüst für den Kopf eines Gerichtsentscheids – Gericht und Besetzung, Parteien und ihre Vertretung, Streitgegenstand (Art. 238 ZPO; beim Weiterzug ans Bundesgericht Art. 112 BGG). | I Behördeneingaben | entwurf | Entwurfsvorlage – vom Gericht zu vervollständigen (Dispositiv, Begründung, Rechtsmittelbelehrung, Unterschrift). | pdf, docx | Art. 238 ZPO; Art. 112 BGG | ja |
| `/vorlagen/scheidungsklage` | Scheidungsklage (unbegründete Eingabe) | Scheidungsklage ohne schriftliche Begründung (Art. 290 ZPO) – gesetzlicher Mindestinhalt mit Scheidungsgrund (Art. 114/115 ZGB), Kinder-, Unterhalts-, Güterrechts- und Vorsorge-Begehren; berechneter Zweijahres-Check. | I Behördeneingaben | fertig | Unterschreiben und im Doppel einreichen (Art. 131 ZPO); Gericht am Wohnsitz einer Partei. | pdf, docx | Art. 290 ZPO; Art. 114 ZGB; Art. 115 ZGB; Art. 23 ZPO | ja |
| `/vorlagen/schlichtungsgesuch-bs` | Schlichtungsgesuch (alle Kantone) | Stellt ein Schlichtungsgesuch nach Art. 202 ZPO zusammen – Parteien, Rechtsbegehren, Streitgegenstand, Beilagen. Behördenadresse automatisch für alle 26 Kantone (PLZ/Gemeinde-genau in ZH/AG/SG/TG/FR/ZG/AI); sachliches Spezial-Routing amtlich abgenommen für Basel-Stadt. | I Behördeneingaben | fertig | Schriftlich in Papierform, eigenhändig zu unterzeichnen | pdf, docx | Art. 202 ZPO; Art. 130 ZPO; Art. 209 ZPO; Art. 212 ZPO | ja |
| `/vorlagen/arbeitsvertrag` | Arbeitsvertrag | Befristeter oder unbefristeter Einzelarbeitsvertrag aus festen Bausteinen – mit harten Schranken für zwingendes Recht (Probezeit, Kündigungsfristen, Ferien, Ferienlohn) und Hinweisen zu Konkurrenzverbot, Überstunden-Wegbedingung und kantonalen Mindestlöhnen. | II Verträge | fertig | Beidseitig zu unterzeichnen | pdf, docx | Art. 319 OR; Art. 335c OR; Art. 361 OR; Art. 362 OR | ja |
| `/vorlagen/auftrag` | Auftrag (Dienstleistungsvertrag) | Dienstleistungsvertrag aus festen Bausteinen (Art. 394 ff. OR) mit Gegenstands-Modulen (Beratung, Treuhand, Inkasso) und Vergütungsweiche – das zwingende jederzeitige Auflösungsrecht (Art. 404 OR) wird offengelegt, keine wirkungslose Ausschlussklausel. | II Verträge | fertig | Formfrei – beidseitig zu unterzeichnen (Beweis) | pdf, docx | Art. 394 OR; Art. 398 OR; Art. 404 OR | ja |
| `/vorlagen/nda` | Geheimhaltungsvereinbarung (NDA) | Geheimhaltungsvereinbarung aus festen Bausteinen (Innominatvertrag, Art. 19 OR) mit Weiche einseitig/gegenseitig, Zweckbindung, Nachwirkungsfrist und optionaler Konventionalstrafe – die richterliche Herabsetzung übermässiger Strafen (Art. 163 Abs. 3 OR) wird offengelegt. | II Verträge | fertig | Formfrei – beidseitig zu unterzeichnen (Beweis) | pdf, docx | Art. 19 OR; Art. 160 OR; Art. 163 OR | ja |
| `/vorlagen/konkubinat` | Konkubinatsvertrag | Konkubinatsvertrag aus festen Bausteinen (Innominatvertrag, Art. 19 OR) mit Kostenschlüssel, Wohn- und Inventar-Regelung, optionaler einfacher Gesellschaft und Auflösungsfolgen – das fehlende gesetzliche Konkubinatsrecht und die Kindesbelange nach Gesetz werden offengelegt. | II Verträge | fertig | Formfrei – beidseitig zu unterzeichnen (Beweis) | pdf, docx | Art. 19 OR; Art. 646 ZGB; Art. 651 ZGB | ja |
| `/vorlagen/mietvertrag` | Mietvertrag (Wohnen · Geschäft · Untermiete) | Mietvertrag mit Objekt-Weiche Wohn-/Geschäftsraum und Untermiete-Variante (Art. 262 OR) aus festen Bausteinen – Kautionsmaximum, Mindestfristen und Index-/Staffel-Voraussetzungen als harte Schranken; kantonale Formularpflicht für den Anfangsmietzins als offengelegtes Form-Gate. | II Verträge | fertig | Beidseitig zu unterzeichnen | pdf, docx | Art. 253 OR; Art. 257e OR; Art. 269b OR; Art. 270 OR | ja |
| `/vorlagen/werkvertrag` | Werkvertrag | Werkvertrag aus festen Bausteinen (Art. 363 ff. OR) mit Weiche bewegliches/unbewegliches Werk – Rügefrist (60 Tage zwingend beim unbeweglichen Werk, Art. 367 Abs. 1bis) und Verjährung (2/5 Jahre, Art. 371) werden offengelegt; Brücke zum Gewährleistungs-Rechner. | II Verträge | fertig | Formfrei – beidseitig zu unterzeichnen (Beweis) | pdf, docx | Art. 363 OR; Art. 367 OR; Art. 371 OR; Art. 377 OR | ja |
| `/vorlagen/forderungsabtretung` | Abtretungserklärung (Zession) | Erklärung der bisherigen Gläubigerseite, eine bestimmte Forderung an eine Erwerberin abzutreten (Art. 164 ff. OR) – mit zwingender Schriftform, Zinsen-Klarstellung und Hinweisen zu Abtretungsverbot und Schuldner-Anzeige. | III Einseitige Willenserklärungen | fertig | Schriftform zwingend (Art. 165 Abs. 1 OR) – drucken und von der Zedentin/dem Zedenten unterschreiben lassen. | pdf, docx | Art. 164 OR; Art. 165 OR; Art. 170 OR | ja |
| `/vorlagen/kuendigung-arbeitgeber` | Kündigung durch Arbeitgeber:in | Kündigungsschreiben mit Live-Prüfung der Sperrfristen (Art. 336c OR): nichtige Kündigungen werden blockiert, Hemmung und Erstreckung fliessen ins Beendigungsdatum ein; Begründung und Freistellung optional. | III Einseitige Willenserklärungen | fertig | Formfrei (vorbehältlich vertraglicher Schriftform) — unterschreiben und an die Wohnadresse zustellen. | pdf, docx | Art. 335 OR; Art. 335c OR; Art. 336c OR; Art. 324 OR | **nein** — Einstieg über Themen-Seite/Register |
| `/vorlagen/kuendigung-arbeitnehmer` | Kündigung durch Arbeitnehmer:in | Kündigungsschreiben der Arbeitnehmerin oder des Arbeitnehmers – mit live berechnetem Beendigungsdatum (Dienstjahr, Probezeit, abweichende Fristen) und Zeugnis-/Abrechnungsbitte. | III Einseitige Willenserklärungen | fertig | Formfrei (vorbehältlich vertraglicher Schriftform) – unterschreiben und nachweisbar zustellen. | pdf, docx | Art. 335 OR; Art. 335b OR; Art. 335c OR; Art. 330a OR | **nein** |
| `/vorlagen/kuendigung-mieter` | Kündigung durch Mieter:in | Kündigungsschreiben für das Mietverhältnis mit live berechnetem Endtermin (Vertrag → Ortsgebrauch → Gesetz), Familienwohnung-Schutz (Art. 266m OR, zweite Unterschrift) und ausserterminlicher Rückgabe mit Nachmieter-Vorschlag (Art. 264 OR). | III Einseitige Willenserklärungen | fertig | Schriftform bei Wohn-/Geschäftsräumen (Art. 266l Abs. 1 OR) — unterschreiben; Familienwohnung: beide unterschreiben. | pdf, docx | Art. 266a OR; Art. 266l OR; Art. 266m OR; Art. 264 OR | **nein** |
| `/vorlagen/kuendigung-vermieter` | Kündigung durch Vermieter:in (Checkliste) | Bewusst keine ausfüllbare Vorlage: Die Vermieter-Kündigung von Wohn- und Geschäftsräumen braucht das amtliche kantonale Formular (Art. 266l Abs. 2 OR) – diese Checkliste führt durch die Gültigkeitsvoraussetzungen (separate Zustellung Art. 266n!) und liefert Termin, Anfechtungs- und Erstreckungsfristen als Auskunft. | III Einseitige Willenserklärungen | – (kein Gate) | Nur mit dem vom Kanton genehmigten amtlichen Formular gültig (Art. 266l Abs. 2 OR) – darum kein Export. | – (kein Export) | Art. 266l OR; Art. 266n OR; Art. 266o OR; Art. 271 OR | **nein** |
| `/vorlagen/mahnung` | Mahnung & Inverzugsetzung | Zahlungsaufforderung, die den Verzug auslöst (Art. 102 OR), mit Verzugszins-Androhung (Art. 104 OR) – als Variante die Nachfristansetzung beim zweiseitigen Vertrag (Art. 107 OR). | III Einseitige Willenserklärungen | fertig | Formfrei – unterschreiben und nachweisbar zustellen (massgebend ist der Zugang). | pdf, docx | Art. 102 OR; Art. 104 OR; Art. 107 OR | ja |
| `/vorlagen/verjaehrungsverzicht` | Verjährungsverzichtserklärung | Erklärung der Schuldnerseite, befristet auf die Einrede der Verjährung zu verzichten (Art. 141 OR) – mit fester Begrenzung auf die gesetzliche Höchstdauer und Klarstellung, dass keine Anerkennung vorliegt. | III Einseitige Willenserklärungen | fertig | Schriftform zwingend (Art. 141 Abs. 1bis OR) – drucken und von der Schuldnerseite unterschreiben lassen. | pdf, docx | Art. 141 OR | ja |
| `/vorlagen/kuendigung-vertrag` | Vertrag kündigen (Versicherung · Krankenkasse · Darlehen · Auftrag · Abo) | Ein Kündigungsschreiben mit Vertragstyp-Presets: Versicherung (Art. 35a VVG, Drei-Jahres-Regel), Krankenkassen-Grundversicherung (Art. 7 KVG, Prämienmitteilung bzw. Semesterende), Darlehen mit 6-Wochen-Frist (Art. 318 OR), Auftrag mit Unzeit-Warnung (Art. 404 OR), Abo/Telecom nach AGB – ohne erfundene Fristen. | III Einseitige Willenserklärungen | fertig | Formfrei (Versicherung: schriftlich oder textnachweisbar, Art. 35a VVG) — unterschreiben und nachweisbar zustellen. | pdf, docx | Art. 35a VVG; Art. 7 KVG; Art. 318 OR; Art. 404 OR | ja |
| `/vorlagen/vollmacht` | Vollmacht (Anwalt · General · Spezial) | Anwaltsvollmacht, Generalvollmacht oder Spezialvollmacht in einer Maske – besondere Ermächtigungen (Art. 396 Abs. 3 OR), Substitution, Befristung und deterministische Form-Warnungen (Grundstück, Bank, Bürgschaft). | III Einseitige Willenserklärungen | fertig | Einfache Schriftform – drucken und unterschreiben | pdf, docx | Art. 32 OR; Art. 33 OR; Art. 34 OR; Art. 35 OR; Art. 396 OR; Art. 68 ZPO | ja |
| `/vorlagen/ag-gruendung` | AG-Gründung (Checkliste + Dokumentmappe) | Unterlagenliste UND Volldokumente für die AG-Gründung nach Konstellation (Opting-out, Inhaberaktien, c/o-Domizil, Lex Koller): Bei der Bargründung mit Namenaktien entstehen Statuten und Errichtungsakt als Entwurf für die Urkundsperson (die öffentliche Beurkundung bleibt zwingend) sowie Wahlannahmen, VR-Konstituierungsprotokoll und die Handelsregister-Anmeldung druckfertig – mit Notariats-Anlaufstelle je Kanton, Teilliberierungs-Prüfung (Art. 632 OR) und Emissionsabgabe-Hinweis. | IV Gesellschaftsrecht | gemischt | Errichtungsakt nur als öffentliche Urkunde (Art. 629 Abs. 1 OR) – Statuten und Urkunde darum ausschliesslich als ENTWURF mit Wasserzeichen; gültig wird nur die beurkundete Fassung. Beurkundungsfreie Erklärungen, VR-Protokoll und HR-Anmeldung sind druckfertig. | pdf, docx | Art. 629 OR; Art. 626 OR; Art. 632 OR; Art. 43 HRegV | ja |
| `/vorlagen/gmbh-gruendung` | GmbH-Gründung (Checkliste + Dokumentmappe) | Unterlagenliste UND Volldokumente für die GmbH-Gründung nach Konstellation (Opting-out, c/o-Domizil, Lex Koller, Statuten-Klauseln): Bei der Bargründung entstehen Statuten und Errichtungsakt als Entwurf für die Urkundsperson (die öffentliche Beurkundung bleibt zwingend) sowie Wahlannahme- und Domizilerklärungen, Beschlüsse und die Handelsregister-Anmeldung druckfertig – mit Notariats-Anlaufstelle je Kanton und Emissionsabgabe-Hinweis. | IV Gesellschaftsrecht | gemischt | Errichtungsakt nur als öffentliche Urkunde (Art. 777 Abs. 1 OR) – Statuten und Urkunde darum ausschliesslich als ENTWURF mit Wasserzeichen; gültig wird nur die beurkundete Fassung. Beurkundungsfreie Erklärungen und die HR-Anmeldung sind druckfertig. | pdf, docx | Art. 777 OR; Art. 776 OR; Art. 777c OR; Art. 71 HRegV | ja |
| `/vorlagen/kapitalerhoehung` | Kapitalerhöhung (AG / GmbH) | Ordentliche Kapitalerhöhung gegen Bareinlage als Dokumentmappe: Erhöhungsbeschluss und Feststellungs-Urkunde mit Statutenänderung als Entwurf für die Urkundsperson (öffentliche Beurkundung bleibt zwingend, Art. 650/652g OR), Zeichnungsscheine je Person, Kapitalerhöhungsbericht und Handelsregister-Anmeldung druckfertig – mit 6-Monats-Verfalls-Warnung (Art. 650 Abs. 3 / 781 Abs. 4 OR) und Notariats-Anlaufstelle je Kanton. | IV Gesellschaftsrecht | gemischt | Erhöhungsbeschluss (Art. 650 Abs. 2 OR) und Feststellungs-Urkunde (Art. 652g Abs. 2 OR) nur als öffentliche Urkunde – beide darum ausschliesslich als ENTWURF mit Wasserzeichen. Zeichnungsscheine, Bericht und Anmeldung sind druckfertig. | pdf, docx | Art. 650 OR; Art. 652 OR; Art. 652g OR; Art. 781 OR | ja |
| `/vorlagen/testament` | Eigenhändiges Testament | Letztwillige Verfügung aus festen Bausteinen – mit Pflichtteils-Kontrolle, Bausteinprotokoll und Form-Gate; Ausgabe als Mustertext zum eigenhändigen Abschreiben. | V Vorsorge & Nachlass | abschrift | Eigenhändig abzuschreiben – von Hand, datiert, unterschrieben | **pdf** (kein DOCX) | Art. 505 ZGB; Art. 467 ZGB; Art. 471 ZGB; Art. 483 ZGB; Art. 484 ZGB | ja |
| `/vorlagen/patientenverfuegung` | Patientenverfügung | Medizinische Massnahmen, Behandlungsziel und Vertretungsperson – mit Konsistenz-Prüfung und Form-Gate; am Computer erstellbar, handschriftlich zu unterschreiben. | V Vorsorge & Nachlass | fertig | Schriftlich – ausdrucken, handschriftlich datieren und unterschreiben | pdf, docx | Art. 370 ZGB; Art. 371 ZGB; Art. 372 ZGB; Art. 378 ZGB | ja |
| `/vorlagen/vorsorgeauftrag` | Vorsorgeauftrag | Personensorge, Vermögenssorge und Vertretung im Rechtsverkehr bei Urteilsunfähigkeit – mit Form-Weiche (eigenhändig oder beurkundet), Sondervollmachten und KESB-Hinweisen. | V Vorsorge & Nachlass | abschrift | Eigenhändig abzuschreiben ODER öffentlich zu beurkunden | pdf, docx (DOCX bei «eigenhändig» unterdrückt — N6) | Art. 360 ZGB; Art. 361 ZGB; Art. 363 ZGB; Art. 396 OR | ja |

#### 5.1.2 Geplant (Status `geplant`, 42 Einträge, kein Export, kein UI)

| Titel | Kurzbeschrieb | Kategorie (art) | Rechtsgebiet | Formvorschrift |
|---|---|---|---|---|
| Aberkennungsklage | Strukturiertes Gerüst für die Aberkennungsklage nach provisorischer Rechtsöffnung. | I Behördeneingaben | Betreibung & Konkurs (SchKG) | – |
| Abänderung des Scheidungsurteils (Unterhalt) | Abänderungsklage nach Art. 129/134 ZGB mit Haupt-/Eventualantrag und deterministischen Timing-Regeln. | I Behördeneingaben | Familienrecht | – |
| Adhäsionsklage | Strukturiertes Gerüst für Zivilansprüche im Strafverfahren. | I Behördeneingaben | Strafrecht & Strafprozess | – |
| Akteneinsichtsgesuch | Gesuch um Einsicht in die Verfahrensakten. | I Behördeneingaben | Strafrecht & Strafprozess | – |
| Arrestgesuch | Strukturiertes Gerüst für das Arrestgesuch. | I Behördeneingaben | Betreibung & Konkurs (SchKG) | – |
| Bauhandwerkerpfandrecht – Gesuch um vorläufige Eintragung | Superprovisorisches Eintragungsgesuch mit dem 4-Monats-Verwirkungs-Gate ab Vollendung (Art. 839 Abs. 2 ZGB). | I Behördeneingaben | Vertrag & Forderung (OR) | – |
| Beschwerde | Verwaltungsbeschwerde mit Anträgen, Begründung und Beilagen. | I Behördeneingaben | Verwaltungsrecht | – |
| Beschwerde gegen Betreibungs- & Konkursämter | Strukturiertes Gerüst für die betreibungsrechtliche Beschwerde an die Aufsichtsbehörde. | I Behördeneingaben | Betreibung & Konkurs (SchKG) | – |
| Einsprache (Straf-/Verwaltungsbefehl) | Fristgerechte Einsprache mit Antrag und Begründungsgerüst. | I Behördeneingaben | Strafrecht & Strafprozess | – |
| Entschädigungsbegehren | Strukturiertes Gerüst für Entschädigungs- und Genugtuungsbegehren im Strafverfahren. | I Behördeneingaben | Strafrecht & Strafprozess | – |
| Gesuch um vorsorgliche Beweisführung (Art. 158 ZPO) | Gerichtsgutachten vor dem Prozess – Fragenkatalog-Raster (nur Tatfragen) und Kostenvorbehalts-Formel. | I Behördeneingaben | Zivilprozess (ZPO) & Bundesgericht | – |
| Honorarklage (Architektur · Dienstleistung) | Forderungsklage mit gesplittetem Zinslauf und Zusatzleistungs-Block (Art. 394/363 ff. OR, SIA-102-Honorarmodell). | I Behördeneingaben | Vertrag & Forderung (OR) | – |
| Klage auf Auflösung eines Konkubinats | Objektive Klagenhäufung: Liquidation der einfachen Gesellschaft, Realzuteilung, Miteigentumsaufhebung (Art. 530 ff. OR/650 f. ZGB). | I Behördeneingaben | Familienrecht | – |
| Klage auf Durchsetzung eines Konkurrenzverbots | Konventionalstrafe + Unterlassungsbegehren mit 10-Punkte-Gültigkeits-Checkliste (Art. 340 ff. OR). | I Behördeneingaben | Arbeit | – |
| Klage aus Werkmängeln (Besteller/Bauherr) | Sachgewährleistungs-/Ersatzvornahme-Klage mit Rüge- und Verjährungs-Gates (Art. 367 ff. OR, SIA-118-Weiche). | I Behördeneingaben | Vertrag & Forderung (OR) | – |
| Klage gegen den Versicherer (VVG-Leistungen) | Leistungsklage gegen Kürzung/Verweigerung mit Verfahrens-Weiche KV-Zusatz (Art. 243 Abs. 2 lit. f ZPO) und Verzugsrechner nach Art. 41 VVG. | I Behördeneingaben | Weitere Rechtsgebiete | – |
| Klage nach Kündigung (Lohn · Überstunden · Entschädigung · Zeugnis) | Arbeitsrechtliche Leistungsklage nach ordentlicher oder fristloser Kündigung – Brutto-/Netto-Raster, 336b-Verwirkungs-Gates, Zeugnisberichtigung. | I Behördeneingaben | Arbeit | – |
| Rechtsvorschlag | Erklärung des Rechtsvorschlags gegen den Zahlungsbefehl. | I Behördeneingaben | Betreibung & Konkurs (SchKG) | – |
| Rechtsöffnungsbegehren | Begehren um provisorische oder definitive Rechtsöffnung mit Forderungsnachweis. | I Behördeneingaben | Betreibung & Konkurs (SchKG) | – |
| Rekurs | Strukturiertes Gerüst für den kantonalen Rekurs. | I Behördeneingaben | Verwaltungsrecht | – |
| Strafantrag | Strafantrag der berechtigten Person bei Antragsdelikten. | I Behördeneingaben | Strafrecht & Strafprozess | – |
| Strafanzeige | Anzeige eines Sachverhalts an die Strafverfolgungsbehörden. | I Behördeneingaben | Strafrecht & Strafprozess | – |
| Teilklage Personenschaden (Direktklage Versicherer) | Haftpflicht-Teilklage mit Direktforderungsrecht (Art. 65 SVG), Kongruenz-/Quotenvorrecht-Struktur und Nachklagevorbehalt. | I Behördeneingaben | Weitere Rechtsgebiete | – |
| Aufhebungsvereinbarung | Strukturiertes Gerüst für die einvernehmliche Beendigung des Arbeitsverhältnisses. | II Verträge | Arbeit | – |
| Darlehensvertrag | Privates Darlehen mit Zins-, Rückzahlungs- und Kündigungsregeln. | II Verträge | Vertrag & Forderung (OR) | – |
| Einfacher Kaufvertrag | Kauf beweglicher Sachen mit Gewährleistungs- und Lieferklauseln. | II Verträge | Vertrag & Forderung (OR) | – |
| Elternvereinbarung | Strukturiertes Gerüst zu Obhut, Betreuung und Unterhalt. | II Verträge | Familienrecht | – |
| Scheidungskonvention | Strukturiertes Gerüst für die Vereinbarung der Scheidungsfolgen. | II Verträge | Familienrecht | – |
| Trennungsvereinbarung | Strukturiertes Gerüst für die Regelung des Getrenntlebens. | II Verträge | Familienrecht | – |
| Vergleichsvereinbarung | Strukturiertes Gerüst für den aussergerichtlichen Vergleich. | II Verträge | Vertrag & Forderung (OR) | – |
| Arbeitszeugnis | Strukturiertes Gerüst für Voll- und Zwischenzeugnisse. | III Einseitige Willenserklärungen | Arbeit | – |
| Auskunftsbegehren (Datenschutz) | Begehren um Auskunft über die Bearbeitung eigener Personendaten. | III Einseitige Willenserklärungen | Datenschutzrecht | – |
| Freistellung | Strukturiertes Gerüst für die Freistellungserklärung. | III Einseitige Willenserklärungen | Arbeit | – |
| Löschungsbegehren (Datenschutz) | Begehren um Löschung von Personendaten. | III Einseitige Willenserklärungen | Datenschutzrecht | – |
| Schuldanerkennung | Schriftliche Anerkennung einer Schuld als Grundlage der späteren Durchsetzung. | III Einseitige Willenserklärungen | Vertrag & Forderung (OR) | – |
| Verwarnung | Strukturiertes Gerüst für die arbeitsrechtliche Verwarnung. | III Einseitige Willenserklärungen | Arbeit | – |
| GV-/VR-Beschluss | Beschlussprotokoll für Generalversammlung oder Verwaltungsrat. | IV Gesellschaftsrecht | Gesellschaftsrecht | – |
| Statuten | Statuten für GmbH oder AG mit den üblichen Wahlbestimmungen. | IV Gesellschaftsrecht | Gesellschaftsrecht | – |
| Erbteilungsvereinbarung | Strukturiertes Gerüst für die Teilung des Nachlasses unter den Erbinnen und Erben. | V Vorsorge & Nachlass | Erbrecht | – |
| Erbvertrag | Entwurf für die vertragliche Nachlassregelung – zur Vorbereitung der Beurkundung. | V Vorsorge & Nachlass | Erbrecht | – |
| Erbverzichtsvertrag | Verzicht auf die Erbenstellung – Entwurf zur öffentlichen Beurkundung. | V Vorsorge & Nachlass | Erbrecht | Öffentliche Beurkundung |
| Öffentliches Testament | Vorbereitungsentwurf für die öffentliche Beurkundung bei der Urkundsperson. | V Vorsorge & Nachlass | Erbrecht | – |

**Quelle:** `src/lib/startseiteVorlagen*.ts` (+ `src/lib/startseiteKartenAusbau.ts` für
die Karte `kapitalerhoehung`, siehe N3), Typ `VorlageCard` in
`src/lib/startseiteConfigTypen.ts`, Routen `src/routesManifest.ts`.

### 5.2 Vorlagen-Übersicht (`/vorlagen`)

**Zweck.** Register aller einsatzbereiten Vorlagen, nach den fünf Dokument-Gruppen
gegliedert, mit Rechtsgebiet-Filter — der einzige Einstiegspunkt in den
Vorlagen-Katalog neben Cross-Links und Themen-Seiten.

**Elemente:**

- Seitenkopf — Titel «Vorlagen» plus Ausgabe-Zeile «26 Vorlagen, nach Rechtsgebiet
  filterbar» (Zahl aus dem generierten Zähler; sie zählt die **im Register sichtbaren**
  Karten, also 30 Routen minus die 4 mit `imKatalog: false`).
- **Entwurf-Legende** — Ein-Zeilen-Legende «Entwurf» plus Text «erstellt, fachlich noch
  nicht geprüft». Klick oder Enter öffnet ein Popover mit dem ausführlichen Text: «Das
  Werkzeug ist erstellt, aber fachlich noch nicht geprüft. Zahlen und Aussagen im
  Einzelfall gegen Gesetz und Sachverhalt verifizieren.» Schliesst auf Escape oder
  Aussenklick.
- **Vorlagen-Register** — für jede der fünf Sektionen (**Behördeneingaben · Verträge ·
  Einseitige Willenserklärungen · Gesellschaftsrecht · Vorsorge & Nachlass**) ein
  Gruppenkopf (Titel + Anzahl verfügbar + Lede-Satz) und darunter die Trefferzeilen.
  - **Behördeneingaben** zusätzlich in drei Unterrubriken: «Klagen – allgemein» ·
    «Klagen – besondere Konstellationen» · «Gesuche & sonstige Eingaben».
  - **Verträge** in sieben Rubriken: Arbeit & Personal · Miete & Pacht · Kauf &
    Schenkung · Auftrag & Werkvertrag · Darlehen, Sicherheiten & Forderung · Familie &
    Partnerschaft · Zusammenarbeit & Geheimhaltung. Ab mehr als 6 Karten je Rubrik
    klappt die Rubrik hinter ein Klappelement.
- **Rechtsgebiet-Filter** — eine Auswahlliste (Label «Filtern»), URL-Zustand `?rg=`
  (Komma-Liste, praktisch ein Wert) plus `?status=verfuegbar`. Die Fusszeile nennt
  Bereich und Trefferzahl.
- **Massgebende Gesetze** (Modus Vorlage) — Liste der einschlägigen Erlasse.
- **Katalog-Hinweis** — Methodik-Zeile («So rechnet LexMetrik: …», Link `/methodik`)
  plus rechtlicher Hinweis («Alle Rechner liefern automatisierte
  Orientierungsberechnungen und keine Rechtsberatung. Massgeblich sind Gesetz, GAV,
  Vertrag und der konkrete Sachverhalt…»).

**Eingaben & Interaktionen.** Jede Trefferzeile ist ein Link auf die Vorlagen-Route;
ein Klick führt direkt zum Wizard, **kein Zwischenschritt**. Der Rechtsgebiet-Filter
engt live alle Gruppen gemeinsam ein (kein Neuladen). Die Klapp-Zeile **«In
Vorbereitung (N)»** am Sektionsfuss listet alle geplanten Karten namentlich (nur
Titel, mit «·» getrennt), ohne eigenen Link.

**Zustände.** Karten mit Status `entwurf` tragen das Badge «Entwurf». Bei aktivem,
aber leerem Filter: Leerzustand «Keine Vorlage in dieser Auswahl.» plus Rücksetz-Link.
**Karten mit `imKatalog: false`** — die vier Kündigungs-Einzelmasken
(Arbeitgeber/Arbeitnehmer/Mieter/Vermieter) — erscheinen **nicht** im Register; sie
bleiben nur über Themen-Einstiege (z. B. «Kündigung & Fristen im Arbeitsverhältnis»)
und Cross-Links erreichbar. Ihre Katalogkarte bleibt trotzdem die Quelle für Kopf,
Normen und Formvorschrift der Zielseite.

**Persistenz.** `?rg=` und `?status=` in der URL.

**Quelle:** `src/pages/VorlagenUebersicht.tsx`, `src/components/Katalog.tsx`,
`src/components/{EntwurfLegende,KatalogHinweis}.tsx`,
`src/components/normtext/MassgebendeGesetze.tsx`, `src/lib/katalogKategorie.ts`,
`src/lib/oberkategorien.ts`, `src/lib/vorlagenKategorie.ts`.

### 5.3 Gemeinsamer Vorlagen-Rahmen

Fast alle 30 Vorlagen-Seiten sind dünne Konfigurationen über zwei geteilten
Bausteinen: eine **Orchestrierungs-Seite** (Zustand, Gates, Schritt-Fehler,
«Prüfen»-Schritt) rendert den **Wizard-Rahmen** plus **Vorschau-Panel** und
**Export-Leiste**. 22 der 30 Seiten nutzen die Orchestrierungs-Seite direkt (opt-in —
«nur für LINEARE Standard-Briefe»); die übrigen bleiben handgeschrieben, weil sie
Schalter, dynamische Labels oder eigene Zusatz-Panels brauchen: Arbeitsvertrag,
Mietvertrag, Vorsorgeauftrag, Testament, Patientenverfügung, Vollmacht,
Klage-Vereinfacht, Klage-Ordentlich, Schlichtungsgesuch, Eheschutzgesuch,
Scheidungsklage, Scheidungsbegehren, Kündigung-Arbeitgeber, Kündigung-Mieter, Mahnung,
Kündigung-Vertrag. Sie rufen Wizard-Rahmen, Vorschau-Panel und Export-Leiste aber
wortgleich direkt auf. **Die drei Dokumentmappen** (GmbH-Gründung, AG-Gründung,
Kapitalerhöhung) laufen **nicht** über den Wizard-Rahmen, sondern über eine eigene
Mappen-Ansicht (5.5).

#### 5.3.1 Kopf (immer gleich)

1. Link **«← Zurück zum Katalog»** (Standardziel `/vorlagen`).
2. Etiketten-Zeile: Overline «{Rechtsgebiet} · Vorlage» plus **Formvorschrift-Badge**
   im Warn-Ton (Text je Seite, z. B. «Zu unterzeichnen», «Papierform · eigenhändig
   unterzeichnen», «Nach dem Ausdruck datieren»).
3. Seitentitel (Serifen-Stimme) = Vorlagentitel; darunter ein Intro-Absatz in
   Serifenschrift.
4. **Norm-Chip-Zeile** — ein Chip je Norm der Karte, verlinkt auf Fedlex.
5. **«Zuerst rechnen:»**-Zeile mit Links auf einschlägige Rechner — nur sichtbar, wenn
   für diese Karte eine Kante geführt wird (sonst leer, kein DOM).
6. Optional: Knopf **«↺ Eingaben zurücksetzen»** (mit Bestätigungsdialog) plus
   Speicher-Hinweis («Ihre Eingaben verlassen den Browser nicht, werden aber lokal auf
   diesem Gerät zwischengespeichert…» bzw. ein seiten-eigener Text — das
   Schlichtungsgesuch sagt: keine Speicherung).

#### 5.3.2 Kopf-Schalter (optional)

Zwischen Kopf und Schrittleiste, zwei **unabhängig kombinierbare** Achsen:

- **Untertyp** — Segment-Kacheln für regime-treue Varianten innerhalb **einer** Route.
  Beispiele: Arbeitsvertrag (Einzel / Kader / Lehrvertrag / Handelsreisender /
  Heimarbeit) · Mietvertrag (Wohnung / Geschäftsraum; Miete / Untermiete) · Vollmacht
  (Anwalt / General / Spezial) · Kündigung-Vertrag (Versicherung / Krankenkasse /
  Darlehen / Auftrag / Abo) · Mahnung (Geldforderung / Nachfrist).
- **Detailgrad** — **immer** dieselben drei Stufen: **«Einfach»** (nur Kernklauseln) ·
  **«Standard»** (vollständige Grundausstattung, Vorgabe, byte-gleich zum
  Vor-Feature-Stand fixiert) · **«Experte»** (mit allen Zusatzmodulen). Steuert per
  Bedingung, welche Bausteine ins Dokument kommen. **Sechs Vertragskarten** führen das
  Feld: Arbeitsvertrag, Mietvertrag, Auftrag, Werkvertrag, NDA, Konkubinat. Global
  vorbelegt aus den Einstellungen (1.6); ein gespeicherter Wizard-Stand gewinnt.

#### 5.3.3 Schritt-Navigation

Mobil ein Fortschrittsbalken plus die Zeile «Schritt N/M»; ab dem kleinen Breakpoint
klickbare Schritt-Chips mit laufender Nummer bzw. «✓» für erledigte Schritte.
**Schritte sind nur aufsteigend klickbar** — ein noch nicht erreichter Schritt ist
deaktiviert mit dem Tooltip «Noch nicht erreichbar — vorherige Schritte zuerst
ausfüllen»; rückwärts ist jederzeit frei. **Jede Vorlage endet mit dem Schritt «Prüfen
& …»** (Download / Ausgeben / Unterzeichnen / Abschreiben / Ausfüllen — die
Formulierung variiert je Vorlage und ist unten je Block genannt).

#### 5.3.4 Formular-Spalte (links)

Feld-Bausteine: **Feld-Rahmen** (Label, optionaler Hilfetext, «· optional»-Kennzeichnung,
Fehlerzeile am Feld), **Ankreuzfeld** (Label + optionaler Hilfetext), native
Eingabe-, Auswahl- und Textfelder. Navigation unten: **«← Zurück»** (deaktiviert im
ersten Schritt) / **«Weiter →»** (deaktiviert bei offenen Pflichtfeldern, mit dem
Hinweis «Bitte Pflichtfelder ausfüllen»).

**Grundsatz David 14.6.2026:** Im leeren Anfangszustand werden **keine**
Validierungsfehler angezeigt — die Fehlerbox erscheint erst nach der ersten Eingabe
oder Änderung im Formular («berührt»); der «Weiter»-Knopf bleibt davon unabhängig
gesperrt.

#### 5.3.5 Prüfen-Schritt (letzter Schritt, immer gleich)

Der **Prüfbefund** sammelt die Fehler **aller** vorherigen Schritte — nicht nur des
sichtbaren — und zeigt entweder «Alle Pflichtangaben dieser Vorlage sind ausgefüllt.»
oder eine Liste offener Punkte mit Sprung-Knöpfen **«Schritt N · {Label} →»** zurück in
den lückenhaften Schritt. Darunter: Feld **«Ort und Datum»** (das einzige Pflichtfeld
dieses Schritts), ein Bestätigungs-Abschnitt (seiten-eigener Erklärtext plus
Ankreuzfeld «Ich habe verstanden: …») und die Export-Leiste.

#### 5.3.6 Vorschau-Spalte (rechts)

Klebend ab dem mittleren Breakpoint; mobil ein Klappelement **«Vorschau &
Bausteinprotokoll»**, das ab dem Prüfen-Schritt automatisch offen ist.

Inhalt: eine live gerenderte **«Papier»-Vorschau**, die dieselben Absatz-Rollen
interpretiert wie PDF und DOCX (`absender`/`adressat`, `datumzeile`, `betreff`,
`rubrum`, `parteien`, `anrede`, `schlussformel`, `unterschrift`, Standard-Block); ein
**Stil-Umschalter «Nüchtern ⇄ Modern»** (wirkt auf Vorschau **und** Export
gleichermassen); eine Disclaimer-Fusszeile; eine Direkt-Export-Zeile («Direkt
herunterladen – auch unausgefüllt…»); und ein aufklappbares **Bausteinprotokoll** («N
Bausteine», je Zeile Baustein-ID, Begründung, optionaler Warn-Hinweis, optionaler
Norm-Link). Mobil zusätzlich ein schwebender Knopf **«Vorschau ↓»**, der ausblendet,
sobald die Vorschau im Bild ist.

#### 5.3.7 Export-Leiste

Ein PDF-Knopf mit banner-abhängigem Label (der Renderer wird lazy geladen), optional
ein DOCX-Knopf (**nur** wenn die Karte `docx` führt **und** die Formvorschrift es
zulässt — reines Form-Gate) und ein Kopier-Knopf («Text kopieren»).

**Daueranweisung David 12.6.2026:** Der Export ist **immer** möglich, auch bei leerem
Formular — offene Pflichtfelder erscheinen im Dokument als Ausfüll-Striche
(«________»). Fehlen Angaben, fragt der Export-Klick **einmal pro Sitzung** nach («Es
fehlen N Pflichtangaben — trotzdem exportieren?»), danach nicht mehr. Gesperrt wird
**nur** bei echten fachlichen Blockern (z. B. eine wegen Sperrfrist nichtige
Kündigung) — eine fehlende Angabe ist **kein** Blocker.

#### 5.3.8 Speicherung

Antworten optional in `localStorage` unter einem seiten-eigenen Schlüssel
(`lexmetrik.vorlage.<id>.v<n>`). Ohne Speicherschlüssel (Schlichtungsgesuch) bleibt der
Zustand nur im Speicher der Sitzung. Der **Profil-Prefill** befüllt **nur leere**
Absendername- und Absenderadresse-Felder aus den App-Einstellungen, nie gespeicherte
oder Vorgabe-Werte.

#### 5.3.9 Formvorschrift-Banner und Ausgabe-Art

Jede Vorlage trägt einen festen **Warn-Banner** im PDF und DOCX, der die Formvorschrift
wiederholt — drei Standard-Banner (Abschreiben fürs eigenhändige Testament ·
Unterschreiben für schriftliche Dokumente · Mappe-fertig für Mappen-Dokumente) sowie
seiten-eigene Banner-Texte.

**Die vier Ausgabe-Arten (Form-Gate):**

| Gate | Bedeutung | DOCX |
|---|---|---|
| `abschrift` | nur Abschreibe-Mustertext (Eigenhändigkeitspflicht) | nein |
| `entwurf` | Vorbereitungs-Entwurf für die Urkundsperson; Wasserzeichen «ENTWURF», Hinweis «ENTWURF zur Vorbereitung der öffentlichen Beurkundung – kein gültiges Dokument.» | ja |
| `fertig` | druckfertig zum Unterschreiben, kein Wasserzeichen | ja |
| `gemischt` | Dokumentmappe mit `entwurf`- **und** `fertig`-Teilen (Gründungsmappen, Kapitalerhöhung) | je Dokument |

Die Übereinstimmung von Katalog-Gate und Schema-Ausgabeart wird mechanisch erzwungen.

**Quelle:** `src/components/vorlagen/{wizard,VorlagenSeite,PruefBefund,VariantenKopf,ui,Dokumentmappe}.tsx`,
`src/components/vorlagen/{useWizardState,ausgabeStil,passendeRechnerDaten}.ts`,
`src/lib/vorlagen/{engine,detailgrad,banner,formatvorlagen,variantenInventar}.ts`,
`src/tests/formGate.test.ts`.

### 5.4 Die 30 gebauten Vorlagen im Einzelnen

Format je Block: **Zweck · Schritte** (wörtliche Schrittnamen) · **Eingaben je
Schritt** (gruppiert) · **Vorschau/Ausgabe · Varianten · Formvorschrift/Export ·
Status · Quelle**. Formvorschrift, Export, Normen und Kurzbeschrieb stehen bereits
wörtlich in Tabelle 5.1.1 — hier nur Kurzform plus Verweis.

#### I · Behördeneingaben

##### 5.4.1 `/vorlagen/schlichtungsgesuch-bs` — Schlichtungsgesuch (alle Kantone)

- **Zweck:** Schlichtungsgesuch nach Art. 202 ZPO; die Behörde wird für alle 26
  Kantone automatisch aufgelöst (Basel-Stadt mit amtlich abgenommenem
  Spezial-Routing).
- **Schritte:** Streitgegenstand & Vorprüfung · Klagende Partei · Beklagte Partei ·
  Rechtsbegehren · Streitgegenstand · Anträge & Beilagen · Prüfen & Download.
- **Eingaben:** *Parteien* (je Partei, Liste): Typ (natürliche / juristische Person) ·
  Vorname/Name bzw. Firma/Rechtsform/UID · Adresse (Strasse, PLZ, Ort) bzw.
  Sitz-Adresse · Zeichnungsberechtigte Person (optional). *Verfahren:* Kanton
  (Pflicht, löst die Behörde auf) · Behörde/Gericht + Adresse (Handeingabe, wenn kein
  automatischer Treffer) · Streitwert (CHF, optional, steuert die
  Art. 210/212-Schwelle). *Vertretung* (optional): Bezeichnung · Kanzlei/Zusatz ·
  Adresse · Vollmacht-Datum. *Rechtsbegehren:* Betreibung (Nr./Amt, optional) ·
  Geldbegehren (Betrag CHF, Zins %/seit) **oder** unbeziffertes Begehren
  (Mindestbetrag, Begründung der Unbezifferbarkeit). *Streitgegenstand*
  (Pflicht-Freitext) · *Begründung* (optional) · Ort/Datum.
- **Vorschau/Ausgabe:** Eingabe-Format (Absender-/Adressat-Block, Betreff,
  Rechtsbegehren-Ziffern, Beilagenverzeichnis, Unterschriftslinie).
- **Varianten:** keine Untertyp- oder Detailgrad-Achse; die Behörden-/Kanton-Auflösung
  ist die einzige Weiche.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Kein Speicherschlüssel** — Eingaben
  werden bewusst **nicht** lokal gespeichert.
- **Status:** entwurf. **Quelle:** `src/pages/VorlageSchlichtungsgesuchBs.tsx`,
  Schema `src/lib/vorlagen/schlichtungsgesuchBs.ts`.

##### 5.4.2 `/vorlagen/klage-vereinfacht` — Klage (vereinfachtes Verfahren)

- **Zweck:** Klage nach Art. 244 ZPO, Streitwert bis CHF 30'000.
- **Schritte:** Materie & Streitwert · Parteien · Rechtsbegehren · Begründung
  (freiwillig) · Klagebewilligung & Beilagen · Prüfen & Ausgabe.
- **Eingaben:** *Parteien* (Klägerin/Beklagte, je: Vorname/Name, Strasse/PLZ/Ort bzw.
  Firma/UID/Sitz) · *Vertretung* (optional). Streitwert (CHF, Pflicht) · Zins (%, seit
  — optional) **oder** Mindestwert + Grund der Unbezifferbarkeit. Betreibungs-Nr.
  (optional). Streitgegenstand (Stichworte, Pflicht). Beweismittel-Liste (Bezeichnung,
  «zum Beweis von»). *Klagebewilligung:* Datum der Eröffnung/Zustellung (Pflicht) ·
  Ausnahme/Verzicht Art. 198/199 ZPO (Auswahl: gemeinsamer Verzicht ≥ CHF 100'000 /
  einseitiger Verzicht / Ausnahme Art. 198). Ort/Datum.
- **Vorschau/Ausgabe:** Eingabe-Format; Rechtsbegehren nummeriert, Beweismittel- und
  Beilagenverzeichnis, Klagebewilligung als Beilage.
- **Varianten:** Materie-Weiche steuert den Gerichts-Adressat (26 Kantone,
  Spruchkörper-Routing amtlich für Basel-Stadt); kein Detailgrad-Schalter.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageKlageVereinfacht.tsx`, Schema
  `src/lib/vorlagen/klageVereinfacht.ts`.

##### 5.4.3 `/vorlagen/klage-ordentlich` — Klage (ordentliches Verfahren)

- **Zweck:** Klageschrift nach Art. 221 ZPO, Streitwert über CHF 30'000.
- **Schritte:** Gericht & Streitwert · Parteien · Rechtsbegehren · Begründung
  (Pflicht) · Klagebewilligung & Beilagen · Prüfen & Ausgabe.
- **Eingaben:** analog zur vereinfachten Klage (Parteien, Streitwert/Zins,
  Betreibungs-Nr., Streitgegenstand, Klagebewilligung mit Verzichts-Weiche
  Art. 198/199 ZPO), **zusätzlich** Tatsachenbehauptungen **mit Beweisofferte je
  Ziffer als Pflichtfeld** (nicht freiwillig wie im vereinfachten Verfahren) und
  Vertretung (Name/Kanzlei, Vollmacht als Beilage).
- **Vorschau/Ausgabe:** Eingabe-Format; der Begründungs-Abschnitt ist zwingend
  vorhanden (anders als bei der vereinfachten Klage).
- **Varianten:** keine. **Formvorschrift/Export:** `fertig`, PDF/DOCX.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageKlageOrdentlich.tsx`, Schema
  `src/lib/vorlagen/klageOrdentlich.ts`.

##### 5.4.4 `/vorlagen/eheschutzgesuch` — Eheschutzgesuch

- **Zweck:** Gesuch um Regelung des Getrenntlebens, Art. 175 f. ZGB (summarisches
  Verfahren).
- **Schritte:** Gericht · Parteien & Kinder · Massnahmen & Unterhalt · Prüfen & Ausgabe.
- **Eingaben:** *Gericht:* Kanton (Gerichts-Wahl-Block) · faktisch getrennt seit
  (optional). *Parteien:* Gesuchstellende und gegnerische Partei (Name/Adresse) ·
  Vertretung (optional) · gemeinsame Kinder (Liste: Vorname, Geburtsdatum) ·
  Obhut-Antrag (Auswahl) · Kindesunterhalt (Bar- und Betreuungsunterhalt CHF/Monat).
  *Massnahmen:* eheliche Wohnung (Auszugsfrist in Tagen) · Ehegattenunterhalt
  (CHF/Monat — «Ihre eigene Würdigung, LexMetrik rechnet keinen Unterhalt») ·
  Schuldneranweisung (Arbeitgeberin bzw. Schuldner der Gegenpartei) · Gütertrennung ·
  Vermögenswert-Verfügungsbeschränkung (individuell). Ort/Datum der Eingabe.
- **Vorschau/Ausgabe:** Eingabe-Format, Begehren-Katalog mit Rückwirkungs-Hinweis
  (Art. 173 Abs. 3 ZGB).
- **Varianten:** keine. **Formvorschrift/Export:** `fertig`, PDF/DOCX.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageEheschutzgesuch.tsx`, Schema
  `src/lib/vorlagen/eheschutzgesuch.ts`.

##### 5.4.5 `/vorlagen/scheidungsbegehren-gemeinsam` — Gemeinsames Scheidungsbegehren

- **Zweck:** Gemeinsame Eingabe beider Ehegatten, Art. 285/286 ZPO (Voll- oder
  Teileinigung).
- **Schritte:** Gericht & Einigung · Ehegatten & Kinder · Vereinbarung & Anträge ·
  Prüfen & Ausgabe.
- **Eingaben:** Einigungsstand (Auswahl: voll / teilweise — steuert die Pflicht der
  «streitige Punkte»-Felder) · Ehegatte/Ehegattin 1 und 2 (Name, Vertretung optional) ·
  gemeinsame Kinder (Liste: Vorname, Geburtsdatum) · Datum der (Voll- bzw.
  Teil-)Vereinbarung · Ort/Datum der Eingabe.
- **Vorschau/Ausgabe:** Eingabe-Format; bei Teileinigung der Pflicht-Antrag auf
  gerichtliche Beurteilung der streitigen Folgen (Art. 112 ZGB).
- **Varianten:** die Weiche voll/Teileinigung ändert die Pflichtfelder; keine
  Detailgrad-Achse.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX — **von BEIDEN Ehegatten zu
  unterzeichnen**. **Status:** entwurf. **Quelle:**
  `src/pages/VorlageScheidungsbegehren.tsx`, Schema
  `src/lib/vorlagen/scheidungsbegehren.ts`.

##### 5.4.6 `/vorlagen/scheidungsklage` — Scheidungsklage (unbegründete Eingabe)

- **Zweck:** Scheidungsklage ohne schriftliche Begründung, Art. 290 ZPO.
- **Schritte:** Gericht & Scheidungsgrund · Parteien & Kinder · Scheidungsfolgen ·
  Prüfen & Ausgabe.
- **Eingaben:** Scheidungsgrund (Auswahl nach Art. 290 lit. b ZPO) · getrennt lebend
  seit (Zweijahres-Check gegen das Einreichungsdatum) · klagende und beklagte Partei
  (+ Vertretung optional) · Kinder (Liste) · Obhut-Antrag · nachehelicher Unterhalt
  (CHF/Monat, «Ihre eigene Würdigung») · weitere Rechtsbegehren (optional) · Ort/Datum
  der Eingabe (Art. 290 lit. f ZPO).
- **Vorschau/Ausgabe:** Eingabe-Format, gesetzlicher Mindestinhalt.
- **Varianten:** keine. **Formvorschrift/Export:** `fertig`, PDF/DOCX.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageScheidungsklage.tsx`, Schema
  `src/lib/vorlagen/scheidungsklage.ts`.

##### 5.4.7 `/vorlagen/fristerstreckung` — Fristerstreckungsgesuch

- **Zweck:** Gesuch an das Gericht, eine gerichtliche Frist zu erstrecken, Art. 144
  Abs. 2 ZPO.
- **Schritte:** Verfahren & Gericht · Frist & Begründung · Prüfen & Unterzeichnen.
- **Eingaben:** Gesuchstellende Partei/Vertretung + Adresse · Gericht (das die Frist
  angesetzt hat) + Adresse · Verfahren (Betreff) · Geschäfts-Nr. (optional) · Art der
  Frist (Auswahl — **nur gerichtliche Fristen sind erstreckbar**) ·
  Frist-Bezeichnung · Verfügung vom (optional) · laufendes Fristende · beantragtes
  neues Fristende · Begründung («zureichende Gründe», Pflicht).
- **Vorschau/Ausgabe:** Eingabe-Format, Betreff mit Geschäfts-Nr.
- **Varianten:** keine. **Formvorschrift/Export:** `fertig`, PDF/DOCX.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageFristerstreckung.tsx`, Schema
  `src/lib/vorlagen/fristerstreckung.ts`.

##### 5.4.8 `/vorlagen/nichtbekanntgabe-betreibung` — Nichtbekanntgabe einer Betreibung

- **Zweck:** Gesuch ans Betreibungsamt, eine Betreibung mit erhobenem Rechtsvorschlag
  Dritten nicht mehr bekannt zu geben, Art. 8a Abs. 3 lit. d SchKG (3-Monats-Schwelle).
- **Schritte:** Schuldner & Amt · Betreibung · Prüfen & Unterzeichnen.
- **Eingaben:** Schuldnerin/Schuldner (gesuchstellende Partei) + Adresse ·
  Betreibungsamt + Adresse · Betreibungsnummer (Pflicht) · Gläubigerin/Gläubiger
  (optional) · Zustellung des Zahlungsbefehls (Datum, Pflicht — **das Gesuch ist erst
  nach drei Monaten zulässig; vorher greift ein Engine-Blocker**).
- **Vorschau/Ausgabe:** Eingabe-Format, kurzes Gesuch an das Amt.
- **Varianten:** keine. **Formvorschrift/Export:** `fertig`, PDF/DOCX.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageNichtbekanntgabe.tsx`, Schema
  `src/lib/vorlagen/nichtbekanntgabe.ts`.

##### 5.4.9 `/vorlagen/rubrum` — Rubrum (Entscheidkopf)

- **Zweck:** Gerüst für den Kopf eines Gerichtsentscheids, Art. 238 ZPO (Bundesgericht:
  Art. 112 BGG).
- **Schritte:** Gericht & Verfahren · Parteien · Streitgegenstand · Prüfen & Ausfüllen.
- **Eingaben:** Bezeichnung des Gerichts (Pflicht) · Zusammensetzung/mitwirkende
  Personen (optional, z. B. Einzelgericht, Kammer, Gerichtsschreiber) ·
  Geschäftsnummer (optional) · klagende/gesuchstellende Partei (Pflicht) + Vertretung
  (optional) · beklagte/gesuchsgegnerische Partei (Pflicht) + Vertretung (optional) ·
  Streitgegenstand («betreffend …»).
- **Vorschau/Ausgabe:** das einzige **Verfügungs-Format** der Behördeneingaben-Gruppe
  (zentriertes Rubrum mit Parteirollen, «gegen» fett).
- **Varianten:** keine.
- **Formvorschrift/Export:** **einzige Behördeneingabe mit Form-Gate `entwurf`** —
  Entwurfsvorlage, vom Gericht zu vervollständigen (Dispositiv, Begründung,
  Rechtsmittelbelehrung, Unterschrift); PDF/DOCX. **Sonderrolle:** das Ergebnis ist
  ausdrücklich ein Halbfabrikat, kein einreichbares Schreiben einer Partei.
- **Status:** entwurf. **Quelle:** `src/pages/VorlageRubrum.tsx`, Schema
  `src/lib/vorlagen/rubrum.ts`.

#### II · Verträge

##### 5.4.10 `/vorlagen/arbeitsvertrag` — Arbeitsvertrag (+ drei Untertyp-Seiten)

- **Zweck:** Einzelarbeitsvertrag mit harten Schranken für zwingendes Recht (Probezeit,
  Kündigungsfristen, Ferien, Ferienlohn).
- **Vertragstyp-Weiche** (Kachelraster **vor** der Schrittleiste): **Einzelarbeitsvertrag**
  («Standard (Art. 319 ff. OR)») · **Kader/Manager** («leitende Stellung, Bonus») ·
  **Lehrvertrag** («Art. 344 ff. OR (Schriftform)») · **Handelsreisender** («Art. 347
  ff. OR») · **Heimarbeit** («Art. 351 ff. OR»). Die Wahl bleibt in `localStorage`
  (`lexmetrik.vorlage.arbeitsvertrag.regime.v1`). **Lehrvertrag, Handelsreisender und
  Heimarbeit sind keine eigenen Routen**, sondern Unter-Komponenten derselben Seite —
  kein Eintrag im Routen-Manifest, kein eigener Katalog-Eintrag (Nebenfund N5).
- **Schritte (Einzel/Kader):** Parteien · Stelle & Beginn · Lohn · Arbeitszeit &
  Ferien · Absicherung & Spesen · Besondere Klauseln · Prüfen & Unterzeichnen.
- **Eingaben (Einzel/Kader):**
  - *Parteien:* Arbeitgeber-Rechtsform (juristisch/natürlich) → Firma/Name, Adresse;
    Arbeitnehmer Vorname/Nachname, Adresse, Geburtsdatum (optional, steuert den
    Mindest-Ferienanspruch).
  - *Stelle:* Funktion/Tätigkeit · Arbeitsort · Kanton (optional,
    Mindestlohn-Prüfung) · Stellenantritt · Befristung (Ankreuzfeld → Enddatum) ·
    Probezeit (Monate, max. 3).
  - *Lohn:* Lohnmodell (Monats-/Stundenlohn) → Bruttolohn · 13. Monatslohn
    (Ankreuzfeld) · Überstundenregelung (Ankreuzfeld) · Pensum % · Wochenstunden.
  - *Arbeitszeit & Ferien:* Ferien (Wochen/Dienstjahr, min. 4) · Kündigungsfrist
    (Monate, min. 1).
  - *Absicherung:* Krankentaggeld-Block (Taggeld %, Leistungsdauer Tage, Wartefrist
    Tage, Prämienanteil AN %) · Spesenpauschale (CHF/Monat) · GAV-Anwendbarkeit
    (nein/ja/unklar) → GAV-Bezeichnung, Art der Geltung
    (AVE/Mitgliedschaft/Verweis).
  - *Klauseln:* Konkurrenzverbot (Ankreuzfeld) → Gegenstand · örtlicher
    Geltungsbereich · Dauer (Monate, i. d. R. max. 3 Jahre) · Konventionalstrafe (CHF,
    optional) · Karenzentschädigung (CHF/Monat).
  - Ort/Datum des Vertragsschlusses.
- **Vorschau/Ausgabe:** Vertragslayout (Titel, Parteien-Ingress, nummerierte Ziffern,
  Unterschriftenblock).
- **Varianten:** Untertyp (siehe oben) **und** Detailgrad (einfach/standard/experte).
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
- **Quelle:** `src/pages/VorlageArbeitsvertrag.tsx`, Schema
  `src/lib/vorlagen/arbeitsvertrag.ts`.
- **Untertyp-Seiten:**
  - **Lehrvertrag** (`src/pages/VorlageLehrvertrag.tsx`, Schema
    `src/lib/vorlagen/lehrvertrag.ts`): Schritte **Parteien · Bildung & Dauer · Lohn,
    Zeit & Ferien · Prüfen & Unterzeichnen**; Felder u. a. Lehrbeginn, Dauer Jahre,
    Probezeit, Wochenarbeitszeit, Ferien-Wochen, Berufsfachschule.
  - **Handelsreisendenvertrag** (`src/pages/VorlageHandelsreisendenvertrag.tsx`, Schema
    `src/lib/vorlagen/handelsreisendenvertrag.ts`): Schritte **Parteien · Tätigkeit &
    Vollmacht · Lohn & Auslagen · Prüfen**; Felder u. a. Gegenstand der Geschäfte,
    Reisegebiet, festes Gehalt, Provisionssatz %, Delkredere-Provision %.
  - **Heimarbeitsvertrag** (`src/pages/VorlageHeimarbeitsvertrag.tsx`, Schema
    `src/lib/vorlagen/heimarbeitsvertrag.ts`): Schritte **Parteien · Arbeit & Material ·
    Lohn & Dienst · Prüfen**; Felder u. a. Arbeitsraum, Material-Entschädigung, Lohn +
    Einheit.

##### 5.4.11 `/vorlagen/mietvertrag` — Mietvertrag (Wohnen · Geschäft · Untermiete)

- **Zweck:** Mietvertrag mit Objekt-Weiche Wohn-/Geschäftsraum und Untermiete-Variante
  (Art. 262 OR).
- **Schritte:** Mietobjekt · Parteien · Dauer & Kündigung · Mietzins & Nebenkosten ·
  Kaution & Klauseln · Prüfen & Unterzeichnen.
- **Eingaben:**
  - *Mietverhältnis-Weiche* (Kachel): «Mietvertrag» bzw. «Untermietvertrag —
    Hauptmieter:in vermietet ganz oder teilweise weiter». Bei Untermiete zusätzlich:
    Hauptvermieter:in · Hauptmietvertrag-Datum · Hauptmietzins netto · Zustimmung des
    Hauptvermieters (Auswahl: schriftlich / mündlich / angefragt / noch nicht
    angefragt) + Datum · Umfang (ganz/teilweise) · überlassene Räume · Mehrleistungen.
  - *Mietobjekt:* Beschrieb · Adresse · mitvermietete Nebenräume (optional) · Kanton
    (Formularpflicht-Prüfung) · Mietzweck.
  - *Objekt-Typ-Weiche:* **Wohnraum** («voller Mieterschutz») gegen **Geschäftsraum**
    («freiere Gestaltung») — schaltet MWST-Option, Konkurrenzschutz und
    Familienwohnung-Feld je nach Typ frei oder gesperrt.
  - *Parteien:* Vermieter Name/Adresse · Mieter Name/Adresse · zweite/r Mieter:in
    (optional, Solidarhaftung).
  - *Dauer:* Mietbeginn · Befristung (Ankreuzfeld → Enddatum) · feste Erstlaufzeit
    Jahre (für Index- und Staffelmiete) · Kündigungsfrist Monate (Minimum abhängig von
    Wohn-/Geschäftsraum).
  - *Mietzins:* Nettomietzins CHF/Monat · Index-/Staffel-Klauseln (LIK-Basisstand,
    Punktestand, Staffel-Tabelle Erhöhung ab/Betrag) · Nebenkosten Akonto oder
    Pauschale CHF/Monat.
  - *Klauseln:* Kaution CHF (optional) · Konkurrenzschutz (Geschäftsraum: geschützter
    Bereich, Konventionalstrafe) · Mietzinsvorbehalt (% des Nettomietzinses, Grund).
  - Ort/Datum des Vertragsschlusses.
- **Vorschau/Ausgabe:** Vertragslayout mit Objekt-, Mietzins- und Kautions-Ziffern.
- **Varianten:** Untertyp Wohnung/Geschäftsraum × Mietverhältnis Miete/Untermiete
  (der Deep-Link `#untermiete` schaltet Untermiete direkt), Detailgrad
  einfach/standard/experte.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageMietvertrag.tsx`, Schema
  `src/lib/vorlagen/mietvertrag.ts`.

##### 5.4.12 `/vorlagen/auftrag` — Auftrag (Dienstleistungsvertrag)

- **Zweck:** Dienstleistungsvertrag Art. 394 ff. OR; das jederzeitige Auflösungsrecht
  (Art. 404 OR) wird offengelegt.
- **Schritte:** Parteien · Gegenstand & Vergütung · Prüfen & Unterzeichnen.
- **Eingaben:** Auftraggeberin/Beauftragte + Adressen (optional) · Art des Mandats
  (Auswahl: Beratung / Treuhand / Inkasso o. ä.) · Gegenstand des Auftrags (Freitext,
  Pflicht) · Beginn (optional) · Vergütung: Pauschalhonorar CHF **oder** Stundenansatz
  CHF (Weiche) · vier Ankreuzfelder für Zusatzklauseln (u. a. Spesen,
  Kündigungsmodalität, Haftungsklausel, Geheimhaltung).
- **Vorschau/Ausgabe:** Vertragslayout, Vergütungsklausel je Weiche.
- **Varianten:** Detailgrad einfach/standard/experte; kein Untertyp.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageAuftrag.tsx`, Schema `src/lib/vorlagen/auftrag.ts`.

##### 5.4.13 `/vorlagen/werkvertrag` — Werkvertrag

- **Zweck:** Werkvertrag Art. 363 ff. OR, Weiche bewegliches/unbewegliches Werk
  (Rügefrist, Verjährung).
- **Schritte:** Parteien · Werk & Vergütung · Prüfen & Unterzeichnen.
- **Eingaben:** Besteller/Unternehmer + Adressen (optional) · Werk-Beschrieb (Pflicht) ·
  Art des Werks (beweglich/unbeweglich — steuert Rügefrist und Verjährung) ·
  Ablieferungstermin (optional) · Vergütung: Festpreis CHF (bindet den Unternehmer,
  Art. 373 OR) **oder** Ansatz CHF je Einheit (Weiche) · Akontobetrag CHF (optional,
  hinter Ankreuzfeld).
- **Vorschau/Ausgabe:** Vertragslayout, Brücke zum Gewährleistungs-Rechner.
- **Varianten:** Detailgrad einfach/standard/experte; kein Untertyp.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageWerkvertrag.tsx`, Schema
  `src/lib/vorlagen/werkvertrag.ts`.

##### 5.4.14 `/vorlagen/nda` — Geheimhaltungsvereinbarung (NDA)

- **Zweck:** NDA als Innominatvertrag (Art. 19 OR), Weiche einseitig/gegenseitig,
  optionale Konventionalstrafe.
- **Schritte:** Parteien & Richtung · Inhalt & Strafe · Prüfen & Unterzeichnen.
- **Eingaben:** Richtung (Kachelwahl gegenseitig/einseitig — steuert die Feld-Labels
  «Partei A/B» bzw. «Offenlegende/Empfangende Partei») · Partei A/B Name (Pflicht) +
  Adresse (optional) · Zweck der Offenlegung (Pflicht, Freitext mit dem Hinweis
  «erscheint im Vertragstext») · Konkretisierung der vertraulichen Informationen
  (optional) · Nachwirkungsfrist (Ankreuzfeld) → Dauer Jahre (Pflicht bei aktiviertem
  Ankreuzfeld; das Label zeigt live die eingestellte Zahl) · Rückgabe/Vernichtung
  (Ankreuzfeld) · Konventionalstrafe (Ankreuzfeld) → Betrag CHF je Verletzung.
- **Vorschau/Ausgabe:** Vertragslayout.
- **Varianten:** Detailgrad einfach/standard/experte; kein Untertyp.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageNda.tsx`, Schema `src/lib/vorlagen/nda.ts`.

##### 5.4.15 `/vorlagen/konkubinat` — Konkubinatsvertrag

- **Zweck:** Konkubinatsvertrag als Innominatvertrag (Art. 19 OR), Kostenschlüssel,
  Wohn- und Inventar-Regelung.
- **Schritte:** Parteien · Kosten, Wohnen & Vermögen · Prüfen & Unterzeichnen.
- **Eingaben:** Partnerin/Partner 1 und 2 + Adressen (optional) · Gemeinsame Wohnung
  (Ankreuzfeld) → Wohnsituation-Beschrieb · Kosten des Zusammenlebens: Beitrag Partner
  1/2 CHF/Monat · drei Ankreuzfelder zu Miteigentum, Inventar und Vermögenstrennung ·
  Einfache Gesellschaft (Ankreuzfeld) → gemeinsamer Zweck (Freitext) ·
  Auflösungsfolgen-Ankreuzfeld.
- **Vorschau/Ausgabe:** Vertragslayout; legt offen, dass ein gesetzliches
  Konkubinatsrecht fehlt und Kindesbelange nach Gesetz gelten.
- **Varianten:** Detailgrad einfach/standard/experte; kein Untertyp.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageKonkubinat.tsx`, Schema
  `src/lib/vorlagen/konkubinat.ts`.

#### III · Einseitige Willenserklärungen

##### 5.4.16 `/vorlagen/forderungsabtretung` — Abtretungserklärung (Zession)

- **Zweck:** Erklärung der Gläubigerseite, eine Forderung abzutreten (Art. 164 ff. OR).
- **Schritte:** Parteien · Forderung & Optionen · Prüfen & Unterzeichnen.
- **Eingaben:** Zedentin/Zedent + Adresse (optional) · Zessionarin/Zessionar + Adresse
  (optional) · Schuldnerin/Schuldner der Forderung + Adresse (optional) · Forderung
  (Bezeichnung, Pflicht — erscheint in Betreff und Abtretungs-Satz) · vier
  Ankreuzfelder (u. a. Forderungsbetrag aktivieren → CHF-Feld, Abtretungsverbot-Hinweis,
  Schuldner-Anzeige, Zinsen-Klarstellung).
- **Vorschau/Ausgabe:** Eingabe-Format (Absender/Adressat, Betreff, Abtretungs-Satz,
  Unterschrift Zedentin/Zedent).
- **Varianten:** keine.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX — **Schriftform zwingend**.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageForderungsabtretung.tsx`, Schema
  `src/lib/vorlagen/forderungsabtretung.ts`.

##### 5.4.17 `/vorlagen/verjaehrungsverzicht` — Verjährungsverzichtserklärung

- **Zweck:** Befristeter Verzicht der Schuldnerseite auf die Verjährungseinrede
  (Art. 141 OR).
- **Schritte:** Parteien · Forderung & Dauer · Prüfen & Unterzeichnen.
- **Eingaben:** Schuldnerin/Schuldner (erklärende Partei) + Adresse (optional) ·
  Gläubigerin/Gläubiger (Empfänger) + Adresse (optional) · Forderung (Bezeichnung,
  Pflicht) · Forderungsbetrag (Ankreuzfeld → CHF) · **Verzicht bis** (Enddatum,
  Pflicht — höchstens 10 Jahre ab Beginn der Verjährung, Art. 141 Abs. 1 OR; die
  Erklärung begrenzt sich zusätzlich selbst) · zwei weitere Ankreuzfelder
  (Klarstellung: keine Schuldanerkennung u. a.).
- **Vorschau/Ausgabe:** Eingabe-Format.
- **Varianten:** keine.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX — Schriftform zwingend (Art. 141
  Abs. 1bis OR). **Status:** entwurf. **Quelle:**
  `src/pages/VorlageVerjaehrungsverzicht.tsx`, Schema
  `src/lib/vorlagen/verjaehrungsverzicht.ts`.

##### 5.4.18 `/vorlagen/mahnung` — Mahnung & Inverzugsetzung

- **Zweck:** Zahlungsaufforderung, die den Verzug auslöst (Art. 102 OR), mit
  Verzugszins-Androhung (Art. 104 OR).
- **Schritte:** Was mahnen Sie an? · Parteien · Forderung & Frist · Prüfen &
  Unterzeichnen.
- **Varianten-Weiche (Schritt 1, Kachelwahl):** **«Geldforderung mahnen»** —
  Zahlungsaufforderung mit Verzugsfolgen (Art. 102 Abs. 1, 104 OR) — **oder**
  **«Leistung anmahnen + Nachfrist»** — Nachfristansetzung beim zweiseitigen Vertrag
  (Art. 107 OR). Die Wahl steuert Schritt 3 vollständig um.
- **Eingaben (Zahlung):** Ihr Name/Adresse · Schuldnerin/Schuldner + Adresse ·
  Forderungsbetrag CHF (Pflicht) · Rechtsgrund/Rechnung (Betreff-Text) · fällig seit
  (optional) **oder** vereinbarter Verfalltag (Ankreuzfeld) · Zahlungsfrist (Tage seit
  Erhalt, «Praxis-Wahl, keine gesetzliche Vorgabe») · Zahlungsverbindung IBAN
  (optional) · vertraglicher Verzugszins % p. a. (Ankreuzfeld) · Mahngebühr CHF
  (Ankreuzfeld, optional weiteres Ankreuzfeld).
- **Eingaben (Nachfrist):** Vertrag (Betreff) · geschuldete Leistung · fällig seit
  (optional) · Nachfrist (Tage seit Erhalt, «muss ANGEMESSEN sein, Art. 107 Abs. 1 OR —
  Wertungsfrage, LexMetrik berechnet hier nichts»).
- **Vorschau/Ausgabe:** Eingabe-Format.
- **Varianten:** Variante Zahlung/Nachfrist; kein Detailgrad.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageMahnung.tsx`, Schema `src/lib/vorlagen/mahnung.ts`.

##### 5.4.19 `/vorlagen/kuendigung-vertrag` — Vertrag kündigen (Presets)

- **Zweck:** Kündigungsschreiben mit Vertragstyp-Presets — **ohne erfundene Fristen**.
- **Schritte:** Vertragstyp · Parteien · Vertrag · Termin · Prüfen & Unterzeichnen.
- **Preset-Weiche (Kachelwahl, sechs Presets):** Allgemeiner Dauervertrag ·
  **Versicherung** (VVG, Art. 35a: Ende des 3. Jahres, 3 Monate Frist) ·
  **Krankenkasse** (Grundversicherung, Art. 7 KVG) · **Darlehen** (Art. 318: 6 Wochen
  ab Aufforderung) · **Auftrag/Mandat** (Art. 404, Unzeit-Warnung) · **Abo/Telecom**
  (AGB-Termine, «ehrlich ohne berechnete Frist»).
- **Eingaben:** Ihr Name/Adresse · Vertragspartnerin/-partner + Adresse ·
  Vertragsbezeichnung · Vertrags-/Kundennummer (optional) · je Preset zusätzliche
  Felder (Versicherung: Policennummer · Krankenkasse: Versicherten-Nummer, Anlass der
  Kündigung · Darlehen: Datum der Rückzahlungs-Aufforderung, davon abgeleitete
  6-Wochen-Frist) · gewünschter Kündigungstermin · erwarteter Zugang (optional, eigene
  Fristkontrolle).
- **Vorschau/Ausgabe:** Eingabe-Format.
- **Varianten:** sechs Presets; kein Detailgrad.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageKuendigungVertrag.tsx`, Schema
  `src/lib/vorlagen/kuendigungAllgemein.ts`.

##### 5.4.20 `/vorlagen/vollmacht` — Vollmacht (Anwalt · General · Spezial)

- **Zweck:** Eine Maske für drei Vollmachtstypen mit deterministischen Form-Warnungen
  (Grundstück, Bank, Bürgschaft).
- **Schritte:** Vollmachtstyp · Vollmachtgeber/in · Bevollmächtigte · Umfang ·
  Besondere Ermächtigungen · Dauer & Abschluss · Prüfen & Ausgabe.
- **Typ-Weiche (Kachelwahl):** **Anwaltsvollmacht** («Prozess- und
  Interessenvertretung, Art. 68 ZPO») · **Generalvollmacht** («umfassende Vertretung
  in allen vertretungsfähigen Angelegenheiten») · **Spezialvollmacht** («beschränkt auf
  ein bestimmtes Geschäft oder einzelne Bereiche»).
- **Eingaben:**
  - *Vollmachtgeber/in:* natürlich (Vorname/Nachname/Geburtsdatum optional/Adresse)
    oder juristisch (Firma gemäss Handelsregister/Sitz/vertreten durch).
  - *Bevollmächtigte:* Name (bei Anwalt: «Name (Anwältin/Anwalt bzw. Kanzlei)») ·
    Geburtsdatum/Adresse (optional).
  - *Umfang:* Mandatsgegenstand («in Sachen …», optional) bzw. Geschäft/Angelegenheit
    bei der Spezialvollmacht · **Vertretungsbereiche** als Ankreuzfeld-Liste: Behörden ·
    Verträge · Post · **Bank** (mit Warnhinweis «Banken verlangen eigene Formulare») ·
    Versicherungen · Immobilien · Prozess.
  - *Besondere Ermächtigungen:* Ankreuzfeld-Liste, u. a. Substitution, Vergleich,
    Grundstücksgeschäfte (Art. 396 Abs. 3 OR).
  - *Dauer:* Befristet bis (optional; leer = unbefristet, jederzeit widerruflich
    Art. 34 OR).
  - Ort/Datum (beide optional — leer heisst: von Hand nachtragen).
- **Vorschau/Ausgabe:** Eingabe-Format, Dokumenttitel je Typ.
- **Varianten:** drei Typen; kein Detailgrad.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageVollmacht.tsx`, Schema `src/lib/vorlagen/vollmacht.ts`.

##### Kündigungs-Masken-Familie (vier Einzelmasken, alle nicht im Register)

Gemeinsame Herkunft; je Rechtsverhältnis eine eigene Route und Seite, im
Vorlagen-Register selbst **nicht** sichtbar — der Einstieg läuft über die Arbeits- und
Miet-Themenseiten sowie Cross-Links.

##### 5.4.21 `/vorlagen/kuendigung-arbeitgeber` — Kündigung durch Arbeitgeber:in

- **Zweck:** Kündigungsschreiben mit **Live-Prüfung der Sperrfristen** (Art. 336c OR) —
  nichtige Kündigungen werden blockiert.
- **Schritte:** Parteien · Anstellung & Frist · Sperrfristen · Kündigungstermin ·
  Begründung & Freistellung · Prüfen & Unterzeichnen.
- **Eingaben:** Arbeitgeberin/Arbeitgeber (Firma) + Adresse + zeichnungsberechtigte
  Person · Arbeitnehmerin/Arbeitnehmer + **Wohnadresse** («an die WOHNadresse
  zustellen — Zugang dort ist massgebend») · Vertragsbeginn (Dienstjahr, Frist,
  Sperrfrist-Kontingente) · Probezeit (keine / gesetzlich 1 Monat / vertraglich 2–3
  Monate → Monate-Feld) · Kündigungsfrist (gesetzlich nach Dienstjahr / abweichend →
  Monate-Feld, gültig nur bei Schriftform oder GAV) · **erwarteter Zugang** (Stichtag
  für Dienstjahr, Frist und Sperrfrist-Prüfung — **Engine-Blocker bei
  Sperrfrist-Verstoss**) · nicht bezogene Tage Urlaub des andern Elternteils (optional,
  Art. 335c Abs. 3 OR, verlängert taggenau) · Begründung (Freitext, «LexMetrik
  formuliert hier bewusst nicht vor», Ankreuzfeld) · Freistellung (Ankreuzfeld) → ab
  Datum · Ort/Datum der Erklärung.
- **Vorschau/Ausgabe:** Eingabe-Format; der Sperrfrist-Blocker verhindert den Export
  bei Nichtigkeit.
- **Varianten:** keine. **Formvorschrift/Export:** `fertig`, PDF/DOCX.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageKuendigungArbeitgeber.tsx`, Schema
  `src/lib/vorlagen/kuendigungArbeitgeber.ts`.

##### 5.4.22 `/vorlagen/kuendigung-arbeitnehmer` — Kündigung durch Arbeitnehmer:in

- **Zweck:** Kündigungsschreiben mit live berechnetem Beendigungsdatum.
- **Schritte:** Parteien · Anstellung & Frist · Kündigungstermin · Zeugnis &
  Abrechnung · Prüfen & Unterzeichnen.
- **Eingaben:** Ihr Name/Adresse · Arbeitgeberin/Arbeitgeber (Firma) + Adresse ·
  Vertragsbeginn · Probezeit (dieselbe Weiche wie oben; 7-Tage-Frist Art. 335b OR bei
  Zugang während der Probezeit) · Kündigungsfrist (gesetzlich/abweichend) ·
  **erwarteter Zugang** (Stichtag der Fristberechnung — **nicht** das Absendedatum) ·
  zwei Ankreuzfelder (Zeugnis- und Abrechnungsbitte).
- **Vorschau/Ausgabe:** Eingabe-Format.
- **Varianten:** keine. **Formvorschrift/Export:** `fertig`, PDF/DOCX.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageKuendigungArbeitnehmer.tsx`,
  Schema `src/lib/vorlagen/kuendigungArbeitnehmer.ts`.

##### 5.4.23 `/vorlagen/kuendigung-mieter` — Kündigung durch Mieter:in

- **Zweck:** Kündigungsschreiben mit live berechnetem Endtermin (Vertrag → Ortsgebrauch
  → Gesetz) und Familienwohnung-Schutz (Art. 266m OR).
- **Schritte:** Parteien & Objekt · Familienwohnung · Termin & Frist ·
  Ausserterminlich? · Prüfen & Unterzeichnen.
- **Eingaben:** Ihr Name/Adresse · weitere Mieter:innen (optional, ein Name pro Zeile —
  sie unterschreiben mit) · Vermieterschaft/Verwaltung + Adresse · Mietobjekt-Adresse ·
  Objektart (Wohnung / Geschäftsraum / möbliertes Zimmer — bestimmt die gesetzliche
  Mindestfrist) · Kanton des Mietobjekts · Familienwohnung (Ankreuzfeld) → Name der
  zustimmenden Person (zweite Unterschriftslinie) · erwarteter Zugang ·
  Kündigungstermine (ortsüblich / vertraglich bestimmte Monatsenden / jedes Monatsende /
  gesetzliche Auffangregel) → vereinbarte Monatsenden-Liste · Mietbeginn · vertraglich
  vereinbarte Frist Monate (optional) · ausserterminliche Rückgabe (Ankreuzfeld) →
  Nachmieter:in-Name plus zwei weitere Ankreuzfelder · gewünschtes Rückgabedatum
  (optional) · Ort/Datum der Erklärung.
- **Vorschau/Ausgabe:** Eingabe-Format; bei Familienwohnung **zwei
  Unterschriftslinien**.
- **Varianten:** keine Untertyp-Achse (die Objektart ist ein Pflichtfeld, kein
  Kachel-Kopfschalter).
- **Formvorschrift/Export:** `fertig`, PDF/DOCX. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageKuendigungMieter.tsx`, Schema
  `src/lib/vorlagen/kuendigungMieter.ts`.

##### 5.4.24 `/vorlagen/kuendigung-vermieter` — Kündigung durch Vermieter:in (Checkliste)

- **Zweck:** **Bewusst keine ausfüllbare Vorlage** — die Vermieter-Kündigung braucht
  das amtliche kantonale Formular (Art. 266l Abs. 2 OR); ein frei formuliertes
  Schreiben wäre nichtig (Art. 266o OR).
- **Struktur (kein Wizard, keine Schritte):**
  1. **Gültigkeits-Checkliste** (nummerierte Liste, 4 Punkte): amtliches Formular
     verwenden · Familienwohnung separat an **beide** zustellen (Art. 266n OR) ·
     Termin und Frist einhalten · Begründung auf Verlangen.
  2. **Termin- und Fristen-Auskunft** (Rechenfläche, **kein Dokument**).
- **Eingaben:** Objektart (Auswahl: Wohnung / Geschäftsraum / übrige unbewegliche
  Sache) · Kanton (Auswahl) · erwarteter Zugang (Datum) — ausschliesslich für die
  Auskunfts-Berechnung.
- **Ausgabe:** drei Kennzahlen-Kacheln — **«Wirksamer Endtermin»** · **«Anfechtung
  möglich bis»** (30 Tage, Art. 273 Abs. 1 OR) · **«Erstreckungsbegehren bis»**
  (Art. 273 Abs. 2 lit. a OR). Kein Vorschau-Papier, kein Export.
- **Varianten:** keine.
- **Formvorschrift/Export:** Badge **«Checkliste — kein Export»**; Export bewusst nicht
  angeboten. **Status:** entwurf.
- **Quelle:** `src/pages/VorlageKuendigungVermieter.tsx`; rechnet über
  `src/lib/mietrecht.ts`, **kein eigenes Vorlagen-Schema**.

#### V · Vorsorge & Nachlass

##### 5.4.25 `/vorlagen/testament` — Eigenhändiges Testament

- **Zweck:** Letztwillige Verfügung mit Pflichtteils-Kontrolle; Ausgabe als Mustertext
  zum eigenhändigen Abschreiben.
- **Schritte:** Person · Familie · Erbeinsetzung · Vermächtnisse ·
  Willensvollstreckung · Ort & Datum · Prüfen & Abschreiben.
- **Eingaben:**
  - *Person:* Vorname/Nachname · Geburtsdatum (Testierfähigkeit ab 18, Art. 467 ZGB) ·
    Heimatort · Adresse.
  - *Familie:* Zivilstand (ledig / verheiratet / eingetragene Partnerschaft /
    geschieden / verwitwet — steuert die Pflichtteils-Berechnung nach Art. 471 ZGB) →
    bei verheiratet oder Partnerschaft der Name der Partnerin/des Partners (optional) ·
    laufendes Scheidungsverfahren (Auswahl: gemeinsames Begehren / ≥ 2 Jahre getrennt —
    dann entfällt der Pflichtteilsschutz, Art. 472 ZGB) · Anzahl Kinder (Stämme).
  - *Erbeinsetzung:* Liste Erben (Name, Geburtsdatum/Adresse, Quote %, Ersatzperson
    optional).
  - *Vermächtnisse:* Liste (Empfänger, Gegenstand/Betrag, Ersatzperson optional).
  - *Willensvollstreckung:* Willensvollstrecker/in + Ersatz (beide optional).
  - *Abschluss:* Ort der Errichtung (optional, «seit 1996 kein Gültigkeitserfordernis
    mehr») · **Datum (Pflicht, Jahr/Monat/Tag zwingend, Art. 505 Abs. 1 ZGB)**.
- **Vorschau/Ausgabe:** Verfügungs-Format (zentrierter Titel, ruhige Absätze);
  Pflichtteils-Kontrolle als eigenes Panel neben dem Papier.
- **Varianten:** keine.
- **Formvorschrift/Export:** **einzige Vorlage mit nur PDF** — reiner
  Abschreibe-Mustertext (Art. 505 Abs. 1 ZGB), DOCX ist nicht möglich.
  **Status:** entwurf. **Quelle:** `src/pages/VorlageTestament.tsx`, Schema
  `src/lib/vorlagen/testament.ts`.

##### 5.4.26 `/vorlagen/patientenverfuegung` — Patientenverfügung

- **Zweck:** Medizinische Massnahmen, Behandlungsziel und Vertretungsperson, mit
  Konsistenz-Prüfung.
- **Schritte:** Person · Werte · Situationen & Ziel · Massnahmen · Vertretung ·
  Weitere Wünsche · Prüfen & Unterschreiben.
- **Eingaben:**
  - *Person:* Vorname/Nachname · Geburtsdatum («kein Mindestalter — massgebend ist die
    Urteilsfähigkeit, Art. 16 ZGB») · Wohnort · AHV-/Versichertennummer (optional).
  - *Werte:* Einstellung zu Leben und Sterben · was ich besonders fürchte · religiöse
    oder spirituelle Haltung (alle optional, Freitext).
  - *Situationen & Ziel:* Zustimmungs-Raster je Situation mit den Werten **keine
    Angabe / zustimmen / ablehnen / nur befristet**; Behandlungsziel (Kachelwahl:
    **Maximale Lebenserhaltung** / **Befristet mit Reevaluation** /
    **Leidenslinderung/Palliation**).
  - *Massnahmen:* analoges Zustimmungs-Raster je Massnahme.
  - *Vertretung:* Vertretungsperson + Kontakt (optional) · Weisungen an die
    Vertretungsperson (optional) · Ersatzperson (optional, falls die Vertretungsperson
    ungeeignet ist, ablehnt oder kündigt, Art. 370 Abs. 3 ZGB).
  - *Weitere Wünsche:* Sterbeort/Begleitung/Seelsorge (optional) · Organspende-Raster
    (keine Angabe / zustimmen / ablehnen) · Ort (optional).
- **Vorschau/Ausgabe:** Verfügungs-Format.
- **Varianten:** keine.
- **Formvorschrift/Export:** `fertig`, PDF/DOCX — am Computer erstellbar,
  **handschriftlich zu unterschreiben** (Art. 371 Abs. 1 ZGB). **Status:** entwurf.
  **Quelle:** `src/pages/VorlagePatientenverfuegung.tsx`, Schema
  `src/lib/vorlagen/patientenverfuegung.ts`.

##### 5.4.27 `/vorlagen/vorsorgeauftrag` — Vorsorgeauftrag

- **Zweck:** Personensorge, Vermögenssorge und Vertretung im Rechtsverkehr bei
  Urteilsunfähigkeit, mit Form-Weiche eigenhändig/beurkundet.
- **Schritte:** Voraussetzungen & Form · Person · Beauftragte & Ersatz · Aufgaben ·
  Vollmachten & Entschädigung · Abschluss · Prüfen & Ausgabe.
- **Eingaben:**
  - *Voraussetzungen:* drei Ankreuzfelder (Urteilsfähigkeit bei Errichtung u. a.) ·
    **Form-Weiche eigenhändig / beurkundet** (steuert Ausgabe-Art **und** DOCX-Sperre) ·
    Kanton für Beurkundungs-Hinweise (optional).
  - *Person:* Vorname/Nachname/Geburtsdatum/Heimatort/Adresse.
  - *Beauftragte & Ersatz:* Liste (Name — Person oder Organisation, Typ
    natürlich/juristisch, Sitz bzw. Geburtsdatum und Adresse); separat eine
    Ersatzbeauftragte-Liste.
  - *Aufgaben:* Ankreuzfeld-Liste (Personensorge / Vermögenssorge / Vertretung im
    Rechtsverkehr) · Weisungen für die Erfüllung (optional, Art. 360 Abs. 2 ZGB).
  - *Vollmachten & Entschädigung:* Entschädigungs-Modell (Kachelwahl: **keine Regelung /
    KESB legt fest** · **unentgeltlich, Spesen ersetzt** · **Pauschale pro Jahr** ·
    **nach Aufwand CHF/Std.**) → Betrag-Feld.
  - *Abschluss:* Hinterlegungsort der Patientenverfügung (optional) · früherer
    Vorsorgeauftrag vom (optional) · Ort (optional) · **Datum (Pflicht bei
    eigenhändig — wird mit abgeschrieben, Art. 361 Abs. 2 ZGB)**.
- **Vorschau/Ausgabe:** Verfügungs-Format.
- **Varianten:** Form-Weiche eigenhändig/beurkundet — die **einzige Weiche dieser Art
  im Bestand**: sie steuert gleichzeitig Banner, Ausgabe-Art **und** ob DOCX überhaupt
  angeboten wird.
- **Formvorschrift/Export:** eigenhändig → faktisch nur PDF (Mustertext; DOCX wird
  unterdrückt, obwohl die Karte `pdf, docx` trägt — Nebenfund N6); beurkundet → PDF und
  DOCX als Entwurf. **Status:** entwurf.
  **Quelle:** `src/pages/VorlageVorsorgeauftrag.tsx`, Schema
  `src/lib/vorlagen/vorsorgeauftrag.ts`.

### 5.5 Sonderfall: Gesellschaftsrecht — Gründungs- und Kapitalmassnahmen-Mappen

Die drei Vorlagen dieser Gruppe sind **keine Wizards** (kein Wizard-Rahmen, keine
Schrittleiste, keine Schritte). Sie sind **Checkliste + Dokumentmappe**: eine **einzige**
Eingabemaske mit fachlichen Weichen, darunter eine Unterlagenliste nach
Verfahrensphase und ein Reiter-Satz mehrerer live generierter Dokumente.

Alle drei teilen denselben Rahmen: eine **Gates-Box** (Blocker und Warnungen), einen
**Notariats-Hinweis** («Wo beurkunden?») und einen **Handelsregister-Hinweis** («Wo
anmelden?»), je Kanton aufgelöst.

##### 5.5.1 `/vorlagen/gmbh-gruendung` — GmbH-Gründung (Checkliste + Dokumentmappe)

- **Zweck:** Unterlagenliste **und** Volldokumente für die GmbH-Gründung nach
  Konstellation; der Errichtungsakt bleibt zwingend öffentlich zu beurkunden.
- **Eingaben (eine Maske, keine Schritte):** Liberierung/Einlageart (Bareinlage /
  Sacheinlage / Verrechnung / Gemischt) · Revision (Opting-out ≤ 10 Vollzeitstellen /
  Revisionsstelle bestellt) · Leistungen der Gesellschafter CHF (optional) · **weitere
  Schalter** (als Ankreuzfelder, nicht im Feld-Rahmen): besondere Vorteile ·
  Geschäftsführer gewählt · mehrere Geschäftsführer · weitere Vertretungsberechtigte ·
  Opting-out · eigene Büros · Immobilien-Hauptzweck · ausländische juristische Person
  als Gesellschafterin · Fremdwährung · Bank in der Urkunde genannt · Vertretung in der
  Schweiz. **Statuten-Klauseln-Auswahl:** Nachschusspflicht ·
  Nebenleistungspflichten · Konkurrenzverbot · Vorhand-/Vorkaufs-/Kaufsrechte ·
  Stimmrecht nach Anteilszahl · Vetorecht.
- **Unterlagenliste** nach vier Phasen: **«1 · Vor dem Notariatstermin»** (Art. 777b
  OR) · **«2 · Beurkundung»** · **«3 · Handelsregister-Anmeldung»** (Art. 71 HRegV) ·
  **«4 · Nach dem Eintrag»** (Art. 779 OR) — je Beleg mit Ersteller-Etikett
  (Gründer:innen / Notariat / Bank / Revisor:in).
- **Dokumentmappe (Reiter):** Statuten (Entwurf) · Errichtungsakt (Entwurf für die
  Urkundsperson) · Wahlannahmeerklärung je Geschäftsführer · Domizilannahmeerklärung ·
  Vorsitz-Beschluss (optional) · Beschluss über weitere Vertretungsberechtigte
  (optional) · Handelsregister-Anmeldung.
- **Vorschau/Ausgabe:** je Dokument dasselbe Papier- und Rollen-System wie in den
  Wizards; Statuten und Errichtungsakt tragen das Wasserzeichen **«ENTWURF»**.
- **Formvorschrift/Export:** Form-Gate `gemischt` — Statuten und Errichtungsakt nur als
  Entwurf (öffentliche Beurkundung Art. 777 Abs. 1 OR zwingend), übrige Dokumente
  druckfertig; PDF und DOCX je Dokument.
- **Status:** entwurf. **Quelle:** `src/pages/VorlageGmbhGruendung.tsx`,
  `src/components/vorlagen/GmbhDokumentmappe.tsx`, Schemas
  `src/lib/vorlagen/gruendungGmbhDokumente.ts` und `gruendungGmbhSchemas.ts`,
  Unterlagenliste `src/lib/gruendungsunterlagen.ts`.

##### 5.5.2 `/vorlagen/ag-gruendung` — AG-Gründung (Checkliste + Dokumentmappe)

- **Zweck:** wie die GmbH-Gründung, für die Aktiengesellschaft (Art. 629 ff. OR).
- **Eingaben:** analoge Weichen (Opting-out, Inhaberaktien, c/o-Domizil, Lex Koller),
  zusätzlich die **Teilliberierungs-Prüfung** (Art. 632 OR: mindestens 20 % je Aktie,
  mindestens CHF 50'000).
- **Dokumentmappe (Reiter):** Statuten (Entwurf) · Errichtungsakt (Entwurf) ·
  Gründungsbericht (Art. 635 OR, bei Sacheinlage oder besonderen Vorteilen) · Nachtrag
  zur Gründungsurkunde (Entwurf) · Lex-Koller-Erklärung · Wahlannahmeerklärung
  Revisionsstelle · VR-Protokoll (Konstituierung) · Domizilannahmeerklärung ·
  Unterschriftenblatt · Handelsregister-Anmeldung.
- **Formvorschrift/Export:** Form-Gate `gemischt`; Errichtungsakt nur als öffentliche
  Urkunde (Art. 629 Abs. 1 OR).
- **Status:** entwurf. **Quelle:** `src/pages/VorlageAgGruendung.tsx`, Schemas
  `src/lib/vorlagen/gruendungAgDokumente.ts`, `gruendungAgSchemas*.ts` (drei
  Teildateien: Statuten / Errichtung / Weitere), `gruendungAgDokumenteGates.ts`.

##### 5.5.3 `/vorlagen/kapitalerhoehung` — Kapitalerhöhung (AG / GmbH)

- **Zweck:** Ordentliche Kapitalerhöhung gegen Bareinlage als Dokumentmappe; Beschluss
  und Feststellungsurkunde bleiben beurkundungspflichtig.
- **Eingaben:** Rechtsform (AG/GmbH — steuert die Terminologie Aktien/Stammanteile) ·
  Art der Einlage (Bar / Sacheinlage / Verrechnung / Umwandlung von Eigenkapital) ·
  Kanton (Handelsregisteramt) · Firma (mit Rechtsform-Zusatz) · Sitz · bisheriges
  Kapital CHF · bisherige Stückzahl · Nennwert CHF · Anzahl neue Aktien/Stammanteile ·
  Ausgabebetrag je Stück (≥ Nennwert, Agio zulässig) · Statuten-Artikel der
  Kapitalbestimmung · **Datum GV-/GsV-Beschluss (Pflicht — löst die
  6-Monats-Verfalls-Warnung aus, Art. 650 Abs. 3 / 781 Abs. 4 OR)** ·
  Kapitalerhöhungsbericht unterzeichnet durch · Vorsitz VR/Geschäftsführung · Liste
  Zeichnungsberechtigte (Name, Wohnort/Sitz, Stück) · Bank + Bank-Ort (in der Urkunde
  genannt) · Ort/Datum (Unterschriften).
- **Dokumentmappe:** GV-/GsV-Beschluss (Entwurf) · VR-/GF-Urkunde Statutenänderung +
  Feststellungen (Entwurf) · Zeichnungsschein (**ein Dokument je Zeichner:in**) ·
  Kapitalerhöhungsbericht · Handelsregister-Anmeldung.
- **Formvorschrift/Export:** Form-Gate `gemischt` — Beschluss und Feststellungsurkunde
  nur als Entwurf (Art. 650 Abs. 2 / 652g Abs. 2 OR), Zeichnungsscheine, Bericht und
  Anmeldung druckfertig.
- **Status:** entwurf. **Quelle:** `src/pages/VorlageKapitalerhoehung.tsx`, Schema
  `src/lib/vorlagen/kapitalerhoehung.ts` plus gemeinsame Kernlogik `kapitalKern.ts`.
  **Katalog-Besonderheit:** die Karte lebt in `src/lib/startseiteKartenAusbau.ts`
  statt in den Vorlagen-Karten-Modulen (Nebenfund N3).

### 5.6 Abgrenzung: Entstehung gehört nicht zu den Vorlagen

`src/components/entstehung/` und `src/lib/entstehung/` gehören zum Bereich **Gesetzes-
und Urteilsdaten** (Entstehungsgeschichte einzelner Artikel: Botschaften, Änderungen,
Synopse-Vergleich alt/neu, Curia-Vista-Anker) — sie rendern am Artikel eines
Gesetzes-Lesers und berühren weder die Vorlagen-Schemas noch den Wizard-Rahmen.
Beschrieben in 2.3.8 und 3.5/3.7.

---

## 6 Geteilte Bausteine, Zustände und Konventionen

Dieser Abschnitt gilt quer über alle vier Werkbank-Rubriken. Farb- und Token-Werte
stehen im Design-System-Artefakt; hier steht nur Verhalten: Eigenschaften, Zustände,
Interaktionslogik.

### 6.1 UI-Bausteine

| Name | Zweck | Varianten / Eigenschaften (verhaltensrelevant) | Zustände | Verwendungsorte (Beispiel) | Quelle |
|---|---|---|---|---|---|
| Karte | Haupt-Inhaltskarte (Flächen-Primitiv) | Innenabstand gross/mittel | — | Rechner- und Vorlagenseiten | `src/components/ui/Card.tsx` |
| Reiter (Segment-Control) | Generisches Segment-Control | Einträge, Wert, Grösse (klein/mittel/zweizeilig), Modus «Tab» oder «gedrückt» | aktiv/inaktiv je Eintrag, Tastatur mit wanderndem Tabindex | Katalog-Filter, Modus-Wahl im Fristformular, ZPO-/SchKG-Phasenwahl, Ebenenwahl Gesetze, Karte/Liste der Kantonsauswahl | `src/components/ui/Tabs.tsx` |
| Menü-Anatomie (Titel, Gruppe, Zeile, Schalter, Regler) | Gemeinsame Anatomie für alle Menüs und Popover | Schalter-Form «Kasten» (Ankreuz-Optik) oder «Punkt» (Radio-Optik); an/aus | an/aus (die Marke steht links, die Form bleibt in beiden Zuständen sichtbar) | Leser-«Ansicht»-Menü, Verlauf-Menü, Sprach- und Thema-Menü | `src/components/ui/Menue.tsx` |
| Schwebe-Meldung | Fliegende Pillen-Meldung über dem Lesetext (Toast-Familie) | Kante oben/unten, Ausrichtung links/mitte/rechts, optionale Status-Rolle | erscheint/verschwindet, höflich vorgelesen — **nie** als Alarm | Weiterlesen-Chip, Rücksprung-Chip, Reiter-Toast | `src/components/ui/SchwebeMeldung.tsx` |
| Sheet-Rahmen | Rahmen für ein von unten angeschlagenes Bottom-Sheet | in-Fenster-Variante, Titel, Schliessen, Anschlag, Zwischenzonen, Sockel | offen (Griffleiste + Titel + ✕); die Fenster-Variante ist kein modaler Dialog | Gliederungs- und Treffer-Sheet im Leser, Mobil-Filter-Sheet Rechtsprechung, Blatt «Startseite anpassen» | `src/components/ui/SheetRahmen.tsx` |
| Stand-Chip | Kleine «Stand»-Angabe mit Datum | ISO-Datum; leer → kein Chip | vorhanden/keiner | Erlass- und Materialien-Karten | `src/components/ui/StandChip.tsx` |
| Leerzustand | Der eine Leerzustands-Absatz | Art «filter» oder «bestand»; bei «filter» ist ein Weiterweg **Pflicht** | mit/ohne Weiterweg (Link oder Knopf) | Filter-Nulltreffer, leere Bestände | `src/components/ui/Leerzustand.tsx` |
| Fehlseite | «X nicht gefunden»-Seite | Bereich, Objekt, Name, Erklärung, **mindestens ein** Weg, optionale Vorschläge und Suchfeld | immer mit mindestens einem Weiterweg («← Label») | 404, Gesetz/Entscheid/Material nicht gefunden | `src/components/ui/FehlSeite.tsx` |
| Abruf-Fehler | «… konnte nicht geladen werden» + amtliche Quelle | Gegenstand, Ein-/Mehrzahl, Ziel-Link | ein Zustand (Fehlermeldung im Warn-Ton) | Materialien-Panel, Entstehungsgeschichte und Änderungsverlauf im Kontext-Blatt | `src/components/ui/AbrufFehler.tsx` |
| Schliess-Knopf | App-weiter ✕-Knopf | Pflicht-Vorlesename; Ton «ruhig», «destruktiv» oder «geerbt»; Komfort-Variante mit 44-px-Trefferfläche | Hover (Messing bzw. Gefahrfarbe je Ton) | Navigationsschublade, Norm-Popover, Sheets, Reiter schliessen | `src/components/ui/SchliessKnopf.tsx` |
| Korpus-Stand | Kleine Stand-Zeile («Jüngster Eintrag … · Register erzeugt am …») | liest die generierte Zähler-Datei | Zeile entfällt bei fehlendem Wert | Titelblatt, Seitenleisten- und Schubladen-Fuss, Pult-Abschluss | `src/components/ui/KorpusStand.tsx` |
| Schriftgrössen-Regler | Knopfpaar A−/A+ mit Prozentanzeige | Prozent, kann grösser/kleiner, Auf-/Ab-Funktionen | Knöpfe deaktiviert an den Skalengrenzen; die Prozentzahl wird höflich vorgelesen | Titelblatt (ganze Seite), Leser-Ansicht-Menü (nur Normtext) | `src/components/ui/SchriftgroessenRegler.tsx` |
| Gruppenkopf | Gruppenüberschrift + Zähler (Titel · Haarlinie · nackte Zahl) | optional als Absatz statt Überschrift (dann kein Gliederungs-Eintrag) | — | Materialien, Rechtsprechung, Gliederungen, Wizard-Sektionen | `src/components/ui/GruppenKopf.tsx` |
| Facetten-Gruppe | Eine Filter-Facettenachse (Chip-Reihe mit Zahl) | Achsen-Etikett + Chips + Registerfarbe | gewählt/nicht gewählt (Unterstrich plus ✓-Präfix statt Kasten) | `/rechtsprechung`, `/suche` | `src/components/ui/FacettenGruppe.tsx` |
| Listen-Tabelle | Zweispaltige, zeilenweise fluchtende Erlass-/Eintragsliste (Raster statt Mehrspalten-Satz) | — | — | Kantons-Erlasslisten in der Relevanz-Gliederung | `src/components/ui/ListenTabelle.tsx` |
| Rubrik-Kachel | Einstiegs-Kachel mit Zahl + Einheit, Titel, Nutzensatz, «Öffnen →» | — | — | Startseiten-Rubriken, Gesetze-Einstieg (Bund/Kantone/International) | `src/components/ui/RubrikKachel.tsx` |
| Treffer-Zeile | Anklickbare Zeile mit Titel, zweizeilig gekappter Unterzeile, Marke und Pfeil | gemeinsame Geometrie; der Behälter bleibt beim Aufrufer | Gruppen-Hover | Katalog-Register, Such-Panel, `/suche` | `src/components/ui/TrefferZeile.tsx` |
| Auswahlkacheln | Auswahlkacheln mit gedrücktem Zustand, auch als Pillen-Variante | bedeutungstragender Ton je Eintrag: Zustimmung / Ablehnung / Vorbehalt | gewählt/nicht gewählt | Vorlagen-Wizards (Arbeitsvertrag, Mietvertrag, Vorsorgeauftrag, Patientenverfügung, Schlichtungsgesuch), Teuerungsrechner, PLZ-/Gemeinde-Auswahl, Rechtsweg-Wahl | `src/components/ui/SelectionGrid.tsx` |
| Quell-Link | Link «Amtliche Fassung ↗» auf die massgebliche Behördenquelle | Pfeil am Ende, ruhiger Textlink (kein Primärknopf) | aufgehoben/nicht aufgehoben | Erlass-Leser-Kopf, Material-Leser, Norm-Popover, Norm-Chip | `src/components/ui/QuellLink.tsx` |
| Datum | Einheitliche Datumsanzeige (Textstimme, Ziffern in fester Breite, **nie** Monospace) | ISO-Wert | — | überall, wo ein Datum steht | `src/components/ui/Datum.tsx` |
| Herkunfts-Icon | Herkunfts-Piktogramm eines Reiters | Bund / Kanton / International, bei Kanton mit Kürzel | — | Reiterleiste, Gesetzestitel | `src/components/HerkunftIcon.tsx` |
| Adress-Suche (Bund) | Volltext-Adresssuche über die Bundes-Geodaten-API | — | Ladezustand während der Anfrage, Trefferliste | Zuständigkeits- und Gerichtsstand-Formulare | `src/components/ui/AdresseBundSuche.tsx` |
| PLZ-/Gemeinde-Wahl | Kachel-Auswahl bei mehrdeutiger PLZ (nutzt die Auswahlkacheln) | PLZ, Treffer, Gemeinde, Kanton, Kanton fest | Kachel-Klick setzt Gemeinde und Kanton ausdrücklich | Zuständigkeits- und Fristenrechner mit Ortsangabe | `src/components/ui/PlzGemeindeWahl.tsx` |
| Kantons-Auswahl (Seite) | «Alle Kantone»-Übersicht: Karte/Liste-Umschalter, Sortierung (Alphabet / Erlass-Zahl / Erfassungsgrad / Region) | Ansicht «karte» oder «liste»; der Zustand liegt beim Aufrufer und überlebt die Kantonswahl | Sortier-Knöpfe mit gedrücktem Zustand | `/gesetze?ebene=kanton` | `src/pages/gesetze-teile/KantonAuswahl.tsx` |

### 6.2 Formular-Bausteine

| Name | Zweck | Verhalten | Quelle |
|---|---|---|---|
| Datumsfeld | Texteingabe TT.MM.JJJJ + Kalender-Popover; der Wert bleibt intern ISO | Tippen gibt den Wert erst bei vollständigem, gültigem Datum weiter. Ein unmögliches Datum (z. B. 31.02.) macht das Feld sichtbar ungültig mit der Fehlerzeile **«Dieses Datum gibt es nicht – bitte prüfen.»** und löscht den Wert. Kalender als Raster mit Pfeiltasten-Navigation (wandernder Tabindex); Escape und Aussenklick schliessen, der Fokus geht an den Auslöser-Knopf zurück; Knopf «Heute» | `src/components/DatumsFeld.tsx` |
| Betragsfeld | CHF-Eingabe mit Live-Tausenderapostroph; der Cursor bleibt stabil | Nach aussen fliesst der bereinigte Rohwert (nur Ziffern, Punkt, Minus); negative Werte optional erlaubt | `src/components/BetragsFeld.tsx` |
| Aktenzeichen-Feld | Optionale Mandats-Referenz (max. 60 Zeichen) | Erscheint im PDF-Kopf und im Kalender-Eintrag; wird **nirgends gespeichert oder übertragen** | `src/components/AktenzeichenFeld.tsx` |
| Feld-Rahmen | Geteilter Rahmen aus Label, Hilfetext und Fehlerzeile | Label · Hilfetext · **«· optional»**-Zusatz am Label · Fehlt-Zustand (setzt Ungültig-Auszeichnung und Beschreibungs-Verweis **nur** auf native Bedienelemente). Erkennt automatisch, ob das Kind ein natives Eingabe-, Auswahl- oder Textfeld ist oder ein zusammengesetztes Feld (dann Beschriftung per Verweis) | `src/components/vorlagen/ui.tsx` |
| Ankreuzfeld | Geteiltes Ankreuzfeld (Trefferzeile ≥ 44 px) | Optionaler Hilfetext als Unterzeile | `src/components/vorlagen/ui.tsx` |
| Listen-Editor | Repeater für wiederholbare Zeilen (Begehren, Kinder, Beilagen …) | «+ Element» erscheint bis zur Höchstzahl; «entfernen» erst oberhalb der Mindestzahl; mehrere Hinzufügen-Knöpfe für dieselbe Liste möglich | `src/components/vorlagen/ui.tsx` |
| Schrittleiste | Wizard-Fortschrittsleiste | Mobil: Fortschrittsbalken + Klartext-Schrittname. Desktop: klickbare Chips bis zum erreichten Schritt; spätere Schritte deaktiviert mit dem Tooltip «Noch nicht erreichbar — vorherige Schritte zuerst ausfüllen» | `src/components/vorlagen/ui.tsx` |
| Berührt-Rahmen + Fehlerbox | Grundsatz «kein Fehler vor der ersten Eingabe» | Der Berührt-Rahmen schaltet bei einem Eingabe- oder Änderungs-Ereignis (**nicht** bei einem Klick) von unberührt auf berührt um. Die Fehlerbox (immer mit Alarm-Rolle) zeigt nur, wenn berührt **und** die Fehlerliste nicht leer ist; Titel **«Eingabefehler»** | `src/components/vorlagen/ui.tsx` |
| Kopier-Knopf | Vereinheitlichter Kopier-Knopf | Label «<Gegenstand> kopieren» → nach Erfolg **«Kopiert ✓»**; auch von aussen steuerbar | `src/components/vorlagen/ui.tsx` |
| Beispiel-Chips | «Beispiel laden:»-Chipreihe | Lädt eine vollständige Formular-Vorbelegung | `src/components/vorlagen/ui.tsx` |
| Eckdaten-Kachel | Ergebnis-Kachel (Label / Wert / Unterzeile), optional akzentuiert für die wichtigste Kachel | Wird bei jeder Wertänderung neu aufgebaut → sichtbarer Live-Puls | `src/components/vorlagen/ui.tsx` |
| Ergebnis-Platzhalter | Leerzustand des künftigen Ergebnisblocks | Feste Mindesthöhe (kein Layout-Sprung); zeigt **vor der ersten Eingabe**, was erscheinen wird — ohne Fehler | `src/components/vorlagen/ui.tsx` |
| Ergebnis-Sprung | «↓ Ergebnis»-Sprungmarke | Blendet sich aus, sobald das Ergebnis im Bild ist; im Druck ausgeblendet | `src/components/vorlagen/ui.tsx` |
| Live-Kopfzeile | Live-Berechnungs-Hinweis | Text «Live-Berechnung – aktualisiert sich automatisch» | `src/components/vorlagen/ui.tsx` |
| Zahl-Parser | Die eine Quelle der Zahl-Parser der Rechner-Formulare | Toleriert Tausender-Apostroph und Leerzeichen; leer oder ungültig ergibt «kein Wert» | `src/components/forms/eingabe.ts` |
| Ja/Nein-Auswahl | **Kein eigener benannter Baustein** | Wird fallweise über Auswahlkacheln (Pillen-Variante), ein Ankreuzfeld oder Reiter im gedrückten Modus gebaut — siehe Abschnitt 9 | — |

### 6.3 Layout-Bausteine

| Name | Zweck | Verhalten | Quelle |
|---|---|---|---|
| App-Rahmen | Seitenleiste, Titelblatt, Routen-Bereich, mehrere Fenster | Sprunglink **«Zum Inhalt springen»** als erstes fokussierbares Element; `F6`/`Shift+F6` wechselt den Fokus zyklisch zwischen offenen Fenstern (und respektiert offene modale Dialoge); Seitenleiste ein-/ausklappbar, Breite per Ziehgriff (Pfeiltasten ±) verstellbar | `src/components/layout/Shell.tsx` |
| Routen-Hülle | Vereinheitlichte Routen-Hülle: Fehler-Auffangnetz → Nachlade-Grenze → Einblend-Block | Rückfalltext **«Wird geladen …»** unter einer Linien-Ladeanimation; die Fehlanzeige setzt sich beim nächsten Seitenwechsel zurück; Höhenreservierung abhängig davon, ob die Route in einem Fenster läuft | `src/components/layout/RouteHuelle.tsx` |
| Deep-Link-Gerüst | Overlay beim Einsprung mit Artikel-Anker | Reine Sicht-Ebene (fest positioniert, nicht klickbar); verschwindet spätestens nach 6000 ms harter Kappe; greift **nicht** in die Sprung-Mechanik ein | `src/components/layout/DeepLinkSkeleton.tsx` |
| Thema-Umschalter | Hell-/Dunkel-Umschalter im Titelblatt | Dreier-Zyklus hell → dunkel → auto per Klick; Icons ☀/☾/◐; ohne ausdrückliche Wahl folgt der «unberührte» Zustand der Systemeinstellung live | `src/components/layout/ThemaUmschalter.tsx`, `src/components/thema.ts` |
| Kopf-Suche | Kopf-Suchfeld mit Treffer-Panel | Tastenkürzel siehe 6.9; das Panel schliesst bei Escape und Aussenklick; «Meinten Sie …?»-Vorschläge sind übernehmbar | `src/components/layout/HeaderSuche.tsx` |
| Seitenleiste / Schublade | Navigation | Das Schliessen gibt den Fokus an den ☰-Knopf zurück | `src/components/layout/Sidebar.tsx`, `useDialogFokus.ts` |

### 6.4 Querschnitts-Infrastruktur

| Baustein | Zweck | Verhalten | Quelle |
|---|---|---|---|
| Icon-Set | Ein Icon-Set (Linien-Gravur, Strichstärke 1.5, 24 × 24, erbt die Textfarbe) | Rückfall auf das Dokument-Icon bei unbekanntem Namen. Vollständige Liste: 6.12 | `src/components/Icon.tsx` |
| Typografische Sonderbehandlung | Zwei Eingriffe | «&» in Display-Titeln in der Groteskschrift statt der Display-Glyphe; der Tausender-Apostroph wird als eigenes schmales Zeichen gesetzt, damit «1'577» sich nicht wie drei Zeichen breit liest | `src/components/typografie.tsx` |
| Herkunfts-Icon | Bund = Schweizerkreuz (Bild-Asset `/wappen/CH.svg`), Kanton = Wappen, International = Welt-Piktogramm | reine Darstellung | `src/components/HerkunftIcon.tsx` |
| Entwurf-Legende | Erklärungs-Popover zum «Entwurf»-Badge (touch- und tastaturtauglich) | Klick- bzw. Enter-Umschaltung, Escape und Aussenklick schliessen. Popover-Text: **«Das Werkzeug ist erstellt, aber fachlich noch nicht geprüft. Zahlen und Aussagen im Einzelfall gegen Gesetz und Sachverhalt verifizieren.»** | `src/components/EntwurfLegende.tsx` |
| Pflicht-Disclaimer | Nicht ausblendbarer Rechtshinweis auf jeder Rechnerseite | Klappelement mit der Zusammenfassung **«Rechtlicher Hinweis – keine Rechtsberatung»**. Vorgabetext: **«Automatisierte Orientierungsberechnung – keine Rechtsberatung und keine verbindliche Fristberechnung. Massgeblich sind GAV, Vertrag, Versicherungspolice und der konkrete Sachverhalt; abweichende Regelungen gehen vor. Norm- und Rechtsprechungsverweise sind im Einzelfall zu prüfen.»** | `src/components/PflichtDisclaimer.tsx` |
| Fehler-Auffangnetz | Render-Fehler abfangen | Titel **«Diese Ansicht konnte nicht angezeigt werden»**, Intro **«Ein unerwarteter Fehler hat die Darstellung unterbrochen. Ihre Eingaben verlassen den Browser nicht; ein Neuladen der Seite stellt die Ansicht in der Regel wieder her.»**, technische Meldung als Code-Block, Knopf **«Seite neu laden»**, optional Mailto-Link **«Fehler melden»**. **Kein automatisches Neuladen** (bewusst). Meldet Fehler gesampelt | `src/components/ErrorBoundary.tsx` |
| Fehlerkanal | Minimaler Client-Fehlerkanal | Sampling-Quote 25 %, Meldung auf 300 Zeichen gekappt; sendet **nur** Meldungstext, Pfad (ohne Query und Anker) und Build-Kennung; wirft nie | `src/components/fehlermeldung.ts` |
| Kopier-Hook | Kopieren mit Quittung | Quittung «Kopiert ✓» erst **nach** erfolgreichem Schreiben in die Zwischenablage; Kanon-Verweildauer **1600 ms**; Timer wird beim Ausbau oder erneuten Klick aufgeräumt; eine Marke erlaubt mehrere Kopier-Ziele in derselben Fläche | `src/components/useKopieren.ts` |
| Hover-Vorschau-Regeln | Zeit- und Zeiger-Regeln für Hover-Vorschau-Chips | **Öffnen nach 450 ms** ruhendem Zeiger, **Schliessen mit 180 ms Nachlauf** (WCAG 1.4.13 «hoverable»); auf Touch bleibt es beim Klick | `src/components/hoverVorschau.ts` |
| Thema-Logik | Dunkel-/Hell-Modus | Werte hell/dunkel plus Wahl «auto»; ohne Wahl folgt der Erstbesuch der Systemeinstellung (seit 8.8.2026, vorher zeitbasiert). Klasse am Wurzelelement, Farbschema und Browser-Themenfarbe werden synchron gesetzt. Speicherung in `localStorage['lexmetrik-thema']`, App-weite Benachrichtigung an Titelblatt und Einstellungen | `src/components/thema.ts` |
| Sprach-Gerüst | Minimal-i18n | `de` fertig; `en`/`fr`/`it` «in Bearbeitung» — der Umschalter funktioniert, die Inhalte fallen auf Deutsch zurück. Locale in `localStorage['lexmetrik.locale']`, koppelt die Sprachauszeichnung des Dokuments; Fedlex-Links werden auf fr/it umgeschrieben (amtlich), en bleibt de | `src/components/locale.tsx` |
| Lazy-Wiederholung | Nachladen mit Wiederholung | 3 Versuche mit Backoff (250/500/750 ms); scheitert alles, **einmalig** automatisches Neuladen (Sitzungs-Flag gegen Endlosschleife), danach Fehler nach 4000 ms, falls das Neuladen nicht durchkommt | `src/lazyRetry.ts` |

### 6.5 Status-Modell (entwurf / geprüft / geplant)

Drei Werte: `entwurf`, `geprüft`, `geplant`. Der Kommentar an der Typdefinition sagt:
«Ehrliches Status-Modell: kein Eintrag trägt «geprüft», bis fachlich geprüft.»

- **`entwurf`** — «gebaut, fachlich noch nicht geprüft». Badge in Umriss-Anatomie ohne
  Füllung, Wortlaut **«Entwurf»**, Tooltip «erstellt, fachlich noch nicht geprüft».
  Anzeigeorte: Katalog-Registerkarten und die tastaturzugängliche Entwurf-Legende am
  Katalog-Kopf (6.4).
- **`geprüft`** — fachlich geprüft, Goldrand-Optik. Laut Code-Kommentar **aktuell
  nirgends vergeben**; eine Messung am Katalog (22.9.2026) bestätigt: **0 Einträge**
  (Nebenfund N13).
- **`geplant`** — «noch nicht gebaut». Badge mit Wortlaut **«In Vorbereitung»**
  (Entscheid David 31.8.2026). Anzeigeorte: Katalog (hinter einem Flag) und die
  Stub-Seite für noch nicht gebaute Rechner.
- **Badge-Anatomie:** seit 6.9.2026 **eine** Form für alle Status-Badges — eine
  1-px-Umrisslinie statt einer Füllung. **Nur** Warn- und Gefahr-Badges behalten eine
  Füllung, weil die Farbe dort eine echte Warnung trägt statt nur ein Etikett zu sein.
- **Verwandte, aber eigenständige Felder** — nicht mit dem Karten-Status verwechseln:
  - **`verified`** (true/false) auf Ebene **einzelner Norm-Anker**: «true nur bei
    geprüftem Artikel-Anker». Messung 22.9.2026: in den Katalog-Modulen **0 Einträge**
    mit `verified: true`.
  - **Form-Gate** (`fertig` / `abschrift` / `entwurf` / `gemischt`) bei
    Vorlagen-Formularen — siehe 5.3.9.
  Drei ähnlich klingende Felder für drei verschiedene Sachen (Nebenfund N10).
- Weitere Fundorte derselben Badge-Klassen: Ergebnis-Anzeige, Verfall-Übersicht,
  Zuständigkeits-Ergebnis und -Formular, Vorlagen-Sprung, Erfassungsgrad,
  Rechtsgebiets-Sicht, Gewährleistungs-Formular, Entscheid-Karte, Entscheide-Liste der
  Startseite, Rechtsprechungs-Filter-Sheet, Datenschutzseite.

**Quelle:** `src/lib/startseiteConfigTypen.ts`, `src/components/Katalog.tsx`,
`src/components/EntwurfLegende.tsx`, `src/pages/RechnerStub.tsx`, `src/index.css`.

### 6.6 App-weite Zustände

**Leer.** Der Leerzustands-Baustein (6.1) — ein Aussagesatz, nie eine Frage, mit
optionalem Weiterweg. Bei Filter-Nulltreffern ist der Weiterweg **Pflicht**.

**Lädt.**

- Routenwechsel: Rückfalltext **«Wird geladen …»** unter einer Linien-Ladeanimation —
  **kein** klassisches Spinner-Icon, kein Skelett-Bildschirm als Standard.
- Deep-Link mit Artikel-Anker: Gerüst-Overlay (reine Sichtebene, max. 6 s).
- Einzelne Leser-Bausteine verwenden eine pulsierende Skelett-Optik.
- **Kein generisches Spinner-Icon** im Baustein-Satz.

**Fehler.**

- Render-Fehler: Fehler-Auffangnetz (6.4) mit «Seite neu laden» und optional «Fehler
  melden».
- Veralteter oder fehlgeschlagener Nachlade-Chunk (Deploy-Drift): Wiederholung plus
  ein globaler Ereignis-Hörer — jeweils **einmalig** automatisches Neuladen, gegen
  Endlosschleife per Sitzungs-Flag abgesichert.
- Datenfehlschlag einer Teilfläche: der Abruf-Fehler-Baustein (6.1) — Satzbau
  «<Gegenstand> konnte(n) nicht geladen werden. Amtliche Quelle: …».
- Eingabefehler im Formular: Fehlerbox (Titel «Eingabefehler», Alarm-Rolle), sichtbar
  erst nach Berührung.
- «Nicht gefunden»: Fehlseite (6.1).
- Fehler ausserhalb des Komponentenbaums werden ebenfalls gesampelt gemeldet.
- **Offline-Zustand:** kein dedizierter Indikator gefunden (Abschnitt 9).

**Erfolg.**

- Kopieren: **«Kopiert ✓»**, 1600 ms Verweildauer, erst nach echtem Erfolg — nie
  vorgetäuscht.
- Live-Berechnung: **«Live-Berechnung – aktualisiert sich automatisch»**.
- Eckdaten-Kachel **pulst** bei jeder Wertänderung — ein sichtbares Update-Signal ohne
  eigenen Erfolgstext.

**Warn- und Hinweis-Kästen.**

- **Neutrale Basis-Anatomie:** transparenter Hintergrund, 3-px-Markenstrich links,
  16/12-px-Innenabstand. **Kein Kasten, keine Fläche** mehr (seit 6.9.2026) — nur der
  Strich hebt vom Fliesstext ab.
- **Warn-Variante:** behält eine Füllung, weil die Farbe hier eine echte Bedeutung
  trägt (Sachvorbehalt, Warnung).
- **Gefahr-Variante:** behält eine Füllung analog (Fehler, Gefahr).
- Verwendung: Pflicht-Disclaimer (neutral) · Datumsfeld-Fehlerzeile (Gefahr, «Dieses
  Datum gibt es nicht – bitte prüfen.») · Fehlerbox (Gefahr).
- Die analoge Badge-Familie trägt Zustands-Etiketten: ok · massgeblich · warn ·
  entwurf · geplant · danger · soft.

### 6.7 Formular-Konventionen

- **Feldtypen:** Datumsfeld (Kalender-Popover) · Betragsfeld (CHF-Tausenderformat live)
  · Aktenzeichen-Feld (optionale Referenz) · Ankreuzfeld (≥ 44 px) · Auswahlkacheln
  bzw. Reiter im gedrückten Modus für Auswahl- und Ja/Nein-artige Entscheidungen ·
  PLZ-/Gemeinde- und Kantons-Auswahl für Orte · Listen-Editor für wiederholbare Zeilen.
- **«Kein Fehler vor der ersten Eingabe»** (Grundsatz David, site-weit verbindlich):
  technisch über den Berührt-Kontext — Fehler erscheinen erst, nachdem das Formular
  mindestens ein Eingabe- oder Änderungs-Ereignis erhalten hat (**bewusst nicht** bei
  einem Klick: ein Fokus-Klick ins leere Feld zählt nicht als Berührung).
  **Feldlokale Ausnahme:** Das Datumsfeld zeigt bei einem unmöglichen Datum (z. B.
  31.02.) **sofort** eine Feld-Fehlerzeile mit Alarm-Rolle, weil das ein tatsächlicher
  Eingabefehler ist und keine leere Erstanzeige.
- **Pflichtkennzeichnung — umgekehrtes Modell:** Der Feld-Rahmen markiert **optionale**
  Felder mit «· optional» hinter dem Label. **Pflichtfelder tragen kein Zusatzzeichen**
  (kein Sternchen-Muster). Siehe Nebenfund N9.
- **Hilfetexte** rendern als 12-px-Zeile unter dem Feld; Norm-Referenzen darin sind
  verlinkt.
- **Feld-Fehler:** Die Ungültig-Auszeichnung und der Beschreibungs-Verweis werden
  **nur** auf native Bedienelemente gesetzt; zusammengesetzte Felder (Datumsfeld,
  Betragsfeld) tragen ihre Fehlermeldung stattdessen sichtbar im eigenen Markup.
- **Tastaturbedienung:** Der Kalender ist ein Raster mit Pfeiltasten und wanderndem
  Tabindex (Auf/Ab springt eine Woche); Escape schliesst und gibt den Fokus an den
  Auslöser-Knopf zurück. Die Reiter folgen dem Standard-Muster (Pfeiltasten links/
  rechts/oben/unten, Pos1, Ende, wandernder Tabindex).
- **Datenschutz-Hinweis** für Vorlagen ohne lokale Speicherung, Kanon-Wortlaut:
  **«Eingaben werden nicht gespeichert – sie bestehen nur, solange diese Seite geöffnet
  ist.»**

### 6.8 Interaktionsmuster

- **Reiter — zwei verschiedene Dinge:** der **Segment-Control** (6.1) für
  Inline-Umschaltung innerhalb einer Seite; daneben das eigenständige **Reiter-System
  für offene Dokumente** (1.3.2), dessen Reiter einen destruktiv getönten
  Schliess-Knopf tragen.
- **Sheets und Overlays:** Bottom-Sheets von unten (6.1) für Gliederung und Treffer im
  Leser, den Mobil-Filter der Rechtsprechung und das Blatt «Startseite anpassen». Die
  Overlay-Anatomie (Scrim) kennt drei Abstufungen. Fokus-Falle über einen eigenen Hook.
- **Popover und Hover-Vorschau:** zwei Chip-Familien (Kanten-Zelle mit
  Regeste-Vorschau, Norm-Chip mit Wortlaut-Vorschau) teilen sich die Zeit- und
  Zeiger-Regeln aus 6.4: Öffnen nach 450 ms Ruhe, Schliessen mit 180 ms Nachlauf; auf
  Touch nur per Klick.
- **Menüs:** einheitliche Menü-Anatomie (6.1) für Verlauf, Reiter-Blatt, Sprache,
  Thema und Leser-Ansicht. **Kein Menü-Muster im ARIA-Sinn** (es wird keine
  Pfeiltasten-Bedienung versprochen); die Rollen setzt jeweils der Aufrufer.
- **Kopieren:** «Kopiert ✓» erst nach echtem Erfolg (6.4).
- **Teilen:** der Teilen-Knopf nutzt denselben Kopier-Mechanismus für Permalinks (1.7).
- **Drucken:** Bedienelemente werden pauschal ausgeblendet; die Reiter zeigen im Druck
  stattdessen eine **Klartext-Zeile mit der getroffenen Auswahl**; Tabellenzeilen,
  Listenpunkte, Zitate und Hinweiskästen werden gegen Umbruch mitten im Element
  geschützt; der Ergebnis-Sprung ist zusätzlich ausdrücklich ausgeblendet.
- **Downloads:** PDF, DOCX und ICS — siehe 4.3.1 (Rechner) und 5.3.7 (Vorlagen).

### 6.9 Tastenkürzel (vollständig)

| Kürzel | Wirkung | Kontext / Ausnahmen |
|---|---|---|
| `⌘K` / `Ctrl+K` | Fokussiert das Kopf-Suchfeld | global, ab dem ersten Zeichnen aktiv (ein Vorlauf-Mechanismus greift, weil der reguläre Hörer erst nach dem ersten Render existiert). Vorrang für Hörer, die den Tastendruck bereits in der Einfangphase beansprucht haben (z. B. das Leser-Suchfeld) |
| `/` | Fokussiert das Kopf-Suchfeld | nur ausserhalb von Eingabe-, Text- und Auswahlfeldern und editierbaren Flächen; nicht mit Meta, Ctrl oder Alt kombiniert |
| `Escape` | Schliesst das Such-Treffer-Panel, leert Feld, Query und Auswahl | Suchfeld-Panel offen |
| `↓` / `↑` | Navigiert Treffer und Vorschläge im Such-Panel | Panel offen, nur wenn die Trefferliste nicht leer ist |
| `Enter` | Öffnet den hervorgehobenen bzw. obersten Treffer | Suchfeld |
| `Ctrl/⌘+Enter` | Öffnet den Treffer in einem neuen Reiter | Suchfeld |
| `Alt+Enter` | Öffnet den Treffer daneben (zweites Fenster) | Suchfeld, nur wenn ein Fenster geöffnet werden kann (ab dem grossen Breakpoint, freie Kapazität) |
| `F6` | Wechselt den Tastatur-Fokus zyklisch zwischen offenen Fenstern | nur im Mehrfenster-Modus; respektiert offene modale Dialoge |
| `Shift+F6` | Wie `F6`, in umgekehrter Reihenfolge | wie `F6` |
| `←` / `→` | Verstellt die Seitenleisten- bzw. Fensterbreite in Schritten | Fokus auf dem Ziehgriff |
| `←` `→` `↑` `↓` `Pos1` `Ende` | Navigation innerhalb eines Segment-Controls (wandernder Tabindex) | nur im Modus «Tab» |
| `←` `→` `↑` `↓` | Navigiert das Tagesraster im Kalender-Popover (Auf/Ab = eine Woche) | Kalender offen |
| `Escape` | Schliesst das Kalender-Popover, Fokus zurück auf den Auslöser-Knopf | Datumsfeld |
| `j` / `k`, `←` / `→`, `r` | Artikel vor/zurück · Blättern im Einzelmodus · Beiwerk-Blatt öffnen | Gesetzes-Leser (2.3) |

**Reiter-Kürzel der Arbeitsleiste** (1.3.2, bewusst mit `Alt`, weil der Browser
`Ctrl/⌘` für seine eigenen Tabs abfängt): `Alt+T` neuer Reiter · `Alt+W` schliessen ·
`Alt+Shift+T` zuletzt geschlossenen wiederherstellen · `Alt+Shift+←/→` verschieben ·
`Alt+1…9` n-ter sichtbarer Reiter · `Alt+PageUp/PageDown` umlaufend blättern.

**Quelle:** `src/components/layout/{HeaderSuche,Shell,Reiterleiste}.tsx`,
`src/components/ui/Tabs.tsx`, `src/components/DatumsFeld.tsx`, `src/main.tsx`.

### 6.10 Responsive, Dunkelmodus, Druck, Barrierefreiheit

- **Breakpoints:** **keine eigenen** definiert — es gelten die Standardwerte
  `sm` 640 px · `md` 768 px · `lg` 1024 px · `xl` 1280 px · `2xl` 1536 px. Zusätzlich
  Container-Abfragen für fenster-relative Raster.
- Mehrere Bausteine tragen dokumentierte Sonderbrüche unterhalb der Standardskala —
  etwa bricht das Segment-Control **unter 400 px** von horizontalem Bildlauf auf
  Umbruch um.
- **Mobile Navigation:** Die Seitenleiste ist ab dem grossen Breakpoint persistent;
  darunter eine Schublade mit Fokus-Falle und Fokus-Rückgabe an den ☰-Knopf beim
  Schliessen.
- **Dunkelmodus:** dreistufiger Umschalter hell → dunkel → auto. **Kein reiner
  System-Zwang:** «auto» und der unberührte Erstbesuch folgen der Systemeinstellung
  live; eine ausdrückliche Wahl wird gespeichert. Kein serverseitiges Umschalten, kein
  Inline-Skript (strenge Skript-Richtlinie) — die Anwendung geschieht beim
  Client-Aufbau plus über einen frühen Pfad vor dem ersten Zeichnen gegen Flackern.
- **Druckansicht:** Bedien-Chrome wird pauschal ausgeblendet; Reiter, Ergebnis-Sprung
  und Sprungmarken tragen zusätzlich eine ausdrückliche Ausblendung; Umbruchschutz für
  Tabellen, Listen, Zitate und Hinweiskästen.
- **Barrierefreiheit:**
  - Sprunglink **«Zum Inhalt springen»** (WCAG 2.4.1), erstes fokussierbares Element,
    nur für Screenreader sichtbar bis zum Fokus.
  - Die Einstellung «Bewegung reduzieren» wird an vier Stellen berücksichtigt — unter
    anderem trägt der Schrittleisten-Fortschrittsbalken die entsprechende Ausnahme.
  - **Touch-Trefferflächen:** 44-px-Komfortmass über eine unsichtbare Erweiterung beim
    Schliess-Knopf; WCAG-2.5.5/2.5.8-Bezüge in mehreren Kommentaren (Reiter mobil
    höher als auf dem Desktop).
  - Fokus sichtbar über eine globale Fokus-Regel.
  - **Alarm-Rolle bewusst sparsam:** nur die Sammel-Fehlerbox, nicht jede Feldzeile —
    sonst würden bei leerem Formular mehrere Alarme gleichzeitig vorlesen.
  - Schwebe-Meldungen werden **höflich** vorgelesen, nie als Alarm — keine der drei
    Meldungsformen unterbricht den Lesefluss.

### 6.11 Sprach- und Formatkonventionen

- **Oberflächensprachen:** `de` ist Quelle und einzige vollständige Sprache; `en`,
  `fr`, `it` sind als Umschalter vorhanden, aber «in Bearbeitung» — Inhalte fallen auf
  Deutsch zurück, bis fachkundig übersetzt. **Keine Text-API, kein LLM.** Fedlex-Links
  werden bei fr/it auf die amtliche Sprachfassung umgeschrieben, bei en bleibt es die
  deutsche Fassung.
- **Zahlenformat:** CHF-Beträge de-CH-lokalisiert mit Tausender-**Apostroph** (gerader
  Apostroph als das eine Trennzeichen). **Fünf bewusst unterschiedene Formatter** je
  nach Rundungs- und Präfixbedarf — nicht zusammengeführt, weil es fachlich
  verschiedene Fälle sind. In der Oberfläche wird der Apostroph zusätzlich typografisch
  verschmälert.
- **Datumsformat:** lange Form «5. Juni 2026» (Vorlagen-Briefköpfe), kurze Form
  `TT.MM.JJJJ` (Anzeige). **Fehlende oder unvollständige Daten zeigen einen
  Ausfüll-Strich `________`** statt eines leeren Felds.
- **Norm- und Stand-Zitat:** Die kopierbare Nachweiszeile lautet «Fassung vom … ·
  abgerufen am … · <Permalink> · amtliche Fassung: <URL>» — feste Reihenfolge; eine
  fehlende Fassung wird **ehrlich weggelassen statt erfunden**.
- **Typografische Konventionen:** Schweizer Guillemets «» · durchgängig «ss» statt «ß» ·
  **kein ALL-CAPS-Fliesstext**, Badges tragen keine Versalien · Overlines ohne
  Versalien und ohne Sperrsatz.

### 6.12 Icon-Set (vollständig)

Linien-Icons, 24 × 24, Strichstärke 1.5, runde Kappen, erben die Textfarbe.

| Schlüssel | Motiv |
|---|---|
| `document` | Dokument (Blatt mit Eselsohr + Textzeilen) — **auch der Rückfall für unbekannte Namen** |
| `clock` | Uhr (Zifferblatt mit Viertel-Ticks) |
| `percent` | Prozent (Diagonale mit zwei Ringen) |
| `scale` | Waage (Balken, Schalen, Fuss) |
| `house` | Haus (Dachlinie, Korpus, Tür) |
| `clipboard` | Klemmbrett (Brett, Clip, Zeilen) |
| `court` | Gericht (klassizistische Säulenfassade) |
| `calculator` | Rechner (Gehäuse, Anzeigefeld, Tastenraster) |

Separat implementierte Piktogramme ausserhalb dieser Datei: Schweizerkreuz (Bild-Asset
`/wappen/CH.svg`) und ein Welt-Icon (eigenes Inline-SVG, gleicher Gravur-Stil) für
Bund und International; Kantons-Wappen in einer eigenen Datei.

**Quelle:** `src/components/Icon.tsx`, `src/components/HerkunftIcon.tsx`,
`src/components/KantonWappen.tsx`.

### 6.13 Verhaltensregeln aus dem Design-Reglement (ohne Farbwerte)

Struktur des Reglements: A Sprache & Verständlichkeit · B Informations-Darstellung ·
C Produkt-UX · D Vertrauen & Quellentransparenz · E Methode & Governance · F UI-Design
(F0 Handschrift «Sammlung») · G Rollen-/Farb-Wörterbuch · Audit-Anhänge.

Verhaltensrelevante Kernregeln:

- **B1** — Verdikt zuerst, Herleitung auf Abruf (aufklappbar).
- **B2** — feste Typo-Skala (micro · xs · body-s · base · body-l · h3 · h2 · h1 ·
  display); keine Framework-Vorgabegrössen, keine freien Zwischengrössen. Lesespalte
  rund 40 rem für langen Fliesstext.
- **B3** — genau **vier** Status-Familien (ruhig · neutral · warn · danger), keine
  Ad-hoc-Farben. Icons immer **zusätzlich** zum Text, nie alleiniger Bedeutungsträger.
  Genau ein Icon-Set.
- **B4** — Prozesse und Wizards als sichtbarer Schritt-Pfad, nicht als Prosa.
- **C1** — Überblick → Drilldown, **nie eine Sackgasse**, nie Detail ohne
  Kontext-Anker. Grundlage für den Pflicht-Weiterweg der Fehlseite und die
  Weiterweg-Pflicht des Filter-Leerzustands.
- **C2** — **«ein leeres Formular zeigt keine Fehler»** — site-weit verbindlich.
- **C3** — der «Warum»-Layer (Norm, Herleitung) ist überall erreichbar, nicht nur das
  Resultat.
- **C4** — Modi statt Einheitszwang (Hell/Dunkel, gegebenenfalls künftig Fach/Laie).
- **D1** — jeder Rechtswert mit **Norm + Link + Stand**.
- **D2** — keine Magic Numbers und Ad-hoc-Werte, alles über Tokens.
- **D3** — Status-Marker bleiben ehrlich sichtbar; **nichts wird als «geprüft»
  dargestellt, was es nicht ist**.
- **E1** — maschinell prüfbare Regeln gehören in Tore und Tests, nicht nur ins
  Dokument.
- **E3** — Mehrsprachigkeit als Layout-Variable: keine festen Breiten, die nur für
  Deutsch passen.
- **F0 «Handschrift Sammlung»** (zwölf Punkte; hier nur die verhaltensrelevanten):
  Radien durchweg 0 (ausser vollrund) · genau **ein** Schatten · Trennung über Linien
  statt Kästen (1 px weich / 2 px normal) · keine Versalien und kein Sperrsatz an
  Overlines · Inline-Links unterstrichen (Navigation, Listen und Chips dürfen ohne,
  müssen das im Markup aber ausdrücklich sagen) · Menü-Anatomie = Liste mit Linien +
  Zustandswort + Fokus-Strich · Feld-Anatomie = Unterstrich · Sprache ohne Slogans und
  Nutzenversprechen.

**Quelle:** `DESIGN-REGLEMENT.md` (Teil I, §N, §R), `.claude/rules/design.md`,
`design/tokens.json`.

---

## 7 Nebenfunde für den Umbau

Befunde, die beim Erstellen dieses Inventars aufgefallen sind. **Nur Befund, keine
Massnahme** — der Design-Agent soll sie kennen, damit er beim Nachbau nicht über sie
stolpert und beim Umbau weiss, wo eine scheinbar einfache Änderung zwei Stellen
berührt.

1. **N1 · Zwei parallele Metadaten-Quellen für die 20 gebauten Rechner.**
   `src/lib/calculators.ts` (genutzt von den **Seitenköpfen** für Überschrift,
   Kategorie-Overline, Kurzbeschrieb und Norm-Chips) und der Katalog
   `startseiteConfig.ts` (genutzt von der **Übersicht `/rechner` und der Suche**)
   pflegen **unabhängig** Titel, Kategorie-Bezeichnung, Kurzbeschrieb und Normen-Liste
   für denselben Rechner. Beispiel `kuendigung`: die Rechner-Liste nennt die Kategorie
   «Arbeitsrecht» und den Kurzbeschrieb «Kündigungs- und Sperrfristen sowie
   Lohnfortzahlung nach kantonaler Skala.», der Katalog führt stattdessen **zwei
   getrennte Karten** (`kuendigung-sperrfristen`, `lohnfortzahlung`) mit dem
   Rechtsgebiet «Arbeit» und je eigenem, länger ausformuliertem Text. Ob und wie oft
   beide Register faktisch auseinanderlaufen, ist nicht gemessen — festgehalten ist
   das strukturelle Risiko. *Quelle: `src/lib/calculators.ts`,
   `src/lib/startseiteKarten*.ts`.*

2. **N2 · Katalog-ID ≠ Routen-Slug bei den Erb-Fristen.** Die Katalogkarte
   `erbrecht-fristen` verlinkt korrekt auf `/rechner/erb-fristen`, aber Karten-ID und
   URL-Segment weichen voneinander ab (Route und Rechner-Slug heissen `erb-fristen`).
   Funktional kein Fehler, eine Inkonsistenz in der Namensgebung. **Dasselbe Muster
   bei drei Vorlagen:** Katalog-ID `schlichtungsgesuch` → Route
   `/vorlagen/schlichtungsgesuch-bs`; `eigenhaendiges-testament` →
   `/vorlagen/testament`; `mietvertrag-wohnen` → `/vorlagen/mietvertrag`. **Praktische
   Folge für den Nachbau: beim Verlinken immer das `href`-Feld verwenden, nie den
   Katalog-Key als Pfad ableiten.** *Quelle: `src/lib/startseiteKarten*.ts`,
   `src/lib/startseiteVorlagen*.ts`, `src/routesManifest.ts`.*

3. **N3 · Die Vorlagen-Karte `kapitalerhoehung` liegt im falschen Modul.** Sie lebt
   **nicht** in `src/lib/startseiteVorlagen*.ts`, sondern in
   `src/lib/startseiteKartenAusbau.ts` («Teilmodul Katalog-Ausbau Phase 3») — einer
   Datei für Rechner-Karten **und** diese eine Vorlagen-Karte. Sie fliesst über die
   Zusammenführung genauso in den Vorlagen-Katalog wie die 71 Einträge aus den
   Vorlagen-Modulen (verifiziert). Funktional korrekt, aber ein
   Datei-Konventionsbruch. *Quelle: `src/lib/startseiteKartenAusbau.ts`,
   `src/lib/startseiteConfig.ts`.*

4. **N4 · Vier Kündigungs-Masken sind im Katalog unsichtbar geschaltet.**
   `kuendigung-arbeitgeber`, `kuendigung-arbeitnehmer`, `kuendigung-mieter` und
   `kuendigung-vermieter` tragen `imKatalog: false` und erscheinen **nicht** im
   Vorlagen-Register. Erreichbar sind sie nur über die Themen-Einstiege der Rechner
   (Kündigung Arbeit, Mietrecht) und über Cross-Links. Das erklärt auch die Differenz
   zwischen dem Zähler auf `/vorlagen` (26) und der Zahl der Routen (30).
   *Quelle: `src/lib/startseiteVorlagenAusbau.ts`,
   `src/lib/startseiteVorlagenVorsorgeVertraege.ts` (je 2 Treffer, gemessen 22.9.2026).*

5. **N5 · Lehrvertrag, Handelsreisendenvertrag und Heimarbeitsvertrag sind keine
   eigenen Routen.** Sie sind **Untertypen** von `/vorlagen/arbeitsvertrag`, gewählt
   über die Vertragstyp-Kacheln im Seitenkopf, und stehen weder im Routen-Manifest noch
   im Katalog. Wer sie im neuen Design als eigenständige Werkzeuge zeigen will, baut
   damit eine neue Informationsarchitektur, nicht nur eine neue Oberfläche.
   *Quelle: `src/pages/VorlageArbeitsvertrag.tsx` und die drei Untertyp-Seiten.*

6. **N6 · Katalog-Export ist ein Ober-Set, keine Garantie.** Die Karte
   `vorsorgeauftrag` trägt `output: ['pdf','docx']`, der Wizard unterdrückt DOCX aber,
   sobald die Form-Weiche auf «eigenhändig» steht (beabsichtigtes Form-Gate). Für den
   Nachbau: Das Feld `output` im Katalog beschreibt, was **überhaupt** möglich ist —
   die tatsächliche Verfügbarkeit hängt von der im Wizard gewählten Weiche ab.
   *Quelle: `src/pages/VorlageVorsorgeauftrag.tsx`.*

7. **N7 · Kein Rechner hat einen «Zurücksetzen»-Knopf.** In keiner der 27
   Formulardateien wurde ein Reset gefunden. Der einzige Weg zu den Vorgabewerten ist
   ein Beispiel aus den Beispiel-Chips, ein neuer Permalink oder ein Seiten-Neuladen.
   Ob das eine bewusste Leitentscheidung oder eine Lücke ist, ist im Code **nicht
   dokumentiert**. (Die einzige dokumentierte «Zurücksetzen»-Stelle betrifft das
   Suchfeld auf `/rechner`, nicht einen einzelnen Rechner. Die **Vorlagen** haben
   dagegen einen Knopf «↺ Eingaben zurücksetzen» im Wizard-Kopf.)
   *Quelle: Grep über `src/components/forms/**`.*

8. **N8 · Die Funktionszeile trägt die Altnamen ihrer Vorgänger-Datei.** Die Datei
   `src/pages/gesetz-leser/parts/Funktionszeile.tsx` hiess bis zu einem Umbau
   `parts/BezuegeKopf.tsx`; der Kommentar dokumentiert das. Die CSS-Klassen `.lr7-bez*`
   und der Typ `BezugsMarke` **bleiben bewusst** — sie sind der Anker, an dem Stil und
   Tests hängen. Wer im neuen Design die Klassen umbenennt, muss Sonden und Tests
   mitziehen. *Quelle: `src/pages/gesetz-leser/parts/Funktionszeile.tsx`, Zeilen 3–12,
   73.*

9. **N9 · Der Feld-Baustein markiert optionale statt Pflichtfelder.** Das ist das
   umgekehrte Modell gegenüber der verbreiteten Sternchen-Konvention: optionale Felder
   tragen «· optional» hinter dem Label, Pflichtfelder tragen **kein** Zusatzzeichen.
   Konsequent umgesetzt, aber für Nutzerinnen erklärungsbedürftig — beim Neuentwurf
   bewusst entscheiden, nicht versehentlich umdrehen.
   *Quelle: `src/components/vorlagen/ui.tsx`.*

10. **N10 · Drei ähnlich klingende Status-Felder nebeneinander.** (a) Karten-`Status`
    (`entwurf` / `geprüft` / `geplant`) — der Bau-/Prüfstand eines Werkzeugs;
    (b) `verified` (true/false) — auf Ebene **einzelner Norm-Anker**, feiner granuliert;
    (c) **Form-Gate** (`fertig` / `abschrift` / `entwurf` / `gemischt`) — die
    Ausgabe-Art eines Vorlagen-Dokuments. Insbesondere der Wert `entwurf` bedeutet in
    (a) und (c) **verschiedene Dinge**. *Quelle: `src/lib/startseiteConfigTypen.ts`
    Zeilen 16, 43, 96.*

11. **N11 · `PROJEKTBESCHRIEB.md` §3/§4 ist gegenüber dem Code veraltet.** Der Stand
    dort ist 21.7.2026; die «Pult»-Neugestaltung der Startseite vom 6./7.9.2026
    (Wegfall der Hero-Suche, Bereichs-Reiter im Titelblatt, Marginalienspalte) ist
    nicht nachgeführt. **Reiner Doku-Drift, keine Code-Inkonsistenz** — wer das
    Dokument als Quelle heranzieht, baut die alte Startseite nach.
    *Quelle: `PROJEKTBESCHRIEB.md` §3/§4.*

12. **N12 · Drei Bausteine sind von der Startseite auf die Rubrik-Übersichten
    gewandert.** `Katalog.tsx`, `KatalogHinweis.tsx` und `ZweiachsigerEinstieg.tsx`
    werden seit der Neugestaltung vom 6./7.9.2026 **nicht mehr** auf `/` verwendet; sie
    laufen heute in `RechnerUebersicht.tsx` und `VorlagenUebersicht.tsx`.
    `ThemenEinstieg.tsx` läuft in einzelnen Rechnerseiten (Querverweis-Kacheln).
    Ebenso werden `oberkategorien.ts` und `rechtsbereichGruppen.ts` **von der
    Seitenleiste nicht mehr konsumiert** (sie zeigt seit einem Umbau Kernerlasse,
    Sachgebiete und Behörden direkt) — sie leben weiter in den Rechner- und
    Vorlagen-Übersichtsseiten. *Quelle: Grep über `src/pages/**`,
    `src/components/layout/Sidebar.tsx`.*

13. **N13 · Der Status «geprüft» ist aktuell nirgends vergeben.** Der Code-Kommentar
    an der Typdefinition sagt es; eine Messung über die Katalog-Module am 22.9.2026
    bestätigt **0 Einträge** mit `status: 'geprüft'` und **0 Einträge** mit
    `verified: true`. Das Status-Modell ist damit heute faktisch zweiwertig
    (entwurf / geplant). *Quelle: Grep über `src/lib/startseite*.ts`.*

14. **N14 · Die Ausgabe-Zeile der Gesetzes-Übersicht zählt die Staatsverträge doppelt.**
    Sie lautet «231 Bundeserlasse · 1'339 Kantonserlasse · 28 Staatsverträge im
    Volltext». Gemessen am Register (22.9.2026): 203 nicht-internationale
    Bund-Snapshots + 28 internationale Snapshots = 231. Die 28 sind also bereits in den
    231 enthalten. *Quelle: Messung an `public/normtext/register.json`.*

15. **N15 · Die Rechner-Übersicht nennt 23 Rechner, es gibt 20 Routen.** Der generierte
    Zähler zählt die Katalogkarten mit `href`; drei Karten-Paare bzw. -Tripel teilen
    sich eine Route über einen URL-Anker (`kuendigung-sperrfristen` und
    `lohnfortzahlung` → `/rechner/kuendigung`; `zustaendigkeit`,
    `schkg-zustaendigkeit` und `straf-zustaendigkeit` → `/rechner/zustaendigkeit`).
    Nutzerinnen sehen also 23 Einträge, die auf 20 Seiten führen.
    *Quelle: `src/data/startseiteZaehler.generated.ts`, `src/routesManifest.ts`.*

16. **N16 · Die Formulare Prozesskosten, Notariat/Grundbuch und Betreibungskosten haben
    einen zweiten, schlanken Modus.** Derselbe Formular-Code läuft als
    Startseiten-Schnellrechner in einer `minimal`-Variante, in der die Zusatzblöcke
    (Vergleich, Instanzenzug, Sicherheit, Grundpfand) fehlen. Wer eines dieser
    Formulare umbaut, verändert zwei Oberflächen. *Quelle:
    `src/components/forms/{ProzesskostenForm,NotariatGrundbuchForm,GebvKostenForm}.tsx`.*

17. **N17 · `SchweizKarte` und `VerfallUebersicht` gehören nicht zu den Rechnern.**
    Die Schweizkarte wird ausschliesslich in der Kantons-Auswahl des Gesetzesbereichs
    verwendet, die Verfall-Übersicht ausschliesslich auf der Methodik-Seite. Keine der
    20 Rechner-Seiten bindet sie ein. Ebenso sind der Sperrtage-Zähler und der
    Kündigungs-Zeitstrahl **ausschliesslich** im Kündigungs-Rechner verbaut — nirgends
    sonst. *Quelle: Grep über `src/pages/**`, `src/components/**`.*

18. **N18 · Die Live-Brücke im Tagerechner ist die komplexeste Interaktion im Bestand.**
    Mehrere Kommentare im Code sprechen von «Stomp-Löchern»; die genaue Reihenfolge,
    wann eine manuelle Eingabe im Voll-Formular die Live-Brücke endgültig «gewinnt»,
    ist aus den Kommentaren rekonstruiert, nicht aus einem Testlauf. Beim Nachbau ist
    das der Punkt, an dem eine Verhaltensabweichung am ehesten unbemerkt bleibt.
    *Quelle: `src/pages/RechnerTagerechner.tsx`,
    `src/components/forms/EinfacheFristForm.tsx`.*

---

## 8 Widersprüche zwischen den Rohabschnitten

| Nr | Widerspruch | Schiedsspruch |
|---|---|---|
| W1 | Zahl der Vorlagen-Routen: «25 feste Pfade» (Rahmen-Abschnitt) gegen «30 Routen» (Vorlagen-Abschnitt) | **30.** Gemessen an `src/routesManifest.ts` am 22.9.2026: 30 eindeutige `/vorlagen/<slug>`-Pfade. Der Wert 25 ist überholt. Siehe 1.1 |
| W2 | Zusammensetzung der 231 Bundeserlasse: «241 minus 10 international-mit-`ebene=bund`» gegen 37 international-Einträge | **203 + 28 = 231.** Gemessen an `public/normtext/register.json`: 37 international-Einträge, alle mit `ebene: bund`, davon 28 mit Volltext-Snapshot. Die 28 sind in den 231 enthalten. Siehe 2.1 und Nebenfund N14 |
| W3 | Zahl der Entscheide: «6'345 Einträge» (Rechtsprechungs-Abschnitt) gegen «5'093» (Startseiten-Zähler) | **Beide richtig, verschiedene Grössen.** 6'345 Register-Einträge gesamt; davon 5'093 mit eigenem Volltext (Nicht-Verweise) und 1'252 Verweis-Stubs, die beim Aufruf auf das Ziel-BGE umleiten. Siehe 3.1.1 und 3.3 |
| W4 | Zuordnung von `Katalog.tsx`, `KatalogHinweis.tsx`, `ZweiachsigerEinstieg.tsx`: Auftragsraster ordnet sie der Startseite zu, der Code zeigt sie in den Rubrik-Übersichten | **Rubrik-Übersichten.** Seit der Neugestaltung vom 6./7.9.2026 laufen sie in `RechnerUebersicht.tsx` und `VorlagenUebersicht.tsx`. Siehe Nebenfund N12 |
| W5 | Zuordnung von `SchweizKarte` und `VerfallUebersicht`: im Auftrag als mögliche Rechner-Bausteine genannt | **Nicht bei den Rechnern.** Schweizkarte nur in der Kantons-Auswahl (Gesetze), Verfall-Übersicht nur auf der Methodik-Seite. Siehe Nebenfund N17 |
| W6 | Zuordnung von `src/components/entstehung/` und `src/lib/entstehung/`: Auftrag nennt sie als Prüfpunkt bei den Vorlagen | **Gesetzes- und Urteilsdaten.** Sie rendern am Artikel eines Gesetzes-Lesers und berühren weder Vorlagen-Schemas noch Wizard-Rahmen. Siehe 5.6 |

---

## 9 Unklar / nicht verifiziert

Konsolidiert aus allen sechs Rohabschnitten, dedupliziert. **Hier muss der
Design-Agent nachfragen oder nachmessen, bevor er sich auf eine Aussage verlässt.**

### 9.1 Rahmen, Navigation, Suche

1. **Reiter- und Mappen-Mechanik im Detail.** Die vollständige Mechanik (genaue
   Datenstruktur, alle Rand- und Fehlerfälle beim Anheften, Umsortieren,
   Wiederherstellen) wurde über Kopfkommentare und gezielte Suchen erschlossen, nicht
   Zeile für Zeile gelesen. Das Interaktions-Verhalten in 1.3.2 ist auf Basis der
   Kommentare korrekt, aber **nicht jede Detail-Fallunterscheidung ist geprüft**.
   *(`src/lib/tabs.ts`, rund 1200 Zeilen; `src/lib/mappen.ts`.)*
2. **Online- bzw. Edge-Suche.** Nur Existenz und Position in der Trefferliste sind
   verifiziert, **nicht der Aufbau der Edge-Anfrage** selbst.
   *(`src/lib/suche/onlineVolltext.ts`.)*
3. **Inhalt der «kuratierten Einstiege»** im Leerzustand der Kopf-Suche: nur Existenz
   und Anbindung geprüft, der genaue Inhalt nicht gelesen.
   *(`src/components/suche/SucheLeerzustand.tsx`.)*
4. **Geteilte Ansicht / mehrere Fenster.** Als Rahmen-Feature dokumentiert (1.3), aber
   nicht vertieft: Details zum Ziehen zwischen Fenstern und zur Griff-Mechanik sind nur
   oberflächlich aus dem App-Rahmen erschlossen.
5. **Thema-, Vorlagen-Schriftbild- und Schriftskala-Speicher:** nur Kopfkommentare und
   Aufrufstellen gelesen, nicht der volle Code.
   *(`src/components/thema.ts`, `src/components/vorlagen/ausgabeStil.ts`,
   `src/components/layout/useSchriftskala.ts`.)*

### 9.2 Gesetze

6. **Sprachwechsel zwischen Sprachvarianten desselben Erlasses** (z. B. FR-130.11
   DE↔FR, VS-173.8 DE↔FR): **kein Code-Pfad gefunden**, der die beiden
   Registereinträge verknüpft oder im Leser einen Umschalter anzeigt — sie wirken wie
   zwei unabhängige Erlasse. Nicht abschliessend verifiziert (nur Mustersuche, kein
   vollständiger Codepfad-Audit).
7. **Rolle von `SchweizKarte.tsx`.** Die Datei ist bestätigt, aber nicht gelesen. Im
   Leser existiert eine «Landkarte»-Funktion (Treffer-Landkarte); **ob dieselbe
   Komponente dort oder nur in der Kantonsübersicht verwendet wird, ist nicht
   geklärt.**
8. **Build-Pfad von den Datenbank-Artefakten zu den JSON-Projektionen** unter
   `public/normtext/` wurde **nicht nachvollzogen** — nur als Architektur-Aussage
   übernommen.
9. **Download-Slot im Leser-Kopf.** Das Normtext-Reglement erwähnt ein Slot-Layout
   «Ansicht · Fussnoten · In neuem Reiter · Download», **die Zieldatei des
   Download-Slots wurde nicht gelesen.** Ein **Export einzelner Artikel** (PDF/DOCX)
   wurde nicht gefunden; ob ein Download-Knopf im Kopf auf das Erlass-PDF zeigt, ist
   ungeprüft.
10. **Lesezeichen über eine Sitzung hinaus.** Nur der «Weiterlesen»-Wiedereinstieg
    wurde gefunden — **kein dediziertes Lesezeichen-Feature** (Stern, Merkliste) im
    Gesetzes-Leser identifiziert; es könnte in einem nicht gelesenen Teil der
    Randnotiz-Module liegen.

### 9.3 Rechtsprechung und Materialien

11. **Deckungsseite unvollständig gelesen.** Nur bis Zeile 150 von 420. Die
    vollständige Spalten- und Sortierlogik der Erlass-Tabelle sowie der äussere Lade-
    und Fehlerzustand der Route sind **nicht im Detail geprüft**. Die in 3.6 genannten
    Ebenen-Zeilen sind nur die ersten drei im Quelltext; **ob weitere folgen, wurde
    nicht abschliessend gezählt.**
12. **Nicht einzeln gelesene Domänen-Module:** Bezüge, Sachverhalt, Abschnitte,
    Besetzung und Besetzungs-Verlinkung, ECLI-Bildung, Zitat-Extraktion sowie die
    entsprechenden Materialien-Module (Kanten-Shards, Botschaften, Vernehmlassungen,
    BS-Grossrat). Ihre Wirkung ist **nur indirekt** über die aufrufenden
    Oberflächen-Komponenten belegt. Für Genauigkeit zu Erwägungs-Segmentierung,
    ECLI-Bildung oder BS-Grossrat-Sonderregeln müssten diese Dateien gelesen werden.
13. **Gerichtszitat-Formatierer** (`src/lib/gerichtszitat.ts`,
    `src/components/forms/GerichtszitatForm.tsx`) wurde aus Sicht der
    Rechtsprechungs-Seiten nur namentlich geprüft. **Inzwischen geklärt:** er ist der
    Rechner `/rechner/gerichtszitat` (4.4.4).
14. **Norm-Index- und Bezüge-Artefakte** unter `public/rechtsprechung/` wurden nur über
    Existenz und Verzeichnisstruktur erfasst, **nicht inhaltlich verifiziert**.
15. **Feldstruktur der Verzahnungs-Unterordner** (ausser Artikel-Revisionen) und der
    Materialien-Unterordner Kanten, Curia, Synopse und Synopse-Entwurf wurde **nicht
    gelesen** — nur die Verzeichnisnamen sind belegt.
16. **Spiegelt die Materialien-Übersicht die Suche laufend in die URL zurück?** Das
    wurde **nicht am Hook-Code selbst** geprüft, sondern nur aus dem Verwendungsmuster
    geschlossen (Rechtsprechung ruft ihn mit Spiegelung auf, Materialien ohne
    Optionen). Die Vorgabe-Option des Hooks wurde nicht gegengelesen.

### 9.4 Rechner

17. **Aktenzeichen-Feld ohne PDF.** Das Feld ist an den PDF-Export gekoppelt und
    erscheint dort korrekt zusammen mit dem PDF-Knopf. Ob es bei Rechnern ganz ohne
    PDF konsequent fehlt, wurde nur für den Zitierer bestätigt (dort fehlt es).
18. **Live-Brücke im Tagerechner** — siehe Nebenfund N18: das genaue Übernahme- und
    Abbruchverhalten ist aus Kommentaren rekonstruiert, **nicht aus einem Testlauf**.
19. **Reset-Entscheidung.** Ob das Fehlen eines «Zurücksetzen»-Knopfs bei den Rechnern
    eine bewusste Leitentscheidung oder eine Lücke ist, ist **im Code nicht
    dokumentiert** (Nebenfund N7).

### 9.5 Vorlagen

20. **Feldlisten der grossen Schemas nicht Zeile für Zeile gelesen.** Die Eingaben von
    Arbeitsvertrag, Mietvertrag, Vorsorgeauftrag, Testament, Vollmacht und den
    Gründungsmappen wurden über Suchen nach Feld-Labels rekonstruiert, nicht über einen
    vollständigen Read der 300–600-Zeilen-Dateien. **Einzelne bedingt sichtbare
    Unterfelder können in der Aufzählung fehlen** — insbesondere im
    Krankentaggeld-Block des Arbeitsvertrags und in den Statuten-Klauseln-Details der
    Gründungsmappen. Für einen verhaltensgleichen Nachbau ist ein Abgleich gegen die
    Quelldateien nötig, nicht nur dieses Inventar.
21. **Geplante Vorlagen haben keinen Schema-Code.** Tabelle 5.1.2 zeigt nur den
    Katalog-Zustand; **es existiert keine Oberfläche dafür.**
22. **Zusammensetzung der Verträge-Rubriken bei Wachstum.** Die Klappschwelle («ab mehr
    als 6 Karten je Rubrik») wurde nur am Code-Pfad geprüft, **nicht per Browser-Test
    nachgemessen**.

### 9.6 Bausteine und Konventionen

23. **Offline-Zustand.** **Kein dedizierter «Sie sind offline»-Indikator und kein
    Service-Worker-Hinweis gefunden.** Möglich, dass die App keinen eigenen
    Offline-Modus anbietet — **nicht abschliessend verifiziert**, weil keine gezielte
    Volltextsuche danach durchgeführt wurde.
24. **Ja/Nein-Feldtyp.** **Kein eigens benannter Baustein gefunden**; das wird
    vermutlich über Auswahlkacheln (zwei Kacheln), ein Ankreuzfeld oder Reiter im
    gedrückten Modus je Formular gelöst — ohne vollständige Suche über alle 27
    Formulardateien **nicht abschliessend verifizierbar**.
25. **Teilen-Baustein.** Der Teilen-Knopf wurde aus Sicht des Bausteine-Abschnitts nur
    indirekt (über einen Kommentar) erfasst. **Inzwischen geklärt** über den
    Rechner-Abschnitt: `src/components/LinkTeilenButton.tsx`, Verhalten in 1.7 und
    4.3.1 beschrieben.
26. **Kantons-Wappen-Komponente** wird von mehreren Bausteinen referenziert, aber im
    Rahmen der Bausteine-Recherche nicht selbst geöffnet.
27. **Export-Bausteine aus Sicht des Bausteine-Abschnitts** (PDF, DOCX, ICS) wurden
    dort nicht geöffnet. **Inzwischen geklärt** über die Rechner- und Vorlagen-
    Abschnitte: 4.3.1 und 5.3.7.

---

*Ende des Inventars. Bei Widersprüchen zwischen diesem Dokument und dem Code gewinnt
der Code — die Abschnitte «Quelle» nennen dafür die Fundstellen.*
