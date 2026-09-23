import { SuchBereichWahl } from './SuchBereichWahl';
import type { SuchBereich } from '../leserSuche';
import { zaehlform, type BestimmungsWort } from './erlassAnsicht';

// ─── Die klebende Werkzeugzeile der Trefferliste (Kap. 4b, Pos. 5) ──────────
//
// Herausgelöst aus `LeserTrefferListe.tsx` mit Ä103 (18.8.2026, §6.6). Der
// Grund ist nicht die Zeilenzahl, sondern die Zuständigkeit: diese Zone ist
// BEDIENUNG (wo suche ich · wo bin ich · vor/zurück), die Liste darunter ist
// ERGEBNIS. Fünf gemessene Befunde hängen ausschliesslich hier —
// Ä15 (keine Ellipse an der Kernauskunft), Ä30 (wo die Zeile brechen darf),
// Ä84 (Segment-Deckel 18 rem), Ä94 («↑ Anfang» im Stummel; seit W2·29 S4 weg),
// Ä103 (die laufende Stelle) — und ihre Herleitungen gehören zu dem Bauteil,
// das sie bewachen.
//
// SIE RECHNET NICHTS (§3): Zahlen, Reihenfolge und Zustand kommen fertig
// herein; der Zähler bleibt datenseitig (§4.4).
//
// B6-Erbe: sie klebt UNTER Zone A. `--toc-deckel` setzt die Leiste selbst; der
// Rückfall 0px hält den Vorzustand, falls die Marke einmal fehlt. §15.2 CLS 0:
// feste Zeilenhöhen, ab dem ersten Render vorhanden — der Zähler ist
// datenseitig und steht sofort, es wächst nichts nach.

/** W2·29 S4 (Werkbank): eckige Griffe, Tinte statt Messing im Hover; 44 px (A9-DoD). */
const GRIFF = 'inline-flex h-11 w-11 shrink-0 items-center justify-center text-ink-700 transition-colors lc-hover-flaeche hover:text-ink-900';

export function TrefferLeiste({
  anzahl, fundstellen, bestimmungsWort, laufend, hatSprung,
  bereich, setzeBereich, onZurueck, onVor,
}: {
  /** Zahl der TREFFER-ARTIKEL (nicht der Fundstellen). */
  anzahl: number;
  fundstellen: number;
  bestimmungsWort: BestimmungsWort;
  /** 1-basierte laufende Fundstelle; 0 = noch kein Sprung (Ä103). */
  laufend: number;
  hatSprung: boolean;
  bereich: SuchBereich;
  setzeBereich: (b: SuchBereich) => void;
  onZurueck: () => void;
  onVor: () => void;
}) {
  return (
    <div data-treffer-leiste
      style={{ top: 'var(--toc-deckel, 0px)' }}
      className="sticky z-sticky space-y-1 bg-paper pb-1 pt-0.5 text-body-s text-ink-600">
      <SuchBereichWahl wert={bereich} setzeWert={setzeBereich} />
      <div className="flex items-start gap-1">
        {/* ── Ä15 (H2b) · KEINE ELLIPSE AN EINER KERNAUSKUNFT ────────────────
            Gemessen 17.8.2026 in der 280-px-Leiste: «49 Artikel · 110
            Fundstellen» braucht 176 px in einer 148 px breiten Zelle — das
            `truncate` schnitt genau die Zahl weg, um die es geht. §8 verbietet
            das: eine Kernauskunft wird umgebrochen oder gekürzt, nie
            angeschnitten.
            GEWÄHLT: Umbruch, nicht Abkürzung. «9 Art. · 15 Stellen» spart drei
            Zeichen und kostet die Ehrlichkeit der Zahl («Stellen» ist keine
            amtliche Einheit); die zweite Zeile kostet 16 px in einer Zone, die
            nur während einer Suche existiert. `min-h-5` bleibt als
            Ein-Zeilen-Reservierung — der Umbruch tritt erst ein, wenn die Zahl
            ihn braucht, und dann durch eine Nutzer-Eingabe (§15.2). */}
        {/* ── Ä30 (H2b-Nachzug) · DER UMBRUCH SITZT AM TRENNER ──────────────
            Ä15 erlaubte den Umbruch statt der Ellipse — aber ohne zu sagen, WO.
            Gemessen 17.8.2026 an BS-154.125 («Gericht»): der Browser brach
            irgendwo, «15 Paragraphen · 62 Fundstellen» stand zweizeilig mit
            «Paragraphen» allein in Zeile 2, an langen Wörtern auch dreizeilig
            («285 / Paragraphen · 2203 / Fundstellen»). Eine Zahl von ihrer
            Einheit zu trennen ist an einer Kernauskunft dasselbe Übel wie die
            Ellipse (§8).
            JETZT: jedes Segment «Zahl + Einheit» ist ein eigener,
            nicht-umbrechbarer Block (`whitespace-nowrap`), und es gibt GENAU
            EINE Bruchstelle — die hinter dem Trenner «·».
            Zwei Punkte, die dabei gemessen werden mussten:
            (1) Der Trenner klebt am ERSTEN Segment, nicht zwischen den beiden.
            Stünde er frei, könnte er als einzelnes Zeichen an den Anfang der
            zweiten Zeile rutschen — genau das hängende Zeichen, das Ä5 aus der
            Übersichtszeile entfernt hat.
            (2) Die Leerzeichen um den Trenner sind ECHTE Textknoten (`{' '}`),
            nicht `mx-1`. Ohne sie hat die Zeile GAR KEINE Bruchstelle: JSX
            verschluckt Zeilenumbrüche zwischen Elementen, der Absatz kann
            nicht umbrechen, und dann ellipsiert er wieder — gemessen 17.8.2026
            an der StPO/«Kosten» mit `mx-1`: 176 px in 148 px, Höhe 20 px, also
            EINE Zeile mit Überlauf. Der Ä30-Fix hätte damit Ä15 gebrochen. */}
        {/* ── Ä103-NACHZUG (18.8.2026) · DIE LAUFENDE STELLE BEKOMMT EINE
               EIGENE ZEILE ──────────────────────────────────────────────────
            GEMESSEN nach dem ersten Ä103-Bau: die ausgeschriebene Form
            («Fundstelle 0 von 88», ~110 px statt ~35 px für «–/88») nahm der
            Zählzeile daneben so viel Breite, dass sie in der 280-px-Spalte
            wieder ellipsierte — `leser-v3-auskunft` (Ä15) wurde rot mit
            «49 Artikel · 110 Fundstellen ist ellipsiert». Ein Fix, der einen
            anderen Befund derselben Zeile zurückholt, ist keiner.
            JETZT stehen die beiden Auskünfte UNTEREINANDER statt nebeneinander
            — sie beantworten ohnehin verschiedene Fragen («was gibt es» /
            «wo bin ich»). Die Zeilenhöhe wächst dadurch NICHT: die beiden
            44-px-Sprungknöpfe rechts geben die Höhe vor (20 + 16 = 36 px
            passen darunter), also auch kein CLS (§15.2). */}
        <div className="min-w-0 flex-1">
          <p className="min-h-5 leading-snug">
            <span className="whitespace-nowrap">
              <span className="num">{anzahl}</span> {zaehlform(anzahl, bestimmungsWort)}
              {' '}<span aria-hidden className="text-ink-300">·</span>
            </span>
            {' '}
            <span className="whitespace-nowrap"><span className="num">{fundstellen}</span>{fundstellen === 1 ? ' Fundstelle' : ' Fundstellen'}</span>
          </p>
          {hatSprung && (
            // Ä103: `whitespace-nowrap` hält Wort und Zahlen zusammen
            // (dieselbe Ä30-Regel wie an der Zählzeile darüber).
            // ── P1-2 (Bug-Check-Nachzug 18.8.2026) · «FUNDSTELLE 0 VON 88» ──
            // GEMESSEN direkt nach einer Suche, vor dem ersten Sprung: die
            // Zeile las «Fundstelle 0 von 88». Es GIBT keine nullte Fundstelle
            // — die Zeile beantwortete «wo bin ich» mit einer Position, die
            // der Erlass nicht kennt (§8), und weil sie `aria-live` trägt,
            // sprach ein Screenreader sie bei jedem Tastendruck mit aus.
            // JETZT sagt sie in diesem Zustand, was wirklich der Fall ist —
            // es ist noch keine gewählt — und wiederholt dahinter den Umfang,
            // damit die Live-Ansage für sich allein verständlich bleibt (wer
            // sie hört, sieht die Zählzeile darüber nicht).
            <p data-treffer-position role="status" aria-live="polite"
              className="min-h-4 whitespace-nowrap text-micro lc-ziffern text-ink-600">
              {laufend > 0
                ? <>Fundstelle <span className="num">{laufend}</span> von <span className="num">{fundstellen}</span></>
                : <>keine gewählt <span aria-hidden className="text-ink-300">·</span> <span className="num">{fundstellen}</span> {fundstellen === 1 ? 'Fundstelle' : 'Fundstellen'}</>}
            </p>
          )}
        </div>
        {hatSprung && (
          <>
            {/* A9-DoD: 44×44-px-Tap-Ziele, echte <button>, aria-label. */}
            <button type="button" onClick={onZurueck} data-treffer-zurueck
              aria-label="Vorherige Fundstelle" title="Vorherige Fundstelle (↑)"
              className={GRIFF}>
              <span aria-hidden className="lc-griff-glyph">↑</span>
            </button>
            <button type="button" onClick={onVor} data-treffer-vor
              aria-label="Nächste Fundstelle" title="Nächste Fundstelle (↓)"
              className={GRIFF}>
              <span aria-hidden className="lc-griff-glyph">↓</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
