import { MenueGruppe, MenueSchalter, MenueTitel } from '../../../components/ui/Menue';
import { setzeVermerke, type VermerkeWahl } from '../leserOptionen';

// ═══ D35-F3 (Entscheid David 7.9.2026) · «ÄNDERUNGEN ANZEIGEN ALS» ═══════════
//
// Davids Wortlaut zum Ansicht-Menü: «es soll entweder fassung oder fussnoten
// angezeigt werden. also entweder fassung, fussnoten oder aus.» Bis 7.9.2026
// standen dort ZWEI unabhängige Schalter, und beide Stellungen waren zugleich
// wählbar — gemessen vier erreichbare Kombinationen (D35-Bericht Teil 3).
//
// DIE WAHL IST DREIWERTIG UND VERLUSTFREI (Entscheid David: «A und verlustfrei»).
// Sie schaltet ausschliesslich die ÄNDERUNGSHISTORIE gegeneinander:
//
//   Fassung    «Gilt seit …» + Zeitleiste · Änderungs-Fussnoten (kl:'A') gedämpft
//   Fussnoten  voller amtlicher Apparat inkl. kl:'A' · Fassungs-Zeile aus
//   aus        weder noch
//
// In JEDER Stellung sichtbar bleiben `kl:'V'/'G'/'Z'/'U'` und jede Fussnote OHNE
// Klasse. Der Grund steht als Messwert da und nicht als Meinung: im ZPO-Apparat
// sind 99 von 311 Einträgen (32 %) keine Änderungsvermerke — eine Radiogruppe im
// Wortsinn hätte sie mitgenommen (§7/§8), und H0-Auflage 1 verlangt ausdrücklich,
// dass `A` die EINZIGE dämpfbare Klasse ist
// (`bibliothek/normen/hist-ansicht-h0-trennbarkeit.md`).
//
// WARUM EINE EIGENE DATEI: `LeserAnsichtV3.tsx` stand bei 418 der 420 Zeilen, die
// die Fundament-Sonde erlaubt (`src/tests/leser-v3-fundament.test.ts`, §6.6) —
// derselbe Grund, aus dem `./menueTasten.ts` entstanden ist. Eine Wahl mit drei
// Stellungen, einer Anbieten-Bedingung und einer Ehrlichkeits-Zeile ist zudem ein
// eigener Gedanke, kein Absatz im Menü.
//
// DIE ROLLEN SETZT DER AUFRUFER (`ui/Menue`-Vertrag): `MenueSchalter` bringt
// `role="switch"` mit, hier wird daraus `menuitemradio`; die FORM der Marke ist
// `punkt` — der Kreis, den D35-F4 für genau diesen Fall vorgesehen hat («damit
// ein künftiges Menü mit Dreier-Wahl (F1/F3) ohne Umbau hineinpasst», index.css).
//
// ═══ W2·26/Z8 (Mandat David 11.9.2026) · DIE WAHL IST NICHT MEHR VERLUSTFREI ═
//
// Wörtlich: «Fussnoten, die z. B. nur eine SR-Nummer enthalten, müssen ebenfalls
// weg sein, wenn Fussnoten abgewählt sind.» Die Matrix oben beschreibt den Stand
// vom 7.9.2026 und bleibt Wort für Wort stehen (§0 Ziff. 2b). SEITHER gilt:
//
//   Fassung    «Gilt seit …» + Zeitleiste · KEIN Fussnoten-Apparat, keine Marker
//   Fussnoten  voller amtlicher Apparat (alle Klassen) · Fassungs-Zeile aus
//   aus        weder noch
//
// Die Wahl kennt damit keine Klassen mehr — sie zeigt den Apparat ganz oder gar
// nicht. Am Bildschirm; der AUSDRUCK behält ihn in jeder Stellung (§7/§8, ein
// Dokument ohne amtlichen Apparat wäre unvollständig), und nichts verlässt das
// DOM (A1-Mechanik, David 5.7.2026).
//
// ZWEI DINGE SIND DAMIT ERSATZLOS GEFALLEN (§17-Gegengewicht):
//  · die Prop `ohneKlassifikation` und die Hinweiszeile «Dieser Erlass führt
//    keine klassifizierten Änderungs-Fussnoten; ‹Fassung› und ‹Fussnoten›
//    unterscheiden sich hier nur in der Fassungs-Zeile.» Sie erklärte, warum
//    sich zwei Stellungen auf einem klassenlosen Erlass gleich verhalten — seit
//    Z8 verhalten sie sich dort GENAU SO verschieden wie überall sonst, und der
//    Satz wäre eine Behauptung über eine Wirkung, die es nicht mehr gibt (§8).
//    Mit ihr fällt die Durchreiche `aenderungsFussnoten` durch drei Dateien.
//  · die Klassen-Klauseln in den drei Tooltips.
// H0-Auflage 1 ist nicht verletzt, sondern gegenstandslos: sie bindet die
// ÄNDERUNGS-Ansicht an die Klasse `A`; hier dämpft keine Klasse mehr etwas
// (Herleitung am Regelblock in `src/index.css`).

// ═══ S6 W1f (Entscheid David 24.9.2026) · EIN SCHALTER: FUSSNOTEN AM ARTIKEL ═
//
// Wörtlich: «infos sollen alle im blatt erscheinen. einzige ausnahme sind wenn
// fussnoten aktiviert sind die sollen unten am artikel erschienen». Die
// Stellung «Fassung» hatte ihren Gegenstand am Artikelende — die Zeile «Gilt
// seit …» — und der steht seither im Erlass-Blatt (Reiter «Änderungen»). Aus
// der Dreier-Wahl wird darum EIN Schalter: Fussnoten am Artikel an oder aus.
// Die Blöcke oben sind Belege ihres Datums (§0 Ziff. 2b). Gespeicherte Wahlen
// migriert `leserOptionen.migriereOptFelder` («Fassung» → aus, Herleitung dort).
//
// ROLLE `menuitemcheckbox`: ein Zweiwert-Schalter im Menü (derselbe Vertrag wie
// die gefallene Rubriken-Wahl). `data-v3-vermerke="fussnoten"` bleibt als
// Sonden-Anker — der Schalter IST die frühere Stellung «Fussnoten».

const TITEL = 'Zeigt den vollständigen amtlichen Fussnoten-Apparat samt Marken im '
  + 'Gesetzestext. Im Ausdruck bleibt der Apparat in jeder Stellung vollständig.';

export function LeserAenderungsWahl({ wahl, fussnotenAnzahl }: {
  /** Die gesetzte Stellung aus dem geteilten Store. */
  wahl: VermerkeWahl;
  /**
   * A26 (David 11.7.2026) · der Zähler N am Fussnoten-Eintrag. Er zählt den
   * GANZEN Erlass, nicht den Artikel (LM-025) — darum steht die Bezugsgrösse im
   * Accessible Name und im Tooltip, nie die nackte Zahl.
   */
  fussnotenAnzahl: number | null;
}) {
  const zahl = fussnotenAnzahl != null && fussnotenAnzahl > 0 ? fussnotenAnzahl : null;
  const an = wahl === 'fussnoten';
  return (
    <MenueGruppe attrs={{
      role: 'group',
      'aria-label': 'Im Gesetzestext',
      'data-v3-vermerke-wahl': '',
    }}>
      {/* «Im Gesetzestext», nicht «Am Artikel»: an einem §-Erlass wäre das
          Wort falsch (B8/C1), und der Schalter gilt dem ganzen Lesetext. */}
      <MenueTitel>Im Gesetzestext</MenueTitel>
      <MenueSchalter
        an={an}
        label="Fussnoten"
        titel={zahl != null ? `${TITEL} (${zahl} in diesem Erlass)` : TITEL}
        ariaLabel={zahl != null ? `Fussnoten (${zahl} im Erlass)` : undefined}
        onKlick={() => setzeVermerke(an ? 'aus' : 'fussnoten')}
        attrs={{ role: 'menuitemcheckbox', 'data-v3-vermerke': 'fussnoten' }}
      />
    </MenueGruppe>
  );
}
