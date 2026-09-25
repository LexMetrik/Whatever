import { NormText } from '../components/NormText';
import {
  KAG_DEFAULTS, KAG_PROBEZEIT, kagZusammenstellen, pruefeKagGates, type KagAntworten, type KagProbezeit,
} from '../lib/vorlagen/kuendigungArbeitgeber';
import { KDG_ZUGANGS_HINWEIS } from '../lib/vorlagen/kuendigungGemeinsam';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls, NormLink } from '../components/vorlagen/ui';
import { SperrereignisseEditor } from '../components/forms/SperrereignisseEditor';
import { ArbeitstageFeld } from '../components/forms/ArbeitstageFeld';
import { istGueltigeArbeitstage } from '../lib/kuendigungsfristProbezeit';
import { SperrtageZaehler } from '../components/SperrtageZaehler';
import { istIsoDatum } from '../components/vorlagen/seiteHelfer';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { Link } from 'react-router-dom';
import { sperrfristenLink } from '../lib/rechnerPermalinks';

// ─── Vorlagen-Wizard: Kündigung durch Arbeitgeber:in (Maske 1b, Flaggschiff) ─
// Bauspezifikation: bibliothek/recherche/kuendigungs-masken.md (6.6.2026).
// Führende Engine: lib/sperrfristen.ts (LIVE); Engine-Status 'nichtig' ist
// ein HARTER Export-Blocker (Art. 336c Abs. 2 OR). Keine Rechtslogik hier (§3).
// Orchestrierung im generischen Rahmen (W2·29-WERKBANK-VORLAGEN V2a); das
// Engine-Ergebnis reist über ctx.z zu Gates und Status-Kachel.

const SPEICHER_KEY = 'lexmetrik.vorlage.kuendigung-arbeitgeber.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'anstellung', label: 'Anstellung & Frist' },
  { id: 'sperrfristen', label: 'Sperrfristen' },
  { id: 'termin', label: 'Kündigungstermin' },
  { id: 'inhalt', label: 'Begründung & Freistellung' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_KAG: PdfBanner = {
  titel: 'KÜNDIGUNGSSCHREIBEN – ZU UNTERZEICHNEN UND NACHWEISBAR ZUZUSTELLEN',
  text: 'Massgebend ist der Zugang bei der Arbeitnehmerin/beim Arbeitnehmer (Wohnadresse). Sperrfristen nach Art. 336c OR wurden anhand der Eingaben geprüft; GAV und Einzelvertrag gehen vor. Begründung nur auf Verlangen (Art. 335 Abs. 2 OR).',
};

type KagZusammenstellung = ReturnType<typeof kagZusammenstellen>;

function statusKachel(a: KagAntworten, engine: KagZusammenstellung['engine']) {
  const nichtig = engine?.status === 'nichtig';
  return engine && istIsoDatum(a.zugangKuendigung) && (
    nichtig ? (
      <div className="lc-tile lc-akzent-danger">
        <GruppenTitel>Status</GruppenTitel>
        <p className="text-h2 font-semibold text-danger-700 leading-none">NICHTIG</p>
        <p className="text-body-s text-ink-700 mt-1.5">
          Der Zugang fällt in eine Sperrfrist (<NormLink artikel="Art. 336c OR" />). Frühestens neu kündbar:{' '}
          <span className="num font-medium">{engine.fruehesteNeueKuendigungISO?.split('-').reverse().join('.') ?? '–'}</span>
        </p>
      </div>
    ) : (
      <div className="lc-tile">
        <GruppenTitel>Beendigung des Arbeitsverhältnisses</GruppenTitel>
        <p className="text-h2 font-display font-semibold text-ink-900 leading-none num">
          {engine.beendigungISO?.split('-').reverse().join('.') ?? '–'}
        </p>
        <p className="text-body-s text-ink-600 mt-1.5">
          {engine.gehemmtTage ? `Inkl. ${engine.gehemmtTage} Tage Hemmung durch Sperrfristen (Art. 336c Abs. 2/3 OR).` : 'Keine Hemmung durch Sperrfristen.'}
        </p>
      </div>
    )
  );
}

function eingabeInhalt({ a, set, z }: SeiteCtx<KagAntworten, KagZusammenstellung>, schritt: number) {
  const engine = z.engine;
  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-4">
        <Field label="Arbeitgeberin / Arbeitgeber (Firma)">
          <input className={inputCls} value={a.absenderName} onChange={(e) => set('absenderName', e.target.value)} placeholder="Firma" />
        </Field>
        <Field label="Adresse">
          <input className={inputCls} value={a.absenderAdresse} onChange={(e) => set('absenderAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <Field label="Zeichnungsberechtigte Person" hint="unterschreibt das Schreiben">
          <input className={inputCls} value={a.unterzeichner} onChange={(e) => set('unterzeichner', e.target.value)} placeholder="Vorname Name, Funktion" />
        </Field>
        <Field label="Arbeitnehmerin / Arbeitnehmer">
          <input className={inputCls} value={a.adressatName} onChange={(e) => set('adressatName', e.target.value)} placeholder="Vorname Name" />
        </Field>
        <Field label="Wohnadresse" hint="an die WOHNadresse zustellen — Zugang dort ist massgebend">
          <input className={inputCls} value={a.adressatAdresse} onChange={(e) => set('adressatAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
      </div>
    );

    case 'anstellung': return (
      <div className="space-y-4">
        <Field label="Vertragsbeginn" hint="bestimmt Dienstjahr, gesetzliche Frist und Sperrfrist-Kontingente">
          <DatumsFeld value={a.vertragsbeginn} onChange={(v) => set('vertragsbeginn', v)} className={inputCls} />
        </Field>
        <Field label="Probezeit">
          <select className={inputCls} value={a.probezeit} onChange={(e) => set('probezeit', e.target.value as KagProbezeit)}>
            <option value="keine">Keine Probezeit (vorbei oder wegbedungen)</option>
            <option value="gesetzlich">Gesetzliche Probezeit (1 Monat)</option>
            <option value="vereinbart">Vertraglich verlängert (2–3 Monate)</option>
          </select>
        </Field>
        {a.probezeit === 'vereinbart' && (
          <Field label="Vereinbarte Probezeit (Monate)">
            <input type="number" min={KAG_PROBEZEIT.MIN_MONATE} max={KAG_PROBEZEIT.MAX_MONATE} className={inputCls + ' num sm:max-w-[9rem]'} value={a.probezeitMonate}
              onChange={(e) => set('probezeitMonate', Number(e.target.value))} />
          </Field>
        )}
        <Field label="Kündigungsfrist" hint="abweichende Frist nur bei Schriftform/GAV gültig (Art. 335c Abs. 2 OR)">
          <select className={inputCls} value={a.fristQuelle} onChange={(e) => set('fristQuelle', e.target.value as KagAntworten['fristQuelle'])}>
            <option value="gesetzlich">Gesetzliche Frist (1/2/3 Monate nach Dienstjahr)</option>
            <option value="abweichend">Vertraglich abweichende Frist</option>
          </select>
        </Field>
        {a.fristQuelle === 'abweichend' && (
          <div className="space-y-3">
            <Field label="Abweichende Frist (Monate)">
              <input type="number" min={0} step={0.5} className={inputCls + ' num sm:max-w-[9rem]'} value={a.abweichendeFristMonate}
                onChange={(e) => set('abweichendeFristMonate', Number(e.target.value))} />
            </Field>
            <Checkbox
              checked={a.abweichendeFristFormGueltig}
              onChange={(v) => set('abweichendeFristFormGueltig', v)}
              label={<><span>Schriftlich im Vertrag, NAV oder GAV vereinbart <span className="text-ink-500">(Gültigkeitsvoraussetzung)</span></span></>} />
            <Checkbox
              checked={a.abweichendeFristQuelleGAV}
              onChange={(v) => set('abweichendeFristQuelleGAV', v)}
              label={<><span>Quelle ist ein GAV <span className="text-ink-500">(Verkürzung unter 1 Monat nur durch GAV und nur im 1. Dienstjahr)</span></span></>} />
          </div>
        )}
      </div>
    );

    case 'sperrfristen': return (
      <div className="space-y-4">
        <p className="text-body-s text-ink-700">
          Krankheit, Unfall, Schwangerschaft, Dienstpflichten und die weiteren Tatbestände von{' '}
          <NormLink artikel="Art. 336c OR" /> sperren die Arbeitgeber-Kündigung. Erfassen Sie alle
          bekannten Ereignisse — die Prüfung (nichtig / gehemmt) läuft live.
        </p>
        <SperrereignisseEditor wert={a.sperrereignisse} onChange={(liste) => set('sperrereignisse', liste)} />
        {/* RL-16b Nachzug (Gegenprüfung Runde 2): Arbeitstage für die
            Probezeitverlängerung nach Art. 335b Abs. 3 OR — Muster der
            Schwesterformulare (nur sichtbar, wenn eine Probezeit besteht). */}
        {a.probezeit !== 'keine' && (
          <Field label="Arbeitstage pro Woche" hint="Für die Verlängerung der Probezeit bei Krankheit, Unfall oder Dienstpflicht (Art. 335b Abs. 3 OR)">
            <ArbeitstageFeld wert={a.arbeitstageWoche} onChange={(t) => set('arbeitstageWoche', t)} />
          </Field>
        )}
        {statusKachel(a, engine)}
        {/* Prefill-Brücke 2.1c: derselbe Fall im Rechner (Zeitstrahl,
            Sperrtage-Kontingente, PDF-Rechenbericht) — Eingaben reisen mit. */}
        <p className="text-xs text-ink-500">
          Vertiefte Analyse (Zeitstrahl, Kontingente):{' '}
          <Link
            to={sperrfristenLink({
              vertragsbeginn: a.vertragsbeginn || undefined,
              zugangKuendigung: a.zugangKuendigung || undefined,
              kuendigendePartei: 'arbeitgeber',
              probezeitMonate: a.probezeit === 'keine' ? 0 : a.probezeit === 'gesetzlich' ? 1 : a.probezeitMonate,
              abweichendeFristMonate: a.fristQuelle === 'abweichend' ? a.abweichendeFristMonate : undefined,
              abweichendeFristFormGueltig: a.fristQuelle === 'abweichend' ? a.abweichendeFristFormGueltig : undefined,
              abweichendeFristQuelleGAV: a.fristQuelle === 'abweichend' ? a.abweichendeFristQuelleGAV : undefined,
              kuendigungsterminMonatsende: a.kuendigungsterminMonatsende,
              vaterschaftsurlaubResttage: a.vaterschaftsurlaubResttage > 0 ? a.vaterschaftsurlaubResttage : undefined,
              sperrereignisse: a.sperrereignisse,
              arbeitstageWoche: a.arbeitstageWoche,
            })}
            className="text-brass-700 underline">
            Sperrfristen-Rechner (vorbefüllt) öffnen
          </Link>
        </p>
        {engine?.sperrtage && engine.sperrtage.length > 0 && <SperrtageZaehler sperrtage={engine.sperrtage} />}
      </div>
    );

    case 'termin': return (
      <div className="space-y-4">
        <Field label="Erwarteter Zugang der Kündigung" hint="Stichtag für Dienstjahr, Frist UND Sperrfrist-Prüfung">
          <DatumsFeld value={a.zugangKuendigung} onChange={(v) => set('zugangKuendigung', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.kuendigungsterminMonatsende}
          onChange={(v) => set('kuendigungsterminMonatsende', v)}
          label={<><span>Kündigungstermin ist das Monatsende <span className="text-ink-500"><NormText text={`(gesetzlicher Regelfall, Art. 335c Abs. 1 OR)`} /></span></span></>} />
        <Field label="Nicht bezogene Tage Urlaub des andern Elternteils" optional hint="Art. 335c Abs. 3 i.V.m. Art. 329g OR (vormals Vaterschaftsurlaub), verlängern die Frist taggenau">
          <input type="number" min={0} className={inputCls + ' num sm:max-w-[9rem]'} value={a.vaterschaftsurlaubResttage}
            onChange={(e) => set('vaterschaftsurlaubResttage', Math.max(0, Number(e.target.value)))} />
        </Field>
        {statusKachel(a, engine)}
        <div className="lc-notice text-body-s">{KDG_ZUGANGS_HINWEIS}</div>
      </div>
    );

    case 'inhalt': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.begruendungAufnehmen}
          onChange={(v) => set('begruendungAufnehmen', v)}
          label={<><span>Begründung ins Schreiben aufnehmen
              <span className="text-warn-700"><NormText text={` — rechtlich nur auf Verlangen geschuldet (Art. 335 Abs. 2 OR); frühe Festlegung kann die Verteidigung gegen einen Missbrauchsvorwurf erschweren`} /></span></span></>} />
        {a.begruendungAufnehmen && (
          <Field label="Begründung (Freitext)" hint="Würdigung des Einzelfalls — LexMetrik formuliert hier bewusst nicht vor">
            <textarea className={inputCls + ' min-h-[6rem]'} value={a.begruendungText}
              onChange={(e) => set('begruendungText', e.target.value)} />
          </Field>
        )}
        <Checkbox
          checked={a.freistellung}
          onChange={(v) => set('freistellung', v)}
          label={<><span>Freistellung bis zum Austritt aussprechen <span className="text-ink-500"><NormText text={`(Lohn läuft weiter; anderweitiger Erwerb wird angerechnet, Art. 324 OR)`} /></span></span></>} />
        {a.freistellung && (
          <Field label="Freistellung ab">
            <DatumsFeld value={a.freistellungAb} onChange={(v) => set('freistellungAb', v)} className={inputCls} />
          </Field>
        )}
      </div>
    );
  }
}

function fehlerEingabe(a: KagAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.absenderName.trim()) f.push('Arbeitgeberin/Arbeitgeber angeben (Firma).');
    if (!a.absenderAdresse.trim()) f.push('Adresse der Arbeitgeberin/des Arbeitgebers angeben.');
    if (!a.unterzeichner.trim()) f.push('Zeichnungsberechtigte Person angeben.');
    if (!a.adressatName.trim()) f.push('Arbeitnehmerin/Arbeitnehmer angeben.');
    if (!a.adressatAdresse.trim()) f.push('WOHNadresse der Arbeitnehmerin/des Arbeitnehmers angeben (Zustellung!).');
  }
  if (schritt === 1) {
    if (!istIsoDatum(a.vertragsbeginn)) f.push('Vertragsbeginn angeben (für Dienstjahr und Probezeit).');
    if (a.probezeit === 'vereinbart' && (a.probezeitMonate < KAG_PROBEZEIT.MIN_MONATE || a.probezeitMonate > KAG_PROBEZEIT.MAX_MONATE)) f.push(`Vereinbarte Probezeit: ${KAG_PROBEZEIT.MIN_MONATE}–${KAG_PROBEZEIT.MAX_MONATE} Monate (${KAG_PROBEZEIT.NORM}).`);
  }
  if (schritt === 2) {
    a.sperrereignisse.forEach((e, j) => { if (e.bis < e.von) f.push(`Sperrereignis ${j + 1}: «Bis» liegt vor «Von».`); });
  }
  if (schritt === 3) {
    if (!istIsoDatum(a.zugangKuendigung)) f.push('Erwarteten Zugang der Kündigung angeben (Stichtag für Frist UND Sperrfrist-Prüfung).');
  }
  if (schritt === 4) {
    // Bug-Check A (NIEDRIG): Freistellung ohne Datum erzeugte «ab ________».
    if (a.freistellung && !istIsoDatum(a.freistellungAb)) f.push('Freistellungs-Beginn angeben (oder Freistellung abwählen).');
  }
  return f;
}

const CONFIG: VorlagenSeitenConfig<KagAntworten, KagZusammenstellung> = {
  cardId: 'kuendigung-arbeitgeber',
  musterdaten: MUSTER['kuendigung-arbeitgeber'],
  defaults: KAG_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  // Array-Hydration absichern (Konvention der übrigen Wizards; Bug-Check
  // A 6.6.2026: hand-/fremdeditiertes sperrereignisse:null crashte sonst).
  normalisieren: (g) => ({
    ...g,
    sperrereignisse: Array.isArray(g.sperrereignisse) ? g.sperrereignisse : [],
    // RL-16b: ungültiger Speicherstand → Feld fehlt → Engine rechnet Mo–Fr
    // und warnt «nicht angegeben» (kein stilles Umdeuten, §8).
    arbeitstageWoche: istGueltigeArbeitstage(g.arbeitstageWoche) ? g.arbeitstageWoche : undefined,
  }),
  // Absender ist die Firma, nicht die nutzende Person — kein Profil-Prefill
  // (Ist-Zustand vor dem Umzug, §6).
  profilPrefill: false,
  zusammenstellen: kagZusammenstellen,
  pruefeGates: (a, z) => pruefeKagGates(a, z.engine),
  schritte: SCHRITTE,
  overlineFallback: 'Arbeit',
  titel: 'Kündigung durch Arbeitgeber:in',
  intro: 'Stellt das Kündigungsschreiben aus festen Bausteinen zusammen und prüft live die Sperrfristen nach Art. 336c OR: Fällt der Zugang in eine Sperrfrist, ist der Export gesperrt (die Kündigung wäre nichtig); Hemmung und Erstreckung fliessen ins Beendigungsdatum ein. Ohne Sprachmodell: gleiche Eingaben, gleiches Dokument.',
  badge: 'Zu unterzeichnen',
  eingabeInhalt,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: die Blocker stehen im eigenen «Export
  // gesperrt»-Kasten und sperren den Export, nicht die Fehlerbox (§6).
  blockerImLetztenSchritt: false,
  blockerKasten: true,
  ortDatumLabel: 'Ort und Datum der Erklärung',
  ortPlaceholder: 'z. B. Basel',
  ortFehler: 'Ort angeben.',
  datumFehler: 'Datum der Erklärung angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Damit die Kündigung trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
        <li><strong>An die Wohnadresse zustellen</strong> — eingeschrieben und zusätzlich per A-Post; der Zugang dort entscheidet über Frist UND Sperrfristen.</li>
        <li><strong>Sperrfristen erneut bedenken:</strong> Erkrankt die Person VOR dem Zugang, kann die Kündigung trotz heutiger Prüfung nichtig werden — im Zweifel Zugang dokumentieren.</li>
        <li><strong>Begründung nur auf Verlangen</strong><NormText text={` schriftlich nachliefern (Art. 335 Abs. 2 OR).`} /></li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Die Sperrfrist-Prüfung beruht auf den erfassten Ereignissen — nicht erfasste oder künftige Ereignisse kann sie nicht berücksichtigen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  banner: BANNER_KAG,
  dateiBasis: 'Kuendigung-Arbeitgeber',
  pdfLabel: 'Kündigung als PDF',
  docxLabel: 'Kündigung als Word (DOCX)',
};

export function VorlageKuendigungArbeitgeber() {
  return <VorlagenSeite config={CONFIG} />;
}
