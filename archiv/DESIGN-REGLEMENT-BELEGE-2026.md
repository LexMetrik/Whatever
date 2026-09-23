# Design-Reglement — datierte Belege und aufgehobener Wortlaut (2026)

Ausgelagert bei der Konsolidierung der fünf `DESIGN-REGLEMENT*.md` zu einem
(23.9.2026, `W2·29-WERKBANK-TOKENS`, Rats-Auflage 2). Jeder Block steht
**wörtlich**, mit Herkunfts-Zeile (Datei, Zeilen, Stand `main@dc93425d9`). Belege
altern nicht (Dispatch-§0 Ziff. 2b) — sie werden hier ergänzt, nie nachgeführt.
Die geltenden Regeln stehen in `DESIGN-REGLEMENT.md`; interne Verweise in den
Blöcken (§4b-B, F2b, «Tabelle oben» …) lösen im Stand der Ursprungsdatei auf.

## Dach · F0.1 Wert-Tabelle (D12, 6.9.2026)

> Herkunft: `DESIGN-REGLEMENT.md` Z. 206–215, Stand `main@dc93425d9`, wörtlich.

| Rolle | hell | dunkel |
|---|---|---|
| `--paper` (Blatt) | `#FAF7F2` | `#1B1917` |
| `--paper-raised` (schwebende Ebene) | `#FFFFFF` | `#282521` |
| `--surface` (Karten/Panels) | `#FCFAF6` | `#201E1B` |
| `--well`/`--paper-sunken` (Feld) | `#F3F0EA` | `#131211` |
| `--ink-900` (Fliesstext-Tinte) | `#25231F` | `#E2E0DC` |
| `--ink-600` (Sekundär) | `#5C564A` | `#A59E90` |
| `--rule` (2-px-Kante) | `= --ink-900` | `= --ink-900` |
| `--rule-soft` (1-px-Zeilentrenner) | `#DDDAD4` | `#35332F` |

## Dach · F0.2 «Vier Registerfarben, sonst keine Farbe» (Fassung 6.9.2026)

> Herkunft: `DESIGN-REGLEMENT.md` Z. 223–239, Stand `main@dc93425d9`, wörtlich.

**F0.2 — Vier Registerfarben, sonst keine Farbe.** Je ein stumpfer Ton pro
Register der Sammlung, als **Strich, Reiter-Unterkante und Randmarke** — nie als
Fläche unter Fliesstext, nie allein bedeutungstragend (F2/B3):

| Register | Token | hell | dunkel |
|---|---|---|---|
| Gesetze | `--reg-g` | `#1D4E89` | `#8FB8F0` |
| Rechtsprechung | `--reg-r` | `#7A1F2B` | `#E39AA6` |
| Materialien | `--reg-m` | `#2F7A3E` | `#9AD489` |
| Werkzeuge | `--reg-w` | `#8F5E0E` | `#E6B95A` |

Alle sechzehn Register-Paare (vier Töne × vier Flächen) halten ≥ 4.5:1 in beiden
Modi und sind sämtlich Pflichtpaare im Tor (Messreihe: `KONTRAST-R1.md` D12.4).
*Abweichung vom Fahrplan, datiert vermerkt (6.9.2026):* `FAHRPLAN-DESIGN-
IDENTITAET.md` §5 nennt `#1F3A5F` · `#7A1F2B` · `#4E6B3A` · `#8A6A1F`; gebaut sind
die oben stehenden Werte — Davids Nachtrag 6.9.2026 «Registerfarben eine Stufe
kräftiger, Rot dezent» ging der Prosa vor (lebendige Spec, David 15.8.2026).

## Dach · F5 — aufgehobener Zusatz (6.9.2026)

> Herkunft: `DESIGN-REGLEMENT.md` Z. 361–369, Stand `main@dc93425d9`, wörtlich.

**F5 — Zwei Typografie-Register.** «Produktiv» (kompakt, Sans = **Archivo**) für
Rechner/Generatoren/Tabellen/UI; «Lese» (**Literata**, ruhige Lesespalte) für
Gesetzes-/Rechtsprechungs-Volltext **und die getragenen Titel** (Begrüssung,
Randtitel, H1 der Leser-Köpfe). Beide aus der einen verdichteten Skala (Block B2).
*AUFGEHOBEN 6.9.2026 (W2·24-DESIGN-IDENTITAET R1/R3):* der frühere Satz
«expressive Lesestile gehören NICHT in die Produkt-UI» und die Familien Geist /
Geist Mono / Source Serif 4. Die Sammlung setzt Literata bewusst auch ausserhalb
des Volltexts — als Titel- und Begrüssungsstimme, nie als Bedienschrift.
Massgeblich ist F0.4.

## Dach · F2b Ziff. 2 Referenzwerte (Fassung bis 23.9.2026)

> Herkunft: `DESIGN-REGLEMENT.md` Z. 449–471, Stand `main@dc93425d9`, wörtlich.

2. **Referenzwerte (harter FAIL bei Drift > ±0.06 — C-1/C-2/C-3, §4b-B):**
   dokumentierte Zahlen dürfen nie stillschweigend falsch werden (D3/F6). Bei
   Verschiebung neu messen und HIER + in `DESIGN-REGLEMENT-NORMTEXT §4b-B`
   nachziehen:

   | Rolle | Tick/Text auf `--well` | hell | dunkel |
   |---|---|---|---|
   | C-1 `lc-chip-entscheid` | slate-500 | 4.86 | 3.38 |
   | C-2 Currency-Chip warn | warn-700 | 5.30 | 9.20 |
   | C-3 Akzent-Tick (= Tinte) | brass-700 | 13.79 | 14.19 |

   **Nachgezogen 6.9.2026 (W2·24 R1 + D12).** Die Zahlen stammen aus dem Tor-Lauf
   (`npm run check:farbwelt`, dokumentiert in `scripts/farbwelt-tabellen.ts`
   `REFERENZ`), nicht aus einer Schätzung — dort steht auch die Herkunftskette je
   Zeile. Herkunft, die weiter gilt (§2b, Belege altern nicht): C-1 D-5 5.03/3.47 →
   R1 4.86/3.47 → D12 4.86/3.38 · C-2 D-5 5.48/9.43 → R1 5.29/9.49 → D12 5.30/9.20 ·
   C-3 D-5 5.13/10.48 (damals Messing) → R1 16.02/16.49 → D12 13.79/14.19. Der
   Sprung bei C-3 ist keine Drift, sondern der Rollenwechsel: **brass-700 IST seit
   R1 die Tinte** (F0.3).

   Fixpunkte `--paper` (deklariert versetzt, nicht entkernt): hell `#FAF7F2`
   (D12; R1 `#FBFBFB`, davor A38 `#FCFAF6`, davor `#FAF8F2`) / dunkel `#1B1917`
   (D12; R1 `#151515`, davor `#16150F`).

## Dach · F2b-Nachträge D-3, D-4, D-5, QS-UI 8a

> Herkunft: `DESIGN-REGLEMENT.md` Z. 491–626, Stand `main@dc93425d9`, wörtlich.

**F2b-Nachtrag D-3 (12.7.2026) — color-mix `in srgb` → `in oklab` (Befund 36,
FAHRPLAN-DESIGN-WAERME D-3).** Alle 19 `color-mix`-Rezepte in `src/index.css`
interpolieren in **oklab** (srgb frisst bei 10–18 %-Tönungen Farbigkeit —
Status-Flächen wurden grauer/kälter als das Rezept verspricht). Neu gemessen
(deterministisch, culori, hell+dunkel):

- **Referenzwerte C-1/C-2/C-3 (Tabelle oben): UNVERÄNDERT** — alle drei Paare
  sind Voll-Token auf dem soliden `--well`, kein color-mix im Pfad
  (vorher = nachher: 4.81/3.47 · 5.24/9.43 · 4.91/10.48).
- **Mixe mit `transparent` (15 der 19 Stellen — Haarlinien `--line`/
  `--line-strong`/`--rule-*` (und das am 16.8.2026 entfernte
  `--guide-gliederung`), `lc-glass`, Badge-Outlines,
  Schraffur, brass-Unterstreichung): gerendert BYTE-IDENTISCH** — bei
  premultiplied alpha trägt der transparente Endpunkt kein Farbgewicht, die
  Interpolation ist raumunabhängig.
- **Sichtbar verschieben sich NUR die vier `-bg`-Flächen** (wärmer/chromatischer,
  Text = `-700` bleibt überall ≥ 5.1:1):

  | Rezept | hell alt→neu | K(-700) alt→neu | dunkel alt→neu | K(-700) alt→neu |
  |---|---|---|---|---|
  | `--sage-bg` | `#EBEBE3`→`#EAEBE2` | 5.81→5.77 | `#23271C`→`#22251B` | 8.25→8.44 |
  | `--slate-bg` | `#EAEAE5`→`#E9E9E5` | 6.58→6.52 | `#222421`→`#21231F` | 7.63→7.77 |
  | `--warn-bg` | `#F4EBDC`→`#F5EBDE` | 5.11→5.12 | `#352711`→`#312515` | 7.12→7.32 |
  | `--danger-bg` | `#F0E5DF`→`#F2E5DD` | 7.55→7.54 | `#2E1D15`→`#2C1D15` | 6.67→6.68 |

  `lc-badge-entwurf`-Text (warn-700 auf transparenter Fläche): 5.87/5.67 hell ·
  8.47/9.00 dunkel (surface/paper) — unberührt vom Raumwechsel.
  Alle 46 farbwelt-Pflichtpaare bleiben ≥ Schwellen; kein Guard musste bewegt
  werden. Neue Rezepte schreiben `color-mix(in oklab, …)`; `in srgb` ist für
  Farb-Rezepte nicht mehr zulässig (Ausnahme: keine bekannt).

**F2b-Nachtrag D-4 (13.7.2026) — Ink-Wärme: EINE Hue-Normalisierung der Grau-Achse
(FAHRPLAN-DESIGN-WAERME D-4, Befunde 3+34).** Die ink-Rampe (900…300) + `--placeholder`
sind in beiden Modi (16 Werte) in OKLCH auf **EINEN Ziel-Hue 88°** (brass-verwandt,
Radix «saturated gray closest to accent») normalisiert; hell lag die Achse zuvor bei
~107° (grün-gelb), dunkel bei 84–90° gestreut. **L gehalten** (WCAG-Näherung, alle
Werte deterministisch mit culori gemessen), Chroma als flache Glocke (C≈0.008 an den
Enden, ~0.012–0.015 in den Mitten 600–400). Hue-Drift/L-Monotonie sind für `ink` jetzt
**harter FAIL** im Tor (Span 1.3° hell / 1.2° dunkel). Einzige bewusste L-Abweichung:
`ink-500` hell −0.007 L, damit `ink-500/well` die 4.5:1 erreicht (Riss geheilt).

- **Kontraste (culori, hell/dunkel, ≥-Schwelle-Text 4.5:1 = Pflicht):**

  | Rolle | hell alt→neu (paper·surface·well) | dunkel alt→neu (paper·surface·well) |
  |---|---|---|
  | ink-600 (Sekundär) | 7.20·7.44·6.65 → **7.22·7.47·6.67** | 8.27·7.79·8.67 → **8.26·7.78·8.66** |
  | ink-500 (Tertiär) | 4.85·5.01·**4.48** → **5.00·5.17·4.62** | 5.52·5.20·5.79 → **5.52·5.20·5.79** |
  | `--placeholder` | 5.14·5.32·**4.75** → **5.15·5.33·4.76** | 4.98·4.69·5.22 → **4.97·4.68·5.21** |

  ink-500/well hell überschreitet neu 4.5:1 (**4.62**, vorher 4.48 = Riss) → als
  WCAG-Pflichtpaar geführt; `--placeholder`/well bleibt ≥4.5:1 (4.76 hell / 5.21
  dunkel). ink-400/ink-300 sind Haarlinien-/Deko-Töne (kein 3:1-Textanspruch, §4b).
  Haarlinien (`--line`/`--rule-*`) erben die Wärme automatisch über die
  color-mix-Rezepte auf `var(--ink-900)`. `--ink-fixed-dark` (Solitär, speist hell
  ink-900 UND `--auf-gold`) wanderte mit EINEM Wert `#1A1A17`→`#1C1A15`; `--auf-gold`
  auf `brass-300` bleibt 10.71:1.

**F2b-Nachtrag D-5 (16.7.2026) — Flächen-Wärme: Papier-Treppe HELLER + WEISSER
(FAHRPLAN-DESIGN-WAERME D-5, Befunde 2+35) mit DAVID-DIREKTIVE A38.** A38 (wörtlich
«ausserdem mache die ganze lexmetrik webseite heller uns weisser»,
`docs/ux-audit-2026-07/ANMERKUNGEN-DAVID-2026-07-16.md` Nachtrag) **übersteuert die
D-5-Spec-Zielwerte**: die Papier-Treppe wird mit hellerer, weisserer Basis gebaut.
Die Treppen-MECHANIK der Spec bleibt (gestufte Flächen-Rollen, EINE Papier-Achse
Hue ~90° = brass-/ink-konsistent wie D-4, L strikt steigend `well<paper<surface<raised`,
Flexoki-Nuance tiefere Fläche = eine Spur mehr Chroma); **geändert** sind nur die
Zielwerte: Chroma site-weit ~30 % gesenkt (Wärme bleibt feine NUANCE, keine sichtbar
getönte Fläche mehr), L angehoben. **Nur `:root` (HELL) — DUNKEL bleibt unberührt**
(A38 betrifft die helle Fläche; D-6 kommt separat). Alle Werte deterministisch in
OKLCH entworfen + mit culori gemessen (F2):

- **Flächen-Token (hell):**

  | Token | alt → neu | L alt→neu | C alt→neu |
  |---|---|---|---|
  | `--paper` | `#FAF8F2`→`#FCFAF6` | 0.979→0.986 | 0.0082→0.0057 |
  | `--paper-raised` | `#FEFDFA`→`#FFFEFC` | 0.994→0.997 | 0.0041→0.0028 |
  | `--paper-sunken`/`--well` | `#F2EFE6`→`#F6F4EE` | 0.952→0.967 | 0.0124→0.0082 |
  | `--surface` | `#FDFCF7`→`#FEFCFA` | 0.991→0.992 | 0.0067→0.0034 |

  `--paper-raised` ist nun nahezu weiss, aber **nicht `#FFFFFF`** (Reinweiss-
  Invariante d). Hue-Ausreisser von `--surface` (97°) auf die Papier-Achse angeglichen.
- **Kontrast-Effekt = sichere Richtung:** hellere Hintergründe HEBEN jeden
  Dunkeltext-Kontrast — alle Hell-Pflichtpaare steigen, kein AA-Riss. Gemessen (culori,
  fg auf neuem Grund): ink-500 well/paper/surface **4.83·5.10·5.19** (vorher
  4.62·5.00·5.17) · `--placeholder`/well **4.98** (4.76) · ink-600/well **6.98** (6.67).
  Referenzwerte C-1/C-2/C-3 hell (Tabelle oben) 4.81→**5.03** · 5.24→**5.48** ·
  4.91→**5.13** (dunkel unverändert). Status-Badge-Text auf `-bg` (sage/slate/warn/
  danger-700) steigt ebenfalls (hellere `paper`-Basis der `-bg`-Mixe).
- **Tor `check:farbwelt`:** Fixpunkt-Hell auf `#FCFAF6` + Referenz-Hell-Werte
  deklariert nachgezogen (scharf, nicht entkernt); 48 WCAG-Pflichtpaare hell+dunkel
  grün, Flächen-L-Leiter beide Modi grün. golden byte-gleich (reine CSS-Token). Die
  8 beratenden Warnungen (brass-Chroma, danger-Riss) sind Bestand, unverändert.

**F2b-Nachtrag QS-UI 8a (4.8.2026) — Abdeckung statt neuer Schwellen
(`FAHRPLAN-UI-QUALITAET.md` §4, Verschärfung Stufe 1).** Keine Schwelle und
keine Regel ändert sich; geändert hat sich, **wie viel** von der Oberfläche F2
überhaupt misst. Das Audit fand drei Lücken, die alle drei einen Verstoss stumm
hätten passieren lassen — die Pflichtpaare wachsen darum von 48 auf 72
(hell+dunkel):

1. **`ink-900` war in keinem Pflichtpaar.** Der tragende Fliesstext-Ton der
   ganzen App war ungeprüft (nur die Sekundär-/Tertiär-Tiers ink-600/500 waren
   es). Neu gegatet auf allen vier Flächen: paper 16.68·14.80 · surface
   16.99·13.94 · well 15.81·15.52 · paper-raised 17.25·13.50 (hell·dunkel).
2. **Die Flächen-Rolle `--paper-raised` war ungeprüft.** Das Tor kannte nur
   paper/surface/well, obwohl `bg-paper-raised` an 283 Stellen steht — Popover,
   Dialog, Drawer, Menü, also die Fläche, auf der die Navigation stattfindet.
   Neu gegatet: ink-600 7.61·7.53 · ink-500 5.27·5.04 · brass-700 5.60·9.11 ·
   `--focus`-Ring 5.60·5.98.
3. **Status-Kanten wurden auf `surface` gemessen statt auf ihrer eigenen
   Tönungsfläche.** `.lc-notice-warn`/`-danger` zeichnen ihre Kante auf
   `--warn-bg`/`--danger-bg` — der strengere Grund. Neu gegatet:
   warn-line/warn-bg 3.26·3.95 · danger-line/danger-bg 5.54·6.69 ·
   sage-line/sage-bg 4.02·8.44 · slate-line/slate-bg 4.63·7.77.

Möglich wurde Punkt 3 erst durch **`QS-UI-WARNLINE`** (§11 desselben Fahrplans):
`--warn-line` lag mit 3.008:1 nur 0.008 über der 3:1-Schwelle für Nicht-Text
(WCAG 2.2 SC 1.4.11) — ein Tor auf dieser Messerschneide wäre bei der nächsten
Token-Rundung gekippt. Der Token ist deshalb als **einziger** Linien-Ton von
seiner `-500`-Mitte entkoppelt und um OKLCH **L −0.020** abgedunkelt
(`#C07A1A`→`#B9740D`, Hue/Chroma gehalten); `--warn-500` selbst bleibt
unverändert, weil es `--warn-bg`/`--warn-solid` speist. Sichtbare Wirkung: die
3-px-Kante des Warn-Hinweises wird eine Spur tiefer — eine deklarierte,
flip-reversible Darstellungsänderung.

**Bewusst NICHT aufgenommen** (§8 — die Lücke steht sichtbar statt still):
`placeholder/paper-raised` dunkel 4.53 gegen die 4.5-Schwelle (derselbe
Messer-Rand, und der Platzhalter lebt ohnehin auf `--well`), sowie
`brass-line/paper` hell 2.98 — für das Paar fand das Audit keinen Konsumenten
(`.lc-notice`/`.lc-akzent-brass` zeichnen auf `--surface`), ein Riss-Eintrag
ohne belegten Call-Site wäre ein erfundener Befund (§7).

**Abdeckung von `axe` analog:** dunkel liefen bisher drei Prüfpunkte, hell
dreizehn. Alle Hauptrouten laufen jetzt in **beiden** Modi (`e2e/a11y.e2e.ts`,
Block «Dunkelmodus flächendeckend»). Belegt an einer injizierten
Dunkel-Regression: 3 neue Dunkel-Prüfpunkte rot, ihre 7 Hell-Zwillinge grün.

## Dach · G a und G c (aufgehoben 6.9.2026)

> Herkunft: `DESIGN-REGLEMENT.md` Z. 648–667, Stand `main@dc93425d9`, wörtlich.

**a — AUFGEHOBEN 6.9.2026 (W2·24-DESIGN-IDENTITAET R1)** · früher «Brass ist
Signal, nicht Tapete». Es gibt keine Messing-Fläche mehr, die man sparsam
einsetzen könnte — die Skala ist neutral (F0.3). *Der Wortlaut für Alt-Verweise:
grosse Messing-Flächen blieben dem semantisch Massgeblichen vorbehalten
(Marke/Wortlaut-Referenz, §4b-B).* **Der Squint-Test bleibt als Ritual gültig**,
nur mit neuem Gegenstand: kneift man die Augen zu, darf allein die
**Registerfarbe** leuchten, und nur dort, wo sie ein Register benennt (F0.2).

**b — Ton vor Schatten.** Erhebung primär über Flächenton (`--paper`→`--surface`
→`--paper-raised`) + 1px `--line`; Schatten ist **sekundär**, erst ab
«schwebend» (Dropdown/Popover/Modal). Kein Schatten-Verbot (das `lc-card`-
Doppelsignal bleibt), aber die Regel: **Tiefe = Stufe + Border, nie Schatten
allein.**

**c — AUFGEHOBEN 6.9.2026 (W2·24-DESIGN-IDENTITAET R1)** · früher
«Temperatur-Dramaturgie» (warm empfangen auf Startseite/Rubriken, neutral-kühl
prüfen bei Entscheid/Rechner/Fristen; gravierte Brass-Linie und Regeste-Box als
Motiv-Rhythmus). Die Sammlung kennt **eine** Fläche über die ganze Seite; sie
wechselt ihre Temperatur nicht nach Route. Die verbliebene Wärme ist eine
Lesekomfort-Tönung des Papiers (D12, F0.1), keine Dramaturgie.

## Dach · G e-Zusatz 29.8.2026 (gegenstandslos seit 6.9.2026)

> Herkunft: `DESIGN-REGLEMENT.md` Z. 693–718, Stand `main@dc93425d9`, wörtlich.

*Zusatz 29.8.2026 — GEGENSTANDSLOS seit 6.9.2026 (W2·24-DESIGN-IDENTITAET R1).*
`.lc-overline` setzt seither `var(--font-sans)` (Archivo) und `text-transform:
none`; es gibt kein Mono-Etikett und keinen Versal-Etikett mehr, also auch keinen
Konflikt mehr aufzulösen (F0.4/F0.7). Die Abgrenzung «Etikett wird gescannt, Satz
wird gelesen» bleibt als **Denkfigur** brauchbar, sie trägt nur keine Schriftwahl
mehr. Wortlaut für Alt-Verweise:

*Zusatz 29.8.2026 (Entscheid David, Antwort 3 «Regel»; Review-Befund T6).* Der
Design-Qualitäts-Pass fand, dass Mono nicht nur Zahlen trägt: `.lc-overline`
setzt `font-mono` und erscheint 260× im Code (gemessen 29.8.2026, grep über src/) — mit **Wörtern** darin
(«RECHTSSAMMLUNG SCHWEIZ», «GLIEDERUNG», «ERFASSUNGSGRAD»). Formal ein Verstoss
gegen «Mono nur Zahlen/Aktenzeichen». Zur Wahl standen: die ~600 Vorkommen
umstellen oder die Regel schärfen. **David hat die Regel gewählt.** Sie lautet
daher jetzt:

> Mono trägt **Zahlen, Aktenzeichen und kleine STRUKTUR-ETIKETTEN**
> (`.lc-overline`, Chip-Labels) — also Wörter, die eine Fläche *beschriften*,
> nicht Wörter, die man *liest*.

Die Grenze ist nicht die Wortart, sondern die Funktion: ein Etikett benennt eine
Region (Overline über einer Sektion, Label an einem Chip) und wird gescannt; ein
Satz wird gelesen und bleibt Sans bzw. — bei zitierfähigem Quelltext — Serif.
Fliesstext, Lead-Absätze, Bildunterschriften und Hilfetexte gehören **nie** in
die Mono-Stimme, auch nicht kurze. Beleg für die Abgrenzung am lebenden Objekt:
`SchweizKarte.tsx` trägt das Overline «Erfassungsgrad» in Mono, den Zusatz
«3 Erlasse · dünn» der Bildunterschrift dagegen bewusst nicht.

## Dach · Audit: Stand der Webseite gegen dieses Reglement (25.6. / 6.9. / 19.9.2026)

> Herkunft: `DESIGN-REGLEMENT.md` Z. 762–853, Stand `main@dc93425d9`, wörtlich.

## Audit: Stand der Webseite gegen dieses Reglement

Code-Audit 25.6.2026 (adversarial, read-only). Gesamtbild: **Die Webseite
erfüllt das Reglement schon weitgehend** — Token-Disziplin bei Farben/Abständen,
Lesespalte, Status-Familien, leeres-Formular-Muster, Icon-Set, Überblick→
Drilldown und ALL-CAPS sind sauber. Die Lücken sind eng umrissen: **Typografie-
Magic-Numbers in den Leser-Komponenten**, **fehlende maschinelle Erzwingung**
(E1) und **Stand/Link nicht an jedem Einzelwert** (D1).

**Nachtrag 25.6. (Umsetzung, Auftrag «1–5 machen»):** #1–#4 umgesetzt — Off-
Scale-Typo byte-identisch auf `--fs-*`-Tokens (B2/D2), `fontSize:'10px'`→
`text-micro` (#3), und die Token-Schranke `check:design-tokens` ist scharf
(E1, in `npm run check`/gate). #5 (D1) wurde verifiziert und ist **bereits
erfüllt** (typ-erzwungene `TarifQuelle`) — keine Änderung, da Erfinden von
Provenienz §7 verletzt hätte. B2/D2/E1 sind damit maschinell abgesichert.

| Regel | Status | Kern-Beleg | Befund |
|---|---|---|---|
| A1/A3 Sprache (UI) | n. i. Code prüfbar | — | Manuell/Stichprobe; siehe A2b |
| A2 kein ALL-CAPS-Block | ✅ erfüllt | `ui.tsx:395` (13× uppercase, alle Labels) | Nur Overlines/Badges in Versalien |
| A2b generierte Texte | 🟡 teilweise (Stichprobe) | `arbeitsvertrag.ts:245,287`; `handelsreisendenvertrag.ts` | Vereinzelt lange Schachtelsätze + Passiv; teils gesetzesnah gewollt |
| A4 kein Lesbarkeits-Score | ✅ erfüllt | (keine Score-Anzeige gefunden) | Wird nirgends als Gütesiegel gezeigt |
| B1 Verdikt zuerst | ✅ erfüllt | Rechner-Reglement R1 | Site-weit gelebt |
| B2 Typo-Skala | 🟡 teilweise | `GesetzLeser.tsx:144–233`; `EntscheidBody.tsx:16` | Skala überwiegend genutzt (`text-xs` gültig), aber Leser brechen sie: 22× `text-[…rem]` + 6× `text-sm/base` + 7× inline `fontSize` |
| B2b Lesespalte | ✅ erfüllt | 38× `max-w-reading` | Fliesstext in 40rem; einzige Ausnahme bewusst das 2-spaltige Normtext-Layout |
| B3 Status-Farben | ✅ erfüllt | `tailwind.config.js:22–26`, 0 Ad-hoc | Kein red/green/amber/Hex/rgb in tsx; Inline nur `var(--…)` |
| B3b Icon-System | ✅ erfüllt (kl. Mischung) | `src/components/Icon.tsx` | Eigen-Set, keine Fremdlib; nur UI-Chrome nutzt Unicode-Glyphen (✕/☰/▾) |
| C1 Überblick→Drilldown | ✅ erfüllt | `Startseite.tsx` + `src/components/start/*` | Cockpit → Detailseiten |
| C2 leeres Formular ohne Fehler | ✅ erfüllt | `ui.tsx:372` `BeruehrtRahmen`, `:392` `FehlerBox` | Fehler erst nach «berührt»; 15 Forms gewrappt |
| C3 Warum-Layer | ✅ erfüllt | Rechner-Reglement R | «Was gilt → warum» durchgängig |
| D1 Norm + Link + Stand | ✅ erfüllt (verifiziert 25.6.) | `prozesskosten.ts:98-103` `TarifQuelle` (stand/quelleUrl = Pflicht) | Tarif-/Rechenwerte tragen Quelle+Stand+Link **typ-erzwungen**; bare `norm`-Zitate sind NormLinks, die die Provenienz des verlinkten Erlasses erben (kein Duplikat nötig). Audit-Heuristik (51 vs 750) war by-design, kein echter Mangel. |
| D2 keine Magic-Numbers | 🟡 teilweise | `ErgebnisAnzeige.tsx:137` (`fontSize:'10px'`) | Farben/Abstände token-rein; Restmenge = die Typo-Magic-Numbers aus B2 |
| D3 Status-Marker ehrlich | ✅ erfüllt | `verified` 177× in `src/lib` | Recherche/geprüft sichtbar |
| E1 in Code erzwungen | 🟠 offen | `eslint.config.js` (nur §2-Determinismus) | KEINE Schranke gegen `text-sm`/Arbitrary-`text-[…]`/Ad-hoc-Farben — B2/D2 sind reine Disziplin |
| E2 CH-Evidenz-Vorbehalt | ✅ erfüllt | dieses Reglement | Explizit markiert |
| E3 Mehrsprachigkeit | n. i. Code prüfbar | — | Erst relevant bei DE/FR/IT-Ausbau |

### Offene Punkte (separate Freigabe — in diesem Durchgang NICHT umgesetzt)

1. **E1-Schranke bauen** — ESLint-Regel (`no-restricted-syntax` für
   className-Literale) + ggf. Gate-Test gegen `text-sm`/`text-lg`/
   `text-[…px|rem]`/Ad-hoc-Farben. Macht B2/D2 aus Disziplin zu Erzwingung;
   `eslint.config.js` hat das Muster (Determinismus-Block) schon.
2. **`GesetzLeser.tsx` auf Skala ziehen** — `:144,145,148,160,182,186,221,233`
   (`text-[1.3rem]…[0.6rem]`) + `text-sm` `:231,520,751`. Nutzerwählbare
   Lesegrösse (`--rsp-fs`) als Token/CSS-Var dokumentieren, freie Headings auf
   die Skala.
3. **`ErgebnisAnzeige.tsx:137`** — `fontSize:'10px'` liegt UNTER `micro` (11px);
   auf `text-micro` o. ä. heben.
4. **`EntscheidBody.tsx:16,48,112` + `EntscheidLeser.tsx:243,363`** — off-scale
   `text-[…rem]`; wenn nutzerwählbar, als CSS-Var dokumentieren statt frei.
5. ~~D1 Stand+Link nachziehen~~ — **verifiziert 25.6., bereits erfüllt, keine
   Änderung (§7).** Die Audit-Kandidaten prozesskosten/grundbuchgebuehren tragen
   `stand`+`quelleUrl` **typ-erzwungen** (`TarifQuelle`, nicht-optional →
   `prozesskosten.ts:98-103`, gerendert in `grundbuchgebuehren.ts:114-123`). Die
   Korpus-Metrik (norm 750× vs stand 51×) ist by-design: `norm`-Zitate sind
   NormLinks auf den in-app-Erlass (mit eigenem Stand), kein dupliziertes
   stand/url nötig. Provenienz zu erfinden wäre ein §7-Verstoss — daher bewusst
   keine Code-Änderung. (Ein echter D1-Sweep über ALLE Engines bliebe ein
   separater, verifiziert-zu-belegender Auftrag — nichts Fabrizierbares.)

> Reine Disziplin-Befunde (A2b) und domänenbedingte Ausnahmen (2-spaltiges
> Normtext-Layout, Druckbild-`em`-Grössen in `vorschauStil.ts`) sind bewusst
> KEINE Pflicht-Fixes, sondern dokumentierte, vertretbare Abweichungen.

### Nachtrag 6.9.2026 — Stand gegen die Handschrift «Sammlung» (W2·24)

Der Audit oben misst den Stand vom 25.6.2026 gegen das damalige Reglement; seine
Zeilen bleiben als Beleg für ihren Stand stehen (§2b). Was die Runden R1–R12 des
Schrittes `W2·24-DESIGN-IDENTITAET` gegen F0 verändert haben, in Kurzform — die
Belege liegen je Runde unter `abnahme/design-identitaet/` (Protokolle, Screens
hell+dunkel @1440/@390, Split-View), die Messreihen in `KONTRAST-R1.md`
(inkl. Nachtrag D12) und `PERF-LESER.md`:

| F0-Regel | Stand 6.9.2026 | Beleg |
|---|---|---|
| F0.1 Papier/Tinte | ✅ gebaut (`:root` + `html.dark`, ein Ort) | `check:farbwelt` grün, 146 WCAG-Pflichtpaare hell+dunkel |
| F0.2 Registerfarben | ✅ gebaut, alle 16 Paare ≥ 4.5:1 | `KONTRAST-R1.md` D12.4 |
| F0.3 Akzent = Tinte | 🟡 Werte gebaut, **Klassennamen `*-brass-*` stehen noch** (202 Konsumenten) | Fahrplan §6 (b); Umbenennung = eigener Sweep |
| F0.4 Literata/Archivo | ✅ gebaut, self-hosted, opsz geladen | `check:perf-budget` grün, entry 59.7 KB / 60.0 KB |
| F0.5 Radien 0 / ein Schatten | 🟡 Radien 0 gebaut; `rounded-full` (46 Fundstellen) bewusst offen | `--radius-*` = 0px in `index.css` |
| F0.6 Linien statt Flächen | ✅ gebaut (`--rule`/`--rule-soft` + Konsumenten) | `check:linien-kanon` |
| F0.7 Etiketten ohne Versalien | ✅ gebaut an der Klasse `.lc-overline` | `--tracking-overline: 0em` |
| F0.8 Links unterstrichen | ✅ Regel steht einmal, Wächter rot beweisbar | `e2e/leser-links-p3.e2e.ts` |
| F0.9 Menü-Anatomie | 🟠 offen: `.lc-schwebeflaeche` trägt noch `shadow-lg` | R11-Auflage R6/R7 |
| A6 Sprach-Diät | 🟡 Runde R7 «Beschriftungen» geplant, nicht abgeschlossen | BEFUNDE §R7 |

**Budget-Entscheid (§15, David 19.9.2026: «Kopfbereich budget heben»):** die
Erstlast stand bei **59.7 KB von 60.0 KB** (99.5 %); das Entry-Budget ist auf
**70 KB** gehoben (`scripts/check-perf-budget.ts`). Lazy-Laden weiterer Kopf-Teile
ist damit nicht mehr Pflicht, bleibt aber der bessere Weg, wo er ohne
Logikverlust geht.

## Normtext · §4b-A Gliederungslinie — AUFGEHOBEN (16.8.2026), ganzer Abschnitt

> Herkunft: `DESIGN-REGLEMENT-NORMTEXT.md` Z. 316–361, Stand `main@dc93425d9`, wörtlich.

### §4b-A · Gliederungslinie — AUFGEHOBEN (Rückbau V1, 16.8.2026)

**Es gibt im Lesetext keine vertikale Gliederungslinie mehr, und es soll auch
keine vierte geben.** Dieser Abschnitt regelte von Juli bis Mitte August 2026,
*wann* der Reader den Guide zeigt (Auto-Default aus Gliederungstiefe + Artikel-
Dichte, `linienProfil()`, `data-guide-auto`, K11-Tri-State-Schalter «Linien»).
Er ist mit dem Feature aufgehoben — der Wortlaut steht in
`archiv/FAHRPLAN-GESETZES-UX-erledigt.md` und in der Fassungs-Historie.

**Der datierte Anlass, damit niemand ihn versehentlich wiederholt (Chesterton).**
Die Linie wurde DREIMAL gebaut und DREIMAL von David live verworfen:

| Datum | Baustand | Davids Verdikt (wörtlich) |
|---|---|---|
| 5.7.2026 | G3a/K11 — Guide nur bei `grundart==='KODIFIKATION'` | A8: «Liniengliederungsdarstellung … regeln festlegen wie es wann angezeigt wird JE NACH AUFBAU GESETZ. zgb bspw. sehr viele aber arg fast keine aktuell.» |
| 12.7.2026 | L-3 (#207) — Auto-Guide AN für dichte Erlasse, inkl. ZGB/OR | A28: «das mit den linien funktioniert überhaupt nicht» / «also ist überhaupt nicht fördernd für die übersicht» |
| 3.8.2026 | PR #423 — L-3 reaktiviert | «eine einzige linie und unbrauchbar» |

**Warum keine vierte Justage hilft (der strukturelle Grund, nicht der ästhetische):**
der Reader konnte höchstens EINE Linie auf genau EINER Ebene zeigen
(`guideEbene = min(renderTiefe−1, 1)`). Bei ZGB (Tiefe 5) oder OR (Tiefe 4)
markiert dieser eine Strich zwangsläufig nur einen Bruchteil der Verschachtelung.
Ob er per Kategorie, per Dichte-Schwelle oder per Default AN/AUS gesteuert wird,
ändert an diesem Deckel nichts — **eine einzelne Linie kann «viele Ebenen»
strukturell nicht abbilden.** Genau daran scheiterten alle drei Anläufe.

**Was die Aufgabe stattdessen trägt:** im Fliesstext die Typo (§4b Rang 1; der
Einzug, den dieser Absatz bis zum 29.8.2026 als Rang 2 mitnannte, ist mit §4b-C
ebenfalls fort); für die Übersicht «wo bin ich in
der Struktur» die Seitenleiste mit Gliederungsbaum, Scroll-Spy und Sprungziel
(`W2·19-GLIEDERUNG`, live seit 13.8.2026) — ein dafür gebautes, mächtigeres
Werkzeug als eine Linie am Spaltenrand.

**Entscheid:** David, Chat 13.8.2026, wörtlich *«ja linien ganz entfernen. 2 es
reicht. 3 nein. 4. ok»* — Variante V1 (Rückbau); V2 (Typo-Nachrüstung) und V3
(scroll-gebundener Tiefen-Indikator) ausdrücklich verworfen. Bau-Spec und
Vollzugsvermerk: `fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md` §9.3.
Vorher/Nachher-Beweis: `docs/ux-audit-2026-07/reader/linien-rueckbau-2026-08-16/`.

**Maschinell gegated:** `check:linien-kanon` prüft nur noch die Linien-SPRACHE
(Teil A: zwei Rollen-Tokens, kein Ad-hoc `border-line` an markierten Containern);
das frühere Teil B (Aufbau-Regelwerk) wurde **gestrichen statt umgebaut**, weil
sein Gegenstand nicht mehr existiert und es nicht mehr rot werden könnte (§6.7).
Dass die Linie wegbleibt, hält `e2e/leser-ohne-gliederungslinie.e2e.ts` fest —
seit dem 29.8.2026 zusammen mit der Gegenprobe, dass auch der Einzug wegbleibt
und der Lesetext auf EINER Kante steht (§4b-C).

## Normtext · §4b-C Tiefen-Einzug — AUFGEHOBEN (29.8.2026), ganzer Abschnitt mit Messtabellen

> Herkunft: `DESIGN-REGLEMENT-NORMTEXT.md` Z. 363–447, Stand `main@dc93425d9`, wörtlich.

### §4b-C · Tiefen-Einzug — AUFGEHOBEN, EINE linke Textkante (Entscheid David 29.8.2026)

**Der Wortlaut steht auf EINER linken Kante — über alle Gliederungstiefen, alle
Erlasse, Desktop wie mobil.** Die Tiefe trägt allein die Zwischen-Überschrift.

**Entscheid David 29.8.2026, wörtlich:** *«wichtige änderung … im gesetz die
staffelung aufzuheben. es soll alles auf der selben höhe stehen. … analog zu
fedlex»*. Damit ist die Regel «Tiefe ausschliesslich über Einzug» (§4b Rang 2,
W2·5d G1 / V2·L-1) aufgehoben — ersetzt, nicht ergänzt.

**Was der Einzug tatsächlich tat** (gemessen 29.8.2026, alle gerenderten
`.max-w-normtext` je Erlass): weil die Gliederungs-`section`s INEINANDER
stecken, summierten sich die 20-px-Stufen (mobil 12 px).

| Erlass | Textkanten @1440 (vorher) | Textkörperbreiten | @390 |
|---|---|---|---|
| OR | **6** (554…654 px) | 540…640 px | 6 Kanten (20…80 px), 290…350 px |
| ZGB | 5 (574…654) | 540…620 | 5 |
| StGB | 4 | 540…620 | 4 |
| BS-640.100 | 4 | 560…620 | 4 |
| StPO | 3 | 600…640 | 3 |
| VMWG | 1 | 640 | 1 |

Der Effekt lief der Lesbarkeit zuwider: **je tiefer eine Bestimmung in der
Kodifikation steht, desto schmaler wurde sie gesetzt** — die dichtesten Stellen
des ZGB (Art. 105/125/208/416) bekamen die engste Spalte. Nach dem Rückbau hat
jeder Erlass **genau eine** Kante und eine Breite.

**Nicht betroffen — bewusst:**

- Die **Absatz-Rinne** (`pl-9 -indent-9`, hängende Absatznummern in
  `ArtikelBody`): amtliche Absatz-Auszeichnung, keine Gliederungstiefe.
- Die **Gliederungs-Seitenleiste** (`SektionBaumTOC`): dort ist die Einrückung
  ein Navigations-Baum, kein Fliesstext.
- Der **Hänge-Einzug-Schutz** mehrzeiliger Randtitel (§4b «Lese-Typografie»).

**Gebündelt entschieden (Variante 1C): Zeilenmass-Deckel ~70 Zeichen** (bis
W2·24-R6c 68).** Mit
einer Kante läuft jeder Erlass an denselben Pixel-Deckel, das Zeilenmass stieg
gemessen auf 69–74 Zeichen. Der Textkörper trägt darum einen zweiten, in
ZEICHEN rechnenden Deckel (`--leser-zeilenmass`, `src/index.css`); der
schmalere der beiden gewinnt. Die Zahl ist ch-basiert hergeleitet: 1 CSS-`ch`
misst in der Lese-Serife 0.5078 em, das mittlere Prosa-Zeichen 0.4805 em
(Schlechtfall der Stichprobe). Der Deckel hängt an `--lm-leser-schrift` und
**skaliert darum mit jeder Schriftstufe**.

**W2·24-R6c: 68 → 70.** D20 (c) gibt die Spanne **65–72 CPL** vor. Die Konstante
RECHNET, das Tor MISST — und misst systematisch tiefer, weil
`--leser-zeichenbreite` am Schlechtfall kalibriert ist. Mit 68 lag die gemessene
Untergrenze nach R6b bei 63 ch, also unter der Spanne (R6-NACHZUG §4). 70 hebt
die Rechengrösse, nicht die Messmethode.

Messreihe @1440 (Methode `e2e/leser-lesemass.e2e.ts`, Zeichen je Zeile des
längsten mehrzeiligen Absatzes):

| | OR | ZGB | StGB | StPO | VMWG | BS-640.100 |
|---|---|---|---|---|---|---|
| vorher (Staffelung) | 68 | 64 | 69 | 68 | 74 | 56 |
| eine Kante, ohne Deckel | 73 | 70 | 73 | 69 | 74 | 61 |
| Deckel 68, Schrift 17 px (bis R6c) | 67 | 66 | 66 | 64 | 63 | 56 |
| **Deckel 70, Schrift 18 px (Ist)** | **67** | **67** | **68** | **68** | **68** | **56** |

Die WCAG-Decke SC 1.4.8 (≤ 80 ch) bleibt mit ≥ 12 ch Reserve gehalten. @1280
misst dieselbe Reihe (Textkörper 641 statt 640 px). BS-640.100 liegt bei 56 ch,
obwohl seine Spalte gleich breit ist: die Methode rechnet `Textlänge /
Zeilenkästen`, und kantonale §-Absätze enden häufig mit einer halb gefüllten
Zeile — die Zahl beschreibt dort die Absatzform, nicht den Satzspiegel, und
trägt deshalb keine Untergrenze (§8).

Mobil @390 greift der Deckel nicht (641 px > Viewport); die Spalte bleibt bei
350 px. Mit 18 px stehen dort **ZGB 37 · OR 35 · VMWG 32 · StGB 41 · StPO 34 ·
BS-640.100 33 ch** — je nach Erlass 0–3 ch weniger als mit 17 px. Das ist keine
Verschlechterung, sondern der Preis der grösseren Type auf physikalisch
unveränderter Breite; der Mobil-Boden folgt der Messung (34 → 31 ch,
Schlechtfall VMWG 32 minus 1 ch Reserve).

**Maschinell gegated:** `e2e/leser-lesemass.e2e.ts` Block **T-1C** (sechs Erlasse
× zwei Fenster @1440 und @1280: genau eine Kante, eine Breite, **65–72 ch** —
BS-640.100 ohne Untergrenze, s. o. — plus die erwartete Textkörperbreite) und
der Mobil-Boden ≥ 31 ch; `e2e/leser-ohne-gliederungslinie.e2e.ts` Ziff. 3
(keine Sektion mit `padding-left` **und** die Wirkungs-Gegenprobe). Beide
Wächter wurden am 29.8.2026 je einmal rot gezeigt (§6.7; Rot-Beweis im Commit
`test(leser): Wächter der einen Textkante deklariert nachgeführt`).
Die Tokens `einzug` / `einzug-mobil` sind aus `tailwind.config.js` **entfernt**
(§17 «gestrichen statt bewacht» — sie hatten genau einen Verbraucher).

## Rechner · R1 Seiten-Skelett (Juni-Wortlaut)

> Herkunft: `DESIGN-REGLEMENT-RECHNER.md` Z. 18–33, Stand `main@dc93425d9`, wörtlich.

## R1 · Seiten-Skelett (Reihenfolge fix)

```
1. RechnerKopf            (h1, Kategorie, Norm-Chips — immer)
2. TagerechnerRueckverweis (nur nach R2)
3. Werkzeug-Karte          (bg-surface-raised rounded-2xl border p-6 sm:p-8)
   └── genau EIN Formular (bzw. Tab-Weiche über Teil-Formulare)
4. EreignisFristenSektion  (nur nach R9)
5. Themen-Einstieg         (Vorlagen-Direktlinks, nur nach R10)
```

Keine weiteren freien Blöcke auf Seitenebene. Seiten-Sonderfälle:
Tagerechner (Schnellrechner + Preset-Suche + Regime-Tabs, FE-1/FE-2)
und Zuständigkeit (Rechtsweg-Tabs mit Kopf-Override, S-3) sind
disponierte Ausnahmen — innerhalb ihrer Teil-Formulare gilt R3 ff.
unverändert.

## Rechner · Prüfung — was der §6.7-Rot-Beweis je Punkt zeigt (4.8.2026)

> Herkunft: `DESIGN-REGLEMENT-RECHNER.md` Z. 252–277, Stand `main@dc93425d9`, wörtlich.

Was der §6.7-Rot-Beweis für jeden Punkt **genau** zeigt — die Zusage ist
bewusst eng formuliert, weil ein zu weit gefasster Beweis dieselbe
Scheinsicherheit erzeugt wie ein Tor, das nicht scheitern kann:

- **R4 Ziff. 2:** rot mit der ErgebnisAnzeige unter dem `FristenKalender`
  (`/rechner/zpo-fristen`). Genau dieser Fall lief zuvor **grün trotz
  Verstoss** — das Tor erkannte Ansichten nur an `table, svg`, und
  Kalender, Zeitstrahlen und Balken sind reine Divs. Sie tragen darum
  jetzt `data-ansicht`; wer eine neue Ansicht baut, setzt es ebenfalls
  (§9-Bug-Check zu PR #440, B2).
- **R6 Ziff. 2:** Die Reglement-Schranke «eine Bildschirmhöhe» allein ist
  **nicht falsifizierbar** — gemessen liegt der Abstand bei 48–213 px
  gegen 800/844 px, Faktor 3.8. Rot gezeigt wird darum die daneben
  stehende, gemessene Regressions-Schranke (320 px): ein 400-px-Einschub
  zwischen Verdikt und Vorbehalte lässt die Reglement-Schranke
  unberührt und feuert nur diese. Zusätzlich weist das Tor jeden
  übersprungenen Fall aus — eine Fläche ohne Vorbehalte muss in seiner
  Ausnahmeliste stehen, sonst ist sie rot (§8: still verschwundene
  Warnungen sind der Fehler, gegen den die Regel steht).
- **B2:** rot ohne `max-w-reading` am `BegruendungAbsatz`.
- **Sprungmarke:** rot, sobald sie unsichtbar ist — und, nach
  Verschärfung auf Geometrie, auch dann, wenn sie zwar sichtbar ist,
  aber nicht in der Bildschirmecke sitzt. Diese Verschärfung deckte den
  `transform`/`position:fixed`-Defekt überhaupt erst auf.
- **Ausdruck:** rot mit der alten Druckregel `.lc-btn`, die die über
  `@apply` gebauten Varianten nie erfasste.

## Rechtsprechung · Evidenzlage (Recherche 23.6.2026)

> Herkunft: `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` Z. 22–82, Stand `main@dc93425d9`, wörtlich.

## Evidenzlage (worauf die Sollwerte fussen)

Recherche 23.6.2026, Primärquellen verifiziert. Zwei Befunde sind tragend:

1. **Die führenden Schweizer Anzeigen sind typografisch schwach.** bger.ch und
   entscheidsuche.ch (`/docs/`) rendern den amtlichen Rohtext in **Times, 16px,
   volle Fensterbreite, ohne Lesespalten-Begrenzung** — Zeilenlängen weit über
   dem lesbaren Mass. entscheidsuche.chs eigener Viewer (`/dok/`) nutzt Open
   Sans 16px/1.5; Weblaw/Lawsearch (frei über bvger.weblaw.ch) ist mit
   **Poppins 16px/1.75, ~545px Lesespalte, linksbündig** die mit Abstand
   beste Lesetypografie im CH-Feld. Schlussfolgerung: **eine bewusst gesetzte
   Lesespalte + ruhiger Body schlägt die amtlichen Anzeigen** — das ist der
   leicht erreichbare Vorsprung.
2. **Kein ECLI für Schweizer Gerichte.** ECLI ist ein EU-System; die Schweiz
   verwendet es amtlich nicht. Zitiert wird **BGE/ATF + Band + Teil (röm.) +
   Seite + E.** (`BGE 145 III 72 E. 2.3`), unpubliziert per Aktenzeichen
   (`BGer 6B_1293/2023 vom …`). **Nie eine ECLI:CH:BGER-Form erfinden.**
   (Quellen: corporate-law-club.ch, Wikipedia «Entscheidungen des
   Schweizerischen Bundesgerichts», Abwesenheit über bger.ch/entscheidsuche/
   Weblaw bestätigt.)

Lese-Typografie (Primärquellen, exakt verifiziert):
- **Lesespalte 50–75 Zeichen**, Ideal ~66 (Bringhurst via webtypography.net;
  Butterick 45–90; Baymard 50–75 / Ruder 50–60). WCAG 1.4.8 (AAA) kappt bei 80.
- **Body 16–20px** (Butterick 15–25px web).
- **Zeilenhöhe 1.5** — trifft den WCAG-1.4.12-Boden (line-height ≥ 1.5× ist
  Pflicht, damit Nutzer-Text-Overrides nicht brechen) und liegt am oberen Rand
  von Buttericks 120–145 %.
- **Absatzabstand ≥ 2× Schriftgrad** (WCAG 1.4.12).
- **Kontrast ≥ 4.5:1** (Body), ≥ 3:1 (grosse Schrift ≥ 24px / 18.5px bold);
  Werte NICHT runden (WCAG 1.4.3). **200 %-Zoom muss tragen** (WCAG 1.4.4).
- **Serif/Sans am HD-Bildschirm frei** — die alte Regel «Bildschirm = Sans» ist
  überholt (NN/g). Serif ist für langen Lesefluss legitim; Sans ist für
  Sehbehinderte minimal sicherer.
- **79 % scannen, ~20–28 % der Wörter werden gelesen; F-Muster** → linker
  Zeilenanfang + erste Zeilen bekommen die meiste Aufmerksamkeit (NN/g).

Randziffern/Marginalien:
- **Randnummern** sind die zitierfähige Einheit, am Rand «hervorgehoben»; sie
  sind seitenunabhängig stabiler als Seitenzahlen (Wikipedia «Randnummer»).
  Einschub-Konvention: Suffix-Buchstabe (`12a`) hält alte Zitate gültig.
- **Sidenotes/Marginalien sind am Web schneller zu erfassen** als
  Fuss-/Endnoten (gwern; Bringhurst). Tufte-CSS-Muster: Float am rechten Rand,
  **Kollaps bei ≤ 760px** zwingend (sonst verschwinden sie). Eine *kurze*
  Randziffer kollidiert nicht — der Float ist risikoarm, der Mobil-Fallback
  Pflicht.
- **`font-variant-numeric: tabular-nums`** richtet die Ziffernspalte aus (10,
  11 fluchten) — nicht eine Monospace-Klasse auf den ganzen Block (bräche den
  Fliesstext). Produktionsfont auf `tnum` prüfen.

Referenz-Anzeigen (DE/Intl): **BVerfG** = sauberstes amtliches Modell (Serif,
Leitsätze als Top-Block, durchlaufende Randnummern als Zitiereinheit, TOC
verankert auf Rn., je Entscheid PDF + EN-Übersetzung). **dejure.org** =
Goldstandard der Inline-Verlinkung (jede Norm + jedes Präjudiz inline verlinkt,
Norm-Überschrift im Tooltip — aber Body voll breit Verdana 13px, schwach).
**CourtListener** (Redesign 03/2025) = Reader-Vorbild: sticky «Jump To»-TOC,
**klick-/teilbare Seitenmarken am Rand** als Pin-Cite, `eyecite` verlinkt eine
Zitierung nur bei eindeutiger Auflösung, OCR-Provenienz offen ausgewiesen.
**vLex** = Reader-Steuerung (Schriftgrösse/Font/Ausrichtung, Reader-View) +
Treatment-Farben (grün/rot/grau). **Westlaw KeyCite / Lexis Shepard's** =
mentales Modell der Juristen für Status-Farben (rot/gelb/grün).

## Rechtsprechung · R1/R2 (Juni-Wortlaut)

> Herkunft: `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` Z. 93–104, Stand `main@dc93425d9`, wörtlich.

**R1 · Lesespalte 60–75 Zeichen (Body), nicht breiter.**
Body-Container auf eine Mass-begrenzte Spalte (~`38–42rem`, Ziel ~66 ch). Der
aktuelle Reader-Body steht auf `max-w-[56rem]` — **das ist zu breit** (≈
90–110 Zeichen bei 1.08rem Serif) und der einzige echte Lesbarkeitsfehler im
Bestand. Auf `max-w-reading` (40rem) oder eng darüber zurücknehmen.
*Quelle:* Bringhurst/Butterick/Baymard 50–75 ch; WCAG 1.4.8 Kappe 80.

**R2 · Body Serif, 1.08–1.125rem, Zeilenhöhe 1.7.**
Beibehalten (`font-serif text-[1.08rem] leading-[1.7]`). Serif ist für langen
juristischen Lesefluss legitim (NN/g: «Bildschirm = Sans» ist überholt) und
hebt den Reader gegen die Sans-lastigen Anbieter ab. 1.7 liegt über dem
WCAG-Boden 1.5. *Quelle:* NN/g Serif/Sans; WCAG 1.4.12; Butterick.

## Rechtsprechung · R8 (Juni-Wortlaut)

> Herkunft: `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` Z. 140–145, Stand `main@dc93425d9`, wörtlich.

**R8 · Regeste als abgesetzter Block, Serif 1.1rem/1.7, mit Quellennennung.**
Beibehalten (`lc-highlight`, `font-serif text-[1.1rem] leading-[1.7]`,
Quellenzeile). Die Regeste ist redaktioneller Leitsatz, optisch klar vom
Urteilstext getrennt — wie BVerfG (Top-Block) und juris (Leitsatz vs.
Orientierungssatz). Quelle der Regeste IMMER ausweisen (§8). *Quelle:* BVerfG;
juris; bger.ch `id="regeste"`.

## Rechtsprechung · Gliederungs-Gerüst und Quick Wins (23.6.2026)

> Herkunft: `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` Z. 262–300, Stand `main@dc93425d9`, wörtlich.

## Gliederung «Darstellungs-Reglement Rechtsprechung» (Repo-Gerüst)

Falls dieses Dokument später formalisiert/erweitert wird, diese Abschnitte:

```markdown
# Darstellungs-Reglement Rechtsprechung
## 0 · Geltungsbereich & Verhältnis zu den anderen Reglementen
## 1 · Evidenzlage (Primärquellen, Stand) — CH-Anbieter, DE/Intl-Referenz, Lese-Typografie, A11y
## 2 · Amtliche Anatomie eines Entscheids (Rubrum/Regeste/Sachverhalt/Erwägungen/Dispositiv) + Zitiergrammatik (BGE/BGer, E., kein ECLI)
## 3 · Lese-Fundament (Spalte/Body/Zeilenhöhe/Ausrichtung/Kontrast/Zoom)   ← R1–R5
## 4 · Erwägungs-Darstellung (Randziffer, Einrückung, Anker, Pin-Cite)     ← R6, R7, R13
## 5 · Regeste & Kopf (abgesetzte Box, Zitierung, Quelle)                  ← R8, R10
## 6 · Navigation im Dokument (Sprungleiste, scroll-margin, Back-to-Top)   ← R9, R20
## 7 · Verlinkung & Zitierexport (Norm-/Präjudiz-Links, Copy-with-Cite)    ← R11, R12
## 8 · Übersicht: Karten & Facetten (Felder, Hierarchie, Trefferzahl)      ← R14, R15
## 9 · Status- & Treatment-Farben (KeyCite/Shepard's-Modell, A11y)         ← R16
## 10 · Reader-Steuerung & Personalisierung                                ← R17
## 11 · Ehrlichkeit & Provenienz (§7/§8: maschinell erfasst, URG, Quelle)  ← R18, R19
## 12 · Mobil & Responsiveness                                             ← R21
## 13 · Bewusst NICHT (ECLI erfinden, Blocksatz, Progress-Bar, zu breite Spalte) ← R22 u.a.
## 14 · Token-Bindung (tailwind.config.js: maxWidth.reading, --font-serif, fontSize-Skala)
## 15 · Prüf-Checkliste vor Commit
```

---

## Quick Wins (grösster Lesbarkeits-Effekt sofort)

1. **Lesespalte schmaler (R1):** `max-w-[56rem]` → `max-w-reading` (40rem) am
   Reader-Body. Einzeiliger Change, grösster Einzeleffekt — bringt den Reader
   sofort vor bger.ch/entscheidsuche (die unbegrenzt breit rendern).
2. **Absatzluft erhöhen (R5):** Erwägungs-Block-Abstand `space-y-4` → ~`space-y-6`;
   trennt nummerierte Absätze sichtbar, trifft WCAG 1.4.12.
3. **Pin-Cite-Anker je Erwägung (R7):** stabile `id` + Hover-§-Permalink — macht
   den Reader auf einen Schlag «kanzleitauglich zitierbar».
4. **Kontrast der gedämpften Elemente prüfen (R4):** Randziffern/Meta/Quellzeile
   mit echtem Tool gegen Paper messen (≥ 4.5:1), nicht nach Augenmass.
5. **`tabular-nums` auf der Randziffer sicherstellen (R6):** Produktionsfont auf
   `tnum` testen; sonst jittert die Ziffernspalte (10/11).

## Rechtsprechung · Fix-Runde 2 (23.6.2026)

> Herkunft: `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` Z. 340–363, Stand `main@dc93425d9`, wörtlich.

### Fix-Runde 2 (Stand 23.6.2026, 3-Agenten-Audit: visuell/Konsistenz/Textqualität)

- **Fliesstext-Bereinigung** (`bereinigeFliesstext`, register.ts): OCL-Markdown-Links
  → Text, eingestreute Zitat-Zeilenumbrüche → Leerzeichen (kein Zeilenbruch je Zitat
  mehr), echte Absätze (`\n\n`) erhalten, **Silbentrennung am Umbruch geheilt**
  („wer-\\nden" → „werden", Komposita „Justiz- und" bleiben), freistehende `<URL>`
  entfernt. Unit-getestet.
- **Inline-Links dezent (R11):** `.rsp-prose a` (index.css, unlayered) nimmt im
  Lese-Fliesstext die Tailwind-`underline`-Utility von `NormText` zurück → ruhige
  Bottom-Border statt bunter Unterstrich-Flut; hell/dunkel über Tokens.
- **Einheitlichkeit Kantone:** lesbare Zitierung + `gerichtName` aus
  `gerichtAnzeigename` (statt rohem Court-Code „GR_GERICHTE…"); kantonale
  Aktenzeichen-Präfixe → Sachgebiet (`kantonalSachgebiet`); `ABK_REGISTER` um
  Sozialversicherungs-Erlasse (ATSG/IVG/UVG/ELG/AVIG/BVG…) erweitert.
- **Regeste:** OCL-Suffix „ | <Rechtsgebiet>" abgeschnitten (redundant zum Sachgebiet).
- **Karten:** gleiche Höhe (`flex h-full`, Fuss `mt-auto`); ohne Regeste **kein**
  wiederholter Zitat-Text, sondern gedämpfter Hinweis; „lesen →" auch mobil sichtbar.
- **Dispositiv:** bewusst EIN Block (OCL `dispositiv_orders` zerteilt unzuverlässig an
  Datumsangaben „2. Dezember" → §1 kein Falsch-Split).
- **Sub-Erwägungen** kräftiger (ink-700 statt brass) + linke Randlinie zur Tiefe;
  Sektions-Overline ohne die ins Leere laufende Volllinie.
- **Offen/bewusst später:** Dispositiv-Liste (sichere Split-Heuristik), Sachverhalt-
  Sublabel-Absätze, Status-/Treatment-Farben (R16), Reader-Steuerung (R17), Facetten-
  Trefferzahlen + CH-Datumsformat im Filter (R15), Datums-Plausibilität (1 GR-Zukunftsdatum).

## F0.5 «Kanten statt Kissen» — Wortlaut bis 23.9.2026 (abgelöst durch W2·29-WERKBANK-GRUNDTON)

**F0.5 — Form: Kanten statt Kissen.** Alle fünf Radius-Token stehen auf `0px`
(`--radius-sm…2xl`); die Skala bleibt als EIN Ort bestehen, damit die Konsumenten
ohne Edit umfärben. **Ausnahme:** echte Punkte, Marken und Avatare ≤ 12 px bleiben
rund (`rounded-full`). **Schatten:** `--shadow-sm`/`--shadow-md` sind `none`; es
gibt genau einen Schatten, `--shadow-lg`, und er gehört ausschliesslich der
**schwebenden Ebene** — Menü, Dialog, Popover, getragen von `.lc-schwebeflaeche`.
Was an einem Feld hängt, schwebt nicht und trägt weder Schatten noch Radius
(`.lc-suchpanel-huelle`, D23). Kein `lc-glass`.
