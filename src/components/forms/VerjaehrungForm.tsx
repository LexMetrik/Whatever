import { KANTONE } from '../../lib/kantone';
import { NormText } from '../NormText';
import { BeispielChips, Checkbox, EckdatenKachel, Field, GruppenTitel, inputCls, ListenEditor } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { useState } from 'react';
import { format } from 'date-fns';
import type { Kanton } from '../../types/legal';
import {
  berechneVerjaehrung, REGIME,
  type VerjaehrungInput, type VerjaehrungRegime, type VerjaehrungErgebnis,
  type Unterbrechung, type UnterbrechungsTyp, type Stillstand,
} from '../../lib/verjaehrung';
// Disclaimer und Anspruchstypen teilt sich dieses Formular mit der Schnellform
// der Startseite (§5, W2·29-WERKBANK-START-UEBERARBEITUNG U2).
import { VERJ_DISCLAIMER, REGIMES, VJ_LINK_SPEC, VJ_BEGINN_DEFAULT } from './verjaehrungTexte';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';
import { datumOderStrich } from '../ui/datumText';

const U_TYPEN: { code: UnterbrechungsTyp; label: string }[] = [
  { code: 'anerkennung', label: 'Anerkennung (z. B. Abschlagszahlung)' },
  { code: 'urkunde_urteil', label: 'Anerkennung durch Urkunde / Urteil (→ 10 Jahre)' },
  { code: 'betreibungsakt', label: 'Betreibungsakt' },
  { code: 'klage_schlichtung', label: 'Schlichtungsgesuch / Klage' },
];

const STILLSTAND_GRUENDE = [
  'Forderung Kind ↔ Eltern (elterliche Sorge, Ziff. 1)',
  'Forderung ↔ vorsorgebeauftragte Person (Ziff. 2)',
  'Forderung unter Ehegatten (Ziff. 3) / eingetragenen Partnern (Ziff. 3bis)',
  'Arbeitnehmer in Hausgemeinschaft (Ziff. 4)',
  'Nutzniessung des Schuldners (Ziff. 5)',
  'Forderung vor keinem Gericht geltend machbar (Ziff. 6)',
  'Öffentliches Inventar (Ziff. 7)',
  'Vereinbarte aussergerichtliche Streitbeilegung (Ziff. 8, schriftlich)',
];



// Eckdaten-Karte für eine Verjährungsfrist; die massgebliche (= frühere)
// Frist erhält Goldrand und Badge.
function FristKarte({ label, sub, wert, massgeblich }: { label: string; sub: string; wert: string; massgeblich: boolean }) {
  return (
    // R2-F/F1-5: war `border-brass-500 border-t-[3px]` — das färbte ALLE vier
    // Kanten messingfarben, während dieselbe «massgeblich»-Markierung überall
    // sonst (EckdatenKachel, Beurkundung, Prozesskosten …) nur die Oberkante
    // trägt. Kanon ist `.lc-akzent-w` (index.css), Seitenkanten bleiben
    // `--line`.
    <div className={`lc-tile ${massgeblich ? 'lc-akzent-w' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs text-ink-500">{label}</p>
        {massgeblich && <span className="lc-badge lc-badge-massgeblich shrink-0">massgeblich</span>}
      </div>
      <p className="text-body-l font-semibold text-ink-900 num">{wert}</p>
      <p className="text-xs text-ink-500 mt-0.5">{sub}</p>
    </div>
  );
}

export function VerjaehrungForm() {
  const pk = usePaneKlasse();
  const ausLink = usePermalinkFelder(VJ_LINK_SPEC);
  const heute = format(new Date(), 'yyyy-MM-dd');
  const [regime, setRegime] = useState<VerjaehrungRegime>((ausLink.regime as VerjaehrungRegime | undefined) ?? 'ordentlich');
  const [beginnRelativ, setBeginnRelativ] = useState(ausLink.beginnRelativ ?? VJ_BEGINN_DEFAULT);
  const [beginnAbsolut, setBeginnAbsolut] = useState(ausLink.beginnAbsolut ?? '');
  const [stichtag, setStichtag] = useState(ausLink.stichtag ?? heute);
  const [kanton, setKanton] = useState<Kanton>((ausLink.kanton as Kanton | undefined) ?? getStandardKanton());
  const [strafbar, setStrafbar] = useState(ausLink.strafbar ?? false);
  const [stillstaende, setStillstaende] = useState<Stillstand[]>(ausLink.stillstaende ?? []);
  const [unterbrechungen, setUnterbrechungen] = useState<Unterbrechung[]>(ausLink.unterbrechungen ?? []);
  const [verzichtAn, setVerzichtAn] = useState(ausLink.verzichtAn ?? false);
  const [verzichtDatum, setVerzichtDatum] = useState(ausLink.verzichtDatum ?? '');
  const [verzichtJahre, setVerzichtJahre] = useState(ausLink.verzichtJahre ?? '');
  const [verzichtBis, setVerzichtBis] = useState(ausLink.verzichtBis ?? '');

  // UX-Programm B7 (5.6.2026): Presets für den schnellen Einstieg — reine
  // UI-Zustände, keine Engine-Logik. Daten bewusst fix (nachvollziehbar).
  const ladePreset = (regime_: VerjaehrungRegime, relativ: string, absolut: string) => {
    setRegime(regime_); setBeginnRelativ(relativ); setBeginnAbsolut(absolut);
    setStrafbar(false); setStillstaende([]); setUnterbrechungen([]);
    setVerzichtAn(false); setVerzichtDatum(''); setVerzichtJahre(''); setVerzichtBis('');
  };
  const PRESETS = [
    { label: 'Offene Rechnung (10 J.)', laden: () => ladePreset('ordentlich', '2019-09-15', '') },
    { label: 'Mietzins (5 J.)', laden: () => ladePreset('kurz', '2022-01-01', '') },
    { label: 'Delikt (3/10 J.)', laden: () => ladePreset('delikt', '2024-03-01', '2023-11-20') },
  ];

  const R = REGIMES.find((r) => r.code === regime)!;
  const hatAbsolut = REGIME[regime].absolutJahre !== null;
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
    strafbareHandlung: hatAbsolut && regime !== 'bereicherung' ? strafbar : undefined,
    stillstaende: stillstaende.filter((s) => s.von && s.bis),
    unterbrechungen: unterbrechungen.filter((u) => u.datum),
    verzicht: verzichtAn && verzichtDatum
      ? {
          datum: verzichtDatum,
          jahre: verzichtJahre.trim() === '' ? undefined : Number(verzichtJahre),
          bis: verzichtBis || undefined,
        }
      : undefined,
  };

  let ergebnis: VerjaehrungErgebnis | null;
  try { ergebnis = beginnRelativ && stichtag ? berechneVerjaehrung(input) : null; } catch { ergebnis = null; }

  const eingaben: Record<string, string> = {
    'Anspruchstyp': R.label,
    [beginnLabel]: datumOderStrich(beginnRelativ),
    ...(hatAbsolut && beginnAbsolut ? { [absolutLabel]: datumOderStrich(beginnAbsolut) } : {}),
    'Stichtag': datumOderStrich(stichtag),
    'Kanton (Feiertage, Erfüllungsort)': kanton,
    ...(stillstaende.length ? { 'Stillstand (Art. 134 OR)': stillstaende.map((s) => `${datumOderStrich(s.von)}–${datumOderStrich(s.bis)}`).join('; ') } : {}),
    ...(unterbrechungen.length ? { 'Unterbrechungen (Art. 135 OR)': unterbrechungen.map((u) => `${U_TYPEN.find((t) => t.code === u.typ)?.label} am ${datumOderStrich(u.datum)}`).join('; ') } : {}),
    ...(verzichtAn && verzichtDatum ? { 'Einredeverzicht (Art. 141 OR)': `vom ${datumOderStrich(verzichtDatum)}${
      verzichtBis ? ` bis ${datumOderStrich(verzichtBis)}` : verzichtJahre.trim() ? ` für ${verzichtJahre.trim()} Jahre` : ' (ohne Dauer)'}` } : {}),
  };

  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Verjährung (Art. 127 ff. OR)',
    domain: 'verjaehrung',
    fileBase: 'Verjaehrung',
    inputs: eingaben,
    sections: ergebnis ? [{ titel: 'Verjährung (Art. 60, 67, 127 ff. OR)', ergebnis }] : [],
    disclaimer: VERJ_DISCLAIMER,
  };

  const setU = (i: number, patch: Partial<Unterbrechung>) =>
    setUnterbrechungen((arr) => arr.map((u, j) => (j === i ? { ...u, ...patch } : u)));

  return (
    <div className="space-y-6">
      {/* Pflicht-Disclaimer */}
      <PflichtDisclaimer kurz="Verjährungs-Orientierung (Art. 60/67/127 ff. OR). Kenntniszeitpunkt und Sonderfristen sind fachlich zu prüfen." text={VERJ_DISCLAIMER} />

      <BeispielChips items={PRESETS} />

      {/* Anspruchstyp */}
      <Field label="Anspruchstyp / Rechtsgrund" hint={R.hint}>
        <select value={regime} onChange={(e) => setRegime(e.target.value as VerjaehrungRegime)} className={inputCls}>
          {REGIMES.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
        </select>
      </Field>

      {/* Daten */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label={beginnLabel} hint="Beginn der (relativen) Frist – der Beginntag zählt nicht (Art. 132 OR)">
          <DatumsFeld value={beginnRelativ} onChange={setBeginnRelativ} className={inputCls} />
        </Field>
        {hatAbsolut && (
          <Field label={absolutLabel} hint="Beginn der absoluten Frist – läuft unabhängig von Kenntnis">
            <DatumsFeld value={beginnAbsolut} onChange={setBeginnAbsolut} className={inputCls} />
          </Field>
        )}
        <Field label="Stichtag (Prüfdatum)">
          <DatumsFeld value={stichtag} onChange={setStichtag} className={inputCls} />
        </Field>
        <Field label="Kanton (Feiertage am Erfüllungsort)" hint="Fristende an Sa/So/Feiertag → nächster Werktag (Art. 78 OR)">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)} className={inputCls}>
            {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
      </div>

      {hatAbsolut && regime !== 'bereicherung' && (
        <Checkbox checked={strafbar} onChange={setStrafbar} label="Das schädigende Verhalten ist eine strafbare Handlung (Art. 60 Abs. 2 OR – strafrechtliche Längerfrist vorbehalten)" />
      )}

      {/* Unterbrechungen */}
      <div className="space-y-2">
        <GruppenTitel><NormText text={`Unterbrechungen (Art. 135 OR) – Frist beginnt neu`} /></GruppenTitel>
        {/* R2-F/F1-9: die beiden Repeater dieser Fläche standen als nackte
            `flex`-Zeilen ohne Behälter da; Kanon ist der ListenEditor
            (lc-panel je Eintrag, «entfernen» klein, «+ <Element>»). */}
        <ListenEditor
          element="Unterbrechung"
          eintraege={unterbrechungen}
          className="space-y-2"
          onHinzufuegen={() => setUnterbrechungen((arr) => [...arr, { typ: 'anerkennung', datum: '' }])}
          onEntfernen={(i) => setUnterbrechungen((arr) => arr.filter((_, j) => j !== i))}
          kinder={(u, i) => (
            <div className="flex flex-wrap items-center gap-2">
              <select value={u.typ} onChange={(e) => setU(i, { typ: e.target.value as UnterbrechungsTyp })} className={inputCls + ' sm:max-w-xs'}>
                {U_TYPEN.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
              <span className="text-body-s text-ink-500">am</span>
              <DatumsFeld value={u.datum} onChange={(v) => setU(i, { datum: v })} className={inputCls} wrapperClassName="w-full sm:w-44" />
              {u.typ === 'klage_schlichtung' && (
                <>
                  <span className="text-body-s text-ink-500">rechtskräftig erledigt am</span>
                  <DatumsFeld value={u.prozessEnde ?? ''} onChange={(v) => setU(i, { prozessEnde: v || undefined })} className={inputCls} wrapperClassName="w-full sm:w-44" />
                  <Checkbox
                    checked={u.mitUrteil ?? false}
                    onChange={(v) => setU(i, { mitUrteil: v })}
                    label="durch Urteil (→ 10 Jahre)"
                  />
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Stillstand */}
      <div className="space-y-2">
        <GruppenTitel><NormText text={`Stillstand / Hemmung (Art. 134 OR) – Uhr pausiert`} /></GruppenTitel>
        <ListenEditor
          element="Stillstandsperiode"
          eintraege={stillstaende}
          className="space-y-2"
          onHinzufuegen={() => setStillstaende((arr) => [...arr, { von: '', bis: '', grund: STILLSTAND_GRUENDE[0] }])}
          onEntfernen={(i) => setStillstaende((arr) => arr.filter((_, j) => j !== i))}
          kinder={(s, i) => (
            <div className="flex flex-wrap items-center gap-2">
              <select value={s.grund ?? STILLSTAND_GRUENDE[0]} onChange={(e) => setStillstaende((arr) => arr.map((x, j) => (j === i ? { ...x, grund: e.target.value } : x)))} className={inputCls + ' sm:max-w-xs'}>
                {STILLSTAND_GRUENDE.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="text-body-s text-ink-500">von</span>
              <DatumsFeld value={s.von} onChange={(v) => setStillstaende((arr) => arr.map((x, j) => (j === i ? { ...x, von: v } : x)))} className={inputCls} wrapperClassName="w-full sm:w-44" />
              <span className="text-body-s text-ink-500">bis</span>
              <DatumsFeld value={s.bis} onChange={(v) => setStillstaende((arr) => arr.map((x, j) => (j === i ? { ...x, bis: v } : x)))} className={inputCls} wrapperClassName="w-full sm:w-44" />
            </div>
          )}
        />
      </div>

      {/* Verzicht */}
      <div className="space-y-2">
        <Checkbox checked={verzichtAn} onChange={setVerzichtAn} label="Schriftlicher Verzicht auf die Verjährungseinrede (Art. 141 OR)" />
        {verzichtAn && (
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <span className="text-body-s text-ink-500">erklärt am</span>
            <DatumsFeld value={verzichtDatum} onChange={setVerzichtDatum} className={inputCls} wrapperClassName="w-full sm:w-44" />
            <span className="text-body-s text-ink-500">für</span>
            {/* UI-04 (RL-14): kein Platzhalter «10» — ohne Dauer rechnet die
                Engine nicht still, sondern warnt. Fehlermarke erst nach
                Eingabe (leeres Feld ist kein Fehler). */}
            <input type="number" inputMode="numeric" min={1} max={10} step={1} value={verzichtJahre}
              aria-label="Verzichtsdauer in Jahren"
              aria-invalid={verzichtJahre.trim() !== '' && !(Number.isInteger(Number(verzichtJahre)) && Number(verzichtJahre) >= 1)}
              onChange={(e) => setVerzichtJahre(e.target.value)} className={inputCls + ' w-24'} />
            <span className="text-body-s text-ink-500">Jahre ab Erklärung, oder bis</span>
            <DatumsFeld value={verzichtBis} onChange={setVerzichtBis} className={inputCls} wrapperClassName="w-full sm:w-44" />
            <p className="w-full text-xs text-ink-500">
              Höchstens 10 Jahre je Verzicht (Art. 141 Abs. 1 OR). Ab wann die Dauer läuft, lässt das Gesetz offen;
              gerechnet wird ab dem Datum der Erklärung (Hinweis im Ergebnis).
            </p>
          </div>
        )}
      </div>

      {ergebnis && (
        <ErgebnisBlock>
          {/* Eckdaten – relative und absolute Frist getrennt; die massgebliche trägt das Badge */}
          <div className={pk(`grid grid-cols-1 sm:grid-cols-2 ${hatAbsolut ? 'lg:grid-cols-4' : 'sm:grid-cols-3'} gap-3`, `grid grid-cols-1 @lg/pane:grid-cols-2 ${hatAbsolut ? '@4xl/pane:grid-cols-4' : '@xl/pane:grid-cols-3'} gap-3`)}>
            <FristKarte
              label={hatAbsolut ? `Relative Frist – ${REGIME[regime].relativJahre} Jahre` : `Frist – ${REGIME[regime].relativJahre} Jahre`}
              sub={`ab ${beginnLabel}`}
              wert={ergebnis.relativEndeISO ? datumOderStrich(ergebnis.relativEndeISO) : 'steht still (Art. 138 Abs. 1)'}
              massgeblich={hatAbsolut && ergebnis.massgeblicheFrist === 'relativ'}
            />
            {hatAbsolut && (
              <FristKarte
                label={`Absolute Frist – ${REGIME[regime].absolutJahre} Jahre`}
                sub={`ab ${absolutLabel}`}
                wert={ergebnis.absolutEndeISO ? datumOderStrich(ergebnis.absolutEndeISO) : '–'}
                massgeblich={ergebnis.massgeblicheFrist === 'absolut'}
              />
            )}
            {/* LM-034: «noch offen» ist ein Satz, keine Zahl — Mono nur, wenn
                ein Datum steht (DESIGN-REGLEMENT §4b(e)). */}
            <EckdatenKachel akzent num={!!ergebnis.verjaehrungISO} label="Verjährungseintritt"
              wert={ergebnis.verjaehrungISO ? `${datumOderStrich(ergebnis.verjaehrungISO)} · 24.00 Uhr` : 'noch offen'} />
            <div className="lc-tile">
              <p className="text-xs text-ink-500 mb-1">Am Stichtag ({datumOderStrich(stichtag)})</p>
              <p className="text-body-l font-semibold">
                {ergebnis.status !== 'ok'
                  ? <span className="text-ink-500">Eingaben unvollständig</span>
                  : ergebnis.verjaehrtAmStichtag && ergebnis.einredeAusgeschlossenAmStichtag && ergebnis.verzichtBisISO
                    // F5-03 (RL-14): Verjährung eingetreten, Einrede aber durch Verzicht ausgeschlossen — kein Rot.
                    ? <span className="text-warn-700"><NormText text={`verjährt – Einrede durch Verzicht bis ${datumOderStrich(ergebnis.verzichtBisISO)} ausgeschlossen (Art. 141 OR)`} /></span>
                  : ergebnis.verjaehrtAmStichtag
                    ? <span className="text-danger-700"><NormText text={`verjährt (Einrede, Art. 142 OR)`} /></span>
                    : <span className="text-ok-text">nicht verjährt</span>}
              </p>
            </div>
          </div>
          {ergebnis.verzichtBisISO && (
            <p className="text-body-s text-ink-500 num">Einredeverzicht wirkt bis {datumOderStrich(ergebnis.verzichtBisISO)} (Art. 141 OR).</p>
          )}

          <ErgebnisAnzeige titel="Verjährung (Art. 60, 67, 127 ff. OR)" ergebnis={ergebnis} />
          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(VJ_LINK_SPEC, {
              regime, beginnRelativ, beginnAbsolut: beginnAbsolut || undefined, stichtag, kanton,
              strafbar, stillstaende, unterbrechungen, verzichtAn,
              verzichtDatum: verzichtDatum || undefined, verzichtJahre: verzichtJahre || undefined,
              verzichtBis: verzichtBis || undefined,
            })}
            ics={[{ endISO: ergebnis.verjaehrungISO,
              titel: `Verjährungseintritt – ${(REGIMES.find((r) => r.code === regime)?.label ?? '').split(' – ')[0]}`,
              beschreibung: ergebnis.ergebnis, dateiName: 'Verjaehrung.ics' }]} />
        </ErgebnisBlock>
      )}
    </div>
  );
}
