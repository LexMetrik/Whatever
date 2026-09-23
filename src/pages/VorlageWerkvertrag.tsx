import { NormText } from '../components/NormText';
import {
  WV_DEFAULTS, wvZusammenstellen, pruefeWvGates, type WvAntworten, type WvWerkArt, type WvPreis,
} from '../lib/vorlagen/werkvertrag';
import { zahl } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { ThemenEinstieg } from '../components/ThemenEinstieg';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { SelectionGrid } from '../components/ui/SelectionGrid';

// ─── Vorlagen-Wizard: Werkvertrag (Art. 363 ff. OR) ─────────────────────────
// P1-Grundtyp der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V3).
// Formfreier Vertrag (beidseitig zu unterzeichnen). Zentrale Weiche
// beweglich/unbeweglich → Rügefrist (Art. 367 Abs. 1bis) und Verjährung
// (Art. 371). Brücke zum Gewährleistungs-Rechner (Rüge-/Verjährungsfristen).
// Orchestrierung im generischen Rahmen (QS-CODE-ENTDOPPLUNG D1).

const SPEICHER_KEY = 'lexmetrik.vorlage.werkvertrag.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'werk', label: 'Werk & Vergütung' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_WV: PdfBanner = {
  titel: 'WERKVERTRAG – RÜGEFRIST UNBEWEGLICHES WERK 60 TAGE ZWINGEND (ART. 367 ABS. 1BIS OR)',
  text: 'Formfreier Vertrag, beidseitig zu unterzeichnen. Rücktrittsrecht des Bestellers gegen volle Schadloshaltung (Art. 377 OR).',
};

const WERKART_OPTIONEN: { id: WvWerkArt; label: string; hint: string }[] = [
  { id: 'beweglich', label: 'Bewegliches Werk', hint: 'z. B. Möbel, Maschine, Software' },
  { id: 'unbeweglich', label: 'Unbewegliches Werk', hint: 'Bau am Grundstück; Rügefrist 60 Tage' },
];

const PREIS_OPTIONEN: { id: WvPreis; label: string }[] = [
  { id: 'pauschal', label: 'Festpreis (Pauschal)' },
  { id: 'aufwand', label: 'nach Aufwand' },
];

function eingabeInhalt({ a, set }: SeiteCtx<WvAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <div className="lc-notice text-body-s">
          Der Werkvertrag ist <strong>formfrei</strong> gültig; die beidseitige Unterzeichnung
          dient dem Beweis. Der <strong>Besteller</strong> bestellt das Werk, der
          <strong> Unternehmer</strong> stellt es her (Art. 363 OR).
        </div>
        <Field label="Besteller">
          <input className={inputCls} value={a.bestellerName} onChange={(e) => set('bestellerName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse des Bestellers" optional>
          <input className={inputCls} value={a.bestellerAdresse} onChange={(e) => set('bestellerAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Unternehmer">
          <input className={inputCls} value={a.unternehmerName} onChange={(e) => set('unternehmerName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse des Unternehmers" optional>
          <input className={inputCls} value={a.unternehmerAdresse} onChange={(e) => set('unternehmerAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'werk': return (
      <div className="space-y-4">
        <Field label="Werk" hint="was herzustellen ist – erscheint im Vertragstext">
          <textarea className={inputCls + ' min-h-[4.5rem]'} value={a.werkBeschrieb} onChange={(e) => set('werkBeschrieb', e.target.value)} placeholder="z. B. Einbau einer Küche gemäss Plan vom 1. März 2026" />
        </Field>
        <Field label="Art des Werks" hint="bestimmt Rügefrist und Verjährung">
{/* B3-4/A3-5 (R3-α, 31.8.2026): handgezeichnete Auswahl-Reihe ohne
              `aria-pressed` — Kopie gelöscht (§5/§10), Optik aus dem Baustein. */}
          <SelectionGrid
            className="grid grid-cols-2 gap-2" gruppenLabel="Art des Werks"
            items={WERKART_OPTIONEN.map((w) => ({ code: w.id, label: w.label, sub: w.hint }))}
            value={a.werkArt} onSelect={(v) => set('werkArt', v)} />
        </Field>
        <Field label="Ablieferungstermin" optional>
          <DatumsFeld value={a.ablieferung} onChange={(v) => set('ablieferung', v)} className={inputCls} />
        </Field>
        <Field label="Vergütung">
          {/* dito B3-4/A3-5 — ohne Unterzeile. */}
          <SelectionGrid
            className="grid grid-cols-2 gap-2" gruppenLabel="Vergütung"
            items={PREIS_OPTIONEN.map((o) => ({ code: o.id, label: o.label }))}
            value={a.preis} onSelect={(v) => set('preis', v)} />
        </Field>
        {a.preis === 'pauschal' && (
          <Field label="Festpreis (CHF)" hint="bindet den Unternehmer (Art. 373 OR)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.pauschalCHF} onChange={(v) => set('pauschalCHF', v)} placeholder="z. B. 12'000.00" />
          </Field>
        )}
        {a.preis === 'aufwand' && (
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <Field label="Ansatz (CHF)">
              <BetragsFeld className={inputCls} value={a.ansatzCHF} onChange={(v) => set('ansatzCHF', v)} placeholder="z. B. 120.00" />
            </Field>
            <Field label="je Einheit">
              <input className={inputCls} value={a.ansatzEinheit} onChange={(e) => set('ansatzEinheit', e.target.value)} placeholder="pro Stunde" />
            </Field>
          </div>
        )}
        <Checkbox
          checked={a.anzahlung}
          onChange={(v) => set('anzahlung', v)}
          label={<><span><strong>Akontozahlung</strong> bei Vertragsschluss vereinbaren</span></>} />
        {a.anzahlung && (
          <Field label="Akontobetrag (CHF)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.anzahlungCHF} onChange={(v) => set('anzahlungCHF', v)} placeholder="z. B. 4'000.00" />
          </Field>
        )}
        <Checkbox
          checked={a.abnahmeProtokoll}
          onChange={(v) => set('abnahmeProtokoll', v)}
          label={<><span>Gemeinsames <strong>Abnahmeprotokoll</strong> vereinbaren</span></>} />
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: WvAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.bestellerName.trim()) f.push('Besteller angeben.');
    if (!a.unternehmerName.trim()) f.push('Unternehmer angeben.');
  }
  if (schritt === 1) {
    if (!a.werkBeschrieb.trim()) f.push('Werk umschreiben (was herzustellen ist).');
    if (a.ablieferung.trim() && !istIsoDatum(a.ablieferung)) f.push('Ablieferungstermin als gültiges Datum angeben (oder leer lassen).');
    if (a.preis === 'pauschal' && zahl(a.pauschalCHF) === null) f.push('Festpreis in CHF angeben.');
    if (a.preis === 'aufwand' && zahl(a.ansatzCHF) === null) f.push('Ansatz in CHF angeben.');
    if (a.anzahlung && zahl(a.anzahlungCHF) === null) f.push('Akontobetrag in CHF angeben (oder Anzahlung deaktivieren).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<WvAntworten> = {
  cardId: 'werkvertrag',
  musterdaten: MUSTER.werkvertrag,
  defaults: WV_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: wvZusammenstellen,
  pruefeGates: pruefeWvGates,
  schritte: SCHRITTE,
  overlineFallback: 'Vertrag (OR)',
  titel: 'Werkvertrag',
  intro: 'Werkvertrag aus festen Bausteinen (Art. 363 ff. OR) – mit Weiche bewegliches/unbewegliches Werk (Rügefrist und Verjährung), Festpreis- oder Aufwand-Vergütung und offengelegtem Rücktrittsrecht des Bestellers. Was Wertung wäre, wird offengelegt, nicht berechnet.',
  badge: 'Zu unterzeichnen',
  kopfSchalter: ({ a, set }) => <VariantenKopf detailgrad={a.detailgrad} onDetailgrad={(v) => set('detailgrad', v)} />,
  fussnote: <ThemenEinstieg label="Mängelrüge- und Verjährungsfristen exakt berechnen:" links={[
    { to: '/rechner/gewaehrleistung', label: 'Gewährleistung & Mängelrüge' },
  ]} />,
  eingabeInhalt,
  fehlerEingabe,
  ortDatumLabel: 'Ort und Datum der Unterzeichnung',
  ortPlaceholder: 'z. B. Zürich',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Unterzeichnung angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit der Werkvertrag trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Mängel rechtzeitig rügen</strong><NormText text={` – beim unbeweglichen Werk gilt zwingend die 60-Tage-Frist (Art. 367 Abs. 1bis OR); sonst gilt das Werk als genehmigt.`} /></li>
        <li><strong>Verjährung</strong><NormText text={` – 2 Jahre (beweglich) bzw. 5 Jahre (unbeweglich) ab Abnahme (Art. 371 OR).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Rügefristen und Verjährung sind zwingend; massgebend sind Gesetz und konkreter Sachverhalt.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_WV,
  dateiBasis: 'Werkvertrag',
  pdfLabel: 'Werkvertrag als PDF',
  docxLabel: 'Werkvertrag als Word (DOCX)',
};

export function VorlageWerkvertrag() {
  return <VorlagenSeite config={CONFIG} />;
}
