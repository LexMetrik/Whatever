import { VerzugszinsForm } from '../components/forms/VerzugszinsForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// Verzugszins-Rechner unter /rechner/verzugszins (Art. 104 OR).
export function RechnerVerzugszins() {
  const calc = getCalculator('verzugszins')!;
  return (
    <BekannteFehlerRahmen werkzeug="verzugszins">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <VerzugszinsForm />
      </Card>
    </div>
    </BekannteFehlerRahmen>
  );
}
