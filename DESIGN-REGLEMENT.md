# Design-Reglement (Dach) — die site-weiten Gestaltungsregeln von Lexmetrik

Stand: 25.6.2026 (Auftrag David: «die Erkenntnisse aus der Legal-Design-
Recherche sollen ins Projekt einfliessen — daraus Design-Regeln erstellen, die
für die ganze Webseite gelten»). Geltungsbereich: **die gesamte Webseite** —
jede Seite, jede Komponente, jeder generierte Text, jeder Output.

Dieses Reglement ist die **Dach-Schicht** über den drei domänenspezifischen
Reglementen. Die hängen darunter und konkretisieren es für ihren Bereich:

- `DESIGN-REGLEMENT-RECHNER.md` — Aufbau jeder Rechner-/Engine-UI
- `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` — Schriftbild der Entscheid-Anzeige
- `DESIGN-REGLEMENT-VORLAGEN.md` — Schriftbild der Dokument-Outputs
- `DESIGN-REGLEMENT-NORMTEXT.md` — Gesetzesdarstellung (≥ Fedlex-Fundiertheit)

Bei Konflikt gewinnt das speziellere Reglement *innerhalb seiner Domäne*; alles
andere folgt diesem Dach. Neue Domänen-Reglemente verweisen zurück hierher.

**Das Verbindliche ist der Code.** Tokens leben in `src/index.css` (`:root`,
«Designsystem §2») und `tailwind.config.js` (Typo-Skala, Farben, Raster, Radien,
Motion). Dieses Reglement **erfindet keine neuen Magic-Numbers** — es bindet an
die bestehenden Tokens und hält das *Warum* + die Soll-Werte fest.

---

## Woher die Regeln kommen (Evidenzlage)

Grundlage ist eine doppelt-verifizierte Recherche (25.6.2026, 22 Quellen,
adversarial gegengeprüft — 25/25 Claims bestätigt). Tragende Quellen:

- **Margaret Hagan, *Law By Design* / Stanford Legal Design Lab** — 6 Kern-
  prinzipien, Design-Haltungen (Users at the Center, Going Visual, Build to
  Think). [lawbydesign.co, law.stanford.edu/legal-design-lab]
- **Martinez/Mollica/Gibson 2024 (MIT TedLab, ~225 Mio.-Wörter-Korpus) +
  Masson & Waldron 1994** — *empirisch* belegte, behebbare Verständlichkeits-
  Hemmer; Nutzen für Laien **und** Juristen. [tedlab.mit.edu, Wiley acp.2350080107]
- **Arbel & Becher 2024 (J. Empirical Legal Studies)** — Lesbarkeits-Formeln
  sind unzuverlässig/manipulierbar (bis 4,6 Schuljahre Differenz). [Wiley jels.12400]
- **Passera/Haapio/Barton + WorldCC Contract Design Pattern Library** — Muster
  für verständliche Verträge. [contract-design.worldcc.foundation]

**Ehrlicher Vorbehalt (gilt für das ganze Reglement):** Fast alle *empirischen*
Belege stammen aus dem US-/englischsprachigen Raum. Die Übertragung auf das
Schweizer DE/FR/IT-Recht ist **plausible Inferenz, nicht direkt getestet** —
deutsche Rechtssprache hat eigene Hemmer (Komposita, Nominalstil), die nicht
untersucht wurden. Die *Prinzipien* (Hierarchie, Visualität, Aktiv-Sprache,
Quellentransparenz) sind übertragbar; bei DACH-spezifischen Detailentscheiden
gilt: im Zweifel an echtem Verständnis prüfen, nicht aus US-Daten ableiten.
Schliessen der Lücke = eigener Folge-Auftrag (CH/Fedlex-fokussierte Recherche).

---

## A · Sprache & Verständlichkeit (härteste Evidenz)

Gilt für **jeden Text**, den Lexmetrik produziert oder anzeigt: UI-Microcopy,
Erklärtexte, Tooltips, generierte Verträge/Vorlagen, Verdikte, Fehlermeldungen.

**A1 — Schachtelsätze auflösen.** Keine zentralen Einbettungen (eine Klausel,
die Subjekt und Verb/Objekt auseinanderreisst). Subjekt–Verb–Objekt zusammen-
halten; Einschübe in eigene Sätze auslagern. *(Stärkster Einzelbefund: center-
embedding ist der messbar grösste Verarbeitungs-Hemmer, Martinez 2024.)*

**A2 — Aktiv, kurz, ohne Versalienblock.** Aktiv statt Passiv. Lange Sätze
teilen. **Kein ALL-CAPS-Fliesstext** — Versalien nur als kurze Overline/Label
(`text-overline`-Token). Fachjargon nur mit Erklärung beim ersten Auftreten
(Tooltip/Klammer/Glossar), nicht unerklärt.

**A3 — Klarheit ist Qualität, kein Laien-Rabatt.** Verständliche Sprache nützt
Fach **und** Laie; Juristen lehnen Legalese selbst ab und bewerten klare
Verträge als gleich durchsetzbar, aber besser (PNAS 2023). → Verständlichkeit
gegenüber der anwaltlichen Zielgruppe **nicht** als Qualitätsverlust behandeln.
Kein doppeltes Schreiben («Fachversion» vs. «Laienversion») als Ausrede für
unklare Fachtexte — Klarheit gilt für beide.

**A4 — Kein Lesbarkeits-Score als Gütesiegel.** Lexmetrik zeigt **keine**
Flesch-/Grade-Level-Scores als Verständlichkeits-Beweis an (Formeln sind
manipulierbar, Arbel 2024). Wenn Verständlichkeit belegt werden soll, dann über
echtes Verständnis (Nutzertest/Paraphrase), nie über eine Formel.

**A5 — Verständlichkeit strukturell, nicht deklarativ.** Kein «einfach erklärt»-
Etikett ohne dass die Struktur es einlöst. Top-down-Versprechen wirken nachweis-
lich kaum (Martinez 2024) — die Vereinfachung gehört in die Generatoren/Templates
und Komponenten, nicht aufs Label.

**A6 — Sprach-Diät: Bezeichnungen statt Versprechen (Freigabe David 6.9.2026,
`FAHRPLAN-DESIGN-IDENTITAET.md` §5).** Sichtbarer Text der Oberfläche trägt
**keine Slogans und keine Nutzenversprechen** («alles an einem Ort», «verzahnt»
als Behauptung, «modern», «leistungsstark»). Erlaubt sind: **Bezeichnungen**
(wie die Sache heisst), **Zahlen mit Scope** («227 Bundeserlasse im Volltext»,
nie eine nackte Zahl) und **Verben** (was der Knopf tut). Übersichts-Köpfe tragen
den Bereichsnamen und eine Ausgabe-Zeile, keinen Erklärabsatz (D11).
Als Negativliste gilt Wikipedia «Signs of AI writing» — Werbe-Adjektive,
«not just X but Y», Floskel-Dreiklänge, Em-Dash-Dramatik im UI-Text.
*Abgrenzung zu A5:* A5 verbietet das unerfüllte Verständlichkeits-**Etikett**,
A6 die werbende **Tonlage**. Geprüft wird sie im Beschriftungs-Lauf (R7), nicht
maschinell — ein Tor auf Tonfall wäre ein Tor, das nicht scheitern kann (§6.7).

---

## B · Informations-Darstellung (Hierarchie & Visualität)

Gilt für die Darstellung von Gesetzen, Normtexten, Rechtsprechung, Rechner-
Ergebnissen und allen längeren Inhalten.

**B1 — Verdikt zuerst, Herleitung auf Abruf.** Die Kernaussage/das Resultat
steht oben; Begründung und Detail sind aufklappbar/darunter. *(Hagan: «Bird's
Eye View that Swoops In»; deckt sich mit der Rechner-Leitidee, hier site-weit
hochgezogen.)*

**B2 — Feste Typo-Skala, gesetzte Lesespalte.** Nur die Skala aus
`tailwind.config.js` (micro · xs · body-s · base · body-l · h3 · h2 · h1 ·
display). **Nicht** die Tailwind-Defaults `text-sm`/`text-lg` (fremde Zeilen-
höhen) und **keine** Arbitrary-Sizes `text-[…px]`. Langer Fliesstext bekommt
eine bewusste Lesespalte (`max-w-reading` ≈ 40rem); volle Fensterbreite für
Fliesstext ist verboten. *(Die typografisch schwachen amtlichen Anzeigen
(bger.ch: Times, volle Breite) sind genau der leicht erreichbare Vorsprung.)*

**B3 — Klare visuelle Hierarchie, ein Icon-System, vier Status-Familien.**
Inhalt scanbar gliedern (Überschriften-Hierarchie, Abstand, nicht Textwüste).
Icons/Symbole **zusätzlich** zum Text (nie als alleiniger Bedeutungsträger).
Genau **ein** Icon-Set. Status ausschliesslich über die vier definierten
Familien `sage/slate/warn/danger` — **keine** Ad-hoc-Farben (`text-red-…`,
`bg-green-…`, Hex in className).

**B4 — Prozesse als Pfad visualisieren.** Verfahrenswege (Vertragsabschluss,
Rechtsweg, Beurkundung), Rechner-Logik und Wizards als sichtbarer Schritt-für-
Schritt-Pfad mit Start-/Endpunkt (Hagans Brettspiel-Metapher) — nicht als
Prosa-Absatz. Stepper/Journey vor Fliesstext.

---

## C · Produkt-UX (Hagans Prinzipien, site-weit)

**C1 — Überblick → Drilldown durchgängig.** Vom Cockpit/Startseite führt jeder
Pfad per Drilldown ins Detail und wieder zurück; nie eine Sackgasse, nie ein
Detail ohne Kontext-Anker.

**C2 — Simpel vorne, smart hinten.** Komplexe Logik (Tarife, Normketten) bleibt
hinten; die Oberfläche bleibt simpel. Konkret: **ein leeres Formular zeigt keine
Fehler** — Validierung erst nach erster Eingabe/Interaktion (Davids Grundsatz,
hier verbindlich für die ganze Seite).

**C3 — Den Nutzer befähigen.** UI macht den Nutzer schlauer: «Worum geht es →
was gebe ich ein → was gilt → **warum** gilt es → was nehme ich mit». Der
Warum-Layer (Norm, Herleitung) ist überall erreichbar, nicht nur das Resultat.

**C4 — Modi statt Einheitszwang.** Wo sinnvoll mehrere Sichten/Modi anbieten
(nüchtern ↔ modern, Hell/Dunkel; perspektivisch Fach ↔ Laie) statt eine
erzwungene Darstellung.

---

## D · Vertrauen & Quellentransparenz

**D1 — Jeder Rechtswert mit Norm + Link + Stand.** Jede angezeigte rechtliche
Zahl/Aussage trägt ihren Normbezug (Artikel/§), eine Quelle/einen Link und den
Stand/das Datum. Verbindlich site-weit (deckt Davids Daueranweisung «jeden Wert
mit konkreter Norm + Link + Stand»). Trust entsteht aus Belegbarkeit.

**D2 — Konsistenz als Trust-Signal.** Ein einheitliches Interface signalisiert
Sorgfalt. Darum: **keine Magic-Numbers**, keine Ad-hoc-Abstände/-Farben/-Grössen
in Komponenten — alles über Tokens. Inkonsistenz liest sich als Nachlässigkeit
und untergräbt das Vertrauen ins juristische Produkt.

**D3 — Ehrlich über Stand und Unsicherheit.** Status-Marker (`recherche` /
geprüft) bleiben sichtbar; nichts wird als «geprüft» dargestellt, was es nicht
ist (Lernphase-Strategie bis zur Abnahme-Welle). Lieber sichtbare Lücke als
Schein-Sicherheit.

---

## E · Methode & Governance

**E1 — Regeln in Code erzwingen, nicht nur beschreiben.** Wo eine Regel
maschinell prüfbar ist (verbotene Klassen, Token-Pflicht), gehört sie in
ESLint/Tests/Gates — nicht nur in dieses .md. Das .md hält das Warum; der Code
hält die Regel.

**E2 — CH-Evidenz-Lücke respektieren.** Siehe Vorbehalt oben. Regeln aus
US-Evidenz sind für DE/FR/IT Inferenz; DACH-spezifische Entscheide an echtem
Verständnis prüfen.

**E3 — Mehrsprachigkeit als Designvariable.** DE/FR/IT haben unterschiedliche
Textlängen; Layouts müssen flexen (keine fixen Breiten, die nur für Deutsch
passen), sobald Lexmetrik mehrsprachig wächst.

---

## F · UI-Design (visuell & interaktiv)

### F0 · Die Handschrift «Sammlung» (W2·24-DESIGN-IDENTITAET, 6.9.2026)

Freigabe David 6.9.2026, Referenzbilder `abnahme/design-identitaet/vorschlag-
freigegeben.html` (Leser + Inhaltsverzeichnis) und `pult-freigegeben.html`
(Startseite). **Massgeblich sind die Token in `src/index.css`, nicht dieser
Text** — F0 hält fest, welche Rolle jeder Wert trägt. Was hier steht, überschreibt
jede ältere Aussage dieses Reglements über Farbe, Schrift und Form; die abgelösten
Sätze sind unten als AUFGEHOBEN gekennzeichnet, nicht gelöscht (Muster
`DESIGN-REGLEMENT-NORMTEXT.md` §4b-A).

**F0.1 — Papier und Tinte.** Zwei Flächen-Achsen, beide fast chromafrei; die
Trennung im Bild läuft über **Linien, nicht über Flächentönung**. Die
Flächen-L-Leiter `well < paper < surface < paper-raised` bleibt harter FAIL im
Tor (F2b Ziff. 4). Ist-Werte (D12 «Lesekomfort», 6.9.2026):

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

Die Tinte ist **bewusst nicht maximal dunkel**: `--ink-fixed-dark` `#25231F`
misst 14.68:1 auf Papier. Maximalkontrast (~17:1) erzeugt am Bildschirm Halation;
Zielband für Langlese-Fliesstext 12–15:1 (D12, Belege in
`abnahme/design-identitaet/KONTRAST-R1.md` Nachtrag D12). Reinschwarz/Reinweiss
als *Lesegrund* bleibt ausgeschlossen (§G d).

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

**F0.3 — Rollen-Schicht: der Akzent ist die Tinte.** Die Messing-Skala
`--brass-100…800` besteht als Werte-Träger fort, ist aber **neutral** geworden;
`--brass-700` zeigt per `var()` auf `--ink-fixed-dark`. Die Rollen-Schicht §G
bleibt der Zugriffsweg (`--accent-text` = `--brass-700` = Tinte, `--accent-solid`
= `--brass-500`, `--focus` = `--brass-700` hell / `--brass-500` dunkel).
Der Klassenname `*-brass-*` lügt damit bewusst bis zum Umbenennungs-Sweep — **die
Werte in `index.css` sind die Wahrheit, nicht der Name**. Status-Semantik
`sage`/`slate`/`warn`/`danger` bleibt unverändert gültig (B3, §4b-B).

**F0.4 — Zwei Stimmen: Literata und Archivo.** `--font-serif` **Literata**
(opsz-Achse geladen, `font-optical-sizing:auto`, Lesegewicht `--lese-gewicht:450`)
trägt alles GELESENE — Normtext, Entscheide, Titel, Begrüssung. `--font-sans`/
`--font-display` **Archivo** trägt die BEDIENUNG — Reiter, Knöpfe, Marginalien,
Meta-Zeilen, Etiketten. `--font-mono` ist eine **System-Kette ohne eigenes Paket**
und trägt nur noch, was fachlich Monospace braucht (Rechenweg, Code); Zahlenkolonnen
laufen über `.num`/`font-variant-numeric: tabular-nums`, nicht über Mono. Beide
Familien OFL, self-hosted über `@fontsource-variable` (kein Google-Fonts-Request
zur Laufzeit); metrik-angepasste Fallbacks (`Archivo Fallback`/`Literata Fallback`/
`Literata Times Fallback`, gemessen mit `scripts/gen-font-fallbacks.ts`) halten den
Zeilenkasten CLS-frei, solange der Webfont lädt. **Keine dritte Schrift** (§15).
Leser-Fliesstext 18 px / 1.62 (`DESIGN-REGLEMENT-NORMTEXT.md` §4b).

**F0.5 — Form: Kanten statt Kissen.** Alle fünf Radius-Token stehen auf `0px`
(`--radius-sm…2xl`); die Skala bleibt als EIN Ort bestehen, damit die Konsumenten
ohne Edit umfärben. **Ausnahme:** echte Punkte, Marken und Avatare ≤ 12 px bleiben
rund (`rounded-full`). **Schatten:** `--shadow-sm`/`--shadow-md` sind `none`; es
gibt genau einen Schatten, `--shadow-lg`, und er gehört ausschliesslich der
**schwebenden Ebene** — Menü, Dialog, Popover, getragen von `.lc-schwebeflaeche`.
Was an einem Feld hängt, schwebt nicht und trägt weder Schatten noch Radius
(`.lc-suchpanel-huelle`, D23). Kein `lc-glass`.

**F0.6 — Linien statt Flächen.** Zwei solide Trenner-Töne: 1 px `--rule-soft`
zwischen Zeilen im Satzspiegel, 2 px `--rule` unter Kopfzeilen. Sie sind das
Gegenstück zu den transparenten `color-mix`-Haarlinien (`--line`,
`--line-strong`, `--rule-artikel`, `--rule-struktur`), die sich der Fläche
darunter anpassen. Gruppierung über Weissraum und Linie, nicht über Kästen und
Füllungen.

**F0.7 — Etiketten ohne Versalien.** `.lc-overline` ist umdefiniert: Archivo,
0.75 rem, `text-transform: none`, `letter-spacing: var(--tracking-overline)` =
`0em`, `color: var(--ink-500)`. **Kein ALL-CAPS-Etikett mehr**, kein Sperrsatz,
keine Icons/Chips/Kästen als Etikett. Die Regel steht EINMAL an der Klasse, nicht
an ihren ~260 Konsumenten.

**F0.8 — Links sind unterstrichen.** Inline-Textlinks tragen den Strich; die Regel
steht EINMAL in `src/index.css` (`.lc-leser :where(a[href])`, Spezifität 0 in einer
Cascade-Layer, damit `no-underline` im Markup immer gewinnt). **Navigation,
Listenzeilen, Brotkrume, Artikelnummer-Anker, `.lc-chip`/`.lc-btn-mini` tragen
ihre Affordanz aus der Form und dürfen ohne Strich stehen** — sie sagen es
ausdrücklich im Markup. Ein Link, den nur die Farbe ausweist, ist kein Link
(WCAG 1.4.1). Wächter: `e2e/leser-links-p3.e2e.ts`.

**F0.9 — Anatomien (Ist-Stand 6.9.2026).**
- **Menü** (D5): ruhige Liste mit Linien; Zustand als **Wort** oder Schalter, nie
  als «✓ an»-Doppel; Fokus als Strich/Unterstrich, nie als Kasten; Regler in
  eigener Zeile mit Archivo-Label; keine Umbrüche in Menüzeilen; Icons im Menü
  einheitlich (in der Sammlung: keine). Leser-Kopf-Knöpfe sind **Textknöpfe mit
  Unterstrich**, keine Chips. *Offen (R11-Auflage R6/R7, wartet auf Umsetzung):
  `.lc-schwebeflaeche` trägt heute noch `shadow-lg` — dass Menüs schattenlos auf
  Papier stehen sollen, ist entschieden, aber im Ist-Code nicht durchgezogen.*
- **Feld** (D9/D23): Unterstrich-Anatomie statt Kasten — `.lc-input` trägt
  `border-bottom: 1px solid var(--rule)`, keine Füllung als Rahmenersatz. Das
  Treffer-/Leerzustand-Panel ist die **Fortsetzung des Feldes nach unten**: gleiche
  Kanten (`inset-x-0`), kein Abstand (`top-full`), `border-top: 0`, kein Schatten,
  kein Radius, Grund `--paper`.
- **Reiterleiste** (§5a, R11, D15/D16/D19/D27): zwei Zeilen mit zwei Bedeutungen —
  Titelblatt = Marke · Suche · Werkzeuge (D17: **keine Bereichs-Reiter**),
  darunter die **Arbeitsleiste** = offene Dokumente. Reiter tragen den
  Registerstrich ihrer Domäne (inaktiv 60 % Deckkraft, aktiv voll + Tönung),
  Kurzform als Beschriftung, Volltitel + Stand im `title`. Ordnen per Ziehen im
  flachen Speicher, **ohne zweite Anzeige-Ordnung** (D16). «+» erzeugt einen neuen
  Reiter; auf «/» bleibt die Höhe reserviert (CLS 0), ohne vollen Unterstrich. Die
  Beschriftung folgt der Lesestellung live (D27) — die Brotkrume im Gesetz entfällt
  dafür.
- **Seitenleiste** (D17/D25/D26): bleibt auf **allen** Routen, auch auf «/»;
  Werkseinstellung **eingeklappt**, Nutzerwahl persistent. Inhalt sind direkte
  Ziele (Kernerlasse, Sachgebiete, Behörden), keine Kopie der Kategorien-Ebene.
- **Leser-Kopf** (D20/D27/D28): Randtitel steht als kursive Literata-Zeile **im
  Artikelkopf**, nicht in einer Randspalte; Fassungsdatum klein daneben; Bezüge als
  EINE aufklappbare Zeile darunter; die Erlass-Suche sitzt **oben im Leser-Kopf**
  über dem Gesetzestext und verschiebt sich beim Klappen der Gliederung nicht
  (Δx = 0). **Keine Brotkrume** im Leser.

**F0.10 — Was AUFGEHOBEN ist.** Die Creme-Gold-/Messing-Welt (Brass als Marke,
Wärme-Dramaturgie, Geist/Geist Mono/Source Serif 4, Versal-Overlines, gerundete
Kanten) gilt seit dem 6.9.2026 nicht mehr. Nicht gelöscht, sondern mit
AUFGEHOBEN-Vermerk am Ort belassen, damit Alt-Verweise auflösen: **F5 · G a ·
G c · G d · G e-Zusatz · G f · G g · G h**. Die datierten Messreihen der
F2b-Nachträge D-3/D-4/D-5/QS-UI-8a bleiben wörtlich stehen — abgelöst ist ihr
Geltungsanspruch, nicht ihre Richtigkeit (Belege altern nicht).

---

Gegründet auf doppelt-verifizierte UI-Design-Recherche (25.6.2026,
`docs/recherche-ui-design-2026-06-25.md`; IBM Carbon, Atlassian, Material 3,
W3C WCAG 2.2, Nielsen Norman Group, Stanford/Fogg) **und** das ultracode-
Struktur-Audit. Prinzipien übernehmen, nicht Hersteller-Pixel dogmatisch.

**F1 — Abstand & Raster aus Tokens, gestuft nach Dichte.** Spacing nur aus der
Mass-Skala (`--space-*`/Tailwind), keine Ad-hoc-Pixel. Dichte ist ein bewusster
Hebel: kompakt-aber-scanbar ist für Lexmetrik richtig (dicht ⇒ wirkt seriöser/
fokussierter). Gruppierung über Weissraum/Nähe **vor** Linien/Rahmen.
Beschriftete Eingaben grosszügig im Gutter, Text nie in den Gutter hängen.

**F2 — Kontrast nach WCAG 2.2 (Pflicht, maschinell zu prüfen).** Text ≥ 4.5:1
(AA), grosser/fetter Text ≥ 3:1; **Nicht-Text — UI-Komponenten, Zustände, Icons,
Input-Borders, Fokus — ≥ 3:1** gegen die Nachbarfarbe. Wo erreichbar 7:1 (AAA)
für tragenden Text (Trust). Gilt **in Hell- UND Dunkelmodus** (Parität). Disabled/
Deko/Logo ausgenommen.

**F3 — Sichtbarer Fokus über Outline, nicht Farbe allein.** Jede fokussierbare
Komponente trägt einen sichtbaren Tastatur-Fokus: ≥ 2px-Perimeter, ≥ 3:1
Change-of-Contrast fokussiert↔unfokussiert. Kein `outline:none` ohne
gleichwertigen Ersatz; kein Fokus, der nur die Farbe wechselt.

**F4 — Vollständige Zustands-Matrix.** Jede interaktive Komponente bedient
*alle* Zustände: default · hover · focus-visible · active · **disabled ·
loading · selected** — plus **empty- und error-State** der Sicht. Kein Zustand
fehlt still. (Verzahnt mit C2: leeres Formular zeigt noch keinen Fehler.)

**F5 — Zwei Typografie-Register.** «Produktiv» (kompakt, Sans = **Archivo**) für
Rechner/Generatoren/Tabellen/UI; «Lese» (**Literata**, ruhige Lesespalte) für
Gesetzes-/Rechtsprechungs-Volltext **und die getragenen Titel** (Begrüssung,
Randtitel, H1 der Leser-Köpfe). Beide aus der einen verdichteten Skala (Block B2).
*AUFGEHOBEN 6.9.2026 (W2·24-DESIGN-IDENTITAET R1/R3):* der frühere Satz
«expressive Lesestile gehören NICHT in die Produkt-UI» und die Familien Geist /
Geist Mono / Source Serif 4. Die Sammlung setzt Literata bewusst auch ausserhalb
des Volltexts — als Titel- und Begrüssungsstimme, nie als Bedienschrift.
Massgeblich ist F0.4.

**F6 — Politur & Fehlerfreiheit sind Trust, nicht Kosmetik.** Sichtbare
Kleinfehler — Typos, tote Links, **stille No-op-Klassen**, inkonsistente
Abstände — senken die Glaubwürdigkeit messbar (Prominence × Interpretation).
Für ein Rechts-Werkzeug ist visuelle Disziplin ein Vertrauens-Mechanismus.

**F7 — Token-Disziplin site-weit, ohne Leichen.** Keine toten Tokens/`lc-*`-
Klassen. **Jede `bg-*`/`text-*`/`border-*`/`ring-*`-Farbe muss in
`tailwind.config.js` existieren** — sonst rendert das Utility stumm nichts
(Befund-Klasse brass-300/50). Kein Ad-hoc-Inline-Style für Farbe/Abstand/Grösse,
wo Token/Utility existiert (datengetriebene Inline-Werte — Timelines, Karten-
Fill — sind ausgenommen). Dark-Mode-Parität ist Teil jeder Farb-Entscheidung.

**F7a — Deckkraft-Suffix ist erlaubt und wirksam (DESIGN-D0, 16.8.2026).** Das
Suffix (`bg-brass-100/40`, `border-line/60` …) war bis dahin ein stiller No-op:
Tailwind 3 kann den `/<alpha>`-Modifier auf einen reinen `var(--token)`-Wert
nicht anwenden, verwarf darum die ganze Regel, und die Fläche rendert unsichtbar
(Fund B4 vom 8.8.2026, belegt LM-156 / PR #472; 22 Klassen an 90 Fundstellen).
Wurzel-Fix in `tailwind.config.js` (`alphaFaehig()` — opak unverändert, nur der
Modifier mischt per `color-mix`), bewacht von `check:design-tokens` Prüfung 3.
Folge für den Bau: Halbtransparenz wird wieder über das Suffix ausgedrückt,
**nicht** über ein zweites Token; die symptomatischen Umgehungen von damals
(z. B. `bg-line` statt `bg-line/70` in `GesetzeGliederung.tsx`) sind seither
freiwillig, nicht erzwungen.

**F7b — Radius aus der Skala, begründete Unter-Token-Ausnahme möglich (C4,
5.9.2026).** Rundungen kommen aus `--radius-sm…2xl` (kleinster Token 4px);
kein rohes `rounded-[Npx]` ohne Begründung. Ausnahme dokumentiert: die
Zeitstrahl-Balken in `BezugZeitWahl.tsx` (`rounded-[1px]`) bleiben unter dem
Token, weil ihre Mindesthöhe (`MIN_ANTEIL` = 8 % einer ~32px-Spur, ≈ 2–3px)
kleiner ist als der 4px-Token selbst — eine Rundung aus der Skala würde den
Balken zum Punkt verformen. Die Legenden-Farbfläche in `SchweizKarte.tsx`
(12×12px) trägt seither `rounded-sm` (Token), da dort keine solche Enge gilt.

**F7c — Schichtung aus der Skala, nie aus einer Zahl (C3, 5.9.2026).**
Stapelreihenfolge kommt aus `--z-*`/`zIndex`-Rollen (index.css bei --z-base,
tailwind.config.js) — kein rohes `z-<Zahl>`/`z-[<Zahl>]`. Rollen (aufsteigend):
`z-base` · `z-sticky` · `z-entscheid-sticky` · `z-reader-scrim` ·
`z-reader-kopf` · `z-inhalt-kopf` · `z-leiste` · `z-dropdown` · `z-overlay` ·
`z-modal`. Befund: 65 Fundstellen ohne Skala liessen Überlagerungs-Reihenfolgen
nur durch Ausprobieren rekonstruieren. Migriert 1:1 auf denselben Wert (keine
Zahl geändert). Wächter: Prüfung 6 in `scripts/check-design-tokens.ts` (Rot-
Beweis 5.9.2026: `z-[99]` wurde erkannt). Drei Dateien (`layout/Shell.tsx`,
`layout/HeaderSuche.tsx`, `rechtsprechung/EntscheidZeile.tsx`) trugen eine
befristete, benannte Ausnahme (Kollisions-Vorsicht, paralleler Bauer) —
Folgeschritt: migrieren, Ausnahme streichen.

**F8 — Motion zurückhaltend.** Mechanisch-präzise, kein Overshoot (Token-
Kurven/-Dauern); `prefers-reduced-motion` wird respektiert (Base-Reset).

**F9 — Trefferfläche aus dem Token, nie aus einer Zahl.** Jedes Bedienelement
trägt eine Hitbox von mindestens `var(--tap-ziel)` (24 px, WCAG 2.2 SC 2.5.8
«Target Size (Minimum)», AA) in **beiden** Achsen; wo dicht nebeneinander
getappt wird, gilt das Komfort-Ziel des bestehenden `min-h-11`-Musters (44 px,
SC 2.5.5 AAA). Die Vergrösserung geschieht **ohne Optik-Änderung** (Padding
oder `::after`-Hitbox, nie eine grössere sichtbare Fläche) — golden-neutral.
Verboten ist die rohe Zahl: `min-height`/`min-width` von Bedienelementen kommen
aus dem Token (D2). Ausgenommen sind allein die WCAG-Ausnahmen von 2.5.8
(Inline-Links im Fliesstext, UA-bestimmte Ziele, gleichwertig grosse
Zweit-Bedienung). Maschinell erzwungen (E1) durch `src/tests/tap-ziel-token.test.ts`
(Token-Existenz + Zahlen-Verbot in `src/index.css`) und den Trefferflächen-Block
in `e2e/a11y.e2e.ts` (gemessene Hitboxen der Leser-Werkzeugleiste und der
Kopf-Metazeilen, hell **und** dunkel). Der Bestand ist noch nicht flächendeckend
nachgerüstet — die gemessene Nachrüst-Liste steht im Tor-Kommentar von
`e2e/a11y.e2e.ts` (Block «Trefferflächen»); die Nachrüstung selbst ist
`W2·17-UI-BEFUNDE-B10`. Die Liste darf nur schrumpfen, nie wachsen.

**F2b — Farbwelt-Sollwerte (Mess-Tor `check:farbwelt`, FAHRPLAN-DESIGN-WAERME
D-0).** F2 wird maschinell erzwungen: `scripts/check-farbwelt.ts` parst die
`:root`- und `html.dark`-Token aus `src/index.css` (Werte) gegen die Name→`var()`-
Abbildung in `tailwind.config.js` (No-op-Wächter, F7) und misst deterministisch
(§2, kein Netz/keine Uhr) WCAG-Kontrast hell UND dunkel. Das Tor läuft in
`check:seriell` → `run-parallel` → `gate` (nicht in CI-Workflows — Aufnahme
prüft der Orchestrator separat). Vier Klassen:

1. **WCAG-Pflichtpaare (harter FAIL):** Text ≥ 4.5:1, Nicht-Text/Zustände ≥ 3:1 —
   je hell+dunkel. Quelle sind die dokumentierten Paar-Listen der CSS-Kommentare
   (ink-600/500-Basistext, `--placeholder`, brass-700-Text, brass-800/brass-100,
   Status-Badge-Text auf `-bg`, `--focus`-Ring, `lc-akzent-*`-Oberkanten).
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
3. **Bekannte Risse (WARNUNG + FAIL nur bei Verschlechterung — D-1-Input):**
   heute unter der Schwelle liegende Paare als Baseline-Guard, damit das Tor auf
   dem IST-Stand grün ist, ohne die Risse zu verstecken:
   `danger-500/paper` dunkel — Baseline 6.9.2026 (D12) **2.80** (Ziel 3.0, D-1.3,
   Direkt-Nicht-Text; der Linien-Ton nutzt bereits danger-700). *Der frühere
   Baseline-Wert 2.72 gilt für seinen Stand: D12 hob das dunkle Papier von
   `#151515` auf `#1B1917`, was den Riss vertieft hätte — statt die Baseline
   abzusenken, wurde `--danger-500` im Dunkel um dieselbe Stufe mitgehoben
   (`#9F4434`), gemessen 2.80, also besser als vorher (§17-Wurzelfix).*
   *(D-4, 13.7.: `ink-500/well` hell 4.48→**4.62** geheilt → aus der Riss-Liste in
   die WCAG-Pflichtpaare gewandert.)*
4. **OKLCH-Struktur:** Flächen-L-Leiter `well < paper < surface < paper-raised`
   je Modus (harter FAIL — Erhebungs-Logik). Hue-Drift je Familie ≤ 8° +
   L-Monotonie der Rampen: **für `ink` seit D-4 harter FAIL** (die Grau-Achse ist
   auf EINEN Ziel-Hue 88° normalisiert, Span 1.3°); `brass` bleibt **WARNUNG**
   (Sollwerte legt erst D-9/Stripe-L-Anker fest). Chroma-Dämpfung Akzent (dunkel
   C ≤ hell −10 %) = WARNUNG. **APCA-Spalte NUR beratend** (Lc), nie Fail —
   WCAG 2.2 bleibt das Gate.

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

**F3-Präzisierung (gemessen, keine neue Regel).** Tailwinds Utility
`outline-none` erzeugt `outline: 2px solid transparent` — eine Outline in Alpha
0. Ein `focus:outline-none` ohne gleichwertigen Ersatz erfüllt F3 also **nicht**,
auch wenn eine Outline-Breite messbar bleibt; ein Audit muss die Outline-**Farbe**
prüfen, nicht ihre Breite. Der app-weite Sweep (9 Hauptrouten; Umfang einmalig erhoben,
4.8.2026) fand auf den per Tab erreichbaren Flächen **null** Verstösse; die zwei
Fundstellen lagen hinter Popover bzw. Split-View und sind gefixt (`Shell.tsx`
Pane-Gutter, `BezugZeitWahl.tsx` Datumsfeld) — beide trugen im Fokus nur einen
Farbwechsel, was F3 ausdrücklich verbietet.

## G · Rollen, Farb-Wörterbuch & Wärme-Architektur (D-2-Nachträge)

Deklarierte §13-Nachträge aus FAHRPLAN-DESIGN-WAERME **D-2** (Rollen-Alias-
Schicht). Grundsatz der Schicht: **Rollen vor Stufen** — Komponenten greifen
eine wertidentische Rolle (`--accent-*`, `…-solid/-text`, `--ok-*`; in
`tailwind.config.js` als `accent-*`/`ok-*`/`…-solid`/`…-text` exportiert), nie
die nackte Basis-Stufe. Eine spätere Farb-Rekalibrierung (D-4/D-5) wird damit
ein reiner `:root`-Eingriff. Basis-Stufen (`brass-700`, `sage-500`, …) sind für
**neue** Komponenten privat; Bestand migriert opportunistisch (kein Riesen-Diff).

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

**d — Reinweiss-Invariante (im Gate) — Fassung 6.9.2026.** Kein `#FFFFFF`/
`bg-white` **als Lese- oder Arbeitsfläche**; Flächen kommen aus den Rollen
`--paper*`/`--surface*`. *Präzisiert (W2·24 R1/D12, ersetzt den früheren Zusatz
«`--paper-raised` ist nahezu weiss, aber nicht `#FFFFFF`»):* Reinweiss gibt es
seither **genau einmal im ganzen System** — als `--paper-raised`, die schwebende
Ebene (Menü/Dialog/Popover). Das Blatt selbst liegt eine Stufe darunter
(`--paper` `#FAF7F2`). Die Regel ist damit nicht gelockert, sondern verschärft:
weiss ist eine Ebenen-Aussage, kein Grundton. **Maschinell erzwungen** in `check:design-tokens`
(bg-white/text-white/…-white + `#fff`/`#ffffff` im Inline-Style, negativ-
kontrolliert). Dokumentierte Ausnahmen: `@media print` (`body #fff`) und
`text-paper` auf ink-Buttons — beide in `src/index.css`, ausserhalb des
Komponenten-Scopes des Gates.

**e — Zwei-Stimmen-Regel (grep-auditiert) — Fassung 6.9.2026.** Serif
(`--font-serif` = **Literata**) trägt zitierfähigen Quelltext **und die getragenen
Titel** (Normtext, Entscheidtext, Regesten, Erlass-Kopf, Randtitel, Begrüssung);
Sans (`--font-sans` = **Archivo**) alles Interaktive und alle Etiketten; Mono ist
eine System-Kette und trägt nur, was fachlich Monospace braucht (Rechenweg, Code) —
Zahlenkolonnen laufen über `tabular-nums`, nicht über Mono (F0.4). *Der
Erst-Audit von 12.7.2026 gilt für seinen Stand:* Audit 12.7.2026 (`grep font-serif src/`): alle 15 Fundstellen
liegen im Gesetzes-Reader (`gesetz-leser/*`) und der Rechtsprechung
(`RegesteBlock`/`EntscheidBody`/`EntscheidKarte`) — **null** Produkt-UI. Keine
dritte Schrift (§15). Regel erfüllt, keine Code-Änderung nötig.

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

**f — Linien-Rollen, Textur-NEIN — Fassung 6.9.2026.** *Haarlinien* (`--line`,
`--line-strong`, `--rule-artikel`, `--rule-struktur`) sind weiterhin immer
schwächer als der ink-600-Sekundärtext und laufen nur über die
`color-mix`-Tokens. *Präzisiert (W2·24 R1):* daneben stehen seit dem 6.9.2026
zwei **solide Trenner** — `--rule-soft` (1 px, Zeilentrennung) und `--rule`
(2 px Kopfzeilen-Kante, wertgleich `--ink-900`). Sie sind bewusst NICHT schwächer
als die Tinte: sie tragen im neuen Bild die Struktur, die früher Flächen und
Kästen trugen (F0.6). Neue Ad-hoc-Opazitäten bleiben verboten — wer eine Linie
braucht, greift eine der sechs Rollen. Explizites **NEIN** zu
Papier-Texturen/Noise-Overlays (auch §15 Performance).

**g — EINE Steuerstelle für Fläche und Tinte (früher «Wärme-Architektur»,
umformuliert 6.9.2026).** Die Mechanik gilt unverändert: Fläche und Tinte werden
**ausschliesslich** über die `--paper`/`--ink`-Basiswerte und die
`color-mix`-Rezepte gesteuert; **nie** flächen-lokale Sondertöne, **kein** dritter
(Sepia-)Modus. Änderungspfad: `--paper`/`--ink-900` verschieben, alles andere folgt
aus den Rezepten — D12 hat genau diesen Weg genommen (ein `:root`- plus ein
`html.dark`-Eingriff). *AUFGEHOBEN ist der Zweck:* «Wärme» als gestalterisches
Ziel. Der Rest-Wärmegrad des Papiers ist heute eine gemessene
Blendungs-Entscheidung (D12), keine Signatur.

**h — Navy-Fussnote — Fassung 6.9.2026.** `slate` bleibt der neutrale
Entscheid-/Referenz-Semantikton (§4b-B), **nie** eine Markenfläche — dieser Satz
gilt unverändert. *AUFGEHOBEN 6.9.2026 (W2·24 R1):* der Schlusssatz «brass bleibt
die Marke». Es gibt keine Markenfarbe mehr; die Identität trägt die Typografie
(Literata/Archivo) und der Register-Strich (F0.2/F0.4). Die dahinterliegende
Sorge bleibt gültig: **kein Kanzlei-Navy als Markenfläche** — `--reg-g` ist die
Kennfarbe des Registers «Gesetze», nicht die der Marke.

**i — Werkstoff- vs. Zustandsfarbe (F1, aufgelöst).** `sage` war doppelt belegt
(Materialien-Kennfarbe **und** ok/Live-Zustand). Aufgelöst: die Zustands-Rolle
**`--ok-*`** (wertidentisch zu sage, semantisch getrennt) trägt Status; die drei
namentlichen Sites `lc-badge-ok`/`lc-live`/`lc-termin-ring` sind darauf migriert
(§4b-B-i). `sage` bleibt Materialien-Familie + bibliografische Currency
(`lc-punkt-material`, `lc-chip-geltend`). Eine Status-Einfärbung ist damit nicht
mehr zweideutig.

**j — Interaktions-Zustände (F5).** Wärme-Verhalten von hover/active/selected
folgt EINER Regel: **eine Flexoki-Stufe «tiefer»** (mehr Chroma, weniger
Lightness) — die Rollen `--accent-hover`/`--accent-bg-hover` kapseln das.
Verhindert Patchwork bei künftigen Interaktions-Feinschliffen.

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

---

## §-Konkordanz (für Alt-Verweise im Bestand)

`CLAUDE.md` §13 führte bis zum A4-Umzug (25.7.2026, `b2fa14dda`) eine eigene
operative Liste **§13.1–§13.7**. Sie ist dort ersatzlos weggefallen; §13 verweist
seither auf dieses Reglement, das mit **Buchstaben-Codes** zählt (A–G, F2b-Nach-
träge). Rund zwei Dutzend Verweise im Bestand — Code-Kommentare, Fahrpläne,
E2E-Tests — zeigen weiterhin auf die alten Ziffern und lösen hier auf. Auch die
Schreibweise «§13 Ziff. 3» meint §13.3.

| Alt (`CLAUDE.md` §13.x) | Neu (dieses Reglement) |
|---|---|
| §13.1 Tokens statt Magic-Numbers (keine `text-sm`/`text-[…px]`, keine Ad-hoc-Farben, kein Hex in Komponenten) | **D2** (Grundsatz) · **B2** (Typo-Skala) · **B3** (Status-Familien statt Ad-hoc-Farben) · **F1** (Abstand) · **F7** (Farb-Token, erzwungen durch `check:farbwelt`) |
| §13.2 Verdikt zuerst, Warum auf Abruf; Fliesstext in der Lesespalte | **B1** (Verdikt zuerst) · **B2** (`max-w-reading`, volle Fensterbreite verboten) |
| §13.3 Sprache: aktiv, kurz, kein ALL-CAPS-Fliesstext, klar für Fach **und** Laie | **A1–A3** (dazu **A4**: kein Lesbarkeits-Score als Gütesiegel) |
| §13.5 Jeder Rechtswert mit Norm + Link + Stand | **D1** (verzahnt mit `CLAUDE.md` §7) |
| §13.7 UI-Design: Block F gilt vollständig | **Block F** (F1–F9) samt F2b-Nachträgen; F7 erzwingt `check:farbwelt` |
| §13.4 (leeres Formular zeigt keine Fehler) und §13.6 (maschinell Prüfbares gehört in Code) — im Bestand nicht mehr zitiert | **C2** (verzahnt mit **F4**) bzw. **E1** (dazu **E2**: CH-Evidenz-Lücke) |

**Über §13.7 hinaus gab es nie eine Ziffer** — ein Verweis auf §13.8+ ist ein
Tippfehler, kein Umzugsverlust.

Zwei Fallen beim Auflösen:

- Die Codes sind **feiner** als die alten Ziffern: eine Alt-Ziffer trifft
  regelmässig mehrere Codes (§13.1). Wer eine Alt-Nummer auflöst, prüft alle
  genannten Codes, nicht nur den ersten.
- Der Namensraum ist **nicht exklusiv**: Fahrpläne vergeben eigene §-Nummern.
  `FAHRPLAN-UI-QUALITAET.md:9` zeigt auf «`FAHRPLAN-GESETZES-UX.md` §13.1» —
  diese Zieldatei hat gar keinen §13, das ist kein Verweis auf diese Tabelle.

Verweise werden **nicht umgeschrieben** — die Anker-Logik hält die alten Nummern
stabil, diese Tabelle löst sie auf (gleiches Muster: Skill `auftrag` Ziff. 9 für
§14.x, Skill `refactoring` Ziff. 8 für §6.x, Skill `perf` für §15.x).
