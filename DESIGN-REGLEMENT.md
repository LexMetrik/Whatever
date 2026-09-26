# Design-Reglement — die Gestaltungsregeln von LexMetrik

Ein Reglement für die ganze Webseite, **konsolidiert 23.9.2026** aus fünf Dateien
(`W2·29-WERKBANK-TOKENS`, Rats-Auflage 2, `fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md`
§2/§4): diesem Dach und den vier Domänen-Reglementen Normtext, Rechner,
Rechtsprechung und Vorlagen. Deren Wortlaut steht in Teil II; datierte Messreihen,
Audits und der Wortlaut aufgehobener Regeln stehen wörtlich in
`archiv/DESIGN-REGLEMENT-BELEGE-2026.md`.

Stand: 25.6.2026 (Auftrag David: «die Erkenntnisse aus der Legal-Design-
Recherche sollen ins Projekt einfliessen — daraus Design-Regeln erstellen, die
für die ganze Webseite gelten»). Geltungsbereich: **die gesamte Webseite** —
jede Seite, jede Komponente, jeder generierte Text, jeder Output.

**Aufbau.** Teil I (A–G) gilt site-weit. Teil II hält die vier Domänen, jede mit
Präfix in der §-Nummer: `§N-…` Normtext (Gesetzesdarstellung), `§R-…` Rechner,
`§J-…` Rechtsprechung, `§V-…` Vorlagen. Bei Konflikt gewinnt die Domäne *innerhalb
ihres Bereichs*; alles andere folgt Teil I. Alt-Verweise auf die vier früheren
Dateien und auf aufgehobene Regeln löst die §-Konkordanz am Ende von Teil I auf.
Nackte §-Verweise im übernommenen Domänen-Wortlaut lösen auf wie in der
Ursprungsdatei.

**Die Werte stehen in `design/tokens.json`, nicht hier.** Seit dem 22.9.2026 ist
die Datei die eine Token-Quelle (Farben hell/dunkel, Typo-Skala, Abstände,
Radien, Schatten, Schichtung); `npm run gen:tokens` erzeugt daraus die
Marker-Blöcke in `src/index.css`, `tailwind.tokens.generated.js` und die
Typo-Skala in `tailwind.config.js`, `npm run check:tokens-drift` hält Quelle und
Projektionen deckungsgleich. Das Feld `usage` jedes Tokens trägt seine Rolle und
Herleitung. Dieses Reglement kommentiert die Token-Datei — es wiederholt keine
Werte (CLAUDE.md §5) und **erfindet keine Magic-Numbers**; wo früher eine
Wert-Tabelle stand, steht «→ `design/tokens.json` `<name>`».

**Lehre 22.9.2026 (§17, Anlass T1 #981):** Der Design-System-Export ist nicht
rundlauf-fest — er löst `var()`-Aliase zu Hex auf und erfindet Dunkel-Werte
(Beleg: `ring`, 22.9.2026). Quelle ist `design/tokens.json`; ein Export ist nur
Vorschlag und wird Token für Token gegen den Code re-synchronisiert.

---

# Teil I · Dach (site-weit)

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

**B2a — Rahmenbreite je Seitenart (W2·31-BILDSCHIRMBREITE B1, 25.9.2026).**
Die Rahmenbreite (Shell, Pane, Footer) steht je Seitenart an EINER Stelle:
`SEITENBREITE` in `src/components/layout/seitenbreite.ts`. Stufen: `content`
(70rem, Standard) und `weit` (90rem, erst ab `2xl`). Grundsatz David 25.9.2026:
**Fliesstext wächst nie mit der Breite** — `weit` ist nur für Raster, Tabellen
und Beiwerk. Darum trägt jeder Fliesstext seinen Deckel am Textelement, nach
Schriftstufe: `body-l`/Lead → `max-w-reading`, `body-s` → `max-w-reading-s`
(30rem), `xs`/`micro` → `max-w-kleintext`. Wächter: `e2e/seitenbreite.e2e.ts`
(je Art Rahmen, Footer-Flucht, kein Querscroll, ≤ 80 Zeichen je Zeile — auch
mit simuliertem `weit`-Rahmen und Schriftskala 1.4). Eine Art wird `weit`,
indem man ihre Tabellenzeile ändert; der Wächter zieht mit.
*Startseite (`weit` seit 25.9.2026, Entscheid David «ja das soll optimiert
werden»):* die Breite geht an die Kachelspalte (Kacheln und aufgeklapptes
Blatt, 712 → 1032 px) und an «Häufig gebraucht» (drei statt zwei Spalten ab
52rem Flächenbreite); Schnellwerkzeug-Spalte (20rem), Kachel- und Blatthöhe
bleiben. Was mitwächst, darf die Höhe nicht treiben: die Kantone-Karte im
Gesetze-Blatt bleibt auf ihrer `content`-Grösse, damit U13 («kein Scroll beim
Aufklappen») hält. Gruss und Vertrauensfuss wachsen nicht mit. Wächter:
`e2e/startseite-breite.e2e.ts`.

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
(Startseite). **Massgeblich sind die Werte in `design/tokens.json`, nicht dieser
Text** (bis 22.9.2026: die Token in `src/index.css`) — F0 hält fest, welche Rolle
jeder Wert trägt. Was hier steht, überschreibt jede ältere Aussage dieses
Reglements über Farbe, Schrift und Form; die abgelösten Sätze stehen seit der
Konsolidierung als Einzeiler in der §-Konkordanz, ihr Wortlaut im Archiv.

**F0.1 — Papier und Tinte.** Zwei Flächen-Achsen, beide fast chromafrei; die
Trennung im Bild läuft über **Linien, nicht über Flächentönung**. Die
Flächen-L-Leiter `well < paper < surface < paper-raised` bleibt harter FAIL im
Tor (F2b Ziff. 4). Werte (D12 «Lesekomfort», 6.9.2026) → `design/tokens.json`
`paper`, `paper-raised`, `surface`, `well`/`paper-sunken`, `ink-900`, `ink-600`,
`rule` (= `ink-900`), `rule-soft`.

Die Tinte ist **bewusst nicht maximal dunkel**: `--ink-fixed-dark`
misst 14.68:1 auf Papier. Maximalkontrast (~17:1) erzeugt am Bildschirm Halation;
Zielband für Langlese-Fliesstext 12–15:1 (D12, Belege in
`abnahme/design-identitaet/KONTRAST-R1.md` Nachtrag D12). Reinschwarz/Reinweiss
als *Lesegrund* bleibt ausgeschlossen (§G d).

**F0.2 — Vier Registerfarben (Fassung 22.9.2026).** Als Strich, Reiter-Unterkante
und Randmarke (`--reg-g/r/m/w`) UND als Fläche — ausschliesslich über die
Flächen-Token `--reg-*-flaeche` (14 % Registerfarbe auf Papier, beide Modi; Werte
und Rezept: → `design/tokens.json` `reg-g` … `reg-w`, `reg-g-flaeche` …
`reg-w-flaeche`). Auf einer Fläche steht Tinte (`ink-*`), nie die Registerfarbe
selbst als Text (gemessen 22.9.2026, hell: `reg-m` 4.10:1 und `reg-w` 4.30:1 auf
der eigenen Fläche < 4.5). Nie allein bedeutungstragend (F2/B3); im
Normtext-Körper gilt weiter §N-4b-B (farbfrei). Kontrast-Schwellen unverändert;
die Paare — Registerfarbe auf den vier Flächen, Tinte und Registerstrich auf den
vier Flächen-Token — sind Pflichtpaare im Tor `check:farbwelt`
(`scripts/farbwelt-tabellen.ts`). Entscheid David 22.9.2026 («Farbe als Fläche:
ja», `FAHRPLAN-WERKBANK-UMBAU.md` §4 Ziff. 3), zuvor «nie als Fläche» (6.9.2026;
Wortlaut samt der datierten Ton-Abweichung vom Fahrplan: Archiv).

**F0.3 — Rollen-Schicht: der Akzent ist die Tinte.** Die Messing-Skala
`--brass-100…800` besteht als Werte-Träger fort, ist aber **neutral** geworden;
`--brass-700` zeigt per `var()` auf `--ink-fixed-dark`. Die Rollen-Schicht §G
bleibt der Zugriffsweg (`--accent-text` = `--brass-700` = Tinte, `--accent-solid`
= `--brass-500`, `--focus` = `--brass-700` hell / `--brass-500` dunkel).
Der Klassenname `*-brass-*` lügt damit bewusst bis zum Umbenennungs-Sweep — **die
Werte in `index.css` sind die Wahrheit, nicht der Name**. Status-Semantik
`sage`/`slate`/`warn`/`danger` bleibt unverändert gültig (B3, §N-4b-B).

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
Leser-Fliesstext 18 px / 1.62 (§N-4b).

**F0.5 — Form: Rundung mit Mass (Fassung 23.9.2026, W2·29-WERKBANK-GRUNDTON).**
David, Chat 23.9.2026: «ingesamt dürfen wieder mehr rudungen eingeführt werden sodass
es mordern wirkt aber nicht trashy» — «also das als grundregel für den gesamten umbau»;
am Prototyp: «runde Ecken nur für Kacheln/Flächen, Linien und Listen eckig». Die
Radius-Skala (`--radius-sm…2xl`, EIN Ort in `design/tokens.json`) steht auf
**4 · 8 · 10 · 14 · 14 px**: **14** Flächen, Kacheln, Blätter (`rounded-xl`) · **10**
Karten, Eingabe-Behälter, schwebende Ebenen (`rounded-lg`, `.lc-schwebeflaeche`,
`.lc-popover`) · **8** Knöpfe und Zeilen mit Hover-Grund (`rounded-md`, `.lc-btn`,
`.lc-menu-zeile`) · **4** Kleinst-Stufe für Marken und Inline-Hover (`rounded`) ·
**Pille** (`rounded-full`) für Chips ohne Registerstrich. **Gerade bleiben:** Linien,
Registerstriche (`.lc-chip`-Tick, `border-l-*`-Marken), Tabellen, Listentext und der
Normtext-Körper (Tabellen, Bilder, Hinweiskästen im Artikel). «Nicht trashy» heisst:
keine Verläufe, keine weichen Schatten-Kissen, kein Glanz. **Schatten** unverändert:
`--shadow-sm`/`--shadow-md` sind `none`; es gibt genau einen Schatten, `--shadow-lg`,
und er gehört ausschliesslich der **schwebenden Ebene**. Kein `lc-glass`.
*Abgelöst:* «Kanten statt Kissen» (W2·24-R1, 6.9.2026 — alle fünf Radius-Stufen 0 px,
Ausnahme nur `rounded-full` für Punkte/Marken ≤ 12 px); Wortlaut im Archiv
`archiv/DESIGN-REGLEMENT-BELEGE-2026.md`.

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
Kanten) gilt seit dem 6.9.2026 nicht mehr. *(23.9.2026: die Rundung kehrt mit Mass
zurück — F0.5 «Rundung mit Mass», W2·29-WERKBANK-GRUNDTON; aufgehoben bleibt die
Kissen-Anatomie der Creme-Welt, nicht jeder Radius.)* Betroffen sind **F5 · G a · G c · G d ·
G e-Zusatz · G f · G g · G h**; am Ort steht nur noch die geltende Fassung, je eine
Zeile «aufgehoben» in der §-Konkordanz, der Wortlaut im Archiv (konsolidiert
23.9.2026). Dort stehen auch die datierten Messreihen der F2b-Nachträge
D-3/D-4/D-5/QS-UI-8a wörtlich — abgelöst ist ihr Geltungsanspruch, nicht ihre
Richtigkeit (Belege altern nicht).

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
Massgeblich ist F0.4 (der aufgehobene Zusatz vom 6.9.2026: Konkordanz).

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
2. **Referenzwerte (harter FAIL bei Drift > ±0.06 — C-1/C-2/C-3):**
   dokumentierte Zahlen dürfen nie stillschweigend falsch werden (D3/F6). Die
   Tabelle samt Herkunftskette steht **einmal**, in §N-4b-B (bis 23.9.2026
   doppelt hier und dort); das Tor meldet Drift gegen genau diese Stelle. Der
   Fixpunkt `--paper` → `design/tokens.json` `paper`; die frühere
   Werte-Kette (D12 ← R1 ← A38) steht im Archiv.
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
   **Auf Ist gezogen (REST S5c, 25.9.2026):** der Ziel-Hue-88°-Satz galt für
   D-4 (13.7.2026) und wird nicht überschrieben (§0.2b). Seit
   `W2·24-DESIGN-IDENTITAET` R1 (6.9.2026, Beleg `design/tokens.json`
   ink-900-Eintrag) ist die ink-Rampe **chromafrei (C = 0, reines
   Neutralgrau)** — «die frühere Wärme (Hue 88°) WAR die halbe
   Creme-Gold-Signatur». Der Hue-Drift-Wächter greift bei C = 0 nicht mehr
   (OKLCH kennt dort keinen Hue); geprüft bleibt nur die L-Monotonie. Für
   `brass` gilt Ziff. 4 unverändert.

**F2b-Nachträge (D-3 12.7. · D-4 13.7. · D-5/A38 16.7. · QS-UI 8a 4.8.2026) —
Messreihen im Archiv, geltende Regeln hier.** Die Vorher/Nachher-Tabellen stehen
wörtlich in `archiv/DESIGN-REGLEMENT-BELEGE-2026.md`. Weiter gilt:

- **D-3:** Alle `color-mix`-Rezepte interpolieren in **oklab**. Neue Rezepte
  schreiben `color-mix(in oklab, …)`; `in srgb` ist für Farb-Rezepte nicht mehr
  zulässig (Ausnahme: keine bekannt).
- **D-4:** Hue-Drift und L-Monotonie der ink-Rampe (900…300 + `--placeholder`)
  sind harter FAIL (Ziff. 4); die Werte → `design/tokens.json`.
- **D-5/A38:** die Mechanik der Papier-Treppe (gestufte Flächen-Rollen, EINE
  Papier-Achse, L strikt steigend `well<paper<surface<raised`) gilt; ihre Werte
  hat D12 (6.9.2026) abgelöst → `design/tokens.json`.
- **QS-UI 8a:** `ink-900` und die Fläche `--paper-raised` sind Pflichtpaare,
  Status-Kanten werden auf ihrer eigenen Tönungsfläche gemessen, axe läuft auf
  allen Hauptrouten hell UND dunkel (`e2e/a11y.e2e.ts`, Block «Dunkelmodus
  flächendeckend»). `--warn-line` ist als einziger Linien-Ton von seiner
  `-500`-Mitte entkoppelt (`QS-UI-WARNLINE`) → `design/tokens.json` `warn-line`.
  **Bewusst NICHT aufgenommen** (§8 — die Lücke steht sichtbar statt still):
  `placeholder/paper-raised` dunkel und `brass-line/paper` hell; Begründung im
  Archiv.

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
Signal, nicht Tapete» (Wortlaut: Archiv). **Der Squint-Test bleibt als Ritual
gültig**, nur mit neuem Gegenstand: kneift man die Augen zu, darf allein die
**Registerfarbe** leuchten, und nur dort, wo sie ein Register benennt (F0.2).

**b — Ton vor Schatten.** Erhebung primär über Flächenton (`--paper`→`--surface`
→`--paper-raised`) + 1px `--line`; Schatten ist **sekundär**, erst ab
«schwebend» (Dropdown/Popover/Modal). Kein Schatten-Verbot (das `lc-card`-
Doppelsignal bleibt), aber die Regel: **Tiefe = Stufe + Border, nie Schatten
allein.**

**c — AUFGEHOBEN 6.9.2026 (W2·24-DESIGN-IDENTITAET R1)** · früher
«Temperatur-Dramaturgie» (Wortlaut: Archiv). Die Sammlung kennt **eine** Fläche
über die ganze Seite; sie wechselt ihre Temperatur nicht nach Route.

**d — Reinweiss-Invariante (im Gate) — Fassung 6.9.2026.** Kein `#FFFFFF`/
`bg-white` **als Lese- oder Arbeitsfläche**; Flächen kommen aus den Rollen
`--paper*`/`--surface*`. *Präzisiert (W2·24 R1/D12, ersetzt den früheren Zusatz
«`--paper-raised` ist nahezu weiss, aber nicht `#FFFFFF`»):* Reinweiss gibt es
seither **genau einmal im ganzen System** — als `--paper-raised`, die schwebende
Ebene (Menü/Dialog/Popover). Das Blatt selbst liegt eine Stufe darunter
(`--paper` `#FDFCFA`, Grundton der Werkbank seit W2·29-WERKBANK-GRUNDTON 23.9.2026; vorher `#FAF7F2`). Die Regel ist damit nicht gelockert, sondern verschärft:
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

*Zusatz 29.8.2026 («Mono trägt Struktur-Etiketten», Entscheid David) —
GEGENSTANDSLOS seit 6.9.2026:* `.lc-overline` setzt Archivo ohne Versalien
(F0.4/F0.7). Die Denkfigur «Etikett wird gescannt, Satz wird gelesen» bleibt
brauchbar, sie trägt nur keine Schriftwahl mehr. Wortlaut: Archiv.

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
Entscheid-/Referenz-Semantikton (§N-4b-B), **nie** eine Markenfläche — dieser Satz
gilt unverändert. *AUFGEHOBEN 6.9.2026 (W2·24 R1):* der Schlusssatz «brass bleibt
die Marke». Es gibt keine Markenfarbe mehr; die Identität trägt die Typografie
(Literata/Archivo) und der Register-Strich (F0.2/F0.4). Die dahinterliegende
Sorge bleibt gültig: **kein Kanzlei-Navy als Markenfläche** — `--reg-g` ist die
Kennfarbe des Registers «Gesetze», nicht die der Marke.

**i — Werkstoff- vs. Zustandsfarbe (F1, aufgelöst).** `sage` war doppelt belegt
(Materialien-Kennfarbe **und** ok/Live-Zustand). Aufgelöst: die Zustands-Rolle
**`--ok-*`** (wertidentisch zu sage, semantisch getrennt) trägt Status; die drei
namentlichen Sites `lc-badge-ok`/`lc-live`/`lc-termin-ring` sind darauf migriert
(§N-4b-B). `sage` bleibt Materialien-Familie + bibliografische Currency
(`lc-punkt-material`, `lc-chip-geltend`). Eine Status-Einfärbung ist damit nicht
mehr zweideutig.

**j — Interaktions-Zustände (F5).** Wärme-Verhalten von hover/active/selected
folgt EINER Regel: **eine Flexoki-Stufe «tiefer»** (mehr Chroma, weniger
Lightness) — die Rollen `--accent-hover`/`--accent-bg-hover` kapseln das.
Verhindert Patchwork bei künftigen Interaktions-Feinschliffen.

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

**Domänen-Abbildung (Konsolidierung 23.9.2026).** Verweise auf die vier früheren
Dateien lösen so auf:

| Alt | Neu (Teil II) |
|---|---|
| `DESIGN-REGLEMENT-NORMTEXT.md` L0 · §1 … §8 · §4a … §4c · §5a | **§N-L0** · **§N-1** … **§N-8** · **§N-4a** … **§N-4c** · **§N-5a** |
| `DESIGN-REGLEMENT-RECHNER.md` R1 … R14 | **§R-1** … **§R-14** |
| `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` R1 … R23 · A3-Regeln | **§J-R1** … **§J-R23** · **§J-A3** |
| `DESIGN-REGLEMENT-VORLAGEN.md` V1 … V7 | **§V-1** … **§V-7** |
| Zeilennummern (`…-NORMTEXT.md:405ff` u. ä.) in datierten Dokumenten | lösen im Stand `main@dc93425d9` der Ursprungsdatei auf, nicht hier |
| `DESIGN-REGLEMENT.md` «Audit»-Tabelle (§B2-/§B2b-Zeile …), §F2b-Nachtrag D-3/D-4/D-5/QS-UI 8a | `archiv/DESIGN-REGLEMENT-BELEGE-2026.md` (wörtlich) |

**Aufgehobene Regeln — je eine Zeile, Wortlaut im Archiv.**

| Regel | aufgehoben | Grund / Nachfolge |
|---|---|---|
| F0.1-Wert-Tabelle, F2b-Referenz-Doppel | 23.9.2026 | Werte → `design/tokens.json`; Referenz nur noch §N-4b-B (§5) |
| F0.2 «nie als Fläche» (samt Ton-Tabelle) | 22.9.2026 | Entscheid David «Farbe als Fläche: ja» → F0.2 neu |
| F5-Zusatz (Geist/Source Serif 4; «expressive Lesestile nicht in der Produkt-UI») | 6.9.2026 | W2·24 R1/R3 → F0.4 |
| G a «Brass ist Signal, nicht Tapete» | 6.9.2026 | Messing-Skala neutral (F0.3); Squint-Test bleibt |
| G c «Temperatur-Dramaturgie» | 6.9.2026 | eine Fläche über die ganze Seite (F0.1) |
| G e-Zusatz 29.8.2026 «Mono trägt Struktur-Etiketten» | gegenstandslos 6.9.2026 | `.lc-overline` = Archivo ohne Versalien (F0.4/F0.7) |
| §N-4b-A Gliederungslinie | 16.8.2026 | dreimal verworfen; Übersicht trägt die Seitenleiste mit Gliederungsbaum |
| §N-4b-C Tiefen-Einzug, Einzug-Skala | 29.8.2026 | EINE linke Textkante (geltende Fassung §N-4b-C) |
| §N-4b Brass als dritte Kanten-Sprache · Source Serif 4 · Versal-Marginalie | 6.9.2026 | Tinte/Registerfarbe · Literata · Gewicht + Tinten-Tier (Vermerk bleibt am Ort) |
| §N-4b-B Zeile «brass» | 6.9.2026 | vier Registerfarben (Wortlaut bleibt am Ort) |
| §N-4c Schalter «Linien» | 16.8.2026 | mit der Gliederungslinie entfallen |
| §J-R1/R2/R8 Juni-Werte `max-w-[56rem]`, `text-[1.08rem]`, `text-[1.1rem]`; §R-1 `rounded-2xl` | 23.9.2026 | auf den Ist-Code korrigiert (Befunde Design-System-Bau 22.9.2026 Nr. 2/3) |

---

# Teil II · Domänen

## N · Normtext — die Gesetzesdarstellung

*Ehemals `DESIGN-REGLEMENT-NORMTEXT.md`, konsolidiert 23.9.2026 (W2·29-WERKBANK-TOKENS, Rats-Auflage 2).*

Stand: 28.6.2026, erweitert 4.7.2026 (W2·5d G1). Auftrag David: «baue ein
fundiertes Regelwerk für die Darstellung von Bundesgesetzen und Verordnungen; es
soll mindestens die Qualitätserfordernisse von Fedlex haben». Geltungsbereich
**erweitert auf alle Gesetze (Bund + Kanton + International)**: **die Anzeige von
Gesetzes-/Normtext** im Gesetzleser (`src/pages/gesetz-leser/*`,
`src/components/normtext/*`, `src/lib/normtext/*`) und die Extraktion, die ihn
speist (`scripts/normtext*`). Detail-/Bau-Spec der UX-Reform:
`fahrplaene/FAHRPLAN-GESETZES-UX.md`.

Evidenz: das Fedlex-Datenmodell selbst (gecachte amtliche Konsolidierungs-HTMLs
unter `/tmp/*.html`, Struktur `div#preface` / `div#preamble` / `article` /
`div.dispositions` / `div.annex` / `div.footnotes`) sowie das
Vollständigkeits-Audit `AUDIT-FEDLEX-DARSTELLUNG-2026-06-28.md` (33 Lücken
bestätigt). Umbau-Plan: `fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md`.

### §N-L0 · Leitsatz (steht über allem)

> **LexMetrik bietet eine Gesetzesdarstellung, die *gleich fundiert* ist wie
> Fedlex — kein Informationsverlust, amtstreu — aber *nützlicher und
> praxistauglicher* als Fedlex und andere Konkurrenten.**

Daraus folgt die Tiefen-Steuerung jeder Entscheidung:

1. **Fedlex ist die Untergrenze der Fundiertheit, nicht das Ziel.** Was Fedlex
   für einen Erlass zeigt, *muss* bei uns abbildbar sein (oder ehrlich als
   «nicht abgebildet» markiert — nie still weggelassen).
2. **Bei der Darstellung dürfen/sollen wir Fedlex übertreffen** — ruhigeres
   Schriftbild, lückenloser Sprung-Index, interne Verzahnung (Norm→Norm), aber
   nie auf Kosten der Amtstreue.
3. **Reihenfolge der Tiefe:** zuerst was die Norm *fundierter/korrekter/
   vollständiger* macht, dann *Nutzen-Vorsprung*, zuletzt Kosmetik.

### §N-1 · Wortlaut ist unantastbar (oberste Invariante)

- Der **amtliche Wortlaut wird nie verändert** — wir normalisieren nur die
  *Darstellung* (Einzug, Marker-Position, Strich-Logik, Abstände).
- **Konkretisierung Tarif-/Anhangtext** (Freigabe David 17.6.2026, bestätigt
  Chat 4.8.2026): In Tarif- und Anhangtext dürfen fehlende **Trenn-Leerzeichen**
  zwischen Buchstabe↔Ziffer und ‰↔Ziffer für die Darstellung eingefügt werden —
  das ist Typografie-Reparatur der Extraktion, kein Wortlaut-Eingriff. Kein
  Zeichen des amtlichen Texts wird entfernt, ersetzt oder umgestellt.
  Umsetzung: `normalisiereTarifText()` in `src/components/normtext/ArtikelBody.tsx`.
- Eine Darstellungs-/Extraktions-Änderung, die den Sinn verschiebt, ist ein
  Bug, kein Feature. **Falsche Zitate sind schlimmer als gar keine.** Beispiel:
  verlorene Verschachtelungstiefe einer Aufzählung (Ziff. oben / lit. unten)
  erzeugt falsche Fundstellen → §1-Verletzung, höchste Priorität.
- **Plausibel-falsche interne Links sind schlimmer als tote.** Ein Verweis, der
  auf den falschen Artikel zeigt (z. B. VO-Selbstverweis statt Trägergesetz),
  wird unterdrückt, bevor er falsch verlinkt wird.

### §N-2 · Vollständigkeit gegen Fedlex (Fundiertheits-Floor)

Ein Bundeserlass besteht aus mehr als seinen Artikeln. Folgende Fedlex-Regionen
**gehören zur Norm** und dürfen nicht still fehlen:

| Region | Fedlex-Element | Status-Soll |
|---|---|---|
| Erlass-Kopf | `div#preface` (SR-Nr, Titel, **Erlassdatum «vom …»**, Stand, Kopf-Fussnoten) | abbilden |
| Ingress/Präambel | `div#preamble` (Erlassformel «… beschliesst:/verordnet:», bei BV materielle Präambel) + deren Fussnoten | abbilden |
| Artikel | `article` (Absätze, Aufzählungen mit **korrekter Verschachtelung**, Tabellen, Bilder/Formeln) | abbilden |
| Schluss-/Übergangsbest. | `div.dispositions` (datierte UeB-Blöcke; ZGB-Schlusstitel = 178 Art.) | abbilden *(B2)* |
| Anhänge | `div.annex` (Anhang 1, 2 … mit Tabellen/Verzeichnissen) | abbilden *(B2)* |
| Fussnoten-Apparat | `div.footnotes` (Quell-/Änderungsvermerke, AS/BBl-Zitate, **Hervorhebungen**) | abbilden |

**Markier-Pflicht (§8):** Was wir (noch) nicht abbilden, wird sichtbar als
solches markiert — nie als Vollständigkeit ausgegeben.

### §N-3 · EINE Quelle (Snapshot + Sidecar)

- Der **Normtext-Index** (`golden/normtext-snapshot.json` / `public/normtext/
  bund/*.json`) ist die *eine* Quelle des Wortlauts. Keine zweite Wortlaut-Quelle.
- **Anreicherungen, die den Wortlaut nicht verändern** (Erlass-Kopf/Ingress,
  Fussnoten-Hervorhebung, Wort-Offsets der Marker), liegen als **Sidecar** neben
  dem Index → der Index bleibt byte-gleich. Nur echter Normtext-Zuwachs
  (Verschachtelungstiefe, Tabellen-Köpfe, Bilder, doppelte-ID, neue
  Schluss-/Anhang-Einträge) verändert den Index **bewusst**.

### §N-4 · Darstellungsregeln (wo wir Fedlex erreichen + übertreffen)

- **Gliederung/Sprung-Index lückenlos.** Der TOC zeigt **alle** Randtitel einer
  Ebene — auch Blatt-Knoten ohne Unterknoten (Fedlex-Übertreffer: keine
  löchrige Buchstabenfolge wie «B, C, E»; ZGB-Einleitung muss A–E zeigen). Die
  Wurzel (`randtitelKnoten`) speist TOC **und** Fliesstext-Überschrift — Blatt-
  Randtitel im TOC nie mit der Artikel-eigenen Sachüberschrift doppeln.
- **Zusammengehörigkeit einheitlich.** Die Gruppierungs-Striche (zeigen, dass
  Artikel zusammengehören) folgen *einer* Logik — gleicher Strich überall, kein
  Mal-ja-mal-nein zwischen Knoten- und Blatt-Randtiteln. **(David 29.6.):** die
  Striche müssen **bei jedem Bund-Gesetz** vorhanden sein (Quelle: `<section …/lvl_…>`
  + `aria-level`, OR-Wurzel `part_`) — heute fehlen sie bei einigen. Zusätzlich ein
  **An/Aus-Umschalter pro Gesetz** (zustandslos), ob die Striche angezeigt werden.
- **Einheitliche linke Textkante.** Der Einzug ist gleich, ob ein Artikel
  nummerierte Absätze hat oder nur einen Block (`absatz=null`) — keine
  springende Textkante zwischen Artikeln. **Seit dem 29.8.2026 gilt das nicht
  mehr nur zwischen Artikeln, sondern über den ganzen Erlass** (§4b-C).
- **Aufgehobene Artikel: schlicht statt verspielt.** Ein voll aufgehobener
  Artikel zeigt als **dezente, immer sichtbare Statuszeile «· aufgehoben»** seinen
  Zustand (das *ist* der Artikelzustand, §2). Die amtliche **Aufhebungs-Zitatzeile**
  («Aufgehoben durch … [AS …]») ist eine Änderungs-Fussnote und steht — wie jede
  andere Fussnote — **hinter dem Fussnoten-Schalter, erst auf Klick** (Entscheid
  David 29.6.: einheitliches Fussnoten-Verhalten; vorher war sie bei Aufhebungen
  als einzige standardmässig offen). Kein eigener Accordion-Apparat je Artikel —
  derselbe Schalter wie überall. Ruhig, aber vollständig.
- **Fussnoten wie Fedlex.** Platzierung + Abstand folgen dem Fedlex-Ist
  (einheitlich, kein Mal-Abstand-mal-keiner); Hervorhebungen (fett/kursiv) im
  Fussnotentext bleiben erhalten.
- **Änderungsstatus ruhig.** Der Änderungsvermerk je Bestimmung («Eingefügt
  durch / Fassung gemäss / in Kraft seit / AS …») bleibt **hinter dem Fussnoten-
  Schalter** (David-Entscheid 28.6.: ruhiges Schriftbild > Oberflächen-
  Fundiertheit; der Inhalt ist da, auf Klick). **Einheitlich (David 29.6.):** auch
  die *Aufhebungs*-Zitatzeile («Aufgehoben durch … AS …») steht hinter dem Schalter;
  einzig die **Statuszeile «· aufgehoben»** bleibt immer sichtbar (sie *ist* der
  Artikelzustand, nicht die Fussnote).

#### §N-4a · Suche, Gliederung & Tabellen (QA-Sweep David 29.6.2026)

Detailplan: `archiv/FAHRPLAN-GESETZESDARSTELLUNG-BUND.md` (M4/M5/M7/M8/M10).

- **Suche ↔ Gliederung responsiv (M4/M5/M7).** Über alle Breakpoints: die Gliederung
  darf das **Suchfeld und die gefundenen Artikel nicht verdecken** (schmaler Viewport →
  Drawer/Overlay statt Überlagerung). Gliederung + Suche schliessen **kompakt an den
  Header** an (keine lose Lücke). Nach einer Suche springt der Treffer **vollständig
  sichtbar** an — nie unter den Sticky-Header geschoben/oben abgeschnitten (Scroll-Offset).
- **Treffer-Hervorhebung (M8).** Der im Gesetzes-Suchfeld gesuchte Begriff wird **im
  Normtext markiert** (sichtbares Highlight), nicht nur per Sprung angezeigt.
- **Tabellen-Layout (M10, → Tabellen-Regelwerk T-C/T-D).** Renderer ist **dumme Projektion**
  von `spalten.length`; Ausrichtung folgt dem **Spaltentyp** (Text/Bereich links,
  Zahl/Betrag rechts mit `tabular-nums`), **einheitlich pro Spalte** — kein zellweises
  Alternieren. Staffel-Spanne erscheint als **eine** linksbündige Zelle («über 100 bis
  500»), keine Phantom-Leerspalte. Mobil seitlich scrollbar (Zahlen brechen nicht um),
  ARIA-Tabellensemantik vollständig (Kopf↔Zelle), Kontrast/Fokus über Tokens (§13/F).
  Tausender-Apostroph/Währung sind **Anzeige**, nie im Snapshot (§7).

#### §N-4a-D28 · Die Erlass-Suche steht oben am Gesetz (David 6.9.2026)

**Der Ort ist Regel, nicht Geschmack.** Bis zum 6.9.2026 hatte das Such-/Sprungfeld
zwei Wohnorte — die Gliederungs-Spalte, solange sie stand, und den klebenden
Kopf-Block, sobald man sie einklappte. David dazu, wörtlich: «die suchleiste im
gesetz, welche sich oben an der gliederung befindet, will ich oben am gesetz —
dann verschiebt sie sich auch nicht, wenn gliederung eingeklappt ist; achte
darauf, dass dann das gleiche gilt.»

1. **Ein Feld, ein Ort.** Die Erlass-interne Suche liegt in JEDER Lage im
   klebenden Kopf-Block des Lesers (`v3/SuchZone.tsx`) — Desktop, Pane, Handy,
   Gliederung offen oder zu. Die Gliederungs-Seitenleiste trägt nur die
   Gliederung. Einzige Ausnahme: im modalen Gliederungs-Sheet steht das Feld in
   dessen Kopf, weil der Fokus den Dialog nicht verlassen darf (WCAG 2.4.3) —
   die Zone gibt es solange her, es bleibt bei **einem** Feld im DOM.
2. **Beim Klappen verschiebt sich im Kopf nichts.** Δx = Δy = 0 für Erlass-Suche,
   Kopf-Zone, Kopf-Griffe und Ansicht-Menü, wenn die Gliederung ein- oder
   ausklappt; nur die Textspalte ändert Lage und Breite. Der Kopf-Block liegt
   über der ganzen Rahmenbreite — die Zusage ist damit strukturell erfüllt und
   zusätzlich gemessen (`e2e/leser-klapp-sonde.e2e.ts`). Beim Ein-/Ausblenden der
   APP-Seitenleiste rückt der ganze Inhalt mit; dort gilt die Zusage **relativ
   zum Leser-Rahmen**, nicht absolut.
3. **Das Feld ist ein Feld, keine Wand.** Es wird auf `max-w-reading` (40 rem)
   gedeckelt — dieselbe Token-Breite wie die Lesespalte. Ohne Deckel erbt es die
   Rahmenbreite (gemessen 1072 px @1440).
4. **Zähler und Treffer-Schritt stehen in einer Zeile.** «N Artikel · M
   Fundstellen» und die Griffe ‹ › bedienen dieselbe Fundstellen-Folge wie ↑↓ im
   Feld und die Pfeile im Kopf der Trefferliste. Steht die Trefferliste bereits
   als Spalte daneben, **schweigt die Zone** — Zahlen und Schritt stehen dort,
   und zwei gleiche Listen übereinander sind ein §5-Bruch.
5. **Der Druck kennt keine Suchleiste.** Die ganze Zone fällt im Ausdruck, nicht
   nur ihre Knöpfe.

**Und die Ortsangabe steht genau einmal (D27).** Die Kopfzeile des Lesers trägt
keine Brotkrume und keinen laufenden Artikel mehr: der Ort steht im Reiter, den
der Scroll-Spy über `aktualisiereTabArtikel` (`lib/tabs.ts`) live führt; der
Erlass-Kontext steht im Titelblatt und als Kennung im Kopf; der Rücksprung steht
in der Hauptnavigation. Wer eine dieser Angaben ein zweites Mal in den Kopf
zurückholt, baut die Doppelkrume wieder auf, die der Entscheid vom 17.8.2026
abgeschafft hat. Protokoll mit Messreihen: `abnahme/design-identitaet/R6D.md`.

#### §N-4b · Linien-Kanon & Lese-Typografie (W2·5d G1, 4.7.2026)

Leitprinzip (aus Fedlex-Messung + SotA doppelt belegt): **Ruhe durch Reduktion.
Hierarchie über Typo-Abstufung, NICHT über Linien und NICHT über Einzug.** Der
Fliesstext ist der Held; die Struktur flüstert (Gegen-Lehre zu Fedlex, wo «die
Struktur schreit, der Rechtstext flüstert»). Rangfolge verbindlich: **Typo
(Gewicht/Grösse) trägt die Tiefe allein. Einzug, Linien, Farbe, Boxen nie.**
Der frühere zweite Rang «Einzug» ist am **29.8.2026** gestrichen (§4b-C), der
frühere dritte «eine dezente Guide-Linie» am 16.8.2026 (§4b-A).

**EINE Linien-Sprache — genau ZWEI benannte Rollen, sonst keine.** Vorher wurden
für strukturgleiche Trenner 4–6 Ad-hoc-Opazitäten desselben `--line` frei gewählt
(Artikel `/70`, Sektion voll|`/50`, Guide `/60`, Tabellenzeile/Fussnoten `/50–60`)
und bis zu ~6 parallele 1px-Linien stapelten sich («Barcode/Gleisbett», ZGB
Art. 684 / OR Art. 319). Neu (Tokens in `src/index.css` `:root` **und**
`html.dark`, abgebildet in `tailwind.config.js`):

| Rolle | Klasse | CSS-Var (hell / dunkel) | Wo (strukturell) |
|---|---|---|---|
| **Artikel-Trenner** (fein) | `border-t border-rule-artikel` | `--rule-artikel` (10 % / 14 %) | Artikel-Kopf, Tabellenzeilen, Fussnoten-Trenner |
| **Struktur-Trenner** (oberste Sektionen Teil/Titel/Abschnitt, eine Spur kräftiger) | `border-t/-b border-rule-struktur` | `--rule-struktur` (14 % / 20 %) | Sektionskopf ebene ≤ 1, Ingress |

Harte Regeln:
1. **KEINE vertikale Guide-Linie** (16.8.2026, §4b-A; früher: höchstens EINE
   Linie auf einer aufbau-abhängigen Ebene). Der Rollen-Token
   `--guide-gliederung` ist entfernt. **Und kein Tiefen-Einzug** (29.8.2026,
   §4b-C): die Tiefe trägt allein die Zwischen-Überschrift.
2. **Innere Sektionen (ebene ≥ 2) und randtitel-promotete Knoten** («A.», «II.»)
   tragen **keine** Horizontal-Linie (die frühere feine ebene-2-Linie entfällt);
   ihre Tiefe trägt die Typo.
3. **Marker-Scope + Chrome-Ausnahme:** die zwei Rollen gelten NUR an den mit
   `data-normtext-linie` markierten strukturellen Containern. Chrome-Borders
   (Such-Boxen, Buttons, Drawer, Nav, Fussnoten-Popover, Tabellen-**Aussenbox**)
   sind eine eigene, ausdrücklich ausgenommene Sprache — sie bleiben `border-line`
   bzw. tragen die zwei soliden Trenner des Dachs (`--rule-soft` 1 px,
   `--rule` 2 px, `DESIGN-REGLEMENT.md` F0.6), nie mit der Normtext-Linien-Sprache
   vermischt. *AUFGEHOBEN 6.9.2026 (W2·24-DESIGN-IDENTITAET R1):* die frühere
   dritte Sprache «**Brass** (Ziel-/Zitat-Kanten, Fussnoten-Links)». Die
   Messing-Skala ist neutral geworden und trägt keine eigene Kanten-Sprache mehr;
   was dort Brass hiess, ist heute Tinte bzw. Registerfarbe (Dach F0.3).

**Einzug-Skala — AUFGEHOBEN am 29.8.2026, s. §4b-C.** Hier stand die Skala
(`einzug` 20 px/Stufe, `einzug-mobil` 12 px, gedeckelt bei 5 Stufen). Die Tokens
sind aus `tailwind.config.js` entfernt, der Wortlaut steht auf **einer** linken
Kante.

**Lese-Typografie.** Lesespalte **hart auf einem benannten Token**, nie arbitrary
`max-w-[…rem]` (R2). Seit dem 29.8.2026 sind es ZWEI Deckel, der schmalere
gewinnt: der Pixel-Deckel `--leser-lesemass-max` (45 rem, 21.8.2026) und der
Zeichen-Deckel `--leser-zeilenmass` (~70 Zeichen, §4b-C). Fliesstext 18px Serif (über Fedlex 14px),
gedämpft `text-ink-800`, Flatterrand (nie Blocksatz). Die Serife ist seit dem
6.9.2026 **Literata** mit geladener `opsz`-Achse (`font-optical-sizing: auto`) und
dem Lesegewicht `--lese-gewicht: 450` — Bildschirm-Serifen brauchen optische Grösse
und etwas mehr Gewicht (D12, Belege in `abnahme/design-identitaet/KONTRAST-R1.md`
Nachtrag D12). *AUFGEHOBEN am 6.9.2026:* Source Serif 4 als Lese-Serife.
**`hyphens: manual`** (nicht
`auto`) auf dem Normtext-Body — die deutsche Auto-Silbentrennung an schmalen
Spalten war der sichtbare «Ge-werbes»-Treiber; `[overflow-wrap:anywhere]` bleibt
der Overflow-Schutz für lange Komposita. **Randtitel-Hierarchie:** Blatt/Sach-
überschrift `font-semibold text-ink-800`, oberste Marginalie `text-ink-500`,
dazwischen `text-ink-600`. *AUFGEHOBEN 6.9.2026 (W2·24 R1, Dach F0.7):* `uppercase
tracking-wide` an der obersten Marginalie — es gibt in der Sammlung keine
Versal-Etiketten mehr; die Hierarchie trägt allein Gewicht und Tinten-Tier.
Mehrzeilige Randtitel mit
**Hänge-Einzug-Schutz** (`text-indent:-1em` + `pl-[1em]`) gegen den Fedlex-AVOID
«1. Im / Allgemeinen».

**Artikelform im Leser (W2·24-R6b, 6.9.2026 — löst den dreispaltigen Satzspiegel
aus R4/R6 ab).** Auftrag David, wörtlich: «der platz rechts und links neben dem
gesetz für bspw. rechner oder fassung nimmt viel platz vom gesetzestext weg.»
Die beiden Randspuren (Marginalie 150 px links, Randnotizen 210 px rechts, dazu
zwei Rinnen à 36 px = **432 px**) sind **ersatzlos gefallen**. Es bleiben ZWEI
Formen, gerechnet in `pages/gesetz-leser/v3/satzspiegel.ts` und am DOM als
`data-lr-spiegel` ablesbar:

* `zeile` — Ist-Form: Randtitel als Zeile über der Artikelnummer, Beiwerk unter
  dem Wortlaut. Gilt im Pane (beide Hälften des Split-Views tragen dieselbe
  Form), auf schmalen Flächen, in der Trefferliste und ohne Rahmen-Provider.
* `breit` — ab **28 rem** Lese-Zelle in Spalten-Lage: der Randtitel steht als
  kursive Literata-Zeile IM ARTIKELKOPF über der Artikelnummer, das Fassungs-
  datum klein daneben (`.lr7-kopf`); der Kopf trägt seit D40 (#761, 7.9.2026)
  **keine** Bezüge mehr.

**Funktionszeile am Artikelende** (D34/D40, seit W2·26 in Überarbeitung — Zielbild
`FAHRPLAN-DESIGN-IDENTITAET.md` §9): EINE aufklappbare Zeile mit Registerfarben-Marken
(`.lr7-bez`, `parts/Funktionszeile.tsx`) je Artikel, unabhängig
von `zeile`/`breit` — beide Satzspiegel-Formen tragen dieselbe Zeile am Artikelfuss statt im
Kopf. Zustand lokal per `useState` (kein `<details>`, kein `localStorage`-Merker — jeder
Artikel startet beim Laden zu, D35). Die Rubriken (Fassung · Entscheide · Materialien ·
Verweise · Rechner) sind im Ansicht-Menü **einzeln** abwählbar (`leserOptionen.ts`,
`v3/LeserRubrikenWahl.tsx`); eine offene Rubrik zeigt ihren Inhalt im selben Aufklapp-Block —
nie zwei Blöcke zugleich (§5).

Das Gewicht des Randtitel-Blatts bleibt die Ä7-Stufe (13 px semibold ink-800);
kursiv und Serife kommen aus der Form, das Gewicht aus dem Entscheid. Im DRUCK
trägt der Kopf den Randtitel, die Funktionszeile ist ausgeblendet (`print:hidden`).

**Grösse und Zeilenhöhe des Fliesstexts: 18 px / 1.62** (`leser-text` in
`tailwind.config.js`). Die Zeilenhöhe stammt aus dem freigegebenen Referenzbild
`abnahme/design-identitaet/vorschlag-freigegeben.html` (`.norm { font-size:17px;
line-height:1.62 }`, seit 6.9.2026; davor 1.55). Die GRÖSSE steht seit W2·24-R6c
(6.9.2026) auf 18 px — D20 (c), Auftrag David: der Satzspiegel ohne Randspuren
gibt dem Lesetext die Breite, und der Lesekomfort (D12) verlangt die Stufe
darüber. Sie hängt an DREI Orten zusammen und darf nirgends einzeln wandern:
`tailwind.config.js` (`leser-text` = 1.125 rem), `src/index.css` (Block
LESER-SCHRIFTSKALA: die Reglerstufen 1.215 / 1.3275 / 1.4625 rem, Faktoren
1.08 / 1.18 / 1.30) und `src/pages/gesetz-leser/leserSchrift.ts` (`SCHRIFT_REM`,
Anzeigewerte 100 · 108 · 118 · 130 %). `src/tests/leser-schriftskala.test.ts`
hält die drei gegeneinander. Die Zahl steht in der
Typo-STUFE und nie im Markup — `src/tests/leser-typo-tokens.test.ts` verbietet
jedes `leading-…` am Fliesstext. WCAG 1.4.8 gemessen am gebauten Stand
(6.9.2026, Methode `e2e/leser-lesemass.e2e.ts`): lh 1.62 ≥ 1.5, Zeilenmass
OR 64 · StPO 64 · ZGB 64 · SchKG 63 · ZPO 62 · BS-640.100 56 Zeichen im
Satzspiegel @1400 (Decke 80, Hausgrenze 75) — Messung VOR R6c, s. die Messreihe
in §4b-C für den Stand mit 18 px.

**Maschinell gegated:** R1 `check:linien-kanon` (marker-scoped, in `npm run gate`),
R2 eslint (`no-restricted-syntax` gegen arbitrary `max-w-[…rem]` im Reader), R5
als Playwright-e2e (`leser-lesemass.e2e.ts`: WCAG-Decke ≤ 80 ch an drei Breiten,
Haus-Spanne 65–72 ch @ 1440 und @1280 an sechs Erlassen [Block T-1C], Mobil-Boden ≥ 31 ch /
kein horizontaler Overflow @ 390);
`leser-ohne-gliederungslinie.e2e.ts` hält fest, dass **keine** Guide-Linie
zurückkommt und **kein** Tiefen-Einzug — samt der Wirkungs-Gegenprobe «genau
EINE linke Textkante und EINE Textkörperbreite je Seite» (R4 «≤ 1 Guide je
Artikel» ist gegenstandslos und entfallen). **`golden/lexmetrik-golden.json` bleibt byte-gleich**
(der Reader liegt nicht in der Engine-Golden-Matrix); der amtliche **Wortlaut ist
unangetastet** (§1, Text-Extraktion vorher/nachher byte-gleich) — geändert sind
ausschliesslich Klassen/Attribute.

#### §N-4b-A · Gliederungslinie — AUFGEHOBEN (Rückbau V1, 16.8.2026)

**Es gibt im Lesetext keine vertikale Gliederungslinie mehr, und es soll auch
keine vierte geben.** Dieser Abschnitt regelte von Juli bis Mitte August 2026,
*wann* der Reader den Guide zeigt (Auto-Default aus Gliederungstiefe + Artikel-
Dichte, `linienProfil()`, `data-guide-auto`, K11-Tri-State-Schalter «Linien»).
Er ist mit dem Feature aufgehoben — der Wortlaut steht in
`archiv/FAHRPLAN-GESETZES-UX-erledigt.md` und in der Fassungs-Historie.

**Der datierte Anlass** — die Linie wurde dreimal gebaut und dreimal von David live
verworfen (5.7., 12.7., 3.8.2026), weil eine einzelne Linie «viele Ebenen»
strukturell nicht abbilden kann — steht samt Davids Wortlaut und dem Entscheid
vom 13.8.2026 (V1 Rückbau) wörtlich im Archiv. Vor jedem vierten Anlauf lesen
(Chesterton).

**Was die Aufgabe stattdessen trägt:** im Fliesstext die Typo (§4b Rang 1; der
Einzug, den dieser Absatz bis zum 29.8.2026 als Rang 2 mitnannte, ist mit §4b-C
ebenfalls fort); für die Übersicht «wo bin ich in
der Struktur» die Seitenleiste mit Gliederungsbaum, Scroll-Spy und Sprungziel
(`W2·19-GLIEDERUNG`, live seit 13.8.2026) — ein dafür gebautes, mächtigeres
Werkzeug als eine Linie am Spaltenrand.

**Maschinell gegated:** `check:linien-kanon` prüft nur noch die Linien-SPRACHE
(Teil A: zwei Rollen-Tokens, kein Ad-hoc `border-line` an markierten Containern);
das frühere Teil B (Aufbau-Regelwerk) wurde **gestrichen statt umgebaut**, weil
sein Gegenstand nicht mehr existiert und es nicht mehr rot werden könnte (§6.7).
Dass die Linie wegbleibt, hält `e2e/leser-ohne-gliederungslinie.e2e.ts` fest —
seit dem 29.8.2026 zusammen mit der Gegenprobe, dass auch der Einzug wegbleibt
und der Lesetext auf EINER Kante steht (§4b-C).

#### §N-4b-C · Tiefen-Einzug — AUFGEHOBEN, EINE linke Textkante (Entscheid David 29.8.2026)

**Der Wortlaut steht auf EINER linken Kante — über alle Gliederungstiefen, alle
Erlasse, Desktop wie mobil.** Die Tiefe trägt allein die Zwischen-Überschrift.

**Entscheid David 29.8.2026, wörtlich:** *«wichtige änderung … im gesetz die
staffelung aufzuheben. es soll alles auf der selben höhe stehen. … analog zu
fedlex»*. Damit ist die Regel «Tiefe ausschliesslich über Einzug» (§4b Rang 2,
W2·5d G1 / V2·L-1) aufgehoben — ersetzt, nicht ergänzt.

**Was der Einzug tatsächlich tat** (gemessen 29.8.2026, alle gerenderten
`.max-w-normtext` je Erlass): weil die Gliederungs-`section`s INEINANDER
stecken, summierten sich die 20-px-Stufen (mobil 12 px).

*(Messtabelle Textkanten/Textkörperbreiten je Erlass, 29.8.2026: Archiv.)*

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

*(Messreihe @1440 in vier Ständen — Staffelung, eine Kante, Deckel 68, Deckel 70: Archiv.)*

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

#### §N-4b-B · Farb-Wörterbuch der Referenzschicht (W2·5d V2·C-1, 10.7.2026, David «go zu allem»)

Grundsatz (David 10.7.2026, unverändert gültig): **Farbe NUR auf der Referenz-/
Verzahnungsschicht** (Chips, Badges, Kopf) — der **Normtext-Körper bleibt
farbfrei** (Rangfolge §4b: die Typo trägt die Tiefe allein; kein Ton im
Lesefluss). Das Wörterbuch ist EIN Entscheid je Farbe — kein Ton trägt zwei
Bedeutungen.

**Nachzug 6.9.2026 (W2·24-DESIGN-IDENTITAET R1, Dach `DESIGN-REGLEMENT.md` F0.2/
F0.3) — die Zeile «brass» ist ersetzt, die drei übrigen gelten unverändert.**
Der Referenzschicht stehen seither **vier Registerfarben** als einzige Farbe zur
Verfügung, je eine pro Register der Sammlung; die Messing-Skala ist neutral
geworden und trägt keine eigene Bedeutung mehr:

| Register | Token | hell | dunkel | Trägt sie |
| --- | --- | --- | --- | --- |
| Gesetze | `--reg-g` | `#1D4E89` | `#8FB8F0` | Norm-Kanten und -Punkte, Reiter-Strich Gesetze, Kantonskarten-Marke (`--karte-marke`) |
| Rechtsprechung | `--reg-r` | `#7A1F2B` | `#E39AA6` | Entscheid-Kanten, Reiter-Strich Rechtsprechung, Bezugs-Marke `r` |
| Materialien | `--reg-m` | `#2F7A3E` | `#9AD489` | Materialien-Kanten, Reiter-Strich, Bezugs-Marke `m` |
| Werkzeuge | `--reg-w` | `#8F5E0E` | `#E6B95A` | Rechner/Vorlagen-Kanten, Wahl-Kachel-Strich, Bezugs-Marke `w` |

Sie stehen als **Strich, Reiter-Unterkante und Randmarke**, nie als Fläche unter
Fliesstext, und tragen nie allein Bedeutung (`aria-hidden`, Wortlabel daneben —
§13/F2, WCAG 1.4.1). Alle sechzehn Paare (vier Töne × vier Flächen) halten
≥ 4.5:1 in beiden Modi und sind sämtlich Pflichtpaare im Tor; Messreihe
`abnahme/design-identitaet/KONTRAST-R1.md` D12.4.

*AUFGEHOBEN 6.9.2026:* die Zeile **brass** («Marke / Hervorhebung /
Wortlaut-Referenz»). Ihre Träger — Norm-KantenChip-Tick, ★-Leitentscheid-Glyph
(seit R11/D23 als **Wort** «Leitentscheid», nicht als Glyphe), Verweis-Links,
`lc-punkt`, NormChip-Hover, Norm-Familien-Punkt — bestehen fort, färben aber über
die neutrale Skala bzw. über `--reg-g` um. Der Wortlaut bleibt unten stehen,
damit Alt-Verweise auflösen; **als geltende Regel ist er ersetzt.**

| Ton | Bedeutung (die EINE) | Trägt sie |
| --- | --- | --- |
| **brass** (Messing) | Marke / Hervorhebung / Wortlaut-Referenz. Kein Rechtsstatus-Urteil. | Norm-KantenChip-Tick (`kategorie='norm'`, Default), ★-Leitentscheid-Glyph, Verweis-Links, Verweise-Overline-Punkt (`lc-punkt`, V2·C-2 — auf `--paper` in brass-600, s. u.), NormChip (Pillen-Default inkl. `hover:border-brass-400`, V2·C-3), Familien-Punkt der Norm-Gruppen (`punkt='norm'` an `KontextGruppe`, V2·C-3) |
| **slate** | **Neutraler Referenz-/Sekundärton** — maschinell/prozedural, ohne Wertung. Kein Rechtsstatus-Urteil, insbesondere **NICHT** «ungeprüft/in Vorbereitung». | Rechtsprechungs-KantenChip-Tick (`kategorie='entscheid'`: Leitfälle + zitierte Entscheide), Leitfälle-Overline-Punkt (`lc-punkt-entscheid`, V2·C-2), soft-Badges «maschinell»/«nur Verweis» (`lc-badge-soft`), Familien-Punkt der Entscheid-Gruppen (`punkt='entscheid'`, V2·C-3) |
| **slate-Umriss** (`lc-badge-geplant`) | **Status «geplant/in Vorbereitung»** (Status-Modell §8) — Umriss-Form wie die Entwurf-Marke, Ton neutral. *Entscheid David 31.8.2026 (W2·19/D-5, wörtlich «umriss grau»): schliesst die Lücke — vorher trugen fünf Stellen den Status in soft-Füllung bzw. warn-Umriss, beide von diesem Wörterbuch ausgeschlossen.* Kanonischer Wortlaut «In Vorbereitung». | `lc-badge-geplant` (Katalog, Zuständigkeits-Weichen, Vorlagen-Sprung, Sprachumschalter); Wächter: `design-konsistenz-chips-marken` |
| **warn** | Echter Fassungs-/Sachvorbehalt (eine Warnung, keine Ampel-Wertung des Entscheids). | Revisions-↻-Glyph (`glyphTon: text-warn-700`), Currency-Chip-Tick «nächste Fassung ab …» (`lc-chip-vorbehalt`, V2·C-2 — angekündigt, noch nicht in Kraft) |
| **sage** | **Materialien-Familie** (Botschaften/Vernehmlassungen/amtliche Soft-Law-Publikationen — kein Gesetzesrang) + Currency «geltend geprüft am … (maschinell)» — beides neutrale, maschinell-bibliografische Einordnung, KEIN Rechtsstatus-Urteil («(maschinell)»-Wording bleibt tragend, §7/§8). | Currency-Chip-Tick `lc-chip-geltend` (V2·C-2), Familien-Punkt der Materialien-Gruppen (`lc-punkt-material` via `punkt='material'`, V2·C-3: Entstehungsgeschichte/Botschaften, Vernehmlassungen, Amtliche Materialien) |

**slate-Doppelbelegung aufgelöst (David-Entscheid §3 Ziff. 3):** slate war latent
sowohl «Rechtsprechungs-Kante» als auch «ungeprüft/in-Vorbereitung-Status». Fixiert:
slate bedeutet ausschliesslich **neutrale, maschinell-prozedurale Referenzinformation
ohne Wertung** — beide Vorkommen (Entscheid-Chip UND soft-Badge) teilen genau diese
eine Semantik. Der einzige quasi-Status-Gebrauch (Revision) wandert nach **warn** und
verlässt damit slate. brass bleibt die Marke/Hervorhebung, nie ein Rechtsstatus (R16).

**Anatomie unverändert (§6/R6):** *(Messwerte dieses Absatzes = Stand 10.7.2026
bis 16.7.2026; die Ist-Zahlen stehen in der Tabelle darunter.)* Die
`kategorie`-Prop am `KantenChip` tauscht NUR
den Tick (`border-left-color`) und die Hover-Utilities; Form/Token/Grösse bleiben →
**CLS 0**, keine Layout-Verschiebung. Der Default `'norm'` emittiert die unveränderte
brass-Klassenzeile ⇒ Grundzustand **byte-gleich** (`golden:vergleich` IDENTISCH; die
zitierten Normen im KontextPanel bleiben brass). Kontrast als Gate gemessen
(WCAG 1.4.11 ≥ 3:1 für den Tick, 1.4.3 ≥ 4.5:1 für Glyphen) — **Ist-Werte
nachgezogen 6.9.2026 aus dem Tor-Lauf `npm run check:farbwelt`** (dokumentiert in
`scripts/farbwelt-tabellen.ts` `REFERENZ`; das Tor meldet «Referenz-Drift …
Zahl in DESIGN-REGLEMENT §N-4b-B nachziehen», wenn diese Tabelle von der
Messung abweicht — sie ist also gegatet, nicht Prosa):

| | Rolle | Tick/Glyphe auf `--well` | hell | dunkel |
|---|---|---|---:|---:|
| **C-1** | Rechtsprechungs-Tick `lc-chip-entscheid` | slate-500 | **5.04** | **3.38** |
| **C-2** | Currency-Chip «nächste Fassung ab …» | warn-700 | **5.49** | **9.20** |
| **C-3** | Akzent-Tick (**= Tinte**, früher Messing-★) | brass-700 | **14.28** | **14.19** |

Herkunft der Zahlen (Belege altern nicht, sie werden ergänzt): C-1 D-5 5.03/3.47 →
R1 4.86/3.47 → D12 4.86/3.38 · C-2 D-5 5.48/9.43 → R1 5.29/9.49 → D12 5.30/9.20 ·
C-3 D-5 5.13/10.48 (damals Messing auf hellerem Well) → R1 16.02/16.49 → D12
13.79/14.19 · GRUNDTON 23.9.2026 hell 5.04 · 5.49 · 14.28 (dunkel unverändert), weil
`--well` mit dem Werkbank-Grundton heller wurde (#F3F0EA → #F6F4F0). Der Sprung bei C-3 ist **kein Messfehler und keine Drift**, sondern
der Rollenwechsel: `--brass-700` zeigt seit R1 per `var()` auf die Tinte
`--ink-fixed-dark`.
*(D-5/A38, 16.7.: die HELL-Werte stiegen damals [4.81→5.03 · 5.24→5.48 ·
4.91→5.13], weil `--well` heller/weisser wurde [#F2EFE6→#F6F4EE]; DUNKEL
unverändert — s. `archiv/DESIGN-REGLEMENT-BELEGE-2026.md`, F2b-Nachtrag D-5.)*
`--slate-500` wird in `html.dark` bewusst NICHT überschrieben (Tick-Kontrast bleibt
gehalten). **Gegated:** `verzahnung.test` (Default byte-identisch, Entscheid-Slate,
↻-warn), Golden byte-gleich. **D-3-Neu-Messung (12.7.2026, color-mix srgb→oklab):
alle drei Referenzpaare UNVERÄNDERT** (Voll-Token auf solidem `--well`, kein
color-mix im Pfad); Details + `-bg`-Verschiebung im Archiv (F2b-Nachtrag D-3).

**V2·C-2 (Farb-Wörterbuch Teil 2, 11.7.2026, David «go zu allem») — zwei weitere
Bausteine, gleiche Anatomie-Disziplin (nur Tick/Punkt-Farbe, CLS 0):**

1. **Overline-Farbpunkte** ordnen die Referenzzeilen ihrer Farbfamilie zu:
   «Leitfälle» trägt den slate-Punkt (`lc-punkt-entscheid` = Rechtsprechung, deckt
   sich mit dem Entscheid-Chip-Tick), «Verweise» den brass-Punkt (`lc-punkt` = Norm).
   Der Punkt ist **redundant zum daneben stehenden Wortlabel** (`aria-hidden`, Farbe
   trägt NIE allein, §13/F2) und sitzt auf `--paper` statt `--well` — darum brass-**600**
   (nicht -500 wie der Chip-Tick auf well), damit die Füllung ≥3:1 hält.
2. **Currency-Chip-Tonung** gibt dem Fedlex-Freshness-Beweis Status-Semantik über den
   Tick: sage «geltend geprüft am … (maschinell)» (`lc-chip-geltend`) — neutral,
   maschinell, **kein Rechtsstatus-Urteil**; warn «nächste Fassung ab …»
   (`lc-chip-vorbehalt`) — echter Fassungsvorbehalt (angekündigt, noch nicht in
   Kraft). Das «(maschinell)»-Wortfeld bleibt tragend (§7/§8: keine
   fachliche-Abnahme-Suggestion). `--sage-500`/`--warn-500` in `html.dark` bewusst
   NICHT überschrieben.

Kontrast als Gate gemessen (WCAG 1.4.11 ≥3:1, Light+Dark, Desktop+Mobil@390,
Playwright): slate-Leitfälle-Punkt **5.21** hell / **3.31** dunkel; brass-600-
Verweise-Punkt **3.71** / **11.74**; sage-geltend-Tick **4.14** / **4.03**;
warn-vorbehalt-Tick **3.02** / **5.52** — alle ≥ Schwelle. **Gegated:**
`v2-c2-farbwoerterbuch.test` (Leitfälle-slate-Punkt, geltend-sage + «(maschinell)» +
kein «gegengeprüft/verifiziert», vorbehalt-warn, leer ⇒ kein toter Marker), Golden
byte-gleich. Gegenprüfung n/a (reines UI).

**V2·C-3 (Farb-Wörterbuch ABSCHLUSS, 11.7.2026) — das Wörterbuch ist damit
komplett; jede weitere Farbträger-Erweiterung MUSS sich in eine der vier Zeilen
oben einordnen (EIN Entscheid je Farbe), sonst neuer David-Entscheid:**

1. **Materialien-Familie = sage:** die Referenzgruppen-Überschriften
   (`KontextGruppe`, `punkt`-Prop `'norm'|'entscheid'|'material'`) tragen den
   Familien-Punkt ihrer Farbfamilie — Materialien-Gruppen (Entstehungsgeschichte/
   Botschaften, Vernehmlassungen, Amtliche Materialien; auch VerweisKontext) den
   **sage**-Punkt (`lc-punkt-material`), Entscheid-Gruppen slate, Norm-Gruppen
   brass. Ohne `punkt`-Prop KEIN Punkt (Werkzeuge/Revisionen bleiben neutral).
   Redundant zum Gruppentitel (`aria-hidden`, Farbe trägt NIE allein, §13/F2);
   `--sage-500` in `html.dark` bewusst NICHT überschrieben.
2. **NormChip-Verweisfarbe:** der Pillen-Default (`CHIP_LINK_CLASS`) trägt neu
   `hover:border-brass-400` — vorher der EINZIGE Norm-Chip ohne den brass-
   Hover-Border; jetzt EINE brass-Hover-Anatomie für die ganze Norm-Familie
   (KantenChip 'norm', rechtsprechung/NormChip, MassgebendeGesetze, NormChip).
   SSR-Assertions (`normLinkSsr.test`) deklariert nachgezogen (§6.3).

Kontrast als Gate gemessen (WCAG 1.4.11 ≥3:1, Light+Dark, Desktop+Mobil@390,
Playwright, auf `--paper`): sage-Punkt **4.48** hell / **3.84** dunkel;
slate-Punkt **5.21** / **3.31**; brass-600-Punkt **3.71** / **11.74** — alle
≥ Schwelle. CLS 0 (Punkt inline im Gruppen-h3, kein separater async-Mount;
Chip-Änderung hover-only). **Gegated:** `v2-c3-farbwoerterbuch.test` (Familien-
Punkt je Kategorie + Fremdfamilien-Ausschluss + neutral ohne Prop + NormChip-
brass-Hover), Golden byte-gleich. Gegenprüfung n/a (reines UI). §7-Befund
offengelegt: die frühere Annahme «0 lc-chip im prerenderten HTML» stimmt für
Rechner-/Vorlagen-Routen nicht (NormChip ist dort prerendert) — unschädlich,
Prerender wird je Deploy neu gebaut.

#### §N-4c · Leser-Darstellungsoptionen (W2·5d G2a, 4.7.2026; U-KOPF/A1+A4, 5.7.2026; V2·B-1/B-2/K-2, 11.7.2026)

**V2-Nachtrag (David 10.7.2026, überstimmt «genau drei Toggles»):** es waren
danach **vier** persistente, rein visuelle Umschalter im «Ansicht»-Dropdown —
**Linien · Fussnoten · Verweise · Entscheide** — plus ein JS-Filter **Zeitraum**
und, im aktionen-Slot, ein prominenter **Fussnoten-Chip**. Heute sind es **zwei**:
«Entscheide» wanderte am 28.7.2026 ins Dropdown «Rechtsprechung ▾» (W2·7-BEZUG/B4),
und **«Linien» ist am 16.8.2026 mit der Gliederungslinie ersatzlos entfallen**
(§4b-A). Die «genau drei»-Fassung von
§3.1/§10.5 (UX) ist damit ausdrücklich überstimmt (A22/A23). Details am Ende von §4c.

Die ursprünglich drei persistenten, **rein visuellen** Lese-Umschalter (Auftrag
David): ~~**Linien** (Gliederungs-Guide entfallen 16.8.2026, der Einzug am
29.8.2026, §4b-C)~~,
**Fussnoten** (Marker + Apparat sichtbar/verschwunden), **Verweise**
(Verweis-Link-Unterstreichung). Sie
liegen seit U-KOPF/A4 (David 5.7.2026) in **einem «Ansicht»-Dropdown im aktionen-
Slot des `ErlassLeserKopf`** (die frühere G2a-Chip-Leiste entfällt; Details im
U-KOPF-Nachtrag unten). Verbindliche Bau-Regeln:

1. **Mechanik = `data-*`-Attribut am `<html>` + CSS, kein React-State im
   Artikel-Baum.** Store `src/pages/gesetz-leser/leserOptionen.ts` setzt
   `data-fussnoten/-verweise/-leitfaelle` **imperativ** (Vorbild `components/thema.ts`);
   Umschalten rendert nur die Switch-Buttons neu, nie die Artikelliste (§15). Die
   CSS-Regeln stehen in `src/index.css`, **auf `.lc-leser` gescopt** (nur der
   Reader, nicht das Norm-Popover der Rechner).
2. **Pre-Paint CSP-konform.** Angewandt in `main.tsx` VOR `createRoot` (analog
   Thema/Schriftskala) — **kein Inline-Script** (`script-src 'self'`, vercel.json
   verbietet es). Persistenz in localStorage `lm.leser.optionen`.
3. **Default = 'an' = heutige Darstellung** ⇒ `data-*="an"` ist ein CSS-No-op ⇒
   Grundzustand **byte-gleich** (R6, `golden:vergleich` IDENTISCH). Der frühere
   `data-linien="aus"`-Zweig, der Guide + Einzug ausblendete, ist mit der
   Gliederungslinie entfallen (§4b-A); die Einzug-Klassen, die er schaltete, gibt
   es seit dem 29.8.2026 überhaupt nicht mehr (§4b-C).
4. **Fussnoten-«AUS» lässt Marker + Apparat VERSCHWINDEN** (U-KOPF/A1, David
   5.7.2026 — überstimmt die frühere R9-Dämpfungs-Regel; s. U-KOPF-Nachtrag).
   `display:none` am Marker-Cluster (`button[aria-label^="Fussnote"]`,
   `[data-fn-marker]`) und am Apparat (`[data-fn-apparat]`); der Fussnotentext
   bleibt im DOM (`#fn-…`), «AN» stellt alles wieder her. Der **Normtext** ist NIE
   betroffen und bleibt stets durchsuchbar. **Verweise-«AUS»** unterdrückt nur die
   Unterstreichung; Farbe und Anker/Funktion bleiben.
5. **Global ⇒ beide Reader-Instanzen** (Einzelansicht + jedes Split-View-Pane)
   folgen einer Wahl ohne Re-Render. a11y: echte `role="switch" aria-checked`,
   sichtbarer Fokus über die globale `:focus-visible`-Outline.

**Gegated:** e2e `leser-optionen` (R6 + A1-Verschwinden positiv+negativ + CLS 0 +
Persistenz/Reload) + `leser-kopf-a9` (A9-Throttle) + `golden:vergleich` byte-gleich.

**G2b-Ergänzung (4.7.2026) — Fussnoten-Unifizierung umgesetzt:** Es gibt jetzt
**EINE** Fussnoten-Bedienung: der `data-fussnoten`-Options-Toggle. Der frühere
`fussnotenAuf`-React-Schalter (Such-Leiste) ist **entfernt**. Marker UND Apparat
(Artikelfuss-/Kopf-/Sektions-Fussnoten, Aufhebungsnotiz) liegen **IMMER im DOM**
(nur an `artOffen` gebunden). **Default AN.** Der **Linien**-Default ist mit
U-LINIEN/A8 aufbau-basiert festgelegt (§4b-A) — er löst den zwischenzeitlich
grundart-abhängigen G3a/K11-Default ab.

**U-KOPF-Nachtrag (5.7.2026, David-Entscheide) — deklarierte fachliche Änderungen:**

- **A1 — Fussnoten-«AUS» = VERSCHWINDEN (überstimmt R9/K5).** Davids Entscheid
  («die fussnoten sollen nicht abdunkeln wenn nicht angewählt sondern
  verschwinden») ersetzt die frühere Regel «AUS dämpft nur, versteckt nie». Neue
  R9: **«AUS» entfernt Marker + Apparat visuell** (`display:none` an
  `button[aria-label^="Fussnote"]`, `[data-fn-marker]`, `[data-fn-apparat]`); der
  **Fussnotentext bleibt im DOM** (`#fn-…`-Quellblöcke), «AN» stellt Sicht + Ctrl+F
  vollständig wieder her. **Trade-off** (bewusst, David): die Marker-Ziffern +
  Apparat-Texte verlassen bei AUS Ctrl+F/Screenreader — **NUR sie, nie der
  Normtext** (die amtliche Substanz des Artikels ist unberührt und stets
  durchsuchbar). **Print-Verhalten: folgt dem Toggle** — bei AUS wird der Apparat
  auch im Ausdruck weggelassen (`display:none` wirkt in `@media print`
  gleichermassen); bei AN wird er gedruckt. **CLS:** der Toggle ist
  nutzer-initiiert ⇒ der Reflow liegt binnen 500 ms nach dem Klick
  (input-exkludiert) ⇒ kein CLS-Beitrag (e2e-belegt). Default AN emittiert keine
  Regel ⇒ byte-gleich (R6).
- **A4 — «Ansicht»-Dropdown statt Chip-Leiste.** Die drei Switches liegen in einem
  Dropdown im aktionen-Slot des `ErlassLeserKopf` (`LeserAnsichtMenu.tsx`). **A11y:
  ehrliche Disclosure, KEIN `role=menu`** (Switches sind Formular-Steuerelemente —
  ein Menü verspräche eine Pfeiltasten-Bedienung, die es nicht gibt; gleiche Lehre
  wie `SprachUmschalter`): Trigger «Ansicht» mit `aria-expanded` + `aria-controls`,
  Panel = `role="group" aria-label="Darstellungsoptionen"`. **Fokus-Falle + Escape +
  Fokus-Rückgabe** an den Auslöser via `useDialogFokus`; pointerdown-ausserhalb
  schliesst. Panel **absolut positioniert ⇒ kein Layout-Shift der Seite**.
  Persistenz-/Pre-Paint-Mechanik unverändert darunter. **pdf-embed** trägt bewusst
  KEIN Ansicht-Dropdown (keine toten Steuerelemente, G2b/§13 F4).
- **A3 — Positions-Leiste = echte Breadcrumbs.** Der Sticky-`SektionKontextKopf`
  ist zu klickbaren Breadcrumbs aufgelöst (`nav[aria-label]` > `ol`/`li`, jedes
  Glied ein Button → `springeZuSektion`, letztes Glied `aria-current="location"`).
  Datenquelle bleibt die vorhandene Scroll-Spy-State (kein neuer Observer, §15).
  Overflow-/Mobil-Kürzung rein per CSS (Label `truncate`, `nav` `overflow-hidden`,
  mittlere Glieder `hidden sm:inline-flex` + «…»-Platzhalter). Der Sticky-Positions-
  Kopf bleibt — wie bisher — ein **≥ 1024px-2-Spalten-Feature** (mobil keine
  Positionsleiste).

**V2-Nachtrag (David 10.7.2026 «go zu allem», koordinierter Kopf-PR 11.7.2026) —
deklarierte Erweiterungen (überstimmen «genau drei Toggles»):**

- **B-1 — 4. Toggle «Entscheide» (Default AN).** Blendet die verlinkten BGE-Leitfall-
  Zeilen aus — **reine Referenzschicht, der Normtext ist NIE betroffen.** Mechanik =
  data-* + CSS wie die anderen Toggles: `leserOptionen.ts`-Feld `leitfaelle`,
  `html[data-leitfaelle="aus"] .lc-leser [data-leitfall-zeile]{display:none}`
  (Marker `data-leitfall-zeile` an `LeitfallZeile`). Default 'an' ⇒ CSS-No-op ⇒
  byte-gleich (R6); kein React-Re-Render (§15).
- **B-2 — Zeitraum-Filter «alle · 20 · 10 · 5 J.» (Default alle).** KEIN data-*-
  Toggle, sondern JS-Filter der client-only-`LeitfallZeile` über `r.datum` (jahr-
  genau, Q1/Bandjahr-sicher; unparsbares Datum konservativ behalten, §8) VOR der
  Sichtbarkeits-Kappung (`LEITFAELLE_SICHTBAR` 5→**10**, David 10.7.). Abo über
  **Primitiv-Selektor `useLeitfallZeitraum()`** (nur der String ⇒ Zeilen rendern nur
  bei echter Zeitraum-Änderung, nicht bei jedem anderen Toggle — §15-Zusage bewiesen).
  §8: eine voll weggefilterte Zeile verschwindet NICHT kommentarlos, sondern zeigt
  «n ältere ausgeblendet · alle zeigen» (klickbar). A11y: `role="group"`, Buttons mit
  `aria-pressed` (kein `radiogroup` → keine unerfüllte Pfeiltasten-Erwartung).
- **K-2 — Fussnoten-Chip im aktionen-Slot (`LeserFussnotenChip`).** Prominentes
  KOPF-SIGNAL «❡ N Fussnoten» (N = Summe der Sidecar-Fussnoten) UND **echter Toggle**
  (aria-pressed) auf denselben `fussnoten`-Wert wie der Dropdown-Schalter; beim
  **Einschalten** springt er zum Apparat (erst einschalten, dann `scrollIntoView` des
  ersten `[data-fn-marker]` — nie in ein display:none-Ziel). `N===0`/Sidecar noch
  nicht geladen ⇒ kein Chip (CLS-schonend, e2e-gemessen CLS 0).
- **Slot-Layout (U-PDF, EINMALIG):** Reihenfolge **Ansicht · Fussnoten · In neuem
  Reiter · Download**; das Ansicht-Dropdown öffnet mobil-sicher rechtsbündig
  (`right-0 sm:left-0`).

### §N-5 · Verzahnung (der Burggraben, Fedlex-Übertreffer)

- **Norm → Norm intern.** Ein SR-Verweis in Fussnote/Fliesstext, dessen
  Zielerlass wir im Volltext haben, verlinkt **intern** auf den LexMetrik-Leser
  (`/gesetze/bund/<KEY>#art_<N>`) — man bleibt im Werkzeug. Nur wo wir den
  Erlass nicht haben, bleibt der **Fedlex-Link als ehrlicher Fallback**.
- **Quelle für «haben wir den Erlass?»** ist das Register (§3, eine Quelle) —
  kein zweiter Pfad.
- **Stand-Transparenz (§8).** Solange nur ein Geltungsstand existiert (bis
  Versionierung, B3), kann der intern gezeigte Stand vom zitierten abweichen →
  der Stand wird transparent markiert, nicht stillschweigend gleichgesetzt.

#### §N-5a · Inline-Verweis-Linker: Plural, Präambel, Popover-Struktur (W2·5d U-VERWEIS / A7+A10+A11+A13, 10.7.2026)

1. **Plural-Aufzählungen werden gliedweise verlinkt (A10).** Die Öffner
   «Artikeln N …» (Dativ-Plural) und «die|der Artikel N, M …» (Letzteres nur bei
   ≥ 2 Gliedern oder Gesetz-Signal) zerlegt `artikelnPluralVerweise` (fedlex.ts)
   deterministisch in Einzel-Glieder; jedes Glied ist ein eigener Link, die
   Anzeige bleibt der exakte Quelltext (§1). **Bounded:** die Passus-Kette ist
   typ-treu (SINGULAR-Schlüsselwort «Absatz/Buchstabe/Ziffer/Satz» = genau EIN
   Wert; Plural-Form und Abkürzungen = Wertliste mit Glied-Kopf-Guard); die Kette
   bricht an allem, was kein «Konnektor + Zahl» ist — nie über den Fliesstext
   hinaus (Referenzfall MWSTG Art. 5 = genau 5 Links art_31/35/37/38/45).
2. **Auflösungs-Modi mit §1-Vorrang.** Gesetz-Signal am Aufzählungs-Ende
   (Rangfolge: Klammer-Kürzel ∈ FEDLEX > kuratierter Genitiv-Kurztitel > bare
   Kürzel ∈ FEDLEX) ⇒ alle Glieder aufs Fremdgesetz. UNTERDRÜCKT (kein Link, nie
   ein geratener) wird bei: unbekanntem Klammer-Kürzel («(Code civil)»),
   unauflösbarem ausgeschriebenem Fremdnamen («des Bundesgesetzes vom …»),
   unbekanntem bare Kürzel («BGSA»), nicht parsebarem Glied («42octies»). Ohne
   Signal = Self; Self-Glieder linken nur, wenn das Token im eigenen Erlass
   existiert (§8, kein toter Link).
3. **Genitiv-Map ist KURATIERT, nie generisch (A11).** `GENITIV_GESETZ`
   (fedlex.ts) enthält nur eindeutige amtliche Kurztitel-Genitive («der
   Bundesverfassung»→BV, «des Strafgesetzbuches»→StGB …), jeder Eintrag gegen den
   amtlichen Kurztitel belegt; generische Wendungen («des Bundesgesetzes», «der
   Verordnung») bleiben BEWUSST ohne Eintrag. Soft-Hyphens (U+00AD) der
   Fedlex-Texte werden toleriert.
4. **aBV-Schutz im Ingress (A11, §1).** Der Ingress ist historisch (wird amtlich
   nie nachgeführt): Erlasse vor 2000 zitieren dort die BV von 1874 — «Artikel 26
   der Bundesverfassung» im ArG (1964) meint aBV 26, nicht die heutige
   Eigentumsgarantie. Präambel-Zeilen laufen darum NUR bei parsebarem Erlassdatum
   ≥ 2000 durch den Linker (`ingressVerlinkbar`, parts.tsx); sonst reiner Text.
   Artikel-FLIESSTEXT ist ungegated (BV-Zitate werden dort bei Revisionen
   amtlich nachgeführt; Belege ASYLG 121a, RVOG 184).
5. **Verweis-Popover ist strukturiert (A7):** Artikel-Wortlaut → Provenienz-Fuss
   (§7 a–d) → «Wird zitiert von · Massgebliche Entscheide» → klar abgetrennt
   «Legt aus · Amtliche Materialien» (`VerweisKontext`, wiederverwendete
   Verzahnungs-Grammatik: KontextGruppe-Hülle, Richtungs-Label als Text,
   StatusBadge-Vokabular). Kompakt Top-3 + Zähler + «Alle n»-Link; lazy aus den
   erlass-lokalen Shards (geteilte Promise-Caches, §15.3); ANS ENDE des Popovers
   angehängt ⇒ CLS 0 by construction.
6. **Materialien-Dichte-Regel (A13):** artikelscharfe Kanten prominent zuerst
   (Fundstellen-Sublabel, Behörden-Kürzel, Dokument-Stand); reine
   Erlass-Ebene-Kanten dezenter hinter dem Zähler («n Dokumente auf
   Erlass-Ebene», `<details>` — tastatur-/CLS-fest). Keine Chip-Wüste.

**Gegated:** Unit `fedlex.test.ts` (Plural-Grammatik + Negativfälle + Genitiv-Map)
+ `normText.test.tsx` (SSR-Linkmengen, MWSTG-Regressionsfall) + `verweis-kontext.test.ts`
+ e2e `verweis-u` (P2-Beweise, A9-Throttle, aBV-Negativfall) — Risiko-Pfad ⇒
`check:gegenpruefung`.

### §N-6 · Verweis-Ziele werden nicht geraten

Linkziele kommen aus dem, was Fedlex tatsächlich kodiert / aus dem Register —
**nie aus einer Render-Zeit-Heuristik**, die «Artikel N» reflexhaft auf den
gerade gelesenen Erlass auflöst. In einer Verordnung verweist «Artikel N» fast
immer aufs **Trägergesetz** (BGerR → BGG), nicht auf sich selbst. Bis das
positive Trägergesetz-Routing als verifizierte Datenaufgabe steht, werden
falsche Selbstverweise **unterdrückt** (§1: lieber kein Link als ein falscher).

### §N-7 · Golden-Regel (zwei Welten strikt trennen)

- **`golden/lexmetrik-golden.json` (Engine/Rechtslogik) ist TABU** und muss über
  den *ganzen* Batch **byte-gleich** bleiben (`golden:vergleich` = IDENTISCH =
  Beweis, dass die Rechtslogik unberührt ist). **Bricht er, ist man versehentlich
  in eine Engine gelaufen → sofort STOPP, nie das Tor aufweichen.**
- **`golden/normtext-snapshot.json` (Daten-Index)** wird bei bewusstem Normtext-
  Zuwachs **regeneriert und neu gesegnet** (self-consistent sha, kein externer
  Erwartungswert) — **mit adversarialer Gegenprüfung** und **genau einer**
  Re-Segnung pro Batch (alle golden-brechenden Änderungen zuerst landen, dann ein
  Regen-Block, dann ein Pathspec-Commit; `--stat`-Dateizahl gegen die add-Liste).
- **Sidecar-Anreicherungen (§3) brechen den Index nicht** → bleiben byte-gleich.

### §N-8 · Keine stillen Lücken

Jede nicht abgebildete Information ist **sichtbar markiert** (z. B. «maschinell»,
«nicht abgebildet», «Stand abweichend»). Kein `verified`/«vollständig» ohne
Deckung. Bilder, die wir als Bild zeigen (math. Formeln liefert Fedlex als
Bild), bleiben Bild — kein erfundenes OCR/LaTeX, ehrlich dokumentiert.

### §N · Was bewusst NICHT gilt (Audit-widerlegt)

Diese im Audit geprüften Punkte sind **kein** Defizit und werden **nicht**
gebaut: Titel-`<br>`-Plättung, Absatz-`<p>`-in-`<table>`-Verschlucken, «Fussnoten-
Apparat per Default aus» (galt bis W2·5d — **abgelöst durch die G2b-Fussnoten-
Unifizierung §4c: Marker/Apparat liegen jetzt immer im DOM, Default AN; «AUS»
lässt sie seit U-KOPF/A1 VERSCHWINDEN (display:none), der Normtext bleibt stets
durchsuchbar**), volle
`rowspan`-Logik (rowspan/verschachtelte
Tabelle → ehrlicher Text-Fallback), «N.—»-Spacing,
`art-`-vs-`art_`-Anker, «Deeplink vom Renderer verworfen» (wird genutzt). Details:
`AUDIT-FEDLEX-DARSTELLUNG-2026-06-28.md`, Abschnitt «Widerlegt».

> **Korrektur 29.6.2026 (verifiziert gg. Filestore-HTML):** Der Audit-Schluss
> «`<th>`-Tabellen brauchen kein `colspan` (Kopf+Daten tragen dasselbe)» ist an
> **GebV SchKG Art. 20 falsifiziert** — dort trägt **nur der Kopf** `colspan="3"`,
> die 6 Datenzellen sind colspan-los → Kopf 2 ≠ Zeile 6 = zerrissen. Neue Regel:
> `colspan` wird in **beiden** Markup-Varianten expandiert und die Staffel-Spanne zu
> einer logischen Zelle verdichtet (Tabellen-Regelwerk T-A2/T-A3/T-A6 in
> `archiv/FAHRPLAN-GESETZESDARSTELLUNG-BUND.md`). Nur `rowspan`/Verschachtelung bleibt Fallback.

## R · Rechner — verbindlicher Aufbau jeder Engine-UI

*Ehemals `DESIGN-REGLEMENT-RECHNER.md`, konsolidiert 23.9.2026 (W2·29-WERKBANK-TOKENS, Rats-Auflage 2). Die Regel-Codes R1–R14 dieser Domäne = §R-1 … §R-14.*

Stand: 11.6.2026 (Auftrag David 10.6.2026 spätnachts: «Regeln für den
Designaufbau von Engines aufstellen, sodass es eine übersichtliche und
einheitliche Struktur hat und die Reihenfolge der Webseite von oben nach
unten Sinn ergibt»). Geltungsbereich: alle Rechner-Seiten und ihre
Formulare (`src/pages/Rechner*.tsx`, `src/components/forms/*`).
Vorlagen-Wizards folgen ihrem eigenen Muster (Stepper/Dokumentmappe) und
sind hier nur dort erfasst, wo sie Rechner-Bausteine wiederverwenden.

Leitidee (Design-Haltung): **Das Verdikt zuerst, die Herleitung auf
Abruf, die Pflichten sichtbar.** Eine Anwältin, die den Rechner zum
zehnten Mal nutzt, findet jeden Baustein an derselben Stelle; wer ihn
zum ersten Mal nutzt, liest die Seite von oben nach unten als Fall:
Worum geht es → Was gebe ich ein → Was gilt → Warum gilt es → Was
nehme ich mit (PDF/Termin/Link).

### §R-1 · Seiten-Skelett (Reihenfolge fix)

```
1. RechnerKopf            (Band von layout/WerkzeugKopf: Serif-h1, Kategorie, Norm-Chips — immer)
2. TagerechnerRueckverweis (nur nach R2)
3. Werkzeug-Karte          (Card, components/ui/Card.tsx: .lc-werkzeug-karte p-6 sm:p-8 — Strich --reg-w oben)
   └── genau EIN Formular (bzw. Tab-Weiche über Teil-Formulare)
4. EreignisFristenSektion  (nur nach R9)
5. Themen-Einstieg         (Vorlagen-Direktlinks, nur nach R10)
```

*Ziff. 3 korrigiert 23.9.2026 auf den Ist-Code (Befund Design-System-Bau Nr. 3):
die Karte ist seit dem U2-Nachzug 6.9.2026 der Baustein `Card` ohne
Seitenrahmen und Füllung; `rounded-2xl` war mit R1 (`--radius-2xl: 0px`)
wirkungslos und fiel weg. Juni-Wortlaut: Archiv.*

Keine weiteren freien Blöcke auf Seitenebene. Seiten-Sonderfälle:
Tagerechner (Schnellrechner + Preset-Suche + Regime-Tabs, FE-1/FE-2)
und Zuständigkeit (Rechtsweg-Tabs mit Kopf-Override, S-3) sind
disponierte Ausnahmen — innerhalb ihrer Teil-Formulare gilt R3 ff.
unverändert.

### §R-2 · Rückverweis-Regel

Den `TagerechnerRueckverweis` tragen genau die **materiellen
Fristen-Spezialrechner**, deren einfache Fälle (Datum + feste Länge,
kein Regime) der Tagerechner abdeckt: Kündigung, Erb-Fristen,
Mietrecht, Verjährung, Gewährleistung (FE-4-Entscheid). Verfahrens-
Regime-Rechner (ZPO, SchKG) tragen ihn NICHT — ihre Fälle sind nie
regime-frei, und sie sind selbst als Tab im Tagerechner erreichbar.
Beträge-/Zuständigkeits-Rechner tragen ihn nicht.

### §R-3 · Formular-Skelett (Reihenfolge fix)

```
1. PflichtDisclaimer       (kurz + text, R7 — immer zuoberst)
2. Anwendungsfall/Preset   (SelectionGrid · Tabs · Vorlage-Dropdown — falls vorhanden)
3. Eingabe-Felder          (grid sm:grid-cols-2 gap-4, Field-Wrapper)
4. Optionale Funktionen    (EIN Akkordeon «Optionale Funktionen (…)» — falls vorhanden)
5. FehlerBox               (R8 — einzige Fehlerdarstellung)
6. Ergebnisblock           (R4 — nur wenn ein Ergebnis vorliegt)
```

Beispiel-Chips (`BeispielChips`) stehen, wo vorhanden, zwischen 2 und 3.
Das Aktenzeichen ist KEIN Eingabefeld des Falls, sondern Teil der
Mitnahme — es steht im Ergebnisblock (R4 Ziff. 5), nicht bei den
Eingaben.

**Eingabe ‖ Ergebnis (W2·31-BILDSCHIRMBREITE B3, 25.9.2026).** Ab 72rem
Innenbreite der Werkzeug-Karte (`@container/rechnerkarte` an `ui/Card`;
praktisch: Stufe `weit` ab 2xl, ohne offene Seitenleiste) stehen Ziff. 1–5
links und Ziff. 6 (bzw. der `ErgebnisPlatzhalter`, R13) rechts, beide ab
derselben Oberkante. Das Formular wählt die Anordnung mit der Klasse
`lc-rechner-spalten` an seiner Wurzel; der Ergebnisplatz muss deren direktes
Kind sein (`data-ergebnisplatz` am `ErgebnisBlock`). Die Reihenfolge im DOM
— und damit Lese-, Tab- und Vorleseordnung — bleibt Ziff. 1–6. Nicht
zweispaltig: Einfacher Fristenrechner (eigene Zeilen-Anatomie, auch auf der
Startseite) und das Zuständigkeits-Trio (Wizard, R12). Wächter:
`e2e/rechner-breite.e2e.ts`.
Nachzug (26.9.2026): Liegt kein Ergebnis vor, nimmt die FehlerBox
(Ziff. 5, `data-fehlerbox`) den Ergebnisplatz rechts ein; steht rechts gar
nichts, hält ein leerer gestrichelter Rahmen die Spur (ohne Text).
Reiterleisten der Eingabespalte (`ui/Tabs`, Griff `lc-reiterleiste`)
brechen um, statt zu schieben. Die Eckdaten-Kacheln (R4 Ziff. 1) stehen im
`lc-kachelraster`: Spaltenzahl nach der eigenen Breite (max. 3, je
mind. 14 rem), nicht nach dem Viewport.

### §R-4 · Ergebnisblock-Skelett (Reihenfolge fix)

Der Ergebnisblock hat überall denselben Rahmen und dieselbe innere
Reihenfolge — vom Verdikt zur Mitnahme:

```
<ErgebnisBlock>            (geteilter Rahmen: id, lc-reveal, aria-live,
                            ErgebnisSprung, LiveHeader — §10-Baustein)
  1. EckdatenKacheln        (max. 3 wichtigste Werte; die Kachel des
                            MASSGEBLICHEN Werts — i. d. R. Fristende bzw.
                            Hauptbetrag — trägt Strich + Fläche «Werkzeuge»,
                            `.lc-akzent-w`, EckdatenKachel akzent)
  2. ErgebnisAnzeige        (Status-Verdikt → Vorbehalte → Rechenweg →
                            Annahmen → Normverweise → Volltext-Disclaimer)
  3. Visualisierung         (FristenKalender · Timeline — falls vorhanden)
  4. BegruendungAbsatz      (zitierfähiger Fliesstext, R6)
  5. AktenzeichenFeld       (Mandats-Referenz für PDF/ICS)
  6. Export-Zeile           (R5)
  7. Quellen-Mikrozeile     (text-micro, nur wo eine amtliche Datenquelle
                            genannt werden muss, z. B. BFS/LIK)
</ErgebnisBlock>
```

Begründung der Reihenfolge: Eckdaten beantworten die Frage («wann/wie
viel»), die ErgebnisAnzeige trägt das rechtliche Verdikt samt
Vorbehalten — beides VOR jeder abgeleiteten Ansicht (Kalender,
Timeline). Die Mitnahme (Aktenzeichen → Exporte) schliesst den Block:
erst referenzieren, dann exportieren.

`ErgebnisBlock`-ids: Standard `lc-ergebnis`; Formulare, die gemeinsam
auf einer Seite gerendert werden können (Tagerechner-Teilformulare,
Kombinierte Ansicht), tragen eindeutige Suffixe (`lc-ergebnis-zpo`, …).

**Akzent-Oberkante — zwei Farben, EINE Anatomie** (ergänzt 31.8.2026,
Design-Konsistenz R2-F/F1-5). Die 3 px starke Oberkante kommt immer aus
einer CSS-Klasse, nie aus einem inline `border-t-[3px]`:

| Klasse | Bedeutung | Beispiel |
|---|---|---|
| `.lc-akzent-brass` | massgeblicher Wert | frühere Verjährungsfrist, Hauptbetrag |
| `.lc-akzent-danger` | Sperre / kein statthaftes Rechtsmittel | «NICHTIG» (Art. 336c OR), `statthaft === 'keines'` |

Die FARBE trägt die Bedeutung, die Stelle ist immer dieselbe. Nur in der
Klasse hält der Ton im Dunkelmodus (`--brass-line` / `--danger-line`,
`src/index.css`); handgesetzte Utilities greifen dort an der
Theme-Umschaltung vorbei. Anlass: sechs handgebaute `border-t-[3px]` in
vier Dateien, davon eine (`VerjaehrungForm`), die zusätzlich alle vier
Kanten einfärbte. Bewacht von `src/tests/listen-editor-r2f.test.tsx`.

### §R-5 · Export-Zeile

Reihenfolge fix: **PDF → ICS → Teilen** (vom Dokument über den Termin
zum Link), als eine Zeile `flex flex-wrap items-center gap-3`. Es gibt
keine Exporte ausserhalb dieser Zeile (Ausnahme: ICS je Einzelfrist in
Fristen-Tabellen wie `EreignisFristenSektion`/`FristenKalender`).
Jeder Rechner mit PDF-Export hat ein `AktenzeichenFeld` (R4 Ziff. 5).

### §R-6 · Wiedergabe der Rechtsinformation (Hierarchie fix)

1. **Verdikt** — Status-Badge + Hauptsatz (ErgebnisAnzeige-Kopf). Der
   Hauptsatz ist ein vollständiger deutscher Satz aus der Engine.
2. **Vorbehalte/Warnungen** — direkt unter dem Verdikt; bei Status
   ≠ ok standardmässig aufgeklappt (A6). Warnungen sind nie weiter vom
   Verdikt entfernt als eine Bildschirmhöhe.
3. **Rechenweg** — einklappbar, Schritt = Beschreibung + Zwischen-
   ergebnis + Normen des Schritts. Vollständig, nie gekürzt.
4. **Annahmen** — einklappbar; jede methodische Annahme der Engine
   erscheint hier (§8: nichts wegglätten).
5. **Normverweise** — ausschliesslich als `NormLink`-Chips (Fedlex),
   nie als blosser Text; Rechtsprechung über `RechtsprechungAnker/-Text`
   mit Verifikations-Vorbehalt.
6. **BegruendungAbsatz** — EIN zitierfähiger Fliesstext-Absatz aus
   `lib/begruendung.ts` für Aktennotiz/Rechtsschrift, nach der
   Visualisierung.

Behörden-Auflösungen (Zuständigkeit, Schlichtung): jede aufgelöste
Stelle trägt einen amtlichen Link; KEINE Quelle-/Status-Fusszeilen in
Auflösungs-UIs (Anweisung David 10.6.2026).

### §R-7 · Disclaimer-Zweistufigkeit

Jedes Formular beginnt mit `PflichtDisclaimer` und übergibt BEIDE
Stufen: `kurz` (ein Satz, rechtsgebietsspezifisch: was wird gerechnet,
was bleibt zu prüfen) und `text` (Volltext). Derselbe Volltext geht in
die PDF-Konfiguration. Der domänenneutrale Standardtext der
ErgebnisAnzeige bleibt deren Fussbereich (kein Cross-Domain-Bleed).

### §R-8 · Fehleranzeige

Eingabe-/Berechnungsfehler erscheinen ausschliesslich über `FehlerBox`
(role=alert), zwischen Eingaben und Ergebnisblock. Keine ad-hoc
`lc-notice-danger`-Absätze für Eingabefehler. (Fachliche Hard-Stops
der Engine — Status `nichtig`/`unzulaessig` — sind KEINE Fehler: sie
laufen als Verdikt durch die ErgebnisAnzeige.)

### §R-9 · Ereignis-Fristen-Regel

Die `EreignisFristenSektion` (ein Anlass → mehrere Fristen) steht auf
der Seite des Rechners, der das auslösende Ereignis berechnet
(S-5c-Verteilung): ZPO (Zivilentscheid, Klagebewilligung), SchKG
(Zahlungsbefehl), Erb-Fristen (Erbgang), Kündigung (Art. 336b OR).
Neue Ereignisse folgen derselben Regel — kein zentraler Fristenspiegel.

### §R-10 · Themen-Einstieg

Wo zum Rechner passende Vorlagen existieren, steht NACH der
Werkzeug-Karte genau ein Themen-Einstieg über die geteilte Komponente
`ThemenEinstieg` (Label + Direktlinks). Keine frei formatierten
Link-Absätze auf Seitenebene.

### §R-11 · Typografie/Token (Kurzfassung; Werte: `design/tokens.json`)

- Überschriften: h1 nur im RechnerKopf; Abschnitts-Beschriftungen als
  `lc-overline`; Ergebnis-Titel als h3 (ErgebnisAnzeige).
- Werte/Daten/Beträge im `num`-Schnitt (Tabellenziffern); Boxen nur
  über die `lc-*`-Klassen (card/tile/panel/notice/badge/chip);
  Tailwind-Defaults `text-sm`/`text-lg` sind verboten.
- Hinweis-Boxen: `lc-notice` (neutral) · `lc-notice-warn` (Vorbehalt) ·
  `lc-notice-danger` (Blocker) — Tonalität nie über freie Farben.

### §R-12 · Ausnahmen (abschliessend)

- **EinfacheFristForm** (Tagerechner-Schnellrechner, S-5a): bewusst
  minimal — keine Eckdaten-Kacheln, kein PDF (sein PDF-Fall ist der
  jeweilige Regime-Rechner). Er trägt aber denselben Ergebnis-Rahmen.
  Sein Block `lc-ergebnis-einfach` ist damit der einzige ohne
  ErgebnisAnzeige; das Tor `e2e/qsui-hierarchie.e2e.ts` führt genau
  diese id in seiner Ausnahmeliste (zwei Orte, eine Regel — wer eine
  weitere Ausnahme baut, trägt sie in beiden nach).
- **EreignisFristenSektion**: Tabellenmuster (je Frist eine Zeile mit
  ICS), kein ErgebnisAnzeige-Verdikt — sie listet, sie urteilt nicht.
- **Zuständigkeits-Trio** (zivil/schkg/straf): Wizard-Schritte statt
  einem Eingabe-Grid; ab dem Ergebnisblock gilt R4 unverändert.

### §R-13 · Leerzustand des Ergebnisplatzes

Ein Rechner, der ohne Eingabe kein Ergebnis zeigen kann, zeigt an
dessen Stelle den geteilten `ErgebnisPlatzhalter` (`vorlagen/ui`):
Overline «Ergebnis» + ein Satz, welche Eingabe fehlt und was danach
erscheint. Er reserviert die Fläche (CLS, §15.2) und zeigt vor der
ersten Eingabe keinen Fehler (C2). Der Satz ist reine Navigation — er
nennt keine Frist, keinen Schwellenwert, kein Ergebnis (§3).

Nicht betroffen sind Wizards, deren Ergebnis ein eigener Schritt ist
(Zuständigkeits-Trio): dort trägt der Schritt selbst die Ansage.

### §R-14 · Repeater = ListenEditor

Jede wiederholbare Eingabezeile — Rechtsbegehren, Kinder, Beilagen,
Sperrereignisse, Gründer:innen, Teilzahlungen — kommt aus dem geteilten
`ListenEditor` (`src/components/vorlagen/ui.tsx`), nie aus einem
handgebauten `map()` mit eigenem Knopf:

- **Behälter je Eintrag:** `lc-panel p-3` (kein `lc-card`, kein nacktes
  `border border-line`, kein behälterloses `flex`).
- **Kopfzeile je Eintrag:** Overline «‹Element› N», rechts der
  Entfernen-Link.
- **Entfernen:** roter Text-Link, klein, Wortlaut **«entfernen»** —
  nicht «Entfernen», nicht «✕», nicht `lc-btn-ghost`.
- **Hinzufügen:** `lc-btn-outline lc-btn-sm` mit **«+ ‹Element›»**,
  UNTER der Liste. Kein «hinzufügen» im Text: das Pluszeichen sagt die
  Handlung bereits.
- Mindest-/Höchstzahl von Einträgen ist eine Zahl am Baustein
  (`mindestens`/`hoechstens`), keine eigene Bedingung um den Knopf —
  und nie ein Knopf, der still nichts tut (§8).

Ergänzt 31.8.2026 (Design-Konsistenz R2-F/F1-9): Das Reglement schwieg
zu Repeatern, und entsprechend standen 43 Hinzufügen-Knöpfe in 20
Dateien in drei Optiken, zwei Beschriftungsgrammatiken und vier
Entfernen-Formen nebeneinander. Bewacht von
`src/tests/listen-editor-r2f.test.tsx`.

### §R · Prüfung

Jeder neue oder geänderte Rechner besteht vor dem Commit die
Checkliste R1–R14 (Bau-Begleitpflicht im WACHSTUM-REGLEMENT, Ziff. 4
«Rahmen vorhanden»). Verstösse, die sich fachlich begründen, werden im
Code an Ort kommentiert und hier als Ausnahme (R12) nachgeführt —
stille Abweichungen sind Bugs.

**Gegatet seit QS-UI 8b (4.8.2026):** `e2e/qsui-hierarchie.e2e.ts` misst
auf 14 Rechner-Flächen × 2 Breiten fünf Punkte dieser Checkliste, die
bis dahin nur auf Sichtprüfung beruhten — R4 Ziff. 2 (Verdikt vor
Herleitung und vor jeder abgeleiteten Ansicht), R6 Ziff. 2 (Vorbehalte
nahe am Verdikt), B2 (Lesespalte für Fliesstext im Ergebnisblock), die
Erreichbarkeit der Sprungmarke auf jeder Breite und ihr Fernbleiben im
Ausdruck. Der Anlass war ein realer Verstoss, den vier Monate
Sichtprüfung nicht gefunden hatten: `ErbteilungForm` schob Tabelle und
Quoten-Balken zwischen Eckdaten und Verdikt (gemessen 666 px Abstand
gegen 243–283 px auf allen anderen Flächen).

Was der §6.7-Rot-Beweis für jeden der fünf Punkte **genau** zeigt (bewusst eng
formuliert; 4.8.2026): wörtlich im Archiv.

## J · Rechtsprechung — Schriftbild der Entscheid-Anzeige

*Ehemals `DESIGN-REGLEMENT-RECHTSPRECHUNG.md` («Darstellungs-Reglement Rechtsprechung»), konsolidiert 23.9.2026 (W2·29-WERKBANK-TOKENS, Rats-Auflage 2). Die Regel-Codes R1–R23 dieser Domäne = §J-R1 … §J-R23, die Regeln zu nicht amtlich publizierten Urteilen = §J-A3.*

Stand: 23.6.2026. Geltungsbereich: die Rechtsprechungs-Rubrik (Übersicht
`/rechtsprechung` + Reader `/rechtsprechung/:key`). Schwester zu
§R (Rechner-Seiten) und §V
(Dokument-Outputs).

**Das Verbindliche ist der Code** (`src/pages/EntscheidLeser.tsx`,
`src/components/rechtsprechung/EntscheidBody.tsx`, `…/EntscheidKarte.tsx`,
`…/EntscheidFilter.tsx`); diese Notiz hält das *Warum* + die belegten Sollwerte
fest. Token-Quelle ist `design/tokens.json` (Typo-Skala, `--font-serif/sans`;
`maxWidth.reading` in `tailwind.config.js`) — dieses Reglement erfindet keine
neuen Magic-Numbers, sondern bindet an bestehende Tokens.

Leitidee: **Der Entscheid-Reader bildet die amtliche Gliderung treu ab
(Regeste → Sachverhalt → Erwägungen → Dispositiv), liest sich wie ein gutes
Buch und zitiert sich wie ein Kommentar.** Treue zur amtlichen Quelle (§7/§8)
schlägt jede Politur.

### §J-0 · Evidenzlage (Kurzfassung; Recherche 23.6.2026 wörtlich im Archiv)

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

Die Quellen hinter den Sollwerten (Lese-Typografie, Randziffern, Referenz-Anzeigen
DE/Intl) nennt jede Regel in ihrer «*Quelle:*»-Zeile.

### §J-R · Die Gestaltungsregeln (priorisiert)

Priorität: **P0** = Lesbarkeits-Fundament (sofort), **P1** = Zitier-/Navigations-
Handwerk, **P2** = Ausbau/Differenzierer. Jede Regel: Sollwert · Begründung/Quelle.

#### P0 — Lese-Fundament

**§J-R1 · Lesespalte 60–75 Zeichen (Body), nicht breiter.**
Body-Container auf eine Mass-begrenzte Spalte (~`38–42rem`, Ziel ~66 ch): im
Ist-Code `max-w-reading` (40rem) am Reader-Body (`EntscheidLeser.tsx`). *Korrigiert
23.9.2026 auf den Ist-Code: die Juni-Fassung beschrieb den damaligen Befund
`max-w-[56rem]` (zu breit) und forderte die Rücknahme — erledigt; Wortlaut: Archiv.*
*Quelle:* Bringhurst/Butterick/Baymard 50–75 ch; WCAG 1.4.8 Kappe 80.

**§J-R2 · Body Serif, 1.08–1.125rem, Zeilenhöhe 1.7.**
Ist (`EntscheidBody.tsx`): `font-serif text-[length:var(--rsp-fs,1.08rem)]
leading-[1.7]` — die Grösse ist die Leser-Stufe `--rsp-fs` (R17,
`leseGroesse.ts` `FS_STUFEN`), Grundstufe 1.08rem (korrigiert 23.9.2026; der
Juni-Wortlaut `text-[1.08rem]` beschrieb den Stand vor R17). Serif ist für langen
juristischen Lesefluss legitim (NN/g: «Bildschirm = Sans» ist überholt) und
hebt den Reader gegen die Sans-lastigen Anbieter ab. 1.7 liegt über dem
WCAG-Boden 1.5. *Quelle:* NN/g Serif/Sans; WCAG 1.4.12; Butterick.

**§J-R3 · Linksbündig, nicht Blocksatz.**
Kein `text-justify` (CSS-Blocksatz ohne Silbentrennung reisst Wortlücken auf).
Weblaw/Lawsearch — die beste CH-Anzeige — ist bewusst linksbündig.
*Quelle:* Weblaw-DOM; Lesetypografie-Konsens.

**§J-R4 · Kontrast ≥ 4.5:1, 200 %-Zoom tragfähig.**
Body-Ink gegen Paper ≥ 4.5:1, gedämpfte Meta/Randziffern ≥ 4.5:1 (nicht nur
«sieht grau genug aus»). Layout muss 200 % Zoom + Nutzer-Text-Spacing
(line-height 1.5, Wortabstand) überstehen — keine festen Höhen, die clippen.
*Quelle:* WCAG 1.4.3 / 1.4.4 / 1.4.12 (normativ, Werte nicht runden).

**§J-R5 · Absatzabstand ≥ 2× Schriftgrad.**
Zwischen Blöcken/Absätzen sichtbarer Abstand (aktuell `space-y-4` ≈ 1rem — bei
1.08rem Body grenzwertig; auf ~1.4–1.6rem zwischen Erwägungs-Blöcken gehen).
*Quelle:* WCAG 1.4.12.

#### P1 — Zitier- & Navigations-Handwerk

**§J-R6 · Erwägungs-Ziffern als Randmarke links, `tabular-nums`, hierarchisch eingerückt.**
Beibehalten + härten: Grid `[5rem_minmax(0,1fr)]`, Marke rechtsbündig im Gutter,
`num`/`tabular-nums`, Einrückung nach Tiefe. Die Marke ist die **amtliche
Zitiereinheit** (`E. 2.3`) — sie muss fluchten und stabil sein. Auf Mobil
(< `lg`) kollabiert sie vor den Absatz (bereits so) — Tufte-konformer
Pflicht-Fallback. *Quelle:* Wikipedia «Randnummer»; BVerfG-Konvention; Tufte-CSS
≤ 760px-Kollaps; `tabular-nums` (MDN).

**§J-R7 · Jede Erwägung ist ein Anker + Pin-Cite-Permalink.**
Jeder Erwägungs-Block bekommt eine stabile `id` (z. B. `e-2-3`) und einen
kopierbaren Permalink (Hover-§-Symbol → `…/:key#e-2-3`). Das ist der Pin-Cite,
den Juristen erwarten (CourtListener-Seitenmarken; BVerfG-Rn.; «pincite = Rn.»).
**Stabilität ist Pflicht:** Nummerierung folgt der amtlichen Erwägung, nie einer
selbst gezählten Reihenfolge (openjur-Offset-Falle). *Quelle:* CourtListener
2025; tarlton.law «pincites»; openjur-Kritik.

**§J-R8 · Regeste als abgesetzter Block, Serif 1.1rem/1.7, mit Quellennennung.**
Beibehalten (`lc-highlight`, `font-serif text-body-l leading-[1.7]` —
Skalen-Stufe statt des Juni-Werts `text-[1.1rem]`, korrigiert 23.9.2026 auf
`RegesteBlock.tsx`; Quellenzeile). Die Regeste ist redaktioneller Leitsatz, optisch klar vom
Urteilstext getrennt — wie BVerfG (Top-Block) und juris (Leitsatz vs.
Orientierungssatz). Quelle der Regeste IMMER ausweisen (§8). *Quelle:* BVerfG;
juris; bger.ch `id="regeste"`.

**§J-R9 · Sticky Sprung-Navigation = amtliche Gliederung.**
Beibehalten: sticky Chip-Leiste Regeste · Sachverhalt · Erwägungen · Dispositiv,
nur tatsächlich vorhandene Ziele, `scroll-mt`/`scroll-margin-top` gegen
Verdeckung. *Quelle:* CourtListener `#opinion-toc`; BVerfG-Inhaltsverzeichnis;
NN/g In-Page-Links (sticky braucht scroll-margin).

**§J-R10 · Zitierung im Kopf, BGE/BGer-Form, `num`/`tabular-nums`, KEIN ECLI.**
H1 = amtliche Zitierung (`BGE 145 III 72` bzw. `BGer 6B_1293/2023`),
Datum/Band als `num`. **Keine ECLI:CH-Form** generieren oder anzeigen.
*Quelle:* corporate-law-club.ch; Wikipedia BGE; ECLI-Abwesenheit CH.

**§J-R11 · Genannte Bundesnormen inline verlinkt, nur bei eindeutiger Auflösung.**
Beibehalten (`NormText` → Gesetzessammlung). Regel wie dejure/eyecite: **Link
nur, wenn das Ziel existiert** — kein Link ins Leere. Norm-Kurzinfo im
`title`/Tooltip ist der dejure-Mehrwert (P2). *Quelle:* dejure «Vernetzung»;
eyecite `annotate()` bei eindeutiger Auflösung.

**§J-R12 · «Kopieren mit Fundstelle».**
Knopf, der markierten Text + automatische, korrekte CH-Zitierung
(`… , E. 2.3, in: LexMetrik`) liefert; pro Erwägung «Fundstelle kopieren».
Auto-Zitat NICHT blind vertrauen — Norm/Stelle bleibt verifizier-/editierbar
(Davids «Norm + Link + Stand»). *Quelle:* Westlaw «Copy with Reference»; Lexis;
citeblog (Auto-Zitate unzuverlässig).

**§J-R13 · Amtliche Seitenmarken inline erhalten (wenn in der Quelle).**
Liegt im Rohtext eine Seitenmarke (`BGE 142 III 210 S. 211`), inline als kleine,
gedämpfte Marke erhalten — sie ist der klassische Pin-Cite der amtlichen
Sammlung. *Quelle:* bger.ch (verifiziert); CourtListener Star-Pagination.

#### P1 — Übersicht (Karten + Filter)

**§J-R14 · Entscheid-Karte: Anker · Gericht · Datum · Sachgebiet · Kurzregeste · Status-Chip.**
Beibehalten + ergänzen: BGE-Referenz/Aktenzeichen als Anker (`num`), Gericht,
Datum, Sachgebiet, Kurzregeste (`line-clamp-3`), Norm-Chips. Ergänzen:
**Status-/Treatment-Chip** (s. R16) und sichtbar, ob maschinell erfasst (§8).
*Quelle:* entscheidsuche-Felder (court/canton/date/abstract); vLex-Karte.

**§J-R15 · Facetten: Kanton → Gericht (Hierarchie) + Datum + Sprache + Sachgebiet, mit Trefferzahl.**
Filter als Hierarchie (entscheidsuche-Modell), **Trefferzahl je Facette**
(verhindert Null-Treffer-Klicks), jargonfreie Labels (Kanton/Gericht/
Sachgebiet/Jahr). Sachgebiet auf kontrolliertem Vokabular (Jurivoc-nah), da die
freie Quelle keine Rechtsgebiet-Facette mitliefert. Mobil: Filter-Tray über den
Resultaten. *Quelle:* entscheidsuche-API; NN/g Faceted Search; Jurivoc (bger.ch).

#### P2 — Ausbau / Differenzierer

**§J-R16 · Status-Farben nach KeyCite/Shepard's-Schema.**
Falls Entscheid-Status erfasst wird (bestätigt/relativiert/überholt):
**grün = good law, gelb = negative Behandlung, rot = überholt/aufgehoben** —
das mentale Modell, das Juristen schon haben. Farbe NIE allein tragend (A11y):
immer Text-Label dazu. *Quelle:* law.uc.edu KeyCite-Markings; vLex; WCAG (Farbe
nicht allein).

**§J-R17 · Reader-Steuerung: Schriftgrösse + ruhige Lesesicht.**
Klein gehaltener Umschalter (Schriftgrad A−/A+, optional Serif/Sans), Wert im
Modul-Store (analog `ausgabeStil.ts`, `useSyncExternalStore` + localStorage).
*Quelle:* vLex «Text options» / Reader view.

**§J-R18 · «Maschinell erfasst»-Provenienz offen, nicht versteckt.**
Bei automatisch extrahierten Texten/Regesten Status-Badge + Fuss-Disclaimer
(bereits angelegt). Fehlt die Gliederung, ehrlich ausweisen statt Struktur
vortäuschen (`EntscheidBody`-Fallback). *Quelle:* CourtListener OCR-Disclaimer;
§8; Davids Status-Marker-Direktive.

**§J-R19 · Provenienz-Fuss: massgebliche Fassung verlinkt + URG-Hinweis.**
Beibehalten: Link zur amtlichen Quelle, «ersetzt amtliche Fassung nicht»,
Art. 5 URG (Urteil gemeinfrei, Regeste redaktionell). *Quelle:* §7/§8; URG.

**§J-R20 · Back-to-Top erst > ~4 Bildschirme, unten rechts, mit Label.**
Bei langen Entscheiden ein ruhiger «Nach oben», nicht früher. *Quelle:* NN/g
Back-to-Top.

**§J-R21 · Mobil: keine Querscrollung, Body 16px/1.5+ erhalten, Randziffer inline.**
< `lg`: Randziffer vor den Absatz, Sprung-Chips horizontal scrollbar (beides
vorhanden), kein horizontaler Scroll, Spalte ~minus Gutter. *Quelle:* Tufte
≤ 760px; WCAG Reflow 1.4.10; Weblaw-Mobiltest.

**§J-R22 · Reading-Progress-Bar: NICHT einbauen (höchstens A/B).**
Evidenz gemischt, kein etablierter Best-Practice. Weglassen. *Quelle:* uxdesign
Pros/Cons; NN/g.

#### P0 — Nachtrag Informationshierarchie (QS-UI 8b Teil 2, 4.8.2026)

**§J-R23 · Das Verdikt eines Entscheids ist die Regeste — und es steht zuoberst.**
Präzisierung zu Dach-§13.2 für diese Domäne, gemessen und gegatet am 4.8.2026
(Messliste `fahrplaene/FAHRPLAN-UI-QUALITAET.md` §2.2, Tor
`e2e/qsui-hierarchie.e2e.ts` I6/I7).

1. **Verdikt = Regeste bzw. die als solche gekennzeichnete Zusammenfassung**
   (R8, `[data-verdikt]`). Liefert die Quelle keine — bei kantonalen Entscheiden
   ist `/structure` Bund-only —, tritt der erste Abschnitt des Urteilstexts an
   ihre Stelle. Nie ein Etikett, das mehr behauptet als die Quelle trägt (R18/§8):
   «Regeste» nur bei amtlicher Regeste, sonst «Zusammenfassung».
2. **Die Regeste steht VOR dem Urteilstext und vor dem Provenienz-Fuss** — auch
   auf schmalen Schirmen, wo Erwägungs-Rail und Sprungleiste vor der Lesespalte
   liegen. Der Rail steht dort als eingeklappter Griff (eine Zeile) über dem
   Text: eine Navigation hinter ihrem Ziel ist keine, eine aufgeklappte vor dem
   Ziel drückt das Verdikt weg. Beides ist zu vermeiden, der Griff löst es.
3. **Regressions-Schranke statt Wunschwert.** Gemessen über vier Entscheid-
   Flächen: 0.56–0.62 Bildschirmhöhen Desktop, 0.68–0.83 mobil. Der Reader ist
   damit die einzige Fläche der App, deren Verdikt auf Desktop im ersten
   Viewport steht. Das Tor nagelt den Zustand bei 1.20 Bildschirmhöhen fest —
   nicht als Ziel, sondern als Schwelle, ab der jemand etwas über die Regeste
   geschoben hat.
4. **Fliesstext hält die Lesespalte** (R1 + Dach-B2) — auch im Provenienz-Fuss
   und im §8-Hinweis der Übersicht. Gerade die Ehrlichkeits-Zeilen sollen
   gelesen werden; sie über die volle Breite laufen zu lassen, macht sie zur
   Fussnote, die niemand liest.
5. **Übersicht: Filter über den Resultaten bleibt richtig** (R15) — das ist
   ausdrücklich das Soll und kein Hierarchie-Verstoss. Der gemessene Weg zum
   ersten Treffer (0.89 Desktop / 1.27 mobil) ist ein Responsive-Thema
   (`W3·14`), kein Ordnungs-Thema.

*(Das Gliederungs-Gerüst «falls formalisiert» und die fünf Quick Wins vom
23.6.2026 — R1 erledigt, R5 `space-y-4` im Ist-Code weiterhin offen — stehen wörtlich im
Archiv.)*

### §J · Prüfung (Checkliste vor Commit)

1. Lesespalte gemessen 60–75 Zeichen bei Standardgrad (Desktop).
2. Kontrast Body + alle gedämpften Elemente ≥ 4.5:1 (Tool, nicht Augenmass);
   200 %-Zoom + Text-Spacing-Override ohne Clipping/Querscroll.
3. Erwägungs-Anker stabil + Permalink kopierbar; Nummerierung = amtliche
   Erwägung (kein Eigen-Zählwerk).
4. Mobil 390px: Randziffer inline, Sprung-Chips scrollbar, kein Querscroll,
   Body bleibt ≥ 16px/1.5.
5. Norm-Links nur bei eindeutiger Auflösung (kein toter Link); Regeste-Quelle
   ausgewiesen; «maschinell erfasst» sichtbar (§8).
6. Kein ECLI; Zitierung in BGE/BGer-Form; Blocksatz aus; keine Progress-Bar.
7. `npm run gate` + `npm run build` grün; visuelle Sichtprüfung Desktop 1280 /
   Mobile 390 in hell und dunkel.
8. Kein Push/Deploy ohne Davids ausdrückliches Ja (§9); fachliche Abnahme der
   Optik durch David selbst.
   **Auf Ist gezogen (REST S5c, 25.9.2026):** CLAUDE.md §9 lautet seit
   Weisung David 3.8.2026 «Push ist stehend freigegeben»; nur `main` läuft
   über die Merge-Queue nach Gegenprüfung. Ziff. 8 überholt darum den
   Push-Teil selbst — gilt nur noch: **fachliche Abnahme der Optik bleibt
   bei David**, kein stiller Merge auf Risiko-Pfaden ohne Gegenprüfungs-
   Verdikt (Skill `landung`).

### §J · Umsetzungs-Entscheide (Stand 23.6.2026)

- **Erwägungs-Darstellung (R6/R7 — angepasst auf Davids Wunsch):** Statt reiner
  Randziffer wird die **amtliche BGer-Form** umgesetzt — die Erwägungs-Ziffer
  (`E. 2.3`) steht als eigene **Kopfzeile** über ihrem Absatz, Erwägungen oberster
  Ebene sind durch **Haarlinie + Abstand ABGETRENNT**, Unter-Erwägungen nach Tiefe
  eingerückt. Pin-Cite-Anker/Permalink (`#e-2-3`) + `tabular-nums` bleiben erhalten.
- **`/structure paragraph_excerpt_chars`:** OCL-Maximum ist **5000** (höher → HTTP
  422 → kein Strukturtext). Längere Erwägungen werden bei 5000 Zeichen gekappt
  (selten; ehrliche Minor-Truncation, sonst Fliesstext-Fallback).
- **Kantonale Gerichte:** `/structure` ist Bund-only → kantonal greift der
  Fliesstext-Fallback mit sichtbarem §8-Hinweis «Gliederung nicht verfügbar».
  Eigener Pfad `public/rechtsprechung/kanton/<KT>/`.
- **Übersicht:** klare **Bund/Kanton-Trennung** — Segment (Alle · Bundesgericht ·
  Kantone) + beschriftete Abschnitte.
- **Amtlicher Link** (relevancy.bger.ch) auf JEDER Karte (Fuss) + im Reader.
- **Dispositiv:** bewusst EIN Block (OCL `dispositiv_orders` zerteilt unzuverlässig an
  Datumsangaben „2. Dezember" → §1 kein Falsch-Split). *(aus Fix-Runde 2, 23.6.2026;
  die übrige Fix-Runde ist ein Änderungsprotokoll und steht im Archiv)*

### §J-A3 · Verbindliche Regeln: nicht amtlich publizierte Urteile (A3, Stand 27.6.2026)

> **Status (§8):** verbindliche Darstellungs-Konvention, von David freigegeben
> (F5, JETZT-MACHEN §4.5). Fachliche Einzelabnahme der Inhalte bleibt offen
> (`verifiziert:false` / `kuratierung:'maschinell'`), Abnahme-Zeitsperre bis
> 1.12.2026. Ein «nicht amtlich publiziertes Urteil» = jeder Entscheid mit
> `leitcharakter !== 'leitentscheid'` (kein amtlicher BGE-Sammlungs-Auszug).

1. **Identische Voll-Urteil-Struktur** wie beim Leitentscheid-Volltext: derselbe
   Reader/`EntscheidBody` (Kopf-Block aus `kopfModell`, gegliederter Sachverhalt
   A./B./C., E.-Erwägungen, Dispositiv). Fehlt der Quelle Struktur (kantonal:
   `/structure` ist Bund-only), greift der ehrliche Fliesstext-Fallback mit
   sichtbarem §8-Hinweis — die **Vorlage** bleibt identisch, nur die Datentiefe
   variiert. *Andock:* `EntscheidLeser.tsx`, `EntscheidBody.tsx`, `kopf.ts`.
2. **Kein Auszug/Volltext-Umschalter** — es gibt keinen amtlichen Auszug → direkt
   Volltext. Der Tab-Umschalter erscheint ausschliesslich beim BGE mit Volltext
   (`switcherSichtbar = gericht==='bge' && hatAuszug`). *Andock:* `EntscheidLeser.tsx`.
3. **Regeste-Box nur bei amtlicher Regeste** (`regesteAmtlich`); sonst Überschrift
   «Zusammenfassung» + `maschinell`-Marker, nie als «Regeste» etikettiert.
   *Andock:* `EntscheidLeser.tsx` (Box-Label), `EntscheidZeile.tsx` («ohne amtl.
   Regeste»).
4. **Kein «Leitentscheid (BGE)»-Badge** → neutrale Identitäts-Kennung
   (Gericht · Abteilung · Sachgebiet, «Urteil vom <Datum>»). Das Badge hängt
   strikt an `leitcharakter==='leitentscheid'`. *Andock:* `EntscheidLeser.tsx`.
5. **Übersicht: eigene Voll-Urteil-Zeile, GRUPPIERT UNTER IHRER INSTANZ**
   (`gerichtstyp`: Bundesgericht → Bundesverwaltungs-/Bundesstrafgericht →
   Bundespatentgericht → Kantonale Gerichte; feste Reihenfolge, nur belegte
   Gruppen). Die **«verweis»-Karte** (vollständiges Urteil zu einem BGE) bleibt
   der **BGE-Auszug→Volltext-Brücke** vorbehalten und erscheint in der eigenen
   Sektion «Vollständige Urteile zu den Leitentscheiden», nie unter «Weitere».
   *Andock:* `browse.ts` (`gruppiereNachInstanz`, `istVolltextVerweis`),
   `Rechtsprechung.tsx`. *Tor:* `rechtsprechung-browse.test.ts`.
6. **Status-Marker bis Davids Abnahme:** `kuratierung:'maschinell'` (UI:
   «ungeprüft»/«maschinell erfasst»), `verifiziert:false`; massgeblich bleibt die
   amtliche Quelle (Live-Link je Entscheid). *Andock:* `entscheide-schreiben.ts`,
   `register.ts`, `EntscheidLeser.tsx`, `EntscheidZeile.tsx`.

**Maschinell geprüft (§13/E1):** Regel 4/6 (Badge/Marker an `leitcharakter` bzw.
`kuratierung`) sind im Render an genau diese Felder gebunden; Regel 5
(Instanz-Gruppierung, verweis-Reservierung) ist in `rechtsprechung-browse.test.ts`
festgenagelt; das B2-Konsistenz-Tor (`entscheid-konsistenz.test.tsx`) sichert
Regel 1/3 je (Gericht × Sprache).

## V · Vorlagen — verbindliches Schriftbild der Dokument-Outputs

*Ehemals `DESIGN-REGLEMENT-VORLAGEN.md`, konsolidiert 23.9.2026 (W2·29-WERKBANK-TOKENS, Rats-Auflage 2). Die Regel-Codes V1–V7 = §V-1 … §V-7.*

Stand: 18.6.2026 (Auftrag David: «schön, nutzerfreundlich, state of the art»
für die Dokument-Outputs der Vorlagen — grundlegende Regeln **in Code
erzwungen**, nicht nur beschrieben; Schlichtungsgesuch als erste Umsetzung).
Geltungsbereich: alle Vorlagen-Outputs (PDF, DOCX, On-Screen-Vorschau).

**Das Verbindliche ist der Code** (`src/lib/vorlagen/formatvorlagen.ts` +
`src/components/vorlagen/vorschauStil.ts`); diese Notiz hält das *Warum* fest.
Spiegel zu §R (das die Rechner-Seiten regelt).

Leitidee: **Ein Dokument, drei Renderer, eine Quelle.** Jede Vorlage wird über
ein rollenbasiertes Modell zusammengesetzt (`assemble()` → `DokumentAbsatz[]`);
PDF, DOCX und Vorschau interpretieren dieselben Rollen und Muster. Eine
Verbesserung an der geteilten Schicht färbt jede Vorlage konsistent.

### §V-1 · Dokument-Anatomie (Rollen)

`assemble()` (`engine.ts`) liefert Absätze mit `rolle`:
`absender · adressat · datumzeile · betreff · rubrum · parteien · anrede ·
schlussformel · unterschrift · default`. Geteilte Textmuster (`MUSTER`):
nummerierte Klausel `1. …` (hängender Einzug), `– `-Unterpunkt, Strichzeile
`______` (gezeichnete Unterschriftslinie), Rubrum-Parteirolle `— … —`.

**Der Assemble-Text ist die SSoT des Inhalts** (golden-gegated, §6). Renderer
dürfen ihn nur DARSTELLEN, nie verändern. Anzeige-Transformationen (z. B.
`rolleLabel`: «— klagende Partei —» → «klagende Partei») sind erlaubt, weil
sie den Assemble-Text nicht anfassen.

### §V-2 · Eine Quelle, drei Einheiten-Sichten (das «Reglement in Code»)

Alle Masse/Typografie liegen an EINER Stelle (`formatvorlagen.ts`), bewusst in
drei nebeneinander gepflegten Einheiten-Sichten — NICHT auseinander abgeleitet:

| Sicht | Einheit | Renderer | Wo |
|---|---|---|---|
| `FORMAT_TYPOGRAFIE` | mm + `docx:{}` (twips) | format-abhängige Typografie (Brot/Zeile/Ränder/Titel) | lib |
| `ROLLEN_PDF` | mm / pt | PDF-Rollen-Abstände + Einzüge | lib |
| `ROLLEN_DOCX` | twips / half-points | DOCX-Rollen-Abstände + Einzüge | lib |
| `VORSCHAU` | rem / em | On-Screen-«Papier» | `components/vorlagen/vorschauStil.ts` |

**Warum keine Projektion (eine Einheit → Rest gerechnet):**
- mm → twips wäre falsch: die Word-Masse sind seit jeher eigenständig auf das
  Word-Schriftbild getunt (Adressblock 10 mm im PDF vs. 300 twips ≈ 5.3 mm im
  DOCX). Eine Umrechnung hätte das DOCX-Schriftbild verändert (§6-Bruch).
- mm → rem wäre unstimmig: das Vorschau-«Papier» ist CONTAINER-RELATIV
  (responsiv), nicht mm-skaliert — ein in mm projizierter Einzug passte nicht
  zur container-breiten Seite.

Die drei Sichten werden **im Gleichschritt** gepflegt: wer den Rhythmus eines
Dokuments ändert, fasst alle drei an. Geteilt wird nur, was wirklich dasselbe
ist (z. B. `betreffGroesse`: pt; DOCX = 2× als Half-Points; `rolleLabel`).

### §V-3 · §3-Grenze: lib gibt Zahlen, Components machen CSS

`src/lib/` enthält nur MASSZAHLEN (mm, twips, rem als Zahl) + den neutralen
`rolleLabel` — keine Tailwind-/CSS-Strings. Die Übersetzung in `className`/
`style` lebt in der Komponentenschicht (`vorschauStil.ts`, `wizard.tsx`).
Die Renderer in `src/lib/vorlagen/vorlagenPdf.ts` / `vorlagenDocx.ts` nehmen
`stil` als reinen Parameter — keine UI-Abhängigkeit.

### §V-4 · Schriftbild-Handwerk (gilt in beiden Stilen)

- **Tabellarische Ziffern**: Beträge/Daten/Nummern fluchten. Vorschau via
  `font-variant-numeric: tabular-nums` (Sans — NIE die Monospace-`.num`-Klasse,
  die den Fliesstext bräche). PDF/Helvetica und DOCX/Arial haben ohnehin
  gleich breite Ziffern.
- **Ruhige Hierarchie**: fetter Betreff + Haarlinie; scanbarer, hängend
  eingezogener Begehrensblock; klarer Unterschriftsblock.
- **Schweizer Eingabe-Konvention**: Adressblock oben links (fensterkuvert-
  tauglich), Ort/Datum rechts, breiter Korrekturrand rechts (`eingabe`).
- **Ehrlichkeit (§8)**: Status/Disclaimer ruhig im Output; keine Politur, die
  den Prüfstand verschleiert.

### §V-5 · Ausgabe-Stil: nüchtern ⇄ modern (`AusgabeStil`)

Eine Stilwahl, die auf alle drei Renderer KOHÄRENT wirkt (Vorschau = PDF =
DOCX). Differenzierer ist die Rubrum-Parteirolle (visuelle Signatur):

- **nuechtern** — klassisch-gerichtstauglich: `— klagende Partei —` zentriert.
- **modern** — Variante A «Dokument-Handwerk»: ruhiges, gesperrtes Versal-Label
  (Em-Striche entfallen, `rolleLabel`).

V4-Handwerk (Tabellarik, Hierarchie, Begehrensblock) gilt in BEIDEN Stilen.
Wahl liegt im Modul-Store `ausgabeStil.ts` (`useSyncExternalStore`,
localStorage, Default `modern`) — Vorschau UND beide Export-Knöpfe lesen
denselben Wert ohne Props-Plumbing. UI: `StilUmschalter` im Vorschaukopf.

### §V-6 · Verhaltensneutralität (§6) — was sich NIE ändern darf

Das Schriftbild ist Darstellung; der **Inhalt** ist es nicht. `assemble()`,
Schemas, Bausteine, Texte bleiben unberührt → `npm run golden:vergleich`
byte-gleich. Reine Token-Umstellungen (Magic-Numbers → benannte Tokens mit
identischem Wert) werden mit einem datums-/ID-bereinigten Render-Vergleich
(PDF-Operatoren + DOCX `document.xml`) als byte-gleich bewiesen.

### §V-7 · Informationshierarchie: das Dokument ist das Verdikt (QS-UI 8b Teil 2, 4.8.2026)

Präzisierung zu Dach-§13.2 («Verdikt zuerst, Warum auf Abruf») für diese Domäne. Sie hält
fest, was der Hierarchie-Pass vom 4.8.2026 gemessen und gegatet hat; Messliste und
Begründungen in `fahrplaene/FAHRPLAN-UI-QUALITAET.md` §2.2, Tor `e2e/qsui-hierarchie.e2e.ts`
(I8–I10, A9).

1. **Verdikt = das Dokument, nicht das Formular.** Aus V1 folgt unmittelbar: das Produkt
   dieser Rubrik ist der fertige Text, nicht die Eingabestrecke. Die Vorschau ist darum
   kein Beiwerk, sondern die Antwort der Seite.
2. **Die Stelle des Dokuments ist nie leer.** Steht noch kein Dokument (fehlende Angaben,
   fachlicher Blocker), steht dort ein Platzhalter — der geteilte `ErgebnisPlatzhalter`
   (`components/vorlagen/ui.tsx`, `titel="Dokumente"`) oder ein reicherer Leerzustand, der
   zusätzlich die offenen Blocker nennt (so `/vorlagen/ag-gruendung`). Auf schmalen
   Schirmen, wo der Vorschau-Block eingeklappt ist, ist der beschriftete Griff die Stelle.
   Nie nichts: wer nicht sieht, dass dort etwas erscheint, wartet nicht darauf.
3. **Ist das Dokument nicht im Bild und rückt es nicht von selbst hinein, gibt es eine
   Abkürzung.** «Von selbst» heisst: die klebende Vorschau-Spalte auf breiten Schirmen —
   dort wäre eine schwebende Marke ein Zeiger auf ohnehin Sichtbares. Sonst gilt die
   geteilte `ErgebnisSprung`-Marke der Rechner-Domäne, mit eigenem Label («↓ Dokumente»),
   **nicht** eine zweite Bauform (§10).
4. **Die Formvorschrift steht im ersten Viewport.** Das Form-Badge im Kopf (V4
   «Ehrlichkeit») trägt die Aussage, die über die Gültigkeit entscheidet — «Eigenhändig
   abzuschreiben», «Papierform · eigenhändig unterzeichnen». Sie darf gedämpft sein, aber
   nie hinter der Eingabestrecke stehen. Gemessen über alle 30 Routen: 0.46–0.88
   Bildschirmhöhen.
5. **Warnungen werden nie weggeschaltet.** Ein Rahmen, der Engine-Warnungen nur auf Opt-in
   rendert, ist gegen §8 gebaut, auch wenn heute keine Engine welche liefert — die erste,
   die es tut, verschwände still. `VorlagenSeite` rendert `gates.warnungen` darum
   bedingungslos (Opt-in `zeigeWarnungen` entfernt 4.8.2026).
6. **Fliesstext hält die Lesespalte** (Dach-B2/D-1.5). Ausgenommen ist das Vorschau-
   «Papier»: dessen Mass regelt V2, nicht die Lesespalte der App.
7. **Intro-/Kopftext-Wachstum ist ein Tiefe-Risiko.** Ein zusätzlicher Halbsatz im
   Vorlagen-Intro (auch ein Offenlegungshinweis) kann die mobile Dokument-Tiefe-
   Schranke reissen — erst im Browser-Smoke sichtbar (Beleg #1065, 24.9.2026:
   `/vorlagen/klage-vereinfacht` 2.81 > 2.8 Bildschirmhöhen). Vor dem Commit
   `e2e/qsui-hierarchie.e2e.ts` für die Route einzeln fahren oder die Textlänge
   netto halten — Füllwörter kürzen, nie die Offenlegung.

**Grösseres Papier auf breiten Bildschirmen (W2·31-BILDSCHIRMBREITE B5, 26.9.2026).**
Das Vorschau-Papier hat EINE Geometrie (`src/index.css`, Block «Vorlagen:
grösseres Papier»): Hat das Panel (`VorschauPanel`, Griff
`data-vorschau-panel`) weniger als 43.5rem Platz, füllt das Papier ihn wie
bisher; ab 43.5rem steht ein festes Blatt, dessen Satzspiegel als Ganzes um
1.4 vergrössert ist (`zoom`), bei unveränderter Satzbreite von 27.875rem in
Papier-Einheiten — der Zeilenfall ist derselbe wie in der 520-px-Spalte
(B2a: Fliesstext wächst nie; Ziff. 6: das Papier folgt seinem Format, nicht
dem Bildschirm). Kopfzeile, Disclaimer und alles unter dem Papier bleiben
unvergrössert und höchstens 32.5rem breit. Im Wizard (Arbeitsfläche
`@container/vorlagenflaeche`) bleibt die Formularspalte höchstens 32.5rem;
ab 80rem steht rechts das grosse Blatt, bündig mit dem Rahmen, und die
Mindesthöhe der Vorschau-Zelle wächst mit dem Zoom. Die Mappen zeigen
dasselbe Blatt statt einer Bahn über die ganze Rahmenbreite. Druck, PDF und
DOCX sind unberührt (`@media screen`). Wächter: `e2e/vorlagen-breite.e2e.ts`.

### §V · Prüfung (Checkliste vor Commit)

1. `npm run golden:vergleich` byte-gleich (Inhalt unberührt — Hauptbeweis §6).
2. `npm run gate` (tsc · vitest · golden · lint · check) + `npm run build` grün.
3. Keine hartkodierten Abstände mehr auf Rollen-Elementen der Vorschau
   (grep `mb-/mt-/w-/pl-` → nur strukturelle Utilities übrig).
4. Visuelle Sichtprüfung Vorschau (Desktop 1280 / Mobile 390) + je ein PDF +
   DOCX pro Format, in BEIDEN Stilen geöffnet und beurteilt.
5. Struktur-Tests, die altes DOM festschreiben, werden DEKLARIERT angepasst
   (§6 Ziff. 3, eigener begründeter Schritt) — nie stillschweigend aufgeweicht.
6. Kein Push/Deploy ohne Davids ausdrückliches Ja (§9); fachliche Abnahme der
   Optik durch David selbst (Ausprobieren).
   **Auf Ist gezogen (REST S5c, 25.9.2026):** CLAUDE.md §9 lautet seit
   Weisung David 3.8.2026 «Push ist stehend freigegeben»; nur `main` läuft
   über die Merge-Queue nach Gegenprüfung. Ziff. 6 überholt darum den
   Push-Teil selbst — gilt nur noch: **fachliche Abnahme der Optik bleibt
   bei David**, kein stiller Merge auf Risiko-Pfaden ohne Gegenprüfungs-
   Verdikt (Skill `landung`).
