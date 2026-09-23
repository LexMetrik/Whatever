import { createContext, useContext } from 'react';

// ═══ W2·24-R6b · DIE FORM DES ARTIKELS (Zeilenform / Breitform) ═════════════
//
// ── WAS HIER ZURÜCKGEBAUT WURDE UND WARUM (Auftrag David 6.9.2026) ─────────
// Wörtlich: «der platz rechts und links neben dem gesetz für bspw. rechner
// oder fassung nimmt viel platz vom gesetzestext weg. kannst du das besser
// gestalten.»
//
// R4/R6 hatten aus dem Referenzbild einen dreispaltigen Satzspiegel gebaut:
// links eine 150-px-Marginalie (Randtitel, Fassung), rechts eine 210-px-Spalte
// mit den Bezügen. GEMESSEN kostete das die Lese-Zelle 150 + 210 + 2 × 36 =
// **432 px** — und genau das ist Davids Befund. Beide Randspuren sind darum
// ERSATZLOS gefallen; ihr Inhalt steht seither im ARTIKELKOPF, wo er ohne
// eigene Spalte auskommt (`parts/ArtikelLeser.tsx`):
//   · der Randtitel als kursive Literata-Zeile über der Artikelnummer,
//     das Fassungsdatum klein daneben;
//   · die Bezüge als EINE aufklappbare Zeile unter dem Kopf.
// Nichts geht verloren, es wechselt die Form (dieselbe Regel, die schon für
// den Pane galt) — und die Textspalte bekommt die 432 px zurück.
//
// Mit den Spalten sind die Stufe `'marg'`, die beiden Schwellen
// `SPIEGEL_MIN_MARG`/`SPIEGEL_MIN_VOLL` und die Rahmen-Aufweitung
// `spiegelMitAufweitung` gestrichen: sie hatten keinen Konsumenten mehr
// (§17-Gegengewicht — was nicht mehr scheitern kann, wird gelöscht statt
// bewacht). Die Aufweitung des Rahmens bleibt allein dem Beiwerk-Blatt, wie
// vor R6 (`rahmenSpalten.ts`, `blattSpur`).

/**
 * Kleinste Lese-Zelle (rem), die die Breitform trägt.
 *
 * ── HERGELEITET AUS DER EINEN ZUSAGE DER BEZÜGE-ZEILE ──────────────────────
 * Die Breitform verspricht «eingeklappt = EINE Zeile». Bricht die Zeile um,
 * ist die Zusage gebrochen und die Zeilenform wäre ehrlicher. Massgeblich ist
 * darum die Breite, die der längste realistische Zeilentext braucht:
 *   «Bezüge · 4'140 Entscheide · 12 Verweise · 3 Rechner ›»
 * — 4'140 ist die grösste am Korpus gemessene Kantenzahl an einem Artikel
 * (OR 41, R6-Protokoll §2). GEMESSEN im `dist`-Preview (Archivo 0.75 rem,
 * Marken mit Registerstrich und Lücken): **421 px**. Aufgerundet auf die
 * nächste halbe rem-Stufe und um die Kopfzeile daneben (Artikelnummer,
 * Zitat/Permalink) nicht zu quetschen: 28 rem = 448 px.
 *
 * Dieselbe Zahl nennt `rahmenSpalten.LESE_MIN` als Untergrenze einer
 * Lesespalte überhaupt (≈ 46 ch) — sie bleibt dort eigenständig stehen, weil
 * sie eine ANDERE Frage beantwortet («trägt die Zelle noch eine Lesespalte?»
 * statt «trägt sie die Bezüge-Zeile ohne Umbruch?»). Dass beide auf 28 rem
 * landen, ist ein Zusammentreffen, keine gemeinsame Quelle; sie zu verschmelzen
 * hiesse, zwei Entscheide aneinanderzubinden, die getrennt wandern dürfen (§5
 * gilt für EINEN Fachinhalt, nicht für zwei gleich grosse Zahlen).
 */
const SPIEGEL_MIN_BREIT = 28;

/** Form, in der ein Artikel gesetzt wird. */
export type Satzspiegel =
  /** Ist-Form: Randtitel als Zeile über dem Artikel, Beiwerk darunter.
   *  Gilt im Pane, auf dem Handy, in der Trefferliste und ohne Provider. */
  | 'zeile'
  /** Breitform: Randtitel + Fassung im Artikelkopf, Bezüge als eine
   *  aufklappbare Zeile darunter — keine Randspalten. */
  | 'breit';

/**
 * Die Form, die der Leser gerade fährt.
 *
 * Kontext statt Prop, weil `ArtikelLeser` in mehreren Hüllen gerendert wird und
 * nur eine davon den Rahmen kennt. Die Vorgabe ist die Ist-Form (`'zeile'`): wo
 * kein Provider steht, ändert sich nichts (§6, Verhaltensneutralität).
 */
export const SatzspiegelKontext = createContext<Satzspiegel>('zeile');

/** Liest die Form; ohne Provider die Ist-Form. */
export function useSatzspiegel(): Satzspiegel {
  return useContext(SatzspiegelKontext);
}

/**
 * Die Form zu einer gemessenen Lese-Zelle — rein, an jeder Breite nachrechenbar
 * (§2).
 *
 * @param zellePx  Breite der Lese-ZELLE in px — die Fläche, die dem Artikel
 *                 nach Gliederungs- und Blatt-Spur bleibt (`rahmenSpalten.ts`
 *                 rechnet sie aus denselben Spur-Massen). `null`, solange
 *                 nichts gemessen ist: dann gilt die Ist-Form — der Leser
 *                 startet einspaltig und wechselt erst, wenn die Breite belegt
 *                 ist, nie umgekehrt (ein Kopf, der beim ersten Paint wieder
 *                 zusammenfällt, wäre ein Layout-Sprung).
 * @param remPx    Gemessene Wurzel-Schriftgrösse; die Schwelle steht in rem,
 *                 weil der Schriftregler sie mitzieht.
 * @param breitLage `false` im Pane und ohne Spalten-Lage. Der Pane behält die
 *                 Zeilenform, weil dort dieselbe harte Regel gilt wie seit R4
 *                 («nie drei vertikale Flächen») und weil beide Hälften
 *                 dieselbe Form tragen sollen (Auftrag David, Split-View).
 */
export function satzspiegelFuer(
  zellePx: number | null, remPx: number, breitLage: boolean,
): Satzspiegel {
  if (!breitLage || zellePx == null) return 'zeile';
  return zellePx >= SPIEGEL_MIN_BREIT * remPx ? 'breit' : 'zeile';
}
