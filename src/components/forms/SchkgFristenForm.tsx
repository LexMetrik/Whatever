import { KANTONE } from '../../lib/kantone';
import { BeruehrtRahmen, Checkbox, EckdatenKachel, FehlerBox, Field, GruppenTitel, inputCls } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { Tabs } from '../ui/Tabs';
import { useState } from 'react';
import { parseISO } from 'date-fns';
import { formatDatum } from '../../lib/datumsUtils';
import type { Kanton } from '../../types/legal';
import type { SchkgInput, SchkgModus, SchkgFristnatur, SchkgEinheit, SchkgErgebnis } from '../../types/schkg';
import { berechneSchkgFrist } from '../../lib/schkgFristen';
import { HEMMUNG_REGELN, PHASEN_SCHKG, PRESETS_SCHKG, SCHKG_DISCLAIMER, type SchkgPhase, type SchkgPreset } from '../../lib/schkgPresets';
import { rechtsprechung, VERIFIKATION } from '../../data/verifikation';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { DatumsFeld } from '../DatumsFeld';
import { sansAmp } from '../typografie';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { fristbeginnZusatz } from '../../lib/begruendung';
import { permalinkKodieren } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { SCHKG_LINK_SPEC } from '../../lib/rechnerPermalinks';
import { IcsExportButton } from '../IcsExportButton';
import { FristenKalender } from '../FristenKalender';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';
import type { EinfacheFristMeldung } from './einfacheFristTexte';


const EINHEITEN: { code: SchkgEinheit; label: string }[] = [
  { code: 'tage', label: 'Tage' },
  { code: 'monate', label: 'Monate' },
  { code: 'jahre', label: 'Jahre' },
];

const MODI: { code: SchkgModus; label: string }[] = [
  { code: 'schkg_betreibungsferien', label: 'SchKG-Betreibungsferien (Art. 56/63) – kein Ruhen' },
  { code: 'zpo_stillstand', label: 'ZPO-Stillstand (gerichtliche Klage, Art. 56 Abs. 2 SchKG)' },
  { code: 'kein', label: 'Kein Stillstand' },
  { code: 'schkg_wechsel', label: 'Wechselbetreibung – keine Betreibungsferien, Rechtsstillstand (Art. 56 Ziff. 3/63)' },
];

const NATUREN: { code: SchkgFristnatur; label: string }[] = [
  { code: 'frist', label: 'Frist' },
  { code: 'verwirkung', label: 'Verwirkungsfrist' },
  { code: 'wartefrist', label: 'Wartefrist (frühestens)' },
  { code: 'beschwerdefrist', label: 'Beschwerdefrist' },
  { code: 'klagefrist', label: 'Klagefrist' },
  { code: 'ordnungsfrist', label: 'Ordnungsfrist' },
];

const NATUR_BADGE: Partial<Record<SchkgFristnatur, { cls: string; label: string }>> = {
  verwirkung: { cls: 'lc-badge-danger', label: 'Verwirkung' },
  wartefrist: { cls: 'lc-badge-warn', label: 'Wartefrist' },
  ordnungsfrist: { cls: 'lc-badge-soft', label: 'Ordnung' },
};

type FormState = {
  ereignis: string;
  einheit: SchkgEinheit;
  laenge: number;
  modus: SchkgModus;
  fristnatur: SchkgFristnatur;
  kanton: Kanton;
  ausloeser: string;
};

const DEFAULTS: FormState = {
  ereignis: '2025-07-15',
  einheit: 'tage',
  laenge: 10,
  modus: 'schkg_betreibungsferien',
  fristnatur: 'frist',
  kanton: 'ZH',
  ausloeser: 'Zustellung Zahlungsbefehl',
};


// Permalink (FAHRPLAN-PRAXIS 1.3): Form + Phase/Preset + Hemmung/Rechtsstillstand.
// Spec seit FE-3 in lib/rechnerPermalinks.ts (eine Spec, zwei Nutzer: die
// Form liest/teilt, der Preset-Index des Tagerechners baut dieselben Links).

export function SchkgFristenForm({ live }: {
  /** Live-Brücke des Tagerechners (Auftrag David 1.9.2026): die oben
   *  BERÜHRTEN Felder überschreiben die geteilten Felder hier, damit der
   *  Rechenweg automatisch mitrechnet. */
  live?: EinfacheFristMeldung;
} = {}) {
  const ausLink = usePermalinkFelder(SCHKG_LINK_SPEC);
  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULTS,
    kanton: getStandardKanton(), // Standard-Kanton (Einstellungen); Permalink unten geht vor
    ...(ausLink.ereignis ? { ereignis: ausLink.ereignis } : {}),
    ...(ausLink.einheit ? { einheit: ausLink.einheit as FormState['einheit'] } : {}),
    ...(ausLink.laenge != null ? { laenge: ausLink.laenge } : {}),
    ...(ausLink.modus ? { modus: ausLink.modus as FormState['modus'] } : {}),
    ...(ausLink.fristnatur ? { fristnatur: ausLink.fristnatur as FormState['fristnatur'] } : {}),
    ...(ausLink.kanton ? { kanton: ausLink.kanton as FormState['kanton'] } : {}),
    ...(ausLink.ausloeser != null ? { ausloeser: ausLink.ausloeser } : {}),
  }));
  const [phase, setPhase] = useState<SchkgPhase>(() =>
    (ausLink.phase as SchkgPhase | undefined)
      ?? PRESETS_SCHKG.find((x) => x.key === ausLink.presetKey)?.phase
      ?? 'einleitung');
  const [aktiv, setAktiv] = useState<SchkgPreset | null>(() => PRESETS_SCHKG.find((x) => x.key === ausLink.presetKey) ?? null);
  const [override, setOverride] = useState<SchkgModus | ''>((ausLink.override as SchkgModus | undefined) ?? '');
  const [hemmung, setHemmung] = useState<{ an: boolean; von: string; bis: string; von2: string; bis2: string }>({
    an: ausLink.hemmungAn ?? false, von: ausLink.hemmungVon ?? '', bis: ausLink.hemmungBis ?? '',
    von2: ausLink.hemmung2Von ?? '', bis2: ausLink.hemmung2Bis ?? '',
  });
  const [rechtsstillstand, setRechtsstillstand] = useState<{ an: boolean; von: string; bis: string }>({ an: ausLink.rsAn ?? false, von: ausLink.rsVon ?? '', bis: ausLink.rsBis ?? '' });

  // Live-Brücke: Sync während des Renderns (Muster «adjusting state»);
  // Referenzvergleich genügt, die Seite hält `live` im State. Anwendungsregel
  // (GP-Befund B2): oben Berührtes gewinnt immer; Unberührtes füllt nur
  // Felder, die hier weder aus dem Permalink stammen noch von Hand geändert
  // wurden. Der aktive Preset fällt nur bei echter Wert-Änderung.
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
      // Einheit: der einfache Rechner bietet im SchKG-Regime keine Wochen
      // an (einheitEffektiv) — der Cast engt denselben Wert nur typseitig ein.
      const wert = k === 'einheit' ? (live.werte.einheit as SchkgEinheit) : live.werte[k];
      if (live.beruehrt.includes(k) || (!ausLinkFelder[feld] && form[feld] === mountForm[feld])) {
        if (n[feld] !== wert) { (n as Record<string, unknown>)[feld] = wert; geaendert = true; }
      }
    });
    if (geaendert) {
      setForm(n);
      setAktiv(null);
    }
  }

  const pk = usePaneKlasse();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const presetsDerPhase = PRESETS_SCHKG.filter((p) => p.phase === phase);

  const ladePreset = (p: SchkgPreset) => {
    setAktiv(p);
    setOverride('');
    setHemmung({ an: false, von: '', bis: '', von2: '', bis2: '' });
    setForm((f) => ({
      ...f,
      modus: p.modus,
      fristnatur: p.fristnatur,
      ausloeser: p.ausloeser,
      ...(p.einheit ? { einheit: p.einheit } : {}),
      ...(p.laenge != null ? { laenge: p.laenge } : {}),
    }));
  };

  const wechslePhase = (code: SchkgPhase) => { setPhase(code); setAktiv(null); setOverride(''); };

  // Gemeinsame Eingabe-Basis
  // EINE Quelle für Engine-Input UND Anzeige (/simplify 7.6.2026: die
  // Bedingung stand zuvor doppelt — die Gleichheit war nur kommentargestützt).
  const aktiverOverride = aktiv?.modusUmstritten && override ? override : undefined;

  // RL-19 / F2-06: Die Hemmung wirkt nur, wo das Gesetz sie vorsieht — bei
  // Presets mit `hemmungMoeglich` (oder ohne Preset, manueller Weg). Vorher
  // rechnete ein Link mit `ha=1` die Hemmung auch bei verborgenem Feld ein
  // (z. B. Art. 116 SchKG, der keinen Stillstand kennt).
  const hemmungErlaubt = !aktiv || !!aktiv.hemmungMoeglich;
  const hemmungRegel = HEMMUNG_REGELN[aktiv?.hemmungNorm ?? 'standard'];
  const hemmungAktiv = hemmungErlaubt && hemmung.an;
  const zweiterZeitraum = hemmungAktiv && hemmungRegel.zeitraum2 !== undefined;

  const basis = (einheit: SchkgEinheit, laenge: number, fristnatur: SchkgFristnatur, mitHemmung: boolean): SchkgInput => ({
    ereignis: form.ereignis,
    einheit,
    laenge,
    modus: form.modus,
    fristnatur,
    kanton: form.kanton,
    ausloeser: form.ausloeser,
    modusOverride: aktiverOverride,
    hemmungVon: mitHemmung && hemmungAktiv ? hemmung.von : undefined,
    hemmungBis: mitHemmung && hemmungAktiv ? hemmung.bis : undefined,
    hemmung2Von: mitHemmung && zweiterZeitraum && hemmung.von2 ? hemmung.von2 : undefined,
    hemmung2Bis: mitHemmung && zweiterZeitraum && hemmung.bis2 ? hemmung.bis2 : undefined,
    hemmungNorm: aktiv?.hemmungNorm,
    rechtsstillstandVon: rechtsstillstand.an ? rechtsstillstand.von : undefined,
    rechtsstillstandBis: rechtsstillstand.an ? rechtsstillstand.bis : undefined,
  });

  const fehler: string[] = [];
  if (!form.ereignis) fehler.push('Bitte ein auslösendes Ereignis (Datum) angeben.');
  if (hemmungAktiv && (!hemmung.von || !hemmung.bis)) fehler.push('Hemmung: Start- und Enddatum des hemmenden Verfahrens angeben.');
  if (zweiterZeitraum && !hemmung.von2 !== !hemmung.bis2) fehler.push('Hemmung, 2. Zeitraum: Start- und Enddatum angeben oder beide leer lassen.');
  if (rechtsstillstand.an && (!rechtsstillstand.von || !rechtsstillstand.bis)) fehler.push('Rechtsstillstand: Start- und Enddatum angeben.');

  const istDual = !!(aktiv?.wartefrist && aktiv?.verwirkung);
  const istInfo = !!aktiv?.infoOnly;

  // Berechnung
  type Ausgabe = { titel: string; natur: SchkgFristnatur; ergebnis: SchkgErgebnis };
  const ausgaben: Ausgabe[] = [];
  if (fehler.length === 0 && !istInfo) {
    try {
      if (istDual && aktiv) {
        // RL-19 / F2-06: Art. 154 Abs. 1 SchKG — «diese Fristen» stehen still,
        // auch die frühestens-Frist (HEMMUNG_REGELN.auchWartefrist).
        ausgaben.push({ titel: 'Wartefrist (frühestens)', natur: 'wartefrist', ergebnis: berechneSchkgFrist(basis(aktiv.wartefrist!.einheit, aktiv.wartefrist!.laenge, 'wartefrist', hemmungRegel.auchWartefrist)) });
        ausgaben.push({ titel: 'Verwirkungsfrist (spätestens)', natur: 'verwirkung', ergebnis: berechneSchkgFrist(basis(aktiv.verwirkung!.einheit, aktiv.verwirkung!.laenge, 'verwirkung', true)) });
      } else {
        ausgaben.push({ titel: 'SchKG-Fristberechnung', natur: form.fristnatur, ergebnis: berechneSchkgFrist(basis(form.einheit, form.laenge, form.fristnatur, true)) });
      }
    } catch (err) {
      fehler.push((err as Error).message);
    }
  }

  const verweise = (aktiv?.verweise ?? []).filter((k) => k in VERIFIKATION).map((k) => rechtsprechung(k as keyof typeof VERIFIKATION));

  // Ultra-Review NIEDRIG (7.6.2026): Anzeige/PDF aus DERSELBEN Quelle wie
  // der Engine-Input — strukturell statt per Auge (aktiverOverride oben).
  const effektivesRegime = aktiverOverride ?? form.modus;

  // RL-17 / W-09: Schalter «Angefochten ist eine Betreibungshandlung». Kein
  // eigener State — der Schalter IST das Regime des Presets (`modus` = «nein»,
  // `modusBeiBetreibungshandlung` = «ja»); Permalink und PDF tragen ihn so über
  // das Stillstand-Regime mit, ohne zweite Quelle.
  const bhModus = aktiv?.modusBeiBetreibungshandlung;
  const bhJa = bhModus !== undefined && form.modus === bhModus;

  const eingaben: Record<string, string> = {
    'Auslösendes Ereignis': form.ereignis,
    'Auslöser': form.ausloeser,
    'Stillstand-Regime': MODI.find((m) => m.code === effektivesRegime)?.label ?? form.modus,
    'Kanton': form.kanton,
    ...(istDual ? {} : { 'Frist': `${form.laenge} ${form.einheit}`, 'Rechtsnatur': form.fristnatur }),
    ...(bhModus !== undefined ? { 'Angefochten ist eine Betreibungshandlung': bhJa ? 'ja' : 'nein' } : {}),
  };

  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  // EINE Quelle für Teilen-Link UND .ics-Rücklinks (§5; Bug-Check 7.6.2026 N-2).
  const schkgQuery = () => permalinkKodieren(SCHKG_LINK_SPEC, {
    ...form, phase, presetKey: aktiv?.key, override: override || undefined,
    hemmungAn: hemmung.an, hemmungVon: hemmung.von || undefined, hemmungBis: hemmung.bis || undefined,
    hemmung2Von: hemmung.von2 || undefined, hemmung2Bis: hemmung.bis2 || undefined,
    rsAn: rechtsstillstand.an, rsVon: rechtsstillstand.von || undefined, rsBis: rechtsstillstand.bis || undefined,
  });

  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'SchKG-Fristberechnung',
    domain: 'schkg-fristen',
    fileBase: 'SchKG-Fristen',
    inputs: eingaben,
    sections: ausgaben.map((a) => ({ titel: a.titel, ergebnis: a.ergebnis })),
    notes: aktiv?.hinweis ? [`${aktiv.label} (${aktiv.norm}): ${aktiv.hinweis}`] : undefined,
    disclaimer: SCHKG_DISCLAIMER,
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6">
      {/* Pflicht-Disclaimer */}
      <PflichtDisclaimer kurz="Rechnerische Orientierung (Art. 31/56/63 SchKG, Schnittstelle Art. 145 ZPO). Betreibungsferien ≠ Gerichtsferien." text={SCHKG_DISCLAIMER} />

      {/* Verfahrensphase */}
      <div className="space-y-2">
        <GruppenTitel>Verfahrensphase wählen</GruppenTitel>
        <Tabs items={PHASEN_SCHKG.map((p) => ({ code: p.code, label: p.label }))} value={phase} onChange={wechslePhase} mode="pressed" ariaLabel="Verfahrensphase" />
      </div>

      {/* Frist-Preset — PRIMÄRWEG (UX B11): die Vorlage setzt alle Parameter;
          die manuellen Felder darunter sind der Kontroll-/Sonderfall-Weg. */}
      <div className={pk(' border border-brass-500 bg-brass-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end', ' border border-brass-500 bg-brass-100 p-4 grid grid-cols-1 @lg/pane:grid-cols-2 gap-4 items-end')}>
        <Field label="Frist-Vorlage (empfohlener Einstieg)" hint="Setzt Stillstand-Regime, Rechtsnatur, Länge und Auslöser automatisch — manuelle Felder unten nur für Sonderfälle">
          <select value={aktiv?.key ?? ''} onChange={(e) => { const p = presetsDerPhase.find((x) => x.key === e.target.value); if (p) ladePreset(p); else setAktiv(null); }} className={inputCls}>
            <option value="">– Vorlage wählen (oder manuell unten) –</option>
            {presetsDerPhase.map((p) => <option key={p.key} value={p.key}>{p.label} · {p.norm}</option>)}
          </select>
        </Field>
        {aktiv?.hinweis && (
          <div className="lc-notice"><p className="text-body-s text-ink-600">{aktiv.hinweis}</p></div>
        )}
      </div>

      {verweise.length > 0 && (
        <div className="lc-panel p-3 space-y-1">
          <p className="lc-overline">Rechtsprechung (zu verifizieren)</p>
          {verweise.map((r) => (
            <p key={r.aktenzeichen} className="text-body-s text-ink-600">
              <span className="lc-badge lc-badge-warn mr-1.5">{r.verifiziert ? 'verifiziert' : 'zu verifizieren'}</span>
              <strong>{r.aktenzeichen}</strong> – {r.aussage}
            </p>
          ))}
        </div>
      )}

      {/* Eingaben */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Auslösendes Ereignis (Datum)" hint={form.ausloeser}>
          <DatumsFeld value={form.ereignis} onChange={(v) => set('ereignis', v)} className={inputCls} />
        </Field>

        {/* ZWEI Controls in EINEM Field: die sichtbare Beschriftung «Fristtyp
            & Länge» steht über beiden und kann darum keinem von beiden per
            `htmlFor` gehören (ein `label` beschriftet genau ein Control).
            Beide bekommen deshalb einen eigenen zugänglichen Namen — sonst
            sind sie für Screenreader und Sprachsteuerung namenlos (gemessen
            am Flächen-Tor 5.9.2026: `label` + `select-name`, beide critical).
            Die Namen wiederholen das Sichtbare und ergänzen die Rolle, damit
            «Länge» und «Einheit» unterscheidbar bleiben. */}
        {!istDual && !istInfo && (
          <Field label="Fristtyp & Länge">
            <div className="flex gap-2">
              <input type="number" inputMode="decimal" min={1} step={1} value={form.laenge} onChange={(e) => set('laenge', Number(e.target.value))} className={inputCls + ' w-24'} aria-label="Länge der Frist (Anzahl)" />
              <select value={form.einheit} onChange={(e) => set('einheit', e.target.value as SchkgEinheit)} className={inputCls} aria-label="Einheit der Frist">
                {EINHEITEN.map((u) => <option key={u.code} value={u.code}>{u.label}</option>)}
              </select>
            </div>
          </Field>
        )}

        <Field label="Stillstand-Regime" hint="Betreibungshandlung → SchKG; gerichtliche Klage → ZPO-Stillstand">
          <select value={form.modus} onChange={(e) => set('modus', e.target.value as SchkgModus)} className={inputCls}>
            {MODI.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
          </select>
        </Field>

        {!istDual && !istInfo && (
          <Field label="Rechtsnatur" hint="Steuert Anzeige und Warnhinweise">
            <select value={form.fristnatur} onChange={(e) => set('fristnatur', e.target.value as SchkgFristnatur)} className={inputCls}>
              {NATUREN.map((n) => <option key={n.code} value={n.code}>{n.label}</option>)}
            </select>
          </Field>
        )}

        <Field label="Kanton" hint="Staatlich anerkannte Feiertage (Art. 31 i.V.m. Art. 142 Abs. 3 ZPO)">
          <select value={form.kanton} onChange={(e) => set('kanton', e.target.value as Kanton)} className={inputCls}>
            {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>

        {aktiv?.modusUmstritten && (
          <Field label="Override (umstrittene Summarsache, Art. 251 ZPO)" hint="Voreinstellung ergibt das frühere, sichere Datum; die spätere Lesart ist hier wählbar (siehe Hinweis)">
            <select value={override} onChange={(e) => setOverride(e.target.value as SchkgModus | '')} className={inputCls}>
              <option value="">Kein Override (Default: {MODI.find((m) => m.code === form.modus)?.label ?? form.modus})</option>
              {MODI.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
            </select>
          </Field>
        )}
      </div>

      {/* RL-17 / W-09: nur bei Presets, deren Gegenstand eine Betreibungshandlung
          sein kann (Art. 17 SchKG); Voreinstellung «nein» (Preset-Regime). */}
      {aktiv && bhModus !== undefined && (
        <Checkbox checked={bhJa} onChange={(v) => set('modus', v ? bhModus : aktiv.modus)}
          label="Angefochten ist eine Betreibungshandlung (Art. 56 SchKG)"
          hint="Nur bei einer Betreibungshandlung verlängert Art. 63 SchKG eine Frist, deren Ende in die Betreibungsferien fällt (BGE 149 III 179 E. 4.1). Voreinstellung «nein» ergibt das frühere, sichere Datum." />
      )}

      {/* Optionale Sonderlogik */}
      {hemmungErlaubt && (
        <div className="space-y-2">
          <Checkbox checked={hemmung.an} onChange={(v) => setHemmung((s) => ({ ...s, an: v }))}
            label={hemmungRegel.label} />
          {hemmung.an && (
            <div className="flex flex-wrap gap-2 items-center pl-6">
              <span className="text-body-s text-ink-500">{hemmungRegel.zeitraum1}</span>
              <DatumsFeld value={hemmung.von} onChange={(v) => setHemmung((s) => ({ ...s, von: v }))} className={inputCls} wrapperClassName="w-full sm:w-44" />
              <span className="text-body-s text-ink-500">bis</span>
              <DatumsFeld value={hemmung.bis} onChange={(v) => setHemmung((s) => ({ ...s, bis: v }))} className={inputCls} wrapperClassName="w-full sm:w-44" />
            </div>
          )}
          {hemmung.an && hemmungRegel.zeitraum2 && (
            <div className="flex flex-wrap gap-2 items-center pl-6">
              <span className="text-body-s text-ink-500">{hemmungRegel.zeitraum2}</span>
              <DatumsFeld value={hemmung.von2} onChange={(v) => setHemmung((s) => ({ ...s, von2: v }))} className={inputCls} wrapperClassName="w-full sm:w-44" />
              <span className="text-body-s text-ink-500">bis</span>
              <DatumsFeld value={hemmung.bis2} onChange={(v) => setHemmung((s) => ({ ...s, bis2: v }))} className={inputCls} wrapperClassName="w-full sm:w-44" />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Checkbox checked={rechtsstillstand.an} onChange={(v) => setRechtsstillstand((s) => ({ ...s, an: v }))}
          label="Schuldnerbezogener Rechtsstillstand (Art. 57–62 SchKG)" />
        {rechtsstillstand.an && (
          <div className="flex flex-wrap gap-2 items-center pl-6">
            <span className="text-body-s text-ink-500">von</span>
            <DatumsFeld value={rechtsstillstand.von} onChange={(v) => setRechtsstillstand((s) => ({ ...s, von: v }))} className={inputCls} wrapperClassName="w-full sm:w-44" />
            <span className="text-body-s text-ink-500">bis</span>
            <DatumsFeld value={rechtsstillstand.bis} onChange={(v) => setRechtsstillstand((s) => ({ ...s, bis: v }))} className={inputCls} wrapperClassName="w-full sm:w-44" />
          </div>
        )}
      </div>

      {/* R9-2 (6.9.2026): `role="status"`, nicht `role="alert"`. Die Meldung
          antwortet nicht auf einen Eingabefehler, sondern beschreibt eine
          ABDECKUNGSGRENZE des Rechners (§8) — es gibt nichts zu beheben, also
          unterbricht sie auch nichts. Die Blocker- und Mängellisten der Vorlagen
          tragen aus demselben Grund `role="alert"`. Wächter:
          `src/tests/design-r9-fehlerbox-baustein.test.ts`. */}
      {istInfo && aktiv && (
        <div role="status" className="lc-notice-danger">
          <p className="lc-overline text-danger-700 mb-1">Keine berechenbare Frist – {aktiv.norm}</p>
          <p className="text-body-s text-danger-700">{aktiv.hinweis}</p>
        </div>
      )}

      <FehlerBox fehler={fehler} />

      {ausgaben.length > 0 && (
        <ErgebnisBlock id="lc-ergebnis-schkg">
          {ausgaben.map((a) => {
            const e = a.ergebnis;
            const badge = NATUR_BADGE[a.natur];
            return (
              <div key={a.titel} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-h3 font-display font-semibold text-ink-900">{sansAmp(a.titel)}</h3>
                  {badge && <span className={`lc-badge ${badge.cls}`}>{badge.label}</span>}
                </div>
                <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
                  {[
                    // RL-18 (F2-03): Weicht der massgebliche Ereignistag von der
                    // Zustellung ab (Zustellung in den Betreibungsferien, BGE
                    // 121 III 284), zeigt die Kachel den Wirkungstag unter
                    // eigenem Namen; die Zustellung bleibt im Kalender markiert.
                    formatDatum(parseISO(e.ereignisISO)) === e.massgeblicherEreignistag
                      ? { label: 'Auslösendes Ereignis', val: e.massgeblicherEreignistag }
                      : { label: 'Zustellung wirkt ab', val: e.massgeblicherEreignistag },
                    { label: 'Fristbeginn (dies a quo)', val: e.diesAQuo },
                    { label: 'Fristende (dies ad quem)', val: `${e.diesAdQuem} · 24.00 Uhr`, akzent: true },
                  ].map((c) => (
                    <EckdatenKachel key={c.label} label={c.label} wert={c.val} num akzent={c.akzent} />
                  ))}
                </div>
                <ErgebnisAnzeige titel={a.titel} ergebnis={e} />
                <FristenKalender
                  ereignisISO={e.ereignisISO}
                  aQuoISO={e.diesAQuoISO}
                  adQuemISO={e.diesAdQuemISO}
                  kanton={form.kanton}
                  stillstandAktiv={e.ruhenAnzeige}
                  labels={{ ereignis: 'Auslösendes Ereignis', aquo: 'Fristbeginn', adquem: 'Fristende' }}
                />
                {/* Fristbeginn-Norm aus der Engine (§5): normverweise[1] ist
                    Art. 142 Abs. 1 (Tagesfrist) bzw. Abs. 2 (Monats-/Jahres-
                    frist). Deploy-Bug-Check 7.6.2026 (HOCH): war hartcodiert. */}
                <BegruendungSlot ergebnis={e} zusatz={fristbeginnZusatz(e.diesAQuoISO, e.fristbeginnNorm)} />
                {/* ── LM-196 (W2·17-UI-BEFUNDE/B14) · EINE FORM JE ROLLE ────────
                    Der Kalender-Export tritt in zwei Rollen auf, und die Rolle
                    bestimmt die Stelle: SEITEN-Aktion (genau EIN Fristende je
                    Seite → in der Aktionszeile neben «PDF-Rechenbericht», so in
                    Verjährung, Erbfristen, BGG, Allgemeine Frist) und FRIST-Aktion
                    (mehrere Fristenden gleichzeitig → bei SEINER Frist, so hier und
                    in `EreignisFristen`). Die Positionsabweichung, die LM-196
                    beobachtet, ist damit strukturell begründet: eine gemeinsame
                    Seiten-Aktionszeile könnte nicht sagen, WELCHE der Fristen sie
                    exportiert. Nicht begründet war die FORM — die Frist-Aktion
                    stand hier auf dem vollen `lc-btn-outline`, in `EreignisFristen`
                    auf `lc-btn-outline lc-btn-sm`. Angeglichen auf die kleine
                    Variante: dieselbe Rolle, dieselbe Form (Muster-Konsistenz). */}
                <IcsExportButton endISO={e.diesAdQuemISO} titel={`Fristende – ${a.titel}`}
                  aktenzeichen={aktenzeichen}
                  query={schkgQuery} className="lc-btn-outline lc-btn-sm"
                  beschreibung={e.ergebnis} dateiName="SchKG-Frist.ics" />
              </div>
            );
          })}
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig} query={schkgQuery} />
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
