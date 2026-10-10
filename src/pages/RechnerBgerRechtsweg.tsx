import { BgerRechtswegForm } from '../components/forms/BgerRechtswegForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { ThemenEinstieg } from '../components/ThemenEinstieg';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// BGer-Rechtsweg unter /rechner/bgg-fristen (FAHRPLAN-BGER-RECHTSWEG R-2;
// Dossier bibliothek/recherche/bgg-beschwerde-engine.md).
export function RechnerBgerRechtsweg() {
  const calc = getCalculator('bgg-fristen')!;
  return (
    <BekannteFehlerRahmen werkzeug="bgg-fristen">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <BgerRechtswegForm />
      </Card>
      <ThemenEinstieg
        label="Vor dem Weiterzug:"
        links={[
          { to: '/rechner/zustaendigkeit', label: 'Zuständigkeit & Rechtsmittel (ZPO)' },
          { to: '/rechner/streitwert', label: 'Streitwert (ZPO)' },
          { to: '/rechner/tagerechner', label: 'Fristenrechner' },
        ]}
      />
    </div>
    </BekannteFehlerRahmen>
  );
}
