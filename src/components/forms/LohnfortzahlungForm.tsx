import { BeispielChips, BeruehrtRahmen, Checkbox, FehlerBox, Field, GruppenTitel, inputCls } from '../vorlagen/ui';
import { NormText } from '../NormText';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { useState } from 'react';
import { BetragsFeld } from '../BetragsFeld';
import type { LohnfortzahlungInput, Kanton, Verhinderungsgrund } from '../../types/legal';
import { berechneLohnfortzahlung } from '../../lib/lohnfortzahlung';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, permalinkLesen, istISO, istKanton, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { FristenKalender } from '../FristenKalender';
import { getStandardKanton } from '../../lib/einstellungen';

const KANTONE: { code: Kanton; name: string }[] = [
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'ZH', name: 'Zürich' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'ZG', name: 'Zug ⚠' },
  { code: 'GR', name: 'Graubünden ⚠' },
  { code: 'BE', name: 'Bern' },
  { code: 'AG', name: 'Aargau' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'LU', name: 'Luzern' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'UR', name: 'Uri' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'GL', name: 'Glarus' },
  { code: 'FR', name: 'Freiburg' },
  { code: 'VS', name: 'Wallis' },
  { code: 'VD', name: 'Waadt' },
  { code: 'GE', name: 'Genf' },
  { code: 'NE', name: 'Neuenburg' },
  { code: 'JU', name: 'Jura' },
  { code: 'TI', name: 'Tessin' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'AR', name: 'Appenzell AR' },
  { code: 'AI', name: 'Appenzell AI' },
];

const SKALEN_HINWEIS =
  'Die Lohnfortzahlungsskalen sind GERICHTSPRAXIS zur Konkretisierung von Art. 324a Abs. 2 OR ' +
  '(«angemessen längere Zeit») – keine Gesetzesnormen. ' +
  'Quelle: anerkannte kantonale Skalen. Stand: unregelmässig aktualisierte Gerichtspraxis. ' +
  'Vor Produktiveinsatz gegen aktuelle kantonale Praxis abzugleichen.';

const DEFAULTS: LohnfortzahlungInput = {
  vertragsbeginn: '2024-01-01',
  verhinderungBeginn: '2026-01-01',
  arbeitsunfaehigkeitProzent: 100,
  kanton: 'BS',
  ktgGleichwertigVorhanden: false,
};


// §6 Eingabevalidierung
function validiere(f: LohnfortzahlungInput): string[] {
  const fehler: string[] = [];
  if (f.verhinderungBeginn < f.vertragsbeginn) fehler.push('Beginn der Verhinderung liegt vor dem Vertragsbeginn.');
  if (f.verhinderungEnde && f.verhinderungEnde < f.verhinderungBeginn) fehler.push('Ende der Verhinderung liegt vor dem Beginn.');
  if (f.arbeitsunfaehigkeitProzent <= 0 || f.arbeitsunfaehigkeitProzent > 100) fehler.push('Arbeitsunfähigkeit muss zwischen 1 und 100 % liegen.');
  if (f.pensumProzent != null && (f.pensumProzent <= 0 || f.pensumProzent > 100)) fehler.push('Beschäftigungsgrad muss zwischen 1 und 100 % liegen.');
  if (f.monatslohnBrutto != null && f.monatslohnBrutto < 0) fehler.push('Monatslohn darf nicht negativ sein.');
  if (f.bereitsBezogeneTageImDienstjahr != null && f.bereitsBezogeneTageImDienstjahr < 0) fehler.push('Bereits bezogene Tage dürfen nicht negativ sein.');
  if (f.arbeitsverhaeltnisEnde && f.arbeitsverhaeltnisEnde < f.vertragsbeginn) fehler.push('Ende des Arbeitsverhältnisses liegt vor dem Vertragsbeginn.');
  return fehler;
}

const BEISPIELE: { label: string; form: Partial<LohnfortzahlungInput> }[] = [
  { label: 'Krankheit 3. DJ (BS)', form: { vertragsbeginn: '2024-01-01', verhinderungBeginn: '2026-01-01', arbeitsunfaehigkeitProzent: 100, kanton: 'BS' } },
  { label: 'Teil-AUF 50 %', form: { vertragsbeginn: '2024-01-01', verhinderungBeginn: '2026-01-01', arbeitsunfaehigkeitProzent: 50, kanton: 'BS' } },
  { label: 'DJ-übergreifend', form: { vertragsbeginn: '2024-01-01', verhinderungBeginn: '2025-12-01', verhinderungEnde: '2026-06-01', kanton: 'BS' } },
  { label: 'KTG vorhanden', form: { ktgGleichwertigVorhanden: true, kanton: 'ZH' } },
];

// Permalink (FAHRPLAN-PRAXIS 1.3)
const LF_LINK_SPEC: PermalinkSpec<LohnfortzahlungInput & Record<string, unknown>> = {
  vertragsbeginn: { p: 'vb', typ: 'str', gueltig: istISO },
  verhinderungBeginn: { p: 'a', typ: 'str', gueltig: istISO },
  verhinderungsgrund: { p: 'g', typ: 'str', gueltig: einerVon('krankheit', 'unfall', 'schwangerschaft', 'dienst', 'amt', 'uebrige') },
  verhinderungEnde: { p: 've', typ: 'str', gueltig: istISO },
  arbeitsunfaehigkeitProzent: { p: 'au', typ: 'num', gueltig: (n) => n >= 1 && n <= 100 },
  pensumProzent: { p: 'pp', typ: 'num', gueltig: (n) => n >= 1 && n <= 100 },
  kanton: { p: 'k', typ: 'str', gueltig: istKanton },
  ktgGleichwertigVorhanden: { p: 'kt', typ: 'bool' },
  monatslohnBrutto: { p: 'ml', typ: 'num', gueltig: (n) => n >= 0 },
  // B3/B4-Fix 10.6.2026 (SHK-Abgleich): Vorabsenzen-Verrechnung + AV-Ende-Kappung
  bereitsBezogeneTageImDienstjahr: { p: 'bz', typ: 'num', gueltig: (n) => n >= 0 },
  arbeitsverhaeltnisEnde: { p: 'ave', typ: 'str', gueltig: istISO },
};

// RL-25b (rechtslogik-rest-01/-05): Kalender-Beschriftung. Nach Karenzfrist
// beginnt der Zeitraum nicht mit der Verhinderung; bei Unfall/Dienst ist er
// nur die «beschränkte Zeit» einer Differenzpflicht (Art. 324b Abs. 2 OR).
function kalenderLabels(nachKarenz: boolean, grund: Verhinderungsgrund | undefined) {
  const beginn = nachKarenz ? 'Beginn des Anspruchs (nach Karenzfrist)' : 'Beginn der Verhinderung';
  const differenz = grund === 'unfall' || grund === 'dienst';
  return {
    ereignis: beginn,
    aquo: beginn,
    adquem: differenz ? 'Ende der beschränkten Zeit' : 'Letzter bezahlter Tag',
    band: differenz ? 'beschränkte Zeit (Differenz zu 80 %, Art. 324b Abs. 2 OR)' : 'bezahlter Zeitraum',
  };
}

export function LohnfortzahlungForm() {
  const [form, setForm] = useState<LohnfortzahlungInput>(() => {
    // Standard-Kanton (Einstellungen) als Default; ein Permalink-Kanton geht
    // weiter vor (Auftrag David – konsistent zu den Schwesterformularen).
    try { return { ...DEFAULTS, kanton: getStandardKanton(), ...permalinkLesen(LF_LINK_SPEC, window.location.search) }; }
    catch { return { ...DEFAULTS, kanton: getStandardKanton() }; }
  });
  const [erweitert, setErweitert] = useState(false);

  const set = <K extends keyof LohnfortzahlungInput>(k: K, v: LohnfortzahlungInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setKtg = (k: keyof NonNullable<LohnfortzahlungInput['ktgKriterien']>, v: number | boolean | undefined) =>
    setForm((f) => ({ ...f, ktgKriterien: { ...f.ktgKriterien, [k]: v } }));

  const ladeBeispiel = (b: Partial<LohnfortzahlungInput>) => setForm({ ...DEFAULTS, ...b });

  // Live-Berechnung
  const fehler = validiere(form);
  let ergebnis: ReturnType<typeof berechneLohnfortzahlung> | null = null;
  if (fehler.length === 0) { try { ergebnis = berechneLohnfortzahlung(form); } catch { ergebnis = null; } }

  const eingaben = {
    'Vertragsbeginn': form.vertragsbeginn,
    'Beginn Verhinderung': form.verhinderungBeginn,
    ...(form.verhinderungEnde ? { 'Ende Verhinderung': form.verhinderungEnde } : {}),
    ...(form.bereitsBezogeneTageImDienstjahr ? { 'Bereits bezogene Tage im DJ': String(form.bereitsBezogeneTageImDienstjahr) } : {}),
    ...(form.arbeitsverhaeltnisEnde ? { 'Ende Arbeitsverhältnis': form.arbeitsverhaeltnisEnde } : {}),
    'Arbeitsunfähigkeit': `${form.arbeitsunfaehigkeitProzent} %`,
    ...(form.pensumProzent != null && form.pensumProzent !== 100 ? { 'Pensum': `${form.pensumProzent} %` } : {}),
    'Kanton': form.kanton,
    'KTG gleichwertig': form.ktgGleichwertigVorhanden ? 'Ja' : 'Nein',
    ...(form.monatslohnBrutto ? { 'Monatslohn brutto (CHF)': String(form.monatslohnBrutto) } : {}),
  };

  // PDF: domänenspezifischer Disclaimer (GAV-/Skalen-Hinweis ist HIER einschlägig).
  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Lohnfortzahlung bei Verhinderung (Art. 324a OR)',
    domain: 'arbeitsrecht',
    fileBase: 'Lohnfortzahlung',
    inputs: eingaben,
    sections: ergebnis ? [{ titel: 'Lohnfortzahlung (Art. 324a OR)', ergebnis }] : [],
    disclaimer:
      'Automatisierte Orientierungsberechnung der Lohnfortzahlung (Art. 324a OR) – keine Rechtsberatung. ' +
      'Abweichende GAV-/Vertrags-/Versicherungslösungen, der genaue Sachverhalt sowie alle Norm- und ' +
      'Rechtsprechungsverweise sind im Einzelfall zu prüfen. Die Lohnfortzahlungsskalen sind Gerichtspraxis ' +
      'und vor Produktiveinsatz gegen die aktuelle kantonale Praxis abzugleichen.',
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6 lc-rechner-spalten">
      {/* Skalen-Hinweis – kompakt, aufklappbar */}
      <PflichtDisclaimer kurz="Skalen = Gerichtspraxis, nicht gerichtsverbindlich (Art. 324a Abs. 2 OR)." text={SKALEN_HINWEIS} />

      {/* Beispiele */}
      <BeispielChips items={BEISPIELE.map((b) => ({ label: b.label, laden: () => ladeBeispiel(b.form) }))} />

      {/* Eingaben */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Vertragsbeginn">
          <DatumsFeld value={form.vertragsbeginn} onChange={(v) => set('vertragsbeginn', v)} className={inputCls} />
        </Field>

        <Field label="Beginn der Arbeitsverhinderung" hint="Stichtag für Dienstjahr-Berechnung">
          <DatumsFeld value={form.verhinderungBeginn} onChange={(v) => set('verhinderungBeginn', v)} className={inputCls} />
        </Field>

        <Field label="Verhinderungsgrund" hint="Steuert die Koordination mit Versicherungen (Art. 324b OR)">
          <select value={form.verhinderungsgrund ?? 'krankheit'} onChange={(e) => set('verhinderungsgrund', e.target.value as Verhinderungsgrund)} className={inputCls}>
            <option value="krankheit">Krankheit</option>
            <option value="unfall">Unfall (UVG)</option>
            <option value="schwangerschaft">Schwangerschaft (Art. 324a Abs. 3)</option>
            <option value="dienst">Militär-/Zivil-/Schutzdienst (EO)</option>
            <option value="amt">Öffentliches Amt</option>
            <option value="uebrige">Übrige persönliche Gründe</option>
          </select>
        </Field>

        <Field label="Kanton" hint="BS/BL → Basler Skala · ZH/SH/TG → Zürcher Skala · Übrige → Berner Skala">
          <select value={form.kanton} onChange={(e) => set('kanton', e.target.value as Kanton)} className={inputCls}>
            {KANTONE.map((k) => (
              <option key={k.code} value={k.code}>{k.code} – {k.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Arbeitsunfähigkeit (%)" hint="100 = vollständig; z.B. 50 = halb (Budget-Modell)">
          <input
            type="number" inputMode="decimal" min={1} max={100} step={5}
            value={form.arbeitsunfaehigkeitProzent}
            onChange={(e) => set('arbeitsunfaehigkeitProzent', Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <Field label="Monatslohn brutto (CHF)" optional hint="Für Betragsangabe; kein Einfluss auf Dauer">
          <BetragsFeld
            value={form.monatslohnBrutto != null ? String(form.monatslohnBrutto) : ''}
            onChange={(v) => set('monatslohnBrutto', Number.isFinite(Number(v)) && v ? Number(v) : undefined)}
            className={inputCls}
            placeholder="Leer = kein Betrag"
          />
        </Field>

        <Field label="Beschäftigungsgrad / Pensum (%)" hint="Teilzeit; getrennt vom AUF-Grad (SHK N 54)">
          <input
            type="number" inputMode="decimal" min={1} max={100} step={5}
            value={form.pensumProzent ?? 100}
            onChange={(e) => set('pensumProzent', Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <Field label="KTG-Versicherung gleichwertig?">
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2.5 py-1.5 text-body-s cursor-pointer">
              <input type="radio" name="ktg" checked={!form.ktgGleichwertigVorhanden} onChange={() => set('ktgGleichwertigVorhanden', false)} />
              Nein (Skala gilt)
            </label>
            <label className="flex items-center gap-2.5 py-1.5 text-body-s cursor-pointer">
              <input type="radio" name="ktg" checked={form.ktgGleichwertigVorhanden} onChange={() => set('ktgGleichwertigVorhanden', true)} />
              Ja (KTG-Regime, Art. 324b OR)
            </label>
          </div>
        </Field>
      </div>

      {/* §2.6 KTG-Gleichwertigkeits-Checkliste */}
      {form.ktgGleichwertigVorhanden && (
        <div className="lc-card p-4 space-y-3">
          {/* LM-101-Muster: Buchstabenzusatz (324a) darf die uppercase-Overline
              nicht durchlaufen (Muster wie MietrechtForm.tsx / VorlageKlageOrdentlich.tsx:305). */}
          <GruppenTitel><NormText text={`Gleichwertigkeits-Checkliste `} /><span className="normal-case"><NormText text={`(Art. 324a Abs. 4 OR, Orientierung)`} /></span></GruppenTitel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Taggeld (% des Lohnes)" hint="Richtwert ≥ 80 %">
              <input type="number" inputMode="decimal" min={0} max={100} className={inputCls}
                value={form.ktgKriterien?.taggeldProzent ?? ''} placeholder="z.B. 80"
                onChange={(e) => setKtg('taggeldProzent', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Leistungsdauer (Tage)" hint="Richtwert ≥ 720">
              <input type="number" inputMode="decimal" min={0} className={inputCls}
                value={form.ktgKriterien?.leistungsdauerTage ?? ''} placeholder="z.B. 720"
                onChange={(e) => setKtg('leistungsdauerTage', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Karenzfrist (Tage)" hint="max. 3 Tage zulässig">
              <input type="number" inputMode="decimal" min={0} className={inputCls}
                value={form.ktgKriterien?.karenzTage ?? ''} placeholder="z.B. 2"
                onChange={(e) => setKtg('karenzTage', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Arbeitgeber-Prämienanteil (%)" hint="mind. 50 %">
              <input type="number" inputMode="decimal" min={0} max={100} className={inputCls}
                value={form.ktgKriterien?.praemienAnteilArbeitgeberProzent ?? ''} placeholder="z.B. 50"
                onChange={(e) => setKtg('praemienAnteilArbeitgeberProzent', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
          </div>
          {/* RL-25b (rechtslogik-rest-03): dreiwertig statt Checkbox — «nein» macht
              die KTG-Abrede formungültig (Engine rechnet die Skala), «nicht
              angegeben» belässt die Annahme; eine leere Checkbox war beides. */}
          <Field label="Schriftlich / in GAV-NAV vereinbart?" hint="Gültigkeitsvoraussetzung (Art. 324a Abs. 4 OR)">
            <select className={inputCls}
              value={form.ktgKriterien?.schriftlichVereinbart == null ? '' : form.ktgKriterien.schriftlichVereinbart ? 'ja' : 'nein'}
              onChange={(e) => setKtg('schriftlichVereinbart', e.target.value === '' ? undefined : e.target.value === 'ja')}>
              <option value="">nicht angegeben</option>
              <option value="ja">ja</option>
              <option value="nein">nein – Abrede unwirksam, gesetzliche Skala</option>
            </select>
          </Field>
          {/* B5-Fix 6.6.2026: Kriterium war in der Engine vorhanden (lohnfortzahlung.ts),
              aber im UI nie erreichbar — die Checkliste war unvollständig (§8). */}
          <Checkbox checked={form.ktgKriterien?.alleRisikenAbgedeckt ?? true}
            onChange={(v) => setKtg('alleRisikenAbgedeckt', v)}
            label="Alle relevanten Risiken abgedeckt (Krankheit UND Unfall bzw. UVG-Deckung)" />
        </div>
      )}

      {/* Erweiterte Eingaben – kein overflow-hidden, sonst wird das
          DatumsFeld-Popover abgeschnitten; Rundung trägt der Button selbst. */}
      <div className="border border-line ">
        <button type="button" onClick={() => setErweitert(!erweitert)}
          aria-expanded={erweitert} aria-controls="lf-erweiterte-eingaben"
          className={`w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-brass-100 text-left ${erweitert ? '' : ''}`}>
          <span className="text-body-s font-medium text-ink-700">Erweiterte Eingaben (Anspruch, DJ-übergreifend, Lohnbasis)</span>
          <span className="text-ink-500" aria-hidden="true">{erweitert ? '▲' : '▼'}</span>
        </button>
        {erweitert && (
          <div id="lf-erweiterte-eingaben" className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ende der Verhinderung" optional hint="§2.1 für DJ-übergreifende Verhinderung (zwei Kredite)">
              <DatumsFeld value={form.verhinderungEnde ?? ''} className={inputCls}
                onChange={(v) => set('verhinderungEnde', v || undefined)} />
            </Field>
            <Field label="Bereits bezogene Tage im laufenden Dienstjahr" optional hint="frühere Absenzen verbrauchen das Kontingent (SHK Art. 324a N 52)">
              <input type="number" inputMode="decimal" min={0} className={inputCls} placeholder="0"
                value={form.bereitsBezogeneTageImDienstjahr ?? ''}
                onChange={(e) => set('bereitsBezogeneTageImDienstjahr', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Ende des Arbeitsverhältnisses" optional hint="Lohnfortzahlung endet mit dem AV (BGE 127 III 318); KTG-Nachdeckung prüfen">
              <DatumsFeld value={form.arbeitsverhaeltnisEnde ?? ''} className={inputCls}
                onChange={(v) => set('arbeitsverhaeltnisEnde', v || undefined)} />
            </Field>
            <Field label="Vereinbarte Kündigungsfrist (Monate)" optional hint="§2.2 > 3 Monate → Anspruch ab Tag 1">
              <input type="number" inputMode="decimal" min={0} className={inputCls} placeholder="Leer = Standard"
                value={form.vereinbarteKuendigungsfristMonate ?? ''}
                onChange={(e) => set('vereinbarteKuendigungsfristMonate', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Anrechenbare Vordienstzeit (Monate)" optional hint="§2.2 Lehre/Praktikum/Folge-Befristung (SHK N 44)">
              <input type="number" inputMode="decimal" min={0} className={inputCls} placeholder="0"
                value={form.anrechenbareVordienstzeitMonate ?? ''}
                onChange={(e) => set('anrechenbareVordienstzeitMonate', e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <div className="flex flex-col justify-end gap-2">
              <Checkbox checked={form.befristetFest ?? false}
                onChange={(v) => set('befristetFest', v)}
                label="Befristeter Vertrag fester Dauer > 3 Monate" />
              <Checkbox checked={form.dreizehnterMonatslohn ?? false}
                onChange={(v) => set('dreizehnterMonatslohn', v)}
                label="13. Monatslohn (anteilig) berücksichtigen" />
            </div>
          </div>
        )}
      </div>

      <FehlerBox fehler={fehler} />

      {ergebnis && (
        <ErgebnisBlock>
          <ErgebnisAnzeige titel="Lohnfortzahlung (Art. 324a OR)" ergebnis={ergebnis} />
          {ergebnis.status === 'ok' && ergebnis.zeitraumVonISO && ergebnis.letzterTagISO && (
            <FristenKalender
              ereignisISO={ergebnis.zeitraumVonISO}
              aQuoISO={ergebnis.zeitraumVonISO}
              adQuemISO={ergebnis.letzterTagISO}
              kanton={form.kanton}
              stillstandAktiv={false}
              feiertage={false}
              labels={kalenderLabels(ergebnis.zeitraumVonISO !== form.verhinderungBeginn, form.verhinderungsgrund)}
            />
          )}
          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(LF_LINK_SPEC, form as LohnfortzahlungInput & Record<string, unknown>)} />
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
