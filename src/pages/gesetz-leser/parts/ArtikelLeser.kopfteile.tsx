import { FnRef } from '../../../components/normtext/ArtikelBody';
import { WJ } from '../../../components/normtext/wortverbinder';
import { margStufeStil, margLabel } from '../helpers';

// ═══ Der RANDTITEL des Artikels (Inventar 2.3.3) ═══════════════════════════
//
// §6.6-Split aus `./ArtikelLeser.tsx` (W2·24-F, 7.9.2026): beide Satzspiegel-
// Formen zeigen DASSELBE Markup an zwei Orten — die Zeilenform als Zeile über
// «Art. N», die Breitform im Artikelkopf (§5: eine Quelle für die Stufen-Stimme).
// Der zweite Kopfteil, der Fassungs-Slot, ist mit D40 (7.9.2026) ersatzlos
// gefallen: die Fassung ist eine Rubrik der Funktionszeile. Der Dateiname
// bleibt, weil datierte Belege auf ihn zeigen (§0 Ziff. 2b).
//
// KEIN PRÄDIKAT «hat der Randtitel Inhalt?» hier: die Frage stellt
// `./ArtikelLeser.tsx` selbst (`randInhalt`), und diese Datei exportiert nur
// Komponenten (Fast-Refresh-Regel).

/** Die Randtitel selbst — in beiden Formen DASSELBE Markup, nur an einem
 *  anderen Ort (§5: eine Quelle für die Stufen-Stimme, `helpers.tsx`). */
export function RandTitel({ marg, margBasis, titel, artikel, markerOffen, fnProSektion, fnKlasse }: {
  marg?: string[];
  margBasis?: number;
  titel?: string | null;
  artikel: string;
  /** Ist der Artikel aufgeklappt? Nur dann stehen die Fussnoten-Marker an den
   *  Randtiteln — ihr Ziel (`<p id="fn-…">`) lebt im aufgeklappten Block. */
  markerOffen: boolean;
  fnProSektion: Record<string, string[]>;
  fnKlasse: Record<string, string>;
}) {
  return marg && marg.length > 0 ? (
    <div className="mb-1 space-y-0.5 font-serif leading-snug">
      {marg.map((m, i) => (
        // `lr-blatt` markiert die unterste Stufe (die Sachüberschrift des
        // Artikels). Nur sie wird in der Breitform zur kursiven Serifen-Zeile
        // (die Regel sitzt am Artikelkopf in `./ArtikelLeser.tsx`); die
        // Vorfahren-Stufen bleiben Grotesk.
        <div key={i} className={`${margStufeStil((margBasis ?? 0) + i, i === marg.length - 1)}${i === marg.length - 1 ? ' lr-blatt' : ''}`}>
          {/* A30: bis/ter-Suffix des Enumerators hochgestellt (margLabel). */}
          {margLabel(m)}
          {/* G11: section-heading-Fussnoten-Marker an der passenden Randtitel-
              Zeile (blatt im Volltext, ganze Kette in der Suchsicht). G2b:
              immer (an artOffen gebunden), Prominenz via data-fussnoten-CSS.
              A31: Wort-Verbinder (U+2060) klebt den Marker DIREKT an den
              Randtitel (kein Abstand, kein Umbruch auf eine eigene Zeile). */}
          {markerOffen && fnProSektion[m]?.map((nr, j) => (
            <span key={nr} data-fn-marker data-fn-klasse={fnKlasse[nr]}>{WJ}{j > 0 && <span className="align-super text-[length:var(--hochgestellt)] text-ink-500">,</span>}<FnRef artikel={artikel} nr={nr} /></span>
          ))}
        </div>
      ))}
    </div>
  ) : titel ? (
    /* S2 · Ä7: derselbe Stil wie das Randtitel-BLATT in `margStufeStil`
       (dort steht die Herleitung) — es ist dieselbe Rolle, nur aus der
       anderen Quelle (`article_title` statt `marg`). Beide müssen gleich
       aussehen, sonst wechselt die Sachüberschrift zwischen Artikeln ihre
       Stimme (§5). */
    <div className="lr-blatt mb-1 font-sans text-leser-rand font-semibold text-ink-800">
      {titel}
    </div>
  ) : null;
}
