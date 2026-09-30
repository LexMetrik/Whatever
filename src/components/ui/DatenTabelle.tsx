import type { ReactNode } from 'react';

// ─── DatenTabelle — die EINE einfache Datentabelle (HN-D6 / DK-14, 30.9.2026) ─
//
// BEFUND (Herz-und-Nieren-Prüfung 24.9.2026, DK-14): acht handgebaute
// `<table>` in sieben Dateien (GrundbuchEintragForm, BeurkundungForm,
// ProzesskostenForm ×2, ErbteilungForm, NotariatGrundbuchForm,
// RechnerVerjaehrungBoard, MaterialienDeckung) trugen vier Zellpolster-Muster,
// drei Kopf-Tinten (ink-500/ink-600/Standard) und zwei Ziffern-Klassen — kein
// Tabellen-Baustein (§10).
//
// DIESER Baustein ist die ruhige Grundform: Kopfzeile in `ink-600` mit
// Haarlinie, Zeilen mit Haarlinie, Polster `py-2 pr-4` (die letzte Spalte ohne
// rechten Rand), Zahlenspalten rechtsbündig mit Tabellenziffern (`num`, die eine
// Ziffern-Klasse des Hauses) und `whitespace-nowrap`. Er zeichnet nur — welche
// Werte in den Zellen stehen, liefert der Aufrufer unverändert (§3). Die
// Zeilenumbruch-/Scroll-Hülle (`overflow-x-auto`) und Mindestbreite bleiben beim
// Aufrufer: sie hängen an der Seite, nicht an der Tabelle.
//
// NICHT gedeckt (bewusst, eigene Bausteine): die sortierbare Deckungstabelle
// (`MaterialienDeckung`, Sortier-Köpfe, `<th scope="row">`) und Tabellen mit
// Summenzeile/Spalten-Spannen (Kosten-Tabellen der Formulare, PR 2–4 nach den
// RL-Formular-PRs).

export interface DatenSpalte {
  /** Spaltenkopf. */
  kopf: ReactNode;
  /** Zahlenspalte: rechtsbündig, Tabellenziffern, kein Umbruch. */
  ziffern?: boolean;
  /** Zusätzliche Klassen an jeder Zelle der Spalte (z. B. Tintenstufe). */
  zelle?: string;
}

export interface DatenZeile {
  key: string;
  /** Eine Zelle je Spalte, in Spaltenreihenfolge. */
  zellen: readonly ReactNode[];
}

export function DatenTabelle({ spalten, zeilen, className }: {
  spalten: readonly DatenSpalte[];
  zeilen: readonly DatenZeile[];
  className?: string;
}) {
  const letzte = spalten.length - 1;
  const klassen = (...teile: (string | false | undefined)[]) => teile.filter(Boolean).join(' ');
  return (
    <table className={klassen('w-full text-body-s border-collapse', className)}>
      <thead>
        <tr className="text-left text-ink-600 border-b border-line">
          {spalten.map((sp, i) => (
            <th key={i} className={klassen('py-2', i < letzte && 'pr-4', 'font-medium', sp.ziffern && 'text-right whitespace-nowrap')}>
              {sp.kopf}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {zeilen.map((z) => (
          <tr key={z.key} className="border-b border-line align-top">
            {spalten.map((sp, i) => (
              <td key={i} className={klassen('py-2', i < letzte && 'pr-4', sp.ziffern && 'num text-right whitespace-nowrap', sp.zelle)}>
                {z.zellen[i]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
