import type { ReactNode } from 'react';
import { KANTONE, KANTON_NAMEN } from '../../data/tarif/typen';
import type { Kanton } from '../../types/legal';

// ─── KantonFeld — die EINE Kantonsauswahl (HN-D6 / DK-02, 30.9.2026) ─────────
//
// BEFUND (Herz-und-Nieren-Prüfung 24.9.2026, DK-02): `KANTONE.map(` baute die
// Auswahl rund 32-mal von Hand — in vier Beschriftungsformen («ZH»,
// «ZH – Zürich», «ZH — Zürich», «Zürich (ZH)») und aus zwei Namensquellen
// (`KANTON_NAMEN` und eine eigene Namensliste in `LohnfortzahlungForm`).
// Derselbe Fachinhalt an 32 Stellen widerspricht §5; ein geteilter Baustein ist
// der Weg, den §10 vorgibt.
//
// FORM (eine, nicht vier): `ZH – Zürich`. Kürzel zuerst, weil die Tastatur-
// Schnellwahl des nativen `<select>` am Anfang des Options-Texts ansetzt und die
// Nutzer:innen Kantone am Kürzel kennen; dazu der ausgeschriebene Name aus der
// einen Quelle `KANTON_NAMEN` (`data/tarif/typen.ts`). Gedankenstrich = Halb-
// geviertstrich mit Leerzeichen, wie er in Schweizer Typografie Standard ist und
// schon im Lohnfortzahlungs-Formular stand.
//
// REIHENFOLGE: Standard ist die amtliche (BV Art. 1, `KANTONE`). Die drei
// dokumentierten Ausnahmen (`lib/kantone.ts`: KombinierteAnsicht «BS zuerst»,
// LohnfortzahlungForm, Vorsorgeauftrag alphabetisch) bleiben beim Aufrufer und
// kommen als `kantone` herein — der Baustein entscheidet die Reihenfolge nie
// selbst. `gruppen` ist die Optgroup-Fähigkeit für fachliche Gruppierungen (die
// Lohnfortzahlungs-Skalen): die Gruppen-Beschriftung und welcher Kanton wohin
// gehört, ist Rechtsinhalt und steht beim Aufrufer, nicht hier.
//
// §3: reine Darstellung. Der Baustein reicht den Kanton-Code unverändert durch;
// welche Werte gültig sind, entscheidet unverändert die Permalink-Spec des
// Aufrufers.

export interface KantonGruppe {
  /** Beschriftung der `<optgroup>`. */
  label: string;
  kantone: readonly Kanton[];
}

interface Basis {
  /** Default `lc-input` (die Hausform des Formularfelds); `className` hängt an. */
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /** Reihenfolge-Ausnahme (siehe oben). Default: amtliche Reihenfolge. */
  kantone?: readonly Kanton[];
  /** Optgroup-Gliederung; hat Vorrang vor `kantone`. Ein Kanton, der in keiner
   *  Gruppe steht, erscheint nicht — die Zuordnung ist Sache des Aufrufers. */
  gruppen?: readonly KantonGruppe[];
  /** Anhang hinter dem Namen je Kanton, z. B. `{ ZG: '⚠' }` (§8-Hinweis des
   *  Aufrufers; der Baustein erfindet keinen). */
  zusatz?: Partial<Record<Kanton, string>>;
}

type Props = Basis & (
  | { leer?: undefined; value: Kanton; onChange: (k: Kanton) => void }
  /** `leer` = Text der Platzhalter-Option (`value=""`), wenn noch kein Kanton
   *  gewählt ist. */
  | { leer: string; value: Kanton | ''; onChange: (k: Kanton | '') => void }
);

function optionen(liste: readonly Kanton[], zusatz: Basis['zusatz']): ReactNode {
  return liste.map((k) => (
    <option key={k} value={k}>
      {k} – {KANTON_NAMEN[k]}{zusatz?.[k] ? ` ${zusatz[k]}` : ''}
    </option>
  ));
}

export function KantonFeld(props: Props) {
  const { value, onChange, leer, kantone = KANTONE, gruppen, zusatz, className, ...rest } = props;
  return (
    <select
      {...rest}
      value={value}
      onChange={(e) => (onChange as (k: Kanton | '') => void)(e.target.value as Kanton | '')}
      className={className ? `lc-input ${className}` : 'lc-input'}
    >
      {leer !== undefined && <option value="">{leer}</option>}
      {gruppen
        ? gruppen.map((g) => <optgroup key={g.label} label={g.label}>{optionen(g.kantone, zusatz)}</optgroup>)
        : optionen(kantone, zusatz)}
    </select>
  );
}
