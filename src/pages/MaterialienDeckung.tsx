import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { Ladeanzeige } from '../components/ui/Ladeanzeige';
import { datumCh } from '../lib/normtext/erlassKopfText';
import { erlassPfadVonKey } from '../lib/normtext/erlassAdresse';
import { AMTLICHE_FASSUNG_NOMEN, MASSGEBLICH_HALBSATZ } from '../lib/benennung';
import {
  ladeDeckungProjektion, summiere, quote, zeilen, sortiere,
  type DeckungProjektion, type DeckungSpalte, type DeckungRichtung,
} from '../lib/materialien/deckung';

// ═══ «WAS WIR NICHT HABEN» — die Deckungs-Seite (W2·6c, §11.5) ══════════════
//
// §11.5 FAHRPLAN-MATERIALIEN-VERZAHNUNG, Muster Lex `/coverage`: eine
// öffentliche Seite, die je Ebene und je Erlass sagt, was erfasst ist UND was
// nicht. Auslöser ist der ROADMAP-Befund vom 11.9.2026 — rund ein Viertel der
// Synopse-Alt-Blöcke trägt kein Fussnoten-Ereignis. Das ist kein Bug-Report,
// sondern eine Vollständigkeits-Frage an den AMTLICHEN Fussnoten-Apparat, und
// die beantwortet man nicht durch Wegglätten, sondern durch Zeigen (§8).
//
// ── DIE SEITE RECHNET NICHT (§3) ──────────────────────────────────────────────
// Jede Zahl kommt aus `/materialien/deckungs-sicht.json`; jede Summe kommt
// aus `summiere()` in der Leseschicht. Hier steht keine einzige hartkodierte
// Zahl — der Unit-Test (`src/tests/deckung-seite.test.tsx`) rendert die Seite
// gegen eine Fixture und prüft, dass Summen und Zeilen dasselbe sagen.
//
// ── EIN FETCH, UND ZWAR NUR HIER (§15) ────────────────────────────────────────
// Die Sicht ist 78 KB roh / 11 KB gzip. Sie ersetzt genau die 8 MB Artefakte,
// die ein Überblick sonst anfassen müsste (Deckungs-Register, 186 Synopse-
// Shards, 185 Entstehungs-Shards, Provenienz- und Normtext-Register). Die
// Materialien-Übersicht und die Entstehungs-Karte VERLINKEN diese Seite; sie
// laden die Sicht nie mit (Sonde `e2e/deckung-seite`).
//
// ── WAS DIE SEITE BEHAUPTET UND WAS NICHT (§8) ────────────────────────────────
//  · «haben / nicht haben» steht nur dort, wo eine Grundgesamtheit erhoben ist.
//    Wo nicht (Parlaments-Geschäfte, Basler Ketten), steht «nicht erhoben» —
//    «385 von 385» wäre eine erfundene Vollständigkeit.
//  · Die Quote «ohne Fussnoten-Ereignis» ist eine MESSUNG, keine Fehlerquote.
//    Die Stichprobe belegt Einzelfälle (Berichtigungen, Terminologie); die
//    Quote selbst ist erlassweise NICHT geprüft, und genau das steht da.
//  · Maschinell abgeleitete Kanten heissen «maschinell abgeleitet, fachlich
//    nicht geprüft» — nicht «erfasst».

/** Zahl in Schweizer Schreibweise (1'573). */
const nf = (n: number) => n.toLocaleString('de-CH');
/** Quote als Prozent mit einer Nachkommastelle; `null` bleibt ein Gedankenstrich. */
const pf = (q: number | null) => (q === null ? '—' : `${(q * 100).toFixed(1)} %`);

/** Eine Zeile der Ebenen-Liste. `gesamt: null` heisst «Grundgesamtheit nicht
 *  erhoben» — dann steht dort kein «nicht erfasst», nie eine 0. */
function EbenenZeile({ name, haben, gesamt, einheit, stand, quelle, hinweis }: {
  name: string;
  haben: number;
  gesamt: number | null;
  einheit: string;
  stand: string;
  quelle: string;
  hinweis?: string;
}) {
  return (
    <div className="grid gap-x-6 gap-y-1 border-t border-rule-soft py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="text-body-s font-medium text-ink-900">{name}</p>
        <p className="text-xs leading-snug text-ink-500">{quelle} · Stand {datumCh(stand)}</p>
        {hinweis && <p className="max-w-reading text-xs leading-snug text-ink-500">{hinweis}</p>}
      </div>
      <p className="lc-ziffern text-body-s text-ink-700 sm:text-right">
        <span className="text-ink-900">{nf(haben)}</span>
        {gesamt === null
          ? <span className="text-ink-500"> {einheit} erfasst · Grundgesamtheit nicht erhoben</span>
          : (
            <>
              <span className="text-ink-500"> von {nf(gesamt)} {einheit}</span>
              <span className="block text-xs text-ink-500">{nf(gesamt - haben)} nicht erfasst</span>
            </>
          )}
      </p>
    </div>
  );
}

const SPALTEN: ReadonlyArray<{ id: DeckungSpalte; kopf: string; titel: string; ziffern: boolean }> = [
  { id: 'erlass', kopf: 'Erlass', titel: 'Nach Kürzel sortieren', ziffern: false },
  { id: 'quote', kopf: 'Fussnoten-Deckung', titel: 'Nach Deckungsgrad sortieren', ziffern: true },
  { id: 'ocFussnoten', kopf: 'Fundstellen', titel: 'Nach Zahl der Fussnoten-Fundstellen sortieren', ziffern: true },
  { id: 'aenderungen', kopf: 'Änderungen · mit Botschaft', titel: 'Nach Zahl der Änderungen sortieren', ziffern: true },
  { id: 'altBloecke', kopf: 'Alt-Blöcke', titel: 'Nach Zahl der Alt-Blöcke sortieren', ziffern: true },
  { id: 'ohneEreignis', kopf: 'ohne Ereignis', titel: 'Nach Alt-Blöcken ohne Fussnoten-Ereignis sortieren', ziffern: true },
];

/**
 * Die Sicht auf eine GELADENE Deckungs-Projektion — rein, ohne Laden, ohne
 * Netz. Der Schnitt ist §3 (Logik/Laden ≠ Darstellung) und zugleich der einzige
 * Weg, die Seite im Test zu prüfen: die Vitest-Umgebung ist `node`, ein
 * `useEffect` läuft in `renderToString` nie. `src/tests/deckung-seite.test.tsx`
 * rendert deshalb DIESE Komponente gegen eine Fixture und rechnet die
 * angezeigten Summen gegen die Zeilen nach.
 */
export function DeckungsSicht({ p }: { p: DeckungProjektion }) {
  const [spalte, setSpalte] = useState<DeckungSpalte>('quote');
  const [richtung, setRichtung] = useState<DeckungRichtung>('auf');

  const s = useMemo(() => summiere(p), [p]);
  const liste = useMemo(() => sortiere(zeilen(p), spalte, richtung), [p, spalte, richtung]);
  const eb = p.ebenen;

  function sortiereNach(id: DeckungSpalte) {
    if (id === spalte) setRichtung(richtung === 'auf' ? 'ab' : 'auf');
    else { setSpalte(id); setRichtung(id === 'erlass' ? 'auf' : 'ab'); }
  }

  return (
    <>
      <section aria-labelledby="d-ebenen" data-deckung-ebenen className="space-y-2">
        <h2 id="d-ebenen" className="text-h3 font-display font-semibold text-ink-900">
          Ebene für Ebene
        </h2>
        <p className="max-w-reading-s text-body-s leading-relaxed text-ink-600">
          Jede Ebene beantwortet eine andere Frage. Wo wir die Grundgesamtheit kennen, steht
          sie daneben; wo nicht, steht «Grundgesamtheit nicht erhoben» — eine Vollständigkeit
          zu behaupten, die niemand gezählt hat, wäre schlimmer als die Lücke selbst.
        </p>

        <div className="mt-4">
          {(
            <>
              <EbenenZeile
                name="Fussnoten-Fundstellen in der Fedlex-Änderungsliste"
                haben={s.ocGetroffen} gesamt={s.ocFussnoten} einheit="Fundstellen"
                stand={p.staende.deckung}
                quelle="Fedlex, Artikel-Fussnoten und Änderungsliste (fedlex.admin.ch)"
                hinweis={
                  'Die beiden Quellen decken verschiedene Zeiträume ab: die Fussnoten reichen bis in '
                  + 'die 1950er-Jahre zurück, die Änderungsliste ist erst ab rund 2000 verlässlich. '
                  + 'Der tiefe Anteil ist deshalb keine Fehlerquote, sondern die Reichweite der jüngeren Quelle.'
                }
              />
              <EbenenZeile
                name="Änderungen mit erfasster Botschaft (Bund)"
                haben={s.mitBotschaft} gesamt={s.aenderungen} einheit="Änderungen"
                stand={p.staende.entstehung}
                quelle="Fedlex, Bundesblatt (fedlex.admin.ch)"
                hinweis={
                  'Für die übrigen Änderungen führt die Karte am Artikel nur den amtlichen Live-Link '
                  + 'zum Bundesblatt — «keine erfasste Botschaft» heisst genau das und nie «keine Botschaft».'
                }
              />
              <EbenenZeile
                name="Botschaften mit Sprungmarken auf einzelne Artikel"
                haben={eb.anker.haben} gesamt={eb.anker.gesamt} einheit="Botschafts-Volltexten"
                stand={eb.anker.stand} quelle={eb.anker.quelle}
                hinweis={
                  'Ohne Sprungmarke führt der Link auf den Anfang der Botschaft statt auf die Stelle, '
                  + 'die den Artikel erläutert.'
                }
              />
              <EbenenZeile
                name="Verfahrensketten Bund (Vernehmlassung bis Inkraftsetzung)"
                haben={eb.verfahrenBund.haben} gesamt={eb.verfahrenBund.gesamt} einheit="Ketten"
                stand={eb.verfahrenBund.stand} quelle={eb.verfahrenBund.quelle}
              />
              <EbenenZeile
                name="Parlamentsgeschäfte im Bestand"
                haben={eb.curia.haben} gesamt={eb.curia.gesamt} einheit="Geschäfte"
                stand={eb.curia.stand} quelle={eb.curia.quelle}
                hinweis="Nur Geschäfte, die an einem erfassten Erlass hängen — nicht der ganze Ratsbetrieb."
              />
              <EbenenZeile
                name="Erlasse mit Fassungsvergleich (Synopse)"
                haben={s.mitFenster} gesamt={s.erlasse} einheit="Erlassen"
                stand={p.staende.synopse}
                quelle="Fedlex, konsolidierte Stände (fedlex.admin.ch)"
                hinweis={
                  'Der Vergleich «vorher/nachher» braucht konsolidierte Stände; die liegen erst ab 2021 vor. '
                  + 'Für ältere Änderungen zeigt die Karte am Artikel nichts an, statt etwas zu behaupten.'
                }
              />
              <EbenenZeile
                name="Basel-Stadt: Geschäfte des Grossen Rates mit Verfahrenskette"
                haben={eb.verfahrenBs.haben} gesamt={eb.verfahrenBs.gesamt} einheit="Geschäften"
                stand={eb.verfahrenBs.stand} quelle={eb.verfahrenBs.quelle}
              />
              <EbenenZeile
                name="Zürich"
                haben={eb.zh.haben} gesamt={eb.zh.gesamt} einheit="Geschäfte"
                stand={eb.zh.stand} quelle={eb.zh.quelle}
                hinweis="Für Zürich ist noch keine Entstehungsgeschichte erschlossen — die Erlasse selbst sind im Volltext lesbar."
              />
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="d-maschinell" className="lc-notice space-y-2">
          <p className="lc-overline" id="d-maschinell">Maschinell abgeleitet, fachlich nicht geprüft</p>
          <p className="max-w-reading-s text-body-s leading-relaxed text-ink-600">
            Die Verbindung «dieses Basler Geschäft gehört zu jenem Erlass» ist in{' '}
            <span className="lc-ziffern text-ink-900">{nf(eb.bsKanten.amtlich)}</span> Fällen amtlich
            belegt und in{' '}
            <span className="lc-ziffern text-ink-900">{nf(eb.bsKanten.maschinell)}</span> Fällen
            maschinell über Datum und Titel abgeleitet. Die abgeleiteten Verbindungen sind
            plausibel, aber fachlich nicht geprüft; sie sind in der Anzeige als solche
            gekennzeichnet und dürfen nicht wie eine amtliche Zuordnung gelesen werden.
          </p>
      </section>

      <section aria-labelledby="d-ohne" data-deckung-ohne className="space-y-2 border-t border-rule-soft pt-6">
        <h2 id="d-ohne" className="text-h3 font-display font-semibold text-ink-900">
          Änderungen, zu denen die amtliche Fussnote schweigt
        </h2>
        <>
            <p className="max-w-reading-s text-body-s leading-relaxed text-ink-600">
              Beim Fassungsvergleich sind{' '}
              <strong className="lc-ziffern text-ink-900">{nf(s.altBloecke)}</strong> Textblöcke
              erfasst, die sich zwischen zwei Ständen geändert haben. Bei{' '}
              <strong className="lc-ziffern text-ink-900">{nf(s.ohneEreignis)}</strong> davon —{' '}
              <span className="lc-ziffern">{pf(s.altBloecke === 0 ? null : s.ohneEreignis / s.altBloecke)}</span>{' '}
              — nennt die amtliche Fussnote am Artikel kein Ereignis, das die Änderung erklären würde.
            </p>
            <p className="max-w-reading-s text-body-s leading-relaxed text-ink-600">
              Eine Stichprobe zeigt echte, aber geringfügige Änderungen: Berichtigungen,
              vereinheitlichte Terminologie, angepasste Verweise — Vorgänge, für die der
              Fussnoten-Apparat keinen eigenen Eintrag vorsieht.{' '}
              <strong className="text-ink-900">
                Ob das die ganze Klasse erklärt, ist nicht geprüft.
              </strong>{' '}
              Die Quote ist erlassweise nicht untersucht; sie steht hier als offene Frage an die
              Vollständigkeit des amtlichen Apparats, nicht als Befund. Die Spalte «ohne Ereignis»
              in der Liste unten zeigt, wo sie sich häuft.
            </p>
            <p className="max-w-reading-s text-body-s leading-relaxed text-ink-600">
              Die Gegenrichtung wird genauso gezeigt und genauso wenig aufgelöst:{' '}
              <strong className="lc-ziffern text-ink-900">{nf(s.konflikte)}</strong> Fussnoten-Ereignisse
              stehen ohne beobachtete Textänderung da, und{' '}
              <strong className="lc-ziffern text-ink-900">{nf(s.quellLuecken)}</strong> Blöcke sind als
              «Quelle unvollständig» gebucht, weil der amtliche Stand den Artikel nur im
              Änderungsanhang führt.
            </p>
        </>
      </section>

      <section aria-labelledby="d-liste" className="space-y-2 border-t border-rule-soft pt-6">
        <h2 id="d-liste" className="text-h3 font-display font-semibold text-ink-900">
          Jeder Erlass einzeln
        </h2>
        <p className="max-w-reading-s text-body-s leading-relaxed text-ink-600">
          {(
              <>
                <span className="lc-ziffern">{nf(s.erlasse)}</span> Erlasse, sortierbar über die
                Spaltenköpfe. Bei <span className="lc-ziffern">{nf(s.ohneTreffer)}</span> davon taucht
                keine einzige Fussnoten-Fundstelle in der Änderungsliste auf (Deckung 0 %); bei{' '}
                <span className="lc-ziffern">{nf(s.ohneFundstelle)}</span> — überwiegend
                Staatsverträgen — gibt es gar keine Fundstelle, gegen die sich messen liesse, dort
                steht ein Gedankenstrich statt einer Quote.
              </>
            )}
        </p>

        {/* @320 px passt die Zahlentabelle nicht in den Viewport — gemessen
            12.9.2026: bei 16 rem Kürzel-Spalte füllte allein sie den Schirm,
            die Zahlen standen unsichtbar rechts daneben. Darum unter `sm`:
            schmale Kürzel-Spalte, Titelzeile aus (der Titel bleibt im
            `title`-Attribut und über den Link erreichbar) und ein kleinerer
            Mindestrahmen — so stehen Kürzel, Deckungsgrad und Fundstellen
            zusammen im Bild, der Rest kommt durch Schieben.

            `lc-scrollrand-x` IST DIE AFFORDANZ, nicht ein Zusatz (B8, LM-063/
            LM-064): `overflow-x-auto` allein schneidet die letzte Spalte ohne
            ein Zeichen ab, dass dort noch etwas liegt — genau das meldete R8
            (`kein-abschnitt`, Kategorie a) an dieser Stelle, viermal, @320 und
            @390 in hell und dunkel. Der Deckel-Ton bleibt der Vorgabewert
            `--paper`: die Seite trägt keine eigene Fläche.
            Hier stand zuvor zusätzlich der Satz «Die Tabelle lässt sich
            seitwärts schieben» — er ist mit der Affordanz weg, nicht neben sie
            gestellt (§17-Gegengewicht: der Schatten kennt den Scrollstand, der
            Satz kannte ihn nie und stand auch am Streckenende noch da, §8). */}
        <div className="mt-2 overflow-x-auto lc-scrollrand-x sm:mt-4">
          <table data-deckung-tabelle className="w-full min-w-[30rem] border-collapse text-body-s sm:min-w-[38rem]">
            <caption className="sr-only">
              Deckung je Erlass: Fussnoten-Deckung, erfasste Änderungen und Alt-Blöcke des
              Fassungsvergleichs. Die Spaltenköpfe sortieren.
            </caption>
            <thead>
              <tr>
                {SPALTEN.map((sp) => (
                  <th
                    key={sp.id}
                    scope="col"
                    aria-sort={spalte === sp.id ? (richtung === 'auf' ? 'ascending' : 'descending') : 'none'}
                    className={`border-b-2 border-rule py-2 align-bottom text-xs font-medium text-ink-600 ${sp.ziffern ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      onClick={() => sortiereNach(sp.id)}
                      title={sp.titel}
                      data-deckung-sort={sp.id}
                      /* B-K1: Bausteinklasse statt Eigenbau-Optik. `lc-btn-mini`
                         bringt Haarlinie und das 24-px-Tippziel mit; Stimme
                         (Grad, Tintenstufe) bleibt beim Aufrufer. */
                      className="lc-btn-mini text-xs font-medium text-ink-600 hover:text-ink-900"
                    >
                      {sp.kopf}
                      <span aria-hidden className="ml-1 text-ink-500">
                        {spalte === sp.id ? (richtung === 'auf' ? '▲' : '▼') : '·'}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liste.map((z) => (
                <tr key={z.key} data-deckung-zeile={z.key} className="border-b border-rule-soft align-baseline">
                  <th scope="row" className="max-w-[7rem] py-1.5 pr-3 text-left font-normal sm:max-w-[16rem] sm:pr-4">
                    {/* §5: die Erlass-Adresse hat EINE Ableitung. Hier stand
                        `/gesetze/bund/<key>` von Hand — für die 14 erfassten
                        Staatsverträge (CISG, EMRK, UNO_PAKT_I/II …) wäre das
                        die falsche Adresse gewesen (Routen-Ebene
                        «international», Befund 45); das Tor
                        src/tests/erlass-adresse.test.ts hat es gemeldet. */}
                    <Link
                      to={erlassPfadVonKey(z.key)}
                      className="lc-link"
                    >
                      {z.key}
                    </Link>
                    <span className="hidden truncate text-xs text-ink-500 sm:block" title={z.titel}>
                      {z.titel}
                    </span>
                  </th>
                  <td className="lc-ziffern py-1.5 pl-2 text-right sm:pl-4 text-ink-900">{pf(quote(z))}</td>
                  <td className="lc-ziffern py-1.5 pl-2 text-right sm:pl-4 text-ink-600">
                    {z.ocFussnoten === 0 ? '—' : `${nf(z.ocGetroffen)} / ${nf(z.ocFussnoten)}`}
                  </td>
                  <td className="lc-ziffern py-1.5 pl-2 text-right sm:pl-4 text-ink-600">
                    {z.aenderungen === 0 ? '—' : `${nf(z.aenderungen)} · ${nf(z.mitBotschaft)}`}
                  </td>
                  <td className="lc-ziffern py-1.5 pl-2 text-right sm:pl-4 text-ink-600">
                    {z.altBloecke === undefined ? '—' : nf(z.altBloecke)}
                  </td>
                  <td className="lc-ziffern py-1.5 pl-2 text-right sm:pl-4 text-ink-600">
                    {z.ohneEreignis === undefined ? '—' : nf(z.ohneEreignis)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-reading pt-2 text-xs leading-snug text-ink-500">
          Ein Gedankenstrich heisst «für diesen Erlass nicht erhoben», nie «null». Erlasse ohne
          Fassungsvergleich tragen in den letzten beiden Spalten einen Strich, weil es für sie
          kein Fenster ab 2021 gibt.
        </p>
      </section>

      <section className="space-y-2 border-t border-rule-soft pt-6">
        <p className="max-w-reading-s text-body-s leading-relaxed text-ink-600">
          Was die Suche durchsucht, steht auf einer eigenen Seite:{' '}
          <Link to="/abdeckung" className="lc-link">
            Was ist durchsuchbar
          </Link>
          . Diese Seite hier handelt allein von der Entstehungsgeschichte der Erlasse. Keine
          Rechtsberatung; {MASSGEBLICH_HALBSATZ}.
        </p>
      </section>
    </>
  );
}

// W2·29-WERKBANK-REST S2 (25.9.2026): Werkbank-Tokens statt Alt-Tönen —
// Trennlinien 1 px `rule-soft`, Tabellenkopf 2 px `rule` (F0.6), Links ohne
// Messing (`lc-link`, auch in der Erlass-Spalte der Tabelle: ein Strich erst
// beim Überfahren ist verboten, B-L1b), der Lade-Baustein `ui/Ladeanzeige`.
// Zahlen, Spalten, Sortierung und Wortlaut unverändert (Inventar 3.6).

/**
 * Die Route `/materialien/deckung`: Kopf + Ladezustand + die Sicht.
 *
 * Der Kopf steht VOR dem Laden vollständig da und ändert seine Höhe danach
 * nicht mehr — das Nachwachsen passiert ausschliesslich UNTER ihm, es
 * verschiebt also nichts Sichtbares (CLS 0, §15).
 */
export function MaterialienDeckung() {
  const [p, setP] = useState<DeckungProjektion | null>(null);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    let lebt = true;
    ladeDeckungProjektion().then((x) => {
      if (!lebt) return;
      if (!x) { setFehler(true); return; }
      setP(x);
    });
    return () => { lebt = false; };
  }, []);

  return (
    <div className="space-y-10">
      <SeitenKopf
        overline="Materialien"
        titel="Was wir nicht haben"
        intro={(
          <span>
            Diese Seite zählt auf, wie weit die Entstehungsgeschichte der erfassten Erlasse
            hinterlegt ist — und wo sie es nicht ist. Sie ist bewusst unfreundlich gegenüber
            dem eigenen Bestand: Lücken stehen als Zahl da, nicht als Fussnote. Massgeblich
            bleibt in jedem Fall {AMTLICHE_FASSUNG_NOMEN}.
          </span>
        )}
      />

      {fehler && (
        <p className="lc-notice text-body-s text-ink-600">
          Die Deckungszahlen konnten nicht geladen werden. Das ist ein Fehler dieser Seite,
          kein Befund über den Bestand — bitte später erneut versuchen.
        </p>
      )}

      {/* W3-7 (REST S2): der eine Lade-Baustein, mit `role="status"`. */}
      {!p && !fehler && <Ladeanzeige text="Die Deckungszahlen werden geladen …" />}

      {p && <DeckungsSicht p={p} />}
    </div>
  );
}
