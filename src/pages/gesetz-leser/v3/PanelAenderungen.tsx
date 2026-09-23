import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { revisionSchluessel, revisionTitel, type RevisionAnsicht, type RevisionBezug } from '../../../lib/normtext/revisionen';
import { aenderungZeitbezug, type AenderungZeitbezug } from '../zukunftsfassungen';
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

export function PanelAenderungen({ stand, quelleUrl, stichtag }: {
  stand: Geladen<RevisionAnsicht>;
  /** Amtliche Basis-URL des Erlasses — der ehrliche Ausweg im Fehlerfall (§8). */
  quelleUrl: string;
  /** `currency.geprueftAm` des Erlasses (§2: nie die Uhr). `null` = keine
   *  Zeitaussage, nur «noch nicht eingearbeitet». */
  stichtag: string | null;
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
  const zeilen = revisionen.map((r) => ({ r, bezug: aenderungZeitbezug(r, stichtag) }));
  const kuenftig = zeilen.filter((z) => z.bezug === 'kuenftig')
    .sort((a, b) => (a.r.dateEntryInForce < b.r.dateEntryInForce ? -1 : a.r.dateEntryInForce > b.r.dateEntryInForce ? 1 : 0));
  const uebrige = zeilen.filter((z) => z.bezug !== 'kuenftig');
  return (
    <div data-v3-panel-reiter-inhalt="aenderungen" className="px-3 py-1">
      {/* Ä121: `pt-1.5` — der Erklärtext klebte an der Reiterlinie darüber
          (gemessen 0 px Luft). Eine Zeile, die eine Liste einleitet, gehört
          näher an die Liste als an die Kante des Behälters (4-px-Raster). */}
      {reichweite && <p className="pb-1 pt-1.5 text-micro text-ink-500">{reichweite}</p>}
      {kuenftig.length > 0 && stichtag && (
        <section data-v3-panel-aenderungen-kuenftig>
          <p className="pb-1 pt-1.5 text-micro font-medium text-ink-700">
            Noch nicht in Kraft <span className="num font-normal text-ink-500">· Stand geprüft am {datumAnzeige(stichtag)}</span>
          </p>
          <ul>{kuenftig.map((z) => <AenderungZeile key={revisionSchluessel(z.r)} r={z.r} bezug={z.bezug} />)}</ul>
        </section>
      )}
      {uebrige.length > 0 && (
        <section data-v3-panel-aenderungen-uebrige>
          {kuenftig.length > 0 && (
            <p className="border-t border-line pb-1 pt-2 text-micro font-medium text-ink-700">
              {uebrige.some((z) => z.bezug === 'unbestimmt') ? 'Übrige Änderungen' : 'In Kraft'}
            </p>
          )}
          <ul>{uebrige.map((z) => <AenderungZeile key={revisionSchluessel(z.r)} r={z.r} bezug={z.bezug} />)}</ul>
        </section>
      )}
      {hatSammelerlass && (
        <p data-v3-panel-sammelerlass-hinweis className="border-t border-line pt-1.5 text-micro leading-snug text-ink-600">
          «Sammelerlass» heisst: die Änderung kam über einen Erlass, der mehrere
          Gesetze zugleich ändert — erfasst ist davon nur das Datum.
        </p>
      )}
    </div>
  );
}


function AenderungZeile({ r, bezug }: { r: RevisionBezug; bezug: AenderungZeitbezug }) {
  const titel = revisionTitel(r, 'de');
  const marker = r.art === 'sammelerlass-marker';
  const datum = datumAnzeige(r.dateEntryInForce);
  const kuenftig = bezug === 'kuenftig';
  return (
    <li data-v3-panel-aenderung data-v3-panel-aenderung-bezug={bezug}
      className={`border-l-2 border-t border-line py-2 pl-2.5 ${kuenftig ? 'border-l-line' : 'border-l-reg-g'}`}>
      <span className="flex items-baseline gap-2">
        {/* S6: die künftige Zeile nennt ihr Datum als Satz — ein nacktes
            Datum an dieser Stelle las sich als «gilt seit». */}
        <span className={`num shrink-0 text-body-s font-medium ${kuenftig ? 'text-ink-600' : 'text-ink-800'}`}>
          {kuenftig ? `tritt am ${datum} in Kraft` : datum}
        </span>
        {r.roFundstelle && <span className="num shrink-0 text-micro text-ink-500">{r.roFundstelle}</span>}
        {/* C2 (H3-Nachzug) bleibt gültig: KEIN «anderer SR» — SR-Nummern
            führt nur das Bundesrecht, die Zeile steht auch am Kanton. */}
        {marker && (
          <span data-v3-panel-sammelerlass className="shrink-0 text-micro text-ink-500">Sammelerlass</span>
        )}
      </span>
      {bezug === 'inKraftOffen' && (
        <span className="mt-0.5 block text-micro leading-snug text-warn-700">
          {`in Kraft seit ${datum}, im hier gezeigten Text noch nicht eingearbeitet`}
        </span>
      )}
      {bezug === 'unbestimmt' && (
        <span className="mt-0.5 block text-micro leading-snug text-ink-600">im hier gezeigten Text noch nicht eingearbeitet</span>
      )}
      {/* Ä121: die Zeile entsteht nur, wenn sie etwas zu sagen hat. Beim
          Sammelerlass-Marker gibt es keinen Titel — dort blieb bis
          hierher nur die wiederholte Erklärung plus ein Link ohne Ziel. */}
      <span className="mt-0.5 block text-micro leading-snug text-ink-600">
        {marker ? null : <>{titel ?? 'Änderungserlass (ohne erfassten Titel).'}{' '}</>}
        {/* Ä121: «amtlich ↗» nannte kein Ziel — fünfmal derselbe Link mit
            demselben nichtssagenden Wort. Genannt wird jetzt, WOHIN er
            führt: die AS-Fundstelle, wenn das Sidecar sie trägt, sonst
            die Sammlung selbst («Fedlex ↗»). Beides ist eine echte
            Ortsangabe statt eines Adjektivs. */}
        <a href={r.quelleUrl} rel="nofollow noopener noreferrer" target="_blank"
          className="whitespace-nowrap text-brass-700">Fedlex ↗</a>
      </span>
    </li>
  );
}
