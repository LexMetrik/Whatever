import { useMemo, useState } from 'react';
import { BeruehrtRahmen, Checkbox, ErgebnisPlatzhalter, Field, inputCls } from '../vorlagen/ui';
import { zahlBeliebig as zahl } from './eingabe';
import { NormText } from '../NormText';
import { KantonArtikelTrigger } from '../KantonQuelleLink';
import { KantonNormText } from '../KantonNormText';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { BetragsFeld } from '../BetragsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { permalinkKodieren, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import {
  berechneProzesskosten, berechneKostenrisiko, berechneKostenvorschuss, berechneMwstParteientschaedigung,
  berechneInstanzenzug, berechneSicherheitsleistung, verfahrensausgang, prozesskostenBericht,
  vergleichAlleKantone, postenText, MATERIEN, VERFAHRENSPHASEN, VERFAHRENSARTEN, INSTANZEN, KANTONE, WEITERE_KOSTENPOSTEN,
  VERFAHRENSAUSGAENGE, KOSTENVERTEILUNG_SONDERFAELLE,
  type KantonCode, type Verfahrensphase, type Materie, type Verfahrensart, type Instanz, type Verfahrensausgang, type PostenErgebnis,
} from '../../lib/prozesskosten';
import { KANTON_NAMEN } from '../../data/tarif/typen';
import { getStandardKanton } from '../../lib/einstellungen';
import { chfGanz as chf } from '../../lib/vorlagen/datum';
import { usePaneKlasse } from '../layout/PaneKontext';

// ─── Prozesskosten-Cockpit (Art. 95/96 ZPO) ─────────────────────────────────
// Reine Darstellung (§3): gerechnet wird in lib/prozesskosten.ts über die
// amtlich verifizierte Datenschicht. Matrix Kanton × Verfahren × Verfahrensart ×
// Instanz (inkl. Bundesgericht) × Materie + Kostenrisiko + interkant. Vergleich.

const DISCLAIMER =
  'Prozesskosten = Gerichtskosten + Parteientschädigung (Art. 95 ZPO); die Kantone setzen die Tarife fest (Art. 96 ZPO). ' +
  'Angezeigt werden die Grund-/Entscheidgebühr bzw. das Grundhonorar nach Streitwert. Ermessenstarife erscheinen als Spanne, nie als erfundener Punktwert. ' +
  'Gerichtliche Erhöhungen/Ermässigungen, Auslagen, Beweis-/Übersetzungskosten und MwSt. sind nicht enthalten. Kostenvorschuss i. d. R. bis ½ der mutmasslichen Gerichtskosten (Art. 98 ZPO). Keine Rechtsberatung.';

const PK_LINK_SPEC: PermalinkSpec<Record<string, unknown>> = {
  kanton: { p: 'kt', typ: 'str', gueltig: einerVon(...KANTONE) },
  sw: { p: 'sw', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  phase: { p: 'ph', typ: 'str', gueltig: einerVon('schlichtung', 'entscheid') },
  materie: { p: 'ma', typ: 'str', gueltig: einerVon(...MATERIEN.map((m) => m.wert)) },
  instanz: { p: 'in', typ: 'str', gueltig: einerVon(...INSTANZEN.map((i) => i.wert)) },
  verfahren: { p: 'vf', typ: 'str', gueltig: einerVon(...VERFAHRENSARTEN.map((v) => v.wert)) },
  quote: { p: 'q', typ: 'num', gueltig: (n) => Number.isInteger(n) && n >= 0 && n <= 100 },
  mwst: { p: 'mw', typ: 'bool' },
  nv: { p: 'nv', typ: 'bool' },
};

const spanneText = (s?: { vonChf: number; bisChf: number }): string =>
  !s ? '—' : s.vonChf === s.bisChf ? chf(s.vonChf) : `${chf(s.vonChf)} – ${chf(s.bisChf)}`;

// Sortier-Untergrenze eines Postens (für den interkantonalen Vergleich:
// günstigste zuoberst). kostenlos = 0; nicht bezifferbar (Schlichtungspauschale /
// aufwandbasiert) = Infinity → ans Ende, da nicht vergleichbar.
const untergrenzeChf = (p: PostenErgebnis): number => {
  if (p.kostenlos) return 0;
  const e = p.ergebnis;
  if (!e) return Number.POSITIVE_INFINITY;
  if (e.deterministisch) return e.betragChf;
  if (typeof e.vonChf === 'number') return e.vonChf;
  if (typeof e.bisChf === 'number') return e.bisChf;
  return Number.POSITIVE_INFINITY;
};
const vergleichSortwert = (r: { gerichtskosten: PostenErgebnis; parteientschaedigung: PostenErgebnis }): number =>
  untergrenzeChf(r.gerichtskosten) + untergrenzeChf(r.parteientschaedigung);

function PostenKarte({ titel, posten }: { titel: string; posten: PostenErgebnis }) {
  const q = posten.quelle;
  return (
    <div className="lc-tile lc-akzent-w">
      <p className="text-xs text-ink-500 mb-1">{titel}</p>
      <p key={postenText(posten)} className="lc-wert-puls text-body-l font-semibold text-ink-900 num">{postenText(posten)}</p>
      {posten.kostenlos
        ? <p className="mt-1 text-body-s text-ink-600">{posten.kostenlosGrund}</p>
        : posten.schlichtungspauschale
          ? <p className="mt-1 text-body-s text-ink-600">Art. 95 II lit. a ZPO: eigener, meist reduzierter Tarif (oft ein Bruchteil der Entscheidgebühr) – hier nicht beziffert.</p>
          : posten.ergebnis && !posten.ergebnis.deterministisch
            ? <p className="mt-1 text-body-s text-ink-600">
                Ermessensrahmen – konkrete Festsetzung durch die Behörde
                {q.kriterien && q.kriterien.length > 0
                  ? <>; massgebend: {q.kriterien.join(', ')}{q.kriterienNorm ? ` (${q.kriterienNorm})` : ''}.</>
                  : '.'}
              </p>
            : null}
      <p className="mt-2 text-xs text-ink-500">
        {q.erlassName} ({q.erlassNr}), <KantonArtikelTrigger quelle={q} /> · Stand {q.stand}
        {q.verifiziert === 'recherche' ? ' · nicht abgenommen' : ''}
        {' · '}
        <a href={q.quelleUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">amtliche Quelle ↗</a>
      </p>
      {q.hinweis && <p className="mt-1 text-xs text-ink-500"><KantonNormText text={q.hinweis} quelle={q} /></p>}
    </div>
  );
}

export function ProzesskostenForm({ minimal = false }: { minimal?: boolean } = {}) {
  const pk = usePaneKlasse();
  const ausLink = usePermalinkFelder(PK_LINK_SPEC);

  const [kanton, setKanton] = useState<KantonCode>((ausLink.kanton as KantonCode) ?? getStandardKanton());
  const [sw, setSw] = useState<string>(ausLink.sw != null ? String(ausLink.sw) : '');
  const [phase, setPhase] = useState<Verfahrensphase>((ausLink.phase as Verfahrensphase) ?? 'entscheid');
  const [materie, setMaterie] = useState<Materie>((ausLink.materie as Materie) ?? 'allgemein');
  const [instanz, setInstanz] = useState<Instanz>((ausLink.instanz as Instanz) ?? 'erstinstanz');
  const [verfahren, setVerfahren] = useState<Verfahrensart>((ausLink.verfahren as Verfahrensart) ?? 'ordentlich');
  const [quote, setQuote] = useState<number>(typeof ausLink.quote === 'number' ? (ausLink.quote as number) : 50);
  const [ausgang, setAusgang] = useState<Verfahrensausgang>('quote');
  const [ur, setUr] = useState(false);
  const [vergleich, setVergleich] = useState(false);
  const [mwst, setMwst] = useState<boolean>(ausLink.mwst === true);
  const [zug, setZug] = useState(false);
  const [kaution, setKaution] = useState(false);
  const [nv, setNv] = useState<boolean>(ausLink.nv === true);
  const [aktenzeichen, setAktenzeichen] = useState('');
  // Geteilter Link mit Quote (q=…) öffnet das Kostenrisiko-Panel direkt.
  const [risiko, setRisiko] = useState(typeof ausLink.quote === 'number');

  const bger = instanz === 'bundesgericht';
  const handelsgericht = instanz === 'handelsgericht';
  const einzelinstanz = bger || handelsgericht; // einzige Instanz: keine Phase/Verfahrensart
  // Handelsgericht: kein Schlichtungsverfahren (Art. 198 lit. f) → Entscheid erzwingen.
  const effektivePhase: Verfahrensphase = handelsgericht ? 'entscheid' : phase;
  const verfahrenRelevant = effektivePhase === 'entscheid' && !einzelinstanz;

  // Nicht vermögensrechtlich: kein Streitwert nötig; intern 0 (die NV-Tarife
  // sind Rahmen ohne Streitwert-Bezug). Sonst: Streitwert-Eingabe erforderlich.
  const streitwertRoh = zahl(sw);
  const streitwert = nv ? 0 : streitwertRoh;
  const hatEingabe = nv || streitwertRoh !== undefined;
  const ergebnis = useMemo(
    () => !hatEingabe ? null : berechneProzesskosten({ kanton, streitwertCHF: streitwert!, phase: effektivePhase, materie, instanz, verfahren: verfahrenRelevant ? verfahren : 'ordentlich', nichtVermoegensrechtlich: nv }),
    [kanton, streitwert, hatEingabe, effektivePhase, materie, instanz, verfahren, verfahrenRelevant, nv],
  );
  const vergleichsListe = useMemo(
    () => (vergleich && hatEingabe && !einzelinstanz) ? vergleichAlleKantone(streitwert!, effektivePhase, materie, instanz, verfahrenRelevant ? verfahren : 'ordentlich', nv) : null,
    [vergleich, streitwert, hatEingabe, effektivePhase, materie, instanz, verfahren, verfahrenRelevant, einzelinstanz, nv],
  );
  const ausgangInfo = verfahrensausgang(ausgang, quote / 100);
  const kostenrisiko = useMemo(
    () => {
      if (!risiko || !ergebnis) return null;
      const a = verfahrensausgang(ausgang, quote / 100);
      return a.quote === null ? null : berechneKostenrisiko(ergebnis.gerichtskosten, ergebnis.parteientschaedigung, a.quote, ur);
    },
    [risiko, ergebnis, ausgang, quote, ur],
  );
  const vorschuss = useMemo(
    () => ergebnis ? berechneKostenvorschuss(ergebnis.gerichtskosten, effektivePhase, instanz, verfahrenRelevant ? verfahren : 'ordentlich') : null,
    [ergebnis, effektivePhase, instanz, verfahren, verfahrenRelevant],
  );
  const mwstAufschlag = useMemo(
    () => (mwst && ergebnis) ? berechneMwstParteientschaedigung(ergebnis.parteientschaedigung) : null,
    [mwst, ergebnis],
  );
  const instanzenzug = useMemo(
    () => (zug && hatEingabe && !einzelinstanz) ? berechneInstanzenzug(kanton, streitwert!, materie, verfahrenRelevant ? verfahren : 'ordentlich',
      { schlichtung: true, erstinstanz: true, rechtsmittel: true, bundesgericht: true }, nv) : null,
    [zug, kanton, streitwert, hatEingabe, materie, verfahren, verfahrenRelevant, einzelinstanz, nv],
  );
  const sicherheit = useMemo(
    () => (kaution && ergebnis) ? berechneSicherheitsleistung(ergebnis.parteientschaedigung, effektivePhase, verfahrenRelevant ? verfahren : 'ordentlich', materie, nv) : null,
    [kaution, ergebnis, effektivePhase, verfahren, verfahrenRelevant, materie, nv],
  );

  const pdfConfig: PdfDocConfig | null = useMemo(() => {
    if (!ergebnis) return null;
    return {
      aktenzeichen: aktenzeichen.trim() || undefined,
      title: 'Prozesskosten (Art. 95/96 ZPO)',
      rechtsgrundlage: `${KANTON_NAMEN[kanton]} · ${VERFAHRENSPHASEN.find((p) => p.wert === effektivePhase)?.label}${verfahrenRelevant && verfahren !== 'ordentlich' ? `, ${VERFAHRENSARTEN.find((v) => v.wert === verfahren)?.label}` : ''} · ${INSTANZEN.find((i) => i.wert === instanz)?.label}`,
      domain: 'prozesskosten',
      fileBase: 'Prozesskosten',
      inputs: {
        'Kanton': `${kanton} — ${KANTON_NAMEN[kanton]}`,
        ...(nv ? { 'Streitigkeit': 'nicht vermögensrechtlich (kein Streitwert)' }
              : { 'Streitwert': streitwertRoh !== undefined ? `CHF ${streitwertRoh.toLocaleString('de-CH')}` : '–' }),
        'Verfahrensphase': VERFAHRENSPHASEN.find((p) => p.wert === effektivePhase)?.label ?? '',
        ...(verfahrenRelevant ? { 'Verfahrensart': VERFAHRENSARTEN.find((v) => v.wert === verfahren)?.label ?? '' } : {}),
        'Instanz': INSTANZEN.find((i) => i.wert === instanz)?.label ?? '',
        'Materie': MATERIEN.find((m) => m.wert === materie)?.label ?? '',
      },
      sections: [{ titel: 'Kostenschätzung', ergebnis: prozesskostenBericht(ergebnis, {
        vorschuss: vorschuss ?? undefined, mwst: mwstAufschlag, kostenrisiko, instanzenzug, sicherheit,
      }) }],
      disclaimer: DISCLAIMER,
    };
  }, [ergebnis, aktenzeichen, kanton, streitwertRoh, nv, effektivePhase, verfahren, verfahrenRelevant, instanz, materie, vorschuss, mwstAufschlag, kostenrisiko, instanzenzug, sicherheit]);

  return (
    <BeruehrtRahmen>
    <div className="space-y-6 lc-rechner-spalten">
      {/* Startseite-Schnellrechner (minimal): kein per-Tab-Disclaimer — die Startseite
          trägt den globalen Pflicht-Hinweis (§8). Voll-Rechner: Disclaimer bleibt. */}
      {!minimal && <PflichtDisclaimer kurz="Gerichtskosten + Parteientschädigung nach kantonalem Tarif (Art. 95/96 ZPO); Ermessenstarife als Spanne." text={DISCLAIMER} />}

      <label className="flex items-start gap-2 text-body-s text-ink-700">
        <input type="checkbox" checked={nv} onChange={(e) => setNv(e.target.checked)} className="mt-0.5" aria-label="Nicht vermögensrechtliche Streitigkeit" />
        <span>Nicht vermögensrechtliche Streitigkeit (kein Streitwert) — eigener kantonaler Gebührenrahmen, Festsetzung nach Bedeutung/Aufwand</span>
      </label>

      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Kanton">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as KantonCode)} className={inputCls} aria-label="Kanton">
            {KANTONE.map((k) => <option key={k} value={k}>{k} — {KANTON_NAMEN[k]}</option>)}
          </select>
        </Field>
        {!nv && (
          <Field label="Streitwert (CHF)" hint="vermögensrechtliche Streitigkeit nach Art. 91 ff. ZPO">
            <BetragsFeld value={sw} onChange={setSw} className={inputCls} placeholder="z. B. 50'000" />
          </Field>
        )}
        <Field label="Instanz">
          <select value={instanz} onChange={(e) => setInstanz(e.target.value as Instanz)} className={inputCls} aria-label="Instanz">
            {INSTANZEN.map((i) => <option key={i.wert} value={i.wert}>{i.label}</option>)}
          </select>
        </Field>
        {!einzelinstanz && (
          <Field label="Verfahrensphase">
            <select value={phase} onChange={(e) => setPhase(e.target.value as Verfahrensphase)} className={inputCls} aria-label="Verfahrensphase">
              {VERFAHRENSPHASEN.map((p) => <option key={p.wert} value={p.wert}>{p.label}</option>)}
            </select>
          </Field>
        )}
        {verfahrenRelevant && (
          <Field label="Verfahrensart" hint="Modifikator auf den Basistarif (summarisch/vereinfacht)">
            <select value={verfahren} onChange={(e) => setVerfahren(e.target.value as Verfahrensart)} className={inputCls} aria-label="Verfahrensart">
              {VERFAHRENSARTEN.map((v) => <option key={v.wert} value={v.wert}>{v.label}</option>)}
            </select>
          </Field>
        )}
        <Field label="Materie" hint="für kostenlose Verfahren (Art. 113/114 ZPO)">
          <select value={materie} onChange={(e) => setMaterie(e.target.value as Materie)} className={inputCls} aria-label="Materie">
            {MATERIEN.map((m) => <option key={m.wert} value={m.wert}>{m.label}</option>)}
          </select>
        </Field>
      </div>

      {/* QS-UI 8b: Ergebnisplatz auch im Leerzustand angesagt (W2·10-UI-NAV/N0d·W1). */}
      {!ergebnis && (
        <ErgebnisPlatzhalter was="Kanton und Streitwert wählen — hier erscheinen Gerichtskosten und Parteientschädigung mit ihrer Herleitung." />
      )}

      {ergebnis && (
        <ErgebnisBlock>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-3')}>
            <PostenKarte titel={bger ? 'Gerichtskosten (BGer)' : handelsgericht ? 'Gerichtskosten (Handelsgericht)' : effektivePhase === 'schlichtung' ? 'Gerichtskosten (Schlichtungstarif)' : 'Gerichtskosten (Entscheidgebühr)'} posten={ergebnis.gerichtskosten} />
            <PostenKarte titel="Parteientschädigung" posten={ergebnis.parteientschaedigung} />
          </div>

          {/* Kostenvorschuss (Art. 98 ZPO / Art. 62 BGG) — Liquiditätsposten. */}
          {vorschuss && (
            <div className="mt-3 lc-tile">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="text-xs text-ink-500">Mutmasslicher Kostenvorschuss <span className="text-ink-500">({vorschuss.norm})</span></p>
                <p className="num text-body-l font-semibold text-ink-900">
                  {vorschuss.spanne ? (vorschuss.faktor === 0.5 ? `bis ${spanneText(vorschuss.spanne)}` : spanneText(vorschuss.spanne)) : '—'}
                </p>
              </div>
              <p className="mt-1 text-xs text-ink-500"><NormText text={vorschuss.hinweis} /></p>
            </div>
          )}

          {/* MwSt auf die Parteientschädigung (Art. 95 III lit. b ZPO i.V.m. MWSTG) — fallabhängig. */}
          {!ergebnis.parteientschaedigung.kostenlos && (
            <Checkbox checked={mwst} onChange={setMwst} className="mt-3" label="Berechtigte Partei nicht vorsteuerabzugsberechtigt (z. B. Privatperson) — MwSt auf die Parteientschädigung hinzurechnen" />
          )}
          {mwstAufschlag && (
            <div className="mt-2 lc-tile lc-akzent-w">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="text-xs text-ink-500">Parteientschädigung inkl. MwSt {mwstAufschlag.satzProzent.toLocaleString('de-CH')} %</p>
                <p className="num text-body-l font-semibold text-ink-900">
                  {mwstAufschlag.bruttoSpanne ? spanneText(mwstAufschlag.bruttoSpanne) : '—'}
                </p>
              </div>
              {mwstAufschlag.betrag && <p className="mt-1 text-xs text-ink-500">MwSt-Anteil: {spanneText(mwstAufschlag.betrag)}.</p>}
              <p className="mt-1 text-xs text-ink-500"><NormText text={mwstAufschlag.hinweis} /></p>
            </div>
          )}

          <ul className="mt-3 space-y-1 text-xs text-ink-500 list-disc pl-5">
            {ergebnis.hinweise.map((h, i) => <li key={i}><NormText text={h} /></li>)}
          </ul>

          {/* Weitere, nicht bezifferbare Kostenposten (Art. 95 II c–e / III a; UR Art. 117 ff.). */}
          <details className="mt-3 border border-line bg-surface p-3">
            <summary className="cursor-pointer text-body-s text-ink-700 hover:text-ink-900">Weitere Kostenposten (nicht beziffert)</summary>
            <ul className="mt-2 space-y-1 text-xs text-ink-500 list-disc pl-5">
              {WEITERE_KOSTENPOSTEN.map((h, i) => <li key={i}><NormText text={h} /></li>)}
            </ul>
          </details>

          {/* I9: Querverweis auf die GebV SchKG (Art. 16 SchKG, vorbehalten in Art. 96 ZPO). */}
          <p className="mt-3 text-xs text-ink-500">
            Betreibungsrechtliche Verfahren (Rechtsöffnung, Arrest, Aberkennung): Für die Betreibungshandlungen gilt die bundesrechtlich abschliessende GebV SchKG (Art. 16 SchKG, vorbehalten in Art. 96 ZPO) — siehe{' '}
            <a href="/rechner/betreibungskosten" className="underline hover:text-ink-800">Betreibungskosten-Rechner</a>. Die gerichtliche Entscheidgebühr (z. B. Rechtsöffnung) richtet sich nach dem kantonalen Tarif bzw. Art. 48 GebV SchKG.
          </p>

          {/* I9: Querverweis auf die Notariats-/Grundbuchgebühren (freiwillige Gerichtsbarkeit, eigener kantonaler Tarif). */}
          <p className="mt-3 text-xs text-ink-500">
            Beurkundung & Grundbuch (Kaufvertrag, Grundpfand, Eintragung): Notariats- und Grundbuchgebühren folgen einem eigenen kantonalen Tarif (öffentliche Beurkundung Art. 55 SchlT ZGB; Grundbuchgebühren Art. 954 ZGB) und sind nicht Teil der Prozesskosten — siehe{' '}
            <a href="/rechner/notariat-grundbuch" className="underline hover:text-ink-800">Notariats- &amp; Grundbuchkosten-Rechner</a>.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setRisiko((v) => !v)}
              className="text-body-s underline text-ink-700 hover:text-ink-900">
              {risiko ? 'Kostenrisiko ausblenden' : 'Kostenrisiko bei Teilobsiegen berechnen →'}
            </button>
            {!einzelinstanz && (
              <button type="button" onClick={() => setVergleich((v) => !v)}
                className="text-body-s underline text-ink-700 hover:text-ink-900">
                {vergleich ? 'Interkantonalen Vergleich ausblenden' : 'Was würde es in anderen Kantonen kosten? →'}
              </button>
            )}
            {!einzelinstanz && (
              <button type="button" onClick={() => setZug((v) => !v)}
                className="text-body-s underline text-ink-700 hover:text-ink-900">
                {zug ? 'Instanzenzug ausblenden' : 'Gesamtkosten über den Instanzenzug →'}
              </button>
            )}
            <button type="button" onClick={() => setKaution((v) => !v)}
              className="text-body-s underline text-ink-700 hover:text-ink-900">
              {kaution ? 'Sicherheitsleistung ausblenden' : 'Sicherheit für die Parteientschädigung (Art. 99) →'}
            </button>
          </div>

          {risiko && (
            <div className="mt-4 border border-line bg-surface p-4">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <label htmlFor="pk-ausgang" className="text-body-s text-ink-700">Verfahrensausgang</label>
                <select id="pk-ausgang" value={ausgang} onChange={(e) => setAusgang(e.target.value as Verfahrensausgang)} className={inputCls + ' sm:max-w-[20rem]'} aria-label="Verfahrensausgang">
                  {VERFAHRENSAUSGAENGE.map((a) => <option key={a.wert} value={a.wert}>{a.label}</option>)}
                </select>
              </div>
              {ausgang === 'quote' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <label htmlFor="pk-quote" className="text-body-s text-ink-700">Ihre Obsiegensquote</label>
                  <input id="pk-quote" type="range" min={0} max={100} step={5} value={quote} onChange={(e) => setQuote(Number(e.target.value))} className="flex-1 min-w-[8rem]" aria-label="Obsiegensquote in Prozent" />
                  <span className="num text-body-s font-semibold text-ink-900 w-12 text-right">{quote} %</span>
                </div>
              )}
              <p className="mt-2 text-xs text-ink-500"><NormText text={ausgangInfo.hinweis} /> <span className="text-ink-500">({ausgangInfo.norm})</span></p>
              <Checkbox checked={ur} onChange={setUr} className="mt-2" label="Unentgeltliche Rechtspflege bewilligt (Art. 117 ff. ZPO) — befreit von Vorschuss/Gerichtskosten, aber nicht von der gegnerischen Parteientschädigung" />
              {!kostenrisiko ? (
                <p className="mt-3 text-body-s text-ink-600">Ermessensverteilung — kein bezifferter Wert; massgebend ist die richterliche Würdigung.</p>
              ) : kostenrisiko.berechenbar ? (
                <>
                  <div className={pk('mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3', 'mt-3 grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
                    <div className="lc-tile">
                      <p className="text-xs text-ink-500 mb-1">Gerichtskosten zu Ihren Lasten{kostenrisiko.unentgeltlich ? ' (UR-befreit)' : ''}</p>
                      <p className="num text-body-l font-semibold text-ink-900">{spanneText(kostenrisiko.gerichtskostenZuLasten)}</p>
                    </div>
                    <div className="lc-tile">
                      <p className="text-xs text-ink-500 mb-1">Parteientschädigung (Saldo)</p>
                      <p className="num text-body-l font-semibold text-ink-900">{spanneText(kostenrisiko.parteientschaedigungSaldo)}</p>
                      <p className="mt-1 text-xs text-ink-500">+ Sie erhalten · − Sie zahlen</p>
                    </div>
                    <div className="lc-tile lc-akzent-w">
                      <p className="text-xs text-ink-500 mb-1">{kostenrisiko.unentgeltlich ? 'Netto trotz UR (nur Gegenpartei)' : 'Geschätzte Netto-Kostenbelastung'}</p>
                      <p className="num text-body-l font-semibold text-ink-900">{spanneText(kostenrisiko.nettoBelastung)}</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-ink-500 list-disc pl-5">
                    {kostenrisiko.hinweise.map((h, i) => <li key={i}><NormText text={h} /></li>)}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-body-s text-ink-600"><NormText text={kostenrisiko.hinweise[kostenrisiko.hinweise.length - 1]} /></p>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-ink-600 hover:text-ink-800">Verteilungs-Sonderfälle (Art. 106 III / 107–109 ZPO)</summary>
                <ul className="mt-2 space-y-1 text-xs text-ink-500 list-disc pl-5">
                  {KOSTENVERTEILUNG_SONDERFAELLE.map((h, i) => <li key={i}><NormText text={h} /></li>)}
                </ul>
              </details>
            </div>
          )}

          {vergleichsListe && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-body-s border-collapse">
                <caption className="text-xs text-ink-500 text-left mb-2">
                  Interkantonaler Vergleich {nv ? '(nicht vermögensrechtlich)' : `bei Streitwert CHF ${streitwertRoh?.toLocaleString('de-CH')}`} ({VERFAHRENSPHASEN.find((p) => p.wert === phase)?.label}{verfahrenRelevant && verfahren !== 'ordentlich' ? `, ${VERFAHRENSARTEN.find((v) => v.wert === verfahren)?.label}` : ''}{instanz === 'rechtsmittel' ? ', Rechtsmittel' : ''}, {MATERIEN.find((m) => m.wert === materie)?.label}) — Gerichtsgebühr / Parteientschädigung, aufsteigend sortiert (günstigste zuoberst; nicht bezifferbare Tarife zuunterst). Quelle je Kanton verlinkt.
                </caption>
                <thead>
                  <tr className="lc-overline border-b border-line">
                    <th className="text-left py-2 pr-3">Kanton</th>
                    <th className="text-right py-2 px-3">Gerichtskosten</th>
                    <th className="text-right py-2 pl-3">Parteientschädigung</th>
                  </tr>
                </thead>
                <tbody>
                  {[...vergleichsListe].sort((a, b) => vergleichSortwert(a) - vergleichSortwert(b)).map((r) => (
                    <tr key={r.kanton} className={`border-b border-line/60 ${r.kanton === kanton ? 'bg-surface-raised font-medium' : ''}`}>
                      <td className="py-1.5 pr-3">
                        <a href={r.gerichtskosten.quelle.quelleUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" title={`${r.gerichtskosten.quelle.erlassName} (${r.gerichtskosten.quelle.erlassNr})`}>{r.kanton}</a>
                      </td>
                      <td className="py-1.5 px-3 text-right num text-ink-800">{postenText(r.gerichtskosten)}</td>
                      <td className="py-1.5 pl-3 text-right num text-ink-800">{postenText(r.parteientschaedigung)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {zug && instanzenzug && (
            <div className="mt-4 border border-line bg-surface p-4">
              <p className="lc-overline">Gesamtkostenrisiko über den Instanzenzug</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[30rem] text-body-s border-collapse">
                  <thead>
                    <tr className="lc-overline border-b border-line">
                      <th className="text-left py-2 pr-3">Stufe</th>
                      <th className="text-right py-2 px-3">Gerichtskosten</th>
                      <th className="text-right py-2 pl-3">Parteientschädigung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instanzenzug.stufen.map((s) => (
                      <tr key={s.schluessel} className="border-b border-line/60">
                        <td className="py-1.5 pr-3">{s.label}</td>
                        <td className="py-1.5 px-3 text-right num text-ink-800">{postenText(s.ergebnis.gerichtskosten)}</td>
                        <td className="py-1.5 pl-3 text-right num text-ink-800">{postenText(s.ergebnis.parteientschaedigung)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold text-ink-900 border-t border-line">
                      <td className="py-2 pr-3">Summe (Unterliegen auf jeder Stufe)</td>
                      <td className="py-2 px-3 text-right num">{spanneText(instanzenzug.gesamtGk ?? undefined)}</td>
                      <td className="py-2 pl-3 text-right num">{spanneText(instanzenzug.gesamtPe ?? undefined)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 num text-body-l font-semibold text-ink-900">
                Gesamt: {spanneText(instanzenzug.gesamt ?? undefined)}{instanzenzug.unbeziffert ? ' (Untergrenze)' : ''}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-ink-500 list-disc pl-5">
                {instanzenzug.hinweise.map((h, i) => <li key={i}><NormText text={h} /></li>)}
              </ul>
            </div>
          )}

          {kaution && sicherheit && (
            <div className="mt-4 border border-line bg-surface p-4">
              <p className="lc-overline"><NormText text={`Sicherheit für die Parteientschädigung (Art. 99 ZPO)`} /></p>
              {sicherheit.moeglich ? (
                <p className="mt-2 num text-body-l font-semibold text-ink-900">{sicherheit.spanne ? spanneText(sicherheit.spanne) : 'nicht beziffert'}</p>
              ) : (
                <p className="mt-2 text-body-s text-ink-700">{sicherheit.ausschluss}</p>
              )}
              <ul className="mt-2 space-y-1 text-xs text-ink-500 list-disc pl-5">
                {sicherheit.hinweise.map((h, i) => <li key={i}><NormText text={h} /></li>)}
              </ul>
            </div>
          )}

          {/* §R-5 (W2·29-WERKBANK-RECHNER R5a, 24.9.2026): Aktenzeichen → PDF →
              Teilen in der geteilten Exportzeile; «Teilen» stand vorher in der Schalterzeile (Kostenrisiko/Vergleich/Instanzenzug/Art. 99). */}
          <div className="mt-5 border-t border-line pt-4 space-y-3">
            <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
              query={() => permalinkKodieren(PK_LINK_SPEC, { kanton, sw: nv ? undefined : streitwertRoh, phase, materie, instanz, verfahren: verfahrenRelevant ? verfahren : undefined, quote: risiko ? quote : undefined, mwst: mwst ? true : undefined, nv: nv ? true : undefined })} />
          </div>
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
