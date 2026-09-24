import type { ReactNode, HTMLAttributes } from 'react';

// Flächen-Primitive: die Werkzeug-Karte der Rechner-Seiten (DESIGN-REGLEMENT
// §R-1 Ziff. 3). EINE Quelle statt des 17× wortgleich kopierten Inline-Wrappers
// (FAHRPLAN-FUNDAMENT / Redesign E2). Reine Darstellung.
// Keine Seitenrahmen, keine Füllung (U2-Nachzug 6.9.2026, Prüfbefund R-5):
// Trennung über Linien. Oben der Registerstrich «Werkzeuge» wie die Abschnitte
// des Boards «Unter-Rechner» (`.lc-werkzeug-karte`, index.css;
// W2·29-WERKBANK-RECHNER R2). Die frühere Variante `padding="md"` hatte keinen
// Aufrufer mehr und fiel weg.
export function Card({ children, className = '', ...rest }: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`lc-werkzeug-karte p-6 sm:p-8${className ? ' ' + className : ''}`} {...rest}>
      {children}
    </div>
  );
}
