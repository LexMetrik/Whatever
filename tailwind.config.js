import containerQueries from '@tailwindcss/container-queries';
import generiert from './tailwind.tokens.generated.js';

// ─── Deckkraft-Fähigkeit der Token-Farben (DESIGN-D0, Fund B4 vom 8.8.2026) ──
// Tailwind 3 wendet den `/<alpha>`-Modifier nur an, wenn der Farbwert parsebar
// ist (`#F1E8D6`) oder eine Funktion bzw. `<alpha-value>`-Vorlage. Ein blosses
// `var(--brass-100)` ist beides nicht: `withAlphaValue()` liefert `undefined`,
// die Deklaration entfällt, die GANZE Regel wird verworfen — `bg-brass-100/70`
// & Co. rendern unsichtbar statt halbtransparent (belegt LM-156 / PR #472).
//
// Der Fix wickelt die BLÄTTER des Farbbaums in eine Funktion, ohne die Werte
// selbst anzufassen: eine Quelle bleibt `design/tokens.json` und ihre
// CSS-Projektion in `src/index.css` (§5 — keine zweite Wahrheit als
// RGB-Kanal-Token, und die Dunkel-Umschaltung bleibt ein reiner
// :root-Eingriff). Der opake Fall gibt unverändert
// `var(--token)` zurück, damit alle bestehenden Utilities denselben Wert
// behalten (§6); nur der Modifier-Fall mischt. `color-mix(in oklab, C p%,
// transparent)` ist das Idiom, das `src/index.css` für `--line`/`--rule-*`
// bereits verwendet — also keine neue Browser-Anforderung.
// Bewacht von `check:design-tokens` Prüfung 3: sie kompiliert die real
// genutzten `/<alpha>`-Klassen und verlangt eine Regel mit abweichendem Wert.
/**
 * @param {Record<string, unknown>} baum Farbbaum mit `var(--token)`-Blättern.
 * @returns {Record<string, unknown>} derselbe Baum, Blätter deckkraft-fähig.
 */
function alphaFaehig(baum) {
  const um = (wert) => {
    if (wert && typeof wert === 'object')
      return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, um(v)]));
    if (typeof wert !== 'string' || !wert.startsWith('var(')) return wert;
    return ({ opacityVariable, opacityValue } = {}) =>
      // Opak: Utility ohne Modifier (Tailwind reicht dort die --tw-*-opacity-
      // Variable durch) bzw. ausdrücklich volle Deckkraft. Sonst anteilig.
      opacityVariable !== undefined || opacityValue === undefined || Number(opacityValue) === 1
        ? wert
        : `color-mix(in oklab, ${wert} calc(${opacityValue} * 100%), transparent)`;
  };
  return um(baum);
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // FARBEN. Die Token-Einträge kommen aus `tailwind.tokens.generated.js`
      // (Quelle `design/tokens.json`, erzeugt mit `npm run gen:tokens`). Hier
      // stehen nur noch die Einträge, die KEIN Token sind: die color-mix-
      // Rezepte, deren Wert erst im Browser aus Mitte, Tönung und Papier
      // entsteht und die darum keinen festen Farbwert haben (§5).
      colors: alphaFaehig({
        ...generiert.colors,
        line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
        // Gesetzes-Reader Linien-Kanon (W2·5d G1): zwei benannte Rollen der EINEN
        // Linien-Sprache — Artikel-Trenner (fein), Struktur-Trenner (oberste
        // Sektionen, eine Spur kräftiger). Nur im Normtext-Reader verwendet;
        // Chrome-Borders bleiben `border-line`. `DEFAULT`/`soft` (die zwei SOLIDEN
        // Trennlinien des neuen Bildes) sind Token und kommen aus der Quelle —
        // dieselbe `rule`-Familie, weil es dieselbe Sache ist: Trennung durch
        // Linie statt durch Fläche.
        rule: { ...generiert.colors.rule, artikel: 'var(--rule-artikel)', struktur: 'var(--rule-struktur)' },
        // Die vier getönten Status-Flächen: `color-mix(in oklab, <Mitte>
        // var(--status-tint), var(--paper))` — kein Farbwert, sondern ein Rezept.
        sage: { ...generiert.colors.sage, bg: 'var(--sage-bg)' },
        slate: { ...generiert.colors.slate, bg: 'var(--slate-bg)' },
        warn: { ...generiert.colors.warn, bg: 'var(--warn-bg)' },
        danger: { ...generiert.colors.danger, bg: 'var(--danger-bg)' },
        ok: { ...generiert.colors.ok, bg: 'var(--ok-bg)' },
      }),
      fontFamily: generiert.fontFamily,
      // Typo-Skala (vollständig): micro 11 · xs 12 · body-s 14 · base 16 ·
      // body-l 18 · h3 20 · h2 25.6 · h1 32 · display 36/44.
      // text-sm/text-lg (Tailwind-Defaults) NICHT verwenden — sie tragen
      // fremde Zeilenhöhen; body-s/body-l sind die Pendants mit System-lh.
      // Die Stufen stehen in `design/tokens.json` (type.groups); der Block
      // darunter ist ihre Projektion und wird von `npm run gen:tokens`
      // geschrieben. Er bleibt — anders als colors/zIndex/… — IN dieser Datei,
      // weil `src/tests/leser-typo-tokens.test.ts` und
      // `src/tests/leser-schriftskala.test.ts` die drei Leser-Stufen am
      // WORTLAUT von `tailwind.config.js` festnageln (§5-Spiegel gegen
      // `leserSchrift.ts`); §6.3 verbietet, einen Test für einen Umbau
      // anzupassen, also folgt die Projektion dem Konsumenten.
      fontSize: {
        /* @generated tokens:start — Quelle design/tokens.json, npm run gen:tokens; nie von Hand */
        /* ── Bedienung und Fliesstext ── */
        /* Kleinste Stufe des Hauses (11 px): Zähler, Randangaben, Marken. */
        'micro': ['0.6875rem', { lineHeight: '1.2' }],
        /* Das Etikett über einer Gruppe. Ohne Versalien und ohne Sperrsatz - die Laufweite steht
           ausdrücklich auf 0em, weil früher hier ein Sperrsatz sass. Rezept: die Klasse
           .lc-overline setzt zusätzlich die gedämpfte Tinte ink-500.

           W2·24-R1: die Overline ist entversalt — 12 px, Tracking normal (Rezept .lc-overline in
           src/index.css; hier der Utility-Zwilling). */
        'overline': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0em' }],
        /* Meta-Zeilen und Chip-Aufschriften. */
        'xs': ['0.75rem', { lineHeight: '1.4' }],
        /* Kleiner Fliesstext und die Aufschrift der Bedienelemente: Reiter, kleine Knöpfe, kleine
           Eingabefelder. Statt der Tailwind-Stufe text-sm. */
        'body-s': ['0.875rem', { lineHeight: '1.5' }],
        /* Grosser Fliesstext; Einleitungsabsätze. Statt der Tailwind-Stufe text-lg zu verwenden,
           die eine fremde Zeilenhöhe trägt. */
        'body-l': ['1.125rem', { lineHeight: '1.6' }],
        /* ── Titel ── */
        /* Untertitel innerhalb einer Sektion. */
        'h3': ['1.25rem', { lineHeight: '1.25' }],
        /* Sektionstitel; mobil zugleich die Titelstufe des Leser-Kopfs. */
        'h2': ['1.6rem', { lineHeight: '1.15' }],
        /* Seitentitel. Gewicht und Laufweite stehen an der Element-Regel für h1 bis h3 und gelten
           für alle drei Titelstufen. */
        'h1': ['2rem', { lineHeight: '1.15' }],
        /* Display-Stufe für Seiten-Eröffnungen unterhalb von display-l. */
        'display': ['2.25rem', { lineHeight: '1.05' }],
        /* Grösste Stufe der Skala. Für die eine Zeile, die eine Seite eröffnet. */
        'display-l': ['2.75rem', { lineHeight: '1.05' }],
        /* ── Lesen (Normtext und Entscheide) ── */
        /* Der Fliesstext im Satzspiegel des Gesetzes-Lesers. Die Zeilenhöhe gehört zur Stufe und
           darf nicht am Markup überschrieben werden; 1.62 hält WCAG 1.4.8 (mindestens 1.5). Das
           Gewicht 450 statt 400 stammt aus der Beobachtung, dass Serifen am Bildschirm dünner
           wirken als im Druck.

           ── LESER-SATZSPIEGEL (W2·5m-LESER-V3 · S2, Pos. 19) ────────────────
           Entscheid David 17.8.2026 am Bildbogen `docs/ux-audit-2026-07/reader/
           leser-v3-s2/bogen.html` («v2 gefällt mir besser aber fussnoten
           hochgestellt») ⇒ Variante **V2 «amtsnah kompakt»** aus FAHRPLAN-
           LESER-V3 Kap. 8 / Design-Grundlage Kap. 2.4, mit der EINEN Abweichung
           «Fussnotenmarke hochgestellt statt in runden Klammern» (die Marke ist
           keine Grösse dieser Skala, sondern das em-relative Token `--fn-marke`
           in index.css — sie MUSS relativ bleiben, damit sie dem Fliesstext und
           dem Schriftregler folgt).

           Nur DREI Stufen treten neu ein, nicht die sieben der Grundlage
           Kap. 2.2: `leser-titel`/`leser-h`/`leser-chrome`/`leser-mikro` wären
           wertgleiche Zweitnamen für `h1`/`h2`/`body-s`/`overline` — ein zweiter
           Name für denselben Wert ist genau die zweite Wahrheit, die §5
           verbietet. `leser-art` (20 px Artikelnummer) ist bewusst NICHT
           eingeführt: V2 sagt «Titelstufen unverändert», und die Artikelnummer
           zu vergrössern hätte David am Bogen nicht gesehen (Ä7 wird über die
           Randtitel-Seite gelöst, s. `helpers.tsx` margStufeStil).

            · `leser-text` 18 px / lh 1.62 (bis R6c 17 px / 1.55) — Normtext-
              Fliesstext. Ersetzt das
              Paar `text-body-l leading-[1.65]` (18 px / 1.65) am Artikel-Körper:
              der rohe `leading-[…]`-Override fällt damit weg, die Zeilenhöhe
              gehört zur Stufe (Grundlage Kap. 8 Nr. 4 «kein fixer Leading-Wert
              über alle Grössen»). WCAG 1.4.8: lh 1.55 ≥ 1.5, Lesemass 42 rem.
            · `leser-rand` 13 px / lh 1.35 — Marginalie/Randtitel, Sans, label-2.
            · `leser-fn`   11 px / lh 1.45 — Fussnoten-Apparat am Artikelfuss
              (war `text-xs leading-normal` = 12 px / 1.5; Kap. 8 nennt als Ist
              `text-micro`, gemessen am Code war es `text-xs`).
              ZEILENHÖHE 1.3 → 1.45 (T3, Design-Qualitäts-Pass 29.8.2026,
              DEKLARIERTE fachliche Änderung, nicht Refactoring): die S2-V2-Spalte
              setzte 1.3 für eine SCHMALE Fussnotenspalte an; gebaut wurde der
              Apparat dann über die volle Lesespalte (gemessen @1440 am OR:
              640 px Kasten, 108 ch/Zeile). 1.3 auf 11 px über 108 ch heisst
              14.3 px Zeilenabstand bei 635 px Zeilenlänge — das Auge verliert
              beim Rücksprung die Zeile (Doppelsprung/Zeilenwiederholung). Der
              Apparat läuft seit T3 auf `max-w-kleintext` (26 rem ≈ 71 ch), also
              genau auf der Spalte, für die 1.3 gedacht war; 1.45 gibt der
              Feinschrift trotzdem die Luft, die WCAG 1.4.8 (≥ 1.5 für
              Fliesstext) für Blocktext verlangt — knapp darunter, weil der
              Apparat Referenz-, kein Lesetext ist. Die GRÖSSE bleibt
              unangetastet (0.6875 rem, Entscheid David 17.8.2026 am Bildbogen).
           W2·24-R4 · ZEILENHÖHE 1.55 → 1.62 (deklarierte Typo-Änderung, kein
           Refactoring). Das freigegebene Referenzbild (`abnahme/design-
           identitaet/vorschlag-freigegeben.html`, `.norm { font-size:17px;
           line-height:1.62 }`) setzt den Normtext im Satzspiegel auf 1.62; die
           Grösse (17 px) bleibt unangetastet. Die Zahl muss HIER stehen und
           kann nirgends sonst gesetzt werden: `src/tests/leser-typo-tokens.
           test.ts` verbietet jedes `leading-…` am Fliesstext-Markup, weil die
           Zeilenhöhe zur Stufe gehört (Grundlage Kap. 8 Nr. 4) — die Tabelle
           dort ist mit derselben Änderung nachgezogen.
           WCAG 1.4.8 unverändert eingehalten: 1.62 ≥ 1.5 (Zusage von
           `e2e/leser-lesemass.e2e.ts`), das Zeilenmass rechnet nicht mit der
           Zeilenhöhe und bleibt Zeichen für Zeichen, was es war.
           W2·24-R6c · GRÖSSE 17 → 18 px (deklarierte Typo-Änderung, kein
           Refactoring). D20 (c) verlangt «Lesetext 18 px»; R6b konnte die Zahl
           nicht setzen, weil `src/index.css` dort TABU war und ein Alleingang an
           der Basis den Schriftregler zerbrochen hätte (die Stufe «mittel» wäre
           von 108 % auf 102 % kollabiert — Herleitung in `abnahme/design-
           identitaet/R6-NACHZUG.md` §4). R6c setzt die Basis UND die drei
           Reglerstufen in EINEM Zug: `index.css` (Block LESER-SCHRIFTSKALA) und
           `pages/gesetz-leser/leserSchrift.ts` (`SCHRIFT_REM`) tragen dieselben
           Faktoren 1.08 / 1.18 / 1.30 über der neuen Basis, die Anzeigewerte
           bleiben 100 · 108 · 118 · 130 %. `src/tests/leser-schriftskala.test.ts`
           hält die drei Orte gegeneinander. */
        'leser-text': ['1.125rem', { lineHeight: '1.62' }],
        /* Marginalie und Randtitel am Artikel. Die Skala-Notiz im Repo nennt für diese Stufe die
           Bedienschrift, das gebaute Rezept .lc-randtitel setzt sie kursiv in der Leseschrift -
           siehe randtitel. */
        'leser-rand': ['0.8125rem', { lineHeight: '1.35' }],
        /* Der Fussnoten-Apparat am Artikelfuss. Die Zeilenhöhe liegt bewusst knapp unter 1.5, weil
           der Apparat Referenz- und kein Lesetext ist; er läuft auf der schmalen Feinschrift-Spalte
           kleintext. */
        'leser-fn': ['0.6875rem', { lineHeight: '1.45' }],
        /* @generated tokens:end */
      },
      borderRadius: generiert.borderRadius,
      // D-1.7 Motion-Dedup: Literale auf die --dur-*-Token gemappt (Muster der
      // Nachbar-Keys ease/shadow) — index.css ist die EINE Motion-Quelle.
      // KEIN Token: das Token-Format kennt bewusst keine Motion-Familie.
      transitionDuration: { fast: 'var(--dur-fast)', base: 'var(--dur-base)', slow: 'var(--dur-slow)', stage: 'var(--dur-stage)' },
      transitionTimingFunction: { DEFAULT: 'var(--ease)' },
      boxShadow: generiert.boxShadow,
      // Schichtungs-Skala (C3, 5.9.2026) — Rollen statt roher Zahlen, Werte
      // unverändert aus dem Bestand migriert (Herleitung + Reihenfolge in
      // `design/tokens.json`, zIndex.tokens). `extend` lässt Tailwinds
      // Default-Skala (z-0/10/20/…) technisch weiter zu — Prüfung 5 in
      // check-design-tokens.ts verbietet ihre NEUE Verwendung im Quellbaum.
      zIndex: generiert.zIndex,
      // `reading` (40rem ≈ 66–71 ch) = die knappe Standard-Lesespalte site-weit
      // (Verdikte, Leden). `normtext` (42rem = 672px) = die etwas grosszügigere
      // Lesespalte NUR des Gesetzes-Readers (E6/A37, David 16.7.2026: «gib dem
      // Gesetz mehr Platz … nutze den Platz der zur Verfügung steht»): die Norm
      // gewinnt Breite und verletzt §13/2 nicht (Lesespalte, nie volle
      // Fensterbreite).
      //
      // ZEICHEN JE ZEILE — NEU GEMESSEN NACH S2 (Nachzug 17.8.2026, Arch-Prüfer 9).
      // Hier stand «≈ 70–72 ch … ≥ 3 ch Luft». Das galt für die alte 18-px-Stufe;
      // mit F3 = V2 (17 px) passt MEHR Text in dieselbe Breite. Gemessen @1440 mit
      // der Methode von `e2e/leser-lesemass.e2e.ts` (längster mehrzeiliger
      // Fliesstext-Absatz, Textlänge / Zeilenkisten):
      //   ZGB 68 · OR 71 · StPO 73 · VMWG 74 · StGB 77 ch
      // Die Hausdecke des DESIGN-REGLEMENT §N-4b (≤ 75 ch) hat damit
      // NICHT mehr «≥ 3 ch Luft»: beim VMWG sind es 1 ch, und das StGB liegt mit
      // 77 ch DARÜBER (es steht nicht in der gegateten Erlass-Liste, s. die Notiz an
      // der Schwelle in `leser-lesemass.e2e.ts`). Die WCAG-Decke SC 1.4.8 (≤ 80 ch)
      // ist in allen gemessenen Fällen gehalten und wird an drei Breiten gegated.
      //
      // DER OFFENE PUNKT IST GESCHLOSSEN (Entscheid David 29.8.2026, Variante 1C).
      // Hier stand: «Ob das Lesemass für die 17-px-Stufe schmaler werden soll, ist
      // ein Design-Entscheid und liegt bei David (Vollzugsvermerk S2, offener
      // Punkt)». David hat entschieden: JA, aber nicht an diesem Token. Der
      // Textkörper bekommt einen eigenen, in ZEICHEN rechnenden Deckel
      // (`--leser-zeilenmass` ≈ 68 Zeichen, `src/index.css`), der neben dem
      // Pixel-Deckel `--leser-lesemass-max` steht; der schmalere gewinnt. Grund
      // für den zweiten Deckel statt einer kleineren Zahl HIER: `reading`/
      // `normtext` gelten site-weit bzw. auch für die Kopfzeile und skalieren
      // nicht mit dem Schriftregler — ein Zeichen-Deckel tut beides. Die Zahlen
      // oben bleiben als Messprotokoll der 45-rem-Stufe stehen; das IST-Zeilenmass
      // des Lesers steht in DESIGN-REGLEMENT §N-4b-C (Messreihe im Archiv, 67/66/66/64/63/56 ch).
      // Beide zentriert (mx-auto),
      // damit die Restbreite der 2-Spalten-Zelle ausbalanciert statt rechts als
      // toter Steg liegt — dort trieb es zuvor den «Zitat»-Link weit nach rechts.
      //
      // `kleintext` (24rem = 384px) = die Lesespalte der FEINSCHRIFT — Hinweise,
      // Fussnoten-Apparat, alles auf der micro-/xs-Stufe (0.6875–0.75rem).
      //
      // WARUM EINE ZWEITE ZAHL (T2/T3, Design-Qualitäts-Pass 29.8.2026): die
      // 80-ch-Decke (WCAG 2.2 SC 1.4.8, dieselbe wie beim Lesemass) ist eine
      // ZEICHEN-Decke, keine Pixel-Decke — sie skaliert mit der Schriftgrösse.
      // `reading` (40rem) hält sie auf der 18-px-Lead-Stufe (dort ~66–71 ch),
      // NICHT auf der 11-px-Stufe: dieselben 640 px tragen dort gemessen
      // 108 ch (Fussnoten-Apparat OR @1440) bzw. 163 ch (Hinweis
      // `/gesetze/bund/EMRK`). Eine Feinschrift auf `reading` zu setzen sähe
      // token-rein aus und verfehlte die Zusage; darum die zweite BENANNTE
      // Zahl statt eines Arbitrary-Werts am Fundort (D2).
      //
      // WOHER DIE 24: nicht geschätzt, sondern über die VERTEILUNG gewählt.
      // Gemessen wurden ALLE 743 mehrzeiligen Fussnoten-Absätze des OR @1440
      // (Methode `e2e/leser-lesemass.e2e.ts`, Textlänge / Zeilenkästen):
      //   ungedeckelt (640 px)   Median 68.5 · p90 94.3 · MAX 128.5 ch
      //   26 rem (416 px)        Median 66.0 · p90 72.0 · MAX  84.5 ch
      //   24 rem (384 px)        Median 63.0 · p90 69.5 · MAX  74.7 ch
      // Ein Deckel, der nur den Median hält, ist keiner: erst 24 rem bringt
      // AUCH die dichtesten Absätze (Abkürzungs- und Zahlenketten «AS 1959
      // 858; 1964 965 Ziff. I-II», ~4.8 px/ch statt 5.9) unter die 80. Der
      // EMRK-Hinweis liegt damit auf der xs-Stufe bei ~69 ch.
      // `weit` (W2·29-WERKBANK-REST-BREITE, 25.9.2026, Entscheid David «ja das
      // soll optimiert werden»): ab 1280 sass die Startseite auf demselben
      // Deckel `content` (70rem/1120px aussen) wie jede andere Route — 1680
      // und 1920 sahen darum identisch aus. `weit` gilt NUR auf der Startseite
      // (Shell.tsx `inhaltsbreiteFuer`, ab `2xl`/1536px) und NUR für
      // Raster/Kacheln, nie für Fliesstext: `reading`/`normtext`/`kleintext`
      // bleiben unverändert die Lesemass-Deckel. Alle anderen Routen bleiben
      // byte-gleich auf `content` (Golden-Beweis `e2e/startseite-breite.e2e.ts`).
      maxWidth: { content: '70rem', reading: '40rem', normtext: '42rem', kleintext: '24rem', weit: '90rem' }, // content ≈ 1120px (Iteration 3: einheitlich schmalere Spalte); weit ≈ 1440px (nur Startseite ab 2xl)
      // ── DIE EINZUG-SKALA IST GESTRICHEN (Entscheid David 29.8.2026) ────────
      // Hier standen `spacing: { einzug: '1.25rem', 'einzug-mobil': '0.75rem' }`
      // — die Tiefen-Staffelung des Gesetzes-Lesers (W2·5d G1 / V2·L-1, 20 px je
      // Stufe, mobil 12 px, gedeckelt bei 5 Stufen). David 29.8.2026 im Wortlaut:
      // «wichtige änderung … im gesetz die staffelung aufzuheben. es soll alles
      // auf der selben höhe stehen. … analog zu fedlex». Der Wortlaut steht
      // seither auf EINER linken Kante; die Tiefe trägt allein die Zwischen-
      // Überschrift (§4b Rang 1 «Typo»).
      // Die Tokens hatten GENAU EINEN Verbraucher (`LeserLesespalte`), und der ist
      // fort — §17 «gestrichen statt bewacht», kein toter Token im Design-System.
      // Herleitung, Messreihe und Wächter: `pages/gesetz-leser/v3/
      // LeserLesespalte.tsx` (`renderSektion`) und DESIGN-REGLEMENT §N-4b.
      // CLS-Reservierungs-Tokens der Startseite (Startseite V3, §5): benannte
      // Mindesthöhen für die async-/localStorage-Module — Masse, keine Farben
      // (hell = dunkel). `modul-news` benennt den bisherigen Arbitrary-Wert der
      // News-Streifen-Reservierung; `modul-zuletzt` reserviert die Chip-Zeile
      // von «Zuletzt verwendet» (Fallback-Reservierung, FAHRPLAN §3 #5).
      // CLS-Reservierung des Leser-Kopf-Titels (§15.2, A9-Forensik 19.7.2026): der
      // lange «Kürzel — Volltitel» (OR) bricht mit der metrik-angepassten Fallback-
      // Schrift ('Geist Fallback', size-adjust 104.76% ⇒ ~5 % breiter) auf CI-Linux
      // ZWEIzeilig, mit dem geladenen Geist-Webfont EINzeilig. Der font-display-Swap
      // liess den <h1> so 74px↔37px springen und schob Meta/Ingress/Grid ~37px (auf
      // dem 2-vCPU-Runner voll gezählt, CLS ~0.10). `titel-2z` reserviert die
      // 2-Zeilen-Höhe (em-relativ ⇒ trägt text-h2 mobil UND text-h1 ab sm gleich;
      // Zeilenhöhe 1.15 ⇒ 2 Zeilen = 2.30em, +Puffer 2.35em): der Titelkasten bleibt
      // in BEIDEN Font-Zuständen gleich hoch → kein Swap-Shift. Reserviert nur Platz,
      // versteckt/kürzt nichts (§15/2); kürzere Titel gewinnen etwas Weissraum.
      // CLS-Reservierung der Fassungs-Zeile am Artikel-Fuss (§15.2, G-HIST-UI-
      // Forensik 20.7.2026): der Historie-Shard wird per requestIdleCallback
      // NACH dem ersten Artikel-Render geholt (§15/3) — die «Gilt seit»-Badge
      // wuchs damit in bereits sichtbare Artikel ein und schob alles darunter.
      // Gemessen auf /gesetze/bund/MWSTV#art-165 unter 6× CPU-Drossel: CLS 0.0227
      // gegen 0.0002 ohne die Zeile (94 Zeilen, jede exakt 24 px hoch — die Badge
      // ist immer EINE Chip-Zeile, die Timeline klappt nur auf ECHTEN Klick auf
      // ⇒ input-behaftet, CLS-exkludiert). `beiwerk` reserviert diese eine
      // Zeile am Slot, der ab dem ERSTEN Render steht: der Shard-Resolve füllt
      // reservierten Platz, statt Platz zu schaffen → kein Shift. Reserviert nur
      // Platz, versteckt/kürzt nichts (§15/2).
      // S2-UMBENENNUNG (W2·5m-LESER-V3, Pos. 13): der Token hiess `hist-zeile`
      // und ist jetzt `beiwerk` — er reserviert den BODEN DER BEIWERK-ZONE
      // (`[data-beiwerk]`, ArtikelLeser), nicht «eine Historie-Zeile». Der WERT
      // bleibt 1.5 rem, und das ist gemessen statt gerundet: die Chip-Zeile ist
      // exakt 24 px hoch (Sonde 17.8.2026 @1440, alle 480 Slots der StPO und
      // 1598 des OR identisch 24.00 px). Die Design-Grundlage Kap. 3 nennt für
      // die Zone 2.5 rem; das ist ABWEICHEND NICHT übernommen (§7): 40 px Boden
      // unter einer 24 px hohen Zeile hiesse 16 px Leerraum an jedem
      // reservierenden Artikel — also genau die Phantom-Lücke (Ä26), gegen die
      // dieselbe Etappe antritt. Ein Boden kann ohnehin nur Elemente auffangen,
      // die kleiner sind als er; der Fussnoten-Apparat misst gemessen 27–187 px
      // und wird von keinem Token-Wert höhenfest.
      // S2 · Ä26: die Reservierung wird nur noch dort gesetzt, wo überhaupt eine
      // Fassungs-Zeile eintreffen kann — und die Frage wird ARTIKELWEISE am
      // Datenmodell gestellt, nicht am Erlass: `fussAnzeige.length > 0 ||
      // historie` (ArtikelLeser.tsx). Der Generator baut Historie-Einträge nur
      // aus Artikel-Fussnoten, also kann ein fussnotenfreier Artikel nie einen
      // Eintrag bekommen (Invariante, 0 Gegenbeispiele in 24 511 Artikeln).
      // AUSDRÜCKLICH KEINE Ebenen-Weiche: `erlass.ebene === 'bund'` wäre ein
      // Erlass-Sonderpfad und liesse die Reserve unter jedem Bund-Artikel ohne
      // Fussnote stehen; der Rot-Beweis dazu steht im Vollzugsvermerk S2.
      // NACHZUG-KORREKTUR 17.8.2026 (Bug-Check B2 / Arch 1 / Ä65): hier stand
      // «`erlass.ebene === 'bund'` — 209 Shards im Korpus, alle Bund» und
      // beschrieb damit eine Weiche, die so nie gebaut wurde — Doku-Drift gegen
      // §5. Herleitung, Korpus-Messung (25 403 → 17 547 reservierende Artikel,
      // −31 %) und die verworfenen engeren Regeln stehen am Slot selbst
      // (ArtikelLeser.tsx), die Wirkung auf die Höhen-Schätzung in
      // `src/pages/gesetz-leser/berechnungen.ts`.
      // `inhalt-region` (Footer-CLS /gesetze, David 25.7.2026, §15.2): EIN
      // Rahmen um die drei exklusiven Inhalts-Zustände der Übersicht
      // (Landeplatz / Trefferregion / Ebenen-Panel) reserviert von Anfang an
      // gut eine Viewport-Höhe (100svh minus Kopf-Chrom ≈ 8rem) — der
      // Ergebnis-Swap beim Tippen/Löschen zieht den Footer damit nie in den
      // Viewport (Nullprobe 25.7.: FOOTER-Shift ~0.0496 unter Drossel 6×;
      // Beweis e2e/gesetze-footer-cls.e2e.ts). svh = kleinste Viewport-Höhe
      // (mobil stabil). Reserviert nur Platz, versteckt/kürzt nichts (§15.2).
      // `kopf-stand*` (W2·5m-LESER-V3 · S3, §15.2): die Zelle im Erlass-Kopf, die
      // Stand-Zeile UND Status-/Warnzeile trägt. Beide Aussagen treffen erst NACH
      // dem ersten Paint ein (Currency- bzw. Revisions-Sidecar) und sind
      // unterschiedlich lang — ohne Reservierung schiebt der Nachzügler den
      // Lesekörper nach unten. Genau dieser Shift wurde am 9.8.2026 gemessen
      // (CLS 0.0227, e2e/leser-kontext-e4), als die Warnung noch ein eigener
      // Block war. Die frühere Abwehr «beide Fassungen sind gleich lang» trägt
      // nicht mehr: F5 verlangt einen Klartextsatz mit Datum, rund dreimal so
      // lang wie der Grundhinweis. An ihre Stelle tritt eine feste Höhe.
      // WERTE GEMESSEN, nicht geschätzt (Playwright, e2e/leser-kopf-s3-belege;
      // Endzustand des ungünstigsten Erlasses je Fenster, Zeilenhöhe 16.5 px +
      // 4 px space-y-1), aufgerundet auf die nächste halbe Pixelstufe in rem:
      //   < 640   STPO 86.5 px (2 Zeilen Stand + 3 Zeilen Warnung) → 5.4375rem
      //   ≥ 640   STPO 70   px (2 + 2)                             → 4.375rem
      //   ≥ 768   OR   53.5 px (2 + 1 — OR hat die längste Stand-Zeile:
      //                         Inkrafttreten 1912 + Ausweis + Vorbehalt) → 3.375rem
      // OBERHALB 768 KEIN weiterer Schritt — Nachzug 16.8.2026, Prüferbefund:
      // ein `xl`-Schritt auf 2.3125rem (37 px) passte NUR zur Ist-Hülle, die ab
      // 1280 die volle Fensterbreite hat. Die V3-Hülle stellt den Kopf in eine
      // Spalte NEBEN der Seitenleiste; sie misst @1280 nur 656 px und deckelt
      // auch @1440/@1600 bei 752 px, wo OR weiterhin 53.5 px braucht. Der
      // xl-Schritt hätte dort bei jedem Nachschub 16.5 px Sprung erzeugt —
      // also genau den Shift, gegen den die Reservierung gebaut ist. 17 px
      // Reserve in der breiten Ist-Hülle sind der richtige Preis dafür, zumal
      // V3 mit H4 die Hauptroute wird. Gemessen in BEIDEN Hüllen (v1: 1280/1440
      // = 37 px bei 976/1072 px Spaltenbreite; v3: 53.5 px bei 656/752 px).
      // Reserviert nur Platz, versteckt/kürzt nichts (§15/2, §8: der volle
      // Wortlaut steht immer). In der Tailwind-Skala und NICHT als
      // `min-height`-Regel in index.css — das ist die Hausform für
      // Höhen-Reservierungen (`titel-2z`, `beiwerk`, `inhalt-region`), und
      // `src/tests/tap-ziel-token.test.ts` hält index.css frei von rohen
      // min-height-Zahlen (F9: dort gehört nur var(--tap-ziel) hin).
      // W2·24-D35-F1 (7.9.2026) · `bez-skelett` reserviert den BODEN der
      // wartenden Rubrik in der Funktionszeile am Artikelende. Sie klappt auf
      // KLICK auf (input-behaftet, CLS-exkludiert), aber der Entscheid-Shard
      // trifft danach ein — und darf den Artikel darunter nicht noch einmal
      // schieben. Der Wert ist ein BODEN und bewusst KNAPPER als der echte
      // Inhalt: ein Entscheid-Eintrag misst Gruppenkopf + Chip + Regeste, die
      // Reservierung 48 px. Ein Skelett, das MEHR reserviert, als der Inhalt
      // braucht, verlegt den Sprung nur (der Block schrumpfte beim Laden) —
      // dagegen misst `e2e/leser-d35-f1-funktionszeile` (e).
      // W2·29-WERKBANK-START: Kachelhöhe des 2×2-Feldes (Prototyp 23.9.2026: 220 px,
      // Telefon 132 px) — das offene Blatt nimmt genau diese Fläche ein.
      // W2·29-WERKBANK-START-UEBERARBEITUNG U2 (24.9.2026) · `start-schnell` ist
      // die Bühne des wählbaren Schnellwerkzeugs (Frist · Verzugszins · Verjährung,
      // `start/Schnellwerkzeug.tsx`): so hoch wie die HÖCHSTE Variante, damit
      // Wahl, Nachladen und gespeicherte Wahl beim Stammnutzer weder die Fläche
      // noch das per subgrid gebundene Kachelfeld springen lassen (§15). Gemessen
      // 24.9.2026 (Dev, Chromium): zweispaltig (Fläche ≥ 16.5rem) Verzugszins 650 px,
      // Verjährung ≤ 588, Frist 514 → 41rem; einspaltig (Telefon 320) Verzugszins
      // 843 px → `-eng` 53rem; nach den Artikel-Hinweisen am Verzugszins
      // (Gegenprüfung U2) +35 px → zweispaltig 43.5rem, `-eng` 56.5rem (Reserve für 320).
      // U9 (Nachtrag David 24.9.2026 abends «zuletzt geöffnet … soll nicht extra
      // platz einnehmen sonder schnellwerkzeug soll kleiner werden»): die Bühne
      // reserviert nur noch die FRIST-Variante (Prerender); höhere Varianten
      // wachsen. Gemessen 24.9.2026 (Dev, Chromium, Inhalt ohne Mindesthöhe):
      // zweispaltig @1024–1440 Frist 514 px (@390: 506) → 32.25rem (516);
      // einspaltig @320 Frist 709 px → `-eng` 44.5rem (712). Zum Vergleich nach
      // `gap-3` in den Schnellformen: Verzugszins 683 / Verjährung 537 (@1440).
      // Spalte @1440 mit fünf «Zuletzt»: 643 + 16 + 219 = 878 px ≤ 906 px
      // (linke Spalte natürlich) — «Zuletzt» nimmt keine eigene Zeile mehr ein.
      // U4 (24.9.2026) · `start-kachel-breit`: ab `lg` behalten die Kacheln die
      // Höhe von vor U2 (gemessen 289 px @1024–1440) statt auf die Höhe der
      // Fläche Schnellwerkzeug gestreckt zu werden; «Häufig gebraucht» darunter
      // füllt den Rest (`pages/Startseite.tsx`). `start-kachel` bleibt Untergrenze.
      // U13 (Nachtrag David 24.9.2026 abends: «es soll nicht zu scrollen kommen
      // wenn man kachel aufmacht» / «also bei gesetz») · 18rem → 17.5rem. Das
      // offene Blatt (`inset: 0`) ist so hoch wie das Feld (2 × Kachel + 16 px);
      // es soll ab 1280×800 ganz im Fenster stehen. Gemessen 25.9.2026 (Dev,
      // Chromium, headless): Feld-Oberkante 227 px (nach U13-Abstand 219 px),
      // Feld 2 × 288 + 16 = 592 → Unterkante 819 > 800 (Seite scrollte 19 px).
      // 17.5rem: 2 × 280 + 16 = 576 → Unterkante 795 ≤ 800. Die Kacheln tragen
      // ~200 px Inhalt, sie verlieren nur Leerraum; die Gesetze-Wahl passt nach
      // den Blatt-Massen in `index.css` (U13) trotzdem ohne Scroll (Inhalt 520 ≤ 528 px Sicht).
      minHeight: { 'start-schnell': '32.25rem', 'start-schnell-eng': '44.5rem', 'start-kachel': '13.75rem', 'start-kachel-breit': '17.5rem', 'start-kachel-s': '8.25rem', 'modul-news': '12.5rem', 'modul-zuletzt': '4.5rem', 'titel-2z': '2.35em', beiwerk: '1.5rem', 'bez-skelett': '3rem', 'inhalt-region': 'calc(100svh - 8rem)', 'kopf-stand': '5.4375rem', 'kopf-stand-sm': '4.375rem', 'kopf-stand-md': '3.375rem' },
      // E4-Korrektur (David 25.7.2026): der frühere `toc-kontext`-33vh-Slot-
      // Token ist ERSATZLOS entfernt — er klemmte das Gliederungs-Sichtfenster
      // ein («aktuell schneidet es gliederung ab»). Das Kontext-Panel steht
      // jetzt im Fluss INNERHALB des [data-toc]-Scrollers (inhalt-volltext.tsx);
      // CLS bleibt 0, weil unter dem Panel im Scroller nichts steht (Einwachsen
      // vergrössert nur die Scrollhöhe — Beweis e2e/leser-kontext-e4.e2e.ts).
    },
  },
  // Container-Queries (Split-View B-0b, Entscheid David 29.6.2026): erlaubt
  // @-Utilities (@xl:grid-cols-…), die auf die CONTAINER-Breite reagieren statt
  // auf den Viewport — Voraussetzung dafür, dass ein schmales Pane (B-1) nicht
  // weiter Vollbild-Layouts rendert. Reine Utility-Erweiterung; ungenutzt = kein
  // Effekt (noch keine @-Klasse vergeben → verhaltensneutral).
  plugins: [containerQueries],
};
