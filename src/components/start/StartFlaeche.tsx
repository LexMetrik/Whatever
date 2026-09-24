import { useId, type ReactNode } from 'react';

// ─── Startseite · eine Fläche der rechten Spalte (W2·29-WERKBANK-START-LAYOUT) ──
//
// David 24.9.2026: «ausserdem will ich dass die seite klarer abgerenzt ist» —
// Auswahlfrage mit Bildern → «B eigene Fläche»; dann «aber klarer unterteilt ·
// also auch die spalte selbst». Darum trägt JEDER Teil der Spalte (Schnell-
// werkzeug, Zuletzt) seine eigene Mulde mit Überschrift, statt dass eine
// gemeinsame Fläche beide umschliesst.
//
// Mulde = `--well` (unterste Stufe der Leiter well<paper<surface, F0.1), Radius
// 14 px wie die Kacheln (F0.5 «Fläche/Kachel»), ohne Registerfarbe — die Spalte
// gehört keinem Bestand. Das ist bewusst ein Kasten, nicht eine Linie (F0.6):
// Davids Auswahl vom 24.9.2026 geht hier der Regel vor.
//
// EINE Quelle für beide Flächen (§5): `pages/Startseite.tsx` (Schnellwerkzeug)
// und `start/ZuletztVerwendet.tsx`. Reine Darstellung (§3); je Fläche eine <h2>.
// `@container`: der Inhalt misst die Fläche, nicht das Fenster (Schnellwerkzeug
// @320, `EinfacheFristForm minimal`).
//
// `fuellt` (U4 «Häufig gebraucht», 24.9.2026): die Fläche wird gestreckt, und
// der Inhalt unter der Überschrift nimmt den Rest (`auto 1fr`) statt oben zu
// kleben — sein eigenes Raster verteilt ihn dann ruhig.
export function StartFlaeche({ titel, fuellt, children }: { titel: string; fuellt?: boolean; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id}
      className={`@container grid gap-y-3 rounded-xl bg-well p-5 ${fuellt ? 'grid-rows-[auto_1fr]' : 'content-start'}`}>
      <h2 id={id} className="border-b border-rule pb-1.5 font-sans text-body-s font-semibold text-ink-900">{titel}</h2>
      {children}
    </section>
  );
}
