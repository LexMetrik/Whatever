// scripts/normtext/revisionen-auswirkungen.ts
// Pfad (c) des Revisionen-Generators (S6-D1, W2·29-WERKBANK-LESER, 23.9.2026): Fedlex-
// Rechtsanalyse «Auswirkungen» (LegalResourceImpact) je gepinntem Abstract, Geltungsfenster
// und Stammdaten der ändernden Erlasse. Aus revisionen-generieren.ts ausgelagert (§6.6,
// Schwelle 800 Z.); Herleitung, Messreihen und Fehlerklassen stehen im Kopf dort und an den
// einzelnen Funktionen hier. Reine Funktionen + Netz-Abfragen, kein Writer.
import { sparqlBatch, sparqlSelect, type FetchImpl } from '../fedlex-sparql.ts';

export const LANG = {
  de: '<http://publications.europa.eu/resource/authority/language/DEU>',
  fr: '<http://publications.europa.eu/resource/authority/language/FRA>',
  it: '<http://publications.europa.eu/resource/authority/language/ITA>',
};

/**
 * Pfad (c): Fedlex-Auswirkungs-Typen (`https://fedlex.data.admin.ch/vocabulary/impact-type/<n>`,
 * `skos:prefLabel`@de live gelesen 23.9.2026) → stabiler Schlüssel. Feste Reihenfolge = Anzeige-
 * und Sortier-Reihenfolge. Nur die im Korpus beobachteten Typen (Vollerhebung 23.9.2026 über
 * 231 Abstracts, 15 515 Auswirkungen: 1, 2, 3, 5, 6, 7, 9, 12, 27, 30). Ein UNBEKANNTER Typ
 * bricht den Lauf ab (`wirkungAusTyp` wirft) — nie still einsortieren (§7, §6.7).
 */
export const WIRKUNGEN = [
  'aenderung', 'aufhebung', 'vollstaendige-aufhebung', 'inkrafttreten', 'teilinkraftsetzung',
  'berichtigung', 'genehmigung', 'verlaengerung', 'geltungsbereich', 'zweite-fundstelle',
] as const;
export type Wirkung = typeof WIRKUNGEN[number];
const WIRKUNG_NACH_TYP: ReadonlyMap<number, Wirkung> = new Map([
  [1, 'aenderung'], // «Änderung»
  [2, 'aufhebung'], // «Aufhebung»
  [3, 'genehmigung'], // «Genehmigung»
  [5, 'inkrafttreten'], // «Inkrafttreten»
  [6, 'berichtigung'], // «Berichtigung»
  [7, 'verlaengerung'], // «Verlängerung»
  [9, 'geltungsbereich'], // «Geltungsbereich»
  [12, 'zweite-fundstelle'], // «2. Fundstelle»
  [27, 'vollstaendige-aufhebung'], // «Vollständige Aufhebung»
  [30, 'teilinkraftsetzung'], // «Teilinkraftsetzung»
]);
export function wirkungAusTyp(typ: number): Wirkung {
  const w = WIRKUNG_NACH_TYP.get(typ);
  if (!w) throw new Error(`Unbekannter Fedlex-Auswirkungs-Typ impact-type/${typ} — erst in WIRKUNG_NACH_TYP abbilden (§7).`);
  return w;
}

/** Eine Auswirkung (Pfad c) auf das gepinnte Abstract, reduziert auf den ändernden Erlass. */
export interface AuswirkungZeile {
  /** oc-URI des ändernden Erlasses (voll, `https://fedlex.data.admin.ch/eli/oc/<jahr>/<nr>`). */
  oc: string;
  /** Fedlex impact-type-Nummer. */
  typ: number;
  /** `legalResourceImpactHasDateEntryInForce` ISO; fehlt bei undatierten Auswirkungen. */
  datum?: string;
  /** Datum der Fassung, die Fedlex als einarbeitend nennt (`jolux:impactConsolidatedBy`,
   *  `…/<YYYYMMDD>`), ISO; fehlt bei noch nicht konsolidierten Auswirkungen. */
  fassung?: string;
}

/** Stammdaten eines oc-Erlasses, den nur Pfad (c) kennt (Pfad (b) liefert sie selbst). */
export interface OcStamm {
  dateForce?: string; dateDoc?: string; roId?: string; titelDe?: string; titelFr?: string; titelIt?: string;
}

/**
 * Pfad (c) + Geltungsfenster eines Erlasses (alles aus dem amtlichen Graphen am gepinnten
 * Abstract, im store-raw persistiert → `check:revisionen` baut offline nach).
 */
export interface RevisionsKontext {
  /** Gepinntes Abstract, z. B. `cc/27/317_321_377` (Marker-Link AE-2). */
  abstractEli: string;
  /** `jolux:basicAct` des Abstracts = Stammerlass — nie ein Eintrag (AE-3). */
  basicAct?: string;
  /** `jolux:dateEntryInForce` des Abstracts (Ur-Inkrafttreten des geltenden Erlasses). */
  inkrafttreten?: string;
  /** `jolux:dateNoLongerInForce` des Abstracts (aufgehobener Erlass, z. B. BMV 2026-03-01). */
  aufhebung?: string;
  auswirkungen: AuswirkungZeile[];
  /** Stammdaten je oc, das NUR aus Pfad (c) stammt. */
  ocStamm: Readonly<Record<string, OcStamm>>;
}

/**
 * Inkrafttretensdatum einer Auswirkung (Pfad c). Fedlex' Alt-Bestand (Informationsquelle
 * «data-from-geschaeftsstaende») trägt als `legalResourceImpactHasDateEntryInForce` teils das
 * BESCHLUSSDATUM des ändernden Erlasses. Messung 23.9.2026 über alle 7509 Einträge: 131
 * Auswirkungsdaten liegen VOR dem eigenen `dateEntryInForce` des ändernden Erlasses, 81 davon
 * sind exakt dessen `dateDocument` — z. B. ZPO ← AS 2010 281 (oc/2010/37): Auswirkung
 * «2009-09-25» = Beschluss, der Erlass trat am 2010-02-01 in Kraft; AHVG ← AS 2019 2395
 * (STAF): «2018-09-28» = Schlussabstimmung. Ein Beschlussdatum ist kein Inkrafttreten (§1).
 * Regel (deterministisch, eng): NUR wenn Auswirkungsdatum == `dateDocument` UND <
 * `dateEntryInForce` des ändernden Erlasses UND das Abstract an diesem Datum KEINE Fassung
 * hat (Pfad a), gilt dessen `dateEntryInForce`. Die Fassungs-Bedingung ist gemessen, nicht
 * vorsorglich: an 4 Fällen besteht am Beschlussdatum eine amtliche Fassung, das Datum ist
 * dort also echt (AVG ← AS 2018 223 Berichtigung, Fassung 2018-04-17; AVIV ← oc/2020/524,
 * Fassung 2020-07-01; KLV ← oc/2018/432; KVV ← oc/2012/61) — ohne sie wurden daraus 4
 * falsche Marker. Die übrigen 50 frühen Daten (z. B. rückwirkende Inkraftsetzung AVIG ←
 * AS 2021 153, 2021-01-01 vor 2021-03-20) bleiben unangetastet — Fedlex bleibt Quelle (§7).
 */
export function inkrafttretenDerAuswirkung(
  datum: string, oc?: { dateForce?: string; dateDoc?: string }, fassungsDaten: ReadonlySet<string> = new Set(),
): string {
  const beschluss = oc?.dateDoc?.slice(0, 10);
  const eigen = oc?.dateForce?.slice(0, 10);
  return beschluss && eigen && datum === beschluss && datum < eigen && !fassungsDaten.has(datum) ? eigen : datum;
}

/** Fedlex-Web-Adresse der Fassung eines Abstracts an einem Datum (Repo-Form, s.
 *  `fassungsLink` in src/pages/gesetz-leser/zukunftsfassungen.ts; AE-2). */
export function fassungsUrl(abstractEli: string, datumIso: string): string {
  if (!/^cc\/[0-9a-z_/]+$/.test(abstractEli) || !/^\d{4}-\d{2}-\d{2}$/.test(datumIso)) {
    throw new Error(`fassungsUrl: ungültiges Abstract «${abstractEli}» oder Datum «${datumIso}».`);
  }
  return `https://www.fedlex.admin.ch/eli/${abstractEli}/${datumIso.replace(/-/g, '')}/de`;
}

/** oc-Wurzel aus einer Auswirkungs-Quelle (`…/eli/oc/2020/746/lvl_I` → `…/eli/oc/2020/746`);
 *  `undefined` für alles, was nicht unter `eli/oc/` liegt (nie raten). */
export function ocWurzel(uri: string): string | undefined {
  return /^(https:\/\/fedlex\.data\.admin\.ch\/eli\/oc\/[^/]+\/[^/]+)/.exec(uri)?.[1];
}

// ── Pfad (c): Rechtsanalyse «Auswirkungen» + Geltungsfenster je Abstract ────────────
// WAF-FALLE (live 23.9.2026): der Endpunkt steht hinter einer Web-Application-Firewall
// des BIT, die SQL-ähnliche Abfragen mit HTTP 400 + HTML-Seite «Web Page Blocked!»
// abweist. Ausgelöst hat es eine Variable `?from` direkt nach `SELECT DISTINCT` (liest
// sich wie SQL `SELECT DISTINCT … FROM … WHERE`); dieselbe Abfrage mit `?quelle` läuft.
// Darum heissen die Variablen hier nie `?from`/`?select`/`?where`.
const B_ELI = 'https://fedlex.data.admin.ch/eli/';
/** Ergebnis-Obergrenze, ab der ein Batch als möglicherweise gekappt gilt (Skill
 *  `scraping-swiss-official-sources`, Falle 4: Teilresultate sehen vollständig aus). */
const KAPPUNG_VERDACHT = 10000;

/** Geltungsfenster + Stammerlass je Abstract (`cc/…`). */
export async function holeAbstractStamm(
  abstractElis: readonly string[], fetchImpl: FetchImpl = fetch,
): Promise<Map<string, { basicAct?: string; inkrafttreten?: string; aufhebung?: string }>> {
  const werte = [...new Set(abstractElis)].map((a) => `<${B_ELI}${a}>`);
  const bindings = await sparqlBatch(werte, (v) => `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?abs ?basic ?inkraft ?aufgehoben WHERE { VALUES ?abs { ${v} }
  OPTIONAL { ?abs jolux:basicAct ?basic . }
  OPTIONAL { ?abs jolux:dateEntryInForce ?inkraft . }
  OPTIONAL { ?abs jolux:dateNoLongerInForce ?aufgehoben . } }`, { batchGroesse: 40, fetchImpl });
  const out = new Map<string, { basicAct?: string; inkrafttreten?: string; aufhebung?: string }>();
  for (const b of bindings) {
    const abs = b.abs?.value?.slice(B_ELI.length);
    if (!abs) continue;
    const e = out.get(abs) ?? {};
    // Deterministisch bei Mehrfachwerten: kleinster Wert (lexikografisch/ISO).
    const min = (alt: string | undefined, neu: string | undefined) => (neu && (!alt || neu < alt) ? neu : alt);
    e.basicAct = min(e.basicAct, b.basic?.value);
    e.inkrafttreten = min(e.inkrafttreten, b.inkraft?.value?.slice(0, 10));
    e.aufhebung = min(e.aufhebung, b.aufgehoben?.value?.slice(0, 10));
    out.set(abs, e);
  }
  return out;
}

/** Alle Auswirkungen auf Teile der Abstracts (Batch ≤ 5 Abstracts; OR allein 997 Zeilen). */
export async function holeAuswirkungen(
  abstractElis: readonly string[], fetchImpl: FetchImpl = fetch,
): Promise<Map<string, AuswirkungZeile[]>> {
  const werte = [...new Set(abstractElis)].sort().map((a) => `<${B_ELI}${a}>`);
  const out = new Map<string, AuswirkungZeile[]>();
  for (let i = 0; i < werte.length; i += 5) {
    const teil = werte.slice(i, i + 5);
    const bindings = await sparqlSelect(`PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?abs ?ausw ?quelle ?typ ?datum ?fassung WHERE { VALUES ?abs { ${teil.join(' ')} }
  ?ziel jolux:legalResourceSubdivisionIsPartOf ?abs .
  ?ausw jolux:impactToLegalResource ?ziel ; jolux:impactFromLegalResource ?quelle ; jolux:legalResourceImpactHasType ?typ .
  OPTIONAL { ?ausw jolux:legalResourceImpactHasDateEntryInForce ?datum . }
  OPTIONAL { ?ausw jolux:impactConsolidatedBy ?fassung . } }`, fetchImpl);
    if (bindings.length >= KAPPUNG_VERDACHT) {
      throw new Error(`holeAuswirkungen: ${bindings.length} Zeilen in einem Batch — Kappungsverdacht, kleiner batchen.`);
    }
    for (const b of bindings) {
      const abs = b.abs?.value?.slice(B_ELI.length);
      const oc = ocWurzel(b.quelle?.value ?? '');
      const typ = Number(/impact-type\/(\d+)$/.exec(b.typ?.value ?? '')?.[1]);
      if (!abs || !oc || !Number.isInteger(typ)) continue;
      const arr = out.get(abs) ?? [];
      const f = /\/(\d{4})(\d{2})(\d{2})$/.exec(b.fassung?.value ?? '');
      const zeile: AuswirkungZeile = { oc, typ, datum: b.datum?.value?.slice(0, 10) };
      if (f) zeile.fassung = `${f[1]}-${f[2]}-${f[3]}`;
      arr.push(zeile);
      out.set(abs, arr);
    }
  }
  // Deterministisch (§2): Duplikate (dieselbe Auswirkung je Sprache/Teil) weg, sortiert.
  for (const [abs, arr] of out) {
    const seen = new Set<string>();
    const schluessel = (a: AuswirkungZeile) => `${a.oc}|${String(a.typ).padStart(3, '0')}|${a.datum ?? ''}|${a.fassung ?? ''}`;
    const uniq = arr.filter((a) => { const k = schluessel(a); if (seen.has(k)) return false; seen.add(k); return true; });
    uniq.sort((x, y) => (schluessel(x) < schluessel(y) ? -1 : schluessel(x) > schluessel(y) ? 1 : 0));
    out.set(abs, uniq);
  }
  return out;
}

/** Stammdaten (Datum, Fundstelle, Titel) für oc, die nur Pfad (c) kennt. */
export async function holeOcStamm(ocUris: readonly string[], fetchImpl: FetchImpl = fetch): Promise<Map<string, OcStamm>> {
  const werte = [...new Set(ocUris)].sort().map((u) => `<${u}>`);
  const bindings = await sparqlBatch(werte, (v) => `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT ?oc ?dateForce ?dateDoc ?roId ?titleDe ?titleFr ?titleIt WHERE { VALUES ?oc { ${v} }
  OPTIONAL { ?oc jolux:dateEntryInForce ?dateForce . }
  OPTIONAL { ?oc jolux:dateDocument ?dateDoc . }
  OPTIONAL { ?oc <http://cogni.internal.system/model#historicalId> ?roId . }
  OPTIONAL { ?oc jolux:isRealizedBy ?ede . ?ede jolux:language ${LANG.de} ; jolux:title ?titleDe . }
  OPTIONAL { ?oc jolux:isRealizedBy ?efr . ?efr jolux:language ${LANG.fr} ; jolux:title ?titleFr . }
  OPTIONAL { ?oc jolux:isRealizedBy ?eit . ?eit jolux:language ${LANG.it} ; jolux:title ?titleIt . } }`, { batchGroesse: 40, fetchImpl });
  const out = new Map<string, OcStamm>();
  // Deterministisch bei Mehrfachwerten: min dateForce, sonst kleinster Wert je Feld.
  const min = (alt: string | undefined, neu: string | undefined) => (neu && (!alt || neu < alt) ? neu : alt);
  for (const b of bindings) {
    const oc = b.oc?.value;
    if (!oc) continue;
    const s = out.get(oc) ?? {};
    s.dateForce = min(s.dateForce, b.dateForce?.value?.slice(0, 10));
    s.dateDoc = min(s.dateDoc, b.dateDoc?.value);
    s.roId = min(s.roId, b.roId?.value);
    s.titelDe = min(s.titelDe, b.titleDe?.value);
    s.titelFr = min(s.titelFr, b.titleFr?.value);
    s.titelIt = min(s.titelIt, b.titleIt?.value);
    out.set(oc, s);
  }
  return out;
}
