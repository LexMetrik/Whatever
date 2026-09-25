// H-10 (§6.6 billig, B27): reiner Move aus Gesetze.tsx — Props/Verhalten unverändert.
import { useState } from 'react';
import { SYSTEMATIK } from '../../lib/normtext/systematik';
import { type BrowseErlass } from '../../lib/normtext/browse-typen';
import { Kategorie, GruppenInhalt } from './geteilt';
import { ErlassTabelle } from '../../components/normtext/ErlassKarte';

// Bund-Erlasse nach der funktionalen Systematik (systematik.ts): aufklappbare
// Kategorien, Untergruppen, Leitgesetze in voller Dichte +
// Verordnungen dezent. «Alle auf-/zuklappen»; «Weitere Erlasse» fängt alles ein,
// was keiner Gruppe zugeordnet ist (nie ein Verlust).
export function BundSystematik({ erlasse, hashOffen }: { erlasse: BrowseErlass[]; hashOffen?: string | null }) {
  const proKey = new Map(erlasse.map((e) => [e.key, e]));
  const zugeordnet = new Set<string>();
  const kategorien = SYSTEMATIK.map((kat) => {
    const gruppen = kat.gruppen
      .map((g) => {
        const items = g.keys.map((k) => proKey.get(k)).filter((e): e is BrowseErlass => !!e);
        items.forEach((e) => zugeordnet.add(e.key));
        return { id: g.id, titel: g.titel, items };
      })
      .filter((g) => g.items.length > 0);
    const anzahl = gruppen.reduce((a, g) => a + g.items.length, 0);
    return { ...kat, gruppen, anzahl };
  }).filter((k) => k.anzahl > 0);
  const weitere = erlasse.filter((e) => !zugeordnet.has(e.key));
  const alleIds = [...kategorien.map((k) => k.id), ...(weitere.length ? ['weitere'] : [])];

  // Bund-Übersicht: standardmässig ALLES eingeklappt (Auftrag David 25.6.2026 —
  // Kategorien-Überblick auf einen Blick, wie die Kanton-Ansicht). Nur ein
  // Sidebar-Deeplink (#sys-<id>) öffnet zusätzlich seine Zielkategorie (hashOffen,
  // vom Eltern via key= bei Hash-Wechsel frisch gemountet) + springt sie an.
  const [offen, setOffen] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (hashOffen) initial.add(hashOffen);
    return initial;
  });
  const alleOffen = offen.size >= alleIds.length;
  const toggle = (id: string) => setOffen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAlle = () => setOffen(alleOffen ? new Set() : new Set(alleIds));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={toggleAlle}
          className="text-body-s font-medium text-reg-g underline decoration-1 underline-offset-4 hover:decoration-2">
          {alleOffen ? 'Alle einklappen' : 'Alle aufklappen'}
        </button>
      </div>
      {kategorien.map((kat) => (
        <Kategorie key={kat.id} id={`sys-${kat.id}`} offen={offen.has(kat.id)} onToggle={() => toggle(kat.id)} anzahl={kat.anzahl}
          kopf={
            <span className="flex items-baseline gap-2.5">
              <span aria-hidden className="num font-display text-h3 leading-none text-reg-g">{kat.nr}</span>
              <span className="font-sans font-semibold text-ink-900 text-h3 tracking-tight">{kat.titel}</span>
            </span>
          }>
          <p className="text-body-s text-ink-500 max-w-reading-s">{kat.lede}</p>
          {kat.gruppen.map((g) => <GruppenInhalt key={g.id} titel={g.titel} items={g.items} />)}
        </Kategorie>
      ))}
      {weitere.length > 0 && (
        <Kategorie anzahl={weitere.length} offen={offen.has('weitere')} onToggle={() => toggle('weitere')}
          kopf={<span className="font-sans font-medium text-ink-700 text-body-l">Weitere Erlasse</span>}>
          <ErlassTabelle erlasse={weitere} voll beschriftung="Weitere Erlasse — Kürzel, Titel, Angaben" />
        </Kategorie>
      )}
    </div>
  );
}
