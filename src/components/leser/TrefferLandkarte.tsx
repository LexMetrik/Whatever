import { useMemo } from 'react';
import {
  bereichZuId, feldBeiAnteil, landkarteBaender, landkarteMarken,
  type LandkarteFeld,
} from './landkarteModell';
// Die Masse des Streifens stehen in einer eigenen Datei, seit `markenHoehe`
// für sein Tor exportierbar sein muss (21.9.2026 — Begründung dort).
import { BREITE, HOEHE, MARKE_MIN, MARKE_X, markenBreite, markenHoehe } from './landkarteMasse';

// ═══ W2·28-TREFFER-LANDKARTE · L-1 · Der Streifen neben dem Lesebereich ══════
//
// Wer im Gesetz- oder Entscheid-Leser im Dokument sucht, sieht hier das GANZE
// Dokument als schmalen Streifen: eine Marke je Treffer, massstäblich zum
// Umfang der Bausteine. Ob ein Erlass dicht behandelt oder nur gestreift ist,
// steht damit ohne Scrollen da; ein Klick springt an die Stelle.
//
// ── WO DER STREIFEN STEHT, UND WARUM DORT (Messung 18.9.2026) ───────────────
// Die naheliegende Lage wäre der rechte Rand der Lese-ZELLE. Sie ist gemessen
// unmöglich: der Rahmen ist auf 1072 px gedeckelt (`v3/useElementBreite`,
// Messreihe dort), die Gliederungsspur nimmt 19.25 rem, und die verbleibende
// Zelle (≈ 764 px) wird vom Lesemass VOLLSTÄNDIG ausgefüllt — innerhalb der
// Zelle gibt es auf keiner Breite eine freie Rinne von 44 px (und erst recht
// keine von 48 — s. `BREITE` in `./landkarteMasse`). Der Streifen liegt `fixed` am
// rechten FENSTERRAND, neben der Bildlaufleiste: dort ist ab 1280 px
// Fensterbreite gemessen 104 px Randluft, er überdeckt keinen Text, und als
// Element ausserhalb des Flusses kostet er null Layout (CLS 0 per Konstruktion,
// nicht per Messung).
// Darunter — und in JEDEM geteilten Pane, wo es überhaupt keine Randluft gibt —
// steht er nicht (§8: lieber kein Element als eines über dem Wortlaut). Der
// Aufrufer entscheidet das (er rendert dann gar nicht); diese Datei nicht.
//
// ── §15 · KEINE MESSUNG IM SCROLL ───────────────────────────────────────────
// Der Streifen misst NICHTS am DOM. Die Lagen kommen aus `./landkarteModell`
// (Umfang der Bausteine), die Leseposition aus dem Scroll-Spy, den der Leser
// ohnehin führt (Gesetz: `aktivToken`; Entscheid: der aktive Abschnitts-Anker).
// Kein Scroll-Handler, kein IntersectionObserver, kein `getBoundingClientRect`
// ausser im Klick-Handler — dort ist es eine einzelne Messung auf eine
// Nutzergeste, nicht im Rendering-Pfad.
//
// ── ZUGÄNGLICHKEIT (bewusster Entscheid, §8) ────────────────────────────────
// Der Streifen ist `role="img"` mit einem zusammenfassenden Namen, KEIN
// Bedienelement mit Tastaturfokus. Grund: eine Marke je Treffer heisst beim OR
// bis zu 1146 Marken — 1146 Tabstopps wären für Tastatur- und Screenreader-
// Nutzer eine Verschlechterung, nicht eine Hilfe. Dieselbe Funktion ist per
// Tastatur vollständig vorhanden und bleibt es: die Trefferliste über der
// Lesespalte, die ↑↓-Schritte im Suchfeld und die ‹ ›-Griffe der Zähler-Zeile
// führen an genau dieselben Stellen (§5 — eine Sprungmechanik). Der Klick auf
// den Streifen ist eine Abkürzung für die Maus, nie der einzige Weg (WCAG
// 2.1.1 ist über die Alternative erfüllt).
// Bewegung: der Streifen animiert nichts; `prefers-reduced-motion` hat hier
// nichts zu dämpfen, und der Sprung selbst läuft durch die bestehende
// Sprungmechanik, die die Einstellung bereits respektiert.

export function TrefferLandkarte({
  spur, treffer, leseId, register, obenVar, gesamtFundstellen, wortEins, wortMehr, onSprung,
}: {
  /** Die Bausteine des Dokuments mit ihrer Lage (`landkarteSpur`). */
  spur: readonly LandkarteFeld[];
  /** Die Treffer der Dokumentsuche — dieselbe Liste, die auch die Trefferliste
   *  und die Hervorhebung speist (§5). `anzahl` = Fundstellen darin. */
  treffer: readonly { id: string; anzahl: number }[];
  /** Baustein, in dem der Leser gerade steht (Scroll-Spy des Lesers). */
  leseId: string | null;
  /** Registerfarbe der Marken: Gesetze bzw. Rechtsprechung (§13, Handschrift 4). */
  register: 'g' | 'r';
  /** CSS-Variable, die die Höhe des klebenden Kopfes trägt («--nt-stick»
   *  im Gesetz-Leser, «--rsp-stick» im Entscheid-Leser). */
  obenVar: string;
  /** Fundstellen im GANZEN Dokument — die Bezugsgrösse des zugänglichen Namens.
   *  Kommt aus dem Zähler des Lesers, wird hier nicht nachgerechnet (§5). Sie
   *  kann GRÖSSER sein als das Abgebildete (Entscheid-Leser: Sachverhalt und
   *  Dispositiv zählen mit, tragen aber keine Marke) — der Name legt die
   *  Differenz darum offen, statt sie stillschweigend zu behaupten (§8). */
  gesamtFundstellen: number;
  /** Zähl-Substantiv der markierten Bausteine, Einzahl und Mehrzahl — DASSELBE
   *  Wort, das die Zähler-Zeile daneben schon benutzt (Gesetz-Leser:
   *  `zaehlform(…, bestimmungsWort)`, also «Artikel»/«Paragraph(en)»;
   *  Entscheid-Leser: `erwaegungsWort`). Der Streifen leitet es NICHT selbst ab
   *  — ein zweites Vokabular neben der Zeile daneben wäre genau die zweite
   *  Wahrheit, die §5 verbietet (Befund 21.9.2026: der Streifen sagte
   *  «Abschnitten», die Zeile daneben «Artikel» bzw. «Erwägungen»). */
  wortEins: string;
  wortMehr: string;
  /** Klick auf Streifen oder Marke: Sprung zum Baustein. */
  onSprung: (id: string) => void;
}) {
  const marken = useMemo(() => landkarteMarken(spur, treffer), [spur, treffer]);
  const baender = useMemo(() => landkarteBaender(spur), [spur]);
  const lese = useMemo(() => bereichZuId(spur, leseId), [spur, leseId]);
  // Die Fundstellen, die WIRKLICH als Marke dastehen. Keine zweite Zählung (§5):
  // summiert wird genau das `anzahl`, das die gezeichneten Marken ohnehin
  // tragen — dieselbe Aggregation, die der Erwägungs-Rail für seine Zeile macht.
  const summeMarken = useMemo(() => marken.reduce((n, m) => n + m.anzahl, 0), [marken]);

  // Ohne Spur gibt es nichts abzubilden — dann steht auch kein Streifen (§8).
  if (spur.length === 0) return null;

  // ── §8 · DER NAME SAGT DAS ABGEBILDETE, NICHT MEHR (Befund 21.9.2026) ──────
  // Bis hierher nannte der Name `gesamtFundstellen` — im Entscheid-Leser eine
  // Zahl über ALLE Abschnitte (`zaehleTreffer`), während die Marken allein aus
  // den Erwägungen kommen (`trefferInErwaegungen`). Gemessen an BGE-/BS-Daten
  // lag sie regelmässig höher als die Summe der Marken (Beispiel BS SB.2018.46,
  // «Beschwerde»: 26 gegen 19) — der Streifen sagte also eine Zahl an, die er
  // nicht zeigt. Jetzt steht vorn, was gezeichnet ist; liegt die Bezugsgrösse
  // darüber, wird die Differenz BENANNT, in genau den Worten, die der Rail
  // daneben führt («3 von 16 … · übrige ausserhalb»). Im Gesetz-Leser fallen
  // beide Zahlen zusammen — dort bleibt der Name damit unverändert eine einzige
  // Zahl, und es entsteht keine dritte Wahrheit.
  const teilmenge = summeMarken < gesamtFundstellen;
  const bezug = teilmenge ? gesamtFundstellen : summeMarken;
  const name = `Treffer-Landkarte: ${marken.length} ${marken.length === 1 ? wortEins : wortMehr}`
    + ` · ${teilmenge ? `${summeMarken} von ` : ''}${bezug} ${bezug === 1 ? 'Fundstelle' : 'Fundstellen'}`
    + (teilmenge ? ' · übrige ausserhalb' : '');

  return (
    <div
      data-treffer-landkarte
      role="img"
      aria-label={name}
      title="Treffer-Landkarte — Klick springt an die Stelle im Dokument"
      onClick={(e) => {
        const kasten = e.currentTarget.getBoundingClientRect();
        if (kasten.height <= 0) return;
        const feld = feldBeiAnteil(spur, (e.clientY - kasten.top) / kasten.height);
        if (feld && feld.id !== '') onSprung(feld.id);
      }}
      // `hidden xl:block` steht HIER und nicht beim Aufrufer, und das ist kein
      // Zufall: es ist eine Aussage über das FENSTER (der Streifen ist `fixed`,
      // sein Bezugsrahmen ist der Viewport), nicht über die Fläche des Lesers.
      // Beim Aufrufer wäre es eine Viewport-Klasse in einer Datei, die sonst
      // konsequent Container-Queries führt; ein Container-Gegenstück dazu gäbe
      // es nicht, denn in einer Pane steht der Streifen NIE — neben dem
      // Lesemass ist dort keine Randluft. Der Aufrufer sagt darum «Pane: gar
      // nicht rendern», dieses Element sagt «Fenster: erst ab xl».
      // (Bis zum Fertigbau 21.9.2026 berief sich dieser Absatz auf ein Tor
      // `check:p-klassen` und eine e2e-Datei `entscheid-leser-b2` — beides
      // falsch: `check:p-klassen` ist der Fedlex-<p>-Wächter, und die
      // Paritätssonde `src/tests/entscheid-leser-b2.test.tsx` deckt nur die
      // vier Dateien der Fläche ENTSCHEID-Leser ab, nicht `gesetz-leser/v3`.
      // Für die v3-Naht gibt es heute keinen Wächter; der Verweis ist darum
      // gestrichen statt ersetzt — geraten wird keiner.)
      className="fixed right-3 z-sticky hidden cursor-pointer border border-line bg-well print:hidden xl:block"
      style={{ top: `calc(var(${obenVar}, 7rem) + 0.5rem)`, bottom: '1.5rem', width: `${BREITE}px` }}>
      <svg aria-hidden viewBox={`0 0 ${BREITE} ${HOEHE}`} preserveAspectRatio="none"
        className="block h-full w-full">
        {/* Abschnitts-Trenner: Haarlinien statt Etiketten. Für Wörter ist ein
            48-px-Streifen zu schmal, und geraten wird nichts (§8) — die Namen
            der Abschnitte stehen unverändert in der Gliederungsspalte bzw. im
            Erwägungs-Rail daneben. Jeder Trenner trägt seinen Namen als
            `<title>`, damit er beim Überfahren doch lesbar ist. */}
        {baender.map((b) => (
          <g key={`${b.label}-${b.von}`}>
            <title>{b.label}</title>
            <rect x={0} y={b.von * HOEHE} width={BREITE} height={Math.max(1, (b.bis - b.von) * HOEHE)}
              fill="transparent" />
            {b.von > 0 && (
              <rect x={0} y={b.von * HOEHE} width={BREITE} height={1} fill="var(--rule-soft)" />
            )}
          </g>
        ))}
        {/* Leseposition — wo der Leser gerade steht. Fläche in der neutralen
            Messing-Stufe, damit die Registerfarbe der Marken die einzige Farbe
            im Streifen bleibt (§13, Handschrift 4/6).
            SIE BEKOMMT BEWUSST KEINEN `MARKE_MAX`-Deckel (21.9.2026): das
            Verbot «nie Fläche» gilt der REGISTERFARBE, und Ausdehnung IST hier
            die Auskunft — die Leseposition beantwortet «wieviel vom Dokument
            habe ich vor mir», nicht «wo ist ein Treffer». */}
        {lese && (
          <rect x={0} y={lese.von * HOEHE} width={BREITE}
            height={Math.max(MARKE_MIN, (lese.bis - lese.von) * HOEHE)}
            fill="var(--brass-200)" />
        )}
        {/* Eine Marke je Treffer der Dokumentsuche — nie eine zweite Zählung (§5). */}
        {marken.map((m) => {
          const b = markenBreite(m.anzahl);
          return (
            <rect key={m.id} x={MARKE_X + (BREITE - 2 * MARKE_X - b) / 2} y={m.von * HOEHE}
              width={b} height={markenHoehe(m.von, m.bis)}
              fill={`var(--reg-${register})`}>
              <title>{`${m.label} · ${m.anzahl} ${m.anzahl === 1 ? 'Fundstelle' : 'Fundstellen'}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
