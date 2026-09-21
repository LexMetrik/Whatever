import { memo, useMemo } from 'react';
import { ErwaegungsRail } from '../components/rechtsprechung/ErwaegungsRail';
import { MarkenSchalter } from '../components/leser/MarkenSchalter';
import { TrefferLandkarte } from '../components/leser/TrefferLandkarte';
import { landkarteSpur } from '../components/leser/landkarteModell';
import { erwaegungsGliederung, erwaegungsWort } from '../lib/rechtsprechung/abschnitte';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';
import { nennungsAnker, trefferInErwaegungen, zaehleTreffer, type SuchTreffer } from './entscheidLeserRegeln';
import { entscheidLandkarteEinheiten } from './entscheidLandkarte';
import { useSucheGewertet } from './entscheidErwEntprellung';

// ═══ ENTSCHEID-LESER · DIE ZWEITE SPALTE ════════════════════════════════════
//
// EIGENE DATEI (§6.6, Fertigbau 21.9.2026): `EntscheidLeser.tsx` ist mit W2·28
// über seine Schlankheits-Baseline gewachsen (`check:schlankheit`, gemessen
// 1245 von erlaubten 1204 Zeilen). Geschnitten ist die Kante, die die Datei
// ohnehin hatte — der Rail und die Landkarte sind Rechen-ANSCHLÜSSE, während
// die Leser-Datei daneben Seitenaufbau ist. Der Schnitt bewegt Code, er ändert
// keinen (§6: die Golden-Zusicherungen der Fläche bleiben in
// `src/tests/entscheid-leser-b2.test.tsx`, das die VEREINIGUNG der Dateien
// liest).

// ── V5 · Rechen-Anschluss des Erwägungs-Rails ───────────────────────────────
//
// Die drei Ableitungen (Gliederung · Suchtreffer · Normen-Fundstellen) leben
// HIER und nicht in `ErwaegungsRail`: sie sind Regeln des Lesers
// (`entscheidLeserRegeln`, `abschnitte`), und die Rail-Komponente soll ein
// reiner Renderer bleiben — dieselbe Arbeitsteilung wie Reader ↔ `BezuegeZeile`.
// Eigene `memo`-Grenze, damit ein Tastendruck im Suchfeld nicht den ganzen
// Leser (Kopf, Tabs, Fuss-Panel) neu rendert; die Ableitungen selbst hängen in
// `useMemo` (React Compiler ist AUS, §15.4).
// A-2 (31.8.2026): die `imPane`-Prop ist mit dem Rail selbst entfallen — er
// liest die Lage jetzt aus demselben Kontext wie sein Raster (`usePaneKlasse`).
//
// ── W2·28 (21.9.2026): DER RAIL UND DIE LANDKARTE RECHNEN GEMEINSAM ─────────
// Die Landkarte hing bis hierher an einer EIGENEN Komponente, die
// `trefferInErwaegungen` und `zaehleTreffer` ein zweites Mal aufrief — bei
// jedem Tastendruck lief also beides doppelt über alle Blöcke des Entscheids,
// und zwei Aufrufe derselben Funktion sind zwei Stellen, an denen eine Zahl
// künftig auseinanderlaufen kann (§5). Seither rechnet DIESE Komponente die
// zwei Werte einmal und gibt sie beiden Anzeigen; die Landkarte bekommt sie
// als Prop und rechnet nur noch ihre eigene Spur (die hängt allein an den
// Abschnitten). Die Zahlen sind damit per Konstruktion dieselben, nicht nur
// zufällig gleich. Zusammen stehen sie auch deshalb, weil sie DIESELBE
// Bedingung teilen: ohne Treffer gibt es weder den Schalter im Rail noch
// etwas, das die Landkarte zeigen könnte.
// ── §15 · DER ENTPRELL-HOOK ──────────────────────────────────────────────────
// `useSucheGewertet` steht seit 21.9.2026 in einer EIGENEN Datei
// (`entscheidErwEntprellung.ts`) — nicht hier: `react-refresh/only-export-
// components` bricht, wenn eine Datei einen Hook NEBEN einer Komponente
// exportiert. Verhaltensneutral (§6.3), Herleitung der 0-ms/200-ms-Regel und
// der Nachträge 21.9.2026 stehen unten bei ihrem Aufruf.
export const ErwBereich = memo(function ErwBereich({
  abschnitte, zitierteNormen, suche, onSuche, springe, markenAusRoh, onMarkenSchalten,
  landkarteSteht, aktivAnker,
}: {
  abschnitte: EntscheidAbschnitt[];
  zitierteNormen: string[];
  suche: string;
  onSuche: (v: string) => void;
  springe: (anker: string) => void;
  /** W2·28/L-2 · Roh-Zustand des Schalters «Hervorhebung» (State des Lesers,
   *  NIE selbst zurückgesetzt — s. Nachtrag 21.9.2026 unten bei `suche`).
   *  ErwBereich wertet ihn GEWERTET (§ Falle a, 21.9.2026): Schalter-Anzeige
   *  und Landkarten-Sichtbarkeit hängen an `sucheGewertet`, sonst zeigte der
   *  Schalter für einen Tick den falschen Zustand, während Rail-Schranke und
   *  Zähler noch den alten (gesperrten) Stand trugen. */
  markenAusRoh: boolean;
  onMarkenSchalten: (aus: boolean) => void;
  /** Darf der Streifen auf DIESER Fläche überhaupt stehen? Nur noch die Lage
   *  (Pane ja/nein) — die trefferabhängige UND die Schalter-Hälfte der
   *  Bedingung rechnet diese Komponente selbst, s.u. (§ Falle a). */
  landkarteSteht: boolean;
  /** Abschnitts-Anker des Scroll-Spys — die Leseposition im Streifen. */
  aktivAnker: string | null;
}) {
  const gliederung = useMemo(() => erwaegungsGliederung(abschnitte), [abschnitte]);
  // ── §15 · DIE ZWEI SUCH-ABLEITUNGEN LAUFEN ENTPRELLT (Messung 21.9.2026) ───
  //
  // GEMESSEN am längsten Entscheid des Korpus (Appellationsgericht BS
  // SB.2018.46, 288 Blöcke / 785 065 Zeichen), Chromium auf ungedrosseltem
  // Desktop, zehn Anschläge «Beschwerde»: ZEHN Long Tasks, zusammen 1374–1588 ms
  // Blockade, längste 284–332 ms — also ~140–160 ms Hauptstrang-Blockade JE
  // TASTENDRUCK, Frame-p95 118–133 ms statt 17 ms. Mit abgeschalteter
  // Hervorhebung (die auf einem eigenen, hier nicht berührten Pfad läuft)
  // bleiben davon 977–979 ms, also ~98 ms je Anschlag allein für diese zwei
  // Ableitungen samt Rail-Neuaufbau. Die reine Rechenzeit misst in Node 23 ms je
  // Aufruf-Paar; der Rest ist der Neuaufbau der bis zu 201 Einträge langen
  // Trefferliste. Der Gesetz-Leser entprellt denselben Vorgang seit Rank 9
  // (200 ms, `gesetz-leser/inhalt-zustand.tsx`) — hier fehlte es.
  //
  // §15 · LOGIKVERLUST: KEINER. Entprellt wird das WANN, nie das WAS — dieselben
  // Funktionen, dieselben Argumente, dasselbe Ergebnis (§2 bleibt unberührt).
  // Sichtbare Folge, benannt statt weggeglättet (§8): beim Verfeinern eines
  // Begriffs zeigen Zähler-Zeile und Streifen bis zu 200 ms lang die Zahlen des
  // VORIGEN Präfixes. Das Eingabefeld selbst bleibt unverzögert (es hängt
  // weiter an `suche`), und die Hervorhebung im Lesetext ebenfalls.
  //
  // BETRETEN UND VERLASSEN SIND SOFORT (0 ms), nur das VERFEINERN ist verzögert.
  // Grund ist §8, nicht Bequemlichkeit: mit pauschaler Verzögerung stünde beim
  // ERSTEN Zeichen einer frischen Suche 200 ms lang «Keine Treffer in dieser
  // Fassung» in einem `aria-live="polite"`-Bereich — eine falsche Aussage, die
  // ein Screenreader vorliest, bevor sie sich korrigiert. So gibt es sie nicht:
  // angezeigt werden immer die Zahlen eines Präfixes, das wirklich getippt
  // wurde. Den teuersten Aufruf (das erste, breiteste Zeichen) kostet das.
  //
  // NACHTRAG 21.9.2026 (F8, ergänzt statt nachgeführt): EMPIRISCH FALSIFIZIERT
  // — ~49 ms lang stand die Falschaussage «Keine Treffer in dieser Fassung.»
  // doch im aria-live-Bereich, weil die RAIL-SCHRANKE (Verzeichnis vs.
  // Trefferliste, `ErwaegungsRail`) und die aria-live-Zeile selbst am ROHEN
  // `suche` hingen, während der Inhalt (diese Zahlen hier) bereits am
  // entprellten `sucheGewertet` hing — zwei Stände derselben Anzeige. Zugleich
  // sprang das Verzeichnis beim Verfeinern 219 → 0 → 201 (gemessene Werte).
  // Behoben durch EIN Stand: Rail-Schranke, aria-live-Gate, Schalter-Gate,
  // Schalter-Anzeige und Landkarten-Sichtbarkeit hängen jetzt alle an
  // `sucheAktiv` (Prop an `ErwaegungsRail` bzw. `markenAusGewertet` weiter
  // unten) — NICHT an `sucheGewertet` allein, sondern an `suche.trim() !== ''`
  // UND `sucheGewertet.trim() !== ''` zugleich (§ Falle b, Herleitung bei
  // `sucheAktiv`): sonst hinkt das VERLASSEN einen Tick hinterher, was ein
  // eigener Rot-Beweis war (`e2e/rechtsprechung.e2e.ts`). Nur das Eingabefeld
  // und die Hervorhebung im Lesetext bleiben roh, unverändert wie oben
  // beschrieben.
  //
  // NACHHER, gleiche Messung: Summe 989 ms statt 1374–1588, LÄNGSTE Blockade
  // 91 ms statt 284–332, schlechtester Frame 183 ms statt 296–338 — der
  // spürbare Hänger je Anschlag ist damit weg. Es bleiben Long Tasks je
  // Anschlag, aber KEINE dieser Ableitungen mehr — sie kommen aus zwei anderen,
  // hier bewusst nicht angefassten Quellen: (a) dem Neuzeichnen der
  // Hervorhebung, das auf seinem eigenen Pfad (`EntscheidLeser.tsx`,
  // `setzeSuchHighlight` am ROHEN `suche`) je Anschlag über den ganzen Lesetext
  // läuft — gemessene ~27 ms je Anschlag (989 ms mit gegen 715 ms ohne); (b) dem
  // Neu-Rendern des Lesers selbst, weil `suche` sein Zustand ist und das
  // Eingabefeld gesteuert bleibt. Beides sind eigene Befunde (Bericht
  // 21.9.2026); sie liegen ausserhalb dieser Datei, und (a) berührte die
  // Markier-Logik.
  //
  // NACHTRAG 21.9.2026 (F8, ergänzt): VERSCHRÄNKTE Messung im selben Build
  // (n=5, BS SB.2018.46, 288 Blöcke) statt der zwei getrennten Builds oben —
  // die Hervorhebung allein kostet 15 ± 5 ms je Anschlag. Mitentprellen der
  // Hervorhebung wurde GEMESSEN und verworfen: 5/5 Läufe schlechter, +68 ± 29
  // ms GESAMTBLOCKADE (längste Einzelblockade 130–156 statt 90–95 ms). Die
  // Hervorhebung bleibt darum roh.
  const sucheGewertet = useSucheGewertet(suche);
  // ── § Falle a/b (21.9.2026) · EIN STAND FÜR DIE GANZE DARSTELLUNGSSEITE ────
  // `sucheAktiv` ist NICHT nur «`sucheGewertet` ist nicht leer» — das wäre zu
  // GROSSZÜGIG in der falschen Richtung: beim VERLASSEN (Feld leeren) ist
  // `suche` sofort leer, aber `sucheGewertet` hängt bis zum 0-ms-Timer noch
  // einen Tick am alten, nicht-leeren Wert. Ein reiner `sucheGewertet`-Test
  // hätte den Rail in GENAU diesem Tick weiter die (jetzt veraltete)
  // Trefferliste zeigen lassen statt sofort auf die Gliederung zurückzufallen
  // — ROT-BEWEIS: `e2e/rechtsprechung.e2e.ts` «sucht ehrlich im Entscheid»
  // (Suche filtert nicht: 4 von 4, weil `ohneSuche` mitten in diesem Tick
  // gelesen wurde). `suche.trim() !== ''` GLEICHZEITIG verlangt behebt das:
  // das Verlassen ist damit wieder so instantan wie vor diesem Bau (die
  // Gliederung braucht `sucheGewertet` gar nicht, sie hängt nur an
  // `abschnitte`), während das BETRETEN/VERFEINERN weiterhin auf den
  // gewerteten Stand wartet (Folge 1/2 oben). `markenAusGewertet` erbt dieselbe
  // Regel — Schalter und Landkarte verschwinden beim Leeren darum im SELBEN
  // Tick wie die Trefferliste, nicht einen Tick später.
  const sucheAktiv = suche.trim() !== '' && sucheGewertet.trim() !== '';
  const markenAusGewertet = sucheAktiv && markenAusRoh;
  const treffer = useMemo(() => trefferInErwaegungen(abschnitte, sucheGewertet), [abschnitte, sucheGewertet]);
  const trefferGesamt = useMemo(() => zaehleTreffer(abschnitte, sucheGewertet), [abschnitte, sucheGewertet]);
  // Angewandte Normen MIT wörtlicher Nennung in einer Erwägung. Ohne Fundstelle
  // KEIN Chip: ein Sprungziel, das es nicht gibt, wird nicht angeboten (§8) —
  // die Norm selbst bleibt im Fuss-Panel («Zitierte Normen») sichtbar.
  const normen = useMemo(() => {
    const out: { zitat: string; anker: string }[] = [];
    const gesehen = new Set<string>();
    for (const z of zitierteNormen) {
      if (gesehen.has(z)) continue;
      gesehen.add(z);
      const anker = nennungsAnker(abschnitte, z)[0];
      if (anker) out.push({ zitat: z, anker });
    }
    return out;
  }, [abschnitte, zitierteNormen]);
  return (
    <>
      <ErwaegungsRail gliederung={gliederung} treffer={treffer} trefferGesamt={trefferGesamt}
        normen={normen} suche={suche} onSuche={onSuche} springe={springe} sucheAktiv={sucheAktiv}
        markenSchalter={<MarkenSchalter aus={markenAusGewertet} onSchalten={onMarkenSchalten} />} />
      {/* ── W2·28 · L-1 · DER STREIFEN ────────────────────────────────────
          `trefferGesamt > 0` ist ZEICHENGLEICH die Bedingung, unter der der
          Rail seinen Schalter «Hervorhebung» zeigt (`ErwaegungsRail`, Zeile
          «sucheAktiv && trefferGesamt > 0 && markenSchalter» — bis 21.9.2026
          stand hier `suche.trim() !== ''`, s. Nachtrag oben). Das ist kein
          Zufall, sondern die Regel: Streifen und Abschalter stehen und fallen
          gemeinsam. Vorher hing der Streifen allein an `suche.trim() !== ''`
          — eine erfolglose Suche liess damit einen leeren Streifen stehen,
          den der Leser nicht mehr wegbekam (Befund 21.9.2026). Ein Fragment
          und KEIN Wrapper-Element: der Rail muss direktes Kind des Rasters
          bleiben, und der Streifen ist `fixed`, nimmt also ohnehin keinen
          Platz im Fluss (CLS 0 per Konstruktion).
          `!markenAusGewertet` (§ Falle a, 21.9.2026): weggeschaltete Marken
          heissen auch keine Landkarte — GEWERTET, damit der Streifen beim
          Leeren des Feldes mit gesetztem Schalter nie für einen Tick
          aufblitzt, während `trefferGesamt` noch den alten Stand zeigt.
          `sucheAktiv` zusätzlich zu `trefferGesamt > 0` (§ Falle b): ohne sie
          bliebe die Landkarte beim Leeren des Feldes einen Tick zu lang
          stehen — `trefferGesamt` hängt nur an `sucheGewertet`, nicht am
          rohen `suche`, s. Herleitung von `sucheAktiv` oben. */}
      {landkarteSteht && sucheAktiv && trefferGesamt > 0 && !markenAusGewertet && (
        <EntscheidLandkarte abschnitte={abschnitte} treffer={treffer}
          gesamtFundstellen={trefferGesamt} aktivAnker={aktivAnker} springe={springe} />
      )}
    </>
  );
});



// ─── W2·28 · L-1 · Rechen-Anschluss der Treffer-Landkarte ───────────────────
//
// Eigene `memo`-Grenze: die Spur über alle Blöcke des Entscheids hängt NUR an
// den Abschnitten und soll einen Tastendruck im Suchfeld überleben (React
// Compiler ist AUS, §15.4). Sie steht ausserdem hier aussen und nicht im
// Hauptkörper des Lesers, weil der vor der Stelle, an der `aktiveAbschnitte`
// feststeht, bereits frühe Rückgaben hat — ein `useMemo` dort wäre ein bedingt
// laufender Hook.
//
// Treffer und Gesamtzahl rechnet diese Komponente NICHT: sie kommen fertig aus
// `ErwBereich`, aus denselben zwei Aufrufen, die auch den Rail und die
// Hervorhebung speisen (§5, eine Trefferquelle — und seit 21.9.2026 auch
// wirklich nur EIN Aufruf je Wert und Tastendruck).
const EntscheidLandkarte = memo(function EntscheidLandkarte({
  abschnitte, treffer, gesamtFundstellen, aktivAnker, springe,
}: {
  abschnitte: EntscheidAbschnitt[];
  /** Die Treffer-Bündel des Rails, unverändert durchgereicht. */
  treffer: SuchTreffer[];
  gesamtFundstellen: number;
  aktivAnker: string | null;
  springe: (anker: string) => void;
}) {
  const spur = useMemo(() => landkarteSpur(entscheidLandkarteEinheiten(abschnitte)), [abschnitte]);
  const marken = useMemo(
    () => treffer.map((t) => ({ id: t.anker, anzahl: t.anzahl })),
    [treffer],
  );
  return (
    <TrefferLandkarte spur={spur} treffer={marken} leseId={aktivAnker}
      register="r" obenVar="--rsp-stick"
      gesamtFundstellen={gesamtFundstellen}
      // Dasselbe Wort, das die Zeile im Rail daneben führt — eine Quelle (§5).
      wortEins={erwaegungsWort(1)} wortMehr={erwaegungsWort(2)}
      onSprung={springe} />
  );
});
