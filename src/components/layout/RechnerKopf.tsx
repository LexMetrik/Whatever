import type { Calculator } from '../../lib/calculators';
import { WerkzeugKopf } from './WerkzeugKopf';

// Rechner-Kopf (W2·29-WERKBANK-RECHNER R1): ein Aufsatz auf dem Werkzeug-Kopf
// der Vorlagen (`layout/WerkzeugKopf`, Titelblatt-Band im Register
// «Werkzeuge») — er bildet nur den Registry-Eintrag auf dessen Props ab. Die
// Overline bleibt das Rechtsgebiet ohne «· Rechner»: die Krume «Rechner» der
// globalen Leiste (`InhaltsKopf`/`PaneKopf`, LM-181) nennt die Gattung schon,
// eine zweite Nennung wäre die Kopf-Dopplung, die e2e/w224-ga-kopf
// verbietet. Das Band-Etikett (`etikett`) bleibt frei für die Status-Anzeige
// (RL-12, W2·30-RL-W1).
// Overrides (Fix 6.6.2026, Befund David): Rechner mit Binnen-Navigation
// (Zuständigkeit: Rechtswege Zivil/SchKG/Straf) zeigen sonst immer die
// ZPO-Chips der Registry — Kategorie/Beschrieb/Normen sind deshalb pro
// gewähltem Rechtsweg überschreibbar (reine Anzeige, §3).
export function RechnerKopf({ calc, titelOverride, kategorieOverride, kurzbeschriebOverride, normenOverride }: {
  calc: Calculator;
  titelOverride?: string;
  kategorieOverride?: string;
  kurzbeschriebOverride?: string;
  normenOverride?: string[];
}) {
  const normen = normenOverride ?? calc.normen;
  return (
    <WerkzeugKopf
      overline={kategorieOverride ?? calc.kategorie}
      titel={titelOverride ?? calc.titel}
      intro={kurzbeschriebOverride ?? calc.kurzbeschrieb}
      normen={normen.map((n) => ({ artikel: n, titel: `${n} auf Fedlex öffnen` }))}
    />
  );
}
