import { useMemo } from 'react';
import { NormText } from '../components/NormText';
import { useLocation } from 'react-router-dom';
import {
  MV_DEFAULTS, MV_FORMULARPFLICHT, MV_OFFENE_VERIFIKATIONEN, MV_PARAMETER,
  MV_NEBENKOSTEN_WOHNEN, MV_NEBENKOSTEN_GESCHAEFT,
  mvZusammenstellen, pruefeMvGates, mvGesetzlicheFrist,
  type MvAntworten, type MvStaffel,
} from '../lib/vorlagen/mietvertrag';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { BetragsFeld } from '../components/BetragsFeld';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, inputCls, ListenEditor, NormLink } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { VariantenKopf } from '../components/vorlagen/VariantenKopf';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { MUSTER } from '../components/vorlagen/musterdaten';
import { KANTONE } from '../lib/kantone';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Vorlagen-Wizard: Mietvertrag Wohn-/Geschäftsräume (Art. 253 ff. OR) ────
// Zentrale Weiche: objektTyp (Wohnraum | Geschäftsraum) + Kanton – gemäss
// Gutachten 5.6.2026. Gates: Kautionsmaximum, Mindestfristen, Index-/Staffel-
// Voraussetzungen, Nebenkosten-Einzelausweis, MWST nur Geschäftsraum; die
// kantonale Formularpflicht für den Anfangsmietzins wird als Warnung
// offengelegt. Eingaben bleiben im Browser (localStorage).
// Seit W2·29-WERKBANK-VORLAGEN V2c auf `VorlagenSeite`; die Eingabe-Schritte
// sind eine Komponente, weil sie usePaneKlasse brauchen (s. VorlagenSeite.tsx).

const SPEICHER_KEY = 'lexmetrik.vorlage.mietvertrag.v1';

const SCHRITTE = [
  { id: 'objekt', label: 'Mietobjekt' },
  { id: 'parteien', label: 'Parteien' },
  { id: 'dauer', label: 'Dauer & Kündigung' },
  { id: 'mietzins', label: 'Mietzins & Nebenkosten' },
  { id: 'klauseln', label: 'Kaution & Klauseln' },
  { id: 'pruefen', label: 'Prüfen & Unterzeichnen' },
] as const;

const BANNER_MV: PdfBanner = {
  titel: 'VERTRAGSENTWURF – VON BEIDEN PARTEIEN ZU UNTERZEICHNEN',
  text: 'Der Mietvertrag ist formfrei gültig; Index- und Staffelmiete bedürfen der Schriftform – die beidseitige Unterzeichnung erfüllt sie. Kantonale Formularpflichten für den Anfangsmietzins bleiben vorbehalten (Art. 270 Abs. 2 OR).',
};

const FORMULARPFLICHT_KANTONE = new Set(MV_FORMULARPFLICHT.map((k) => k.kanton));

type MvZ = { ergebnis: ReturnType<typeof mvZusammenstellen> };

function EingabeSchritt({ ctx: { a, set }, schritt }: { ctx: SeiteCtx<MvAntworten, MvZ>; schritt: number }) {
  const wohnung = a.objektTyp === 'wohnung';
  const fristMin = mvGesetzlicheFrist(a.objektTyp);
  const pk = usePaneKlasse();
  const nkKatalog = wohnung ? MV_NEBENKOSTEN_WOHNEN : MV_NEBENKOSTEN_GESCHAEFT;

  const toggleNk = (p: string) =>
    set('nkPositionen', a.nkPositionen.includes(p) ? a.nkPositionen.filter((x) => x !== p) : [...a.nkPositionen, p]);

  const setStaffel = (i: number, patch: Partial<MvStaffel>) =>
    set('staffeln', (a.staffeln ?? []).map((s, j) => (j === i ? { ...s, ...patch } : s)));

  switch (SCHRITTE[schritt].id) {
    case 'objekt': return (
      <div className="space-y-4">
        {/* Untermiete-Weiche (Ausbau 6.6.2026, Art. 262 OR geltende Fassung) */}
        <SelectionGrid
          className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
          items={([
            ['hauptmiete', 'Mietvertrag (Hauptmiete)', 'Vermieter:in vermietet die eigene Sache'],
            ['untermiete', 'Untermietvertrag', 'Hauptmieter:in vermietet ganz oder teilweise weiter (Art. 262 OR)'],
          ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
          value={a.mietverhaeltnis ?? 'hauptmiete'}
          onSelect={(code) => {
            set('mietverhaeltnis', code);
            // abhängige Felder neutralisieren (kein Stale-State)
            if (code === 'hauptmiete') {
              set('hmVermieterName', undefined); set('hmDatum', undefined); set('hmMietzinsCHF', undefined);
              set('zustimmungStatus', undefined); set('zustimmungDatum', undefined);
              set('untermieteUmfang', undefined); set('untermieteZimmerBeschrieb', undefined);
              set('mehrleistungBegruendung', undefined); set('moebliert', undefined);
            } else {
              set('zustimmungStatus', 'nicht_angefragt'); set('untermieteUmfang', 'ganz');
            }
          }}
        />
        {a.mietverhaeltnis === 'untermiete' && (
          <div className="lc-card p-4 space-y-3">
            <GruppenTitel>Hauptmietvertrag & Zustimmung (Art. 262 OR)</GruppenTitel>
            <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
              <Field label="Hauptvermieter:in (Name)">
                <input className={inputCls} value={a.hmVermieterName ?? ''} onChange={(e) => set('hmVermieterName', e.target.value || undefined)} placeholder="z. B. Immo AG" />
              </Field>
              <Field label="Hauptmietvertrag vom" optional>
                <DatumsFeld value={a.hmDatum ?? ''} onChange={(v) => set('hmDatum', v || undefined)} className={inputCls} />
              </Field>
              <Field label="Hauptmietzins netto (CHF/Monat)" hint="Vergleichsgrösse für den Missbrauchs-Check (Art. 262 Abs. 2 lit. b)">
                <BetragsFeld className={inputCls + ' num'} value={a.hmMietzinsCHF ?? ''} onChange={(v) => set('hmMietzinsCHF', v || undefined)} placeholder="z. B. 1'500" />
              </Field>
              <Field label="Zustimmung des Hauptvermieters" hint="formfrei gültig — beweishalber schriftlich festhalten">
                <select className={inputCls} value={a.zustimmungStatus ?? 'nicht_angefragt'} onChange={(e) => set('zustimmungStatus', e.target.value as MvAntworten['zustimmungStatus'])}>
                  <option value="schriftlich">liegt schriftlich vor</option>
                  <option value="muendlich">mündlich erteilt</option>
                  <option value="angefragt">angefragt — Antwort ausstehend</option>
                  <option value="nicht_angefragt">noch nicht angefragt</option>
                </select>
              </Field>
              {(a.zustimmungStatus === 'schriftlich' || a.zustimmungStatus === 'muendlich') && (
                <Field label="Zustimmung erteilt am" optional>
                  <DatumsFeld value={a.zustimmungDatum ?? ''} onChange={(v) => set('zustimmungDatum', v || undefined)} className={inputCls} />
                </Field>
              )}
              <Field label="Umfang der Untermiete">
                <select className={inputCls} value={a.untermieteUmfang ?? 'ganz'} onChange={(e) => set('untermieteUmfang', e.target.value as 'ganz' | 'teilweise')}>
                  <option value="ganz">ganze Mietsache</option>
                  <option value="teilweise">teilweise (einzelne Zimmer)</option>
                </select>
              </Field>
            </div>
            {a.untermieteUmfang === 'teilweise' && (
              <Field label="Überlassene Räume & Mitbenutzung" hint="z. B. «Zimmer Süd; Mitbenutzung von Küche und Bad»">
                <input className={inputCls} value={a.untermieteZimmerBeschrieb ?? ''} onChange={(e) => set('untermieteZimmerBeschrieb', e.target.value || undefined)} />
              </Field>
            )}
            <Field label="Mehrleistungen (rechtfertigen einen Aufschlag)" optional hint="Möblierung, Reinigung, Nebenleistungen — ohne Begründung ist ein Untermietzins über dem Hauptmietzins missbräuchlich (Art. 262 Abs. 2 lit. b)">
              <input className={inputCls} value={a.mehrleistungBegruendung ?? ''} onChange={(e) => set('mehrleistungBegruendung', e.target.value || undefined)} placeholder="z. B. vollständige Möblierung, Bettwäsche, Endreinigung" />
            </Field>
            <label className="flex items-center gap-2 text-body-s cursor-pointer text-ink-700">
              <input type="checkbox" checked={!!a.moebliert} onChange={(e) => set('moebliert', e.target.checked || undefined)} />
              Möbliertes Zimmer (verkürzte Kündigungsfrist, Art. 266e OR)
            </label>
          </div>
        )}
        <SelectionGrid
          className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
          items={([
            ['wohnung', 'Wohnraum', 'Wohnung, Einfamilienhaus – voller Mieterschutz'],
            ['geschaeftsraum', 'Geschäftsraum', 'Büro, Laden, Gewerbe – freiere Gestaltung'],
          ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
          value={a.objektTyp}
          onSelect={(code) => {
            set('objektTyp', code);
            // abhängige Felder neutralisieren (kein Stale-State)
            if (code === 'wohnung') { set('mwstOption', undefined); set('konkurrenzschutz', undefined); set('konkurrenzschutzText', undefined); set('konkurrenzschutzStrafeCHF', undefined); set('mietzweck', undefined); }
            if (code === 'geschaeftsraum') set('familienwohnung', undefined);
            set('nkPositionen', []);
            set('kuendigungsfristMonate', undefined);
          }}
        />
        <Field label="Mietobjekt (Beschrieb)">
          <input className={inputCls} value={a.objektBeschrieb} onChange={(e) => set('objektBeschrieb', e.target.value)}
            placeholder={wohnung ? 'z. B. 3.5-Zimmer-Wohnung im 2. OG links' : 'z. B. Büroräumlichkeiten im 1. OG, ca. 120 m²'} />
        </Field>
        <Field label="Adresse des Mietobjekts">
          <input className={inputCls} value={a.objektAdresse} onChange={(e) => set('objektAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" />
        </Field>
        <div className={pk('grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-[1fr_10rem] gap-3')}>
          <Field label="Mitvermietete Nebenräume" optional>
            <input className={inputCls} value={a.nebenraeume ?? ''} onChange={(e) => set('nebenraeume', e.target.value || undefined)} placeholder="z. B. Kellerabteil Nr. 7, Estrich" />
          </Field>
          <Field label="Kanton" optional hint="für die Formularpflicht-Prüfung">
            <select className={inputCls} value={a.kanton ?? ''} onChange={(e) => set('kanton', e.target.value || undefined)}>
              <option value="">– wählen –</option>
              {KANTONE.map((k) => <option key={k} value={k}>{k}{FORMULARPFLICHT_KANTONE.has(k) ? ' (Formularpflicht)' : ''}</option>)}
            </select>
          </Field>
        </div>
        {!wohnung && (
          <Field label="Mietzweck" hint="genau umschreiben – massgeblich für Gebrauchsumfang und MWST-Option">
            <input className={inputCls} value={a.mietzweck ?? ''} onChange={(e) => set('mietzweck', e.target.value || undefined)} placeholder="z. B. Betrieb eines Architekturbüros" />
          </Field>
        )}
        {wohnung && (
          <Checkbox
            checked={a.familienwohnung ?? false}
            onChange={(v) => set('familienwohnung', v || undefined)}
            label={<><span>Das Objekt dient als <strong>Familienwohnung</strong> <span className="text-ink-500">(besonderer Kündigungsschutz, Art. 266m/266n OR)</span></span></>} />
        )}
      </div>
    );

    case 'parteien': return (
      <div className="space-y-5">
        <div className="space-y-3">
          <GruppenTitel>Vermieter</GruppenTitel>
          <Field label="Name / Firma"><input className={inputCls} value={a.vermieterName} onChange={(e) => set('vermieterName', e.target.value)} /></Field>
          <Field label="Adresse"><input className={inputCls} value={a.vermieterAdresse} onChange={(e) => set('vermieterAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
        </div>
        <div className="space-y-3">
          <GruppenTitel>Mieter</GruppenTitel>
          <Field label="Name"><input className={inputCls} value={a.mieterName} onChange={(e) => set('mieterName', e.target.value)} placeholder="Vorname Nachname (bzw. Firma)" /></Field>
          <Field label="Adresse"><input className={inputCls} value={a.mieterAdresse} onChange={(e) => set('mieterAdresse', e.target.value)} placeholder="Strasse Nr., PLZ Ort" /></Field>
          <Field label="Zweite Mieterin / zweiter Mieter" optional hint="bei zwei Mietern wird die Solidarhaftung ausdrücklich festgehalten">
            <input className={inputCls} value={a.zweiterMieterName ?? ''} onChange={(e) => set('zweiterMieterName', e.target.value || undefined)} placeholder="Vorname Nachname" />
          </Field>
        </div>
      </div>
    );

    case 'dauer': return (
      <div className="space-y-4">
        <Field label="Mietbeginn">
          <DatumsFeld value={a.beginn} onChange={(v) => set('beginn', v)} className={inputCls} />
        </Field>
        <Checkbox
          checked={a.befristet}
          onChange={(v) => set('befristet', v)}
          label={<><span>Befristetes Mietverhältnis <span className="text-ink-500">(endet ohne Kündigung; stillschweigende Fortsetzung → unbefristet)</span></span></>} />
        {a.befristet ? (
          <Field label="Befristet bis">
            <DatumsFeld value={a.befristetBis ?? ''} onChange={(v) => set('befristetBis', v || undefined)} className={inputCls} />
          </Field>
        ) : (
          <>
            <Field label="Feste Erstlaufzeit (Jahre)" optional hint="nötig für Index- (≥ 5) bzw. Staffelmiete (≥ 3); sonst leer lassen">
              <input type="number" min={0} max={20} className={inputCls + ' w-28 num'} value={a.mindestdauerJahre ?? ''}
                onChange={(e) => set('mindestdauerJahre', e.target.value === '' ? undefined : Number(e.target.value))} />
            </Field>
            <Field label="Kündigungsfrist (Monate)" hint={`gesetzliches Minimum: ${fristMin} Monate (${wohnung ? 'Art. 266c' : 'Art. 266d'} OR) – auf ortsübliche Termine`}>
              <input type="number" min={fristMin} max={12} className={inputCls + ' w-28 num'} value={a.kuendigungsfristMonate ?? fristMin}
                onChange={(e) => set('kuendigungsfristMonate', Number(e.target.value))} />
            </Field>
          </>
        )}
      </div>
    );

    case 'mietzins': return (
      <div className="space-y-5">
        <Field label="Nettomietzins (CHF pro Monat)">
          <BetragsFeld className={inputCls + ' num w-44'} value={a.mietzinsNettoCHF} onChange={(v) => set('mietzinsNettoCHF', v)} placeholder="z. B. 2'150" />
        </Field>
        <div className="space-y-2">
          <GruppenTitel>Mietzins-Modell</GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={([
              ['standard', 'Standard', `Referenzzins-Basis ${MV_PARAMETER.referenzzinssatz.wert.toFixed(2)} %`],
              ['index', 'Indexmiete', 'LIK-gebunden – Vertrag ≥ 5 Jahre'],
              ['staffel', 'Staffelmiete', 'feste Erhöhungen – Vertrag ≥ 3 Jahre'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.mietzinsModell}
            onSelect={(code) => {
              set('mietzinsModell', code);
              if (code !== 'staffel') set('staffeln', undefined);
              if (code !== 'index') { set('indexBasisMonat', undefined); set('indexBasisPunkte', undefined); }
              if (code === 'staffel' && !(a.staffeln?.length)) set('staffeln', [{ ab: '', erhoehungCHF: '' }]);
            }}
          />
          {a.mietzinsModell === 'index' && (
            <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
              <Field label="LIK-Basisstand (Monat/Jahr)" hint="z. B. «Mai 2026» – definiert die Anpassungsbasis (Art. 17 VMWG)">
                <input className={inputCls} value={a.indexBasisMonat ?? ''} onChange={(e) => set('indexBasisMonat', e.target.value || undefined)} placeholder="z. B. Mai 2026" />
              </Field>
              <Field label="Punktestand" optional>
                <BetragsFeld className={inputCls + ' num'} value={a.indexBasisPunkte ?? ''} onChange={(v) => set('indexBasisPunkte', v || undefined)} placeholder="z. B. 107.1" />
              </Field>
            </div>
          )}
          {a.mietzinsModell === 'staffel' && (
            <div className="space-y-2">
              {/* R2-F/F1-9: Behälter kommt neu vom ListenEditor; die
                  Höchstzahl 5 steuert `hoechstens` (bisher eine Bedingung
                  um den Knopf herum — gleiche Wirkung, eine Stelle). Die
                  Feld-Labels standen nur an der ERSTEN Zeile und fehlten
                  darunter; jede Zeile trägt sie jetzt, weil der Panel-Kanon
                  die Zeilen sichtbar trennt. */}
              <ListenEditor
                element="Staffel"
                eintraege={a.staffeln ?? []}
                className="space-y-2"
                hoechstens={5}
                onHinzufuegen={() => set('staffeln', [...(a.staffeln ?? []), { ab: '', erhoehungCHF: '' }])}
                onEntfernen={(i) => set('staffeln', (a.staffeln ?? []).filter((_, j) => j !== i))}
                kinder={(s, i) => (
                  <div className={pk('grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-2 items-end', 'grid grid-cols-1 @xl/pane:grid-cols-[1fr_10rem] gap-2 items-end')}>
                    <Field label="Erhöhung ab">
                      <DatumsFeld value={s.ab} onChange={(v) => setStaffel(i, { ab: v })} className={inputCls} />
                    </Field>
                    <Field label="Betrag (CHF/Monat)">
                      <BetragsFeld className={inputCls + ' num'} value={s.erhoehungCHF} onChange={(v) => setStaffel(i, { erhoehungCHF: v } )} placeholder="z. B. 50" />
                    </Field>
                  </div>
                )}
              />
              <p className="text-xs text-ink-500">Höchstens eine Erhöhung pro Jahr; Beträge in Franken (<NormLink artikel="Art. 269c OR" />).</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {/* LM-101-Muster: Buchstabenzusatz (257a) darf die uppercase-Overline nicht durchlaufen. */}
          <GruppenTitel><NormText text={`Nebenkosten `} /><span className="normal-case"><NormText text={`(Art. 257a OR)`} /></span></GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={([
              ['akonto', 'Akonto', 'mit jährlicher Abrechnung'],
              ['pauschale', 'Pauschale', 'Durchschnitt dreier Jahre'],
              ['keine', 'Im Mietzins inbegriffen', 'keine separaten Nebenkosten'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.nebenkosten}
            onSelect={(code) => set('nebenkosten', code)}
          />
          {a.nebenkosten !== 'keine' && (
            <>
              <Field label={a.nebenkosten === 'akonto' ? 'Akonto (CHF pro Monat)' : 'Pauschale (CHF pro Monat)'}>
                <BetragsFeld className={inputCls + ' num w-40'} value={a.nebenkostenCHF ?? ''} onChange={(v) => set('nebenkostenCHF', v || undefined)} placeholder="z. B. 250" />
              </Field>
              <p className="text-xs text-ink-500">Positionen einzeln wählen – eine Sammelklausel genügt nicht:</p>
              <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-1.5', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-1.5')}>
                {nkKatalog.map((p) => (
                  <Checkbox
                    checked={a.nkPositionen.includes(p)}
                    onChange={() => toggleNk(p)}
                    label={<>{p}</>} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );

    case 'klauseln': return (
      <div className="space-y-5">
        <Field label="Kaution (CHF)" optional
          hint={wohnung ? 'höchstens drei Monatszinse (Art. 257e Abs. 2 OR); Hinterlegung auf Sperrkonto auf den Namen des Mieters' : 'keine gesetzliche Obergrenze – angemessenes Verhältnis zum Risiko'}>
          <BetragsFeld className={inputCls + ' num w-44'} value={a.kautionCHF ?? ''} onChange={(v) => set('kautionCHF', v || undefined)} placeholder="z. B. 4'300" />
        </Field>
        <div className="space-y-2">
          <GruppenTitel>Tierhaltung</GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={([
              ['kleintiere', 'Kleintiere frei', 'übrige mit Zustimmung'],
              ['zustimmung', 'Nur mit Zustimmung', 'jede Tierhaltung'],
              ['erlaubt', 'Erlaubt', 'ohne Einschränkung'],
            ] as const).map(([code, label, sub]) => ({ code, label, sub }))}
            value={a.tierhaltung}
            onSelect={(code) => set('tierhaltung', code)}
          />
        </div>
        <Checkbox
          checked={a.versicherungspflicht}
          onChange={(v) => set('versicherungspflicht', v)}
          label={<><span>{wohnung ? 'Privathaftpflichtversicherung' : 'Betriebshaftpflichtversicherung'} des Mieters als Pflicht festhalten</span></>} />
        <Checkbox
          checked={a.hausordnung}
          onChange={(v) => set('hausordnung', v)}
          label={<><span>Hausordnung als Vertragsbestandteil</span></>} />
        {!wohnung && (
          <div className="space-y-3 pt-1">
            <GruppenTitel>Geschäftsraum-Klauseln</GruppenTitel>
            <Checkbox
              checked={a.mwstOption ?? false}
              onChange={(v) => set('mwstOption', v || undefined)}
              label={<><span><strong>MWST-Option</strong> des Vermieters <span className="text-ink-500">(Mietzins zzgl. {MV_PARAMETER.mwstSatz.wert.toFixed(1)} % MWST, Art. 22 MWSTG)</span></span></>} />
            <Checkbox
              checked={a.konkurrenzschutz ?? false}
              onChange={(v) => set('konkurrenzschutz', v || undefined)}
              label={<><span><strong>Konkurrenzschutz</strong> vereinbaren <span className="text-ink-500">(nicht vertragsimmanent – muss ausdrücklich umschrieben werden)</span></span></>} />
            {a.konkurrenzschutz && (
              <>
                <Field label="Geschützter Bereich (Branche/Nutzung)">
                  <input className={inputCls} value={a.konkurrenzschutzText ?? ''} onChange={(e) => set('konkurrenzschutzText', e.target.value || undefined)}
                    placeholder="z. B. Betrieb einer Apotheke" />
                </Field>
                <Field label="Konventionalstrafe (CHF)" optional hint="empfohlen – ein blosses Verbot erzwingt keine Auflösung des Konkurrenz-Mietvertrags">
                  <BetragsFeld className={inputCls + ' num w-44'} value={a.konkurrenzschutzStrafeCHF ?? ''} onChange={(v) => set('konkurrenzschutzStrafeCHF', v || undefined)} placeholder="z. B. 10'000" />
                </Field>
              </>
            )}
          </div>
        )}
        {a.detailgrad === 'experte' && (
          <div className="space-y-3 pt-1">
            <GruppenTitel><NormText text={`Mietzinsvorbehalt (Art. 18 VMWG)`} /></GruppenTitel>
            <Checkbox
              checked={a.mietzinsvorbehalt ?? false}
              onChange={(v) => set('mietzinsvorbehalt', v || undefined)}
              label={<><span><strong>Mietzinsvorbehalt</strong> aufnehmen <span className="text-ink-500">(nicht ausgeschöpfte Mietzinsanpassung, in Prozenten zu beziffern)</span></span></>} />
            {a.mietzinsvorbehalt && (
              <>
                <Field label="Vorbehalt (% des Nettomietzinses)" hint="ohne Bezifferung in Franken oder Prozenten geht der Vorbehalt verloren (Art. 18 VMWG)">
                  <input type="number" min={0} step={0.1} className={inputCls + ' num w-40'} value={a.vorbehaltProzent ?? ''} onChange={(e) => set('vorbehaltProzent', e.target.value || undefined)} />
                </Field>
                <Field label="Grund" optional>
                  <input className={inputCls} value={a.vorbehaltGrund ?? ''} onChange={(e) => set('vorbehaltGrund', e.target.value || undefined)} placeholder="z. B. nicht ausgeschöpfte Kostenmiete" />
                </Field>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}

function fehlerEingabe(a: MvAntworten, schritt: number): string[] {
  const wohnung = a.objektTyp === 'wohnung';
  const f: string[] = [];
  if (schritt === 0) {
    if (!a.objektBeschrieb.trim()) f.push('Mietobjekt umschreiben (z. B. «3.5-Zimmer-Wohnung im 2. OG»).');
    if (!a.objektAdresse.trim()) f.push('Adresse des Mietobjekts angeben.');
    if (!wohnung && !a.mietzweck?.trim()) f.push('Mietzweck angeben (Geschäftsraum).');
  }
  if (schritt === 1) {
    if (!a.vermieterName.trim() || !a.vermieterAdresse.trim()) f.push('Vermieter mit Adresse angeben.');
    if (!a.mieterName.trim() || !a.mieterAdresse.trim()) f.push('Mieter mit Adresse angeben.');
  }
  if (schritt === 2) {
    if (!a.beginn) f.push('Mietbeginn angeben.');
    if (a.befristet && !a.befristetBis) f.push('Enddatum der Befristung angeben.');
  }
  if (schritt === 3 && !a.mietzinsNettoCHF.trim()) f.push('Nettomietzins angeben.');
  return f;
}

const CONFIG: VorlagenSeitenConfig<MvAntworten, MvZ> = {
  cardId: 'mietvertrag-wohnen',
  musterdaten: MUSTER['mietvertrag-wohnen'],
  defaults: MV_DEFAULTS,
  speicherKey: SPEICHER_KEY,
  normalisieren: (g) => ({
    ...g,
    nkPositionen: Array.isArray(g.nkPositionen) ? g.nkPositionen : [],
    staffeln: Array.isArray(g.staffeln) ? g.staffeln : undefined,
  }),
  // Ist-Zustand vor dem Umzug (§6): kein Profil-Prefill, Detailgrad-Default
  // aus dem Schema statt aus den Einstellungen.
  profilPrefill: false,
  detailgradAusEinstellungen: false,
  zusammenstellen: (a) => ({ ergebnis: mvZusammenstellen(a) }),
  pruefeGates: (a) => pruefeMvGates(a),
  schritte: SCHRITTE,
  overlineFallback: 'Miete',
  titel: 'Mietvertrag',
  intro: 'Stellt einen Mietvertrag für Wohn- oder Geschäftsräume aus festen, juristisch vorformulierten Bausteinen zusammen – mit harten Schranken für zwingendes Recht (Kautionsmaximum, Mindestfristen, Index-/Staffel-Voraussetzungen) und offengelegten kantonalen Form-Gates. Ohne Sprachmodell: gleiche Eingaben, gleiches Dokument.',
  badge: 'Beidseitig zu unterzeichnen',
  kopfSchalter: ({ a, set }) => <VariantenKopf detailgrad={a.detailgrad} onDetailgrad={(v) => set('detailgrad', v)} />,
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
  bestaetigung: ({ a }) => {
    const wohnung = a.objektTyp === 'wohnung';
    return (
      <>
        <p className="lc-overline text-brass-700">Form-Gate – damit der Vertrag trägt</p>
        <ul className="lc-list space-y-2 text-body-s text-ink-700">
          <li><strong>Beidseitig unterzeichnen</strong> – erfüllt die Schriftform von Index-/Staffelmiete.</li>
          <li><strong>Elektronisch nur mit QES:</strong><NormText text={` Die Schriftform erfüllt elektronisch nur die qualifizierte elektronische Signatur mit qualifiziertem Zeitstempel (Art. 14 Abs. 2bis OR) – einfache E-Signatur oder eingescannte Unterschrift genügen nicht.`} /></li>
          {wohnung && <li><strong>Formularpflicht prüfen:</strong><NormText text={` In BS, BE, FR, GE, LU, NE*, VD*, ZG und ZH ist der Anfangsmietzins mit dem amtlichen Formular mitzuteilen – sonst ist die Mietzinsabrede nichtig (Art. 270 Abs. 2 OR; Stand 4.2.2026, dynamisch).`} /></li>}
          <li><strong>Übergabeprotokoll</strong> bei Einzug gemeinsam erstellen (Beweissicherung).</li>
          <li><strong>Kaution</strong><NormText text={` auf ein Sperrkonto auf den Namen des Mieters einzahlen (Art. 257e OR).`} /></li>
          {!wohnung && <li><strong>MWST-Option:</strong> Rechnungsanforderungen (Art. 26 MWSTG) für den Vorsteuerabzug beachten.</li>}
        </ul>
      </>
    );
  },
  bestaetigungLabel: 'Ich habe verstanden: Dies ist ein Entwurf nach festen Bausteinen – kantonale Formularpflichten, Referenzzins-Stand und der Einzelfall sind gesondert zu prüfen.',
  bestaetigungLabelCls: 'flex items-start gap-2.5 py-1.5 text-body-s cursor-pointer text-ink-900 font-medium pt-1',
  pruefenFuss: (
    <details className="lc-card p-4">
      <summary className="cursor-pointer text-body-s font-medium text-ink-700">Offene Verifikationen ({MV_OFFENE_VERIFIKATIONEN.length})</summary>
      <ul className="mt-2 space-y-1.5">
        {MV_OFFENE_VERIFIKATIONEN.map((v, i) => <li key={i} className="text-xs text-ink-500">– {v}</li>)}
      </ul>
    </details>
  ),
  banner: BANNER_MV,
  dateiBasis: 'Mietvertrag-Entwurf',
  pdfLabel: 'Vertrag als PDF',
  docxLabel: 'Vertrag als Word (DOCX)',
};

export function VorlageMietvertrag() {
  // Hash-Vorauswahl der Katalog-Karte «untermietvertrag» (#untermiete) —
  // Muster RechnerKuendigung (adjusting state, kein Effect; läuft in
  // VorlagenSeite über `vorauswahl`). Setzt die Weiche samt denselben
  // Untermiete-Defaults wie der UI-Schalter; überschreibt auch einen
  // gespeicherten Hauptmiete-Stand (bewusst: der Link sagt Untermiete).
  const { hash } = useLocation();
  const config = useMemo<VorlagenSeitenConfig<MvAntworten, MvZ>>(() => ({
    ...CONFIG,
    vorauswahl: {
      schluessel: hash,
      anwenden: (a) => hash === '#untermiete' && a.mietverhaeltnis !== 'untermiete'
        ? { mietverhaeltnis: 'untermiete', zustimmungStatus: 'nicht_angefragt', untermieteUmfang: 'ganz' }
        : undefined,
    },
  }), [hash]);
  return <VorlagenSeite config={config} />;
}
