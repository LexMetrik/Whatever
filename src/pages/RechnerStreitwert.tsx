import { StreitwertForm } from '../components/forms/StreitwertForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// Streitwert-Rechner unter /rechner/streitwert (Quick-Win B.9; Dossier
// bibliothek/recherche/zpo-kosten-streitwert.md, Rechner 1).
export function RechnerStreitwert() {
  const calc = getCalculator('streitwert')!;
  return (
    <BekannteFehlerRahmen werkzeug="streitwert">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <StreitwertForm />
      </Card>
    </div>
    </BekannteFehlerRahmen>
  );
}
