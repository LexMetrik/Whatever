import { useMemo } from 'react';
import {
  bereichZuId, feldBeiAnteil, landkarteBaender, landkarteMarken,
  type LandkarteFeld,
} from './landkarteModell';

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
// keine von 48 — s. `BREITE` unten). Der Streifen liegt darum `fixed` am
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

/**
 * Breite des Streifens in PIXELN — zugleich der Klickstreifen und die x-Achse
 * des SVG-Koordinatensystems. (Der Kommentar hier sagte bis zum Fertigbau
 * 21.9.2026 fälschlich «rem»; gemeint und gebaut waren immer px, `style.width`
 * setzt sie als solche.)
 *
 * 48 px = die Untergrenze des Richtwerts 48–64 px aus
 * `fahrplaene/FAHRPLAN-RECHERCHE-KOMFORT.md` §1/L-1. Sie kostet die Lesespalte
 * gemessen nichts: der Streifen ist `fixed` und liegt mit `right-3` (12 px) in
 * der 104 px breiten Randluft ab 1280 px Fensterbreite — 60 px belegt, 44 px
 * frei. Breiter zu werden hiesse, Platz zu verbrauchen, den die Landkarte für
 * drei Marken-Stufen nicht braucht (`markenBreite`).
 */
const BREITE = 48;
/** Höhe des SVG-Koordinatensystems. Der Streifen wird auf die Elementhöhe
 *  gezogen (`preserveAspectRatio="none"`), die Zahl ist reine Rechenauflösung. */
const HOEHE = 1000;
/** Mindesthöhe einer Marke in Koordinaten-Einheiten (≈ 2.5 px bei 600 px Höhe).
 *  Ohne sie verschwände ein kurzer Artikel in einem langen Erlass. */
const MARKE_MIN = 4;
/** Seitliche Einfassung der Marken — die Kanten des Streifens bleiben sichtbar. */
const MARKE_X = 6;

/** Wie breit eine Marke gerät: drei Stufen nach Dichte (§8: die Stufe ist
 *  benannt, nicht stufenlos interpoliert — «viel» und «wenig» soll man
 *  unterscheiden können, nicht schätzen müssen). */
function markenBreite(anzahl: number): number {
  const voll = BREITE - 2 * MARKE_X;
  if (anzahl >= 5) return voll;
  if (anzahl >= 2) return voll * 0.7;
  return voll * 0.45;
}

export function TrefferLandkarte({
  spur, treffer, leseId, register, obenVar, gesamtFundstellen, onSprung,
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
  /** Fundstellen im ganzen Dokument — für den zugänglichen Namen. Kommt aus
   *  dem Zähler des Lesers, wird hier nicht nachgerechnet (§5). */
  gesamtFundstellen: number;
  /** Klick auf Streifen oder Marke: Sprung zum Baustein. */
  onSprung: (id: string) => void;
}) {
  const marken = useMemo(() => landkarteMarken(spur, treffer), [spur, treffer]);
  const baender = useMemo(() => landkarteBaender(spur), [spur]);
  const lese = useMemo(() => bereichZuId(spur, leseId), [spur, leseId]);

  // Ohne Spur gibt es nichts abzubilden — dann steht auch kein Streifen (§8).
  if (spur.length === 0) return null;

  const name = `Treffer-Landkarte: ${gesamtFundstellen} ${gesamtFundstellen === 1 ? 'Fundstelle' : 'Fundstellen'}`
    + ` in ${marken.length} ${marken.length === 1 ? 'Abschnitt' : 'Abschnitten'} des Dokuments`;

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
            im Streifen bleibt (§13, Handschrift 4/6). */}
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
              width={b} height={Math.max(MARKE_MIN, (m.bis - m.von) * HOEHE)}
              fill={`var(--reg-${register})`}>
              <title>{`${m.label} · ${m.anzahl} ${m.anzahl === 1 ? 'Fundstelle' : 'Fundstellen'}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
