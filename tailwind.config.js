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
      // Die Stufen selbst stehen in `design/tokens.json` (type.groups); ihre
      // Herleitungen wohnen dort bei der jeweiligen Stufe.
      fontSize: generiert.fontSize,
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
      // Die Hausdecke des DESIGN-REGLEMENT-NORMTEXT §Typo-Skala (≤ 75 ch) hat damit
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
      // des Lesers steht in DESIGN-REGLEMENT-NORMTEXT §4b-C (67/66/66/64/63/56 ch).
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
      maxWidth: { content: '70rem', reading: '40rem', normtext: '42rem', kleintext: '24rem' }, // content ≈ 1120px (Iteration 3: einheitlich schmalere Spalte)
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
      // LeserLesespalte.tsx` (`renderSektion`) und DESIGN-REGLEMENT-NORMTEXT §4b.
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
      minHeight: { 'modul-news': '12.5rem', 'modul-zuletzt': '4.5rem', 'titel-2z': '2.35em', beiwerk: '1.5rem', 'bez-skelett': '3rem', 'inhalt-region': 'calc(100svh - 8rem)', 'kopf-stand': '5.4375rem', 'kopf-stand-sm': '4.375rem', 'kopf-stand-md': '3.375rem' },
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
