import { useMemo, useState } from 'react';
import { Field, inputCls } from '../vorlagen/ui';
import { zahlNichtNegativ as zahl } from './eingabe';
import { NormText } from '../NormText';
import { KantonArtikelTrigger } from '../KantonQuelleLink';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { BetragsFeld } from '../BetragsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { permalinkKodieren, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import {
  berechneGrundbuchgebuehr, vergleichGrundbuchgebuehr, grundbuchgebuehrBericht, gbSortwert, istWertbasiertGb,
} from '../../lib/grundbuchgebuehren';
import { ngPostenText } from '../../lib/notariatGrundbuch';
import {
  GB_EINTRAGSARTEN_NACH_GRUPPE, gbEintragsart, GB_EINTRAGSART_IDS, type GbEintragsartId,
} from '../../data/tarif/grundbuch-typen';
import { KANTONE, KANTON_NAMEN, type KantonCode } from '../../data/tarif/typen';
import { getStandardKanton } from '../../lib/einstellungen';
import { chfGanz as chf } from '../../lib/vorlagen/datum';

// ─── Grundbuchgebühren je Eintragungsart (reine Darstellung, §3) ────────────
// Gerechnet wird in lib/grundbuchgebuehren.ts; §8: fehlt ein kantonaler Tarif
// noch (Recherche), wird das ehrlich ausgewiesen, nie ein Schätzwert.

const GB_LINK_SPEC: PermalinkSpec<Record<string, unknown>> = {
  art: { p: 'ea', typ: 'str', gueltig: einerVon(...GB_EINTRAGSART_IDS) },
  wert: { p: 'gw', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  kanton: { p: 'kt', typ: 'str', gueltig: einerVon(...KANTONE) },
};

const DISCLAIMER =
  'Grundbuchgebühren (Eintragungsgebühr) je Eintragungsart nach kantonalem Tarif. ' +
  'Wertbasierte Eintragungen (Eigentum, Grundpfand) bemessen sich am Wert; Vormerkungen, Anmerkungen, Löschungen und Mutationen sind meist feste Gebühren. ' +
  'In einzelnen Kantonen ist die «Grundbuchgebühr» faktisch eine Wertabgabe/Gemengsteuer (z. B. AG, TI). Notariats-/Beurkundungsgebühr, Handänderungssteuer, Auslagen und MwSt. sind nicht enthalten. ' +
  'Wo der kantonale Tarif noch nicht verifiziert vorliegt, wird das offen ausgewiesen. Nicht abgenommen. Keine Rechtsberatung.';

const ALLOWED: GbEintragsartId[] = GB_EINTRAGSART_IDS.filter((id) => id !== 'eigentum_kauf');

export function GrundbuchEintragForm() {
  const ausLink = usePermalinkFelder(GB_LINK_SPEC);
  const startArt = (ausLink.art as GbEintragsartId);
  const [art, setArt] = useState<GbEintragsartId>(ALLOWED.includes(startArt) ? startArt : 'grundpfand');
  const [kanton, setKanton] = useState<KantonCode>((ausLink.kanton as KantonCode) ?? getStandardKanton());
  const [wert, setWert] = useState<string>(ausLink.wert != null ? String(ausLink.wert) : '');
  const [vergleich, setVergleich] = useState(false);
  const [aktenzeichen, setAktenzeichen] = useState('');

  const def = gbEintragsart(art);
  const wertNoetig = istWertbasiertGb(art, kanton);
  const w = zahl(wert);
  const bereit = !wertNoetig || w !== undefined;

  const ergebnis = useMemo(
    () => (bereit ? berechneGrundbuchgebuehr({ eintragsart: art, kanton, wertCHF: w }) : null),
    [art, kanton, w, bereit],
  );
  const vergleichsListe = useMemo(
    () => (vergleich && bereit) ? vergleichGrundbuchgebuehr(art, w) : null,
    [vergleich, art, w, bereit],
  );

  const pdfConfig: PdfDocConfig | null = useMemo(() => {
    if (!ergebnis || ergebnis.status === 'offen') return null;
    return {
      aktenzeichen: aktenzeichen.trim() || undefined,
      title: `Grundbuchgebühr – ${def.label}`,
      rechtsgrundlage: `${KANTON_NAMEN[kanton]}${wertNoetig && w ? ` · Wert ${chf(w)}` : ''}`,
      domain: 'notariat-grundbuch',
      fileBase: 'Grundbuchgebuehr',
      inputs: {
        'Eintragungsart': def.label,
        'Kanton': `${kanton} — ${KANTON_NAMEN[kanton]}`,
        ...(wertNoetig ? { [def.wertLabel ?? 'Wert']: w ? chf(w) : '–' } : {}),
      },
      sections: [{ titel: 'Grundbuchgebühr', ergebnis: grundbuchgebuehrBericht(ergebnis) }],
      disclaimer: DISCLAIMER,
    };
  }, [ergebnis, aktenzeichen, kanton, w, def, wertNoetig]);

  return (
    <div className="space-y-4">
      <Field label="Eintragungsart" hint="Welche Eintragung wird im Grundbuch vollzogen?">
        <select value={art} onChange={(e) => setArt(e.target.value as GbEintragsartId)} className={inputCls} aria-label="Eintragungsart">
          {GB_EINTRAGSARTEN_NACH_GRUPPE.map((g) => {
            const opts = g.arten.filter((a) => a.id !== 'eigentum_kauf');
            return opts.length === 0 ? null : (
              <optgroup key={g.gruppe} label={g.label}>
                {opts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </optgroup>
            );
          })}
        </select>
      </Field>
      <p className="text-body-s text-ink-600">{def.beschreibung}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Kanton">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as KantonCode)} className={inputCls} aria-label="Kanton">
            {KANTONE.map((k) => <option key={k} value={k}>{k} — {KANTON_NAMEN[k]}</option>)}
          </select>
        </Field>
        {wertNoetig && (
          <Field label={def.wertLabel ?? 'Wert (CHF)'} hint={def.wertHinweis}>
            <BetragsFeld value={wert} onChange={setWert} className={inputCls} placeholder="z. B. 800'000" />
          </Field>
        )}
      </div>

      {ergebnis && (
        <ErgebnisBlock>
          {ergebnis.status === 'offen' || !ergebnis.posten ? (
            <div className="lc-tile">
              <p className="text-xs text-ink-500 mb-1">Grundbuchgebühr ({def.label})</p>
              <p className="text-body-l font-semibold text-ink-700">In Recherche</p>
              <p className="mt-1 text-body-s text-ink-600">Der kantonale Grundbuchgebühren-Tarif für diese Eintragungsart ist noch nicht abschliessend verifiziert hinterlegt – es wird bewusst kein Betrag geschätzt.</p>
            </div>
          ) : (
            <div className="lc-tile lc-akzent-w">
              <p className="text-xs text-ink-500 mb-1">Grundbuchgebühr ({def.label})</p>
              <p key={ngPostenText(ergebnis.posten)} className="lc-wert-puls text-body-l font-semibold text-ink-900 num">{ngPostenText(ergebnis.posten)}</p>
              {!ergebnis.posten.ergebnis.deterministisch && <p className="mt-1 text-body-s text-ink-600">Rahmen/aufwandabhängig – konkrete Festsetzung im Einzelfall.</p>}
              <p className="mt-2 text-xs text-ink-500">
                {ergebnis.posten.quelle.erlassName} ({ergebnis.posten.quelle.erlassNr}), <KantonArtikelTrigger quelle={ergebnis.posten.quelle} /> · Stand {ergebnis.posten.quelle.stand}
                {ergebnis.posten.quelle.verifiziert === 'recherche' ? ' · nicht abgenommen' : ''}
                {ergebnis.posten.quelle.quelleUrl ? <> · <a href={ergebnis.posten.quelle.quelleUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">amtliche Quelle ↗</a></> : null}
              </p>
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
                  Interkantonaler Vergleich – Grundbuchgebühr {def.label}{wertNoetig && w ? ` bei Wert ${chf(w)}` : ''}, aufsteigend (günstigste zuoberst; offene/nicht bezifferbare Tarife zuunterst).
                </caption>
                <thead>
                  <tr className="lc-overline border-b border-line">
                    <th className="text-left py-2 pr-3">Kanton</th>
                    <th className="text-right py-2 pl-3">Grundbuchgebühr</th>
                  </tr>
                </thead>
                <tbody>
                  {[...vergleichsListe].sort((a, b) => gbSortwert(a) - gbSortwert(b)).map((r) => (
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
              query={() => permalinkKodieren(GB_LINK_SPEC, { art, kanton, wert: wertNoetig ? w : undefined })} />
          </div>
        </ErgebnisBlock>
      )}
    </div>
  );
}
