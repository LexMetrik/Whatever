import { useState } from 'react';
import { BeruehrtRahmen, Checkbox, EckdatenKachel, FehlerBox, Field, inputCls } from '../vorlagen/ui';
import { NormText } from '../NormText';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { Tabs } from '../ui/Tabs';
import { Link } from 'react-router-dom';
import {
  allgemeineFristErgebnis, tageZwischen, ALLG_FRIST_HINWEIS,
  rueckwaertsErgebnis, zustellHinweis, fristQueryKodieren, fristQueryLesen, MECHANIK_PRESETS,
  type AllgFristInput, type AllgFristResult, type Einheit, type FristArt, type RueckVerschiebung, type ZustellArt,
} from '../../lib/allgemeineFrist';
import { FAM_STATUS_PRESETS, famPresetPatch } from '../../lib/famStatusPresets';
import type { Berechnungsergebnis, Kanton } from '../../types/legal';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { FristenKalender } from '../FristenKalender';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { fristbeginnZusatz } from '../../lib/begruendung';
import { IcsExportButton } from '../IcsExportButton';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { KANTONE } from '../../lib/kantone';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';
import type { EinfacheFristMeldung } from './einfacheFristTexte';

// ─── Allgemeiner Fristenrechner (Free) – UI ─────────────────────────────────
// Reine Darstellung; sämtliche Rechtsregeln liegen in lib/allgemeineFrist.ts.
// Zwei Tabs: «Fristende berechnen» (Hauptmodus) und das rein informative
// Hilfsmittel «Tage zwischen zwei Daten» (ohne Rechtsbezug, Auftrag §4).

const DISCLAIMER =
  'Automatisierte Orientierungsberechnung nach Art. 77/78 OR – keine Rechtsberatung. ' +
  'Der Rechner ermittelt das Fristende ab dem eingegebenen Startdatum; den Fristbeginn ' +
  '(z. B. Zustellfiktionen) bestimmt er nicht. Verfahrensspezifische Stillstände ' +
  '(Gerichts-/Betreibungsferien) berücksichtigt er nicht.';

const EINHEITEN: { code: Einheit; label: string }[] = [
  { code: 'tage', label: 'Tage' },
  { code: 'wochen', label: 'Wochen' },
  { code: 'monate', label: 'Monate' },
  { code: 'jahre', label: 'Jahre' },
];

type State = Omit<AllgFristInput, 'kanton'> & { kanton: Kanton };

const DEFAULTS: State = {
  start: '2026-06-05', laenge: 30, einheit: 'tage',
  wochenendeVerschieben: true, feiertageVerschieben: true, kanton: 'ZH',
  fristart: 'gesetzlich',
};

// RL-24/F1-02: Regime-Wahl (Art. 78 Abs. 1 OR vs. SR 173.110.3) — Rechtsregel
// in lib/allgemeineFrist.ts, hier nur Beschriftung (§3).
const FRISTARTEN: { code: FristArt; label: string }[] = [
  { code: 'gesetzlich', label: 'Gesetzliche oder behördliche Frist' },
  { code: 'vertraglich', label: 'Vertragsfrist / Erfüllungstag' },
];

// Mechanik-Presets seit FE-3 in lib/allgemeineFrist.ts (MECHANIK_PRESETS) —
// der Preset-Index des Tagerechners listet sie von dort (§5).

export function AllgemeineFristForm({ live }: {
  /** Live-Brücke des Tagerechners (Auftrag David 1.9.2026): die oben
   *  BERÜHRTEN Felder überschreiben die geteilten Felder hier, damit der
   *  Rechenweg automatisch mitrechnet. */
  live?: EinfacheFristMeldung;
} = {}) {
  const pk = usePaneKlasse();
  const [tab, setTab] = useState<'frist' | 'rueckwaerts' | 'zwischen'>('frist');
  // FE-3: Preset-Index-Links tragen den Fach-Preset-Schlüssel (fp=) —
  // dieselbe Wirkung wie der Chip-Klick (Länge/Einheit/Toggles + Hinweis).
  const [famAusLink] = useState(() => {
    try {
      const k = new URLSearchParams(window.location.search).get('fp');
      return FAM_STATUS_PRESETS.find((p) => p.key === k) ?? null;
    } catch { return null; }
  });
  // Permalink (P1.4): Eingaben werden beim ersten Render deterministisch
  // aus der URL rekonstruiert (Lazy-Initializer statt Effekt).
  const [form, setForm] = useState<State>(() => {
    try {
      const aus = fristQueryLesen(window.location.search);
      // Standard-Kanton (Einstellungen) als Default; ein Permalink-Kanton (aus)
      // geht weiter vor (Auftrag David).
      const basis = { ...DEFAULTS, kanton: getStandardKanton(), ...(aus ?? {}) };
      // RL-24/R5-06: Patch aus EINER Stelle (famPresetPatch) — Kündigungstermine
      // ohne Werktagsverschiebung.
      return famAusLink ? { ...basis, ...famPresetPatch(famAusLink) } : basis;
    } catch { return DEFAULTS; }
  });
  const [von, setVon] = useState('2026-06-05');
  const [bis, setBis] = useState('2026-07-05');
  // P1.1 Rückwärtsmodus
  const [rueck, setRueck] = useState<{ stichtag: string; laenge: number; einheit: Einheit; verschiebung: RueckVerschiebung }>({
    stichtag: '2026-06-30', laenge: 20, einheit: 'tage', verschiebung: 'keine',
  });
  // P1.2 Zustell-Helfer (rein informativ)
  const [zustellArt, setZustellArt] = useState<ZustellArt | ''>('');
  // gewählter Fach-Preset-Kontext (Familienrecht & Status, 10.6.2026).
  // Bug-Check 10.6.2026 (NIEDRIG): Hinweis nur, solange die Form-Werte dem
  // Preset noch entsprechen (Muster ZPO-presetPasst) — sonst unterdrückte
  // ein verlassener Fach-Preset dauerhaft das Verjährungs-Signal (FE-4).
  const [famPreset, setFamPreset] = useState(famAusLink);
  const famHinweis = famPreset && form.laenge === famPreset.laenge && form.einheit === famPreset.einheit
    ? `${famPreset.norm}: ${famPreset.info}` : null;
  const [zustellDatum, setZustellDatum] = useState('');

  const set = <K extends keyof State>(k: K, v: State[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Live-Brücke: Sync während des Renderns (Muster «adjusting state», wie die
  // Hash-Sync der Tagerechner-Seite). Referenzvergleich genügt — die Seite
  // hält `live` im State und erzeugt je Meldung genau EIN neues Objekt.
  // Initial undefined: eine frisch (per Regime-Wechsel oben) gemountete Form
  // übernimmt die Werte schon im ersten Render. Anwendungsregel (GP-Befund
  // B2): oben Berührtes gewinnt immer; Unberührtes füllt nur Felder, die
  // hier weder aus dem Permalink/Preset stammen noch von Hand geändert
  // wurden. Der Unter-Tab bleibt, wo ihn die nutzende Person hingestellt
  // hat (GP-Befund B5).
  const [ausLinkFelder] = useState(() => {
    try {
      const aus = fristQueryLesen(window.location.search) ?? {};
      return {
        start: aus.start !== undefined,
        laenge: aus.laenge !== undefined || !!famAusLink,
        einheit: aus.einheit !== undefined || !!famAusLink,
        kanton: aus.kanton !== undefined,
      };
    } catch { return { start: false, laenge: false, einheit: false, kanton: false }; }
  });
  // Mount-Stand als einmaliger State-Snapshot (kein Ref — Refs sind im
  // Render tabu, react-hooks/refs); nie aktualisiert, nur Vergleichsbasis.
  const [mountForm] = useState(form);
  const [letzterLive, setLetzterLive] = useState<EinfacheFristMeldung | undefined>(undefined);
  if (live && live !== letzterLive) {
    setLetzterLive(live);
    const n = { ...form };
    let geaendert = false;
    (['start', 'laenge', 'einheit', 'kanton'] as const).forEach((k) => {
      if (live.beruehrt.includes(k) || (!ausLinkFelder[k] && form[k] === mountForm[k])) {
        if (n[k] !== live.werte[k]) { (n as Record<string, unknown>)[k] = live.werte[k]; geaendert = true; }
      }
    });
    if (geaendert) setForm(n);
  }

  // P1.3 Validierung (sichtbare Meldungen statt stillem Verhalten)
  const fehler: string[] = [];
  if (tab === 'frist') {
    if (!form.start) fehler.push('Startdatum angeben.');
    if (!Number.isInteger(form.laenge) || form.laenge <= 0) fehler.push('Fristlänge muss eine ganze Zahl grösser 0 sein.');
  }
  if (tab === 'rueckwaerts') {
    if (!rueck.stichtag) fehler.push('Stichtag angeben.');
    if (!Number.isInteger(rueck.laenge) || rueck.laenge <= 0) fehler.push('Fristlänge muss eine ganze Zahl grösser 0 sein.');
  }
  const bisVorVon = tab === 'zwischen' && von && bis && bis < von;

  // Live-Berechnung (rein; Fehler → keine Anzeige)
  const ergebnis: (Berechnungsergebnis & { resultat: AllgFristResult }) | null =
    (() => { try { return allgemeineFristErgebnis(form); } catch { return null; } })();

  const rueckErgebnis: (Berechnungsergebnis & { resultat: AllgFristResult }) | null =
    (() => {
      try {
        return rueckwaertsErgebnis({ ...rueck, feiertageBeruecksichtigen: rueck.verschiebung === 'vorverlegen', kanton: form.kanton });
      } catch { return null; }
    })();

  const zustell = (() => {
    if (!zustellArt || !zustellDatum) return null;
    try { return zustellHinweis(zustellArt, zustellDatum, form.kanton); } catch { return null; }
  })();

  const zwischen: { kalendertage: number; werktageMoFr: number } | null =
    (() => { try { return tageZwischen(von, bis); } catch { return null; } })();

  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Allgemeine Frist',
    rechtsgrundlage: 'Berechnung nach Art. 77/78 OR',
    domain: 'allgemeine-frist',
    fileBase: 'Fristenrechner',
    inputs: {
      'Startdatum (Ereignis)': form.start.split('-').reverse().join('.'),
      'Fristlänge': `${form.laenge} ${EINHEITEN.find((e) => e.code === form.einheit)?.label}`,
      'Fristart': FRISTARTEN.find((f) => f.code === (form.fristart ?? 'gesetzlich'))!.label,
      'Wochenenden verschieben': form.wochenendeVerschieben ? 'ja' : 'nein',
      'Feiertage verschieben': form.feiertageVerschieben ? `ja (${form.kanton})` : 'nein',
    },
    hero: ergebnis ? {
      hauptlabel: 'Fristende (24.00 Uhr)',
      hauptwert: ergebnis.resultat.endDatum,
      nebenwerte: [{ label: 'Wochentag', wert: ergebnis.resultat.endWochentag }],
      kontext: `${form.laenge} ${EINHEITEN.find((e) => e.code === form.einheit)?.label} ab ${form.start.split('-').reverse().join('.')}`,
    } : undefined,
    sections: ergebnis ? [{ titel: 'Allgemeine Frist (Art. 77/78 OR)', ergebnis }] : [],
    disclaimer: DISCLAIMER,
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6 lc-rechner-spalten">
      <PflichtDisclaimer
        kurz="Fristende nach Art. 77/78 OR ab dem eingegebenen Startdatum; Fristbeginn (Zustellung) und verfahrensrechtliche Stillstände bestimmt der Rechner nicht."
        text={DISCLAIMER} />

      {/* Tabs: Hauptmodus + informatives Hilfsmittel */}
      <Tabs
        items={[
          { code: 'frist', label: 'Fristende berechnen' },
          { code: 'rueckwaerts', label: 'Rückwärts (spätester Tag)' },
          { code: 'zwischen', label: 'Tage zwischen zwei Daten' },
        ] as const}
        value={tab}
        onChange={setTab}
      />

      <FehlerBox fehler={fehler} />

      {tab === 'frist' ? (
        <>
          {/* P1.2 Zustell-/Zugangs-Helfer – REIN INFORMATIV, keine Subsumtion */}
          <details className="lc-card p-4">
            {/* W2·29-WERKBANK-REST S3 (25.9.2026): die Summary ist seit der
                App-weiten Regel eine Flex-Zeile (index.css, `details > summary`)
                — Text und Klammer-Span waren darum ZWEI Flex-Kinder mit je
                eigener Mindestbreite («ausgelöst?» + «Zustellberechnung)»),
                @320 zusammen 214 px in 200 (R8 a, bisher als «::marker»
                allowgelistet — gemessen: es gibt keinen Marker mehr). Ein
                gemeinsamer Span bricht als EIN Absatz um. Text unverändert. */}
            <summary className="cursor-pointer text-body-s font-medium text-ink-700">
              <span className="min-w-0">Wie wurde die Frist ausgelöst? <span className="text-ink-500 font-normal">(optionaler Hinweis-Helfer – keine verbindliche Zustellberechnung)</span></span>
            </summary>
            <div className={pk('mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end', 'mt-3 grid grid-cols-1 @4xl/pane:grid-cols-[1fr_1fr_auto] gap-3 items-end')}>
              <Field label="Zustellart">
                <select className={inputCls} value={zustellArt} onChange={(e) => setZustellArt(e.target.value as ZustellArt | '')}>
                  <option value="">– wählen –</option>
                  <option value="uebergabe">Persönliche Übergabe / Empfang</option>
                  <option value="einschreiben">Einschreiben – erfolgloser Zustellversuch</option>
                  <option value="apostplus">Gewöhnliche Post / A-Post Plus</option>
                </select>
              </Field>
              <Field label={zustellArt === 'einschreiben' ? 'Datum des Zustellversuchs' : 'Zustell-/Empfangsdatum'}>
                <DatumsFeld value={zustellDatum} onChange={setZustellDatum} className={inputCls} />
              </Field>
              {zustell && (
                <button type="button" className="lc-btn-outline lc-btn-sm mb-0.5"
                  onClick={() => set('start', zustell.vorschlagISO)}>
                  Vorschlag übernehmen: {zustell.vorschlagFmt}
                </button>
              )}
            </div>
            {zustell && (
              <div className="mt-3 space-y-1.5">
                {zustell.hinweise.map((h, i) => <p key={i} className="text-body-s text-ink-600"><NormText text={h} /></p>)}
              </div>
            )}
          </details>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="lc-overline lc-overline-soft">Voreinstellung:</span>
            {MECHANIK_PRESETS.map((p) => (
              <button type="button" key={p.label} onClick={() => setForm((f) => ({ ...f, ...p.patch }))}
                title={p.info} className="lc-chip hover:bg-brass-200 transition-colors">{p.label}</button>
            ))}
          </div>
          {/* Fach-Presets Familienrecht & Status (gebaut 10.6.2026, Bauspez.
              recherche/familienrecht-klagen-vorlagen.md): fixe gesetzliche
              Fristen ohne Sonderregime — Länge/Einheit + ehrlicher Kontext
              (§8) im Tooltip und nach Wahl als Hinweis. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="lc-overline lc-overline-soft">Familienrecht &amp; Status:</span>
            {FAM_STATUS_PRESETS.map((p) => (
              <button type="button" key={p.label}
                onClick={() => { setForm((f) => ({ ...f, ...famPresetPatch(p) })); setFamPreset(p); }}
                title={`${p.norm} — ${p.info}`} className="lc-chip hover:bg-brass-200 transition-colors">{p.label}</button>
            ))}
          </div>
          {famHinweis && (
            <p className="lc-notice text-body-s">{famHinweis}</p>
          )}
          {/* FE-4: deterministisches Abzweigungs-Signal (Einheit Jahre ohne
              gewählten Fach-Preset) — reiner Hinweis, keine Auto-Navigation. */}
          {form.einheit === 'jahre' && !famHinweis && (
            <p className="lc-notice text-body-s text-ink-600">
              Geht es um eine <span className="font-medium text-ink-900">Verjährungsfrist</span>?
              Dieser Rechner zählt nur Kalenderjahre – Unterbrechung (Art. 135 ff. OR) und
              Stillstand (Art. 134 OR) rechnet der{' '}
              <Link to="/rechner/verjaehrung"
                className="font-medium text-brass-700 hover:text-brass-600 no-underline whitespace-nowrap">
                Verjährungsrechner →
              </Link>
            </p>
          )}

          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Startdatum (auslösendes Ereignis)" hint="zählt nicht mit – dies a quo non computatur (Art. 77 OR)">
              <DatumsFeld value={form.start} onChange={(v) => set('start', v)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="Länge">
                {/* Feld leerbar: bei ungültigem/leerem Wert bleibt es LEER (statt
                    sichtbar auf «0» zu schnappen); die >0-Prüfung läuft über die
                    FehlerBox (fehler-Validierung oben) – konsistent zum Rückwärts-Tab,
                    statt im onChange hart auf 1 zu klammern. */}
                <input type="number" inputMode="decimal" min={1} step={1} className={inputCls + ' num'}
                  value={form.laenge > 0 ? form.laenge : ''}
                  aria-invalid={!Number.isInteger(form.laenge) || form.laenge <= 0}
                  onChange={(e) => set('laenge', Number(e.target.value))} />
              </Field>
              <Field label="Einheit">
                <select className={inputCls} value={form.einheit} onChange={(e) => set('einheit', e.target.value as Einheit)}>
                  {EINHEITEN.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Fristart" hint="Samstag verschiebt nur gesetzliche/behördliche Fristen (SR 173.110.3)">
              <select className={inputCls} value={form.fristart ?? 'gesetzlich'}
                onChange={(e) => set('fristart', e.target.value as FristArt)}>
                {FRISTARTEN.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
              </select>
            </Field>
            <Field label="Fristende verschieben">
              <div className="space-y-1.5 pt-1">
                {/* Rechtlich EINE Operation «nächster Werktag»: Feiertage
                    implizieren die Wochenend-Verschiebung (gekoppelt) */}
                <Checkbox checked={form.wochenendeVerschieben || form.feiertageVerschieben}
                  onChange={(v) => setForm((f) => ({ ...f, wochenendeVerschieben: v, feiertageVerschieben: v && f.feiertageVerschieben }))}
                  label={form.fristart === 'vertraglich'
                    ? 'Sonntag → nächster Werktag (Art. 78 OR)'
                    : 'Samstag/Sonntag → nächster Werktag (Art. 78 OR; SR 173.110.3)'} />
                <Checkbox checked={form.feiertageVerschieben}
                  onChange={(v) => setForm((f) => ({ ...f, feiertageVerschieben: v, wochenendeVerschieben: f.wochenendeVerschieben || v }))}
                  label="zusätzlich gesetzliche Feiertage (kantonal)" />
              </div>
            </Field>
            {form.feiertageVerschieben && (
              <Field label="Kanton (Erfüllungsort)" hint="Feiertage nach EJPD-Verzeichnis, Stand 2011; regionale Besonderheiten im Einzelfall prüfen">
                <select className={inputCls + ' sm:max-w-[9rem]'} value={form.kanton} onChange={(e) => set('kanton', e.target.value as Kanton)}>
                  {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
            )}
          </div>

          {ergebnis && (
            <ErgebnisBlock id="lc-ergebnis-allgemein">
              {/* Prominente Eckdaten (Angleichung an ZPO/SchKG) */}
              <div className="lc-kachelraster">
                {[
                  { label: 'Ereignistag (zählt nicht)', val: ergebnis.resultat.startISO.split('-').reverse().join('.') },
                  { label: 'Fristbeginn (dies a quo)', val: ergebnis.resultat.fristbeginnISO!.split('-').reverse().join('.') },
                  { label: 'Fristende (dies ad quem)', val: `${ergebnis.resultat.endDatum} · 24.00 Uhr`, akzent: true },
                ].map((c) => (
                  <EckdatenKachel key={c.label} label={c.label} wert={c.val} num akzent={c.akzent} />
                ))}
              </div>
              <ErgebnisAnzeige titel="Allgemeine Frist (Art. 77/78 OR)" ergebnis={ergebnis} />
              <FristenKalender
                ereignisISO={ergebnis.resultat.startISO}
                aQuoISO={ergebnis.resultat.fristbeginnISO!}
                adQuemISO={ergebnis.resultat.endDatumISO}
                kanton={form.kanton}
                stillstandAktiv={false}
              />
              {/* Fristbeginn-Baustein wie ZPO/SchKG (Code-Review #5, 7.6.2026):
                  Norm aus der Engine (Art. 77 OR), bei Rückwärtsfrist ohne
                  Beginn entfällt der Satz ersatzlos. */}
              <BegruendungSlot ergebnis={ergebnis} zusatz={fristbeginnZusatz(ergebnis.resultat.fristbeginnISO, ergebnis.normverweise[0]?.artikel)} />
              <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
                query={() => `?${fristQueryKodieren(form)}`}
                ics={[{ endISO: ergebnis.resultat.endDatumISO,
                  titel: `Fristende – ${form.laenge} ${EINHEITEN.find((e) => e.code === form.einheit)?.label}`,
                  beschreibung: `Fristende: ${ergebnis.ergebnis} (Art. 77/78 OR).` }]} />
              {/* QS-UI 8b (B2): Abgrenzungshinweis lief über die volle Kartenbreite —
                  gemessen 910 px gegen die 640-px-Lesespalte. Nur Breite; Wortlaut
                  und Links unverändert (Text aus lib/allgemeineFrist.ts, §5). */}
              <p className="text-body-s text-ink-500 max-w-reading-s">
                {ALLG_FRIST_HINWEIS.replace(' den ZPO-Fristenrechner, für betreibungsrechtliche den SchKG-Fristenrechner verwenden.', ':')}{' '}
                <Link to="/rechner/zpo-fristen" className="text-brass-700 no-underline hover:text-brass-600">ZPO-Fristen →</Link>{' · '}
                <Link to="/rechner/schkg-fristen" className="text-brass-700 no-underline hover:text-brass-600">SchKG-Fristen →</Link>
              </p>
            </ErgebnisBlock>
          )}
        </>
      ) : tab === 'rueckwaerts' ? (
        <div className="space-y-4">
          <p className="lc-notice text-body-s">
            Rückwärtsfrist: ermittelt den SPÄTESTEN Handlungstag, damit zwischen Handlung und Stichtag
            die volle Frist liegt (z. B. «Einberufung mindestens 20 Tage vor der Generalversammlung»,
            Art. 700 Abs. 1 OR). Keine automatische Verschiebung – die Verschiebungsrichtung bei
            Wochenend-/Feiertagskollision ist höchstrichterlich ungeklärt.
          </p>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Stichtag / Termin" hint="bis zu dem die Frist gewahrt sein muss">
              <DatumsFeld value={rueck.stichtag} onChange={(v) => setRueck((r) => ({ ...r, stichtag: v }))} className={inputCls} />
            </Field>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="Länge">
                <input type="number" inputMode="decimal" min={1} step={1} className={inputCls + ' num'} value={rueck.laenge}
                  aria-invalid={!Number.isInteger(rueck.laenge) || rueck.laenge <= 0}
                  onChange={(e) => setRueck((r) => ({ ...r, laenge: Number(e.target.value) }))} />
              </Field>
              <Field label="Einheit">
                <select className={inputCls} value={rueck.einheit} onChange={(e) => setRueck((r) => ({ ...r, einheit: e.target.value as Einheit }))}>
                  {EINHEITEN.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Bei Wochenende/Feiertag" hint="Vorverlegung ist in der Schweiz höchstrichterlich ungeklärt – zu verifizieren">
              <select className={inputCls} value={rueck.verschiebung}
                onChange={(e) => setRueck((r) => ({ ...r, verschiebung: e.target.value as RueckVerschiebung }))}>
                <option value="keine">Keine Verschiebung (Standard – im Zweifel früher handeln)</option>
                <option value="vorverlegen">Vorverlegen auf den vorangehenden Werktag (Option, mit Vorbehalt)</option>
              </select>
            </Field>
            {rueck.verschiebung === 'vorverlegen' && (
              <Field label="Kanton (Feiertage)">
                <select className={inputCls + ' sm:max-w-[9rem]'} value={form.kanton} onChange={(e) => set('kanton', e.target.value as Kanton)}>
                  {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
            )}
          </div>
          {rueckErgebnis && (
            <ErgebnisBlock id="lc-ergebnis-allgemein">
              <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
                {[
                  { label: 'Spätester Handlungstag', val: `${rueckErgebnis.resultat.endWochentag}, ${rueckErgebnis.resultat.endDatum}`, akzent: true },
                  { label: 'Stichtag / Termin', val: rueckErgebnis.resultat.startISO.split('-').reverse().join('.') },
                ].map((c) => (
                  <EckdatenKachel key={c.label} label={c.label} wert={c.val} num akzent={c.akzent} />
                ))}
              </div>
              <ErgebnisAnzeige titel="Rückwärtsfrist – spätester Handlungstag" ergebnis={rueckErgebnis} />
              {/* Band läuft vom Handlungstag zum Stichtag; Ereignis-Marker =
                  Handlungstag (brass), Stichtag als Endmarker (sage). */}
              <FristenKalender
                ereignisISO={rueckErgebnis.resultat.endDatumISO}
                aQuoISO={rueckErgebnis.resultat.endDatumISO}
                adQuemISO={rueckErgebnis.resultat.startISO}
                kanton={form.kanton}
                stillstandAktiv={false}
                labels={{ ereignis: 'Spätester Handlungstag', aquo: 'Spätester Handlungstag', adquem: 'Stichtag / Termin' }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <IcsExportButton endISO={rueckErgebnis.resultat.endDatumISO} titel="Spätester Handlungstag"
                  aktenzeichen={aktenzeichen}
                  beschreibung={`Spätester Handlungstag: ${rueckErgebnis.ergebnis} (Rückwärtsfrist, Art. 77/78 OR).`} />
              </div>
            </ErgebnisBlock>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="lc-notice text-body-s">
            Reines Zählwerkzeug ohne Rechtsbezug – für Fristen den Tab «Fristende berechnen» verwenden.
          </p>
          {bisVorVon && (
            <p className="lc-notice-warn text-body-s" role="alert">
              «Bis» liegt vor «Von» – angezeigt wird der Abstand als Betrag.
            </p>
          )}
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Von"><DatumsFeld value={von} onChange={setVon} className={inputCls} /></Field>
            <Field label="Bis"><DatumsFeld value={bis} onChange={setBis} className={inputCls} /></Field>
          </div>
          {zwischen && (
            <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3 lc-reveal', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3 lc-reveal')}>
              <div className="lc-tile">
                <p className="lc-overline mb-1">Kalendertage</p>
                <p className="num text-h2 leading-none font-medium text-ink-900">{zwischen.kalendertage}</p>
              </div>
              <div className="lc-tile">
                <p className="lc-overline mb-1">Werktage (Mo–Fr, informativ)</p>
                <p className="num text-h2 leading-none font-medium text-ink-900">{zwischen.werktageMoFr}</p>
                <p className="text-xs text-ink-500 mt-1">ohne Feiertagsbezug – kein rechtlicher Fristbegriff</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
