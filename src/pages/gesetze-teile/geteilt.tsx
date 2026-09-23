// Geteilte Bausteine der gesetze-teile-Module (BundSystematik, KantonSystematik)
// und von Gesetze.tsx (H-10, §6.6: reiner Move aus Gesetze.tsx).
import type { ReactNode } from 'react';
import { ErlassTabelle } from '../../components/normtext/ErlassKarte';
import { type BrowseErlass } from '../../lib/normtext/browse-typen';
import { GruppenKopf } from '../../components/ui/GruppenKopf';

// Ausführungsrecht (Verordnung/Reglement) erkennt man am Titel — rein für die
// ANZEIGE-Hierarchie (Leitgesetze prominent, Verordnungen dezent); ändert keine
// Rechtslogik. Echte Gesetze tragen «Verordnung» nicht im Titel.
const istVerordnung = (e: BrowseErlass) => /verordnung|reglement/i.test(e.titel);

// Eine aufklappbare Systematik-Kategorie (kontrolliert über offen/onToggle).
// K2 (W2·29, Board): Zeichen «›» VOR der Nummer, Zahl am rechten Rand — die
// App-weite «▸»-Regel am Zeilenende (index.css `details > summary::after`)
// teilte sich mit der Zahl den `auto`-Rand und schob sie in die Zeilenmitte.
export function Kategorie({ id, offen, onToggle, kopf, anzahl, children }: {
  id?: string; offen: boolean; onToggle: () => void; kopf: ReactNode; anzahl: number; children: ReactNode;
}) {
  return (
    <details id={id} open={offen}
      onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open !== offen) onToggle(); }}
      className="group border border-rule-soft scroll-mt-24">
      <summary className="flex items-baseline gap-3 cursor-pointer select-none px-4 py-3 lc-hover-flaeche after:content-none">
        <span aria-hidden className="text-ink-500 transition-transform group-open:rotate-90">›</span>
        {kopf}
        <span className="num text-body-s text-ink-600 ml-auto">{anzahl}</span>
      </summary>
      <div className="px-4 pb-4 pt-3 space-y-5 border-t border-rule-soft">{children}</div>
    </details>
  );
}

// Inhalt einer Untergruppe: Leitgesetze in voller Dichte, untergeordnetes
// Ausführungsrecht (Verordnungen/Reglemente) knapp und eingerückt.
export function GruppenInhalt({ titel, items }: { titel: string; items: BrowseErlass[] }) {
  const gesetze = items.filter((e) => !istVerordnung(e));
  const verordnungen = items.filter(istVerordnung);
  return (
    <div className="space-y-2.5">
      <GruppenKopf titel={titel} />
      {gesetze.length > 0 && (
        <ErlassTabelle erlasse={gesetze} voll beschriftung={`${titel} — Kürzel, Titel, Angaben`} />
      )}
      {verordnungen.length > 0 && (
        <div className="pl-3 border-l border-rule-soft">
          <p className="lc-overline mb-1">Verordnungen &amp; Ausführungsrecht</p>
          <ErlassTabelle erlasse={verordnungen}
            beschriftung={`${titel} — Verordnungen: Kürzel, Titel, SR-Nummer`} />
        </div>
      )}
    </div>
  );
}
