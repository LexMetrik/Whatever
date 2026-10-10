import { MietrechtForm } from '../components/forms/MietrechtForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { ThemenEinstieg } from '../components/ThemenEinstieg';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { TagerechnerRueckverweis } from '../components/TagerechnerRueckverweis';
import { getCalculator } from '../lib/calculators';

// Mietrechtlicher Kündigungsrechner unter /rechner/mietrecht.
export function RechnerMietrecht() {
  const calc = getCalculator('mietrecht')!;
  return (
    <BekannteFehlerRahmen werkzeug="mietrecht">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <TagerechnerRueckverweis />
      <Card>
        <MietrechtForm />
      </Card>

      {/* Themen-Einstieg (Konsolidierung 7.6.2026, E3): Mieter-Schreiben und
          Vermieter-Checkliste ohne eigene Katalog-Karten — Direktzugang hier. */}
      <ThemenEinstieg label="Kündigung aussprechen:" links={[
        { to: '/vorlagen/kuendigung-mieter', label: 'Kündigungsschreiben Mieter:in' },
        { to: '/vorlagen/kuendigung-vermieter', label: 'Vermieter:innen: Checkliste (amtliches Formular)' },
      ]} />
    </div>
    </BekannteFehlerRahmen>
  );
}
