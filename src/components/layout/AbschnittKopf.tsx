import type { ReactNode } from 'react';
import { sansAmp } from '../typografie';

// Abschnitts-Kopf der Werkzeug-Seiten (W2·29-WERKBANK-RECHNER R5b): Overline +
// Zwischentitel (`h2`, zweite Gliederungsebene unter dem Seiten-`h1`) + optionaler
// Einleitungssatz. EINE Quelle für den Kopf des Ergebnisblocks (`ErgebnisAnzeige`)
// und die Abschnitte der Sonderseiten (Tagerechner, Verjährungs-Board,
// Inkasso-Strecke) — vorher vier Inline-Varianten (Overline brass/neutral,
// Titel mit/ohne Display-Schnitt, Overline als `h2`). Titel in der
// Display-Stimme, darum `sansAmp` wie im Ergebnis-Titel. Reine Darstellung (§3).
export function AbschnittKopf({ overline, titel, children, className = '' }: {
  overline?: string;
  titel: string;
  /** Einleitung unter dem Titel (Fliesstext, darf Links tragen). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0${className ? ' ' + className : ''}`}>
      {overline && <p className="lc-overline">{overline}</p>}
      <h2 className="text-h3 font-display font-semibold text-ink-900 mt-0.5">{sansAmp(titel)}</h2>
      {children && <p className="text-body-s text-ink-600 max-w-reading-s mt-1">{children}</p>}
    </div>
  );
}
