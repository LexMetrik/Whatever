import type { ReactNode, Ref } from 'react';
import { sansAmp } from '../typografie';

// Abschnitts-Kopf der Werkzeug-Seiten (W2·29-WERKBANK-RECHNER R5b): Overline +
// Zwischentitel (`h2`, zweite Gliederungsebene unter dem Seiten-`h1`) + optionaler
// Einleitungssatz. EINE Quelle für den Kopf des Ergebnisblocks (`ErgebnisAnzeige`)
// und die Abschnitte der Sonderseiten (Tagerechner, Verjährungs-Board,
// Inkasso-Strecke) — vorher vier Inline-Varianten (Overline brass/neutral,
// Titel mit/ohne Display-Schnitt, Overline als `h2`). Titel in der
// Display-Stimme, darum `sansAmp` wie im Ergebnis-Titel. Reine Darstellung (§3).
//
// HN-D2 (W2·19-DESIGN-KONSISTENZ, 30.9.2026) · STUFE 2 DER TITELORDNUNG
// (DESIGN-REGLEMENT F0.11): der Abschnittstitel ist überall Archivo 600 in
// `text-h3`. Gemessen stand daneben noch der Wizard-Schritttitel in Literata
// (`vorlagen/wizard.tsx`, dieselbe Stufe, andere Familie) — er kann hierher
// ziehen, sobald der Baustein seine drei Sonderheiten trägt: Fokus-Ziel
// (`titelRef` + `tabIndex`, Sprung aus dem Prüf-Befund), Anker (`id`, die
// Deckungs-Seite schreibt sie) und die Ebene unter einem `h2` (`stufe`).
// Die Aufrufer folgen in HN-D2 PR 2; der Baustein ist bis dahin
// rückwärtskompatibel (Standard = `h2`, kein Anker, kein Fokus-Ziel).
export function AbschnittKopf({ overline, titel, children, className = '', stufe = 2, id, titelRef, tabIndex }: {
  overline?: string;
  titel: string;
  /** Überschriften-Ebene der Umgebung (h2 unter dem Seiten-`h1`, h3 darunter).
   *  Die Darstellung bleibt gleich — nur das Dokument-Outline folgt. */
  stufe?: 2 | 3;
  /** Anker / `aria-labelledby` der Sektion. */
  id?: string;
  /** Fokus-Ziel des Titels (Wizard-Schrittwechsel). */
  titelRef?: Ref<HTMLHeadingElement>;
  /** `-1` = nur programmatisch fokussierbar, keine Tab-Station. */
  tabIndex?: -1;
  /** Einleitung unter dem Titel (Fliesstext, darf Links tragen). */
  children?: ReactNode;
  className?: string;
}) {
  const Titel = stufe === 3 ? 'h3' : 'h2';
  return (
    <div className={`min-w-0${className ? ' ' + className : ''}`}>
      {overline && <p className="lc-overline">{overline}</p>}
      <Titel id={id} ref={titelRef} tabIndex={tabIndex} className="text-h3 font-display font-semibold text-ink-900 mt-0.5">{sansAmp(titel)}</Titel>
      {children && <p className="text-body-s text-ink-600 max-w-reading-s mt-1">{children}</p>}
    </div>
  );
}
