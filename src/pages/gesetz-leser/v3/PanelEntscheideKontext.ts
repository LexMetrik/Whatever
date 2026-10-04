import type { Bezug } from '../../../lib/rechtsprechung/bezuege';

// ─── Nicht-Komponenten-Teil von PanelEntscheide.tsx ─────────────────────────
//
// Ausgelagert (react-refresh/only-export-components) — Muster wie
// `InhaltsKopfKontext.ts` neben `InhaltsKopf.tsx`: Verhalten byte-gleich, nur
// der Ort wechselt.
//
// ─── Befund 6b (Cowork 21.8.2026): Weiterzug-Klammerzusatz erklären ─────────
//
// 272 von 3'795 kantonalen Entscheiden (BS-Tranche, amtliche Kurzzeile statt
// Regeste — s. `manifestRegesteKurz`) tragen einen amtlichen Klammerzusatz
// «(BGer <Az.> vom <Datum>)»: die Quelle selbst vermerkt damit, dass der
// Entscheid ans Bundesgericht weitergezogen wurde. Ohne Erklärung liest sich
// das wie ein Daten-/Render-Fehler. EIN dezenter Hinweis auf GRUPPEN-Ebene
// (nicht je Zeile — Ä106/Icon-Flut-Regel) erscheint nur, wenn mindestens EIN
// Eintrag der Gruppe das Muster trägt.
//
// W2·17-UI-BEFUNDE PE-E1-B02 (1.10.2026): das Muster verlangte wörtlich
// «(BGer … vom … )». GEMESSEN am Korpus (2'604 verschiedene kantonale
// Kurzzeilen): 284 Treffer, aber 450 tragen denselben Vermerk — als
// «(Bundesgerichtsurteil 9C_… vom …)», «(Urteil BGer …)», «(BGer-Nr.: …)», ohne
// Datum («(BGer 4A_…/…)») oder vom Generator nach dem Stichwort gekürzt («(BGer…»,
// «(Bundesgerichtsurteil 9C_84/2023 vom…»). Gruppen mit nur solchen Zeilen
// zeigten kein ⓘ und lasen sich wieder wie ein Daten-/Renderfehler. Erkannt wird
// jetzt: Klammer auf, optional «Urteil», das Stichwort (BGer/BG/Bundesgericht/
// Bundesgerichtsurteil, nicht «BGericht…»), dann «vom» ODER ein Aktenzeichen
// («9C_», «4A_») ODER die Kürzung «…». Bewusst NICHT erfasst: «(Beschwerde beim
// Bundesgericht hängig)» (noch nicht entschieden — eine andere Aussage, die der
// Erklärtext unten falsch beschriebe) und «(aufgehoben durch BGer …)».
export const WEITERZUG_MUSTER =
  /\((?:Urteil )?(?:BGer?|Bundesgericht(?:s?urteil)?)(?![a-zA-Z])(?:[^()]*\bvom\b|[^()]*\d[A-Z]_\d|(?:-Nr\.?)?…)/;
export const WEITERZUG_ERKLAERUNG =
  'Klammerzusatz „BGer …“ oder „Bundesgerichtsurteil …“: der Entscheid wurde ans Bundesgericht weitergezogen.';
/** Exportiert für den gezielten Unit-Test (leser-v3-panel-weiterzug.test.ts) —
 *  reine Zeichenketten-Prüfung, keine Rechtslogik (§3). */
export function traegtWeiterzugHinweis(liste: readonly Bezug[]): boolean {
  return liste.some((b) => !!b.regesteKurz && WEITERZUG_MUSTER.test(b.regesteKurz));
}
