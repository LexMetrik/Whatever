import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemenEinstieg } from '../components/ThemenEinstieg';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { LohnfortzahlungForm } from '../components/forms/LohnfortzahlungForm';
import { KuendigungSperrForm } from '../components/forms/KuendigungSperrForm';
import { KombinierteAnsicht } from '../components/forms/KombinierteAnsicht';
import { BekannteFehlerRahmen } from '../components/BekannterFehler';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { TagerechnerRueckverweis } from '../components/TagerechnerRueckverweis';
import { EreignisFristenSektion } from '../components/forms/EreignisFristen';
import { getCalculator } from '../lib/calculators';

type Tab = 'a' | 'b_c' | 'kombiniert';
const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: 'a', label: 'A – Lohnfortzahlung', sub: 'Art. 324a OR' },
  { id: 'b_c', label: 'B+C – Kündigung', sub: 'Art. 335c / 336c OR' },
  { id: 'kombiniert', label: 'Kombiniert', sub: 'A + B + C' },
];

// Abschnitt-Anker der Startseiten-Split-Karten → Tab-Vorauswahl.
const HASH_TAB: Record<string, Tab> = {
  '#lohnfortzahlung': 'a',
  '#kuendigung': 'b_c',
};

// Arbeitsrechts-Rechner unter /rechner/kuendigung. Berechnungslogik UNVERÄNDERT;
// nur der Seitenrahmen (Kopf + Tabs + Disclaimer) ist neu.
export function RechnerKuendigung() {
  const calc = getCalculator('kuendigung')!;
  const { hash } = useLocation();
  const [tab, setTab] = useState<Tab>(HASH_TAB[hash] ?? 'a');

  // Hash-Navigation (z. B. «Verwandte Rechner»-Link von der anderen Split-Karte) —
  // Sync während des Renderns statt im Effect (React-Pattern «adjusting state»).
  const [letzterHash, setLetzterHash] = useState(hash);
  if (hash !== letzterHash) {
    setLetzterHash(hash);
    if (HASH_TAB[hash]) setTab(HASH_TAB[hash]);
  }

  // S-5c: Beendigungsdatum (inkl. Sperrfristen-Verschiebung) aus dem
  // B+C-Rechner → Vorgabe für den 336b-Ereignis-Block unten.
  const [beendigung, setBeendigung] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      <TagerechnerRueckverweis />

      {/* E-2 (Design-Konsistenz 31.8.2026): hier stand eine wortgleiche Kopie
          der Segmented-Control aus `ui/Tabs` — dieselben Zustands-Klassen
          («bg-surface-raised text-brass-700 shadow-sm border border-line»),
          nur mit eigener Geometrie. Ersetzt durch den geteilten Baustein in
          der Variante `zweizeilig` (§5/§10); er bringt zusätzlich die
          ARIA-Tabs-Semantik mit Pfeiltasten-Navigation und die Klartext-Zeile
          im Ausdruck mit. */}
      <Tabs
        items={TABS.map((t) => ({
          code: t.id,
          label: (
            <>
              <span className="block">{t.label}</span>
              {/* `opacity-70` → Token (QS-UI Teilpass (e), 5.9.2026): Opazität
                  auf Text hebelt jede Kontrast-Zusage der Token-Schicht aus —
                  sie rechnet die FERTIGE Farbe gegen den Grund und macht aus
                  einer geprüften Farbe eine ungeprüfte. Gemessen am neuen
                  Flächen-Tor: im aktiven Reiter wurde brass-700 (#826225) zu
                  #A89166 auf #FFFEFC = 3.01:1 (AA verlangt 4.5) — `color-contrast`,
                  serious. ink-600 (#56534C) ist die gedämpfte Stufe des Hauses
                  und liegt in BEIDEN Reiter-Zuständen über AA. */}
              <span className="block text-xs font-normal text-ink-600">{t.sub}</span>
            </>
          ),
        }))}
        value={tab} onChange={setTab} groesse="zweizeilig" ariaLabel="Berechnungs-Variante" />

      <Card>
        {tab === 'a' && <LohnfortzahlungForm />}
        {/* WARNHINWEIS: Kündigung/Sperrfristen (B+C, auch in «Kombiniert») und
            die 336b-Fristen unten sind das Werkzeug `kuendigung-sperrfristen`. */}
        {tab === 'b_c' && <BekannteFehlerRahmen werkzeug="kuendigung-sperrfristen"><KuendigungSperrForm onBeendigung={setBeendigung} /></BekannteFehlerRahmen>}
        {tab === 'kombiniert' && <BekannteFehlerRahmen werkzeug="kuendigung-sperrfristen"><KombinierteAnsicht /></BekannteFehlerRahmen>}
      </Card>

      {/* S-5c (Fristenspiegel-Auflösung): die 336b-Fristen (Einsprache &
          Klagefrist nach der AG-Kündigung) leben auf DIESER Seite; der
          Sperrfristen-Rechner verweist per Anker hierher. */}
      <BekannteFehlerRahmen werkzeug="kuendigung-sperrfristen">
        <EreignisFristenSektion ereignisse={['agkuendigung']} id="ereignis-336b"
          zustellungVorgabe={beendigung} />
      </BekannteFehlerRahmen>

      {/* Themen-Einstieg (Konsolidierung 7.6.2026, E3): die Schreiben-Masken
          haben keine eigenen Katalog-Karten mehr — hier ist ihr Direktzugang. */}
      <ThemenEinstieg label="Kündigungsschreiben erstellen:" links={[
        { to: '/vorlagen/kuendigung-arbeitnehmer', label: 'durch Arbeitnehmer:in' },
        { to: '/vorlagen/kuendigung-arbeitgeber', label: 'durch Arbeitgeber:in (mit Sperrfristen-Gate)' },
      ]} />
    </div>
  );
}
