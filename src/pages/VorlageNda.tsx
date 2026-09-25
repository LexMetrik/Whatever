import { NormText } from '../components/NormText';
import {
  NDA_DEFAULTS, ndaZusammenstellen, pruefeNdaGates, type NdaAntworten,
} from '../lib/vorlagen/nda';
import { zahl } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { SelectionGrid } from '../components/ui/SelectionGrid';

// ─── Vorlagen-Wizard: Geheimhaltungsvereinbarung (NDA) ──────────────────────
// P1-Vorlage der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V3).
// Innominatvertrag (Art. 19 OR), formfrei. Weiche einseitig/gegenseitig +
// optionale Konventionalstrafe. Hinweise in pruefeNdaGates. Orchestrierung im
// generischen Rahmen (QS-CODE-ENTDOPPLUNG D1).

const SPEICHER_KEY = 'lexmetrik.vorlage.nda.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien & Richtung' },
  { id: 'inhalt', label: 'Inhalt & Strafe' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_NDA: PdfBanner = {
  titel: 'GEHEIMHALTUNGSVEREINBARUNG (NDA)',
  text: 'Formfreier Innominatvertrag (Art. 19 OR), beidseitig zu unterzeichnen. Übermässige Konventionalstrafen setzt der Richter herab (Art. 163 Abs. 3 OR).',
};

// Richtungs-abhängige Parteibezeichnungen — dieselbe Ableitung speist die
// Feld-Labels UND die Pflichtfeld-Meldungen (sonst zwei Wahrheiten, §5).
const labelA = (a: NdaAntworten) => (a.gegenseitig ? 'Partei A' : 'Offenlegende Partei (A)');
const labelB = (a: NdaAntworten) => (a.gegenseitig ? 'Partei B' : 'Empfangende Partei (B)');

function eingabeInhalt({ a, set }: SeiteCtx<NdaAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <Field label="Richtung der Geheimhaltung">
          {/* B3-4/A3-5 (R3-α, 31.8.2026): zwei handgezeichnete Kacheln ohne
              `aria-pressed` — ein Boolean, als Auswahl von zweien dargestellt.
              Er läuft jetzt über den EINEN Baustein; die LM-176-Messung
              (Unterzeile ink-600 auf getönter Fläche) steht dort. */}
          <SelectionGrid
            className="grid grid-cols-2 gap-2" gruppenLabel="Richtung der Geheimhaltung"
            items={[
              { code: 'gegenseitig', label: 'Gegenseitig', sub: 'beide Parteien verpflichtet' },
              { code: 'einseitig', label: 'Einseitig', sub: 'nur Partei B verpflichtet' },
            ] as const}
            value={a.gegenseitig ? 'gegenseitig' : 'einseitig'}
            onSelect={(c) => set('gegenseitig', c === 'gegenseitig')} />
        </Field>
        <Field label={labelA(a)}>
          <input className={inputCls} value={a.parteiAName} onChange={(e) => set('parteiAName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label={`Adresse ${labelA(a)}`} optional>
          <input className={inputCls} value={a.parteiAAdresse} onChange={(e) => set('parteiAAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label={labelB(a)}>
          <input className={inputCls} value={a.parteiBName} onChange={(e) => set('parteiBName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label={`Adresse ${labelB(a)}`} optional>
          <input className={inputCls} value={a.parteiBAdresse} onChange={(e) => set('parteiBAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'inhalt': {
      // Wert für die Nachwirkungs-Beschriftung (LM-115): nur wenn die Option
      // an ist UND eine gültige Jahreszahl darin steht.
      const nachwirkJahre = a.dauerErfassen && (zahl(a.dauerJahre) ?? 0) > 0 ? zahl(a.dauerJahre)! : null;
      return (
      <div className="space-y-4">
        {/* LM-165 (B6/K-15): aria-invalid rollt dieselbe Feld-Markierung wie in den
            Fristen-Rechnern aus (§8) — sicher pristine, weil dieser Schritt nur nach
            dem gate-gesperrten Schritt 0 erreichbar ist (VorlagenSeite/wizard.tsx),
            «berührt» also längst true ist, bevor diese Felder je sichtbar werden. */}
        <Field label="Zweck der Offenlegung" hint="erscheint im Vertragstext und begrenzt die Verwendung">
          <textarea className={inputCls + ' min-h-[4.5rem]'} value={a.zweck}
            aria-invalid={!a.zweck.trim()}
            onChange={(e) => set('zweck', e.target.value)} placeholder="z. B. Prüfung einer möglichen Zusammenarbeit im Bereich Softwareentwicklung" />
        </Field>
        <Field label="Konkretisierung der vertraulichen Informationen" optional hint="zusätzlich zur allgemeinen Definition">
          <input className={inputCls} value={a.infoBeschrieb} onChange={(e) => set('infoBeschrieb', e.target.value)} placeholder="z. B. Quellcode, Kundenlisten, Preiskalkulationen" />
        </Field>
        {/* B13/LM-115: die Beschriftung kündigt einen Wert an — also zeigt sie
            den EINGESTELLTEN, nicht den Platzhalter «N». Solange nichts (oder
            nichts Gültiges) gesetzt ist, verspricht sie keine Zahl, statt eine
            zu behaupten (§8). Reine Darstellung: gerechnet wird nichts. */}
        <Checkbox
          checked={a.dauerErfassen}
          onChange={(v) => set('dauerErfassen', v)}
          label={<><span><strong>Nachwirkungsfrist</strong> vereinbaren {nachwirkJahre !== null
            ? `(Geheimhaltung gilt ${nachwirkJahre} ${nachwirkJahre === 1 ? 'Jahr' : 'Jahre'} über das Vorhaben hinaus)`
            : '(Geheimhaltung gilt über das Vorhaben hinaus — Dauer im Feld darunter)'}</span></>} />
        {a.dauerErfassen && (
          <Field label="Dauer nach Beendigung (Jahre)">
            <input className={inputCls + ' sm:max-w-[8rem]'} inputMode="numeric" value={a.dauerJahre}
              aria-invalid={zahl(a.dauerJahre) === null || zahl(a.dauerJahre)! <= 0}
              onChange={(e) => set('dauerJahre', e.target.value)} placeholder="z. B. 3" />
          </Field>
        )}
        <Checkbox
          checked={a.rueckgabe}
          onChange={(v) => set('rueckgabe', v)}
          label={<><span><strong>Rückgabe/Vernichtung</strong> der Unterlagen aufnehmen</span></>} />
        <Checkbox
          checked={a.konventionalstrafe}
          onChange={(v) => set('konventionalstrafe', v)}
          label={<><span><strong>Konventionalstrafe</strong> vereinbaren <span className="text-ink-500"><NormText text={`(verfällt auch ohne Schaden; übermässige setzt der Richter herab, Art. 163 Abs. 3 OR)`} /></span></span></>} />
        {a.konventionalstrafe && (
          <Field label="Konventionalstrafe je Verletzung (CHF)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.strafeCHF}
              aria-invalid={zahl(a.strafeCHF) === null}
              onChange={(v) => set('strafeCHF', v)} placeholder="z. B. 20'000.00" />
          </Field>
        )}
      </div>
      );
    }

    default: return null;
  }
}

function fehlerEingabe(a: NdaAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.parteiAName.trim()) f.push(`${labelA(a)} angeben.`);
    if (!a.parteiBName.trim()) f.push(`${labelB(a)} angeben.`);
  }
  if (schritt === 1) {
    if (!a.zweck.trim()) f.push('Zweck der Offenlegung angeben.');
    if (a.dauerErfassen && (zahl(a.dauerJahre) === null || zahl(a.dauerJahre)! <= 0)) f.push('Dauer in Jahren angeben (oder Nachwirkungsfrist deaktivieren).');
    if (a.konventionalstrafe && zahl(a.strafeCHF) === null) f.push('Konventionalstrafe in CHF angeben (oder deaktivieren).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<NdaAntworten> = {
  cardId: 'nda',
  musterdaten: MUSTER.nda,
  defaults: NDA_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: ndaZusammenstellen,
  pruefeGates: pruefeNdaGates,
  schritte: SCHRITTE,
  overlineFallback: 'Vertrag (OR)',
  titel: 'Geheimhaltungsvereinbarung (NDA)',
  intro: 'Geheimhaltungsvereinbarung aus festen Bausteinen (Innominatvertrag, Art. 19 OR) – mit Weiche einseitig/gegenseitig, Zweckbindung, Nachwirkungsfrist und optionaler Konventionalstrafe. Was Wertung wäre, wird offengelegt, nicht berechnet.',
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
      <p className="lc-overline text-brass-700">Damit die NDA trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Zweckbindung</strong> – die Informationen dürfen nur für den genannten Zweck verwendet werden.</li>
        <li><strong>Konventionalstrafe</strong><NormText text={` – beweiserleichternd, aber bei Übermass richterlich herabsetzbar (Art. 163 Abs. 3 OR).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Die NDA ist ein Innominatvertrag; massgebend sind Gesetz und konkreter Sachverhalt.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_NDA,
  dateiBasis: 'Geheimhaltungsvereinbarung',
  pdfLabel: 'NDA als PDF',
  docxLabel: 'NDA als Word (DOCX)',
};

export function VorlageNda() {
  return <VorlagenSeite config={CONFIG} />;
}
