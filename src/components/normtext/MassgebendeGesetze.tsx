// «Massgebende Gesetze»-Block (W2.1): kompakte Rück-Verlinkung von der Rubrik-
// Übersicht auf die Norm-Volltext-Detailseiten (Norm↔Werkzeug-Brücke invers).
// Reine Darstellung (§3); Daten + Verfügbarkeit aus lib/normtext/werkzeuge.
// K4 (W2·29-WERKBANK-KATALOGE): Haarlinie und Abstand trägt der Fuss
// (`.kt-fuss > section`), den Hover die zentrale `.lc-chip-zeile`-Regel.
import { Link } from 'react-router-dom';
import { massgebendeErlasse } from '../../lib/normtext/werkzeuge';

export function MassgebendeGesetze({ modus }: { modus: 'rechner' | 'vorlage' }) {
  const erlasse = massgebendeErlasse(modus);
  if (erlasse.length === 0) return null;
  return (
    <section aria-labelledby="massgebende-gesetze">
      <h2 id="massgebende-gesetze" className="lc-overline mb-2">Massgebende Gesetze im Volltext</h2>
      <p className="text-body-s text-ink-600 mb-3 max-w-reading-s">
        Die Erlasse, auf denen diese {modus === 'rechner' ? 'Rechner' : 'Vorlagen'} beruhen — als
        Volltext mit Stand und amtlichem Live-Link.
      </p>
      {/* lc-chip-zeile (LM-044/N1): Erlass-Chips sind <Link> → <a>, tragen also die
          Link-Unterstreichung als Form-Merkmal. Genau die Reihe, an der auf
          /vorlagen und /rechner ein «ZGB» formal wie ein «Stand 01.02.2022» aussah. */}
      <ul className="lc-chip-zeile flex flex-wrap gap-2 list-none p-0 m-0">
        {erlasse.map((e) => (
          <li key={e.key}>
            <Link
              to={e.pfad}
              title={e.titel}
              className="lc-chip no-underline"
            >
              {e.kuerzel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
