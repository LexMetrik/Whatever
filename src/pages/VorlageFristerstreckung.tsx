import { NormText } from '../components/NormText';
import { Link } from 'react-router-dom';
import {
  FE_DEFAULTS, feZusammenstellen, pruefeFeGates, type FeAntworten, type FeFristTyp,
} from '../lib/vorlagen/fristerstreckung';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';

// ─── Vorlagen-Wizard: Fristerstreckungsgesuch (Art. 144 ZPO) ────────────────
// P1-Vorlage der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V2).
// Die Frist-Art-Weiche (gesetzlich = nicht erstreckbar) und die
// Vor-Fristablauf-Gates liegen in pruefeFeGates. Orchestrierung im generischen
// Rahmen (QS-CODE-ENTDOPPLUNG D1); hier nur Felder + Bestätigung + Meta.

const SPEICHER_KEY = 'lexmetrik.vorlage.fristerstreckung.v1';

const SCHRITTE = [
  { id: 'verfahren', label: 'Verfahren & Gericht' },
  { id: 'frist', label: 'Frist & Begründung' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_FE: PdfBanner = {
  titel: 'FRISTERSTRECKUNG – VOR FRISTABLAUF EINREICHEN (ART. 144 ABS. 2 ZPO)',
  text: 'Nur gerichtliche Fristen sind erstreckbar. Ob die Gründe zureichend sind, entscheidet das Gericht.',
};

const FRIST_TYPEN: { wert: FeFristTyp; label: string; sub: string }[] = [
  { wert: 'gerichtlich', label: 'Gerichtliche Frist', sub: 'vom Gericht angesetzt (z. B. Klageantwort, Stellungnahme) – erstreckbar' },
  { wert: 'gesetzlich', label: 'Gesetzliche Frist', sub: 'von der ZPO bestimmt (z. B. Berufungsfrist) – NICHT erstreckbar' },
  { wert: 'unsicher', label: 'Unsicher', sub: 'Frist-Art noch klären – Warnung wird offengelegt' },
];

function eingabeInhalt({ a, set }: SeiteCtx<FeAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'verfahren': return (
      <div className="space-y-4">
        <Field label="Gesuchstellende Partei / Vertretung">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse" optional>
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Gericht" hint="das Gericht, das die Frist angesetzt hat – nur dieses kann sie erstrecken">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="z. B. Zivilgericht Basel-Stadt" />
        </Field>
        <Field label="Adresse des Gerichts" optional>
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Verfahren" hint="erscheint im Betreff">
          <input className={inputCls} value={a.verfahrenBeschrieb} onChange={(e) => set('verfahrenBeschrieb', e.target.value)} placeholder="z. B. Muster AG gegen Beispiel GmbH betreffend Forderung" />
        </Field>
        <Field label="Geschäfts-Nr." optional>
          <input className={inputCls + ' sm:max-w-[14rem]'} value={a.verfahrenNr} onChange={(e) => set('verfahrenNr', e.target.value)} placeholder="z. B. ZG.2026.123" />
        </Field>
      </div>
    );

    case 'frist': return (
      <div className="space-y-4">
        <Field label="Art der Frist" hint="nur gerichtliche Fristen sind erstreckbar (Art. 144 ZPO)">
          <div className="space-y-2">
            {FRIST_TYPEN.map((t) => (
              <label key={t.wert} className="flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-700">
                <input type="radio" name="fristTyp" className="mt-0.5" checked={a.fristTyp === t.wert}
                  onChange={() => set('fristTyp', t.wert)} />
                <span><strong>{t.label}</strong> <span className="text-ink-500">– {t.sub}</span></span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Frist" hint="bestimmte Bezeichnung – erscheint im Gesuch">
          <input className={inputCls} value={a.fristBeschrieb} onChange={(e) => set('fristBeschrieb', e.target.value)} placeholder="z. B. Frist zur Erstattung der Klageantwort" />
        </Field>
        <Checkbox
          checked={a.verfuegungVomErfassen}
          onChange={(v) => set('verfuegungVomErfassen', v)}
          label={<><span>Datum der <strong>fristansetzenden Verfügung</strong> nennen <span className="text-ink-500">(optional)</span></span></>} />
        {a.verfuegungVomErfassen && (
          <Field label="Verfügung vom">
            <DatumsFeld value={a.verfuegungVom} onChange={(v) => set('verfuegungVom', v)} className={inputCls} />
          </Field>
        )}
        <Field label="Laufendes Fristende">
          <DatumsFeld value={a.fristEnde} onChange={(v) => set('fristEnde', v)} className={inputCls} />
        </Field>
        <Field label="Beantragtes neues Fristende">
          <DatumsFeld value={a.erstreckungBis} onChange={(v) => set('erstreckungBis', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.ersteErstreckung}
          onChange={(v) => set('ersteErstreckung', v)}
          label={<><span>Es ist das <strong>erste</strong> Erstreckungsgesuch in dieser Frist <span className="text-ink-500">(wird im Gesuch offengelegt)</span></span></>} />
        <Checkbox
          checked={a.begruendungPlatzhalter}
          onChange={(v) => set('begruendungPlatzhalter', v)}
          label={<><span><strong>Begründung später ausfüllen</strong> <span className="text-ink-500">(Platzhalter-Block im Gesuch – vor Einreichung ergänzen)</span></span></>} />
        {!a.begruendungPlatzhalter && (
          <Field label="Begründung" hint="zureichende Gründe konkret darlegen (Art. 144 Abs. 2 ZPO)">
            <textarea className={inputCls + ' min-h-[6rem]'} value={a.begruendung} onChange={(e) => set('begruendung', e.target.value)}
              placeholder="z. B. Die Akten umfassen über 800 Seiten; die unterzeichnete Vertretung ist zudem vom … bis … landesabwesend." />
          </Field>
        )}
        <div className="lc-notice text-body-s">
          Fristende mit Stillstand und Feiertagen rechnen: {' '}
          <Link to="/rechner/zpo-fristen" className="text-brass-700 underline">ZPO-Fristen-Rechner</Link>.
        </div>
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: FeAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.absenderName.trim()) f.push('Gesuchstellende Partei bzw. Vertretung angeben.');
    if (!a.adressatName.trim()) f.push('Gericht angeben.');
    if (!a.verfahrenBeschrieb.trim()) f.push('Verfahren bezeichnen (z. B. «Muster AG gegen Beispiel GmbH betreffend Forderung»).');
  }
  if (schritt === 1) {
    if (!a.fristBeschrieb.trim()) f.push('Frist bezeichnen (z. B. «Frist zur Erstattung der Klageantwort»).');
    if (!istIsoDatum(a.fristEnde)) f.push('Laufendes Fristende angeben.');
    if (!istIsoDatum(a.erstreckungBis)) f.push('Beantragtes neues Fristende angeben.');
    if (a.verfuegungVomErfassen && !istIsoDatum(a.verfuegungVom)) f.push('Datum der Verfügung angeben (oder Erfassung deaktivieren).');
    if (!a.begruendungPlatzhalter && !a.begruendung.trim()) f.push('Begründung erfassen – oder «Begründung später ausfüllen» wählen.');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<FeAntworten> = {
  cardId: 'fristerstreckungsgesuch',
  musterdaten: MUSTER.fristerstreckungsgesuch,
  defaults: FE_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: feZusammenstellen,
  pruefeGates: pruefeFeGates,
  schritte: SCHRITTE,
  overlineFallback: 'Zivilprozess (ZPO)',
  titel: 'Fristerstreckungsgesuch',
  intro: 'Gesuch an das Gericht, eine gerichtliche Frist zu erstrecken (Art. 144 Abs. 2 ZPO) – mit Frist-Art-Weiche (gesetzliche Fristen sind nicht erstreckbar), Vor-Fristablauf-Prüfung und Begründung als Maske oder Platzhalter. Was Wertung wäre, wird offengelegt, nicht berechnet.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt,
  fehlerEingabe,
  ortDatumLabel: 'Ort und Datum des Gesuchs',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum des Gesuchs angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit das Gesuch trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Vor Fristablauf einreichen</strong><NormText text={` (Art. 144 Abs. 2 ZPO) – spätestens am letzten Tag beim Gericht einreichen oder der Schweizerischen Post übergeben (Art. 143 Abs. 1 ZPO).`} /></li>
        <li><strong>Unterschreiben</strong> – das Gesuch geht als unterzeichnete Eingabe an das Gericht.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Ob die Gründe zureichend sind, entscheidet das Gericht – ein Anspruch auf Erstreckung besteht nicht.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_FE,
  dateiBasis: 'Fristerstreckungsgesuch',
  pdfLabel: 'Gesuch als PDF',
  docxLabel: 'Gesuch als Word (DOCX)',
};

export function VorlageFristerstreckung() {
  return <VorlagenSeite config={CONFIG} />;
}
