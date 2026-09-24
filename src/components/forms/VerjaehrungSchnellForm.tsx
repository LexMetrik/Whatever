import { useState } from 'react';
import { format } from 'date-fns';
import {
  berechneVerjaehrung, REGIME,
  type VerjaehrungErgebnis, type VerjaehrungInput, type VerjaehrungRegime,
} from '../../lib/verjaehrung';
import { KANTONE } from '../../lib/kantone';
import { getStandardKanton } from '../../lib/einstellungen';
import { permalinkKodieren } from '../../lib/permalink';
import type { Kanton } from '../../types/legal';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { Field } from '../vorlagen/ui';
import { datumOderStrich } from '../ui/datumText';
import { REGIMES, VJ_BEGINN_DEFAULT, VJ_LINK_SPEC } from './verjaehrungTexte';
import { teileWahl } from './schnellFormTexte';
import { SchnellFormFuss } from './SchnellFormFuss';

// ─── Verjährung als Schnellwerkzeug der Startseite (U2, 24.9.2026) ──────────
//
// David 24.9.2026: «ich möchte dass man bei den schnellwerkzeugen auswählen
// kann» → Frist · Verzugszins · Verjährung. Reine Kompositions-Schicht (§3)
// wie `EinfacheFristForm minimal`: rechnet mit DERSELBEN Engine
// (`berechneVerjaehrung`, Art. 60, 67, 127 ff. OR), denselben Anspruchstypen
// und Link-Kodierung wie der volle Rechner (`verjaehrungTexte.ts`, §5), und
// baut den Engine-Input nach DERSELBEN Regel wie `VerjaehrungForm` (absoluter
// Beginn nur bei Regimen mit absoluter Frist) — keine eigene, keine
// vereinfachte Rechtslogik (§1/§2).
//
// IN DER SCHNELLFORM (rechtlich entscheidend): der Anspruchstyp (er bestimmt
// Fristlänge und Beginn — 10/5 Jahre ab Fälligkeit oder 3 Jahre ab Kenntnis
// mit absoluter Frist), der Beginn der relativen Frist, bei Regimen mit
// absoluter Frist auch deren Beginn, Stichtag und Kanton (Fristende an
// Sa/So/Feiertag, Art. 78 OR).
// WEGGELASSEN, mit sichtbarer Annahme (§8) und Weiterweg in den Rechner, der
// die Werte per Permalink übernimmt: Unterbrechungen (Art. 135 OR),
// Stillstand (Art. 134 OR), Einredeverzicht (Art. 141 OR) und der Hinweis auf
// die strafrechtliche Längerfrist (Art. 60 Abs. 2 OR). Die Engine bekommt
// genau das, was der volle Rechner mit leeren Listen und ohne Häkchen übergibt.

export function VerjaehrungSchnellForm() {
  const heute = format(new Date(), 'yyyy-MM-dd');
  const [regime, setRegime] = useState<VerjaehrungRegime>('ordentlich');
  const [beginnRelativ, setBeginnRelativ] = useState(VJ_BEGINN_DEFAULT);
  const [beginnAbsolut, setBeginnAbsolut] = useState('');
  const [stichtag, setStichtag] = useState(heute);
  const [kanton, setKanton] = useState<Kanton>(getStandardKanton);

  const R = REGIMES.find((r) => r.code === regime)!;
  const wahl = teileWahl(R.label);
  const hatAbsolut = REGIME[regime].absolutJahre !== null;
  // Feldnamen wörtlich wie im vollen Rechner (`VerjaehrungForm`).
  const beginnLabel = hatAbsolut
    ? regime === 'bereicherung' ? 'Kenntnis des Anspruchs' : 'Kenntnis von Schaden und Person'
    : 'Fälligkeit der Forderung';
  const absolutLabel = regime === 'bereicherung' ? 'Entstehung des Anspruchs' : 'Schädigendes Verhalten (bzw. dessen Ende)';

  const input: VerjaehrungInput = {
    regime,
    beginnRelativ,
    beginnAbsolut: hatAbsolut && beginnAbsolut ? beginnAbsolut : undefined,
    stichtag,
    kanton,
    strafbareHandlung: hatAbsolut && regime !== 'bereicherung' ? false : undefined,
    stillstaende: [],
    unterbrechungen: [],
    verzicht: undefined,
  };
  let ergebnis: VerjaehrungErgebnis | null;
  try { ergebnis = beginnRelativ && stichtag ? berechneVerjaehrung(input) : null; } catch { ergebnis = null; }

  const rechnerZiel = '/rechner/verjaehrung' + permalinkKodieren(VJ_LINK_SPEC, {
    regime, beginnRelativ, beginnAbsolut: beginnAbsolut || undefined, stichtag, kanton,
  });

  return (
    // Füllt die Bühne des Schnellwerkzeugs (Mindesthöhe, `start/Schnellwerkzeug`);
    // der Fuss steht unten (`mt-auto`), der Leerraum einer kürzeren Form liegt
    // damit zwischen Ergebnis und Fuss statt unter dem Fuss.
    // U9 (David 24.9.2026 abends «schnellwerkzeug soll kleiner werden»): Abstand
    // `gap-3` wie der Frist-Block (`start/Schnellwerkzeug`) statt `gap-4` — die
    // Bühne reserviert nur noch die Frist-Höhe, jede höhere Variante lässt die
    // Spalte wachsen; −12 px ohne Feld- oder Textverlust.
    <div className="flex flex-1 flex-col gap-3">
      <Field label="Anspruchstyp" hint={wahl.detail}>
        <select value={regime} onChange={(e) => setRegime(e.target.value as VerjaehrungRegime)} className="lc-input w-full">
          {REGIMES.map((r) => <option key={r.code} value={r.code}>{teileWahl(r.label).name}</option>)}
        </select>
      </Field>
      {/* Zwei Spalten erst ab 16.5 rem Flächenbreite (2 × 126 px Datumsfeld +
          Abstand) — dieselbe Schwelle wie `EinfacheFristForm minimal`. */}
      <div className="grid grid-cols-1 @[16.5rem]:grid-cols-2 gap-3 items-end">
        <Field label={beginnLabel}>
          <DatumsFeld value={beginnRelativ} onChange={setBeginnRelativ} className="lc-input w-full" />
        </Field>
        {hatAbsolut && (
          <Field label={absolutLabel}>
            <DatumsFeld value={beginnAbsolut} onChange={setBeginnAbsolut} className="lc-input w-full" />
          </Field>
        )}
        <Field label="Stichtag">
          <DatumsFeld value={stichtag} onChange={setStichtag} className="lc-input w-full" />
        </Field>
        <Field label="Kanton (Feiertage)">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)} className="lc-input w-full">
            {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
      </div>

      {/* Ohne die Zeile «Live-Berechnung …» (`live={false}`; `aria-live` bleibt
          am Block): in der 20-rem-Spalte kostet sie ~50 px, die Form ist
          ohnehin sichtbar live. */}
      {ergebnis && (
        <ErgebnisBlock id="lc-ergebnis-schnell-verjaehrung" sprung={false} live={false}>
          <div className="lc-notice space-y-1.5">
            <p className="lc-overline">Verjährungseintritt</p>
            <p className={`text-h3 font-semibold text-ink-900 ${ergebnis.verjaehrungISO ? 'num' : ''}`}>
              {ergebnis.verjaehrungISO ? `${datumOderStrich(ergebnis.verjaehrungISO)} · 24.00 Uhr` : 'noch offen'}
            </p>
            <p className="text-body-s text-ink-600">
              {ergebnis.status !== 'ok'
                ? ergebnis.ergebnis
                : `Am Stichtag ${ergebnis.verjaehrtAmStichtag ? 'verjährt (Einrede, Art. 142 OR)' : 'nicht verjährt'}`
                  + (hatAbsolut && ergebnis.massgeblicheFrist ? ` · massgeblich: ${ergebnis.massgeblicheFrist === 'relativ' ? 'relative' : 'absolute'} Frist` : '')}
            </p>
          </div>
        </ErgebnisBlock>
      )}

      <SchnellFormFuss normverweise={ergebnis?.normverweise ?? []} hinweise={ergebnis?.warnungen.length ?? 0}
        annahmen={`keine Unterbrechung (Art. 135 OR), kein Stillstand (Art. 134 OR), kein Einredeverzicht (Art. 141 OR)${input.strafbareHandlung === false ? ', keine strafbare Handlung (Art. 60 Abs. 2 OR)' : ''}`}
        rechnerZiel={rechnerZiel} rechnerName="Verjährungsrechner" />
    </div>
  );
}
