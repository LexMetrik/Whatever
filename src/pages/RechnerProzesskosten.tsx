import { ProzesskostenForm } from '../components/forms/ProzesskostenForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// Prozesskostenrechner /rechner/prozesskosten (FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN
// P1, Hauptmoat). Gerichtskosten + Parteientschädigung aller 26 Kantone (Art.
// 95/96 ZPO), mit interkantonaler Vergleichstabelle. Dossier
// bibliothek/recherche/prozesskosten-zpo-95-96.md.
export function RechnerProzesskosten() {
  const calc = getCalculator('prozesskosten')!;
  return (
    <BekannteFehlerRahmen werkzeug="prozesskosten">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <ProzesskostenForm />
      </Card>
    </div>
    </BekannteFehlerRahmen>
  );
}
