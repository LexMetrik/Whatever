import { STARTSEITE_ZAEHLER as z } from '../data/startseiteZaehler.generated';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import { SuchBlock } from '../components/start/SuchBlock';
import { ZuletztVerwendet } from '../components/start/ZuletztVerwendet';
import { StartKachelFeld, type KachelDef } from '../components/start/StartKachelFeld';
import { Schnellwerkzeug } from '../components/start/Schnellwerkzeug';
import { HaeufigGebraucht } from '../components/start/HaeufigGebraucht';
import { VertrauensFuss } from '../components/start/VertrauensFuss';

// ─── Startseite — Werkbank mit aufklappenden Kacheln (W2·29-WERKBANK-START) ──
//
// Prototyp + Go David 23.9.2026 (FAHRPLAN-WERKBANK-UMBAU §5d, Spec
// `start-prototyp/SPEC-START-UND-GRUNDTON.md`): «die startseite … die vier
// kacheln … wenn man eines davon anklickt [soll] es aufspringt» · «es soll die
// funktionen haben wie die werkbank … aber die kacheln sollen bedienbar sein».
//   · Kopf: die Begrüssung mit Suchfeld BLEIBT (Auswahlfrage 23.9.2026
//     «Begrüssung behalten»; D39 vom 7.9.2026 gilt weiter).
//   · Links: 2×2-Kachelfeld (Flächenton, Zahl aus dem Zähler, keine Linkzeilen).
//   · Rechts: «Schnellwerkzeug» (Fristenrechner mit der echten Engine; seit
//     U2 24.9.2026 wählbar Frist · Verzugszins · Verjährung, `start/
//     Schnellwerkzeug.tsx`) und
//     «Zuletzt» — «1 ja … 4 ja» am Prototyp. Die Spalte ist 20rem schmal, darum
//     `EinfacheFristForm minimal` (zwei Spalten, Ferien als Auswahlfeld): die
//     Vollform setzte vier Felder in 320 px, das Datum wurde gekappt
//     (e2e kein-abschnitt, CI #1025 24.9.2026).
//   · NEU GEGLIEDERT (W2·29-WERKBANK-START-LAYOUT, David 24.9.2026, FAHRPLAN-
//     WERKBANK-UMBAU §5d): «entscheide sollen weg» — die Liste «Jüngste
//     Entscheide im Korpus» ist gestrichen; das KEHRT Davids Entscheid vom
//     23.9.2026 um («neuste entscheide sollen nicht weg»). Die Rubrik
//     /rechtsprechung bleibt unberührt, die Kachel führt dorthin. «klarer
//     abgegrenzt» / «klarer unterteilt · auch die spalte selbst» → je Teil der
//     Spalte eine eigene Fläche (`StartFlaeche`). «gesetze rechtsprechung
//     materialien werkzeuge [sollen] diese fläche einnehmen» → Auswahl «A
//     bündig»: das Kachelfeld ist so hoch wie die Fläche Schnellwerkzeug.
//     Auswahl «Schnellwerkzeug oben»: «Zuletzt» steht darunter.
//   · DAS RASTER dafür: ab `lg` zwei Spalten × zwei Zeilen. Zeile 1 = Feld |
//     Schnellwerkzeug, Zeile 2 = leer | Zuletzt. Die Spalte (`aside`) läuft über
//     beide Zeilen und reicht sie per `subgrid` an ihre zwei Flächen weiter. So
//     bestimmt NUR das Schnellwerkzeug die Höhe von Zeile 1 und damit des
//     Felds; «Zuletzt» füllt sich erst im Browser (localStorage) und kann das
//     Feld nie verschieben (§15). Das Token `minHeight.start-kachel` bleibt die
//     Untergrenze je Kachel. [Seit U9, 24.9.2026 abends, abgelöst: EINE Zeile,
//     «Zuletzt» steht in der Spalte unter dem Schnellwerkzeug — s. unten.]
//   · U4/U6 (START-UEBERARBEITUNG, David 24.9.2026, §5d-bis) — löst «A bündig»
//     ab: Zeile 1 links ist jetzt eine eigene Spalte «Kachelfeld + Häufig
//     gebraucht» (`auto minmax(0,1fr)`). Die Kacheln behalten ab `lg` ihre
//     bisherige Höhe (Token `start-kachel-breit`, 18rem ≈ die 289 px vor U2),
//     «Häufig gebraucht» nimmt den Rest bis zur Unterkante der Fläche
//     Schnellwerkzeug — die Kacheln werden nicht mehr gestreckt. Einspaltig
//     (< lg): Kacheln, Häufig gebraucht, Schnellwerkzeug, Zuletzt — die
//     Direktlinks gehören zu den Kacheln (beides Wege IN den Bestand), das
//     Werkzeug folgt als eigenes Arbeitsgerät. `-mt-3`: weniger Leerraum unter
//     der Kopfzeile (U6 «weniger Leerraum über den Kacheln»).
//   · U9 (START-UEBERARBEITUNG, Nachtrag David 24.9.2026 abends, §5d-bis):
//     «zuletzt geöffnet auf startseite soll nicht extra platz einnehmen sonder
//     schnellwerkzeug soll kleiner werden» — die zweite Rasterzeile (leer |
//     Zuletzt, `row-span-2` + `subgrid`) entfällt. Ab `lg` gibt es EINE Zeile:
//     links Kachelfeld + Häufig gebraucht, rechts die Spalte mit Schnellwerkzeug
//     UND darunter «Zuletzt geöffnet». Möglich, weil beide kleiner wurden: die
//     Bühne des Schnellwerkzeugs reserviert nur noch die Frist-Variante (Token
//     `start-schnell`), «Zuletzt» zeigt höchstens fünf einzeilige Einträge
//     (`ZuletztVerwendet`). Die Zeilenhöhe ist das Maximum beider Spalten;
//     «Häufig gebraucht» füllt links weiter bis zur Unterkante der Spalte.
//     `grid-rows-[auto_1fr]`: «Zuletzt» (zweite Fläche, nur mit Einträgen)
//     reicht bis zur Zeilen-Unterkante — die Unterkanten links und rechts
//     bleiben bündig wie seit U4. Ohne Einträge bleibt das Schnellwerkzeug in
//     seiner natürlichen Höhe (keine leere Mulde); erscheint «Zuletzt» nach dem
//     Laden, wächst nur die neue Fläche, nichts verschiebt sich (§15).
//     Einspaltig bleibt die Reihenfolge Kacheln · Häufig · Schnellwerkzeug ·
//     Zuletzt. Messwerte: Token-Kommentar in `tailwind.config.js`.
//   · U13 (START-UEBERARBEITUNG, Nachtrag David 24.9.2026 abends, §5d-bis):
//     «nochmals an der darstellung und den breiten und grössen der startseite
//     arbeiten sodass alles optimal und schön genützt wird» und «es soll nicht
//     zu scrollen kommen wenn man kachel aufmacht» / «also bei gesetz». Ab `lg`
//     steht das Kachelfeld 16 px unter der Kopfzeile (`lg:-mt-5`, vorher 24 px
//     per `-mt-3`) — derselbe Abstand wie zwischen Feld und «Häufig gebraucht»
//     und zwischen den Flächen der Spalte. Zusammen mit `start-kachel-breit`
//     17.5rem steht das offene Blatt ab 1280×800 ganz im Fenster (Messwerte:
//     Token-Kommentar). Die Spaltenbreite 20rem bleibt: die Seite ist ab 1280
//     auf `max-w-content` (1072 px Inhalt) gedeckelt, eine breitere Spalte
//     nähme dem Blatt Breite und liesse die Gesetze-Wahl umbrechen und höher
//     werden. Telefon unverändert.
//   · W2·29-WERKBANK-REST-BREITE (25.9.2026, Entscheid David «ja das soll
//     optimiert werden»): der Satz oben («die Seite ist ab 1280 auf
//     `max-w-content` gedeckelt») gilt seither nur noch BIS `2xl` (1536 px) —
//     ab dort trägt der Shell zusätzlich `max-w-weit` (90rem, NUR auf `/`,
//     `Shell.tsx` `inhaltsbreiteFuer`; alle anderen Routen bleiben byte-gleich
//     auf `content`). GEWÄHLTE VARIANTE (a): nur die Kachelspalte
//     (`minmax(0,1fr)` oben in der Grid-Zeile) wächst automatisch mit dem
//     breiteren Container mit — KEINE Änderung an dieser Datei nötig, die
//     20rem-Spalte rechts (Schnellwerkzeug/Zuletzt) bleibt exakt dieselbe
//     Breite wie zuvor, aus demselben Grund wie oben (Lesbarkeit/Umbruch der
//     Kacheln in `EinfacheFristForm minimal`). Variante (b) — auch die rechte
//     Spalte verbreitern — wurde verworfen: das Schnellwerkzeug und «Zuletzt»
//     brauchen die 20rem nicht breiter, ein Wachstum dort hätte nur mehr
//     Leerraum in den Formularen erzeugt, keinen Mehrwert.
//     GEMESSEN (Preview-Build, Methode `e2e/startseite-breite.e2e.ts`):
//       @1280/@1440   Shell 1120px · Feld 712px · Kacheln 348×280px
//       @1680/@1920   Shell 1440px · Feld 1032px · Kacheln 508×280px
//     Aside (Schnellwerkzeug/Zuletzt) konstant 320px an allen vier Breiten.
//     Längste Nutzen-/Teile-Zeile der Kacheln @1920: 72 Zeichen (Materialien-
//     Kachel «teile»), unter der 75-Zeichen-Decke; Häufig-gebraucht-Zeilen
//     @1920 höchstens 54 Zeichen. Kachelhöhe bleibt an allen vier Breiten
//     280px (Token `start-kachel-breit` unverändert) — U4/U13 bleiben damit
//     unangetastet gültig.
//     NEBENFUND UND FIX (blockierend für U13): die Kantone-Karte in der
//     Gesetze-Wahl (`GesetzeBlatt.tsx`, Spalte «Kantone», `SchweizKarte`
//     `w-full h-auto`) wuchs proportional mit der breiteren Mittelspalte
//     (216→340px) und riss damit die U13-Zusage «kein Scroll beim Aufklappen»
//     — `.lc-start-blatt-inhalt`-Überlauf sprang von 0 auf 38px ab `2xl`.
//     Behoben mit einem `2xl:max-w-[13.5rem]`-Deckel am Kartenwrapper (friert
//     die Kartengrösse auf ihrem Vor-`weit`-Stand ein; Begründung am Fundort).
//     Rot-Beweis und volle Messreihe: Kopfkommentar `e2e/startseite-breite.e2e.ts`.
//   · Der Modul-Baukasten (Ein-/Aus-/Umordnen, R10) ist gestrichen
//     (Auswahlfrage 23.9.2026 «Streichen»): Systematik, Kantone und Materialien
//     sind jetzt Stufen der Kacheln, nicht zweite Wege daneben.
//
// §8: jede Zahl kommt aus `STARTSEITE_ZAEHLER` (`gen:zaehler`, Drift-Tor
// `check:zaehler`); die Werkzeug-Summe wird hier gebildet, nie von Hand
// geschrieben. A11y: genau EINE <h1> (die Begrüssung im Suchblock), je
// Abschnitt eine <h2>. Reine Darstellung (§3).
const nf = (n: number) => n.toLocaleString('de-CH');

/** Die vier Rubrik-Kacheln — die Einheit sagt, WAS gezählt wurde (§8: «im
 *  Volltext» nur, wo Volltext erfasst ist; Materialien sind «erfasst»).
 *  `teile`: die Zahl aufgeschlüsselt, aus denselben Zählerfeldern (Summe =
 *  Kachelzahl, Wächter `zaehler-eine-quelle.test.tsx`). */
const KACHELN: readonly KachelDef[] = [
  { rubrik: 'gesetze', reg: 'g', ziel: '/gesetze', titel: 'Gesetze', zahl: nf(z.gesetzeVolltext),
    einheit: 'Erlasse im Volltext, Bund und Kantone',
    nutzen: 'Bundesrecht nach Rechtsgebiet, Kantone über die Landeskarte, internationales Recht',
    teile: `${nf(z.gesetzeBundesrechtVolltext)} Bundeserlasse · ${nf(z.gesetzeKantonVolltext)} Kantonserlasse · ${nf(z.gesetzeInternationalVolltext)} Staatsverträge` },
  { rubrik: 'rechtsprechung', reg: 'r', ziel: '/rechtsprechung', titel: 'Rechtsprechung', zahl: nf(z.rechtsprechungVolltext),
    einheit: 'Entscheide im Volltext', nutzen: 'Bundesgericht und kantonale Gerichte, nach Sachgebiet' },
  // U12 (David 24.9.2026: «materialien soll erläuterungen und materialien
  // enthalten»): die Kachel führt BEIDE Gattungen (Hausbegriffe wie im Leser,
  // `lib/materialien/gattung.ts`) — vorher nannte der Nutzen nur die
  // Verwaltungspraxis und die Einheit «amtliche Materialien» mischte beides.
  { rubrik: 'materialien', reg: 'm', ziel: '/materialien', titel: 'Materialien', zahl: nf(z.materialien),
    einheit: 'Materialien und Erläuterungen erfasst',
    nutzen: 'Botschaften und Vernehmlassungen · Kreisschreiben, Wegleitungen und Leitfäden nach Behörde',
    teile: `${nf(z.materialienGesetzgebung)} Materialien (Gesetzgebung) · ${nf(z.materialienErlaeuterungen)} Erläuterungen (Verwaltungspraxis)` },
  // Ziel `/rechner`: der Werkzeug-Katalog (K4) führt Rechner und Vorlagen.
  { rubrik: 'werkzeuge', reg: 'w', ziel: '/rechner', titel: 'Werkzeuge', zahl: nf(z.rechner + z.vorlagen),
    einheit: 'Rechner und Vorlagen', nutzen: 'Fristen, Gebühren und Beträge, Zuständigkeiten · Verträge, Klagen und Gesuche',
    teile: `${nf(z.rechner)} Rechner · ${nf(z.vorlagen)} Vorlagen` },
];

export function Startseite() {
  const pk = usePaneKlasse();
  return (
    <div className={`grid gap-y-9 ${pk('sm:-mt-6', '')}`}>
      <SuchBlock />
      <div className={`-mt-3 grid gap-x-10 gap-y-9 ${pk('lg:-mt-5 ', '@5xl/pane:-mt-5 ')}${pk('lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-y-4', '@5xl/pane:grid-cols-[minmax(0,1fr)_20rem] @5xl/pane:gap-y-4')}`}>
        <div className={`grid gap-y-4 ${pk(
          'lg:grid-rows-[auto_minmax(0,1fr)] lg:[&_.lc-start-zelle]:min-h-start-kachel-breit',
          '@5xl/pane:grid-rows-[auto_minmax(0,1fr)] @5xl/pane:[&_.lc-start-zelle]:min-h-start-kachel-breit')}`}>
          <StartKachelFeld kacheln={KACHELN} />
          <HaeufigGebraucht />
        </div>
        <aside aria-label="Arbeitsplatz" className={`grid content-start gap-y-4 ${pk('lg:grid-rows-[auto_1fr]', '@5xl/pane:grid-rows-[auto_1fr]')}`}>
          <Schnellwerkzeug />
          <ZuletztVerwendet />
        </aside>
      </div>
      <VertrauensFuss />
    </div>
  );
}
