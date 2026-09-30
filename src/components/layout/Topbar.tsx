import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LexMetrikSiegel, LexMetrikWortmarke } from './Logo';
import { HeaderSuche } from './HeaderSuche';
import { SprachUmschalter } from '../SprachUmschalter';
import { ThemaUmschalter } from './ThemaUmschalter';
import { VerlaufUebersicht } from './VerlaufUebersicht';
import { KorpusStand } from '../ui/KorpusStand';

// ─── Titelblatt-Zeile der Sammlung (W2·24-DESIGN-IDENTITAET R2) ─────────────
//
// Der Kopf eines gedruckten Bandes: Marke links, Suche in der Mitte, Werkzeuge
// rechts. Darunter die Arbeitsleiste mit den offenen Reitern (`Reiterleiste`)
// und die Ausgabe-Zeile (`AusgabeZeile`, unten).
//
// ── D17 (David 6.9.2026) · DIE BEREICHE STEHEN IN DER SEITENLEISTE, NICHT HIER ─
// Wortlaut: «ich mochte die seitenleiste. können wir die behalten. und das oben
// entfernen?» R2 hatte die fünf Bereiche zusätzlich als Reiter ins Titelblatt
// gestellt und die Seitenleiste dafür auf «/» weggenommen — beides ist mit
// diesem Schritt zurückgenommen. EINE Landkarte (§5): die Seitenleiste. Sie
// steht seither auf JEDER Route, auch auf «/», und trägt allein die Aktivmarke
// der Domäne (Registerfarbe am Eintrag, `Sidebar.tsx`). Das Titelblatt trägt
// nur noch, was keine Navigationsliste ist: Marke (Startseiten-Link) · Suche ·
// Werkzeuge.
//
// ── D18 (David 6.9.2026) · EINE SUCHE, UND ZWAR DIESE ─────────────────────────
// Wortlaut: «insgesamt braucht es auf der startseite keine suche. nur oben
// reicht». Bis hierher trug «/» eine eigene, grosse Hero-Suche und der Streifen
// dort KEIN Feld (`!aufStartseite`-Guard, W2·23 §6.1). Der Guard ist weg: die
// Kopf-Suche steht auf jeder Route, auch auf «/». Damit gibt es genau ein
// Suchfeld in der App, «/» und ⌘K zielen immer darauf, und die Umleitung, die
// die Kürzel auf ein Seitenfeld schob (`useSuchKuerzelUmleitung`), ist ersatzlos
// entfallen — sie hatte nur einen Fall zu bedienen, und den gibt es nicht mehr
// (§17-Gegengewicht: was nicht scheitern kann, wird gestrichen).
//
// ── WARUM NUR DIESE ZEILE KLEBT (gemessen, nicht gewählt) ──────────────────
// `pages/gesetz-leser/v3/leserGeometrie.ts` führt die Höhe dieses Kopfes als
// Konstante `APP_TOPBAR_H = '4rem'` und rechnet daraus BEIDE Sprung-Offsets des
// Lesers (`--leser-v3-kopf-top`, `--nt-stick`). Die Datei gehört Runde R4 und
// ist in R2 TABU. Würde die Titelblatt-Zeile mit Ausgabe-Zeile und Arbeitsleiste
// auf ~7 rem wachsen, klebte der Leser-Kopf weiter auf 4 rem — also UNTER der
// Arbeitsleiste — und jeder `#art-…`-Anker landete um die Differenz zu hoch.
// Darum bleibt genau diese Zeile `sticky top-0` und exakt `h-16`; die zwei
// neuen Zeilen laufen im normalen Fluss mit. Sie scrollen damit weg — der Preis
// ist bewusst und steht als R4-Punkt in der Rückgabe (dort wird aus der
// Konstante ein geteiltes Token, dann kann die Arbeitsleiste kleben).
//
// `lc-glass` bleibt am header-Element: die Druckregel hängt an `header.lc-glass`
// (`src/index.css` @media print, `src/tests/druck-fundstellen.test.ts`), und
// die Klasse ist seit R1 leer bis auf `background: var(--paper)`.
export function Topbar({ onMenu, schubladeOffen, seitenleisteEingeklappt, onSeitenleisteUmschalten }: {
  onMenu: () => void;
  /** Ob die Off-Canvas-Schublade offen ist — nur dann existiert ihr DOM-Ziel. */
  schubladeOffen: boolean;
  seitenleisteEingeklappt: boolean;
  onSeitenleisteUmschalten: () => void;
}) {
  // S6 — mobiler Such-Fokusmodus: solange die Suche auf schmalem Schirm offen
  // ist, weichen Menü-Schalter, Logo und die Werkzeug-Knöpfe, damit das Feld die
  // volle Streifenbreite bekommt (getippte Query bleibt lesbar). HeaderSuche
  // meldet den Zustand; sie setzt ihn nur mobil (Desktop bleibt unberührt).
  const [sucheBreit, setSucheBreit] = useState(false);
  // Eine Klasse, drei Fundorte — `hidden` statt Unmount: die Knöpfe behalten
  // ihren Zustand (Verlauf-Panel) und der Streifen springt nicht.
  const weicht = sucheBreit ? 'hidden' : '';
  // Fokus-Ziel beim Verlassen des Fokusmodus: der ☰-Schalter ist das erste
  // Bedienelement des Streifens und mobil immer da — die Tastatur landet damit
  // am Anfang derselben Zone statt auf <body>.
  const menuKnopf = useRef<HTMLButtonElement>(null);
  // Der Wunsch wird im ✕-Klick gemeldet, ausgeführt wird er erst NACH dem
  // Re-Render: solange der Fokusmodus läuft, trägt der Schalter `hidden` und ein
  // display:none-Element nimmt keinen Fokus an. Der Effekt feuert genau auf der
  // Flanke «Fokusmodus endet» — nicht beim Verlassen über einen Treffer (dort
  // wird kein Wunsch gesetzt und die Navigation behält ihren eigenen Fokus).
  const fokusWunsch = useRef(false);
  useEffect(() => {
    if (sucheBreit || !fokusWunsch.current) return;
    fokusWunsch.current = false;
    menuKnopf.current?.focus();
  }, [sucheBreit]);
  // ── D23-NACHZUG (David 6.9.2026) · DAS TITELBLATT TRÄGT DAS SUCH-PANEL ──
  // GEMESSEN am Stand vor diesem Fix (Preview @1440, `/gesetze`, offener
  // Leerzustand): das Etikett «Zuletzt geöffnet» war UNSICHTBAR — die
  // Reiterleiste malte über die obersten ~45 px des Panels. Ursache ist
  // kein Fehler am Panel: die Kopfzeile und `nav[aria-label="Offene Reiter"]`
  // tragen BEIDE `z-leiste` (20) und sind Geschwister; bei gleichem
  // z-index gewinnt das spätere DOM-Element, und weil der Header mit
  // seinem z-index einen eigenen Stapelkontext aufmacht, kommt sein Kind
  // (`z-dropdown` = 30) daran nicht vorbei — 30 gilt nur INNERHALB des
  // Headers.
  // `z-dropdown` am Header hebt den ganzen Kontext eine Stufe an. Das ist
  // geometrisch folgenlos FÜR DEN HEADER: er überlappt in Ruhe NICHTS (die
  // Reiterleiste klebt bei `top: var(--app-krone-h)`, also exakt unter
  // ihm). Nicht jede Schicht darunter ist frei von Überdeckung: `InhaltsKopf`
  // (z 19, `sticky top-16`) klebt an derselben Kante wie die Arbeitsleiste
  // (z 20) und liegt beim Scrollen HINTER ihr — gemessen 30.9.2026 (/rechner/
  // tagerechner, 1280, gescrollt): Arbeitsleiste 64–98 px, Inhaltskopf 64–101 px,
  // nur die untersten 3 px ragen vor; das Sticky ist dort faktisch tot (offener
  // David-Entscheid, Posten «InhaltsKopf.tsx:163 sticky top-16 … hinter der
  // Arbeitsleiste»). Die Leser-Sticky-Leisten (z 15–17) liegen in der Schichtung unter dem Inhaltskopf. Die
  // EINZIGE Änderung hier ist die gewollte: was aus dem Header herausragt —
  // das Such-Panel, das Sprach- und das Thema-Menü — liegt jetzt über der
  // Reiterleiste statt darunter. Die Reiterleiste selbst bleibt
  // unangetastet (sie gehört R11).
  // Schichtungs-Skala und Werte: `index.css`, Block `--z-*`.
  return (
    <header className="sticky top-0 z-dropdown lc-glass">
      {/* Die 2-px-Kante sitzt AM INNEREN Träger, nicht am <header>: mit
          `box-sizing: border-box` liegt sie damit INNERHALB der `h-16` und die
          klebende Krone misst exakt 4 rem = 64 px. Gemessen 6.9.2026 im
          Preview: mit `border-b-2` am <header> waren es 66 px — zwei Pixel mehr
          als `APP_TOPBAR_H` in `leserGeometrie.ts` annimmt, und der klebende
          Leser-Kopf sässe um genau diese zwei Pixel falsch. */}
      <div className="lc-topbar-zeile px-4 sm:px-6 h-16 border-b-2 border-rule flex items-center gap-3 sm:gap-5">
        {/* ── GB-15 (W2·24, Befund G15, 7.9.2026) · EINE KNOPF-FORM ───────────
            GEMESSEN @390, hell und dunkel: in EINER Zeile standen drei Formen —
            ☰ ohne Kasten (`lc-btn-ghost`), 🔍/◐/«DE ▾» mit 1-px-Rahmen UND
            Füllung (`border-line bg-surface`), § als schwarze Fläche. F0.6
            («Linien statt Flächen») und F0.9 (Bedien-Griffe als Textknopf).
            Alle Griffe des Streifens tragen ab hier `lc-topbar-griff`
            (index.css §GB-15): 44-px-Tap-Fläche unverändert, kein Rahmen,
            keine Füllung, Zustand über Tinte und Unterstrich.
            AUSGENOMMEN das Siegel (§): es ist die MARKE, kein Knopf — das
            Referenzbild `vorschlag-freigegeben.html` trägt es so. */}
        {/* Mobil: Schublade öffnen — auf Desktop trägt die persistente Leiste. */}
        <button
          type="button"
          ref={menuKnopf}
          className={`lc-topbar-griff lg:hidden shrink-0 ${weicht}`}
          aria-label="Navigation öffnen"
          aria-expanded={schubladeOffen}
          // aria-controls nur bei offener Schublade: die Ziel-ID existiert erst
          // dann im DOM — axe wertet den Dauer-Verweis als critical
          // (aria-valid-attr-value; Bug-Check Mobile-Kopf 29.8.2026).
          aria-controls={schubladeOffen ? 'seitenleisten-schublade' : undefined}
          onClick={onMenu}
        >
          <span aria-hidden className="text-base leading-none">☰</span>
        </button>

        {/* Desktop: persistente Seitenleiste ein-/ausklappen. D17: sie steht
            jetzt auf JEDER Route (auch auf «/»), also gibt es hier auch überall
            etwas zu schalten — die frühere `ohneSeitenleiste`-Ausnahme ist mit
            der Ausnahme selbst entfallen. */}
        <button
          type="button"
          className="lc-topbar-griff hidden lg:inline-flex shrink-0"
          // WCAG 4.1.2 · konstanter zugänglicher Name (QS-UI Folgeschritt, 5.9.2026):
          // der Name benennt konstant das bediente Ding, den Zustand trägt allein
          // `aria-pressed` (gedrückt = Leiste ist eingeblendet). Bewacht von
          // `ARIA_ZUSTANDSNAME` (eslint.config.js).
          aria-label="Seitenleiste ein- und ausblenden"
          aria-pressed={!seitenleisteEingeklappt}
          onClick={onSeitenleisteUmschalten}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.7" />
            <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.7" />
            {seitenleisteEingeklappt && <line x1="5.5" y1="9" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}
          </svg>
        </button>

        {/* Marke. Anders als vor R2 steht sie AUF JEDER BREITE im Titelblatt —
            der Kopf ist jetzt das Titelblatt der Sammlung, und ein Titelblatt
            ohne Titel gibt es nicht.
            ── C2 (Design-Review 29.8.2026) · UNTER 480 px WICH SIE GANZ. Gemessen
            @320 im warmen Zustand: der Streifen brauchte 332 px in einem
            320-px-Fenster; acht Bedienelemente à 44 px passen dort nicht
            nebeneinander, also trug die Schublade die Marke allein.
            ── F7 (Prüfbefund 6.9.2026) · DAS SIEGEL BLEIBT, DIE WORTMARKE GEHT.
            Ein Titelblatt ohne Titel ist keines: @390 stand der Kopf ohne jedes
            Zeichen der Herkunft. Zurück kommt darum NICHT die volle Marke,
            sondern das §-Siegel allein — 28 px statt der ~130 px, an denen C2
            gescheitert war; die Wortmarke bleibt ab `sm`. Die Schublade zeigt
            weiterhin die volle Marke (`Sidebar.tsx`), jetzt als Ergänzung, nicht
            als Ersatz. Bewacht von `e2e/topbar-kein-ueberlauf-320.e2e.ts`. */}
        <Link to="/" className={`inline-flex items-center gap-2 no-underline shrink-0 min-h-11 px-1 ${weicht}`} aria-label="LexMetrik – Startseite">
          <LexMetrikSiegel size={28} />
          {/* Wortmarke ab sm — auf schmalen Schirmen trägt die Suche die Mitte.
              W2·31 H (30.9.2026): zusätzlich nur, wenn der Streifen sie TRÄGT
              (`.lc-topbar-wortmarke`, index.css): unter Schriftskala ≥ 1.2
              passte der Streifen zwischen 640 px und ~35 rem Streifenbreite
              nicht mehr (Sprache-Griff ragte bis 88 px über den Rand → Quer-
              scroll auf JEDER Seite); das Siegel bleibt, wie unter 640 px (F7). */}
          <LexMetrikWortmarke className="lc-topbar-wortmarke text-h3" />
        </Link>

        {/* Die Suche des Hauses — auf JEDER Route dieselbe (D18). Die Hülle ist
            der `flex-1`-Dehnungsraum des Streifens; sie bleibt auch dann
            stehen, wenn das Feld unter 480 px zur Lupe zusammenklappt, damit
            die Werkzeuge rechts nie springen (§6.1). */}
        {/* ── D9-NACHZUG (6.9.2026) · DAS FELD HAT EINEN BODEN ────────────────
            GEMESSEN am Stand `0834cbd7b` (`/gesetze`, Preview): das Feld war
            @1024 genau 56 px breit und @1280 200 px — es ist `flex-1 min-w-0`
            und gab den Bereichs-Reitern so lange nach, bis nur noch der
            ⌘K-Hinweis hineinpasste. Ein 56-px-Suchfeld im Titelblatt ist keine
            kleine Suche, sondern keine (dieselbe Einsicht wie C1/B10/L3 unter
            480 px). Der Boden von 9 rem gilt erst AB 481 px: darunter weicht
            das Feld ohnehin der Lupe, und ein Mindestmass an der Hülle hätte
            @320 den Streifen überlaufen lassen (`e2e/topbar-kein-ueberlauf-320`).
            Den Platz nahmen bis D17 die Bereichs-Reiter; seit sie entfallen sind,
            teilt sich das Feld die Zeile nur noch mit Marke und Werkzeugen —
            der Boden bleibt trotzdem stehen, er ist die Untergrenze für ein
            Feld, das man als Feld erkennt. */}
        {/* ── D23-NACHZUG (David 6.9.2026) · UNTER 640 px KEIN DECKEL ────────
            D23 verlangt «@390 Feld und Panel volle Breite» — und seit D23 ist
            die Panelbreite die FELDbreite (`HeaderSuche`, `inset-x-0`), also
            entscheidet dieser Deckel beide zugleich. GEMESSEN @390 (Preview,
            gebauter Stand): das Feld war 320 px breit in einem 390-px-Streifen,
            weil `max-w-xs` auch dort griff — der mobile Fokusmodus (S6) hatte
            damit nie die «volle Streifenbreite», die er zusagt, und der
            Platzhalter brauchte 282 px auf 276 px Platz (gekappt).
            `sm:max-w-xs`: ab 640 px bleibt alles, wie es war (Deckel 20 rem,
            ab xl 24 rem — der Streifen soll oberhalb nicht zur Suchleiste
            werden); darunter nimmt das Feld den Platz, den der Streifen ihm
            ohnehin lässt. `min-w-0` bleibt der Schutz gegen Überlauf @320
            (`e2e/topbar-kein-ueberlauf-320.e2e.ts`). */}
        {/* W2·31 P3 (30.9.2026): der Boden steht jetzt als `.lc-topbar-suche` (index.css)
            — er gilt ab 481 px UND nur, wo der Streifen ihn trägt (Containerabfrage, wächst
            mit der Schriftskala). Skala 1.4 @481–496 ragte der Streifen mit dem festen
            `min-w-[9rem]` bis 16.1 px ins Polster; jetzt schrumpft das Feld dort um ≤ 0.8 rem.
            Darunter (< 481 px) weiter kein Boden, wie bisher. */}
        <div className="flex-1 min-w-0 lc-topbar-suche sm:max-w-xs xl:max-w-sm">
          <HeaderSuche onFokusModus={setSucheBreit} onFokusZurueck={() => { fokusWunsch.current = true; }} />
        </div>

        {/* `ml-auto`: die Werkzeuge stehen IMMER an der rechten Kante. Ohne sie
            sammelt sich der Restplatz hinter ihnen, sobald der `max-w-xs`-Deckel
            des Suchfeldes greift — GEMESSEN 6.9.2026 @1280: der Farbschema-Knopf
            stand auf «/» 93 px weiter links als auf `/gesetze` (die Startseite
            trägt weder Feld noch Seitenleisten-Schalter). Genau diesen Sprung
            verbietet §6.1 («Layout darf nicht springen»), bewacht von
            `e2e/w223b-kopf-seitenleiste.e2e.ts`. */}
        <div className={`ml-auto shrink-0 flex items-center gap-1.5 sm:gap-2 ${weicht}`}>
          {/* A5 (David 5.7.2026): kein eigener Palette-Knopf mehr — die
              HeaderSuche trägt den Norm-Sprung selbst.
              R2: der frühere ☰-Reiter-Trigger (`ReiterUebersicht`) ist ersatzlos
              weg — die offenen Reiter stehen jetzt sichtbar in der Arbeitsleiste
              (`Reiterleiste`), ihr Überlauf-Knopf «+N» trägt dieselbe Liste
              (`TabPanel`) samt Suche. Ein zweiter Zugang zum selben Panel wäre
              die Dopplung, die David abgeschafft haben wollte.
              ── C2 · DER VERLAUF-TRIGGER WEICHT UNTER 480 px: er ist der einzige
              Werkzeug-Knopf mit einem ZWEITEN Zugang (der leere Suchzustand
              speist sich aus derselben Quelle `useZuletzt`). */}
          {/* W2·31 L (30.9.2026): `.lc-topbar-verlauf` (index.css) = das frühere
              `max-[480px]:hidden` PLUS eine Streifenbreiten-Bedingung (Containerabfrage,
              wächst mit der Schriftskala). Skala 1.4 + Verlauf: der Streifen lief von 481
              bis 567 px über (+64 scrollWidth @481, +47 px ins Polster @520, +7 px @560).
              NACHZUG W2·31 P3 (30.9.2026): die Streifenbreiten-Bedingung ist nicht mehr eine
              feste Schwelle (25.5 rem, auf Skala 1.0 geeicht), sondern der gemessene Bedarf je
              Schrift (`calc(18.1rem + 124px)`, Herleitung in index.css) — der Knopf fehlt nur
              noch, wo er den Streifen sprengte. Unter 481 px bleibt er weg (C2); dort und wo
              er fehlt, trägt «Verlauf leeren» der Such-Leerzustand (`SucheLeerzustand`). */}
          <div className="lc-topbar-verlauf"><VerlaufUebersicht /></div>
          <ThemaUmschalter />
          <SprachUmschalter />
        </div>
      </div>
    </header>
  );
}

// ─── Ausgabe-Zeile (Referenzbild `.edition`) ────────────────────────────────
//
// Die dünne Zeile unter dem Titelblatt, die sagt, WELCHE AUSGABE man vor sich
// hat: «Register erzeugt: Gesetze 5.9.2026 · …». Der Inhalt kommt unverändert
// aus dem bestehenden Baustein `ui/KorpusStand` — derselbe Satz, den die
// Seitenleiste im Fuss führt (§5: ein Baustein, mehrere Konsumenten; §8: der
// Baustein sagt «Register erzeugt», nicht «Stand der Rechtsprechung»).
//
// NICHT klebend (Begründung oben am Kopf) und `print:hidden`: im Ausdruck
// trägt die Fundstelle ihren eigenen Stand, eine Bildschirm-Ausgabezeile
// gehörte dort nicht hin.
export function AusgabeZeile() {
  return (
    // Unter `sm` weggelassen: die Zeile braucht dort zwei Zeilen Höhe für eine
    // Angabe, die auf dem Telefon niemand sucht — und sie ist nicht verloren,
    // die Schublade führt DENSELBEN Baustein in ihrem Fuss (bewacht von
    // `e2e/w223b-kopf-seitenleiste.e2e.ts` §6.3 @390).
    <div className="hidden sm:block print:hidden shrink-0 border-b border-rule-soft bg-paper">
      <div className="px-4 sm:px-6 py-1.5 flex justify-end">
        <KorpusStand />
      </div>
    </div>
  );
}
