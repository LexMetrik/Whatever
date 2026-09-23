import { AbrufFehler } from '../ui/AbrufFehler';
import { Datum } from '../ui/Datum';
import { fedlexLokalisiert, type Locale } from '../locale';
import { revisionTitel, type RevisionBezug } from '../../lib/normtext/revisionen';
import { IN_KRAFT_FUER_CH_LABEL, datumCh } from '../../lib/normtext/erlassKopfText';
import { aenderungZeitbezug } from '../../pages/gesetz-leser/zukunftsfassungen';
import type { BotschaftBezug } from '../../lib/materialien/botschaften';
import { KontextGruppe } from './KontextGruppe';

// ─── Änderungen / Revisionen (Paket 5, W2·6-REV, Moat-Hebel 1) ──────────────
//
// AS/RO-Änderungserlasse zur Norm — die tatsächliche Änderung neben der
// Absicht (Botschaft), an derselben norm-verankerten Stelle. §8: maschinell
// aus dem amtlichen Fedlex-Graphen; massgeblich bleibt die amtliche Sammlung.
// Reiner Renderer (§3): Ladezustand, Fehlerzustand und die Filterung nach
// `art` (Änderung/Sammelerlass-Marker) bleiben in `KontextPanel.tsx`, weil
// `revLaden`/`revFehler`/`alleRevisionen.length` auch dessen eigenes
// Lade-Gating (`laedtNoch`) und die Leer-Aussage (`istLeer`) speisen.
//
// Eigene Datei, weil `KontextPanel.tsx` mit diesem Block über die
// 800-Zeilen-Schwelle des §6.6-Tors `check:schlankheit` lief (§6.6-Split,
// 12.9.2026). Verhaltensneutral: der Aufrufer rendert diese Komponente nur,
// wenn dieselbe Bedingung wie zuvor (`revFehler || alleRevisionen.length > 0`)
// zutrifft — die JSX-Struktur darunter ist unverändert übernommen.

const MAX_REVISIONEN = 10;

// ─── S6 · Befund AE-1 (W2·29-WERKBANK-LESER, 23.9.2026) ─────────────────────
// Der Marker `nichtKonsolidiert` umfasst KÜNFTIGE Änderungen; die Zeile sagte
// trotzdem «In Kraft». Klassifikation und Stichtag (`currency.geprueftAm`) sind
// dieselben wie im V3-Reiter «Änderungen» (`aenderungZeitbezug`, §5).
function ZeitbezugZeile({ r, stichtag }: { r: RevisionBezug; stichtag: string | null }) {
  const bezug = aenderungZeitbezug(r, stichtag);
  const datum = datumCh(r.dateEntryInForce);
  if (bezug === 'kuenftig') {
    return <span className="block text-micro text-ink-600">{`Tritt am ${datum} in Kraft — noch nicht geltendes Recht.`}</span>;
  }
  if (bezug === 'inKraftOffen') {
    return <span className="block text-micro text-warn-700">{`In Kraft seit ${datum}, im hier gezeigten Text noch nicht eingearbeitet.`}</span>;
  }
  if (bezug === 'unbestimmt') {
    return <span className="block text-micro text-ink-600">Im hier gezeigten Text noch nicht eingearbeitet.</span>;
  }
  return null;
}

function markerZusatz(r: RevisionBezug, stichtag: string | null) {
  const bezug = aenderungZeitbezug(r, stichtag);
  if (bezug === 'kuenftig') return <span className="text-ink-600"> · noch nicht in Kraft</span>;
  if (bezug === 'inKraftOffen') return <span className="text-warn-700"> · in Kraft, im hier gezeigten Text noch nicht eingearbeitet</span>;
  if (bezug === 'unbestimmt') return <span className="text-ink-600"> · im hier gezeigten Text noch nicht eingearbeitet</span>;
  return null;
}

export function RevisionenGruppe({ revFehler, revAenderungen, revMarker, botschaftNachKey, locale, stichtag = null }: {
  revFehler: boolean;
  revAenderungen: RevisionBezug[];
  revMarker: RevisionBezug[];
  /** botschaftKey → Botschaft (aus den ohnehin geladenen Botschaften): der
   *  Revisions-Verweis «Botschaft ansehen» ohne zweiten Fetch (§15). */
  botschaftNachKey: Map<string, BotschaftBezug>;
  locale: Locale;
  /** `currency.geprueftAm` des Erlasses (§2: nie die Uhr); fehlt er, keine
   *  Aussage «in Kraft» (S6). */
  stichtag?: string | null;
}) {
  return (
    <KontextGruppe titel="Änderungen / Revisionen" richtung="Amtliche Sammlung"
      anzahl={revAenderungen.length}
      hinweis={revFehler
        ? undefined
        : <><span className="num">{revAenderungen.length}</span> Änderungs­erlass{revAenderungen.length === 1 ? '' : 'e'} (AS/RO) — maschinell über den amtlichen Fedlex-Graphen zusammengestellt (verlässlich ab ~2000); massgeblich bleibt die amtliche Sammlung.</>}>
      {/* F2-4: eine von vier Abruf-Fehler-Zeilen des Hauses, aus `ui/AbrufFehler`. */}
      {revFehler ? (
        <AbrufFehler gegenstand="Änderungsverlauf" href="https://www.fedlex.admin.ch" />
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {revAenderungen.slice(0, MAX_REVISIONEN).map((r) => {
              const titel = revisionTitel(r, locale as 'de' | 'fr' | 'it');
              const bot = r.botschaftKey ? botschaftNachKey.get(r.botschaftKey) : undefined;
              return (
                <li key={r.ocUri} className="text-body-s">
                  <a href={fedlexLokalisiert(r.quelleUrl, locale)} target="_blank" rel="noopener noreferrer"
                    className="no-underline hover:text-brass-700">
                    {/* Finding 4b, zweite Stufe (W2·18-FEHLERBUCH): bei den (whitelisteten)
                        Fällen, wo Fedlex «angewendet ab» statt «in Kraft für die Schweiz
                        seit» als dateEntryInForce führt, BEIDE Daten zeigen — sonst bleibt
                        das frühere, amtlich belegte Datum unsichtbar (§8). */}
                    {r.dateInKraftFuerCh ? (
                      <>
                        <span className="text-ink-500">{IN_KRAFT_FUER_CH_LABEL} </span>
                        <Datum iso={r.dateInKraftFuerCh} className="text-ink-500" />
                        <span className="text-ink-500"> · angewendet ab </span>
                        <Datum iso={r.dateEntryInForce} className="text-ink-500" />
                      </>
                    ) : (
                      <Datum iso={r.dateEntryInForce} className="text-ink-500" />
                    )}
                    {titel && <>{' — '}<span className="font-medium">{titel}</span></>}
                  </a>
                  {r.roFundstelle && <span className="num text-micro text-ink-500"> · {r.roFundstelle}</span>}
                  {bot && (
                    <>
                      {' '}
                      <a href={fedlexLokalisiert(bot.quelleUrl, locale)} target="_blank" rel="noopener noreferrer"
                        title="Zugehörige Botschaft des Bundesrates"
                        className="text-micro text-ink-500 hover:text-brass-700">· Botschaft ↗</a>
                    </>
                  )}
                  {/* S6 · Befund AE-1 (23.9.2026): stand hier für JEDE markierte
                      Zeile «In Kraft, aber noch nicht in den geltenden Text
                      konsolidiert.» — auch für künftige (01.01.2029). */}
                  <ZeitbezugZeile r={r} stichtag={stichtag} />
                  {/* §8-Marker (Gegenprüfung #703, Semantik zweimal korrigiert nach
                      Gegenprüfung PR #827 — Auflagen a+f): berichtet NUR, was das
                      jolux:rectifies-Tripel selbst trägt (Verknüpfung mit einem
                      AS-Dokument unter Fremd-SR), NIE eine Interpretation
                      («erstpubliziert», «Anhangs-Änderung» als Tatsache — Gegenbeleg
                      SKV/AS 2025 686 zeigt, dass die Verknüpfung selbst ein
                      Fedlex-Datenfehler sein kann). Whitelist auf den einen bekannten
                      Zustand, kein genereller Switch. Neutrale Farbe (text-ink-500),
                      NICHT warn-700 — es ist keine Warnung. */}
                  {r.plausibilitaet === 'berichtigung-fremdes-as-dokument' && (
                    <span className="block text-micro text-ink-500">
                      {r.plausibilitaetsGrund ?? 'Fedlex verknüpft diese Berichtigung (jolux:rectifies) mit einem AS-Dokument anderer SR-Klassierung; massgeblich ist die amtliche Sammlung.'}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {revAenderungen.length > MAX_REVISIONEN && (
            <p className="text-micro text-ink-500">
              … und <span className="num">{revAenderungen.length - MAX_REVISIONEN}</span> weitere. Vollständige Liste über die amtliche Sammlung (Fedlex).
            </p>
          )}
          {revMarker.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none text-body-s text-ink-500 hover:text-brass-700 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
                <span className="num">{revMarker.length}</span> weitere Änderung{revMarker.length === 1 ? '' : 'en'} über Sammelerlasse anderer Erlasse
              </summary>
              <ul className="mt-1.5 flex flex-col gap-1.5 border-l border-line pl-3">
                {revMarker.map((r) => (
                  <li key={`${r.art}:${r.dateEntryInForce}`} className="text-body-s text-ink-500">
                    <Datum iso={r.dateEntryInForce} />
                    {' — '}Änderung über einen Sammelerlass ·{' '}
                    <a href={r.quelleUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brass-700">amtliche Sammlung ↗</a>
                    {markerZusatz(r, stichtag)}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </KontextGruppe>
  );
}
