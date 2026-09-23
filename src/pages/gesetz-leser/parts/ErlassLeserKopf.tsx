import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CurrencyEintrag, ErlassKopf, KantonLueckeEintrag } from '../../../lib/normtext/browse';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import {
  GELTUNG_UNGEPRUEFT_SATZ, STAND_UNBEKANNT,
  nichtKonsolidiertSatz, standausweisSatz, zaehlWort,
} from '../../../lib/normtext/erlassKopfText';
import { MASSGEBLICH_HALBSATZ } from '../../../lib/benennung';
import { NormText, type InternRefs } from '../../../components/NormText';
import { FnRef } from '../../../components/normtext/ArtikelBody';
import { Datum } from '../../../components/ui/Datum';
import { QuellLink } from '../../../components/ui/QuellLink';
import { SeitenTitel } from '../../../components/ui/SeitenTitel';
import { LeserKopfGeruest } from '../../../components/layout/LeserKopfGeruest';
import { erlassKeyVonEli, erlassPfadVonKey } from '../../../lib/normtext/erlassAdresse';
import { fnTextMitLinks, kennungEtikett, titelOhneKlammerSuffix } from '../helpers';
import { zukunftsHinweis, type ZukunftsHinweis } from '../zukunftsfassungen';

// ═══ DAS TITELBLATT DES ERLASSES — EINE Komponente für alle Grundarten ═══════
//
// W2·29-WERKBANK-LESER S2 (23.9.2026): aus drei Bausteinen wird einer. Bis
// hierher standen Erlass-Kopf (diese Datei), Ingress (`ErlassKopfBlock.tsx`,
// gelöscht) und die V3-Weitergabe (`v3/LeserErlassKopfZone`) als Geschwister
// in zwei Aufrufern; jetzt trägt das Titelblatt den Ingress selbst. Die V3-Zone
// bleibt als Verdrahtung (Reiter-Toast, Zukunftsfassung, Overline), weil sie
// aus `v3/` liest und diese Datei geteilte Darstellung ist (Richtung Hülle →
// geteilte Schicht, nie umgekehrt). Werkbank-Bild: Identität (Overline · Titel
// · Fakten) auf der Registerfläche «Gesetze» (`.lc-titelblatt-band`, Entscheid
// «Farbe als Fläche», David 22.9.2026); Stand, Warnung und Aktionen darunter
// auf dem Papier — dort tragen `warn-700` und `ink-500` ihre 4.5:1, auf der
// Fläche nicht (gemessen 23.9.2026: warn-700 4.45, ink-500 4.22 auf #D9DEE4).
//
// Bänder nach ROLLE (S3, Skizze 4e; Gerüst `layout/LeserKopfGeruest`, B-4):
//   Titel · Fakten (SR · Zahl) · Stand + Status · Aktionen · Banner · Ingress.
// Herleitungen der früheren Etappen (G2b, S3, Ä100, Ä101, Ä110, B-1/B-2, FN-3,
// §1-Grenze aBV) im Wortlaut: `git show c9fc15513:src/pages/gesetz-leser/parts/ErlassLeserKopf.tsx`
// und `…/parts/ErlassKopfBlock.tsx`.

// §1-GRENZE «alte Bundesverfassung» (Gegenprüfung 10.7.2026): der Ingress ist
// HISTORISCH — Erlasse vor 2000 zitieren dort die BV von 1874. Verlinkt wird
// darum NUR bei Erlassdatum ≥ 2000; unparsebar ⇒ keine Links (lieber kein Link
// als ein falscher). Ohne Reader-InternRefs (pdf-embed) linkt der Fallback nur
// Fremdziele — eine leere tokenMap erzeugt nie einen Self-Sprung (§8).
const PRAEAMBEL_INTERN_FALLBACK: InternRefs = { tokenMap: new Map(), basisPfad: '', springeZu: () => {} };
function ingressVerlinkbar(erlassdatum: string | undefined): boolean {
  const m = erlassdatum?.match(/vom\s+\d{1,2}\.\s*\S+\s+(\d{4})/);
  return !!m && Number(m[1]) >= 2000;
}

/** Ingress/Erlassformel bzw. Präambel + Erlassdatum + Kopf-Fussnoten (M5) —
 *  AMTLICHER WORTLAUT, darum auf der Fliesstext-Stufe `leser-text` wie die
 *  Artikel (S2 F3 = V2, §5: der Wortlaut hat EINE Stimme). Ohne eigene
 *  Unterkante: die Stufenlinie des ersten Sektionskopfs trennt (Ä100). */
function Ingress({ kopf, intern }: { kopf: ErlassKopf; intern?: InternRefs }) {
  const hatPraeambel = !!kopf.praeambel?.length;
  if (!kopf.erlassdatum && !hatPraeambel) return null;
  const verlinkbar = ingressVerlinkbar(kopf.erlassdatum);
  const zeilenStil = (rolle: string): string => {
    if (rolle === 'verb') return 'font-serif text-leser-text text-ink-800';
    if (rolle === 'autor') return 'font-serif text-leser-text text-ink-800';
    // ingress (Rechtsgrundlage) + praeambel (materiell, BV) ruhig im Lesefluss
    return 'font-serif text-leser-text text-ink-700';
  };
  return (
    <section aria-label="Ingress" className="mx-auto w-full max-w-normtext space-y-3 pb-5">
      {kopf.erlassdatum && (
        <p className="font-serif text-body-s text-ink-500">{kopf.erlassdatum}</p>
      )}
      {kopf.praeambelTitel && (
        <p className="lc-overline">{kopf.praeambelTitel}</p>
      )}
      {hatPraeambel && (
        <div className="space-y-2">
          {kopf.praeambel!.map((z, i) => (
            <p key={i} className={zeilenStil(z.rolle)}>
              {verlinkbar
                ? <NormText text={z.text} intern={intern ?? PRAEAMBEL_INTERN_FALLBACK} />
                : z.text}
              {/* FN-3: Ingress-Fussnoten inline hinter dem Wortlaut — dieselbe
                  FnRef-Mechanik wie im Artikel; `artikel="kopf"` löst aus
                  `#fn-kopf-${nr}` am Kopf-Apparat auf. */}
              {z.fnNrs && z.fnNrs.length > 0 && (
                <span className="ml-0.5" data-fn-marker>{z.fnNrs.map((nr, j) => (
                  <span key={nr}>{j > 0 && <span className="align-super text-[length:var(--hochgestellt)] text-ink-500">,</span>}<FnRef artikel="kopf" nr={nr} /></span>
                ))}</span>
              )}
            </p>
          ))}
        </div>
      )}
      {/* Der Kopf-Apparat hängt an KEINEM Vermerke-Schalter (kein
          `data-fn-klasse`): Ausblenden nähme hier nur amtliche Substanz weg (§8,
          S1-Nachzug 17.8.2026, D35-F3 7.9.2026). */}
      {kopf.fussnoten && kopf.fussnoten.length > 0 && (
        <div data-fn-apparat className="mt-3 border-t border-rule-artikel pt-2 space-y-1">
          {kopf.fussnoten.map((fn, i) => (
            /* Dieselbe Rolle wie der Artikel-Apparat: `text-leser-fn`,
               `max-w-kleintext`, Nummer in brass-700 (S2, T3, LM-153). */
            <p key={i} id={fn.nr ? `fn-kopf-${fn.nr}` : undefined} className="nt-anker max-w-kleintext text-leser-fn text-ink-500 target:bg-brass-100">
              {fn.nr && <span className="num mr-1 text-brass-700">{fn.nr}</span>}
              {fnTextMitLinks(fn)}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

export function ErlassLeserKopf({
  erlass, overline, artikelAnzahl, bestimmungsWort = 'Artikel', kennzahlen = null,
  aktionen, hinweis, currency, nichtKonsolidiert = false, nichtKonsolidiertSeit = null,
  kennung = null, luecken, zukunft, ingress = null, intern,
}: {
  erlass: BrowseErlass;
  /** §8-Nachzug (PR #614): vom §-Parser bewusst ausgelassene Teile dieses
   *  (kantonalen) Erlasses. `undefined` = keine ausgewiesene Lücke → kein Hinweis. */
  luecken?: KantonLueckeEintrag;
  /** W2·27 · Zukunftsfassungs-Hinweis, fertig vom Aufrufer (`v3/useZukunftsfassung`).
   *  `undefined` = der Aufrufer rechnet nicht mit → Ableitung aus `currency`
   *  (ohne Zahl, mit Satz und Link); `null` = ausgerechnet: es gibt keinen. */
  zukunft?: ZukunftsHinweis | null;
  /** Ä-(d) · Kennung VOR dem Titel statt Klammer-Suffix (lange Staatsvertrags-
   *  Titel, LugÜ 17.8.2026). Die Regel liegt in der Hülle (`v3/erlassAnsicht.
   *  titelKennung`); `null` = Zitierform «Volltitel (Kürzel)». */
  kennung?: string | null;
  overline: ReactNode;
  /** Artikelzahl (Snapshot); null = keine Zählung (pdf-embed). */
  artikelAnzahl: number | null;
  /** Nur sichtbares Label («Paragraphen» für §-Kantone) — der Anker bleibt art-<token>. */
  bestimmungsWort?: 'Artikel' | 'Paragraphen';
  /** S3 · Kennzahlen des Gliederungs-Modells für die Anhang-Dominanz (§5). */
  kennzahlen?: { artikelAnzahl: number; anhangArtikel: number } | null;
  /** Grundart-spezifische Aktionen (Reiter/PDF-Download). */
  aktionen?: ReactNode;
  hinweis: string;
  /** P1-d: maschineller Fedlex-Currency-Beweis (Standausweis / künftige Fassung). */
  currency?: CurrencyEintrag;
  /** S6/S3: mindestens eine BEREITS GELTENDE Änderung ist nicht in den Text
   *  konsolidiert (Stichtagsfilter beim Erzeuger, §3). `false` = keine Aussage. */
  nichtKonsolidiert?: boolean;
  /** S3/F5: frühestes nicht konsolidiertes Inkrafttreten; `null` = Datum unbekannt. */
  nichtKonsolidiertSeit?: string | null;
  /** S2 · Ingress aus dem Struktur-Sidecar; `null` = keiner bzw. nicht gezeigt
   *  (Einzelmodus, Erlasse ohne Sidecar). */
  ingress?: ErlassKopf | null;
  /** Reader-InternRefs für die Ingress-Verlinkung (A11); fehlt im pdf-embed. */
  intern?: InternRefs;
}) {
  const titelOhneSuffix = titelOhneKlammerSuffix(erlass.titel);
  const kuerzel = erlass.kuerzel.trim();
  const titelRedundant = titelOhneSuffix.toLowerCase() === kuerzel.toLowerCase();
  const titelZeile = !kuerzel || titelRedundant || kennung
    ? (titelOhneSuffix || kuerzel)
    : `${titelOhneSuffix} (${kuerzel})`;
  const wort = zaehlWort(bestimmungsWort, kennzahlen);
  const lebt = !erlass.aufgehoben;
  const warnung = lebt && nichtKonsolidiert ? nichtKonsolidiertSatz(nichtKonsolidiertSeit) : null;
  const fakten = [
    erlass.sr
      ? <>{kennungEtikett(erlass) ? `${kennungEtikett(erlass)} ` : ''}<span className="num">{erlass.sr}</span></>
      : null,
    artikelAnzahl != null ? <><span className="num">{artikelAnzahl}</span> {wort}</> : null,
  ].filter(Boolean) as ReactNode[];
  const geltungUngeprueft = lebt && erlass.ebene === 'kanton' && !currency?.geprueftAm;
  const hinweisZukunft = zukunft !== undefined ? zukunft : zukunftsHinweis(erlass, currency);
  const stand = [
    erlass.stand ? <>Stand <Datum iso={erlass.stand} /></> : <>{STAND_UNBEKANNT}</>,
    erlass.inkraftSeit ? <>in Kraft seit <Datum iso={erlass.inkraftSeit} /></> : null,
    currency?.geprueftAm && lebt ? standausweisSatz(currency.geprueftAm) : null,
    geltungUngeprueft ? GELTUNG_UNGEPRUEFT_SATZ : null,
    hinweisZukunft
      ? (
        <span className="text-warn-700">
          {hinweisZukunft.link
            ? (
              <QuellLink href={hinweisZukunft.link} className="lc-link text-warn-700">
                {hinweisZukunft.satz}
              </QuellLink>
            )
            : hinweisZukunft.satz}
          {/* «(+2 weitere)»: der Kopf sagt, DASS mehr bevorsteht; welche,
              steht im Reiter «Änderungen» (Ä81/Ä97). */}
          {hinweisZukunft.weitere > 0 ? ` (+${hinweisZukunft.weitere} weitere)` : ''}
        </span>
      )
      : null,
  ].filter(Boolean) as ReactNode[];
  /* Serif-Stimme für den zitierfähigen Titel; `min-h-titel-2z` reserviert die
     2-Zeilen-Höhe gegen den Font-Swap (§15.2, CLS 0). Keine Silbentrennung im
     Namen (Ä101), `[overflow-wrap:anywhere]` nur gegen Überlauf. Grösse aus
     `ui/SeitenTitel` (A-1, Pane-Breite im Split). */
  const titel = (
    <SeitenTitel stimme="serif" className="[overflow-wrap:anywhere] min-h-titel-2z">
      {/* Ä-(d): die Kennung als eigene, nicht umbrechende Marke VOR dem Titel,
          Teil desselben Namens; der Trenner ist `aria-hidden`. */}
      {kennung && (
        <>
          <span data-kopf-kennung className="whitespace-nowrap">{kennung}</span>
          <span aria-hidden className="mx-2 font-normal text-ink-300">·</span>
        </>
      )}
      {titelZeile}
    </SeitenTitel>
  );
  /* §15.2 · Stand und Status teilen EINE höhenfeste Zelle (`standReserve`,
     Tokens `kopf-stand*`, gemessen kalibriert): Standausweis und Warnung kommen
     aus Sidecars NACH dem ersten Paint (Rot-Beweis 9.8.2026: CLS 0.0227 mit
     eigenem Banner). Warnung im Klartext; «⚠» nur Verstärkung (B3). Ohne
     Warnung trägt die Zeile den Grundhinweis — nichts Beruhigendes (§8). */
  const ehrlichkeit = (
    <p className={`text-xs leading-snug ${warnung ? 'text-warn-700' : 'text-ink-500'}`}>
      {warnung
        ? <><span aria-hidden>⚠ </span>{warnung}</>
        : hinweis}
    </p>
  );
  /* Aktionen als ruhige Textlinks; der amtliche Link heisst überall
     «Amtliche Fassung ↗» (Ä110, `ui/QuellLink`) — nicht «geltende Fassung»:
     das doppelte die Stand-Zeile und wäre am aufgehobenen Erlass falsch.
     `.lc-chip` bleibt: das Gerüst neutralisiert die Chip-Anatomie im Band
     (`.lc-kopf-aktionen`), der Slot-Vertrag bleibt. */
  const aktionenBand = (
    <>
      {erlass.quelleUrl && lebt && (
        <QuellLink href={erlass.quelleUrl} className="lc-chip" />
      )}
      {aktionen}
    </>
  );
  return (
    <>
      <LeserKopfGeruest
        form="titelblatt"
        overline={overline}
        titel={titel}
        fakten={fakten}
        stand={stand}
        standReserve
        ehrlichkeit={ehrlichkeit}
        aktionen={aktionenBand}
      >
        {/* §8: GANZ aufgehobener Erlass (jolux:dateNoLongerInForce) — lesbar als
            historische Fassung, unmissverständlich ausgewiesen, mit amtlichem
            Link und Nachfolger. */}
        {erlass.aufgehoben && (
          <div role="status" className="lc-notice-danger text-body-s leading-snug space-y-1.5">
            <p>
              <strong className="font-semibold">Aufgehoben per <Datum iso={erlass.aufgehoben.seit} />.</strong>{' '}
              Dieser Erlass ist nicht mehr in Kraft. Der Text bleibt als historische Fassung
              (Stand <Datum iso={erlass.stand} />) abrufbar — {MASSGEBLICH_HALBSATZ}.
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {/* Gegenprüfungs-Auflage PR #823 (12.9.2026): liegt der Nachfolger
                  im Korpus (`erlassKeyVonEli`, Mehrdeutigkeit ⇒ kein Treffer),
                  führt der Link zu uns — seine amtliche Fassung steht daneben (§7). */}
              {erlass.aufgehoben.nachfolger && (() => {
                const n = erlass.aufgehoben.nachfolger;
                const nachfolgerKey = erlassKeyVonEli(n.eli);
                const amtlich = `https://www.fedlex.admin.ch/eli/${n.eli}/de`;
                const bezeichnung = (
                  <>
                    Nachfolge-Erlass: SR <span className="num">{n.sr}</span>
                    {n.inKraftSeit && (<> (in Kraft seit <Datum iso={n.inKraftSeit} />)</>)}
                  </>
                );
                if (!nachfolgerKey) {
                  return (
                    <QuellLink href={amtlich} className="underline hover:no-underline">
                      {bezeichnung}
                    </QuellLink>
                  );
                }
                return (
                  <>
                    <Link to={erlassPfadVonKey(nachfolgerKey)} className="underline hover:no-underline">
                      {bezeichnung} — Nachfolge-Erlass im Korpus
                    </Link>
                    <QuellLink href={amtlich} className="underline hover:no-underline">
                      Amtliche Fassung des Nachfolge-Erlasses
                    </QuellLink>
                  </>
                );
              })()}
              {erlass.quelleUrl && (
                <QuellLink href={erlass.quelleUrl} variante="aufgehoben" className="underline hover:no-underline" />
              )}
            </p>
          </div>
        )}
        {/* §8-Nachzug (PR #614): ausgewiesene Erlass-Lücke, neutraler Ton
            (`.lc-notice`), Wortlaut unverändert aus dem Generator (§7). Link auf
            `luecken.quelleUrl` (= `erlass.quelleUrl` bei allen 15 Einträgen,
            Gegenprüfung F1), `pdfUrl` nur als Fallback. */}
        {luecken && luecken.hinweise.length > 0 && (
          <div role="note" className="lc-notice text-body-s leading-snug space-y-1.5">
            <p className="font-semibold">
              Nicht vollständig erfasst
              {luecken.quelleUrl
                ? <> — <QuellLink href={luecken.quelleUrl} /></>
                : erlass.pdfUrl
                  ? <> — <QuellLink href={erlass.pdfUrl}>Amtliches PDF</QuellLink></>
                  : null}
            </p>
            {luecken.hinweise.length === 1 ? (
              <p>{luecken.hinweise[0]}</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {luecken.hinweise.map((h) => <li key={h}>{h}</li>)}
              </ul>
            )}
          </div>
        )}
      </LeserKopfGeruest>
      {ingress && <Ingress kopf={ingress} intern={intern} />}
    </>
  );
}
