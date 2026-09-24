import { useMemo, useState } from 'react';
import { BeruehrtRahmen, Field, inputCls } from '../vorlagen/ui';
import { zahlNichtNegativ as zahl } from './eingabe';
import { NormText } from '../NormText';
import { KantonArtikelTrigger } from '../KantonQuelleLink';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { BetragsFeld } from '../BetragsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { permalinkKodieren, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { NotariatGrundbuchForm } from './NotariatGrundbuchForm';
import { GrundbuchEintragForm } from './GrundbuchEintragForm';
import {
  berechneBeurkundung, vergleichBeurkundung, beurkundungBericht, beurkundungSortwert, istWertbasiert,
  type BeurkundungErgebnis,
} from '../../lib/beurkundung';
import { ngPostenText, ergebnisSpanne } from '../../lib/notariatGrundbuch';
import { weitereKosten } from '../../lib/beurkundungZusatzkosten';
import {
  GESCHAEFTSARTEN_NACH_GRUPPE, geschaeftsart, GESCHAEFTSART_IDS, type GeschaeftsartId,
} from '../../data/tarif/beurkundung-typen';
import { KANTONE, KANTON_NAMEN, type KantonCode } from '../../data/tarif/typen';
import { getStandardKanton } from '../../lib/einstellungen';
import { chfGanz as chf } from '../../lib/vorlagen/datum';
import { Tabs } from '../ui/Tabs';

// ─── Allgemeiner Beurkundungskosten-Rechner (alle Geschäftsarten) ───────────
// Reine Darstellung (§3): gerechnet wird in lib/beurkundung.ts über die amtlich
// belegte Datenschicht. Geschäftsart-Vorschalter; Grundstückkauf rendert
// unverändert den bestehenden 4-Block-Rechner (keine Regression). Übrige Arten:
// die einzelne Beurkundungsgebühr nach Geschäftswert + interkantonaler Vergleich.
// §8: fehlt ein kantonaler Tarif noch (Recherche), wird das ehrlich ausgewiesen.

const BK_LINK_SPEC: PermalinkSpec<Record<string, unknown>> = {
  art: { p: 'ga', typ: 'str', gueltig: einerVon(...GESCHAEFTSART_IDS) },
  wert: { p: 'gw', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  kanton: { p: 'kt', typ: 'str', gueltig: einerVon(...KANTONE) },
};

function GeschaeftsartWahl({ value, onChange }: { value: GeschaeftsartId; onChange: (v: GeschaeftsartId) => void }) {
  // Grundstückkauf hat einen eigenen Bereich (4 Kostenblöcke) → hier ausgeblendet.
  return (
    <Field label="Geschäftsart" hint="Was wird öffentlich beurkundet?">
      <select value={value} onChange={(e) => onChange(e.target.value as GeschaeftsartId)} className={inputCls} aria-label="Geschäftsart">
        {GESCHAEFTSARTEN_NACH_GRUPPE.map((g) => {
          const arten = g.arten.filter((a) => a.id !== 'grundstueckkauf');
          return arten.length === 0 ? null : (
            <optgroup key={g.gruppe} label={g.label}>
              {arten.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </optgroup>
          );
        })}
      </select>
    </Field>
  );
}

function PostenAnzeige({ ergebnis }: { ergebnis: BeurkundungErgebnis }) {
  const art = geschaeftsart(ergebnis.geschaeftsart);
  if (ergebnis.status === 'offen' || !ergebnis.posten) {
    return (
      <div className="lc-tile">
        <p className="text-xs text-ink-500 mb-1">Beurkundungsgebühr ({art.label})</p>
        <p className="text-body-l font-semibold text-ink-700">In Recherche</p>
        <p className="mt-1 text-body-s text-ink-600">
          Der kantonale Beurkundungstarif für diese Geschäftsart ist noch nicht abschliessend verifiziert hinterlegt.
          Es wird bewusst kein Betrag geschätzt (noch nicht abgenommen).
        </p>
      </div>
    );
  }
  const p = ergebnis.posten;
  const q = p.quelle;
  return (
    <div className="lc-tile lc-akzent-w">
      <p className="text-xs text-ink-500 mb-1">Beurkundungsgebühr ({art.label})</p>
      <p key={ngPostenText(p)} className="lc-wert-puls text-body-l font-semibold text-ink-900 num">{ngPostenText(p)}</p>
      {!p.ergebnis.deterministisch && <p className="mt-1 text-body-s text-ink-600">Rahmen/aufwandabhängig – konkrete Festsetzung im Einzelfall.</p>}
      <p className="mt-2 text-xs text-ink-500">
        {q.erlassName} ({q.erlassNr}), <KantonArtikelTrigger quelle={q} /> · Stand {q.stand}
        {q.verifiziert === 'recherche' ? ' · nicht abgenommen' : ''}
        {q.quelleUrl ? <> · <a href={q.quelleUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">amtliche Quelle ↗</a></> : null}
      </p>
    </div>
  );
}

function AllgemeineBeurkundung({ art, startKanton, startWert }: { art: GeschaeftsartId; startKanton: KantonCode; startWert?: number }) {
  const def = geschaeftsart(art);
  const [kanton, setKanton] = useState<KantonCode>(startKanton);
  const [wert, setWert] = useState<string>(startWert != null ? String(startWert) : '');
  const [vergleich, setVergleich] = useState(false);
  const [aktenzeichen, setAktenzeichen] = useState('');

  // Ob ein Wertfeld nötig ist, entscheidet der für (Art, Kanton) aufgelöste
  // Tarif (dieselbe Art kann je Kanton wertbasiert oder fix sein).
  const wertNoetig = istWertbasiert(art, kanton);
  const geschaeftswert = zahl(wert);
  const bereit = !wertNoetig || geschaeftswert !== undefined;

  const ergebnis = useMemo(
    () => (bereit ? berechneBeurkundung({ geschaeftsart: art, kanton, geschaeftswertCHF: geschaeftswert }) : null),
    [art, kanton, geschaeftswert, bereit],
  );
  const vergleichsListe = useMemo(
    () => (vergleich && bereit) ? vergleichBeurkundung(art, geschaeftswert) : null,
    [vergleich, art, geschaeftswert, bereit],
  );

  // Weitere Transaktionskosten (MwSt freies Notariat · HReg-Gebühr · Emissionsabgabe).
  const gebuehrSpanne = ergebnis?.posten ? ergebnisSpanne(ergebnis.posten.ergebnis) : null;
  const zusatz = useMemo(
    () => (ergebnis && ergebnis.status === 'ok') ? weitereKosten(art, kanton, geschaeftswert, gebuehrSpanne) : null,
    [ergebnis, art, kanton, geschaeftswert, gebuehrSpanne],
  );
  const total = useMemo(
    () => (gebuehrSpanne && zusatz && zusatz.posten.length > 0)
      ? { von: gebuehrSpanne.vonChf + zusatz.posten.reduce((s, p) => s + p.von, 0), bis: gebuehrSpanne.bisChf + zusatz.posten.reduce((s, p) => s + p.bis, 0) }
      : null,
    [gebuehrSpanne, zusatz],
  );

  const pdfConfig: PdfDocConfig | null = useMemo(() => {
    if (!ergebnis || ergebnis.status === 'offen') return null;
    return {
      aktenzeichen: aktenzeichen.trim() || undefined,
      title: `Beurkundungskosten – ${def.label}`,
      rechtsgrundlage: `${KANTON_NAMEN[kanton]}${wertNoetig && geschaeftswert ? ` · Geschäftswert ${chf(geschaeftswert)}` : ''}`,
      domain: 'notariat-grundbuch',
      fileBase: 'Beurkundungskosten',
      inputs: {
        'Geschäftsart': def.label,
        'Kanton': `${kanton} — ${KANTON_NAMEN[kanton]}`,
        ...(wertNoetig ? { [def.wertLabel ?? 'Geschäftswert']: geschaeftswert ? chf(geschaeftswert) : '–' } : {}),
        ...Object.fromEntries((zusatz?.posten ?? []).map((p) => [p.label, p.von === p.bis ? chf(p.von) : `${chf(p.von)} – ${chf(p.bis)}`])),
        ...(total ? { 'Total Notariat + Zusatzkosten (Schätzung)': total.von === total.bis ? chf(total.von) : `${chf(total.von)} – ${chf(total.bis)}` } : {}),
      },
      sections: [{ titel: 'Beurkundungsgebühr', ergebnis: beurkundungBericht(ergebnis) }],
      disclaimer: DISCLAIMER,
    };
  }, [ergebnis, aktenzeichen, kanton, geschaeftswert, def, wertNoetig, zusatz, total]);

  return (
    <div className="space-y-4">
      <p className="text-body-s text-ink-600">{def.beschreibung}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Kanton">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as KantonCode)} className={inputCls} aria-label="Kanton">
            {KANTONE.map((k) => <option key={k} value={k}>{k} — {KANTON_NAMEN[k]}</option>)}
          </select>
        </Field>
        {wertNoetig && (
          <Field label={def.wertLabel ?? 'Geschäftswert (CHF)'} hint={def.wertHinweis}>
            <BetragsFeld value={wert} onChange={setWert} className={inputCls} placeholder="z. B. 1'000'000" />
          </Field>
        )}
      </div>

      {ergebnis && (
        <ErgebnisBlock>
          <PostenAnzeige ergebnis={ergebnis} />

          {zusatz && zusatz.posten.length > 0 && (
            <div className="mt-3 lc-tile">
              <p className="text-xs text-ink-500 mb-2">Weitere Transaktionskosten (Schätzung)</p>
              <ul className="space-y-1.5">
                {zusatz.posten.map((p, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-body-s">
                    <span className="text-ink-700">
                      {p.label}
                      {p.url ? <> · <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-ink-500 hover:text-ink-800">{p.erlass} ↗</a></> : null}
                    </span>
                    <span className="num text-ink-900 whitespace-nowrap">{p.von === p.bis ? chf(p.von) : `${chf(p.von)} – ${chf(p.bis)}`}</span>
                  </li>
                ))}
              </ul>
              {zusatz.posten.some((p) => p.hinweis) && (
                <ul className="mt-2 space-y-1 text-xs text-ink-500 list-disc pl-5">
                  {zusatz.posten.filter((p) => p.hinweis).map((p, i) => <li key={i}><NormText text={p.hinweis ?? ''} /></li>)}
                </ul>
              )}
            </div>
          )}

          {total && (
            <div className="mt-3 lc-tile lc-akzent-w">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="text-xs text-ink-500">Total Notariat + Zusatzkosten (Schätzung)</p>
                <p className="num text-body-l font-semibold text-ink-900">{total.von === total.bis ? chf(total.von) : `${chf(total.von)} – ${chf(total.bis)}`}</p>
              </div>
            </div>
          )}

          <ul className="mt-3 space-y-1 text-xs text-ink-500 list-disc pl-5">
            {ergebnis.hinweise.map((h, i) => <li key={i}><NormText text={h} /></li>)}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setVergleich((v) => !v)} className="text-body-s underline text-ink-700 hover:text-ink-900">
              {vergleich ? 'Interkantonalen Vergleich ausblenden' : 'Was kostet es in anderen Kantonen? →'}
            </button>
          </div>

          {vergleichsListe && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[26rem] text-body-s border-collapse">
                <caption className="text-xs text-ink-500 text-left mb-2">
                  Interkantonaler Vergleich – Beurkundungsgebühr {def.label}
                  {wertNoetig && geschaeftswert ? ` bei Geschäftswert ${chf(geschaeftswert)}` : ''}, aufsteigend (günstigste zuoberst; nicht bezifferbare/offene Tarife zuunterst).
                </caption>
                <thead>
                  <tr className="lc-overline border-b border-line">
                    <th className="text-left py-2 pr-3">Kanton</th>
                    <th className="text-right py-2 pl-3">Beurkundungsgebühr</th>
                  </tr>
                </thead>
                <tbody>
                  {[...vergleichsListe].sort((a, b) => beurkundungSortwert(a) - beurkundungSortwert(b)).map((r) => (
                    <tr key={r.kanton} className={`border-b border-line/60 ${r.kanton === kanton ? 'bg-surface-raised font-medium' : ''}`}>
                      <td className="py-1.5 pr-3">
                        <a href={r.posten?.quelle.quelleUrl || undefined} target="_blank" rel="noopener noreferrer" className="hover:underline" title={r.posten?.quelle.erlassName}>{r.kanton}</a>
                      </td>
                      <td className="py-1.5 pl-3 text-right num text-ink-800">{r.posten ? ngPostenText(r.posten) : 'in Recherche'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* §R-5 (W2·29-WERKBANK-RECHNER R5a, 24.9.2026): Aktenzeichen → PDF →
              Teilen in der geteilten Exportzeile; «Teilen» stand vorher neben dem Vergleichs-Schalter. Ohne PDF (Tarif offen) bleibt Teilen erreichbar. */}
          <div className="mt-5 border-t border-line pt-4 space-y-3">
            <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
              query={() => permalinkKodieren(BK_LINK_SPEC, { art, kanton, wert: wertNoetig ? geschaeftswert : undefined })} />
          </div>
        </ErgebnisBlock>
      )}
    </div>
  );
}

const DISCLAIMER =
  'Beurkundungskosten (Notariatsgebühr) für öffentlich beurkundbare Rechtsgeschäfte nach kantonalem Tarif. ' +
  'In den meisten Kantonen gilt ein wertbasierter Tarif auf den Geschäftswert; einzelne Geschäfte tragen Sondersätze (Testament, Erbvertrag) oder feste Gebühren (Vollmacht, Vorsorgeauftrag). ' +
  'Aufwand-/Rahmentarife (freies Notariat) erscheinen als Spanne oder «nach Vereinbarung», nie als erfundener Punktwert; wo der kantonale Tarif noch nicht verifiziert vorliegt, wird das offen ausgewiesen. ' +
  'Grundbuch-/Handelsregistergebühren, Auslagen und allfällige MwSt. sind nicht enthalten. Nicht abgenommen. Keine Rechtsberatung.';

type Bereich = 'kauf' | 'beurkundung' | 'grundbuch';
const BEREICHE: { id: Bereich; label: string; hint: string }[] = [
  { id: 'kauf', label: 'Grundstückkauf', hint: 'Beurkundung + Grundbuch + Grundpfand + Handänderungssteuer' },
  { id: 'beurkundung', label: 'Beurkundung (Notariat)', hint: 'Testament, Erbvertrag, Gründungen, Dienstbarkeiten …' },
  { id: 'grundbuch', label: 'Grundbuch (Eintragung)', hint: 'Grundpfand, Dienstbarkeit, Vormerkung, Mutation …' },
];

export function BeurkundungForm() {
  const ausLink = usePermalinkFelder(BK_LINK_SPEC);
  // Bereich aus dem Permalink ableiten: ?ga= → Beurkundung, ?ea= → Grundbuch.
  const startBereich: Bereich = ausLink.art ? 'beurkundung' : (typeof window !== 'undefined' && window.location.search.includes('ea=')) ? 'grundbuch' : 'kauf';
  const [bereich, setBereich] = useState<Bereich>(startBereich);
  const [art, setArt] = useState<GeschaeftsartId>(
    (ausLink.art as GeschaeftsartId) && ausLink.art !== 'grundstueckkauf' ? (ausLink.art as GeschaeftsartId) : 'testament',
  );

  return (
    <BeruehrtRahmen>
      <div className="space-y-6">
        <PflichtDisclaimer kurz="Notariats- und Grundbuchkosten nach Geschäftsart/Eintragungsart und kantonalem Tarif; wertbasiert, Sondersätze oder fix. Rahmentarife als Spanne." text={DISCLAIMER} />

        {/* E-2-NACHZUG (R3-α, 31.8.2026): das hier war eine weitere Kopie der
            Segmented-Control — mit `role="tablist"`/`role="tab"`, aber OHNE
            das dazugehörige Tastaturverhalten (Pfeiltasten/Home/End, roving
            tabindex). Ein ARIA-Versprechen ohne Verhalten ist schlechter als
            keines: der Screenreader kündigt eine Reiterleiste an, die sich
            nicht wie eine bedienen lässt. Der Baustein bringt beides mit; die
            Kopie ist gelöscht (§5/§10), der `title`-Hinweis je Reiter wandert
            als deklariertes Feld mit. */}
        <Tabs items={BEREICHE.map((b) => ({ code: b.id, label: b.label, titel: b.hint }))}
          value={bereich} onChange={setBereich} ariaLabel="Bereich" />

        {/* LM-170 (B6/K-15): der «RECHTLICHER HINWEIS»-Balken steht bereits oben
            für alle drei Tabs (Zeile 272) — ohneDisclaimer verhindert den
            zweiten, direkt unter der Tab-Leiste (s. NotariatGrundbuchForm). */}
        {bereich === 'kauf' && <NotariatGrundbuchForm ohneDisclaimer />}
        {bereich === 'beurkundung' && (
          <div className="space-y-4">
            <GeschaeftsartWahl value={art} onChange={setArt} />
            <AllgemeineBeurkundung art={art} startKanton={(ausLink.kanton as KantonCode) ?? getStandardKanton()} startWert={ausLink.wert as number | undefined} />
          </div>
        )}
        {bereich === 'grundbuch' && <GrundbuchEintragForm />}
      </div>
    </BeruehrtRahmen>
  );
}
