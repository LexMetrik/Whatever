import { NormText } from '../components/NormText';
import {
  AF_DEFAULTS, afZusammenstellen, pruefeAfGates, type AfAntworten, type AfMandatstyp, type AfVerguetung,
} from '../lib/vorlagen/auftrag';
import { zahl } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import { SelectionGrid } from '../components/ui/SelectionGrid';

// ─── Vorlagen-Wizard: Auftrag / Dienstleistungsvertrag (Art. 394 ff. OR) ─────
// P1-Grundtyp der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V3).
// Formfreier Vertrag (beidseitig zu unterzeichnen). Die Hinweise – allen voran
// das zwingende jederzeitige Auflösungsrecht (Art. 404 OR) – liegen in
// pruefeAfGates. Orchestrierung im generischen Rahmen (QS-CODE-ENTDOPPLUNG D1).

const SPEICHER_KEY = 'lexmetrik.vorlage.auftrag.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'inhalt', label: 'Gegenstand & Vergütung' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_AF: PdfBanner = {
  titel: 'AUFTRAG – JEDERZEITIGES AUFLÖSUNGSRECHT ZWINGEND (ART. 404 OR)',
  text: 'Formfreier Vertrag, beidseitig zu unterzeichnen. Das Widerrufs-/Kündigungsrecht beider Parteien kann nicht gültig ausgeschlossen werden.',
};

const MANDAT_OPTIONEN: { id: AfMandatstyp; label: string; hint: string }[] = [
  { id: 'allgemein', label: 'Allgemein', hint: 'beliebige Geschäfte/Dienste' },
  { id: 'beratung', label: 'Beratung', hint: 'Consulting, Gutachten' },
  { id: 'treuhand', label: 'Treuhand', hint: 'treuhänderische Geschäfte' },
  { id: 'inkasso', label: 'Inkasso', hint: 'Forderungseinzug' },
];

const VERGUETUNG_OPTIONEN: { id: AfVerguetung; label: string }[] = [
  { id: 'pauschal', label: 'Pauschalhonorar' },
  { id: 'aufwand', label: 'nach Zeitaufwand' },
  { id: 'unentgeltlich', label: 'unentgeltlich' },
];

// Eigene Komponente NUR wegen usePaneKlasse: `eingabeInhalt` läuft ausschliesslich
// auf den Eingabe-Schritten, ein Hook direkt darin wechselte die Hook-Reihenfolge
// je Schritt. Als Komponente hängt der Hook an dieser Einheit — DOM unverändert.
function MandatWahl({ wert, onWahl }: { wert: AfMandatstyp; onWahl: (v: AfMandatstyp) => void }) {
  const pk = usePaneKlasse();
  return (
    /* B3-4/A3-5 (R3-α, 31.8.2026): handgezeichnete Auswahl-Reihe ohne
       `aria-pressed` (Screenreader hörten nur Knöpfe, nicht die Auswahl),
       ohne `min-h-11` und mit `bg-brass-100` statt `bg-brass-100/60`. Die
       Kopie ist gelöscht (§5/§10); die LM-176-Messung (Unterzeile ink-600)
       ist in den Baustein gewandert. */
    <SelectionGrid<AfMandatstyp>
      className={pk('grid grid-cols-2 sm:grid-cols-4 gap-2', 'grid grid-cols-2 @3xl/pane:grid-cols-4 gap-2')}
      gruppenLabel="Mandatstyp"
      items={MANDAT_OPTIONEN.map((m) => ({ code: m.id, label: m.label, sub: m.hint }))}
      value={wert} onSelect={onWahl} />
  );
}

function eingabeInhalt({ a, set }: SeiteCtx<AfAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <div className="lc-notice text-body-s">
          Der Auftrag ist <strong>formfrei</strong> gültig; die beidseitige Unterzeichnung dient
          dem Beweis. Die <strong>Auftraggeberin</strong> erteilt den Auftrag, die
          <strong> Beauftragte</strong> besorgt die Geschäfte (Art. 394 OR).
        </div>
        <Field label="Auftraggeberin">
          <input className={inputCls} value={a.auftraggeberName} onChange={(e) => set('auftraggeberName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse der Auftraggeberin" optional>
          <input className={inputCls} value={a.auftraggeberAdresse} onChange={(e) => set('auftraggeberAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Beauftragte">
          <input className={inputCls} value={a.beauftragteName} onChange={(e) => set('beauftragteName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse der Beauftragten" optional>
          <input className={inputCls} value={a.beauftragteAdresse} onChange={(e) => set('beauftragteAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'inhalt': return (
      <div className="space-y-4">
        <Field label="Art des Mandats" hint="bestimmt die Rahmung der Gegenstandsumschreibung">
          <MandatWahl wert={a.mandatstyp} onWahl={(v) => set('mandatstyp', v)} />
        </Field>
        <Field label="Gegenstand des Auftrags" hint="welche Geschäfte/Dienste – erscheint im Vertragstext">
          <textarea className={inputCls + ' min-h-[4.5rem]'} value={a.gegenstand} onChange={(e) => set('gegenstand', e.target.value)} placeholder="z. B. Buchführung und Erstellung des Jahresabschlusses 2026" />
        </Field>
        <Field label="Beginn des Auftrags" optional>
          <DatumsFeld value={a.beginn} onChange={(v) => set('beginn', v)} className={inputCls} />
        </Field>
        <Field label="Vergütung">
          {/* dito B3-4/A3-5 — dieselbe Reihe, ohne Unterzeile. */}
          <SelectionGrid
            className="grid grid-cols-3 gap-2" gruppenLabel="Vergütung"
            items={VERGUETUNG_OPTIONEN.map((v) => ({ code: v.id, label: v.label }))}
            value={a.verguetung} onSelect={(v) => set('verguetung', v)} />
        </Field>
        {a.verguetung === 'pauschal' && (
          <Field label="Pauschalhonorar (CHF)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.pauschalCHF} onChange={(v) => set('pauschalCHF', v)} placeholder="z. B. 5'000.00" />
          </Field>
        )}
        {a.verguetung === 'aufwand' && (
          <Field label="Stundenansatz (CHF)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.stundensatzCHF} onChange={(v) => set('stundensatzCHF', v)} placeholder="z. B. 250.00" />
          </Field>
        )}
        <Checkbox
          checked={a.auslagenErsatz}
          onChange={(v) => set('auslagenErsatz', v)}
          label={<><span><strong>Auslagen- und Verwendungsersatz</strong> ausdrücklich aufnehmen <span className="text-ink-500"><NormText text={`(gesetzliche Pflicht, Art. 402 Abs. 1 OR)`} /></span></span></>} />
        <Checkbox
          checked={a.weisungsKlausel}
          onChange={(v) => set('weisungsKlausel', v)}
          label={<><span><strong>Weisungsbindung</strong> aufnehmen <span className="text-ink-500"><NormText text={`(Art. 397 Abs. 1 OR)`} /></span></span></>} />
        <Checkbox
          checked={a.substitution}
          onChange={(v) => set('substitution', v)}
          label={<><span>Beizug <strong>Dritter zur Ausführung</strong> zulassen <span className="text-ink-500"><NormText text={`(sonst persönliche Besorgung, Art. 398 Abs. 3 OR)`} /></span></span></>} />
        <Checkbox
          checked={a.vollmachtErweitert}
          onChange={(v) => set('vollmachtErweitert', v)}
          label={<><span><strong>Besondere Ermächtigung</strong> erteilen <span className="text-ink-500"><NormText text={`(für Vergleich, Grundstücke usw. – Art. 396 Abs. 3 OR)`} /></span></span></>} />
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: AfAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.auftraggeberName.trim()) f.push('Auftraggeberin angeben.');
    if (!a.beauftragteName.trim()) f.push('Beauftragte angeben.');
  }
  if (schritt === 1) {
    if (!a.gegenstand.trim()) f.push('Gegenstand des Auftrags umschreiben (welche Geschäfte/Dienste).');
    if (a.beginn.trim() && !istIsoDatum(a.beginn)) f.push('Beginn als gültiges Datum angeben (oder leer lassen).');
    if (a.verguetung === 'pauschal' && zahl(a.pauschalCHF) === null) f.push('Pauschalhonorar in CHF angeben.');
    if (a.verguetung === 'aufwand' && zahl(a.stundensatzCHF) === null) f.push('Stundenansatz in CHF angeben.');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<AfAntworten> = {
  cardId: 'auftrag',
  musterdaten: MUSTER.auftrag,
  defaults: AF_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: afZusammenstellen,
  // Die Auftrags-Gates hängen an keiner Eingabe (zwingendes Art.-404-Recht gilt
  // immer) — die Engine-Signatur bleibt deshalb parameterlos.
  pruefeGates: () => pruefeAfGates(),
  schritte: SCHRITTE,
  overlineFallback: 'Vertrag (OR)',
  titel: 'Auftrag (Dienstleistungsvertrag)',
  intro: 'Dienstleistungsvertrag aus festen Bausteinen (Art. 394 ff. OR) – mit Gegenstands-Modulen (Beratung, Treuhand, Inkasso), Vergütungsweiche und offengelegtem zwingendem Auflösungsrecht. Was Wertung wäre, wird offengelegt, nicht berechnet.',
  badge: 'Zu unterzeichnen',
  kopfSchalter: ({ a, set }) => <VariantenKopf detailgrad={a.detailgrad} onDetailgrad={(v) => set('detailgrad', v)} />,
  eingabeInhalt,
  fehlerEingabe,
  ortDatumLabel: 'Ort und Datum der Unterzeichnung',
  ortPlaceholder: 'z. B. Zürich',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Unterzeichnung angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit der Auftrag trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Jederzeitiges Auflösungsrecht</strong><NormText text={` – beide Parteien können den Auftrag jederzeit beenden; ein Ausschluss wäre wirkungslos (Art. 404 OR).`} /></li>
        <li><strong>Erfolg geschuldet?</strong> – ist ein bestimmtes Werk gewollt, ist der Werkvertrag (Art. 363 ff. OR) die richtige Grundlage.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Der Auftrag schuldet sorgfältiges Tätigwerden, nicht einen Erfolg; massgebend sind Gesetz und konkreter Sachverhalt.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_AF,
  dateiBasis: 'Auftrag',
  pdfLabel: 'Auftrag als PDF',
  docxLabel: 'Auftrag als Word (DOCX)',
};

export function VorlageAuftrag() {
  return <VorlagenSeite config={CONFIG} />;
}
