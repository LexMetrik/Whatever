import { useId, useRef, useState } from 'react';
import { useLeserSchriftskala as useSchriftskala } from '../leserSchrift';
import { usePopoverAutoZu } from './usePopoverAutoZu';
import { menueTastenFahrt } from './menueTasten';
import { kopfGriffKlassen } from './kopfStufen';
import { useLeserOptionen } from '../leserOptionen';
import { LeserAenderungsWahl } from './LeserAenderungsWahl';
import { LeserModusWahl } from './LeserModusWahl';
import type { LeserModus } from './einzelModus';
import { SchriftgroessenRegler } from '../../../components/ui/SchriftgroessenRegler';
import { MenueRegler, MenueTitel } from '../../../components/ui/Menue';

// ─── «Ansicht ▾» der V3-Kopfzeile (FAHRPLAN-LESER-V3 Kap. 4a/4f, H1) ─────────
//
// DREI Schalter, alle zweiwertig (Kap. 4f: 24 → 8 Kombinationen). Der Store
// darunter ist GETEILT mit V1 (FL-6, §5).
//
// S1 (Optionen-Rückbau): der dritte Historie-Modus («Chronologie») und der
// Verweise-Schalter sind nicht mehr bloss aus der V3-BEDIENUNG genommen, sondern
// im Store gestrichen. Die Abbildung `./v3Optionen` (`histZuSicht`/`sichtZuHist`/
// `histUmschalten`) ist damit ersatzlos entfallen — `histansicht` ist ein
// gewöhnliches zweiwertiges Feld, und alle drei Schalter laufen durch `schalte`.
//
// S1-NACHZUG B3 / D1 — ERLEDIGT im H3-Nachzug (17.8.2026): der Schalter
// «Änderungsvermerke» wird auch hier nur angeboten, wenn der Erlass Vermerke
// TRÄGT (§8). Die Bedingung ist NICHT nachgebaut — sie kommt als eine Prop
// `hatAenderungsvermerke` über `leserV3Modell.ts` → `LeserRahmenV3.tsx` →
// `LeserKopf.tsx` und wird dort mit `bieteAenderungsvermerkeSchalter` aus
// `../berechnungen` abgeleitet, DERSELBEN Funktion, die V1 seit S1 zieht (§5).
// Der Bau war bis zum Rebase auf den gelandeten S1-Stand blockiert: die drei
// Dateien lagen zugleich unter H2b und H3 (Drei-Wege-Konflikt, §0 Ziff. 5) und
// die Quelle stand erst mit PR #547 auf main.
//
// Was hier NICHT steht und bewusst nicht:
//  · Rechtsprechungs-Facetten (Instanz/Kanton/Zeit) — die ziehen in H3 ins
//    Panel, an den Ort ihres Ergebnisses (Kap. 4d). Bis dahin bleiben sie in
//    V3 unsichtbar; ihr Wert im Store wird weder gelesen noch geschrieben, die
//    Ist-Hülle findet ihn also unverändert vor.
//  · Ein Suchfeld — es lebt in der Seitenleiste (Kap. 4b).
//
// A11Y — bis 7.9.2026 ehrliche Disclosure, KEIN `role=menu` (R2/A4-Präzedenz):
// «verspräche Pfeiltasten-Navigation, die es hier nicht gibt» — richtig für den
// Stand bis `72b39d50c` (§2b). D4 (7.9.2026) löst das Versprechen ein statt das
// Bild zurückzubauen: gemessen `[role=menu]` 0, seither Rolle SAMT ↑/↓/Home/End
// (`./menueTasten`); Esc und Fokus-Rückgabe weiter aus `usePopoverAutoZu`.
// Wächter `e2e/leser-w224-g.e2e.ts`; Protokoll `abnahme/…/R6G-LESER.md`.
// ── Ä69 · DER `hinweis`-SLOT IST GESTRICHEN (17.8.2026) ──────────────────────
// Er trug genau EINEN Satz, den Ä27-Hinweis am Vermerke-Schalter, und der ist mit
// der Entkopplung (Ä68) entfallen — die Kreuz-Abhängigkeit, die er erklärte, gibt
// es nicht mehr. Damit hatte der Slot null Aufrufer. §17 in der Fassung vom
// 13.8.2026: was nichts mehr bedient, wird gestrichen statt bewacht (dieselbe
// Begründung wie bei `beiwerkSlot`/`panelOeffner`/`LeserV3Kontext`). Mit ihm
// fallen `useId`, `aria-describedby` und der Geschwister-`<p>`; tritt je wieder
// eine echte Abhängigkeit zwischen zwei Schaltern auf, steht die Anatomie samt
// ihrer Accessible-Name-Herleitung in der Historie.
// ── D5-NACHZUG (6.9.2026) · DIE HÜLLE IST JETZT GETEILT ─────────────────────
// Hier stand ein eigener `V3Switch` mit eigenem Klassen-String und einem
// Zustands-DOPPEL rechts («✓ an» / «○ aus»). Beides ist in den geteilten
// Baustein `components/ui/Menue` gewandert (dort die Herleitung samt Davids
// Befund): Zustand als EIN Häkchen LINKS, Fokus als Strich statt Kasten, Zeilen
// durch Haarlinien getrennt, keine Umbrüche.
// D35-F2: der Alias `V3Switch` hatte danach noch genau einen Aufrufer
// («Rechtsprechung im Kopf») und fällt mit ihm — die beiden verbliebenen
// Gruppen bauen ihre Zeilen in eigenen Dateien (`./LeserAenderungsWahl`,
// `./LeserRubrikenWahl`) und ziehen `MenueSchalter` dort direkt.

export function LeserAnsichtV3({ kompakt, fussnotenAnzahl, hatAenderungsvermerke, modus, onModusWahl }: {
  /** `true` = Handy-Zuschnitt: der Öffner zeigt «···» statt «Ansicht ▾»
   *  (Fahrplan Kap. 4a). Reine Beschriftung — der Accessible-Name bleibt in
   *  beiden Zuschnitten «Ansicht», und die Elemente des Panels sind identisch. */
  kompakt: boolean;
  fussnotenAnzahl: number | null;
  /**
   * D1 (S1-Rest, H3-Nachzug 17.8.2026) · Trägt dieser Erlass überhaupt
   * Änderungsvermerke? Nur dann wird der Schalter angeboten (§8).
   *
   * Der Wert kommt aus dem MODELL (`leserV3Modell.ts` → `LeserRahmenV3` →
   * `LeserKopf`), abgeleitet mit `bieteAenderungsvermerkeSchalter` aus
   * `../berechnungen` — DERSELBEN Funktion, die V1 seit S1 zieht (§5). Hier steht
   * keine eigene Bedingung: eine zweite Ableitung derselben Frage wäre eine
   * zweite Wahrheit, und sie liefe beim ersten Nachjustieren auseinander.
   */
  hatAenderungsvermerke: boolean;
  /** W2·5m · die geltende Lesart (Adresse vor Präferenz, `./useEinzelModus`).
   *  `undefined` = der Aufrufer bietet den Umschalter nicht an (sekundäres
   *  Pane, Kap. 15.6) — dann steht die Gruppe gar nicht erst da (§8: kein
   *  Schalter, der nichts tut). */
  modus?: LeserModus;
  onModusWahl?: (m: LeserModus) => void;
  /**
   * ── D35-F2 (7.9.2026) · HIER STAND `onPanelOeffnen` ───────────────────────
   * Die Prop reichte den Menü-Eintrag «Entscheide & Kontext …» herein (A2,
   * H3-Nachzug 17.8.2026: mit «Rechtsprechung: aus» gab es auf `mini` KEINEN
   * bedienbaren Weg mehr zum Panel; Ä92 18.8.2026: er erschien darum genau
   * dann, wenn kein Chip sichtbar war). Beide Befunde bleiben richtig für ihren
   * Stand (§0 Ziff. 2b) und sind mit D35-F2 gegenstandslos: der Kopf-Griff
   * «Erlass ▾» steht auf jeder Breite, ein zweiter Öffner wäre die Dopplung,
   * die Ä92 gerade beseitigt hat. Ersatzlos gestrichen, nicht bewacht.
   */
}) {
  const opt = useLeserOptionen();
  const schrift = useSchriftskala();
  const [offen, setOffen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // H3 · GETEILTES AUTO-ZU (§5). Bis H2 standen hier drei lokale Effekte:
  // Fokus-Falle/Esc (`useDialogFokus`), Aussenklick und Wisch-Geste (LM-009).
  // H3 bringt eine zweite aufziehbare Fläche — das Rechtsprechungs-Panel —, und
  // zwei Kopien derselben Bedien-Zusage laufen beim ersten Nachjustieren
  // auseinander. Die Mechanik liegt darum in `./usePopoverAutoZu`; die Herleitung
  // beider Effekte (samt LM-009) steht dort im Kopf, nicht mehr hier.
  usePopoverAutoZu({ offen, schliesse: () => setOffen(false), wrapRef, panelRef, modus: 'popover' });

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        // NUR im offenen Zustand (Bug-Check B3, 16.8.2026): `aria-controls`
        // zeigt im geschlossenen Zustand auf eine Id, die es im DOM gar nicht
        // gibt — das Panel wird bedingt gerendert. axe meldet das als
        // `aria-valid-attr-value` (kaputte Id-Referenz), und Screenreader
        // bieten einen Sprung an, der ins Leere führt (§8). `aria-expanded`
        // trägt die Zustandsauskunft ohnehin allein. Dasselbe Muster wie im
        // Header-Suchfeld (`aria-controls={zeigtPanel ? listboxId : undefined}`).
        aria-controls={offen ? panelId : undefined}
        aria-label="Ansicht"
        data-v3-ansicht
        // Ä90: EINE Bauform für alle Kopf-Griffe (`kopfStufen`), und die
        // Abstufung folgt dem gemessenen KOPF-Zuschnitt (`kompakt`), nicht
        // einem Viewport-Breakpoint — `sm:` hätte im Pane das Fenster gemessen
        // (Kap. 10, dieselbe Falle wie beim früheren `lg:` unten).
        className={`${kopfGriffKlassen(kompakt)} gap-1 px-1.5`}
        // D1: der Tooltip nennt nur, was das Panel wirklich trägt — sonst
        // versprach er auf vermerkfreien Erlassen einen Schalter, den es dort
        // nicht gibt (dieselbe §8-Sorge wie die Bedingung unten).
        // B2 (18.8.2026): derselbe Wortlaut wie am Schalter unten — der Tooltip
        // versprach «im Text», was V3 nicht einlöst (Herleitung dort).
        // ── Ä114 (18.8.2026) · EIN WORT FÜR EIN MENÜ ──────────────────────
        // GEMESSEN am Live-Stand hiess dieselbe Fläche viermal anders: Öffner
        // «Ansicht», `aria-label` des Panels «Darstellungsoptionen», Overline
        // «DARSTELLUNG», Tooltip «Darstellung: …». Ein Screenreader-Nutzer und
        // ein sehender Nutzer sprachen damit über zwei verschiedene Menüs.
        // Der Benennungs-Glossar (Design-Grundlage Kap. 9) setzt «Ansicht» —
        // das Wort, das am Öffner steht und das der Nutzer zuerst sieht.
        // «nur» wie im Gruppen-Namen und im sichtbaren Wort darunter (Entscheid
        // David 5B, 29.8.2026): der Öffner-Tooltip kündigt an, was das Menü
        // enthält — stünde hier «Grösse des Gesetzestexts» und drinnen «Nur
        // Gesetzestext», trüge dieselbe Sache im selben Menü zwei Namen, genau
        // der Ä114-Fehler eine Ebene tiefer.
        // D35-F3: der Öffner kündigt an, was drinsteht — und drin steht seit dem
        // Entscheid EINE Wahl, keine zwei Schalter. Trägt der Erlass keine
        // Vermerke, wird sie gar nicht angeboten, also nennt der Tooltip sie
        // dann auch nicht (dieselbe D1-Ehrlichkeit wie unten).
        // D35-F2: «Rechtsprechung» ist raus (der Schalter ist gefallen), die
        // Rubriken-Gruppe ist drin — der Tooltip zählt weiterhin genau die Gruppen auf,
        // die das Menü wirklich trägt (§8).
        // S6 W1f (24.9.2026): Rubriken-Wahl und Stellung «Fassung» sind gefallen.
        title={`Ansicht: ${hatAenderungsvermerke ? 'Fussnoten am Artikel · ' : ''}Grösse nur des Gesetzestexts`}
      >
        {/* ── Ä91 (H4-Nachzug 18.8.2026) · ZWEI GESICHTER, NICHT DREI ────────
            Gemessen 18.8.2026 trug dieser Öffner DREI verschiedene Gestalten:
            «···» auf `mini`, «◧ Ansicht ▾» ab 1024 px Fenster — und dazwischen,
            zwischen 640 und 1023 px, ein stummes «◧▾». Der dritte war keine
            Absicht, sondern die Folge eines `lg:`-Präfixes: es misst den
            VIEWPORT, während der ganze Kopf-Zuschnitt an der gemessenen
            Element-Breite hängt (Kap. 10). Im Pane hätte dasselbe Präfix ein
            «Ansicht» auch dort gezeigt, wo die Spalte 620 px misst.
            JETZT: das Wort hängt am Zuschnitt. Wo Platz ist («voll»/«kompakt»)
            steht «◧ Ansicht ▾», auf dem Handy «···» — kein drittes Gesicht.
            Der Accessible-Name bleibt in beiden Fällen «Ansicht». */}
        {/* G14 (7.9.2026): @390 stand hier «···», die dritte nackte Glyphe der
            Zeile. «Ansicht» steht jetzt auf JEDER Breite (Ä114), die zwei
            Gesichter von Ä91 bleiben zwei: mit ◧ und ohne; ▾ bleibt, es zeigt
            kein Ding. Messreihe `./LeserPanelOeffner`. */}
        {kompakt
          ? <><span className="whitespace-nowrap">Ansicht</span><span aria-hidden className={`transition-transform ${offen ? 'rotate-180' : ''}`}>▾</span></>
          : <><span aria-hidden>◧</span><span>Ansicht</span><span aria-hidden className={`transition-transform ${offen ? 'rotate-180' : ''}`}>▾</span></>}
      </button>

      {/* ── D41 (David 7.9.2026) · HIER STAND DIE ABDUNKELUNG DES MENÜS ──────
          AUFGEHOBEN, nicht verschoben: B7-N1/LM-015 hat dem «Ansicht ▾»-Menü am
          8.8.2026 einen Vollflächen-Scrim gegeben (`./LeserScrim`, mit der Datei
          entfallen). Der Befund von damals — «kein Scrim im DOM», 240 × 199 px
          auf deckendem `paper-raised` — bleibt als Messung gültig; falsch war die
          daraus gezogene FOLGERUNG.
          Gemessen 7.9.2026 @1440 (Melder David, «wird uneinheitlich abgedunkelt»):
          über dem Scrim (z 16) liegen VIER Balken mit DREI Breiten — Topbar
          (z 30, 1440 px), Reiterleiste (z 20, 1440), `InhaltsKopf` (z 19, 1440)
          und der Leser-Kopf `[data-v3-kopf]` (z 17, nur **1080** px). Δ Leuchtdichte
          im Kopf-Band y 120–135: x 0–160 −74.9 · x 200–1160 **0.0** · x 1280–1400
          −74.9. Ergebnis ist ein 1080 × 57 px helles Fenster mit zwei harten
          Kanten, das beim Scrollen mitwandert. Ein vollflächiger Scrim unter einem
          NICHT vollflächigen Kopf kann gar nicht einheitlich aussehen — der Mangel
          war die Bauart, keine Regression.
          Ein Dropdown auf deckendem Grund braucht keine Abdunklung (Browser-Norm);
          die Wege hinaus trägt `usePopoverAutoZu` im Modus `popover` selbst —
          gemessen bei entferntem Scrim-Knoten: Aussenklick 1 → 0, Escape 1 → 0.
          Mit der Fläche entfällt allein die Zusage «Klick auf die Abdunklung
          schliesst». Ä52 (Beiwerk-Panel ohne Scrim) bleibt unberührt und wird in
          `e2e/leser-v3-scrim-b7n1.e2e.ts` jetzt AUCH bei offenem Menü gemessen. */}

      {offen && (
        <div
          ref={panelRef}
          tabIndex={-1}
          onKeyDown={menueTastenFahrt}  /* D4, s. `./menueTasten` */
          data-v3-ansicht-panel
          /* D5: 15 rem war die Breite, in der «Rechtsprechung im Kopf» und «Nur
             Gesetzestext» umbrachen (Davids Befund «letzter Eintrag zweizeilig
             umgebrochen»). 17 rem trägt beide einzeilig; die Zeilen kappen
             notfalls mit Auslassung (`.lc-menu-zeile`), sie brechen nicht.
             `gap`/`p` fallen weg: die Trennung tragen jetzt die Haarlinien der
             Zeilen, nicht Zwischenräume. */
          className="lc-schwebeflaeche absolute right-0 top-full z-overlay mt-1.5 flex w-[19rem] max-w-[calc(100vw-2rem)] flex-col py-1"
        >
          {/* Ä114: dasselbe Wort wie am Öffner und im `aria-label` — der
              Glossar-Eintrag «Menü der Darstellungsschalter → Ansicht». */}
          <MenueTitel>Ansicht</MenueTitel>
          {/* D4 · DIE ROLLE SITZT INNEN: auf der ganzen Fläche meldete axe
              critical `aria-required-children` («span[aria-live]» = die
              Prozent-Anzeige des Reglers). PREIS (§8): «Entscheide & Kontext …»
              steht seither ÜBER dem Steller. `aria-controls` des Öffners zeigt
              auf DIESEN Block — er trägt Rolle und Namen (A4-Sonde). */}
          {/* D35-F4: `lc-menu-gruppe` statt `flex flex-col` — die Klasse IST
              das Rezept (Trennlinie zur nächsten Gruppe, Spaltenfluss); die
              Rolle und der Name bleiben Wort für Wort, wo sie standen. */}
          <div id={panelId} role="menu" aria-label="Ansicht" data-v3-ansicht-menue className="lc-menu-gruppe">
          {/* ── W2·5m (D-E3, David 14.9.2026) · DIE LESART ZUOBERST ──────────
              «man kann im ansichtsmenu wählen ob man das ganze gesetz sieht
              oder nur den jeweils einzelnen artikel». Sie steht vor den beiden
              anderen Gruppen, weil sie deren Rahmen ist: im Einzelmodus werden
              aus den Rubriken der Zeile die Blöcke unter dem Artikel
              (`./LeserModusWahl`, Kap. 15.3/15.5). */}
          {modus && onModusWahl && (
            <LeserModusWahl wahl={modus} onWahl={onModusWahl} />
          )}
          {/* ── D35-F3 (Entscheid David 7.9.2026) · EINE WAHL STATT ZWEIER SCHALTER
              Hier standen «Fussnoten» (amtlicher Apparat samt Markern, alle
              Klassen — Ä68) und «Fassung» (nur der abgeleitete Slot «Gilt seit …»
              — Ä116) als zwei unabhängige `menuitemcheckbox`. Beide Historien
              bleiben, wo sie stehen (`src/index.css` am Regelblock, §0 Ziff. 2b);
              gemessen waren die vier Kombinationen alle erreichbar, und genau
              das war Davids Befund: «es soll entweder fassung oder fussnoten
              angezeigt werden. also entweder fassung, fussnoten oder aus.»
              Die Radiogruppe samt Verlustfreiheits-Herleitung, A26-Zähler und
              §8-Hinweis für unklassifizierte Erlasse steht in
              `./LeserAenderungsWahl` (eigene Datei: diese hier stand bei 418 der
              420 zulässigen Zeilen, Fundament-Sonde §6.6).
              D1 UNVERÄNDERT: angeboten wird die Wahl nur, wenn der Erlass
              Änderungsvermerke TRÄGT. Sonst gäbe es nichts zu wählen — die
              Fassungs-Zeile fehlt, und `kl:'A'` gibt es nicht; drei Stellungen
              mit identischer Wirkung wären der §8-Fall, den D1 gerade behebt.
              Der Wert im geteilten Store bleibt dabei unberührt: nicht angeboten
              heisst nicht zurückgesetzt (`leser-v3-umschalten` (a3)). */}
          {hatAenderungsvermerke && (
            <LeserAenderungsWahl wahl={opt.vermerke} fussnotenAnzahl={fussnotenAnzahl} />
          )}
          {/* ── D35-F2 (Entscheid David 7.9.2026) · HIER STAND DIE GRUPPE
                 «RECHTSPRECHUNG» ─────────────────────────────────────────────
              Sie trug zwei Zeilen, und beide sind ersatzlos gefallen:

              (1) Der Schalter «Rechtsprechung im Kopf» (Ä115/Ä128, Wirkung
                  gemessen 18.8.2026: `[data-v3-panel-zaehler]` 1 → 0). Er nahm
                  den Kopf-ZÄHLER weg. Den Zähler gibt es seit Variante A nicht
                  mehr — der Kopf-Griff heisst «Erlass ▾» und trägt keine
                  Artikel-Zahl (`./LeserPanelOeffner`). Ein Schalter, der etwas
                  verbirgt, das niemand mehr sieht, ist ein Wächter ohne
                  Gegenstand (§17-Gegengewicht: gestrichen statt bewacht).
                  Und er hatte einen zweiten, gemessenen Mangel: mit «aus»
                  versprach die Zeile am Artikel weiter «11 Entscheide» und
                  zeigte beim Aufklappen nichts (M-6 der D35-Untersuchung,
                  7.9.2026) — mit dem Wegfall ist auch dieser Widerspruch weg.

              (2) Der Eintrag «Entscheide & Kontext …» (A2/Ä92). Er war der Weg
                  zum Blatt für GENAU DIE LAGE, in der (1) den Griff wegnahm
                  («ein Öffner je Breite», Fahrplan Kap. 7). Diese Lage gibt es
                  nicht mehr, also gibt es den zweiten Öffner nicht mehr. Der
                  Griff steht auf jeder Breite; die Taste «r» bleibt unberührt.

              Beide Herleitungen samt Messreihen bleiben in der Historie dieser
              Datei und in `./panelModell` stehen (§0 Ziff. 2b). An ihre Stelle
              tritt keine Rechtsprechungs-Gruppe, sondern die Rubriken-Wahl —
              eine andere Frage («was steht am ARTIKEL?»), darum ein eigener
              Baustein mit eigenem Gruppenkopf. */}
          {/* S6 W1f (Entscheid David 24.9.2026): HIER STAND die Rubriken-Wahl
              (`./LeserRubrikenWahl`, D35-F2). Mit der Funktionszeile fiel ihr
              Gegenstand — gestrichen statt bewacht (§17-Gegengewicht). */}
          </div>

          {/* ── Schriftgrösse ────────────────────────────────────────────────
              H2 · DEKLARIERTE UMKEHR DER H1-ABWEICHUNG A-1 (David 16.8.2026).
              H1 bediente hier bewusst den GLOBALEN Skala-Store
              (`lexmetrik-schriftskala`) — mit der Begründung, ein zweiter
              Speicher für dieselbe Frage wäre eine zweite Wahrheit (§5).
              Davids Befund am gebauten Stand widerlegt die Prämisse: es ist
              NICHT dieselbe Frage. «Wie gross ist die App» und «wie gross ist
              der Gesetzestext, den ich gerade lese» sind zwei Fragen, und der
              globale Regler beantwortete beide zugleich — gemessen skalierte
              er mit dem Normtext auch Kopfzeile und Seitenleiste mit (StPO/V3,
              3× A+: `<html>` 16 → 20.8 px, Kopfzeile 16 → 20.8 px).
              Neu: vier Stufen im GETEILTEN Leser-Store `lm.leser.optionen`
              (Feld `schrift`, V1 und V3 dieselbe Quelle), wirksam nur auf dem
              Lesekörper. Der globale App-Regler bleibt unberührt.
              TREUE-GRENZE gehalten: die Vorgabestufe emittiert gar keine
              Deklaration (`:not()` im Selektor), der Normtext bleibt exakt
              1.125 rem — der Pixelvergleich PX läuft mit der Änderung 4/4 grün. */}
          {/* ── Ä9 (H2b) · ZWEI STELLER, ZWEI NAMEN ──────────────────────────
              BEFUND, gemessen 17.8.2026 @1440 im Leser: ZWEI Regler mit
              `role="group"` und dem IDENTISCHEN Namen «Schriftgrösse» —
              einer in der Topbar (global, `useSchriftskala`), einer hier. Beide
              zeigten «A− 100 % A+». Der Nutzer konnte nicht wissen, welcher was
              tut; ein Screenreader las zweimal dasselbe.
              WAS H2 SCHON GELÖST HAT: die Stellen sind nicht mehr dieselbe Frage
              — der globale skaliert die ganze Anwendung (WCAG 1.4.4), dieser nur
              den Normtext (`leserSchrift.ts`). Es blieb ein BENENNUNGS-Fehler.
              WARUM DER GLOBALE REGLER IM LESER NICHT VERSCHWINDET (Entscheid
              H2b, im Vollzugsvermerk deklariert): ihn im Leser auszublenden hätte
              genau zwei Wege — (a) an einen Leser-Pfad gebunden: dann verliert die
              EINGEFRORENE Ist-Hülle ihren einzigen Schriftregler, denn sie hat
              keinen eigenen (FL-4-Bruch); (b) an das V3-Flag gebunden: dann wüsste
              die App-Topbar vom Flag, dessen Schaltpunkt ausdrücklich die eine
              Fassade ist (FL-1). Beide Wege kosten mehr, als der Befund wiegt.
              Behoben wird darum die Ursache der Verwechslung: dieser Regler sagt,
              WAS er vergrössert. «Im Leser nur EIN Regler für den Gesetzestext»
              ist damit erfüllt; der zweite ist ein anderes Werkzeug mit anderem
              Namen. Ob der App-Regler im Leser dennoch weichen soll, entscheidet
              David (Vollzugsvermerk, offener Punkt). */}
          {/* ── ENTSCHEID DAVID 5B (29.8.2026) · «NUR» IST DAS TRAGENDE WORT ──
              Ä9 (oben) hat diesem Regler bereits einen eigenen Namen gegeben —
              «Gesetzestext» hier, «Schriftgrösse» dort. Das reichte nicht: der
              App-Regler in der Topbar trug gar keinen SICHTBAREN Scope, also
              stand «Gesetzestext» neben einem namenlosen Zwilling und las sich
              als Beschriftung DESSELBEN Werkzeugs (Design-Review C4, erneut
              gemessen 29.8.2026: beide gleichzeitig auf 120 % / 118 %). Seit
              David 5B tragen BEIDE ihren Scope sichtbar: «Ganze Seite» in
              `components/layout/Topbar.tsx`, «Nur Gesetzestext» hier. Das «Nur»
              ist kein Füllwort — es ist die Abgrenzung, die den Unterschied ohne
              Screenreader lesbar macht (§8). */}
          {/* D5: eigene Zeile mit Label statt neben eine umbrechende
              Beschriftung gequetscht — die Anatomie steht im geteilten
              `MenueRegler`, der Wortlaut bleibt (Entscheid David 5B: «Nur»
              ist das tragende Wort). */}
          <MenueRegler label="Nur Gesetzestext" ariaLabel="Grösse nur des Gesetzestexts">
            <SchriftgroessenRegler
              schrift={schrift}
              kleinerLabel="Gesetzestext verkleinern"
              kleinerTitle="Gesetzestext verkleinern — die Anwendung bleibt gleich gross"
              /* D4: KEIN `role="menuitem"` — der Regler liegt ausserhalb des
                 Menüs (oben), ein Eintrag ohne Menü wäre `aria-required-parent`. */
              kleinerAttrs={{ 'data-v3-schrift': 'kleiner' }}
              groesserLabel="Gesetzestext vergrössern"
              groesserTitle="Gesetzestext vergrössern — die Anwendung bleibt gleich gross"
              groesserAttrs={{ 'data-v3-schrift': 'groesser' }}
            />
          </MenueRegler>

        </div>
      )}
    </div>
  );
}
