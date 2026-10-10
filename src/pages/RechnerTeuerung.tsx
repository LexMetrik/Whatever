import { TeuerungForm } from '../components/forms/TeuerungForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// LIK-Teuerungsrechner unter /rechner/teuerung (Free).
export function RechnerTeuerung() {
  const calc = getCalculator('teuerung')!;
  return (
    <BekannteFehlerRahmen werkzeug="teuerungsrechner">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <TeuerungForm />
      </Card>
    </div>
    </BekannteFehlerRahmen>
  );
}
