import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ErwaegungsRail } from '../components/rechtsprechung/ErwaegungsRail';
import { TrefferLandkarte } from '../components/leser/TrefferLandkarte';
import { landkarteSpur } from '../components/leser/landkarteModell';
import { erwaegungsGliederung, erwaegungsWort } from '../lib/rechtsprechung/abschnitte';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';
import { nennungsAnker, trefferInErwaegungen, zaehleTreffer, type SuchTreffer } from './entscheidLeserRegeln';
import { entscheidLandkarteEinheiten } from './entscheidLandkarte';

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
export const ErwBereich = memo(function ErwBereich({
  abschnitte, zitierteNormen, suche, onSuche, springe, markenSchalter,
  landkarteSteht, aktivAnker,
}: {
  abschnitte: EntscheidAbschnitt[];
  zitierteNormen: string[];
  suche: string;
  onSuche: (v: string) => void;
  springe: (anker: string) => void;
  /** W2·28/L-2 · fertiges Schalter-Element (der Rail rechnet nichts, s. dort). */
  markenSchalter?: ReactNode;
  /** Darf der Streifen auf DIESER Fläche überhaupt stehen? (Lage + Schalter —
   *  die trefferabhängige Hälfte der Bedingung entscheidet diese Komponente,
   *  weil nur sie die Zahl hat.) */
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
  const gewertetRef = useRef('');
  const [sucheGewertet, setSucheGewertet] = useState('');
  useEffect(() => {
    const sofort = suche.trim() === '' || gewertetRef.current.trim() === '';
    const id = window.setTimeout(() => {
      gewertetRef.current = suche;
      setSucheGewertet(suche);
    }, sofort ? 0 : 200);
    return () => window.clearTimeout(id);
  }, [suche]);
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
        normen={normen} suche={suche} onSuche={onSuche} springe={springe}
        markenSchalter={markenSchalter} />
      {/* ── W2·28 · L-1 · DER STREIFEN ────────────────────────────────────
          `trefferGesamt > 0` ist ZEICHENGLEICH die Bedingung, unter der der
          Rail seinen Schalter «Hervorhebung» zeigt (`ErwaegungsRail`, Zeile
          «suche.trim() !== '' && trefferGesamt > 0 && markenSchalter»). Das
          ist kein Zufall, sondern die Regel: Streifen und Abschalter stehen
          und fallen gemeinsam. Vorher hing der Streifen allein an
          `suche.trim() !== ''` — eine erfolglose Suche liess damit einen
          leeren Streifen stehen, den der Leser nicht mehr wegbekam (Befund
          21.9.2026). Ein Fragment und KEIN Wrapper-Element: der Rail muss
          direktes Kind des Rasters bleiben, und der Streifen ist `fixed`,
          nimmt also ohnehin keinen Platz im Fluss (CLS 0 per Konstruktion). */}
      {landkarteSteht && trefferGesamt > 0 && (
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
