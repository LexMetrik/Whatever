import { useEffect, useMemo, useState } from 'react';
import { NormText } from '../components/NormText';
import {
  AV_DEFAULTS, AV_MINDESTLOEHNE, AV_OFFENE_VERIFIKATIONEN,
  avZusammenstellen, pruefeAvGates, type AvAntworten, type AvUntertyp,
} from '../lib/vorlagen/arbeitsvertrag';
import { VorlageLehrvertrag } from './VorlageLehrvertrag';
import { VorlageHandelsreisendenvertrag } from './VorlageHandelsreisendenvertrag';
import { VorlageHeimarbeitsvertrag } from './VorlageHeimarbeitsvertrag';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { BetragsFeld } from '../components/BetragsFeld';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls, NormLink } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { KANTONE } from '../lib/kantone';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Einzelarbeitsvertrag (Art. 319 ff. OR) ────────────────
// Erste Vorlage auf dem generischen Wizard-Rahmen. Validierungskern ist die
// Matrix des Gutachtens 5.6.2026 (absolut/relativ zwingend, Schriftform,
// Disclosure) – siehe lib/vorlagen/arbeitsvertrag.ts. Eingaben bleiben im
// Browser (localStorage).

const SPEICHER_KEY = 'lexmetrik.vorlage.arbeitsvertrag.v1';

const SCHRITTE = [
  { id: 'parteien', label: 'Parteien' },
  { id: 'stelle', label: 'Stelle & Beginn' },
  { id: 'lohn', label: 'Lohn' },
  { id: 'zeit', label: 'Arbeitszeit & Ferien' },
  { id: 'absicherung', label: 'Absicherung & Spesen' },
  { id: 'klauseln', label: 'Besondere Klauseln' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_AV: PdfBanner = {
  titel: 'VERTRAGSENTWURF – VON BEIDEN PARTEIEN ZU UNTERZEICHNEN',
  text: 'Der Arbeitsvertrag ist formfrei gültig (Art. 320 OR); einzelne Klauseln (Konkurrenzverbot, Überstunden-Wegbedingung, abweichende Fristen, Pauschalspesen) bedürfen der Schriftform – die beidseitige Unterzeichnung dieses Vertrags erfüllt sie.',
};

const MINDESTLOHN_KANTONE = new Set(AV_MINDESTLOEHNE.map((m) => m.kanton));

// ─── Dispatcher (FAHRPLAN-VERTRAGS-VARIANTEN P1c): EINE Katalog-Karte, der
// Vertragstyp schaltet das passende Regime-Schema (§4). Einzel/Kader teilen
// das 319-ff-Regime (EinzelKaderWizard); Lehrvertrag (344 ff.) ist ein eigenes
// Schema mit eigenem Wizard. Die Regime-Wahl wird separat persistiert.
const REGIME_KEY = 'lexmetrik.vorlage.arbeitsvertrag.regime.v1';
type AvRegime = AvUntertyp | 'lehrvertrag' | 'handelsreisendenvertrag' | 'heimarbeitsvertrag';
const REGIME_OPTIONEN: { id: AvRegime; label: string; sub: string }[] = [
  { id: 'einzel', label: 'Einzelarbeitsvertrag', sub: 'Standard (Art. 319 ff. OR)' },
  { id: 'kader', label: 'Kader / Manager', sub: 'leitende Stellung, Bonus' },
  { id: 'lehrvertrag', label: 'Lehrvertrag', sub: 'Art. 344 ff. OR (Schriftform)' },
  { id: 'handelsreisendenvertrag', label: 'Handelsreisender', sub: 'Art. 347 ff. OR' },
  { id: 'heimarbeitsvertrag', label: 'Heimarbeit', sub: 'Art. 351 ff. OR' },
];

// Vertragstyp-Schalter für die Unter-Regime-Seiten (Lehrvertrag/Handelsreisender/
// Heimarbeit), die ihn als eigene Kopf-Karte erhalten. Die Haupt-Seite (Einzel/
// Kader) zeigt den Vertragstyp dagegen GEMEINSAM mit dem Detailgrad in EINER
// VariantenKopf-Karte (Redesign: keine Schalter-Stapelung mehr).
function VertragstypWahl({ regime, onWahl }: { regime: AvRegime; onWahl: (v: AvRegime) => void }) {
  // R5-F2: dieselbe Umstellung wie in `VariantenKopf` — der Schalter-Block
  // trägt Linien statt Kasten (§5).
  return (
    <fieldset className="border-y border-rule-soft py-4 space-y-1.5">
      <legend className="lc-overline">Vertragstyp</legend>
      {/* B3-4 (R3-α, 31.8.2026): eigene Kachel-Anatomie (eigenes Padding,
          `bg-brass-100` statt `/60`, kein `min-h-11`) → der EINE Baustein.
          Die LM-176-Messung (Unterzeile ink-600) steht jetzt dort. */}
      <SelectionGrid
        className="flex flex-wrap gap-2" gruppenLabel="Vertragstyp"
        items={REGIME_OPTIONEN.map((o) => ({ code: o.id, label: o.label, sub: o.sub }))}
        value={regime} onSelect={onWahl} />
    </fieldset>
  );
}

export function VorlageArbeitsvertrag() {
  const [regime, setRegime] = useState<AvRegime>(() => {
    try {
      const r = localStorage.getItem(REGIME_KEY);
      if (r === 'einzel' || r === 'kader' || r === 'lehrvertrag' || r === 'handelsreisendenvertrag' || r === 'heimarbeitsvertrag') return r;
    } catch { /* defekter Speicher → Default */ }
    return 'einzel';
  });
  useEffect(() => { try { localStorage.setItem(REGIME_KEY, regime); } catch { /* Speicher blockiert */ } }, [regime]);

  const kopf = <VertragstypWahl regime={regime} onWahl={setRegime} />;
  if (regime === 'lehrvertrag') return <VorlageLehrvertrag kopf={kopf} />;
  if (regime === 'handelsreisendenvertrag') return <VorlageHandelsreisendenvertrag kopf={kopf} />;
  if (regime === 'heimarbeitsvertrag') return <VorlageHeimarbeitsvertrag kopf={kopf} />;
  return <EinzelKaderWizard untertyp={regime} regime={regime} setRegime={setRegime} />;
}

// Einzel/Kader auf `VorlagenSeite` (W2·29-WERKBANK-VORLAGEN V2c). Die Eingabe-
// Schritte sind eine Komponente, weil sie usePaneKlasse brauchen.
type AvZ = { ergebnis: ReturnType<typeof avZusammenstellen> };

function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<AvAntworten, AvZ>; schritt: number }) {
  const pk = usePaneKlasse();

  switch (SCHRITTE[schritt].id) {
    case 'parteien': return (
      <div className="space-y-5">
        <div className="space-y-3">
          <GruppenTitel>Arbeitgeber</GruppenTitel>
          <Field label="Rechtsform">
            <select className={inputCls} value={a.arbeitgeberTyp} onChange={(e) => set('arbeitgeberTyp', e.target.value as AvAntworten['arbeitgeberTyp'])}>
              <option value="juristisch">juristische Person (AG, GmbH, Verein …)</option>
              <option value="natuerlich">natürliche Person</option>
            </select>
          </Field>
          <Field label={a.arbeitgeberTyp === 'juristisch' ? 'Firma' : 'Name'}>
            <input className={inputCls} value={a.arbeitgeberName} onChange={(e) => set('arbeitgeberName', e.target.value)}
              placeholder={a.arbeitgeberTyp === 'juristisch' ? 'Muster AG' : 'Vorname Nachname'} />
          </Field>
          <Field label="Adresse">
            <input className={inputCls} value={a.arbeitgeberAdresse} onChange={(e) => set('arbeitgeberAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
          </Field>
        </div>
        <div className="space-y-3">
          <GruppenTitel>Arbeitnehmer/in</GruppenTitel>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
            <Field label="Vorname"><input className={inputCls} value={a.arbeitnehmerVorname} onChange={(e) => set('arbeitnehmerVorname', e.target.value)} /></Field>
            <Field label="Nachname"><input className={inputCls} value={a.arbeitnehmerName} onChange={(e) => set('arbeitnehmerName', e.target.value)} /></Field>
          </div>
          <Field label="Adresse">
            <input className={inputCls} value={a.arbeitnehmerAdresse} onChange={(e) => set('arbeitnehmerAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
          </Field>
          <Field label="Geburtsdatum" optional hint="steuert den Mindest-Ferienanspruch (5 Wochen bis zum vollendeten 20. Altersjahr, Art. 329a OR)">
            <DatumsFeld value={a.arbeitnehmerGeburtsdatum ?? ''} onChange={(v) => set('arbeitnehmerGeburtsdatum', v || undefined)} className={inputCls} />
          </Field>
        </div>
      </div>
    );

    case 'stelle': return (
      <div className="space-y-4">
        <Field label="Funktion / Tätigkeit">
          <input className={inputCls} value={a.funktion} onChange={(e) => set('funktion', e.target.value)} placeholder="z. B. Sachbearbeiterin Treuhand" />
        </Field>
        <div className={pk('grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-[1fr_10rem] gap-3')}>
          <Field label="Arbeitsort">
            <input className={inputCls} value={a.arbeitsort} onChange={(e) => set('arbeitsort', e.target.value)} placeholder="z. B. Basel" />
          </Field>
          <Field label="Kanton" optional hint="für die Mindestlohn-Prüfung">
            <select className={inputCls} value={a.arbeitsortKanton ?? ''} onChange={(e) => set('arbeitsortKanton', e.target.value || undefined)}>
              <option value="">– wählen –</option>
              {KANTONE.map((k) => <option key={k} value={k}>{k}{MINDESTLOHN_KANTONE.has(k) ? ' (Mindestlohn)' : ''}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Stellenantritt">
          <DatumsFeld value={a.beginn} onChange={(v) => set('beginn', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.befristet}
          onChange={(v) => {
            set('befristet', v);
            // Stale-State vermeiden: bei Befristung gibt es keine ordentliche
            // Kündigung – abweichende Frist zurücksetzen (Review-Befund B1).
            if (v) { set('kuendigungsfrist', 'gesetzlich'); set('kuendigungsfristMonate', undefined); }
          }}
          label={<><span>Befristetes Arbeitsverhältnis <span className="text-ink-500"><NormText text={`(endet ohne Kündigung, Art. 334 OR)`} /></span></span></>} />
        {a.befristet && (
          <Field label="Befristet bis">
            <DatumsFeld value={a.befristetBis ?? ''} onChange={(v) => set('befristetBis', v || undefined)} className={inputCls} />
          </Field>
        )}
        {/* Probezeit ist auch beim befristeten Verhältnis vereinbar */}
        {(
          <div className="space-y-3 pt-1">
            {/* LM-101-Muster: Buchstabenzusatz (335b) darf die uppercase-Overline nicht durchlaufen. */}
            <GruppenTitel><NormText text={`Probezeit `} /><span className="normal-case"><NormText text={`(Art. 335b OR)`} /></span></GruppenTitel>
            <SelectionGrid
              className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
              items={([
                // Bei Befristung gibt es keine gesetzliche Vermutung
                // (Art. 335b Abs. 1 OR) – die Probezeit wird VEREINBART.
                ['gesetzlich', a.befristet ? '1 Monat (vereinbart)' : 'Gesetzlich', a.befristet ? 'ausdrückliche Abrede' : '1 Monat'],
                ['verlaengert', a.befristet ? '2–3 Monate (vereinbart)' : 'Verlängert', '2–3 Monate (schriftlich)'],
                ['wegbedungen', 'Keine', 'Probezeit wegbedungen'],
              ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
              value={a.probezeit}
              onSelect={(code) => set('probezeit', code)}
            />
            {a.probezeit === 'verlaengert' && (
              <Field label="Probezeit (Monate)" hint="höchstens drei Monate (Art. 335b Abs. 2 OR)">
                <input type="number" min={2} max={3} className={inputCls + ' w-28'} value={a.probezeitMonate ?? 3}
                  onChange={(e) => set('probezeitMonate', Number(e.target.value))} />
              </Field>
            )}
          </div>
        )}
      </div>
    );

    case 'lohn': return (
      <div className="space-y-4">
        <SelectionGrid
          className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
          items={([['monatslohn', 'Monatslohn'], ['stundenlohn', 'Stundenlohn']] as const).map(([code, label]) => ({ code, label }))}
          value={a.lohnModell}
          onSelect={(code) => {
            set('lohnModell', code);
            // Ferienzuschlag gibt es nur im Stundenlohn (Review-Befund B1)
            if (code === 'monatslohn') set('ferienzuschlagSeparat', undefined);
          }}
        />
        <Field label={a.lohnModell === 'monatslohn' ? 'Bruttolohn pro Monat (CHF)' : 'Bruttolohn pro Stunde (CHF)'}>
          <BetragsFeld className={inputCls + ' num'} value={a.lohnBetrag} onChange={(v) => set('lohnBetrag', v)} placeholder={a.lohnModell === 'monatslohn' ? "z. B. 6'500" : 'z. B. 32.50'} />
        </Field>
        <Checkbox
          checked={a.dreizehnter}
          onChange={(v) => set('dreizehnter', v)}
          label={<><span>13. Monatslohn <span className="text-ink-500">(Lohnbestandteil – bei unterjährigem Ein-/Austritt pro rata geschuldet)</span></span></>} />
        <Checkbox
          checked={a.gratifikation}
          onChange={(v) => set('gratifikation', v)}
          label={<><span>Freiwillige Gratifikation vorsehen <span className="text-ink-500"><NormText text={`(Vorbehalts-Klausel wird automatisch aufgenommen, Art. 322d OR)`} /></span></span></>} />
        {a.lohnModell === 'stundenlohn' && (
          <Checkbox
            checked={a.ferienzuschlagSeparat ?? false}
            onChange={(v) => set('ferienzuschlagSeparat', v)}
            label={<><span>Ferienlohn laufend ausrichten (gesondert ausgewiesener Zuschlag) <span className="text-warn-700">— nur bei unregelmässiger Teilzeit zulässig (BGE 149 III 202)</span></span></>} />
        )}
      </div>
    );

    case 'zeit': return (
      <div className="space-y-4">
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
          <Field label="Pensum (%)">
            <input type="number" min={1} max={100} className={inputCls + ' num'} value={a.pensumProzent}
              onChange={(e) => set('pensumProzent', Math.min(100, Math.max(1, Number(e.target.value) || 100)))} />
          </Field>
          <Field label="Wochenstunden (bei 100 %)" hint="Höchstarbeitszeit 45/50 Std. (Art. 9 ArG)">
            <input type="number" min={1} max={50} step={0.5} className={inputCls + ' num'} value={a.wochenstunden}
              onChange={(e) => set('wochenstunden', Number(e.target.value) || 42)} />
          </Field>
        </div>
        <div className="space-y-2">
          {/* LM-101-Muster: Buchstabenzusatz (321c) darf die uppercase-Overline nicht durchlaufen. */}
          <GruppenTitel><NormText text={`Überstunden `} /><span className="normal-case"><NormText text={`(Art. 321c OR)`} /></span></GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={([
              ['gesetzlich', 'Gesetzlich', 'Freizeit oder Lohn + 25 %'],
              ['kompensation', 'Kompensation', 'grundsätzlich Freizeit'],
              ['inbegriffen', 'Im Lohn inbegriffen', 'Wegbedingung (schriftlich)'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.ueberstunden}
            onSelect={(code) => set('ueberstunden', code)}
          />
          {a.ueberstunden === 'inbegriffen' && (
            <p className="lc-notice-warn text-body-s">
              Gilt nur für OR-Überstunden. Überzeit über der wöchentlichen Höchstarbeitszeit
              (45/50 Std.) bleibt zwingend zuschlagspflichtig (<NormLink artikel="Art. 13 ArG" />) und
              kann nicht wegbedungen werden.
            </p>
          )}
        </div>
        <Field label="Ferien (Wochen pro Dienstjahr)" hint="mindestens 4 Wochen; 5 Wochen bis zum vollendeten 20. Altersjahr (Art. 329a OR)">
          <input type="number" min={4} max={8} className={inputCls + ' w-28 num'} value={a.ferienWochen}
            onChange={(e) => set('ferienWochen', Number(e.target.value) || 4)} />
        </Field>
        {!a.befristet && (
          <div className="space-y-2 pt-1">
            {/* LM-101-Muster: Buchstabenzusatz (335c) darf die uppercase-Overline nicht durchlaufen. */}
            <GruppenTitel><NormText text={`Kündigungsfrist nach der Probezeit `} /><span className="normal-case"><NormText text={`(Art. 335c OR)`} /></span></GruppenTitel>
            <SelectionGrid
              className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
              items={([
                ['gesetzlich', 'Gesetzliche Staffel', '1 / 2 / 3 Monate nach Dienstjahren'],
                ['abweichend', 'Einheitliche Frist', 'für beide Parteien gleich (schriftlich)'],
              ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
              value={a.kuendigungsfrist}
              onSelect={(code) => set('kuendigungsfrist', code)}
            />
            {a.kuendigungsfrist === 'abweichend' && (
              <Field label="Frist (Monate, auf Monatsende)" hint="nie unter einem Monat (Art. 335c Abs. 2 OR); Parität für beide Parteien">
                <input type="number" min={1} max={12} className={inputCls + ' w-28 num'} value={a.kuendigungsfristMonate ?? 3}
                  onChange={(e) => set('kuendigungsfristMonate', Number(e.target.value))} />
              </Field>
            )}
          </div>
        )}
      </div>
    );

    case 'absicherung': return (
      <div className="space-y-4">
        <div className="space-y-2">
          {/* LM-101-Muster: Buchstabenzusatz (324a) darf die uppercase-Overline nicht durchlaufen. */}
          <GruppenTitel><NormText text={`Lohnfortzahlung bei Krankheit `} /><span className="normal-case"><NormText text={`(Art. 324a OR)`} /></span></GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
            items={([
              ['gesetzlich', 'Gesetzliche Regelung', '3 Wochen im 1. Dienstjahr, danach Skala'],
              ['ktg', 'Krankentaggeld-Versicherung', 'gleichwertige Lösung (Abs. 4)'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.lohnfortzahlung}
            onSelect={(code) => set('lohnfortzahlung', code)}
          />
          {a.lohnfortzahlung === 'ktg' && (
            <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
              <Field label="Taggeld (% des Lohnes)"><input type="number" min={50} max={100} className={inputCls + ' num'} value={a.ktgProzent ?? 80} onChange={(e) => set('ktgProzent', Number(e.target.value))} /></Field>
              <Field label="Leistungsdauer (Tage)" hint="innert 900 Tagen"><input type="number" min={180} max={1095} className={inputCls + ' num'} value={a.ktgTage ?? 730} onChange={(e) => set('ktgTage', Number(e.target.value))} /></Field>
              <Field label="Wartefrist (Tage)" hint="über 3 Tage nur gleichwertig, wenn der Arbeitgeber 80 % zahlt">
                <select className={inputCls} value={a.ktgWartefristTage ?? 0} onChange={(e) => set('ktgWartefristTage', Number(e.target.value))}>
                  {[0, 2, 3, 30, 60, 90].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              {(a.ktgWartefristTage ?? 0) > 0 && (
                <Field label="Lohn während Wartefrist (%)"><input type="number" min={0} max={100} className={inputCls + ' num'} value={a.ktgWartefristLohnProzent ?? 80} onChange={(e) => set('ktgWartefristLohnProzent', Number(e.target.value))} /></Field>
              )}
              <Field label="Prämienanteil Arbeitnehmer/in (%)" hint="über 50 % gefährdet die Gleichwertigkeit"><input type="number" min={0} max={100} className={inputCls + ' num'} value={a.ktgPraemieAnProzent ?? 50} onChange={(e) => set('ktgPraemieAnProzent', Number(e.target.value))} /></Field>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {/* LM-101-Muster: Buchstabenzusatz (327a) darf die uppercase-Overline nicht durchlaufen. */}
          <GruppenTitel><NormText text={`Spesen `} /><span className="normal-case"><NormText text={`(Art. 327a OR)`} /></span></GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
            items={([
              ['effektiv', 'Effektiver Ersatz', 'gegen Beleg (gesetzliches Minimum)'],
              ['pauschal', 'Pauschalspesen', 'pro Monat (schriftlich; muss alles decken)'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.spesen}
            onSelect={(code) => set('spesen', code)}
          />
          {a.spesen === 'pauschal' && (
            <Field label="Pauschale (CHF pro Monat)" hint="muss alle notwendigen Auslagen decken – sonst insoweit nichtig (Art. 327a Abs. 3 OR)">
              <BetragsFeld className={inputCls + ' num w-40'} value={a.spesenPauschaleCHF ?? ''} onChange={(v) => set('spesenPauschaleCHF', v)} placeholder="z. B. 200" />
            </Field>
          )}
        </div>
        <div className="space-y-2">
          <GruppenTitel>Gesamtarbeitsvertrag</GruppenTitel>
          <select className={inputCls} value={a.gav} onChange={(e) => set('gav', e.target.value as AvAntworten['gav'])}>
            <option value="nein">Kein GAV anwendbar</option>
            <option value="ja">GAV anwendbar</option>
            <option value="unbekannt">Unklar – noch zu prüfen</option>
          </select>
          {a.gav === 'ja' && (
            <Field label="GAV (Bezeichnung)">
              <input className={inputCls} value={a.gavName ?? ''} onChange={(e) => set('gavName', e.target.value)} placeholder="z. B. Landes-GAV des Gastgewerbes (L-GAV)" />
            </Field>
          )}
          {a.gav === 'ja' && (
            <Field label="Art der Geltung" hint="blosse Verweisung erzeugt keine Normwirkung (Art. 356/357 OR)">
              <select className={inputCls} value={a.gavTyp ?? ''} onChange={(e) => set('gavTyp', (e.target.value || undefined) as AvAntworten['gavTyp'])}>
                <option value="">– wählen –</option>
                <option value="ave">allgemeinverbindlich erklärt (AVE)</option>
                <option value="mitgliedschaft">beidseitige Verbandsmitgliedschaft</option>
                <option value="verweis">blosse vertragliche Verweisung</option>
              </select>
            </Field>
          )}
        </div>
      </div>
    );

    case 'klauseln': return (
      <div className="space-y-4">
        <Checkbox
          checked={a.konkurrenzverbot}
          onChange={(v) => set('konkurrenzverbot', v)}
          label={<><span><strong>Konkurrenzverbot</strong> vereinbaren <span className="text-ink-500">(Art. 340 ff. OR – nach Ort, Zeit und Gegenstand zu begrenzen)</span></span></>} />
        {a.konkurrenzverbot && (
          <div className="lc-card p-4 space-y-3">
            <label className="flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium">
              <input type="checkbox" className="mt-0.5" checked={a.kvEinblickBestaetigt ?? false} onChange={(e) => set('kvEinblickBestaetigt', e.target.checked)} />
              Die Stelle gewährt Einblick in den Kundenkreis oder in Fabrikations-/Geschäftsgeheimnisse, deren Verwendung den Arbeitgeber erheblich schädigen könnte (Art. 340 Abs. 2 OR).
            </label>
            <Field label="Gegenstand (untersagte Tätigkeit)">
              <input className={inputCls} value={a.kvGegenstand ?? ''} onChange={(e) => set('kvGegenstand', e.target.value)} placeholder="z. B. Treuhand- und Revisionsdienstleistungen" />
            </Field>
            <div className={pk('grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-[1fr_9rem] gap-3')}>
              <Field label="Örtlicher Geltungsbereich">
                <input className={inputCls} value={a.kvOrt ?? ''} onChange={(e) => set('kvOrt', e.target.value)} placeholder="z. B. Kantone BS und BL" />
              </Field>
              <Field label="Dauer (Monate)" hint="in der Regel höchstens 3 Jahre">
                <input type="number" min={1} max={60} className={inputCls + ' num'} value={a.kvDauerMonate ?? 12} onChange={(e) => set('kvDauerMonate', Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Konventionalstrafe (CHF je Übertretung)" optional hint="Bezahlung befreit vom Verbot; weiterer Schaden bleibt ersatzpflichtig (Art. 340b OR)">
              <BetragsFeld className={inputCls + ' num w-40'} value={a.kvKonventionalstrafeCHF ?? ''} onChange={(v) => set('kvKonventionalstrafeCHF', v)} placeholder="z. B. 20'000" />
            </Field>
            <Checkbox
              checked={a.kvRealerfuellung ?? false}
              onChange={(v) => set('kvRealerfuellung', v)}
              label={<><span>Realerfüllung vorbehalten <span className="text-ink-500"><NormText text={`(Beseitigung des vertragswidrigen Zustands, Art. 340b Abs. 3 OR – «besonders schriftlich verabredet»)`} /></span></span></>} />
            <Checkbox
              checked={a.kvStrafeBefreitNicht ?? false}
              onChange={(v) => set('kvStrafeBefreitNicht', v)}
              label={<><span>Zahlung der Konventionalstrafe befreit <strong>nicht</strong> vom Verbot <span className="text-ink-500"><NormText text={`(abweichende Abrede, Art. 340b Abs. 2 OR)`} /></span></span></>} />
            <Checkbox
              checked={a.kvKarenz ?? false}
              onChange={(v) => set('kvKarenz', v)}
              label={<><span><strong>Karenzentschädigung</strong> vereinbaren <span className="text-ink-500"><NormText text={`(gesetzlich nicht vorgeschrieben; erlaubt ein weitergehendes Verbot, Art. 340a Abs. 2 OR)`} /></span></span></>} />
            {a.kvKarenz && (
              <div className="pl-6 space-y-3">
                <Field label="Karenzentschädigung (CHF pro Monat)">
                  <BetragsFeld className={inputCls + ' num w-40'} value={a.kvKarenzCHFProMonat ?? ''} onChange={(v) => set('kvKarenzCHFProMonat', v || undefined)} placeholder="z. B. 2'000" />
                </Field>
                <Checkbox
                  checked={a.kvKarenzVerzichtsrecht ?? false}
                  onChange={(v) => set('kvKarenzVerzichtsrecht', v)}
                  label={<><span>Einseitiges Verzichtsrecht des Arbeitgebers vorbehalten <span className="text-ink-500">(ohne Abrede keine einseitige Befreiung – BGer 4A_5/2025)</span></span></>} />
                <Checkbox
                  checked={a.kvKarenzErsatzAnrechenbar ?? false}
                  onChange={(v) => set('kvKarenzErsatzAnrechenbar', v)}
                  label={<><span>Ersatzeinkommen anrechenbar <span className="text-ink-500">(nur bei ausdrücklicher Abrede – BGer 4A_5/2025 E. 5.3)</span></span></>} />
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-ink-500">
          Treue-/Geheimhaltungspflicht, Datenschutz und Schlussbestimmungen werden automatisch
          aufgenommen. Nicht enthalten (anwaltliche Beratung empfohlen): Lohnrückbehalt,
          Bonuspläne, Erfindungen/IP-Zuordnung über Art. 332 OR hinaus, Kaderverträge.
        </p>
      </div>
    );
  }
}

function fehlerEingabe(a: AvAntworten, schritt: number): string[] {
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.arbeitgeberName.trim()) f.push('Arbeitgeber angeben (Firma bzw. Name).');
    if (!a.arbeitgeberAdresse.trim()) f.push('Adresse des Arbeitgebers angeben.');
    if (!a.arbeitnehmerVorname.trim() || !a.arbeitnehmerName.trim()) f.push('Vor- und Nachname der Arbeitnehmerin / des Arbeitnehmers angeben.');
    if (!a.arbeitnehmerAdresse.trim()) f.push('Adresse der Arbeitnehmerin / des Arbeitnehmers angeben.');
  }
  if (schritt === 1) {
    if (!a.funktion.trim()) f.push('Funktion angeben (Art. 330b OR).');
    if (!a.arbeitsort.trim()) f.push('Arbeitsort angeben.');
    if (!a.beginn) f.push('Stellenantritt angeben.');
    if (a.befristet && !a.befristetBis) f.push('Enddatum der Befristung angeben (Art. 334 OR).');
  }
  if (schritt === 2 && !a.lohnBetrag.trim()) f.push('Lohn angeben (Art. 322/330b OR).');
  return f;
}

// `zusammenstellen` bindet den Untertyp (Einzel/Kader) und entsteht darum in
// EinzelKaderWizard.
const CONFIG: Omit<VorlagenSeitenConfig<AvAntworten, AvZ>, 'zusammenstellen'> = {
  cardId: 'arbeitsvertrag',
  defaults: AV_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  // Ist-Zustand vor dem Umzug (§6): kein Profil-Prefill, Detailgrad-Default
  // aus dem Schema statt aus den Einstellungen.
  profilPrefill: false,
  detailgradAusEinstellungen: false,
  pruefeGates: (a) => pruefeAvGates(a),
  schritte: SCHRITTE,
  overlineFallback: 'Arbeit',
  titel: 'Einzelarbeitsvertrag',
  intro: 'Stellt einen Arbeitsvertrag nach Art. 319 ff. OR aus festen, juristisch vorformulierten Bausteinen zusammen – mit harten Schranken für zwingendes Recht (Probezeit, Fristen, Ferien, Ferienlohn) und offengelegten Hinweisen zu heiklen Klauseln. Ohne Sprachmodell: gleiche Eingaben, gleiches Dokument.',
  badge: 'Beidseitig zu unterzeichnen',
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe,
  // Ist-Zustand vor dem Umzug: im letzten Schritt nur das Datum als Pflicht
  // (kein ortFehler); die Blocker stehen im eigenen Kasten und sperren den
  // Export, nicht die Fehlerbox (§6).
  blockerImLetztenSchritt: false,
  blockerKasten: 'Vor der Ausgabe zu beheben',
  ortDatumLabel: 'Ort und Datum des Vertragsschlusses',
  ortPlaceholder: 'z. B. Basel',
  datumFehler: 'Vertragsdatum angeben.',
  bestaetigung: (
    <>
      <p className="lc-overline text-brass-700">Form-Gate – damit der Vertrag trägt</p>
      <ul className="lc-list space-y-2 text-body-s text-ink-700">
        <li><strong>Beidseitig unterzeichnen</strong> – erst die Unterschriften beider Parteien erfüllen die Schriftform der formbedürftigen Klauseln (Konkurrenzverbot, Wegbedingungen, abweichende Fristen).</li>
        <li><strong>Elektronisch nur mit QES:</strong><NormText text={` Die Schriftform erfüllt elektronisch nur die qualifizierte elektronische Signatur mit qualifiziertem Zeitstempel (Art. 14 Abs. 2bis OR) – einfache E-Signatur oder eingescannte Unterschrift genügen nicht.`} /></li>
        <li><strong>GAV/NAV prüfen:</strong> Anwendbare Mindeststandards gehen diesem Vertrag vor (Art. 357/360a OR).</li>
        <li><strong>Mindestlohn prüfen</strong> bei Arbeitsort in GE, BS, NE, JU, TI (jährlich indexiert; ab 2026 auch Stadt Luzern).</li>
        <li><strong>Sozialversicherungen anmelden</strong> (AHV/ALV/BVG/UVG) – nicht Gegenstand dieser Vorlage.</li>
      </ul>
    </>
  ),
  bestaetigungLabel: 'Ich habe verstanden: Dies ist ein Entwurf nach festen Bausteinen – GAV/NAV, kantonale Mindestlöhne und der Einzelfall sind gesondert zu prüfen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  // Offene Verifikationen (transparent, §8)
  pruefenFuss: (
    <details className="lc-card p-4">
      <summary className="cursor-pointer text-body-s font-medium text-ink-700">Offene Verifikationen ({AV_OFFENE_VERIFIKATIONEN.length})</summary>
      <ul className="mt-2 space-y-1.5">
        {AV_OFFENE_VERIFIKATIONEN.map((v, i) => <li key={i} className="text-xs text-ink-500">– {v}</li>)}
      </ul>
    </details>
  ),
  banner: BANNER_AV,
  dateiBasis: 'Arbeitsvertrag-Entwurf',
  pdfLabel: 'Vertrag als PDF',
  docxLabel: 'Vertrag als Word (DOCX)',
};

function EinzelKaderWizard({ untertyp, regime, setRegime }: { untertyp: AvUntertyp; regime: AvRegime; setRegime: (v: AvRegime) => void }) {
  const config = useMemo<VorlagenSeitenConfig<AvAntworten, AvZ>>(() => ({
    ...CONFIG,
    zusammenstellen: (a) => ({ ergebnis: avZusammenstellen({ ...a, untertyp }) }),
    kopfSchalter: ({ a, set }) => (
      <VariantenKopf
        untertypLabel="Vertragstyp"
        untertypOptionen={REGIME_OPTIONEN}
        untertyp={regime}
        onUntertyp={setRegime}
        detailgrad={a.detailgrad}
        onDetailgrad={(v) => set('detailgrad', v)}
      />
    ),
  }), [untertyp, regime, setRegime]);
  return <VorlagenSeite config={config} />;
}
