import { Field, inputCls, ListenEditor } from '../vorlagen/ui';
import { NormText } from '../NormText';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { useState } from 'react';
import type { ArbeitsrechtInput, Kanton, SperrereignisTyp, Sperrereignis } from '../../types/legal';
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

const TYPEN: { code: SperrereignisTyp; label: string }[] = [
  { code: 'krankheit_unfall',  label: 'Krankheit / Unfall (lit. b)' },
  { code: 'schwangerschaft',   label: 'Schwangerschaft (lit. c)' },
  { code: 'mutterschaftsurlaub_verlaengert', label: 'Verlängerter Mutterschaftsurlaub (lit. cbis)' },
  { code: 'zusatzurlaub_tod_elternteil',     label: 'Zusatzurlaub Tod des anderen Elternteils (lit. cter)' },
  { code: 'urlaub_tod_mutter',               label: 'Urlaub nach Tod der Mutter (lit. cquinquies)' },
  { code: 'militaer_zivil',    label: 'Militär / Zivildienst (lit. a)' },
  { code: 'hilfsaktion',       label: 'Hilfsaktion (lit. d)' },
  { code: 'betreuungsurlaub',  label: 'Betreuungsurlaub (lit. cquater, Art. 329i)' },
];

// Typen mit optionalem Niederkunftsdatum (Endberechnung lit. c / Kappung lit. cter).
const MIT_NIEDERKUNFT: SperrereignisTyp[] = ['schwangerschaft', 'zusatzurlaub_tod_elternteil'];


const DEFAULTS: ArbeitsrechtInput = {
  vertragsbeginn: '2020-01-01',
  zugangKuendigung: '2025-04-15',
  kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 1,
  kuendigungsterminMonatsende: true,
  verhinderungBeginn: '2025-04-01',
  arbeitsunfaehigkeitProzent: 100,
  kanton: 'BS',
  ktgGleichwertigVorhanden: false,
  sperrereignisse: [],
};

export function KombinierteAnsicht() {
  // Standard-Kanton (Einstellungen) als Default – konsistent zu den
  // Schwesterformularen (Auftrag David); DEFAULTS.kanton ist nur Fallback.
  const [form, setForm] = useState<ArbeitsrechtInput>(() => ({ ...DEFAULTS, kanton: getStandardKanton() }));
  const pk = usePaneKlasse();

  const set = <K extends keyof ArbeitsrechtInput>(k: K, v: ArbeitsrechtInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addEreignis = () =>
    setForm((f) => ({
      ...f,
      sperrereignisse: [...(f.sperrereignisse ?? []), { typ: 'krankheit_unfall', von: '2025-04-01', bis: '2025-05-31' }],
    }));

  const updateEreignis = (i: number, field: keyof Sperrereignis, val: string) =>
    setForm((f) => {
      const list = [...(f.sperrereignisse ?? [])];
      list[i] = { ...list[i], [field]: val } as Sperrereignis;
      return { ...f, sperrereignisse: list };
    });

  const removeEreignis = (i: number) =>
    setForm((f) => ({
      ...f,
      sperrereignisse: (f.sperrereignisse ?? []).filter((_, j) => j !== i),
    }));

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
      </div>

      {/* Sperrereignisse */}
      <div className="space-y-3">
        <h4 className="text-body-s font-semibold text-ink-700"><NormText text={`Sperrereignisse (Art. 336c OR)`} /></h4>
        {/* R2-F/F1-9: nur der Repeater-Container wandert auf den geteilten
            ListenEditor — die Hinweisbox weiter unten ist bereits
            `lc-notice-danger` und bleibt unberührt. Die vier rohen `<label>`
            sind `Field` gewichen; damit trägt «Niederkunft» sein «optional» in
            der Prop (F1-6-Rest: der R2-E-Wächter liest nur `<Field label=…>`
            und sah diese Stelle deshalb nicht). */}
        <ListenEditor
          element="Ereignis"
          eintraege={form.sperrereignisse ?? []}
          onHinzufuegen={addEreignis}
          onEntfernen={removeEreignis}
          kinder={(e, i) => (
            <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3 items-end', 'grid grid-cols-1 @3xl/pane:grid-cols-3 gap-3 items-end')}>
              <Field label="Typ">
                <select value={e.typ} onChange={(ev) => updateEreignis(i, 'typ', ev.target.value)} className={inputCls + ' text-xs'}>
                  {TYPEN.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </Field>
              {/* B5-Fix 10.6.2026 (SHK-Abgleich): Die 6-Monats-Kappung des
                  Art. 329i OR läuft ab Beginn der RAHMENFRIST, nicht zwingend
                  ab Urlaubsbeginn — das Eingabefeld muss das verlangen. */}
              <Field label={e.typ === 'betreuungsurlaub' ? 'Von (Beginn der Rahmenfrist)' : 'Von'}>
                <DatumsFeld value={e.von} onChange={(v) => updateEreignis(i, 'von', v)} className={inputCls + ' text-xs'} />
              </Field>
              <Field label="Bis">
                <DatumsFeld value={e.bis} onChange={(v) => updateEreignis(i, 'bis', v)} className={inputCls + ' text-xs'} />
              </Field>
              {MIT_NIEDERKUNFT.includes(e.typ) && (
                <Field label="Niederkunft" optional>
                  <DatumsFeld value={e.niederkunft ?? ''} onChange={(v) => updateEreignis(i, 'niederkunft', v)} className={inputCls + ' text-xs'} />
                </Field>
              )}
            </div>
          )}
        />
      </div>

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
