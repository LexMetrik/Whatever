import { SchkgFristenForm } from '../components/forms/SchkgFristenForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { EreignisFristenSektion } from '../components/forms/EreignisFristen';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { ThemenEinstieg } from '../components/ThemenEinstieg';
import { getCalculator } from '../lib/calculators';

// SchKG-Fristenrechner unter /rechner/schkg-fristen.
// S-5c (Fristenspiegel-Auflösung): das Ereignis Zahlungsbefehl
// (Rechtsvorschlag · Art.-88-Dual · Rechtsöffnung) lebt auf DIESER Seite.
export function RechnerSchkg() {
  const calc = getCalculator('schkg-fristen')!;
  return (
    <BekannteFehlerRahmen werkzeug="schkg-fristen">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <SchkgFristenForm />
      </Card>
      <EreignisFristenSektion ereignisse={['zahlungsbefehl']} />
      {/* R10: passende Vorlage zum Rechner (V2-Rest FAHRPLAN-VORLAGEN-AUSBAU) */}
      <ThemenEinstieg label="Nach erhobenem Rechtsvorschlag:" links={[
        { to: '/vorlagen/nichtbekanntgabe-betreibung', label: 'Gesuch um Nichtbekanntgabe der Betreibung (Art. 8a SchKG)' },
      ]} />
    </div>
    </BekannteFehlerRahmen>
  );
}
