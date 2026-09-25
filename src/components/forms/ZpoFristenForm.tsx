import { KANTONE } from '../../lib/kantone';
import { BeruehrtRahmen, Checkbox, EckdatenKachel, FehlerBox, Field, GruppenTitel, inputCls } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { Tabs } from '../ui/Tabs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Kanton } from '../../types/legal';
import type { ZpoInput, ZpoEinheit, ZpoVerfahren, ZpoFristnatur, ZpoZustellart, ZpoModus, ZpoErgebnis } from '../../types/zpo';
import { berechneFrist, zustellfiktion } from '../../lib/zpoFristen';
import { berechneBggVwvgFrist, bvZustellfiktionSatz, type BvFristResult } from '../../lib/bggVwvgFristen';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { zpoPdfCitations, zpoPdfErgebnis } from '../../lib/pdf/zpoPdf';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { fristbeginnZusatz } from '../../lib/begruendung';
import { permalinkKodieren } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { ZPO_LINK_SPEC } from '../../lib/rechnerPermalinks';
import { FristenKalender } from '../FristenKalender';
import { PHASEN, PRESETS, MATERIELL_WARNUNG, type ZpoPhase, type ZpoPreset } from '../../lib/zpoPresets';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';
import type { EinfacheFristMeldung } from './einfacheFristTexte';


const EINHEITEN: { code: ZpoEinheit; label: string }[] = [
  { code: 'tage', label: 'Tage' },
  { code: 'wochen', label: 'Wochen' },
  { code: 'monate', label: 'Monate' },
  { code: 'jahre', label: 'Jahre' },
];

const VERFAHREN: { code: ZpoVerfahren; label: string; stillstand: boolean }[] = [
  { code: 'ordentlich', label: 'Ordentliches Verfahren', stillstand: true },
  { code: 'vereinfacht', label: 'Vereinfachtes Verfahren', stillstand: true },
  { code: 'familienrecht', label: 'Familienrechtliches Verfahren (nicht summarisch)', stillstand: true },
  { code: 'klagefrist_klagebewilligung', label: 'Klagefrist nach Klagebewilligung (Art. 209)', stillstand: true },
  { code: 'schlichtung', label: 'Schlichtungsverfahren', stillstand: false },
  { code: 'summarisch', label: 'Summarisches Verfahren', stillstand: false },
  { code: 'rechtsmittel_summarisch', label: 'Rechtsmittel gegen summarischen Entscheid', stillstand: false },
];

// Disclaimer in drei Teilen: Der Praxis-Satz (BGer 5A_691/2023) betrifft nur
// Wochen-/Monats-/Jahresfristen und wird in der PDF bei Tagesfristen weggelassen.
const DISCLAIMER_TEIL1 =
  'Dieser Fristenrechner ist eine rechnerische Orientierungshilfe auf Grundlage der Art. 142–147 ZPO und stellt ' +
  'keine Rechtsberatung und keine verbindliche Fristberechnung dar. ';
const DISCLAIMER_PRAXIS =
  'Die Berechnung folgt der bundesgerichtlichen Praxis (BGer 5A_691/2023 vom 13.8.2024); einzelne ' +
  'Auslegungsfragen sind in Lehre und Rechtsprechung umstritten. ';
const DISCLAIMER_TEIL2 =
  'Massgeblich sind die am Gerichtsort (Sitz des Gerichts) anerkannten Feiertage; kantonale und lokale Feiertage ' +
  'sowie die konkrete Verfahrensart sind eigenständig zu prüfen. Berechnet wird ausschliesslich das Fristende, ' +
  'nicht die Rechtsfolgen einer Säumnis. Eine verpasste Frist kann nur unter den Voraussetzungen von Art. 148 ZPO ' +
  'wiederhergestellt werden. Für die Fristwahrung im Einzelfall ist allein die nutzende Person verantwortlich.';
const DISCLAIMER = DISCLAIMER_TEIL1 + DISCLAIMER_PRAXIS + DISCLAIMER_TEIL2;

// RL-07/F1-01: Offenlegung (§8) — die ZPO-Eingaben dieses Formulars wirken auf
// eine nach BGG gerechnete Frist nicht.
const BGG_PRESET_ZPO_FELDER =
  'Verfahrensart, Fristnatur, Zustellart und Berechnungsmodus dieses ZPO-Rechners wirken auf diese '
  + 'BGG-Frist nicht; Fristbeginn am Folgetag der Eröffnung (Art. 44 Abs. 1 BGG).';

const DEFAULTS: ZpoInput = {
  ereignis: '2025-01-15',
  einheit: 'tage',
  laenge: 30,
  verfahren: 'ordentlich',
  kanton: 'ZH',
  fristnatur: 'gesetzlich',
  zustellart: 'empfangsbestaetigung',
  modus: 'bundesgericht',
};


export function ZpoFristenForm({ live }: {
  /** Live-Brücke des Tagerechners (Auftrag David 1.9.2026): die oben
   *  BERÜHRTEN Felder überschreiben die geteilten Felder hier, damit der
   *  Rechenweg automatisch mitrechnet. */
  live?: EinfacheFristMeldung;
} = {}) {
  const pk = usePaneKlasse();
  // Permalink einmalig lesen (lazy, validiert) — speist die Initialwerte.
  const ausLink = usePermalinkFelder(ZPO_LINK_SPEC);
  const [form, setForm] = useState<ZpoInput>(() => ({
    ...DEFAULTS,
    kanton: getStandardKanton(), // Standard-Kanton (Einstellungen); Permalink unten geht vor
    ...(ausLink.ereignis ? { ereignis: ausLink.ereignis } : {}),
    ...(ausLink.einheit ? { einheit: ausLink.einheit as ZpoInput['einheit'] } : {}),
    ...(ausLink.laenge != null ? { laenge: ausLink.laenge } : {}),
    ...(ausLink.verfahren ? { verfahren: ausLink.verfahren as ZpoInput['verfahren'] } : {}),
    ...(ausLink.kanton ? { kanton: ausLink.kanton as ZpoInput['kanton'] } : {}),
    ...(ausLink.fristnatur ? { fristnatur: ausLink.fristnatur as ZpoInput['fristnatur'] } : {}),
    ...(ausLink.zustellart ? { zustellart: ausLink.zustellart as ZpoInput['zustellart'] } : {}),
    ...(ausLink.modus ? { modus: ausLink.modus as ZpoInput['modus'] } : {}),
    ...(ausLink.gerichtshinweisStillstand != null ? { gerichtshinweisStillstand: ausLink.gerichtshinweisStillstand } : {}),
  }));
  // FE-3: Preset-Index-Links tragen den Preset-Schlüssel — Phase, Auswahl
  // und Hinweis werden wiederhergestellt (die Fach-Parameter kommen wie
  // bisher einzeln aus dem Link, §5: eine Kodierung). Bug-Check 10.6.2026
  // (NIEDRIG): nur übernehmen, wenn die Link-Parameter dem Preset wirklich
  // entsprechen — hand-editierte Links (p=berufung&l=10) zeigten sonst
  // Berufungs-Hinweis neben abweichender Rechnung.
  const linkPreset = (() => {
    const p = PRESETS.find((x) => x.key === ausLink.presetKey);
    if (!p) return undefined;
    const passt = ausLink.einheit === p.einheit
      && ausLink.verfahren === p.verfahren
      && ausLink.fristnatur === p.fristnatur
      && (p.laenge == null ? ausLink.laenge === undefined : ausLink.laenge === p.laenge);
    return passt ? p : undefined;
  })();
  const [phase, setPhase] = useState<ZpoPhase>(linkPreset?.phase ?? 'rechtsmittel');
  const [presetKey, setPresetKey] = useState(linkPreset?.key ?? '');
  const [presetHinweis, setPresetHinweis] = useState<string | null>(linkPreset?.hinweis ?? null);
  const [erweitert, setErweitert] = useState(false);
  const [fiktionDatum, setFiktionDatum] = useState('');
  const [erstreckungAn, setErstreckungAn] = useState(ausLink.erstreckungAn ?? false);
  const [erstreckung, setErstreckung] = useState<{ einheit: 'tage' | 'wochen'; laenge: number }>({
    einheit: (ausLink.erstreckungEinheit as 'tage' | 'wochen' | undefined) ?? 'tage',
    laenge: ausLink.erstreckungLaenge ?? 10,
  });

  // Live-Brücke: Sync während des Renderns (Muster «adjusting state»);
  // Referenzvergleich genügt, die Seite hält `live` im State. Anwendungsregel
  // (GP-Befund B2): oben Berührtes gewinnt immer; Unberührtes füllt nur
  // Felder, die hier weder aus dem Permalink stammen noch von Hand geändert
  // wurden. Der Preset-Hinweis fällt nur bei echter Wert-Änderung (Muster
  // presetPasst, Bug-Check 10.6.2026: kein Hinweis neben fremder Rechnung).
  const ausLinkFelder = { ereignis: !!ausLink.ereignis, laenge: ausLink.laenge != null, einheit: !!ausLink.einheit, kanton: !!ausLink.kanton };
  // Mount-Stand als einmaliger State-Snapshot (kein Ref — Refs sind im
  // Render tabu, react-hooks/refs); nie aktualisiert, nur Vergleichsbasis.
  const [mountForm] = useState(form);
  const ZUORDNUNG = { start: 'ereignis', laenge: 'laenge', einheit: 'einheit', kanton: 'kanton' } as const;
  const [letzterLive, setLetzterLive] = useState<EinfacheFristMeldung | undefined>(undefined);
  if (live && live !== letzterLive) {
    setLetzterLive(live);
    const n = { ...form };
    let geaendert = false;
    (['start', 'laenge', 'einheit', 'kanton'] as const).forEach((k) => {
      const feld = ZUORDNUNG[k];
      if (live.beruehrt.includes(k) || (!ausLinkFelder[feld] && form[feld] === mountForm[feld])) {
        if (n[feld] !== live.werte[k]) { (n as Record<string, unknown>)[feld] = live.werte[k]; geaendert = true; }
      }
    });
    if (geaendert) {
      setForm(n);
      setPresetKey('');
      setPresetHinweis(null);
    }
  }

  const set = <K extends keyof ZpoInput>(k: K, v: ZpoInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const presetsDerPhase = PRESETS.filter((p) => p.phase === phase);
  const ladePreset = (p: ZpoPreset) => {
    setPresetKey(p.key);
    setPresetHinweis(p.hinweis ?? null);
    setForm((f) => ({ ...f, einheit: p.einheit, verfahren: p.verfahren, fristnatur: p.fristnatur, ...(p.laenge != null ? { laenge: p.laenge } : {}) }));
    setErstreckungAn(false);
  };

  // Live-Berechnung
  const eingabe: ZpoInput = { ...form, erstreckung: erstreckungAn && form.fristnatur === 'gerichtlich' ? erstreckung : undefined };
  const fehler: string[] = [];
  if (!Number.isInteger(form.laenge) || form.laenge <= 0) fehler.push('Fristlänge muss eine ganze Zahl > 0 sein.');
  if (!form.ereignis) fehler.push('Bitte ein auslösendes Ereignis (Datum) angeben.');
  // RL-07/F1-01 (Prüfung Rechtslogik 23.9.2026): Presets mit `engine: 'bgg'`
  // (BGer-Beschwerde in Schiedssachen) rechnen nach Art. 44–46 BGG über die
  // BGG-Engine — Feiertage am Wohnsitz/Sitz der Partei oder ihrer Vertretung
  // (Art. 45 Abs. 2 BGG), nicht am Gerichtsort (Art. 142 Abs. 3 ZPO). Die
  // ZPO-Engine bleibt unberührt (§1/§4: getrennte Regeln). Massgeblich ist das
  // GEWÄHLTE Preset (nicht nur `presetPasst`): auch mit geänderter Länge bleibt
  // es eine BGG-Frist; ein Phasen-/Presetwechsel oder die Live-Brücke setzt
  // presetKey zurück und damit auf die ZPO-Rechnung.
  const aktPreset = PRESETS.find((p) => p.key === presetKey);
  const bggPreset = aktPreset?.engine === 'bgg';
  // RL-20/F1-04: Presets ohne Art.-145-Abs.-3-Hinweisregel (Arrestprosekution)
  // — nur solange die Verfahrensart des Presets gewählt ist.
  const hinweispflichtEntfaellt = aktPreset?.hinweispflichtEntfaellt === true && form.verfahren === aktPreset.verfahren;
  let ergebnis: ZpoErgebnis | null = null;
  let bggErgebnis: BvFristResult | null = null;
  if (fehler.length === 0) {
    try {
      if (bggPreset) {
        bggErgebnis = berechneBggVwvgFrist({ regime: 'bgg', ereignis: form.ereignis, einheit: form.einheit, laenge: form.laenge, kanton: form.kanton });
      } else {
        ergebnis = berechneFrist(hinweispflichtEntfaellt ? { ...eingabe, hinweispflichtEntfaellt: true } : eingabe);
      }
    } catch (err) { fehler.push((err as Error).message); }
  }

  const aktVerfahren = VERFAHREN.find((v) => v.code === form.verfahren)!;

  const eingaben: Record<string, string> = {
    'Auslösendes Ereignis': form.ereignis,
    'Frist': `${form.laenge} ${form.einheit}`,
    'Verfahrensart': aktVerfahren.label,
    'Gerichtsort (Kanton)': form.kanton,
    'Fristnatur': form.fristnatur === 'gesetzlich' ? 'gesetzlich' : 'gerichtlich',
    'Berechnungsmodus': form.modus === 'mindermeinung' ? 'Mindermeinung' : 'bundesgerichtliche Praxis',
  };

  // ── Kalender-Titel (.ics): Preset-Label nur, solange die Form-Werte dem
  //    Preset noch entsprechen — presetKey überlebt manuelle Änderungen, der
  //    Eintrag darf dann nicht mehr «Berufung» heissen (§8). Reine Beschriftung (§3).
  const presetPasst = !!aktPreset && form.einheit === aktPreset.einheit
    && form.verfahren === aktPreset.verfahren
    && form.fristnatur === aktPreset.fristnatur
    && (aktPreset.laenge == null || form.laenge === aktPreset.laenge);
  const icsTitel = presetPasst
    ? `Fristende – ${aktPreset.label} (${aktPreset.norm})`
    : `Fristende ZPO – ${form.laenge} ${EINHEITEN.find((e) => e.code === form.einheit)?.label}`;

  // ── PDF-Konfiguration (zentrale Vorlage, nur einschlägige Bausteine) ──
  const istTagesfrist = form.einheit === 'tage';
  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  // EINE Quelle für Teilen-Link UND .ics-Rücklink (§5; Bug-Check 7.6.2026 N-2).
  const zpoQuery = () => permalinkKodieren(ZPO_LINK_SPEC, {
    ...form, erstreckungAn,
    erstreckungLaenge: erstreckung.laenge, erstreckungEinheit: erstreckung.einheit,
  });

  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'ZPO-Fristberechnung',
    domain: 'zpo-fristen',
    fileBase: 'ZPO-Fristen',
    inputs: eingaben,
    sections: ergebnis
      ? [{ titel: 'ZPO-Fristberechnung (Art. 142 ff. ZPO)', ergebnis: zpoPdfErgebnis(ergebnis, form.einheit) }]
      : [],
    citations: ergebnis ? zpoPdfCitations(ergebnis) : undefined,
    disclaimer: DISCLAIMER_TEIL1 + (istTagesfrist ? '' : DISCLAIMER_PRAXIS) + DISCLAIMER_TEIL2,
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6 lc-rechner-spalten">
      {/* Pflicht-Disclaimer (Ziff. 9) – immer sichtbar, kompakt. Volltext im Ergebnis-Panel. */}
      <PflichtDisclaimer kurz="Rechnerische Orientierung (Art. 142–147 ZPO, Praxis BGer 5A_691/2023). Massgeblich ist der Gerichtsort." text={DISCLAIMER} />

      {/* Verfahrensphase */}
      <div className="space-y-2">
        <GruppenTitel>Verfahrensphase wählen</GruppenTitel>
        <Tabs items={PHASEN.map((p) => ({ code: p.code, label: p.label }))} value={phase} onChange={(c) => { setPhase(c); setPresetKey(''); setPresetHinweis(null); }} mode="pressed" ariaLabel="Verfahrensphase" />
      </div>

      {/* R9-2 (6.9.2026): `role="status"`, nicht `role="alert"`. Die Meldung
          antwortet nicht auf einen Eingabefehler, sondern beschreibt eine
          ABDECKUNGSGRENZE des Rechners (§8) — es gibt nichts zu beheben, also
          unterbricht sie auch nichts. Die Blocker- und Mängellisten der Vorlagen
          tragen aus demselben Grund `role="alert"`. Wächter:
          `src/tests/design-r9-fehlerbox-baustein.test.ts`. */}
      {phase === 'materiell' ? (
        <div role="status" className="lc-notice-danger">
          <p className="lc-overline text-danger-700 mb-1">Materielle Frist – nicht von diesem Rechner erfasst</p>
          <p className="text-body-s text-danger-700">{MATERIELL_WARNUNG}</p>
        </div>
      ) : (
      <>
      {/* Frist-Preset */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4 items-end', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4 items-end')}>
        <Field label="Frist-Vorlage" hint="Setzt Länge, Verfahren, Stillstand und Erstreckbarkeit automatisch">
          <select value={presetKey} onChange={(e) => { const p = PRESETS.find((x) => x.key === e.target.value); if (p) ladePreset(p); else setPresetKey(''); }} className={inputCls}>
            <option value="">– Vorlage wählen (oder manuell unten) –</option>
            {presetsDerPhase.map((p) => <option key={p.key} value={p.key}>{p.label} · {p.norm}</option>)}
          </select>
        </Field>
        {presetHinweis && (
          <div className="lc-notice"><p className="text-body-s text-ink-600">{presetHinweis}</p></div>
        )}
      </div>

      {/* Eingaben */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Auslösendes Ereignis (Datum)" hint="Zustellung/Eröffnung der fristauslösenden Mitteilung">
          <DatumsFeld value={form.ereignis} onChange={(v) => set('ereignis', v)} className={inputCls} />
        </Field>

        {/* LM-078 (B19): zwei eigene Fields statt einem Field für zwei Controls —
            `Field` verknüpft `label`/`htmlFor` nur mit EINEM nativen Kind (siehe
            vorlagen/ui.tsx); bei einer umschliessenden <div> ging die Verknüpfung
            ins Leere und das Zahlenfeld blieb ohne eigene Beschriftung. Muster
            identisch zu AllgemeineFristForm.tsx (Länge/Einheit-Grid). */}
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <Field label="Länge">
            {/* LM-160 (B6/K-15): aria-invalid rollt das Muster aus AllgemeineFristForm
                aus — das Feld selbst markiert den Eingabefehler, statt ihn nur ~400 px
                weiter unten in der FehlerBox stehen zu lassen (§8). */}
            <input type="number" inputMode="decimal" min={1} step={1} value={form.laenge}
              aria-invalid={!Number.isInteger(form.laenge) || form.laenge <= 0}
              onChange={(e) => set('laenge', Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Einheit">
            <select value={form.einheit} onChange={(e) => set('einheit', e.target.value as ZpoEinheit)} className={inputCls}>
              {EINHEITEN.map((u) => <option key={u.code} value={u.code}>{u.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Verfahrensart" hint={`Fristenstillstand: ${aktVerfahren.stillstand ? 'gilt' : 'gilt nicht'} (Art. 145 Abs. 2 ZPO)`}>
          <select value={form.verfahren} onChange={(e) => set('verfahren', e.target.value as ZpoVerfahren)} className={inputCls}>
            {VERFAHREN.map((v) => <option key={v.code} value={v.code}>{v.label}</option>)}
          </select>
        </Field>

        {!aktVerfahren.stillstand && !hinweispflichtEntfaellt && (
          <Field label="Hinweis des Gerichts auf Nichtgeltung des Stillstands?" hint="Art. 145 Abs. 3 ZPO – Gültigkeitsvorschrift (BGE 139 III 78)">
            <Checkbox
              checked={form.gerichtshinweisStillstand ?? true}
              onChange={(v) => set('gerichtshinweisStillstand', v)}
              label="Gericht hat hingewiesen (sonst gilt der Stillstand gleichwohl)"
              className="pt-2"
            />
          </Field>
        )}

        <Field label={bggPreset ? 'Wohnsitz/Sitz der Partei oder ihrer Vertretung (Kanton)' : 'Gerichtsort (Kanton)'}
          hint={bggPreset ? 'Massgeblich für Feiertage (Art. 45 Abs. 2 BGG) – nicht der Gerichtsort' : 'Sitz des Gerichts – massgeblich für Feiertage (Art. 142 Abs. 3)'}>
          <select value={form.kanton} onChange={(e) => set('kanton', e.target.value as Kanton)} className={inputCls}>
            {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>

        <Field label="Fristnatur" hint="Steuert den Erstreckbarkeits-Hinweis (Art. 144 ZPO)">
          <select value={form.fristnatur} onChange={(e) => set('fristnatur', e.target.value as ZpoFristnatur)} className={inputCls}>
            <option value="gesetzlich">Gesetzliche Frist</option>
            <option value="gerichtlich">Gerichtliche Frist</option>
          </select>
        </Field>

        <Field label="Zustellart" optional hint="Art. 142 Abs. 1bis ZPO">
          <select value={form.zustellart} onChange={(e) => set('zustellart', e.target.value as ZpoZustellart)} className={inputCls}>
            <option value="empfangsbestaetigung">Gegen Empfangsbestätigung (eingeschrieben/GU)</option>
            <option value="gewoehnliche_post">Gewöhnliche Post (A-/B-Post)</option>
          </select>
        </Field>
      </div>

      {/* Optionale / erweiterte Funktionen – kein overflow-hidden, sonst wird
          das DatumsFeld-Popover (Zustellfiktion) abgeschnitten. */}
      <div className="border border-line ">
        <button type="button" onClick={() => setErweitert(!erweitert)}
          className={`w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-brass-100 text-left ${erweitert ? '' : ''}`}>
          <span className="text-body-s font-medium text-ink-700">Optionale Funktionen (Berechnungsmodus, Erstreckung, Zustellfiktion)</span>
          <span className="text-ink-500">{erweitert ? '▲' : '▼'}</span>
        </button>
        {erweitert && (
          <div className="p-4 space-y-4">
            <Field label="Berechnungsmodus (Wochen-/Monats-/Jahresfrist)" hint="[UMSTRITTEN] – Default folgt dem Bundesgericht">
              <select value={form.modus} onChange={(e) => set('modus', e.target.value as ZpoModus)} className={inputCls}>
                <option value="bundesgericht">Bundesgerichtliche Praxis (dies a quo = Ereignistag)</option>
                <option value="mindermeinung">Mindermeinung (dies a quo = Folgetag) – Fristrisiko</option>
              </select>
            </Field>

            {form.fristnatur === 'gerichtlich' && (
              <div className="space-y-2">
                <Checkbox
                  checked={erstreckungAn}
                  onChange={setErstreckungAn}
                  label="Erstreckung berechnen (Art. 144 Abs. 2 ZPO)"
                />
                {erstreckungAn && (
                  <div className="flex gap-2 items-center">
                    <input type="number" inputMode="decimal" min={1} value={erstreckung.laenge}
                      onChange={(e) => setErstreckung((s) => ({ ...s, laenge: Number(e.target.value) }))} className={inputCls + ' w-24'} />
                    <select value={erstreckung.einheit}
                      onChange={(e) => setErstreckung((s) => ({ ...s, einheit: e.target.value as 'tage' | 'wochen' }))} className={inputCls + ' w-40'}>
                      <option value="tage">Tage</option>
                      <option value="wochen">Wochen</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <Field label="Zustellfiktion-Helfer (Art. 138 Abs. 3 lit. a)" optional hint="Datum des erfolglosen Zustellversuchs → fingiertes Zustelldatum (+7 Tage)">
              <div className="flex gap-2 items-center">
                <DatumsFeld value={fiktionDatum} onChange={(v) => setFiktionDatum(v)} className={inputCls} />
                <button type="button" disabled={!fiktionDatum}
                  onClick={() => set('ereignis', zustellfiktion(fiktionDatum))}
                  className="text-body-s px-3 py-2 bg-surface hover:bg-brass-100 disabled:opacity-50 text-ink-700 whitespace-nowrap">
                  → als Ereignis übernehmen
                </button>
              </div>
            </Field>
          </div>
        )}
      </div>

      <FehlerBox fehler={fehler} />

      {/* RL-07/F1-01: Ergebnis der BGG-Engine für BGG-Presets — dieselbe
          Ergebnis-Anatomie wie der Schnellrechner (lc-notice), keine neuen
          Bausteine. PDF/Kalender des ZPO-Rechenwegs entfallen hier bewusst:
          sie tragen ZPO-Normen (Art. 142 ff. ZPO) und wären für diese Frist
          falsch beschriftet (§8). */}
      {bggErgebnis && (
        <ErgebnisBlock id="lc-ergebnis-zpo">
          <div className="lc-notice space-y-1.5">
            <p className="lc-overline">Fristende nach BGG (Art. 44–46 BGG)</p>
            <p className="text-h3 font-semibold text-ink-900 num">{bggErgebnis.diesAdQuem} · 24.00 Uhr</p>
            <ul className="text-body-s text-ink-500 leading-relaxed list-disc pl-5 space-y-0.5">
              {[...bggErgebnis.annahmen, ...bggErgebnis.warnungen, bvZustellfiktionSatz('bgg'), BGG_PRESET_ZPO_FELDER].map((z) => <li key={z}>{z}</li>)}
            </ul>
            <p className="text-body-s">
              <Link to="/rechner/bgg-fristen" className="font-medium text-brass-700 hover:text-brass-600 no-underline">
                Zulässigkeit, Rügen und Frist im BGer-Rechtsweg-Rechner prüfen →
              </Link>
            </p>
          </div>
        </ErgebnisBlock>
      )}
      {ergebnis && (
        <ErgebnisBlock id="lc-ergebnis-zpo">
          {/* Prominente Eckdaten */}
          <div className="lc-kachelraster">
            {[
              { label: 'Massgeblicher Ereignistag', val: ergebnis.massgeblicherEreignistag },
              { label: 'Fristbeginn (dies a quo)', val: ergebnis.diesAQuo },
              { label: 'Fristende (dies ad quem)', val: `${ergebnis.diesAdQuem} · 24.00 Uhr`, akzent: true },
            ].map((c) => (
              <EckdatenKachel key={c.label} label={c.label} wert={c.val} num akzent={c.akzent} />
            ))}
          </div>
          {ergebnis.erstrecktBis && (
            <div className=" border border-line bg-ok-bg p-3 text-body-s text-ok-text">
              Nach Erstreckung: <strong>{ergebnis.erstrecktBis}</strong> (24.00 Uhr).
            </div>
          )}
          <ErgebnisAnzeige titel="ZPO-Fristberechnung (Art. 142 ff. ZPO)" ergebnis={ergebnis} />
          <FristenKalender
            ereignisISO={ergebnis.ereignisISO}
            aQuoISO={ergebnis.diesAQuoISO}
            adQuemISO={ergebnis.diesAdQuemISO}
            kanton={form.kanton}
            stillstandAktiv={ergebnis.stillstandAktiv}
          />
          {/* Fristbeginn-Norm aus der Engine (§5): Tagesfrist → Art. 142
              Abs. 1, Wochen-/Monats-/Jahresfrist → Abs. 2 (normverweise[0]).
              Deploy-Bug-Check 7.6.2026 (HOCH): war hartcodiert «Abs. 1» und
              widersprach bei Monatsfristen dem eigenen Normen-Satz. */}
          <BegruendungSlot ergebnis={ergebnis} zusatz={fristbeginnZusatz(ergebnis.diesAQuoISO, ergebnis.fristbeginnNorm)} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig} query={zpoQuery}
            ics={[{ endISO: ergebnis.diesAdQuemISO, titel: icsTitel, beschreibung: ergebnis.ergebnis, dateiName: 'ZPO-Frist.ics' }]} />
        </ErgebnisBlock>
      )}
      </>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
