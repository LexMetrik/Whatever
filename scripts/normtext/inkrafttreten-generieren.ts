// ─── V2 / K-1 · «in Kraft seit» — Ur-Inkrafttreten (Netz-Generator) ──────────
//
// Die Meta-Zeile im Gesetzes-Reader nennt neben «Stand» (Konsolidierungsdatum)
// künftig auch «in Kraft seit» — das URSPRÜNGLICHE Inkrafttreten des Erlasses
// (David 10.7.2026: «der kopf des gesetzes nützlicher»). Dieser Generator
// ermittelt je Bund-Snapshot-Erlass das Ur-Inkrafttreten und schreibt es als
// Sidecar public/normtext/inkrafttreten.json ({key:{datum,quelle}}).
// browse-manifest.ts projiziert es offline in register.json →
// BrowseErlass.inkraftSeit (synchron beim Header-Render ⇒ CLS 0, §15/2).
//
//   npm run gen:inkrafttreten -- --datum=$(date +%F)         (Netz, manuell)
//
// Quelle (ausschliesslich amtlich, §7 — POC 12.7.2026 live an OR/ZGB/BV/DSG/AHVG
// verifiziert, alle famos-belegten Ur-Daten getroffen: OR/ZGB 1912-01-01,
// BV 2000-01-01, nDSG 2023-09-01, AHVG 1948-01-01):
//   · Bund — Fedlex-SPARQL `jolux:dateEntryInForce` am ABSTRACT-ELI (cc) selbst.
//     Das Abstract trägt EIN kanonisches Ur-Inkrafttreten des Erlasses (nicht der
//     Konsolidierung; `dateApplicability` ist der Konsolidierungs-Stand = «Stand»).
//     Bewusst NICHT die früheste `dateEntryInForce` aus den Paket-5-Revisionen:
//     die listet über die SR-Taxonomie auch VORGÄNGER-Erlasse (z. B. ADOV → 1973er
//     «Verordnung über die Adoptionsvermittlung»), deren frühestes Datum ≠ dem
//     Ur-Inkrafttreten des HEUTIGEN Erlasses ist (Warnung Auftrag; empirisch belegt).
//
//   · Kanton — LexWork trägt strukturell KEIN vom Beschluss-/Versionsdatum
//     unterscheidbares Ur-Inkrafttreten (`enactment` = Beschlussdatum wie «vom …»;
//     `version_dates_str` = In-Kraft der aktuellen VERSION = unser «Stand»). Ein
//     davon abgeleitetes «in Kraft seit» wäre entweder falsch (Beschluss ≠ Kraft)
//     oder eine Dublette zu «Stand». Darum §8: Kanton ehrlich WEGLASSEN, kein Feld.
//
// §8-Ehrlichkeit: Wo kein eindeutiges amtliches Ur-Inkrafttreten (genau EIN Datum)
// ermittelbar ist, trägt der Eintrag KEIN `datum` → die Meta-Zeile zeigt nichts
// (nie ein geratenes oder mehrdeutiges Datum).
//
// GESTAFFELTES INKRAFTTRETEN (W2·27-BUND-FERTIG, 2.10.2026): die frühere Hoffnung,
// «Teil-Inkrafttreten» zeige sich als MEHRERE `dateEntryInForce` am Abstract, hat
// sich nicht bestätigt (gemessen 2.10.2026: alle 231 Bund-Erlasse tragen genau EIN
// Datum — auch SVG, FINMAG, KVG, MWSTG, die faktisch gestaffelt in Kraft traten).
// Das Feld `gestaffelt` (+ `gestaffeltGrund[]`) ist darum ein EIGENES Kennzeichen
// mit vier Signalen (Belege je Signal bei den Funktionen unten). Ein Erlass mit
// `gestaffelt: true` zeigt nie «Erlass in Kraft seit <Ur-Datum>» als Auskunft für
// einen einzelnen Artikel — das Ur-Datum gilt dort nur für einen Teil der Artikel.
// FAIL-CLOSED: nicht abrufbare/leere Zeitleiste oder fehlendes Ur-Datum ⇒
// `gestaffelt: true`, Grund `unbekannt` (nie «nicht gestaffelt» aus Unwissen).
// §2/§0b: reine Erhebe-Funktion (deterministisch, injizierbare fetchImpl), getrennt
// vom Schreiben; kein Date.now() in der Erhebung.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sparqlBatch, sparqlSelect, type FetchImpl } from '../fedlex-sparql.ts';

/** Abstract-ELI aus register.quelleUrl (…/eli/cc/…/de → cc/…). null = kein cc-ELI. */
function abstraktEli(quelleUrl: string): string | null {
  const m = quelleUrl.match(/\/eli\/(cc\/[^?#]+?)(?:\/(?:de|fr|it))?$/);
  return m ? m[1] : null;
}

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER_JSON = resolve(wurzel, 'public/normtext/register.json');
const INKRAFT_JSON = resolve(wurzel, 'public/normtext/inkrafttreten.json');

export type Inkrafttreten = { datum: string; quelle: 'fedlex' };
export type InkrafttretenMap = Record<string, Inkrafttreten>;

/** Gründe, aus denen ein Erlass als gestaffelt in Kraft getreten gilt (Union der Signale). */
export type StaffelGrund =
  | 'fedlex-zeitleiste'
  | 'wortlaut-hauptklausel'
  | 'fussnote-teildatum'
  | 'fussnote-inkraftsetzungs-v'
  | 'unbekannt';
export type Staffelung = { gestaffelt: boolean; gestaffeltGrund: StaffelGrund[] };
/** Eintrag der Sidecar-Datei: `datum` fehlt, wenn kein EINDEUTIGES Ur-Datum vorliegt (§8). */
export type InkrafttretenEintrag = { datum?: string; quelle: 'fedlex' } & Staffelung;

export type ErlassBasis = {
  key: string; sr: string | null; ebene: string; status: string; quelleUrl: string;
};

/** SPARQL: je abstract-ELI das Ur-Inkrafttreten (`dateEntryInForce`) des Erlasses. */
function baueBundQuery(valuesInline: string): string {
  return `
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?abstract ?dateForce WHERE {
  VALUES ?abstract { ${valuesInline} }
  ?abstract jolux:dateEntryInForce ?dateForce .
}`;
}

/**
 * Reine Erhebung der Bund-Ur-Inkrafttreten (deterministisch, testbar). Je Erlass
 * das Datum, wenn das Abstract GENAU EIN `dateEntryInForce` trägt; bei null oder
 * mehreren (Teil-Inkrafttreten) → `ohne` (§8, keine Anzeige, konservativ §7).
 */
export async function bundInkrafttreten(
  bund: ErlassBasis[], fetchImpl: FetchImpl,
): Promise<{ map: InkrafttretenMap; ohne: string[] }> {
  const perEli = new Map<string, ErlassBasis>();
  const werte: string[] = [];
  for (const e of bund) {
    const eli = abstraktEli(e.quelleUrl);
    if (!eli) continue;
    perEli.set(eli, e);
    werte.push(`<https://fedlex.data.admin.ch/eli/${eli}>`);
  }
  const bindings = werte.length ? await sparqlBatch(werte, baueBundQuery, { fetchImpl }) : [];

  // eli → Menge distinkter Ur-Inkrafttreten-Daten (Mehrdeutigkeit = Teil-Inkrafttreten).
  const proEli = new Map<string, Set<string>>();
  for (const b of bindings) {
    if (!b.abstract || !b.dateForce) continue;
    const eli = b.abstract.value.replace('https://fedlex.data.admin.ch/eli/', '');
    const datum = b.dateForce.value.slice(0, 10);
    const menge = proEli.get(eli) ?? new Set<string>();
    menge.add(datum);
    proEli.set(eli, menge);
  }

  const map: InkrafttretenMap = {};
  const ohne: string[] = [];
  for (const [eli, e] of perEli) {
    const daten = proEli.get(eli);
    if (!daten || daten.size !== 1) { ohne.push(e.key); continue; }
    map[e.key] = { datum: [...daten][0], quelle: 'fedlex' };
  }
  return { map, ohne };
}

// ─── Signal D — Fedlex-Zeitleiste ────────────────────────────────────────────
//
// Beleg (live 2.10.2026, SPARQL `jolux:isMemberOf <Abstract>` + `dateApplicability`):
// SVG (Ur-Datum 1959-10-01) hat Konsolidierungen 1959-08-25, 1959-10-01, 1959-11-20,
// 1960-01-01 — die ERSTE liegt VOR dem Ur-Datum, weil einzelne Teile früher in Kraft
// traten; FINMAG (Ur 2009-01-01) beginnt 2008-02-01. OR (1912-01-01), ZPO
// (2011-01-01), BV (2000-01-01) beginnen am Ur-Datum ⇒ nicht gestaffelt.

/** SPARQL: je Abstract die früheste Konsolidierung (Zeitleisten-Beginn). */
function baueZeitleisteQuery(valuesInline: string): string {
  return `
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?abstract (MIN(?d) AS ?erste) WHERE {
  VALUES ?abstract { ${valuesInline} }
  ?cons jolux:isMemberOf ?abstract ; jolux:dateApplicability ?d .
} GROUP BY ?abstract`;
}

/**
 * Früheste Konsolidierung je Abstract-ELI (`cc/…`). Fail-closed: Ein fehlgeschlagener
 * Batch (Netz/HTTP/HTML-Fehlerseite) lässt seine ELI UNBELEGT (fehlen in der Map),
 * er wirft nicht — der Aufrufer wertet «unbelegt» als gestaffelt/unbekannt.
 */
export async function zeitleisteBeginn(
  elis: string[], fetchImpl: FetchImpl, batchGroesse = 60,
): Promise<Map<string, string>> {
  const beginn = new Map<string, string>();
  for (let i = 0; i < elis.length; i += batchGroesse) {
    const werte = elis.slice(i, i + batchGroesse).map((e) => `<https://fedlex.data.admin.ch/eli/${e}>`);
    try {
      const bindings = await sparqlSelect(baueZeitleisteQuery(werte.join(' ')), fetchImpl);
      for (const b of bindings) {
        if (!b.abstract || !b.erste) continue;
        beginn.set(b.abstract.value.replace('https://fedlex.data.admin.ch/eli/', ''), b.erste.value.slice(0, 10));
      }
    } catch { /* fail-closed: ELI bleibt unbelegt */ }
  }
  return beginn;
}

// ─── Signale aus dem Normtext (Wortlaut + Fussnoten) ─────────────────────────
//
// Nur Artikel des HAUPTTEXTS zählen (keine `disp_*`-Schlusstitel-Zeilen und keine
// `annex_*`): `disp_*` trägt die Inkrafttretens-Klauseln VERGANGENER Revisionen
// (OR `disp_u2_art_4` «Inkrafttreten», ZGB `disp_u1_art_9_g`), nicht die des
// Erlasses. «Inkrafttretens-Artikel» = Hauptklausel im Text ODER Randtitel
// «Inkraft…» (Struktur-Sidecar `marginalie`).

export type ArtikelSicht = {
  id: string;            // Token/Schlüssel (`107`, `116`, `disp_u1_art_47`, `annex_u1`)
  marginalie: string[];
  text: string;          // alle Absätze + Listenpunkte, durch Leerzeichen verbunden
  fussnoten: string[];   // Fussnotentexte (HTML-Tags entfernt)
};

const HAUPTTEXT = /^(?!disp_|annex)/;

/** Satzweise (grosser Folgebuchstabe) — «Art. 3», «Abs. 2» und Datumsangaben
 *  («am 1. Januar 2010») trennen nicht: ein Punkt nach einer Ziffer ist kein Satzende. */
function saetze(text: string): string[] {
  return text.split(/(?<=[^0-9.][.]|[;:])\s+(?=[A-ZÄÖÜ])/);
}

/** Subjekt = der Erlass selbst («Dieses Gesetz», «Diese Verordnung», «Es», «Sie»). */
const SUBJEKT_ERLASS =
  /^(?:Dieses?|Diese[rn]?)\s+(?:[\wäöüÄÖÜ.\-]+\s+){0,3}?(?:Gesetz|Verordnung|Abkommen|Übereinkommen|Beschluss|Reglement|Ordnung|Konkordat|Protokoll|Statut|Vertrag|Gesetzbuch|Verfassung|Bundesgesetz|Erlass)\b|^(?:Es|Sie)\s/;

/** Hauptklausel: «Dieses Gesetz tritt … in Kraft» / «Der Bundesrat setzt … in Kraft». */
function istHauptklauselSatz(satz: string): boolean {
  const kraft = /\b(?:tritt|treten)\b.{0,240}?\bin Kraft\b/.test(satz);
  return (SUBJEKT_ERLASS.test(satz) && kraft)
    || /^Der Bundesrat (?:setzt|bestimmt)\b.{0,120}?\b(?:in Kraft|Inkrafttreten|Zeitpunkt)\b/.test(satz);
}

/**
 * Signal b2 — Wortlaut: die Inkrafttretens-Hauptklausel nennt selbst einen Vorbehalt
 * oder eine Ausnahme («unter Vorbehalt von Absatz 3», «mit Ausnahme von Artikel N»,
 * «einzelne Teile …»). Belege (Bund, Text-Shard `public/normtext/bund/*.json`):
 * MWSTG Art. 116 «Es tritt unter Vorbehalt von Absatz 3 am 1. Januar 2010 in Kraft»
 * (§-Satz mit «in Kraft» UND Vorbehalt/Ausnahme im SELBEN Satz).
 * NICHT Signal: «Der Bundesrat bestimmt das Inkrafttreten» allein (ZPO Art. 408).
 */
const VORBEHALT_AUSNAHME =
  /\bunter Vorbehalt\b|\bvorbehältlich\b|\bmit Ausnahme\b|\bausgenommen\b|\beinzelne[rn]?\s+(?:Teile|Bestimmungen|Artikel|Absätze)\b/i;

export function hatWortlautHauptklausel(artikel: ArtikelSicht[]): boolean {
  return artikel.some((a) => HAUPTTEXT.test(a.id)
    && saetze(a.text).some((s) => /\bin Kraft\b/.test(s) && VORBEHALT_AUSNAHME.test(s)
      && (SUBJEKT_ERLASS.test(s) || /^Der Bundesrat /.test(s))));
}

/** Gehört der Artikel zur Inkrafttretens-Bestimmung des Erlasses? */
function istInkrafttretensArtikel(a: ArtikelSicht): boolean {
  if (!HAUPTTEXT.test(a.id)) return false;
  return a.marginalie.some((m) => /Inkraft/i.test(m)) || saetze(a.text).some(istHauptklauselSatz);
}

/**
 * Signal a — Fussnote an der Inkrafttretens-Bestimmung nennt ein Teil-Datum
 * («Die Art. 9, … traten am 1. Aug. 1947 in Kraft», AHVG Fn 472;
 * «Art. 78 Abs. 4 tritt am 1. Jan. 2012 in Kraft», MWSTG Fn 225).
 * `in Kraft seit …` (Fassungs-Vermerke, ohne tritt/traten) zählt NICHT.
 */
const FUSSNOTE_TEILDATUM = /\b(?:tritt|treten|traten|trat)\b.{0,200}?\bin Kraft\b/;

/**
 * Signal a2 — Fussnote verweist auf eine Inkraftsetzungs-Verordnung («V vom 6. Nov.
 * 2019 über die abschliessende Inkraftsetzung des FIDLEG», FIDLEG Fn 53 am Art. 96;
 * «Art. 1 der V vom 12. April 1995 über die Inkraftsetzung …», KVG Fn 385/386;
 * «Siehe auch Art. 2 der V vom 20. Sept. 1982 über die Inkraftsetzung …», UVG
 * Art. 68/70/72/75/92: einzelne Artikel traten durch die Inkraftsetzungs-V früher in
 * Kraft). Gilt für ALLE Hauptteil-Artikel, nicht nur den Inkrafttretens-Artikel.
 * Verankert am Fussnoten-ANFANG: Änderungs-Vermerke («Fassung gemäss Art. 2 der V …
 * über die Inkraftsetzung des BGG», VGG Art. 4) beginnen mit «Fassung/Eingefügt/
 * Aufgehoben» und zählen NICHT (sie belegen eine Revision, kein Erst-Inkrafttreten).
 */
const FUSSNOTE_INKRAFTSETZUNG =
  /^(?:Siehe auch\s+)?(?:Art\.\s*[\w, ]+?(?:\s+bzw\.\s+\d+)?\s+der\s+)?V\b.{0,160}?\bInkraftsetzung\b/;

export function fussnoteGruende(artikel: ArtikelSicht[]): StaffelGrund[] {
  const gruende: StaffelGrund[] = [];
  const fnKlausel = artikel.filter(istInkrafttretensArtikel).flatMap((a) => a.fussnoten);
  if (fnKlausel.some((t) => FUSSNOTE_TEILDATUM.test(t))) gruende.push('fussnote-teildatum');
  const fnAlle = artikel.filter((a) => HAUPTTEXT.test(a.id)).flatMap((a) => a.fussnoten);
  if (fnAlle.some((t) => FUSSNOTE_INKRAFTSETZUNG.test(t))) gruende.push('fussnote-inkraftsetzungs-v');
  return gruende;
}

/** Reine Auswertung: Staffel-Entscheid je Erlass (Zeitleiste + Wortlaut + Fussnoten). */
export function staffelEntscheid(i: {
  urDatum: string | null;        // eindeutiges dateEntryInForce oder null
  zeitleisteErste: string | null; // früheste Konsolidierung oder null (unbelegt)
  artikel: ArtikelSicht[] | null; // null = Normtext nicht lesbar
}): Staffelung {
  const gruende: StaffelGrund[] = [];
  let unbekannt = false;
  if (i.urDatum === null || i.zeitleisteErste === null) unbekannt = true;
  else if (i.zeitleisteErste < i.urDatum) gruende.push('fedlex-zeitleiste');
  if (i.artikel === null) unbekannt = true;
  else {
    if (hatWortlautHauptklausel(i.artikel)) gruende.push('wortlaut-hauptklausel');
    gruende.push(...fussnoteGruende(i.artikel));
  }
  // Fail-closed: «unbekannt» nur, wenn KEIN positives Signal den Erlass schon als
  // gestaffelt ausweist (die Gründe bleiben dann sachlich, nicht Unwissen).
  if (unbekannt && gruende.length === 0) gruende.push('unbekannt');
  return { gestaffelt: gruende.length > 0, gestaffeltGrund: gruende };
}

const tags = (s: string) => s.replace(/<[^>]*>/g, '');
type Block = { text?: string; items?: { text?: string }[] };

/** Liest Text-Shard + Struktur-Sidecar eines Bund-Erlasses; null bei Lesefehler (fail-closed). */
export function ladeArtikelSichten(key: string, normtextDir = resolve(wurzel, 'public/normtext')): ArtikelSicht[] | null {
  try {
    const shard = JSON.parse(readFileSync(resolve(normtextDir, 'bund', `${key}.json`), 'utf8')) as
      { eintraege: { artikel: string; bloecke: Block[] }[] };
    const struktur = JSON.parse(readFileSync(resolve(normtextDir, 'struktur/bund', `${key}.json`), 'utf8')) as
      { artikel: Record<string, { marginalie?: string[]; fussnoten?: { text: string }[] }> };
    return shard.eintraege.map((e) => {
      const s = struktur.artikel[e.artikel];
      return {
        id: e.artikel,
        marginalie: s?.marginalie ?? [],
        text: e.bloecke.map((b) => [b.text ?? '', ...(b.items ?? []).map((i) => i.text ?? '')].join(' ')).join(' '),
        fussnoten: (s?.fussnoten ?? []).map((f) => tags(f.text)),
      };
    });
  } catch { return null; }
}

/** Staffelung aller Bund-Erlasse (Zeitleiste per SPARQL, Rest aus den lokalen Shards). */
export async function bundStaffelung(
  bund: ErlassBasis[], urDaten: InkrafttretenMap, fetchImpl: FetchImpl,
  ladeArtikel: (key: string) => ArtikelSicht[] | null = ladeArtikelSichten,
): Promise<Record<string, Staffelung>> {
  const elis = [...new Set(bund.map((e) => abstraktEli(e.quelleUrl)).filter((x): x is string => x !== null))];
  const beginn = elis.length ? await zeitleisteBeginn(elis, fetchImpl) : new Map<string, string>();
  const out: Record<string, Staffelung> = {};
  for (const e of bund) {
    const eli = abstraktEli(e.quelleUrl);
    out[e.key] = staffelEntscheid({
      urDatum: urDaten[e.key]?.datum ?? null,
      zeitleisteErste: eli ? beginn.get(eli) ?? null : null,
      artikel: ladeArtikel(e.key),
    });
  }
  return out;
}

/** Eintrag je Erlass: Ur-Datum (wenn eindeutig) + Staffelung — JEDER Erlass trägt `gestaffelt`. */
export function inkraftEintraege(
  bund: ErlassBasis[], urDaten: InkrafttretenMap, staffel: Record<string, Staffelung>,
): Record<string, InkrafttretenEintrag> {
  const map: Record<string, InkrafttretenEintrag> = {};
  for (const e of bund) {
    const st = staffel[e.key] ?? { gestaffelt: true, gestaffeltGrund: ['unbekannt' as const] };
    map[e.key] = { ...(urDaten[e.key] ?? { quelle: 'fedlex' as const }), ...st };
  }
  return map;
}

/** inkrafttreten.json: Schlüssel sortiert, deterministisch (2-Space + Trailing-Newline). */
export function inkrafttretenJson(map: Record<string, Inkrafttreten | InkrafttretenEintrag>): string {
  const sortiert: Record<string, Inkrafttreten | InkrafttretenEintrag> = {};
  for (const key of Object.keys(map).sort()) sortiert[key] = map[key];
  return JSON.stringify(sortiert, null, 2) + '\n';
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function heute(): string {
  const j = new Date();
  return `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, '0')}-${String(j.getDate()).padStart(2, '0')}`;
}

async function main() {
  const erlasse = (JSON.parse(readFileSync(REGISTER_JSON, 'utf8')) as { erlasse: ErlassBasis[] }).erlasse;
  const bund = erlasse.filter((e) => e.status === 'snapshot' && e.quelleUrl && e.ebene === 'bund' && e.sr);

  const { map, ohne } = await bundInkrafttreten(bund, fetch);
  const staffel = await bundStaffelung(bund, map, fetch);
  const eintraege = inkraftEintraege(bund, map, staffel);
  writeFileSync(INKRAFT_JSON, inkrafttretenJson(eintraege), 'utf8');
  console.log(`Bund: ${Object.keys(map).length}/${bund.length} Ur-Inkrafttreten; ${ohne.length} ohne/mehrdeutig: ${ohne.join(', ') || '—'}`);
  const gest = Object.entries(staffel).filter(([, v]) => v.gestaffelt);
  console.log(`Gestaffelt: ${gest.length}/${bund.length}`);
  for (const [k, v] of gest) console.log(`  ${k}: ${v.gestaffeltGrund.join(', ')}`);
  console.log(`Kanton: bewusst 0 (LexWork trägt kein strukturelles Ur-Inkrafttreten, §8).`);
  console.log(`\n${Object.keys(eintraege).length} Einträge → public/normtext/inkrafttreten.json (Lauf ${heute()}).`);
  console.log('Nachlauf: `npm run normtext:register` (Projektion → register.json), `npm run datenhaltung:manifest`.');
}

// Als CLI ausführen; beim Import aus dem Unit-Test (VITEST gesetzt) NICHT laufen.
if (!process.env.VITEST) void main();
