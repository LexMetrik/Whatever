import type { ReactNode } from 'react';
import { usePaneKlasse } from '../layout/PaneKontext';

// ─── A-1 (W2·19-DESIGN-KONSISTENZ, 31.8.2026) · EIN SEITENTITEL ─────────────
//
// BEFUND der Finder-Welle: die H1 der Seite wurde an vier Stellen von Hand
// nachgebaut — `layout/SeitenKopf`, `layout/RechnerKopf`, `vorlagen/wizard`,
// `gesetz-leser/parts/ErlassLeserKopf` (EntscheidLeser folgt in BAU-4) — und
// alle vier trugen dieselbe VIEWPORT-Kaskade `text-h2 sm:text-h1`. Im
// Split-View ist der Viewport die falsche Zahl: eine 620-px-Pane in einem
// 1440-px-Fenster liest `sm:` als erfüllt und setzt den Titel in der
// Vollansichts-Grösse (32 px) in eine halbe Spalte. Die Kaskade ist gemessen
// die einzige Layout-Aussage des Titels, und sie stand vierfach da.
//
// KANON IST DIE PANE-FÄHIGE FORM — dieselbe Herleitung wie in
// `pages/gesetz-leser/v3/kopfStufen.ts` (dort Z. 17/18): «Ein `xl:`-Präfix hätte
// im Pane den Viewport gemessen und dort das Desktop-Bild in eine 620-px-Spalte
// gezwungen.» `usePaneKlasse` (§5, `layout/PaneKontext`) wählt darum je
// Kontext:
//   · ausserhalb eines Panes → `text-h2 sm:text-h1` (unverändert, Prerender
//     byte-gleich zum Vorzustand);
//   · im Pane                → `text-h2 @xl/pane:text-h1`, gemessen an der
//     PANE-Breite (`@container/pane` liegt am Scroll-Element, `layout/Pane.tsx`).
//
// Reine Darstellung (§3), keine Rechtslogik. Der Baustein rendert die H1
// SELBST (nicht nur eine Klassenzeichenkette): sonst bliebe die Doppelung
// «welches Tag, welche Stimme, welches Gewicht» an vier Stellen stehen und nur
// die Kaskade wäre geteilt (§5/§10).

// ─── HN-D2 (W2·19-DESIGN-KONSISTENZ, 30.9.2026) · STUFE 1 DER TITELORDNUNG ─────
//
// GEMESSEN (30.9.2026, 1440 hell, vite preview von dist/): derselbe Baustein
// zeichnete die H1 in drei Gestalten — Gewicht 400 auf den 12 Seiten im
// Titelblatt-Band (`.ub-kopf h1`, index.css überschrieb `font-semibold` von
// aussen), 600 in Leser, Entscheid und Material, und im Lesemodus-Overlay die
// Voreinstellung «display» (Archivo) für DIESELBE BGE-Zitierung, die der
// EntscheidLeser in Literata setzt. Soll ist die Mehrheit und das Reglement
// (F0.4 «Literata liest», F0.11): Stufe 1 = Literata, Gewicht 400, von
// DIESEM Baustein selbst gesetzt — die Überschreibung im Band fällt weg
// (§17-Rückbau: die Regel trägt jetzt der Baustein, nicht ein Selektor daneben).
// Die Display-Stimme hat keinen Aufrufer mehr und ist gestrichen; die Prop
// `stimme` bleibt nur als Übergang (PR 2 zieht die Aufrufer um, dann entfällt sie).

/**
 * Schriftstimme des Titels (DESIGN-REGLEMENT F0.11, Stufe 1): die Serif-Stimme
 * des Gelesenen. Es gibt keine zweite Stimme mehr — die Prop bleibt nur, weil
 * `ErlassLeserKopf` (gesetz-leser, Fläche im Umbau) sie noch schreibt; die
 * übrigen Aufrufer sind seit HN-D2 PR 2 (30.9.2026) umgestellt.
 */
export type TitelStimme = 'serif';

export function SeitenTitel({ className, id, children }: {
  /** @deprecated — letzter Verwender ErlassLeserKopf (gesetz-leser, Nachzug).
   *  Wird nicht gelesen, die Stimme ist immer `serif`. */
  stimme?: TitelStimme;
  /** Zusätzliche Klassen des Aufrufers (Umbruch-Regeln, Höhen-Reservierung). */
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  const pk = usePaneKlasse();
  const klassen = [
    pk('text-h2 sm:text-h1', 'text-h2 @xl/pane:text-h1'),
    'font-serif font-normal text-ink-900',
    className,
  ].filter(Boolean).join(' ');
  return <h1 id={id} className={klassen}>{children}</h1>;
}
