import { useMemo, type ReactNode } from 'react';
import { NormText } from '../components/NormText';
import {
  HR_DEFAULTS, hrZusammenstellen, pruefeHrGates, type HrAntworten,
} from '../lib/vorlagen/handelsreisendenvertrag';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { BetragsFeld } from '../components/BetragsFeld';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Handelsreisendenvertrag (Art. 347–350a OR) ────────────
// Sonderregime mit eigenem Schema (lib/vorlagen/handelsreisendenvertrag.ts).
// Seit W2·29-WERKBANK-VORLAGEN V2c auf `VorlagenSeite`; die Eingabe-Schritte
// sind eine Komponente, weil sie usePaneKlasse brauchen (s. VorlagenSeite.tsx).

const SPEICHER_KEY = 'lexmetrik.vorlage.handelsreisendenvertrag.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'taetigkeit', label: 'Tätigkeit & Vollmacht' },
  { id: 'lohn', label: 'Lohn & Auslagen' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_HR: PdfBanner = {
  titel: 'HANDELSREISENDENVERTRAG – SCHRIFTLICH ZU REGELN (Art. 347a OR)',
  text: 'Zwingend sind die Delkredere-Schranke (¼, nur Privatkunden, Art. 348a OR), der gesonderte Auslagenersatz (Art. 349d OR) und die Saison-Kündigungsregel (Art. 350 OR). Subsidiär gelten die Art. 319 ff. OR.',
};

type HrZ = ReturnType<typeof hrZusammenstellen>;

function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<HrAntworten, HrZ>; schritt: number }) {
  const pk = usePaneKlasse();

  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-5">
        <div className="space-y-3">
          <GruppenTitel>Arbeitgeber</GruppenTitel>
          <Field label="Firma / Name"><input className={inputCls} value={a.arbeitgeberName} onChange={(e) => set('arbeitgeberName', e.target.value)} placeholder="Muster AG" /></Field>
          <Field label="Adresse"><input className={inputCls} value={a.arbeitgeberAdresse} onChange={(e) => set('arbeitgeberAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
        </div>
        <div className="space-y-3">
          <GruppenTitel>Handelsreisende/r</GruppenTitel>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
            <Field label="Vorname"><input className={inputCls} value={a.reisenderVorname} onChange={(e) => set('reisenderVorname', e.target.value)} /></Field>
            <Field label="Nachname"><input className={inputCls} value={a.reisenderName} onChange={(e) => set('reisenderName', e.target.value)} /></Field>
          </div>
          <Field label="Adresse"><input className={inputCls} value={a.reisenderAdresse} onChange={(e) => set('reisenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
        </div>
      </div>
    );

    case 'taetigkeit': return (
      <div className="space-y-4">
        <Field label="Gegenstand der Geschäfte"><input className={inputCls} value={a.gegenstand} onChange={(e) => set('gegenstand', e.target.value)} placeholder="z. B. Werkzeugmaschinen" /></Field>
        <Field label="Reisegebiet / Kundenkreis"><input className={inputCls} value={a.reisegebiet} onChange={(e) => set('reisegebiet', e.target.value)} placeholder="z. B. Kantone BE und SO" /></Field>
        <Checkbox
          checked={a.ausschliesslich}
          onChange={(v) => set('ausschliesslich', v)}
          label={<><span>Gebiet/Kundenkreis <strong>ausschliesslich</strong> zugewiesen <span className="text-ink-500">(Provision dann auf allen Geschäften im Gebiet, Art. 349/349b OR)</span></span></>} />
        <div className="space-y-2">
          {/* LM-101-Muster: Buchstabenzusatz (348b) darf die uppercase-Overline nicht durchlaufen. */}
          <GruppenTitel><NormText text={`Vollmacht `} /><span className="normal-case"><NormText text={`(Art. 348b OR)`} /></span></GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
            items={([
              ['vermittlung', 'Nur Vermittlung', 'gesetzlicher Default'],
              ['abschluss', 'Abschluss', 'ohne Inkasso-/Stundungsbefugnis'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.vollmacht}
            onSelect={(code) => set('vollmacht', code)}
          />
        </div>
        <Field label="Beginn"><DatumsFeld value={a.beginn} onChange={(v) => set('beginn', v)} className={inputCls} /></Field>
      </div>
    );

    case 'lohn': return (
      <div className="space-y-4">
        <div className="space-y-2">
          {/* LM-101-Muster: Buchstabenzusatz (349a) darf die uppercase-Overline nicht durchlaufen. */}
          <GruppenTitel><NormText text={`Lohnmodell `} /><span className="normal-case"><NormText text={`(Art. 349a OR)`} /></span></GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={([
              ['fix', 'Festes Gehalt', 'ohne Provision'],
              ['fix_provision', 'Fix + Provision', 'Gehalt + Provision'],
              ['provision', 'Reine Provision', 'nur wenn angemessen'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.lohnmodell}
            onSelect={(code) => set('lohnmodell', code)}
          />
        </div>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
          {a.lohnmodell !== 'provision' && (
            <Field label="Festes Gehalt (CHF / Monat)"><BetragsFeld className={inputCls + ' num'} value={a.fixCHF} onChange={(v) => set('fixCHF', v)} placeholder="z. B. 5'000" /></Field>
          )}
          {a.lohnmodell !== 'fix' && (
            <>
              <Field label="Provisionssatz (%)"><input type="number" min={0} step={0.1} className={inputCls + ' num'} value={a.provisionProzent} onChange={(e) => set('provisionProzent', e.target.value)} /></Field>
              <Field label="Bezugsgrösse"><input className={inputCls} value={a.provisionBasis} onChange={(e) => set('provisionBasis', e.target.value)} placeholder="z. B. Nettoumsatz" /></Field>
            </>
          )}
        </div>
        <div className="space-y-2">
          {/* LM-101-Muster: Buchstabenzusatz (349d) darf die uppercase-Overline nicht durchlaufen. */}
          <GruppenTitel><NormText text={`Auslagenersatz `} /><span className="normal-case"><NormText text={`(Art. 349d OR – stets gesondert)`} /></span></GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
            items={([
              ['effektiv', 'Effektiv', 'gegen Beleg'],
              ['pauschal', 'Pauschale', 'gesondert pro Monat'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.auslagen}
            onSelect={(code) => set('auslagen', code)}
          />
          {a.auslagen === 'pauschal' && (
            <Field label="Auslagenpauschale (CHF / Monat)"><BetragsFeld className={inputCls + ' num w-40'} value={a.auslagenPauschaleCHF} onChange={(v) => set('auslagenPauschaleCHF', v)} placeholder="z. B. 600" /></Field>
          )}
        </div>
        <Checkbox
          checked={a.saisonschwankung}
          onChange={(v) => set('saisonschwankung', v)}
          label={<><span>Provision unterliegt erheblichen <strong>saisonalen Schwankungen</strong> <span className="text-ink-500"><NormText text={`(Sonder-Kündigungsregel, Art. 350 OR)`} /></span></span></>} />
        {a.detailgrad === 'experte' && (
          <div className="lc-card p-4 space-y-3">
            <label className="flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium">
              <input type="checkbox" className="mt-0.5" checked={a.delkredere} onChange={(e) => set('delkredere', e.target.checked)} />
              <span><strong>Delkredere</strong> vereinbaren <span className="text-ink-500"><NormText text={`(nur Privatkunden, höchstens ¼, Art. 348a OR)`} /></span></span>
            </label>
            {a.delkredere && (
              <Field label="Delkredere-Provision (%)" hint="ohne angemessene Provision ist die Haftungsabrede nichtig (Art. 348a Abs. 2 OR)">
                <input type="number" min={0} step={0.1} className={inputCls + ' num w-40'} value={a.delkredereProvisionProzent} onChange={(e) => set('delkredereProvisionProzent', e.target.value)} />
              </Field>
            )}
          </div>
        )}
      </div>
    );
  }
}

function fehlerEingabe(a: HrAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.arbeitgeberName.trim()) f.push('Arbeitgeber angeben (Firma bzw. Name).');
    if (!a.arbeitgeberAdresse.trim()) f.push('Adresse des Arbeitgebers angeben.');
    if (!a.reisenderVorname.trim() || !a.reisenderName.trim()) f.push('Vor- und Nachname des Handelsreisenden angeben.');
    if (!a.reisenderAdresse.trim()) f.push('Adresse des Handelsreisenden angeben.');
  }
  if (schritt === 1) {
    if (!a.gegenstand.trim()) f.push('Gegenstand der Geschäfte angeben (Art. 347 OR).');
    if (!a.reisegebiet.trim()) f.push('Reisegebiet oder Kundenkreis angeben.');
    if (!a.beginn) f.push('Beginn angeben.');
  }
  if (schritt === 2) {
    if (a.lohnmodell !== 'provision' && !a.fixCHF.trim()) f.push('Festes Gehalt angeben (Art. 349a OR).');
    if (a.lohnmodell !== 'fix' && !a.provisionProzent.trim()) f.push('Provisionssatz angeben.');
    if (a.delkredere && !a.delkredereProvisionProzent.trim()) f.push('Delkredere-Provision angeben (Art. 348a Abs. 2 OR).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<HrAntworten, HrZ> = {
  cardId: 'arbeitsvertrag',
  defaults: HR_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  // Ist-Zustand vor dem Umzug (§6): kein Profil-Prefill, Detailgrad-Default
  // aus dem Schema statt aus den Einstellungen.
  profilPrefill: false,
  detailgradAusEinstellungen: false,
  zusammenstellen: hrZusammenstellen,
  pruefeGates: (a) => pruefeHrGates(a),
  schritte: SCHRITTE,
  overlineFallback: 'Arbeit',
  titel: 'Handelsreisendenvertrag',
  intro: 'Stellt einen Handelsreisendenvertrag nach Art. 347 ff. OR aus festen Bausteinen zusammen – mit der Vollmachts-Weiche (Vermittlung/Abschluss), den zwingenden Delkredere- und Auslagenersatz-Schranken und der Saison-Kündigungsregel. Ohne Sprachmodell: gleiche Eingaben, gleiches Dokument.',
  badge: 'Schriftlich zu regeln',
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: im letzten Schritt nur das Datum als Pflicht
  // (kein ortFehler); die Blocker stehen im eigenen Kasten und sperren den
  // Export, nicht die Fehlerbox (§6).
  blockerImLetztenSchritt: false,
  blockerKasten: 'Vor der Ausgabe zu beheben',
  ortDatumLabel: 'Ort und Datum des Vertragsschlusses',
  ortPlaceholder: 'z. B. Zürich',
  datumFehler: 'Vertragsdatum angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Form-Gate</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Schriftlich regeln</strong><NormText text={` (Art. 347a OR): Soweit nicht schriftlich, gelten Gesetz und übliche Bedingungen.`} /></li>
        <li><strong>Beidseitig unterzeichnen.</strong> Anwendbare GAV/NAV gehen vor.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Dies ist ein Entwurf nach festen Bausteinen; die zwingenden Schranken (348a/349d/350 OR) und der Einzelfall sind gesondert zu prüfen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_HR,
  dateiBasis: 'Handelsreisendenvertrag-Entwurf',
  pdfLabel: 'Vertrag als PDF',
  docxLabel: 'Vertrag als Word (DOCX)',
};

export function VorlageHandelsreisendenvertrag({ kopf }: { kopf: ReactNode }) {
  const config = useMemo<VorlagenSeitenConfig<HrAntworten, HrZ>>(() => ({
    ...CONFIG,
    kopfSchalter: ({ a, set }) => (
      <div className="space-y-3">
        {kopf}
        <VariantenKopf detailgrad={a.detailgrad} onDetailgrad={(v) => set('detailgrad', v)} />
      </div>
    ),
  }), [kopf]);
  return <VorlagenSeite config={config} />;
}
