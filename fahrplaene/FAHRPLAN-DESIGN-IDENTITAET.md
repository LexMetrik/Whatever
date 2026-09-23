# FAHRPLAN — Design-Identität: nicht aussehen wie jede andere Claude-Seite (Auftrag David 5.9.2026)
<!-- @lagebild name: Design-Identität · zweck: LexMetrik bekommt eine eigene Farb- und Schrift-Handschrift, damit es nicht wie die übliche Creme-Gold-Juristenseite aussieht. -->

> **ROADMAP-Schritt:** `W2·24-DESIGN-IDENTITAET` (`feld: design`).
> **Anlass (David 5.9.2026):** legaldeadline.ch/methodik — «wahrscheinlich auch von claude erstellt
> und sieht sehr ähnlich aus, wie lexmetrik. was können wir machen um designtechnisch nicht so
> auszusehen?» · Entscheid David: «ja, leg den schritt an und mach die varianten nach der landung»
> (nach der Landung von `W2·23-STARTSEITE-V4`).

## §1 · Befund und Ziel (`W2·24-DESIGN-IDENTITAET`)

**Befund (ausgelesen 5.9.2026, legaldeadline.ch):** `--canvas #f7f5f0`, `--paper #fdfcfa`,
`--gold #8b6914`, `--navy #0a1220`, Inter, Overlines in Gold-Versalien mit weitem Tracking,
Brotkrumen, `--radius .75rem/1rem`, Schatten-Skala. LexMetrik: `--paper #FCFAF6`, `--brass-700
#826225`, `--ink-900 #1C1A15`, Geist, `.lc-overline` Versalien 0.12em, `rounded-2xl`-Karten.
**Dieselben drei Signaturen:** Creme+Gold · Gold-Versal-Etiketten · weiche Karten auf Pastell.

**Ziel:** Eine eigene, wiedererkennbare Handschrift, die die inhaltliche Tiefe (amtliche Quellen,
verzahnt) zeigt statt Rechner-Optik. Umsetzung als **Token-Tausch** in `src/index.css`
(`:root` + `html.dark`) und `tailwind.config.js`, ohne Komponenten-Umbau; flip-reversibel.

**Grenzen:** Kontrast-Tore (`check:farbwelt`, axe, APCA-Protokoll wie `abnahme/startseite-v3/
KONTRAST-PROTOKOLL.md`) grün; Normtext-Körper farbfrei (§13); keine Rohwerte in Komponenten;
Golden byte-gleich (Token-Schicht berührt keine Ausgaben); Schrift-Lizenzen offen (OFL) und
`check:lizenzen` grün; Bundle-Budget (`check:perf-budget`) für zusätzliche Webfonts prüfen.

## §2 · Die fünf Hebel (Vorschlag 5.9.2026, Reihenfolge = Wirkung)

1. **Farbwelt kippen:** kühles, fast weisses Papier; EINE tiefe Akzentfarbe aus der Schweizer
   Amtswelt (Kandidaten: dunkles Bundes-Rot · tiefes Tannengrün · Schiefer-Blau), sparsam als
   Linie/Aktivmarke; Grau-Tinte statt Braun-Tinte. Brass bleibt höchstens im Siegel.
2. **Etiketten ohne Versalien:** `.lc-overline` → kleine, nicht-versale Zeile (fett oder kursiv),
   Tracking normal. Ein Token/eine Klasse, wirkt site-weit.
3. **Kanten statt Kissen:** Radien auf `--radius-sm` (≤ 4 px), Trennung über Linien statt
   Flächen-Tönung; Schatten nur für schwebende Ebenen (Menüs, Dialoge).
4. **Text-Schrift mit Charakter:** Serife (OFL: Source Serif 4 · Literata · Newsreader) für
   Normtext und Entscheide (`DESIGN-REGLEMENT.md` §N nachziehen), Grotesk nur für
   Bedienelemente. Lesemass (CPL, Zeilenhöhe) neu messen.
5. **Ein Marken-Motiv:** Siegel + Skalenstrich als einziges wiederkehrendes Zeichen, in der
   neuen Akzentfarbe (Logo.tsx, Aktivmarke Sidebar).

## §3 · Vorgehen

1. **Varianten-Bilder (nach Landung W2·23):** drei Varianten (je Hebel 1 mit anderer
   Akzentfarbe, Hebel 2–3 überall gleich, Hebel 4 in zwei von drei) als Token-Overrides in einem
   Worktree; Screens «/» und ein Gesetzes-Leser @1440 hell + dunkel, @390 hell → `abnahme/
   design-identitaet/variante-{a,b,c}-*.png`. **David wählt** (Sichtentscheid, kein Jules).
2. **Umsetzung** der gewählten Variante: Token-Tausch, Kontrast-Protokoll, Reglement-Nachzug
   (`DESIGN-REGLEMENT.md` Token-Abschnitt, `.claude/rules/design.md`), `STRUKTUR.md`-Karte.
3. **Wächter:** `check:farbwelt`/`check:design-tokens` bleiben; kein neues Tor ohne Rot-Probe.

## §4 · Kollisionen

`W2·11-DESIGN` (Design-Wärme, geparkt) baut auf der Brass-Welt auf — wird durch diesen Schritt
inhaltlich abgelöst; bei Umsetzung Fahrplan-Wärme prüfen und Doppelungen in die Chronik.
*(Nachtrag 22.9.2026: vollzogen, aber anders als hier gedacht — `W2·11-DESIGN` ist mit dem Go zum
Werkbank-Umbau gestrichen, Wortlaut in `ROADMAP-CHRONIK.md` «Ablösung 22.9.2026», Fahrplan in
`archiv/FAHRPLAN-DESIGN-WAERME.md`. Nachfolge: `fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md`.)*
`W2·19-DESIGN-KONSISTENZ` (gelandet 5.9.2026) hat `--z-*`/`--auf-sage` in `index.css` — additiv
respektieren.

## §5 · Freigabe David 6.9.2026 — Zielbild «Sammlung» (bindend für den Bau)

**Wortlaut David (6.9.2026):** «ja bau das, run till dry. achte darauf, dass alles sinn macht. bevor du
baust recherchiere nochmals was du dafür alles ändern musst damit es konsistent ist und dann lass
zwischen den runden einen ästhetikprüfer darüber schauen. es soll immer noch alles sinn machen mit
split screen usw. also überlege genau wie du es baust bevor du rein schiesst.»

**Referenzbild (massgeblich, statt Prosa):** `abnahme/design-identitaet/vorschlag-freigegeben.html`
(zwei Seiten: Startseite als Inhaltsverzeichnis, Gesetzesleser mit Bezügen am Rand). Bauen heisst:
die App auf dieses Bild bringen, nicht das Bild nachmalen — bestehende Bausteine, Engines, Daten,
Split-View-Mechanik bleiben; es ändert sich Darstellung (§3).

**System (aus dem Referenzbild):**
- Schrift: **Literata** (alles Gelesene: Normtext, Entscheide, Titel, Begrüssung) + **Archivo**
  (Bedienung, Marginalien, Meta) — beide OFL, self-hosted wie Geist heute (`@font-face`, kein
  Google-Fonts-Request zur Laufzeit; Budget `check:perf-budget` messen, Subsets latin/latin-ext).
  Geist/Geist Mono raus; Mono nur, wo es heute fachlich trägt (Rechenweg/Code), sonst Tabellenziffern.
- Farbe: Papier Weiss/Tinte fast Schwarz (hell) bzw. invertiert (dunkel); **vier stumpfe
  Registerfarben** als einzige Farbe: Gesetze `#1F3A5F`, Rechtsprechung `#7A1F2B`, Materialien
  `#4E6B3A`, Werkzeuge `#8A6A1F` (dunkel: aufgehellte Pendants). Brass verschwindet aus der
  Rollen-Schicht (`--accent-*` → Tinte bzw. Registerfarbe nach Domäne); Sage/Warn/Danger
  (Status-Semantik) bleiben. Kontrast AA nachweisen (`check:farbwelt`, axe).
- Form: Radien 0, keine Schatten ausser schwebende Ebenen (Menü, Dialog), kein `lc-glass`,
  Trennung über Linien (1 px `--rule-soft`, 2 px `--rule` für Kopfzeilen). Links unterstrichen.
  Overlines/Versal-Etiketten → normale kleine Grotesk-Zeilen (`.lc-overline` umdefinieren, nicht
  jeden Konsumenten anfassen; Versalien/Tracking weg).
- **Nachträge David 6.9.2026 (bindend, überschreiben Widersprechendes in diesem §):** Startseite
  nach dem Referenzbild «Pult» (`abnahme/design-identitaet/pult-freigegeben.html`: grosse
  Begrüssung, fünf Bereiche in einer Reihe, Zuletzt, schaltbare Module, kein eigenes Suchfeld —
  «nur oben reicht»); **Seitenleiste bleibt überall, auch auf «/»**, die Bereichs-Reiter im
  Titelblatt entfallen; Reiter in der Arbeitsleiste frei per Ziehen ordnen «analog Browser»;
  Registerfarben eine Stufe kräftiger, Rot dezent; Lesekomfort-Tokens nach Recherche (D12:
  warm getöntes Papier, Tinte ~14:1, Literata opsz + Gewicht 450); Übersichts-Köpfe ohne
  Erklärtext (D11). Vollständige Befund- und Entscheidliste: `abnahme/design-identitaet/`
  (Protokolle je Runde).
- Layout: Satzspiegel mit **Marginalienspalte links** (150 px) im Leser (auf «/» durch das Pult abgelöst); im
  Split-View/Pane fällt die Marginalie unter `@3xl/pane` in die Textspalte (Zeilenform), damit
  zwei Panes nebeneinander weiter Sinn ergeben. Titelblatt-Zeile (Marke · Bereichs-Reiter ·
  Ausgabe-Zeile) ersetzt die Glas-Topbar; Seitenleiste bleibt als Inhaltsverzeichnis im Leser und
  in den Bereichsübersichten, auf «/» entfällt sie (Reiter tragen die Bereiche).
- Sprache: keine Slogans, keine Nutzenversprechen («an einem Ort», «verzahnt» als Behauptung);
  Bezeichnungen, Zahlen mit Scope, Verben. Wikipedia «Signs of AI writing» als Negativliste.
- Bezüge im Leser als Randnotizen rechts (Entscheide · Materialien · Verweise · Rechnen) — aus
  der bestehenden Verzahnungs-Datenquelle, keine neue Logik.

**Runden (jede Runde: Bau → Ästhetik-Prüfer (read-only, Screens aus dem Worktree-Preview, hell +
dunkel, 1440 + 390, Split-View mit zwei Panes) → Nachbesserung; Landung EINE PR am Schluss):**
Die konkrete Rundenliste mit Dateien steht in §6 (Inventur-Ergebnis).

## §5a · Reiterleiste wie im Browser (Wunsch David 6.9.2026, gehört zu R2)

David: «analog zum browser die offenen tabs oben anstatt mit dem drei linien drop down» · «überlege
wie es maximal nützlich in der praxis ist». Zielbild (bestehende Mechanik `useTabs`/`usePaneLayout`/
`usePaneDnd`/Verlauf weiterverwenden, nur Sichtbarkeit und Bedienung):
1. Zwei Zeilen, zwei Bedeutungen: Titelblatt-Zeile = Bereiche (Navigation); darunter die
   **Arbeitsleiste** = offene Dokumente. Optisch verschieden (Reiter mit Registerfarben-Strich und
   Schliessen-×, Navigation nur unterstrichener Text).
2. Reiter-Beschriftung = kanonische Kurzform (`Art. 336c OR`, `BGE 152 V 52`, `Frist ZH`,
   Vorlagen-Name), voller Titel als `title`; Registerfarbe der Domäne als Strich.
3. Kein Reiter-Wildwuchs: Klick ersetzt den Inhalt des aktiven Reiters; neu nur per Mittelklick,
   Ctrl/⌘-Klick oder «in neuem Reiter» (bestehendes Verhalten prüfen, nicht verdoppeln).
4. Split-View aus der Leiste: Reiter in die zweite Hälfte ziehen (usePaneDnd) oder «daneben
   öffnen»; die Leiste zeigt, welcher Reiter links/rechts steht (zwei Aktiv-Marken).
5. Angeheftete Reiter (OR, ZGB, ZPO …) als schmale Kürzel-Reiter links; Überlauf ab ~8 Reitern:
   schmaler bis Kürzel, dann «+N»-Knopf mit Liste und Suche — nie stilles Schliessen.
6. Reiter überleben Neustart (localStorage, Lesestellung); «zuletzt geschlossen» aus dem Verlauf.
7. Tastatur: Alt+1…9 springt, Ctrl/⌘+W schliesst Reiter (nur wenn nicht der Browser es fängt —
   sonst Alt+W), Ctrl/⌘+Enter im Suchfeld öffnet in neuem Reiter.
8. Mobil: Leiste waagrecht scrollbar mit aktivem Reiter im Bild; ab 3 Reitern Knopf «N offen» →
   Blatt mit Liste. Die ☰-Schublade bleibt mobil die Bereichs-Navigation.
9. **Arbeitsmappe** (letzter Teil, nach R5, eigener Schritt falls Zeit fehlt): offene Reiter als
   benannte Mappe lokal speichern/öffnen, als Adresse teilbar (deterministisch, ohne Konto).

## §6 · Inventur und Rundenplan (Stand 6.9.2026)

Gemessen im Worktree `w2-24` (`grep -rl`, Datei-Zahlen, keine Vermutungen).

### (a) Konsumenten je Signatur

| Signatur | `src/` | `e2e/`+`src/tests/` | zentral umstellbar? |
|---|---|---|---|
| `*-brass-*`-Utilities | **202** | 2+15 | **ja** — `brass.100…800` (`tailwind.config.js:68`) sind reine `var(--brass-N)`-Blätter |
| `.lc-overline` | **141** | 5+4 | **ja** — eine Regel (`index.css:1060`: Mono, versal, `--tracking-overline`) |
| `rounded-*` (216) | **89** | 0+5 | **teilweise** — `borderRadius` (`tailwind.config.js:171`) mappt sm…2xl auf `--radius-*`; **`rounded-full` (46) NICHT** (TW-Default 9999px) |
| `.lc-glass` | **2** (Topbar, LesemodusOverlay) | 1+2 | **ja** — heute schon nur `background: var(--paper)` (`index.css:1917`) |
| `shadow-*` | **18** | — | nein (Utility-Ebene) |
| `font-display`/`text-display` | **28** | 1+3 | **ja** — `--font-display` (`index.css:443`) |
| `font-mono`/`.num` | **161** | — | **ja** — `--font-mono` (`:445`), `.num` (`:1044`) |
| `lc-card` 62 · `lc-chip` 70 · `lc-notice` 74 · `lc-tile` 27 · `lc-ziffern` 13 | — | — | **ja** — je eine `@layer components`-Regel |

### (b) Ein Ort vs. Konsumenten-Edits

Zentral (R1, ohne einen Konsumenten anzufassen): Papier/Tinte, ganze Brass-Skala, Radien
ausser `rounded-full`, Overline-Gestalt, Schriftfamilien, alle `.lc-*`-Rezepte, Rollen-Schicht
`--accent-*` (`tailwind.config.js:87`). Konsumenten-Edits braucht nur, was **Bedeutung** trägt:
Registerfarbe je Domäne (der Klassenname `brass-700` lügt danach — Umbenennung ist R5-Sweep,
keine Voraussetzung), `rounded-full`-Pillen, `shadow-*` an nicht-schwebenden Flächen,
Layout-Wechsel.

### (c) Split-View / Pane

`Pane.tsx:125` setzt `@container/pane` auf den Scroll-Container (Schwelle heute `@xl/pane`,
36 rem, `:145`); 76 Dateien lesen `/pane`. Eine Marginalienspalte (150 px + 36 px Rinne) bricht
unter ~52 rem Pane-Breite — also in jedem geteilten 1440er-Fenster. **Bauregel:**
`grid-template-columns: 150px minmax(0,1fr)` erst ab `@3xl/pane` (48 rem), darunter einspaltig
mit der Marginalie als vorangestellter Zeile (wie `max-width:820px` im Referenzbild).
`PaneKopf.tsx` bleibt Pane-Kopf; Titelblatt-Zeile = Fensterkrone (`Topbar`).

### (d) Seitenleiste

`Shell.tsx:375` rendert `Sidebar` auf **jeder** Route; nur `vorgabeEingeklappt` unterscheidet
(`:107`, eingeklappt im Gesetz-Leser) — auf «/» ist sie heute also da. «Auf / entfällt sie» =
Pfad-Bedingung in `Shell.tsx` + `useSeitenleiste`. Die mobile Schublade (`Shell.tsx:519–549`,
Portal + `useDialogFokus`) bleibt und trägt auf «/» die Bereichsliste weiter — sonst verlöre
Mobil die Navigation.

### (e) Bezüge-Datenquelle

`gesetz-leser/bezuegeLaden.ts` → `useBezuege(erlassKey)` liefert `bezuegeFuer(artikel)`,
`gesamt`, `klassenImErlass`, `histogramm`; sechs Konsumenten (u. a. `inhalt-zustand.tsx`,
`parts/ArtikelLeser.tsx`, `parts/BezuegeZeile.tsx`), und die Panels
`v3/Panel{Entscheide,Materialien,Aenderungen,Anwendung}.tsx` rendern dieselben Daten schon.
**Die Randnotiz-Spalte ist eine dritte Grid-Spalte über `bezuegeFuer(artikel)` — keine neue
Logik, kein neuer Ladepfad.**

### (f) Wächter, die rot werden (deklariert anzupassen)

**R1:** `scripts/farbwelt-tabellen.ts` (13 brass-Pflichtpaare ab :41 — Werte wechseln, neu
messen + Register-Paare) · `scripts/check-design-tokens.ts:70` `OVERLINE_DIM_RE` (Overline
nicht mehr versal) · `design-gruppenkopf-karten-c.test.ts:120,157` (zitiert
`border-color: var(--brass-400)` aus `index.css`) · `leser-typo-tokens.test.ts` +
`leser-schriftskala.test.ts` (Geist→Literata; auch R4) · `check:lizenzen`, `check:perf-budget`
(entry 30 KB) für die neuen Fonts.
**R2:** `design-r3b-chrome.test.ts:73,132,384,533,542,562` (Overline-Rezept, `rounded-lg`+
`shadow-lg`-Popover, brass-Hover) · `design-r2d-mobil-zustaende.test.ts:133,173,224,242`
(`rounded-full`, `shadow-lg`, zitierte `.lc-glass`-Regel) · `druck-fundstellen.test.ts:54,58`
+ `e2e/druck-fundstellen-z2.e2e.ts` (Druckregel hängt an `header.lc-glass` → **Name behalten**,
nur Rezept leeren) · `e2e/w223b-kopf-seitenleiste.e2e.ts`.
**R2/R3:** `design-r2c-bausteine.test.ts:73,103,153,171` (Literalketten `brass-800/700/500`,
`rounded-full`). **R5:** `design-r5-konsistenz.test.ts`, `design-konsistenz-chips-marken.test.tsx`.

### (g) Schriften

Heute: `src/main.tsx:6,7,11` lädt `@fontsource-variable/{geist,geist-mono,source-serif-4}`
(self-hosted via npm, **kein** `public/fonts/`, kein Google-Request); Fallback-Metriken sind
aus den echten woff2 **gemessen** (`scripts/gen-font-fallbacks.ts`, @capsizecss →
`index.css:12–48`). Neu gleicher Weg: `@fontsource-variable/literata` + `.../archivo`, beide
OFL. **Vor R1 per `npm view` prüfen**, ob die Variable-Pakete und Archivos `wdth`-Achse
existieren — sonst statische 400/500 + Literata-Italic. Fallbacks neu generieren
(Literata→Georgia/Liberation Serif, Archivo→Arial/Arimo), sonst CLS-Rückfall. Die drei alten
Pakete deinstallieren; `--font-mono` bleibt für Rechenweg/Code, `.num` wird
`font-variant-numeric: tabular-nums`.

### (h) Sprach-Diät — sichtbare Slogan-Strings

`src/lib/seo.ts`: `SITE_TITEL` («Schweizer Recht an einem Ort: …»), `SITE_DESCRIPTION`,
`SITE_OG_DESCRIPTION`, `HERO_SUBLINE` («miteinander verzahnt»), `VERTRAUENS_SATZ`,
`STATUS_SATZ`, `SITE_KURZFORM` + 12 `STATISCHE_SEITEN`-Beschreibungen (`:91–111`).
`start/RubrikKacheln.tsx:40,45,51,56` (vier `nutzen`-Sätze), `Hero.tsx:47,50`,
`VertrauensFuss.tsx`. **Grenze:** `<title>`/`description` sind SEO-Träger, an
`check:seo-index` gebunden — dort kürzen, nicht tilgen; die Tilgung gilt dem **sichtbaren** Text.

---

### Rundenplan

**Stand 7.9.2026 — alle Runden erledigt, gelandet in PR #739** (Protokolle in
`abnahme/design-identitaet/`; die Spezifikation der Runden R1–R5 darunter bleibt als Wortlaut
stehen, sie ist der Massstab, an dem geprüft wurde). Nachträge D30–D33 und R13 sind nach der
Freigabe §5 hinzugekommen, die Gesamtprüfung ist der Schluss-Auftrag David 7.9.2026 («am ende
mache nochmals einen kompletten fix indem du selbst auf die webseite gehst»).

| Runde | Gegenstand | Stand | Protokoll |
|---|---|---|---|
| R1 | Grundschicht (Papier/Tinte, Registerfarben, Literata/Archivo, Radien 0) | erledigt | `KONTRAST-R1.md` |
| R2 | Rahmen (Titelblatt, Arbeitsleiste = Reiterleiste, Seitenleiste) | erledigt + Nachzug | `R2-RAHMEN.md`, `R2-NACHZUG.md` |
| R3 | Startseite als Inhaltsverzeichnis + Sprach-Diät | erledigt + Nachzug | `R3-STARTSEITE.md`, `R3-NACHZUG.md` |
| R4 | Gesetzesleser (Satzspiegel, Randtitel, Bezüge) | erledigt | `R4-LESER.md` |
| R5 | Rest-Sweep Übersichten/Rechner/Vorlagen/Leser (F1–F1K, F2) | erledigt | `R5-F1.md` … `R5-F1K.md`, `R5-F2.md` |
| R6 | «Gesetzesdarsteller»: Ort und Verzahnung (Zusatzrunde David 6.9.) | erledigt (A–G) | `R6-LESER.md`, `R6-NACHZUG.md`, `R6C.md`, `R6D.md`, `R6E-LESER.md`, `R6F-LESER.md`, `R6G-LESER.md` |
| R7 | Beschriftungen | erledigt | `R7-BESCHRIFTUNGEN.md` |
| R8 | «Nichts abgeschnitten» | erledigt | `R8-ABSCHNITT.md`, `R8-REPORT-0.md` |
| R9 | Einheitlichkeit (gleiches Format für Gleiches) | erledigt (zwei Wellen) | `R9-1.md`, `R9-2.md` |
| R10 | Startseite «Pult» — modular steuerbar | erledigt + 3 Nachzüge | `R10-PULT.md`, `R10-NACHZUG.md`, `R10-NACHZUG-3.md` |
| R11 | Reiterleiste: Bedienbarkeit und Nützlichkeit | erledigt (M5 → `W2·25`) | `R11-REITER.md`, `uebergabe/R11-PLAN.md` |
| R12 | Wege verkürzen (Köpfe, Listen) | erledigt | `R12A-KOEPFE.md`, `R12B-LISTEN.md` |
| R13 | Reiter nützlicher und intuitiver (zweite Reiter-Runde, David 7.9.) | erledigt | `R13-REITER.md` |
| R14 | «Alles ist ein Reiter»: die Sammlung wird Reiter und Neuer-Reiter-Seite (Entscheid David 7.9., Variante A) | erledigt | `R14-REITER-MODELL.md` |
| R13B | Reiterstreifen ohne Layout-Sprung (Nachzug zu §8 Nr. 8, CLS-Wurzel) | erledigt (PR #748) | `R13B-REITER-CLS.md` |
| R14b | Meta-Seiten (`/ueber`, `/methodik`, `/einstellungen`, `/kontakt`, `/suche`, `/abdeckung`, 404) tragen ebenfalls Reiter | erledigt (PR #757) | `R14-REITER-MODELL.md` (Nachtrag) |

**Nachträge D30–D33** (Befunde David am Bild/Dev-Server, Wortlaut im Befundregister der Session):
D30 Bezüge-Zeile klappt auf, zeigt aber nur den Rechnen-Block → Entscheide + Materialien lazy mit
Skelettzeile; D31 Norm-Popover nicht lesbar (kein Papier-Hintergrund/z-Ebene) → EIN Popover-Rezept;
D32 Erlass-Suche von der Gliederungs- auf die Gesetzesspalte, **Entscheid 7.9.: das Suchfeld folgt
der Lesespalte** (auch bei eingeklappter Gliederung; ersetzt den D28-Wortlaut), mit N4 in EINER
Kopfzeile zusammen mit den Griffen ⚖/Ansicht (−44 px); D33 «Ansicht Rechtsprechung» oben rechts →
**Entscheid 7.9.: Variante A**, Panel als überlagerndes Blatt mit Δ=0 (Variante C «zweites Pane»
als Folgeschritt, §8). N1: der Kopfzähler ist die Bezugsgrösse (gleiche Zahl wie die Bezüge-Zeile),
gefiltert wird nur im Panel. Protokoll: `R6E-LESER.md`, `R6F-LESER.md`, `R6G-LESER.md`.

**Nachwünsche D34–D45 (David am Tag des 7.9., nach der Landung #739).** Je Wunsch ein eigener
Agent, je Wunsch ein eigener PR; Tabelle Thema/PR/SHA/Protokoll in der Session-Karte
(`STRUKTUR.md`, Abschnitt «Nachwünsche 7.9.»). D34 Bezüge-Zeile vom Artikelkopf ans Artikelende
(`R6J-BEZUEGE-FUSS.md`, #744) · D36 «Einstellungen» wieder unten in der Seitenleiste, abgesetzt,
die vier übrigen Meta-Links bleiben im Fuss (`D36-SEITENLEISTE.md`, #745) · L6 Pane-Kopf nennt die
Kurzform (`L6-PANEKOPF.md`, #746) · D37 die **Gruppen** der Seitenleiste starten zugeklappt
(Korrektur Davids auf Rückfrage; die Leiste selbst bleibt wie bisher — Bilder `d37-*.jpg`, #747) ·
D38 die Suchtreffer ersetzen den Gesetzestext statt in der Gliederung zu erscheinen
(`R6K-SUCHE-LESESPALTE.md`, #749) · D39 Begrüssung als Kopf, «Sammlung» weg, Datum + Uhrzeit
darunter (`D39-BEGRUESSUNG.md`, #751).

**D35 «Funktionszeile am Artikelende» — Entscheid David: «A und verlustfrei».** Erst Untersuchung
und Vorschlag (David: «untersuch das zuerst»), dann vier Bauten: F4 Menü-Anatomie und Baustein
`ui/Menue` (`D35-F4-MENUE.md`, #752) · F3 Dreier-Wahl «Fassung | Fussnoten | aus», verlustfrei
(nur die A-Fussnoten tauschen; `D35-F3-FASSUNG.md`, #755) · F1 die Funktionszeile selbst
(`D35-F1-FUSSZEILE.md`, #756) · F2 Kopf ohne Artikel-Zahl, Erlass-Blatt, Rubriken im Ansicht-Menü
abwählbar (`D35-F2-KOPF.md`, #758). Zwei Nachträge Davids binden den Bau: die Fusszeile ist
**immer zu beim Laden** und öffnet nur auf Klick (kein Dauer-Merker), und **jede** Rubrik ist im
Ansicht-Menü einzeln abwählbar.

**Nachgelandet (7.9.2026, Abend):** D41/D42 (das Ansicht-Menü bekommt keine Abdunkelung, der
Gesetzes-Pane bleibt im Split bedienbar — #759, 967caad87) · D44 (Aktion «⧉ Artikel daneben»
ersatzlos entfernt — #760, ef0519bf4) · D40 (Fassungs-Slot wird eine Rubrik der Funktionszeile,
der Kopf-Slot entfällt — #761, ae32c5c4e). D43 «wo sind die Materialien?» ist eine Sichtprüfung an
einem Artikel MIT Materialien; D45 ist ein Folgeschritt (§8 Nr. 11).

**Gesamtprüfung (Schluss, 7.9.2026).** Zwei Linsen: (a) Ästhetik hell/dunkel über alle Bereiche —
11 hoch/11 mittel, abgearbeitet in den Fixern GA (Köpfe, Dopplungen, Übersichten) und GB (Leben,
Registerfarbe, Kästen), Protokolle `GA-KOEPFE.md`, `GB-LEBEN.md`; (b) Funktions-Inventar im
Browser — **90 OK · 6 Defekt · 0 verloren**, Defekte behoben in `KF-KLEINFUNDE.md` (Tagerechner,
Kopf-Suche/Esc), `D5-VORLAGEN.md` (Pflichtprüfung) und `D6-GESETZE.md` (Schnellzugriff beim
Filtern). Damit ist Davids Auflage «keine schwer erarbeitete Funktion darf verloren gehen» belegt,
nicht behauptet.

Reihenfolge wie vorgeschlagen — nach (b) kippt R1 allein 202+141+89 Dateien optisch, ohne
sie anzufassen. Einzige Abweichung zum Zielbild: `.lc-glass` wird **nicht entfernt/umbenannt**,
nur entkernt (Druck-Tor, (f)).

**Prüf-Fokus, je Runde gleich** (§5): @1440 hell+dunkel, @390 hell, Split-View mit zwei Panes.
Unten steht darum nur, *welche Routen* der Prüfer sieht.

**R1 · Grundschicht (ein Ort)** — Papier/Tinte, Registerfarben, Radien 0, Overline
entversalt, Literata/Archivo geladen.
*Dateien (6):* `src/index.css` · `tailwind.config.js` · `src/main.tsx` ·
`scripts/gen-font-fallbacks.ts` · `scripts/farbwelt-tabellen.ts` · `package.json`.
*TABU:* jede `.tsx` ausser `main.tsx`; Grid-/Layout-Änderungen.
*Wächter:* farbwelt-Tabellen · `OVERLINE_DIM_RE` · `leser-typo-tokens` · `leser-schriftskala` ·
`design-gruppenkopf-karten-c` · `check:lizenzen` · `check:perf-budget`.
*Fertig:* `check:seriell` grün, Golden byte-gleich, Kontrast-Protokoll neu erhoben (Muster
`abnahme/startseite-v3/KONTRAST-PROTOKOLL.md`).
*Routen:* «/» · `/gesetze/bund/OR` · `/rechner` · `/rechtsprechung` — Frage an den Prüfer:
wirkt es ohne Layout-Arbeit schon ruhig?

**R2 · Rahmen** — Titelblatt-Zeile mit Bereichs-Reitern statt Glas-Topbar, Seitenleiste
auf «/» weg, Pane-Kopf und Ausgabe-Zeile.
*Dateien (9, alle `src/components/layout/`):* Shell · Topbar · Sidebar · ReiterUebersicht ·
HeaderSuche · Logo · Footer · Pane · PaneKopf.
*TABU:* `src/pages/**`, `components/start/**`, `lc-glass` umbenennen, Schublade-Fokusfalle.
*Wächter:* `design-r3b-chrome` · `design-r2d-mobil-zustaende` · `druck-fundstellen`(+e2e) ·
`e2e/w223b-kopf-seitenleiste`.
*Fertig:* Tore grün, Schublade + Fokusfalle unverändert bedienbar.
*Routen:* «/» (ohne Seitenleiste) · `/gesetze` · Leser im Split — Frage: bricht der Kopf bei
zwei Panes, geht die Schublade @390 auf/zu?

**R3 · Startseite als Inhaltsverzeichnis + Sprach-Diät** — Marginalienspalte,
Register-Striche, Listen statt Kacheln; sichtbare Slogans weg.
*Dateien (~13):* `pages/Startseite.tsx` · `lib/startseiteModule.tsx` · `components/start/*`
(11) · `lib/seo.ts` (nur sichtbare Konstanten).
*TABU:* `startseiteConfig.ts` (Katalog = SSoT), Zähler-Generat, `check:seo-index`-Werte ohne
`index.html`-Nachzug.
*Wächter:* `design-r2c-bausteine` · `check:seo-index` · `check:zaehler`.
*Fertig:* Zahlen zahlgleich (Zähler-Tor), keine Kachel-Optik mehr.
*Routen:* «/» — auch als Inhalt eines Panes der Split-Ansicht.

**R4 · Gesetzesleser** — Literata-Satzspiegel, Randtitel links, Bezüge rechts.
*Dateien (~12):* `gesetz-leser/v3/{LeserRahmenV3,rahmenSpalten,LeserLesespalte,LeserKopf,
LeserSeitenleiste,leserGeometrie}` · `parts/{ArtikelLeser,BezuegeZeile,ErlassLeserKopf}` ·
`components/normtext/ArtikelBody.tsx` (nur Typo-Klassen) · `leserSchrift.ts` ·
`DESIGN-REGLEMENT.md` §N.
*TABU:* `bezuegeLaden.ts`, `bezugAuswahl.ts`, `gliederungsModell.ts`, jede Extraktions-,
Sprung- und Suchlogik, `normalisiereTarifText()`. **Keine neue Bezüge-Logik** ((e)).
*Wächter:* `leser-schriftskala` · `leser-typo-tokens` · `check:golden-normtext` (byte-gleich).
*Fertig:* CPL ≤ 75 gemessen, Golden byte-gleich, Bezüge-Spalte zeigt dieselben Kanten wie
das Panel.
*Routen:* `/gesetze/bund/OR#art-336_c` — Frage: fällt die Marginalie unter `@3xl/pane` sauber
in die Zeilenform?

**R5 · Rest-Sweep + Nachzug** — Übersichten, Rechner-Köpfe, Entscheid-Leser, Karten/Chips/
Notices; `rounded-full`-Pillen und `shadow-*` an nicht-schwebenden Flächen räumen;
Brass-Restbestände benennen.
*Dateien:* `layout/{InhaltsKopf,RechnerKopf,SeitenKopf,LeserKopfGeruest}.tsx` ·
`components/rechtsprechung/**` · `components/ui/**` · `DESIGN-REGLEMENT.md` (Token-Abschnitt) ·
`.claude/rules/design.md` · `STRUKTUR.md`-Karte · `bibliothek/` + `INDEX.md`.
*TABU:* Rechenlogik, Engines, Daten. *Wächter:* `design-r5-konsistenz` ·
`design-konsistenz-chips-marken` · `check:bibliothek` · `check:steuerdeckel`.
*Fertig:* kein `shadow-*` ausser Menü/Dialog/Popover; `check:seriell` + e2e grün;
Bibliothek-Eintrag steht. **Quellen:** `scratchpad/agy-design-w224.json` (Swiss-Style/
Farbpaletten, URLs, Abruf 5.9.2026) und `scratchpad/agy-nichtki.json` (Anti-KI-Sprache); die
Sonnet-Recherche zu Schrift/Lizenz ist **in Session erhoben, ohne Datei-Artefakt** — genau so
ausweisen, nicht als belegte Quelle führen.
*Routen:* Rundgang über alle sechs Bereiche.

## §7 · Spec `W2·25-ARBEITSMAPPE` — Anheften und Arbeitsmappe (eigener Schritt nach W2·24)

Angelegt 6.9.2026 beim Reglement-Nachzug. Anker: §5a Ziff. 5 (angeheftete Reiter) und
Ziff. 9 (Arbeitsmappe) · `abnahme/design-identitaet/uebergabe/R11-PLAN.md` M5 und §3.
Der Schritt hängt an der Landung von `W2·24-DESIGN-IDENTITAET` (`dep`), weil beide
dieselbe Datei-Fläche berühren.

**Nachtrag 7.9.2026 (R13).** Die zweite Reiter-Runde hat Anheften erneut als Kandidat geprüft und
bewusst hier gelassen: `W2·25` bleibt ein eigener Schritt, weil Anheften den flachen Reiter-Speicher
umsortieren muss (Risiko D16) und nicht als zweite Anzeige-Ordnung nebenherlaufen darf. Ebenfalls
aus R13 entschieden und für `W2·25` bindend: «+» erzeugt keinen zweiten leeren Reiter, solange ein
leerer offen ist; ein Klick auf den bereits aktiven Reiter tut nichts (Browser-Norm); der leere
Reiterstreifen auf «/» behält seine reservierte Höhe (CLS 0) — die Frage, ob der «+»-Knopf allein
genügt, liegt bei David.

**Nachtrag 7.9.2026 (R14, Entscheid David — Variante A).** Der letzte Satz des R13-Nachtrags ist
**gegenstandslos geworden**: die Sammlung «/» ist seit R14 ein gewöhnlicher Reiter und zugleich die
Neuer-Reiter-Seite, die Leiste steht dort nie mehr leer (`R14-REITER-MODELL.md`). Der leere
34-px-Streifen existiert nur noch auf den Meta-Routen (/ueber, /methodik, /einstellungen,
/kontakt), wo «kein Reiter» die wahre Auskunft ist. Die R13-Regel «höchstens EINE
Neuer-Reiter-Seite» bleibt für `W2·25` bindend — sie fällt seit R14 ohne Sonderfall aus
`lib/tabs.merkeTab` heraus, weil die Sammlung an ihrer Reiter-Identität erkannt wird.

**Ziel (zwei Teile, in dieser Reihenfolge).**
1. **Anheften.** OR/ZGB/ZPO … lassen sich anheften: schmaler Reiter nur mit Kürzel, ganz
   links, ohne ✕ (Schliessen nur über das Kontextmenü), überlebt «Alle schliessen» und den
   Neustart. Dateien laut M5: `src/lib/tabs.ts` (`TabEintrag.fest?: boolean`,
   `hefteAn`/`loeseAb`), `src/components/layout/Reiterleiste.tsx`,
   `src/components/layout/TabPanel.tsx`.
2. **Arbeitsmappe.** Offene Reiter als benannte Mappe lokal speichern und öffnen, als
   Adresse teilbar — deterministisch (§2), ohne Konto, ohne Server. Aufwand L; die
   `?p=`-Erweiterung und die Namensgebung gehören dazu.

**Risiko — der D16-Konflikt (wörtlich aus `R11-PLAN.md` §3 bzw. M5, nicht umformuliert):**

> **Risiko: der D16-Konflikt.** Fixer 1c hat gerade jede Anzeige-Gruppierung entfernt, weil
> sie das Ziehen einsammelte («es geht nur wenn nur gesetze offen sind — bug»,
> `e2e/w224-reiter-umordnen-d16`). Anheften darf deshalb **keine zweite Anzeige-Ordnung**
> sein, sondern muss den Speicher umsortieren; das Ziehen eines freien Reiters vor einen
> festen muss dann verhindert (nicht stillschweigend korrigiert) werden. Ohne diese Auflage
> ist M5 ein D16-Rückfall — im Zweifel zurückstellen.

**Grenzen.** Reine Darstellungs-/Zustandsschicht (§3); keine Engine, keine Rechenlogik,
keine Korpus-Daten. Kein Konto, kein Netz-Zustand — die Mappe lebt in `localStorage` und in
der Adresse. Die bestehende Mechanik (`useTabs`, `usePaneLayout`, `usePaneDnd`, Verlauf) wird
weiterverwendet, nicht verdoppelt (§5/§10).

**Wächter.** Unit: Anheften ⇒ Position 0 im flachen Speicher; `leereTabs` lässt feste stehen;
Ziehen eines freien Reiters vor einen festen wird abgelehnt (sichtbar, nicht still).
E2E: Mappe speichern → alle Reiter schliessen → Mappe öffnen ⇒ dieselbe Reiterfolge
inkl. Lesestellung. **Rot-Probe Pflicht** (heute kein `fest`-Feld auf HEAD).

**Offen, wartet auf David (nie selbst entscheiden):** ~~ob der leere 34-px-Reiterstreifen auf
«/» mit dem «+»-Knopf allein genügt (R11-Auflage R2)~~ — **mit R14 erledigt** (7.9.2026): auf «/»
gibt es keinen leeren Streifen mehr, dort steht der Sammlungs-Reiter. Neu offen und ebenfalls für
David: ob auch die Meta-Routen (/ueber, /methodik, /einstellungen, /kontakt) einen Reiter tragen
sollen — heute bleiben sie bewusst reiterlos (`R14-REITER-MODELL.md`, §Offengelegte Grenze).

### Korrektur 13.9.2026 — Anlass: Ist-Abgleich beim Bau von `W2·25`

Zwei Stellen dieses §7 beschreiben einen Stand, den der Code nicht mehr trägt. Die Absätze darüber
bleiben unverändert als **datierte Belege** stehen (§0 Ziff. 2b: Belege altern nicht, sie werden
ergänzt); hier steht, was heute gilt.

1. **Der letzte Absatz ist überholt, nicht falsch.** Er galt bis `8d398874e`. Der **Nachzug R14b**
   (7.9.2026, `abnahme/design-identitaet/R14-REITER-MODELL.md` §«Nachzug R14b») hat die Grenze
   geschlossen: `lib/tabs.istReiterPfad` ist ersatzlos gestrichen, **jede Route ist Reiterinhalt**,
   auch die vier Meta-Routen. Gemessen am Ist-Code (13.9.2026): `istReiterPfad` kommt in `src/`
   nicht mehr vor, `components/TabTracker.tsx` legt auf jeder Adresse einen Reiter an.
   **Der Entscheid selbst bleibt offen und wird hier NICHT getroffen:** R14b nennt ihn einen
   Orchestrator-Entscheid, dessen **Bestätigung durch David aussteht**. `W2·25` hat ihn nicht
   berührt und baut nichts darauf.
2. **Die R13-Regel «höchstens EINE Neuer-Reiter-Seite» ist erfüllt** und braucht in `W2·25` keine
   eigene Stelle: `merkeTab` erkennt die offene Sammlung an ihrer Identität (R14, Rückbau).

### Stand 13.9.2026 — gebaut, mit Rot-Probe

Beide Teile stehen auf `feat/w2-25-arbeitsmappe`. Kein Merge, kein Deploy (eigener Auftrag).

**Teil 1 · Anheften.** `TabEintrag.fest` + `hefteAn`/`loeseAb`/`festeZone`/`zugErlaubt`/`istFest`
in `src/lib/tabs.ts`; schmale Reiterform ohne ✕/⧉/Lesestellung in
`components/layout/reiterleiste/Reiter.tsx`; «Anheften»/«Lösen» im Kontextmenü; Zone «Angeheftet»
im Überlauf-Blatt (`TabPanel.tsx`).
Die **D16-Auflage ist wörtlich eingelöst**: keine zweite Anzeige-Ordnung — `ladeTabs` partitioniert
den EINEN flachen Speicher (feste zuerst, stabil), die Leiste zeichnet weiter `ordnung = tabs`.
Ein Zug über die Zonengrenze wird **abgelehnt, nicht korrigiert**: `ordneTabsUm` meldet `false`
und schreibt nichts, die Einfügemarke trägt `data-reiter-sperre="fest"` und wird stumpf
(`bg-ink-400 opacity-50`), `dropEffect` geht auf `'none'`. Dieselbe Grenze binden die Menüzeilen
(«Nach links»/«An den Anfang» meinen die EIGENE Zone) und Alt+⇧+←/→.
GEMESSEN (gebautes `dist/`, Chromium @1440, `/gesetze/bund/OR#art-336_c`): angeheftet **39.05 px**
gegen frei **179.09 px**.

**Teil 2 · Arbeitsmappe.** `src/lib/mappen.ts` (`localStorage`-Schlüssel `lexmetrik-mappen`,
höchstens 12 Mappen, alphabetisch, ohne Zeitstempel) · `lib/tabs.uebernehmeMappe` (feste bleiben,
verdrängte freie gehen in den Schliess-Ring) · `reiterleiste/MappenDialog.tsx` (lazy, 1.97 KB gzip)
· Menüzeilen am Leerraum UND am «+N»-Knopf.
**Adress-Format** — `?mappe=` mit `,` als Trenner, `*` als Anheftungs-Marke, Pfade
`encodeURIComponent`-kodiert mit wieder eingesetztem `/` (der Schrägstrich ist im Query-Teil
erlaubt, RFC 3986 `pchar`), Beispiel:
`https://lexmetrik.ch/rechner/zpo-fristen?mappe=*/gesetze/bund/OR%23art-336_c,*/gesetze/bund/ZGB,/vorlagen/arbeitsvertrag`
Gelesen wird der ROHE Query-Wert, nicht `URLSearchParams.get` — der dekodierte sonst ein `%2C` aus
einem Rechner-Pfad zu einem Trenner, den es nicht gibt. Der Parameter verlässt die Adresszeile
nach dem Übernehmen (`replaceState`, wie `?p=` in `usePaneLayout`) und steht in keinem Reiterpfad.

**Offengelegt (§8), kein Mangel, aber eine Eigenschaft der Sache:** eine geteilte Mappe trägt die
Reiter-Adressen — und Rechner-Eingaben stehen schon heute IN der Adresse (gemessen
13.9.2026: `/rechner/zpo-fristen?e=2025-01-15&u=tage&l=30&v=ordentlich&k=ZH&…`). Wer eine Mappe
weitergibt, gibt sie mit. Der Speichern-Dialog sagt es im Klartext, statt es wegzuglätten;
dieselbe Offenheit wie bei «Adresse kopieren» am Reiter (R13-9).

**Nebenbefund beim Sichten (kein Defekt):** der Rand-Schub (W2·18 Welle 3 Punkt 2) schiebt einen
gezogenen Reiter auch dann durch die Ordnung, wenn der Zeiger über einem ANGEHEFTETEN Reiter steht
— er hält dabei an der Zonengrenze, wie er am Ende des Streifens am Anschlag hält. Richtig so,
aber es machte eine Sonde zeitabhängig: sie zieht darum jetzt den ersten freien Reiter
(Herleitung im Kopf des Falls, `e2e/w224-reiter-umordnen-d16.e2e.ts`), und ein eigener Fall misst
den Schub an der Grenze.

**Wächter.** Unit: `src/tests/reiter-anheften.test.ts` (15) · `src/tests/reiter-fest-form.test.tsx`
(4) · `src/tests/mappen.test.ts` (18). E2E: `e2e/w224-reiter-umordnen-d16.e2e.ts`
(«W2·25 — Anheften …», 8 Fälle) · `e2e/w224-r11-reiterleiste.e2e.ts` («W2·25 — die Arbeitsmappe …»,
4 Fälle). Rot-Probe je Datei gefahren und im jeweiligen Commit mit dem gemessenen Ist-Wert belegt.

## §8 · Folgeschritte nach der Landung (Stand 7.9.2026)

Gebucht in `ROADMAP.md` unter `W2·24-DESIGN-IDENTITAET` als eigene Zeilen; hier steht das Detail.

1. **`W2·24-C` · ⚖ öffnet Entscheide im zweiten Pane (Variante C zu D33).** Heute Variante A
   (überlagerndes Blatt, Δ=0 — gewählt, weil sie ohne Layout-Sprung auskommt). Variante C legt das
   Rechtsprechungs-Panel als echtes zweites Pane an (Split-Regel M3): Zustand in der Adresse,
   erneuter Klick schliesst, Reiter für beide Panes. Voraussetzung: Pane-Kopf-Name (L6) entschieden.
2. ~~**Bezüge-Zeile: Kopfzähler gefiltert vs. ungefiltert** (`R5-F1K` §7)~~ — **entschieden
   11.9.2026** (Mandat David «führe alles durch»): EINE Zahl, bei aktivem Filter die gefilterte,
   Gesamtzahl nur im `title` — kein zweites sichtbares Zahlenpaar. Detail: §9 Z3.
3. **R13-11 · Reiter-Adress-Kern.** Reiter werden an mehreren Stellen über Pfad-Vergleiche
   identifiziert (Wiederherstellen, Dublettenerkennung, Kurzform, Lesestellung). Ein gemeinsamer
   Adress-/Identitäts-Kern macht die vier Stellen zu einer; verhaltensneutral (§6), Golden unberührt.
4. **Rechtsprechung: Geschäftsnummer-Kurzform statt Allowlist-Eintrag.** Lange Geschäftsnummern
   reissen die R8-Regel «nichts abgeschnitten» und stehen darum heute in
   `e2e/kein-abschnitt.allow.json`. Richtig wäre eine Kurzform-Regel im Rubrum; die Allowlist-Zeile
   fällt dann weg (Rückbau statt Bewachung, §17-Gegengewicht).
5. **`StatusBadge` «maschinell».** Die Gesamtprüfung GB fand Angaben, die maschinell erzeugt sind
   und heute als «entwurf» laufen — §8 Ehrlichkeit verlangt einen eigenen, sichtbaren Zustand.
   Fachliche Abnahme David, weil es die Statuslehre berührt.
6. **`qsui-hierarchie`: Vorlagen-Schranke 1.2533.** Die Schranke wurde für die Vorlagen-Köpfe
   gesetzt; nach R7/R9 prüfen, ob sie auf den Regelwert zurück kann — sonst begründet festschreiben.

7. **Leser-Mount auf langsamem Netz: 68-px-Sprung** (CLS 0.066 nur unter langsamem 4G, PR #743
   §8 a): `LadeAnzeige` reserviert den Vorgriff nicht, den `LeserKopf` per negativem Margin
   verschluckt — braucht eine Höhenquelle, die auch im Ladezustand gilt (§5). Kein W2·24-Rückschritt.
8. ~~**Reiterstreifen 0.0014 CLS** (PR #743 §8 b)~~ — **erledigt 7.9.2026 als R13B** (PR #748,
   `R13B-REITER-CLS.md`): der Streifen durchlief vier Zustände statt einem; Wurzel behoben.
9. **Vorlagen-Hierarchie am Anschlag** (FD 7.9.: `arbeitsvertrag` 1.2135 gegen 1.25): Einleitungsblock
   452 px + Hauswirtschafts-Zeile «Eingaben zurücksetzen» über dem Formular — eigener Hierarchie-Schritt.
10. **OR-Erstsprung > 7 s auf Produktion** (Live-Sicht 7.9.): 2,2-MB-Erlass lädt vor dem Ankersprung
   vollständig — gehört zu `W2·24-PERF-REST` (Messung erst, dann Fix).

11. ~~**D45 · Entscheid-Klick in der Fusszeile öffnet daneben.**~~ — **umgebucht 11.9.2026 nach
   §9 Z5** (W2·26-FUNKTIONSZEILE). Wortlaut des Befunds bleibt dort erhalten.
12. ~~**«Daneben öffnen» mit `?r=`-Instanz** (F1-Rest)~~ — **gestrichen 11.9.2026**: Widerspruch zu
   ROADMAP.md:464 aufgelöst — D44 (#760, 7.9.2026) hat die Aktion «⧉ Artikel daneben» bewusst
   ersatzlos entfernt, sie kehrt nicht über den Adress-Kern zurück.
13. ~~**Bezüge-Zähler in den Erlass-Payload** (D34-Nachfix)~~ — **umgebucht 11.9.2026 in den eigenen
   Schritt `W2·26-FUNKTIONSZEILE-ZAEHLER`** (`feld: korpus`, Gegenprüfung Pflicht).
14. ~~**OR-Leser trägt 15'239 Knöpfe im DOM** (§15, seit F1 sichtbar)~~ — **umgebucht 11.9.2026 nach
   §9 Z6** (W2·26-FUNKTIONSZEILE), mit Logikverlust-Bewertung: keiner (nur Render-Zeitpunkt).
15. **Rest-CLS 0.0003 im Leser-Kopf**: `LeserKopf.tsx:289` (`data-v3-kopf-griffe`, Klassenwechsel
   `gap`/`pl`), der einzige verbliebene Sprung in `e2e/leser-r1-r2`.
16. **«OR» dreimal untereinander @1440** (L6-Nebenbefund): Reiter · Pane-Titel · Leser-Kennung.
   Der V3-Leser sollte sein Kürzel im Pane abgeben, statt es ein drittes Mal zu setzen.

Ausserdem gebucht, aber eigene Schritte: `W2·25-ARBEITSMAPPE` (Anheften, §7 dieses Fahrplans) und
`W2·24-PERF-REST` (`fremdRoutingFormB`/`artikelnPluralVerweise`, erst verifizieren, dann fixen).

## §9 · W2·26 Funktionszeile am Artikelende — Überarbeitung (Mandat David 11.9.2026)

**Status: erledigt** — `W2·26-FUNKTIONSZEILE` #788 (`efc7129b8`), `W2·26-FUNKTIONSZEILE-ZAEHLER` #791 (`5a09f161b`). Gemessen: Knöpfe im DOM (OR-Leser) **13 532 → 10 160** (−3 372, −24,9 %); sichtbare Fussnoten-Marker bei abgewählter Option **215 → 0**; Requests je Erlass (Snapshot+Sidecar statt Snapshot+Sidecar+Zähl-Datei) **3 → 2**.

Gebucht in `ROADMAP.md` unter `W2·26-FUNKTIONSZEILE` (Bau, `feld: leser`) und
`W2·26-FUNKTIONSZEILE-ZAEHLER` (Korpus-Nachfix, `feld: korpus`); hier steht das Detail. Mandat
(Chat 11.9.2026, wörtlich sinngemäss): «überarbeite insgesamt die Funktionszeile am Artikelende;
Fassung soll nur ‹gilt seit XXX› zeigen, erst beim Aufklappen erscheinen die Angaben; Fussnoten,
die z. B. nur eine SR-Nummer enthalten, müssen ebenfalls weg sein, wenn Fussnoten abgewählt sind;
alles sauberer, übersichtlicher, besser bedienbar.» Dazu die offenen Nachzüge aus §8 (D45, Nr.
13/14, LM-197-Anteil) und die Befunde C1–C4 der Sichtung 11.9.2026 (Materialien-Spec §11 veraltet,
`DESIGN-REGLEMENT.md` §N veraltet, Komponentenname «BezuegeKopf»).

**Ausgangslage (Code, Stand main 7f87ed0bb):** Mount `src/pages/gesetz-leser/parts/ArtikelLeser.tsx:697-702`;
Container `parts/BezuegeKopf.tsx` (Markup `.lr7-bez-zeile` :207-211, Aufklapp-Block :213-236);
Rubriken `parts/ArtikelLeser.bezuegeFuss.tsx` (`reg:'f'` Fassung :150-182, `'r'` Entscheide :184-217,
`'m'` :231, `'g'` :254, `'w'` :267); Aktionen `parts/ArtikelAktionen.tsx` (Zitat :95, Link :98,
Amtlich :104); Typ `BezugsMarke` (`BezuegeKopf.tsx:77-114`); Ansicht-Menü `leserOptionen.ts:122-124`
(`FussRubrik = 'f'|'r'|'m'|'g'|'w'|'a'`), `v3/LeserRubrikenWahl.tsx:55-80`. Fassungs-Inhalt heute
`<ArtikelHistorieZeile>` (`parts/ArtikelHistorie.tsx`).

### Zielbild (verbindlich)

Z1 **Eine ruhige Zeile.** Links die Rubriken, rechts die Aktionen. Das Wort «Bezüge» entfällt aus der
Zeile (die Rubriken sprechen mit Zahl + Wort für sich); im Ansicht-Menü bleibt der Gruppenname.

Z2 **Rubrik Fassung, zugeklappt:** nur `Gilt seit 1.1.2023 ›` — Datum der für diesen Artikel
geltenden Fassung (Quelle: bestehende Historie-Daten, dasselbe Datum wie der bisherige Chip
«Gilt seit …» in `ArtikelHistorie.tsx`). Keine Zahl davor, keine weiteren Angaben. Ist kein Datum
bekannt: `Fassung ›`. **Aufgeklappt:** Fassungszahl («3 Fassungen»), Zeitleiste (bestehende
`ArtikelHistorieZeile`), Platz für die spätere Entstehungs-Karte (W2·6c E3, Slot = derselbe
Aufklapp-Block, kein zweiter Slot nötig — ersetzt C5/C6 der Materialien-Spec §11).

Z3 **Zähler-Rubriken** (Entscheide · Materialien · Verweise · Rechner): `3 Entscheide ›`, bei 0
unsichtbar (bestehend). **Entscheid Doppelzahl (R5-F1K §7):** EINE Zahl — bei aktivem Filter die
gefilterte, Gesamtzahl nur im `title`. (Entschieden 11.9.2026, Mandat David «führe alles durch» —
löst §8 Nr. 2/D20 ab.)

Z4 **Bedienung:** Akkordeon je Artikel (höchstens eine Rubrik offen; Öffnen einer anderen schliesst
die erste); Chevron zeigt den Zustand (`›` zu, gedreht offen); `aria-expanded`, `aria-controls`;
Tastatur (Enter/Space, Escape schliesst); Fokus bleibt auf dem Griff. Beim Laden immer zu (D35).
Zustand lokal (useState), kein localStorage.

Z5 **D45 — Entscheid-Klick daneben.** In der offenen Rubrik «Entscheide» öffnet ein Klick auf einen
Entscheid ihn daneben (Split nach D30-Spec / Regel M3, wie in `.lr-notiz` via `randNotizZiel`);
⌘/Ctrl-Klick = neuer Reiter; der Neben-Griff «im Blatt öffnen ›» (D35-F2) bleibt als Weg zur
Vollseite. Unter der Split-Breite (320 px-Mobil) navigiert der Klick wie heute. (Löst §8 Nr. 11 ab.)

Z6 **§15 Knopfzahl.** Die drei Aktionen (Zitat · Link · Amtlich ↗) werden nur gerendert, wenn der
Artikel Hover oder Fokus-within hat oder eine Rubrik offen ist; auf Geräten ohne Hover
(`@media (hover: none)`) immer. Rubrik-Griffe bleiben immer im DOM. Logikverlust-Bewertung:
keiner (nur Render-Zeitpunkt, kein Inhalt). Messung vorher/nachher am OR-Leser
(`document.querySelectorAll('button').length`) im PR-Text; Tor `check:perf-budget` grün.
(Löst §8 Nr. 14 ab.)

Z7 **Zeichen-Kanon (LM-197, Fusszeile-Anteil):** in der Zeile nur `›` (aufklappen), `↗` (extern),
`✓` (Rückmeldung «kopiert»). Sonst keine Symbole.

Z8 **Fussnoten-Option:** Ist im Ansicht-Menü «Fussnoten» abgewählt, verschwinden ALLE Fussnoten
inkl. Fussnoten-Marker im Text — auch solche, die nur eine SR-Nummer, ein Kürzel oder einen
Kurzverweis tragen (heute bleiben diese stehen). Zuerst Nullprobe: Kommando + Ausgabe, welche
Fussnoten-Klasse heute stehen bleibt und warum (eigener Render-Pfad?). Kein Inhalt geht verloren:
Option an ⇒ alles wie heute.

Z9 **Umbenennung:** `parts/BezuegeKopf.tsx` → `parts/Funktionszeile.tsx`, Komponente
`Funktionszeile`, Typ `BezugsMarke` bleibt; Kommentar-Kopf mit Herkunft (D34/D40). CSS-Klassen
`.lr7-bez*` bleiben (Golden/Prerender), nur TS-Bezeichner. Alle Importe/Tests nachziehen.

Z10 **Druck:** Zeile bleibt `print:hidden`. Marginalie/Chip im Kopf: kein Rückbau-Rest zulässig.

### Tore und Beweise
- Unit: Fassungs-Label (Datum/kein Datum), Akkordeon-Reducer, Doppelzahl-Regel.
- Playwright (`e2e/`): (a) Fassung zu zeigt nur «Gilt seit …», offen zeigt Zahl + Zeitleiste;
  (b) Akkordeon; (c) Aktionen erscheinen bei Hover/Fokus, auf `hover:none` immer; (d) Fussnoten
  aus ⇒ 0 Fussnoten-Marker im OR-Leser (heute > 0 ⇒ Test zeigt vorher rot); (e) D45 Split.
  Playwright-Falle: `locator.filter({has})` einmal auflösen, `nth()` festhalten.
- `npm run gate` grün; `check:perf-budget`; Golden der Prerender-Seiten byte-gleich, sofern die
  Zeile nicht im Prerender liegt — liegt sie darin, Golden-Update als eigener, begründeter Commit.
- Nach main-Merge im PR: `gen:e2e-shards` regenerieren.

### Nicht-Ziele
Keine Änderung an Zähl-Datei/Fetch (eigener Schritt `W2·26-FUNKTIONSZEILE-ZAEHLER`, korpus);
keine Entstehungs-Karte (W2·6c E3, folgt); kein Eingriff in Rechtslogik/Korpus.
