// ─── Der EINE Leerzustand (W2·19-DESIGN-KONSISTENZ · B1/BAU-3, Befund D-7) ───
//
// DER BEFUND: dieselbe Aussage — «hier ist gerade nichts» — trug site-weit drei
// Bauformen: den nackten Absatz (`text-body-s text-ink-500`, 12 Fundstellen),
// die `lc-notice`-Box (2 Fundstellen) und, auf /materialien, eine FRAGE an den
// Nutzer («Filter zurücksetzen?»). Kanon ist damit die verbreitetere Form: der
// nackte Absatz (§1 des Fahrplans — schweigt das Reglement, gewinnt die
// verbreitetere Form). Die Box ist der Abdeckungslücke mit eigener Erklärung
// vorbehalten (IA-2/§11.1), nicht dem gewöhnlichen Null-Treffer.
//
// ZWEI NUTZUNGEN, EIN BAUSTEIN — und die Wortlaut-Zweiteilung ist
// BEDEUTUNGSTRAGEND (Befund-Protokoll «verworfen/kein Befund», Runde 1):
//   · `art="filter"`  — es GÄBE etwas, der aktuelle Filter-/Suchzustand
//     verdeckt es nur. Wortlaut «Kein X gefunden.» Der Weiterweg ist PFLICHT
//     (C1: «nie eine Sackgasse») — hier vom Typ erzwungen, nicht von der
//     Sorgfalt der nächsten Leserin: `weiterweg` ist in dieser Variante ein
//     Pflichtfeld, ein Aufruf ohne ihn kompiliert nicht.
//   · `art="bestand"` — es gibt schlicht nichts zu zeigen. Wortlaut «Keine X
//     erfasst.» Ein Weiterweg ist zulässig, aber nicht zu erfinden: wo kein
//     echter Ausweg existiert, wäre ein Knopf ohne Wirkung eine Fehlversprechung
//     (§8). Darum optional statt Pflicht.
//
// AUSSAGESATZ, NIE FRAGE (§8): der Leerzustand berichtet einen Zustand; die
// Handlungsmöglichkeit steht als Bedienelement daneben, nicht als rhetorische
// Frage im Satz. «Filter zurücksetzen?» sah aus wie eine Rückfrage und war doch
// nur ein Hinweis — der Knopf ist die ehrliche Form derselben Auskunft.
// Bewacht in `src/tests/leerzustand-d7.test.tsx` (Aufrufstellen-Sonde).
//
// Reine Darstellungsschicht (§1/§3) — kein Filterzustand, keine Rechtslogik.

import { Link } from 'react-router-dom';

/** Der Weiterweg aus dem Leerzustand: EIN Bedienelement mit EINER Wirkung.
 *  Bewusst kein freier ReactNode — sonst hätte jede Aufrufstelle wieder ihre
 *  eigene Optik, und genau die Streuung behebt D-7 (§5/§10: Konsumenten auf
 *  einen Baustein). Zwei Formen, je nach Wirkung: `onKlick` setzt einen
 *  lokalen Zustand zurück (Knopf); `href` verlässt die Seite (Link, R6-B:
 *  fehlt ein Rücksetzer, ist der einzig ehrliche Ausweg eine Navigation). */
type LeerzustandWeiterweg = {
  /** Beschriftung im Imperativ, ohne Fragezeichen («Filter zurücksetzen»). */
  text: string;
} & ({ onKlick: () => void; href?: never } | { href: string; onKlick?: never });

type Basis = {
  /** Der Aussagesatz. Endet mit «.», nie mit «?» (Sonde im Test). */
  text: string;
};

export type LeerzustandProps =
  | (Basis & { art: 'filter'; weiterweg: LeerzustandWeiterweg })
  | (Basis & { art: 'bestand'; weiterweg?: LeerzustandWeiterweg });

export function Leerzustand(props: LeerzustandProps) {
  const { text } = props;
  const weiterweg = props.weiterweg;
  return (
    <p data-leerzustand={props.art} className="text-body-s text-ink-500">
      {text}
      {weiterweg && (
        <>
          {' '}
          {/* Gleiche Aktions-Grammatik wie die «zurücksetzen»-Zeile der
              Filterleiste (EntscheidFilter) — Knopf ODER Link sind im Absatz
              gültiges Inhaltsmodell (phrasing content), der Fokusring kommt
              unverändert vom globalen :focus-visible (F3). */}
          {weiterweg.href
            ? <Link to={weiterweg.href} className="font-medium text-brass-700 hover:text-brass-600">
                {weiterweg.text}
              </Link>
            : <button type="button" onClick={weiterweg.onKlick}
                className="font-medium text-brass-700 hover:text-brass-600">
                {weiterweg.text}
              </button>}
        </>
      )}
    </p>
  );
}
