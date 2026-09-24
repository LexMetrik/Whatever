import { Link } from 'react-router-dom';
import type { Normverweis } from '../../types/legal';
import { NormText } from '../NormText';

// ─── Fuss der Schnellformen (Startseite, U2 24.9.2026) ───────────────────────
//
// EIN Baustein für Verzugszins- und Verjährungs-Schnellform (§10): Normbezüge,
// offengelegte Annahmen und der Weiterweg in den vollen Rechner.
//
// NORMBEZÜGE als verlinkter Fliesstext statt Chip-Reihe: die Engines liefern
// ihre volle Normliste (Verzugszins: 7 Artikel) — als `NormLink`-Chips waren
// das @280 px vier Zeilen, gemessen 24.9.2026 (Fläche 1420 px statt 660). Der
// Text ist `NormText`, dieselbe Verweis-Erkennung wie überall (Fedlex-Link je
// Artikel, §7 c); keine Norm fällt weg (§8).
//
// HINWEISE UND VORBEHALTE der Engine (`warnungen`) stehen im vollen Rechner
// hinter dem eingeklappten Kopf «Hinweise / Vorbehalte (n)» (`ErgebnisAnzeige`,
// bei Status «ok» zu). Die Schnellform nennt dieselbe Zahl und führt dorthin —
// gleiche Sichtbarkeit wie im Rechner, nichts verschwiegen (§8). Bei einem
// Nicht-«ok»-Ergebnis zeigt die aufrufende Form den Engine-Satz selbst.

export function SchnellFormFuss({ normverweise, hinweise, annahmen, rechnerZiel, rechnerName }: {
  normverweise: readonly Normverweis[];
  /** Anzahl der Engine-Warnungen des aktuellen Ergebnisses. */
  hinweise: number;
  /** Satz mit den Annahmen der Schnellform, ohne Schlusspunkt. */
  annahmen: string;
  rechnerZiel: string;
  rechnerName: string;
}) {
  return (
    <div className="mt-auto space-y-1.5 font-sans text-xs leading-relaxed text-ink-500">
      {normverweise.length > 0 && (
        <p data-schnell-normen>
          Normen: <NormText text={normverweise.map((n) => n.artikel).join(' · ')} />
        </p>
      )}
      <p>
        Angenommen: {annahmen}.{' '}
        {hinweise > 0 ? `Hinweise und Vorbehalte (${hinweise}) sowie weitere` : 'Weitere'} Optionen im{' '}
        <Link to={rechnerZiel} className="underline hover:text-reg-w">{rechnerName}</Link>.
      </p>
    </div>
  );
}
