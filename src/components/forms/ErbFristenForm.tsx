import { useState } from 'react';
import { KANTONE } from '../../lib/kantone';
import { Checkbox, EckdatenKachel, Field, inputCls } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import type { Kanton } from '../../types/legal';
import { berechneErbFrist, ERB_FRISTEN, type ErbFristKey } from '../../lib/erbFristen';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, istISO, istKanton, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';

// ─── Erb-Fristen-Rechner (Darstellung) ───────────────────────────────────────
// Reine Darstellung über src/lib/erbFristen.ts (§3): Tatbestand wählen,
// Trigger-Datum eingeben — Fristzahlen/Trigger-Texte kommen aus dem Katalog
// der Engine (§5: eine Quelle).

const ERB_DISCLAIMER =
  'Automatisierte Orientierungsberechnung erbrechtlicher Fristen (Art. 521, 533, 567 ff. ZGB) – keine ' +
  'Rechtsberatung. Der massgebliche Fristbeginn («Kenntnis», amtliche Mitteilung, Eröffnung) ist Tatfrage ' +
  'und wird als Eingabe übernommen. Für die Klagefristen ist die Berechnungskonvention (Art. 77 OR analog) ' +
  'höchstrichterlich nicht fixiert; im Grenzfall anwaltlich prüfen. Zuständige Behörde und kantonales ' +
  'Verfahren (Ausschlagung/Inventar) sind kantonal geregelt.';

// Permalink (FAHRPLAN-PRAXIS 1.3)
type EfLink = { key: string; trigger: string; verschieben?: boolean; kanton?: string };
const EF_LINK_SPEC: PermalinkSpec<EfLink & Record<string, unknown>> = {
  key: { p: 'p', typ: 'str', gueltig: (v) => ERB_FRISTEN.some((x) => x.key === v) },
  trigger: { p: 't', typ: 'str', gueltig: istISO },
  verschieben: { p: 'w', typ: 'bool' },
  kanton: { p: 'k', typ: 'str', gueltig: istKanton },
};

export function ErbFristenForm() {
  const ausLink = usePermalinkFelder(EF_LINK_SPEC);
  const [key, setKey] = useState<ErbFristKey>((ausLink.key as ErbFristKey | undefined) ?? 'ausschlagung_gesetzlich');
  const [trigger, setTrigger] = useState(ausLink.trigger ?? '2026-03-10');
  const [verschieben, setVerschieben] = useState(ausLink.verschieben ?? true);
  const [kanton, setKanton] = useState<Kanton>((ausLink.kanton as Kanton | undefined) ?? getStandardKanton());

  const pk = usePaneKlasse();
  const preset = ERB_FRISTEN.find((p) => p.key === key)!;
  const erbgang = ERB_FRISTEN.filter((p) => p.gruppe === 'erbgang');
  const klagen = ERB_FRISTEN.filter((p) => p.gruppe === 'klage');

  let ergebnis: ReturnType<typeof berechneErbFrist> | null;
  try {
    ergebnis = trigger
      ? berechneErbFrist({ key, trigger, werktagsVerschiebung: verschieben, kanton: verschieben ? kanton : undefined })
      : null;
  } catch {
    ergebnis = null;
  }

  const eingaben = {
    'Tatbestand': preset.label,
    'Auslösendes Ereignis': trigger.split('-').reverse().join('.'),
    'Werktags-Verschiebung': verschieben ? `ja (${kanton})` : 'nein',
  };
  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Erbrechtliche Fristen (ZGB)',
    domain: 'erb-fristen',
    fileBase: 'Erb-Fristen',
    inputs: eingaben,
    sections: ergebnis ? [{ titel: `Erb-Frist: ${preset.label}`, ergebnis }] : [],
    disclaimer: ERB_DISCLAIMER,
  };

  return (
    <div className="space-y-6">
      <PflichtDisclaimer
        kurz="Erbrechtliche Fristen-Orientierung (Art. 521/533/567 ff. ZGB). Fristbeginn und Behördenzuständigkeit sind fachlich zu prüfen."
        text={ERB_DISCLAIMER}
      />

      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Tatbestand" hint={preset.norm}>
          <select className={inputCls} value={key} onChange={(e) => setKey(e.target.value as ErbFristKey)}>
            <optgroup label="Erbgang: Ausschlagung & Inventar">
              {erbgang.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </optgroup>
            <optgroup label="Klagefristen (1/10/30-Muster)">
              {klagen.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </optgroup>
          </select>
        </Field>
        <Field label="Auslösendes Ereignis (Datum)" hint={preset.trigger}>
          <DatumsFeld value={trigger} onChange={setTrigger} className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Checkbox checked={verschieben} onChange={setVerschieben} label="Fristende auf Sa/So/Feiertag → nächster Werktag (Art. 78 OR analog)" />
        {verschieben && (
          <label className="flex items-center gap-2 text-body-s text-ink-700">
            Kanton (Behördensitz)
            <select className={inputCls + ' w-auto'} value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)}>
              {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
        )}
      </div>

      {ergebnis && (
        <ErgebnisBlock>
          <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
            <EckdatenKachel akzent num label="Fristende" wert={ergebnis.resultat.endDatum}
              sub={ergebnis.resultat.endWochentag} />
            <EckdatenKachel num label="Frist"
              wert={`${preset.laenge} ${preset.einheit === 'monate' ? 'Monat(e)' : 'Jahr(e)'}`}
              sub={preset.norm} />
            <EckdatenKachel label="Verschoben" wert={ergebnis.resultat.verschoben ? 'ja' : 'nein'}
              sub={ergebnis.resultat.verschoben ? ergebnis.resultat.verschiebeGruende.join(' · ') : 'Fristende ist Werktag bzw. Verschiebung ist ausgeschaltet'} />
          </div>
          <ErgebnisAnzeige titel={`Erb-Frist: ${preset.label}`} ergebnis={ergebnis} />
          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(EF_LINK_SPEC, { key, trigger, verschieben, kanton })}
            ics={[{ endISO: ergebnis.resultat.endDatumISO, titel: `Fristende – ${preset.label}`,
              beschreibung: ergebnis.ergebnis, dateiName: 'Erb-Frist.ics' }]} />
        </ErgebnisBlock>
      )}
    </div>
  );
}
