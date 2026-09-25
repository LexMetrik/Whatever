import { BeruehrtRahmen, Checkbox, FehlerBox, Field, inputCls } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { useEffect, useState } from 'react';
import type { SperrfristenInput } from '../../types/legal';
import { berechneSperrfristen, type SperrfristenErgebnis } from '../../lib/sperrfristen';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, permalinkLesen } from '../../lib/permalink';
import { KSP_LINK_SPEC } from '../../lib/rechnerPermalinks';
import { KuendigungTimeline } from '../KuendigungTimeline';
import { SperrtageZaehler } from '../SperrtageZaehler';
import { SperrereignisseEditor } from './SperrereignisseEditor';
import { ArbeitstageFeld } from './ArbeitstageFeld';
import { arbeitstageText, STANDARD_ARBEITSTAGE } from '../../lib/kuendigungsfristProbezeit';
import { usePaneKlasse } from '../layout/PaneKontext';
import { datumOderStrich } from '../ui/datumText';


// EIN Wortlaut für Bildschirm-Disclaimer und PDF (§5).
const KSP_DISCLAIMER =
  'Automatisierte Orientierungsberechnung zu Kündigungs- und Sperrfristen (Art. 335c / 336c OR) – ' +
  'keine Rechtsberatung. Massgeblich sind GAV, Einzelvertrag und der konkrete Sachverhalt; abweichende ' +
  'Regelungen gehen vor. Norm- und Rechtsprechungsverweise sind im Einzelfall zu prüfen.';

const DEFAULTS: SperrfristenInput = {
  vertragsbeginn: '2020-01-01',
  zugangKuendigung: '2025-04-15',
  kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 1,
  kuendigungsterminMonatsende: true,
  abweichendeFristFormGueltig: true,
  // RL-16b: Standard Mo–Fr (Art. 335b Abs. 3 OR, BGE 148 III 126)
  arbeitstageWoche: [1, 2, 3, 4, 5],
  sperrereignisse: [],
};

// §6 Eingabevalidierung
function validiere(f: SperrfristenInput): string[] {
  const fehler: string[] = [];
  if (f.zugangKuendigung < f.vertragsbeginn) fehler.push('Zugang der Kündigung liegt vor dem Vertragsbeginn.');
  (f.sperrereignisse ?? []).forEach((e, i) => {
    if (e.bis < e.von) fehler.push(`Sperrereignis ${i + 1}: «Bis» liegt vor «Von».`);
  });
  return fehler;
}

// Typen-Katalog + Editor-Markup leben seit 6.6.2026 im geteilten
// SperrereignisseEditor (§10) — genutzt auch von der Vorlagen-Maske
// «Kündigung durch Arbeitgeber:in».

export function KuendigungSperrForm({ onBeendigung }: {
  /** S-5c: meldet das (sperrfristen-verschobene) Beendigungsdatum der
   *  AG-Kündigung an die Seite — sie füllt damit den Ereignis-Block
   *  «336b-Fristen» vor (ersetzt die alte Fristenspiegel-Brücke). */
  onBeendigung?: (iso: string | null) => void;
} = {}) {
  const [form, setForm] = useState<SperrfristenInput>(() => {
    try { return { ...DEFAULTS, ...permalinkLesen(KSP_LINK_SPEC, window.location.search) }; }
    catch { return DEFAULTS; }
  });
  // Bug-Check §9 10.6.2026 (Code-Lupe, MITTEL): Die Demo-DEFAULTS rechnen
  // ab Mount ein Beendigungsdatum — das darf eine per Alt-Link
  // (?ev=agkuendigung&zu=…) hydratisierte 336b-Zustellung NICHT
  // überschreiben. Gemeldet wird erst, wenn der Nutzer die Form berührt
  // hat oder sie aus einem eigenen KSP-Permalink stammt.
  const [beruehrt, setBeruehrt] = useState<boolean>(() => {
    try { return Object.keys(permalinkLesen(KSP_LINK_SPEC, window.location.search)).length > 0; }
    catch { return false; }
  });

  const pk = usePaneKlasse();

  const set = <K extends keyof SperrfristenInput>(k: K, v: SperrfristenInput[K]) => {
    setBeruehrt(true);
    setForm((f) => ({ ...f, [k]: v }));
  };

  // Live-Berechnung – EIN kohärentes Ergebnis (Kündigungsfrist inkl. Sperrfristen).
  const fehler = validiere(form);
  let gesamt: SperrfristenErgebnis | null = null;
  if (fehler.length === 0) {
    try { gesamt = berechneSperrfristen(form); } catch { gesamt = null; }
  }
  const hatEreignisse = (form.sperrereignisse ?? []).length > 0;

  const beendigungFuer336b = beruehrt && gesamt && gesamt.status !== 'nichtig'
    && form.kuendigendePartei === 'arbeitgeber' ? gesamt.beendigungISO ?? null : null;
  useEffect(() => { onBeendigung?.(beendigungFuer336b); }, [beendigungFuer336b, onBeendigung]);

  const eingaben = {
    'Vertragsbeginn': form.vertragsbeginn,
    'Zugang Kündigung': form.zugangKuendigung,
    'Kündigende Partei': form.kuendigendePartei === 'arbeitgeber' ? 'Arbeitgeber' : 'Arbeitnehmer',
    'Probezeit (Monate)': String(form.probezeitMonate),
    'Kündigungstermin Monatsende': form.kuendigungsterminMonatsende ? 'Ja' : 'Nein',
    ...(form.probezeitMonate > 0 ? { 'Arbeitstage pro Woche': arbeitstageText(form.arbeitstageWoche ?? STANDARD_ARBEITSTAGE) } : {}),
    ...(form.abweichendeFristMonate != null ? { 'Abweichende Frist (Monate)': String(form.abweichendeFristMonate) } : {}),
  };

  // PDF: Kündigungs-/Sperrfristen-Disclaimer (GAV einschlägig, Lohnfortzahlungsskalen NICHT).
  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  // Geteilte Permalink-Closure für «Link teilen» UND Kalender-Eintrag (§5).
  const kspQuery = () => permalinkKodieren(KSP_LINK_SPEC, form as SperrfristenInput & Record<string, unknown>);
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Kündigungs- und Sperrfristen',
    rechtsgrundlage: 'Berechnung nach Art. 335c / 336c OR',
    domain: 'arbeitsrecht',
    fileBase: 'Kuendigung-Sperrfristen',
    inputs: eingaben,
    // Ergebnis-Hero aus bereits berechneten Werten (Generik-Gegenprüfung)
    hero: gesamt ? (gesamt.status === 'nichtig'
      ? {
          hauptlabel: 'Frühestens neu kündbar',
          hauptwert: datumOderStrich(gesamt.fruehesteNeueKuendigungISO),
          nebenwerte: [{ label: 'Beendigungsdatum', wert: '– (keines)' }],
        }
      : {
          hauptlabel: 'Beendigungsdatum',
          hauptwert: datumOderStrich(gesamt.beendigungISO),
          nebenwerte: [{ label: 'Hemmung', wert: gesamt.gehemmtTage ? `${gesamt.gehemmtTage} Tage` : 'keine' }],
        }) : undefined,
    sections: gesamt ? [{ titel: 'Kündigung & Sperrfristen (Art. 335c / 336c OR)', ergebnis: gesamt }] : [],
    disclaimer: KSP_DISCLAIMER,
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6">
      <PflichtDisclaimer
        kurz="Kündigungsfrist und Sperrfristen nach Art. 335c / 336c OR; massgeblich sind GAV und Einzelvertrag."
        text={KSP_DISCLAIMER} />
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Vertragsbeginn">
          <DatumsFeld value={form.vertragsbeginn} onChange={(v) => set('vertragsbeginn', v)} className={inputCls} />
        </Field>

        <Field label="Zugang der Kündigung (Empfänger)" hint="Stichtag für Dienstjahr und Sperrfrist-Prüfung">
          <DatumsFeld value={form.zugangKuendigung} onChange={(v) => set('zugangKuendigung', v)} className={inputCls} />
        </Field>

        <Field label="Kündigende Partei">
          <select value={form.kuendigendePartei} onChange={(e) => set('kuendigendePartei', e.target.value as 'arbeitgeber' | 'arbeitnehmer')} className={inputCls}>
            <option value="arbeitgeber">Arbeitgeber</option>
            <option value="arbeitnehmer">Arbeitnehmer</option>
          </select>
        </Field>

        <Field label="Probezeit (Monate)" hint="0 = keine Probezeit, max. 3 Monate">
          <input
            type="number" inputMode="decimal" min={0} max={3} step={1}
            value={form.probezeitMonate}
            onChange={(e) => set('probezeitMonate', Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        {/* RL-16b (W-08 b): Arbeitstage für die Probezeitverlängerung nach
            Art. 335b Abs. 3 OR — nur sichtbar, wenn eine Probezeit besteht. */}
        {form.probezeitMonate > 0 && (
          <Field label="Arbeitstage pro Woche" hint="Für die Verlängerung der Probezeit bei Krankheit, Unfall oder Dienstpflicht (Art. 335b Abs. 3 OR)">
            <ArbeitstageFeld wert={form.arbeitstageWoche} onChange={(t) => set('arbeitstageWoche', t)} />
          </Field>
        )}

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

        <Field label="Kündigungstermin">
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2.5 py-1.5 text-body-s cursor-pointer">
              <input type="radio" name="kterm" checked={form.kuendigungsterminMonatsende} onChange={() => set('kuendigungsterminMonatsende', true)} />
              Monatsende (Standard)
            </label>
            <label className="flex items-center gap-2.5 py-1.5 text-body-s cursor-pointer">
              <input type="radio" name="kterm" checked={!form.kuendigungsterminMonatsende} onChange={() => set('kuendigungsterminMonatsende', false)} />
              Freies Datum
            </label>
          </div>
        </Field>
      </div>

      {/* Sperrereignisse — geteilter Editor (verhaltensneutral extrahiert, §10) */}
      <SperrereignisseEditor
        wert={form.sperrereignisse ?? []}
        onChange={(liste) => set('sperrereignisse', liste)}
        hinweis={form.kuendigendePartei === 'arbeitnehmer' ? 'nur bei Arbeitgeberkündigung relevant' : undefined}
      />

      <FehlerBox fehler={fehler} />

      {gesamt && (
        <ErgebnisBlock>
          {/* Prominente Eckdaten – ein kohärentes Ergebnis */}
          {gesamt.status === 'nichtig' ? (
            <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
              <div className="lc-tile lc-akzent-danger">
                <p className="lc-overline mb-1">Status</p>
                <p className="text-h2 leading-none font-semibold text-danger-700">NICHTIG</p>
              </div>
              <div className="lc-tile">
                <p className="lc-overline mb-1">Beendigungsdatum</p>
                <p className="num text-body-l text-ink-500">– (keines)</p>
              </div>
              <div className="lc-tile">
                <p className="lc-overline mb-1">Frühestens neu kündbar</p>
                <p className="num text-body-l text-ink-900">{datumOderStrich(gesamt.fruehesteNeueKuendigungISO)}</p>
              </div>
            </div>
          ) : (
            <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
              <div className="lc-tile">
                <p className="lc-overline mb-1">Status</p>
                <p className="text-body-l font-semibold text-ok-text">Gültig</p>
              </div>
              {/* QS-UI 8b (R4 Ziff. 1): Die Kachel des MASSGEBLICHEN Werts trägt die
                  Akzent-Oberkante (`.lc-akzent-w`). Von den sechs Kacheln dieses Rechners trug bis
                  4.8.2026 keine sie — im Nichtigkeits-Fall markiert die Danger-Kante
                  oben den Status (bewusst, bleibt), im gültigen Fall war der Hauptwert
                  «Beendigungsdatum» unmarkiert und optisch gleichrangig mit «Status»
                  und «Hemmung». Reine Kantenmarkierung: kein Wert, kein Text. */}
              <div className="lc-tile lc-akzent-w">
                <p className="lc-overline mb-1">Beendigungsdatum</p>
                <p className="num text-h2 leading-none font-medium text-ink-900">{datumOderStrich(gesamt.beendigungISO)}</p>
              </div>
              <div className="lc-tile">
                <p className="lc-overline mb-1">Hemmung</p>
                <p className="num text-body-l text-ink-900">{gesamt.gehemmtTage ? `${gesamt.gehemmtTage} Tage` : 'keine'}</p>
              </div>
            </div>
          )}

          {/* Querverbindung (nur informativ, bei Sperrereignissen) */}
          {hatEreignisse && (
            <div className="lc-notice">
              {/* LM-101-Muster: Buchstabenzusätze (336c/324a) dürfen die uppercase-Overline nicht durchlaufen. */}
              <p className="lc-overline mb-1">Querverbindung: <span className="normal-case">Art. 336c ↔ Art. 324a</span></p>
              <p className="text-body-s text-ink-600">
                Sperrfrist (Art. 336c OR) und Lohnfortzahlung (Art. 324a OR) sind <strong>voneinander unabhängig</strong>:
                Eine Sperrfrist von z.B. 90 Tagen bedeutet nicht 90 Tage Lohnfortzahlung. Beide sind separat zu prüfen (Modul A).
              </p>
            </div>
          )}

          <ErgebnisAnzeige titel="Kündigung & Sperrfristen (Art. 335c / 336c OR)" ergebnis={gesamt} />
          <KuendigungTimeline e={gesamt} />
          {gesamt.sperrtage && gesamt.sperrtage.length > 0 && <SperrtageZaehler sperrtage={gesamt.sperrtage} />}
          <BegruendungSlot ergebnis={gesamt} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig} query={kspQuery}
            ics={[gesamt.status === 'nichtig'
              /* «Frühestens neu kündbar» = FRÜHESTMÖGLICHER Termin: keine
                 3-Tage-VORfrist-Erinnerung (richtungsverkehrt, Nichtigkeits-
                 risiko 336c — Code-Review #2, 7.6.2026) → vorfristTage 0. */
              ? { endISO: gesamt.fruehesteNeueKuendigungISO, titel: 'Frühestens neu kündbar (Art. 336c OR)',
                  vorfristTage: 0, beschreibung: gesamt.ergebnis, dateiName: 'Neue-Kuendigung-fruehestens.ics' }
              : { endISO: gesamt.beendigungISO, titel: 'Beendigung Arbeitsverhältnis',
                  beschreibung: gesamt.ergebnis, dateiName: 'Beendigung-Arbeitsverhaeltnis.ics' }]}>
            {/* S-5c (Fristenspiegel-Auflösung): die 336b-Fristen leben jetzt
                als Ereignis-Block UNTEN AUF DIESER SEITE; das Beendigungs-
                datum (inkl. Sperrfristen-Verschiebung!) fliesst live über
                onBeendigung hinein — der Anker springt nur hin. */}
            {gesamt.status !== 'nichtig' && gesamt.beendigungISO && form.kuendigendePartei === 'arbeitgeber' && (
              <a className="lc-btn-outline no-underline" href="#ereignis-336b">
                336b-Fristen (Einsprache &amp; Klage) unten anzeigen →
              </a>
            )}
          </ErgebnisExport>
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
