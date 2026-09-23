import { GerichtszitatForm } from '../components/forms/GerichtszitatForm';
import { Card } from '../components/ui/Card';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { getCalculator } from '../lib/calculators';

// ─── Amtlicher Gerichts-Zitierer (BGE / BGer) ───────────────────────────────
// Gerichts-Baustein-Set (ROADMAP W2·7). Thin-Shell nach DESIGN-REGLEMENT
// §R-1; die R12-Ausnahme (kein Berechnungsergebnis, reiner Zitat-Formatierer) ist
// in GerichtszitatForm dokumentiert.

export function RechnerGerichtszitat() {
  const calc = getCalculator('gerichtszitat')!;
  return (
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <Card>
        <GerichtszitatForm />
      </Card>
    </div>
  );
}
