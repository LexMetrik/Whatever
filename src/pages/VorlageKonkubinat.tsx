import { NormText } from '../components/NormText';
import {
  KK_DEFAULTS, kkZusammenstellen, pruefeKkGates, type KkAntworten, type KkKostenschluessel,
} from '../lib/vorlagen/konkubinat';
import { zahl } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { SelectionGrid } from '../components/ui/SelectionGrid';

// ─── Vorlagen-Wizard: Konkubinatsvertrag ────────────────────────────────────
// P1-Vorlage der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V3).
// Innominatvertrag (Art. 19 OR), formfrei. Module Wohnen/Kosten/Inventar/
// einfache Gesellschaft/Auflösung. Hinweise in pruefeKkGates. Orchestrierung
// im generischen Rahmen (QS-CODE-ENTDOPPLUNG D1).

const SPEICHER_KEY = 'lexmetrik.vorlage.konkubinat.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'regelung', label: 'Kosten, Wohnen & Vermögen' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_KK: PdfBanner = {
  titel: 'KONKUBINATSVERTRAG',
  text: 'Formfreier Innominatvertrag (Art. 19 OR), beidseitig zu unterzeichnen. Es besteht kein gesetzliches Konkubinatsrecht; Kindesbelange richten sich nach dem Gesetz.',
};

const KOSTEN_OPTIONEN: { id: KkKostenschluessel; label: string }[] = [
  { id: 'haelftig', label: 'je zur Hälfte' },
  { id: 'einkommen', label: 'nach Einkommen' },
  { id: 'fix', label: 'feste Beiträge' },
];

function eingabeInhalt({ a, set }: SeiteCtx<KkAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <div className="lc-notice text-body-s">
          Der Konkubinatsvertrag ist ein <strong>Innominatvertrag</strong> (Art. 19 OR), formfrei
          gültig. Es gibt <strong>kein gesetzliches Konkubinatsrecht</strong> – der Vertrag regelt
          nur, was er ausdrücklich bestimmt.
        </div>
        <Field label="Partnerin / Partner 1">
          <input className={inputCls} value={a.partner1Name} onChange={(e) => set('partner1Name', e.target.value)} placeholder="Vorname Name" />
        </Field>
        <Field label="Adresse Partnerin / Partner 1" optional>
          <input className={inputCls} value={a.partner1Adresse} onChange={(e) => set('partner1Adresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Partnerin / Partner 2">
          <input className={inputCls} value={a.partner2Name} onChange={(e) => set('partner2Name', e.target.value)} placeholder="Vorname Name" />
        </Field>
        <Field label="Adresse Partnerin / Partner 2" optional>
          <input className={inputCls} value={a.partner2Adresse} onChange={(e) => set('partner2Adresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'regelung': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.wohnenAufnehmen}
          onChange={(v) => set('wohnenAufnehmen', v)}
          label={<><span><strong>Wohn-Klausel</strong> aufnehmen</span></>} />
        {a.wohnenAufnehmen && (
          <Field label="Wohnsituation" hint="Mietverhältnis/Eigentum und Nutzung der gemeinsamen Wohnung">
            <textarea className={inputCls + ' min-h-[3.5rem]'} value={a.wohnBeschrieb} onChange={(e) => set('wohnBeschrieb', e.target.value)} placeholder="z. B. gemeinsame Mietwohnung an der Beispielstrasse 1, 8000 Zürich; Hauptmieter ist Partner 1" />
          </Field>
        )}
        <Field label="Kosten des Zusammenlebens">
{/* B3-4/A3-5 (R3-α, 31.8.2026): handgezeichnete Auswahl-Reihe ohne
              `aria-pressed` — Kopie gelöscht (§5/§10), Optik aus dem Baustein. */}
          <SelectionGrid
            className="grid grid-cols-3 gap-2" gruppenLabel="Kosten des Zusammenlebens"
            items={KOSTEN_OPTIONEN.map((k) => ({ code: k.id, label: k.label }))}
            value={a.kostenschluessel} onSelect={(v) => set('kostenschluessel', v)} />
        </Field>
        {a.kostenschluessel === 'fix' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Beitrag Partner 1 (CHF/Monat)">
              <BetragsFeld className={inputCls} value={a.fix1CHF} onChange={(v) => set('fix1CHF', v)} placeholder="z. B. 1'500.00" />
            </Field>
            <Field label="Beitrag Partner 2 (CHF/Monat)">
              <BetragsFeld className={inputCls} value={a.fix2CHF} onChange={(v) => set('fix2CHF', v)} placeholder="z. B. 1'200.00" />
            </Field>
          </div>
        )}
        <Checkbox
          checked={a.gemeinsamesKonto}
          onChange={(v) => set('gemeinsamesKonto', v)}
          label={<><span><strong>Gemeinsames Konto</strong> für die gemeinsamen Kosten</span></>} />
        <Checkbox
          checked={a.inventarAufnehmen}
          onChange={(v) => set('inventarAufnehmen', v)}
          label={<><span>Verweis auf <strong>Inventarliste</strong> (Allein-/Miteigentum) aufnehmen</span></>} />
        <Checkbox
          checked={a.einfacheGesellschaft}
          onChange={(v) => set('einfacheGesellschaft', v)}
          label={<><span><strong>Einfache Gesellschaft</strong> für einen gemeinsamen Zweck <span className="text-ink-500"><NormText text={`(z. B. gemeinsames Bauvorhaben, Art. 530 OR)`} /></span></span></>} />
        {a.einfacheGesellschaft && (
          <Field label="Gemeinsamer Zweck">
            <input className={inputCls} value={a.einfacheGesellschaftZweck} onChange={(e) => set('einfacheGesellschaftZweck', e.target.value)} placeholder="z. B. Erwerb und Umbau der Liegenschaft …" />
          </Field>
        )}
        <Checkbox
          checked={a.kinderHinweis}
          onChange={(v) => set('kinderHinweis', v)}
          label={<><span><strong>Hinweis gemeinsame Kinder</strong> aufnehmen <span className="text-ink-500">(Sorge/Unterhalt nach Gesetz)</span></span></>} />
        <Checkbox
          checked={a.vorsorgeHinweis}
          onChange={(v) => set('vorsorgeHinweis', v)}
          label={<><span><strong>Hinweis Vorsorge/Erbrecht</strong> aufnehmen <span className="text-ink-500">(kein gesetzliches Erbrecht der Partner)</span></span></>} />
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: KkAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.partner1Name.trim()) f.push('Partnerin/Partner 1 angeben.');
    if (!a.partner2Name.trim()) f.push('Partnerin/Partner 2 angeben.');
  }
  if (schritt === 1) {
    if (a.wohnenAufnehmen && !a.wohnBeschrieb.trim()) f.push('Wohnsituation umschreiben (oder Wohn-Klausel deaktivieren).');
    if (a.kostenschluessel === 'fix' && (zahl(a.fix1CHF) === null || zahl(a.fix2CHF) === null)) f.push('Beide festen Monatsbeiträge in CHF angeben.');
    if (a.einfacheGesellschaft && !a.einfacheGesellschaftZweck.trim()) f.push('Gemeinsamen Zweck umschreiben (oder einfache Gesellschaft deaktivieren).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<KkAntworten> = {
  cardId: 'konkubinat',
  musterdaten: MUSTER.konkubinat,
  defaults: KK_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: kkZusammenstellen,
  pruefeGates: pruefeKkGates,
  schritte: SCHRITTE,
  overlineFallback: 'Familienrecht',
  titel: 'Konkubinatsvertrag',
  intro: 'Konkubinatsvertrag aus festen Bausteinen (Innominatvertrag, Art. 19 OR) – mit Kostenschlüssel, Wohn- und Inventar-Regelung, optionaler einfacher Gesellschaft und Auflösungsfolgen. Das fehlende gesetzliche Konkubinatsrecht wird offengelegt, nicht überspielt.',
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
      <p className="lc-overline text-brass-700">Damit der Vertrag trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Kein gesetzliches Konkubinatsrecht</strong> – nur das ausdrücklich Geregelte gilt.</li>
        <li><strong>Inventarliste</strong><NormText text={` beilegen – sie trennt Allein- von Miteigentum (Art. 646 ZGB).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Kindesbelange richten sich nach dem Gesetz; massgebend sind Gesetz und konkreter Sachverhalt.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_KK,
  dateiBasis: 'Konkubinatsvertrag',
  pdfLabel: 'Konkubinatsvertrag als PDF',
  docxLabel: 'Konkubinatsvertrag als Word (DOCX)',
};

export function VorlageKonkubinat() {
  return <VorlagenSeite config={CONFIG} />;
}
