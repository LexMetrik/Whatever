import { BeurkundungForm } from '../components/forms/BeurkundungForm';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// Notariats- & Grundbuchkosten /rechner/notariat-grundbuch (FAHRPLAN-
// BEURKUNDUNGS-AUSBAU). Drei Bereiche: Grundstückkauf (4 Kostenblöcke) ·
// Beurkundung (Notariat) je Geschäftsart · Grundbuch je Eintragungsart – alle
// 26 Kantone, amtlich belegt, doppelt verifiziert. Dossiers
// bibliothek/kosten/{notariat-grundbuch,beurkundungstarife,grundbuchgebuehren}-kantone.md.
export function RechnerNotariatGrundbuch() {
  const calc = getCalculator('notariat-grundbuch')!;
  return (
    <BekannteFehlerRahmen werkzeug="notariat-grundbuch">
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <BeurkundungForm />
      </Card>
    </div>
    </BekannteFehlerRahmen>
  );
}
