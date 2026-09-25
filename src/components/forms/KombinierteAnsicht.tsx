import { Checkbox, Field, inputCls } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { useState } from 'react';
import type { ArbeitsrechtInput, Kanton } from '../../types/legal';
import { berechneLohnfortzahlung } from '../../lib/lohnfortzahlung';
import { berechneSperrfristen, type SperrfristenErgebnis } from '../../lib/sperrfristen';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { FristenKalender } from '../FristenKalender';
import { KuendigungTimeline } from '../KuendigungTimeline';
import { SperrtageZaehler } from '../SperrtageZaehler';
import { KANTONE } from '../../lib/kantone';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';
import { SperrereignisseEditor } from './SperrereignisseEditor';
import { ArbeitstageFeld } from './ArbeitstageFeld';
import { arbeitstageText, STANDARD_ARBEITSTAGE } from '../../lib/kuendigungsfristProbezeit';

// RL-13 PR 2 (UI-05, §5/§10): die frühere Kopie des Typen-Katalogs und des
// Sperrereignis-Repeaters ist dem geteilten SperrereignisseEditor gewichen
// (Katalog: sperrereignisseShared.ts). Damit trägt auch diese Ansicht den
// Rückfall-Bezug, die Bezugs-Pflege beim Entfernen/Typwechsel und die
// Niederkunfts-Felder aus EINER Quelle.

const DEFAULTS: ArbeitsrechtInput = {
  vertragsbeginn: '2020-01-01',
  zugangKuendigung: '2025-04-15',
  kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 1,
  kuendigungsterminMonatsende: true,
  // wie KuendigungSperrForm: wirkt erst, wenn eine abweichende Frist erfasst ist
  abweichendeFristFormGueltig: true,
  verhinderungBeginn: '2025-04-01',
  arbeitsunfaehigkeitProzent: 100,
  kanton: 'BS',
  ktgGleichwertigVorhanden: false,
  // RL-16b: Standard Mo–Fr (Art. 335b Abs. 3 OR, BGE 148 III 126)
  arbeitstageWoche: [1, 2, 3, 4, 5],
  sperrereignisse: [],
};

export function KombinierteAnsicht({ startwerte }: {
  /** Vorbelegung (Render-Tests, spätere Permalinks); überschreibt die Demo-DEFAULTS. */
  startwerte?: Partial<ArbeitsrechtInput>;
} = {}) {
  // Standard-Kanton (Einstellungen) als Default – konsistent zu den
  // Schwesterformularen (Auftrag David); DEFAULTS.kanton ist nur Fallback.
  const [form, setForm] = useState<ArbeitsrechtInput>(() => ({ ...DEFAULTS, kanton: getStandardKanton(), ...startwerte }));
  const pk = usePaneKlasse();

  const set = <K extends keyof ArbeitsrechtInput>(k: K, v: ArbeitsrechtInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Live-Berechnung – B+C als EIN kohärentes Ergebnis (Sperrfristen integrieren die Kündigungsfrist).
  const ergebnisse: { lohnfortzahlung?: ReturnType<typeof berechneLohnfortzahlung>; kuendigung?: SperrfristenErgebnis } = {};
  try {
    if (form.verhinderungBeginn) {
      ergebnisse.lohnfortzahlung = berechneLohnfortzahlung({
        vertragsbeginn: form.vertragsbeginn,
        verhinderungBeginn: form.verhinderungBeginn,
        arbeitsunfaehigkeitProzent: form.arbeitsunfaehigkeitProzent ?? 100,
        kanton: form.kanton ?? getStandardKanton(),
        ktgGleichwertigVorhanden: form.ktgGleichwertigVorhanden ?? false,
        monatslohnBrutto: form.monatslohnBrutto,
      });
    }
    ergebnisse.kuendigung = berechneSperrfristen(form);
  } catch { /* unvollständige Eingabe – Ergebnis ausgelassen */ }

  const abschnitte = [
    ...(ergebnisse.lohnfortzahlung ? [{ titel: 'Lohnfortzahlung (Art. 324a OR)', ergebnis: ergebnisse.lohnfortzahlung }] : []),
    ...(ergebnisse.kuendigung ? [{ titel: 'Kündigung & Sperrfristen (Art. 335c / 336c OR)', ergebnis: ergebnisse.kuendigung }] : []),
  ];

  const eingaben = {
    'Vertragsbeginn': form.vertragsbeginn,
    'Zugang Kündigung': form.zugangKuendigung,
    'Kündigende Partei': form.kuendigendePartei === 'arbeitgeber' ? 'Arbeitgeber' : 'Arbeitnehmer',
    'Beginn Verhinderung': form.verhinderungBeginn ?? '',
    'AUF %': String(form.arbeitsunfaehigkeitProzent ?? 100),
    'Kanton': form.kanton ?? '',
    'Kündigungstermin Monatsende': form.kuendigungsterminMonatsende ? 'Ja' : 'Nein',
    ...(form.probezeitMonate > 0 ? { 'Arbeitstage pro Woche': arbeitstageText(form.arbeitstageWoche ?? STANDARD_ARBEITSTAGE) } : {}),
    ...(form.abweichendeFristMonate != null ? { 'Abweichende Frist (Monate)': String(form.abweichendeFristMonate) } : {}),
    ...(form.kuendigendePartei === 'arbeitgeber' && form.vaterschaftsurlaubResttage
      ? { 'Nicht bezogene Tage Art. 329g': String(form.vaterschaftsurlaubResttage) } : {}),
  };

  // PDF: Skalen-Hinweis nur, wenn die Lohnfortzahlung Teil des Berichts ist.
  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Arbeitsrechtliche Orientierungsberechnung (kombiniert)',
    domain: 'arbeitsrecht',
    fileBase: 'Arbeitsrecht-Kombiniert',
    inputs: eingaben,
    sections: abschnitte,
    disclaimer:
      'Automatisierte Orientierungsberechnung (Art. 324a / 335c / 336c OR) – keine Rechtsberatung. ' +
      'Massgeblich sind GAV, Einzelvertrag, Versicherungspolice und der konkrete Sachverhalt; abweichende ' +
      'Regelungen gehen vor. Norm- und Rechtsprechungsverweise sind im Einzelfall zu prüfen.' +
      (ergebnisse.lohnfortzahlung
        ? ' Die Lohnfortzahlungsskalen sind Gerichtspraxis und vor Produktiveinsatz gegen die aktuelle kantonale Praxis abzugleichen.'
        : ''),
  };

  return (
    <div className="space-y-6">
      <PflichtDisclaimer
        kurz="Drei Teilberechnungen (Lohnfortzahlung · Kündigungsfrist · Sperrfristen) mit gemeinsamen Eingaben; Stichtage je Modul verschieden." />
      {/* R2-E/F1-8: neutrale Hinweisbox = `lc-notice` (R11), nicht `lc-panel`.
          `lc-panel` ist der Behälter für Gruppen von Bedienelementen (unten der
          Sperrereignis-Repeater), `lc-notice` die Hinweis-Tonalität — und
          weiter unten trägt genau diese Datei schon zwei `lc-notice`-Boxen.
          Wortlaut unverändert. */}
      <div className="lc-notice">
        <p className="text-body-s text-ink-600">
          Kombinierte Ansicht: Alle drei Teilberechnungen (A/B/C) mit gemeinsamen Eingaben.
          Stichtage sind je Modul unterschiedlich – details im Rechenweg.
        </p>
      </div>

      <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
        <div className={pk('sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4', '@xl/pane:col-span-3 grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
          {/* R2-E/F1-2: dieselbe `Field`-Anatomie wie in den Schwester-Formularen
              statt handgesetzter, unverknüpfter <label>-Elemente. Die Optik ist
              identisch (Field rendert genau diese Klassen); NEU ist die
              programmatische Verknüpfung — beim zusammengesetzten DatumsFeld
              per aria-labelledby, bei den nativen Controls per htmlFor. */}
          <Field label="Vertragsbeginn">
            <DatumsFeld value={form.vertragsbeginn} onChange={(v) => set('vertragsbeginn', v)} className={inputCls} />
          </Field>
          <Field label={<>Zugang Kündigung <span className="text-ink-500 font-normal">(Stichtag B/C)</span></>}>
            <DatumsFeld value={form.zugangKuendigung} onChange={(v) => set('zugangKuendigung', v)} className={inputCls} />
          </Field>
          <Field label={<>Beginn Verhinderung <span className="text-ink-500 font-normal">(Stichtag A)</span></>}>
            <DatumsFeld value={form.verhinderungBeginn ?? ''} onChange={(v) => set('verhinderungBeginn', v)} className={inputCls} />
          </Field>
        </div>

        <Field label="Kündigende Partei">
          <select value={form.kuendigendePartei} onChange={(e) => set('kuendigendePartei', e.target.value as 'arbeitgeber' | 'arbeitnehmer')} className={inputCls}>
            <option value="arbeitgeber">Arbeitgeber</option>
            <option value="arbeitnehmer">Arbeitnehmer</option>
          </select>
        </Field>

        <Field label="Kanton">
          <select value={form.kanton ?? getStandardKanton()} onChange={(e) => set('kanton', e.target.value as Kanton)} className={inputCls}>
            {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>

        <Field label="AUF % (Lohnfortzahlung)">
          <input type="number" inputMode="decimal" min={1} max={100} value={form.arbeitsunfaehigkeitProzent ?? 100} onChange={(e) => set('arbeitsunfaehigkeitProzent', Number(e.target.value))} className={inputCls} />
        </Field>

        <Field label="Probezeit (Monate)">
          <input type="number" inputMode="decimal" min={0} max={3} value={form.probezeitMonate} onChange={(e) => set('probezeitMonate', Number(e.target.value))} className={inputCls} />
        </Field>

        {/* RL-16b (W-08 b): Arbeitstage für die Probezeitverlängerung nach
            Art. 335b Abs. 3 OR — nur sichtbar, wenn eine Probezeit besteht. */}
        {form.probezeitMonate > 0 && (
          <Field label="Arbeitstage pro Woche" hint="Für die Verlängerung der Probezeit bei Krankheit, Unfall oder Dienstpflicht (Art. 335b Abs. 3 OR)">
            <ArbeitstageFeld wert={form.arbeitstageWoche} onChange={(t) => set('arbeitstageWoche', t)} />
          </Field>
        )}

        {/* RL-13 PR 2 (UI-05): Die Engine las Monatsende, abweichende Frist und
            die nicht bezogenen Tage Art. 329g schon immer aus demselben Input —
            die Ansicht bot sie nur nicht an (Monatsende fest «Ja», die beiden
            anderen nie gesetzt). Wortlaut der Felder wie im Sperrfristen-Rechner. */}
        <Field label="Kündigungstermin">
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2.5 py-1.5 text-body-s cursor-pointer">
              <input type="radio" name="kterm-kombi" checked={form.kuendigungsterminMonatsende} onChange={() => set('kuendigungsterminMonatsende', true)} />
              Monatsende (Standard)
            </label>
            <label className="flex items-center gap-2.5 py-1.5 text-body-s cursor-pointer">
              <input type="radio" name="kterm-kombi" checked={!form.kuendigungsterminMonatsende} onChange={() => set('kuendigungsterminMonatsende', false)} />
              Freies Datum
            </label>
          </div>
        </Field>

        <Field label="Abweichende Frist (Monate)" optional hint="§3.2 schriftlich/GAV; ≥ 1 Monat gilt (auch kürzer)">
          <input
            type="number" inputMode="decimal" min={0} step={0.5}
            value={form.abweichendeFristMonate ?? ''}
            onChange={(e) => set('abweichendeFristMonate', e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls}
            placeholder="Leer = gesetzliche Frist"
          />
        </Field>

        {form.abweichendeFristMonate != null && (
          <Field label="Abweichende Frist – Gültigkeit (§3.2)">
            <div className="flex flex-col gap-2 pt-1">
              <Checkbox checked={form.abweichendeFristFormGueltig ?? false}
                onChange={(v) => set('abweichendeFristFormGueltig', v)}
                label="Schriftlich / GAV / NAV (Gültigkeitsvoraussetzung)" />
              <Checkbox checked={form.abweichendeFristQuelleGAV ?? false}
                onChange={(v) => set('abweichendeFristQuelleGAV', v)}
                label="Quelle GAV (Verkürzung < 1 Monat nur GAV & 1. DJ)" />
            </div>
          </Field>
        )}

        {form.kuendigendePartei === 'arbeitgeber' && (
          <Field label="Urlaub des andern Elternteils (Art. 329g) – nicht bezogene Tage" optional hint="Art. 335c Abs. 3 OR (vormals Vaterschaftsurlaub), verlängert die Frist taggenau">
            <input
              type="number" inputMode="decimal" min={0} step={1}
              value={form.vaterschaftsurlaubResttage ?? ''}
              onChange={(e) => set('vaterschaftsurlaubResttage', e.target.value ? Number(e.target.value) : undefined)}
              className={inputCls}
              placeholder="0"
            />
          </Field>
        )}
      </div>

      {/* Sperrereignisse — geteilter Editor (RL-13 PR 2, §10) */}
      <SperrereignisseEditor
        wert={form.sperrereignisse ?? []}
        onChange={(liste) => set('sperrereignisse', liste)}
        hinweis={form.kuendigendePartei === 'arbeitnehmer' ? 'nur bei Arbeitgeberkündigung relevant' : undefined}
      />

      <ErgebnisBlock>
      {ergebnisse.kuendigung?.status === 'nichtig' && (
        <div role="alert" className="lc-notice-danger">
          <p className="lc-overline text-danger-700 mb-1">Kündigung nichtig</p>
          <p className="text-body-s text-danger-700">
            Der Zugang der Kündigung fällt in eine Sperrfrist – die Kündigung ist nichtig und entfaltet keine Wirkung.
            Sie ist nach Ablauf der Sperrfrist/Verhinderung zu wiederholen (Details unten).
          </p>
        </div>
      )}

      {(form.sperrereignisse ?? []).length > 0 && (ergebnisse.lohnfortzahlung || ergebnisse.kuendigung) && (
        <div className="lc-notice">
          {/* LM-101-Muster: Buchstabenzusätze (336c/324a) dürfen die uppercase-Overline nicht durchlaufen. */}
          <p className="lc-overline mb-1">Querverbindung: <span className="normal-case">Art. 336c ↔ Art. 324a</span></p>
          <p className="text-body-s text-ink-600">
            Sperrfrist/Hemmung (Art. 336c OR) und Lohnfortzahlung (Art. 324a OR) sind <strong>voneinander unabhängig</strong>:
            Modul A bestimmt die Lohn-Dauer, die Sperrfrist die Gültigkeit/Verlängerung der Kündigung. Für die gehemmte/verlängerte
            Kündigungsfrist besteht <strong>nicht automatisch</strong> ein Lohnanspruch (BGE 115 V 437, zu verifizieren).
          </p>
        </div>
      )}

      <div className="space-y-4">
        {ergebnisse.lohnfortzahlung && (
          <ErgebnisAnzeige titel="A – Lohnfortzahlung (Art. 324a OR)" ergebnis={ergebnisse.lohnfortzahlung} />
        )}
        {ergebnisse.lohnfortzahlung?.status === 'ok' && ergebnisse.lohnfortzahlung.zeitraumVonISO && ergebnisse.lohnfortzahlung.letzterTagISO && (
          <FristenKalender
            ereignisISO={ergebnisse.lohnfortzahlung.zeitraumVonISO}
            aQuoISO={ergebnisse.lohnfortzahlung.zeitraumVonISO}
            adQuemISO={ergebnisse.lohnfortzahlung.letzterTagISO}
            kanton={form.kanton ?? getStandardKanton()}
            stillstandAktiv={false}
            feiertage={false}
            labels={{ ereignis: 'Beginn der Verhinderung', aquo: 'Beginn der Verhinderung', adquem: 'Letzter bezahlter Tag', band: 'bezahlter Zeitraum' }}
          />
        )}
        {ergebnisse.kuendigung && (
          <ErgebnisAnzeige titel="B+C – Kündigung & Sperrfristen (Art. 335c / 336c OR)" ergebnis={ergebnisse.kuendigung} />
        )}
        {ergebnisse.kuendigung && <KuendigungTimeline e={ergebnisse.kuendigung} />}
        {ergebnisse.kuendigung?.sperrtage && ergebnisse.kuendigung.sperrtage.length > 0 && (
          <SperrtageZaehler sperrtage={ergebnisse.kuendigung.sperrtage} />
        )}
        <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig} />
      </div>
      </ErgebnisBlock>
    </div>
  );
}
