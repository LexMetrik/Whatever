import type { Calculator } from '../../lib/calculators';
import { karteFuerPfad } from '../../lib/seo';
import { WerkzeugKopf } from './WerkzeugKopf';

// Rechner-Kopf (W2·29-WERKBANK-RECHNER R1): ein Aufsatz auf dem Werkzeug-Kopf
// der Vorlagen (`layout/WerkzeugKopf`, Titelblatt-Band im Register
// «Werkzeuge») — er bildet nur den Registry-Eintrag auf dessen Props ab. Die
// Overline bleibt das Rechtsgebiet ohne «· Rechner»: die Krume «Rechner» der
// globalen Leiste (`InhaltsKopf`/`PaneKopf`, LM-181) nennt die Gattung schon,
// eine zweite Nennung wäre die Kopf-Dopplung, die e2e/w224-ga-kopf
// verbietet. Status (RL-12 PR 2, Befund R3-06): der Prüfstand der Karte, die
// `/rechner/<slug>` vertritt — über dieselbe Pfad→Karte-Zuordnung wie Titel und
// Canonical (`seo.karteFuerPfad`), kein zweiter Status (§5); der Kopf zeigt
// ihn im Band (`WerkzeugKopf` → `status`).
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
      status={karteFuerPfad(`/rechner/${calc.slug}`)?.status}
      titel={titelOverride ?? calc.titel}
      intro={kurzbeschriebOverride ?? calc.kurzbeschrieb}
      normen={normen.map((n) => ({ artikel: n, titel: `${n} auf Fedlex öffnen` }))}
    />
  );
}
