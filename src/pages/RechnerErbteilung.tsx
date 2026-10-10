import { ErbteilungForm } from '../components/forms/ErbteilungForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// Erbteilungs- und Pflichtteilrechner unter /rechner/erbteilung.
export function RechnerErbteilung() {
  const calc = getCalculator('erbteilung')!;
  return (
    <BekannteFehlerRahmen werkzeug="erbteilung">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <ErbteilungForm />
      </Card>
    </div>
    </BekannteFehlerRahmen>
  );
}
