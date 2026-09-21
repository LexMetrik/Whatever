# FAHRPLAN-ERLEDIGT-ABSCHNITTE
<!-- Archive der abgeschlossenen Fahrplan-Abschnitte -->

**Zweck:** Sammlung erledigt-/Stand-Abschnitte (14.8.2026), um Fahrplan-Dateien zu entschlacken.

**Datum Verschiebung:** 14.8.2026.

**Hinweis:** Alle Abschnitte wurden wörtlich verschoben; die Quellangabe je Block zeigt ihre Herkunft.

---

<!-- aus fahrplaene/FAHRPLAN-DESIGN-WAERME.md · verschoben 14.8.2026 -->
### D-0 · Mess-Fundament `scripts/check-farbwelt.ts` — SCHRITT 0 ✅ (PR #209, 11.7.2026)

**✅ GEBAUT (Nachtrag durch D-1 — der D-0-Branch entstand vor dem #208-Merge):**
`check:farbwelt` live in `check:seriell`→`gate` (culori+apca-w3 devDep): 40
WCAG-Pflichtpaare hell+dunkel (FAIL), 6 §4b-B-Referenzwerte + 2 --paper-Fixpunkte
(FAIL bei Drift), Flächen-L-Leiter (FAIL); Hue-Drift/L-Monotonie/Chroma-Dämpfung
Erstlauf-WARNUNG; APCA nur beratend. Bekannte Risse als Baseline-Guard:
ink-500/well hell 4.48 (→D-4) · danger-500/paper dunkel 2.72 (→D-1.3).
Sollwert-Tabelle: `DESIGN-REGLEMENT.md` §F2b.
*(Befunde 33+38+40; ohne dieses Tor ist jedes «Kontrast-Gate» der Folge-Einheiten Prosa)*
- **Kern:** Script (culori, devDep + apca-w3) parst alle `:root`- und `html.dark`-Token
  aus `src/index.css` und prüft: (a) **WCAG-Paare hell+dunkel als FAIL** (Text ≥4.5:1,
  Nicht-Text/Linien ≥3:1 — die dokumentierten Paar-Listen aus den CSS-Kommentaren
  werden zu Assertions); (b) OKLCH: Hue-Drift je Familie ≤ ~8°, L-Monotonie je Rampe —
  **Erstlauf als WARNUNG** (die Ist-ink-Mitten reissen die Schranke heute; erst
  Sollwerte D-4/D-5 festlegen, dann scharf); (c) Dunkel-Rezept als Regel: Flächen-
  L-Leiter (well < paper < surface < raised, Delta ~0.02–0.03) + Chroma-Dämpfung
  (Akzent dunkel C ≤ hell −10 %); (d) **APCA-Spalte nur beratend** (Lc-Ziele Fliesstext
  ≥75 / Meta ≥60 / Nicht-Text ≥45), nie Fail — Erst-Fokus Dunkel-Paare.
- **Fläche:** `scripts/check-farbwelt.ts` neu, `package.json` (in `npm run check`),
  Sollwert-Tabelle als §13-Nachtrag in `DESIGN-REGLEMENT.md`.
- **Aufwand:** M · **Golden:** neutral (reines Prüf-Script, kein Runtime).


<!-- aus fahrplaene/FAHRPLAN-DESIGN-WAERME.md · verschoben 14.8.2026 -->
### D-1 · Sofort-Fixes (messbare Verstösse/Bugs — kein Geschmacksurteil, kein David-Entscheid) ✅ (12.7.2026)

**✅ GEBAUT (9 Posten, je eigener Pathspec-Commit mit Messwert vorher→nachher):**
1 FS-Null-Guard (Erstbesucher 1.0→1.08rem; Einstellungen-Bridge nicht betroffen) ·
2 Overline-AA (55 Overrides gestrippt, ink-500/well 4.48→ink-600 6.65; Regex-Gate in
`check:design-tokens`, Negativ-Beweis) · 3 sage/slate-line-Aliasse + 7 Call-Site-Swaps
(danger dunkel 2.72→7.54; +3 farbwelt-Pflichtpaare 40→46; -500-Mitten unangetastet) ·
4 Regeste in max-w-reading (~115–120→~70–75 CPL; Prerender = reine SEO-Shell, nicht
betroffen) · 5 Verdikt-Prosa max-w-reading (nur Prosa-`<p>`, 18 Formulare im geteilten
Rahmen) · 6 Chevron-Hex #8A6A2F→#826225 (4.37→4.91 auf well) · 7 Motion-Dedup
(`var(--dur-*)`) · 8 `--ink-fixed-dark`-Solitär (VOR D-4) + `--placeholder` als
dokumentierte Stufe · 9 `--status-outline/-border-soft/-hatch` (45/30/26 %,
verhaltensneutral). golden 209 byte-gleich; danger-RISS im Tor bleibt als
Token-Paar-Baseline bis D-4/D-5 (Call-Sites aliassiert).
*(Befunde 19, 18, 11, 20, 21, 12, 14, 15, 10 — alle klein, golden-neutral)*
1. **FS-Bug Entscheid-Reader** (19): `ladeFsIdx()` in `src/pages/EntscheidLeser.tsx:88–93`
   — `Number(null)===0` → jeder Erstbesucher liest 1.0rem statt Default 1.08rem
   (stiller R2-Bruch). Null-Guard-Einzeiler; Bridge-Pfad `src/pages/Einstellungen.tsx`
   (gleicher Key `rsp-fs-idx`) mitprüfen. Danach live 17.28px nachmessen.
2. **Overline-AA-Verstoss** (18): ~50 Fundstellen `lc-overline text-ink-500`
   degradieren die kalibrierte ink-600-Basisklasse auf 4.05:1 bei 11px (AA-Fail auf
   getönten Flächen). Overrides `text-ink-(500|400|300)` neben `lc-overline`
   mechanisch strippen (brass-Pairings stehen lassen) + **E1-Schranke** gegen das
   Muster in `scripts/check-design-tokens.ts` (98 Z., genau dafür gebaut) — axe war
   trotz Verstoss grün, das Regex-Gate ist der einzige Wächter.
3. **Dark-1.4.11-Fail danger/slate** (11): `html.dark` überschreibt nur -700-Töne;
   danger-500 fällt dunkel auf 2.72:1 (<3:1) bei direkter Nicht-Text-Nutzung
   (SperrtageZaehler-Balken, `border-t-danger-500`-Call-Sites, Einstellungen-Border).
   Fix nach dem bestehenden `--danger-line`-Muster: Aliasse `--sage-line`/`--slate-line`
   (dunkel auf -700 hebend) + ~4 Call-Site-Swaps. **-500 NIE dort verschieben, wo es
   die `-bg`-color-mix speist.** `text-warn-500` (RechnerKarte:79) ist aria-hidden-Deko
   — billig mitfixen, kein harter Fail.
4. **Regeste in die Lesespalte** (20): `RegesteBlock` rendert in
   `EntscheidLeser.tsx:~464` VOR dem `max-w-reading`-`<article>` → ~115–120 CPL im
   wichtigsten Textblock. Nur Render-Pfad 1 fixen (Pfad 2 bei Z.600/617 liegt schon in
   der Spalte); erst ohne eigenes Mass probieren, ggf. dokumentiertes ~44rem-Token
   (Box-Optik brass bleibt).
5. **Rechner-Verdikt-Prosa** (21): ~135 CPL bei 14px (B2-Verstoss). Lesespalten-
   Schranke NUR für Prosa-`<p>` im geteilten Ergebnis-Baustein
   (`ErgebnisAnzeige.tsx`/`ErgebnisBlock.tsx`) — Kacheln/`lc-tile`/Tabellen unbegrenzt;
   vorher grep-verifizieren, dass die Verdikt-Prosa wirklich durch den geteilten
   Rahmen läuft; Playwright-Stichproben über mehrere Rechner.
6. **Select-Chevron-Drift** (12): data-URI trägt VOR-Kalibrierungs-Hex `#8A6A2F`
   (index.css:427) ≠ kalibriertes brass-700 `#826225`. Nur Hex nachziehen + Kommentar
   «= --brass-700, bei Rekalibrierung mitziehen». CSS-mask-Variante ist am nackten
   `<select>` NICHT machbar (background trägt die Well-Füllung) — verworfen.
7. **Motion-Dedup** (14): `tailwind.config.js:62` transitionDuration-Literale auf
   `var(--dur-*)` mappen (Muster der Nachbar-Keys) — index.css wird EINE Motion-Quelle.
8. **Solitär-Bindung** (15): `--ink-fixed-dark:#1A1A17` einführen, helles ink-900 UND
   `--auf-gold` daraus speisen (Nicht-Flip-Absicht bleibt); `--placeholder` als
   dokumentierte Stufe führen. **VOR D-4 einbauen** (Reihenfolge-Abhängigkeit).
9. **Status-Zwischenton-Tokens** (10): die drei Magic-Mixe 45 %/30 %/26 %
   (Z.498/501/389) sind DREI Rollen (Badge-Outline · Soft-Border · Schraffur-Streifen)
   → drei benannte Tokens, gleiche Endwerte (§6 verhaltensneutral), Komponenten drauf.
- **Aufwand:** S–M je Posten · **Mess:** betroffene Paare hell+dunkel, axe-e2e.


<!-- aus fahrplaene/FAHRPLAN-DESIGN-WAERME.md · verschoben 14.8.2026 -->
### D-2 · Rollen-Schicht + deklarierte §13-Reglement-Nachträge ✅ (12.7.2026, PR feat/design-d2-rollen)
*(Befunde 39+9 [Alias statt Werte-Tausch] + Doku 26a/28/29/31/32/41/43/47 + Fehlstellen F1/F5 der Kohärenz-Linse)*

**GEBAUT (Opus, autonom):** Rollen-Alias-Schicht additiv in `src/index.css` +
`tailwind.config.js` (Akzent `--accent-*`, Status `--{sage,slate,warn,danger}-solid/
-text`, Zustand `--ok-*`). Befund 9 gelöst OHNE Werte-Tausch (die Dark-Brass-
Inversion trägt `--accent-hover` = brass-800, erbt den Flip aus den Familien-Token).
F1 aufgelöst: `lc-badge-ok`/`lc-live`/`lc-termin-ring` auf `--ok-*` migriert
(grep-vollständig; sage bleibt Materialien/Currency). Reinweiss-Invariante (d) ins
Gate `check:design-tokens` (negativ-kontrolliert). §13-Nachträge a–j als Block G in
`DESIGN-REGLEMENT.md`. **Beweis:** `check:farbwelt` vorher==nachher BYTE-IDENTISCH
(46/6/2/9 unverändert — Aliase sind für das name-basierte Tor inert); golden 209
byte-gleich; dist-CSS-Kette `--ok-*→sage`/`--accent-*→brass`; `npm run gate` grün;
axe-e2e 26/26 hell+dunkel; Visual-Belege 8 Screens in `abnahme/design-waerme/d2/`.
Gegenprüfung n/a (reine Token-Schicht). Trailer `Roadmap: W2·11-DESIGN`.
- **Rollen-Aliase (rein additiv, keine Wertänderung):** je Familie
  `--accent-bg`(=brass-100) / `--accent-bg-hover`(=200) / `--accent-line-decor`(=300) /
  `--accent-line` / `--accent-solid`(=500) / `--accent-text`(existiert) /
  `--accent-text-strong` / `--accent-hover`; analog status-Familien. Löst Befund 9
  sauber: die **absichtliche** Dark-Brass-Inversion (800 hellster Ton, a:hover-Logik
  Z.209–211) wird NIE durch Werte-Tausch «repariert», Komponenten greifen Rollen.
  In `tailwind.config.js` exportieren; Regel «Basis-Stufen sind privat» gilt nur für
  NEUE Komponenten, Bestand opportunistisch migrieren (kein Riesen-Diff).
- **§13-Nachträge (deklariert, DURCH das Reglement — je ein Absatz in
  `DESIGN-REGLEMENT.md`, prüfbare Teile ins Gate):**
  a. **«Brass ist Signal, nicht Tapete»** (28) + Squint-Test je Kernseite als
     Abnahme-Ritual; grosse brass-Flächen nur für semantisch Massgebliches.
  b. **«Ton vor Schatten»** (26a) — Erhebung primär Flächenton + 1px `--line`,
     Schatten sekundär ab «schwebend» (Dropdown/Popover/Modal); KEIN Schatten-Verbot
     (lc-card-Doppelsignal bleibt). Regel «Tiefe = Stufe + Border, nie Schatten allein».
  c. **Temperatur-Dramaturgie** (32): Zuordnung Fläche→Temperatur (Einstieg warm,
     Prüf-/Arbeitsflächen neutral-kühl akzentuiert) — trägt das Wörterbuch.
  d. **Reinweiss-Invariante** (41): kein `#FFFFFF`/`bg-white` als Lesefläche
     (`--paper-raised` nur kleine erhabene Flächen); Gate-Erweiterung
     `check:design-tokens` (heute 0 Treffer = billige Versicherung); dokumentierte
     Ausnahmen `@media print` (body #fff, Z.318) + `text-paper` auf ink-Buttons.
  e. **Zwei-Stimmen-Regel** (43): Serif ausschliesslich+vollständig für zitierfähigen
     Quelltext; Sans für Interaktives; Mono für Zahlen/Aktenzeichen. grep-Audit über
     `font-serif`-Verwendungen. Keine dritte Schrift (§15).
  f. **Linien unter der Tinte + Textur-NEIN** (31): Struktur-Linien immer schwächer
     als ink-600-Sekundärtext, nur über color-mix-Tokens; explizites NEIN zu
     Papier-Texturen/Noise (auch §15).
  g. **Wärme-Architektur** (47): «Wärme wird ausschliesslich über --paper/--ink-
     Basiswerte + Rezepte gesteuert; niemals flächen-lokale Warmtöne; kein dritter
     Modus»; Änderungspfad dokumentiert.
  h. **Navy-Fussnote** (29): slate bleibt Entscheid-Semantikton, nie Markenfläche —
     Identität nicht Richtung Kanzlei-Navy «absichern» (Legal-Branding-Evidenz).
  i. **F1 Werkstoff- vs. Zustandsfarbe (grösste Wörterbuch-Lücke):** sage ist heute
     DOPPELT belegt (Materialien-Kennfarbe UND ok/Live-Zustand: `lc-badge-ok`,
     `lc-live`, `lc-termin-ring`). Entscheid dokumentieren: Zustands-Aliasse
     `--ok-*` einziehen (dürfen hell auf sage-Werte zeigen, heissen semantisch
     anders) — sonst bleibt jede Status-Einfärbung zweideutig (stolperten Befunde 7+37).
  j. **F5 Interaktions-Zustände:** Wärme-Verhalten von hover/active/selected als
     Regel (eine Flexoki-Stufe «tiefer»: mehr C, weniger L) — verhindert das nächste
     Patchwork.
- **Aufwand:** S–M · **Golden:** neutral (additiv + Doku).


<!-- aus fahrplaene/FAHRPLAN-DESIGN-WAERME.md · verschoben 14.8.2026 -->
### D-3 · color-mix `srgb` → `oklab` (eigener Mess-Commit) ✅ (12.7.2026, PR feat/design-d3-oklab)
*(Befund 36 — grösster Wärme-Hebel pro Zeile: srgb-Interpolation frisst bei 10–18 %-Tönungen Farbigkeit → Status-Flächen grauer/kälter als das Rezept verspricht)*
- **Kern:** `in srgb` → `in oklab` in den vier `-bg`-Rezepten
  (`--sage-bg/--slate-bg/--warn-bg/--danger-bg`) + Linien-Mixen (`--line`,
  `--line-strong`, `--guide-gliederung`/`--rule-artikel`/`--rule-struktur`).
  Mechanisch (~19 Fundstellen), Baseline-Support gegeben, Wort-für-Wort-revertierbar.
- **Harte Auflage:** verschiebt ALLE gerenderten -bg/-line-Werte site-weit → C-1-
  Referenzwerte (slate-Tick 3.47 dunkel ist KNAPP) + `lc-badge-soft`/`lc-badge-entwurf`
  in BEIDEN Modi durch D-0 messen, Kommentare in index.css/e2e nachführen;
  `check:linien-kanon` bleibt grün (prüft Verwendung, nicht Werte). VOR D-4/D-5 —
  sonst misst man alte srgb-Fehler in die neuen Rampen ein.
- **Aufwand:** S · **Golden:** neutral (CSS-only).
- **Umsetzung 12.7.2026:** alle 19 Stellen umgestellt; Mess-Befund: 15 der 19
  mischen mit `transparent` → gerendert **byte-identisch** (premultiplied alpha),
  sichtbar verschieben sich NUR die vier `-bg`-Flächen (wärmer, alle `-700`-Texte
  ≥5.1:1, kein AA-Riss, keine Einzel-Kalibrierung nötig). **C-1/C-2/C-3-Referenz-
  werte NEU GEMESSEN: unverändert** (Voll-Token auf solidem `--well`, kein
  color-mix im Pfad — 4.81/3.47 · 5.24/9.43 · 4.91/10.48); Tor-Nachführung =
  deklarierter No-op (Kommentar `check-farbwelt.ts`, Nachtrag `DESIGN-REGLEMENT.md
  §F2b` mit Vorher/Nachher-Tabelle, Notiz §4b-B). golden 209 byte-gleich, gate
  voll GRÜN, axe 26/26 hell+dunkel, Mappe `abnahme/design-waerme/d3/`.
  INFO: einziger Call-Site-Mix `Shell.tsx` (sunken/paper) rendert raumunabhängig
  identisch — für D-5 vorgemerkt, hier nicht angefasst.


<!-- aus fahrplaene/FAHRPLAN-DESIGN-WAERME.md · verschoben 14.8.2026 -->
### D-4 · Ink-Wärme: EINE Hue-Normalisierung der Grau-Achse ✅ (13.7.2026, PR feat/design-d4-ink)
*(Befunde 3+34 konsolidiert [Radix-Regel «saturated gray closest to accent»] + 15-Anteil)*

**✅ GEBAUT (13.7.2026):** ink-Rampe (900…300) + `--placeholder`, hell UND dunkel
(16 Werte), in OKLCH auf **EINEN Ziel-Hue 88°** normalisiert (hell zuvor ~107°=grün-gelb,
dunkel 84–90° gestreut → jetzt Span **1.3° hell / 1.2° dunkel**), **L gehalten**,
Chroma-Glocke (C≈0.008 Enden, ~0.012–0.015 Mitten 600–400). Alle Werte deterministisch
mit culori gemessen (F2, keine Annahme). **Mess-Quittung:** ink-500/well hell
**4.48→4.62** (Riss geheilt, einzige L-Abweichung −0.007 bei ink-500 zum Erreichen von
4.5; als WCAG-Pflichtpaar geführt) · ink-500 paper/surface **5.00/5.17** hell, **5.52/5.20**
dunkel · `--placeholder`/well **4.76** hell / **5.21** dunkel (Ziel ≥4.5, vorher 4.75) ·
ink-600 ≥6.6:1 überall · `--auf-gold` auf brass-300 10.71:1. `--ink-fixed-dark`-Solitär
`#1A1A17→#1C1A15` (hell ink-900 + `--auf-gold` wandern mit EINEM Wert). **D-0 für ink
scharf geschaltet:** Hue-Drift + L-Monotonie sind für `ink` jetzt harter FAIL (brass
bleibt beratend); ink-500/well aus RISSE in PFLICHT verschoben → `check:farbwelt`
**48 WCAG-Pflichtpaare** grün. golden byte-gleich (CSS-only). Reglement-Nachtrag
`DESIGN-REGLEMENT.md §F2b-Nachtrag D-4`; Abnahme-Mappe `abnahme/design-waerme/d4/`.
- **Kern:** ink-Rampe (900…300) + `--placeholder`, hell UND dunkel (16 Werte), in
  OKLCH auf EINEN Ziel-Hue (~Brass-Hue 85–95°) normalisieren; Chroma als flache
  Glocke (C≈0.008 an den Enden, C≈0.012–0.015 in den Mitten 600–400 — dort sitzt
  Sekundär-/Metatext, die sichtbarste Wärme-Fläche); **L halten** (WCAG-Näherung,
  trotzdem F2-Messung, keine Annahme). Haarlinien erben via Rezepte automatisch.
- **Mess-Pflichten:** ink-500 ≥4.5:1 auf paper/surface/well; `--placeholder` ≥4.5:1
  auf well (heute 4.75, knapp); D-0 danach für ink scharf schalten (Hue-Drift-Assert).
- **Referenzfälle:** Startseiten-Untertitel/Meta-Zeilen, Rechner-Hilfetexte, Footer.
- **Aufwand:** M · flip-reversibel.


<!-- aus fahrplaene/FAHRPLAN-DESIGN-WAERME.md · verschoben 14.8.2026 -->
### D-5 · Flächen-Wärme: Papier-Treppe im OKLCH-Raum ✅ (16.7.2026, PR feat/design-d5-papier)
*(Befunde 2+35 konsolidiert; Befund 1 als Diagnose übernommen, seine `--paper-warm`-Mechanik VERWORFEN — E1-Veto)*

**✅ GEBAUT (16.7.2026) mit DEKLARIERTER ÜBERSTEUERUNG durch DAVID-DIREKTIVE A38.**
A38 (16.7., wörtlich «ausserdem mache die ganze lexmetrik webseite heller uns weisser»,
Quelle `docs/ux-audit-2026-07/ANMERKUNGEN-DAVID-2026-07-16.md` Nachtrag) **übersteuert
die Flächen-Ton-Zielwerte dieser Spec** — insbesondere Fixpunkt §0.1 (`--paper #FAF8F2`
war «unantastbar»): die Papier-Treppe wird mit HELLERER, WEISSERER Basis gebaut. Die
Treppen-MECHANIK der Spec bleibt WÖRTLICH erhalten (gestufte Flächen-Rollen, EINE
Papier-Achse Hue ~90° = brass-/ink-konsistent wie D-4, L strikt steigend
`well<paper<surface<raised`, Flexoki-Nuance tiefere Fläche = eine Spur mehr Chroma).
Abweichung von der Spec: statt «tieferes Papier mit mehr Chroma» wird die Chroma
site-weit **~30 % gesenkt** (Wärme bleibt nur noch feine NUANCE in Tinte/Akzenten,
keine sichtbar getönte Fläche mehr, A38) und L angehoben. **Nur `:root` (HELL) —
DUNKEL bleibt unberührt** (A38 betrifft die helle Fläche; D-6 kommt separat).
- **Werte (culori/OKLCH, F2-gemessen):** `--paper #FAF8F2→#FCFAF6` · `--paper-raised
  #FEFDFA→#FFFEFC` (~weiss, NICHT #FFFFFF — Reinweiss-Invariante) · `--paper-sunken/well
  #F2EFE6→#F6F4EE` · `--surface #FDFCF7→#FEFCFA` (Hue-Ausreisser 97°→Papier-Achse).
- **Mess-Quittung:** hellere Hintergründe HEBEN jeden Dunkeltext-Kontrast (sichere
  Richtung) — ink-500/well **4.62→4.83**, `--placeholder`/well **4.76→4.98**, ink-600/well
  **6.67→6.98**; Referenz C-1/C-2/C-3 hell **4.81→5.03 · 5.24→5.48 · 4.91→5.13** (dunkel
  unverändert). `check:farbwelt`: Fixpunkt-Hell `#FCFAF6` + Referenz-Hell deklariert
  nachgezogen (scharf), 48 WCAG-Pflichtpaare grün, L-Leiter beide Modi grün. golden
  byte-gleich (CSS-only). Reglement-Nachtrag `DESIGN-REGLEMENT.md §F2b-Nachtrag D-5` +
  `-NORMTEXT §4b-B`. Abnahme-Mappe `abnahme/design-d5/`.
- **Kern:** `--surface`/`--paper-raised` sind heute KÜHLER als `--paper` (R−B 6/4 vs. 8)
  — Karten entziehen der Seite Wärme. Beide tonal auf die Papier-Achse (Ziel-Hue =
  brass), **heller als paper bleibt Pflicht** (Erhebungs-Logik); zugleich
  Flexoki-Kurve: je tiefer die Fläche (raised → paper → sunken/well), desto mehr
  Chroma bei sinkendem L (sunken/well ≈ C 0.015→0.022) — Wells/Eingabefelder lesen
  sich als «tieferes Papier» statt graue Mulde. Dunkel-Pendants mitkalibrieren.
  Danach messen, ob ein warmer Panel-Ton überhaupt noch fehlt (erwartet: nein).
- **Mess-Pflichten:** ink-500/surface (heute 5.01:1) und alle Chip-/Badge-Paare auf
  surface/well, hell+dunkel; `--placeholder` auf dem neuen well.
- **Referenzfälle:** Gesetze-Übersichtskacheln, Rechner-Karten, «Schnell rechnen»-
  Panel, Eingabefelder Verjährungs-Rechner.
- **Aufwand:** S–M (reiner :root-Edit, Z.39–47 + html.dark) · flip-reversibel.


<!-- aus fahrplaene/FAHRPLAN-GESETZESDARSTELLUNG-V2.md · verschoben 14.8.2026 -->
### F1 · Fussnoten verlinkt im Text + Präambel (Aufwand L, Kern-MVP) — ✅ KOMPLETT inkl. FN-5 (FN-1/FN-2 #… + FN-3 `feat/v2-fn3` 12.7.2026 · FN-4 erledigt ohne Bau 25.7. #354 · FN-5 gebaut 26.7.2026)
- **FN-1 (M, SOFORT startbar, kollisionsfrei):** Extraktor-Fallback in `fnDefinitionen()`: wenn fnbck-Regex leer, nr aus führendem `<sup>N</sup>` der Definition (`^\s*<sup[^>]*>(\d+[a-z]?)</sup>`; matcht 226/226 VZG). KEIN Zusatz-Strip (clean() strippt sup bereits — Verdikt). PLUS belegter Drop-Fix: Artikel-Regex um `disp_*/art_*`-IDs erweitern. Vorbedingung: fedlex-cache.sh + «0 übersprungen»-Kontrolle. Danach Regeneration: 22 Erlasse Sidecar-Diff deklariert, OR/ZGB/StGB/BV **byte-gleich als Nicht-Regressions-Beweis**. Reader-Code: NULL Änderung (Marker-Mechanik greift von selbst). Risikopfad scripts/normtext ⇒ Gegenprüfung Pflicht; Quell-Verifikation an VZG+FZA gegen Fedlex-HTML (kontinuierliche 1..N).
  - **✅ GEBAUT 10.7.2026 (Bau-Go David «go zu allem», feat/v2-fn1-fn2).** FN-1 nr-Fallback + Drop-Fix + FN-2 als EINE Einheit. Ergebnis nach Voll-Regeneration (218 Sidecars, `fedlex-cache.sh` 218/218 OK, «0 übersprungen»): **873 nr='' → echte nr** (22 Alt-Form-Erlasse), **227 bisher verschluckte amtliche Fussnoten recovert**, **0 nr='' korpusweit**, 218 Präambel-`fnNrs`.
  - **⚠ ABWEICHUNG vom Plan (§7 offengelegt):** Der Drop-Fix ist BREITER als «22 VZG-Noten» — er recovert die verworfenen Schlusstitel-/Schlussbestimmungs-Fussnoten (`disp_uN/art_*`) in ~ALLEN Bund-Erlassen mit Schlussbestimmungen, u.a. **OR (neue nr ~875–941)** und **ZGB (~769 ff.)**. Die Plan-Behauptung «OR/ZGB/StGB/BV byte-gleich» trifft daher NICHT zu — sie war eine falsche Prognose; das Verschlucken war ein echter §1-Fehler (amtliche Fussnoten fielen weg), das Recovern ist die Korrektur. **Statt Byte-Gleichheit wurde die Nicht-Regression STRUKTURELL bewiesen:** unabhängiger Alt-vs-Neu-Vergleich (gleicher Cache, gleiches Datum) — jede Alt-Fussnote (Text/Links/absatz/item) bleibt erhalten, für gesunde Erlasse ändert sich KEINE bestehende nr, alle Änderungen sind rein additiv (227 recoverte + nr-Füllung + `fnNrs`); 0 verlorene/mutierte Fussnoten. Tokens matchen via `ankerZuToken` identisch zum Struktur-Extraktor (kein Orphan, `check:struktur-konsistenz` grün). Gegenprüfung gegen Fedlex-HTML: VZG+FZA (Alt-Form) UND OR/ZGB-Schlusstitel (breiter Effekt).
- **FN-2 (S-M, kollisionsfrei):** `kopf-extrahiere.ts`: Marker-Nummern je Präambel-Zeile erfassen (neues Feld `KopfZeile.fnNrs`; Reader-Typ in `src/lib/normtext/browse.ts:182-190` nachziehen). **✅ GEBAUT 10.7.2026 (mit FN-1):** `fnNrs` je Ingress-/Präambel-Zeile (Dokumentreihenfolge, dedupe je Zeile), Reader-Typ `KopfZeile.fnNrs?` nachgezogen. Additiv (nur gesetzt, wenn Zeile Marker trägt) — Reader-Render bleibt FN-3 (nach U-VERWEIS).
- **FN-3 (M, NACH U-VERWEIS-Merge, harte Kollision belegt):** `ErlassKopfBlock`: FnRef-Marker je Präambel-Zeile (HINTER dem neuen A11-NormText-Element) + Anker `fn-kopf-${nr}` am Kopf-Apparat. Wirkt für OR sofort, für VZG nach FN-1. VRK (nur 3 Kopf-fn) als Testfall.
  - **✅ GEBAUT 12.7.2026 (`feat/v2-fn3`) — F1-Familie damit KOMPLETT.** REINE Darstellung (kein Extraktor-Eingriff, keine Regeneration): die Marker-Daten liegen bereits vollständig aus FN-1/FN-2 vor (Korpus-Scan: **215 Erlasse mit Präambel-Markern, 555 Marker, 0 Orphans** — jede von einer Ingress-Zeile referenzierte `fnNrs`-Nummer hat ein passendes Kopf-Apparat-Ziel). `ErlassKopfBlock.tsx`: (1) je Präambel-Zeile mit `z.fnNrs` ein `<FnRef artikel="kopf" nr={nr}>`-Marker HINTER dem NormText-Element, gewickelt in `data-fn-marker` (dieselbe Mechanik/Glyphe wie der Artikel-Fliesstext G2b); `artikel="kopf"` ⇒ FnRef löst den Popover aus `#fn-kopf-${nr}` auf. (2) Kopf-Apparat-Zeilen tragen jetzt `id="fn-kopf-${nr}"` + `nt-anker … target:bg-brass-100` (Sprungziel, wie der Artikel-Apparat). **R9/§8:** Marker + Apparat liegen IMMER im DOM (data-fn-marker/-apparat), Prominenz steuert allein der `data-fussnoten`-CSS-Toggle (nie `display:none` am Substanz-Träger — Ctrl+F/Print/Screenreader vollständig). Additiv (nur gesetzt, wenn die Zeile amtliche Marker trägt). **Gate voll GRÜN** (tsc·vitest 3776·golden **IDENTISCH 209 byte-gleich** — Reader ist Client-SPA, nicht im golden·lint·check); **e2e** `verweis-u` FN-3-Block (OR/VZG/VRK: Marker→`#fn-kopf-nr`→Popover-Text; R9-Toggle-DOM-Beweis) + A7/A9/A10/A11/kopf-v2/kopf-g2b regressionsfrei (23/23). CLS 0 by construction (synchroner Kopf-Render, kein async Mount; Popover fixed+Portal wie die bereits A9-gegatete FnRef). Gegenprüfung n/a (reines UI, kein Risikopfad `scripts/normtext`/`public/normtext`/`src/lib/normtext` berührt). Trailer `Roadmap: W2·5d`.
- **FN-4 (M):** Absatz-Zuordnung für Alt-Form (VZG absatz=null → Marker am Absatz statt Artikelebene).
  - **✅ ERLEDIGT OHNE BAU 25.7.2026 (`feat/fn4-absatz-zuordnung`) — Defekt NICHT reproduzierbar (§0.2: erst reproduzieren, dann fixen).** Repro-Versuch VOR Bau: Der FN-4-Ausgangsbefund stammt aus der Zeit der Alt-Generations-Aspose-Dumps; die **P1-a/b-Kanonik-Re-Pins (11.7.)** ersetzten diese durch die registrierte `isExemplifiedBy`-Manifestation, in der ALLE Erlasse (auch die 22 der Alt-Form-Familie) Neu-Form-Markup tragen (`<p class="absatz "><sup>N</sup>…` + fnbck-Backlinks; /tmp-Cache-Scan: **0/230 Dateien ohne fnbck**). Den ordnet der bestehende Absatz-Walk (`fussnoten-extrahiere.ts`) korrekt zu — die Sidecar-Regeneration nach dem Re-Pin hat die Heilung bereits materialisiert (VZG Art. 1: fn 4→Abs. 1, fn 5→Abs. 2). **Beweise:** (a) `fedlex-cache.sh` «Alle Caches aktuell»; Voll-Regeneration `normtext:struktur` 227/227 **byte-identisch** (git diff leer — nichts zu bauen, nichts zu regenerieren); (b) korpusweiter Audit aller absatz=null-Fussnoten gegen die /tmp-Quelle: **0** Marker, die in einem NUMMERIERTEN Absatz sitzen und trotzdem null tragen (8466 nulls = h6-Kopf-Fussnoten korrekt Artikelebene; Rest ehrlich null: Tabellenzellen, `inkrafttreten`-/`man-template-referenz`-Zeilen, `[tab]`-/Strich-`<dl>` ohne dt-Marke wie ENTG 19 fn 12/13, nummernlose `absatz8pt/09pt`-Fortsetzungszeilen — §8: lieber ehrliche Artikelebene als geratener Absatz); (c) **e2e-Wächter NEU** `e2e/fussnote-absatz-altform.e2e.ts` (VZG Art. 1 fn 4/5 am Absatz + fn 3 Artikelebene; KOV Art. 3 fn 7 an Abs. 1) — Sabotage-Probe rot gezeigt (§6.7), dann grün. Extraktor/Daten/Reader: **NULL Änderung**. Gegenprüfung n/a — kein Risikopfad berührt (nur e2e-Test + dieser Vermerk); Rest-Nulls-Backlog (Anhang-/Titel-/Tabellen-Träger) bleibt der bestehende Posten unter «Sektionstitel-/Anhang-Fussnoten ohne Ziel-Token».
- **FN-5 (= M14/G14):** wortgenaue Inline-Position. **✅ GEBAUT 26.7.2026** (`feat/fn5-wortgenaue-marker`) — als SIDECAR-Variante der M14-Spec (`FAHRPLAN-NORMTEXT-DARSTELLUNG.md` §M14): `pos{b,it,o,l}` je Marker im Struktur-Sidecar (`scripts/normtext/fussnoten-offsets.ts`, Platzhalter-Parse + zeichengenaue Zwei-Zeiger-Ausrichtung, Offsets NUR bei bewiesener Gleichheit), Haupt-Snapshots byte-unverändert — der hier früher angenommene «grosse golden-Haupt-Diff» entfiel (§7-Abweichung offengelegt). Reader segmentiert am Offset (`ArtikelBody.tsx`), Fallback Absatz-/Item-Ende bleibt für Kopf/Sektion/`<dt>`-Marken/Ausrichtungs-Rest (ausgewiesen). 16'881 Marker wortgenau (81.5 % der block-verorteten); Wächter `e2e/fn5-wortposition.e2e.ts` + Unit-Negativfälle; Dossier `bibliothek/normen/fn5-wortgenaue-marker-2026-07-26.md`.
- Nachlauf je Regeneration: check:paritaet greift automatisch; `datenhaltung:turso-sync` nachziehen.


<!-- aus fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md · verschoben 14.8.2026 -->
### Stand 5.8.2026 — Befunde B3/B4 erledigt, Schritt 1 gebaut

- **B4 (Rotations-Regex) ✅ erledigt** — die Nacht-Session 4./5.8.2026 hat `DATUM_RE` in
  `.claude/hooks/struktur-rotieren.py` um das Übernacht-Format `T./T.M.JJJJ` erweitert; die
  zuvor nie rotierenden Karten rotieren. Damit ist der Wurzel-Fix des Budget-Risses gebaut
  (§17), nicht umschifft.
- **B3 (geparkte Arbeit unsichtbar) ✅ erledigt** — dieselbe Nacht-Session hat die Landekette
  **10/10** abgearbeitet; die QS-CODE-Reihe steht nicht mehr `ready` neben offenen PRs, sondern
  `done`. Die **Prävention** zu B3 ist damit nicht erledigt, sondern in Ziff. 4 unten verortet:
  Lage-Block, Namenskonvention und die `parked`-Regel im Skill `auftrag` Ziff. 2 (letztere ist
  am 5.8.2026 geschrieben, samt der Branch-/Worktree-Slug-Regel).
- **Schritt 1 (Sofort-Korrekturen ROADMAP/Fahrpläne) ✅ gebaut** — Branch
  `feat/qs-plan-review-doku`, 14 Korrekturen: die drei falschen Anker aus B1 (`QS-KORPUS-BMV`
  → §20.4 · `QS-UI-HIGHLIGHT` → neue Bau-Spec `FAHRPLAN-UI-NAVIGATION.md` §9 ·
  `W2·5k-LINIEN-KONZEPT` → GESETZESDARSTELLUNG-V2 §2/F4 + GESETZES-UX §10.9), die stale
  Steuerungs-Prosa aus B2 (@queue-Kommentar, Ceiling-Satz, TOKEN-OEKONOMIE §8 Ziff. 4), die
  B5-Kleinteile (Dach-Präfix-Liste samt deklarierter `fahrplan:`-Ausnahme, LERNPHASE-§3-Titel,
  FEDLEX §19 als `##` statt `###`) und die zwei fehlenden Schritte
  (`W2·5l-NORMTEXT-B2`, `QS-PLAN-REVIEW`).
- **Offen — der eigentliche Präventions-Bau:** Ziff. 3 (Tor-Erweiterung `check:plan` auf
  Spec-Bindung, **Geburtsbeweis nur noch auf dem Stand VOR Schritt 1 führbar** — also gegen
  `main@d316f5884` oder den Elter-Commit dieses Branches, nicht gegen den heutigen Stand) und
  Ziff. 4a/4b (Lage-Block in `plan:next`, Namenskonvention im Dispatch-§0 Ziff. 5).
- **Nachtrag zu B1:** `FAHRPLAN-GESETZESDARSTELLUNG-V2.md` §9.2 trägt denselben toten Anker
  «→ Bau-Spec: §L-3/A28 dieser Datei» wie zuvor die ROADMAP. Er ist **nicht** mitkorrigiert
  (lag ausserhalb der Bau-Whitelist) und bleibt ein offener B1-Rest — das
  Spec-Bindungs-Tor aus Ziff. 3 muss ihn erwischen.


<!-- aus fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md · verschoben 14.8.2026 -->
### Endstand 5.8.2026 nachts — alle Befunde gefixt, beide Präventionen gelandet (Schritt done)

Serielle Landung durch die Orchestrier-Session (David: «fixe alle befunde … du orchestrierst,
unter-sessions bauen»), vier Bau-Agenten in Worktrees:

- **Ziff. 3 Tor gelandet** — `check:plan` Regel 11 «Spec-Bindung» (`scripts/plan/specBindung.ts`,
  25 Tests). **Geburtsbeweis geführt:** auf `d316f5884` dreifach rot wie gefordert PLUS zwei
  Neubefunde (`W2·6` →`§12` löst nicht auf · `W2·17-UI-BEFUNDE` →`§1` statt §24) — auch der
  V2-§9.2-Nachtrag und zwei vom Doku-Fix selbst erzeugte Fehl-Anker (`§10.9`, `§2` ohne
  ID-Bindung) wurden vom Tor erwischt und sind korrigiert (Ziff.-Schreibweise für
  Überschriften ohne §-Sigel). Allowlist: genau 1 Eintrag (`W3·10 §P3`, Archiv-Ausnahme,
  Schlüssel id+anker). Auf dem Endstand: **grün.**
- **Ziff. 4a Lage-Block gelandet** — `plan:next` zeigt belegte Flächen (wip+`kollision:`),
  Worktrees/Branches mit Slug→Schritt-Zuordnung («ohne Schritt-Bezug» = unangemeldeter Bau),
  `--prs` optional netzbehaftet; bestehende Ausgabe byte-identisch (cmp-Beweis), 17 Tests.
- **Ziff.-6-Vollzug** — die 5 verbliebenen done-Blöcke (QS-CODE-Reihe, W2·5d) wörtlich in die
  Chronik, `dep: [W2·5d]` zweifach als erfüllt entfernt, Inventar nachgezogen; plan:next
  vorher/nachher byte-identisch.
- **QS-CI-VERCEL-Testplan vollzogen** — Doku-Diff nach Limit-Reset: Vercel-Check
  `success` («Canceled by Ignored Build Step») ⇒ Merge-Bedingung Skip=success erfüllt,
  #445 per Auto-Squash eingereiht (Merge-Go David 4.8.).

**Offene Kleinposten (bewusst, je klein — kein eigener Roadmap-Schritt, Mitnahme beim
nächsten Bau an `scripts/plan/`):** (a) Regel 11 prüft Blockquote-Prosa ohne Bullet-Block
nicht (einziger Bestandsfall: `QS-TOK`) und keine `§§3–§7`-Bereiche — beide Grenzen im Code
mit Test dokumentiert; (b) `bildSeiten.ts` hält eine lokale Slug-Kopie, die `slug()` aus
`lage.ts` importieren sollte (Entdopplungs-Richtung: schwer importiert leicht).



<!-- aus fahrplaene/FAHRPLAN-PLAN-STEUERUNG.md · verschoben 14.8.2026 -->
## QS-SESSION-ZYKLUS — der Skill `bauschritt` und sein Auslöser (done 5.8.2026)

Der Session-Ablauf lag verstreut (Bau-Prompt, `auftrag`, `landung`, Gewohnheit);
jetzt liegt er an EINER Stelle (§5): `.claude/skills/bauschritt/SKILL.md` — fünf
Stationen A–E, Grössen-Check in A (sessionfüllend: zu klein ⇒ bündeln, zu gross ⇒
AP-6-Schnitt), Token-Regel-Kasten; Obergrenze ~120 Zeilen, Verweis-Architektur.
Ausgelöst durch die ERSTE Zeile jedes Lagebild-Bau-Prompts («Nutze den Skill
`bauschritt` … Schritt: <ID>», `bauPrompt` in scripts/plan/bildSeiten.ts);
Erste-Zeile-Zusicherung + Bestands-Härtungen testgesichert
(src/tests/plan-bild-lage.test.ts, Rot-Beweis geführt).

<!-- aus fahrplaene/FAHRPLAN-SPLIT-VIEW.md · verschoben 14.8.2026 -->
## STRANG A — Inhaltsbreite-Umschalter „kompakt / breit"  *(✅ FERTIG, Commit `fc5dbb3c`)*

1. **`src/components/layout/useInhaltsbreite.ts`** (Vorlage `useSeitenleiste`): Zustand
   `'kompakt'|'breit'`, localStorage `lexmetrik-inhaltsbreite`, typeof-window-Guard,
   **Default `'kompakt'`** (= heute).
2. **`Shell.tsx`**: Wrapper `breit ? 'max-w-screen-2xl' : 'max-w-content'`
   (`mx-auto px-5 …` unverändert; `max-w-reading` NICHT anfassen).
3. **`Topbar.tsx`**: segmentierter Schalter `[kompakt|breit]` neben dem Sidebar-Schalter;
   `aria-pressed`, Tastatur, sichtbarer Fokus; ab `lg`, mobil aus.
4. **Tore:** Default kompakt ⇒ Golden byte-gleich · `npm run gate` grün · visuell 2560px + mobil.

---


<!-- aus fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md · verschoben 14.8.2026 -->
### Stand 5.8.2026 — QS-TOK-Rest abgeschlossen (T10/T12-Stufe-2/T14/T16/T20)

Fünf offene Posten aus dem 27.7.2026-Go abgearbeitet, alle mit den drei Massgaben David
(T16 nur in frischer Session · T12-Stufe-2 Weglassungs-Begründung neu bewerten · T20 ist
stehendes Instrument). Worktree `LexMetrik-qs-tok` (Branch `feat/qs-tok`), Bau-Details
`LexMetrik-qs-tok-t14` (Branch `feat/qs-tok-t14`).

- **T10 (Massgabe: Verifikation vor Ausführung erfüllt).** Selektive Deaktivierung der
  Account-Konnektoren ist projektseitig **NICHT möglich**: `.mcp.json` existiert nicht;
  `.claude/settings.json`/`settings.local.json` kennen nur `permissions.allow`, kein
  Deaktivierungs-Feld; die offizielle Doku (`docs.anthropic.com/en/docs/claude-code/mcp`,
  `docs.anthropic.com/en/docs/claude-code/settings`) kennt `enabledMcpServers`/
  `disabledMcpServers` nur für Projekt-MCP-Server in `.mcp.json`, nicht für
  Account-Konnektoren. Verdikt bleibt Account-Ebene = David-Entscheid. Repo-seitig mit
  diesem Negativ-Befund **abgeschlossen** (DoD «Verifikations-Notiz» erfüllt). Nachtrag:
  [fixkosten-audit-t10.md](token-oekonomie/fixkosten-audit-t10.md) §«Verifikation 5.8.2026».
- **T12-Stufe-2 (Massgabe: neu bewertet).** `npm run token:baseline`, Fenster
  11.7.–5.8.2026, 115 Sessions (O 64 / B 21 / M 30): cacheRead 96,6 % · output 0,42 %
  (Alt-Baseline 10.7.: 95,8 % / 0,54 % — Output-Anteil **gesunken**, keine Materialität).
  CI-Rot ist häufig (36/200 Runs, ~13–18 %), aber Stufe 1 (`ci:log`) deckt diese Vorfälle
  bereits mit −61…−92 % Log-Bytes. Verdikt: Weglassung trägt weiter; Stufe 2 bleibt nur
  offen, falls eine künftige Messung materielle Log-Rest-Kosten zeigt.
- **T14 — Stufe 1 GEBAUT.** Commit `3097e5ae3` (Branch `feat/qs-tok-t14`, PR folgt):
  `inhalt.tsx` 1090→369 Z. (Fassade, Importpfade unverändert) + 6 neue Aspekt-Module
  (`inhalt-zustand` 351 · `inhalt-sprung` 195 · `inhalt-suchtreffer` 194 ·
  `inhalt-ableitungen` 132 · `inhalt-weiterlesen` 92 · `inhalt-overlays` 44;
  `inhalt-ansichten` 119→169). gate vorher/nachher **GRÜN**, golden **byte-gleich**, 55 e2e
  grün. Zwei Blöcke bewusst in der Fassade belassen (Quelltext-Sonden
  `scripts/check-linien-kanon.ts` und `leser-adresse-lm202.test.ts`, §6.3).
  Frequenz-Beleg der Vorbedingung: +40 % Regrowth in 12 Tagen (781→1090 Z. seit
  `b56b9193f`), 9 Commits/12 Tage; U-Kette frei. **Stufe 2** (`extrahiere-fedlex.ts` 1
  Commit, `ingest.ts` 0 seit 31.7.) hat **KEINE Frequenz** → begründet weggelassen,
  die T13-Anker-Route genügt dort.
- **T16 — OBSOLET durch Umbau (Massgabe: frische Session erfüllt).** Die §7-Elaboration
  wanderte am 25.7.2026 (Commit `b2fa14dda`, A4-Kürzung 384→202 Z.) in den Skill
  `.claude/skills/korpus-werkstatt/SKILL.md` (§7-Abschnitt dort 6410 Bytes); `CLAUDE.md`
  §7 misst heute 935 Bytes (Kernsatz + Zitat-Ausnahme + Skill-Verweis). Eine zusätzliche
  `paths`-Rule wäre eine zweite Ladewahrheit (§5-widrig), und der Rule-Mechanismus lädt
  ohnehin nicht bei Write/Create (bekannter Bug, Fahrplan K1). **Abweichung von der Spec
  offengelegt:** erfüllt über die Skill-Route statt der spezifizierten `paths`-Rule;
  `.claude/rules/` wurde nie angelegt.
- **T20 — bereits erfüllt.** Konvention steht in §5 dieses Fahrplans, Verweis steht in
  `docs/token-oekonomie/dispatch-template.md` §8 «Ultracode-Workflows (T20)» (Z. 408–416).
  Ereignisabhängiger DoD-Rest («nächster ultracode-Einsatz belegt budget+Schema im
  Report») bleibt stehende Anweisung, kein Bau.

**§17-Wurzel-Fixe im Zug dieses Schritts** (zwei Bauten auf `feat/qs-tok`, nicht Teil der
fünf Posten oben, sondern §17-Handlungsauftrag bei Gelegenheit erkannter Prozessmängel):
`811fe6a78` **`plan:set` warnt bei Prosa-Marker-Drift** (Regel 8.4; Anlass: `wip`-Setzen
des Queue-Kopfs machte `check:plan` rot, ohne den Grund zu nennen) · `0bfa2b6b1` +
`c29230ed9` + `e24b97b80` **neues Tor `check:schlankheit`** (Zeilen-Wächter §6.6:
Schwelle 800 Z., Baseline 18 Bestands-Dateien grandfathered, rot bei neuer Datei >800 Z.
oder Bestand +10 %; eingehängt in `check:seriell`, Tor-Paritäts-Allowlist «lokal, nicht
Required» mit Begründung; Rot-Beweis §6.7 erbracht).


<!-- aus fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md · verschoben 14.8.2026 -->
### Stand 31.7.2026 — T7-Fortsetzung «QS-TOK-Aufräumwelle» (PR #407, AP-0…AP-11)

Eine Session-Welle auf `feat/qs-tok-aufraeumwelle`. **Gemessene Endstände**, Stand **Fix-Runde 3
(final), 31.7.2026**. Messbefehle, nachrechenbar:

```
wc -c ROADMAP.md STRUKTUR.md
python3 .claude/hooks/struktur-rotieren.py --check
```

| Datei | vorher | nachher | Budget-Ceiling | Wächter |
|---|---|---|---|---|
| `ROADMAP.md` | 162.2 KB | **111.7 KB** (114 339 B) | 100 KB | **ROT** (+11.7 KB) |
| `STRUKTUR.md` | 81.5 KB | **46.0 KB** (47 094 B) | 60 KB | grün |

Zwischenstände derselben Welle, damit die Bewegung nachvollziehbar bleibt (jeweils
`git show <sha>:ROADMAP.md | wc -c`): Fix-Runde 1 `357eb3179` **110.0 KB** (112 682 B) ·
Fix-Runde 2 `73a376fdf` **111.0 KB** (113 679 B). Das Wachstum ist Begründungs-Prosa der
Zeiger- und Ehrlichkeits-Korrekturen; es wird **nicht** weggerechnet. Die Diät-Etappe für die
restlichen ~11.7 KB (Leitprinzipien, Ausführungs-Protokoll) steht aus. *(Nachgeführt in
Fix-Runde 3, Fund R3-5: die Tabelle stand auf dem Stand der Fix-Runde 1, während die
Session-Karte in `STRUKTUR.md` bereits den Wert der Runde 2 führte — die eine Zeile darunter
deklarierte «genau EINE Stelle» wies damit den älteren Wert aus. Die zweite geführte Zahl in
der Session-Karte ist in derselben Runde durch den Wächter-Verweis ersetzt.)*

> **Warum die Zahl hier falsch war (Endprüfungs-Funde 6/12/31, richtiggestellt R2-8).** Die
> Tabelle trug bis zur Fix-Runde `123.4 KB (126 407 B) · ROT (+23.4 KB)`. Ursache ist **eine**:
> sie war seit dem Nachdiät-Commit `07bef2dee` («124.6 → 108.6 KB») nicht nachgeführt. Die
> verbleibende Diät-Arbeit erschien dadurch rund dreimal so gross wie sie ist.
>
> Die Fix-Runde 1 hatte hier eine **zweite** Ursache behauptet — «sie stimmte nicht einmal für
> den Referenz-Commit … 127 607 B, nicht 126 407 B (Ziffernvertauschung)». Das ist falsch und
> ist am 31.7.2026 zurückgenommen: `git show d7aa4e158:ROADMAP.md | wc -c` = **126 407 B** — der
> Wert war der exakte Ist-Stand bei **AP-8** (`d7aa4e158`), dem unmittelbaren Vorgänger des
> genannten Referenz-Commits `35ed91c8b` (**127 607 B**). Der Eintrag war also **um einen Commit
> versetzt, nicht verschrieben**; 126407 vs. 127607 ist auch mechanisch keine Ziffernvertauschung.
> Deltas: AP-8 123 789 → 126 407 (+2 618 B), AP-10/11 126 407 → 127 607 (+1 200 B).
>
> **Regel daraus** (steht damit auf dem richtigen Befund): die Kennzahl wird an genau EINER
> Stelle geführt (hier), überall sonst steht der Verweis auf die Wächter-Ausgabe (§5); und jeder
> Eintrag nennt den Stand, für den er gilt, samt Messbefehl.

**Ehrlichkeitsvermerk zur ROADMAP-Zahl.** Die Diät-Etappen brachten die Datei bis B4
(`902b287c4`) auf **83.7 KB** (85 731 B; Messbefehl `git show 902b287c4:ROADMAP.md | wc -c`)
— Budget wäre dort grün gewesen. *(31.7.2026, R2-11: hier stand «83.4 KB»; der Commit
`07bef2dee`, aus dem die Rechnung stammt, nannte selbst korrekt 83.7 KB.)* Danach schrieben zwei
*inhaltliche* Etappen derselben Session wieder hinein: **AP-9** (W2·17-UI-BEFUNDE,
210 Befunde in 20 Batches, +10 KB) und **AP-6** (42 Teilschritte aus Mehr-Sessions-Schritten,
+27 KB), dazu AP-8 (+3 KB Pfad-Präfixe `fahrplaene/`). Das ist **genau der Vorgang, für den
der Re-Akkumulations-Wächter gebaut wurde** — er meldet ihn korrekt, und die Meldung bleibt
stehen, statt weggerechnet zu werden. Das DoD-Ziel **≤ ~65 KB** ist damit **nicht** erreicht;
der Rest ist Leitprinzipien-, Protokoll- und offene-Steuerungs-Prosa, deren Auslagerung eine
eigene Etappe braucht (offener Punkt, s.u.).

**Etappen der Welle (Kurzform).** AP-0 `plan:set`-Blockquote-Härtung (Regressionstest erst rot
gezeigt) · AP-1 QS-TOK auf `wip` (main) · AP-2 STRUKTUR-Rotation 81.5→33.8 KB + Session-Karte ·
AP-3/AP-4 Archiv-Wellen (11 + 9 Fahrpläne) · B1 done-Blöcke wörtlich → `ROADMAP-CHRONIK.md` ·
B2 Archiv-Restpunkte-Datei · B3 Querschnitt-Verdichtung · B4 Spec-Prosa offener Schritte
wörtlich in ihre Fahrpläne · AP-9 W2·17-UI-BEFUNDE · AP-6 Teilschritt-Zerlegung · AP-7
Heimat-Zeile + §0-Kopf je aktivem Fahrplan · AP-8 Umzug nach `fahrplaene/` samt Umstellung des
Link-Tors · AP-10/11 Stand-Nachführung + Nachhalte-Konvention.

**Ablage-Bilanz.** 20 Fahrpläne nach `archiv/`, **29** aktive in `fahrplaene/`, Root von 51 auf
**22** `.md` gesenkt. Das Link-Tor (`check:plan` Regel 7) scannt seit AP-8 den Ordner statt den
Repo-Wurzel; der Negativ-Beweis (unverlinkte Datei ⇒ rot) ist in `d7aa4e1` protokolliert.

**Lücke im Rotations-Regex — gefixt 4.8.2026** (Branch `feat/qs-tok-rotation-fix`, §17-Wurzel-Fix).
`.claude/hooks/struktur-rotieren.py` erkannte mit `DATUM_RE = ^## Session (\d{1,2})\.(\d{1,2})\.(\d{4})`
Karten mit **Doppel-Datum** im Titel («`## Session 24./25.7.2026 …`») nicht; `plane_rotation()`
behielt undatierte Karten konservativ — sie rotierten **nie**. Rot-Beweis vor dem Fix (Session
4.8.2026, 7 betroffene Karten statt der ursprünglich notierten 3 — zwei weitere Doppel-Datum-
Titel kamen seither hinzu): `python3 .claude/hooks/struktur-rotieren.py --dry-run` zeigte
`rotieren: 0` bei 75.0 KB, obwohl die 24./25.7.- und 31.7.2026-Karten weit über
`BEHALTE_ARBEITSTAGE` hinaus waren. **Mechanik:** `DATUM_RE` erweitert um eine optionale
Tag2-Gruppe (`(\d{1,2})\.(?:/(\d{1,2})\.)?(\d{1,2})\.(\d{4})`); ist sie gesetzt, gilt sie als
massgebliches (späteres) Datum — Einzel-Datum-Titel bleiben byte-identisch im Verhalten.

**Budget-getriebene Nachrotation (gleicher Fix, gleicher Anlass).** Die reine Alters-Rotation
(`BEHALTE_ARBEITSTAGE = 2`) kann an bau-intensiven Tagen das 60-KB-Budget reissen lassen, ohne
dass je nachrotiert wird — der Wächter warnt dann dauerhaft, ohne Wirkung. Neu: liegt
STRUKTUR.md nach der Alters-Rotation weiterhin über dem Budget, rotiert `budget_erweitern()`
zusätzlich schrittweise die jeweils **älteste verbleibende datierte Karte** (Tie-Break bei
gleichem Datum: die im Dokument am weitesten unten stehende), bis das Budget eingehalten ist
oder die harte Untergrenze `MINDEST_BEHALT = 3` erreicht ist — dann bricht die Nachrotation ab
und der Wächter warnt weiter. Undatierte Karten bleiben wie bisher unangetastet. Grün-Beweis:
derselbe `--dry-run`-Lauf rotierte nach dem Fix 5 Karten (2× 31.7.2026, 3× 24./25.7.2026,
zusätzlich zur Alters-Rotation via Budget-Nachrotation) und führte STRUKTUR.md von 75.0 KB auf
rechnerisch ~57.8 KB — unter das 60-KB-Budget, bei 11 verbleibenden Karten (weit über der
Untergrenze 3).

**QS-TOK-Rest ERLEDIGT (Stand 5.8.2026, s. §Stand oben):** T10 · T12-Stufe-2 · T14 (Stufe 1)
· T16 · T20 sind gebaut (PRs #457/#458); offen bleiben nur die §§4–§7-Pakete je Reihenfolge §8.
**Pauschal-Freigabe David 3.8.2026** — baubar ohne weitere Rückfrage, Reihenfolge frei.
**Neu offen:** ROADMAP
von **110.0 KB** (Stand Fix-Runde 1, 31.7.2026 — Ist-Zahl immer aus
`python3 .claude/hooks/struktur-rotieren.py --check`) unter das 100-KB-Ceiling und weiter
Richtung DoD ≤ ~65 KB. Die Rechnung aus `07bef2dee` bleibt der Rahmen: die 62 `@meta`-Etiketten
aus AP-6/AP-9 kosten allein 17.2 KB und sind unantastbar, das rechnerische Minimum liegt damit
bei **103.7 KB** — das Ceiling ist ohne einen der drei genannten Hebel (Budget begründet anheben ·
`@meta`-Grammatik verschlanken · Teilschritt-Familien samt `@meta` auslagern) nicht erreichbar.


<!-- aus fahrplaene/FAHRPLAN-UI-NAVIGATION.md · verschoben 14.8.2026 -->
### S2 · normQuery-Ausbau: BGE-Zitations-Direktsprung + Kompaktformen — M ✅ (11.7.2026, `feat/uinav-s2-s3`)
> **Gebaut:** `bgeQuery.ts` (deterministischer BGE-Parser + Bestands-Lookup über `bgeReferenz`, K10) → interner Sprung wenn im Bestand, sonst §8-ehrliche «nicht im Bestand»-Zeile + amtlicher search.bger.ch-CLIR-Permalink. Kompaktform «or257d» (Ambiguität «ArGV1» gewahrt) + FR/IT-Aliasse CO/CC/CP/CPC/LP. Unit-Tests inkl. Negativfälle; norm-sprung.e2e um BGE erweitert (A9-DoD grün).
- **Kern:** deterministischer BGE-Parser (`BGE?\s*\d+\s+[IVX]+\s+\d+`, auch ohne Präfix
  «152 II 19») als sprungGruppe-Analogon **vor** allen Gruppen; **§8-Kernstück:** bei
  Nichtbestand ehrliche Zeile «BGE 145 III 63 ist nicht im Bestand» + amtlicher Link
  (bger.ch) statt stillem Rauschen · `or257d`-Kompaktform (Token-Split an der
  Kürzel/Ziffer-Grenze; **Ambiguitäts-Vorsicht:** Kürzel mit Ziffer wie «ArGV 1») ·
  **FR/IT-Kürzel-Aliasse** (CO→OR, CC→ZGB, CP→StGB, CPC→ZPO, LP→SchKG — billigster
  Romandie-Hebel, Zusatzbefund der Praxis-Linse).
- **Flächen:** `src/lib/suche/normQuery.ts`, `useUniversalSuche.ts`, `universalSuche.ts`.
- **Prüfpunkte:** e2e `norm-sprung.e2e.ts`-Kontrakt nachziehen; `universalSuche.test.ts`
  (A6-Rangfolge) bleibt grün; «BGE 152 I 65» = erste Zeile «Direkt öffnen ★». *(#21+#39
  gemergt, #46, Z3.)*


<!-- aus fahrplaene/FAHRPLAN-UI-NAVIGATION.md · verschoben 14.8.2026 -->
### S3 · Dropdown-Ehrlichkeit & Robustheit — M ✅ (11.7.2026, `feat/uinav-s2-s3`)
> **Gebaut:** Enter-Puffer (#52), «Meinten Sie …?» (#44, `vorschlag.ts` Levenshtein §2), §8-Zähler «mindestens N …» (#5) + Mindesthöhen-Platzhalter (#48), Snippet zweizeilig + `<mark>` + redundanter Chip mobil aus (#56), **E1** Korpus-Fusszeile + neue Seite `/abdeckung` «Was ist drin» (aus Registern, K10). E2-Degradieren per Code verifiziert.
- **Kern:** Trefferzähler erst final bzw. «10+ …» solange Sektionen laden *(#5)* ·
  Mindesthöhen-Platzhalter für ladende Gruppen statt Layout-Springen (§15.2) *(#48)* ·
  **Enter-Puffer** während der Ladephase (pending-Flag; mobil trifft die tote Suchen-Taste
  JEDEN Nutzer) *(#52)* · deterministische «Meinten Sie …?»-Zeile (Levenshtein gegen
  `such-vokabular.json` + Erlass-Kürzel + Katalog-Titel; kein LLM, §2) *(#44)* ·
  Snippet-Politur mobil: redundanter Typ-Chip weg, zweizeiliges Snippet mit Highlight *(#56)* ·
  **E1 Korpus-Offenlegung (§8, hoch):** eine Fusszeile «Durchsucht: N Erlasse im Volltext ·
  342 BGE · kantonale Erlasse: nur Titel» + Link auf eine Abdeckungsseite («Was ist drin»,
  aus Registern generiert — deckt auch den Kantons-/Rechtsprechungs-Blindflug ab).
- **Flächen:** `src/components/suche/SuchResultate.tsx`, `useUniversalSuche.ts`,
  `src/lib/suche/vokabular.ts`, `src/data/such-vokabular.json`.
- **Hinweis:** Fehlerzustand der Online-Gruppe (E2 der Treue-Linse) ist laut E2-Anbindung
  **bereits gebaut** (ehrliches Degradieren 503/Netz/Timeout/200-leer) — nur verifizieren.
- **Prüfpunkte:** «Verjärung» zeigt «Meinten Sie Verjährung?»; kein sichtbarer Treffer springt
  beim Einwachsen; Enter nach 0,5 s landet richtig. *(#5, #44, #48, #52, #56, E1, E2-Verify.)*


<!-- aus fahrplaene/FAHRPLAN-UI-NAVIGATION.md · verschoben 14.8.2026 -->
### S4 · Gesetzestext-Ranking bei Alltagsbegriffen — M–L ✅ (12.7.2026, `feat/uinav-s4-s5`)
> **Gebaut (Opus).** FlexSearch liefert nur noch den Recall; die Reihenfolge bestimmt
> eine reine, deterministische Relevanz-Schicht `src/lib/suche/artikelRanking.ts` (§2). Der
> Such-Index bekommt drei Felder aus dem bestehenden `struktur/bund`-Sidecar (K10, KEIN
> Zweit-Index): m=primäre Marginalie (Hauptthema), n=nachrangige Marginalie, g=Gliederungs-
> Titel. Drei topische Stufen (Hauptthema → Nebenerwähnung → Text), innerhalb einer Stufe
> Kernerlass ↑ + Artikelnummer ↑ (definitorischer Eröffnungsartikel zuerst). **Query-Testset
> = Gate** (`src/tests/suche/rankingTestset.test.ts`, gegen den echten Bund-Korpus, Vorher/
> Nachher-Metrik + «nie schlechter als roh»): «Miete»→OR 253 (— → 1), «Verjährung»→OR 60/127
> (— → 1/3), «Kündigung»→OR 271 (26 → 1), «Werkvertrag»→OR 363 (2 → 1). Synonyme tragen
> Recall+Textfrequenz, nicht die topische Ordnung. Golden byte-gleich, gate:schnell grün.
- **Kern:** Relevanz-Score im Artikel-Volltext-Index: Boost für Marginalie/Sachüberschrift +
  Termfrequenz + **kuratierte Kernerlass-Prioritätsliste** (klein halten: OR/ZGB/StGB/ZPO/BV/
  SchKG; im Code dokumentiert-begründet, kein Schein-Objektivität) + `such-vokabular.json` als
  Synonym-/Einstiegsschicht («Miete» → OR 8. Titel).
- **Auflage (repo-Linse):** A6 dokumentiert die gruppeninterne Sortierung als Kontrakt —
  Ranking-Boost ist eine **deklarierte fachliche Änderung** (Tests nachziehen, §6.3);
  **Query-Testset** («Miete», «Verjährung», «Kündigung», «Kalender», «BGE 152 I 65») als
  Regressions-Anker VOR dem Umbau festschreiben.
- **Flächen:** `src/lib/suche/artikelVolltext.ts`, `src/data/such-vokabular.json`.
- **Prüfpunkte:** «Miete» zeigt OR 253 ff. in den Top-Treffern; «Verjährung» OR 127/134 vor
  IPRG/MStG. *(#40 — schwerster Einzelbefund.)*


<!-- aus fahrplaene/FAHRPLAN-UI-NAVIGATION.md · verschoben 14.8.2026 -->
### S5 · /suche-Ergebnisseite (+ Facetten Etappe 2) — L ✅ (12.7.2026, `feat/uinav-s4-s5`)
> **David-Gate AUFGEHOBEN** (David 11.7. im Chat: «du hast bei allem was ich entscheiden
> muss selbst die wahl» → Orchestrator-Entscheid: bauen). **Gebaut (Opus).** Neue Route
> `/suche?q=` (prerenderte Shell via `seo.ts`, `ERWARTETE_ROUTEN` 62→63; client-gefüllte
> Treffer) zeigt alle Gruppen ungekappt — bes. die Gesetzestext-Gruppe (34/40 Treffer waren
> im Dropdown strukturell unerreichbar, §8). Additiv zum A5/A6-Dropdown, **A5-Enter-Semantik
> unberührt** (kein Palette-Revival). `artikelGruppe` bekommt endlich `mehrHref` (/suche?q=);
> `useUniversalSuche(q, {artikelLimit, kappung})` — Default = Dropdown unverändert.
> Inhaltstyp-Facette (Etappe 2, ehrlich+lokal; Masse-Counts folgen mit E3, §8),
> role=group-Landmarken (`sektionsRollen`), Deep-Link `?q=` stabil, CLS über festen
> Kopf/Feld. e2e (`suche-seite.e2e.ts`) + a11y-Prüfpunkt grün. **O1-«Suchanfragen-Verlauf»
> hängt laut Plan an O1** (eigene Baueinheit), NICHT an S5 → hier nicht mitgebaut; der
> Landeplatz existiert nun.
- **Kern:** `/suche?q=`-Route (heute 404, `routesManifest.ts`): alle Gruppen ungekappt,
  `artikelGruppe` bekommt endlich ein `mehrHref`-Ziel (heute sind 34/40 Treffer strukturell
  unerreichbar — §8-relevant), Dropdown bleibt Schnellzugriff und verlinkt «alle 40 →»;
  Enter ohne Auswahl → `/suche?q=`. **Etappe 2:** Facettenspalte (Inhaltstyp/Ebene/Kanton
  mit Counts; entscheidsuche.ch-Muster) — Ebene-1-Facetten aus lokalen Manifesten, Masse-
  Counts erst mit E3-Serving.
- **Warum David-Go:** A5/A6 haben das Dropdown-Modell gerade fixiert — /suche als **additive**
  Zielseite framen (kein Palette-Revival), kurzes Ja einholen.
- **Flächen:** `src/routesManifest.ts`, neue `src/pages/Suche.tsx`, `universalSuche.ts`.
- **Prüfpunkte:** Zähler = erreichbare Treffer (Ehrlichkeit); Deep-Link/Bookmark einer
  Recherche funktioniert; Gesetzestext-Sektion im Dropdown auf Top-5 + «alle N →» gekappt.
  *(#41, #71 eingefaltet, #48-Zugang, #52-Langfrist, #20/#43-Konsolidierung, #1-Kappungs-Teil.)*


<!-- aus fahrplaene/FAHRPLAN-UI-NAVIGATION.md · verschoben 14.8.2026 -->
### V1 · Artikel↔Werkzeug-Map (beide Richtungen, EINE Datenstruktur) — M ✅ (11.7.2026, Branch `feat/uinav-v1`)
- **Gebaut:** artikel-scharfe `ARTIKEL_WERKZEUGE`-Map in `normtext/werkzeuge.ts` (EINE Datenstruktur, §5) mit Artikel-Bereichen (`von`/`bis`, Sub-Artikel 335a ⊂ 335) + fachlichem **Norm-Beleg je Kante** (§7); 60 Kanten über 10 Erlasse, Zweifelsfälle (13. ML, Schadenszins, Werkvertrags-Gewährleistung, AIG-Fristen) bewusst ausgelassen + im Code ausgewiesen (§8). **Beide Richtungen:** (a) Entscheid — `werkzeugeFuerZitate()` löst die zitierten Norm-Strings artikelscharf auf → Rausch-Filter (BGE 152 I 65: 7 grobe Werkzeuge inkl. Erbrecht/Vorsorge → **0**, da Art. 448 ZGB = Erwachsenenschutz, Art. 321 StGB = Berufsgeheimnis); (b) Gesetz-Reader — neue KontextPanel-Gruppe «Werkzeuge zu einzelnen Artikeln» (Art. 127–142 OR → Verjährung), ersetzt dort die grobe Erlass-Liste. Konsumenten: `KontextPanel.tsx`, `EntscheidLeser.tsx` (`artikelZitate`-Prop), `kontext.ts`. Golden `IDENTISCH` (209, alles runtime); tsc/lint/3653 Unit-Tests grün (8 neue Map-Tests); Gegenprüfung Opus (Anker gegen Fedlex). Trailer `Roadmap: W2·10-UI-NAV`.
- **Kern (Spec):** `ERLASS_WERKZEUGE` (`normtext/werkzeuge.ts`) ist deklariert «Erlass-granular» —
  daher ZGB→Erbrecht-Rauschen unter BGE 152 I 65 UND fehlender Rechner-Hinweis bei OR 127.
  Bau: **artikel-scharfe Map** (Artikel-Ranges: Art. 448 ZGB ≠ Erbrecht) + Relevanzschwelle
  mit **Ausblenden unter Schwelle** (lieber 1–2 treffende Werkzeuge als 7 grobe) — gespeist
  aus der Rechner-Registry (behauptete `calc.normen`-Invertierung **zuerst empirisch
  erheben**). Konsumenten: «Passende Werkzeuge» am Entscheid *(#28)* + neue Zeile «Werkzeuge
  zu diesem Artikel» im KontextPanel *(#38; Erstschritt Top-Artikel Art. 60/67/127 ff. OR,
  Art. 91–94 ZPO)*.
- **Flächen:** `src/lib/normtext/werkzeuge.ts`, `src/components/kontext/KontextPanel.tsx:591`,
  `EntscheidVerzahnung.tsx`. U-VERWEIS-Geist, aber **eigener neuer Schnitt** (A7/A13 sind gebaut).
- **Prüfpunkte:** BGE 152 I 65 zeigt 0–2 passende Werkzeuge (kein Erbrecht); OR Art. 127
  zeigt den Verjährungs-Rechner. *(#28+#38 gemergt — einer der 3 wertvollsten Befunde.)*


<!-- aus fahrplaene/FAHRPLAN-UI-NAVIGATION.md · verschoben 14.8.2026 -->
### O1 · Lokaler Verlauf & Wiedereinstieg — M ✅ (11.7.2026, `feat/uinav-o1-verlauf`)
> **Gebaut (Opus):** (1) Tracking auf **alle Inhaltstypen** — Materialien ergänzt
> (Gesetz/Entscheid waren im Vintage-Re-Audit bereits gebaut, `INHALT_ITEM`), plus
> ein `typ`-Diskriminator je Eintrag (Typ-Icon) mit Alt-Eintrags-Migration. (2)
> **⌘K-/Fokus-Leerzustand** der Kopf-Suche (`SucheLeerzustand`): Zuletzt-Liste (bis 5)
> + 5 kuratierte Rubrik-Einstiege, synchron/CLS-frei (nur auf Fokus → keine
> Prerender-Divergenz). (3) **Topbar-«Verlauf»** (`VerlaufUebersicht`): Uhr-Trigger
> + Dialog-Flyout, chronologisch heute/gestern/früher, Typ-Icons, §8-Fusszeile «Nur
> auf diesem Gerät» + «Verlauf leeren». (4) Startseiten-Chips speisen sich
> unverändert aus derselben Quelle (§5, EINE Store). Reaktiver `useZuletzt`-Hook
> (§15.2: Initialstate auf Server-[leer] gepinnt, Sync nach Mount via `ZULETZT_EVENT`
> + `storage`). Store-Kappung 6→12 (Topbar-Verlauf, deklarierte Änderung §6.3).
> Tore grün (tsc · vitest 3764 · golden 209 byte-gleich · lint · gegenpruefung n/a);
> neue e2e `verlauf-o1` (Leerzustand-Recents + Topbar-Verlauf), norm-sprung/a11y/smoke
> bleiben grün (A9-DoD). **Fremd-vorbestehend rot** (unberührt vom UI-Diff):
> `check:p-klassen` + `check:vollstaendigkeit` (Normtext-Daten).
> **Ausgelassen (deklariert):** **Suchanfragen-Verlauf** — der EINE Store ist
> navigations-/route-keyed (§5), Query-Historie ist ein anderer Belang, und ihr
> natürlicher Landeplatz `/suche` ist David-gegatet (S5); ins Route-Store zu falten
> würde §14.2 (Belange nicht mischen, Einheit klein für EIN Gate) verletzen → eigener
> Posten, wenn S5 freigegeben ist. Schritt 2/3/4 der Spec brauchen es nicht.
- **Engpass zuerst:** ~~`zuletztVerwendet.ts` trackt nur Rechner/Vorlagen — «Gesetze/Entscheide
  = eigenes Arbeitspaket» steht wörtlich im Code (archiv/FAHRPLAN-STARTSEITE-V3 §3 #5, ~½ Session).~~
  **Überholt seit 3.7.2026** (Befund 31.7.2026): Gesetz-/Entscheid-/Material-Titel werden getrackt
  (`src/lib/zuletztTitel.ts`, `ZuletztTyp` in `zuletztVerwendet.ts:22`); O1 weiter unten sagt das
  bereits. Der Engpass ist damit weg — Schritt (1) der Reihenfolge ist erledigt.
  **Reihenfolge:** (1) Tracking auf alle Inhaltstypen ausdehnen (Gesetz-Artikel, BGE,
  Materialien, Suchanfragen) → (2) Cmd/⌘K-**Leerzustand** zeigt Zuletzt-Liste + 3–5 kuratierte
  Einstiege (synchron aus localStorage, CLS-frei) → (3) globaler Zugriff: Topbar-«Verlauf»
  (Label/Tooltip am bestehenden Tracker-Icon sofort — S) bzw. schlichtes Drawer-Panel
  (chronologisch, Typ-Icon, heute/gestern) → (4) Startseiten-Chips speisen sich daraus.
- **Leitplanken:** localStorage-only, **§8-Label «nur auf diesem Gerät»** überall; kein
  Server-Verlauf vortäuschen; Westlaw-Graph ist Kür — die Liste liefert 90 %.
- **Startseiten-Umplatzierung der Zuletzt-Rubrik:** NICHT vorab bauen — V3-Abnahme-Mappe
  wartet auf David (→ §Y David-Fragen).
- **Flächen:** `zuletztVerwendet.ts`, `ZuletztTracker.tsx`, `useUniversalSuche.ts`
  (Leerzustand), `Topbar.tsx`. *(#59+#62+#69+#3-Teile gemergt; Westlaw-Precision-History-Muster.)*

---


<!-- aus fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md · verschoben 14.8.2026 -->
## Abarbeitungs-Stand 12.6.2026 (Session «Wettbewerbsanalyse + Musterklagen», David abwesend)

ERLEDIGT + committet: **V1** (Verträge-Rubriken + formGate-Zeile, 8a78ee2) ·
**V2.1** Verjährungsverzicht (0b21767) · **V2b** Blanko-Download-Rahmen alle
Einzel-Wizards (270007c; Mappen offen) · **Musterklagen M1**: Scheidungsklage
unbegründet Art. 290 ZPO (b3ba2dc; Karte klage_besonders/Familienrecht).
WEITER ERLEDIGT (Fortsetzung): **Bd.-I-Struktur-Dossier** §§ 1–25 in
bibliothek/recherche/musterklagen-vertrag-haftpflicht-bd1.md (bdebf6d;
4 Struktur-Agents, NUR Struktur) · **Gemeinsames Scheidungsbegehren**
Art. 285/286 ZPO (00f7931) · **Eheschutzgesuch** Art. 175 ff. ZGB +
10 GEPLANT-Karten der Musterklagen-Rubrik (7175a01). Familienrecht-Masken
3/3 der ersten Welle gebaut (Scheidungsklage · Begehren · Eheschutz).
NÄCHSTE SCHRITTE (V8-Fortsetzung): Masken für die geplanten Karten nach
Davids Priorisierung — Kandidaten-Reihenfolge nach Dossier-Praxiswert:
Bauhandwerkerpfandrecht-Gesuch (4-Monats-Gate!) → Arbeit-Kündigungsklage
(Synergie 336b-Engine) → Werkmängel → VVG → Honorar → 158-ZPO →
Konkurrenzverbot → Personenschaden → Abänderung/Konkubinat. Dazu V2-Rest
(NDA, Zession, Fristerstreckung, 8a-SchKG-Löschung), V3–V7.
Push/Deploy weiter gesperrt (Davids frisches Ja).


<!-- aus fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md · verschoben 14.8.2026 -->
## Abarbeitungs-Stand 13.6.2026 (Session «Pauschal-Abnahme + V2-Rest»)

P1-Priorisierung durch David ABGENOMMEN 12.6.2026 («alles abgenommen»,
`abnahme/wortlaute-2026-06/PAUSCHALABNAHME-2026-06-12.md`). **V2 KOMPLETT
(4/4):** Verjährungsverzicht (0b21767) · **Abtretungserklärung/Zession**
Art. 164/165/167/170 OR (5d4ccf8) · **Fristerstreckungsgesuch** Art.
143/144/148 ZPO mit Frist-Art-Weiche + Vor-Fristablauf-Gates (fd10ff1) ·
**Nichtbekanntgabe Betreibung** Art. 8a III lit. d SchKG, Fassung
1.1.2026 (AS 2025 522) am Cache verifiziert, 3-Monats-Schwelle
deterministisch (3d1fc99). NDA gehört zu V3 (Vertrags-Grundtyp).
OFFENE FOLGEPOSTEN aus V2: (a) Ergebnis-Prefill-Brücke zpo-fristen →
Fristerstreckung (laufende Frist reist mit, G3); (b) VorlagenSprung im
SchKG-Zuständigkeits-Rechner bräuchte ein neues Anliegen «Löschung/
Nichtbekanntgabe» (Engine-Änderung, Entscheid David). NÄCHSTE PHASEN:
V3 (Auftrag · Werkvertrag · NDA · Konkubinat) → V4 ff.; parallel V8 nach
Priorisierung. Push/Deploy weiter gesperrt (Davids frisches Ja).


<!-- aus fahrplaene/FAHRPLAN-VORLAGEN-AUSBAU.md · verschoben 14.8.2026 -->
## Abarbeitungs-Stand 13.6.2026 (Session «V3 + Verwaltungs-/BGG-Stillstand»)

**V3 KOMPLETT (4/4 Grundtypen, je eigener Commit, Gate je GRÜN):**
**Auftrag** `41dccc3` (Art. 394 ff. OR; Module Beratung/Treuhand/Inkasso;
Auflösungsrecht Art. 404 offengelegt) · **Werkvertrag** `704aa85`
(Art. 363 ff. OR; Weiche beweglich/unbeweglich → Rügefrist 60 T zwingend
Art. 367 Abs. 1bis + Verjährung 2/5 J Art. 371; Brücke Gewährleistungs-
Rechner; Rücktritt Art. 377) · **NDA** `5aa4b62` (Innominat Art. 19 OR;
einseitig/gegenseitig + Konventionalstrafe Art. 160/161/163, Herabsetzung
163 III offengelegt) · **Konkubinat** `d081391` (Art. 19 OR / 646/650/651
ZGB / 530/548/549 OR; Module Wohnen/Kosten/Inventar/einfache Gesellschaft/
Auflösung; kein gesetzliches Konkubinatsrecht + Kindesbelange nach Gesetz
offengelegt). Alle V0-Anker am Cache verifiziert, check:zitate 0 Befunde.
Endstand: 47 gebaut/43 sichtbar, Golden 159, Routen 49.

**EINGESCHOBEN (Auftrag David im Chat):** Verwaltungs-Stillstand
(Art. 22a VwVG) + BGG-Stillstand (Art. 46 BGG) im einfachen Fristenrechner
— neue Engine `lib/bggVwvgFristen.ts`, Dossier `bibliothek/recherche/
stillstand-vwvg-bgg.md`. Gilt NUR für nach Tagen bestimmte Fristen;
Abs.-2-Ausnahmen je Regime; periodengleich zur ZPO (golden-bewiesen).

NÄCHSTE PHASEN: V4 (Detailgrad-Schalter, Pilot Arbeits-/Mietvertrag) ·
V5 (Form-Weichen Bürgschaft/Ehevertrag) · V6 (ABV) · V7 (Rechner-
Erweiterungen) · V8 (Musterklagen-Masken). Fachliche Abnahmen der
V3-Vorlagen + Stillstand-Wortlaut offen. Push/Deploy gesperrt (frisches Ja).


