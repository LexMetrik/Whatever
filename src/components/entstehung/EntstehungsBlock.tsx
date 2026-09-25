import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArtikelHistorieZeile } from '../../pages/gesetz-leser/parts/ArtikelHistorie';
import { datumCh } from '../../lib/normtext/erlassKopfText';
import { AMTLICHE_FASSUNG_NOMEN } from '../../lib/benennung';
import { verfahrensLabel, verfahrensQuelleUrl } from '../../lib/materialien/verfahren';
import {
  ladeEntstehungProjektion, aenderungFuer, ocKurzform,
  type EntstehungProjektion, type EntstehungAenderung, type EntstehungBotschaft,
} from '../../lib/entstehung/projektion';
import { ladeAnkerSidecar, ankerFuerToken, ankerUrl, type AnkerSidecar } from '../../lib/entstehung/anker';
import { ladeSynopseShard, type SynopseShard } from '../../lib/entstehung/synopse';
import { ladeEntwurfShard } from '../../lib/entstehung/synopse-entwurf';
import {
  geltendeBloecke, lageFuerEreignis, ohneEreignisFuerArtikel, quellLueckenFuerArtikel, tokenAusLabel,
  type SynopseLage,
} from '../../lib/entstehung/synopse-diff';
import { SynopseKarte, type EntwurfFund } from './SynopseKarte';
import { ladeKantenShard } from '../../lib/materialien/kanten-shard';
import { artikelLeerstellenStatus } from '../../lib/normtext/darstellung';
import type { NormSnapshot } from '../../lib/normtext/typen';
import type { ArtikelHistorie, HistorieEreignis } from '../../lib/normtext/historie-laden';

// ═══ DIE ENTSTEHUNG AM ARTIKEL (W2·6c · E3) ═════════════════════════════════
//
// AUFTRAG David 6.9.2026, wörtlich: «Materialien und Wegleitungen maximal
// sinnvoll verzahnen … dass jemand noch besser versteht, wie ein Gesetz
// zustande gekommen ist» — mit zwei Auflagen: **das Gesetz nicht überladen, nur
// auf Wunsch sichtbar**, und **zuerst Bundesebene**. Go zum Bau 11.9.2026.
//
// ── WO DIESE KARTE STEHT UND WARUM DORT ───────────────────────────────────────
// Im AUFKLAPP-BLOCK der Rubrik «Fassung» der Funktionszeile am Artikelende
// (`pages/gesetz-leser/parts/Funktionszeile.tsx`, `.lr7-bez-inhalt`) — also genau
// dort, wo seit D40 die Zeitleiste steht. KEIN zweiter Slot in der Textspalte:
// die ältere Spec (§11 Fassung 3, C5/C6) plante einen, weil die Fassung damals
// in einer 150-px-Marginalie hing; seit D40 (#761, 7.9.2026) ist sie eine Rubrik
// mit eigenem Block, und der Block ist der Ort (Sichtung 11.9.2026, Fassung 5).
//
// ── DIE ZEITLEISTE IST DIE FASSUNGSLEISTE (§5) ────────────────────────────────
// §11.5 (1) verlangt «ein Punkt je datiertem Ereignis». Genau das ist die
// bestehende Zeitleiste (`parts/ArtikelHistorie.tsx`) — eine zweite Liste
// derselben Ereignisse daneben wäre die zweite Wahrheit, die §5 verbietet und
// die der Leser sofort als Dopplung läse. Diese Karte hängt sich deshalb IN die
// vorhandenen Punkte (Prop `zusatz`), statt neben sie.
//
// ── NICHTS LÄDT VOR DEM KLICK (Auflage David 6.9.2026) ────────────────────────
// Die Komponente EXISTIERT erst, wenn die Rubrik offen ist (die Funktionszeile
// rendert einen zugeklappten Block gar nicht, D35-F1). Ihr erster Effekt holt
// dann GENAU EINE Datei: die Entstehungs-Projektion dieses Erlasses
// (`/materialien/entstehung/<KEY>.json`, ø 3,7 KB; OR 15 KB roh / 2,5 KB gzip).
// Das Materialien-Register (2,1 MB) wird dafür NIE angefasst — es ist der Kanal
// der Materialien-Übersicht, nicht der einer Artikel-Karte (§15; Herleitung in
// `lib/entstehung/projektion.ts`). Sonde: `e2e/entstehung-karte-e3`.
//
// ── WAS SIE NICHT BEHAUPTET (§8) ──────────────────────────────────────────────
// Drei Zustände, die alle SICHTBAR sind, weil sie Auskunft sind:
//   · «Botschaft»       — das Revisions-Sidecar bindet diese Änderung an eine
//                         erfasste Botschaft ⇒ Titel, Nummer, Live-Link,
//                         Verfahrenskette, wo vorhanden der Anker-Sprung.
//   · «Bundesblatt»     — die Fussnote nennt eine BBl-Fundstelle, aber es gibt
//                         keine erfasste Botschaft ⇒ nur der amtliche Live-Link,
//                         mit Chip «Botschaft nicht erfasst» (gemessen: nur rund
//                         ein Drittel der Ereignisse trifft eine erfasste
//                         Botschaft, Kritik A3/C8).
//   · «keine Fundstelle» — die Fussnote nennt keine ⇒ die Karte sagt genau das.
// Und über allem der Vorbehalt: massgeblich bleibt die amtliche Fassung (§7).
//
// ── NACHTRAG W2·6c-SYNOPSE-LESER (11.9.2026) · DER WORTLAUT VON DAMALS ───────
// Jeder Punkt der Fassungsleiste trägt seither einen ZWEITEN Griff, «Alt/Neu».
// Er beantwortet die Frage, die am Artikel noch offen war: nicht WARUM sich
// etwas geändert hat, sondern WAS. Der Alt-Wortlaut kommt aus den E5-Shards
// (`/materialien/synopse/<KEY>.json`, ab Stand 1.1.2021), das «Neu» aus dem
// Folgestand oder — wenn es keinen mehr gibt — aus dem geltenden Korpus-Text.
//
// ZWEI GRIFFE, NICHT EINER IN DEM ANDEREN: der Fassungsvergleich hängt NICHT in
// der Änderungskarte, sondern neben ihr. Sonst käme er nur dort vor, wo eine
// Änderung überhaupt erfasst ist (gemessen ein Drittel der Ereignisse trifft
// eine erfasste Botschaft) — und die Frage «was stand vorher?» ist von der
// Frage «warum?» unabhängig.

/** Wie viele Punkte dieses Artikels eine erfasste Begründung tragen (§8). */
// ── W2·29-WERKBANK-REST S2 (25.9.2026) · DIE FORM STEHT AM BAUTEIL ────────────
// Der Alt-Block `.lr8-entst*` in `src/index.css` ist gelöscht (Löschpflicht,
// FAHRPLAN-WERKBANK-UMBAU §2/§7); seine Deklarationen stehen hier als Token-
// Utility, Muster LESER S1 (`.lr7-*` → Bauteil). Werte 1:1 übernommen — Linien
// statt Kästen (F0.6), Registerkante `reg-g`, Schrift `text-micro` (11 px).
// Zwei ERKLÄRTE Abweichungen: (1) HN-D7/DK-06 — Text in `ink-400` (3.44:1 auf
// `paper` hell, 3.30:1 dunkel, unter WCAG 1.4.3) steht jetzt in `ink-500`
// (5.57:1 / 5.32:1; gerechnet aus design/tokens.json); (2) Messing-Hover
// (`brass-700`) heisst `ink-900` — derselbe Wert (F0.3), ohne Lüge im Namen.
// Die Namen `data-entstehung-*` bleiben die Sonden-Anker.
const E = {
  block: 'min-w-0',
  /** Griff «Warum?»/«Alt/Neu»: Mini-Griff (`lc-btn-mini` steht am Tag, B-K1)
   *  in der Zeile des Punktes. */
  griff: 'group/griff ml-1 align-baseline text-micro aria-expanded:text-ink-900',
  /** Der Pfeil dreht sich, wenn sein Griff offen ist. */
  pfeil: 'inline-block transition-transform duration-fast group-aria-expanded/griff:rotate-90',
  karte: 'mt-1.5 mb-1 grid min-w-0 gap-[0.1875rem] border-l-2 border-reg-g pl-2',
  /** @390 eine Spalte: das Feldwort steht ÜBER seinem Wert (Sonde `entstehung-karte-e3` (d)). */
  zeile: 'grid min-w-0 grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-baseline gap-x-2 gap-y-0.5 [@media(max-width:30rem)]:grid-cols-1',
  feld: 'font-sans text-micro leading-[1.35] text-ink-500',
  kette: 'mt-1 grid gap-px border-l border-rule-soft pl-2.5 text-micro leading-[1.35] text-ink-500',
  mehr: 'mt-1 inline-flex text-micro leading-[inherit] text-ink-500 hover:text-ink-900',
  fuss: 'mt-1 flex flex-wrap items-center gap-1 text-micro leading-[1.35]',
  stand: 'mt-2 text-micro leading-[1.35]',
  praxis: 'mt-0.5 text-micro leading-[1.35]',
  ohne: 'mt-2 text-micro leading-[1.4] text-ink-500',
  ohneKopf: 'mb-0.5',
  ohneListe: 'grid gap-0.5 border-l border-rule-soft pl-2.5',
  /** Solange der Synopse-Shard lädt: Karte + Lage in einem (Kante wie die Karte). */
  synLaedt: 'my-1 min-w-0 border-l-2 border-reg-g pl-2 text-micro leading-[1.4] text-ink-500',
} as const;

function zaehleDeckung(ereignisse: readonly HistorieEreignis[], p: EntstehungProjektion | null) {
  let mitAenderung = 0;
  let mitBotschaft = 0;
  for (const e of ereignisse) {
    const t = aenderungFuer(p, e.quellen);
    if (!t) continue;
    mitAenderung += 1;
    if (t.a.botschaft) mitBotschaft += 1;
  }
  return { gesamt: ereignisse.length, mitAenderung, mitBotschaft };
}

/** Die BBl-Fundstelle eines Ereignisses (Live-Link, immer amtlich §7c). */
function bblQuelle(e: HistorieEreignis): { label: string; url?: string } | null {
  return e.quellen.find((q) => /^BBl\b/.test(q.label)) ?? null;
}

/** Betroffener Teil des Artikels («Abs. 2, lit./Ziff. c»), sofern die Fussnote ihn trägt. */
function betrifft(e: HistorieEreignis): string {
  const teile: string[] = [];
  if (e.absatz) teile.push(`Abs. ${e.absatz}`);
  if (e.item) teile.push(`lit./Ziff. ${e.item}`);
  return teile.length > 0 ? teile.join(', ') : 'den ganzen Artikel';
}

/** Die Verfahrenskette einer Vorlage — amtliche Etiketten, nie umformuliert (§1). */
function Verfahrenskette({ b }: { b: EntstehungBotschaft }) {
  const schritte = (b.ereignisse ?? []).filter((e) => e.datum);
  if (schritte.length === 0) return null;
  // Chronologisch, nicht in Graph-Reihenfolge: die Kette ist eine ZEITACHSE, und
  // der Graph liefert sie unsortiert (gemessen an `fga/2025/3067`: Eröffnung der
  // Vernehmlassung nach der Botschaft). Sortiert wird NUR die Anzeige (§3).
  const sortiert = [...schritte].sort((x, y) => (x.datum! < y.datum! ? -1 : x.datum! > y.datum! ? 1 : 0));
  return (
    <ol className={E.kette} data-entstehung-kette>
      {sortiert.map((s, i) => {
        const url = verfahrensQuelleUrl(s);
        return (
          <li key={`${s.code}-${s.datum}-${i}`}>
            <span className="text-ink-700">{verfahrensLabel(s)}</span>
            <span> · <span className="num text-ink-600">{datumCh(s.datum!)}</span></span>
            {url && <span> · <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-ink-900">Fundstelle&nbsp;↗</a></span>}
          </li>
        );
      })}
    </ol>
  );
}

/** Die Änderungskarte zu EINEM Punkt der Fassungsleiste (§11.5 (2)). */
function Aenderungskarte({ e, a, projektion, anker, artikel, abgerufen }: {
  e: HistorieEreignis;
  a: EntstehungAenderung;
  projektion: EntstehungProjektion;
  /** Anker-Sidecar der Botschaft, sofern geladen und vorhanden. */
  anker: AnkerSidecar | null | undefined;
  /** Roher Artikel-Token dieses Artikels («16_c») — Schlüssel des Anker-Sprungs. */
  artikel: string;
  abgerufen: string;
}) {
  const b = a.botschaft ? projektion.botschaften[a.botschaft] : undefined;
  const bbl = bblQuelle(e);
  const ankerTreffer = anker ? ankerFuerToken(anker, artikel) : null;
  return (
    <div className={E.karte} data-entstehung-karte>
      <div className={E.zeile}>
        <span className={E.feld}>Betrifft</span>
        <span>{betrifft(e)}</span>
      </div>
      <div className={E.zeile}>
        <span className={E.feld}>Geändert durch</span>
        <span>
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink-900">
            {a.titel ?? a.as ?? 'Änderungserlass'}&nbsp;↗
          </a>
          {a.titel && a.as && <span className="text-ink-500"> · <span className="num">{a.as}</span></span>}
          {a.inkraft && <span className="text-ink-500"> · in Kraft seit <span className="num">{datumCh(a.inkraft)}</span></span>}
        </span>
      </div>
      <div className={E.zeile}>
        <span className={E.feld}>Begründung</span>
        <span>
          {b ? (
            <>
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink-900">
                {b.nummer ? `Botschaft ${b.nummer}` : 'Botschaft'}: {b.titel}&nbsp;↗
              </a>
              <span className="text-ink-500"> · vom <span className="num">{datumCh(b.stand)}</span></span>
              {ankerTreffer && (
                <>
                  {' '}
                  <a href={ankerUrl(anker!, ankerTreffer)} target="_blank" rel="noopener noreferrer"
                    className="lc-chip border-l-reg-g no-underline hover:text-ink-900" data-entstehung-sprung
                    title={ankerTreffer.ueberschrift}>Sprung zur Erläuterung&nbsp;↗</a>
                </>
              )}
              <Verfahrenskette b={b} />
              {a.botschaft && (
                <Link to={`/materialien/${encodeURIComponent(a.botschaft)}`} className={E.mehr}>
                  Vorlage im Überblick<span aria-hidden>&nbsp;›</span>
                </Link>
              )}
            </>
          ) : bbl ? (
            <>
              {bbl.url
                ? <a href={bbl.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink-900"><span className="num">{bbl.label}</span>&nbsp;↗</a>
                : <span className="num">{bbl.label}</span>}
              {' '}
              <span className="lc-chip border-l-warn-500">Botschaft nicht erfasst</span>
            </>
          ) : (
            <span className="text-ink-500">Die amtliche Fussnote nennt keine Bundesblatt-Fundstelle.</span>
          )}
        </span>
      </div>
      <p className={E.fuss}>
        <span className="lc-chip">amtlich · aus der Fedlex-Fussnote</span>
        {' '}
        <span className="text-ink-500">
          Fedlex, Bundeskanzlei · Abruf <span className="num">{abgerufen ? datumCh(abgerufen) : 'unbekannt'}</span> ·
          massgeblich bleibt {AMTLICHE_FASSUNG_NOMEN}.
        </span>
        {/* W2·6c-DECKUNGS-SEITE (§8): ein Leser, der hier «Botschaft nicht
            erfasst» liest, hat genau eine Anschlussfrage — wie oft das
            vorkommt. Der Link beantwortet sie; er lädt nichts mit, die
            Deckungs-Sicht wird erst auf der Zielseite geholt. */}
        {' '}
        <Link to="/materialien/deckung" className={E.mehr}>Was fehlt?</Link>
      </p>
    </div>
  );
}

/**
 * Der Inhalt der Rubrik «Fassung»: Zeitleiste (bestehend) + Entstehung (E3).
 *
 * @param historie   Fassungshistorie dieses Artikels (erlass-lokaler Shard).
 * @param erlassKey  Kanonischer Erlass-Key — Adresse der Projektion.
 * @param artikel    Roher Artikel-Token («16_c») für Anker-Sprung und Praxis-Zähler.
 */
export function EntstehungsBlock({ historie, erlassKey, artikel, snapshot }: {
  historie?: ArtikelHistorie;
  erlassKey?: string;
  artikel: string;
  /** Der geltende Artikel — die RECHTE Spalte des Fassungsvergleichs und ihr
   *  Zitat-Nachweis (§7: Stand, Live-Link, Abrufdatum). Fehlt er (Tests, Druck,
   *  Zeilenform ohne Snapshot), bleibt die Karte auf den Alt-Fassungen der
   *  Shards — sie behauptet nie einen geltenden Wortlaut, den sie nicht hat. */
  snapshot?: NormSnapshot;
}) {
  // `undefined` = noch unterwegs · `null` = keine Projektion für diesen Erlass.
  // OHNE Erlass-Key gibt es nichts zu holen — das ist ABGELEITET, kein Zustand:
  // ein `setProjektion(null)` im Effekt wäre ein synchroner Zustandswechsel im
  // Effektkörper und damit eine Kaskaden-Render-Runde (`react-hooks/
  // set-state-in-effect`). Zustand trägt nur, was wirklich EINTRIFFT.
  const [geladen, setGeladen] = useState<EntstehungProjektion | null | undefined>(undefined);
  const projektion = erlassKey ? geladen : null;
  const [offen, setOffen] = useState<number | null>(null);
  /** Anker-Sidecars, die schon eingetroffen sind (je Botschafts-Key). */
  const [ankerCache, setAnkerCache] = useState<Record<string, AnkerSidecar | null>>({});
  /** Wie viele Wegleitungen diesen Artikel nennen — `undefined` = noch unterwegs. */
  const [praxis, setPraxis] = useState<number | undefined>(undefined);
  const kartenId = useId();
  /** Welcher Fassungsvergleich steht offen? `p<i>` = Punkt i der Leiste,
   *  `o<i>` = Eintrag i des Abschnitts «ohne Fussnoten-Ereignis». */
  const [synOffen, setSynOffen] = useState<string | null>(null);
  /** `undefined` = noch nicht geholt · `null` = für diesen Erlass gibt es keinen. */
  const [synShard, setSynShard] = useState<SynopseShard | null | undefined>(undefined);
  /** Entwurf↔Beschluss-Shards je Botschafts-Schlüssel (E6). */
  const [entwurfCache, setEntwurfCache] = useState<Record<string, EntwurfFund['shard'] | null>>({});

  // ── Der EINE Abruf dieser Karte, ausgelöst durch den Klick, der sie mountet ──
  useEffect(() => {
    if (!erlassKey) return;
    let lebt = true;
    void ladeEntstehungProjektion(erlassKey).then((p) => { if (lebt) setGeladen(p); });
    return () => { lebt = false; };
  }, [erlassKey]);

  // ── Praxis: der KANTEN-SHARD lädt erst jetzt (§11.5 (4); Entscheid 28.7.2026,
  //    «Facetten aus = null Byte» im Lesefluss).
  //
  //    GEMESSEN 11.9.2026, und darum genau dieser Weg: der bestehende
  //    Aufklapp-Ladepfad der Rubriken «Entscheide»/«Materialien» (`weckeDaten`)
  //    zieht `/materialien/register.json` mit — 2,1 MB, weil er die TITEL der
  //    Dokumente braucht. Die Sonde `entstehung-karte-e3` (a) hat das rot
  //    gezeigt, als diese Zeile noch `onPraxis?.()` rief. Für eine ZAHL braucht
  //    es keine Titel: der erlass-lokale Kanten-Shard (ZPO: keiner ⇒ 404;
  //    MWSTG 10 KB) trägt sie, und wer die Titel will, klickt die Rubrik
  //    «Materialien» — die lädt sie wie bisher.
  useEffect(() => {
    if (!erlassKey) return;
    let lebt = true;
    void ladeKantenShard(erlassKey).then((shard) => {
      if (!lebt) return;
      // Ein Eintrag je DOKUMENT (nicht je Fundstelle) — dieselbe Entdopplung,
      // die auch die Rubrik «Materialien» zeigt (§5, `projiziereMaterialien`).
      const dok = new Set((shard?.kanten ?? []).filter((k) => k.artikel === artikel).map((k) => k.dok));
      setPraxis(dok.size);
    });
    return () => { lebt = false; };
  }, [erlassKey, artikel]);

  // ── Der Fassungsvergleich lädt ERST auf «Alt/Neu» ──────────────────────────
  //    Ein Klick, ein Shard, je Erlass einmal (die Promise im Loader ist
  //    gecacht). Auch für Punkte VOR dem Fenster 2021 wird er geholt: erst der
  //    Shard sagt, ob dieser Artikel Alt-Blöcke ohne Fussnoten-Ereignis trägt —
  //    und die stünden sonst nirgends (§8). Sonde: `entstehung-synopse-leser` (a).
  useEffect(() => {
    if (!erlassKey || synOffen === null) return;
    let lebt = true;
    void ladeSynopseShard(erlassKey).then((sh) => { if (lebt) setSynShard(sh); });
    return () => { lebt = false; };
  }, [erlassKey, synOffen]);

  const ereignisse = historie?.ereignisse ?? [];
  const gewaehlt = offen !== null ? ereignisse[offen] : undefined;
  const gewaehlteAenderung = gewaehlt ? aenderungFuer(projektion, gewaehlt.quellen) : null;
  const gewaehlteBotschaft = gewaehlteAenderung?.a.botschaft;

  // Der Anker-Sidecar hängt an der GEWÄHLTEN Botschaft und wird erst geholt, wenn
  // die Projektion sagt, dass es einen gibt (`anker: true`) — ein Abruf ins Leere
  // wäre Leitung ohne Gegenwert (§15), und ein fehlender Sidecar ist ohnehin ein
  // gültiger Zustand (keine Anker, `lib/entstehung/anker.ts`).
  useEffect(() => {
    if (!gewaehlteBotschaft || !projektion?.botschaften[gewaehlteBotschaft]?.anker) return;
    let lebt = true;
    void ladeAnkerSidecar(gewaehlteBotschaft).then((s) => {
      if (lebt) setAnkerCache((alt) => ({ ...alt, [gewaehlteBotschaft]: s }));
    });
    return () => { lebt = false; };
  }, [gewaehlteBotschaft, projektion]);
  // `undefined` = unterwegs · `null` = diese Botschaft trägt keine Anker (§8).
  const anker = gewaehlteBotschaft
    ? (projektion?.botschaften[gewaehlteBotschaft]?.anker ? ankerCache[gewaehlteBotschaft] : null)
    : null;

  const deckung = zaehleDeckung(ereignisse, projektion ?? null);

  // ── Der geltende Wortlaut als rechte Spalte (§5: keine zweite Ablage) ──────
  const geltend = geltendeBloecke(snapshot?.bloecke);
  // W2·27 (15.9.2026): dreiwertig — «aufgehoben» nur mit amtlichem Beleg (§8).
  const geltendZustand = snapshot ? artikelLeerstellenStatus(snapshot.bloecke, snapshot.aufgehoben) : 'lebt';
  const geltendQuelle = {
    stand: snapshot?.stand, quelleUrl: snapshot?.quelleUrl, abgerufen: snapshot?.abgerufen,
  };
  /** Alt-Blöcke dieses Artikels ohne Fussnoten-Ereignis — sie hängen an keinem Punkt. */
  const ohneEreignis = ohneEreignisFuerArtikel(synShard, artikel, geltend);
  /** Stände, in denen die amtliche Quelle diesen Artikel nicht im Artikelbaum führt.
   *  EIGENE LISTE, nicht in die obige gemischt: das eine ist ein Wortlaut-Unterschied
   *  ohne Fussnoten-Ereignis, das andere gar kein Unterschied, sondern eine Lücke des
   *  Artefakts (§8 — zwei verschiedene Aussagen, zwei Überschriften). */
  const quellLuecken = quellLueckenFuerArtikel(synShard, artikel);

  // ── Entwurf ↔ Beschluss: nur, wo er überhaupt sein kann (E6) ───────────────
  //    Die zehn ausgelieferten Entwurfs-Shards gehören zu Vorlagen von 2024/2025
  //    (gemessen 11.9.2026); für ältere Botschaften gäbe es nichts zu holen
  //    ausser einem 404 je geöffneter Karte (§15). Der Filter liest das Jahr aus
  //    dem amtlichen Botschafts-Schlüssel — er RÄT nichts, er lässt aus.
  const offeneBotschaft = (() => {
    if (synOffen === null || !synOffen.startsWith('p')) return undefined;
    const e = ereignisse[Number(synOffen.slice(1))];
    const k = e ? aenderungFuer(projektion, e.quellen)?.a.botschaft : undefined;
    return k && /^BOTSCHAFT-(20[2-9]\d)-/.test(k) ? k : undefined;
  })();
  useEffect(() => {
    if (!offeneBotschaft) return;
    let lebt = true;
    void ladeEntwurfShard(offeneBotschaft).then((sh) => {
      if (lebt) setEntwurfCache((a) => ({ ...a, [offeneBotschaft]: sh }));
    });
    return () => { lebt = false; };
  }, [offeneBotschaft]);

  /** Der Entwurfs-Eintrag zu DIESEM Artikel, sofern die Vorlage einen führt. */
  const entwurfFund: EntwurfFund | null = (() => {
    const sh = offeneBotschaft ? entwurfCache[offeneBotschaft] : null;
    if (!sh) return null;
    const a = sh.artikel.find((x) => tokenAusLabel(x.label) === artikel);
    return a ? { shard: sh, artikel: a } : null;
  })();

  /**
   * Die Karte zu einem Fassungspunkt — oder zu einem Alt-Block ohne Ereignis.
   *
   * Solange der Shard unterwegs ist, steht «lädt …» da und nicht «kein
   * Fassungsvergleich erfasst»: das eine ist ein Zwischenstand, das andere eine
   * Aussage über unseren Bestand, und die beiden zu verwechseln wäre genau die
   * Unehrlichkeit, die §8 verbietet.
   */
  const synopseKarte = (schluessel: string, e?: HistorieEreignis) => {
    const id = `${kartenId}-syn-${schluessel}`;
    if (synShard === undefined) {
      return <p className={E.synLaedt} id={id} data-synopse-karte data-synopse-lage="laedt">Fassungsvergleich: lädt …</p>;
    }
    let lage: SynopseLage;
    if (e) {
      const ocs = e.quellen.map((q) => ocKurzform(q.url)).filter((x): x is string => !!x);
      lage = lageFuerEreignis(synShard, artikel, e.datum, ocs, geltend);
    } else if (schluessel.startsWith('q')) {
      const treffer = quellLuecken[Number(schluessel.slice(1))];
      if (!treffer) return null;
      lage = { art: 'quelle_unvollstaendig', treffer };
    } else {
      const treffer = ohneEreignis[Number(schluessel.slice(1))];
      if (!treffer) return null;
      lage = { art: 'vergleich', treffer };
    }
    return <SynopseKarte id={id} lage={lage} shard={synShard} geltend={geltendQuelle}
      entwurf={e ? entwurfFund : null} zustand={geltendZustand} />;
  };

  const zusatz = (e: HistorieEreignis, i: number): ReactNode => {
    const treffer = aenderungFuer(projektion, e.quellen);
    const auf = offen === i;
    const synSchluessel = `p${i}`;
    const synAuf = synOffen === synSchluessel;
    return (
      <>
        {treffer && (
          <>
            {' '}
            <button type="button" className={`lc-btn-mini ${E.griff}`}
              aria-expanded={auf} aria-controls={auf ? `${kartenId}-${i}` : undefined}
              data-entstehung-griff
              onClick={() => setOffen(auf ? null : i)}>
              Warum?<span aria-hidden className={E.pfeil}>&nbsp;›</span>
            </button>
          </>
        )}
        {' '}
        {/* Der zweite Griff: WAS stand vorher. Er steht an JEDEM Punkt, auch
            ohne erfasste Änderung — die Frage ist von der Frage «warum?»
            unabhängig, und die Antwort («erst ab 2021») ist auch eine. */}
        <button type="button" className={`lc-btn-mini ${E.griff}`}
          aria-expanded={synAuf} aria-controls={synAuf ? `${kartenId}-syn-${synSchluessel}` : undefined}
          data-synopse-griff
          onClick={() => setSynOffen(synAuf ? null : synSchluessel)}>
          Alt/Neu<span aria-hidden className={E.pfeil}>&nbsp;›</span>
        </button>
        {auf && treffer && projektion && (
          <div id={`${kartenId}-${i}`}>
            <Aenderungskarte e={e} a={treffer.a} projektion={projektion} anker={anker}
              artikel={artikel} abgerufen={projektion.abgerufen} />
          </div>
        )}
        {synAuf && synopseKarte(synSchluessel, e)}
      </>
    );
  };

  return (
    <div className={E.block} data-entstehung>
      <ArtikelHistorieZeile historie={historie} zeitleiste zusatz={zusatz} />
      <p className={E.stand} data-entstehung-stand>
        {projektion === undefined ? (
          <span className="text-ink-500">Entstehung: lädt …</span>
        ) : projektion === null || deckung.mitAenderung === 0 ? (
          // §8: «nicht erfasst» ist die Auskunft — nicht «gibt es nicht».
          <span className="text-ink-500">Zu den Änderungen dieses Artikels ist keine Entstehung erfasst.</span>
        ) : (
          <span className="text-ink-500">
            Entstehung: <span className="num">{deckung.mitAenderung}</span> von{' '}
            <span className="num">{deckung.gesamt}</span> Änderungen mit erfasstem Änderungserlass,
            davon <span className="num">{deckung.mitBotschaft}</span> mit erfasster Botschaft.
          </span>
        )}
      </p>
      {ohneEreignis.length > 0 && (
        // §8 · Diese Alt-Fassungen stehen in den amtlichen Konsolidierungen,
        // aber an keinem Punkt der Fassungsleiste: der Fussnoten-Apparat führt
        // zu ihrem Stand kein Ereignis an diesem Artikel (gemessen 11.9.2026:
        // 1175 solcher Blöcke, 0 davon auf einem Datum mit Ereignis). Sie
        // deshalb wegzulassen hiesse, einen belegten Wortlaut zu verschweigen.
        <div className={E.ohne} data-entstehung-ohne-ereignis>
          <p className={E.ohneKopf}>
            Wortlaut-Änderungen ohne Fussnoten-Ereignis im amtlichen Apparat:
          </p>
          <ul className={E.ohneListe}>
            {ohneEreignis.map((t, i) => {
              const k = `o${i}`;
              const auf = synOffen === k;
              return (
                <li key={k}>
                  <span className="text-ink-600">Stand <span className="num">{datumCh(t.schritt.bis)}</span></span>
                  {' '}
                  <button type="button" className={`lc-btn-mini ${E.griff}`}
                    aria-expanded={auf} aria-controls={auf ? `${kartenId}-syn-${k}` : undefined}
                    data-synopse-griff
                    onClick={() => setSynOffen(auf ? null : k)}>
                    Alt/Neu<span aria-hidden className={E.pfeil}>&nbsp;›</span>
                  </button>
                  {auf && synopseKarte(k)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {quellLuecken.length > 0 && (
        // §8 · Hier steht KEINE Änderung, sondern eine Lücke der Quelle: die amtliche
        // Konsolidierung dieses Stands führt den Artikel nicht im Artikelbaum, der
        // nächste führt ihn unverändert wieder. Bis 12.9.2026 buchte der Generator
        // daraus «entfallen» + «neu eingefügt» — 22 Aufhebungen, die es nie gab
        // (CHEMRRV Art. 4–24, Gegenprüfungs-Befund A6 zu PR #798).
        <div className={E.ohne} data-entstehung-quellluecke>
          <p className={E.ohneKopf}>
            Stände, in denen die amtliche Quelle diesen Artikel nicht führt:
          </p>
          <ul className={E.ohneListe}>
            {quellLuecken.map((t, i) => {
              const k = `q${i}`;
              const auf = synOffen === k;
              return (
                <li key={k}>
                  <span className="text-ink-600">
                    Stand <span className="num">{datumCh(t.schritt.bis)}</span>
                  </span>
                  {' '}
                  <button type="button" className={`lc-btn-mini ${E.griff}`}
                    aria-expanded={auf} aria-controls={auf ? `${kartenId}-syn-${k}` : undefined}
                    data-synopse-griff
                    onClick={() => setSynOffen(auf ? null : k)}>
                    Alt/Neu<span aria-hidden className={E.pfeil}>&nbsp;›</span>
                  </button>
                  {auf && synopseKarte(k)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className={E.praxis} data-entstehung-praxis>
        <span className="text-ink-500">
          {praxis === undefined
            ? 'Praxis: lädt …'
            : praxis === 0
              // §8: «erfasst» ist der Kern des Satzes — er sagt etwas über
              // unseren Bestand, nie über die Rechtswirklichkeit.
              ? 'Keine Wegleitung erfasst, die diesen Artikel nennt.'
              : praxis === 1
                ? '1 Wegleitung nennt diesen Artikel — siehe Rubrik «Materialien».'
                : `${praxis} Wegleitungen nennen diesen Artikel — siehe Rubrik «Materialien».`}
        </span>
      </p>
    </div>
  );
}
