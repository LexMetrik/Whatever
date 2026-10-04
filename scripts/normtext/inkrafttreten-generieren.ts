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
//   npm run gen:inkrafttreten   (Netz, manuell; Runner: inkrafttreten-generieren-run.ts)
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
// Datum — auch SVG, FINMAG, KVG, MWSTG, die faktisch gestaffelt in Kraft traten;
// Fedlex setzt es auf EIN Datum der Teil-Liste). Das Feld `gestaffelt`
// (+ `gestaffeltGrund[]`, + `teilDaten[]` beim amtlichen Datums-Signal) ist darum ein
// EIGENES Kennzeichen mit fünf Signalen (Belege je Signal bei den Funktionen unten
// und in inkrafttreten-fedlex-datum.ts). Ein Erlass mit `gestaffelt: true` zeigt nie
// «Erlass in Kraft seit <Ur-Datum>» als Auskunft für einen einzelnen Artikel — das
// Ur-Datum gilt dort nur für einen Teil der Artikel.
// FAIL-CLOSED: nicht abrufbare/leere Zeitleiste, fehlendes Ur-Datum, nicht abrufbare
// Fedlex-XML ⇒ `gestaffelt: true`, Grund `unbekannt` (nie «nicht gestaffelt» aus
// Unwissen). Rest-Risiko, ehrlich: Erlasse OHNE «Datum des Inkrafttretens»-Absatz in
// der amtlichen Fassung (rund die Hälfte) hängen an Zeitleiste, Wortlaut und Fussnoten.
// §2/§0b: reine Erhebe-Funktion (deterministisch, injizierbare fetchImpl), getrennt
// vom Schreiben; kein Date.now() in der Erhebung.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sparqlBatch, sparqlSelect, type FetchImpl } from '../fedlex-sparql.ts';
import { fedlexInkrafttretensAngabe, ladeFedlexXml, type InkrafttretensAngabe } from './inkrafttreten-fedlex-datum.ts';

/** Abstract-ELI aus register.quelleUrl (…/eli/cc/…/de → cc/…). null = kein cc-ELI. */
function abstraktEli(quelleUrl: string): string | null {
  const m = quelleUrl.match(/\/eli\/(cc\/[^?#]+?)(?:\/(?:de|fr|it))?$/);
  return m ? m[1] : null;
}

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const REGISTER_JSON = resolve(wurzel, 'public/normtext/register.json');
export const INKRAFT_JSON = resolve(wurzel, 'public/normtext/inkrafttreten.json');

export type Inkrafttreten = { datum: string; quelle: 'fedlex' };
export type InkrafttretenMap = Record<string, Inkrafttreten>;

/** Gründe, aus denen ein Erlass als gestaffelt in Kraft getreten gilt (Union der Signale). */
export type StaffelGrund =
  | 'fedlex-zeitleiste'
  | 'wortlaut-hauptklausel'
  | 'fussnote-teildatum'
  | 'fussnote-inkraftsetzungs-v'
  | 'fedlex-inkrafttretensdatum'
  | 'unbekannt';
/** `teilDaten` (ISO, sortiert) nur beim Grund `fedlex-inkrafttretensdatum`: die in der amtlichen
 *  Fassung genannten verschiedenen Inkrafttretens-Daten (Beleg, offline im Test nachlesbar). */
export type Staffelung = { gestaffelt: boolean; gestaffeltGrund: StaffelGrund[]; teilDaten?: string[] };
/** Eintrag der Sidecar-Datei: `datum` fehlt, wenn kein EINDEUTIGES Ur-Datum vorliegt (§8). */
export type InkrafttretenEintrag = { datum?: string; quelle: 'fedlex' } & Staffelung;

export type ErlassBasis = {
  key: string; sr: string | null; ebene: string; status: string; quelleUrl: string;
  fassungsToken?: string; // register.fassungsToken — Fassung, auf die der Normtext gepinnt ist
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
 *  («am 1. Januar 2010») trennen nicht: ein Punkt nach einer Ziffer ist kein Satzende.
 *  Auch Abkürzungen vor einem Grossbuchstaben trennen nicht («Ziff. II», «Anhang Ziff. I»). */
function saetze(text: string): string[] {
  return text.split(/(?<=[^0-9.][.]|[;:])(?<!\b(?:Ziff|Art|Abs|Bst|Anh|Nr|lit|bzw|vgl|Buchst|Kap|ff)\.)\s+(?=[A-ZÄÖÜ])/);
}

/** Subjekt = der Erlass selbst («Dieses Gesetz», «Diese Verordnung», «Es», «Sie»). */
const SUBJEKT_ERLASS =
  /^(?:Dieses?|Diese[rn]?)\s+(?:[\wäöüÄÖÜ.-]+\s+){0,3}?(?:Gesetz|Verordnung|Abkommen|Übereinkommen|Beschluss|Reglement|Ordnung|Konkordat|Protokoll|Statut|Vertrag|Gesetzbuch|Verfassung|Bundesgesetz|Erlass)\b|^(?:Es|Sie)\s/;

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
  /\bunter Vorbehalt\b|\bvorbehältlich\b|\bmit Ausnahme\b|\bausgenommen\b|\beinzelne[rn]?\s+(?:Teile|Bestimmungen|Artikel|Absätze)\b|\bvorzeitig\b|\b(?:früheren|späteren)\s+Zeitpunkt\b|\babweichend\b|\bgestaffelt\b|\betappenweise\b/i;

/**
 * Signal b3 — Teil-Klausel NEBEN der Hauptklausel (Nachzug 2.10.2026, Befund 2):
 *  · Teil-Subjekt: «Artikel 2 Absätze 2 und 3 … treten nur im Falle … in Kraft»
 *    (BGFA Art. 37) — der Satz beginnt mit Artikel/Anhang/Ziffer/Abschnitt statt mit
 *    dem Erlass. Nennt derselbe Satz «diese Verordnung/dieses Gesetz» mit (VVV Art. 61:
 *    «Die Artikel 58–89 SVG und diese Verordnung treten am 1. Januar 1960 in Kraft»),
 *    ist es EIN gemeinsamer Tag und zählt nicht.
 *  · Bundesrat bestimmt das Inkrafttreten bestimmter Teile («… das Inkrafttreten der
 *    Artikel 34 Absatz 3 und 78 Absatz 4», MWSTG Art. 116 Abs. 2).
 * Nur im Inkrafttretens-Artikel (Hauptklausel/Randtitel) — sonst «Art. 5 tritt in Kraft»-
 * Sätze in beliebigen Artikeln.
 * Bewusst NICHT Signal: die blosse Ermächtigung im Satz mit Subjekt «Er» («Er kann einzelne
 * Teile … in einem späteren Zeitpunkt in Kraft setzen», ARG Art. 74) — sie belegt keine
 * Staffelung, und ARG trat an EINEM Tag in Kraft (Gegenprüfung 2.10.2026, ArG ⇒ false).
 */
const TEIL_SUBJEKT = /^(?:(?:Die|Der|Das)\s+)?(?:Artikel|Art\.|Anhang|Absätze?|Abs\.|Ziff\.|Ziffern?|Abschnitte?|Kapitel|Titel|Bestimmungen)\b/;
const ERLASS_IM_SATZ = /\b[Dd]iese[rs]?\s+(?:Verordnung|Gesetz|Bundesgesetz|Beschluss|Reglement|Ordnung|Erlass)\b/;
const BR_TEIL = /^Der Bundesrat bestimmt das Inkrafttreten (?:der|von|des)\s+(?:Artikel|Art\.|Absätze?|Abs\.|Anhang|Ziff|Bestimmungen|Abschnitte?)/;

function istTeilKlauselSatz(satz: string): boolean {
  if (BR_TEIL.test(satz)) return true;
  return TEIL_SUBJEKT.test(satz) && !ERLASS_IM_SATZ.test(satz) && /\b(?:tritt|treten)\b.{0,240}?\bin Kraft\b/.test(satz);
}

/**
 * «unter Vorbehalt von Absatz N» in der Hauptklausel meint, wo derselbe Artikel einen
 * Referendums-Absatz trägt («Wird das Referendum ergriffen …»), den REFERENDUMSFALL
 * (MWSTG Art. 116 Abs. 2/3, FAMZG Art. 29) — ein anderer Zeitpunkt, kein Teil-
 * Inkrafttreten. Dieser Vorbehalt allein ist darum kein Signal; die Staffelung dieser
 * Erlasse trägt die Teil-Klausel (Signal b3) bzw. die Fussnote. Entscheid 2.10.2026,
 * Gegenprüfung Befund 2 (MWSTG).
 */
const REFERENDUM_ABSATZ = /Referendum ergriffen/;
const VORBEHALT_ABSATZ = /\bunter Vorbehalt von Absatz\s+\d+[a-z]*/gi;

export function hatWortlautHauptklausel(artikel: ArtikelSicht[]): boolean {
  return artikel.some((a) => {
    if (!HAUPTTEXT.test(a.id)) return false;
    const ss = saetze(a.text);
    const ohneRef = (s: string) => (REFERENDUM_ABSATZ.test(a.text) ? s.replace(VORBEHALT_ABSATZ, '') : s);
    const klauselMitVorbehalt = ss.some((s) => /\bin Kraft\b/.test(s) && VORBEHALT_AUSNAHME.test(ohneRef(s))
      && (SUBJEKT_ERLASS.test(s) || /^Der Bundesrat /.test(s)));
    return klauselMitVorbehalt || (istInkrafttretensArtikel(a) && ss.some(istTeilKlauselSatz));
  });
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

/** Reine Auswertung: Staffel-Entscheid je Erlass (Zeitleiste + amtliche Datumsangabe + Wortlaut + Fussnoten). */
export function staffelEntscheid(i: {
  urDatum: string | null;        // eindeutiges dateEntryInForce oder null
  zeitleisteErste: string | null; // früheste Konsolidierung oder null (unbelegt)
  fedlexAngabe: InkrafttretensAngabe | null; // «Datum des Inkrafttretens» aus der Fedlex-XML; null = Quelle nicht abrufbar
  artikel: ArtikelSicht[] | null; // null = Normtext nicht lesbar
}): Staffelung {
  const gruende: StaffelGrund[] = [];
  let unbekannt = false;
  let teilDaten: string[] | undefined;
  if (i.urDatum === null || i.zeitleisteErste === null) unbekannt = true;
  else if (i.zeitleisteErste < i.urDatum) gruende.push('fedlex-zeitleiste');
  // Signal e: mehr als EIN verschiedenes Datum in der amtlichen Angabe ⇒ gestaffelt. Angabe ohne
  // lesbares Datum oder nicht abrufbare Quelle ⇒ fail-closed. Fehlende Angabe = keine Aussage.
  if (i.fedlexAngabe === null || (i.fedlexAngabe.vorhanden && i.fedlexAngabe.daten.length === 0)) unbekannt = true;
  else if (i.fedlexAngabe.daten.length > 1) {
    gruende.push('fedlex-inkrafttretensdatum');
    teilDaten = i.fedlexAngabe.daten;
  }
  if (i.artikel === null) unbekannt = true;
  else {
    if (hatWortlautHauptklausel(i.artikel)) gruende.push('wortlaut-hauptklausel');
    gruende.push(...fussnoteGruende(i.artikel));
  }
  // Fail-closed: «unbekannt» nur, wenn KEIN positives Signal den Erlass schon als
  // gestaffelt ausweist (die Gründe bleiben dann sachlich, nicht Unwissen).
  if (unbekannt && gruende.length === 0) gruende.push('unbekannt');
  return { gestaffelt: gruende.length > 0, gestaffeltGrund: gruende, ...(teilDaten ? { teilDaten } : {}) };
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

/** Fedlex-XML je Erlass; ohne Fassungstoken/ELI gibt es keine gepinnte Quelle ⇒ null (fail-closed). */
async function ladeXmlJeErlass(bund: ErlassBasis[], fetchImpl: FetchImpl): Promise<Map<string, string | null>> {
  const quellen = bund.flatMap((e) => {
    const eli = abstraktEli(e.quelleUrl);
    return eli && e.fassungsToken ? [{ key: e.key, eli, token: e.fassungsToken }] : [];
  });
  return ladeFedlexXml(quellen, fetchImpl);
}

/** Staffelung aller Bund-Erlasse (Zeitleiste per SPARQL, Datumsangabe aus der Fedlex-XML, Rest aus den lokalen Shards). */
export async function bundStaffelung(
  bund: ErlassBasis[], urDaten: InkrafttretenMap, fetchImpl: FetchImpl,
  ladeArtikel: (key: string) => ArtikelSicht[] | null = ladeArtikelSichten,
  ladeXml: (bund: ErlassBasis[]) => Promise<Map<string, string | null>> = (b) => ladeXmlJeErlass(b, fetchImpl),
): Promise<Record<string, Staffelung>> {
  const xmlMap = await ladeXml(bund);
  const elis = [...new Set(bund.map((e) => abstraktEli(e.quelleUrl)).filter((x): x is string => x !== null))];
  const beginn = elis.length ? await zeitleisteBeginn(elis, fetchImpl) : new Map<string, string>();
  const out: Record<string, Staffelung> = {};
  for (const e of bund) {
    const eli = abstraktEli(e.quelleUrl);
    out[e.key] = staffelEntscheid({
      urDatum: urDaten[e.key]?.datum ?? null,
      zeitleisteErste: eli ? beginn.get(eli) ?? null : null,
      fedlexAngabe: xmlMap.get(e.key) != null ? fedlexInkrafttretensAngabe(xmlMap.get(e.key)!) : null,
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
