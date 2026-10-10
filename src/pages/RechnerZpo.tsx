import { ZpoFristenForm } from '../components/forms/ZpoFristenForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { EreignisFristenSektion } from '../components/forms/EreignisFristen';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { ThemenEinstieg } from '../components/ThemenEinstieg';
import { getCalculator } from '../lib/calculators';

// ZPO-Fristenrechner unter /rechner/zpo-fristen. Logik UNVERÄNDERT.
// (Der Pflicht-Disclaimer ist im ZpoFristenForm bereits prominent enthalten.)
// S-5c (Fristenspiegel-Auflösung): die ZPO-Ereignisse Zivilentscheid +
// Klagebewilligung leben als Ereignis-Block auf DIESER Seite.
export function RechnerZpo() {
  const calc = getCalculator('zpo-fristen')!;
  return (
    <BekannteFehlerRahmen werkzeug="zpo-fristen">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <ZpoFristenForm />
      </Card>
      <EreignisFristenSektion ereignisse={['zivilentscheid', 'klagebewilligung']} />
      {/* R10: passende Vorlage zum Rechner (V2-Rest FAHRPLAN-VORLAGEN-AUSBAU) */}
      <ThemenEinstieg label="Frist reicht nicht aus:" links={[
        { to: '/vorlagen/fristerstreckung', label: 'Fristerstreckungsgesuch (Art. 144 ZPO)' },
      ]} />
    </div>
    </BekannteFehlerRahmen>
  );
}
