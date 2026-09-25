import { NormText } from '../components/NormText';
import {
  KAN_DEFAULTS, kanZusammenstellen, pruefeKanGates, type KanAntworten, type KanProbezeit,
} from '../lib/vorlagen/kuendigungArbeitnehmer';
import { KDG_ZUGANGS_HINWEIS } from '../lib/vorlagen/kuendigungGemeinsam';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Datum } from '../components/ui/Datum';
import { Checkbox, Field, GruppenTitel, inputCls, NormLink } from '../components/vorlagen/ui';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';

// ─── Vorlagen-Wizard: Kündigung durch Arbeitnehmer:in (Maske 1a, free) ──────
// Bauspezifikation: bibliothek/recherche/kuendigungs-masken.md (6.6.2026).
// Beendigungsdatum LIVE aus lib/kuendigungsfrist.ts; keine Rechtslogik hier (§3).
// Orchestrierung im generischen Rahmen (QS-CODE-ENTDOPPLUNG D1); das
// Engine-Ergebnis reist über ctx.z zu den Gates und zur Termin-Kachel — die
// Engine läuft also weiterhin genau einmal pro Eingabe.

const SPEICHER_KEY = 'lexmetrik.vorlage.kuendigung-arbeitnehmer.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'anstellung', label: 'Anstellung & Frist' },
  { id: 'termin', label: 'Kündigungstermin' },
  { id: 'bitten', label: 'Zeugnis & Abrechnung' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_KAN: PdfBanner = {
  titel: 'KÜNDIGUNGSSCHREIBEN – ZU UNTERZEICHNEN UND NACHWEISBAR ZUZUSTELLEN',
  text: 'Die Kündigung ist formfrei gültig (vorbehältlich vertraglicher Schriftform). Massgebend ist der Zugang beim Arbeitgeber – eingeschriebene Zustellung empfohlen.',
};

type KanZusammenstellung = ReturnType<typeof kanZusammenstellen>;

function eingabeInhalt({ a, set, z }: SeiteCtx<KanAntworten, KanZusammenstellung>, schritt: number) {
  const engine = z.engine;
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <Field label="Ihr Name (kündigende Arbeitnehmerin / kündigender Arbeitnehmer)">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Vorname Name" />
        </Field>
        <Field label="Ihre Adresse">
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Arbeitgeberin / Arbeitgeber" hint="Firma gemäss Arbeitsvertrag">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="Firma / Name" />
        </Field>
        <Field label="Adresse der Arbeitgeberin / des Arbeitgebers">
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'anstellung': return (
      <div className="space-y-4">
        <Field label="Vertragsbeginn" hint="bestimmt Dienstjahr und gesetzliche Frist (Art. 335c OR)">
          <DatumsFeld value={a.vertragsbeginn} onChange={(v) => set('vertragsbeginn', v)} className={inputCls} />
        </Field>
        <Field label="Probezeit" hint="7-Tage-Frist, falls der Zugang noch in die Probezeit fällt (Art. 335b OR)">
          <select className={inputCls} value={a.probezeit} onChange={(e) => set('probezeit', e.target.value as KanProbezeit)}>
            <option value="keine">Keine Probezeit (vorbei oder wegbedungen)</option>
            <option value="gesetzlich">Gesetzliche Probezeit (1 Monat)</option>
            <option value="vereinbart">Vertraglich verlängert (2–3 Monate)</option>
          </select>
        </Field>
        {a.probezeit === 'vereinbart' && (
          <Field label="Vereinbarte Probezeit (Monate)">
            <input type="number" min={1} max={3} className={inputCls + ' num sm:max-w-[9rem]'} value={a.probezeitMonate}
              onChange={(e) => set('probezeitMonate', Number(e.target.value))} />
          </Field>
        )}
        <Field label="Kündigungsfrist" hint="abweichende Frist gilt nur bei Schriftform/GAV (Art. 335c Abs. 2 OR)">
          <select className={inputCls} value={a.fristQuelle} onChange={(e) => set('fristQuelle', e.target.value as KanAntworten['fristQuelle'])}>
            <option value="gesetzlich">Gesetzliche Frist (1/2/3 Monate nach Dienstjahr)</option>
            <option value="abweichend">Vertraglich abweichende Frist</option>
          </select>
        </Field>
        {a.fristQuelle === 'abweichend' && (
          <div className="space-y-3">
            <Field label="Abweichende Frist (Monate)">
              <input type="number" min={1} className={inputCls + ' num sm:max-w-[9rem]'} value={a.abweichendeFristMonate}
                onChange={(e) => set('abweichendeFristMonate', Number(e.target.value))} />
            </Field>
            <Checkbox
              checked={a.abweichendeFristFormGueltig}
              onChange={(v) => set('abweichendeFristFormGueltig', v)}
              label={<><span>Die abweichende Frist steht schriftlich im Vertrag, NAV oder GAV
                  <span className="text-ink-500"> (Gültigkeitsvoraussetzung – sonst gilt die gesetzliche Frist)</span></span></>} />
          </div>
        )}
      </div>
    );

    case 'termin': return (
      <div className="space-y-4">
        <Field label="Erwarteter Zugang der Kündigung" hint="Stichtag der Fristberechnung – nicht das Absendedatum">
          <DatumsFeld value={a.zugangKuendigung} onChange={(v) => set('zugangKuendigung', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.kuendigungsterminMonatsende}
          onChange={(v) => set('kuendigungsterminMonatsende', v)}
          label={<><span>Kündigungstermin ist das Monatsende <span className="text-ink-500"><NormText text={`(gesetzlicher Regelfall, Art. 335c Abs. 1 OR)`} /></span></span></>} />
        {engine?.beendigungsdatum && (
          <div className="lc-tile">
            <GruppenTitel>Beendigung des Arbeitsverhältnisses</GruppenTitel>
            {/* B-3/B3-7 (R3-α, 31.8.2026): hier stand
                `toLocaleDateString('de-CH')` — die EINZIGE Stelle der App, die
                das Anzeigedatum aus der Browser-Locale zog. Sie schrieb
                «1.6.2026» (ohne führende Nullen), während jede andere Fläche
                «01.06.2026» zeigt, und setzte es in die Mono-Stimme (`num`),
                die seit S2/Ä-(b) auf SR-Nr./Aktenzeichen begrenzt ist. Beides
                kommt jetzt aus dem EINEN Baustein. `sv-SE` liefert das
                LOKALE Datum in ISO-Form (Haus-Idiom, E2-1) — es ersetzt nur
                die Formatierung, nicht die Rechnung (§3). */}
            <p className="text-h2 font-display font-semibold text-ink-900 leading-none">
              <Datum iso={engine.beendigungsdatum.toLocaleDateString('sv-SE')} />
            </p>
            <p className="text-body-s text-ink-600 mt-1.5">{engine.ergebnis.ergebnis}</p>
            {engine.istProbezeit && (
              <p className="text-body-s text-warn-700 mt-1">Zugang liegt in der Probezeit – 7-Tage-Frist (<NormLink artikel="Art. 335b OR" />).</p>
            )}
          </div>
        )}
        <div className="lc-notice text-body-s">{KDG_ZUGANGS_HINWEIS}</div>
      </div>
    );

    case 'bitten': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.zeugnisVerlangen}
          onChange={(v) => set('zeugnisVerlangen', v)}
          label={<><span>Qualifiziertes Arbeitszeugnis verlangen <span className="text-ink-500"><NormText text={`(Anspruch nach Art. 330a OR)`} /></span></span></>} />
        <Checkbox
          checked={a.schlussabrechnungVerlangen}
          onChange={(v) => set('schlussabrechnungVerlangen', v)}
          label={<><span>Schlussabrechnung verlangen <span className="text-ink-500">(Lohn, anteiliger 13. Monatslohn, Feriensaldo, Überstunden)</span></span></>} />
      </div>
    );

    default: return null;
  }
}

function fehlerEingabe(a: KanAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.absenderName.trim()) f.push('Eigenen Namen angeben.');
    if (!a.absenderAdresse.trim()) f.push('Eigene Adresse angeben.');
    if (!a.adressatName.trim()) f.push('Arbeitgeberin/Arbeitgeber angeben.');
    if (!a.adressatAdresse.trim()) f.push('Adresse der Arbeitgeberin/des Arbeitgebers angeben.');
  }
  if (schritt === 1) {
    if (!istIsoDatum(a.vertragsbeginn)) f.push('Vertragsbeginn angeben (für Dienstjahr und Probezeit).');
    if (a.probezeit === 'vereinbart' && (a.probezeitMonate < 1 || a.probezeitMonate > 3)) f.push('Vereinbarte Probezeit: 1–3 Monate (Art. 335b OR).');
    if (a.fristQuelle === 'abweichend' && a.abweichendeFristMonate < 1) f.push('Abweichende Frist: mindestens 1 Monat (Art. 335c Abs. 2 OR).');
  }
  if (schritt === 2) {
    if (!istIsoDatum(a.zugangKuendigung)) f.push('Erwarteten Zugang der Kündigung angeben (Stichtag der Fristberechnung).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<KanAntworten, KanZusammenstellung> = {
  cardId: 'kuendigung-arbeitnehmer',
  musterdaten: MUSTER['kuendigung-arbeitnehmer'],
  defaults: KAN_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  zusammenstellen: kanZusammenstellen,
  pruefeGates: (a, z) => pruefeKanGates(a, z.engine),
  schritte: SCHRITTE,
  overlineFallback: 'Arbeit',
  titel: 'Kündigung durch Arbeitnehmer:in',
  intro: 'Stellt das Kündigungsschreiben aus festen Bausteinen zusammen und berechnet das Beendigungsdatum live nach Art. 335a–c OR (Dienstjahr, Probezeit, abweichende Fristen). Sperrfristen gelten für die Arbeitnehmer-Kündigung nicht. Ohne Sprachmodell: gleiche Eingaben, gleiches Dokument.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: die Blocker sperren hier nur den Export, nicht
  // die Fehlerbox des letzten Schritts (§6).
  blockerImLetztenSchritt: false,
  ortDatumLabel: 'Ort und Datum der Erklärung',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Erklärung angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit die Kündigung trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>Unterschreiben und nachweisbar zustellen</strong> – eingeschrieben und zusätzlich per A-Post (Beweis + zeitnaher Zugang).</li>
        <li><strong>Zugang ist massgebend</strong> – die Frist läuft ab Zugang beim Arbeitgeber, nicht ab Versand.</li>
        <li><strong>Vertragliche Schriftform</strong> (falls vereinbart) ist mit diesem unterschriebenen Brief erfüllt.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Das Beendigungsdatum beruht auf meinen Eingaben (Vertragsbeginn, Zugang, Frist) – bei Unsicherheit den Arbeitsvertrag/GAV prüfen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_KAN,
  dateiBasis: 'Kuendigung-Arbeitsverhaeltnis',
  pdfLabel: 'Kündigung als PDF',
  docxLabel: 'Kündigung als Word (DOCX)',
};

export function VorlageKuendigungArbeitnehmer() {
  return <VorlagenSeite config={CONFIG} />;
}
