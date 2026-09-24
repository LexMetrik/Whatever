import { DETAILGRAD_OPTIONEN, type Detailgrad } from '../../lib/vorlagen/detailgrad';
import { SelectionGrid } from '../ui/SelectionGrid';

// ─── Varianten-Kopf (FAHRPLAN-VERTRAGS-VARIANTEN P0) ────────────────────────
// Segment-Schalter über dem Stepper: Untertyp (optional, regime-treue Weiche)
// und Detailgrad einfach/standard/experte. Reine Darstellung (§3) – die
// Auswahl reist als Feld ins Schema und steuert dort die includeIf-Bausteine.

export interface UntertypOption<T extends string> {
  id: T;
  label: string;
  sub?: string;
}

export function VariantenKopf<T extends string>({
  untertypLabel, untertypOptionen, untertyp, onUntertyp,
  detailgrad, onDetailgrad,
}: {
  untertypLabel?: string;
  untertypOptionen?: readonly UntertypOption<T>[];
  untertyp?: T;
  onUntertyp?: (v: T) => void;
  detailgrad: Detailgrad;
  onDetailgrad: (v: Detailgrad) => void;
}) {
  // Kein Kasten, ein Abschnitt zwischen zwei weichen Linien (R5-F2, §5
  // «Linien statt Flächen»); die Kacheln tragen den Registerstrich (`reg`).
  return (
    <div className="border-y border-rule-soft py-3 space-y-3">
      {untertypOptionen && untertypOptionen.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className="lc-overline">{untertypLabel ?? 'Untertyp'}</legend>
          <SelectionGrid<T>
            className="flex flex-wrap gap-2"
            items={untertypOptionen.map((o) => ({ code: o.id, label: o.label, sub: o.sub }))}
            value={untertyp ?? ''} onSelect={(c) => onUntertyp?.(c)} />
        </fieldset>
      )}
      <fieldset className="space-y-1.5">
        <legend className="lc-overline">Detailgrad</legend>
        <SelectionGrid
          className="grid grid-cols-3 gap-2 max-w-xl"
          items={DETAILGRAD_OPTIONEN.map((o) => ({ code: o.id, label: o.label, sub: o.sub }))}
          value={detailgrad} onSelect={onDetailgrad} />
      </fieldset>
    </div>
  );
}
