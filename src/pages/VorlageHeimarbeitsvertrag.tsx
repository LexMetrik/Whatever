import { useMemo, type ReactNode } from 'react';
import { NormText } from '../components/NormText';
import {
  HA_DEFAULTS, haZusammenstellen, pruefeHaGates, type HaAntworten,
} from '../lib/vorlagen/heimarbeitsvertrag';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { BetragsFeld } from '../components/BetragsFeld';
import { Checkbox, Field, GruppenTitel, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';

// ─── Vorlagen-Wizard: Heimarbeitsvertrag (Art. 351–354 OR) ──────────────────
// Sonderregime mit eigenem Schema (lib/vorlagen/heimarbeitsvertrag.ts).
// Seit W2·29-WERKBANK-VORLAGEN V2c auf `VorlagenSeite`; der Vertragstyp-
// Schalter (`kopf`) kommt vom Dispatcher in VorlageArbeitsvertrag.tsx.

const SPEICHER_KEY = 'lexmetrik.vorlage.heimarbeitsvertrag.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'arbeit', label: 'Arbeit & Material' },
  { id: 'lohn', label: 'Lohn & Dienst' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_HA: PdfBanner = {
  titel: 'HEIMARBEITSVERTRAG (Art. 351 ff. OR)',
  text: 'Lohn und Material-Entschädigung sind vor der Arbeitsausgabe schriftlich anzugeben (Art. 351a OR). Zwingend sind die Wochen-Prüffrist (Art. 353 OR) und die Haftungsschranke auf die Selbstkosten (Art. 352a OR).',
};

type HaZ = ReturnType<typeof haZusammenstellen>;

function eingabeInhalt({ a, set }: SeiteCtx<HaAntworten, HaZ>, schritt: number): ReactNode {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-5">
        <div className="space-y-3">
          <GruppenTitel>Arbeitgeber</GruppenTitel>
          <Field label="Firma / Name"><input className={inputCls} value={a.arbeitgeberName} onChange={(e) => set('arbeitgeberName', e.target.value)} placeholder="Muster AG" /></Field>
          <Field label="Adresse"><input className={inputCls} value={a.arbeitgeberAdresse} onChange={(e) => set('arbeitgeberAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
        </div>
        <div className="space-y-3">
          <GruppenTitel>Heimarbeitnehmer/in</GruppenTitel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Vorname"><input className={inputCls} value={a.heimarbeiterVorname} onChange={(e) => set('heimarbeiterVorname', e.target.value)} /></Field>
            <Field label="Nachname"><input className={inputCls} value={a.heimarbeiterName} onChange={(e) => set('heimarbeiterName', e.target.value)} /></Field>
          </div>
          <Field label="Adresse"><input className={inputCls} value={a.heimarbeiterAdresse} onChange={(e) => set('heimarbeiterAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
        </div>
      </div>
    );

    case 'arbeit': return (
      <div className="space-y-4">
        <Field label="Auszuführende Arbeiten"><input className={inputCls} value={a.arbeitsbeschrieb} onChange={(e) => set('arbeitsbeschrieb', e.target.value)} placeholder="z. B. Konfektionierung von Verpackungen" /></Field>
        <Field label="Arbeitsraum"><input className={inputCls} value={a.arbeitsraum} onChange={(e) => set('arbeitsraum', e.target.value)} placeholder="in der Wohnung des Heimarbeitnehmers" /></Field>
        <div className="space-y-2">
          <GruppenTitel>Material und Geräte</GruppenTitel>
          <Checkbox
            checked={a.materialVomArbeitgeber}
            onChange={(v) => set('materialVomArbeitgeber', v)}
            label={<><span>Material/Geräte werden vom Arbeitgeber gestellt <span className="text-ink-500"><NormText text={`(Sorgfalts-/Rückgabepflicht, Haftung höchstens Selbstkosten, Art. 352a OR)`} /></span></span></>} />
          <Checkbox
            checked={a.materialBeschafftHeimarbeiter}
            onChange={(v) => set('materialBeschafftHeimarbeiter', v)}
            label={<><span>Heimarbeitnehmer/in beschafft (auch) Material selbst <span className="text-ink-500"><NormText text={`(Entschädigung schriftlich, Art. 351a OR)`} /></span></span></>} />
          {a.materialBeschafftHeimarbeiter && (
            <Field label="Material-Entschädigung"><input className={inputCls} value={a.materialEntschaedigung} onChange={(e) => set('materialEntschaedigung', e.target.value)} placeholder="z. B. CHF 0.20 pro Stück" /></Field>
          )}
        </div>
        <Checkbox
          checked={a.probearbeit}
          onChange={(v) => set('probearbeit', v)}
          label={<><span>Es wird zunächst eine <strong>Probearbeit</strong> übergeben <span className="text-ink-500"><NormText text={`(Verhältnis auf bestimmte Zeit zur Probe, Art. 354 Abs. 1 OR)`} /></span></span></>} />
      </div>
    );

    case 'lohn': return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem] gap-3">
          <Field label="Lohn"><BetragsFeld className={inputCls + ' num'} value={a.lohnAngabe} onChange={(v) => set('lohnAngabe', v)} placeholder="z. B. 4.50" /></Field>
          <Field label="Einheit"><input className={inputCls} value={a.lohnEinheit} onChange={(e) => set('lohnEinheit', e.target.value)} placeholder="pro Stück" /></Field>
        </div>
        <div className="space-y-2">
          {/* LM-101: Buchstabenzusätze (353a/353b) dürfen die uppercase-Overline
              nicht durchlaufen — sonst wird «a»/«b»→«A»/«B» und das Zitat
              sinnentstellt. Norm-Teil bleibt per normal-case in
              Originalschreibweise (Muster wie MietrechtForm.tsx / VorlageKlageOrdentlich.tsx:305). */}
          <GruppenTitel>Dienstverhältnis <span className="normal-case">(Art. 353a/353b/354 OR)</span></GruppenTitel>
          <SelectionGrid
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            items={([
              ['true', 'Ununterbrochen', 'halbmonatlich; 324/324a; unbefristet'],
              ['false', 'Auf Abruf / fallweise', 'Lohn bei Ablieferung; befristet'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.ununterbrochen ? 'true' : 'false'}
            onSelect={(code) => set('ununterbrochen', code === 'true')}
          />
        </div>
      </div>
    );
  }
}

function fehlerEingabe(a: HaAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.arbeitgeberName.trim()) f.push('Arbeitgeber angeben (Firma bzw. Name).');
    if (!a.arbeitgeberAdresse.trim()) f.push('Adresse des Arbeitgebers angeben.');
    if (!a.heimarbeiterVorname.trim() || !a.heimarbeiterName.trim()) f.push('Vor- und Nachname des Heimarbeitnehmers angeben.');
    if (!a.heimarbeiterAdresse.trim()) f.push('Adresse des Heimarbeitnehmers angeben.');
  }
  if (schritt === 1 && !a.arbeitsbeschrieb.trim()) f.push('Auszuführende Arbeiten angeben (Art. 351 OR).');
  if (schritt === 2 && !a.lohnAngabe.trim()) f.push('Lohn angeben (Art. 351a/353a OR).');
  return f;
}

const CONFIG: VorlagenSeitenConfig<HaAntworten, HaZ> = {
  cardId: 'arbeitsvertrag',
  defaults: HA_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  // Ist-Zustand vor dem Umzug (§6): kein Profil-Prefill, Detailgrad-Default
  // aus dem Schema statt aus den Einstellungen.
  profilPrefill: false,
  detailgradAusEinstellungen: false,
  zusammenstellen: haZusammenstellen,
  pruefeGates: (a) => pruefeHaGates(a),
  schritte: SCHRITTE,
  overlineFallback: 'Arbeit',
  titel: 'Heimarbeitsvertrag',
  intro: 'Stellt einen Heimarbeitsvertrag nach Art. 351 ff. OR aus festen Bausteinen zusammen – mit der schriftlichen Lohn-/Materialangabe vor der Arbeitsausgabe, der Haftungsschranke auf die Selbstkosten und der Wochen-Prüffrist. Ohne Sprachmodell: gleiche Eingaben, gleiches Dokument.',
  badge: 'Lohn/Material schriftlich anzugeben',
  eingabeInhalt,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: im letzten Schritt nur das Datum als Pflicht
  // (kein ortFehler), Blocker sperren nur den Export (§6).
  blockerImLetztenSchritt: false,
  ortDatumLabel: 'Ort und Datum des Vertragsschlusses',
  ortPlaceholder: 'z. B. Zürich',
  datumFehler: 'Vertragsdatum angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Form-Gate</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Lohn und Material-Entschädigung schriftlich</strong><NormText text={` vor der Arbeitsausgabe (Art. 351a OR).`} /></li>
        <li><strong>Beidseitig unterzeichnen.</strong> Vorbehalten bleibt das Heimarbeitsgesetz (SR 822.31).</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Dies ist ein Entwurf nach festen Bausteinen; die zwingenden Regeln (351a/352a/353 OR) und der Einzelfall sind gesondert zu prüfen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_HA,
  dateiBasis: 'Heimarbeitsvertrag-Entwurf',
  pdfLabel: 'Vertrag als PDF',
  docxLabel: 'Vertrag als Word (DOCX)',
};

export function VorlageHeimarbeitsvertrag({ kopf }: { kopf: ReactNode }) {
  const config = useMemo<VorlagenSeitenConfig<HaAntworten, HaZ>>(() => ({
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
