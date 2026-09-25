import {
  FA_DEFAULTS, faZusammenstellen, pruefeFaGates, type FaAntworten,
} from '../lib/vorlagen/forderungsabtretung';
import { NormText } from '../components/NormText';
import { KDG_ZUGANGS_HINWEIS } from '../lib/vorlagen/kuendigungGemeinsam';
import { zahl } from '../lib/vorlagen/datum';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { Checkbox, Field, inputCls } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';

// ─── Vorlagen-Wizard: Abtretungserklärung / Zession (Art. 164 ff. OR) ───────
// P1-Vorlage der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V2).
// Erklärende Partei ist die ZEDENTIN; die Schriftform verlangt ihre
// Unterschrift (Art. 165 Abs. 1 OR). Die Hinweise liegen in pruefeFaGates.
// PILOT der generischen VorlagenSeite (FUNDAMENT-UMBAU Thema A): die
// Orchestrierung liegt im Rahmen, hier nur Felder + Bestätigung + Meta.

const SPEICHER_KEY = 'lexmetrik.vorlage.forderungsabtretung.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'forderung', label: 'Forderung & Optionen' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_FA: PdfBanner = {
  titel: 'ABTRETUNG – SCHRIFTFORM ZWINGEND (ART. 165 ABS. 1 OR)',
  text: 'Von der abtretenden Partei (Zedentin/Zedent) zu unterzeichnen. Abtretungsverbote im Grundvertrag vorbehalten (Art. 164 Abs. 1 OR).',
};

function eingabeInhalt({ a, set }: SeiteCtx<FaAntworten>, schritt: number) {
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <div className="lc-notice text-body-s">
          Die <strong>Zedentin/der Zedent</strong> (bisherige Gläubigerseite) erklärt die Abtretung
          und unterschreibt – nur ihre Unterschrift verlangt die Schriftform (Art. 165 Abs. 1 OR).
          Eine Einwilligung des Schuldners ist nicht nötig (Art. 164 Abs. 1 OR).
        </div>
        <Field label="Zedentin / Zedent (abtretende Partei)">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse der Zedentin" optional>
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Zessionarin / Zessionar (Erwerberin der Forderung)">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse der Zessionarin" optional>
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Schuldnerin / Schuldner der Forderung">
          <input className={inputCls} value={a.schuldnerName} onChange={(e) => set('schuldnerName', e.target.value)} placeholder="Firma / Vorname Name" />
        </Field>
        <Field label="Adresse der Schuldnerseite" optional>
          <input className={inputCls} value={a.schuldnerAdresse} onChange={(e) => set('schuldnerAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'forderung': return (
      <div className="space-y-4">
        <Field label="Forderung" hint="bestimmte Bezeichnung – erscheint im Betreff und im Abtretungs-Satz">
          <input className={inputCls} value={a.forderungBeschrieb} onChange={(e) => set('forderungBeschrieb', e.target.value)} placeholder="z. B. Kaufpreisforderung aus Kaufvertrag vom 1. Februar 2026" />
        </Field>
        <Checkbox
          checked={a.betragErfassen}
          onChange={(v) => set('betragErfassen', v)}
          label={<><span>Betrag in der Erklärung nennen <span className="text-ink-500">(optional – die Bezeichnung muss die Forderung auch ohne Betrag bestimmen)</span></span></>} />
        {a.betragErfassen && (
          <Field label="Forderungsbetrag (CHF)">
            <BetragsFeld className={inputCls + ' sm:max-w-[12rem]'} value={a.betrag} onChange={(v) => set('betrag', v)} placeholder="z. B. 25'000.00" />
          </Field>
        )}
        <Checkbox
          checked={a.zinsenAusdruecklich}
          onChange={(v) => set('zinsenAusdruecklich', v)}
          label={<><span>Rückständige Zinsen <strong>ausdrücklich mitabtreten</strong> <span className="text-ink-500"><NormText text={`(sonst nur gesetzliche Vermutung, Art. 170 Abs. 3 OR)`} /></span></span></>} />
        <Checkbox
          checked={a.urkundenUebergabe}
          onChange={(v) => set('urkundenUebergabe', v)}
          label={<><span>Zusage der <strong>Urkunden-/Beweismittel-Übergabe</strong> aufnehmen <span className="text-ink-500"><NormText text={`(gesetzliche Pflicht, Art. 170 Abs. 2 OR)`} /></span></span></>} />
        <Checkbox
          checked={a.anzeigeAnkuendigen}
          onChange={(v) => set('anzeigeAnkuendigen', v)}
          label={<><span>Ankündigen, dass der <strong>Schuldner schriftlich informiert</strong> wird <span className="text-ink-500"><NormText text={`(bis zur Anzeige befreit ihn die gutgläubige Zahlung an die Alt-Gläubigerin, Art. 167 OR)`} /></span></span></>} />
        <Checkbox
          checked={a.annahmeZeile}
          onChange={(v) => set('annahmeZeile', v)}
          label={<><span>Gegenzeichnungs-Zeile der <strong>Zessionarin</strong> aufnehmen <span className="text-ink-500">(formfrei möglich – die Zeile schafft Klarheit)</span></span></>} />
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: FaAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.absenderName.trim()) f.push('Zedentin/Zedent (abtretende Partei) angeben.');
    if (!a.adressatName.trim()) f.push('Zessionarin/Zessionar (Erwerberin) angeben.');
    if (!a.schuldnerName.trim()) f.push('Schuldnerin/Schuldner der Forderung angeben.');
  }
  if (schritt === 1) {
    if (!a.forderungBeschrieb.trim()) f.push('Forderung bezeichnen (z. B. «Kaufpreisforderung aus Kaufvertrag vom 1. Februar 2026»).');
    if (a.betragErfassen && zahl(a.betrag) === null) f.push('Betrag in CHF angeben (oder Erfassung deaktivieren).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<FaAntworten> = {
  cardId: 'forderungsabtretung',
  musterdaten: MUSTER.forderungsabtretung,
  defaults: FA_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: faZusammenstellen,
  pruefeGates: pruefeFaGates,
  schritte: SCHRITTE,
  overlineFallback: 'Vertrag & Forderung (OR)',
  titel: 'Abtretungserklärung (Zession)',
  intro: 'Erklärung der bisherigen Gläubigerseite, eine bestimmte Forderung an eine Erwerberin abzutreten (Art. 164 ff. OR) – mit zwingender Schriftform, Klarstellung zu den Zinsen und Hinweisen zu Abtretungsverboten und Schuldner-Anzeige. Was Wertung wäre, wird offengelegt, nicht berechnet.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt,
  fehlerEingabe,
  ortDatumLabel: 'Ort und Datum der Erklärung',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Erklärung angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit die Abtretung trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Schriftform ist zwingend</strong><NormText text={` (Art. 165 Abs. 1 OR) – drucken und von der Zedentin unterschreiben lassen.`} /></li>
        <li><strong>Schuldner-Anzeige nachweisbar zustellen</strong> – {KDG_ZUGANGS_HINWEIS}</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Die Abtretung setzt die Abtretbarkeit der Forderung voraus (kein Abtretungsverbot) – massgebend sind Gesetz und konkreter Sachverhalt.',
  banner: BANNER_FA,
  dateiBasis: 'Abtretungserklaerung',
  pdfLabel: 'Abtretungserklärung als PDF',
  docxLabel: 'Abtretungserklärung als Word (DOCX)',
};

export function VorlageForderungsabtretung() {
  return <VorlagenSeite config={CONFIG} />;
}
