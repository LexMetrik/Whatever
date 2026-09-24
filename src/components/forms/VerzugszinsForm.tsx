import { BeispielChips, Checkbox, EckdatenKachel, Field, ListenEditor } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { useState } from 'react';
import { BetragsFeld } from '../BetragsFeld';
import { berechneVerzugszins, formatCHF } from '../../lib/verzugszins';
import type {
  VerzugszinsInput, VerzugszinsMethode, SatzGrund, VerzugsbeginnTyp, VerzugszinsErgebnis, VzEreignis,
} from '../../lib/verzugszins';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, istISO, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { VerzugszinsTimeline } from '../VerzugszinsTimeline';
import { usePaneKlasse } from '../layout/PaneKontext';
import { datumOderStrich } from '../ui/datumText';

const VERZUGSZINS_DISCLAIMER =
  'Automatisierte Orientierungsberechnung des Verzugszinses nach Art. 104 OR – keine Rechtsberatung. ' +
  'Art. 104 OR fixiert den Zinssatz, nicht die Tageszählung; die gewählte Methode ist im Einzelfall zu prüfen. ' +
  'Ein über den Verzugszins hinausgehender Schaden bleibt vorbehalten (Art. 106 OR).';

const METHODEN: { code: VerzugszinsMethode; label: string }[] = [
  { code: 'act365', label: 'Tatsächliche Tage / 365 (Zürcher Gerichtsrechner)' },
  { code: 'act360', label: 'Tatsächliche Tage / 360 (Bankusanz)' },
  { code: '30E360', label: '30E/360 (kaufmännisch)' },
];
const GRUENDE: { code: SatzGrund; label: string }[] = [
  { code: 'gesetzlich', label: 'Gesetzlich – 5 % (Art. 104 Abs. 1)' },
  { code: 'vertraglich', label: 'Vertraglich höher (Art. 104 Abs. 2)' },
  { code: 'kaufmaennisch', label: 'Kaufmännischer Diskonto (Art. 104 Abs. 3)' },
];
const BEGINN: { code: VerzugsbeginnTyp; label: string }[] = [
  { code: 'mahnung', label: 'Mahnung – ab Erhalt (Art. 102 Abs. 1)' },
  { code: 'verfalltag', label: 'Verfalltag – Zins ab Folgetag (Art. 102 Abs. 2)' },
  { code: 'klage', label: 'Klage/Betreibung – ab Zustellung' },
];

// Reine Eingabedaten (Permalink/Beispiele) vs. State-Zeile mit stabiler id.
// Die id ist nur UI-Identität (React-key) und erreicht die Engine NIE.
type EreignisEingabe = { typ: 'teilzahlung' | 'satzaenderung'; datum: string; wert: number };
type EreignisRow = EreignisEingabe & { id: string };

const neueRowId = (): string =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `r-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

const mitId = (r: EreignisEingabe): EreignisRow => ({ ...r, id: neueRowId() });

const DEFAULTS: VerzugszinsInput = {
  kapital: 10000, verzugsbeginn: '2024-01-01', beginnTyp: 'mahnung', stichtag: '2025-01-01',
  zinssatzProzent: 5, satzGrund: 'gesetzlich', methode: 'act365',
};

type State = { form: VerzugszinsInput; rows: EreignisEingabe[]; zinsforderung: boolean };

const BEISPIELE: { label: string; state: State }[] = [
  { label: 'Rechnung offen, 5 %', state: { form: { ...DEFAULTS, kapital: 5000, verzugsbeginn: '2025-03-01', stichtag: '2025-09-01' }, rows: [], zinsforderung: false } },
  { label: 'Mit Teilzahlung', state: { form: { ...DEFAULTS, kapital: 10000, verzugsbeginn: '2024-01-01', stichtag: '2025-01-01' }, rows: [{ typ: 'teilzahlung', datum: '2024-07-01', wert: 4000 }], zinsforderung: false } },
  { label: 'Vertraglich 8 %', state: { form: { ...DEFAULTS, kapital: 20000, zinssatzProzent: 8, satzGrund: 'vertraglich', verzugsbeginn: '2024-06-01', stichtag: '2025-06-01' }, rows: [], zinsforderung: false } },
  { label: 'Satzwechsel', state: { form: { ...DEFAULTS, kapital: 15000, verzugsbeginn: '2024-01-01', stichtag: '2025-06-30' }, rows: [{ typ: 'satzaenderung', datum: '2025-01-01', wert: 4 }], zinsforderung: false } },
];

function heuteISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}


// Permalink (FAHRPLAN-PRAXIS 1.3): Input + Ereignis-Zeilen + Zinsforderung.
type VzLink = VerzugszinsInput & { rows?: EreignisEingabe[]; zinsforderung?: boolean } & Record<string, unknown>;
const VZ_LINK_SPEC: PermalinkSpec<VzLink> = {
  kapital: { p: 'c', typ: 'num', gueltig: (n) => n > 0 },
  verzugsbeginn: { p: 'vb', typ: 'str', gueltig: istISO },
  beginnTyp: { p: 'bt', typ: 'str', gueltig: einerVon('mahnung', 'verfalltag', 'klage') },
  stichtag: { p: 's', typ: 'str', gueltig: istISO },
  zinssatzProzent: { p: 'z', typ: 'num', gueltig: (n) => n >= 0 && n <= 100 },
  satzGrund: { p: 'sg', typ: 'str', gueltig: einerVon('gesetzlich', 'vertraglich', 'kaufmaennisch') },
  methode: { p: 'm', typ: 'str', gueltig: einerVon('act365', 'act360', '30E360') },
  rows: {
    p: 'r', typ: 'json',
    gueltig: (v): boolean => Array.isArray(v) && v.length <= 50 && v.every((e) =>
      e && typeof e === 'object'
      && ['teilzahlung', 'satzaenderung'].includes((e as { typ?: string }).typ ?? '')
      && istISO((e as { datum?: string }).datum ?? '')
      && Number.isFinite((e as { wert?: number }).wert)),
  },
  zinsforderung: { p: 'zf', typ: 'bool' },
};

export function VerzugszinsForm() {
  const pk = usePaneKlasse();
  const ausLink = usePermalinkFelder(VZ_LINK_SPEC);
  const [form, setForm] = useState<VerzugszinsInput>(() => {
    const rest = { ...ausLink };
    delete rest.rows; delete rest.zinsforderung;
    return { ...DEFAULTS, ...rest };
  });
  const [rows, setRows] = useState<EreignisRow[]>(() => (ausLink.rows ?? []).map(mitId));
  const [zinsforderung, setZinsforderung] = useState(ausLink.zinsforderung ?? false);

  const set = <K extends keyof VerzugszinsInput>(k: K, v: VerzugszinsInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const addRow = (typ: EreignisEingabe['typ']) => setRows((r) => [...r, mitId({ typ, datum: form.verzugsbeginn, wert: typ === 'teilzahlung' ? 1000 : 5 })]);
  const updateRow = (i: number, patch: Partial<EreignisEingabe>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const removeRow = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const ladeBeispiel = (s: State) => { setForm(s.form); setRows(s.rows.map(mitId)); setZinsforderung(s.zinsforderung); };

  // Live-Berechnung
  const ereignisse: VzEreignis[] = rows.map((r) =>
    r.typ === 'teilzahlung' ? { typ: 'teilzahlung', datum: r.datum, betrag: r.wert } : { typ: 'satzaenderung', datum: r.datum, satz: r.wert });
  let ergebnis: VerzugszinsErgebnis | null;
  try { ergebnis = berechneVerzugszins({ ...form, ereignisse, rueckstaendigeZinsforderung: zinsforderung }); } catch { ergebnis = null; }

  const eingaben: Record<string, string> = {
    'Geschuldeter Betrag (CHF)': String(form.kapital),
    'Verzugsbeginn': `${form.verzugsbeginn} (${BEGINN.find((b) => b.code === form.beginnTyp)?.label ?? ''})`,
    'Stichtag': form.stichtag,
    'Zinssatz (Start)': `${form.zinssatzProzent ?? 5} %`,
    'Tageszählung': METHODEN.find((m) => m.code === form.methode)?.label ?? '',
    ...(rows.length ? { 'Ereignisse': `${rows.length} (Teilzahlungen/Satzänderungen)` } : {}),
  };
  const inputNum = 'lc-input num';

  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Verzugszins',
    rechtsgrundlage: 'Berechnung nach Art. 104 OR',
    domain: 'verzugszins',
    fileBase: 'Verzugszins',
    inputs: eingaben,
    // Ergebnis-Hero aus bereits berechneten Werten (kein neuer Inhalt)
    hero: ergebnis ? {
      // Gleiche Hauptkennzahl wie die akzentuierte Bildschirm-Kachel
      // («Verzugszins (gesamt)» = zinsTotalCHF); ohne Teilzahlungs-Tilgung
      // ist zinsTotalCHF == zinsOffenCHF. Reine Anzeige-Wahl (§5/§8), der
      // offene Zins bleibt in der Volltext-Section aufgeschlüsselt.
      hauptlabel: 'Verzugszins (gesamt)',
      hauptwert: `CHF ${ergebnis.zinsTotalCHF}`,
      nebenwerte: [{ label: 'Total inkl. Kapital', wert: `CHF ${ergebnis.totalOffenCHF}` }],
      kontext: `${form.zinssatzProzent ?? 5} % auf CHF ${form.kapital} für ${ergebnis.tageTotal} Tage (${datumOderStrich(ergebnis.ersterZinstag)} – ${datumOderStrich(ergebnis.stichtag)})`,
    } : undefined,
    sections: ergebnis ? [{ titel: 'Verzugszins (Art. 104 OR)', ergebnis }] : [],
    disclaimer: VERZUGSZINS_DISCLAIMER,
  };

  return (
    <div className="space-y-6">
      <PflichtDisclaimer
        kurz="Verzugszins nach Art. 104 OR; die Tageszählungs-Methode ist eine offengelegte methodische Wahl."
        text={VERZUGSZINS_DISCLAIMER} />

      {/* Beispiele */}
      <BeispielChips items={BEISPIELE.map((b) => ({ label: b.label, laden: () => ladeBeispiel(b.state) }))} />

      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Geschuldeter Betrag (CHF)" hint="Verzugszins fällt nur auf dem tatsächlich geschuldeten Betrag an">
          <BetragsFeld value={form.kapital ? String(form.kapital) : ''} onChange={(v) => set('kapital', Number(v) || 0)} className={inputNum} placeholder="z. B. 10'000" />
        </Field>
        <Field label="Zinssatz (%)" hint="Default 5 % (Art. 104 Abs. 1 OR); z. B. ATSG 5 %, Steuern variabel">
          <input type="number" inputMode="decimal" min={0} step={0.25} value={form.zinssatzProzent ?? 5} onChange={(e) => set('zinssatzProzent', Number(e.target.value))} className={inputNum} />
        </Field>

        <Field label="Verzugsbeginn">
          <DatumsFeld value={form.verzugsbeginn} onChange={(v) => set('verzugsbeginn', v)} className="lc-input" />
        </Field>
        <Field label="Art des Verzugsbeginns">
          <select value={form.beginnTyp} onChange={(e) => set('beginnTyp', e.target.value as VerzugsbeginnTyp)} className="lc-input">
            {BEGINN.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
          </select>
        </Field>

        <Field label="Stichtag (Berechnung bis)" hint="Zahlung / Urteilstag / heute">
          <div className="flex gap-2">
            <DatumsFeld value={form.stichtag} onChange={(v) => set('stichtag', v)} className="lc-input" />
            {/* LM-099/LM-088 (W2·17-UI-BEFUNDE B17, 4.9.2026): war
                `lc-btn-ghost` — gemessen 80×44 mit transparenter Fläche und
                border 0, also fetter Text neben einem Eingabefeld und nicht
                als anklickbare Abkürzung erkennbar. Die GRÖSSE stimmte schon
                (44 px = Komfortmass, die Hälfte des Befunds ist damit
                widerlegt); gefehlt hat allein die Affordanz. Sie kommt aus der
                geteilten Knopf-Familie (`lc-btn-outline`, §13), nicht aus
                einem Sonderstil an dieser Stelle (LM-087). */}
            <button type="button" onClick={() => set('stichtag', heuteISO())} className="lc-btn-outline whitespace-nowrap">heute</button>
          </div>
        </Field>
        <Field label="Grundlage des Zinssatzes">
          <select value={form.satzGrund} onChange={(e) => set('satzGrund', e.target.value as SatzGrund)} className="lc-input">
            {GRUENDE.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
          </select>
        </Field>

        <Field label="Tageszählung" hint="Methodische Wahl – nicht durch Art. 104 OR fixiert">
          <select value={form.methode} onChange={(e) => set('methode', e.target.value as VerzugszinsMethode)} className="lc-input">
            {METHODEN.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
          </select>
        </Field>
        <Field label="Rückständige Zins-/Rentenforderung?">
          <Checkbox
            checked={zinsforderung}
            onChange={setZinsforderung}
            label="Ja – Verzinsung erst ab Betreibung/Klage (Art. 105 Abs. 1 OR)"
            className="pt-2"
          />
        </Field>
      </div>

      {/* Teilzahlungen & Satzänderungen */}
      <div className="space-y-3">
        <h4 className="text-body-s font-semibold text-ink-700">Teilzahlungen &amp; Satzänderungen (Art. 85 OR)</h4>
        {/* R2-F/F1-9: EINE Liste, zwei Hinzufügen-Knöpfe — dafür trägt der
            ListenEditor `weitere`. Die Knöpfe standen bisher ÜBER der Liste
            (Kanon: darunter), das «Entfernen» war eine vierte Grid-Spalte.
            Die drei rohen `<label>` sind `Field` gewichen (Label↔Control). */}
        <ListenEditor
          element="Teilzahlung"
          weitere={[{ element: 'Satzänderung', onHinzufuegen: () => addRow('satzaenderung') }]}
          eintraege={rows}
          schluessel={(row) => row.id}
          leer="Keine Ereignisse – einfache Berechnung über den ganzen Zeitraum."
          kopf={(row, i) => `${row.typ === 'teilzahlung' ? 'Teilzahlung' : 'Satzänderung'} ${i + 1}`}
          onHinzufuegen={() => addRow('teilzahlung')}
          onEntfernen={removeRow}
          kinder={(row, i) => (
            <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3 items-end', 'grid grid-cols-1 @3xl/pane:grid-cols-3 gap-3 items-end')}>
              <Field label="Typ">
                <select value={row.typ} onChange={(e) => updateRow(i, { typ: e.target.value as EreignisRow['typ'] })} className="lc-input">
                  <option value="teilzahlung">Teilzahlung (CHF)</option>
                  <option value="satzaenderung">Satzänderung (%)</option>
                </select>
              </Field>
              <Field label="Datum">
                <DatumsFeld value={row.datum} onChange={(v) => updateRow(i, { datum: v })} className="lc-input" />
              </Field>
              <Field label={row.typ === 'teilzahlung' ? 'Betrag (CHF)' : 'neuer Satz (%)'}>
                {row.typ === 'teilzahlung' ? (
                  <BetragsFeld value={row.wert ? String(row.wert) : ''} onChange={(v) => updateRow(i, { wert: Number(v) || 0 })} className={inputNum} />
                ) : (
                  <input type="number" inputMode="decimal" min={0} step={0.25} value={row.wert}
                    onChange={(e) => updateRow(i, { wert: Number(e.target.value) })} className={inputNum} />
                )}
              </Field>
            </div>
          )}
        />
      </div>

      {ergebnis && (
        <ErgebnisBlock>
          {ergebnis.status === 'ok' && (
            <>
              <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
                {[
                  { label: 'Verzugszins (gesamt)', val: `CHF ${ergebnis.zinsTotalCHF}`, akzent: true },
                  { label: 'Offenes Kapital', val: `CHF ${ergebnis.kapitalOffenCHF}` },
                  { label: 'Total offen', val: `CHF ${ergebnis.totalOffenCHF}` },
                ].map((c) => (
                  <EckdatenKachel key={c.label} label={c.label} wert={c.val} num akzent={c.akzent} />
                ))}
              </div>
              {ergebnis.zinsGetilgt > 0 && (
                <p className="text-body-s text-ink-500 num">
                  Durch Teilzahlungen getilgte Zinsen: CHF {formatCHF(ergebnis.zinsGetilgt)} · offener Verzugszins: CHF {ergebnis.zinsOffenCHF} · {ergebnis.tageTotal} Tage ({ergebnis.ersterZinstag}–{ergebnis.stichtag}).
                </p>
              )}
            </>
          )}
          <ErgebnisAnzeige titel="Verzugszins (Art. 104 OR)" ergebnis={ergebnis} />
          {ergebnis.status === 'ok' && <VerzugszinsTimeline e={ergebnis} />}
          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(VZ_LINK_SPEC, { ...form, rows: rows.map((r): EreignisEingabe => ({ typ: r.typ, datum: r.datum, wert: r.wert })), zinsforderung } as VzLink)} />
        </ErgebnisBlock>
      )}
    </div>
  );
}
