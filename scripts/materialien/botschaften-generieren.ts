/**
 * Paket 2 (FAHRPLAN-FEDLEX-PORTFOLIO §Paket 2, W2·6): generiert die «Entstehungs-
 * geschichte»-Botschaften des Bundesrats je Bund-Volltext-Erlass — automatisch über
 * den Fedlex-Gesetzgebungs-Projekt-Graphen (SPARQL, §7). Ausgabe:
 * src/lib/materialien/botschaften.generated.ts (NICHT von Hand editieren, NICHT aus
 * src/ importieren — reine Build-Zeit-Quelle, §15 Bundle).
 *
 * Reverse-Kette (POC 10.7.2026 live verifiziert, DSG→2 reproduziert, 401 Botschaften
 * über die 218 Volltext-Erlasse, Füllraten Datum 100 % / Titel DE·FR·IT 100 % /
 * Curia 99,8 %):
 *   ?tax skos:notation "<SR>"^^<…id-systematique>            # TYPISIERT (sonst Timeout)
 *   ?oc  jolux:classifiedByTaxonomyEntry ?tax ;
 *        jolux:legalResourceFamilyType <…resource-family/oc> # NICHT cc (consolidated)
 *   ?proj  jolux:hasResultingLegalResource ?oc ;
 *          jolux:draftHasLegislativeTask ?event             # DIREKTE Kante statt STRSTARTS
 *   ?event jolux:legislativeTaskHasResultingLegalResource ?botschaft .
 *   ?botschaft jolux:typeDocument <…resource-type/23> .     # «Botschaft des Bundesrates»
 * §0c-Falle vermieden: kein UNION (700-statt-alle), VALUES-Batching; kein STRSTARTS
 * (lexikalischer Präfix-Join = ~1,5 s/SR → mit draftHasLegislativeTask 260× schneller).
 *
 * §2/§0b Regel 5: reine parse-Funktion (baueBotschaften, injizierbar/testbar) getrennt
 * vom Fetch/Writer; --datum aus der Shell, kein Date.now.
 * Aufruf: npm run materialien:botschaften -- --datum=$(date +%F)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sparqlBatch, type SparqlBinding, type FetchImpl } from '../fedlex-sparql.ts';
import { ERLASS_REGISTER } from '../../src/lib/normtext/register.ts';
import type { VerfahrensEreignis } from '../../src/lib/materialien/verfahren.ts';
import { ereignisseJeBotschaft } from './verfahrens-ereignisse.ts';
import type { Rechtsgebiet } from '../../src/lib/normtext/register.ts';

const NOTATION_TYPE = '<https://fedlex.data.admin.ch/vocabulary/notation-type/id-systematique>';
const LANG = {
  de: '<http://publications.europa.eu/resource/authority/language/DEU>',
  fr: '<http://publications.europa.eu/resource/authority/language/FRA>',
  it: '<http://publications.europa.eu/resource/authority/language/ITA>',
};

/** Grundmenge: Bund-Volltext-Erlasse (register.json, ebene=bund & status=snapshot). */
export interface ErlassMeta { key: string; sr: string; rechtsgebiet: Rechtsgebiet; rang: number; }

export function grundmenge(): ErlassMeta[] {
  return ERLASS_REGISTER
    .filter((e) => e.ebene === 'bund' && e.status === 'snapshot' && e.sr)
    .map((e) => ({ key: e.key, sr: e.sr as string, rechtsgebiet: e.rechtsgebiet, rang: e.rang }))
    .sort((a, b) => (a.sr < b.sr ? -1 : a.sr > b.sr ? 1 : 0));
}

/** Ein generierter Botschafts-Eintrag (Feld-Namen = MaterialRegistereintrag-Erweiterung). */
export interface BotschaftEintrag {
  key: string;
  behoerde: 'BR';
  doktyp: 'botschaft';
  titel: string;        // DE (primär; = Zitat-Feld, nie umformuliert §1)
  titelFr?: string;
  titelIt?: string;
  nummer?: string;      // Curia-/Geschäftsnummer «17.059»
  rechtsgebiet: Rechtsgebiet;
  sprache: 'de';
  status: 'nur-live-link';
  quelleUrl: string;    // Fedlex-Live-Link (HTML), §7c
  stand: string;        // Botschafts-Datum ISO
  rang: number;         // Datum absteigend → jüngste zuerst
  normKeys: string[];   // SR-Join (Pfad A) ∪ Fedlex-Auswirkungen der ocUris (M-5, Mantelerlass → mehrere)
  hinweis?: string;
  /** M-7: amtliche BBl-Fundstelle der DE-Fassung («BBl 2006 1», Fedlex `jolux:historicalLegalId`). */
  fundstelle?: string;
  // ── Paket-5-Join (Finding 1, P0) + Moat-Hebel 2 ──
  projEli?: string;     // Projekt-Knoten (Gesetzgebungs-Graph-Anker)
  ocUris?: string[];    // die AS/oc-Erlasse dieses Projekts unter den normKeys-SR
  botschaftDate?: string; // = stand (redundant benannt für den Paket-5-Join)
  artAnker?: string[];  // grobe art_*-Zuordnung (Moat-Hebel 2; heute leer)
  // ── E1 «Entstehung am Artikel» (§11.4/§11.7) ──
  /** Verfahrenskette der Vorlage (type-projet-Ereignisse, je fga vereinigt — Kritik A12). */
  ereignisse?: VerfahrensEreignis[];
}

const PROVENIENZ = 'Automatisch über den Fedlex-Projekt-Graphen zugeordnet; maschinell, fachlich nicht geprüft.';

/** fga-URI → stabiler, URL-sicherer, rebuild-fester Key (Finding 9). BEWUSSTE Abweichung
 *  vom Spec-Format BOTSCHAFT-<KÜRZEL>-<CURIA>: der Kürzel leitet sich aus normKeys ab und
 *  wäre bei Mantelerlassen (mehrere normKeys) instabil/mehrdeutig → Paket-5-Links brächen
 *  still. Die fga-URI ist die intrinsische, dedupe-korrekte Identität der Botschaft. */
export function keyAusFga(fga: string): string {
  const m = /\/eli\/fga\/(\d+)\/([^/]+)$/.exec(fga);
  if (!m) throw new Error(`botschaften: unerwartete fga-URI ${fga}`);
  return `BOTSCHAFT-${m[1]}-${m[2]}`.replace(/[^A-Za-z0-9_-]/g, '_');
}

/** fga-URI → Fedlex-Live-Link (DE-Rendering). */
export function liveLink(fga: string): string {
  return fga.replace('https://fedlex.data.admin.ch', 'https://www.fedlex.admin.ch') + '/de';
}

/** Titel-Bereinigung: Fedlex-Titel können HTML tragen (CO<sub>2</sub>); die UI rendert Text. */
function titelText(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Fedlex `type-projet/200` = «Botschaft des Bundesrats» (amtliches Vokabular, TYPE_PROJET). */
/** Amtliche BBl-Fundstellen-Form (M-7). */
const BBL_FORM = /^BBl \d{4} \d+$/;

export const TYP_BOTSCHAFT = 'https://fedlex.data.admin.ch/vocabulary/type-projet/200';

/**
 * M-4 (W2·29-WERKBANK-LESER, 25.9.2026): Nur ein Verfahrens-Ereignis vom Typ 200
 * begründet die Kante Projekt → Botschaft. Live-Beleg (Fedlex-SPARQL 25.9.2026): proj/2005/1572
 * (Curia 04.054, Gentechfrei-Initiative) verweist mit event/4 type-projet/650 («Abgestimmt am»)
 * auf fga/2006/1 = die PatG-Botschaft BBl 2006 1 (echte Projekte proj/2005/2004…2009, Curia
 * 05.082, alle Typ 200). Ohne Filter gewann der kleinste proj (1572) → nummer 04.054, BV als
 * normKey, Curia-Link auf die Initiative. Bindungen OHNE evType (Alt-Roh, Tests) bleiben —
 * keine Aussage, kein Verwerfen (§8). Rein.
 */
export function filtereBotschaftsKanten(bindings: SparqlBinding[]): SparqlBinding[] {
  return bindings.filter((b) => !b.evType?.value || b.evType.value === TYP_BOTSCHAFT);
}

/**
 * REINE parse-Funktion (§2, testbar): SPARQL-Bindings + Grundmengen-Meta → deterministisch
 * sortierte Botschafts-Einträge. Dedupe über die fga-URI (eine Botschaft = ein Eintrag,
 * normKeys sammelt alle SR-Treffer = Mantelerlass-Feature). Kein Netz, kein Date.now.
 */
export function baueBotschaften(
  bindings: SparqlBinding[],
  meta: ErlassMeta[],
  ereignisseProProj?: Map<string, VerfahrensEreignis[]>,
  /** M-5: oc → Erlass-Keys aus den Fedlex-Auswirkungen (botschaften-auswirkungen.ts). Ergänzt
   *  normKeys um jeden Korpus-Erlass, den ein oc dieser Botschaft ändert; fehlt er, zählt
   *  allein die SR-Klassierung. Erreichbar bleiben nur Botschaften, deren oc unter einer
   *  Korpus-SR klassiert ist (Ausbau auf fremd klassierte oc: offen, Deckel-Entscheid). */
  auswirkungen?: ReadonlyMap<string, ReadonlySet<string>>,
): BotschaftEintrag[] {
  const srNachErlass = new Map<string, ErlassMeta>();
  const metaNachKey = new Map<string, ErlassMeta>();
  for (const m of meta) { srNachErlass.set(m.sr, m); metaNachKey.set(m.key, m); }

  interface Roh {
    fga: string; date: string;
    de?: string; fr?: string; it?: string; bbl?: string;
    normKeys: Set<string>; ocUris: Set<string>;
    /** proj-URI → Curia (parliamentDraftId) dieses Projekts. Eine Botschaft kann MEHREREN
     *  Projekt-Knoten zugeordnet sein (live belegt: fga/2016/467 → proj/2016/0065+0066);
     *  projEli/curia werden deterministisch aus dem kleinsten proj gewählt (§2), nie aus
     *  der bindungs-reihenfolge-abhängigen «ersten» Bindung. */
    projCuria: Map<string, string>;
  }
  const proBotschaft = new Map<string, Roh>();
  for (const b of filtereBotschaftsKanten(bindings)) {
    const fga = b.botschaft?.value;
    const sr = b.sr?.value;
    if (!fga) continue;
    if (!sr) continue;
    const erlass = srNachErlass.get(sr);
    if (!erlass) continue; // SR ausserhalb der Grundmenge → ignorieren
    let r = proBotschaft.get(fga);
    if (!r) {
      r = {
        fga, date: b.dateDoc?.value ?? '',
        de: b.titleDe?.value, fr: b.titleFr?.value, it: b.titleIt?.value,
        normKeys: new Set(), ocUris: new Set(), projCuria: new Map(),
      };
      proBotschaft.set(fga, r);
    }
    r.normKeys.add(erlass.key);
    if (b.oc?.value) r.ocUris.add(b.oc.value);
    if (b.proj?.value && !r.projCuria.has(b.proj.value)) r.projCuria.set(b.proj.value, b.curia?.value ?? '');
    // Skalare: Erst-Bindung gewinnt (pro fga konstant); nur füllen, was fehlt.
    if (!r.date && b.dateDoc?.value) r.date = b.dateDoc.value;
    if (!r.de && b.titleDe?.value) r.de = b.titleDe.value;
    if (!r.fr && b.titleFr?.value) r.fr = b.titleFr.value;
    if (!r.it && b.titleIt?.value) r.it = b.titleIt.value;
    // M-7: Fundstelle aus dcterms:identifier der DE-Expression (alle Jahrgänge; seit dem
    // digitalen BBl 2022 fehlt jolux:historicalLegalId, live 25.9.2026 fga/2025/3067/de),
    // sonst historicalLegalId. Nur die amtliche Form «BBl JJJJ S» — alles andere keine Aussage.
    for (const f of [b.bbl?.value, b.bblHist?.value]) {
      if (!r.bbl && f && BBL_FORM.test(f.trim())) r.bbl = f.trim();
    }
  }
  // M-5: Auswirkungen der ocUris ergänzen normKeys (nur Keys der Grundmenge).
  if (auswirkungen) {
    for (const r of proBotschaft.values()) {
      for (const oc of r.ocUris) for (const k of auswirkungen.get(oc) ?? []) if (metaNachKey.has(k)) r.normKeys.add(k);
    }
  }

  const out: BotschaftEintrag[] = [];
  for (const r of proBotschaft.values()) {
    if (!r.date) continue; // ohne Datum kein ehrlicher «stand» → auslassen (Log via CLI)
    const normKeys = [...r.normKeys].sort();
    // Primärer normKey = kleinster rang (Prominenz), Tiebreak key → rechtsgebiet erben (§2, nicht raten).
    const primaer = normKeys
      .map((k) => metaNachKey.get(k))
      .filter((m): m is ErlassMeta => !!m)
      .sort((a, b) => a.rang - b.rang || (a.key < b.key ? -1 : 1))[0];
    const titelDe = r.de ? titelText(r.de) : '';
    const titelFr = r.fr ? titelText(r.fr) : undefined;
    const titelIt = r.it ? titelText(r.it) : undefined;
    if (!titelDe) continue; // ohne amtlichen Titel kein Eintrag (Log via CLI)
    const iso = r.date.slice(0, 10);
    const rang = 100000000 - Number(iso.replace(/-/g, '')); // jüngste zuerst (kleinster rang)
    // Deterministisch: kleinster proj-URI → projEli; dessen Curia (konsistent, §2).
    const projEli = [...r.projCuria.keys()].sort()[0];
    const curia = projEli ? (r.projCuria.get(projEli) || undefined) : undefined;
    out.push({
      key: keyAusFga(r.fga),
      behoerde: 'BR',
      doktyp: 'botschaft',
      titel: titelDe,
      titelFr,
      titelIt,
      nummer: curia,
      rechtsgebiet: primaer?.rechtsgebiet ?? 'privat',
      sprache: 'de',
      status: 'nur-live-link',
      quelleUrl: liveLink(r.fga),
      stand: iso,
      rang,
      normKeys,
      hinweis: PROVENIENZ,
      fundstelle: r.bbl,
      projEli: projEli || undefined,
      ocUris: r.ocUris.size ? [...r.ocUris].sort() : undefined,
      botschaftDate: iso,
      artAnker: undefined,
      ereignisse: ereignisseProProj
        ? (() => { const ev = ereignisseJeBotschaft([...r.projCuria.keys()], ereignisseProProj); return ev.length ? ev : undefined; })()
        : undefined,
    });
  }
  // Deterministische Gesamtsortierung: Datum absteigend → key (byte-stabil).
  out.sort((a, b) => (a.stand < b.stand ? 1 : a.stand > b.stand ? -1 : (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)));
  return out;
}

/** sha256 über die Identitätsfelder inkl. normKeys (Drift-/Currency-Token, §7d).
 *
 * TODO(H-5/B2, Fahrplan-Anker): heute 0 Aufrufer (check-botschaften-netz vergleicht bewusst
 * über intrinsischeSig, s. dort), BEWUSST behalten — FAHRPLAN-FEDLEX-PORTFOLIO §Paket 2
 * spezifiziert `sha` als Drift-/Currency-Token je Botschaft, und die E6b-Zieltabelle
 * `soft_law` (FAHRPLAN-DATENHALTUNG §3) trägt die Spalte `sha`; dieser Hash ist der
 * designierte Befüller beim Soft-Law-Ingest. Negativ-Check H-5 12.7.2026: kein Konsument. */
export function shaBotschaft(e: BotschaftEintrag): string {
  const norm = [
    e.key, e.behoerde, e.doktyp, e.titel, e.titelFr ?? '', e.titelIt ?? '', e.nummer ?? '',
    e.rechtsgebiet, e.status, e.quelleUrl, e.stand, e.normKeys.join(','),
    e.projEli ?? '', (e.ocUris ?? []).join(','),
    // E1: die Verfahrenskette gehört zur Identität — sonst bliebe ein neuer
    // Verfahrensschritt (Beschluss, Referendumsfrist) drift-unsichtbar.
    (e.ereignisse ?? []).map((v) => `${v.code}:${v.datum ?? ''}:${v.res ?? ''}`).join(','),
  ].join('');
  return createHash('sha256').update(norm, 'utf8').digest('hex');
}

// ── SPARQL-Query (eine VALUES-Batch) ────────────────────────────────────────────
/** Kettenrumpf ab ?oc: Projekt → Ereignis → Botschaft + Felder.
 *  `?evType` (M-4) und `?bbl` (M-7) OPTIONAL — gefiltert wird im reinen Parser (testbar). */
function kettenRumpf(): string {
  return `  ?proj jolux:hasResultingLegalResource ?oc ; jolux:draftHasLegislativeTask ?event .
  ?event jolux:legislativeTaskHasResultingLegalResource ?botschaft .
  ?botschaft jolux:typeDocument <https://fedlex.data.admin.ch/vocabulary/resource-type/23> .
  OPTIONAL { ?event jolux:legislativeTaskType ?evType . }
  OPTIONAL { ?botschaft jolux:dateDocument ?dateDoc . }
  OPTIONAL { ?proj jolux:parliamentDraftId ?curia . }
  OPTIONAL { ?botschaft jolux:isRealizedBy ?ede . ?ede jolux:language ${LANG.de} ; jolux:title ?titleDe . }
  OPTIONAL { ?botschaft jolux:isRealizedBy ?efr . ?efr jolux:language ${LANG.fr} ; jolux:title ?titleFr . }
  OPTIONAL { ?botschaft jolux:isRealizedBy ?eit . ?eit jolux:language ${LANG.it} ; jolux:title ?titleIt . }
  OPTIONAL { ?botschaft jolux:isRealizedBy ?ebb . ?ebb jolux:language ${LANG.de} ; <http://purl.org/dc/terms/identifier> ?bbl . }
  OPTIONAL { ?botschaft jolux:isRealizedBy ?ebh . ?ebh jolux:language ${LANG.de} ; jolux:historicalLegalId ?bblHist . }`;
}

/** SR (VALUES ?notation) → klassierte oc → Kette. */
export function baueQuery(valuesInline: string): string {
  return `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?sr ?botschaft ?proj ?oc ?evType ?dateDoc ?curia ?titleDe ?titleFr ?titleIt ?bbl ?bblHist WHERE {
  VALUES ?notation { ${valuesInline} }
  ?tax skos:notation ?notation . BIND(STR(?notation) AS ?sr)
  ?oc jolux:classifiedByTaxonomyEntry ?tax ; jolux:legalResourceFamilyType <https://fedlex.data.admin.ch/vocabulary/resource-family/oc> .
${kettenRumpf()}
}`;
}


/**
 * Deterministische Ordnung der Roh-Bindings je SR (Befund (f), QS-MONITOR-ROT, 1.9.2026): der
 * SPARQL-Endpunkt liefert ohne ORDER BY in wechselnder Reihenfolge — vier Roh-Dateien
 * (172.010 · 812.121 · 831.10 · 836.2) wurden am 30.8. und erneut am 1.9.2026 bei
 * unverändertem Inhalt umsortiert (multiset-identisch, `comm`-/JSON-Beweis). Ein ORDER BY in
 * der Query wäre die andere Stelle; hier liegt sie am Schreibpunkt und deckt jede Query.
 * Schlüssel = kanonisches JSON des Bindings (Schlüssel sortiert) — vollständig, kein Feld-Tupel,
 * das bei Duplikaten kippen könnte. Rein.
 */
export function sortiereBindings(bs: SparqlBinding[]): SparqlBinding[] {
  const kanon = (b: SparqlBinding): string =>
    JSON.stringify(Object.fromEntries(Object.entries(b).sort(([a], [c]) => (a < c ? -1 : a > c ? 1 : 0))));
  return [...bs].sort((x, y) => { const a = kanon(x); const b = kanon(y); return a < b ? -1 : a > b ? 1 : 0; });
}

/** Holt die Bindings für die gesamte Grundmenge (VALUES-Batching, §0c; store-raw je SR). */
export async function holeBindings(
  meta: ErlassMeta[],
  fetchImpl: FetchImpl = fetch,
  rawDir?: string,
): Promise<SparqlBinding[]> {
  const werte = meta.map((m) => `"${m.sr}"^^${NOTATION_TYPE}`);
  const bindings = await sparqlBatch(werte, baueQuery, { batchGroesse: 55, fetchImpl });
  if (rawDir) {
    // store-raw je SR (§11): Bindings nach SR gruppiert deterministisch ablegen → Re-Parse ohne Re-Crawl.
    mkdirSync(rawDir, { recursive: true });
    const proSr = new Map<string, SparqlBinding[]>();
    for (const m of meta) proSr.set(m.sr, []);
    for (const b of bindings) {
      const sr = b.sr?.value;
      if (sr && proSr.has(sr)) proSr.get(sr)!.push(b);
    }
    for (const [sr, bs] of proSr) {
      const datei = `${rawDir}/${sr.replace(/[^0-9.]/g, '_')}.json`;
      writeFileSync(datei, JSON.stringify(sortiereBindings(bs), null, 2) + '\n', 'utf8');
    }
  }
  return bindings;
}

/** Serialisiert die Einträge als generiertes TS-Modul (byte-deterministisch). */
export function serialisiere(eintraege: BotschaftEintrag[]): string {
  const esc = (s: string) => JSON.stringify(s);
  const zeilen = eintraege.map((e) => {
    const felder: string[] = [
      `key: ${esc(e.key)}`,
      `behoerde: 'BR'`,
      `doktyp: 'botschaft'`,
      `titel: ${esc(e.titel)}`,
    ];
    if (e.titelFr) felder.push(`titelFr: ${esc(e.titelFr)}`);
    if (e.titelIt) felder.push(`titelIt: ${esc(e.titelIt)}`);
    if (e.nummer) felder.push(`nummer: ${esc(e.nummer)}`);
    felder.push(`rechtsgebiet: ${esc(e.rechtsgebiet)}`);
    felder.push(`sprache: 'de'`);
    felder.push(`status: 'nur-live-link'`);
    felder.push(`quelleUrl: ${esc(e.quelleUrl)}`);
    felder.push(`stand: ${esc(e.stand)}`);
    felder.push(`rang: ${e.rang}`);
    felder.push(`normKeys: [${e.normKeys.map(esc).join(', ')}]`);
    if (e.hinweis) felder.push(`hinweis: ${esc(e.hinweis)}`);
    if (e.fundstelle) felder.push(`fundstelle: ${esc(e.fundstelle)}`);
    if (e.projEli) felder.push(`projEli: ${esc(e.projEli)}`);
    if (e.ocUris) felder.push(`ocUris: [${e.ocUris.map(esc).join(', ')}]`);
    if (e.botschaftDate) felder.push(`botschaftDate: ${esc(e.botschaftDate)}`);
    if (e.ereignisse?.length) {
      const ev = e.ereignisse.map((v) => {
        const f = [`code: ${v.code}`];
        if (v.datum) f.push(`datum: ${esc(v.datum)}`);
        if (v.res) f.push(`res: ${esc(v.res)}`);
        return `{ ${f.join(', ')} }`;
      });
      felder.push(`ereignisse: [${ev.join(', ')}]`);
    }
    return `  { ${felder.join(', ')} },`;
  });
  return `// AUTO-GENERIERT von scripts/materialien/botschaften-generieren.ts — NICHT von Hand editieren.
// NICHT aus src/ importieren (Bundle §15) — reine Build-Zeit-Quelle für die register.json-Projektion.
// Botschaften des Bundesrates je Bund-Volltext-Erlass (Fedlex-Projekt-Graph, §7).
// Regenerieren: npm run materialien:botschaften -- --datum=$(date +%F)
import type { MaterialRegistereintrag } from './typen';

export const BOTSCHAFTEN: MaterialRegistereintrag[] = [
${zeilen.join('\n')}
];
`;
}

// CLI-Runner: scripts/materialien/botschaften-generieren-run.ts (dünner Fetch/Write-Teil,
// getrennt vom seiteneffektfreien Modul — Repo-Muster soft-law-projektion(-run)).
