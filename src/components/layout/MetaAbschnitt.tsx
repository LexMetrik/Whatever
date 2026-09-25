import type { ReactNode } from 'react';
import { AbschnittKopf } from './AbschnittKopf';

// Abschnitt der statischen Seiten (/methodik, /ueber, /datenschutz) —
// W2·29-WERKBANK-REST S3 (25.9.2026). Vorher trug jede Seite ihre eigene
// Abschnitts-Hülle: `Methodik` eine Inline-`<section>`, `Datenschutz` eine
// wortgleiche lokale Funktion `Abschnitt`, `Ueber` Zwischentitel in einer
// dritten Stimme (`font-medium`, ohne Display-Schnitt). Jetzt EINE Quelle
// (§5/§10), in der Anatomie der Einstellungen-Gruppen (Board
// «Unter-Einstellungen»: Tinten-Linie oben statt Kasten, F0.6) mit dem
// Werkzeug-Abschnittskopf (`AbschnittKopf`, R5b) als Zwischentitel.
// Die Linie trägt `.meta-abschnitt` (index.css, bei `.es-gruppe`) — dieselbe
// Regel wie die Einstellungen, nicht eine zweite. Reine Darstellung (§3).
export function MetaAbschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="meta-abschnitt">
      <AbschnittKopf titel={titel} />
      <div className="mt-2 space-y-2 text-body-s text-ink-600 leading-relaxed max-w-reading">{children}</div>
    </section>
  );
}
