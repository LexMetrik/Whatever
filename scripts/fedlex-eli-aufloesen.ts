/**
 * Resolver: SR-Nummer → Fedlex-ELI + GELTENDE Konsolidierung (§7), für das
 * Nachladen weiterer Bund-Volltexte. Fragt den amtlichen Fedlex-SPARQL-Endpoint
 * (gleicher wie check:fedlex-versionen) und gibt fertige `fedlex-cache.sh`-
 * Zeilen im 6-Feld-Pin-Format aus:  name|eli|YYYYMMDD|html-N|art_1|sr
 *
 * Auswahl in DREI getrennten, je deterministischen Schritten (B-07, A1-FUNDAMENT):
 *   1. ABSTRACT: genau ein ConsolidationAbstract der SR im Currency-Fenster
 *      (dateEntryInForce ≤ heute UND kein dateNoLongerInForce ≤ heute — wie
 *      scripts/normtext/abk-aliase-generieren.ts, bibliothek/recherche/
 *      fedlex-abkuerzungen-titleshort.md Regel 2). Vorgänger/Nachfolger tragen
 *      DIESELBE SR (BV 1874 ↔ BV, AVG 1951 ↔ AVG 1991): ohne Fenster wählte die
 *      alte Abfrage «die erste Zeile». Bei 0 oder >1 Kandidaten: laut OFFEN, nie raten.
 *      Die Notation ist über die Typ-IRI id-systematique festgelegt — ohne sie
 *      trifft `skos:notation "220"` auch die Typen id/id-amt (fremde Erlasse).
 *      Tragen mehrere Abstracts das Fenster (Fedlex pflegt dateNoLongerInForce
 *      nicht überall: RPG SR 700, PüG SR 942.20, MWSTV SR 641.201 live 7.10.2026),
 *      entscheidet das zweite, ebenfalls amtliche Kriterium: nur ein Abstract mit
 *      einer Konsolidierung, deren Anwendbarkeitsfenster `heute` enthält
 *      (dateApplicability ≤ heute, dateEndApplicability fehlt oder ≥ heute).
 *      Bleibt auch dann nicht genau einer, ist die SR OFFEN.
 *   2. KONSOLIDIERUNG: grösste dateApplicability ≤ heute dieses einen Abstracts
 *      (künftige Fassungen werden NICHT gepinnt, §7). Liste ohne LIMIT, mit
 *      ORDER BY und COUNT-Zähltor (stille Teilergebnisse des Endpoints).
 *   3. html-N: kanonisch via isExemplifiedBy (scripts/fedlex-manifest.ts) — NICHT
 *      konstruiert. `fedlex-cache.sh` probiert seit 3.8.2026 KEINE -N-Varianten
 *      mehr durch («KEIN FALLBACK»-Block dort): ein falsches N ist ein roter Pin.
 *
 * Stand der Auswahl-Regel: die alte Fassung (`LIMIT 200` ohne `ORDER BY`,
 * `bindings[0]`) war vom Endpoint-Zufall abhängig; SR 211.435.1 → NAG 1891,
 * SR 823.11 → AVG 1951, SR 0.101 → Stand 1983 statt 2022 (live reproduziert
 * 7.10.2026). Regressionstest: src/tests/fedlex-eli-aufloesen.test.ts.
 *
 * Aufruf:
 *   npx vite-node scripts/fedlex-eli-aufloesen.ts -- 830.1 831.10 …   (SR-Liste)
 *   npx vite-node scripts/fedlex-eli-aufloesen.ts -- --register       (alle nur-live-link-Bund-Erlasse des Registers)
 *   optional: --datum=YYYY-MM-DD  (Stichtag statt heute, reproduzierbar)
 * Exit 1, wenn mindestens eine SR OFFEN bleibt.
 */
import { sparqlSelect, type FetchImpl, type SparqlBinding } from './fedlex-sparql';
import { loeseHtmlManifeste } from './fedlex-manifest';

const ELI_BASIS = 'https://fedlex.data.admin.ch/eli/';
const NOTATION_TYP = 'https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique';
const PREFIXE = `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>`;
/** Anläufe, bis ein Zähltor-Widerspruch (stilles Teilergebnis) als Abbruch gilt. */
const MAX_ANLAEUFE = 3;

export type AbstractKandidat = { eli: string; von: string | null; bis: string | null };
export type Aufloesung =
  | { ok: true; sr: string; eli: string; geltend: string; n: number; anzahl: number; naechste: string | null }
  | { ok: false; sr: string; grund: string };

const isoTag = (v: string): string => v.slice(0, 10);

/** Gruppiert die Roh-Bindings (?cc ?von ?bis) zu je einem Kandidaten pro Abstract. */
export function gruppiereAbstracts(bindings: SparqlBinding[]): AbstractKandidat[] {
  const je = new Map<string, { von: string[]; bis: string[] }>();
  for (const b of bindings) {
    const eli = b.cc.value.replace(ELI_BASIS, '');
    const e = je.get(eli) ?? { von: [], bis: [] };
    if (b.von) e.von.push(isoTag(b.von.value));
    if (b.bis) e.bis.push(isoTag(b.bis.value));
    je.set(eli, e);
  }
  return [...je.entries()]
    .map(([eli, e]) => ({
      eli,
      von: e.von.length ? e.von.sort()[0] : null, // frühestes Inkrafttreten
      bis: e.bis.length ? e.bis.sort()[0] : null, // frühestes Ausserkrafttreten
    }))
    .sort((a, b) => (a.eli < b.eli ? -1 : a.eli > b.eli ? 1 : 0));
}

/** Eine Konsolidierung eines Abstracts: Anwendbarkeitsbeginn und (falls vorhanden) -ende. */
export type Konsolidierung = { date: string; end: string | null };

/** Fenster-Stufe 1: in Kraft ≤ heute und nicht ausser Kraft ≤ heute. */
export function imAbstractFenster(k: AbstractKandidat, heute: string): boolean {
  return k.von !== null && k.von <= heute && !(k.bis !== null && k.bis <= heute);
}

/** Fenster-Stufe 2: eine Konsolidierung deckt `heute` (date ≤ heute, end fehlt oder ≥ heute). */
export function deckt(kons: Konsolidierung[], heute: string): boolean {
  return kons.some((c) => c.date <= heute && (c.end === null || c.end >= heute));
}

/**
 * Wählt den EINEN geltenden Abstract. `konsOf` liefert die Konsolidierungen je ELI
 * (nur für Kandidaten im Abstract-Fenster nötig). Reihenfolge der Eingabe ist ohne
 * Wirkung (alles wird sortiert) — das ist die Determinismus-Eigenschaft, die der
 * Test über Permutationen beweist.
 */
export function waehleAbstract(
  kandidaten: AbstractKandidat[],
  heute: string,
  konsOf: (eli: string) => Konsolidierung[],
): { ok: true; eli: string } | { ok: false; grund: string } {
  if (!kandidaten.length) return { ok: false, grund: 'keine ConsolidationAbstract' };
  const liste = kandidaten
    .map((k) => `${k.eli} [${k.von ?? '?'} … ${k.bis ?? 'offen'}]`)
    .sort()
    .join('; ');
  const fenster = kandidaten.filter((k) => imAbstractFenster(k, heute));
  if (fenster.length === 0) {
    return { ok: false, grund: `kein ConsolidationAbstract im Currency-Fenster (in Kraft ≤ ${heute}, nicht ausser Kraft): ${liste}` };
  }
  if (fenster.length === 1) return { ok: true, eli: fenster[0].eli };
  const deckend = fenster.filter((k) => deckt(konsOf(k.eli), heute));
  if (deckend.length === 1) return { ok: true, eli: deckend[0].eli };
  return {
    ok: false,
    grund: `${fenster.length} Abstracts im Currency-Fenster, davon ${deckend.length} mit einer Konsolidierung, die ${heute} deckt — Auswahl nicht eindeutig: ${liste}`,
  };
}

/** Geltend = grösste dateApplicability ≤ heute; `naechste` = früheste künftige (Staleness-TTL). */
export function waehleKonsolidierung(
  kons: Konsolidierung[],
  heute: string,
): { geltend: string | null; naechste: string | null; anzahl: number } {
  const sortiert = [...new Set(kons.map((c) => c.date))].sort();
  const bisHeute = sortiert.filter((d) => d <= heute);
  const kuenftig = sortiert.filter((d) => d > heute);
  return { geltend: bisHeute.length ? bisHeute[bisHeute.length - 1] : null, naechste: kuenftig[0] ?? null, anzahl: sortiert.length };
}

function pruefeSr(sr: string): void {
  if (!/^\d+(\.\d+)*$/.test(sr)) throw new Error(`SR-Nummer «${sr}» hat kein gültiges Format (Ziffern, Punkte)`);
}

export function abstractAbfrage(sr: string): string {
  pruefeSr(sr);
  return `${PREFIXE}
SELECT DISTINCT ?cc ?von ?bis WHERE {
  ?e skos:notation "${sr}"^^<${NOTATION_TYP}> .
  ?cc a jolux:ConsolidationAbstract ; jolux:classifiedByTaxonomyEntry ?e .
  OPTIONAL { ?cc jolux:dateEntryInForce ?von }
  OPTIONAL { ?cc jolux:dateNoLongerInForce ?bis }
} ORDER BY ?cc ?von ?bis`;
}

const konsRumpf = (eli: string): string => `{
  ?c jolux:isMemberOf <${ELI_BASIS}${eli}> ; jolux:dateApplicability ?date .
  OPTIONAL { ?c jolux:dateEndApplicability ?end }
}`;
export const konsAbfrage = (eli: string): string =>
  `${PREFIXE}\nSELECT DISTINCT ?date ?end WHERE ${konsRumpf(eli)} ORDER BY ?date ?end`;
/** Zähltor über DIESELBE DISTINCT-Projektion (nicht über eine andere, §6.7). */
export const konsZaehlAbfrage = (eli: string): string =>
  `${PREFIXE}\nSELECT (COUNT(*) AS ?n) WHERE { SELECT DISTINCT ?date ?end WHERE ${konsRumpf(eli)} }`;

/** Konsolidierungen eines Abstracts mit COUNT-Zähltor; frisches Paar je Anlauf. */
async function konsMitZaehltor(eli: string, fetchImpl: FetchImpl): Promise<Konsolidierung[]> {
  for (let versuch = 1; versuch <= MAX_ANLAEUFE; versuch += 1) {
    const zaehl = await sparqlSelect(konsZaehlAbfrage(eli), fetchImpl);
    const zeilen = await sparqlSelect(konsAbfrage(eli), fetchImpl);
    const soll = Number(zaehl[0]?.n?.value);
    if (Number.isFinite(soll) && soll === zeilen.length) {
      return zeilen
        .filter((z) => z.date)
        .map((z) => ({ date: isoTag(z.date.value), end: z.end ? isoTag(z.end.value) : null }));
    }
  }
  throw new Error(`Konsolidierungen von ${eli}: COUNT-Zähltor widerspricht der Zeilenliste (${MAX_ANLAEUFE} Anläufe) — stilles Teilergebnis des Endpoints`);
}

/** Löst EINE SR-Nummer auf. Wirft nur bei Netz-/Zähltor-Fehlern, alles Fachliche wird `ok:false`. */
export async function loeseSr(sr: string, heute: string, fetchImpl: FetchImpl = fetch): Promise<Aufloesung> {
  const kandidaten = gruppiereAbstracts(await sparqlSelect(abstractAbfrage(sr), fetchImpl));
  // Konsolidierungen nur für Kandidaten im Abstract-Fenster (meist genau einer).
  const konsMap = new Map<string, Konsolidierung[]>();
  for (const k of kandidaten.filter((c) => imAbstractFenster(c, heute))) {
    konsMap.set(k.eli, await konsMitZaehltor(k.eli, fetchImpl));
  }
  const wahl = waehleAbstract(kandidaten, heute, (eli) => konsMap.get(eli) ?? []);
  if (!wahl.ok) return { ok: false, sr, grund: wahl.grund };

  const k = waehleKonsolidierung(konsMap.get(wahl.eli) ?? [], heute);
  if (!k.geltend) return { ok: false, sr, grund: `ELI ${wahl.eli}, aber keine geltende Konsolidierung ≤ ${heute}` };

  const konsKompakt = k.geltend.replace(/-/g, '');
  const manifest = (await loeseHtmlManifeste([{ name: sr, eli: wahl.eli, konsKompakt }], fetchImpl)).get(sr);
  if (!manifest || manifest.n === null) {
    return { ok: false, sr, grund: `ELI ${wahl.eli} @ ${k.geltend}: keine kanonische html-Manifestation (isExemplifiedBy) — Pin von Hand klären` };
  }
  return { ok: true, sr, eli: wahl.eli, geltend: k.geltend, n: manifest.n, anzahl: k.anzahl, naechste: k.naechste };
}

/** Pin-Zeile im 6-Feld-Format von fedlex-cache.sh. */
export const pinZeile = (key: string, a: Extract<Aufloesung, { ok: true }>): string =>
  `  "${key.toLowerCase()}|${a.eli}|${a.geltend.replace(/-/g, '')}|${a.n}|art_1|${a.sr}"`;

function lokalesDatum(): string {
  const j = new Date();
  return `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, '0')}-${String(j.getDate()).padStart(2, '0')}`;
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const datumArg = args.find((a) => a.startsWith('--datum='));
  const heute = datumArg ? datumArg.slice('--datum='.length) : lokalesDatum();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(heute)) {
    console.error(`FEHLER: --datum=${heute} ist kein ISO-Datum (YYYY-MM-DD).`);
    process.exit(2);
  }
  const rest = args.filter((a) => !a.startsWith('--datum='));

  // SR-Liste: entweder direkt als Argumente, oder (--register) alle nur-live-link-Bund-Erlasse.
  let ziele: { sr: string; key: string }[];
  if (rest.length && !rest[0].startsWith('--')) {
    ziele = rest.map((sr) => ({ sr, key: sr }));
  } else {
    const { ERLASS_REGISTER } = await import('../src/lib/normtext/register.ts');
    ziele = (ERLASS_REGISTER as ReadonlyArray<{ ebene: string; status: string; sr: string; key: string }>)
      .filter((r) => r.ebene === 'bund' && r.status === 'nur-live-link')
      .map((r) => ({ sr: String(r.sr), key: r.key }));
  }

  const ok: string[] = [];
  const fehler: string[] = [];
  for (const z of ziele) {
    try {
      const r = await loeseSr(z.sr, heute);
      if (r.ok) ok.push(pinZeile(z.key, r));
      else fehler.push(`${z.key} (SR ${z.sr}): ${r.grund}`);
    } catch (e) {
      fehler.push(`${z.key} (SR ${z.sr}): ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\n# ${ok.length}/${ziele.length} aufgelöst (Stand ${heute}). Zeilen für scripts/fedlex-cache.sh:\n`);
  console.log(ok.join('\n'));
  if (fehler.length) {
    console.log(`\n# ${fehler.length} OFFEN (manuell prüfen):`);
    for (const f of fehler) console.log(`#   ${f}`);
    process.exitCode = 1;
  }
}

// Als CLI ausführen; beim Import aus dem Unit-Test (VITEST gesetzt) NICHT laufen.
if (!process.env.VITEST) void main();
