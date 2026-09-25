import { Checkbox } from '../vorlagen/ui';
import { STANDARD_ARBEITSTAGE } from '../../lib/kuendigungsfristProbezeit';

// RL-16b (W-08 b, 25.9.2026): Eingabe «Arbeitstage pro Woche» für die
// Probezeitverlängerung nach Art. 335b Abs. 3 OR. Wochentags-Auswahl statt
// Zahl: BGE 148 III 126 E. 5.2.6 zählt die Arbeitstage DER PERSON — eine Zahl
// («3 Tage») lässt offen, WELCHE Tage, und damit das Ende der Verlängerung;
// Teilzeit mit festen Tagen ist nur so abbildbar. Geteilt vom Kündigungs-/
// Sperrfristen-Rechner und der kombinierten Ansicht (§10). Reine Darstellung
// (§3): Werte nach date-fns getDay (0 = So … 6 = Sa), Rechnung in der Engine.

const TAGE: readonly { tag: number; kurz: string; name: string }[] = [
  { tag: 1, kurz: 'Mo', name: 'Montag' },
  { tag: 2, kurz: 'Di', name: 'Dienstag' },
  { tag: 3, kurz: 'Mi', name: 'Mittwoch' },
  { tag: 4, kurz: 'Do', name: 'Donnerstag' },
  { tag: 5, kurz: 'Fr', name: 'Freitag' },
  { tag: 6, kurz: 'Sa', name: 'Samstag' },
  { tag: 0, kurz: 'So', name: 'Sonntag' },
];

export function ArbeitstageFeld({ wert, onChange, 'aria-labelledby': labelledBy }: {
  wert: number[] | undefined;
  onChange: (tage: number[]) => void;
  'aria-labelledby'?: string;
}) {
  const aktiv = wert && wert.length > 0 ? wert : [...STANDARD_ARBEITSTAGE];
  const umschalten = (tag: number, an: boolean) => {
    const neu = an ? [...aktiv, tag] : aktiv.filter((t) => t !== tag);
    // Mindestens ein Arbeitstag: der letzte Haken lässt sich nicht entfernen.
    if (neu.length === 0) return;
    onChange(TAGE.map((t) => t.tag).filter((t) => neu.includes(t)));
  };
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-x-4">
      {TAGE.map(({ tag, kurz, name }) => (
        <span key={tag} data-wochentag={tag}>
          <Checkbox
            checked={aktiv.includes(tag)}
            disabled={aktiv.length === 1 && aktiv.includes(tag)}
            onChange={(an) => umschalten(tag, an)}
            label={<><span aria-hidden="true">{kurz}</span><span className="sr-only">{name}</span></>}
          />
        </span>
      ))}
    </div>
  );
}
