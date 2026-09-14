import { memo, type ReactNode } from 'react';
import type { ArtikelHistorie, HistorieEreignis, HistorieTyp } from '../../../lib/normtext/historie-laden';
import { formatiereDatum } from '../helpers';
import { fassungsSchild } from '../fassungsEtikett';
import { AMTLICHE_FASSUNG_NOMEN } from '../../../lib/benennung';

// G-HIST-UI — Per-Artikel-«Gilt seit»-Badge + aufklappbare Fassungs-Timeline.
//
// Datenquelle: der erlass-lokale Historie-Shard (public/normtext/historie/<KEY>.json,
// G-HIST #286) — der Reader lädt ihn EINMAL idle und reicht den Artikel-Eintrag als
// Prop durch (wie die Leitfall-/Verweis-Zeilen). Reine Darstellung (§3): die
// Komponente rechnet KEINE Daten, sie rendert nur, was der Shard liefert
// (giltSeit / aufgehobenSeit als Badge, `ereignisse` als Timeline).
//
// §15.2 (CLS) — KORRIGIERT nach Messung 20.7.2026. Die ursprüngliche Annahme, die
// Zeile wachse nur «below-fold» ein und sei darum CLS-neutral, war FALSCH: bei einem
// Anker-Deeplink (`/gesetze/bund/MWSTV#art-165`) steht der Zielartikel oben im
// Viewport, die Artikel darunter sind SICHTBAR — der idle-Shard-Resolve schob sie
// alle. Gemessen unter 6× CPU-Drossel: CLS 0.0227 gegen 0.0002 auf main (Faktor
// ~100), auf dem CI-Runner 0.0550 gegen Budget 0.05. Darum reserviert der Slot in
// ArtikelLeser (`mt-4 min-h-beiwerk`) die eine Chip-Zeile ab dem ERSTEN Render,
// und `schaetzeArtikelHoehe` trägt sie in `contain-intrinsic-size` für die
// off-screen-Artikel nach. Diese Komponente rendert deshalb OHNE eigenen
// Aussenabstand (der sitzt am Slot), damit reservierte und gefüllte Höhe exakt
// zusammenfallen. Die Timeline ist im Initialzustand ZU (Klick = echter Input ⇒
// CLS-exkludiert). Kein leerer Kasten (§13): ohne datierten Stand UND ohne Ereignis
// rendert die Zeile GAR NICHT (§8) — der Slot bleibt dann leerer Weissraum.

// ── NACHTRAG W2·24-D40 (David 7.9.2026) · §0 Ziff. 2b: ERGAENZT, nicht ────────
// nachgefuehrt. Die Messungen und Begruendungen oben beschreiben den Stand vom
// 20.7.2026, an dem diese Zeile in einem reservierten Slot am Artikel stand;
// sie bleiben Wort fuer Wort stehen.
//
// SEIT D40 ist der Ort ein anderer, und damit auch die CLS-Frage. Davids Frage
// lautete «und wieso ist fassung nicht auch unten am artikel?»: die Zeile ist
// jetzt der INHALT der Rubrik «Fassung» in der Funktionszeile am Artikelende
// (`./Funktionszeile.tsx`, `./ArtikelLeser.bezuegeFuss.tsx`). Sie wird deshalb auf
// dem Bildschirm ERST GERENDERT, wenn der Leser die Rubrik aufklappt — ein
// Klick, also input-getrieben und per Definition kein unerwarteter Sprung.
// Damit ist die 24-px-Reserve (`min-h-beiwerk`) ersatzlos entfallen: sie hatte
// einen Slot abzufangen, den es nicht mehr gibt (§17-Gegengewicht — was nicht
// scheitern kann, wird gestrichen statt bewacht). Was der Shard-Resolve heute
// noch bewegt, ist die MARKE in der Zeile («3 Fassungen»), und die trifft in
// derselben Leerlauf-Runde ein wie die Marken «Entscheide»/«Materialien» aus
// der Zaehl-Datei — dieselbe Bauart, dieselbe Messung (`e2e/w224-d40-fassung`,
// `npm run check:perf-lighthouse`).
//
// Der Klapp-Knopf IN dieser Zeile ist mit D40 gefallen; was er tat, tut jetzt
// der Rubrik-Griff (Herleitung an der Prop `zeitleiste`).

// HistorieTyp → deutsches Anzeige-Label (Darstellung, keine Rechtslogik). Deckt die
// im Korpus belegten Ereignistypen (historie-parse.ts) vollständig ab.
const TYP_LABEL: Readonly<Record<HistorieTyp, string>> = {
  eingefuegt: 'Eingefügt',
  fassung: 'Neufassung',
  aufgehoben: 'Aufgehoben',
  ausdruck: 'Ausdruck angepasst',
  bezeichnung: 'Bezeichnung angepasst',
  angenommen: 'Angenommen (Abstimmung)',
  betrag: 'Betrag angepasst',
  nummerierung: 'Neu nummeriert',
  bereinigt: 'Bereinigt',
  berichtigt: 'Berichtigung',
  inkraft: 'In Kraft',
  urspruenglich: 'Ursprünglich',
};

// Skopus-Zusatz (Abs./lit.), sofern die Quell-Fussnote ihn trägt — dezent, ehrlich.
function skopus(e: HistorieEreignis): string {
  const teile: string[] = [];
  if (e.absatz) teile.push(`Abs. ${e.absatz}`);
  if (e.item) teile.push(`lit./Ziff. ${e.item}`);
  return teile.join(', ');
}

// AS-/BBl-Fundstellen eines Ereignisses: amtlicher Deep-Link, wo aufgelöst; sonst
// ehrlich das blosse Label (Fundstelle nie verschweigen, §7/§8). Deduped stabil.
function Quellen({ quellen }: { quellen: HistorieEreignis['quellen'] }) {
  const gesehen = new Set<string>();
  const eindeutig = quellen.filter((q) => (gesehen.has(q.label) ? false : (gesehen.add(q.label), true)));
  if (eindeutig.length === 0) return null;
  return (
    // ── KONTRAST (a11y-Sonde 14.9.2026, W2·5m) · ink-500 STATT ink-400 ───────
    // GEMESSEN im Dunkelmodus an OR 336c: «AS 1996 1445 · BBl 1994 III 1609»
    // auf `ink-400` = 3.3:1 (#6f6b63 auf #1b1917, 12 px) — unter den 4.5:1 der
    // WCAG 1.4.3. Die AS-/BBl-Fundstelle ist ESSENTIELLE Auskunft und kein
    // beiläufiger Text: sie ist die Quelle, mit der ein Jurist die Änderung
    // nachschlägt. Dieselbe Lehre wie an den Nachbar-Pfeilen
    // (`./ArtikelNachbarn.tsx`) und an der Zeile «· aufgehoben»
    // (`./ArtikelLeser.tsx`) — beide sind aus demselben Grund auf ink-500.
    //
    // VORBESTAND, nicht durch W2·5m entstanden: NULLPROBE am selben Stand
    // (Gesamtansicht, Rubrik «Fassung» von Hand aufgeklappt, dunkel) zählte
    // 14 Knoten mit `text-ink-400`. Sichtbar wurde der Mangel erst dadurch,
    // dass der Fassungs-Block im Einzelmodus offen startet (B6).
    <span className="text-ink-500">
      {eindeutig.map((q, i) => (
        <span key={q.label + i}>
          {i > 0 && <span aria-hidden> · </span>}
          {q.url ? (
            <a href={q.url} target="_blank" rel="noopener noreferrer" className="num hover:text-brass-700">{q.label}</a>
          ) : (
            <span className="num">{q.label}</span>
          )}
        </span>
      ))}
    </span>
  );
}

// ── NACHTRAG W2·6c-E3 (11.9.2026) · §0 Ziff. 2b: ERGAENZT, nicht nachgefuehrt ──
// Die Zeitleiste ist seit E3 zugleich die FASSUNGSLEISTE der Entstehungs-Karte
// (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.5 (1): «ein Punkt je datiertem Ereignis»).
// Sie bekommt dafuer KEINE zweite Liste daneben — eine zweite Aufzaehlung
// derselben Ereignisse waere die zweite Wahrheit, die §5 verbietet — sondern
// einen SLOT je Punkt (`zusatz`). Was darin steht, entscheidet der Aufrufer
// (`components/entstehung/EntstehungsBlock.tsx`); diese Datei bleibt reine
// Darstellung (§3) und rendert ohne `zusatz` Zeichen fuer Zeichen wie bisher.

export const ArtikelHistorieZeile = memo(function ArtikelHistorieZeile({ historie, zeitleiste = false, zusatz }: {
  /** Historie dieses Artikels aus dem erlass-lokalen Shard; undefined = kein Eintrag ⇒ still. */
  historie?: ArtikelHistorie;
  /**
   * D40 · Steht die Zeitleiste OFFEN darunter?
   *
   * Bis D40 entschied das ein eigener Klapp-Knopf IN dieser Zeile («Gilt seit …
   * ▸»). Den gibt es nicht mehr: die Zeile ist seit D40 der Inhalt der Rubrik
   * «Fassung» in der Funktionszeile am Artikelende, und DEREN Griff klappt sie
   * auf (`./Funktionszeile.tsx`). Ein zweiter Knopf im aufgeklappten Block waere
   * ein Griff, der dasselbe noch einmal tut (§5) — und der Nutzer haette nach
   * dem ersten Klick immer noch keine Zeitleiste gesehen.
   *
   * `false` ist der DRUCK-Fall (`parts/ArtikelLeser.tsx`, `[data-hist-druck]`):
   * auf dem Papier stand seit je nur das Badge «Gilt seit …», weil die Leiste
   * dort zugeklappt war. Genau das bleibt (§2b — der Druckstand wird nicht
   * nachgefuehrt, er wird gehalten).
   */
  zeitleiste?: boolean;
  /**
   * W2·6c-E3 · Was AM ENDE eines Zeitleisten-Punkts zusaetzlich steht.
   *
   * Der Punkt bleibt, was er ist (Typ · Skopus · Datum · Fundstellen); der Slot
   * traegt den Griff «Warum?» und — aufgeklappt — die Aenderungskarte. `undefined`
   * (Druckfall, Tests, jeder Aufrufer ausserhalb des Lesers) laesst die Liste
   * unveraendert: kein Element, kein Attribut, kein Byte mehr als bisher.
   */
  zusatz?: (e: HistorieEreignis, i: number) => ReactNode;
}) {
  // §8: ohne datierten Stand UND ohne Ereignis nichts anzeigen (kein leerer Kasten, §13).
  if (!historie) return null;
  const ereignisse = historie.ereignisse ?? [];
  const hatDatum = !!historie.giltSeit || !!historie.aufgehobenSeit;
  if (!hatDatum && ereignisse.length === 0) return null;

  // Badge-Text (§8, nie erfunden): aufgehobener Artikel zeigt den Wirkungs-Stand,
  // sonst das In-Kraft-Datum der aktuellen Fassung; fehlt beides, ein neutraler
  // Titel für die reine Ereignis-Historie.
  //
  // W2·26/Z2 (11.9.2026): die Rechnung steht seither in `../fassungsEtikett` —
  // Wort für Wort dieselbe, nur an EINEM Ort. Grund: seit David «Fassung soll
  // nur ‹gilt seit XXX› zeigen» liest DERSELBE Stand auch als Marke in der
  // Funktionszeile, und zwei Formulierungen desselben Datums wären zwei
  // Wahrheiten (§5). Hier stand bis dahin die Original-Kette aus G-HIST-UI.
  const badgeText = fassungsSchild(historie);

  return (
    // Kein eigener Aussenabstand mehr: den trägt der reservierte Slot in
    // ArtikelLeser (`mt-4 min-h-beiwerk`), damit reservierte und gefüllte
    // Höhe exakt zusammenfallen (§15.2, sonst schiebt der Resolve doch wieder).
    <div data-historie-zeile>
      <div className="flex flex-wrap items-center gap-2">
        {/* B-6-Nachzug (R2-A, 31.8.2026): der Vorbehalt hiess «Quelle», direkt
            unter dem Label «Fassung» — das Nomen kommt jetzt aus der Wortquelle. */}
        <span className="lc-overline mr-1" title={`Fassungshistorie dieses Artikels aus den amtlichen Änderungs-Fussnoten (Fedlex). Massgeblich bleibt ${AMTLICHE_FASSUNG_NOMEN}.`}>
          <span className="lc-punkt" aria-hidden />Fassung
        </span>
        {/* D40: ein stilles Schild, kein Knopf mehr — der Griff sitzt in der
            Funktionszeile (Herleitung an der Prop `zeitleiste`). */}
        <span className="lc-chip">{badgeText}</span>
      </div>
      {zeitleiste && ereignisse.length > 0 && (
        <ol className="mt-2 space-y-1.5 border-l border-line pl-3 text-xs leading-snug text-ink-500">
          {ereignisse.map((e, i) => {
            const sk = skopus(e);
            return (
              <li key={i} className="relative">
                <span className="font-semibold text-ink-700">{TYP_LABEL[e.typ]}</span>
                {/* ink-500 wie die Quellen darunter (s. `Quellen`): «Abs. 1,
                    lit. a» sagt, WELCHEN Teil des Artikels die Änderung traf —
                    die Angabe, wegen der die Liste absatzscharf ist (M1/N1). */}
                {sk && <span className="text-ink-500"> · {sk}</span>}
                {e.datum && (
                  <span> · {e.wirkung ? 'mit Wirkung seit' : 'in Kraft seit'} <span className="num text-ink-600">{formatiereDatum(e.datum)}</span></span>
                )}
                {e.quellen.length > 0 && <span> · <Quellen quellen={e.quellen} /></span>}
                {zusatz?.(e, i)}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
});
