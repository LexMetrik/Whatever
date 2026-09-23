import type { ReactNode } from 'react';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import { LeserAnsichtV3 } from './LeserAnsichtV3';
import type { LeserModus } from './einzelModus';
import { zeigeVolltitel, type BestimmungsWort } from './erlassAnsicht';
import { kopfElemente, type KopfStufe } from './kopfStufen';

// ─── Die EINE Kopfzeile des Lesers V3 (FAHRPLAN-LESER-V3 Kap. 4a, H1) ────────
//
//   D  │ StPO                                     Erlass ▾  Ansicht ▾ │
//   S  │ StPO                         Erlass ▾  Gliederung  Ansicht ▾│
//   H  │ StPO              Erlass ▾ Gliederung Ansicht ▾│
//   (D35-F2, 7.9.2026: der Zähler «⚖ 14 Entscheide» ist zum Erlass-Griff
//    geworden — die Skizze zeigt den Ist-Stand, die Herleitung steht in
//    `./LeserPanelOeffner` und `./panelModell`.)
//     │ [ Im Erlass suchen …                                    ⌘K ] │
//
// ── D27 (David 6.9.2026) · DIE BROTKRUME IST WEG ────────────────────────────
// WÖRTLICH, zum Bild «Reiter ‹Art. 40 ZGB›» neben der Krume «… › Art. 43a»:
// «diese funktion, dass es anzeigt in welchem artikel wir sind, soll der tab
// bekommen. es kann dann direkt im gesetz raus.»
//
// GEMESSEN war das ein WIDERSPRUCH auf zwei Zentimetern: der Reiter nannte den
// Artikel, den man beim Öffnen gewählt hatte (Adresse), die Krume den, an dem
// man gerade steht (Scroll-Spy) — zwei Ortsangaben derselben Sache, die sich
// beim Lesen auseinanderbewegen. Aufgelöst wird das an EINER Stelle: der Reiter
// folgt der Lesestellung, und die Krume entfällt hier ganz.
//
// WAS ENTFÄLLT: die Kette «Gesetze › Bund ›» samt ihrem engen Ersatz
// «‹ Gesetze» und der laufende Artikel «· Art. 429».
// WAS BLEIBT: das Kürzel — es ist nicht der ORT, sondern der NAME des
// Dokuments, und ohne es trüge die klebende Zeile beim Scrollen keine Auskunft
// mehr darüber, worin man liest.
// WO DER ORT JETZT STEHT: im Reiter (Kürzel + Lesestellung, eine Angabe) —
// gespeist von `aktualisiereTabArtikel` (`lib/tabs.ts`), das der Scroll-Spy in
// `../inhalt-hooks.tsx` bei jedem Artikelwechsel im Bild entprellt schreibt.
// WO DER RÜCKSPRUNG JETZT STEHT: in der App-Seitenleiste und im Reiter
// «Gesetze» — beide sind auf jeder Breite sichtbar, die Krume war es nicht
// (unter 900 px Elementbreite fiel sie ohnehin auf ein einziges Wort zusammen).
//
// ── A-2 · «DIE EINE» IST SEIT 17.8.2026 WÖRTLICH GEMEINT ────────────────────
// Bis dahin sass diese Zeile UNTER der App-Krumen-Leiste, die denselben Ort
// nannte (Auftrag David 17.8.2026: «wir haben jetzt oben einen header mit
// ähnlichem inhalt … passe das entsprechend sinnvoll an»). Die Leiste ist weg —
// die Seite meldet der Hülle `KopfDaten.kopfzeileSelbst` und trägt seither
// Krume, Ebene, Kennung, Ortsangabe und Aktionen allein. Im Split-View bleibt
// über dem Kopf einzig die Pane-Titelleiste, und die trägt nur noch die
// FENSTER-Steuerung (⠿ ◂▸ ⇱ ⧉ ✕), also nichts, was eine Inhaltsseite tragen
// könnte.
//
// EIN VERTRAG FÜR DREI BREITEN — und das ist die eigentliche Zusicherung von
// H1: dieselbe Komponente, derselbe Baum, dieselben Bedienelemente in der
// Einzelansicht, im primären UND im sekundären Pane. Die Datei enthält darum
// KEINE einzige `imPane`-Verzweigung (Kap. 10, Ziel «Kopf-/Layout-
// Verzweigungen 21 → 0»); was sich unterscheidet, ist ausschliesslich die
// gemessene BREITE, und die kommt als `stufe` aus einer Quelle
// (`./kopfStufen`, ResizeObserver am Rahmen). Bewiesen von
// `e2e/leser-kopf-paritaet.e2e.ts`.
//
// Was hier bewusst NICHT steht (Kap. 4a):
//  · kein Suchfeld — es lebt in der Seitenleiste (Kap. 4b, `SuchSprungFeld`),
//  · kein Menü «Rechtsprechung ▾» — die Facetten ziehen in H3 ins Panel,
//  · kein Chip «Stand …» — die eine Stand-Wahrheit steht im Erlass-Kopf
//    (Kap. 4e), zwei Zentimeter darunter und in jeder Breite. Seit A-2 ist das
//    auch der EINZIGE Ort: die App-Leiste, die ihn klebend mitführte, ist weg.
//    Ihn hier nachzubauen hiesse, ihn im Ruhezustand zweimal zu zeigen (§5) —
//    dass er beim Scrollen nicht mitläuft, ist der bewusste Preis, siehe
//    Vollzugsvermerk A-2.
//
// ── Ä46/Ä87/Ä91 · DIESE ZEILE TRÄGT KEIN ✕ MEHR (H4-Nachzug 18.8.2026) ──────
// Bis 17.8. stand hier ein ✕ «Gesetz schliessen», das auf `/gesetze` führte.
// Es ist in drei Schritten gefallen: im Pane (Ä46 — zwei ✕ je Pane, 44 px
// übereinander), auf `mini` (Element-Budget), und mit dem H4-Nachzug ganz
// (Ä87: @1440 lag es bei offenem Blatt 47 px über dessen ✕; Ä91: @720 war es
// das fünfte Element einer Zeile, die vier trägt).
// Verloren geht nichts: das Ziel `/gesetze` steht auf JEDER Breite links als
// beschriftetes Wort — als volle Kette «Gesetze › Bund ›» oder als Rücksprung
// «‹ Gesetze», beide aus `erlassAnsicht.brotkrume` und beide pane-lokal
// aufgelöst (`<Link>` gegen den Pane-Navigator). Die Zusage, dass dieser
// Rücksprung immer da ist, hängt an `erlassAnsicht.hatRuecksprung` und ist
// dort unit-bewiesen; die Auflage «höchstens ein ✕ je Kopfzeile, Rücksprung
// immer beschriftet» samt Messreihe steht in `./kopfStufen`.
// NACHTRAG 6.9.2026 (der Absatz oben bleibt als Befund vom 18.8. stehen, er
// beschreibt den damaligen Stand richtig): mit D27 trägt DIESE Zeile den
// Rücksprung nicht mehr. Er steht seither in der App-Seitenleiste («Gesetze»)
// und in der Arbeitsleiste (Reiter «Gesetze», D7) — beide klebend und auf jeder
// Breite sichtbar, also nicht schwächer als die Krume, die unter 900 px
// Elementbreite ohnehin auf ein Wort zusammenfiel. Die Auflage «höchstens ein ✕
// je Kopfzeile» in `./kopfStufen` ist unberührt.

export function LeserKopf({
  erlass, fussnotenAnzahl, hatAenderungsvermerke, bestimmungsWort, stufe, gliederungKnopf, modus, onModusWahl,
  panelOeffner, suchZone, suchInZeile, tocOffen, onGliederungZu,
}: {
  erlass: BrowseErlass;
  // D27: `aktArtikel` ist hier ersatzlos gestrichen. Die Lesestellung ist damit
  // nicht verloren — sie fliesst unverändert aus demselben Scroll-Spy in den
  // Reiter (`lib/tabs.aktualisiereTabArtikel`) und in die Positions-Persistenz
  // (`../lesePosition.ts`); nur diese Zeile zeigt sie nicht mehr an.
  fussnotenAnzahl: number | null;
  /** D1 — durchgereicht, nicht hier abgeleitet: die Frage gehört ins Modell (§5). */
  hatAenderungsvermerke: boolean;
  /** D35-F3 · durchgereicht ans Ansicht-Menü (§8-Hinweis auf unklassifizierten
   *  Erlassen). Der Kopf wertet sie nicht aus — er ist die Leitung, nicht der Ort. */
  /** D35-F2 · durchgereicht ans Ansicht-Menü (Kopf der Rubriken-Gruppe). Der
   *  Kopf leitet nichts ab — er ist die Leitung, nicht der Ort (§5/B8). */
  bestimmungsWort: BestimmungsWort;
  /** W2·5m · durchgereicht an `./LeserAnsichtV3` — die Lesart-Gruppe des
   *  Ansicht-Menüs (Kap. 15.3). Der Kopf wertet sie nicht aus (§3). */
  modus?: LeserModus;
  onModusWahl?: (m: LeserModus) => void;
  stufe: KopfStufe;
  /** ☰-Öffner der Gliederung — der Rahmen baut ihn, wenn die Seitenleiste
   *  gerade NICHT als Spalte steht. `undefined` = die Gliederung ist sichtbar,
   *  ein Öffner wäre ein Knopf ohne Wirkung. */
  gliederungKnopf?: ReactNode;
  /** H3 — Öffner des Erlass-Blatts («Erlass ▾», seit D35-F2). Leer gelassen
   *  kostet er nichts: kein Platzhalter, keine reservierte Fläche.
   *
   *  D35-F2: die Schwester-Prop `onPanelOeffnen` ist ersatzlos gefallen. Sie
   *  reichte den Menü-Eintrag «Entscheide & Kontext …» herein — den zweiten
   *  Öffner für die Lage, in der die F8-Regel den Zähler wegnahm. Diese Lage
   *  gibt es seit D35-F2 nicht mehr (`../leserOptionen`, `./panelModell`), also
   *  gibt es auch den zweiten Öffner nicht mehr (§17-Gegengewicht). */
  panelOeffner?: ReactNode;
  /** ── Ä19 (H2b) · zweite Zeile des klebenden Kopf-BLOCKS ────────────────────
   *  Das Such-/Sprungfeld, wo die Gliederung NICHT als Spalte steht (Handy,
   *  Split-Pane, Desktop mit eingeklappter Gliederung). Vorher gab es in genau
   *  diesen drei Lagen gar kein erreichbares Feld — gemessen im Split @1440:
   *  `[data-v3-suchsprung] input` count === 0.
   *  Die Kopf-ZEILE bleibt davon unberührt: ihre Element-Zahl ändert sich nicht
   *  (Design-Grundlage Kap. 6, ≤ 4 Elemente). Der Rahmen entscheidet, ob es die
   *  Zone gibt, und legt ihre Höhe als `--leser-v3-such-h` aus — diese Datei
   *  rendert sie nur (§3) und bleibt ohne Breiten-Zweig. */
  suchZone?: ReactNode;
  /** ── N4 (David 7.9.2026) · DIE ZONE STEHT IN DER ZEILE ─────────────────────
   *  Wo eine linke Spur steht, ist neben dem Feld Platz für die zwei Griffe —
   *  dann trägt die Kopf-ZEILE die Zone, statt eine zweite Reihe darunter
   *  aufzuziehen (Herleitung samt Messung in `./leserGeometrie`, `suchInZeile`).
   *  Die Element-Zahl der Zeile bleibt bei vier (Kennung · Feld · ⚖ · Ansicht),
   *  Design-Grundlage Kap. 6. Der Rahmen entscheidet, diese Datei ordnet an. */
  suchInZeile?: boolean;
  /** ── D32 · DER GLIEDERUNGS-GRIFF IM LINKEN STREIFEN ────────────────────────
   *  «‹ Gliederung ausblenden» sass bis 7.9.2026 im Kopf der Gliederungsspalte
   *  selbst (`./LeserLeseZeile`). Seit die Kopfzeile links einen Streifen von
   *  genau der Spurbreite hat (`--leser-spur-versatz`), stünde der leer — und
   *  der Griff säss 28 px darunter in einer eigenen Zeile. Er zieht darum hier
   *  ein; die Gliederung beginnt entsprechend 28 px höher.
   *  `undefined`, wo die Spalte nicht steht: dann ist die Schiene der eine
   *  Griff (Ä79), und ein zweiter wäre einer ohne Wirkung. */
  onGliederungZu?: () => void;
  /** Zustand für `aria-expanded` an diesem Griff. */
  tocOffen?: boolean;
}) {
  const el = kopfElemente(stufe);

  return (
    // `sticky top` aus `--leser-v3-kopf-top`: der Rahmen legt den Wert EINMAL
    // aus (Einzelansicht = unter Topbar + App-Leiste, Pane = 0, weil PaneKopf
    // ausserhalb des Pane-Scrollers liegt). Dieselbe Variable speist
    // `--nt-stick`, also den Sprung-Offset — eine Quelle für «wie hoch klebt
    // es» (Risiko R1). Höhe aus `--leser-v3-kopf-h` (ebenfalls Rahmen).
    //
    // `z-reader-kopf` (C3, 5.9.2026: benannte Rolle für den vormals rohen
    // Wert 17, Schichtungs-Skala in index.css — vorher gab das Repo (Stand
    // 16.8.2026) keine z-Index-Token her, s. Chronik dort). ANLASS der Zahl:
    // der V3-Kopf muss über seinem eigenen Scrim (`z-reader-scrim` = 16,
    // `LeserScrim.tsx`) liegen, aber unter den Overlays (`z-overlay`/
    // `z-modal`: Ansicht-Panel, Sheet, Toast).
    <div
      data-v3-kopf
      className="lc-leser-kopfzeile sticky z-reader-kopf -mx-1 mb-4 bg-paper px-1"
      // ── Ä1 (H2b) · KEINE LEERZONE UNTER DER KRUMEN-LEISTE ──────────────────
      // Gemessen 17.8.2026 @1440: die Krumen-Leiste endet bei y = 102, der
      // V3-Kopf begann bei y = 150 — 48 px Leerzone im Ruhezustand, die beim
      // ersten Scroll auf 0 zusammenfiel (dann klebt der Kopf bei y = 100). Der
      // Nutzer sah also eine Lücke, die sich beim Scrollen von selbst schloss:
      // zwei verschiedene Bilder derselben Kopfzone.
      // Die 48 px sind die Polsterung des ROUTE-Wrappers (`py-8 sm:py-12` in
      // `components/layout/Shell.tsx`, im Pane `py-6` in `Pane.tsx`) — sie gehört
      // dem Seiteninhalt, nicht einer klebenden Leiste. Der Kopf verschluckt sie
      // darum genau einmal, über `--leser-v3-kopf-luecke`: die Vorgabe steht in
      // `src/index.css` (mit derselben 640-px-Schwelle wie der Wrapper), der
      // Pane-Wert kommt inline vom Rahmen. DIESE Datei kennt weiterhin keinen
      // `imPane`- und keinen Breakpoint-Zweig (Kap. 10) — sie liest eine Variable.
      // BEWACHT: `e2e/leser-v3-kopf-buendig.e2e.ts` misst die Lücke auf H/D/S
      // gegen 0 und wird rot, wenn eine der beiden Polsterungen sich ändert.
      //
      // A-2 (17.8.2026): verschluckt wird jetzt ZWEIERLEI — die Wrapper-
      // Polsterung UND das reservierte Band der App-Krumen-Leiste. Das Band
      // behält seine Höhe, damit beim Eintreffen der Meldung «ich trage die
      // Kopfzeile selbst» nichts wandert (Messung und Tor-Beleg in
      // `components/layout/InhaltsKopf.tsx`); dieser Kopf legt sich opak darüber,
      // und genau dadurch sind die 37 px sichtbar gewonnen. Beide Werte kommen
      // von aussen — die Datei bleibt ohne Breakpoint- und ohne `imPane`-Zweig.
      style={{
        top: 'var(--leser-v3-kopf-top)',
        marginTop: 'calc(-1 * (var(--leser-v3-kopf-luecke, 0px) + var(--leser-v3-app-band, 0px)))',
      }}
    >
      {/* N4: EINE Reihe. Der linke Streifen ist genau so breit wie die Spur
          neben dem Gesetzestext (`--leser-spur-versatz`, D32) — deshalb kein
          `gap` zwischen ihm und der Zone: der Abstand STECKT schon in der
          Zahl, ein zusätzliches `gap` schöbe das Feld um 12 px neben den Text.
          Ohne Spur (Pane, @390) bleibt die Zeile, was sie war. */}
      <div className={suchInZeile ? 'flex items-center' : 'flex items-center gap-2 sm:gap-3'}
        style={{ height: suchInZeile ? 'var(--leser-v3-kopf-block-h)' : 'var(--leser-v3-kopf-h)' }}>
        {/* ── D27 · DIE ERLASS-KENNUNG, EINE SCHRUMPFENDE ZONE ─────────────
            Bis 6.9.2026 stand hier die volle Ortsangabe (Krume + laufender
            Artikel) unter `<nav aria-label="Ort im Gesetz">`. Mit D27 (oben)
            bleibt genau der NAME des Dokuments — das ist keine Navigation mehr,
            also auch kein `nav`: eine Landmarke ohne Ziel darin wäre für einen
            Screenreader eine leere Verheissung (§8). Die Zone selbst bleibt als
            `data-v3-kopf-ort` bestehen; sie ist die linke Spur der Kopfzeile,
            gegen die die Klapp-Sonde misst (`e2e/leser-klapp-sonde.e2e.ts`). */}
        {/* ── D32 · DER LINKE STREIFEN ──────────────────────────────────────
            Im Zeilen-Bild ist er genau so breit wie die Spur neben dem
            Gesetzestext (`--leser-spur-versatz`) und gibt nichts davon her
            (`shrink-0`) — sonst begänne das Feld daneben nicht an der Textkante.
            `h-full`: sonst misst der Streifen seinen höchsten Inhalt, und die
            Kennung rutschte um 3 px, sobald der Gliederungs-Griff daneben
            verschwindet (gemessen an der Klapp-Sonde, 7.9.2026 — «ort: Δy=3»).
            Der Griff steht NEBEN `data-v3-kopf-ort`, nicht darin: die Zone ist
            die Erlass-Kennung und nichts sonst — `leser-v3-kopfzeile` (a) liest
            ihren Text und verlangt genau das Kürzel. */}
        <div className={suchInZeile
          ? 'flex h-full min-w-0 shrink-0 items-center'
          : 'flex min-w-0 flex-1 items-baseline'}
          style={suchInZeile ? { width: 'var(--leser-spur-versatz)' } : undefined}>
        <div data-v3-kopf-ort
          className="flex min-w-0 items-baseline gap-1.5 overflow-hidden whitespace-nowrap text-xs text-ink-500">
          {/* ── A4 (H2b-Nachzug) · DIE KENNUNG WIRD NIE ELLIPSIERT ────────────
              Ä21 gab dem Kürzel `min-w-0 truncate` (statt `shrink-0`), weil es bei
              ZH-211.11 der ganze Name ist (45 Zeichen) und die Zone sonst
              gesprengt hätte. NEBENWIRKUNG, gemessen 17.8.2026 @1440 an LugÜ: in
              einer Zone mit ZWEI `truncate`-Geschwistern verteilt Flexbox den
              Mangel auf beide — das VIER Zeichen kurze «LugÜ» wurde zu «Lu…»
              (`scrollWidth` 29 in `clientWidth` 23).
              REGEL unverändert: das Kürzel schrumpft nur, wenn es allein steht —
              dann ist es der ganze Name und darf kürzen. Steht ein Volltitel
              daneben, gibt DIESER nach, und die Kennung bleibt vollständig.
              Dass seit D27 kein Geschwister mehr in der Zone steht, hebt die
              Regel NICHT auf: `el.volltitel` entscheidet weiterhin, und die
              Sonde `e2e/leser-v3-kopf-buendig.ts` (d) misst dieselben Erlasse. */}
          <span data-v3-kopf-kuerzel
            className={`font-semibold text-ink-900 ${
              el.volltitel && zeigeVolltitel(erlass) && !suchInZeile ? 'shrink-0' : 'min-w-0 truncate'}`}
            // D32, offengelegt (§7/§8): im Zeilen-Bild ist der Streifen nur so
            // breit wie die Spur — bei EINGEKLAPPTER Gliederung sind das 56 px,
            // und ein langes Kantons-Kürzel (ZH-211.11) kürzt dort. Der volle
            // Name steht zwei Zeilen tiefer im Erlass-Kopf; der `title` gibt
            // ihn am Griff selbst her, statt ihn zu verschweigen.
            // R8 (7.9.2026): der `title` hing an `suchInZeile` — die Kennung
            // kappt aber in JEDEM `min-w-0 truncate`-Zweig. Gemessen auf
            // /gesetze/kanton/ZH-211.11 @320: 132 von 276 px sichtbar
            // («Gebuehrenverordnung des Obergerichts (GebV OG)»), der Rest war
            // ohne Suchzeile nirgends abrufbar. Jetzt traegt ihn jeder Zweig,
            // der kappen kann; nur der `shrink-0`-Zweig (voller Name steht
            // daneben) braucht ihn nicht.
            title={el.volltitel && zeigeVolltitel(erlass) && !suchInZeile ? undefined : erlass.kuerzel}>{erlass.kuerzel}</span>
        </div>
          {/* D32: der Griff endet über der GLIEDERUNG, nicht über dem Text —
              darum die Spur-Lücke als rechtes Polster (`--leser-spur-abstand`,
              dieselbe Zahl wie das `gap-5` der Lese-Zeile). */}
          {onGliederungZu && (
            <span className="ml-auto shrink-0" style={{ paddingInlineEnd: 'var(--leser-spur-abstand)' }}>
              <button type="button" data-v3-gliederung-zu onClick={onGliederungZu}
                aria-expanded={tocOffen} title="Gliederung ausblenden"
                className="lc-leiste-griff gap-1 px-1.5 text-micro">
                {/* Ä12 (Ästhetik-Review 16.8.2026): hier stand nur «ausblenden»
                    — Wort für Wort dasselbe wie «Seitenleiste ausblenden» der
                    App-Leiste zwei Zentimeter weiter oben, aber mit anderer
                    Wirkung. Zwei gleich beschriftete Knöpfe, die Verschiedenes
                    tun, sind eine Falle (§8). Der Knopf sagt, WAS er
                    ausblendet. Wortlaut mit dem Umzug unverändert. */}
                <span aria-hidden>‹</span><span>Gliederung ausblenden</span>
              </button>
            </span>
          )}
        </div>

        {/* N4/D32 · DIE ERLASS-SUCHE, BÜNDIG MIT DEM GESETZESTEXT ────────────
            Sie steht zwischen dem linken Streifen und den Griffen und nimmt den
            Rest der Zeile; ihren eigenen Deckel (`max-w-reading`) bringt sie
            mit (`./SuchZone`). `min-w-0`, damit ein langes Feld die Griffe
            nicht aus der Zeile drückt. */}
        {suchInZeile && <div className="min-w-0 flex-1">{suchZone}</div>}

        {/* ── Griffe: ⚖ · ☰ (nur wenn nötig) · Ansicht ────────────────────────
            Design-Grundlage Kap. 6: «Kopfzeile im Ruhezustand ≤ 4 Elemente,
            davon ≤ 2 reine Icons». Ort + Ansicht = 2; ☰ tritt hinzu, wenn die
            Gliederung nicht ohnehin sichtbar ist (und seit Ä79 auch nicht als
            Schiene danebensteht), ⚖ trägt die Rechtsprechung.
            Ä87/Ä91 (H4-Nachzug 18.8.2026): das ✕ ist WEG — auf jeder Breite und
            in jeder Lage. Gemessen stand es @1440 bei offenem Blatt 47 px über
            dessen eigenem ✕ und machte @720 das fünfte Element aus einer Zeile,
            die vier trägt. Sein Ziel `/gesetze` steht links als beschriftetes
            Wort (Krume bzw. «‹ Gesetze»); Herleitung, Messreihe und die neue
            Auflage «höchstens ein ✕ je Kopfzeile» in `./kopfStufen`. Damit
            ergibt jede Stufe höchstens Ort · Erlass · Gliederung · Ansicht = vier. */}
        <div data-v3-kopf-griffe
          className={suchInZeile
            ? 'flex shrink-0 items-center gap-1 pl-2 sm:gap-1.5 sm:pl-3'
            : 'flex shrink-0 items-center gap-1 sm:gap-1.5'}>
          {panelOeffner}
          {gliederungKnopf}
          <LeserAnsichtV3 kompakt={stufe === 'mini'} fussnotenAnzahl={fussnotenAnzahl}
            hatAenderungsvermerke={hatAenderungsvermerke}
            bestimmungsWort={bestimmungsWort} modus={modus} onModusWahl={onModusWahl} />
        </div>
      </div>
      {/* Ä19: die Such-Zone als zweite Zeile DESSELBEN klebenden Blocks — nicht
          als eigenes `sticky`-Element darunter. Zwei gestapelte Sticky-Blöcke
          hätten zwei `top`-Werte, zwei z-Ebenen und zwischen sich den `mb-4`
          dieses Kopfes als durchscheinenden Spalt gebraucht. Ein Block, eine
          Kante, eine Höhe (`--leser-v3-kopf-block-h`).
          N4 (7.9.2026): steht die Zone IN der Zeile (oben), fällt diese zweite
          Reihe weg — sie wäre sonst zweimal im DOM. */}
      {!suchInZeile && suchZone}
    </div>
  );
}
