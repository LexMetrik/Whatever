import { Link, useParams } from 'react-router-dom';
import { getCalculator } from '../lib/calculators';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { NotFound } from './NotFound';

// Gerüst-Seite für noch nicht implementierte Rechner ("in Vorbereitung" / "geplant").
// Die Rechenlogik folgt je Rechner separat.
export function RechnerStub() {
  const { slug } = useParams();
  const calc = slug ? getCalculator(slug) : undefined;
  if (!calc) return <NotFound />;

  return (
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <div className="lc-card p-8 text-center space-y-3">
        {/* D-5/B3-8 (R3-α, 31.8.2026): hier stand die Marke als eigene
            Klassenkette in WARN-Ton («text-warn-700 uppercase») mit zwei
            Wortlauten («In Vorbereitung» / «Geplant»). Beides ist mit Davids
            Entscheid vom 31.8.2026 entschieden: EINE Marke `lc-badge-geplant`
            (Umriss slate) und EIN Wortlaut «In Vorbereitung» — derselbe, den
            Katalog, SprachUmschalter und die Zuständigkeits-Flächen tragen.
            §8: die Aussage wird nicht abgeschwächt, sondern vereinheitlicht —
            der Erklärsatz darunter bleibt Wort für Wort stehen. */}
        <p><span className="lc-badge-geplant">In Vorbereitung</span></p>
        <p className="text-ink-600 max-w-md mx-auto">
          Dieser Rechner ist noch nicht verfügbar. Die Berechnungslogik wird separat ergänzt;
          der Seitenrahmen folgt bereits der gemeinsamen Vorlage.
        </p>
        <Link to="/rechner" className="inline-block text-body-s font-medium text-brass-700">← Zurück zur Rechnerübersicht</Link>
      </div>
    </div>
  );
}
