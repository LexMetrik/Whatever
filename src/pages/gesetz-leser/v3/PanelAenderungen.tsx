import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { fedlexLokalisiert, type Locale } from '../../../components/locale';
import { revisionTitel, type RevisionAnsicht } from '../../../lib/normtext/revisionen';
import { IN_KRAFT_FUER_CH_LABEL } from '../../../lib/normtext/erlassKopfText';
import type { ErlassAufhebung } from '../../../lib/normtext/aufhebungen';
import type { BotschaftBezug } from '../../../lib/materialien/botschaften';
import type { ArtikelRevision } from '../../../lib/verzahnung/artikel-revisionen';
import { aenderungZeitbezug, type AenderungZeitbezug } from '../zukunftsfassungen';
import { aufhebungsBezug, trifftArtikel, wirkungsMarken, zeilenSchluessel, type RevisionZeile } from './aenderungModell';
import type { Geladen } from './panelKontextLaden';

// ─── Reiter «Änderungen» (H3) ────────────────────────────────────────────────
//
// Die Änderungserlasse dieses Erlasses, neu → alt, jeder mit Live-Link auf die
// amtliche Fassung. Reine Projektion des Revisions-Sidecars (§3) — dieselbe
// Quelle und dieselbe Reihenfolge, die das Ist-Kontext-Panel zeigt (§5), nur
// ohne dessen fünf weiteren Gruppen.
//
// ── ZWEI ARTEN, EIN UNTERSCHIED, DER GESAGT WERDEN MUSS (§8) ────────────────
// `art: 'sammelerlass-marker'` heisst: die Änderung kam über einen Sammelerlass
// einer ANDEREN SR-Nummer und ist nur als DATUM bekannt — es gibt keinen Titel
// und keine eigene AS-Fundstelle. Diese Zeilen werden darum als solche
// beschriftet, statt einen fehlenden Titel als leere Zeile zu zeigen.
//
// `nichtKonsolidiert` heisst: in Kraft, aber im gepinnten Normtext noch nicht
// eingearbeitet. Der S3-Befund gilt auch hier — der Marker umfasst KÜNFTIGE
// Änderungen; darum steht hier nur, was das Sidecar sagt («noch nicht im Text»),
// ohne die Behauptung, es gelte bereits.
// ERGÄNZT 23.9.2026 (S6, Befund AE-1): der sichtbare Text hielt das, der
// Tooltip nicht («In Kraft, im gepinnten Normtext …» auch an 01.07.2027).
// Seither trennt `aenderungZeitbezug` künftig / in Kraft offen / übrige.
//
// KEIN «MAX_REVISIONEN» wie im Ist-Panel: das Panel scrollt. Eine Kappung auf
// zehn wäre eine stille Aussage über den Bestand (§8) — im Ist-Panel war sie die
// Folge der begrenzten Lesespalten-Höhe, nicht der Daten.
//
// ── S6 · SCHÄRFUNG (Befunde vom 23.9.2026) ─────────────────────────────────
// AE-6  aufgehobener Erlass: Zeilen ab dem Aufhebungsdatum (der Nachfolger)
//       stehen nicht als «Änderung» dieses Erlasses (`./aenderungModell`).
// AE-7  was das Ist-Panel (`kontext/RevisionenGruppe.tsx:59-97`) schon zeigte,
//       zeigt jetzt auch der Reiter: «in Kraft für die Schweiz seit» (FZA),
//       den Berichtigungs-Hinweis (`plausibilitaet`) und den Botschafts-Link.
// AE-8  die letzte Änderung des gelesenen Artikels ist markiert und oben
//       genannt (Artikel-Revisions-Shard, AS-Fundstelle).
// AE-9  das Datum ist beschriftet («in Kraft seit» / «tritt am … in Kraft»);
//       am Kanton sagt der Leerzustand, dass Änderungsverläufe dort nicht
//       erfasst sind, statt «keiner erfasst, oder nicht erreichbar».

export function PanelAenderungen({ stand, quelleUrl, stichtag, ebene, aufhebung, botschaftNachKey, artikel, locale = 'de' }: {
  stand: Geladen<RevisionAnsicht>;
  /** Amtliche Basis-URL des Erlasses — der ehrliche Ausweg im Fehlerfall (§8). */
  quelleUrl: string;
  /** `currency.geprueftAm` des Erlasses (§2: nie die Uhr). `null` = keine
   *  Zeitaussage, nur «noch nicht eingearbeitet». */
  stichtag: string | null;
  ebene?: 'bund' | 'kanton';
  /** Aufhebungs-Vermerk des Erlasses (`lib/normtext/aufhebungen`, SSoT). */
  aufhebung?: ErlassAufhebung;
  /** botschaftKey → Botschaft (aus dem ohnehin geladenen Reiter «Materialien»). */
  botschaftNachKey?: ReadonlyMap<string, BotschaftBezug>;
  /** Letzte Textänderung des gelesenen Artikels (`revisionFuerToken`). */
  artikel?: { label: string; revision: ArtikelRevision } | null;
  locale?: Locale;
}) {
  if (!stand.fertig) {
    return <p data-v3-panel-reiter-inhalt="aenderungen" className="px-3 py-3 text-body-s text-ink-600">Änderungen werden geladen …</p>;
  }
  // ── B6 (Klick-Test 18.8.2026) · EIN FEHLER, DER KEINER WAR ────────────────
  // BEFUND: an einem Kantonserlass meldete der Reiter «Änderungsverlauf konnte
  // nicht geladen werden» — ohne Netzfehler, bei intakter Verbindung, jedes Mal.
  //
  // URSACHE, gemessen 18.8.2026: `public/normtext/revisionen/` trägt 227
  // Sidecars, davon 0 kantonale (`ls | grep -c '^[A-Z][A-Z]-'`). Die
  // Revisionen liegen als EINE DATEI JE ERLASS; wo keine liegt, antwortet der
  // Server 404, und `ladeSidecar` (`lib/normtext/revisionen.ts`) bildet
  // `!res.ok` auf denselben `null`-Wert ab wie einen echten Fetch-Fehler. Für
  // rund 1200 Erlasse war die Fehlermeldung damit der NORMALZUSTAND — und eine
  // Fehlermeldung, die nichts meldet, ist die schlechteste Art zu schweigen (§8).
  //
  // Der Reiter «Materialien» hat das Problem nicht: er zieht EIN Manifest für
  // alle Erlasse. Dort heisst «Manifest da, Erlass nicht drin» = leere Liste =
  // «nicht erfasst», und `null` bleibt dem echten Fehler vorbehalten.
  //
  // WARUM HIER NUR DER WORTLAUT: die Unterscheidung 404 ↔ Netzfehler gehört an
  // die Wurzel, in `ladeSidecar` — und `src/lib/normtext/**` ist Risiko-Pfad
  // (`istRisikoPfad`, `scripts/gegenpruefung/kern.ts`), an dem V1 mithängt.
  // Dieser UI-Nachzug betritt ihn nicht; der Wurzel-Fix steht als eigener
  // Schritt im Fahrplan (§17 — hinterlegt, nicht umschifft).
  // SOLANGE behauptet der Satz keine Ursache, die wir nicht kennen: er nennt
  // BEIDE Möglichkeiten. Das ist die ehrliche Auskunft im Sinn von §8, nicht die
  // bequeme — «nicht erfasst» allein wäre im seltenen echten Fehlerfall genauso
  // falsch wie «konnte nicht geladen werden» im häufigen Normalfall.
  // AE-9/B-13: am Kanton ist «keiner erfasst, oder nicht erreichbar» keine
  // Auskunft — gemessen 18.8.2026 (oben), nachgezählt 23.9.2026: 0 von 231
  // Sidecars sind kantonal (`ls public/normtext/revisionen | grep -c "^[A-Z][A-Z]-"`). Der Satz
  // sagt das über den Korpus, nicht über den Erlass.
  if (stand.wert === null && ebene === 'kanton') {
    return (
      <p data-v3-panel-reiter-inhalt="aenderungen" data-v3-panel-abdeckung="kanton" className="px-3 py-3 text-body-s text-ink-600">
        Änderungsverläufe sind für kantonale Erlasse bisher nicht erfasst.
        Die Änderungsgeschichte führt die amtliche Sammlung des Kantons:{' '}
        <a href={quelleUrl} rel="nofollow noopener noreferrer" target="_blank" className="text-brass-700">Amtliche Fassung ↗</a>
      </p>
    );
  }
  if (stand.wert === null) {
    return (
      <p data-v3-panel-reiter-inhalt="aenderungen" className="px-3 py-3 text-body-s text-ink-600">
        Kein Änderungsverlauf verfügbar — für diesen Erlass ist keiner erfasst,
        oder die Quelle war nicht erreichbar. Amtliche Quelle:{' '}
        <a href={quelleUrl} rel="nofollow noopener noreferrer" target="_blank" className="text-brass-700">Amtliche Fassung ↗</a>
      </p>
    );
  }
  const { revisionen, reichweite } = stand.wert;
  if (revisionen.length === 0) {
    return (
      <p data-v3-panel-reiter-inhalt="aenderungen" className="px-3 py-3 text-body-s text-ink-600">
        Für diesen Erlass ist keine Änderung erfasst.
      </p>
    );
  }
  // ── Ä121 (Live-Ästhetik-Prüfung 18.8.2026) · DIE ERKLÄRUNG STEHT EINMAL ───
  // GEMESSEN am Live-Stand (StPO, Reiter «Änderungen»): FÜNF Zeilen trugen Wort
  // für Wort denselben Satz «Änderung über einen Sammelerlass — nur das Datum
  // ist erfasst.». Er erklärt eine EIGENSCHAFT DER ERFASSUNG, nicht die einzelne
  // Änderung — fünfmal gedruckt sagt er nichts fünfmal, er verdrängt nur die
  // Daten, für die die Liste da ist. Jetzt: die betroffenen Zeilen tragen die
  // kurze Marke «Sammelerlass» in derselben Meta-Zeile, in der schon «noch nicht
  // im Text» steht, und der erklärende Satz steht EINMAL unter der Liste, wo die
  // Fussnote hingehört. Die Auskunft geht nicht verloren (§8), sie wird nur
  // nicht mehr wiederholt.
  const hatSammelerlass = revisionen.some((r) => r.art === 'sammelerlass-marker');
  // ── S6 · Befund AE-1 (23.9.2026): KÜNFTIG ≠ IN KRAFT ──────────────────────
  // Klassifikation rein in `../zukunftsfassungen.aenderungZeitbezug` (§2/§3),
  // Stichtag = `currency.geprueftAm` wie im Erlass-Kopf (§5). Künftige
  // Änderungen stehen in einer EIGENEN Gruppe, nächstes Datum zuerst; die
  // übrigen bleiben in Sidecar-Reihenfolge (neu → alt).
  // AE-6: nach der Aufhebung Liegendes steht in einer eigenen Gruppe — und
  // dort ohne Zeitbezug-Aussage über DIESEN Text (er gilt nicht mehr).
  // ERGÄNZT S6 (#1001): neue Sidecars tragen `wirkungen` — eine «vollständige
  // Aufhebung» steht dort auch ohne Eintrag in `lib/normtext/aufhebungen.ts`.
  const alle: readonly RevisionZeile[] = revisionen;
  const nachAufhebung = alle.filter((r) => aufhebungsBezug(r, aufhebung) !== null);
  const zeilen = alle.filter((r) => aufhebungsBezug(r, aufhebung) === null)
    .map((r) => ({ r, bezug: aenderungZeitbezug(r, stichtag) }));
  // AE-8: gestaffelt in Kraft gesetzte Erlasse (#1001, `etappen`) stehen mit
  // derselben AS-Fundstelle mehrfach da — markiert wird dann die Etappe, deren
  // Datum der Artikel-Shard nennt; findet sich keine, alle mit der Fundstelle.
  const amArtikel = new Set<string>();
  if (artikel) {
    const gleicheAs = zeilen.filter((z) => trifftArtikel(z.r, artikel.revision));
    const gleichesDatum = gleicheAs.filter((z) => z.r.dateEntryInForce === artikel.revision.iso);
    for (const z of gleichesDatum.length > 0 ? gleichesDatum : gleicheAs) amArtikel.add(zeilenSchluessel(z.r));
  }
  const kuenftig = zeilen.filter((z) => z.bezug === 'kuenftig')
    .sort((a, b) => (a.r.dateEntryInForce < b.r.dateEntryInForce ? -1 : a.r.dateEntryInForce > b.r.dateEntryInForce ? 1 : 0));
  const uebrige = zeilen.filter((z) => z.bezug !== 'kuenftig');
  const zeile = (r: RevisionZeile, bezug: AenderungZeitbezug) => (
    <AenderungZeile key={zeilenSchluessel(r)} r={r} bezug={bezug} locale={locale}
      amArtikel={artikel && amArtikel.has(zeilenSchluessel(r)) ? artikel.label : null}
      botschaft={r.botschaftKey ? botschaftNachKey?.get(r.botschaftKey) : undefined} />
  );
  return (
    <div data-v3-panel-reiter-inhalt="aenderungen" className="px-3 py-1">
      {/* Ä121: `pt-1.5` — der Erklärtext klebte an der Reiterlinie darüber
          (gemessen 0 px Luft). Eine Zeile, die eine Liste einleitet, gehört
          näher an die Liste als an die Kante des Behälters (4-px-Raster). */}
      {reichweite && <p className="pb-1 pt-1.5 text-micro text-ink-500">{reichweite}</p>}
      {/* AE-8/D-10: die letzte Änderung des gelesenen Artikels — genannt, auch
          wenn sie in der Liste (etwa als Sammelerlass) keine eigene Zeile hat. */}
      {artikel && (
        <p data-v3-panel-aenderung-artikelstand className="num border-t border-line pb-1 pt-1.5 text-micro text-ink-700">
          {artikel.label} zuletzt geändert{artikel.revision.as ? ` durch ${artikel.revision.as}` : ''}, in Kraft seit {datumAnzeige(artikel.revision.iso)}.
        </p>
      )}
      {kuenftig.length > 0 && stichtag && (
        <section data-v3-panel-aenderungen-kuenftig>
          <p className="pb-1 pt-1.5 text-micro font-medium text-ink-700">
            Noch nicht in Kraft <span className="num font-normal text-ink-500">· Stand geprüft am {datumAnzeige(stichtag)}</span>
          </p>
          <ul>{kuenftig.map((z) => zeile(z.r, z.bezug))}</ul>
        </section>
      )}
      {uebrige.length > 0 && (
        <section data-v3-panel-aenderungen-uebrige>
          {kuenftig.length > 0 && (
            <p className="border-t border-line pb-1 pt-2 text-micro font-medium text-ink-700">
              {uebrige.some((z) => z.bezug === 'unbestimmt') ? 'Übrige Änderungen' : 'In Kraft'}
            </p>
          )}
          <ul>{uebrige.map((z) => zeile(z.r, z.bezug))}</ul>
        </section>
      )}
      {nachAufhebung.length > 0 && (
        <section data-v3-panel-aenderungen-aufhebung>
          <p className="border-t border-line pb-1 pt-2 text-micro font-medium text-ink-700">
            {aufhebung
              ? <>Nach der Aufhebung <span className="num font-normal text-ink-500">· aufgehoben seit {datumAnzeige(aufhebung.seit)}</span></>
              : 'Aufhebung'}
          </p>
          <ul>
            {nachAufhebung.map((r) => (
              <li key={zeilenSchluessel(r)} data-v3-panel-aenderung data-v3-panel-aenderung-bezug="nach-aufhebung"
                className="border-l-2 border-t border-line border-l-line py-2 pl-2.5">
                <span className="text-body-s font-medium text-ink-700">
                  {AUFHEBUNGS_TEXT[aufhebungsBezug(r, aufhebung) ?? 'nach-aufhebung']}
                </span>
                {r.roFundstelle && <span className="num ml-2 text-micro text-ink-500">{r.roFundstelle}</span>}
                <span className="mt-0.5 block text-micro leading-snug text-ink-600">
                  {revisionTitel(r, sprache(locale)) ?? ''}{' '}
                  <a href={fedlexLokalisiert(r.quelleUrl, locale)} rel="nofollow noopener noreferrer" target="_blank"
                    className="whitespace-nowrap text-brass-700">Fedlex ↗</a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* ERGÄNZT S6 (#1001): der Marker heisst seit Pfad (c) «Fassung ohne
          zugeordneten Erlass» — so richtig für ALTE Sidecars (dort «Änderung
          über einen Sammelerlass», erfasst nur das Datum) wie für NEUE (eine
          Fassung, der Fedlex keinen ändernden Erlass zuordnet). «Sammelerlass»
          behauptete eine Ursache, die der Marker nicht belegt (§8). */}
      {hatSammelerlass && (
        <p data-v3-panel-sammelerlass-hinweis className="border-t border-line pt-1.5 text-micro leading-snug text-ink-600">
          «Fassung ohne zugeordneten Erlass» heisst: an diesem Datum gilt eine
          neue Fassung, ein ändernder Erlass ist ihr in den Daten nicht zugeordnet
          (etwa ein Sammelerlass) — erfasst ist nur das Datum.
        </p>
      )}
    </div>
  );
}

const AUFHEBUNGS_TEXT: Readonly<Record<'nachfolger' | 'aufhebend' | 'nach-aufhebung', string>> = {
  nachfolger: 'Nachfolge-Erlass',
  aufhebend: 'Hebt diesen Erlass auf',
  'nach-aufhebung': 'Betrifft nicht mehr diesen Erlass',
};

function sprache(locale: Locale): 'de' | 'fr' | 'it' {
  return locale === 'fr' || locale === 'it' ? locale : 'de';
}

function AenderungZeile({ r, bezug, amArtikel, botschaft, locale }: {
  r: RevisionZeile; bezug: AenderungZeitbezug;
  /** Label des gelesenen Artikels, wenn diese Zeile seine letzte Änderung ist. */
  amArtikel: string | null;
  botschaft?: BotschaftBezug;
  locale: Locale;
}) {
  const titel = revisionTitel(r, sprache(locale));
  const marker = r.art === 'sammelerlass-marker';
  const datum = datumAnzeige(r.dateEntryInForce);
  const kuenftig = bezug === 'kuenftig';
  // AE-9: das Datum trägt seine Bedeutung. «normal» heisst konsolidiert, also
  // im gezeigten Text enthalten und in Kraft; ohne Stichtag (`unbestimmt`)
  // wird kein «in Kraft» behauptet (S6/AE-1), nur das Datum benannt.
  const datumText = kuenftig ? `tritt am ${datum} in Kraft`
    : bezug === 'unbestimmt' ? `Inkrafttreten ${datum}`
    : `in Kraft seit ${datum}`;
  return (
    <li data-v3-panel-aenderung data-v3-panel-aenderung-bezug={bezug}
      {...(amArtikel ? { 'data-v3-panel-aenderung-artikel': '' } : {})}
      className={`border-l-2 border-t border-line py-2 pl-2.5 ${amArtikel ? 'border-l-ink-900 bg-reg-g-flaeche' : kuenftig ? 'border-l-line' : 'border-l-reg-g'}`}>
      <span className="flex flex-wrap items-baseline gap-x-2">
        {/* S6: die künftige Zeile nennt ihr Datum als Satz — ein nacktes
            Datum an dieser Stelle las sich als «gilt seit». */}
        <span className={`num text-body-s font-medium ${kuenftig ? 'text-ink-600' : 'text-ink-800'}`}>
          {/* AE-7 · Finding 4b (W2·18-FEHLERBUCH), wie in `RevisionenGruppe`:
              wo Fedlex «angewendet ab» als Inkrafttreten führt, steht das
              frühere, amtlich belegte Datum daneben (§8). */}
          {r.dateInKraftFuerCh
            ? `${IN_KRAFT_FUER_CH_LABEL} ${datumAnzeige(r.dateInKraftFuerCh)} · angewendet ab ${datum}`
            : datumText}
        </span>
        {r.roFundstelle && <span className="num text-micro text-ink-500">{r.roFundstelle}</span>}
        {/* C2 (H3-Nachzug) bleibt gültig: KEIN «anderer SR» — SR-Nummern
            führt nur das Bundesrecht, die Zeile steht auch am Kanton. */}
        {marker && (
          <span data-v3-panel-sammelerlass className="text-micro text-ink-500">Fassung ohne zugeordneten Erlass</span>
        )}
        {/* #1001 · amtliche Auswirkungs-Art, wo sie keine gewöhnliche Änderung ist. */}
        {wirkungsMarken(r).map((w) => (
          <span key={w} data-v3-panel-aenderung-wirkung className="text-micro text-ink-500">{w}</span>
        ))}
        {amArtikel && <span className="text-micro font-medium text-ink-800">betrifft {amArtikel}</span>}
      </span>
      {bezug === 'inKraftOffen' && (
        <span className="mt-0.5 block text-micro leading-snug text-warn-700">
          {`in Kraft seit ${datum}, im hier gezeigten Text noch nicht eingearbeitet`}
        </span>
      )}
      {bezug === 'unbestimmt' && (
        <span className="mt-0.5 block text-micro leading-snug text-ink-600">im hier gezeigten Text noch nicht eingearbeitet</span>
      )}
      {/* #1001 · gestaffeltes Inkrafttreten: jede Etappe ist eine eigene Zeile —
          die Zeile nennt alle Daten, damit die Wiederholung erklärt ist. */}
      {r.etappen && r.etappen.length > 1 && (
        <span data-v3-panel-aenderung-etappen className="num mt-0.5 block text-micro text-ink-500">
          {`gestaffelt in Kraft: ${r.etappen.map((d) => datumAnzeige(d)).join(' · ')}`}
        </span>
      )}
      {/* #1001 · §8: das Datum stammt vom ändernden Erlass, nicht von einer
          eigenen Auswirkung auf diesen — es kann für diesen Erlass abweichen. */}
      {r.datumAusErlass && (
        <span data-v3-panel-aenderung-datum-erlass className="mt-0.5 block text-micro text-ink-500">
          Datum = Inkrafttreten des ändernden Erlasses; für diesen Erlass kann es abweichen.
        </span>
      )}
      {/* Ä121: die Zeile entsteht nur, wenn sie etwas zu sagen hat. Beim
          Sammelerlass-Marker gibt es keinen Titel — dort blieb bis
          hierher nur die wiederholte Erklärung plus ein Link ohne Ziel. */}
      <span className="mt-0.5 block text-micro leading-snug text-ink-600">
        {marker ? null : <>{titel ?? 'Änderungserlass (ohne erfassten Titel).'}{' '}</>}
        {/* Ä121: «amtlich ↗» nannte kein Ziel — genannt wird, WOHIN er führt. */}
        <a href={fedlexLokalisiert(r.quelleUrl, locale)} rel="nofollow noopener noreferrer" target="_blank"
          className="whitespace-nowrap text-brass-700">Fedlex ↗</a>
        {/* AE-7 · Botschafts-Link nur bei BELEGTEM Match (`botschaftKey`). */}
        {botschaft && (
          <>{' · '}<a href={fedlexLokalisiert(botschaft.quelleUrl, locale)} rel="nofollow noopener noreferrer" target="_blank"
            title="Zugehörige Botschaft des Bundesrates" data-v3-panel-aenderung-botschaft
            className="whitespace-nowrap text-brass-700">Botschaft{botschaft.nummer ? ` ${botschaft.nummer}` : ''} ↗</a></>
        )}
      </span>
      {/* AE-7 · §8-Marker (Gegenprüfung #703/#827), wie im Ist-Panel: nur, was
          das `jolux:rectifies`-Tripel trägt — neutraler Ton, keine Warnung. */}
      {r.plausibilitaet === 'berichtigung-fremdes-as-dokument' && (
        <span data-v3-panel-aenderung-plausibilitaet className="mt-0.5 block text-micro text-ink-500">
          {r.plausibilitaetsGrund ?? 'Fedlex verknüpft diese Berichtigung (jolux:rectifies) mit einem AS-Dokument anderer SR-Klassierung; massgeblich ist die amtliche Sammlung.'}
        </span>
      )}
    </li>
  );
}
