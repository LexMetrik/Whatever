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
//     Einspaltig bleibt die Reihenfolge Kacheln · Häufig · Schnellwerkzeug ·
//     Zuletzt. Messwerte: Token-Kommentar in `tailwind.config.js`.
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
  { rubrik: 'materialien', reg: 'm', ziel: '/materialien', titel: 'Materialien', zahl: nf(z.materialien),
    einheit: 'amtliche Materialien erfasst', nutzen: 'Kreisschreiben, Wegleitungen und Leitfäden nach Behörde' },
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
      <div className={`-mt-3 grid gap-x-10 gap-y-9 ${pk('lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-y-4', '@5xl/pane:grid-cols-[minmax(0,1fr)_20rem] @5xl/pane:gap-y-4')}`}>
        <div className={`grid gap-y-4 ${pk(
          'lg:grid-rows-[auto_minmax(0,1fr)] lg:[&_.lc-start-zelle]:min-h-start-kachel-breit',
          '@5xl/pane:grid-rows-[auto_minmax(0,1fr)] @5xl/pane:[&_.lc-start-zelle]:min-h-start-kachel-breit')}`}>
          <StartKachelFeld kacheln={KACHELN} />
          <HaeufigGebraucht />
        </div>
        <aside aria-label="Arbeitsplatz" className="grid content-start gap-y-4">
          <Schnellwerkzeug />
          <ZuletztVerwendet />
        </aside>
      </div>
      <VertrauensFuss />
    </div>
  );
}
