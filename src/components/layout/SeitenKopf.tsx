import type { ReactNode } from 'react';
import { SeitenTitel } from '../ui/SeitenTitel';

// Gemeinsamer Kopf der Kataloge und der statischen/Sekundärseiten (Redesign
// E10): löste die zuvor 4× von Hand nachgebauten Köpfe ab — die stille Drift
// verschwand damit an EINER Stelle. Reine Darstellung (§3).
//
// W2·29-WERKBANK-KATALOGE K1 (23.9.2026, Boards «Unter-*»): der Kopf ist ein
// TITELBLATT-BAND (`.ub-kopf`, index.css) — Overline · H1 in der Serif-Stimme ·
// Ausgabe-Zeile auf der Registerfläche der Route (`--reg-*-flaeche`, F0.2 i. d.
// F. 22.9.2026) mit 2-px-Registerstrich oben; ohne Register (Meta-Seiten)
// neutral auf `--well` mit Tintenstrich. Dieselbe Anatomie wie das Leser-
// Titelblatt (S2). Der Registerstrich IST die Ablesekante: die frühere
// `scale-rule` unter der Overline entfällt. Intro und Filterzeile (`children`)
// stehen unter dem Band auf dem Papier.
export function SeitenKopf({ overline, ausgabe, titel, intro, children }: {
  /** Etikett ÜBER dem Titel (statische Seiten). Entfällt auf den Übersichten. */
  overline?: string;
  /** D22/R12A: Ausgabe-Zeile UNTER dem Titel (Zähler aus dem Register). */
  ausgabe?: ReactNode;
  titel: string;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {/* D22 (David 6.9.2026): der Titel steht zuerst, die Ausgabe-Zeile direkt
          darunter; `overline` nur auf den statischen Seiten, wo es die Rubrik
          benennt, nicht den Bestand. */}
      <div className="ub-kopf space-y-1">
        {overline && <p className="lc-overline">{overline}</p>}
        {/* A-1: die H1 kommt aus dem EINEN Titel-Baustein (`ui/SeitenTitel`). */}
        <SeitenTitel stimme="serif">{titel}</SeitenTitel>
        {ausgabe && <p className="ub-ausgabe">{ausgabe}</p>}
      </div>
      {/* T1/L5 (29.8.2026, W2·11-DESIGN): der Lead lief ohne Lesespalte über die
          volle Breite — gemessen @1440 `/gesetze` 89.3 ch/Zeile, `/suche` 105 ch,
          über WCAG 2.2 SC 1.4.8 (≤ 80 ch) und DESIGN-REGLEMENT B2. */}
      {intro && <p className="max-w-reading text-body-l text-ink-600 leading-relaxed">{intro}</p>}
      {children}
    </div>
  );
}
