import { useMemo, useState } from 'react';
import { BeruehrtRahmen, Checkbox, ErgebnisPlatzhalter, Field, inputCls } from '../vorlagen/ui';
import { zahlNichtNegativ as zahl } from './eingabe';
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
  berechneNotariatGrundbuch, vergleichNotariatGrundbuch, notariatGrundbuchBericht, ngPostenText, ergebnisSpanne,
  type NotariatGrundbuchErgebnis, type NgPosten, type Spanne,
} from '../../lib/notariatGrundbuch';
import { KANTONE, KANTON_NAMEN, type KantonCode } from '../../data/tarif/typen';
import { getStandardKanton } from '../../lib/einstellungen';
import { chfGanz as chf } from '../../lib/vorlagen/datum';

// ─── Notariats- & Grundbuchkosten beim Grundstückkauf ───────────────────────
// Reine Darstellung (§3): gerechnet wird in lib/notariatGrundbuch.ts über die
// amtlich belegte Datenschicht. Vier getrennte Blöcke (Beurkundung, Grundbuch,
// Grundpfand, Handänderungssteuer) + interkantonaler Vergleich + PDF.

const DISCLAIMER =
  'Erwerbs-Nebenkosten beim Grundstückkauf: Beurkundungsgebühr (Notariat) + Grundbucheintrag, optional Grundpfand (Schuldbrief) und Handänderungssteuer. ' +
  'Kantonale Tarife nach Kaufpreis bzw. Pfandsumme; aufwand-/bandbreitenbasierte Tarife (freies Notariat) erscheinen als Spanne oder «nach Vereinbarung», nie als erfundener Punktwert. ' +
  'Die Handänderungssteuer ist eine kantonale/kommunale STEUER (keine Gebühr); Befreiungen sind einzelfallabhängig und nicht berücksichtigt. Auslagen und MwSt. (freies Notariat) sind nicht enthalten. Nicht abgenommen. Keine Rechtsberatung.';

const NG_LINK_SPEC: PermalinkSpec<Record<string, unknown>> = {
  kanton: { p: 'kt', typ: 'str', gueltig: einerVon(...KANTONE) },
  kp: { p: 'kp', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  pfand: { p: 'pf', typ: 'bool' },
  ps: { p: 'ps', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  steuer: { p: 'st', typ: 'bool' },
};

const spanneText = (s: Spanne | null): string =>
  !s ? '—' : s.vonChf === s.bisChf ? chf(s.vonChf) : `${chf(s.vonChf)} – ${chf(s.bisChf)}`;

// Sortier-Untergrenze (günstigste zuoberst); nicht bezifferbar → ans Ende.
const sortwert = (r: NotariatGrundbuchErgebnis): number => {
  const u = (p: NgPosten) => ergebnisSpanne(p.ergebnis)?.vonChf ?? Number.POSITIVE_INFINITY;
  return u(r.beurkundung) + u(r.grundbuch);
};

function PostenKarte({ titel, posten, akzent }: { titel: string; posten: NgPosten; akzent?: boolean }) {
  const q = posten.quelle;
  const e = posten.ergebnis;
  // «Entfällt»-Fall: dieser Kanton kennt die Position gar nicht (z. B. keine
  // Handänderungssteuer). Datenmarker: kein Erlass/Artikel + nicht beziffert.
  // Dann KLAR «Entfällt» zeigen statt des irreführenden «nach Vereinbarung/
  // Aufwand» (das suggeriert eine verhandelbare Gebühr).
  const entfaellt = !e.deterministisch && q.erlassNr === '—' && q.artikel === '—';
  return (
    <div className={`lc-tile ${akzent ? 'lc-akzent-w' : ''}`}>
      <p className="text-xs text-ink-500 mb-1">{titel}</p>
      <p key={ngPostenText(posten)} className="lc-wert-puls text-body-l font-semibold text-ink-900 num">{entfaellt ? 'Entfällt' : ngPostenText(posten)}</p>
      {!e.deterministisch && !entfaellt && <p className="mt-1 text-body-s text-ink-600">Rahmen/aufwandabhängig – konkrete Festsetzung im Einzelfall.</p>}
      {!entfaellt && (
        <p className="mt-2 text-xs text-ink-500">
          {q.erlassName} ({q.erlassNr}), <KantonArtikelTrigger quelle={q} /> · Stand {q.stand}
          {q.verifiziert === 'recherche' ? ' · nicht abgenommen' : ''}
          {q.quelleUrl ? <> · <a href={q.quelleUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">amtliche Quelle ↗</a></> : null}
        </p>
      )}
      {q.hinweis && (
        <p className="mt-1 text-xs text-ink-500">
          <KantonNormText text={q.hinweis} quelle={q} />
          {entfaellt && q.quelleUrl ? <> · <a href={q.quelleUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-800">amtliche Quelle ↗</a></> : null}
        </p>
      )}
    </div>
  );
}

// `minimal` (Startseiten-Schnellrechner, Auftrag David): schlanke Grundstückkauf-
// Schätzung — nur Kanton + Kaufpreis + Handänderungssteuer-Schalter und das
// Kernresultat (Beurkundung + Grundbuch + Total). Grundpfand, interkantonaler
// Vergleich, Teilen, PDF und Aktenzeichen bleiben dem Voll-Rechner vorbehalten
// (dorthin wird im Schnellrechner verlinkt). Dieselbe Engine (§3/§5).
//
// `ohneDisclaimer` (LM-170, B6/K-15): eigener Schalter, NICHT an `minimal`
// gekoppelt. BeurkundungForm zeigt den «RECHTLICHER HINWEIS»-Balken bereits
// EINMAL für alle drei Tabs (Grundstückkauf/Beurkundung/Grundbuch) oberhalb der
// Tab-Leiste; ohne diesen Schalter renderte der Grundstückkauf-Tab ihn ein
// zweites Mal, 8 px statt der sonst üblichen ~24 px unter dem ersten. `minimal`
// selbst bleibt unberührt: es schaltet Grundpfand/Vergleich/Teilen/PDF ab, was
// im Voll-Rechner-Tab falsch wäre — hier soll NUR der doppelte Balken weg.
export function NotariatGrundbuchForm({ minimal = false, ohneDisclaimer = false }: { minimal?: boolean; ohneDisclaimer?: boolean } = {}) {
  const ausLink = usePermalinkFelder(NG_LINK_SPEC);

  const [kanton, setKanton] = useState<KantonCode>((ausLink.kanton as KantonCode) ?? getStandardKanton());
  const [kp, setKp] = useState<string>(ausLink.kp != null ? String(ausLink.kp) : '');
  // Im minimal-Modus (Startseiten-Schnellrechner) bleibt Grundpfand AUS — die
  // Checkbox ist dort ausgeblendet, ein ?pf=1-Permalink dürfte sonst einen nicht
  // abschaltbaren Zusatzblock erzwingen.
  const [pfand, setPfand] = useState<boolean>(!minimal && ausLink.pfand === true);
  const [ps, setPs] = useState<string>(ausLink.ps != null ? String(ausLink.ps) : '');
  const [steuer, setSteuer] = useState<boolean>(ausLink.steuer !== false);
  const [vergleich, setVergleich] = useState(false);
  const [aktenzeichen, setAktenzeichen] = useState('');

  const kaufpreis = zahl(kp);
  const pfandsumme = zahl(ps);
  const ergebnis = useMemo(
    () => kaufpreis === undefined ? null : berechneNotariatGrundbuch({ kanton, kaufpreisCHF: kaufpreis, mitGrundpfand: pfand, pfandsummeCHF: pfandsumme, mitHandaenderungssteuer: steuer }),
    [kanton, kaufpreis, pfand, pfandsumme, steuer],
  );
  const vergleichsListe = useMemo(
    () => (vergleich && kaufpreis !== undefined) ? vergleichNotariatGrundbuch(kaufpreis, pfand, pfandsumme, steuer) : null,
    [vergleich, kaufpreis, pfand, pfandsumme, steuer],
  );

  const pdfConfig: PdfDocConfig | null = useMemo(() => {
    if (!ergebnis) return null;
    return {
      aktenzeichen: aktenzeichen.trim() || undefined,
      title: 'Notariats- & Grundbuchkosten (Grundstückkauf)',
      rechtsgrundlage: `${KANTON_NAMEN[kanton]} · Kaufpreis ${kaufpreis !== undefined ? chf(kaufpreis) : '–'}`,
      domain: 'notariat-grundbuch',
      fileBase: 'Notariat-Grundbuch',
      inputs: {
        'Kanton': `${kanton} — ${KANTON_NAMEN[kanton]}`,
        'Kaufpreis': kaufpreis !== undefined ? chf(kaufpreis) : '–',
        ...(pfand ? { 'Grundpfand (Pfandsumme)': chf(pfandsumme ?? kaufpreis ?? 0) } : {}),
        'Handänderungssteuer': steuer ? 'einbezogen' : 'ausgeblendet',
      },
      sections: [{ titel: 'Kostenschätzung', ergebnis: notariatGrundbuchBericht(ergebnis) }],
      disclaimer: DISCLAIMER,
    };
  }, [ergebnis, aktenzeichen, kanton, kaufpreis, pfand, pfandsumme, steuer]);

  return (
    <BeruehrtRahmen>
    <div className="space-y-6 lc-rechner-spalten">
      {/* minimal = Startseite-Schnellrechner: globaler Pflicht-Hinweis dort (§8).
          ohneDisclaimer = Grundstückkauf-Tab in BeurkundungForm: der Hinweis
          steht dort bereits oberhalb der Tab-Leiste (LM-170, s. o.). */}
      {!minimal && !ohneDisclaimer && <PflichtDisclaimer kurz="Beurkundung + Grundbuch (+ Grundpfand) + Handänderungssteuer nach kantonalem Tarif; Rahmentarife als Spanne." text={DISCLAIMER} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Kanton">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as KantonCode)} className={inputCls} aria-label="Kanton">
            {KANTONE.map((k) => <option key={k} value={k}>{k} — {KANTON_NAMEN[k]}</option>)}
          </select>
        </Field>
        <Field label="Kaufpreis (CHF)" hint="Handänderungswert der Liegenschaft">
          <BetragsFeld value={kp} onChange={setKp} className={inputCls} placeholder="z. B. 1'000'000" />
        </Field>
      </div>

      {!minimal && (
        <>
          <Checkbox checked={pfand} onChange={setPfand} label="Grundpfand (Schuldbrief/Hypothek) mitberechnen" />
          {pfand && (
            <Field label="Pfandsumme (CHF)" hint="Standard = Kaufpreis, falls leer">
              <BetragsFeld value={ps} onChange={setPs} className={inputCls} placeholder="z. B. 800'000" />
            </Field>
          )}
        </>
      )}
      <Checkbox checked={steuer} onChange={setSteuer} label="Handänderungssteuer einbeziehen (kantonale/kommunale Steuer)" />

      {/* QS-UI 8b: Ergebnisplatz auch im Leerzustand angesagt (W2·10-UI-NAV/N0d·W1). */}
      {!ergebnis && (
        <ErgebnisPlatzhalter was="Kanton und Verkehrswert wählen — hier erscheinen die einzelnen Kostenposten und ihre Summe." />
      )}

      {ergebnis && (
        <ErgebnisBlock>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PostenKarte titel="Beurkundung (Notariat)" posten={ergebnis.beurkundung} />
            <PostenKarte titel="Grundbuch (Eigentumsübertragung)" posten={ergebnis.grundbuch} />
            {ergebnis.grundpfand && <PostenKarte titel="Grundpfand (Schuldbrief)" posten={ergebnis.grundpfand} />}
            {ergebnis.handaenderungssteuer && <PostenKarte titel="Handänderungssteuer (Steuer)" posten={ergebnis.handaenderungssteuer} akzent />}
          </div>

          <div className="mt-3 lc-tile lc-akzent-w">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <p className="text-xs text-ink-500">Gebühren gesamt (Notariat + Grundbuch{ergebnis.grundpfand ? ' + Grundpfand' : ''})</p>
              <p className="num text-body-l font-semibold text-ink-900">{spanneText(ergebnis.gesamtGebuehren)}</p>
            </div>
            {steuer && ergebnis.handaenderungssteuer && ergebnisSpanne(ergebnis.handaenderungssteuer.ergebnis) && (
              <div className="mt-1 flex items-baseline justify-between gap-3 flex-wrap">
                <p className="text-xs text-ink-500">Total inkl. Handänderungssteuer</p>
                <p className="num text-body-l font-semibold text-ink-900">{spanneText(ergebnis.gesamtMitSteuer)}</p>
              </div>
            )}
          </div>

          <ul className="mt-3 space-y-1 text-xs text-ink-500 list-disc pl-5">
            {ergebnis.hinweise.map((h, i) => <li key={i}><NormText text={h} /></li>)}
          </ul>

          {!minimal && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setVergleich((v) => !v)} className="text-body-s underline text-ink-700 hover:text-ink-900">
                {vergleich ? 'Interkantonalen Vergleich ausblenden' : 'Was kostet es in anderen Kantonen? →'}
              </button>
            </div>
          )}

          {!minimal && vergleichsListe && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-body-s border-collapse">
                <caption className="text-xs text-ink-500 text-left mb-2">
                  Interkantonaler Vergleich bei Kaufpreis {kaufpreis !== undefined ? chf(kaufpreis) : ''} — Notariat / Grundbuch / Handänderungssteuer, aufsteigend nach Gebühren (günstigste zuoberst; nicht bezifferbare Tarife zuunterst). Quelle je Kanton verlinkt.
                </caption>
                <thead>
                  <tr className="lc-overline border-b border-line">
                    <th className="text-left py-2 pr-3">Kanton</th>
                    <th className="text-right py-2 px-3">Notariat</th>
                    <th className="text-right py-2 px-3">Grundbuch</th>
                    <th className="text-right py-2 pl-3">Handänderungssteuer</th>
                  </tr>
                </thead>
                <tbody>
                  {[...vergleichsListe].sort((a, b) => sortwert(a) - sortwert(b)).map((r) => (
                    <tr key={r.kanton} className={`border-b border-line/60 ${r.kanton === kanton ? 'bg-surface-raised font-medium' : ''}`}>
                      <td className="py-1.5 pr-3">
                        <a href={r.beurkundung.quelle.quelleUrl || undefined} target="_blank" rel="noopener noreferrer" className="hover:underline" title={r.beurkundung.quelle.erlassName}>{r.kanton}</a>
                      </td>
                      <td className="py-1.5 px-3 text-right num text-ink-800">{ngPostenText(r.beurkundung)}</td>
                      <td className="py-1.5 px-3 text-right num text-ink-800">{ngPostenText(r.grundbuch)}</td>
                      <td className="py-1.5 pl-3 text-right num text-ink-800">{r.handaenderungssteuer ? ngPostenText(r.handaenderungssteuer) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* §R-5 (W2·29-WERKBANK-RECHNER R5a, 24.9.2026): Aktenzeichen → PDF →
              Teilen in der geteilten Exportzeile; «Teilen» stand vorher neben dem Vergleichs-Schalter. */}
          {!minimal && (
            <div className="mt-5 border-t border-line pt-4 space-y-3">
              <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
                query={() => permalinkKodieren(NG_LINK_SPEC, { kanton, kp: kaufpreis, pfand: pfand ? true : undefined, ps: pfand ? pfandsumme : undefined, steuer: steuer ? undefined : false })} />
            </div>
          )}
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
